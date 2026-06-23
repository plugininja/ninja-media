<?php

namespace Pninja\NM\API\Controllers;

use Pninja\NM\API\BaseFolderController;
use Pninja\NM\API\Contracts\FolderModelInterface;
use Pninja\NM\API\Contracts\RelationModelInterface;
use Pninja\NM\Models\Attachment;
use Pninja\NM\Models\BaseModel;
use Pninja\NM\Models\Folder;
use Pninja\NM\Models\FolderRelationship;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

defined('ABSPATH') || exit('No direct script access allowed');

/**
 * REST controller for the Media Library folder system.
 *
 * Extends BaseFolderController which provides: updateFolder, moveFolder,
 * getBreadcrumbs, and invalidateCache. Only media-specific handlers live here.
 *
 * @package Pninja\NM\API\Controllers
 * @since   1.0.0
 */
class MediaLibrary extends BaseFolderController
{
	private Folder             $folderModel;
	private FolderRelationship $relationModel;
	private Attachment         $attachmentModel;

	private const CACHE_GROUP = 'pnpnm';

	private const ATTACHMENT_ORDER_BY_MAP = [
		'lft'       => 'p.post_date',
		'name'      => 'p.post_title',
		'createdAt' => 'p.post_date',
		'id'        => 'p.ID',
	];

	private const PAGINATION_ARGS = [
		'page'    => ['type' => 'integer', 'default' => 1,           'minimum' => 1],
		'perPage' => ['type' => 'integer', 'default' => 20,          'minimum' => 1, 'maximum' => 200],
		'orderBy' => ['type' => 'string',  'default' => 'sortOrder', 'enum'    => ['id', 'name', 'lft', 'size', 'sortOrder', 'createdAt', 'updatedAt']],
		'order'   => ['type' => 'string',  'default' => 'ASC',       'enum'    => ['ASC', 'DESC']],
	];

	public function __construct()
	{
		parent::__construct('ninja-media/v1', 'media-library');
		$this->folderModel     = new Folder();
		$this->relationModel   = new FolderRelationship();
		$this->attachmentModel = new Attachment();
	}

	// ── BaseFolderController contract ────────────────────────────────────

	protected function getFolderModel(): FolderModelInterface
	{
		return $this->folderModel;
	}

	protected function getRelationModel(): RelationModelInterface
	{
		return $this->relationModel;
	}

	protected function getFolderById(int $id, WP_REST_Request $request): array|null|\WP_Error
	{
		return $this->folderModel->findById($id);
	}

	protected function buildRootBreadcrumbResponse(WP_REST_Request $request): WP_REST_Response
	{
		$children = $this->folderModel->getChildren(0);

		if (is_wp_error($children)) {
			return $this->errorResponse($children);
		}

		$counts  = $this->getFolderAttachmentCounts();
		$folders = $this->attachCountsToFolders($children, $counts);

		return $this->successResponse(
			['breadcrumbs' => [], 'folders' => $folders],
			__('Root folders retrieved successfully.', 'ninja-media')
		);
	}

	// ── Route registration ───────────────────────────────────────────────

