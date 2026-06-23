;/**
 * editor.js
 * Full-screen canvas image editor modal.
 * Tools: Crop, Rotate/Flip, Resize, Adjustments, Filters.
 * Undo/Redo (max 20), Save As New, Replace Original, Download.
 *
 * Reads window.pnpnm for restUrl/nonce (localized by Enqueue.php).
 * Reads window.pnpnmEditor for i18n strings (localized by EditorAdmin).
 */
( function () {
	'use strict';

	const base  = ( window.pnpnm && window.pnpnm.restUrl ? window.pnpnm.restUrl : '' ).replace( /\/$/, '' );
	const nonce = window.pnpnm && window.pnpnm.nonce ? window.pnpnm.nonce : '';
	const i18n  = window.pnpnmEditor || {};

	// -------------------------------------------------------------------------
	// REST helper
	// -------------------------------------------------------------------------

	function apiFetch( path, method, body ) {
		const opts = {
			method      : method || 'GET',
			credentials : 'same-origin',
			headers     : { 'X-WP-Nonce': nonce },
		};
		if ( body && typeof body === 'object' ) {
			opts.headers[ 'Content-Type' ] = 'application/json';
			opts.body = JSON.stringify( body );
		}
		return fetch( base + path, opts ).then( function ( r ) { return r.json(); } );
	}

	// -------------------------------------------------------------------------
	// State
	// -------------------------------------------------------------------------

	var canvas, ctx;
	var history = [];
	var future  = [];
	var dirty   = false;
	var currentId = 0;

	var cropDrag = null;
	var cropRect = { x: 0, y: 0, w: 0, h: 0 };
	var adjBase  = null;
	var adj      = { brightness: 0, contrast: 0, saturation: 0, sharpness: 0 };

	// -------------------------------------------------------------------------
	// Build modal (once)
	// -------------------------------------------------------------------------

	function buildModal() {
		if ( document.getElementById( 'pnpnm-editor-modal' ) ) return;

		const modal = document.createElement( 'div' );
		modal.id        = 'pnpnm-editor-modal';
		modal.className = 'pnpnm-editor-modal';
		modal.innerHTML =
			'<div class="pnpnm-editor-inner">' +
			  '<div class="pnpnm-editor-toolbar">' +
			    '<button class="pnpnm-tb-btn" id="pnpnm-tb-undo">↩ ' + ( i18n.undo || 'Undo' ) + '</button>' +
			    '<button class="pnpnm-tb-btn" id="pnpnm-tb-redo">↪ ' + ( i18n.redo || 'Redo' ) + '</button>' +
			    '<span class="pnpnm-tb-sep"></span>' +
			    '<button class="pnpnm-tb-btn pnpnm-tb-btn--primary" id="pnpnm-tb-save-new">'  + ( i18n.saveAsNew || 'Save As New'     ) + '</button>' +
			    '<button class="pnpnm-tb-btn pnpnm-tb-btn--primary" id="pnpnm-tb-replace">'   + ( i18n.replace   || 'Replace Original' ) + '</button>' +
			    '<button class="pnpnm-tb-btn" id="pnpnm-tb-download">'                        + ( i18n.download  || 'Download'         ) + '</button>' +
			    '<button class="pnpnm-tb-btn pnpnm-tb-btn--close" id="pnpnm-tb-close">&#x2715;</button>' +
			    '<span class="pnpnm-tb-msg" id="pnpnm-tb-msg" aria-live="polite"></span>' +
			  '</div>' +
			  '<div class="pnpnm-editor-body">' +
			    '<div class="pnpnm-editor-sidebar">' +
			      '<button class="pnpnm-tool-btn pnpnm-tool-btn--active" data-tool="crop">'        + ( i18n.crop        || 'Crop'          ) + '</button>' +
			      '<button class="pnpnm-tool-btn" data-tool="rotate">'                             + ( i18n.rotate      || 'Rotate & Flip' ) + '</button>' +
			      '<button class="pnpnm-tool-btn" data-tool="resize">'                             + ( i18n.resize      || 'Resize'        ) + '</button>' +
			      '<button class="pnpnm-tool-btn" data-tool="adjustments">'                        + ( i18n.adjustments || 'Adjustments'   ) + '</button>' +
			      '<button class="pnpnm-tool-btn" data-tool="filters">'                            + ( i18n.filters     || 'Filters'       ) + '</button>' +
			    '</div>' +
			    '<div class="pnpnm-editor-canvas-wrap" id="pnpnm-canvas-wrap">' +
			      '<canvas id="pnpnm-canvas"></canvas>' +
			      '<svg id="pnpnm-crop-svg" style="display:none;position:absolute;top:0;left:0;pointer-events:none;"></svg>' +
			    '</div>' +
			    '<div class="pnpnm-editor-panel" id="pnpnm-editor-panel"></div>' +
			  '</div>' +
			'</div>';

		document.body.appendChild( modal );
		canvas = document.getElementById( 'pnpnm-canvas' );
		ctx    = canvas.getContext( '2d' );
		bindToolbar();
		bindSidebar();
		// Do NOT call activateTool here — the modal is still display:none so
		// getBoundingClientRect() returns zeros. activateTool is called after
		// the modal is shown and the canvas is sized (inside openEditor).
	}

	// -------------------------------------------------------------------------
	// Open
	// -------------------------------------------------------------------------

	function openEditor( attachmentId ) {
		buildModal();
		currentId = attachmentId;
		history   = [];
		future    = [];
		dirty     = false;
		adj       = { brightness: 0, contrast: 0, saturation: 0, sharpness: 0 };
		adjBase   = null;
		setMsg( i18n.loading || 'Loading…' );

		apiFetch( '/editor/attachment/' + attachmentId ).then( function ( res ) {
			if ( ! res.success ) { setMsg( '✗ ' + ( res.message || i18n.error ) ); return; }
			const img = new Image();
			img.crossOrigin = 'Anonymous';
			img.onload = function () {
				canvas.width  = img.naturalWidth;
				canvas.height = img.naturalHeight;
				ctx.drawImage( img, 0, 0 );
				pushHistory();
				setMsg( '' );

				// Show the modal first so the DOM has real dimensions.
				document.getElementById( 'pnpnm-editor-modal' ).style.display = 'flex';
				scaleCanvas();

				// Activate crop tool AFTER the modal is visible and the canvas
				// has its final CSS size, so syncSvgToCanvas reads correct coords.
				requestAnimationFrame( function () {
					activateTool( 'crop' );
					// Reset sidebar highlight to match.
					var sidebarBtns = document.querySelectorAll( '.pnpnm-tool-btn' );
					sidebarBtns.forEach( function ( b ) { b.classList.remove( 'pnpnm-tool-btn--active' ); } );
					var cropBtn = document.querySelector( '.pnpnm-tool-btn[data-tool="crop"]' );
					if ( cropBtn ) cropBtn.classList.add( 'pnpnm-tool-btn--active' );
				} );
			};
			img.onerror = function () { setMsg( '✗ ' + ( i18n.loadError || 'Could not load image.' ) ); };
			img.src = res.url;
		} ).catch( function () { setMsg( '✗ ' + ( i18n.networkError || 'Network error.' ) ); } );
	}

	function scaleCanvas() {
		const wrap = document.getElementById( 'pnpnm-canvas-wrap' );
		if ( ! wrap ) return;
		const scale = Math.min( 1, ( wrap.clientWidth - 24 ) / canvas.width, ( wrap.clientHeight - 24 ) / canvas.height );
		canvas.style.width  = Math.round( canvas.width  * scale ) + 'px';
		canvas.style.height = Math.round( canvas.height * scale ) + 'px';
	}

	// -------------------------------------------------------------------------
	// Toolbar
	// -------------------------------------------------------------------------

	function bindToolbar() {
		document.getElementById( 'pnpnm-tb-close'    ).addEventListener( 'click', closeModal );
		document.getElementById( 'pnpnm-tb-undo'     ).addEventListener( 'click', undo );
		document.getElementById( 'pnpnm-tb-redo'     ).addEventListener( 'click', redo );
		document.getElementById( 'pnpnm-tb-save-new' ).addEventListener( 'click', saveAsNew );
		document.getElementById( 'pnpnm-tb-replace'  ).addEventListener( 'click', replaceOriginal );
		document.getElementById( 'pnpnm-tb-download' ).addEventListener( 'click', download );

		document.addEventListener( 'keydown', function ( e ) {
			const modal = document.getElementById( 'pnpnm-editor-modal' );
			if ( ! modal || 'none' === modal.style.display ) return;
			if ( 'Escape' === e.key ) { closeModal(); }
			else if ( ( e.ctrlKey || e.metaKey ) && ! e.shiftKey && 'z' === e.key ) { e.preventDefault(); undo(); }
			else if ( ( e.ctrlKey || e.metaKey ) && ( 'y' === e.key || ( e.shiftKey && 'z' === e.key ) ) ) { e.preventDefault(); redo(); }
		} );
	}

	function closeModal() {
		if ( dirty && ! confirm( i18n.confirmClose || 'Unsaved changes will be lost. Close anyway?' ) ) return;
		document.getElementById( 'pnpnm-editor-modal' ).style.display = 'none';
		dirty = false;
	}

	// -------------------------------------------------------------------------
	// Sidebar
	// -------------------------------------------------------------------------

	function bindSidebar() {
		const sb = document.querySelector( '.pnpnm-editor-sidebar' );
		if ( ! sb ) return;
		sb.addEventListener( 'click', function ( e ) {
			const btn = e.target.closest( '[data-tool]' );
			if ( ! btn ) return;
			sb.querySelectorAll( '.pnpnm-tool-btn' ).forEach( function ( b ) { b.classList.remove( 'pnpnm-tool-btn--active' ); } );
			btn.classList.add( 'pnpnm-tool-btn--active' );
			activateTool( btn.dataset.tool );
		} );
	}

	function activateTool( tool ) {
		stopCrop();
		const panel = document.getElementById( 'pnpnm-editor-panel' );
		panel.innerHTML = '';
		switch ( tool ) {
			case 'crop':        renderCropPanel( panel );    break;
			case 'rotate':      renderRotatePanel( panel );  break;
			case 'resize':      renderResizePanel( panel );  break;
			case 'adjustments': renderAdjPanel( panel );     break;
			case 'filters':     renderFiltersPanel( panel ); break;
		}
	}

	// -------------------------------------------------------------------------
	// Crop
	// -------------------------------------------------------------------------

	function renderCropPanel( panel ) {
		panel.innerHTML =
			'<h3 class="pnpnm-panel-title">' + ( i18n.crop || 'Crop' ) + '</h3>' +
			'<p class="pnpnm-panel-hint">' + ( i18n.cropHint || 'Drag to select an area.' ) + '</p>' +
			'<div class="pnpnm-dim-display" id="pnpnm-crop-dims">W: — \xd7 H: —</div>' +
			'<button class="button button-primary pnpnm-panel-btn" id="pnpnm-apply-crop">' + ( i18n.applyCrop || 'Apply Crop' ) + '</button>';
		document.getElementById( 'pnpnm-apply-crop' ).addEventListener( 'click', applyCrop );
		startCrop();
	}

	function startCrop() {
		syncSvgToCanvas();
		canvas.style.cursor = 'crosshair';
		canvas.addEventListener( 'mousedown', onCropDown );
	}

	function stopCrop() {
		canvas.style.cursor = '';
		canvas.removeEventListener( 'mousedown', onCropDown );
		document.removeEventListener( 'mousemove', onCropMove );
		document.removeEventListener( 'mouseup',   onCropUp );
		const svg = document.getElementById( 'pnpnm-crop-svg' );
		if ( svg ) { svg.style.display = 'none'; svg.innerHTML = ''; }
	}

	/**
	 * Write the SVG's position/size to match the canvas exactly.
	 * Pure geometry — does NOT change display visibility.
	 * Safe to call whenever the canvas CSS size changes.
	 */
	function positionSvgOverCanvas() {
		var svg  = document.getElementById( 'pnpnm-crop-svg' );
		var wrap = document.getElementById( 'pnpnm-canvas-wrap' );
		if ( ! svg || ! wrap ) return;

		var cr = canvas.getBoundingClientRect();
		var wr = wrap.getBoundingClientRect();

		if ( cr.width === 0 || cr.height === 0 ) {
			// Layout not flushed yet — defer one frame.
			requestAnimationFrame( positionSvgOverCanvas );
			return;
		}

		svg.style.position = 'absolute';
		svg.style.left     = ( cr.left - wr.left ) + 'px';
		svg.style.top      = ( cr.top  - wr.top  ) + 'px';
		svg.style.width    = cr.width  + 'px';
		svg.style.height   = cr.height + 'px';
		svg.setAttribute( 'width',  cr.width );
		svg.setAttribute( 'height', cr.height );
	}

	/**
	 * Position the SVG overlay over the canvas AND make it visible.
	 * Only call when the modal is displayed (display:flex).
	 */
	function syncSvgToCanvas() {
		var svg = document.getElementById( 'pnpnm-crop-svg' );
		if ( ! svg ) return;

		var cr = canvas.getBoundingClientRect();
		if ( cr.width === 0 || cr.height === 0 ) {
			requestAnimationFrame( syncSvgToCanvas );
			return;
		}

		positionSvgOverCanvas();
		svg.style.display = '';
	}

	function onCropDown( e ) {
		// Capture canvas rect at drag start for consistent coordinate origin.
		const r  = canvas.getBoundingClientRect();
		const sx = canvas.width  / r.width;
		const sy = canvas.height / r.height;
		const ox = ( e.clientX - r.left ) * sx;
		const oy = ( e.clientY - r.top  ) * sy;

		cropDrag = { r: r, sx: sx, sy: sy, ox: ox, oy: oy };
		cropRect = { x: ox, y: oy, w: 0, h: 0 };

		document.addEventListener( 'mousemove', onCropMove );
		document.addEventListener( 'mouseup',   onCropUp );
	}

	function onCropMove( e ) {
		if ( ! cropDrag ) return;
		// Use the same rect captured at mousedown so coordinates stay consistent.
		cropRect.w = ( e.clientX - cropDrag.r.left ) * cropDrag.sx - cropDrag.ox;
		cropRect.h = ( e.clientY - cropDrag.r.top  ) * cropDrag.sy - cropDrag.oy;
		drawCropSvg();
		const disp = document.getElementById( 'pnpnm-crop-dims' );
		if ( disp ) {
			disp.textContent = 'W: ' + Math.round( Math.abs( cropRect.w ) ) + ' \xd7 H: ' + Math.round( Math.abs( cropRect.h ) );
		}
	}

	function onCropUp() {
		cropDrag = null;
		document.removeEventListener( 'mousemove', onCropMove );
		document.removeEventListener( 'mouseup',   onCropUp );
	}

	/**
	 * Redraw the SVG crop overlay.
	 * The SVG is now sized and positioned to match the canvas exactly
	 * (see syncSvgToCanvas), so all coordinates here are in CSS-display
	 * pixels relative to the canvas top-left — no additional offset needed.
	 */
	function drawCropSvg() {
		const svg = document.getElementById( 'pnpnm-crop-svg' );
		if ( ! svg ) return;

		const cr  = canvas.getBoundingClientRect();
		const scX = cr.width  / canvas.width;
		const scY = cr.height / canvas.height;

		const rx = ( cropRect.w >= 0 ? cropRect.x : cropRect.x + cropRect.w ) * scX;
		const ry = ( cropRect.h >= 0 ? cropRect.y : cropRect.y + cropRect.h ) * scY;
		const rw = Math.abs( cropRect.w ) * scX;
		const rh = Math.abs( cropRect.h ) * scY;
		const W  = cr.width;
		const H  = cr.height;

		svg.setAttribute( 'width', W );
		svg.setAttribute( 'height', H );
		svg.innerHTML =
			'<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="rgba(0,0,0,0.4)"/>' +
			'<rect x="' + rx + '" y="' + ry + '" width="' + rw + '" height="' + rh +
			'" fill="transparent" stroke="#fff" stroke-width="2" stroke-dasharray="4 2"/>';
	}

	function applyCrop() {
		const x = Math.round( cropRect.w >= 0 ? cropRect.x : cropRect.x + cropRect.w );
		const y = Math.round( cropRect.h >= 0 ? cropRect.y : cropRect.y + cropRect.h );
		const w = Math.round( Math.abs( cropRect.w ) ), h = Math.round( Math.abs( cropRect.h ) );
		if ( w < 1 || h < 1 ) return;
		pushHistory();
		const data = ctx.getImageData( x, y, w, h );
		canvas.width = w; canvas.height = h;
		ctx.putImageData( data, 0, 0 );
		stopCrop(); scaleCanvas(); startCrop(); markDirty();
	}

	// -------------------------------------------------------------------------
	// Rotate & Flip
	// -------------------------------------------------------------------------

	function renderRotatePanel( panel ) {
		panel.innerHTML =
			'<h3 class="pnpnm-panel-title">' + ( i18n.rotate || 'Rotate &amp; Flip' ) + '</h3>' +
			'<div class="pnpnm-btn-group">' +
			  '<button class="button pnpnm-panel-btn" data-action="rl">↺ ' + ( i18n.rotateLeft  || 'Rotate Left 90\xb0'  ) + '</button>' +
			  '<button class="button pnpnm-panel-btn" data-action="rr">↻ ' + ( i18n.rotateRight || 'Rotate Right 90\xb0' ) + '</button>' +
			  '<button class="button pnpnm-panel-btn" data-action="fh">⇄ ' + ( i18n.flipH       || 'Flip Horizontal'      ) + '</button>' +
			  '<button class="button pnpnm-panel-btn" data-action="fv">⇅ ' + ( i18n.flipV       || 'Flip Vertical'        ) + '</button>' +
			'</div>';
		panel.addEventListener( 'click', function ( e ) {
			const btn = e.target.closest( '[data-action]' );
			if ( ! btn ) return;
			if ( 'rl' === btn.dataset.action ) rotateCanvas( -90 );
			else if ( 'rr' === btn.dataset.action ) rotateCanvas( 90 );
			else if ( 'fh' === btn.dataset.action ) flipCanvas( true, false );
			else if ( 'fv' === btn.dataset.action ) flipCanvas( false, true );
		} );
	}

	function rotateCanvas( deg ) {
		pushHistory();
		const rad = deg * Math.PI / 180, w = canvas.width, h = canvas.height;
		const nw = Math.round( Math.abs( w * Math.cos( rad ) ) + Math.abs( h * Math.sin( rad ) ) );
		const nh = Math.round( Math.abs( w * Math.sin( rad ) ) + Math.abs( h * Math.cos( rad ) ) );
		const tmp = cloneCanvas();
		canvas.width = nw; canvas.height = nh;
		ctx.translate( nw / 2, nh / 2 ); ctx.rotate( rad ); ctx.drawImage( tmp, -w / 2, -h / 2 );
		ctx.setTransform( 1, 0, 0, 1, 0, 0 );
		scaleCanvas(); markDirty();
	}

	function flipCanvas( h, v ) {
		pushHistory();
		const tmp = cloneCanvas();
		ctx.clearRect( 0, 0, canvas.width, canvas.height );
		ctx.save();
		ctx.translate( h ? canvas.width : 0, v ? canvas.height : 0 );
		ctx.scale( h ? -1 : 1, v ? -1 : 1 );
		ctx.drawImage( tmp, 0, 0 );
		ctx.restore();
		markDirty();
	}

	// -------------------------------------------------------------------------
	// Resize
	// -------------------------------------------------------------------------

	function renderResizePanel( panel ) {
		const w = canvas.width, h = canvas.height, ratio = w / h;
		panel.innerHTML =
			'<h3 class="pnpnm-panel-title">' + ( i18n.resize || 'Resize' ) + '</h3>' +
			'<label class="pnpnm-field-label">' + ( i18n.width || 'Width (px)' ) + '<input type="number" id="pnpnm-rw" value="' + w + '" min="1" class="small-text"></label>' +
			'<label class="pnpnm-field-label">' + ( i18n.height || 'Height (px)' ) + '<input type="number" id="pnpnm-rh" value="' + h + '" min="1" class="small-text"></label>' +
			'<label class="pnpnm-field-label"><input type="checkbox" id="pnpnm-rlock" checked> ' + ( i18n.lockRatio || 'Lock aspect ratio' ) + '</label>' +
			'<button class="button button-primary pnpnm-panel-btn" id="pnpnm-apply-resize">' + ( i18n.applyResize || 'Apply Resize' ) + '</button>';

		const wIn = document.getElementById( 'pnpnm-rw' ), hIn = document.getElementById( 'pnpnm-rh' ), lock = document.getElementById( 'pnpnm-rlock' );
		wIn.addEventListener( 'input', function () { if ( lock.checked ) hIn.value = Math.round( parseInt( wIn.value, 10 ) / ratio ); } );
		hIn.addEventListener( 'input', function () { if ( lock.checked ) wIn.value = Math.round( parseInt( hIn.value, 10 ) * ratio ); } );
		document.getElementById( 'pnpnm-apply-resize' ).addEventListener( 'click', function () {
			const nw = parseInt( wIn.value, 10 ), nh = parseInt( hIn.value, 10 );
			if ( nw < 1 || nh < 1 ) return;
			pushHistory();
			const tmp = cloneCanvas();
			canvas.width = nw; canvas.height = nh;
			ctx.drawImage( tmp, 0, 0, nw, nh );
			scaleCanvas(); markDirty();
		} );
	}

	// -------------------------------------------------------------------------
	// Adjustments
	// -------------------------------------------------------------------------

	function renderAdjPanel( panel ) {
		panel.innerHTML =
			'<h3 class="pnpnm-panel-title">' + ( i18n.adjustments || 'Adjustments' ) + '</h3>' +
			mkSlider( 'brightness', i18n.brightness || 'Brightness', -100, 100, 0 ) +
			mkSlider( 'contrast',   i18n.contrast   || 'Contrast',   -100, 100, 0 ) +
			mkSlider( 'saturation', i18n.saturation || 'Saturation', -100, 100, 0 ) +
			mkSlider( 'sharpness',  i18n.sharpness  || 'Sharpness',     0,  10, 0 );

		adjBase = ctx.getImageData( 0, 0, canvas.width, canvas.height );

		[ 'brightness', 'contrast', 'saturation', 'sharpness' ].forEach( function ( k ) {
			const inp  = document.getElementById( 'pnpnm-adj-' + k );
			const disp = document.getElementById( 'pnpnm-adj-' + k + '-v' );
			inp.addEventListener( 'input', function () {
				adj[ k ] = parseFloat( inp.value ); disp.textContent = adj[ k ];
				applyAdj();
			} );
		} );
	}

	function mkSlider( n, label, min, max, val ) {
		return '<label class="pnpnm-slider-label">' + label + ' <span id="pnpnm-adj-' + n + '-v">' + val + '</span></label>' +
		       '<input type="range" id="pnpnm-adj-' + n + '" class="pnpnm-slider" min="' + min + '" max="' + max + '" value="' + val + '">';
	}

	function applyAdj() {
		if ( ! adjBase ) return;
		const src = new ImageData( new Uint8ClampedArray( adjBase.data ), adjBase.width, adjBase.height );
		applyBC( src, adj.brightness, adj.contrast );
		applySat( src, adj.saturation );
		ctx.putImageData( src, 0, 0 );
		if ( adj.sharpness > 0 ) applySharpen( adj.sharpness );
		markDirty();
	}

	function applyBC( imgData, b, c ) {
		const d = imgData.data, bright = b * 2.55, f = ( 259 * ( c + 255 ) ) / ( 255 * ( 259 - c ) );
		for ( var i = 0; i < d.length; i += 4 ) {
			d[i]   = clamp( f * ( d[i]   - 128 ) + 128 + bright );
			d[i+1] = clamp( f * ( d[i+1] - 128 ) + 128 + bright );
			d[i+2] = clamp( f * ( d[i+2] - 128 ) + 128 + bright );
		}
	}

	function applySat( imgData, sat ) {
		const d = imgData.data, a = sat / 100;
		for ( var i = 0; i < d.length; i += 4 ) {
			const avg = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
			d[i]   = clamp( avg + ( d[i]   - avg ) * ( 1 + a ) );
			d[i+1] = clamp( avg + ( d[i+1] - avg ) * ( 1 + a ) );
			d[i+2] = clamp( avg + ( d[i+2] - avg ) * ( 1 + a ) );
		}
	}

	function applySharpen( strength ) {
		const data = ctx.getImageData( 0, 0, canvas.width, canvas.height );
		const src  = new Uint8ClampedArray( data.data ), d = data.data;
		const w = data.width, h = data.height, amt = strength / 10;
		const k = [ 0, -amt, 0, -amt, 1 + 4 * amt, -amt, 0, -amt, 0 ];
		for ( var y = 1; y < h - 1; y++ ) {
			for ( var x = 1; x < w - 1; x++ ) {
				var idx = ( y * w + x ) * 4;
				for ( var c = 0; c < 3; c++ ) {
					var val = 0;
					for ( var ky = -1; ky <= 1; ky++ ) for ( var kx = -1; kx <= 1; kx++ )
						val += src[ ( ( y + ky ) * w + ( x + kx ) ) * 4 + c ] * k[ ( ky + 1 ) * 3 + ( kx + 1 ) ];
					d[ idx + c ] = clamp( val );
				}
			}
		}
		ctx.putImageData( data, 0, 0 );
	}

	// -------------------------------------------------------------------------
	// Filters
	// -------------------------------------------------------------------------

	function renderFiltersPanel( panel ) {
		const list = [
			[ 'none',      i18n.filterNone      || 'None'      ],
			[ 'grayscale', i18n.filterGrayscale || 'Grayscale' ],
			[ 'sepia',     i18n.filterSepia     || 'Sepia'     ],
			[ 'invert',    i18n.filterInvert    || 'Invert'    ],
			[ 'blur',      i18n.filterBlur      || 'Blur'      ],
		];
		panel.innerHTML = '<h3 class="pnpnm-panel-title">' + ( i18n.filters || 'Filters' ) + '</h3><div class="pnpnm-filter-btns">' +
			list.map( function ( f ) {
				return '<button class="button pnpnm-filter-btn' + ( 'none' === f[0] ? ' pnpnm-filter-btn--active' : '' ) + '" data-filter="' + f[0] + '">' + f[1] + '</button>';
			} ).join( '' ) + '</div>';

		panel.addEventListener( 'click', function ( e ) {
			const btn = e.target.closest( '[data-filter]' );
			if ( ! btn ) return;
			panel.querySelectorAll( '[data-filter]' ).forEach( function ( b ) { b.classList.remove( 'pnpnm-filter-btn--active' ); } );
			btn.classList.add( 'pnpnm-filter-btn--active' );
			applyFilter( btn.dataset.filter );
		} );
	}

	function applyFilter( filter ) {
		if ( 'none' === filter ) return;
		pushHistory();
		if ( 'blur' === filter ) { boxBlur(); markDirty(); return; }
		const imgData = ctx.getImageData( 0, 0, canvas.width, canvas.height ), d = imgData.data;
		for ( var i = 0; i < d.length; i += 4 ) {
			const r = d[i], g = d[i+1], b = d[i+2];
			if      ( 'grayscale' === filter ) { d[i] = d[i+1] = d[i+2] = 0.299*r + 0.587*g + 0.114*b; }
			else if ( 'sepia'     === filter ) { d[i]=clamp(r*.393+g*.769+b*.189); d[i+1]=clamp(r*.349+g*.686+b*.168); d[i+2]=clamp(r*.272+g*.534+b*.131); }
			else if ( 'invert'    === filter ) { d[i]=255-r; d[i+1]=255-g; d[i+2]=255-b; }
		}
		ctx.putImageData( imgData, 0, 0 ); markDirty();
	}

	function boxBlur() {
		const data = ctx.getImageData( 0, 0, canvas.width, canvas.height );
		const src = new Uint8ClampedArray( data.data ), d = data.data, w = data.width, h = data.height;
		for ( var y = 1; y < h-1; y++ ) for ( var x = 1; x < w-1; x++ ) {
			var idx = ( y*w+x )*4;
			for ( var c = 0; c < 3; c++ ) {
				var sum = 0;
				for ( var ky = -1; ky <= 1; ky++ ) for ( var kx = -1; kx <= 1; kx++ )
					sum += src[ ( (y+ky)*w+(x+kx) )*4+c ];
				d[ idx+c ] = sum / 9;
			}
		}
		ctx.putImageData( data, 0, 0 );
	}

	// -------------------------------------------------------------------------
	// Undo / Redo
	// -------------------------------------------------------------------------

	function pushHistory() {
		if ( history.length >= 20 ) history.shift();
		history.push( ctx.getImageData( 0, 0, canvas.width, canvas.height ) );
		future = [];
	}

	function undo() {
		if ( history.length < 2 ) return;
		future.push( history.pop() );
		restoreSnap( history[ history.length - 1 ] );
	}

	function redo() {
		if ( ! future.length ) return;
		var snap = future.pop(); history.push( snap ); restoreSnap( snap );
	}

	function restoreSnap( snap ) {
		canvas.width  = snap.width;
		canvas.height = snap.height;
		ctx.putImageData( snap, 0, 0 );
		scaleCanvas();

		// If the crop tool is currently active, the SVG overlay must be
		// repositioned to match the canvas's new CSS size and position.
		// We also clear the stale selection so the next drag starts fresh.
		var svg = document.getElementById( 'pnpnm-crop-svg' );
		if ( svg && 'none' !== svg.style.display ) {
			requestAnimationFrame( function () {
				positionSvgOverCanvas();
				cropRect = { x: 0, y: 0, w: 0, h: 0 };
				svg.innerHTML = '';
				var disp = document.getElementById( 'pnpnm-crop-dims' );
				if ( disp ) disp.textContent = 'W: — \xd7 H: —';
			} );
		}
	}

	// -------------------------------------------------------------------------
	// Save / Replace / Download
	// -------------------------------------------------------------------------

	function saveAsNew() {
		const b64 = canvas.toDataURL( 'image/jpeg', 0.92 ).split( ',' )[ 1 ];
		setMsg( i18n.saving || 'Saving…' );
		apiFetch( '/editor/save-new', 'POST', { attachment_id: currentId, image_data: b64, format: 'jpeg', filename: 'edited-' + currentId } )
			.then( function ( res ) {
				if ( res.success ) {
					dirty = false;
					const a = document.createElement( 'a' );
					a.href = res.url; a.target = '_blank'; a.textContent = i18n.viewAttach || 'View attachment';
					const msg = document.getElementById( 'pnpnm-tb-msg' );
					msg.innerHTML = '';
					msg.appendChild( document.createTextNode( '✓ Saved. ' ) );
					msg.appendChild( a );
				} else { setMsg( '✗ ' + ( res.message || i18n.error ) ); }
			} ).catch( function () { setMsg( '✗ ' + ( i18n.networkError || 'Network error' ) ); } );
	}

	function replaceOriginal() {
		if ( ! confirm( i18n.confirmReplace || 'Replace the original image with your edits?' ) ) return;
		const b64 = canvas.toDataURL( 'image/jpeg', 0.92 ).split( ',' )[ 1 ];
		setMsg( i18n.saving || 'Saving…' );
		apiFetch( '/editor/replace', 'POST', { attachment_id: currentId, image_data: b64, format: 'jpeg' } )
			.then( function ( res ) {
				if ( res.success ) { dirty = false; setMsg( '✓ ' + ( i18n.replaced || 'Replaced.' ) ); }
				else { setMsg( '✗ ' + ( res.message || i18n.error ) ); }
			} ).catch( function () { setMsg( '✗ ' + ( i18n.networkError || 'Network error' ) ); } );
	}

	function download() {
		const a = document.createElement( 'a' );
		a.href = canvas.toDataURL( 'image/jpeg', 0.92 );
		a.download = 'edited-' + currentId + '.jpg';
		a.click();
	}

	// -------------------------------------------------------------------------
	// Helpers
	// -------------------------------------------------------------------------

	function cloneCanvas() {
		const t = document.createElement( 'canvas' );
		t.width = canvas.width; t.height = canvas.height;
		t.getContext( '2d' ).drawImage( canvas, 0, 0 );
		return t;
	}
	function clamp( v ) { return v < 0 ? 0 : v > 255 ? 255 : v; }
	function markDirty() { dirty = true; }
	function setMsg( t ) { const el = document.getElementById( 'pnpnm-tb-msg' ); if ( el ) el.textContent = t; }

	// -------------------------------------------------------------------------
	// Attachment edit screen trigger
	// -------------------------------------------------------------------------

	document.addEventListener( 'DOMContentLoaded', function () {
		document.addEventListener( 'click', function ( e ) {
			const btn = e.target.closest( '.pnpnm-editor-open-btn' );
			if ( btn ) openEditor( parseInt( btn.dataset.id, 10 ) );
		} );

		// Auto-open when redirected from the media library details panel.
		const params  = new URLSearchParams( window.location.search );
		const autoId  = parseInt( params.get( 'open_pnpnm_editor' ), 10 );
		if ( autoId ) {
			openEditor( autoId );
		}
	} );

} )();
