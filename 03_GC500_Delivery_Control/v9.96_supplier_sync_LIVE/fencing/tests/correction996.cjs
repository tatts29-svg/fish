// Author: Andrew Fisher. Native write primitive contract; no browser or network.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {apply996}=require('../correction_native996.cjs');
const out=process.env.AUDIT_DIR||'/workspace/private-gc500-fencing996',plan=JSON.parse(fs.readFileSync(path.join(out,'correction-plan.json')));
const clone=x=>JSON.parse(JSON.stringify(x)),canon=x=>JSON.stringify((function sort(v){return Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v})(x));
const checks=[];function check(name,fn){fn();checks.push({name,pass:true});}
function fixture(){
 const docs=clone(plan.operations.map(o=>o.before)),S={fenceDockets:docs.map(({_k,...d})=>d),stamps:{},by:{},unrelated:{retain:123}};
 const ctx={S,SYNC:{readonly:false,status:'live'},SYNC_COLLS:{fenceDockets:1,stamps:1,by:1},syncWaiting:()=>0,mayWrite:()=>true,whoAmI:()=>plan.operator,docIdOf:x=>x.replaceAll('/','_'),fencePaperCanonical898:canon};
 ctx.toDocs=k=>k==='fenceDockets'?Object.fromEntries(S.fenceDockets.map(d=>[d.id,{...d,_k:d.id}])):Object.fromEntries(Object.entries(S[k]).map(([key,v])=>[ctx.docIdOf(key),{_k:key,v}]));
 ctx.costDocket=d=>({cost_total:(d.quantities.ped_gates||0)*36.18,paid_total:(d.quantities.ped_gates||0)*36,unpriced:[],paid_unpriced:[]});
 ctx.fenceDerived=()=>({charged:S.fenceDockets.reduce((n,d)=>n+ctx.costDocket(d).cost_total,0),cost:S.fenceDockets.reduce((n,d)=>n+ctx.costDocket(d).paid_total,0)});
 ctx.cj764Fencing=()=>({revenue:100-ctx.fenceDerived().charged,cost:100-ctx.fenceDerived().cost});
 ctx.stampIt=(c,id,by)=>{S.stamps[c+'/'+id]='2026-10-12T01:00:00.000Z';S.by[c+'/'+id]=by;};
 ctx.bump=()=>{ctx.calls++;};ctx.calls=0;
 vm.createContext(ctx);vm.runInContext('const run='+apply996.toString(),ctx);ctx.run=p=>vm.runInContext('run(__plan)',Object.assign(ctx,{__plan:clone(p)}));
 return ctx;
}
check('exact two changes and six documents only',()=>{const c=fixture(),r=c.run(plan);assert.equal(c.calls,1);assert.equal(r.writes.length,6);assert.deepEqual(clone(c.S.unrelated),{retain:123});assert.equal(c.S.fenceDockets[0].components.base,12);assert.equal(c.S.fenceDockets[1].quantities.ped_gates,1);});
for(const [name,change]of [['changed original',c=>c.S.fenceDockets[0].components.base=16],['read only',c=>c.SYNC.readonly=true],['pending sync',c=>c.syncWaiting=()=>1],['wrong operator',c=>c.whoAmI=()=> 'Other'],['unexpected rate',c=>c.costDocket=d=>({cost_total:(d.quantities.ped_gates||0)*40,paid_total:(d.quantities.ped_gates||0)*36,unpriced:[],paid_unpriced:[]})]])check(name+' blocks before staging',()=>{const c=fixture();change(c);const before=canon(c.S);assert.throws(()=>c.run(plan));assert.equal(c.calls,0);assert.equal(canon(c.S),before);});
check('extra field in proposed correction blocks before staging',()=>{const c=fixture(),p=clone(plan);p.operations[0].changes.components.mesh=100;assert.throws(()=>c.run(p),/fields changed/);assert.equal(c.calls,0);});
check('native unwanted document change rejected before runner gate can open',()=>{const c=fixture();c.bump=()=>{c.S.unrelated.retain=9;};assert.throws(()=>c.run(plan),/Unrelated local state/);});
check('missing attribution rejected',()=>{const c=fixture();c.stampIt=()=>{};assert.throws(()=>c.run(plan),/lacks new attribution/);});
check('existing identical named attribution remains valid',()=>{const c=fixture();for(const o of plan.operations)c.S.by['fenceDockets/'+o.record_id]=plan.operator;assert.equal(c.run(plan).writes.length,4);});
fs.writeFileSync(path.join(out,'correction-model-result.json'),JSON.stringify({author:'Andrew Fisher',pass:true,networkCalls:0,checks},null,2));console.log(JSON.stringify({pass:true,checks:checks.length,networkCalls:0}));
