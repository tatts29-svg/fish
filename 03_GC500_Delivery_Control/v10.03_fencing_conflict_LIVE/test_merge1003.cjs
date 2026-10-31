/* Author: Andrew Fisher. Pure regression checks against the built page; no browser/network writes. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const page = process.env.PAGE;
if (!page) throw new Error('PAGE must name the candidate HTML.');
const html = fs.readFileSync(page, 'utf8');
const blankStart = html.indexOf('const blank =');
const blankEnd = html.indexOf('\nlet S', blankStart);
const mergeStart = html.indexOf('function mergeRecords(mine, theirs)');
const mergeEnd = html.indexOf('\nfunction applyImport', mergeStart);
if ([blankStart, blankEnd, mergeStart, mergeEnd].some(n => n < 0)) throw new Error('Candidate function boundary not found.');
const helperStart = html.indexOf('// Author: Andrew Fisher. Docket 36560');
if (helperStart < 0) throw new Error('Candidate helper boundary not found.');
const helper = process.env.HELPER ? fs.readFileSync(process.env.HELPER, 'utf8') : html.slice(helperStart,mergeStart);
const context = {};
vm.createContext(context);
vm.runInContext(html.slice(blankStart, blankEnd) + `
const UNDO = 'back/';
function tombed(D,id) { const d=(D&&D.deleted)||{},off=d[id]; return !!off && !(d[UNDO+id] && String(d[UNDO+id]) > String(off)); }
function fmtStamp(x) { return x; }
function accIdOf(x) { return x.id; }
function fencePaperCanonical898(x) { return JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v); }
` + helper + '\n' + html.slice(mergeStart, mergeEnd) + '\nthis.mergeRecords = mergeRecords; this.blank = blank; this.fenceDockets1003 = fenceDockets1003;', context);
const clone = x => JSON.parse(JSON.stringify(x));
const canonical = x => JSON.stringify(x, (_,v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k,v[k]])) : v);
const results = [];
function check(name, condition, detail) { results.push({name, pass: !!condition, ...(condition ? {} : {detail})}); }
function equal(name, actual, expected) { check(name, canonical(actual) === canonical(expected), {actual, expected}); }

// Captured from the actual shared record on 12 October 2026, independent of helper constants.
const correctVariant = {
  id: 'F-AFV-0002·3529', date: '2026-09-28', week: 'Week 3', docket_no: '36560',
  crew: 'Advanced Temporary Fencing', map_ref: null, location: 'GC Hwy median strip (north)',
  quantities: {clean: 507.5, ccb_demarc: 447.5, ped_gates: 1},
  note: 'Includes 4 smoking zones. No shade cloth yet, requested from John (IEDM). Paper says CC Barrier 447.5 m; event or demarcation not written - recorded as demarcation, to confirm',
  recorded_by: 'Andrew Fisher via Claude', recorded_on: '2026-09-29',
  components: {mesh_panel: 203, cc_barrier: 179, base: 538, clamp: 547, brace: 171, wheels: 6},
  signed_by: 'Brenden', scope: 'programme',
  source: 'Advanced Temporary Fencing hire agreement 36560, signed paper photographed on site', origin: 'captured'
};
const oldVariant = clone(correctVariant); oldVariant.id = 'F-AFV-0002·bed7'; delete oldVariant.quantities.ped_gates;
const correctBase = {...clone(correctVariant), id: 'F-AFV-0002'};
const oldBase = {...clone(oldVariant), id: 'F-AFV-0002'};
const pair = [correctVariant, oldVariant];
const state = (rows, deleted = {}) => Object.assign(context.blank(), {fenceDockets: clone(rows), deleted: clone(deleted)});
const normal = rows => clone(context.fenceDockets1003(clone(rows)));
const merge = (a, b) => context.mergeRecords(a,b);
const fenceClashes = r => r.report.clashes.filter(c => String(c).includes('F-AFV-0002'));
const outRows = r => clone(r.merged.fenceDockets);

equal('known historical pair becomes one corrected base docket', normal(pair), [correctBase]);
equal('stale original base is corrected from source', normal([oldBase]), [correctBase]);
equal('corrected base remains one record', normal([correctBase]), [correctBase]);
equal('corrected variant becomes the stable base record', normal([correctVariant]), [correctBase]);
equal('normalisation is idempotent', normal(normal(pair)), normal(pair));
equal('reversed source order normalises identically', normal(pair.slice().reverse()), normal(pair));
equal('reordered nested JSON keys are the same source record', normal([JSON.parse(canonical(oldVariant)), JSON.parse(canonical(correctVariant))]), [correctBase]);
const originals = clone(pair); context.fenceDockets1003(originals); equal('source helper leaves input unchanged', originals, pair);

const fixed = merge(state(pair), state(pair));
equal('current copies merge to exactly one corrected docket', outRows(fixed), [correctBase]);
equal('current copies do not raise the recurring popup', fenceClashes(fixed), []);
const replay = merge(fixed.merged, fixed.merged);
equal('refresh/replay stays corrected', outRows(replay), [correctBase]);
equal('refresh/replay stays quiet', fenceClashes(replay), []);
for (const [name, stale] of [['old base', oldBase], ['old variant', oldVariant], ['corrected variant', correctVariant]]) {
  const a = merge(state([stale]), state(pair));
  const b = merge(state(pair), state([stale]));
  equal(name + ' offline copy cannot recreate duplicate', outRows(a), [correctBase]);
  equal(name + ' reverse merge cannot recreate duplicate', outRows(b), [correctBase]);
  equal(name + ' merge is commutative', outRows(a), outRows(b));
  equal(name + ' replay has no false conflict', fenceClashes(a), []);
}
const inputA = state(pair), inputB = state([oldBase]); const beforeA = clone(inputA), beforeB = clone(inputB);
merge(inputA,inputB); equal('merge leaves first input unchanged', inputA,beforeA); equal('merge leaves second input unchanged',inputB,beforeB);

for (const [name, alter] of [
  ['changed measured metres', row => {row.quantities.clean = 510;}],
  ['explicit zero gates', row => {row.quantities.ped_gates = 0;}],
  ['unknown gate count', row => {row.quantities.ped_gates = 2;}],
  ['new site note', row => {row.note += ' New site instruction.';}],
  ['different location', row => {row.location = 'Another recorded location';}],
  ['different docket number', row => {row.docket_no = '36561';}],
  ['new metadata', row => {row.extraEvidence = 'Keep this record detail';}],
  ['new recorder', row => {row.recorded_by = 'Another named recorder';}]
]) {
  const changed = clone(correctBase); alter(changed);
  equal(name + ' is not silently source-corrected', normal([changed]), [changed]);
  const result = merge(state([correctBase]), state([changed]));
  check(name + ' keeps both genuinely different records', result.merged.fenceDockets.length === 2, result.merged.fenceDockets);
  check(name + ' reports a genuine new conflict', fenceClashes(result).length === 1, result.report.clashes);
  check(name + ' content is retained', result.merged.fenceDockets.some(r => canonical({...r,id:changed.id}) === canonical(changed)), result.merged.fenceDockets);
  equal(name + ' merged content is commutative', outRows(result),outRows(merge(state([changed]),state([correctBase]))));
}

const genuineA = {id:'F-REGRESSION-1003',date:'2026-10-12',quantities:{clean:10},note:'Recorded'};
const genuineB = {...clone(genuineA), quantities:{clean:12}};
const unrelated = merge(state([genuineA]),state([genuineB]));
check('unrelated conflicting docket remains two records', unrelated.merged.fenceDockets.length===2);
check('unrelated new conflict remains visible', unrelated.report.clashes.length===1);
const repeated = merge(unrelated.merged,unrelated.merged);
equal('already-held conflict does not alert again on refresh', repeated.report.clashes, []);
equal('already-held unresolved evidence remains available', outRows(repeated),outRows(unrelated));
const reorderedExisting = state(unrelated.merged.fenceDockets.map(row => JSON.parse(canonical(row))));
const importedReordered = merge(unrelated.merged,reorderedExisting);
equal('pre-existing variant hashes survive a key-order-only import',outRows(importedReordered),outRows(unrelated));
equal('reordered import of already-held variants stays quiet',importedReordered.report.clashes,[]);
equal('pre-existing variant hashes survive reversed merge order',outRows(merge(reorderedExisting,unrelated.merged)),outRows(unrelated));
const editedWithOldHash = clone(unrelated.merged.fenceDockets[0]); editedWithOldHash.quantities.clean=16;
const editedExisting = merge(unrelated.merged,state([editedWithOldHash]));
check('edited content cannot impersonate its former variant hash',editedExisting.merged.fenceDockets.some(row=>row.quantities.clean===16&&row.id!==editedWithOldHash.id));
check('edited content with former variant hash remains a new conflict',editedExisting.merged.fenceDockets.length===3&&editedExisting.report.clashes.length===1);
const third = {...clone(genuineA), quantities:{clean:14}};
const expanded = merge(unrelated.merged,state([third]));
check('a new third variant raises a fresh conflict', expanded.report.clashes.length===1);
check('all three genuine variants remain',expanded.merged.fenceDockets.length===3);
const keyOrder = merge(state([genuineA]),state([JSON.parse(canonical(genuineA))]));
equal('key order alone does not duplicate unrelated docket', outRows(keyOrder),[genuineA]);
equal('key order alone is not a conflict', keyOrder.report.clashes,[]);

const removedAt='2026-10-12T01:00:00.000Z', restoredAt='2026-10-12T02:00:00.000Z';
equal('base tombstone suppresses every known variant',outRows(merge(state(pair),state([],{ 'F-AFV-0002':removedAt }))),[]);
equal('base tombstone also suppresses stale offline base',outRows(merge(state([oldBase]),state([],{ 'F-AFV-0002':removedAt }))),[]);
equal('later undo restores exactly one source-correct record',outRows(merge(state(pair),state([],{ 'F-AFV-0002':removedAt,'back/F-AFV-0002':restoredAt }))),[correctBase]);
equal('deletion wins an equal-time undo',outRows(merge(state(pair),state([],{ 'F-AFV-0002':removedAt,'back/F-AFV-0002':removedAt }))),[]);
const droppedOld = merge(state(pair),state([],{ 'F-AFV-0002·bed7':removedAt }));
equal('dropping obsolete variant retains the source-correct docket',outRows(droppedOld),[correctBase]);
const droppedCorrected = merge(state(pair),state([],{ 'F-AFV-0002·3529':removedAt }));
equal('corrected variant tombstone prevents source correction resurrection',outRows(droppedCorrected),[oldBase]);
equal('direct helper honours corrected-variant removal',context.fenceDockets1003(clone(pair),{'F-AFV-0002·3529':removedAt}),pair);
equal('direct helper honours obsolete-variant removal',context.fenceDockets1003(clone(pair),{'F-AFV-0002·bed7':removedAt}),pair);
equal('later corrected-variant undo allows reviewed normalisation',outRows(merge(state(pair),state([],{ 'F-AFV-0002·3529':removedAt,'back/F-AFV-0002·3529':restoredAt }))),[correctBase]);
const unrelatedId=unrelated.merged.fenceDockets[0].id;
const removedVariant=merge(unrelated.merged,state([],{[unrelatedId]:removedAt}));
check('unrelated variant tombstone removes only that variant',removedVariant.merged.fenceDockets.length===1);
check('unrelated removed variant does not survive',!removedVariant.merged.fenceDockets.some(r=>canonical({...r,id:unrelatedId})===canonical(unrelated.merged.fenceDockets[0])));

const failures=results.filter(r=>!r.pass);
const report={author:'Andrew Fisher',page:path.basename(page),sha256:crypto.createHash('sha256').update(html).digest('hex'),checks:results.length,passed:results.length-failures.length,failed:failures.length,failures,results};
if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(report,null,2)+'\n');
process.stdout.write(JSON.stringify({checks:report.checks,passed:report.passed,failed:report.failed,failures},null,2)+'\n');
process.exitCode=failures.length?1:0;
