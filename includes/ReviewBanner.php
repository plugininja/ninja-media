<?php

namespace Pninja\NM;

use Pninja\NM\Utils\Singleton;

defined('ABSPATH') || exit('No direct script access allowed');

class ReviewBanner
{
    use Singleton;

    private const OPTION_KEY      = 'pnpnm_review_banner';
    private const NONCE_ACTION    = 'pnpnm_review_banner_nonce';
    private const REVIEW_URL      = 'https://wordpress.org/support/plugin/ninja-media/reviews/#new-post';
    private const SHOW_AFTER_DAYS = 7;

    private function doHooks(): void
    {
        add_action('admin_notices', [$this, 'render']);
        add_action('admin_enqueue_scripts', [$this, 'enqueueAssets']);
        add_action('wp_ajax_pnpnm_review_dismiss', [$this, 'ajaxDismiss']);
        add_action('wp_ajax_pnpnm_review_snooze', [$this, 'ajaxSnooze']);
    }

    public function enqueueAssets(): void
    {
        if (!$this->shouldShow()) {
            return;
        }

        wp_enqueue_script('pnpnm-common');
        wp_add_inline_script(
            'pnpnm-common',
            'window.pnpnm = window.pnpnm || {}; window.pnpnm.reviewBannerNonce = ' . wp_json_encode(wp_create_nonce(self::NONCE_ACTION)) . ';',
            'before'
        );
    }

    private function shouldShow(): bool
    {
        if (!current_user_can('manage_options')) {
            return false;
        }

        $state = get_option(self::OPTION_KEY, []);

        if (!empty($state['dismissed'])) {
            return false;
        }

        if (!empty($state['snoozed_until']) && time() < (int) $state['snoozed_until']) {
            return false;
        }

        $installedAt = get_option('pnpnm_install_time');
        if (!$installedAt) {
            return false;
        }

        $daysRequired = (int) apply_filters('pnpnm_review_show_after_days', self::SHOW_AFTER_DAYS);
        $threshold    = strtotime($installedAt) + ($daysRequired * DAY_IN_SECONDS);

        return time() >= $threshold;
    }

    public function render(): void
    {
        if (!$this->shouldShow()) {
            return;
        }

        $reviewUrl = esc_url(self::REVIEW_URL);
        $logo      = esc_url(PNPNM_ASSETS . '/images/logo.svg');
        ?>
        <div class="pnpnm-review-banner notice" id="pnpnm-review-banner" style="display:flex;align-items:center;gap:16px;padding:16px 20px;background:#fff;border-left:4px solid #4D49FC;box-shadow:0 1px 4px rgba(0,0,0,.07);position:relative;">
            <img src="<?php echo esc_url($logo); ?>" alt="<?php esc_attr_e('Ninja Media', 'ninja-media'); ?>" style="width:40px;height:40px;flex-shrink:0;">
            <div style="flex:1;min-width:0;">
                <p style="margin:0 0 10px;font-size:14px;color:#1e1e1e;">
                    <?php
                    printf(
                        /* translators: %d: Number of days the plugin has been active */
                        esc_html__('Hi, Ninja Media has been organizing your media for %d days — awesome! If you have a moment, please consider leaving a review on WordPress.org to help us spread the word. We greatly appreciate it!', 'ninja-media'),
                        (int) self::SHOW_AFTER_DAYS
                    );
                    ?>
                </p>
                <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                    <a href="<?php echo esc_url($reviewUrl); ?>" target="_blank" rel="noopener noreferrer"
                        class="button button-primary"
                        data-pnpnm-action="dismiss">
                        ⭐ <?php esc_html_e('Leave a review', 'ninja-media'); ?>
                    </a>
                    <a href="#" class="button"
                        data-pnpnm-action="snooze"
                        style="display:flex;align-items:center;gap:4px;">
                        🕐 <?php esc_html_e('Maybe later', 'ninja-media'); ?>
                    </a>
                    <a href="#"
                        data-pnpnm-action="dismiss"
                        style="color:#787c82;text-decoration:none;font-size:13px;display:flex;align-items:center;gap:4px;">
                        ✕ <?php esc_html_e("Don't show again", 'ninja-media'); ?>
                    </a>
                </div>
            </div>
            <button type="button"
                data-pnpnm-action="dismiss"
                style="position:absolute;top:10px;right:14px;background:none;border:none;cursor:pointer;font-size:18px;color:#787c82;line-height:1;padding:0;"
                aria-label="<?php esc_attr_e('Dismiss', 'ninja-media'); ?>">&#x2715;</button>
        </div>
        <?php
    }

    public function ajaxDismiss(): void
    {
        check_ajax_referer(self::NONCE_ACTION, 'review_nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(null, 403);
        }

        $state              = get_option(self::OPTION_KEY, []);
        $state['dismissed'] = true;
        update_option(self::OPTION_KEY, $state, false);

        wp_send_json_success();
    }

    public function ajaxSnooze(): void
    {
        check_ajax_referer(self::NONCE_ACTION, 'review_nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(null, 403);
        }

        $state                  = get_option(self::OPTION_KEY, []);
        $state['snoozed_until'] = time() + (14 * DAY_IN_SECONDS);
        update_option(self::OPTION_KEY, $state, false);

        wp_send_json_success();
    }
}