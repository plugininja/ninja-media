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

    public function __construct()
    {
        $this->doHooks();
    }

    private function doHooks(): void
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

    private function style(string $handle, array $deps = [], $args = []): void
    {
        $_args = [
            'ver'     => PNPNM_VERSION,
            'folder'  => 'css',
            'type'    => 'enqueue',
            'nesting' => false,
        ];

        $args = wp_parse_args($args, $_args);

        if ($args['nesting']) {
            $args['folder'] = "css/{$handle}";
        }

        $filePath = PNPNM_ASSETS . "/{$args['folder']}/{$handle}.css";

        if ($args['type'] === 'enqueue') {
            wp_enqueue_style("pnpnm-$handle", $filePath, $deps, $args['ver']);
        } elseif ($args['type'] === 'register') {
            wp_register_style("pnpnm-$handle", $filePath, $deps, $args['ver']);
        }
    }

    private function r_style(string $handle, array $deps = [], $args = []): void
    {
        $args['type'] = 'register';
        $this->style($handle, $deps, $args);
    }

    private function script(string $handle, array $deps = [], $args = []): void
    {
        $_args = [
            'ver'       => PNPNM_VERSION,
            'folder'    => 'js',
            'in_footer' => true,
            'type'      => 'enqueue',
        ];

        $args = wp_parse_args($args, $_args);

        $assetsPath = PNPNM_PATH . "assets/{$args['folder']}/{$handle}.asset.php";

        if (file_exists($assetsPath)) {
            $assets = include $assetsPath;
            if (defined('WP_ENVIRONMENT_TYPE') && WP_ENVIRONMENT_TYPE === 'local') {
                $args['ver'] = $assets['version'];
            }
            $deps = wp_parse_args($deps, $assets['dependencies']);
        }

        $filePath = PNPNM_ASSETS . "/{$args['folder']}/{$handle}.js";

        if ($args['type'] === 'enqueue') {
            wp_enqueue_script("pnpnm-{$handle}", $filePath, $deps, $args['ver'], $args['in_footer']);
        } elseif ($args['type'] === 'register') {
            wp_register_script("pnpnm-{$handle}", $filePath, $deps, $args['ver'], $args['in_footer']);
        }
    }

    private function r_script(string $handle, array $deps = [], $args = []): void
    {
        $args['type'] = 'register';
        $this->script($handle, $deps, $args);
    }

    public function adminEnqueue(string $hook): void
    {
        if ('upload.php' === $hook || $this->isPluginPage($hook)) {
            wp_enqueue_media();

            $this->script('media-library', ['media-views'], []);
            $this->script('admin');
            $this->script('common', ['jquery', 'wp-util']);

            $this->style('media-library', [], []);
            $this->style('admin');

            $data = $this->getLocalizeData($hook, 'admin');

            wp_add_inline_script('pnpnm-media-library', 'var pnpnm = ' . wp_json_encode($data) . ';', 'before');

            wp_set_script_translations('pnpnm-media-library', 'ninja-media', PNPNM_PATH . 'languages');
            wp_set_script_translations('pnpnm-admin', 'ninja-media', PNPNM_PATH . 'languages');

            return;
        }

        // ── Tier 2 (premium): post-type folder sidebar pages ─────────────────

        // ── Tier 3: post/page editors — media modal sidebar support ──────────
        // media-library.js hooks into wp.media.view.AttachmentsBrowser and
        // wp.media.controller.FeaturedImage so the folder sidebar appears inside
        // any media modal opened from a post or page editor.
        if (in_array($hook, ['post.php', 'post-new.php'], true)) {
            $this->script('media-library', ['media-views'], []);
            $this->script('common', ['jquery', 'wp-util']);

            $this->style('media-library', [], []);

            $data = $this->getLocalizeData($hook, 'admin');

            wp_add_inline_script('pnpnm-media-library', 'var pnpnm = ' . wp_json_encode($data) . ';', 'before');

            wp_set_script_translations('pnpnm-media-library', 'ninja-media', PNPNM_PATH . 'languages');
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
        $this->script('media-library', ['media-views'], []);
        $this->style('media-library', [], ['priority' => 5]);

        $data                = $this->getLocalizeData('', 'admin');
        $data['isElementor'] = true;

        wp_add_inline_script('pnpnm-media-library', 'var pnpnm = ' . wp_json_encode($data) . ';', 'before');

        wp_set_script_translations('pnpnm-media-library', 'ninja-media', PNPNM_PATH . 'languages');
    }

    public function frontendEnqueue(): void
    {
        $this->r_script('media-library');
        $this->r_style('media-library');

        $data = $this->getLocalizeData('', 'frontend');

        wp_add_inline_script('pnpnm-media-library', 'var pnpnm = ' . wp_json_encode($data) . ';', 'before');
        wp_add_inline_script('pnpnm-common', 'window.pnpnm = window.pnpnm || ' . wp_json_encode($data) . ';', 'before');
    }

    private function getLocalizeData($hook = false, $script = 'admin'): array
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
        ];

        $data['isPro'] = false;
        if (function_exists('pnpnm_fs') && pnpnm_fs()->can_use_premium_code__premium_only()) {
            $data['isPro'] = true;
        }

        if (is_admin()) {
            $data['defaultSettings'] = pnpnmGetDefaultSettings();
            $data['settings']        = Helpers::getSettings();

            // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only screen detection from current admin URL.
            $action_param = isset($_GET['action']) ? sanitize_text_field(wp_unslash($_GET['action'])) : '';
            // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only screen detection from current admin URL.
            $post_param   = isset($_GET['post']) ? absint(wp_unslash($_GET['post'])) : 0;

            $data['isElementor']        = $action_param === 'elementor' && $post_param > 0;
            $data['supportedPostTypes'] = pnpnmGetSupportedPostTypes();

            if (function_exists('pnpnm_fs') && pnpnm_fs()->can_use_premium_code__premium_only()) {
                $screen = function_exists('get_current_screen') ? get_current_screen() : null;
                if ($screen) {
                    $postType = in_array($screen->base, ['edit', 'post'], true) ? $screen->post_type : '';
                    if (empty($postType)) {
                        $postType = (string) apply_filters('pnpnm_screen_post_type', $postType, $screen);
                    }

                    if (! empty($postType)) {
                        $data['currentPostType'] = $postType;

                        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only folder selection from current admin URL.
                        $folder_param              = isset($_GET['pnpnm_folder']) ? absint(wp_unslash($_GET['pnpnm_folder'])) : 0;
                        $data['currentPostFolder'] = $folder_param ?: null;
                    }
                }
            }
        }

        return apply_filters('pnpnm_localize_data', $data, $script, $hook);
    }
}
