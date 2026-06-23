<?php
/**
 * Class Enqueue
 *
 * @package Pninja\NM
 * @license GPL-2.0-or-later
 */
namespace Pninja\NM;

use Pninja\NM\Modules\ImageEditor\EditorAdmin;
use Pninja\NM\Modules\ImageOptimizer\OptimizerAdmin;
use Pninja\NM\Modules\ImageToolsAdmin;
use Pninja\NM\Utils\Helpers;
use Pninja\NM\Utils\Singleton;

defined('ABSPATH') || exit('No direct script access allowed');

class Enqueue
{
    use Singleton;

    /**
     * Resolved CDN base URL, or empty string when no CDN is configured.
     * Set once per request in doHooks() to avoid repeated option reads.
     */
    private string $cdnBase = '';

    public function doHooks(): void
    {
        $this->cdnBase = $this->resolveCdnBase();

        add_action('admin_enqueue_scripts', [$this, 'adminEnqueue']);
        add_action('wp_enqueue_scripts', [$this, 'frontendEnqueue']);
        add_action('elementor/editor/after_enqueue_scripts', [$this, 'elementorEditorEnqueue']);
    }

    /**
     * Rewrite a local plugin asset URL to the CDN URL when a CDN base is configured.
     *
     * Third-party code can override this entirely via the `pnpnm_asset_url` filter:
     *
     *   add_filter( 'pnpnm_asset_url', function( $url, $relative ) {
     *       return 'https://cdn.example.com/plugins/ninja-media/' . $relative;
     *   }, 10, 2 );
     *
     * @param string $url      Full local asset URL.
     * @param string $relative Relative path inside the assets/ directory (e.g. "js/admin.js").
     * @return string
     */
    public function assetUrl(string $url, string $relative = ''): string
    {
        if ($this->cdnBase && $relative) {
            $cdn = trailingslashit($this->cdnBase) . ltrim($relative, '/');
        } else {
            $cdn = $url;
        }

        /**
         * Filter any plugin asset URL before it is registered/enqueued.
         *
         * @param string $cdn      Resolved URL (CDN or local).
         * @param string $relative Relative asset path, e.g. "css/media-library.css".
         */
        return (string) apply_filters('pnpnm_asset_url', $cdn, $relative);
    }

    /**
     * Determine the CDN base URL from settings or the `pnpnm_cdn_base` filter.
     *
     * @return string CDN base URL without trailing slash, or '' if not configured.
     */
    private function resolveCdnBase(): string
    {
        $settings = get_option(PNPNM_OPTIONS_NAME, []);
        $base     = $settings['advanced']['cdn']['baseUrl'] ?? '';

        /**
         * Override or set the CDN base URL programmatically.
         *
         * @param string $base  Value from settings (may be empty).
         */
        $base = (string) apply_filters('pnpnm_cdn_base', $base);

        return esc_url_raw(rtrim($base, '/'));
    }

    protected function register_script(string $handle, string $src, array $deps = [], string $ver = PNPNM_VERSION, bool $in_footer = true): void
    {
        wp_register_script($handle, $src, $deps, $ver, $in_footer);
    }

    protected function register_style(string $handle, string $src, array $deps = [], string $ver = PNPNM_VERSION, bool $rtl = false): void
    {
        wp_register_style($handle, $src, $deps, $ver);
        if ($rtl) {
            wp_style_add_data($handle, 'rtl', 'replace');
        }
    }

    private function style(string $handle, array $deps = [], array $args = []): void
    {
        $args = wp_parse_args($args, [
            'ver'     => PNPNM_VERSION,
            'folder'  => 'css',
            'type'    => 'enqueue',
            'nesting' => false,
        ]);

        $folder    = $args['nesting'] ? "css/{$handle}" : $args['folder'];
        $relative  = "{$folder}/{$handle}.css";
        $localUrl  = PNPNM_ASSETS . "/{$relative}";
        $finalUrl  = $this->assetUrl($localUrl, $relative);

        if (!file_exists(PNPNM_PATH . "assets/{$relative}")) {
            return;
        }

        if ('register' === $args['type']) {
            wp_register_style("pnpnm-{$handle}", $finalUrl, $deps, $args['ver']);
        } else {
            wp_enqueue_style("pnpnm-{$handle}", $finalUrl, $deps, $args['ver']);
        }
    }

    private function r_style(string $handle, array $deps = [], array $args = []): void
    {
        $args['type'] = 'register';
        $this->style($handle, $deps, $args);
    }

