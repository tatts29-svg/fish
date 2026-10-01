/* Author: Andrew Fisher. Read-only regression cases; all financial fixtures are synthetic.
   Usage: node evidence/synthetic_tests.js <unpatched v7.69 page.html> */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {spawnSync} = require('node:child_process');
const here = path.resolve(__dirname, '..');
const basePath = process.argv[2];
if (!basePath) throw new Error('Supply an unpatched v7.69 page');
const base = fs.readFileSync(basePath, 'utf8');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gc500-v771-synthetic-'));
const checks = [];
function check(name, run){ run(); checks.push({name, pass: true}); }
function patch(file){ return spawnSync('python3', [path.join(here, 'patch_v771.py'), file], {encoding: 'utf8'}); }
function plain(value){ return JSON.parse(JSON.stringify(value)); }
function forecastSource(page){
 const begin = page.indexOf('function cj764Fencing(){');
 const end = page.indexOf('/* v7.65 -', begin);
 assert(begin >= 0 && end > begin, 'Cannot identify the existing forecast function');
 return page.slice(begin, end);
}
const TYPES = {
 hoarding: 'Temporary Fence (m) — Hoarding',
 flat: 'Crowd Control Barriers (m) — Flat Feet',
 picket: 'Crowd Control Barriers (m) — WPF',
 unknown: 'An unsupported programme type',
 existing: 'Existing docket-column type'
};
const syntheticCard = {source: {file: 'synthetic-card.pdf'}, entries: [
 {programme_type: TYPES.hoarding, unit: 'm', rate: 1.11},
 {programme_type: TYPES.flat, unit: 'm', rate: 2.22},
 {programme_type: TYPES.picket, unit: 'm', rate: 3.33}
]};
const helper = fs.readFileSync(path.join(here, 'forecast771_src.js'), 'utf8')
 .replace('__FORECAST_CARD771__', JSON.stringify(syntheticCard));
