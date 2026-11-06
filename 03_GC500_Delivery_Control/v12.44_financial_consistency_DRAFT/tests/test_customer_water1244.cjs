/* Author: Andrew Fisher. Differential customer/supplier boundary checks, fictional amounts. */
'use strict';
const assert=require('node:assert/strict'),{project,description}=require('../customer_water1244');
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const card={key:'service|Tank Pump Out & Clean & Restock',amount:123.45,qty:3,rate:41.15};
const water=['Water Truck','Water Truck - Pre fill','Water delivery','3000 Ltr Free Drinking Water Tank'].map((k,i)=>({key:'service|'+k,amount:(i+1)*17.13,rate:17.13,qty:i+1,their_amount:40+i,their_rate:10+i,from:'typed',typed_under:3,quote:'TEST',period:'test'}));
const other={key:'service|Unrelated future service',amount:8.17,rate:8.17,qty:1};
const supplier={serviceTotal:234.56,quotes:[{quote:'TEST',groups:[{lines:[{qty:7,total_price:123.45}]}]}],lines:[{quantity:7,customerQuantity1068:3,amount:234.56}]};
const s={lines:[card,...water,other],at_cost:[...water,other],card_lines:[card],card_total:123.45,total:302.92,at_cost_total:179.47,supplier1068:supplier,their_total:234.56,their_water:166,per1040:[{ref:'FICTIONAL',lines:[{units:3}]}]};
const before=JSON.stringify(s),r=project(s);
eq(JSON.stringify(s),before);eq(r.total,131.62);eq(r.at_cost_total,8.17);eq(r.card_lines,s.card_lines);eq(r.card_total,s.card_total);
eq(r.supplier1068,s.supplier1068);eq(r.supplier1068===s.supplier1068,true);eq(r.their_total,s.their_total);eq(r.their_water,s.their_water);eq(r.per1040,s.per1040);
for(let i=0;i<water.length;i++){const p=r.at_cost[i],w=water[i];eq(p.amount,0);eq(p.rate,0);eq(p.included1244,true);for(const k of ['their_amount','their_rate','qty','quote','period'])eq(p[k],w[k]);eq(p.source_amount1244,w.amount);eq(p.source_rate1244,w.rate);}
eq(r.lines.at(-1),other);eq(r.at_cost.at(-1),other);eq(project(r),r);eq(project(null),null);eq(project({lines:[]}),{lines:[]});
const absent={lines:[card],at_cost:[],supplier1068:supplier};eq(project(absent)===absent,true);
const warnings={...s,under:[water[0],other]},warningsBefore=JSON.stringify(warnings),clear=project(warnings);
eq(clear.under,[other]);eq(JSON.stringify(warnings),warningsBefore);eq(clear.under[0],other);eq(project(clear),clear);
const adjusted={description:'Old site-derived quantity and amount',card_line:'Synthetic service',baseplan12416:'Existing approval',qty:7,qty_site12416:4},adjustedBefore=JSON.stringify(adjusted);
eq(description(adjusted),'Synthetic service · customer charge: 7 services (Baseplan); site record: 4 services');
eq(description(adjusted,n=>'n='+n),'Synthetic service · customer charge: n=7 services (Baseplan); site record: n=4 services');
eq(JSON.stringify(adjusted),adjustedBefore);
eq(description({...adjusted,baseplan12416:null}),adjusted.description);eq(description({...adjusted,qty_site12416:null}),adjusted.description);
eq(description({...adjusted,qty:null}),adjusted.description);eq(description({...adjusted,card_line:null}),adjusted.description);
eq(description({description:'Ordinary source description'}),'Ordinary source description');eq(description(null),'');
console.log('PASS '+checks+' customer water differential checks');
