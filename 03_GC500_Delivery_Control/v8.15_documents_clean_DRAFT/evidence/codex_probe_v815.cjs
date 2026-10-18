// Author: Andrew Fisher. Codex's seven v8.15 review checks (review_v815_release/evidence/probe.cjs, commit eafb37e),
// run against the CORRECTED source. Same synthetic fixture, same doubles, same seven questions; the assertions are the
// fixed state instead of the defect. No browser, network, credentials, operational records or writes.
//
// Codex's own probe refuses any bytes but the frozen 968aefb source, so it is run unchanged on that snapshot (it must
// still reproduce all seven) and this one runs the same checks on the source being handed over. The functions the patch
// changes in the page (docCollection's hook, finderIndex, finderPick) are taken from the BUILT page, not re-typed here.
//
//   node codex_probe_v815.cjs --source-dir v8.15_documents_clean_DRAFT --built build/GC500_v8.15/GC500_Delivery_Control_hosted.html \
//        --baseline <review_v815_release/evidence/baseline_v813.json> [--out result.json]
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i];
  assert.ok(['--source-dir', '--built', '--baseline', '--out'].includes(key) && process.argv[i + 1], 'Usage: node codex_probe_v815.cjs --source-dir DRAFT --built PAGE --baseline baseline_v813.json [--out result.json]');
  args[key.slice(2)] = process.argv[i + 1];
}
assert.ok(args['source-dir'] && args.built && args.baseline, '--source-dir, --built and --baseline are required');
const sha = v => crypto.createHash('sha256').update(v).digest('hex');
const src = fs.readFileSync(path.join(args['source-dir'], 'docs815_src.js'), 'utf8');
const css = fs.readFileSync(path.join(args['source-dir'], 'v815.css'), 'utf8');
const patch = fs.readFileSync(path.join(args['source-dir'], 'patch_v815.py'), 'utf8');
const built = fs.readFileSync(args.built, 'utf8');
const baselineBytes = fs.readFileSync(args.baseline);
assert.equal(sha(baselineBytes), '6ff6b78ac55daf080952bd3792d1e192158db60a9dbffa2207e62cd7056c76f7', 'Codex baseline excerpts');
const baseline = JSON.parse(baselineBytes);
for (const s of Object.values(baseline.sections)) assert.equal(sha(s.source), s.sha256);
assert.ok(built.includes(src.trim().slice(0, 4000)), 'the built page carries this docs815_src.js');
// a function as the built page has it: from its declaration to the text that followed the same function in v8.13
function fromBuilt(name, tail) {
  const at = built.indexOf('function ' + name + '('); assert.ok(at >= 0, 'built page has ' + name);
  const end = built.indexOf(tail, at); assert.ok(end > at, 'end of ' + name); return built.slice(at, end);
}
const tails = {docCollection: '/* v5.91 - the photographs on ', finderIndex: 'function finderMatches(q){', finderPick: '/* Take the map to one place: '};
const fnBuilt = Object.fromEntries(Object.entries(tails).map(([n, t]) => [n, fromBuilt(n, t)]));
assert.ok(fnBuilt.docCollection.includes('twins815(items);'), 'built docCollection merges twins');

// The same invented fixture as Codex's probe.cjs (no operational data).
const catalogue = Array.from({length: 5}, (_, i) => {
  const day = String(14 + i), id = 'Synthetic_Prestart_Advanced_Fencing_2026-09-' + day + '.pdf';
  return {id, name: id, title: 'Synthetic pre-start ' + day, kind: 'pack', group: 'packs', pages: 1, paper: 'A4', ext: 'pdf', note: 'Synthetic retained context for day ' + day};
});
const uploads = catalogue.map((d, i) => { const id = d.id.replace('Advanced_Fencing', 'ATF');
  return {id, name: id, title: 'Synthetic uploaded pre-start ' + (14 + i), kind: 'pack', uploaded: '2026-09-' + (14 + i) + 'T00:00:00Z', by: 'Synthetic operator'}; });
