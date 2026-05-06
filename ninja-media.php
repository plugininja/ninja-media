<?php

namespace Pninja\NM;

defined('ABSPATH') || exit('No direct script access allowed');

/*
 * Plugin Name:       Ninja Media
 * Plugin URI:        https://plugininja.com/ninja-media/
 * Description:       Ninja Media: a user-friendly WordPress plugin for managing and organizing media files with folders, watermarks, replace media, and SVG support.
 * Version:           1.0.0
 * Requires at least: 6.6
 * Tested up to:      6.9
 * Requires PHP:      7.4
 * Author:            Pninja
 * Author URI:        https://plugininja.com/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       ninja-media
 * Domain Path:       /languages
 */
if (!class_exists('Pninja\NM\Autoload')) {

    define('PNPNM_FILE', __FILE__);

    require_once plugin_dir_path(PNPNM_FILE) . 'core/config.php';
    require_once plugin_dir_path(PNPNM_FILE) . 'core/functions.php';

    if (
        version_compare(PHP_VERSION, PNPNM_PHP_VERSION, '<')
        || version_compare(get_bloginfo('version'), PNPNM_WP_VERSION, '<')
    ) {
        add_action('admin_notices', function () {
            echo '<div class="notice notice-error"><p>'
                . esc_html(
                    sprintf(
                        /* translators: 1: required PHP version, 2: required WordPress version */
                        __('Ninja Media requires PHP %1$s+ and WordPress %2$s+. Please upgrade to use this plugin.', 'ninja-media'),
                        PNPNM_PHP_VERSION,
                        PNPNM_WP_VERSION
                    )
                )
                . '</p></div>';
        });
        return;
    }

    $pnpnm_include_files = [
        'Autoload',
    ];

    foreach ($pnpnm_include_files as $pnpnm_include_file) {
        $pnpnm_include_file = PNPNM_INCLUDES . '/' . $pnpnm_include_file . '.php';
        if (file_exists($pnpnm_include_file)) {
            require_once $pnpnm_include_file;
        }
    }

    Autoload::register();
    Pninja::getInstance();
}
