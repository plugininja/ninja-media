<?php
/**
 * Image Optimizer Engine — uses PHP GD only.
 *
 * All file I/O goes through WP_Filesystem.
 * GD functions write directly to disk paths (no WP_Filesystem equivalent),
 * but existence and size checks use $this->fs() throughout.
 *
 * @package Pninja\NM\Modules\ImageOptimizer
 */

namespace Pninja\NM\Modules\ImageOptimizer;

use Pninja\NM\Utils\WpFilesystem;

defined( 'ABSPATH' ) || exit;

class Optimizer {

	use WpFilesystem;

	/**
	 * Optimize a single attachment.
	 *
	 * @param int   $attachment_id
	 * @param array $settings  { quality, type, keep_backup, convert_webp }
	 * @return array|\WP_Error
	 */
	public function optimize( int $attachment_id, array $settings ) {
		if ( ! function_exists( 'gd_info' ) ) {
			return new \WP_Error( 'gd_missing', __( 'GD library is not available.', 'ninja-media' ) );
		}

		$fs   = $this->fs();
		$file = get_attached_file( $attachment_id );

		if ( ! $file || ! $fs->exists( $file ) ) {
			return new \WP_Error( 'file_missing', __( 'Attachment file not found.', 'ninja-media' ) );
		}

		$mime = get_post_mime_type( $attachment_id );
		if ( ! in_array( $mime, array( 'image/jpeg', 'image/png' ), true ) ) {
			return new \WP_Error( 'unsupported_type', __( 'Only JPEG and PNG images are supported.', 'ninja-media' ) );
		}

		$original_size = (int) $fs->size( $file );

		$backup_path = $this->backup_file( $file, ! empty( $settings['keep_backup'] ) );
		if ( is_wp_error( $backup_path ) ) {
			return $backup_path;
		}

		$quality = absint( $settings['quality'] ?? 82 );
		$quality = max( 60, min( 100, $quality ) );

		// process_image() writes to a temp file and returns its path.
		$tmp_path = $this->process_image( $file, $mime, $quality );
		if ( is_wp_error( $tmp_path ) ) {
			return $tmp_path;
		}

		clearstatcache( true, $tmp_path );
		$optimized_size = (int) @filesize( $tmp_path );

		if ( $optimized_size <= 0 || $optimized_size >= $original_size ) {
			// GD produced a larger (or equal) file — discard and keep the original.
			@unlink( $tmp_path );
			$optimized_size = $original_size;
			$savings_pct    = 0.00;
		} else {
			// Replace the original only when the encoded version is actually smaller.
			if ( ! $fs->copy( $tmp_path, $file, true ) ) {
				@unlink( $tmp_path );
				return new \WP_Error( 'replace_failed', __( 'Failed to replace image with optimized version.', 'ninja-media' ) );
			}
			@unlink( $tmp_path );
			clearstatcache( true, $file );
			$savings_pct = round( ( ( $original_size - $optimized_size ) / $original_size ) * 100, 2 );
		}

		$webp_path = '';
		if ( ! empty( $settings['convert_webp'] ) && function_exists( 'imagewebp' ) ) {
			$webp_path = $this->convert_to_webp( $file, $mime, $quality );
		}

		update_post_meta( $attachment_id, 'pnpnm_original_size', $original_size );
		update_post_meta( $attachment_id, 'pnpnm_optimized_size', $optimized_size );
		update_post_meta( $attachment_id, 'pnpnm_savings_percent', $savings_pct );
		update_post_meta( $attachment_id, 'pnpnm_optimized_at', time() );
		update_post_meta( $attachment_id, 'pnpnm_backup_path', $backup_path );
		update_post_meta( $attachment_id, 'pnpnm_webp_path', $webp_path );

		do_action( 'pnpnm_after_optimize', $attachment_id, $original_size, $optimized_size );

		return array(
			'success'         => true,
			'attachment_id'   => $attachment_id,
			'original_size'   => $original_size,
			'optimized_size'  => $optimized_size,
			'savings_percent' => $savings_pct,
		);
	}

