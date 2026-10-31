// Author: Andrew Fisher. Synthetic pure customer-charge treatment tests; no service or browser access.
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const API = require(path.join(__dirname, '..', 'charge1239_src.js'));
const clone = value => structuredClone(value);
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
const TODAY = '2030-04-10';
const checks = [];
function test(name, run) {
  try { run(); checks.push({name, pass: true}); }
  catch (error) { checks.push({name, pass: false, error: error.message}); }
}

// All source identifiers, quantities, rates, amounts and dates below are fictional.
const contractTarget = freeze({
  key: 'c|SYNTHETIC-HIRE|7', eligible: true, treatment: 'own_use_hire',
  source: {
    kind: 'contract-hire',
    row: {rental_contract: 'SYNTHETIC-HIRE', line: 7, branch_code: 'TEST',
      asset_no: 'SYNTHETIC-ASSET', quantity: 2, kind: 'building',
      description: 'Fictional site office', rate_1: 80,
      start_date: '2030-04-01', term_date: '2030-04-08'},
    override: null
  }
});
const waterTarget = freeze({
  key: 'service|Fictional water delivery', eligible: true, treatment: 'included_in_pumpouts',
  source: {
    kind: 'quoted-service', quote: 'SYNTHETIC-Q', sha256: 'a'.repeat(64), group: 1, line: 2,
    quote_line: {description: 'Fictional water delivery', qty: 3, unit_price: 17,
      total_price: 102, period: 'two visits', note: 'Fictional supplier evidence'},
    service_line: {quote: 'SYNTHETIC-Q', description: 'Fictional water delivery', their_amount: 102},
    override: null
  }
});
function decision(target, extra = {}) {
  return {
    schema: 1, kind: 'customer-charge-treatment', key: target.key, revision: 1,
    treatment: target.treatment, source: clone(target.source),
    reason: 'Fictional explicit customer inclusion decision.',
    evidence: 'Synthetic approval, section Alpha; applies only to this source line.',
    confirmed_by: 'Test Approver', confirmed_on: '2030-04-09',
    recorded_by: 'Test Operator', recorded_at: '2030-04-09T01:02:03.000Z',
    history: [], ...extra
  };
}
const contractBase = freeze({amount: 160, actual: 120, remaining: 40, forecast: 160,
  how: 'whole event', basis: 'Fictional source hire basis', days: 7, daily: false,
  ledger: 'TEST-HIRE', branch: 'TEST', ref: 'SYNTHETIC-REF',
  rate: 80, quantity: 2, supplierCost: 70, source: {rate_1: 80, physical: true}});
const serviceBase = freeze({key: waterTarget.key, quote: 'SYNTHETIC-Q',
  description: 'Fictional water delivery', amount: 120, rate: 20, qty: 3,
  period: 'two visits', their_rate: 17, their_amount: 102, covered: true,
  supplier: {quote: 'SYNTHETIC-Q', quantity: 3, cost: 102}, under: false});
const assetBase = freeze({
  lines: [
    {item: 'Fictional site office', qty: 2, rate: 80, total: 160, provisional: 160,
      transport_charge: 24, transport_cost: 19, labour: {total: 30, ticked: ['synthetic-install']},
      source: {physical: true, identifiers: ['SYNTHETIC-ASSET']}},
    {item: 'Fictional storage unit', qty: 1, rate: 50, total: 50, provisional: null,
      transport_charge: 11, transport_cost: 8, labour: {total: 10, ticked: ['synthetic-clean']}}
  ],
  base: 210, accessories: 15, accessories_known: 15, labour: 40, labour_any: true,
  known: 265, total: 265, transport: 59, transport_known: true,
  weeks: 2, span: {days: 7, from: '2030-04-01', to: '2030-04-08'}
});

