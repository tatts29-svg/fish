/* Author: Andrew Fisher. Local fixture payload tests; no HTTP writes. */
'use strict';
const assert=require('node:assert/strict');
const A=require('../admin1067_src.js');
const D=require('../../servicing_tracker_DRAFT/tracker_data.json');
const contact={name:'Fixture supervisor',phone:'0400 000 000'};
const src=JSON.stringify(D);
const t=A.prepare(D,'test',contact,'2026-10-18');
assert.equal(t.body.load,'servicing-tracker:TEST');assert.deepEqual(t.body.tracker.days,[{id:'2026-10-18',plan:'night'}]);assert.equal(t.body.expires,'2026-10-19');
assert.equal(t.data.days[0].label,'TEST 2026-10-18');assert.equal(t.data.days[0].to,'Mon 19');assert.equal(t.body.keys.length,0);
const e=A.prepare(D,'event',contact,'2026-10-18');
assert.equal(e.body.load,'servicing-tracker:GC500-2026');assert.equal(e.body.tracker.days.length,4);assert.equal(e.body.tracker.days[0].id,'2026-10-22');assert.equal(e.body.expires,'2026-10-26');
assert.equal(e.body.tracker.lines.length,83);assert.equal(e.body.tracker.lines.reduce((n,l)=>n+l.qty,0),263);
assert.equal(JSON.stringify(D),src);
for(const c of [{name:'',phone:''},{name:'A',phone:'wrong'},{name:'A',phone:'------'},{name:'',phone:'0400 000 000'}])assert.throws(()=>A.prepare(D,'event',c,'2026-10-18'),/contact/);
assert.throws(()=>A.prepare(D,'event',contact,'unknown'),/clock/);
assert.throws(()=>A.prepare(D,'unexpected',contact,'2026-10-18'),/Choose/);
console.log('19 assertions passed: TEST uses actual service day; real event keeps approved days/lines; source unchanged; contact and clock required.');
