/* Author: Andrew Fisher. Synthetic supplier-rate and site-count regression cases. */
'use strict';
const assert = require('node:assert/strict');
const model = require('../supplier_cost1068_src.js');
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function fixture() {
  return {
    source: {supplier: {name: 'Example supplier'}, authorisation: {state: 'approved'},
      totals: {sub_totals: 52.5, delivery_and_pickup: 7}, quotes: [
        {quote: 'EX1', sub_total: 40.5, delivery_charge: 2, pickup: 3, delivery: '2030-02-01', collect: '2030-02-05',
          groups: [{group: 'Example services', lines: [
            {description: 'Service A', qty: 10, unit_price: 2.15, total_price: 21.5},
            {description: 'Service B', qty: 4, unit_price: 0.335, total_price: 1.34},
            {description: 'Service C', qty: 2, unit_price: 3.5, total_price: 7},
            {description: 'Unrelated water', qty: 1, unit_price: 10.66, total_price: 10.66},
          ]}]},
        {quote: 'EX2', sub_total: 12, delivery_charge: 1, pickup: 1,
          groups: [{group: 'Other hire', lines: [{description: 'Unrelated hire', qty: 3, unit_price: 4, total_price: 12}]}]}
      ]},
    definitions: ['A', 'B', 'C'].map(name => ({quote: 'EX1', description: 'Service ' + name, card_line: name})),
    quantities: [{card_line: 'A', qty: 6}, {card_line: 'B', qty: 3}, {card_line: 'C', qty: 0}]
  };
}
const run = f => model.project(f.source, f.definitions, f.quantities);
const quoteSplit = m => m.quotes.flatMap(q => q.groups.flatMap(g => g.lines)).reduce((s, l) => s + model.cents(l.total_price || 0), 0);

