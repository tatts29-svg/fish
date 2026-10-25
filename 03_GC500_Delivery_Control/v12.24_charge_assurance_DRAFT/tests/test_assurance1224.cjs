// Author: Andrew Fisher. Synthetic adapter fixtures; no operational or private figures.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {project} = require('../charge_assurance1224_src.js');

function fixture() {
  return {
    money: {
      charge: {total: 170, contracts: 100, labour: 20, fencing: 30, other: 0,
        servicing: 10, transportArrived1006: 5, uncontractedHire1007: 2,
        uncontractedHire1013: 0, race: {amount: 3}},
      difference: 100,
      missing: []
    },
    pnl: {revNow: 170, revJob: 200, diff: {now: 100}, rev: [
      {code: 'HIRE', line: 'Hire', now: 120, job: 130},
      {code: 'FENCE', line: 'Fencing', now: 30, job: 50},
      {code: 'OTHER', line: 'Other', now: 20, job: 20}
    ]},
    closeout: {
      revenue: {record: 170, job: 200, fenceToCome: 20, transportToCome: 0,
        labourToCome: 0, cleaningToCome: 0, hireToCome979: 10,
        sourceHire996: {amount: 0, issues: []}, generators1004: {remaining: 0, rows: []},
        allocationForecast1010: {total: 0}, additionalHire1013: {remainingAmount: 0}},
      buildingTransport: {rows: []}
    },
    branchFinancial: {rows: [
      {code: 'BRANCH-A', revenue: 100, revenueJob: 115},
      {code: 'BRANCH-B', revenue: 70, revenueJob: 85}
    ]},
    onsiteComplete: {holds: []},
    pricingHolds: [],
    workPricing: [],
    eventScope: {people: 3, lines: [{amount: 1}, {amount: 2}]}
  };
}

function freeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

test('complete shared models reconcile without introducing prices or mutating inputs', () => {
  const input = fixture(), before = structuredClone(input);
  const result = project(freeze(input));
  assert.equal(result.state, 'pass');
  assert.equal(result.sourceAvailable, true);
  assert.equal(result.issues.length, 0);
  assert.ok(result.checks.length >= 9);
  assert.ok(result.checks.every(row => row.status === 'pass' && row.variance === 0));
  assert.deepEqual(input, before);
});

test('absent top-level input returns unavailable instead of crashing or showing zero', () => {
  for (const input of [undefined, null, {}]) {
    const result = project(input);
    assert.equal(result.state, 'unavailable');
    assert.equal(result.sourceAvailable, false);
    assert.equal(result.actual, null);
    assert.equal(result.job, null);
    assert.equal(result.priced, null);
  }
});

test('missing monetary fields and arrays cannot produce a passing arithmetic check', () => {
  const cases = [
    m => { delete m.money.charge.servicing; },
    m => { m.money.charge.race.amount = null; },
    m => { delete m.pnl.rev; },
    m => { delete m.branchFinancial.rows; },
    m => { delete m.closeout.revenue.sourceHire996.amount; },
    m => { m.closeout.revenue.fenceToCome = null; },
    m => { delete m.money.difference; }
  ];
  for (const change of cases) {
    const input = fixture(); change(input);
    const result = project(input);
    assert.equal(result.state, 'unavailable');
    assert.ok(result.checks.some(row => row.status === 'unavailable'));
  }
});

test('missing or malformed review collections explicitly make source checks unavailable', () => {
  const paths = [
    ['onsiteComplete', 'holds'], ['pricingHolds'], ['workPricing'],
    ['closeout', 'buildingTransport', 'rows'],
    ['closeout', 'revenue', 'generators1004', 'rows'],
    ['closeout', 'revenue', 'sourceHire996', 'issues']
  ];
  for (const path of paths) for (const invalid of [undefined, null, {}]) {
    const input = fixture();
    let target = input;
    for (const key of path.slice(0, -1)) target = target[key];
    target[path.at(-1)] = invalid;
    assert.equal(project(input).sourceAvailable, false, path.join('.'));
  }
});

test('a one-cent component discrepancy fails while retaining the shared totals', () => {
  const input = fixture(); input.money.charge.servicing = 10.01;
  const result = project(input);
  assert.equal(result.state, 'fail');
  const check = result.checks.find(row => row.label === 'Recorded charge components');
  assert.equal(check.status, 'fail');
  assert.equal(check.variance, 1);
  assert.equal(result.actual, 17000);
  assert.equal(result.job, 20000);
});

test('a one-cent branch discrepancy is not hidden by matching grand totals', () => {
  const input = fixture(); input.branchFinancial.rows[0].revenueJob = 115.01;
  const result = project(input);
  assert.equal(result.state, 'fail');
  const check = result.checks.find(row => row.label === 'Job-end Revenue by branch');
  assert.equal(check.status, 'fail');
  assert.equal(check.variance, 1);
  assert.deepEqual(result.branches, input.branchFinancial.rows);
});

