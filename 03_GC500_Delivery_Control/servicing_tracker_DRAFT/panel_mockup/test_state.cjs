/* Author: Andrew Fisher. Unit tests for the servicing tracker's shared state rule (state.js). Plain node, no packages:
     node test_state.cjs
   Uses the real data (../tracker_data.json) for the totals, and checks state.js against the crew card's own copy of
   the rule in ../card/card_src.js (its jobStates/refStats/groupStats/tasksFor/svcDay/autoDay, lifted out by name and
   run on the same random tick logs), so the panel and the card cannot drift apart. Nothing here touches a service. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const S = require('./state.js');
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tracker_data.json'), 'utf8'));
const CFG = { plans: DATA.plans, days: DATA.days };
const ALL = [].concat(...DATA.areas.map(a => a.refs));
const REF = Object.fromEntries(ALL.map(r => [r.ref, r]));
const LINE = Object.fromEntries([].concat(...ALL.map(r => r.lines.map(l => [l.id, Object.assign({ ref: r.ref }, l)]))));
const AREA = Object.fromEntries(DATA.areas.map(a => [a.n, a]));
const [THU, FRI, SAT, SUN] = DATA.days.map(d => d.id);
const T = (s) => Date.parse(s);                       // '2026-10-23T21:00:00+10:00'
const ISO = (ms) => new Date(ms).toISOString();

let pass = 0, fail = 0; const fails = [];
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS ' + name); }
  else { fail++; fails.push(name); console.log('FAIL ' + name + ' :: ' + JSON.stringify(detail === undefined ? null : detail).slice(0, 500)); }
}
const section = t => console.log('\n== ' + t);
let idn = 0;
function tick(line, task, day, tapped, at, extra) {
  const l = LINE[line]; if (!l) throw new Error('no line ' + line);
  return Object.assign({ id: 'id' + String(++idn).padStart(16, '0'), seq: idn, ref: l.ref, line, task, day, done: true, undoes: [],
    at: ISO(at == null ? T(tapped) : (typeof at === 'number' ? at : T(at))), tapped_at: tapped == null ? null : ISO(T(tapped)) }, extra || {});
}
function untick(of, tapped, at) {
  const ids = Array.isArray(of) ? of : [of]; const t0 = ids[0];
  return { id: 'id' + String(++idn).padStart(16, '0'), seq: idn, ref: t0.ref, line: t0.line, task: t0.task, day: t0.day, done: false,
    undoes: ids.map(x => x.id), at: ISO(T(at || tapped)), tapped_at: ISO(T(tapped)) };
}
function stats(events, refs, day, nowMs) { return S.groupStats(CFG, refs, day, S.jobStates(events, nowMs)); }
const NOW = T('2026-10-25T01:40:00+10:00');            // Sat 24's service day, 01:40 Sunday morning

section('the data the rule runs on');
check('75 references, 83 lines, 263 units, 14 areas', ALL.length === 75 && Object.keys(LINE).length === 83 &&
  ALL.reduce((n, r) => n + r.lines.reduce((m, l) => m + l.qty, 0), 0) === 263 && DATA.areas.length === 14);
const empty = DATA.days.map(d => stats([], ALL, d.id, NOW));
check('weighted jobs: 760 on Thu/Fri/Sat, 777 on Sun', empty.map(s => s.w).join() === '760,760,760,777', empty.map(s => s.w));
check('263 units every day, 0 serviced, 0 of 75 locations, 0%, not finished', empty.every(s => s.units === 263 && s.unitsDone === 0 && s.refs === 75 && s.refsDone === 0 && s.pct === 0 && s.finished === 0));
check('FWF plan: night = Pumped out, Fresh water refilled, Cleaned & restocked', S.tasksFor(CFG, LINE['WC07-FWF'], SAT).map(t => DATA.tasks[t]).join(' | ') === 'Pumped out | Fresh water refilled | Cleaned & restocked');
check('FWF plan: Sunday = Pumped out, Cleaned & restocked, Locked & confirmed empty (no water)', S.tasksFor(CFG, LINE['WC07-FWF'], SUN).map(t => DATA.tasks[t]).join(' | ') === 'Pumped out | Cleaned & restocked | Locked & confirmed empty');
check('toilet block: Pumped out + Cleaned & restocked; Sunday adds the lock', S.tasksFor(CFG, LINE['WC20-TOILETBL'], FRI).join() === 'pump,clean' && S.tasksFor(CFG, LINE['WC20-TOILETBL'], SUN).join() === 'pump,clean,lock');
check('waste tank: Pumped out only, Sunday too', S.tasksFor(CFG, LINE['WC20-WASTETAN'], FRI).join() === 'pump' && S.tasksFor(CFG, LINE['WC20-WASTETAN'], SUN).join() === 'pump');
check('a day not configured has no jobs', S.tasksFor(CFG, LINE['WC07-FWF'], '2026-10-26').length === 0);

section('a job is done while an uncancelled done:true tick exists');
{
  const a = tick('WC07-FWF', 'pump', SAT, '2026-10-24T21:10:00+10:00');
  const st = S.jobStates([a], NOW);
  check('one tick: done at its tapped_at', S.jobAt(st, 'WC07-FWF', 'pump', SAT) === T('2026-10-24T21:10:00+10:00'));
  check('other tasks of that line stay not done', S.jobAt(st, 'WC07-FWF', 'water', SAT) === 0 && S.jobAt(st, 'WC07-FWF', 'clean', SAT) === 0);
  check('another day stays not done', S.jobAt(st, 'WC07-FWF', 'pump', FRI) === 0);
}
{
  const late = tick('WC09-FWF', 'water', SAT, '2026-10-24T23:05:00+10:00', '2026-10-24T23:41:00+10:00');   // phone offline, sent later
  const first = tick('WC09-FWF', 'water', SAT, '2026-10-24T23:20:00+10:00');
  const st = S.jobStates([first, late], NOW);
  check('the earliest uncancelled tapped_at wins, not the first to arrive', S.jobAt(st, 'WC09-FWF', 'water', SAT) === T('2026-10-24T23:05:00+10:00'));
}
{
  const ahead = tick('WC09-FWF', 'pump', SAT, '2026-10-24T22:50:00+10:00', '2026-10-24T22:40:00+10:00');   // phone clock fast
  check('never later than its server at', S.jobAt(S.jobStates([ahead], NOW), 'WC09-FWF', 'pump', SAT) === T('2026-10-24T22:40:00+10:00'));
  const noTap = tick('WC09-FWF', 'clean', SAT, null, '2026-10-24T22:41:00+10:00');
  check('no usable tapped_at (null): its at', S.jobAt(S.jobStates([noTap], NOW), 'WC09-FWF', 'clean', SAT) === T('2026-10-24T22:41:00+10:00'));
  const junk = Object.assign(tick('WC09-TOILETBL', 'pump', SAT, null, '2026-10-24T22:42:00+10:00'), { tapped_at: 'yesterday' });
  check('an unreadable tapped_at: its at', S.jobAt(S.jobStates([junk], NOW), 'WC09-TOILETBL', 'pump', SAT) === T('2026-10-24T22:42:00+10:00'));
  const local = { id: 'local000000000001', ref: 'WC09', line: 'WC09-TOILETBL', task: 'clean', day: SAT, done: true, undoes: [], tapped_at: ISO(NOW + 3600000), local: true };
  const sl = S.jobStates([local], NOW)[S.jobKey('WC09-TOILETBL', 'clean', SAT)];
  check('never in the future (a phone tick not yet at the service, clock ahead)', sl.at === NOW && sl.local === true);
}

section('unticks name what they cancel');
{
  const a = tick('WC06-FWF' in LINE ? 'WC06-FWF' : 'WC07-FWF', 'pump', SAT, '2026-10-24T22:00:00+10:00');
  const undoA = untick(a, '2026-10-24T22:02:00+10:00', '2026-10-24T22:30:00+10:00');     // phone A, offline, lands late
  const b = tick(a.line, 'pump', SAT, '2026-10-24T22:10:00+10:00');                        // phone B, online, in between
  const st = S.jobStates([a, b, undoA], NOW);
  check("a late untick does not wipe another phone's newer tick (review problem 4)", S.jobAt(st, a.line, 'pump', SAT) === T('2026-10-24T22:10:00+10:00'));
  check('the untick on its own clears the job', S.jobAt(S.jobStates([a, undoA], NOW), a.line, 'pump', SAT) === 0);
  const wrong = Object.assign(untick(a, '2026-10-24T22:03:00+10:00'), { task: 'water' });
  check('an untick naming a tick of a different job cancels nothing', S.jobAt(S.jobStates([a, wrong], NOW), a.line, 'pump', SAT) === T('2026-10-24T22:00:00+10:00'));
  const otherDay = Object.assign(untick(a, '2026-10-24T22:03:00+10:00'), { day: FRI });
  check('an untick for another day cancels nothing', S.jobAt(S.jobStates([a, otherDay], NOW), a.line, 'pump', SAT) === T('2026-10-24T22:00:00+10:00'));
  const re = tick(a.line, 'pump', SAT, '2026-10-24T22:20:00+10:00');
  check('ticked, unticked, ticked again: the new tick time', S.jobAt(S.jobStates([a, undoA, re], NOW), a.line, 'pump', SAT) === T('2026-10-24T22:20:00+10:00'));
  check('order does not matter: the untick listed before its tick still cancels it', S.jobAt(S.jobStates([undoA, a], NOW), a.line, 'pump', SAT) === 0);
}

section('voids from the edit link');
{
  const a = tick('WC07-FWF', 'clean', SAT, '2026-10-24T23:00:00+10:00');
  check('a tick marked voided counts for nothing', S.jobAt(S.jobStates([Object.assign({}, a, { voided: true })], NOW), 'WC07-FWF', 'clean', SAT) === 0);
  check('a voids event sets the named ticks aside', S.jobAt(S.jobStates([a, { voids: [a.id] }], NOW), 'WC07-FWF', 'clean', SAT) === 0);
  const u = untick(a, '2026-10-24T23:01:00+10:00');
  check('a voided untick cancels nothing', S.jobAt(S.jobStates([a, Object.assign({}, u, { voided: true })], NOW), 'WC07-FWF', 'clean', SAT) === T('2026-10-24T23:00:00+10:00'));
}

section('percentages weigh units and round down');
{
  const a5 = AREA[5];       // Median Strip - Race Admin & Merch: WC07 20 FWF + one more location
  const w5 = stats([], a5.refs, SAT, NOW).w;
  const ev = ['pump', 'water', 'clean'].map((t, i) => tick('WC07-FWF', t, SAT, '2026-10-24T21:0' + i + ':00+10:00'));
  const s = stats(ev, a5.refs, SAT, NOW);
  check("WC07's 20 FWF weigh 20 (3 jobs x 20 = 60 of the area's " + w5 + ')', s.d === 60 && s.pct === Math.floor(6000 / w5), s);
  check('WC07 done: 1 location of ' + a5.refs.length + ', 20 units serviced', s.refsDone === 1 && s.unitsDone === 20 && s.finished === 0, s);
  const two = stats(ev.slice(0, 2), a5.refs, SAT, NOW);
  check('two of three jobs done: the units are not serviced yet', two.unitsDone === 0 && two.d === 40, two);
}
{
  // everything but one waste-tank pump-out on Saturday: 759 of 760 -> 99, never 100
  const evs = [];
  ALL.forEach(r => r.lines.forEach(l => S.tasksFor(CFG, l, SAT).forEach(t => { if (!(l.id === 'WC05-WASTETAN' && t === 'pump')) evs.push(tick(l.id, t, SAT, '2026-10-24T23:00:00+10:00')); })));
  const s = stats(evs, ALL, SAT, NOW);
  check('759 of 760 shows 99%, not finished', s.d === 759 && s.w === 760 && s.pct === 99 && s.finished === 0, s);
  check('262 of 263 units, 74 of 75 locations', s.unitsDone === 262 && s.refsDone === 74, s);
  const last = tick('WC05-WASTETAN', 'pump', SAT, '2026-10-25T00:47:00+10:00');
  const s2 = stats(evs.concat([last]), ALL, SAT, NOW);
  check('the last job: 100%, finished at its time (00:47)', s2.pct === 100 && s2.finished === T('2026-10-25T00:47:00+10:00') && S.hm(s2.finished) === '00:47', s2);
  const area3 = stats(evs.concat([last]), AREA[3].refs, SAT, NOW);
  check('the area finished time is the latest done time of its jobs', area3.finished === T('2026-10-25T00:47:00+10:00'));
  const area1 = stats(evs, AREA[1].refs, SAT, NOW);
  check('an area all done before that is finished at its own last job', area1.pct === 100 && area1.finished === T('2026-10-24T23:00:00+10:00'));
}
{
  // rounding down, integer exact, for every total the data can make and beyond
  let bad = null;
  for (let w = 1; w <= 2000 && !bad; w++) for (let d = 0; d <= w; d++) {
    const want = (100 * d - (100 * d) % w) / w;
    if (S.pct(d, w) !== want) { bad = { d, w, got: S.pct(d, w), want }; break; }
    if (d < w && S.pct(d, w) === 100) { bad = { d, w, hundred: true }; break; }
  }
  check('pct = floor(100 d / w) exactly for every d <= w <= 2000, and 100 only when d = w', !bad, bad);
  check('pct of nothing is 0', S.pct(0, 0) === 0);
}
{
  // Sunday: a water tick is not a job and counts for nothing; the lock is a job
  const evs = [tick('WC07-FWF', 'water', SUN, '2026-10-25T21:00:00+10:00', '2026-10-25T21:00:00+10:00')];
  const now = T('2026-10-25T23:00:00+10:00');
  check('Sunday: a Fresh water refilled tick is not a job', stats(evs, ALL, SUN, now).d === 0);
  const lock = tick('WC07-FWF', 'lock', SUN, '2026-10-25T21:30:00+10:00');
  check('Sunday: Locked & confirmed empty counts (20 of 777)', stats([lock], ALL, SUN, now).d === 20);
}

section('days run 08:00 to 08:00, Gold Coast time');
check('Fri 23 07:59:59 is still Thursday 22', S.svcDay(T('2026-10-23T07:59:59+10:00')) === THU);
check('Fri 23 08:00:00 is Friday 23', S.svcDay(T('2026-10-23T08:00:00+10:00')) === FRI);
check('Sat 24 03:00 is Friday 23', S.svcDay(T('2026-10-24T03:00:00+10:00')) === FRI);
check('dayStart(Sat 24) = Sat 24 08:00 AEST', S.dayStart(SAT) === T('2026-10-24T08:00:00+10:00'));
check('before the event the chooser opens on Friday (Thursday is only in case)', S.autoDay(CFG, T('2026-10-18T09:00:00+10:00')) === FRI);
check('Thu 22 07:59 still opens on Friday; from Thu 22 08:00 to Fri 23 08:00 it is Thursday\'s ("if needed") service', S.autoDay(CFG, T('2026-10-22T07:59:00+10:00')) === FRI && S.autoDay(CFG, T('2026-10-22T20:00:00+10:00')) === THU && S.autoDay(CFG, T('2026-10-23T08:00:00+10:00')) === FRI);
check('Sun 25 01:40 opens on Saturday 24', S.autoDay(CFG, NOW) === SAT);
check('Mon 26 07:59 is still Sunday 25; after the event it stays on Sunday', S.autoDay(CFG, T('2026-10-26T07:59:00+10:00')) === SUN && S.autoDay(CFG, T('2026-10-27T12:00:00+10:00')) === SUN);
check('a day after the current one is not open', !S.dayOpen(SUN, NOW) && S.dayOpen(SAT, NOW) && S.dayOpen(FRI, NOW));
check('hh:mm is Brisbane time', S.hm(T('2026-10-24T13:05:00Z')) === '23:05');

section('the same answer whatever order the ticks arrive in (random logs)');
function rng(seed) { let x = seed >>> 0; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
function randomLog(r, n) {
  const lines = Object.keys(LINE), out = [];
  for (let i = 0; i < n; i++) {
    const roll = r();
    if (roll < 0.18 && out.length) {               // untick some earlier ticks of one job
      const done = out.filter(e => e.done === true); if (!done.length) continue;
      const t = done[Math.floor(r() * done.length)];
      const same = done.filter(e => e.line === t.line && e.task === t.task && e.day === t.day && r() < 0.7);
      out.push(untick(same.length ? same : [t], ISO(Date.parse(t.tapped_at || t.at) + Math.floor(r() * 3600000))));
    } else if (roll < 0.22 && out.length) {
      const t = out[Math.floor(r() * out.length)]; out.push({ voids: [t.id] });
    } else {
      const l = LINE[lines[Math.floor(r() * lines.length)]];
      const day = DATA.days[Math.floor(r() * 4)].id;
      const ts = S.tasksFor(CFG, l, day).concat(r() < 0.05 ? ['water'] : []);
      const base = S.dayStart(day) + Math.floor(r() * 24 * 3600000);
      const at = base + Math.floor(r() * 2 * 3600000);
      const tapped = r() < 0.1 ? null : base + Math.floor((r() - 0.3) * 3600000);
      const e = tick(l.id, ts[Math.floor(r() * ts.length)], day, tapped == null ? null : ISO(tapped), at);
      if (r() < 0.03) e.voided = true;
      out.push(e);
    }
  }
  return out;
}
function shuffle(r, a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function summary(events, nowMs) {
  const st = S.jobStates(events, nowMs), out = {};
  for (const k of Object.keys(st)) out[k] = st[k].at;
  return JSON.stringify(Object.keys(out).sort().map(k => [k, out[k]]));
}
{
  const r = rng(20261018); let diff = null;
  for (let run = 0; run < 300 && !diff; run++) {
    const log = randomLog(r, 20 + Math.floor(r() * 200)), now = S.dayStart(SUN) + 30 * 3600000;
    const a = summary(log, now), b = summary(shuffle(r, log), now);
    if (a !== b) diff = { run, a: a.slice(0, 200), b: b.slice(0, 200) };
  }
  check('300 random logs: shuffled arrival order gives the same job states and times', !diff, diff);
}

section("the crew card's copy of the rule gives the same answers");
const CARD = path.join(__dirname, '..', 'card', 'card_src.js');
function lift(src, name) {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) return null;
  let depth = 0, j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) { const c = src[k]; if (c === '{') depth++; else if (c === '}') { depth--; if (depth === 0) return src.slice(i, k + 1); } }
  return null;
}
if (!fs.existsSync(CARD)) {
  check('card_src.js is there to compare with', false, CARD);
} else {
  const src = fs.readFileSync(CARD, 'utf8');
  const names = ['svcDay', 'dayOf', 'autoDay', 'tasksFor', 'jobKey', 'jobStates', 'refStats', 'groupStats'];
  const bodies = names.map(n => lift(src, n));
  check('the card has all eight rule functions (' + names.join(', ') + ')', bodies.every(Boolean), names.filter((n, i) => !bodies[i]));
  if (bodies.every(Boolean)) {
    const ctx = { HOUR: 3600000, PLANS: DATA.plans, DAYS: DATA.days, DAY_IDS: DATA.days.map(d => d.id),
      FIRST_REAL: (DATA.days.filter(d => !d.ifNeeded)[0] || DATA.days[0]).id };
    vm.createContext(ctx);
    vm.runInContext(bodies.join('\n') + '\nthis.C = {svcDay, autoDay, tasksFor, jobStates, refStats, groupStats};', ctx);
    const C = ctx.C;
    const r = rng(1063); let diff = null;
    const groups = [ALL].concat(DATA.areas.map(a => a.refs)).concat(ALL.map(x => [x]));
    for (let run = 0; run < 250 && !diff; run++) {
      const log = randomLog(r, 30 + Math.floor(r() * 400));
      if (r() < 0.2) log.push({ id: 'local' + run + 'xxxxxxxxxxxx', ref: 'WC07', line: 'WC07-FWF', task: 'pump', day: SAT, done: true, undoes: [], tapped_at: ISO(NOW + 999999), local: true });
      const now = S.dayStart(DATA.days[Math.floor(r() * 4)].id) + Math.floor(r() * 30 * 3600000);
      const mine = S.jobStates(log, now), theirs = C.jobStates(log, now);
      const a = JSON.stringify(Object.keys(mine).sort().map(k => [k, mine[k].at, mine[k].local, mine[k].ids.slice().sort()]));
      const b = JSON.stringify(Object.keys(theirs).sort().map(k => [k, theirs[k].at, theirs[k].local, theirs[k].ids.slice().sort()]));
      if (a !== b) { diff = { run, what: 'jobStates' }; break; }
      for (const d of DATA.days) {
        for (const g of groups) {
          const x = S.groupStats(CFG, g, d.id, mine), y = C.groupStats(g, d.id, theirs);
          const same = x.w === y.w && x.d === y.d && x.pct === y.pct && x.finished === y.finished && x.refsDone === y.refsDone && x.refs === y.refs;
          if (!same) { diff = { run, day: d.id, group: g.map(q => q.ref).slice(0, 3), mine: x, card: y }; break; }
        }
        if (diff) break;
        for (const ref of ALL) {
          const x = S.refStats(CFG, ref, d.id, mine), y = C.refStats(ref, d.id, theirs);
          if (x.w !== y.w || x.d !== y.d || x.done !== y.done || x.last !== y.last || x.pending !== y.pending) { diff = { run, ref: ref.ref, mine: x, card: y }; break; }
        }
        if (diff) break;
      }
      if (!diff) for (let k = 0; k < 20; k++) {
        const ms = S.dayStart(THU) - 48 * 3600000 + Math.floor(r() * 8 * 24 * 3600000);
        if (S.svcDay(ms) !== C.svcDay(ms) || S.autoDay(CFG, ms) !== C.autoDay(ms)) { diff = { run, ms, what: 'day' }; break; }
      }
    }
    check('250 random logs x 4 days x (everything, 14 areas, 75 references): same jobs, times, %, finish times, locations', !diff, diff);
  }
}

console.log('\n' + pass + ' passed, ' + fail + ' failed' + (fail ? ' :: ' + fails.join(' | ') : ''));
process.exit(fail ? 1 : 0);
