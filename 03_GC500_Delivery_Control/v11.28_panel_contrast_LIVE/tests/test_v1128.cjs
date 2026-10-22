/* Author: Andrew Fisher. v11.28 checks: the servicing panel's reference tables, rendered from the page's own module inside the
   panel's own element so every skin applies, are one dark surface with bright text: rows and cells on the skin's dark,
   reference names white, unit lines light grey, "not yet" bold amber on a dark amber tint, a dash quiet grey, a done time
   bright green, a done row on the dark green; the v11.28 style is the last style on the page; the crew card template is
   unchanged in substance. GET only; the record is compared.
     PAGE=build/GC500_v11.28/GC500_Delivery_Control_hosted.html node tests/test_v1128.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 800))); };
/* PG01's FWF fully done (pump, clean, water) so one row is a done row; PG03's FWF pumped only */
const EVENTS = (day) => [
 {id: 'e1', line: 'PG01-FWF', task: 'pump', day, done: true, tapped_at: day + 'T11:58:00.000Z', at: day + 'T11:58:01.000Z'},
 {id: 'e2', line: 'PG01-FWF', task: 'clean', day, done: true, tapped_at: day + 'T12:00:00.000Z', at: day + 'T12:00:01.000Z'},
 {id: 'e3', line: 'PG01-FWF', task: 'refill', day, done: true, tapped_at: day + 'T12:02:00.000Z', at: day + 'T12:02:01.000Z'},
 {id: 'e4', line: 'PG03-FWF', task: 'pump', day, done: true, tapped_at: day + 'T12:03:00.000Z', at: day + 'T12:03:01.000Z'},
];
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#servicing', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#servicing', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(1500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.28'));
  check('the v11.28 style is the last style block on the page, after every skin', await p.evaluate(() => { const st = [...document.querySelectorAll('style[id]')]; return st.length > 0 && st[st.length - 1].id === 'svc1128-style' && !!document.getElementById('svc1112-glow'); }));
  const d = await p.evaluate((events) => {
   const D = SVC1067_DATA, day = '2026-10-23';
   const M = {S: SvcState, D, events, now: Date.parse(day + 'T13:00:00Z'), day, open: {1: true}, lastRead: Date.now(), readStatus: 'test render'};
   let host = document.getElementById('svc1067'), made = false;
   if (!host) { host = document.createElement('div'); host.id = 'svc1067'; (document.getElementById('svc1067-host') || document.body).appendChild(host); made = true; }
   const box = document.createElement('div'); box.innerHTML = SvcPanel.svcPanelHtml(M); host.appendChild(box);
   const det = box.querySelector('details.svc-area'); if (det) det.open = true;
   const tbl = box.querySelector('.svc-tbl'); const cs = (el) => el ? getComputedStyle(el) : null;
   const rows = [...tbl.querySelectorAll('tbody tr')];
   const doneRow = rows.find(r => r.classList.contains('done')), plainRow = rows.find(r => !r.classList.contains('done'));
   const th = plainRow.querySelector('th'), b = th.querySelector('b'), span = th.querySelector('span'), head = tbl.querySelector('thead th');
   const no = tbl.querySelector('td.no'), na = tbl.querySelector('td.na'), ok = tbl.querySelector('td.ok');
   const r = {rowBg: cs(plainRow).backgroundColor, thBg: cs(th).backgroundColor, tdBg: no ? cs(no.parentElement.querySelector('td:not(.no)') || no).backgroundColor : null, tblBg: cs(tbl).backgroundColor,
    th: cs(th).color, b: b ? cs(b).color : null, span: span ? cs(span).color : null, head: {color: cs(head).color, bg: cs(head).backgroundColor},
    no: no ? {color: cs(no).color, bg: cs(no).backgroundColor, weight: cs(no).fontWeight, text: no.textContent} : null, na: na ? {color: cs(na).color, text: na.textContent.slice(0, 1)} : null, ok: ok ? {color: cs(ok).color, text: ok.textContent} : null,
    done: doneRow ? {bg: cs(doneRow).backgroundColor, thBg: cs(doneRow.querySelector('th')).backgroundColor, ref: doneRow.querySelector('th b') && doneRow.querySelector('th b').textContent, fin: doneRow.querySelector('em.fin') ? cs(doneRow.querySelector('em.fin')).color : null} : null, rows: rows.length};
   box.remove(); if (made) host.remove(); return r;
  }, EVENTS('2026-10-23'));
  const DARK = 'rgb(22, 27, 30)';
  check('panel table: the table, its rows and cells are one dark surface; the heading row the skin\'s navy', d.tblBg === DARK && d.rowBg === DARK && d.thBg === DARK && d.tdBg === DARK && d.head.bg === 'rgb(32, 60, 72)' && d.head.color === 'rgb(246, 252, 255)', d);
  check('panel table: reference names white, unit lines light grey on the dark', d.th === 'rgb(230, 241, 246)' && d.b === 'rgb(255, 255, 255)' && d.span === 'rgb(201, 218, 227)', d);
  check('panel table: "not yet" is bold amber on a dark amber tint; a dash is quiet grey; a done time is bright green', !!d.no && d.no.text === 'not yet' && d.no.color === 'rgb(255, 201, 122)' && d.no.bg === 'rgb(46, 36, 16)' && d.no.weight === '800' && !!d.na && d.na.color === 'rgb(142, 163, 176)' && !!d.ok && d.ok.color === 'rgb(140, 245, 192)' && /21:58|22:0\d/.test(d.ok.text), d);
  check('panel table: a done row (PG01) sits on the dark green with its done time in bright green', !!d.done && d.done.ref === 'PG01' && d.done.bg === 'rgb(19, 48, 42)' && d.done.thBg === 'rgb(19, 48, 42)' && d.done.fin === 'rgb(140, 245, 192)', d.done);
  const card = await p.evaluate(() => { const data = JSON.parse(JSON.stringify(SVC1067_CARD.data)); data.contact = {name: 'Test contact', phone: '0400 000 000'}; return SvcTrackerAdmin1067.cardHtml(SVC1067_CARD.html, data, true); });
  check('crew card template unchanged in substance: v11.27 status page present, no v11.28 style inside it', card.includes('window.SvcSaved1127') && !card.includes('svc1128-style') && (card.match(/<script/g) || []).length === 1, {len: card.length});
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, (live ? 'live_' : '') + (MOB ? 'phone_' : 'desktop_') + 'test_v1128.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
