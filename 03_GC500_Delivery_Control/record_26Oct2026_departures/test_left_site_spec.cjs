#!/usr/bin/env node
/* Author: Andrew Fisher. The record runner's spec checks on their own: no browser, no page, no service. Every spec already
   run still passes unchanged, spec 11 passes, and each fault the 27 Oct 2026 checks exist for is refused with its own reason.
     node record_26Oct2026_departures/test_left_site_spec.cjs        (from 03_GC500_Delivery_Control/) */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), assert = require('assert'), {spawnSync} = require('child_process');
const HERE = __dirname, RUNNER = path.join(HERE, 'left_site.cjs');
const lib = require(RUNNER); /* the runner hands back its checks when required; it opens nothing */
const {validateSpec, refsOf, aestDay, realDay} = lib;
const NOW = Date.parse('2026-10-27T04:45:00+10:00'); /* today is 27 Oct 2026 in AEST */
let passed = 0, failed = 0;
const t = (name, f) => { try { f(); passed++; console.log('ok   ' + name); } catch (e) { failed++; console.log('FAIL ' + name + ': ' + e.message); } };
const load = f => JSON.parse(fs.readFileSync(path.isAbsolute(f) ? f : path.join(HERE, f), 'utf8'));
const clone = x => JSON.parse(JSON.stringify(x));
const S11 = load('left_site_spec_11_vms_refs.json');
const find = (s, op, key) => s.ops.find(o => o.op === op && (key == null || o.ref === key || o.pos === key));
const refuses = (name, mutate, reason) => t('refuses ' + name, () => { const s = clone(S11); mutate(s); assert.throws(() => validateSpec(s, NOW), reason); });
const passes = (name, mutate) => t('passes ' + name, () => { const s = clone(S11); mutate(s); assert.strictEqual(validateSpec(s, NOW), true); });

// ---------------------------------------------------------------------------------------------- the module
t('requiring the runner gives its checks and starts no run', () => { assert.strictEqual(typeof validateSpec, 'function'); assert.strictEqual(typeof refsOf, 'function'); });

// ---------------------------------------------------------------------------------------------- what already ran
const done = fs.readdirSync(HERE).filter(f => /^left_site_spec.*\.json$/.test(f) && f !== 'left_site_spec_11_vms_refs.json').sort();
t('every spec already run is in the folder (' + done.length + ')', () => assert.ok(done.length >= 10));
for (const f of done) {
  t(f + ' still passes', () => assert.strictEqual(validateSpec(load(f)), true));
  t(f + ' names the same references as before', () => { const s = load(f); assert.deepStrictEqual(refsOf(s), [...new Set(s.ops.flatMap(o => [o.ref, o.from, o.to]).filter(Boolean))]); });
}
for (const f of ['gn20_spec.json', 'gn20_dates_spec.json']) { /* the 25 Oct GN20-A specs: add_ref with a number, a dated light, date_back */
  const p = path.join(HERE, '..', 'record_25Oct2026_gn20_back', f);
  if (fs.existsSync(p)) t('the earlier shape ' + f + ' passes', () => assert.strictEqual(validateSpec(load(p), NOW), true));
}

// ---------------------------------------------------------------------------------------------- spec 11
t('spec 11 passes on 27 Oct', () => assert.strictEqual(validateSpec(clone(S11), NOW), true));
t('spec 11 names VMS-01, VMS-02, VMS-03 and no day as a reference', () => assert.deepStrictEqual(refsOf(S11), ['VMS-01', 'VMS-02', 'VMS-03']));
t('a sub_move still names both references', () => assert.deepStrictEqual(refsOf({ops: [{op: 'sub_move', from: 'WC09', to: 'WC51', no: '0123', co: 'Event Portables'}]}), ['WC09', 'WC51']));
t('00:00 AEST 22 Oct is 2026-10-21T14:00:00.000Z', () => { assert.strictEqual(aestDay('2026-10-21T14:00:00.000Z'), '2026-10-22'); assert.strictEqual(aestDay('2026-10-21T13:59:59.999Z'), '2026-10-21'); assert.strictEqual(aestDay('2026-10-21T22:08:24.160Z'), '2026-10-22'); });
t('a real day round-trips', () => { assert.ok(realDay('2026-10-22')); assert.ok(!realDay('2026-02-30')); assert.ok(!realDay('2026-10-32')); assert.ok(!realDay('22/10/2026')); assert.ok(!realDay(null)); });
t('spec 11: every light is dated to the AEST day its reference comes in, and each plan correction to that same day', () => {
  for (const a of S11.ops.filter(o => o.op === 'add_ref')) { const l = find(S11, 'light', a.ref); assert.strictEqual(aestDay(l.at), a.from); }
  for (const v of S11.ops.filter(o => o.op === 'vms_arrival')) { const u = S11.ops.find(o => o.op === 'unit_reidentify' && o.label === v.board); assert.strictEqual(find(S11, 'add_ref', u.ref).from, v.day); }
});
t('spec 11: VMS-02 and VMS-03 come in at 00:00 AEST 22 Oct, VMS-01 at its plan time', () => { assert.strictEqual(find(S11, 'light', 'VMS-01').at, '2026-10-21T22:08:24.160Z'); assert.strictEqual(find(S11, 'light', 'VMS-02').at, '2026-10-21T14:00:00.000Z'); assert.strictEqual(find(S11, 'light', 'VMS-03').at, '2026-10-21T14:00:00.000Z'); });
t('spec 11: the plan corrections name docket 26143911', () => S11.ops.filter(o => o.op === 'vms_arrival').forEach(o => assert.ok(/26143911/.test(o.why))));

