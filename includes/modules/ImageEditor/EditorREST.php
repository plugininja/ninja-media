<?php
/**
 * REST Controller — Image Editor endpoints.
 *
 * Namespace : ninja-media/v1
 * Base      : /editor
 *
 * @package Pninja\NM\Modules\ImageEditor
 */

namespace Pninja\NM\Modules\ImageEditor;

use Pninja\NM\Utils\WpFilesystem;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

class EditorREST {

	use WpFilesystem;

	private const NAMESPACE    = 'ninja-media/v1';
	private const BASE         = '/editor';
	private const MAX_BYTES    = 10485760; // 10 MB

	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	public function register_routes(): void {
		register_rest_route( self::NAMESPACE, self::BASE . '/attachment/(?P<id>\d+)', array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_attachment' ),
			'permission_callback' => array( $this, 'check_permission' ),
			'args'                => array(
				'id' => array(
					'required'          => true,
					'type'              => 'integer',
					'sanitize_callback' => 'absint',
					'validate_callback' => function ( $v ) { return is_numeric( $v ); },
					'description'       => __( 'Attachment ID.', 'ninja-media' ),
				),
			),
		) );

		register_rest_route( self::NAMESPACE, self::BASE . '/save-new', array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => array( $this, 'save_new' ),
			'permission_callback' => array( $this, 'check_write_permission' ),
			'args'                => $this->save_args( true ),
		) );

		register_rest_route( self::NAMESPACE, self::BASE . '/replace', array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => array( $this, 'replace' ),
			'permission_callback' => array( $this, 'check_write_permission' ),
			'args'                => $this->save_args( false ),
		) );

		register_rest_route( self::NAMESPACE, self::BASE . '/settings', array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_settings' ),
				'permission_callback' => array( $this, 'check_permission' ),
			),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_settings' ),
				'permission_callback' => array( $this, 'check_write_permission' ),
				'args'                => array(
					'default_save_mode' => array(
						'required'          => false,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
						'description'       => __( 'Default save mode: new or replace.', 'ninja-media' ),
					),
					'default_format' => array(
						'required'          => false,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
						'description'       => __( 'Default format: jpeg or png.', 'ninja-media' ),
					),
				),
			),
		) );
	}

	// -------------------------------------------------------------------------
	// Handlers
	// -------------------------------------------------------------------------

	public function get_attachment( WP_REST_Request $request ): WP_REST_Response {
		$id = absint( $request->get_param( 'id' ) );

		$post = get_post( $id );
		if ( ! $post || 'attachment' !== $post->post_type ) {
			return new WP_REST_Response(
				array( 'success' => false, 'message' => __( 'Attachment not found.', 'ninja-media' ) ),
				404
			);
		}

		$mime = get_post_mime_type( $id );
		if ( ! in_array( $mime, array( 'image/jpeg', 'image/png', 'image/webp' ), true ) ) {
			return new WP_REST_Response(
				array( 'success' => false, 'message' => __( 'Attachment is not a supported image type.', 'ninja-media' ) ),
				400
			);
		}

		$meta = wp_get_attachment_metadata( $id );

		return new WP_REST_Response( array(
			'success'   => true,
			'id'        => $id,
			'url'       => wp_get_attachment_url( $id ),
			'mime_type' => $mime,
			'width'     => $meta['width']  ?? 0,
			'height'    => $meta['height'] ?? 0,
			'filename'  => basename( get_attached_file( $id ) ),
		), 200 );
	}

	public function save_new( WP_REST_Request $request ): WP_REST_Response {
		$attachment_id = absint( $request->get_param( 'attachment_id' ) );
		$image_data    = $request->get_param( 'image_data' );
		$format        = sanitize_text_field( $request->get_param( 'format' ) );
		$filename      = sanitize_file_name( $request->get_param( 'filename' ) );

		$decoded = $this->decode_and_validate( $image_data );
		if ( is_wp_error( $decoded ) ) {
			return new WP_REST_Response(
				array( 'success' => false, 'message' => $decoded->get_error_message() ),
				400
			);
		}

		$upload_dir = wp_upload_dir();
		$ext        = ( 'png' === $format ) ? 'png' : 'jpg';
		$basename   = pathinfo( $filename, PATHINFO_FILENAME );
		$new_file   = $upload_dir['path'] . '/' . wp_unique_filename( $upload_dir['path'], $basename . '-edited.' . $ext );

		$fs = $this->fs();
		if ( ! $fs->put_contents( $new_file, $decoded, FS_CHMOD_FILE ) ) {
			return new WP_REST_Response(
				array( 'success' => false, 'message' => __( 'Failed to write edited image file.', 'ninja-media' ) ),
				500
			);
		}

		$parent_post_id = get_post( $attachment_id ) ? $attachment_id : 0;
		$mime_type      = ( 'png' === $format ) ? 'image/png' : 'image/jpeg';

		$new_id = wp_insert_attachment( array(
			'post_mime_type' => $mime_type,
			'post_title'     => sanitize_text_field( pathinfo( $new_file, PATHINFO_FILENAME ) ),
			'post_status'    => 'inherit',
		), $new_file, $parent_post_id );

		if ( is_wp_error( $new_id ) ) {
			$fs->delete( $new_file );
			return new WP_REST_Response(
				array( 'success' => false, 'message' => $new_id->get_error_message() ),
				500
			);
		}

		require_once ABSPATH . 'wp-admin/includes/image.php';
		$meta = wp_generate_attachment_metadata( $new_id, $new_file );
		wp_update_attachment_metadata( $new_id, $meta );

		do_action( 'pnpnm_editor_save_new', $new_id, $attachment_id );

		return new WP_REST_Response( array(
			'success'           => true,
			'new_attachment_id' => $new_id,
			'url'               => wp_get_attachment_url( $new_id ),
			'filename'          => basename( $new_file ),
		), 200 );
	}

	public function replace( WP_REST_Request $request ): WP_REST_Response {
		$attachment_id = absint( $request->get_param( 'attachment_id' ) );
		$image_data    = $request->get_param( 'image_data' );
		$format        = sanitize_text_field( $request->get_param( 'format' ) );

		$post = get_post( $attachment_id );
		if ( ! $post || 'attachment' !== $post->post_type ) {
			return new WP_REST_Response(
				array( 'success' => false, 'message' => __( 'Attachment not found.', 'ninja-media' ) ),
				404
			);
		}

		$decoded = $this->decode_and_validate( $image_data );
		if ( is_wp_error( $decoded ) ) {
			return new WP_REST_Response(
				array( 'success' => false, 'message' => $decoded->get_error_message() ),
				400
			);
		}

		$file = get_attached_file( $attachment_id );
		$fs   = $this->fs();

		if ( ! $fs->put_contents( $file, $decoded, FS_CHMOD_FILE ) ) {
			return new WP_REST_Response(
				array( 'success' => false, 'message' => __( 'Failed to overwrite image file.', 'ninja-media' ) ),
				500
			);
		}

		require_once ABSPATH . 'wp-admin/includes/image.php';
		$meta = wp_generate_attachment_metadata( $attachment_id, $file );
		wp_update_attachment_metadata( $attachment_id, $meta );

		// Clear optimizer meta so image shows as unoptimized.
		foreach ( array( 'pnpnm_original_size', 'pnpnm_optimized_size', 'pnpnm_savings_percent', 'pnpnm_optimized_at', 'pnpnm_backup_path', 'pnpnm_webp_path' ) as $key ) {
			delete_post_meta( $attachment_id, $key );
		}

		do_action( 'pnpnm_editor_replace', $attachment_id );

		return new WP_REST_Response( array(
			'success'       => true,
			'attachment_id' => $attachment_id,
			'url'           => wp_get_attachment_url( $attachment_id ),
		), 200 );
	}

	public function get_settings( WP_REST_Request $request ): WP_REST_Response {
		return new WP_REST_Response( array(
			'success'  => true,
			'settings' => $this->load_settings(),
		), 200 );
	}

	public function update_settings( WP_REST_Request $request ): WP_REST_Response {
		$mode   = sanitize_text_field( $request->get_param( 'default_save_mode' ) );
		$format = sanitize_text_field( $request->get_param( 'default_format' ) );

		if ( ! in_array( $mode, array( 'new', 'replace' ), true ) ) {
			return new WP_REST_Response(
				array( 'success' => false, 'message' => __( 'default_save_mode must be new or replace.', 'ninja-media' ) ),
				400
			);
		}

		if ( ! in_array( $format, array( 'jpeg', 'png' ), true ) ) {
			return new WP_REST_Response(
				array( 'success' => false, 'message' => __( 'default_format must be jpeg or png.', 'ninja-media' ) ),
				400
			);
		}

		$settings = array(
			'default_save_mode' => $mode,
			'default_format'    => $format,
		);

		update_option( 'pnpnm_editor_settings', $settings );

		do_action( 'pnpnm_editor_settings_updated', $settings );

		return new WP_REST_Response( array( 'success' => true, 'settings' => $settings ), 200 );
	}

	// -------------------------------------------------------------------------
	// Permission
	// -------------------------------------------------------------------------

	public function check_permission(): bool {
		return current_user_can( 'upload_files' );
	}

	public function check_write_permission(): bool {
		return current_user_can( 'manage_options' );
	}

	// -------------------------------------------------------------------------
	// Helpers
	// -------------------------------------------------------------------------

	private function decode_and_validate( string $image_data ) {
		// Strip data-URI prefix if present.
		$b64 = preg_replace( '#^data:image/[a-z]+;base64,#', '', $image_data );

		$decoded = base64_decode( $b64, true );
		if ( false === $decoded ) {
			return new \WP_Error( 'invalid_base64', __( 'Invalid base64 image data.', 'ninja-media' ) );
		}

		if ( strlen( $decoded ) > self::MAX_BYTES ) {
			return new \WP_Error( 'image_too_large', __( 'Image data exceeds 10 MB limit.', 'ninja-media' ) );
		}

		return $decoded;
	}

	private function load_settings(): array {
		return wp_parse_args( get_option( 'pnpnm_editor_settings', array() ), array(
			'default_save_mode' => 'new',
			'default_format'    => 'jpeg',
		) );
	}

	private function save_args( bool $include_filename ): array {
		$args = array(
			'attachment_id' => array(
				'required'          => true,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'validate_callback' => function ( $v ) { return $v > 0; },
				'description'       => __( 'Source attachment ID.', 'ninja-media' ),
			),
			'image_data' => array(
				'required'    => true,
				'type'        => 'string',
				'description' => __( 'Base64-encoded image data.', 'ninja-media' ),
			),
			'format' => array(
				'required'          => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'description'       => __( 'Output format: jpeg or png.', 'ninja-media' ),
			),
		);

		if ( $include_filename ) {
			$args['filename'] = array(
				'required'          => false,
				'type'              => 'string',
				'default'           => 'edited-image',
				'sanitize_callback' => 'sanitize_file_name',
				'description'       => __( 'Filename (without extension) for the new attachment.', 'ninja-media' ),
			);
		}

		return $args;
	}

}
