<?php

namespace Pninja\NM;

use Pninja\NM\Utils\Helpers;
use Pninja\NM\Utils\Singleton;

\defined('ABSPATH') || exit('No direct script access allowed');

/**
 * Handles image processing on upload:
 *   - Convert JPEG / PNG to WebP.
 *   - Generate all registered thumbnail sizes.
 *   - Serve a site-wide default featured image when a post has none.
 *
 * Each feature is independently controlled by a plugin setting and
 * does nothing when its toggle is off.
 *
 * @package Pninja\NM
 * @since   1.0.0
 */
class ImageProcessor
{
	use Singleton;

	public function doHooks()
	{
		add_filter( 'wp_generate_attachment_metadata', [ $this, 'maybeGenerateThumbnails' ], 20, 2 );

		if ( Helpers::getSetting( 'advanced.imageProcessing.defaultFeaturedImage', true ) ) {
			add_action( 'admin_init', [ $this, 'registerMediaSetting' ] );
			add_action( 'admin_enqueue_scripts', [ $this, 'enqueueMediaUploader' ] );
			add_filter( 'get_post_metadata', [ $this, 'filterThumbnailMetadata' ], 10, 4 );
			add_filter( 'post_thumbnail_html', [ $this, 'addDefaultImageClass' ], 10, 3 );
			add_action( 'wp_head', [ $this, 'outputDefaultFeaturedImageMeta' ], 5 );
		}
	}

	public function outputDefaultFeaturedImageMeta(): void
	{
		if ( is_admin() || ! is_singular() ) {
			return;
		}

		$post_id = get_queried_object_id();

		if ( ! $post_id ) {
			return;
		}

		$real_thumbnail_id = 0;
		$default_id        = 0;
		self::$resolvingThumbnail = true;
		try {
			$real_thumbnail_id = absint( get_metadata_raw( 'post', $post_id, '_thumbnail_id', true ) );

			if ( $real_thumbnail_id > 0 ) {
				return;
			}

			$default_id = $this->resolveDefaultImageId( $post_id );
		} finally {
			self::$resolvingThumbnail = false;
		}

		if ( ! $default_id ) {
			return;
		}

		$image_url = wp_get_attachment_image_url( $default_id, 'full' );

		if ( ! $image_url ) {
			return;
		}

		\printf(
			"\n<meta property=\"og:image\" content=\"%1\$s\" data-pnpnm-default-featured=\"1\" />\n" .
			"<meta name=\"twitter:image\" content=\"%1\$s\" data-pnpnm-default-featured=\"1\" />\n" .
			"<meta itemprop=\"image\" content=\"%1\$s\" data-pnpnm-default-featured=\"1\" />\n" .
			"<meta name=\"pnpnm-default-featured-image-id\" content=\"%2\$d\" data-pnpnm-default-featured=\"1\" />\n",
			esc_url( $image_url ),
			absint( $default_id )
		);
	}

	public function maybeGenerateThumbnails( array $metadata, int $attachment_id ): array
	{
		if ( ! Helpers::getSetting( 'advanced.imageProcessing.thumbnailGenerator', false ) ) {
			return $metadata;
		}

		if ( empty( $metadata['file'] ) ) {
			return $metadata;
		}

		$file = get_attached_file( $attachment_id );

		if ( ! $file || ! \file_exists( $file ) ) {
			return $metadata;
		}

		foreach ( wp_get_registered_image_subsizes() as $size_name => $size_data ) {
			if ( isset( $metadata['sizes'][ $size_name ] ) ) {
				continue;
			}

			$resized = image_make_intermediate_size(
				$file,
				$size_data['width'],
				$size_data['height'],
				$size_data['crop'] ?? false
			);

			if ( $resized ) {
				$metadata['sizes'][ $size_name ] = $resized;
			}
		}

		return $metadata;
	}

	/**
	 * Registers the default featured image option with the WP Settings API
	 * and adds it to the Media settings page.
	 */
	public function registerMediaSetting(): void
	{
		register_setting(
			'media',
			'pnpnm_default_featured_image_id',
			[
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'default'           => 0,
			]
		);

		add_settings_section(
			'pnpnm_default_featured_image_section',
			__( 'Default Featured Image', 'ninja-media' ),
			'__return_false',
			'media'
		);

		add_settings_field(
			'pnpnm_default_featured_image_id',
			__( 'Default image', 'ninja-media' ),
			[ $this, 'renderMediaUploaderField' ],
			'media',
			'pnpnm_default_featured_image_section'
		);
	}

