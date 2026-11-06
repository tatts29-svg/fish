/* Author: Andrew Fisher. Source-bound physical quantities; never a record or price change. */
function fenceMeasuredCcb959(record, options) {
  const input = options || {}, own = (o,k) => o != null && Object.prototype.hasOwnProperty.call(o,k);
  const catalogue = own(input,'measuredCatalogue') ? input.measuredCatalogue : FENCE_COUNTS959;
  const id = String(record?.id || ''), number = String(record?.docket_no || '');
  const rows = catalogue?.unclassified?.filter(row => row.records?.some(ref => ref.record_id === id || ref.number === number)) || [];
  if (!rows.length) return null;
  const result = {recordId:id,docketNo:number,state:'pending',reviewState:'stale',currentType:null,confirmedType:null,quantity:0,
    measuredUnclassified:true,quantityKnown:false,reason:'The measured unclassified CCB source requires review.',sourceRefs:[]};
  const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']' : value && typeof value === 'object'
    ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key)+':'+canonical(value[key])).join(',') + '}' : JSON.stringify(value);
  const records = own(input,'records') ? input.records : allDockets();
  const fields = ['id','docket_no','date','week','scope','usable','quantities','components','location','note'];
  const row=rows[0], ref=row?.records?.[0];
  if (catalogue.schema !== 1 || rows.length !== 1 || row.records?.length !== 1 || ref.book !== 'red' || ref.record_id !== id || ref.number !== number ||
      !Array.isArray(records) || records.filter(r => String(r.id || '') === id || String(r.docket_no || '') === number).length !== 1 ||
      canonical(Object.keys(ref.expected || {}).sort()) !== canonical(fields.slice().sort()) ||
      canonical(Object.fromEntries(fields.map(key => [key,record[key] == null ? null : record[key]]))) !== canonical(ref.expected) ||
      record.usable !== true || !['programme','compound'].includes(record.scope) || row.unit !== 'm' || !Number.isFinite(row.quantity) || row.quantity <= 0 ||
      typeof row.basis !== 'string' || !row.basis.trim() || !Array.isArray(row.source_ids) || !row.source_ids.length || new Set(row.source_ids).size !== row.source_ids.length) return result;
  let files = own(input,'files') ? input.files : null;
  if (!own(input,'files')) { try { const index=photoIndex(); files=index.state === 'ready' ? index.files : null; } catch (_) {} }
  for (const sourceId of row.source_ids) {
    const matches=(catalogue.sources || []).filter(source => source.id === sourceId), source=matches[0];
    if (matches.length !== 1 || !/^[a-f0-9]{64}$/.test(source.sha256 || '')) return result;
    result.sourceRefs.push({id:source.id,sha256:source.sha256,title:source.title || source.id});
    if (!files || files[sourceId]?.sha256 !== source.sha256) { result.reviewState='unavailable'; return result; }
  }
  return Object.assign(result,{quantity:row.quantity,quantityKnown:true,reviewState:'current',reason:row.basis});
}

function fenceProgrammeDefinitions959(definitions) {
  const rows=definitions.map(row => ({...row})), columns=typeof FCOL === 'undefined' ? [] : FCOL;
  for (const column of columns) {
    if (!column.programme_type || !['m','each'].includes(column.unit) || rows.some(row => row.id === column.key)) continue;
    rows.push({id:column.key,label:column.name_as_written || column.programme_type,unit:column.unit,
      kind:column.unit === 'm' ? 'fence' : 'gates',note:'Recorded work in the source programme unit; components and other work types stay separate.'});
  }
  return rows;
}

function fenceCcbRecorded959(records) {
  const rows=(records || allDockets()).filter(row => row.usable), summary=fenceCcbSummary847(rows);
  if (summary.evidencePending) return null;
  return Math.round((rows.reduce((sum,row) => sum+['ccb_event','ccb_demarc','flat_feet'].reduce((n,key) => n+(Number(row.quantities?.[key]) || 0),0),0)+summary.unallocatedMetres)*100)/100;
}
