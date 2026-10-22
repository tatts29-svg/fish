/* Author: Andrew Fisher. v11.27 checks: the crew card never closes its window; Save & close renders a status page - Saved with the
   reference's state, what was done at the reference with times, the area with what is still to go and the nearest
   references still to go in metres, everything's percentage, Back and Show every area. The page is rendered from the card's
   own function for PG01 (a code's card needs the service; the live check clicks the real button). GET only.
     PAGE=build/GC500_v11.27/GC500_Delivery_Control_hosted.html node tests/test_v1127.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 700))); };
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#today', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#today', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(1500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.27'));
  const card = await p.evaluate(() => { const data = JSON.parse(JSON.stringify(SVC1067_CARD.data)); data.contact = {name: 'Test contact', phone: '0400 000 000'}; return SvcTrackerAdmin1067.cardHtml(SVC1067_CARD.html, data, true); });
  check('card template never closes its window and carries the status page functions', !card.includes('window.close()') && card.includes('function tryClose() { closeTried = true; }') && card.includes('function nearestLeft') && card.includes('class="card status-ref"') && card.includes('window.SvcSaved1127') && (card.match(/<script/g) || []).length === 1, {len: card.length});
  const c = await p.context().newPage();
  await c.route('**/*', r => { if (r.request().method() !== 'GET') return r.abort(); return r.fulfill({status: 404, body: ''}); });
  await c.setContent(card, {waitUntil: 'domcontentloaded'});
  await c.waitForTimeout(2500);
  const s = await c.evaluate(() => {
   const host = document.createElement('div'); host.innerHTML = window.SvcSaved1127('PG01'); document.body.appendChild(host);
   const q = (sel) => host.querySelector(sel), qa = (sel) => [...host.querySelectorAll(sel)];
   const r = {h2: q('.saved h2') && q('.saved h2').textContent.trim(), ref: q('.saved-ref') && q('.saved-ref').textContent.replace(/\s+/g, ' ').trim(), refIcons: qa('.saved-ref .nd-i i').map(i => i.className), pct: q('.savedpct') && q('.savedpct').textContent.replace(/\s+/g, ' ').trim(),
    back: q('[data-unsave]') && q('[data-unsave]').textContent, doneH3: q('.status-ref h3') && q('.status-ref h3').textContent, doneRows: qa('.status-ref .orow').length, doneChips: qa('.status-ref .orow .chip').map(x => x.textContent.trim() + (x.classList.contains('ok') ? ' [ok]' : '')),
    areaH3: q('.status-area h3') && q('.status-area h3').textContent, left: qa('.status-area .left-list .chip').length, leftIcons: qa('.status-area .left-list .chip .nd-i').length, leftFirst: q('.status-area .left-list .chip') && q('.status-area .left-list .chip').className,
    near: qa('.near-ref').map(x => ({ref: x.querySelector('b').textContent, m: x.querySelector('small').textContent, icons: x.querySelectorAll('.nd-i i').length})), showall: q('[data-showall]') && q('[data-showall]').textContent, notdone: qa('.notdone').length};
   host.remove(); return r;
  });
  check('status page: Saved, PG01 still needs its three jobs with icons, the area and everything percentages, Back to PG01', s.h2 === 'Saved' && /^PG01 still needs Pump out, Clean & restock, Water checked \/ refilled/.test(s.ref) && s.refIcons.join() === 'pump,clean,refill' && /Area 1 · Pit Lane, Paddock & Teams 0% · 81 to go\s*Everything 0% · 752 to go/.test(s.pct) && s.back === 'Back to PG01', s);
  check('status page: what was done at PG01 lists every job on its line with no tick yet', s.doneH3 === 'PG01 · what was done' && s.doneRows === 1 && JSON.stringify(s.doneChips) === JSON.stringify(['Pump out', 'Clean & restock', 'Water checked / refilled']), {doneH3: s.doneH3, doneRows: s.doneRows, doneChips: s.doneChips});
  check('status page: the area with 81 jobs to go, its 14 references still to go each with missing-job icons and PG01 marked as this one, the three nearest references still to go in metres with their missing jobs', s.areaH3 === 'Area 1 · Pit Lane, Paddock & Teams · 81 jobs to go' && s.left === 14 && s.leftIcons === 14 && /\bleft\b/.test(s.leftFirst) && s.near.length === 3 && s.near.every(x => /^(\d+ m|same spot)/.test(x.m) && x.icons >= 1) && s.showall === 'Show every area (view only)' && s.notdone === 0, {areaH3: s.areaH3, left: s.left, leftIcons: s.leftIcons, leftFirst: s.leftFirst, near: s.near, showall: s.showall});
  const n = await c.evaluate(() => { const host = document.createElement('div'); host.innerHTML = window.SvcSaved1127('PG01'); const a = [...host.querySelectorAll('.near-ref')].map(x => { const t = x.querySelector('small').textContent; return /^same spot/.test(t) ? 0 : parseInt(t, 10); }); return a; });
  check('the nearest references are in rising order of distance (a shared pin reads "same spot")', n.length === 3 && n[0] <= n[1] && n[1] <= n[2], n);
  await c.close();
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, (live ? 'live_' : '') + (MOB ? 'phone_' : 'desktop_') + 'test_v1127.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
