<?php

namespace PluginInja\NM;

defined('ABSPATH') || exit('No direct script access allowed');

class FontManager
{
    private const UPLOAD_DIR = 'pnpnm-fonts';
    private const MANIFEST   = '.manifest.json';
    private const ALLOWED_MIMES = [
        'ttf'   => 'font/ttf',
        'otf'   => 'font/otf',
        'woff'  => 'font/woff',
        'woff2' => 'font/woff2',
    ];

    private const MAGIC_BYTES = [
        'ttf'   => ["\x00\x01\x00\x00", 'true'],
        'otf'   => ['OTTO'],
        'woff'  => ['wOFF'],
        'woff2' => ['wOF2'],
    ];

    private static function maxUploadBytes(): int
    {
        return pnpnmMaxUploadFileSize() * MB_IN_BYTES;
    }

    private static function fs(): \WP_Filesystem_Base
    {
        global $wp_filesystem;

        if (empty($wp_filesystem)) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
            WP_Filesystem();
        }

        return $wp_filesystem;
    }

    public static function getFontsDir(): string
    {
        $upload  = wp_upload_dir();
        $baseDir = trailingslashit($upload['basedir']) . self::UPLOAD_DIR;

        if (!is_dir($baseDir)) {
            wp_mkdir_p($baseDir);

            self::fs()->put_contents(
                $baseDir . '/index.php',
                '<?php // Silence is golden.',
                FS_CHMOD_FILE
            );
        }

        return trailingslashit($baseDir);
    }

    public static function getFontsUrl(): string
    {
        $upload = wp_upload_dir();
        return trailingslashit($upload['baseurl']) . self::UPLOAD_DIR . '/';
    }

    public static function getManifest(): array
    {
        $path = self::getFontsDir() . self::MANIFEST;

        if (!self::fs()->exists($path)) {
            return [];
        }

        $raw = self::fs()->get_contents($path);
        if ($raw === false) {
            return [];
        }

        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    private static function saveManifest(array $manifest): void
    {
        $path = self::getFontsDir() . self::MANIFEST;
        $json = wp_json_encode(array_values($manifest), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        self::fs()->put_contents($path, $json, FS_CHMOD_FILE);
    }

    /* ================================================================
     *  Upload
     * ================================================================ */
    public static function upload(array $file, string $displayName)
    {
        $displayName = sanitize_text_field($displayName);
        if (empty($displayName)) {
            return new \WP_Error('invalid_name', __('Font display name is required.', 'ninja-media'));
        }

        $uploadError = isset($file['error']) ? (int) $file['error'] : -1;
        if (UPLOAD_ERR_OK !== $uploadError) {
            return new \WP_Error('upload_php_error', self::phpUploadErrorMessage($uploadError));
        }

        $ext = strtolower(pathinfo(sanitize_file_name($file['name']), PATHINFO_EXTENSION));
        if (!array_key_exists($ext, self::ALLOWED_MIMES)) {
            return new \WP_Error( 'invalid_file_type', sprintf(
                /* translators: %s = comma-separated list of allowed extensions */
                __('Invalid font file type. Allowed types: %s.', 'ninja-media'), implode(', ', array_keys(self::ALLOWED_MIMES)) )
            );
        }

        $maxBytes = self::maxUploadBytes();
        if ((int) $file['size'] > $maxBytes) {
            return new \WP_Error(
                'file_too_large',
                sprintf(
                    /* translators: %s = human-readable maximum file size, e.g. "20 MB" */
                    __('Font file exceeds the maximum allowed size of %s.', 'ninja-media'),
                    size_format($maxBytes)
                )
            );
        }

        $tmpName = $file['tmp_name'] ?? '';
        if (empty($tmpName) || !is_uploaded_file($tmpName)) {
            return new \WP_Error( 'invalid_upload', __('The font file must be sent via HTTP POST.', 'ninja-media') );
        }

        if (!self::hasValidMagicBytes($tmpName, $ext)) {
            return new \WP_Error( 'invalid_font_content', __('The uploaded file does not appear to be a valid font file.', 'ninja-media') );
        }

        $fontsDir = self::getFontsDir();
        $slug     = self::generateSlug($displayName);
        $filename = $slug . '.' . $ext;
        $destPath = $fontsDir . $filename;
        $counter  = 1;

        while (file_exists($destPath)) {
            $filename = $slug . '-' . (string) $counter . '.' . $ext;
            $destPath = $fontsDir . $filename;
            $counter++;
        }

        // phpcs:ignore Generic.PHP.ForbiddenFunctions.Found -- move_uploaded_file() is the PHP-standard secure function for HTTP uploads; WP_Filesystem has no equivalent that verifies a file originated from an HTTP POST.
        if (!move_uploaded_file($tmpName, $destPath)) {
            return new \WP_Error( 'upload_failed', __('Failed to save the font file. Please check server write permissions.', 'ninja-media') );
        }

        self::fs()->chmod($destPath, FS_CHMOD_FILE);

        $manifest = self::getManifest();

        $entry = [
            'slug'        => $slug,
            'name'        => $displayName,
            'file'        => $filename,
            'uploaded_at' => gmdate('c'),
        ];

        $manifest[] = $entry;
        self::saveManifest($manifest);

        return $entry;
    }

    public static function delete(string $slug): bool
    {
        $manifest = self::getManifest();
        $found    = false;

        $updated = array_filter($manifest, function (array $font) use ($slug, &$found): bool {
            if ($font['slug'] === $slug) {
                $found = true;

                $filePath = self::getFontsDir() . $font['file'];
                if (self::fs()->exists($filePath)) {
                    self::fs()->delete($filePath);
                }

                return false;
            }

            return true;
        });

        if ($found) {
            self::saveManifest(array_values($updated));
        }

        return $found;
    }

    public static function getBuiltinFonts(): array
    {
        return [
            ['name' => __('Sans Serif (Arial-like)',  'ninja-media'), 'value' => 'Sans Serif'],
            ['name' => __('Serif (Times-like)',         'ninja-media'), 'value' => 'Serif'],
            ['name' => __('Monospace (Courier-like)',   'ninja-media'), 'value' => 'Monospace'],
            ['name' => __('DejaVu Sans (Unicode)',      'ninja-media'), 'value' => 'DejaVu Sans'],
        ];
    }

    private static function phpUploadErrorMessage(int $code): string
    {
        $messages = [
            UPLOAD_ERR_INI_SIZE   => __('The font file exceeds the upload_max_filesize directive in php.ini.', 'ninja-media'),
            UPLOAD_ERR_FORM_SIZE  => __('The font file exceeds the MAX_FILE_SIZE directive in the HTML form.', 'ninja-media'),
            UPLOAD_ERR_PARTIAL    => __('The font file was only partially uploaded. Please try again.', 'ninja-media'),
            UPLOAD_ERR_NO_FILE    => __('No font file was received.', 'ninja-media'),
            UPLOAD_ERR_NO_TMP_DIR => __('The server is missing a temporary folder for uploads.', 'ninja-media'),
            UPLOAD_ERR_CANT_WRITE => __('Failed to write the font file to disk. Please check server permissions.', 'ninja-media'),
            UPLOAD_ERR_EXTENSION  => __('A PHP extension stopped the font file upload.', 'ninja-media'),
        ];

        return $messages[$code] ?? __('An unknown error occurred during the font file upload.', 'ninja-media');
    }

    private static function hasValidMagicBytes(string $path, string $ext): bool
    {
        $signatures = self::MAGIC_BYTES[$ext] ?? [];
        if (empty($signatures)) {
            return false;
        }

        $contents = self::fs()->get_contents($path);
        if (false === $contents || strlen($contents) < 4) {
            return false;
        }

        $header = substr($contents, 0, 4);

        foreach ($signatures as $sig) {
            if (substr($header, 0, strlen($sig)) === $sig) {
                return true;
            }
        }

        return false;
    }

    private static function generateSlug(string $name): string
    {
        $slug = sanitize_title($name);
        return $slug ?: 'font-' . (string) time();
    }
}
