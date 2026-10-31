/* Author: Andrew Fisher. v12.42.3 measure only: where the time goes when a save is pressed on the Demob tab.
   Opens the page at the live address reading the live record (GET only; the harness aborts every write), puts it in edit mode
   with the sync held exactly as test_v12422.cjs Part B does (writes captured in the page, none sent), then for each Demob save
   times, from the click: the card changing on screen, the flash, the main thread idle again; the long tasks; a CPU profile of
   each press; one traced press for style, layout and paint; and a separate call-count pass (how many renders one save runs).
   Also times bump() and the Demob re-render on their own, called directly.
     PAGE=<page.html> OUT=<result.json> [MOB=1] [REPS=3] node profile_saves.cjs */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const PAGE = process.env.PAGE, OUT = process.env.OUT, MOB = process.env.MOB === '1', REPS = +(process.env.REPS || 3);
const RAW = path.join(path.dirname(OUT), 'raw_' + (MOB ? 'phone' : 'desktop')); fs.mkdirSync(RAW, {recursive: true});
const HOST = 'https://gc500-production.up.railway.app', CLICK_MS = MOB ? 240000 : 60000;
const HTML = fs.readFileSync(PAGE, 'utf8');

/* ---- the page's inline scripts, so a profiled function can be named by the module it lives in ---- */
const LS = [0]; for (let i = 0; i < HTML.length; i++) if (HTML.charCodeAt(i) === 10) LS.push(i + 1);
const lineOf = off => { let lo = 0, hi = LS.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (LS[m] <= off) lo = m; else hi = m - 1; } return lo + 1; };
const BLOCKS = [];
{ const re = /<script\b[^>]*>/gi; let m; while ((m = re.exec(HTML))) { const s = m.index + m[0].length, e = HTML.indexOf('</script>', s); if (e < 0) break;
  const src = HTML.slice(s, e); let label = null; const ex = [...src.matchAll(/\b(?:W|window|root)\.([A-Z][A-Za-z]+\d{3,4})\s*=\s*(?:Object\.freeze|api\b|\{)/g)];
  if (ex.length) label = ex[ex.length - 1][1]; if (!label) { const a = src.match(/\b(?:W|window|root)\.([A-Z][A-Za-z]+\d{3,4})\s*=(?!=)/); if (a) label = a[1]; }
  if (!label) { const v = src.slice(0, 3000).match(/\bv(\d{1,2}\.\d{2}(?:\.\d+)?)\b/); label = v ? 'block v' + v[1] : 'block#' + BLOCKS.length; }
  BLOCKS.push({s, e, l0: lineOf(s), l1: lineOf(e), c0: s - LS[lineOf(s) - 1], label, len: e - s}); re.lastIndex = e; } }
{ const big = BLOCKS.slice().sort((a, b) => b.len - a.len)[0]; if (big) big.label = 'core'; }
const blockAt = line => { let lo = 0, hi = BLOCKS.length - 1, hit = null; while (lo <= hi) { const m = (lo + hi) >> 1; if (BLOCKS[m].l0 <= line) { hit = BLOCKS[m]; lo = m + 1; } else hi = m - 1; } return hit && line <= hit.l1 ? hit : null; };

const INIT = `(() => { const M = window.__m = {lt: [], clicks: [], lastEnd: 0};
 try { new PerformanceObserver(l => l.getEntries().forEach(e => { M.lt.push([e.startTime, e.duration]); M.lastEnd = Math.max(M.lastEnd, e.startTime + e.duration); })).observe({type: 'longtask', buffered: true}); } catch (e) {}
 addEventListener('click', ev => { const r = {ts: ev.timeStamp, h: performance.now(), trusted: ev.isTrusted, end: null}; M.clicks.push(r); const ch = new MessageChannel(); ch.port1.onmessage = () => { r.end = performance.now(); }; ch.port2.postMessage(0); }, true);
})();`;

const med = a => { const x = a.filter(v => typeof v === 'number' && isFinite(v)).sort((p, q) => p - q); return x.length ? x[Math.floor((x.length - 1) / 2)] : null; };
const r1 = v => v == null ? null : Math.round(v * 10) / 10;

/* ---- a CPU profile, aggregated by function: self time and inclusive time, each named with its line and module ---- */
function aggProfile(prof) {
 const byId = new Map(prof.nodes.map(n => [n.id, n])), parent = new Map(), cache = new Map();
 prof.nodes.forEach(n => (n.children || []).forEach(c => parent.set(c, n.id)));
 const info = id => { let v = cache.get(id); if (v) return v; const cf = byId.get(id).callFrame, name = cf.functionName || '(anonymous)', line = cf.lineNumber + 1; let k, mod;
  if (!cf.url) { mod = name.startsWith('(') ? 'v8' : 'no-url'; k = name.startsWith('(') ? name : name + ' [' + mod + ']'; }
  else if (cf.url.startsWith(HOST + '/v/')) { const b = blockAt(line); mod = b ? b.label : 'page?'; k = name + ' @' + line + ' ' + mod; }
  else { mod = cf.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 50); k = name + ' ' + mod; }
  v = {k, mod, name, line}; cache.set(id, v); return v; };
 const self = new Map(), incl = new Map(), modSelf = new Map(), modIncl = new Map(); let total = 0, idle = 0;
 const td = prof.timeDeltas || [];
 for (let i = 0; i < prof.samples.length; i++) {
  const dt = (i + 1 < td.length ? td[i + 1] : 0) / 1000, id = prof.samples[i], v = info(id); total += dt;
  if (v.name === '(idle)') { idle += dt; continue; }
  self.set(v.k, (self.get(v.k) || 0) + dt); modSelf.set(v.mod, (modSelf.get(v.mod) || 0) + dt);
  const seen = new Set(), seenM = new Set();
  for (let x = id; x != null; x = parent.get(x)) { const w = info(x); if (w.name === '(root)') continue;
   if (!seen.has(w.k)) { seen.add(w.k); incl.set(w.k, (incl.get(w.k) || 0) + dt); }
   if (!seenM.has(w.mod)) { seenM.add(w.mod); modIncl.set(w.mod, (modIncl.get(w.mod) || 0) + dt); } }
 }
 const top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => [k, r1(v)]);
 return {totalMs: r1(total), idleMs: r1(idle), busyMs: r1(total - idle), self: top(self, 150), incl: top(incl, 200), modSelf: top(modSelf, 60), modIncl: top(modIncl, 60)};
}

