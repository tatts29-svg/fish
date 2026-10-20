/* Author: Andrew Fisher. Execute the page's position adapters against synthetic source conflicts. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(process.env.PAGE||process.argv[2],'utf8');
function between(a,b){const start=source.indexOf(a);assert(start>=0,a);const end=source.indexOf(b,start+a.length);assert(end>start,b);return source.slice(start,end);}
const plan=between('window.gc500PlanItems = function(){','\nfunction mapSheetsShown(');
const author=between('function andrewPin1084(a){','\nfunction navPointFor(');
const equipment=between('  function mappedLocation(a) {','\n  const eligible =');
const records=[{key:'X1',discipline:'Buildings',name:'Office',asset_numbers:['001','002']},{key:'X2',discipline:'Buildings',name:'Store'},{key:'X3',discipline:'Buildings',name:'Unit pin',asset_numbers:['003']},{key:'X4',discipline:'Lighting',name:'No master'}];
const master={X1:{pt:[.2,.3],ll:[-10,110],sec:'A'},X2:{pt:[.4,.5],ll:[-11,111],sec:'B'},X3:{pt:[.6,.7],ll:[-12,112],sec:'C'}};
const placed=new Map([['X1',{key:'X1',place:{lat:-20,lon:120,by:'Andrew Fisher',how:"Andrew Fisher’s Google Maps pin",at:'2026-10-20T00:00:00Z'}}],['X3',{key:'X3::003',place:{lat:-21,lon:121,by:'Andrew Fisher',how:"Andrew Fisher's provided pin",at:'2026-10-20T01:00:00Z'}}],['X4',{key:'X4',place:{lat:-22,lon:122,by:'Andrew Fisher',how:'Imported plan'}}]]);
const context=vm.createContext({window:{},DATA:{sheets:[{master:true,markers:[]}]},MAP_LAYERS:[],MASTER_LOC:master,allAssets:()=>records,discUnit:()=>({one:'asset'}),discCount:(d,n)=>String(n),gate6Revision1021:()=>null,generatorMapPoint1004:(a,m)=>m.pt,bestPlaceFor:a=>placed.get(a.key)||null,bestPinFor:a=>master[a.key]?{key:a.key,fix:{lat:master[a.key].ll[0],lon:master[a.key].ll[1],master:true}}:null,masterUnit:k=>master[k]?{ll:master[k].ll,how:'Master plan'}:null,navTargetFor:a=>{const p=placed.get(a.key);return p?{ll:{lat:p.place.lat,lon:p.place.lon},placed:true}:null;},point:v=>Array.isArray(v)&&v.length===2&&v.every(Number.isFinite)?{lat:v[0],lon:v[1]}:null});
vm.runInContext(author+'\n'+plan+'\n'+equipment,context);
const get=()=>JSON.parse(JSON.stringify(context.window.gc500PlanItems()));
const before=JSON.stringify({records,master,placed:[...placed]});
let model=get();
assert.deepEqual(model.items.map(x=>x.key),['X2'],'approved site pins remove stale master marker rows');
assert.deepEqual(model.items[0].pt,[.4,.5],'master-only reference retains exact position');
assert.deepEqual(model.placed.find(x=>x.key==='X1').ll,[-20,120],'reference pin outranks synthetic master fix');
assert.deepEqual(model.placed.find(x=>x.key==='X3').ll,[-21,121],'eligible unit-level pin locates owning reference');
assert.equal(model.placed.find(x=>x.key==='X1').assets,'001, 002','multi-unit identity remains complete');
assert.equal(model.trades.find(x=>x.name==='Buildings').n,3,'relocated reference counted once');
assert.equal(new Set([...model.items,...model.placed].map(x=>x.key)).size,model.items.length+model.placed.length,'no duplicate placed references');
assert.equal(context.andrewPin1084(records[3]),null,'imported legacy placement is not promoted to approved pin');
assert.equal(context.mappedLocation(records[0]).source,'Andrew’s pin · reference location');
assert.equal(context.mappedLocation(records[0]).kind,'place','equipment skips stale master outline through existing kind gate');
assert.equal(context.mappedLocation(records[1]).kind,'master','master-only equipment placement is unchanged');
assert.equal(JSON.stringify({records,master,placed:[...placed]}),before,'adapters do not mutate source coordinates or unit identity');
placed.get('X1').place.lat=-20.25;model=get();assert.deepEqual(model.placed.find(x=>x.key==='X1').ll,[-20.25,120],'fresh approved pin reflected without TTL');
placed.delete('X1');model=get();assert.deepEqual(model.items.find(x=>x.key==='X1').pt,[.2,.3],'removed approved pin returns to existing fallback');
records[2]._cancelled=true;model=get();assert(![...model.items,...model.placed,...model.unplaced].some(x=>x.key==='X3'),'cancelled refs are not resurrected');
assert(source.includes('<!-- fencing-evidence-1071; Author: Andrew Fisher -->'),'implementation marker is an invisible HTML comment');
assert(!source.includes('/* fencing-evidence-1071; Author: Andrew Fisher */'),'raw body comment does not leak into interface');
console.log('PASS approved pin precedence, stale marker removal, multi-unit identity, fallback, fresh updates and private-record immutability');
// An approved pin only centimetres away must not borrow an old traced footprint.
// Keep the original master and separately revised geometry eligible for their existing shape rules.
const shapeSource=between('  function shapeFor(it){','\n  /* project a reference');
const shape={comps:[],shared:false};
const shaped=vm.createContext({SNAP:{refs:{Q1:shape}},CACHE:new Map(),NEAR:6,off:0,edgeDist:()=>.001});
vm.runInContext(shapeSource,shaped);
const base={code:'Q1',places:[[10,20,12,22]],cat:{name:'Buildings'}};
assert.equal(shaped.shapeFor(base),shape,'original master shape remains eligible');
assert.equal(shaped.shapeFor({...base,placedHow:'Andrew’s pin by Andrew Fisher · not on the master plan'}),null,'tiny approved pin movement never borrows historical shape, even with cached position');
assert.equal(shaped.shapeFor({...base,placedHow:'Current revised drawing'}),shape,'unrelated revised drawing keeps its geometry');
console.log('PASS approved tiny moves suppress stale footprint without changing master-only or revised-drawing shapes');
