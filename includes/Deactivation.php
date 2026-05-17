<?php

namespace Pninja\NM;

use Pninja\NM\Utils\Helpers;

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

		if ( ! self::shouldDeleteData() ) {
			return;
		}

		self::removeTables();
		self::removePostMeta();
		self::removeTransients();
		self::removeOptions();

		/**
		 * Fires after all plugin data has been deleted on deactivation.
		 */
		do_action( 'pnpnm_after_deactivation_cleanup' );
	}

	private static function shouldDeleteData(): bool {
		return (bool) Helpers::getSetting( 'tools.deleteOnUninstall', false );
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
		];

		foreach ( $meta_keys as $meta_key ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- bulk delete of plugin meta on user-initiated data deletion.
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
			'pnpnm_delete_on_uninstall',
			'pnpnm_usage_scan_offset',
			PNPNM_OPTIONS_NAME,
		];

		foreach ( $options as $option ) {
			delete_option( $option );
		}
	}
}
