<?php

namespace Pninja\NM\API\Contracts;

use WP_Error;

defined('ABSPATH') || exit('No direct script access allowed');

/**
 * Contract for folder model implementations.
 *
 * Shared by the media-library Folder model and the post-type PostTypeFolder model.
 * Methods listed here are the ones called from BaseFolderController's shared handlers.
 *
 * Implementing classes may add optional parameters beyond what is declared here.
 *
 * @package Pninja\NM\API\Contracts
 * @since   1.0.0
 */
interface FolderModelInterface
{
	public function findById(int $id): array|null|WP_Error;

	public function getAncestors(int $id): array|WP_Error;

	public function update(int $id, array $data): array|null|WP_Error;

	public function delete(int $id): array|WP_Error;

	public function move(int $id, int $newParentId): bool|WP_Error;
}
