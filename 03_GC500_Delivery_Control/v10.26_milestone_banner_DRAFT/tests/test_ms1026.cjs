#!/usr/bin/env node
/* Author: Andrew Fisher. Practice tests for the milestone banner (v10.26), read only through the toolchain harness:
   the page is opened at the live address reading the live record and every write it tries is ABORTED.

     PAGE=build/GC500_v10.26/GC500_Delivery_Control_hosted.html node test_ms1026.cjs [--shots dir]

   1 phone, #today: the banner sits inside the first screen, above Where we are, one line per area at 100% with the
     day and the days start to finish; the screen burst plays (a fixed canvas over the viewport), no card burst; the
     moment is marked seen; a redraw plays nothing again.
   2 desktop, opened on #plant: no burst and nothing marked seen while Today is not showing; go('today') then plays
     it and marks it seen. Show me scrolls the card into view and bursts over it; Summary opens the area's facts.
   3 print path still works (#print/milestone/buildings); the other tabs route; footer v10.26. */
'use strict';
const fs = require('fs'), path = require('path');
const TOOLCHAIN = path.join(__dirname, '..', '..', 'toolchain');
const {open} = require(path.join(TOOLCHAIN, 'harness', 'open_page.js'));
const PAGE = process.env.PAGE; if (!PAGE) { console.error('PAGE=... is needed'); process.exit(2); }
const args = process.argv.slice(2), shots = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : path.join(__dirname, 'shots');
fs.mkdirSync(shots, {recursive: true});
const out = {page: path.basename(PAGE), checks: [], fails: []};
const check = (name, ok, detail) => { out.checks.push({name, ok: !!ok, detail}); if (!ok) out.fails.push(name); console.log((ok ? 'ok   ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail).slice(0, 240) : '')); };
const live = async page => page.waitForFunction(() => typeof SYNC !== 'undefined' && (SYNC.status === 'live' || SYNC.status === 'unreachable'), null, {timeout: 240000});

(async () => {
  /* 1 phone */
  let s = await open({pageFile: PAGE, hash: '#today', mobile: true, W: 390, H: 844, dpr: 2});
  await live(s.page);
  const burst = await s.page.waitForFunction(() => !!document.querySelector('canvas.ms1026-screen'), null, {timeout: 12000}).then(() => true).catch(() => false);
  if (burst) { await s.page.waitForTimeout(900); await s.page.screenshot({path: path.join(shots, 'phone_burst.png')}); }
  await s.page.waitForTimeout(8000);
  const v = await s.page.evaluate(() => {
    const b = document.getElementById('ms1026'), r = b && b.getBoundingClientRect(), where = document.getElementById('where885');
    const all = MS1025.allFacts(), reached = all.filter(f => f.reached);
    return {banner: !!b, top: r && Math.round(r.top + scrollY), bottom: r && Math.round(r.bottom + scrollY), vh: innerHeight, aboveWhere: !!(b && where && b.compareDocumentPosition(where) & Node.DOCUMENT_POSITION_FOLLOWING),
      rows: b ? [...b.querySelectorAll('li')].map(li => ({id: li.dataset.ms1026, text: li.textContent.replace(/\s+/g, ' ').trim()})) : [], reached: reached.map(f => f.id), seen: MS1025.seen(),
      cardCanvas: !!document.querySelector('.tw840-card canvas.ms1025-fw'), screenGone: !document.querySelector('canvas.ms1026-screen'), footer: (document.body.innerText.match(/v10\.\d+/g) || []).pop()};
  });
  check('phone: banner on Today', v.banner, {top: v.top, bottom: v.bottom});
  check('phone: banner inside the first screen, above Where we are', v.banner && v.bottom <= v.vh && v.aboveWhere, {bottom: v.bottom, vh: v.vh, aboveWhere: v.aboveWhere});
  check('phone: one line per reached area, with the day', v.rows.length === v.reached.length && v.rows.every(r => v.reached.includes(r.id) && /reached \d+ \w+ 2026/.test(r.text)), v.rows);
  check('phone: screen burst played on first sight', burst);
  check('phone: no burst over the off-screen card', !v.cardCanvas);
  check('phone: every reached area marked seen', v.reached.every(id => v.seen[id]), v.seen);
  check('phone: screen canvas gone after', v.screenGone);
  await s.page.evaluate(() => renderToday());
  const again = await s.page.waitForFunction(() => !!document.querySelector('canvas.ms1026-screen'), null, {timeout: 3000}).then(() => true).catch(() => false);
  check('phone: a redraw plays nothing again', !again && await s.page.evaluate(() => !!document.getElementById('ms1026')));
  check('footer v10.26', v.footer === 'v10.26', v.footer);
  await s.page.screenshot({path: path.join(shots, 'phone_today.png')});
  check('phone: no page errors', s.errors.length === 0, s.errors); check('phone: nothing written', s.counts.blocked === 0, s.counts);
  await s.browser.close();

  /* 2 desktop, opened elsewhere first */
  s = await open({pageFile: PAGE, hash: '#plant', W: 1440, H: 900});
  await live(s.page); await s.page.waitForTimeout(4000);
  const d0 = await s.page.evaluate(() => ({tab: state.tab, seen: MS1025.seen(), canvas: !!document.querySelector('canvas.ms1026-screen'), reached: MS1025.allFacts().filter(f => f.reached).map(f => f.id)}));
  check('desktop: on another tab nothing fires and nothing is marked seen', d0.tab !== 'today' && !d0.canvas && !d0.reached.some(id => d0.seen[id]), d0);
  await s.page.evaluate(() => go('today'));
  const burst2 = await s.page.waitForFunction(() => !!document.querySelector('canvas.ms1026-screen'), null, {timeout: 12000}).then(() => true).catch(() => false);
  if (burst2) { await s.page.waitForTimeout(1200); await s.page.screenshot({path: path.join(shots, 'desk_burst.png')}); }
  await s.page.waitForTimeout(8000);
  const d1 = await s.page.evaluate(() => ({tab: state.tab, seen: MS1025.seen(), banner: !!document.getElementById('ms1026'), reached: MS1025.allFacts().filter(f => f.reached).map(f => f.id)}));
  check('desktop: going to Today plays it and marks it seen', burst2 && d1.banner && d1.reached.every(id => d1.seen[id]), d1);
  await s.page.screenshot({path: path.join(shots, 'desk_today.png')});
  const show = await s.page.evaluate(async () => { const b = document.querySelector('#ms1026 [data-ms1026-show]'); if (!b) return {no: true}; const id = b.dataset.ms1026Show; b.click();
    let canvas = false; for (let i = 0; i < 30 && !canvas; i++) { await new Promise(r => setTimeout(r, 150)); const c = document.querySelector(`.tw840-card[data-tw840-area="${id}"]`); canvas = !!(c && c.querySelector('canvas.ms1025-fw')); }
    const card = document.querySelector(`.tw840-card[data-tw840-area="${id}"]`), r = card.getBoundingClientRect(); return {id, inView: r.top >= 0 && r.top < innerHeight, canvas}; });
  check('desktop: Show me scrolls to the card and bursts over it', show.inView && show.canvas, show);
  await s.page.screenshot({path: path.join(shots, 'desk_showme.png')});
  const sum = await s.page.evaluate(async () => { const b = document.querySelector('#ms1026 [data-ms1026-sum]'); if (!b) return {no: true}; b.click(); await new Promise(r => setTimeout(r, 1200)); const det = document.querySelector(`#ms1025 .ms1025-area[data-ms1025="${b.dataset.ms1026Sum}"]`); return {open: det && det.open, rows: det ? det.querySelectorAll('.ms1025-facts tr').length : 0}; });
  check('desktop: Summary opens the facts', sum.open && sum.rows > 8, sum);
  check('desktop: no page errors', s.errors.length === 0, s.errors);
  await s.browser.close();

  /* 3 print path and routing */
  s = await open({pageFile: PAGE, hash: '#print/milestone/buildings', W: 1440, H: 900});
  await live(s.page);
  const ok = await s.page.waitForFunction(() => document.querySelectorAll('.ps7.ms1025p').length > 0, null, {timeout: 20000}).then(() => true).catch(() => false);
  const p = await s.page.evaluate(() => ({tab: state.tab, sheets: document.querySelectorAll('.ps7.ms1025p').length, banner: getComputedStyle(document.getElementById('ms1026') || document.body).display, footer: (document.body.innerText.match(/v10\.\d+/g) || []).pop()}));
  check('print: #print/milestone/buildings still makes a sheet on Today', ok && p.tab === 'today' && p.sheets === 1, p);
  for (const t of ['plant', 'subhired', 'demob', 'map', 'docs']) { await s.page.evaluate(x => go(x), t); await s.page.waitForTimeout(400); }
  const tabs = await s.page.evaluate(() => state.tab);
  check('the other tabs still route', tabs === 'docs', tabs);
  check('print run: no page errors', s.errors.length === 0, s.errors); check('print run: nothing written', s.counts.blocked === 0, s.counts);
  await s.browser.close();

  fs.writeFileSync(path.join(shots, 'result.json'), JSON.stringify(out, null, 1));
  console.log(out.fails.length ? `FAILED ${out.fails.length}: ${out.fails.join('; ')}` : `ALL ${out.checks.length} CHECKS PASSED`);
  process.exit(out.fails.length ? 1 : 0);
})().catch(e => { console.error('TEST CRASH', e); process.exit(1); });
