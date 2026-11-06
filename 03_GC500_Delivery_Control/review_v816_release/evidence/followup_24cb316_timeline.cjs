// Author: Andrew Fisher. Read-only CPU audit of frozen v8.16 source 24cb316.
// node followup_24cb316_timeline.cjs /path/to/unpatched_v8.13.html /path/to/frozen/source_directory
'use strict';
const fs = require('fs'), vm = require('vm'), assert = require('assert'), crypto = require('crypto');
assert(process.argv[2] && process.argv[3], 'Usage: node followup_24cb316_timeline.cjs <unpatched v8.13 HTML> <frozen v8.16 source directory>');
const baseline = process.argv[2], sourceDir = process.argv[3];
const get = name => fs.readFileSync(sourceDir + '/' + name, 'utf8');
const html = fs.readFileSync(baseline, 'utf8'), patch = get('patch_v816.py'), drawer = get('drawer816_src.js');
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');
const expected = {
  'patch_v816.py': '9b17360533c8a346b54ed7364c729dc890b4948a7c29be334e50c9a7e2a1d411',
  'drawer816_src.js': '6f87a42c4ac481bbbbceaab8c33e96adfd0f5b91fa7bc1780618a082d0882125',
  'demob816_src.js': '201147305c2e760f7ccecd6f9c09a3c7b3651931f0c82a5a7dfbd5584249fcea'
};
Object.entries(expected).forEach(([name, digest]) => assert.equal(sha256(get(name)), digest, 'exact frozen24cb316 ' + name));
assert.equal(sha256(html), 'f07e92cc79ad416e75f0db2b6cfa1c302d1789cf7c93ff0da8142afc6dc8a7ec', 'exact unpatched v8.13 baseline');
const hunk = patch.match(/# 5\. CODEX SCOPE[\s\S]*?t = rep\(t, """([\s\S]*?)""",\s*"""([\s\S]*?)""",/);
assert(hunk, 'exact Timeline hunk located');
assert.equal(sha256(hunk[2]), '8e9e00f0bd00f01edae6ecef1ed4fa12059fa92e703bfd33f990d79657db7a26', 'Timeline replacement remains byte-identical to frozen968aefb');
const original = html.slice(html.indexOf('function programmeDaysBefore801(){'), html.indexOf('function holidayOn('));
assert.equal(original.split(hunk[1]).length, 2, 'hunk matches the baseline once');
const eff = html.slice(html.indexOf('function effectiveDates(a){'), html.indexOf('/* the source correction on the day'));
let assets = [], records = {}, cancelled = false;
const context = {allAssets: () => assets, unreferencedRows: () => [], rowOff: () => cancelled, deliveryOf: key => records[key] || {}, dateCorrectionOf: () => null, DATA: {}, weekOf: () => null};
vm.createContext(context); vm.runInContext(eff + '\n' + original.replace(hunk[1], hunk[2]), context);
const run = () => vm.runInContext('programmeDaysBefore801()', context);
const removalKeys = iso => (run().find(d => d.iso === iso) || {removals: []}).removals.map(r => r.a.key);
const checks = [];
const check = (name, test) => { assert(test, name); checks.push(name); };
assets = [{key: 'ADDED', _added: true, first_date: '2026-10-20', last_date: '2026-10-20', events: []}]; records = {ADDED: {out_date: '2026-11-04'}};
check('same-day added reference now has one typed removal', removalKeys('2026-11-04').join() === 'ADDED');
check('same-day added reference retains its original delivery', run().find(d => d.iso === '2026-10-20').deliveries.length === 1);
records = {};
check('clearing typed date removes the synthetic removal', run().every(d => !d.removals.length));
assets = [{key: 'P42', first_date: '2026-10-20', events: [{movement: 'place', date: '2026-10-20'}]}]; records = {P42: {out_date: '2026-11-04'}};
check('ordinary missing-remove case remains correct', removalKeys('2026-11-04').join() === 'P42');
records.P42.out_date = '2026-11-05';
check('changing typed date leaves no removal on previous date', !removalKeys('2026-11-04').length && removalKeys('2026-11-05').join() === 'P42');
assets[0].events.push({movement: 'remove', date: '2026-11-01'});
check('existing plan removal is moved once without duplication', removalKeys('2026-11-05').join() === 'P42' && !removalKeys('2026-11-01').length);
cancelled = true;
check('cancelled reference gets no active Timeline removal', run().every(d => !d.removals.length));
const outDeclarations = drawer.slice(drawer.indexOf('const cxOut ='), drawer.indexOf('\n\tconst word ='));
const output = drawer.match(/(<div class="ctile \$\{M && M\.src === 'proposed'[\s\S]*?)\n\$\{dForm/)[1];
const renderOut = ({M = null, d = {}, eff = {}, a = {_cancelled: true}, contract = null} = {}) => {
  const ctx = {M, d, eff, a, contract816: () => ({early: contract}), DM816: {end: '2026-11-13'}, esc: x => String(x), dayWords816: x => x, srcChip816: x => '<span>' + x + '</span>', week816: () => 2};
  vm.createContext(ctx); return vm.runInContext(outDeclarations + '\n`' + output + '`', ctx);
};
let rendered = renderOut({d: {out_date: '2026-11-04'}, eff: {out: '2026-11-04'}});
check('cancelled typed out date remains visible and says cancelled', rendered.includes('2026-11-04') && rendered.includes('cancelled · the due-out typed on it'));
rendered = renderOut({eff: {out: '2026-11-03', out_plan: '2026-11-03'}});
check('cancelled plan date remains visible with its source', rendered.includes('2026-11-03') && rendered.includes("the plan's remove event"));
rendered = renderOut({contract: '2026-11-02'});
check('cancelled early contract date remains visible with its source', rendered.includes('2026-11-02') && rendered.includes('contract off-hire'));
rendered = renderOut({M: {iso: '2026-11-06', src: 'proposed', side: 'inside'}, a: {}});
check('active proposed date retains proposal styling and wording', rendered.includes('pr816') && rendered.includes('2026-11-06') && rendered.includes('proposed'));
rendered = renderOut({M: {iso: '2026-11-04', src: 'confirmed'}, d: {out_by: 'Fixture'}, a: {}});
check('active confirmed date retains confirmed source and recorder', rendered.includes('2026-11-04') && rendered.includes('confirmed by Fixture'));
// Positive verification of the explicit-removal precedence repair.
const explicitAsset = {key: 'ADDED', _added: true, first_date: '2026-10-20', last_date: '2026-10-20', events: [{date: '2026-10-20', movement: 'place'}, {date: '2026-11-05', movement: 'remove'}]};
assets = [explicitAsset]; records = {}; cancelled = false;
const demobContext = {allAssets: () => assets, unreferencedRows: () => [], rowOff: () => false, deliveryOf: key => records[key] || {}, dateCorrectionOf: () => null, S: {delivery: {}}, DATA: {}, weekOf: () => null, branchOf: () => ({code: 'KINP'}), refKind: () => 'building', subhireOf: () => null};
vm.createContext(demobContext);
vm.runInContext(get('demob816_src.js') + '\n' + eff + '\n' + original.replace(hunk[1], hunk[2]), demobContext);
vm.runInContext("zone816=()=>({zone:'none',side:'outside'});units816=()=>[];needsEmpty816=()=>false;emptiedOf816=()=>({on:false});contract816=()=>({early:null,last:null});", demobContext);
const observe = () => vm.runInContext("({effective:effectiveDates(allAssets()[0]),demob:((r)=>({src:r.src,iso:r.iso}))(demob816().byKey.get('ADDED')),timeline:programmeDaysBefore801().filter(d=>d.removals.length).map(d=>({iso:d.iso,refs:d.removals.map(r=>r.a.key)}))})", demobContext);
const planFixed = observe();
check('dated removal event on a same-day added reference wins in Demob and Timeline', planFixed.effective.out_plan === '2026-11-05' && planFixed.timeline.length === 1 && planFixed.timeline[0].iso === '2026-11-05' && planFixed.demob.src === 'plan' && planFixed.demob.iso === '2026-11-05');
records = {ADDED: {out_date: '2026-11-06'}};
const typed = observe();
check('typed override still wins over the added reference explicit removal', typed.demob.src === 'confirmed' && typed.demob.iso === '2026-11-06' && typed.timeline.length === 1 && typed.timeline[0].iso === '2026-11-06');
records = {};
assets = [{...explicitAsset, events: []}];
const fallback = observe();
check('same-day added reference without a removal event remains proposed', fallback.demob.src === 'proposed' && fallback.demob.iso === '2026-10-26' && fallback.timeline.length === 0);
assets = [{...explicitAsset, events: [{movement: 'remove', date: null}]}];
const undated = observe();
check('undated removal does not become an authoritative plan date', undated.demob.src === 'proposed' && undated.demob.iso === '2026-10-26');
assets = [{...explicitAsset, last_date: '2026-11-03', events: []}];
const distinct = observe();
check('distinct added-reference last date remains the plan fallback', distinct.demob.src === 'plan' && distinct.demob.iso === '2026-11-03' && distinct.timeline.length === 1 && distinct.timeline[0].iso === '2026-11-03');
console.log(JSON.stringify({author: 'Andrew Fisher', source: '24cb316b9a4440356cd438e0fb83738183d02569', hashes: {baseline_sha256: sha256(html), source_sha256: expected, timeline_replacement_sha256: sha256(hunk[2])}, scope: 'Read-only synthetic CPU fixtures; actual date functions and drawer template; no browser, DOM, CSS, network, record writes or full release verification', checks: checks.length, passed: checks, explicitRemovalFixed: {fixture: explicitAsset, result: planFixed}, remaining_findings_in_scope: []}, null, 2));
