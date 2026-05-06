<?php

namespace Pninja\NM;

defined('ABSPATH') or exit('No direct script access allowed');

class Autoload
{
    public static function register()
    {
        spl_autoload_register([self::class, 'loadClass']);
    }

    private static function loadClass($class)
    {
        $prefixes = self::getAutoloadPaths();

        foreach ($prefixes as $prefix => $dirs) {

            if (strpos($class, $prefix) !== 0) {
                continue;
            }

            $relativeClass = substr($class, strlen($prefix));
            $filePath      = str_replace('\\', DIRECTORY_SEPARATOR, $relativeClass) . '.php';

            foreach ($dirs as $dir) {
                $fullPath = rtrim($dir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $filePath;
                if (is_file($fullPath)) {
                    require_once $fullPath;

                    return;
                }
            }
        }
    }

    private static function getAutoloadPaths()
    {
        return [
            'Pninja\\NM\\Models\\'                           => [PNPNM_MODELS],
            'Pninja\\NM\\'                                   => [PNPNM_INCLUDES],
            'Pninja\\NM\\App\\'                              => [PNPNM_APP],
        ];
    }
}
