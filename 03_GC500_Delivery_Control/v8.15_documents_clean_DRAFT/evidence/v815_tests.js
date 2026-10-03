// v8.15 - Documents, cleaned up: checks. Author: Andrew Fisher. Read only: open_page.js serves the build at the live
// address and aborts every write; the edit-link check flips the page's own flags in the browser and sends nothing.
//   cd 03_GC500_Delivery_Control && CHROMIUM_PATH=/opt/pw-browsers/chromium NODE_PATH=$(npm root -g) \
//     [ONLY=paper|desktop|phone] [PDFDIR=<dir>] node v8.15_documents_clean_DRAFT/evidence/v815_tests.js
// One browser at a time: live and the build are opened one after the other. Every check prints PASS or FAIL; the exit
// code is 1 if any check failed.
const path = require('path'), fs = require('fs'), os = require('os'), {execFileSync} = require('child_process');
const {open} = require('../../toolchain/harness/open_page');
const ROOT = path.join(__dirname, '..', '..');
const BUILD = process.env.PAGE || path.join(ROOT, 'build/GC500_v8.15/GC500_Delivery_Control_hosted.html');
const BASE = process.env.BASE || path.join(ROOT, 'build/GC500_v8.15/base_live.html');
const ONLY = process.env.ONLY; // 'paper', 'desktop' or 'phone'
const PDFDIR = process.env.PDFDIR || fs.mkdtempSync(path.join(os.tmpdir(), 'v815pdf-'));
const wait = ms => new Promise(r => setTimeout(r, ms));
const CAT2TILE = {'SWMS & safety plan': 'swms', 'Transport & lifting': 'transport', 'Maps and drawings': 'maps', 'Packs': 'packs', 'Photographs': 'photos', 'Fencing dockets': 'dockets', 'Invoices': 'invoices'};
const MISSING4 = ['Advanced_Temporary_Fencing_SWMS', 'GC500_Map_Plates_A3.pdf', 'GC500_Map_Plates_A3_ZOOM.pdf', 'GC500_Prestart_Advanced_Fencing_MASTER.pdf'];
let fails = 0, passes = 0; const ok = (c, what, d = '') => { if (c) passes++; else fails++; console.log((c ? 'PASS ' : 'FAIL ') + what + (d ? '  - ' + String(d).slice(0, 500) : '')); };
const ready = p => p.waitForFunction(() => typeof DOCS !== 'undefined' && DOCS.state === 'ready' && typeof SYNC !== 'undefined' && document.querySelector('#pane-docs .card, #pane-docs .cut'), null, {timeout: 240000});
const squash = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
// a real PDF's page count and text (PyMuPDF), so "on paper" means in the file the browser printed
function pdfFacts(file) {
  const out = execFileSync('python3', ['-c', 'import pymupdf as fitz,sys,json; fitz.TOOLS.mupdf_display_errors(False); d=fitz.open(sys.argv[1]); print(json.dumps({"pages": d.page_count, "text": "".join(p.get_text() for p in d)}))', file], {maxBuffer: 64 << 20});
  return JSON.parse(out.toString().trim().split('\n').pop());
}

// ---------------------------------------------------------------- paper: page.pdf() of the tab, live against v8.15
async function paper(file, tag, how) {
  const s = await open({pageFile: file, hash: '#docs', W: 1440, H: 900}); const p = s.page; await ready(p); await wait(2500);
  await p.emulateMedia({reducedMotion: 'reduce'});
  const r = {tag};
  if (how === 'button') {           // the dedicated button: it must call the browser's print, nothing else to prepare
    r.button = await p.evaluate(() => { let called = 0; const wp = window.print; window.print = () => { called++; }; const b = document.getElementById('docsPrintList'); if (b) b.click(); window.print = wp; return {found: !!b, called, text: b ? b.textContent.trim() : ''}; });
  }
  if (how === 'filtered') {          // a search typed, a card open and a fold open: Ctrl+P still prints the whole list
    r.before = await p.evaluate(async () => { document.querySelector('[data-tile815="packs"]').click(); await new Promise(x => setTimeout(x, 300));
      const f = document.querySelector('#docsec-packs details'); if (f) f.open = true;
      const q = document.getElementById('docQ815'); q.value = 'WC'; q.dispatchEvent(new Event('input')); await new Promise(x => setTimeout(x, 500));
      return {q: state.docQ815, tile: state.docTile815, results: !!document.getElementById('docsec-results')}; });
  }
  const pdfFile = path.join(PDFDIR, `${tag}.pdf`);
  fs.writeFileSync(pdfFile, await p.pdf({format: 'A4', printBackground: true}));
  Object.assign(r, pdfFacts(pdfFile), {file: pdfFile});
  await p.emulateMedia({media: 'print'}); await wait(300);
  Object.assign(r, await p.evaluate(() => { const pane = document.getElementById('pane-docs'), vis = e => !!(e.offsetParent || e.getClientRects().length);
    const ids = [...pane.querySelectorAll('[data-doc], [data-print815]')].filter(vis).map(e => e.dataset.doc || e.dataset.print815);
    const C = docCollection(), byId = new Map(C.items.map(d => [d.id, d]));
    return {ids, titles: ids.map(id => (byId.get(id) || {}).title || '').filter(Boolean),
      twins: C.items.filter(d => d.twin_of).map(d => [d.twin_of, d.id]), screenCards: [...pane.querySelectorAll('.tiles815, #docBody815, .head815')].some(vis)}; }));
  await p.emulateMedia({media: 'screen'});
  if (how === 'filtered') r.after = await p.evaluate(() => ({q: state.docQ815, tile: state.docTile815, results: !!document.getElementById('docsec-results')}));
  r.errors = s.errors.slice(); await s.browser.close(); return r;
}

