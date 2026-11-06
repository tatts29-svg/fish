/* Author: Andrew Fisher. Local-only state, wording, paging and patch-boundary regression tests. */
'use strict';
const assert = require('node:assert/strict'), path = require('path');
const root = path.join(__dirname, '../../servicing_tracker_DRAFT');
const S = require(root + '/panel_mockup/state.js'), P = require(root + '/panel_mockup/panel_render.js');
const reader = require(root + '/panel_mockup/admin_reader.js');
const D = require(root + '/tracker_data.json');
const ALL = D.areas.flatMap(a => a.refs), cfg = {plans:D.plans, days:D.days};
const now = Date.parse('2026-10-24T23:20:00+10:00');
let passed = 0;
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
check('one crew finished is 100% for its job but 33% for the three-job area', () => {
 const refs = D.areas.find(a => a.n === 5).refs;
 const e = refs.flatMap(r => r.lines.map(l => ({id:l.id, ref:r.ref, line:l.id, task:'pump', day:'2026-10-24', done:true, at:new Date(now).toISOString()})));
 const st = S.jobStates(e, now), tasks = S.taskStats(cfg, refs, '2026-10-24', st), g = S.groupStats(cfg,refs,'2026-10-24',st);
 assert.equal(tasks.pump.d,tasks.pump.w); assert.equal(tasks.pump.pct,100); assert.equal(tasks.clean.d,0); assert.equal(g.pct,33);
});
check('all job subtotals add exactly to overall jobs on every service day', () => {
 for (const day of D.days) {
  const ts = S.taskStats(cfg,ALL,day.id,{}), g = S.groupStats(cfg,ALL,day.id,{});
  assert.equal(Object.values(ts).reduce((n,t)=>n+t.w,0),g.w);
  if (day.plan === 'final') { assert.equal(ts.water,undefined); assert.ok(ts.lock.w > 0); }
 }
});
check('panel percentages name jobs/references and never misleading full-unit ratio', () => {
 const M = require(root + '/panel_mockup/build_panel.js').buildModel();
 const html = P.svcPanelHtml(M);
 assert.match(html,/of 760 jobs/); assert.match(html,/of 75 references/); assert.doesNotMatch(html,/of 263 units/); assert.doesNotMatch(html,/ locations/);
 assert.equal((html.match(/aria-label="Progress by job"/g)||[]).length,15);
});
check('hostile labels remain escaped', () => {
 const copy = JSON.parse(JSON.stringify(D)); copy.areas[0].name = '<img src=x onerror=alert(1)>';
 const html = P.svcPanelHtml({D:copy,S,events:[],now,lastRead:now,day:'2026-10-24',open:{}});
 assert.doesNotMatch(html,/<img src=x/); assert.match(html,/&lt;img src=x/);
});
(async () => {
 let calls = [], i = 0;
 let answers = [
  {ticks:[{id:'a',done:true}],seq:2000,more:true,epoch:'one',updated:'u'},
  {ticks:[{id:'b',done:true}],seq:2001,more:false,epoch:'one',updated:'u'},
  {ticks:[],seq:2001,more:false,epoch:'one',updated:'u'},
  {ticks:[],seq:2001,more:false,epoch:'two',updated:'u'},
  {ticks:[{id:'b',done:true}],seq:2001,more:false,epoch:'two',updated:'u'}];
 const r = reader.create(async q => {calls.push(q); return answers[i++];});
 let snap = await r.read('fixture');
 check('admin cursor collects all pages before exposing progress',()=>{assert.deepEqual(snap.events.map(e=>e.id),['a','b']); assert.deepEqual(calls.map(q=>q.since),[0,2000]);});
 snap = await r.read('fixture');
 check('unchanged poll asks only since previous cursor',()=>{assert.equal(calls[2].since,2001); assert.equal(snap.events.length,2);});
 snap = await r.read('fixture');
 check('void epoch resets full list so removed ticks disappear',()=>{assert.deepEqual(snap.events.map(e=>e.id),['b']); assert.equal(calls[4].since,0);});
 let n=0; const stuck=reader.create(async()=>{n++;return {ticks:[],seq:0,more:true,epoch:'a'};});
 await assert.rejects(stuck.read('fixture'),/did not advance/); check('broken cursor fails rather than loops',()=>assert.equal(n,1));
 let m=0; const endless=reader.create(async q=>{m++;return {ticks:[],seq:q.since+1,more:true,epoch:'a'};});
 await assert.rejects(endless.read('fixture'),/20 pages/); check('paging is bounded',()=>assert.equal(m,20));
 let k=0; const partial=reader.create(async q=>{k++;if(k===1)return {ticks:[{id:'first'}],seq:1,more:false,epoch:'a'};if(k===2)return {ticks:[{id:'new'}],seq:2,more:true,epoch:'a'};throw new Error('offline');});
 await partial.read('fixture'); await assert.rejects(partial.read('fixture'),/offline/);
 check('partial failed page is not returned as verified snapshot',()=>assert.equal(k,3));
 console.log(passed+' passed, 0 failed');
})().catch(e=>{console.error(e);process.exit(1);});
