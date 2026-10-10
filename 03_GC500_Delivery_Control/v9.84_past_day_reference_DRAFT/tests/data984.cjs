/* Author: Andrew Fisher. Build card facts must distinguish truck loads, dated completion and reminders. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const file = require('node:path').join(__dirname, '..', 'card984-data.js');
const context = {}; vm.runInNewContext(fs.readFileSync(file, 'utf8'), context);
const API = context.BuildCardData984, clone = value => JSON.parse(JSON.stringify(value));
let passed = 0;
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
const rules = [
 ['Risk Assessment', 'a', 'Official risk assessment wording.'],
 ['High-Risk Work', 'b', 'Official high-risk wording.'],
 ['Training and Competency', 'c', 'Official competency wording.'],
 ['Fit for Work', 'd', 'Official fitness wording.'],
 ['Tools and Equipment', 'e', 'Official equipment wording.'],
 ['Critical Risk Non-Negotiables', 'f', 'Official critical risk wording.']
];
const week = {sheet: 'Week 2', phase: 'Build', start: '2026-10-06', end: '2026-10-08'};
function asset(key) { return {key}; }
function load(id, refs, basis = 'booking') { return {id, kind: 'deliveries', basis, truck_id: id, rows: refs.map(ref => ({a: asset(ref), events: [{sheet: 'Week 2'}]}))}; }
function fixture(options = {}) {
 const records = options.records || {P1: {done: true, done_at: '2026-10-06T22:15:00Z'}, P2: {done: true, done_at: '2026-10-07T01:00:00Z'}};
 const groups = options.groups || [load('truck1', ['P1']), load('truck2', ['P2'])];
 const env = {
  weeks: [week], rules,
  weekOf: iso => iso >= week.start && iso <= week.end ? week : null,
  programmeDay: () => ({phase: 'Build'}), staff: () => ({names: ['Aaron Zelvis', 'Daniel Gough']}),
  loads: () => groups, idOf: (_, g) => g.id,
  delivery: key => records[key] || {done: false},
  tally: rows => ({total: rows.length, done: rows.filter(a => records[a.key]?.done).length}),
  ...options.env
 };
 return {env, records, groups, run: (iso = '2026-10-07', today = '2026-10-10', obj) => API.create(env).day(iso, today, obj || {iso, deliveries: groups.flatMap(g => g.rows)})};
}
check('physical booking groups use historical reference outcomes once per truck', () => {
 const r = fixture().run(); assert.equal(r.loads.completed, 2); assert.equal(r.loads.total, 2); assert.equal(r.loads.percent, 100); assert.equal(r.loads.verified, true);
});
check('one shared truck with two references is one load', () => {
 const r = fixture({groups: [load('truck1', ['P1', 'P2'])]}).run(); assert.equal(r.loads.total, 1); assert.equal(r.loads.completed, 1);
});
check('one reference split across distinct bookings keeps the documented trucks', () => {
 const r = fixture({groups: [load('truck1', ['P1']), load('truck2', ['P1'])]}).run(); assert.equal(r.loads.total, 2); assert.equal(r.loads.completed, 2);
});
check('incomplete reference keeps its shared truck incomplete', () => {
 const r = fixture({groups: [load('truck1', ['P1', 'P2'])], records: {P1: {done: true, done_at: '2026-10-07T00:00:00Z'}, P2: {done: false}}}).run();
 assert.equal(r.loads.completed, 0); assert.equal(r.loads.percent, 0); assert.equal(r.loads.status, 'incomplete');
});
check('quantity reconciliation overrides a broad completed reference tick', () => {
 const r = fixture({env: {tally: rows => ({total: rows.length, done: 0})}}).run(); assert.equal(r.loads.completed, 0);
});
check('Friday-style reference page is not represented as a physical truck', () => {
 const r = fixture({groups: [load('truck1', ['P1']), load('reference2', ['P2'], 'ref')]}).run();
 assert.equal(r.loads.verified, false); assert.equal(r.loads.total, null); assert.equal(r.loads.completed, null); assert.equal(r.loads.scheduledGroups, 2);
});
check('older completion cannot become completion of a newly scheduled day load', () => {
 const r = fixture({records: {P1: {done: true, done_at: '2026-09-25T06:13:00Z'}, P2: {done: true, done_at: '2026-10-07T00:00:00Z'}}}).run();
 assert.equal(r.loads.verified, false); assert.equal(r.loads.completed, null);
});
check('completion after Brisbane midnight is not pulled into the prior day', () => {
 const r = fixture({records: {P1: {done: true, done_at: '2026-10-07T14:00:00Z'}, P2: {done: false}}}).run(); assert.equal(r.loads.verified, false);
});
check('the previous UTC date can correctly belong to the Brisbane work day', () => {
 const r = fixture({groups: [load('truck1', ['P1'])], records: {P1: {done: true, done_at: '2026-10-06T14:00:00Z'}}}).run(); assert.equal(r.loads.completed, 1);
});
check('undated completion is not historical evidence', () => {
 const r = fixture({records: {P1: {done: true}, P2: {done: false}}}).run(); assert.equal(r.loads.verified, false);
});
check('future loads show the known schedule without asserting completion', () => {
 const r = fixture().run('2026-10-07', '2026-10-06'); assert.equal(r.loads.total, 2); assert.equal(r.loads.completed, null); assert.equal(r.loads.percent, null); assert.equal(r.loads.status, 'scheduled');
});
check('today follows current dated records without a historical label', () => {
 const r = fixture().run('2026-10-07', '2026-10-07'); assert.equal(r.period, 'today'); assert.equal(r.loads.completed, 2); assert.ok(!r.loads.source.includes('day’s close'));
});
check('zero loads is not 100 percent', () => {
 const r = fixture({groups: []}).run(); assert.equal(r.loads.total, 0); assert.equal(r.loads.completed, 0); assert.equal(r.loads.percent, null); assert.equal(r.loads.status, 'none-scheduled');
});
check('duplicate load identity is not double-counted as certain', () => {
 const r = fixture({groups: [load('same', ['P1']), load('same', ['P2'])]}).run(); assert.equal(r.loads.verified, false); assert.equal(r.loads.total, null);
});
check('delivery completion does not certify a removal', () => {
 const g = load('removal1', ['P1']); g.kind = 'removals'; const r = fixture({groups: [g]}).run(); assert.equal(r.loads.verified, false);
});
check('programme week means countdown week', () => {
 const r = fixture().run(); assert.equal(r.weekLabel, 'BUILD · WEEK 2'); assert.ok(r.detailNote.includes('not the elapsed build week'));
});
check('Friday keeps Week 2 through source events after native date coverage ends', () => {
 const r = fixture().run('2026-10-09'); assert.equal(r.weekLabel, 'BUILD · WEEK 2'); assert.equal(r.weekSource, 'delivery-source-sheet');
});
check('quiet weekend falls within the unique Monday to Sunday programme week', () => {
 const r = fixture({groups: []}).run('2026-10-10'); assert.equal(r.weekLabel, 'BUILD · WEEK 2'); assert.equal(r.weekSource, 'programme-calendar-week');
});
check('conflicting same-week programme sheets do not manufacture a week number', () => {
 const r = fixture({groups: [], env: {weeks: [week, {...week, sheet: 'Week 1'}]}}).run('2026-10-10'); assert.equal(r.weekLabel, 'BUILD'); assert.equal(r.weekSource, 'programme-phase');
});
check('roster names update on each reading and remain unique', () => {
 const f = fixture(); f.env.staff = () => ({names: ['Aaron Zelvis', 'Aaron Zelvis', ' Daniel Gough ']}); assert.deepEqual(clone(f.run().staffNames), ['Aaron Zelvis', 'Daniel Gough']);
 f.env.staff = () => ({names: ['Andrew Fisher']}); assert.deepEqual(clone(f.run().staffNames), ['Andrew Fisher']);
});
check('absent roster is not invented from nearby dates', () => {
 const r = fixture({env: {staff: () => null}}).run(); assert.equal(r.staffRecorded, false); assert.equal(r.staffNames.length, 0);
});
check('daily safety focus is deterministic official wording without briefing claim', () => {
 const f = fixture(); const a = f.run(), b = f.run('2026-10-08'), c = f.run('2026-10-09');
 assert.equal(a.lifeSavingRule.title, 'Risk Assessment'); assert.equal(b.lifeSavingRule.title, 'High-Risk Work'); assert.equal(c.lifeSavingRule.title, 'Training and Competency');
 assert.equal(a.lifeSavingRule.text, rules[0][2]); assert.equal(a.lifeSavingRule.briefingConfirmed, false); assert.equal(a.lifeSavingRule.kind, 'calendar-reminder');
 assert.equal(f.run('2026-10-01').lifeSavingRule.title, 'Risk Assessment');
});
check('missing safety source does not invent a rule', () => { assert.equal(fixture({env: {rules: []}}).run().lifeSavingRule, null); });
check('invalid calendar date does not yield fabricated facts', () => { const r = fixture().run('2026-02-30'); assert.equal(r.valid, false); assert.equal(r.loads.verified, false); });
check('model reads do not modify inputs', () => {
 const f = fixture(), before = JSON.stringify({records: f.records, groups: f.groups, weeks: f.env.weeks, rules: f.env.rules});
 f.run(); f.run('2026-10-08'); assert.equal(JSON.stringify({records: f.records, groups: f.groups, weeks: f.env.weeks, rules: f.env.rules}), before);
});
check('native facade tolerates unavailable optional sources', () => { const r = API.day('2026-10-07', '2026-10-10', {iso: '2026-10-07'}); assert.equal(r.loads.verified, false); assert.equal(r.lifeSavingRule, null); });
check('unlinked carrier loads do not become no loads scheduled', () => { const r = fixture({groups: []}).run('2026-10-07', '2026-10-10', {iso:'2026-10-07',loads:[{n:1}]}); assert.equal(r.loads.verified, false); assert.equal(r.loads.total, null); });
check('a mismatched supplied day does not leak another day’s counts', () => { const r = fixture().run('2026-10-07', '2026-10-10', {iso:'2026-10-08'}); assert.equal(r.loads.verified, false); assert.equal(r.loads.total, null); });
check('future reference groups keep their planned count without claiming truck bookings', () => {
 const r = fixture({groups: [load('reference1', ['P1'], 'ref'), load('reference2', ['P2'], 'ref')]}).run('2026-10-07', '2026-10-06');
 assert.equal(r.loads.total, 2); assert.equal(r.loads.completed, null); assert.equal(r.loads.status, 'scheduled'); assert.equal(r.loads.verified, false); assert.equal(r.loads.groupingVerified, false); assert.ok(r.loads.issues.length);
});
check('future documented trucks retain verified grouping', () => { const r = fixture().run('2026-10-07', '2026-10-06'); assert.equal(r.loads.verified, true); assert.equal(r.loads.groupingVerified, true); });
console.log(passed + ' Build card data checks passed.');