function fixture(){ return {
 columns: [{key: 'existing', programme_type: TYPES.existing}],
 rates: {existing: 7.25}, costs: {existing: 2.5},
 weeks: [{week: 'Current', progSheet: 'CURRENT', planWords: true, rolled: true,
  start: '2026-09-28', end: '2026-10-02',
  lines: [{column: 'existing', name: 'Existing', unit: 'm', remaining: 4}]}],
 totals: {'CURRENT': {[TYPES.hoarding]: 10, [TYPES.flat]: 20, [TYPES.picket]: 30,
  [TYPES.unknown]: 5, [TYPES.existing]: 4}}
}; }
function run(source, data, useHelper){
 const f = plain(data);
 const context = vm.createContext({
  todayIso: () => '2026-10-01',
  DATA: {fencing: {week_sheets: Object.entries(f.totals).map(([sheet, totals]) => ({sheet, totals}))}},
  FCOL: f.columns, allDockets: () => [], fenceByWeek: () => f.weeks,
  fenceRateFor: key => ({value: f.rates[key] == null ? null : f.rates[key]}),
  fenceCostFor: key => f.costs[key] === 'hourly' ? {value: null, source: 'hourly'} : {value: f.costs[key] == null ? null : f.costs[key]}
 });
 vm.runInContext((useHelper ? helper : '') + '\n' + source, context);
 return plain(vm.runInContext('cj764Fencing()', context));
}
try {
 const candidate = path.join(tmp, 'candidate.html'); fs.writeFileSync(candidate, base);
 const applied = patch(candidate);
 check('patch accepts the current base', () => assert.equal(applied.status, 0, applied.stderr));
 const page = fs.readFileSync(candidate, 'utf8');
 const originalFunction = forecastSource(base), newFunction = forecastSource(page);
 const again = patch(candidate);
 check('second application refused without changing the candidate', () => {
  assert.notEqual(again.status, 0); assert.equal(fs.readFileSync(candidate, 'utf8'), page);
 });
 const wrong = path.join(tmp, 'wrong.html'); fs.writeFileSync(wrong, 'an unrelated page');
 check('wrong base refused without changing it', () => {
  assert.notEqual(patch(wrong).status, 0); assert.equal(fs.readFileSync(wrong, 'utf8'), 'an unrelated page');
 });
 const beforeText = base.match(/const DATA\s*=\s*[^\n]+/)[0];
 check('embedded records unchanged by the patch', () => assert(page.includes(beforeText)));
 const f = fixture(), old = run(originalFunction, f, false), next = run(newFunction, f, true);
 check('all three supported types add only forecast Revenue', () => {
  assert.equal(next.revenue - old.revenue, 155.4); assert.equal(next.cost, old.cost);
 });
 check('supported types no longer reported as missing a card rate', () => {
  for (const type of [TYPES.hoarding, TYPES.flat, TYPES.picket]) assert.equal(next.noCardRate[type], undefined);
 });
 check('all supplier-cost gaps remain identical', () => assert.deepEqual(next.noCostRate, old.noCostRate));
 check('unknown types still have both gaps', () => {
  assert.equal(next.noCardRate[TYPES.unknown], 5); assert.equal(next.noCostRate[TYPES.unknown], 5);
 });
 check('existing docket line Revenue and cost preserved', () => assert.deepEqual(next.weeks[0].lines[0], old.weeks[0].lines[0]));
 check('new row details identify forecast quantities and unknown cost', () => {
  const lines = next.weeks[0].lines.filter(l => l.forecastOnly);
  assert.equal(lines.length, 3); assert(lines.every(l => l.cost === null && l.unit === 'm'));
  assert.equal(lines.reduce((n, l) => n + l.q, 0), 60);
 });
 check('week totals reconcile to their detail', () => {
  for (const w of next.weeks) {
   assert.equal(w.revenue, Math.round(w.lines.reduce((n, l) => n + (l.rev || 0), 0) * 100) / 100);
   assert.equal(w.cost, Math.round(w.lines.reduce((n, l) => n + (l.cost || 0), 0) * 100) / 100);
  }
 });
 const future = fixture(); future.weeks[0].start = '2026-10-05'; future.weeks[0].end = '2026-10-09';
 check('future weeks priced with the same rule', () => assert.equal(run(newFunction, future, true).revenue, next.revenue));
 const boundary = fixture(); boundary.weeks[0].end = '2026-10-01';
 check('week ending today remains a current forecast', () => assert.equal(run(newFunction, boundary, true).revenue, next.revenue));
 const past = fixture(); past.weeks[0].end = '2026-09-30';
 check('past-week behaviour and behind figures unchanged', () => assert.deepEqual(run(newFunction, past, true), run(originalFunction, past, false)));
 const pastEmpty = fixture(); pastEmpty.weeks[0].end = '2026-09-30'; pastEmpty.weeks[0].lines = [];
 check('past weeks without remaining docket quantities remain omitted', () => assert.deepEqual(run(newFunction, pastEmpty, true), run(originalFunction, pastEmpty, false)));
 const unrolled = fixture(); unrolled.weeks[0].rolled = false;
 check('unconfirmed demob weeks remain excluded', () => assert.deepEqual(run(newFunction, unrolled, true), run(originalFunction, unrolled, false)));
 const noPlan = fixture(); noPlan.weeks[0].planWords = false;
 check('weeks without programme basis remain excluded', () => assert.deepEqual(run(newFunction, noPlan, true), run(originalFunction, noPlan, false)));
 const represented = fixture(); represented.columns.push({key: 'hoarding', programme_type: TYPES.hoarding});
 represented.rates.hoarding = 4.5; represented.costs.hoarding = 1.5;
 represented.weeks[0].lines.push({column: 'hoarding', name: 'Hoarding', unit: 'm', remaining: 10});
 check('a supported type with a docket column is counted once at its existing rate', () => {
  const a = run(originalFunction, represented, false), b = run(newFunction, represented, true);
  assert.equal(b.revenue - a.revenue, 144.3); assert.equal(b.cost, a.cost);
  assert.equal(b.weeks[0].lines.filter(l => l.name === 'Hoarding').length, 1);
  assert(!b.weeks[0].lines.some(l => l.forecastOnly && l.name === TYPES.hoarding));
 });
 const hourly = fixture(); hourly.costs.existing = 'hourly';
 check('hourly supplier treatment untouched', () => {
  const a = run(originalFunction, hourly, false), b = run(newFunction, hourly, true);
  assert.deepEqual(b.hourly, a.hourly); assert.equal(b.cost, a.cost);
 });
 const invalid = fixture(); invalid.totals.CURRENT = {
  [TYPES.hoarding]: -1, [TYPES.flat]: 'bad', [TYPES.picket]: null, [TYPES.unknown]: 0
 };
 check('invalid or nonpositive quantities cannot create Revenue or fabricated gaps', () => {
  const result = run(newFunction, invalid, true);
  assert.equal(result.revenue, 29); assert.deepEqual(result.noCardRate, {}); assert.deepEqual(result.noCostRate, {});
 });
 for (const [label, quantity] of [['boolean', true], ['array', [5]], ['object', {value: 5}], ['blank string', '   ']]) {
  const bad = fixture(); bad.totals.CURRENT = {[TYPES.hoarding]: quantity};
  check(`${label} quantity cannot be coerced into forecast work`, () => {
   const result = run(newFunction, bad, true);
   assert.equal(result.revenue, 29); assert.equal(result.weeks[0].lines.length, 1);
   assert.deepEqual(result.noCardRate, {}); assert.deepEqual(result.noCostRate, {});
  });
 }
 const numericString = fixture(); numericString.totals.CURRENT = {[TYPES.flat]: ' 1.5 '};
 check('finite positive numeric strings remain supported', () => assert.equal(run(newFunction, numericString, true).revenue, 32.33));
 const multiple = fixture(); multiple.weeks.push({...multiple.weeks[0], week: 'Next', progSheet: 'NEXT', lines: []});
 multiple.totals.NEXT = {[TYPES.flat]: 1.5, [TYPES.unknown]: 2};
 check('multiple weeks reconcile and accumulate unknown cost quantities', () => {
  const result = run(newFunction, multiple, true);
  assert.equal(result.revenue, 187.73); assert.equal(result.noCostRate[TYPES.flat], 21.5);
  assert.equal(result.noCardRate[TYPES.unknown], 7);
 });
 const summary = {author: 'Andrew Fisher', fixture: 'synthetic only', passed: checks.length, failed: 0, checks};
 fs.writeFileSync(path.join(__dirname, 'synthetic_results.json'), JSON.stringify(summary, null, 2) + '\n');
 process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
} finally { fs.rmSync(tmp, {recursive: true, force: true}); }
