// Author: Andrew Fisher. Billing inclusion is independent of physical completion.
const assert=require('assert/strict'),M=require('../charge1006');let checks=0;
const test=(name,fn)=>{fn();checks++;};
const lines=[['install',17.35],['demob',18.15],['levelling',104.10],['cleaning',34.65],['steps',50]].map(([key,rate])=>({key,name:key,money:'rate',rate}));
const p=(patch={})=>M.project({ordered:12,received:5,lines,recorded:{},...patch});
test('only received units charged automatically',()=>{const r=p();for(const x of r.rows.filter(x=>x.key!=='steps')){assert.equal(x.qty,5);assert.equal(x.remainingQty,7);}assert.equal(r.rows.find(x=>x.key==='steps').qty,0);});
test('no receipt is not an automatic charge',()=>assert(p({received:0}).rows.every(x=>x.qty===0)));
test('automatic and recorded same units count once',()=>{const r=p({recorded:{install:3,demob:5}});assert.equal(r.rows.find(x=>x.key==='install').qty,5);assert.equal(r.rows.find(x=>x.key==='demob').qty,5);});
test('manual stairs only; exclusions already reflected',()=>{const r=p({recorded:{steps:2}}).rows.find(x=>x.key==='steps');assert.equal(r.qty,2);assert.equal(r.forecastQty,2);assert.equal(r.value,100);});
test('no extra charge for card included or absent',()=>assert.equal(p({lines:[{key:'levelling',money:'included',rate:0},{key:'cleaning',money:'absent',rate:null}]}).rows.length,0));
test('furniture never acquires building labour',()=>assert.equal(p({lines:[]}).total,0));
test('relocation does not add second demob',()=>assert(!p({relocation:true}).rows.some(x=>x.key==='demob')));
test('full receipt leaves no automatic forecast',()=>assert(p({received:12}).rows.every(x=>x.remainingQty===0)));
test('known amount is rounded per charge once',()=>{const r=p({lines:[{key:'install',money:'rate',rate:10.005}],received:3,ordered:3});assert.equal(r.total,30.02);});
test('invalid quantity remains forecast hold',()=>assert.equal(p({ordered:null}).rows[0].forecastValue,null));
test('existing manual charge retained until corrected',()=>assert.equal(p({received:0,recorded:{install:1}}).rows[0].qty,1));
test('unknown priced rate remains a hold',()=>{const r=p({lines:[{key:'install',money:'rate',rate:null}]});assert.equal(r.rows.length,1);assert.equal(r.rows[0].value,null);assert.equal(r.total,null);});
test('unknown recorded quantity remains a hold',()=>{const r=p({ordered:null,received:0,recorded:{steps:null}});assert.equal(r.rows.find(x=>x.key==='steps').qty,null);assert.equal(r.total,null);});
console.log(JSON.stringify({author:'Andrew Fisher',pass:true,checks}));
