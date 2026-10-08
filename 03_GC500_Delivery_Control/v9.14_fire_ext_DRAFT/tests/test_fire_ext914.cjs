// Author: Andrew Fisher. v9.14 practice tests - fire extinguishers added by quantity on any location, no asset number,
// charged per piece through the page's fire_ext money path.
// Read only. The page is the build, served at the live address by the harness, reading the live record by GET. Every write
// the page tries is aborted. The one editor save in session A is captured in page.route and aborted there, and a fresh read
// of the record afterwards proves it never reached the service. Session B simulates records arriving from the service by
// changing the GET answer in the browser only. No money figure is printed: money moves are said as multiples of the card's
// Fire Ext. figure (F) and as counts.
//   PAGE=<build> [MOB=1] node tests/test_fire_ext914.cjs        (screenshots go to ../evidence/)
const path = require('path'), fs = require('fs'), {execFileSync} = require('child_process');
const {open} = require('../../toolchain/harness/open_page');
const {curlFetch} = require('../../toolchain/harness/curlfetch');
const MOB = process.env.MOB === '1', PAGE = process.env.PAGE, EVID = path.join(__dirname, '..', 'evidence');
const HOST = 'https://gc500-production.up.railway.app';
const checks = []; const ok = (name, pass, detail) => { checks.push({name, pass: !!pass}); console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? ' ' + JSON.stringify(detail).slice(0, 1500) : '')); };
const W = MOB ? 390 : 1440, H = MOB ? 844 : 900, TAG = MOB ? 'phone' : 'laptop';
const recordNow = () => JSON.parse(execFileSync('curl', ['-sS', '--max-time', '60', '-H', 'x-gc500-token: Coates-GC500-2026', HOST + '/api/state'], {maxBuffer: 1 << 28}).toString());
const fireRowsIn = rec => { const out = []; const d = (rec.docs || {}).accessories || {}; Object.values(d).forEach(x => ((x && x.v) || []).forEach(r => { if (r && r.type === 'Fire extinguisher') out.push(x._k); })); return out; };
const ready = p => p.waitForFunction(() => typeof fire914Of === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.has('accessories') && typeof go === 'function', null, {timeout: 240000});
const MONEY_SNAP = () => { RENDER_MEMO.clear(); return holdAssets(() => {
  const flat = {}; const walk = (o, p, d) => { if (d > 7 || o == null) { if (o === null) flat[p] = null; return; }
    if (typeof o === 'number' || typeof o === 'boolean') { flat[p] = o; return; } if (typeof o !== 'object') return;
    if (Array.isArray(o)) { if (o.length > 400) return; o.forEach((v, i) => walk(v, p + '[' + i + ']', d + 1)); return; }
    Object.keys(o).forEach(k => { if (/^(asAt|at|now|generated|by|basis|evidence|words|sources|slots)$/.test(k)) return; walk(o[k], p ? p + '.' + k : k, d + 1); }); };
  const A = k => allAssets().find(x => x.key === k), LP = labourPlan(), AL = acc761Labour();
  const pick = t => ({known: t.known, total: t.total, labour: t.labour, accessories: t.accessories, base: t.base});
  walk({M: moneySummary(), P: pl770Model(), H: fh866Model(), X: cj764Model(), B: pl752Rows(), TK: pl760Ticks(), LP: {all: LP.all, fire: LP.byLine.get('Fire extinguisher') || null, moved: LP.byLine.get('Relocated or moved units') || null},
    AL, LR: (() => { const r = labourRevenue858(); return {sums: r.sums, priced: r.priced, recorded: r.recorded, job: r.job, remaining: r.remaining}; })(),
    A761: (() => { const o = {revenueTotal: 0, forecastRevenueTotal: 0, costCandidateTotal: 0, forecastCostTotal: 0, unallocated: 0, fire: [{amount: 0, n: 0, unpriced: 0}]};
      ['2026-09', '2026-10'].map(m => acc761Model(m)).forEach(x => { ['revenueTotal', 'forecastRevenueTotal', 'costCandidateTotal', 'forecastCostTotal'].forEach(k => { o[k] = Math.round((o[k] + (x[k] || 0)) * 100) / 100; });
        x.revenue.filter(r => /^Fire extinguishers/.test(r.stream)).forEach(r => { o.fire[0].amount = Math.round((o.fire[0].amount + (r.amount || 0)) * 100) / 100; o.fire[0].n += r.extra.sourceCount; o.fire[0].unpriced += r.extra.unpricedCount; }); });
      return o; })(),
    AT: {AA: pick(assetTotal(A('AA'))), GN01: pick(assetTotal(A('GN01'))), WC09: pick(assetTotal(A('WC09')))},
    RH: typeof rh766Model === 'function' ? rh766Model() : null, R: recon888Model().ties.map(t => ({ok: t.ok}))}, '', 0);
  return flat; }); };
