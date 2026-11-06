/* Author: Andrew Fisher. v11.26 checks: the card registers its ring property so rings sweep; rings with work left breathe and
   a full ring keeps its pulse; a ring or number that changed since the last draw flashes and the change shows for a moment
   under the header; the "Not done yet" card lists every reference with the jobs it is missing, by area, and reads "Missed"
   on a closed day and "Not yet open" on a day to come; the still-to-go chips carry missing-job icons; the panel's rings
   sweep and breathe on their own property and the page registers nothing else. GET only; the record is compared.
     PAGE=build/GC500_v11.26/GC500_Delivery_Control_hosted.html node tests/test_v1126.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 700))); };
const EVENTS = (day) => [
 {id: 'e1', line: 'PG01-FWF', task: 'pump', day, done: true, tapped_at: day + 'T11:58:00.000Z', at: day + 'T11:58:01.000Z'},
];
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#today', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#today', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(1500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.26'));
  // the page: only --sp registered, the panel rings sweep and breathe
  const d = await p.evaluate((events) => {
   const props = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch (e) { return []; } }).filter(r => r.constructor.name === 'CSSPropertyRule').map(r => r.name);
   const D = SVC1067_DATA, day = '2026-10-23';
   const M = {S: SvcState, D, events, now: Date.parse(day + 'T13:00:00Z'), day, open: {}, lastRead: Date.now(), readStatus: 'test render'};
   const host = document.createElement('div'); host.innerHTML = SvcPanel.svcPanelHtml(M); document.body.appendChild(host);
   const ring = host.querySelector('.svc1123-job.pump .svc1123-ring'), ic = ring.querySelector('.ic');
   const r = {props, sp: ring.style.getPropertyValue('--sp'), p: ring.style.getPropertyValue('--p'), computedSp: getComputedStyle(ring).getPropertyValue('--sp').trim(), transition: getComputedStyle(ring).transitionProperty, anim: getComputedStyle(ic).animationName};
   host.remove(); return r;
  }, EVENTS('2026-10-23'));
  check('page: registers only --sp (its own --p stays a length elsewhere); the panel ring carries --sp with a transition and its icon breathes', d.props.length === 1 && d.props[0] === '--sp' && d.sp !== '' && d.p === '' && /--sp/.test(d.transition) && d.anim === 'svc1126-breathe', d);
  // the crew card template, published the way the admin fold publishes it, rendered in a second tab
  const card = await p.evaluate(() => { const data = JSON.parse(JSON.stringify(SVC1067_CARD.data)); data.contact = {name: 'Test contact', phone: '0400 000 000'}; return SvcTrackerAdmin1067.cardHtml(SVC1067_CARD.html, data, true); });
  check('card template carries the registered property, the breathing and flash rules, the not-done card, the live effects after each draw', card.includes("@property --p{syntax:'<number>'") && card.includes('svc-halo') && card.includes('svc-breathe') && card.includes('function notDoneHtml') && card.includes('  liveFx1126(os);\n  padForHeader();') && card.includes('window.SvcLive1126') && (card.match(/<script/g) || []).length === 1, {len: card.length});
  const c = await p.context().newPage();
  await c.route('**/*', r => { if (r.request().method() !== 'GET') return r.abort(); return r.fulfill({status: 404, body: ''}); });
  await c.setContent(card, {waitUntil: 'domcontentloaded'});
  await c.waitForTimeout(2500);
  const cd = await c.evaluate(() => {
   const props = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch (e) { return []; } }).filter(r => r.constructor.name === 'CSSPropertyRule').map(r => r.name);
   const j3 = document.querySelector('#bars .j3.pump .ring'), hd = document.querySelector('#compact .ccell.pump .ring'), area = document.querySelector('.area .apct .ring'), prog = document.querySelector('#bars .ring[data-k^="prog:"]');
   const nd = document.querySelector('.notdone');
   const r = {props, keyed: document.querySelectorAll('.ring[data-k]').length, j3k: j3 && j3.getAttribute('data-k'), hdk: hd && hd.getAttribute('data-k'), areak: area && area.getAttribute('data-k'), progk: prog && prog.getAttribute('data-k'),
    halo: j3 && getComputedStyle(j3, '::after').animationName, breathe: j3 && getComputedStyle(j3.querySelector('.ic')).animationName, transition: j3 && getComputedStyle(j3).transitionProperty,
    sizes: [j3 && getComputedStyle(j3.querySelector('.ic svg')).width, hd && getComputedStyle(hd.querySelector('.ic svg')).width, j3 && getComputedStyle(j3).width],
    nd: nd ? {cls: nd.className, h3: nd.querySelector('h3').textContent, sum: nd.querySelector('.nd-sum') ? nd.querySelector('.nd-sum').textContent.replace(/\s+/g, ' ').trim() : '', jobs: [...nd.querySelectorAll('.nd-job')].map(j => j.className.replace('nd-job ', '') + ':' + j.querySelector('b').textContent), areas: nd.querySelectorAll('.nd-area').length, refs: nd.querySelectorAll('.nd-ref').length, refsWithIcons: [...nd.querySelectorAll('.nd-ref')].filter(x => x.querySelectorAll('.nd-i i svg').length >= 1).length, first: nd.querySelector('.nd-ref') ? nd.querySelector('.nd-ref').textContent.trim() : '', firstIcons: nd.querySelector('.nd-ref') ? [...nd.querySelector('.nd-ref').querySelectorAll('.nd-i i')].map(i => i.className) : [], beforeAudit: !!(nd.nextElementSibling && nd.nextElementSibling.classList.contains('audit'))} : null};
   return r;
  });
  check('crew card: registers --p; every job, header, area and progress ring is keyed; a ring with work left breathes with a pulsing halo and carries the sweep transition; the icon sizes are the v11.25 ones by their CSS width (42 / 26 px in a 66 px ring)', cd.props.length === 1 && cd.props[0] === '--p' && cd.keyed >= 11 && cd.j3k === 'j3:all:pump' && cd.hdk === 'hd:pump' && /^area:/.test(cd.areak || '') && cd.progk === 'prog:all' && cd.halo === 'svc-halo' && cd.breathe === 'svc-breathe' && /--p/.test(cd.transition || '') && JSON.stringify(cd.sizes) === JSON.stringify(['42px', '26px', '66px']), cd);
  check('crew card: the Not done yet card sits before the audit, names the shown day, counts 75 of 75 references and 752 jobs by kind with icons, lists 15 areas and 75 references each carrying the icons of its missing jobs', !!cd.nd && /^Not done yet · /.test(cd.nd.h3) && /75 of 75 references/.test(cd.nd.sum) && /752 jobs to go/.test(cd.nd.sum) && JSON.stringify(cd.nd.jobs) === JSON.stringify(['pump:251', 'clean:259', 'refill:242']) && cd.nd.areas === 15 && cd.nd.refs === 75 && cd.nd.refsWithIcons === 75 && cd.nd.firstIcons.join() === 'pump,clean,refill' && cd.nd.beforeAudit, cd.nd);
  const days = await c.evaluate(() => { const g = (id) => { const t = document.createElement('div'); t.innerHTML = window.SvcLive1126.notDone(id); return {h3: t.querySelector('h3').textContent, cls: t.querySelector('.notdone').className, refs: t.querySelectorAll('.nd-ref').length}; }; return {wed: g('2026-10-21'), fri: g('2026-10-23'), sun: g('2026-10-25')}; });
  check('a closed day reads Missed in red with its references; a day to come reads Not yet open', /^Missed · /.test(days.wed.h3) && /missed/.test(days.wed.cls) && days.wed.refs === 75 && /^Not yet open · /.test(days.fri.h3) && !/missed/.test(days.fri.cls), days);
  // a change since the last draw: the ring sweeps from the old value and flashes, the number bumps, the change shows for a moment
  const fx = await c.evaluate(async () => {
   const ring = document.querySelector('#bars .j3.pump .ring'), num = document.querySelector('#bars .j3.pump .j3p');
   window.SvcLive1126.fx();                       /* records the values as drawn */
   ring.style.setProperty('--p', '40'); num.textContent = '40%';
   window.SvcLive1126.fx();                       /* sees the change */
   const t0 = parseFloat(getComputedStyle(ring).getPropertyValue('--p'));
   const moved = ring.classList.contains('moved'), bump = num.classList.contains('bump'), haloNow = getComputedStyle(ring, '::after').animationName;
   await new Promise(r => setTimeout(r, 900));
   const t1 = parseFloat(getComputedStyle(ring).getPropertyValue('--p'));
   window.SvcLive1126.toast('+3 jobs done · 255 of 752 · 33%');
   const el = document.getElementById('livefx'); const shown = el && el.classList.contains('show') && el.textContent;
   await new Promise(r => setTimeout(r, 4400));
   return {t0, t1, moved, bump, haloNow, shown, hidden: !el.classList.contains('show'), inHeader: !!el.closest('header')};
  });
  check('a changed ring sweeps from its old value (mid-sweep below 40, then 40) and flashes; the number bumps; the change pill shows under the header for four seconds then hides', fx.t0 < 40 && fx.t1 === 40 && fx.moved && fx.bump && /svc-flash/.test(fx.haloNow) && fx.shown === '+3 jobs done · 255 of 752 · 33%' && fx.hidden && fx.inHeader, fx);
  await c.screenshot({path: path.join(out, 'card_live_' + (MOB ? 'phone' : 'desktop') + '.png'), fullPage: false}).catch(() => {});
  await c.close();
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, (live ? 'live_' : '') + (MOB ? 'phone_' : 'desktop_') + 'test_v1126.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
