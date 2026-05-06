<?php

namespace Pninja\NM;

use Pninja\NM\Utils\Helpers;
use Pninja\NM\Utils\Singleton;

defined('ABSPATH') || exit;

class Update
{
    use Singleton;

    public const MIGRATION_KEYS = [];

    private static $update_list = [];

    public function __construct()
    {
    }

    public function checkUpdates(): void
    {
        if ($this->isUpdateAvailable()) {
            $this->performUpdates();
        }
    }

    public function isUpdateAvailable(): bool
    {
        $installedVersion = Helpers::getInstalledVersion();

        if (!$installedVersion) {
            return false;
        }

        foreach (self::$update_list as $version) {
            if (version_compare($version, $installedVersion, '>') && version_compare($version, PNPNM_VERSION, '<=')
            ) {
                return true;
            }
        }

        return false;
    }

    public function performUpdates(): void
    {
        $installedVersion = Helpers::getInstalledVersion();

        foreach (self::$update_list as $version) {
            if (version_compare($version, $installedVersion, '>') &&
                version_compare($version, PNPNM_VERSION, '<=')) {
                $filePath = PNPNM_UPDATES . "/class-update-$version.php";

                if (file_exists($filePath)) {
                    include_once $filePath;
                    if (class_exists("Pninja\\NM\\Updates\\Update_" . str_replace('.', '_', $version))) {
                        $updateClass    = "Pninja\\NM\\Updates\\Update_" . str_replace('.', '_', $version);
                        $updateInstance = $updateClass::getInstance();
                        $update         = $updateInstance->run_update();
                        if (is_wp_error($update) || empty($update)) {
                            break;
                        }

                        if ($update && method_exists($updateInstance, 'run_update')) {
                            update_option('pnpnm_version', $version);
                        }
                    }
                }
            }
        }

        update_option('pnpnm_version', PNPNM_VERSION);
    }

}