	public function register_routes(): void
	{
		// GET /media-library — folder tree with attachment counts
		register_rest_route($this->namespace, $this->rest_base, [[
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => [$this, 'getTree'],
			'permission_callback' => [$this, 'checkReadPermission'],
			'args'                => array_merge(self::PAGINATION_ARGS, [
				'search' => [
					'type'              => 'string',
					'required'          => false,
					'default'           => '',
					'sanitize_callback' => 'sanitize_text_field',
				],
			]),
		]]);

		// GET /media-library/{id} — single folder + children + paginated attachments
		register_rest_route($this->namespace, $this->rest_base . '/(?P<id>\d+)', [[
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => [$this, 'getFolderWithMedia'],
			'permission_callback' => [$this, 'checkReadPermission'],
			'args'                => array_merge(
				['id' => ['type' => 'integer', 'required' => true, 'sanitize_callback' => 'absint']],
				self::PAGINATION_ARGS
			),
		]]);

		// POST | PATCH | DELETE /media-library/folder — create, update, or delete folder
		register_rest_route($this->namespace, $this->rest_base . '/folder', [
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [$this, 'createFolder'],
				'permission_callback' => [$this, 'checkPermission'],
				'args'                => [
					'name'     => ['type' => 'string',  'required' => true,  'sanitize_callback' => 'sanitize_text_field'],
					'parentId' => ['type' => 'integer', 'default'  => 0,     'sanitize_callback' => 'absint'],
					'color'    => ['type' => 'string',  'required' => false,  'sanitize_callback' => 'sanitize_hex_color'],
					'icon'     => ['type' => 'string',  'required' => false,  'sanitize_callback' => 'sanitize_text_field'],
				],
			],
			[
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => [$this, 'updateFolder'],
				'permission_callback' => [$this, 'checkPermission'],
				'args'                => [
					'id'    => ['type' => 'integer', 'required' => true,  'sanitize_callback' => 'absint'],
					'name'  => ['type' => 'string',  'required' => false, 'sanitize_callback' => 'sanitize_text_field'],
					'color' => ['type' => 'string',  'required' => false, 'sanitize_callback' => 'sanitize_hex_color'],
					'icon'  => ['type' => 'string',  'required' => false, 'sanitize_callback' => 'sanitize_text_field'],
				],
			],
			[
				'methods'             => WP_REST_Server::DELETABLE,
				'callback'            => [$this, 'deleteFolder'],
				'permission_callback' => [$this, 'checkPermission'],
				'args'                => [
					'ids'           => ['type' => 'array',   'required' => false, 'items' => ['type' => 'integer']],
					'isMediaDelete' => ['type' => 'boolean', 'default'  => false],
				],
			],
		]);

		// POST /media-library/folder/move
		register_rest_route($this->namespace, $this->rest_base . '/folder/move', [[
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => [$this, 'moveFolder'],
			'permission_callback' => [$this, 'checkPermission'],
			'args'                => [
				'parentId' => ['type' => 'integer', 'required' => false, 'sanitize_callback' => 'absint'],
				'ids'      => ['type' => 'array',   'required' => false, 'items' => ['type' => 'integer']],
			],
		]]);

		// POST /media-library/folder/{id}/assign
		register_rest_route($this->namespace, $this->rest_base . '/folder/(?P<id>\d+)/assign', [[
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => [$this, 'assignMedia'],
			'permission_callback' => [$this, 'checkPermission'],
			'args'                => [
				'attachments' => ['type' => 'array', 'required' => true, 'items' => ['type' => 'integer']],
			],
		]]);

		// POST /media-library/delete — delete one or more attachments permanently
		register_rest_route($this->namespace, $this->rest_base . '/delete', [[
			'methods'             => WP_REST_Server::DELETABLE,
			'callback'            => [$this, 'deleteAttachments'],
			'permission_callback' => [$this, 'checkPermission'],
			'args'                => [
				'ids' => ['type' => 'array', 'required' => true, 'items' => ['type' => 'integer']],
			],
		]]);

		// GET /media-library/breadcrumbs
		register_rest_route($this->namespace, $this->rest_base . '/breadcrumbs', [[
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => [$this, 'getBreadcrumbs'],
			'permission_callback' => [$this, 'checkPermission'],
			'args'                => [
				'id' => ['type' => 'integer', 'required' => false, 'sanitize_callback' => 'absint'],
			],
		]]);

		// GET /media-library/files — paginated file list for all/uncategorized/dynamic/trash views
		$typeEnum = ['all', 'uncategorized'];

