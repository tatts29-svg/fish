// Author: Andrew Fisher. Shared card reconciliation: identity, override and source preservation.
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert(process.env.PAGE,'PAGE must identify the patched candidate');
const html=fs.readFileSync(process.env.PAGE,'utf8');
const start=html.indexOf('function contractCardCorrection1224('),end=html.indexOf('/* WHAT THE CONTRACTS HOLD, PER BRANCH.',start);
assert(start>=0&&end>start,'Shared correction and contract calculation were not found');
let card={source:'card',line:'Portable Building - 6m x 3m',hire_rate:1426.0659},typed=null,treatment=null;
const ctx=vm.createContext({console,Number,S:{rates:{}},CONTRACT_DAILY_KINDS:new Set(),
 cardRate:(disc,item,key)=>{assert.equal(disc,'Portable buildings');assert.equal(item,'Building 6m');assert(['P41','P39'].includes(key));return card;},
 lr748Typed:key=>{assert(['c|9968862|63','c|9968862|73'].includes(key));return typed;},contractTreatment747:()=>treatment,money:v=>'$'+v.toFixed(2)});
vm.runInContext(html.slice(start,end),ctx);
const row=Object.freeze({rental_contract:'9968862',line:63,branch_code:'KINP',kind:'building',register_type:'Building 6m',quantity:1,charge_line:false,subhired:false,asset_no:'1189412',match:Object.freeze({key:'P41'}),rate_type:'W',rate_1:1426.17});
const otherRow=Object.freeze({...row,line:73,asset_no:'1327216',match:Object.freeze({key:'P39'}),rate_1:1426.08,start_date:'2026-09-28',booked_pickup_date:'2026-11-13'});
const read=r=>ctx.contractCharge_747(r),copy=r=>ctx.contractCardCorrection1224(r),cents=n=>Math.round(n*100);
const reconciledBasis='$1426.07, once — the rate is the whole-event bill. Source Rate 1 $1426.17; charge reconciled to the published card full hire $1426.07.';
let checks=0;const check=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
check('published full hire corrects exactly ten cents through the existing reader',()=>{
 const before=JSON.stringify(row),result=read(row);
 assert.equal(result.amount,1426.07);assert.equal(result.how,'whole event');assert.equal(result.daily,false);
 assert.equal(cents(row.rate_1)-cents(result.amount),10);assert.equal(result.cardCorrection1224.sourceRate,1426.17);
 assert.equal(result.cardCorrection1224.rate,1426.07);assert.equal(result.basis,reconciledBasis);
 assert.equal(JSON.stringify(row),before);assert.equal(copy(row).branch_code,'KINP');
});
check('calculation copy changes no identity, allocation, quantity or category',()=>{
 const corrected=copy(row);assert.notEqual(corrected,row);
 for(const key of Object.keys(row))if(key!=='rate_1')assert.equal(corrected[key],row[key],key);
});
check('second verified identity corrects one cent without migrating the hire or its dates',()=>{
 const before=JSON.stringify(otherRow),corrected=copy(otherRow),result=read(otherRow);
 assert.equal(result.amount,1426.07);assert.equal(cents(otherRow.rate_1)-cents(result.amount),1);
 assert.equal(result.cardCorrection1224.sourceRate,1426.08);
 assert.match(result.basis,/Source Rate 1 \$1426\.08; charge reconciled/);
 for(const key of Object.keys(otherRow))if(key!=='rate_1')assert.equal(corrected[key],otherRow[key],key);
 assert.equal(JSON.stringify(otherRow),before);
});
check('second correction requires its exact retained identity and respects explicit rates',()=>{
 for(const changed of [{line:63},{asset_no:'1189412'},{match:{key:'P41'}},{rate_1:1426.09},{rate_1:1426.07},{quantity:2},{branch_code:'NVAC'}]){
  const input={...otherRow,...changed};assert.equal(copy(input),input);
 }
 for(const value of [0,1426.08,1500]){typed=value;assert.equal(copy(otherRow),otherRow);}
 typed=null;
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
ctx.contractCharge=read;
ctx.esc=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const wordsStart=html.indexOf('function contractMoneyWords(r){'),wordsEnd=html.indexOf('/* the block that hangs under a schedule row',wordsStart);
assert(wordsStart>=0&&wordsEnd>wordsStart,'Contract detail renderer was not found');
vm.runInContext(html.slice(wordsStart,wordsEnd),ctx);
const visible=markup=>markup.replace(/<[^>]*>/g,'');
check('contract details visibly explain both the retained rate and corrected charge',()=>{
 const before=JSON.stringify(row),markup=ctx.contractMoneyWords(row),text=visible(markup);
 assert.match(text,/On the contract: Rate 1 \$1426\.17 W/);
 assert.match(text,/charges \$1426\.07/);assert(text.includes(read(row).basis));
 assert.match(markup,/class="contract-card1224"/);assert.equal(JSON.stringify(row),before);
});
let groupRows=[row];
ctx.contractRowsFor=()=>groupRows;
ctx.contractFigures=rows=>({charge:rows.reduce((sum,r)=>sum+read(r).amount,0),daily:{lines:0}});
ctx.fmtNum=String;
const cellStart=html.indexOf(' const contractCell = name => {'),cellEnd=html.indexOf(' const rows = groupList.map',cellStart);
assert(cellStart>=0&&cellEnd>cellStart,'Grouped contract rate renderer was not found');
vm.runInContext(html.slice(cellStart,cellEnd)+'\nglobalThis.contractCellTest1224=contractCell;',ctx);
check('grouped contract source rates show the same reconciliation basis and reference',()=>{
 groupRows=[row,otherRow];
 const markup=ctx.contractCellTest1224('Building 6m'),text=visible(markup);
 assert.match(text,/\$1426\.17/);assert.match(text,/charges \$2852\.14/);
 assert(text.includes('P41: '+read(row).basis));assert.match(markup,/class="w contract-card1224"/);
 assert(text.includes('P39: '+read(otherRow).basis));
});
check('unrelated rows and explicit rates never show a misleading reconciliation note',()=>{
 for(const input of [{...row,line:64},row]){
  typed=input.line===63?1500:null;groupRows=[input];
  for(const markup of [ctx.contractMoneyWords(input),ctx.contractCellTest1224('Building 6m')]){
   assert(!markup.includes('contract-card1224'));assert(!visible(markup).includes('reconciled'));
  }
 }
 typed=null;
});
console.log(JSON.stringify({passed:checks,failed:0,record_writes:0,network:false}));
