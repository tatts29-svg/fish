/* Author: Andrew Fisher. Fencing map: source-bound, read-only view models. */
(function(root, factory) {
  const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GC500FencingCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const list = x => Array.isArray(x)?x:[];
  const object = x => !!x&&typeof x==='object'&&!Array.isArray(x);
  const TYPES = ['clean', 'scrim', 'ccb', 'relocation', 'other', 'unclassified'];
  const key = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const text = s => String(s == null ? '' : s);
  const hash = s => /^[a-f0-9]{64}$/.test(text(s));
  const date = s => /^\d{4}-\d{2}-\d{2}$/.test(text(s));
  function categories(fields, description) {
    const out = [];
    for (const [k, n] of Object.entries(fields || {})) {
      if (!Number.isFinite(n) || n <= 0) continue;
      if (/Braced for Scrim/i.test(k)) out.push('scrim');
      else if (/— Clean/i.test(k)) out.push('clean');
      else if (/Crowd Control Barriers/i.test(k)) out.push('ccb');
      else if (/Relocation|Removal/i.test(k)) out.push('relocation');
    }
    if (!out.length && /\bCCB\b/i.test(description)) out.push('ccb');
    if (!out.length && /\bscrim\b/i.test(description)) out.push('scrim');
    return [...new Set(out.length ? out : ['other'])];
  }
  function isNotice(row) { return row.id === 'site-closed'; }
  function rowsFromNative(weeks, sources) {
    const out = [], seen = new Set();
    for (const week of list(weeks)) {
      const p = week && week.plan_update; if (!p || !Array.isArray(p.rows_by_day)) continue;
      const source = sources.find(s => s.sha256.slice(0,16) === p.sha256_16 && (!p.sha256 || p.sha256 === s.sha256));
      if (!source) continue;
      for (const day of p.rows_by_day.filter(object)) for (const [index,row] of list(day.rows).entries()) {
        if(!object(row))continue;
        const rowIssues=[];if(row.requirements!=null&&!Array.isArray(row.requirements))rowIssues.push('Prerequisites could not be read; check the source plan.');if(row.fields!=null&&!object(row.fields))rowIssues.push('Quantities could not be read; check the source plan.');
        const nativeId = text(row.id || `${day.date}:${row.page || 1}:${index}`);
        const id = `${source.id}:${nativeId}`; if (seen.has(id)) continue; seen.add(id);
        out.push({id, native_id:nativeId, source_id:source.id, source_sha256:source.sha256, revision:source.revision,
          date:row.date || day.date, location:text(row.location), description:text(row.description),
          page:row.page || 1, fields:object(row.fields)?row.fields:{}, row_issues:rowIssues, note:text(row.note || row.comment || row.flag),
          requirements:list(row.requirements).filter(object).map(r => ({id:text(r.id),text:text(r.text),kind:text(r.kind),page:r.page || row.page || 1})),
          conflicts:list(row.conflicts).filter(c=>typeof c==='string'||object(c)).map(c => typeof c === 'string' ? c : {...c}),
          categories:categories(object(row.fields)?row.fields:{},row.description), kind:isNotice(row)?'notice':/stockpile/i.test(row.description)?'stockpile':'task'});
      }
    }
    return out;
  }
  function bounds(points) {
    if (!points.length) return null;
    return [Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];
  }
  function validateGeometry(g, sources, masterHash) {
    if (!object(g) || !hash(masterHash) || g.master_sha256 !== masterHash) return 'Master drawing mismatch';
    if(!Array.isArray(g.task_ids)||!g.task_ids.every(id=>typeof id==='string'))return 'Task identity schema invalid';
    const src = sources.find(s=>s.sha256 === g.source_sha256);
    if (!src) return 'Plan source mismatch';
    if(src.role==='master-reference'&&(src.sha256!==masterHash||g.role!=='area-signoff'||g.kind!=='anchor'||g.task_ids.length))return 'Master reference is limited to reviewed area anchors';
    if (!Number.isInteger(g.source_page) || g.source_page < 1 || g.source_page > src.pages) return 'Source page missing';
    if(g.role==='area-signoff'&&(!Array.isArray(g.area_evidence_names)||!g.area_evidence_names.every(n=>typeof n==='string')))return 'Area identity schema invalid';
    if (!['line','workarea','stockpile','anchor'].includes(g.kind)) return 'Unsupported geometry';
    const min = g.kind==='line'?2:g.kind==='workarea'?3:1;
    if (!Array.isArray(g.points) || g.points.length<min || g.points.length>10000 || !g.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=0&&p[0]<=2384&&p[1]>=0&&p[1]<=1684)) return 'Invalid drawing coordinates';
    if (!['main','inset'].includes(g.region)) return 'Drawing region missing';
    if (!g.confidence || !g.alignment || !text(g.alignment.method)) return 'Alignment evidence missing';
    if (g.category && !TYPES.includes(g.category)) return 'Unverified fence type';
    return null;
  }
  function completionFor(task, snapshot) {
    const out = {state:'planned',label:'Planned · section not confirmed',area:null,section:null};
    if (task.kind==='notice') return {...out,state:'notice',label:'Programme notice'};
    const explicit = list(snapshot.sectionEvidence).filter(object).find(s => s.task_id===task.id && s.source_sha256===task.source_sha256 && s.revision===task.revision && s.scope==='section' && s.current===true && s.evidence_id && s.at);
    if (explicit && explicit.cancelled===true) return {...out,state:'cancelled',label:'Cancelled · confirmed for this task',section:explicit};
    if (explicit && typeof explicit.done==='boolean') {
      if (explicit.done) return {...out,state:'complete',label:'Section complete',section:explicit};
      out.section=explicit; // An explicit un-tick never inherits another area's completion.
    }
    const area = list(snapshot.areaEvidence).filter(object).find(a => key(a.name)===key(task.location));
    if (area && area.done === true) { out.area=area; out.label='Planned · area sign-off also recorded'; }
    if(task.row_issues&&task.row_issues.length){out.state='confirm';out.label='Source data needs review';}
    else if (task.conflicts.length) {out.state='confirm';out.label='Quantity needs confirmation';}
    else if (task.requirements.some(r=>r.kind==='hold')) {out.state='hold';out.label='Check prerequisite before work';}
    return out;
  }
  function model(snapshot, masterHash) {
    snapshot=object(snapshot)?snapshot:{};
    const issues=[];if(!Array.isArray(snapshot.sources)||snapshot.sources.some(s=>!object(s)))issues.push('The source catalogue could not be fully read.');if(!Array.isArray(snapshot.weeks))issues.push('The work catalogue could not be read.');for(const w of list(snapshot.weeks))for(const d of list(w&&w.plan_update&&w.plan_update.rows_by_day))if(!object(d)||!Array.isArray(d.rows)||d.rows.some(r=>!object(r)))issues.push('Some source task rows could not be read; consult the plan.');
    const sources=list(snapshot.sources).filter(object).filter(s=>hash(s.sha256)&&date(s.revision)&&Number.isInteger(s.pages)&&s.id);
    const referenceSources=list(snapshot.reference_sources).filter(object).filter(s=>s.role==='master-reference'&&s.sha256===masterHash&&Number.isInteger(s.pages)&&s.pages===1&&s.id);
    const tasks=rowsFromNative(snapshot.weeks,sources);
    const byId=new Map(tasks.map(t=>[t.id,t]));
    const accepted=[],rejected=[],seenGeometry=new Set();
    for (const g of list(snapshot.geometry)) {
      const reason=!g||!g.id?'Geometry identity missing':seenGeometry.has(g.id)?'Duplicate geometry identity':validateGeometry(g,sources.concat(referenceSources),masterHash);
      if(g&&g.id)seenGeometry.add(g.id);
      if(reason) {rejected.push({id:g&&g.id,reason});continue;}
      // An older line is never attached to a newer task just because the park name matches.
      const taskIds=g.task_ids.filter(id=>byId.has(id)&&byId.get(id).source_sha256===g.source_sha256);
      accepted.push({...g,task_ids:taskIds,bounds:bounds(g.points)});
    }
    const rows=tasks.map(t=>({...t,status:completionFor(t,snapshot),geometry:accepted.filter(g=>g.task_ids.includes(t.id))}));
    const coverage=list(snapshot.coverage).filter(object).filter(r=>sources.some(s=>s.id===r.source_id&&s.sha256===r.source_sha256&&Number.isInteger(r.source_page)&&r.source_page>=1&&r.source_page<=s.pages)&&['mapped','unmapped'].includes(r.mapping_status));
    return {sources,referenceSources,coverage,rows,geometry:accepted,rejected,issues:[...new Set(issues.concat(rows.flatMap(r=>r.row_issues)))],currentSource:snapshot.current_source_id||null,
      masterValid:hash(masterHash)&&snapshot.master_sha256===masterHash,
      receivedAt:snapshot.received_at||null,record:snapshot.record||null};
  }
  function filterRows(m, f) {
    const query=key(f.query), types=f.types||[];
    return m.rows.filter(r => (!f.source||r.source_id===f.source)&&(!f.day||r.date===f.day)&&(!f.status||f.status==='all'||f.status==='unmapped'&&!r.geometry.length||r.status.state===f.status)&&(!types.length||r.kind==='notice'||r.categories.some(t=>types.includes(t)))&&(!query||key(r.location+' '+r.description).includes(query)));
  }
  function dedupeGeometry(geometries) {
    const groups=new Map();
    for(const g of geometries){
      const a=JSON.stringify(g.points),b=g.kind==='line'?JSON.stringify([...g.points].reverse()):a;
      const k=g.master_sha256+'|'+g.region+'|'+g.kind+'|'+(a<b?a:b);
      if(groups.has(k)){const x=groups.get(k);x.source_refs.push({id:g.id,sha256:g.source_sha256,page:g.source_page});x.task_ids=[...new Set(x.task_ids.concat(g.task_ids))];if(x.category!==g.category)x.category='unclassified';}
      else groups.set(k,{...g,task_ids:[...g.task_ids],source_refs:[{id:g.id,sha256:g.source_sha256,page:g.source_page}]});
    }
    return [...groups.values()];
  }
  function stats(rows) { return {tasks:rows.filter(r=>r.kind!=='notice').length,notices:rows.filter(r=>r.kind==='notice').length,mapped:rows.filter(r=>r.kind!=='notice'&&r.geometry.length).length,complete:rows.filter(r=>r.status.state==='complete').length,unmapped:rows.filter(r=>r.kind!=='notice'&&!r.geometry.length).length}; }
  return Object.freeze({key,categories,rowsFromNative,bounds,validateGeometry,completionFor,model,filterRows,stats,dedupeGeometry});
});
