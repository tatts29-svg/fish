/* Author: Andrew Fisher. Compare independent pinned native captures, kept privately. */
'use strict';
const fs=require('fs'),assert=require('node:assert/strict');
const F=require('../ruled_finance1255.js');
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
assert.deepEqual(A.source949,B.source949,'linked supplier model, per-line basis and monthly costs unchanged');
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
 if(!['KINP','NVAC','STPS','MEAD'].includes(row.code))assert.deepEqual(row,old,'unrelated branch unchanged');
}
for(const row of B.scope.lines){
 const old=A.scope.lines.find(x=>x.key===row.key);assert(old,'no event role invented');
 assert.deepEqual(omit(row,['amount','amount_exact','sourceAmount1255','sourceAmountExact1255','covered1255']),omit(old,['amount','amount_exact']),'event physical/rate data retained');
 if(row.covered1255){assert.equal(row.amount,0);assert.equal(row.sourceAmount1255,old.amount);}
 else assert.deepEqual(row,old,'uncovered event role retained');
}
const keys=xs=>new Map(xs.map(x=>[x.row.rental_contract+'|'+x.row.line,x]));
const oldRows=keys(A.rows),newRows=keys(B.rows);
const ruled=new Set([...Object.keys(F.installation),...Object.keys(F.hireOutcomes),'9994954|12','9992300|12','9994248|4','9994248|5']);
for(const [key,x]of oldRows){
 if(key==='9961976|27'){assert.equal(newRows.has(key),false,'approved zero source row removed only');assert.equal(x.charge.amount,0);continue;}
 const y=newRows.get(key);assert(y,'existing source identity retained: '+key);
 if(!ruled.has(key))assert.deepEqual(y.charge,x.charge,'unruled source charge unchanged: '+key);
 assert.equal(y.branch,x.branch,'existing dynamic branch preserved: '+key);
}
for(const [key,amount]of Object.entries(F.installation)){
 const x=newRows.get(key);assert(x,'approved Installation source present: '+key);
 assert.equal(Math.round(x.charge.amount*100),amount);assert.equal(x.category,'installation');
}
for(const [key,p]of Object.entries(F.hireOutcomes))assert.equal(Math.round(newRows.get(key).charge.amount*100),p.amountCents,'approved customer outcome: '+key);
assert.equal(newRows.get('9992300|12').charge.amount,1554.75,'late association wrapper cannot restore old amount');
if(A.pee&&B.pee){
 assert.equal(B.pee.actualAmount||0,0,'new source presence replaces the existing Pee fallback');
 assert.equal(newRows.get('9994954|19').charge.amount,A.pee.actualAmount,'Pee charge stays once');
}
for(let i=0;i<A.allLabourSlots.length;i++){
 const old=A.allLabourSlots[i],row=B.allLabourSlots[i];
 assert.deepEqual(omit(row,['rate','value','sourceRate1255','sourceValue1255','covered1255']),omit(old,['rate','value']),'physical slot unchanged');
 if(['install','steps','levelling','demob'].includes(old.key))assert.equal(Object.hasOwn(row,'sourceValue1255')?row.sourceValue1255:row.value,old.value,'original allocation value retained');
 if(row.covered1255)assert.equal(row.value,0,'covered physical card does not charge a second time');
 else if(old.key!=='fire_ext')assert.equal(row.value,old.value,'outside-scope card charge retained');
}
assert(Object.values(B.branch.checks).every(Boolean),'all native branch reconciliations pass');
console.log('PASS: exact record, physical scope, approved contract outcomes, untouched charges, Cleaning, servicing, supplier/monthly model and current/job branch cost preservation');
