<?php
/**
 * WordPress Abilities API — MCP connector for Ninja Media.
 *
 * Registers the plugin's core media-management operations as WordPress Abilities
 * so they are discoverable and executable by MCP clients via wp-abilities/v1.
 *
 * @package Pninja\NM
 * @license GPL-2.0-or-later
 */
namespace Pninja\NM;

use Pninja\NM\Models\Folder;
use Pninja\NM\Models\FolderRelationship;
use Pninja\NM\Utils\Singleton;

defined('ABSPATH') || exit('No direct script access allowed');

class Abilities
{
	use Singleton;

	public function doHooks(): void
	{
		add_action('wp_abilities_api_categories_init', [$this, 'registerCategory']);
		add_action('wp_abilities_api_init', [$this, 'registerAbilities']);
	}

	public function registerCategory(): void
	{
		if ( ! function_exists( 'wp_register_ability_category' ) ) {
			return;
		}

		wp_register_ability_category('pnpnm', [
			'label' => __('Ninja Media', 'ninja-media'),
		]);
	}

	public function registerAbilities(): void
	{
		if ( ! function_exists( 'wp_register_ability' ) ) {
			return;
		}

		wp_register_ability('pnpnm:folders.list', [
			'label'            => __('List Media Folders', 'ninja-media'),
			'description'      => __('Returns all media library folders ordered by sort order.', 'ninja-media'),
			'category'         => 'pnpnm',
			'execute_callback' => [$this, 'listFolders'],
			'permission_callback' => [$this, 'canRead'],
			'meta'             => [
				'show_in_rest' => true,
				'readonly'     => true,
			],
		]);

		wp_register_ability('pnpnm:folders.create', [
			'label'            => __('Create Media Folder', 'ninja-media'),
			'description'      => __('Creates a new folder in the media library.', 'ninja-media'),
			'category'         => 'pnpnm',
			'execute_callback' => [$this, 'createFolder'],
			'permission_callback' => [$this, 'canWrite'],
			'input_schema'     => [
				'type'       => 'object',
				'properties' => [
					'name'     => [
						'type'        => 'string',
						'description' => __('Folder name.', 'ninja-media'),
					],
					'parentId' => [
						'type'        => 'integer',
						'description' => __('Parent folder ID. Use 0 for root.', 'ninja-media'),
						'default'     => 0,
					],
				],
				'required' => ['name'],
			],
			'meta' => ['show_in_rest' => true],
		]);

		wp_register_ability('pnpnm:files.list', [
			'label'            => __('List Media Files', 'ninja-media'),
			'description'      => __('Returns media files, optionally filtered by folder ID.', 'ninja-media'),
			'category'         => 'pnpnm',
			'execute_callback' => [$this, 'listFiles'],
			'permission_callback' => [$this, 'canRead'],
			'input_schema'     => [
				'type'       => 'object',
				'properties' => [
					'folderId' => [
						'type'        => 'integer',
						'description' => __('Folder ID to filter by. Omit to return all files.', 'ninja-media'),
					],
					'perPage' => [
						'type'        => 'integer',
						'description' => __('Number of files to return (max 100).', 'ninja-media'),
						'default'     => 20,
					],
					'page' => [
						'type'        => 'integer',
						'description' => __('Page number.', 'ninja-media'),
						'default'     => 1,
					],
				],
			],
			'meta' => [
				'show_in_rest' => true,
				'readonly'     => true,
			],
		]);

		wp_register_ability('pnpnm:files.move', [
			'label'            => __('Move Files to Folder', 'ninja-media'),
			'description'      => __('Assigns one or more media files to a folder.', 'ninja-media'),
			'category'         => 'pnpnm',
			'execute_callback' => [$this, 'moveFiles'],
			'permission_callback' => [$this, 'canWrite'],
			'input_schema'     => [
				'type'       => 'object',
				'properties' => [
					'attachmentIds' => [
						'type'        => 'array',
						'items'       => ['type' => 'integer'],
						'description' => __('Array of attachment IDs to move.', 'ninja-media'),
					],
					'folderId' => [
						'type'        => 'integer',
						'description' => __('Target folder ID.', 'ninja-media'),
					],
				],
				'required' => ['attachmentIds', 'folderId'],
			],
			'meta' => ['show_in_rest' => true],
		]);
	}

	public function canRead(): bool
	{
		return current_user_can('upload_files');
	}

	public function canWrite(): bool
	{
		return current_user_can('upload_files');
	}

	public function listFolders(array $input): array|\WP_Error
	{
		$model  = new Folder();
		$result = $model->getAllFolders();

		if (is_wp_error($result)) {
			return $result;
		}

		return ['folders' => $result];
	}

	public function createFolder(array $input): array|\WP_Error
	{
		$name     = sanitize_text_field($input['name'] ?? '');
		$parentId = absint($input['parentId'] ?? 0);

		if ('' === $name) {
			return new \WP_Error('invalid_name', __('Folder name is required.', 'ninja-media'));
		}

		$model  = new Folder();
		$result = $model->create($name, $parentId, null, null, get_current_user_id());

		if (is_wp_error($result)) {
			return $result;
		}

		return ['id' => $result['id'] ?? null, 'name' => $name, 'parentId' => $parentId];
	}

	public function listFiles(array $input): array|\WP_Error
	{
		$perPage  = min(absint($input['perPage'] ?? 20), 100);
		$page     = max(1, absint($input['page'] ?? 1));
		$folderId = isset($input['folderId']) ? absint($input['folderId']) : null;
		$offset   = ($page - 1) * $perPage;

		$args = [
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'posts_per_page' => $perPage,
			'offset'         => $offset,
			'fields'         => 'ids',
		];

		if (null !== $folderId) {
			$relation = new FolderRelationship();
			$ids      = $relation->getAttachmentIds($folderId);

			if (is_wp_error($ids)) {
				return $ids;
			}

			if (empty($ids)) {
				return ['files' => [], 'total' => 0, 'page' => $page, 'perPage' => $perPage];
			}

			$args['post__in'] = array_map('absint', $ids);
		}

		$query = new \WP_Query($args);
		$files = array_map(function (int $id): array {
			return [
				'id'    => $id,
				'title' => get_the_title($id),
				'url'   => wp_get_attachment_url($id),
				'mime'  => get_post_mime_type($id),
			];
		}, $query->posts);

		return [
			'files'   => $files,
			'total'   => $query->found_posts,
			'page'    => $page,
			'perPage' => $perPage,
		];
	}

	public function moveFiles(array $input): array|\WP_Error
	{
		$attachmentIds = array_map('absint', $input['attachmentIds'] ?? []);
		$folderId      = absint($input['folderId'] ?? 0);

		if (empty($attachmentIds)) {
			return new \WP_Error('invalid_ids', __('No attachment IDs provided.', 'ninja-media'));
		}

		$folder = new Folder();
		$target = $folder->findById($folderId);

		if (is_wp_error($target) || empty($target)) {
			return new \WP_Error('folder_not_found', __('Target folder not found.', 'ninja-media'));
		}

		$relation = new FolderRelationship();
		$result   = $relation->assignBatch($folderId, $attachmentIds);

		if (is_wp_error($result)) {
			return $result;
		}

		/**
		 * Fires after files are moved to a folder via the Abilities API.
		 *
		 * @param int[] $attachmentIds Attachment IDs that were moved.
		 * @param int   $folderId      Target folder ID.
		 */
		do_action('pnpnm_abilities_files_moved', $attachmentIds, $folderId);

		return ['moved' => count($attachmentIds), 'folderId' => $folderId];
	}
}
