<?php

namespace Pninja\NM\API\Controllers;

use Pninja\NM\API\BaseController;
use Pninja\NM\Models\Attachment;
use Pninja\NM\Models\BaseModel;
use Pninja\NM\Models\Folder;
use Pninja\NM\Models\FolderRelationship;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

defined('ABSPATH') || exit('No direct script access allowed');

class MediaLibrary extends BaseController
{
    private Attachment $attachmentModel;
    private Folder $folderModel;
    private FolderRelationship $relationModel;

    private const CACHE_GROUP = 'pnpnm';

    private const ATTACHMENT_ORDER_BY_MAP = [
        'lft'        => 'p.post_date',
        'name'       => 'p.post_title',
        'createdAt'  => 'p.post_date',
        'id'         => 'p.ID',
    ];

    private const PAGINATION_ARGS = [
        'page'    => ['type' => 'integer', 'default' => 1,           'minimum' => 1],
        'perPage' => ['type' => 'integer', 'default' => 20,          'minimum' => 1, 'maximum' => 200],
        'orderBy' => ['type' => 'string',  'default' => 'sortOrder', 'enum'    => ['id', 'name', 'lft', 'sortOrder', 'createdAt', 'updatedAt']],
        'order'   => ['type' => 'string',  'default' => 'ASC',       'enum'    => ['ASC', 'DESC']],
    ];

    private function fs(): \WP_Filesystem_Base
    {
        global $wp_filesystem;

        if (empty($wp_filesystem)) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
            WP_Filesystem();
        }