test('exports the pure API without requiring a browser', () => {
  for (const name of ['validate', 'resolve', 'contract', 'service', 'asset']) assert.equal(typeof API[name], 'function');
});
test('canonical source identity ignores object property order', () => {
  assert.equal(API.canonical({z: [1, {b: 2, a: 1}], a: 0}), API.canonical({a: 0, z: [1, {a: 1, b: 2}]}));
});
test('canonical identity preserves array order and numeric types', () => {
  assert.notEqual(API.canonical({rows: [1, 2]}), API.canonical({rows: [2, 1]}));
  assert.notEqual(API.canonical({rate: 4}), API.canonical({rate: '4'}));
});
for (const missing of [null, undefined]) {
  test('no decision keeps all projection identities: ' + String(missing), () => {
    const result = API.resolve(missing, contractTarget, TODAY);
    assert.equal(result.state, 'none');
    assert.strictEqual(API.contract(contractBase, result), contractBase);
    assert.strictEqual(API.service(serviceBase, result), serviceBase);
  });
}
test('exact contract evidence validates and activates', () => {
  const record = freeze(decision(contractTarget));
  assert.deepEqual(API.validate(record, contractTarget, TODAY), []);
  assert.equal(API.resolve(record, contractTarget, TODAY).state, 'active');
});
test('exact water evidence validates and activates', () => {
  assert.deepEqual(API.validate(decision(waterTarget), waterTarget, TODAY), []);
  assert.equal(API.resolve(decision(waterTarget), waterTarget, TODAY).state, 'active');
});
test('supplier total need not equal quantity multiplied by unit rate', () => {
  // The fictional supplier total covers two visits: its recorded total must survive intact.
  const result = API.resolve(decision(waterTarget), waterTarget, TODAY);
  const projected = API.service(serviceBase, result);
  assert.equal(projected.amount, 0);
  assert.equal(projected.their_amount, 102);
  assert.equal(projected.their_rate, 17);
  assert.equal(projected.period, 'two visits');
});
test('own-use zeroes customer actual, remaining and forecast and preserves ordinary basis', () => {
  const record = freeze(decision(contractTarget));
  const out = API.contract(contractBase, API.resolve(record, contractTarget, TODAY));
  for (const key of ['amount', 'actual', 'remaining', 'forecast']) assert.equal(out[key], 0, key);
  assert.equal(out.treatment, 'own_use_hire');
  assert.strictEqual(out.ordinary1239, contractBase);
  assert.strictEqual(out.chargeTreatment1239, record);
  assert.match(out.basis, /Synthetic approval/);
  assert.equal(out.approved_by, record.confirmed_by);
  for (const key of ['days', 'daily', 'ledger', 'branch', 'ref', 'rate', 'quantity', 'supplierCost', 'source']) {
    assert.deepEqual(out[key], contractBase[key], key);
  }
});
test('contract projection does not invent actual or forecast fields on ordinary-only input', () => {
  const base = freeze({amount: 44, how: 'per day', days: 4, basis: 'Fictional basis'});
  const out = API.contract(base, API.resolve(decision(contractTarget), contractTarget, TODAY));
  assert.equal(out.amount, 0);
  for (const key of ['actual', 'remaining', 'forecast']) assert.equal(Object.hasOwn(out, key), false, key);
});
test('water inclusion alters only customer amount and provenance', () => {
  const record = freeze(decision(waterTarget));
  const out = API.service(serviceBase, API.resolve(record, waterTarget, TODAY));
  assert.equal(out.amount, 0);
  assert.equal(out.ordinaryAmount1239, serviceBase.amount);
  assert.strictEqual(out.chargeTreatment1239, record);
  for (const [key, value] of Object.entries(serviceBase)) if (key !== 'amount') assert.deepEqual(out[key], value, key);
  assert.strictEqual(out.supplier, serviceBase.supplier);
});

const invalidRecordCases = [
  ['unknown schema version', r => { r.schema = 2; }],
  ['wrong record kind', r => { r.kind = 'invoice'; }],
  ['empty decision key', r => { r.key = ''; }],
  ['different decision key', r => { r.key = 'c|ANOTHER-SYNTHETIC-HIRE|7'; }],
  ['zero revision', r => { r.revision = 0; }],
  ['fractional revision', r => { r.revision = 1.5; }],
  ['missing history', r => { delete r.history; }],
  ['history is not a list', r => { r.history = {}; }],
  ['blank reason', r => { r.reason = '  '; }],
  ['non-text reason', r => { r.reason = 5; }],
  ['oversized reason', r => { r.reason = 'x'.repeat(1001); }],
  ['blank source evidence', r => { r.evidence = ''; }],
  ['non-text source evidence', r => { r.evidence = {}; }],
  ['oversized source evidence', r => { r.evidence = 'x'.repeat(1001); }],
  ['unnamed confirmation', r => { r.confirmed_by = ' '; }],
  ['impossible confirmation calendar date', r => { r.confirmed_on = '2030-02-30'; }],
  ['ambiguous confirmation date', r => { r.confirmed_on = '09/04/2030'; }],
  ['future confirmation', r => { r.confirmed_on = '2030-04-11'; }],
  ['missing native recorder', r => { r.recorded_by = ''; }],
  ['invalid native recording time', r => { r.recorded_at = 'not-a-time'; }],
  ['unknown treatment', r => { r.treatment = 'free_everything'; }],
  ['cross-target treatment', r => { r.treatment = 'included_in_pumpouts'; }],
  ['missing source snapshot', r => { delete r.source; }],
  ['changed source quantity', r => { r.source.row.quantity = 9; }],
  ['changed source identity', r => { r.source.row.asset_no = 'OTHER-SYNTHETIC-ASSET'; }],
  ['changed source contract rate', r => { r.source.row.rate_1 = 81; }],
  ['changed customer override', r => { r.source.override = 25; }]
];
for (const [name, mutate] of invalidRecordCases) test('holds ' + name, () => {
  const record = decision(contractTarget); mutate(record); freeze(record);
  const result = API.resolve(record, contractTarget, TODAY);
  assert.equal(result.state, 'review');
  assert.ok(result.errors.length);
  assert.strictEqual(API.contract(contractBase, result), contractBase);
  assert.strictEqual(API.service(serviceBase, result), serviceBase);
});
for (const [name, record] of [['primitive', 17], ['array', []], ['empty object', {}]]) {
  test('holds malformed persisted decision: ' + name, () => assert.equal(API.resolve(record, contractTarget, TODAY).state, 'review'));
}
for (const [name, target] of [
  ['removed source', null], ['unsupported source', {...contractTarget, eligible: false}],
  ['wrong source key', {...contractTarget, key: 'c|OTHER-SYNTHETIC-HIRE|9'}],
  ['wrong allowed treatment', {...contractTarget, treatment: 'included_in_pumpouts'}]
]) test('holds ' + name, () => assert.equal(API.resolve(decision(contractTarget), target, TODAY).state, 'review'));

