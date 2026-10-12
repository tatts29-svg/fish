// Author: Andrew Fisher. Offline guard checks; never starts a browser or sends requests.
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'correction1003.cjs'),'utf8');
const ctx={require,process:{env:process.env},console};vm.createContext(ctx);
vm.runInContext(source.slice(0,source.indexOf('const args=process.argv.slice(2)'))+'\nthis.testing={targetDocs,reviewed,variants,BASE,canon,docId,restoreUnchangedNative};',ctx);
const {targetDocs,reviewed,variants,BASE,canon,docId,restoreUnchangedNative}=ctx.testing,clone=x=>JSON.parse(JSON.stringify(x));
let checks=0;const check=(condition,message)=>{assert(condition,message);checks++;};
const fixture={fenceDockets:Object.fromEntries(variants.map(v=>[v.key,clone(v.body)])),notes:{WC61:{_k:'WC61',v:'Preserve unrelated note'}},stamps:{},by:{}};
const before=canon(fixture),fixed=targetDocs(fixture);
check(canon(fixture)===before,'input remains untouched');
check(!fixed.alreadyClean&&fixed.writes.length===3,'three exact native docket changes');
check(Object.keys(fixed.docs.fenceDockets).length===1,'one docket after cleanup');
check(canon(fixed.docs.fenceDockets[BASE])===canon(reviewed.corrected),'corrected full payload preserved');
check(fixed.docs.fenceDockets[BASE].quantities.ped_gates===1,'verified gate retained');
check(canon(fixed.docs.notes)===canon(fixture.notes),'other documents unchanged');
check(fixed.writes.filter(w=>w.method==='DELETE').map(w=>w.id).sort().join('|')===variants.map(v=>v.key).sort().join('|'),'deletes only reviewed variant keys');
check(fixed.writes.every(w=>w.collection==='fenceDockets'),'no unrelated collection writes');
const clean=targetDocs(fixed.docs);check(clean.alreadyClean&&clean.writes.length===0,'already repaired record is a no-op');
for(const [name,change]of [
 ['changed quantity',d=>d.fenceDockets[variants[0].key].quantities.ped_gates=2],
 ['different note',d=>d.fenceDockets[variants[1].key].note+=' Added field note'],
 ['unknown metadata',d=>d.fenceDockets[variants[0].key].otherEvidence='new'],
 ['missing variant',d=>delete d.fenceDockets[variants[1].key]],
 ['canonical and variants',d=>d.fenceDockets[BASE]=clone(reviewed.corrected)],
 ['same docket different ID',d=>d.fenceDockets.NEW={...clone(reviewed.corrected),id:'NEW',_k:'NEW'}],
 ['wrong storage key',d=>{d.fenceDockets.WRONG=d.fenceDockets[variants[0].key];delete d.fenceDockets[variants[0].key];}]
]){const modified=clone(fixture);change(modified);assert.throws(()=>targetDocs(modified),/exact reviewed pair/);checks++;}
check(docId('F-AFV-0002·3529')==='F-AFV-0002~b7~3529','native encoded variant key');
check(docId('fenceDockets/F-AFV-0002')==='fenceDockets~2f~F-AFV-0002','native stamp key');
// Startup merge can reorder keys in recently edited deliveries. Do not send those no-op writes.
function serializationFixture(){
 const original={state:'on site',history:[{state:'on site',at:'2026-10-12T00:56:20.325Z'}],done:true,_k:'GN13'};
 let stored={GN13:{state:original.state,done:original.done,history:clone(original.history)}};
 ctx.window={__nativeCorrectionSend1003:function(){}};
 ctx.SYNC={inflight:{},unkept:false,queue:{delivery:{GN13:{...stored.GN13,_k:'GN13'}},fenceDockets:{[BASE]:clone(reviewed.corrected)}}};
 ctx.SYNC_COLLS={delivery:{set:value=>stored=value},fenceDockets:{set:()=>{throw Error('Target collection must not be reset');}}};
 ctx.fencePaperCanonical898=canon;ctx.persist=()=>true;
 ctx.toDocs=name=>name==='delivery'?Object.fromEntries(Object.entries(stored).map(([k,v])=>[k,{...v,_k:k}])):{[BASE]:clone(reviewed.corrected)};
 ctx.fromDocs=(_name,docs)=>Object.fromEntries(Object.entries(docs).map(([k,v])=>{const copy={...v};delete copy._k;return[k,copy];}));
 ctx.syncStage=()=>{const body=ctx.toDocs('delivery').GN13;if(JSON.stringify(body)===JSON.stringify(original))delete ctx.SYNC.queue.delivery.GN13;else ctx.SYNC.queue.delivery.GN13=body;};
 return{beforeDocs:{delivery:{GN13:original},fenceDockets:{[BASE]:clone(reviewed.corrected)}}};
}
let serialization=serializationFixture();const aligned=restoreUnchangedNative(serialization);
check(aligned.restored.join(',')==='delivery','only unrelated no-op collection aligned');
check(Object.keys(aligned.queue.delivery).length===0,'native stage drops property-order-only delivery write');
check(aligned.queue.fenceDockets[BASE].quantities.ped_gates===1,'target correction remains queued');
check(canon(aligned.docs.delivery)===canon(serialization.beforeDocs.delivery),'user delivery values and history preserved');
serialization=serializationFixture();ctx.SYNC.inflight['delivery/GN13']='pending';assert.throws(()=>restoreUnchangedNative(serialization),/not paused/);checks++;
serialization=serializationFixture();ctx.window={};assert.throws(()=>restoreUnchangedNative(serialization),/not paused/);checks++;
serialization=serializationFixture();serialization.beforeDocs.delivery.GN13.done=false;assert.throws(()=>restoreUnchangedNative(serialization),/changed values/);checks++;
serialization=serializationFixture();ctx.SYNC.queue.delivery.GN13=null;assert.throws(()=>restoreUnchangedNative(serialization),/serialization-only no-op/);checks++;
serialization=serializationFixture();ctx.persist=()=>false;assert.throws(()=>restoreUnchangedNative(serialization),/Could not retain/);checks++;
console.log(JSON.stringify({author:'Andrew Fisher',pass:true,checks,networkCalls:0,mutations:0},null,2));
