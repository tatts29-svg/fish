/* Author: Andrew Fisher. Synthetic evidence only; no service writes or private fixtures. */
'use strict';
const assert=require('node:assert/strict');
const S=require('./showcase1089');
const input=()=>({day:'2026-10-20',health:{ready:true},toiletArrived:7,
 areas:[{id:'toilets',name:'Toilets',unit:'units',total:10,done:7,rows:[]},{id:'vms',name:'VMS',unit:'boards',total:4,done:3,completeRefs:1,totalRefs:1}],
 tally:{done:1,total:2,levelled:1,steps:0,needLevel:2},
 fencing:{summaryRows:[{id:'clean',label:'Clean fence',unit:'m',recorded:1200,planned:1000,remaining:0},{id:'scrim',label:'Bracing',unit:'m',recorded:200,planned:800,remaining:600},{id:'ccb_event',label:'CCB event',unit:'m',recorded:100,classificationPending:true}]},
 components:{state:'ready',rows:[{date:'2026-10-10'},{date:'2026-10-10'}],recorded:[{id:'base',label:'Feet / blocks',quantity:5,completeCoverage:false},{id:'brace',label:'Braces',quantity:null,completeCoverage:false}]},raceDays:3});
let m=S.model(input());
assert.equal(m.areas.find(a=>a.id==='vms').complete,false,'one complete reference does not complete its four boards');
assert.equal(m.areas.find(a=>a.id==='vms').left,1);
assert.equal(m.toiletArrived,7);
assert.equal(m.checks.steps,0,'unticked steps remain unticked');
assert.equal(m.completeAreas,0);
let h=S.html('equipment',m);assert.match(h,/7<small>toilet units recorded on site/);assert.match(h,/7 .*10 units/);
h=S.html('fence',m);assert.match(h,/1\.2<small>km/);assert.doesNotMatch(h,/1\.4<small>|fence in the ground|100%/);
h=S.html('fenceprog',m);assert.match(h,/Category unconfirmed/);assert.doesNotMatch(h,/>100 m/);
h=S.html('effort',m);assert.match(h,/partial record/);assert.match(h,/Unconfirmed/);assert.doesNotMatch(h,/signed, every one|handled by hand/);
const unavailable=input();unavailable.health.ready=false;m=S.model(unavailable);assert.equal(m.checks.done,null);assert.equal(m.toiletArrived,null);assert.match(S.html('site',m),/Progress<br>is loading/);
const conflict=input();conflict.areas[0].shortConflictRefs=1;conflict.areas[0].done=10;m=S.model(conflict);assert.equal(m.areas[1].complete,false);assert.equal(m.areas[1].left,null);
const stale=input();stale.health.stale=true;assert.match(S.html('equipment',S.model(stale)),/may be stale/);
const pending=input();pending.fencing.summaryRows[0].evidencePending=true;m=S.model(pending);assert.equal(m.fences[0].recorded,null);assert.match(S.html('fence',m),/awaiting review/);
const injection=input();injection.areas[0].name='<img src=x onerror=x>';injection.areas[0].done=10;h=S.html('site',S.model(injection));assert.match(h,/&lt;img/);assert.doesNotMatch(h,/<img/);
assert.equal(S.html('crew',S.model(input())),null,'unmodified crew scene delegates to existing renderer');
console.log('PASS: quantities, completion boundaries, units, unknowns, CCB uncertainty, stale/loading, escaping and unchanged scene delegation');
