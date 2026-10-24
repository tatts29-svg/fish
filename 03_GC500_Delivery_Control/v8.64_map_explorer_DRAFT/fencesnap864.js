/* v8.64 - Author: Andrew Fisher. THE MAP'S FENCING LAYER WITHOUT THE FOUR-SECOND FREEZE.
   While Fencing is open on the Map explorer, the map asks this page for the fencing snapshot every 4 s. Building it checked
   each recorded photo against the Documents file list, and dropFileIndex() rebuilt that whole list (363 files) for every
   photo - about 200 rebuilds and 120 ms of frozen page on every ask. The list cannot change while one snapshot is being
   built, so it is now built once per snapshot and reused inside it. Outside a snapshot nothing changes; every snapshot is
   still built fresh from the current record. */
(function () {
  if (typeof window.gc500FencingMapSnapshot !== 'function' || typeof dropFileIndex !== 'function') return;
  const index0 = dropFileIndex, snapshot0 = window.gc500FencingMapSnapshot;
  let building = 0, memo = null;
  dropFileIndex = function () {
    if (!building) return index0.apply(this, arguments);
    const files = (typeof DOCS !== 'undefined' && DOCS && DOCS.files) || null;
    if (memo && memo.files === files) return memo.index;
    const index = index0.apply(this, arguments); memo = {files, index}; return index;
  };
  window.gc500FencingMapSnapshot = function () {
    building++; if (building === 1) memo = null;
    try { return snapshot0.apply(this, arguments); } finally { building--; if (!building) memo = null; }
  };
  window.gc500FenceSnap864 = true;
})();
