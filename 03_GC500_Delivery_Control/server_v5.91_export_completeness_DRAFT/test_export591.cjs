/* Author: Andrew Fisher. Exact native export comparison and disposable local HTTP servers only. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const ROOT=path.resolve(__dirname,'..'),NEW=path.join(__dirname,'server.js'),OLD=path.join(ROOT,'server_v5.90_servicing_tracker_DRAFT/server.js');
const PAGE=process.env.GC500_NATIVE_PAGE||path.join(ROOT,'build/GC500_v10.66/GC500_Delivery_Control_hosted.html');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),clone=x=>JSON.parse(JSON.stringify(x));
const page=fs.readFileSync(PAGE,'utf8'),source=fs.readFileSync(NEW,'utf8'),base=fs.readFileSync(OLD,'utf8');
let passed=0;const check=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
function slice(text,start,end){let a=text.indexOf(start);assert(a>=0,start);let b=text.indexOf(end,a+start.length);assert(b>a,end);return text.slice(a,b);}
const registry=slice(page,'const SYNC_COLLS = {','/* a document id from a key:');
const fromDocs=slice(page,'function fromDocs(name, docs){','/* write what changed since');
const nativeExport=slice(page,'function exportRecord(){','let EXPORT_SEQ =');
const scope=page.match(/<script id="quantity-scope-sync1017-script">([\s\S]*?)<\/script>/)[1];
const ctx={console,Date,document:{},S:{},DATA:{build_version:'synthetic',dataset_sha256:'fixture',register_sha256:'fixture'},todayIso:()=> '2026-10-18',toDocs:()=>({}),mergeRecords:()=>({merged:{}})};
ctx.window=ctx;vm.createContext(ctx);vm.runInContext(registry+fromDocs+scope+nativeExport,ctx);
const schema=JSON.parse(vm.runInContext('JSON.stringify(Object.fromEntries(Object.entries(SYNC_COLLS).map(([k,c])=>[k,c.kind])))',ctx));
const foldText=slice(source,'function require_fold() {','/* v5.84 — SIGTERM');
const fold=vm.runInNewContext(foldText+'\nrequire_fold()', {Date});
function native(docs){ctx.INPUT=clone(docs);return JSON.parse(vm.runInContext("S={schema:'gc500-as-supplied-1',operator:null};for(const k of Object.keys(SYNC_COLLS))S[k]=fromDocs(k,INPUT[k]||{});ScopeSync1017.attach(S);JSON.stringify(exportRecord())",ctx));}
function body(st){return clone(fold(st));}
function docsFixture(){
 const docs={};for(const [name,kind]of Object.entries(schema)){
  if(kind==='value')docs[name]={z:{_k:'zero',v:0},f:{_k:'false',v:false},n:{_k:'null',v:null},e:{_k:'empty',v:''},a:{_k:'array',v:[0,false,null,{n:'array entry'}]},o:{_k:'object',v:{items:[1,2],done:false}},emptyArray:{_k:'emptyArray',v:[]},bad:{v:'no key'},nil:null};
  else if(kind==='map')docs[name]={b:{_k:'b',n:0,flag:false,items:[0,false,null]},a:{_k:'a',label:'synthetic'},bad:{label:'no key'},nil:null};
  else if(kind==='list')docs[name]={z:{_k:'z',id:'z',key:'z',qty:0,done:false},a:{_k:'a',id:'a',key:'a',items:[0,false]},bad:{id:'missing key'},nil:null};
  else docs[name]={quote:{_k:'quote',total:0,lines:[{qty:0}],accepted:false}};
 }
 docs.mapKeys={google:{_k:'google',v:{key:'NEVER_EXPORT_MAP_CREDENTIAL'}}};
 docs.privateTrackerSecrets={key:{_k:'private',v:'NEVER_EXPORT_TRACKER_SECRET'}};
 return docs;
}
function scopeFixture(ref='X01',typed=4){return {kind:'quantityScope1017',ref,typed,at:'2026-10-18T00:00:00.000Z',items:[{item:'FWF',quantity:3,received:2,installed:1,receipts:[{at:'2026-10-17T00:00:00.000Z',quantity:2}]}]};}
function matches(docs,label){const st={version:73,docs},before=JSON.stringify(st),want=native(docs),out=body(st);
 check(label+' exact native records',()=>assert.deepStrictEqual(out.records,want.records));
 check(label+' complete native record-less aliases',()=>{for(const [k,v]of Object.entries(want))if(!['schema','_about','committed_by','committed_on','exported','source','dataset_sha256','register_sha256','crew','records'].includes(k))assert.deepStrictEqual(out[k],v,k);});
 check(label+' leaves source unchanged and excludes credentials',()=>{assert.equal(JSON.stringify(st),before);assert(!JSON.stringify(out).includes('NEVER_EXPORT'));assert(!('mapKeys'in out.records));assert(!('privateTrackerSecrets'in out.records));});
 return out;
}
function req(port,route,token='local-export-edit',method='GET',data){return new Promise((resolve,reject)=>{let body=data===undefined?null:JSON.stringify(data);const q=http.request({host:'127.0.0.1',port,path:route,method,headers:{'x-gc500-token':token,'Content-Type':'application/json',...(body?{'Content-Length':Buffer.byteLength(body)}:{})}},r=>{let b=[];r.on('data',x=>b.push(x));r.on('end',()=>{const raw=Buffer.concat(b).toString();let json;try{json=JSON.parse(raw);}catch{}resolve({status:r.statusCode,headers:r.headers,raw,json});});});q.on('error',reject);if(body)q.write(body);q.end();});}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function boot(server,dir){const port=await new Promise(resolve=>{const s=http.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});const log=fs.openSync(path.join(dir,'server.log'),'a');let exited=false;const child=spawn(process.execPath,[server],{env:{PATH:process.env.PATH,PORT:String(port),DATA_DIR:dir,VIEW_TOKEN:'local-export-view',EDIT_TOKEN:'local-export-edit'},stdio:['ignore',log,log]});child.once('exit',()=>exited=true);const stop=async()=>{if(!exited){child.kill('SIGTERM');for(let i=0;i<100&&!exited;i++)await wait(30);}};for(let i=0;i<100;i++){try{const h=await req(port,'/health');if(h.status===200)return {port,health:h.json,stop};}catch{}if(exited)break;await wait(30);}await stop();throw Error('local server boot failed');}
function assertRouteBoundary(){const strip=s=>s.replace(/const BUILD = '[^\n]*/,'const BUILD = ALLOWED').replace(/build: 'v5\.9[01]'/,"build: 'ALLOWED'").replace(/function require_fold\(\) \{[\s\S]*?(?=\/\* v5\.84 — SIGTERM)/,'EXPORT_FOLD_ALLOWED\n');assert.equal(strip(source),strip(base));}
(async()=>{
 check('exact v5.90 base and native page identity',()=>{assert.equal(hash(base),'55a19453304406e9fcf0891ae6151e8516357e83e22987fc334e2bf9428ad0ec');
  const original='4b5b727b781992e251968f81503ee064a3dbd3414a6087260258871ad83a0ec6',envelope='9724e2a644833e7b6e56139b7954add2f639e348f03c6b6c9d109e0229cc821a';
  if(hash(page)!==original){assert.equal(hash(page),envelope);assert.equal(hash(page.replace(/^(\uFEFF<!doctype html>\n)<!-- GC500 Delivery Control -->\n/,'$1')),original);}
 });
 check('only export folding and two version markers change',assertRouteBoundary);
 check('56 native synced collections,55 exportable',()=>{assert.equal(Object.keys(schema).length,56);const d=body({docs:{}}).records;assert.deepStrictEqual(Object.keys(d).filter(k=>k!=='schema'&&k!=='operator').sort(),Object.keys(schema).filter(k=>k!=='mapKeys').sort());});
 matches({},'empty record');const docs=docsFixture();matches(docs,'all native kinds with false/zero/null/arrays');
 for(const [kind,name]of Object.entries(schema)){if(name==='single')check(kind+' empty quote stays null',()=>assert.equal(body({docs:{[kind]:{}}}).records[kind],null));}
 const atomic=docsFixture();atomic.qtys={one:{_k:'X01',v:4,scope1017:scopeFixture()}};atomic.loads={normal:{_k:'L01',kind:'carrier',items:[1]},stale:{_k:'quantityScope1017/stale',kind:'quantityScope1017',ref:'stale'}};const atomicOut=matches(atomic,'atomic quantity metadata');
 check('valid scope is materialized only in loads,ordinary loads retained',()=>{assert.deepStrictEqual(atomicOut.records.qtys,{X01:4});assert.equal(atomicOut.records.loads.L01.kind,'carrier');assert.deepStrictEqual(atomicOut.records.loads['quantityScope1017/X01'],scopeFixture());assert(!('quantityScope1017/stale'in atomicOut.records.loads));});
 const invalid=[{typed:5},{ref:'OTHER'},{at:'bad'},{items:[]},{items:[{item:'FWF',quantity:3,received:1,installed:2}]},{items:[{item:'FWF',quantity:-1,received:1,installed:0}]},{items:[{item:'FWF',quantity:3,received:1,installed:0,receipts:[{quantity:1,at:'bad'}]}]},{items:[{item:'FWF',quantity:3,received:1,installed:0},{item:'FWF',quantity:3,received:1,installed:0}]}];
 invalid.forEach((x,i)=>{const d=clone(atomic);Object.assign(d.qtys.one.scope1017,x);check('invalid atomic metadata case '+i+' matches native rejection',()=>assert.deepStrictEqual(body({docs:d}).records,native(d).records));});
 for(const typed of [null,undefined,0,false,'4']){const d=clone(atomic);if(typed===undefined)delete d.qtys.one.v;else d.qtys.one.v=typed;d.qtys.one.scope1017.typed=typed;check('atomic typed '+String(typed)+' matches native',()=>assert.deepStrictEqual(body({docs:d}).records,native(d).records));}
 let live;const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gc500-export591-'));const initial={version:73,updated:'2026-10-18T00:00:00.000Z',docs:atomic};fs.writeFileSync(path.join(dir,'records.json'),JSON.stringify(initial));const originalHash=hash(fs.readFileSync(path.join(dir,'records.json')));
 try{
  live=await boot(NEW,dir);check('local candidate health v5.91',()=>assert.equal(live.health.build,'v5.91'));
  for(const token of ['local-export-edit','local-export-view']){const exp=await req(live.port,'/api/export',token);check(token.endsWith('edit')?'edit HTTP export matches native':'view HTTP export matches native',()=>{assert.equal(exp.status,200);assert.deepStrictEqual(exp.json.records,native(atomic).records);assert.match(exp.headers['content-disposition'],/attachment/);assert(!exp.raw.includes('NEVER_EXPORT'));});}
  const unauth=await req(live.port,'/api/export','');check('export keeps authentication requirement',()=>assert.equal(unauth.status,401));
  const state=await req(live.port,'/api/state');check('GET exports preserve exact state and record bytes',()=>{assert.deepStrictEqual(state.json.docs,atomic);assert.equal(state.json.version,73);assert.equal(hash(fs.readFileSync(path.join(dir,'records.json'))),originalHash);});
 }finally{if(live)await live.stop();}
 console.log(JSON.stringify({author:'Andrew Fisher',passed,failed:0,server_sha256:hash(source),base_sha256:hash(base),native_page_sha256:hash(page),local_only:true,live_writes:0}));
})().catch(e=>{console.error(e);process.exitCode=1;});
