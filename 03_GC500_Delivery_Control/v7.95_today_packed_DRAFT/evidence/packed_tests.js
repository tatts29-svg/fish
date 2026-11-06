// v7.95 practice tests - Today packed, jump buttons, folding sections. Reads the live record; every write is aborted.
//   PAGE=build/GC500_v7.95/GC500_Delivery_Control_hosted.html [MOB=1] node packed_tests.js
const path = require('path'), fs = require('fs');
const {open} = require(path.join(__dirname, '..', '..', 'toolchain', 'harness', 'open_page.js'));
(async () => {
  const MOB = !!process.env.MOB;
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900});
  const p = s.page, res = [], ok = (name, pass, info) => { res.push({name, pass: !!pass, info}); console.log((pass ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 240000}); await wait(3000);
  await p.evaluate(() => go('today')); await wait(2500);
  // in each packed box, no two cards overlap
  const overlaps = () => p.evaluate(() => { const bad = [];
    document.querySelectorAll('#pane-today .mas95').forEach(b => { if (b.closest('details:not([open])')) return; const ks = [...b.children].filter(k => k.getClientRects().length).map(k => [k, k.getBoundingClientRect()]);
      for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) { const a = ks[i][1], c = ks[j][1];
        if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) bad.push(((ks[i][0].querySelector('h3,h4') || ks[i][0]).textContent || '').trim().slice(0, 20) + ' / ' + ((ks[j][0].querySelector('h3,h4') || ks[j][0]).textContent || '').trim().slice(0, 20)); } });
    return bad; });
  const look = () => p.evaluate(() => { const T = document.getElementById('pane-today'), pp = document.getElementById('pane-progress'), vis = e => !!e && e.getClientRects().length > 0;
    const folds = [...T.querySelectorAll('details.fold95')].map(d => ({name: d.dataset.fold, open: d.open, words: d.querySelector('summary span').textContent}));
    const g = T.querySelector('#pane-progress .groups:not(.branches)');
    return {embedded: pp && pp.parentElement === T, hacts: document.querySelectorAll('.hacts').length, folds,
      byGroupOpen: vis(g), jump: [...T.querySelectorAll('.jump95 .jb95')].map(b => b.textContent),
      packed: [...T.querySelectorAll('.mas95')].filter(b => getComputedStyle(b).gridAutoRows === '2px').length,
      wide: document.documentElement.scrollWidth > innerWidth + 1 ? document.documentElement.scrollWidth : 0}; });
  let L = await look();
  ok('Today still carries Where we are, one set of buttons', L.embedded && L.hacts === 1, L);
  ok('By branch, Money and On site fold; By group stays open', L.folds.map(f => f.name).join() === 'By branch,Money,On site' && L.folds.every(f => !f.open) && L.byGroupOpen, L.folds);
  ok('a fold\'s line carries words, not figures', L.folds.every(f => f.words && !/\$\s?\d/.test(f.words)), L.folds.map(f => f.words.slice(0, 60)));
  ok('jump buttons: Today, Today\'s work, By group, By branch, Money, On site, Trade by trade', L.jump.length === 7, L.jump);
  ok('no page wider than the screen', !L.wide, L.wide);
  if (!MOB) {
    ok('Today\'s work, By group and By branch are packed', L.packed >= 2, L.packed);
    ok('no two cards overlap', (await overlaps()).length === 0, await overlaps());
    const pc = await p.evaluate(() => { const c = document.querySelector('#pane-today .inst > .racecard'), r = x => c.querySelector(x).getBoundingClientRect();
      return {h: Math.round(c.getBoundingClientRect().height), pgm: Math.round(r('.pgm').top), next: Math.round(r('.pnext').top), keys: Math.round(r('.pkeys').top)}; });
    ok('programme card in one band across', pc.h < 420 && Math.abs(pc.pgm - pc.next) < 4 && Math.abs(pc.pgm - pc.keys) < 4, pc);
    // a card's own More info opening repacks around it
    const mi = await p.evaluate(async () => { const d = [...document.querySelectorAll('#pane-today .groups:not(.branches) details')].find(x => !x.open && x.getClientRects().length); if (!d) return 'none'; d.open = true; await new Promise(r => setTimeout(r, 600)); return d.closest('.grp, .card') ? 'opened' : 'opened?'; });
    ok('opening a card\'s More info repacks with no overlap', mi !== 'none' && (await overlaps()).length === 0, {mi, overlaps: await overlaps()});
  }
  // the jump buttons go to each part and open a fold on the way
  const jumps = await p.evaluate(async () => { const out = [];
    for (const b of [...document.querySelectorAll('#pane-today .jump95 .jb95')]) { const name = b.textContent; b.click(); await new Promise(r => setTimeout(r, 500));
      const m = $('main'); const tgt = name === 'Today' ? document.querySelector('#pane-today > .acts793') : name === 'Today’s work' ? document.querySelector('#pane-today > .sec793')
        : name === 'By group' ? [...document.querySelectorAll('#pane-progress .dsn > h3.sec')].find(h => /^By group/.test(h.textContent.trim()))
        : name === 'Trade by trade' ? document.querySelector('#pane-progress details.pdetail') : document.querySelector(`details.fold95[data-fold="${name}"]`);
      const top = Math.round(tgt.getBoundingClientRect().top - m.getBoundingClientRect().top);
      out.push({name, top, end: m.scrollTop + m.clientHeight >= m.scrollHeight - 2, open: tgt.tagName === 'DETAILS' && tgt.classList.contains('fold95') ? tgt.open : null}); }
    return out; });
  ok('each jump button lands its part at the top (or as far as the page goes)', jumps.every(j => Math.abs(j.top - 12) < 30 || j.end), jumps);
  ok('a jump to a fold opens it', jumps.filter(j => j.open !== null).every(j => j.open), jumps.filter(j => j.open !== null));
  if (!MOB) ok('no overlap with every fold open', (await overlaps()).length === 0, await overlaps());
  // the folds a person opened stay open through a redraw of the record, and through the date control
  await p.evaluate(() => { render(); }); await wait(1500);
  L = await look();
  ok('opened folds stay open through a redraw', L.folds.every(f => f.open), L.folds.map(f => f.name + ':' + f.open));
  const d = await p.evaluate(async () => { const i = document.querySelector('#pane-today > .acts793 #asOf'); i.value = '2026-09-25'; i.dispatchEvent(new Event('change')); await new Promise(r => setTimeout(r, 1500));
    const f = [...document.querySelectorAll('#pane-today details.fold95')].map(x => x.dataset.fold + ':' + x.open); const n = document.querySelectorAll('#pane-today .jump95').length;
    const i2 = document.querySelector('#pane-today > .acts793 #asOf'); i2.value = todayIso(); i2.dispatchEvent(new Event('change')); await new Promise(r => setTimeout(r, 1500)); return {f, n}; });
  ok('the date control redraw keeps the folds and one jump row', d.f.length === 3 && d.f.every(x => /true$/.test(x)) && d.n === 1, d);
  // close them again for the paper test
  await p.evaluate(() => document.querySelectorAll('#pane-today details.fold95').forEach(x => { x.open = false; })); await wait(500);
  // Print: every fold opens for the paper and closes after; nothing packed on paper
  const pr = await p.evaluate(async () => { const orig = window.print; let called = 0; window.print = () => { called++; window.dispatchEvent(new Event('beforeprint')); };
    document.querySelector('#pane-today > .acts793 #printProgress').click(); await new Promise(r => setTimeout(r, 300));
    const during = [...document.querySelectorAll('#pane-today details.fold95')].map(x => x.open);
    return {called, during}; });
  await p.emulateMedia({media: 'print'});
  const paper = await p.evaluate(() => { const vis = e => !!e && e.getClientRects().length > 0;
    const g = document.querySelector('#pane-progress .groups:not(.branches)'), k = g && g.firstElementChild;
    return {branches: vis(document.querySelector('#pane-progress .groups.branches')), money: vis(document.querySelector('#pane-progress .money-grid')), out: vis(document.querySelector('#pane-progress .out')),
      summaries: [...document.querySelectorAll('details.fold95 > summary')].filter(vis).length, heads: [...document.querySelectorAll('details.fold95 > h3.sec')].filter(vis).length,
      rows: k ? getComputedStyle(k).gridRowEnd : null, jump: vis(document.querySelector('.jump95'))}; });
  await p.emulateMedia({media: 'screen'});
  const after = await p.evaluate(() => { window.dispatchEvent(new Event('afterprint')); return [...document.querySelectorAll('#pane-today details.fold95')].map(x => x.open); });
  ok('Print opens every fold for the paper', pr.called === 1 && pr.during.every(Boolean), pr);
  ok('on paper: By branch, Money, On site printed with their headings (On site has its own), nothing packed, no jump row', paper.branches && paper.money && paper.out && paper.summaries === 0 && paper.heads === 2 && paper.rows === 'auto' && !paper.jump, paper);
  ok('after the print the folds close again', after.every(x => !x), after);
  if (!MOB) {
    await p.setViewportSize({width: 1000, height: 800}); await wait(1500);
    ok('a narrower window repacks with no overlap', (await overlaps()).length === 0, await overlaps());
    await p.setViewportSize({width: 1440, height: 900}); await wait(1500);
  }
  // round trip
  for (const t of ['plant', 'timeline', 'today']) { await p.evaluate(t => go(t), t); await wait(1800); }
  L = await look();
  ok('round trip comes back packed and folded', L.embedded && L.folds.length === 3 && L.jump.length === 7 && (MOB || L.packed >= 2), L);
  ok('no page errors', s.errors.length === 0, s.errors.slice(0, 3));
  fs.writeFileSync(path.join(__dirname, 'packed_' + (MOB ? 'phone' : 'desktop') + '.json'), JSON.stringify(res, null, 1));
  console.log((MOB ? 'phone' : 'desktop') + ': ' + res.filter(r => r.pass).length + '/' + res.length);
  await s.browser.close();
})();
