/**
 * optimizer.js
 * Handles: settings page bulk optimizer UI, media list-view column actions,
 * and media grid-view hover button.
 *
 * Reads window.pnpnm for restUrl and nonce (already localized by Enqueue.php).
 * Reads window.pnpnmOptimizer for i18n strings (localized by OptimizerAdmin).
 */
( function () {
	'use strict';

	const base  = ( window.pnpnm && window.pnpnm.restUrl ? window.pnpnm.restUrl : '' ).replace( /\/$/, '' );
	const nonce = window.pnpnm && window.pnpnm.nonce ? window.pnpnm.nonce : '';
	const i18n  = window.pnpnmOptimizer || {};

	// -------------------------------------------------------------------------
	// Visibility helpers — use both inline style and CSS class so the toggle
	// works regardless of whether the browser has cached an older stylesheet
	// that may not have the .pnpnm-hidden rule yet.
	// -------------------------------------------------------------------------

	function showEl( el ) {
		if ( ! el ) return;
		el.classList.remove( 'pnpnm-hidden' );
		el.style.display = '';
	}

	function hideEl( el ) {
		if ( ! el ) return;
		el.classList.add( 'pnpnm-hidden' );
		el.style.display = 'none';
	}

	// -------------------------------------------------------------------------
	// REST helper
	// -------------------------------------------------------------------------

	function apiFetch( path, method, body ) {
		const opts = {
			method      : method || 'GET',
			credentials : 'same-origin',
			headers     : {
				'Content-Type' : 'application/json',
				'X-WP-Nonce'   : nonce,
			},
		};
		if ( body ) {
			opts.body = JSON.stringify( body );
		}
		return fetch( base + path, opts ).then( function ( r ) { return r.json(); } );
	}

	function formatBytes( bytes ) {
		if ( bytes < 1024 ) return bytes + ' B';
		if ( bytes < 1048576 ) return ( bytes / 1024 ).toFixed( 1 ) + ' KB';
		return ( bytes / 1048576 ).toFixed( 2 ) + ' MB';
	}

	// -------------------------------------------------------------------------
	// Settings page — optimizer tab
	// -------------------------------------------------------------------------

	function initOptimizerSettings() {
		const saveBtn = document.getElementById( 'pnpnm-save-optimizer' );
		if ( ! saveBtn ) return;

		saveBtn.addEventListener( 'click', function () {
			const msg     = document.getElementById( 'pnpnm-optimizer-save-msg' );
			const smEl    = document.querySelector( '[name=strip_metadata]' );
			const payload = {
				quality        : parseInt( document.getElementById( 'pnpnm-quality' ).value, 10 ),
				type           : document.getElementById( 'pnpnm-type' ).value,
				auto_optimize  : document.querySelector( '[name=auto_optimize]' ).checked,
				keep_backup    : document.querySelector( '[name=keep_backup]' ).checked,
				convert_webp   : document.querySelector( '[name=convert_webp]' ).checked,
				strip_metadata : !! smEl && smEl.checked,
			};

			saveBtn.disabled = true;

			apiFetch( '/optimizer/settings', 'PUT', payload ).then( function ( res ) {
				msg.className   = res.success ? 'pnpnm-save-msg pnpnm-save-msg--ok' : 'pnpnm-save-msg pnpnm-save-msg--err';
				msg.textContent = res.success ? '✓ ' + ( i18n.saved || 'Saved' ) : '✗ ' + ( res.message || i18n.error || 'Error' );
			} ).catch( function () {
				msg.className   = 'pnpnm-save-msg pnpnm-save-msg--err';
				msg.textContent = '✗ ' + ( i18n.error || 'Error' );
			} ).finally( function () {
				saveBtn.disabled = false;
			} );
		} );
	}

	// -------------------------------------------------------------------------
	// Settings page — editor tab save
	// -------------------------------------------------------------------------

	function initEditorSettings() {
		const saveBtn = document.getElementById( 'pnpnm-save-editor' );
		if ( ! saveBtn ) return;

		saveBtn.addEventListener( 'click', function () {
			const msg     = document.getElementById( 'pnpnm-editor-save-msg' );
			const payload = {
				default_save_mode : document.getElementById( 'pnpnm-default-save-mode' ).value,
				default_format    : document.getElementById( 'pnpnm-default-format' ).value,
			};

			saveBtn.disabled = true;

			apiFetch( '/editor/settings', 'PUT', payload ).then( function ( res ) {
				msg.className   = res.success ? 'pnpnm-save-msg pnpnm-save-msg--ok' : 'pnpnm-save-msg pnpnm-save-msg--err';
				msg.textContent = res.success ? '✓ ' + ( i18n.saved || 'Saved' ) : '✗ ' + ( res.message || i18n.error || 'Error' );
			} ).catch( function () {
				msg.className   = 'pnpnm-save-msg pnpnm-save-msg--err';
				msg.textContent = '✗ ' + ( i18n.error || 'Error' );
			} ).finally( function () {
				saveBtn.disabled = false;
			} );
		} );
	}

	// -------------------------------------------------------------------------
	// Bulk optimizer
	// -------------------------------------------------------------------------

	var bulkStopped = false;
	var bulkTotal   = 0;
	var bulkDone    = 0;

	function initBulkOptimizer() {
		const startBtn = document.getElementById( 'pnpnm-bulk-start' );
		if ( ! startBtn ) return;

		loadStats();

		startBtn.addEventListener( 'click', startBulk );

		const stopBtn = document.getElementById( 'pnpnm-bulk-stop' );
		if ( stopBtn ) {
			stopBtn.addEventListener( 'click', function () {
				bulkStopped = true;
				hideEl( stopBtn );
				showEl( startBtn );
			} );
		}
	}

	function loadStats() {
		apiFetch( '/optimizer/stats', 'GET' ).then( function ( res ) {
			if ( ! res.success ) return;
			const s = res.stats;
			setText( 'pnpnm-stat-total',       s.total_images );
			setText( 'pnpnm-stat-optimized',   s.total_optimized );
			setText( 'pnpnm-stat-unoptimized', s.total_unoptimized );
			setText( 'pnpnm-stat-savings',      s.total_savings_percent + '%' );
			bulkTotal = s.total_unoptimized;

			const noImagesMsg = document.getElementById( 'pnpnm-no-images-msg' );
			const startBtn    = document.getElementById( 'pnpnm-bulk-start' );
			if ( s.total_images === 0 ) {
				if ( noImagesMsg ) {
					noImagesMsg.textContent = i18n.noImages || 'No images found in your media library.';
					showEl( noImagesMsg );
				}
				if ( startBtn ) startBtn.disabled = true;
			} else if ( s.total_unoptimized === 0 ) {
				if ( noImagesMsg ) showEl( noImagesMsg );
				if ( startBtn ) startBtn.disabled = true;
			} else {
				if ( noImagesMsg ) hideEl( noImagesMsg );
				if ( startBtn ) startBtn.disabled = false;
			}
		} );
	}

	function startBulk() {
		bulkStopped = false;
		bulkDone    = 0;

		const startBtn  = document.getElementById( 'pnpnm-bulk-start' );
		const stopBtn   = document.getElementById( 'pnpnm-bulk-stop' );
		const wrap      = document.getElementById( 'pnpnm-progress-wrap' );
		const resultDiv = document.getElementById( 'pnpnm-bulk-results' );
		const tbody     = document.getElementById( 'pnpnm-results-body' );

		hideEl( startBtn );
		showEl( stopBtn );
		showEl( wrap );
		showEl( resultDiv );
		if ( tbody ) tbody.innerHTML = '';

		updateProgress( 0, bulkTotal );
		runBatch( 0 );
	}

	function runBatch( offset ) {
		if ( bulkStopped ) return;

		apiFetch( '/optimizer/bulk', 'POST', { offset: offset } ).then( function ( res ) {
			if ( ! res.success ) { finishBulk(); return; }

			bulkTotal = Math.max( bulkTotal, ( res.total_unoptimized || 0 ) + bulkDone );

			( res.results || [] ).forEach( function ( r ) {
				bulkDone++;
				appendBulkRow( r );
			} );

			updateProgress( bulkDone, bulkTotal );

			if ( null != res.offset_next && ! bulkStopped ) {
				// Safety: if nothing was successfully processed this batch, stop to
				// avoid an infinite loop caused by items that permanently fail.
				if ( res.processed === 0 ) {
					finishBulk();
					return;
				}
				setTimeout( function () { runBatch( res.offset_next ); }, 300 );
			} else {
				finishBulk();
			}
		} ).catch( finishBulk );
	}

	function appendBulkRow( r ) {
		const tbody = document.getElementById( 'pnpnm-results-body' );
		if ( ! tbody ) return;

		const tr = document.createElement( 'tr' );

		if ( r.success === false ) {
			tr.innerHTML =
				'<td>#' + esc( r.attachment_id ) + '</td>' +
				'<td colspan="3" class="pnpnm-opt-error">' + esc( r.error || i18n.error || 'Error' ) + '</td>';
		} else if ( r.savings_percent > 0 ) {
			tr.innerHTML =
				'<td>#' + esc( r.attachment_id ) + '</td>' +
				'<td>' + formatBytes( r.original_size  || 0 ) + '</td>' +
				'<td>' + formatBytes( r.optimized_size || 0 ) + '</td>' +
				'<td>' + r.savings_percent + '%</td>';
		} else {
			tr.innerHTML =
				'<td>#' + esc( r.attachment_id ) + '</td>' +
				'<td colspan="3" class="pnpnm-opt-skipped">' + ( i18n.alreadyOptimal || 'Already optimal — no change' ) + '</td>';
		}

		tbody.appendChild( tr );
	}

	function updateProgress( done, total ) {
		const bar   = document.getElementById( 'pnpnm-progress-bar' );
		const label = document.getElementById( 'pnpnm-progress-label' );

		if ( bar )   bar.value        = total > 0 ? Math.round( ( done / total ) * 100 ) : 0;
		if ( label ) label.textContent = ( i18n.optimizing || 'Optimizing' ) + ' ' + done + ' / ' + total;
	}

	function finishBulk() {
		const startBtn = document.getElementById( 'pnpnm-bulk-start' );
		const stopBtn  = document.getElementById( 'pnpnm-bulk-stop' );
		const label    = document.getElementById( 'pnpnm-progress-label' );

		if ( startBtn ) startBtn.disabled = false;
		showEl( startBtn );
		hideEl( stopBtn );

		if ( label ) label.textContent = ( i18n.done || 'Done' );

		loadStats();
	}

	// -------------------------------------------------------------------------
	// Media list-view column
	// -------------------------------------------------------------------------

	function initMediaListView() {
		document.addEventListener( 'click', function ( e ) {
			const btn = e.target.closest( '.pnpnm-opt-optimize' );
			if ( btn ) { handleListOptimize( btn ); return; }

			const restore = e.target.closest( '.pnpnm-opt-restore' );
			if ( restore ) { handleListRestore( restore ); }
		} );
	}

	function handleListOptimize( btn ) {
		const id   = parseInt( btn.dataset.id, 10 );
		const cell = btn.closest( 'td' );
		if ( ! cell ) return;

		btn.disabled    = true;
		btn.textContent = i18n.optimizing || 'Optimizing…';

		apiFetch( '/optimizer/optimize', 'POST', { attachment_id: id } ).then( function ( res ) {
			if ( res.success ) {
				const pct  = res.savings_percent;
				const orig = formatBytes( res.original_size );
				const opt  = formatBytes( res.optimized_size );

				cell.innerHTML =
					'<span class="pnpnm-opt-badge pnpnm-opt-badge--done">✓ ' + pct + '% saved</span>' +
					'<br><small class="pnpnm-opt-sizes">' + orig + ' → ' + opt + '</small>' +
					'<br><button type="button" class="button button-small pnpnm-opt-restore" data-id="' + id + '">' +
					esc( i18n.restore || 'Restore Original' ) + '</button>';
			} else {
				btn.disabled    = false;
				btn.textContent = i18n.optimize || 'Optimize';
			}
		} ).catch( function () {
			btn.disabled    = false;
			btn.textContent = i18n.optimize || 'Optimize';
		} );
	}

	function handleListRestore( btn ) {
		const id   = parseInt( btn.dataset.id, 10 );
		btn.disabled    = true;
		btn.textContent = i18n.restoring || 'Restoring…';

		apiFetch( '/optimizer/restore', 'POST', { attachment_id: id } ).then( function ( res ) {
			if ( res.success ) {
				location.reload();
			} else {
				btn.disabled    = false;
				btn.textContent = i18n.restore || 'Restore Original';
			}
		} ).catch( function () {
			btn.disabled    = false;
			btn.textContent = i18n.restore || 'Restore Original';
		} );
	}

	// -------------------------------------------------------------------------
	// Media grid-view hover button
	// -------------------------------------------------------------------------

	function initMediaGridView() {
		if ( typeof wp === 'undefined' || ! wp.media ) return;

		wp.media.view.Attachment.prototype.on( 'rendered', function () {
			const el = this.$el && this.$el[ 0 ];
			if ( ! el ) return;

			const mime = this.model.get( 'mime' );
			if ( 'image/jpeg' !== mime && 'image/png' !== mime ) return;
			if ( el.querySelector( '.pnpnm-grid-optimize' ) ) return;

			const id  = this.model.id;
			const btn = document.createElement( 'button' );
			btn.type        = 'button';
			btn.className   = 'pnpnm-grid-optimize';
			btn.dataset.id  = id;
			btn.textContent = i18n.optimize || 'Optimize';

			btn.addEventListener( 'click', function ( e ) {
				e.stopPropagation();
				btn.disabled    = true;
				btn.textContent = i18n.optimizing || '…';

				apiFetch( '/optimizer/optimize', 'POST', { attachment_id: id } ).then( function ( res ) {
					if ( res.success ) {
						btn.className   = 'pnpnm-grid-optimize pnpnm-grid-optimize--done';
						btn.textContent = '✓ ' + res.savings_percent + '%';
					} else {
						btn.disabled    = false;
						btn.textContent = i18n.optimize || 'Optimize';
					}
				} ).catch( function () {
					btn.disabled    = false;
					btn.textContent = i18n.optimize || 'Optimize';
				} );
			} );

			el.appendChild( btn );
		} );
	}

	// -------------------------------------------------------------------------
	// Utilities
	// -------------------------------------------------------------------------

	function setText( id, val ) {
		const el = document.getElementById( id );
		if ( el ) el.textContent = val;
	}

	function esc( str ) {
		return String( str )
			.replace( /&/g, '&amp;' )
			.replace( /</g, '&lt;'  )
			.replace( />/g, '&gt;'  )
			.replace( /"/g, '&quot;' );
	}

	// -------------------------------------------------------------------------
	// Strip Metadata bulk UI
	// -------------------------------------------------------------------------

	var stripStopped = false;
	var stripDone    = 0;
	var stripTotal   = 0;

	function initStripMetadata() {
		const startBtn = document.getElementById( 'pnpnm-strip-start' );
		if ( ! startBtn ) return;

		startBtn.addEventListener( 'click', function () {
			if ( ! confirm( i18n.confirmStrip || 'This will permanently remove metadata from all images. A backup will be kept if you have that option enabled. Continue?' ) ) {
				return;
			}
			startStrip();
		} );

		const stopBtn = document.getElementById( 'pnpnm-strip-stop' );
		if ( stopBtn ) {
			stopBtn.addEventListener( 'click', function () {
				stripStopped = true;
				hideEl( stopBtn );
				showEl( startBtn );
			} );
		}
	}

	function startStrip() {
		stripStopped = false;
		stripDone    = 0;
		stripTotal   = 0;

		const startBtn  = document.getElementById( 'pnpnm-strip-start' );
		const stopBtn   = document.getElementById( 'pnpnm-strip-stop' );
		const wrap      = document.getElementById( 'pnpnm-strip-progress-wrap' );
		const resultDiv = document.getElementById( 'pnpnm-strip-results' );
		const tbody     = document.getElementById( 'pnpnm-strip-results-body' );

		hideEl( startBtn );
		showEl( stopBtn );
		showEl( wrap );
		showEl( resultDiv );
		if ( tbody ) tbody.innerHTML = '';

		runStripBatch( 0 );
	}

	function runStripBatch( offset ) {
		if ( stripStopped ) return;

		apiFetch( '/optimizer/bulk-strip', 'POST', { offset: offset } ).then( function ( res ) {
			if ( ! res.success ) { finishStrip(); return; }

			// Capture the total on the first batch so the progress bar has a denominator.
			if ( ! stripTotal && res.total_unstripped ) {
				stripTotal = stripDone + res.total_unstripped;
			}

			( res.results || [] ).forEach( function ( r ) {
				stripDone++;
				appendStripRow( r );
			} );

			updateStripProgress( stripDone, stripTotal );

			if ( null != res.offset_next && ! stripStopped ) {
				// Safety: stop if nothing was processed this batch to avoid infinite loop.
				if ( res.processed === 0 ) {
					finishStrip();
					return;
				}
				setTimeout( function () { runStripBatch( res.offset_next ); }, 300 );
			} else {
				finishStrip();
			}
		} ).catch( finishStrip );
	}

	function appendStripRow( r ) {
		const tbody = document.getElementById( 'pnpnm-strip-results-body' );
		if ( ! tbody ) return;

		const tr = document.createElement( 'tr' );

		if ( r.success === false ) {
			tr.innerHTML =
				'<td>#' + esc( r.attachment_id ) + '</td>' +
				'<td colspan="3" class="pnpnm-opt-error">' + esc( r.error || i18n.error || 'Error' ) + '</td>';
		} else {
			tr.innerHTML =
				'<td>#' + esc( r.attachment_id ) + '</td>' +
				'<td>' + formatBytes( r.size_before || 0 ) + '</td>' +
				'<td>' + formatBytes( r.size_after  || 0 ) + '</td>' +
				'<td>' + formatBytes( r.bytes_saved  || 0 ) + '</td>';
		}

		tbody.appendChild( tr );
	}

	function updateStripProgress( done, total ) {
		const label = document.getElementById( 'pnpnm-strip-progress-label' );
		const bar   = document.getElementById( 'pnpnm-strip-progress-bar' );
		if ( label ) label.textContent = ( i18n.stripping || 'Stripping metadata' ) + '… ' + done + ' ' + ( i18n.processed || 'processed' );
		if ( bar && total > 0 ) bar.value = Math.round( ( done / total ) * 100 );
	}

	function finishStrip() {
		const startBtn = document.getElementById( 'pnpnm-strip-start' );
		const stopBtn  = document.getElementById( 'pnpnm-strip-stop' );
		const label    = document.getElementById( 'pnpnm-strip-progress-label' );

		showEl( startBtn );
		hideEl( stopBtn );
		if ( label ) label.textContent = ( i18n.done || 'Done' );
	}

	// -------------------------------------------------------------------------
	// Boot
	// -------------------------------------------------------------------------

	document.addEventListener( 'DOMContentLoaded', function () {
		initOptimizerSettings();
		initEditorSettings();
		initBulkOptimizer();
		initStripMetadata();
		initMediaListView();
		initMediaGridView();
	} );

} )();
