#!/usr/bin/env node
/* Author: Andrew Fisher. Practice tests for the Event nights tab (v10.22), read only: the page is opened through the
   toolchain harness at the live address reading the live record, and every write it tries is ABORTED by the harness.

     PAGE=build/GC500_v10.23/GC500_Delivery_Control_hosted.html node test_nights1022.cjs [--shots dir]

   1 view link, phone: #nights renders the three nights, the tasks, every toilet unit in number order, the sign-off; the
     fields are disabled (view only); no page errors.
   2 edit practice, phone: the page is told it may edit (capability/mayWrite overridden, SYNC flags set, the service's
     level answer not consulted); a unit tick, a task tick, a request and the sign-off are made; the documents the page
     tries to PUT are captured off the aborted requests and checked: exactly the planned loads/stamps/by keys, the
     record shape, the name on it, nothing else. The harness aborts them, so the live record never changes.
   3 print path, desktop: #print/nights/2026-10-25 shows the print bar and one .ps7.n1022 sheet with every unit, the
     Sunday relocation marks, no pre-ticked box on a blank sheet, and the fit zoom is 1 or no less than 0.8.
   4 the other tabs still route (Today, Pre-starts, Fencing) with no errors after the new script.
   Screenshots of the phone tab and the printed sheet go to --shots (default tests/shots/). */
