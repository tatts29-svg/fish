// Author: Andrew Fisher. Isolated browser mutations; live-service writes are blocked by the shared harness.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {open}=require('../../toolchain/harness/open_page');
const pageFile=process.env.PAGE || '/workspace/private-wed7-bookings/v804_capability_candidate.html';
const out=process.env.OUT || path.dirname(__filename);
(async()=>{const h=await open({pageFile,W:1440,H:1000});try{
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:240000});
 const result=await h.page.evaluate(()=>{
  const checks=[],ck=(name,pass)=>checks.push({name,pass:!!pass});
  const backup={S:JSON.parse(JSON.stringify(S)),last:JSON.parse(JSON.stringify(SYNC.last)),queue:SYNC.queue,inflight:SYNC.inflight,status:SYNC.status,at:SYNC.at,readonly:SYNC.readonly,level:SYNC.level,unkept:SYNC.unkept,durableRecordWrites:SYNC.durableRecordWrites};
  const funcs={save,mayWrite,whoAmI,syncPush,syncSend,dirs782,bookingConflict801};
  const ack=(collection)=>{const docs=toDocs(collection);Object.entries(docs).forEach(([id,body])=>{delete SYNC.inflight[collection+'/'+id];syncSettled(collection,id,body,JSON.stringify(body));});SYNC.status='live';SYNC.at=Date.now();RENDER_MEMO.clear();};
  let sizes={loads:0,answers:0,encodedKeys:0};
  try{
   mayWrite=()=>true;whoAmI=()=> 'Practice reviewer';SYNC.readonly=false;SYNC.level='edit';SYNC.status='live';SYNC.durableRecordWrites=true;SYNC.at=Date.now();SYNC.queue={};SYNC.inflight={};syncPush=()=>syncStage();syncSend=()=>{};
   dirs782=()=>({ok:true,drop:true,dir:true,missing:[]});bookingConflict801=()=>'';
   const loads=dispatch803Context().loads,first=loads.find(l=>l.departure_order===1),second=loads.find(l=>l.departure_order===2),id=loadId(first),pairBefore=JSON.stringify(S.loads[id]);
   ck('Eleven known trucks have unique identities',loads.length===11&&new Set(loads.map(loadId)).size===11);
   const before=JSON.stringify(S.loads);ck('Out-of-order departure refused without mutation',!dispatch803Record(loadId(second),'depart')&&before===JSON.stringify(S.loads));
   ck('First cargo check appends one event',dispatch803Record(id,'check','cargo',true)&&dispatch803Events(id).length===1);
   ck('Pending event cannot satisfy readiness',dispatch803State(id).phase==='Hold'&&dispatch803Evidence(first).pending);
   ck('Immutable event does not alter native pairing record',JSON.stringify(S.loads[id])===pairBefore);ack('loads');
   ['pretransit','instructions'].forEach(f=>{dispatch803Record(id,'check',f,true);ack('loads');});
   ck('Three acknowledged current checks make first truck ready',dispatch803State(id).phase==='Ready');
   sequence803DurableVersion({version:9,durable_record_reads:false});ck('An older service capability keeps departure on Hold',!sequence803Connected()&&!dispatch803Record(id,'depart'));sequence803DurableVersion({version:9,durable_record_reads:true});ck('Explicit durable-service capability enables checked readiness',sequence803Connected());sequence803DurableVersion({version:9});ck('Unchanged-version rollback clears missing capability',!SYNC.durableRecordWrites&&!sequence803Connected());sequence803DurableVersion({version:9,durable_record_reads:true});
   const at=SYNC.at;SYNC.at=Date.now()-3600000;ck('Stale status-live snapshot cannot authorise departure',dispatch803State(id).phase==='Hold'&&!dispatch803Record(id,'depart'));SYNC.at=at;
   ck('Malformed checkbox and date records are refused as evidence',!dispatch803Checked({ok:'false',by:'Practice',at:'2026-10-07T01:00:00Z'})&&!sequence803Stamp({by:'Practice',at:'2026-02-31T01:00:00Z'}));
   dirs782=()=>({ok:false,drop:false,dir:true,missing:['no drop-off location']});ck('Missing directions hold a checked truck',dispatch803State(id).phase==='Hold');dirs782=()=>({ok:true,drop:true,dir:true,missing:[]});
   const saved=JSON.stringify(S.loads),nativeSet=Storage.prototype.setItem;
   try{Storage.prototype.setItem=function(){throw new DOMException('Practice quota failure','QuotaExceededError');};ck('Actual quota failure rolls back the proposed departure',!dispatch803Record(id,'depart')&&JSON.stringify(S.loads)===saved&&SYNC.unkept);}finally{Storage.prototype.setItem=nativeSet;}
   ck('Explicit safe-state retry clears recovered persistence failure',sequence803RetrySave()&&!SYNC.unkept);ack('loads');
   ck('Ready truck appends named actual departure',dispatch803Record(id,'depart')&&dispatch803State(id).record.departure.by==='Practice reviewer');
   ck('Unacknowledged departure remains pending for the next truck',dispatch803State(id).phase==='Departure saving'&&dispatch803State(loadId(second)).reasons.some(x=>x.includes('Earlier DD departures')));ack('loads');
   ck('Acknowledged departure satisfies predecessor gate',dispatch803State(id).phase==='Departed'&&!dispatch803State(loadId(second)).reasons.some(x=>x.includes('Earlier DD departures')));
   const one=dispatch803Events(id)[0],immutableBefore=JSON.stringify(S.loads[one.key]);ck('Existing immutable event cannot be overwritten',!sequence803Append('loads',one.key,{})&&JSON.stringify(S.loads[one.key])===immutableBefore);
   const shared=Object.fromEntries(Object.entries(SYNC.last.loads).map(([k,v])=>[k,JSON.parse(v)]));S.loads=fromDocs('loads',shared);RENDER_MEMO.clear();ck('Reload through native shared deserialization retains departure and checks',dispatch803State(id).phase==='Departed'&&dispatch803State(id).record.history.length===4);
   const complete=l=>{const k=loadId(l);DISPATCH803_CHECKS.forEach(c=>{dispatch803Record(k,'check',c.id,true);ack('loads');});dispatch803Record(k,'depart');ack('loads');};
   loads.filter(l=>l.departure_order>1&&l.departure_order<7).forEach(complete);
   const tanks=loads.filter(l=>l.departure_order===7),blocks=loads.filter(l=>l.departure_order===8);
   tanks.forEach(l=>DISPATCH803_CHECKS.forEach(c=>{dispatch803Record(loadId(l),'check',c.id,true);ack('loads');}));
   ck('Equal-ranked tanks may leave in either order',tanks.every(l=>dispatch803State(loadId(l)).phase==='Ready'));
   dispatch803Record(loadId(tanks[1]),'depart');ack('loads');ck('Eighth-ranked blocks wait for both seventh-ranked tanks',blocks.every(l=>dispatch803State(loadId(l)).reasons.some(x=>x.includes(tanks[0].dd))));
   dispatch803Record(loadId(tanks[0]),'depart');ack('loads');ck('Both tank departures release the predecessor gate for blocks',blocks.every(l=>!dispatch803State(loadId(l)).reasons.some(x=>x.includes('Earlier DD departures'))));
   const gen=loads.find(l=>l.refs.includes('GN18'));bookingConflict801=funcs.bookingConflict801;ck('Generator remains held for missing rank and asset conflict',dispatch803State(loadId(gen)).reasons.some(x=>x.includes('order has not been supplied'))&&dispatch803State(loadId(gen)).reasons.some(x=>x.includes('GN13')));
   const x=sequence803Requirement('pit-stairs','pit-stairs-1'),base=sequence803Key(x);
   ck('Fencing confirmation appends source-bound event',sequence803Record('pit-stairs','pit-stairs-1',true)&&sequence803RequirementState(x).entries.length===1);
   ck('Fencing pending event does not satisfy prerequisite',!sequence803RequirementState(x).confirmed&&sequence803RequirementState(x).pending);ack('answers');
   ck('Fencing native acknowledgement satisfies current source',sequence803RequirementState(x).confirmed);
   const a=sequence803RequirementState(x).entries[0];ck('Fencing value preserves full JSON within setter limit',a.raw.length<=600&&JSON.stringify(JSON.parse(a.raw))===a.raw);
   const fenceBefore=JSON.stringify(S.answers);try{Storage.prototype.setItem=function(){throw new DOMException('Practice quota failure','QuotaExceededError');};ck('Actual quota failure does not append fencing revocation',!sequence803Record('pit-stairs','pit-stairs-1',false)&&JSON.stringify(S.answers)===fenceBefore&&SYNC.unkept);}finally{Storage.prototype.setItem=nativeSet;}
   ck('Fencing safe-state retry restores a usable control',sequence803RetrySave()&&!SYNC.unkept);ack('answers');sequence803Record('pit-stairs','pit-stairs-1',false);ack('answers');
   const state=sequence803RequirementState(x);ck('Revocation preserves earlier confirmation and holds',state.entries.length===2&&!state.confirmed&&state.graph.heads.length===1&&!state.graph.heads[0].ok&&sequence803TaskChecks(x.row).includes('Revocation'));
   const delayed={...state.entries[0].parts.record,id:'a'.repeat(32),supersedes:[]},delayKey=base+':'+delayed.id;S.answers[delayKey]=JSON.stringify(delayed);ack('answers');ck('Late concurrent confirmation cannot erase unsuperseded revocation',sequence803RequirementState(x).entries.length===3&&!sequence803RequirementState(x).confirmed&&sequence803RequirementState(x).graph.heads.length===2);
   ck('Explicit reconfirmation supersedes every observed head',sequence803Record('pit-stairs','pit-stairs-1',true));ack('answers');ck('Reconfirmation becomes current while all history remains',sequence803RequirementState(x).confirmed&&sequence803RequirementState(x).entries.length===4);
   const Qbefore=Object.keys(S.answers);S.answers['practice-unrelated-answer']='A retained ordinary note';const Q=questionsList();ck('Owned events stay on fencing task; unrelated notes remain in Questions',!Q.some(q=>Qbefore.filter(k=>k.startsWith(base+':')).includes(q.noteId || q.id))&&Q.some(q=>(q.noteId || q.id)==='practice-unrelated-answer'));
   const forged={id:'b'.repeat(32),ok:true,by:'Practice',at:'2026-10-02T01:00:00Z',supersedes:['c'.repeat(32)]};ck('Missing causal parent fails closed',!sequence803EventGraph([forged]).valid&&!sequence803EventGraph([forged]).confirmed);
   const cyc=[{...forged,id:'b'.repeat(32),supersedes:['c'.repeat(32)]},{...forged,id:'c'.repeat(32),supersedes:['b'.repeat(32)]}];ck('Circular causal history fails closed',!sequence803EventGraph(cyc).valid);
   const oldAt=SYNC.at;SYNC.at=Date.now()-3600000;ck('Offline historical confirmation is labelled last-known and cannot satisfy hold',!sequence803RequirementState(x).confirmed&&sequence803Status(sequence803RequirementState(x),'hold').includes('Last known'));SYNC.at=oldAt;
   ck('No delivery or completed-fencing records changed',JSON.stringify(S.delivery)===JSON.stringify(backup.S.delivery)&&JSON.stringify(S.fenceDone)===JSON.stringify(backup.S.fenceDone)&&JSON.stringify(S.fenceDockets)===JSON.stringify(backup.S.fenceDockets));
   const loadDocs=Object.entries(S.loads).filter(([k,v])=>dispatch803OwnEvent(k,v)),answerDocs=Object.entries(S.answers).filter(([k,v])=>sequence803OwnAnswer(k,v));sizes={loads:Math.max(...loadDocs.map(([,v])=>new TextEncoder().encode(JSON.stringify(v)).length)),answers:Math.max(...answerDocs.map(([,v])=>v.length)),encodedKeys:Math.max(...loadDocs.concat(answerDocs).map(([k])=>docIdOf(k).length))};
   ck('All event documents stay within page and server size limits',sizes.loads<512*1024&&sizes.answers<=600&&sizes.encodedKeys<180);
   ck('Valid event filter leaves every native pairing intact',JSON.stringify(Object.fromEntries(Object.entries(S.loads).filter(([k,v])=>!dispatch803OwnEvent(k,v))))===JSON.stringify(backup.S.loads));
   mayWrite=()=>false;const roBefore=JSON.stringify(S.loads);ck('Direct append helper also respects view-only capability',!sequence803Append('loads','dispatch803:attempt:cargo:'+'d'.repeat(32),{})&&JSON.stringify(S.loads)===roBefore);
  }finally{Object.assign(window,funcs);S=backup.S;SYNC.last=backup.last;SYNC.queue=backup.queue;SYNC.inflight=backup.inflight;SYNC.status=backup.status;SYNC.at=backup.at;SYNC.readonly=backup.readonly;SYNC.level=backup.level;SYNC.unkept=backup.unkept;SYNC.durableRecordWrites=backup.durableRecordWrites;RENDER_MEMO.clear();}
  return {checks,sizes};

 });
 result.candidateSha256=crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex');result.errors=h.errors;result.requests=h.counts;fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'sequence803_tests.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(result.checks.some(x=>!x.pass)||h.errors.length||h.counts.blocked)process.exitCode=1;
}finally{await h.browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
