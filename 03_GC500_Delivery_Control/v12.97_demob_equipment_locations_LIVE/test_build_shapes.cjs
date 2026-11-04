/* Author: Andrew Fisher. Synthetic checks for Build source-layout adapters. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'build_shapes1297_src.js'),'utf8');
const shapes=fs.readFileSync(path.join(__dirname,'demob_shapes1297_src.js'),'utf8');
const plain=x=>JSON.parse(JSON.stringify(x));let passed=0;
function check(name,fn){fn();passed++;console.log('PASS '+name);}
function fixture(){
 const a={key:'FIXTURE',discipline:'Building'},L={a,key:'FIXTURE',id:'asset-FIXTURE',kind:'asset',label:'FIXTURE',lat:.5,lon:.5,how:'Master plan'},destination={kind:'master'};
 const body={kind:'building',poly:[[.45,.45],[.55,.45],[.55,.55],[.45,.55]],doors:[{leaves:[[[.5,.45],[.5,.4]]]}]},tank={kind:'waste_tank',tank:true,poly:[[.55,.45],[.6,.45],[.6,.5],[.55,.5]]};
 const snapshot={available:true,sig:'source-1',refs:{FIXTURE:{comps:[body,tank]}}};let reads=0;
 const W={DATA:{sheets:[{key:'D001'}]},sheetFitOf:()=>({fx:{k:1,c:0},fy:{k:1,c:0}}),frameOf:(lat,lon)=>({ax:lon,ay:lat}),
  MasterShapes926:{meta:()=>({sheet:[100,100]})},assetOf:()=>a,dest782:()=>destination,gc500MapShapes1060:()=>{reads++;return snapshot;}};
 vm.runInNewContext(shapes+'\n'+source,{window:W});
 return {W,api:W.BuildShapes1297,a,L,destination,body,tank,snapshot,reads:()=>reads};
}
check('Build keeps every exact mixed source component as a neutral reference layout',()=>{
 const f=fixture(),L=f.api.prepare('FIXTURE',f.L),m=L.demob1297;
 assert.equal(m.kind,'reference');assert.equal(m.colour,'#c6d4dc');assert.equal(m.label,'');assert.equal(m.complete,false);
 assert.deepEqual(plain(m.parts.map(p=>p.poly)),[f.body.poly,f.tank.poly]);assert.match(m.qualification,/individual unit position not recorded/);
});
check('Build preparation clones canonical location and preserves detail identity',()=>{
 const f=fixture(),before=JSON.stringify(f.L),L=f.api.prepare('FIXTURE',f.L);
 assert.notEqual(L,f.L);assert.equal(JSON.stringify(f.L),before);assert.equal(L.a,f.a);assert.equal(L.id,f.L.id);assert.equal(L.key,f.L.key);assert.equal(L.build1297,true);
});
check('Build preparation reads one shared source snapshot per description',()=>{
 const f=fixture();f.api.prepare('FIXTURE',f.L);assert.equal(f.reads(),1);
});
check('Build ignores a Demob complete marker on the input location',()=>{
 const f=fixture();f.L.demob1297={kind:'footprint',complete:true,label:'Picked up',colour:'#7fffc1'};
 const m=f.api.prepare('FIXTURE',f.L).demob1297;assert.equal(m.complete,false);assert.equal(m.label,'');assert.equal(m.colour,'#c6d4dc');
});
check('source changes invalidate the Build image cache signature',()=>{
 const f=fixture(),a=f.api.signature(f.api.prepare('FIXTURE',f.L));f.snapshot.sig='source-2';
 assert.notEqual(f.api.signature(f.api.prepare('FIXTURE',f.L)),a);
});
check('exact polygon changes invalidate the Build image cache even without a source sig update',()=>{
 const f=fixture(),a=f.api.signature(f.api.prepare('FIXTURE',f.L));f.body.poly[0][0]=.44;
 assert.notEqual(f.api.signature(f.api.prepare('FIXTURE',f.L)),a);
});
check('unchanged Build inputs produce a stable signature',()=>{
 const f=fixture();assert.equal(f.api.signature(f.api.prepare('FIXTURE',f.L)),f.api.signature(f.api.prepare('FIXTURE',f.L)));
});
check('third panel uses the canonical point and exact native sheet registration',()=>{
 const f=fixture();f.L.lat=.48;f.L.lon=.52;const L=f.api.prepare('FIXTURE',f.L);
 assert.deepEqual(plain(f.api.planSpot(L)),{fx:.52,fy:.48,exact:true});assert.equal(f.api.drawingId('FIXTURE',L),'FIXTURE|0.52,0.48');
});
check('approved relocated position never carries an old plan outline',()=>{
 const f=fixture();f.destination.andrew=true;f.L.lat=.7;f.L.lon=.8;const L=f.api.prepare('FIXTURE',f.L);
 assert.equal(L.demob1297.kind,'unassigned');assert.equal(L.demob1297.parts.length,0);assert.equal(f.api.drawingId('FIXTURE',L),'FIXTURE|0.8,0.7');
});
check('approximate position stays qualified on the plan as well as aerial',()=>{
 const f=fixture();f.destination.approx=true;const L=f.api.prepare('FIXTURE',f.L);
 assert.equal(L.demob1297.kind,'unassigned');assert.match(L.demob1297.qualification,/Approximate/);assert.equal(f.api.drawingId('FIXTURE',L),'FIXTURE|0.5,0.5,a');
});
check('an outside-sheet current position cannot fall back to an old source centre',()=>{
 const f=fixture();f.L.lon=1.2;const L=f.api.prepare('FIXTURE',f.L);
 assert.equal(f.api.planSpot(L),null);assert.equal(f.api.drawingId('FIXTURE',L),null);assert.equal(L.demob1297.kind,'unassigned');
});
check('report points cannot become Build equipment locations',()=>{
 const f=fixture();f.destination.kind='report';const L=f.api.prepare('FIXTURE',f.L);
 assert.equal(L.demob1297.kind,'unlocated');assert.equal(f.api.planSpot(L),null);assert.equal(f.api.drawingId('FIXTURE',L),null);
});
check('shared outlines remain unassigned even for whole-reference Build maps',()=>{
 const f=fixture();f.snapshot.refs.FIXTURE.shared=true;const L=f.api.prepare('FIXTURE',f.L);assert.equal(L.demob1297.kind,'unassigned');assert.equal(L.demob1297.parts.length,0);
});
check('missing coordinates and unavailable projection do not manufacture a plan point',()=>{
 const f=fixture();f.L.lat=null;assert.equal(f.api.prepare('FIXTURE',f.L).demob1297.kind,'unlocated');assert.equal(f.api.planSpot(f.L),null);
 f.L.lat=.5;delete f.W.sheetFitOf;assert.equal(f.api.drawingId('FIXTURE',f.L),null);
});
check('Build helpers do not create network requests, timers, or frame loops',()=>{
 assert.doesNotMatch(source,/\b(?:fetch|setTimeout|setInterval|requestAnimationFrame)\s*\(/);
});
console.log(passed+' synthetic Build shape checks passed');
