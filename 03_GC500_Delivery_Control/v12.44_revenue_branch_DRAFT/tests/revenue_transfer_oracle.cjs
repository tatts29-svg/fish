/* Author: Andrew Fisher. TEST ONLY: independent Revenue transfer expectations.
 * All inputs are frozen BEFORE native setters. Never call the new branch reader
 * to produce expected values. No browser, network, record or product writes.
 *
 * expectedTransfers input arrays:
 *   branches: baseline branchFinancial978(...).rows (not the total row).
 *   invoices: baseline fh866Model().inv.
 *   contracts: ordinary hire contribution snapshots
 *     {key, branch, amount, owner, category, ...retainedSourceFields}.
 *     amount is the baseline counted contractCharge.amount, null if unpriced.
 *     It must already have contract-line cent precision; it is NOT a unit rate.
 *   forecastRows: baseline pricingForecast1010().rows; key or contract/line.
 *   scope: full baseline scopeFigures(); roleBranches: baseline key -> branch.
 *   targets: unique {key:'c|...|...' or 'scope|...', branch} decisions.
 * Output branches/invoices/deltas are arrays. Contracts and scope are retained
 * for optional preservation assertions; only targeted contract branch changes.
 */
'use strict';
const assert = require('node:assert/strict');
const clone = x => x == null ? x : JSON.parse(JSON.stringify(x));
const canonical = x => JSON.stringify((function sort(v) {
  return Array.isArray(v) ? v.map(sort) : v && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v;
})(x));
const equal = (a, b, message) => assert.equal(canonical(a), canonical(b), message);
const named = (x, label) => { assert.equal(typeof x, 'string', label); assert(x.trim(), label); return x; };
const finite = (x, label) => { assert.equal(typeof x, 'number', label); assert(Number.isFinite(x), label); return x; };
function cents(x, label) {
  finite(x, label);
  const n = Math.round(x * 100);
  assert(Number.isSafeInteger(n) && Math.abs(n / 100 - x) < 1e-7,
    label + ': expected an already rounded monetary amount');
  return n;
}
function index(rows, field, label) {
  assert(Array.isArray(rows), label + ' must be an array');
  const out = new Map();
  for (const row of rows) {
    const key = named(row?.[field], label + ' key');
    assert(!out.has(key), 'Duplicate ' + label + ': ' + key);
    out.set(key, row);
  }
  return out;
}
function forecastKey(row) {
  const derived = row.contract != null && row.line != null ? 'c|' + row.contract + '|' + row.line : null;
  const key = row.key || derived;
  named(key, 'Forecast exact contract key');
  assert(/^c\|[^|]+\|[^|]+$/.test(key), 'Unsupported forecast key');
  assert(!row.key || !derived || row.key === derived, 'Conflicting forecast identity');
  return key;
}

// The existing event-scope convention rounds grouped shares, then assigns the
// cent remainder to the first encountered largest positive weight. A role's
// displayed amount is not its share of an overridden aggregate people charge.
function allocateScope(scope, roleBranches) {
  assert(scope && Array.isArray(scope.lines), 'Full scope lines required');
  const weights = new Map(), seen = new Set();
  for (const line of scope.lines) {
    const key = named(line.key, 'Scope role key');
    assert(!seen.has(key), 'Duplicate scope role: ' + key); seen.add(key);
    const branch = roleBranches[key];
    if (!branch) continue;
    named(branch, 'Role source branch');
    const amount = line.amount_exact == null ? line.amount : line.amount_exact;
    finite(amount, 'Scope weight');
    weights.set(branch, (weights.get(branch) || 0) + amount);
  }
  const r2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
  const total = r2(finite(scope.people, 'Scope people total'));
  if (!total) return {};
  const positive = [...weights].filter(([, value]) => value > 0);
  const sum = positive.reduce((n, [, value]) => n + value, 0);
  if (!positive.length || !sum) return {'—': total};
  const out = {}; let accumulated = 0, top = positive[0];
  for (const [branch, weight] of positive) {
    out[branch] = r2(total * weight / sum);
    accumulated = r2(accumulated + out[branch]);
    if (weight > top[1]) top = [branch, weight];
  }
  out[top[0]] = r2(out[top[0]] + (total - accumulated));
  return out;
}

