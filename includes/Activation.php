<?php

namespace Pninja\NM;

use Pninja\NM\Utils\Helpers;

defined('ABSPATH') || exit('No direct script access allowed');

class Activation
{
    public static function init( bool $network_wide = false ): void
    {
        if ( is_multisite() && $network_wide ) {
            $sites = get_sites( [ 'fields' => 'ids', 'number' => 0 ] );
            foreach ( $sites as $blog_id ) {
                switch_to_blog( $blog_id );
                self::activateSite();
                restore_current_blog();
            }
        } else {
            self::activateSite();
        }
    }

    public static function activateSite(): void
    {
        Helpers::checkPluginRequirements();
        $update = Update::getInstance();

        if ( $update->isUpdateAvailable() ) {
            $update->performUpdates();
        } else {
            self::setDefaultTable();
            self::setDefaultData();
            self::setDefaultSettings();
        }
    }

    private static function setDefaultTable()
    {
        global $wpdb;
        $wpdb->hide_errors();
        if (! function_exists('dbDelta')) {
            require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        }

        $tables = pnpnmGetFolderTable();

        foreach ($tables as $table) {
            dbDelta($table);
        }
    }

    private static function setDefaultData()
    {
        if (!get_option('pnpnm_version')) {
            update_option('pnpnm_version', PNPNM_VERSION);
        }

        if (!get_option('pnpnm_install_time')) {
            update_option('pnpnm_install_time', current_time('mysql'));
        }

        if (!get_option('pnpnm_db_version')) {
            update_option('pnpnm_db_version', PNPNM_DB_VERSION);
        }

        if (!get_option('pnpnm_first_installed_version')) {
            update_option('pnpnm_first_installed_version', PNPNM_VERSION);
        }

        if (!get_option('pnpnm_encryption_key')) {
            update_option('pnpnm_encryption_key', wp_generate_uuid4());
        }

        set_transient('pnpnm_rating-notice-interval', 'off', 10 * DAY_IN_SECONDS);
    }

    private static function setDefaultSettings()
    {
        if (!get_option(PNPNM_OPTIONS_NAME, false)) {
            update_option(PNPNM_OPTIONS_NAME, pnpnmGetDefaultSettings());
        }
    }

}
