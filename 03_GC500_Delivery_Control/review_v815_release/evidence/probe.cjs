// Author: Andrew Fisher. Portable, synthetic-only source regression reproduction.
// No browser, network, credentials, operational records or implementation writes.
'use strict';
const fs = require('node:fs'), path = require('node:path');
const vm = require('node:vm'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i];
  assert.ok(['--source-dir', '--baseline', '--out'].includes(key) && process.argv[i + 1],
    'Usage: node probe.cjs --source-dir FROZEN_DRAFT --baseline baseline_v813.json [--out result.json]');
  args[key.slice(2)] = process.argv[i + 1];
}
assert.ok(args['source-dir'] && args.baseline, '--source-dir and --baseline are required; no private defaults');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const expected = {
  'docs815_src.js': '4e482531fca0aac3859966ab3bf4bf29bc42f179764eb171c10b00a9ab1ae5dc',
  'v815.css': 'f2a079e3bb8f55528cd57c1409d7ff800ad8056ff58b39170e61982a9d4600e5',
  'patch_v815.py': 'b1efdd24395bd70d06e19f5da98452a443f30b43b30e2f4292147626b69e6a6b'
};
const sources = {};
for (const [name, hash] of Object.entries(expected)) {
  const bytes = fs.readFileSync(path.join(args['source-dir'], name));
  assert.equal(sha(bytes), hash, 'Use the exact reviewed 968aefb source: ' + name);
  sources[name] = bytes.toString('utf8');
}
const baselineBytes = fs.readFileSync(args.baseline);
assert.equal(sha(baselineBytes), '6ff6b78ac55daf080952bd3792d1e192158db60a9dbffa2207e62cd7056c76f7', 'Reviewed baseline excerpts');
const baseline = JSON.parse(baselineBytes);
for (const section of Object.values(baseline.sections)) assert.equal(sha(section.source), section.sha256);
const src = sources['docs815_src.js'], css = sources['v815.css'], patch = sources['patch_v815.py'];
assert.ok(patch.includes('twins815(items); /* v8.15 - a catalogue entry with no file and its uploaded copy are one document */'),
  'The reviewed patch inserts the exact collection hook used below');

// These documents, notes, uploads, references and URLs are invented fixtures.
// The five names intentionally exercise the implementation's ATF alias pattern.
const catalogue = Array.from({length: 5}, (_, i) => {
  const day = String(14 + i), id = 'Synthetic_Prestart_Advanced_Fencing_2026-09-' + day + '.pdf';
  return {id, name: id, title: 'Synthetic pre-start ' + day, kind: 'pack', group: 'packs',
    pages: 1, paper: 'A4', ext: 'pdf', note: 'Synthetic retained context for day ' + day};
});
const uploads = catalogue.map((d, i) => {
  const id = d.id.replace('Advanced_Fencing', 'ATF');
  return {id, name: id, title: 'Synthetic uploaded pre-start ' + (14 + i), kind: 'pack',
    uploaded: '2026-09-' + (14 + i) + 'T00:00:00Z', by: 'Synthetic operator'};
});
// Five newer, unrelated uploads ensure Recent cannot accidentally include the chosen twin.
uploads.push(...Array.from({length: 5}, (_, i) => ({id: 'synthetic_recent_' + i + '.pdf',
  name: 'synthetic_recent_' + i + '.pdf', title: 'Synthetic recent ' + i, kind: 'pack',
  uploaded: '2026-10-02T00:0' + i + ':00Z', by: 'Synthetic operator'})));
catalogue.push({id: 'synthetic_missing_swms.pdf', name: 'synthetic_missing_swms.pdf',
  title: 'Synthetic unavailable SWMS', kind: 'swms', group: 'swms', doc_type: 'swms', ext: 'pdf'});
