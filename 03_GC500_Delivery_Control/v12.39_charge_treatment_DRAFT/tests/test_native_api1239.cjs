// Author: Andrew Fisher. Fictional native API tests in Node vm; no browser, network or live state.
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const filename = path.join(__dirname, '..', 'charge1239_src.js');
const source = fs.readFileSync(filename, 'utf8');
const sourceSha256 = crypto.createHash('sha256').update(source).digest('hex');
const clone = value => JSON.parse(JSON.stringify(value));
const json = value => JSON.stringify(value);
const PREFIX = 'charge-treatment1239|';
const CKEY = 'c|SYNTHETIC-CONTRACT|7';
const WKEY = 'service|Synthetic quoted water';
const TODAY = '2030-04-10';
const NOW = '2030-04-10T01:02:03.000Z';
const checks = [];
function test(name, run) {
  try { run(); checks.push({name, pass: true}); }
  catch (error) { checks.push({name, pass: false, error: error.message}); }
}
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

function fixture(options = {}) {
  const effects = {stamps: [], bumps: 0, flashes: [], drawers: [], handlers: {}};
  const row = {rental_contract: 'SYNTHETIC-CONTRACT', line: 7, description: 'Synthetic site office',
    asset_no: 'SYNTHETIC-ASSET', quantity: 2, kind: 'building', family: 'building',
    rate_1: 80, rate_type: 'whole event', branch_code: 'TEST',
    start_date: '2030-04-01', term_date: '2030-04-08', match: {ref: 'SYNTHETIC-REF'}};
  const ordinary = {amount: 160, actual: 120, remaining: 40, forecast: 160, how: 'whole event',
    basis: 'Synthetic ordinary source basis', days: 7, rate: 80, quantity: 2, supplierCost: 71};
  const asset = {lines: [
    {item: 'Synthetic site office', qty: 2, total: 160, provisional: 160, transport_cost: 19, transport_charge: 24},
    {item: 'Synthetic storage unit', qty: 1, total: 50, provisional: null, transport_cost: 8, transport_charge: 11}
  ], base: 210, known: 265, total: 265, accessories: 15, labour: 40, transport: 59};
  const forecast = {rows: [
    {contract: 'SYNTHETIC-CONTRACT', line: 7, amount: 45, ledger: '1000'},
    {contract: 'SYNTHETIC-OTHER', line: 8, amount: 70, ledger: '1000'},
    {contract: 'SYNTHETIC-SUPPLIER', line: 9, amount: 22, ledger: '1010'}
  ], total: 137, hireTotal: 115, rehireTotal: 22, label: 'Synthetic remaining hire'};
  const water = {key: WKEY, description: 'Synthetic quoted water', quote: 'SYNTHETIC-QUOTE',
    qty: 3, rate: 20, amount: 120, their_rate: 17, their_amount: 102, period: 'two visits', covered: true};
  const makeDrawer = () => {
    const fields = Object.fromEntries(['treatment', 'reason', 'evidence', 'confirmed_by', 'confirmed_on']
      .map(k => [k, {dataset: {field1239: k}, value: k === 'treatment' ? 'standard' : ''}]));
    const save = {}, closes = [{}, {}];
    return {className: '', style: {}, attrs: {}, fields, save, closes, removed: false,
      set innerHTML(html) {
        this.html = html;
        for (const match of html.matchAll(/<input data-field1239="([^"]+)"[^>]* value="([^"]*)"/g)) fields[match[1]].value = match[2];
      },
      get innerHTML() { return this.html; },
      setAttribute(k, v) { this.attrs[k] = v; },
      querySelector(selector) { return selector === '[data-save1239]' ? save : fields.treatment; },
      querySelectorAll(selector) { return selector === '[data-close1239]' ? closes : Object.values(fields); },
      addEventListener() {}, remove() { this.removed = true; }
    };
  };
  const ctx = {
    S: {answers: {'synthetic-reserved-answer': {kind: 'reserved', amount: 31}},
      lineRates: {}, records: {'SYNTHETIC-REF': {physical: true}}, labour: {synthetic: {hours: 5}}},
    ONHIRE_ROWS: [row, {...clone(row), rental_contract: 'SYNTHETIC-OTHER', line: 8,
      description: 'Synthetic storage unit', quantity: 1, rate_1: 50}],
    DATA: {toilet_servicing: {not_on_the_card: [{quote: 'SYNTHETIC-QUOTE', description: water.description, their_amount: 102}]},
      rehire_quotes: {quotes: [{quote: 'SYNTHETIC-QUOTE', sha256: 'a'.repeat(64), groups: [{lines: [
        {description: water.description, qty: 3, unit_price: 17, total_price: 102, period: 'two visits'}]}]}]}},
    Date: class extends Date {constructor(...args) { super(...(args.length ? args : [NOW])); } static now() { return Date.parse(NOW); }},
    document: {addEventListener(k, fn) {effects.handlers[k] = fn;}, createElement() {return makeDrawer();},
      body: {appendChild(d) {effects.drawers.push(d);}}},
    mayWrite: () => options.mayWrite !== false,
    whoAmI: () => options.who === undefined ? 'Synthetic Operator' : options.who,
    todayIso: () => TODAY,
    stampIt: (...args) => effects.stamps.push(args), bump: () => {effects.bumps++;},
    flash: message => effects.flashes.push(message), esc, capability: () => options.capability || 'edit', mounted: () => {},
    contractCharge: () => ordinary,
    contractAllocation1010: r => r.syntheticAllocated ? {synthetic: true} : null,
    contractTreatment747: r => r.syntheticReserved ? {kind: 'own_use'} : null,
    assetTotal: () => asset,
    gcModel925: () => ({rows: []}),
    ItemIdentity979: {select: (_key, item, rows) => rows.filter(r => r.description === item)},
    ItemCharges979: {project: () => ({lines: [{contract: 'SYNTHETIC-CONTRACT', line: 7, amount: 160},
      {contract: 'SYNTHETIC-OTHER', line: 8, amount: 50}]})},
    pricingForecast1010: () => forecast,
    contractMoneyWords: () => 'Synthetic ordinary contract words. ', card748Html: () => '<section>Standard card</section>',
    pl767Servicing: () => 'Synthetic standard servicing words.',
    servicing748: () => ({at_cost: [water], their_water: 102, supplier1068: {cost: 102}}),
    supplierCostWords1068: () => 'Synthetic supplier source cost.', money: n => '$' + n
  };
  vm.createContext(ctx);
  vm.runInContext(source, ctx, {filename, timeout: 1000});
  const api = ctx.ChargeTreatment1239;
  const approval = extra => ({treatment: 'own_use_hire', reason: 'Synthetic own-use approval.',
    evidence: 'Fictional message Alpha, exact line scope.', confirmed_by: 'Synthetic Approver',
    confirmed_on: '2030-04-09', ...extra});
  const make = (key = CKEY, extra = {}) => api.make(key, approval(key === WKEY ? {treatment: 'included_in_pumpouts', ...extra} : extra));
  const save = (key = CKEY, extra = {}) => api.set(key, make(key, extra));
  return {ctx, api, effects, row, ordinary, asset, forecast, water, approval, make, save};
}

