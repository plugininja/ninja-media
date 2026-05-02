<?php

namespace PluginInja\NM\Models;

use WP_Error;

defined('ABSPATH') || exit('No direct script access allowed');

class Folder extends BaseModel
{
    public const TABLE_SUFFIX = 'pnpnm_folders';

    public const ALLOWED_ORDER_BY = [
        'id', 'name', 'slug', 'depth', 'sortOrder', 'createdAt', 'updatedAt',
    ];

    public const DATA_FORMATS = [
        'parentId'  => '%d',
        'name'      => '%s',
        'slug'      => '%s',
        'userId'    => '%d',
        'lft'       => '%d',
        'rgt'       => '%d',
        'depth'     => '%d',
        'sortOrder' => '%d',
        'color'     => '%s',
        'icon'      => '%s',
    ];

    public function __construct()
    {
        parent::__construct(self::TABLE_SUFFIX);
    }

    // ==========================================
    // READ
    // ==========================================

    public function getAllFolders(string $orderBy = 'sortOrder', string $order = 'ASC'): array|WP_Error
    {
        $orderBy = $this->sanitizeOrderBy($orderBy, self::ALLOWED_ORDER_BY);
        $order   = $this->sanitizeOrder($order);

        return $this->findMultipleRecords(
            "SELECT * FROM {$this->tableName} ORDER BY {$orderBy} {$order}",
            [],
            ARRAY_A
        );
    }

    /**
     * Get the full folder tree ordered by lft (Nested Set traversal order).
     */
    public function getTree(string $order = 'ASC'): array|WP_Error
    {
        $order = $this->sanitizeOrder($order);
        $sql   = "SELECT * FROM {$this->tableName} ORDER BY lft {$order}";

        return $this->findMultipleRecords($sql, [], ARRAY_A);
    }

    /**
     * Find a single folder by its ID.
     */
    public function findById(int $id): array|null|WP_Error
    {
        return $this->findSingleRecord(
            "SELECT * FROM {$this->tableName} WHERE id = %d",
            [$id],
            ARRAY_A
        );
    }

    /**
     * Find a single folder by its slug.
     */
    public function findBySlug(string $slug): array|null|WP_Error
    {
        return $this->findSingleRecord(
            "SELECT * FROM {$this->tableName} WHERE slug = %s",
            [$slug],
            ARRAY_A
        );
    }

    /**
     * Get direct children of a folder (one level deep).
     */
    public function getChildren(int $parentId, string $orderBy = 'sortOrder', string $order = 'ASC'): array|WP_Error
    {
        $orderBy = $this->sanitizeOrderBy($orderBy, self::ALLOWED_ORDER_BY);
        $order   = $this->sanitizeOrder($order);

        return $this->findMultipleRecords(
            "SELECT * FROM {$this->tableName} WHERE parentId = %d ORDER BY {$orderBy} {$order}",
            [$parentId],
            ARRAY_A
        );
    }

    /**
     * Get all descendants of a folder using the Nested Set lft/rgt range.
     * Includes the folder itself.
     */
    public function getSubtree(int $id): array|WP_Error
    {
        $folder = $this->findById($id);

        if (is_wp_error($folder)) {
            return $folder;
        }

        if (!$folder) {
            return $this->createNotFoundError('Folder');
        }

        return $this->findMultipleRecords(
            "SELECT * FROM {$this->tableName} WHERE lft BETWEEN %d AND %d ORDER BY lft ASC",
            [(int) $folder['lft'], (int) $folder['rgt']],
            ARRAY_A
        );
    }

    /**
     * Get all ancestor folders (breadcrumb trail) for a given folder.
     */
    public function getAncestors(int $id): array|WP_Error
    {
        $folder = $this->findById($id);

        if (is_wp_error($folder)) {
            return $folder;
        }

        if (!$folder) {
            return $this->createNotFoundError('Folder');
        }

        return $this->findMultipleRecords(
            "SELECT * FROM {$this->tableName} WHERE lft < %d AND rgt > %d ORDER BY lft ASC",
            [(int) $folder['lft'], (int) $folder['rgt']],
            ARRAY_A
        );
    }

    /**
     * Search folders by name (partial match) or by exact ID (when query is numeric).
     * Returns all matching folders regardless of depth/parent.
     */
    public function search(string $query, string $orderBy = 'sortOrder', string $order = 'ASC'): array|WP_Error
    {
        $orderBy = $this->sanitizeOrderBy($orderBy, self::ALLOWED_ORDER_BY);
        $order   = $this->sanitizeOrder($order);

        $like = '%' . $this->database->esc_like($query) . '%';

        if (is_numeric($query)) {
            return $this->findMultipleRecords(
                "SELECT * FROM {$this->tableName} WHERE id = %d OR name LIKE %s ORDER BY {$orderBy} {$order}",
                [(int) $query, $like],
                ARRAY_A
            );
        }

        return $this->findMultipleRecords(
            "SELECT * FROM {$this->tableName} WHERE name LIKE %s ORDER BY {$orderBy} {$order}",
            [$like],
            ARRAY_A
        );
    }

