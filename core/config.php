<?php

defined('ABSPATH') || exit('No direct script access allowed');

/**
 * Plugin version information
 */
define('PNPNM_DB_VERSION', '1.0.0');
define('PNPNM_OPTIONS_VERSION', '1.0.0');
define('PNPNM_PLUGIN_BASE', plugin_basename(PNPNM_FILE));

define('PNPNM_VERSION', '1.0.3');

/**
 * Plugin URLs
 */
define('PNPNM_URL', plugin_dir_url(PNPNM_FILE));
define('PNPNM_ASSETS', PNPNM_URL . 'assets');
define('PNPNM_PLUGIN_URL', 'https://plugininja.com/ninja-media/');
define('PNPNM_INCLUDES_URL', PNPNM_URL . 'includes');
define('PNPNM_INTEGRATIONS_URL', PNPNM_INCLUDES_URL . '/Integrations');

/**
 * Plugin directory paths
 */
define('PNPNM_PATH', plugin_dir_path(PNPNM_FILE));
define('PNPNM_INCLUDES', PNPNM_PATH . 'includes');
define('PNPNM_MODELS', PNPNM_PATH . 'models');
define('PNPNM_UPDATES', PNPNM_INCLUDES . '/Updates');

/**
 * Plugin author information
 */
define('PNPNM_AUTHOR', 'PluginInja');
define('PNPNM_AUTHOR_URL', 'https://plugininja.com/');

/**
 * Plugin localization
 */
define('PNPNM_TEXTDOMAIN', 'ninja-media');
define('PNPNM_TEXTDOMAIN_PATH', dirname(plugin_basename(PNPNM_FILE)) . '/languages/');

/**
 * Plugin naming and slug
 */
define('PNPNM_NAME', 'Ninja Media');
define('PNPNM_OPTIONS_NAME', 'pnpnm_settings');
define('PNPNM_SLUG', PNPNM_TEXTDOMAIN);

/**
 * Plugin minimum requirements
 */
define('PNPNM_PHP_VERSION', '7.4');
define('PNPNM_WP_VERSION', '6.2');

/**
 * Plugin database
 */
define('PNPNM_DB_PREFIX', 'pnpnm_');

define('PNPNM_UNSET', '[unset]');

/**
 * Plugin documentation URL
 */
define('PNPNM_DOCUMENTATION_URL', 'https://plugininja.com/docs-category/ninja-media/');
