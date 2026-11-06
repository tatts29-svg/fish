// Author: Andrew Fisher. Pure UI regressions: no browser, network, record or provider calls.
// PAGE=<built html> node sms_regressions.js; otherwise tests the adjacent source file.
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert').strict;
let source = fs.readFileSync(process.env.PAGE || path.join(__dirname, '..', 'sms777_src.js'), 'utf8');
source = source.slice(source.indexOf('function sms777Number('), source.indexOf('async function smsDropBox('));
const context = {esc: value => String(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]))};
vm.createContext(context); vm.runInContext(source, context);
const tests = [], number = '+61400000001';
function test(name, fn) {try {fn(); tests.push({name, pass: true});} catch(e) {tests.push({name, pass: false, error: e.message});}}
const submission = (status, extra = {}) => context.sms777Submission({messages: [{to: number, status, message_id: 'synthetic-id', ...extra}]}, [number])[0];
function rendered(row, delivery) {const host = {}; context.sms777Results(host, [{...row, delivery_status: delivery}]); return host.innerHTML;}

test('Equivalent Australian numbers produce one recipient row', () => {
  const rows = context.sms777Submission({messages: [{to: number, status: 'SUCCESS'}]}, ['0400 000 001', '+61 400 000 001']);
  assert.equal(rows.length, 1); assert.equal(rows[0].to, number);
});
test('Exact SUCCESS is accepted but not delivered', () => {
  const row = submission('SUCCESS'); assert.equal(row.accepted, true); assert.equal(row.delivery_status, 'pending');
});
test('UNSUCCESSFUL and future statuses remain unresolved', () => {
  for (const status of ['UNSUCCESSFUL', 'SUCCESS_PENDING', 'FUTURE_PROVIDER_STATE']) {
    const row = submission(status); assert.equal(row.accepted, false); assert.equal(row.rejected, false); assert.equal(row.delivery_status, 'unknown');
  }
});
test('Server unknown classification prevents retry after ambiguous FAILED status', () => {
  const row = submission('FAILED', {submission_status: 'unknown'}); assert.equal(row.rejected, false); assert.equal(row.delivery_status, 'unknown');
});
test('Known recipient rejection remains rejected', () => {
  const row = submission('INVALID_RECIPIENT'); assert.equal(row.rejected, true); assert.equal(row.accepted, false);
});
test('Unknown submission with unsupported tracking cannot become accepted', () => {
  const row = submission('SUCCESS_PENDING'); const html = rendered(row, 'unsupported');
  assert.doesNotMatch(html, /Accepted/i); assert.match(html, /unknown|not confirmed|unavailable|unsupported/i);
  assert.equal(row.rejected, false); assert.equal(row.accepted, false);
});
test('Unknown submission with pending tracking cannot become accepted', () => {
  const row = submission('SUCCESS_PENDING'); const html = rendered(row, 'pending');
  assert.doesNotMatch(html, /Accepted/i); assert.match(html, /unknown|pending|waiting|not confirmed/i);
  assert.equal(row.rejected, false); assert.equal(row.accepted, false);
});
test('Accepted submission with unsupported tracking preserves its known acceptance', () => {
  assert.match(rendered(submission('SUCCESS'), 'unsupported'), /Accepted/i);
});
test('Confirmed delivered state remains distinguishable', () => {
  assert.match(rendered(submission('SUCCESS'), 'delivered'), /Delivered.*confirmed/i);
});
test('Provider detail is escaped before rendering', () => {
  const row = {...submission('SUCCESS'), error_code: '<img src=x onerror="synthetic">'};
  const html = rendered(row, 'failed'); assert.doesNotMatch(html, /<img/); assert.match(html, /&lt;img/);
});
test('Failed delivery does not blame only the phone network', () => {
  assert.match(rendered(submission('SUCCESS'), 'failed'), /messaging service or phone network reported a failure/);
});
test('Provider status and explanation are visible as escaped detail alongside the code', () => {
  const row = {...submission('SUCCESS'), status_code: 301, provider_status: 'FAILED<script>synthetic</script>',
    note: 'Synthetic <img src=x onerror="synthetic"> & explanation'};
  const html = rendered(row, 'failed');
  assert.match(html, /301 · FAILED&lt;script&gt;synthetic&lt;\/script&gt; · Synthetic &lt;img/);
  assert.match(html, /&quot;synthetic&quot;&gt; &amp; explanation/);
  assert.doesNotMatch(html, /<(?:script|img)\b/);
});
const report = {author: 'Andrew Fisher', tests, passed: tests.filter(t => t.pass).length, total: tests.length,
  networkCalls: 0, recordWrites: 0, messagingWrites: 0};
console.log(JSON.stringify(report)); if (report.passed !== report.total) process.exitCode = 1;
