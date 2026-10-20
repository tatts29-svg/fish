// Author: Andrew Fisher. Positive checks of the corrected frozen Documents source.
// Synthetic data only; no browser, network, operational data or implementation writes.
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const crypto = require('node:crypto'), assert = require('node:assert/strict'), {spawnSync} = require('node:child_process');
const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  assert.ok(['--source-dir', '--baseline', '--current-base', '--out'].includes(process.argv[i]) && process.argv[i + 1]);
  args[process.argv[i].slice(2)] = process.argv[i + 1];
}
assert.ok(args['source-dir'] && args.baseline && args['current-base'], 'Use --source-dir ARCHIVED_DRAFT --baseline baseline_v813.json --current-base followup_e540cbc_base.json [--out result.json]');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const expected = {
  'docs815_src.js': '99b24b0ffe9abebf893004e51c074dfdde572bb4a61e5c2555f38597e9c42e10',
  'patch_v815.py': '2d0a8457f22049123ecf437c6ef05fcf9bdd781e98c8e3508783e1744ea2c161',
  'v815.css': '81c2bf72a6438adf8aaa8c6dd4072629671f01b8be4b1d4a8f34952798cd4e21'
};
const source = {};
for (const [name, hash] of Object.entries(expected)) {
  const b = fs.readFileSync(path.join(args['source-dir'], name));
  assert.equal(sha(b), hash, name + ' must be from exact e540cbc'); source[name] = b.toString('utf8');
}
const baselineBytes = fs.readFileSync(args.baseline);
assert.equal(sha(baselineBytes), '6ff6b78ac55daf080952bd3792d1e192158db60a9dbffa2207e62cd7056c76f7');
const baseline = JSON.parse(baselineBytes);
for (const s of Object.values(baseline.sections)) assert.equal(sha(s.source), s.sha256);
const currentBaseBytes = fs.readFileSync(args['current-base']);
assert.equal(sha(currentBaseBytes), '842a878f0108ac4bd0a3639d5e2bd66377115f6e5592c2a4045954c414ab3278');
const currentBase = JSON.parse(currentBaseBytes);
for (const s of Object.values(currentBase.sections)) assert.equal(sha(s.source), s.sha256);
// Parse the real Python patch; use its exact literal replacement pairs rather than hand-writing the fixes.
const parsed = spawnSync('python3', ['-c', `import ast,json,sys
t=ast.parse(open(sys.argv[1]).read()); out=[]
for n in ast.walk(t):
 if isinstance(n,ast.Call) and isinstance(n.func,ast.Name) and n.func.id=='rep':
  try: out.append({'before':ast.literal_eval(n.args[1]),'after':ast.literal_eval(n.args[2]),'label':ast.literal_eval(n.args[3])})
  except (ValueError,TypeError): pass
print(json.dumps(out))`, path.join(args['source-dir'], 'patch_v815.py')], {encoding: 'utf8'});
assert.equal(parsed.status, 0, parsed.stderr);
const edits = JSON.parse(parsed.stdout), used = [];
function correctedSection(name, labels = []) {
  let s = baseline.sections[name].source;
  for (const label of labels) {
    const edit = edits.find(e => e.label === label); assert.ok(edit, label);
    assert.equal(s.split(edit.before).length, 2, label + ' applies exactly once');
    s = s.replace(edit.before, edit.after); used.push(label);
  }
  return s;
}
const catalogue = Array.from({length: 5}, (_, i) => {
  const day = 14 + i, id = 'Synthetic_Prestart_Advanced_Fencing_2026-09-' + day + '.pdf';
  return {id, name: id, title: 'Synthetic pre-start ' + day, kind: 'pack', group: 'packs', pages: 4,
    paper: 'A4', ext: 'pdf', note: 'Synthetic basis retained for day ' + day,
    days: [{page: 3, date: '2026-09-' + day, display: 'Synthetic day ' + day}]};
});
catalogue.push({id: 'synthetic_missing_swms.pdf', name: 'synthetic_missing_swms.pdf', title: 'Synthetic unavailable SWMS',
  kind: 'swms', group: 'swms', doc_type: 'swms', ext: 'pdf'});
