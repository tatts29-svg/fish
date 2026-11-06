'use strict';
// v11.81.1 - the fencing card's lights. Read-only: GET only. Opens Today, shows the Fencing card, checks five green lights on the
// completed reading, the panel marked complete, the caption naming the ruling, and an earlier day keeping red milestone lights.
//   PAGE=build/GC500_v11.81.1/GC500_Delivery_Control_hosted.html node tests/test_v11811.cjs   (desktop; MOB=1 for phone; no PAGE = live)
const path = require('path');
const {open} = require('../../toolchain/harness/open_page.js');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ok  ' + m); } else { fail++; console.log('  FAIL ' + m); } };
(async () => {
 const MOB = !!process.env.MOB;
 const h = await open(Object.assign(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 1000}, {hash: '#today'}, process.env.PAGE ? {pageFile: process.env.PAGE} : {}));
 const p = h.page, cons = []; p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof go === 'function', null, {timeout: 240000});
  await p.waitForTimeout(7000);
  const m = await p.evaluate(() => { const f = fenceOverall853(), e = fenceOverall853('2026-10-16'), x = progress881Model();
   return {footer: (document.body.innerText.match(/v11\.\d\d(\.\d)?/g) || []).slice(-1)[0], green: f.allGreen, done: !!f.buildComplete1181, pct: f.pct, earlier: [e.allGreen, !!e.buildComplete1181, e.pct && Math.round(e.pct.min)], index: [x.allGreen, x.reached]}; });
  ok(m.footer === 'v11.81.1', 'footer ' + m.footer);
  ok(m.green === true && m.done === true && m.pct.min === 100, 'the race-weekend fencing reading is complete: allGreen under the ruling');
  ok(m.earlier[0] === false && m.earlier[1] === false, 'an earlier day (16 Oct) is not marked complete ' + JSON.stringify(m.earlier));
  ok(m.index[0] === true && m.index[1] === 5, 'the seven-group index lights all five green ' + JSON.stringify(m.index));
  const clicked = await p.evaluate(() => { const b = [...document.querySelectorAll('#pane-today button, #pane-today [role="tab"]')].find(x => /^\s*Fencing\s*$/.test(x.textContent || '')); if (b) { b.click(); return true; } return false; });
  await p.waitForTimeout(2500);
  const c = await p.evaluate(() => { const s = document.querySelector('[data-tw853-overall] .tw846-display'); if (!s) return null; s.scrollIntoView({block: 'center'});
   return {complete: s.dataset.complete, on: s.querySelectorAll('.tl841-lamp.is-on').length, fin: s.querySelectorAll('.tl841-lamp.is-finished').length, caption: (s.querySelector('.tw853-qualifier') || {}).textContent,
    label: (s.querySelector('.race-lights') || {getAttribute: () => ''}).getAttribute('aria-label'), pct: (s.querySelector('.tw840-percent') || {}).textContent}; });
  ok(clicked && c, 'the Fencing card is on screen');
  ok(c && c.on === 5 && c.fin === 5 && c.complete === 'true', 'five lights on, all finished (green), panel complete ' + JSON.stringify(c && [c.on, c.fin, c.complete]));
  ok(c && c.caption === 'Build complete at the docket numbers' && /All five lights green/.test(c.label) && /100/.test(c.pct || ''), 'caption and label name the ruling: ' + (c && c.caption));
  await p.waitForTimeout(2500);
  const el = await p.$('[data-tw853-overall]');
  if (el) await el.screenshot({path: path.join(__dirname, '..', 'evidence', '' + (process.env.PAGE ? 'build' : 'live') + '_' + (MOB ? 'phone' : 'desktop') + '.png')});
  ok(h.errors.length === 0 && cons.length === 0 && h.counts.blocked === 0, 'no page or console errors, no writes ' + JSON.stringify(h.errors.concat(cons)).slice(0, 200));
 } finally { await h.browser.close(); }
 console.log('\n' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
