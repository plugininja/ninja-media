<?php
/**
 * Class MediaLibrary
 *
 * @package Pninja\NM
 * @license GPL-2.0-or-later
 */
namespace Pninja\NM;

use Pninja\NM\Models\BaseModel;
use Pninja\NM\Utils\Helpers;
use Pninja\NM\Utils\Singleton;

defined('ABSPATH') || exit('No direct script access allowed');

class MediaLibrary
{
    use Singleton;

    public function doHooks()
    {
        add_filter('pnpnm_localize_data', [$this, 'localizeData'], 10, 2);
        add_filter('upload_size_limit', [$this, 'filterUploadSizeLimit']);
        add_filter('wp_handle_upload_prefilter', [$this, 'enforceUploadSizeLimit']);
        add_filter('plupload_default_settings', [$this, 'filterPluploadSettings']);
        add_filter('big_image_size_threshold', [$this, 'filterBigImageThreshold']);
        add_filter('ajax_query_attachments_args', [$this, 'filterAttachmentsPerPage']);
        add_action('wp_handle_upload', [$this, 'boostMemoryForImageUpload']);
        add_action('pre_get_posts', [$this, 'filterGridAttachments']);
        add_action('save_post', [$this, 'markAttachmentsUsedOnPostSave'], 20, 1);

        if (!get_option('pnpnm_repaired_attachment_folder_meta')) {
            add_action('admin_init', [$this, 'repairAttachmentFolderMeta']);
        }
    }

    public function filterBigImageThreshold(int $threshold): int
    {
        if (!Helpers::getSetting('general.files.controlBigImageSize', false)) {
            return $threshold;
        }

        $setting = (int) Helpers::getSetting('general.files.bigImageSize', 2560);

        return $setting > 0 ? $setting : $threshold;
    }

    public function boostMemoryForImageUpload(array $file): array
    {
        $type = $file['type'] ?? '';

        if (strpos($type, 'image/') === 0) {
            wp_raise_memory_limit('image');
        }

        return $file;
    }

    public function filterUploadSizeLimit(int $bytes): int
    {
        $limitBytes = $this->getCustomUploadLimitBytes();
        return $limitBytes !== null ? $limitBytes : $bytes;
    }

    public function enforceUploadSizeLimit(array $file): array
    {
        $limitBytes = $this->getCustomUploadLimitBytes();

        if ($limitBytes === null) {
            return $file;
        }

        if (isset($file['size']) && (int) $file['size'] > $limitBytes) {
            $file['error'] = sprintf(
                /* translators: 1: file size, 2: allowed size */
                __('This file is %1$s. Files must be smaller than %2$s.', 'ninja-media'),
                size_format($file['size']),
                size_format($limitBytes)
            );
        }

        return $file;
    }

    public function filterPluploadSettings(array $settings): array
    {
        $limitBytes = $this->getCustomUploadLimitBytes();

        if ($limitBytes !== null) {
            $settings['filters']['max_file_size'] = $limitBytes . 'b';
        }

        return $settings;
    }

    private function getCustomUploadLimitBytes(): ?int
    {
        if (!Helpers::getSetting('general.files.controlUploadSize', false)) {
            return null;
        }

        $customMb = (int) Helpers::getSetting('general.files.uploadSize', 20);

        return $customMb > 0 ? $customMb * MB_IN_BYTES : null;
    }

    /**
     * Marks attachments referenced in the saved post as used.
     * Only sets the flag — never clears it, keeping this O(attachments-in-post).
     */
    public function markAttachmentsUsedOnPostSave(int $postId): void
    {
        // Skip on regular frontend page renders. Some plugins (view counters, stock
        // updates) call wp_update_post() during page loads, firing save_post without
        // an actual editorial save. Tracking attachment usage there is unnecessary
        // and adds memory pressure from update_post_meta + wp_cache_set per attachment.
        if (!is_admin() && !wp_doing_ajax() && !wp_doing_cron() && !(defined('REST_REQUEST') && REST_REQUEST)) {
            return;
        }

        $post = get_post($postId);

        if (!$post || $post->post_type === 'attachment' || $post->post_type === 'revision') {
            return;
        }

        // Skip post types that cannot embed images — avoids overhead during WooCommerce
        // order/analytics imports which trigger save_post thousands of times.
        if (!post_type_supports($post->post_type, 'thumbnail') && !post_type_supports($post->post_type, 'editor')) {
            return;
        }

        $attachment_ids = [];

        $thumbnail_id = (int) get_post_meta($postId, '_thumbnail_id', true);
        if ($thumbnail_id > 0) {
            $attachment_ids[] = $thumbnail_id;
        }

        preg_match_all('/wp-image-(\d+)/', $post->post_content ?? '', $class_matches);
        foreach (array_map('absint', $class_matches[1] ?? []) as $id) {
            $attachment_ids[] = $id;
        }

        foreach (array_unique(array_filter($attachment_ids)) as $attachment_id) {
            update_post_meta($attachment_id, '_pnpnm_media_used', '1');
        }
    }