// ---------------------------------------------------------------------------------------------- dated light (change 2)
refuses('a dated light with no reason', s => { delete find(s, 'light', 'VMS-02').why; }, /dated light needs why/);
refuses('a dated light whose reason names a system', s => { find(s, 'light', 'VMS-02').why = 'set by the agent overnight'; }, /dated light needs why/);
refuses('a dated light reason over 200 characters', s => { find(s, 'light', 'VMS-02').why = 'x'.repeat(201); }, /dated light needs why/);
refuses('a dated light that is not on site', s => { find(s, 'light', 'VMS-02').state = 'in transit'; }, /only an on-site light/);
refuses('a dated light in the future', s => { find(s, 'light', 'VMS-02').at = '2026-10-28T00:00:00.000Z'; }, /in the future/);
refuses('a dated light not in UTC form', s => { find(s, 'light', 'VMS-02').at = '2026-10-22T00:00:00+10:00'; }, /UTC time/);
refuses('a dated light with no time', s => { find(s, 'light', 'VMS-02').at = '2026-10-22'; }, /UTC time/);
passes('a light with no date, as before (any state, no reason needed)', s => { s.ops.push({op: 'light', ref: 'GN10', state: 'in transit'}); });

// ---------------------------------------------------------------------------------------------- add_ref (change 4)
refuses('a trade the runner does not add', s => { find(s, 'add_ref', 'VMS-01').disc = 'Toilets'; }, /trade must be/);
refuses('a VMS board reference with another item type', s => { find(s, 'add_ref', 'VMS-01').type = 'Message board'; }, /item type VMS/);
refuses('a VMS board reference with no number field', s => { delete find(s, 'add_ref', 'VMS-01').no; }, /needs a number/);
refuses('a blank number on any other trade', s => { Object.assign(find(s, 'add_ref', 'VMS-01'), {disc: 'Generators'}); }, /needs a number/);
refuses('a name the page reads as a quantity (x 2)', s => { find(s, 'add_ref', 'VMS-01').name = 'VMS21 board x 2'; }, /reads as a quantity/);
refuses('a name the page reads as a quantity (qty)', s => { find(s, 'add_ref', 'VMS-01').name = 'VMS21 qty 1'; }, /reads as a quantity/);
refuses('a name the page reads as a quantity (2 x)', s => { find(s, 'add_ref', 'VMS-01').name = '2 x VMS21'; }, /reads as a quantity/);
refuses('an in day that is not a real day', s => { find(s, 'add_ref', 'VMS-01').from = '2026-02-30'; }, /from must be a real day/);
refuses('an out day that is not a real day', s => { find(s, 'add_ref', 'VMS-01').to = '2026-11-31'; }, /to must be a real day/);
refuses('an in day after today', s => { find(s, 'add_ref', 'VMS-01').from = '2026-10-28'; }, /after today/);
refuses('an out day before the in day', s => { find(s, 'add_ref', 'VMS-01').to = '2026-10-21'; }, /to is before from/);
refuses('an in day that is not the AEST day of the arrival (22 Oct 00:00 AEST is not 21 Oct)', s => { find(s, 'add_ref', 'VMS-02').from = '2026-10-21'; }, /not the AEST day of its arrival/);
refuses('a reference added twice', s => { s.ops.push(clone(find(s, 'add_ref', 'VMS-03'))); }, /added twice/);
refuses('a note that names a system', s => { find(s, 'add_ref', 'VMS-03').note = 'Added by the agent.'; }, /note under 200/);
passes('an out day on or after the in day', s => { find(s, 'add_ref', 'VMS-01').to = '2026-10-27'; });
passes('an add_ref with no days, as before', s => { const a = find(s, 'add_ref', 'VMS-01'); delete a.from; });

