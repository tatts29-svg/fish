/* Author: Andrew Fisher. v11.35 checks: a print button no longer opens the twin-steer tick (the banner stays); the Build tab's
   day strip and agenda stop at 22 Oct 2026 though the calendar runs on; Coates on time now carries the 22 Oct export (126
   units) and the Monday 19 to Wednesday 21 Oct cards show their percentage row. GET only; the record is compared.
     PAGE=build/GC500_v11.35/GC500_Delivery_Control_hosted.html node tests/test_v1135.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 900))); };
const tag = (live ? 'live_' : '') + (MOB ? 'phone' : 'desktop');
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#nights', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#nights', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(1500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.35'));
  const pr = await p.evaluate(() => new Promise(r => { const b = document.querySelector('#pane-nights [data-n1022-print]'); const banner = !!document.getElementById('ts1053-banner'); if (!b) return r({noButton: true, banner}); b.click(); setTimeout(() => r({banner, dialog: !!document.getElementById('ts1053'), hash: location.hash, sheet: !!document.querySelector('#dayprint .ps7')}), 1500); }));
  check('a print button goes straight to the print view: no twin-steer tick dialog; the red banner stays', !pr.noButton && pr.banner && !pr.dialog && /^#print\/nights\//.test(pr.hash) && pr.sheet, pr);
  await p.evaluate(() => { location.hash = '#timeline'; });
  await p.waitForFunction(() => document.querySelectorAll('#pane-timeline [data-day]').length > 0, null, {timeout: 60000});
  await p.waitForTimeout(800);
  const bt = await p.evaluate(() => { const days = [...document.querySelectorAll('#pane-timeline [data-day]')].map(e => e.getAttribute('data-day')).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)); const cal = calendarDays().map(d => d.iso); return {n: days.length, max: days.reduce((m, d) => d > m ? d : m, ''), calMax: cal.reduce((m, d) => d > m ? d : m, ''), calHasLater: cal.some(d => d >= '2026-10-23'), has22: days.includes('2026-10-22'), has21: days.includes('2026-10-21')}; });
  check('the Build tab stops at 22 Oct 2026 while the calendar itself runs on', bt.n > 20 && bt.max === '2026-10-22' && bt.has22 && bt.has21 && bt.calHasLater && bt.calMax >= '2026-10-23', bt);
  const ot = await p.evaluate(() => ({units: (ontime1057 && typeof ontime1057.model === 'function') ? null : null, exportAt: (function () { try { return ontime1057.what ? ontime1057.what() : null; } catch (e) { return null; } })()}));
  const data = await p.evaluate(() => { const s = [...document.scripts].map(x => x.textContent).find(x => x.indexOf('ontime1057 = {version') >= 0) || ''; const m = s.match(/"export_at":"([^"]+)"/), n = s.match(/"export_day":"([^"]+)"/), u = (s.match(/"id":"\d{4}-\d{2,3}"/g) || []).length; return {exportAt: m && m[1], exportDay: n && n[1], units: u, old16: /"export_day":"2026-10-16"/.test(s)}; });
  check('Coates on time carries the 22 Oct export: 126 units, nothing of the 16 Oct export left', data.exportDay === '2026-10-22' && /22 Oct 2026/.test(data.exportAt || '') && data.units === 126 && !data.old16, data);
  const rows = await p.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); const outp = {};
   for (const iso of ['2026-10-19', '2026-10-20', '2026-10-21']) { const c = document.querySelector('#pane-timeline [data-day="' + iso + '"]'); if (!c) { outp[iso] = 'no card'; continue; } c.click(); await wait(900); const r = document.querySelector('#pane-timeline .day.past984[data-day="' + iso + '"] .ot1057') || document.querySelector('#pane-timeline .ot1057'); outp[iso] = r ? r.innerText.replace(/\s+/g, ' ').trim() : 'no row'; }
   return outp; });
  check('Monday 19, Tuesday 20 and Wednesday 21 Oct show their COATES ON TIME row with a percentage', ['2026-10-19', '2026-10-20', '2026-10-21'].every(d => /COATES ON TIME · \d+ OF \d+/.test(rows[d] || '') && /\d+ ?%/.test(rows[d] || '')), rows);
  const more = await p.evaluate(() => { try { const t = document.createElement('div'); t.innerHTML = ontime1057.moreHtml('2026-10-21'); return {loaded: (t.textContent.match(/Coates texts loaded to [^.]+/) || [''])[0], late: (t.textContent.match(/late/gi) || []).length}; } catch (e) { return {error: String(e)}; } });
  check('More info says the texts are loaded to 22 Oct 2026', /22 Oct 2026/.test(more.loaded || ''), more);
  await p.screenshot({path: path.join(out, 'build_21oct_' + tag + '.png'), fullPage: false});
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, tag + '_test_v1135.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
