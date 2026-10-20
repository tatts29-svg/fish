/* Author: Andrew Fisher. Completeness is distinct from invoicing, never a financial calculation. */
'use strict';
const assert=require('assert/strict'),{project}=require('./supplier_cost_status1094.js');
const source={quotes:[{quote:'Q1',groups:[{lines:[{description:'Hire',unit_price:100,total_price:1000},{description:'Cleaning',unit_price:20,total_price:600}]}]}],authorisation:{state:'approved',applies_to:['Q1']}};
const cost={complete:true,issues:[],total:1400,knownTotal:1400,quotedTotal:1600};
const extra={held:false,state:'estimate',estimate:100,additional:1};
const clone=x=>structuredClone(x);let checks=0;
const test=(name,f)=>{f();checks++;};
test('three distinct amounts and evidence qualification',()=>{const p=project(source,cost,extra);assert.equal(p.label,'All supplied rates recorded');assert.equal(p.originalQuoteCost,1600);assert.equal(p.currentCost,1400);assert.equal(p.additionalHireForecast,100);assert.equal(p.combinedEstimate,1500);assert.match(p.evidenceLabel,/separate document check/);assert.match(p.evidenceLabel,/does not confirm an invoice/);assert.equal(p.extraTransportUnconfirmed,true);});
for(const [name,mutate] of [
 ['missing rate',s=>delete s.quotes[0].groups[0].lines[0].unit_price],
 ['invalid rate',s=>s.quotes[0].groups[0].lines[0].unit_price=NaN],
 ['missing line amount',s=>delete s.quotes[0].groups[0].lines[0].total_price],
 ['empty lines',s=>s.quotes[0].groups[0].lines=[]],
 ['empty quotes',s=>s.quotes=[]],
 ['duplicate quote',s=>s.quotes.push(clone(s.quotes[0]))],
 ['missing approval',s=>delete s.authorisation],
 ['partial approval',s=>s.authorisation.applies_to=[]]
])test(name,()=>{const s=clone(source);mutate(s);const p=project(s,cost,extra);assert.equal(p.complete,false);assert.notEqual(p.label,'All supplied rates recorded');assert.equal(p.combinedEstimate,null);});
for(const [name,change]of [['incomplete projection',{complete:false}],['projection issue',{issues:['missing mapping']}],['unknown current cost',{total:null}],['unknown original comparison',{quotedTotal:null}]])test(name,()=>{const p=project(source,{...cost,...change},extra);assert.equal(p.complete,false);assert.equal(p.combinedEstimate,null);});
test('held extra cost cannot claim complete',()=>{assert.equal(project(source,cost,{...extra,held:true,state:'held'}).complete,false);});
test('unknown extra does not become zero',()=>{assert.equal(project(source,cost,null).additionalHireForecast,null);assert.equal(project(source,cost,null).complete,false);});
test('verified zero retains zero',()=>{const s=clone(source);s.quotes[0].groups[0].lines[0].unit_price=0;s.quotes[0].groups[0].lines[0].total_price=0;assert.equal(project(s,cost,{...extra,estimate:0}).complete,true);});
test('immutable inputs',()=>{const before=JSON.stringify({source,cost,extra});project(source,cost,extra);assert.equal(JSON.stringify({source,cost,extra}),before);});
console.log(JSON.stringify({pass:true,checks}));
