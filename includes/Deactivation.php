<?php

namespace Pninja\NM;

defined( 'ABSPATH' ) || exit( 'No direct script access allowed' );

class Deactivation {

	public static function init( bool $network_wide = false ): void {
		if ( is_multisite() && $network_wide ) {
			$sites = get_sites( [ 'fields' => 'ids', 'number' => 0 ] );
			foreach ( $sites as $blog_id ) {
				switch_to_blog( $blog_id );
				self::deactivateSite();
				restore_current_blog();
			}
		} else {
			self::deactivateSite();
		}

		flush_rewrite_rules();
	}

	private static function deactivateSite(): void {
		UsageScanner::clearScheduled();
		// Data deletion is handled exclusively by uninstall.php (WP guideline #10).
		// Deactivation is reversible — data must be preserved.
	}

	/**
	 * Unconditionally removes all plugin data for the current blog.
	 * Called when a network site is deleted via the wp_delete_site action.
	 */
	public static function cleanupSite(): void {
		UsageScanner::clearScheduled();
		self::removeTables();
		self::removePostMeta();
		self::removeTransients();
		self::removeOptions();
	}

	private static function removeTables(): void {
		global $wpdb;

		$tables = [
			$wpdb->prefix . 'pnpnm_folders',
			$wpdb->prefix . 'pnpnm_folder_relationships',
		];

		foreach ( $tables as $table ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange -- intentional schema cleanup on user-initiated data deletion.
			$wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', $table ) );
		}
	}

	private static function removePostMeta(): void {
		global $wpdb;

		$meta_keys = [
			'_pnpnm_media_folder_id',
			'_pnpnm_media_used',
			'pnpnm_original_size',
			'pnpnm_optimized_size',
			'pnpnm_savings_percent',
			'pnpnm_optimized_at',
			'pnpnm_backup_path',
			'pnpnm_webp_path',
			'pnpnm_metadata_stripped',
			'pnpnm_metadata_stripped_at',
			'pnpnm_metadata_size_before',
			'pnpnm_metadata_size_after',
		];

		foreach ( $meta_keys as $meta_key ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- bulk delete of plugin meta on site cleanup.
			$wpdb->delete( $wpdb->postmeta, [ 'meta_key' => $meta_key ], [ '%s' ] );
		}
	}

	private static function removeTransients(): void {
		global $wpdb;

		$pattern1 = $wpdb->esc_like( '_transient_pnpnm_' ) . '%';
		$pattern2 = $wpdb->esc_like( '_transient_timeout_pnpnm_' ) . '%';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- direct delete of plugin transients on user-initiated data deletion.
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
				$pattern1,
				$pattern2
			)
		);
	}

	private static function removeOptions(): void {
		$options = [
			'pnpnm_version',
			'pnpnm_db_version',
			'pnpnm_options_version',
			'pnpnm_install_time',
			'pnpnm_first_installed_version',
			'pnpnm_encryption_key',
			'pnpnm_notice',
			'pnpnm_review_banner',
			'pnpnm_delete_on_uninstall',
			'pnpnm_usage_scan_offset',
			'pnpnm_optimizer_settings',
			'pnpnm_editor_settings',
			'pnpnm_default_featured_image_id',
			PNPNM_OPTIONS_NAME,
		];

		foreach ( $options as $option ) {
			delete_option( $option );
		}
	}
}