test('an offsetting closeout-record and remaining-forecast error cannot pass the bridge', () => {
  const input = fixture();
  input.closeout.revenue.record = 169;
  input.closeout.revenue.hireToCome979 = 11;
  const result = project(input);
  assert.equal(result.checks.find(row => row.label === 'Recorded-to-job-end bridge').status, 'pass');
  assert.equal(result.state, 'fail');
  assert.ok(result.checks.some(row => row.status === 'fail' && Math.abs(row.variance) === 100));
});

test('duplicate holds are enriched once, with later empty reasons preserving the explanation', () => {
  const input = fixture();
  const identity = {ref: 'TEST-1', item: 'Synthetic unit', charge: 'Pickup'};
  input.onsiteComplete.holds.push(identity);
  input.pricingHolds.push({...identity, reason: 'Confirm the existing coverage.', source: {reference: 'SYNTHETIC'}});
  input.workPricing.push({ref: identity.ref, item: identity.item, name: 'Pickup', state: 'unpriced', why: ''});
  input.closeout.buildingTransport.rows.push({ref: identity.ref, item: identity.item, leg: 'pickup', state: 'held', reasons: []});
  const result = project(input);
  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0].reason, 'Confirm the existing coverage.');
  assert.deepEqual(result.issues[0].source, {reference: 'SYNTHETIC'});
  assert.equal(result.state, 'pass');
});

test('supplier-cost gaps do not become customer-charge review items or extra revenue', () => {
  const input = fixture();
  input.pricingHolds.push({ref: 'TEST-2', item: 'Synthetic unit', charge: 'Hire', reason: 'Confirm period.'});
  const before = project(input);
  input.money.missing = ['Supplier invoice not received', 'Supplier labour cost unknown'];
  input.money.cost = {rehire: null, transport: {amount: null}, known: null};
  input.closeout.gaps = [{stream: 'Supplier costs', reason: 'Invoice missing'}];
  const after = project(input);
  assert.equal(after.issues.length, 1);
  assert.deepEqual(after.issues, before.issues);
  assert.equal(after.actual, before.actual);
  assert.equal(after.job, before.job);
  assert.equal(after.state, 'pass');
});

test('fencing remaining forecast is excluded only from the stated subtotal', () => {
  const input = fixture(), before = structuredClone(input);
  const result = project(input);
  assert.equal(result.actual, 17000);
  assert.equal(result.job, 20000);
  assert.equal(result.fence, 2000);
  assert.equal(result.priced, 18000);
  assert.equal(result.remainingOther, 1000);
  assert.equal(result.priced + result.fence, result.job);
  assert.equal(result.actual + result.remainingOther, result.priced);
  assert.deepEqual(result.branches, input.branchFinancial.rows);
  assert.deepEqual(input, before);
});

test('event role display rounding is explained without changing the source total or charges', () => {
  const input = fixture();
  input.eventScope = {people: 1.01, lines: [{amount: 0.51}, {amount: 0.51}]};
  const before = structuredClone(input);
  const result = project(input);
  assert.equal(result.roleRounding, -1);
  assert.equal(result.state, 'pass');
  assert.equal(result.actual, 17000);
  assert.deepEqual(input, before);
});

test('generator and source reviews are retained while explicit generator treatments are excluded', () => {
  const input = fixture();
  input.closeout.revenue.generators1004.rows = [
    {ref: 'TEST-G1', item: 'Synthetic generator', forecast: 10, issues: ['Confirm location']},
    {ref: 'TEST-G2', item: 'Synthetic generator', forecast: 0, issues: ['Not delivered'], treatment: 'pending_no_charge'}
  ];
  input.closeout.revenue.sourceHire996.issues = [{ref: 'TEST-S1', state: 'Confirm source coverage'}];
  const result = project(input);
  assert.equal(result.issues.length, 2);
  assert.ok(result.issues.some(row => row.ref === 'TEST-G1' && row.reason === 'Confirm location'));
  assert.ok(result.issues.some(row => row.ref === 'TEST-S1' && row.reason === 'Confirm source coverage'));
  assert.ok(result.issues.every(row => row.ref !== 'TEST-G2'));
});

test('unallocated ledger amounts remain included and are listed for review exactly once', () => {
  const input = fixture(); input.pnl.rev[2].code = '—';
  const result = project(input);
  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0].charge, 'Ledger allocation');
  assert.match(result.issues[0].reason, /already included/);
  assert.equal(result.actual, 17000);
  assert.equal(result.state, 'pass');
});
