/* Author: Andrew Fisher. Exact-source photo and sync regressions; all storage,
 * file and document transports are CPU mocks. No network or live writes.
 * node photo797_checks.cjs BASE_HTML [OUTPUT_JSON]
 */
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const base=process.argv[2];if(!base)throw Error('Give the immutable baseline HTML');
const html=fs.readFileSync(base,'utf8'),moduleSource=fs.readFileSync(path.join(__dirname,'photo797_src.js'),'utf8');
function take(a,b){const i=html.indexOf(a),j=html.indexOf(b,i);assert(i>=0&&j>i,'fixture source '+a);return html.slice(i,j);}
const copy=x=>structuredClone(x),flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
const results=[];function check(name,detail){results.push({name,pass:true,...(detail?{detail}:{})});}
function shared(){return {idb:new Map(),local:new Map(),remote:new Map(),files:[],uploads:0,sets:0,locks:new Set()};}
function rig(disk=shared()){
 const switches={putFail:false,deleteFail:false,localFail:false,docFail:false,uploadFail:false,lostAck:false,indexFail:false,failPutAt:0,putCount:0,holdUpload:null},messages=[],timers=[];
 const S=JSON.parse(disk.local.get('record')||'{"photoLinks":{},"stamps":{},"by":{},"operator":"Test operator"}');
 const SYNC={on:true,db:{},backend:{},readonly:false,first:new Set(['photoLinks']),last:{photoLinks:Object.fromEntries([...disk.remote].map(([id,b])=>[id,JSON.stringify(b)]))},queue:{},inflight:{},unkept:false};
 class TestFile extends Blob{constructor(chunks,name,o){super(chunks,o);this.name=name;}}
 const context=vm.createContext({console,Blob,File:TestFile,Uint8Array,crypto:crypto.webcrypto,structuredClone,STORE:'record',S,SYNC,
  localStorage:{getItem:k=>disk.local.get(k)||null,setItem(k,v){if(switches.localFail)throw Error('quota');disk.local.set(k,v);}},
  navigator:{locks:{async request(id,options,fn){if(disk.locks.has(id))return fn(null);disk.locks.add(id);try{return await fn({name:id});}finally{disk.locks.delete(id);}}}},
  document:{body:{classList:{add(){},remove(){}}},addEventListener(){},visibilityState:'visible'},window:{addEventListener(){}},
  setTimeout(fn){timers.push(fn);return timers.length;},clearTimeout(){},setInterval(){},
  flash:s=>messages.push(s),render(){},renderTabs(){},syncFooter(){},folderWrite(){},damagedBanner(){},$:()=>null,state:{},DAMAGED:null,
  PHOTO_OUTBOX:new Map(),PHOTO_SENDING:new Set(),PHOTO_RETRY:null,PHOTO_RETRY_N:0,PHOTO_BOOTED:false,DOCS:{state:'ready',files:{}},DROP_SLOTS:[{lab:'Photo 1'},{lab:'Photo 2'}],DROP_MAX:2,
  docsRefresh(){},photoDrawerRedraw(){},uploadPreviewNote:()=>'',unitKey:v=>String(v||''),esc:v=>String(v||''),
  syncError:e=>messages.push('sync error '+e.message),syncRetry(){},
  dropShrink:async f=>({blob:f,shrunk:false}),dropPhotoName:()=> 'new-photo.jpg'});
 context.SYNC_COLLS={photoLinks:{kind:'map',get:()=>context.S.photoLinks}};
 vm.runInContext(take('function stampIt(field, key, who){','/* who last set a stamped field')+
  take('let PERSISTED_JSON = null;','/* Let go of the damaged copy')+
  take('function save775Inner(){','/* A deletion is a record too.')+'\nfunction save(){return save775Inner();}\n'+
  take('function bump(){','/* ------------------------------------------------------------------ tabs')+
  take('function photoLinksOf(key){','/* the old whole-list writers')+
  take('function dropPhotoSlots(key, unit, opts){','/* the groups a reference')+
  take('function docIdOf(key){','function fromDocs(name, docs){')+
  take('function syncPush(){','function syncWaiting(){')+
  take('async function photoOutboxAll(){','/* the entry waiting to go')+
  'function photoRetryLater(){PHOTO_RETRY=1;}\n'+moduleSource+
  '\nglobalThis.getOutbox=()=>PHOTO_OUTBOX;globalThis.getSource=()=>S;globalThis.setSource=x=>S=x;globalThis.peekRemoved=()=>PHOTO_REMOVED797;\n',context);
 // Replace only the transport adapter: the production persistence helpers,
 // photo logic, local persist/save/bump, sync staging and acknowledgements run.
 context.photoIdb=async(mode,fn)=>fn({put(e){switches.putCount++;if(switches.putFail||switches.putCount===switches.failPutAt)throw Error('IDB quota');disk.idb.set(e.id,copy(e));return{result:e.id};},delete(id){if(switches.deleteFail)throw Error('IDB abort');disk.idb.delete(id);return{};},get(id){return{result:copy(disk.idb.get(id))};},getAll(){return{result:[...disk.idb.values()].map(copy)};}}).result;
 context.SYNC.db.doc=id=>({async set(body){disk.sets++;if(switches.docFail)throw Error('document network rejection');disk.remote.set(id.split('/')[1],copy(body));},async delete(){disk.remote.delete(id.split('/')[1]);}});
 context.SYNC.backend={async upload(file){disk.uploads++;if(switches.onUpload)switches.onUpload();if(switches.holdUpload)await switches.holdUpload;
   if(switches.uploadFail)throw Error('file network rejection');
   const up={id:'opaque-file-'+disk.uploads,name:file.name,sha256:crypto.createHash('sha256').update(Buffer.from(await file.arrayBuffer())).digest('hex'),kind:'drop-photo'};
   disk.files.push(up);if(switches.lostAck)throw Error('upload response lost');return copy(up);},
  async files(){if(switches.indexFail)throw Error('file index unavailable');return{files:copy(disk.files)};}};
 async function queue(options={}){
  const e={id:'queued-photo.jpg',key:'TEST',slot:0,unit:'',type:'image/jpeg',blob:new Blob(['test photograph'],{type:'image/jpeg'}),at:'2026-10-02T01:00:00Z',queued:'2026-10-02T01:00:00Z',by:'Test operator',caption:'',...options};
  assert(await context.photoOutboxPut(e));return e;
 }
 async function reload(){for(const e of disk.idb.values())context.getOutbox().set(e.id,copy(e));}
 async function send(e){return context.photoSend(e,s=>messages.push(s));}
 async function acknowledge(){context.syncSend();await flush();}
 return {c:context,disk,switches,messages,queue,send,reload,acknowledge};
}
(async()=>{
 {
  const r=rig(),e=await r.queue();assert.strictEqual(await r.send(e),false);assert(r.disk.idb.has(e.id));assert.strictEqual(r.disk.uploads,1);
  assert(!r.messages.some(s=>s.includes('saved against')));await r.acknowledge();assert.strictEqual(await r.send(e),true);assert.strictEqual(r.disk.idb.size,0);assert.strictEqual(r.disk.uploads,1);
  assert(r.messages.at(-1).includes('shared record has confirmed'));assert.strictEqual(await r.send(e),false);
  check('success retains queue until actual document acknowledgement; stale caller cannot reupload');
 }
 {
  const r=rig(),e=await r.queue();r.switches.localFail=true;assert.strictEqual(await r.send(e),false);assert(r.disk.idb.has(e.id));assert.strictEqual(r.disk.sets,0);assert(!r.messages.at(-1).includes('saved against'));
  r.switches.localFail=false;await r.send(e);await r.acknowledge();assert(await r.send(e));assert.strictEqual(r.disk.uploads,1);check('localStorage quota keeps uploaded file queued and recovers without another upload');
 }
 {
  const r=rig(),e=await r.queue();await r.send(e);r.switches.docFail=true;await r.acknowledge();assert.strictEqual(await r.send(e),false);assert(r.disk.idb.has(e.id));
  r.switches.docFail=false;await r.acknowledge();assert(await r.send(e));assert.strictEqual(r.disk.uploads,1);check('document network rejection retains queue and retries through existing serial sync');
 }
 {
  const r=rig(),e=await r.queue();await r.send(e);const disk=r.disk,r2=rig(disk);await r2.reload();const loaded=r2.c.getOutbox().get(e.id);await r2.send(loaded);await r2.acknowledge();assert(await r2.send(loaded));assert.strictEqual(disk.uploads,1);check('reload after upload uses durable returned opaque service ID');
 }
 {
  const r=rig(),e=await r.queue();r.switches.failPutAt=4;assert.strictEqual(await r.send(e),false);assert.strictEqual(r.disk.uploads,1);assert(!r.disk.idb.get(e.id).uploaded);
  const r2=rig(r.disk);await r2.reload();const e2=r2.c.getOutbox().get(e.id);await r2.send(e2);await r2.acknowledge();assert(await r2.send(e2));assert.strictEqual(r.disk.uploads,1);check('reload after receipt checkpoint failure recovers exact filename and checksum without duplicate upload');
 }
 {
  const r=rig(),e=await r.queue();r.switches.lostAck=true;assert.strictEqual(await r.send(e),false);r.switches.lostAck=false;await r.send(e);await r.acknowledge();assert(await r.send(e));assert.strictEqual(r.disk.uploads,1);check('lost file response reconciles service identity by exact filename and checksum');
 }
 {
  const r=rig(),e=await r.queue();r.switches.uploadFail=true;await r.send(e);assert(r.disk.idb.has(e.id));r.switches.uploadFail=false;await r.send(e);await r.acknowledge();assert(await r.send(e));assert.strictEqual(r.disk.files.length,1);check('file network rejection retries when service confirms no matching file');
 }
 {
  const r=rig();r.switches.putFail=true;const before=JSON.stringify(r.c.getSource());const result=await r.c.dropPhotoAddUnlocked('TEST',0,new Blob(['photo'],{type:'image/jpeg'}),s=>r.messages.push(s),'');
  assert.strictEqual(result,false);assert.strictEqual(r.disk.uploads,0);assert.strictEqual(r.c.getOutbox().size,0);assert.strictEqual(JSON.stringify(r.c.getSource()),before);check('initial IndexedDB refusal stops before upload and reports no durable retention');
 }
 {
  const r=rig(),e=await r.queue();r.switches.deleteFail=true;assert.strictEqual(await r.c.photoOutboxForget(e.id,s=>r.messages.push(s)),false);assert(r.disk.idb.has(e.id)&&r.c.getOutbox().has(e.id));assert(r.messages.at(-1).includes('cancellation has not completed'));
  r.switches.deleteFail=false;assert(await r.c.photoOutboxForget(e.id,s=>r.messages.push(s)));assert.strictEqual(r.disk.idb.size,0);assert.strictEqual(await r.send(e),false);check('Forget failure is truthful and successful Forget prevents stale retries');
 }
 {
  const r=rig(),e=await r.queue();await r.send(e);await r.acknowledge();r.switches.deleteFail=true;assert.strictEqual(await r.send(e),false);assert(r.disk.idb.has(e.id));r.switches.deleteFail=false;assert(await r.send(e));assert.strictEqual(r.disk.uploads,1);check('completed queue cleanup failure retries deletion only');
 }
 {
  const r=rig(),e=await r.queue();await r.send(e);const id=e.uploaded.id;r.c.photoLinkRemove(e.key,r.c.getSource().photoLinks[id],'Test operator','later removal');r.c.bump();await r.acknowledge();assert(await r.send(e));assert(r.c.getSource().photoLinks[id].removed);assert(r.messages.at(-1).includes('later change'));check('later removal survives queued upload retry without resurrection');
 }
 {
  const r=rig(),old={id:'previous',name:'old.jpg',ref:'TEST',slot:0,unit:'',at:'2026-10-01T01:00:00Z'};r.c.photoLinkPut(old,'Test operator');r.c.bump();await r.acknowledge();const e=await r.queue({previousId:'previous'});
  let resume;const entered=new Promise(ok=>r.switches.onUpload=ok);r.switches.holdUpload=new Promise(ok=>resume=ok);const running=r.send(e);await entered;assert.strictEqual(r.disk.uploads,1);
  assert.strictEqual(await r.c.photoOutboxForget(e.id,s=>r.messages.push(s)),false);
  const newer={id:'newer',name:'newer.jpg',ref:'TEST',slot:0,unit:'',at:'2026-10-03T01:00:00Z'};r.c.photoLinkPut(newer,'Test operator');r.c.bump();resume();await running;await r.acknowledge();assert(await r.send(e));assert(!r.c.getSource().photoLinks.newer.removed);assert(!r.c.getSource().photoLinks.previous.removed);check('late upload does not replace a newer slot photo; active upload cannot be falsely forgotten');
 }
 {
  const r=rig(),old={id:'previous',name:'old.jpg',ref:'TEST',slot:0,at:'2026-10-01T01:00:00Z'};r.c.photoLinkPut(old,'Test operator');r.c.bump();await r.acknowledge();const e=await r.queue({previousId:'previous'});await r.send(e);assert(r.c.getSource().photoLinks.previous.removed);await r.acknowledge();assert(await r.send(e));check('ordinary Replace retains previous-file tombstone and waits for both documents');
 }
 {
  const r=rig(),e=await r.queue();r.switches.uploadFail=true;await r.send(e);r.switches.uploadFail=false;r.disk.files.push({id:'other',name:e.id,sha256:'bad'});await r.send(e);assert.strictEqual(r.disk.uploads,1);assert(r.disk.idb.has(e.id));check('checksum/name conflict never guesses a service ID or sends a duplicate');
 }
 {
  const original=moduleSource.slice(moduleSource.indexOf('function photoIdb('),moduleSource.indexOf('/* PHOTO797: photoOutboxPut */'));
  let request,tx,closed=0;
  const c=vm.createContext({indexedDB:{open(){request={};return request;}}});vm.runInContext(original,c);
  const pending=c.photoIdb('readwrite',st=>st.put({id:'x'}));request.result={close(){closed++;},transaction(){return tx={objectStore:()=>({put:()=>({})})};}};request.onsuccess();tx.onabort();await assert.rejects(pending,/transaction failed/);assert.strictEqual(closed,1);check('IndexedDB abort rejects rather than leaving the upload hanging');
 }
 {
  const r=rig(),e=await r.queue(),r2=rig(r.disk);await r2.reload();const other=r2.c.getOutbox().get(e.id);
  let resume;const entered=new Promise(ok=>r.switches.onUpload=ok);r.switches.holdUpload=new Promise(ok=>resume=ok);const running=r.send(e);await entered;
  assert.strictEqual(await r2.send(other),false);assert.strictEqual(await r2.c.photoOutboxForget(e.id,s=>r2.messages.push(s)),false);assert.strictEqual(r.disk.uploads,1);
  resume();await running;await r.acknowledge();assert(await r.send(e));assert.strictEqual(await r2.send(other),false);assert.strictEqual(r.disk.uploads,1);assert.strictEqual(r2.c.getOutbox().size,0);
  check('Web Locks prevent a second tab sending or forgetting an active photo; completed entry reread suppresses stale upload');
 }
 {
  const r=rig(),e=await r.queue();r.c.navigator={};await r.send(e);await r.acknowledge();assert(await r.send(e));check('same-page fallback works when Web Locks is unavailable');
 }
 const result={author:'Andrew Fisher',passed:true,scope:'Exact photo/save/sync source with CPU mocked storage and transports; zero live requests',sourceSha256:crypto.createHash('sha256').update(moduleSource).digest('hex'),checks:results};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
