/* Author: Andrew Fisher. v11.48 checks: the Event nights and Change deliveries pages are set aside - off the tab strip and
   the More menu, a link to either lands on Today and says so, the Build day cards no longer offer "Edit · Change
   deliveries", the Servicing tab still carries the tracker panel and the Edit pane keeps its other controls. GET only; the
   record is compared.
     PAGE=build/GC500_v11.48/GC500_Delivery_Control_hosted.html node tests/test_v1148.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 900))); };
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#today', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#today', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(1500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.48'));
  const off = await p.evaluate(() => ({nights: TABS_OFF.has('nights'), change: TABS_OFF.has('change'), still: ['register', 'journal', 'add', 'breakdowns', 'variances', 'edit', 'progress'].every(k => TABS_OFF.has(k)), inTabs: TABS.some(([k]) => k === 'nights') && TABS.some(([k]) => k === 'change')}));
  check('Event nights and Change deliveries are in the set-aside set; the earlier set-asides stay; both panes keep their names in TABS so taking them out of the set restores them', off.nights && off.change && off.still && off.inTabs, off);
  const strip = await p.evaluate(() => { const names = [...document.querySelectorAll('nav button, .tabs button, [data-goto], #mmViews button')].map(b => (b.dataset.goto || '') + '|' + b.textContent.trim()); return {n: names.length, nights: names.filter(x => /^nights\||Event nights/.test(x)), change: names.filter(x => /^change\||Change deliveries/.test(x)), servicing: names.some(x => /^servicing\||Servicing/.test(x)), vms: names.some(x => /^vms\||VMS boards/.test(x))}; });
  check('no Event nights or Change deliveries button anywhere in the navigation; Servicing and VMS boards still offered', strip.nights.length === 0 && strip.change.length === 0 && strip.servicing && strip.vms, strip);
  const flashed = [];
  const land = async (tab) => p.evaluate(async (t) => { const seen = []; const obs = new MutationObserver(() => { const f = document.querySelector('.flash, #flash, [role=status]'); if (f && f.textContent) seen.push(f.textContent.trim()); }); obs.observe(document.body, {childList: true, subtree: true, characterData: true}); go(t); await new Promise(r => setTimeout(r, 900)); obs.disconnect(); return {tab: state.tab, hash: location.hash, said: seen.filter(Boolean).slice(-2), bodyHas: document.body.innerText.includes('page has been set aside')}; }, tab);
  const n = await land('nights'); flashed.push(n);
  check('a link to Event nights lands on Today and says the page has been set aside', n.tab === 'today' && (n.bodyHas || n.said.some(s => /Event nights page has been set aside/.test(s))), n);
  const c = await land('change'); flashed.push(c);
  check('a link to Change deliveries lands on Today and says the page has been set aside', c.tab === 'today' && (c.bodyHas || c.said.some(s => /Change deliveries page has been set aside/.test(s))), c);
  const pr = await p.evaluate(async () => { location.hash = '#print/nights/2026-10-23'; await new Promise(r => setTimeout(r, 1200)); return {tab: state.tab, hash: location.hash}; });
  check('the Event nights print link lands on Today too', pr.tab === 'today', pr);
  await p.evaluate(() => go('timeline')); await p.waitForTimeout(3500);
  const build = await p.evaluate(() => { const pane = document.getElementById('pane-timeline'); const btns = [...pane.querySelectorAll('button')]; return {cards: pane.querySelectorAll('.dplate, .daycard, [class*=dcard]').length, chg: btns.filter(b => /Change deliveries/i.test(b.textContent)).length, edit: btns.filter(b => b.classList.contains('dpt-edit')).length, txt: pane.innerText.length}; });
  check('the Build tab draws its day cards with no "Edit · Change deliveries" button', build.txt > 500 && build.chg === 0 && build.edit === 0, build);
  await p.evaluate(() => go('servicing')); await p.waitForTimeout(3000);
  const svc = await p.evaluate(() => ({tab: state.tab, head: !!document.querySelector('#pane-servicing .panehead'), txt: document.getElementById('pane-servicing').innerText.length, admin: typeof SvcTrackerAdmin1067 === 'object' && typeof SvcTrackerAdmin1067.mount === 'function', hostCode: typeof SVC1067_CARD === 'object' && typeof SVC1067_CARD.html === 'string'}));
  check('the Servicing tab still opens with its heading and carries the tracker panel and publish code (the fold itself shows on an editing link only)', svc.tab === 'servicing' && svc.head && svc.txt > 100 && svc.admin && svc.hostCode, svc);
  await p.evaluate(() => go('vmsoff')); await p.waitForTimeout(2500);
  const vo = await p.evaluate(() => ({tab: state.tab, head: document.querySelectorAll('#pane-vmsoff .v1132-head').length}));
  check('VMS removals, next to the set-aside Event nights in the list, still opens', vo.tab === 'vmsoff' && vo.head === 1, vo);
  await p.screenshot({path: path.join(out, (live ? 'live_' : '') + (MOB ? 'phone_' : 'desktop_') + 'nav_v1148.png'), fullPage: false});
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, (live ? 'live_' : '') + (MOB ? 'phone_' : 'desktop_') + 'test_v1148.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
