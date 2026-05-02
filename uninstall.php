<?php
/**
 * Uninstall routine for Ninja Media.
 *
 * Runs when the plugin is deleted from the WordPress admin.
 * Removes all plugin data: custom tables, options, transients, and post meta.
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

global $wpdb;

$pnpnm_delete_data = (bool) get_option( 'pnpnm_delete_on_uninstall', false );

if ( ! $pnpnm_delete_data ) {
	$pnpnm_settings = get_option( 'pnpnm_settings', [] );
	$pnpnm_delete_data = ! empty( $pnpnm_settings['tools']['deleteOnUninstall'] );
}

if ( ! $pnpnm_delete_data ) {
	return;
}

// Drop custom tables.
$pnpnm_tables = [
	$wpdb->prefix . 'pnpnm_folders',
	$wpdb->prefix . 'pnpnm_folder_relationships',
];

foreach ( $pnpnm_tables as $pnpnm_table ) {
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange -- intentional schema cleanup on uninstall.
	$wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', $pnpnm_table ) );
}

// Remove plugin options.
$pnpnm_options = [
	'pnpnm_version',
	'pnpnm_install_time',
	'pnpnm_db_version',
	'pnpnm_first_installed_version',
	'pnpnm_encryption_key',
	'pnpnm_notice',
	'pnpnm_settings',
	'pnpnm_delete_on_uninstall',
];

foreach ( $pnpnm_options as $pnpnm_option ) {
	delete_option( $pnpnm_option );
}

// Remove plugin transients.
$pnpnm_pattern1 = $wpdb->esc_like( '_transient_pnpnm_' ) . '%';
$pnpnm_pattern2 = $wpdb->esc_like( '_transient_timeout_pnpnm_' ) . '%';

// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- direct delete of plugin transients on uninstall.
$wpdb->query(
	$wpdb->prepare(
		"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
		$pnpnm_pattern1,
		$pnpnm_pattern2
	)
);

// Remove all post meta added by this plugin.
$pnpnm_meta_keys = [
	'_pnpnm_media_folder_id',
	'_pnpnm_media_trashed',
	'_pnpnm_watermark_applied',
];

foreach ( $pnpnm_meta_keys as $pnpnm_meta_key ) {
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- bulk delete of plugin meta on uninstall.
	$wpdb->delete( $wpdb->postmeta, [ 'meta_key' => $pnpnm_meta_key ], [ '%s' ] );
}
