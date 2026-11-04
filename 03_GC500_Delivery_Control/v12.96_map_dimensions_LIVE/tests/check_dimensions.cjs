/* Author: Andrew Fisher. Synthetic guards for displayed map dimensions. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'dim1296_src.js'), 'utf8');
let passed = 0;
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function plain(v) { return JSON.parse(JSON.stringify(v)); }
function fixture() {
  const native = [
    { id: 'unit-a', assetNo: 'fixture-a', item: 'Building', physical: true },
    { id: 'unit-b', assetNo: 'fixture-b', item: 'Building', physical: true }
  ];
  const picked = native.map(u => ({ id: u.id, number: u.assetNo }));
  const actual = { lengthMm: 6100, widthMm: 2450, heightMm: 2700 };
  const nominal = { facts: [{ label: 'Nominal description', values: ['Length 6000 mm'] }] };
  const calls = [];
  const W = {
    assetOf: key => key === 'FIXTURE' ? { key } : null,
    Loading931: {
      unitsFor: () => native,
      info931: (a, type, u) => {
        calls.push(u?.id || null);
        return u ? { unit: u, recordCurrent: true, actualVerified: true, record: { actual } } : nominal;
      }
    },
    MapDemob1211: { reference: () => ({ items: [{ type: 'Building', n: 2, units: picked }], departure: { issues: [], unknown: false } }) },
    Departure1211: { read: () => ({ required: [{ type: 'Building', n: 2 }] }) },
    holdAssets: fn => fn(),
    heldMemo: (_key, fn) => fn()
  };
  const context = vm.createContext({ window: W });
  vm.runInContext(source, context);
  return { api: W.MapDimensions1296, W, native, picked, actual, nominal, calls, context };
}

check('verified dimensions include explicit millimetres and axis order', () => {
  const { api, actual } = fixture();
  assert.deepEqual(plain(api.dimension({ unit: {}, recordCurrent: true, actualVerified: true, record: { actual } })),
    { basis: 'Recorded transport', text: '6100 × 2450 × 2700 mm (L × W × H)' });
});
for (const [name, overrides] of [['stale identity', { recordCurrent: false }], ['unverified actual', { actualVerified: false }], ['missing unit', { unit: null }]]) {
  check(name + ' does not expose actual dimensions', () => {
    const { api, actual } = fixture();
    const info = { unit: {}, recordCurrent: true, actualVerified: true, record: { actual }, ...overrides };
    assert.equal(api.dimension(info), null);
  });
}
check('partial actual dimensions retain axis names and unknown qualification', () => {
  const { api } = fixture();
  const result = api.dimension({ unit: {}, recordCurrent: true, actualVerified: true, record: { actual: { widthMm: 2200 } } });
  assert.equal(result.text, 'W 2200 mm · other dimensions to confirm');
});
check('invalid and missing dimensions are not guessed from weight or rating', () => {
  const { api } = fixture();
  assert.equal(api.dimension({ unit: {}, recordCurrent: true, actualVerified: true, record: { actual: { lengthMm: -1, widthMm: Infinity, heightMm: '2700', massKg: 5000 } }, facts: [{ label: 'Description rating', values: ['60 kVA'] }] }), null);
});
check('nominal contract footprint remains explicitly nominal', () => {
  const { api } = fixture();
  assert.deepEqual(plain(api.dimension({ facts: [{ label: 'Contract-listed footprint', values: ['6000 × 2400 mm', '5000 kg'] }] })),
    { basis: 'Nominal (contract)', text: '6000 × 2400 mm' });
});
check('generic guide values are not actual or nominal dimensions', () => {
  const { api } = fixture();
  assert.equal(api.dimension({ facts: [{ label: 'Guide reference', values: ['6000 × 2400 mm'] }] }), null);
});
check('remaining dimensions use matching physical IDs and asset numbers', () => {
  const { api, calls } = fixture();
  const result = api.read('FIXTURE');
  assert.deepEqual(calls, ['unit-a', 'unit-b']);
  assert.equal(result[0].groups[0].n, 2);
  assert.equal(result[0].groups[0].basis, 'Recorded transport');
});
for (const [name, change] of [
  ['mismatched number', f => { f.picked[0].number = 'other-number'; }],
  ['mismatched type', f => { f.native[0].item = 'Other'; }],
  ['saved loading slot', f => { f.native[0].slot = true; }],
  ['nonphysical row', f => { f.native[0].physical = false; }],
  ['duplicate native candidate', f => { f.native.push({ ...f.native[0] }); }]
]) {
  check(name + ' cannot supply a verified dimension', () => {
    const f = fixture(); change(f);
    const result = f.api.read('FIXTURE');
    assert.equal(result[0].groups.find(g => g.basis === 'Recorded transport').n, 1);
    assert.equal(result[0].groups.find(g => g.basis === 'Nominal').n, 1);
  });
}
for (const [name, departure] of [['review quantity', { issues: ['review'], unknown: false }], ['unknown quantity', { issues: [], unknown: true }]]) {
  check(name + ' suppresses all remaining identity-specific dimensions', () => {
    const f = fixture();
    f.W.MapDemob1211.reference = () => ({ items: [{ type: 'Building', n: 2, units: f.picked }], departure });
    assert.equal(f.api.read('FIXTURE')[0].groups[0].basis, 'Nominal');
    assert.deepEqual(f.calls, [null]);
  });
}
check('overfull identity pool suppresses all actual dimensions', () => {
  const f = fixture();
  const result = f.api.project({}, [{ type: 'Building', n: 1, units: f.picked }], true, f.W.Loading931, []);
  assert.equal(result[0].groups[0].basis, 'Nominal');
  assert.deepEqual(f.calls, [null]);
});
check('duplicate picked identity does not claim two measured units', () => {
  const f = fixture();
  const result = f.api.project({}, [{ type: 'Building', n: 2, units: [f.picked[0], f.picked[0]] }], true, f.W.Loading931, []);
  assert.equal(result[0].groups[0].basis, 'Nominal');
  assert.deepEqual(f.calls, [null]);
});
check('unidentified remainder keeps its own nominal count', () => {
  const f = fixture();
  const result = f.api.project({}, [{ type: 'Building', n: 3, units: f.picked }], true, f.W.Loading931, []);
  assert.equal(result[0].groups.find(g => g.basis === 'Recorded transport').n, 2);
  assert.equal(result[0].groups.find(g => g.basis === 'Nominal').n, 1);
  assert.equal(f.api.compact(result), 'Sizes vary / partly to confirm');
});
check('general and departed reference labels never use remaining actuals', () => {
  const f = fixture();
  f.W.MapDemob1211.reference = () => { throw new Error('Remaining pool must not be used'); };
  const result = f.api.read('FIXTURE', false);
  assert.equal(result[0].groups[0].basis, 'Nominal');
  assert.deepEqual(f.calls, [null]);
});
check('mixed item types retain independent dimensions and quantities', () => {
  const f = fixture();
  f.W.Loading931.info931 = (_a, type) => ({ facts: [{ label: 'Nominal description', values: [type === 'Building' ? 'Length 6000 mm' : 'Length 1000 mm'] }] });
  const result = f.api.project({}, [{ type: 'Building', n: 2 }, { type: 'Tank', n: 1 }], false, f.W.Loading931, []);
  assert.deepEqual(plain(result.map(r => [r.type, r.groups[0].n, r.groups[0].text])), [['Building', 2, 'Length 6000 mm'], ['Tank', 1, 'Length 1000 mm']]);
  assert.equal(f.api.compact(result), 'Sizes vary / partly to confirm');
});
check('empty or entirely unknown map dimensions are omitted', () => {
  const { api } = fixture();
  assert.equal(api.compact([]), '');
  assert.equal(api.compact([{ groups: [{ basis: '', text: 'To confirm', n: 1 }] }]), '');
});
check('known and unknown groups cannot look uniformly measured', () => {
  const { api } = fixture();
  assert.equal(api.compact([{ groups: [{ basis: 'Nominal', text: 'Length 6000 mm', n: 1 }, { basis: '', text: 'To confirm', n: 1 }] }]), 'Sizes vary / partly to confirm');
});
check('uniform dimensions are explicitly per unit', () => {
  const { api } = fixture();
  assert.equal(api.compact([{ groups: [{ basis: 'Nominal', text: 'Length 6000 mm', n: 3 }] }]), 'Nominal Length 6000 mm · each');
});
check('unavailable reference fails closed', () => {
  const f = fixture();
  assert.deepEqual(plain(f.api.read('NOT-A-REFERENCE')), []);
  f.W.Loading931.info931 = () => { throw new Error('fixture unavailable'); };
  assert.deepEqual(plain(f.api.read('FIXTURE')), []);
});
check('projection leaves source references and dimensions unchanged', () => {
  const f = fixture();
  const items = [{ type: 'Building', n: 2, units: f.picked }];
  const before = JSON.stringify([items, f.native, f.actual, f.nominal]);
  f.api.project({}, items, true, f.W.Loading931, []);
  assert.equal(JSON.stringify([items, f.native, f.actual, f.nominal]), before);
});
// Exercise the real page's cache code with synthetic records, not a cache reimplementation.
// CACHE_PAGE is a local base/candidate HTML file; it is read only and never printed.
if (process.env.CACHE_PAGE) {
  const page = fs.readFileSync(process.env.CACHE_PAGE, 'utf8');
  function between(start, end) {
    const a = page.indexOf(start), b = page.indexOf(end, a);
    assert(a >= 0 && b > a, 'Native cache source anchors must exist');
    return page.slice(a, b);
  }
  const nativeCache = between('let ASSETS_HELD = null;', 'function allAssets()') +
    between('function holdAssets(fn){', '/* Author: Andrew Fisher. Red pin supplied');
  function cachedFixture() {
    const f = fixture();
    vm.runInContext(`
      var S = {}, DOCS = {at: 1, state: 'ready', files: []}, state = {};
      var fixtureBuilds = 0;
      function buildAllAssets() { fixtureBuilds++; return []; }
      function todayIso() { return '2099-01-01'; }
      ${nativeCache}
      window.holdAssets = holdAssets;
      window.heldMemo = heldMemo;
      window.holdCarry1066 = holdCarry1066;
    `, f.context);
    return f;
  }
  check('native cache reuses unchanged measurements without repeating source reads', () => {
    const f = cachedFixture();
    const first = f.api.read('FIXTURE');
    const sourceReads = f.calls.length;
    assert.equal(f.api.read('FIXTURE'), first);
    assert.equal(f.calls.length, sourceReads);
    assert.equal(vm.runInContext('fixtureBuilds', f.context), 1);
  });
  check('native record epoch invalidates dimension text even with unchanged quantity', () => {
    const f = cachedFixture();
    const first = f.api.compact(f.api.read('FIXTURE'));
    f.actual.lengthMm += 1;
    vm.runInContext('REC_EPOCH1066++', f.context);
    const next = f.api.compact(f.api.read('FIXTURE'));
    assert.notEqual(next, first);
    assert(next.includes('6101'));
    assert.equal(f.calls.length, 4);
  });
  check('native fetched-record replacement invalidates previous dimensions', () => {
    const f = cachedFixture();
    const first = f.api.compact(f.api.read('FIXTURE'));
    f.actual.widthMm += 1;
    vm.runInContext('S = {}', f.context);
    assert.notEqual(f.api.compact(f.api.read('FIXTURE')), first);
  });
  check('native epoch change clears actual dimensions when record becomes unknown', () => {
    const f = cachedFixture();
    assert.equal(f.api.read('FIXTURE')[0].groups[0].basis, 'Recorded transport');
    f.W.MapDemob1211.reference = () => ({ items: [{ type: 'Building', n: 2, units: f.picked }], departure: { issues: [], unknown: true } });
    vm.runInContext('REC_EPOCH1066++', f.context);
    assert.equal(f.api.read('FIXTURE')[0].groups[0].basis, 'Nominal');
  });
  check('remaining and general cache entries cannot leak measured dimensions across scopes', () => {
    const f = cachedFixture();
    assert.equal(f.api.read('FIXTURE', true)[0].groups[0].basis, 'Recorded transport');
    assert.equal(f.api.read('FIXTURE', false)[0].groups[0].basis, 'Nominal');
    assert.equal(f.api.read('FIXTURE', true)[0].groups[0].basis, 'Recorded transport');
  });
}
console.log('PASS ' + passed + ' synthetic dimension checks');
