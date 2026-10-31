
/* Author: Andrew Fisher. v11.22 checks: the Water checked extra in the tracker definition; the water tally on the servicing panel
   (rendered from the page's own panel module with made-up ticks, since the live panel reads the tracker on the edit link only)
   and in the crew card template; the completion percentage identical to the previous page on the same ticks. GET only; the
   record is compared before and after.
     PAGE=build/GC500_v11.22/GC500_Delivery_Control_hosted.html PREV=build/GC500_v11.21/GC500_Delivery_Control_hosted.html node tests/test_v1122.cjs
     LIVE=1 node tests/test_v1122.cjs */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE, prevFile = process.env.PREV;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 500))); };
/* made-up ticks for Fri 23 Oct: PG01's FWF cleaned, water checked and refilled; PG03's FWF cleaned and checked only; one block cleaned */
const EVENTS = (day) => [
 {id: 'e1', line: 'PG01-FWF', task: 'clean', day, done: true, tapped_at: day + 'T12:00:00.000Z', at: day + 'T12:00:01.000Z'},
 {id: 'e2', line: 'PG01-FWF', task: 'check', day, done: true, tapped_at: day + 'T12:01:00.000Z', at: day + 'T12:01:01.000Z'},
 {id: 'e3', line: 'PG01-FWF', task: 'refill', day, done: true, tapped_at: day + 'T12:02:00.000Z', at: day + 'T12:02:01.000Z'},
 {id: 'e4', line: 'PG03-FWF', task: 'clean', day, done: true, tapped_at: day + 'T12:03:00.000Z', at: day + 'T12:03:01.000Z'},
 {id: 'e5', line: 'PG03-FWF', task: 'check', day, done: true, tapped_at: day + 'T12:04:00.000Z', at: day + 'T12:04:01.000Z'},
];
const renderPanel = (events) => new Promise(res => {
 const D = SVC1067_DATA, day = D.days.find(d => d.id === '2026-10-23') ? '2026-10-23' : D.days[0].id;
 const M = {S: SvcState, D, events, now: Date.parse(day + 'T13:00:00Z'), day, open: {}, lastRead: Date.now(), readStatus: 'test render'};
 const host = document.createElement('div'); host.id = 'svc1122-test-host'; host.innerHTML = SvcPanel.svcPanelHtml(M); document.body.appendChild(host);
 const meter = host.querySelector('[data-svc1102-key="panel-overall-wrap"]'), water = host.querySelector('.svc1122-water[data-svc1122="overall"]');
 const areas = [...host.querySelectorAll('.svc1122-water.area')];
 const tasks = [...host.querySelectorAll('.svc-tasks')].slice(0, 1).flatMap(ul => [...ul.querySelectorAll('li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()));
 const cols = [...host.querySelectorAll('.svc-tbl thead th')].map(th => th.textContent.replace(/\s+/g, ' ').trim());
 const r = {meterPct: meter ? (meter.textContent.match(/(\d+)%/) || [])[1] : null, meterText: meter ? meter.textContent.replace(/\s+/g, ' ').trim().slice(0, 160) : null,
  water: water ? water.textContent.replace(/\s+/g, ' ').trim() : null, areaWater: areas.length, areaTexts: areas.slice(0, 2).map(a => a.textContent.replace(/\s+/g, ' ').trim()),
  tasks, cols: [...new Set(cols)], hasCheck: !!(D.tasks && D.tasks.check), extras: D.extras, planFwf: D.plans.fwf.night, cleanGroup: D.groups.clean.tasks, day};
 host.remove(); res(r);
});
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#today', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#today', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(1500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.22'));
  const d = await p.evaluate(renderPanel, EVENTS('2026-10-23'));
  console.log('panel:', JSON.stringify(d).slice(0, 900));
  check('tracker definition: "Water checked" is a task, an extra, on the clean code, in the FWF and accessible night plan', d.hasCheck && d.extras.join() === 'check,refill' && d.planFwf.join() === 'pump,clean,check,refill' && d.cleanGroup.indexOf('check') >= 0, {extras: d.extras, planFwf: d.planFwf, cleanGroup: d.cleanGroup});
  check('panel completion meter renders (made-up ticks: two cleans count, checks and refills do not)', d.meterPct != null, d.meterText);
  check('water line: "Water checked · 2 of N units · refilled 1 (FWF 1, accessible 0)", not in the completion %', !!d.water && /Water checked · 2 of \d+ units · refilled 1 \(FWF 1, accessible 0\)/.test(d.water) && /not in the completion %/.test(d.water), d.water);
  check('a small water line on each area with FWF or accessible units; area 1 shows 2 checked, 1 refilled', d.areaWater >= 10 && /2 of \d+ units · refilled 1/.test(d.areaTexts[0] || ''), {areaWater: d.areaWater, areaTexts: d.areaTexts});
  check('"Water checked" and "Refilled" are not among the counted jobs; the table shows them as "not in %" columns', !d.tasks.some(t => /Water checked|Refilled/.test(t)) && d.cols.some(c => /Water checked.*not in %/.test(c)) && d.cols.some(c => /Refilled.*not in %/.test(c)), {tasks: d.tasks, cols: d.cols});
  // the crew card template, published the way the admin fold publishes it, rendered in a second tab
  const card = await p.evaluate(() => { const data = JSON.parse(JSON.stringify(SVC1067_CARD.data)); data.contact = {name: 'Test contact', phone: '0400 000 000'}; return SvcTrackerAdmin1067.cardHtml(SVC1067_CARD.html, data, true); });
  check('card template publishes with the water tally and the new hint; its data carries the Water checked job', /function waterHtml/.test(card) && /\.water\{/.test(card) && /Tap when the water is checked/.test(card) && /"check":"Water checked"/.test(card) && (card.match(/<script/g) || []).length === 1 && !/\/\*SVC1067_DATA\*\/null/.test(card), {len: card.length});
  const c = await p.context().newPage();
  await c.route('**/*', r => { if (r.request().method() !== 'GET') return r.abort(); return r.fulfill({status: 404, body: ''}); });
  await c.setContent(card, {waitUntil: 'domcontentloaded'});
  await c.waitForTimeout(2500);
  const cd = await c.evaluate(() => ({barsWater: !!document.querySelector('#bars .water'), small: document.querySelectorAll('.water.small').length, barsText: ((document.getElementById('bars') || {}).innerText || '').replace(/\s+/g, ' ').slice(0, 200), errors: 0}));
  check('crew card (view mode): a water line under the Everything bar reading "Water checked · 0 of N · refilled 0", and a small one on each area header', cd.barsWater && /Water checked · 0 of \d+ · refilled 0/.test(cd.barsText) && cd.small >= 10, cd);
  await c.screenshot({path: path.join(out, 'card_view_water.png')}).catch(() => {});
  await c.close();
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
  if (prevFile && !live) {
   const h2 = await open({pageFile: prevFile, hash: '#today', W: 1440, H: 1000});
   try {
    await h2.page.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
    const d2 = await h2.page.evaluate(renderPanel, EVENTS('2026-10-23'));
    check('completion percentage and counted jobs identical to the previous page on the same ticks (' + d2.meterPct + '%)', d2.meterPct === d.meterPct && JSON.stringify(d2.tasks) === JSON.stringify(d.tasks), {prev: d2.meterPct, now: d.meterPct, prevTasks: d2.tasks, tasks: d.tasks});
   } finally { await h2.browser.close(); }
  }
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, (live ? 'live_' : '') + (MOB ? 'phone_' : 'desktop_') + 'test_v1122.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
