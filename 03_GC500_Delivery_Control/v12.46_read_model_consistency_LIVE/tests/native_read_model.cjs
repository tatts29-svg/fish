/* Author: Andrew Fisher. Portable read-only native gate; actual fixtures stay private.
 * BASE/PAGE compare one frozen STATE. MATCH_FIXTURE supplies expected associations.
 * HTTP writes are denied by the shared harness; OUT must be outside this repository.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
const read=()=>holdAssets(()=>{
 const start=performance.now();RENDER_MEMO.clear();HELD_MEMO.clear();
 const assets=allAssets(),refs=assets.map(a=>{
  const units=gcUnits925(a,{loading:false}),source=gcModel925(a,{loading:false}),remaining=Departure1211.remainingModel(a,source);
  return {key:a.key,units,associations:units.map(u=>({id:u.id,event:Departure1211.unit(a.key,u.id,undefined,u.item)||null})),
   remainingIds:remaining.rows.filter(u=>u.physical).map(u=>u.id),sourceIds:source.rows.filter(u=>u.physical).map(u=>u.id),
   status:Departure1211.status(a.key),reading:Departure1211.read(a.key)};
 });
 const M=moneySummary(),P=pl770Model(),LP=labourPlan();
 const docs=Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]));
 return JSON.parse(JSON.stringify({refs,referenceAggregates:Departure1211.all(),boards:VmsEquipment1103.model(),
  money:{summary:M,ledger:P,branch:branchFinancial978(pl752Rows(),M),ticks:pl760Ticks(),labour:labourRevenue858(),
   plan:{all:LP.all,slots:LP.slots,byBranch:[...LP.byBranch],byLine:[...LP.byLine]},service:servicing748(),supplier:supplierService1068(),scope:scopeFigures()},
  contracts:ONHIRE_ROWS,docs,queue:{inflight:Object.keys(SYNC.inflight||{}).length,queued:Object.values(SYNC.queue||{}).reduce((n,q)=>n+Object.keys(q).length,0)},
  footer:document.getElementById('footL')?.textContent,evaluationMs:performance.now()-start}));
});
async function screenshot(s,match,output,index){
 await s.page.setViewportSize({width:390,height:844});
 await s.page.evaluate(ref=>openAsset(ref),match.ref);
 await s.page.waitForFunction(id=>[...document.querySelectorAll('[data-unit925-id]')].some(e=>e.getAttribute('data-unit925-id')===id&&e.querySelector('.departure1211-unit')),match.id,{timeout:30000});
 const shown=await s.page.evaluate(id=>{
  const row=[...document.querySelectorAll('[data-unit925-id]')].find(e=>e.getAttribute('data-unit925-id')===id);
  if(!row)throw Error('Changed unit card did not render');
  for(let p=row;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;
  const label=row.querySelector('.departure1211-unit');
  if(!label)throw Error('Changed departure label did not render');
  label.scrollIntoView({block:'center',behavior:'instant'});
  const rect=label.getBoundingClientRect();
  return {text:label.textContent||'',visible:rect.width>0&&rect.top>=180&&rect.bottom<=innerHeight,rect:{top:rect.top,bottom:rect.bottom}};
 },match.id);
 await s.page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await s.page.screenshot({path:path.join(output,'read-model46-unit-'+index+'-phone.png')});
 assert(shown.visible&&/LEFT SITE/.test(shown.text),'Changed unit must display the existing departure on phone');
 return shown;
}
async function main(){
 assert(process.env.BASE&&process.env.PAGE&&process.env.STATE&&process.env.OUT&&process.env.MATCH_FIXTURE,'BASE, PAGE, STATE, private OUT and MATCH_FIXTURE required');
 const output=path.resolve(process.env.OUT),repo=path.resolve(__dirname,'../../..');
 assert(output!==repo&&!output.startsWith(repo+path.sep),'Native evidence must remain outside the repository');
 const matches=JSON.parse(fs.readFileSync(process.env.MATCH_FIXTURE,'utf8')).matches;
 assert(Array.isArray(matches)&&matches.length,'Private fixture must identify at least one expected association');
 matches.forEach(m=>assert(m.ref&&m.id&&m.owner&&m.number&&m.item&&m.eventId&&Number.isSafeInteger(m.expectedRemaining),'Complete private association fixture required'));
 fs.mkdirSync(output,{recursive:true});
 const candidate=process.env.PAGE,result={author:'Andrew Fisher'};
 for(const [key,page]of[['base',process.env.BASE],['candidate',candidate]]){
  process.env.PAGE=page;process.env.INITIAL_HASH='#today';const s=await openCandidate();
  try{
   result[key]=await s.page.evaluate(read);result[key].baseline=s.baseline;
   if(key==='candidate'){
    result.phone=[];for(let i=0;i<matches.length;i++)result.phone.push(await screenshot(s,matches[i],output,i+1));
   }
   result[key].afterUi=await s.page.evaluate(()=>({docs:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),inflight:Object.keys(SYNC.inflight||{}).length,queued:Object.values(SYNC.queue||{}).reduce((n,q)=>n+Object.keys(q).length,0)}));
   result[key].errors=s.errors;result[key].consoleErrors=s.consoleErrors;result[key].writeAttempts=s.counts.blocked;
   fs.writeFileSync(path.join(output,'read-model-native.json'),JSON.stringify(result,null,2)+'\n');
  }finally{await s.browser.close();}
 }
 const b=result.base,a=result.candidate;let checks=0;
 const same=(name,x,y)=>{assert.deepEqual(x,y,name);checks++;};
 const unchanged=(name,x,y)=>same(name,digest(x),digest(y));
 for(const [key,v]of[['base',b],['candidate',a]]){
  same(key+' runtime errors',v.errors,[]);same(key+' console errors',v.consoleErrors,[]);same(key+' HTTP write attempts',v.writeAttempts,0);
  same(key+' native record loaded exactly',v.baseline.docsMatch,true);same(key+' queued/inflight writes',v.queue,{inflight:0,queued:0});
  same(key+' UI queued/inflight writes',[v.afterUi.inflight,v.afterUi.queued],[0,0]);unchanged(key+' UI did not change documents',v.docs,v.afterUi.docs);
 }
 same('same frozen record version',a.baseline.version,b.baseline.version);same('same frozen record SHA',a.baseline.stateSha256,b.baseline.stateSha256);
 for(const key of ['money','contracts','docs','referenceAggregates','boards'])unchanged(key+' unchanged',a[key],b[key]);
 const expected=new Map(matches.map(m=>[JSON.stringify([m.ref,m.id]),m]));
 same('expected associations unique',expected.size,matches.length);
 same('same reference set',a.refs.map(r=>r.key),b.refs.map(r=>r.key));
 result.changes=[];
 for(const before of b.refs){
  const after=a.refs.find(r=>r.key===before.key);
  for(const key of ['units','sourceIds','status','reading'])unchanged('reference '+key+' preserved',after[key],before[key]);
  const recovered=[];
  for(const old of before.associations){
   const now=after.associations.find(u=>u.id===old.id),match=expected.get(JSON.stringify([before.key,old.id]));
   assert(now,'Existing unit must remain available');
   if(!match){unchanged('unrelated unit association preserved',now,old);continue;}
   same('expected association was missing on base',old.event,null);
   const units=after.units.filter(u=>u.id===match.id);same('canonical native unit is unique',units.length,1);
   const u=units[0];same('actual native metadata present',[u.ref,u.owner,u.assetNo,u.item,u.source,u.physical,u.slot],[match.ref,match.owner,match.number,match.item,'native',true,false]);
   assert(typeof u.nativeId==='string'&&u.nativeId,'Actual native ID must be present, never synthesized');checks++;
   same('expected original event recovered',now.event?.id,match.eventId);
   const event=after.reading.events.find(e=>e.id===match.eventId);unchanged('original event returned intact',now.event,event);
   same('expected remaining physical count',after.remainingIds.length,match.expectedRemaining);
   same('recovered unit excluded from remaining model',after.remainingIds.includes(match.id),false);
   if(Number.isSafeInteger(match.expectedSourceUnits))same('expected source physical count',after.sourceIds.length,match.expectedSourceUnits);
   recovered.push(match.id);result.changes.push({ref:match.ref,id:match.id,eventId:now.event.id,remainingBefore:before.remainingIds.length,remainingAfter:after.remainingIds.length,native:u});
  }
  same('remaining model changes only expected associations',after.remainingIds,before.remainingIds.filter(id=>!recovered.includes(id)));
 }
 same('all expected associations checked',result.changes.length,matches.length);
 result.validation={ok:true,checks};fs.writeFileSync(path.join(output,'read-model-native.json'),JSON.stringify(result,null,2)+'\n');
 console.log(checks+' native read-model preservation and recovery checks PASS');
}
module.exports={screenshot};
if(require.main===module)main().catch(error=>{console.error('FAIL native read-model gate: '+error.stack);process.exitCode=1;});
