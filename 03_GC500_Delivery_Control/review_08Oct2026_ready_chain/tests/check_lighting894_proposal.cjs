// Author: Andrew Fisher. Network-free fixtures; all equipment and locations are fictional.
// node check_lighting894_proposal.cjs [candidate.html proposed-lighting894.js [proposed-candidate.html]]
// Optional paths enable the actual candidate's native metrics/summary functions in
// a VM. The VM has no fetch, network client, DOM writer or record setter.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {lighting894ProjectVerified: project} = require('../proposals/lighting894_projection.js');
const confirmation = {towers: 6, by: 'Fixture reviewer', on: '2026-10-08', groups: [
  {name: 'North fixture yard', scope: 4, records: ['AGG_A'], callouts: ['CAL_A', 'CAL_B', 'CAL_C', 'CAL_D']},
  {name: 'South fixture yard', scope: 2, records: ['SOUTH_A', 'SOUTH_B'], callouts: ['SOUTH_A', 'SOUTH_B']}
]};
let checks = 0;
function check(name, run) { run(); checks++; console.log('PASS ' + name); }
function row(key, quantity, complete, extra = {}) {
  return {key, quantity, knownQuantity: quantity, complete, recordedComplete: complete,
    done: complete ? quantity : 0, remaining: complete ? 0 : quantity, ...extra};
}
const base = () => [row('AGG_A', 5, true), row('SOUTH_A', 1, false), row('SOUTH_B', 1, false)];
function read(rows, ids = {}, scope = confirmation) {
  const assets = rows.map(r => ({key: r.key, ids: ids[r.key] || []}));
  const before = JSON.stringify({rows, assets, scope});
  const out = project(rows, assets, scope, a => a.ids);
  assert.equal(JSON.stringify({rows, assets, scope}), before, 'input mutation');
  return out;
}
function tie(out) {
  assert.equal(out.scopeRows.reduce((n, r) => n + r.quantity, 0), confirmation.towers);
  assert.equal(out.scopeRows.reduce((n, r) => n + r.done, 0), out.credited);
  assert.equal(out.scopeRows.reduce((n, r) => n + r.remaining, 0), confirmation.towers - out.credited);
  assert(out.scopeRows.every(r => r.quantity >= r.done && r.done >= 0));
}
check('baseline map scope, completion and surplus reconcile', () => {
  const out = read(base()); tie(out);
  assert.equal(out.credited, 4); assert.equal(out.recorded, 7); assert.equal(out.complete, 5);
  const r = out.scopeRows.find(r => r.key === 'AGG_A');
  assert.equal(r.quantity, 4); assert.equal(r.done, 4); assert.equal(r.surplus894, 1);
  assert.match(r.detail, /5 recorded; 1 surplus/);
});
check('Complete plus native short conflict never earns credit', () => {
  const rows = base(); rows[0] = row('AGG_A', 5, false, {recordedComplete: true, remaining: null});
  const out = read(rows); tie(out);
  assert.equal(out.credited, 0); assert.equal(out.pctKind, 'lower-bound');
  assert.deepEqual(out.reviewRefs, ['AGG_A']);
});
check('promoted keyed callout credits its confirmed location', () => {
  const rows = base(); rows[0] = row('AGG_A', 5, false); rows.push(row('CAL_A', 1, true));
  const out = read(rows); tie(out);
  assert.equal(out.credited, 1); assert.equal(out.groups[0].credited, 1);
  assert.equal(out.groups[1].credited, 0);
  assert.equal(out.scopeRows.find(r => r.key === 'CAL_A').quantity, 1);
});
check('aggregate and promoted asset alias count once', () => {
  const out = read([...base(), row('CAL_A', 1, true)], {AGG_A: ['A1','A2','A3','A4','A5'], CAL_A: ['A1']}); tie(out);
  assert.equal(out.recorded, 7); assert.equal(out.credited, 4);
  assert.deepEqual(out.aliases, [{key: 'CAL_A', parents: ['AGG_A']}]);
});
check('alias cannot override the owning record’s conflict', () => {
  const rows = base(); rows[0] = row('AGG_A', 5, false, {recordedComplete: true}); rows.push(row('CAL_A', 1, true));
  const out = read(rows, {AGG_A:['A1'], CAL_A:['A1']}); tie(out);
  assert.equal(out.credited, 0); assert.equal(out.review, true);
});
check('duplicate configured key is allocated once', () => {
  const scope = structuredClone(confirmation); scope.groups[0].records.push('AGG_A');
  const out = read(base(), {}, scope); tie(out); assert.equal(out.recorded, 7);
});
check('asset alias at another location does not fill that location', () => {
  const rows = base(); rows[1] = row('SOUTH_A', 1, true);
  const out = read(rows, {AGG_A:['A1'], SOUTH_A:['A1']}); tie(out);
  assert.equal(out.credited, 4); assert.equal(out.groups[1].credited, 0);
  assert(out.scopeRows.some(r => !r.key && r.quantity === 1));
});
check('unmapped completed record remains visible without scope credit', () => {
  const out = read([...base(), row('UNMAPPED', 2, true)]); tie(out);
  const r = out.scopeRows.find(r => r.key === 'UNMAPPED');
  assert.equal(r.quantity, 0); assert.equal(r.recordedQuantity894, 2); assert.equal(out.credited, 4);
});
check('overlapping location membership is held for review', () => {
  const scope = structuredClone(confirmation); scope.groups[1].records.push('AGG_A');
  const out = read(base(), {}, scope); tie(out);
  assert.equal(out.credited, 0); assert.equal(out.pctKind, 'lower-bound');
});
check('partial asset overlap earns no inferred unique units', () => {
  const out = read([...base(), row('CAL_A', 2, true)], {AGG_A:['A1'], CAL_A:['A1','A6']}); tie(out);
  assert.equal(out.credited, 4); assert.equal(out.scopeRows.find(r => r.key === 'CAL_A').quantity, 0);
  assert.equal(out.review, true);
});
check('unknown native quantity is never replaced with one', () => {
  const rows = base(); rows[0] = row('AGG_A', null, true, {knownQuantity:0, done:0});
  const out = read(rows); tie(out);
  assert.equal(out.credited, 0); assert.equal(out.pctKind, 'lower-bound');
  assert(out.scopeRows.some(r => !r.key && r.quantity === 4));
});
check('location completion cannot offset another location’s shortfall', () => {
  const rows = base(); rows[0] = row('AGG_A', 20, true);
  const out = read(rows); tie(out); assert.equal(out.credited, 4);
});
check('empty register preserves map scope as explicitly unallocated', () => {
  const out = read([]); tie(out); assert.equal(out.credited, 0);
  assert(out.scopeRows.every(r => r.key === null && /map scope/.test(r.label)));
});
check('invalid and absent confirmation never creates confirmed scope', () => {
  assert.equal(read(base(), {}, null).confirmed, false);
  assert.equal(read(base(), {}, {...confirmation, towers:9}).confirmed, false);
});
check('complete scope reaches 100 only with each location satisfied', () => {
  const rows = base(); rows[1] = row('SOUTH_A', 1, true); rows[2] = row('SOUTH_B', 1, true);
  const out = read(rows); tie(out); assert.equal(out.credited, 6); assert.equal(out.pct, 100);
});

