/* Author: Andrew Fisher. v11.24 checks: the job icons are the tank, the spray bottle, the tap and the padlock, drawn as strokes
   in each job's colour, on the page's servicing panel and in the crew card template; the old tanker icon is gone; nothing
   else changed (test_v1123 is run on the same page as the regression). GET only; the record is compared before and after.
     PAGE=build/GC500_v11.24/GC500_Delivery_Control_hosted.html node tests/test_v1124.cjs
     MOB=1 PAGE=... node tests/test_v1124.cjs        LIVE=1 node tests/test_v1124.cjs */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 600))); };
const OLD_PUMP = 'M3 11h10a3 3 0 0 1 3 3v4H3z', TANK = 'M3 12.5h18V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z', SPRAY = 'M7 10.5h7.5l1.5 2.5v7a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20v-7z', TAP = 'M3 9.5h10a4 4 0 0 1 4 4V15', LOCK = 'M8 10.5V7.5a4 4 0 0 1 8 0v3';
const COLOUR = {pump: 'rgb(255, 179, 71)', clean: 'rgb(94, 242, 200)', refill: 'rgb(95, 180, 255)'};
const EVENTS = (day) => [
 {id: 'e1', line: 'PG01-FWF', task: 'pump', day, done: true, tapped_at: day + 'T11:58:00.000Z', at: day + 'T11:58:01.000Z'},
 {id: 'e2', line: 'PG01-FWF', task: 'clean', day, done: true, tapped_at: day + 'T12:00:00.000Z', at: day + 'T12:00:01.000Z'},
 {id: 'e3', line: 'PG01-FWF', task: 'refill', day, done: true, tapped_at: day + 'T12:02:00.000Z', at: day + 'T12:02:01.000Z'},
];
/* what an icon looks like once rendered: the svg's colour, and its first stroked path's stroke and fill */
const look = (svg) => { if (!svg) return null; const p = svg.querySelector('path, rect'); const cs = getComputedStyle(svg), ps = getComputedStyle(p); return {color: cs.color, fill: cs.fill, pathStroke: ps.stroke, pathFill: ps.fill, w: svg.getBoundingClientRect().width}; };
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#today', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#today', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(1500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.24'));
  const d = await p.evaluate(([events, k]) => {
   const D = SVC1067_DATA, day = D.days.find(d => d.id === '2026-10-23') ? '2026-10-23' : D.days[0].id;
   const M = {S: SvcState, D, events, now: Date.parse(day + 'T13:00:00Z'), day, open: {}, lastRead: Date.now(), readStatus: 'test render'};
   const host = document.createElement('div'); host.innerHTML = SvcPanel.svcPanelHtml(M); document.body.appendChild(host);
   const src = document.documentElement.outerHTML;
   const icons = {}; for (const t of ['pump', 'clean', 'refill']) { const svg = host.querySelector('.svc1123-job.' + t + ' svg'); icons[t] = svg ? svg.outerHTML : ''; }
   const chip = {}; for (const t of ['pump', 'clean', 'refill']) { const svg = host.querySelector('.svc1123-chip.' + t + ' svg'); const q = svg && svg.querySelector('path, rect'); chip[t] = svg ? {color: getComputedStyle(svg).color, pathStroke: getComputedStyle(q).stroke, pathFill: getComputedStyle(q).fill} : null; }
   const ring = {}; for (const t of ['pump', 'clean', 'refill']) { const svg = host.querySelector('.svc1123-job.' + t + ' svg'); ring[t] = svg ? getComputedStyle(svg).color : null; }
   const r = {oldOnPage: src.includes('M3 11h10a3 3 0 0 1 3 3v4H3z'), icons, chip, ring, chips: host.querySelectorAll('.svc1123-chip').length};
   host.remove(); return r;
  }, [EVENTS('2026-10-23'), 'JOB_ICON1123']);
  check('the old tanker icon is nowhere on the page', !d.oldOnPage);
  check('panel: the icons are the tank (pump out), the spray bottle (clean & restock) and the tap (water), stroked', d.icons.pump.includes(TANK) && d.icons.clean.includes(SPRAY) && d.icons.refill.includes(TAP) && [d.icons.pump, d.icons.clean, d.icons.refill].every(s => /stroke="currentColor"/.test(s) && /fill="none"/.test(s)), {pump: d.icons.pump.slice(0, 120)});
  const CHIP = Object.assign({}, COLOUR, {refill: 'rgb(143, 208, 255)'});   /* the panel's water chip is the lighter blue its text uses */
  check('panel: each chip icon is drawn in its job colour on the stroke (hi-vis, mint, blue), not filled; each ring icon too', ['pump', 'clean', 'refill'].every(t => d.chip[t] && d.chip[t].color === CHIP[t] && d.chip[t].pathStroke === CHIP[t] && d.chip[t].pathFill === 'none') && ['pump', 'clean', 'refill'].every(t => d.ring[t] === COLOUR[t]) && d.chips === 45, {chip: d.chip, ring: d.ring, chips: d.chips});
  // the crew card template, published the way the admin fold publishes it, rendered in a second tab
  const card = await p.evaluate(() => { const data = JSON.parse(JSON.stringify(SVC1067_CARD.data)); data.contact = {name: 'Test contact', phone: '0400 000 000'}; return SvcTrackerAdmin1067.cardHtml(SVC1067_CARD.html, data, true); });
  check('card template publishes with the four icons and no old one; its style colours the stroke, not a fill', card.includes(TANK) && card.includes(SPRAY) && card.includes(TAP) && card.includes(LOCK) && !card.includes(OLD_PUMP) && (card.match(/stroke="currentColor"/g) || []).length === 4 && !/svg\{fill:/.test(card) && /\.j3\.pump \.j3t svg\{color:#ffb347\}/.test(card) && /\.job\.t-refill \.jtxt b svg\{color:#5fb4ff\}/.test(card) && (card.match(/<script/g) || []).length === 1, {len: card.length});
  const c = await p.context().newPage();
  await c.route('**/*', r => { if (r.request().method() !== 'GET') return r.abort(); return r.fulfill({status: 404, body: ''}); });
  await c.setContent(card, {waitUntil: 'domcontentloaded'});
  await c.waitForTimeout(2500);
  const cd = await c.evaluate((lookSrc) => {
   const look = eval('(' + lookSrc + ')');
   const r = {chips: {}, cells: {}, rings: {}, nChips: document.querySelectorAll('.ahead .jchips').length, nRings: document.querySelectorAll('#bars .jobs3 .j3').length};
   for (const t of ['pump', 'clean', 'refill']) { r.chips[t] = look(document.querySelector('.ahead .jchip.' + t + ' svg')); r.cells[t] = look(document.querySelector('#compact .ccell.' + t + ' .ctxt svg')); r.rings[t] = look(document.querySelector('#bars .j3.' + t + ' .j3t svg')); }
   const cp = document.getElementById('compact'), cells = [...document.querySelectorAll('#compact .ccell')], last = cells[cells.length - 1];
   r.fits = !!cp && cp.scrollWidth <= cp.clientWidth + 1 && (!last || last.getBoundingClientRect().right <= window.innerWidth);
   return r;
  }, look.toString());
  const ok = (o, t, w) => o && o.color === COLOUR[t] && o.pathStroke === COLOUR[t] && o.pathFill === 'none' && o.w >= w - 0.5;
  check('crew card: area chips, header cells and big rings carry the icons in their job colours on the stroke (12 / 13 / 18 px)', ['pump', 'clean', 'refill'].every(t => ok(cd.chips[t], t, 12) && ok(cd.cells[t], t, 13) && ok(cd.rings[t], t, 18)) && cd.nChips >= 15 && cd.nRings === 3 && cd.fits, cd);
  await c.screenshot({path: path.join(out, 'card_icons_' + (MOB ? 'phone' : 'desktop') + '.png'), fullPage: false}).catch(() => {});
  await c.close();
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, (live ? 'live_' : '') + (MOB ? 'phone_' : 'desktop_') + 'test_v1124.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
