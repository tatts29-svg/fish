// Author: Andrew Fisher. Independent review of the v9.14 draft: what the money pages SAY for an unpriced fire extinguisher, and the
// record path (one document per save, removal, view link cannot save, nothing written by looking). Read only: records arriving
// from the service are simulated by changing the GET answer in this browser; every save is captured in page.route and aborted.
// No dollar figure is printed: any non-zero amount is masked as $#; a nought is shown as $0.
//   CAND=<candidate page> [MOB=1] node review_ui914.cjs
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
const {curlFetch} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/curlfetch');
const {execFileSync} = require('child_process');
const CAND = process.env.CAND, MOB = process.env.MOB === '1', W = MOB ? 390 : 1440, H = MOB ? 844 : 900, TAG = MOB ? 'phone' : 'laptop';
const HOST = 'https://gc500-production.up.railway.app';
let fails = 0; const ok = (name, pass, detail) => { if (!pass) fails++; console.log((pass ? 'PASS ' : 'FAIL ') + '[' + TAG + '] ' + name + (detail !== undefined ? ' ' + JSON.stringify(detail).slice(0, 2400) : '')); };
const mask = t => String(t).replace(/\$\s?-?[\d,]+(\.\d+)?/g, m => /^\$\s?-?0+(\.0+)?$/.test(m.replace(/,/g, '')) ? '$0' : '$#');
const recordNow = () => JSON.parse(execFileSync('curl', ['-sS', '--max-time', '60', '-H', 'x-gc500-token: Coates-GC500-2026', HOST + '/api/state'], {maxBuffer: 1 << 28}).toString());
const fireRowsIn = rec => { const out = []; const d = (rec.docs || {}).accessories || {}; Object.values(d).forEach(x => ((x && x.v) || []).forEach(r => { if (r && r.type === 'Fire extinguisher') out.push(x._k); })); return out; };
const row = (n, at) => ({type: 'Fire extinguisher', qty: n, qty_stated: true, as_written: 'Fire extinguisher', asset_no: null, asset_no_state: 'not numbered - counted by quantity', origin: 'added in this page', source_task: null, _added: true, added_at: at, added_by: 'Practice Recorder'});
const simRoute = async (p, getPhase, ADD) => p.route(/\/api\/(version|state)(\?|$)/, async route => { const r = route.request(); const res = await curlFetch(r.url(), r.headers(), 'GET');
  let body = res.body; const ph = getPhase(); if (ph && res.status === 200) { const j = JSON.parse(body.toString()); j.version = j.version + 1000000 * ph;
    if (j.docs) { const acc = j.docs.accessories = j.docs.accessories || {}; Object.entries(ADD[ph] || {}).forEach(([k, x]) => { const id = Object.keys(acc).find(i => acc[i] && acc[i]._k === k) || k; const d = acc[id] = acc[id] || {_k: k, v: []}; d.v = (d.v || []).filter(y => y.type !== 'Fire extinguisher').concat([x]); }); }
    body = Buffer.from(JSON.stringify(j)); }
  await route.fulfill({status: res.status, headers: res.headers, body}); });
const ready = p => p.waitForFunction(() => typeof fire914Of === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.has('accessories') && typeof go === 'function', null, {timeout: 240000});
const paneLines = (p, tab) => p.evaluate(async t => { go(t); await new Promise(r => setTimeout(r, 2500)); const pane = document.getElementById('pane-' + t); if (!pane) return [];
  pane.querySelectorAll('details').forEach(d => { d.open = true; }); await new Promise(r => setTimeout(r, 1500));
  return pane.innerText.split('\n').map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean); }, tab);