if (process.argv[2] || process.argv[3]) {
  assert(process.argv[2] && process.argv[3], 'Provide both candidate and proposal source');
  const page = fs.readFileSync(process.argv[2], 'utf8');
  const proposed = fs.readFileSync(process.argv[3], 'utf8');
  function nativeFunction(name) {
    const start = page.indexOf('function ' + name + '('); assert(start >= 0, name);
    const end = page.indexOf('\nfunction ', start + 1); assert(end > start, name + ' boundary');
    return page.slice(start, end);
  }
  function fixture(change = () => {}, when = '2026-10-08') {
    const records = [
      {key:'AGG_A', quantity:5, ids:['F-A1','F-A2','F-A3','F-A4','F-A5'], done:true},
      ...['CAL_A','CAL_B','CAL_C','CAL_D'].map(key => ({key, quantity:1, ids:[], done:false, origin:'drawing', drawing:'D024-26003-02', tower_series:'keyed'})),
      {key:'SOUTH_A', quantity:1, ids:['F-S1'], done:false},
      {key:'SOUTH_B', quantity:1, ids:['F-S2'], done:false},
      {key:'COPY_A', quantity:1, ids:['F-A1'], done:true, _added:true, source_row:'AGG_A'}
    ].map(a => ({discipline:'Lighting towers', product:'Light Tower', ...a}));
    change(records);
    const before = JSON.stringify(records);
    const health = {ready:true, loading:false, stale:false, basis:'Fictional fixture'};
    const s = {console, window:{}, document:{getElementById:()=>null}, records,
      DATA:{weeks:[]}, FCOL:[], todayIso:()=>when, todayWorkDay841:()=>when,
      todayWorkHealth840:()=>health, buildAllAssets:()=>records,
      allAssets:()=>s.buildAllAssets(), assetOf:key=>s.allAssets().find(a=>a.key===key),
      chargeLines:a=>[{item:'Light Tower', quantity:a.quantity}], qtyOf:l=>l.quantity,
      deliveryOf:key=>{const a=records.find(a=>a.key===key);return {done:!!a?.done,recorded:!!a?.done,state:a?.done?'on site':'off site'};},
      deliveryAsOf:(key,day)=>{const a=records.find(a=>a.key===key);return {...s.deliveryOf(key),done:!!a?.done&&(!a.completedOn||a.completedOn<=day)};},
      shortOf:a=>a.short?[{item:'Light Tower',q:5,g:3}]:[],
      assetNumbersOf:a=>a.ids||[], rentalOf:()=>null, unitsOf:()=>[], movedAway:()=>false,
      unitsAsked:a=>a.quantity, heldMemo:(_key,fn)=>fn(),
      drawerTidy:()=>{}, todayGroupDetails841:()=>({health,lighting:{notes:[]}}),
      todayWorkSummary848:(day,areas)=>s.todayWorkSummary842(day,areas||s.todayWorkMetrics840(day),null,{summaryRows:[]}),
      progress881Model:()=>({rows:[]}), renderToday_held:()=>{},
      fenceInstallationWeeks847:()=>[], allDockets:()=>[], dsnState:()=>({rows:[]})};
    vm.createContext(s);
    vm.runInContext(nativeFunction('todayWorkMetrics840'), s);
    vm.runInContext(nativeFunction('todayWorkSummary842'), s);
    vm.runInContext(proposed.replace('/*__CONFIRMED894__*/null', '/*__CONFIRMED894__*/'+JSON.stringify(confirmation)), s);
    const native=s.todayWorkMetrics840(when).find(a=>a.id==='lighting');
    const summary=s.todayWorkSummary848(when).byId.lighting;
    assert.equal(JSON.stringify(records), before, 'VM fixture record mutation');
    assert.equal(typeof s.fetch, 'undefined');
    return {s,native,summary,audit:s.window.Lighting894.audit(when)};
  }
  check('native candidate VM: baseline and drawer allocation agree', () => {
    const {summary,native,audit}=fixture();
    assert.equal(native.done,5); assert.equal(summary.done,4); assert.equal(summary.total,6); tie(audit);
  });
  check('native candidate VM: Complete + 3 of 5 short retains review', () => {
    const {summary,native,audit}=fixture(rs=>{rs[0].short=true;});
    assert.equal(native.done,0); assert.equal(summary.done,0); assert.equal(summary.pctKind,'lower-bound'); tie(audit);
  });
  check('native candidate VM: promoted keyed tower is credited', () => {
    const {summary,audit}=fixture(rs=>{rs[0].done=false;rs[1].ids=['F-NEW'];rs[1].done=true;});
    assert.equal(summary.done,1); assert.equal(audit.groups[0].credited,1); tie(audit);
  });
  check('native candidate VM: promoted alias is not double counted', () => {
    const {summary,audit}=fixture(rs=>{rs[1].ids=['F-A1'];rs[1].done=true;});
    assert.equal(summary.done,4); assert.equal(audit.recorded,7); tie(audit);
  });
  check('native candidate VM: completion follows selected day', () => {
    const {summary,audit}=fixture(rs=>{rs[0].completedOn='2026-10-09';});
    assert.equal(summary.done,0); tie(audit);
  });
  check('native candidate VM: missing/cancelled references create scope gaps only', () => {
    const {summary,audit}=fixture(rs=>{rs[0]._cancelled=true;});
    assert.equal(summary.done,0); assert(audit.scopeRows.some(r=>!r.key&&r.quantity===4)); tie(audit);
  });
  if (process.argv[4]) {
    const proposedPage = fs.readFileSync(process.argv[4], 'utf8');
    function renderer(name, next) {
      const start = proposedPage.indexOf('  function ' + name + '(');
      const end = proposedPage.indexOf('  function ' + next + '(', start + 1);
      assert(start >= 0 && end > start, name + ' renderer boundary');
      return proposedPage.slice(start, end);
    }
    function drawer(f) {
      const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      Object.assign(f.s, {workSummary:{byId:{lighting:f.summary}}, renderedDay:'2026-10-08',
        todayLinkedReferences844:()=>({rows:[],rowsByKey:{},issues:[]}), planDate:()=> 'Fixture day',
        escape, format:value=>value==null?'—':String(value), number:value=>typeof value==='number'&&Number.isFinite(value),
        textOf:value=>String(value??''), percentage:value=>String(value), groupNotes:()=>'', linkedPhoto:()=>''});
      vm.runInContext(renderer('linkedRows', 'linkedSupplier'), f.s);
      vm.runInContext(renderer('detailHtml', 'fenceScope848'), f.s);
      return mode => f.s.detailHtml(f.native, mode);
    }
    check('native drawer HTML: all three mode quantities equal their headline', () => {
      const f=fixture(), render=drawer(f);
      for (const [mode,total] of [['done',4],['total',6],['left',2]]) {
        const html=render(mode);
        const numbers=[...html.matchAll(new RegExp('data-tw844-quantity="'+mode+'">([0-9]+)', 'g'))].map(m=>+m[1]);
        assert.equal(numbers.reduce((n,x)=>n+x,0),total);
        assert.match(html,new RegExp('<p>'+total+' towers '));
        if(mode==='total') assert.match(html,/5 recorded; 1 surplus/);
      }
    });
    check('native drawer HTML: promoted key appears with one credited unit', () => {
      const f=fixture(rs=>{rs[0].done=false;rs[1].ids=['F-NEW'];rs[1].done=true;});
      const html=drawer(f)('done');
      assert.match(html,/data-tw844-reference="CAL_A"/);
      assert.match(html,/data-tw844-quantity="done">1/);
      assert.doesNotMatch(html,/data-tw844-reference="AGG_A"/);
    });
    check('native drawer HTML: missing scope is linkless and explicitly labelled', () => {
      const f=fixture(rs=>{rs[0]._cancelled=true;});
      const html=drawer(f)('total');
      assert.match(html,/North fixture yard · map scope without allocated recorded towers/);
      assert.match(html,/4 towers<\/strong>/);
      assert.doesNotMatch(html,/data-tw844-reference="AGG_A"/);
    });
  }
}
console.log(JSON.stringify({author:'Andrew Fisher',checks,network:false,recordWrites:0,financialInputs:false}));
