/* Author: Andrew Fisher. Received transport is included once without posting trips. */
'use strict';
const assert=require('node:assert/strict'),{project,itemRows}=require('../transport1006.js');
const line=(id,q,rate,state='estimate',coverage=[])=>({id:id+'|delivery',buildingId:id,ref:id.split('|')[0],item:id.split('|')[1],branch:'KINP',leg:'delivery',quantity:q,rate,state,additional:state==='estimate'?q*rate:0,coverage,coveredQuantity:coverage.reduce((n,c)=>n+c.quantity,0)});
const model=rows=>({rows,byBranch:[{branch:'KINP',uncoveredAdditional:rows.reduce((n,r)=>n+r.additional,0)}],uncoveredAdditional:rows.reduce((n,r)=>n+r.additional,0)});
const p=line('WC10|FWF',4,47.5),out=project(model([p,{...p,id:'WC10|FWF|pickup',leg:'pickup'}]),{'WC10|FWF':3});
assert.equal(out.actualAdditional1006,285);assert.equal(out.remainingAdditional1006,95);assert.equal(out.uncoveredAdditional,380);
assert.equal(out.byBranch[0].actualAdditional1006,285);assert.equal(out.byBranch[0].remainingAdditional1006,95);
assert.deepEqual(out.rows.map(r=>r.receivedQuantity1006),[3,3]);assert.equal(itemRows(out,'WC10','FWF')[0].quantity,3);
assert.equal(project(model([p]),{}).actualAdditional1006,0);
assert.equal(project(model([p]),{'WC10|FWF':99}).actualAdditional1006,190);
assert.equal(project(model([p]),{'WC10|FWF':-2}).actualAdditional1006,0);
assert.equal(project(model([p]),{'WC10|FWF':NaN}).actualAdditional1006,0);
for(const state of ['held','excluded','included'])assert.equal(project(model([line('WC10|FWF',4,47.5,state)]),{'WC10|FWF':4}).actualAdditional1006,0);
const covered=line('P01|Building 6m',1,200,'covered',[{id:'contract|2',quantity:1,amount:300}]);
const c2={...covered,id:'P02|Building 6m|delivery',buildingId:'P02|Building 6m',ref:'P02'};
const cv=project(model([covered,c2]),{'P01|Building 6m':1,'P02|Building 6m':1});
assert.equal(cv.actualAdditional1006,0);assert.equal(cv.rows.reduce((n,r)=>n+r.actualCovered1006,0),300,'Shared load line not duplicated across assets');
const both=project(model([covered,{...covered,id:'P01|Building 6m|pickup',leg:'pickup'}]),{'P01|Building 6m':1});
assert.equal(both.rows.reduce((n,r)=>n+r.actualCovered1006,0),300,'Return package line not doubled by legs');
const partial={...p,state:'partly covered',additional:95,coveredQuantity:2,coverage:[{id:'contract|3',amount:60,quantity:2}]};
const pp=project(model([partial]),{'WC10|FWF':2});assert.equal(pp.actualAdditional1006,47.5);assert.equal(pp.rows[0].actualCovered1006,30);assert.equal(pp.remainingAdditional1006,47.5);
for(let qty=1;qty<=30;qty++)for(let arrived=0;arrived<=qty;arrived++){const x={...p,quantity:qty,additional:77.77};const q=project(model([x]),{'WC10|FWF':arrived});assert.equal(Math.round((q.actualAdditional1006+q.remainingAdditional1006)*100),7777,'No rounding leak between actual and remaining');}
assert.equal(JSON.stringify(p),JSON.stringify(line('WC10|FWF',4,47.5)),'Source model not mutated');
console.log('Transport1006 checks passed: partial/full/pending, both legs, shared contract coverage, branch totals, no duplicate, rounding, source unchanged.');
