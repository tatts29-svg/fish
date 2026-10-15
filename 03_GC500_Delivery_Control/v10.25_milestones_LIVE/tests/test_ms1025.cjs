#!/usr/bin/env node
/* Author: Andrew Fisher. Practice tests for Milestones (v10.25), read only through the toolchain harness: the page is
   opened at the live address reading the live record and every write it tries is ABORTED.

     PAGE=build/GC500_v10.25/GC500_Delivery_Control_hosted.html node test_ms1025.cjs [--shots dir]

   1 view link, phone: #today draws the Work progress board; every area at 100% by the board's own count carries the
     badge with its day; the burst plays once on first sight and not again on a redraw; the Milestones section lists
     every area with a percent, the reached ones open with their facts; the Buildings facts agree with an independent
     read of the delivery documents; no page errors; nothing written.
   2 print path, desktop: #print/milestone/<area> → the Today tab, the bar ready, one fitted sheet with the facts and
     the by-day table; #print/milestone/all → one sheet per reached area with page breaks; an unknown area says so;
     Close restores the page.
   3 the other tabs still route; footer v10.25. */
'use strict';
const fs = require('fs'), path = require('path');
const TOOLCHAIN = path.join(__dirname, '..', '..', 'toolchain');
const {open} = require(path.join(TOOLCHAIN, 'harness', 'open_page.js'));
const PAGE = process.env.PAGE; if (!PAGE) { console.error('PAGE=... is needed'); process.exit(2); }
const args = process.argv.slice(2), shots = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : path.join(__dirname, 'shots');
fs.mkdirSync(shots, {recursive: true});
const out = {page: path.basename(PAGE), checks: [], fails: []};
const check = (name, ok, detail) => { out.checks.push({name, ok: !!ok, detail}); if (!ok) out.fails.push(name); console.log((ok ? 'ok   ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail).slice(0, 240) : '')); };
const live = async page => page.waitForFunction(() => typeof SYNC !== 'undefined' && (SYNC.status === 'live' || SYNC.status === 'unreachable'), null, {timeout: 240000});

(async () => {
  /* 1 view link, phone */
  let s = await open({pageFile: PAGE, hash: '#today', mobile: true, W: 390, H: 844, dpr: 2});
  await live(s.page);
  const burst = await s.page.waitForFunction(() => !!document.querySelector('canvas.ms1025-fw'), null, {timeout: 10000}).then(() => true).catch(() => false);
  await s.page.waitForTimeout(6500);
  const v = await s.page.evaluate(() => {
    const board = document.getElementById('gc500-work-board840'), sec = document.getElementById('ms1025');
    const all = MS1025.allFacts(), reached = all.filter(f => f.reached);
    const cards = [...board.querySelectorAll('.tw840-card[data-tw840-area]')].map(c => ({id: c.dataset.tw840Area, badge: (c.querySelector('.ms1025-badge') || {}).textContent || null, canvas: !!c.querySelector('canvas.ms1025-fw')}));
    /* an independent read of the delivery documents for the Buildings area's references */
    const b = MS1025.area('buildings'), keys = [...new Set((b ? b.rows : []).map(r => r.key).filter(Boolean))];
    const docs = toDocs('delivery'); let done = 0, lastAt = null;
    keys.forEach(k => { const d = docs[k]; if (d && d.done === true) { done++; const at = (d.done_history || []).filter(h => h.done).map(h => h.at).pop() || d.done_at; if (at && (!lastAt || at > lastAt)) lastAt = at; } });
    const fb = MS1025.facts('buildings');
    return {tab: state.tab, board: !!board, section: !!sec, cards, areas: all.map(f => f.id), reached: reached.map(f => f.id), seen: MS1025.seen(),
      listed: sec ? [...sec.querySelectorAll('.ms1025-area')].map(e => e.dataset.ms1025) : [], openReached: sec ? [...sec.querySelectorAll('.ms1025-area.reached')].every(e => e.open) : null,
      pcts: sec ? [...sec.querySelectorAll('.ms1025-area summary .ms1025-pct')].map(e => e.textContent) : [],
      factRows: sec && sec.querySelector('.ms1025-area.reached .ms1025-facts') ? sec.querySelector('.ms1025-area.reached .ms1025-facts').querySelectorAll('tr').length : 0,
      dayRows: sec && sec.querySelector('.ms1025-area.reached .ms1025-days') ? sec.querySelector('.ms1025-area.reached .ms1025-days').querySelectorAll('tbody tr').length : 0,
      replay: sec ? sec.querySelectorAll('[data-ms1025-replay]').length : 0, printLinks: sec ? sec.querySelectorAll('a[href^="#print/milestone/"]').length : 0,
      buildings: fb && {total: fb.total, complete: fb.complete, reached: fb.reached, reachedAt: fb.reachedAt, reachedKey: fb.reachedKey, pct: fb.pct, byDay: fb.byDay.length, firstOn: fb.firstOn && fb.firstOn.key, days: fb.days, keys: keys.length, indepDone: done, indepLastAt: lastAt},
      words: sec ? sec.innerText : '', footer: (document.body.innerText.match(/v10\.\d+/g) || []).pop()};
  });
  const reachedCards = v.cards.filter(c => v.reached.includes(c.id));
  check('1 #today draws the Work progress board and the Milestones section under it', v.tab === 'today' && v.board && v.section, {tab: v.tab, board: v.board, section: v.section});
  check('1 every area at 100% by the board’s count carries the 100% badge with its day, no other card does', reachedCards.length === v.reached.length && reachedCards.every(c => /^100%/.test(c.badge || '') && /\d{1,2} \w{3} \d{4}$/.test(c.badge || '')) && v.cards.filter(c => !v.reached.includes(c.id)).every(c => !c.badge), {reached: v.reached, cards: v.cards});
  check('1 the burst played once on first sight, is remembered for this browser, and is gone after', burst === (v.reached.length > 0) && v.reached.every(id => v.seen[id]) && v.cards.every(c => !c.canvas), {burst, seen: v.seen});
  check('1 the section lists every area with a percent; the reached ones open with facts, the by-day table, a print link and a replay', v.listed.length === v.areas.length && v.pcts.length === v.areas.length && v.pcts.every(p => /^\d{1,3}%$/.test(p)) && (v.reached.length === 0 || (v.openReached && v.factRows >= 14 && v.dayRows > 0 && v.replay === v.reached.length)) && v.printLinks === v.areas.length + (v.reached.length ? 1 : 0), {listed: v.listed, pcts: v.pcts, open: v.openReached, factRows: v.factRows, dayRows: v.dayRows, replay: v.replay, printLinks: v.printLinks});
  check('1 Buildings: the facts agree with an independent read of the delivery documents (complete count, the 100% moment)', v.buildings && v.buildings.total === v.buildings.keys && v.buildings.complete === v.buildings.indepDone && (!v.buildings.reached || (v.buildings.reachedAt === v.buildings.indepLastAt && v.buildings.pct === 100 && v.buildings.days >= 0)), v.buildings);
  check('1 nothing on the section is a word a person or a model wrote: no names of agents, no undefined/NaN', !/\b(Claude|Codex via|OpenAI|Anthropic|GPT|Gemini)\b/.test(v.words.replace(/via Codex/g, '')) && !/undefined|NaN|\[object/.test(v.words), {len: v.words.length});
  check('1 footer v10.25, no page errors, no writes', /v10\.25/.test(v.footer || '') && s.errors.length === 0 && s.counts.blocked === 0, {footer: v.footer, errors: s.errors, blocked: s.counts.blocked});
  /* a redraw must not burst again */
  await s.page.evaluate(() => renderToday());
  const again = await s.page.waitForFunction(() => !!document.querySelector('canvas.ms1025-fw'), null, {timeout: 2500}).then(() => true).catch(() => false);
  check('1 a redraw of the Today tab does not play the burst again', again === false, {again});
  await s.page.evaluate(() => { const c = document.querySelector('.tw840-card.ms1025-reached'); if (c) c.scrollIntoView({block: 'start'}); });
  await s.page.waitForTimeout(500);
  await s.page.screenshot({path: path.join(shots, 'phone_today_badge.png')});
  await s.page.evaluate(() => { const c = document.querySelector('.tw840-card.ms1025-reached'); if (c) MS1025.celebrate(c, {force: true}); });
  await s.page.waitForTimeout(700);
  await s.page.screenshot({path: path.join(shots, 'phone_today_burst.png')});
  await s.page.waitForTimeout(4500);
  await s.page.evaluate(() => document.getElementById('ms1025').scrollIntoView({block: 'start'}));
  await s.page.waitForTimeout(400);
  await s.page.screenshot({path: path.join(shots, 'phone_milestones.png')});
  await s.browser.close();

  /* 2 print path, desktop */
  s = await open({pageFile: PAGE, hash: '#print/milestone/buildings', W: 1280, H: 1000});
  await live(s.page);
  await s.page.waitForFunction(() => document.getElementById('dpbar') && !document.querySelector('[data-dpbar-print]').disabled, null, {timeout: 120000}).catch(() => null);
  await s.page.waitForTimeout(800);
  const p = await s.page.evaluate(() => {
    const w = document.getElementById('dayprint'), secs = w ? [...w.querySelectorAll('.ps7.ms1025p')] : [], sec = secs[0], bar = document.getElementById('dpbar');
    return {tab: state.tab, bar: bar && bar.querySelector('.dpbar-t').textContent, ready: bar && !bar.querySelector('[data-dpbar-print]').disabled, sheets: secs.length,
      title: sec ? sec.querySelector('h1').textContent : '', rows: sec ? sec.querySelectorAll('.ms1025-facts tr').length : 0, days: sec ? sec.querySelectorAll('.ms1025-days tbody tr').length : 0,
      zoom: sec ? (sec.style.zoom || '1') : null, src: sec ? sec.querySelector('.ms-src').textContent : '', text: w ? w.innerText : ''};
  });
  check('2 #print/milestone/buildings lands on the Today tab with the bar ready and one sheet', p.tab === 'today' && p.ready && p.sheets === 1 && /Milestone summary/.test(p.bar || ''), {bar: p.bar, sheets: p.sheets});
  check('2 the sheet: the Buildings title, the facts table, the by-day table, the source line, fits one page', /Buildings/.test(p.title) && p.rows >= 14 && p.days > 0 && Number(p.zoom) >= 0.8 && /Counts and stamps only/.test(p.src) && !/undefined|NaN/.test(p.text), {title: p.title, rows: p.rows, days: p.days, zoom: p.zoom});
  await s.page.screenshot({path: path.join(shots, 'desktop_print_milestone_buildings.png')});
  await s.page.evaluate(() => { location.hash = '#print/milestone/all'; });
  await s.page.waitForTimeout(2500);
  const all = await s.page.evaluate(() => { const secs = [...document.querySelectorAll('#dayprint .ps7.ms1025p')]; return {sheets: secs.length, brk: secs.filter(x => x.classList.contains('brk')).length, minZoom: Math.min(...secs.map(x => Number(x.style.zoom || '1'))), reached: MS1025.reachedAreas().length, bar: (document.querySelector('#dpbar .dpbar-t') || {}).textContent}; });
  check('2 #print/milestone/all: one sheet per reached area, a page break before each after the first, every one fitted', all.sheets === all.reached && all.brk === Math.max(0, all.reached - 1) && (all.reached === 0 || all.minZoom >= 0.8), all);
  await s.page.evaluate(() => { location.hash = '#print/milestone/nope'; });
  await s.page.waitForTimeout(2000);
  const nope = await s.page.evaluate(() => ({bar: (document.querySelector('#dpbar .dpbar-t') || {}).textContent, tab: state.tab}));
  check('2 an unknown area says so on the bar and the page stays up', /Nothing to print/.test(nope.bar || '') && nope.tab === 'today' && s.errors.length === 0, nope);
  await s.page.evaluate(() => dpBarClose()); await s.page.waitForTimeout(500);
  const closed = await s.page.evaluate(() => ({bar: !!document.getElementById('dpbar'), printing: document.body.classList.contains('printing-day')}));
  check('2 Close puts the page back; no page errors on the print path', !closed.bar && !closed.printing && s.errors.length === 0, {closed, errors: s.errors});

  /* 3 other tabs */
  for (const h of ['plant', 'nights', 'vms', 'map', 'today']) {
    await s.page.evaluate(x => { location.hash = '#' + x; }, h); await s.page.waitForTimeout(1200);
    const t = await s.page.evaluate(x => ({tab: state.tab, on: !!document.querySelector('.pane.on'), section: x === 'today' ? !!document.getElementById('ms1025') : null}), h);
    check('3 #' + h + ' still routes' + (h === 'today' ? ' and the Milestones section is back' : ''), t.tab === h && t.on && (h !== 'today' || t.section), t);
  }
  check('3 no page errors after routing through the other tabs; no writes', s.errors.length === 0 && s.counts.blocked === 0, {errors: s.errors, blocked: s.counts.blocked});
  await s.browser.close();

  out.result = out.fails.length ? 'FAIL' : 'PASS';
  fs.writeFileSync(path.join(__dirname, 'test_ms1025_result.json'), JSON.stringify(out, null, 1) + '\n');
  console.log(`${out.result} test_ms1025: ${out.checks.length - out.fails.length}/${out.checks.length} checks`);
  process.exit(out.fails.length ? 1 : 0);
})().catch(e => { console.error('FAIL', e && e.stack || e); process.exit(1); });
