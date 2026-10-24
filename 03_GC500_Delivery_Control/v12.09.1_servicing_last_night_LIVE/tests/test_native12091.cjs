// Author: Andrew Fisher. v12.09.1 (claimed as v12.07.1) on the real Servicing tab, writing nothing. After 08:00, with the new night not started,
// the Night report offers the night just finished ("Previous night · Sat 24 → Sun 25 · …") and opens it, its figures the
// panel's own for that night; a picked night is always the one reported; a night with nothing done never opens an empty
// report. While a night has work (the early-morning read), the button still follows that night, as in v12.05.
// The tracker is served from saved read-only snapshots, so the test never calls the tracker service; every other write is
// aborted by the harness.
//   PAGE=build/GC500_v12.09.1/GC500_Delivery_Control_hosted.html TICKS=/path/morning_snapshot.json TICKS_NIGHT=/path/night_snapshot.json
//   [MOB=1] [EVIDENCE=dir] node tests/test_native12091.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {open} = require('../../toolchain/harness/open_page');
const mobile = !!process.env.MOB, dir = process.env.EVIDENCE, tag = mobile ? 'phone' : 'desktop', TOKEN = 'test12091Token000000001';
let checks = 0; const check = (v, msg) => { assert(v, msg); checks++; console.log('ok   ' + msg); };

async function session(ticksFile, body) {
  const snap = JSON.parse(fs.readFileSync(ticksFile, 'utf8'));
  const s = await open({pageFile: process.env.PAGE, mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1}), p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 120000});
    await p.evaluate(() => go('servicing')); await p.waitForTimeout(2500);
    await body.view(p);
    /* the edit link: the page's own capability check answered as edit (GET only), the tracker from the snapshot */
    /* a request still in flight when the session closes must not take the test down with it */
    await p.route('**/api/version*', async route => { try { const r = route.request(); if (r.method() !== 'GET') return await route.abort();
      const resp = await route.fetch(); let j = null; try { j = await resp.json(); } catch (e) {}
      return j ? await route.fulfill({status: resp.status(), json: Object.assign(j, {level: 'edit'})}) : await route.fulfill({response: resp}); } catch (e) { try { await route.fallback(); } catch (x) {} } });
    await p.route('**/api/ticks*', route => {
      const r = route.request(); if (r.method() !== 'GET') return route.abort();
      const u = new URL(r.url()), tok = u.searchParams.get('token');
      if (!tok) return route.fulfill({json: {now: snap.meta.now, service_day: snap.meta.service_day, trackers: [{token: TOKEN, load: snap.meta.load, title: snap.meta.title, tracker: snap.meta.tracker, card_withdrawn: false, expired: false, key_kept: true, active_ticks: snap.meta.active_ticks}]}});
      if (tok !== TOKEN) return route.fulfill({status: 404, json: {error: 'unknown tracker'}});
      const since = Number(u.searchParams.get('since')) || 0;
      return route.fulfill({json: Object.assign({}, snap.meta, {ticks: since >= snap.meta.seq ? [] : snap.events, more: false})});
    });
    await p.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => false; SYNC.readonly = false; SYNC.level = 'edit'; SYNC.claims = 'edit'; applyCapability(); window.renderServicing1084(); });
    await p.waitForFunction(() => document.querySelector('#svc1067 .svc-all') && document.querySelector('#svc1067 [data-svc-day]') && window.svcNight1202()
      && !/^Print or save/.test((document.querySelector('[data-svc1202-cap]') || {}).textContent || 'Print or save'), null, {timeout: 90000});
    await p.waitForTimeout(1200);
    await body.edit(p, snap);
    return s;
  } finally { await s.browser.close(); }
}
/* the page file is the view link, and the page's own sync can answer "view" mid-test; hold the edit link before each step */
const ensureEdit = async p => { await p.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => false; SYNC.readonly = false; SYNC.level = 'edit'; SYNC.claims = 'edit';
  if (!window.svcNight1202()) { applyCapability(); window.renderServicing1084(); } });
  await p.waitForFunction(() => window.svcNight1202() && document.querySelector('#svc1067 [data-svc-day]') && !/^Print or save/.test((document.querySelector('[data-svc1202-cap]') || {}).textContent || 'Print or save'), null, {timeout: 60000}); };