    public function filterAttachmentsPerPage(array $query): array
    {
        $per_page = (int) Helpers::getSetting('display.settings.perPage', 80);

        if ($per_page > 0) {
            $query['posts_per_page'] = $per_page;
        }

        return $query;
    }

    public function filterGridAttachments($query)
    {
        if (!wp_doing_ajax()) {
            return;
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- WordPress core verifies nonce for query-attachments action
        $action = isset($_REQUEST['action']) ? sanitize_text_field(wp_unslash($_REQUEST['action'])) : '';
        if ($action !== 'query-attachments') {
            return;
        }

        $perPage = Helpers::getSetting('display.settings.perPage', 80);
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- WordPress core verifies nonce for query-attachments action
        $paged   = isset($_REQUEST['query']['paged']) ? max(1, absint($_REQUEST['query']['paged'])) : 1;

        $query->set('posts_per_page', $perPage);
        $query->set('paged', $paged);

        
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- WordPress core verifies nonce for query-attachments action
        $folder_id_raw = isset($_REQUEST['query']['folderId']) ? sanitize_text_field(wp_unslash($_REQUEST['query']['folderId'])) : '';
        if (empty($folder_id_raw)) {
            return;
        }

        if ($folder_id_raw === 'uncategorized') {
            $query->set('post_status', 'inherit');
            $query->set('meta_query', [
                [
                    'key'     => '_pnpnm_media_folder_id',
                    'compare' => 'NOT EXISTS',
                ],
                [
                    'key'     => '_pnpnm_media_trashed',
                    'compare' => 'NOT EXISTS',
                ],
            ]);
            return;
        }

        if ( $folder_id_raw === 'used' ) {
            $query->set('post_status', 'inherit');
            $query->set('meta_query', [
                [
                    'key'     => '_pnpnm_media_used',
                    'compare' => 'EXISTS',
                ],
                [
                    'key'     => '_pnpnm_media_trashed',
                    'compare' => 'NOT EXISTS',
                ],
            ]);
            return;
        }   

        if ( $folder_id_raw === 'unused' ) {
            $query->set('post_status', 'inherit');
            $query->set('meta_query', [
                [
                    'key'     => '_pnpnm_media_used',
                    'compare' => 'NOT EXISTS',
                ],
                [
                    'key'     => '_pnpnm_media_trashed',
                    'compare' => 'NOT EXISTS',
                ],
            ]);
            return;
        }

        $folder_id = absint($folder_id_raw);
        if (empty($folder_id)) {
            return;
        }

        $query->set('post_status', 'inherit');
        $query->set('meta_query', [
            'relation' => 'AND',
            [
                'key'     => '_pnpnm_media_folder_id',
                'value'   => $folder_id,
                'type'    => 'NUMERIC',
                'compare' => '=',
            ],
            [
                'key'     => '_pnpnm_media_trashed',
                'compare' => 'NOT EXISTS',
            ],
        ]);
    }

    /**
     * One-time repair: removes the stale `folderId` key that was incorrectly written
     * into `_wp_attachment_metadata` by an earlier version of the plugin. For attachments
     * whose metadata was fully replaced with only `['folderId' => x]`, the metadata is
     * regenerated from the original file so width/height/sizes are restored.
     */
    public function repairAttachmentFolderMeta(): void
    {
        global $wpdb;

        // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- one-time repair, no cache needed
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT post_id, meta_value FROM {$wpdb->postmeta}
                 WHERE meta_key = %s AND meta_value LIKE %s",
                '_wp_attachment_metadata',
                '%' . $wpdb->esc_like('folderId') . '%'
            )
        );
        // phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

        if (!empty($rows)) {
            if (!function_exists('wp_generate_attachment_metadata')) {
                require_once ABSPATH . 'wp-admin/includes/image.php';
            }

            foreach ($rows as $row) {
                $meta = maybe_unserialize($row->meta_value);

                if (!is_array($meta) || !isset($meta['folderId'])) {
                    continue;
                }

                unset($meta['folderId']);

                if (empty($meta)) {
                    $file = get_attached_file((int) $row->post_id);
                    if ($file && file_exists($file)) {
                        $regenerated = wp_generate_attachment_metadata((int) $row->post_id, $file);
                        if (!empty($regenerated)) {
                            wp_update_attachment_metadata((int) $row->post_id, $regenerated);
                            continue;
                        }
                    }
                }

                update_post_meta((int) $row->post_id, '_wp_attachment_metadata', $meta);
            }
        }

        update_option('pnpnm_repaired_attachment_folder_meta', '1');
    }

    public function localizeData(array $data, $script): array
    {
        if ($script !== 'admin') {
            return $data;
        }

        global $pagenow;

        $data['pagenow']       = $pagenow;
        $data['perPage']        = (int) Helpers::getSetting('display.settings.perPage', 80);
        $data['maxUploadSize']  = pnpnmMaxUploadFileSize();
        // $data['thumbnailSize']  = $this->getThumbnailSizeData();

        return $data;
    }
}
