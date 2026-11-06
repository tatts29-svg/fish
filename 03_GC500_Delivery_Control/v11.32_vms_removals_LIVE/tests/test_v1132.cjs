/* Author: Andrew Fisher. v11.32 checks: the VMS removals tab (#vmsoff) lists the five end-of-session boards with Andrew's earliest
   off-track times (VMS 14, 16, 17 from 03:00; VMS 13, 15 not before 06:00), where each goes (VMS 16 behind 2 Breaker St, Main
   Beach), navigation links, the Supercars track access times, the three removal mornings, ticks that are not pre-ticked and
   refuse to write on the view link, and the printable sheet on #print/vmsoff/<date>. GET only; the record is compared.
     PAGE=build/GC500_v11.32/GC500_Delivery_Control_hosted.html node tests/test_v1132.cjs      MOB=1 ...      LIVE=1 ... */
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
 const h = await open(MOB ? {pageFile, hash: '#vmsoff', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#vmsoff', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForFunction(() => { const pane = document.getElementById('pane-vmsoff'); return pane && pane.offsetHeight > 0 && pane.querySelectorAll('.v1132-board').length > 0; }, null, {timeout: 60000});
  await p.waitForTimeout(1000);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.32'));
  const tab = await p.evaluate(() => ({inTabs: TABS.some(t => t[0] === 'vmsoff' && t[1] === 'VMS removals'), shown: document.getElementById('pane-vmsoff').offsetHeight > 0, hash: location.hash, heading: (document.querySelector('#pane-vmsoff h3') || {}).textContent}));
  check('the tab is in the list as VMS removals, #vmsoff shows it', tab.inTabs && tab.shown && /vmsoff/.test(tab.hash), tab);
  const bs = await p.evaluate(() => VmsOff1132.boards().map(b => ({pos: b.pos, label: b.label, from: b.from, must: b.must, where: b.where, store: b.store, lat: b.lat, lon: b.lon, storeLat: b.storeLat, storeLon: b.storeLon})));
  check('five boards, earliest first: VMS 14, 16, 17 from 03:00 then VMS 13 and 15 not before 06:00', bs.map(b => b.pos).join(',') === '14,16,17,13,15' && bs.slice(0, 3).every(b => b.from === '03:00' && !b.must) && bs.slice(3).every(b => b.from === '06:00' && b.must), bs);
  const b16 = bs.find(b => b.pos === '16'), b15 = bs.find(b => b.pos === '15'), b13 = bs.find(b => b.pos === '13');
  check('VMS 16 goes behind 2 Breaker St, Main Beach, with the spot pinned; VMS 15 to the T2 runoff with its pin; VMS 13 to the Altus compound; positions from the plan', b16 && /2 Breaker St, Main Beach/.test(b16.store) && Math.abs(b16.storeLat + 27.9817267) < 1e-6 && Math.abs(b16.storeLon - 153.42943) < 1e-6 && /T11/.test(b16.where) && b15 && /T2 runoff/.test(b15.store) && Math.abs(b15.storeLat + 27.990144) < 1e-6 && b13 && /Altus compound/.test(b13.store) && /T14/.test(b13.where) && bs.every(b => Number.isFinite(b.lat) && Number.isFinite(b.lon)), {b16, b15, b13});
  const dom = await p.evaluate(() => { const pane = document.getElementById('pane-vmsoff'), txt = pane.innerText;
   return {boards: pane.querySelectorAll('.v1132-board').length, f03: pane.querySelectorAll('.v1132-from.f03').length, f06: pane.querySelectorAll('.v1132-from.f06').length, nav: [...pane.querySelectorAll('a[href*="google.com/maps/dir"]')].length,
    breaker: /2 Breaker St, Main Beach/.test(txt), fence: /fence closure/i.test(txt) && /07:00/.test(txt) && /07:45/.test(txt), opening: /opening lap/i.test(txt), access: pane.querySelectorAll('.v1132-day').length, accessTimes: /17:20/.test(txt) && /05:00/.test(txt) && /Tedder Ave/.test(txt),
    mornings: [...pane.querySelectorAll('[data-v1132-morning]')].map(b => b.dataset.v1132Morning), ticks: pane.querySelectorAll('input.v1132-tick').length, ticked: pane.querySelectorAll('input.v1132-tick:checked').length, printBtn: !!pane.querySelector('[data-v1132-print]'), overflow: document.documentElement.scrollWidth - window.innerWidth}; });
  check('the tab shows the five boards with their time badges, 7 navigation links (5 boards, VMS 16 spot, VMS 15 spot), Breaker St, the fence closure and opening-lap times, three mornings and the Supercars access table', dom.boards === 5 && dom.f03 === 3 && dom.f06 === 2 && dom.nav === 7 && dom.breaker && dom.fence && dom.opening && dom.access === 5 && dom.accessTimes && dom.mornings.join(',') === '2026-10-24,2026-10-25,2026-10-26' && dom.printBtn, dom);
  check('nothing is pre-ticked: 12 ticks on a morning with a back-out tick (5 off, 5 back out, sign-off, audit), none checked; no horizontal overflow', dom.ticks === 12 && dom.ticked === 0 && dom.overflow <= 1, {ticks: dom.ticks, ticked: dom.ticked, overflow: dom.overflow});
  const mon = await p.evaluate(() => { const pane = document.getElementById('pane-vmsoff'); pane.querySelector('[data-v1132-morning="2026-10-26"]').click(); const t = pane.innerText; return {ticks: pane.querySelectorAll('input.v1132-tick').length, heading: (pane.querySelector('.v1132-morning h3') || {}).textContent, roads: /Roads reopen/.test(t) && /17:00/.test(t), noOut: !pane.querySelector('[data-v1132="out"]')}; });
  check('Monday is the final removal: 7 ticks (5 off, sign-off, audit), no back-out tick, roads reopen 17:00', mon.ticks === 7 && mon.noOut && mon.roads && /Monday/.test(mon.heading), mon);
  const refused = await p.evaluate(() => { const pane = document.getElementById('pane-vmsoff'); pane.querySelector('[data-v1132-morning="2026-10-24"]').click(); const box = pane.querySelector('input.v1132-tick[data-v1132="off"]'); box.click(); return new Promise(r => setTimeout(() => r({checkedAfter: !!pane.querySelector('input.v1132-tick[data-v1132="off"]').checked, anyChecked: pane.querySelectorAll('input.v1132-tick:checked').length, recs: Object.keys(S.loads || {}).filter(k => k.indexOf('vmsoff1132/') === 0).length}), 600)); });
  check('a tick on the view link is refused and springs back; nothing is written', !refused.checkedAfter && refused.anyChecked === 0 && refused.recs === 0, refused);
  await p.screenshot({path: path.join(out, 'vmsoff_tab_' + tag + '.png'), fullPage: true});
  await p.evaluate(() => { location.hash = '#print/vmsoff/2026-10-24'; });
  await p.waitForFunction(() => document.querySelector('#dayprint .ps7.v1132'), null, {timeout: 30000});
  await p.waitForTimeout(1500);
  const sheet = await p.evaluate(() => { const sec = document.querySelector('#dayprint .ps7.v1132'); const t = sec.innerText; return {rows: sec.querySelectorAll('table.v1132-t tbody tr').length, title: (sec.querySelector('h1') || {}).textContent, zoom: sec.style.zoom || '1', breaker: /2 Breaker St/.test(t), fence: /Fence closure/.test(t), cols: sec.querySelectorAll('table.v1132-t thead th').length, bar: !!document.querySelector('.printing-day, body.printing-day')}; });
  check('the removals sheet prints on #print/vmsoff/<date>: one A4 page with the five boards, the times and Breaker St', sheet.rows === 5 && /Saturday morning/.test(sheet.title) && parseFloat(sheet.zoom) >= 0.8 && sheet.breaker && sheet.fence && sheet.cols === 7, sheet);
  await p.screenshot({path: path.join(out, 'vmsoff_sheet_' + tag + '.png'), fullPage: true});
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, tag + '_test_v1132.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
