/* Author: Andrew Fisher. Synthetic checks for Demob map marks and source geometry. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, 'demob_shapes1297_src.js'), 'utf8');
const plain = x => JSON.parse(JSON.stringify(x));
let passed = 0;
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function fixture() {
 const paths = [{fixture: 'building'}];
 const W = {Singles1238: {iconPaths: () => paths}};
 vm.runInNewContext(source, {window: W});
 const body = {kind: 'building', std: false, tank: false, poly: [[.45,.45],[.55,.45],[.55,.55],[.45,.55]],
  doors: [{arcs: [[[.5,.45],[.51,.44],[.52,.43],[.53,.45]]], leaves: [[[.5,.45],[.5,.42]]], landing: [[[.48,.42],[.53,.42]]]}], chev: [[[.47,.48],[.48,.49],[.49,.48]]]};
 const snapshot = {available: true, sig: 'synthetic-source', refs: {FIXTURE: {comps: [body], shared: false}}};
 const card = {key: 'FIXTURE', uid: 'fixture-unit', icon: 'bld', cat: 'bld', of: 1, st: {s: 'ready'}, r: {a: {key: 'FIXTURE'}}};
 const L = {key: 'FIXTURE', kind: 'asset', lat: 10, lon: 20};
 const opts = {source: snapshot, rawShape: {placed: true}, destination: {kind: 'master'}, sheetPoint: [.5,.5], sheetSize: [100,100]};
 return {W, api: W.DemobShapes1297, body, snapshot, card, L, opts, paths};
}
function recorder() {
 const calls = [], state = [];
 const g = new Proxy({calls, measureText: text => ({width: String(text).length * 12})}, {
  get(target, name) {
   if (name in target) return target[name];
   return (...args) => { calls.push([name, ...args]); if (name === 'save') state.push(1); if (name === 'restore') assert.ok(state.pop(), 'balanced canvas save/restore'); };
  },
  set(target, name, value) { calls.push(['set', name, value]); target[name] = value; return true; }
 });
 return {g, calls, state};
}
const projection = {x:500, y:360, width:1000, height:720, projectSheet:(x,y)=>({x:x*1000,y:y*720})};
check('a matching single body uses only its recorded source polygon', () => {
 const f = fixture(), m = f.api.context(f.card, f.L, f.opts);
 assert.equal(m.kind, 'footprint'); assert.equal(m.provenance, 'master');
 assert.deepEqual(plain(m.parts[0].poly), f.body.poly);
});
check('context leaves card, canonical location and source untouched', () => {
 const f = fixture(), before = JSON.stringify([f.card,f.L,f.opts]);
 const m = f.api.context(f.card,f.L,f.opts); m.parts[0].poly[0][0] = 0;
 assert.equal(JSON.stringify([f.card,f.L,f.opts]),before);
});
for (const [name, change, reason] of [
 ['approved moved pin', f=>{f.opts.destination={kind:'pinned',andrew:true};}, 'recorded pin'],
 ['shared source', f=>{f.snapshot.refs.FIXTURE.shared=true;}, 'shared'],
 ['cancelled source', f=>{f.opts.rawShape.cancelled='cancelled';}, 'unavailable'],
 ['unplaced source', f=>{f.opts.rawShape.placed=false;}, 'unavailable'],
 ['contents', f=>{f.card.cat='furn';}, 'contents'],
 ['multiple recorded locations', f=>{f.opts.locationCount=2;}, 'individual'],
 ['distant canonical point', f=>{f.opts.sheetPoint=[.9,.9];}, 'outside'],
 ['missing source', f=>{f.opts.source=null;}, 'unavailable'],
 ['missing comparison point', f=>{f.opts.sheetPoint=null;}, 'comparison'],
 ['approximate point', f=>{f.opts.destination.approx=true;}, 'unconfirmed'],
 ['area-only destination', f=>{f.opts.destination.kind='area';}, 'unconfirmed'],
 ['VMS individual board', f=>{f.card.vms={label:'Synthetic board'};}, 'board location'],
 ['wrong body type', f=>{f.card.icon='tank';}, 'equipment type']
]) check(name+' leaves the map without an invented equipment mark',()=>{
 const f=fixture(); change(f); const m=f.api.context(f.card,f.L,f.opts);
 assert.equal(m.kind,'unassigned'); assert.match(m.reason,new RegExp(reason)); assert.equal(m.parts.length,0);
 const r=recorder(),out=f.api.paint(r.g,m,projection);assert.equal(out.painted,false);
 assert.equal(r.calls.filter(c=>['stroke','arc','translate','scale'].includes(c[0])).length,0);
});
for (const [name,change] of [
 ['report destination',f=>{f.opts.destination.kind='report';}],
 ['report explanation',f=>{f.L.tag='FIXTURE - report here (pit lane)';}],
 ['missing longitude',f=>{f.L.lon=null;}],
 ['unknown location',f=>{f.L.none='No position';}]
]) check(name+' never draws equipment at the fallback point',()=>{
 const f=fixture();change(f);const m=f.api.context(f.card,f.L,f.opts),r=recorder(),out=f.api.paint(r.g,m,projection);
 assert.equal(m.kind,'unlocated');assert.equal(out.painted,false);
 assert.equal(r.calls.filter(c=>c[0]==='stroke'||c[0]==='arc').length,0);
});
check('an approximate reference location stays qualified without a symbol',()=>{
 const f=fixture();f.L.warn='Approximate';f.card.of=2;
 const m=f.api.context(f.card,f.L,f.opts);assert.match(m.qualification,/Approximate recorded position/);assert.match(m.qualification,/outline unrecorded/);
});
check('a group can show the entire reference outline without inventing unit slots',()=>{
 const f=fixture();f.card.group=true;f.card.n=2;f.snapshot.refs.FIXTURE.comps.push({...f.body,poly:[[.55,.45],[.65,.45],[.65,.55],[.55,.55]]});
 const m=f.api.context(f.card,f.L,f.opts);assert.equal(m.kind,'reference');assert.equal(m.parts.length,2);assert.equal(m.qualification,'Reference layout; individual unit position not recorded');
});
check('an uncounted group remains a reference outline rather than one claimed unit',()=>{
 const f=fixture();f.card.group=true;f.card.n=0;
 const m=f.api.context(f.card,f.L,f.opts);assert.equal(m.scope,'reference');assert.match(m.qualification,/individual unit position not recorded/);
});
check('a tank card cannot inherit the building outline',()=>{
 const f=fixture();f.card.icon='tank';f.body.kind='toilet_block';
 f.snapshot.refs.FIXTURE.comps.push({...f.body,kind:'waste_tank',tank:true,doors:[],poly:[[.47,.47],[.53,.47],[.53,.53],[.47,.53]]});
 const m=f.api.context(f.card,f.L,f.opts);assert.equal(m.kind,'footprint');assert.equal(m.parts.length,1);assert.equal(m.parts[0].kind,'waste_tank');assert.equal(m.parts[0].doors.length,0);
});
check('a recorded block-and-tank card retains both unique source components',()=>{
 const f=fixture();f.card.icon='block';f.card.tank={id:'paired'};f.body.kind='toilet_block';
 f.snapshot.refs.FIXTURE.comps.push({...f.body,kind:'waste_tank',tank:true,doors:[]});
 const m=f.api.context(f.card,f.L,f.opts);assert.equal(m.parts.length,2);assert.equal(m.kind,'footprint');
});
check('ambiguous paired tank geometry stays a neutral reference layout',()=>{
 const f=fixture();f.card.icon='block';f.card.tank={id:'paired'};f.body.kind='toilet_block';
 f.snapshot.refs.FIXTURE.comps.push({...f.body,kind:'waste_tank',tank:true},{...f.body,kind:'waste_tank',tank:true});
 const m=f.api.context(f.card,f.L,f.opts);assert.equal(m.kind,'reference');assert.equal(m.parts.length,3);assert.equal(m.colour,'#c6d4dc');
});
for(const [name,change,provenance]of[
 ['catalogue',f=>{f.body.std=true;},'catalogue'],
 ['mixed',f=>{f.card.group=true;f.card.n=2;f.snapshot.refs.FIXTURE.comps.push({...f.body,std:true});},'mixed']
])check(name+' geometry retains its qualification',()=>{
 const f=fixture();change(f);const m=f.api.context(f.card,f.L,f.opts);assert.equal(m.provenance,provenance);assert.match(m.qualification,/atalogue/);
});
check('complete, partial and review colours remain distinct',()=>{
 const f=fixture();f.card.st.s='gone';let m=f.api.context(f.card,f.L,f.opts);assert.equal(m.colour,'#7fffc1');assert.equal(m.label,'Picked up');assert.equal(m.partial,false);
 f.card.st.s='ready';f.card.part={collected:1};m=f.api.context(f.card,f.L,f.opts);assert.equal(m.colour,'#7fffc1');assert.equal(m.partial,true);
 f.card.unk=1;m=f.api.context(f.card,f.L,f.opts);assert.equal(m.colour,'#ffaaa3');assert.equal(m.review,true);
});
check('cache signature changes for unit type, pickup state, source and location',()=>{
 const f=fixture(),sig=()=>f.api.signature(f.api.context(f.card,f.L,f.opts)),a=sig();
 f.card.icon='gen';assert.notEqual(sig(),a);f.card.icon='bld';assert.equal(sig(),a);
 f.card.st.s='gone';assert.notEqual(sig(),a);f.card.st.s='ready';
 f.snapshot.sig='second-source';assert.notEqual(sig(),a);f.snapshot.sig='synthetic-source';
 f.L.lon=21;assert.notEqual(sig(),a);f.L.lon=20;
 f.opts.locationSignature='historical-record';assert.notEqual(sig(),a);
});
check('unrelated front-view paths cannot affect the source-only renderer',()=>{
 const f=fixture();f.opts.paths=[{}];const a=f.api.signature(f.api.context(f.card,f.L,f.opts));f.opts.paths=[{unserialisable:()=>{}}];
 assert.equal(f.api.signature(f.api.context(f.card,f.L,f.opts)),a);
});
check('footprint and door projection preserves source coordinates exactly',()=>{
 const f=fixture(),m=f.api.context(f.card,f.L,f.opts),out=f.api.projected(m,projection);
 assert.deepEqual(plain(out[0].points[0]),{x:450,y:324});
 assert.deepEqual(plain(out[0].doors[0].leaves[0][1]),{x:500,y:302.4});
 assert.deepEqual(f.body.doors[0].leaves[0][1],[.5,.42]);
});
check('painting sourced shapes uses source curves without synthetic circles or arrows',()=>{
 const f=fixture(),m=f.api.context(f.card,f.L,f.opts),r=recorder(),out=f.api.paint(r.g,m,projection);
 assert.equal(out.kind,'footprint');assert.equal(out.painted,true);assert.equal(r.calls.filter(c=>c[0]==='bezierCurveTo').length,2);
 assert.equal(r.calls.filter(c=>c[0]==='arc').length,0);assert.equal(r.state.length,0);
});
check('missing geometry leaves the canonical map with text only',()=>{
 const f=fixture();f.opts.source=null;const m=f.api.context(f.card,f.L,f.opts),r=recorder(),out=f.api.paint(r.g,m,projection);
 assert.equal(out.kind,'unassigned');assert.equal(out.painted,false);assert.deepEqual(plain(out.at),{x:500,y:360});
 assert.equal(r.calls.filter(c=>['stroke','arc','translate','scale'].includes(c[0])).length,0);assert.equal(r.state.length,0);
});
check('missing shape projection never substitutes a front-view icon',()=>{
 const f=fixture(),m=f.api.context(f.card,f.L,f.opts),r=recorder(),out=f.api.paint(r.g,m,{...projection,projectSheet:undefined});
 assert.equal(out.kind,'unassigned');assert.equal(out.painted,false);assert.match(out.qualification,/projection unavailable/);assert.equal(r.calls.filter(c=>c[0]==='stroke').length,0);
});
check('invalid shape projection never paints malformed coordinates',()=>{
 const f=fixture(),m=f.api.context(f.card,f.L,f.opts),r=recorder(),out=f.api.paint(r.g,m,{...projection,projectSheet:()=>({x:NaN,y:0})});
 assert.equal(out.kind,'unassigned');assert.ok(r.calls.every(c=>!c.some(x=>typeof x==='number'&&!Number.isFinite(x))));
});
check('missing icon paths stay explicitly unavailable without a generic replacement pin',()=>{
 const f=fixture();f.opts.source=null;f.W.Singles1238.iconPaths=()=>[];
 const r=recorder(),out=f.api.paint(r.g,f.api.context(f.card,f.L,f.opts),projection);assert.equal(out.painted,false);assert.equal(out.kind,'unassigned');assert.equal(r.calls.filter(c=>c[0]==='stroke').length,0);assert.equal(r.state.length,0);
});
check('several same-type unit cards show all exact source outlines neutrally',()=>{
 const f=fixture();f.card.of=2;f.card.st.s='gone';const second={...f.body,poly:[[.56,.45],[.66,.45],[.66,.55],[.56,.55]]};f.snapshot.refs.FIXTURE.comps.push(second);
 const m=f.api.context(f.card,f.L,{...f.opts,sameKindCount:2}),r=recorder(),out=f.api.paint(r.g,m,projection);
 assert.equal(m.kind,'reference');assert.equal(m.colour,'#c6d4dc');assert.equal(m.label,'');assert.equal(m.complete,true);assert.equal(m.parts.length,2);
 assert.deepEqual(plain(m.parts.map(p=>p.poly)),[f.body.poly,second.poly]);assert.equal(out.kind,'reference');
 assert.ok(!r.calls.some(c=>c[0]==='set'&&['strokeStyle','fillStyle'].includes(c[1])&&c[2]==='#7fffc1'));
 assert.ok(!r.calls.some(c=>c[0]==='fillText'&&String(c[1]).includes('Picked up')));
});
check('a unique same-kind body within a mixed reference can use its own source outline',()=>{
 const f=fixture();f.card.of=2;f.snapshot.refs.FIXTURE.comps.push({...f.body,kind:'generator'});
 const m=f.api.context(f.card,f.L,{...f.opts,sameKindCount:1});assert.equal(m.kind,'footprint');assert.equal(m.parts.length,1);assert.equal(m.parts[0].kind,'building');
});
check('a whole-reference Build request preserves all mixed source bodies neutrally',()=>{
 const f=fixture();f.card.group=true;f.card.icon='other';f.card.st.s='gone';f.snapshot.refs.FIXTURE.comps.push({...f.body,kind:'generator'});
 const m=f.api.context(f.card,f.L,{...f.opts,wholeReference:true});
 assert.equal(m.kind,'reference');assert.equal(m.colour,'#c6d4dc');assert.equal(m.label,'');assert.deepEqual(plain(m.parts.map(p=>p.kind)),['building','generator']);
});
check('whole-reference option cannot broaden an individual card into unrelated shapes',()=>{
 const f=fixture();f.snapshot.refs.FIXTURE.comps.push({...f.body,kind:'generator'});
 const m=f.api.context(f.card,f.L,{...f.opts,wholeReference:true});assert.equal(m.kind,'footprint');assert.equal(m.parts.length,1);assert.equal(m.parts[0].kind,'building');
});
check('unknown same-kind cardinality never implies an individual slot in a multi-unit reference',()=>{
 const f=fixture();f.card.of=2;const m=f.api.context(f.card,f.L,f.opts);assert.equal(m.kind,'reference');assert.equal(m.scope,'reference');
});
check('a typed count cannot assign one unit to one of multiple matching source bodies',()=>{
 const f=fixture();f.card.of=2;f.snapshot.refs.FIXTURE.comps.push({...f.body});
 const m=f.api.context(f.card,f.L,{...f.opts,sameKindCount:1});assert.equal(m.kind,'reference');assert.equal(m.parts.length,2);
});
check('a partial reference layout remains neutral and does not mark all slots partial',()=>{
 const f=fixture();f.card.of=2;f.card.part={collected:1};const m=f.api.context(f.card,f.L,f.opts),r=recorder();f.api.paint(r.g,m,projection);
 assert.equal(m.kind,'reference');assert.equal(m.colour,'#c6d4dc');assert.equal(m.label,'');assert.ok(!r.calls.some(c=>c[0]==='setLineDash'&&c[1].length));
});
check('a historical saved point with no historic geometry remains text-only',()=>{
 const f=fixture();f.card.st.s='gone';const m=f.api.context(f.card,f.L,{...f.opts,destination:null,source:null,locationSignature:'saved-event'}),r=recorder();
 const out=f.api.paint(r.g,m,projection);assert.equal(out.kind,'unassigned');assert.equal(out.painted,false);assert.equal(r.calls.filter(c=>c[0]==='stroke').length,0);
});
check('rotated source geometry preserves all vertices and door angles',()=>{
 const f=fixture();f.body.poly=[[.50,.42],[.58,.50],[.50,.58],[.42,.50]];
 const m=f.api.context(f.card,f.L,f.opts),out=f.api.projected(m,projection);
 assert.deepEqual(plain(out[0].points),f.body.poly.map(([x,y])=>({x:x*1000,y:y*720})));
});
check('partial outlines retain dashed ink',()=>{
 const f=fixture();f.card.part={collected:1};const r=recorder();f.api.paint(r.g,f.api.context(f.card,f.L,f.opts),projection);
 assert.ok(r.calls.some(c=>c[0]==='setLineDash'&&JSON.stringify(c[1])==='[7,5]'));
});
check('default reads use current shared APIs without network or timers',()=>{
 const f=fixture();f.W.gc500MapShapes1060=()=>f.snapshot;f.W.MasterShapes926={shape:()=>({placed:true}),meta:()=>({sheet:[100,100]})};
 f.W.DATA={sheets:[{key:'D001'}]};f.W.sheetFitOf=()=>({fx:{k:1,c:0},fy:{k:1,c:0}});f.W.frameOf=()=>({ax:.5,ay:.5});f.W.dest782=()=>({kind:'master'});
 assert.equal(f.api.context(f.card,f.L).kind,'footprint');
 assert.doesNotMatch(source,/\b(?:fetch|setTimeout|setInterval|requestAnimationFrame)\s*\(/);
});
console.log(passed+' synthetic Demob shape checks passed');