test('runtime loads with fictional globals and registers only its click handler', () => {
  const f = fixture();
  for (const method of ['current', 'status', 'make', 'set', 'water', 'control', 'details', 'dialog', 'record']) assert.equal(typeof f.api[method], 'function');
  assert.deepEqual(Object.keys(f.effects.handlers), ['click']);
  assert.equal(f.effects.bumps, 0);
  assert.equal(f.effects.drawers.length, 0);
});
test('all no-decision financial projections retain ordinary results and state', () => {
  const f = fixture(), before = json(f.ctx.S);
  assert.strictEqual(f.ctx.contractCharge(f.row), f.ordinary);
  assert.strictEqual(f.ctx.assetTotal({key: 'SYNTHETIC-REF'}), f.asset);
  assert.strictEqual(f.ctx.pricingForecast1010(), f.forecast);
  assert.strictEqual(f.api.water(f.water), f.water);
  assert.equal(f.api.status(CKEY).state, 'none');
  assert.equal(f.api.details(CKEY), '');
  assert.equal(json(f.ctx.S), before);
});
test('make captures exact source and concurrency token without a write', () => {
  const f = fixture(), before = json(f.ctx.S), draft = f.make();
  assert.equal(draft.expectedRevision, 0); assert.equal(draft.expectedRecord, 'null');
  assert.equal(draft.source.row.asset_no, f.row.asset_no);
  assert.equal(draft.source.override, null);
  draft.source.row.quantity = 99;
  assert.equal(f.row.quantity, 2);
  assert.equal(json(f.ctx.S), before); assert.equal(f.effects.bumps, 0);
});
test('make never selects inclusion implicitly', () => {
  const f = fixture(), draft = f.api.make(CKEY, f.approval({treatment: undefined}));
  assert.equal(draft.treatment, undefined);
  assert.equal(f.api.set(CKEY, draft), false);
  assert.equal(f.effects.bumps, 0);
});
test('native save writes only its namespaced answer and stamps once', () => {
  const f = fixture(), before = clone(f.ctx.S), rawSources = json({rows: f.ctx.ONHIRE_ROWS, data: f.ctx.DATA});
  assert.equal(f.save(), true);
  const record = f.api.record(CKEY);
  assert.equal(record.revision, 1); assert.equal(record.recorded_by, 'Synthetic Operator');
  assert.equal(record.recorded_at, NOW); assert.equal(record.history.length, 0);
  assert.equal(f.api.status(CKEY).state, 'active');
  assert.deepEqual(f.effects.stamps, [['answers', PREFIX + CKEY, 'Synthetic Operator']]);
  assert.equal(f.effects.bumps, 1);
  const after = clone(f.ctx.S); delete after.answers[PREFIX + CKEY]; assert.deepEqual(after, before);
  assert.equal(json({rows: f.ctx.ONHIRE_ROWS, data: f.ctx.DATA}), rawSources);
});
test('native own-use save zeroes customer contract only and retains ordinary basis', () => {
  const f = fixture(); assert.equal(f.save(), true);
  const out = f.ctx.contractCharge(f.row);
  for (const k of ['amount', 'actual', 'remaining', 'forecast']) assert.equal(out[k], 0);
  assert.strictEqual(out.ordinary1239, f.ordinary);
  for (const k of ['rate', 'quantity', 'days', 'supplierCost']) assert.equal(out[k], f.ordinary[k]);
});
test('native forecast recalculates customer category totals and preserves other lines', () => {
  const f = fixture(); f.save(); const out = f.ctx.pricingForecast1010();
  assert.equal(out.total, 92); assert.equal(out.hireTotal, 70); assert.equal(out.rehireTotal, 22);
  assert.equal(out.rows[0].amount, 0); assert.strictEqual(out.rows[1], f.forecast.rows[1]);
  assert.strictEqual(out.rows[2], f.forecast.rows[2]); assert.equal(f.forecast.rows[0].amount, 45);
});
test('native asset projection preserves non-hire and supplier transport', () => {
  const f = fixture(); f.save(); const out = f.ctx.assetTotal({key: 'SYNTHETIC-REF'});
  assert.equal(out.base, 50); assert.equal(out.total, 105); assert.equal(out.known, 105);
  assert.equal(out.accessories, 15); assert.equal(out.labour, 40); assert.equal(out.transport, 59);
  assert.equal(out.lines[0].transport_cost, 19); assert.equal(out.lines[0].transport_charge, 24);
  assert.strictEqual(out.lines[1], f.asset.lines[1]);
});
test('native asset line with mixed treated and ordinary source rows stays ordinary', () => {
  const f = fixture(); f.save();
  f.ctx.ONHIRE_ROWS.push({...clone(f.row), rental_contract: 'SYNTHETIC-MIXED', line: 10});
  assert.strictEqual(f.ctx.assetTotal({key: 'SYNTHETIC-REF'}), f.asset);
});
test('native item presentation marks only the selected contract line own-use', () => {
  const f = fixture(); f.save(); const m = f.ctx.ItemCharges979.project();
  assert.equal(m.lines[0].ownUse, true); assert.equal(m.lines[1].ownUse, undefined);
});
test('native water save zeroes only separate customer charge', () => {
  const f = fixture(), before = json(f.ctx.DATA); assert.equal(f.save(WKEY), true);
  const out = f.api.water(f.water);
  assert.equal(out.amount, 0); assert.equal(out.ordinaryAmount1239, 120);
  for (const k of ['qty', 'rate', 'their_rate', 'their_amount', 'period', 'covered']) assert.equal(out[k], f.water[k]);
  assert.equal(json(f.ctx.DATA), before); assert.strictEqual(f.ctx.contractCharge(f.row), f.ordinary);
});

