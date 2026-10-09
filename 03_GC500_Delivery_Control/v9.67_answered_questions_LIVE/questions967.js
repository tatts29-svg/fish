/* Author: Andrew Fisher. Questions read current evidence; notes never manufacture a confirmation. */
const Questions967=(()=>{
 'use strict';
 const text=v=>String(v==null?'':v).trim(),normal=v=>text(v).toLowerCase().replace(/[^a-z0-9]+/g,'');
 const same=(a,b)=>normal(a)===normal(b);
 const PROGRAMME_SHA='836a3e1036c660caa89b1b36d4b821e2f84df7a8d8b977068b13a4f07602d9db';
 function demobEvidence(f){
  const expected={'DECON WK1':['2026-10-25','2026-10-30'],'DECON WK2':['2026-11-02','2026-11-06'],'DECON WK3':['2026-11-09','2026-11-13']},weeks=(f.week_sheets||[]).filter(w=>Object.hasOwn(expected,w.sheet));
  return {confirmed:f.source_sha256===PROGRAMME_SHA&&weeks.length===3&&new Set(weeks.map(w=>w.sheet)).size===3&&weeks.every(w=>w.year===2026&&w.phase==='Deconstruction'&&w.first_day===expected[w.sheet][0]&&w.last_day===expected[w.sheet][1]),reviewed:f.received,weeks,held:f.not_rolled_forward||[]};
 }
 function identities(inventory,modelOf){
  if(!inventory||!Array.isArray(inventory.list))return null;
  const pending=[],covered=[],cache=new Map();
  for(const line of inventory.list){
   if(line.unnum)continue;
   for(const r of Object.values(line.refs||{})){
    const count=Number(r.on);if(!(count>0)||!Number.isInteger(count))continue;
    if(!cache.has(r.key))cache.set(r.key,modelOf(r.key));const model=cache.get(r.key);
    if(!model||!Array.isArray(model.rows))throw Error('Current unit identities unavailable');
    const rows=model.rows.filter(u=>u.physical&&same(u.item,line.item)&&text(u.assetNo));
    const moves=(model.tracedMoves||[]).filter(u=>same(u.item,line.item)&&text(u.assetNo));
    const numbers=[...new Set(rows.concat(moves).map(u=>JSON.stringify([u.owner,text(u.assetNo)])))];
    const numbered=Math.min(count,numbers.length),row={ref:r.key,item:line.item,quantity:count,numbered,missing:count-numbered,numbers:[...new Set(rows.concat(moves).map(u=>text(u.assetNo)))]};
    (row.missing?pending:covered).push(row);
   }
  }
  return {pending,covered};
 }
 function history(rows,c){
  return rows.map(source=>{const h=source.slice();if(!c.ready)return h;
   if(h[0]==='R09'&&c.basis?.confirmed){h[1]='done';h[2]='Current pick-up plan applied';h[3]='Planned pick-ups remain on Demob. Actual returns are recorded separately; no pick-up is inferred from its planned date.';h[4]='';}
   if(h[0]==='R06'&&c.basis?.confirmed){h[1]='done';h[2]='Current build and charge basis applied';h[3]='Equipment: Schedule 7 and recorded changes. Positions: master D001-26003-03. Revenue: contract lines, card estimates and the confirmed supplier-cost floor. BOQ differences remain on Pricing; VMS scope remains under R30. No single BOQ is declared approved.';h[4]='';}
   if(h[0]==='R27'&&c.lighting?.confirmed){
    h[1]='done';h[2]='Lighting scope — approved map applied';
    h[3]=`D024-26003-02: ${c.lighting.scope} lighting towers · ${c.lighting.groups.map(g=>g.name+': '+g.scope).join('; ')} · confirmed ${c.lighting.on}. Surplus remains in Equipment.`;h[4]='';
   }
   if(h[0]==='R28'&&c.demob?.confirmed){
    h[1]='done';h[2]='2026 fencing removal dates supplied';h[3]=`Programme received ${c.demob.reviewed}: ${c.demob.weeks.map(w=>w.sheet+': '+w.first_day+' to '+w.last_day).join('; ')}. Planned removals. Held historical rows: ${c.demob.held.join('; ')}.`;h[4]='';
   }
   if(h[0]==='R23'&&c.drawings?.confirmed){
    h[1]='done';h[2]='Current supplied drawing set applied';h[3]=`Issued set as at ${c.day}: ${c.drawings.sheets.join('; ')}. Master: D001-26003-03. VMS drawing conflict: R30.`;h[4]='';
   }
   return h;
  });
 }
 function project(source,c){
  const Q=source.map(q=>q.rows?{...q,rows:q.rows.slice()}:{...q});Q.fails=(source.fails||[]).slice();if(!c.ready)return Q;
  let q=Q.find(x=>x.id==='sp-nums');
  if(c.identityError)Q.fails.push('current identity question');
  if(!q&&c.identities?.pending.length){q={id:'sp-nums',group:'Schedule & plant',st:'open',q:'Received equipment numbers',why:'',need:'',go:'plant'};Q.push(q);}
  if(c.identities&&!(Q.fails||[]).includes('asset numbers')){
   const remaining=c.identities.pending,why='Current fleet numbers and quantity-only records · received equipment only.';
   if(q){q.original=q.original||q.q+'. '+q.why+' '+q.need;q.rows=remaining.map(r=>`${r.ref} · ${r.item}: ${r.numbered} of ${r.quantity} received units numbered; ${r.missing} still needed`);q.why=why;
    q.st=remaining.length?'open':'done';q.q=remaining.length?`${remaining.length} received equipment lines still need fleet numbers`:'Known equipment numbers applied';q.need=remaining.length?'Record only the missing number for the specific received item shown below.':'';q.confirmed967=!remaining.length;
    if(!remaining.length)q.rows=c.identities.covered.filter(r=>['WC09','WC31','T0103','T0003','FL01'].includes(r.ref)).map(r=>`${r.ref} · ${r.item}: ${r.numbers.join(', ')}`);
   }
  }
  const install=Q.find(x=>x.id==='lb-install-confirm747');
  if(install&&c.labour?.mapped){
   install.original=install.original||install.q+'. '+install.why+' '+install.need;
   install.q='Customer installation rates — card basis applied';install.st='done';install.confirmed967=true;install.need='';
   install.why='Per-piece card rates · Coates and sub-hired gear · completed ticks charged · future work forecast. Supplier costs separate.';
   install.rows=c.labour.unpriced.map(r=>`${r.ref} · ${r.item} · ${r.line}: quantity or rate still required in Costs`);
   if(install.rows.length){install.q='Customer labour — specific quantities or rates outstanding';install.st='later';install.confirmed967=false;install.need='Resolve the individual lines shown in Costs; the established card basis does not need reconfirmation.';}
  }
  const ccb=Q.find(x=>x.id==='ccb-classification753');
  if(ccb&&c.ccb){ccb.rows=c.ccb.map(r=>`Hire agreement ${r.number} · ${r.location} · ${r.metres==null?'measured quantity needs review':r.metres+' m measured'} · subtype not confirmed`);}
  return Q;
 }
 function context(){
  const ready=typeof SYNC==='undefined'||!DATA.edition||DATA.edition!=='hosted'||SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length;
  const out={ready,day:todayIso()};if(!ready)return out;
  try{const aliases=physicalCountAssets963(allAssets()).aliases;out.identities=identities(inventory(),ref=>{
   const a=assetOf(ref);if(!a)return null;const m=gcModel925(a,{loading:false}),rows=m.rows.slice();
   aliases.filter(x=>x.source===ref).forEach(x=>{const alias=assetOf(x.ref);if(alias)rows.push(...gcModel925(alias,{loading:false}).rows);});
   const tid=vms913TidOf(a),moves=tid?vms913MovedOff(tid):[];
   // An explicitly traced move retains the known number; it never adds an on-site unit.
   const tracedMoves=moves.filter(x=>text(x.asset)).map(x=>({item:'VMS',assetNo:x.asset,owner:'coates',basis:x.text}));
   return {...m,rows,tracedMoves};
  });}catch(e){out.identityError=true;}
  try{const a=Lighting894.audit(out.day),proof=Lighting894.confirmation;out.lighting={confirmed:!!(a.confirmed&&proof&&a.scope===proof.towers&&proof.on&&proof.words),scope:a.scope,groups:a.groups,on:proof?.on};}catch(e){}
  out.demob=demobEvidence(DATA.fencing||{});
  try{const d=drawingQuestionEvidence754(),sheets=[...new Set((DATA.docs?.docs||[]).filter(d=>String(d.project_no)==='26003'&&d.group==='issued').flatMap(d=>d.sheet_ids||[]).filter(id=>/^[DK]\d{3}-26003-\d{2}$/.test(id)))];out.drawings={confirmed:!!(d&&sheets.includes('D001-26003-03')),sheets};}catch(e){}
  out.basis={confirmed:!!(out.drawings?.confirmed&&DATA.schedule_review950?.sha256==='485f5d885b88d836b63e85ad4062474a95a484022386efec7be62429f958edac'&&DATA.charge_basis?.schema==='gc500-charge-basis-1'&&Array.isArray(ONHIRE_ROWS)&&ONHIRE_ROWS.length)};
  try{const card=(DATA.rate_match?.items||[]).find(r=>r.item==='Pee Panel'&&r.discipline==='Toilets & amenities'),p=labourPlan();out.labour={mapped:card?.labour_per_piece?.lines?.some(l=>l.key==='install'&&l.rate===145.74)&&card?.labour_source952?.row===22&&card.labour_source952.sha256==='60a62f37d9d91634ca617f3b2840809e64ebc1f000303857f1abb5e00691d7d6',unpriced:p.slots.filter(s=>s.value==null)};}catch(e){}
  try{out.ccb=allDockets().filter(d=>d.usable&&fenceCcbReview847(d).state==='pending').map(d=>{const measured=typeof fenceMeasuredCcb959==='function'?fenceMeasuredCcb959(d):null,classified=Number(d.quantities?.ccb_demarc||0)+Number(d.quantities?.ccb_event||0);return {number:d.docket_no,location:d.location,metres:measured?.quantityKnown?measured.quantity:classified>0?classified:null};});}catch(e){}
  return out;
 }
 function compact(pane){
  if(!pane)return;
  const fold=(node,key)=>{if(!node||node.parentElement?.dataset.qfold===key)return;const d=node.ownerDocument.createElement('details'),summary=node.ownerDocument.createElement('summary');d.className='qorig';d.dataset.qfold=key;summary.textContent='More info';node.before(d);d.append(summary,node);};
  pane.querySelectorAll('[data-question-id] > .qwhy').forEach(node=>fold(node,'evidence967:'+node.parentElement.dataset.questionId));
  const intro=pane.querySelector('.hubtitle')?.closest('.card');
  if(intro)fold(intro.querySelector(':scope > p.sub'),'intro967');
  fold(pane.querySelector('details[data-qfold="history"] > p.sub'),'history-intro967');
 }
 return {identities,history,project,context,demobEvidence,compact};
})();
if(typeof window!=='undefined'){
 window.Questions967=Questions967;
 answersOverview754Html=function(){return '<div class="notice" data-answers754><b>Questions reviewed · 09 Oct 2026</b></div>';};
 const renderBefore967=renderQuestions_held;renderQuestions_held=function(){const r=renderBefore967.apply(this,arguments);Questions967.compact(document.getElementById('pane-questions'));return r;};
 const historyBefore967=questionHistory753;questionHistory753=function(){return Questions967.history(historyBefore967.apply(this,arguments),Questions967.context());};
 const questionsBefore967=questionsList;questionsList=function(){return Questions967.project(questionsBefore967.apply(this,arguments),Questions967.context());};
}
if(typeof module!=='undefined'&&module.exports)module.exports=Questions967;