for (const [name, mutate] of [
  ['changed quote hash', s => { s.sha256 = 'b'.repeat(64); }],
  ['changed quote number', s => { s.quote = 'SYNTHETIC-Q-OTHER'; }],
  ['changed quote row position', s => { s.line += 1; }],
  ['changed supplier amount', s => { s.quote_line.total_price += 1; }],
  ['changed service period', s => { s.quote_line.period = 'three visits'; }],
  ['changed supplier note', s => { s.quote_line.note = 'Another fictional source revision'; }],
  ['changed zero override', s => { s.override = 0; }]
]) test('water decision holds ' + name, () => {
  const target = clone(waterTarget); mutate(target.source);
  const result = API.resolve(decision(waterTarget), freeze(target), TODAY);
  assert.equal(result.state, 'review');
  assert.strictEqual(API.service(serviceBase, result), serviceBase);
});
test('equivalent reordered source remains active', () => {
  const record = decision(contractTarget);
  record.source = Object.fromEntries(Object.entries(record.source).reverse());
  record.source.row = Object.fromEntries(Object.entries(record.source.row).reverse());
  assert.equal(API.resolve(record, contractTarget, TODAY).state, 'active');
});
test('old confirmation stays valid when the bound source is unchanged', () => {
  assert.equal(API.resolve(decision(contractTarget, {confirmed_on: '2029-02-28'}), contractTarget, TODAY).state, 'active');
});

test('clearing preserves prior decision and restores ordinary charges without an available source', () => {
  const previous = decision(contractTarget); delete previous.history;
  const cleared = freeze(decision(contractTarget, {revision: 2, treatment: 'standard',
    reason: 'Fictional reviewer restores ordinary customer charging.', history: [previous]}));
  const before = API.canonical(cleared);
  const result = API.resolve(cleared, null, TODAY);
  assert.equal(result.state, 'cleared');
  assert.strictEqual(API.contract(contractBase, result), contractBase);
  assert.strictEqual(API.service(serviceBase, result), serviceBase);
  assert.equal(API.canonical(cleared), before);
  assert.equal(cleared.history[0].treatment, 'own_use_hire');
});
test('clearing still requires named evidenced native audit', () => {
  const cleared = decision(contractTarget, {treatment: 'standard', evidence: '', recorded_by: ''});
  assert.equal(API.resolve(cleared, null, TODAY).state, 'review');
});