catalogue.push({id: 'synthetic_fencing_plan.pdf', title: 'Synthetic fencing plan', kind: 'map', group: 'fencing', ext: 'pdf'});
catalogue.push({id: 'synthetic_plate.pdf', title: 'Synthetic plate', kind: 'map', group: 'a1', ext: 'pdf'});
const uploads = catalogue.slice(0, 5).map((d, i) => ({id: d.id.replace('Advanced_Fencing', 'ATF'),
  name: d.id.replace('Advanced_Fencing', 'ATF'), title: 'Synthetic uploaded alias ' + i, kind: 'pack',
  uploaded: '2026-09-' + (14 + i) + 'T00:00:00Z', by: 'Synthetic operator'}));
uploads.push(...Array.from({length: 5}, (_, i) => ({id: 'synthetic_recent_' + i + '.pdf',
  name: 'synthetic_recent_' + i + '.pdf', title: 'Synthetic recent ' + i, kind: 'pack', uploaded: '2026-10-02T00:0' + i + ':00Z'})));
uploads.push({id: 'synthetic_fencing_plan.pdf', name: 'synthetic_fencing_plan.pdf', kind: 'map'});
uploads.push({id: 'synthetic_photo.jpg', name: 'synthetic_photo.jpg', title: 'Synthetic photo', kind: 'photo', ref: 'TEST42', uploaded: '2026-10-01T00:00:00Z'});
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const pane = {innerHTML: '', querySelectorAll() { return []; }};
const scrolls = [], opened = [], deferred = [], buttons = new Map();
const ctx = {
  DATA: {docs: {docs: catalogue}, sheets: [], event: {name: 'Synthetic event'}}, state: {tab: 'docs'},
  DOCS: {state: 'ready', at: 1, files: Object.fromEntries(uploads.map(f => [f.id, f]))},
  SYNC: {readonly: true, backend: {fileUrl: id => 'https://example.invalid/files/' + encodeURIComponent(id)}},
  DOC_IMG: /\.(jpe?g|png|webp|gif|heic|heif|bmp|tiff?)$/i,
  DOC_CATS: ['SWMS & safety plan', 'Transport & lifting', 'Maps and drawings', 'Packs', 'Fencing dockets', 'Photographs', 'Invoices'],
  isDropPhotoName: () => false, docketNoInName: () => null, fmtNum: String, fmtStamp: String,
  fmtDay: v => ({dm: v}), fmtBytes: String, esc, refPlate: v => '<span class="rplate">' + esc(v) + '</span>',
  BRANCHES: {branches: []}, branchName: () => '', allDockets: () => [], serviceNoteRows: () => [], collectionRows: () => [],
  assetOf: ref => ({key: ref}), docTypeOf: d => ({key: d.doc_type}), allAssets: () => [], allUnits: () => [],
  TAB_GLYPH: {docs: ''}, LAMP_SIZE: {sm: [1, 1]}, lampSvgLite: () => '', docsRefresh() {}, flash() {},
  setTimeout: fn => { deferred.push(fn); return deferred.length; }, clearTimeout() {},
  window: {open: (...a) => opened.push(a), print() { ctx.printCalls++; }}, printCalls: 0, markCards() {},
  document: {activeElement: null, body: {classList: {remove() {}}}, contains: () => true, querySelectorAll: () => []},
  $: selector => {
    if (selector === '#pane-docs') return pane;
    if (selector === '#q') return {value: '', blur() {}};
    if (selector === '#qx') return {hidden: false};
    const id = selector.startsWith('#') ? selector.slice(1) : '';
    if (!id || !pane.innerHTML.includes('id="' + id + '"')) return null;
    if (!buttons.has(id)) buttons.set(id, {id, value: '', focus() {}, scrollIntoView: () => scrolls.push(id)});
    return buttons.get(id);
  }
};
vm.createContext(ctx);
for (const name of ['docHref', 'docAvailability', 'docPhotoPreview', 'docCatOf', 'docCard']) vm.runInContext(correctedSection(name), ctx);
vm.runInContext(source['docs815_src.js'], ctx);
vm.runInContext(correctedSection('docCollection', ['twins in docCollection']), ctx);
vm.runInContext(correctedSection('finderIndex', ['finder doc ids', 'finder docday ids']), ctx);
vm.runInContext(correctedSection('finderPick', ['finder pick lands on the item']), ctx);
const checks = [];
function check(name, condition, detail) { checks.push({name, pass: !!condition, ...(detail === undefined ? {} : {detail})}); }
function drain() { while (deferred.length) deferred.shift()(); }
const coll = ctx.docCollection(), twins = coll.items.filter(d => d.twin_of), by = ctx.tileItems815(coll.items);
check('Five intended twins still merge once', twins.length === 5 && new Set(coll.items.map(d => d.id)).size === coll.items.length);
check('All catalogue notes and per-day pages survive merging', twins.every(d => d.note === catalogue.find(c => c.id === d.twin_of).note && d.days[0].page === 3));
check('Uploaded file identity and title alias are retained', twins.every(d => d.id.includes('_ATF_') && d.twin_title.includes('Synthetic uploaded alias') && ctx.docHref(d)));
check('Retained note and uploaded title remain searchable', ctx.find815(coll.items, 'basis retained day 14').some(d => d.id === twins[0].id) && ctx.find815(coll.items, 'uploaded alias 0').some(d => d.id === twins[0].id));
const noteRow = ctx.row815(twins[0]);
check('Retained note has a Details control and reachable note span', noteRow.includes('data-note815') && noteRow.includes('class="anos note815" hidden') && noteRow.includes(esc(twins[0].note)));

