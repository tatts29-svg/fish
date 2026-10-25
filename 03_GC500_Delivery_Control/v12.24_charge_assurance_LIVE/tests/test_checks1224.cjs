// Author: Andrew Fisher. Synthetic arithmetic tests; no operational figures.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = path.join(__dirname, '..', 'charge_checks1224_src.js');
const {cents, reconcile} = require(source);

test('decimal half-up rounding preserves source precision and negative ties', () => {
  const cases = [
    [0, 0], [-0, 0], ['-0.000', 0], ['0.0049', 0], ['0.005', 1],
    ['-0.0049', 0], ['-0.005', -1], [1.005, 101], [-1.005, -101],
    [2.675, 268], [-2.675, -268], ['1.234999', 123], ['1.235', 124],
    ['-1.234999', -123], ['-1.235', -124], ['.5', 50], ['-.5', -50],
    ['+001.0100', 101], ['1.', 100], [' 1.01 ', 101], ['9.999', 1000]
  ];
  for (const [input, expected] of cases) assert.equal(cents(input), expected, String(input));
});

test('decimal exponent notation is exact and bounded before BigInt allocation', () => {
  const cases = [
    ['1005e-3', 101], ['-1005e-3', -101], ['1.005E+2', 10050],
    ['5e-3', 1], ['4.999e-3', 0], [1e-7, 0], ['1e-1000000', 0],
    ['-5e-1000000', 0], ['0e+1000000', 0], ['1e1000000', null],
    ['1e-999999999999999999999999999999999999999999999999999999999', 0]
  ];
  for (const [input, expected] of cases) assert.equal(cents(input), expected, String(input));
});

test('missing, non-finite and non-decimal monetary inputs are unavailable', () => {
  const invalid = [undefined, null, '', ' ', true, false, {}, [], [1],
    NaN, Infinity, -Infinity, 'NaN', 'Infinity', '0x10', '0b10', '1,000',
    '$1.00', '1_000', '.', '+', '-', '1e', '--1', '1.2.3'];
  for (const input of invalid) assert.equal(cents(input), null, String(input));
});

test('cent safety is checked after rounding, on either side of zero', () => {
  assert.equal(cents('90071992547409.91'), Number.MAX_SAFE_INTEGER);
  assert.equal(cents('-90071992547409.91'), -Number.MAX_SAFE_INTEGER);
  assert.equal(cents('90071992547409.914'), Number.MAX_SAFE_INTEGER);
  assert.equal(cents('90071992547409.915'), null);
  assert.equal(cents('-90071992547409.915'), null);
  assert.equal(cents('90071992547409.92'), null);
  assert.equal(cents(Number.MAX_SAFE_INTEGER), null);
});

test('reconciliation adds rounded parts in integer cents', () => {
  assert.deepEqual(reconcile('Decimal sum', '0.30', [0.1, 0.2]), {
    label: 'Decimal sum', status: 'pass', expected: 30, actual: 30, variance: 0
  });
  assert.deepEqual(reconcile('Currency lines', '.02', ['.005', '.005']), {
    label: 'Currency lines', status: 'pass', expected: 2, actual: 2, variance: 0
  });
  assert.equal(reconcile('Explicit zero', 0, []).status, 'pass');
  assert.equal(reconcile('Credit', '-1.01', ['-1.005']).status, 'pass');
  const parts = Object.freeze([Object.freeze({label: 'First', amount: '.10'}),
    Object.freeze({label: 'Second', amount: '.20'})]);
  assert.equal(reconcile('Labelled parts', '.30', parts).status, 'pass');
});

test('one-cent variances fail in both directions', () => {
  assert.deepEqual(reconcile('High', '.29', ['.10', '.20']), {
    label: 'High', status: 'fail', expected: 29, actual: 30, variance: 1
  });
  assert.deepEqual(reconcile('Low', '.31', ['.10', '.20']), {
    label: 'Low', status: 'fail', expected: 31, actual: 30, variance: -1
  });
});

test('unknown amounts and absent parts never become zero', () => {
  for (const part of [null, undefined, '', NaN, {label: 'Missing'}, {amount: null}]) {
    assert.deepEqual(reconcile('Unknown part', 0, [part]), {
      label: 'Unknown part', status: 'unavailable', expected: 0, actual: null, variance: null
    });
  }
  for (const parts of [null, undefined, {}, '0']) {
    assert.equal(reconcile('Absent parts', 0, parts).status, 'unavailable');
  }
  assert.deepEqual(reconcile('Unknown expected', null, [1]), {
    label: 'Unknown expected', status: 'unavailable', expected: null, actual: 100, variance: null
  });
  assert.equal(reconcile('Sparse array', 0, Array(1)).status, 'unavailable');
});

test('BigInt addition handles safe cancellation and rejects unsafe totals or variance', () => {
  const maximum = '90071992547409.91';
  assert.equal(reconcile('Cancellation', maximum, [maximum, maximum, '-' + maximum]).status, 'pass');
  assert.deepEqual(reconcile('Unsafe sum', 0, [maximum, '.01']), {
    label: 'Unsafe sum', status: 'unavailable', expected: 0, actual: null, variance: null
  });
  assert.deepEqual(reconcile('Unsafe variance', '-' + maximum, [maximum]), {
    label: 'Unsafe variance', status: 'unavailable', expected: -Number.MAX_SAFE_INTEGER,
    actual: Number.MAX_SAFE_INTEGER, variance: null
  });
});

test('browser export is available without CommonJS or operational dependencies', () => {
  const context = {window: {}};
  vm.runInNewContext(fs.readFileSync(source, 'utf8'), context);
  assert.equal(context.window.ChargeChecks1224.cents('1.005'), 101);
  assert.equal(context.window.ChargeChecks1224.reconcile('Browser', '.3', ['.1', '.2']).status, 'pass');
  assert.equal(Object.isFrozen(context.window.ChargeChecks1224), true);
});