test('site quantities replace quoted quantities only on mapped service lines', () => {
  const f = fixture(), m = run(f);
  assert.equal(m.complete, true);
  assert.deepEqual(m.lines.map(l => l.quantity), [6, 3, 0]);
  assert.deepEqual(m.lines.map(l => l.amount), [12.9, 1.01, 0]);
  assert.equal(m.serviceTotal, 13.91);
  assert.equal(m.total, 43.57);
  assert.equal(m.quotedServiceTotal, 29.84);
  assert.equal(m.quotedTotal, 59.5);
});
test('original quote, definition and quantity inputs are immutable', () => {
  const f = fixture(), before = JSON.stringify(f);
  run(f); assert.equal(JSON.stringify(f), before);
});
test('water, other hire, transport, authorisation and attribution remain unchanged', () => {
  const f = fixture(), m = run(f);
  assert.deepEqual(m.quotes[0].groups[0].lines[3], f.source.quotes[0].groups[0].lines[3]);
  assert.deepEqual(m.quotes[1].groups, f.source.quotes[1].groups);
  assert.equal(m.quotes[0].delivery_charge, 2); assert.equal(m.quotes[0].pickup, 3);
  assert.equal(m.quotes[1].costTotal1068, 14);
  assert.deepEqual(f.source.authorisation, {state: 'approved'});
});
test('aggregate, ledger line split and monthly quote amounts reconcile to cents', () => {
  const m = run(fixture());
  const transport = m.quotes.reduce((s, q) => s + model.cents(q.delivery_charge) + model.cents(q.pickup), 0);
  assert.equal(quoteSplit(m) + transport, model.cents(m.total));
  assert.equal(m.quotes.reduce((s, q) => s + q.costTotalCents1068, 0), model.cents(m.total));
});
test('a site quantity change immediately updates every derived cost amount', () => {
  const f = fixture(), before = run(f);
  f.quantities[0].qty = 9;
  const after = run(f);
  assert.equal(model.cents(after.serviceTotal) - model.cents(before.serviceTotal), 645);
  assert.equal(model.cents(after.total) - model.cents(before.total), 645);
  assert.equal(after.quotes[0].costTotalCents1068 - before.quotes[0].costTotalCents1068, 645);
  assert.equal(quoteSplit(after) - quoteSplit(before), 645);
  assert.equal(after.quotedTotal, before.quotedTotal);
});
test('supplier rate changes derive from the original quote, not customer rate metadata', () => {
  const f = fixture(); f.definitions[0].their_rate = 999; f.quantities[0].rate = 888;
  f.source.quotes[0].groups[0].lines[0].unit_price = 2.55;
  assert.equal(run(f).lines[0].amount, 15.3);
});
test('three-night service quantity comes from the caller; no event count is hard-coded', () => {
  const f = fixture(); f.quantities[0].qty = 8;
  assert.equal(run(f).lines[0].amount, 17.2);
});
test('zero site quantity is a valid zero cost, never the quoted quantity', () => {
  const f = fixture(); f.quantities.forEach(l => l.qty = 0); const m = run(f);
  assert.equal(m.complete, true); assert.equal(m.serviceTotal, 0); assert.equal(m.total, 29.66);
});
test('decimal products round once at line precision, without binary cent loss', () => {
  assert.equal(model.multiply(3, 0.335), 101);
  assert.equal(model.multiply(1, 1.005), 101);
  assert.equal(model.multiply(6, 0.1), 60);
  assert.equal(model.multiply(2, '1.2345'), 247);
  assert.equal(model.multiply('1e2', '2.5e-3'), 25);
});
test('invalid and unsafe rates or counts never produce a fabricated cost', () => {
  for (const value of [null, undefined, '', 'no rate', -1, Infinity, NaN, {}, true]) assert.equal(model.multiply(1, value), null);
  assert.equal(model.multiply(Number.MAX_SAFE_INTEGER, 100), null);
});
test('missing supplier rate is explicit and keeps unrelated known costs', () => {
  const f = fixture(); delete f.source.quotes[0].groups[0].lines[0].unit_price;
  const m = run(f);
  assert.equal(m.complete, false); assert.equal(m.total, null); assert.equal(m.serviceTotal, null);
  assert.equal(m.knownTotal, 30.67); assert.equal(m.lines[0].amount, null);
  assert.match(model.summary(m, n => String(n)), /known; incomplete/);
  assert.equal(m.quotes[0].groups[0].lines[0].total_price, null);
});
test('missing site quantity is explicit and cannot reuse quote quantity', () => {
  const f = fixture(); f.quantities.shift(); const m = run(f);
  assert.equal(m.complete, false); assert.equal(m.lines[0].quantity, null);
  assert.equal(m.lines[0].amount, null); assert.match(m.issues.join(' '), /Site servicing quantity/);
});
test('duplicate source matches are held rather than counted twice', () => {
  const f = fixture(); f.source.quotes[0].groups[0].lines.push({...f.source.quotes[0].groups[0].lines[0]});
  f.source.quotes[0].sub_total += 21.5;
  const m = run(f); assert.equal(m.complete, false);
  assert.equal(m.lines[0].amount, null); assert.match(m.issues.join(' '), /one matching quote line/);
  assert.equal(m.knownTotal, 30.67);
});
test('duplicate service definitions cannot double-count the service total', () => {
  const f = fixture(); f.definitions.push({...f.definitions[0]}); const m = run(f);
  assert.equal(m.complete, false); assert.equal(m.serviceKnownTotal, 1.01);
  assert.equal(m.knownTotal, 30.67);
  assert.equal(m.quotedServiceTotal, 29.84);
});
test('unmatched service source cannot silently leave its quote quantity in cost', () => {
  const f = fixture(); f.definitions[0].description = 'Unmatched source description';
  const m = run(f); assert.equal(m.complete, false); assert.equal(m.total, null);
  assert.equal(m.quotes[0].costTotal1068, null); assert.equal(m.knownTotal, 14);
});
test('absent sources remain explicitly incomplete rather than showing a zero service total', () => {
  const m = model.project(null, null, null);
  assert.equal(m.complete, false); assert.equal(m.serviceTotal, null); assert.equal(m.total, null);
  assert.match(m.issues.join(' '), /unavailable/);
  assert.equal(model.project({quotes: {}}, [], []).complete, false);
});
test('unitemised quote subtotal remains preserved when service quantities change', () => {
  const f = fixture(); f.source.quotes[0].sub_total += 5;
  assert.equal(run(f).total, 48.57);
});
test('service decoration changes supplier fields only; customer Revenue stays identical', () => {
  const f = fixture(); const customer = {card_lines: f.quantities.map((l, i) => ({...l, rate: 20 + i, amount: l.qty * (20 + i), from: 'typed', their_rate: 999})),
    at_cost: [{description: 'water', rate: 10.66, amount: 10.66}], total: 193.66, card_total: 183, their_water: 10.66,
    per1040: [{ref: 'EXAMPLE', total: 183}], nights1040: [{date: '2030-02-01'}]};
  customer.lines = customer.card_lines.concat(customer.at_cost);
  const before = JSON.stringify(customer), after = model.decorate(customer, f.source, f.definitions);
  assert.equal(JSON.stringify(customer), before);
  for (const key of ['total', 'card_total', 'their_water', 'at_cost', 'per1040', 'nights1040']) assert.deepEqual(after[key], customer[key]);
  after.card_lines.forEach((l, i) => { assert.equal(l.rate, customer.card_lines[i].rate); assert.equal(l.amount, customer.card_lines[i].amount); assert.equal(l.from, 'typed'); });
  assert.equal(after.their_total, 13.91); assert.equal(after.card_lines[0].their_rate, 2.15);
});
test('quote totals remain explicitly reference-only', () => {
  const m = run(fixture()), text = model.summary(m, n => n.toFixed(2));
  assert.match(text, /site count: 13\.91/); assert.match(text, /Original quote servicing: 29\.84 ex GST, reference only/);
});
console.log(passed + ' synthetic supplier-cost checks passed');
