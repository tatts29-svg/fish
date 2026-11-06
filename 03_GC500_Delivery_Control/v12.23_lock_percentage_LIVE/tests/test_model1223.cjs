/* Author: Andrew Fisher. Synthetic servicing percentages; no network or production records. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
assert(process.env.PAGE && process.env.BASE, 'Set PAGE to the candidate HTML and BASE to its baseline HTML.');
const page = fs.readFileSync(process.env.PAGE, 'utf8'), base = fs.readFileSync(process.env.BASE, 'utf8');
let checks = 0;
function check(name, fn) { fn(); checks++; console.log('PASS ' + name); }
function load(html) {
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  const context = vm.createContext({module: {exports: {}}, console});
  for (const [name, end] of [
    ['SvcCrews1173', 'module.exports=SvcCrews1173;'],
    ['SvcState', 'module.exports = SvcState;'],
    ['SvcProgress1102', 'module.exports=SvcProgress1102;'],
    ['SvcPanel', 'module.exports = SvcPanel;']
  ]) {
    const start = 'var ' + name + ' = (function () {';
    const script = scripts.find(s => s.includes(start));
    assert(script, 'Missing actual script for ' + name);
    const i = script.indexOf(start), j = script.indexOf(end, i);
    assert(j > i, 'Missing module end for ' + name);
    vm.runInContext(script.slice(i, j + end.length), context, {filename: name + '.js'});
    assert(context[name], 'Module did not load: ' + name);
  }
  return context;
}
const current = load(page), previous = load(base);
const finalDay = '2026-10-25', priorDay = '2026-10-24', now = Date.parse('2026-10-25T20:00:00+10:00');
const data = {
  tasks: {pump: 'Pump out', clean: 'Clean & restock', lockup: 'Locked (doors locked)', refill: 'Water checked / refilled'},
  plans: {fwf: {night: ['pump', 'clean', 'refill'], final: ['pump', 'clean', 'lockup']},
    block: {night: ['clean'], final: ['clean']}, tank: {night: ['pump'], final: ['pump']}},
  extras: [], days: [{id: priorDay, label: 'Sat 24', plan: 'night'}, {id: finalDay, label: 'Sun 25', plan: 'final'}],
  crewGroups: [{id: 'cleaners', label: 'Crew A'}, {id: 'pump1', label: 'Crew B'}],
  areas: [
    {n: 1, name: 'Synthetic north', refs: [{ref: 'TEST-A', lines: [
      {id: 'TEST-A-GROUP', kind: 'fwf', qty: 20, label: '20 × toilets'},
      {id: 'TEST-A-SINGLE', kind: 'fwf', qty: 1, label: '1 × toilet'}]}]},
    {n: 2, name: 'Synthetic south', refs: [{ref: 'TEST-B', lines: [
      {id: 'TEST-B-GROUP', kind: 'fwf', qty: 3, label: '3 × toilets'},
      {id: 'TEST-B-BLOCK', kind: 'block', qty: 2, label: '2 × toilet blocks'},
      {id: 'TEST-B-TANK', kind: 'tank', qty: 1, label: '1 × waste tank'}]}]}
  ]
};
const refs = D => D.areas.flatMap(a => a.refs);
const tick = (id, extra = {}) => ({id, line: 'TEST-A-GROUP', ref: 'TEST-A', task: 'lockup', day: finalDay,
  done: true, at: '2026-10-25T09:02:00Z', tapped_at: '2026-10-25T09:01:00Z', crew_group: 'cleaners', ...extra});
function allTicks(D, day, onlyTask) {
  return refs(D).flatMap(r => r.lines.flatMap(l => current.SvcState.tasksFor(D, l, day)
    .filter(t => !onlyTask || t === onlyTask)
    .map(task => tick(l.id + '-' + task, {line: l.id, ref: r.ref, task, day}))));
}
function cards(html) {
  return [...html.matchAll(/<div class="svc1123-job (\w+)( full)?">[\s\S]*?<b class="pct">(\d+)%<\/b><b>([\s\S]*?)<\/b><small>(\d+) of (\d+)[\s\S]*?<\/small><\/span><\/div>/g)]
    .map(m => ({html: m[0], task: m[1], full: !!m[2], pct: +m[3], label: m[4], d: +m[5], w: +m[6]}));
}
function lockChips(html) {
  return [...html.matchAll(/<span class="svc1123-chip lockup( full)?" title="([^"]*)">[\s\S]*?<b>(\d+)%<\/b><\/span>/g)]
    .map(m => ({html: m[0], full: !!m[1], title: m[2], pct: +m[3]}));
}
function render(engine, events, D = data, day = finalDay) {
  const M = {D, S: engine.SvcState, events, now, lastRead: now, day, open: {1: true, 2: true},
    example: false, operational1160: true, historyOpen1160: true};
  return engine.SvcPanel.svcPanelHtml(M);
}
function verify(name, events, D = data, day = finalDay) {
  let result;
  check(name, () => {
    const S = current.SvcState, states = S.jobStates(events, now), expected = S.taskStats(D, refs(D), day, states);
    const html = render(current, events, D, day), oldHtml = render(previous, events, D, day), jobs = cards(html);
    assert.equal(new Set(jobs.map(j => j.task)).size, jobs.length, 'One overall card per task');
    const lock = jobs.find(j => j.task === 'lockup'), target = expected.lockup;
    assert.equal(!!lock, !!(target && target.w > 0), 'Lock card follows selected-night target');
    if (lock) {
      assert.deepEqual({d: lock.d, w: lock.w, pct: lock.pct}, {d: target.d, w: target.w, pct: target.pct});
      assert.equal(lock.label, D.tasks.lockup);
      assert.equal(lock.full, target.d === target.w);
    }
    const areas = [...html.matchAll(/<details class="svc-area[^"]*" data-svc-area="([^"]*)"[^>]*>([\s\S]*?)<\/details>/g)];
    assert.equal(areas.length, D.areas.length);
    areas.forEach(m => {
      const area = D.areas.find(a => String(a.n) === m[1]), g = S.taskStats(D, area.refs, day, states).lockup;
      const chips = lockChips(m[2]);
      assert.equal(chips.length, g && g.w > 0 ? 1 : 0, 'Area lock chip follows its own target');
      if (chips.length) {
        assert.equal(chips[0].pct, g.pct);
        assert.equal(chips[0].title, D.tasks.lockup + ' ' + g.d + ' of ' + g.w);
        assert.equal(chips[0].full, g.d === g.w);
      }
    });
    let withoutNewIndicators = html;
    if (lock) withoutNewIndicators = withoutNewIndicators.replace(lock.html, '');
    for (const chip of lockChips(html)) withoutNewIndicators = withoutNewIndicators.replace(chip.html, '');
    assert.equal(withoutNewIndicators, oldHtml, 'Existing task cards, counts, tables and night output are unchanged');
    result = {html, jobs, expected};
  });
  return result;
}
verify('final night starts at zero and shows lock instead of water', []);
const partial = verify('grouped quantity uses units and rounds down', [tick('group')]);
check('one grouped completion is twenty of twenty-four, not one of three', () => {
  const lock = partial.jobs.find(j => j.task === 'lockup');
  assert.deepEqual([lock.d, lock.w, lock.pct], [20, 24, 83]);
});
verify('duplicate transport IDs count once', [tick('duplicate'), tick('duplicate')]);
verify('different IDs and crew groups on one line count once', [tick('a'), tick('b', {crew_group: 'pump1'})]);
verify('undo removes the last completion', [tick('a'), tick('undo', {done: false, undoes: ['a']})]);
verify('undo keeps another active completion', [tick('a'), tick('b'), tick('undo', {done: false, undoes: ['a']})]);
verify('out-of-order undo still removes its completion', [tick('undo', {done: false, undoes: ['a']}), tick('a')]);
verify('void list removes completion', [tick('a'), {voids: ['a']}]);
verify('voided completion is excluded', [tick('a', {voided: true})]);
verify('wrong-line and wrong-night undo cannot cancel a job', [tick('a'),
  tick('wrong-line', {line: 'TEST-A-SINGLE', done: false, undoes: ['a']}),
  tick('wrong-day', {day: priorDay, done: false, undoes: ['a']})]);
verify('legacy saved lock tick remains complete without a declaration', [tick('legacy')]);
const declared = verify('declaration retains ordinary lock counting', [tick('declared', {
  lock_declaration: {version: 1, by: 'Synthetic confirmer', crew: 'Crew A', units: 20}})]);
check('lock declaration invents no pump or cleaning completion', () => {
  for (const task of ['pump', 'clean']) assert.equal(declared.jobs.find(j => j.task === task).d, 0);
});
verify('ticks from a different night do not count', [tick('old', {day: priorDay})]);
const historic = verify('previous night retains water with no lock card or chip', allTicks(data, priorDay), data, priorDay);
const completed = verify('all lock units complete gives exactly one hundred percent', allTicks(data, finalDay, 'lockup'));
check('fully locked does not imply all servicing is complete', () => {
  assert.equal(completed.jobs.find(j => j.task === 'lockup').pct, 100);
  for (const task of ['pump', 'clean']) assert.equal(completed.jobs.find(j => j.task === task).pct, 0);
});
verify('all final-night servicing retains existing completion output', allTicks(data, finalDay));
const noLocks = structuredClone(data);
noLocks.areas.forEach(a => a.refs.forEach(r => { r.lines = r.lines.filter(l => l.kind !== 'fwf'); }));
const zero = verify('areas with no lock jobs have no lock indicator', [], noLocks);
const empty = structuredClone(data); empty.areas = [];
verify('empty servicing scope has no lock indicator', [], empty);
const zeroQty = structuredClone(data);
zeroQty.areas.forEach(a => a.refs.forEach(r => r.lines.forEach(l => { l.qty = 0; })));
verify('zero-quantity targets never display a lock percentage', [], zeroQty);
const rounding = structuredClone(data);
rounding.areas = [{n: 1, name: 'Synthetic rounding', refs: [{ref: 'TEST-A', lines: [
  {id: 'TEST-A-GROUP', kind: 'fwf', qty: 999, label: '999 × toilets'},
  {id: 'TEST-A-SINGLE', kind: 'fwf', qty: 1, label: '1 × toilet'}]}]}];
const almost = verify('fractional percentage uses the shared floor rule', [tick('almost')], rounding);
check('ninety-nine point nine percent never displays one hundred', () => assert.equal(almost.jobs.find(j => j.task === 'lockup').pct, 99));

const fixtures = [];
if (process.env.EVIDENCE) {
  fs.mkdirSync(process.env.EVIDENCE, {recursive: true});
  const styles = ['svc1067-style', 'svc1102-style', 'svc1104-race-style', 'svc1160-style'].map(id => {
    const found = page.match(new RegExp('<style\\b[^>]*id="' + id + '"[^>]*>[\\s\\S]*?<\\/style>'));
    assert(found, 'Missing fixture stylesheet ' + id); return found[0];
  }).join('\n');
  for (const [name, result] of [['partial', partial], ['complete', completed], ['previous', historic], ['zero', zero]]) {
    const filename = 'model1223-' + name + '.html';
    const fixture = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<meta name="author" content="Andrew Fisher"><title>Synthetic lock percentage · ' + name + '</title>' +
      '<style>body{margin:0;padding:12px;background:#111820;color:#e5eef4;font:14px Arial,sans-serif}main{max-width:1280px;margin:auto}.card{padding:16px}.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}</style>' +
      styles + '</head><body><main><section id="pane-servicing" class="pane on"><div id="svc1067-host" class="card"><div id="svc1067">' +
      result.html + '</div></div></section></main></body></html>';
    fs.writeFileSync(path.join(process.env.EVIDENCE, filename), fixture);
    fixtures.push(filename);
  }
}
console.log(JSON.stringify({checks, synthetic: true, networkRequests: 0, operationalWrites: 0, fixtures}));