	/**
	 * Enqueues the WP media uploader only on the Media settings screen.
	 *
	 * @param string $hook Current admin page hook.
	 */
	public function enqueueMediaUploader( string $hook ): void
	{
		if ( 'options-media.php' !== $hook ) {
			return;
		}

		wp_enqueue_media();

		$i18n = wp_json_encode( [
			'selectTitle'  => __( 'Select Default Featured Image', 'ninja-media' ),
			'useThisImage' => __( 'Use this image', 'ninja-media' ),
			'replaceImage' => __( 'Replace image', 'ninja-media' ),
			'selectImage'  => __( 'Select image', 'ninja-media' ),
		] );

		wp_add_inline_script(
			'media-editor',
			"( function ( \$ ) {
	const i18n = {$i18n};
	let frame;

	\$( '#pnpnm-dfi-upload' ).on( 'click', function ( e ) {
		e.preventDefault();

		if ( frame ) {
			frame.open();
			return;
		}

		frame = wp.media( {
			title:    i18n.selectTitle,
			button:   { text: i18n.useThisImage },
			multiple: false,
			library:  { type: 'image' }
		} );

		frame.on( 'select', function () {
			const attachment = frame.state().get( 'selection' ).first().toJSON();
			const previewUrl = attachment.sizes && attachment.sizes.medium
				? attachment.sizes.medium.url
				: attachment.url;

			\$( '#pnpnm_default_featured_image_id' ).val( attachment.id );
			\$( '#pnpnm-dfi-preview' ).attr( 'src', previewUrl ).show();
			\$( '#pnpnm-dfi-upload' ).text( i18n.replaceImage );
			\$( '#pnpnm-dfi-remove' ).show();
		} );

		frame.open();
	} );

	\$( '#pnpnm-dfi-remove' ).on( 'click', function ( e ) {
		e.preventDefault();
		\$( '#pnpnm_default_featured_image_id' ).val( 0 );
		\$( '#pnpnm-dfi-preview' ).attr( 'src', '' ).hide();
		\$( '#pnpnm-dfi-upload' ).text( i18n.selectImage );
		\$( this ).hide();
	} );
} ( jQuery ) );"
		);
	}

	/**
	 * Renders the image picker field on the Media settings page.
	 *
	 * Shows the user-selected image when one is saved, or the site logo as an
	 * automatic fallback preview when none has been chosen yet.
	 */
	public function renderMediaUploaderField(): void
	{
		$saved_id      = absint( get_option( 'pnpnm_default_featured_image_id', 0 ) );
		$has_custom    = $saved_id && wp_attachment_is_image( $saved_id );
		$preview_url   = '';
		$fallback_note = '';

		if ( $has_custom ) {
			$preview_url = wp_get_attachment_image_url( $saved_id, 'medium' ) ?: '';
		} else {
			$logo_id  = absint( get_theme_mod( 'custom_logo', 0 ) );
			$has_logo = $logo_id && wp_attachment_is_image( $logo_id );

			if ( $has_logo ) {
				$preview_url   = wp_get_attachment_image_url( $logo_id, 'medium' ) ?: '';
				$fallback_note = '<p class="description" style="color:#856404;background:#fff3cd;padding:6px 10px;border-left:3px solid #ffc107;margin:6px 0 0;">'
					. esc_html__( 'No custom image set — your site logo is used as the fallback. Select an image above to override it.', 'ninja-media' )
					. '</p>';
			}
		}

		\printf(
			'<input type="hidden" id="pnpnm_default_featured_image_id" name="pnpnm_default_featured_image_id" value="%d" />',
			absint( $saved_id )
		);

		if ( $preview_url ) {
			\printf(
				'<img id="pnpnm-dfi-preview" src="%s" style="max-width:200px;max-height:150px;display:block;margin-bottom:8px;" />',
				esc_url( $preview_url )
			);
		} else {
			echo '<img id="pnpnm-dfi-preview" src="" style="max-width:200px;max-height:150px;display:none;margin-bottom:8px;" />';
		}

		\printf(
			'<button type="button" id="pnpnm-dfi-upload" class="button">%s</button>',
			esc_html( $has_custom ? __( 'Replace image', 'ninja-media' ) : __( 'Select image', 'ninja-media' ) )
		);

		\printf(
			' <button type="button" id="pnpnm-dfi-remove" class="button button-link-delete"%s>%s</button>',
			$has_custom ? '' : ' style="display:none;"',
			esc_html__( 'Remove', 'ninja-media' )
		);

		echo wp_kses_post( $fallback_note );

		echo '<p class="description">' . esc_html__(
			'Shown on any post or page that has no featured image. If no image is selected, your site logo is used automatically.',
			'ninja-media'
		) . '</p>';
	}

	/**
	 * Guard flag — prevents recursive calls inside filterThumbnailMetadata
	 * and outputDefaultFeaturedImageMeta.
	 */
	private static bool $resolvingThumbnail = false;

	/**
	 * Cached base default image ID for the current request.
	 * -1 = not yet resolved; 0 = none configured; >0 = valid attachment ID.
	 */
	private static int $cachedDefaultId = -1;

	/**
	 * Per-post resolution cache.
	 * 0 = post has a real thumbnail (or no default available); >0 = default attachment ID.
	 */
	private static array $resolvedCache = [];

	/**
	 * Intercepts WordPress post-metadata reads for _thumbnail_id.
	 *
	 * When a post has no real featured image this method returns the
	 * default image ID, making every downstream function — has_post_thumbnail(),
	 * get_post_thumbnail_id(), the_post_thumbnail(), get_the_post_thumbnail(),
	 * and the core/post-featured-image block — all behave as if the post has
	 * a real thumbnail. No theme-specific patching is required.
	 *
	 * @param mixed  $value     The metadata value (null = not yet resolved).
	 * @param int    $object_id Post ID.
	 * @param string $meta_key  Meta key being read.
	 * @param bool   $single    Whether a single value is requested.
	 * @return mixed Original $value, or the default attachment ID.
	 */
	public function filterThumbnailMetadata( $value, int $object_id, string $meta_key, bool $single )
	{
		if ( '_thumbnail_id' !== $meta_key || self::$resolvingThumbnail ) {
			return $value;
		}

		// This feature is for frontend display. Skip on regular admin page renders
		// (e.g. WooCommerce product lists) where get_post_metadata fires thousands
		// of times and the default image is never rendered anyway.
		if ( is_admin() && ! wp_doing_ajax() && ! ( \defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
			return $value;
		}

		// Serve from per-request cache to avoid repeated resolution for the same post.
		if ( \array_key_exists( $object_id, self::$resolvedCache ) ) {
			$cached = self::$resolvedCache[ $object_id ];
			if ( ! $cached ) {
				return $value;
			}
			return $single ? (string) $cached : [ (string) $cached ];
		}

		// Guard must be set BEFORE get_metadata_raw — in this WP version get_metadata_raw
		// also fires apply_filters('get_post_metadata'), which would re-enter this function
		// and cause infinite recursion without the guard already in place.
		$default_id = 0;
		self::$resolvingThumbnail = true;
		try {
			$real = get_metadata_raw( 'post', $object_id, '_thumbnail_id', true );

			if ( $real ) {
				self::$resolvedCache[ $object_id ] = 0;
				return $value;
			}

			$default_id = $this->resolveDefaultImageId( $object_id );
		} finally {
			self::$resolvingThumbnail = false;
		}

		self::$resolvedCache[ $object_id ] = $default_id;

		if ( ! $default_id ) {
			return $value;
		}

		return $single ? (string) $default_id : [ (string) $default_id ];
	}

	/**
	 * Adds a CSS marker class to the rendered img tag when a default image is active.
	 *
	 * The class pnpnm-default-featured-img lets themes and stylesheets target
	 * default images without affecting posts that have their own thumbnail.
	 *
	 * @param string $html     Rendered img HTML.
	 * @param int    $post_id  Post ID.
	 * @param int    $thumb_id The thumbnail attachment ID used.
	 * @return string
	 */
	public function addDefaultImageClass( string $html, int $post_id, int $thumb_id ): string
	{
		if ( empty( $html ) || ! $thumb_id ) {
			return $html;
		}

		// Guard must be set before get_metadata_raw since it also fires this filter in this WP version.
		self::$resolvingThumbnail = true;
		try {
			$real = get_metadata_raw( 'post', $post_id, '_thumbnail_id', true );
		} finally {
			self::$resolvingThumbnail = false;
		}

		if ( $real ) {
			return $html;
		}

		return \preg_replace(
			'/(<img\b[^>]*\bclass=["\'])/',
			'$1pnpnm-default-featured-img ',
			$html,
			1
		);
	}

	/**
	 * Resolves the effective default featured image ID for a given post.
	 *
	 * Priority:
	 *   1. User-selected image saved in pnpnm_default_featured_image_id.
	 *   2. Site logo (custom_logo theme mod) as automatic fallback.
	 *
	 * The final value is passed through the pnpnm_default_featured_image_id
	 * filter so themes/plugins can override per-post.
	 *
	 * @param int $post_id Post ID.
	 * @return int Attachment ID, or 0 if nothing is available.
	 *
	 * @filter pnpnm_default_featured_image_id
	 */
	private function resolveDefaultImageId( int $post_id ): int
	{
		if ( self::$cachedDefaultId === -1 ) {
			$saved_id = absint( get_option( 'pnpnm_default_featured_image_id', 0 ) );

			if ( $saved_id && wp_attachment_is_image( $saved_id ) ) {
				self::$cachedDefaultId = $saved_id;
			} else {
				$logo_id               = absint( get_theme_mod( 'custom_logo', 0 ) );
				self::$cachedDefaultId = ( $logo_id && wp_attachment_is_image( $logo_id ) ) ? $logo_id : 0;
			}
		}

		/**
		 * Filters the default featured image ID used when a post has no thumbnail.
		 *
		 * Return 0 to disable the default image for a specific post.
		 *
		 * @param int $default_id Resolved attachment ID (custom or site logo).
		 * @param int $post_id    Post ID being rendered.
		 */
		return absint( apply_filters( 'pnpnm_default_featured_image_id', self::$cachedDefaultId, $post_id ) );
	}

}
