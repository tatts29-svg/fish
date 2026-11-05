'use strict';
// v13.01 - the Showcase reads race weekend. Read-only: GET only, every write the page tries is aborted by the harness.
// The Showcase pin must be on the page and every scene must read the record as at Fri 23 Oct 2026 whatever day is asked for (and
// whatever day the page is opened on); the scenes a viewer sees through showRender must be those same scenes. Each re-voiced turn must
// carry its new line and take, the take must be served (200, audio/mpeg, its bytes; on a build before the media step, the file in
// media_v1301/), every other turn must be exactly as on the base page, the programme must still run 1..51 and fencing still read 100%.
//   PAGE=build/GC500_v13.01/GC500_Delivery_Control_hosted.html BASE=build/GC500_v13.01/base_live.html node tests/test_v1301.cjs
//   node tests/test_v1301.cjs   (the live page; MOB=1 for phone)
const fs = require('fs'), path = require('path');
const {open} = require('../../toolchain/harness/open_page.js');
const HERE = path.resolve(__dirname, '..');
const TAKES = JSON.parse(fs.readFileSync(path.join(HERE, 'takes', 'takes.json'), 'utf8'));
const LINES = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(HERE, 'turns_changes.json'), 'utf8')).turns.map(t => [t.slot, t]));
const DAY = '2026-10-23';
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('  FAIL ' + m); } };
const dataOf = f => { const s = fs.readFileSync(f, 'utf8'), i = s.indexOf('const DATA = '), j = s.indexOf('\n', i); return JSON.parse(s.slice(i + 13, j - 1)); };
(async () => {
 const MOB = !!process.env.MOB;
 const h = await open(Object.assign(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 1000}, {hash: '#today'}, process.env.PAGE ? {pageFile: process.env.PAGE} : {}));
 const p = h.page, cons = [], notFound = []; p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
 p.on('response', res => { if (res.status() === 404) notFound.push(res.url().split('?')[0]); });
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof go === 'function' && typeof showScene === 'function' && typeof SHOW_ORDER !== 'undefined', null, {timeout: 240000});
  await p.waitForTimeout(6000);
  const r = await p.evaluate(() => { const B = DATA.broadcast, f = fenceOverall853();
   return {footer: (document.body.innerText.match(/v1[23]\.\d\d(\.\d)?/g) || []).slice(-1)[0], n: B.turns.length, slots: B.turns.map(t => t.slot),
    turns: B.turns.map(t => ({slot: t.slot, text: t.text, sha: t.sha256, scene: t.scene, loop: t.loop, url: DATA.media[t.sha256]})), revision: B.revision,
    fence: [f.state, f.pct && f.pct.min, f.pct && f.pct.max, !!f.allGreen], pinned: showScene.raceWeekend1301 || null, unpinned: typeof showScene.unpinned1301 === 'function',
    script: !!document.getElementById('showcase1301-script'), scenes: SHOW_ORDER.length, today: todayIso()}; });
  ok(r.footer === 'v13.01', 'footer ' + r.footer);
  ok(r.script && r.pinned === DAY && r.unpinned, 'the Showcase pin is on the page and reads ' + r.pinned + ' (opened ' + r.today + ')');
  /* every scene gives the same markup whatever day is asked for - the pin holds for showRender and the crew-card refresh alike */
  const same = await p.evaluate(DAY => SHOW_ORDER.map(k => { try { const a = showScene(k, todayIso()), b = showScene(k, DAY), c = showScene(k, '2026-09-20'), d = showScene(k, undefined);
   return {k, same: a === b && b === c && c === d, len: b.length}; } catch (e) { return {k, err: String(e && e.message).slice(0, 80)}; } }), DAY);
  ok(same.length === 25 && same.every(s => !s.err && s.same && s.len > 40), 'all ' + same.length + ' scenes read the record at ' + DAY + ' whatever day is asked ' + JSON.stringify(same.filter(s => s.err || !s.same || !(s.len > 40))).slice(0, 240));
  /* without the pin, the scenes that read the live record would read today's */
  const diff = await p.evaluate(DAY => SHOW_ORDER.filter(k => { try { return showScene.unpinned1301(k, todayIso()) !== showScene(k, DAY); } catch (e) { return true; } }), DAY);
  ok(diff.length > 0 && diff.length < 25, 'without the pin ' + diff.length + ' scenes would read today: ' + diff.join(', '));
  /* the figures the pinned scenes show are the record's at race weekend */
  const txt = await p.evaluate(DAY => { const strip = x => { const d = document.createElement('div'); d.innerHTML = x; return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
   return Object.fromEntries(SHOW_ORDER.map(k => [k, strip(showScene(k, DAY))])); }, DAY);
  ok(/As at 2026-10-23/.test(txt.equipment) && /265 of 265/.test(txt.equipment) && /52 of 52/.test(txt.equipment) && /311 of 311/.test(txt.equipment) && /24 of 24/.test(txt.equipment), 'equipment scene at race weekend: ' + txt.equipment.slice(0, 200));
  ok(/As at 2026-10-23/.test(txt.complete) && /7 of 7/.test(txt.complete), 'complete scene at race weekend: ' + txt.complete.slice(0, 200));
  ok(!/2026-1[12]-\d\d/.test(txt.weather_context1090) && /63 km\/h/.test(txt.weather_context1090), 'weather scene stops at race weekend: ' + txt.weather_context1090.slice(0, 240));
  ok(Object.values(txt).every(t => !/2026-1[12]-\d\d/.test(t)), 'no scene names a date after race weekend ' + JSON.stringify(Object.entries(txt).filter(([k, t]) => /2026-1[12]-\d\d/.test(t)).map(([k]) => k)));
  /* what a viewer sees: showRender puts the pinned scene in the Showcase body */
  const seen = await p.evaluate(DAY => { const body = document.getElementById('showBody'); if (!body) return {missing: true};
   const was = {open: SHOW.open, i: SHOW.i, playing: SHOW.playing, reduced: SHOW.reduced, launch: SHOW.launch}; const out = [];
   const norm = x => { const d = document.createElement('div'); d.innerHTML = x; return d.innerHTML; }; /* the browser's own serialisation (a bare attribute reads back as ="") */
   try { SHOW.open = true; SHOW.playing = false; SHOW.launch = -1;
    for (const key of ['complete', 'equipment', 'weather_context1090', 'fence']) { SHOW.i = SHOW_ORDER.indexOf(key); showRender(); const w = body.querySelector('.shwrap'); out.push({key, same: !!w && w.innerHTML === norm(showScene(key, DAY))}); } }
   finally { Object.assign(SHOW, was); if (typeof showClear === 'function') showClear(); }
   return {out}; }, DAY);
  ok(!seen.missing && seen.out.length === 4 && seen.out.every(x => x.same), 'showRender shows the race-weekend scene ' + JSON.stringify(seen).slice(0, 200));
  ok(r.n === 51 && JSON.stringify(r.slots) === JSON.stringify(Array.from({length: 51}, (_, i) => i + 1)), 'the programme still runs turns 1 to 51');
  for (const x of TAKES) {
   const t = r.turns.find(y => y.slot === x.slot);
   ok(t && t.text === LINES[x.slot].text && t.sha === x.sha256 && t.scene === LINES[x.slot].scene, 'turn ' + x.slot + ' carries its line and take ' + x.sha256.slice(0, 12));
   const f = await p.evaluate(async u => { if (typeof u !== 'string') return null; try { const q = await fetch(u); const b = await q.arrayBuffer(); return {status: q.status, type: q.headers.get('content-type'), bytes: b.byteLength}; } catch (e) { return {error: String(e && e.message).slice(0, 80)}; } }, t && t.url);
   const served = f && f.status === 200 && /audio\/mpeg/.test(f.type || '') && f.bytes === x.bytes;
   if (!served && process.env.PAGE) {
    const local = path.join(path.dirname(path.resolve(process.env.PAGE)), 'media_v1301', x.sha256 + '.mp3');
    ok(fs.existsSync(local) && fs.statSync(local).size === x.bytes, 'turn ' + x.slot + ' take not yet on the service (' + JSON.stringify(f) + '); media_v1301/' + x.sha256.slice(0, 12) + '.mp3 ready for the media step');
   } else ok(served, 'turn ' + x.slot + ' take served ' + JSON.stringify(f));
  }
  if (process.env.BASE) {
   const B0 = dataOf(process.env.BASE).broadcast, changed = new Set(TAKES.map(x => x.slot));
   const same0 = B0.turns.filter(t => !changed.has(t.slot)).every(t => { const n = r.turns.find(y => y.slot === t.slot); return n && n.text === t.text && n.sha === t.sha256; });
   ok(same0, 'the other ' + (51 - changed.size) + ' turns are exactly as on the base page');
  }
  ok(/\(v13\.01\)/.test(r.revision) && /race weekend/.test(r.revision), 'the programme note names the v13.01 revision');
  ok(r.fence[0] === 'ready' && r.fence[1] === 100 && r.fence[2] === 100 && r.fence[3] === true, 'fencing still reads 100%, five green ' + JSON.stringify(r.fence));
  /* on a build before the media step the only 404s allowed are the new takes themselves (one console error each); on the live page none */
  const pending = process.env.PAGE ? notFound.filter(u => TAKES.some(x => u.includes(x.sha256))) : [], other404 = notFound.filter(u => !pending.includes(u));
  const cons404 = cons.filter(c => /404/.test(c)), consOther = cons.filter(c => !/404/.test(c));
  ok(h.errors.length === 0 && consOther.length === 0 && other404.length === 0 && cons404.length === pending.length && h.counts.blocked === 0,
     'no page or console errors, no writes' + (pending.length ? ' (' + pending.length + ' takes not yet on the service, each a 404 before the media step)' : '') + ' ' + JSON.stringify(h.errors.concat(consOther, other404)).slice(0, 200));
 } catch (e) { fail++; console.log('  FAIL ' + (e && e.stack || e)); }
 await h.browser.close();
 console.log((MOB ? 'phone' : 'desktop') + ': ' + pass + ' passed, ' + fail + ' failed');
 process.exit(fail ? 1 : 0);
})();