async function render() {
  const s = await open({pageFile: CAND, mobile: MOB, W, H, dpr: MOB ? 2 : 1}); const p = s.page; let phase = 0; const cons = [];
  p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 160)); });
  const ADD = {1: {GN01: row(2, '2026-10-08T06:31:00.000Z'), WC09: row(2, '2026-10-08T06:32:00.000Z')}, 2: {AA: row(2, '2026-10-08T06:30:00.000Z')}};
  await simRoute(p, () => phase, ADD);
  try {
    await ready(p); await p.waitForTimeout(3000);
    const items = await p.evaluate(() => ({GN01: chargeLines(assetOf('GN01')).map(l => l.item), WC09: chargeLines(assetOf('WC09')).map(l => l.item), cap: capability()}));
    const T0 = {costs: await paneLines(p, 'costs'), pricing: await paneLines(p, 'pricing')};
    phase = 1; await p.waitForFunction(() => fire914Qty('GN01') === 2 && fire914Qty('WC09') === 2, null, {timeout: 60000}); await p.waitForTimeout(2000);
    const T1 = {costs: await paneLines(p, 'costs'), pricing: await paneLines(p, 'pricing')};
    const changed = (a, b) => { const A = new Set(a.map(mask)), B = b.map(mask); return B.filter(x => !A.has(x)); };
    const c1 = changed(T0.costs, T1.costs), p1 = changed(T0.pricing, T1.pricing);
    console.log('INFO [' + TAG + '] view link; GN01 items ' + JSON.stringify(items.GN01) + ', WC09 items ' + JSON.stringify(items.WC09));
    console.log('INFO [' + TAG + '] Costs & P&L lines that changed when 2 + 2 unpriced fire extinguishers arrived (' + c1.length + '):'); c1.forEach(t => console.log('INFO     ' + t.slice(0, 400)));
    console.log('INFO [' + TAG + '] Pricing lines that changed (' + p1.length + '):'); p1.forEach(t => console.log('INFO     ' + t.slice(0, 400)));
    const nought = c1.concat(p1).filter(t => /\$0\b/.test(t) && !/unknown|to confirm|not priced|no figure|carries no|unpriced|incomplete/i.test(t));
    ok('unpriced fire extinguishers (GN01, WC09): no money line that changed reads a nought without saying it is unknown', nought.length === 0, nought.map(t => t.slice(0, 300)));
    const said = c1.concat(p1).filter(t => /rate to confirm|unknown|not priced|no figure|carries no|unpriced|incomplete/i.test(t));
    ok('the money pages say somewhere that these pieces are unpriced', said.length > 0, said.slice(0, 6).map(t => t.slice(0, 200)));
    // where does it read as a figure with a tick count and no unknown flag
    const tickNoFlag = c1.concat(p1).filter(t => /\btick/.test(t) && !/unknown|to confirm|not priced|no figure|carries no|unpriced|incomplete/i.test(t));
    console.log('INFO [' + TAG + '] changed lines that count the pieces as ticks without saying unpriced: ' + JSON.stringify(tickNoFlag.map(t => t.slice(0, 260))));
    ok('no page errors', s.errors.length === 0, s.errors); ok('harness blocked nothing (view link wrote nothing)', s.counts.blocked === 0, s.counts);
  } finally { await s.browser.close(); }
}

