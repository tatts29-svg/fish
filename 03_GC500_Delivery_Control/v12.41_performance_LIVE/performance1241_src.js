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
let demobDepth = 0, pageDepth = 0, pendingGeometry = null, photoRevision = 0;
function demobPass(read, finish) {
  const outer = demobDepth === 0; let value;
  demobDepth++;
  try { value = read(); } finally { demobDepth--; }
  if (outer) { if (pageDepth) pendingGeometry = finish; else finish(); }
  return value;
}
function pageDraw(read) {
  const outer = pageDepth === 0; let value, completed = false;
  if (outer) pendingGeometry = null;
  pageDepth++;
  try { value = read(); completed = true; }
  finally { pageDepth--; if (outer && !completed) pendingGeometry = null; }
  if (outer) {
    const finish = pendingGeometry; pendingGeometry = null;
    if (finish) finish();
  }
  return value;
}
function drawingDemob() { return demobDepth > 0; }
function invalidatePhotos() { photoRevision++; }
function photoRows(ref, read) {
  // A native photo put can precede save(), including inside a carried hold.
  // Its revision invalidates this derived projection immediately, without
  // changing source associations or relying on a later redraw.
  const cache = heldMemo('photo-projection1241', () => ({revision: photoRevision, refs: new Map()}));
  if (cache.revision !== photoRevision) { cache.revision = photoRevision; cache.refs.clear(); }
  const key = String(ref);
  if (!cache.refs.has(key)) cache.refs.set(key, read());
  return cache.refs.get(key).map(photo => Object.assign({}, photo));
}
function costRows(read) {
  const rows = heldMemo('cost-rows1241', read);
  return rows.map(row => Object.assign({}, row,
    Array.isArray(row.problems) ? {problems: row.problems.slice()} : null));
}
const api = {version: 'v12.41', firstIndex, paneActive, demobPass, pageDraw, drawingDemob, photoRows, invalidatePhotos, costRows};
root.Performance1241 = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
