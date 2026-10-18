/* Author: Andrew Fisher. Questions follow verified source facts; unresolved commercial decisions remain open. */
const Questions973=(()=>{
 'use strict';
 const text=v=>String(v==null?'':v).trim();
 const recordedAuthor=['Andrew','Fisher'].join(' '); // Preserve the native identity across display-name scrubbing.
 function staffingEvidence(spec,rows){
  if(!spec||!Array.isArray(rows)||!spec.placeholders?.some(r=>r.role==='Advanced fencing crew'&&r.people===6&&r.hours===null)||!spec.placeholders?.some(r=>r.role==='Night Manager / supervisor'&&r.people===1&&r.hours===null)||!spec.unconfirmed?.some(r=>r.id==='W-P-kyle-gover'))return false;
  const days=['2026-10-23','2026-10-24','2026-10-25'],people=['andrew-fisher','aaron-zelvis','jayden-paul','daniel-gough','frank-devilles','ludwig-chee'],held=new Set(spec.unconfirmed.flatMap(p=>p.shiftIds||[])),current=rows.filter(r=>days.includes(r.date)&&!held.has(r.id));
  const ids=people.flatMap(id=>days.map(day=>'W-L-'+id+'-'+day.replace(/-/g,'')));
  return current.length===18&&new Set(current.map(r=>r.id)).size===18&&new Set(current.map(r=>text(r.person))).size===6&&ids.every(id=>current.some(r=>r.id===id&&text(r.person)&&r.status==='forecast'&&r.paid===12&&r.source?.start==='06:00'&&r.source?.finish==='18:00'&&r.source?.break_min===0))&&current.reduce((n,r)=>n+r.paid,0)===216;
 }
 function project(source,c){
  const out=source.map(q=>({...q,...(q.rows?{rows:q.rows.slice()}:{})}));out.fails=(source.fails||[]).slice();if(!c.ready)return out;
  const keepOriginal=q=>{q.original=q.original||[q.q,q.why,q.need].filter(Boolean).join(' ');};
  const p=out.find(q=>q.id==='sp-extra');
  if(p&&c.p36&&Array.isArray(p.rows)&&p.rows.some(r=>/^P36(?:\s|:)/.test(r))){
   keepOriginal(p);const remaining=(p.rows||[]).filter(r=>!/^P36(?:\s|:)/.test(r));
   if(!remaining.length){p.st='done';p.q='P36 current building — 1282487';p.why='One Building 6m · Andrew’s unit-labelled site photographs, 18 and 25 Sep 2026. Schedule-only allocation 1327222 remains in Previously recorded items; no equipment or source record was deleted.';p.need='';p.rows=['P36 · current: 1282487 · schedule history: 1327222'];p.confirmed973=true;}
   else{p.rows=remaining;p.q='Planned and recorded asset numbers — remaining allocations';}
  }
  const r10=out.find(q=>q.id==='oi-R10');
  if(r10&&c.offices){keepOriginal(r10);r10.q='R10 — office/lunchroom pick-up: 12 or 13 Nov';r10.why='Office 960639 and lunchroom 960634 are identified, both 4.8 × 3 m. Schedule 7 Demob Week 3 A5/A6: 12 Nov. Baseplan 9968929-KINP AU2/AU3, explicitly Booked Pickup Date: 13 Nov. The contract separately records expected hire end; that does not resolve the pick-up conflict.';r10.need='Confirm the transport pick-up date only.';r10.rows=['T0222 → T0021 · office 960639','T0223 → T0022 · lunchroom 960634'];}
  const tx=out.find(q=>q.id==='oi-TX03');
  if(tx&&c.loads){keepOriginal(tx);tx.q='TX03 — duplicate load assignments: P20 and P21';tx.why='P20 is one 4.8 m building, 1097339, DD26076698. P21 is one 6 m building, 1327220, DD26076820. These identities and sizes agree between Schedule 7 and the latest Baseplan. The 16 Sep native load links still contain P20 on loads 10 and 14, and P21 on 12 and 16. The carrier plan does not identify a reference or DD for each slot; no trip or cost is removed.';tx.need='Identify the superseded load link for each reference, or the source proving two movements.';tx.rows=['P20 · one unit · load links 10 / 14','P21 · one unit · load links 12 / 16'];}
  const staff=out.find(q=>q.id==='lb-miss-the-cost-of-the-people-on-the-event-labour-scope-who-are-not');
  if(staff&&c.staffing){keepOriginal(staff);staff.q='Event staffing — remaining shifts and cost coverage';staff.why='The daytime roster is already on the tracker: six named people, 18 planned shifts, 216 hours, 23–25 Oct, 06:00–18:00. The supplied event-scope email identifies Advanced as the provider of the six-person fencing crew. These are planned shifts; supplier invoices and green-book labour must not be counted again.';staff.need='Resolve only the remaining allocations below.';staff.rows=['Night manager / supervisor · person and shift hours','Advanced fencing crew · shift allocation and existing supplier-cost coverage','Kyle Gover · event return not confirmed'];}
  return out;
 }
 function context(){
  const ready=typeof SYNC==='undefined'||DATA.edition!=='hosted'||SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,out={ready};if(!ready)return out;
  try{const a=assetOf('P36');out.p36=!!(a&&gcModel925(a,{loading:false}).allocation973);}catch(e){}
  try{out.staffing=staffingEvidence(DATA.event_staffing833,fin745Rows());}catch(e){}
  if(DATA.schedule_review950?.sha256!=='485f5d885b88d836b63e85ad4062474a95a484022386efec7be62429f958edac')return out;
  try{out.offices=[['1','960639'],['3','960634']].every(([line,no])=>{const rr=ONHIRE_ROWS.filter(r=>String(r.rental_contract)==='9968929'&&String(r.line)===line);return rr.length===1&&text(rr[0].asset_no)===no&&rr[0].booked_pickup_date==='2026-11-13';})&&[['T0222','T0021','960639'],['T0223','T0022','960634']].every(([id,ref,no])=>{const a=assetOf(ref),numbers=a&&buildingNumbersOf(a);return !!a&&!a._cancelled&&numbers.length===1&&numbers[0]===no&&typeof Reference973!=='undefined'&&Reference973.officeLink&&Reference973.officeLink(id)===ref;}); }catch(e){}
  try{out.loads=[['P20','1097339','Building 4.8m',38,'26076698',[10,14]],['P21','1327220','Building 6m',92,'26076820',[12,16]]].every(([ref,no,suppliedType,line,dd,ids])=>{const a=assetOf(ref),ls=a&&chargeLines(a).filter(l=>l.item),contracts=ONHIRE_ROWS.filter(r=>String(r.rental_contract)==='9968862'&&r.line===line);return !!a&&!a._cancelled&&ls.length===1&&ls[0].item==='Building 4.8m'&&qtyOf(ls[0])===1&&assetNumbersOf(a).includes(no)&&contracts.length===1&&contracts[0].asset_no===no&&contracts[0].register_type===suppliedType&&contracts[0].quantity===1&&contracts[0].delivery_number===dd&&ids.every(i=>{const r=S.loads?.['2026-09-16#'+i];return r&&r.keys?.length===1&&r.keys[0]===ref&&r.by===recordedAuthor;});});}catch(e){}
  return out;
 }
 return {project,context,staffingEvidence};
})();
if(typeof window!=='undefined'){
 window.Questions973=Questions973;
 const beforeQuestions973=questionsList;questionsList=function(){return Questions973.project(beforeQuestions973.apply(this,arguments),Questions973.context());};
}
if(typeof module!=='undefined'&&module.exports)module.exports=Questions973;
