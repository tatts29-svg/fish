/* Author: Andrew Fisher. GN20 optional rates never fabricate charges or bypass source guards. */
'use strict';
const assert=require('assert/strict'),api=require('../transport_override1006.js'),{project}=require('../transport1006.js');
const row=leg=>({id:'GN20|350kva|'+leg,buildingId:'GN20|350kva',ref:'GN20',item:'350kva',branch:'NVAC',quantity:1,rate:null,rateSource:'Card POA',leg,state:'held',reasons:['No current card transport charge'],additional:0,coverage:[],coveredQuantity:0,uncoveredQuantity:1,contracts:['9961976'],lineKeys:['9961976|20']}),base={rows:[row('delivery'),row('pickup')],byBranch:[{branch:'NVAC',uncoveredAdditional:0}],uncoveredAdditional:0};
const source=api.context(base.rows,'GN20','350kva'),doc={kind:api.kind,ref:'GN20',item:'350kva',active:true,source,rates:{delivery:123.45,pickup:234.56},by:'Practice test',note:'Example only'};
const applied=api.apply(base,doc,source),actual=project(applied,{'GN20|350kva':1});
assert.equal(actual.actualAdditional1006,358.01);assert.equal(actual.remainingAdditional1006,0);assert.equal(actual.held,0);
assert.deepEqual(actual.rows.map(r=>r.rate),[123.45,234.56]);assert.equal(base.rows[0].rate,null);
assert.equal(api.apply(base,{...doc,active:false},source),base);
const half=project(api.apply(base,{...doc,rates:{delivery:123.45,pickup:null}},source),{'GN20|350kva':1});assert.equal(half.actualAdditional1006,123.45);assert.equal(half.held,1);
const pending=project(applied,{});assert.equal(pending.actualAdditional1006,0);assert.equal(pending.remainingAdditional1006,358.01);
const stale=api.apply(base,doc,{...source,branch:'KINP'});assert.equal(stale.uncoveredAdditional,0);assert.equal(stale.held,1);assert.ok(stale.rows[0].reasons.some(r=>/source changed/.test(r)));
const coveredBase={...base,rows:base.rows.map(r=>({...r,coveredQuantity:1,uncoveredQuantity:0,coverage:[{id:'C|3',quantity:1,amount:100}],reasons:[],state:'covered'}))},coveredSource=api.context(coveredBase.rows,'GN20','350kva');
assert.equal(api.apply(coveredBase,{...doc,source:coveredSource},coveredSource).uncoveredAdditional,0,'Existing contract coverage displaces manual rate');
const heldBase={...base,rows:base.rows.map(r=>({...r,reasons:[...r.reasons,'Contract scope unresolved']}))},heldSource=api.context(heldBase.rows,'GN20','350kva');assert.equal(api.apply(heldBase,{...doc,source:heldSource},heldSource).uncoveredAdditional,0,'Rate does not clear another coverage hold');
for(const value of ['-1','no','1.234','Infinity','1e4','1000001'])assert.equal(api.validate({delivery:value,pickup:''}).ok,false);
assert.deepEqual(api.validate({delivery:'',pickup:''}).rates,{delivery:null,pickup:null});assert.equal(api.validate({delivery:'0',pickup:'99.50'}).rates.delivery,0);
console.log('GN20 transport override tests passed: blank, zero, split legs, actual/forecast, stale scope, contract coverage, held allocation, invalid rates.');
