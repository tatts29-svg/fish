/* Author: Andrew Fisher. Explicit native record addition, backed up before root executes.
   No assumed hours, employer, receipts, invoices or ledger postings. */
(function(root){'use strict';
const PERSON='Eric Lucian',PID='W-P-eric-lucian',DATE='2026-10-14',SID='W-L-eric-lucian-20261014',ACTOR='Andrew Fisher via Codex';
const NOTE='Added 14 Oct 2026 by Andrew Fisher: labour hire; home branch NOIS; charge branch KINP. Hourly pay rate matches Daniel Gough. Hours not supplied.';
const clone=x=>x==null?null:JSON.parse(JSON.stringify(x));
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const assert=(ok,msg)=>{if(!ok)throw Error('Eric roster stopped: '+msg);};
const invalidate=()=>{RENDER_MEMO.clear();if(ASSETS_HELD)HELD_STALE775=true;};
function docs(){return Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]));}
function capture(){
 invalidate();const daniel=ourRawOf('W-P-daniel-gough'),override=fin745Latest('rate','Daniel Gough');
 const rateIssues=override?[...fin745Conflicts('rate','Daniel Gough'),...fin745ValidateRecordEvent(override)]:[];
 const rate=override&&!rateIssues.length?override.payload.rate:override?null:runRateOf(daniel||{});
 const labourAllocation=fh866Model().costs.filter(r=>r.kind==='labour').map(r=>({stream:r.stream,by:r.by}));
 return {at:new Date().toISOString(),today:todayIso(),version:SYNC.backend.readVersion821(),state:clone(S),docs:clone(docs()),daniel:clone(daniel),override:clone(override),rateIssues,rate,
  person:clone(ourRawOf(PID)),personDeleted:tombedHere(PID),shift:clone(ourRawOf(SID)),shiftDeleted:tombedHere(SID),staff:clone(DailyStaff988.day(DATE)),labourAllocation};
}
function plan(snapshot){
 assert(snapshot.today===DATE,'Today is not 14 Oct 2026 AEST; review the requested date');
 assert(snapshot.daniel?.person==='Daniel Gough'&&runType(snapshot.daniel.type)==='hire','Daniel source identity or employment type changed');
 assert(!snapshot.rateIssues.length&&snapshot.rate===55.70,'Daniel approved hourly pay rate changed; review');
 assert(snapshot.labourAllocation.length&&snapshot.labourAllocation.every(r=>Object.keys(r.by||{}).every(k=>k==='KINP')),'native labour cost allocation is not KINP');
 assert(!snapshot.personDeleted&&!snapshot.shiftDeleted,'Eric has a deleted record; review before restoring');
 const actions=[],person=snapshot.person;
 if(person)assert(person.person===PERSON&&person.type==='External'&&person.branch==='NOIS'&&person.pay_rate===snapshot.rate,'Eric already exists with different details; review');
 else actions.push({kind:'person',fields:{type:'External',branch:'NOIS',pay_rate:snapshot.rate,note:NOTE}});
 if(!snapshot.shift)actions.push({kind:'shift',date:DATE,fields:{note:NOTE}});
 else assert(snapshot.shift.person===PERSON&&snapshot.shift.date===DATE,'Existing shift identity changed');
 const names=[...new Map(snapshot.staff.names.map(n=>[DailyStaff988.nameKey(n),n])).values()];
 const exists=names.some(n=>DailyStaff988.nameKey(n)===DailyStaff988.nameKey(PERSON));if(!exists)names.push(PERSON);
 const count=Math.max(names.length,snapshot.staff.count==null?names.length:snapshot.staff.count+(exists?0:1));
 if(!exists||count!==snapshot.staff.count)actions.push({kind:'availability',date:DATE,values:{count,names}});
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
   if(action.kind==='person')assert(setOurPerson(PERSON,action.fields)===true,'could not save person');
   if(action.kind==='shift')assert(runSetShift(PERSON,DATE,action.fields)===true,'could not save shift');
   if(action.kind==='availability'){const m=DailyStaff988.day(DATE),x=DailyStaff988.save(DATE,action.values,m.token);assert(x.kept===true,'could not save availability: '+x.reason);}
   invalidate();
  }
  const after=capture();assert(stable(after.daniel)===stable(before.daniel)&&stable(after.override)===stable(before.override),'Daniel source changed');
  assert(after.person.person===PERSON&&after.person.type==='External'&&after.person.branch==='NOIS'&&after.person.pay_rate===before.rate,'person details mismatch');
  assert(before.person||!after.person.employer,'employer was invented');
  assert(after.staff.names.filter(n=>DailyStaff988.nameKey(n)===DailyStaff988.nameKey(PERSON)).length===1,'Eric missing or duplicated');
  assert(before.staff.names.every(n=>after.staff.names.some(x=>DailyStaff988.nameKey(x)===DailyStaff988.nameKey(n))),'another staff name removed');
  if(before.shift)for(const field of ['start','finish','hours','break_min'])assert(stable(after.shift[field])===stable(before.shift[field]),'existing hours changed');
  else assert(['start','finish','hours','break_min'].every(k=>after.shift[k]==null||after.shift[k]===''),'hours were invented');
  const changes=diff(before.docs,after.docs),ids=new Set([PID,SID]),availability=DailyStaff988.key(DATE);
  assert(changes.every(c=>(c.collection==='costs'&&ids.has(c.key||c.id))||(c.collection==='loads'&&(c.key||c.id)===availability)||(['stamps','by'].includes(c.collection)&&([...ids].some(id=>(c.key||c.id)==='ourcost/'+id)))),'unexpected document change: '+JSON.stringify(changes.map(c=>({collection:c.collection,key:c.key,id:c.id}))));
  result={before,after,actions,changes,suppressedNativeSaves:suppressed,committed:false};
 }catch(error){S=clone(before.state);invalidate();throw error;}
 finally{save=nativeSave;bump=nativeBump;if(!config.commit||!result){S.operator=oldOp;if(whoBox)whoBox.value=oldWho;}}
 if(!config.commit){S=clone(before.state);invalidate();return result;}
 assert(nativeSave()!==false,'native save failed; inspect queues before retrying');
 result.nativeSaveSubmitted=true;result.requiresFreshReadback=true;result.previousOperator=oldOp;result.previousWhoInput=oldWho;return result;
}
root.EricNative1010={capture,plan,apply,DATE,PERSON,PID,SID};
})(window);
