/* Author: Andrew Fisher. Supplier gate ACTUALS, separate from programme progress.
 * An explicit supplier unit is checked against its original docket. The check
 * never converts wheels to programme gates or updates any existing work total.
 */
function fencePoGateEvidence850(asOf, supplied) {
  const input = supplied || {}, own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const day = asOf || (typeof todayIso === 'function' ? todayIso() : null);
  const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0,10) === value;
  const positive = value => typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= 100000;
  const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']' : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}' : JSON.stringify(value);
  const unit = 'Vehicle Gates / INC 1 X WHEEL';
  const result = {state:'ready', asOf:day, type:'supplier_vehicle_gate_units', unit:'each', unitAsWritten:unit,
    programmeMapping:'unconfirmed', canAddToProgrammeDone:false, acceptedQuantity:null, supplierTotal:null,
    accepted:[], conflictQuantity:null, conflicts:[], pending:[], excluded:[], unitEvidence:{state:'unavailable'}, issues:[],
    basis:'Supplier ACTUALS are separate source evidence. Matching an explicit supplier Vehicle Gate unit to the original wheel count does not establish the number of programme gate openings. Existing quantities, percentages, Revenue and Direct costs remain unchanged.'};
  const unavailable = reason => { result.state = 'unavailable'; result.pending.push({kind:'catalogue',reason}); return result; };
  if (!validDate(day)) return unavailable('A valid review date is required.');
  const catalogue = own(input, 'catalogue') ? input.catalogue : typeof FENCE_PO850 === 'undefined' ? null : FENCE_PO850;
  const records = own(input, 'records') ? input.records : typeof allDockets === 'function' ? allDockets() : null;
  const weeks = own(input, 'weeks') ? input.weeks : typeof DATA === 'undefined' ? null : DATA.weeks;
  if (!catalogue || catalogue.schema !== 1 || catalogue.type !== 'supplier_vehicle_gate_actuals' || catalogue.unit !== 'each' || catalogue.unitAsWritten !== unit ||
      catalogue.programmeMapping !== 'unconfirmed' || catalogue.canAddToProgrammeDone !== false || !Array.isArray(catalogue.sources) || !catalogue.sources.length ||
      !Array.isArray(catalogue.items) || !catalogue.items.length || !Array.isArray(catalogue.excluded) || !Array.isArray(records) || !Array.isArray(weeks) || !weeks.length) return unavailable('The reviewed supplier source catalogue or current records are unavailable.');
  if (!positive(catalogue.total) || catalogue.items.some(item => !item || !positive(item.quantity)) || catalogue.items.reduce((sum,item) => sum + item.quantity, 0) !== catalogue.total) return unavailable('The reviewed supplier ACTUALS total does not reconcile to its source rows.');
  let files = own(input, 'files') ? input.files : null;
  if (!own(input, 'files')) { try { const index = photoIndex(); files = index.state === 'ready' ? index.files : null; } catch (_) {} }
  const sourceCheck = id => {
    if (typeof id !== 'string' || !id.trim()) return 'A source identifier needs review.';
    const sources = catalogue.sources.filter(source => source && source.id === id);
    return sources.length !== 1 || !/^[a-f0-9]{64}$/.test(sources[0].sha256 || '') || !files || files[id]?.sha256 !== sources[0].sha256
      ? 'A reviewed original or supplier ACTUALS source is unavailable or changed.' : '';
  };
  const unitEvidence = catalogue.unitEvidence;
  if (unitEvidence && typeof unitEvidence === 'object' && Number.isInteger(unitEvidence.page) && unitEvidence.page > 0 && positive(unitEvidence.vehicleGates) &&
      typeof unitEvidence.noteAsWritten === 'string' && unitEvidence.noteAsWritten.trim() && typeof unitEvidence.conclusion === 'string' && unitEvidence.conclusion.trim() &&
      !sourceCheck(unitEvidence.source_id) && catalogue.sources.find(source => source && source.id === unitEvidence.source_id)?.sha256 === unitEvidence.sha256) {
    result.unitEvidence = {...unitEvidence,state:'ready',papers:[{id:unitEvidence.source_id,page:unitEvidence.page}]};
  } else result.pending.push({kind:'programme-unit',reason:'The original programme unit example is unavailable or changed; no supplier-to-programme conversion is established.'});
  const fields = ['id','docket_no','date','week','scope','usable','location','quantities','components','note','signed_by','origin'];
  const allItems = catalogue.items.concat(catalogue.excluded);
  const paperCheck = item => !Array.isArray(item.source_ids) || item.source_ids.length < 2 || new Set(item.source_ids).size !== item.source_ids.length ||
    !Array.isArray(item.papers) || !item.papers.length || item.papers.some(paper => !paper || !item.source_ids.includes(paper.id) || !Number.isInteger(paper.page) || paper.page < 1) ||
    item.source_ids.some(id => !item.papers.some(paper => paper && paper.id === id)) ? 'The supplier and original-docket source references need review.' : '';
  const include = (item, kind) => {
    const fail = reason => { result.pending.push({id:item?.id,recordId:item?.recordId,number:item?.number,kind,reason}); };
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id.trim() || typeof item.recordId !== 'string' || !item.recordId.trim() || item.number == null || String(item.number).trim() === '') { fail('The reviewed docket identity is incomplete.'); return; }
    if (allItems.filter(other => other && other.id === item.id).length !== 1 || allItems.filter(other => other && String(other.number) === String(item.number)).length !== 1 || allItems.filter(other => other && other.recordId === item.recordId).length !== 1) { fail('A source docket or reviewed entry occurs more than once; no copy is selected.'); return; }
    const matches = records.filter(record => record && record.id === item.recordId), numberMatches = records.filter(record => record && String(record.docket_no) === String(item.number));
    if (matches.length !== 1 || numberMatches.length !== 1 || matches[0] !== numberMatches[0]) { fail('The current docket ID and number do not identify one record.'); return; }
    const record = matches[0];
    if (!item.expected || canonical(Object.keys(item.expected).sort()) !== canonical(fields.slice().sort()) || canonical(Object.fromEntries(fields.map(key => [key,record[key] == null ? null : record[key]]))) !== canonical(item.expected)) { fail('This docket changed after the supplier source review.'); return; }
    if (String(item.expected.docket_no) !== String(item.number) || item.expected.id !== item.recordId || !validDate(record.date) || record.usable !== true) { fail('The signed, dated source docket is not usable.'); return; }
    const mapped = weeks.filter(week => week && week.sheet === record.week), dated = weeks.filter(week => week && validDate(week.start) && validDate(week.end) && week.start <= record.date && week.end >= record.date);
    if (mapped.length !== 1 || dated.length !== 1 || mapped[0] !== dated[0] || !['Build','Event'].includes(mapped[0].phase) || !['programme','compound'].includes(record.scope)) { fail('The source docket does not have one matching Build or Event week and scope.'); return; }
    if (record.date > day) { result.excluded.push({id:item.id,recordId:item.recordId,number:item.number,date:record.date,state:'future'}); return; }
    const referenceError = paperCheck(item);
    if (referenceError) { fail(referenceError); return; }
    const sourceError = item.source_ids.map(sourceCheck).find(Boolean);
    if (sourceError) { fail(sourceError); return; }
    const papers = item.papers.map(paper => ({id:paper.id,page:paper.page,...(typeof paper.row === 'string' ? {row:paper.row} : {})}));
    const base = {id:item.id,recordId:item.recordId,book:'red',number:String(item.number),date:record.date,week:record.week,scope:record.scope,unit:'each',unitAsWritten:unit,source_ids:item.source_ids.slice(),papers};
    if (kind === 'matched') {
      if (item.book !== 'red' || item.type !== 'supplier_vehicle_gate_units' || item.unit !== 'each' || item.unitAsWritten !== unit || item.programmeMapping !== 'unconfirmed' || item.canAddToProgrammeDone !== false || typeof item.poNumber !== 'string' || !item.poNumber.trim() || !positive(item.quantity) || record.components?.wheels !== item.quantity) { fail('Explicit supplier Vehicle Gate units and the signed original wheel count no longer agree.'); return; }
      const nativeGateQuantity = positive(record.quantities?.v_gates) ? record.quantities.v_gates : null;
      result.accepted.push({...base,quantity:item.quantity,poNumber:item.poNumber,programmeMapping:'unconfirmed',canAddToProgrammeDone:false,nativeGateQuantity,title:String(item.title || ''),detail:String(item.detail || '')});
    } else {
      if (item.unitAsWritten !== unit || !positive(item.supplierQuantity) || !positive(item.originalWheels) || record.components?.wheels !== item.originalWheels || item.supplierQuantity === item.originalWheels || typeof item.reason !== 'string' || !item.reason.trim()) { fail('The supplier-versus-original discrepancy changed after review.'); return; }
      result.conflicts.push({...base,supplierQuantity:item.supplierQuantity,originalWheels:item.originalWheels,reason:item.reason});
    }
  };
  catalogue.items.forEach(item => include(item,'matched'));
  catalogue.excluded.forEach(item => include(item,'conflict'));
  result.acceptedQuantity = result.accepted.length || !result.pending.some(item => item.kind === 'matched') ? result.accepted.reduce((sum,item) => sum + item.quantity,0) : null;
  result.supplierTotal = result.acceptedQuantity;
  result.conflictQuantity = result.conflicts.length || !result.pending.some(item => item.kind === 'conflict') ? result.conflicts.reduce((sum,item) => sum + item.supplierQuantity,0) : null;
  if (result.pending.length) result.state = 'partial';
  return result;
}