// the money moves between two snapshots, as multiples of F (the card's Fire Ext. figure for AA) and as counts - never as dollars
const DIFF = ([s0, s1, F]) => { const out = []; new Set(Object.keys(s0).concat(Object.keys(s1))).forEach(k => { const a = s0[k], b = s1[k];
  if (typeof a === 'number' && typeof b === 'number') { if (Math.abs(a - b) > 0.004) { const d = b - a, cnt = Number.isInteger(d) && Math.abs(d) < 100 && /(tick|unpriced|unknown|(^|\.)n(\.|$)|\.n\.|count|lines|\bn$)/i.test(k);
      if (cnt) { out.push({k, count: d}); return; }
      const near = [2, -1, -2, 1, 0].find(r => Math.abs(d - r * F) <= 1.0001); /* a figure shown to the whole dollar moves by the same multiple, rounded */
      out.push(/breakeven|pct|percent|ratio|share/i.test(k) ? {k, derived: true, xF: Math.round(d / F * 10000) / 10000} : near !== undefined && Math.abs(d - near * F) > 0.004 ? {k, xF: near, dollarRounded: true} : {k, xF: Math.round(d / F * 10000) / 10000}); } }
  else if (a !== b) out.push({k, from: a === undefined ? 'absent' : a === null ? 'null' : typeof a === 'number' ? 'number' : String(a), to: b === undefined ? 'absent' : b === null ? 'null' : typeof b === 'number' ? 'number' : String(b)}); }); return out; };
const shotEl = async (p, file, sel) => { /* one element, cut to the screen; reports whether a dollar figure is in frame */
  await p.evaluate(s => { const f = document.querySelector('#flash'); if (f) { f.hidden = true; f.style.display = 'none'; } const el = document.querySelector(s); if (el) el.scrollIntoView({block: 'center'}); }, sel);
  await p.waitForTimeout(700);
  const box = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); const top = Math.max(0, r.top), bottom = Math.min(innerHeight, r.bottom);
    return {x: Math.max(0, r.left), y: top, width: Math.min(innerWidth, r.right) - Math.max(0, r.left), height: bottom - top, dollars: /\$\s?\d/.test(e.innerText)}; }, sel);
  if (!box || box.width < 2 || box.height < 2) return {missing: true};
  await p.screenshot({path: path.join(EVID, file), clip: {x: box.x, y: box.y, width: box.width, height: box.height}, animations: 'disabled'});
  return box; };
const openContents = (p, key) => p.evaluate(k => { openAsset(k); const d = document.querySelector('#drawer details[data-f816="contents"]'); if (d) d.open = true; return !!d; }, key);
const blockState = (p, key) => p.evaluate(k => { const f = document.querySelector('#drawer [data-fire914]'); const fold = f ? f.closest('details[data-f816]') : document.querySelector('#drawer details[data-f816="contents"]');
  const v = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
  return {key: k, block: !!f, fold: fold ? fold.dataset.f816 : null, sum: fold ? fold.querySelector('summary').innerText.replace(/\s+/g, ' ').trim() : null,
    words: f && f.querySelector('[data-fire914-words]') ? f.querySelector('[data-fire914-words]').textContent : null, charge: f && f.querySelector('[data-fire914-charge]') ? f.querySelector('[data-fire914-charge]').textContent : null,
    save: f && f.querySelector('[data-fire914-save]') ? f.querySelector('[data-fire914-save]').textContent.trim() : null,
    buttons: f ? [...f.querySelectorAll('button')].filter(v).map(b => ({t: b.textContent.trim(), h: Math.round(b.getBoundingClientRect().height)})) : [],
    controls: f ? f.querySelectorAll('button, input, select').length : 0, cap: capability()}; }, key);

