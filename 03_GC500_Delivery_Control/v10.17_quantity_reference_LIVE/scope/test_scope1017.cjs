/* Author: Andrew Fisher. Quantity scope projection examples independent of the live record. */
'use strict';const assert=require('node:assert/strict'),s=require('./scope1017.js');let tests=0;
const old={item:'FWF',quantity:4,received:4,installed:4,receipts:[{at:'2026-10-08T01:00:00Z',quantity:4}],receiptAt:'2026-10-08T01:00:00Z',onAt:'2026-10-08T01:00:00Z',doneAt:'2026-10-09T01:00:00Z',installAt:'2026-10-09T01:00:00Z',suppliedAt:'',rest:0};
const e={supplied:null,suppliedAt:'',on:true,onAt:old.onAt,done:true,doneAt:old.doneAt,install:false,installAt:'',rest:0};
const read=(change={},qty=6,date='2026-10-14',baseline=old)=>s.project(baseline,{...e,...change},qty,date,'2026-10-14T00:00:00Z');
function test(name,fn){fn();tests++;}
test('increasing planned scope preserves received/installed',()=>assert.deepEqual([read().arrived,read().done,read().complete],[4,4,false]));
test('larger increase uses same actual baseline',()=>assert.deepEqual([read({},10).arrived,read({},10).done],[4,4]));
test('before historical arrival none is received',()=>assert.equal(read({},6,'2026-10-07').arrived,0));
test('receipt precedes completion',()=>assert.deepEqual([read({},6,'2026-10-08').arrived,read({},6,'2026-10-08').done],[4,0]));
test('new item receipt adds only received quantity',()=>assert.deepEqual([read({supplied:6,suppliedAt:'2026-10-14T01:00:00Z'}).arrived,read({supplied:6,suppliedAt:'2026-10-14T01:00:00Z'}).done],[6,4]));
test('future receipt does not affect today',()=>assert.equal(read({supplied:6,suppliedAt:'2026-10-15T01:00:00Z'}).arrived,4));
test('same stamp cannot invent receipt',()=>assert.equal(read({supplied:6}).arrived,4));
test('new whole onsite explicitly confirms uncounted scope',()=>assert.equal(read({onAt:'2026-10-14T01:00:00Z'}).arrived,6));
test('explicit shortage still wins new onsite state',()=>assert.equal(read({onAt:'2026-10-14T01:00:00Z',supplied:4}).arrived,4));
test('new item installation does not invent receipt',()=>assert.equal(read({install:true,installAt:'2026-10-14T01:00:00Z'}).done,4));
test('new receipt and new work completes new scope',()=>assert.equal(read({supplied:6,suppliedAt:'2026-10-14T01:00:00Z',install:true,installAt:'2026-10-14T02:00:00Z'}).done,6));
test('earlier work cannot install a later receipt',()=>assert.equal(read({supplied:6,suppliedAt:'2026-10-14T02:00:00Z',install:true,installAt:'2026-10-14T01:00:00Z'}).done,4));
test('item work can be explicitly unticked',()=>assert.equal(read({install:false,installAt:'2026-10-14T01:00:00Z'}).done,0));
test('per-unit work un-tick reduces existing installation',()=>assert.equal(read({unitWork:{a:{on:false,at:'2026-10-14T01:00:00Z'}}},6,'2026-10-14',{...old,unitWork:{a:{on:true,at:'2026-10-13T01:00:00Z'}}}).done,3));
test('native deleted tick retains false evidence from its audit stamp',()=>{
 const k='WC09/u0085|Toilets & amenities|FWF|install',stamp='2026-10-14T01:00:00Z';
 const unitWork=s.unitEvidence('WC09','Toilets & amenities','FWF',{}, {['labour/'+k]:stamp});
 assert.deepEqual(unitWork,{[k]:{on:false,at:stamp}});
 assert.equal(read({unitWork},6,'2026-10-14',{...old,unitWork:{[k]:{on:true,at:'2026-10-13T01:00:00Z'}}}).done,3);
});
test('unit evidence excludes other references, items, work and unidentified remainder',()=>{
 const stamp='2026-10-14T01:00:00Z',stamps={};
 for(const k of ['WC09/urest|Toilets & amenities|FWF|install','WC10/u0085|Toilets & amenities|FWF|install','WC09/u0085|Toilets & amenities|FWF|clean','WC09/u0085|Toilets & amenities|Pee Panel|install'])stamps['labour/'+k]=stamp;
 assert.deepEqual(s.unitEvidence('WC09','Toilets & amenities','FWF',{},stamps),{});
});
test('newly recorded unit work adds only within actual receipt',()=>assert.equal(read({unitWork:{b:{on:true,at:'2026-10-14T01:00:00Z'}}}).done,4));
test('later received unit with its own work adds one',()=>assert.equal(read({supplied:6,suppliedAt:'2026-10-14T01:00:00Z',unitWork:{b:{on:true,at:'2026-10-14T02:00:00Z'}}}).done,5));
test('unticking work keeps receipt',()=>assert.deepEqual([read({done:false,doneAt:'2026-10-14T01:00:00Z'}).arrived,read({done:false,doneAt:'2026-10-14T01:00:00Z'}).done],[4,0]));
test('follow-up received scope adds once',()=>assert.equal(read({rest:2}).arrived,6));
test('rest original scope restores completeness',()=>assert.equal(read({},4).complete,true));
test('no receipt or work remains none',()=>assert.deepEqual([read({},6,'2026-10-14',{...old,received:0,installed:0,receipts:[]}).arrived,read({},6,'2026-10-14',{...old,received:0,installed:0,receipts:[]}).done],[0,0]));
test('multiple original receipt parts retain individual dates',()=>assert.equal(read({},8,'2026-10-10',{...old,received:6,receipts:[...old.receipts,{at:'2026-10-12T01:00:00Z',quantity:2}]}).arrived,4));
console.log(JSON.stringify({author:'Andrew Fisher',tests,pass:true}));
