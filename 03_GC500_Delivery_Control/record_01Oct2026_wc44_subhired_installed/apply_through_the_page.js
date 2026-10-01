// Andrew Fisher, 1 Oct 2026: "WC44 toilets are sub-hired and in and installed. Asset no 0146 0037."
// Through the page's own functions on the edit link, in the name "Andrew Fisher via Claude":
//   subhireMark('WC44', 'Event Portables') · subhire744Many('WC44', 'Event Portables', '0146 0037') · setDone('WC44', true)
// Nothing else is touched. The edit key comes from GC500_EDIT_TOKEN and is never printed.
//   GC500_EDIT_TOKEN=... CHROMIUM_PATH=/opt/pw-browsers/chromium [DRY=1] node apply_through_the_page.js
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path'); const {curlFetch} = require('../toolchain/harness/curlfetch.js');
const HOST = 'https://gc500-production.up.railway.app', TOK = process.env.GC500_EDIT_TOKEN, WHO = 'Andrew Fisher via Claude';
const OUT = __dirname, DRY = process.env.DRY === '1';
const PLAN = {
 sub: [ /* sub-hired locations: Event Portables gear, the fleet numbers, complete */
  {key: 'WC44', co: 'Event Portables', nos: '0146 0037'}],
 wc60: null
};

/* the same three-plus-four calls the page's own buttons make, in the browser */
const ACTIONS = ([P]) => { const log = [], r2 = k => { const d = deliveryOf(k); return {done: d.done, levelled: d.levelled, steps: d.steps, state: d.state, note: d.note}; };
 /* the sub-hired locations: WC33, WC56, WC59 */
 P.sub.forEach(x => {
  log.push([x.key + ' subhireMark', subhireMark(x.key, x.co, false), subhireOf(x.key)]);
  const r = subhire744Many(x.key, x.co, x.nos); log.push([x.key + ' subhire744Many', r ? {added: r.added, refused: r.refused} : null]);
  log.push([x.key + ' setDone', setDone(x.key, true), r2(x.key)]); });
 /* WC60 (optional): the four Coates numbers the way the drawer's number box puts them on (clash check first), then the note and the ticks */
 if (!P.wc60) return {log, sub: P.sub.map(x => ({key: x.key, subhire: subhireOf(x.key), units: unitsOf(x.key).map(u => u.asset_no), delivery: r2(x.key)}))};
 const who = whoAmI(); if (!who) { log.push(['WC60 STOP', 'no name']); return {log}; }
 if (!mayWrite('an asset number')) { log.push(['WC60 STOP', 'view only']); return {log}; }
 P.wc60.numbers.forEach(n => { const a = assetOf(P.wc60.key); const own = numberOwners(n, P.wc60.key);
  if ((a.asset_numbers || []).includes(n)) { log.push(['WC60 number', n, 'already on']); return; }
  if (own.length) { log.push(['WC60 number', n, 'REFUSED - on ' + own.map(o => o.key).join(', ')]); return; }
  numberPutOn(P.wc60.key, n, who); const sp = spareClaim(n, INV_COATES, who); log.push(['WC60 number', n, 'put on', sp ? 'out of spares' : '']); });
 bump();
 setDeliveryNote(P.wc60.key, P.wc60.note); log.push(['WC60 note', deliveryOf(P.wc60.key).note]);
 log.push(['WC60 setLevelled', setLevelled(P.wc60.key, true), r2(P.wc60.key)]);
 log.push(['WC60 setSteps', setSteps(P.wc60.key, true), r2(P.wc60.key)]);
 return {log, sub: P.sub.map(x => ({key: x.key, subhire: subhireOf(x.key), units: unitsOf(x.key).map(u => u.asset_no), delivery: r2(x.key)})), wc60: {numbers: assetNumbersOf(assetOf(P.wc60.key)), delivery: r2(P.wc60.key)}}; };
(async () => { if (!TOK) throw new Error('GC500_EDIT_TOKEN is not set - nothing done');
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
 await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && typeof subhire744Many === 'function' && SYNC && SYNC.status === 'live' && SYNC.level === 'edit', null, {timeout: 420000}); await p.waitForTimeout(6000);
 const pre = await p.evaluate(P => ({cap: capability(), version: SYNC.version, waiting: syncWaiting(), sub: P.sub.map(x => ({key: x.key, subhire: subhireOf(x.key), units: unitsOf(x.key).length, delivery: deliveryOf(x.key)})), wc60: P.wc60 ? {numbers: (assetOf(P.wc60.key) || {}).asset_numbers, delivery: deliveryOf(P.wc60.key)} : null}), PLAN);
 console.log('before', JSON.stringify(pre)); if (pre.cap !== 'edit') { console.log('STOP: no edit capability'); await b.close(); return; }
 fs.writeFileSync(path.join(OUT, 'record_before.json'), JSON.stringify(Object.assign({at: new Date().toISOString()}, pre), null, 1));
 await p.evaluate(w => { const i = document.getElementById('who'); if (i) i.value = w; S.operator = w; }, WHO);
 const done = await p.evaluate(ACTIONS, [PLAN]);
 console.log('actions', JSON.stringify(done.log));
 fs.writeFileSync(path.join(OUT, 'actions_log.json'), JSON.stringify(Object.assign({at: new Date().toISOString(), by: WHO, dry: DRY}, done), null, 1));
 if (!DRY) await p.waitForFunction(() => syncWaiting() === 0, null, {timeout: 300000}).catch(() => console.log('WARN: still waiting'));
 const post = await p.evaluate(P => ({waiting: syncWaiting(), errors: SYNC.errors, status: SYNC.status, version: SYNC.version, sub: P.sub.map(x => ({key: x.key, subhire: subhireOf(x.key), units: unitsOf(x.key).length, done: deliveryOf(x.key).done, state: deliveryOf(x.key).state})), wc60: P.wc60 ? {numbers: assetNumbersOf(assetOf(P.wc60.key)), done: deliveryOf(P.wc60.key).done} : null}), PLAN);
 console.log('after', JSON.stringify(post)); console.log('writes', writes.length, 'non-200', writes.filter(w => w[2] !== 200).length, JSON.stringify(writes.filter(w => w[2] !== 200).slice(0, 5)));
 console.log('page errors', JSON.stringify(errs.slice(0, 4)));
 fs.writeFileSync(path.join(OUT, 'record_after.json'), JSON.stringify(Object.assign({at: new Date().toISOString(), writes: writes.length, non200: writes.filter(w => w[2] !== 200)}, post), null, 1));
 await b.close(); })().catch(e => { console.error('FAIL', String(e.message).split(process.env.GC500_EDIT_TOKEN || '\u0000').join('[token]')); process.exit(1); });
module.exports = {PLAN, ACTIONS};