    /**
     * Get paginated root-level folders (parent_id = 0).
     */
    public function getRootFolders(int $page = 1, int $perPage = 20, string $orderBy = 'sortOrder', string $order = 'ASC'): array|WP_Error
    {
        $orderBy = $this->sanitizeOrderBy($orderBy, self::ALLOWED_ORDER_BY);

        return $this->getPaginatedRecords(
            ['parentId' => 0],
            $page,
            $perPage,
            $orderBy,
            $order
        );
    }

    // ==========================================
    // CREATE
    // ==========================================

    /**
     * Create a new folder and correctly insert it into the Nested Set tree.
     */
    public function create(string $name, int $parentId = 0, ?string $color = null, ?string $icon = null, int $userId = 0): array|WP_Error
    {
        $slug  = $this->generateUniqueSlug(sanitize_title($name));
        $positionResult = $this->resolveNestedSetPosition($parentId);

        if ($positionResult[0] instanceof WP_Error) {
            return $positionResult[0];
        }

        [$lft, $rgt, $depth] = $positionResult;

        $data = [
            'parentId'  => $parentId,
            'name'      => $name,
            'slug'      => $slug,
            'userId'    => $userId,
            'lft'       => $lft,
            'rgt'       => $rgt,
            'depth'     => $depth,
            'sortOrder' => $this->getNextSortOrder($parentId),
            'color'     => $color,
            'icon'      => $icon,
        ];

        // Build formats from only the keys present in $data
        $formats = array_map(
            fn ($key) => self::DATA_FORMATS[$key] ?? '%s',
            array_keys($data)
        );

        return $this->createRecord($data, $formats, ARRAY_A);
    }

    // ==========================================
    // UPDATE
    // ==========================================

    /**
     * Update a folder's metadata (name, color, icon).
     * Does NOT move the folder — use move() for that.
     */
    public function update(int $id, array $data): array|null|WP_Error
    {
        $allowed = ['name', 'color', 'icon', 'sortOrder'];
        $update  = array_intersect_key($data, array_flip($allowed));

        if (empty($update)) {
            return $this->createValidationError('No valid fields provided for update.');
        }

        // Regenerate slug if name changed
        if (isset($update['name'])) {
            $update['slug'] = $this->generateUniqueSlug(sanitize_title($update['name']), $id);
        }

        $formats = array_map(
            fn ($key) => self::DATA_FORMATS[$key] ?? '%s',
            array_keys($update)
        );

        return $this->updateRecords(
            $update,
            ['id' => $id],
            $formats,
            ['%d'],
            ARRAY_A
        );
    }

    /**
     * Move a folder (and its entire subtree) to a new parent.
     */
    public function move(int $id, int $newParentId): bool|WP_Error
    {
        $folder = $this->findById($id);

        if (is_wp_error($folder)) {
            return $folder;
        }

        if (!$folder) {
            return $this->createNotFoundError('Folder');
        }

        // Prevent moving a folder into itself or one of its own descendants
        $subtreeIds = $this->getSubtreeIds($id);
        if (is_wp_error($subtreeIds)) {
            return $subtreeIds;
        }

        if (in_array($newParentId, $subtreeIds, true)) {
            return $this->createValidationError('Cannot move a folder into itself or one of its descendants.');
        }

        if (!$this->beginTransaction()) {
            return $this->createDatabaseError('Could not start transaction.');
        }

        try {
            $lft   = (int) $folder['lft'];
            $rgt   = (int) $folder['rgt'];
            $width = $rgt - $lft + 1;

            // Step 1 — lift the subtree out of the tree by using a temporary negative range
            $this->executeRawQuery(
                "UPDATE {$this->tableName} SET lft = lft - %d, rgt = rgt - %d WHERE lft BETWEEN %d AND %d",
                [$lft - 1, $lft - 1, $lft, $rgt]
            );

            // Step 2 — close the gap left by the removal
            $this->executeRawQuery(
                "UPDATE {$this->tableName} SET rgt = rgt - %d WHERE rgt > %d AND lft NOT BETWEEN %d AND %d",
                [$width, $rgt, 0, $width - 1]  // exclude the temporarily negative nodes
            );
            $this->executeRawQuery(
                "UPDATE {$this->tableName} SET lft = lft - %d WHERE lft > %d AND lft NOT BETWEEN %d AND %d",
                [$width, $rgt, 0, $width - 1]
            );

            // Step 3 — calculate new insertion point
            [$newLft, , $newDepth] = $this->resolveNestedSetPosition($newParentId);
            if ($newLft instanceof WP_Error) {
                throw new \Exception($newLft->get_error_message());
            }

            $depthDiff = $newDepth - (int) $folder['depth'];

            // Step 4 — open a gap at the new position
            $this->executeRawQuery(
                "UPDATE {$this->tableName} SET rgt = rgt + %d WHERE rgt >= %d AND lft NOT BETWEEN %d AND %d",
                [$width, $newLft, 0, $width - 1]
            );
            $this->executeRawQuery(
                "UPDATE {$this->tableName} SET lft = lft + %d WHERE lft >= %d AND lft NOT BETWEEN %d AND %d",
                [$width, $newLft, 0, $width - 1]
            );

            // Step 5 — drop the subtree into the new position and fix depth
            $shift = $newLft - 1;
            $this->executeRawQuery(
                "UPDATE {$this->tableName} 
                 SET lft   = lft + %d,
                     rgt   = rgt + %d,
                     depth = depth + %d
                 WHERE lft BETWEEN %d AND %d",
                [$shift, $shift, $depthDiff, 1, $width]   // the temporarily < 0 nodes are in range 1..width after subtraction
            );

            // Step 6 — update parentId on the root of the moved subtree
            $this->updateRecords(
                ['parentId' => $newParentId],
                ['id' => $id],
                ['%d'],
                ['%d']
            );

            $this->commitTransaction();

            return true;

        } catch (\Exception $e) {
            $this->rollbackTransaction();

            return $this->createDatabaseError($e->getMessage());
        }
    }

