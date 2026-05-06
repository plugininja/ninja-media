<?php

namespace Pninja\NM\Utils;

use function is_array;
use function sprintf;

defined('ABSPATH') || exit();

class Helpers
{
    public static function deactivateAndNotify($message)
    {
        deactivate_plugins(plugin_basename(PNPNM_FILE));
        wp_die(
            sprintf(
                '<p>%s</p><p><a href="%s">%s</a></p>',
                esc_html($message),
                esc_url(admin_url('plugins.php')),
                esc_html__('Return to the Plugins page', 'ninja-media')
            ),
            esc_html__('Plugin Activation Failed', 'ninja-media'),
            ['back_link' => true]
        );
    }

    public static function checkPluginRequirements()
    {
        if (version_compare(get_bloginfo('version'), PNPNM_WP_VERSION, '<')) {
            self::deactivateAndNotify(
                sprintf(
                    /* translators: %s: Minimum required WordPress version number */
                    __('WordPress version %s or higher is required.', 'ninja-media'),
                    PNPNM_WP_VERSION
                )
            );
        }

        if (version_compare(PHP_VERSION, PNPNM_PHP_VERSION, '<')) {
            self::deactivateAndNotify(
                sprintf(
                    /* translators: %s: Minimum required PHP version number */
                    __('PHP version %s or higher is required.', 'ninja-media'),
                    PNPNM_PHP_VERSION
                )
            );
        }
    }

    public static function getVersion()
    {
        return PNPNM_VERSION;
    }

    public static function getPluginName()
    {
        return PNPNM_NAME;
    }

    public static function getPluginSlug()
    {
        return 'ninja-media';
    }

    public static function getPluginFile()
    {
        return PNPNM_FILE;
    }

    public static function getPluginPath()
    {
        return PNPNM_PATH;
    }

    public static function getPluginUrl()
    {
        return PNPNM_URL;
    }

    public static function getPluginTextDomain()
    {
        return 'ninja-media';
    }

    public static function getPluginTextDomainPath()
    {
        return dirname(plugin_basename(PNPNM_FILE)) . '/languages/';
    }

    public static function getInstalledVersion()
    {
        return get_option('pnpnm_version', '0.0.0');
    }

    public static function getInstallTime()
    {
        return get_option('pnpnm_install_time');
    }

    public static function getSettings()
    {
        $settings = get_option(PNPNM_OPTIONS_NAME, false);

        if (! $settings || ! is_array($settings)) {
            return pnpnmGetDefaultSettings();
        }

        return $settings;
    }

    public static function getSetting($key = null, $defaultValue = null)
    {
        $settings = self::getSettings();

        if ($key === null) {
            return $settings;
        }

        if (strpos($key, '.') !== false) {
            $keys  = explode('.', $key);
            $value = $settings;

            foreach ($keys as $innerKey) {
                if (!is_array($value) || !array_key_exists($innerKey, $value)) {
                    return $defaultValue;
                }
                $value = $value[$innerKey];
            }

            return $value;
        }

        return $settings[$key] ?? $defaultValue;
    }


    public static function updateSettings($data)
    {
        $data = self::sanitization($data);

        return update_option(PNPNM_OPTIONS_NAME, $data);
    }

    private static function sanitize_nested_array($data)
    {
        $sanitize_data = [];

        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $sanitize_data[$key] = sanitize_text_field(wp_unslash($value));
            } elseif (is_array($value)) {
                $sanitize_data[$key] = self::sanitize_nested_array($value);
            }
        }

        return $sanitize_data;
    }

    public static function sanitization($data)
    {
        $sanitize_data = '';

        if (is_array($data)) {

            $sanitize_data = self::sanitize_nested_array($data);
        } elseif (is_string($data)) {

            $sanitize_data = sanitize_text_field(wp_unslash($data));
        }

        return $sanitize_data;
    }
}
