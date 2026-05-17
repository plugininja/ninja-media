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
        add_filter('wp_prepare_attachment_for_js', [$this, 'prepareAttachmentForJs'], 99, 3);
        add_filter('wp_calculate_image_srcset', [$this, 'calculateImageSrcset'], 10, 5);
        add_filter('upload_size_limit', [$this, 'filterUploadSizeLimit']);
        add_filter('wp_handle_upload_prefilter', [$this, 'enforceUploadSizeLimit']);
        add_filter('plupload_default_settings', [$this, 'filterPluploadSettings']);
        add_filter('big_image_size_threshold', [$this, 'filterBigImageThreshold']);
        add_action('wp_handle_upload', [$this, 'boostMemoryForImageUpload']);
        add_action('save_post', [$this, 'syncUsageFlagsOnPostSave'], 20, 1);
        add_action('deleted_post', [$this, 'syncUsageFlagsOnPostSave'], 20, 1);

        add_action('pre_get_posts', [$this, 'filterGridAttachments']);
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
     * Re-syncs _pnpnm_media_used flags for all attachments referenced in the saved/deleted post.
     * Covers featured image, inline wp-image-{id} class, and file path/URL occurrences.
     */
    public function syncUsageFlagsOnPostSave(int $postId): void
    {
        $post = get_post($postId);

        if (!$post || $post->post_type === 'attachment' || $post->post_type === 'revision') {
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

        preg_match_all('/"([^"]+)"/', $post->post_content ?? '', $url_matches);
        foreach ($url_matches[1] ?? [] as $candidate) {
            $id = attachment_url_to_postid($candidate);
            if ($id > 0) {
                $attachment_ids[] = $id;
            }
        }

        foreach (array_unique(array_filter($attachment_ids)) as $attachment_id) {
            BaseModel::syncUsageFlag($attachment_id);
        }
    }

    public function calculateImageSrcset($sources, $size_array, $image_src, $image_meta, $attachment_id)
    {
        if (empty($image_meta['pnpnm_media']) || empty($sources)) {
            return $sources;
        }

        $image_basename = basename($image_src);
        $new_sources    = [];

        foreach ($sources as $size => $source) {
            if (empty($source['url'])) {
                continue;
            }

            $srcset_basename = basename($source['url']);

            $new_sources[$size] = [
                'url'        => str_replace($image_basename, $srcset_basename, $image_src),
                'descriptor' => $source['descriptor'],
                'value'      => $source['value'],
            ];
        }

        return $new_sources ?: $sources;
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

    public function prepareAttachmentForJs($response, $attachment, $meta)
    {
            if (empty($meta['folderId'])) {
                return $response;
            }
    
            $response['pnpnm_media'] = $meta['folderId'];
    
            return $response;
        
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
