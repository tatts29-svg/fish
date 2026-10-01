// Andrew Fisher, 1 Oct 2026: "Sub-hired WC33 toilets are here and installed, add for me. Tick complete. Assets 0634 0582 0548
// 0782 0657 0912 0554 0920 0971 0586 0487 0790 0297 0456 0012 0938 0597."
// Through the page's own functions on the edit link, in the name "Andrew Fisher via Claude":
//   subhireMark('WC33', 'Event Portables')          - the location is Event Portables gear
//   subhire744Many('WC33', 'Event Portables', nos)   - the 17 fleet numbers as Event Portables units on WC33
//   setDone('WC33', true)                            - the complete tick (it also sets the light green, on site)
// Nothing else is touched. The edit key comes from GC500_EDIT_TOKEN and is never printed.
//   GC500_EDIT_TOKEN=... CHROMIUM_PATH=/opt/pw-browsers/chromium node apply_through_the_page.js
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path'); const {curlFetch} = require('../toolchain/harness/curlfetch.js');
const HOST = 'https://gc500-production.up.railway.app', TOK = process.env.GC500_EDIT_TOKEN, WHO = 'Andrew Fisher via Claude';
const KEY = 'WC33', CO = 'Event Portables', NOS = '0634 0582 0548 0782 0657 0912 0554 0920 0971 0586 0487 0790 0297 0456 0012 0938 0597';
const OUT = __dirname, DRY = process.env.DRY === '1';
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
 const pre = await p.evaluate(k => ({cap: capability(), subhire: subhireOf(k), units: unitsOf(k).length, delivery: deliveryOf(k), asset_numbers: (assetOf(k) || {}).asset_numbers, waiting: syncWaiting(), version: SYNC.version}), KEY);
 console.log('before', JSON.stringify(pre)); if (pre.cap !== 'edit') { console.log('STOP: no edit capability'); await b.close(); return; }
 fs.writeFileSync(path.join(OUT, 'wc33_before.json'), JSON.stringify(Object.assign({at: new Date().toISOString()}, pre), null, 1));
 await p.evaluate(w => { const i = document.getElementById('who'); if (i) i.value = w; S.operator = w; }, WHO);
 const done = await p.evaluate(([k, co, nos]) => { const log = [];
  log.push(['subhireMark', subhireMark(k, co, false), subhireOf(k)]);
  const r = subhire744Many(k, co, nos); log.push(['subhire744Many', r ? {added: r.added, refused: r.refused} : null]);
  log.push(['setDone', setDone(k, true), deliveryOf(k).done, deliveryOf(k).state]);
  return {log, units: unitsOf(k).map(u => ({label: u.label, no: u.asset_no})), delivery: deliveryOf(k)}; }, [KEY, CO, NOS]);
 console.log('actions', JSON.stringify(done.log)); console.log('units now', done.units.length, done.units.map(u => u.no).join(' '));
 fs.writeFileSync(path.join(OUT, 'actions_log.json'), JSON.stringify(Object.assign({at: new Date().toISOString(), by: WHO, dry: DRY}, done), null, 1));
 if (!DRY) await p.waitForFunction(() => syncWaiting() === 0, null, {timeout: 300000}).catch(() => console.log('WARN: still waiting'));
 const post = await p.evaluate(k => ({waiting: syncWaiting(), errors: SYNC.errors, status: SYNC.status, version: SYNC.version, subhire: subhireOf(k), units: unitsOf(k).length, done: deliveryOf(k).done, state: deliveryOf(k).state}), KEY);
 console.log('after', JSON.stringify(post)); console.log('writes', writes.length, 'non-200', writes.filter(w => w[2] !== 200).length, JSON.stringify(writes.filter(w => w[2] !== 200).slice(0, 5)));
 console.log('page errors', JSON.stringify(errs.slice(0, 4)));
 fs.writeFileSync(path.join(OUT, 'wc33_after.json'), JSON.stringify(Object.assign({at: new Date().toISOString(), writes: writes.length, non200: writes.filter(w => w[2] !== 200)}, post), null, 1));
 await b.close(); })().catch(e => { console.error('FAIL', String(e.message).split(process.env.GC500_EDIT_TOKEN || '\u0000').join('[token]')); process.exit(1); });
