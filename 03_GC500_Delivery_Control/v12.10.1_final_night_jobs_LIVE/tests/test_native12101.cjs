// Author: Andrew Fisher. v12.10.1 (claimed as v12.09.2) on the real page, writing nothing. Both copies of the tracker data carry tonight's final
// night (Pump out, Clean & restock, Locked; Locked on the clean code; no water); the tracker the Manage servicing tracker
// fold will post passes the service's own check (its trackerConfig, run from the server source) and differs from the live
// tracker only in the three final plans; on the edit link the Servicing panel shows tonight's three jobs and the report
// names them; Saturday's figures and the Night report caption are unchanged; lock-up is the cleaners' in the team message
// and whose-job lists. The tracker is served from a saved read-only snapshot; every write is aborted by the harness.
//   PAGE=build/GC500_v12.10.1/GC500_Delivery_Control_hosted.html TICKS=/path/morning_snapshot.json [MOB=1] node tests/test_native12101.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {open} = require('../../toolchain/harness/open_page');
const mobile = !!process.env.MOB, TOKEN = 'test12101Token000000001';
let checks = 0; const check = (v, msg) => { assert(v, msg); checks++; console.log('ok   ' + msg); };
/* the service's own tracker check, taken from the live server source (v5.92) */
const SRC = fs.readFileSync(path.join(__dirname, '../../server_v5.92_crew_groups_LIVE/server.js'), 'utf8');
const grab = (start, end) => { const i = SRC.indexOf(start); assert(i >= 0, 'server source has ' + start); return SRC.slice(i, SRC.indexOf(end, i) + end.length); };
const serverCheck = new Function(
  grab('const TRACK_LINE_RE', ';') + grab('const TRACK_REF_RE', ';') + grab('const TRACK_WORD_RE', ';') + grab('const TRACK_DAY_RE', ';') + grab('const PROTO_KEYS', ';') +
  grab('function protoKey(k)', '}') + grab('function plainObject(v)', '}') + grab('function ownProp(o, k)', '}') + grab('function realDay(day)', '}') +
  SRC.slice(SRC.indexOf('function trackerConfig(t) {'), SRC.indexOf('return { tracker: { days, lines, plans } };\n}') + 'return { tracker: { days, lines, plans } };\n}'.length) +
  '; return trackerConfig;')();
const FINAL = ['pump', 'clean', 'lockup'];
const VER = JSON.parse(require('node:child_process').execFileSync('curl', ['-sS', '--max-time', '30', '-H', 'x-gc500-token: Coates-GC500-2026', 'https://gc500-production.up.railway.app/api/version']).toString());