for (const kind of ['map', 'invoice']) for (const ref of ['TEST42', 'UNKNOWN99']) {
  const d = {id: 'synthetic_' + kind + '_' + ref + '.pdf', title: 'Synthetic ' + kind, source: 'uploaded',
    category: kind === 'map' ? 'Maps and drawings' : 'Invoices', kind, ref, availability: 'ready'};
  ctx.DOCS.files[d.id] = {id: d.id};
  const html = ctx.row815(d);
  check(kind + ' retains recorded reference ' + ref + ' and its open action', html.includes('filed against') && html.includes('data-open815="' + ref + '"') && html.includes(ctx.docHref(d)));
}
let selectedRef = null;
const refButton = {dataset: {open815: 'TEST42'}};
const note = {hidden: true}, noteButton = {textContent: 'Details', attributes: {},
  closest: () => ({querySelector: () => note}), setAttribute(k, v) { this.attributes[k] = v; }};
ctx.openAsset = ref => { selectedRef = ref; };
ctx.wireDocs815({querySelectorAll: selector => selector === '[data-open815]' ? [refButton] : selector === '[data-note815]' ? [noteButton] : []}, [], true);
refButton.onclick(); noteButton.onclick();
check('Reference handler calls existing drawer action', selectedRef === 'TEST42');
check('Details handler reveals the note and updates semantics', !note.hidden && noteButton.attributes['aria-expanded'] === 'true' && noteButton.textContent === 'Less');
noteButton.onclick(); check('Details handler closes the note again', note.hidden && noteButton.attributes['aria-expanded'] === 'false');

ctx.state.docsec = 'fencing'; ctx.renderDocs815(); drain();
check('Existing fencing plan route selects Drawings', ctx.state.docTile815 === 'maps' && ctx.state.docsec === null);
check('Existing fencing plan route lands on plan subgroup', pane.innerHTML.includes('id="docsub815-fencing"') && scrolls.includes('docsub815-fencing'));
check('Signed docket route remains separate', vm.runInContext('DOCSEC815.dockets', ctx) === 'dockets');

ctx.finderClose = () => {};
ctx.go = tab => { ctx.state.tab = tab; };
const index = ctx.finderIndex();
const twinEntry = index.find(d => d.kind === 'doc' && d.title === catalogue[0].title);
ctx.FINDER = {list: [twinEntry]}; ctx.finderPick(0);
check('Header twin result opens the uploaded file', twinEntry.id === twins[0].id && opened.at(-1)[0] === ctx.docHref(twins[0]));
check('Header file opens with existing safe new-window options', opened.at(-1)[1] === '_blank' && opened.at(-1)[2] === 'noopener');
const dayEntry = index.find(d => d.kind === 'docday' && d.date === '2026-09-14');
ctx.FINDER = {list: [dayEntry]}; ctx.finderPick(0);
check('Header per-day result preserves the uploaded file and page anchor', opened.at(-1)[0] === ctx.docHref(twins[0]) + '#page=3');
const miss = index.find(d => d.id === 'synthetic_missing_swms.pdf');
ctx.state.docTile815 = 'transport'; ctx.state.docQ815 = 'old filter'; ctx.FINDER = {list: [miss]}; ctx.finderPick(0);
check('Missing header result clears unrelated category and selects its title', ctx.state.docTile815 === null && ctx.state.docQ815 === miss.title && ctx.state.docSel815 === miss.id && ctx.state.tab === 'docs');
const body = ctx.bodyHtml815(coll.items, by, ctx.find815(coll.items, ctx.state.docQ815));
check('Missing header result is rendered in the destination', body.includes('data-doc815="' + miss.id + '"'));
const focusRow = {dataset: {doc815: miss.id}, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, scrollIntoView() { this.scrolled = true; }, focus() { this.focused = true; }};
ctx.document.querySelectorAll = () => [focusRow]; ctx.selRow815(); drain();
check('Missing selected row receives current/focus/scroll treatment', focusRow.attrs['aria-current'] === 'true' && focusRow.tabIndex === -1 && focusRow.scrolled && focusRow.focused);
ctx.document.querySelectorAll = () => [];

