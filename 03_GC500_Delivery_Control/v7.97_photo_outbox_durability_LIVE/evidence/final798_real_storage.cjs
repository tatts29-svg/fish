/* Author: Andrew Fisher. Independent browser storage review.
 * Exact candidate photo/save/sync functions; native IndexedDB, localStorage, Blob, crypto and Web Locks.
 * Synthetic bytes; all file/document transports are local in-process mocks. Every external request is blocked.
 * PAGE=... PRIVATE_OUT=... node final798_real_storage.cjs [result.json]
 */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const {chromium,devices}=require('playwright');
const root=path.resolve(__dirname,'../..'),candidate=process.env.PAGE||path.join(root,'build/GC500_v7.98/GC500_Delivery_Control_hosted.html');
const html=fs.readFileSync(candidate,'utf8'),moduleSource=fs.readFileSync(path.join(__dirname,'../photo797_src.js'),'utf8');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function take(a,b){const i=html.indexOf(a),j=html.indexOf(b,i);assert(i>=0&&j>i,'source '+a);return html.slice(i,j);}
const chunks=moduleSource.split(/\/\* PHOTO797: \w+ \*\/\n/).slice(1);
chunks.forEach((s,i)=>assert(html.includes(s.trim()),'candidate contains exact photo source chunk '+i));
const sources=[take('function stampIt(field, key, who){','/* who last set a stamped field'),take('let PERSISTED_JSON = null;','/* Let go of the damaged copy'),take('function save775Inner(){','/* A deletion is a record too.'),'function save(){return save775Inner();}',take('function bump(){','/* ------------------------------------------------------------------ tabs'),take('function photoLinksOf(key){','/* the old whole-list writers'),take('function dropPhotoSlots(key, unit, opts){','/* the groups a reference'),take('function docIdOf(key){','function fromDocs(name, docs){'),take('function syncPush(){','function syncWaiting(){'),take('async function photoOutboxAll(){','/* the entry waiting to go'),moduleSource];
const output=process.argv[2]||path.join(__dirname,'final798_real_storage.json');
const R={author:'Andrew Fisher',candidateSha256:sha(html),photoSourceSha256:sha(moduleSource),nativeStorage:true,transport:'In-process synthetic file/doc mocks; no network; all non-GET blocked',checks:[],errors:[],network:{documents:0,blocked:0}};
const save=()=>fs.writeFileSync(output,JSON.stringify(R,null,2)+'\n');
function check(name,yes,detail){R.checks.push({name,pass:!!yes,...detail===undefined?{}:{detail}});save();assert(yes,name);}
const bootstrap=`
const STORE='gc500.review797.synthetic.record';
let S=JSON.parse(localStorage.getItem(STORE)||'{"photoLinks":{},"stamps":{},"by":{},"operator":"Synthetic review"}');
const SYNC={on:true,db:{},backend:{},readonly:false,first:new Set(['photoLinks']),last:{photoLinks:{}},queue:{},inflight:{},unkept:false};
const SYNC_COLLS={photoLinks:{kind:'map',get:()=>S.photoLinks}};
const messages=[]; const state={}; let DAMAGED=null;
const PHOTO_OUTBOX=new Map(),PHOTO_SENDING=new Set();let PHOTO_RETRY=null,PHOTO_RETRY_N=0,PHOTO_BOOTED=false;
const DOCS={state:'ready',files:{}};const DROP_SLOTS=[{lab:'Photo 1'},{lab:'Photo 2'}],DROP_MAX=2;
const flash=s=>messages.push(s),render=()=>{},renderTabs=()=>{},syncFooter=()=>{},folderWrite=()=>{},damagedBanner=()=>{},$=()=>null;
const docsRefresh=()=>{},photoDrawerRedraw=()=>{},uploadPreviewNote=()=>'',unitKey=v=>String(v||'');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const syncError=e=>messages.push('mock sync error '+e.message),syncRetry=()=>{};
const dropShrink=async f=>({blob:f,shrunk:false}),dropPhotoName=()=> 'synthetic-new-photo.jpg';
function photoRetryLater(){PHOTO_RETRY=1;}
`+sources.join('\n')+`
Object.assign(globalThis,{SYNC,photoOutboxForget});
SYNC.db.doc=id=>({set:body=>__transport797({op:'doc',id,body}),delete:()=>__transport797({op:'deleteDoc',id})});
SYNC.backend={upload:async file=>__transport797({op:'upload',name:file.name,type:file.type,bytes:Array.from(new Uint8Array(await file.arrayBuffer()))}),files:()=>__transport797({op:'files'})};
const nativePut=IDBObjectStore.prototype.put,nativeDelete=IDBObjectStore.prototype.delete;
globalThis.faults797={putAt:0,putCount:0,abortDelete:false};
IDBObjectStore.prototype.put=function(...args){const rq=nativePut.apply(this,args);faults797.putCount++;if(faults797.putAt===faults797.putCount)this.transaction.abort();return rq;};
IDBObjectStore.prototype.delete=function(...args){const rq=nativeDelete.apply(this,args);if(faults797.abortDelete)this.transaction.abort();return rq;};
globalThis.test797={messages,queue:async options=>{const e={id:'synthetic-queued-photo.jpg',key:'TEST',slot:0,unit:'',type:'image/jpeg',blob:new Blob(['Synthetic photograph bytes for persistence review'],{type:'image/jpeg'}),at:'2026-10-02T01:00:00Z',queued:'2026-10-02T01:00:00Z',by:'Synthetic review',caption:'',...options};if(!await photoOutboxPut(e))throw Error('queue refused');return e.id;},
 send:async id=>photoSend(PHOTO_OUTBOX.get(id)||{id},s=>messages.push(s)),
 load:async()=>{const es=await photoOutboxAll();es.forEach(e=>PHOTO_OUTBOX.set(e.id,e));return es.length;},
 stored:async id=>{const e=await photoIdb('readonly',st=>st.get(id));return e?{id:e.id,uploaded:e.uploaded||null,attempted:e.uploadAttempted||false,blobIsNative:e.blob instanceof Blob,bytes:e.blob.size,linkPlan:e.linkPlan||null}:null;},
 state:()=>JSON.parse(JSON.stringify(S)),ack:()=>{syncSend();},
 settled:()=>Object.keys(SYNC.inflight).length===0&&Object.values(SYNC.queue).every(q=>Object.keys(q).length===0),
 draw:id=>{const e=PHOTO_OUTBOX.get(id);document.getElementById('fixture').innerHTML=e?photoSendingCell(e,'Photo 1',true):'<p>Queue completed after acknowledgement.</p>';}};
`;
const fixture='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Synthetic photo storage review</title><style>body{font:16px Arial;margin:24px;max-width:480px;background:#f8f8f6;color:#232c31}.dph{padding:20px;border:1px solid #adb5ba;border-radius:8px;background:white}.dphslot{font-size:12px;margin-bottom:16px}.dphhint{line-height:1.5}.btn{padding:9px 14px;margin-right:8px}small{display:block;margin:20px 0}</style><h1>Photo queue verification</h1><small>Synthetic test data · original pending-photo component · Author: Andrew Fisher</small><main id="fixture"></main>';
let browser;
async function rig(mobile=false){
 const disk={files:[],remote:{},uploads:0,sets:0,holdUpload:false,uploadWaiters:[],holdDocs:true,docWaiters:[],lostAck:false,docReject:false};
 const ctx=await browser.newContext({...mobile?{...devices['iPhone 13'],viewport:{width:390,height:844},deviceScaleFactor:1}:{viewport:{width:1440,height:900}},locale:'en-AU'});
 await ctx.route('**/*',r=>{if(r.request().method()==='GET'&&r.request().url()==='https://gc500-storage-review.test/'){R.network.documents++;return r.fulfill({status:200,contentType:'text/html',body:fixture});}R.network.blocked++;return r.abort();});
 await ctx.exposeBinding('__transport797',async(_,q)=>{
  if(q.op==='files')return {files:structuredClone(disk.files)};
  if(q.op==='upload') {disk.uploads++;if(disk.holdUpload)await new Promise(res=>disk.uploadWaiters.push(res));const row={id:'synthetic-opaque-'+disk.uploads,name:q.name,sha256:sha(Buffer.from(q.bytes)),kind:'drop-photo'};disk.files.push(row);if(disk.lostAck)throw Error('synthetic response lost');return row;}
  if(q.op==='doc'){disk.sets++;if(disk.holdDocs)await new Promise(res=>disk.docWaiters.push(res));if(disk.docReject)throw Error('synthetic document rejection');disk.remote[q.id.split('/')[1]]=structuredClone(q.body);return;}
  if(q.op==='deleteDoc'){delete disk.remote[q.id.split('/')[1]];return;}
  throw Error('Unknown mock operation');
 });
 await ctx.addInitScript(bootstrap);
 async function page(){const p=await ctx.newPage();p.on('pageerror',e=>R.errors.push(e.message));await p.goto('https://gc500-storage-review.test/');await p.evaluate(remote=>{SYNC.last.photoLinks=Object.fromEntries(Object.entries(remote).map(([k,v])=>[k,JSON.stringify(v)]));},disk.remote);return p;}
 const p=await page();
 async function ack(pg=p){disk.holdDocs=false;disk.docWaiters.splice(0).forEach(f=>f());await pg.evaluate(()=>test797.ack());await pg.waitForFunction(()=>test797.settled(),null,{timeout:10000});}
 return {ctx,p,disk,page,ack,close:()=>ctx.close()};
}
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--lang=en-AU']});
 R.browserVersion=browser.version();
 for(const mobile of [false,true]){
  const mode=mobile?'phone':'desktop';const r=await rig(mobile),p=r.p;
  const capabilities=await p.evaluate(()=>({secure:isSecureContext,idb:typeof indexedDB.open==='function',local:typeof localStorage.setItem==='function',locks:typeof navigator.locks?.request==='function',crypto:!!crypto.subtle,blob:typeof Blob.prototype.arrayBuffer==='function'}));check(mode+' native capabilities',Object.values(capabilities).every(Boolean),capabilities);
  const id=await p.evaluate(()=>test797.queue());check(mode+' send remains pending before doc ack',await p.evaluate(id=>test797.send(id),id)===false);
  const receipt=await p.evaluate(id=>test797.stored(id),id);check(mode+' real IDB retains native blob and opaque receipt',receipt&&receipt.blobIsNative&&receipt.uploaded?.id==='synthetic-opaque-1'&&!!receipt.linkPlan&&r.disk.uploads===1,receipt);
  check(mode+' no premature saved message',!(await p.evaluate(()=>test797.messages)).some(x=>x.includes('saved against')));
  await p.evaluate(id=>test797.draw(id),id);if(process.env.PRIVATE_OUT){fs.mkdirSync(process.env.PRIVATE_OUT,{recursive:true});await p.screenshot({path:path.join(process.env.PRIVATE_OUT,mode+'-photo-pending.png')});}
  await p.reload();await p.evaluate(()=>test797.load());check(mode+' reload retains actual IDB receipt',!!(await p.evaluate(id=>test797.stored(id),id))?.uploaded);
  await p.evaluate(id=>test797.send(id),id);await r.ack();check(mode+' reload completes without reupload',await p.evaluate(id=>test797.send(id),id)===true&&r.disk.uploads===1&&await p.evaluate(id=>test797.stored(id),id)===null,{uploads:r.disk.uploads,docWrites:r.disk.sets});
  check(mode+' confirmed message follows ack',(await p.evaluate(()=>test797.messages)).some(x=>x.includes('shared record has confirmed')));
  await r.close();
 }
 {
  const r=await rig(),p=r.p,id=await p.evaluate(()=>test797.queue());
  const quota=await p.evaluate(()=>{let n=0,last='';for(const size of [65536,1024,1]){const v='x'.repeat(size);while(n<10000){try{localStorage.setItem('review-quota-'+n,v);n++;}catch(e){last=e.name;break;}}}return {keys:n,exception:last};});
  check('native localStorage quota actually reached',quota.exception==='QuotaExceededError',quota);
  check('quota refuses reference save but retains real IDB receipt',await p.evaluate(id=>test797.send(id),id)===false&&!!(await p.evaluate(id=>test797.stored(id),id)).uploaded&&r.disk.uploads===1&&r.disk.sets===0);
  check('quota feedback never claims saved',(await p.evaluate(()=>test797.messages)).some(x=>x.includes('could not be saved in this browser')));
  await p.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('review-quota-')).forEach(k=>localStorage.removeItem(k)));
  await p.evaluate(id=>test797.send(id),id);await r.ack();check('freeing native storage recovers without reupload',await p.evaluate(id=>test797.send(id),id)===true&&r.disk.uploads===1);await r.close();
 }
 {
  const r=await rig(),p=r.p,id=await p.evaluate(()=>test797.queue());await p.evaluate(()=>faults797.abortDelete=true);
  const gone=await p.evaluate(id=>photoOutboxForget(id,s=>test797.messages.push(s)),id);
  check('aborted real IDB Forget reports still queued',gone===false&&!!await p.evaluate(id=>test797.stored(id),id)&&(await p.evaluate(()=>test797.messages)).at(-1).includes('cancellation has not completed'));
  await p.evaluate(()=>faults797.abortDelete=false);check('successful Forget deletes durable record',await p.evaluate(id=>photoOutboxForget(id,s=>test797.messages.push(s)),id)===true&&await p.evaluate(id=>test797.stored(id),id)===null);
  check('stale caller after Forget cannot upload',await p.evaluate(id=>test797.send(id),id)===false&&r.disk.uploads===0);await r.close();
 }
 {
  const r=await rig(),p=r.p,id=await p.evaluate(()=>test797.queue());await p.evaluate(()=>faults797.putAt=4);
  check('real IDB receipt transaction abort retains attempt',await p.evaluate(id=>test797.send(id),id)===false&&(await p.evaluate(id=>test797.stored(id),id)).attempted&&!(await p.evaluate(id=>test797.stored(id),id)).uploaded&&r.disk.uploads===1);
  await p.reload();await p.evaluate(()=>test797.load());await p.evaluate(id=>test797.send(id),id);await r.ack();check('reload after receipt abort reconciles name plus SHA without upload',await p.evaluate(id=>test797.send(id),id)===true&&r.disk.uploads===1);await r.close();
 }
 {
  const r=await rig(),p=r.p,id=await p.evaluate(()=>test797.queue());r.disk.lostAck=true;
  check('lost synthetic upload response remains pending',await p.evaluate(id=>test797.send(id),id)===false&&r.disk.uploads===1);
  await p.reload();await p.evaluate(()=>test797.load());r.disk.lostAck=false;await p.evaluate(id=>test797.send(id),id);await r.ack();check('reload lost-response recovery uses checksum match',await p.evaluate(id=>test797.send(id),id)===true&&r.disk.uploads===1);await r.close();
 }
 {
  const r=await rig(),p=r.p,id=await p.evaluate(()=>test797.queue()),p2=await r.page();await p2.evaluate(()=>test797.load());r.disk.holdUpload=true;
  const pending=p.evaluate(id=>test797.send(id),id);while(!r.disk.uploadWaiters.length)await new Promise(res=>setTimeout(res,10));
  const second=await p2.evaluate(id=>test797.send(id),id),forget=await p2.evaluate(id=>photoOutboxForget(id,s=>test797.messages.push(s)),id);
  const locks=await p2.evaluate(()=>navigator.locks.query());check('native Web Lock excludes second-tab send and Forget',second===false&&forget===false&&r.disk.uploads===1&&locks.held.some(l=>l.name==='gc500.photo.'+id),locks);
  r.disk.holdUpload=false;r.disk.uploadWaiters.splice(0).forEach(f=>f());await pending;await r.ack();await p.evaluate(id=>test797.send(id),id);
  check('stale second-tab retry rereads deleted IDB record',await p2.evaluate(id=>test797.send(id),id)===false&&r.disk.uploads===1&&await p2.evaluate(id=>test797.stored(id),id)===null);await r.close();
 }
 check('no browser exceptions',R.errors.length===0,R.errors);check('no external network attempted',R.network.blocked===0,R.network);R.passed=true;save();console.log(JSON.stringify({passed:R.checks.length,candidateSha256:R.candidateSha256,network:R.network}));
})().catch(e=>{R.fatal=e.stack;save();console.error(e.stack);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();});
