<?php

// Models/FolderRelationship.php

namespace PluginInja\NM\Models;

use PluginInja\NM\Utils\Helpers;
use WP_Error;

defined('ABSPATH') || exit('No direct script access allowed');

class FolderRelationship extends BaseModel
{
    public const TABLE_SUFFIX = 'pnpnm_folder_relationships';

    public const DATA_FORMATS = [
        'folderId'     => '%d',
        'attachmentId' => '%d',
    ];

    public function __construct()
    {
        parent::__construct(self::TABLE_SUFFIX);
    }

    /**
     * Assign a single attachment to a folder.
     * Silently ignores duplicates (INSERT IGNORE).
     */
    public function assign(int $folderId, int $attachmentId): int|WP_Error
    {
        // Insert into relationship table (ignore duplicate due to UNIQUE KEY)
        $inserted = $this->database->query(
            $this->database->prepare(
                "INSERT IGNORE INTO {$this->tableName} (folderId, attachmentId) VALUES (%d, %d)",
                $folderId,
                $attachmentId
            )
        );

        if ($this->database->last_error) {
            return $this->createDatabaseError($this->database->last_error);
        }

        // Sync folder ID into attachment post meta for WP_Query filtering
        $meta = get_post_meta($attachmentId, '_wp_attachment_metadata', true);

        if (is_array($meta)) {
            $meta['folderId'] = $folderId;
        } else {
            $meta = ['folderId' => $folderId];
        }

        update_post_meta($attachmentId, '_wp_attachment_metadata', $meta);
        update_post_meta($attachmentId, '_pnpnm_media_folder_id', $folderId);

        return $attachmentId;
    }

    /**
     * Assign multiple attachments to a folder in one batch.
     * Returns the list of successfully assigned attachment IDs.
     */
    /**
     * @return array{assigned: int[], previousFolder: array{folderId: int|null, count: int}}|WP_Error
     */
    public function assignBatch(int $folderId, array $attachmentIds): array|WP_Error
    {
        if (empty($attachmentIds)) {
            return $this->createValidationError('Attachment IDs cannot be empty.');
        }

        $attachmentIds = array_map('intval', $attachmentIds);
        $placeholders  = implode(',', array_fill(0, count($attachmentIds), '%d'));

        $previousFolder = $this->findSingleRecord(
            "SELECT folderId FROM {$this->tableName} WHERE attachmentId = %d LIMIT 1",
            [$attachmentIds[0]],
            ARRAY_A
        );
        
        $this->deleteRecords( "folderId != %d AND attachmentId IN ({$placeholders})", [], false, array_merge([$folderId], $attachmentIds) );

        if (empty($previousFolder)) {
            $previousFolder = null;
            $previousFolderAttachmentCount = 0;
        } else {
            $previousFolder['folderId'] = (int) $previousFolder['folderId'];
        }   
            
        $previousFolderAttachmentCount = $this->countRecords('folderId = %d', [$previousFolder['folderId']]);

        if ($this->database->last_error) {
            return $this->createDatabaseError($this->database->last_error);
        }

        $assigned = [];

        foreach ($attachmentIds as $attachmentId) {
            $result = $this->assign($folderId, $attachmentId);

            if (is_wp_error($result)) {
                return $result;
            }

            if ($result) {
                $assigned[] = $attachmentId;
            }
        }

        return [
            'assigned'          => $assigned,
            'previousFolder' => [
                'id' => $previousFolder ? (int) $previousFolder['folderId'] : null,
                'remaining'    => $previousFolderAttachmentCount ?? 0
            ],
        ];
    }

    /**
     * Move all attachments from one folder to another.
     */
    public function moveAttachments(int $fromFolderId, int $toFolderId): int|WP_Error
    {
        $result = $this->updateRecords(
            ['folderId' => $toFolderId],
            ['folderId' => $fromFolderId],
            ['%d'],
            ['%d']
        );

        if (is_wp_error($result)) {
            return $result;
        }

        return (int) $result;
    }

    /**
     * Remove all relationships for a list of folder IDs and clean up attachment post meta.
     *
     * Deleting only the relationship table row without removing _pnpnm_media_folder_id
     * leaves attachments with a stale folder ID, making them invisible to the unused /
     * uncategorized filters (both of which rely on that meta key being absent or empty).
     *
     * Used when deleting a folder subtree.
     */
    public function deleteByFolderIds(array $folderIds): int|WP_Error
    {
        if (empty($folderIds)) {
            return 0;
        }

        $placeholders = implode(',', array_fill(0, count($folderIds), '%d'));

        // Collect attachment IDs before deleting so we can scrub their post meta.
        $rows = $this->findMultipleRecords(
            "SELECT attachmentId FROM {$this->tableName} WHERE folderId IN ({$placeholders})",
            $folderIds,
            ARRAY_A
        );

        if (!is_wp_error($rows) && !empty($rows)) {
            foreach (array_column($rows, 'attachmentId') as $rawId) {
                $attachmentId = absint($rawId);

                delete_post_meta($attachmentId, '_pnpnm_media_folder_id');

                // Remove the denormalized folderId stored inside _wp_attachment_metadata.
                $meta = get_post_meta($attachmentId, '_wp_attachment_metadata', true);
                if (is_array($meta) && array_key_exists('folderId', $meta)) {
                    unset($meta['folderId']);
                    update_post_meta($attachmentId, '_wp_attachment_metadata', $meta);
                }
            }
        }

        return $this->deleteRecords(
            "folderId IN ({$placeholders})",
            [],
            false,
            $folderIds
        );
    }

