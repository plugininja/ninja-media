<?php
/**
 * Trait WpFilesystem
 *
 * @package Pninja\NM\Utils
 * @license GPL-2.0-or-later
 */
namespace Pninja\NM\Utils;

defined('ABSPATH') || exit('No direct script access allowed');

trait WpFilesystem {

	private function fs(): \WP_Filesystem_Base {
		global $wp_filesystem;

		if (empty($wp_filesystem)) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
			WP_Filesystem();
		}

		return $wp_filesystem;
	}
}
