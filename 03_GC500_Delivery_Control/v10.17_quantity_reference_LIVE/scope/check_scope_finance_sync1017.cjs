/* Author: Andrew Fisher. Independent financial cache/native sync and sequential receipt checks; service GET-only. */
'use strict';
const fs=require('fs'),{open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#costs'});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&photoIndex().state==='ready'&&Refresh904.report().state==='ready',null,{timeout:180000});
 const out=await h.page.evaluate(()=>{
  const clone=x=>JSON.parse(JSON.stringify(x)),original=clone(S),checks=[],cases=[],saved=JSON.stringify(S);
  const old={save,bump,mayWrite,whoAmI,flash,syncSend,syncRedraw,persist},sync={readonly:SYNC.readonly,queue:SYNC.queue,last:SYNC.last};
  const key=Scope1017.key('WC09'),id=docIdOf('WC09'),cent=n=>Math.round((n+Number.EPSILON)*100),eq=(a,b)=>cent(a)===cent(b);
  const reset=()=>{S=clone(original);SYNC.readonly=false;SYNC.queue={};SYNC.last={};sharedCache975();};
  const check=(name,ok,detail)=>checks.push({name,pass:!!ok,...(!ok?{detail}:{})});
  const read=()=>holdAssets(()=>{const a=assetOf('WC09'),r=ItemIdentity979.select('WC09','FWF',ONHIRE_ROWS,gcModel925(a).rows)[0];return clone({scope:Scope1017.read(a,'FWF',deliveryOf(a.key),todayIso()),charge:contractCharge(r),planned:ScopeFinance1017.model(),owner:finance928ContractOwner(r),record:Scope1017.record(a)});});
  const future=()=>new Date(Date.now()+1000).toISOString();
  try{
   save=()=>{sharedCache975();return true;};bump=()=>save();mayWrite=()=>true;whoAmI=()=> 'Andrew Fisher via Codex';flash=()=>{};syncSend=()=>{};syncRedraw=()=>{};persist=()=>true;
   reset();setQty('WC09','10');const baseline=read(),unit=baseline.charge.forecast/10,meta=clone(S.loads[key].items[0].financial1017),qtydocs=toDocs('qtys');
   SYNC_COLLS.qtys.set(fromDocs('qtys',qtydocs));sharedCache975();check('native qty document preserves financial ownership and manual-work metadata',JSON.stringify(read().record.items[0].financial1017)===JSON.stringify(meta));
   S=clone(S);sharedCache975();check('local JSON reload preserves financial metadata and owner',JSON.stringify(read().record.items[0].financial1017)===JSON.stringify(meta)&&read().owner.owner===baseline.owner.owner);
   const exported=recordsFrom(exportRecord());S=mergeRecords(clone(original),exported).merged;sharedCache975();check('normal export/import preserves received hire and financial metadata',read().scope.arrived===4&&eq(read().charge.amount,baseline.charge.amount)&&JSON.stringify(read().record.items[0].financial1017)===JSON.stringify(meta));
   const changed=clone(qtydocs);changed[id].scope1017.items[0].received=3;changed[id].scope1017.items[0].installed=3;changed[id].scope1017.items[0].receipts=changed[id].scope1017.items[0].receipts.map((r,i)=>({...r,quantity:i?0:3}));
   holdAssets(()=>{const before=read();const folded=syncFold('qtys',changed),after=read();cases.push({metadataBefore:before,metadataAfter:after});check('same numeric qty metadata sync invalidates an already-held finance cache',folded&&before.scope.arrived===4&&after.scope.arrived===3&&eq(after.charge.amount,3*unit),after);check('metadata sync changes forecast exactly once',eq(after.planned.total,after.charge.forecast-after.charge.amount),after.planned);check('repeat identical metadata snapshot is a no-op',syncFold('qtys',changed)===false&&eq(read().charge.amount,after.charge.amount));});
   for(const order of [['supplied','stamps'],['stamps','supplied']]){
    reset();setQty('WC09','10');const pre=clone(S),preRead=read();setSupplied('WC09','FWF',{qty_supplied:6});S.stamps['supplied/WC09/FWF']=future();const incoming={supplied:toDocs('supplied'),stamps:toDocs('stamps')};S=pre;sharedCache975();
    holdAssets(()=>{const held=read();syncFold(order[0],incoming[order[0]]);const partial=read();syncFold(order[1],incoming[order[1]]);const after=read();cases.push({order,held,partial,after});check('receipt sync '+order.join(' then ')+' never promotes above confirmed six',partial.scope.arrived<=6&&after.scope.arrived===6,after.scope);check('receipt sync '+order.join(' then ')+' immediately refreshes actual and forecast',eq(after.charge.amount,6*unit)&&eq(after.planned.total,4*unit)&&eq(after.charge.forecast,preRead.charge.forecast),after);check('receipt sync '+order.join(' then ')+' retains old installed scope',after.scope.done===4);});
   }
   reset();setQty('WC09','6');const first=read();setSupplied('WC09','FWF',{qty_supplied:6});S.stamps['supplied/WC09/FWF']=future();sharedCache975();const received=read();setQty('WC09','10');const replanned=read();cases.push({first,received,replanned});
   check('new receipt followed by new scope edit retains six actual receipts',received.scope.arrived===6&&replanned.scope.arrived===6,replanned);
   check('new receipt followed by scope edit retains actual charge and forecasts only four',eq(received.charge.amount,replanned.charge.amount)&&eq(replanned.planned.total,4*unit),replanned);
   check('new receipt followed by scope edit keeps only four installed',replanned.scope.done===4,replanned.scope);
   const renewed=toDocs('qtys');SYNC_COLLS.qtys.set(fromDocs('qtys',renewed));SYNC_COLLS.loads.set(fromDocs('loads',toDocs('loads')));S=clone(S);sharedCache975();const restored=read();check('replanned received six survives native roundtrip and local reload',restored.scope.arrived===6&&eq(restored.charge.amount,replanned.charge.amount),restored);
  }finally{S=clone(original);Object.assign(window,old);Object.assign(SYNC,sync);sharedCache975();}
  check('native state restored exactly',JSON.stringify(S)===saved);return {author:'Andrew Fisher',checks,cases};
 });out.errors=h.errors;out.requests=h.counts;out.checks.push({name:'no browser errors or operational write attempts',pass:!h.errors.length&&!h.counts.blocked});fs.writeFileSync(process.env.OUT,JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({checks:out.checks.length,failures:out.checks.filter(x=>!x.pass).map(x=>x.name),errors:h.errors,requests:h.counts}));if(out.checks.some(x=>!x.pass))process.exitCode=1;
 }finally{if(h)await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
