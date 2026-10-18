// v7.96 practice tests - Plant and Inventory as one Equipment tab. Reads the live record; every write is aborted.
//   PAGE=build/GC500_v7.96/GC500_Delivery_Control_hosted.html [MOB=1] node equipment_tests.js
const path = require('path'), fs = require('fs');
const {open} = require(path.join(__dirname, '..', '..', 'toolchain', 'harness', 'open_page.js'));
(async () => {
  const MOB = !!process.env.MOB;
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900});
  const p = s.page, res = [], ok = (name, pass, info) => { res.push({name, pass: !!pass, info}); console.log((pass ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 240000}); await wait(3000);
  const look = () => p.evaluate(() => { const P = document.getElementById('pane-plant'), vis = e => !!e && e.getClientRects().length > 0;
    const kids = [...P.children].filter(vis).map(c => c.id || c.className.split(' ').slice(0, 2).join('.'));
    const chips = [...P.querySelectorAll('.eqhead [data-pg]')].map(b => ({t: b.textContent.trim(), on: b.classList.contains('primary')}));
    const refs = P.querySelector('details.eqrefs');
    return {tab: state.tab, group: state.plantGroup, disc: INV.disc, kids, chips, light: state.light || null,
      heads: P.querySelectorAll('.eqhead').length, inv: vis(P.querySelector('#invCard')), invTitle: (P.querySelector('#invCard .invhead h3') || {}).textContent,
      invChips: !!P.querySelector('#invCard .invchips'), pdfInHead: !!P.querySelector('.eqhead [data-inv83]'), viewInHead: !!P.querySelector('.eqhead .regviewsw'),
      refsOpen: refs ? refs.open : null, refsWords: refs ? refs.querySelector('summary span').textContent : null,
      oldTitle: [...P.querySelectorAll('h3')].some(h => /^Plant — what was asked/.test(h.textContent.trim())),
      groupHeads: refs ? [...refs.querySelectorAll(':scope > .card > h3')].length : -1, rows: refs ? refs.querySelectorAll('tbody tr').length : 0,
      branches: (P.querySelector('.regsum details.fold96[data-fold="Branches"]') || {}).open, contracts: vis(P.querySelector('.regsum')),
      tabs: [...document.querySelectorAll('[role="tab"]')].filter(vis).map(b => b.textContent.trim().replace(/\s+/g, ' ')),
      wide: document.documentElement.scrollWidth > innerWidth + 1 ? document.documentElement.scrollWidth : 0}; });

  // arriving from a light on Today keeps every trade, with that light picked
  await p.evaluate(() => go('today')); await wait(2500);
  await p.evaluate(() => { const b = document.querySelector('#pane-today .lights [data-lf-go="none"]'); b.click(); }); await wait(3000);
  let L = await look();
  ok('a light on Today opens Equipment on every trade with that light', L.tab === 'plant' && !L.group && L.light === 'none' && L.disc === '*', {group: L.group, light: L.light, disc: L.disc});
  await p.evaluate(() => { state.light = null; render(); }); await wait(1500);
  // a fresh visit (as on a new page): the first trade
  await p.evaluate(() => { eq796s.s = null; state.plantGroup = null; state.light = null; go('today'); }); await wait(1500);
  await p.evaluate(() => go('plant')); await wait(3500);
  L = await look();
  ok('the tab is called Equipment; Plant is gone from the row', L.tabs.some(t => /Equipment/.test(t)) && !L.tabs.some(t => /^Plant$/.test(t)), L.tabs);
  ok('opens on the first trade', L.group === 'Toilets & amenities' && L.chips.find(c => c.on).t === 'Toilets & amenities', {group: L.group});
  ok('one heading, one row of trade buttons, names only', L.heads === 1 && L.chips.length >= 10 && L.chips.every(c => !/\d/.test(c.t)), L.chips.map(c => c.t));
  ok('List/Cards and Share PDF in the heading', L.viewInHead && L.pdfInHead);
  ok('the Inventory, in its look, for the trade chosen; its own trade buttons gone', L.inv && L.invTitle === 'On site now' && !L.invChips && L.disc === 'Toilets & amenities', {title: L.invTitle, disc: L.disc});
  { const at = k => L.kids.findIndex(x => x.split('.').includes(k) || x === k); const ix = ['eqhead', 'invCard', 'eqrefs', 'regsum'].map(at);
    ok('order: heading, Inventory, Every reference, contracts', ix.every(n => n >= 0) && ix.every((n, i) => !i || n > ix[i - 1]), L.kids); }
  ok('Every reference folded, its line saying how many and how many recorded', L.refsOpen === false && /^\d+ references? · \d+ of \d+ asked-for item line/.test(L.refsWords || ''), L.refsWords);
  ok('no repeats: old Plant heading gone, the trade heading and progress not repeated inside', !L.oldTitle && L.groupHeads === 0, {oldTitle: L.oldTitle, groupHeads: L.groupHeads});
  ok('Branches folded under the contracts', L.branches === false && L.contracts);
  await p.evaluate(() => { document.querySelector('#pane-plant details.eqrefs').open = true; }); await wait(2500);
  L = await look();
  ok('opened, Every reference shows the reference rows', L.refsOpen && L.rows > 20, L.rows);
  await p.evaluate(() => render()); await wait(2000);
  L = await look();
  ok('an opened fold stays open through a redraw', L.refsOpen === true);
  // one row of trade buttons drives both parts
  await p.evaluate(() => { const b = [...document.querySelectorAll('#pane-plant .eqhead [data-pg]')].find(x => x.textContent.trim() === 'Portable buildings'); b.click(); }); await wait(2500);
  L = await look();
  ok('a trade button moves the Inventory and the references together', L.group === 'Portable buildings' && L.disc === 'Portable buildings' && /^56 references/.test(L.refsWords), {disc: L.disc, words: L.refsWords});
  await p.evaluate(() => { const b = [...document.querySelectorAll('#pane-plant .eqhead [data-pg]')].find(x => x.textContent.trim() === 'VMS boards'); b.click(); }); await wait(2500);
  L = await look();
  ok('VMS boards finds its Inventory trade (Variable message signs)', L.disc === 'Variable message signs', L.disc);
  await p.evaluate(() => { const b = document.querySelector('#pane-plant .eqhead [data-pg=""]'); b.click(); }); await wait(3000);
  L = await look();
  ok('All: every trade in both parts, each trade named in the references', !L.group && L.disc === '*' && / across \d+ trades/.test(L.refsWords) && L.groupHeads >= 9, {words: L.refsWords, heads: L.groupHeads});
  await p.evaluate(() => { const b = [...document.querySelectorAll('#pane-plant .eqhead [data-pg]')].find(x => x.textContent.trim() === 'Toilets & amenities'); b.click(); }); await wait(2500);
  // press a number: its locations, Equipment stays laid out
  const dr = await p.evaluate(async () => { const b = document.querySelector('#pane-plant #invCard [data-invdrill]'); if (!b) return {none: true}; b.click(); await new Promise(r => setTimeout(r, 2000));
    return {drill: !!document.querySelector('#pane-plant #invDrill'), heads: document.querySelectorAll('#pane-plant .eqhead').length, tab: state.tab}; });
  ok('pressing a number shows its locations on Equipment', dr.drill && dr.heads === 1 && dr.tab === 'plant', dr);
  // Share PDF
  const pdf = await p.evaluate(async () => { document.querySelector('#pane-plant .eqhead [data-inv83]').click(); await new Promise(r => setTimeout(r, 1500)); const box = document.getElementById('inv83'); const open = !!box && box.getClientRects().length > 0;
    const x = box && box.querySelector('[data-pdf7x], .pdf7-x, button'); if (box) box.remove(); return {open}; });
  ok('Share PDF opens from the heading', pdf.open, pdf);
  // Change deliveries: no Inventory there; its button opens Equipment
  await p.evaluate(() => go('change')); await wait(3000);
  const ch = await p.evaluate(() => ({inv: !!document.querySelector('#pane-change #invCard'), btn: !!document.querySelector('#pane-change [data-invjump]')}));
  if (ch.btn) { await p.evaluate(() => document.querySelector('#pane-change [data-invjump]').click()); await wait(2500); }
  ok('Change deliveries no longer carries the Inventory; its button opens Equipment', !ch.inv && ch.btn && await p.evaluate(() => state.tab === 'plant'), ch);
  // paper: the folds open for the print and close after; the fold lines do not print
  const pr = await p.evaluate(() => { window.dispatchEvent(new Event('beforeprint')); return [...document.querySelectorAll('#pane-plant details.fold96')].map(d => d.open); });
  await p.emulateMedia({media: 'print'});
  const paper = await p.evaluate(() => [...document.querySelectorAll('#pane-plant details.fold96 > summary')].filter(e => e.getClientRects().length).length);
  await p.emulateMedia({media: 'screen'});
  const after = await p.evaluate(() => { window.dispatchEvent(new Event('afterprint')); return [...document.querySelectorAll('#pane-plant details.fold96')].map(d => d.dataset.fold + ':' + d.open); });
  ok('Print opens the folds, their lines do not print, and the ones closed before close again', pr.every(Boolean) && paper === 0 && after.some(x => /Branches:false/.test(x)), {pr, paper, after});
  // an editing link: the spares can be used
  const ed = await p.evaluate(async () => { window.capability = () => 'edit'; window.mayWrite = () => true; SYNC.readonly = false; SYNC.level = 'edit'; document.body.classList.remove('viewonly');
    render(); await new Promise(r => setTimeout(r, 1500)); const i = document.querySelector('#pane-plant #invCard #spNo'); return {spNo: !!i, disabled: i ? i.disabled : null}; });
  ok('on an editing link the Inventory spares can be typed', ed.spNo && ed.disabled === false, ed);
  L = await look();
  ok('no page wider than the screen', !L.wide, L.wide);
  ok('no page errors', s.errors.length === 0, s.errors.slice(0, 3));
  fs.writeFileSync(path.join(__dirname, 'equipment_' + (MOB ? 'phone' : 'desktop') + '.json'), JSON.stringify(res, null, 1));
  console.log((MOB ? 'phone' : 'desktop') + ': ' + res.filter(r => r.pass).length + '/' + res.length);
  await s.browser.close();
})();