// ---------------------------------------------------------------------------------------------- unit_reidentify (change 3)
refuses('a Premiair VMS board labelled VMS-21', s => { find(s, 'unit_reidentify', 'VMS-01').label = 'VMS-21'; }, /register name/);
refuses('a Premiair VMS board labelled VMS 21', s => { find(s, 'unit_reidentify', 'VMS-01').label = 'VMS 21'; }, /register name/);
refuses('a Premiair VMS board labelled with its reference (VMS-01)', s => { find(s, 'unit_reidentify', 'VMS-01').label = 'VMS-01'; }, /register name/);
refuses('a Premiair VMS board with no label', s => { delete find(s, 'unit_reidentify', 'VMS-01').label; }, /register name/);
refuses('a label with other characters', s => { find(s, 'unit_reidentify', 'VMS-01').label = 'VMS21/97T'; }, /label: letters/);
refuses('a unit note over 200 characters', s => { find(s, 'unit_reidentify', 'VMS-01').note = 'n'.repeat(201); }, /note under 200/);
refuses('a unit note that names a system', s => { find(s, 'unit_reidentify', 'VMS-01').note = 'per the model'; }, /note under 200/);
passes('a Coates unit with no label, as before', s => { s.ops.push({op: 'unit_reidentify', ref: 'GN10', no: '1283681', item: '20kva'}); });

// ---------------------------------------------------------------------------------------------- vms_arrival (new op)
refuses('a plan correction with no position', s => { find(s, 'vms_arrival', '22').pos = 'X1'; }, /VMS plan position/);
refuses('a plan correction with the board misnamed', s => { find(s, 'vms_arrival', '22').board = 'VMS-22'; }, /board name/);
refuses('a plan correction to an earlier day', s => { find(s, 'vms_arrival', '22').day = '2026-10-20'; }, /must be after/);
refuses('a plan correction to the same day', s => { find(s, 'vms_arrival', '22').day = '2026-10-21'; }, /must be after/);
refuses('a plan correction to a day after today', s => { find(s, 'vms_arrival', '22').day = '2026-10-28'; }, /after today/);
refuses('a plan correction from a day that is not real', s => { find(s, 'vms_arrival', '22').was = '2026-10-32'; }, /real day/);
refuses('a plan correction with no reason', s => { delete find(s, 'vms_arrival', '22').why; }, /needs why/);
refuses('a plan correction whose reason names a system', s => { find(s, 'vms_arrival', '22').why = 'agent correction'; }, /needs why/);
refuses('a plan correction to a day other than its reference\'s in day', s => { find(s, 'vms_arrival', '22').day = '2026-10-23'; }, /is not VMS-02's in day 2026-10-22/);
refuses('a position corrected twice', s => { s.ops.push(clone(find(s, 'vms_arrival', '24'))); }, /corrected twice/);
passes('a plan correction on its own (no reference in the spec)', s => { s.ops = s.ops.filter(o => o.op === 'vms_arrival'); });

// ---------------------------------------------------------------------------------------------- spec.expect (change 9)
refuses('expect that is not an object', s => { s.expect = 'none'; }, /spec\.expect must be/);
refuses('expect with no cost delta', s => { s.expect = {chargeDelta: 0}; }, /spec\.expect must be/);
refuses('expect with a delta as text', s => { s.expect = {chargeDelta: '0', costDelta: 0}; }, /spec\.expect must be/);
refuses('expect with another key', s => { s.expect = {chargeDelta: 0, costDelta: 0, labour: 0}; }, /spec\.expect must be/);
passes('no expect, as before', s => { delete s.expect; });
refuses('a person named with a suffix', s => { s.by = 'Andrew Fisher via the office'; }, /no agent suffix/);

// ---------------------------------------------------------------------------------------------- the command line
t('--check-spec passes spec 11 and stops before any page or service', () => {
  const r = spawnSync(process.execPath, [RUNNER, '--spec', path.join(HERE, 'left_site_spec_11_vms_refs.json'), '--check-spec'], {encoding: 'utf8', timeout: 20000, env: Object.assign({}, process.env, {GC500_EDIT_TOKEN: ''})});
  assert.strictEqual(r.status, 0, r.stderr); assert.match(r.stdout, /29 op\(s\) pass the checks - references VMS-01, VMS-02, VMS-03 · VMS plan positions 22, 24/); assert.match(r.stdout, /No page opened/);
});
t('--check-spec refuses a faulty spec with its reason', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'left-site-spec-')), f = path.join(dir, 'bad.json'), s = clone(S11); find(s, 'add_ref', 'VMS-02').from = '2026-10-21'; fs.writeFileSync(f, JSON.stringify(s));
  try { const r = spawnSync(process.execPath, [RUNNER, '--spec', f, '--check-spec'], {encoding: 'utf8', timeout: 20000}); assert.notStrictEqual(r.status, 0); assert.match(r.stderr, /VMS-02: from 2026-10-21 is not the AEST day of its arrival/); }
  finally { fs.rmSync(dir, {recursive: true, force: true}); }
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
