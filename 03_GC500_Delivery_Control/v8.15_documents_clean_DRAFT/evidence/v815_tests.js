// v8.15 - Documents, cleaned up: checks. Author: Andrew Fisher. Read only: open_page.js serves the build at the live
// address and aborts every write; the edit-link check flips the page's own flags in the browser and sends nothing.
//   cd 03_GC500_Delivery_Control && CHROMIUM_PATH=/opt/pw-browsers/chromium NODE_PATH=$(npm root -g) node v8.15_documents_clean_DRAFT/evidence/v815_tests.js
// One browser at a time: live and the build are opened one after the other, desktop then phone.
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page');
const ROOT = path.join(__dirname, '..', '..');
const BUILD = process.env.PAGE || path.join(ROOT, 'build/GC500_v8.15/GC500_Delivery_Control_hosted.html');
const BASE = process.env.BASE || path.join(ROOT, 'build/GC500_v8.15/base_live.html');
const ONLY = process.env.ONLY; // 'desktop' or 'phone'
const wait = ms => new Promise(r => setTimeout(r, ms));
const CAT2TILE = {'SWMS & safety plan': 'swms', 'Transport & lifting': 'transport', 'Maps and drawings': 'maps', 'Packs': 'packs', 'Photographs': 'photos', 'Fencing dockets': 'dockets', 'Invoices': 'invoices'};
const MISSING4 = ['Advanced_Temporary_Fencing_SWMS', 'GC500_Map_Plates_A3.pdf', 'GC500_Map_Plates_A3_ZOOM.pdf', 'GC500_Prestart_Advanced_Fencing_MASTER.pdf'];
let fails = 0, passes = 0; const ok = (c, what, d = '') => { if (c) passes++; else fails++; console.log((c ? 'PASS ' : 'FAIL ') + what + (d ? '  - ' + String(d).slice(0, 400) : '')); };
const ready = p => p.waitForFunction(() => typeof DOCS !== 'undefined' && DOCS.state === 'ready' && typeof SYNC !== 'undefined' && document.querySelector('#pane-docs .card, #pane-docs .cut'), null, {timeout: 240000});

async function live(dev) {
  const s = await open({pageFile: BASE, hash: '#docs', ...dev}); const p = s.page; await ready(p); await wait(2500);
  const r = await p.evaluate(() => {
    const pane = document.getElementById('pane-docs'), m = document.querySelector('main'); if (m) m.scrollTop = 0;
    const C = docCollection(), ids = new Set([...pane.querySelectorAll('[data-doc]')].map(e => e.dataset.doc));
    const firstOpen = [...pane.querySelectorAll('a.btn')].find(a => /^Open/.test(a.textContent.trim()));
    const out = {by: C.byCategory, paneH: pane.offsetHeight, firstOpenY: firstOpen ? Math.round(firstOpen.getBoundingClientRect().top - pane.getBoundingClientRect().top) : null,
      missing: C.items.filter(d => d.availability === 'missing').map(d => d.id)};
    for (const c of PHOTO_CATS) { state.photoCat = c[0]; renderDocs(); document.querySelectorAll('#pane-docs [data-doc]').forEach(e => ids.add(e.dataset.doc)); }
    state.photoCat = null; renderDocs(); out.ids = [...ids]; return out; });
  r.errors = s.errors.slice(); await s.browser.close(); return r;
}

