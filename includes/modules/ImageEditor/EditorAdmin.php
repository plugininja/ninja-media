<?php
/**
 * Image Editor — admin hooks: attachment button, asset enqueuing.
 *
 * @package Pninja\NM\Modules\ImageEditor
 */

namespace Pninja\NM\Modules\ImageEditor;

defined( 'ABSPATH' ) || exit;

class EditorAdmin {

	public function __construct() {
		$this->doHooks();
	}

	public function doHooks(): void {
		add_action( 'attachment_submitbox_misc_actions', array( $this, 'render_open_editor_button' ) );
	}

	public static function isAttachmentEditScreen( string $hook ): bool {
		if ( 'post.php' !== $hook ) {
			return false;
		}

		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;

		if ( ! $screen ) {
			return false;
		}

		return 'attachment' === $screen->post_type;
	}

	// -------------------------------------------------------------------------
	// Open-in-editor button on attachment edit screen
	// -------------------------------------------------------------------------

	public function render_open_editor_button(): void {
		global $post;

		if ( ! $post || 'attachment' !== $post->post_type ) {
			return;
		}

		$mime = get_post_mime_type( $post->ID );
		if ( ! in_array( $mime, array( 'image/jpeg', 'image/png', 'image/webp' ), true ) ) {
			return;
		}

		printf(
			'<div class="misc-pub-section pnpnm-editor-open-wrap">'
			. '<button type="button" class="button button-secondary pnpnm-editor-open-btn" data-id="%d">%s</button>'
			. '</div>',
			absint( $post->ID ),
			esc_html__( 'Open in Image Editor', 'ninja-media' )
		);
	}

}
