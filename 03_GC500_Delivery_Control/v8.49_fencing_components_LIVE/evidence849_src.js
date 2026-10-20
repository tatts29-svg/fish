/* Author: Andrew Fisher. Non-additive source findings, bound to current records. */
function fenceComponentEvidence849(asOf, supplied) {
  const input = supplied || {}, own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const day = asOf || todayIso();
  const result = {state:'ready', issues:[], pending:[]};
  const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0,10) === value;
  if (!validDate(day)) { result.state = 'unavailable'; result.pending.push({reason:'The review date is unavailable.'}); return result; }
  const catalogue = own(input, 'catalogue') ? input.catalogue : typeof FENCE_EVIDENCE849 === 'undefined' ? null : FENCE_EVIDENCE849;
  const records = own(input, 'records') ? input.records : allDockets();
  const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']' : value && typeof value === 'object'
    ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}' : JSON.stringify(value);
  if (!catalogue || catalogue.schema !== 1 || !Array.isArray(catalogue.items) || !Array.isArray(catalogue.sources) || !Array.isArray(records)) {
    result.state = 'unavailable'; return result;
  }
  let files = own(input, 'files') ? input.files : null;
  if (!own(input, 'files')) { try { const index = photoIndex(); files = index.state === 'ready' ? index.files : null; } catch (_) {} }
  const fields = ['date','location','quantities','components','note'];
  for (const item of catalogue.items) {
    if (!item || typeof item !== 'object') { result.pending.push({reason:'Source record identity needs review.'}); continue; }
    let reason = '';
    const matches = records.filter(record => record && record.id === item.recordId);
    if (!item.id || catalogue.items.filter(other => other && other.id === item.id).length !== 1 || item.book !== 'red' || matches.length !== 1 ||
        !item.expected || canonical(Object.keys(item.expected).sort()) !== canonical(fields.slice().sort())) reason = 'Source record identity needs review.';
    const record = matches[0];
    if (!reason && (item.number == null || String(item.number).trim() === '' || String(record.docket_no) !== String(item.number))) reason = 'The docket number changed after the source review.';
    if (!reason && canonical(Object.fromEntries(fields.map(key => [key, record[key] == null ? null : record[key]]))) !== canonical(item.expected)) reason = 'This record changed after the source review.';
    if (!reason && (!validDate(record.date) || record.usable === false)) reason = 'The dated source record is unavailable.';
    if (!reason && record.date > day) continue;
    if (!reason && (!Array.isArray(item.source_ids) || !item.source_ids.length || new Set(item.source_ids).size !== item.source_ids.length ||
        !Array.isArray(item.papers) || !item.papers.length || item.papers.some(paper => !paper || !item.source_ids.includes(paper.id) || !Number.isInteger(paper.page) || paper.page < 1))) reason = 'The source references need review.';
    if (!reason) for (const id of item.source_ids) {
      const sources = catalogue.sources.filter(source => source && source.id === id);
      if (sources.length !== 1 || !/^[a-f0-9]{64}$/.test(sources[0].sha256 || '') || !files || files[id]?.sha256 !== sources[0].sha256) { reason = 'A reviewed original or summary is unavailable or changed.'; break; }
    }
    if (reason) { result.pending.push({id:item.id, recordId:item.recordId, reason}); continue; }
    result.issues.push({id:item.id, title:String(item.title || ''), detail:String(item.detail || ''), recordId:item.recordId, book:item.book,
      papers:item.papers.map(paper => ({id:paper.id, page:paper.page})), scope:item.scope,
      quantity:item.quantity, range:item.range, component:item.component, status:item.status});
  }
  if (result.pending.length) result.state = 'partial';
  return result;
}
