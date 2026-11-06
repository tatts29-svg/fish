/* Author: Andrew Fisher. Card reliability tests. Only VM + local fake storage/fetch; no browser or live service. */
'use strict';
const assert = require('node:assert/strict'), vm = require('node:vm'), fs = require('node:fs'), crypto = require('node:crypto');
const { buildCardHtml } = require('./build_card');
const DATA = require('../tracker_data.json');
const src = buildCardHtml(DATA).match(/<script>([\s\S]*?)<\/script>/)[1];
let passed = 0;
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function storage() { const m = new Map(); return { get length() { return m.size; }, key: i => [...m.keys()][i] || null, getItem: k => m.get(k) ?? null, setItem: (k,v) => m.set(k,String(v)), removeItem: k => m.delete(k) }; }
const FRI = '2026-10-23', SAT = '2026-10-24';
const ts = x => Date.parse(x);
function card(ls = storage(), at = ts('2026-10-24T07:59:30+10:00'), ref = 'WC06') {
  let clock = at; const timers = new Map(), nodes = new Map(), events = {};
  function node(id) { if (!nodes.has(id)) nodes.set(id, { innerHTML: '', textContent: '', className: '', style: {}, offsetHeight: 80, setAttribute() {}, focus() {}, getBoundingClientRect() { return { top: 0, bottom: 80 }; } }); return nodes.get(id); }
  const doc = { getElementById: node, activeElement: null, documentElement: node('html'), visibilityState: 'visible', querySelector: () => node('header'), addEventListener: (k,f) => { events[k] = f; } };
  const FakeDate = class extends Date { constructor(...a) { super(...(a.length ? a : [clock])); } static now() { return clock; } };
  const c = { Date: FakeDate, localStorage: ls, location: { pathname: '/d/mocktoken12345678901234', hash: '#r=' + ref + '.abcdefghijklmnop' }, document: doc,
    navigator: { onLine: true }, crypto: crypto.webcrypto, btoa: s => Buffer.from(s,'binary').toString('base64'), Uint8Array,
    setTimeout: (f,ms) => { const id = timers.size+1; timers.set(id,{f,ms}); return id; }, clearTimeout: id => timers.delete(id), setInterval: () => 0,
    fetch: () => new Promise(() => {}), AbortController, console, innerHeight: 640, scrollBy() {}, scrollTo() {}, addEventListener: (k,f) => { events[k] = f; } };
  c.window = c;
  const injected = src.replace('prepareIdentity();\nprepareOffline();\nreadHash();\nrender(); scrollToFocus();\npoll();\nif (outbox.length) pump();', `window.test = { queueEvent, removeQueued, rememberSent, refreshOutbox, noteServer, render, tapJob, undoJob, watchClock, choose, shownDay, validDrawnDay, reconcile, saveSnapshot, allEvents, pump, armBoundary, taskProgress, orderOutbox,
    state: () => ({ outbox, sent, known, cached, advance, pick, drawnDay, synced, full, notices }),
    setKnown: (v) => { known = v; }, setIdentity: (remote, local) => { lastCardScriptHash = remote; ownScriptHash = local; }, setEpoch: (v) => { epoch = v; }, setSent: (v) => { sent = v; }, setPause: (v) => { pausedUntil = v; }, setOffset: (v) => { offset = v; } };
readHash(); render();`);
  assert.notEqual(src,injected);
  vm.createContext(c); vm.runInContext(injected,c);
  return { c, api:c.test, nodes, events, timers, ls, time: v => {clock=v;}, now: () => clock, clock: v => { c.test.noteServer({now:new Date(v).toISOString()},clock,clock); } };
}
function ev(id, ref='WC06', extra={}) { return Object.assign({ id, ref, sig:'abcdefghijklmnop', line:ref+'-FWF',task:'pump',day:FRI,done:true,undoes:[],tapped_at:'2026-10-23T21:59:30Z'}, extra); }
(async () => {
  check('no first service clock means no tap and no guessed day write', () => { const a=card(); a.api.tapJob('WC06-FWF|pump'); assert.equal(a.api.state().outbox.length,0); assert.match(a.nodes.get('banners').innerHTML,/Waiting for the service clock/); });
  check('two stale tabs queue independent immutable keys; deleting one retains the other', () => { const ls=storage(),a=card(ls),b=card(ls); a.api.queueEvent(ev('aaaaaaaaaaaa')); b.api.queueEvent(ev('bbbbbbbbbbbb','WC07')); a.api.refreshOutbox(); assert.equal(a.api.state().outbox.length,2); a.api.removeQueued('aaaaaaaaaaaa'); b.api.refreshOutbox(); assert.deepEqual(Array.from(b.api.state().outbox,e=>e.id),['bbbbbbbbbbbb']); });
  check('concurrent saved-event history does not overwrite another tab', () => { const ls=storage(),a=card(ls),b=card(ls); a.api.rememberSent(ev('aaaaaaaaaaaa')); b.api.rememberSent(ev('bbbbbbbbbbbb','WC07')); assert.equal(card(ls).api.state().sent.length,2); });
  check('cached service offset enables a fresh offline scan with the service clock', () => { const ls=storage(),a=card(ls,0); a.clock(ts('2026-10-24T07:59:30+10:00')); const b=card(ls,500); assert.equal(b.api.state().synced,true); assert.equal(b.api.shownDay(),FRI); });
  check('fresh scan retains last confirmed ticks and labels the saved copy', () => { const ls=storage(),a=card(ls); a.clock(a.now()); a.api.setKnown({saved:ev('saved', 'WC06', {seq:1,at:'2026-10-23T21:59:30Z'})}); a.api.saveSnapshot(a.now()); const b=card(ls); assert.equal(b.api.allEvents().length,1); assert.match(b.nodes.get('status').textContent,/Saved copy/); });
  check('older tab snapshot cannot hide newer confirmed ticks', () => { const ls=storage(),a=card(ls),b=card(ls); a.api.setKnown({a:ev('a')}); a.api.saveSnapshot(100); b.api.saveSnapshot(90); assert.equal(card(ls).api.allEvents().length,1); });
  check('fresh scan after 08:00 offers Stay for recent previous-day tick', () => { const ls=storage(),a=card(ls); a.clock(a.now()); a.api.queueEvent(ev('aaaaaaaaaaaa')); const b=card(ls,ts('2026-10-24T08:01:00+10:00'),'WC07'); b.api.watchClock(); b.api.render(); assert.equal(b.api.state().advance.grace,true); assert.match(b.nodes.get('banners').innerHTML,/data-stay/); });
  check('current GET identity waits for local digest before allowing taps', () => { const a=card(); a.clock(a.now()); a.api.setIdentity('sha256-server',null); a.api.render(); a.api.tapJob('WC06-FWF|pump'); assert.equal(a.api.state().outbox.length,0); assert.match(a.nodes.get('readiness').innerHTML,/Checking this card/); });
  check('future-dated saved history cannot suppress a recent-day grace offer', () => { const a=card(storage(),ts('2026-10-25T07:59:30+10:00')); a.clock(a.now()); a.api.rememberSent(ev('future','WC06',{day:'2026-10-25',tapped_at:'2026-10-25T13:00:00Z'})); a.api.queueEvent(ev('recent','WC06',{day:SAT,tapped_at:'2026-10-24T21:59:00Z'})); a.api.watchClock(); a.time(ts('2026-10-25T08:00:30+10:00')); a.api.watchClock(); assert.equal(a.api.state().advance.grace,true); });
  check('tap after 08:00 cannot silently record a different day than was drawn', () => { const a=card(); a.clock(a.now()); a.api.queueEvent(ev('aaaaaaaaaaaa')); a.api.watchClock(); a.api.render(); a.time(ts('2026-10-24T08:00:00.100+10:00')); a.api.tapJob('WC06-FWF|water'); assert.equal(a.api.state().outbox.length,1); assert.equal(a.api.state().drawnDay,SAT); assert.equal(a.api.state().advance.grace,true); });
  check('undo after 08:00 redraws instead of undoing another service day', () => { const a=card(); a.clock(a.now()); a.api.queueEvent(ev('aaaaaaaaaaaa')); a.api.watchClock(); a.api.render(); a.time(ts('2026-10-24T08:00:00.100+10:00')); a.api.undoJob('WC06-FWF|pump'); assert.equal(a.api.state().outbox.length,1); assert.equal(a.api.state().drawnDay,SAT); });
  check('past-day Stay lapses after 30 minutes idle, never persists through next night', () => { const a=card(storage(),ts('2026-10-24T08:05:00+10:00')); a.clock(a.now()); a.api.choose(FRI); assert.equal(a.api.shownDay(),FRI); a.time(ts('2026-10-24T08:35:00+10:00')); assert.equal(a.api.shownDay(),SAT); });
  check('late-day choice remains capped at two hours even with activity', () => { const a=card(storage(),ts('2026-10-24T08:05:00+10:00')); a.clock(a.now()); a.api.choose(FRI); a.api.state().pick.activity=ts('2026-10-24T10:04:00+10:00'); a.time(ts('2026-10-24T10:05:00+10:00')); assert.equal(a.api.shownDay(),SAT); });
  check('dependency order restores a missing done tick before its waiting undo', () => { const a=card(); const done=ev('aaaaaaaaaaaa'), undo=ev('bbbbbbbbbbbb','WC06',{done:false,undoes:[done.id]}); a.api.queueEvent(undo); a.api.rememberSent(done); a.api.reconcile(); assert.deepEqual(Array.from(a.api.state().outbox,e=>e.id),[done.id,undo.id]); });
  check('an offline undo is explicit even if another tab may be sending the original', () => { const a=card(); a.clock(a.now()); a.api.queueEvent(ev('aaaaaaaaaaaa')); a.api.render(); a.api.undoJob('WC06-FWF|pump'); assert.equal(a.api.state().outbox.length,2); assert.equal(a.api.state().outbox[1].done,false); assert.equal(a.api.state().outbox[1].undoes[0],'aaaaaaaaaaaa'); });
  check('area job progress uses the shared weighted rule', () => { const a=card(); const refs=DATA.areas.find(x=>x.refs.some(r=>r.ref==='WC07')).refs; const html=a.api.taskProgress(refs,FRI,{}); assert.match(html,/Pump out/); assert.match(html,/Clean &amp; restock/); assert.doesNotMatch(html,/Refilled/); });
  const a=card(); a.clock(a.now()); a.api.queueEvent(ev('aaaaaaaaaaaa')); a.c.fetch=async()=>({status:400,headers:{get:()=>null},text:async()=>JSON.stringify({code:'job_cap',error:'cap'})}); a.api.pump(); for(let i=0;i<10;i++)await Promise.resolve();
  check('job_cap keeps durable outbox and requests slow retry',()=>{assert.equal(a.api.state().outbox.length,1);assert.equal(a.api.state().full,true);});
  check('shared state is embedded unchanged, one executable script remains',()=>{assert.ok(src.includes(fs.readFileSync(require.resolve('../panel_mockup/state.js'),'utf8')));assert.equal((buildCardHtml(DATA).match(/<script>/g)||[]).length,1);});
  console.log(`${passed} passed, 0 failed`);
})().catch(e=>{console.error(e);process.exitCode=1;});