test('no asset coverage preserves object identity', () => {
  assert.strictEqual(API.asset(assetBase, [false, false]), assetBase);
  assert.strictEqual(API.asset(assetBase, []), assetBase);
  assert.equal(API.asset(null, []), null);
});
test('asset projection removes only the covered hire and leaves every other amount intact', () => {
  const out = API.asset(assetBase, [true, false]);
  assert.equal(out.lines[0].total, 0);
  assert.equal(out.lines[0].ordinaryTotal1239, 160);
  assert.equal(out.lines[0].provisional, null);
  assert.strictEqual(out.lines[1], assetBase.lines[1]);
  assert.equal(out.base, 50);
  assert.equal(out.known, 105);
  assert.equal(out.total, 105);
  for (const key of ['accessories', 'accessories_known', 'labour', 'labour_any', 'transport', 'transport_known', 'weeks', 'span']) {
    assert.deepEqual(out[key], assetBase[key], key);
  }
  for (const key of ['qty', 'rate', 'transport_charge', 'transport_cost', 'labour', 'source']) {
    assert.deepEqual(out.lines[0][key], assetBase.lines[0][key], key);
  }
});
test('fully covered hire retains accessory, labour and supplier transport amounts', () => {
  const out = API.asset(assetBase, [true, true]);
  assert.equal(out.base, 0); assert.equal(out.known, 55); assert.equal(out.total, 55);
  assert.deepEqual(out.lines.map(l => l.transport_cost), [19, 8]);
  assert.equal(out.transport, 59);
});
test('untreated unknown hire stays unknown while known subtotal changes correctly', () => {
  const base = clone(assetBase);
  base.lines[1].total = null; base.base = null; base.known = 215; base.total = null;
  const out = API.asset(freeze(base), [true, false]);
  assert.equal(out.base, null); assert.equal(out.total, null); assert.equal(out.known, 55);
  assert.equal(out.lines[1].total, null);
});
test('explicit inclusion can settle unknown hire without inventing non-hire charges', () => {
  const base = clone(assetBase);
  base.lines[0].total = null; base.base = null; base.known = 105; base.total = null;
  const out = API.asset(freeze(base), [true, false]);
  assert.equal(out.base, 50); assert.equal(out.known, 105); assert.equal(out.total, 105);
  assert.equal(out.lines[0].ordinaryTotal1239, null);
});
test('unknown accessory or labour cost is not turned into a complete total', () => {
  for (const key of ['accessories', 'labour']) {
    const base = clone(assetBase); base[key] = null; base.total = null;
    assert.equal(API.asset(freeze(base), [true, false]).total, null, key);
  }
});

// Persisted financial decisions must not accept ambiguous native audit or malformed schema.
for (const [name, mutate] of [
  ['unexpected decision field', r => { r.forceCustomerZero = true; }],
  ['date-only native recording timestamp', r => { r.recorded_at = '2030-04-09'; }],
  ['invalid timestamp calendar date', r => { r.recorded_at = '2030-02-30T01:02:03.000Z'; }],
  ['primitive history entry', r => { r.revision = 2; r.history = ['not a decision']; }],
  ['history revision mismatch', r => { r.revision = 3; }]
]) test('schema holds ' + name, () => {
  const record = decision(contractTarget); mutate(record);
  assert.equal(API.resolve(record, contractTarget, TODAY).state, 'review');
});
test('contract projector does not apply a water-only decision', () => {
  assert.strictEqual(API.contract(contractBase, API.resolve(decision(waterTarget), waterTarget, TODAY)), contractBase);
});
test('service projector does not apply a contract-only decision', () => {
  assert.strictEqual(API.service(serviceBase, API.resolve(decision(contractTarget), contractTarget, TODAY)), serviceBase);
});
test('unsafe revision cannot activate a financial decision', () => {
  const record = decision(contractTarget, {revision: Number.MAX_SAFE_INTEGER + 1});
  assert.equal(API.resolve(record, contractTarget, TODAY).state, 'review');
});
test('future native audit cannot activate a financial decision', () => {
  const record = decision(contractTarget, {recorded_at: '2030-04-11T01:02:03.000Z'});
  assert.equal(API.resolve(record, contractTarget, TODAY).state, 'review');
});
test('clearing cannot use a different current source identity', () => {
  const record = decision(contractTarget, {treatment: 'standard'});
  assert.equal(API.resolve(record, waterTarget, TODAY).state, 'review');
});
test('clearing an unavailable source still requires a supported key shape', () => {
  const record = decision(contractTarget, {treatment: 'standard', key: 'unscoped-synthetic-key'});
  assert.equal(API.resolve(record, null, TODAY).state, 'review');
});
test('complete retained history supports a later replacement decision', () => {
  const previous = decision(contractTarget); delete previous.history;
  const record = freeze(decision(contractTarget, {revision: 2, history: [previous]}));
  assert.equal(API.resolve(record, contractTarget, TODAY).state, 'active');
});
for (const [name, mutate] of [
  ['history belongs to a different source', h => { h.key = 'c|ANOTHER-SYNTHETIC-HIRE|7'; }],
  ['history has a duplicate revision', h => { h.revision = 2; }],
  ['history is an empty object', h => { for (const key of Object.keys(h)) delete h[key]; }]
]) test('schema holds ' + name, () => {
  const previous = decision(contractTarget); delete previous.history; mutate(previous);
  const record = freeze(decision(contractTarget, {revision: 2, history: [previous]}));
  assert.equal(API.resolve(record, contractTarget, TODAY).state, 'review');
});
test('missing projection result does not change either customer model', () => {
  assert.strictEqual(API.contract(contractBase, null), contractBase);
  assert.strictEqual(API.service(serviceBase, undefined), serviceBase);
});
test('asset coverage requires explicit booleans, never truthy strings or numbers', () => {
  for (const coverage of [['false', 'true'], [1, 0], null, {}, 'true']) {
    assert.strictEqual(API.asset(assetBase, coverage), assetBase);
  }
});
test('a truthy nonboolean cannot cover another asset beside an explicitly covered asset', () => {
  const out = API.asset(assetBase, [true, 'true']);
  assert.equal(out.lines[0].total, 0);
  assert.strictEqual(out.lines[1], assetBase.lines[1]);
  assert.equal(out.total, 105);
});
test('an unknown known-subtotal cannot become a negative fictional amount', () => {
  const base = freeze({...assetBase, known: null});
  assert.equal(API.asset(base, [true, false]).known, null);
});


