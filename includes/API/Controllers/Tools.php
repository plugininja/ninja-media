<?php

namespace Pninja\NM\API\Controllers;

use Pninja\NM\API\BaseController;
use WP_Query;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

defined('ABSPATH') || exit('No direct script access allowed');

/**
 * REST controller for plugin tools (thumbnail generation, etc.).
 *
 * @package Pninja\NM\API\Controllers
 * @since   1.0.0
 */
class Tools extends BaseController
{
	public function __construct()
	{
		parent::__construct('ninja-media/v1', 'tools');
	}

	public function register_routes(): void
	{
		register_rest_route($this->namespace, $this->rest_base . '/thumbnails/count', [
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => [$this, 'getThumbnailCount'],
			'permission_callback' => [$this, 'checkPermission'],
		]);

		register_rest_route($this->namespace, $this->rest_base . '/thumbnails/generate', [
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => [$this, 'generateThumbnails'],
			'permission_callback' => [$this, 'checkPermission'],
			'args'                => [
				'offset'     => [
					'required'          => false,
					'type'              => 'integer',
					'default'           => 0,
					'description'       => __('Starting offset for batch processing.', 'ninja-media'),
					'sanitize_callback' => 'absint',
					'validate_callback' => fn($value) => is_numeric($value),
				],
				'batch_size' => [
					'required'          => false,
					'type'              => 'integer',
					'default'           => 5,
					'description'       => __('Number of images to process per batch.', 'ninja-media'),
					'sanitize_callback' => 'absint',
					'validate_callback' => fn($value) => is_numeric($value),
				],
			],
		]);
	}

	/**
	 * Return the total count of image attachments eligible for thumbnail generation.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response
	 */
	public function getThumbnailCount(WP_REST_Request $request): WP_REST_Response
	{
		try {
			$query = new WP_Query([
				'post_type'      => 'attachment',
				'post_mime_type' => ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
				'post_status'    => 'inherit',
				'posts_per_page' => -1,
				'fields'         => 'ids',
			]);

			return $this->successResponse([
				'total' => (int) $query->found_posts,
			]);

		} catch (\Exception $e) {
			return $this->handleException($e, __('Failed to retrieve image count.', 'ninja-media'));
		}
	}

	/**
	 * Generate thumbnails for a batch of image attachments.
	 *
	 * Processes `batch_size` images starting at `offset` and returns the new
	 * offset plus the running total so the client can page through all images.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response
	 */
	public function generateThumbnails(WP_REST_Request $request): WP_REST_Response
	{
		try {
			$offset     = (int) $request->get_param('offset');
			$batch_size = min((int) $request->get_param('batch_size'), 10);

			$query = new WP_Query([
				'post_type'      => 'attachment',
				'post_mime_type' => ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
				'post_status'    => 'inherit',
				'posts_per_page' => $batch_size,
				'offset'         => $offset,
				'fields'         => 'ids',
				'no_found_rows'  => false,
			]);

			$total     = (int) $query->found_posts;
			$ids       = $query->posts;
			$processed = 0;

			if (!function_exists('wp_generate_attachment_metadata')) {
				require_once ABSPATH . 'wp-admin/includes/image.php';
			}

			foreach ($ids as $attachment_id) {
				$file = get_attached_file($attachment_id);

				if (!$file || !file_exists($file)) {
					$processed++;
					continue;
				}

				$metadata = wp_generate_attachment_metadata($attachment_id, $file);

				if (!is_wp_error($metadata) && !empty($metadata)) {
					wp_update_attachment_metadata($attachment_id, $metadata);
				}

				$processed++;
			}

			$new_offset  = $offset + $processed;
			$is_complete = empty($ids) || $new_offset >= $total;

			do_action('pnpnm_after_thumbnails_batch', $new_offset, $total, $is_complete);

			return $this->successResponse([
				'processed'   => $processed,
				'offset'      => $new_offset,
				'total'       => $total,
				'is_complete' => $is_complete,
			]);

		} catch (\Exception $e) {
			return $this->handleException($e, __('Failed to generate thumbnails.', 'ninja-media'));
		}
	}
}
