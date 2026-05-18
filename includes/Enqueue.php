<?php
/**
 * Class Enqueue
 *
 * @package Pninja\NM
 * @license GPL-2.0-or-later
 */
namespace Pninja\NM;

use Pninja\NM\Utils\Helpers;
use Pninja\NM\Utils\Singleton;

defined('ABSPATH') || exit('No direct script access allowed');

class Enqueue
{
    use Singleton;

    public function doHooks(): void
    {
        add_action('admin_enqueue_scripts', [$this, 'adminEnqueue']);
        add_action('wp_enqueue_scripts', [$this, 'frontendEnqueue']);
        add_action('elementor/editor/after_enqueue_scripts', [$this, 'elementorEditorEnqueue']);
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

        $folder   = $args['nesting'] ? "css/{$handle}" : $args['folder'];
        $filePath = PNPNM_ASSETS . "/{$folder}/{$handle}.css";

        if ('register' === $args['type']) {
            wp_register_style("pnpnm-{$handle}", $filePath, $deps, $args['ver']);
        } else {
            wp_enqueue_style("pnpnm-{$handle}", $filePath, $deps, $args['ver']);
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

        $filePath = PNPNM_ASSETS . "/{$args['folder']}/{$handle}.js";

        if ('register' === $args['type']) {
            wp_register_script("pnpnm-{$handle}", $filePath, $deps, $args['ver'], $args['in_footer']);
        } else {
            wp_enqueue_script("pnpnm-{$handle}", $filePath, $deps, $args['ver'], $args['in_footer']);
        }
    }

    private function r_script(string $handle, array $deps = [], array $args = []): void
    {
        $args['type'] = 'register';
        $this->script($handle, $deps, $args);
    }

    public function adminEnqueue(string $hook): void
    {
        $isMediaPage    = 'upload.php' === $hook || $this->isPluginPage($hook);
        $isPostEditor   = in_array($hook, ['post.php', 'post-new.php', 'site-editor.php', 'tutor-lms_page_create-course'], true);
        $isPostTypePage = false;

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

            return;
        }

        // Post / page classic editor.
        $this->script('admin');
        $this->setScriptTranslations('pnpnm-media-library');
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

    private function isPluginPage(string $hook): bool
    {
        return false !== strpos($hook, PNPNM_SLUG);
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
        $this->r_script('media-library');
        $this->r_style('media-library');

        $data = $this->getLocalizeData('', 'frontend');

        wp_add_inline_script('pnpnm-media-library', 'var pnpnm = ' . wp_json_encode($data) . ';', 'before');
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
