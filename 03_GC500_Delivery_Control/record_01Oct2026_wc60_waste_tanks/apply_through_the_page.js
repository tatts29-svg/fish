// Record change, 1 Oct 2026 - WC60's two waste tanks: install and levelling ticked, each tank named as a piece.
// Andrew Fisher, 1 Oct 2026 15:30 AEST: "WC60 has 2 waste tanks, I told you this. This needs to have a level cost and
// install cost."
//
// RUN ONLY ON OR AFTER v7.68 (the Waste tank line on WC60 comes from the contract in v7.68; on v7.67 the page carries no
// line to tick, and the script stops). Through the page's own functions on the edit link, in the name "Andrew Fisher via
// Claude":
//   1. setSupplied('WC60', 'Waste tank', {supplied: 'Waste tank', qty_supplied: 2, nums: ['1328980', '1328981']})
//      setSupplied('WC60', 'Toilet Block 6m', {supplied: 'Toilet Block 6m', qty_supplied: 2, nums: ['1119489', '1087500']})
//      - which numbers are the tanks and which the toilet blocks, chosen by a person (Andrew's words: 1119489 with
//        1328980, 1087500 with 1328981), so the labour pieces never depend on the order the numbers sit in.
//   2. setLabour('WC60', 'Toilets & amenities', 'Waste tank', 'install', true, <tank>) and the same for 'levelling', for
//      each tank: $145.74 install + $104.10 levelling per tank at the card = $499.68 Labour Install, charged to the V8s.
// Nothing else is touched. The edit key comes from GC500_EDIT_TOKEN and is never printed. DRY=1 rehearses on the edit
// link with every write blocked.
//   GC500_EDIT_TOKEN=... CHROMIUM_PATH=/opt/pw-browsers/chromium [DRY=1] node apply_through_the_page.js
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path'); const {curlFetch} = require('../toolchain/harness/curlfetch.js');
const HOST = 'https://gc500-production.up.railway.app', TOK = process.env.GC500_EDIT_TOKEN, WHO = 'Andrew Fisher via Claude';
const OUT = __dirname, DRY = process.env.DRY === '1';
if (!TOK) { console.error('GC500_EDIT_TOKEN is not set'); process.exit(2); }
const PLAN = {key: 'WC60', tanks: ['1328980', '1328981'], blocks: ['1119489', '1087500'], disc: 'Toilets & amenities', item: 'Waste tank', ticks: ['install', 'levelling']};
const ACTIONS = ([P]) => { const log = []; const who = whoAmI(); if (!who) { log.push(['STOP', 'no name']); return {log}; }
 if (!mayWrite('a labour tick')) { log.push(['STOP', 'view only']); return {log}; }
 const a0 = assetOf(P.key); if (!chargeLines(a0).some(l => l.item === P.item)) { log.push(['STOP', 'WC60 carries no Waste tank line - this page is older than v7.68']); return {log}; }
 /* 1. which numbers are which, in Andrew's words */
 log.push(['supplied tanks', setSupplied(P.key, P.item, {supplied: P.item, qty_supplied: P.tanks.length, nums: P.tanks.slice()})]);
 log.push(['supplied blocks', setSupplied(P.key, 'Toilet Block 6m', {supplied: 'Toilet Block 6m', qty_supplied: P.blocks.length, nums: P.blocks.slice()})]);
 /* 2. the ticks, one per tank */
 P.tanks.forEach(u => P.ticks.forEach(k => log.push(['tick', u, k, setLabour(P.key, P.disc, P.item, k, true, u)])));
 if (typeof RENDER_MEMO !== 'undefined' && RENDER_MEMO.clear) RENDER_MEMO.clear();
 const a = assetOf(P.key); const T = assetTotal(a); const tank = T.lines.find(l => l.item === P.item);
 return {log, units: {tank: labourUnits(a, P.item), block: labourUnits(a, 'Toilet Block 6m')}, lineNumbers: lineNumbersOf(a),
 tank: tank && {qty: tank.qty, labour: tank.labour.total, ticks: tank.labour.ticked.length}, blocks: (T.lines.find(l => l.item === 'Toilet Block 6m') || {labour: {}}).labour.total,
 keys: Object.keys(S.labour || {}).filter(k => k.startsWith(P.key) && k.includes(P.item)), labour: moneySummary().charge.labour}; };
