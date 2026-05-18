;/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!************************************!*\
  !*** ./source/assets/js/common.js ***!
  \************************************/
__webpack_require__.r(__webpack_exports__);
/* global pnpnm, wp */
(function () {
  'use strict';

  var banner = document.getElementById('pnpnm-review-banner');
  if (!banner) {
    return;
  }
  banner.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-pnpnm-action]');
    if (!trigger) {
      return;
    }
    var action = trigger.getAttribute('data-pnpnm-action');
    if (trigger.tagName === 'A' && trigger.getAttribute('href') === '#') {
      e.preventDefault();
    }
    banner.style.display = 'none';
    wp.ajax.post('pnpnm_review_' + action, {
      review_nonce: pnpnm.reviewBannerNonce
    }).fail(function () {
      banner.style.display = '';
    });
  });
})();
/******/ })()
;
//# sourceMappingURL=common.js.map