/* ---- a trace of one press: the renderer main thread's own time by event (style, layout, paint, script, GC) ---- */
const TRACE_CATS = ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'toplevel', 'v8.execute', 'blink.user_timing'];
function aggTrace(buf, winMs) {
 let j; try { j = JSON.parse(buf.toString()); } catch (x) { return {err: 'trace parse'}; }
 const ev = Array.isArray(j) ? j : j.traceEvents || [];
 const mains = ev.filter(e => e.ph === 'M' && e.name === 'thread_name' && e.args && e.args.name === 'CrRendererMain').map(e => e.pid + ':' + e.tid);
 const cnt = new Map(); ev.forEach(e => { const k = e.pid + ':' + e.tid; if (e.ph === 'X' && mains.includes(k)) cnt.set(k, (cnt.get(k) || 0) + 1); });
 const main = [...cnt].sort((a, b) => b[1] - a[1])[0]; if (!main) return {err: 'no main thread'};
 const [pid, tid] = main[0].split(':').map(Number), on = e => e.pid === pid && e.tid === tid;
 const click = ev.find(e => on(e) && e.name === 'EventDispatch' && e.args && e.args.data && e.args.data.type === 'click');
 if (!click) return {err: 'no click event in trace'};
 const t0 = click.ts - 1000, t1 = click.ts + winMs * 1000;
 const xs = ev.filter(e => on(e) && e.ph === 'X' && typeof e.dur === 'number' && e.ts >= t0 && e.ts <= t1).sort((a, b) => a.ts - b.ts || b.dur - a.dur);
 const stack = [], nodes = [];
 for (const e of xs) { while (stack.length && stack[stack.length - 1].end <= e.ts) stack.pop(); const par = stack[stack.length - 1]; const n = {e, end: e.ts + e.dur, child: 0, depth: stack.length}; if (par) par.child += Math.min(e.dur, par.end - e.ts); stack.push(n); nodes.push(n); }
 const self = new Map(), count = new Map(), top = new Map(); let styleEls = 0, layoutObjs = 0;
 nodes.forEach(n => { const nm = n.e.name; self.set(nm, (self.get(nm) || 0) + Math.max(0, n.e.dur - n.child) / 1000); count.set(nm, (count.get(nm) || 0) + 1); if (n.depth === 0) top.set(nm, (top.get(nm) || 0) + n.e.dur / 1000);
  if (nm === 'UpdateLayoutTree' && n.e.args && n.e.args.elementCount) styleEls = Math.max(styleEls, n.e.args.elementCount);
  if (nm === 'Layout' && n.e.args && n.e.args.beginData) layoutObjs = Math.max(layoutObjs, n.e.args.beginData.totalObjects || 0); });
 const srt = m => [...m].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([k, v]) => [k, r1(v)]);
 return {windowMs: winMs, self: srt(self), counts: [...count].sort((a, b) => b[1] - a[1]).slice(0, 30), topLevel: srt(top), maxStyleElements: styleEls, maxLayoutObjects: layoutObjs};
}

