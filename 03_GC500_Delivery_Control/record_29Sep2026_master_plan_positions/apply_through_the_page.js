// Andrew Fisher, 29 Sep 2026, approved: "I want the master plan's pinned locations. Overwrite all mine." Through the page's own
// functions on the edit link: every pin comes off (clearMyLocation), and each reference that had one gets a placed position at
// the master plan D001 tag (placeHere). T0022 and T0023 have no tag on the master, so their pins stay.
const PW = '/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/node_modules/playwright';
const {chromium} = require(PW); const fs = require('fs'); const {curlFetch} = require('/tmp/claude-0/stage18/curlf18');
const HOST = 'https://gc500-production.up.railway.app', TOK = process.env.GC500_EDIT_TOKEN, WHO = 'Andrew Fisher via Claude';
const OUT = '/home/user/fish/03_GC500_Delivery_Control/record_29Sep2026_master_plan_positions';
(async () => { if (!TOK) throw new Error('no token'); fs.mkdirSync(OUT, {recursive: true});
 const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
 const ctx = await b.newContext({viewport: {width: 1440, height: 1000}, locale: 'en-AU', timezoneId: 'Australia/Brisbane'});
 const writes = [];
 await ctx.route('**/*', async route => { const r = route.request(), u = r.url();
  if (u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
  if (r.method() !== 'GET' && !u.startsWith(HOST)) return route.abort();
  if (r.method() === 'GET' && u.split('#')[0].replace(/\/$/, '') === HOST + '/e/' + TOK) return route.fulfill({status: 200, headers: {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'}, body: fs.readFileSync(process.env.PAGE)});
  try { const res = await curlFetch(u, r.headers(), r.method(), r.postData()); if (r.method() !== 'GET') writes.push([r.method(), u.replace(HOST, '').slice(0, 60), res.status]); return route.fulfill(res); } catch (e) { return route.abort('failed'); } });
 const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
 await p.goto(HOST + '/e/' + TOK, {waitUntil: 'commit', timeout: 420000});
 await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && typeof placeHere === 'function' && SYNC.status === 'live' && SYNC.level === 'edit', null, {timeout: 420000}); await p.waitForTimeout(6000);
 const pre = await p.evaluate(() => ({cap: capability(), fixes: Object.keys(S.fixes || {}).length, places: Object.keys(S.places || {}).length, waiting: syncWaiting()}));
 console.log('pre', JSON.stringify(pre)); if (pre.cap !== 'edit') { console.log('STOP: no edit capability'); await b.close(); return; }
 const backup = await p.evaluate(() => ({at: new Date().toISOString(), fixes: S.fixes || {}, places: S.places || {}, stamps: Object.fromEntries(Object.entries(S.stamps || {}).filter(([k]) => k.startsWith('fixes/') || k.startsWith('places/'))), by: Object.fromEntries(Object.entries(S.by || {}).filter(([k]) => k.startsWith('fixes/') || k.startsWith('places/')))}));
 fs.writeFileSync(OUT + '/pins_before.json', JSON.stringify(backup, null, 1)); console.log('backup written', Object.keys(backup.fixes).length, 'pins');
 await p.evaluate(w => { const i = document.getElementById('who'); if (i) i.value = w; S.operator = w; }, WHO);
 const done = await p.evaluate(() => { const log = []; const keep = k => /^T0022|^T0023/.test(k);
  const keys = Object.keys(S.fixes || {}); const refs = new Set();
  keys.forEach(k => { if (keep(k)) { log.push(['kept', k]); return; } const ref = fixParse(k).ref; refs.add(ref); clearMyLocation(k); log.push(['cleared', k, !(S.fixes || {})[k]]); });
  [...refs].sort().forEach(ref => { const m = MASTER_LOC[ref]; if (!(m && Array.isArray(m.ll) && m.prec === 'unit')) { log.push(['no unit tag on the master', ref, m && m.prec]); return; }
   const P = placeHere(ref, m.ll[0], m.ll[1], {how: 'the master plan D001 tag, put on in place of the pin as directed', source: 'master plan D001', note: 'Overwriting the stood-at pin with the master plan position - Andrew Fisher, 29 Sep 2026, approved.'});
   log.push(['placed', ref, !!P, m.ll]); });
  return {log, fixes: Object.keys(S.fixes || {}).length, places: Object.keys(S.places || {}).length}; });
 console.log('cleared', done.log.filter(x => x[0] === 'cleared').length, 'placed', done.log.filter(x => x[0] === 'placed' && x[2]).length, 'kept', done.log.filter(x => x[0] === 'kept').length, 'other', JSON.stringify(done.log.filter(x => !['cleared', 'placed', 'kept'].includes(x[0]))), 'now fixes', done.fixes, 'places', done.places);
 fs.writeFileSync(OUT + '/actions_log.json', JSON.stringify(done.log, null, 1));
 await p.waitForFunction(() => syncWaiting() === 0, null, {timeout: 300000}).catch(() => console.log('WARN: still waiting'));
 const post = await p.evaluate(() => ({waiting: syncWaiting(), errors: SYNC.errors, status: SYNC.status}));
 console.log('post', JSON.stringify(post)); console.log('writes', writes.length, 'non-200', writes.filter(w => w[2] !== 200).length, JSON.stringify(writes.filter(w => w[2] !== 200).slice(0, 5)));
 console.log('page errors', JSON.stringify(errs.slice(0, 4)));
 await b.close(); })().catch(e => { console.error('FAIL', String(e.message).replace(process.env.GC500_EDIT_TOKEN || 'x', '[token]')); process.exit(1); });
