// Author: Andrew Fisher. Exact candidate-source tests, no network or record writes.
const fs = require('fs'), vm = require('vm'), assert = require('assert'), crypto = require('crypto');
const page = process.env.PAGE;
if (!page) throw new Error('Set PAGE to the patched candidate');
const source = fs.readFileSync(page, 'utf8');
const results = [];
function take(a, b, start = 0) {
  const i = source.indexOf(a, start), j = source.indexOf(b, i);
  assert(i >= 0 && j > i, 'candidate fragment found: ' + a);
  return source.slice(i, j);
}
function check(name, test) { test(); results.push({name, pass: true}); }
(async () => {
  const printStart = source.indexOf('function printPages(');
  assert(printStart >= 0);
  const fragment = take('.then(states => (document.fonts && document.fonts.ready)', '\n.then(states => ({images: states,', printStart);
  const states = ['ok', 'failed', 'unknown'];
  for (const mode of ['absent', 'no-ready', 'resolved', 'rejected']) {
    const document = mode === 'absent' ? {} : {fonts: mode === 'no-ready' ? {} : {ready: mode === 'rejected' ? Promise.reject(new Error('font unavailable')) : Promise.resolve()}};
    const context = vm.createContext({document, Promise, states});
    const actual = await vm.runInContext('Promise.resolve(states)' + fragment, context);
    check('print font API ' + mode + ' preserves image verdicts', () => assert.strictEqual(actual, states));
  }
  let resolveFont;
  const fontReady = new Promise(resolve => { resolveFont = resolve; });
  const delayed = vm.createContext({document: {fonts: {ready: fontReady}}, Promise, states});
  let settled = false;
  const waiting = vm.runInContext('Promise.resolve(states)' + fragment, delayed).then(value => { settled = true; return value; });
  await new Promise(resolve => setImmediate(resolve));
  check('print waits for available pending fonts', () => assert.strictEqual(settled, false));
  resolveFont();
  const readyStates = await waiting;
  check('print retains verdicts after fonts settle', () => assert.strictEqual(readyStates, states));

  let changes = 0, value = 'Live · view only', open = true;
  const badge = {get textContent() { return value; }, set textContent(v) { changes++; value = v; }};
  const context = vm.createContext({SYNC: {status: 'live', readonly: true}, document: {querySelector(selector) {
    assert.strictEqual(selector, '#drawer.on .ptag.sync b'); return open ? badge : null;
  }}});
  vm.runInContext(take('function drawerSync798Word(){', 'function precisionTags(a){'), context);
  check('unchanged live status does not mutate badge', () => { context.drawerSync798Refresh(); assert.strictEqual(changes, 0); });
  check('read-only outage is shown without a send promise', () => { context.SYNC.status = 'unreachable'; context.drawerSync798Refresh(); assert.strictEqual(value, 'Offline · view only'); });
  check('repeat outage does not mutate badge', () => { const before = changes; context.drawerSync798Refresh(); assert.strictEqual(changes, before); });
  check('recovery updates the same badge', () => { context.SYNC.status = 'live'; context.drawerSync798Refresh(); assert.strictEqual(value, 'Live · view only'); });
  check('capability change updates label', () => { context.SYNC.readonly = false; context.drawerSync798Refresh(); assert.strictEqual(value, 'Live'); });
  check('editing outage retains existing sending wording', () => { context.SYNC.status = 'unreachable'; context.drawerSync798Refresh(); assert.strictEqual(value, 'Offline · will send'); });
  check('closed drawer is untouched', () => { open = false; const before = changes; context.SYNC.status = 'live'; context.drawerSync798Refresh(); assert.strictEqual(changes, before); });
  console.log(JSON.stringify({author: 'Andrew Fisher',candidateSha256: crypto.createHash('sha256').update(fs.readFileSync(page)).digest('hex'), passed: results.length,results}, null, 2));
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