const esc = value => String(value ?? '').replace(/[&<>"']/g,
  c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const ctx = {
  DATA: {docs: {docs: catalogue}, sheets: []}, state: {tab: 'docs'},
  DOCS: {state: 'ready', files: Object.fromEntries(uploads.map(f => [f.id, f]))},
  SYNC: {readonly: true, backend: {fileUrl: id => 'https://example.invalid/files/' + encodeURIComponent(id)}},
  DOC_IMG: /\.(jpe?g|png|webp|gif|heic|heif|bmp|tiff?)$/i,
  DOC_CATS: ['SWMS & safety plan', 'Transport & lifting', 'Maps and drawings', 'Packs', 'Fencing dockets', 'Photographs', 'Invoices'],
  isDropPhotoName: () => false, docketNoInName: () => null,
  fmtNum: String, fmtStamp: String, fmtDay: s => ({dm: s}), fmtBytes: String,
  refPlate: s => '<span class="rplate">' + esc(s) + '</span>', esc,
  BRANCHES: {branches: []}, branchName: () => '', allDockets: () => [],
  serviceNoteRows: () => [], collectionRows: () => [], assetOf: r => ({key: r}),
  docTypeOf: d => ({key: d.doc_type, label: 'Safety document'}), allAssets: () => [], allUnits: () => []
};
vm.createContext(ctx);
const run = name => vm.runInContext(baseline.sections[name].source, ctx);
['docHref', 'docAvailability', 'docPhotoPreview', 'docCatOf', 'docCard', 'finderIndex'].forEach(run);
vm.runInContext(src, ctx);
const anchor = ' const byCategory = {};', collection = baseline.sections.docCollection.source;
assert.equal(collection.split(anchor).length, 2, 'Single integration hook');
vm.runInContext(collection.replace(anchor, ' twins815(items);\n' + anchor), ctx);
const coll = ctx.docCollection(), twins = coll.items.filter(d => d.twin_of), by = ctx.tileItems815(coll.items);
assert.equal(twins.length, 5, 'Five intended synthetic twins merge');
const rows = [];
function evidence(name, reproduced, detail) {
  rows.push({name, reproduced: !!reproduced, detail});
  assert.ok(reproduced, 'Frozen finding did not reproduce: ' + name);
}
const defaultBody = ctx.bodyHtml815(coll.items, by, null);
const nativePrint = {defaultRows: (defaultBody.match(/data-doc815=/g) || []).length,
  onlyRecent: !defaultBody.includes('id="docsec-') && defaultBody.includes('recent815'),
  printCssHidesRecent: /@media print\{[^]*?#pane-docs \.recent815,[^]*?display:none!important/.test(css),
  newSourceRegistersBeforeprint: /beforeprint/.test(src)};
evidence('Native print has no document rows from the initial body',
  nativePrint.defaultRows === 5 && nativePrint.onlyRecent && nativePrint.printCssHidesRecent && !nativePrint.newSourceRegistersBeforeprint, nativePrint);

for (const [kind, category] of [['map', 'Maps and drawings'], ['invoice', 'Invoices']]) {
  const d = {id: 'synthetic_reference_' + kind + '.pdf', title: 'Synthetic ' + kind,
    kind, category, group: kind === 'invoice' ? 'invoices' : 'uploaded', source: 'uploaded', ref: 'TEST42', availability: 'ready'};
  ctx.DOCS.files[d.id] = {id: d.id};
  const oldRow = ctx.docCard(d, ctx.DOCS.files[d.id]), newRow = ctx.row815(d), href = ctx.docHref(d);
  const detail = {kind, oldShowsReference: oldRow.includes('TEST42'), oldHasDrawerAction: oldRow.includes('data-open="TEST42"'),
    newShowsReference: newRow.includes('TEST42'), newHasDrawerAction: newRow.includes('data-open815="TEST42"'),
    oldOpenUrlPreserved: oldRow.includes(href), newOpenUrlPreserved: newRow.includes(href)};
  evidence('Recorded reference disappears from ' + kind + ' row',
    detail.oldShowsReference && detail.oldHasDrawerAction && !detail.newShowsReference && !detail.newHasDrawerAction && detail.oldOpenUrlPreserved && detail.newOpenUrlPreserved, detail);
}
const plan = {buttonAsksForPlan: baseline.sections.planUpdateCardBefore803.source.includes('Open the plan on the Documents tab'),
  callerRequestsFencing: baseline.planCaller.includes("state.docsec = 'fencing'"),
  actualDestination: vm.runInContext('DOCSEC815.fencing', ctx)};
evidence('Existing plan button is routed to signed dockets', plan.buttonAsksForPlan && plan.callerRequestsFencing && plan.actualDestination === 'dockets', plan);

ctx.$ = s => s === '#q' ? {value: '', blur() {}} : {hidden: false};
ctx.document = {body: {classList: {remove() {}}}};
ctx.finderClose = () => {};
ctx.go = tab => { ctx.state.tab = tab; };
ctx.window = {open() { throw Error('This unavailable-ID path should not open a URL'); }};
run('finderPick');
for (const [label, id, resolved] of [['merged twin', twins[0].twin_of, twins[0].id],
  ['missing original', 'synthetic_missing_swms.pdf', 'synthetic_missing_swms.pdf']]) {
  const item = ctx.finderIndex().find(d => d.kind === 'doc' && d.id === id);
  assert.ok(item, 'Real header index contains synthetic catalogue result');
  ctx.FINDER = {list: [item]}; ctx.state.docTile815 = null; ctx.state.docQ815 = '';
  ctx.finderPick(0);
  const body = ctx.bodyHtml815(coll.items, by, ctx.find815(coll.items, ctx.state.docQ815));
  const detail = {pickedId: id, resolvedId: resolved, pickedHref: ctx.docHref({id}), resolvedHref: ctx.docHref({id: resolved}),
    tab: ctx.state.tab, tile: ctx.state.docTile815, query: ctx.state.docQ815,
    selectedDocumentRendered: body.includes('data-doc815="' + resolved + '"')};
  evidence('Header fallback loses selected ' + label,
    detail.tab === 'docs' && !detail.tile && !detail.query && !detail.selectedDocumentRendered, detail);
}
const lostNotes = twins.map(d => ({oldId: d.twin_of, mergedId: d.id,
  originalNoteRetained: d.note === catalogue.find(c => c.id === d.twin_of).note, mergedHasNote: !!d.note}));
evidence('All five merged synthetic catalogue notes are lost', lostNotes.every(d => !d.originalNoteRetained && !d.mergedHasNote), lostNotes);
const result = {author: 'Andrew Fisher', sourceCommit: '968aefba33abd387b7b646b71340d41775679b25',
  baseSha256: baseline.baseSha256, baselineExcerptSha256: sha(baselineBytes), sourceFiles: expected,
  fixture: 'Invented documents, notes, file-index entries, operator, references and example.invalid URLs only; no operational data.',
  method: 'Exact reviewed functions, limited DOM/helper doubles, and the exact collection integration hook; no browser or network.',
  limits: 'Native print is established from rendered HTML and print CSS, not a generated PDF. Drop-photo/docket classification and geometry are not assessed.',
  regressionReproductions: rows.length, allFrozenFindingsReproduced: rows.every(r => r.reproduced), rows};
if (args.out) fs.writeFileSync(args.out, JSON.stringify(result, null, 2) + '\n');
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
