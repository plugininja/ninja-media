<?php

namespace Pninja\NM\API;

use Pninja\NM\API\Contracts\FolderModelInterface;
use Pninja\NM\API\Contracts\RelationModelInterface;
use WP_REST_Request;
use WP_REST_Response;

defined('ABSPATH') || exit('No direct script access allowed');

/**
 * Abstract base for folder-based REST controllers.
 *
 * Houses the handler methods that are identical across the media-library
 * and post-type-library controllers: updateFolder, moveFolder, getBreadcrumbs,
 * and the shared cache-invalidation helper.
 *
 * Subclasses must supply their concrete folder/relation models and implement
 * the two small hooks that differ between the two contexts:
 *  - getFolderById()              — PostTypeLibrary passes postType; MediaLibrary doesn't.
 *  - buildRootBreadcrumbResponse() — each context enriches folders differently.
 *
 * @package Pninja\NM\API
 * @since   1.0.0
 */
abstract class BaseFolderController extends BaseController
{
	private const CACHE_GROUP = 'pnpnm';

	// ── Abstract model accessors ─────────────────────────────────────────

	abstract protected function getFolderModel(): FolderModelInterface;

	abstract protected function getRelationModel(): RelationModelInterface;

	// ── Abstract context hooks ───────────────────────────────────────────

	/**
	 * Resolve a folder by ID, with any context-specific scoping (e.g. postType).
	 */
	abstract protected function getFolderById(int $id, WP_REST_Request $request): array|null|\WP_Error;

	/**
	 * Build the breadcrumbs response for the root level (id = 0 / empty).
	 * Each context enriches the folder list differently (attachment counts vs post counts).
	 */
	abstract protected function buildRootBreadcrumbResponse(WP_REST_Request $request): WP_REST_Response;

	// ── Shared handlers ──────────────────────────────────────────────────

	/**
	 * PATCH /…/folder  — update name, color, or icon.
	 */
	public function updateFolder(WP_REST_Request $request): WP_REST_Response
	{
		$id   = (int) $request->get_param('id');
		$data = array_filter([
			'name'  => $request->get_param('name'),
			'color' => $request->get_param('color'),
			'icon'  => $request->get_param('icon'),
		], fn($v) => $v !== null);

		if (empty($data)) {
			return $this->errorResponse(__('No valid fields provided.', 'ninja-media'), 422);
		}

		$result = $this->getFolderModel()->update($id, $data);

		if (is_wp_error($result)) {
			return $this->errorResponse($result);
		}

		if ($result === null) {
			return $this->errorResponse(__('Folder not found.', 'ninja-media'), 404);
		}

		$this->invalidateCache();

		return $this->successResponse($result, __('Folder updated successfully.', 'ninja-media'));
	}

	/**
	 * POST /…/folder/move  — move one or more folders to a new parent.
	 */
	public function moveFolder(WP_REST_Request $request): WP_REST_Response
	{
		$ids      = $request->get_param('ids')
			? array_map('intval', (array) $request->get_param('ids'))
			: [(int) $request->get_param('id')];
		$parentId = (int) $request->get_param('parentId');

		foreach ($ids as $id) {
			$result = $this->getFolderModel()->move($id, $parentId);

			if (is_wp_error($result)) {
				return $this->errorResponse($result);
			}
		}

		$this->invalidateCache();

		return $this->successResponse(
			['movedIds' => $ids],
			count($ids) > 1
				? __('Folders moved successfully.', 'ninja-media')
				: __('Folder moved successfully.', 'ninja-media')
		);
	}

	/**
	 * GET /…/breadcrumbs  — ancestor breadcrumb trail for a given folder.
	 */
	public function getBreadcrumbs(WP_REST_Request $request): WP_REST_Response
	{
		$id = (int) $request->get_param('id');

		if (empty($id)) {
			return $this->buildRootBreadcrumbResponse($request);
		}

		$folder = $this->getFolderById($id, $request);

		if (is_wp_error($folder)) {
			return $this->errorResponse($folder);
		}

		if (!$folder) {
			return $this->errorResponse(__('Folder not found.', 'ninja-media'), 404);
		}

		$ancestors = $this->getFolderModel()->getAncestors($id);

		if (is_wp_error($ancestors)) {
			return $this->errorResponse($ancestors);
		}

		$breadcrumbs   = array_map(fn($f) => ['id' => (int) $f['id'], 'name' => $f['name']], $ancestors);
		$breadcrumbs[] = ['id' => (int) $folder['id'], 'name' => $folder['name']];

		return $this->successResponse(
			['breadcrumbs' => $breadcrumbs],
			__('Breadcrumbs retrieved successfully.', 'ninja-media')
		);
	}

	// ── Shared helpers ───────────────────────────────────────────────────

	protected function invalidateCache(): void
	{
		wp_cache_delete('last_changed', self::CACHE_GROUP);
	}
}
