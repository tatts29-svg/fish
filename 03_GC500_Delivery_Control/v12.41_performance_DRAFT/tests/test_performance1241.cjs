// Author: Andrew Fisher. Offline fictional regression tests; no browser, network or native records.
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const filename = path.join(root, 'performance1241_src.js');
const source = fs.readFileSync(filename, 'utf8');
const API = require(filename);
const sha = text => crypto.createHash('sha256').update(text).digest('hex');
const checks = [];
function test(name, run) {
  try {run(); checks.push({name, pass: true});}
  catch (error) {checks.push({name, pass: false, error: error.message});}
}
const clone = value => JSON.parse(JSON.stringify(value));

// These are native code spans exercised by the patch, surrounded by fictional
// stubs. The fixture contains no project records or financial source values.
const nativeFinance = `fin745Rows=function(){return priorFinance.apply(this,arguments).map(row=>{
 if(!isPerson(row.person)||!DATES.includes(row.date))return row;
 const person=ourCostOf(personId(row.person)),override=fin745Latest('rate',row.person);
 const quoted=person?.workforce1010?.quote===QUOTE.number&&!override&&person.pay_rate===QUOTE.rate,overlapIds=api.overlaps(row.date);
 return {...row,rateBasis:overlapIds.length?'Supplier labour already recorded for this date · allocation review: '+overlapIds.join(', '):quoted?'Advanced quote 27172 · race-day supplier rate, 4 h minimum':row.rateBasis,overlapIds1010:overlapIds};
});};`;
const nativeAfter = `function after() {
 const pane = D.getElementById('pane-demob'); if (mo) mo.disconnect();
 decorationCalls++; decorationDepths.push(holdDepth); if (throwDecoration) throw new Error('synthetic decoration failure');
}`;
const nativeRender = "renderDemob816 = function () { let v; rendering++; try { v = renderBefore.apply(this, arguments); } finally { rendering--; } after(); return v; };";
const readyBoot = "if (p && !p.hidden && typeof renderDemob816 === 'function') renderDemob816();";
const mapBoot = "if (p && !p.hidden && p.querySelector('.sec1231')) renderDemob816();";
const gate = '<script>/* Author: Andrew Fisher. The data gate exists before any record is drawn. */';
const footer = "+' · v12.37'; /* v8.19 release922";
const fixture = `<script id="eventcrew1237-script"></script><script id="demobmap1236-script"></script>
${gate}</script>
<script id="synthetic-ready-boot">${readyBoot}</script>
<script id="synthetic-map-boot">${mapBoot}</script>
<script id="synthetic-runtime">${nativeAfter}\n${nativeRender}\n${nativeFinance}</script>
<script>const syntheticFooter = 'Synthetic fixture'${footer} */</script>`;

