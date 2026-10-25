// Author: Andrew Fisher. Shared card reconciliation: identity, override and source preservation.
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert(process.env.PAGE,'PAGE must identify the patched candidate');
const html=fs.readFileSync(process.env.PAGE,'utf8');
const start=html.indexOf('function contractCardCorrection1224('),end=html.indexOf('/* WHAT THE CONTRACTS HOLD, PER BRANCH.',start);
assert(start>=0&&end>start,'Shared correction and contract calculation were not found');
let card={source:'card',line:'Portable Building - 6m x 3m',hire_rate:1426.0659},typed=null,treatment=null;
const ctx=vm.createContext({console,Number,S:{rates:{}},CONTRACT_DAILY_KINDS:new Set(),
 cardRate:(disc,item,key)=>{assert.equal(disc,'Portable buildings');assert.equal(item,'Building 6m');assert.equal(key,'P41');return card;},
 lr748Typed:key=>{assert.equal(key,'c|9968862|63');return typed;},contractTreatment747:()=>treatment,money:v=>'$'+v.toFixed(2)});
vm.runInContext(html.slice(start,end),ctx);
const row=Object.freeze({rental_contract:'9968862',line:63,branch_code:'KINP',kind:'building',register_type:'Building 6m',quantity:1,charge_line:false,subhired:false,asset_no:'1189412',match:Object.freeze({key:'P41'}),rate_type:'W',rate_1:1426.17});
const read=r=>ctx.contractCharge_747(r),copy=r=>ctx.contractCardCorrection1224(r),cents=n=>Math.round(n*100);
let checks=0;const check=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
check('published full hire corrects exactly ten cents through the existing reader',()=>{
 const before=JSON.stringify(row),result=read(row);
 assert.equal(result.amount,1426.07);assert.equal(result.how,'whole event');assert.equal(result.daily,false);
 assert.equal(cents(row.rate_1)-cents(result.amount),10);assert.equal(result.cardCorrection1224.sourceRate,1426.17);
 assert.equal(result.cardCorrection1224.rate,1426.07);assert.equal(result.basis,'$1426.07, once — the rate is the whole-event bill');
 assert.equal(JSON.stringify(row),before);assert.equal(copy(row).branch_code,'KINP');
});
check('calculation copy changes no identity, allocation, quantity or category',()=>{
 const corrected=copy(row);assert.notEqual(corrected,row);
 for(const key of Object.keys(row))if(key!=='rate_1')assert.equal(corrected[key],row[key],key);
});
check('all identity and scope mismatches keep their input unchanged',()=>{
 for(const changed of [{rental_contract:'OTHER'},{line:64},{branch_code:'NVAC'},{kind:'container'},{register_type:'Building 12m'},{quantity:2},{charge_line:true},{subhired:true},{asset_no:'OTHER'},{match:{key:'P42'}},{rate_type:'D'},{rate_1:1500},{rate_1:1426.07}]){
  const input={...row,...changed};assert.equal(copy(input),input,JSON.stringify(changed));
 }
 assert.equal(copy(null),null);
});
check('explicit line overrides are never replaced by the reconciliation',()=>{
 for(const value of [0,1426.17,1500]){typed=value;assert.equal(copy(row),row);assert.equal(read(row).amount,1426.17);}
 typed=null;
});
check('explicit item overrides are retained',()=>{
 for(const value of [0,'0',1500]){ctx.S.rates['Portable buildings|Building 6m']=value;assert.equal(copy(row),row);}
 ctx.S.rates={};
});
check('unavailable, unrelated or changed cards never broaden the correction',()=>{
 const valid=card;
 for(const value of [null,{...valid,source:'typed'},{...valid,line:'Different card line'},{...valid,hire_rate:null},{...valid,hire_rate:NaN},{...valid,hire_rate:1400}]){card=value;assert.equal(copy(row),row);}
 card=valid;
});
check('existing charge treatments still take precedence',()=>{
 treatment={kind:'own_use',label:'Own use',basis:'Existing decision'};
 const result=read(row);assert.equal(result.amount,0);assert.equal(result.treatment,'own_use');assert.equal(result.cardCorrection1224,undefined);
 treatment=null;
});
check('unrelated whole-event charges retain the previous arithmetic and shape',()=>{
 const result=read({...row,line:64,quantity:2});assert.equal(result.amount,2852.34);assert.equal(result.cardCorrection1224,undefined);
 assert.equal(result.basis,'$1426.17 × 2, once — the rate is the whole-event bill');
});
check('source correction is idempotent for calculation copies',()=>{
 const once=copy(row);assert.equal(copy(once),once);assert.equal(read(once).amount,1426.07);
});
console.log(JSON.stringify({passed:checks,failed:0,record_writes:0,network:false}));
