/* Author: Andrew Fisher. Reuse the finder index only while its inputs are current.
   Save/remote record epochs, document-registry changes, date/event and view context
   invalidate it. Search text itself does not change the searchable records.
   Matching/ranking, links and the existing asset hold remain unchanged. */
(function (W) {
 'use strict';
 const prior = W.finderIndex;
 if (typeof prior !== 'function' || W.Loading1200) return;
 let cached = null;
 const same = (a, b) => a.length === b.length && a.every((value, i) => value === b[i]);
 function context() {
  W.EventConfig1013?.current();
  const view = {...state}; delete view.q;
  return [S, REC_EPOCH1066, todayIso(), DATA,
   DOCS.files, DOCS.at, DOCS.state, JSON.stringify(view)];
 }
 W.finderIndex = function () {
  const key = context();
  if (cached && same(cached.key, key)) return cached.value;
  const value = prior.apply(this, arguments);
  // A native read can reconcile event settings; retain only the final context.
  cached = {key: context(), value};
  return value;
 };
 W.Loading1200 = {clearFinder: () => { cached = null; }, version: 'v12.00'};
})(window);