	/**
	 * Restore an attachment from its backup.
	 *
	 * @param int $attachment_id
	 * @return array|\WP_Error
	 */
	public function restore( int $attachment_id ) {
		$fs          = $this->fs();
		$backup_path = get_post_meta( $attachment_id, 'pnpnm_backup_path', true );

		if ( empty( $backup_path ) || ! $fs->exists( $backup_path ) ) {
			return new \WP_Error( 'no_backup', __( 'No backup file found for this image.', 'ninja-media' ) );
		}

		$file = get_attached_file( $attachment_id );
		if ( ! $file ) {
			return new \WP_Error( 'file_missing', __( 'Attachment file path not found.', 'ninja-media' ) );
		}

		if ( ! $fs->copy( $backup_path, $file, true ) ) {
			return new \WP_Error( 'restore_failed', __( 'Failed to restore backup file.', 'ninja-media' ) );
		}

		$fs->delete( $backup_path );

		$webp_path = get_post_meta( $attachment_id, 'pnpnm_webp_path', true );
		if ( $webp_path && $fs->exists( $webp_path ) ) {
			$fs->delete( $webp_path );
		}

		foreach ( array(
			'pnpnm_original_size',
			'pnpnm_optimized_size',
			'pnpnm_savings_percent',
			'pnpnm_optimized_at',
			'pnpnm_backup_path',
			'pnpnm_webp_path',
		) as $key ) {
			delete_post_meta( $attachment_id, $key );
		}

		do_action( 'pnpnm_after_restore', $attachment_id );

		return array(
			'success'       => true,
			'attachment_id' => $attachment_id,
			'message'       => __( 'Image restored successfully.', 'ninja-media' ),
		);
	}

	/**
	 * Strip hidden metadata (EXIF / IPTC / XMP / tEXt chunks) from an image.
	 *
	 * GD re-encodes pixel data without metadata markers.
	 * JPEG is re-saved at quality 95 to minimise generation loss.
	 *
	 * @param int  $attachment_id
	 * @param bool $keep_backup Whether to save the original before stripping.
	 * @return array|\WP_Error
	 */
	public function strip_metadata( int $attachment_id, bool $keep_backup = true ) {
		if ( ! function_exists( 'gd_info' ) ) {
			return new \WP_Error( 'gd_missing', __( 'GD library is not available.', 'ninja-media' ) );
		}

		$fs   = $this->fs();
		$file = get_attached_file( $attachment_id );

		if ( ! $file || ! $fs->exists( $file ) ) {
			return new \WP_Error( 'file_missing', __( 'Attachment file not found.', 'ninja-media' ) );
		}

		$mime = get_post_mime_type( $attachment_id );
		if ( ! in_array( $mime, array( 'image/jpeg', 'image/png' ), true ) ) {
			return new \WP_Error( 'unsupported_type', __( 'Only JPEG and PNG images support metadata stripping.', 'ninja-media' ) );
		}

		$original_size = (int) $fs->size( $file );

		$backup_path = $this->backup_file( $file, $keep_backup );
		if ( is_wp_error( $backup_path ) ) {
			return $backup_path;
		}

		if ( 'image/jpeg' === $mime ) {
			$img = @imagecreatefromjpeg( $file );
			if ( false === $img ) {
				return new \WP_Error( 'gd_load_failed', __( 'Failed to load JPEG for metadata stripping.', 'ninja-media' ) );
			}
			$ok = imagejpeg( $img, $file, 95 );
		} else {
			$img = @imagecreatefrompng( $file );
			if ( false === $img ) {
				return new \WP_Error( 'gd_load_failed', __( 'Failed to load PNG for metadata stripping.', 'ninja-media' ) );
			}
			imagealphablending( $img, false );
			imagesavealpha( $img, true );
			$ok = imagepng( $img, $file, 2 );
		}

		imagedestroy( $img );

		if ( ! $ok ) {
			return new \WP_Error( 'gd_save_failed', __( 'Failed to save image after metadata stripping.', 'ninja-media' ) );
		}

		clearstatcache( true, $file );
		$stripped_size = (int) $fs->size( $file );

		update_post_meta( $attachment_id, 'pnpnm_metadata_stripped', 1 );
		update_post_meta( $attachment_id, 'pnpnm_metadata_stripped_at', time() );
		update_post_meta( $attachment_id, 'pnpnm_metadata_size_before', $original_size );
		update_post_meta( $attachment_id, 'pnpnm_metadata_size_after', $stripped_size );

		if ( $backup_path && ! get_post_meta( $attachment_id, 'pnpnm_backup_path', true ) ) {
			update_post_meta( $attachment_id, 'pnpnm_backup_path', $backup_path );
		}

		do_action( 'pnpnm_after_strip_metadata', $attachment_id, $original_size, $stripped_size );

		return array(
			'success'       => true,
			'attachment_id' => $attachment_id,
			'size_before'   => $original_size,
			'size_after'    => $stripped_size,
			'bytes_saved'   => max( 0, $original_size - $stripped_size ),
		);
	}

