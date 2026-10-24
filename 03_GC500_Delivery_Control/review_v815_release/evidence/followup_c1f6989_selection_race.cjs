// Author: Andrew Fisher. Synthetic-only reproduction of asynchronous selection loss.
// No browser, network, operational records or implementation writes.
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  assert.ok(['--source-dir', '--baseline', '--current-base', '--page', '--out'].includes(process.argv[i]) && process.argv[i + 1]);
  args[process.argv[i].slice(2)] = process.argv[i + 1];
}
for (const k of ['source-dir', 'baseline', 'current-base', 'page']) assert.ok(args[k], 'Missing --' + k);
const page = fs.readFileSync(args.page, 'utf8');
const pageSha256 = crypto.createHash('sha256').update(page).digest('hex');
assert.equal(pageSha256, '665f53fef3bd685260771c2d8e2867531263f3af7e9c84d870c316797f4c15fb');
const start = page.indexOf('async function docsRefresh(force){');
const end = page.indexOf('/* Any route that wants to know about a photograph', start);
assert.ok(start > 0 && end > start);
const refreshSource = page.slice(start, end);
const redrawSource = page.match(/function docsRedraw\(\)\{[^\n]+/)[0];
// Reuse the established synthetic fixture and all 43 positives. Its source guards
// still bind the exact c1f6989 implementation; no earlier failing assertion is relabelled.
const fixture = fs.readFileSync(path.join(__dirname, 'followup_e540cbc_proposal.cjs'), 'utf8');
const processDouble = {argv: ['node', 'fixture', '--source-dir', args['source-dir'], '--baseline', args.baseline,
  '--current-base', args['current-base']], stdout: {write() {}}, exitCode: 0};
const outer = {require, process: processDouble, refreshSource, redrawSource, report: null};
const extra = `
assert.equal(result.passed, 43); assert.equal(result.total, 43);
vm.runInContext(refreshSource + '\\n' + redrawSource, ctx);
ctx.photoRedraw = () => {};
let currentRows = [], markup = pane.innerHTML, scrollCalls = 0;
Object.defineProperty(pane, 'innerHTML', {
 get() { return markup; },
 set(value) {
  if (currentRows.includes(ctx.document.activeElement)) ctx.document.activeElement = null;
  currentRows.forEach(r => { r.connected = false; });
  markup = value;
  currentRows = [...value.matchAll(/data-doc815="([^"]+)"/g)].map(m => ({
   dataset: {doc815: m[1]}, attrs: {}, connected: true,
   setAttribute(k, v) { this.attrs[k] = v; },
   scrollIntoView() { scrollCalls++; },
   focus() { ctx.document.activeElement = this; }
  }));
 }
});
ctx.document.querySelectorAll = selector => selector === '#pane-docs #docBody815 [data-doc815]' ? currentRows : [];
ctx.document.querySelector = () => null;
ctx.document.contains = row => row.connected;
ctx.document.activeElement = null;
const id = 'synthetic_missing_swms.pdf', title = 'Synthetic unavailable SWMS';
function status() {
 const row = currentRows.find(r => r.dataset.doc815 === id);
 return {targetPresent: !!row, current: !!(row && row.attrs['aria-current'] === 'true'),
  focused: !!(row && ctx.document.activeElement === row), selectedIdCleared: ctx.state.docSel815 === null,
  queryPreserved: ctx.state.docQ815 === title};
}
async function scenario(finishBeforeFocusTimer) {
 let finishFiles;
 const files = Object.values(ctx.DOCS.files);
 ctx.SYNC.backend.files = () => new Promise(resolve => { finishFiles = resolve; });
 ctx.DOCS.at = 0; ctx.DOCS.busy = false; ctx.DOCS.state = 'ready';
 ctx.state.docTile815 = null; ctx.state.docQ815 = title; ctx.state.docSel815 = id;
 ctx.document.activeElement = null; deferred.length = 0; scrollCalls = 0;
 const realRefresh = ctx.docsRefresh;
 let pending;
 ctx.docsRefresh = force => { const p = realRefresh(force); if (!pending) pending = p; return p; };
 ctx.renderDocs();
 const markedBeforeTimer = status();
 if (!finishBeforeFocusTimer) deferred.shift()();
 const beforeRefresh = status();
 finishFiles({files}); await pending;
 while (deferred.length) deferred.shift()();
 ctx.docsRefresh = realRefresh;
 return {finishBeforeFocusTimer, markedBeforeTimer, beforeRefresh, afterRefresh: status(), scrollCalls};
}
globalThis.report = (async () => {
 const cases = [await scenario(false), await scenario(true)];
 return {author: 'Andrew Fisher', sourceCommit: 'c1f69890736fae4c004e4643ff4139bb19cebeeb',
  sourceSha256: expected['docs815_src.js'], preservedPositiveChecks: result.passed,
  reproduced: cases.every(c => c.markedBeforeTimer.current && c.afterRefresh.targetPresent && !c.afterRefresh.current && !c.afterRefresh.focused && c.afterRefresh.queryPreserved),
  cases, limits: 'Actual renderDocs815/selRow815/docsRefresh/docsRedraw with synthetic data, controlled file Promise and DOM/timer doubles. No browser geometry or elapsed-time claim.'};
})();
`;
vm.runInNewContext(fixture + extra, outer, {filename: 'synthetic-selection-race.cjs'});
outer.report.then(report => {
  report.pageSha256 = pageSha256;
  if (args.out) fs.writeFileSync(args.out, JSON.stringify(report, null, 2) + '\n');
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  process.exitCode = report.reproduced ? 0 : 1;
}).catch(() => { process.stderr.write('Synthetic reproduction did not complete.\n'); process.exitCode = 1; });
