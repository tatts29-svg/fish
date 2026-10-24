// Author: Andrew Fisher. Isolated application-code tests; no network or live record writes.
// node runtime_regression_tests.js <candidate.html> [results.json]
const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const crypto = require('crypto');
const html = fs.readFileSync(process.argv[2], 'utf8');
const chunk = (start, end) => {
  const a = html.indexOf(start), b = html.indexOf(end, a);
  assert(a >= 0 && b > a, `Source markers: ${start}`);
  return html.slice(a, b);
};
const fn = name => {
  const a = html.indexOf(`function ${name}(`), b = html.indexOf('\n}', a);
  assert(a >= 0 && b > a, `Function: ${name}`);
  return html.slice(a, b + 2);
};
const ctx = vm.createContext({
  console, clearTimeout: () => {}, setTimeout: () => 0,
  DATA: {assets: [], build_version: 'synthetic'}, PLANT_LINES: [],
  IMPORT_MAX_TEXT: 10000, IMPORT_MAX_ITEMS: 10000,
  todayIso: () => '2026-10-01', fmtStamp: x => x, tombed: () => false,
  persist: () => true, syncRedraw: () => {},
  localStorage: {getItem: () => null, setItem: () => {}},
});
vm.runInContext([
  chunk('const blank = () =>', 'let S = blank();'),
  'let S = blank();',
  chunk('const MAX_WEEKS =', 'function safeWeeks('),
  chunk('function recordsFrom(', 'function applyImport('),
  fn('exportRecord'),
  chunk('function validateRecords(', "$('#importFile').onchange"),
  chunk('const SYNC_COLLS = {', '/* a document id from a key:'),
  chunk('function docIdOf(', '/* write what changed since'),
  chunk('function syncStageLive(', 'function syncSend('),
  chunk('function syncFirst(', '/* redraw after remote changes'),
  'let SYNC = {}; function syncSend(){ syncStageLive(); }',
].join('\n'), ctx);
const results = [];
const test = (name, expression, expected = true, context = ctx) => {
  const value = vm.runInContext(expression, context);
  assert.deepEqual(value === undefined ? undefined : JSON.parse(JSON.stringify(value)), expected, name);
  results.push({name, passed: true});
};
vm.runInContext(`
const fields = ['fixes', 'entries', 'places', 'givenRefs', 'lineRates', 'finance745'];
const fixture = {
  fixes: {RTEST: {lat:-27.97, lng:153.42, by:'Recorder A', at:'2026-10-01T00:00:00.000Z'}},
  entries: {RTEST: {lat:-27.96, lng:153.41, by:'Recorder A', at:'2026-10-01T00:00:00.000Z'}},
  places: {RTEST: {sheet:'SYNTHETIC', x:0.4, y:0.6, by:'Recorder A', at:'2026-10-01T00:00:00.000Z'}},
  givenRefs: {'TASK-TEST': {ref:'RTEST', by:'Recorder A', at:'2026-10-01T00:00:00.000Z'}},
  lineRates: {RTEST:'125.50'},
  finance745: {RTEST:{id:'RTEST',kind:'rate',key:'Test person',prev:null,at:'2026-10-01T00:00:00.000Z',by:'Recorder A',payload:{rate:50,basis:'Synthetic test'}}},
  stamps: Object.fromEntries(fields.map(f=>[f+'/'+(f==='givenRefs'?'TASK-TEST':'RTEST'),'2026-10-01T00:00:00.000Z'])),
  by: Object.fromEntries(fields.map(f=>[f+'/'+(f==='givenRefs'?'TASK-TEST':'RTEST'),'Recorder A']))
};
S = Object.assign(blank(), fixture);
const wrapped = exportRecord(), bare = Object.assign({}, wrapped); delete bare.records;
const importedBare = recordsFrom(bare), importedWrapped = recordsFrom(wrapped);
const key='TASK-TEST', field='givenRefs/'+key;
const newer = {givenRefs:{[key]:{ref:'RNEW',by:'Recorder B',at:'2026-10-01T01:00:00.000Z'}},stamps:{[field]:'2026-10-01T01:00:00.000Z'},by:{[field]:'Recorder B'}};
const cleared = {givenRefs:{},stamps:{[field]:'2026-10-01T02:00:00.000Z'},by:{[field]:'Recorder B'}};
`, ctx);
test('New records initialise task reference assignments', 'blank().givenRefs', {});
for (const field of ['fixes', 'entries', 'places', 'givenRefs', 'lineRates', 'finance745']) {
  test(`${field}: bare export restores the same data as the wrapped export`,
    `JSON.stringify(importedBare.${field})===JSON.stringify(importedWrapped.${field}) && JSON.stringify(importedBare.${field})===JSON.stringify(fixture.${field})`);
  test(`${field}: importing into a blank record retains positions or assignments`,
    `JSON.stringify(mergeRecords(blank(),importedBare).merged.${field})===JSON.stringify(fixture.${field})`);
  test(`${field}: malformed collection is rejected before importing`,
    `validateRecords({${field}:[]}).some(x=>x.includes('${field} is not a keyed object'))`);
}
test('Bare and wrapped imports preserve map author and timestamp',
  `['stamps','by'].every(f=>JSON.stringify(importedBare[f])===JSON.stringify(importedWrapped[f]) && JSON.stringify(importedBare[f])===JSON.stringify(fixture[f]))`);
test('Later task assignment wins in both merge orders',
  `[mergeRecords(fixture,newer).merged.givenRefs[key].ref,mergeRecords(newer,fixture).merged.givenRefs[key].ref]`, ['RNEW','RNEW']);
