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
