/* Author: Andrew Fisher. Native fencing paper capture. No operational data. */
function fencePaperDay898(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
}
function fencePaperCounts898(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const out = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!Object.prototype.hasOwnProperty.call(COLLECT_WORDS, key)) return null;
    if (raw == null || raw === '') continue;
    if (typeof raw === 'boolean' || !['string', 'number'].includes(typeof raw)) return null;
    if (typeof raw === 'string' && !raw.trim()) continue;
    const n = Number(raw);
    if (!Number.isSafeInteger(n) || n < 0) return null;
    out[key] = n;
  }
  return out;
}
function fencePaperHasCounts898(value) {
  const counts = fencePaperCounts898(value);
  return !!counts && Object.values(counts).some(n => n > 0);
}
function fenceStoredCounts898(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.values(value).every(n => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0) && fencePaperCounts898(value) != null;
}
function fenceComponentsOnly898(record) {
  return !!record && record.components_only === true && record.quantities &&
    typeof record.quantities === 'object' && !Array.isArray(record.quantities) &&
    Object.keys(record.quantities).length === 0 && fenceStoredCounts898(record.components) && fencePaperHasCounts898(record.components);
}
function fencePaperReserved898(number) {
  const no = String(number || '').trim();
  if (paperNoTaken(no)) return true;
  return Object.values(S.aside || {}).some(entry => {
    const r = entry && entry.rec;
    return r && String(r.docket_no || r.note_no || r.collection_no || '').trim() === no;
  });
}
function recordComponentAgreement898(f) {
  if (!mayWrite('a components-only hire agreement')) return null;
  const who = whoAmI(); if (!who) return null;
  const no = String(f.docket_no || '').trim().replace(/\s+/g, '');
  if (!/^\d{3,8}$/.test(no) || fencePaperReserved898(no)) { flash('Enter a new hire agreement number; existing or set-aside papers must be reviewed first.'); return null; }
  if (!fencePaperDay898(f.date) || !String(f.location || '').trim()) { flash('A valid date and location are required.'); return null; }
  const parts = fencePaperCounts898(f.components);
  if (!fenceComponentsOnly898({components_only:true, quantities:f.quantities || {}, components:parts})) {
    flash('Components-only agreements need positive component counts and no charge quantities.'); return null;
  }
  const w = weekOf(f.date), d = {id:nextDocketId(), date:f.date, week:w ? w.sheet : null,
    docket_no:no, crew:'Advanced Temporary Fencing', map_ref:f.map_ref || null,
    location:String(f.location).trim(), quantities:{}, components:parts, components_only:true,
    note:String(f.note || '').trim() || null, signed_by:String(f.signed_by || '').trim() || null,
    scope:'programme', source:'Advanced Temporary Fencing hire agreement ' + no + ', signed paper photographed on site',
    origin:'captured', recorded_by:who, recorded_on:todayIso()};
  S.fenceDockets = (S.fenceDockets || []).concat([d]);
  state.fenceDay = d.date; state.fenceWeek = d.week;
  stampIt('fenceDockets', d.id, who); bump();
  flash('Hire agreement ' + no + ' recorded: components only; no charge quantity confirmed.');
  return d;
}
function collectionProblems898(c) {
  const bad = [];
  if (!c || !fencePaperDay898(c.date)) bad.push('no valid collection date');
  if (!c || !/^\d{3,8}$/.test(String(c.collection_no || ''))) bad.push('no valid collection number');
  if (!c || !String(c.location || '').trim()) bad.push('no location');
  if (!c || !fenceStoredCounts898(c.collected) || !fencePaperHasCounts898(c.collected)) bad.push('no valid collected counts');
  if (c && c.issued != null && !fenceStoredCounts898(c.issued)) bad.push('invalid issued counts');
  if (!c || !c.recorded_by) bad.push('nobody named as recording it');
  if (c && c.week && !(DATA.weeks || []).some(w => w.sheet === c.week)) bad.push('week is not on the schedule');
  return bad;
}
function fenceCollectionRemoved898(id) {
  return tombedHere(id) || tombedHere(String(id).replace(/·[0-9a-f]{4}$/, ''));
}
function showRecordedCollection898() {
  if (typeof FENCE_PRIVATE_VIEW !== 'undefined') { FENCE_PRIVATE_VIEW.book = 'blue'; FENCE_PRIVATE_VIEW.date = ''; FENCE_PRIVATE_VIEW.evidence = 'all'; FENCE_PRIVATE_VIEW.lastQ = ''; }
  state.fenceDay = null; state.fenceWeek = null; state.q = '';
}
function localCollectionRows898() {
  return (S.fenceCollections || []).filter(c => c && c.id && !fenceCollectionRemoved898(c.id)).map(c => {
    const w = weekOf(c.date || ''), row = Object.assign({}, c, {week:c.week || (w ? w.sheet : null)}), bad = collectionProblems898(row);
    return Object.assign(row, {docket_no:c.collection_no, book:'blue', usable:!bad.length, problems:bad, _where:'local', origin:'captured'});
  });
}
function nextCollectionId898() {
  const initials = (S.operator || '').trim().split(/\s+/).map(w => (String(w).match(/[A-Za-z]/) || [''])[0]).join('').toUpperCase().replace(/[^A-Z]/g, '').slice(0,3);
  const head = 'FC-' + (initials ? initials + '-' : ''); let highest = 0;
  for (const id of [...(S.fenceCollections || []).map(r => r.id), ...(FCOM.collections || []).map(r => r.id), ...Object.keys(S.deleted || {}), ...Object.keys(COMMITTED.deleted || {})]) {
    const bare = String(id || '').replace(/^back\//, '');
    if (bare.startsWith(head)) { const m = bare.slice(head.length).match(/^([0-9]+)/); if (m) highest = Math.max(highest, Number(m[1])); }
  }
  return head + String(highest + 1).padStart(4, '0');
}
function recordCollection(f) {
  if (!mayWrite('a fencing collection form')) return null;
  const who = whoAmI(); if (!who) return null;
  const no = String(f.collection_no || '').trim().replace(/\s+/g, '');
  if (!/^\d{3,8}$/.test(no) || fencePaperReserved898(no)) { flash('Enter a new collection number; existing or set-aside papers must be reviewed first.'); return null; }
  const collected = fencePaperCounts898(f.collected), issued = f.issued == null ? null : fencePaperCounts898(f.issued);
  if (f.issued != null && issued == null) { flash('Issued counts must be whole non-negative numbers.'); return null; }
  const w = weekOf(f.date || ''), c = {id:nextCollectionId898(), collection_no:no,
    date:f.date, week:w ? w.sheet : null, crew:'Advanced Temporary Fencing', location:String(f.location || '').trim(),
    removal_time:String(f.removal_time || '').trim() || null, note:String(f.note || '').trim() || null,
    order_no:String(f.order_no || '').trim() || null, signed_by:String(f.signed_by || '').trim() || null,
    source:'Advanced Temporary Fencing collection form / charge sheet ' + no + ', signed paper photographed on site',
    recorded_by:who, recorded_on:todayIso(), collected, issued,
    hire_agreements_written:String(f.hire_agreements_written || '').trim() || null,
    matches:[], book:'blue', scope:'programme'};
  const bad = collectionProblems898(c);
  if (bad.length) { flash('Collection not saved: ' + bad.join('; ') + '.'); return null; }
  S.fenceCollections = (S.fenceCollections || []).concat([c]);
  stampIt('fenceCollections', c.id, who); showRecordedCollection898(); bump();
  flash('Collection form ' + no + ' recorded: counts only; no charge or credit inferred.');
  return c;
}
function collectionForm898(dis, day) {
  const input = (id, label, type='text') => `<div class="f"><label for="${id}">${label}</label><input id="${id}" type="${type}"${type === 'date' ? ' value="' + esc(day) + '"' : ''}${dis}></div>`;
  return `<div class="form paperform" id="paperBlue"><div class="row2">${input('cnNo','Collection form no.')}${input('cnDate','Removal date','date')}</div>
    <div class="row2">${input('cnWhere','Location')}${input('cnHire','Hire agreement no. written on the form')}</div>
    <label>Collected counts</label><div class="papergrid">${Object.entries(COLLECT_WORDS).map(([key, labels]) => `<div class="f"><label for="cn_${key}">${esc(labels[1])}</label><input id="cn_${key}" data-cnc="${key}" inputmode="numeric"${dis}></div>`).join('')}</div>
    <div class="row2">${input('cnSigned','Signed by')}${input('cnNote','Notes as written')}</div>
    <div class="chdrow"><button type="button" class="btn primary" id="cnSave"${dis}>Record collection form</button><button type="button" class="btn ghost" data-paper="off">Close</button></div>
    <div class="hint">Counts collected only. No metres, charge, credit or hire adjustment is inferred.</div></div>`;
}
function bindCollection898(pane) {
  const value = id => { const e = pane.querySelector('#' + id); return e ? e.value.trim() : ''; };
  const save = pane.querySelector('#cnSave');
  if (save) save.onclick = () => {
    const collected = {}; pane.querySelectorAll('[data-cnc]').forEach(e => { if (e.value.trim() !== '') collected[e.dataset.cnc] = e.value.trim(); });
    if (recordCollection({collection_no:value('cnNo'),date:value('cnDate'),location:value('cnWhere'),collected,
      hire_agreements_written:value('cnHire'),signed_by:value('cnSigned'),note:value('cnNote')})) { PAPER.open = null; renderFencing(); }
  };
  pane.querySelectorAll('[data-cndel]').forEach(b => b.onclick = () => {
    if (!mayWrite('a fencing collection form')) return;
    const who = whoAmI(); if (!who || !confirm('Set aside this collection form? Its history and paper are kept.')) return;
    if (setAside('fenceCollections', b.dataset.cndel, who)) { bump(); renderFencing(); }
  });
}
/* Explicit source-linked scrim only. Service movements remain informational and never become charges here. */
function fencePaperCanonical898(value) {
  return JSON.stringify(value, (_,v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])) : v);
}
function serviceScrimSource898(record, kind) {
  const fields = kind === 'service' ? ['id','note_no','date','week','location','note','crew_note','labour_hours','metres','recorded_by','recorded_on']
    : ['id','docket_no','date','week','location','map_ref','quantities','components','note','recorded_by','recorded_on'];
  return Object.fromEntries(fields.map(k=>[k,record && record[k] != null ? record[k] : null]));
}
function recordServiceScrim898(f) {
  if (!mayWrite('reviewed scrim work from a service note')) return null;
  const who=whoAmI(); if(!who)return null;
  const notes=serviceNoteRows().filter(n=>n.id===f.service_id), hires=allDockets().filter(d=>d.id===f.related_hire_id);
  if(notes.length!==1 || hires.length!==1){flash('The source note and related hire must each match one current record.');return null;}
  const n=notes[0],h=hires[0],qty=f.metres,operation=n.id+':scrim';
  if(n.usable===false || h.usable===false || tombedHere(n.id) || tombedHere(h.id) || !fencePaperDay898(n.date) || typeof qty!=='number' || !Number.isFinite(qty) || !(qty>0) || n.metres!==qty || n.date<h.date){flash('Review the source date and explicitly recorded scrim metres first.');return null;}
  if(fencePaperCanonical898(f.expected_service)!==fencePaperCanonical898(serviceScrimSource898(n,'service')) || fencePaperCanonical898(f.expected_hire)!==fencePaperCanonical898(serviceScrimSource898(h,'hire'))){flash('Source records changed or were not explicitly reviewed.');return null;}
  const rows=[...allDockets(),...Object.values(S.aside||{}).map(e=>e&&e.rec).filter(Boolean)];
  const key=x=>String(x||'').trim().toLowerCase().replace(/\s+/g,' ');
  const sameArea=d=>key(d.location)===key(h.location)||key(d.location)===key(n.location)||!!h.map_ref&&key(d.map_ref)===key(h.map_ref);
  if(rows.some(d=>d.source_operation_id===operation || d.record_type==='service-work'&&d.source_service_id===n.id) || rows.some(d=>Number((d.quantities||{}).scrim)>0&&sameArea(d))){flash('Scrim work may already be recorded for this source or area; review the overlap first.');return null;}
  if(!(Number((h.quantities||{}).clean)===qty)){flash('Scrim quantity must match the related confirmed clean-fence quantity.');return null;}
  const w=weekOf(n.date),d={id:nextDocketId(),docket_no:null,date:n.date,week:w?w.sheet:null,crew:'Advanced Temporary Fencing',
    location:h.location,map_ref:h.map_ref||null,quantities:{scrim:qty},components:null,scope:'programme',origin:'captured',
    record_type:'service-work',source_service_id:n.id,source_operation_id:operation,related_hire_id:h.id,
    source_review:JSON.parse(JSON.stringify({service:f.expected_service,hire:f.expected_hire})),
    source:'Reviewed scrim work from service note '+n.note_no+'; related hire agreement '+h.docket_no,
    note:String(f.note||'').trim()||null,recorded_by:who,recorded_on:todayIso()};
  S.fenceDockets=(S.fenceDockets||[]).concat([d]);stampIt('fenceDockets',d.id,who);bump();
  flash('Reviewed scrim work recorded; existing fence metres and service labour remain separate.');return d;
}
function servicePaperForWork898(record) {
  if(!record || record.record_type!=='service-work' || !record.source_service_id)return null;
  const matches=serviceNoteRows().filter(n=>n.id===record.source_service_id);
  return matches.length===1?matches[0]:null;
}
function serviceWorkProblems898(record, imported) {
  if(!record || record.record_type!=='service-work')return [];
  const q=record.quantities||{},review=record.source_review;
  if(!(record.docket_no==null && record.source_service_id && record.related_hire_id && record.source_operation_id===record.source_service_id+':scrim' && Object.keys(q).length===1 && typeof q.scrim==='number' && Number.isFinite(q.scrim) && q.scrim>0 && review && review.service && review.hire))return ['invalid source-linked scrim work'];
  if(review.service.id!==record.source_service_id || review.hire.id!==record.related_hire_id || review.service.metres!==q.scrim || Number((review.hire.quantities||{}).clean)!==q.scrim || record.date!==review.service.date || record.location!==review.hire.location)return ['scrim work differs from its reviewed source quantity or identity'];
  const raw=imported||S,removed=id=>[id,String(id).replace(/·[0-9a-f]{4}$/, '')].some(key=>{
    const later=(a,b)=>String(a||'')>String(b||'')?a:b;
    const off=later((COMMITTED.deleted||{})[key],(raw.deleted||{})[key]),back=later((COMMITTED.deleted||{})['back/'+key],(raw.deleted||{})['back/'+key]);
    return !!off&&!(back&&String(back)>String(off));
  });
  if(removed(record.source_service_id)||removed(record.related_hire_id))return ['a reviewed source record was set aside'];
  const choose=(list,id,kind)=>{
    const matches=list.filter(r=>r&&r.id===id),variants=new Map(matches.map(r=>[fencePaperCanonical898(serviceScrimSource898(r,kind)),r]));
    return variants.size===1?[...variants.values()][0]:null;
  };
  const n=choose([...(FCOM.service_notes||[]),...(raw.serviceNotes||[])],record.source_service_id,'service');
  const h=choose([...(FCOM.dockets||[]),...(raw.fenceDockets||[])],record.related_hire_id,'hire');
  if(!n||!h)return ['a reviewed source record is missing or conflicted'];
  if(!fencePaperDay898(n.date)||!fencePaperDay898(h.date)||n.usable===false||h.usable===false||!(Number(n.labour_hours)>0)||!n.recorded_by||!h.recorded_by)return ['a reviewed source record is unusable'];
  if(fencePaperCanonical898(review.service)!==fencePaperCanonical898(serviceScrimSource898(n,'service')) || fencePaperCanonical898(review.hire)!==fencePaperCanonical898(serviceScrimSource898(h,'hire')))return ['a reviewed source record changed'];
  return [];
}
