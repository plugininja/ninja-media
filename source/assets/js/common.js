/* global pnpnm, wp */
( function () {
	'use strict';

	var banner = document.getElementById( 'pnpnm-review-banner' );
	if ( ! banner ) {
		return;
	}

	banner.addEventListener( 'click', function ( e ) {
		var trigger = e.target.closest( '[data-pnpnm-action]' );
		if ( ! trigger ) {
			return;
		}

		var action = trigger.getAttribute( 'data-pnpnm-action' );

		if ( trigger.tagName === 'A' && trigger.getAttribute( 'href' ) === '#' ) {
			e.preventDefault();
		}

		banner.style.display = 'none';

		wp.ajax.post( 'pnpnm_review_' + action, {
			review_nonce: pnpnm.reviewBannerNonce,
		} ).fail( function () {
			banner.style.display = '';
		} );
	} );
}() );