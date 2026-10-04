/* Author: Andrew Fisher. Synthetic Timeline proof, transition and print checks only. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, 'timeline841_src.js'), 'utf8');
const plain = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const NOW = '2026-10-04T04:00:00.000Z';
const OLD = '2026-10-04T02:00:00.000Z';
const proof = (stage, at = OLD, by = 'Synthetic operator', history = []) => ({stage, at, by, history});
const onSite = extra => ({recorded:true, state:'on site', where:'local', set_at:OLD, ...extra});
const load = (kind, ...keys) => ({kind, rows:keys.map(key => ({a:{key}}))});

function fixture(options = {}) {
  const data = {
    assets:plain(options.assets || {SYN_A:{key:'SYN_A'}, SYN_B:{key:'SYN_B'}}),
    deliveries:plain(options.deliveries || {}),
    raw:plain(options.raw || {}),
    committed:plain(options.committed || {}),
    lines:plain(options.lines || {}),
    shorts:plain(options.shorts || {}),
    dayprint:options.dayprint || null,
    writesAllowed:options.writesAllowed !== false,
    readonly:!!options.readonly,
    capability:options.capability || 'edit',
    who:options.who === undefined ? 'Synthetic operator' : options.who,
    refused:new Set(options.refused || []),
    calls:[]
  };
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [NOW])); }
    static now() { return Date.parse(NOW); }
  }
  const context = vm.createContext({
    window:{}, document:{addEventListener(){},getElementById:id => id === 'dayprint' ? data.dayprint : null}, Date:Clock,
    S:{delivery:data.raw}, CROW:new Map(Object.entries(data.committed)), state:{},
    SYNC:{readonly:data.readonly},
    capability:() => data.capability,
    assetOf:key => data.assets[key] || null,
    chargeLines:a => data.lines[a.key] || [],
    shortOf:a => data.shorts[a.key] || [],
    deliveryOf:key => data.deliveries[key] || {recorded:false, state:'not on site', done:false},
    movedAway:key => data.deliveries[key]?.moved || null,
    mayWrite:() => data.writesAllowed && !data.readonly && data.capability === 'edit',
    whoAmI:() => data.who,
    flash:message => data.calls.push(['flash', message]),
    bump:() => data.calls.push(['bump']),
    setLight(key, state) {
      data.calls.push(['light', key, state]);
      if (!data.writesAllowed || data.readonly || data.capability !== 'edit' || !data.who || data.refused.has(key)) return false;
      const raw = data.raw[key] || (data.raw[key] = {});
      Object.assign(raw, {state, set_at:NOW, by:data.who});
      raw.history = (raw.history || []).concat([{state, at:NOW, by:data.who}]);
      data.deliveries[key] = {...data.deliveries[key], recorded:true, state, where:'local', set_at:NOW};
      if (state !== 'on site') data.deliveries[key].done = false;
      return true;
    },
    setDone(key, value) {
      data.calls.push(['done', key, value]);
      if (!data.writesAllowed || data.readonly || data.capability !== 'edit' || !data.who || data.refused.has(key)) return false;
      const raw = data.raw[key] || (data.raw[key] = {});
      Object.assign(raw, {done:value, done_at:NOW, done_by:data.who});
      data.deliveries[key] = {...onSite({set_at:NOW}), done:value};
      return true;
    }
  });
  vm.runInContext(source, context, {filename:'timeline841_src.js'});
  return {data, context, api:context.window.Timeline841,
    writes:() => data.calls.filter(c => ['light','done','bump'].includes(c[0])),
    print:(loads, pick, opt = {}) => context.timeline841Printed('2026-10-04', opt.doc || 'drv', loads, pick,
      {timeline841:true, ...opt.options}, () => { data.calls.push(['print']); if (opt.onPrint) opt.onPrint(); if (opt.error) throw opt.error; }, opt.valid)};
}

let passed = 0;
const failures = [];
function test(name, run) {
  try { run(); passed++; process.stdout.write('PASS ' + name + '\n'); }
  catch (error) { failures.push({name, error:error.message}); process.stderr.write('FAIL ' + name + ': ' + error.message + '\n'); }
}

test('unrecorded reference and planned location never imply a recorded stage', () => {
  const f = fixture(), input = {asset:{key:'SYN_A', drawing:'Synthetic pin', location:'Synthetic final place'}, delivery:{recorded:false}, proof:proof(4)};
  const before = JSON.stringify(input), out = f.api.project(input);
  assert.equal(out.stage, 0); assert.equal(out.arrived, false); assert.equal(JSON.stringify(input), before);
});
test('rental-derived on-site status is not location or installation proof', () => {
  const f = fixture(), out = f.api.project({asset:{}, delivery:onSite({where:'rental'}), proof:proof(4)});
  assert.equal(out.stage, 0); assert.equal(out.arrived, false); assert.match(out.label, /unconfirmed/i);
});
test('off-site and transit remain distinct recorded stages despite stale proof', () => {
  const f = fixture();
  for (const [state, stage] of [['not on site',1], ['in transit',2]]) {
    const out = f.api.project({asset:{}, delivery:{recorded:true, state}, proof:proof(4)});
    assert.equal(out.stage, stage); assert.equal(out.arrived, false);
  }
});
test('native on-site alone explicitly leaves placement unconfirmed', () => {
  const out = fixture().api.project({asset:{}, delivery:onSite(), proof:null});
  assert.equal(out.stage, 2); assert.equal(out.arrived, true); assert.match(out.label, /placement unconfirmed/i);
});
test('dated explicit location and installation proof project separately', () => {
  const f = fixture();
  for (const stage of [3,4]) assert.equal(f.api.project({asset:{}, delivery:onSite(), proof:proof(stage)}).stage, stage);
});
test('newer native movement invalidates earlier location and installation evidence', () => {
  const f = fixture();
  assert.equal(f.api.project({asset:{}, delivery:onSite({set_at:NOW}), proof:proof(4)}).stage, 2);
  assert.equal(f.api.project({asset:{}, delivery:onSite({set_at:NOW}), proof:proof(3,NOW)}).stage, 3);
});
test('explicit reset tombstone suppresses an older installation proof', () => {
  const f = fixture(), merged = f.api.mergeProof(proof(4), proof(0,NOW));
  assert.equal(merged.stage, 0);
  assert.equal(f.api.project({asset:{}, delivery:onSite(), proof:merged}).stage, 2);
});
test('native Complete remains the final stage without fabricating intermediate proof', () => {
  const f = fixture(), input = {asset:{}, delivery:onSite({done:true}), proof:null};
  assert.equal(f.api.project(input).stage, 5); assert.equal(input.proof, null);
  assert.equal(f.api.project({...input, delivery:onSite({done:false})}).stage, 2);
});
test('Complete with a primary delivery shortage requires review below Finished without changing the tick', () => {
  const f=fixture();
  for(const [delivery,stage] of [[onSite({done:true}),4],[{recorded:true,state:'not on site',done:true},1],[{recorded:true,state:'in transit',done:true},2],[onSite({done:true,where:'rental'}),0],[{recorded:false,done:true},0]]) {
    const input={asset:{},delivery,proof:proof(4),conflict:['Synthetic primary item']},before=JSON.stringify(input),out=f.api.project(input);
    assert.equal(out.stage,stage);assert.equal(out.conflict,true);assert.match(out.label,/Review required/);assert.match(out.why,/Synthetic primary item/);
    assert.equal(JSON.stringify(input),before);assert.equal(delivery.done,true);
  }
  assert.equal(f.api.project({delivery:onSite({done:true}),conflict:[]}).stage,5);
});
test('conflict item matching uses canonical assets and supported primary equipment categories', () => {
  for(const [asset,item] of [[{product:'Portable Building'},'6m Portable Building'],[{product:'Toilet'},'FWF toilet block'],[{product:'Generator'},'60 kVA Generator'],[{product:'Light Tower'},'Lighting Tower'],[{product:'Access'},'Telehandler'],[{discipline:'Access & plant'},'Scissor lift']]) {
    const f=fixture({assets:{SYN_A:{key:'SYN_A',...asset}},lines:{SYN_A:[{item}]},shorts:{SYN_A:[{item}]},deliveries:{SYN_A:onSite({done:true})},raw:{SYN_A:{done:true,timeline841:proof(4)}}});
    assert.deepEqual(plain(f.context.timeline841CompletionConflict({key:'SYN_A',product:'Stale product'})),[item]);
    const before=JSON.stringify(f.data.raw),out=f.context.timeline841State({key:'SYN_A',product:'Stale product'});
    assert.equal(out.stage,4);assert.equal(out.conflict,true);assert.match(out.word,/Review required/);assert.equal(JSON.stringify(f.data.raw),before);
  }
});
test('accessories, toilet tanks and nonidentical short names cannot create primary completion conflicts', () => {
  for(const [product,main,extras] of [['Portable Building','6m Portable Building',['Steps for building','Fridge','Desk']],['Toilet','FWF toilet block',['Toilet waste tank','Steps for toilet']],['Generator','60 kVA Generator',['Cable for Generator']],['Light Tower','Lighting Tower',['Cable for Lighting Tower']],['Access','Telehandler',['Telehandler attachment','Forklift tynes','Forklift forks']]]) {
    const f=fixture({assets:{SYN_A:{key:'SYN_A',product}},lines:{SYN_A:[main,...extras].map(item=>({item}))},shorts:{SYN_A:[...extras,main.toLowerCase(),'Unmatched primary item'].map(item=>({item}))},deliveries:{SYN_A:onSite({done:true})}});
    assert.deepEqual(plain(f.context.timeline841CompletionConflict({key:'SYN_A'})),[]);assert.equal(f.context.timeline841State({key:'SYN_A'}).stage,5);
    assert.equal(f.context.timeline841Set('SYN_A',5),true);assert.deepEqual(f.data.calls.filter(c=>c[0]==='done'),[['done','SYN_A',true]]);
  }
});
test('primary item classification preserves exact native names including surrounding spaces', () => {
  const item=' Generator ',f=fixture({assets:{SYN_A:{key:'SYN_A',product:'Generator'}},lines:{SYN_A:[{item}]},shorts:{SYN_A:[{item}]},deliveries:{SYN_A:onSite({done:true})}});
  assert.deepEqual(plain(f.context.timeline841CompletionConflict({key:'SYN_A'})),[item]);
  assert.equal(f.context.timeline841State({key:'SYN_A'}).conflict,true);assert.equal(f.context.timeline841Set('SYN_A',5),false);assert.deepEqual(f.writes(),[]);
});
test('Finish refuses a primary shortage and preserves both checked and unchecked native records', () => {
  for(const done of [false,true]) {
    const raw={state:'on site',done,done_at:OLD,done_by:'Synthetic check',timeline841:proof(4)},f=fixture({assets:{SYN_A:{key:'SYN_A',product:'Generator'}},lines:{SYN_A:[{item:'60 kVA Generator'}]},shorts:{SYN_A:[{item:'60 kVA Generator'}]},deliveries:{SYN_A:onSite({done})},raw:{SYN_A:raw}});
    const before=JSON.stringify(f.data.raw);assert.equal(f.context.timeline841Set('SYN_A',5),false);
    assert.equal(JSON.stringify(f.data.raw),before);assert.equal(f.data.deliveries.SYN_A.done,done);assert.deepEqual(f.writes(),[]);
  }
});
test('cancelled and moved references never display carried completion twice', () => {
  const f = fixture();
  for (const input of [{asset:{_cancelled:true}, delivery:onSite({done:true})}, {asset:{}, delivery:onSite({done:true, moved:{to:'SYN_B'}})}]) {
    const out = f.api.project({...input, proof:proof(4)});
    assert.equal(out.stage, 0); assert.equal(out.blocked, true); assert.equal(out.arrived, false);
  }
});
test('malformed proof cannot become location or installation', () => {
  const f = fixture();
  for (const p of [null, {}, proof(2), proof('3'), proof(3,'invalid'), proof(3,OLD,''), proof(4,OLD,'  ')]) {
    assert.equal(f.api.mergeProof(p,null), null);
    assert.equal(f.api.project({asset:{}, delivery:onSite(), proof:p}).stage, 2);
  }
});
test('proof merge is immutable, commutative and retains both histories', () => {
  const f = fixture(), a = proof(3,OLD,'Synthetic A'), b = proof(4,NOW,'Synthetic B', [proof(3,OLD,'Synthetic A')]);
  const before = JSON.stringify([a,b]), ab = plain(f.api.mergeProof(a,b)), ba = plain(f.api.mergeProof(b,a));
  assert.deepEqual(ab,ba); assert.equal(ab.stage,4); assert.equal(ab.history.length,2); assert.equal(JSON.stringify([a,b]),before);
});
test('same-time conflict converges to reset then less advanced proof in either order', () => {
  const f = fixture();
  for (const [a,b,winner] of [[0,4,0],[0,3,0],[3,4,3]]) {
    const x=proof(a,NOW,'Synthetic X'), y=proof(b,NOW,'Synthetic Y');
    assert.equal(f.api.mergeProof(x,y).stage,winner); assert.deepEqual(plain(f.api.mergeProof(x,y)),plain(f.api.mergeProof(y,x)));
  }
});
test('merged proof is idempotent and duplicate history entries collapse', () => {
  const f=fixture(), p=proof(4,NOW,'Synthetic A',[proof(3,OLD,'Synthetic B'),proof(3,OLD,'Synthetic B')]);
  const out=plain(f.api.mergeProof(p,p)); assert.equal(out.history.length,2);
  assert.deepEqual(plain(f.api.mergeProof(out,out)),out);
});
test('proof chronology uses absolute instants rather than ISO offset spelling', () => {
  const f=fixture(), older=proof(4,'2026-10-04T12:00:00+10:00'), newer=proof(0,'2026-10-04T03:00:00Z');
  assert.equal(f.api.mergeProof(older,newer).stage,0);
});
test('equivalent timestamp spellings still apply reset conflict priority', () => {
  const f=fixture(), a=proof(4,'2026-10-04T12:00:00+10:00'), b=proof(0,'2026-10-04T02:00:00.000Z');
  assert.equal(f.api.mergeProof(a,b).stage,0); assert.deepEqual(plain(f.api.mergeProof(a,b)),plain(f.api.mergeProof(b,a)));
});
test('placement chronology compares proof to native movement as absolute time', () => {
  const f=fixture();
  assert.equal(f.api.project({asset:{}, delivery:onSite({set_at:'2026-10-04T03:00:00Z'}), proof:proof(4,'2026-10-04T12:00:00+10:00')}).stage,2);
  assert.equal(f.api.project({asset:{}, delivery:onSite({set_at:'2026-10-04T12:00:00+10:00'}), proof:proof(3,'2026-10-04T03:00:00Z')}).stage,3);
});
test('proof history stays bounded while preserving the newest 400 events', () => {
  const f=fixture(), history=Array.from({length:410},(_,i)=>proof(3,new Date(Date.parse(OLD)+i*1000).toISOString()));
  const out=f.api.mergeProof(proof(4,NOW,'Synthetic operator',history),null);
  assert.equal(out.history.length,400); assert.equal(out.history.at(-1).at,NOW);
});
test('native and unrelated print options keep their original load selection', () => {
  const f=fixture(), loads=[load('deliveries','SYN_A'),load('removals','SYN_B')];
  assert.equal(f.api.pick(loads,null),null); assert.equal(f.api.pick(loads,{}),null);
  assert.deepEqual(plain(f.api.pick(loads,{timeline841:true})),[0]);
});
test('single-load selection accepts native numeric strings and rejects invalid selection', () => {
  const f=fixture(), loads=[load('deliveries','SYN_A'),load('removals','SYN_B'),load('deliveries','SYN_B')];
  assert.deepEqual(plain(f.api.pick(loads,{timeline841:true,only:2})),[2]);
  assert.deepEqual(plain(f.api.pick(loads,{timeline841:true,only:'0'})),[0]);
  assert.deepEqual(plain(f.api.pick(loads,{only:'1'})),[1]);
  for(const only of [1,-1,3,0.5,'invalid','0.5']) assert.deepEqual(plain(f.api.pick(loads,{timeline841:true,only})),[]);
  for(const only of [-1,3,0.5,'invalid','0.5']) assert.deepEqual(plain(f.api.pick(loads,{only})),[]);
});
test('printed references are scoped, deduplicated and exclude cancellation', () => {
  const f=fixture(), loads=[load('deliveries','SYN_A','SYN_A'),load('deliveries','SYN_B','SYN_C'),load('removals','SYN_D')];
  loads[1].rows[1].a._cancelled=true; const before=JSON.stringify(loads);
  assert.deepEqual(plain(f.api.printRefs(loads,[1,0,1])),['SYN_B','SYN_A']); assert.equal(JSON.stringify(loads),before);
  assert.deepEqual(plain(f.api.printRefs(loads,[0,2])),['SYN_A']);
  assert.deepEqual(plain(f.api.printRefs(loads,[2])),[]);
  for(const pick of [null,[99],['0']]) assert.deepEqual(plain(f.api.printRefs(loads,pick)),[]);
});
test('print preparation must run before any status mutation', () => {
  const f=fixture(), result=f.print([load('deliveries','SYN_A')],[0]);
  assert.deepEqual(plain(result),['SYN_A']); assert.equal(f.data.calls[0][0],'print');
  assert.equal(f.data.raw.SYN_A.history.at(-1).because,'Run sheet print requested');
  assert.equal(f.data.raw.SYN_A.history.at(-1).print_day,'2026-10-04');
});
test('throwing print preparation cannot write delivery status', () => {
  const f=fixture(), error=new Error('Synthetic failed print preparation');
  assert.throws(()=>f.print([load('deliveries','SYN_A')],[0],{error}),/Synthetic failed/);
  assert.equal(f.writes().length,0); assert.deepEqual(f.data.raw,{});
});
test('starting a print generation invalidates old wrapper callbacks and selection metadata', () => {
  const wrap={dataset:{timeline841Print:'old'},__timeline841print:()=>{}},f=fixture({dayprint:wrap});
  const token=f.context.timeline841PrintStart();assert.equal(wrap.__timeline841print,null);assert.equal(wrap.dataset.timeline841Print,undefined);
  assert.equal(f.context.timeline841PrintCurrent(token),true);assert.equal(f.context.timeline841PrintCurrent(token,wrap),false);
  wrap.dataset.timeline841Print=String(token);assert.equal(f.context.timeline841PrintCurrent(token,wrap),true);
  const next=f.context.timeline841PrintStart();assert.ok(next>token);assert.equal(f.context.timeline841PrintCurrent(token),false);assert.equal(f.context.timeline841PrintCurrent(token,wrap),false);
});
test('stale, closed and replaced print wrappers fail closed before the print callback', () => {
  for(const invalidate of [(f)=>f.context.timeline841PrintStart(),(f)=>{f.data.dayprint=null;},(f,token)=>{f.data.dayprint={dataset:{timeline841Print:String(token)}};},(f,token,wrap)=>{delete wrap.dataset.timeline841Print;}]) {
    const wrap={dataset:{}},f=fixture({dayprint:wrap}),token=f.context.timeline841PrintStart();wrap.dataset.timeline841Print=String(token);
    const valid=()=>f.context.timeline841PrintCurrent(token,wrap);assert.equal(valid(),true);invalidate(f,token,wrap);
    assert.deepEqual(plain(f.print([load('deliveries','SYN_A')],[0],{valid})),[]);
    assert.deepEqual(f.data.raw,{});assert.deepEqual(f.data.calls,[]);
  }
});
test('print cancellation by a new generation or removed wrapper after callback cannot mutate records', () => {
  for(const invalidate of [(f)=>f.context.timeline841PrintStart(),(f)=>{f.data.dayprint=null;},(f,token)=>{f.data.dayprint={dataset:{timeline841Print:String(token)}};}]) {
    const wrap={dataset:{}},f=fixture({dayprint:wrap}),token=f.context.timeline841PrintStart();wrap.dataset.timeline841Print=String(token);
    assert.deepEqual(plain(f.print([load('deliveries','SYN_A')],[0],{valid:()=>f.context.timeline841PrintCurrent(token,wrap),onPrint:()=>invalidate(f,token)})),[]);
    assert.deepEqual(f.data.raw,{});assert.deepEqual(f.data.calls,[['print']]);assert.deepEqual(f.writes(),[]);
  }
});
test('a current print generation still prints and advances exactly its selected inbound reference', () => {
  const wrap={dataset:{}},f=fixture({dayprint:wrap}),token=f.context.timeline841PrintStart();wrap.dataset.timeline841Print=String(token);
  assert.deepEqual(plain(f.print([load('deliveries','SYN_A'),load('deliveries','SYN_B')],[1],{valid:()=>f.context.timeline841PrintCurrent(token,wrap)})),['SYN_B']);
  assert.equal(f.data.calls[0][0],'print');assert.equal(f.data.raw.SYN_A,undefined);assert.equal(f.data.raw.SYN_B.state,'in transit');
});
test('view-only print remains available without any status write', () => {
  for(const options of [{readonly:true},{capability:'view'}]) {
    const f=fixture(options); assert.deepEqual(plain(f.print([load('deliveries','SYN_A')],[0])),[]);
    assert.equal(f.data.calls.filter(c=>c[0]==='print').length,1); assert.equal(f.writes().length,0);
  }
});
test('PDF and non-driver printing never advance delivery', () => {
  for(const opt of [{options:{pdf:true}},{doc:'install'}]) {
    const f=fixture(); assert.deepEqual(plain(f.print([load('deliveries','SYN_A')],[0],opt)),[]);
    assert.equal(f.writes().length,0); assert.equal(f.data.calls[0][0],'print');
  }
});
test('existing native driver print routes advance only their selected inbound refs', () => {
  const f=fixture(), loads=[load('deliveries','SYN_A'),load('removals','SYN_B')];
  assert.deepEqual(plain(f.print(loads,[0,1],{options:{timeline841:false}})),['SYN_A']);
  assert.equal(f.data.raw.SYN_B,undefined);
});
test('reprints and all observed later delivery stages remain unchanged', () => {
  const deliveries={SYN_A:{recorded:true,state:'in transit'},SYN_B:onSite(),SYN_C:onSite(),SYN_D:onSite(),SYN_E:onSite({done:true})};
  const assets=Object.fromEntries(Object.keys(deliveries).map(key=>[key,{key}]));
  const f=fixture({assets,deliveries,raw:{SYN_C:{timeline841:proof(3)},SYN_D:{timeline841:proof(4)}}}),before=JSON.stringify([f.data.raw,f.data.deliveries]);
  assert.deepEqual(plain(f.print([load('deliveries',...Object.keys(assets))],[0])),[]);
  assert.equal(f.writes().length,0); assert.equal(JSON.stringify([f.data.raw,f.data.deliveries]),before);
});
test('printing a rental-only apparent arrival records Transit while observed arrival stays unchanged', () => {
  const f=fixture({deliveries:{SYN_A:onSite({where:'rental'}),SYN_B:onSite()}}),observed=JSON.stringify(f.data.deliveries.SYN_B);
  assert.deepEqual(plain(f.print([load('deliveries','SYN_A','SYN_B')],[0])),['SYN_A']);
  assert.equal(f.data.raw.SYN_A.state,'in transit');assert.equal(f.data.deliveries.SYN_A.where,'local');
  assert.equal(JSON.stringify(f.data.deliveries.SYN_B),observed);assert.equal(f.data.raw.SYN_B,undefined);
});
test('repeated successful print advances a reference only once', () => {
  const f=fixture(), loads=[load('deliveries','SYN_A')];
  assert.deepEqual(plain(f.print(loads,[0])),['SYN_A']); assert.deepEqual(plain(f.print(loads,[0])),[]);
  assert.equal(f.data.raw.SYN_A.history.length,1);
});
test('print skips moved, newly cancelled and unavailable references', () => {
  const f=fixture({assets:{SYN_A:{key:'SYN_A'},SYN_B:{key:'SYN_B',_cancelled:true}},deliveries:{SYN_A:{moved:{to:'SYN_C'}}}});
  assert.deepEqual(plain(f.print([load('deliveries','SYN_A','SYN_B','SYN_MISSING')],[0])),[]); assert.equal(f.writes().length,0);
});
test('native refusal cannot be reported as a successful print transition', () => {
  const f=fixture({refused:['SYN_A']}); assert.deepEqual(plain(f.print([load('deliveries','SYN_A')],[0])),[]);
  assert.deepEqual(f.data.raw,{}); assert.ok(!f.data.calls.some(c=>c[0]==='bump'));
});
test('explicit location or installation may be confirmed directly without invented prior history', () => {
  for(const stage of [3,4]) {
    const f=fixture(); assert.equal(f.context.timeline841Set('SYN_A',stage),true);
    assert.deepEqual(f.data.calls.filter(c=>c[0]==='light'),[['light','SYN_A','on site']]);
    assert.equal(f.data.raw.SYN_A.timeline841.stage,stage);
    assert.deepEqual(plain(f.data.raw.SYN_A.timeline841.history).map(x=>x.stage),[stage]);
  }
});
test('location and installation on recorded on-site refs preserve native light and pump-out evidence', () => {
  for(const stage of [3,4]) {
    const raw={state:'on site',set_at:OLD,by:'Synthetic arrival',emptied:true,emptied_at:OLD,emptied_by:'Synthetic service',history:[{state:'on site',at:OLD,by:'Synthetic arrival'}],note:'Synthetic retained note'};
    const f=fixture({deliveries:{SYN_A:onSite({emptied:true})},raw:{SYN_A:raw}});
    assert.equal(f.context.timeline841Set('SYN_A',stage),true);
    assert.equal(f.data.calls.filter(c=>c[0]==='light').length,0);
    const after=plain(f.data.raw.SYN_A);assert.equal(after.timeline841.stage,stage);delete after.timeline841;
    assert.deepEqual(after,raw);
  }
});
test('rental-derived arrival still requires a native recorded on-site confirmation', () => {
  const f=fixture({deliveries:{SYN_A:onSite({where:'rental'})}});
  assert.equal(f.context.timeline841Set('SYN_A',3),true);
  assert.deepEqual(f.data.calls.filter(c=>c[0]==='light'),[['light','SYN_A','on site']]);
  assert.equal(f.data.raw.SYN_A.timeline841.stage,3);
});
test('Finish delegates to native Complete and does not fabricate placement proof', () => {
  const f=fixture(); assert.equal(f.context.timeline841Set('SYN_A',5),true);
  assert.deepEqual(f.data.calls.filter(c=>c[0]==='done'),[['done','SYN_A',true]]);
  assert.equal(f.data.raw.SYN_A.timeline841,undefined);
});
test('off-site and transit corrections use native setter policy', () => {
  for(const [stage,state] of [[1,'not on site'],[2,'in transit']]) {
    const f=fixture(); assert.equal(f.context.timeline841Set('SYN_A',stage),true);
    assert.deepEqual(f.data.calls.filter(c=>c[0]==='light'),[['light','SYN_A',state]]);
  }
});
test('explicit proof clear preserves native light, Complete and service checks', () => {
  for(const done of [false,true]) {
    const native={state:'on site',set_at:OLD,by:'Synthetic arrival',done,done_at:OLD,done_by:'Synthetic completion',levelled:true,steps:true,emptied:true,emptied_at:OLD,emptied_by:'Synthetic service',history:[{state:'on site',at:OLD,by:'Synthetic arrival'}],note:'Synthetic retained note'};
    const delivery=onSite({...native}),f=fixture({deliveries:{SYN_A:delivery},raw:{SYN_A:{...native,timeline841:proof(4)}}});
    assert.equal(f.context.timeline841Set('SYN_A',0),true);
    assert.deepEqual(f.writes(),[['bump']]);
    assert.deepEqual(f.data.deliveries.SYN_A,delivery);
    const after=plain(f.data.raw.SYN_A),reset=after.timeline841;delete after.timeline841;
    assert.deepEqual(after,native);assert.equal(reset.stage,0);assert.equal(reset.at,NOW);assert.equal(reset.by,'Synthetic operator');
    assert.deepEqual(reset.history.map(x=>x.stage),[4,0]);
    assert.equal(f.api.project({asset:{},delivery,proof:reset}).stage,done?5:2);
  }
});
test('explicit proof clear is gated by permission, operator and reference availability', () => {
  for(const [options,key] of [[{writesAllowed:false},'SYN_A'],[{readonly:true},'SYN_A'],[{capability:'view'},'SYN_A'],[{who:''},'SYN_A'],[{assets:{SYN_A:{key:'SYN_A',_cancelled:true}}},'SYN_A'],[{deliveries:{SYN_A:{moved:{to:'SYN_B'}}}},'SYN_A'],[{},'SYN_MISSING']]) {
    const f=fixture({...options,raw:{SYN_A:{state:'on site',done:true,timeline841:proof(4)}}}),before=JSON.stringify(f.data.raw);
    assert.equal(f.context.timeline841Set(key,0),false);assert.equal(f.writes().length,0);assert.equal(JSON.stringify(f.data.raw),before);
  }
});
test('clearing unrecorded placement creates only an explicit proof tombstone', () => {
  const f=fixture();assert.equal(f.context.timeline841Set('SYN_A',0),true);
  assert.deepEqual(Object.keys(f.data.raw.SYN_A),['timeline841']);assert.deepEqual(f.data.deliveries,{});
  assert.equal(f.data.raw.SYN_A.timeline841.stage,0);assert.deepEqual(plain(f.data.raw.SYN_A.timeline841.history).map(x=>x.stage),[0]);
  assert.deepEqual(f.writes(),[['bump']]);
});
test('invalid, cancelled and moved stage requests cannot reach native setters', () => {
  for(const [options,key,stage] of [[{},'SYN_A',-1],[{},'SYN_A',6],[{},'SYN_A','0'],[{},'SYN_A','3'],[{},'SYN_MISSING',3],[{assets:{SYN_A:{key:'SYN_A',_cancelled:true}}},'SYN_A',4],[{deliveries:{SYN_A:{moved:{to:'SYN_B'}}}},'SYN_A',5]]) {
    const f=fixture(options); assert.equal(f.context.timeline841Set(key,stage),false); assert.equal(f.writes().length,0);
  }
});
test('write denial, missing operator and native refusal leave proof unchanged', () => {
  for(const options of [{writesAllowed:false},{readonly:true},{capability:'view'},{who:''},{refused:['SYN_A']}]) {
    const f=fixture(options); assert.equal(f.context.timeline841Set('SYN_A',3),false); assert.deepEqual(f.data.raw,{});
    assert.ok(!f.data.calls.some(c=>c[0]==='bump'));
  }
});
test('finished reference rejects location or installation downgrade', () => {
  const f=fixture({deliveries:{SYN_A:onSite({done:true})}});
  for(const stage of [3,4]) assert.equal(f.context.timeline841Set('SYN_A',stage),false);
  assert.equal(f.writes().length,0);
});
test('native movement invalidation retains a dated reset and earlier proof history', () => {
  const f=fixture({raw:{SYN_A:{timeline841:proof(4)}}});
  f.context.timeline841Invalidate('SYN_A','in transit','Synthetic mover');
  assert.equal(f.data.raw.SYN_A.timeline841.stage,0); assert.equal(f.data.raw.SYN_A.timeline841.by,'Synthetic mover');
  assert.deepEqual(plain(f.data.raw.SYN_A.timeline841.history).map(x=>x.stage),[4,0]);
});
test('on-site mutation and proof-free movement create no reset evidence', () => {
  const f=fixture({raw:{SYN_A:{timeline841:proof(3)}}}),before=JSON.stringify(f.data.raw);
  f.context.timeline841Invalidate('SYN_A','on site','Synthetic mover');
  f.context.timeline841Invalidate('SYN_B','in transit','Synthetic mover');
  assert.equal(JSON.stringify(f.data.raw),before);
});
test('deliberate proof correction advances its clock past equal or future prior evidence', () => {
  for(const at of [NOW,'2026-10-05T04:00:00.000Z']) {
    const f=fixture({raw:{SYN_A:{timeline841:proof(0,at)}}});
    const next=f.context.timeline841WriteProof('SYN_A',3,'Synthetic correcting operator');
    assert.equal(next.stage,3);assert.ok(Date.parse(next.at)>Date.parse(at));
    assert.deepEqual(plain(next.history).map(x=>x.stage),[0,3]);
  }
});
test('explicit proof remains effective after a native arrival stamped ahead of the local clock', () => {
  const future='2026-10-06T12:00:00+10:00';
  for(const stage of [3,4]) {
    const f=fixture({deliveries:{SYN_A:onSite({set_at:future})},raw:{SYN_A:{state:'on site',set_at:future}}});
    assert.equal(f.context.timeline841Set('SYN_A',stage),true);
    const p=f.data.raw.SYN_A.timeline841;assert.ok(Date.parse(p.at)>=Date.parse(future));assert.equal(f.context.timeline841State({key:'SYN_A'}).stage,stage);
    assert.equal(p.recorded_at,NOW);assert.equal(p.history.at(-1).recorded_at,NOW);
    const projected=f.api.project({delivery:f.data.deliveries.SYN_A,proof:p});assert.ok(projected.why.includes(NOW));assert.ok(!projected.why.includes(p.at));
    f.context.fmtStamp=stamp=>'Synthetic AEST '+stamp;assert.ok(f.context.timeline841State({key:'SYN_A'}).why.includes('Synthetic AEST '+NOW));
    assert.equal(f.data.raw.SYN_A.set_at,future);assert.deepEqual(f.writes(),[['bump']]);
  }
});
test('proof merge retains actual action timestamps separately from causal ordering timestamps', () => {
  const f=fixture(),a={...proof(3,'2026-10-05T04:00:00.000Z','Synthetic A'),recorded_at:'2026-10-04T13:00:00+10:00'},b={...proof(4,'2026-10-05T04:00:00.001Z','Synthetic B'),recorded_at:NOW};
  const out=plain(f.api.mergeProof(a,b));assert.deepEqual(out,plain(f.api.mergeProof(b,a)));assert.equal(out.recorded_at,NOW);
  assert.deepEqual(out.history.map(h=>h.recorded_at),['2026-10-04T03:00:00.000Z',NOW]);assert.deepEqual(plain(f.api.mergeProof(out,out)),out);
});

process.stdout.write(JSON.stringify({author:'Andrew Fisher',passed,total:passed+failures.length,failures})+'\n');
process.exitCode=failures.length?1:0;
