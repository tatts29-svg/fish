/* Author: Andrew Fisher. Synthetic registration and shared servicing-state projection. */
'use strict';
const assert=require('node:assert');
const S=require('../servicing_tracker_DRAFT/panel_mockup/state.js'),MapModel=require('./map1099_src.js');
const day='2026-10-23',next='2026-10-24',now=Date.parse('2026-10-24T12:00:00Z');
const D={days:[{id:day,label:'First',plan:'night'},{id:next,label:'Second',plan:'night'}],extras:['refill'],plans:{fwf:{night:['pump','clean','refill']},tank:{night:['pump']}},areas:[{n:1,name:'North',refs:[{ref:'QA1',lines:[{id:'L1',kind:'fwf',qty:2},{id:'L2',kind:'tank',qty:1}]},{ref:'QA2',lines:[{id:'L3',kind:'fwf',qty:1}]}]},{n:2,name:'South',refs:[{ref:'QA3',lines:[{id:'L4',kind:'tank',qty:1}]}]}]};
const G={rect:[10,20,110,80],px:[1000,600],refs:{QA1:{title:'Mixed',pin:[-25,150],lines:{L1:{type:'FWF',point:{x:50,y:50}},L2:{type:'Waste tank',point:{x:90,y:70}}}},QA2:{lines:{L3:{type:'FWF',point:{x:50,y:50}}}},QA3:{pin:[-25.1,150.1],lines:{L4:{type:'Waste tank',point:null}}}}};
const base={D,S,now,day,geometry:G,events:[]};let n=0;
function test(name,fn){fn();n++;console.log('PASS '+name);}
function event(id,line,task,extra={}){return{id,line,task,day,at:'2026-10-23T12:00:00Z',done:true,...extra};}
const all=[event('1','L1','pump'),event('2','L1','clean'),event('3','L2','pump'),event('4','L3','pump'),event('5','L3','clean'),event('6','L4','pump')];
test('projection uses shared weighted totals and no duplicated split spots',()=>{const m=MapModel.model({...base,events:all});assert.equal(m.overall.w,8);assert.equal(m.overall.d,8);assert.equal(m.overall.refs,3);assert.equal(m.refs[0].spots.length,2);assert.equal(m.areas[0].stats.w,7);assert.equal(m.overall.pct,100);});
test('saved progress and area complete delegate to native state',()=>{const m=MapModel.model({...base,events:all.slice(0,5)});assert.equal(m.areas[0].savedDone,true);assert.equal(m.areas[1].savedDone,false);assert.deepEqual(m.areas[0].stats,S.groupStats(D,D.areas[0].refs,day,S.jobStates(all.slice(0,5),now)));});
test('off-plan point remains absent with directions retained',()=>{const m=MapModel.model(base);assert.equal(m.refs[2].spots[0].point,null);assert.deepEqual(m.refs[2].spots[0].lines[0].pin,[-25.1,150.1]);});
test('out-of-crop registration is not clamped into the drawing',()=>{const g=structuredClone(G);g.refs.QA3.lines.L4.point={x:1,y:40};assert.equal(MapModel.model({...base,geometry:g}).refs[2].spots[0].point,null);});
test('distinct line positions preserve original registration',()=>{const m=MapModel.model(base);assert.deepEqual(m.refs[0].spots.map(s=>s.point),[{x:50,y:50},{x:90,y:70}]);assert.equal(m.refs[0].spots[1].lines[0].kind,'tank');});
test('coincident references retain separate identifiers',()=>{const m=MapModel.model(base);assert.equal(m.refs[0].spots[0].point.x,m.refs[1].spots[0].point.x);assert.equal(m.refs.length,3);assert.notEqual(m.refs[0].ref,m.refs[1].ref);});
test('local pending values never receive saved-green completion',()=>{const m=MapModel.model({...base,events:all.map(e=>({...e,local:true}))});assert.equal(m.overall.pct,100);assert(m.refs.every(r=>r.stats.done&&!r.savedDone));assert(m.areas.every(a=>!a.savedDone));});
test('same coordinates group line symbols without duplicate reference maths',()=>{const g=structuredClone(G);g.refs.QA1.lines.L2.point={x:50,y:50};const m=MapModel.model({...base,geometry:g});assert.equal(m.refs[0].spots.length,1);assert.equal(m.refs[0].spots[0].lines.length,2);assert.equal(m.overall.w,8);});
test('optional refill cannot complete an unfinished reference',()=>{const m=MapModel.model({...base,events:[event('x','L1','refill')]});assert.equal(m.overall.d,0);assert(!m.refs[0].savedDone);});
test('undo and selected night independently affect all projections',()=>{const undone=all.concat(event('undo','L1','clean',{done:false,undoes:['2']}));assert.equal(MapModel.model({...base,events:undone}).refs[0].savedDone,false);assert.equal(MapModel.model({...base,day:next,events:all}).overall.d,0);});
test('pictograms cover equipment classes without inventing records',()=>{const pairs=[['FWF','toilet'],['FWF Trailer','toilet'],['Trailer Toilet','toilet'],['Toilet Block 6m','block'],['16Pan Block','pan16'],['Accessible Toilet','accessible'],['Pee Panels','pee'],['Waste tank','tank']];pairs.forEach(([type,expected])=>assert.equal(MapModel.symbol({type}),expected));assert.equal(new Set(pairs.map(([,k])=>MapModel.icon(k))).size,6);assert.equal(MapModel.symbol({type:'unspecified'}),'unknown');});
test('unrecognised event cannot inflate scoped totals',()=>{const m=MapModel.model({...base,events:all.concat(event('extra','UNKNOWN','pump'))});assert.equal(m.overall.d,m.overall.w);assert.equal(m.overall.pct,100);});
console.log(JSON.stringify({passed:n,failed:0}));
