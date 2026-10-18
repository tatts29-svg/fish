/* Author: Andrew Fisher. Execute the page's native REST and collection-hydration source against controlled transport. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.argv[2],'utf8'),baseline=process.argv.includes('--baseline');
const part=(a,b)=>{const start=html.indexOf(a);assert(start>=0,a);const end=html.indexOf(b,start+a.length);assert(end>start,b);return html.slice(start,end);};
const code=[
 html.includes('window.patient1066=function')?part('window.patient1066=function','\n</script>'):'',
 part('function applyRemote(name, snap){','/* Author: Andrew Fisher. Native hydration'),
 part('function syncFold(name, docs){','/* redraw after remote changes'),
 part(html.includes('function syncApplied1066()')?'function syncApplied1066()':'function syncStart(db){','/* ------------------------------------------------------------------ the hosted record'),
 part('function restBackend(){','/* the hosted page reaches its capabilities')
].join('\n');
let checks=0;const check=(x,message)=>{assert.ok(x,message);checks++;};
const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
function fixture({loading=true,level='edit'}={}){
 const events={},timers=[],requests=[],footers=[];
 const server={version:1,docs:{qtys:{one:{quantity:3}},loads:{one:{kind:'fixture'}}}},hooks={attach:0,merge:0,failAttach:0,sets:0};
 const document={readyState:loading?'loading':'complete',visibilityState:'visible',body:{classList:{toggle(){}}},addEventListener(name,fn){(events[name]??=[]).push(fn);}};
 const SYNC={on:false,backend:null,readonly:false,level:'unknown',status:'file',unsub:[],first:new Set(),pending:{},queue:{},inflight:{},last:{},errors:0};
 const ctx=vm.createContext({document,addEventListener(){},performance:{now:()=>0},location:{pathname:'/e/fixture-key'},localStorage:{getItem(){return '';},setItem(){}},DATA:{edition:'hosted'},SYNC,S:{qtys:{},loads:{}},Set,Map,WeakMap,Date,Promise,URL,console,
  setTimeout(fn,delay){timers.push({fn,delay,active:true});return timers.length;},clearTimeout(id){if(timers[id-1])timers[id-1].active=false;},setInterval(){return 1;},clearInterval(){},
  syncFooter(){footers.push({status:SYNC.status,first:SYNC.first.size});},applyCapability(){},docsRedraw(){},docsRecovery1016(){},reportsPoll(){},liveMapKeyFromService:()=>Promise.resolve(),$(){return null;},syncWaiting:()=>0,syncSend(){},photoOutboxBoot(){},sharedCache975(){},persist(){},syncRedraw(){},clashDialog(){},syncError(){},
  syncStop(reason){SYNC.on=false;SYNC.status=reason;},
  fromDocs(name,docs){return structuredClone(docs);},toDocs(name){return structuredClone(ctx.S[name]||{});},
  mergeRecords(mine,theirs){hooks.merge++;return {merged:{...mine,...theirs},report:{clashes:[]}};},
  fetch:async(url,options)=>{requests.push({url,method:options?.method||'GET'});if(url==='/api/state'&&server.blockState)await server.blockState;const data=url==='/api/version'?{version:server.version,level}:url==='/api/state'?{version:server.version,docs:structuredClone(server.docs)}:url.startsWith('/api/doc/')?{version:server.version}:{};return {ok:true,status:200,json:async()=>data};}
 });
 ctx.window=ctx;
 ctx.SYNC_COLLS=Object.fromEntries(['qtys','loads'].map(name=>[name,{get:()=>ctx.S[name],set:v=>{hooks.sets++;ctx.S[name]=v;}}]));
 vm.runInContext(code,ctx);
 const install=()=>{ctx.ScopeSync1017={same:()=>true,attach(record){hooks.attach++;if(hooks.failAttach){hooks.failAttach--;throw Error('fixture callback failure');}return record;}};};
 const ready=()=>{install();document.readyState='interactive';for(const fn of events.DOMContentLoaded||[])fn();document.readyState='complete';};
 const backend=ctx.restBackend();SYNC.backend=backend;ctx.syncStart(backend);
 return {ctx,SYNC,server,hooks,requests,footers,document,events,timers,backend,ready,install};
}
(async()=>{
 if(baseline){
  const f=fixture(),p=f.backend.pull(true);await flush();await p;
  check(f.SYNC.first.size===0&&f.SYNC.status==='live','baseline consumes the snapshot and claims live despite an absent scope hook');
  check(f.backend.readVersion821()===1,'baseline advances its cursor before failed callbacks');
  f.ready();await f.backend.pull(false);
  check(f.SYNC.first.size===0&&f.requests.filter(r=>r.url==='/api/state').length===1,'baseline unchanged-version poll cannot recover after source initialises');
  console.log(JSON.stringify({author:'Andrew Fisher',baseline_counterexample:true,checks}));return;
 }
 {
  const f=fixture(),p=f.backend.pull(true);await flush();
  check(f.requests.some(r=>r.url==='/api/state'),'record GET starts while the rest of the HTML is still loading');
  check(f.SYNC.first.size===0&&f.hooks.merge===0&&f.SYNC.status!=='live','early snapshot is not applied or claimed live before extensions initialise');
  check(f.backend.readVersion821()===-1,'unapplied read does not advance the committed cursor');
  check(f.backend.redeliver()===false&&f.SYNC.first.size===0,'early explicit redelivery cannot invent an empty first record');
  f.ready();await p;
  check(f.hooks.attach===1&&f.hooks.merge===1,'the delayed snapshot uses the native scope hook and merge exactly once');
  check(f.ctx.S.qtys.one.quantity===3&&f.SYNC.first.size===2&&Object.keys(f.SYNC.pending).length===0,'all native first snapshots are applied and pending is cleared');
  check(f.SYNC.status==='live'&&f.backend.readVersion821()===1,'live and committed version follow successful hydration');
  check(f.footers.filter(x=>x.status==='live').every(x=>x.first===2),'no intermediate callback announces a partially hydrated record as live');
  await f.backend.pull(false);check(f.requests.filter(r=>r.url==='/api/state').length===1,'unchanged successfully applied version retains the efficient short path');
  check(f.requests.every(r=>r.method==='GET'),'hydration fixture sends no record writes');
 }
 {
  const f=fixture({loading:false});f.install();f.hooks.failAttach=1;
  await f.backend.pull(true);
  check(f.SYNC.status!=='live'&&f.SYNC.first.size===0&&f.backend.readVersion821()===-1,'a native callback exception leaves hydration and read cursor uncommitted');
  await f.backend.pull(false);
  check(f.SYNC.status==='live'&&f.SYNC.first.size===2&&f.requests.filter(r=>r.url==='/api/state').length===2,'the same server version is fetched and applied again after callback failure');
  let bad=true;const off=f.backend.collection('late').onSnapshot(()=>{if(bad)throw Error('late callback failed');});
  for(const t of f.timers)if(t.active&&t.delay===0){t.active=false;t.fn();}
  check(f.SYNC.status!=='live','late subscriber failure is not silently ignored');
  const before=f.requests.filter(r=>r.url==='/api/state').length;bad=false;off();await f.backend.pull(false);
  check(f.SYNC.status==='live'&&f.requests.filter(r=>r.url==='/api/state').length===before+1,'late listener failure forces retry even when the committed server version is unchanged');
 }
 {
  const f=fixture({level:'view'}),p=f.backend.pull(true);await flush();
  check(f.SYNC.readonly&&f.SYNC.first.size===0&&f.hooks.sets===0&&f.SYNC.status!=='live','view-link snapshots also wait for all extension setters');
  f.ready();await p;
  check(f.SYNC.first.size===2&&f.SYNC.status==='live'&&f.hooks.merge===0&&f.hooks.sets===2,'view-link native replacement path remains distinct from edit merge');
  check(f.ctx.S.qtys.one.quantity===3&&f.requests.every(r=>r.method==='GET'),'view link receives the exact incoming quantity without writes');
 }
 {
  const f=fixture({loading:false});f.install();await f.backend.pull(true);
  f.SYNC.status='unreachable';f.server.version=2;f.server.docs.qtys.one.quantity=4;
  let release;f.server.blockState=new Promise(resolve=>{release=resolve;});
  const p=f.backend.pull(false);await flush();
  check(f.SYNC.status!=='live'&&f.backend.readVersion821()===1&&f.ctx.S.qtys.one.quantity===3,'recovery cannot claim the newer server version before its snapshot is applied');
  release();await p;
  check(f.SYNC.status==='live'&&f.backend.readVersion821()===2&&f.ctx.S.qtys.one.quantity===4,'recovery becomes live only after the newer snapshot is successfully folded');
 }
 {
  const f=fixture(),p=f.backend.pull(true);await flush();f.ctx.syncStop('revoked');f.ready();await p;
  check(f.SYNC.status==='revoked'&&f.SYNC.first.size===0&&f.hooks.merge===0,'revocation during source readiness prevents deferred application');
 }
 {
  const f=fixture(),p=f.backend.pull(true);await flush();f.server.version=2;await f.backend.doc('qtys/one').set({quantity:4});f.ready();await p;
  check(f.SYNC.first.size===0&&f.hooks.merge===0&&f.backend.readVersion821()===-1,'readiness wait rechecks the acknowledged-write watermark and discards the older snapshot');
  f.server.docs.qtys.one.quantity=4;await f.backend.pull(false);
  check(f.SYNC.status==='live'&&f.ctx.S.qtys.one.quantity===4&&f.backend.readVersion821()===2,'next poll hydrates the current snapshot after an older delayed read is discarded');
 }
 console.log(JSON.stringify({author:'Andrew Fisher',checks,passed:true,native_source:true}));
})().catch(e=>{console.error(e);process.exitCode=1;});
