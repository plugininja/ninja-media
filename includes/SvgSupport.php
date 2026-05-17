<?php
/**
 * Class SvgSupport
 *
 * @package Pninja\NM
 * @license GPL-2.0-or-later
 */
namespace Pninja\NM;

use Pninja\NM\Utils\Helpers;
use Pninja\NM\Utils\Singleton;

defined('ABSPATH') || exit('No direct script access allowed');

class SvgSupport
{
    use Singleton;

    public function doHooks(): void
    {
        add_filter('upload_mimes', [$this, 'allowSvgUpload']);
        add_filter('wp_check_filetype_and_ext', [$this, 'fixSvgFiletypeCheck'], 10, 5);
        add_filter('wp_handle_upload_prefilter', [$this, 'sanitizeSvgUpload'], 5);
        add_filter('wp_generate_attachment_metadata', [$this, 'generateSvgMetadata'], 10, 2);
        add_filter('wp_prepare_attachment_for_js', [$this, 'prepareSvgForJs'], 10, 3);
    }

    private function fs(): \WP_Filesystem_Base
    {
        global $wp_filesystem;

        if (empty($wp_filesystem)) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
            WP_Filesystem();
        }

        return $wp_filesystem;
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
        $content = $this->fs()->get_contents($filePath);

        if ($content === false) {
            return false;
        }

        $content = preg_replace('/<\?(?!xml)[^?]*\?>/is', '', $content);

        $dom = new \DOMDocument();
        libxml_use_internal_errors(true);
        $loaded = $dom->loadXML($content, LIBXML_NONET | LIBXML_NOERROR);
        libxml_clear_errors();
        libxml_use_internal_errors(false);

        if (!$loaded) {
            return false;
        }

        $this->stripDangerousContent($dom);

        $sanitized = $dom->saveXML($dom->documentElement);

        if (empty($sanitized)) {
            return false;
        }

        return $this->fs()->put_contents($filePath, $sanitized, FS_CHMOD_FILE);
    }

    private function stripDangerousContent(\DOMDocument $dom): void
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

        // Remove all <script> elements.
        $scriptNodes = iterator_to_array($xpath->query('//script') ?: new \DOMNodeList());
        foreach ($scriptNodes as $node) {
            $node->parentNode?->removeChild($node);
        }

        // Remove <use> elements that reference external resources.
        $useNodes = iterator_to_array($xpath->query('//use') ?: new \DOMNodeList());
        foreach ($useNodes as $node) {
            $href = $node->getAttributeNS('http://www.w3.org/1999/xlink', 'href')
                ?: $node->getAttribute('href');
            if ($href && strpos(ltrim($href), '#') !== 0) {
                $node->parentNode?->removeChild($node);
            }
        }

        // Remove disallowed elements. Snapshot the list first to avoid live-NodeList issues.
        $allElements = iterator_to_array($xpath->query('//*') ?: new \DOMNodeList());
        foreach ($allElements as $element) {
            if (!in_array(strtolower($element->localName), $allowedElements, true)) {
                $element->parentNode?->removeChild($element);
            }
        }

        // Remove dangerous attributes. Store DOMAttr nodes before removal so that
        // removeAttributeNode() works correctly for namespaced attrs (e.g. xlink:href).
        $remaining = iterator_to_array($xpath->query('//*') ?: new \DOMNodeList());
        foreach ($remaining as $element) {
            if (!($element instanceof \DOMElement)) {
                continue;
            }

            $attrsToRemove = [];

            foreach ($element->attributes as $attr) {
                $name  = strtolower($attr->nodeName);
                $value = strtolower(trim($attr->nodeValue));

                if (strpos($name, 'on') === 0 || strpos($value, 'javascript:') !== false) {
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

    public function generateSvgMetadata(array $metadata, int $attachment_id): array
    {
        if (get_post_mime_type($attachment_id) !== 'image/svg+xml') {
            return $metadata;
        }

        $file = get_attached_file($attachment_id);

        if (empty($file) || !file_exists($file)) {
            return $metadata;
        }

        $dimensions = $this->getDimensions($file);

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

        $url        = wp_get_attachment_url($attachment->ID);
        $dimensions = $this->getDimensions($file);
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

    private function getDimensions(string $file): ?array
    {
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

        $svg    = $dom->documentElement;
        $width  = (float) $svg->getAttribute('width');
        $height = (float) $svg->getAttribute('height');

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
}
