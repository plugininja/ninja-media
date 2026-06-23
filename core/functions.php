<?php

defined("ABSPATH") || exit("No direct script access allowed");

if (!function_exists('pnpnmGetFolderTable')) {
    function pnpnmGetFolderTable(): array
    {
        global $wpdb;
        $charsetCollate = $wpdb->get_charset_collate();
        $prefix = $wpdb->prefix;

        $folders = [
            'folders' => "CREATE TABLE IF NOT EXISTS `{$prefix}pnpnm_folders` (
                `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                `parentId`   BIGINT UNSIGNED NOT NULL DEFAULT 0,
                `name`        VARCHAR(255)    NOT NULL,
                `slug`        VARCHAR(255)    NOT NULL,
                `userId`     BIGINT UNSIGNED NOT NULL DEFAULT 0,
                `lft`         INT UNSIGNED    NOT NULL DEFAULT 0,
                `rgt`         INT UNSIGNED    NOT NULL DEFAULT 0,
                `depth`       TINYINT UNSIGNED NOT NULL DEFAULT 0,
                `sortOrder`  INT UNSIGNED    NOT NULL DEFAULT 0,
                `color`       VARCHAR(7)      DEFAULT NULL,
                `icon`        VARCHAR(50)     DEFAULT NULL,
                `createdAt`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `updatedAt`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                INDEX `idx_parent`  (`parentId`),
                INDEX `idx_lft_rgt` (`lft`, `rgt`),
                INDEX `idx_user`    (`userId`)
            ) $charsetCollate;",
        ];

        $tables = array_merge($folders, pnpnmGetFolderRelationshipTable());

        if (function_exists('pnpnmGetPostTypeFolderTables')) {
            $tables = array_merge($tables, pnpnmGetPostTypeFolderTables());
        }

        return $tables;
    }
}

if (!function_exists('pnpnmGetFolderRelationshipTable')) {
    function pnpnmGetFolderRelationshipTable(): array
    {
        global $wpdb;
        $charsetCollate = $wpdb->get_charset_collate();
        $prefix = $wpdb->prefix;

        return [
            'folder_relationships' => "CREATE TABLE IF NOT EXISTS `{$prefix}pnpnm_folder_relationships` (
                `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                `folderId`     BIGINT UNSIGNED NOT NULL,
                `attachmentId` BIGINT UNSIGNED NOT NULL,
                PRIMARY KEY (`id`),
                UNIQUE KEY `uq_folder_attachment` (`folderId`, `attachmentId`),
                INDEX `idx_folder`     (`folderId`),
                INDEX `idx_attachment` (`attachmentId`)
            ) $charsetCollate;",
        ];
    }
}

if (!function_exists('pnpnmGetDefaultSettings')) {
    function pnpnmGetDefaultSettings(): array
    {
        return [
            'general' => [
                'folder' => [
                    'forceSorting'  => false,
                    'showFolders' => true,
                    'showCount' => true,
                    'treeConnector' => true,

                ],

                'files' => [
                    'bulkSelection' => true,
                    'controlUploadSize' => false,
                    'uploadSize' => 300,
                    'replaceMedia' => true,
                    'duplicateMedia' => true,
                    
                    ],

                'svgSupport' => [
                    'uploadSupport' => true,
                    'sanitization' => true,
                ]
            ],

            'display' => [
                'theme' => [
                    'color' => '#4D49FC',
                    'firstTime' => true,

                ],

                'settings' => [
                    'perPage' => 80,
                    'breadcrumbNavigation' => true,
                    'lightbox' => false,

                ]
            ],

            'advanced' => [
                'action' => [
                    'contextMenu' => true,
                    'undoActions' => true,
                ],

                'organization' => [
                    'uncategorized' => true,
                    'dynamicFolders' => true,
                    'favorites' => true,
                    'used' => true,
                    'unused' => true,
                ],

                'imageProcessing' => [
                    'thumbnailGenerator' => false,

                    'defaultFeaturedImage' => true,
                ],

            ],

            'tools' => [
                'deleteOnUninstall' => false,
                'autoSave' => false,
            ],

        ];
    }
}

if (!function_exists('pnpnmGetSettings')) {
    function pnpnmGetSettings(?string $key = null)
    {
        $settings = get_option(PNPNM_OPTIONS_NAME, pnpnmGetDefaultSettings());

        if ($key === null) {
            return $settings;
        }

        return $settings[$key] ?? null;
    }
}

if (!function_exists('pnpnmUpdateSettings')) {
    function pnpnmUpdateSettings(array $settings): bool
    {
        $current = pnpnmGetSettings();
        $updated = array_merge($current, $settings);

        return update_option(PNPNM_OPTIONS_NAME, $updated);
    }
}

if (!function_exists('pnpnmGetSupportedPostTypes')) {
    function pnpnmGetSupportedPostTypes(): array
    {
        $postTypes = get_post_types(['public' => true], 'names');
        unset($postTypes['attachment']);

        return array_values($postTypes);
    }
}

if (!function_exists('pnpnmMaxUploadFileSize')) {
    function pnpnmMaxUploadFileSize(): int
    {
        $controlUploadSize = \Pninja\NM\Utils\Helpers::getSetting('general.files.controlUploadSize', false);

        if ($controlUploadSize) {
            $customMb = (int) \Pninja\NM\Utils\Helpers::getSetting('general.files.uploadSize', 20);
            if ($customMb > 0) {
                return $customMb;
            }
        }

        return max(1, (int) floor(wp_max_upload_size() / MB_IN_BYTES));
    }
}

