/* Author: Andrew Fisher. Candidate-source batching tests; no browser or network.
   Run with PAGE=/absolute/path/to/final/candidate.html node tests/test_batching.cjs.
   All inputs below are synthetic. No operational records or rates are fixtures. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
assert.ok(process.env.PAGE, 'PAGE must point to the final candidate HTML');
const page = fs.readFileSync(process.env.PAGE, 'utf8');
let checks = 0;
function eq(actual, expected, message) { assert.deepStrictEqual(structuredClone(actual), structuredClone(expected), message); checks++; }
function ok(value, message) { assert.ok(value, message); checks++; }
function same(actual, expected, message) { assert.strictEqual(actual, expected, message); checks++; }
function between(source, start, end) {
 const pos = source.indexOf(start);
 assert.ok(pos >= 0 && source.indexOf(start, pos + start.length) < 0, 'unique start anchor: ' + start);
 const finish = source.indexOf(end, pos + start.length);
 assert.ok(finish > pos, 'end anchor: ' + end);
 return source.slice(pos, finish);
}
const holdSource = between(page, 'let ASSETS_HELD = null;', '/* Author: Andrew Fisher. Red pin supplied');
const nativeSource = between(page, " let cachedKey='', cached;", "\n})(typeof window!=='undefined'?window:globalThis);");
ok(nativeSource.includes("heldMemo('buildWork1057', nativeRead1057)"), 'candidate has the native read batching wrapper');
ok(nativeSource.includes("HELD_MEMO.delete('buildWork1057')"), 'candidate explicit reset invalidates the held day model');
const verifiedSource = between(page, '  function verified897(a) {', 'window.gc500CompleteKeys897 =');
const completeMatches = [...page.matchAll(/window\.gc500CompleteKeys897 = function \(\) \{[^\n]+/g)];
eq(completeMatches.length, 1, 'one completion reader in candidate');
const completeSource = completeMatches[0][0];
ok(completeSource.includes('holdAssets('), 'candidate completion reads are batched');
const feedbackSource = between(page, '<script id="performance1057-script">', '</script>').replace('<script id="performance1057-script">', '');

// Exact pre-change source, so comparison does not manufacture an expected implementation.
const oldNativeSource = String.raw`
 let cachedKey='', cached;
 function native() {
  const ready=typeof todayWorkHealth840!=='function'||todayWorkHealth840().ready;
  const photoState=typeof photoIndex==='function'?photoIndex().state:'';
  const docsAt=typeof DOCS==='undefined'?'':DOCS.at||0;
  const key=String(ready)+'|'+photoState+'|'+docsAt+'|'+(typeof S==='undefined'?'':JSON.stringify(S));
  if(cached && key===cachedKey)return cached;
  cachedKey=key;
  cached=create({ready:()=>ready,assets:typeof allAssets==='function'?allAssets():[],arrivals:iso=>typeof arrivalsOn==='function'?arrivalsOn(iso):[],
   rawDelivery:key=>typeof deliveryOf==='function'?deliveryOf(key):null,delivery:(key,iso)=>typeof deliveryAsOf==='function'?deliveryAsOf(key,iso):null,
   complete:(a,iso)=>typeof lightTally==='function'&&lightTally([a],iso).done===1,
   dockets:typeof allDockets==='function'?allDockets():[],services:typeof serviceNoteRows==='function'?serviceNoteRows():[],collections:typeof collectionRows==='function'?collectionRows():[],
   operations:typeof fenceProgressEvidence848==='function'?fenceProgressEvidence848(typeof todayIso==='function'?todayIso():undefined).operations:[],
   sheets:typeof DATA!=='undefined'?list(DATA.fencing?.week_sheets):[],programme:iso=>typeof calendarDays==='function'?calendarDays().find(d=>d.iso===iso):null});
  return cached;
 }
 root.BuildWork986={create,day:(iso,today,dayObj)=>native().day(iso,today,dayObj),reset:()=>{cached=null;cachedKey='';}};
`;
const oldCompleteSource = 'window.gc500CompleteKeys897 = function () { try { return allAssets().filter(verified897).map(a => a.key); } catch (e) { return null; } };';

function harness() {
 const stats = {builds:0, serializations:0, creates:0, configReads:0};
 const state = {assets:[{key:'fixture-a'}], ready:true, photos:'ready', buildError:null};
 const context = {stats, state, S:{revision:1}, DOCS:{at:1}};
 context.window = context;
 context.EventConfig1013 = {current(){ stats.configReads++; }};
 context.buildAllAssets = function() { stats.builds++; if(state.buildError)throw state.buildError; return state.assets.slice(); };
 context.JSON = {stringify(value) { if(value === context.S)stats.serializations++; return JSON.stringify(value); }};
 vm.createContext(context);
 vm.runInContext(holdSource + `
 this.batch = fn => holdAssets(fn);
 this.invalidate = () => { if (ASSETS_HELD) HELD_STALE775 = true; };
 this.memoPut = (key,value) => HELD_MEMO.set(key,value);
 this.inspectHold = () => ({active:ASSETS_HELD!==null, stale:HELD_STALE775, memo:HELD_MEMO.size});
 `, context);
 return {context, state, stats};
}
function clean(h, message) { eq(h.context.inspectHold(), {active:false, stale:false, memo:0}, message); }
function installNative(h, source) {
 const c = h.context;
 c.todayWorkHealth840 = () => ({ready:h.state.ready});
 c.photoIndex = () => ({state:h.state.photos});
 c.list = value => Array.isArray(value) ? value : [];
 c.DATA = {fencing:{week_sheets:[{id:'fixture-sheet'}]}};
 c.allDockets = () => [{id:'fixture-docket'}];
 c.serviceNoteRows = () => [];
 c.collectionRows = () => [];
 c.fenceProgressEvidence848 = () => ({operations:[]});
 c.todayIso = () => '2030-01-01';
 c.calendarDays = () => [{iso:'2030-01-01',label:'fixture-programme'}];
 c.arrivalsOn = iso => [{iso,id:'fixture-arrival'}];
 c.deliveryOf = key => ({key,state:'fixture-state'});
 c.deliveryAsOf = (key,iso) => ({key,iso});
 c.lightTally = () => ({done:1});
 // The actual business model is intentionally outside this test. This consumer
 // exposes native()'s snapshot and callback arguments without real job fixtures.
 c.create = env => {
  h.stats.creates++;
  const revision = c.S.revision;
  return {day(iso,today,dayObj) {
   return {iso,today,dayObj,revision,ready:env.ready(),assets:env.assets,
    arrivals:env.arrivals(iso),raw:env.rawDelivery('fixture-a'),delivery:env.delivery('fixture-a',iso),
    complete:env.complete({key:'fixture-a'},iso),dockets:env.dockets,services:env.services,
    collections:env.collections,operations:env.operations,sheets:env.sheets,programme:env.programme(iso)};
  }};
 };
 vm.runInContext('(function(root){' + source + '\n})(window);', c);
 return c.BuildWork986;
}
function day(model, n=1) { return model.day('2030-01-01','2030-01-02',{label:'fixture-day',n}); }

function nativeTests() {
 const old = harness(), newer = harness();
 const oldModel = installNative(old,oldNativeSource), model = installNative(newer,nativeSource);
 const expected = old.context.batch(() => Array.from({length:6},(_,i)=>day(oldModel,i)));
 const actual = newer.context.batch(() => Array.from({length:6},(_,i)=>day(model,i)));
 eq(actual,expected,'batched day calls preserve snapshot data and argument forwarding');
 eq(old.stats.serializations,6,'baseline serializes the record for every day');
 eq(newer.stats.serializations,1,'candidate serializes once for all days in one hold');
 eq(newer.stats.creates,1,'same held model serves all days');
 eq(newer.stats.builds,1,'one asset build per outer hold');
 clean(newer,'successful day batch releases the hold');

 newer.context.batch(() => day(model));
 eq(newer.stats.serializations,2,'next hold performs a fresh state-key read');
 eq(newer.stats.creates,1,'unchanged native model may still reuse its original cache');
 newer.context.S.revision=2;
 const refreshed = newer.context.batch(() => day(model));
 eq(refreshed.revision,2,'changed state is visible in the next hold');
 eq(newer.stats.serializations,3,'changed next hold serializes once');
 eq(newer.stats.creates,2,'changed state rebuilds the native model');

 const reset = harness(), resetModel = installNative(reset,nativeSource);
 reset.context.batch(() => {
  eq(day(resetModel).revision,1,'first model before explicit reset');
  reset.context.S.revision=2;
  resetModel.reset();
  eq(day(resetModel).revision,2,'explicit reset within a hold exposes the changed state');
  day(resetModel);
 });
 eq(reset.stats.serializations,2,'explicit reset forces exactly one additional read');
 eq(reset.stats.creates,2,'explicit reset rebuilds once');
 clean(reset,'reset inside hold still cleans up');

 const stale = harness(), staleModel = installNative(stale,nativeSource);
 stale.context.batch(() => {
  day(staleModel);
  stale.context.S.revision=3;
  stale.context.invalidate();
  eq(day(staleModel).revision,3,'existing save/remote stale flag invalidates the held native model');
  day(staleModel);
 });
 eq(stale.stats.serializations,2,'stale invalidation produces one additional serialization');
 eq(stale.stats.builds,2,'existing stale path refreshes the held asset list once');
 clean(stale,'stale refresh releases both caches');

 const bare = harness(), bareModel = installNative(bare,nativeSource);
 day(bareModel);day(bareModel);
 eq(bare.stats.serializations,2,'outside a hold every native read remains fresh');
 bare.context.S.revision=4;
 eq(day(bareModel).revision,4,'outside-hold state changes are visible immediately');
 bareModel.reset();day(bareModel);
 eq(bare.stats.creates,3,'explicit reset also works outside a hold');
 clean(bare,'unheld reads leave no held state');

 const broken = harness(), brokenModel = installNative(broken,nativeSource);
 broken.context.S.circular=broken.context.S;
 assert.throws(() => broken.context.batch(() => day(brokenModel)), /circular/i);checks++;
 clean(broken,'serialization errors release the hold');
 delete broken.context.S.circular;
 eq(broken.context.batch(() => day(brokenModel)).revision,1,'native reads recover after an exception');
}

function installCompletion(h, source) {
 const c=h.context;
 c.deliveryOf = key => {
  const a=h.state.assets.find(x=>x&&x.key===key);
  if(a.deliveryError)throw new Error('synthetic delivery failure');
  return a.delivery;
 };
 c.timeline841State = a => {
  // Timeline consumers make further asset reads in production. Count the same
  // dependency here while keeping all completion decisions in verified897.
  c.allAssets();
  if(a.timelineError)throw new Error('synthetic timeline failure');
  return a.timeline;
 };
 vm.runInContext(verifiedSource + '\n' + source,c);
 return c.gc500CompleteKeys897;
}
function completionFixtures() {
 return [null,
  {key:'fixture-complete',delivery:{done:true},timeline:{stage:5}},
  {key:'fixture-pending',delivery:{done:false},timeline:{stage:5}},
  {key:'fixture-cancelled',_cancelled:true,delivery:{done:true},timeline:{stage:5}},
  {key:'fixture-conflict',delivery:{done:true},timeline:{stage:5,conflict:true}},
  {key:'fixture-blocked',delivery:{done:true},timeline:{stage:5,blocked:true}},
  {key:'fixture-wrong-stage',delivery:{done:true},timeline:{stage:4}},
  {key:'fixture-no-delivery',delivery:null,timeline:{stage:5}},
  {key:'fixture-no-timeline',delivery:{done:true},timeline:null},
  {key:'fixture-delivery-error',deliveryError:true},
  {key:'fixture-timeline-error',delivery:{done:true},timelineError:true},
  {key:'fixture-complete',delivery:{done:true},timeline:{stage:5}}];
}
function completionTests() {
 const old=harness(),newer=harness();
 old.state.assets=completionFixtures();newer.state.assets=completionFixtures();
 const oldRead=installCompletion(old,oldCompleteSource),read=installCompletion(newer,completeSource);
 eq(read(),oldRead(),'completion results retain existing status, review and failure rules');
 eq(read(),['fixture-complete','fixture-complete'],'completion order and duplicate-key behavior are unchanged');
 eq(newer.stats.builds,2,'each unheld completion request builds assets once');
 ok(old.stats.builds>1,'baseline repeats asset work from nested Timeline reads');
 clean(newer,'completion requests release their own hold');
 newer.state.assets.find(a=>a?.key==='fixture-pending').delivery.done=true;
 eq(read(),['fixture-complete','fixture-pending','fixture-complete'],'next completion request sees changed records');
 const before=newer.stats.builds;
 newer.context.batch(() => {
  newer.context.memoPut('outer-fixture',true);
  eq(read(),['fixture-complete','fixture-pending','fixture-complete'],'nested completion keeps results');
  eq(newer.context.inspectHold(),{active:true,stale:false,memo:1},'nested completion preserves the outer hold');
 });
 eq(newer.stats.builds,before+1,'nested completion shares the outer asset build');
 clean(newer,'outer completion batch finally releases the hold');
 old.state.buildError=new Error('synthetic asset failure');newer.state.buildError=new Error('synthetic asset failure');
 eq(read(),oldRead(),'asset failure keeps the original null result');
 clean(newer,'completion asset failure leaves no active hold');
 newer.state.buildError=null;newer.state.assets=[];
 eq(read(),[],'empty completion result stays an array');
 clean(newer,'empty completion request cleans up');
}

function feedbackTests() {
 const h=harness(),c=h.context,receiver={id:'synthetic-receiver'},argument={id:'synthetic-argument'},result={id:'synthetic-result'};
 const calls=[];
 c.syncFooter=function(...args) { calls.push({self:this,args,hold:c.inspectHold()});c.allAssets();return result; };
 vm.runInContext(feedbackSource,c);
 same(c.syncFooter.call(receiver,argument,17),result,'sync wrapper returns the exact original value');
 same(calls[0].self,receiver,'sync wrapper preserves this');
 same(calls[0].args[0],argument,'sync wrapper preserves argument identity');
 eq(calls[0].args.length,2,'sync wrapper preserves argument count');
 eq(calls[0].args[1],17,'sync wrapper preserves additional arguments');
 eq(calls[0].hold,{active:true,stale:false,memo:0},'feedback runs inside a hold');
 eq(h.stats.builds,1,'feedback and nested asset reads share one build');
 clean(h,'feedback return cleans up its hold');
 c.batch(() => {
  c.memoPut('outer-fixture',true);
  same(c.syncFooter.call(receiver),result,'nested feedback returns the original value');
  eq(c.inspectHold(),{active:true,stale:false,memo:1},'nested feedback leaves outer hold and memo intact');
 });
 eq(h.stats.builds,2,'nested feedback does not build a second asset list');
 clean(h,'outer feedback batch cleans up');

 const bad=harness(),failure=new Error('synthetic feedback failure');
 bad.context.syncFooter=function(){bad.context.memoPut('partial',true);throw failure;};
 vm.runInContext(feedbackSource,bad.context);
 assert.throws(()=>bad.context.syncFooter(),error=>error===failure);checks++;
 clean(bad,'original feedback error propagates and still cleans up');
 bad.context.batch(()=>{
  assert.throws(()=>bad.context.syncFooter(),error=>error===failure);checks++;
  ok(bad.context.inspectHold().active,'nested feedback error does not close the caller hold');
 });
 clean(bad,'caller eventually cleans up a nested error');

 const failedBuild=harness();let invoked=false;
 failedBuild.state.buildError=new Error('synthetic build failure');
 failedBuild.context.syncFooter=()=>{invoked=true;};
 vm.runInContext(feedbackSource,failedBuild.context);
 assert.throws(()=>failedBuild.context.syncFooter(),error=>error===failedBuild.state.buildError);checks++;
 eq(invoked,false,'feedback does not run on a failed asset build');
 clean(failedBuild,'failed initial build leaves no hold');
}

nativeTests();completionTests();feedbackTests();
console.log('PASS candidate batching: '+checks+' checks; fresh holds, reset/invalidation, completion parity, wrapper arguments and cleanup.');
