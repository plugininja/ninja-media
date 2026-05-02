<?php
namespace PluginInja\NM\API\Controllers;

use PluginInja\NM\API\BaseController;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

class ReplaceMedia extends BaseController {

	public function __construct() {
		parent::__construct( 'ninja-media/v1', 'replace-media' );
	}

	public function register_routes(): void {
		\register_rest_route(
			$this->namespace,
			$this->rest_base . '/(?P<id>\d+)',
			[
				[
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'replaceMedia' ],
					'permission_callback' => [ $this, 'checkPermission' ],
					'args'                => [
						'id' => [
							'description'       => \__( 'Attachment ID to replace.', 'ninja-media' ),
							'type'              => 'integer',
							'required'          => true,
							'validate_callback' => fn( $value ) => \is_numeric( $value ),
							'sanitize_callback' => 'absint',
						],
					],
				],
			]
		);
	}

	public function checkPermission( WP_REST_Request $request ): bool {
		$id = \absint( $request->get_param( 'id' ) );
		return \current_user_can( 'upload_files' ) && \current_user_can( 'edit_post', $id );
	}

	public function replaceMedia( WP_REST_Request $request ): WP_REST_Response {
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';

		$id = \absint( $request->get_param( 'id' ) );

		$post = \get_post( $id );

		if ( ! $post || 'attachment' !== $post->post_type ) {
			return $this->errorResponse(
				\__( 'Attachment not found.', 'ninja-media' ),
				self::HTTP_NOT_FOUND
			);
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- nonce is verified via X-WP-Nonce header by WP_REST_Server before this callback runs.
		// phpcs:disable WordPress.Security.ValidatedSanitizedInput.InputNotSanitized,WordPress.Security.ValidatedSanitizedInput.InputNotValidated -- wp_handle_upload() performs its own sanitization and mime validation internally.
		if (
			empty( $_FILES['file'] ) ||
			! \is_array( $_FILES['file'] ) ||
			UPLOAD_ERR_OK !== (int) ( $_FILES['file']['error'] ?? -1 )
		) {
			return $this->errorResponse(
				\__( 'No file was uploaded or an upload error occurred.', 'ninja-media' ),
				self::HTTP_BAD_REQUEST
			);
		}

		$old_file_path = \get_attached_file( $id );

		if ( ! $old_file_path || ! $this->fs()->exists( $old_file_path ) ) {
			return $this->errorResponse(
				\__( 'Original attachment file not found on disk.', 'ninja-media' ),
				self::HTTP_NOT_FOUND
			);
		}

		$old_dir         = \trailingslashit( \dirname( $old_file_path ) );
		$old_name_no_ext = \pathinfo( $old_file_path, PATHINFO_FILENAME );

		\do_action( 'pnpnm_before_replace_media', $id, $_FILES['file'] );

		$wp_upload = \wp_handle_upload(
			$_FILES['file'],
			[ 'test_form' => false, 'test_size' => true ]
		);
		// phpcs:enable WordPress.Security.NonceVerification.Missing,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized,WordPress.Security.ValidatedSanitizedInput.InputNotValidated

		if ( isset( $wp_upload['error'] ) ) {
			return $this->errorResponse(
				/* translators: %s: wp_handle_upload error string */
				\sprintf( \__( 'Upload failed: %s', 'ninja-media' ), $wp_upload['error'] ),
				self::HTTP_INTERNAL_SERVER_ERROR
			);
		}

		$temp_path     = $wp_upload['file'];
		$new_mime_type = $wp_upload['type'];
		$new_ext       = \pathinfo( $temp_path, PATHINFO_EXTENSION );

		$this->deleteOldThumbnails( $id, $old_dir );

		$new_filename = $old_name_no_ext . '.' . $new_ext;
		$final_path   = $old_dir . $new_filename;

		if ( \wp_normalize_path( $final_path ) !== \wp_normalize_path( $old_file_path ) ) {
			$this->fs()->delete( $old_file_path, false );
		}

		$fs = $this->fs();

		if ( \wp_normalize_path( $temp_path ) !== \wp_normalize_path( $final_path ) ) {
			$copied = $fs->copy( $temp_path, $final_path, true, FS_CHMOD_FILE );
			$fs->delete( $temp_path, false ); // Always clean up the temp copy.

			if ( ! $copied ) {
				return $this->errorResponse(
					\__( 'Failed to copy the uploaded file to its destination.', 'ninja-media' ),
					self::HTTP_INTERNAL_SERVER_ERROR
				);
			}
		}

		$fs->chmod( $final_path, FS_CHMOD_FILE );

		\delete_post_meta( $id, '_wp_attachment_metadata' );
		\delete_post_meta( $id, '_wp_attachment_backup_sizes' );
		\clean_post_cache( $id );
		\update_attached_file( $id, $final_path );

		\wp_update_post(
			[
				'ID'             => $id,
				'post_mime_type' => $new_mime_type,
				'post_title'     => $old_name_no_ext,
			]
		);

		\add_filter( 'big_image_size_threshold', '__return_false' );
		$metadata = \wp_generate_attachment_metadata( $id, $final_path );
		\remove_filter( 'big_image_size_threshold', '__return_false' );

		if ( \is_wp_error( $metadata ) ) {
			return $this->errorResponse( $metadata, self::HTTP_INTERNAL_SERVER_ERROR );
		}

		\wp_update_attachment_metadata( $id, $metadata ?: [] );
		\clean_post_cache( $id );

		\do_action( 'pnpnm_after_replace_media', $id, $final_path, $new_mime_type );

		$attachment_js = \wp_prepare_attachment_for_js( $id );

		if ( ! $attachment_js ) {
			return $this->errorResponse(
				\__( 'Media replaced but could not retrieve attachment data.', 'ninja-media' ),
				self::HTTP_INTERNAL_SERVER_ERROR
			);
		}

		return $this->successResponse(
			$attachment_js,
			\__( 'Media replaced successfully.', 'ninja-media' )
		);
	}

	private function deleteOldThumbnails( int $attachment_id, string $dir ): void {
		$metadata = \wp_get_attachment_metadata( $attachment_id );

		if ( empty( $metadata['sizes'] ) || ! \is_array( $metadata['sizes'] ) ) {
			return;
		}

		foreach ( $metadata['sizes'] as $size_data ) {
			if ( empty( $size_data['file'] ) ) {
				continue;
			}

			$thumb_path = $dir . $size_data['file'];

			if ( $this->fs()->exists( $thumb_path ) ) {
				$this->fs()->delete( $thumb_path, false );
			}
		}
	}

	private function fs(): \WP_Filesystem_Base {
		global $wp_filesystem;

		if ( ! $wp_filesystem ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
			\WP_Filesystem();
		}

		return $wp_filesystem;
	}
}
