/* Author: Andrew Fisher. Private composition adapter; owner sources remain unchanged. */
(function () {
  'use strict';
  if (window.gc500Demob826Adapter) throw new Error('Demob checklist adapter already installed');
  if (typeof demobCheck826 !== 'function' || typeof printDay816Before826 !== 'function') {
    throw new Error('Demob checklist adapter requires the selected-load print checks');
  }
  function decorate() {
    const pane = document.querySelector('#pane-demob');
    if (!pane) return;
    const action = pane.querySelector('.dmbar816 [data-print816="day"]');
    // Keep requirements available if this render has no native run-sheet action.
    if (!action) return;
    pane.querySelector('[data-refresh-fold="demob-before-pickup"]')?.remove();
    if (!pane.querySelector('[data-demob826-hint]')) {
      const hint = document.createElement('p');
      hint.dataset.demob826Hint = '1';
      hint.textContent = 'Review the selected loads before printing.';
      hint.style.cssText = 'flex-basis:100%;margin:4px 0;font-size:12px;color:#58636a';
      action.closest('.dmbar816').append(hint);
    }
  }
  const before = renderDemob816;
  renderDemob816 = function () { const value = before.apply(this, arguments); decorate(); return value; };
  Object.assign(renderDemob816, before);
  window.gc500Demob826Adapter = true;
  decorate();
})();