// ---------------------------------------------------------------- live, as the yardstick
async function live(dev) {
  const s = await open({pageFile: BASE, hash: '#docs', ...dev}); const p = s.page; await ready(p); await wait(2500);
  const r = await p.evaluate(() => {
    const pane = document.getElementById('pane-docs'), m = document.querySelector('main'); if (m) m.scrollTop = 0;
    const C = docCollection(), ids = new Set([...pane.querySelectorAll('[data-doc]')].map(e => e.dataset.doc));
    const firstOpen = [...pane.querySelectorAll('a.btn')].find(a => /^Open/.test(a.textContent.trim()));
    const out = {by: C.byCategory, paneH: pane.offsetHeight, firstOpenY: firstOpen ? Math.round(firstOpen.getBoundingClientRect().top - pane.getBoundingClientRect().top) : null,
      missing: C.items.filter(d => d.availability === 'missing').map(d => d.id), notes: Object.fromEntries(C.items.filter(d => d.note).map(d => [d.id, d.note]))};
    for (const c of PHOTO_CATS) { state.photoCat = c[0]; renderDocs(); document.querySelectorAll('#pane-docs [data-doc]').forEach(e => ids.add(e.dataset.doc)); }
    state.photoCat = null; renderDocs(); out.ids = [...ids]; return out; });
  r.open = await p.evaluate(async () => { const t = []; for (let i = 0; i < 6; i++) { go('today'); await new Promise(x => setTimeout(x, 200)); const a = performance.now(); go('docs'); t.push(performance.now() - a); await new Promise(x => setTimeout(x, 200)); } t.sort((a, b) => a - b); return Math.round((t[2] + t[3]) / 2); });
  r.errors = s.errors.slice(); await s.browser.close(); return r;
}

