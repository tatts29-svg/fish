// Author: Andrew Fisher. v12.05 on the real Servicing tab, writing nothing. On the view link there is no Night report. On the edit
// link the "Night report" button opens a report whose every figure is the panel's own: the same tracker read, clock and night,
// through the one state rule; the percentage and each job match what the panel draws. The tracker is served from a saved snapshot
// of the event tracker (TICKS=...), so the test never calls the tracker service; every other write is aborted by the harness.
//   PAGE=build/GC500_v12.05/GC500_Delivery_Control_hosted.html TICKS=/path/ticks_snapshot.json [MOB=1] [EVIDENCE=dir] node tests/test_native1202.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {open} = require('../../toolchain/harness/open_page');
(async () => {
  const mobile = !!process.env.MOB, dir = process.env.EVIDENCE, tag = mobile ? 'phone' : 'desktop';
  const snap = JSON.parse(fs.readFileSync(process.env.TICKS, 'utf8')), TOKEN = 'test1202Token0000000001';
  const s = await open({pageFile: process.env.PAGE, mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1}), p = s.page;
  let checks = 0; const check = (v, msg) => { assert(v, msg); checks++; console.log('ok   ' + msg); };
  const popErrors = [];
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 120000});
    check(await p.evaluate(() => !!(window.report1202 && window.report1202.version === 'v12.05' && typeof window.svcNight1202 === 'function')), 'v12.05 loaded: the report and the panel hook are there');

    /* the view link: no report, nothing private */
    await p.evaluate(() => go('servicing')); await p.waitForTimeout(2500);
    const view = await p.evaluate(() => { const h = document.getElementById('svc1067-host'), b = document.querySelector('[data-svc1202]');
      return {hostShown: !!(h && !h.hidden && h.offsetParent), bar: !!(b && b.offsetParent), snap: window.svcNight1202()}; });
    check(!view.hostShown && !view.bar && view.snap === null, 'view link: no Night report button, and the panel hands the report nothing');

    /* the edit link, the tracker served from the snapshot */
    await p.route('**/api/ticks*', route => {
      const r = route.request(); if (r.method() !== 'GET') return route.abort();
      const u = new URL(r.url()), tok = u.searchParams.get('token');
      if (!tok) return route.fulfill({json: {now: snap.meta.now, service_day: snap.meta.service_day, trackers: [{token: TOKEN, load: snap.meta.load, title: snap.meta.title, tracker: snap.meta.tracker, card_withdrawn: false, expired: false, key_kept: true, active_ticks: snap.meta.active_ticks}]}});
      if (tok !== TOKEN) return route.fulfill({status: 404, json: {error: 'unknown tracker'}});
      const since = Number(u.searchParams.get('since')) || 0;
      return route.fulfill({json: Object.assign({}, snap.meta, {ticks: since >= snap.meta.seq ? [] : snap.events, more: false})});
    });
    await p.evaluate(() => {
      const of = window.fetch.bind(window);
      window.fetch = async (u, o) => { const r = await of(u, o); if (/^\/api\/version/.test(String(u))) { const j = await r.clone().json().catch(() => null); if (j) { j.level = 'edit'; return new Response(JSON.stringify(j), {status: r.status, headers: {'content-type': 'application/json'}}); } } return r; };
      window.capability = () => 'edit'; window.mayWrite = () => false; SYNC.readonly = false; SYNC.level = 'edit'; SYNC.claims = 'edit'; applyCapability(); window.renderServicing1084();
    });
    await p.waitForFunction(() => { const h = document.getElementById('svc1067-host'); return h && !h.hidden && document.querySelector('#svc1067 .svc-all') && document.querySelector('[data-svc1202]') && window.svcNight1202(); }, null, {timeout: 90000});
    await p.waitForTimeout(1500);

    /* one figure: the report's model against what the panel itself draws */
    const m = await p.evaluate(() => {
      const snap = window.svcNight1202(), R = window.report1202.model({D: snap.D, S: SvcState, C: SvcCrews1173, crewData: SVC1067_CARD.data, events: snap.events, now: snap.now, read: snap.read, day: snap.day, meta: snap.meta});
      const all = document.querySelector('#svc1067 .svc-all'), pick = document.querySelector('#svc1067 [data-svc-day][aria-pressed="true"]');
      const tasks = [...document.querySelectorAll('#svc1067 .svc-tasks')][0];
      return {R: {pct: R.pct, day: R.day.id, stars: R.stars, band: R.band.word, crews: R.crews.filter(c => c.total).length, left: R.left.length, units: R.units, refs: R.refs, test: R.test,
          tasks: R.tasks.map(t => t.name + ' ' + t.d + ' of ' + t.w + ' · ' + t.pct + '%')},
        panelPct: Number(((all && all.textContent) || '').match(/(\d{1,3})\s*%/)[1]), panelDay: pick && pick.getAttribute('data-svc-day'),
        panelTasks: tasks ? [...tasks.querySelectorAll('li')].map(li => (li.querySelector('span').textContent + ' ' + li.querySelector('b').textContent).replace(/\s+/g, ' ').trim()) : [],
        cap: document.querySelector('[data-svc1202-cap]').textContent};
    });
    check(m.R.pct === m.panelPct && m.R.day === m.panelDay, 'the report reads the panel\'s night and percentage: ' + m.R.day + ' ' + m.R.pct + '% (panel ' + m.panelDay + ' ' + m.panelPct + '%)');
    check(JSON.stringify(m.R.tasks) === JSON.stringify(m.panelTasks), 'each job matches the panel: ' + m.R.tasks.join(' | '));
    check(m.R.stars === Math.max(0, Math.min(5, Math.round((m.R.pct - 40) * 10) / 100)) && (m.R.pct >= 90) === (m.R.stars === 5 && m.R.band === 'Exceptional'), 'rated ' + m.R.stars + ' of 5 stars, "' + m.R.band + '" (90% or better is five)');
    check(!m.R.test && new RegExp('^' + m.R.pct + '%|' + m.R.pct + '% · ' + m.R.band).test(m.cap.replace(/^.*?· /, '')) , 'the button names the night: "' + m.cap + '"');

    /* the report itself */
    const [pop] = await Promise.all([p.waitForEvent('popup'), p.click('[data-svc1202-open]')]);
    pop.on('pageerror', e => popErrors.push(String(e && e.message).slice(0, 200)));
    await pop.waitForFunction(() => document.documentElement.getAttribute('data-pages'), null, {timeout: 60000});
    await pop.waitForTimeout(2200);
    const rep = await pop.evaluate(() => { const t = document.body.innerText;
      return {pages: +document.documentElement.getAttribute('data-pages'), title: document.title, pct: document.querySelector('.p1 .pct b').textContent, stars: document.querySelector('.p1 .stars').getAttribute('aria-label'),
        word: document.querySelector('.p1 .word b').textContent, crews: document.querySelectorAll('.p1 .crew').length, pg: [...document.querySelectorAll('.foot .pg')].map(x => x.textContent),
        money: /\$\s?\d|\bex GST\b|\brate\b/i.test(t), partner: /partner/i.test(t), author: /Author: Andrew Fisher/.test(t) && /Andrew Fisher · Shutdown Manager · Coates/.test(t) && !/project manager/i.test(t), hidden: /hidden tab/i.test(t),
        overflow: [...document.querySelectorAll('.sheet')].some(sh => { const b = sh.querySelector('.body'), f = sh.querySelector('.foot'); const l = b && b.lastElementChild; return l && l.getBoundingClientRect().bottom > f.getBoundingClientRect().top; }),
        sideways: document.documentElement.scrollWidth > window.innerWidth + 1}; });
    check(rep.pct === String(m.R.pct) && rep.stars === m.R.stars.toFixed(1) + ' out of 5 stars' && rep.word === m.R.band, 'the report shows ' + rep.pct + '%, ' + rep.stars + ', "' + rep.word + '"');
    check(rep.crews === m.R.crews && rep.pages >= 2 && rep.pg.every((x, i) => x === (i + 1) + ' of ' + rep.pages), rep.crews + ' crew cards; ' + rep.pages + ' pages, numbered ' + rep.pg.join(', '));
    check(!rep.money && !rep.partner && !rep.hidden && rep.author, 'no money, no partner wording, no hidden tabs; "Author: Andrew Fisher" on it and the thank-you signed by him');
    check(!rep.overflow, 'nothing runs into a footer: every block sits on a page');
    check(!rep.sideways, 'no sideways scroll in the report window on this screen');
    check(/^GC500 Servicing Report – /.test(rep.title), 'the PDF name: "' + rep.title + '"');
    if (dir) { fs.mkdirSync(dir, {recursive: true});
      await pop.addStyleTag({content: '.crew-name{filter:blur(5px)} .bar{visibility:hidden}'}); /* the on-screen Print bar is never printed; hidden so it does not sit over a sheet's top in the shot */
      const sheets = await pop.$$('.sheet');
      for (let i = 0; i < sheets.length; i++) await sheets[i].screenshot({path: path.join(dir, tag + '-report-p' + (i + 1) + '.png')});
      await p.addStyleTag({content: '.crew1173-report,.staff988 li,.tm-person{filter:blur(6px)}'});
      const bar = await p.$('[data-svc1202]'); await bar.evaluate(n => n.scrollIntoView({block: 'center'})); await p.waitForTimeout(500);
      const bb = await bar.boundingBox(); await p.screenshot({path: path.join(dir, tag + '-servicing-button.png'), clip: {x: 0, y: Math.max(0, bb.y - 120), width: mobile ? 390 : 1440, height: 260}});
    }
    await pop.close();
    check(s.errors.length === 0 && popErrors.length === 0, 'no page errors: ' + s.errors.concat(popErrors).join(' | '));
    check(s.counts.blocked === 0, 'zero record writes');
    console.log(JSON.stringify({checks, mobile, pct: m.R.pct, stars: m.R.stars, pages: rep.pages}));
  } finally { await s.browser.close(); }
})().catch(e => { console.error('FAIL ' + String(e && e.message).slice(0, 700)); process.exit(1); });