const cap = async p => { await ensureEdit(p); return p.evaluate(() => document.querySelector('[data-svc1202-cap]').textContent); };
const panel = async p => { await ensureEdit(p); return p.evaluate(() => { const all = document.querySelector('#svc1067 .svc-all'), pick = document.querySelector('#svc1067 [data-svc-day][aria-pressed="true"]'), tasks = document.querySelector('#svc1067 .svc-tasks');
  return {pct: Number(((all && all.textContent) || '').match(/(\d{1,3})\s*%/)[1]), day: pick && pick.getAttribute('data-svc-day'),
    tasks: tasks ? [...tasks.querySelectorAll('li')].map(li => (li.querySelector('span').textContent + ' ' + li.querySelector('b').textContent).replace(/\s+/g, ' ').trim()) : []}; }); };
const reportFor = async (p, day) => { await ensureEdit(p); return p.evaluate(day => { const s = window.svcNight1202(), R = window.report1202.model({D: s.D, S: SvcState, C: SvcCrews1173, crewData: SVC1067_CARD.data, events: s.events, now: s.now, read: s.read, day, meta: s.meta});
  return {pct: R.pct, stars: R.stars, band: R.band.word, state: R.state, crews: R.crews.filter(c => c.total).length, tasks: R.tasks.map(t => t.name + ' ' + t.d + ' of ' + t.w + ' · ' + t.pct + '%')}; }, day); };

