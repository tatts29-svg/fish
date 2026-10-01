// Author: Andrew Fisher. Navigation invariants and a paired, read-only benchmark.
// BASELINE=/path/base.html PAGE=/path/candidate.html GC500_TEST_RESULTS_DIR=/private/path
// [MOB=1] [REPEATS=5] [TABS=about,docs,today,progress,costs,plant] node navigation_browser.js
// The harness blocks record writes. All shared data, DOM and model captures stay in
// the explicitly supplied private directory; stdout contains timings/counts only.
const {open} = require('../../toolchain/harness/open_page');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const OUT = process.env.GC500_TEST_RESULTS_DIR;
if (!OUT || !path.isAbsolute(OUT)) throw Error('Set GC500_TEST_RESULTS_DIR to an absolute private directory');
fs.mkdirSync(OUT, {recursive: true, mode: 0o700});
const mobile = process.env.MOB === '1';
const repeats = Math.max(3, Number(process.env.REPEATS || 5));
const tabs = (process.env.TABS || 'about,docs,today,progress,costs,plant').split(',');
const sha = x => crypto.createHash('sha256').update(typeof x === 'string' || Buffer.isBuffer(x) ? x : JSON.stringify(x)).digest('hex');
const canonical = x => Array.isArray(x) ? x.map(canonical) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map(k => [k, canonical(x[k])])) : x;
const write = (name, data) => fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2), {mode: 0o600});
const stat = values => { const xs = values.slice().sort((a, b) => a - b); return {median: xs[Math.floor(xs.length / 2)], p95: xs[Math.min(xs.length - 1, Math.ceil(xs.length * 0.95) - 1)], min: xs[0], max: xs[xs.length - 1]}; };

