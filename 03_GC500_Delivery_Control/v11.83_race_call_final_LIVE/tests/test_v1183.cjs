'use strict';
// v11.83 - the race call says the finished build. Read-only: GET only, every write the page tries is aborted by the harness.
// Each re-voiced turn must carry its new line and take, the take must be served (200, audio/mpeg, its bytes), every other turn must
// be exactly as on the base page, the programme must still run 1..51, and v11.81's fencing reading must still be 100%.
//   PAGE=build/GC500_v11.83/GC500_Delivery_Control_hosted.html BASE=build/GC500_v11.83/base_live.html node tests/test_v1183.cjs
//   node tests/test_v1183.cjs   (the live page; MOB=1 for phone)
const fs = require('fs'), path = require('path');
const {open} = require('../../toolchain/harness/open_page.js');
const HERE = path.resolve(__dirname, '..');
const TAKES = JSON.parse(fs.readFileSync(path.join(HERE, 'takes', 'takes.json'), 'utf8'));
const LINES = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(HERE, 'turns_changes.json'), 'utf8')).turns.map(t => [t.slot, t]));
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('  FAIL ' + m); } };
const dataOf = f => { const s = fs.readFileSync(f, 'utf8'), i = s.indexOf('const DATA = '), j = s.indexOf('\n', i); return JSON.parse(s.slice(i + 13, j - 1)); };
(async () => {
 const MOB = !!process.env.MOB;
 const h = await open(Object.assign(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 1000}, {hash: '#today'}, process.env.PAGE ? {pageFile: process.env.PAGE} : {}));
 const p = h.page, cons = []; p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof go === 'function', null, {timeout: 240000});
  await p.waitForTimeout(6000);
  const r = await p.evaluate(() => { const B = DATA.broadcast, f = fenceOverall853();
   return {footer: (document.body.innerText.match(/v11\.\d\d(\.\d)?/g) || []).slice(-1)[0], n: B.turns.length, slots: B.turns.map(t => t.slot),
    turns: B.turns.map(t => ({slot: t.slot, text: t.text, sha: t.sha256, scene: t.scene, loop: t.loop, url: DATA.media[t.sha256]})), revision: B.revision,
    fence: [f.state, f.pct && f.pct.min, f.pct && f.pct.max, !!f.allGreen]}; });
  ok(r.footer === 'v11.83', 'footer ' + r.footer);
  ok(r.n === 51 && JSON.stringify(r.slots) === JSON.stringify(Array.from({length: 51}, (_, i) => i + 1)), 'the programme still runs turns 1 to 51');
  for (const x of TAKES) {
   const t = r.turns.find(y => y.slot === x.slot);
   ok(t && t.text === LINES[x.slot].text && t.sha === x.sha256 && t.scene === LINES[x.slot].scene, 'turn ' + x.slot + ' carries its line and take ' + x.sha256.slice(0, 12));
   const f = await p.evaluate(async u => { if (typeof u !== 'string') return null; try { const q = await fetch(u); const b = await q.arrayBuffer(); return {status: q.status, type: q.headers.get('content-type'), bytes: b.byteLength}; } catch (e) { return {err: String(e)}; } }, t && t.url);
   ok(f && f.status === 200 && /audio\/mpeg/.test(f.type || '') && f.bytes === x.bytes, 'turn ' + x.slot + ' take served ' + JSON.stringify(f));
  }
  if (process.env.BASE) {
   const B0 = dataOf(process.env.BASE).broadcast, changed = new Set(TAKES.map(x => x.slot));
   const same = B0.turns.filter(t => !changed.has(t.slot)).every(t => { const n = r.turns.find(y => y.slot === t.slot); return n && n.text === t.text && n.sha === t.sha256; });
   ok(same, 'the other ' + (51 - changed.size) + ' turns are exactly as on the base page');
  }
  ok(/\(v11\.83\)/.test(r.revision), 'the programme note names the v11.83 revision');
  ok(r.fence[0] === 'ready' && r.fence[1] === 100 && r.fence[2] === 100 && r.fence[3] === true, 'fencing still reads 100%, five green ' + JSON.stringify(r.fence));
  ok(h.errors.length === 0 && cons.length === 0 && h.counts.blocked === 0, 'no page or console errors, no writes ' + JSON.stringify(h.errors.concat(cons)).slice(0, 200));
 } finally { await h.browser.close(); }
 console.log('\n' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
