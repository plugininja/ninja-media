<?php

namespace PluginInja\NM;

use PluginInja\NM\Enqueue;
use PluginInja\NM\Models\Attachment;
use PluginInja\NM\Models\BaseModel;
use PluginInja\NM\Utils\Helpers;
use PluginInja\NM\Utils\Singleton;

defined('ABSPATH') || exit('No direct script access allowed');

class MediaLibrary
{
    use Singleton;

    private function fs(): \WP_Filesystem_Base
    {
        global $wp_filesystem;

        if (empty($wp_filesystem)) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
            WP_Filesystem();
        }

        return $wp_filesystem;
    }

    public function __construct()
    {
        add_filter('pnpnm_localize_data', [$this, 'localizeData'], 10, 2);
        add_filter('wp_prepare_attachment_for_js', [$this, 'prepareAttachmentForJs'], 99, 3);
        add_filter('wp_calculate_image_srcset', [$this, 'calculateImageSrcset'], 10, 5);
        add_filter('upload_size_limit', [$this, 'filterUploadSizeLimit']);
        add_filter('wp_handle_upload_prefilter', [$this, 'enforceUploadSizeLimit']);
        add_filter('plupload_default_settings', [$this, 'filterPluploadSettings']);
        add_filter('upload_mimes', [$this, 'allowSvgUpload']);
        add_filter('wp_check_filetype_and_ext', [$this, 'fixSvgFiletypeCheck'], 10, 5);
        add_filter('wp_handle_upload_prefilter', [$this, 'sanitizeSvgUpload'], 5);
        add_filter('wp_generate_attachment_metadata', [$this, 'generateSvgMetadata'], 10, 2);
        add_filter('wp_prepare_attachment_for_js', [$this, 'prepareSvgForJs'], 10, 3);
        add_filter('big_image_size_threshold', [$this, 'filterBigImageThreshold']);
        add_action('wp_handle_upload', [$this, 'boostMemoryForImageUpload']);
    }

    public function filterBigImageThreshold(int $threshold): int
    {
        $setting = (int) Helpers::getSetting('general.files.uploadSize', 2560);
        if ($setting <= 0) {
            return $threshold;
        }

        return $setting;
    }

    public function boostMemoryForImageUpload(array $file): array
    {
        $type = $file['type'] ?? '';

        if (strpos($type, 'image/') === 0) {
            wp_raise_memory_limit('image');
        }

        return $file;
    }

    public function filterUploadSizeLimit(int $bytes): int
    {
        $limitBytes = $this->getCustomUploadLimitBytes();
        return $limitBytes !== null ? $limitBytes : $bytes;
    }

    public function enforceUploadSizeLimit(array $file): array
    {
        $limitBytes = $this->getCustomUploadLimitBytes();

        if ($limitBytes === null) {
            return $file;
        }

        if (isset($file['size']) && (int) $file['size'] > $limitBytes) {
            $file['error'] = sprintf(
                /* translators: 1: file size, 2: allowed size */
                __('This file is %1$s. Files must be smaller than %2$s.', 'ninja-media'),
                size_format($file['size']),
                size_format($limitBytes)
            );
        }

        return $file;
    }

    public function filterPluploadSettings(array $settings): array
    {
        $limitBytes = $this->getCustomUploadLimitBytes();

        if ($limitBytes !== null) {
            $settings['filters']['max_file_size'] = $limitBytes . 'b';
        }

        return $settings;
    }

    private function getCustomUploadLimitBytes(): ?int
    {
        if (!Helpers::getSetting('general.files.controlUploadSize', false)) {
            return null;
        }

        $customMb = (int) Helpers::getSetting('general.files.uploadSize', 20);

        return $customMb > 0 ? $customMb * MB_IN_BYTES : null;
    }

    public function allowSvgUpload(array $mimes): array
    {
        if (!Helpers::getSetting('general.svgSupport.uploadSupport', false)) {
            return $mimes;
        }

        $mimes['svg']  = 'image/svg+xml';
        $mimes['svgz'] = 'image/svg+xml';

        return $mimes;
    }

    public function fixSvgFiletypeCheck(array $data, $file, string $filename, ?array $mimes, $real_mime): array
    {
        if (!Helpers::getSetting('general.svgSupport.uploadSupport', false)) {
            return $data;
        }

        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        if (!in_array($ext, ['svg', 'svgz'], true)) {
            return $data;
        }

        $data['ext']  = $ext;
        $data['type'] = 'image/svg+xml';

        return $data;
    }

    public function sanitizeSvgUpload(array $file): array
    {
        if (!Helpers::getSetting('general.svgSupport.uploadSupport', false)) {
            return $file;
        }

        if (!Helpers::getSetting('general.svgSupport.sanitization', false)) {
            return $file;
        }

        $ext = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));

        if (!in_array($ext, ['svg', 'svgz'], true)) {
            return $file;
        }

        $tmpPath = $file['tmp_name'] ?? '';

        if (empty($tmpPath) || !file_exists($tmpPath)) {
            return $file;
        }

        if (!$this->sanitizeSvgFile($tmpPath)) {
            $file['error'] = __('SVG file could not be sanitized and was rejected for security reasons.', 'ninja-media');
        }

        return $file;
    }

    private function sanitizeSvgFile(string $filePath): bool
    {
        // Use WP_Filesystem->get_contents() instead of file_get_contents()
        $content = $this->fs()->get_contents($filePath);

        if ($content === false) {
            return false;
        }

        // Strip PHP processing instructions
        $content = preg_replace('/<\?(?!xml)[^?]*\?>/is', '', $content);

        $dom = new \DOMDocument();
        libxml_use_internal_errors(true);
        $loaded = $dom->loadXML($content, LIBXML_NONET | LIBXML_NOERROR);
        libxml_clear_errors();
        libxml_use_internal_errors(false);

        if (!$loaded) {
            return false;
        }

        $this->stripSvgDangerousContent($dom);

        $sanitized = $dom->saveXML($dom->documentElement);

        if (empty($sanitized)) {
            return false;
        }

        // Use WP_Filesystem->put_contents() instead of file_put_contents()
        return $this->fs()->put_contents($filePath, $sanitized, FS_CHMOD_FILE);
    }

    private function stripSvgDangerousContent(\DOMDocument $dom): void
    {
        $allowedElements = [
            'a', 'altglyph', 'altglyphdef', 'altglyphitem', 'animatecolor',
            'animatemotion', 'animatetransform', 'circle', 'clippath', 'defs',
            'desc', 'ellipse', 'feblend', 'fecolormatrix', 'fecomponenttransfer',
            'fecomposite', 'feconvolvematrix', 'fediffuselighting', 'fedisplacementmap',
            'fedistantlight', 'feflood', 'fefunca', 'fefuncb', 'fefuncg', 'fefuncr',
            'fegaussianblur', 'feimage', 'femerge', 'femergenode', 'femorphology',
            'feoffset', 'fepointlight', 'fespecularlighting', 'fespotlight',
            'fetile', 'feturbulence', 'filter', 'font', 'g', 'glyph', 'glyphref',
            'hkern', 'image', 'line', 'lineargradient', 'marker', 'mask', 'metadata',
            'mpath', 'path', 'pattern', 'polygon', 'polyline', 'radialgradient',
            'rect', 'stop', 'style', 'svg', 'switch', 'symbol', 'text', 'textpath',
            'title', 'tref', 'tspan', 'use', 'view', 'vkern',
        ];

        $xpath = new \DOMXPath($dom);
        $xpath->registerNamespace('svg', 'http://www.w3.org/2000/svg');

        // Snapshot live NodeLists before removal to avoid iteration skipping
        $scriptResult = $xpath->query('//script');
        $scriptNodes  = ($scriptResult !== false) ? iterator_to_array($scriptResult) : [];
        foreach ($scriptNodes as $node) {
            if ($node->parentNode) {
                $node->parentNode->removeChild($node);
            }
        }

        // Remove <use> elements pointing to external resources
        $useResult = $xpath->query('//use');
        $useNodes  = ($useResult !== false) ? iterator_to_array($useResult) : [];
        foreach ($useNodes as $node) {
            $href = $node->getAttributeNS('http://www.w3.org/1999/xlink', 'href')
                ?: $node->getAttribute('href');
            if ($href && strpos(ltrim($href), '#') !== 0) {
                if ($node->parentNode) {
                    $node->parentNode->removeChild($node);
                }
            }
        }

        // Remove disallowed elements (snapshot first to avoid live-NodeList issues)
        $allResult   = $xpath->query('//*');
        $allElements = ($allResult !== false) ? iterator_to_array($allResult) : [];
        foreach ($allElements as $element) {
            if (!in_array(strtolower($element->localName), $allowedElements, true)) {
                if ($element->parentNode) {
                    $element->parentNode->removeChild($element);
                }
            }
        }

        // Remove dangerous attributes — snapshot list and store DOMAttr nodes
        // so removeAttributeNode() works correctly for namespaced attrs (e.g. xlink:href)
        $remainingResult   = $xpath->query('//*');
        $remainingElements = ($remainingResult !== false) ? iterator_to_array($remainingResult) : [];
        foreach ($remainingElements as $element) {
            if (!($element instanceof \DOMElement)) {
                continue;
            }

            $attrsToRemove = [];

            foreach ($element->attributes as $attr) {
                $name  = strtolower($attr->nodeName);
                $value = strtolower(trim($attr->nodeValue));

                if (strpos($name, 'on') === 0) {
                    $attrsToRemove[] = $attr;
                    continue;
                }

                if (strpos($value, 'javascript:') !== false) {
                    $attrsToRemove[] = $attr;
                    continue;
                }

                if (in_array($name, ['href', 'xlink:href', 'src'], true)) {
                    if (strpos($value, 'data:') !== false && strpos($value, 'data:image/') === false) {
                        $attrsToRemove[] = $attr;
                    }
                }
            }

            foreach ($attrsToRemove as $attr) {
                $element->removeAttributeNode($attr);
            }
        }
    }

    public function doHooks()
    {
        add_filter('wp_get_attachment_url', [$this, 'filterAttachmentUrl'], 10, 2);
        add_action('pre_get_posts', [$this, 'filterGridAttachments']);
    }

    public function calculateImageSrcset($sources, $size_array, $image_src, $image_meta, $attachment_id)
    {
        if (empty($image_meta['pnpnm_media']) || empty($sources)) {
            return $sources;
        }

        $image_basename = basename($image_src);
        $new_sources    = [];

        foreach ($sources as $size => $source) {
            if (empty($source['url'])) {
                continue;
            }

            $srcset_basename = basename($source['url']);

            $new_sources[$size] = [
                'url'        => str_replace($image_basename, $srcset_basename, $image_src),
                'descriptor' => $source['descriptor'],
                'value'      => $source['value'],
            ];
        }

        return $new_sources ?: $sources;
    }



    public function filterAttachmentUrl(string $url, int $attachment_id): string
    {
        $fileKey = get_post_meta($attachment_id, '_pnpnm_media_folder_id', true);
        if (empty($fileKey)) {
            return $url;
        }

        $meta          = get_post_meta($attachment_id, '_wp_attachment_metadata', true);
        $attachmentUrl = $meta['thumbnail'] ?? $url;

        return $attachmentUrl;
    }

    public function filterGridAttachments($query)
    {
        if (!wp_doing_ajax()) {
            return;
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- WordPress core verifies nonce for query-attachments action
        $action = isset($_REQUEST['action']) ? sanitize_text_field(wp_unslash($_REQUEST['action'])) : '';
        if ($action !== 'query-attachments') {
            return;
        }

        $perPage = Helpers::getSetting('display.settings.perPage', 80);
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- WordPress core verifies nonce for query-attachments action
        $paged   = isset($_REQUEST['query']['paged']) ? max(1, absint($_REQUEST['query']['paged'])) : 1;

        $query->set('posts_per_page', $perPage);
        $query->set('paged', $paged);

        $query->set('meta_query', [
            [
                'key'     => '_pnpnm_media_trashed',
                'compare' => 'NOT EXISTS',
            ],
        ]);
        
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- WordPress core verifies nonce for query-attachments action
        $folder_id_raw = isset($_REQUEST['query']['folderId']) ? sanitize_text_field(wp_unslash($_REQUEST['query']['folderId'])) : '';
        if (empty($folder_id_raw)) {
            return;
        }

        $dynamicMimeTypes = Attachment::countDynamicFolders();

        if (array_key_exists($folder_id_raw, $dynamicMimeTypes)) {
            $query->set('post_status', 'inherit');
            $query->set('post_mime_type', BaseModel::MIME_TYPE_MAP[$folder_id_raw]);
            return;
        }

        if ($folder_id_raw === 'uncategorized') {
            $query->set('post_status', 'inherit');
            $query->set('meta_query', [
                [
                    'key'     => '_pnpnm_media_folder_id',
                    'compare' => 'NOT EXISTS',
                ],
                [
                    'key'     => '_pnpnm_media_trashed',
                    'compare' => 'NOT EXISTS',
                ],
            ]);
            return;
        }

        if ($folder_id_raw === 'trash') {
            $query->set('post_status', 'inherit');
            $query->set('meta_query', [
                [
                    'key'     => '_pnpnm_media_trashed',
                    'value'   => '1',
                    'compare' => '=',
                ],
            ]);
            return;
        }

        $folder_id = absint($folder_id_raw);
        if (empty($folder_id)) {
            return;
        }

        $query->set('post_status', 'inherit');
        $query->set('meta_query', [
            'relation' => 'AND',
            [
                'key'     => '_pnpnm_media_folder_id',
                'value'   => $folder_id,
                'type'    => 'NUMERIC',
                'compare' => '=',
            ],
            [
                'key'     => '_pnpnm_media_trashed',
                'compare' => 'NOT EXISTS',
            ],
        ]);
    }

    public function prepareAttachmentForJs($response, $attachment, $meta)
    {
            if (empty($meta['folderId'])) {
                return $response;
            }
    
            $response['pnpnm_media'] = $meta['folderId'];
    
            return $response;
        
    }

    public function generateSvgMetadata(array $metadata, int $attachment_id): array
    {
        if (get_post_mime_type($attachment_id) !== 'image/svg+xml') {
            return $metadata;
        }

        $file = get_attached_file($attachment_id);

        if (empty($file) || !file_exists($file)) {
            return $metadata;
        }

        $dimensions = $this->getSvgDimensions($file);

        if ($dimensions) {
            $metadata['width']  = $dimensions['width'];
            $metadata['height'] = $dimensions['height'];
        }

        return $metadata;
    }

    public function prepareSvgForJs(array $response, \WP_Post $attachment, $meta): array
    {
        if ($response['mime'] !== 'image/svg+xml') {
            return $response;
        }

        $file = get_attached_file($attachment->ID);

        if (empty($file) || !file_exists($file)) {
            return $response;
        }

        $url = wp_get_attachment_url($attachment->ID);

        $dimensions = $this->getSvgDimensions($file);
        $width      = $dimensions['width']  ?? 0;
        $height     = $dimensions['height'] ?? 0;

        $response['url']    = $url;
        $response['width']  = $width;
        $response['height'] = $height;
        $response['sizes']  = [
            'full' => [
                'url'         => $url,
                'width'       => $width,
                'height'      => $height,
                'orientation' => $height > $width ? 'portrait' : 'landscape',
            ],
        ];

        return $response;
    }

    private function getSvgDimensions(string $file): ?array
    {
        // Use WP_Filesystem->get_contents() instead of file_get_contents()
        $content = $this->fs()->get_contents($file);

        if ($content === false) {
            return null;
        }

        $dom = new \DOMDocument();
        libxml_use_internal_errors(true);
        $loaded = $dom->loadXML($content, LIBXML_NONET | LIBXML_NOERROR);
        libxml_clear_errors();
        libxml_use_internal_errors(false);

        if (!$loaded) {
            return null;
        }

        $svg = $dom->documentElement;

        $width  = (float) $svg->getAttribute('width');
        $height = (float) $svg->getAttribute('height');

        // Fall back to viewBox if explicit width/height are missing
        if ((!$width || !$height) && $svg->hasAttribute('viewBox')) {
            $parts = preg_split('/[\s,]+/', trim($svg->getAttribute('viewBox')));
            if (count($parts) === 4) {
                $width  = (float) $parts[2];
                $height = (float) $parts[3];
            }
        }

        if (!$width || !$height) {
            return null;
        }

        return ['width' => (int) $width, 'height' => (int) $height];
    }

    public function localizeData(array $data, $script): array
    {

        if ($script !== 'admin') {
            return $data;
        }

        global $pagenow;

        $data['pagenow']       = $pagenow;
        $data['perPage']        = (int) Helpers::getSetting('display.settings.perPage', 20);
        $data['maxUploadSize']  = pnpnmMaxUploadFileSize();

        return $data;
    }
}