async function settle(p) {
  // Plant intentionally fills the rest of its rows in later frames. Read it only
  // once those frames finish; the benchmark measures the first paint separately.
  await p.waitForFunction(() => typeof PLANT_REST === 'undefined' || !PLANT_REST.flush, null, {timeout: 60000});
  await p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function openFrozen(file, fixture) {
  const h = await open(mobile ? {pageFile: file, mobile: true, W: 390, H: 844, dpr: 2} : {pageFile: file, W: 1440, H: 900});
  const p = h.page, consoleErrors = [], permission = {level: 'view'};
  p.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
  await p.emulateMedia({reducedMotion: 'reduce'});
  await p.waitForFunction(() => typeof go === 'function' && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 150000});
  await p.evaluate(() => docsRefresh(false));
  await p.waitForFunction(() => DOCS.state === 'ready', null, {timeout: 90000});
  const version = await p.evaluate(async () => (await (await fetch('/api/version', {headers: {'x-gc500-token': 'Coates-GC500-2026'}})).json()).version);
  // Stop live snapshots from changing the measured input, and keep permissions
  // under test from being flipped back by the four-second version poll.
  await p.route('**/api/version', route => route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({version, level: permission.level})}));
  await p.evaluate(() => {
    SYNC.unsub.forEach(u => u()); SYNC.unsub = [];
    clearTimeout(SYNC.timer); clearTimeout(SYNC.retry); SYNC.timer = SYNC.retry = null;
    SYNC.queue = {}; SYNC.inflight = {};
    SYNC.db.doc = () => ({set: async () => { throw Error('Benchmark blocks record writes'); }, delete: async () => { throw Error('Benchmark blocks record writes'); }});
  });
  if (!fixture) fixture = await p.evaluate(() => {
    const copy = JSON.parse(JSON.stringify(S)); delete copy.mapKeys;
    return {record: copy, documents: JSON.parse(JSON.stringify(DOCS)), day: todayIso(), clock: Date.now()};
  });
  await p.evaluate(f => {
    const NativeDate = Date;
    window.Date = class extends NativeDate { constructor(...args) { super(...(args.length ? args : [f.clock])); } static now() { return f.clock; } };
    Object.assign(DOCS, JSON.parse(JSON.stringify(f.documents)), {at: f.clock, state: 'ready', busy: false});
    const mapKeys = S.mapKeys; S = JSON.parse(JSON.stringify(f.record)); S.mapKeys = mapKeys; SYNC.readonly = true; SYNC.level = 'view'; ASSETS_HELD = null; HELD_MEMO.clear(); RENDER_MEMO.clear(); go('about');
  }, fixture);
  await settle(p);
  return {h, p, fixture, version, consoleErrors, permission};
}
async function semantic(p, tab) {
  await p.evaluate(t => go(t), tab); await settle(p);
  return p.evaluate(t => {
    const pane = document.getElementById('pane-' + t), normal = s => String(s || '').replace(/\s+/g, ' ').trim();
    const copy = pane.cloneNode(true);
    // External weather/time status is not changed by this navigation patch.
    copy.querySelectorAll('video,canvas,.wxp,.weather,.wxcard,[data-weather],.clock,[data-clock]').forEach(el => el.remove());
    const text = normal(copy.innerText || copy.textContent).replace(/last confirmed\s+\d{1,2}:\d{2}/gi, 'last confirmed [time]');
    return {tab: state.tab, shown: !pane.hidden, heading: pane.getAttribute('aria-labelledby'), text,
      controls: [...pane.querySelectorAll('input,select,textarea,button')].map(e => ({tag: e.tagName, id: e.id, type: e.type, disabled: e.disabled, readOnly: e.readOnly || false, value: e.tagName === 'BUTTON' ? normal(e.textContent) : e.value})),
      counts: {rows: pane.querySelectorAll('tr').length, links: pane.querySelectorAll('a').length},
      width: {viewport: document.documentElement.clientWidth, page: document.documentElement.scrollWidth}};
  }, tab);
}
async function models(p) {
  return p.evaluate(() => {
    RENDER_MEMO.clear();
    return holdAssets(() => ({assets: allAssets(), money: moneySummary(), business: typeof pl770Model === 'function' ? pl770Model() : null, jobForecast: cj764Model(), rehire: rh766Model(), labour: labourPlan(), day: dsnState(todayIso())}));
  });
}
async function invariants(p, permission) {
  const checks = [], snapshots = {};
  const ok = (name, pass) => checks.push({name, pass: !!pass});
  const view = await semantic(p, 'pricing'); snapshots.viewPricing = view;
  permission.level = 'edit';
  await p.evaluate(() => { SYNC.readonly = false; SYNC.level = 'edit'; });
  const edit = await semantic(p, 'pricing'); snapshots.editPricing = edit;
  ok('changing capability enables existing pricing inputs', edit.controls.filter(x => ['INPUT', 'SELECT', 'TEXTAREA'].includes(x.tag) && !x.disabled).length > view.controls.filter(x => ['INPUT', 'SELECT', 'TEXTAREA'].includes(x.tag) && !x.disabled).length);
  permission.level = 'view';
  await p.evaluate(() => { SYNC.readonly = true; SYNC.level = 'view'; });
  const revoked = await semantic(p, 'pricing'); snapshots.revokedPricing = revoked;
  ok('revoking capability restores all pricing control states', JSON.stringify(view.controls) === JSON.stringify(revoked.controls));
  const freshness = await p.evaluate(async () => {
    const a = allAssets().find(x => !x._cancelled && !x._moved && !movedAway(x.key));
    if (!a) throw Error('No reference available for the in-memory freshness check');
    const k = a.key, existed = Object.prototype.hasOwnProperty.call(S.assetNumbers || {}, k), old = (S.assetNumbers || {})[k];
    const token = 'BENCH776', before = JSON.stringify(assetNumbersOf(assetOf(k)));
    S.assetNumbers = S.assetNumbers || {}; S.assetNumbers[k] = [...(old || []), token];
    let within = false; const pass = renderPass;
    renderPass = function () { within = assetNumbersOf(assetOf(k)).includes(token); return pass.apply(this, arguments); };
    try { go('about'); } finally { renderPass = pass; }
    const afterReturn = ASSETS_HELD === null && HELD_MEMO.size === 0;
    // Alter the record after go returns, before the next frame. Nothing is saved.
    if (existed) S.assetNumbers[k] = old; else delete S.assetNumbers[k];
    const frame = await new Promise(resolve => requestAnimationFrame(() => resolve({fresh: JSON.stringify(assetNumbersOf(assetOf(k))) === before, clear: ASSETS_HELD === null && HELD_MEMO.size === 0})));
    go('about');
    return {within, afterReturn, nextFrameFresh: frame.fresh, nextFrameHoldClear: frame.clear, restored: JSON.stringify(assetNumbersOf(assetOf(k))) === before};
  });
  for (const [name, pass] of Object.entries(freshness)) ok('record freshness: ' + name, pass);
  const financialFreshness = await p.evaluate(() => {
    const original = S.costs, amount = 37.21, read = () => ({known: moneySummary().cost.known, forecast: cj764Model().known, business: pl770Model().costNow});
    const same = (a, b) => Object.keys(a).every(k => Math.abs(a[k] - b[k]) < 0.001);
    go('costs'); const before = read();
    try {
      S.costs = (original || []).concat([{id: 'BENCH-776-EXPENSE', side: 'ours', kind: 'misc', category: OUR_KIND.misc.category, recorded_by: 'Benchmark example', date: todayIso(), description: 'Synthetic browser-only cache freshness check', amount}]);
      go('costs'); const after = read();
      const changed = Object.keys(before).every(k => Math.abs(after[k] - before[k] - amount) < 0.001);
      S.costs = original; go('costs'); return {changed, restored: same(before, read())};
    } finally { S.costs = original; go('about'); }
  });
  ok('a synthetic expense refreshes all financial cards after navigation', financialFreshness.changed);
  ok('removing the synthetic expense restores all financial cards', financialFreshness.restored);
  const throwing = await p.evaluate(() => {
    const original = renderPass; let propagated = false;
    renderPass = () => { throw Error('synthetic render failure'); };
    try { go('about'); } catch (e) { propagated = e.message === 'synthetic render failure'; } finally { renderPass = original; }
    const cleared = ASSETS_HELD === null && HELD_MEMO.size === 0;
    go('about'); return {propagated, cleared};
  });
  ok('render exceptions propagate and always release held caches', throwing.propagated && throwing.cleared);
  return {checks, snapshots};
}
async function instrument(p) {
  await p.evaluate(() => {
    const names = ['go', 'go776Held', 'renderTabs', 'attention', 'buildAllAssets', 'rentalOf_', 'dsnState_', 'render', 'renderPass', 'hzTodayPod', 'applyCapability', 'markCards'];
    window.__nav776 = {active: false, phase: null, counts: {}, elapsed: {}};
    for (const name of names) {
      if (typeof window[name] !== 'function') continue;
      const fn = window[name];
      window[name] = function () {
        const rec = window.__nav776, on = rec.active, key = rec.phase + ':' + name, start = on ? performance.now() : 0;
        if (on) rec.counts[key] = (rec.counts[key] || 0) + 1;
        try { return fn.apply(this, arguments); } finally { if (on) rec.elapsed[key] = (rec.elapsed[key] || 0) + performance.now() - start; }
      };
    }
  });
}
async function measuredGo(p, tab) {
  return p.evaluate(async t => {
    const r = window.__nav776; r.active = true; r.phase = 'sync'; r.counts = {}; r.elapsed = {};
    const started = performance.now(); go(t); const returned = performance.now();
    const released = ASSETS_HELD === null && HELD_MEMO.size === 0; r.phase = 'paint';
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const painted = performance.now(); r.active = false;
    return {goMs: returned - started, paintMs: painted - started, released, frameReleased: ASSETS_HELD === null && HELD_MEMO.size === 0, counts: r.counts, elapsed: r.elapsed};
  }, tab);
}
async function benchmark(session) {
  const {p} = session; await instrument(p); const data = {};
  for (const t of tabs) { await p.evaluate(k => go(k), t); await settle(p); }
  for (let round = 0; round < repeats; round++) {
    // Reverse alternate rounds so each expensive tab does not always follow the
    // same pane. A separator ensures each timed call is a real tab change.
    const order = round % 2 ? tabs.slice().reverse() : tabs;
    for (const tab of order) {
      await p.evaluate(t => go(t === 'about' ? 'docs' : 'about'), tab); await settle(p);
      const r = await measuredGo(p, tab); (data[tab] = data[tab] || []).push(r); await settle(p);
    }
  }
  const summaries = Object.fromEntries(Object.entries(data).map(([t, xs]) => [t, {goMs: stat(xs.map(x => x.goMs)), paintMs: stat(xs.map(x => x.paintMs)), buildAllAssets: stat(xs.map(x => x.counts['sync:buildAllAssets'] || 0)), heldCachesAlwaysReleased: xs.every(x => x.released && x.frameReleased)}]));
  return {samples: data, summaries};
}
async function inspect(file, label, fixture) {
  const session = await openFrozen(file, fixture);
  try {
    const dom = {}; for (const tab of tabs) dom[tab] = await semantic(session.p, tab);
    const model = await models(session.p), rules = await invariants(session.p, session.permission);
    const evidence = {file, sha256: sha(fs.readFileSync(file)), version: session.version, dom, model, rules};
    write(label + '-semantics.json', evidence);
    return {session, evidence};
  } catch (e) { await session.h.browser.close(); throw e; }
}
(async () => {
  const baselineFile = process.env.BASELINE, candidateFile = process.env.PAGE;
  if (!baselineFile || !candidateFile) throw Error('Both BASELINE and PAGE are required');
  let base, next;
  try {
    base = await inspect(baselineFile, 'baseline'); write('fixture.json', base.session.fixture);
    // Do not run two rendering browsers concurrently during timing.
    const baselineBench = await benchmark(base.session); write('baseline-benchmark.json', baselineBench);
    const baselineErrors = {page: base.session.h.errors, console: base.session.consoleErrors};
    await base.session.h.browser.close();
    next = await inspect(candidateFile, 'candidate', base.session.fixture);
    const comparisons = [];
    for (const tab of tabs) comparisons.push({name: tab + ' semantic DOM unchanged', pass: sha(canonical(base.evidence.dom[tab])) === sha(canonical(next.evidence.dom[tab]))});
    comparisons.push({name: 'financial, labour, delivery and asset models unchanged', pass: sha(canonical(base.evidence.model)) === sha(canonical(next.evidence.model))});
    comparisons.push({name: 'permission states unchanged', pass: sha(canonical(base.evidence.rules.snapshots)) === sha(canonical(next.evidence.rules.snapshots))});
    comparisons.push(...base.evidence.rules.checks.map(x => ({...x, name: 'baseline: ' + x.name})), ...next.evidence.rules.checks.map(x => ({...x, name: 'candidate: ' + x.name})));
    const candidateBench = await benchmark(next.session); write('candidate-benchmark.json', candidateBench);
    comparisons.push({name: 'candidate builds one asset snapshot per synchronous navigation', pass: Object.values(candidateBench.samples).flat().every(x => x.counts['sync:buildAllAssets'] === 1)});
    comparisons.push({name: 'all navigation calls and first paints release held caches', pass: Object.values(baselineBench.summaries).concat(Object.values(candidateBench.summaries)).every(s => s.heldCachesAlwaysReleased)});
    comparisons.push({name: 'no page or console errors', pass: !baselineErrors.page.length && !baselineErrors.console.length && !next.session.h.errors.length && !next.session.consoleErrors.length});
    const timing = Object.fromEntries(tabs.map(t => [t, {baseline: baselineBench.summaries[t], candidate: candidateBench.summaries[t], goMedianImprovementPct: 100 * (1 - candidateBench.summaries[t].goMs.median / baselineBench.summaries[t].goMs.median)}]));
    const result = {author: 'Andrew Fisher', mobile, repeats, samePrivateSnapshot: true, mode: 'reduced motion; record, document index and clock frozen; one browser rendering at a time', passed: comparisons.filter(x => x.pass).length, total: comparisons.length, comparisons, timing, errors: {baseline: baselineErrors, candidate: {page: next.session.h.errors, console: next.session.consoleErrors}}};
    write('navigation-result.json', result);
    console.log(JSON.stringify({passed: result.passed, total: result.total, mobile, repeats, comparisons, timing}));
    if (result.passed !== result.total) process.exitCode = 1;
  } finally { if (base) await base.session.h.browser.close().catch(() => {}); if (next) await next.session.h.browser.close(); }
})().catch(e => { console.error('FAIL:', e.message); process.exitCode = 1; });
