/* GC500 servicing tracker v2 (Andrew, 20 Oct 2026): the crew card on the current tracker_data.json.
     node test_card_v2.cjs
   A Pump out code and a Clean & restock code per reference, Complete logs the time, Save & close, Refilled is ticked
   but never counted, Fri/Sat/Sun nights only, Sunday "Pump out, clean & lock" for FWF / accessible / 16-pan, and the
   manager's audit list on the view-only card. Mock service only (GET/POST to a local mock), never the live service. */
'use strict';
const fs = require('fs'), path = require('path');
let pw;
try { pw = require(path.join(__dirname, '..', '..', 'toolchain', 'node_modules', 'playwright')); }
catch (e) { pw = require('playwright'); }
const { chromium } = pw;
const { createMock } = require('./mock_server.js');
const { buildCardHtml, trackerConfig } = require('./build_card.js');
const State = require('../panel_mockup/state.js');

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tracker_data.json'), 'utf8'));
const EVID = path.join(__dirname, 'evidence'); fs.mkdirSync(EVID, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0; const fails = [];
const check = (name, ok, detail) => {
  if (ok) { pass++; console.log('PASS ' + name); }
  else { fail++; fails.push(name); console.log('FAIL ' + name + ' — ' + JSON.stringify(detail === undefined ? null : detail).slice(0, 600)); }
};
const section = t => console.log('\n== ' + t);
const ALL_REFS = [].concat(...DATA.areas.map(a => a.refs));
const REF = Object.fromEntries(ALL_REFS.map(r => [r.ref, r]));
const lineOf = (ref, kind) => REF[ref].lines.find(l => l.kind === kind);
const FRI = '2026-10-23', SAT = '2026-10-24', SUN = '2026-10-25';

(async () => {
  section('1. the v2 rules in the data');
  check('three service days: Fri 23, Sat 24, Sun 25 (no Thursday)', JSON.stringify(DATA.days.map(d => d.id)) === JSON.stringify([FRI, SAT, SUN]) && DATA.days.every(d => !d.ifNeeded));
  const P = DATA.plans;
  check('FWF and accessible: Pump out + Clean & restock + Refilled; Sunday one Pump out, clean & lock',
    ['fwf', 'access'].every(k => P[k].night.join() === 'pump,clean,refill' && P[k].final.join() === 'lockup'));
  check('16-pan: Pump out + Clean & restock; Sunday Pump out, clean & lock', P.pan16.night.join() === 'pump,clean' && P.pan16.final.join() === 'lockup');
  check('waste tank: Pump out every night', P.tank.night.join() === 'pump' && P.tank.final.join() === 'pump');
  check('toilet block (own tank) and sewer-connected: Clean & restock only', ['block', 'sewer'].every(k => P[k].night.join() === 'clean' && P[k].final.join() === 'clean'));
  check('every tanked block has its waste tank at the same reference', ALL_REFS.every(r => !r.lines.some(l => l.kind === 'block') || r.lines.some(l => l.kind === 'tank')));
  check('sewer-connected are T0243, WC09, WC15, WC16, WC17 (9 blocks; the other 6 have waste tanks)', JSON.stringify(ALL_REFS.filter(r => r.lines.some(l => l.kind === 'sewer')).map(r => r.ref).sort()) === JSON.stringify(['T0243', 'WC09', 'WC15', 'WC16', 'WC17']) && ALL_REFS.reduce((n, r) => n + r.lines.filter(l => l.kind === 'sewer').reduce((m, l) => m + l.qty, 0), 0) === 9 && ALL_REFS.reduce((n, r) => n + r.lines.filter(l => l.kind === 'block').reduce((m, l) => m + l.qty, 0), 0) === 6);
  check('accessible toilets are their own kind; 16-pan its own kind', ALL_REFS.every(r => r.lines.every(l => (l.type === 'Accessible Toilet') === (l.kind === 'access') && (l.type === '16Pan Block') === (l.kind === 'pan16'))));
  check('Refilled is an extra; the two QR groups cover every task', DATA.extras.join() === 'refill' && DATA.groups.pump.tasks.join() === 'pump,lockup' && DATA.groups.clean.tasks.join() === 'clean,lockup,refill');
  const bad = JSON.parse(JSON.stringify(DATA)); bad.groups.clean.tasks = ['clean', 'lockup'];
  check('the builder refuses data with a task on no QR (refill dropped from the Clean code)', (() => { try { buildCardHtml(bad); return false; } catch (e) { return /refill .* is on no QR/.test(e.message); } })());
  /* the shared rule: Refilled never moves a percentage */
  const cfg0 = { plans: DATA.plans, days: DATA.days, extras: DATA.extras };
  const w07 = REF.WC07, ev = (task, id) => ({ id, ref: 'WC07', line: 'WC07-FWF', task, day: FRI, done: true, at: '2026-10-23T12:00:00Z', tapped_at: '2026-10-23T12:00:00Z' });
  const s0 = State.refStats(cfg0, w07, FRI, State.jobStates([ev('refill', 'a1')], Date.parse('2026-10-23T13:00:00Z')));
  const s1 = State.refStats(cfg0, w07, FRI, State.jobStates([ev('refill', 'a1'), ev('pump', 'a2'), ev('clean', 'a3')], Date.parse('2026-10-23T13:00:00Z')));
  check('shared rule: Refilled alone counts 0; Pump out + Clean & restock is 100% (Refilled not needed)', s0.d === 0 && s1.done && s1.d === s1.w && s1.w === 2 * w07.lines[0].qty, { s0, s1 });
  check('shared rule: job totals leave Refilled out', !State.taskStats(cfg0, ALL_REFS, FRI, {}).refill);

  section('2. mock service takes the v2 tracker');
  const html = buildCardHtml(DATA), cfg = trackerConfig(DATA);
  const mock = createMock({ control: true }); await mock.listen();
  const E = { 'Content-Type': 'application/json', 'x-gc500-token': mock.options.editToken };
  const api = async (method, p, body, headers) => {
    const r = await fetch(mock.base + p, { method, headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}), body: body == null ? undefined : JSON.stringify(body) });
    const text = await r.text(); let j = null; try { j = JSON.parse(text); } catch (e) {}
    return { status: r.status, j, text };
  };
  mock.setNow('2026-10-23T12:00:00Z');     /* Fri 23 22:00 AEST */
  const made = await api('POST', '/api/cards', { load: 'servicing-tracker:GC500-2026', title: 'GC500 servicing tracker', run_date: FRI, expires: '2026-10-26', keys: [], targets: [], html, tracker: cfg }, E);
  const TOKEN = made.j && made.j.token, LINKS = made.j && made.j.tracker && made.j.tracker.links;
  check('tracker card made, one signed link per reference (' + ALL_REFS.length + ')', made.status === 200 && LINKS && Object.keys(LINKS).length === ALL_REFS.length, made.j);
  const BASE = mock.base + '/d/' + TOKEN, url = (ref, g) => BASE + '#r=' + ref + '.' + LINKS[ref] + (g ? '~' + g : '');
  const mk = o => Object.assign({ id: 'v2tick' + Math.random().toString(36).slice(2, 12).padEnd(10, 'x'), ref: 'WC07', sig: LINKS.WC07, line: 'WC07-FWF', task: 'pump', day: FRI, done: true, undoes: [], tapped_at: new Date(mock.now()).toISOString() }, o);
  const post = ticks => api('POST', '/d/' + TOKEN + '/ticks', { ticks });
  check('the service refuses Pump out, clean & lock on Friday', (await post([mk({ task: 'lockup' })])).status === 400);
  check('the service refuses a Pump out on a sewer-connected block', (await post([mk({ ref: 'WC15', sig: LINKS.WC15, line: lineOf('WC15', 'sewer').id, task: 'pump' })])).status === 400);

  section('3. the phone: one code, its own jobs');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  const live = () => page.waitForFunction(() => /^Live/.test(document.getElementById('status').textContent), null, { timeout: 20000 });
  const open = async u => { await page.goto('about:blank'); await page.goto(u); await live(); };
  const jobs = () => page.$$eval('[data-job]', bs => bs.map(b => ({ key: b.dataset.job, word: b.querySelector('b').textContent, sub: b.querySelector('small').textContent, cls: b.className, disabled: b.disabled })));
  const settle = () => page.waitForFunction(() => window.svc1067 && window.svc1067.outbox().length === 0, null, { timeout: 30000 });
  const tap = async key => { await page.click('[data-job="' + key + '"]'); };
  const areaPct = () => page.$eval('#bars > div .pl em', e => parseInt(e.textContent, 10));

  await open(url('WC07', 'pump'));
  check('three day buttons, no Thursday', JSON.stringify(await page.$$eval('.day', bs => bs.map(b => b.dataset.day))) === JSON.stringify([FRI, SAT, SUN]));
  check('Pump out code: the tag says so, and the only job is Pump out', /Pump out code/.test(await page.textContent('.qrtag')) && JSON.stringify((await jobs()).map(j => j.key)) === JSON.stringify(['WC07-FWF|pump']), await jobs());
  check('the button says "Tap to complete"', (await jobs())[0].sub === 'Tap to complete');
  const before = await areaPct();
  await tap('WC07-FWF|pump'); await settle();
  const j1 = (await jobs())[0];
  check('Complete logs the time ("Completed hh:mm")', /^Completed \d\d:\d\d$/.test(j1.sub) && /done/.test(j1.cls), j1);
  check('the area % moved', (await areaPct()) > before, [before, await areaPct()]);
  check('the tick went to the service as WC07 pump on Friday', mock.ticks(TOKEN).some(t => t.ref === 'WC07' && t.task === 'pump' && t.day === FRI && t.done));
  await page.click('#saveclose');
  await page.waitForFunction(() => /^Saved/.test((document.querySelector('.saved h2') || {}).textContent || ''), null, { timeout: 10000 });
  check('Save & close: "Saved", the area % and "close this page"', /You can close this page/.test(await page.textContent('.saved')) && /Everything \d+%/.test(await page.textContent('.saved')));
  await page.screenshot({ path: path.join(EVID, 'v2_saved_wc07.png') });
  await page.click('[data-unsave]');

  await open(url('WC07', 'clean'));
  const jc = await jobs();
  check('Clean & restock code: Clean & restock, then Refilled (marked not in %)', JSON.stringify(jc.map(j => j.key)) === JSON.stringify(['WC07-FWF|clean', 'WC07-FWF|refill']) && /extra/.test(jc[1].cls) && /not counted/.test(jc[1].sub), jc);
  const p0 = await areaPct();
  await tap('WC07-FWF|refill'); await settle();
  check('Refilled is ticked with its time but the area % does not move', /^Completed/.test((await jobs())[1].sub) && (await areaPct()) === p0, [p0, await areaPct()]);
  await tap('WC07-FWF|clean'); await settle();
  check('Clean & restock moves the area %', (await areaPct()) > p0);
  await page.screenshot({ path: path.join(EVID, 'v2_clean_wc07.png'), fullPage: true });

  const tankLine = lineOf('WC20', 'tank'), blockLine = lineOf('WC20', 'block');
  await open(url('WC20', 'pump'));
  check('WC20 Pump out code: only the waste tank', JSON.stringify((await jobs()).map(j => j.key)) === JSON.stringify([tankLine.id + '|pump']), await jobs());
  await open(url('WC20', 'clean'));
  check('WC20 Clean & restock code: only the toilet block', JSON.stringify((await jobs()).map(j => j.key)) === JSON.stringify([blockLine.id + '|clean']), await jobs());
  await open(url('WC15', 'pump'));
  check('sewer-connected WC15 Pump out code: no jobs, a plain message, no Save button', (await jobs()).length === 0 && /No Pump out at WC15/.test(await page.textContent('.nojobs')) && !(await page.$('#saveclose')));
  await open(url('WC31', 'pump'));
  const w31 = await jobs();
  check('WC31 Pump out code: the 16-pan and the accessible toilet each have their own Pump out', w31.length === 2 && w31.every(j => /\|pump$/.test(j.key)) && w31.some(j => j.key.startsWith(lineOf('WC31', 'pan16').id)) && w31.some(j => j.key.startsWith(lineOf('WC31', 'access').id)), w31);
  await open(url('WC07'));
  check('a code with no group shows every job at the reference', (await jobs()).length === 3);

  section('4. no signal: Save & close keeps the taps on the phone');
  await open(url('WC06', 'pump'));
  await ctx.setOffline(true); await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await tap('WC06-FWF|pump'); await page.click('#saveclose');
  await page.waitForFunction(() => /Kept on this phone/.test((document.querySelector('.saved h2') || {}).textContent || ''), null, { timeout: 10000 });
  check('offline Save & close says "Kept on this phone" and that it sends with signal', /send when there is signal/.test(await page.textContent('.saved')));
  await ctx.setOffline(false); await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await settle();
  await page.waitForFunction(() => /^Saved/.test((document.querySelector('.saved h2') || {}).textContent || ''), null, { timeout: 15000 });
  check('back online: it sends, and the screen turns to "Saved"', mock.ticks(TOKEN).some(t => t.ref === 'WC06' && t.task === 'pump'));

  section('5. the manager: overall %, ready to audit, completions with times');
  const small = DATA.areas.filter(a => a.n && a.refs.length).map(a => ({ a, n: a.refs.reduce((m, r) => m + r.lines.reduce((k, l) => k + State.countedFor(cfg0, l, FRI).length, 0), 0) })).sort((x, y) => x.n - y.n)[0].a;
  const fill = [];
  small.refs.forEach(r => r.lines.forEach(l => State.tasksFor(cfg0, l, FRI).forEach(t => fill.push(mk({ ref: r.ref, sig: LINKS[r.ref], line: l.id, task: t })))));
  for (let i = 0; i < fill.length; i++) { const rr = await post([fill[i]]); if (rr.status !== 200) { check('fill ' + fill[i].ref, false, rr.j); break; } }
  await open(BASE);
  check('the view card has the audit list', !!(await page.$('.audit')));
  check('a finished area is listed as ready to audit with its time (' + 'Area ' + small.n + ')', new RegExp('Area ' + small.n + '[\\s\\S]*finished \\d\\d:\\d\\d').test(await page.textContent('.fin-list')), await page.textContent('.audit'));
  const log = await page.$$eval('.log li time', ts => ts.map(t => t.textContent));
  check('completions are listed newest first with times', log.length >= 3 && log.every((t, i) => i === 0 || t <= log[i - 1]), log);
  check('Refilled shows in the list as not in %', /Refilled \(not in %\)/.test(await page.textContent('.log')));
  check('no names anywhere: no name box, nothing asks who you are', !(await page.$('input')) && !/your name/i.test(await page.textContent('body')));
  await page.screenshot({ path: path.join(EVID, 'v2_audit_view.png'), fullPage: false });

  section('6. Sunday: one Pump out, clean & lock for FWF, accessible and 16-pan');
  mock.setNow('2026-10-25T12:00:00Z');     /* Sun 25 22:00 AEST */
  await open(url('WC07', 'pump'));
  check('WC07 Pump out code on Sunday: one job, "Pump out, clean & lock"', JSON.stringify((await jobs()).map(j => j.word)) === JSON.stringify(['Pump out, clean & lock']), await jobs());
  await open(url('WC07', 'clean'));
  check('WC07 Clean & restock code on Sunday: the same one job (either code completes it), no Refilled', JSON.stringify((await jobs()).map(j => j.key)) === JSON.stringify(['WC07-FWF|lockup']), await jobs());
  await tap('WC07-FWF|lockup'); await settle();
  check('the Sunday lock-up is saved once and counts', mock.ticks(TOKEN).filter(t => t.ref === 'WC07' && t.task === 'lockup' && t.day === SUN).length === 1);
  await open(url('WC31', 'clean'));
  check('WC31 on Sunday: 16-pan and accessible each one lock-up', (await jobs()).map(j => j.key.split('|')[1]).join() === 'lockup,lockup');
  await open(url('WC20', 'pump'));
  check('WC20 on Sunday: the waste tank is still a Pump out', JSON.stringify((await jobs()).map(j => j.key)) === JSON.stringify([tankLine.id + '|pump']));

  section('7. phone width');
  await page.setViewportSize({ width: 360, height: 780 });
  for (const u of [url('WC31', 'pump'), BASE]) { await open(u); check('no sideways scroll at 360 px: ' + u.replace(/^.*\/d\/[^#]*/, ''), await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)); }
  check('no page errors', errors.length === 0, errors);
  await browser.close(); await mock.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  if (fail) { console.log('FAILED: ' + fails.join(' | ')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
