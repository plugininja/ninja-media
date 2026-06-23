<?php
/**
 * Image Optimizer — admin hooks: media columns, auto-optimize on upload,
 * GD availability notice, and asset enqueuing.
 *
 * @package Pninja\NM\Modules\ImageOptimizer
 */

namespace Pninja\NM\Modules\ImageOptimizer;

use Pninja\NM\Utils\WpFilesystem;

defined( 'ABSPATH' ) || exit;

class OptimizerAdmin {

	use WpFilesystem;

	public function __construct() {
		$this->doHooks();
	}

	public function doHooks(): void {
		add_action( 'admin_init', array( $this, 'check_gd' ) );
		add_filter( 'manage_media_columns', array( $this, 'add_column' ) );
		add_action( 'manage_media_custom_column', array( $this, 'render_column' ), 10, 2 );
		add_filter( 'wp_generate_attachment_metadata', array( $this, 'auto_optimize_on_upload' ), 10, 2 );
	}

	public static function shouldLoadAssets( string $hook ): bool {
		return 'upload.php' === $hook;
	}

	// -------------------------------------------------------------------------
	// GD check
	// -------------------------------------------------------------------------

	public function check_gd(): void {
		if ( ! function_exists( 'gd_info' ) ) {
			add_action( 'admin_notices', array( $this, 'notice_gd_missing' ) );
		}
	}

	public function notice_gd_missing(): void {
		?>
		<div class="notice notice-error is-dismissible pnpnm-notice">
			<p>
				<?php esc_html_e( 'Ninja Media — Image Optimizer requires the PHP GD extension, which is not currently available on your server. Please contact your host to enable it.', 'ninja-media' ); ?>
			</p>
		</div>
		<?php
	}

	// -------------------------------------------------------------------------
	// Media list-view column
	// -------------------------------------------------------------------------

	public function add_column( array $columns ): array {
		$columns['pnpnm_optimization'] = __( 'Optimization', 'ninja-media' );
		return $columns;
	}

	public function render_column( string $column, int $post_id ): void {
		if ( 'pnpnm_optimization' !== $column ) {
			return;
		}

		$mime = get_post_mime_type( $post_id );
		if ( ! in_array( $mime, array( 'image/jpeg', 'image/png' ), true ) ) {
			echo '<span class="pnpnm-opt-na">—</span>';
			return;
		}

		$optimized_at = get_post_meta( $post_id, 'pnpnm_optimized_at', true );

		if ( $optimized_at ) {
			$savings    = (float) get_post_meta( $post_id, 'pnpnm_savings_percent', true );
			$orig       = (int) get_post_meta( $post_id, 'pnpnm_original_size', true );
			$opt        = (int) get_post_meta( $post_id, 'pnpnm_optimized_size', true );
			$has_backup = (bool) get_post_meta( $post_id, 'pnpnm_backup_path', true );

			if ( $savings > 0 ) {
				echo '<span class="pnpnm-opt-badge pnpnm-opt-badge--done">';
				echo '&#10003; ';
				// translators: %s is the percentage of file size saved after optimization.
				echo esc_html( sprintf( __( '%s%% saved', 'ninja-media' ), number_format( $savings, 1 ) ) );
				echo '</span>';
				echo '<br><small class="pnpnm-opt-sizes">';
				echo esc_html( size_format( $orig ) . ' → ' . size_format( $opt ) );
				echo '</small>';
			} else {
				echo '<span class="pnpnm-opt-badge pnpnm-opt-badge--done">';
				echo esc_html__( '&#10003; Already optimal', 'ninja-media' );
				echo '</span>';
			}

			if ( $has_backup ) {
				printf(
					'<br><button type="button" class="button button-small pnpnm-opt-restore" data-id="%d">%s</button>',
					absint( $post_id ),
					esc_html__( 'Restore Original', 'ninja-media' )
				);
			}
		} else {
			$file = get_attached_file( $post_id );
			$fs   = $this->fs();
			$size = ( $file && $fs->exists( $file ) ) ? size_format( (int) $fs->size( $file ) ) : '—';

			printf(
				'<span class="pnpnm-opt-size">%s</span> ' .
				'<button type="button" class="button button-small pnpnm-opt-optimize" data-id="%d">%s</button>',
				esc_html( $size ),
				absint( $post_id ),
				esc_html__( 'Optimize', 'ninja-media' )
			);
		}
	}

	// -------------------------------------------------------------------------
	// Auto-optimize on upload
	// -------------------------------------------------------------------------

	public function auto_optimize_on_upload( array $metadata, int $attachment_id ): array {
		$settings = get_option( 'pnpnm_optimizer_settings', array() );
		if ( empty( $settings['auto_optimize'] ) ) {
			return $metadata;
		}

		$mime = get_post_mime_type( $attachment_id );
		if ( ! in_array( $mime, array( 'image/jpeg', 'image/png' ), true ) ) {
			return $metadata;
		}

		$defaults = array(
			'quality'        => 82,
			'type'           => 'lossy',
			'keep_backup'    => true,
			'convert_webp'   => false,
			'strip_metadata' => false,
		);

		$engine = new Optimizer();
		$engine->optimize( $attachment_id, wp_parse_args( $settings, $defaults ) );

		return $metadata;
	}

	// -------------------------------------------------------------------------
	// Helpers
	// -------------------------------------------------------------------------

}
