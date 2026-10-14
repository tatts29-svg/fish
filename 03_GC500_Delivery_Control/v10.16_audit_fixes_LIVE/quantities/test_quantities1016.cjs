/* Author: Andrew Fisher. Requested scope and actual completion stay distinct. */
'use strict';const assert=require('node:assert/strict'),Q=require('./quantities1016.js');
let checks=0;const ck=(name,fn)=>{fn();checks++;},ratio=(n,d)=>n/d*100;
const area={id:'toilets',health:{ready:true},rows:[{key:'WC1',quantity:4}],totalRefs:1,knownTotal:4,total:4,done:3,remaining:1,left:1,pct:75,unrecordedRefs:0,shortConflictRefs:0};
const row={ref:'request-1',sourceRequest:{id:'request-1'},sourceOnly:true,item:'FWF',name:'Team',quantity:1,received:0,installed:0,events:[{date:'2026-10-22'}],supplierBasis:'Source row'};
const model={rows:[row],remaining:[{...row,date:'2026-10-16'}]};
ck('Known request increases total and remaining only',()=>{const r=Q.project([area],model,['WC1'],ratio)[0];assert.equal(r.total,5);assert.equal(r.done,3);assert.equal(r.left,2);assert.equal(r.pct,60);});
ck('Source request uses current shared run date',()=>assert.equal(Q.project([area],model,['WC1'],ratio)[0].rows[1].dueDate1016,'2026-10-16'));
ck('Receipt and completion are not invented',()=>{const r=Q.project([area],model,['WC1'],ratio)[0].rows[1];assert.equal(r.arrived962,0);assert.equal(r.done,0);assert.equal(r.complete,false);});
ck('Existing native reference prevents duplicate scope',()=>assert.equal(Q.project([area],model,['WC1','request-1'],ratio)[0].total,4));
ck('Resolved supplier scope prevents duplicate scope',()=>assert.equal(Q.project([area],{...model,rows:[{...row,sourceOnly:false}]},['WC1'],ratio)[0].total,4));
ck('Reapplying projection cannot add twice',()=>{const once=Q.project([area],model,['WC1'],ratio);assert.equal(Q.project(once,model,['WC1'],ratio)[0].total,5);});
ck('Shared source quantity change flows into total',()=>assert.equal(Q.project([area],{...model,rows:[{...row,quantity:3}]},['WC1'],ratio)[0].total,7));
ck('Unknown existing scope is not promoted to complete',()=>{const r=Q.project([{...area,total:null,knownTotal:4}],model,['WC1'],ratio)[0];assert.equal(r.total,null);assert.equal(r.knownTotal,5);assert.equal(r.pct,null);});
ck('Source linkage must be explicit',()=>assert.equal(Q.project([area],{...model,rows:[{...row,sourceRequest:{id:'other'}}]},['WC1'],ratio)[0].total,4));
ck('Unready native scope remains unready',()=>{const rows=[{...area,health:{ready:false}}];assert.equal(Q.project(rows,model,['WC1'],ratio),rows);});
ck('Input models remain unchanged',()=>{const before=JSON.stringify([area,model]);Q.project([area],model,['WC1'],ratio);assert.equal(JSON.stringify([area,model]),before);});
console.log(JSON.stringify({author:'Andrew Fisher',checks,passed:checks}));
