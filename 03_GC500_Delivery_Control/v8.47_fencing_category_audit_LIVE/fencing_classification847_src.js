/* Author: Andrew Fisher. Read-only CCB classification evidence.
 * A booked pricing column is not proof of category. Preserve recorded quantities,
 * charge calculations and source identities; only describe classification certainty.
 */
function fenceInstallationWeeks847() {
  return (typeof DATA === 'undefined' ? [] : DATA.weeks || []).filter(w => w.phase === 'Build' || w.phase === 'Event');
}
function fenceCcbReview847(record, options) {
  const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
  const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']'
    : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}' : JSON.stringify(value);
  const types = ['ccb_event', 'ccb_demarc'], q = record && record.quantities || {};
  const positive = types.filter(k => Number.isFinite(Number(q[k])) && Number(q[k]) > 0);
  const quantity = positive.reduce((n, k) => n + Number(q[k]), 0);
  const result = {recordId:String(record && record.id || ''), docketNo:String(record && record.docket_no || ''),
    state:quantity > 0 ? 'pending' : 'not-applicable', reviewState:'none', currentType:positive.length === 1 ? positive[0] : null,
    confirmedType:null, quantity, reason:quantity > 0 ? 'CCB classification has no current source confirmation.' : '', sourceRefs:[]};
  if (!quantity) return result;
  const input = options || {}, catalogue = own(input, 'catalogue') ? input.catalogue : typeof DATA === 'undefined' ? null : DATA.fence_ccb_review847;
  const records = own(input, 'records') ? input.records : typeof allDockets === 'function' ? allDockets() : [record];
  const stop = (reviewState, reason) => Object.assign(result, {reviewState, reason});
  if (!catalogue || catalogue.schema !== 1 || !Array.isArray(catalogue.rows) || !Array.isArray(catalogue.sources)) return result;
  const rows = catalogue.rows.filter(r => r && (r.record_id === result.recordId || r.docket_no === result.docketNo));
  if (!rows.length) return result;
  if (rows.length !== 1 || !Array.isArray(records) || records.filter(r => r && (String(r.id || '') === result.recordId || String(r.docket_no || '') === result.docketNo)).length !== 1)
    return stop('ambiguous', 'CCB source review does not identify one unique current docket.');
  const row = rows[0], fields = ['date','location','quantities','components','note'];
  if (row.record_id !== result.recordId || row.docket_no !== result.docketNo || !row.expected || Object.keys(row.expected).sort().join('|') !== fields.slice().sort().join('|') ||
      canonical(Object.fromEntries(fields.map(k => [k, record[k] == null ? null : record[k]]))) !== canonical(row.expected))
    return stop('stale', 'The current CCB record differs from its classification review.');
  if (!row.decision || !['confirmed','pending'].includes(row.decision.state) || typeof row.decision.basis !== 'string' || !row.decision.basis.trim() ||
      !Array.isArray(row.source_ids) || !row.source_ids.length || new Set(row.source_ids).size !== row.source_ids.length)
    return stop('stale', 'CCB classification review lacks a complete decision and source basis.');
  let files = own(input, 'files') ? input.files : null;
  if (!own(input, 'files') && typeof photoIndex === 'function') {
    try { const index = photoIndex(); files = index.state === 'ready' ? index.files : null; } catch (_) {}
  }
  for (const id of row.source_ids) {
    const matches = catalogue.sources.filter(s => s && s.id === id);
    if (matches.length !== 1 || !/^[a-f0-9]{64}$/.test(matches[0].sha256 || '')) return stop('stale', 'The reviewed CCB source identity is incomplete or ambiguous.');
    const source = matches[0], file = own(files, id) ? files[id] : null;
    result.sourceRefs.push({id:source.id, sha256:source.sha256, title:source.title || source.id});
    if (!file || !/^[a-f0-9]{64}$/.test(file.sha256 || '')) return stop('unavailable', 'The reviewed CCB source checksum is not available yet.');
    if (file.sha256 !== source.sha256) return stop('stale', 'A CCB classification source has changed since review.');
  }
  result.reviewState = 'current'; result.reason = row.decision.basis;
  if (row.decision.state === 'confirmed') {
    if (!types.includes(row.decision.type) || row.decision.type !== result.currentType)
      return stop('stale', 'The confirmed CCB category does not match its current allocation; review is required.');
    result.state = 'confirmed'; result.confirmedType = row.decision.type;
  }
  return result;
}
function fenceCcbSummary847(dockets, options) {
  const records = Array.isArray(dockets) ? dockets : [], types = ['ccb_event','ccb_demarc'];
  const empty = () => Object.fromEntries(types.map(k => [k, 0]));
  const result = {rawByType:empty(), confirmedByType:empty(), pendingByType:empty(), pendingMetres:0, pendingCount:0, rows:[]};
  const input = Object.assign({}, options || {});
  if (!Object.prototype.hasOwnProperty.call(input, 'records')) input.records = typeof allDockets === 'function' ? allDockets() : records;
  for (const record of records) {
    const review = fenceCcbReview847(record, input);
    if (review.state === 'not-applicable') continue;
    result.rows.push(review);
    for (const key of types) {
      const value = Number((record.quantities || {})[key]);
      if (!(value > 0) || !Number.isFinite(value)) continue;
      result.rawByType[key] += value;
      if (review.state === 'confirmed' && review.confirmedType === key) result.confirmedByType[key] += value;
      else result.pendingByType[key] += value;
    }
    if (review.state !== 'confirmed') { result.pendingCount++; result.pendingMetres += review.quantity; }
  }
  for (const field of ['rawByType','confirmedByType','pendingByType']) for (const key of types) result[field][key] = Math.round(result[field][key] * 100) / 100;
  result.pendingMetres = Math.round(result.pendingMetres * 100) / 100;
  return result;
}
