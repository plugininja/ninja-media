<?php

namespace Pninja\NM;

use Pninja\NM\Utils\Singleton;

defined('ABSPATH') || exit('No direct script access allowed');

class MediaEventListener
{
    use Singleton;
    private const TRACKED = [
        'updated_post_meta' => [
            '_pnpnm_media_folder_id',
            '_wp_attachment_metadata',
            '_wp_attachment_image_alt',
            '_wp_attachment_caption',
            '_wp_attachment_description',
            '_wp_attachment_title',
            '_wp_attached_file',
            '_wp_attachment_url',
            '_wp_attachment_video_alt',
            '_wp_attachment_video_caption',
            '_wp_attachment_video_description',
            '_wp_attachment_video_title',
            '_wp_attachment_audio_alt',
            '_wp_attachment_audio_caption',
            '_wp_attachment_audio_description',
            '_wp_attachment_audio_title',
            '_wp_attachment_is_custom_header',
        ],
        'added_post_meta' => [
            '_pnpnm_media_folder_id',
        ],
        'deleted_post_meta' => [
        ],
    ];

    private array $tracked;

    private bool $touching = false;

    public function __construct()
    {
        $this->tracked = self::TRACKED;

        add_action('updated_post_meta', [$this, 'onMetaUpdatedOrAdded'], 10, 3);
        add_action('added_post_meta', [$this, 'onMetaUpdatedOrAdded'], 10, 3);
        add_action('deleted_post_meta', [$this, 'onMetaDeleted'], 10, 3);
    }

    public function addFavoriteStatus__premium_only(array $response, \WP_Post $attachment): array
    {
        $meta_key               = '_pnpnm_favorite_' . get_current_user_id();
        $response['isFavorite'] = '1' === get_post_meta($attachment->ID, $meta_key, true);

        return $response;
    }

    public function addWatermarkStatus__premium_only(array $response, \WP_Post $attachment): array
    {
        $response['isWatermarked'] = '1' === get_post_meta($attachment->ID, '_pnpnm_watermarked', true);

        return $response;
    }

    public function onMetaUpdatedOrAdded(int $metaId, int $objectId, string $metaKey): void
    {
        $hook = current_filter();

        if (
            $this->touching
            || !isset($this->tracked[$hook])
            || !in_array($metaKey, $this->tracked[$hook], true)
            || !$this->isAttachment($objectId)
        ) {
            return;
        }

        $this->touchAttachment($objectId);
    }

    public function onMetaDeleted(array $metaIds, int $objectId, string $metaKey): void
    {
        if (
            $this->touching
            || !in_array($metaKey, $this->tracked['deleted_post_meta'], true)
            || !$this->isAttachment($objectId)
        ) {
            return;
        }

        $this->touchAttachment($objectId);
    }

    private function isAttachment(int $postId): bool
    {
        return 'attachment' === get_post_type($postId);
    }

    private function touchAttachment(int $attachmentId): void
    {
        global $wpdb;

        $this->touching = true;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- direct update needed to touch the post timestamp without triggering save hooks; cache cleared via clean_post_cache() below.
        $wpdb->update(
            $wpdb->posts,
            [
                'post_modified'     => current_time('mysql'),
                'post_modified_gmt' => current_time('mysql', true),
            ],
            ['ID' => $attachmentId],
            ['%s', '%s'],
            ['%d']
        );

        clean_post_cache($attachmentId);

        do_action('pnpnm_attachment_updated_at', $attachmentId);

        $this->touching = false;
    }
}