function expectedTransfers(input) {
  const {branches, invoices, contracts, forecastRows, scope, roleBranches, targets} = input;
  const branchMap = index(branches, 'code', 'baseline branch');
  const invoiceMap = index(invoices, 'branch', 'baseline invoice branch');
  const contractMap = index(contracts, 'key', 'contract');
  const targetMap = index(targets, 'key', 'target');
  assert(roleBranches && typeof roleBranches === 'object', 'Baseline role branches required');
  const forecastMap = new Map();
  for (const row of forecastRows) {
    const key = forecastKey(row);
    assert(!forecastMap.has(key), 'Duplicate forecast contribution: ' + key);
    named(row.branch, 'Forecast source branch'); cents(row.amount, 'Forecast amount');
    forecastMap.set(key, row);
  }
  const delta = new Map(), expected = new Map();
  const zero = code => ({code, revenue:0, revenueJob:0, cost:0, costJob:0});
  for (const [code, row] of branchMap) {
    assert(code !== 'Combined job', 'Pass branch rows without the combined total');
    for (const key of ['revenue', 'revenueJob', 'cost', 'costJob']) cents(row[key], 'Baseline ' + key);
    expected.set(code, clone(row));
  }
  const add = (branch, current, job) => {
    named(branch, 'Transfer branch');
    const d = delta.get(branch) || {code:branch, revenue:0, revenueJob:0};
    d.revenue += current; d.revenueJob += job; delta.set(branch, d);
    if (!expected.has(branch)) expected.set(branch, zero(branch));
  };
  const move = (from, to, current, job) => { add(from, -current, -job); add(to, current, job); };
  const nextRoles = {...roleBranches};
  const roleKeys = new Set(scope.lines.map(line => line.key));
  for (const [key, target] of targetMap) {
    named(target.branch, 'Destination branch');
    if (/^c\|[^|]+\|[^|]+$/.test(key)) {
      const source = contractMap.get(key); assert(source, 'Missing exact baseline contract: ' + key);
      named(source.branch, 'Contract source branch');
      const amount = source.amount == null ? 0 : cents(source.amount, 'Contract actual amount');
      move(source.branch, target.branch, amount, amount);
      const remaining = forecastMap.get(key);
      if (remaining) move(remaining.branch, target.branch, 0, cents(remaining.amount, 'Remaining Revenue'));
    } else if (/^scope\|[a-z][a-z0-9_]*$/.test(key)) {
      const role = key.slice(6);
      assert(roleKeys.has(role) && roleBranches[role], 'Missing exact baseline role: ' + role);
      nextRoles[role] = target.branch;
    } else assert.fail('Unsupported exact target: ' + key);
  }
  const scopeBefore = allocateScope(scope, roleBranches), scopeAfter = allocateScope(scope, nextRoles);
  for (const branch of new Set([...Object.keys(scopeBefore), ...Object.keys(scopeAfter)])) {
    const amount = cents(scopeAfter[branch] || 0, 'New scope allocation') - cents(scopeBefore[branch] || 0, 'Prior scope allocation');
    add(branch, amount, amount);
  }
  for (const [code, row] of expected) {
    const d = delta.get(code) || {revenue:0, revenueJob:0};
    row.revenue = (cents(row.revenue, 'Baseline current') + d.revenue) / 100;
    row.revenueJob = (cents(row.revenueJob, 'Baseline job') + d.revenueJob) / 100;
    row.contribution = (cents(row.revenue, 'Expected current') - cents(row.cost, 'Frozen cost')) / 100;
    row.contributionJob = (cents(row.revenueJob, 'Expected job') - cents(row.costJob, 'Frozen job cost')) / 100;
  }
  const rows = [...expected.values()].sort((a, b) => a.code.localeCompare(b.code));
  const wantedInvoices = rows.map(row => {
    const billed = invoiceMap.get(row.code)?.billed || 0;
    cents(billed, 'Frozen billed amount');
    return {branch:row.code, onRecord:row.revenue, job:row.revenueJob,
      toCome:(cents(row.revenueJob, 'Job') - cents(row.revenue, 'Current')) / 100,
      billed, unbilled:(cents(row.revenue, 'Current') - cents(billed, 'Billed')) / 100};
  });
  return {branches:rows, invoices:wantedInvoices,
    deltas:[...delta.values()].sort((a,b) => a.code.localeCompare(b.code)).map(d => ({...d, revenue:d.revenue/100, revenueJob:d.revenueJob/100})),
    contracts:contracts.map(row => ({...clone(row), branch:targetMap.get(row.key)?.branch || row.branch})),
    forecastRows:forecastRows.map(row => ({...clone(row), branch:targetMap.get(forecastKey(row))?.branch || row.branch})),
    scope:clone(scope), scopeBefore, scopeAfter};
}

function assertTransfers(expected, actual) {
  const wanted = index(expected.branches, 'code', 'expected branch');
  const received = index(actual.branches, 'code', 'actual branch');
  // An empty branch can cease to have a native row when its sole contract moves.
  // Missing zero rows do not hide a cent; every nonzero unexpected row still fails.
  const fields = ['revenue', 'revenueJob', 'cost', 'costJob', 'contribution', 'contributionJob'];
  for (const row of received.values()) for (const field of fields)
    cents(row[field], 'Actual ' + row.code + '/' + field);
  for (const code of new Set([...wanted.keys(), ...received.keys()])) {
    for (const field of fields) {
      const w = wanted.get(code)?.[field] || 0, a = received.get(code)?.[field] || 0;
      assert.equal(cents(a, 'Actual ' + code + '/' + field), cents(w, 'Expected ' + code + '/' + field),
        'Branch transfer mismatch: ' + code + '/' + field);
    }
  }
  const inv = index(actual.invoices, 'branch', 'actual invoice branch');
  equal([...inv.keys()].sort(), [...received.keys()].sort(), 'Finance invoice branches must match financial branches');
  const invoiceExpected = index(expected.invoices, 'branch', 'expected invoice branch');
  for (const [branch, row] of inv) {
    const w = invoiceExpected.get(branch);
    for (const field of ['onRecord', 'job', 'toCome', 'billed', 'unbilled'])
      assert.equal(cents(row[field], 'Actual invoice ' + field), cents(w?.[field] || 0, 'Expected invoice ' + field),
        'Finance invoice mismatch: ' + branch + '/' + field);
  }
  for (const [branch, row] of invoiceExpected) if (!inv.has(branch))
    assert(['onRecord','job','toCome','billed','unbilled'].every(k => row[k] === 0), 'Missing nonzero Finance invoice branch: ' + branch);
  if (actual.contracts !== undefined) equal(actual.contracts, expected.contracts, 'Contract amount, owner, category, source or effective branch changed unexpectedly');
  if (actual.forecastRows !== undefined) equal(actual.forecastRows, expected.forecastRows, 'Forecast amount, category, source or effective branch changed unexpectedly');
  if (actual.scope !== undefined) equal(actual.scope, expected.scope, 'Customer event scope changed');
  return true;
}

module.exports = {expectedTransfers, assertTransfers, allocateScope};
