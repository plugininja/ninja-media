<?php

namespace Pninja\NM;

defined('ABSPATH') || exit('No direct script access allowed');

use Pninja\NM\API\ApiRegistry;
use Pninja\NM\Utils\Singleton;

class Pninja
{
    use Singleton;

    public function __construct()
    {
        $this->init();
        $this->doHooks();
    }

    private function init()
    {
        register_activation_hook(PNPNM_FILE, [Activation::class, 'init']);
        register_deactivation_hook(PNPNM_FILE, [Deactivation::class, 'init']);

        Admin::getInstance();
        Enqueue::getInstance();
        MediaLibrary::getInstance();
        MediaEventListener::getInstance();
        ApiRegistry::getInstance();
    }

    private function doHooks()
    {
        add_filter('plugin_action_links_' . plugin_basename(PNPNM_FILE), [$this, 'actionLinks']);
    }

    public function actionLinks($links)
    {
        $links[] = sprintf(
            '<a href="%s">%s</a>',
            esc_url(admin_url('admin.php?page=' . PNPNM_SLUG . '#/files/all')),
            esc_html__('Media Library', 'ninja-media')
        );

        return $links;
    }
}