test('Winning assignment retains the matching author and timestamp',
  `(()=>{const m=mergeRecords(fixture,newer).merged;return [m.by[field],m.stamps[field]];})()`, ['Recorder B','2026-10-01T01:00:00.000Z']);
test('Deliberately clearing an assignment wins over an older copy in both orders',
  `[mergeRecords(fixture,cleared).merged.givenRefs,mergeRecords(cleared,fixture).merged.givenRefs]`, [{},{}]);
test('Cleared assignment keeps its author and timestamp',
  `(()=>{const m=mergeRecords(fixture,cleared).merged;return [m.by[field],m.stamps[field]];})()`, ['Recorder B','2026-10-01T02:00:00.000Z']);
test('Task assignment sync documents round trip including the audit trail', `(()=>{
  S=Object.assign(blank(),fixture);
  return ['givenRefs','stamps','by'].every(f=>JSON.stringify(fromDocs(f,toDocs(f)))===JSON.stringify(S[f]));
})()`);
test('Editor startup preserves the remote task assignment and queues no deletion', `(()=>{
  S=blank(); const value=fixture.givenRefs[key];
  SYNC={readonly:false,pending:{givenRefs:{[docIdOf(key)]:{_k:key,v:value}},stamps:{[docIdOf(field)]:{_k:field,v:fixture.stamps[field]}},by:{[docIdOf(field)]:{_k:field,v:'Recorder A'}}},first:new Set(),last:{},queue:{},inflight:{}};
  syncFirst(); return S.givenRefs[key].ref==='RTEST' && S.by[field]==='Recorder A' && Object.keys(SYNC.queue.givenRefs||{}).length===0;
})()`);
test('A newer offline task assignment is retained and queued with its author', `(()=>{
  S=Object.assign(blank(),newer);
  SYNC={readonly:false,pending:{givenRefs:{[docIdOf(key)]:{_k:key,v:fixture.givenRefs[key]}},stamps:{[docIdOf(field)]:{_k:field,v:fixture.stamps[field]}},by:{[docIdOf(field)]:{_k:field,v:'Recorder A'}}},first:new Set(),last:{},queue:{},inflight:{}};
  syncFirst(); return S.givenRefs[key].ref==='RNEW' && SYNC.queue.givenRefs[docIdOf(key)].v.ref==='RNEW' && SYNC.queue.by[docIdOf(field)].v==='Recorder B';
})()`);
test('An offline deliberate clear remains cleared at editor startup', `(()=>{
  S=Object.assign(blank(),cleared);
  SYNC={readonly:false,pending:{givenRefs:{[docIdOf(key)]:{_k:key,v:fixture.givenRefs[key]}},stamps:{[docIdOf(field)]:{_k:field,v:fixture.stamps[field]}},by:{[docIdOf(field)]:{_k:field,v:'Recorder A'}}},first:new Set(),last:{},queue:{},inflight:{}};
  syncFirst(); return !(key in S.givenRefs) && SYNC.queue.givenRefs[docIdOf(key)]===null;
})()`);

const unit = vm.createContext({console});
vm.runInContext(`
let S={deleted:{'unit/RTEST/001':'removed'},by:{},units:{}};
let collision={ref:'OTHER',sheet:'DRAWING',callout:'01',label:'Other unit'}, calls=0, messages=[];
const SUB_RX=/^Sub-hire:/i;
function mayWrite(){return true;} function isRef(){return true;} function whoAmI(){return 'Recorder A';}
function flash(s){messages.push(s);} function buzz(){} function bump(){calls++;}
function unitsLocal(ref){return S.units[ref]||[];}
function unitTombId(ref,u){return 'unit/'+ref+'/'+(u.asset_no||u.label);}
function untomb(id){delete S.deleted[id];S.by['deleted/back/'+id]='Recorder A';}
function allUnits(){return collision?[collision]:[];}
function calloutKey(s){return String(parseInt(s,10));}
function sameUnit(a,b){return a.asset_no&&b.asset_no?a.asset_no===b.asset_no:a.label===b.label;}
function unitsSet(ref,list){S.units[ref]=list;}
` + fn('unitAdd'), unit);
test('A refused conflicting placement leaves removed units and audit unchanged', `(()=>{
  const before=JSON.stringify(S),result=unitAdd('RTEST',{label:'Sub-hire: Test supplier',asset_no:'001',sheet:'DRAWING',callout:'1'});
  return result===false && JSON.stringify(S)===before && calls===0 && messages[0].includes('already has');
})()`, true, unit);
test('A valid placement restores the unit with its asset number and records it once', `(()=>{
  collision=null;
  const result=unitAdd('RTEST',{label:'Sub-hire: Test supplier',asset_no:'001',sheet:'DRAWING',callout:'1'});
  return result===true && !S.deleted['unit/RTEST/001'] && S.units.RTEST.length===1 && S.units.RTEST[0].asset_no==='001' && S.units.RTEST[0].by==='Recorder A' && calls===1;
})()`, true, unit);
test('Refusing a malformed supplier number changes no unit or audit', `(()=>{
  const before=JSON.stringify(S),result=unitAdd('RTEST',{label:'Sub-hire: Test supplier',asset_no:'@',sheet:'DRAWING',callout:'2'});
  return result===false && JSON.stringify(S)===before && calls===1;
})()`, true, unit);

const report={author:'Andrew Fisher',candidate_sha256:crypto.createHash('sha256').update(html).digest('hex'),passed:results.length,failed:0,live_record_writes:0,tests:results};
if(process.argv[3]) fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,failed:0,live_record_writes:0}));