async function sessionA() {
  const before = recordNow();
  ok('the record holds no fire extinguisher rows before the test', fireRowsIn(before).length === 0, {version: before.version});
  const s = await open({pageFile: PAGE, mobile: MOB, W, H, dpr: MOB ? 2 : 1}); const p = s.page; const cons = [];
  p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); }); p.on('crash', () => console.log('INFO the page crashed (renderer)')); s.browser.on('disconnected', () => console.log('INFO the browser disconnected'));
  try {
    await ready(p);
    const base = await p.evaluate(() => ({cap: capability(), kinds: ['AA', 'GN01', 'T0001', 'WC09', 'T0023'].map(k => k + ':' + refKind(assetOf(k)) + (isPlantLine(assetOf(k)) ? ':plant line' : '')),
      fireTicks: Object.keys(S.labour || {}).filter(k => /\|fire_ext$/.test(k) && S.labour[k]).length, fireRows: Object.values(S.accessories || {}).flat().filter(fire914Is).length}));
    ok('sample locations: AA building, GN01 generator, T0001 plant line (VMS), WC09 toilet, T0023 container; no fire ticks or rows on the record', base.cap !== 'edit' && base.fireTicks === 0 && base.fireRows === 0 && /T0001:other:plant line/.test(base.kinds.join(' ')), base);
    // THE VIEW LINK: no control anywhere
    const view = [];
    for (const k of ['AA', 'GN01', 'T0001']) { await openContents(p, k); view.push(await blockState(p, k)); }
    ok('view link: no fire extinguisher control or prompt on a building, a generator or a plant line', view.every(v => !v.block && v.controls === 0 && !/fire extinguisher/i.test(v.sum || '')), view);
    const quiet = s.counts.blocked;
    // THE EDITOR: practice edit capability; every write is captured in page.route and aborted there
    const captured = [];
    await p.route('**/api/doc/**', async route => { const r = route.request(); captured.push({method: r.method(), url: r.url().replace(HOST, ''), body: r.postData()}); await route.abort(); });
    await p.evaluate(() => { window.capability = () => 'edit'; SYNC.readonly = false; SYNC.level = 'edit'; S.operator = 'Practice Editor';
      const original = window.fetch; window.fetch = async (u, o) => { const r = await original(u, o); if (/\/api\/(version|state)(\?|$)/.test(String(u)) && r.ok) { const j = await r.clone().json(); j.level = 'edit'; return new Response(JSON.stringify(j), {status: 200, headers: {'content-type': 'application/json'}}); } return r; };
      document.body.classList.remove('viewonly'); });
    await p.waitForTimeout(5000);
    const quietWrites = captured.length;
    const ed = [];
    for (const k of ['AA', 'GN01', 'T0001', 'WC09', 'T0023']) { await openContents(p, k); ed.push(await blockState(p, k)); }
    const shows = e => e.block && e.fold === 'contents' && e.save === 'Add fire extinguisher' && e.buttons.length === 3 && e.buttons.every(b => b.h >= 44) && /\+ fire extinguisher/.test(e.sum || '');
    ok('editor: "Add fire extinguisher" with - and + (44 px taps) in "Inside it and asset numbers" on a building, a generator and a plant line', ['AA', 'GN01', 'T0001'].every(k => shows(ed.find(e => e.key === k))), ed.slice(0, 3));
    ok('editor: the same control on a toilet and a container', ['WC09', 'T0023'].every(k => shows(ed.find(e => e.key === k))), ed.slice(3));
    const ch = Object.fromEntries(ed.map(e => [e.key, e.charge]));
    ok("the charge is said in words, no dollar figure: the card's Fire Ext. figure on AA (headed 2025); rate to confirm on GN01, T0001, WC09, T0023",
      /charged per piece at the card’s Fire Ext\. figure for Building 6m \(the card heads that column 2025\)/.test(ch.AA) && ['GN01', 'T0001', 'WC09', 'T0023'].every(k => /rate to confirm/.test(ch[k]) && /never nought/.test(ch[k])) && !Object.values(ch).some(t => /\$/.test(t)), ch);
    // add 2 on AA: + once, then the one save
    await openContents(p, 'AA');
    const accBefore = await p.evaluate(() => JSON.stringify(S.accessories.AA || []));
    await p.click('#drawer [data-fire914-plus]'); await p.waitForTimeout(200);
    const label2 = await p.evaluate(() => ({n: document.querySelector('#drawer [data-fire914-n]').textContent, save: document.querySelector('#drawer [data-fire914-save]').textContent}));
    ok('+ sets the quantity to 2 without saving ("Add fire extinguisher × 2")', label2.n === '2' && label2.save === 'Add fire extinguisher × 2' && captured.length === quietWrites, label2);
    await p.click('#drawer [data-fire914-save]');
    await p.waitForTimeout(7000);
    const puts = captured.slice(quietWrites).filter(c => c.method === 'PUT' || c.method === 'POST' || c.method === 'DELETE');
    const urls = [...new Set(puts.map(c => decodeURIComponent(c.url)))];
    let body = {}; try { body = JSON.parse(puts[0].body); } catch (e) {}
    const v = Array.isArray(body.v) ? body.v : [];
    const fire = v.filter(r => r.type === 'Fire extinguisher'), row = fire[0] || {};
    ok('adding 2 on AA writes exactly one document, accessories/AA (captured and aborted), and nothing else', quietWrites === 0 && urls.length === 1 && urls[0] === '/api/doc/accessories/AA' && puts.every(c => c.body === puts[0].body), {quietWrites, urls, sends: puts.length});
    ok('the document holds one fire extinguisher row: quantity 2, no asset number, with who and when; the other rows unchanged',
      body._k === 'AA' && fire.length === 1 && row.qty === 2 && row.qty_stated === true && row.asset_no === null && row.as_written === 'Fire extinguisher' && row.origin === 'added in this page' && row._added === true
      && row.added_by === 'Practice Editor' && !isNaN(Date.parse(row.added_at)) && /not numbered/.test(row.asset_no_state) && JSON.stringify(v.filter(r => r.type !== 'Fire extinguisher')) === accBefore,
      {keys: Object.keys(row).sort(), qty: row.qty, asset_no: row.asset_no, asset_no_state: row.asset_no_state, by: row.added_by, others: v.length - fire.length});
    await openContents(p, 'AA');
    const after = await blockState(p, 'AA');
    ok('after the save the drawer reads "Fire extinguisher × 2" with Save quantity and Take off', after.words === 'Fire extinguisher × 2' && after.save === 'Save quantity' && after.buttons.some(b => b.t === 'Take off') && /Fire extinguisher × 2/.test(after.sum || '') && !/\d+ inside/.test((after.sum || '').replace('3 inside', '')), after);
    ok('the ordinary accessories list on AA is unchanged (still its 3 inside, no fire row in it)', await p.evaluate(() => { const a = assetOf('AA'); return (a.accessories || []).length === 3 && !(a.accessories || []).some(fire914Is) && ![...document.querySelectorAll('#drawer .acc b')].some(b => /Fire/.test(b.textContent)); }));
    const sh = await shotEl(p, 'drawer_editor_AA_' + TAG + '.png', '#drawer details[data-f816="contents"]');
    ok('screenshot: the editor drawer part on AA (practice capability), no dollar figure in frame', sh && !sh.missing && !sh.dollars, sh);
    const gnShot = await (async () => { await openContents(p, 'GN01'); return shotEl(p, 'drawer_editor_GN01_' + TAG + '.png', '#drawer [data-fire914]'); })();
    ok('screenshot: the editor control on a generator (GN01), rate to confirm, no dollar figure in frame', gnShot && !gnShot.missing && !gnShot.dollars, gnShot);
    const fit = await p.evaluate(() => ({page: document.documentElement.scrollWidth <= innerWidth + 1, drawer: (() => { const d = document.getElementById('drawer'); return d.scrollWidth <= d.clientWidth + 1; })()}));
    ok('the drawer fits the screen (no sideways scroll)', fit.page && fit.drawer, fit);
    const rec = recordNow();
    ok('the captured save never reached the service (fresh read has no fire extinguisher row)', fireRowsIn(rec).length === 0, {version: rec.version});
    ok('no page errors', s.errors.length === 0, s.errors);
    ok('no console errors other than the aborted practice save', cons.filter(t => !/net::ERR_FAILED|status of 40[34]|Failed to load resource/.test(t)).length === 0, cons.slice(0, 5));
    ok('the harness blocked nothing (the only write was captured and aborted in page.route); viewing wrote nothing', s.counts.blocked === 0 && quiet === 0, s.counts);
  } finally { await s.browser.close(); }
}

