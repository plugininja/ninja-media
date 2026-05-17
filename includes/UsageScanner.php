<?php

namespace Pninja\NM;

use Pninja\NM\Models\BaseModel;
use Pninja\NM\Utils\Singleton;

defined( 'ABSPATH' ) || exit( 'No direct script access allowed' );

/**
 * Schedules and processes background batches that populate the
 * _pnpnm_media_used post-meta flag for every attachment.
 *
 * Usage flow:
 *   1. getTree() calls maybeScheduleScan() on every request.
 *   2. If no fresh scan exists, a single-event cron is queued immediately.
 *   3. processBatch() runs BATCH_SIZE attachments per cron tick, then
 *      re-queues itself until every attachment has been processed.
 *   4. On completion a transient is set so getTree() stays quiet for
 *      STALE_SECONDS before allowing another full scan.
 */
class UsageScanner {

	use Singleton;

	private const CRON_HOOK      = 'pnpnm_usage_scan_batch';
	private const OFFSET_OPTION  = 'pnpnm_usage_scan_offset';
	private const LAST_TRANSIENT = 'pnpnm_usage_scan_last';
	private const BATCH_SIZE     = 100;
	private const STALE_SECONDS  = 12 * HOUR_IN_SECONDS;

	public function __construct() {
		add_action( self::CRON_HOOK, [ $this, 'processBatch' ] );
	}

	/**
	 * Called from getTree — schedules a full scan when data is stale.
	 */
	public function maybeScheduleScan(): void {
		if ( false !== get_transient( self::LAST_TRANSIENT ) ) {
			return;
		}

		if ( wp_next_scheduled( self::CRON_HOOK ) ) {
			return;
		}

		delete_option( self::OFFSET_OPTION );
		wp_schedule_single_event( time(), self::CRON_HOOK );
	}

	/**
	 * Processes one batch of attachments, then re-queues the next batch.
	 */
	public function processBatch(): void {
		$offset = (int) get_option( self::OFFSET_OPTION, 0 );

		$ids = get_posts( [
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'posts_per_page' => self::BATCH_SIZE,
			'offset'         => $offset,
			'fields'         => 'ids',
			'orderby'        => 'ID',
			'order'          => 'ASC',
		] );

		if ( empty( $ids ) ) {
			delete_option( self::OFFSET_OPTION );
			set_transient( self::LAST_TRANSIENT, time(), self::STALE_SECONDS );
			wp_cache_delete( 'last_changed', 'pnpnm' );

			/**
			 * Fires when the background usage scan has finished processing
			 * all attachments and _pnpnm_media_used flags are up-to-date.
			 */
			do_action( 'pnpnm_usage_scan_complete' );
			return;
		}

		foreach ( $ids as $id ) {
			BaseModel::syncUsageFlag( (int) $id );
		}

		update_option( self::OFFSET_OPTION, $offset + count( $ids ), false );

		if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
			wp_schedule_single_event( time(), self::CRON_HOOK );
		}
	}

	/**
	 * Clears all scheduled events and resets scan state.
	 * Call on plugin deactivation.
	 */
	public static function clearScheduled(): void {
		wp_clear_scheduled_hook( self::CRON_HOOK );
		delete_option( self::OFFSET_OPTION );
	}
}
