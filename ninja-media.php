<?php

namespace PluginInja\NM;

defined('ABSPATH') || exit('No direct script access allowed');

/*
 * Plugin Name:       Ninja Media
 * Plugin URI:        https://plugininja.com/ninja-media/
 * Description:       Ninja Media: user-friendly WordPress plugin for managing and organizing media files with cloud storage support.
 * Version:           1.0.0
 * Requires at least: 6.2
 * Tested up to:      6.9
 * Requires PHP:      7.4
 * Author:            PluginInja
 * Author URI:        https://plugininja.com/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       ninja-media
 * Domain Path:       /languages
 */
if (!class_exists('PluginInja\NM\Autoload')) {

    define('PNPNM_FILE', __FILE__);

    require_once plugin_dir_path(PNPNM_FILE) . 'core/config.php';
    require_once plugin_dir_path(PNPNM_FILE) . 'core/functions.php';

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
    PluginInja::getInstance();
}