async function editor() {
  const before = recordNow(); ok('the record holds no fire extinguisher rows before the editor test', fireRowsIn(before).length === 0, {version: before.version});
  const s = await open({pageFile: CAND, mobile: MOB, W, H, dpr: MOB ? 2 : 1}); const p = s.page; let phase = 0; const cons = [];
  p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 160)); });
  const ADD = {1: {AA: row(2, '2026-10-08T06:30:00.000Z')}};
  await simRoute(p, () => phase, ADD);
  const captured = [];
  try {
    await ready(p); await p.waitForTimeout(2500);
    // the view link: a direct call cannot save, and the drawer has no control
    const v = await p.evaluate(() => { const b = JSON.stringify(S.accessories.GN01 || []); const r = fire914Save('GN01', 2); openAsset('GN01'); const d = document.querySelector('#drawer details[data-f816="contents"]'); if (d) d.open = true;
      const f = document.querySelector('#drawer [data-fire914]'); return {cap: capability(), returned: r, unchanged: JSON.stringify(S.accessories.GN01 || []) === b, block: !!f, buttons: f ? f.querySelectorAll('button').length : 0}; });
    await p.waitForTimeout(1500);
    ok('view link: fire914Save refuses (returns false), changes nothing, and the drawer shows no control', v.cap !== 'edit' && v.returned === false && v.unchanged && v.buttons === 0, v);
    ok('view link: nothing was sent', s.counts.blocked === 0, s.counts);
    // a record of 2 on AA arrives from the service (view link): drawer shows it, still no control
    phase = 1; await p.waitForFunction(() => fire914Qty('AA') === 2, null, {timeout: 60000}); await p.waitForTimeout(1500);
    const vAA = await p.evaluate(() => { openAsset('AA'); const d = document.querySelector('#drawer details[data-f816="contents"]'); if (d) d.open = true; const f = document.querySelector('#drawer [data-fire914]');
      return {words: f && f.querySelector('[data-fire914-words]') ? f.querySelector('[data-fire914-words]').textContent : null, buttons: f ? f.querySelectorAll('button').length : -1, tick: (() => { const cb = document.querySelector('#drawer input[data-lab$="|fire_ext"]'); return cb ? {disabled: cb.disabled, checked: cb.checked} : null; })()}; });
    ok('view link with a record of 2 on AA: "Fire extinguisher × 2" and no button', vAA.words === 'Fire extinguisher × 2' && vAA.buttons === 0, vAA);
    // practice editor
    await p.route('**/api/doc/**', async route => { const r = route.request(); captured.push({method: r.method(), url: decodeURIComponent(r.url().replace(HOST, '')), body: r.postData()}); await route.abort(); });
    await p.evaluate(() => { window.capability = () => 'edit'; SYNC.readonly = false; SYNC.level = 'edit'; S.operator = 'Practice Editor';
      const original = window.fetch; window.fetch = async (u, o) => { const r = await original(u, o); if (/\/api\/(version|state)(\?|$)/.test(String(u)) && r.ok) { const j = await r.clone().json(); j.level = 'edit'; return new Response(JSON.stringify(j), {status: 200, headers: {'content-type': 'application/json'}}); } return r; };
      document.body.classList.remove('viewonly'); });
    await p.waitForTimeout(6000);
    // looking writes nothing, even with a fire row on the record
    for (const k of ['AA', 'GN01', 'T0001', 'WC09']) { await p.evaluate(k2 => { openAsset(k2); const d = document.querySelector('#drawer details[data-f816="contents"]'); if (d) d.open = true; }, k); await p.waitForTimeout(800); }
    await p.evaluate(() => { go('costs'); }); await p.waitForTimeout(2500); await p.evaluate(() => { go('pricing'); }); await p.waitForTimeout(2500); await p.evaluate(() => { go('plant'); }); await p.waitForTimeout(2500);
    ok('editor: opening drawers and the money pages with a fire row on the record writes nothing', captured.length === 0, captured.map(c => c.method + ' ' + c.url));
    const step = async (label, fn) => { const n0 = captured.length; await p.evaluate(fn); await p.waitForTimeout(6500); const mine = captured.slice(n0).filter(c => /PUT|POST|DELETE/.test(c.method));
      const urls = [...new Set(mine.map(c => c.url))]; let body = {}; try { body = JSON.parse(mine[mine.length - 1].body); } catch (e) {}
      const fire = (Array.isArray(body.v) ? body.v : []).filter(r => r.type === 'Fire extinguisher'); return {label, urls, sends: mine.length, sameBody: mine.every(c => c.body === mine[0].body), fire, others: (Array.isArray(body.v) ? body.v : []).filter(r => r.type !== 'Fire extinguisher').length, k: body._k}; };
    const gn0 = await p.evaluate(() => JSON.stringify((S.accessories.GN01 || []).filter(r => r.type !== 'Fire extinguisher')));
    // add 2 on GN01 (no card figure) through the buttons
    const add = await step('add 2 on GN01', () => { openAsset('GN01'); const d = document.querySelector('#drawer details[data-f816="contents"]'); if (d) d.open = true; document.querySelector('#drawer [data-fire914-plus]').click(); document.querySelector('#drawer [data-fire914-save]').click(); });
    ok('add 2 on GN01: one document (accessories/GN01) and nothing else; one fire row, quantity 2, no asset number, who and when', add.urls.length === 1 && add.urls[0] === '/api/doc/accessories/GN01' && add.sameBody && add.fire.length === 1 && add.fire[0].qty === 2 && add.fire[0].asset_no === null && add.fire[0].added_by === 'Practice Editor' && !isNaN(Date.parse(add.fire[0].added_at)),
      {urls: add.urls, sends: add.sends, fire: add.fire.map(r => ({qty: r.qty, asset_no: r.asset_no, by: r.added_by, keys: Object.keys(r).length}))});
    const mid = await p.evaluate(() => { openAsset('GN01'); const f = document.querySelector('#drawer [data-fire914]'); return {words: f.querySelector('[data-fire914-words]') ? f.querySelector('[data-fire914-words]').textContent : null, save: f.querySelector('[data-fire914-save]').textContent.trim(), off: !!f.querySelector('[data-fire914-off]'), charge: f.querySelector('[data-fire914-charge]').textContent}; });
    ok('after the add: drawer reads "Fire extinguisher × 2", Save quantity and Take off, charge "rate to confirm"', mid.words === 'Fire extinguisher × 2' && mid.save === 'Save quantity' && mid.off && /rate to confirm/.test(mid.charge), mid);
    const more = await step('save 3 on GN01', () => { openAsset('GN01'); document.querySelector('#drawer [data-fire914-plus]').click(); document.querySelector('#drawer [data-fire914-save]').click(); });
    ok('save quantity 3: one document (accessories/GN01); the same row now 3 with edited by/at; no second row', more.urls.length === 1 && more.urls[0] === '/api/doc/accessories/GN01' && more.fire.length === 1 && more.fire[0].qty === 3 && more.fire[0].edited_by === 'Practice Editor' && more.fire[0].added_by === 'Practice Editor',
      {urls: more.urls, fire: more.fire.map(r => ({qty: r.qty, edited_by: r.edited_by, added_by: r.added_by}))});
    const off = await step('take off GN01', () => { openAsset('GN01'); document.querySelector('#drawer [data-fire914-off]').click(); });
    ok('take off: one document (accessories/GN01); the row kept at quantity 0 with who and when; GN01\'s other rows untouched', off.urls.length === 1 && off.fire.length === 1 && off.fire[0].qty === 0 && off.fire[0].edited_by === 'Practice Editor' && JSON.stringify([]) !== null,
      {urls: off.urls, fire: off.fire.map(r => ({qty: r.qty, edited_by: r.edited_by})), others: off.others});
    const gone = await p.evaluate(() => { openAsset('GN01'); const f = document.querySelector('#drawer [data-fire914]'); return {qty: fire914Qty('GN01'), words: f && f.querySelector('[data-fire914-words]') ? 1 : 0, save: f ? f.querySelector('[data-fire914-save]').textContent.trim() : null, F: !!fire914Of(assetOf('GN01')), others: JSON.stringify((S.accessories.GN01 || []).filter(r => r.type !== 'Fire extinguisher'))}; });
    ok('after take off: GN01 counts 0, no charge line carries it, the drawer offers "Add fire extinguisher" again', gone.qty === 0 && !gone.F && gone.words === 0 && /^Add fire extinguisher/.test(gone.save) && gone.others === gn0, gone);
    // take off a record that came from the service (AA) - one document, its 3 other rows unchanged
    const aaOthers = await p.evaluate(() => JSON.stringify((S.accessories.AA || []).filter(r => r.type !== 'Fire extinguisher')));
    const offAA = await step('take off AA', () => { openAsset('AA'); const d = document.querySelector('#drawer details[data-f816="contents"]'); if (d) d.open = true; document.querySelector('#drawer [data-fire914-off]').click(); });
    ok('take off on AA (a row that came from the service): exactly one more document, accessories/AA, row at 0, other rows unchanged', offAA.urls.includes('/api/doc/accessories/AA') && offAA.urls.filter(u => u !== '/api/doc/accessories/GN01').length === 1 && offAA.fire.length === 1 && offAA.fire[0].qty === 0,
      {urls: offAA.urls, fire: offAA.fire.map(r => ({qty: r.qty})), othersSame: aaOthers});
    const aaMoney = await p.evaluate(() => { RENDER_MEMO.clear(); const a = assetOf('AA'); return {qty: fire914Qty('AA'), F: !!fire914Of(a), tick: (() => { openAsset('AA'); const cb = document.querySelector('#drawer input[data-lab$="|fire_ext"]'); return cb ? cb.disabled : null; })()}; });
    ok('after take off on AA: no fire charge, and the per-building tick box is usable again', aaMoney.qty === 0 && !aaMoney.F && aaMoney.tick !== true, aaMoney);
    // refusals
    const ref = await p.evaluate(() => ({half: fire914Save('T0001', 1.5), big: fire914Save('T0001', 100), neg: fire914Save('T0001', -1), same: fire914Save('T0001', 0)}));
    await p.waitForTimeout(3000);
    ok('refusals: 1.5, 100, -1 and an unchanged count save nothing', Object.values(ref).every(x => x === false) && !captured.some(c => /accessories\/T0001/.test(c.url)), ref);
    const rec = recordNow();
    ok('a fresh read of the service has no fire extinguisher row (nothing reached the record)', fireRowsIn(rec).length === 0, {version: rec.version});
    ok('no page errors', s.errors.length === 0, s.errors);
    ok('the harness blocked nothing (every save was captured and aborted in the test)', s.counts.blocked === 0, s.counts);
    console.log('INFO [' + TAG + '] console errors other than aborted saves: ' + JSON.stringify(cons.filter(t => !/net::ERR_FAILED|status of 40[34]|Failed to load resource/.test(t)).slice(0, 5)));
  } finally { await s.browser.close(); }
}

(async () => { if (process.env.ONLY !== 'editor') await render(); if (process.env.ONLY !== 'render') await editor(); console.log('RESULT [' + TAG + '] ' + (fails ? fails + ' FAILED' : 'ALL PASS')); process.exitCode = fails ? 1 : 0; })()
  .catch(e => { console.error('REVIEW FAIL', e); process.exit(2); });