async function sessionB() {
  const s = await open({pageFile: PAGE, mobile: MOB, W, H, dpr: MOB ? 2 : 1}); const p = s.page; let phase = 0; const cons = [];
  p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); }); p.on('crash', () => console.log('INFO the page crashed (renderer)')); s.browser.on('disconnected', () => console.log('INFO the browser disconnected'));
  const row = (n, at) => ({type: 'Fire extinguisher', qty: n, qty_stated: true, as_written: 'Fire extinguisher', asset_no: null, asset_no_state: 'not numbered - counted by quantity', origin: 'added in this page', source_task: null, _added: true, added_at: at, added_by: 'Practice Recorder'});
  const ADD = {1: {AA: row(2, '2026-10-08T06:30:00.000Z')}, 2: {AA: row(2, '2026-10-08T06:30:00.000Z'), GN01: row(2, '2026-10-08T06:31:00.000Z'), WC09: row(2, '2026-10-08T06:32:00.000Z')}};
  await p.route(/\/api\/(version|state)(\?|$)/, async route => { const r = route.request(); const res = await curlFetch(r.url(), r.headers(), 'GET');
    let body = res.body; if (phase && res.status === 200) { const j = JSON.parse(body.toString()); j.version = j.version + 1000000 * phase;
      if (j.docs) { const acc = j.docs.accessories = j.docs.accessories || {}; Object.entries(ADD[phase]).forEach(([k, x]) => { const id = Object.keys(acc).find(i => acc[i] && acc[i]._k === k) || k; const d = acc[id] = acc[id] || {_k: k, v: []}; d.v = (d.v || []).filter(y => y.type !== 'Fire extinguisher').concat([x]); }); }
      body = Buffer.from(JSON.stringify(j)); }
    await route.fulfill({status: res.status, headers: res.headers, body}); });
  try {
    await ready(p); await p.waitForTimeout(3000);
    const F0 = await p.evaluate(() => { const l = chargeLines(assetOf('AA'))[0]; const L = fire914CardLine(l, 'AA'); window.__F = L ? L.rate : null; return {has: !!L, item: l.item, heading: L && L.heading};
    });
    ok("AA's item (Building 6m) has a card Fire Ext. figure (headed 2025); GN01 and WC09 have none", F0.has && F0.heading === 'Fire Ext. 2025' && await p.evaluate(() => !chargeLines(assetOf('GN01')).some(l => fire914CardLine(l, 'GN01')) && !chargeLines(assetOf('WC09')).some(l => fire914CardLine(l, 'WC09'))), F0);
    const pre = await p.evaluate(() => { const LP = labourPlan(); return {aaForecast: LP.slots.filter(x => x.ref === 'AA' && x.key === 'fire_ext').reduce((n, x) => n + (x.qty || 0), 0), aaStates: LP.slots.filter(x => x.ref === 'AA' && x.key === 'fire_ext').map(x => x.state),
      others: JSON.stringify(LP.slots.filter(x => x.ref !== 'AA' && x.key === 'fire_ext').map(x => [x.ref, x.item, x.unit, x.qty, x.state, x.value != null])), fireTicks: Object.keys(S.labour || {}).filter(k => /\|fire_ext$/.test(k) && S.labour[k]).length}; });
    const s0 = await p.evaluate(MONEY_SNAP);
    // phase 1: a record of 2 on AA arrives
    phase = 1;
    await p.waitForFunction(() => fire914Qty('AA') === 2, null, {timeout: 40000}); await p.waitForTimeout(1500);
    const s1 = await p.evaluate(MONEY_SNAP);
    const d1 = await p.evaluate(DIFF, [s0, s1, await p.evaluate(() => window.__F)]);
    const k = pre.aaForecast;
    const money1 = d1.filter(x => x.xF !== undefined), counts1 = d1.filter(x => x.count !== undefined), types1 = d1.filter(x => x.from !== undefined);
    console.log('INFO phase 1 (AA: 2) - AA had ' + k + ' fire_ext piece(s) in the forecast (' + pre.aaStates.join(', ') + '); every figure that moved, as a multiple of F:');
    money1.forEach(x => console.log('INFO   ' + x.k + '  ' + (x.xF > 0 ? '+' : '') + x.xF + ' x F' + (x.dollarRounded ? ' (a whole-dollar figure: the same move, rounded)' : '') + (x.derived ? ' (a ratio derived from revenue, not a charge)' : ''))); counts1.forEach(x => console.log('INFO   ' + x.k + '  count ' + (x.count > 0 ? '+' : '') + x.count)); types1.forEach(x => console.log('INFO   ' + x.k + '  ' + x.from + ' -> ' + x.to));
    const want = ['M.charge.labour', 'M.charge.total', 'TK.fire_ext.amount', 'TK.total', 'LP.all.charged', 'AT.AA.known', 'AT.AA.labour', 'AT.AA.total'];
    const at = kk => money1.find(x => x.k === kk);
    ok('the fire_ext group and every total that carries it move by exactly +2 x F: Costs charge (labour, total), the P&L ticks (fire_ext, total), the labour plan charged, AA\'s own charge',
      want.every(kk => at(kk) && at(kk).xF === 2), want.map(kk => kk + ':' + (at(kk) ? at(kk).xF : 'no move')));
    const allowed = new Set([2, -k, 2 - k]);
    const odd = money1.filter(x => !x.derived && !allowed.has(x.xF));
    ok('nothing else moves: every money figure that moved moved by +2 x F (charged), -' + k + ' x F (AA\'s forecast piece replaced) or ' + (2 - k) + ' x F (the two together)', odd.length === 0 && money1.length > 0, {odd, n: money1.length});
    const hire = money1.filter(x => (/^(B\.|RH\.|R\[|X\.transport|V\.)/.test(x.k) && !/^RH\.revenue(Job|Now)$/.test(x.k)) || /cost/i.test(x.k));
    ok('no hire, rehire, transport, cost or tie-out figure moves', hire.length === 0, hire);
    ok('labour recorded for install (labourRevenue858) does not move: fire is taken out of it once', !money1.some(x => /^LR\./.test(x.k) && !/^LR\.(job|remaining)$/.test(x.k)), money1.filter(x => /^LR\./.test(x.k)));
    ok("the Accruals/Finance schedule (Sep + Oct) carries the 2 pieces once: +2 x F on its revenue, one Fire extinguishers stream", (at('A761.revenueTotal') || {}).xF === 2 && (at('A761.fire[0].amount') || {}).xF === 2, money1.filter(x => /^A761/.test(x.k)));
    ok('counts: one more charged entry (the 2 pieces as one line) on Costs and the P&L', counts1.some(x => x.k === 'M.charge.labour_ticks' && x.count === 1) && counts1.some(x => x.k === 'TK.fire_ext.ticks' && x.count === 1), counts1);
    const st1 = await p.evaluate(() => { const LP = labourPlan(); return {others: JSON.stringify(LP.slots.filter(x => x.ref !== 'AA' && x.key === 'fire_ext').map(x => [x.ref, x.item, x.unit, x.qty, x.state, x.value != null])),
      aa: LP.slots.filter(x => x.ref === 'AA' && x.key === 'fire_ext').map(x => ({state: x.state, qty: x.qty, fire914: !!x.fire914})), fireTicks: Object.keys(S.labour || {}).filter(k => /\|fire_ext$/.test(k) && S.labour[k]).length,
      moved: !!labourPlan().byLine.get('Relocated or moved units'), tickOff: (() => { openAsset('AA'); const cb = document.querySelector('#drawer input[data-lab$="|fire_ext"]'); return cb ? cb.disabled : null; })()}; });
    ok('existing ticks unchanged: 0 fire_ext ticks on the record; every other building\'s fire_ext forecast identical; AA\'s forecast replaced by one charged slot of 2; no "Relocated or moved units" row',
      st1.fireTicks === 0 && pre.fireTicks === 0 && st1.others === pre.others && st1.aa.length === 1 && st1.aa[0].state === 'charged' && st1.aa[0].qty === 2 && st1.aa[0].fire914 && !st1.moved, {aa: st1.aa, moved: st1.moved, sameOthers: st1.others === pre.others});
    ok("AA's per-building fire_ext tick box is disabled while a quantity is added (the replace rule)", st1.tickOff === true || st1.tickOff === null, {tickOff: st1.tickOff});
    // the view link shows it: drawer, Equipment, sheets
    await openContents(p, 'AA');
    const vb = await blockState(p, 'AA');
    ok('view link: AA\'s drawer shows "Fire extinguisher × 2", with no control', vb.words === 'Fire extinguisher × 2' && vb.controls === 0 && vb.cap !== 'edit' && /Fire extinguisher × 2/.test(vb.sum || ''), vb);
    const sh1 = await shotEl(p, 'drawer_view_AA_' + TAG + '.png', '#drawer details[data-f816="contents"]');
    ok('screenshot: the view link drawer on AA, no dollar figure in frame', sh1 && !sh1.missing && !sh1.dollars, sh1);
    await p.evaluate(() => { const c = document.querySelector('#dclose'); if (c) c.click(); const a = assetOf('AA'); state.plantGroup = PLANT_GROUP_WORDS[a.product] || a.product || a.discipline; state.light = null; state.q = ''; go('plant'); render(); }); await p.waitForTimeout(3500);
    const eq = await p.evaluate(() => { const e = document.querySelector('#pane-plant [data-fire914-equip="AA"]'); if (!e) return null; let d = e.closest('details'); while (d) { d.open = true; d = d.parentElement && d.parentElement.closest('details'); } return e.innerText.trim(); });
    ok('Equipment: AA\'s row shows "Fire extinguisher × 2"', eq === 'Fire extinguisher × 2', eq);
    if (eq) { const sh2 = await shotEl(p, 'equipment_AA_' + TAG + '.png', '#pane-plant [data-fire914-equip="AA"]'); await p.evaluate(() => { const e = document.querySelector('#pane-plant [data-fire914-equip="AA"]'); e.closest('tr').setAttribute('data-fire914-row', '1'); });
      const sh3 = await shotEl(p, 'equipment_AA_row_' + TAG + '.png', '#pane-plant tr[data-fire914-row]');
      ok('screenshot: AA\'s Equipment row, no dollar figure in frame', sh3 && !sh3.missing && !sh3.dollars, sh3); }
    const sheets = await p.evaluate(() => { const strip = h => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      for (const d of programmeDays()) { const loads = dpLoads(d) || []; const g = loads.find(x => (x.rows || []).some(r => r.a.key === 'AA')); if (!g) continue;
        const drv = dpPage(d, g, 'drv', 1, loads.length), ins = dpPage(d, g, 'ins', 1, loads.length);
        return {day: d.iso, kind: g.kind, drv: strip(drv).includes('Fire extinguisher × 2'), ins: strip(ins).includes('Fire extinguisher × 2'), insBox: /dp-acc[^>]*>[\s\S]{0,400}?Fire extinguisher × 2/.test(ins), once: strip(ins).split('Fire extinguisher × 2').length - 1}; }
      return null; });
    ok('Drivers and Install sheets for AA\'s truck carry "Fire extinguisher × 2" (with a tick box on the Install sheet), once', sheets && sheets.drv && sheets.ins && sheets.insBox && sheets.once === 1, sheets);
    if (sheets) { /* the Install sheet page for AA's truck, drawn into an overlay on screen for the picture only (the print route draws nothing on screen here) */
      await p.evaluate(iso => { const d = programmeDays().find(x => x.iso === iso), loads = dpLoads(d), g = loads.find(x => (x.rows || []).some(r => r.a.key === 'AA'));
        const o = document.createElement('div'); o.id = 'fire914sheet'; o.style.cssText = 'position:fixed;inset:0;z-index:99999;overflow:auto;background:#fff;color:#000;padding:12px'; o.innerHTML = dpPage(d, g, 'ins', 1, loads.length); document.body.appendChild(o);
        const e = [...o.querySelectorAll('*')].filter(x => /Fire extinguisher × 2/.test(x.textContent) && ![...x.children].some(c => /Fire extinguisher × 2/.test(c.textContent))).map(x => x.closest('tr') || x)[0]; if (e) e.setAttribute('data-fire914-sheet', '1'); }, sheets.day);
      const sh4 = await shotEl(p, 'install_sheet_AA_' + TAG + '.png', '[data-fire914-sheet]'); ok('screenshot: the Install sheet row for AA (tick box, "Fire extinguisher × 2"), no dollar figure in frame', sh4 && !sh4.missing && !sh4.dollars, sh4);
      await p.evaluate(() => { const o = document.getElementById('fire914sheet'); if (o) o.remove(); }); }
    // phase 2: GN01 (generator) and WC09 (toilet) arrive with 2 each - no card figure
    phase = 2;
    await p.waitForFunction(() => fire914Qty('GN01') === 2 && fire914Qty('WC09') === 2, null, {timeout: 40000}); await p.waitForTimeout(1500);
    const s2 = await p.evaluate(MONEY_SNAP);
    const d2 = await p.evaluate(DIFF, [s1, s2, await p.evaluate(() => window.__F)]);
    const money2 = d2.filter(x => x.xF !== undefined), counts2 = d2.filter(x => x.count !== undefined), types2 = d2.filter(x => x.from !== undefined);
    console.log('INFO phase 2 (GN01: 2, WC09: 2, no card figure) - every figure that changed:'); d2.forEach(x => console.log('INFO   ' + x.k + '  ' + (x.xF !== undefined ? x.xF + ' x F' : x.count !== undefined ? 'count ' + x.count : x.from + ' -> ' + x.to)));
    ok('no card figure: no money figure moves at all (never nought added, never a guess)', money2.length === 0, money2);
    const c2 = kk => (counts2.find(x => x.k === kk) || {}).count;
    ok('no card figure: the money reads unknown - Costs labour_unknown +2, P&L fire_ext unknown +2, labour plan unpriced +2', c2('M.charge.labour_unknown') === 2 && c2('TK.fire_ext.unknown') === 2 && c2('TK.unknown') === 2 && c2('LP.all.unpriced') === 2, counts2);
    const t2 = kk => types2.find(x => x.k === kk);
    const wcTot = await p.evaluate(() => assetTotal(assetOf('WC09')).total);
    ok("no card figure: GN01's total and both locations' labour turn unknown (number -> null); WC09's total stays unknown; what is known on them does not move", t2('AT.GN01.total') && t2('AT.GN01.total').to === 'null' && t2('AT.GN01.labour').to === 'null' && t2('AT.WC09.labour').to === 'null' && wcTot === null && !money2.some(x => /^AT\./.test(x.k)), types2);
    const fin = await p.evaluate(() => { const g = acc761Labour().groups.fire_ext; return {complete: g.complete, unpriced: g.unpriced}; });
    ok('no card figure: the Accruals labour group for fire extinguishers is marked incomplete', fin.complete === false && fin.unpriced >= 2, fin);
    await openContents(p, 'GN01');
    const gv = await blockState(p, 'GN01');
    ok('view link: GN01 shows "Fire extinguisher × 2" and "rate to confirm", no control', gv.words === 'Fire extinguisher × 2' && /rate to confirm/.test(gv.charge || '') && gv.controls === 0, gv);
    const sh5 = await shotEl(p, 'drawer_view_GN01_' + TAG + '.png', '#drawer [data-fire914]');
    ok('screenshot: GN01 on the view link (rate to confirm), no dollar figure in frame', sh5 && !sh5.missing && !sh5.dollars, sh5);
    await openContents(p, 'WC09');
    const wv = await blockState(p, 'WC09');
    ok('view link: WC09 (toilet, the card writes 0.00) shows "Fire extinguisher × 2" and "rate to confirm"', wv.words === 'Fire extinguisher × 2' && /rate to confirm/.test(wv.charge || '') && wv.controls === 0, wv);
    ok('session B: no page errors, no console errors, nothing written (0 blocked)', s.errors.length === 0 && cons.filter(t => !/status of 404|Failed to load resource/.test(t)).length === 0 && s.counts.blocked === 0, {errors: s.errors, cons: cons.slice(0, 4), counts: s.counts});
  } finally { await s.browser.close(); }
}

(async () => {
  if (!PAGE || !fs.existsSync(PAGE)) throw new Error('PAGE must name the build');
  fs.mkdirSync(EVID, {recursive: true});
  await sessionA(); await sessionB();
  const n = checks.filter(c => c.pass).length; console.log(`RESULT ${n}/${checks.length} ${TAG}`);
  process.exit(n === checks.length ? 0 : 1);
})().catch(e => { console.error('FAIL', e && e.stack || e); process.exit(2); });
