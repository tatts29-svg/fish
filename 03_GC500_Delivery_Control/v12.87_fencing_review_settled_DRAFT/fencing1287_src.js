/* Author: Andrew Fisher. v12.87: the settled 36641 classification joins the source review (from v12.82, rebuilt on live v12.86).
 * This is evidence metadata only. The current record, financial model and existing
 * completion rule remain untouched. Native review checks the complete fingerprint,
 * source hashes and unique identities each time it is read. */
(function () {
 'use strict';
 const add = __FENCING1287_DATA__;
 const review = typeof DATA !== 'undefined' && DATA.fence_ccb_review847;
 if (!review || review.schema !== 1 || !Array.isArray(review.rows) || !Array.isArray(review.sources)) return;
 if (review.ccb1287) return;
 // Never overwrite a later review or resolve a duplicate identity by choosing one.
 const row = add.rows[0];
 if (review.rows.some(r => r && (r.record_id === row.record_id || r.docket_no === row.docket_no))) return;
 for (const source of add.sources) {
  const existing = review.sources.filter(s => s && s.id === source.id);
  if (existing.length > 1 || (existing.length === 1 && existing[0].sha256 !== source.sha256)) return;
 }
 review.rows.push(row);
 for (const source of add.sources) if (!review.sources.some(s => s && s.id === source.id)) review.sources.push(source);
 review.ccb1287 = true;
})();
