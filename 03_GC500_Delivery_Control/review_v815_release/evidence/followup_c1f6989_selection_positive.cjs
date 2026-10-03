// Author: Andrew Fisher. Positive synthetic checks of the isolated selection proposal.
// Usage: node FILE --source-dir PATCHED_COPY --baseline baseline_v813.json
//   --current-base followup_e540cbc_base.json --page EXACT_C1F6989_HTML [--out RESULT]
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  assert.ok(['--source-dir', '--baseline', '--current-base', '--page', '--out'].includes(process.argv[i]) && process.argv[i + 1]);
  args[process.argv[i].slice(2)] = process.argv[i + 1];
}
for (const k of ['source-dir', 'baseline', 'current-base', 'page']) assert.ok(args[k], 'Missing --' + k);
const originalSha = '038e6fd2966c374a27b70a0d3195c50f27346e9c7f32f59a607bba6618093168';
const proposedSha = 'da33522f35097ce2987e26ede691cd9d99b6e606e6522af8a0e02bb9e07cf134';
const page = fs.readFileSync(args.page, 'utf8');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
assert.equal(sha(page), '665f53fef3bd685260771c2d8e2867531263f3af7e9c84d870c316797f4c15fb');
const start = page.indexOf('async function docsRefresh(force){');
const end = page.indexOf('/* Any route that wants to know about a photograph', start);
assert.ok(start > 0 && end > start);
const refreshSource = page.slice(start, end);
const redrawSource = page.match(/function docsRedraw\(\)\{[^\n]+/)[0];
// Keep all 43 positive assertions unchanged; bind their fixture to the new source.
let fixture = fs.readFileSync(path.join(__dirname, 'followup_e540cbc_proposal.cjs'), 'utf8');
assert.equal(fixture.split(originalSha).length, 2);
fixture = fixture.replace(originalSha, proposedSha);
const processDouble = {argv: ['node', 'fixture', '--source-dir', args['source-dir'], '--baseline', args.baseline,
  '--current-base', args['current-base']], stdout: {write() {}}, exitCode: 0};
const outer = {require, process: processDouble, refreshSource, redrawSource, report: null};
const extra = `
assert.equal(result.passed, 43); assert.equal(result.total, 43);
const positives = [];
const verify = (name, pass) => positives.push({name, pass: !!pass});
vm.runInContext(refreshSource + '\\n' + redrawSource, ctx);
const actualRefresh = ctx.docsRefresh;
ctx.photoRedraw = () => {}; ctx.setHash = () => {}; ctx.innerHeight = 900;
ctx.CSS = {escape: s => s};
let currentRows = [], markup = pane.innerHTML, scrollCalls = 0, tile;
const focusBody = {tagName: 'BODY'}, outside = {id: 'outside-control', closest: () => null};
function replaceRows(value) {
 if (currentRows.includes(ctx.document.activeElement) || ctx.document.activeElement === tile) ctx.document.activeElement = focusBody;
 currentRows.forEach(r => { r.connected = false; });
 tile = {dataset: {tile815: 'maps'}, closest: () => tile, focus() { ctx.document.activeElement = this; }};
 currentRows = [...value.matchAll(/data-doc815="([^"]+)"/g)].map(m => ({
  dataset: {doc815: m[1]}, attrs: {}, connected: true, closest: () => null,
  setAttribute(k, v) { this.attrs[k] = v; },
  scrollIntoView() { scrollCalls++; }, focus() { ctx.document.activeElement = this; }
 }));
}
Object.defineProperty(pane, 'innerHTML', {get() { return markup; }, set(value) { markup = value; replaceRows(value); }});
let partialMarkup = '';
Object.defineProperty(buttons.get('docBody815'), 'innerHTML', {get() { return partialMarkup; }, set(value) { partialMarkup = value; replaceRows(value); }});
ctx.document.querySelectorAll = selector => selector === '#pane-docs #docBody815 [data-doc815]' ? currentRows : [];
ctx.document.querySelector = selector => selector === '#docTiles815 [data-tile815="maps"]' ? tile : null;
ctx.document.contains = row => row.connected;
const q = buttons.get('docQ815'); q.closest = () => null; q.focus = () => { ctx.document.activeElement = q; }; q.setSelectionRange = () => {};
const id = 'synthetic_missing_swms.pdf', title = 'Synthetic unavailable SWMS';
function status() {
 const row = currentRows.find(r => r.dataset.doc815 === id);
 return {present: !!row, marked: !!(row && row.attrs['aria-current'] === 'true'), focused: !!(row && ctx.document.activeElement === row)};
}
function flush() { let n = 0; while (deferred.length) { assert.ok(++n < 30); deferred.shift()(); } }
function begin() {
 ctx.clearDocSelection815(); ctx.state.docsec = null; ctx.state.docTile815 = null;
 ctx.state.docQ815 = title; ctx.state.docSel815 = id;
 ctx.document.activeElement = focusBody; deferred.length = 0; scrollCalls = 0;
 ctx.renderDocs();
}
async function refreshCase(beforeTimer) {
 let finishFiles, pending;
 const files = Object.values(ctx.DOCS.files);
 ctx.SYNC.backend.files = () => new Promise(resolve => { finishFiles = resolve; });
 ctx.DOCS.at = 0; ctx.DOCS.busy = false; ctx.DOCS.state = 'ready';
 ctx.docsRefresh = force => { const p = actualRefresh(force); if (!pending) pending = p; return p; };
 begin();
 if (!beforeTimer) flush();
 finishFiles({files}); await pending; flush();
 const s = status();
 verify((beforeTimer ? 'Refresh before initial focus timer' : 'Refresh after initial focus timer') + ' preserves selected marker and focus', s.present && s.marked && s.focused && ctx.state.docCurrent815 === id);
 verify('Refresh ordering ' + beforeTimer + ' consumes one-shot focus intent', ctx.selRow815.pending === null);
}
globalThis.report = (async () => {
 const sourceData = JSON.stringify({DATA: ctx.DATA, files: ctx.DOCS.files, books: ctx.recordBooks});
 await refreshCase(false); await refreshCase(true);
 ctx.docsRefresh = () => {};
 for (const [name, redraw] of [['full', () => ctx.renderDocs()], ['partial', () => ctx.paintDocs815()]]) {
  begin(); flush(); const scrollBefore = scrollCalls; redraw(); flush();
  verify(name + ' redraw keeps the selected row marked and focused', status().marked && status().focused);
  verify(name + ' redraw restores focus without a new scroll jump', scrollCalls === scrollBefore);
  for (const [control, focus] of [['document search', () => q.focus()], ['category', () => tile.focus()], ['other control', () => { ctx.document.activeElement = outside; }]]) {
   for (const initiallyFocused of [false, true]) {
    begin(); if (initiallyFocused) flush(); focus(); redraw(); flush();
    const a = ctx.document.activeElement;
    verify(name + ' redraw does not steal ' + control + ' focus (' + (initiallyFocused ? 'completed' : 'pending') + ' selection)',
      status().marked && !status().focused && (control === 'document search' ? a === q : control === 'category' ? a === tile : a === outside));
   }
  }
 }
 for (const [control, focus] of [['document search', () => q.focus()], ['category', () => tile.focus()], ['other control', () => { ctx.document.activeElement = outside; }]]) {
  begin(); focus(); flush();
  verify('Pending timer alone does not steal ' + control + ' focus', status().marked && !status().focused && ctx.selRow815.pending === null);
 }
 begin(); q.value = 'unrelated synthetic query'; q.oninput(); flush();
 verify('Typed new query clears the identity, pending intent and stale highlight', !ctx.state.docCurrent815 && !ctx.selRow815.pending && !currentRows.some(r => r.attrs['aria-current']));
 begin(); ctx.pickTile815('transport'); flush();
 verify('Chosen category clears the identity, pending intent and stale highlight', !ctx.state.docCurrent815 && !ctx.selRow815.pending && !currentRows.some(r => r.attrs['aria-current']));
 begin(); ctx.state.docsec = 'maps'; ctx.renderDocs(); flush();
 verify('Deep-linked category clears the identity and pending intent', !ctx.state.docCurrent815 && !ctx.selRow815.pending);
 verify('Selection redraws do not mutate catalogue, file metadata or book records', sourceData === JSON.stringify({DATA: ctx.DATA, files: ctx.DOCS.files, books: ctx.recordBooks}));
 return {author: 'Andrew Fisher', sourceCommit: 'c1f69890736fae4c004e4643ff4139bb19cebeeb',
  sourceSha256: expected['docs815_src.js'], preservedPositiveChecks: result.passed,
  selectionChecksPassed: positives.filter(c => c.pass).length, selectionChecksTotal: positives.length,
  failures: positives.filter(c => !c.pass), checks: positives,
  limits: 'Actual source and refresh functions with synthetic records, DOM/timer doubles and controlled file-list promise. No browser or geometry/performance claim.'};
})();
`;
vm.runInNewContext(fixture + extra, outer, {filename: 'synthetic-selection-positive.cjs'});
outer.report.then(report => {
  report.originalPageSha256 = sha(page);
  if (args.out) fs.writeFileSync(args.out, JSON.stringify(report, null, 2) + '\n');
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  process.exitCode = report.failures.length ? 1 : 0;
}).catch(error => { process.stderr.write(String(error) + '\n'); process.exitCode = 1; });
