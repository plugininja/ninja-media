<?php
/**
 * REST Controller — Image Optimizer endpoints.
 *
 * Namespace : ninja-media/v1
 * Base      : /optimizer
 *
 * @package Pninja\NM\Modules\ImageOptimizer
 */

namespace Pninja\NM\Modules\ImageOptimizer;

use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

class OptimizerREST {

	private Optimizer $engine;
	private const NAMESPACE = 'ninja-media/v1';
	private const BASE      = '/optimizer';

	public function __construct( Optimizer $engine ) {
		$this->engine = $engine;
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	public function register_routes(): void {
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
				'args'                => $this->settings_args(),
			),
		) );

		register_rest_route( self::NAMESPACE, self::BASE . '/optimize', array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => array( $this, 'optimize_single' ),
			'permission_callback' => array( $this, 'check_write_permission' ),
			'args'                => array(
				'attachment_id' => array(
					'required'          => true,
					'type'              => 'integer',
					'sanitize_callback' => 'absint',
					'validate_callback' => function ( $v ) { return $v > 0; },
					'description'       => __( 'Attachment ID to optimize.', 'ninja-media' ),
				),
			),
		) );

		register_rest_route( self::NAMESPACE, self::BASE . '/bulk', array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => array( $this, 'bulk_optimize' ),
			'permission_callback' => array( $this, 'check_write_permission' ),
			'args'                => array(
				'offset' => array(
					'required'          => false,
					'type'              => 'integer',
					'default'           => 0,
					'sanitize_callback' => 'absint',
					'description'       => __( 'Offset for batch processing.', 'ninja-media' ),
				),
			),
		) );

		register_rest_route( self::NAMESPACE, self::BASE . '/restore', array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => array( $this, 'restore_single' ),
			'permission_callback' => array( $this, 'check_write_permission' ),
			'args'                => array(
				'attachment_id' => array(
					'required'          => true,
					'type'              => 'integer',
					'sanitize_callback' => 'absint',
					'validate_callback' => function ( $v ) { return $v > 0; },
					'description'       => __( 'Attachment ID to restore.', 'ninja-media' ),
				),
			),
		) );

		register_rest_route( self::NAMESPACE, self::BASE . '/stats', array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_stats' ),
			'permission_callback' => array( $this, 'check_permission' ),
		) );

		register_rest_route( self::NAMESPACE, self::BASE . '/strip-metadata', array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => array( $this, 'strip_metadata' ),
			'permission_callback' => array( $this, 'check_write_permission' ),
			'args'                => array(
				'attachment_id' => array(
					'required'          => true,
					'type'              => 'integer',
					'sanitize_callback' => 'absint',
					'validate_callback' => function ( $v ) { return $v > 0; },
					'description'       => __( 'Attachment ID to strip metadata from.', 'ninja-media' ),
				),
			),
		) );

		register_rest_route( self::NAMESPACE, self::BASE . '/bulk-strip', array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => array( $this, 'bulk_strip_metadata' ),
			'permission_callback' => array( $this, 'check_write_permission' ),
			'args'                => array(
				'offset' => array(
					'required'          => false,
					'type'              => 'integer',
					'default'           => 0,
					'sanitize_callback' => 'absint',
					'description'       => __( 'Offset for batch processing.', 'ninja-media' ),
				),
			),
		) );
	}

	// -------------------------------------------------------------------------
	// Handlers
	// -------------------------------------------------------------------------

	public function get_settings( WP_REST_Request $request ): WP_REST_Response {
		$settings = $this->load_settings();
		return new WP_REST_Response( array( 'success' => true, 'settings' => $settings ), 200 );
	}

	public function update_settings( WP_REST_Request $request ): WP_REST_Response {
		$quality         = absint( $request->get_param( 'quality' ) );
		$type            = sanitize_text_field( $request->get_param( 'type' ) );
		$auto_optimize   = (bool) $request->get_param( 'auto_optimize' );
		$keep_backup     = (bool) $request->get_param( 'keep_backup' );
		$convert_webp    = (bool) $request->get_param( 'convert_webp' );
		$strip_metadata  = (bool) $request->get_param( 'strip_metadata' );

		if ( $quality < 60 || $quality > 100 ) {
			return new WP_REST_Response(
				array( 'success' => false, 'message' => __( 'Quality must be between 60 and 100.', 'ninja-media' ) ),
				400
			);
		}

		if ( ! in_array( $type, array( 'lossy', 'lossless' ), true ) ) {
			return new WP_REST_Response(
				array( 'success' => false, 'message' => __( 'Type must be lossy or lossless.', 'ninja-media' ) ),
				400
			);
		}

		$settings = array(
			'quality'        => $quality,
			'type'           => $type,
			'auto_optimize'  => $auto_optimize,
			'keep_backup'    => $keep_backup,
			'convert_webp'   => $convert_webp,
			'strip_metadata' => $strip_metadata,
		);

		update_option( 'pnpnm_optimizer_settings', $settings );

		do_action( 'pnpnm_optimizer_settings_updated', $settings );

		return new WP_REST_Response( array( 'success' => true, 'settings' => $settings ), 200 );
	}

	public function strip_metadata( WP_REST_Request $request ): WP_REST_Response {
		$id       = absint( $request->get_param( 'attachment_id' ) );
		$settings = $this->load_settings();

		if ( ! $this->is_valid_image_attachment( $id ) ) {
			return new WP_REST_Response(
				array( 'success' => false, 'message' => __( 'Invalid or non-image attachment.', 'ninja-media' ) ),
				400
			);
		}

		$result = $this->engine->strip_metadata( $id, $settings['keep_backup'] );
		if ( is_wp_error( $result ) ) {
			return new WP_REST_Response(
				array( 'success' => false, 'message' => $result->get_error_message() ),
				500
			);
		}

		return new WP_REST_Response( $result, 200 );
	}

	public function bulk_strip_metadata( WP_REST_Request $request ): WP_REST_Response {
		$settings        = $this->load_settings();
		$total_unstripped = $this->engine->count_unstripped();
		$ids             = $this->engine->get_unstripped_ids( 0, 10 );
		$results         = array();
		$processed       = 0;

		foreach ( $ids as $id ) {
			$r = $this->engine->strip_metadata( $id, $settings['keep_backup'] );
			if ( is_wp_error( $r ) ) {
				$results[] = array(
					'attachment_id' => $id,
					'success'       => false,
					'error'         => $r->get_error_message(),
				);
			} else {
				$results[]  = $r;
				$processed++;
			}
		}

		// Re-use offset=0 for next batch — processed items fall out of the unstripped
		// set automatically, so the query always picks up the next unprocessed items.
		$offset_next = count( $ids ) === 10 ? 0 : null;

		return new WP_REST_Response( array(
			'success'          => true,
			'processed'        => $processed,
			'total_unstripped' => $total_unstripped,
			'offset_next'      => $offset_next,
			'results'          => $results,
		), 200 );
	}

	public function optimize_single( WP_REST_Request $request ): WP_REST_Response {
		$id = absint( $request->get_param( 'attachment_id' ) );

		if ( ! $this->is_valid_image_attachment( $id ) ) {
			return new WP_REST_Response(
				array( 'success' => false, 'message' => __( 'Invalid or non-image attachment.', 'ninja-media' ) ),
				400
			);
		}

		$result = $this->engine->optimize( $id, $this->load_settings() );
		if ( is_wp_error( $result ) ) {
			return new WP_REST_Response(
				array( 'success' => false, 'message' => $result->get_error_message() ),
				500
			);
		}

		return new WP_REST_Response( $result, 200 );
	}

	public function bulk_optimize( WP_REST_Request $request ): WP_REST_Response {
		$settings  = $this->load_settings();
		$stats     = $this->engine->get_stats();
		$ids       = $this->engine->get_unoptimized_ids( 0, 10 );
		$results   = array();
		$processed = 0;

		foreach ( $ids as $id ) {
			$r = $this->engine->optimize( $id, $settings );
			if ( is_wp_error( $r ) ) {
				$results[] = array(
					'attachment_id' => $id,
					'success'       => false,
					'error'         => $r->get_error_message(),
				);
			} else {
				$results[] = $r;
				$processed++;
			}
		}

		// Re-use offset=0 for next batch — processed items fall out of the unoptimized
		// set automatically, so the query always picks up the next unprocessed items.
		$offset_next = count( $ids ) === 10 ? 0 : null;

		return new WP_REST_Response( array(
			'success'           => true,
			'processed'         => $processed,
			'total_unoptimized' => $stats['total_unoptimized'],
			'offset_next'       => $offset_next,
			'results'           => $results,
		), 200 );
	}

	public function restore_single( WP_REST_Request $request ): WP_REST_Response {
		$id = absint( $request->get_param( 'attachment_id' ) );

		$result = $this->engine->restore( $id );
		if ( is_wp_error( $result ) ) {
			return new WP_REST_Response(
				array( 'success' => false, 'message' => $result->get_error_message() ),
				400
			);
		}

		return new WP_REST_Response( $result, 200 );
	}

	public function get_stats( WP_REST_Request $request ): WP_REST_Response {
		return new WP_REST_Response( array(
			'success' => true,
			'stats'   => $this->engine->get_stats(),
		), 200 );
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

	private function load_settings(): array {
		$defaults = array(
			'quality'        => 82,
			'type'           => 'lossy',
			'auto_optimize'  => false,
			'keep_backup'    => true,
			'convert_webp'   => false,
			'strip_metadata' => false,
		);

		$saved = get_option( 'pnpnm_optimizer_settings', array() );

		return wp_parse_args( $saved, $defaults );
	}

	private function is_valid_image_attachment( int $id ): bool {
		if ( ! $id ) {
			return false;
		}

		$post = get_post( $id );
		if ( ! $post || 'attachment' !== $post->post_type ) {
			return false;
		}

		$mime = get_post_mime_type( $id );

		return in_array( $mime, array( 'image/jpeg', 'image/png' ), true );
	}

	private function settings_args(): array {
		return array(
			'quality' => array(
				'required'          => true,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'description'       => __( 'JPEG/PNG quality (60–100).', 'ninja-media' ),
			),
			'type' => array(
				'required'          => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'description'       => __( 'Compression type: lossy or lossless.', 'ninja-media' ),
			),
			'auto_optimize' => array(
				'required'          => false,
				'type'              => 'boolean',
				'default'           => false,
				'description'       => __( 'Auto-optimize on upload.', 'ninja-media' ),
			),
			'keep_backup' => array(
				'required'          => false,
				'type'              => 'boolean',
				'default'           => true,
				'description'       => __( 'Keep backup of original.', 'ninja-media' ),
			),
			'convert_webp' => array(
				'required'          => false,
				'type'              => 'boolean',
				'default'           => false,
				'description'       => __( 'Convert to WebP after optimization.', 'ninja-media' ),
			),
			'strip_metadata' => array(
				'required'          => false,
				'type'              => 'boolean',
				'default'           => false,
				'description'       => __( 'Strip hidden metadata (EXIF/IPTC/XMP) on optimize.', 'ninja-media' ),
			),
		);
	}
}
