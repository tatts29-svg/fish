/* Author: Andrew Fisher. Independent quantity grammar and source-preservation checks. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const sourcePath=path.join(__dirname,'description_quantity1012.js');
const source=fs.readFileSync(sourcePath,'utf8'),ctx={};
vm.createContext(ctx);vm.runInContext(source,ctx,{filename:sourcePath});
const checks=[],failures=[];
function check(label,fn){try{fn();checks.push({label,pass:true});}catch(e){checks.push({label,pass:false,error:e.message});failures.push(label);}}
const q=(item,quantity=null,description)=>ctx.descriptionQuantity1012({item,quantity,description}).quantity;
for(const [label,item,quantity,want] of [
 ['missing FWF is one','FWF',null,1],['blank FWF is one','FWF','',1],
 ['recorded zero remains zero','FWF',0,0],['recorded four wins over description','FWF qty 3',4,4],
 ['recorded numeric string wins','FWF qty 3','4',4],['recorded decimal remains decimal','Fence',1.25,1.25],
 ['negative recorded quantity stays invalid','FWF',-3,null],['nonfinite quantity stays invalid','FWF',Infinity,null],
 ['invalid recorded quantity stays invalid','FWF','TBC',null],
 ['qty label','FWF qty 3',null,3],['uppercase label','FWF QTY: 3',null,3],
 ['quantity equals label','FWF quantity=3',null,3],['compact qty label','FWF qty3',null,3],
 ['zero description quantity','FWF qty 0',null,0],['thousands description quantity','FWF qty 1,000',null,1000],
 ['negative description quantity stays invalid','FWF qty -3',null,null],
 ['incomplete label stays invalid','FWF qty',null,null],['invalid label stays invalid','FWF qty TBC',null,null],
 ['conflicting labels stay invalid','FWF qty3; quantity4',null,null],
 ['duplicate matching labels count once','FWF qty3; quantity3',null,3],
 ['leading multiplication','3 x FWF',null,3],['leading compact multiplication','3xFWF',null,3],
 ['leading typographic multiplication','3 × FWF',null,3],['trailing multiplication','FWF x 3',null,3],
 ['trailing compact multiplication','FWFx3',null,3],['sized described item times count','Building 6m × 3',null,3],
 ['generator rating not quantity','200kVA generator',null,1],['building length not quantity','Building 6m',null,1],
 ['toilet capacity not quantity','16Pan Block',null,1],['voltage and frequency not quantity','Generator 200kVA 50Hz 415V',null,1],
 ['millimetre dimensions not quantity','6000 × 3000mm',null,1],['metre dimensions not quantity','6m x 3m',null,1],
 ['prefixed unlabelled dimensions not quantity','Building 6000 x 3000',null,1],
 ['prefixed small dimensions not quantity','Building 6 x 3',null,1],
 ['three-part dimensions not quantity','Building 6m x 3m x 2.4',null,1],
 ['explicit quantity beside dimensions is recognised','Building 6m x 3m qty2',null,2],
 ['dimensions before name not quantity','6 x 3 Building',null,1],
 ['asset number not quantity','FWF asset 0003',null,1],['reference number not quantity','WC09 toilet',null,1],
 ['generator reference not quantity','GN20 generator',null,1],['prose separator is not another item','200kVA generator & cables',null,1],
 ['empty item remains without quantity','',null,null]
])check(label,()=>assert.equal(q(item,quantity),want));
check('line description explicit count is recognised',()=>assert.equal(q('FWF',null,'qty 3'),3));
check('context explicit count is recognised',()=>assert.equal(ctx.descriptionQuantity1012({item:'FWF'},'Location, qty 3').quantity,3));
check('legacy default replaced by explicit description count',()=>assert.equal(ctx.descriptionQuantity1012({item:'Building 6m qty3',quantity:1,quantity_auto:true,quantity_on_the_schedule:null}).quantity,3));
check('typed quantity wins over old legacy metadata',()=>assert.equal(ctx.descriptionQuantity1012({item:'FWF qty3',quantity:4,quantity_auto:true,quantity_on_the_schedule:null,quantity_state:'typed over the schedule'}).quantity,4));
check('contract-derived quantity stays authoritative',()=>assert.equal(ctx.descriptionQuantity1012({item:'Waste tank',quantity:2,quantity_auto:true,quantity_state:'from the contract'}).quantity,2));
check('separate structured lines each count once',()=>assert.deepEqual(['FWF','Waste tank','Building 6m'].map(item=>q(item)),[1,1,1]));
check('inferred line clones source and becomes consistently priceable',()=>{const raw={item:'FWF',quantity:null,priceable:false,quantity_state:'blank source'},before=JSON.stringify(raw),got=ctx.descriptionLine1012(raw);assert.notEqual(got,raw);assert.equal(got.quantity,1);assert.equal(got.priceable,true);assert.equal(got.quantity_on_the_schedule,null);assert.equal(got.quantity_state_on_the_schedule,'blank source');assert.equal(JSON.stringify(raw),before);});
check('projection is idempotent including context quantity',()=>{const raw={item:'FWF',quantity:null,priceable:false,quantity_state:'blank source'},once=ctx.descriptionLine1012(raw,'qty3'),twice=ctx.descriptionLine1012(once);assert.equal(JSON.stringify(twice),JSON.stringify(once));assert.equal(ctx.descriptionQuantity1012(twice).quantity,3);});
check('invalid explicit quantity cannot reach direct pricing as negative',()=>{const raw={item:'FWF',quantity:-3,priceable:true},before=JSON.stringify(raw),got=ctx.descriptionLine1012(raw);assert.equal(got.quantity,null);assert.equal(got.priceable,false);assert.equal(JSON.stringify(raw),before);});
check('invalid description quantity cannot retain legacy positive price',()=>{const got=ctx.descriptionLine1012({item:'FWF qty -3',quantity:1,priceable:true,quantity_auto:true,quantity_on_the_schedule:null});assert.equal(got.quantity,null);assert.equal(got.priceable,false);});
for(const [label,event,want] of [
 ['event explicit display preserved',{item:'FWF',quantity_display:'4'},'4'],
 ['event explicit zero display preserved',{item:'FWF',quantity_display:'0'},'0'],
 ['event partial delivery display preserved',{item:'FWF',quantity_display:'2'},'2'],
 ['event explicit raw preserved',{item:'FWF',quantity_raw:4,quantity_display:'4'},'4'],
 ['event explicit zero raw preserved',{item:'FWF',quantity_raw:0,quantity_display:'0'},'0'],
 ['blank event derives sole shared item quantity',{item:'FWF',quantity_display:'blank'},'6']
])check(label,()=>{const before=JSON.stringify(event),got=ctx.descriptionEvent1012(event,[{item:'FWF',quantity:6}],[event]);assert.equal(got.quantity_display,want);assert.equal(JSON.stringify(event),before);});
check('mixed item reference context does not multiply another item',()=>{const lines=[{item:'FWF',quantity:3},{item:'Waste tank',quantity:1}],events=[{item:'FWF'},{item:'Waste tank'}];const got=events.map(e=>ctx.descriptionEvent1012(e,lines,events,'FWF qty3'));assert.deepEqual(got.map(e=>e.quantity_raw),[3,1]);});
check('reference prose cannot replace recorded shared quantity in blank event',()=>{const event={item:'FWF'},got=ctx.descriptionEvent1012(event,[{item:'FWF',quantity:4}],[event],'FWF qty3');assert.equal(got.quantity_raw,4);});
check('event description count wins for that event',()=>{const event={item:'FWF',description:'qty2'},got=ctx.descriptionEvent1012(event,[{item:'FWF',quantity:6}],[event]);assert.equal(got.quantity_raw,2);});
check('separate unquantified delivery descriptions each count one',()=>{const lines=[{item:'FWF',quantity:6}],events=[{item:'FWF',date:'2026-10-13'},{item:'FWF',date:'2026-10-14'}];assert.deepEqual(events.map(e=>ctx.descriptionEvent1012(e,lines,events).quantity_raw),[1,1]);});
check('build and removal directions each retain full shared quantity',()=>{const lines=[{item:'FWF',quantity:6}],events=[{item:'FWF',movement:'place'},{item:'FWF',movement:'remove'}];assert.deepEqual(events.map(e=>ctx.descriptionEvent1012(e,lines,events).quantity_raw),[6,6]);});
const result={author:'Andrew Fisher',scope:'Independent pure quantity parsing, unit boundaries, precedence, shared line projection and original-source preservation',sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),checks,passed:checks.length-failures.length,total:checks.length,failures};
console.log(JSON.stringify(result,null,2));
if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(result,null,2)+'\n');
if(failures.length)process.exitCode=1;
