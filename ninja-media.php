<?php

/*
 * Plugin Name:       Ninja Media
 * Plugin URI:        https://plugininja.com/ninja-media/
 * Description:       Ninja Media: a user-friendly WordPress plugin for managing and organizing media files with folders, SVG support, and bulk media tools.
 * Version:           1.0.1
 * Requires at least: 6.2
 * Requires PHP:      7.4
 * Author:            PluginInja
 * Author URI:        https://plugininja.com/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       ninja-media
 * Domain Path:       /languages
 */

namespace Pninja\NM;

defined('ABSPATH') || exit('No direct script access allowed');

if (function_exists(__NAMESPACE__ . '\\pnpnm_fs')) {

    pnpnm_fs()->set_basename(true, __FILE__);

} else {

    if (! function_exists(__NAMESPACE__ . '\\pnpnm_fs')) {

        function pnpnm_fs()
        {
            global $pnpnm_fs;

            if (! class_exists('Freemius')) {
                require_once dirname(__FILE__) . '/freemius/start.php';
            }

            $pnpnm_fs = fs_dynamic_init([
                'id'                          => '28374',
                'slug'                        => 'ninja-media',
                'premium_slug'                => 'ninja-media-premium',
                'type'                        => 'plugin',
                'public_key'                  => 'pk_49b852237b037d26417526664d92e',
                'is_premium'          => false,
                'premium_suffix'      => "Premium",
                'has_addons'                  => false,
                'has_paid_plans'              => true,
                'is_org_compliant'            => true,
                'has_affiliation'             => 'selected',
                'menu'                        => [
                    'slug'           => 'ninja-media',
                ]
            ]);

            return $pnpnm_fs;
        }

        pnpnm_fs();
        do_action('pnpnm_loaded');
    }

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
    Pninja::getInstance();
}
