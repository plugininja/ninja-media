<?php

namespace Pninja\NM;

defined('ABSPATH') || exit('No direct script access allowed');

use Pninja\NM\Modules\ImageEditor\EditorAdmin;
use Pninja\NM\Modules\ImageEditor\EditorREST;
use Pninja\NM\Modules\ImageOptimizer\Optimizer;
use Pninja\NM\Modules\ImageOptimizer\OptimizerAdmin;
use Pninja\NM\Modules\ImageOptimizer\OptimizerREST;
use Pninja\NM\Modules\ImageToolsAdmin;
use Pninja\NM\API\ApiRegistry;
use Pninja\NM\Utils\Singleton;

class Pninja
{
    use Singleton;

    public function __construct()
    {
        $this->init();
    }

    private function init()
    {

        if (is_multisite()) {
            add_action('wp_initialize_site', [ $this, 'onNewSite' ], 99);
            add_action('wp_delete_site', [ $this, 'onDeleteSite' ]);
        }

        Admin::getInstance();
        Enqueue::getInstance();
        MediaLibrary::getInstance();
        SvgSupport::getInstance();
        ApiRegistry::getInstance();
        ImageProcessor::getInstance();
        MediaEventListener::getInstance();
        ReviewBanner::getInstance();
        Abilities::getInstance();

        // Image Tools modules — constructors register all hooks.
        new ImageToolsAdmin();
        new OptimizerAdmin();
        new EditorAdmin();
        new OptimizerREST( new Optimizer() );
        new EditorREST();
        add_filter('plugin_action_links_' . plugin_basename(PNPNM_FILE), [$this, 'actionLinks']);

    }

    /**
     * Bootstraps the plugin on a newly created network site when the plugin
     * is network-activated.
     */
    public function onNewSite(\WP_Site $new_site): void
    {
        if (! $this->isNetworkActivated()) {
            return;
        }

        switch_to_blog((int) $new_site->blog_id);
        Activation::activateSite();
        restore_current_blog();
    }

    /**
     * Removes all plugin data for a network site that is being deleted.
     */
    public function onDeleteSite(\WP_Site $old_site): void
    {
        if (! $this->isNetworkActivated()) {
            return;
        }

        switch_to_blog((int) $old_site->blog_id);
        Deactivation::cleanupSite();
        restore_current_blog();
    }

    private function isNetworkActivated(): bool
    {
        if (! function_exists('is_plugin_active_for_network')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        return is_plugin_active_for_network(PNPNM_PLUGIN_BASE);
    }

    public function actionLinks($links)
    {
        $links[] = sprintf('<a href="%s">%s</a>', admin_url('admin.php?page=ninja-media'), esc_html__('Media Library', 'ninja-media'));

        return $links;
    }
}
