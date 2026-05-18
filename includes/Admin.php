<?php

namespace Pninja\NM;

defined('ABSPATH') || exit('No direct script access allowed');

use Pninja\NM\Models\Folder;
use Pninja\NM\Utils\Helpers;
use Pninja\NM\Utils\Singleton;

class Admin
{
    use Singleton;

    private function doHooks()
    {
        add_action('admin_menu', [$this, 'adminMenu']);

        $showFolders = Helpers::getSetting('general.folder.showFolders', false);
        if ($showFolders) {
            add_action('admin_bar_menu', [$this, 'adminBarMenu'], 100);
        }
    }

    private static function subMenuPages(): array {
        $pages = [
            [
                'id'   => 'ninja_media_settings',
                'menu' => __('Settings', 'ninja-media'),
                'slug' => PNPNM_SLUG . '#/settings/general',
            ],
            [
                'id'   => 'ninja_media_watermark',
                'menu' => __('Watermark', 'ninja-media'),
                'slug' => PNPNM_SLUG . '#/watermark/text',
            ],
            [
                'id'   => 'ninja_media',
                'menu' => __('File Manager', 'ninja-media'),
                'slug' => PNPNM_SLUG . '#/files/all',
            ],
        ];

        return $pages;
    }

    public function adminMenu()
    {
        $isMenuAdded = false;
        foreach (self::subMenuPages() as $page) {
            if (empty($page['id']) || empty($page['menu']) || empty($page['slug'])) {
                continue;
            }

            if (!$isMenuAdded) {
                self::addMenuPage($page['menu'], $page['slug']);
                $isMenuAdded = true;
            } else {
                self::addSubMenuPage($page['menu'], $page['slug']);
            }
        }
    }

    public static function adminPage()
    {
        echo '<div id="pnpnm-admin" class="pnpnm-admin pnpnm-top-level-wrapper"></div>';
    }

    private static function addMenuPage($menu, $slug) {
        add_menu_page(
            __('Ninja Media', 'ninja-media'),
            __('Ninja Media', 'ninja-media'),
            'manage_options',
            PNPNM_SLUG,
            [self::class, 'adminPage'],
            PNPNM_ASSETS . '/images/logo.svg'
        );

        self::addSubMenuPage($menu, $slug);
        remove_submenu_page(PNPNM_SLUG, PNPNM_SLUG);
    }

    private static function addSubMenuPage($menu, $slug) {
        add_submenu_page(
            PNPNM_SLUG,
            $menu,
            $menu,
            'manage_options',
            $slug,
            '__return_null'
        );
    }

    public function adminBarMenu(\WP_Admin_Bar $wp_admin_bar): void
    {
        if (!current_user_can('upload_files')) {
            return;
        }

        $this->addAdminBarMenuItem($wp_admin_bar, [
            'id'    => 'pnpnm-root',
            'title' => __('Media Library', 'ninja-media'),
            'url'   => admin_url('upload.php'),
            'icon'  => 'dashicons-category',
        ]);

        // Fetch all folders ordered by lft (nested set traversal order)
        $folderModel = new Folder();
        $folders     = $folderModel->getTree();

        if (is_wp_error($folders) || empty($folders)) {
            return;
        }

        foreach ($folders as $folder) {
            $parentNodeId = !empty($folder['parentId'])
                ? 'pnpnm-folder-' . $folder['parentId']
                : 'pnpnm-root';

            $indent = str_repeat('— ', (int) $folder['depth']);

            $this->addAdminBarMenuItem($wp_admin_bar, [
                'id'     => 'pnpnm-folder-' . $folder['id'],
                'parent' => $parentNodeId,
                'title'  => $indent . $folder['name'],
                'url'    => admin_url('upload.php?folder=' . $folder['id']),
                'icon'   => 'dashicons-folder',
            ]);
        }
    }

    private function addAdminBarMenuItem(\WP_Admin_Bar $wp_admin_bar, array $item): void
    {
        $wp_admin_bar->add_node([
            'id'     => $item['id'],
            'title'  => '<span class="ab-icon dashicons ' . esc_attr($item['icon']) . '"></span>' . esc_html($item['title']),
            'href'   => esc_url($item['url']),
            'parent' => $item['parent'] ?? false,
        ]);
    }
}