// ---------------------------------------------------------------- the build
async function build(dev, L, name) {
  const s = await open({pageFile: BUILD, hash: '#docs', ...dev}); const p = s.page; await ready(p); await wait(3000);
  const t = await p.evaluate(() => {
    const m = document.querySelector('main'); if (m) m.scrollTop = 0;
    const pane = document.getElementById('pane-docs');
    const tiles = {}; pane.querySelectorAll('[data-tile815]').forEach(x => { const b = x.querySelector('.pstat b'), lamp = x.querySelector('.dstat');
      tiles[x.dataset.tile815] = {n: Number(b.textContent.replace(/,/g, '')), lamp: lamp ? lamp.className : '', island: x.matches('.card.island.racecard'), glyph: !!x.querySelector('svg.g815'),
        hzLite: !!(lamp && lamp.querySelector('svg.hz.lite use[href="#hzHouse"]')), figPx: parseFloat(getComputedStyle(b).fontSize), figFont: getComputedStyle(b).fontFamily, figStyle: getComputedStyle(b).fontStyle}; });
    const C = docCollection(), twins = C.items.filter(d => d.twin_of).map(d => ({id: d.id, of: d.twin_of, cat: d.category, av: d.availability, title: d.title, note: d.note || ''}));
    const firstOpen = [...pane.querySelectorAll('a.btn')].find(a => /^Open/.test(a.textContent.trim()));
    return {tiles, twins, by: C.byCategory, paneH: pane.offsetHeight, firstOpenY: firstOpen ? Math.round(firstOpen.getBoundingClientRect().top - pane.getBoundingClientRect().top) : null,
      banner: !!pane.querySelector('.pgban, .rbhero'), maphint: pane.querySelectorAll('.maphint').length, docavail: pane.querySelectorAll('.docavail').length,
      pills: pane.querySelectorAll('.pill').length, text: pane.innerText, invoicesTile: !!pane.querySelector('[data-tile815="invoices"]'), hasFind: !!document.getElementById('docQ815'),
      findFirst: (() => { const f = document.getElementById('docQ815'), t1 = pane.querySelector('[data-tile815]'); return !!(f && t1 && f.getBoundingClientRect().top < t1.getBoundingClientRect().top); })(),
      emoji: /\p{Emoji_Presentation}/u.test(pane.innerText),
      overflow: Math.max(document.documentElement.scrollWidth, (m || document.body).scrollWidth) > innerWidth + 1};
  });
  console.log(`  tiles: ${Object.entries(t.tiles).map(([k, v]) => k + ' ' + v.n).join(' · ')}`);
  ok(t.hasFind && t.findFirst, `${name}: the find box is first, above the cards`);
  for (const [cat, k] of Object.entries(CAT2TILE)) {
    const want = (L.by[cat] || 0) - t.twins.filter(x => x.cat === cat).length;
    if (k === 'invoices' && !want) { ok(!t.invoicesTile, `${name}: Invoices card hidden while there are none`); continue; }
    ok(t.tiles[k] && t.tiles[k].n === want, `${name}: ${k} card counts ${want} (live tab ${L.by[cat]}${want !== L.by[cat] ? ', less ' + (L.by[cat] - want) + ' shown twice on live' : ''})`, t.tiles[k] && t.tiles[k].n);
  }
  ok(Object.values(t.tiles).every(v => v.island && v.glyph && v.hzLite), `${name}: every card is Today's island race card with its glyph and the register's three-lens lamp`, JSON.stringify(t.tiles));
  ok(Object.values(t.tiles).every(v => v.figPx >= 22 && /Barlow/.test(v.figFont) && v.figStyle === 'italic'), `${name}: the card figures are the race-card numerals (Barlow italic, big enough for countUpFigures)`, JSON.stringify(Object.values(t.tiles).map(v => [v.figPx, v.figFont, v.figStyle])));
  ok(t.twins.length === 5 && t.twins.every(x => x.cat === 'Packs' && x.av === 'ready' && /Advanced_Fencing/.test(x.of)), `${name}: the 5 Advanced Fencing pre-starts are one document each, available`, JSON.stringify(t.twins.map(x => x.id + '<-' + x.of)));
  ok(t.twins.every(x => x.note && x.note === L.notes[x.of]), `${name}: each merged pre-start keeps the catalogue's note word for word (the ATF SWMS basis, scope, attendance)`, JSON.stringify(t.twins.map(x => [x.id, x.note.slice(0, 60)])));
  ok(!t.banner && !t.maphint && !t.docavail && !t.pills, `${name}: no banner, explanation paragraphs, count lines or pills`, JSON.stringify({b: t.banner, m: t.maphint, a: t.docavail, p: t.pills}));
  ok(!/no revision recorded|title is the file name|capture time not recorded|build catalogue|Drawing source|Made by this page|No invoices here yet|on the service|Not hosted/i.test(t.text), `${name}: none of the dropped wording is on screen`);
  ok(!t.emoji, `${name}: no emoji on the tab`);
  ok(!t.overflow, `${name}: no sideways scroll (default view)`);
  const lampOf = k => (t.tiles[k].lamp.match(/\b(red|amber|green|none)\b/) || [])[1];
  ok(['swms', 'maps', 'packs'].every(k => lampOf(k) === 'red') && ['transport', 'photos', 'dockets'].every(k => lampOf(k) === 'green'),
    `${name}: card lamps: red lit where something is not uploaded (Safety, Drawings, Packs), green where every file is there`, JSON.stringify(Object.fromEntries(Object.keys(t.tiles).map(k => [k, lampOf(k)]))));

  // every file the live tab shows is reachable here: open every card, folds included
  const R = await p.evaluate(async () => {
    const seen = [], red = [], over = [], rowsPer = {}, press = {};
    const m = document.querySelector('main');
    for (const tile of [...document.querySelectorAll('#pane-docs [data-tile815]')].map(x => x.dataset.tile815)) {
      state.docTile815 = null; paintDocs815(); const a = performance.now(); document.querySelector(`#pane-docs [data-tile815="${tile}"]`).click(); press[tile] = Math.round(performance.now() - a);
      await new Promise(r => setTimeout(r, 300));
      const box = document.getElementById('docsec-' + tile); rowsPer[tile] = box ? box.querySelectorAll('[data-doc815]').length : -1;
      if (box) { box.querySelectorAll('[data-doc815]').forEach(e => { seen.push(e.dataset.doc815); if (e.querySelector('.tl.red')) red.push(e.dataset.doc815); }); }
      box && box.querySelectorAll('details').forEach(d => { d.open = true; });
      if (Math.max(document.documentElement.scrollWidth, (m || document.body).scrollWidth) > innerWidth + 1) over.push(tile);
      box && box.querySelectorAll('details').forEach(d => { d.open = false; });
    }
    state.docTile815 = null; state.docOpen815 = {}; paintDocs815();
    return {seen, red, over, rowsPer, press};
  });
  const twinOf = new Map(t.twins.map(x => [x.of, x.id])), seenSet = new Set(R.seen);
  const lost = L.ids.filter(id => !seenSet.has(id) && !(twinOf.has(id) && seenSet.has(twinOf.get(id))));
  ok(L.ids.length > 300 && !lost.length, `${name}: every file the live tab shows is reachable (${L.ids.length} on live, ${R.seen.length} rows here, ${twinOf.size} merged into their uploaded copy)`, lost.slice(0, 10).join(', '));
  ok(R.seen.length === seenSet.size, `${name}: no file listed twice across the cards (${R.seen.length} rows, ${seenSet.size} different files)`);
  ok(!R.seen.some(id => twinOf.has(id)), `${name}: the duplicate "not hosted" pre-starts are gone`);
  ok(R.red.length === 4 && MISSING4.every(w => R.red.some(id => id.includes(w))), `${name}: the 4 files really missing show red`, R.red.join(', '));
  ok(L.missing.length === 9 && R.red.length === 4, `${name}: live showed ${L.missing.length} not uploaded; here ${R.red.length}`);
  ok(!R.over.length, `${name}: no sideways scroll with any card open (folds open)`, R.over.join(', '));
  ok(Object.values(R.press).every(ms => ms < 500), `${name}: a card opens in under half a second (${JSON.stringify(R.press)} ms)`);
  console.log('  rows per card: ' + JSON.stringify(R.rowsPer));

  // the find box: a SWMS, D022, a WC photo, an uploaded-only file
  const search = async q => p.evaluate(async q => {
    const box = document.getElementById('docQ815'); box.focus(); box.value = q; const a = performance.now(); box.dispatchEvent(new Event('input')); await new Promise(r => setTimeout(r, 450));
    const res = document.getElementById('docsec-results'), m = document.querySelector('main');
    return {rows: res ? [...res.querySelectorAll('[data-doc815]')].map(e => e.dataset.doc815) : [], refs: res ? [...res.querySelectorAll('[data-photoref815]')].map(e => e.dataset.photoref815) : [],
      focus: document.activeElement === box, over: Math.max(document.documentElement.scrollWidth, (m || document.body).scrollWidth) > innerWidth + 1};
  }, q);
  const sw = await search('SWMS');
  ok(sw.rows.filter(id => /SWMS/i.test(id)).length >= 4 && sw.focus, `${name}: find "SWMS" lists the SWMS (${sw.rows.length} rows) and keeps the cursor in the box`, sw.rows.join(', '));
  const dz = await search('D022');
  ok(dz.rows.includes('D022-26003-02-PORT_BUILDINGS.pdf'), `${name}: find "D022" lists the D022 drawing (${dz.rows.length} rows)`, dz.rows.join(', '));
  const wc = await search('WC');
  ok(wc.refs.filter(r => /^WC/.test(r)).length >= 3 && !wc.over, `${name}: find "WC" lists the WC photographs by reference (${wc.refs.length} references)`, wc.refs.join(', '));
  const upl = await p.evaluate(() => { const d = docCollection().items.filter(x => x.source === 'uploaded' && x.category !== 'Photographs' && !x.twin_of && x._up && x._up.uploaded).sort((a, b) => String(b._up.uploaded).localeCompare(String(a._up.uploaded)))[0]; return d ? {id: d.id, q: String(d.title).split(/\s+/).slice(0, 4).join(' ')} : null; });
  const us = upl ? await search(upl.q) : {rows: []};
  ok(upl && us.rows.includes(upl.id), `${name}: an uploaded file is found by its title ("${upl && upl.q}" finds ${upl && upl.id})`, us.rows.join(', '));
  const shown = await p.evaluate(async () => {
    const q = document.getElementById('docQ815'); q.value = 'WC'; q.dispatchEvent(new Event('input')); await new Promise(r => setTimeout(r, 450));
    const b = document.querySelector('#docsec-results [data-showref815^="WC"]'); const ref = b.dataset.showref815; b.click(); await new Promise(r => setTimeout(r, 500));
    const f = document.querySelector(`#pane-docs [data-fold815="ph:${ref}"]`);
    return {ref, tile: state.docTile815, open: !!(f && f.open), photos: f ? f.querySelectorAll('[data-doc815]').length : 0, hash: location.hash};
  });
  ok(shown.tile === 'photos' && shown.open && shown.photos > 0, `${name}: Show on ${shown.ref} opens Photos at that reference (${shown.photos} photos)`, JSON.stringify(shown));
  await p.evaluate(() => { const q = document.getElementById('docQ815'); q.value = ''; q.dispatchEvent(new Event('input')); state.docTile815 = null; state.docOpen815 = {}; });
  await wait(300);

  // Recent: the last 5 uploads, newest first
  const rc = await p.evaluate(() => { paintDocs815(); const box = document.querySelector('#pane-docs .recent815'); const ids = box ? [...box.querySelectorAll('[data-doc815]')].map(e => e.dataset.doc815) : [];
    const want = docCollection().items.filter(d => d._up && d._up.uploaded).sort((a, b) => String(b._up.uploaded).localeCompare(String(a._up.uploaded))).slice(0, 5).map(d => d.id); return {ids, want}; });
  ok(rc.ids.length === 5 && JSON.stringify(rc.ids) === JSON.stringify(rc.want), `${name}: Recent is the last 5 uploads, newest first`, rc.ids.join(', '));

  // the merged pre-start's note, folded behind Details
  const nt = await p.evaluate(async () => {
    state.docTile815 = null; paintDocs815(); document.querySelector('[data-tile815="packs"]').click(); await new Promise(r => setTimeout(r, 300));
    const tw = docCollection().items.find(d => d.twin_of); const row = [...document.querySelectorAll('#docsec-packs [data-doc815]')].find(e => e.dataset.doc815 === tw.id);
    const btn = row && row.querySelector('[data-note815]'), n = row && row.querySelector('.note815'); const hiddenFirst = !!(n && !n.getClientRects().length);
    if (row) row.closest('details').open = true; if (btn) btn.click();
    const r = {id: tw.id, hiddenFirst, shown: !!(n && n.getClientRects().length), text: n ? n.textContent : '', want: tw.note, label: btn ? btn.textContent : ''};
    if (btn) btn.click(); state.docTile815 = null; paintDocs815(); return r; });
  ok(nt.hiddenFirst && nt.shown && nt.text === nt.want && nt.label === 'Less', `${name}: Details on a merged pre-start unfolds the catalogue's note (${nt.id})`, JSON.stringify(nt).slice(0, 300));

  // the deep links
  for (const [h, k] of [['docs/swms', 'swms'], ['docs/transport', 'transport'], ['docs/maps', 'maps'], ['docs/packs', 'packs'], ['docs/photos', 'photos'], ['docs/dockets', 'dockets'], ['docs/fencing', 'maps']]) {
    await p.evaluate(() => go('today')); await wait(600);
    await p.evaluate(h => { location.hash = h; }, '#' + h); await wait(1200);
    const r = await p.evaluate(() => ({tab: state.tab, tile: state.docTile815, box: !!document.querySelector('#pane-docs .static815[id^="docsec-"]:not(#docsec-results)'), on: (document.querySelector('#pane-docs .tile815.on815') || {dataset: {}}).dataset.tile815}));
    ok(r.tab === 'docs' && r.tile === k && r.on === k && r.box, `${name}: #${h} opens Documents on ${k}`, JSON.stringify(r));
  }
  // the Fencing tab's own "Open the plan on the Documents tab" buttons, pressed for real
  const fen = await p.evaluate(async () => {
    go('fencing'); await new Promise(r => setTimeout(r, 1200));
    const btns = [...document.querySelectorAll('#pane-fencing .planupd [data-go="docs"]')], out = {buttons: btns.length, words: btns.map(b => b.textContent.trim()), lands: []};
    for (let i = 0; i < btns.length; i++) {
      if (i) { go('fencing'); await new Promise(r => setTimeout(r, 900)); }
      const b = document.querySelectorAll('#pane-fencing .planupd [data-go="docs"]')[i]; b.click(); await new Promise(r => setTimeout(r, 900));
      const h = document.getElementById('docsub815-fencing'), m = document.querySelector('main');
      out.lands.push({tab: state.tab, tile: state.docTile815, plans: h ? h.nextElementSibling.querySelectorAll('[data-doc815]').length : 0, dockets: !!document.getElementById('docsec-dockets'),
        top: h ? Math.round(h.getBoundingClientRect().top - (m ? Math.max(0, m.getBoundingClientRect().top) : 0)) : null});
    }
    return out; });
  ok(fen.buttons >= 1 && fen.words.every(w => /Open the plan/.test(w)) && fen.lands.every(l => l.tab === 'docs' && l.tile === 'maps' && l.plans >= 5 && !l.dockets && l.top !== null && l.top < 450),
    `${name}: the Fencing tab's ${fen.buttons} "Open the plan" button(s) land on the fencing plans under Drawings, not the signed dockets`, JSON.stringify(fen));
  const inv = await p.evaluate(async () => { location.hash = '#docs/invoices'; await new Promise(r => setTimeout(r, 1200)); const f = document.getElementById('flash'); return {tab: state.tab, flash: f ? f.textContent : ''}; });
  ok(inv.tab === 'docs' && /no files to show/.test(inv.flash), `${name}: #docs/invoices with no invoices opens Documents and says so`, JSON.stringify(inv));
  const tap = await p.evaluate(async () => { location.hash = '#docs'; await new Promise(r => setTimeout(r, 900)); state.docTile815 = null; paintDocs815();
    document.querySelector('#pane-docs [data-tile815="transport"]').click(); await new Promise(r => setTimeout(r, 300)); const h1 = location.hash;
    document.querySelector('#pane-docs [data-tile815="transport"]').click(); await new Promise(r => setTimeout(r, 300)); return {h1, h2: location.hash, tile: state.docTile815}; });
  ok(tap.h1 === '#docs/transport' && tap.h2 === '#docs' && tap.tile === null, `${name}: a card opens with its own address, a second press closes it`, JSON.stringify(tap));

  // the header search, used as a person uses it: type, then press the result
  const header = async (q, pickTitle) => p.evaluate(async ([q, pickTitle]) => {
    if (state.tab !== 'docs') { go('docs'); await new Promise(r => setTimeout(r, 600)); }
    let opened = null; const wo = window.open; window.open = u => { opened = u; return null; };
    const box = document.getElementById('q'); box.value = q; box.dispatchEvent(new Event('input', {bubbles: true})); await new Promise(r => setTimeout(r, 500));
    const rows = [...document.querySelectorAll('#finder .fi.doc')], row = rows.find(r => (r.querySelector('b') || {}).textContent === pickTitle);
    const words = row ? row.querySelector('.fiw').textContent : '';
    if (row) row.click(); await new Promise(r => setTimeout(r, 900)); window.open = wo;
    const cur = document.querySelector('#pane-docs [data-doc815][aria-current]');
    return {found: !!row, docRows: rows.length, words, opened, tab: state.tab, q: state.docQ815, current: cur ? cur.dataset.doc815 : null, focused: !!(cur && document.activeElement === cur),
      inView: cur ? (() => { const b = cur.getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight; })() : false};
  }, [q, pickTitle]);
  const H = await p.evaluate(() => { const C = docCollection().items, tw = C.find(d => d.twin_of), miss = C.find(d => d.availability === 'missing' && /SWMS/.test(d.id)), avail = C.find(d => d.source === 'catalogue' && d.availability === 'ready' && /SWMS/.test(d.id));
    return {tw: {id: tw.id, title: tw.title}, miss: {id: miss.id, title: miss.title}, avail: {id: avail.id, title: avail.title}}; });
  const enc = id => [id, encodeURIComponent(id)];
  const h1 = await header(H.tw.title, H.tw.title);
  ok(h1.found && /opens the file/.test(h1.words) && h1.opened && enc(H.tw.id).some(x => h1.opened.includes(x)), `${name}: header search, merged pre-start: it says "opens the file" and pressing it opens the one uploaded file`, JSON.stringify(h1));
  const h2 = await header(H.miss.title, H.miss.title);
  ok(h2.found && !h2.opened && h2.tab === 'docs' && h2.q === H.miss.title && h2.current === H.miss.id && h2.focused && h2.inView, `${name}: header search, not-uploaded SWMS: lands on Documents with that row marked, in view, keyboard on it`, JSON.stringify(h2));
  const h3 = await header(H.avail.title, H.avail.title);
  ok(h3.found && h3.opened && enc(H.avail.id).some(x => h3.opened.includes(x)), `${name}: header search, an available original opens its file`, JSON.stringify(h3));
  const hf = await p.evaluate(() => finderMatches('SWMS').filter(x => x.kind === 'doc').length);
  ok(hf >= 5, `${name}: the header search lists ${hf} documents for "SWMS" (was capped at 4)`);
  await p.evaluate(() => { state.docQ815 = ''; state.docTile815 = null; paintDocs815(); });

  // a file filed against a reference keeps its link to that reference (upload records ref for maps and invoices)
  const rl = await p.evaluate(async () => { const out = {};
    for (const [cat, ref] of [['Maps and drawings', 'P03'], ['Invoices', 'P03'], ['Maps and drawings', 'NOSUCHREF']]) {
      const html = row815({id: 'test815.pdf', title: 'Filed against ' + ref, category: cat, ref, availability: 'ready', source: 'uploaded', ext: 'pdf'});
      const b = document.createElement('div'); b.innerHTML = '<ul>' + html + '</ul>'; document.getElementById('pane-docs').appendChild(b); wireDocs815(document.getElementById('pane-docs'), [], true);
      let got = null; const was = window.openAsset; window.openAsset = k => { got = k; }; const btn = b.querySelector('[data-open815]'); if (btn) btn.click(); window.openAsset = was; b.remove();
      out[cat + ' ' + ref] = {says: /filed against/.test(html) && html.includes('>' + ref + '<'), opens: got}; }
    out.realRows = docCollection().items.filter(d => d.ref && d.category !== 'Photographs').length; return out; });
  ok(Object.entries(rl).filter(([k]) => k !== 'realRows').every(([k, v]) => v.says && v.opens === k.split(' ').pop()), `${name}: a map or invoice filed against a reference says so and the reference opens it, known or not (${rl.realRows} such files in the record now)`, JSON.stringify(rl));

  // motion: the opening card eases in, unless the page's motion setting is off or the device asks for reduced motion
  const anim = async () => p.evaluate(async () => { state.docTile815 = null; paintDocs815(); document.querySelector('#pane-docs [data-tile815="swms"]').click(); await new Promise(r => setTimeout(r, 50));
    const el = document.getElementById('docsec-swms'); return el ? getComputedStyle(el).animationName : 'missing'; });
  const a1 = await anim();
  await p.evaluate(() => document.documentElement.setAttribute('data-motion', 'off')); const a2 = await anim(); await p.evaluate(() => document.documentElement.removeAttribute('data-motion'));
  await p.emulateMedia({reducedMotion: 'reduce'}); const a3 = await anim(); await p.emulateMedia({reducedMotion: 'no-preference'});
  ok(a1 === 'paneIn' && a2 === 'none' && a3 === 'none', `${name}: the open card eases in; not with Motion off or reduced motion (${a1} / ${a2} / ${a3})`);

  // the edit link: "+ Add" with the form behind it, and the reason a red file is red (flags flipped in this browser only)
  const ed = await p.evaluate(async () => {
    const was = SYNC.readonly; SYNC.readonly = false; document.body.classList.remove('viewonly'); state.docTile815 = 'maps'; renderDocs();
    const add = document.getElementById('docAdd815'), card = document.getElementById('docAddCard'); const r = {add: !!add, hiddenFirst: card ? card.hidden : null};
    if (add) { add.click(); await new Promise(x => setTimeout(x, 100)); r.shown = !card.hidden; r.kind = (document.getElementById('docKind') || {}).value; r.upload = !!document.getElementById('docUpload'); r.file = !!document.getElementById('docFile'); add.click(); }
    r.why = document.querySelectorAll('#docsec-maps .anos.editonly').length; r.remove = document.querySelectorAll('#pane-docs [data-delfile]').length;
    SYNC.readonly = was; if (was) document.body.classList.add('viewonly'); state.docAdd815 = false; renderDocs(); r.viewWhy = [...document.querySelectorAll('#pane-docs .anos.editonly')].filter(e => e.offsetParent).length; r.viewAdd = !!document.getElementById('docAdd815');
    r.viewRemove = document.querySelectorAll('#pane-docs [data-delfile]').length; return r; });
  ok(ed.add && ed.hiddenFirst === true && ed.shown && ed.kind === 'map' && ed.upload && ed.file && ed.why === 2 && ed.remove > 0 && !ed.viewWhy && !ed.viewAdd && !ed.viewRemove,
    `${name}: edit link: + Add opens the upload form set to the open card, Remove is offered, the reason a file is red shows; none of it on the view link`, JSON.stringify(ed));

  // speed: opening the tab, median of 6, against live's
  const open6 = await p.evaluate(async () => { const t = []; for (let i = 0; i < 6; i++) { go('today'); await new Promise(x => setTimeout(x, 200)); const a = performance.now(); go('docs'); t.push(performance.now() - a); await new Promise(x => setTimeout(x, 200)); } t.sort((a, b) => a - b); return Math.round((t[2] + t[3]) / 2); });
  ok(open6 <= L.open * 1.1, `${name}: the tab opens as fast as live (median of 6: live ${L.open} ms, v8.15 ${open6} ms)`);

  ok(!s.errors.length, `${name}: no page errors`, s.errors.join(' | '));
  await s.browser.close(); return {paneH: t.paneH, firstOpenY: t.firstOpenY, open: open6, press: R.press};
}

