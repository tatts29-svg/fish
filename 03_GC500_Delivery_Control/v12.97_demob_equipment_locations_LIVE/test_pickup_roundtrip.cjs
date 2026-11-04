/* Author: Andrew Fisher. Native evidence round trip in an isolated synthetic VM. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const P=require('./pickup_locations1297_src.js'),page=process.argv[2]||process.env.PAGE;
if(!page)throw new Error('Pass the source/candidate HTML path; no network or record writes are used.');
const html=fs.readFileSync(page,'utf8'),copy=x=>JSON.parse(JSON.stringify(x));
function section(start,end){const at=html.indexOf(start);assert.ok(at>=0,start);const to=html.indexOf(end,at);assert.ok(to>=0,end);return html.slice(at,to+end.length);}
const evidence=section('/* Author: Andrew Fisher. Read-only Demob reference and collection evidence projection. */',"})(typeof window!=='undefined'?window:globalThis);");
const departure=section('/* Author: Andrew Fisher. One departure projection from native typed collection evidence. Historical hire scope stays intact. */','})(window);');
const key='SYN-A',arrivalAt='2030-01-01T00:00:00Z',captureAt='2030-01-03T00:00:00Z';
const row={id:'unit:a',ref:key,item:'Building',assetNo:'00123',owner:'coates',physical:true,source:'native',nativeId:'native:a'},second={...row,id:'unit:b',assetNo:'00456',nativeId:'native:b'};
const ref={key,a:{key},units:[{type:'Building',n:2}]};
const context={window:{},todayIso:()=> '2030-01-03',demob816:()=>({refs:[ref]}),heldMemo:(k,fn)=>fn(),holdAssets:fn=>fn(),assetOf:()=>ref.a,gcUnits925:()=>[row,second]};
context.window.window=context.window;
vm.createContext(context);vm.runInContext(evidence,context);const E=context.window.DemobProgress996;
const captured=P.capture(key,{capturedAt:captureAt,arrivalAt,units:[row,second],location:{kind:'asset',lat:-28,lon:153.4,how:'Master plan'},fixes:{own:{lat:-28.01,lon:153.41,ref:key,unit:row.assetNo,by:'Synthetic operator',at:'2030-01-02T00:00:00Z'}}});
const items=[{type:'Building',n:1,unitIds:[row.id],numbers:[row.assetNo],physicalUnits:[{id:row.id,number:row.assetNo,owner:row.owner,item:row.item}]}];
const collection={version:1,kind:'collection',id:'synthetic-collection',date:'2030-01-02',departedAt1211:'2030-01-02T10:00:00+10:00',arrivalAt,requiredKey:E.fingerprint(ref.units),scope:'reference',items,complete:false,source:'collect816',pickupLocations1297:P.select(captured,items)};
const record=copy({state:'on site',recorded:true,set_at:arrivalAt,history:[{state:'on site',at:arrivalAt,by:'Synthetic operator'},{state:'on site',at:captureAt,by:'Synthetic operator',collection996:collection}]});
let checks=0;const test=(name,fn)=>{fn();checks++;};
E.record=()=>copy(record);vm.runInContext(departure,context);const D=context.window.Departure1211;
test('serialized history metadata survives native evidence reconstruction',()=>{
 const found=E.evidence(ref,copy(record),'2030-01-03');assert.equal(found.events.length,1);assert.deepEqual(copy(found.events[0].pickupLocations1297),copy(collection.pickupLocations1297));
});
test('Departure1211.read preserves metadata after a fresh cloned record read',()=>{
 const found=D.read(key);assert.deepEqual(copy(found.events[0].pickupLocations1297),copy(collection.pickupLocations1297));assert.equal(found.complete,false);assert.equal(found.remaining[0].n,1);
});
test('Departure1211 status projection retains native events and quantities',()=>{
 const s=D.status(key);assert.equal(s.collected,1);assert.equal(s.remaining,1);assert.deepEqual(copy(s.events[0].pickupLocations1297),copy(collection.pickupLocations1297));
});
test('resolved saved position survives re-read and a changed current pin',()=>{
 const reading=D.read(key),c={key,u:row,gone:{at:collection.departedAt1211},st:{s:'gone',at:collection.departedAt1211}},r=P.resolve(c,{kind:'asset',lat:-28.8,lon:153.8,how:'Changed current pin'},{reading,rows:[row,second]});
 assert.equal(r.historical,true);assert.equal(r.location.lat,-28.01);assert.equal(r.capturedAt,new Date(captureAt).toISOString());
});
test('legacy history still reads without fabricated metadata',()=>{
 const old=copy(record);delete old.history[1].collection996.pickupLocations1297;const found=E.evidence(ref,old,'2030-01-03');assert.equal(found.events.length,1);assert.equal(found.events[0].pickupLocations1297,undefined);
});
test('the evidence adapters do not mutate serialized native history',()=>{
 const before=JSON.stringify(record);D.read(key);D.status(key);assert.equal(JSON.stringify(record),before);
});
console.log(checks+' native pickup metadata round-trip checks PASS');