    /**
     * Copy a folder (and optionally its subtree structure) to a new parent.
     * Does not duplicate media files — only the folder records.
     * Pass $relationModel to also copy media assignments.
     */
    public function copy(
        int $id,
        int $newParentId,
        bool $includeMedia = false,
        ?FolderRelationship $relationModel = null
    ): array|WP_Error {
        // Treat 0 (or any negative value) as the root level ("/")
        $newParentId = max(0, $newParentId);

        $source = $this->findById($id);

        if (is_wp_error($source)) {
            return $source;
        }

        if (!$source) {
            return $this->createNotFoundError('Folder');
        }

        // When copying to a non-root parent, verify it actually exists
        if ($newParentId > 0) {
            $parent = $this->findById($newParentId);

            if (is_wp_error($parent)) {
                return $parent;
            }

            if (!$parent) {
                return $this->createNotFoundError('Parent folder');
            }
        }

        // Recursively copy the folder and all its descendants
        return $this->copyRecursive((int) $source['id'], $newParentId, $includeMedia, $relationModel);
    }

    /**
     * Internal recursive copy — walks the subtree depth-first.
     */
    private function copyRecursive(
        int $sourceId,
        int $targetParentId,
        bool $includeMedia,
        ?FolderRelationship $relationModel
    ): array|WP_Error {
        $source = $this->findById($sourceId);

        if (!$source || is_wp_error($source)) {
            return $this->createNotFoundError('Folder');
        }

        // Create the copy at the new parent
        $copy = $this->create(
            $source['name'],
            $targetParentId,
            $source['color'],
            $source['icon'],
            (int) $source['userId']
        );

        if (is_wp_error($copy)) {
            return $copy;
        }

        $newFolderId = (int) $copy['id'];

        // Copy media assignments if requested
        if ($includeMedia && $relationModel !== null) {
            $attachmentIds = $relationModel->getAttachmentIds($sourceId);

            if (!is_wp_error($attachmentIds) && !empty($attachmentIds)) {
                $relationModel->assignBatch($newFolderId, $attachmentIds);
            }
        }

        // Recurse into children
        $children = $this->getChildren($sourceId);

        if (!is_wp_error($children)) {
            foreach ($children as $child) {
                $childResult = $this->copyRecursive(
                    (int) $child['id'],
                    $newFolderId,
                    $includeMedia,
                    $relationModel
                );

                if (is_wp_error($childResult)) {
                    return $childResult;
                }
            }
        }

        return $copy;
    }

    // ==========================================
    // DELETE
    // ==========================================

