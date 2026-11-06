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
const runtimeSource = fs.readFileSync(path.join(root, 'performance1241_runtime.js'), 'utf8');
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
 try { arm(); } catch (e) {} try { headers(); } catch (e) {} try { overview(); } catch (e) {} try { progress(); } catch (e) {}
 decorationCalls++; decorationDepths.push(holdDepth); if (throwDecoration) throw new Error('synthetic decoration failure');
}`;
const nativeRender = "renderDemob816 = function () { let v; rendering++; try { v = renderBefore.apply(this, arguments); } finally { rendering--; } after(); return v; };";
const readyBoot = "if (p && !p.hidden && typeof renderDemob816 === 'function') renderDemob816();";
const mapBoot = "if (p && !p.hidden && p.querySelector('.sec1231')) renderDemob816();";
const legacyCenter = "{ const st = pane.querySelector('.strip816'), on = st && st.querySelector('.dday816.on'); if (st && on) { const l = on.offsetLeft - st.clientWidth / 2 + on.offsetWidth / 2; if (l > 0 && st.scrollWidth > st.clientWidth) st.scrollLeft = l; } }";
const nativeLayout = `function legacyCenter(pane) { ${legacyCenter} }
function syntheticMount() {
 const selected=demobSel816(M),scroll=strip.scrollLeft;readings.clear();
 strip.classList.add('daystrip');strip.scrollLeft=scroll;pane.querySelector('.leg816')?.remove();
}
function syntheticModernRender() {const result='synthetic modern result';mount();WeatherStrip1002.reveal(document.getElementById('pane-demob'));return result;}
function scroller() {
 const pane = D.getElementById('pane-demob'); let sc = pane && pane.parentElement;
 while (sc && sc !== D.body) { const cs = getComputedStyle(sc); if (/(auto|scroll)/.test(cs.overflowY)) return sc; sc = sc.parentElement; }
 return null;
}`;
const nativePhoto = "dropPhotosOf=function(ref){return oldPhotos(ref).filter(p=>{const current=get(p.id);return !isArea(current)||(!current.removed&&linkedRefs(current).includes(String(ref)));}).map(p=>{const current=get(p.id);if(!isArea(current))return p;const projected=projectForRef(current,ref);delete projected.ref;return projected;});};";
const nativePhotos = `${nativePhoto}
function photoLinkPut(id,next,who) {
 S.photoLinks[id] = next;
 stampIt('photoLinks', id, who);
}`;
const nativeCosts = `function allCosts(docketPricer1018){
 return syntheticCostsRead.apply(this, arguments);
}`;
const nativePeople = `function personBranch868(name){ const n = String(name || '').trim().toLowerCase(); const P = ourCosts().find(c => c.kind === 'person' && String(c.person || '').trim().toLowerCase() === n); return P ? (normBranch(P.branch || '') || null) : null; }
function fh868People(labW){
 const today = todayIso(), r2 = n => Math.round((n + Number.EPSILON) * 100) / 100, by = new Map();
 const get = n => { if (!by.has(n)) by.set(n, {person: n, home: personBranch868(n), paid: 0, unpriced: 0, toDate: 0, toCome: 0}); return by.get(n); };
 try { fin745Rows(today).forEach(r => { if (typeof RaceCrew1227 !== 'undefined' && RaceCrew1227.isCrew(r)) return; /* v12.27 - a fencing cost, not wages */ const g = get(r.person), cost = r.status === 'confirmed' && r.actualCost != null ? r.actualCost : r.calculatedCost, past = r.date && r.date <= today && r.status !== 'forecast';
 g.paid += Number(r.paid) || 0; if (cost == null) g.unpriced += Number(r.paid) || 0; else if (past) g.toDate += cost; else g.toCome += cost; }); } catch (e) {}
 const allow = typeof labourAllowance858 === 'function' ? labourAllowance858() : 0;
 if (allow) { const who = [...by.keys()].find(n => typeof rosterAllowance859 === 'function' && rosterAllowance859(n)); const g = who ? by.get(who) : get('Salary allowance'); g.allowance = allow; g.toCome += allow; }
 const rows = [...by.values()].map(g => Object.assign(g, {paid: r2(g.paid), unpriced: r2(g.unpriced), toDate: r2(g.toDate), toCome: r2(g.toCome), job: r2(g.toDate + g.toCome)})).filter(g => g.paid || g.job).sort((a, b) => b.job - a.job || a.person.localeCompare(b.person));
 const homes = [...new Set(rows.map(g => g.home || '—'))].sort((a, b) => a === '—' ? 1 : b === '—' ? -1 : a.localeCompare(b));
 const byHome = {}; rows.forEach(g => { const k = g.home || '—'; byHome[k] = r2((byHome[k] || 0) + g.job); });
 const move = {}; rows.forEach(g => { const k = g.home || '—';const sp = fh866Split(g.job, {KINP: 1}); move[k] = move[k] || {}; Object.entries(sp).forEach(([b, v]) => { move[k][b] = r2((move[k][b] || 0) + v); }); });
 const revCols = [...new Set(Object.values(move).flatMap(o => Object.keys(o)))].sort((a, b) => a === '—' ? 1 : b === '—' ? -1 : a.localeCompare(b));
 const total = r2(rows.reduce((s, g) => s + g.job, 0)), set = rows.filter(g => g.home).length;
 return {rows, homes, byHome, move, revCols, total, set, toDate: r2(rows.reduce((s, g) => s + g.toDate, 0)), toCome: r2(rows.reduce((s, g) => s + g.toCome, 0))};
}`;
const gate = '<script>/* Author: Andrew Fisher. The data gate exists before any record is drawn. */';
const footer = "+' · v12.37'; /* v8.19 release922";
const fixture = `<script id="eventcrew1237-script"></script><script id="demobmap1236-script"></script>
${gate}</script>
<script id="synthetic-ready-boot">${readyBoot}</script>
<script id="synthetic-map-boot">${mapBoot}</script>
<script id="synthetic-runtime">${nativeAfter}\n${nativeRender}\n${nativeFinance}</script>
<script id="synthetic-layout">${nativeLayout}</script>
<script id="synthetic-photos">${nativePhotos}</script>
<script id="synthetic-costs">${nativeCosts}</script>
<script id="synthetic-people">${nativePeople}</script>
<script>const syntheticFooter = 'Synthetic fixture'${footer} */</script>
</body>
</html>`;

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
  ['duplicate native data gate', fixture + gate],
  ['missing native photo invalidation span', fixture.replace("S.photoLinks[id] = next;", '/* synthetic missing photo put */')],
  ['duplicate native photo projection', fixture + nativePhoto],
  ['missing native cost reader', fixture.replace('function allCosts(docketPricer1018){', 'function syntheticChangedCosts(docketPricer1018){')],
  ['duplicate native cost reader', fixture + nativeCosts],
  ['changed home-branch lookup span', fixture.replace('home: personBranch868(n)', 'home: syntheticChangedBranch(n)')],
  ['duplicate home-branch lookup span', fixture + nativePeople],
  ['missing terminal runtime anchor', fixture.replace('</body>\n</html>', '</body></html>')]
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
  test('Demob pass returns its value and finishes only after drawing depth is released', () => {
    const events = [], value = {synthetic: true};
    assert.equal(API.drawingDemob(), false);
    const result = API.demobPass(() => {events.push(['read', API.drawingDemob()]); return value;},
      () => events.push(['finish', API.drawingDemob()]));
    assert.strictEqual(result, value); assert.deepEqual(events, [['read', true], ['finish', false]]);
    assert.equal(API.drawingDemob(), false);
  });
  test('nested Demob passes finish exactly once at the outer boundary', () => {
    const events = [];
    const out = API.demobPass(() => API.demobPass(() => {events.push('nested read'); return 7;}, () => events.push('inner finish')),
      () => events.push('outer finish'));
    assert.equal(out, 7); assert.deepEqual(events, ['nested read', 'outer finish']);
  });
  test('failed nested Demob read releases all depth and does not finish', () => {
    let finishes = 0;
    assert.throws(() => API.demobPass(() => API.demobPass(() => {throw new Error('synthetic read error');}, () => finishes++),
      () => finishes++), /synthetic read error/);
    assert.equal(API.drawingDemob(), false); assert.equal(finishes, 0);
    assert.equal(API.demobPass(() => 9, () => finishes++), 9); assert.equal(finishes, 1);
  });
  test('failed Demob finish leaves drawing depth clear for later calls', () => {
    assert.throws(() => API.demobPass(() => 1, () => {throw new Error('synthetic finish error');}), /synthetic finish error/);
    assert.equal(API.drawingDemob(), false); assert.equal(API.demobPass(() => 2, () => {}), 2);
  });
  test('a caught nested read failure still allows the outer successful finish', () => {
    let finishes = 0;
    const out = API.demobPass(() => {
      assert.throws(() => API.demobPass(() => {throw new Error('synthetic inner failure');}, () => finishes++));
      assert.equal(API.drawingDemob(), true); return 8;
    }, () => finishes++);
    assert.equal(out, 8); assert.equal(finishes, 1); assert.equal(API.drawingDemob(), false);
  });
  test('page draw finishes Demob geometry after all later native decorators', () => {
    const order = [], value = {synthetic: true};
    const out = API.pageDraw(() => {
      API.demobPass(() => order.push('demob'), () => order.push('geometry'));
      order.push('later native decorator'); return value;
    });
    assert.strictEqual(out, value); assert.deepEqual(order, ['demob', 'later native decorator', 'geometry']);
  });
  test('nested page draws flush only the most recent Demob finish at the outer boundary', () => {
    const order = [];
    API.pageDraw(() => {
      API.demobPass(() => order.push('first'), () => order.push('old geometry'));
      API.pageDraw(() => API.demobPass(() => order.push('latest'), () => order.push('latest geometry')));
      order.push('outer complete');
    });
    assert.deepEqual(order, ['first', 'latest', 'outer complete', 'latest geometry']);
  });
  test('failed outer page draw discards queued geometry and a later page starts clean', () => {
    const order = [];
    assert.throws(() => API.pageDraw(() => {
      API.demobPass(() => {}, () => order.push('stale geometry')); throw new Error('synthetic page failure');
    }), /synthetic page failure/);
    assert.equal(API.pageDraw(() => 3), 3); assert.deepEqual(order, []);
    API.demobPass(() => {}, () => order.push('fresh direct geometry'));
    assert.deepEqual(order, ['fresh direct geometry']);
  });
  test('a geometry finish failure clears pending work and does not poison later page draws', () => {
    assert.throws(() => API.pageDraw(() => API.demobPass(() => {}, () => {throw new Error('synthetic geometry failure');})), /synthetic geometry failure/);
    let finishes = 0; API.pageDraw(() => API.demobPass(() => {}, () => finishes++));
    assert.equal(finishes, 1); assert.equal(API.drawingDemob(), false);
  });

  function photoContext() {
    const ctx = {held: false, memo: new Map(), calls: 0};
    ctx.heldMemo = (key, read) => {
      if (!ctx.held) return read();
      if (!ctx.memo.has(key)) ctx.memo.set(key, read());
      return ctx.memo.get(key);
    };
    vm.createContext(ctx); vm.runInContext(source, ctx);
    const api = ctx.Performance1241;
    return {ctx, api};
  }
  test('photo projection stays fresh on every read outside a native hold', () => {
    const {ctx, api} = photoContext(); let current = {id: 'synthetic-photo', title: 'first'};
    const read = () => {ctx.calls++; return [current];};
    const one = api.photoRows('SYNTHETIC-REF', read); current = {id: 'synthetic-photo', title: 'second'};
    const two = api.photoRows('SYNTHETIC-REF', read);
    assert.equal(ctx.calls, 2); assert.equal(one[0].title, 'first'); assert.equal(two[0].title, 'second');
    assert.equal(ctx.memo.size, 0);
  });
  test('photo projection reads once per reference inside a native hold and returns fresh shallow objects', () => {
    const {ctx, api} = photoContext(); ctx.held = true;
    const nested = {source: 'synthetic'}, original = Object.freeze({id: 'synthetic-photo', title: 'unchanged', nested});
    const read = () => {ctx.calls++; return Object.freeze([original]);};
    const one = api.photoRows('SYNTHETIC-REF', read), two = api.photoRows('SYNTHETIC-REF', read);
    assert.equal(ctx.calls, 1); assert.notStrictEqual(one, two); assert.notStrictEqual(one[0], two[0]);
    assert.notStrictEqual(one[0], original); assert.strictEqual(one[0].nested, nested);
    one[0].title = 'caller-only edit'; one.push({id: 'caller-only-photo'});
    const three = api.photoRows('SYNTHETIC-REF', read);
    assert.equal(three.length, 1); assert.equal(three[0].title, 'unchanged');
  });
  test('photo projection separates references and uses the native string reference identity', () => {
    const {ctx, api} = photoContext(); ctx.held = true;
    const read = () => {ctx.calls++; return [{id: 'synthetic-' + ctx.calls}];};
    assert.equal(api.photoRows(7, read)[0].id, api.photoRows('7', read)[0].id);
    assert.notEqual(api.photoRows('SYNTHETIC-OTHER', read)[0].id, api.photoRows('7', read)[0].id);
    assert.equal(ctx.calls, 2);
  });
  test('empty held photo results are reused until explicit invalidation', () => {
    const {ctx, api} = photoContext(); ctx.held = true; let rows = [];
    const read = () => {ctx.calls++; return rows;};
    assert.equal(api.photoRows('SYNTHETIC-REF', read).length, 0); rows = [{id: 'new-synthetic-photo'}];
    assert.equal(api.photoRows('SYNTHETIC-REF', read).length, 0);
    api.invalidatePhotos(); assert.equal(api.photoRows('SYNTHETIC-REF', read).length, 1); assert.equal(ctx.calls, 2);
  });
  test('photo invalidation refreshes every reference inside the same hold before save', () => {
    const {ctx, api} = photoContext(); ctx.held = true; let revision = 1;
    const read = () => {ctx.calls++; return [{id: 'synthetic-photo', revision}];};
    api.photoRows('A', read); api.photoRows('B', read); revision = 2; api.invalidatePhotos();
    assert.equal(api.photoRows('A', read)[0].revision, 2); assert.equal(api.photoRows('B', read)[0].revision, 2);
    assert.equal(ctx.calls, 4);
  });
  test('a restored carried memo is invalidated by a photo put outside its hold', () => {
    const {ctx, api} = photoContext(); ctx.held = true; let revision = 1;
    const read = () => {ctx.calls++; return [{id: 'synthetic-photo', revision}];};
    api.photoRows('A', read); const carried = new Map(ctx.memo);
    ctx.held = false; ctx.memo.clear(); revision = 2; api.invalidatePhotos();
    ctx.held = true; ctx.memo = new Map(carried);
    assert.equal(api.photoRows('A', read)[0].revision, 2); assert.equal(ctx.calls, 2);
  });
  test('native memo invalidation alone refreshes the photo projection', () => {
    const {ctx, api} = photoContext(); ctx.held = true; let revision = 1;
    const read = () => {ctx.calls++; return [{id: 'synthetic-photo', revision}];};
    api.photoRows('A', read); revision = 2; ctx.memo.clear();
    assert.equal(api.photoRows('A', read)[0].revision, 2); assert.equal(ctx.calls, 2);
  });
  test('failed photo reads do not poison a held reference for later recovery', () => {
    const {ctx, api} = photoContext(); ctx.held = true;
    assert.throws(() => api.photoRows('A', () => {throw new Error('synthetic photo failure');}), /synthetic photo failure/);
    assert.equal(api.photoRows('A', () => [{id: 'recovered-synthetic-photo'}])[0].id, 'recovered-synthetic-photo');
  });
  test('cost rows stay fresh outside holds and compute once inside a hold', () => {
    const {ctx, api} = photoContext(); let amount = 4;
    const read = () => {ctx.calls++; return [{id: 'synthetic-cost', amount, problems: []}];};
    assert.equal(api.costRows(read)[0].amount, 4); amount = 5;
    assert.equal(api.costRows(read)[0].amount, 5); assert.equal(ctx.calls, 2);
    ctx.held = true; api.costRows(read); api.costRows(read); assert.equal(ctx.calls, 3);
  });
  test('cost rows return independent arrays, rows and problem arrays while retaining nested source identity', () => {
    const {ctx, api} = photoContext(); ctx.held = true;
    const nested = {id: 'synthetic-source'}, problems = Object.freeze(['synthetic issue']);
    const sourceRows = Object.freeze([Object.freeze({id: 'synthetic-cost', amount: 4, problems, nested})]);
    const one = api.costRows(() => sourceRows), two = api.costRows(() => sourceRows);
    assert.notStrictEqual(one, two); assert.notStrictEqual(one[0], two[0]); assert.notStrictEqual(one[0].problems, two[0].problems);
    assert.strictEqual(one[0].nested, nested); assert.strictEqual(two[0].nested, nested);
    one[0].amount = 99; one[0].problems.push('caller only'); one.push({id: 'caller-only'});
    assert.equal(two.length, 1); assert.equal(two[0].amount, 4); assert.deepEqual(clone(two[0].problems), ['synthetic issue']);
    assert.deepEqual(clone(api.costRows(() => sourceRows)), clone(sourceRows));
  });
  test('cost rows preserve absent or non-array problems without inventing a new shape', () => {
    const {api} = photoContext();
    const out = api.costRows(() => [{id: 'A'}, {id: 'B', problems: null}, {id: 'C', problems: 'synthetic legacy text'}]);
    assert.equal(Object.hasOwn(out[0], 'problems'), false); assert.equal(out[1].problems, null); assert.equal(out[2].problems, 'synthetic legacy text');
  });
  test('empty cost snapshots are cached and native memo clearing restores fresh computation', () => {
    const {ctx, api} = photoContext(); ctx.held = true; let rows = [];
    const read = () => {ctx.calls++; return rows;}; api.costRows(read); rows = [{id: 'new-synthetic-cost'}];
    assert.equal(api.costRows(read).length, 0); ctx.memo.clear(); assert.equal(api.costRows(read).length, 1); assert.equal(ctx.calls, 2);
  });
  test('cost computation failures are propagated and do not cache a failed result', () => {
    const {ctx, api} = photoContext(); ctx.held = true;
    assert.throws(() => api.costRows(() => {throw new Error('synthetic costs failure');}), /synthetic costs failure/);
    assert.equal(api.costRows(() => [{id: 'recovered-cost'}])[0].id, 'recovered-cost');
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
  let costsScript = script('synthetic-costs');
  let peopleScript = script('synthetic-people');
  const candidatePath = process.env.PAGE || path.join(root, '..', 'build', 'GC500_v12.41', 'GC500_Delivery_Control_hosted.html');
  const candidateSource = (process.env.PAGE || fs.existsSync(candidatePath)) ? fs.readFileSync(candidatePath, 'utf8') : null;
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
  if (process.env.PAGE || fs.existsSync(candidatePath)) test('built performance helper matches the helper under test', () => {
    const candidate = fs.readFileSync(candidatePath, 'utf8'), marker = '<script id="performance1241-script">';
    const start = candidate.indexOf(marker); assert.ok(start >= 0);
    assert.equal(candidate.slice(start + marker.length, candidate.indexOf('</script>', start)).trim(), source.trim());
  });
  if (candidateSource) test('built terminal runtime matches the wrapper under test', () => {
    const marker = '<script id="performance1241-runtime">', start = candidateSource.indexOf(marker); assert.ok(start >= 0);
    assert.equal(candidateSource.slice(start + marker.length, candidateSource.indexOf('</script>', start)).trim(), runtimeSource.trim());
    assert.equal(script('performance1241-runtime').trim(), runtimeSource.trim());
  });
  if (candidateSource) test('real allCosts wrapper matches and supplies the explicit-argument regression tests', () => {
    const start = candidateSource.indexOf('function allCosts(docketPricer1018){');
    const end = candidateSource.indexOf('function allCosts1241Uncached(docketPricer1018){', start);
    assert.ok(start >= 0 && end > start);
    const actual = candidateSource.slice(start, end);
    const fixtureEnd = costsScript.indexOf('function allCosts1241Uncached(docketPricer1018){');
    assert.equal(actual, costsScript.slice(0, fixtureEnd));
    costsScript = actual + costsScript.slice(fixtureEnd);
  });
  if (candidateSource && process.env.BASE_PAGE) test('final docket-cost billing wrapper is byte-identical to the supplied base', () => {
    const base = fs.readFileSync(process.env.BASE_PAGE, 'utf8');
    const extract = text => {
      const marker = 'var baseLines = docketCostLines;\ndocketCostLines = function () {', start = text.indexOf(marker);
      assert.ok(start >= 0); const end = text.indexOf("if (typeof costFromWords === 'function')", start); assert.ok(end > start);
      return text.slice(start, end);
    };
    assert.equal(extract(candidateSource), extract(base));
  });
  if (candidateSource) test('built home-branch lookup matches and supplies the exercised implementation', () => {
    const start = candidateSource.indexOf('function personBranch868(');
    const end = candidateSource.indexOf('\nfunction fh866Branches(', start);
    assert.ok(start >= 0 && end > start);
    const actual = candidateSource.slice(start, end);
    assert.equal(actual, peopleScript); peopleScript = actual;
    const endOriginal = nativePeople.indexOf('\nfunction fh868People(');
    assert.equal(actual.slice(0, actual.indexOf('\nfunction fh868People(')), nativePeople.slice(0, endOriginal));
  });
  function peopleContext(original = false) {
    const effects = {costReads: 0, financeDates: [], normalisedBranches: []};
    const ctx = {costs: [], financeRows: [], allowance: 0, allowanceOwner: null,
      todayIso: () => '2030-04-10',
      ourCosts: () => {effects.costReads++; return ctx.costs;},
      fin745Rows: day => {effects.financeDates.push(day); return ctx.financeRows;},
      normBranch: value => {effects.normalisedBranches.push(value); return String(value || '').trim().toUpperCase();},
      RaceCrew1227: {isCrew: row => row.syntheticEventCrew === true},
      labourAllowance858: () => ctx.allowance,
      rosterAllowance859: name => name === ctx.allowanceOwner,
      fh866Split: amount => amount ? {KINP: amount} : {}
    };
    vm.createContext(ctx); vm.runInContext(original ? nativePeople : peopleScript, ctx);
    return {ctx, effects};
  }
  const peopleRow = (person, extra = {}) => ({person, date: '2030-04-09', status: 'review', paid: 2, calculatedCost: 7, ...extra});
  const sourcePerson = (person, branch, extra = {}) => ({kind: 'person', person, branch, ...extra});
  function expectedPeople(costs, rows, settings = {}) {
    const {ctx} = peopleContext(true); Object.assign(ctx, settings, {costs: clone(costs), financeRows: clone(rows)});
    return clone(ctx.fh868People({SYNTHETIC: 1}));
  }
  test('home branches remain lazy when there are no output people or only excluded event crew', () => {
    const {ctx, effects} = peopleContext(); ctx.fh868People({});
    ctx.financeRows = [peopleRow('Synthetic event crew', {syntheticEventCrew: true})];
    assert.equal(ctx.fh868People({}).rows.length, 0); assert.equal(effects.costReads, 0);
  });
  test('home branches read the final people list once for all names in one handover', () => {
    const {ctx, effects} = peopleContext();
    ctx.costs = Array.from({length: 5}, (_, i) => sourcePerson('Synthetic person ' + i, 'B' + i));
    ctx.financeRows = Array.from({length: 15}, (_, i) => peopleRow('Synthetic person ' + i % 5));
    assert.equal(ctx.fh868People({}).rows.length, 5); assert.equal(effects.costReads, 1);
    assert.deepEqual(effects.financeDates, ['2030-04-10']);
  });
  test('home branches retain first matching person despite preceding non-person rows and duplicate empty branches', () => {
    const {ctx, effects} = peopleContext();
    ctx.costs = [sourcePerson('Synthetic person', 'IGNORED', {kind: 'labour'}),
      sourcePerson('  SYNTHETIC PERSON  ', ''), sourcePerson('Synthetic person', 'LATER'),
      sourcePerson('Synthetic other', ' alpha ')];
    ctx.financeRows = [peopleRow('Synthetic person'), peopleRow('Synthetic other')];
    const out = ctx.fh868People({}); assert.equal(out.rows.find(r => r.person === 'Synthetic person').home, null);
    assert.equal(out.rows.find(r => r.person === 'Synthetic other').home, 'ALPHA');
    assert.deepEqual(clone(out), expectedPeople(ctx.costs, ctx.financeRows));
    assert.deepEqual(effects.normalisedBranches, ['', ' alpha ']); assert.equal(effects.costReads, 1);
  });
  test('normalised source lookup preserves separate exact display-name groups', () => {
    const {ctx} = peopleContext(); ctx.costs = [sourcePerson(' Synthetic Person ', ' b1 ')];
    ctx.financeRows = ['Synthetic Person', 'synthetic person', ' Synthetic Person '].map(name => peopleRow(name));
    const out = ctx.fh868People({}); assert.equal(out.rows.length, 3); assert.ok(out.rows.every(r => r.home === 'B1'));
    assert.deepEqual(clone(out), expectedPeople(ctx.costs, ctx.financeRows));
  });
  test('missing source people and blank source names keep native null and first-match behaviour', () => {
    const {ctx} = peopleContext(); ctx.costs = [sourcePerson(null, 'B0'), sourcePerson('', 'B1')];
    ctx.financeRows = [peopleRow('Synthetic missing'), peopleRow('')];
    const out = ctx.fh868People({}); assert.equal(out.rows.find(r => r.person === 'Synthetic missing').home, null);
    assert.equal(out.rows.find(r => r.person === '').home, 'B0');
    assert.deepEqual(clone(out), expectedPeople(ctx.costs, ctx.financeRows));
  });
  test('salary allowance for an existing person reuses its resolved home', () => {
    const {ctx, effects} = peopleContext(); ctx.costs = [sourcePerson('Synthetic person', 'B1')];
    ctx.financeRows = [peopleRow('Synthetic person')]; ctx.allowance = 4; ctx.allowanceOwner = 'Synthetic person';
    const out = ctx.fh868People({}); assert.equal(out.rows[0].allowance, 4); assert.equal(out.rows[0].home, 'B1');
    assert.equal(effects.costReads, 1);
    assert.deepEqual(clone(out), expectedPeople(ctx.costs, ctx.financeRows, {allowance: 4, allowanceOwner: 'Synthetic person'}));
  });
  test('salary allowance fallback creates one lazy lookup and retains its native label and allocation', () => {
    const {ctx, effects} = peopleContext(); ctx.costs = [sourcePerson(' salary ALLOWANCE ', 'B2')]; ctx.allowance = 4;
    const out = ctx.fh868People({}); assert.equal(out.rows[0].person, 'Salary allowance'); assert.equal(out.rows[0].home, 'B2');
    assert.equal(out.rows[0].toCome, 4); assert.equal(effects.costReads, 1);
    assert.deepEqual(clone(out), expectedPeople(ctx.costs, [], {allowance: 4}));
  });
  test('handover lookup refreshes on every invocation after source mutation or replacement', () => {
    const {ctx, effects} = peopleContext(); ctx.costs = [sourcePerson('Synthetic person', 'B1')];
    ctx.financeRows = [peopleRow('Synthetic person')]; assert.equal(ctx.fh868People({}).rows[0].home, 'B1');
    ctx.costs[0].branch = 'B2'; assert.equal(ctx.fh868People({}).rows[0].home, 'B2');
    ctx.costs = [sourcePerson('SYNTHETIC PERSON', 'B3')]; assert.equal(ctx.fh868People({}).rows[0].home, 'B3');
    assert.equal(effects.costReads, 3);
  });
  test('handover output preserves actual and forecast costs, rounding, unpriced hours, exclusions and source rows', () => {
    const {ctx, effects} = peopleContext();
    ctx.costs = [sourcePerson('Synthetic A', ' b1 '), sourcePerson('Synthetic B', 'B2')];
    ctx.financeRows = [peopleRow('Synthetic A', {paid: 2.125, calculatedCost: 7.123}),
      peopleRow('Synthetic A', {status: 'confirmed', actualCost: 11.456}),
      peopleRow('Synthetic B', {status: 'forecast', calculatedCost: 5.789}),
      peopleRow('Synthetic B', {date: '2030-04-12', calculatedCost: 2}),
      peopleRow('Synthetic unknown', {calculatedCost: null, paid: 1.234}),
      peopleRow('Synthetic event crew', {syntheticEventCrew: true, calculatedCost: 99})];
    const before = clone({costs: ctx.costs, rows: ctx.financeRows}), expected = expectedPeople(ctx.costs, ctx.financeRows);
    assert.deepEqual(clone(ctx.fh868People({OTHER: 8})), expected); assert.equal(effects.costReads, 1);
    assert.deepEqual(clone({costs: ctx.costs, rows: ctx.financeRows}), before);
  });
  test('handover keeps the original Finance-read catch boundary and allowance fallback', () => {
    const {ctx, effects} = peopleContext(); ctx.fin745Rows = () => {throw new Error('synthetic Finance failure');};
    ctx.allowance = 3; const out = ctx.fh868People({});
    assert.equal(out.rows.length, 1); assert.equal(out.rows[0].person, 'Salary allowance'); assert.equal(out.total, 3);
    assert.equal(effects.costReads, 1);
  });
  test('failed initial people read does not cache failure before salary-allowance fallback retries', () => {
    const {ctx, effects} = peopleContext(); ctx.financeRows = [peopleRow('Synthetic A')]; ctx.allowance = 3;
    ctx.ourCosts = () => {effects.costReads++; if (effects.costReads === 1) throw new Error('synthetic source failure'); return [];};
    const out = ctx.fh868People({}); assert.equal(effects.costReads, 2); assert.equal(out.rows.length, 1);
    assert.equal(out.rows[0].person, 'Salary allowance'); assert.equal(out.rows[0].home, null);
  });
  test('runtime render wrapper preserves receiver, arguments, result and enumerable metadata', () => {
    const {ctx, api} = photoContext(), receiver = {synthetic: true}, value = {result: 'synthetic'}, calls = [], order = [];
    const before = function (...args) {
      calls.push({receiver: this, args}); api.demobPass(() => order.push('demob'), () => order.push('geometry'));
      order.push('last native decorator'); return value;
    };
    before.syntheticMetadata = {original: true}; ctx.render = before; ctx.window = ctx;
    vm.runInContext(script('performance1241-runtime'), ctx);
    assert.notStrictEqual(ctx.render, before); assert.strictEqual(ctx.render.syntheticMetadata, before.syntheticMetadata);
    assert.strictEqual(ctx.render.call(receiver, 'arg', 9), value);
    assert.strictEqual(calls[0].receiver, receiver); assert.deepEqual(calls[0].args, ['arg', 9]);
    assert.deepEqual(order, ['demob', 'last native decorator', 'geometry']);
  });
  test('runtime nested render calls flush the latest geometry after the outer render returns', () => {
    const {ctx, api} = photoContext(), order = []; ctx.window = ctx;
    ctx.render = function (level) {
      api.demobPass(() => order.push('read ' + level), () => order.push('geometry ' + level));
      if (level === 'outer') ctx.render('inner'); order.push('done ' + level); return level;
    };
    vm.runInContext(script('performance1241-runtime'), ctx);
    assert.equal(ctx.render('outer'), 'outer');
    assert.deepEqual(order, ['read outer', 'read inner', 'done inner', 'done outer', 'geometry inner']);
  });
  test('runtime native failure discards pending geometry and preserves future renders', () => {
    const {ctx, api} = photoContext(); let fail = true, finishes = 0; ctx.window = ctx;
    ctx.render = () => {api.demobPass(() => {}, () => finishes++); if (fail) throw new Error('synthetic native-render failure'); return 4;};
    vm.runInContext(script('performance1241-runtime'), ctx);
    assert.throws(() => ctx.render(), /synthetic native-render failure/); assert.equal(finishes, 0);
    fail = false; assert.equal(ctx.render(), 4); assert.equal(finishes, 1);
  });
  test('runtime refuses a missing native render or missing performance helper', () => {
    for (const ctx of [{Performance1241: API}, {render() {}}]) {
      ctx.window = ctx; assert.throws(() => vm.runInNewContext(script('performance1241-runtime'), ctx), /Native rendering is required/);
    }
  });
  function costsContext() {
    const {ctx, api} = photoContext(), calls = []; ctx.held = true;
    const rows = [{id: 'synthetic-cost', amount: 13, problems: ['synthetic issue'], source: {id: 'synthetic-source'}}];
    ctx.syntheticCostsRead = function (...args) {calls.push({receiver: this, args}); return rows;};
    vm.runInContext(costsScript, ctx);
    return {ctx, api, calls, rows};
  }
  test('native no-argument allCosts reuses a held read and returns fresh copies', () => {
    const {ctx, calls, rows} = costsContext(), receiver = {synthetic: true};
    const first = ctx.allCosts.call(receiver), second = ctx.allCosts.call(receiver);
    assert.equal(calls.length, 1); assert.strictEqual(calls[0].receiver, receiver); assert.deepEqual(calls[0].args, []);
    assert.notStrictEqual(first, second); assert.notStrictEqual(first[0], rows[0]); assert.notStrictEqual(first[0].problems, second[0].problems);
    assert.strictEqual(first[0].source, rows[0].source);
  });
  test('explicit undefined and custom pricers always bypass the ordinary held cost cache', () => {
    const {ctx, calls, rows} = costsContext(), receiver = {synthetic: true}, custom = () => 4;
    for (const args of [[undefined], [undefined], [custom], [custom, 'extra'], [null]]) {
      const before = calls.length; assert.strictEqual(ctx.allCosts.apply(receiver, args), rows);
      assert.equal(calls.length, before + 1); assert.strictEqual(calls.at(-1).receiver, receiver); assert.deepEqual(calls.at(-1).args, args);
    }
    assert.equal(ctx.memo.size, 0);
  });
  test('an explicit-pricer read cannot poison or consume the ordinary cached cost result', () => {
    const {ctx, calls} = costsContext(); ctx.allCosts();
    ctx.allCosts(() => 7); ctx.allCosts(undefined); ctx.allCosts(); assert.equal(calls.length, 3);
  });
  test('native allCosts remains fresh outside holds without a persistent cache', () => {
    const {ctx, calls, rows} = costsContext(); ctx.held = false;
    assert.equal(ctx.allCosts()[0].amount, 13); rows[0].amount = 21;
    assert.equal(ctx.allCosts()[0].amount, 21); assert.equal(calls.length, 2);
  });
  if (candidateSource) test('native save and shared-record invalidation refresh held cost rows before any redraw', () => {
    const extract = name => {
      const start = candidateSource.indexOf('function ' + name + '('); assert.ok(start >= 0, name);
      const brace = candidateSource.indexOf('{', start); let depth = 0;
      for (let i = brace; i < candidateSource.length; i++) {
        if (candidateSource[i] === '{') depth++;
        if (candidateSource[i] === '}' && --depth === 0) return candidateSource.slice(start, i + 1);
      }
      throw new Error('Missing native function end: ' + name);
    };
    const ctx = {REC_EPOCH1066: 0, RENDER_MEMO: new Map(), HELD_MEMO: new Map(), ASSETS_HELD: null, HELD_STALE775: false,
      buildAllAssets: () => [], save775Inner: () => true};
    ctx.window = ctx; vm.createContext(ctx);
    vm.runInContext(source + '\n' + ['heldFresh775', 'heldMemo', 'holdAssets', 'save', 'sharedCache975'].map(extract).join('\n'), ctx);
    const api = ctx.Performance1241; let amount = 3, reads = 0;
    const read = () => {reads++; return [{id: 'synthetic-cost', amount, problems: []}];};
    ctx.holdAssets(() => {
      assert.equal(api.costRows(read)[0].amount, 3); assert.equal(api.costRows(read)[0].amount, 3);
      amount = 4; ctx.save(); assert.equal(api.costRows(read)[0].amount, 4);
      amount = 5; ctx.sharedCache975(); assert.equal(api.costRows(read)[0].amount, 5);
    });
    assert.equal(reads, 3); assert.equal(ctx.REC_EPOCH1066, 2); assert.equal(ctx.HELD_MEMO.size, 0); assert.equal(ctx.ASSETS_HELD, null);
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
  test('final area photo projection preserves associations and invalidates immediately on native photo put', () => {
    const {ctx, api} = photoContext(); ctx.held = true;
    ctx.S = {photoLinks: {area: {id: 'area', kind: 'area', refs: ['A'], title: 'first'}}};
    const ordinary = {id: 'ordinary', title: 'ordinary source'};
    ctx.oldPhotos = () => {ctx.calls++; return [ordinary, {id: 'area', title: 'old source'}];};
    ctx.get = id => ctx.S.photoLinks[id]; ctx.isArea = p => p?.kind === 'area'; ctx.linkedRefs = p => p.refs;
    ctx.projectForRef = (p, ref) => ({...p, ref});
    const stamps = []; ctx.stampIt = (...args) => stamps.push(args);
    vm.runInContext(script('synthetic-photos'), ctx);
    assert.deepEqual(clone(ctx.dropPhotosOf('A').map(p => p.id)), ['ordinary', 'area']);
    assert.deepEqual(clone(ctx.dropPhotosOf('B').map(p => p.id)), ['ordinary']);
    const one = ctx.dropPhotosOf('A'); one[0].title = 'caller-only';
    assert.equal(ctx.dropPhotosOf('A')[0].title, 'ordinary source');
    assert.equal(Object.hasOwn(ctx.dropPhotosOf('A')[1], 'ref'), false);
    assert.equal(ctx.calls, 2);
    ctx.photoLinkPut('area', {id: 'area', kind: 'area', refs: ['B'], title: 'second'}, 'Synthetic recorder');
    assert.deepEqual(clone(ctx.dropPhotosOf('A').map(p => p.id)), ['ordinary']);
    assert.equal(ctx.dropPhotosOf('B')[1].title, 'second'); assert.equal(ctx.calls, 4);
    ctx.photoLinkPut('area', {id: 'area', kind: 'area', refs: ['B'], removed: true}, 'Synthetic recorder');
    assert.deepEqual(clone(ctx.dropPhotosOf('B').map(p => p.id)), ['ordinary']);
    assert.deepEqual(stamps, [['photoLinks', 'area', 'Synthetic recorder'], ['photoLinks', 'area', 'Synthetic recorder']]);
    assert.equal(ordinary.title, 'ordinary source'); assert.equal(typeof api.invalidatePhotos, 'function');
  });

  function layoutContext() {
    const counts = {scrollReads: 0, scrollWrites: 0, geometry: 0, styles: 0, reveal: 0, mount: 0};
    let scroll = 31;
    const button = {get offsetLeft() {counts.geometry++; return 200;}, get offsetWidth() {counts.geometry++; return 50;}};
    const strip = {classList: {add() {}}, querySelector: () => button,
      get clientWidth() {counts.geometry++; return 100;}, get scrollWidth() {counts.geometry++; return 500;},
      get scrollLeft() {counts.scrollReads++; return scroll;}, set scrollLeft(value) {counts.scrollWrites++; scroll = value;}};
    const body = {}, main = {tagName: 'MAIN', parentElement: body, overflowY: 'auto'};
    const pane = {parentElement: main, querySelector: selector => selector === '.strip816' ? strip : null};
    const ctx = {Performance1241: API, strip, pane, M: {}, rendering: false, printing: false, readings: {clear() {}},
      demobSel816: () => '2030-04-10', D: {body, getElementById: () => pane},
      document: {getElementById: () => pane}, WeatherStrip1002: {reveal() {counts.reveal++;}},
      mount: () => counts.mount++, getComputedStyle: element => {counts.styles++; return {overflowY: element.overflowY || 'visible'};},
      matchMedia: () => ({matches: ctx.printing})};
    ctx.W = ctx; ctx.window = ctx; vm.createContext(ctx); vm.runInContext(script('synthetic-layout'), ctx);
    return {ctx, counts, main, body};
  }
  test('legacy date centring remains available without modern cards but avoids their obsolete geometry', () => {
    const {ctx, counts} = layoutContext(); ctx.legacyCenter(ctx.pane);
    assert.ok(counts.geometry > 0); assert.equal(counts.scrollWrites, 1);
    counts.geometry = 0; counts.scrollWrites = 0; ctx.DemobCards996 = {};
    ctx.legacyCenter(ctx.pane); assert.equal(counts.geometry, 0); assert.equal(counts.scrollWrites, 0);
  });
  test('standalone mount preserves its prior scroll while a full render skips intermediate reads and writes', () => {
    const {ctx, counts} = layoutContext(); ctx.syntheticMount();
    assert.equal(counts.scrollReads, 1); assert.equal(counts.scrollWrites, 1);
    ctx.rendering = true; counts.scrollReads = counts.scrollWrites = 0; ctx.syntheticMount();
    assert.equal(counts.scrollReads, 0); assert.equal(counts.scrollWrites, 0);
  });
  test('modern render reveals immediately outside an outer pass and defers to its single finish inside one', () => {
    const {ctx, counts} = layoutContext(); assert.equal(ctx.syntheticModernRender(), 'synthetic modern result');
    assert.equal(counts.reveal, 1);
    API.demobPass(() => {ctx.syntheticModernRender(); ctx.syntheticModernRender(); assert.equal(counts.reveal, 1);},
      () => ctx.WeatherStrip1002.reveal(ctx.pane));
    assert.equal(counts.reveal, 2); assert.equal(counts.mount, 3);
  });
  test('native scrolling main avoids computed styles on screen', () => {
    const {ctx, counts, main} = layoutContext(); assert.strictEqual(ctx.scroller(), main); assert.equal(counts.styles, 0);
  });
  test('print keeps native computed-style scroll-root fallback', () => {
    const {ctx, counts, main} = layoutContext(); ctx.printing = true; main.overflowY = 'visible';
    assert.equal(ctx.scroller(), null); assert.equal(counts.styles, 1);
  });
  test('non-native ancestor structure keeps computed-style scroll-root discovery', () => {
    const {ctx, counts, body} = layoutContext(); const scroller = {tagName: 'DIV', overflowY: 'scroll', parentElement: body};
    ctx.pane.parentElement = scroller;
    assert.strictEqual(ctx.scroller(), scroller); assert.equal(counts.styles, 1);
  });

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
      WeatherStrip1002: {reveal() {ctx.revealCalls++; ctx.revealDuringDrawing.push(API.drawingDemob());}},
      revealCalls: 0, revealDuringDrawing: [], decorationOrder: [],
      arm: () => ctx.decorationOrder.push('arm'), headers: () => ctx.decorationOrder.push('headers'),
      overview: () => ctx.decorationOrder.push('overview'), progress: () => ctx.decorationOrder.push('progress'),
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
    assert.equal(ctx.revealCalls, 1); assert.deepEqual(ctx.revealDuringDrawing, [false]);
    assert.deepEqual(ctx.decorationOrder, ['headers', 'overview', 'progress', 'arm']);
  });
  test('deferred decorations start their own bounded asset hold', () => {
    const {ctx} = context(); ctx.after(); ctx.after();
    assert.equal(ctx.outerHolds, 2); assert.equal(ctx.decorationCalls, 2); assert.equal(ctx.holdDepth, 0);
  });
  test('failed Demob render releases its hold and rendering flag without decorating', () => {
    const {ctx} = context(); ctx.throwRender = true;
    assert.throws(() => ctx.renderDemob816(), /synthetic render failure/);
    assert.equal(ctx.holdDepth, 0); assert.equal(ctx.rendering, 0); assert.equal(ctx.decorationCalls, 0);
    assert.equal(ctx.revealCalls, 0); assert.equal(API.drawingDemob(), false);
  });
  test('failed Demob decoration releases nested holds and rendering flag', () => {
    const {ctx} = context(); ctx.throwDecoration = true;
    assert.throws(() => ctx.renderDemob816(), /synthetic decoration failure/);
    assert.equal(ctx.holdDepth, 0); assert.equal(ctx.rendering, 0);
    assert.equal(ctx.revealCalls, 0); assert.equal(API.drawingDemob(), false);
  });
  if (candidateSha256) console.log(JSON.stringify({builtCandidateSha256: candidateSha256, realFinanceWrapperExercised: true}));
}

const failures = checks.filter(check => !check.pass);
for (const failure of failures) console.error('FAIL ' + failure.name + '\n  ' + failure.error.slice(0, 1000));
console.log(JSON.stringify({author: 'Andrew Fisher', suite: 'performance1241 offline synthetic',
  sourceSha256: sha(source), runtimeSha256: sha(runtimeSource), patchSha256: sha(fs.readFileSync(path.join(root, 'patch_v1241.py'))),
  passed: checks.length - failures.length, failed: failures.length, checks: checks.length,
  failedChecks: failures.map(f => f.name)}));
process.exitCode = failures.length ? 1 : 0;