(async () => {
  const errors = [];
  /* A: Sunday morning after 08:00 - Saturday finished, Sunday's night not started */
  let A = await session(process.env.TICKS, {
    view: async p => {
      check(await p.evaluate(() => !!(window.report1202 && window.report1202.version === 'v12.09.1' && typeof window.svcNight1202 === 'function')), 'v12.09.1 loaded: the report and the panel hook are there');
      const v = await p.evaluate(() => { const b = document.querySelector('[data-svc1202]'); return {bar: !!(b && b.offsetParent), snap: window.svcNight1202()}; });
      check(!v.bar && v.snap === null, 'view link: no Night report button, and the panel hands the report nothing');
    },
    edit: async (p, snap) => {
      await ensureEdit(p); const s0 = await p.evaluate(() => { const s = window.svcNight1202(); return {day: s.day, picked: s.picked}; });
      const prev = await reportFor(p, '2026-10-24');
      check(s0.day === '2026-10-25' && s0.picked === false && prev.state === 'ended', 'the panel is on the new night (' + s0.day + ', not picked); Saturday has closed');
      const c0 = await cap(p);
      check(c0 === 'Previous night · Sat 24 → Sun 25 · ' + prev.pct + '% · ' + prev.band, 'the button offers the night just finished: "' + c0 + '"');
      if (dir) { fs.mkdirSync(dir, {recursive: true}); await p.addStyleTag({content: '.crew1173-report,.staff988 li,.tm-person{filter:blur(6px)}'});
        const bar = await p.$('[data-svc1202]'); await bar.evaluate(n => n.scrollIntoView({block: 'center'})); await p.waitForTimeout(400);
        const bb = await bar.boundingBox(); await p.screenshot({path: path.join(dir, tag + '-button-previous-night.png'), clip: {x: 0, y: Math.max(0, bb.y - 130), width: mobile ? 390 : 1440, height: 270}}); }
      await ensureEdit(p); const [pop] = await Promise.all([p.waitForEvent('popup'), p.click('[data-svc1202-open]')]);
      pop.on('pageerror', e => errors.push(String(e && e.message).slice(0, 200)));
      await pop.waitForFunction(() => document.documentElement.getAttribute('data-pages'), null, {timeout: 60000}); await pop.waitForTimeout(1500);
      const r = await pop.evaluate(() => { const t = document.body.innerText; return {title: document.title, pct: document.querySelector('.p1 .pct b').textContent, stars: document.querySelector('.p1 .stars').getAttribute('aria-label'),
        word: document.querySelector('.p1 .word b').textContent, crews: document.querySelectorAll('.p1 .crew').length, closed: /Night closed 08:00 Sun 25 Oct|All finished/.test(t), sofar: /so far/i.test(t), night: /Saturday 24 October 2026 into Sunday 25 October/.test(t)}; });
      await pop.close();
      check(r.night && r.closed && !r.sofar && r.title === 'GC500 Servicing Report – Sat 24 Oct 2026', 'it opens Saturday\'s report, closed at 08:00, no "so far": "' + r.title + '"');
      check(r.pct === String(prev.pct) && r.stars === prev.stars.toFixed(1) + ' out of 5 stars' && r.word === prev.band && r.crews === prev.crews, 'the report shows ' + r.pct + '%, ' + r.stars + ', "' + r.word + '", ' + r.crews + ' crew cards');
      /* the same night picked by hand under Previous nights: the panel's own figures, and no "Previous night" label */
      await ensureEdit(p); await p.click('#svc1067 details[data-svc-history] > summary'); await p.waitForTimeout(600);
      await p.click('#svc1067 [data-svc-day="2026-10-24"]'); await p.waitForTimeout(1500);
      const pn = await panel(p), c1 = await cap(p); await ensureEdit(p); const picked = await p.evaluate(() => window.svcNight1202().picked);
      check(pn.day === '2026-10-24' && pn.pct === prev.pct && JSON.stringify(pn.tasks) === JSON.stringify(prev.tasks), 'Saturday picked: the panel draws the same ' + pn.pct + '% and jobs (' + prev.tasks.join(' | ') + ')');
      check(picked === true && c1 === 'Sat 24 → Sun 25 · ' + prev.pct + '% · ' + prev.band, 'a picked night is the one reported: "' + c1 + '"');
      /* tonight picked, nothing done yet: says so, and opens no empty report */
      await ensureEdit(p); await p.click('#svc1067 [data-svc-day="2026-10-25"]'); await p.waitForTimeout(1500);
      const c2 = await cap(p);
      check(c2 === 'Sun 25 → Mon 26 · not started yet', 'tonight picked before any work: "' + c2 + '"');
      const popP = p.waitForEvent('popup', {timeout: 3500}).then(() => true).catch(() => false);
      await ensureEdit(p); await p.click('[data-svc1202-open]'); const popped = await popP;
      const c3 = await cap(p);
      check(!popped && /not started yet/.test(c3), 'and the button opens no empty report: "' + c3 + '"');
    }
  });
  check(A.errors.length === 0 && errors.length === 0, 'morning: no page errors' + (A.errors.concat(errors).length ? ': ' + A.errors.concat(errors).join(' | ') : ''));
  check(A.counts.blocked === 0, 'morning: zero record writes');
  /* B: the 04:59 read - Saturday's night still on, crews just finished: the button follows that night, as in v12.05 */
  const B = await session(process.env.TICKS_NIGHT, {
    view: async () => {},
    edit: async p => {
      await ensureEdit(p); const s0 = await p.evaluate(() => { const s = window.svcNight1202(); return {day: s.day, picked: s.picked}; });
      const cur = await reportFor(p, s0.day), c0 = await cap(p), pn = await panel(p);
      check(s0.day === '2026-10-24' && s0.picked === false && cur.state === 'now' && pn.pct === cur.pct, 'night read: the panel is on Saturday\'s night, under way (' + pn.pct + '%)');
      check(c0 === 'Sat 24 → Sun 25 · ' + cur.pct + '% · ' + cur.band + ' so far', 'with work done the button stays on that night: "' + c0 + '"');
    }
  });
  check(B.errors.length === 0, 'night: no page errors' + (B.errors.length ? ': ' + B.errors.join(' | ') : ''));
  check(B.counts.blocked === 0, 'night: zero record writes');
  console.log(JSON.stringify({checks, mobile}));
})().catch(e => { console.error('FAIL ' + String(e && e.message).slice(0, 700)); process.exit(1); });