    private function script(string $handle, array $deps = [], array $args = []): void
    {
        $args = wp_parse_args($args, [
            'ver'       => PNPNM_VERSION,
            'folder'    => 'js',
            'in_footer' => true,
            'type'      => 'enqueue',
        ]);

        $assetsPath = PNPNM_PATH . "assets/{$args['folder']}/{$handle}.asset.php";

        if (file_exists($assetsPath)) {
            $asset = include $assetsPath;
            $deps  = array_unique(array_merge($asset['dependencies'], $deps));

        }

        $relative = "{$args['folder']}/{$handle}.js";
        $localUrl = PNPNM_ASSETS . "/{$relative}";
        $finalUrl = $this->assetUrl($localUrl, $relative);

        if ('register' === $args['type']) {
            wp_register_script("pnpnm-{$handle}", $finalUrl, $deps, $args['ver'], $args['in_footer']);
        } else {
            wp_enqueue_script("pnpnm-{$handle}", $finalUrl, $deps, $args['ver'], $args['in_footer']);
        }
    }

    private function r_script(string $handle, array $deps = [], array $args = []): void
    {
        $args['type'] = 'register';
        $this->script($handle, $deps, $args);
    }

    public function adminEnqueue(string $hook): void
    {
        $this->r_script('common', ['jquery', 'wp-util']);
        $this->registerImageToolsAssets();

        $isImageToolsPage = ImageToolsAdmin::isSettingsPage($hook);
        $isMediaPage      = 'upload.php' === $hook || $this->isPluginPage($hook);
        $isPostEditor     = in_array($hook, ['post.php', 'post-new.php', 'site-editor.php', 'tutor-lms_page_create-course'], true);
        $isPostTypePage   = false;

        // Image Tools settings page: inject pnpnm global + module assets only.
        if ($isImageToolsPage) {
            $data = $this->getLocalizeData($hook);
            $this->enqueueImageToolsAssets($hook);
            wp_add_inline_script('pnpnm-optimizer', 'var pnpnm = ' . wp_json_encode($data) . ';', 'before');
            return;
        }

        if (! $isMediaPage && ! $isPostEditor && ! $isPostTypePage) {
            return;
        }

        // Shared assets loaded in every admin context.
        $this->style('media-library');
        $this->style('admin');
        $this->script('common', ['jquery', 'wp-util']);
        $this->script('media-library', $isPostTypePage ? [] : ['media-views']);

        $data = $this->getLocalizeData($hook);
        $this->injectLocalizeData('pnpnm-media-library', $hook, $data);

        if ($isMediaPage) {
            wp_enqueue_media();
            $this->script('admin');
            $this->setScriptTranslations('pnpnm-media-library', 'pnpnm-admin');
            $this->enqueueImageToolsAssets($hook);
            return;
        }

        // Post / page classic editor (includes attachment edit screen).
        $this->script('admin');
        $this->setScriptTranslations('pnpnm-media-library');
        $this->enqueueImageToolsAssets($hook);
    }

    /**
     * Injects the pnpnm JS global before a given script handle.
     * Builds localize data on demand when $data is not supplied.
     */
    private function injectLocalizeData(string $handle, string $hook = '', ?array $data = null): void
    {
        if (null === $data) {
            $data = $this->getLocalizeData($hook);
        }

        wp_add_inline_script($handle, 'var pnpnm = ' . wp_json_encode($data) . ';', 'before');
    }

    /**
     * Registers translation files for one or more script handles.
     */
    private function setScriptTranslations(string ...$handles): void
    {
        foreach ($handles as $handle) {
            wp_set_script_translations($handle, 'ninja-media', PNPNM_PATH . 'languages');
        }
    }

    private function registerImageToolsAssets(): void
    {
        $this->r_style('editor');
        $this->r_script('editor');
        $this->r_style('optimizer');
        $this->r_script('optimizer', ['jquery']);
    }

    private function enqueueImageToolsAssets(string $hook): void
    {
        $isImageTools    = ImageToolsAdmin::isSettingsPage($hook);
        $isAttachEdit    = EditorAdmin::isAttachmentEditScreen($hook);
        $isMediaListView = 'upload.php' === $hook;

        // Editor modal: attachment edit screen OR image tools settings page.
        if ($isAttachEdit || $isImageTools) {
            $this->style('editor');
            $this->script('editor');
            wp_localize_script('pnpnm-editor', 'pnpnmEditor', $this->getEditorLocalizeData());
            $this->setScriptTranslations('pnpnm-editor');
        }

        // Optimizer: media list view OR image tools settings page.
        if ($isMediaListView || $isImageTools) {
            $this->style('optimizer');
            $this->script('optimizer', ['jquery']);
            wp_localize_script('pnpnm-optimizer', 'pnpnmOptimizer', $this->getOptimizerLocalizeData());
            $this->setScriptTranslations('pnpnm-optimizer');
        }
    }

