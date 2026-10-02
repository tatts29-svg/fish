// v7.93 practice tests - Today and Where we are on one tab. Reads the live record; every write is aborted by the harness.
//   PAGE=build/GC500_v7.93/GC500_Delivery_Control_hosted.html [MOB=1] node one_tab_tests.js
const path = require('path');
const {open} = require(path.join(__dirname, '..', '..', 'toolchain', 'harness', 'open_page.js'));
const OUT = process.env.OUTD || __dirname;
(async () => {
  const MOB = !!process.env.MOB;
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900});
  const p = s.page, res = [], ok = (name, pass, info) => { res.push({name, pass: !!pass, info}); console.log((pass ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 240000}); await wait(3000);
  await p.evaluate(() => go('today')); await wait(2500);
  const look = () => p.evaluate(() => {
    const T = document.getElementById('pane-today'), pp = document.getElementById('pane-progress');
    const vis = e => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
    const hub = T.querySelector(':scope > .hub'), cards = hub ? [...hub.children].filter(vis).map(c => ((c.querySelector('h3') || c).textContent || '').trim().slice(0, 30)) : [];
    return {
      tab: state.tab, embedded: !!pp && pp.parentElement === T, ppOn: !!pp && pp.classList.contains('on') && !pp.hasAttribute('hidden'),
      order: [...T.children].filter(vis).map(c => c.id || c.className.split(' ')[0]),
      actsTop: vis(T.querySelector(':scope > .acts793 .hacts')), hactsCount: document.querySelectorAll('.hacts').length,
      title: (T.querySelector(':scope > .acts793 h2') || {}).textContent,
      buttons: [...T.querySelectorAll(':scope > .acts793 .hacts .hb, :scope > .acts793 .hacts .showgo')].filter(vis).map(b => b.textContent.trim().replace(/\s+/g, ' ')),
      asOf: !!T.querySelector(':scope > .acts793 #asOf'),
      hidden: {dial: !vis(pp && pp.querySelector('.chero')), strip: !vis(pp && pp.querySelector('.head .strip')), asat: !vis(pp && pp.querySelector('.asat')),
        chicane: !vis(pp && pp.querySelector('.pgban')), todayDate: !vis(T.querySelector(':scope > .hubhead h2'))},
      cards, fencingCard: cards.some(c => /^Fencing/.test(c)), costsCard: cards.some(c => /^Costs/.test(c)), roadsInCards: cards.some(c => /^Roads/.test(c)),
      lights: vis(T.querySelector('.inst .lights')), deliv: vis(T.querySelector('.inst .dialcard')), prog: vis(T.querySelector('.inst .racecard')), keydates: vis(T.querySelector('.inst .racecard .pkeys')),
      secs: pp ? [...pp.querySelectorAll('.dsn > h3.sec')].filter(vis).map(h => h.firstChild.textContent.trim()) : [],
      detail: vis(pp && pp.querySelector('details.pdetail')), banner: vis(T.querySelector(':scope > .dsnband')),
      tabs: [...document.querySelectorAll('[role="tab"]')].filter(vis).map(b => b.textContent.trim().replace(/\s+/g, ' ')),
      todayDot: !!document.querySelector('#tab-today .dot'),
      wide: document.documentElement.scrollWidth > innerWidth + 1 ? document.documentElement.scrollWidth : 0
    };
  });
  let L = await look();
  ok('Today carries Where we are under its cards', L.tab === 'today' && L.embedded && L.ppOn && L.order.indexOf('pane-progress') > L.order.indexOf('hub'), L.order);
  ok('one banner, Today\'s', L.banner && L.hidden.chicane);
  ok('one "View only" line', await p.evaluate(() => [...document.querySelectorAll('#pane-today .rochip')].filter(e => e.getClientRects().length > 0).length) <= 1);
  ok('Where we are buttons at the top under "Today"', L.actsTop && L.title === 'Today' && L.asOf && L.buttons.some(b => /Email/.test(b)) && L.buttons.some(b => /Print/.test(b)) && L.buttons.some(b => /showcase/i.test(b)), {title: L.title, buttons: L.buttons});
  ok('one set of those buttons on the page', L.hactsCount === 1, L.hactsCount);
  ok('instruments kept: lights, deliveries, programme card with its key dates', L.lights && L.deliv && L.prog && L.keydates);
  ok('repeats left off: dial panel, strip, As at, Today date line', Object.values(L.hidden).every(Boolean), L.hidden);
  ok('Today\'s Fencing card stays (its dockets, quote and week lines are on no other card); Costs card left off', L.fencingCard && !L.costsCard, L.cards);
  ok('roads card sits with the cards', L.roadsInCards, L.cards);
  ok('By group, By branch, Money, On site and the detail all there', ['By group', 'By branch', 'Money'].every(x => L.secs.includes(x)) && L.detail, L.secs);
  ok('Where we are off the tab row', !L.tabs.some(t => /Where/.test(t)), L.tabs);
  const menu = await p.evaluate(() => [...document.querySelectorAll('[data-goto]')].map(b => b.dataset.goto));
  ok('Where we are off the Tools list', !menu.includes('progress'), menu.length);
  ok('no page wider than the screen', !L.wide, L.wide);

  // the same fact in more than one card, across Today's cards and the instruments (Where we are's own sections are checked apart)
  const rep = await p.evaluate(() => {
    const T = document.getElementById('pane-today'), vis = e => e.getClientRects().length > 0;
    const units = [...T.querySelectorAll(':scope > .inst > .card, :scope > .hub > .card, #pane-progress .groups > *, #pane-progress .money-grid > *, #pane-progress .out')].filter(vis);
    const name = u => (((u.querySelector('h3, h4') || u).textContent || '').trim().slice(0, 26));
    const facts = {}; units.forEach(u => new Set((u.innerText.match(/\$[\d,]{5,}|\b\d{1,3}(?:,\d{3})+ m\b|\b\d+ of \d+\b/g) || [])).forEach(f => (facts[f] = facts[f] || []).push(name(u) + (u.closest('#pane-progress') ? ' [W]' : ' [T]'))));
    return Object.entries(facts).filter(([, w]) => w.length > 1 && w.some(x => x.endsWith('[T]'))).map(([f, w]) => f + ' -> ' + w.join(' | '));
  });
  /* one known overlap, kept on Andrew's word (2 Oct 2026, "why isnt the info of fencing in today"): Today's Fencing card's
     dollars charged, which By group's Fencing card also carries. Anything else doubled up fails. */
  const rest = rep.filter(x => !/^\$[\d,]+ -> Fencing \[T\]/.test(x) || x.split('|').length > 2);
  ok('no figure doubles up between Today\'s cards and Where we are (bar the fencing dollars, kept by Andrew)', rest.length === 0, rep);

  // a link or bookmark to Where we are lands on Today at By group
  await p.evaluate(() => { const m = $('main'); m.scrollTop = 0; }); await wait(300);
  { const b = await p.$('#pane-today .dialcard .hubgo[data-go="progress"]'); await b.scrollIntoViewIfNeeded(); await p.evaluate(() => { $('main').scrollTop = 0; }); await b.click({force: true}); } await wait(1500);
  const j = await p.evaluate(() => { const s = document.querySelector('#pane-progress .dsn > h3.sec'), m = $('main'); return {tab: state.tab, hash: location.hash, top: Math.round(s.getBoundingClientRect().top - m.getBoundingClientRect().top), scroll: m.scrollTop}; });
  ok('"Open the summary" goes to By group on Today', j.tab === 'today' && j.scroll > 300 && Math.abs(j.top - 12) < 40, j);
  // the lights' Open the register goes to Plant (dead on live v7.92)
  await p.evaluate(() => go('today')); await wait(1500);
  { const b = await p.$('#pane-today .lights .hubgo[data-go]'); await b.scrollIntoViewIfNeeded(); await b.click(); } await wait(1800);
  ok('"Open the register" on the lights opens Plant', await p.evaluate(() => state.tab === 'plant'));
  await p.evaluate(() => { location.hash = '#timeline'; }); await wait(2500);
  await p.evaluate(() => { location.hash = '#progress'; }); await wait(3000);
  L = await look();
  const h = await p.evaluate(() => location.hash);
  ok('#progress opens Today with Where we are in it', L.tab === 'today' && L.embedded && h === '#today', {hash: h, tab: L.tab});

  // leaving and coming back
  for (const t of ['plant', 'map', 'docs', 'today', 'timeline', 'today']) { await p.evaluate(t => go(t), t); await wait(1800); }
  L = await look();
  ok('round trip through four tabs comes back whole', L.embedded && L.ppOn && L.hactsCount === 1 && L.secs.includes('Money'), {order: L.order});

  // the date control redraws Where we are and it stays put
  const d = await p.evaluate(async () => { const i = document.querySelector('#pane-today > .acts793 #asOf'); i.value = '2026-09-25'; i.dispatchEvent(new Event('change')); await new Promise(r => setTimeout(r, 1500));
    const pp = document.getElementById('pane-progress'); const i2 = document.querySelector('#pane-today > .acts793 #asOf');
    return {embedded: pp.parentElement.id, hacts: document.querySelectorAll('.hacts').length, val: i2 && i2.value, sub: (pp.querySelector('.dsn > h3.sec span') || {}).textContent}; });
  ok('the date control replays Where we are and stays on Today', d.embedded === 'pane-today' && d.hacts === 1 && d.val === '2026-09-25' && /25 Sep/.test(d.sub || ''), d);
  await p.evaluate(async () => { const i = document.querySelector('#pane-today > .acts793 #asOf'); i.value = todayIso(); i.dispatchEvent(new Event('change')); }); await wait(1500);

  // a plate still opens what it opened
  const pl = await p.evaluate(async () => { const g = document.querySelector('#pane-progress .grp[data-disc]'); const disc = g.dataset.disc; g.click(); await new Promise(r => setTimeout(r, 2000)); return {tab: state.tab, disc, sd: state.disc}; });
  ok('a By group plate opens Plant filtered to its trade', pl.tab === 'plant' && pl.sd === pl.disc, pl);
  await p.evaluate(() => go('today')); await wait(2000);

  // Print: the Where we are report, as before
  const pr = await p.evaluate(async () => { let called = 0; const orig = window.print; window.print = () => { called++; };
    document.querySelector('#pane-today > .acts793 #printProgress').click(); await new Promise(r => setTimeout(r, 300));
    const on = document.body.classList.contains('printing-progress'); window.dispatchEvent(new Event('afterprint')); window.print = orig;
    return {called, on, after: document.body.classList.contains('printing-progress')}; });
  ok('Print starts the Where we are report and tidies up after', pr.called === 1 && pr.on && !pr.after, pr);
  // what the paper shows: Where we are's own report, Today's own cards left off
  await p.evaluate(() => document.body.classList.add('printing-progress')); await p.emulateMedia({media: 'print'});
  const paper = await p.evaluate(() => { const T = document.getElementById('pane-today'), vis = e => !!e && e.getClientRects().length > 0;
    return {todayCards: [...T.children].filter(c => c.id !== 'pane-progress').filter(vis).length, head: vis(document.querySelector('#pane-progress .dsn > .head')), groups: vis(document.querySelector('#pane-progress .groups'))}; });
  await p.emulateMedia({media: 'screen'}); await p.evaluate(() => document.body.classList.remove('printing-progress'));
  ok('on paper: the Where we are report as before, without Today\'s cards', paper.todayCards === 0 && paper.head && paper.groups, paper);

  // Start showcase
  const sc = await p.evaluate(async () => { document.querySelector('#pane-today > .acts793 .showgo').click(); await new Promise(r => setTimeout(r, 2500));
    const bd = document.getElementById('showBackdrop'); const open = !!bd && getComputedStyle(bd).display !== 'none' && bd.getClientRects().length > 0;
    try { if (typeof showClose === 'function') showClose(); else document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'})); } catch (e) {}
    return {open}; });
  ok('Start showcase opens the showcase', sc.open, sc);
  await wait(1500);

  await p.evaluate(() => { const m = $('main'); m.scrollTop = 0; }); await wait(500);
  await p.screenshot({path: path.join(OUT, (MOB ? 'phone' : 'desktop') + '_top.png')});
  ok('no page errors', s.errors.length === 0, s.errors.slice(0, 3));
  require('fs').writeFileSync(path.join(OUT, 'one_tab_' + (MOB ? 'phone' : 'desktop') + '.json'), JSON.stringify(res, null, 1));
  console.log((MOB ? 'phone' : 'desktop') + ': ' + res.filter(r => r.pass).length + '/' + res.length);
  await s.browser.close();
})();
