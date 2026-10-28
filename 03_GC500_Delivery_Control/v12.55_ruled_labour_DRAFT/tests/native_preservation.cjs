/* Author: Andrew Fisher. Compare independent pinned native captures, kept privately. */
'use strict';
const fs=require('fs'),assert=require('node:assert/strict');
assert(process.argv[2]&&process.argv[3],'Pass private before/after native capture paths');
const before=JSON.parse(fs.readFileSync(process.argv[2])),after=JSON.parse(fs.readFileSync(process.argv[3]));
for(const capture of [before,after]){
 assert.deepEqual(capture.errors,[]);assert.deepEqual(capture.consoleErrors,[]);assert.equal(capture.writes,0);
 assert.equal(capture.baseline.docsMatch,true);assert.equal(capture.baseline.inflight,0);assert.equal(capture.baseline.queuedDocuments,0);
}
assert.equal(before.baseline.stateSha256,after.baseline.stateSha256);
assert.equal(before.baseline.version,after.baseline.version);
const A=before.result,B=after.result;
assert.deepEqual(A.supplier,B.supplier,'supplier inputs and charges unchanged');
assert.deepEqual(A.service,B.service,'customer servicing belongs to separate v12.54');
for(const name of ['hours','at','times','edits'])assert.deepEqual(A.scope[name],B.scope[name],'scope physical/billing envelope preserved: '+name);
assert.deepEqual(A.ticks.cleaning,B.ticks.cleaning,'Cleaning retained without inferred bundle inclusion');
assert.equal(B.ticks.fire_ext.amount,0);assert.equal(A.ticks.fire_ext.ticks,B.ticks.fire_ext.ticks);
assert.equal(A.allLabourSlots.length,B.allLabourSlots.length);
const omit=(value,names)=>Object.fromEntries(Object.entries(value).filter(([key])=>!names.includes(key)));
const beforeBranch=new Map(A.branch.rows.map(row=>[row.code,row]));
for(const row of B.branch.rows){
 const old=beforeBranch.get(row.code);assert(old,'no branch invented');
 for(const key of ['cost','costJob'])assert.equal(row[key],old[key],row.code+' '+key+' must remain exact');
 if(row.code!=='KINP')assert.deepEqual(row,old,'unrelated branch unchanged');
}
for(let i=0;i<A.allLabourSlots.length;i++){
 const old=A.allLabourSlots[i],row=B.allLabourSlots[i];
 assert.deepEqual(omit(row,['rate','value','sourceRate1255','sourceValue1255','covered1255']),omit(old,['rate','value']),'physical slot unchanged');
 if(['install','steps','levelling','demob'].includes(old.key))assert.equal(Object.hasOwn(row,'sourceValue1255')?row.sourceValue1255:row.value,old.value,'original allocation value retained');
 if(row.covered1255)assert.equal(row.value,0,'covered physical card does not charge a second time');
 else if(old.key!=='fire_ext')assert.equal(row.value,old.value,'outside-scope card charge retained');
}
assert(Object.values(B.branch.checks).every(Boolean),'all native branch reconciliations pass');
console.log('PASS: exact record, physical scope, Cleaning, servicing, supplier model and current/job branch cost preservation');