ctx.state.docTile815 = null; ctx.state.docQ815 = ''; ctx.renderDocs815();
const initialPrint = ctx.printList815(ctx.tileItems815(ctx.docCollection().items));
check('Full print list is present on initial render without a button', pane.innerHTML.includes(initialPrint) && pane.innerHTML.includes('class="print815"'));
const printIds = [...initialPrint.matchAll(/data-print815="([^"]+)"/g)].map(m => m[1]);
const current = ctx.docCollection().items;
check('Print list includes every nonphoto exactly once', printIds.length === current.filter(d => d.category !== 'Photographs').length && new Set(printIds).size === printIds.length && current.filter(d => d.category !== 'Photographs').every(d => printIds.includes(d.id)));
check('Print list represents photos by reference and has no collapsed details', initialPrint.includes('data-printref815="TEST42"') && initialPrint.includes('1 photo') && !initialPrint.includes('<details'));
ctx.state.docTile815 = 'maps'; ctx.state.docQ815 = 'unavailable SWMS'; ctx.state.docOpen815 = {print: false, prestarts: true}; ctx.renderDocs815();
check('Screen query/category does not restrict the complete print list', pane.innerHTML.includes(initialPrint));
const css = source['v815.css'];
check('Native print CSS exposes the persistent list and hides screen results', /#pane-docs \.print815\{display:none\}/.test(css) && /@media print\{[^]*?#pane-docs \.print815\{display:block!important\}/.test(css) && /#pane-docs #docBody815[^]*?display:none!important/.test(css));
const before = JSON.stringify(ctx.state), htmlBefore = pane.innerHTML;
ctx.printDocs815();
check('Print button calls native printing without mutating screen state', ctx.printCalls === 1 && JSON.stringify(ctx.state) === before && pane.innerHTML === htmlBefore);
ctx.window.print = () => { throw Error('Synthetic cancelled/unavailable print'); }; ctx.printDocs815();
check('Print failure leaves screen category/query/folds unchanged', JSON.stringify(ctx.state) === before && pane.innerHTML === htmlBefore);

const originalChecks = checks.length;
assert.equal(originalChecks, 28);
// Exercise the actual current-base hold, collection and redraw functions with synthetic records.
// The timer queue is deliberately stepped: syncRedraw keeps deferring while the local search owns focus.
let assetBuilds = 0, collectionBuilds = 0, fullDraws = 0, persistCalls = 0;
ctx.recordBooks = [];
ctx.buildAllAssets = () => { assetBuilds++; return []; };
ctx.bookNumbers = () => ctx.recordBooks;
for (const name of ['assetHold', 'docketNoInName', 'applyRemote', 'syncFold', 'syncRedraw', 'docsRedraw']) {
  vm.runInContext(currentBase.sections[name].source, ctx);
}
const realCollection = ctx.docCollection;
ctx.docCollection = () => { collectionBuilds++; return realCollection(); };
ctx.renderDocs = () => { fullDraws++; return ctx.holdAssets(() => ctx.renderDocs815()); };
ctx.render = ctx.renderDocs;
ctx.state.docTile815 = null; ctx.state.docQ815 = ''; ctx.state.docSel815 = null;
deferred.length = 0;
ctx.renderDocs();
let saved = ctx.coll815.last;
check('Full render seeds the exact collection and file registry snapshot', saved && saved.files === ctx.DOCS.files && saved.COLL === ctx.coll815());
let buildsBefore = collectionBuilds, assetsBefore = assetBuilds;
ctx.paintDocs815(); ctx.paintDocs815();
check('Unchanged partial redraws reuse the seeded collection', collectionBuilds === buildsBefore);
check('Each partial redraw uses one current-base asset hold', assetBuilds - assetsBefore === 2);
for (const [name, mutate] of [
  ['file registry identity', () => { ctx.DOCS.files = {...ctx.DOCS.files}; }],
  ['file registry length', () => { ctx.DOCS.files.synthetic_cache_extra = {id: 'synthetic_cache_extra', name: 'synthetic_cache_extra.pdf'}; }],
  ['registry timestamp', () => { ctx.DOCS.at++; }],
  ['registry loading state', () => { ctx.DOCS.state = 'loading'; }]
]) {
  ctx.renderDocs(); buildsBefore = collectionBuilds; assetsBefore = assetBuilds; mutate();
  ctx.paintDocs815();
  check('Partial redraw invalidates cache for changed ' + name, collectionBuilds === buildsBefore + 1 && assetBuilds === assetsBefore + 1);
}
ctx.DOCS.state = 'ready';
ctx.docsRedraw(); saved = ctx.coll815.last;
check('Current-base docsRedraw performs a full draw and reseeds cache', saved.files === ctx.DOCS.files && saved.at === ctx.DOCS.at && saved.state === 'ready' && ctx.coll815() === saved.COLL);
check('Current-base source routes file refresh and Documents full render through the required redraw chain', Object.values(currentBase.renderChain).every(Boolean));

const syntheticId = 'synthetic_cache_54321.jpg';
ctx.DOCS.files[syntheticId] = {id: syntheticId, name: 'synthetic_cache_54321.jpg', kind: 'other'};
ctx.renderDocs();
const categoryOf = coll => coll.items.find(d => d.id === syntheticId).category;
check('Synthetic numbered picture begins as a photo before its book record exists', categoryOf(ctx.coll815()) === 'Photographs');
Object.assign(ctx.SYNC, {first: new Set(['syntheticBook']), last: {}, queue: {}, pending: {}, readonly: true});
ctx.SYNC_COLLS = {syntheticBook: {get: () => ctx.recordBooks, set: next => { ctx.recordBooks = next; }}};
ctx.fromDocs = (name, docs) => Object.values(docs).map(d => d.no);
ctx.persist = () => { persistCalls++; };
ctx.syncFooter = () => {};
ctx.document.activeElement = {tagName: 'INPUT', type: 'search', id: 'docQ815', closest: () => null};
deferred.length = 0;
const drawsBefore = fullDraws;
ctx.applyRemote('syntheticBook', {docs: [{id: 'syntheticBookEntry', data: () => ({no: '54321'})}]});
assert.equal(deferred.length, 1);
deferred.shift()();
check('Actual remote-record handler updates the record but defers full draw while Documents search has focus', persistCalls === 1 && ctx.recordBooks[0] === '54321' && fullDraws === drawsBefore && deferred.length === 1);
const freshCategory = categoryOf(ctx.docCollection());
check('Fresh collection recognises the new synthetic docket record', freshCategory === 'Fencing dockets');
ctx.paintDocs815();
const cachedCategory = categoryOf(ctx.coll815());
check('Partial redraw after incoming book change uses current record classification', cachedCategory === freshCategory,
  {cachedCategory, freshCategory, fullRedrawDeferred: fullDraws === drawsBefore});
ctx.document.activeElement = null;
// One pending retry schedules the redraw, and the next callback performs it after focus is released.
deferred.shift()(); deferred.shift()();
check('Blur and pending full redraw repair the stale classification', fullDraws === drawsBefore + 1 && categoryOf(ctx.coll815()) === freshCategory);

const result = {author: 'Andrew Fisher', sourceCommit: 'e540cbc31bef88500f9b781688c53f8693932514', sourceFiles: expected,
  baselineSha256: baseline.baseSha256, baselineExcerptSha256: sha(baselineBytes), patchReplacementsExecuted: used,
  currentBaseSha256: currentBase.baseSha256, currentBaseExcerptSha256: sha(currentBaseBytes),
  originalPositiveChecks: {passed: checks.slice(0, originalChecks).filter(c => c.pass).length, total: originalChecks},
  cacheAndRedrawChecks: {passed: checks.slice(originalChecks).filter(c => c.pass).length, total: checks.length - originalChecks},
  method: 'NEW positive checks of corrected source and literal replacements parsed from the actual Python patch; synthetic data and DOM/helper doubles only.',
  limits: 'No browser/PDF/visual/performance validation. Print assertions concern generated full-list markup and source CSS. Classified photo summary is the implementation\'s documented print format.',
  passed: checks.filter(c => c.pass).length, total: checks.length, failures: checks.filter(c => !c.pass), checks};
if (args.out) fs.writeFileSync(args.out, JSON.stringify(result, null, 2) + '\n');
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exitCode = result.failures.length ? 1 : 0;