uploads.push(...Array.from({length: 5}, (_, i) => ({id: 'synthetic_recent_' + i + '.pdf', name: 'synthetic_recent_' + i + '.pdf', title: 'Synthetic recent ' + i, kind: 'pack', uploaded: '2026-10-02T00:0' + i + ':00Z', by: 'Synthetic operator'})));
catalogue.push({id: 'synthetic_missing_swms.pdf', name: 'synthetic_missing_swms.pdf', title: 'Synthetic unavailable SWMS', kind: 'swms', group: 'swms', doc_type: 'swms', ext: 'pdf'});
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const ctx = {
  DATA: {docs: {docs: catalogue}, sheets: []}, state: {tab: 'docs'},
  DOCS: {state: 'ready', at: 1, files: Object.fromEntries(uploads.map(f => [f.id, f]))},
  SYNC: {readonly: true, backend: {fileUrl: id => 'https://example.invalid/files/' + encodeURIComponent(id)}},
  DOC_IMG: /\.(jpe?g|png|webp|gif|heic|heif|bmp|tiff?)$/i,
  DOC_CATS: ['SWMS & safety plan', 'Transport & lifting', 'Maps and drawings', 'Packs', 'Fencing dockets', 'Photographs', 'Invoices'],
  isDropPhotoName: () => false, docketNoInName: () => null,
  fmtNum: String, fmtStamp: String, fmtDay: s => ({dm: s}), fmtBytes: String,
  refPlate: s => '<span class="rplate">' + esc(s) + '</span>', esc,
  BRANCHES: {branches: []}, branchName: () => '', allDockets: () => [], serviceNoteRows: () => [], collectionRows: () => [], assetOf: r => ({key: r}),
  docTypeOf: d => ({key: d.doc_type, label: 'Safety document'}), allAssets: () => [], allUnits: () => [],
  // page globals the corrected source reads (the lamp parts and the tab glyphs are drawn by the page itself)
  TAB_GLYPH: {docs: '<path/>'}, LAMP_SIZE: {sm: [78, 30]}, lampSvgLite: () => '<svg class="hz lite"></svg>'
};
vm.createContext(ctx);
const run = name => vm.runInContext(baseline.sections[name].source, ctx);
['docHref', 'docAvailability', 'docPhotoPreview', 'docCatOf', 'docCard'].forEach(run);  // unchanged by v8.15
vm.runInContext(src, ctx);
vm.runInContext(fnBuilt.docCollection, ctx); vm.runInContext(fnBuilt.finderIndex, ctx);
const coll = ctx.docCollection(), twins = coll.items.filter(d => d.twin_of), by = ctx.tileItems815(coll.items);
assert.equal(twins.length, 5, 'Five intended synthetic twins merge');
const rows = [];
const check = (name, fixed, detail) => rows.push({name, fixed: !!fixed, detail});