const includedTarget = freeze({...clone(contractTarget), treatments: ['own_use_hire', 'included_elsewhere_hire']});
const includedDecision = () => decision(includedTarget, {treatment: 'included_elsewhere_hire', reason: 'Synthetic hire covered by another customer charge.'});
test('confirmed hire inclusion is a separate permitted contract decision', () => {
  const result = API.resolve(includedDecision(), includedTarget, TODAY);
  assert.equal(result.state, 'active');
  const out = API.contract(contractBase, result);
  assert.equal(out.treatment, 'included_elsewhere_hire'); assert.equal(out.amount, 0);
  assert.strictEqual(out.ordinary1239, contractBase);
  assert.match(out.how, /another customer charge/); assert.doesNotMatch(out.how, /own use/i);
});
test('hire inclusion retains every supplier, source, category and non-hire value', () => {
  const out = API.contract(contractBase, API.resolve(includedDecision(), includedTarget, TODAY));
  for (const key of ['supplierCost', 'source', 'ledger', 'branch', 'rate', 'quantity', 'days']) assert.deepEqual(out[key], contractBase[key]);
  const projected = API.asset(assetBase, [true, false], ['included_elsewhere_hire', null]);
  assert.equal(projected.lines[0].chargeTreatment1239, 'included_elsewhere_hire');
  for (const key of ['labour', 'accessories', 'transport', 'transport_known']) assert.deepEqual(projected[key], assetBase[key]);
  assert.equal(projected.lines[0].transport_cost, assetBase.lines[0].transport_cost);
});
test('hire inclusion does not apply to quoted water or a mismatched target kind', () => {
  assert.equal(API.resolve({...includedDecision(), key: waterTarget.key, source: clone(waterTarget.source)}, waterTarget, TODAY).state, 'review');
  assert.strictEqual(API.service(serviceBase, API.resolve(includedDecision(), includedTarget, TODAY)), serviceBase);
});
for (const [name, mutate] of [['quantity', s => {s.row.quantity++;}], ['hire identity', s => {s.row.line++;}], ['rate override', s => {s.override = 91;}]]) {
  test('hire inclusion becomes review when ' + name + ' changes', () => {
    const target = clone(includedTarget); mutate(target.source);
    const result = API.resolve(includedDecision(), target, TODAY);
    assert.equal(result.state, 'review'); assert.strictEqual(API.contract(contractBase, result), contractBase);
  });
}
test('clearing covered hire retains its distinct history and restores ordinary pricing', () => {
  const old = includedDecision(); delete old.history;
  const cleared = {...includedDecision(), treatment: 'standard', revision: 2, history: [old]};
  const result = API.resolve(cleared, includedTarget, TODAY);
  assert.equal(result.state, 'cleared'); assert.strictEqual(API.contract(contractBase, result), contractBase);
  assert.equal(result.record.history[0].treatment, 'included_elsewhere_hire');
});

const failures = checks.filter(check => !check.pass);
for (const failure of failures) console.error('FAIL ' + failure.name + '\n  ' + failure.error);
console.log(JSON.stringify({author: 'Andrew Fisher', suite: 'charge1239 synthetic pure',
  passed: checks.length - failures.length, failed: failures.length, checks: checks.length,
  failedChecks: failures.map(f => f.name)}));
process.exitCode = failures.length ? 1 : 0;