(async () => {
  const report = {};
  // the colours: every colour v815.css names is one the page already uses
  const css = fs.readFileSync(path.join(__dirname, '..', 'v815.css'), 'utf8'), base = fs.readFileSync(BASE, 'utf8');
  const cols = [...new Set(css.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g) || [])], newCols = cols.filter(c => !base.includes(c));
  ok(!newCols.length, `style: every colour in v815.css is already on the page (${cols.length}: ${cols.join(' ')})`, newCols.join(' '));
  ok(!/font-family|@font-face|@import/.test(css), 'style: no new font');
  if (!ONLY || ONLY === 'paper') {
    console.log('\n== paper (page.pdf, A4)');
    const a = await paper(BASE, 'live_ctrlp'), b = await paper(BUILD, 'v815_ctrlp'), c = await paper(BUILD, 'v815_button', 'button'), d = await paper(BUILD, 'v815_filtered', 'filtered');
    const tw = new Map(b.twins), txt = {b: squash(b.text), c: squash(c.text), d: squash(d.text)};
    const liveTitles = [...new Set(a.titles)], missingFrom = k => liveTitles.filter(x => !txt[k].includes(squash(x)));
    console.log(`  live: ${a.pages} pages, ${a.ids.length} files · v8.15 Ctrl+P: ${b.pages} pages, ${b.ids.length} files · button: ${c.pages} pages · filtered view: ${d.pages} pages`);
    const lost = a.ids.filter(id => !b.ids.includes(id) && !(tw.has(id) && b.ids.includes(tw.get(id))));
    ok(b.pages > 0 && !lost.length && !b.screenCards, `paper, Ctrl+P from the tab as it opens: every file live prints is on v8.15's paper (${a.ids.length} live -> ${b.ids.length}), no screen cards`, lost.join(', '));
    ok(!missingFrom('b').length, `paper, Ctrl+P: the PDF itself carries every title live's PDF does (${liveTitles.length})`, missingFrom('b').slice(0, 8).join(' | '));
    ok(c.button.found && c.button.called === 1 && /Print/.test(c.button.text), `paper, the Print the list button calls the browser's print once`, JSON.stringify(c.button));
    ok(c.pages === b.pages && JSON.stringify(c.ids) === JSON.stringify(b.ids) && !missingFrom('c').length, `paper, the button's PDF is the same as Ctrl+P's (${c.pages} pages, ${c.ids.length} files)`);
    ok(d.pages === b.pages && JSON.stringify(d.ids) === JSON.stringify(b.ids) && !missingFrom('d').length && JSON.stringify(d.before) === JSON.stringify(d.after) && d.after.q === 'WC' && d.after.results,
      `paper, Ctrl+P with a search typed and a fold open still prints the whole list, and the screen is left as it was`, JSON.stringify({pages: d.pages, before: d.before, after: d.after}));
    ok(b.pages <= a.pages, `paper: no more pages than live (${a.pages} -> ${b.pages})`);
    ok(![a, b, c, d].some(x => x.errors.length), 'paper: no page errors', [a, b, c, d].map(x => x.errors.join('; ')).join(' | '));
    report.paper = {live: {pages: a.pages, files: a.ids.length}, v815_ctrlp: {pages: b.pages, files: b.ids.length}, v815_button: {pages: c.pages, files: c.ids.length}, v815_filtered: {pages: d.pages, files: d.ids.length}, pdfdir: PDFDIR};
  }
  for (const [name, dev] of [['desktop', {W: 1440, H: 900}], ['phone', {W: 390, H: 844, dpr: 2, mobile: true}]]) {
    if (ONLY && ONLY !== name) continue;
    console.log(`\n== ${name}`);
    const L = await live(dev);
    ok(!L.errors.length, `${name}: live opens with no page errors`, L.errors.join(' | '));
    const B = await build(dev, L, name);
    report[name] = {before: {paneH: L.paneH, firstOpenY: L.firstOpenY, open: L.open}, after: B};
    console.log(`  height of the tab as it opens: ${L.paneH} px -> ${B.paneH} px; first Open button ${L.firstOpenY} px -> ${B.firstOpenY} px down the tab`);
    ok(B.paneH < L.paneH / 4, `${name}: the tab as it opens is under a quarter of its old height`);
  }
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(report, null, 1));
  console.log(`\n${passes} passed, ${fails} failed`); console.log(fails ? 'FAILED' : 'ALL PASSED'); process.exitCode = fails ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