// 1. native print: the whole list is on the page whatever the screen shows; print CSS shows it and hides the screen cards
const defaultBody = ctx.bodyHtml815(coll.items, by, null), printHtml = ctx.printList815(by);
const nonPhoto = coll.items.filter(d => d.category !== 'Photographs').map(d => d.id);
const printed = [...printHtml.matchAll(/data-print815="([^"]+)"/g)].map(m => m[1].replace(/&amp;/g, '&'));
const n1 = {defaultScreenRows: (defaultBody.match(/data-doc815=/g) || []).length, printRows: printed.length, everyFileOnPaper: nonPhoto.every(id => printed.includes(id)),
  printCssShowsList: /@media print\{[^]*#pane-docs \.print815\{display:block!important\}/.test(css), printCssHidesScreenBody: /@media print\{[^]*#pane-docs #docBody815[^}]*display:none!important/.test(css),
  dependsOnButtonFlag: /docPrint815/.test(src + css + patch), listAlwaysRendered: /\$\{printList815\(by\)\}/.test(src)};
check('Native print has every document row from the initial body', n1.printRows === nonPhoto.length && n1.everyFileOnPaper && n1.printCssShowsList && n1.printCssHidesScreenBody && !n1.dependsOnButtonFlag && n1.listAlwaysRendered, n1);

// 2-3. a map or invoice filed against a reference keeps it, and the reference opens its drawer
for (const [kind, category] of [['map', 'Maps and drawings'], ['invoice', 'Invoices']]) {
  const d = {id: 'synthetic_reference_' + kind + '.pdf', title: 'Synthetic ' + kind, kind, category, group: kind === 'invoice' ? 'invoices' : 'uploaded', source: 'uploaded', ref: 'TEST42', availability: 'ready'};
  ctx.DOCS.files[d.id] = {id: d.id};
  const oldRow = ctx.docCard(d, ctx.DOCS.files[d.id]), newRow = ctx.row815(d), href = ctx.docHref(d);
  const dd = {kind, oldShowsReference: oldRow.includes('TEST42'), oldHasDrawerAction: oldRow.includes('data-open="TEST42"'),
    newShowsReference: newRow.includes('TEST42'), newHasDrawerAction: newRow.includes('data-open815="TEST42"'), newSaysFiledAgainst: newRow.includes('filed against'),
    oldOpenUrlPreserved: oldRow.includes(href), newOpenUrlPreserved: newRow.includes(href)};
  // and a reference that is not a current asset still shows, as the old card did
  ctx.assetOf = () => null; dd.unknownReferenceShown = ctx.row815(d).includes('data-open815="TEST42"'); ctx.assetOf = r => ({key: r});
  check('Recorded reference kept on the ' + kind + ' row', dd.newShowsReference && dd.newHasDrawerAction && dd.newSaysFiledAgainst && dd.newOpenUrlPreserved && dd.unknownReferenceShown, dd);
  delete ctx.DOCS.files[d.id];
}

// 4. "Open the plan on the Documents tab" goes to the plans, the signed papers keep their own route
const plan = {buttonAsksForPlan: baseline.sections.planUpdateCardBefore803.source.includes('Open the plan on the Documents tab'),
  callerRequestsFencing: baseline.planCaller.includes("state.docsec = 'fencing'"),
  actualDestination: vm.runInContext('DOCSEC815.fencing', ctx), scrollsTo: vm.runInContext('DOCSEC_AT815.fencing', ctx), docketsRoute: vm.runInContext('DOCSEC815.dockets', ctx),
  plansHeadingRendered: ctx.catBody815('maps', [{id: 'p.pdf', title: 'Fencing plan', category: 'Maps and drawings', group: 'fencing', availability: 'ready'}]).includes('id="docsub815-fencing"')};
check('Existing plan button opens the fencing plans under Drawings', plan.buttonAsksForPlan && plan.callerRequestsFencing && plan.actualDestination === 'maps' && plan.scrollsTo === 'docsub815-fencing' && plan.docketsRoute === 'dockets' && plan.plansHeadingRendered, plan);

// 5-6. the header search, through the real (patched) finderPick
let opened = null;
ctx.$ = s => s === '#q' ? {value: '', blur() {}} : {hidden: false};
ctx.document = {body: {classList: {remove() {}}}};
ctx.finderClose = () => {}; ctx.go = tab => { ctx.state.tab = tab; };
ctx.window = {open(u) { opened = u; }};
vm.runInContext(fnBuilt.finderPick, ctx);
for (const [label, catId, resolved] of [['merged twin', twins[0].twin_of, twins[0].id], ['missing original', 'synthetic_missing_swms.pdf', 'synthetic_missing_swms.pdf']]) {
  const idx = ctx.finderIndex().filter(d => d.kind === 'doc'), item = idx.find(d => d.title === coll.items.find(x => x.id === resolved).title);
  assert.ok(item, 'header index has the document');
  opened = null; ctx.FINDER = {list: [item]}; ctx.state.docTile815 = null; ctx.state.docQ815 = ''; ctx.state.docSel815 = null; ctx.state.tab = 'today';
  ctx.finderPick(0);
  const body = ctx.bodyHtml815(coll.items, by, ctx.find815(coll.items, ctx.state.docQ815));
  const rowsFound = [...body.matchAll(/data-doc815="([^"]+)"/g)].map(m => m[1]);
  const dd = {catalogueId: catId, indexedId: item.id, resolvedId: resolved, oldIdStillIndexed: idx.some(d => d.id === catId && catId !== resolved),
    resolvedHref: ctx.docHref({id: resolved}), opened, tab: ctx.state.tab, query: ctx.state.docQ815, selected: ctx.state.docSel815, selectedDocumentRendered: rowsFound.includes(resolved), rowsFound: rowsFound.length};
  const fixed = label === 'merged twin'
    ? dd.indexedId === resolved && !dd.oldIdStillIndexed && dd.opened === dd.resolvedHref
    : dd.tab === 'docs' && dd.query === item.title && dd.selected === resolved && dd.selectedDocumentRendered && !dd.opened;
  check('Header selection reaches the ' + label, fixed, dd);
}

// 7. the merged document keeps the catalogue's note, and it is searchable and shown behind Details
const notes = twins.map(d => { const c = catalogue.find(x => x.id === d.twin_of), row = ctx.row815(d);
  return {oldId: d.twin_of, mergedId: d.id, originalNoteRetained: d.note === c.note, inRow: row.includes(esc(c.note)) && row.includes('data-note815'),
    searchable: (ctx.find815(coll.items, 'retained context for day ' + d.twin_of.slice(-6, -4)) || []).some(x => x.id === d.id)}; });
check('All five merged catalogue notes are kept', notes.every(n => n.originalNoteRetained && n.inRow && n.searchable), notes);

const result = {author: 'Andrew Fisher', reviewedBy: 'Codex review eafb37e, review_v815_release (checks 1-7)',
  sourceFiles: {'docs815_src.js': sha(src), 'v815.css': sha(css), 'patch_v815.py': sha(patch)}, builtPage: sha(built), baselineExcerptSha256: sha(baselineBytes),
  fixture: 'Codex\'s invented documents, notes, uploads and example.invalid URLs; no operational data.',
  checks: rows.length, fixed: rows.filter(r => r.fixed).length, allFixed: rows.every(r => r.fixed), rows};
if (args.out) fs.writeFileSync(args.out, JSON.stringify(result, null, 2) + '\n');
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exitCode = result.allFixed && rows.length === 7 ? 0 : 1;
