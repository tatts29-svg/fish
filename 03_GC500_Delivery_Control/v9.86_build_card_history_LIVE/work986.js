/* Author: Andrew Fisher. Read-only daily works, kept separate from whole-build progress. */
(function (root) {
 'use strict';
 const list = x => Array.isArray(x) ? x : [];
 const number = x => typeof x === 'number' && Number.isFinite(x) && x > 0;
 const fmt = n => String(Math.round(n * 100) / 100);
 const refsText = n => fmt(n)+(n===1?' ref':' refs');
 const unique = values => [...new Set(values.filter(Boolean).map(String))];
 const valid = iso => /^\d{4}-\d{2}-\d{2}$/.test(String(iso)) && Number.isFinite(Date.parse(iso + 'T00:00:00Z')) && new Date(iso + 'T00:00:00Z').toISOString().slice(0, 10) === iso;
 const dateAt = at => { const t = Date.parse(at); return Number.isFinite(t) ? new Date(t + 10 * 3600000).toISOString().slice(0, 10) : ''; };
 const fenceTypes = {
  clean: ['Mesh fence', 'm'], scrim: ['Scrim', 'm'], relocation: ['Fence relocation', 'm'], removal: ['Fence removal', 'm'], reinstatement: ['Fence reinstatement', 'm'],
  ccb_event: ['CCB · event', 'm'], ccb_demarc: ['CCB · demarcation', 'm'], flat_feet: ['CCB · flat feet', 'm'],
  v_gates: ['Vehicle gates', 'each'], ped_gates: ['Pedestrian gates', 'each'], wheels: ['Gate wheels', 'each']
 };
 const planTypes = {
  'Temporary Fence (m) — Clean': ['Mesh fence', 'm'], 'Temporary Fence (m) — Braced for Scrim': ['Fence for scrim', 'm'],
  'Temporary Fence (m) — Relocation': ['Fence relocation', 'm'], 'Temporary Fence (m) — Removal': ['Fence removal', 'm'],
  'Crowd Control Barriers (m) — Event': ['CCB · event', 'm'], 'Crowd Control Barriers (m) — Demarcation': ['CCB · demarcation', 'm'],
  'Crowd Control Barriers (m) — Flat Feet': ['CCB · flat feet', 'm'], 'Crowd Control Barriers (m) — Removal': ['CCB removal', 'm'],
  'Vehicle Gates': ['Vehicle gates', 'each'], 'Ped. Gates': ['Pedestrian gates', 'each']
 };
 const components = {mesh_panel:'Mesh panels collected',hoarding_panel:'Hoarding panels collected',cc_barrier:'CCB collected',base:'Bases collected',clamp:'Clamps collected',brace:'Braces collected',dog_bar:'Dog bars collected',hand_rail:'Handrails collected',pedestrian_gate:'Pedestrian gates collected',wheels:'Wheels collected'};
 const groupName = a => ({'Portable buildings':'Buildings','Toilets & amenities':'Toilets','Variable message signs':'VMS','Access & plant':'Access equipment','Generators':'Generators','Lighting':'Lighting'})[a.discipline] || a.discipline || 'Equipment';
 function canonical(v) { return v && typeof v === 'object' ? Array.isArray(v) ? '[' + v.map(canonical).join(',') + ']' : '{' + Object.keys(v).sort().map(k => k + ':' + canonical(v[k])).join(',') + '}' : JSON.stringify(v); }
 function papers(rows, key, fields, issues, iso) {
  const groups = new Map();
  list(rows).forEach(row => { if (!row || row.usable !== true) return; const id = String(row[key] || row.id || '').trim(); if (!id) { issues.push('A work paper has no identity.'); return; } if (!groups.has(id)) groups.set(id, []); groups.get(id).push(row); });
  const result = [];
  groups.forEach((copies, id) => { if(iso&&!copies.some(r=>r.date===iso))return;const variants = unique(copies.map(r => canonical(Object.fromEntries(fields.map(k => [k, r[k] == null ? null : r[k]]))))); if (variants.length > 1) issues.push('Conflicting work paper ' + id + ' is excluded from the daily quantity.'); else result.push(copies[0]); });
  return result;
 }
 function create(env) {
  function day(iso, today, dayObj) {
   const past = iso < today, rows = [], details = [], issues = [], totals = new Map();
   const result = {iso, heading: past ? 'WORK RECORDED' : 'PLANNED WORK', rows, details, issues, recorded: past, planned: !past, empty: false, ready: true};
   if (!valid(iso) || !valid(today)) return {...result, ready:false, rows:[{label:'Works',value:'Date unavailable',kind:'unavailable'}]};
   if (env.ready && !env.ready()) return {...result,ready:false,rows:[{label:'Works',value:'Loading records',kind:'unavailable'}]};
   const push = (label, value, kind) => rows.push({label,value,kind});
   const add = (label, unit, qty, kind) => { if (!number(qty)) return; const key=kind+'|'+label+'|'+unit; const old=totals.get(key); totals.set(key,{label,unit,qty:qty+(old?.qty||0),kind}); };
   const detail = (kind, label, refs, source) => details.push({kind,label,refs:unique(list(refs)),source:source || ''});
   const byRef = assets => [...new Map(list(assets).filter(a=>a?.key).map(a=>[a.key,a])).values()];
   if (past) {
    const arrivals = [...new Map(list(env.arrivals?.(iso)).filter(r=>r?.a?.key && dateAt(r.at)===iso).map(r=>[r.a.key,r])).values()];
    if (arrivals.length) { push('Arrived',refsText(arrivals.length),'arrival'); arrivals.forEach(r=>detail('arrival',r.a.key+' · '+(r.a.name||groupName(r.a)),[r.a.key],'Dated on-site record · '+r.at)); }
    for (const [flag,label] of [['done','Installed'],['levelled','Levelled'],['steps','Stairs fitted']]) {
     const matching = byRef(env.assets).filter(a=>{
      const raw=env.rawDelivery?.(a.key);
      if (raw && !(raw[flag] && dateAt(raw[flag+'_at'])===iso) && !list(raw[flag+'_history']).some(h=>h[flag] && dateAt(h.at)===iso)) return false;
      const rec=env.delivery?.(a.key,iso);
      return !!(rec && rec[flag]===true && dateAt(rec[flag+'_at'])===iso && (flag!=='done' || !env.complete || env.complete(a,iso)));
     });
     if (matching.length) { push(label,refsText(matching.length),flag); matching.forEach(a=>detail(flag,a.key+' · '+(a.name||groupName(a)),[a.key],'Dated '+label.toLowerCase()+' record · '+iso)); }
    }
    papers(env.dockets,'docket_no',['date','location','quantities','components'],issues,iso).filter(r=>r.date===iso).forEach(r=>{
     const printed=[];
     Object.entries(r.quantities||{}).forEach(([key,qty])=>{const type=fenceTypes[key];if(type && number(qty)){add(type[0],type[1],qty,'fencing');printed.push(type[0]+' '+fmt(qty)+' '+type[1]);}});
     detail('fencing',(r.location||'Fencing')+(printed.length?' · '+printed.join(' · '):' · work paper recorded'),[r.map_ref], 'Hire agreement '+(r.docket_no||r.id));
    });
    list(env.operations).filter(r=>r.date===iso && ['relocation','removal','reinstatement'].includes(r.type)).forEach(r=>{
     const type=fenceTypes[r.type];if(!type || r.unit!==type[1] || !number(r.quantity))return;
     add(type[0],type[1],r.quantity,'fencing');detail('fencing-operation',(r.location||type[0])+' · '+type[0]+' '+fmt(r.quantity)+' '+r.unit,[],unique([r.number,...list(r.paperSourceIds)]).join(' · '));
    });
    papers(env.services,'note_no',['date','location','labour_hours','metres'],issues,iso).filter(r=>r.date===iso).forEach(r=>{
     add('Fencing service notes','h',r.labour_hours,'service');
     detail('service',(r.location||'Fencing service')+(number(r.labour_hours)?' · '+fmt(r.labour_hours)+' h':''),[], 'Service note '+(r.note_no||r.id));
     if(r.note)details[details.length-1].note=String(r.note);
    });
    papers(env.collections,'collection_no',['date','location','collected'],issues,iso).filter(r=>r.date===iso).forEach(r=>{
     const printed=[];
     Object.entries(r.collected||{}).forEach(([key,qty])=>{if(components[key] && number(qty)){add(components[key],'each',qty,'collection');printed.push(fmt(qty)+' '+key.replace(/_/g,' '));}});
     detail('collection',(r.location||'Collection')+(printed.length?' · '+printed.join(' · '):''),[], 'Collection form '+(r.collection_no||r.id));
    });
   } else {
    const d=dayObj || env.programme?.(iso) || {iso};
    if (d.iso && d.iso!==iso) return {...result,ready:false,rows:[{label:'Works',value:'Date mismatch',kind:'unavailable'}]};
    for (const [key,suffix] of [['deliveries','due in'],['removals','due out']]) {
     const grouped=new Map();
     list(d[key]).filter(r=>r?.a?.key && !r.a._cancelled).forEach(r=>{ const k=groupName(r.a); if(!grouped.has(k))grouped.set(k,new Map());grouped.get(k).set(r.a.key,r); });
     grouped.forEach((refs,name)=>{push(name+' · '+suffix,refsText(refs.size),'scheduled'); refs.forEach(r=>detail('scheduled',r.a.key+' · '+(r.a.name||name)+' · '+suffix,[r.a.key],unique(list(r.events).map(e=>e.sheet)).join(' · ')||'Current programme'));});
    }
    list(d.unref).forEach(r=>detail('scheduled',[r.item||r.description||r.activity||'Additional work',r.location||r.where].filter(Boolean).join(' · '),[],r.source_range||r.sheet||'Current programme'));
    if(list(d.unref).length)push('Additional work',list(d.unref).length+' tasks','scheduled');
    list(env.sheets).filter(w=>w.year===2026||w.rolled_forward).forEach(w=>{
     const update=w.plan_update, covered=list(update?.days_covered).includes(iso);
     const work=covered?list(update.rows_by_day).filter(d=>d.date===iso).flatMap(d=>list(d.rows)):list(w.programme_rows951).filter(r=>r.date===iso&&r.included===true);
     const seen=new Set();
     work.forEach(r=>{
      const id=String(r.id||r.source_range||r.source_row||canonical([r.location,r.description,r.fields||r.quantities]));if(seen.has(id))return;seen.add(id);
      if(r.id==='site-closed'){push('Site status',r.description||'Site closed','closure');detail('closure',r.description||'Site closed',[],update?.file||w.sheet);return;}
      const values=covered?r.fields:r.quantities,printed=[];
      Object.entries(values||{}).forEach(([key,qty])=>{const type=planTypes[key];if(type&&number(qty)){add(type[0],type[1],qty,'fencing-plan');printed.push(type[0]+' '+fmt(qty)+' '+type[1]);}});
      detail('fencing-plan',[r.location,r.description,printed.join(' · ')].filter(Boolean).join(' · '),[],covered?(update.file||w.sheet)+(r.page?' · p'+r.page:''):(r.source_range||w.sheet));
     });
    });
   }
   totals.forEach(t=>push(t.label,fmt(t.qty)+' '+t.unit,t.kind));
   if (!rows.length && details.length) push(past?'Work papers':'Scheduled works',fmt(details.length)+(past?' records':' tasks'),past?'recorded':'scheduled');
   if (!rows.length && issues.length) push('Works','Records under review','review');
   if (!rows.length) { result.empty=true;push('Works',past?'No work recorded':'Nothing scheduled',past?'empty-record':'empty-plan'); }
   return result;
  }
  return {day};
 }
 let cachedKey='', cached;
 function native() {
  const ready=typeof todayWorkHealth840!=='function'||todayWorkHealth840().ready;
  const photoState=typeof photoIndex==='function'?photoIndex().state:'';
  const docsAt=typeof DOCS==='undefined'?'':DOCS.at||0;
  const key=String(ready)+'|'+photoState+'|'+docsAt+'|'+(typeof S==='undefined'?'':JSON.stringify(S));
  if(cached && key===cachedKey)return cached;
  cachedKey=key;
  cached=create({ready:()=>ready,assets:typeof allAssets==='function'?allAssets():[],arrivals:iso=>typeof arrivalsOn==='function'?arrivalsOn(iso):[],
   rawDelivery:key=>typeof deliveryOf==='function'?deliveryOf(key):null,delivery:(key,iso)=>typeof deliveryAsOf==='function'?deliveryAsOf(key,iso):null,
   complete:(a,iso)=>typeof lightTally==='function'&&lightTally([a],iso).done===1,
   dockets:typeof allDockets==='function'?allDockets():[],services:typeof serviceNoteRows==='function'?serviceNoteRows():[],collections:typeof collectionRows==='function'?collectionRows():[],
   operations:typeof fenceProgressEvidence848==='function'?fenceProgressEvidence848(typeof todayIso==='function'?todayIso():undefined).operations:[],
   sheets:typeof DATA!=='undefined'?list(DATA.fencing?.week_sheets):[],programme:iso=>typeof calendarDays==='function'?calendarDays().find(d=>d.iso===iso):null});
  return cached;
 }
 root.BuildWork986={create,day:(iso,today,dayObj)=>native().day(iso,today,dayObj),reset:()=>{cached=null;cachedKey='';}};
})(typeof window!=='undefined'?window:globalThis);
