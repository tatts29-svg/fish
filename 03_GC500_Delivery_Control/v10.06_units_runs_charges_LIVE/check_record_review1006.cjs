// Author: Andrew Fisher. Offline rejection checks; no network or operational calls.
const assert=require('assert/strict'),fs=require('fs'),vm=require('vm');
const base=__dirname+'/';
const canon=x=>JSON.stringify((function sort(v){return Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v})(x));
const clone=x=>JSON.parse(JSON.stringify(x));let count=0;
const source=fs.readFileSync(base+'record1006.cjs','utf8'),fn=source.slice(source.indexOf('function restoreUnchangedNative(input){'),source.indexOf('async function fetchSafe('));
function fixture(){let docs={delivery:{WC72:{done:true,state:'on site'}}};const beforeDocs={delivery:{WC72:{state:'on site',done:true}}};const ctx={window:{__nativeCorrectionSend1006:true},SYNC:{inflight:{},queue:{delivery:{WC72:{done:true,state:'on site'}}}},fencePaperCanonical898:canon,SYNC_COLLS:{delivery:{set:value=>docs.delivery=value}},fromDocs:(_name,value)=>value,toDocs:name=>docs[name],persist:()=>true,syncStage:()=>{ctx.SYNC.queue=JSON.stringify(docs)===JSON.stringify(beforeDocs)?{}:ctx.SYNC.queue;}};vm.createContext(ctx);vm.runInContext(fn,ctx);return {ctx,input:{beforeDocs}};}
let f=fixture();assert.deepEqual(clone(f.ctx.restoreUnchangedNative(f.input).restored),['delivery']);count++;
for(const change of [f=>{f.ctx.SYNC.inflight['delivery/WC72']='pending';},f=>{f.ctx.window={};},f=>{f.input.beforeDocs.delivery.WC72.done=false;},f=>{f.ctx.SYNC.queue.delivery.WC72=null;},f=>{f.ctx.persist=()=>false;}]){f=fixture();change(f);assert.throws(()=>f.ctx.restoreUnchangedNative(f.input));count++;}
const {verify}=require(base+'native_identity1006.cjs'),plan={scope:'confirmed-ep-identity-13oct1006',operator:'Andrew Fisher via Codex',operations:[{ref:'WC72'}]};
const valid={before:{},after:{subhire:{WC72:{_k:'WC72',co:'Event Portables',by:plan.operator,coates_off:null}}},actions:[],numbers:[]};assert.equal(verify(valid,plan).pass,true);count++;
const forbidden=[['delivery','WC72',{done:false}],['photoLinks','p1',{ref:'WC72',removed:'now'}],['subhire','WC20',{co:'Event Portables',by:plan.operator,coates_off:null}],['loads','unrelated',{active:false,removedBy:plan.operator,assetNo:'0699'}],['assetNumbers','WC69',{v:[]}],['deleted','num/WC20/0699',{by:plan.operator}],['by','unrelated',{v:plan.operator}]];
for(const [collection,id,value]of forbidden){const bad=clone(valid);(bad.after[collection]||=( {}))[id]=value;assert.throws(()=>verify(bad,plan));count++;}
const wrongWho=clone(valid);wrongWho.after.subhire.WC72.by='someone else';assert.throws(()=>verify(wrongWho,plan));count++;
fs.writeFileSync(base+'evidence/record1006-review.json',JSON.stringify({author:'Andrew Fisher',at:new Date().toISOString(),checks:count,pass:true,scope:'Offline serialization and identity scope rejection checks; no network or native mutation'},null,2)+'\n');console.log(JSON.stringify({pass:true,checks:count}));