    private function getEditorLocalizeData(): array
    {
        return [
            'optimizing'   => __('Optimizing…', 'ninja-media'),
            'restoring'    => __('Restoring…', 'ninja-media'),
            'done'         => __('Done', 'ninja-media'),
            'error'        => __('Error', 'ninja-media'),
            'confirmClose' => __('Unsaved changes will be lost. Close anyway?', 'ninja-media'),
            'saving'       => __('Saving…', 'ninja-media'),
            'saveAsNew'    => __('Save As New', 'ninja-media'),
            'replace'      => __('Replace Original', 'ninja-media'),
            'download'     => __('Download', 'ninja-media'),
            'viewAttach'   => __('View attachment', 'ninja-media'),
        ];
    }

    private function getOptimizerLocalizeData(): array
    {
        return [
            'optimizing'   => __('Optimizing…', 'ninja-media'),
            'restoring'    => __('Restoring…', 'ninja-media'),
            'done'         => __('Done', 'ninja-media'),
            'error'        => __('Error', 'ninja-media'),
            'saved'        => __('Saved', 'ninja-media'),
            'optimize'     => __('Optimize', 'ninja-media'),
            'restore'      => __('Restore Original', 'ninja-media'),
            'stripping'    => __('Stripping metadata', 'ninja-media'),
            'processed'    => __('processed', 'ninja-media'),
            'alreadyOptimal' => __('Already optimal — no change', 'ninja-media'),
            'noImages'       => __('All images are already optimized — nothing left to process.', 'ninja-media'),
            'confirmStrip' => __('This will permanently remove metadata from all images. A backup will be kept if you have that option enabled. Continue?', 'ninja-media'),
            'stopBulk'     => __('Stop', 'ninja-media'),
            'startBulk'    => __('Start Bulk Optimization', 'ninja-media'),
            'confirmClose' => __('Unsaved changes will be lost. Close anyway?', 'ninja-media'),
        ];
    }

    private function isPluginPage(string $hook): bool
    {
        return false !== strpos($hook, PNPNM_SLUG);
    }

    private function assetExists(string $handle, string $folder): bool
    {
        return file_exists(PNPNM_PATH . "assets/{$folder}/{$handle}.{$folder}");
    }

    public function elementorEditorEnqueue(): void
    {
        if (! defined('ELEMENTOR_VERSION') || version_compare(ELEMENTOR_VERSION, '3.0.0', '<')) {
            return;
        }

        wp_enqueue_media();

        $this->script('admin');
        $this->style('admin');
        $this->script('media-library', ['media-views']);
        $this->style('media-library');

        $data                = $this->getLocalizeData('');
        $data['isElementor'] = true;

        wp_add_inline_script('pnpnm-media-library', 'var pnpnm = ' . wp_json_encode($data) . ';', 'before');
        $this->setScriptTranslations('pnpnm-media-library');
    }

    public function frontendEnqueue(): void
    {
        if ( ! (bool) Helpers::getSetting('display.settings.lightbox', false) ) {
            return;
        }

        $this->script('lightbox');
        wp_add_inline_script( 'pnpnm-lightbox', 'var pnpnm = ' . wp_json_encode( [ 'lightbox' => true ] ) . ';', 'before' );
        
        $this->style('frontend-lightbox', [], [ 'ver' => PNPNM_VERSION, 'folder' => 'css', 'type' => 'enqueue' ] );
    }

    private function getLocalizeData(string $hook = '', string $context = 'admin'): array
    {
        $data = [
            'ajaxUrl'    => esc_url(admin_url('admin-ajax.php')),
            'restUrl'    => esc_url(rest_url('ninja-media/v1/')),
            'nonce'      => wp_create_nonce('wp_rest'),
            'siteUrl'    => esc_url(site_url()),
            'pluginUrl'  => esc_url(PNPNM_URL),
            'isAdmin'    => is_admin(),
            'isLoggedIn' => is_user_logged_in(),
            'version'    => PNPNM_VERSION,
            'pluginName' => PNPNM_NAME,
            'assetUrl'   => esc_url(PNPNM_ASSETS),
            'textDomain' => PNPNM_TEXTDOMAIN,
            'isPro'      => false,
        ];

        if (is_admin()) {
            $data['defaultSettings'] = pnpnmGetDefaultSettings();
            $data['settings']        = Helpers::getSettings();

            // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only screen detection from current admin URL.
            $data['isElementor'] = isset($_GET['action']) && 'elementor' === sanitize_text_field(wp_unslash($_GET['action']))
                // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only screen detection from current admin URL.
                && isset($_GET['post']) && absint(wp_unslash($_GET['post'])) > 0;

            $data['supportedPostTypes'] = pnpnmGetSupportedPostTypes();

        }

        return apply_filters('pnpnm_localize_data', $data, $context, $hook);
    }
}