(async () => {
 const out = {author: 'Andrew Fisher', page: PAGE, sha256: require('crypto').createHash('sha256').update(fs.readFileSync(PAGE)).digest('hex'), device: MOB ? 'phone 390x844 dpr2, CPU 4x' : 'desktop 1440x900 (harness default)',
  started: new Date().toISOString(), reps: REPS, notes: [], baseline: null, setup: null, direct: null, actions: {}, counts: {}, errors: []};
 const save = () => fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
 const tOpen = Date.now();
 let h; try { h = await open(Object.assign({pageFile: PAGE, hash: '#demob', init: INIT}, MOB ? {mobile: true, W: 390, H: 844, dpr: 2, cpu: 4} : {})); }
 catch (e) { out.errors.push('open: ' + String(e && e.message || e).slice(0, 300)); save(); process.exit(1); }
 const p = h.page, cdp = await p.context().newCDPSession(p); p.setDefaultTimeout(MOB ? 240000 : 60000);
 p.on('dialog', d => d.accept('test').catch(() => {})); /* a real dialog never blocks the run (the page's confirm/prompt are stubbed below as the tests do) */
 out.loadMs = Date.now() - tOpen;
 const quiet = async (gap = 1200, max = MOB ? 120000 : 25000) => { const t = Date.now();
  while (Date.now() - t < max) { const q = await p.evaluate(() => { const ps = window.Singles1238 && Singles1238.picsState ? Singles1238.picsState() : {queued: 0, busy: 0}; return {idle: performance.now() - (__m.lastEnd || 0), q: ps.queued, b: ps.busy}; });
   if (q.idle > gap && q.q === 0 && q.b === 0) return Date.now() - t; await p.waitForTimeout(200); }
  return -1; };
 const settle = async () => { const t = Date.now(), min = MOB ? 3000 : 1800, max = MOB ? 180000 : 20000; await p.waitForTimeout(min);
  while (Date.now() - t < max) { const s = await p.evaluate(() => performance.now() - (__m.lastEnd || 0)); if (s > 1500) return Date.now() - t; await p.waitForTimeout(200); } return -1; };
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && window.Singles1238 && window.Glow1238 && typeof demob816 === 'function', null, {timeout: 400000});
  out.liveMs = Date.now() - tOpen;
  await p.evaluate(() => { try { go('demob'); } catch (e) {} });
  await p.waitForFunction(() => document.querySelector('#pane-demob article.sg1238'), null, {timeout: 200000});
  await p.waitForTimeout(2500);
  /* edit mode with the sync held, exactly as test_v12422.cjs Part B (writes captured in the page, none sent) */
  await p.evaluate(() => { window.__captured1238 = []; SYNC.claims = 'edit'; Object.defineProperty(SYNC, 'level', {configurable: true, get: () => 'edit', set: () => {}}); Object.defineProperty(SYNC, 'readonly', {configurable: true, get: () => false, set: () => {}});
   SYNC.db.doc = name => ({set: async value => { __captured1238.push({name, value: JSON.parse(JSON.stringify(value || null))}); return {}; }, delete: async () => { throw Error('Deletion disallowed'); }}); S.operator = 'Example test recorder'; const who = document.getElementById('who'); if (who) who.value = S.operator;
   window.confirm = () => true; window.prompt = () => 'test'; applyCapability(); renderDemob816(); });
  await p.waitForTimeout(1500);
  /* the in-page instruments: arm before a press, collect after it */
  await p.evaluate(() => {
   window.__arm = spec => {
    const f0 = document.getElementById('flash'); if (f0) { f0.style.display = 'none'; f0.textContent = ''; }
    if (spec.kind === 'loadBooked') spec.before = document.querySelectorAll('#pane-demob article.lt1238.bk').length;
    const R = window.__r = {spec, armedAt: performance.now(), vis: null, visRaf: null, visPost: null, fl: null, flRaf: null, flPost: null, paneRebuilds: 0, muts: 0, cap0: (window.__captured1238 || []).length};
    const vis = () => { switch (spec.kind) {
     case 'cardState': { const a = document.querySelector(spec.sel); return !!a && a.dataset.s1238 === spec.want; }
     case 'bookOn': { const b = document.querySelector(spec.sel + ' .bk1238'); return !!b && b.classList.contains('on') && b.textContent.includes(spec.text); }
     case 'loadBooked': return document.querySelectorAll('#pane-demob article.lt1238.bk').length > spec.before;
     case 'form': { const f = document.getElementById('collection996'); return !!f && f.getBoundingClientRect().height > 0; }
     default: return false; } };
    const fl = () => { if (!spec.flash) return false; const f = document.getElementById('flash'); return !!f && f.style.display !== 'none' && spec.flash.every(s => f.textContent.includes(s)); };
    const after = k => { R[k] = performance.now(); requestAnimationFrame(() => { R[k + 'Raf'] = performance.now(); const ch = new MessageChannel(); ch.port1.onmessage = () => { R[k + 'Post'] = performance.now(); }; ch.port2.postMessage(0); }); };
    const pane = document.getElementById('pane-demob');
    const mo = new MutationObserver(ms => { R.muts += ms.length; for (const m of ms) if (m.target === pane && m.type === 'childList' && m.removedNodes.length > 2) R.paneRebuilds++;
     if (R.vis == null && vis()) after('vis'); if (R.fl == null && fl()) after('fl'); });
    mo.observe(document.body, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['open', 'hidden', 'class', 'style']});
    R.stop = () => mo.disconnect(); R.pre = {vis: vis(), fl: fl()}; __m.clicks.length = 0; return R.pre; };
   window.__collect = () => { const R = window.__r; R.stop(); const c = __m.clicks[0] || null, t0 = c ? c.ts : R.armedAt, rel = v => v == null ? null : Math.round((v - t0) * 10) / 10;
    const lts = __m.lt.filter(x => x[0] + x[1] > t0 - 5).map(x => [Math.round((x[0] - t0) * 10) / 10, Math.round(x[1] * 10) / 10]).sort((a, b) => a[0] - b[0]);
    let end = c && c.end ? c.end - t0 : 0; for (const [s, d] of lts) if (s <= end + 500) end = Math.max(end, s + d); /* busy until the first 500 ms with no long task */
    const in3 = lts.filter(x => x[0] < 3000);
    const cap = (window.__captured1238 || []).slice(R.cap0).map(x => x.name);
    return {clicks: __m.clicks.length, trusted: c ? c.trusted : null, inputDelay: c ? Math.round((c.h - c.ts) * 10) / 10 : null, clickTaskEnd: c ? rel(c.end) : null,
     visDom: rel(R.vis), visFrame: rel(R.visRaf), visPainted: rel(R.visPost), flashDom: rel(R.fl), flashFrame: rel(R.flRaf), flashPainted: rel(R.flPost),
     idle: Math.round(end * 10) / 10, longTasks: lts, ltTotal3s: Math.round(in3.reduce((s, x) => s + x[1], 0) * 10) / 10, ltMax: lts.length ? Math.max(...lts.map(x => x[1])) : 0,
     paneRebuilds: R.paneRebuilds, mutationRecords: R.muts, pre: R.pre, captured: cap}; };
  });
  out.setup = await p.evaluate(() => ({cards: document.querySelectorAll('#pane-demob article.sg1238').length, paneElements: document.getElementById('pane-demob').getElementsByTagName('*').length, bodyElements: document.getElementsByTagName('*').length,
   stateJsonBytes: JSON.stringify(S).length, storeBytes: (() => { try { return (localStorage.getItem(STORE) || '').length; } catch (e) { return null; } })(), deliveryDocs: Object.keys(S.delivery || {}).length, release: Singles1238.release, tab: state.tab, today: todayIso()}));
  out.setup.quietMs = await quiet(); save();

  /* ---- 0. nothing pressed: what the page does on its own (the background) ---- */
  out.baseline = await p.evaluate(async ms => { const t0 = performance.now(); await new Promise(r => setTimeout(r, ms)); const lts = __m.lt.filter(x => x[0] >= t0).map(x => [Math.round(x[0] - t0), Math.round(x[1])]); return {windowMs: ms, longTasks: lts, total: lts.reduce((s, x) => s + x[1], 0)}; }, 10000);
  save();

  /* ---- 1. the shared save path and the Demob render, called directly ---- */
  out.direct = await p.evaluate(async reps => {
   const T = {}, md = a => a.slice().sort((x, y) => x - y)[Math.floor((a.length - 1) / 2)];
   const time = async (name, fn, gap = 400) => { const xs = []; let err = null; for (let i = 0; i < reps; i++) { await new Promise(r => setTimeout(r, gap)); const t = performance.now(); try { fn(); } catch (e) { err = String(e && e.message || e).slice(0, 120); } xs.push(Math.round((performance.now() - t) * 10) / 10); } T[name] = {ms: xs, median: md(xs)}; if (err) T[name].err = err; };
   await time('JSON.stringify(S)', () => JSON.stringify(S));
   await time('persist() = JSON.stringify(S) + localStorage.setItem', () => persist());
   await time('renderTabs()', () => renderTabs());
   await time('syncFooter()', () => syncFooter());
   await time('syncStage()', () => syncStage());
   await time('toDocs("delivery")', () => toDocs('delivery'));
   await time('buildAllAssets() (one holdAssets)', () => holdAssets(() => 0));
   await time('demob816() cold, in a hold', () => holdAssets(() => { RENDER_MEMO.delete('demob816'); demob816(); }));
   await time('Singles1238.model() cold (demob816 fresh), in a hold', () => holdAssets(() => { RENDER_MEMO.delete('demob816'); demob816(); const t = performance.now(); Singles1238.model(); T.__modelOnly = (T.__modelOnly || []).concat([Math.round((performance.now() - t) * 10) / 10]); }));
   T['Singles1238.model() only (from the run above)'] = {ms: T.__modelOnly, median: md(T.__modelOnly || [0])}; delete T.__modelOnly;
   await time('Singles1238.planLoads(all cards)', () => Singles1238.planLoads(Singles1238.model().cards));
   await time('Glow1238.figures()', () => Glow1238.figures());
   await time('Glow1238.daily()', () => Glow1238.daily());
   await time('financeOperational857()', () => financeOperational857());
   await time('applyCapability()', () => applyCapability());
   await time('markCards()', () => markCards());
   await time('hzTodayPod()', () => hzTodayPod());
   await time('renderDemob816() (the Demob re-render alone)', () => renderDemob816(), 800);
   await time('render() (the page render, Demob showing)', () => render(), 800);
   await time('save() (persist + tabs + footer + sync stage)', () => save(), 800);
   await time('bump() alone (save + render + drawer)', () => bump(), 1200);
   T.paneElementsAfter = document.getElementById('pane-demob').getElementsByTagName('*').length;
   return T; }, REPS);
  out.direct.quietAfterMs = await quiet(); save();

  /* ---- 2. the presses ---- */
  const pick = await p.evaluate(() => {
   const m = Singles1238.model(), emp = k => { try { return !!(emptiedOf816(k) || {}).on; } catch (e) { return null; } };
   const epReady = k => (m.byKey.get(k) || []).filter(c => c.owner === 'event-portables' && !c.group && !c.board && c.st.s === 'ready');
   let K = 'WC69', U = epReady(K)[0]; if (!U) { U = m.cards.find(c => c.owner === 'event-portables' && !c.group && !c.board && c.st.s === 'ready'); K = U && U.key; }
   const PU = m.cards.find(c => c.key === K && c.uid !== (U && U.uid) && !c.group && !c.board && c.st.s === 'ready' && (!c.r.empty || emp(c.key))) || m.cards.find(c => !c.group && !c.board && c.st.s === 'ready' && (!c.r.empty || emp(c.key)));
   const needE = [...new Set(m.cards.filter(c => c.r.empty && !emp(c.key) && c.st.s !== 'gone' && !c.group && !c.board).map(c => c.key))].slice(0, 4).map(k => { const c = m.cards.find(x => x.key === k && x.r.empty && x.st.s !== 'gone' && !x.group && !x.board); return {key: k, uid: c.uid, no: c.no || ''}; });
   const g = (m.byKey.get('GN18') || [])[0];
   const d = new Date(Date.parse(todayIso() + 'T12:00:00Z') + 864e5).toISOString().slice(0, 10), d2 = new Date(Date.parse(todayIso() + 'T12:00:00Z') + 2 * 864e5).toISOString().slice(0, 10);
   return {K, U: U && {uid: U.uid, no: U.no, item: U.item, emptied: emp(K)}, PU: PU && {key: PU.key, uid: PU.uid, no: PU.no, emptied: emp(PU.key)}, needEmptied: needE, GN18: g && {uid: g.uid, no: g.no}, tomorrow: d, dayAfter: d2,
    trucks: Singles1238.loads().length, readyCards: m.cards.filter(c => c.st.s === 'ready').length}; });
  out.picked = pick; save();
  const cardSel = (k, u) => '#pane-demob article.sg1238[data-sg1238="' + k + '"][data-u1238="' + u + '"]';
  const view = async sel => { await p.evaluate(sel => { const el = document.querySelector(sel); if (el) el.scrollIntoView({block: 'center'}); }, sel); await p.waitForTimeout(400); };
  async function press(name, spec, sel, mode, rep) {
   const rec = {rep, mode};
   rec.quietBeforeMs = await quiet();
   rec.pre = await p.evaluate(s => __arm(s), spec);
   if (mode === 'profile') { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {interval: 100}); await cdp.send('Profiler.start'); }
   if (mode === 'trace') await h.browser.startTracing(p, {categories: TRACE_CATS});
   try { await p.click(sel, {timeout: CLICK_MS}); } catch (e) { rec.clickErr = String(e && e.message || e).slice(0, 200); }
   rec.settleMs = await settle();
   if (mode === 'profile') { const {profile} = await cdp.send('Profiler.stop'); rec.profile = aggProfile(profile); fs.writeFileSync(path.join(RAW, name + '_rep' + rep + '.cpuprofile.gz'), zlib.gzipSync(JSON.stringify(profile))); }
   const r = await p.evaluate(() => __collect()); Object.assign(rec, r);
   if (mode === 'trace') { const buf = await h.browser.stopTracing(); fs.writeFileSync(path.join(RAW, name + '_trace.json.gz'), zlib.gzipSync(buf)); rec.trace = aggTrace(buf, Math.max(1500, (r.idle || 0) + 300)); }
   (out.actions[name] = out.actions[name] || {runs: []}).runs.push(rec); save();
   console.log((MOB ? 'phone ' : 'desktop ') + name + ' ' + mode + ' ' + rep + ': vis ' + r.visPainted + ' flash ' + r.flashPainted + ' idle ' + r.idle + ' lt ' + r.longTasks.length + (rec.clickErr ? ' ERR ' + rec.clickErr : ''));
   return rec;
  }
  const modes = Array.from({length: REPS}, (_, i) => ['profile', i + 1]).concat([['trace', REPS + 1]]);
  const K = pick.K, U = pick.U && pick.U.uid;
  /* 2a, 2b: Not ready then Ready again on one Event Portables unit (WC69 if it has a Ready one) */
  if (U) for (const [mode, rep] of modes) {
   await view(cardSel(K, U));
   await press('not_ready', {kind: 'cardState', sel: cardSel(K, U), want: 'not', flash: [K + ' not ready for collection', 'recorded by']}, cardSel(K, U) + ' button[data-lamp1238="not"]', mode, rep);
   await view(cardSel(K, U));
   await press('ready', {kind: 'cardState', sel: cardSel(K, U), want: 'ready', flash: [K + ' ready for collection - recorded by']}, cardSel(K, U) + ' button[data-lamp1238="ready"]', mode, rep);
  } else out.notes.push('no Ready Event Portables unit found for the Ready/Not ready presses');
  /* 2c: Book pick-up for one unit (GN18, as the tests do): the sheet opened and filled first, only Save is timed */
  if (pick.GN18) for (const [mode, rep] of modes) {
   const hh = String(6 + rep).padStart(2, '0');
   await view(cardSel('GN18', pick.GN18.uid)); await quiet();
   await p.click(cardSel('GN18', pick.GN18.uid) + ' button[data-book1238]'); await p.waitForSelector('dialog.bkd1238[open]', {timeout: 15000});
   await p.click('dialog.bkd1238 [data-day1238="' + pick.tomorrow + '"]'); await p.click('dialog.bkd1238 [data-h1238="' + Number(hh) + '"]'); await p.click('dialog.bkd1238 [data-m1238="30"]');
   await press('book_one_unit', {kind: 'bookOn', sel: cardSel('GN18', pick.GN18.uid), text: hh + ':30', flash: ['pick-up booked for', 'recorded by']}, 'dialog.bkd1238 [data-bk1238="save"]', mode, rep);
   await p.evaluate(() => { const d = document.querySelector('dialog.bkd1238'); if (d && d.open) d.close(); });
  }
  /* 2d: Book this load: a truck not yet booked, a fresh one each time; the sheet opened and filled first, only Save is timed */
  for (const [mode, rep] of modes) {
   await quiet();
   const tk = await p.evaluate(() => { document.querySelectorAll('[data-probe1238]').forEach(x => x.removeAttribute('data-probe1238')); const b = [...document.querySelectorAll('#pane-demob [data-ldbook1238]')].find(x => x.textContent.trim() === 'Book this load'); if (!b) return null; b.setAttribute('data-probe1238', 'ld');
    const a = b.closest('article.lt1238'); b.scrollIntoView({block: 'center'}); return {head: a ? a.querySelector('h4').innerText.replace(/\s+/g, ' ') : '', stops: a ? a.querySelectorAll('ol li').length : 0}; });
   if (!tk) { out.notes.push('no unbooked truck for Book this load rep ' + rep); break; }
   await p.waitForTimeout(400); await quiet();
   await p.click('#pane-demob [data-probe1238="ld"]'); await p.waitForSelector('dialog.bkd1238[open]', {timeout: 15000});
   await p.click('dialog.bkd1238 [data-day1238="' + pick.dayAfter + '"]'); await p.click('dialog.bkd1238 [data-h1238="' + (9 + rep) + '"]'); await p.click('dialog.bkd1238 [data-m1238="30"]');
   const rec = await press('book_this_load', {kind: 'loadBooked', flash: ['booked for', ' unit', 'recorded by']}, 'dialog.bkd1238 [data-bk1238="save"]', mode, rep); rec.truck = tk; save();
   await p.evaluate(() => { const d = document.querySelector('dialog.bkd1238'); if (d && d.open) d.close(); });
  }
  /* 2e: Picked up on a unit at a reference already Emptied: the departure form opens (no save); time to the form shown */
  if (pick.PU) for (const [mode, rep] of modes) {
   const sel = cardSel(pick.PU.key, pick.PU.uid); await view(sel);
   await press('picked_up_form', {kind: 'form'}, sel + ' button[data-lamp1238="gone"]', mode, rep);
   await p.evaluate(() => { const b = document.querySelector('#collection996 [data-collection996-close]'); if (b) b.click(); }); await p.waitForTimeout(1500);
  }
  /* 2f: Picked up at a toilet reference with no Emptied tick: OK records Emptied (a save) and then the form opens */
  for (let i = 0; i < Math.min(modes.length, pick.needEmptied.length); i++) { const [mode, rep] = modes[i], x = pick.needEmptied[i], sel = cardSel(x.key, x.uid); await view(sel);
   const rec = await press('picked_up_with_emptied_save', {kind: 'form', flash: [x.key + ' emptied (pumped out)']}, sel + ' button[data-lamp1238="gone"]', mode, rep); rec.ref = x;
   await p.evaluate(() => { const b = document.querySelector('#collection996 [data-collection996-close]'); if (b) b.click(); }); await p.waitForTimeout(1500); save(); }

  /* ---- 3. the call-count pass: how many times each function runs for one press (precise call counts; wrappers time the shared path) ---- */
  const scripts = new Map(); cdp.on('Debugger.scriptParsed', e => scripts.set(e.scriptId, {url: e.url, line: e.startLine, col: e.startColumn}));
  await cdp.send('Debugger.enable'); await p.waitForTimeout(1500);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.startPreciseCoverage', {callCount: true, detailed: false});
  await p.evaluate(() => { const C = window.__cnt = {fn: {}, json: {n: 0, ms: 0, bigN: 0, bigMs: 0, bigBytes: 0}, ls: {n: 0, ms: 0, bytes: 0}};
   ['bump', 'save', 'save775Inner', 'persist', 'render', 'renderPass', 'renderDemob816', 'demob816', 'listHtml816', 'renderTabs', 'syncFooter', 'syncPush', 'syncStage', 'syncStageLive', 'syncSend', 'syncSettled', 'toDocs', 'buildAllAssets', 'applyCapability', 'markCards', 'financeOperational857', 'hzTodayPod', 'flash', 'damagedBanner', 'openAsset', 'wireDemob816', 'dayHtml816', 'setEmptied816', 'emptiedOf816'].forEach(n => {
    const f = window[n]; if (typeof f !== 'function') return; const w = function () { const c = C.fn[n] || (C.fn[n] = {n: 0, ms: 0, miss: 0}); c.n++; if (n === 'demob816' && !(RENDER_MEMO instanceof Map && RENDER_MEMO.has('demob816'))) c.miss++; const t = performance.now(); try { return f.apply(this, arguments); } finally { c.ms += performance.now() - t; } };
    Object.assign(w, f); window[n] = w; });
   const js = JSON.stringify; JSON.stringify = function () { const t = performance.now(), r = js.apply(this, arguments), d = performance.now() - t; C.json.n++; C.json.ms += d; if (r && r.length > 100000) { C.json.bigN++; C.json.bigMs += d; C.json.bigBytes += r.length; } return r; };
   const si = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { const t = performance.now(); try { return si.apply(this, arguments); } finally { C.ls.n++; C.ls.ms += performance.now() - t; C.ls.bytes += String(v).length; } };
   window.__cntReset = () => { C.fn = {}; C.json = {n: 0, ms: 0, bigN: 0, bigMs: 0, bigBytes: 0}; C.ls = {n: 0, ms: 0, bytes: 0}; }; });
  const blockOfScript = sid => { const s = scripts.get(sid); if (!s) return null; return BLOCKS.find(b => b.l0 - 1 === s.line && b.c0 === s.col) || null; };
  const takeCounts = async () => { const {result} = await cdp.send('Profiler.takePreciseCoverage'); const fns = [];
   for (const sc of result) { if (!sc.url || !sc.url.startsWith(HOST + '/v/')) continue; const b = blockOfScript(sc.scriptId);
    for (const f of sc.functions) { const r0 = f.ranges[0]; if (!r0 || !r0.count) continue; const line = b ? lineOf(b.s + r0.startOffset) : null; fns.push([(f.functionName || '(anonymous)') + ' @' + (line || '?') + ' ' + (b ? b.label : '?'), r0.count]); } }
   return fns; };
  const SHOW = /^(bump|save|save775Inner|persist|render|renderPass|renderDemob816|demob816|listHtml816|renderTabs|syncFooter|syncPush|syncStage|syncStageLive|syncSend|syncSettled|toDocs|buildAllAssets|applyCapability|markCards|financeOperational857|hzTodayPod|flash|damagedBanner|openAsset|openAsset_held|holdAssets|model|viewHtml|sectionsHtml|groupsHtml|cardHtml|lampsHtml|planLoads|cutLoads|loadsHtml|bookedHtml|barHtml|decorate|decorateDays|dayLists|dayRows|dayPct|stateOf|cardsOf|everyRows|clashOf|sheetClash|setUnitReady|setBooking|putBooking|bookLoad|keepUnits|figures|daily|progress|arm|show|want|pump|drawPic|applyFilter|count|demobPass|pageDraw|heldFresh775|units816|deliveryOf|deliveryView|lastOnSite816|wireDemob816|dayHtml816|mark|state|cells|actions|status|read|unit|setEmptied816|open|pickUp|lamp|stopsOf|locOf|picture|locate|attention|capture|restore|background|summary|calendar|clock|close|tblFocusSoon|mergeRecords)\s@/;
  async function countPress(name, spec, sel, prepare) {
   if (prepare) await prepare(); await quiet();
   await takeCounts(); await p.evaluate(() => __cntReset()); await p.evaluate(s => __arm(s), spec);
   try { await p.click(sel, {timeout: CLICK_MS}); } catch (e) { out.errors.push('count ' + name + ': ' + String(e && e.message || e).slice(0, 160)); }
   await settle();
   const r = await p.evaluate(() => __collect()), fns = await takeCounts(), w = await p.evaluate(() => JSON.parse(JSON.stringify(__cnt)));
   Object.keys(w.fn).forEach(k => { w.fn[k].ms = Math.round(w.fn[k].ms * 10) / 10; }); ['json', 'ls'].forEach(k => Object.keys(w[k]).forEach(x => { w[k][x] = Math.round(w[k][x] * 10) / 10; }));
   out.counts[name] = {paneRebuilds: r.paneRebuilds, idle: r.idle, visPainted: r.visPainted, wrappers: w, calls: fns.filter(x => SHOW.test(x[0])).sort((a, b) => b[1] - a[1]), topCalls: fns.sort((a, b) => b[1] - a[1]).slice(0, 60)}; save();
   console.log((MOB ? 'phone ' : 'desktop ') + 'count ' + name + ': rebuilds ' + r.paneRebuilds + ' renderDemob816 ' + ((w.fn.renderDemob816 || {}).n || 0) + ' render ' + ((w.fn.render || {}).n || 0));
  }
  if (U) {
   await view(cardSel(K, U)); await countPress('not_ready', {kind: 'cardState', sel: cardSel(K, U), want: 'not'}, cardSel(K, U) + ' button[data-lamp1238="not"]');
   await view(cardSel(K, U)); await countPress('ready', {kind: 'cardState', sel: cardSel(K, U), want: 'ready'}, cardSel(K, U) + ' button[data-lamp1238="ready"]');
  }
  if (pick.GN18) await countPress('book_one_unit', {kind: 'bookOn', sel: cardSel('GN18', pick.GN18.uid), text: '11:30'}, 'dialog.bkd1238 [data-bk1238="save"]', async () => {
   await view(cardSel('GN18', pick.GN18.uid)); await p.click(cardSel('GN18', pick.GN18.uid) + ' button[data-book1238]'); await p.waitForSelector('dialog.bkd1238[open]');
   await p.click('dialog.bkd1238 [data-day1238="' + pick.tomorrow + '"]'); await p.click('dialog.bkd1238 [data-h1238="11"]'); await p.click('dialog.bkd1238 [data-m1238="30"]'); });
  await p.evaluate(() => { const d = document.querySelector('dialog.bkd1238'); if (d && d.open) d.close(); });
  const hasTruck = await p.evaluate(() => { document.querySelectorAll('[data-probe1238]').forEach(x => x.removeAttribute('data-probe1238')); const b = [...document.querySelectorAll('#pane-demob [data-ldbook1238]')].find(x => x.textContent.trim() === 'Book this load'); if (!b) return false; b.setAttribute('data-probe1238', 'ld'); b.scrollIntoView({block: 'center'}); return true; });
  if (hasTruck) await countPress('book_this_load', {kind: 'loadBooked'}, 'dialog.bkd1238 [data-bk1238="save"]', async () => {
   await p.waitForTimeout(400); await p.click('#pane-demob [data-probe1238="ld"]'); await p.waitForSelector('dialog.bkd1238[open]');
   await p.click('dialog.bkd1238 [data-day1238="' + pick.dayAfter + '"]'); await p.click('dialog.bkd1238 [data-h1238="15"]'); await p.click('dialog.bkd1238 [data-m1238="30"]'); });
  await p.evaluate(() => { const d = document.querySelector('dialog.bkd1238'); if (d && d.open) d.close(); });
  if (pick.PU) { const sel = cardSel(pick.PU.key, pick.PU.uid); await view(sel); await countPress('picked_up_form', {kind: 'form'}, sel + ' button[data-lamp1238="gone"]');
   await p.evaluate(() => { const b = document.querySelector('#collection996 [data-collection996-close]'); if (b) b.click(); }); await p.waitForTimeout(1500); }
  /* the direct calls once more under the counter: one bump() and one renderDemob816() */
  for (const [name, fn] of [['direct_bump', 'bump'], ['direct_renderDemob816', 'renderDemob816']]) {
   await quiet(); await takeCounts(); await p.evaluate(() => __cntReset());
   const ms = await p.evaluate(fn => { const t = performance.now(); window[fn](); return Math.round((performance.now() - t) * 10) / 10; }, fn); await settle();
   const fns = await takeCounts(), w = await p.evaluate(() => JSON.parse(JSON.stringify(__cnt))); Object.keys(w.fn).forEach(k => { w.fn[k].ms = Math.round(w.fn[k].ms * 10) / 10; });
   out.counts[name] = {syncMs: ms, wrappers: w, calls: fns.filter(x => SHOW.test(x[0])).sort((a, b) => b[1] - a[1])}; save(); }
  await cdp.send('Profiler.stopPreciseCoverage').catch(() => {});
  out.writesBlocked = h.counts.blocked; out.pageErrors = h.errors.slice(0, 20);
  out.capturedWrites = await p.evaluate(() => (window.__captured1238 || []).length);
 } catch (e) { out.errors.push(String(e && e.stack || e).slice(0, 800)); console.error(e); }
 finally {
  /* medians per press over the profiled runs */
  for (const [name, a] of Object.entries(out.actions)) {
   const runs = a.runs.filter(r => r.mode === 'profile'), M = k => med(runs.map(r => r[k]));
   a.median = {visDom: M('visDom'), visPainted: M('visPainted'), flashPainted: M('flashPainted'), clickTaskEnd: M('clickTaskEnd'), idle: M('idle'), ltTotal3s: M('ltTotal3s'), ltMax: M('ltMax'), longTasks: med(runs.map(r => r.longTasks.length)), paneRebuilds: M('paneRebuilds'), inputDelay: M('inputDelay'), busyMsProfile: med(runs.map(r => r.profile && r.profile.busyMs))};
   const fold = key => { const m = new Map(); runs.forEach((r, i) => (r.profile ? r.profile[key] : []).forEach(([k, v]) => { if (!m.has(k)) m.set(k, Array(runs.length).fill(0)); m.get(k)[i] = v; })); return [...m].map(([k, xs]) => [k, med(xs), xs]).sort((x, y) => y[1] - x[1]); };
   a.median.self = fold('self').slice(0, 60); a.median.incl = fold('incl').slice(0, 90); a.median.modSelf = fold('modSelf').slice(0, 30); a.median.modIncl = fold('modIncl').slice(0, 30);
  }
  out.finished = new Date().toISOString(); save();
  try { await h.browser.close(); } catch (e) {}
 }
})();
