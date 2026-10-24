/* Author: Andrew Fisher. Synthetic fixtures only; no network or shared-record writes. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const API = require('./financialAssociation1105_src.js');
const clone = x => JSON.parse(JSON.stringify(x));
let checks = 0;
const test = (label, fn) => { fn(); checks++; };
function fixture() {
  const raw = {line:8,status_as_written:'Delivered',item_type_code:1,item:'5512345',description:'Synthetic access machine',quantity:1,price:0,rate_1:12.34,rate_2:0,rate_3:0,rate_4:0,rate_5:0,expected_term_date:'2030-05-12',number_of_days:7,sales_analysis_code:'TEST-HIR',contract_start:'2030-05-07',start_time_as_written:'08:00',rate_type:'W',delivery_number:'test-only',booked_delivery_date:'2030-05-07',booked_pickup_date:'2030-05-12',minimum_days:1,serial:'synthetic',rate_id:'synthetic',rate_classification:'test evidence',hold_billing:false,rental_contract:'777001',branch_code:'TEST',asset_no:'5512345',asset_no_is_plant_number:true,what:'Synthetic access machine',family:'access',kind:'access',charge_line:false,subhired:false,supplier_sub_rental:null,start_date:null,start_time:null,term_date:null,demob_date:null,delivered:false};
  return {schema:2,mode:'single-own-fleet-access-full-event-native-override',source:{file:'synthetic.xlsx',sha256:'a'.repeat(64),sheet:'Synthetic',row:9,cells:{rate_1:'J9',line:'A9',item:'D9',quantity:'G9'},excluded_columns:['Excluded source-only field'],basis:'Synthetic fixture'},rawSourceRow:raw,row:{...raw,register_type:'Synthetic machine',minimum_days:null},binding:{ref:'EQTEST',assetNo:'5512345',requestedItem:'Synthetic machine',quantity:1,owner:'coates',branch:'TEST',contract:'777001',line:8},financialRule:{nativeOverrideKey:'c|777001|8',basis:'whole-event',from:'2030-05-09',to:'2030-05-11',dayCount:3,quantity:1,requiresExplicitNativeOverride:true,sourceRateDoesNotImplyEventTotal:true}};
}
function scope() { return {ref:'EQTEST',item:'Synthetic machine',quantity:1,active:true,branch:'TEST',contract:'777001',nativeAdded:true,nativeNumbers:['5512345'],units:[{physical:true,source:'native',owner:'coates',assetNo:'5512345',item:'Synthetic machine'}],conflictingRate:false,conflictingWeeks:false,conflictingMinimum:false}; }
const input = fixture(), original = JSON.stringify(input), unrelated = {rental_contract:'777002',line:1,asset_no:'5512346',asset_no_is_plant_number:true,charge_line:false,rate_1:45};
test('valid private schema', () => assert.equal(API.validate(input), input));
for (const [label, mutate] of [
  ['unknown payload field', p => p.prebill=10], ['wrong schema',p=>p.schema=1], ['unknown row field',p=>p.row.prebill=10],
  ['raw source changed',p=>p.rawSourceRow.rate_1=99], ['source hash',p=>p.source.sha256='bad'], ['source row',p=>p.source.row=1],
  ['source cells',p=>p.source.cells.rate_1='J10'], ['unrelated source cells',p=>p.source.cells.prebill='I9'],
  ['branch category',p=>p.row.sales_analysis_code='TEST-FRI'], ['multiple units',p=>p.row.quantity=2],
  ['nonfinite source rate',p=>p.row.rate_1=Infinity], ['fractional cents',p=>p.row.rate_1=1.005], ['negative rate',p=>p.row.rate_1=-1],
  ['transport price',p=>p.row.price=1], ['second rate',p=>p.row.rate_2=1], ['supplier',p=>p.row.supplier_sub_rental='Supplier'],
  ['subhire',p=>p.row.subhired=true], ['charge line',p=>p.row.charge_line=true], ['held source',p=>p.row.hold_billing=true],
  ['actual start',p=>p.row.start_date='2030-05-07'], ['actual end',p=>p.row.term_date='2030-05-12'], ['arrival inferred',p=>p.row.delivered=true],
  ['minimum inferred',p=>p.row.minimum_days=1], ['invalid planned day',p=>p.row.booked_delivery_date='2030-02-31'],
  ['wrong fleet',p=>p.binding.assetNo='5512346'], ['wrong contract',p=>p.binding.contract='777002'], ['wrong line',p=>p.binding.line=9],
  ['wrong item',p=>p.binding.requestedItem='Different machine'], ['subhire owner',p=>p.binding.owner='supplier'],
  ['wrong override key',p=>p.financialRule.nativeOverrideKey='c|777001|9'], ['daily override',p=>p.financialRule.basis='daily'],
  ['automatic source pricing',p=>p.financialRule.requiresExplicitNativeOverride=false], ['invalid window',p=>p.financialRule.to='2030-05-08'],
  ['invalid duration',p=>p.financialRule.dayCount=4], ['indefinite duration',p=>p.financialRule.to='2031-05-11']
]) test(label, () => { const p=clone(input);mutate(p);assert.throws(()=>API.validate(p)); });
const projected = API.project([unrelated], input), row = projected.row;
test('one addition only',()=>assert.deepEqual(projected.rows,[unrelated,row]));
test('unrelated identity preserved',()=>assert.equal(projected.rows[0],unrelated));
test('input untouched',()=>assert.equal(JSON.stringify(input),original));
test('original rate preserved',()=>assert.equal(row.rate_1,12.34));
test('raw minimum retained only as evidence',()=>{assert.equal(row.minimum_days,null);assert.equal(row[API.tag].rawSourceRow.minimum_days,1);});
test('raw source copy independent',()=>{row[API.tag].source.file='changed copy';assert.equal(input.source.file,'synthetic.xlsx');row[API.tag].source.file='synthetic.xlsx';});
test('identical repeated projection no-op',()=>{const r=API.project(projected.rows,input);assert.equal(r.changed,false);assert.equal(r.rows,projected.rows);});
test('different existing row rejected',()=>assert.throws(()=>API.project([{...row,rate_1:99}],input)));
test('duplicate contract line rejected',()=>assert.throws(()=>API.project([row,row],input)));
test('different hire for same fleet rejected',()=>assert.throws(()=>API.project([{...unrelated,asset_no:input.binding.assetNo}],input)));
test('idempotent row cannot hide a competing hire association',()=>assert.throws(()=>API.project([row,{...unrelated,asset_no:input.binding.assetNo}],input)));
test('source charge line is not a second hire',()=>assert.equal(API.project([{...unrelated,asset_no:input.binding.assetNo,charge_line:true}],input).changed,true));
test('calculation copy masks only raw rate',()=>assert.deepEqual(API.calculationCopy(row),{...row,rate_1:null}));
test('calculation source remains numeric',()=>assert.equal(row.rate_1,12.34));
test('unrelated calculation same object',()=>assert.equal(API.calculationCopy(unrelated),unrelated));
test('native binding verified',()=>assert.deepEqual(API.bindingStatus(input,[scope()]),{ok:true,reason:null}));
for(const [label,mutate] of [
  ['inactive scope',s=>s.active=false],['quantity changed',s=>s.quantity=2],['branch changed',s=>s.branch='OTHER'],
  ['contract changed',s=>s.contract='777002'],['source-derived identity only',s=>s.nativeAdded=false],['raw native number absent',s=>s.nativeNumbers=[]],
  ['wrong physical fleet',s=>s.units[0].assetNo='5512346'],['wrong physical owner',s=>s.units[0].owner='supplier'],
  ['wrong physical item',s=>s.units[0].item='Different'],['historical unit',s=>s.units[0].source='history'],['nonphysical unit',s=>s.units[0].physical=false],
  ['multiple physical units',s=>s.units.push({...s.units[0]})],['conflicting rate',s=>s.conflictingRate=true],['conflicting weeks',s=>s.conflictingWeeks=true],['conflicting minimum',s=>s.conflictingMinimum=true]
]) test(label,()=>{const s=scope();mutate(s);assert.equal(API.bindingStatus(input,[s]).ok,false);});
test('duplicate scope rejected',()=>assert.equal(API.bindingStatus(input,[scope(),scope()]).ok,false));
test('duplicate fleet elsewhere rejected',()=>assert.equal(API.bindingStatus(input,[scope(),{...scope(),ref:'OTHER'}]).ok,false));
test('unrelated reference retained',()=>assert.equal(API.bindingStatus(input,[scope(),{...scope(),ref:'OTHER',units:[]}]).ok,true));
test('missing scopes stay pending',()=>assert.equal(API.bindingStatus(input,null).ok,false));
for(const v of ['',null,undefined,{},[],NaN,Infinity,-1,'1.234','1000000.01'])test('invalid native amount '+String(v),()=>assert.equal(API.readOverride(v),null));
test('native decimal string',()=>assert.equal(API.readOverride('37.02'),37.02));
test('explicit zero is a valid amount',()=>assert.equal(API.readOverride('0'),0));
const charge=copy=>({amount:37.02,how:'whole event',daily:false,filled:'typed'});
test('pending until explicit override',()=>assert.equal(API.price(row,{ok:true},null,charge).amount,null));
test('invalid binding pending',()=>assert.equal(API.price(row,{ok:false,reason:'conflict'},'37.02',charge).amount,null));
test('native full event applied once',()=>{const x=API.price(row,{ok:true},'37.02',copy=>{assert.equal(copy.rate_1,null);return charge(copy);});assert.equal(x.amount,37.02);assert.equal(x.filled,'typed');assert.match(x.basis,/quantity applied once/);});
test('calculator reinterpretation rejected',()=>assert.equal(API.price(row,{ok:true},'37.02',()=>({amount:111.06,daily:false})).amount,null));
test('daily reinterpretation rejected',()=>assert.equal(API.price(row,{ok:true},'37.02',()=>({amount:37.02,daily:true})).amount,null));
test('unrelated native result retained',()=>assert.equal(API.price(unrelated,null,null,r=>r),unrelated));
test('fallback same amount not second line',()=>assert.deepEqual(API.rateFallback({value:null},row,{ok:true},'37.02','EQTEST','Synthetic machine'),{value:37.02,per:'flat',source:'contract',sourceContractLine:'777001|8',financialAssociation1105:true}));
test('existing typed fallback preserved',()=>{const v={value:55,per:'week'};assert.equal(API.rateFallback(v,row,{ok:true},'37.02','EQTEST','Synthetic machine'),v);});
test('unrelated fallback unchanged',()=>{const v={value:null};assert.equal(API.rateFallback(v,row,{ok:true},'37.02','OTHER','Synthetic machine'),v);});

function browser() {
  const p=fixture(), s=scope();
  const ctx={FinancialAssociation1105:API,document:{getElementById:id=>id==='financial-association1105-data'?{textContent:JSON.stringify([p])}:null},ONHIRE_ROWS:[clone(unrelated)],S:{added:[{key:s.ref,asset_numbers:s.nativeNumbers.slice()}],lineRates:{},rates:{},weeks:{},minDays:{}},allAssets:()=>[{key:s.ref,discipline:'Synthetic access',_cancelled:!s.active}],gcModel925:()=>({rows:s.units}),chargeLines:()=>[{item:s.item,quantity:s.quantity}],qtyOf:l=>l.quantity,branchOf:()=>({code:s.branch}),contractOf:()=>({id:s.contract}),movedAway:()=>false,holdAssets:f=>f(),heldMemo:(_,f)=>f(),sharedCache975:()=>{},rateFor:()=>({value:null}),lr748For:r=>typeof r.rate_1==='number'?null:{rate:Number(ctx.S.lineRates['c|'+r.rental_contract+'|'+r.line]),from:'typed'},contractCharge:r=>({amount:typeof r.rate_1==='number'?r.rate_1:ctx.lr748For(r)?.rate,how:'whole event',daily:false,filled:typeof r.rate_1==='number'?null:'typed'})};
  ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'financialAssociation1105_browser.js'),'utf8'),ctx);return {ctx,s,p};
}
test('browser adapter does not write native state',()=>{const {ctx}=browser();assert.equal(Object.keys(ctx.S.lineRates).length,0);assert.equal(ctx.ONHIRE_ROWS.length,2);assert.equal(ctx.financialAssociation1105Readback().charge.amount,null);});
test('browser native override and fallback agree',()=>{const {ctx}=browser();ctx.S.lineRates['c|777001|8']='37.02';assert.equal(ctx.financialAssociation1105Readback().charge.amount,37.02);assert.equal(ctx.rateFor('Synthetic access','Synthetic machine','EQTEST').value,37.02);assert.equal(ctx.financialAssociation1105Readback().sourceRate,12.34);});
test('browser unrelated charge preserved',()=>{const {ctx}=browser();assert.equal(ctx.contractCharge(unrelated).amount,45);});
test('browser identity change makes amount pending',()=>{const {ctx,s}=browser();ctx.S.lineRates['c|777001|8']='37.02';s.units[0].assetNo='5512346';assert.equal(ctx.financialAssociation1105Readback().charge.amount,null);});
test('browser source-derived identity cannot verify itself',()=>{const {ctx}=browser();ctx.S.added[0].asset_numbers=[];ctx.S.lineRates['c|777001|8']='37.02';assert.equal(ctx.financialAssociation1105Readback().charge.amount,null);});
test('browser global rate conflict stays pending',()=>{const {ctx}=browser();ctx.S.rates['Synthetic access|Synthetic machine']='99';ctx.S.lineRates['c|777001|8']='37.02';assert.equal(ctx.financialAssociation1105Readback().charge.amount,null);});
test('browser reentrant identity dependency fails closed without recursion',()=>{const {ctx}=browser();ctx.S.lineRates['c|777001|8']='37.02';let calls=0;ctx.gcModel925=()=>{calls++;ctx.rateFor('Synthetic access','Synthetic machine','EQTEST');return {rows:scope().units};};assert.equal(ctx.financialAssociation1105Status().ok,false);assert.equal(calls,1);});
test('browser identity guard recovers after an exception',()=>{const {ctx}=browser(),old=ctx.gcModel925;ctx.gcModel925=()=>{throw Error('synthetic dependency failure');};assert.throws(()=>ctx.financialAssociation1105Status());ctx.gcModel925=old;assert.equal(ctx.financialAssociation1105Status().ok,true);});
console.log(JSON.stringify({author:'Andrew Fisher',status:'passed',checks,fixtures:'synthetic only',networkCalls:0,productionWrites:0}));
module.exports = {fixture};