(async () => {
  const snap = JSON.parse(fs.readFileSync(process.env.TICKS, 'utf8'));
  const s = await open({pageFile: process.env.PAGE, mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1}), p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 120000});
    /* both copies of the data */
    const d = await p.evaluate(() => ({panel: SVC1067_DATA, card: SVC1067_CARD.data, foot: /v12\.10\.1/.test(document.body.innerText)}));
    for (const [name, x] of [['panel (SVC1067_DATA)', d.panel], ['card bundle (SVC1067_CARD.data)', d.card]]) {
      check(x.tasks.lockup === 'Locked' && ['fwf', 'access', 'pan16'].every(k => JSON.stringify(x.plans[k].final) === JSON.stringify(FINAL)) && JSON.stringify(x.groups.pump.tasks) === '["pump"]'
        && JSON.stringify(x.groups.clean.tasks) === '["clean","lockup","refill"]' && JSON.stringify(x.plans.fwf.night) === '["pump","clean","refill"]'
        && x.plans.block.final.join() === 'clean' && x.plans.sewer.final.join() === 'clean' && x.plans.tank.final.join() === 'pump' && x.plans.pump_only.final.join() === 'pump',
        name + ': tonight FWF/accessible/16-pan Pump out, Clean & restock, Locked; pump code pump only; clean code clean, lock-up, water (water only on the other nights); blocks, sewer, tanks unchanged');
    }
    check(d.foot, 'footer v12.10.1');
    /* the tracker the fold will post: built from the card bundle the way the fold builds it */
    const lines = []; d.card.areas.forEach(a => a.refs.forEach(r => r.lines.forEach(l => lines.push({id: l.id, ref: r.ref, kind: l.kind, qty: l.qty}))));
    const posted = {days: d.card.days.map(x => ({id: x.id, plan: x.plan})), lines, plans: d.card.plans}, verdict = serverCheck(posted), live = snap.meta.tracker;
    check(!verdict.error, 'the service\'s own trackerConfig accepts it' + (verdict.error ? ': ' + verdict.error : ''));
    const expect = JSON.parse(JSON.stringify(live)); ['fwf', 'access', 'pan16'].forEach(k => { expect.plans[k].final = FINAL; });
    const already = JSON.stringify(live) === JSON.stringify(expect);
    check(JSON.stringify(verdict.tracker) === JSON.stringify(expect), 'it equals the live event tracker (' + live.lines.length + ' lines, ' + live.days.length + ' days) except the three final plans' + (already ? ' (the live tracker already carries them: updated)' : ''));
    /* the edit link, the tracker from the morning snapshot (Sun 25, nothing ticked yet tonight) as it will be once the event tracker is
       updated: the panel reads percentages only when the page's tracker data and the published tracker agree */
    const meta = Object.assign({}, snap.meta, {tracker: expect});
    await p.evaluate(() => go('servicing')); await p.waitForTimeout(2000);
    /* the page file is the view link: its own access check (GET /api/version) is answered here as the edit link, with the service's
       current record version read once at the start (read only), so the panel stays on its edit view through the test */
    await p.route('**/api/version*', route => route.request().method() === 'GET' ? route.fulfill({json: Object.assign({}, VER, {level: 'edit'})}) : route.abort());
    await p.route('**/api/ticks*', route => {
      const r = route.request(); if (r.method() !== 'GET') return route.abort();
      const u = new URL(r.url()), tok = u.searchParams.get('token');
      if (!tok) return route.fulfill({json: {now: meta.now, service_day: meta.service_day, trackers: [{token: TOKEN, load: meta.load, title: meta.title, tracker: meta.tracker, card_withdrawn: false, expired: false, key_kept: true, active_ticks: meta.active_ticks}]}});
      if (tok !== TOKEN) return route.fulfill({status: 404, json: {error: 'unknown tracker'}});
      const since = Number(u.searchParams.get('since')) || 0;
      return route.fulfill({json: Object.assign({}, meta, {ticks: since >= meta.seq ? [] : snap.events, more: false})});
    });
    const ensureEdit = async () => { await p.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => false; SYNC.readonly = false; SYNC.level = 'edit'; SYNC.claims = 'edit'; if (!window.svcNight1202 || !window.svcNight1202()) { applyCapability(); window.renderServicing1084(); } });
      await p.waitForFunction(() => window.svcNight1202 && window.svcNight1202() && document.querySelector('#svc1067 .svc-tasks li') && !/^Print or save/.test((document.querySelector('[data-svc1202-cap]') || {}).textContent || 'Print or save'), null, {timeout: 90000}); };
    await ensureEdit(); await p.waitForTimeout(1200); await ensureEdit();
    const r = await p.evaluate(() => { const sn = window.svcNight1202(), M = day => window.report1202.model({D: sn.D, S: SvcState, C: SvcCrews1173, crewData: SVC1067_CARD.data, events: sn.events, now: sn.now, read: sn.read, day, meta: sn.meta});
      const tasks = document.querySelector('#svc1067 .svc-tasks'), tonight = M('2026-10-25'), sat = M('2026-10-24');
      return {day: sn.day, panel: tasks ? [...tasks.querySelectorAll('li')].map(li => (li.querySelector('span').textContent + ' ' + li.querySelector('b').textContent).replace(/\s+/g, ' ').trim()) : [],
        tonight: tonight.tasks.map(t => t.name + ' ' + t.d + ' of ' + t.w + ' · ' + t.pct + '%'), sat: {pct: sat.pct, band: sat.band.word, tasks: sat.tasks.map(t => t.name + ' ' + t.d + ' of ' + t.w + ' · ' + t.pct + '%')},
        cap: document.querySelector('[data-svc1202-cap]').textContent}; });
    check(r.day === '2026-10-25' && JSON.stringify(r.panel) === JSON.stringify(r.tonight) && r.tonight.length === 3 && /^Pump out 0 of \d+/.test(r.tonight[0]) && /^Clean & restock 0 of \d+/.test(r.tonight[1]) && /^Locked 0 of \d+/.test(r.tonight[2]),
      'tonight on the panel and in the report: ' + r.tonight.join(' | ') + ' (no water)');
    check(r.sat.pct === 98 && r.sat.band === 'Exceptional' && JSON.stringify(r.sat.tasks) === JSON.stringify(['Pump out 247 of 250 · 98%', 'Clean & restock 252 of 259 · 97%', 'Water checked / refilled 237 of 242 · 97%']),
      'Saturday unchanged: ' + r.sat.pct + '% ' + r.sat.band + ' · ' + r.sat.tasks.join(' | '));
    check(r.cap === 'Previous night · Sat 24 → Sun 25 · 98% · Exceptional', 'the Night report still offers the night just finished: "' + r.cap + '"');
    const who = await p.evaluate(() => { const t = [...document.scripts].map(x => x.textContent).join('\n'); return {teams: /pump1: \['pump'\], pump2: \['pump'\], pump3: \['pump'\]/.test(t) && /cleaners: \['clean', 'lockup'\]/.test(t), whose: /lockup: \['cleaners'\]/.test(t)}; });
    check(who.teams && who.whose, 'lock-up is the cleaners\' in the team message and the whose-job list');
    check(s.errors.length === 0, 'no page errors' + (s.errors.length ? ': ' + s.errors.join(' | ') : ''));
    check(s.counts.blocked === 0, 'zero record writes');
    console.log(JSON.stringify({checks, mobile}));
  } finally { await s.browser.close(); }
})().catch(e => { console.error('FAIL ' + String(e && e.message).slice(0, 700)); process.exit(1); });
