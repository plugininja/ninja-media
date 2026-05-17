<?php

namespace Pninja\NM;

use Pninja\NM\Utils\Helpers;
use Pninja\NM\Utils\Singleton;

defined('ABSPATH') || exit('No direct script access allowed');

/**
 * Handles image processing on upload:
 *   - Convert JPEG / PNG to WebP.
 *   - Generate all registered thumbnail sizes.
 *
 * Each feature is independently controlled by a plugin setting and
 * does nothing when its toggle is off.
 *
 * @package Pninja\NM
 * @since   1.0.0
 */
class ImageProcessor
{
	use Singleton;

	public function __construct()
	{
		add_filter('wp_generate_attachment_metadata', [$this, 'maybeGenerateThumbnails'], 20, 2);
	}

	public function maybeConvertToWebP__premium_only(array $upload, string $context): array
	{
		if ('sideload' === $context) {
			return $upload;
		}

		if (!Helpers::getSetting('advanced.imageProcessing.convertWebp', false)) {
			return $upload;
		}

		$mime = $upload['type'] ?? '';

		if (!in_array($mime, ['image/jpeg', 'image/png'], true)) {
			return $upload;
		}

		$editor = wp_get_image_editor($upload['file']);

		if (is_wp_error($editor)) {
			return $upload;
		}

		// Bail if the server's image library does not support WebP output.
		if (!$editor->supports_mime_type('image/webp')) {
			return $upload;
		}

		$webp_path = preg_replace('/\.(jpe?g|png)$/i', '.webp', $upload['file']);
		$result    = $editor->save($webp_path, 'image/webp');

		// $result['file'] is the basename; $result['path'] is the full path.
		if (is_wp_error($result) || empty($result['path']) || empty($result['file'])) {
			return $upload;
		}

		wp_delete_file($upload['file']);

		$upload['file'] = $result['path'];
		$upload['url']  = str_replace(
			wp_basename($upload['url']),
			$result['file'],
			$upload['url']
		);
		$upload['type'] = 'image/webp';

		return $upload;
	}

	public function maybeGenerateThumbnails(array $metadata, int $attachment_id): array
	{
		if (!Helpers::getSetting('advanced.imageProcessing.thumbnailGenerator', false)) {
			return $metadata;
		}

		// Only process images.
		if (empty($metadata['file'])) {
			return $metadata;
		}

		$file = get_attached_file($attachment_id);

		if (!$file || !file_exists($file)) {
			return $metadata;
		}

		$registered = wp_get_registered_image_subsizes();

		foreach ($registered as $size_name => $size_data) {
			// Skip sizes WordPress already generated.
			if (isset($metadata['sizes'][$size_name])) {
				continue;
			}

			$resized = image_make_intermediate_size(
				$file,
				$size_data['width'],
				$size_data['height'],
				$size_data['crop'] ?? false
			);

			if ($resized) {
				$metadata['sizes'][$size_name] = $resized;
			}
		}

		return $metadata;
	}
}