async function build(dev, L, name) {
  const s = await open({pageFile: BUILD, hash: '#docs', ...dev}); const p = s.page; await ready(p); await wait(3000);
  // tile counts (the big figures have finished counting up by now)
  const t = await p.evaluate(() => {
    const m = document.querySelector('main'); if (m) m.scrollTop = 0;
    const pane = document.getElementById('pane-docs');
    const tiles = {}; pane.querySelectorAll('[data-tile815]').forEach(x => { tiles[x.dataset.tile815] = {n: Number((x.querySelector('.hubbig b') || {}).textContent.replace(/,/g, '')), light: (x.querySelector('.tl') || {}).className}; });
    const C = docCollection(), twins = C.items.filter(d => d.twin_of).map(d => ({id: d.id, of: d.twin_of, cat: d.category, av: d.availability, title: d.title}));
    const firstOpen = [...pane.querySelectorAll('a.btn')].find(a => /^Open/.test(a.textContent.trim()));
    return {tiles, twins, by: C.byCategory, paneH: pane.offsetHeight, firstOpenY: firstOpen ? Math.round(firstOpen.getBoundingClientRect().top - pane.getBoundingClientRect().top) : null,
      banner: !!pane.querySelector('.pgban, .rbhero'), maphint: pane.querySelectorAll('.maphint').length, docavail: pane.querySelectorAll('.docavail').length,
      pills: pane.querySelectorAll('.pill').length, chips: [...pane.querySelectorAll('.chip')].map(c => c.textContent.trim()),
      text: pane.innerText, invoicesTile: !!pane.querySelector('[data-tile815="invoices"]'), hasFind: !!document.getElementById('docQ815'),
      overflow: Math.max(document.documentElement.scrollWidth, (m || document.body).scrollWidth) > innerWidth + 1};
  });
  console.log(`  tiles: ${Object.entries(t.tiles).map(([k, v]) => k + ' ' + v.n).join(' · ')}`);
  ok(t.hasFind, `${name}: a find box at the top of the tab`);
  for (const [cat, k] of Object.entries(CAT2TILE)) {
    const want = (L.by[cat] || 0) - t.twins.filter(x => x.cat === cat).length;
    if (k === 'invoices' && !want) { ok(!t.invoicesTile, `${name}: Invoices card hidden while there are none`); continue; }
    ok(t.tiles[k] && t.tiles[k].n === want, `${name}: ${k} card counts ${want} (live tab ${L.by[cat]}${want !== L.by[cat] ? ', less ' + (L.by[cat] - want) + ' shown twice' : ''})`, t.tiles[k] && t.tiles[k].n);
  }
  ok(t.twins.length === 5 && t.twins.every(x => x.cat === 'Packs' && x.av === 'ready' && /Advanced_Fencing/.test(x.of)), `${name}: the 5 Advanced Fencing pre-starts are one document each, available`, JSON.stringify(t.twins.map(x => x.id + '<-' + x.of)));
  ok(!t.banner && !t.maphint && !t.docavail && !t.pills, `${name}: no banner, explanation paragraphs, count lines or pills`, JSON.stringify({b: t.banner, m: t.maphint, a: t.docavail, p: t.pills}));
  ok(!/no revision recorded|title is the file name|capture time not recorded|build catalogue|Drawing source|Made by this page|No invoices here yet/.test(t.text), `${name}: none of the dropped wording is on screen`);
  ok(!t.overflow, `${name}: no sideways scroll (default view)`);
  ok(t.tiles.swms.light.includes('red') && t.tiles.maps.light.includes('red') && t.tiles.packs.light.includes('red') && t.tiles.transport.light.includes('green') && t.tiles.photos.light.includes('green') && t.tiles.dockets.light.includes('green'),
    `${name}: card lights: red where something is not uploaded, green where all is there`, JSON.stringify(t.tiles));

  // every file the live tab shows is reachable here: open every card, folds included
  const R = await p.evaluate(async () => {
    const seen = new Set(), red = new Set(), over = [], rowsPer = {};
    const m = document.querySelector('main');
    for (const tile of [...document.querySelectorAll('#pane-docs [data-tile815]')].map(x => x.dataset.tile815)) {
      state.docTile815 = null; paintDocs815(); document.querySelector(`#pane-docs [data-tile815="${tile}"]`).click(); await new Promise(r => setTimeout(r, 400));
      const box = document.getElementById('docsec-' + tile); rowsPer[tile] = box ? box.querySelectorAll('[data-doc815]').length : -1;
      if (box) { box.querySelectorAll('[data-doc815]').forEach(e => { seen.add(e.dataset.doc815); if (e.querySelector('.tl.red')) red.add(e.dataset.doc815); }); }
      box && box.querySelectorAll('details').forEach(d => { d.open = true; });
      if (Math.max(document.documentElement.scrollWidth, (m || document.body).scrollWidth) > innerWidth + 1) over.push(tile);
      box && box.querySelectorAll('details').forEach(d => { d.open = false; });
    }
    const opens = [...document.querySelectorAll('#pane-docs a.btn')].filter(a => /^Open$/.test(a.textContent.trim())).length;
    state.docTile815 = null; state.docOpen815 = {}; paintDocs815();
    return {seen: [...seen], red: [...red], over, rowsPer, opens};
  });
  const twinOf = new Map(t.twins.map(x => [x.of, x.id]));
  const lost = L.ids.filter(id => !R.seen.includes(id) && !(twinOf.has(id) && R.seen.includes(twinOf.get(id))));
  ok(L.ids.length > 300 && !lost.length, `${name}: every file the live tab shows is reachable (${L.ids.length} on live, ${R.seen.length} rows here, ${twinOf.size} merged into their uploaded copy)`, lost.slice(0, 10).join(', '));
  ok(R.seen.length === new Set(R.seen).size, `${name}: no file listed twice across the cards`);
  const dupRows = R.seen.filter(id => twinOf.has(id));
  ok(!dupRows.length, `${name}: the duplicate "not hosted" pre-starts are gone`, dupRows.join(', '));
  ok(R.red.length === 4 && MISSING4.every(w => R.red.some(id => id.includes(w))), `${name}: the 4 files really missing show red`, R.red.join(', '));
  ok(L.missing.length === 9 && R.red.length === 4, `${name}: live showed ${L.missing.length} not uploaded; here ${R.red.length}`);
  ok(!R.over.length, `${name}: no sideways scroll with any card open (folds open)`, R.over.join(', '));
  console.log('  rows per card: ' + JSON.stringify(R.rowsPer));

  // the find box: a SWMS, D022, a WC photo
  const search = async q => p.evaluate(async q => {
    const box = document.getElementById('docQ815'); box.focus(); box.value = q; box.dispatchEvent(new Event('input')); await new Promise(r => setTimeout(r, 450));
    const res = document.getElementById('docsec-results'), m = document.querySelector('main');
    return {rows: res ? [...res.querySelectorAll('[data-doc815]')].map(e => e.dataset.doc815) : [], refs: res ? [...res.querySelectorAll('[data-photoref815]')].map(e => e.dataset.photoref815) : [],
      focus: document.activeElement === box, over: Math.max(document.documentElement.scrollWidth, (m || document.body).scrollWidth) > innerWidth + 1,
      tiles: [...document.querySelectorAll('#pane-docs [data-tile815] .hubbig b')].map(b => b.textContent)};
  }, q);
  const sw = await search('SWMS');
  ok(sw.rows.filter(id => /SWMS/i.test(id)).length >= 4 && sw.focus, `${name}: find "SWMS" lists the SWMS (${sw.rows.length} rows) and keeps the cursor in the box`, sw.rows.join(', '));
  const dz = await search('D022');
  ok(dz.rows.includes('D022-26003-02-PORT_BUILDINGS.pdf'), `${name}: find "D022" lists the D022 drawing (${dz.rows.length} rows)`, dz.rows.join(', '));
  const wc = await search('WC');
  ok(wc.refs.filter(r => /^WC/.test(r)).length >= 3 && !wc.over, `${name}: find "WC" lists the WC photographs by reference (${wc.refs.length} references)`, wc.refs.join(', '));
  const shown = await p.evaluate(async () => {
    const b = document.querySelector('#docsec-results [data-showref815^="WC"]'); const ref = b.dataset.showref815; b.click(); await new Promise(r => setTimeout(r, 500));
    const f = document.querySelector(`#pane-docs [data-fold815="ph:${ref}"]`);
    return {ref, tile: state.docTile815, open: !!(f && f.open), photos: f ? f.querySelectorAll('[data-doc815]').length : 0, hash: location.hash};
  });
  ok(shown.tile === 'photos' && shown.open && shown.photos > 0, `${name}: Show on ${shown.ref} opens Photos at that reference (${shown.photos} photos)`, JSON.stringify(shown));
  const up = await p.evaluate(() => { const q = document.getElementById('docQ815'); q.value = 'D022'; q.dispatchEvent(new Event('input')); return new Promise(r => setTimeout(() => { const x = docCollection().items.filter(d => d.source === 'uploaded').length; r(x); }, 400)); });
  ok(up > 250, `${name}: uploaded files are searched too (${up} uploaded in the collection)`);
  await p.evaluate(() => { const q = document.getElementById('docQ815'); q.value = ''; q.dispatchEvent(new Event('input')); state.docTile815 = null; state.docOpen815 = {}; });

  // Recent: the last 5 uploads, newest first
  const rc = await p.evaluate(() => { paintDocs815(); const box = document.querySelector('#pane-docs .recent815'); const ids = box ? [...box.querySelectorAll('[data-doc815]')].map(e => e.dataset.doc815) : [];
    const want = docCollection().items.filter(d => d._up && d._up.uploaded).sort((a, b) => String(b._up.uploaded).localeCompare(String(a._up.uploaded))).slice(0, 5).map(d => d.id); return {ids, want}; });
  ok(rc.ids.length === 5 && JSON.stringify(rc.ids) === JSON.stringify(rc.want), `${name}: Recent is the last 5 uploads`, rc.ids.join(', '));

  // the deep links
  for (const [h, k] of [['docs/swms', 'swms'], ['docs/transport', 'transport'], ['docs/maps', 'maps'], ['docs/packs', 'packs'], ['docs/photos', 'photos'], ['docs/dockets', 'dockets'], ['docs/fencing', 'dockets']]) {
    await p.evaluate(() => go('today')); await wait(700);
    await p.evaluate(h => { location.hash = h; }, '#' + h); await wait(1500);
    const r = await p.evaluate(() => ({tab: state.tab, tile: state.docTile815, box: !!document.querySelector('#pane-docs .static815[id^="docsec-"]:not(#docsec-results)'), on: (document.querySelector('#pane-docs .tile815.on815') || {dataset: {}}).dataset.tile815}));
    ok(r.tab === 'docs' && r.tile === k && r.on === k && r.box, `${name}: #${h} opens Documents on ${k}`, JSON.stringify(r));
  }
  const fen = await p.evaluate(async () => { go('fencing'); await new Promise(r => setTimeout(r, 900)); state.docsec = 'fencing'; go('docs'); await new Promise(r => setTimeout(r, 900)); return {tab: state.tab, tile: state.docTile815}; });
  ok(fen.tab === 'docs' && fen.tile === 'dockets', `${name}: the fencing papers link (state.docsec = 'fencing') lands on Fencing dockets`, JSON.stringify(fen));
  const inv = await p.evaluate(async () => { location.hash = '#docs/invoices'; await new Promise(r => setTimeout(r, 1200)); return {tab: state.tab, flash: (document.getElementById('flash') || {}).textContent || ''}; });
  ok(inv.tab === 'docs', `${name}: #docs/invoices with no invoices opens Documents and says so`, JSON.stringify(inv));
  const tap = await p.evaluate(async () => { location.hash = '#docs'; await new Promise(r => setTimeout(r, 900)); state.docTile815 = null; paintDocs815();
    document.querySelector('#pane-docs [data-tile815="transport"]').click(); await new Promise(r => setTimeout(r, 300)); const h1 = location.hash;
    document.querySelector('#pane-docs [data-tile815="transport"]').click(); await new Promise(r => setTimeout(r, 300)); return {h1, h2: location.hash, tile: state.docTile815}; });
  ok(tap.h1 === '#docs/transport' && tap.h2 === '#docs' && tap.tile === null, `${name}: a card opens with its own address, a second press closes it`, JSON.stringify(tap));

  // the header search: up to 8 documents now
  const hf = await p.evaluate(() => finderMatches('SWMS').filter(x => x.kind === 'doc').length);
  ok(hf >= 5, `${name}: the header search now lists ${hf} documents for "SWMS" (was capped at 4)`);

  // motion: the opening card eases in, unless the page's motion setting is off or the device asks for reduced motion
  const anim = async () => p.evaluate(async () => { state.docTile815 = null; paintDocs815(); document.querySelector('#pane-docs [data-tile815="swms"]').click(); await new Promise(r => setTimeout(r, 50));
    const el = document.getElementById('docsec-swms'); return el ? getComputedStyle(el).animationName : 'missing'; });
  const a1 = await anim();
  await p.evaluate(() => { try { localStorage.setItem('gc500.motion', 'off'); } catch (e) {} document.documentElement.setAttribute('data-motion', 'off'); });
  const a2 = await anim();
  await p.evaluate(() => { try { localStorage.removeItem('gc500.motion'); } catch (e) {} document.documentElement.removeAttribute('data-motion'); });
  await p.emulateMedia({reducedMotion: 'reduce'}); const a3 = await anim(); await p.emulateMedia({reducedMotion: 'no-preference'});
  ok(a1 === 'paneIn' && a2 === 'none' && a3 === 'none', `${name}: the card eases in; not with Motion off or reduced motion (${a1} / ${a2} / ${a3})`);

  // Print the list: every card and every fold, the 4 not uploaded say so in words
  const pr = await p.evaluate(() => { state.docPrint815 = true; renderDocs(); const pane = document.getElementById('pane-docs');
    const r = {rows: pane.querySelectorAll('[data-doc815]').length, folds: [...pane.querySelectorAll('details')].every(d => d.open), words: pane.querySelectorAll('.tl.red .w').length};
    state.docPrint815 = false; renderDocs(); return r; });
  const total = Object.values(t.by).reduce((a, b) => a + b, 0);
  ok(pr.rows === total && pr.folds && pr.words === 4, `${name}: Print the list carries all ${total} files, folds open, 4 marked not uploaded`, JSON.stringify(pr));

  // the edit link: "+ Add" with the form behind it, and the reason a red file is red (flags flipped in this browser only)
  const ed = await p.evaluate(async () => {
    const was = SYNC.readonly; SYNC.readonly = false; document.body.classList.remove('viewonly'); state.docTile815 = 'maps'; renderDocs();
    const add = document.getElementById('docAdd815'), card = document.getElementById('docAddCard'); const r = {add: !!add, hiddenFirst: card ? card.hidden : null};
    if (add) { add.click(); await new Promise(x => setTimeout(x, 100)); r.shown = !card.hidden; r.kind = (document.getElementById('docKind') || {}).value; add.click(); }
    r.why = [...document.querySelectorAll('#docsec-maps .anos.editonly')].map(e => e.textContent).length;
    SYNC.readonly = was; if (was) document.body.classList.add('viewonly'); state.docAdd815 = false; renderDocs(); r.viewWhy = [...document.querySelectorAll('#pane-docs .anos.editonly')].filter(e => e.offsetParent).length; r.viewAdd = !!document.getElementById('docAdd815');
    return r; });
  ok(ed.add && ed.hiddenFirst === true && ed.shown && ed.kind === 'map' && ed.why === 2 && !ed.viewWhy && !ed.viewAdd, `${name}: edit link: + Add opens the upload form set to the open card; the reason shows on the edit link only`, JSON.stringify(ed));

  const out = {paneH: t.paneH, firstOpenY: t.firstOpenY};
  ok(!s.errors.length, `${name}: no page errors`, s.errors.join(' | '));
  await s.browser.close(); return out;
}

(async () => {
  const report = {};
  for (const [name, dev] of [['desktop', {W: 1440, H: 900}], ['phone', {W: 390, H: 844, dpr: 2, mobile: true}]]) {
    if (ONLY && ONLY !== name) continue;
    console.log(`\n== ${name}`);
    const L = await live(dev);
    ok(!L.errors.length, `${name}: live opens with no page errors`, L.errors.join(' | '));
    const B = await build(dev, L, name);
    report[name] = {before: {paneH: L.paneH, firstOpenY: L.firstOpenY}, after: B};
    console.log(`  height of the tab as it opens: ${L.paneH} px -> ${B.paneH} px; first Open button ${L.firstOpenY} px -> ${B.firstOpenY} px down the tab`);
    ok(B.paneH < L.paneH / 4, `${name}: the tab as it opens is under a quarter of its old height`);
  }
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(report, null, 1));
  console.log(`\n${passes} passed, ${fails} failed`); console.log(fails ? 'FAILED' : 'ALL PASSED'); process.exitCode = fails ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