		register_rest_route($this->namespace, $this->rest_base . '/files', [[
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => [$this, 'getFilesWithMedia'],
			'permission_callback' => [$this, 'checkPermission'],
			'args'                => [
				'type'      => ['type' => 'string',  'required' => true,  'enum' => $typeEnum, 'default' => 'all'],
				'extension' => ['type' => 'string',  'required' => false, 'sanitize_callback' => 'sanitize_text_field'],
				'orderBy'   => ['type' => 'string',  'default'  => 'createdAt', 'enum' => ['name', 'size', 'createdAt', 'updatedAt']],
				'order'     => ['type' => 'string',  'default'  => 'DESC', 'enum' => ['ASC', 'DESC']],
				'search'    => ['type' => 'string',  'required' => false, 'default' => '', 'sanitize_callback' => 'sanitize_text_field'],
				'page'      => ['type' => 'integer', 'required' => false, 'default' => 1],
				'perPage'   => ['type' => 'integer', 'required' => false, 'default' => 20],
			],
		]]);

		register_rest_route($this->namespace, $this->rest_base . '/files/(?P<id>\d+)/metadata', [[
			'methods'             => WP_REST_Server::EDITABLE,
			'callback'            => [$this, 'updateFileMetadata'],
			'permission_callback' => [$this, 'checkPermission'],
			'args'                => [
				'id'          => ['type' => 'integer', 'required' => true,  'sanitize_callback' => 'absint'],
				'title'       => ['type' => 'string',  'required' => false, 'sanitize_callback' => 'sanitize_text_field'],
				'alt'         => ['type' => 'string',  'required' => false, 'sanitize_callback' => 'sanitize_text_field'],
				'caption'     => ['type' => 'string',  'required' => false, 'sanitize_callback' => 'sanitize_text_field'],
				'description' => ['type' => 'string',  'required' => false, 'sanitize_callback' => 'sanitize_textarea_field'],
			],
		]]);

	}

	// ── Handlers ─────────────────────────────────────────────────────────

	public function getTree(WP_REST_Request $request): WP_REST_Response
	{
		$orderBy = (string) $request->get_param('orderBy');
		$order   = (string) $request->get_param('order');
		$search  = trim((string) $request->get_param('search'));

		$tree = $search !== ''
			? $this->folderModel->search($search, $orderBy, $order)
			: $this->folderModel->getChildren(0, $orderBy, $order);

		if (is_wp_error($tree)) {
			return $this->errorResponse($tree);
		}

		$counts  = $this->getFolderAttachmentCounts();
		$folders = $this->attachCountsToFolders($tree, $counts);

		$data = [
			'folders'       => $folders,
			'totalFolders'  => count($this->folderModel->getAllFolders()),
			'allFiles'      => Attachment::get('all', true),
			'uncategorized' => Attachment::get('uncategorized', true),
		];

		return $this->successResponse($data, __('Folders retrieved successfully.', 'ninja-media'));
	}

	public function getFolderWithMedia(WP_REST_Request $request): WP_REST_Response
	{
		$folderId = (int) $request->get_param('id');
		$folder   = $this->folderModel->findById($folderId);

		if (is_wp_error($folder)) {
			return $this->errorResponse($folder);
		}

		if (!$folder) {
			return $this->errorResponse(__('Folder not found.', 'ninja-media'), 404);
		}

		$orderBy  = (string) $request->get_param('orderBy');
		$order    = (string) $request->get_param('order');
		$children = $this->folderModel->getChildren($folderId, $orderBy, $order);

		if (is_wp_error($children)) {
			return $this->errorResponse($children);
		}

		$counts      = $this->getFolderAttachmentCounts();
		$folders     = $this->attachCountsToFolders($children, $counts);
		$attachments = $this->getAttachmentsForFolder(
			$folderId,
			(int)    $request->get_param('page'),
			(int)    $request->get_param('perPage'),
			(string) $request->get_param('orderBy'),
			(string) $request->get_param('order')
		);

		$formattedItems = [];
		foreach ($attachments['items'] ?? [] as $item) {
			$formatted = BaseModel::formatAttachment((int) $item['ID']);
			if ($formatted) {
				$formattedItems[] = $formatted;
			}
		}

		$attachments['items'] = $formattedItems;

		return $this->successResponse([
			'currentFolder' => array_merge($folder, [
				'attachmentCount' => $counts[$folderId] ?? 0,
				'attachments'     => $attachments,
			]),
			'folders' => $folders,
		], __('Folder retrieved successfully.', 'ninja-media'));
	}

	public function getUnusedAttachments(WP_REST_Request $request): WP_REST_Response
	{
		$attachments = Attachment::get('unused', true);

		return $this->successResponse([
			'attachments' => $attachments,
			'totalFiles'  => count($attachments),
		], __('Unused attachments retrieved successfully.', 'ninja-media'));
	}

	public function clearUnusedAttachments(WP_REST_Request $request): WP_REST_Response
	{
		$trash       = $request->get_param('trash');
		$attachments = Attachment::get($trash ? 'trash' : 'unused');

		return $this->successResponse([
			'attachments' => $attachments,
			'totalFiles'  => count($attachments),
		], __('Unused attachments cleared successfully.', 'ninja-media'));
	}

	public function downloadFolder(WP_REST_Request $request): WP_REST_Response
	{
		$ids = $request->get_param('ids')
			? array_map('intval', (array) $request->get_param('ids'))
			: [(int) $request->get_param('id')];

		if (!class_exists('ZipArchive')) {
			return $this->errorResponse(__('ZIP functionality is not available on this server.', 'ninja-media'), 500);
		}

		$uploadDir = wp_upload_dir();
		$tmpDir    = $uploadDir['basedir'] . '/pnpnm-tmp';
		$zipName   = 'folders-' . implode('-', $ids) . '-' . time() . '.zip';
		$zipPath   = $tmpDir . '/' . $zipName;
		$zipUrl    = $uploadDir['baseurl'] . '/pnpnm-tmp/' . $zipName;

		if (!wp_mkdir_p($tmpDir)) {
			return $this->errorResponse(__('Failed to create temporary directory.', 'ninja-media'), 500);
		}

		$zip = new \ZipArchive();

		if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
			return $this->errorResponse(__('Failed to create ZIP archive.', 'ninja-media'), 500);
		}

		$added       = 0;
		$folderNames = [];

		foreach ($ids as $folderId) {
			$folder = $this->folderModel->findById($folderId);

			if (is_wp_error($folder) || !$folder) {
				continue;
			}

			$attachmentIds = $this->relationModel->getAttachmentIds($folderId);

			if (is_wp_error($attachmentIds) || empty($attachmentIds)) {
				continue;
			}

			$folderNames[] = $folder['name'];
			$folderZipDir  = sanitize_file_name($folder['name']) . '/';

			foreach ($attachmentIds as $attachmentId) {
				$filePath = get_attached_file((int) $attachmentId);

				if ($filePath && file_exists($filePath)) {
					$zip->addFile($filePath, $folderZipDir . basename($filePath));
					$added++;
				}
			}
		}

		$zip->close();

		if ($added === 0) {
			$this->getFilesystem()->delete($zipPath);

			return $this->errorResponse(__('No accessible files found in the selected folders.', 'ninja-media'), 404);
		}

		$zipLabel = count($ids) === 1
			? sanitize_file_name($folderNames[0] ?? 'folder')
			: 'folders-' . implode('-', $ids);

		return $this->successResponse([
			'url'     => $zipUrl,
			'name'    => $zipLabel . '.zip',
			'folders' => $folderNames,
			'count'   => $added,
		], __('Download ready.', 'ninja-media'));
	}

	public function getTrashedAttachments(WP_REST_Request $request): WP_REST_Response
	{
		$ids = array_map('intval', (array) $request->get_param('ids'));

		if (!Attachment::exists($ids)) {
			return $this->errorResponse(__('Attachment not found.', 'ninja-media'), 404);
		}

		return $this->successResponse([
			'attachments' => Attachment::get('trashed', false, $ids),
		], __('Trashed attachments retrieved successfully.', 'ninja-media'));
	}

	public function trashAttachments(WP_REST_Request $request): WP_REST_Response
	{
		$ids = array_map('intval', (array) $request->get_param('ids'));

		if (!Attachment::exists($ids)) {
			return $this->errorResponse(__('Attachment not found.', 'ninja-media'), 404);
		}

		$folderIds = $this->collectFolderIds($ids);
		$trashed   = [];

		foreach ($ids as $id) {
			$result = update_post_meta($id, '_pnpnm_media_trashed', '1');

			if (is_wp_error($result)) {
				return $this->errorResponse($result);
			}

			if ($result) {
				$trashed[] = $id;
			}
		}

		if (!empty($trashed)) {
			$this->invalidateCache();
		}

		$data = [
			'trashed'        => $trashed,
			'folders'        => $this->buildFolderRemainingCounts($folderIds),
			'uncategorized'  => Attachment::get('uncategorized', true),
			'trash'          => Attachment::get('trash', true),
			'unused'         => Attachment::get('unused', true),
			'allFiles'       => Attachment::get('all', true),
		];

		$data['dynamicFolders'] = Attachment::countDynamicFolders__premium_only();

		return $this->successResponse($data, __('Attachments moved to trash successfully.', 'ninja-media'));
	}

	public function restoreAttachments(WP_REST_Request $request): WP_REST_Response
	{
		$ids       = array_map('intval', (array) $request->get_param('ids'));
		$folderIds = [];
		$restored  = [];

		foreach ($ids as $id) {
			$folderId      = (int) get_post_meta($id, '_pnpnm_media_folder_id', true);
			$isExistFolder = $folderId > 0 ? $this->folderModel->findById($folderId) : null;

			if (is_wp_error($isExistFolder)) {
				return $this->errorResponse($isExistFolder);
			}

			if (!$isExistFolder) {
				delete_post_meta($id, '_pnpnm_media_folder_id');
			}

			if ($folderId > 0) {
				$folderIds[$folderId] = true;
			}
		}

		foreach ($ids as $id) {
			$result = delete_post_meta($id, '_pnpnm_media_trashed');

			if (is_wp_error($result)) {
				return $this->errorResponse($result);
			}

			if ($result) {
				$restored[] = $id;
			}
		}

		if (!empty($restored)) {
			$this->invalidateCache();
		}

		$data = [
			'restored'       => $restored,
			'count'          => count($restored),
			'folders'        => $this->buildFolderRemainingCounts(array_keys($folderIds)),
			'uncategorized'  => Attachment::get('uncategorized', true),
			'allFiles'       => Attachment::get('all', true),
			'trash'          => Attachment::get('trash', true),
			'unused'         => Attachment::get('unused', true),
		];

		$data['dynamicFolders'] = Attachment::countDynamicFolders__premium_only();

		return $this->successResponse($data, __('Attachments restored successfully.', 'ninja-media'));
	}

	public function toggleFavorite(WP_REST_Request $request): WP_REST_Response
	{
		$ids      = array_map('intval', (array) $request->get_param('ids'));
		$favorite = (bool) $request->get_param('favorite');
		$metaKey  = '_pnpnm_favorite_' . get_current_user_id();

		if (!Attachment::exists($ids)) {
			return $this->errorResponse(__('One or more attachments not found.', 'ninja-media'), 404);
		}

		foreach ($ids as $id) {
			if ($favorite) {
				update_post_meta($id, $metaKey, '1');
			} else {
				delete_post_meta($id, $metaKey);
			}
		}

		do_action('pnpnm_after_toggle_favorite', $ids, $favorite, get_current_user_id());

		$this->invalidateCache();

		return $this->successResponse([
			'ids'       => $ids,
			'favorite'  => $favorite,
			'favorites' => Attachment::get('favorites', true),
		], $favorite
			? __('Added to favorites.', 'ninja-media')
			: __('Removed from favorites.', 'ninja-media')
		);
	}

	public function duplicateAttachments(WP_REST_Request $request): WP_REST_Response
	{
		$ids        = array_map('intval', (array) $request->get_param('ids'));
		$duplicated = [];

		foreach ($ids as $id) {
			$result = $this->attachmentModel->duplicateAttachments__premium_only([$id]);

			if (is_wp_error($result)) {
				return $this->errorResponse($result);
			}

			if (!empty($result)) {
				$duplicated = array_merge($duplicated, $result);
			}
		}

		if (!empty($duplicated)) {
			$this->invalidateCache();
		}

		return $this->successResponse([
			'duplicated' => $duplicated,
			'total'      => count($duplicated),
			'allFiles'   => Attachment::get('all', true),
		], __('Attachments duplicated successfully.', 'ninja-media'));
	}

	// @end_fs_premium_only

	public function createFolder(WP_REST_Request $request): WP_REST_Response
	{
		$folder = $this->folderModel->create(
			(string) $request->get_param('name'),
			(int)    $request->get_param('parentId'),
			$request->get_param('color'),
			$request->get_param('icon'),
			get_current_user_id()
		);

		if (is_wp_error($folder)) {
			return $this->errorResponse($folder);
		}

		$this->invalidateCache();

		return $this->successResponse($folder, __('Folder created successfully.', 'ninja-media'));
	}

	public function deleteFolder(WP_REST_Request $request): WP_REST_Response
	{
		$ids           = $request->get_param('ids')
			? array_map('intval', (array) $request->get_param('ids'))
			: [(int) $request->get_param('id')];
		$isMediaDelete = (bool) $request->get_param('isMediaDelete');
		$allDeletedIds = [];
		$totalCleaned  = 0;

		foreach ($ids as $id) {
			delete_post_meta($id, '_pnpnm_media_folder_id');

			$deletedIds = $this->folderModel->delete($id);

			if (is_wp_error($deletedIds)) {
				return $this->errorResponse($deletedIds);
			}

			$cleaned = $this->relationModel->deleteByFolderIds($deletedIds, $isMediaDelete);

			if (is_wp_error($cleaned)) {
				return $this->errorResponse($cleaned);
			}

			$allDeletedIds = array_merge($allDeletedIds, $deletedIds);
			$totalCleaned += (int) $cleaned;
		}

		$this->invalidateCache();

		return $this->successResponse([
			'uncategorized'    => Attachment::get('uncategorized', true),
			'allFiles'         => Attachment::get('all', true),
			'deletedIds'       => array_values(array_unique($allDeletedIds)),
			'relationsRemoved' => $totalCleaned,
		], count($ids) > 1
			? __('Folders deleted successfully.', 'ninja-media')
			: __('Folder deleted successfully.', 'ninja-media')
		);
	}

	public function copyFolder(WP_REST_Request $request): WP_REST_Response
	{
		$ids          = $request->get_param('ids')
			? array_map('intval', (array) $request->get_param('ids'))
			: [(int) $request->get_param('id')];
		$parentId     = (int)  $request->get_param('parentId');
		$includeMedia = (bool) $request->get_param('includeMedia');
		$copied       = [];

		foreach ($ids as $id) {
			$result = $this->folderModel->copy($id, $parentId, $includeMedia, $this->relationModel);

			if (is_wp_error($result)) {
				return $this->errorResponse($result);
			}

			$copied[] = $result;
		}

		$this->invalidateCache();

		return $this->successResponse(
			['folders' => $copied],
			count($ids) > 1
				? __('Folders copied successfully.', 'ninja-media')
				: __('Folder copied successfully.', 'ninja-media')
		);
	}

	public function assignMedia(WP_REST_Request $request): WP_REST_Response
	{
		$folderId    = (int) $request->get_param('id');
		$attachments = array_map('absint', (array) $request->get_param('attachments'));

		$folder = $this->folderModel->findById($folderId);

		if (is_wp_error($folder)) {
			return $this->errorResponse($folder);
		}

		if (!$folder) {
			return $this->errorResponse(__('Folder not found.', 'ninja-media'), 404);
		}

		foreach ($attachments as $attachment_id) {
			if (!current_user_can('edit_post', $attachment_id)) {
				return $this->errorResponse(
					__('You do not have permission to move one or more of the selected files.', 'ninja-media'),
					self::HTTP_FORBIDDEN
				);
			}
		}

		$result = $this->relationModel->assignBatch($folderId, $attachments);

		if (is_wp_error($result)) {
			return $this->errorResponse($result);
		}

		$this->invalidateCache();

		return $this->successResponse([
			'assigned'           => $result['assigned'],
			'count'              => count($result['assigned']),
			'previousFolder'     => $result['previousFolder'],
			'uncategorizedCount' => Attachment::get('uncategorized', true),
			'total'              => $this->getAttachmentsForFolder($folderId, countOnly: true)['total'],
		], __('Media assigned successfully.', 'ninja-media'));
	}

	public function getFilesWithMedia(WP_REST_Request $request): WP_REST_Response
	{
		$type      = (string) $request->get_param('type');
		$extension = (string) $request->get_param('extension');
		$search    = trim((string) $request->get_param('search'));
		$page      = max(1, (int) $request->get_param('page'));
		$perPage   = max(1, min(200, (int) $request->get_param('perPage')));

		$result = $this->attachmentModel->query_paginated([
			'type'      => $type,
			'extension' => $extension,
			'search'    => $search,
			'order_by'  => (string) $request->get_param('orderBy'),
			'order'     => (string) $request->get_param('order'),
			'page'      => $page,
			'per_page'  => $perPage,
		]);

		$files    = [];
		$populate = true;

		if ($populate) {
			foreach ($result['ids'] as $attachmentId) {
				$formatted = BaseModel::formatAttachment($attachmentId);
				if ($formatted) {
					$files[] = $formatted;
				}
			}
		}

		$response = [
			'files'         => $files,
			'allFiles'      => Attachment::get('all', true),
			'uncategorized' => Attachment::get('uncategorized', true),
			'total'         => $result['total'],
			'page'          => $page,
			'perPage'       => $perPage,
			'totalPages'    => $perPage > 0 ? (int) ceil($result['total'] / $perPage) : 0,
		];
			

		return $this->successResponse($response, __('Attachments retrieved successfully.', 'ninja-media'));
	}

	public function deleteAttachments(WP_REST_Request $request): WP_REST_Response
	{
		$ids       = array_map('intval', (array) $request->get_param('ids'));
		$folderIds = $this->collectFolderIds($ids);
		$deleted   = [];

		foreach ($ids as $id) {
			$result = wp_delete_attachment($id, true);

			if (is_wp_error($result)) {
				return $this->errorResponse($result);
			}

			if ($result) {
				$deleted[] = $id;
			}
		}

		if (!empty($deleted)) {
			$this->invalidateCache();
		}

		$data = [
			'deleted'        => $deleted,
			'folders'        => $this->buildFolderRemainingCounts($folderIds),
			'uncategorized'  => Attachment::get('uncategorized', true),
			'allFiles'       => Attachment::get('all', true),
			'trash'          => Attachment::get('trash', true),
			'unused'         => Attachment::get('unused', true),
		];

		return $this->successResponse($data, __('Attachments deleted successfully.', 'ninja-media'));
	}

	// ── Private helpers ──────────────────────────────────────────────────

	private function attachCountsToFolders(array $folders, array $counts): array
	{
		$childFolderCounts = $this->getChildFolderCounts();

		return array_map(function (array $folder) use ($counts, $childFolderCounts) {
			$folder['attachmentCount'] = (int) ($counts[(int) $folder['id']] ?? 0);
			$folder['childFolders']    = (int) ($childFolderCounts[(int) $folder['id']] ?? 0);
			return $folder;
		}, $folders);
	}

	private function getChildFolderCounts(): array
	{
		$cacheKey = 'child_folder_counts:' . wp_cache_get_last_changed(self::CACHE_GROUP);
		$cached   = wp_cache_get($cacheKey, self::CACHE_GROUP);

		if ($cached !== false) {
			return $cached;
		}

		$result = $this->folderModel->getChildFolderCounts();
		wp_cache_set($cacheKey, $result, self::CACHE_GROUP);

		return $result;
	}

	private function getFolderAttachmentCounts(): array
	{
		return $this->relationModel->getCountsByFolder();
	}

	private function getAttachmentsForFolder(int $folderId, int $page = 1, int $perPage = 20, string $orderBy = 'lft', string $order = 'ASC', bool $countOnly = false): array
	{
		$orderByCol = self::ATTACHMENT_ORDER_BY_MAP[$orderBy] ?? 'p.post_date';

		return $this->relationModel->getPaginatedAttachments($folderId, $page, $perPage, $orderByCol, $order, $countOnly);
	}

	/**
	 * Collect unique folder IDs from an array of attachment IDs via post meta.
	 * Must be called before the attachments are deleted/trashed (meta is gone afterwards).
	 *
	 * @return int[]
	 */
	private function collectFolderIds(array $attachmentIds): array
	{
		$folderIds = [];
		foreach ($attachmentIds as $id) {
			$folderId = (int) get_post_meta($id, '_pnpnm_media_folder_id', true);
			if ($folderId > 0) {
				$folderIds[$folderId] = true;
			}
		}

		return array_keys($folderIds);
	}

	public function updateFileMetadata(WP_REST_Request $request): WP_REST_Response
	{
		$id          = absint($request->get_param('id'));
		$post        = get_post($id);

		if (!$post || 'attachment' !== $post->post_type) {
			return $this->errorResponse(__('Attachment not found.', 'ninja-media'), 404);
		}

		$update = ['ID' => $id];

		if (null !== $request->get_param('title')) {
			$update['post_title'] = sanitize_text_field($request->get_param('title'));
		}
		if (null !== $request->get_param('caption')) {
			$update['post_excerpt'] = sanitize_text_field($request->get_param('caption'));
		}
		if (null !== $request->get_param('description')) {
			$update['post_content'] = sanitize_textarea_field($request->get_param('description'));
		}

		if (count($update) > 1) {
			$result = wp_update_post($update, true);
			if (is_wp_error($result)) {
				return $this->errorResponse($result);
			}
		}

		if (null !== $request->get_param('alt')) {
			update_post_meta($id, '_wp_attachment_image_alt', sanitize_text_field($request->get_param('alt')));
		}

		do_action('pnpnm_file_metadata_updated', $id);

		$formatted = BaseModel::formatAttachment($id);

		return $this->successResponse($formatted, __('Metadata updated.', 'ninja-media'));
	}

	/**
	 * Build remaining-count entries for each folder after a batch operation.
	 *
	 * @param  int[] $folderIds
	 * @return array<array{id: int, remaining: int}>
	 */
	private function buildFolderRemainingCounts(array $folderIds): array
	{
		$folders = [];
		foreach ($folderIds as $folderId) {
			$folders[] = [
				'id'        => $folderId,
				'remaining' => $this->getAttachmentsForFolder($folderId, countOnly: true)['total'],
			];
		}

		return $folders;
	}
}
