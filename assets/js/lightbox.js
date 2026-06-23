;/* global pnpnm */
( function () {
	'use strict';

	// ── Image selectors targeted on the frontend ──────────────────────────────
	var SELECTORS = [
		'.entry-content img',
		'.post-content img',
		'.page-content img',
		'article img',
		'.wp-block-image img',
		'.wp-block-gallery img',
		'.wp-block-media-text img',
		'.blocks-gallery-item img',
		'figure.wp-caption img',
	].join( ', ' );

	var IMAGE_EXTS = /\.(jpe?g|png|gif|webp|svg|bmp|tiff?|avif|ico)(\?|$)/i;

	// ── Constants ─────────────────────────────────────────────────────────────
	var ZOOM_MIN  = 0.25;
	var ZOOM_MAX  = 4;
	var ZOOM_STEP = 0.25;

	// ── State ─────────────────────────────────────────────────────────────────
	var images     = [];
	var current    = 0;
	var overlay    = null;
	var stageEl    = null;
	var imgEl      = null;
	var nameEl     = null;
	var counterEl  = null;
	var zoomLevelEl = null;

	var zoomLevel  = 1;
	var panX       = 0;
	var panY       = 0;
	var isPanning  = false;
	var panStart   = { x: 0, y: 0 };

	// ── Bootstrap ─────────────────────────────────────────────────────────────
	function init() {
		var enabled =
			typeof pnpnm !== 'undefined' &&
			pnpnm.lightbox === true;

		if ( ! enabled ) {
			return;
		}

		buildOverlay();
		attachListeners();
	}

	// ── Collect all image elements on the page ────────────────────────────────
	function collectImages() {
		var nodes = document.querySelectorAll( SELECTORS );
		var found = [];

		nodes.forEach( function ( img ) {
			var src = fullSrc( img );
			if ( src ) {
				found.push( { el: img, src: src, alt: img.alt || '' } );
			}
		} );

		return found;
	}

	/**
	 * Resolve the full-size URL for an image.
	 * Priority: parent <a> href (if it points to an image) → img src.
	 */
	function fullSrc( img ) {
		var parent = img.parentElement;

		while ( parent && parent.tagName !== 'FIGURE' && parent.tagName !== 'BODY' ) {
			if ( parent.tagName === 'A' ) {
				var href = parent.getAttribute( 'href' ) || '';
				if ( IMAGE_EXTS.test( href ) ) {
					return href;
				}
				break;
			}
			parent = parent.parentElement;
		}

		var src = img.getAttribute( 'src' ) || '';
		return IMAGE_EXTS.test( src ) ? src : '';
	}

	// ── Build the overlay DOM (once) ──────────────────────────────────────────
	function buildOverlay() {
		overlay = document.createElement( 'div' );
		overlay.className = 'pnpnm-lb__backdrop';
		overlay.setAttribute( 'role', 'dialog' );
		overlay.setAttribute( 'aria-modal', 'true' );
		overlay.setAttribute( 'aria-label', 'Image lightbox' );
		overlay.style.display = 'none';

		// Nav buttons are direct children of backdrop so top:50% is
		// relative to the full viewport, not the image stage.
		overlay.innerHTML =
			'<div class="pnpnm-lb__header">' +
				'<span class="pnpnm-lb__name"></span>' +
				'<div class="pnpnm-lb__zoom-controls">' +
					'<button class="pnpnm-lb__zoom-btn pnpnm-lb__zoom-out" aria-label="Zoom out">&#8722;</button>' +
					'<span class="pnpnm-lb__zoom-level">100%</span>' +
					'<button class="pnpnm-lb__zoom-btn pnpnm-lb__zoom-in"  aria-label="Zoom in">&#43;</button>' +
				'</div>' +
				'<span class="pnpnm-lb__counter"></span>' +
				'<button class="pnpnm-lb__close" aria-label="Close lightbox">' +
					'<span class="pnpnm-lb__close-icon">&times;</span>' +
				'</button>' +
			'</div>' +
			'<div class="pnpnm-lb__stage">' +
				'<img class="pnpnm-lb__img" src="" alt="" draggable="false" />' +
			'</div>' +
			'<button class="pnpnm-lb__nav pnpnm-lb__nav--prev" aria-label="Previous image">&#8249;</button>' +
			'<button class="pnpnm-lb__nav pnpnm-lb__nav--next" aria-label="Next image">&#8250;</button>';

		document.body.appendChild( overlay );

		stageEl     = overlay.querySelector( '.pnpnm-lb__stage' );
		imgEl       = overlay.querySelector( '.pnpnm-lb__img' );
		nameEl      = overlay.querySelector( '.pnpnm-lb__name' );
		counterEl   = overlay.querySelector( '.pnpnm-lb__counter' );
		zoomLevelEl = overlay.querySelector( '.pnpnm-lb__zoom-level' );

		overlay.querySelector( '.pnpnm-lb__close'    ).addEventListener( 'click', close );
		overlay.querySelector( '.pnpnm-lb__nav--prev' ).addEventListener( 'click', prev );
		overlay.querySelector( '.pnpnm-lb__nav--next' ).addEventListener( 'click', next );
		overlay.querySelector( '.pnpnm-lb__zoom-in'  ).addEventListener( 'click', function () { zoom( ZOOM_STEP ); } );
		overlay.querySelector( '.pnpnm-lb__zoom-out' ).addEventListener( 'click', function () { zoom( -ZOOM_STEP ); } );

		// Close on backdrop click (outside image and controls).
		overlay.addEventListener( 'click', function ( e ) {
			if ( e.target === overlay || e.target === stageEl ) {
				close();
			}
		} );

		// Mouse-wheel zoom on stage.
		stageEl.addEventListener( 'wheel', function ( e ) {
			e.preventDefault();
			zoom( e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP );
		}, { passive: false } );

		// Drag-to-pan when zoomed in.
		imgEl.addEventListener( 'mousedown', function ( e ) {
			if ( zoomLevel <= 1 || e.button !== 0 ) return;
			isPanning = true;
			panStart  = { x: e.clientX - panX, y: e.clientY - panY };
			imgEl.style.cursor = 'grabbing';
			e.preventDefault();
		} );

		document.addEventListener( 'mousemove', function ( e ) {
			if ( ! isPanning ) return;
			panX = e.clientX - panStart.x;
			panY = e.clientY - panStart.y;
			applyTransform();
		} );

		document.addEventListener( 'mouseup', function () {
			if ( ! isPanning ) return;
			isPanning = false;
			imgEl.style.cursor = zoomLevel > 1 ? 'grab' : '';
		} );
	}

	// ── Attach click handlers to images ───────────────────────────────────────
	function attachListeners() {
		document.addEventListener( 'click', function ( e ) {
			var img = e.target.closest( SELECTORS );
			if ( ! img ) {
				return;
			}

			var src = fullSrc( img );
			if ( ! src ) {
				return;
			}

			// Prevent the parent <a> from navigating.
			var parent = img.parentElement;
			while ( parent && parent.tagName !== 'FIGURE' && parent.tagName !== 'BODY' ) {
				if ( parent.tagName === 'A' && IMAGE_EXTS.test( parent.getAttribute( 'href' ) || '' ) ) {
					e.preventDefault();
					break;
				}
				parent = parent.parentElement;
			}

			images  = collectImages();
			current = images.findIndex( function ( item ) {
				return item.el === img;
			} );

			if ( current === -1 ) {
				current = 0;
			}

			open();
		} );

		document.addEventListener( 'keydown', function ( e ) {
			if ( ! overlay || overlay.style.display === 'none' ) {
				return;
			}
			if ( e.key === 'Escape' )     { close(); }
			if ( e.key === 'ArrowRight' ) { next(); }
			if ( e.key === 'ArrowLeft' )  { prev(); }
			if ( e.key === '+' || e.key === '=' ) { zoom( ZOOM_STEP ); }
			if ( e.key === '-' ) { zoom( -ZOOM_STEP ); }
			if ( e.key === '0' ) { resetZoom(); }
		} );
	}

	// ── Show / hide ───────────────────────────────────────────────────────────
	function open() {
		render();
		overlay.style.display = 'flex';
		document.body.style.overflow = 'hidden';
		overlay.querySelector( '.pnpnm-lb__close' ).focus();
	}

	function close() {
		overlay.style.display = 'none';
		document.body.style.overflow = '';
		resetZoom();
	}

	function prev() {
		if ( current > 0 ) {
			current--;
			resetZoom();
			render();
		}
	}

	function next() {
		if ( current < images.length - 1 ) {
			current++;
			resetZoom();
			render();
		}
	}

	function render() {
		var item = images[ current ];
		if ( ! item ) {
			return;
		}

		imgEl.src             = item.src;
		imgEl.alt             = item.alt;
		nameEl.textContent    = item.alt || '';
		counterEl.textContent = ( current + 1 ) + ' / ' + images.length;

		var prevBtn = overlay.querySelector( '.pnpnm-lb__nav--prev' );
		var nextBtn = overlay.querySelector( '.pnpnm-lb__nav--next' );

		prevBtn.style.visibility = current > 0                  ? 'visible' : 'hidden';
		nextBtn.style.visibility = current < images.length - 1 ? 'visible' : 'hidden';
	}

	// ── Zoom ──────────────────────────────────────────────────────────────────
	function zoom( delta ) {
		zoomLevel = Math.min( ZOOM_MAX, Math.max( ZOOM_MIN, zoomLevel + delta ) );

		if ( zoomLevel <= 1 ) {
			panX = 0;
			panY = 0;
		}

		applyTransform();
	}

	function resetZoom() {
		zoomLevel = 1;
		panX      = 0;
		panY      = 0;
		applyTransform();
	}

	function applyTransform() {
		imgEl.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + zoomLevel + ')';
		imgEl.style.cursor    = zoomLevel > 1 ? ( isPanning ? 'grabbing' : 'grab' ) : '';

		if ( zoomLevelEl ) {
			zoomLevelEl.textContent = Math.round( zoomLevel * 100 ) + '%';
		}
	}

	// ── Run after DOM is ready ────────────────────────────────────────────────
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
}() );
