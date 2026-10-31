/* Author: Andrew Fisher. v11.25 checks: the detailed neon icons sit inside the job rings (card job cards 42 px, card header
   26 px, panel rings 40 px) with the percentage beside, stroked in the job colour; the small set sits on the chips; a job
   button's label icon is drawn (stroke in the job colour, no dash, no animation) while the tick box keeps its dash. The
   buttons only render on a reference's code, which needs the service, so they are built in the card's own DOM from the
   card's own TICK, JOB_ICON and TASKS. GET only; the record is compared before and after.
     PAGE=build/GC500_v11.25/GC500_Delivery_Control_hosted.html node tests/test_v1125.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 700))); };
const COLOUR = {pump: 'rgb(255, 179, 71)', clean: 'rgb(94, 242, 200)', refill: 'rgb(95, 180, 255)', lockup: 'rgb(156, 176, 194)'}, DONE = 'rgb(125, 255, 208)';
const NOZZLE = 'M6.5 9.5h9.5a3 3 0 0 1 3 3v3.5h-9l-3.5-1z', ROLL = 'M24.5 25v12a9.5 4.2 0 0 0 19 0V25', DROPHD = 'M22 4c-7 9.5-13 17-13 24a13 13 0 0 0 26 0c0-7-6-14.5-13-24z', BADGE = 'M33.8 37.5l2.6 2.6 4.8-4.8', TANKLD = 'M3 12.5h18V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z', DROPLD = 'M12 2.5c-3.6 5-7 8.6-7 12.4a7 7 0 0 0 14 0c0-3.8-3.4-7.4-7-12.4z';
const EVENTS = (day) => [
 {id: 'e1', line: 'PG01-FWF', task: 'pump', day, done: true, tapped_at: day + 'T11:58:00.000Z', at: day + 'T11:58:01.000Z'},
 {id: 'e2', line: 'PG01-FWF', task: 'clean', day, done: true, tapped_at: day + 'T12:00:00.000Z', at: day + 'T12:00:01.000Z'},
 {id: 'e3', line: 'PG01-FWF', task: 'refill', day, done: true, tapped_at: day + 'T12:02:00.000Z', at: day + 'T12:02:01.000Z'},
];
const lookSrc = `(svg) => { if (!svg) return null; const p = svg.querySelector('path, rect'); const cs = getComputedStyle(svg), ps = getComputedStyle(p); return {color: cs.color, pathStroke: ps.stroke, pathFill: ps.fill, w: Math.round(svg.getBoundingClientRect().width), h: Math.round(svg.getBoundingClientRect().height), glow: getComputedStyle(svg.parentElement).filter}; }`;
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#today', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#today', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(1500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.25'));
  // the page's servicing panel, rendered from its own module with made-up ticks
  const d = await p.evaluate(([events, lookSrc]) => {
   const look = eval(lookSrc);
   const D = SVC1067_DATA, day = D.days.find(d => d.id === '2026-10-23') ? '2026-10-23' : D.days[0].id;
   const M = {S: SvcState, D, events, now: Date.parse(day + 'T13:00:00Z'), day, open: {}, lastRead: Date.now(), readStatus: 'test render'};
   const host = document.createElement('div'); host.innerHTML = SvcPanel.svcPanelHtml(M); document.body.appendChild(host);
   const r = {rings: {}, pct: {}, chips: {}, nChips: host.querySelectorAll('.svc1123-chip').length, jobsText: [...host.querySelectorAll('.svc1123-jobs[data-svc1123="overall"] .svc1123-job')].map(j => j.textContent.replace(/\s+/g, ' ').trim())};
   for (const t of ['pump', 'clean', 'refill']) { const job = host.querySelector('.svc1123-job.' + t); r.rings[t] = look(job.querySelector('.svc1123-ring .ic svg')); r.rings[t].html = job.querySelector('.svc1123-ring .ic svg').outerHTML; r.pct[t] = job.querySelector('.svc1123-t .pct').textContent; r.chips[t] = look(host.querySelector('.svc1123-chip.' + t + ' svg')); r.chips[t].html = host.querySelector('.svc1123-chip.' + t + ' svg').outerHTML; }
   host.remove(); return r;
  }, [EVENTS('2026-10-23'), lookSrc]);
  const CHIP = Object.assign({}, COLOUR, {refill: 'rgb(143, 208, 255)'});
  check('panel: the detailed icons sit inside the three rings at 40 px, glowing, stroked in the job colour, with the percentage beside', ['pump', 'clean', 'refill'].every(t => d.rings[t] && d.rings[t].w === 40 && d.rings[t].color === COLOUR[t] && d.rings[t].pathStroke === COLOUR[t] && d.rings[t].pathFill === 'none' && /drop-shadow/.test(d.rings[t].glow)) && d.rings.pump.html.includes(NOZZLE) && d.rings.clean.html.includes(ROLL) && d.rings.refill.html.includes(DROPHD) && d.rings.refill.html.includes(BADGE) && d.pct.pump === '0%' && d.pct.clean === '0%' && d.pct.refill === '0%' && /Pump out\s*1 of 251/.test(d.jobsText[0]), {rings: Object.fromEntries(Object.entries(d.rings).map(([k, v]) => [k, Object.assign({}, v, {html: v.html.slice(0, 60)})])), pct: d.pct, jobsText: d.jobsText});
  check('panel: the area chips carry the small set (12 px tank, spray bottle, drop) in the job colours', ['pump', 'clean', 'refill'].every(t => d.chips[t] && d.chips[t].w === 12 && d.chips[t].pathStroke === CHIP[t]) && d.chips.pump.html.includes(TANKLD) && d.chips.refill.html.includes(DROPLD) && d.nChips === 45, {chips: Object.fromEntries(Object.entries(d.chips).map(([k, v]) => [k, Object.assign({}, v, {html: v.html.slice(0, 60)})])), nChips: d.nChips});
  // the crew card template, published the way the admin fold publishes it, rendered in a second tab
  const card = await p.evaluate(() => { const data = JSON.parse(JSON.stringify(SVC1067_CARD.data)); data.contact = {name: 'Test contact', phone: '0400 000 000'}; return SvcTrackerAdmin1067.cardHtml(SVC1067_CARD.html, data, true); });
  check('card template carries both icon sets, ringIcon, the button rule after the tick-box rules, one script', card.includes('var JOB_ICON_HD') && card.includes('function ringIcon') && card.includes(NOZZLE) && card.includes(ROLL) && card.includes(BADGE) && card.includes(TANKLD) && card.includes(DROPLD) && !card.includes('M3 11h10a3 3 0 0 1 3 3v4H3z') && card.indexOf('.job svg path{stroke-dasharray:40') < card.indexOf('.job .jtxt b svg{stroke:currentColor') && (card.match(/<script/g) || []).length === 1, {len: card.length});
  const c = await p.context().newPage();
  await c.route('**/*', r => { if (r.request().method() !== 'GET') return r.abort(); return r.fulfill({status: 404, body: ''}); });
  await c.setContent(card, {waitUntil: 'domcontentloaded'});
  await c.waitForTimeout(2500);
  /* the card script keeps TICK, JOB_ICON and TASKS in its own scope: take them from the template's source */
  const tickSvg = (card.match(/var TICK = '(<svg[\s\S]*?<\/svg>)'/) || [])[1];
  const ldOf = t => (card.match(new RegExp('  ' + t + ": '(<svg viewBox=\"0 0 24 24\"[\\s\\S]*?<\\/svg>)'")) || [])[1];
  const LDI = {pump: ldOf('pump'), clean: ldOf('clean'), refill: ldOf('refill'), lockup: ldOf('lockup')};
  const LABELS = {pump: 'Pump out', clean: 'Clean & restock', refill: 'Water checked / refilled', lockup: 'Pump out, clean & lock'};
  check('the template source yields the tick and the four small icons for the button check', !!tickSvg && Object.values(LDI).every(Boolean), {tick: (tickSvg || '').slice(0, 40), ld: Object.fromEntries(Object.entries(LDI).map(([k, v]) => [k, (v || '').slice(0, 30)]))});
  const cd = await c.evaluate(([lookSrc, TICK, JOB_ICON, TASKS]) => {
   const look = eval(lookSrc);
   const r = {j3: {}, cell: {}, chip: {}, j3Text: [...document.querySelectorAll('#bars .jobs3 .j3')].map(j => j.textContent.replace(/\s+/g, ' ').trim()), nChips: document.querySelectorAll('.ahead .jchips').length};
   for (const t of ['pump', 'clean', 'refill']) {
    const j = document.querySelector('#bars .j3.' + t); r.j3[t] = j ? Object.assign(look(j.querySelector('.ring .ic svg')), {pct: j.querySelector('.j3p').textContent, pctColor: getComputedStyle(j.querySelector('.j3p')).color, ring: Math.round(j.querySelector('.ring').getBoundingClientRect().width), ringB: j.querySelectorAll('.ring b').length}) : null;
    const cell = document.querySelector('#compact .ccell.' + t); r.cell[t] = cell ? Object.assign(look(cell.querySelector('.ring .ic svg')), {pct: cell.querySelector('.ctxt .pct').textContent, n: cell.querySelector('.ctxt .n').textContent}) : null;
    r.chip[t] = look(document.querySelector('.ahead .jchip.' + t + ' svg'));
   }
   const cp = document.getElementById('compact'), cells = [...document.querySelectorAll('#compact .ccell')], last = cells[cells.length - 1];
   r.fits = !!cp && cp.scrollWidth <= cp.clientWidth + 1 && (!last || last.getBoundingClientRect().right <= window.innerWidth); r.vw = window.innerWidth; r.lastRight = last ? Math.round(last.getBoundingClientRect().right) : null;
   // the job buttons, built from the card's own pieces
   const host = document.createElement('div'); host.className = 'jobs'; document.body.appendChild(host);
   const mk = (task, state) => `<button class="job t-${task}${state ? ' ' + state : ''}" type="button"><span class="jbox">${TICK}</span><span class="jtxt"><b>${JOB_ICON[task]}${TASKS[task] || task}</b><small>Tap to complete</small></span></button>`;
   host.innerHTML = ['pump', 'clean', 'refill', 'lockup'].map(t => mk(t)).join('') + mk('refill', 'done') + mk('clean', 'pending');
   const lookBtn = (btn) => { const svg = btn.querySelector('.jtxt b svg'), q = svg.querySelector('path'), tick = btn.querySelector('.jbox svg path'); const cs = getComputedStyle(svg), ps = getComputedStyle(q), ts = getComputedStyle(tick); return {cls: btn.className, stroke: cs.stroke, sw: cs.strokeWidth, fill: cs.fill, w: Math.round(svg.getBoundingClientRect().width), dash: ps.strokeDasharray, off: ps.strokeDashoffset, anim: ps.animationName, tickDash: ts.strokeDasharray, tickOff: ts.strokeDashoffset, tickStroke: getComputedStyle(btn.querySelector('.jbox svg')).stroke}; };
   r.btns = [...host.querySelectorAll('button')].map(lookBtn); host.remove();
   return r;
  }, [lookSrc, tickSvg, LDI, LABELS]);
  check('crew card job cards: the detailed icon glows inside each 66 px ring at 42 px in the job colour, the percentage big beside it, name then count', ['pump', 'clean', 'refill'].every(t => cd.j3[t] && cd.j3[t].w === 42 && cd.j3[t].ring === 66 && cd.j3[t].color === COLOUR[t] && cd.j3[t].pathStroke === COLOUR[t] && cd.j3[t].pathFill === 'none' && /drop-shadow/.test(cd.j3[t].glow) && cd.j3[t].pct === '0%' && cd.j3[t].ringB === 0) && /Pump out\s*0 of 251/.test(cd.j3Text[0]) && /Water checked \/ refilled\s*0 of 242/.test(cd.j3Text[2]), {j3: cd.j3, j3Text: cd.j3Text});
  check('crew card header: three rings with the icon inside at 26 px, the percentage and the to-go count beside, fitting the screen', ['pump', 'clean', 'refill'].every(t => cd.cell[t] && cd.cell[t].w === 26 && cd.cell[t].pathStroke === COLOUR[t] && cd.cell[t].pct === '0%' && /^\d+$/.test(cd.cell[t].n)) && cd.fits, {cell: cd.cell, fits: cd.fits, vw: cd.vw, lastRight: cd.lastRight});
  check('crew card area chips carry the small set at 12 px in the job colours on every area', ['pump', 'clean', 'refill'].every(t => cd.chip[t] && cd.chip[t].w === 12 && cd.chip[t].pathStroke === COLOUR[t]) && cd.nChips >= 15, {chip: cd.chip, nChips: cd.nChips});
  const plain = cd.btns.slice(0, 4), done = cd.btns[4], pending = cd.btns[5];
  check('each job button draws its label icon: stroke in the job colour, width 2.2, no fill, 15 px, no dash, no animation; the tick box keeps its 40 dash and transparent stroke until done', plain.every((b, i) => b.stroke === COLOUR[['pump', 'clean', 'refill', 'lockup'][i]] && /^2\.2/.test(b.sw) && b.fill === 'none' && b.w === 15 && b.dash === 'none' && b.off === '0px' && b.anim === 'none' && /40/.test(b.tickDash) && /40/.test(b.tickOff) && b.tickStroke === 'rgba(0, 0, 0, 0)'), plain);
  check('a done button draws its icon in the done green and its tick box in the done ink; a pending one keeps its icon stroke', done.stroke === DONE && done.dash === 'none' && done.tickStroke !== 'rgba(0, 0, 0, 0)' && pending.stroke === COLOUR.clean && pending.dash === 'none', {done, pending});
  await c.screenshot({path: path.join(out, 'card_neon_' + (MOB ? 'phone' : 'desktop') + '.png'), fullPage: false}).catch(() => {});
  await c.close();
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, (live ? 'live_' : '') + (MOB ? 'phone_' : 'desktop_') + 'test_v1125.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
