/* Author: Andrew Fisher. v12.30 - the servicing night report for one night, made by the page's own Night report button from the live
   tracker read, as a PDF. READ ONLY: the build is served at the edit link's address (the tracker is read on the edit link only),
   every other request is a GET to the live service, every non-GET is aborted and the page's sender is held so it never tries to
   write. The key is never printed, logged or stored. The PDF holds crew names: it goes to OUT, outside the repository.
     PAGE=<build> OUT=<private dir> [DAY=2026-10-25] node make_report_live.cjs */
'use strict';
const fs = require('fs'), path = require('path');
const {chromium} = require('playwright');
const HOST = 'https://gc500-production.up.railway.app', token = process.env.GC500_EDIT_TOKEN || '', OUT = process.env.OUT, DAY = process.env.DAY || '2026-10-25';
const redact = s => token ? String(s).split(token).join('[key]') : String(s);
(async () => {
  if (!token || !OUT || !process.env.PAGE) throw new Error('needs GC500_EDIT_TOKEN, PAGE and OUT');
  fs.mkdirSync(OUT, {recursive: true});
  const html = fs.readFileSync(process.env.PAGE);
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox', '--lang=en-AU']});
  const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, locale: 'en-AU', timezoneId: 'Australia/Brisbane'});
  const page = await ctx.newPage(); const counts = {blocked: 0, get: 0, page: 0}, errors = []; let held = false;
  page.on('pageerror', e => errors.push(redact(e.message).slice(0, 200)));
  await ctx.route('**/*', async route => { const r = route.request(), u = r.url(), m = r.method();
    if (u.startsWith('data:') || u.startsWith('blob:') || u === 'about:blank') return route.continue();
    if (m !== 'GET') { counts.blocked++; return route.abort(); }
    if (u.split('#')[0].split('?')[0] === HOST + '/e/' + token) { counts.page++; return route.fulfill({status: 200, headers: {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'}, body: html}); }
    if (!held && u.startsWith(HOST + '/api/state')) { held = true; try { await page.evaluate(() => { if (typeof syncSend === 'function' && !window.__heldSend) { window.__heldSend = syncSend; syncSend = function () { clearTimeout(SYNC.timer); SYNC.timer = null; syncStage(); }; } }); } catch (e) {} }
    counts.get++; return route.continue(); });
  await page.goto(HOST + '/e/' + token + '#servicing', {waitUntil: 'load', timeout: 180000});
  await page.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live', null, {timeout: 180000});
  await page.evaluate(() => { try { go('servicing'); } catch (e) {} });
  await page.waitForFunction(() => typeof svcNight1202 === 'function' && svcNight1202() && (svcNight1202().events || []).length > 0, null, {timeout: 120000});
  await page.waitForFunction(() => document.querySelector('[data-svc1202-open]'), null, {timeout: 60000});
  await page.waitForTimeout(1500);
  const cap = await page.evaluate(() => { report1202.label(); return (document.querySelector('[data-svc1202-cap]') || {}).textContent || ''; });
  const want = await page.evaluate(day => { const snap = svcNight1202(); const R = report1202.model({D: snap.D, S: SvcState, C: SvcCrews1173, crewData: SVC1067_CARD.data, events: snap.events, now: snap.now, read: snap.read, day, meta: snap.meta});
    const W = R.who1230; return {day: R.day.id, label: R.day.label, final: R.day.final, pct: R.pct, band: R.band.word, locations: W.locations, ready: W.ready, units: W.units, readyUnits: W.readyUnits, days: W.days, proposed: W.proposed, supplier: W.supplier,
      notReady: W.groups.flatMap(g => g.refs.filter(r => !r.ready).map(r => r.ref + ' (' + r.missing.join(', ') + ')')), noPickup: W.groups.flatMap(g => g.refs.filter(r => !r.pickup || (!r.pickup.stops.length && !r.pickup.iso)).map(r => r.ref)),
      unnamedLocks: W.groups.flatMap(g => g.refs.filter(r => r.jobs.lockup && (r.jobs.lockup.unnamed || r.jobs.lockup.by.indexOf('no name given') >= 0)).map(r => r.ref)), groups: W.groups.length}; }, DAY);
  console.log(redact('button: ' + cap));
  if (!new RegExp(want.label.split(' ')[0]).test(cap)) console.log('note: the button would give another night; the report is made for ' + DAY + ' directly');
  /* the page's own Night report window: the button when it gives this night, otherwise the same window made for the night asked */
  let popup;
  if (cap.includes(want.label)) [popup] = await Promise.all([ctx.waitForEvent('page'), page.click('[data-svc1202-open]')]);
  else [popup] = await Promise.all([ctx.waitForEvent('page'), page.evaluate(day => { const snap = svcNight1202(); const R = report1202.model({D: snap.D, S: SvcState, C: SvcCrews1173, crewData: SVC1067_CARD.data, events: snap.events, now: snap.now, read: snap.read, day, meta: snap.meta});
    const f = document.getElementById('fonts1066'); const w = window.open('', '_blank'); w.document.open(); w.document.write(report1202.html(R, {author: DATA.brand.author || '', fontCss: f ? f.textContent : ''})); w.document.close(); }, DAY)]);
  await popup.waitForLoadState('load');
  await popup.waitForFunction(() => window.__pg1202, null, {timeout: 30000}).catch(() => {});
  await popup.evaluate(() => window.__pg1202).catch(() => {});
  await popup.waitForTimeout(1200);
  const info = await popup.evaluate(() => ({title: document.title, pages: document.documentElement.getAttribute('data-pages'), rows: document.querySelectorAll('.wt1230 tbody tr').length, ready: document.querySelectorAll('.wt1230 .rp:not(.no)').length, notReady: document.querySelectorAll('.wt1230 .rp.no').length, banner: (document.querySelector('.rb1230') || {}).innerText || ''}));
  const name = 'GC500_Servicing_Report_' + DAY + '_portaloos_ready_for_pickup.pdf';
  await popup.pdf({path: path.join(OUT, name), format: 'A4', printBackground: true, preferCSSPageSize: true});
  const sheets = await popup.$$('.sheet');
  for (let i = 0; i < sheets.length; i++) await sheets[i].screenshot({path: path.join(OUT, 'page_' + (i + 1) + '.png')});
  fs.writeFileSync(path.join(OUT, 'report_summary.json'), redact(JSON.stringify({want, info, counts, errors}, null, 1)), {mode: 0o600});
  console.log(redact(JSON.stringify({file: name, info: Object.assign({}, info, {banner: info.banner.replace(/\s+/g, ' ').slice(0, 160)}), locations: want.locations, ready: want.ready, notReady: want.notReady, noPickup: want.noPickup.length, unnamedLocks: want.unnamedLocks.length, days: want.days.length, proposed: want.proposed, blocked: counts.blocked, errors: errors.length})));
  await browser.close();
})().catch(e => { console.error(redact('ERR ' + (e && e.message || e)).slice(0, 400)); process.exit(1); });
