/* Author: Andrew Fisher. Real native fold/first-sync/export/import exercises; GET-only. */
const fs=require('fs'),{open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{const h=await open({pageFile:process.env.PAGE,W:1440,H:900});try{const p=h.page;await p.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:150000});
const result=await p.evaluate(()=>{
 const clone=x=>JSON.parse(JSON.stringify(x)),original=clone(S),json=JSON.stringify(S),checks=[];
 const saved={save,bump,mayWrite,whoAmI,flash,syncSend,syncRedraw,persist,sharedCache975};
 const sync={readonly:SYNC.readonly,pending:SYNC.pending,last:SYNC.last,first:SYNC.first,queue:SYNC.queue,ftimer:SYNC.ftimer};
 const cacheKey=Scope1017.key('WC09'),id=docIdOf('WC09');let invalidations=0;
 const check=(name,ok,detail)=>checks.push({name,pass:!!ok,...(!ok?{detail}: {})});
 const reset=()=>{S=clone(original);SYNC.pending={};SYNC.last={};SYNC.first=new Set(Object.keys(SYNC_COLLS));SYNC.queue={};SYNC.readonly=false;sharedCache975();};
 const read=()=>{sharedCache975();const a=assetOf('WC09');return toiletItem962(a,'FWF',deliveryOf('WC09'),todayIso());};
 const scope=()=>S.loads[cacheKey];const docs=()=>Object.fromEntries(['qtys','loads','stamps','by'].map(k=>[k,toDocs(k)]));
 const ts=n=>new Date(Date.now()+n).toISOString();
 try{
  save=()=>true;bump=()=>{sharedCache975();return true;};mayWrite=()=>true;whoAmI=()=> 'Andrew Fisher via Codex';flash=()=>{};syncSend=()=>{};syncRedraw=()=>{};persist=()=>true;
  sharedCache975=()=>{invalidations++;return saved.sharedCache975();};
  reset();setQty('WC09','6');S.stamps['qtys/WC09']=ts(-20000);const remote6=clone(S),remoteDocs=docs();
  reset();setQty('WC09','10');S.stamps['qtys/WC09']=ts(-10000);const local10=clone(S),localDocs=docs();
  const beforeDecode=JSON.stringify(S),decoded=fromDocs('qtys',remoteDocs.qtys);
  check('fromDocs decode never modifies local state',JSON.stringify(S)===beforeDecode);
  check('decoded native qty remains numeric with no enumerable metadata',JSON.stringify(decoded)===JSON.stringify(Object.fromEntries(Object.values(remoteDocs.qtys).map(d=>[d._k,d.v]))));
  SYNC_COLLS.qtys.set(decoded);check('native qty setter installs matching remote baseline',S.qtys.WC09===6&&scope().typed===6&&read().arrived===4);
  check('temporary decode metadata does not stay on native numeric map',Object.getOwnPropertySymbols(S.qtys).length===0);
  setQty('WC09','10');S.stamps['qtys/WC09']=ts(-10000);const afterRemoteThenLocal=clone(S);
  let merged=mergeRecords(S,remote6).merged;S=merged;check('local edit after remote decode retains its own cap on merge',S.qtys.WC09===10&&scope().typed===10&&read().arrived===4);
  for(const order of [['qtys','loads'],['loads','qtys']]){reset();for(const name of order)SYNC_COLLS[name].set(fromDocs(name,localDocs[name]));check('native apply order '+order.join(' then ')+' retains actuals',S.qtys.WC09===10&&scope().typed===10&&read().arrived===4);}
  S=clone(local10);SYNC.pending=clone(remoteDocs);SYNC.first=new Set();syncFirst();
  check('real first sync preserves newer offline quantity and baseline',S.qtys.WC09===10&&scope().typed===10&&read().arrived===4&&read().done===4,{qty:S.qtys.WC09,scope:scope()?.typed,actual:read()});
  check('first sync does not turn private baseline into a load document',!Object.values(toDocs('loads')).some(r=>r.kind===Scope1017.kind));
  const newerRemote=clone(remote6);newerRemote.stamps['qtys/WC09']=ts(-5000);
  S=clone(local10);let a=mergeRecords(S,newerRemote),b=mergeRecords(newerRemote,S);
  check('merge direction produces same baseline winner',JSON.stringify(a.merged.loads[cacheKey])===JSON.stringify(b.merged.loads[cacheKey]));
  S=a.merged;check('newer remote quantity keeps remote cap',S.qtys.WC09===6&&scope().typed===6&&read().arrived===4);
  const legacy=clone(newerRemote);legacy.qtys.WC09=12;legacy.stamps['qtys/WC09']=ts(-1000);delete legacy.loads[cacheKey];
  S=mergeRecords(local10,legacy).merged;check('legacy quantity without metadata cannot discard known actual cap',S.qtys.WC09===12&&scope().typed===12&&read().arrived===4&&scope().at===local10.loads[cacheKey].at);
  reset();SYNC_COLLS.qtys.set(fromDocs('qtys',remoteDocs.qtys));const same=clone(remoteDocs.qtys);same[id].scope1017.items[0].received=3;same[id].scope1017.items[0].installed=3;same[id].scope1017.items[0].receipts=same[id].scope1017.items[0].receipts.map((r,i)=>({...r,quantity:i?0:3}));
  const beforeInvalidations=invalidations;const changed=syncFold('qtys',same);
  check('same numeric quantity with changed metadata triggers native update',changed===true&&invalidations>beforeInvalidations&&read().arrived===3,{changed,invalidations,actual:read()});
  check('same complete document is a true no-op',syncFold('qtys',same)===false);
  S=clone(local10);SYNC.readonly=false;SYNC.queue={qtys:{[id]:clone(localDocs.qtys[id])}};syncFold('qtys',remoteDocs.qtys);
  check('queued local quantity+baseline stays atomic through stale snapshot',S.qtys.WC09===10&&scope().typed===10&&read().arrived===4);
  SYNC.queue={};SYNC_COLLS.loads.set(fromDocs('loads',remoteDocs.loads));check('unrelated loads refresh preserves receipt cap',scope().typed===10&&read().arrived===4);
  const reload=clone(S);S=reload;check('local JSON reload retains receipt cap',read().arrived===4&&scope().typed===10);
  const exported=exportRecord(),normal=recordsFrom(exported),envelope=clone(exported);delete envelope.records;
  check('normal export/import retains protected actual scope',normal.loads[cacheKey]?.typed===10);
  check('legacy export envelope also carries local baseline',recordsFrom(envelope).loads[cacheKey]?.typed===10);
  const clean=clone(original);S=mergeRecords(clean,normal).merged;check('native merge import keeps actual4 at planned10',S.qtys.WC09===10&&read().arrived===4&&read().done===4);
  reset();setQty('WC09','6');setQty('WC09','');const clearedDocs=docs();
  check('clearing override keeps baseline on v:null native doc',clearedDocs.qtys[id].v===null&&clearedDocs.qtys[id].scope1017.typed===null&&read().arrived===4);
  reset();for(const name of ['qtys','loads'])SYNC_COLLS[name].set(fromDocs(name,clearedDocs[name]));check('cleared override cold reload preserves original completed quantity',S.qtys.WC09==null&&scope().typed===null&&read().quantity===4&&read().arrived===4&&read().done===4);
  setQty('WC09','10');check('increase after cleared override still cannot invent receipt',read().quantity===10&&read().arrived===4&&read().done===4);
  const noMetadata=toDocs('qtys');delete noMetadata[id].scope1017;syncFold('qtys',noMetadata);check('legacy same-quantity refresh retains known baseline',read().arrived===4&&scope().typed===10);
  check('mixed-item baseline persists with its own quantities',scope().items.find(r=>r.item==='Pee Panel').received===6&&scope().items.find(r=>r.item==='Toilet Block 6m').received===2);
 }finally{S=clone(original);Object.assign(window,saved);Object.assign(SYNC,sync);saved.sharedCache975();}
 check('full native state restored exactly',JSON.stringify(S)===json);
 return {author:'Andrew Fisher',checks};
});result.errors=h.errors;result.requests=h.counts;result.checks.push({name:'No script errors or operational non-GET attempts',pass:!h.errors.length&&!h.counts.blocked});fs.writeFileSync(process.env.OUT,JSON.stringify(result,null,2));console.log(JSON.stringify({checks:result.checks.length,failures:result.checks.filter(x=>!x.pass),errors:h.errors,requests:h.counts}));if(result.checks.some(x=>!x.pass))process.exitCode=1;
}finally{await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exit(1)});
