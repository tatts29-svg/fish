/* Author: Andrew Fisher. Explicitly invoked native roster correction; no API writes and no invented hours.
   Backup capture() output outside Git, practice with commit:false, then root may execute commit:true.
   Fresh backend readback after submit is mandatory. */
(function(root){'use strict';
const PERSON='Kyle Gover',PID='W-P-kyle-gover',ACTOR='Andrew Fisher via Codex';
const BUILD=['2026-10-12','2026-10-13','2026-10-14','2026-10-15','2026-10-16','2026-10-19','2026-10-20','2026-10-21','2026-10-22'];
const NIGHTS=['2026-10-23','2026-10-24','2026-10-25'];
const ALL=BUILD.concat(NIGHTS),NIGHT_NOTE='Night shift confirmed by Andrew Fisher, 13 Oct 2026.';
const BUILD_NOTE='Returned 12 Oct 2026; available for the remaining build weekdays. Confirmed by Andrew Fisher, 13 Oct 2026.';
const clone=x=>JSON.parse(JSON.stringify(x));
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const assert=(ok,msg)=>{if(!ok)throw Error('Kyle roster stopped: '+msg);};
const invalidate=()=>{RENDER_MEMO.clear();if(ASSETS_HELD)HELD_STALE775=true;};
const shiftId=d=>'W-L-kyle-gover-'+d.replace(/-/g,'');
function docs(){return Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]));}
function capture(){invalidate();return {at:new Date().toISOString(),version:SYNC.backend.readVersion821(),state:clone(S),docs:clone(docs()),person:clone(ourRawOf(PID)),days:ALL.map(date=>({date,raw:clone(ourRawOf(shiftId(date))),deleted:tombedHere(shiftId(date)),staff:clone(DailyStaff988.day(date))}))};}
function plan(snapshot){
 assert(snapshot.person?.id===PID&&snapshot.person.person===PERSON,'existing person identity changed');
 assert(snapshot.person.branch==='KINP'&&snapshot.person.employer==='JOB CONNECT','existing branch or employer changed; review');
 const actions=[];
 for(const row of snapshot.days){
  if(BUILD.includes(row.date)){
   actions.push({kind:'shift',date:row.date,fields:{note:[row.raw?.note,BUILD_NOTE].filter((x,i,a)=>x&&a.indexOf(x)===i&&!String(x).includes('Race-only return assumed')).join(' ').slice(0,240)}});
  }else{
   const r=row.raw;
   if(r&&!row.deleted&&!String(r.note||'').startsWith(NIGHT_NOTE))assert(r.from==='tracker'&&r.start==='06:30'&&r.finish==='17:00'&&r.hours===10.5,'race shift was edited since the old daytime assumption; review '+row.date);
   actions.push({kind:'shift',date:row.date,fields:String(r?.note||'').startsWith(NIGHT_NOTE)?{note:r.note}:{start:'',finish:'',hours:'',break_min:'',note:NIGHT_NOTE+' Start, finish and paid hours have not been supplied.'}});
  }
  const names=[...new Map(row.staff.names.map(n=>[DailyStaff988.nameKey(n),n])).values()];
  const exists=names.some(n=>DailyStaff988.nameKey(n)===DailyStaff988.nameKey(PERSON));if(!exists)names.push(PERSON);
  const count=Math.max(names.length,row.staff.count==null?names.length:row.staff.count+(exists?0:1));
  actions.push({kind:'availability',date:row.date,values:{count,names}});
 }
 const original=String(snapshot.person.note||'');
 actions.push({kind:'person',fields:{note:original.replace('Race-only return assumed; confirm.','Returned 12 Oct 2026. Build weekdays through 22 Oct; race night shifts 23–25 Oct confirmed.').slice(0,240)}});
 return actions;
}
function diff(a,b){const changes=[];for(const coll of new Set([...Object.keys(a),...Object.keys(b)]))for(const id of new Set([...Object.keys(a[coll]||{}),...Object.keys(b[coll]||{})])){const old=a[coll]?.[id]??null,now=b[coll]?.[id]??null;if(stable(old)!==stable(now))changes.push({collection:coll,id,key:(now||old)?._k,before:old,after:now});}return changes;}
function apply(config){
 assert(config?.backupConfirmed===true&&config.expected,'private backup must be captured first');assert(typeof config.commit==='boolean','explicit commit boolean required');
 assert(SYNC.status==='live'&&SYNC.on&&SYNC.db&&!SYNC.readonly,'native edit link must be live');
 assert(Object.keys(SYNC_COLLS).every(k=>SYNC.first.has(k)),'shared record still loading');
 assert(Object.values(SYNC.queue).every(v=>!Object.keys(v||{}).length)&&!Object.keys(SYNC.inflight).length,'pending changes exist');
 const before=capture();assert(String(before.version)===String(config.expected.version)&&stable(before.docs)===stable(config.expected.docs),'native record changed since backup');
 const actions=plan(before),nativeSave=save,nativeBump=bump,oldOp=S.operator,whoBox=document.querySelector('#who'),oldWho=whoBox?.value;
 let result,suppressed=0;
 try{
  save=function(){suppressed++;invalidate();return true;};bump=function(){save();bump.kept=true;};S.operator=ACTOR;if(whoBox)whoBox.value=ACTOR;
  for(const action of actions){
   if(action.kind==='shift'){const existing=ourRawOf(shiftId(action.date)),saved=NIGHTS.includes(action.date)&&existing&&!tombedHere(shiftId(action.date))?setOurCost(shiftId(action.date),action.fields):runSetShift(PERSON,action.date,action.fields);assert(saved===true,'could not save shift '+action.date);}
   if(action.kind==='availability'){const m=DailyStaff988.day(action.date),x=DailyStaff988.save(action.date,action.values,m.token);assert(x.kept===true,'could not save availability '+action.date+': '+x.reason);}
   if(action.kind==='person')assert(setOurPerson(PERSON,action.fields)===true,'could not update person note');
   invalidate();
  }
  const after=capture();
  assert(after.person.pay_rate===before.person.pay_rate&&after.person.branch===before.person.branch&&after.person.employer===before.person.employer,'pay rate, branch or employer changed');
  for(const row of after.days){
   assert(row.staff.names.filter(n=>DailyStaff988.nameKey(n)===DailyStaff988.nameKey(PERSON)).length===1,'Kyle missing or duplicated '+row.date);
   const old=before.days.find(x=>x.date===row.date);
   assert(old.staff.names.every(n=>row.staff.names.some(x=>DailyStaff988.nameKey(x)===DailyStaff988.nameKey(n))),'another person removed '+row.date);
   if(BUILD.includes(row.date)&&old.raw&&!old.deleted)for(const field of ['start','finish','hours','break_min'])assert(stable(row.raw[field])===stable(old.raw[field]),'recorded hours changed '+row.date);
   if(NIGHTS.includes(row.date))assert(row.raw.note.startsWith(NIGHT_NOTE),'night confirmation missing');
  }
  const changes=diff(before.docs,after.docs),ids=new Set([PID,...ALL.map(shiftId)]),availability=new Set(ALL.map(d=>DailyStaff988.key(d)));
  assert(changes.every(c=>(c.collection==='costs'&&ids.has(c.key||c.id))||(c.collection==='loads'&&availability.has(c.key||c.id))||(['stamps','by'].includes(c.collection)&&([...ids].some(id=>(c.key||c.id)==='ourcost/'+id||(c.key||c.id)==='deleted/'+id||(c.key||c.id)==='deleted/back/'+id)))||(c.collection==='deleted'&&(ids.has(c.key||c.id)||[...ids].some(id=>(c.key||c.id)==='back/'+id)))),'unexpected document change: '+JSON.stringify(changes.map(c=>({collection:c.collection,key:c.key,id:c.id}))));
  result={before,after,actions,changes,suppressedNativeSaves:suppressed,committed:false};
 }catch(error){S=clone(before.state);invalidate();throw error;}
 finally{save=nativeSave;bump=nativeBump;if(!config.commit||!result){S.operator=oldOp;if(whoBox)whoBox.value=oldWho;}}
 if(!config.commit){S=clone(before.state);invalidate();return result;}
 assert(nativeSave()!==false,'native save failed; inspect queues before retrying');
 result.nativeSaveSubmitted=true;result.requiresFreshReadback=true;result.previousOperator=oldOp;result.previousWhoInput=oldWho;return result;
}
root.KyleNative1006={capture,plan,apply,BUILD,NIGHTS,PERSON};
})(window);