    /**
     * Delete a folder and its entire subtree.
     * Returns the list of deleted folder IDs so the caller can also
     * clean up the relationships table.
     */
    public function delete(int $id): array|WP_Error
    {
        $folder = $this->findById($id);

        if (is_wp_error($folder)) {
            return $folder;
        }

        if (!$folder) {
            return $this->createNotFoundError('Folder');
        }

        $lft   = (int) $folder['lft'];
        $rgt   = (int) $folder['rgt'];
        $width = $rgt - $lft + 1;

        // Collect subtree IDs before deletion so the caller can remove relationships
        $deletedIds = $this->database->get_col(
            $this->database->prepare(
                "SELECT id FROM {$this->tableName} WHERE lft BETWEEN %d AND %d",
                $lft,
                $rgt
            )
        );

        if ($this->database->last_error) {
            return $this->createDatabaseError($this->database->last_error);
        }

        // Delete the subtree
        $deleted = $this->deleteRecords(
            "lft BETWEEN %d AND %d",
            [],
            false,
            [$lft, $rgt]
        );

        if (is_wp_error($deleted)) {
            return $deleted;
        }

        // Close the Nested Set gap
        $this->executeRawQuery(
            "UPDATE {$this->tableName} SET rgt = rgt - %d WHERE rgt > %d",
            [$width, $rgt]
        );
        $this->executeRawQuery(
            "UPDATE {$this->tableName} SET lft = lft - %d WHERE lft > %d",
            [$width, $rgt]
        );

        return array_map('intval', $deletedIds);
    }

    // ==========================================
    // COUNTS
    // ==========================================

    /**
     * Get direct child folder counts for ALL folders in a single query.
     * Returns [parentId => count].
     */
    public function getChildFolderCounts(): array
    {
        $rows = $this->database->get_results(
            "SELECT parentId, COUNT(id) AS total
             FROM {$this->tableName}
             GROUP BY parentId",
            ARRAY_A
        );

        if (empty($rows)) {
            return [];
        }

        $result = [];
        foreach ($rows as $row) {
            $result[(int) $row['parentId']] = (int) $row['total'];
        }

        return $result;
    }

    // ==========================================
    // HELPERS (NESTED SET INTERNALS)
    // ==========================================

    /**
     * Calculate lft, rgt, and depth for a new node given its parent.
     * Also shifts existing nodes to make room.
     *
     * @return array [lft, rgt, depth] or WP_Error as the first element on failure
     */
    private function resolveNestedSetPosition(int $parentId): array
    {
        if ($parentId === 0) {
            $maxRgt = (int) ($this->database->get_var("SELECT MAX(rgt) FROM {$this->tableName}") ?? 0);
            return [$maxRgt + 1, $maxRgt + 2, 0];
        }

        $parent = $this->findById($parentId);

        if (is_wp_error($parent)) {
            return [$parent, 0, 0];
        }

        if (!$parent) {
            return [$this->createNotFoundError('Parent folder'), 0, 0];
        }

        $parentRgt = (int) $parent['rgt'];

        // Shift all nodes to the right of the insertion point
        $this->executeRawQuery(
            "UPDATE {$this->tableName} SET rgt = rgt + 2 WHERE rgt >= %d",
            [$parentRgt]
        );
        $this->executeRawQuery(
            "UPDATE {$this->tableName} SET lft = lft + 2 WHERE lft >= %d",
            [$parentRgt]
        );

        return [$parentRgt, $parentRgt + 1, (int) $parent['depth'] + 1];
    }

    /**
     * Get all IDs in the subtree (including the root folder itself).
     */
    private function getSubtreeIds(int $id): array|WP_Error
    {
        $folder = $this->findById($id);

        if (is_wp_error($folder)) {
            return $folder;
        }

        if (!$folder) {
            return $this->createNotFoundError('Folder');
        }

        $ids = $this->database->get_col(
            $this->database->prepare(
                "SELECT id FROM {$this->tableName} WHERE lft BETWEEN %d AND %d",
                (int) $folder['lft'],
                (int) $folder['rgt']
            )
        );

        if ($this->database->last_error) {
            return $this->createDatabaseError($this->database->last_error);
        }

        return array_map('intval', $ids);
    }

    /**
     * Generate a slug that is unique within the table.
     * Appends -1, -2 ... if a conflict exists (excluding the current record on update).
     */
    private function generateUniqueSlug(string $base, int $excludeId = 0): string
    {
        $slug     = $base;
        $suffix   = 1;

        while (true) {
            $sql    = "SELECT COUNT(*) FROM {$this->tableName} WHERE slug = %s";
            $params = [$slug];

            if ($excludeId > 0) {
                $sql     .= " AND id != %d";
                $params[] = $excludeId;
            }

            $count = (int) $this->database->get_var(
                $this->database->prepare($sql, ...$params)
            );

            if ($count === 0) {
                break;
            }

            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    /**
     * Get the next sortOrder value for siblings under the same parent.
     */
    private function getNextSortOrder(int $parentId): int
    {
        $max = $this->database->get_var(
            $this->database->prepare(
                "SELECT MAX(sortOrder) FROM {$this->tableName} WHERE parentId = %d",
                $parentId
            )
        );

        return $max !== null ? (int) $max + 1 : 0;
    }
}