    /**
     * Get all attachment IDs assigned to a folder.
     */
    public function getAttachmentIds(int $folderId): array|WP_Error
    {
        $rows = $this->findMultipleRecords(
            "SELECT attachmentId FROM {$this->tableName} WHERE folderId = %d",
            [$folderId],
            ARRAY_A
        );

        if (is_wp_error($rows)) {
            return $rows;
        }

        return array_column($rows, 'attachmentId');
    }

    /**
     * Get the folder IDs an attachment belongs to.
     */
    public function getFolderIdsForAttachment(int $attachmentId): array|WP_Error
    {
        $rows = $this->findMultipleRecords(
            "SELECT folderId FROM {$this->tableName} WHERE attachmentId = %d",
            [$attachmentId],
            ARRAY_A
        );

        if (is_wp_error($rows)) {
            return $rows;
        }

        return array_column($rows, 'folderId');
    }

    /**
     * Count how many attachments are in a folder.
     */
    public function countByFolder(int $folderId): int|WP_Error
    {
        return $this->countRecords('folderId = %d', [$folderId]);
    }

    /**
     * Get attachment counts for ALL folders in a single query.
     * Returns [folder_id => count] map.
     * Excludes trashed attachments.
     */
    public function getCountsByFolder(): array
    {
        global $wpdb;

        $cache_key = 'folder_attachment_counts:' . wp_cache_get_last_changed('pnpnm');
        $cached    = wp_cache_get($cache_key, 'pnpnm');

        if ($cached !== false) {
            return $cached;
        }

        // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- custom plugin table, query is parameterless, result is cached above.
        $rows = $wpdb->get_results(
            "SELECT r.folderId, COUNT(r.attachmentId) AS total
             FROM {$this->tableName} r
             INNER JOIN {$wpdb->posts} p ON p.ID = r.attachmentId
             LEFT JOIN {$wpdb->postmeta} pt ON pt.post_id = p.ID AND pt.meta_key = '_pnpnm_media_trashed'
             WHERE p.post_type = 'attachment' AND p.post_status = 'inherit' AND pt.meta_id IS NULL
             GROUP BY r.folderId",
            ARRAY_A
        );
        // phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        if (empty($rows)) {
            return [];
        }

        $result = array_map('intval', array_column($rows, 'total', 'folderId'));
        wp_cache_set($cache_key, $result, 'pnpnm');

        return $result;
    }

    /**
     * Get paginated attachments for a specific folder.
     * 
     * @param int    $folderId  Folder ID to query
     * @param int    $page      Page number (1-based)
     * @param int    $perPage   Items per page
     * @param string $orderBy   Column to order by (mapped in controller)
     * @param string $order     Sort direction (ASC|DESC)
     * @param bool   $countOnly If true, only return total count
     * 
     * @return array{items?: array, total: int, page?: int, perPage?: int, totalPages?: int}
     */
    public function getPaginatedAttachments(int $folderId, int $page = 1, int $perPage = 20, string $orderBy = 'p.post_date', string $order = 'ASC', bool $countOnly = false): array
    {
        global $wpdb;

        $last_changed = wp_cache_get_last_changed('pnpnm');
        $count_key    = "folder_count:{$folderId}:{$last_changed}";
        $cached_total = wp_cache_get($count_key, 'pnpnm');

        $allowed_order_by = ['p.post_date', 'p.post_title', 'p.post_modified', 'p.ID'];
        $orderBy          = in_array($orderBy, $allowed_order_by, true) ? $orderBy : 'p.post_date';

        if ($cached_total !== false) {
            $total = $cached_total;
        } else {
            // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- custom plugin table, result cached below.
            $total = (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$this->tableName} r
                    INNER JOIN {$wpdb->posts} p ON p.ID = r.attachmentId
                    LEFT JOIN {$wpdb->postmeta} pt ON pt.post_id = p.ID AND pt.meta_key = '_pnpnm_media_trashed'
                    WHERE r.folderId = %d AND p.post_type = 'attachment' AND p.post_status = 'inherit' AND pt.meta_id IS NULL",
                    $folderId
                )
            );
            // phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
            wp_cache_set($count_key, $total, 'pnpnm');
        }

        if ($countOnly) {
            return ['total' => $total];
        }

        $orderDir = strtoupper($order) === 'ASC' ? 'ASC' : 'DESC';
        $offset   = max(0, ($page - 1) * $perPage);
        $items_key  = "folder_items:{$folderId}:{$page}:{$perPage}:{$orderBy}:{$order}:{$last_changed}";
        $cached_items = wp_cache_get($items_key, 'pnpnm');

        if ($cached_items !== false) {
            $items = $cached_items;
        } else {
            // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,PluginCheck.Security.DirectDB.UnescapedDBParameter -- custom plugin table; $orderBy is allowlisted above; result cached below.
            $items = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT p.ID, p.post_title, p.post_mime_type, p.post_date, p.guid
                     FROM {$wpdb->posts} p
                     INNER JOIN {$this->tableName} r ON r.attachmentId = p.ID
                     LEFT JOIN {$wpdb->postmeta} pt ON pt.post_id = p.ID AND pt.meta_key = '_pnpnm_media_trashed'
                     WHERE p.post_type = 'attachment' AND p.post_status = 'inherit' AND r.folderId = %d AND pt.meta_id IS NULL
                     ORDER BY {$orderBy} {$orderDir}
                     LIMIT %d OFFSET %d",
                    $folderId,
                    $perPage,
                    $offset
                ),
                ARRAY_A
            );
            // phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,PluginCheck.Security.DirectDB.UnescapedDBParameter
            wp_cache_set($items_key, $items ?: [], 'pnpnm');
        }

        return [
            'items'      => $items ?: [],
            'total'      => $total,
            'page'       => $page,
            'perPage'    => $perPage,
            'totalPages' => $perPage > 0 ? (int) ceil($total / $perPage) : 0,
        ];
    }
}