for (const [name, options] of [['read-only permission', {mayWrite: false}], ['no signed-in operator', {who: ''}]]) {
  test('save refuses ' + name + ' without any state effect', () => {
    const f = fixture(options), before = json(f.ctx.S);
    assert.equal(f.save(), false); assert.equal(json(f.ctx.S), before);
    assert.equal(f.effects.bumps, 0); assert.equal(f.effects.stamps.length, 0);
  });
}
for (const [name, mutate] of [
  ['unknown input field', d => {d.forceZero = true;}], ['wrong schema', d => {d.schema = 2;}],
  ['wrong key', d => {d.key = 'c|SYNTHETIC-OTHER|8';}], ['stale expected revision', d => {d.expectedRevision = 4;}],
  ['stale expected record', d => {d.expectedRecord = '{}';}], ['missing explicit treatment', d => {delete d.treatment;}],
  ['wrong source snapshot', d => {d.source.row.quantity = 3;}], ['blank reason', d => {d.reason = ' ';}],
  ['blank evidence', d => {d.evidence = '';}], ['unnamed confirmation', d => {d.confirmed_by = '';}],
  ['missing confirmation date', d => {d.confirmed_on = '';}], ['future confirmation date', d => {d.confirmed_on = '2030-04-11';}],
  ['invalid confirmation calendar date', d => {d.confirmed_on = '2030-02-30';}],
  ['water treatment on contract line', d => {d.treatment = 'included_in_pumpouts';}]
]) test('native save refuses ' + name + ' without mutation', () => {
  const f = fixture(), draft = f.make(), before = json(f.ctx.S); mutate(draft);
  assert.equal(f.api.set(CKEY, draft), false); assert.equal(json(f.ctx.S), before);
  assert.equal(f.effects.bumps, 0); assert.equal(f.effects.stamps.length, 0);
});
test('two open drafts cannot silently overwrite each other', () => {
  const f = fixture(), first = f.make(), second = f.make();
  assert.equal(f.api.set(CKEY, first), true); const saved = json(f.ctx.S);
  assert.equal(f.api.set(CKEY, second), false); assert.equal(json(f.ctx.S), saved); assert.equal(f.effects.bumps, 1);
});
test('same-revision content replacement is caught by expectedRecord', () => {
  const f = fixture(); f.save(); const draft = f.make();
  f.api.record(CKEY).reason = 'A separate fictional edit at the same revision.';
  const before = json(f.ctx.S);
  assert.equal(f.api.set(CKEY, draft), false); assert.equal(json(f.ctx.S), before);
});
test('source mutation between opening and saving holds the decision', () => {
  const f = fixture(), draft = f.make(); f.row.quantity = 3; const before = json(f.ctx.S);
  assert.equal(f.api.set(CKEY, draft), false); assert.equal(json(f.ctx.S), before);
});
test('rate override changed between opening and saving holds the decision', () => {
  const f = fixture(), draft = f.make(); f.ctx.S.lineRates[CKEY] = {rate: 91}; const before = json(f.ctx.S);
  assert.equal(f.api.set(CKEY, draft), false); assert.equal(json(f.ctx.S), before);
});
test('active decision holds after override changes and all customer projections restore ordinary', () => {
  const f = fixture(); f.save(); f.ctx.S.lineRates[CKEY] = {rate: 91}; const before = json(f.ctx.S);
  assert.equal(f.api.status(CKEY).state, 'review');
  assert.strictEqual(f.ctx.contractCharge(f.row), f.ordinary);
  assert.strictEqual(f.ctx.pricingForecast1010(), f.forecast);
  assert.strictEqual(f.ctx.assetTotal({key: 'SYNTHETIC-REF'}), f.asset);
  assert.equal(json(f.ctx.S), before);
});
test('fresh review can explicitly bind the current override and retain original history', () => {
  const f = fixture(); f.save(); f.ctx.S.lineRates[CKEY] = {rate: 91};
  assert.equal(f.save(), true); const record = f.api.record(CKEY);
  assert.equal(record.revision, 2); assert.equal(record.source.override.rate, 91);
  assert.equal(record.history[0].source.override, null); assert.equal(record.history[0].history, undefined);
  assert.equal(f.api.status(CKEY).state, 'active');
});
test('clear and reapply retain a flat ordered history and restore ordinary charges in between', () => {
  const f = fixture(); f.save(); assert.equal(f.save(CKEY, {treatment: 'standard', reason: 'Synthetic clearance.'}), true);
  assert.equal(f.api.status(CKEY).state, 'cleared'); assert.strictEqual(f.ctx.contractCharge(f.row), f.ordinary);
  assert.strictEqual(f.ctx.pricingForecast1010(), f.forecast); assert.strictEqual(f.ctx.assetTotal({key: 'SYNTHETIC-REF'}), f.asset);
  assert.equal(f.save(), true); const record = f.api.record(CKEY);
  assert.equal(record.revision, 3); assert.deepEqual(clone(record.history.map(h => h.revision)), [1, 2]);
  assert.deepEqual(clone(record.history.map(h => h.treatment)), ['own_use_hire', 'standard']);
  assert.ok(record.history.every(h => !Object.hasOwn(h, 'history'))); assert.equal(f.effects.bumps, 3);
});
test('removed source can be cleared without deleting its previous source evidence', () => {
  const f = fixture(); f.save(); f.ctx.ONHIRE_ROWS.splice(0, 1);
  assert.equal(f.api.status(CKEY).state, 'review');
  assert.equal(f.save(CKEY, {treatment: 'standard'}), true);
  assert.equal(f.api.status(CKEY).state, 'cleared');
  assert.equal(f.api.record(CKEY).history[0].source.row.asset_no, 'SYNTHETIC-ASSET');
});

