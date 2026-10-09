/* Author: Andrew Fisher. Forecast arithmetic and independent receipt scope. */
const assert=require('node:assert/strict'),A=require('../arrival_charges975.js');let n=0;function eq(a,b){assert.deepEqual(a,b);n++;}
const a={key:'WC09'},l={item:'FWF',discipline:'Toilets',quantity:4};
const slots=[{ref:'WC09',disc:'Toilets',item:'FWF',key:'install',line:'Install',rate:36.435,qty:4,value:145.74,state:'expected'},{ref:'WC09',disc:'Toilets',item:'FWF',key:'demob',line:'Demob',rate:36.435,qty:4,value:145.74,state:'later'}];
eq(A.rows(a,[l],slots,{FWF:2})[0].total,145.74);eq(A.rows(a,[l],slots,{FWF:2})[0].charges.map(x=>x.qty),[2,2]);eq(A.rows(a,[l],slots,{FWF:0}),[]);eq(A.rows(a,[l],slots,{FWF:4})[0].total,291.48);eq(A.rows(a,[l],slots,{FWF:4})[0].charges.map(x=>x.key),['install','demob']);
const cs=[{ref:'P36',disc:'Buildings',item:'Building6m',key:'cleaning',rate:104.1,qty:1,value:104.1,state:'later'}];eq(A.cleanForecast(cs,0),{priced:104.1,recorded:0,job:104.1,remaining:104.1,missing:[]});eq(A.cleanForecast(cs,104.1).remaining,0);eq(A.cleanForecast(cs,200).job,200);eq(A.cleanForecast(slots,0).job,0);
const pieces=[{...cs[0],unit:'1',qty:1},{...cs[0],unit:'2',qty:1}];eq(A.cleanForecast(pieces,0).job,208.2);eq(A.cleanForecast([{...cs[0],rate:null}],0).missing.length,1);eq(A.rows(a,[l],slots.concat({...cs[0],ref:'OTHER'}),{FWF:4})[0].total,291.48);

const step={ref:'WC09',disc:'Toilets',item:'FWF',key:'steps',line:'Steps',rate:156.15,qty:3,value:468.45,state:'expected'};
eq(A.rows(a,[l],[step],{FWF:2},{FWF:{arrived:null,total:1}})[0].charges[0].value,null);
eq(A.rows(a,[l],[step],{FWF:4},{FWF:1})[0].charges[0].value,468.45);
eq(A.rows(a,[l],[step],{FWF:2},{FWF:1})[0].charges[0].value,156.15);


const vm=require('node:vm'),fs=require('node:fs');const ctx={module:{exports:{}},Stairs975:{quantity:()=>1},allAssets:()=>[],qtyOf:l=>l.quantity,LAB_REST:'rest',labourRestN:()=>2,labourCents865:parts=>{const g={};for(const p of parts){g[p.key]??={rate:p.rate,n:0};g[p.key].n+=p.n;}return Math.round(Object.values(g).reduce((n,p)=>n+Math.round(p.rate*p.n*100)/100,0)*100)/100;}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../arrival_charges975.js'),'utf8'),ctx);
let m=ctx.applyStairsMoney975(a,l,{qty:4,total:624.6,ticked:[{key:'steps',rate:156.15,ticked:true}],units:[]});eq(m.total,468.45);eq(m.ticked[0].chargeQty975,3);
m=ctx.applyStairsMoney975(a,l,{qty:4,total:100,perBuilding:true,units:[{unit:'1',ticked:[{key:'steps',rate:156.15}]},{unit:'2',ticked:[{key:'install',rate:145.74}]}],ticked:[]});eq(m.total,145.74);eq(m.units[0].ticked.length,0);

console.log(JSON.stringify({author:'Andrew Fisher',checks:n,passed:true}));
