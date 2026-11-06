// v7.42 practice tests: the pit lane is the way in. Page from the kit file, live GETs read-only, writes captured in the page.
const {open} = require('/tmp/claude-0/stage18/lh18au');
const R = {}; const ok = (n, c, note) => { R[n] = !!c; console.log((c ? 'PASS ' : 'FAIL ') + n + (note ? ' - ' + note : '')); };
(async () => {
 const s = await open({pageFile: process.env.PAGE, hash: '', W: 1300, H: 950, dpr: 1, gl: false}); const p = s.page;
 await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && typeof pitLaneWayIn === 'function', null, {timeout: 240000}); await p.waitForTimeout(2000);
 const r0 = await p.evaluate(() => { const refs = allAssets().map(a => a.key); const park = refs.filter(refInPark); const P17 = entryOf('P17'), P33 = entryOf('P33'), WC27 = entryOf('WC27'), AA = entryOf('AA');
  return {refs: refs.length, park: park.length, parkList: park.sort().join(' '), P17: P17 && {lat: P17.lat, lon: P17.lon, gate: P17.gate, end: P17.end, acc: P17.acc, ax: P17.ax != null}, P33: P33 && {gate: P33.gate || null, by: P33.by, acc: P33.acc}, WC27: WC27 && WC27.gate, AAdist: entryToDrop('AA'), words: pitLaneWords(), entriesOnRecord: Object.keys(S.entries || {}).length, gates: S.gates}; });
 console.log(JSON.stringify(r0));
 ok('49 references in the park; P17 gets the pit lane entry (NW end), P33 keeps its pin, WC27 none', r0.park === 49 && r0.P17 && r0.P17.gate === 'pitlane' && r0.P17.end === 'north' && Math.abs(r0.P17.lat + 27.983284) < 1e-6 && r0.P17.acc === null && r0.P17.ax && r0.P33 && !r0.P33.gate && r0.P33.acc === 4.9 && !r0.WC27);
 ok('distance from the lane entry to AA is worked out', r0.AAdist && r0.AAdist.m > 300 && r0.AAdist.m < 900, JSON.stringify(r0.AAdist));
 // the drawer's Way in row for a park reference, and for one outside
 await p.evaluate(() => openAsset('P17')); await p.waitForSelector('#drawer.on .pinrow.pitlane', {timeout: 30000, state: 'attached'});
 const r1 = await p.evaluate(() => { const row = document.querySelector('#drawer .pinrow.pitlane'); const links = [...row.querySelectorAll('a')].map(a => [a.textContent.trim(), a.href.includes('-27.983284') && a.href.includes('153.424946')]);
  return {text: row.textContent.replace(/\s+/g, ' ').slice(0, 400), links, pin: !!row.querySelector('[data-pinentry="P17"]'), switchBtn: !!row.querySelector('[data-pitlaneend]') /* view link: none */}; });
 console.log(JSON.stringify(r1)); ok('drawer: pit lane row with the words, Drive link to the lane entry, Pin a different way in', /north-west end/.test(r1.text) && /race cars/.test(r1.text) && r1.links.every(l => l[1]) && r1.pin && !r1.switchBtn);
 await p.evaluate(() => openAsset('WC27')); await p.waitForTimeout(800);
 const r2 = await p.evaluate(() => ({pit: !!document.querySelector('#drawer .pinrow.pitlane'), plain: !!document.querySelector('#drawer [data-pinentry="WC27"]')}));
 ok('drawer: a reference outside the park keeps the plain Way in row', !r2.pit && r2.plain);
 // the driver sheet for a park reference carries the pit lane way in
 const r3 = await p.evaluate(async () => { const a = assetOf('P17'); const fns = ['dropSheetHtml', 'driverSheetHtml', 'sheetHtmlFor', 'dropSheet']; let html = ''; try { const pics = await dropPics(a); html = dropEmailHtml(a, pics); } catch (e) { html = 'ERR ' + e.message; } return {len: html.length, hit: /Way in — the pit lane/.test(html), words: /race cars go/.test(html), err: html.startsWith('ERR') ? html : ''}; });
 console.log('sheet', JSON.stringify(r3)); ok('driver sheet: Way in — the pit lane, with the race-cars words', r3.hit && r3.words && !r3.err);
 // the practice edit: switch the end, then back; a pin wins; clearing brings the rule back
 await p.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => true; window.whoAmI = () => 'Andrew Fisher'; SYNC.readonly = false; SYNC.level = 'edit'; S.operator = 'Andrew Fisher'; window.__W = [];
  SYNC.db.doc = path => ({id: path.split('/')[1], path, set: async body => { window.__W.push([path, JSON.parse(JSON.stringify(body))]); }, delete: async () => { window.__W.push([path, null]); }});
  const of = window.fetch; window.fetch = async (u, o) => { const r = await of(u, o); if (/\/api\/(version|state)(\?|$)/.test(String(u)) && r.ok) { const j = await r.clone().json(); j.level = 'edit'; return new Response(JSON.stringify(j), {status: 200, headers: {'content-type': 'application/json'}}); } return r; }; });
 await p.waitForTimeout(4800); await p.evaluate(() => { SYNC.readonly = false; SYNC.level = 'edit'; document.body.classList.remove('viewonly'); });
 const r4 = await p.evaluate(async () => { const g = pitLaneRuleSet({end: 'south'}); await new Promise(r => setTimeout(r, 500)); const e = entryOf('P17'); const w = window.__W.map(x => x[0]);
  const back = pitLaneRuleSet({end: 'north'}); await new Promise(r => setTimeout(r, 500)); const e2 = entryOf('P17');
  return {gEnd: g && g.end, by: g && g.by, e: e && [e.end, e.lat.toFixed(6), e.drive], w, e2: e2 && e2.end}; });
 console.log(JSON.stringify(r4)); ok('switch the end: the rule document is written, every park reference follows, and back', r4.gEnd === 'south' && r4.e && r4.e[0] === 'south' && r4.e[1] === '-27.986575' && r4.e[2] === 'north-west' && r4.w.includes('gates/pitlane') && r4.e2 === 'north');
 const r5 = await p.evaluate(() => { S.entries = S.entries || {}; S.entries.P17 = {lat: -27.985, lon: 153.4265, acc: 5, at: new Date().toISOString(), by: 'Andrew Fisher', ref: 'P17', n: 2, took: 'best of 2 readings'}; const e = entryOf('P17'); clearEntry('P17'); const e2 = entryOf('P17'); return {pinWins: e && !e.gate && e.acc === 5, ruleBack: e2 && e2.gate === 'pitlane'}; });
 ok('a pin wins over the rule; taking the pin off brings the rule back', r5.pinWins && r5.ruleBack);
 const r6 = await p.evaluate(() => { const feat = (lon, lat, props) => ({lon, lat, props}); const f = pitLaneWayFeatures(feat); return {n: f.length, ref: f[0] && f[0].props.ref, lat: f[0] && f[0].lat.toFixed(6), away: f[0] && f[0].props.away}; });
 console.log('board', JSON.stringify(r6)); ok('the map gets one Pit lane entry mark at the lane entry (the board layer itself is off since v5.75)', r6.n === 1 && r6.ref === 'Pit lane entry' && r6.lat === '-27.983284');
 const summary = Object.entries(R); console.log('RESULT', summary.filter(x => x[1]).length + '/' + summary.length, 'errors', JSON.stringify(s.errors.slice(0, 5)));
 await s.browser.close(); process.exit(summary.every(x => x[1]) && !s.errors.length ? 0 : 1);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