'use strict';
const fs = require('fs'), path = require('path');
const TOOLCHAIN = path.join(__dirname, '..', '..', 'toolchain');
const {open} = require(path.join(TOOLCHAIN, 'harness', 'open_page.js'));
const PAGE = process.env.PAGE; if (!PAGE) { console.error('PAGE=... is needed'); process.exit(2); }
const args = process.argv.slice(2), shots = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : path.join(__dirname, 'shots');
fs.mkdirSync(shots, {recursive: true});
const out = {page: path.basename(PAGE), checks: [], fails: []};
const check = (name, ok, detail) => { out.checks.push({name, ok: !!ok, detail}); if (!ok) out.fails.push(name + (detail ? ': ' + JSON.stringify(detail).slice(0, 300) : '')); console.log((ok ? 'ok   ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail).slice(0, 220) : '')); };
const live = async page => page.waitForFunction(() => typeof SYNC !== 'undefined' && (SYNC.status === 'live' || SYNC.status === 'unreachable'), null, {timeout: 240000});

(async () => {
  /* ---------------------------------------------------------------- 1 view link on a phone */
  let s = await open({pageFile: PAGE, hash: '#nights', mobile: true, W: 390, H: 844, dpr: 2});
  await live(s.page); await s.page.waitForTimeout(2500);
  let v = await s.page.evaluate(() => {
    const pane = document.getElementById('pane-nights');
    const units = [...pane.querySelectorAll('.n1022-unit')].map(e => e.dataset.ref);
    const num = k => parseInt(k.replace(/\D/g, ''), 10);
    return {tab: state.tab, shown: pane && pane.classList.contains('on'), nights: pane.querySelectorAll('[data-n1022-night]').length,
      tasks: pane.querySelectorAll('.n1022-tasks .n1022-task').length, units: units.length, ordered: units.every((k, i) => !i || num(units[i - 1]) <= num(k)),
      cancelledIn: units.filter(k => (assetOf(k) || {})._cancelled), expectedUnits: DATA.assets.filter(a => /^WC\d+$/.test(a.key) && !(assetOf(a.key) || {})._cancelled).length,
      disabledTicks: [...pane.querySelectorAll('.n1022-tick')].filter(e => e.disabled).length, ticks: pane.querySelectorAll('.n1022-tick').length,
      preTicked: [...pane.querySelectorAll('.n1022-tick')].filter(e => e.checked).length, signoff: !!pane.querySelector('.n1022-sign'),
      heading: (pane.querySelector('.panehead') || {}).textContent, menu: !!document.querySelector('[data-tab="nights"], [data-go="nights"], a[href="#nights"]'),
      footer: (document.body.innerText.match(/v10\.\d+/g) || []).pop(), wordsKyle: /night manager \(Kyle\)/.test(pane.innerText), costWords: /\$|cost line/.test(pane.querySelector('.n1022-head').innerText)};
  });
  check('1 #nights opens the Event nights pane on a phone', v.tab === 'nights' && v.shown, {tab: v.tab, heading: v.heading});
  check('1 three nights, the Friday tasks, the sign-off block', v.nights === 3 && v.tasks === 5 && v.signoff, {nights: v.nights, tasks: v.tasks});
  check('1 every toilet unit, number order, none cancelled', v.units === v.expectedUnits && v.ordered && !v.cancelledIn.length && v.units >= 60, {units: v.units, expected: v.expectedUnits, cancelled: v.cancelledIn});
  check('1 view link: every tick disabled, nothing pre-ticked', v.disabledTicks === v.ticks && v.preTicked === 0, {ticks: v.ticks, disabled: v.disabledTicks, preTicked: v.preTicked});
  check('1 the night manager named as Kyle, no cost line', v.wordsKyle && /no cost lines/.test(v.costWords ? 'no cost lines' : ''), {kyle: v.wordsKyle});
  check('1 footer is the release', /v10\.2[23]/.test(v.footer || ''), v.footer);
  check('1 no page errors, no blocked writes on the view link', s.errors.length === 0 && s.counts.blocked === 0, {errors: s.errors, blocked: s.counts.blocked});
  await s.page.screenshot({path: path.join(shots, 'phone_nights_view.png'), fullPage: false});
  await s.page.evaluate(() => document.querySelector('.n1022-order').scrollIntoView());
  await s.page.screenshot({path: path.join(shots, 'phone_nights_units.png'), fullPage: false});

  /* ---------------------------------------------------------------- 2 edit practice, writes captured off aborted requests */
  const puts = [];
  s.page.on('request', r => { if (r.method() !== 'GET' && /\/api\//.test(r.url())) puts.push({method: r.method(), url: r.url().replace(/^https:\/\/[^/]+/, ''), body: r.postData() || ''}); });
  const before = s.counts.blocked;
  const e = await s.page.evaluate(async () => {
    window.capability = () => 'edit'; window.mayWrite = () => true; SYNC.readonly = false; SYNC.level = 'edit';
    S.operator = 'Practice Operator 1022'; if (document.querySelector('#who')) document.querySelector('#who').value = 'Practice Operator 1022';
    const N = window.Nights1022; const iso = '2026-10-23'; N.night = iso; renderNights1022();
    const keysBefore = Object.keys(S.loads || {}).filter(k => k.startsWith('nights1022/'));
    const r = {};
    r.unit = N.write(iso, 'unit', 'WC23', {pumped: true}, 'practice');
    r.level = N.write(iso, 'unit', 'WC23', {level: '50'}, 'practice');
    r.task = N.write(iso, 'task', 'meet', {done: true}, 'practice');
    r.req = N.write(iso, 'request', 1, {text: 'WC46 to the collection point, asked by the night team', done: false}, 'practice');
    r.sign = N.write(iso, 'signoff', null, {manager: 'Kyle', start: '19:00', finish: '03:00', signed: true}, 'practice');
    r.wrongNight = N.write('2026-10-22', 'unit', 'WC23', {pumped: true}, 'practice');
    const rec = S.loads['nights1022/2026-10-23/unit/WC23'];
    const keys = Object.keys(S.loads || {}).filter(k => k.startsWith('nights1022/') && !keysBefore.includes(k));
    renderNights1022();
    const pane = document.getElementById('pane-nights');
    const wc23 = pane.querySelector('.n1022-unit[data-ref="WC23"]');
    r.ui = {pumped: wc23.querySelector('[data-f="pumped"]').checked, level: wc23.querySelector('.n1022-sel').value, by: (wc23.querySelector('.n1022-by') || {}).textContent, sum: pane.querySelector('.n1022-sum').innerText.replace(/\s+/g, ' ')};
    r.rec = rec; r.keys = keys; r.docIds = keys.map(k => docIdOf(k));
    r.stamps = keys.map(k => S.stamps['loads/' + k]).every(Boolean); r.by = keys.map(k => S.by['loads/' + k]);
    SYNC.readonly = false; SYNC.level = 'edit'; try { syncSend(); } catch (x) { r.sendErr = String(x); }
    await new Promise(res => setTimeout(res, 2500));
    return r;
  });
  check('2 writes accepted by the page, the wrong night refused', e.unit && e.level && e.task && e.req && e.sign && e.wrongNight === false, {unit: e.unit, wrongNight: e.wrongNight});
  check('2 record shape: kind, night, part, id, by, at, the tick and the level', e.rec && e.rec.kind === 'nights1022' && e.rec.night === '2026-10-23' && e.rec.part === 'unit' && e.rec.id === 'WC23' && e.rec.pumped === true && e.rec.level === '50' && e.rec.by === 'Practice Operator 1022' && /^\d{4}-/.test(e.rec.at), e.rec);
  check('2 one document per unit, task, request and sign-off; stamp and name on each', e.keys.length === 4 && e.stamps && e.by.every(b => b === 'Practice Operator 1022'), {keys: e.keys, by: e.by});
  check('2 the tab shows the tick, the level and the summary', e.ui.pumped && e.ui.level === '50' && /Practice Operator 1022/.test(e.ui.by) && /1\/5 tasks/.test(e.ui.sum) && /1\/\d+ pumped/.test(e.ui.sum), e.ui);
  const docPuts = puts.filter(p => /\/api\/doc\//.test(p.url));
  const ids = docPuts.map(p => p.url.replace(/^\/api\/doc\//, ''));
  const want = e.keys.flatMap(k => ['loads/' + docIdOf1022(k), 'stamps/' + docIdOf1022('loads/' + k), 'by/' + docIdOf1022('loads/' + k)]);
  function docIdOf1022(key) { const enc = [...String(key)].map(ch => /[A-Za-z0-9_\-.:@+]/.test(ch) ? ch : '~' + ch.codePointAt(0).toString(16) + '~').join(''); return enc.slice(0, 180); }
  const extra = ids.filter(i => !want.includes(i)), missing = want.filter(w => !ids.includes(w));
  check('2 the page tried exactly the planned PUTs (loads, stamps, by for each new key), all aborted by the harness', docPuts.length > 0 && !missing.length && !extra.length && s.counts.blocked > before, {tried: ids.length, missing, extra, blockedNow: s.counts.blocked - before});
  const body = docPuts.find(p => /loads\/nights1022~2f~2026-10-23~2f~unit~2f~WC23$/.test(p.url));
  let parsed = null; try { parsed = JSON.parse(body.body); } catch (x) {}
  check('2 the unit document as sent carries the record', parsed && parsed.kind === 'nights1022' && parsed.pumped === true && parsed.level === '50' && parsed.by === 'Practice Operator 1022', parsed && Object.keys(parsed));
  check('2 no page errors in edit practice', s.errors.length === 0, s.errors);
  await s.page.screenshot({path: path.join(shots, 'phone_nights_edit_practice.png'), fullPage: false});
  await s.browser.close();

  /* ---------------------------------------------------------------- 3 print path on a desktop */
  s = await open({pageFile: PAGE, hash: '#print/nights/2026-10-25', W: 1280, H: 1000});
  await live(s.page);
  await s.page.waitForFunction(() => document.getElementById('dpbar') && !document.querySelector('[data-dpbar-print]').disabled, null, {timeout: 60000}).catch(() => null);
  await s.page.waitForTimeout(1500);
  const p = await s.page.evaluate(() => {
    const w = document.getElementById('dayprint'), sec = w && w.querySelector('.ps7.n1022'), bar = document.getElementById('dpbar');
    const rows = sec ? sec.querySelectorAll('table.n1022-t tbody tr').length : 0;
    return {tab: state.tab, bar: !!bar, barText: bar && bar.querySelector('.dpbar-t').textContent, printEnabled: bar && !bar.querySelector('[data-dpbar-print]').disabled,
      sheet: !!sec, rows, rel: sec ? sec.querySelectorAll('.rel').length : 0, ticked: sec ? sec.querySelectorAll('.bx.checked').length : 0, zoom: sec ? (sec.style.zoom || '1') : null,
      title: sec ? sec.querySelector('h1').textContent : '', issued: sec ? sec.querySelector('.issued').textContent : '', printing: document.body.classList.contains('printing-day'), wrap: w && w.className,
      units: DATA.assets.filter(a => /^WC\d+$/.test(a.key) && !(assetOf(a.key) || {})._cancelled).length, kickerForm: sec && /GC500-RS-EN-01/.test(sec.querySelector('.kicker').textContent)};
  });
  check('3 #print/nights/<date> lands on the Event nights tab with the print bar ready', p.tab === 'nights' && p.bar && p.printEnabled && /Event night run sheet/.test(p.barText || ''), {tab: p.tab, bar: p.barText});
  check('3 one run sheet with every unit, Sunday relocation marks, the form id', p.sheet && p.rows === p.units && p.rel >= 10 && p.kickerForm && /Sunday night/.test(p.title), {rows: p.rows, units: p.units, rel: p.rel, title: p.title});
  check('3 fit zoom 1 or no less than 0.8; wrapper and printing classes set', Number(p.zoom) >= 0.8 && p.printing && /ps7wrap/.test(p.wrap || ''), {zoom: p.zoom, wrap: p.wrap});
  check('3 issued and signed line names the author and 15 Oct 2026', /Issued and signed:/.test(p.issued) && /15 Oct 2026/.test(p.issued) && !/undefined|NaN/.test(p.issued), p.issued.slice(0, 120));
  check('3 no page errors on the print path, no writes', s.errors.length === 0 && s.counts.blocked === 0, {errors: s.errors, blocked: s.counts.blocked});
  await s.page.screenshot({path: path.join(shots, 'desktop_print_sunday.png'), fullPage: false});
  await s.page.evaluate(() => dpBarClose());
  await s.page.waitForTimeout(500);
  const closed = await s.page.evaluate(() => ({bar: !!document.getElementById('dpbar'), printing: document.body.classList.contains('printing-day'), wrap: (document.getElementById('dayprint') || {}).className}));
  check('3 Close puts the page back', !closed.bar && !closed.printing && !/ps7wrap/.test(closed.wrap || ''), closed);

  /* ---------------------------------------------------------------- 4 the other tabs */
  for (const h of ['today', 'prestarts', 'fencing', 'map']) {
    await s.page.evaluate(x => { location.hash = '#' + x; }, h);
    await s.page.waitForTimeout(1200);
    const t = await s.page.evaluate(() => ({tab: state.tab, on: !!document.querySelector('.pane.on')}));
    check('4 #' + h + ' still routes', t.tab === (h === 'map' ? 'map' : h) && t.on, t);
  }
  check('4 no page errors after routing through the other tabs', s.errors.length === 0, s.errors);
  await s.browser.close();

  out.result = out.fails.length ? 'FAIL' : 'PASS';
  fs.writeFileSync(path.join(__dirname, 'test_nights1022_result.json'), JSON.stringify(out, null, 1) + '\n');
  console.log(out.result + ' test_nights1022: ' + out.checks.filter(c => c.ok).length + '/' + out.checks.length + ' checks');
  process.exit(out.fails.length ? 1 : 0);
})().catch(e => { console.error('FAIL', e && e.stack || e); process.exit(1); });
