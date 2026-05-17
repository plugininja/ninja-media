<?php

namespace Pninja\NM\API\Contracts;

use WP_Error;

defined('ABSPATH') || exit('No direct script access allowed');

/**
 * Contract for folder-relationship model implementations.
 *
 * Shared by FolderRelationship (media) and PostTypeFolderRelationship (post types).
 * Only the methods called from BaseFolderController's shared handlers are declared here.
 *
 * @package Pninja\NM\API\Contracts
 * @since   1.0.0
 */
interface RelationModelInterface
{
	/**
	 * Remove all relationships for a list of folder IDs.
	 * Implementing classes may add optional parameters (e.g. $isMediaDelete).
	 */
	public function deleteByFolderIds(array $folderIds): int|WP_Error;

	/**
	 * Assign a batch of items (attachments or posts) to a folder.
	 *
	 * @return array{assigned: int[], previousFolder: array{id: int|null, remaining: int}}|WP_Error
	 */
	public function assignBatch(int $folderId, array $ids): array|WP_Error;
}