	/**
	 * Get optimizer statistics across all images.
	 *
	 * @return array
	 */
	public function get_stats(): array {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- aggregate COUNT across post types; no WP_Query equivalent for cross-table stats.
		$total_images = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$wpdb->posts}
				WHERE post_type = %s
				AND post_mime_type IN ('image/jpeg','image/png')
				AND post_status = %s",
				'attachment',
				'inherit'
			)
		);

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- aggregate COUNT on postmeta; no WP_Query equivalent.
		$total_optimized = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(DISTINCT post_id) FROM {$wpdb->postmeta}
				WHERE meta_key = %s",
				'pnpnm_optimized_at'
			)
		);

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- bulk retrieval of savings values for in-PHP averaging; no WP_Query equivalent.
		$savings_rows = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT meta_value FROM {$wpdb->postmeta} WHERE meta_key = %s",
				'pnpnm_savings_percent'
			)
		);

		$total_savings_pct = 0.0;
		if ( ! empty( $savings_rows ) ) {
			$positive = array_filter( array_map( 'floatval', $savings_rows ), fn( $v ) => $v > 0 );
			$total_savings_pct = ! empty( $positive )
				? round( array_sum( $positive ) / count( $positive ), 2 )
				: 0.0;
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- SUM aggregate on postmeta; no WP_Query equivalent.
		$orig_sum = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT SUM(meta_value) FROM {$wpdb->postmeta} WHERE meta_key = %s",
				'pnpnm_original_size'
			)
		);
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- SUM aggregate on postmeta; no WP_Query equivalent.
		$opt_sum  = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT SUM(meta_value) FROM {$wpdb->postmeta} WHERE meta_key = %s",
				'pnpnm_optimized_size'
			)
		);

		return array(
			'total_images'          => $total_images,
			'total_optimized'       => $total_optimized,
			'total_unoptimized'     => max( 0, $total_images - $total_optimized ),
			'total_savings_bytes'   => max( 0, $orig_sum - $opt_sum ),
			'total_savings_percent' => $total_savings_pct,
		);
	}

	/**
	 * Get a batch of unoptimized attachment IDs.
	 *
	 * @param int $offset
	 * @param int $limit
	 * @return int[]
	 */
	public function get_unoptimized_ids( int $offset = 0, int $limit = 10 ): array {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- LEFT JOIN anti-pattern to find unoptimized attachments; no WP_Query equivalent.
		return array_map(
			'absint',
			$wpdb->get_col(
				$wpdb->prepare(
					"SELECT p.ID FROM {$wpdb->posts} p
					LEFT JOIN {$wpdb->postmeta} pm
						ON p.ID = pm.post_id AND pm.meta_key = 'pnpnm_optimized_at'
					WHERE p.post_type = 'attachment'
					AND p.post_status = 'inherit'
					AND p.post_mime_type IN ('image/jpeg','image/png')
					AND pm.meta_id IS NULL
					ORDER BY p.ID ASC
					LIMIT %d OFFSET %d",
					$limit,
					$offset
				)
			)
		);
	}

	/**
	 * Count attachments that have not had metadata stripped.
	 *
	 * @return int
	 */
	public function count_unstripped(): int {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- LEFT JOIN anti-pattern COUNT; no WP_Query equivalent.
		return (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(p.ID) FROM {$wpdb->posts} p
				LEFT JOIN {$wpdb->postmeta} pm
					ON p.ID = pm.post_id AND pm.meta_key = %s
				WHERE p.post_type = %s
				AND p.post_status = %s
				AND p.post_mime_type IN ('image/jpeg','image/png')
				AND pm.meta_id IS NULL",
				'pnpnm_metadata_stripped',
				'attachment',
				'inherit'
			)
		);
	}

	/**
	 * Get IDs of attachments that have not had metadata stripped.
	 *
	 * @param int $offset
	 * @param int $limit
	 * @return int[]
	 */
	public function get_unstripped_ids( int $offset = 0, int $limit = 10 ): array {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- LEFT JOIN anti-pattern to find unstripped attachments; no WP_Query equivalent.
		return array_map(
			'absint',
			$wpdb->get_col(
				$wpdb->prepare(
					"SELECT p.ID FROM {$wpdb->posts} p
					LEFT JOIN {$wpdb->postmeta} pm
						ON p.ID = pm.post_id AND pm.meta_key = 'pnpnm_metadata_stripped'
					WHERE p.post_type = 'attachment'
					AND p.post_status = 'inherit'
					AND p.post_mime_type IN ('image/jpeg','image/png')
					AND pm.meta_id IS NULL
					ORDER BY p.ID ASC
					LIMIT %d OFFSET %d",
					$limit,
					$offset
				)
			)
		);
	}

	// -------------------------------------------------------------------------
	// Private helpers
	// -------------------------------------------------------------------------

	/**
	 * Encode the image to a temporary file and return its path.
	 * The caller is responsible for comparing sizes and replacing the original.
	 *
	 * @return string|\WP_Error Absolute path to the temp file, or WP_Error on failure.
	 */
	private function process_image( string $file, string $mime, int $quality ) {
		if ( 'image/jpeg' === $mime ) {
			return $this->process_jpeg( $file, $quality );
		}

		return $this->process_png( $file, $quality );
	}

	private function process_jpeg( string $file, int $quality ) {
		$img = @imagecreatefromjpeg( $file );
		if ( false === $img ) {
			return new \WP_Error( 'gd_load_failed', __( 'Failed to load JPEG image.', 'ninja-media' ) );
		}

		$tmp = $file . '.pnpnm-tmp';
		$ok  = imagejpeg( $img, $tmp, $quality );
		imagedestroy( $img );

		if ( ! $ok ) {
			@unlink( $tmp );
			return new \WP_Error( 'gd_save_failed', __( 'Failed to save optimized JPEG.', 'ninja-media' ) );
		}

		return $tmp;
	}

	private function process_png( string $file, int $quality ) {
		$img = @imagecreatefrompng( $file );
		if ( false === $img ) {
			return new \WP_Error( 'gd_load_failed', __( 'Failed to load PNG image.', 'ninja-media' ) );
		}

		imagealphablending( $img, false );
		imagesavealpha( $img, true );

		// Map quality 60–100 → PNG compression 9–0.
		$compression = (int) round( 9 - ( ( $quality - 60 ) / 40 ) * 9 );
		$compression = max( 0, min( 9, $compression ) );

		$tmp = $file . '.pnpnm-tmp';
		$ok  = imagepng( $img, $tmp, $compression );
		imagedestroy( $img );

		if ( ! $ok ) {
			@unlink( $tmp );
			return new \WP_Error( 'gd_save_failed', __( 'Failed to save optimized PNG.', 'ninja-media' ) );
		}

		return $tmp;
	}

	private function convert_to_webp( string $file, string $mime, int $quality ): string {
		$img = ( 'image/jpeg' === $mime ) ? @imagecreatefromjpeg( $file ) : @imagecreatefrompng( $file );

		if ( false === $img ) {
			return '';
		}

		$webp_file = preg_replace( '/\.(jpe?g|png)$/i', '.webp', $file );
		imagewebp( $img, $webp_file, $quality );
		imagedestroy( $img );

		return $this->fs()->exists( $webp_file ) ? $webp_file : '';
	}

	/**
	 * Copy the original file to a backup path before modifying it.
	 *
	 * @param string $file        Absolute path to the source file.
	 * @param bool   $keep_backup Whether to create the backup.
	 * @return string|\WP_Error   Backup path, empty string if skipped, or WP_Error on failure.
	 */
	private function backup_file( string $file, bool $keep_backup ) {
		if ( ! $keep_backup ) {
			return '';
		}

		$info        = pathinfo( $file );
		$backup_path = $info['dirname'] . DIRECTORY_SEPARATOR
			. $info['filename'] . '-pnpnm-original.' . $info['extension'];

		$fs = $this->fs();

		// Never overwrite an existing backup — preserves the true original.
		if ( $fs->exists( $backup_path ) ) {
			return $backup_path;
		}

		if ( ! $fs->copy( $file, $backup_path, false ) ) {
			return new \WP_Error( 'backup_failed', __( 'Failed to create backup of original image.', 'ninja-media' ) );
		}

		return $backup_path;
	}

}
