// Author: Andrew Fisher. Synthetic native-source control checks; no browser, network or records.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../charge1239_src.js'),'utf8');
const guard=" if(rawRecord(key)==null&&capability()!=='edit')return ''; // No control or retained decision is shown; avoid resolving its source.\n";
assert.equal(source.split(guard).length,2,'One bounded no-decision guard is required');
const original=source.replace(guard,''),KEY='c|SYNTHETIC-CONTROL|1',checks=[];
const clone=v=>JSON.parse(JSON.stringify(v));
function test(name,run){run();checks.push(name);}
function fixture(script=source){
 const row={rental_contract:'SYNTHETIC-CONTROL',line:1,quantity:2,description:'Synthetic item',kind:'building',rate_1:7};
 const state={role:'view',scans:0,allocations:0,reserved:0,failScan:false};
 const ctx={S:{answers:{},lineRates:{}},DATA:{},document:{addEventListener(){}},
  capability:()=>state.role,todayIso:()=> '2030-04-10',esc:v=>String(v??''),
  contractCharge:()=>({amount:14}),assetTotal:()=>null,ItemCharges979:{project:()=>({lines:[]})},pricingForecast1010:()=>({rows:[]}),
  contractMoneyWords:()=> 'Native words',card748Html:()=>'',pl767Servicing:()=>'',
  contractAllocation1010(){state.allocations++;return row.allocated?{}:null;},
  contractTreatment747(){state.reserved++;return row.reserved?{}:null;}};
 Object.defineProperty(ctx,'ONHIRE_ROWS',{get(){state.scans++;if(state.failScan)throw new Error('unexpected source resolution');return state.rows||[row];}});
 vm.createContext(ctx);vm.runInContext(script,ctx,{timeout:1000});
 const api=ctx.ChargeTreatment1239;
 function decision(treatment='own_use_hire'){
  const record={schema:1,kind:'customer-charge-treatment',key:KEY,revision:1,treatment,source:clone(api.current(KEY).source),
   reason:'Synthetic decision',evidence:'Synthetic exact source',confirmed_by:'Synthetic approver',confirmed_on:'2030-04-09',
   recorded_by:'Synthetic recorder',recorded_at:'2030-04-09T01:00:00.000Z',history:[]};
  ctx.S.answers[api.PREFIX+KEY]=record;return record;
 }
 function reset(){state.scans=state.allocations=state.reserved=0;}
 return {ctx,row,state,api,decision,reset};
}
test('Original view-only empty control scans the source, new control preserves empty output without scanning',()=>{
 const a=fixture(original),b=fixture();assert.equal(a.api.control(KEY),'');assert.ok(a.state.scans>0);
 b.state.failScan=true;assert.equal(b.api.control(KEY),'');assert.equal(b.state.scans,0);assert.equal(b.state.allocations,0);assert.equal(b.state.reserved,0);
});
test('No-record unknown and view capabilities both skip source resolution',()=>{
 for(const role of ['view','unknown'])for(const value of [undefined,null]){
  const f=fixture();f.state.role=role;f.ctx.S.answers[f.api.PREFIX+KEY]=value;f.state.failScan=true;
  assert.equal(f.api.control(KEY),'');assert.equal(f.state.scans,0);
 }
});
test('Non-edit no-record contract words retain the complete native text',()=>{
 const f=fixture();f.state.failScan=true;assert.equal(f.ctx.contractMoneyWords(f.row),'Native words');assert.equal(f.state.scans,0);
});
for(const variant of ['eligible','allocated','reserved','charge_line','subhired','generator','missing','duplicate'])test('Edit eligibility and markup remain native: '+variant,()=>{
 const a=fixture(original),b=fixture();
 for(const f of[a,b]){
  f.state.role='edit';
  if(['allocated','reserved','charge_line','subhired'].includes(variant))f.row[variant]=true;
  if(variant==='generator')f.row.kind='generator';
  if(variant==='missing')f.state.rows=[];
  if(variant==='duplicate')f.state.rows=[f.row,clone(f.row)];
 }
 const expected=a.api.control(KEY);assert.equal(b.api.control(KEY),expected);assert.equal(b.state.scans,a.state.scans);
 if(variant==='eligible')assert.match(expected,/data-charge1239=/);else assert.equal(expected,'');
});
for(const status of ['active','review','cleared'])for(const role of ['view','edit'])test('Existing '+status+' decision retains source checks and markup for '+role,()=>{
 const a=fixture(original),b=fixture();
 for(const f of[a,b]){
  f.state.role=role;f.decision(status==='cleared'?'standard':'own_use_hire');
  if(status==='review')f.row.rate_1=9;
  assert.equal(f.api.status(KEY).state,status);f.reset();
 }
 assert.equal(b.api.control(KEY),a.api.control(KEY));assert.equal(b.state.scans,a.state.scans);assert.ok(b.state.scans>0);
 assert.equal(b.state.allocations,a.state.allocations);assert.equal(b.state.reserved,a.state.reserved);
 if(status==='review')assert.match(b.api.control(KEY),/needs review/);
});
test('Malformed retained decision is still validated and flagged on the view link',()=>{
 const a=fixture(original),b=fixture();for(const f of[a,b])f.ctx.S.answers[f.api.PREFIX+KEY]={unexpected:true};
 assert.equal(b.api.control(KEY),a.api.control(KEY));assert.match(b.api.control(KEY),/needs review/);assert.ok(b.state.scans>0);
});
test('A new decision on the next call is checked immediately without a redraw or cache reset',()=>{
 const f=fixture();assert.equal(f.api.control(KEY),'');assert.equal(f.state.scans,0);
 f.decision();f.row.rate_1=8;f.reset();assert.match(f.api.control(KEY),/needs review/);assert.ok(f.state.scans>0);
 delete f.ctx.S.answers[f.api.PREFIX+KEY];f.reset();f.state.failScan=true;assert.equal(f.api.control(KEY),'');assert.equal(f.state.scans,0);
});
test('Capability changes affect the next call immediately',()=>{
 const f=fixture();assert.equal(f.api.control(KEY),'');assert.equal(f.state.scans,0);
 f.state.role='edit';assert.match(f.api.control(KEY),/data-charge1239=/);assert.ok(f.state.scans>0);
 f.state.role='view';f.reset();f.state.failScan=true;assert.equal(f.api.control(KEY),'');assert.equal(f.state.scans,0);
});
test('Existing decisions retain native source failure behaviour',()=>{
 const a=fixture(original),b=fixture(),errors=[];for(const f of[a,b]){f.decision();f.state.failScan=true;try{f.api.control(KEY);}catch(e){errors.push({name:e.name,message:e.message});}}
 assert.equal(errors.length,2);assert.deepEqual(errors[1],errors[0]);
});
console.log(JSON.stringify({author:'Andrew Fisher',suite:'charge1239 no-record control',passed:checks.length,failed:0,checks}));
