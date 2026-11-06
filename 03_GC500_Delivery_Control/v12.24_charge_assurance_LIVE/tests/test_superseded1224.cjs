// Author: Andrew Fisher. Synthetic reservation transitions; no source amounts or record writes.
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert(process.env.PAGE,'PAGE must identify the patched candidate');
const html=fs.readFileSync(process.env.PAGE,'utf8');
const start=html.indexOf("(function(root){\n'use strict';\nconst config=()=>EventConfig1013.current();");
const ending="})(typeof window==='undefined'?globalThis:window);",end=html.indexOf(ending,start);
assert(start>=0&&end>start,'Shared generator model not found');
const config={eventFrom:'2040-01-06',offhire:'2040-01-08',invoiceMonth:'2040-01',eventValid:true,invoiceValid:true,dayCount:3};
const ctx=vm.createContext({console,EventConfig1013:{current:()=>config,short:x=>x,issue:()=> 'Fixture configuration issue',invoiceWords:()=> 'Fixture invoice'}});
vm.runInContext(html.slice(start,end+ending.length),ctx);
const G=ctx.GeneratorFinance1004,copy=x=>JSON.parse(JSON.stringify(x));
let checks=0;const check=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
function fixture(){
 const row=(line,asset)=>({rental_contract:'9961976',line,asset_no:asset,asset_no_is_plant_number:!!asset,quantity:1,branch_code:'NVAC',family:'generator',kind:'generator',charge_line:false,rate_1:90,rate_type:'W',status_as_written:'Pending',delivered:false,start_date:null});
 const old=row(13,'1283681'),current=row(15,null),other={...row(99,'UNIT-X'),rental_contract:'FIXTURE'};
 const make=(r,ref,arrived)=>({id:ref?'ref:'+ref:'contract:'+G.key(r),ref,refLabel:ref||'Synthetic reservation',item:ref==='GN10'?'20kva':'60kva',branch:'NVAC',qty:1,contractRows:[r],contractDeliveries:[{id:G.key(r),quantity:1,actualIsConfirmed:false,deliveredDate:null,assetNumbers:[]}],assetNumbers:[],actualIsConfirmed:arrived,actualQuantity:arrived?1:0,deliveredDate:arrived?'2040-01-04':null,deliverySource:arrived?'Recorded on-site arrival (AEST)':null,plannedDate:'2040-01-04',issues:[]});
 const inputs=[make(old,null,false),make(current,'GN10',true),make(other,null,false)];
 const units=[{id:'fixture-unit',ref:'GN10',owner:'coates',assetNo:'1283681',physical:true,active:true,item:'20kva',identityReview:''}];
 const env={lineRate:()=>null,weeklyRate:()=>null,rehire:()=>false,treatment:()=>null,unitRows:ref=>ref==='GN10'?units:[]};
 return {inputs,units,env};
}
const untouched=(model,id)=>model.rows.find(r=>r.contractIds.includes(id));
check('only the guarded pending reservation is retired; all projections and source records agree',()=>{
 const f=fixture(),before=JSON.stringify(f.inputs),baseline=G.project(f.inputs,{...f.env,unitRows:()=>[]}),m=G.project(f.inputs,f.env),r=m.contracts.get('9961976:13');
 assert.equal(r.treatment,'superseded_forecast');assert.equal(r.amount,0);assert.equal(r.actual,0);assert.equal(r.remaining,0);assert.equal(r.forecast,0);assert.equal(r.arrived,false);
 assert.equal(m.actual,baseline.actual);assert.equal(m.forecast,baseline.forecast-baseline.contracts.get('9961976:13').forecast);assert.equal(m.remaining,baseline.remaining-baseline.contracts.get('9961976:13').remaining);
 assert.equal(m.hireRemaining,m.remaining);assert.equal(m.byBranch[0].forecast,m.forecast);assert.equal(m.unpriced.length,0);
 assert.equal(JSON.stringify(untouched(m,'9961976:15')),JSON.stringify(untouched(baseline,'9961976:15')));assert.equal(JSON.stringify(untouched(m,'FIXTURE:99')),JSON.stringify(untouched(baseline,'FIXTURE:99')));
 assert.equal(JSON.stringify(m.contracts.get('9961976:15')),JSON.stringify(baseline.contracts.get('9961976:15')));assert.equal(JSON.stringify(f.inputs),before);
 const held=untouched(m,'9961976:13');assert.equal(held.treatment,'superseded_forecast');assert.equal(held.contractIds.join(','),'9961976:13');assert.equal(held.actualIsConfirmed,false);
});
check('requested generator pricing is preserved even when the supplied machine description differs',()=>{
 const f=fixture();f.inputs[1].contractRows[0].rate_1=null;f.inputs[1].contractRows[0].description='Generator 60kVA';
 const baseline=G.project(f.inputs,{...f.env,unitRows:()=>[]}),m=G.project(f.inputs,f.env);
 assert.equal(untouched(m,'9961976:15').requestedKva,20);assert.equal(untouched(m,'9961976:15').pricedKva,20);
 assert.equal(JSON.stringify(untouched(m,'9961976:15')),JSON.stringify(untouched(baseline,'9961976:15')));assert.equal(m.contracts.get('9961976:13').treatment,'superseded_forecast');
});
const guards=[
 ['different source contract',f=>f.inputs[0].contractRows[0].rental_contract='OTHER'],
 ['different source line',f=>f.inputs[0].contractRows[0].line=14],
 ['different source asset',f=>f.inputs[0].contractRows[0].asset_no='OTHER'],
 ['unconfirmed source asset identity',f=>f.inputs[0].contractRows[0].asset_no_is_plant_number=false],
 ['different source quantity',f=>f.inputs[0].contractRows[0].quantity=2],
 ['different source branch',f=>f.inputs[0].contractRows[0].branch_code='OTHER'],
 ['source called off',f=>f.inputs[0].contractRows[0].status_as_written='Delivered'],
 ['source delivery tick',f=>f.inputs[0].contractRows[0].delivered=true],
 ['earlier actual hire start',f=>f.inputs[0].contractRows[0].start_date='2039-12-01'],
 ['earlier returned hire',f=>f.inputs[0].contractRows[0].term_date='2039-12-31'],
 ['earlier return docket',f=>f.inputs[0].contractRows[0].return_number='FIXTURE-RETURN'],
 ['successive hire swap',f=>f.inputs[0].contractRows[0].swap_from_line=12],
 ['explicit native charge override',f=>f.env.lineRate=id=>id==='c|9961976|13'?75:null],
 ['explicit native zero override',f=>f.env.lineRate=id=>id==='c|9961976|13'?0:null],
 ['new source reference',f=>f.inputs[0].ref='OTHER'],
 ['native actual arrival',f=>{f.inputs[0].actualIsConfirmed=true;f.inputs[0].actualQuantity=1;f.inputs[0].deliveredDate='2040-01-04';}],
 ['source receipt evidence',f=>f.inputs[0].contractDeliveries[0].actualIsConfirmed=true],
 ['duplicate current reference',f=>f.inputs.push(copy(f.inputs[1]))],
 ['current receipt unticked',f=>f.inputs[1].actualIsConfirmed=false],
 ['current receipt date missing',f=>f.inputs[1].deliveredDate=null],
 ['current quantity changed',f=>f.inputs[1].qty=2],
 ['current received quantity changed',f=>f.inputs[1].actualQuantity=0],
 ['current requested size changed',f=>f.inputs[1].item='60kva'],
 ['current cancelled',f=>f.inputs[1].cancelled=true],
 ['current asset moved',f=>f.inputs[1].asset={_movedTo:'OTHER'}],
 ['current branch changed',f=>f.inputs[1].branch='OTHER'],
 ['current coverage missing',f=>f.inputs[1].contractRows=[]],
 ['different current contract',f=>f.inputs[1].contractRows[0].rental_contract='OTHER'],
 ['different current line',f=>f.inputs[1].contractRows[0].line=16],
 ['additional current allocation',f=>f.inputs[1].contractRows.push({...f.inputs[1].contractRows[0],line:16})],
 ['no physical identity',f=>f.units.splice(0)],
 ['historical identity only',f=>f.units[0].physical=false],
 ['inactive identity',f=>f.units[0].active=false],
 ['different active asset',f=>f.units[0].assetNo='OTHER'],
 ['different owner',f=>f.units[0].owner='other'],
 ['different identity reference',f=>f.units[0].ref='OTHER'],
 ['missing identity id',f=>f.units[0].id=''],
 ['identity needs review',f=>f.units[0].identityReview='Conflict'],
 ['ambiguous physical units',f=>f.units.push({...f.units[0],id:'other-unit'})],
 ['existing active exclusion',f=>f.env.treatment=r=>r.line===15?{kind:'own_use',label:'Fixture exclusion'}:null]
];
for(const [name,change] of guards)check('preserves reservation when '+name,()=>{
 const f=fixture();change(f);assert.equal(G.superseded1224(f.inputs[0].contractRows[0],f.inputs[0],f.inputs,f.env),null);
 const m=G.project(f.inputs,f.env),r=m.contracts.get(G.key(f.inputs[0].contractRows[0]));assert.notEqual(r?.treatment,'superseded_forecast');
});
check('confirmed earlier actual hire survives alongside later hire for the same physical asset',()=>{
 const f=fixture(),old=f.inputs[0];Object.assign(old,{actualIsConfirmed:true,actualQuantity:1,deliveredDate:'2040-01-02'});Object.assign(old.contractRows[0],{delivered:true,start_date:'2040-01-02',status_as_written:'Delivered'});
 const m=G.project(f.inputs,f.env),baseline=G.project(f.inputs,{...f.env,unitRows:()=>[]});assert.equal(m.actual,baseline.actual);assert.equal(m.forecast,baseline.forecast);assert(m.contracts.get('9961976:13').actual>0);
});
check('new native receipt charges the old line even while its source still says Pending',()=>{
 const f=fixture(),old=f.inputs[0];Object.assign(old,{actualIsConfirmed:true,actualQuantity:1,deliveredDate:'2040-01-04'});
 assert.equal(old.contractRows[0].status_as_written,'Pending');assert.equal(old.contractRows[0].delivered,false);
 const m=G.project(f.inputs,f.env),baseline=G.project(f.inputs,{...f.env,unitRows:()=>[]});assert(m.contracts.get('9961976:13').actual>0);assert.equal(m.actual,baseline.actual);assert.equal(m.forecast,baseline.forecast);
});
check('history rows do not count as current physical units',()=>{
 const f=fixture();f.units.push({...f.units[0],id:'history',assetNo:'OLD-UNIT',active:false,physical:false});assert.equal(G.project(f.inputs,f.env).contracts.get('9961976:13').treatment,'superseded_forecast');
});
check('existing source decisions retain priority',()=>{
 const f=fixture();f.env.treatment=r=>r.line===13?{kind:'own_use',label:'Fixture decision'}:null;assert.equal(G.project(f.inputs,f.env).contracts.get('9961976:13').treatment,'own_use');
});
check('conditional pending treatment on a confirmed current receipt does not create a second hire',()=>{
 const f=fixture();f.env.treatment=r=>r.line===15?{kind:'pending_no_charge',label:'Fixture pending decision'}:null;const m=G.project(f.inputs,f.env);assert.equal(m.contracts.get('9961976:13').treatment,'superseded_forecast');assert(m.contracts.get('9961976:15').actual>0);
});
check('invalid invoice configuration cannot be mistaken for priced current coverage',()=>{
 const f=fixture();config.invoiceValid=false;assert.equal(G.superseded1224(f.inputs[0].contractRows[0],f.inputs[0],f.inputs,f.env),null);config.invoiceValid=true;
});
check('canonical unit reader is used without recalling the generator model',()=>{
 const f=fixture(),from=html.indexOf('function generatorModel1004(){'),to=html.indexOf('function generatorContract1004',from);assert(from>=0&&to>from);
 let nested=false,reads=0;const asset={key:'GN10'};
 Object.assign(ctx,{heldMemo:(key,fn)=>{assert(!nested,'Recursive financial model read');nested=true;try{return fn();}finally{nested=false;}},holdAssets:fn=>fn(),generatorInputs1004:()=>f.inputs,contractTreatment747:()=>null,assetOf:ref=>{assert.equal(ref,'GN10');return asset;},gcModel925:(a,options)=>{assert.equal(a,asset);assert.equal(options.loading,false);reads++;return {rows:f.units};},lr748Typed:()=>null,S:{rates:{}},finance928ContractOwner:()=>({rehire:false})});
 vm.runInContext(html.slice(from,to),ctx);const m=ctx.generatorModel1004();assert.equal(m.contracts.get('9961976:13').treatment,'superseded_forecast');assert.equal(reads,1);
});
console.log(JSON.stringify({passed:checks,failed:0,record_writes:0,network:false}));