        return $wp_filesystem;
    }

    public function __construct()
    {
        parent::__construct('ninja-media/v1', 'media-library');
        $this->attachmentModel = new Attachment();
        $this->folderModel     = new Folder();
        $this->relationModel   = new FolderRelationship();
    }

    public function register_routes(): void
    {
        // GET /media-library — folder tree with attachment counts
        register_rest_route($this->namespace, $this->rest_base, [[
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [$this, 'getTree'],
            'permission_callback' => [$this, 'checkPermission'],
            'args'                => array_merge(self::PAGINATION_ARGS, [
                'search' => [
                    'type'              => 'string',
                    'required'          => false,
                    'default'           => '',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ]),
        ]]);

        // GET /media-library/5 — tree + folder detail + its attachments
        register_rest_route($this->namespace, $this->rest_base . '/(?P<id>\d+)', [[
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [$this, 'getFolderWithMedia'],
            'permission_callback' => [$this, 'checkPermission'],
            'args'                => array_merge(
                ['id' => ['type' => 'integer', 'required' => true, 'sanitize_callback' => 'absint']],
                self::PAGINATION_ARGS
            ),
        ]]);

        // GET /media-library/unused - unused attachments
        register_rest_route($this->namespace, $this->rest_base . '/unused', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'getUnusedAttachments'],
                'permission_callback' => [$this, 'checkPermission'],
                'args'                => self::PAGINATION_ARGS,
            ],
            [
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => [$this, 'clearUnusedAttachments'],
                'permission_callback' => [$this, 'checkPermission'],
                'args'                => [
                    'ids'   => ['type' => 'array', 'required' => true, 'items' => ['type' => 'integer']],
                    'trash' => ['type' => 'boolean', 'default' => false],
                ],
            ],
        ]);

        // POST /media-library/folder — create folder
        register_rest_route($this->namespace, $this->rest_base . '/folder', [[
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'createFolder'],
            'permission_callback' => [$this, 'checkPermission'],
            'args'                => [
                'name'      => ['type' => 'string',  'required' => true,  'sanitize_callback' => 'sanitize_text_field'],
                'parentId'  => ['type' => 'integer', 'default'  => 0,     'sanitize_callback' => 'absint'],
                'color'     => ['type' => 'string',  'required' => false,  'sanitize_callback' => 'sanitize_hex_color'],
                'icon'      => ['type' => 'string',  'required' => false,  'sanitize_callback' => 'sanitize_text_field'],
            ],
        ]]);

        // GET | PATCH | DELETE /media-library/folder/<id>
        register_rest_route($this->namespace, $this->rest_base . '/folder', [
            [
                'methods'             => WP_REST_Server::EDITABLE,
                'callback'            => [$this, 'updateFolder'],
                'permission_callback' => [$this, 'checkPermission'],
                'args'                => [
                    'name'  => ['type' => 'string', 'required' => false, 'sanitize_callback' => 'sanitize_text_field'],
                    'color' => ['type' => 'string', 'required' => false, 'sanitize_callback' => 'sanitize_hex_color'],
                    'icon'  => ['type' => 'string', 'required' => false, 'sanitize_callback' => 'sanitize_text_field'],
                ],
            ],
            [
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => [$this, 'deleteFolder'],
                'permission_callback' => [$this, 'checkPermission'],
                'args'                => [
                    'ids' => ['type' => 'array', 'required' => false, 'items' => ['type' => 'integer']],
                ],
            ],
        ]);

        // POST /media-library/folder/move
        register_rest_route($this->namespace, $this->rest_base . '/folder/move', [[
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'moveFolder'],
            'permission_callback' => [$this, 'checkPermission'],
            'args'                => [
                'parentId' => ['type' => 'integer', 'required' => false,  'sanitize_callback' => 'absint'],
                'ids'      => ['type' => 'array',   'required' => false, 'items' => ['type' => 'integer']],
            ],
        ]]);

        // POST /media-library/folder/copy
        register_rest_route($this->namespace, $this->rest_base . '/folder/copy', [[
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'copyFolder'],
            'permission_callback' => [$this, 'checkPermission'],
            'args'                => [
                'parentId'     => ['type' => 'integer', 'required' => false, 'default' => 0, 'sanitize_callback' => 'absint'],
                'includeMedia' => ['type' => 'boolean', 'default'  => false],
                'ids'          => ['type' => 'array',   'required' => false, 'items' => ['type' => 'integer']],
            ],
        ]]);

        // GET /media-library/folder/download
        register_rest_route($this->namespace, $this->rest_base . '/folder/download', [[
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [$this, 'downloadFolder'],
            'permission_callback' => [$this, 'checkPermission'],
            'args'                => [
                'ids' => ['type' => 'array', 'required' => true, 'items' => ['type' => 'integer']],
            ],
        ]]);

        // POST /media-library/folder/<id>/assign
        register_rest_route($this->namespace, $this->rest_base . '/folder/(?P<id>\d+)/assign', [
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'assignMedia'],
                'permission_callback' => [$this, 'checkPermission'],
                'args'                => [
                    'attachments' => ['type' => 'array', 'required' => true, 'items' => ['type' => 'integer']],
                ],
            ],
        ]);

        // GET | POST | DELETE /media-library/trash
        register_rest_route($this->namespace, $this->rest_base . '/trash', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'getTrashedAttachments'],
                'permission_callback' => [$this, 'checkPermission'],
                'args'                => [
                    'ids' => ['type' => 'array', 'required' => false, 'items' => ['type' => 'integer']],
                ],
            ],
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'trashAttachments'],
                'permission_callback' => [$this, 'checkPermission'],
                'args'                => [
                    'ids' => ['type' => 'array', 'required' => true, 'items' => ['type' => 'integer']],
                ],
            ],

            [
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => [$this, 'deleteAttachments'],
                'permission_callback' => [$this, 'checkPermission'],
                'args'                => [
                    'ids' => ['type' => 'array', 'required' => true, 'items' => ['type' => 'integer']],
                ],
            ]
        ]);

        // POST /media-library/attachment/restore
        register_rest_route($this->namespace, $this->rest_base . '/restore', [
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'restoreAttachments'],
                'permission_callback' => [$this, 'checkPermission'],
                'args'                => [
                    'ids' => ['type' => 'array', 'required' => true, 'items' => ['type' => 'integer']],
                ],
            ],
        ]);

        // GET /media-library/breadcrumbs — given folder ID, return its breadcrumbs (id + name of each ancestor up to root)
        register_rest_route($this->namespace, $this->rest_base . '/breadcrumbs', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [$this, 'getBreadcrumbs'],
            'permission_callback' => [$this, 'checkPermission'],
            'args'                => [
                'id' => ['type' => 'integer', 'required' => false, 'sanitize_callback' => 'absint'],
            ],
        ]);

        // GET /media-library/files - helper for getFolderWithMedia() to retrieve paginated attachments for a folder
        register_rest_route($this->namespace, $this->rest_base . '/files', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [$this, 'getFilesWithMedia'],
            'permission_callback' => [$this, 'checkPermission'],
            'args'                => array_merge(
                [
                    'type'      => ['type' => 'string', 'required' => true, 'enum' => ['all', 'uncategorized', 'dynamic', 'unused', 'trash'], 'default' => 'all'],
                    'extension' => ['type' => 'string', 'required' => false, 'sanitize_callback' => 'sanitize_text_field'],
                    'orderBy'   => ['type' => 'string', 'default' => 'createdAt', 'enum' => ['name', 'size', 'createdAt', 'updatedAt']],
                    'order'     => ['type' => 'string', 'default' => 'DESC', 'enum' => ['ASC', 'DESC']],
                    'search'    => ['type' => 'string', 'required' => false, 'default' => '', 'sanitize_callback' => 'sanitize_text_field'],
                    'page'      => ['type' => 'integer', 'required' => false, 'default' => 1],
                    'perPage'   => ['type' => 'integer', 'required' => false, 'default' => 20],
                ]
            ),
        ]);
    }


    // ==========================================
    // HANDLERS
    // ==========================================
    public function getTree(WP_REST_Request $request): WP_REST_Response
    {
        $orderBy = (string) $request->get_param('orderBy');
        $order   = (string) $request->get_param('order');
        $search  = trim((string) $request->get_param('search'));

        if ($search !== '') {
            $tree = $this->folderModel->search($search, $orderBy, $order);
        } else {
            $tree = $this->folderModel->getChildren(0, $orderBy, $order);
        }

        if (is_wp_error($tree)) {
            return $this->errorResponse($tree);
        }

        $counts  = $this->getFolderAttachmentCounts();
        $folders = $this->attachCountsToFolders($tree, $counts);

        return $this->successResponse(['folders' => $folders, 'totalFolders' => count($this->folderModel->getAllFolders()), 'allFiles' => Attachment::get('all', true), 'uncategorized' => Attachment::get('uncategorized', true), 'trashed' => Attachment::get('trash', true), 'dynamicFolders' => Attachment::countDynamicFolders(), 'unused' => Attachment::get('unused', true)], __('Folders retrieved successfully.', 'ninja-media'));
    }

    public function getFolderWithMedia(WP_REST_Request $request): WP_REST_Response
    {
        $folderId = (int) $request->get_param('id');

        $folder = $this->folderModel->findById($folderId);

        if (is_wp_error($folder)) {
            return $this->errorResponse($folder);
        }

        if (!$folder) {
            return $this->errorResponse(__('Folder not found.', 'ninja-media'), 404);
        }

        // Only direct children of this folder — not the whole tree
        $orderBy  = (string) $request->get_param('orderBy');
        $order    = (string) $request->get_param('order');
        $children = $this->folderModel->getChildren($folderId, $orderBy, $order);

        if (is_wp_error($children)) {
            return $this->errorResponse($children);
        }

        $counts   = $this->getFolderAttachmentCounts();
        $folders  = $this->attachCountsToFolders($children, $counts);

        $attachments = $this->getAttachmentsForFolder(
            $folderId,
            (int) $request->get_param('page'),
            (int) $request->get_param('perPage'),
            (string) $request->get_param('orderBy'),
            (string) $request->get_param('order')
        );

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

        $attachments = Attachment::get('unused');
        $trash       = $request->get_param('trash');

        if ($trash) {
            $attachments = Attachment::get('trashed');
        }

        return $this->successResponse([
            'attachments' => $attachments,
            'totalFiles'  => count($attachments),
        ], __('Unused attachments cleared successfully.', 'ninja-media'));
    }

    public function createFolder(WP_REST_Request $request): WP_REST_Response
    {
        $folder = $this->folderModel->create(
            (string) $request->get_param('name'),
            (int) $request->get_param('parentId'),
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

    public function updateFolder(WP_REST_Request $request): WP_REST_Response
    {
        $id   = (int) $request->get_param('id');
        $data = array_filter([
            'name'  => $request->get_param('name'),
            'color' => $request->get_param('color'),
            'icon'  => $request->get_param('icon'),
        ], fn ($v) => $v !== null);

        if (empty($data)) {
            return $this->errorResponse(__('No valid fields provided.', 'ninja-media'), 422);
        }

        $result = $this->folderModel->update($id, $data);

        if (is_wp_error($result)) {
            return $this->errorResponse($result);
        }

        if ($result === null) {
            return $this->errorResponse(__('Folder not found.', 'ninja-media'), 404);
        }

        $this->invalidateCache();

        return $this->successResponse($result, __('Folder updated successfully.', 'ninja-media'));
    }

    public function deleteFolder(WP_REST_Request $request): WP_REST_Response
    {
        $ids           = $request->get_param('ids') ? array_map('intval', (array) $request->get_param('ids')) : [(int) $request->get_param('id')];
        $allDeletedIds = [];
        $totalCleaned  = 0;

        foreach ($ids as $id) {

            delete_post_meta($id, '_pnpnm_media_folder_id');
            $deletedIds = $this->folderModel->delete($id);

            if (is_wp_error($deletedIds)) {
                return $this->errorResponse($deletedIds);
            }

            $cleaned = $this->relationModel->deleteByFolderIds($deletedIds);

            if (is_wp_error($cleaned)) {
                return $this->errorResponse($cleaned);
            }

            $allDeletedIds = [...$allDeletedIds, ...$deletedIds];
            $totalCleaned += (int) $cleaned;
        }

        $this->invalidateCache();

        return $this->successResponse([
            'uncategorized'    => Attachment::get('uncategorized', true),
            'deletedIds'       => array_values(array_unique($allDeletedIds)),
            'relationsRemoved' => $totalCleaned,
        ], \count($ids) > 1 ? __('Folders deleted successfully.', 'ninja-media') : __('Folder deleted successfully.', 'ninja-media'));
    }

    public function moveFolder(WP_REST_Request $request): WP_REST_Response
    {
        $ids      = $request->get_param('ids') ? array_map('intval', (array) $request->get_param('ids')) : [(int) $request->get_param('id')];
        $parentId = (int) $request->get_param('parentId');

        foreach ($ids as $id) {
            $result = $this->folderModel->move($id, $parentId);

            if (is_wp_error($result)) {
                return $this->errorResponse($result);
            }
        }

        $this->invalidateCache();

        return $this->successResponse(['movedIds' => $ids], \count($ids) > 1 ? __('Folders moved successfully.', 'ninja-media') : __('Folder moved successfully.', 'ninja-media'));
    }

    public function copyFolder(WP_REST_Request $request): WP_REST_Response
    {
        $ids          = $request->get_param('ids') ? array_map('intval', (array) $request->get_param('ids')) : [(int) $request->get_param('id')];
        $parentId     = (int) $request->get_param('parentId');
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

        return $this->successResponse(['folders' => $copied], \count($ids) > 1 ? __('Folders copied successfully.', 'ninja-media') : __('Folder copied successfully.', 'ninja-media'));
    }

    public function downloadFolder(WP_REST_Request $request): WP_REST_Response
    {
        $ids = $request->get_param('ids') ? array_map('intval', (array) $request->get_param('ids')) : [(int) $request->get_param('id')];

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

            $folderNames[]  = $folder['name'];
            $folderZipDir   = sanitize_file_name($folder['name']) . '/';

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
            // Use WP_Filesystem->delete() instead of @unlink() to remove
            // the empty zip and avoid the @ error-suppression operator.
            $this->fs()->delete($zipPath);

            return $this->errorResponse(__('No accessible files found in the selected folders.', 'ninja-media'), 404);
        }

        $zipLabel = count($ids) === 1 ? sanitize_file_name($folderNames[0] ?? 'folder') : 'folders-' . implode('-', $ids);

        return $this->successResponse([
            'url'     => $zipUrl,
            'name'    => $zipLabel . '.zip',
            'folders' => $folderNames,
            'count'   => $added,
        ], __('Download ready.', 'ninja-media'));
    }

    public function assignMedia(WP_REST_Request $request): WP_REST_Response
    {
        $folderId = (int) $request->get_param('id');
        $folder   = $this->folderModel->findById($folderId);

        if (is_wp_error($folder)) {
            return $this->errorResponse($folder);
        }

        if (!$folder) {
            return $this->errorResponse(__('Folder not found.', 'ninja-media'), 404);
        }

        $result = $this->relationModel->assignBatch($folderId, (array) $request->get_param('attachments'));

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

    public function getTrashedAttachments(WP_REST_Request $request): WP_REST_Response
    {
        $ids = array_map('intval', (array) $request->get_param('ids'));

        $isExisting = Attachment::exists($ids);

        if (!$isExisting) {
            return $this->errorResponse(__('Attachment not found.', 'ninja-media'), 404);
        }

        $attachments = Attachment::get('trashed', false, $ids);

        return $this->successResponse([
            'attachments' => $attachments,
        ], __('Trashed attachments retrieved successfully.', 'ninja-media'));
    }

    public function trashAttachments(WP_REST_Request $request): WP_REST_Response
    {
        $ids = array_map('intval', (array) $request->get_param('ids'));

        $isExisting = Attachment::exists($ids);

        if (!$isExisting) {
            return $this->errorResponse(__('Attachment not found.', 'ninja-media'), 404);
        }

        // Collect unique folder IDs before any meta changes so nothing is missed.
        $folderIds = [];
        foreach ($ids as $id) {
            $folderId = (int) get_post_meta($id, '_pnpnm_media_folder_id', true);
            if ($folderId > 0) {
                $folderIds[$folderId] = true;
            }
        }

        $trashed = [];

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

        // Build remaining counts once per folder after all trash operations are done.
        $folders = [];
        foreach (array_keys($folderIds) as $folderId) {
            $folders[] = [
                'id'        => $folderId,
                'remaining' => $this->getAttachmentsForFolder($folderId, countOnly: true)['total'],
            ];
        }

        return $this->successResponse([
            'trashed'        => $trashed,
            'folders'        => $folders,
            'uncategorized'  => Attachment::get('uncategorized', true),
            'trash'          => Attachment::get('trash', true),
            'unused'         => Attachment::get('unused', true),
            'dynamicFolders' => Attachment::countDynamicFolders(),
            'allFiles'       => Attachment::get('all', true),
        ], __('Attachments moved to trash successfully.', 'ninja-media'));
    }

    public function deleteAttachments(WP_REST_Request $request): WP_REST_Response
    {
        $ids     = array_map('intval', (array) $request->get_param('ids'));
        $deleted = [];

        // Collect unique folder IDs before deletion — post meta is gone afterwards.
        $folderIds = [];
        foreach ($ids as $id) {
            $folderId = (int) get_post_meta($id, '_pnpnm_media_folder_id', true);
            if ($folderId > 0) {
                $folderIds[$folderId] = true;
            }
        }

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

        // Build remaining counts once per folder after all deletions are done.
        $folders = [];
        foreach (array_keys($folderIds) as $folderId) {
            $folders[] = [
                'id'        => $folderId,
                'remaining' => $this->getAttachmentsForFolder($folderId, countOnly: true)['total'],
            ];
        }

        return $this->successResponse([
            'deleted'        => $deleted,
            'count'          => count($deleted),
            'folders'        => $folders,
            'uncategorized'  => Attachment::get('uncategorized', true),
            'trash'          => Attachment::get('trash', true),
            'unused'         => Attachment::get('unused', true),
            'dynamicFolders' => Attachment::countDynamicFolders(),
            'allFiles'       => Attachment::get('all', true),
        ], __('Attachments deleted successfully.', 'ninja-media'));
    }

    public function restoreAttachments(WP_REST_Request $request): WP_REST_Response
    {
        $ids      = array_map('intval', (array) $request->get_param('ids'));
        $restored = [];

        // Collect unique folder IDs before restoring.
        $folderIds = [];
        foreach ($ids as $id) {

            $folderId = (int) get_post_meta($id, '_pnpnm_media_folder_id', true);

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

        $folders = [];
        foreach (array_keys($folderIds) as $folderId) {
            $folders[] = [
                'id'        => $folderId,
                'remaining' => $this->getAttachmentsForFolder($folderId, countOnly: true)['total'],
            ];
        }

        return $this->successResponse([
            'restored'       => $restored,
            'count'          => count($restored),
            'folders'        => $folders,
            'uncategorized'  => Attachment::get('uncategorized', true),
            'allFiles'       => Attachment::get('all', true),
            'trash'          => Attachment::get('trash', true),
            'unused'         => Attachment::get('unused', true),
            'dynamicFolders' => Attachment::countDynamicFolders(),
        ], __('Attachments restored from trash successfully.', 'ninja-media'));
    }

    public function getBreadcrumbs(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');

        if (empty($id)) {
            $children = $this->folderModel->getChildren(0);

            if (is_wp_error($children)) {
                return $this->errorResponse($children);
            }

            $counts  = $this->getFolderAttachmentCounts();
            $folders = $this->attachCountsToFolders($children, $counts);

            return $this->successResponse(['breadcrumbs' => [], 'folders' => $folders], __('Root folders retrieved successfully.', 'ninja-media'));
        }

        $folder = $this->folderModel->findById($id);

        if (is_wp_error($folder)) {
            return $this->errorResponse($folder);
        }

        if (!$folder) {
            return $this->errorResponse(__('Folder not found.', 'ninja-media'), 404);
        }

        $ancestors = $this->folderModel->getAncestors($id);

        if (is_wp_error($ancestors)) {
            return $this->errorResponse($ancestors);
        }

        $breadcrumbs   = array_map(fn ($f) => ['id' => (int) $f['id'], 'name' => $f['name']], $ancestors);
        $breadcrumbs[] = ['id' => (int) $folder['id'], 'name' => $folder['name']];

        return $this->successResponse(['breadcrumbs' => $breadcrumbs], __('Breadcrumbs retrieved successfully.', 'ninja-media'));
    }

    public function getFilesWithMedia(WP_REST_Request $request): WP_REST_Response
    {
        $type      = (string) $request->get_param('type');
        $extension = (string) $request->get_param('extension');
        $search    = trim((string) $request->get_param('search'));
        $page      = max(1, (int) $request->get_param('page'));
        $per_page  = max(1, min(200, (int) $request->get_param('perPage')));

        if ($type === 'dynamic' && $extension !== '' && ! in_array($extension, array_keys(Attachment::countDynamicFolders()), true)) {
            return $this->errorResponse(__('Invalid file extension filter.', 'ninja-media'), 422);
        }

        $result = $this->attachmentModel->query_paginated([
            'type'      => $type,
            'extension' => $extension,
            'search'    => $search,
            'order_by'  => (string) $request->get_param('orderBy'),
            'order'     => (string) $request->get_param('order'),
            'page'      => $page,
            'per_page'  => $per_page,
        ]);

        $files = [];
        foreach ($result['ids'] as $attachment_id) {
            $formatted = BaseModel::formatAttachment($attachment_id);
            if ($formatted) {
                $files[] = $formatted;
            }
        }

        return $this->successResponse(
            [
                'files'          => $files,
                'allFiles'       => Attachment::get('all', true),
                'uncategorized'  => Attachment::get('uncategorized', true),
                'dynamicFolders' => Attachment::countDynamicFolders(),
                'unused'         => Attachment::get('unused', true),
                'trash'          => Attachment::get('trash', true),
                'total'          => $result['total'],
                'page'           => $page,
                'perPage'        => $per_page,
                'totalPages'     => $per_page > 0 ? (int) ceil($result['total'] / $per_page) : 0,
            ],
            __('Attachments retrieved successfully.', 'ninja-media')
        );
    }

    // ==========================================
    // PRIVATE HELPERS
    // ==========================================

    private function invalidateCache(): void
    {
        wp_cache_delete('last_changed', self::CACHE_GROUP);
    }

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
        $cache_key = 'child_folder_counts:' . wp_cache_get_last_changed(self::CACHE_GROUP);
        $cached    = wp_cache_get($cache_key, self::CACHE_GROUP);

        if ($cached !== false) {
            return $cached;
        }

        $result = $this->folderModel->getChildFolderCounts();
        wp_cache_set($cache_key, $result, self::CACHE_GROUP);

        return $result;
    }

    private function getFolderAttachmentCounts(): array
    {
        return $this->relationModel->getCountsByFolder();
    }

    private function getAttachmentsForFolder(int $folderId, int $page = 1, int $perPage = 20, string $orderBy = 'lft', string $order = 'ASC', bool $countOnly = false): array
    {
        $orderByCol = self::ATTACHMENT_ORDER_BY_MAP[$orderBy] ?? 'p.post_date';

        return $this->relationModel->getPaginatedAttachments(
            $folderId,
            $page,
            $perPage,
            $orderByCol,
            $order,
            $countOnly
        );
    }
}
