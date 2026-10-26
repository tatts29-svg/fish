/* Author: Andrew Fisher. Reuse reads within one synchronous drawing only. */
(function (root) {
'use strict';
function firstIndex(rows) {
  const byId = new Map();
  for (const row of rows) if (row && !byId.has(row.id)) byId.set(row.id, row);
  return byId;
}
function paneActive(pane, tab) {
  return !!pane && !pane.hidden && pane.id === 'pane-' + tab && pane.classList.contains('on');
}
const api = {version: 'v12.41', firstIndex, paneActive};
root.Performance1241 = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