const cases = [
  ['missing event crew base marker', fixture.replace('id="eventcrew1237-script"', 'id="synthetic-missing"')],
  ['missing Demob base marker', fixture.replace('id="demobmap1236-script"', 'id="synthetic-missing"')],
  ['wrong source footer', fixture.replace(footer, footer.replace('12.37', '12.36'))],
  ['duplicate source footer', fixture + footer],
  ['missing boot span', fixture.replace(readyBoot, '/* synthetic missing native boot */')],
  ['duplicate boot span', fixture + readyBoot],
  ['changed Finance span', fixture.replace('const person=ourCostOf(personId(row.person))', 'const person=changedSyntheticLookup(row.person)')],
  ['duplicate Finance span', fixture + nativeFinance],
  ['missing native data gate', fixture.replace(gate, '<script>/* changed synthetic gate */')],
  ['duplicate native data gate', fixture + gate]
];
const python = `import json,sys
from pathlib import Path
p=Path(sys.argv[1]); ns={'__file__':str(p),'__name__':'synthetic_test'}
exec(compile(p.read_text(),str(p),'exec'),ns)
i=json.load(sys.stdin); patch=ns['patch']; out={'cases':[]}
out['patched']=patch(i['fixture'],'fictional-native-fixture')
for name,text in i['cases']+[('repeat application',out['patched'])]:
 try:
  patch(text,'fictional-negative-fixture');out['cases'].append({'name':name,'refused':False})
 except Exception as e:
  out['cases'].append({'name':name,'refused':True,'type':type(e).__name__,'message':str(e)})
print(json.dumps(out))`;
const patchedRun = spawnSync('python3', ['-B', '-c', python, path.join(root, 'patch_v1241.py')], {
  input: JSON.stringify({fixture, cases}), encoding: 'utf8', maxBuffer: 2 * 1024 * 1024,
  env: {...process.env, PYTHONDONTWRITEBYTECODE: '1'}
});
let patchResult;
test('patch applies to the complete fictional native fixture', () => {
  assert.equal(patchedRun.status, 0, patchedRun.stderr);
  patchResult = JSON.parse(patchedRun.stdout);
  assert.match(patchResult.patched, /id="performance1241-script"/);
  assert.match(patchResult.patched, /v12\.41/);
});
if (!patchResult) {
  console.error(checks[0].error);
  process.exitCode = 1;
} else {
  for (const result of patchResult.cases) test('patch refuses ' + result.name, () => {
    assert.equal(result.refused, true);
    assert.equal(result.type, 'ValueError');
    assert.ok(result.message);
  });

  test('index preserves the first duplicate and original row identities', () => {
    const first = {id: 'synthetic', value: 1}, second = {id: 'synthetic', value: 2};
    const rows = Object.freeze([Object.freeze(first), Object.freeze(second)]);
    const index = API.firstIndex(rows);
    assert.strictEqual(index.get('synthetic'), first); assert.equal(index.size, 1);
    assert.equal(rows.length, 2);
  });
  test('index handles an empty list and missing requested ID', () => {
    const index = API.firstIndex([]); assert.equal(index.size, 0); assert.equal(index.get('absent'), undefined);
  });
  test('index skips null rows without dropping later valid rows', () => {
    const row = {id: 'kept'}; assert.strictEqual(API.firstIndex([null, undefined, row]).get('kept'), row);
  });
  test('index retains raw ID types rather than making numeric IDs match string lookups', () => {
    const number = {id: 7}, string = {id: '7'}, zero = {id: 0};
    const index = API.firstIndex([number, string, zero]);
    assert.strictEqual(index.get(7), number); assert.strictEqual(index.get(String(7)), string);
    assert.equal(index.get('0'), undefined); assert.strictEqual(index.get(0), zero);
  });
  test('index preserves native lookup behaviour for missing, null and special ID strings', () => {
    const missing = {}, nil = {id: null}, literal = {id: 'undefined'}, special = {id: '__proto__'};
    const index = API.firstIndex([missing, nil, literal, special]);
    assert.strictEqual(index.get(undefined), missing); assert.strictEqual(index.get(String(undefined)), literal);
    assert.equal(index.get(String(null)), undefined); assert.strictEqual(index.get('__proto__'), special);
  });

  function pane(tab = 'demob', on = true, hidden = false, section = true) {
    return {id: 'pane-' + tab, hidden, classList: {contains: name => name === 'on' && on},
      querySelector: name => name === '.sec1231' && section ? {} : null};
  }
  for (const [name, p, tab, active] of [
    ['selected active pane', pane(), 'demob', true],
    ['null pane', null, 'demob', false], ['undefined pane', undefined, 'demob', false],
    ['CSS-hidden pane without on class', pane('demob', false), 'demob', false],
    ['native hidden flag', pane('demob', true, true), 'demob', false],
    ['selected tab differs', pane(), 'today', false],
    ['different pane ID', pane('today'), 'demob', false],
    ['ordinary active matching tab', pane('today'), 'today', true]
  ]) test('pane eligibility: ' + name, () => assert.equal(API.paneActive(p, tab), active));

  const script = id => {
    const marker = '<script id="' + id + '">', start = patchResult.patched.indexOf(marker);
    assert.ok(start >= 0, 'fixture script exists: ' + id);
    return patchResult.patched.slice(start + marker.length, patchResult.patched.indexOf('</script>', start));
  };
  let runtimeScript = script('synthetic-runtime');
  const candidatePath = process.env.PAGE || path.join(root, '..', 'build', 'GC500_v12.41', 'GC500_Delivery_Control_hosted.html');
  let candidateSha256 = null;
  if (process.env.PAGE || fs.existsSync(candidatePath)) test('real built Finance wrapper matches and supplies the exercised implementation', () => {
    const candidate = fs.readFileSync(candidatePath, 'utf8');
    const startMarker = 'fin745Rows=function(){let people1241;', endMarker = '\n});};';
    const start = candidate.indexOf(startMarker), end = candidate.indexOf(endMarker, start);
    assert.ok(start >= 0 && end > start, 'candidate contains the bounded local-index wrapper');
    assert.equal(candidate.indexOf(startMarker, start + 1), -1, 'only one local-index wrapper');
    const actual = candidate.slice(start, end + endMarker.length);
    const fixtureStart = runtimeScript.indexOf(startMarker);
    assert.equal(actual, runtimeScript.slice(fixtureStart));
    runtimeScript = runtimeScript.slice(0, fixtureStart) + actual;
    candidateSha256 = sha(candidate);
  });
  for (const [id, needsSection] of [['synthetic-ready-boot', false], ['synthetic-map-boot', true]]) {
    for (const [name, p, tab, want] of [
      ['inactive Demob while Today selected', pane('demob', false), 'today', 0],
      ['stale on class while another tab selected', pane(), 'today', 0],
      ['hidden active Demob', pane('demob', true, true), 'demob', 0],
      ['direct active Demob navigation', pane(), 'demob', 1],
      ['active empty Demob shell', pane('demob', true, false, false), 'demob', needsSection ? 0 : 1]
    ]) test(id + ' respects ' + name, () => {
      const ctx = {p, state: {tab}, Performance1241: API, calls: 0};
      ctx.renderDemob816 = () => ctx.calls++; vm.runInNewContext(script(id), ctx);
      assert.equal(ctx.calls, want);
    });
  }

  function context() {
    const effects = {costReads: 0, oldFinds: 0, priorCalls: [], renderCalls: [], overrides: []};
    const ctx = {
      Performance1241: API, DATES: ['2030-04-10'], QUOTE: {number: 'SYNTHETIC-Q', rate: 17},
      isPerson: name => /^Synthetic crew /.test(name), personId: name => 'id|' + name,
      api: {overlaps: day => ctx.overlapByDay[day] || []}, overlapByDay: {},
      financeRows: [], costs: [], overrideByPerson: {},
      priorFinance: function (...args) {effects.priorCalls.push({receiver: this, args}); return ctx.financeRows;},
      ourCosts: () => {effects.costReads++; return ctx.costs;},
      ourCostOf: id => {effects.oldFinds++; return ctx.costs.find(c => c.id === String(id)) || null;},
      fin745Latest: (kind, person) => {effects.overrides.push([kind, person]); return ctx.overrideByPerson[person] || null;},
      D: {getElementById: () => pane()}, mo: {disconnect() {}}, rendering: 0,
      decorationCalls: 0, decorationDepths: [], throwDecoration: false, throwRender: false,
      holdDepth: 0, holdEntries: 0, outerHolds: 0,
      holdAssets: function (fn) {ctx.holdEntries++; if (!ctx.holdDepth) ctx.outerHolds++; ctx.holdDepth++; try {return fn();} finally {ctx.holdDepth--; }},
      renderBefore: function (...args) {effects.renderCalls.push({receiver: this, args, depth: ctx.holdDepth});
        if (ctx.throwRender) throw new Error('synthetic render failure'); return 'synthetic render result';}
    };
    vm.createContext(ctx); vm.runInContext(runtimeScript, ctx);
    return {ctx, effects};
  }
  const financeRow = (name, day = '2030-04-10') => ({id: 'shift|' + name, person: name, date: day, rateBasis: 'Synthetic ordinary basis', paid: 3, calculatedCost: 51});
  const person = (name, extra = {}) => ({id: 'id|' + name, pay_rate: 17, workforce1010: {quote: 'SYNTHETIC-Q'}, ...extra});

  test('Finance does no cost-list work when there are no eligible crew rows', () => {
    const {ctx, effects} = context(), ordinary = financeRow('Synthetic ordinary'), oldDay = financeRow('Synthetic crew A', '2030-04-09');
    ctx.financeRows = [ordinary, oldDay]; const out = ctx.fin745Rows('2030-04-10');
    assert.equal(effects.costReads, 0); assert.equal(effects.oldFinds, 0);
    assert.strictEqual(out[0], ordinary); assert.strictEqual(out[1], oldDay);
  });
  test('Finance reads the final cost list once for all eligible rows in a call', () => {
    const {ctx, effects} = context();
    ctx.financeRows = Array.from({length: 12}, (_, i) => financeRow('Synthetic crew ' + (i % 3)));
    ctx.costs = [0, 1, 2].map(i => person('Synthetic crew ' + i));
    const out = ctx.fin745Rows(); assert.equal(out.length, 12);
    assert.equal(effects.costReads, 1); assert.equal(effects.oldFinds, 0);
    assert.ok(out.every(r => /quoted supplier rate|race-day supplier rate/.test(r.rateBasis)));
  });
  test('Finance retains the original wrapper output, including first duplicate ID and unrelated rows', () => {
    const {ctx, effects} = context(), first = person('Synthetic crew A', {pay_rate: 18});
    ctx.costs = [first, person('Synthetic crew A'), person('Synthetic crew B')];
    ctx.financeRows = [financeRow('Synthetic crew A'), financeRow('Synthetic crew B'), financeRow('Synthetic ordinary')];
    const newFunction = ctx.fin745Rows, beforeRows = clone(ctx.financeRows), beforeCosts = clone(ctx.costs);
    vm.runInContext(nativeFinance, ctx); const expected = clone(ctx.fin745Rows('2030-04-10'));
    ctx.fin745Rows = newFunction; effects.costReads = 0;
    const result = ctx.fin745Rows('2030-04-10'); assert.deepEqual(clone(result), expected);
    assert.equal(effects.costReads, 1); assert.equal(result[0].rateBasis, 'Synthetic ordinary basis');
    assert.deepEqual(clone(ctx.financeRows), beforeRows); assert.deepEqual(clone(ctx.costs), beforeCosts);
  });
  test('Finance remains fresh on the next call after in-place mutation or list replacement', () => {
    const {ctx, effects} = context(); ctx.financeRows = [financeRow('Synthetic crew A')];
    ctx.costs = [person('Synthetic crew A')]; assert.match(ctx.fin745Rows()[0].rateBasis, /race-day supplier rate/);
    ctx.costs[0].pay_rate = 19; assert.equal(ctx.fin745Rows()[0].rateBasis, 'Synthetic ordinary basis');
    ctx.costs = [person('Synthetic crew A')]; assert.match(ctx.fin745Rows()[0].rateBasis, /race-day supplier rate/);
    assert.equal(effects.costReads, 3);
  });
  test('Finance handles a missing person and preserves override and overlap precedence', () => {
    const {ctx, effects} = context(); ctx.financeRows = [financeRow('Synthetic crew A')];
    assert.equal(ctx.fin745Rows()[0].rateBasis, 'Synthetic ordinary basis');
    ctx.costs = [person('Synthetic crew A')]; ctx.overrideByPerson['Synthetic crew A'] = {payload: {rate: 21}};
    assert.equal(ctx.fin745Rows()[0].rateBasis, 'Synthetic ordinary basis');
    ctx.overlapByDay['2030-04-10'] = ['synthetic-note'];
    const out = ctx.fin745Rows()[0]; assert.match(out.rateBasis, /allocation review: synthetic-note/);
    assert.deepEqual(clone(out.overlapIds1010), ['synthetic-note']); assert.equal(effects.costReads, 3);
  });
  test('Finance preserves prior function receiver and arguments and does not cache its result', () => {
    const {ctx, effects} = context(), receiver = {synthetic: true};
    ctx.fin745Rows.call(receiver, '2030-04-10', 'extra'); ctx.fin745Rows.call(receiver, '2030-04-11');
    assert.equal(effects.priorCalls.length, 2); assert.strictEqual(effects.priorCalls[0].receiver, receiver);
    assert.deepEqual(effects.priorCalls[0].args, ['2030-04-10', 'extra']);
    assert.deepEqual(effects.priorCalls[1].args, ['2030-04-11']);
  });
  test('Finance propagates native failure and a later call can recover', () => {
    const {ctx} = context(); ctx.priorFinance = () => {throw new Error('synthetic Finance failure');};
    assert.throws(() => ctx.fin745Rows(), /synthetic Finance failure/);
    ctx.priorFinance = () => [financeRow('Synthetic ordinary')]; assert.equal(ctx.fin745Rows().length, 1);
  });

  test('Demob render and all decorations share one outer synchronous asset hold', () => {
    const {ctx, effects} = context(), receiver = {synthetic: true};
    assert.equal(ctx.renderDemob816.call(receiver, 'synthetic argument'), 'synthetic render result');
    assert.equal(ctx.outerHolds, 1); assert.equal(ctx.holdDepth, 0); assert.equal(ctx.rendering, 0);
    assert.equal(ctx.decorationCalls, 1); assert.ok(effects.renderCalls[0].depth > 0);
    assert.strictEqual(effects.renderCalls[0].receiver, receiver);
    assert.deepEqual(effects.renderCalls[0].args, ['synthetic argument']);
    assert.ok(ctx.decorationDepths.every(n => n > 0));
  });
  test('deferred decorations start their own bounded asset hold', () => {
    const {ctx} = context(); ctx.after(); ctx.after();
    assert.equal(ctx.outerHolds, 2); assert.equal(ctx.decorationCalls, 2); assert.equal(ctx.holdDepth, 0);
  });
  test('failed Demob render releases its hold and rendering flag without decorating', () => {
    const {ctx} = context(); ctx.throwRender = true;
    assert.throws(() => ctx.renderDemob816(), /synthetic render failure/);
    assert.equal(ctx.holdDepth, 0); assert.equal(ctx.rendering, 0); assert.equal(ctx.decorationCalls, 0);
  });
  test('failed Demob decoration releases nested holds and rendering flag', () => {
    const {ctx} = context(); ctx.throwDecoration = true;
    assert.throws(() => ctx.renderDemob816(), /synthetic decoration failure/);
    assert.equal(ctx.holdDepth, 0); assert.equal(ctx.rendering, 0);
  });
  if (candidateSha256) console.log(JSON.stringify({builtCandidateSha256: candidateSha256, realFinanceWrapperExercised: true}));
}

const failures = checks.filter(check => !check.pass);
for (const failure of failures) console.error('FAIL ' + failure.name + '\n  ' + failure.error.slice(0, 1000));
console.log(JSON.stringify({author: 'Andrew Fisher', suite: 'performance1241 offline synthetic',
  sourceSha256: sha(source), patchSha256: sha(fs.readFileSync(path.join(root, 'patch_v1241.py'))),
  passed: checks.length - failures.length, failed: failures.length, checks: checks.length,
  failedChecks: failures.map(f => f.name)}));
process.exitCode = failures.length ? 1 : 0;