for (const [name, mutate] of [
  ['a charge line', r => {r.charge_line = true;}], ['supplier subhire', r => {r.subhired = true;}],
  ['generator kind', r => {r.kind = 'generator';}], ['generator family', r => {r.family = 'generator';}],
  ['zero quantity', r => {r.quantity = 0;}], ['string quantity', r => {r.quantity = '2';}],
  ['existing native allocation', r => {r.syntheticAllocated = true;}],
  ['existing reserved source treatment', r => {r.syntheticReserved = true;}]
]) test('unsupported contract target is held: ' + name, () => {
  const f = fixture(); mutate(f.row); const before = json(f.ctx.S);
  assert.equal(f.api.current(CKEY).eligible, false); assert.equal(f.save(), false);
  assert.equal(json(f.ctx.S), before); assert.strictEqual(f.ctx.contractCharge(f.row), f.ordinary);
});
test('duplicate exact contract identity is refused', () => {
  const f = fixture(); f.ctx.ONHIRE_ROWS.push(clone(f.row));
  assert.equal(f.api.current(CKEY), null); assert.equal(f.save(), false);
});
for (const [name, mutate] of [
  ['duplicate quoted service', f => {f.ctx.DATA.toilet_servicing.not_on_the_card.push(clone(f.ctx.DATA.toilet_servicing.not_on_the_card[0]));}],
  ['duplicate quote identity', f => {f.ctx.DATA.rehire_quotes.quotes.push(clone(f.ctx.DATA.rehire_quotes.quotes[0]));}],
  ['duplicate matching quote line', f => {const lines = f.ctx.DATA.rehire_quotes.quotes[0].groups[0].lines; lines.push(clone(lines[0]));}],
  ['missing quote', f => {f.ctx.DATA.rehire_quotes.quotes.length = 0;}],
  ['invalid quote hash', f => {f.ctx.DATA.rehire_quotes.quotes[0].sha256 = 'not-a-hash';}],
  ['negative supplier quote total', f => {f.ctx.DATA.rehire_quotes.quotes[0].groups[0].lines[0].total_price = -1;}]
]) test('water source ambiguity is refused: ' + name, () => {
  const f = fixture(); mutate(f); const before = json(f.ctx.S);
  assert.equal(f.save(WKEY), false); assert.equal(json(f.ctx.S), before);
  assert.strictEqual(f.api.water(f.water), f.water);
});
test('changed supplier quote evidence holds saved water inclusion', () => {
  const f = fixture(); f.save(WKEY); f.ctx.DATA.rehire_quotes.quotes[0].groups[0].lines[0].total_price = 103;
  assert.equal(f.api.status(WKEY).state, 'review'); assert.strictEqual(f.api.water(f.water), f.water);
});
test('malformed retained history remains visible and cannot be silently overwritten', () => {
  const f = fixture(); f.save(); const record = f.api.record(CKEY);
  record.revision = 3; record.history = [null, 'synthetic malformed entry'];
  const before = json(f.ctx.S);
  assert.equal(f.api.status(CKEY).state, 'review');
  assert.match(f.api.details(CKEY), /Unrecognised retained history entry/);
  assert.equal(f.save(), false); assert.equal(f.save(CKEY, {treatment: 'standard'}), false);
  assert.equal(json(f.ctx.S), before);
});
test('unrecognised persisted primitive is held and safely rendered', () => {
  const f = fixture(); f.ctx.S.answers[PREFIX + CKEY] = 19;
  assert.equal(f.api.status(CKEY).state, 'review');
  assert.match(f.api.details(CKEY), /needs review/); assert.equal(f.save(), false);
});
test('source history and decision text are escaped in visible details', () => {
  const f = fixture(); f.save(CKEY, {reason: '<synthetic-script>', evidence: 'Evidence <only>'});
  const html = f.api.details(CKEY);
  assert.match(html, /&lt;synthetic-script&gt;/); assert.doesNotMatch(html, /<synthetic-script>/);
});
test('removed source decision is surfaced by the native pricing card', () => {
  const f = fixture(); f.save(); f.ctx.ONHIRE_ROWS.splice(0, 1);
  const html = f.ctx.card748Html(); assert.match(html, /source decisions to review/); assert.match(html, /SYNTHETIC-CONTRACT/);
});
test('view mode never renders an edit button and still shows held decision status', () => {
  const f = fixture({capability: 'view'}); assert.equal(f.api.control(CKEY), '');
  f.save(); f.row.quantity = 3; const html = f.api.control(CKEY);
  assert.match(html, /needs review/); assert.doesNotMatch(html, /<button/);
});
test('dialog defaults to standard with empty confirmation fields and has no write effects', () => {
  const f = fixture(), before = json(f.ctx.S); f.api.dialog(CKEY);
  const d = f.effects.drawers[0]; assert.ok(d);
  assert.equal(d.fields.treatment.value, 'standard'); assert.equal(d.fields.confirmed_by.value, '');
  assert.equal(d.fields.confirmed_on.value, ''); assert.equal(d.attrs.role, 'dialog');
  assert.equal(json(f.ctx.S), before); assert.equal(f.effects.bumps, 0);
  d.save.onclick(); assert.equal(f.effects.bumps, 0); assert.equal(d.removed, false);
});
test('dialog cancellation does not create an answer or clear an existing treatment', () => {
  const f = fixture(); f.save(); const before = json(f.ctx.S); f.api.dialog(CKEY);
  const d = f.effects.drawers[0]; assert.equal(d.fields.treatment.value, 'own_use_hire');
  d.closes[0].onclick(); assert.equal(d.removed, true); assert.equal(json(f.ctx.S), before);
});
test('dialog passes an explicit evidenced choice through the same guarded setter', () => {
  const f = fixture(); f.api.dialog(CKEY); const d = f.effects.drawers[0];
  for (const [k, value] of Object.entries(f.approval())) d.fields[k].value = value;
  d.save.onclick(); assert.equal(f.api.status(CKEY).state, 'active'); assert.equal(d.removed, true);
  assert.equal(f.effects.bumps, 1);
});
test('reservation appearing after make prevents a new generic exemption', () => {
  for (const flag of ['syntheticAllocated', 'syntheticReserved']) {
    const f = fixture(), draft = f.make(); f.row[flag] = true; const before = json(f.ctx.S);
    assert.equal(f.api.set(CKEY, draft), false, flag);
    assert.equal(json(f.ctx.S), before); assert.equal(f.effects.bumps, 0); assert.equal(f.effects.stamps.length, 0);
  }
});
test('stale-review dialog starts with standard charging and requires fresh explicit confirmation', () => {
  const f = fixture(); f.save(); f.row.quantity = 3; const before = json(f.ctx.S);
  f.api.dialog(CKEY); const d = f.effects.drawers[0];
  assert.equal(d.fields.treatment.value, 'standard');
  for (const field of ['reason', 'evidence', 'confirmed_by', 'confirmed_on']) assert.equal(d.fields[field].value, '', field);
  d.save.onclick(); assert.equal(json(f.ctx.S), before); assert.equal(f.effects.bumps, 1); assert.equal(d.removed, false);
});
function malformedHistoricalTreatment() {
  const f = fixture(); f.save(); const record = f.api.record(CKEY), prior = clone(record); delete prior.history;
  prior.treatment = {toString: null, valueOf: null}; record.revision = 2; record.history = [prior];
  return f;
}
test('historical malformed treatment cannot validate an active exemption', () => {
  const f = malformedHistoricalTreatment();
  assert.equal(f.api.status(CKEY).state, 'review');
  assert.strictEqual(f.ctx.contractCharge(f.row), f.ordinary);
});
test('historical malformed treatment renders a safe review instead of throwing', () => {
  const f = malformedHistoricalTreatment(), before = json(f.ctx.S);
  assert.match(f.api.details(CKEY), /review/i);
  assert.match(f.api.control(CKEY), /review/i);
  assert.doesNotThrow(() => f.api.dialog(CKEY));
  assert.equal(json(f.ctx.S), before);
});

const failures = checks.filter(c => !c.pass);
for (const failure of failures) console.error('FAIL ' + failure.name + '\n  ' + failure.error.slice(0, 900));
console.log(JSON.stringify({author: 'Andrew Fisher', suite: 'charge1239 synthetic native API', sourceSha256,
  passed: checks.length - failures.length, failed: failures.length, checks: checks.length,
  failedChecks: failures.map(f => f.name)}));
process.exitCode = failures.length ? 1 : 0;
