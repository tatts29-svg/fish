/* Author: Andrew Fisher. v11.23 checks: one water job "Water checked / refilled", counted in the completion; three rings on the
   servicing panel (rendered from the page's own module with made-up ticks) and in the crew card template; the whole-night
   completion worked out independently and compared with the previous page on the same ticks. GET only; the record is
   compared before and after.
     PAGE=build/GC500_v11.23/GC500_Delivery_Control_hosted.html PREV=build/GC500_v11.22/GC500_Delivery_Control_hosted.html node tests/test_v1123.cjs
     MOB=1 PAGE=... node tests/test_v1123.cjs        LIVE=1 node tests/test_v1123.cjs */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE, prevFile = process.env.PREV;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 600))); };
/* made-up ticks for Fri 23 Oct: every pump-out on the night done; PG01's FWF cleaned and water done; PG03's FWF cleaned and
   water done; nothing else. The pump-out ticks are added in the page from the definition (every line with pump that night). */
const FIXED = (day) => [
 {id: 'e1', line: 'PG01-FWF', task: 'pump', day, done: true, tapped_at: day + 'T11:58:00.000Z', at: day + 'T11:58:01.000Z'},
 {id: 'e2', line: 'PG01-FWF', task: 'clean', day, done: true, tapped_at: day + 'T12:00:00.000Z', at: day + 'T12:00:01.000Z'},
 {id: 'e3', line: 'PG01-FWF', task: 'refill', day, done: true, tapped_at: day + 'T12:02:00.000Z', at: day + 'T12:02:01.000Z'},
 {id: 'e4', line: 'PG03-FWF', task: 'clean', day, done: true, tapped_at: day + 'T12:03:00.000Z', at: day + 'T12:03:01.000Z'},
 {id: 'e5', line: 'PG03-FWF', task: 'refill', day, done: true, tapped_at: day + 'T12:04:00.000Z', at: day + 'T12:04:01.000Z'},
];
const renderPanel = (fixed) => new Promise(res => {
 const D = SVC1067_DATA, day = D.days.find(d => d.id === '2026-10-23') ? '2026-10-23' : D.days[0].id;
 const events = fixed.slice(); let n = 0; const qty = {};
 D.areas.forEach(a => a.refs.forEach(r => r.lines.forEach(l => { qty[l.id] = l.qty; if (SvcState.tasksFor(D, l, day).indexOf('pump') >= 0 && l.id !== 'PG01-FWF') events.push({id: 'p' + (++n), line: l.id, task: 'pump', day, done: true, tapped_at: day + 'T10:30:00.000Z', at: day + 'T10:30:01.000Z'}); })));
 const M = {S: SvcState, D, events, now: Date.parse(day + 'T13:00:00Z'), day, open: {}, lastRead: Date.now(), readStatus: 'test render'};
 const host = document.createElement('div'); host.id = 'svc1123-test-host'; host.innerHTML = SvcPanel.svcPanelHtml(M); document.body.appendChild(host);
 const meter = host.querySelector('[data-svc1102-key="panel-overall-wrap"]');
 const jobs = [...host.querySelectorAll('.svc1123-jobs[data-svc1123="overall"] .svc1123-job')].map(j => j.textContent.replace(/\s+/g, ' ').trim());
 const chips = [...host.querySelectorAll('.svc1123-chips')];
 const tasks = [...host.querySelectorAll('.svc-tasks')].slice(0, 1).flatMap(ul => [...ul.querySelectorAll('li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()));
 const cols = [...new Set([...host.querySelectorAll('.svc-tbl thead th')].map(th => th.textContent.replace(/\s+/g, ' ').trim()))];
 const r = {meterPct: meter ? (meter.textContent.match(/(\d+)%/) || [])[1] : null, meterText: meter ? meter.textContent.replace(/\s+/g, ' ').trim().slice(0, 200) : '', jobs, chipAreas: chips.length, chipText: chips[0] ? chips[0].textContent.replace(/\s+/g, ' ').trim() : '', tasks, cols,
  tasksDef: D.tasks, extras: D.extras, planFwf: D.plans.fwf.night, planAccess: D.plans.access.night, cleanGroup: D.groups.clean.tasks, pumpGroup: D.groups.pump.tasks, day, water1122: host.querySelectorAll('.svc1122-water').length,
  q1: qty['PG01-FWF'], q3: qty['PG03-FWF'], pumpTicks: n + 1};
 host.remove(); res(r);
});
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#today', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#today', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(1500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.23'));
  const d = await p.evaluate(renderPanel, FIXED('2026-10-23'));
  console.log('panel:', JSON.stringify(d).slice(0, 1200));
  const W = {pump: 251, clean: 259, refill: 242}, q = d.q1 + d.q3;
  const expectNow = Math.floor((W.pump + 2 * q) * 100 / (W.pump + W.clean + W.refill)), expectPrev = Math.floor((W.pump + q) * 100 / (W.pump + W.clean));
  check('definition: one water job "Water checked / refilled" (key refill), no "check", no extras (water counts), on the clean code, in the FWF and accessible night plans', d.tasksDef.refill === 'Water checked / refilled' && !d.tasksDef.check && Array.isArray(d.extras) && d.extras.length === 0 && d.planFwf.join() === 'pump,clean,refill' && d.planAccess.join() === 'pump,clean,refill' && d.cleanGroup.join() === 'clean,lockup,refill' && d.pumpGroup.join() === 'pump,lockup', {tasks: d.tasksDef, extras: d.extras, planFwf: d.planFwf, cleanGroup: d.cleanGroup, pumpGroup: d.pumpGroup});
  check('panel: three rings under the whole-night meter - Pump out 251 of 251 all done, Clean & restock ' + q + ' of 259, Water checked / refilled ' + q + ' of 242 last 22:04, no "not in the completion" note', d.jobs.length === 3 && new RegExp('Pump out\\s*251 of 251 · all done').test(d.jobs[0]) && new RegExp('Clean & restock\\s*' + q + ' of 259').test(d.jobs[1]) && new RegExp('Water checked / refilled\\s*' + q + ' of 242').test(d.jobs[2]) && /last 22:04/.test(d.jobs[2]) && !/not in the completion|own %/.test(d.jobs.join(' ')), d.jobs);
  check('panel: three chips on each area row (15 areas); the v11.22 water line is gone', d.chipAreas === 15 && /\d+%/.test(d.chipText) && d.water1122 === 0, {chipAreas: d.chipAreas, chipText: d.chipText, water1122: d.water1122});
  check('panel: whole-night completion counts pump, clean and water: ' + expectNow + '% = (251 + 2×' + q + ') of 752, worked out independently; water is among the counted jobs; its table column no longer says "not in %"', d.meterPct === String(expectNow) && d.tasks.some(t => new RegExp('Water checked / refilled\\s*' + q + ' of 242').test(t)) && d.cols.includes('Water checked / refilled') && !d.cols.some(c => /not in %/.test(c)), {meterPct: d.meterPct, expectNow, meterText: d.meterText, tasks: d.tasks, cols: d.cols});
  // the crew card template, published the way the admin fold publishes it, rendered in a second tab
  const card = await p.evaluate(() => { const data = JSON.parse(JSON.stringify(SVC1067_CARD.data)); data.contact = {name: 'Test contact', phone: '0400 000 000'}; return SvcTrackerAdmin1067.cardHtml(SVC1067_CARD.html, data, true); });
  check('card template publishes: three-job functions, the water hint, task class and icon on every job button, one counted water job in its data, no v11.22 water line', /function jobsRowHtml/.test(card) && /Tap when the water is checked or refilled/.test(card) && /cls = 'job t-' \+ task/.test(card) && /\(JOB_ICON\[task\] \|\| ''\) \+ esc\(label\)/.test(card) && /"refill":"Water checked \/ refilled"/.test(card) && /"extras":\[\]/.test(card) && !/waterHtml|"check":"Water checked"|not counted in %'\)/.test(card) && (card.match(/<script/g) || []).length === 1 && !/\/\*SVC1067_DATA\*\/null/.test(card), {len: card.length});
  const c = await p.context().newPage();
  await c.route('**/*', r => { if (r.request().method() !== 'GET') return r.abort(); return r.fulfill({status: 404, body: ''}); });
  await c.setContent(card, {waitUntil: 'domcontentloaded'});
  await c.waitForTimeout(2500);
  const cd = await c.evaluate(() => { const cp = document.getElementById('compact'); const cells = [...document.querySelectorAll('#compact .ccell')]; const last = cells[cells.length - 1]; return {rings: [...document.querySelectorAll('#bars .jobs3 .j3')].map(j => j.textContent.replace(/\s+/g, ' ').trim()), compact: cells.map(x => x.className), compactText: cp ? cp.textContent.replace(/\s+/g, ' ').trim() : '', fits: !!cp && cp.scrollWidth <= cp.clientWidth + 1 && (!last || last.getBoundingClientRect().right <= window.innerWidth), vw: window.innerWidth, lastRight: last ? Math.round(last.getBoundingClientRect().right) : null, chipIn: document.querySelectorAll('.ahead .jchips').length, jobsLabel: (document.querySelector('.task-progress') || {}).textContent}; });
  check('crew card (view mode): three rings under the Everything bar (Pump out 0 of 251, Clean & restock 0 of 259, Water checked / refilled 0 of 242)', cd.rings.length === 3 && /Pump out\s*0 of 251/.test(cd.rings[0]) && /Clean & restock\s*0 of 259/.test(cd.rings[1]) && /Water checked \/ refilled\s*0 of 242/.test(cd.rings[2]), cd.rings);
  check('crew card: sticky header carries the three small rings and fits the screen; every area header carries three chips', cd.compact.length === 3 && cd.fits && cd.chipIn >= 15 && /Everything/.test(cd.compactText), {compact: cd.compact, fits: cd.fits, vw: cd.vw, lastRight: cd.lastRight, chipIn: cd.chipIn, compactText: cd.compactText});
  await c.screenshot({path: path.join(out, 'card_view_three_jobs_' + (MOB ? 'phone' : 'desktop') + '.png'), fullPage: false}).catch(() => {});
  await c.close();
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
  if (prevFile && !live) {
   const h2 = await open({pageFile: prevFile, hash: '#today', W: 1440, H: 1000});
   try {
    await h2.page.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
    const d2 = await h2.page.evaluate(renderPanel, FIXED('2026-10-23'));
    check('on the same ticks the previous page counted pump and clean only (' + expectPrev + '% of 510); this page counts water too (' + expectNow + '% of 752)', d2.meterPct === String(expectPrev) && d.meterPct === String(expectNow) && !d2.tasks.some(t => /Water/.test(t)), {prev: d2.meterPct, expectPrev, now: d.meterPct, expectNow, prevTasks: d2.tasks});
   } finally { await h2.browser.close(); }
  }
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, (live ? 'live_' : '') + (MOB ? 'phone_' : 'desktop_') + 'test_v1123.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
