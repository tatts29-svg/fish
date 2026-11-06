// Author: Andrew Fisher. Isolated inherited suite; original source remains unchanged.
__dirname = "/workspace/gc500-showcase-full-lap/03_GC500_Delivery_Control/v7.99_today_faster_fuller_LIVE/evidence";
require = require("node:module").createRequire("/workspace/gc500-showcase-full-lap/03_GC500_Delivery_Control/v7.99_today_faster_fuller_LIVE/evidence/v799_tests.js");
// v7.99 checks - Today faster, cards filling their columns. Author: Andrew Fisher. Read-only: every write is aborted.
//   PAGE=<built page> [MOB=1] node v799_tests.js
const fs = require('fs'), path = require('path');
const {open} = require('../../toolchain/harness/open_page');
const MOB = process.env.MOB === '1';
(async () => {
  const s = await open({pageFile: process.env.PAGE, W: MOB ? 390 : 1440, H: MOB ? 844 : 900, dpr: MOB ? 2 : 1, mobile: MOB, gl: false}), p = s.page;
  const res = []; const ok = (name, pass, detail) => { res.push({name, pass: !!pass, detail}); console.log((pass ? 'PASS ' : 'FAIL ') + name + (pass ? '' : '  ' + JSON.stringify(detail).slice(0, 400))); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
    await p.emulateMedia({reducedMotion: 'reduce'}); await wait(2000);
    const overlaps = () => p.evaluate(() => { const bad = [];
      document.querySelectorAll('#pane-today .mas95').forEach(b => { if (b.closest('details:not([open])')) return; const br = b.getBoundingClientRect();
        const ks = [...b.children].filter(k => k.getClientRects().length).map(k => [k, k.getBoundingClientRect()]);
        ks.forEach(([k, r]) => { if (r.right > br.right + 2 || r.left < br.left - 2) bad.push('outside: ' + (k.querySelector('h3,h4,.k') || k).textContent.trim().slice(0, 20)); });
        for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) { const a = ks[i][1], c = ks[j][1];
          if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) bad.push((ks[i][0].querySelector('h3,h4,.k') || ks[i][0]).textContent.trim().slice(0, 20) + ' / ' + (ks[j][0].querySelector('h3,h4,.k') || ks[j][0]).textContent.trim().slice(0, 20)); } });
      return bad; });

    // 1. one money summary per opening of Today
    const m = await p.evaluate(async () => { const o = window.moneySummary_, calls = []; window.moneySummary_ = function (a) { calls.push(a || null); return o.apply(this, arguments); };
      go('timeline'); await new Promise(r => setTimeout(r, 500)); go('today'); await new Promise(r => setTimeout(r, 900)); window.moneySummary_ = o; return calls; });
    ok('the money summary is worked out once per opening of Today, not twice', m.length === 1, m);

    // 2. folded By branch and On site are not drawn until opened; the fold lines still say what they hold
    const f0 = await p.evaluate(() => ({lazy: [...document.querySelectorAll('#pane-progress .lazy799')].map(e => e.className),
      words: Object.fromEntries([...document.querySelectorAll('#pane-today details.fold95')].map(d => [d.dataset.fold, d.querySelector('summary span').textContent])),
      count: (() => { const R = branchRollup(todayIso()); return 1 + R.branches.length + (R.none && (R.none.lines.length || R.none.costs.length || (R.none.ours && R.none.ours.lines.length)) ? 1 : 0); })()}));
    ok('folded By branch and On site wait to be opened', f0.lazy.length === 2, f0.lazy);
    ok('the By branch fold line still counts the branches', new RegExp('^' + (f0.count - 1) + ' branch(es)? and all of them together').test(f0.words['By branch'] || ''), f0);
    ok('the On site fold line is unchanged', f0.words['On site'] === 'what has gone out, by date', f0.words);

    // 3. opening By branch draws exactly what a full draw draws
    const full = await p.evaluate(async () => { lazy799.full = true; try { renderProgress(); } finally { lazy799.full = false; }
      const b = document.querySelector('#pane-progress .groups.branches'), o = document.querySelector('#pane-progress .dsn .out');
      return {b: b.textContent.replace(/\s+/g, ' '), o: o ? o.textContent.replace(/\s+/g, ' ') : ''}; });
    await p.evaluate(() => { go('timeline'); go('today'); }); await wait(1200);
    const opened = await p.evaluate(async () => { const d = document.querySelector('#pane-today details.fold95[data-fold="By branch"]'); d.open = true; await new Promise(r => setTimeout(r, 900));
      const e = document.querySelector('#pane-today details.fold95[data-fold="On site"]'); e.open = true; await new Promise(r => setTimeout(r, 900));
      const b = document.querySelector('#pane-progress .groups.branches'), o = document.querySelector('#pane-progress .dsn .out');
      return {b: b.textContent.replace(/\s+/g, ' '), o: o ? o.textContent.replace(/\s+/g, ' ') : '', plates: b.querySelectorAll('.grp.branch').length, lazy: document.querySelectorAll('#pane-progress .lazy799').length,
        open: [...document.querySelectorAll('#pane-today details.fold95')].map(d => d.dataset.fold + ':' + d.open)}; });
    ok('opening By branch draws its plates, word for word as a full draw', opened.plates === f0.count && opened.b === full.b, {plates: opened.plates, same: opened.b === full.b});
    ok('opening On site draws it, word for word as a full draw', opened.o.length > 50 && opened.o === full.o, {len: opened.o.length, same: opened.o === full.o});
    ok('both stay open once drawn', opened.lazy === 0 && opened.open.includes('By branch:true') && opened.open.includes('On site:true'), opened.open);
    const kept = await p.evaluate(async () => { render(); await new Promise(r => setTimeout(r, 1200)); return {lazy: document.querySelectorAll('#pane-progress .lazy799').length, plates: document.querySelectorAll('#pane-progress .groups.branches .grp.branch').length}; });
    ok('a redraw of the record keeps opened folds drawn', kept.lazy === 0 && kept.plates === f0.count, kept);

    // 3b. every fold opened in the same moment: all stay open and all are drawn
    await p.evaluate(() => { folds795().clear(); go('timeline'); go('today'); }); await wait(1200);
    const many = await p.evaluate(async () => { document.querySelectorAll('#pane-today details.fold95').forEach(d => { d.open = true; }); await new Promise(r => setTimeout(r, 1500));
      return {open: [...document.querySelectorAll('#pane-today details.fold95')].map(d => d.dataset.fold + ':' + d.open), lazy: document.querySelectorAll('#pane-progress .lazy799').length}; });
    ok('every fold opened at once stays open, and all are drawn', many.lazy === 0 && many.open.length === 3 && many.open.every(x => x.endsWith(':true')), many);

    // 4. paper: print draws the folded parts first, then opens and closes the folds as before
    await p.evaluate(() => { folds795().clear(); go('timeline'); go('today'); }); await wait(1200);
    const pr = await p.evaluate(async () => { window.dispatchEvent(new Event('beforeprint'));
      const during = {lazy: document.querySelectorAll('#pane-progress .lazy799').length, plates: document.querySelectorAll('#pane-progress .groups.branches .grp.branch').length,
        open: [...document.querySelectorAll('#pane-today details.fold95')].every(d => d.open), out: !!document.querySelector('#pane-progress .dsn .out .oh')};
      window.dispatchEvent(new Event('afterprint')); await new Promise(r => setTimeout(r, 300));
      return {during, after: [...document.querySelectorAll('#pane-today details.fold95')].map(d => d.dataset.fold + ':' + d.open)}; });
    ok('print draws By branch and On site in full and opens every fold', pr.during.lazy === 0 && pr.during.plates === f0.count && pr.during.out && pr.during.open, pr);
    ok('after printing the folds close again', pr.after.every(x => x.endsWith(':false')), pr.after);

    // 5. jump buttons find their part even after a fold is drawn as it opens
    await p.evaluate(() => { folds795().clear(); go('timeline'); go('today'); }); await wait(1200);
    const jumps = await p.evaluate(async () => { const out = [];
      for (const b of [...document.querySelectorAll('#pane-today .jump95 .jb95')]) { const name = b.textContent; b.click(); await new Promise(r => setTimeout(r, 900));
        const tgt = jump799(name), mm = $('main'); out.push({name, top: Math.round(tgt.getBoundingClientRect().top - mm.getBoundingClientRect().top), end: mm.scrollTop + mm.clientHeight >= mm.scrollHeight - 2,
          open: tgt.tagName === 'DETAILS' && tgt.classList.contains('fold95') ? tgt.open : null}); }
      return out; });
    ok('every jump button lands its part at the top, folds opened and drawn', jumps.every(j => (Math.abs(j.top - 12) < 30 || j.end) && j.open !== false), jumps);

    // 6. packing: no overlap, nothing outside its box, two-wide cards stay two wide (desktop widths)
    if (!MOB) {
      await p.evaluate(() => document.querySelectorAll('#pane-today details.fold95').forEach(d => { d.open = true; })); await wait(1500);
      const pk = await p.evaluate(() => { const fence = document.querySelector('#pane-progress .groups:not(.branches) > .grp.fence'), all = document.querySelector('#pane-progress .groups.branches > .grp.branch.all');
        return {fence: fence && fence.style.getPropertyValue('--c799'), all: all && all.style.getPropertyValue('--c799'), placed: document.querySelectorAll('#pane-today .mas95 > [data-p799]').length,
          wide: [...document.querySelectorAll('[data-wide799]')].map(k => (k.querySelector('.k,h3') || k).textContent.trim().slice(0, 30))}; });
      ok('cards are placed, and the two-wide plates stay two wide', pk.placed > 10 && /span 2/.test(pk.fence || '') && /span 2/.test(pk.all || ''), pk);
      for (const [w, h] of [[1440, 900], [1280, 800], [1000, 800]]) { await p.setViewportSize({width: w, height: h}); await wait(1500);
        const ov = await overlaps(); ok(`no overlap and nothing outside its box at ${w} px`, ov.length === 0, ov); }
      await p.setViewportSize({width: 1440, height: 900}); await wait(1500);
      const wb = await p.evaluate(() => [...document.querySelectorAll('[data-wide799]')].map(k => (k.querySelector('.k,h3') || k).textContent.trim().slice(0, 30)));
      ok('widening is decided afresh after the window changes, and comes back the same', JSON.stringify(wb) === JSON.stringify(pk.wide), {before: pk.wide, after: wb});
    } else {
      const ph = await p.evaluate(() => ({w: document.documentElement.scrollWidth, placed: document.querySelectorAll('#pane-today .mas95 > [data-p799]').length}));
      ok('phone: one column as before, nothing placed, no sideways scroll', ph.w <= 391 && ph.placed === 0, ph);
    }

    // 7. the date control still replays, folds still wait
    const d = await p.evaluate(async () => { folds795().clear(); go('timeline'); go('today'); await new Promise(r => setTimeout(r, 900));
      const i = document.querySelector('#pane-today > .acts793 #asOf'); i.value = '2026-09-25'; i.dispatchEvent(new Event('change')); await new Promise(r => setTimeout(r, 1500));
      const r = {lazy: document.querySelectorAll('#pane-progress .lazy799').length, words: document.querySelector('#pane-today details.fold95[data-fold="By branch"] summary span').textContent};
      i.value = todayIso(); i.dispatchEvent(new Event('change')); await new Promise(r => setTimeout(r, 1200)); return r; });
    ok('the date control replays the day with the folds still waiting', d.lazy === 2 && /branch/.test(d.words), d);
    // 8. a print from another tab leaves Where we are, and the list it sets, alone (independent review, finding 2)
    const other = await p.evaluate(async () => { folds795().clear(); go('today'); await new Promise(r => setTimeout(r, 900)); go('plant'); await new Promise(r => setTimeout(r, 1200));
      const before = (state.list || []).slice(); window.dispatchEvent(new Event('beforeprint')); window.dispatchEvent(new Event('afterprint')); await new Promise(r => setTimeout(r, 300));
      return {before: before.length, after: (state.list || []).length, same: JSON.stringify(before) === JSON.stringify(state.list || []), lazy: document.querySelectorAll('#pane-progress .lazy799').length}; });
    ok('a print from Equipment leaves its list alone and draws nothing on Today', other.same && other.lazy === 2, other);

    // 9. opening a fold by its own line keeps it where it was on screen, and keeps the focus (finding 3)
    await p.evaluate(() => { folds795().clear(); go('today'); }); await wait(1500);
    for (const name of ['On site', 'By branch']) {
      const before = await p.evaluate(name => { const sm = document.querySelector(`#pane-today details.fold95[data-fold="${name}"] > summary`), m = $('main');
        m.scrollTop += sm.getBoundingClientRect().top - m.getBoundingClientRect().top - 420; return Math.round(sm.getBoundingClientRect().top); }, name); await wait(400);
      if (MOB) await p.tap(`#pane-today details.fold95[data-fold="${name}"] > summary`); else await p.click(`#pane-today details.fold95[data-fold="${name}"] > summary`);
      await wait(1800);
      const after = await p.evaluate(name => { const sm = document.querySelector(`#pane-today details.fold95[data-fold="${name}"] > summary`);
        return {top: Math.round(sm.getBoundingClientRect().top), open: sm.parentElement.open, focus: document.activeElement === sm, drawn: !sm.parentElement.querySelector('.lazy799')}; }, name);
      ok(`opening ${name} by its line keeps it in place, open, drawn${MOB ? '' : ' and focused'}`, Math.abs(after.top - before) <= 30 && after.open && after.drawn && (MOB || after.focus), {before, after});
    }

    // 10. paper is laid out as live's: the same number of pages, both ways of printing (finding 1)
    if (process.env.BASE && !MOB) {
      const pages = async file => { const h = await open({pageFile: file, W: 1440, H: 900, gl: false}), q = h.page;
        await q.waitForFunction(() => SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000}); await q.emulateMedia({reducedMotion: 'reduce'}); await wait(2000);
        await q.evaluate(() => go('today')); await wait(1500);
        await q.evaluate(() => document.querySelectorAll('#pane-today details.fold95').forEach(d => { d.open = true; })); await wait(2000);
        const count = b => (b.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
        const ctrlP = count(await q.pdf({format: 'A4'}));
        await q.evaluate(() => document.body.classList.add('printing-progress')); const report = count(await q.pdf({format: 'A4'}));
        await q.evaluate(() => document.body.classList.remove('printing-progress')); await h.browser.close(); return {ctrlP, report}; };
      const a = await pages(process.env.BASE), b = await pages(process.env.PAGE);
      ok('Today paper is no longer than live; the A4 report keeps its page count', b.ctrlP > 0 && b.ctrlP <= a.ctrlP && a.report === b.report, {live: a, v799: b});
    }
    ok('no page errors', s.errors.length === 0, s.errors.slice(0, 3));
  } finally {
    const pass = res.filter(r => r.pass).length; console.log(`${pass}/${res.length} ${MOB ? 'phone' : 'desktop'} · page errors ${s.errors.length}`);
    fs.writeFileSync(path.join(__dirname, 'v799_' + (MOB ? 'phone' : 'desktop') + '.json'), JSON.stringify({author: 'Andrew Fisher', mobile: MOB, results: res, errors: s.errors}, null, 1));
    await s.browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
