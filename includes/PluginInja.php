<?php
namespace PluginInja\NM;

defined('ABSPATH') || exit('No direct script access allowed');

use PluginInja\NM\API\ApiRegistry;
use PluginInja\NM\Utils\Singleton;

class PluginInja
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
        $links[] = sprintf( '<a href="%s">%s</a>', admin_url('media.php?page=ninja-media'), esc_html__('Media Library', 'ninja-media') );

        return $links;
    }
}