(async () => {
 const launch = {args: ['--no-sandbox', '--lang=en-AU']}; if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
 const b = await chromium.launch(launch);
 const ctx = await b.newContext({viewport: {width: 1440, height: 1000}, locale: 'en-AU', timezoneId: 'Australia/Brisbane'});
 const writes = [];
 await ctx.route('**/*', async route => { const r = route.request(), u = r.url();
  if (u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
  if (r.method() !== 'GET' && (!u.startsWith(HOST) || DRY)) { writes.push([r.method(), u.replace(HOST, '').slice(0, 60), DRY ? 'dry' : 'off-host']); return route.abort(); }
  try { const res = await curlFetch(u, r.headers(), r.method(), r.postData()); if (r.method() !== 'GET') writes.push([r.method(), u.replace(HOST, '').slice(0, 60), res.status]); return route.fulfill(res); } catch (e) { return route.abort('failed'); } });
 const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
 await p.goto(HOST + '/e/' + TOK, {waitUntil: 'commit', timeout: 420000});
 await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && typeof tank768LinesFor === 'function' && SYNC && SYNC.status === 'live' && SYNC.level === 'edit', null, {timeout: 420000}); await p.waitForTimeout(6000);
 const pre = await p.evaluate(P => { const a = assetOf(P.key); const T = assetTotal(a); return {cap: capability(), version: SYNC.version, waiting: syncWaiting(), lines: chargeLines(a).map(l => l.item + ' x' + l.quantity), units: {tank: labourUnits(a, P.item), block: labourUnits(a, 'Toilet Block 6m')}, tank: (T.lines.find(l => l.item === P.item) || {labour: {}}).labour.total, blocks: (T.lines.find(l => l.item === 'Toilet Block 6m') || {labour: {}}).labour.total, labour: moneySummary().charge.labour}; }, PLAN);
 console.log('before', JSON.stringify(pre)); if (pre.cap !== 'edit') { console.log('STOP: no edit capability'); await b.close(); return; }
 fs.writeFileSync(path.join(OUT, 'record_before.json'), JSON.stringify(Object.assign({at: new Date().toISOString()}, pre), null, 1));
 await p.evaluate(w => { const i = document.getElementById('who'); if (i) i.value = w; S.operator = w; }, WHO);
 const done = await p.evaluate(ACTIONS, [PLAN]);
 console.log('actions', JSON.stringify(done.log));
 fs.writeFileSync(path.join(OUT, 'actions_log.json'), JSON.stringify(Object.assign({at: new Date().toISOString(), by: WHO, dry: DRY}, done), null, 1));
 if (!DRY) await p.waitForFunction(() => syncWaiting() === 0, null, {timeout: 300000}).catch(() => console.log('WARN: still waiting'));
 const post = await p.evaluate(P => { const a = assetOf(P.key); const T = assetTotal(a); return {waiting: syncWaiting(), errors: SYNC.errors, status: SYNC.status, version: SYNC.version, tank: (T.lines.find(l => l.item === P.item) || {labour: {}}).labour.total, blocks: (T.lines.find(l => l.item === 'Toilet Block 6m') || {labour: {}}).labour.total, labour: moneySummary().charge.labour}; }, PLAN);
 console.log('after', JSON.stringify(post)); console.log('writes', writes.length, 'non-200', writes.filter(w => w[2] !== 200).length, JSON.stringify(writes.filter(w => w[2] !== 200).slice(0, 5)));
 console.log('page errors', JSON.stringify(errs.slice(0, 4)));
 fs.writeFileSync(path.join(OUT, 'record_after.json'), JSON.stringify(Object.assign({at: new Date().toISOString(), writes: writes.length, non200: writes.filter(w => w[2] !== 200)}, post), null, 1));
 await b.close(); })().catch(e => { console.error('FAIL', String(e.message).split(process.env.GC500_EDIT_TOKEN || '\u0000').join('[token]')); process.exit(1); });
module.exports = {PLAN, ACTIONS};
