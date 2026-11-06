// Author: Andrew Fisher. v11.87 rules: the team messages follow the live shared servicing rules, word for word.
//   PAGE=build/GC500_v11.87/GC500_Delivery_Control_hosted.html BASE=build/GC500_v11.87/base_live.html node tests/test_rules1187.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const dir = path.resolve(__dirname, '..'), page = fs.readFileSync(process.env.PAGE, 'utf8'), base = fs.readFileSync(process.env.BASE, 'utf8');
function extract(src, a, b) { const i = src.indexOf(a), j = src.indexOf(b, i); assert(i >= 0 && j > i, 'missing ' + a); return src.slice(i, j + b.length); }
let checks = 0; const check = (ok, msg) => { assert(ok, msg); checks++; };

// 1. The page is the live v11.86 page plus one style, one script and the footer: nothing else moved.
const block = extract(page, '<style id="teams1187-style">', '<script id="steady1143-script">');
const back = page.replace(block, '<script id="steady1143-script">').replace("+' · v11.87'; /* v8.19 release922", "+' · v11.86'; /* v8.19 release922");
check(back === base, 'the build is the live page plus the v11.87 block and footer only');
const src = fs.readFileSync(path.join(dir, 'teams1187_src.js'), 'utf8');
check(block.includes(src) && block.includes(fs.readFileSync(path.join(dir, 'teams1187.css'), 'utf8')), 'the page carries this folder\'s source exactly');
check(!/0[45]\d{2}\s?\d{3}\s?\d{3}|\+614\d{8}/.test(block), 'no phone number in the page block');

// 2. The shared rules, extracted from the page itself.
const helperCtx = {module: {exports: {}}}; vm.runInNewContext(extract(page, 'var SvcCrews1173 =', 'module.exports=SvcCrews1173;'), helperCtx);
const Crew = helperCtx.module.exports;
const stateCtx = {module: {exports: {}}, SvcCrews1173: Crew}; vm.runInNewContext(extract(page, 'var SvcState = (function () {', 'module.exports = SvcState;'), stateCtx);
const S = stateCtx.module.exports;
const card = JSON.parse(extract(page, 'var SVC1067_CARD=', ';\n').slice(17, -2)).data;
const live = JSON.parse(extract(page, 'var SVC1067_DATA=', ';\n').slice('var SVC1067_DATA='.length, -2));
const tCtx = {module: {exports: {}}, SvcCrews1173: Crew, SVC1067_CARD: {data: card}};
vm.runInNewContext(src, tCtx); const T = tCtx.module.exports;

// 3. The five crews and their two people, as the crew card's selector reads.
const groups = T.crews(card);
check(groups.map(g => g.id).join() === 'cleaners,pump1,pump2,pump3,water', 'five crew groups in the crew card order');
const ppl = groups.map(g => T.people(g.label));
check(ppl.every(p => p.names.length === 2 && p.role), 'every crew has a role and two people');
check(ppl[0].role === 'Cleaners' && ppl[1].role === 'Pump truck' && ppl[4].role === 'Water truck', 'roles read from the labels');
check(T.people('Pump truck — AJ & Kelly').both === 'AJ & Kelly' && T.people('Solo').names.length === 0, 'names parsed; a label without names stays safe');

// 4. A small tracker with the live plans and tasks: night and final.
const D = {tasks: live.tasks, plans: live.plans, extras: live.extras, groups: live.groups,
  days: [{id: '2026-10-23', label: 'Fri 23', plan: 'night'}, {id: '2026-10-24', label: 'Sat 24', plan: 'night'}, {id: '2026-10-25', label: 'Sun 25', plan: 'final'}],
  areas: [{n: 1, name: 'Pit Lane, Paddock & Teams', refs: [{ref: 'WC12', lines: [{id: 'WC12-FWF', kind: 'fwf', label: '4 × FWF', qty: 4}]}, {ref: 'WC16', lines: [{id: 'WC16-TB', kind: 'sewer', label: 'Toilet block', qty: 2}]}]},
    {n: 3, name: 'Island West — EVL, Race Admin & Merch', refs: [{ref: 'WC07', lines: [{id: 'WC07-FWF', kind: 'fwf', qty: 20}]}, {ref: 'T0024', lines: [{id: 'T0024-A', kind: 'fwf', qty: 1}, {id: 'T0024-B', kind: 'access', qty: 1}]}]},
    {n: 0, name: 'No location yet', refs: [{ref: 'WC100', lines: [{id: 'WC100-T', kind: 'tank', qty: 2}]}]}]};
const sat = '2026-10-24', at = (h) => Date.parse('2026-10-24T' + h + ':00+10:00');
const tick = (id, line, task, extra = {}) => Object.assign({id, line, task, day: sat, done: true, at: '2026-10-24T21:00:00+10:00', tapped_at: '2026-10-24T21:00:00+10:00'}, extra);
const M = (events, now = at('22:00'), day = sat) => ({D, S, events, now, day, operational1160: true});

const pumpEmpty = T.plan(M([]), 'pump1');
check(pumpEmpty.kinds.join() === 'pump' && pumpEmpty.places === 4 && pumpEmpty.jobs === 5, 'pump trucks: every pump out (FWF, access, tank), not the sewer block');
check(T.plan(M([]), 'cleaners').places === 4 && T.plan(M([]), 'cleaners').kinds.join() === 'clean', 'cleaners: clean & restock on blocks and FWFs, not tanks');
check(T.plan(M([]), 'water').places === 3 && T.plan(M([]), 'water').kinds.join() === 'refill', 'water truck: water check on FWFs only');
check(!pumpEmpty.closed && pumpEmpty.started && pumpEmpty.dayLabel === 'Sat 24 night', 'open night labelled');

const ev = [tick('a', 'WC12-FWF', 'pump', {crew_group: 'pump2'}), tick('b', 'WC07-FWF', 'pump', {crew_group: 'pump1'}), tick('c', 'WC07-FWF', 'clean', {crew_group: 'cleaners'}),
  tick('d', 'T0024-A', 'pump', {crew_group: 'pump1', local: true}), tick('e', 'WC100-T', 'pump'), {id: 'u', line: 'WC100-T', task: 'pump', day: sat, done: false, undoes: ['e']},
  tick('f', 'T0024-B', 'pump'), {id: 'v', voids: ['f']}];
const p1 = T.plan(M(ev), 'pump1');
check(p1.places === 2 && p1.areas.map(a => a.refs.map(r => r.ref).join()).join('|') === 'T0024|WC100', 'pump: done jobs drop off; a pending phone tick, an undone tick and a voided tick still count as missing');
check(p1.doneRefs === 1 && T.plan(M(ev), 'pump2').doneRefs === 1 && T.plan(M(ev), 'pump3').doneRefs === 0, 'each pump truck credited only with the places its own group saved');
check(p1.areas[0].refs[0].qty === 2 && p1.areas[1].refs[0].qty === 2, 'a place carries the units still waiting (two lines at T0024, two tanks at WC100)');
const sum = S.taskStats(D, D.areas.flatMap(a => a.refs), sat, Object.fromEntries(Object.entries(S.jobStates(ev, at('22:00'))).filter(([, s]) => !s.local)));
check(sum.pump.d === 24 && sum.pump.w === 28, 'the panel meter for the same reading: 24 of 28 pump-out units');

// 5. Closed nights say missed; the final night carries the lock-up for pump trucks and cleaners, none for water.
const fri = T.plan(M([], at('22:00'), '2026-10-23'), 'water');
check(fri.closed && fri.dayLabel === 'Fri 23 night', 'a past night is closed (after 08:00 the next day)');
const sun = Date.parse('2026-10-25T22:00:00+10:00');
const fin = T.plan(M([], sun, '2026-10-25'), 'pump3');
check(fin.kinds.sort().join() === 'lockup,pump' && T.plan(M([], sun, '2026-10-25'), 'cleaners').kinds.sort().join() === 'clean,lockup', 'final night: lock-up for pump trucks and cleaners');
check(T.plan(M([], sun, '2026-10-25'), 'water').jobs === 0, 'final night: no water jobs');

// 6. The words.
const team = T.people(groups[1].label), sign = {sign: 'Andrew'};
const open = T.compose(pumpEmpty, team, sign);
check(open.startsWith('Hi AJ & Kelly - GC500 servicing, Sat 24 night. Still to do - pump out (4 places):'), 'open-night opening line');
check(open.includes('Area 1 Pit Lane: WC12 x4') && open.includes('Area 3 Island West: WC07 x20, T0024 x2') && open.includes('No area yet: WC100 x2'), 'places under their areas with units');
check(open.endsWith('Please get to these and scan the QR at each one when done. Thanks, Andrew'), 'open-night closing line');
const missed = T.compose(fri, T.people(groups[4].label), sign);
check(missed.startsWith('Hi Kim & Chad - GC500 servicing. Missed on Fri 23 night - water check & refill (3 places):') && missed.includes('Please make sure these are looked after.'), 'closed night says missed');
check(T.compose(T.plan(M(['WC12-FWF', 'WC07-FWF', 'T0024-A', 'T0024-B'].map((l, i) => tick('r' + i, l, 'refill'))), 'water'), T.people(groups[4].label), sign) ===
  'Hi Kim & Chad - GC500 servicing, Sat 24 night: all your water check & refill is done. Great work, thank you. Andrew', 'nothing left: a thank-you');
check(T.compose(T.plan(M([], sun, '2026-10-25'), 'water'), T.people(groups[4].label), sign).includes('no jobs for your crew'), 'no jobs: says so');
check(T.compose(fin, T.people(groups[3].label), sign).includes('pump out, final lock-up'), 'final-night words');
const only3 = T.compose(pumpEmpty, team, {areas: [3], sign: 'Andrew'});
check(only3.includes('(2 places)') && !only3.includes('WC12') && only3.includes('WC07'), 'unticked areas leave the message and the count');
check(T.compose(pumpEmpty, team, {sign: 'Kyle'}).endsWith('Thanks, Kyle'), 'signed with the name typed on this phone');

// 7. Never longer than the service takes, always plain text; long lists fold, never cut mid-place.
const bigAreas = Array.from({length: 14}, (_, i) => ({n: i + 1, name: 'Main Beach Seaside — Mid-South number ' + (i + 1), refs: Array.from({length: 6}, (_, k) => ({ref: 'WC' + (10 + i * 6 + k), lines: [{id: 'L' + i + '-' + k, kind: 'fwf', qty: 3}]}))}));
const big = T.plan({D: Object.assign({}, D, {areas: bigAreas}), S, events: [], now: at('22:00'), day: sat, operational1160: true}, 'cleaners');
const folded = T.compose(big, T.people(groups[0].label), sign);
check(folded.length <= T.MAX && folded.length > 300, 'a long list folds to fit 480 characters (' + folded.length + ')');
check(/\+ \d+ more in Area/.test(folded) && folded.includes('(84 places)') && folded.endsWith('Thanks, Andrew'), 'folded list says how many more and where, keeps the count and the sign-off');
check(folded.split('\n').every(l => !/WC\d*$/.test(l) || /WC\d+$/.test(l)), 'no place cut in half');
check(T.areaList([{n: 4}, {n: 5}, {n: 6}, {n: 9}, {n: 11}, {n: 12}, {n: 0}]) === 'Areas 4-6, 9, 11, 12 and no area yet' && T.areaList([{n: 7}]) === 'Area 7', 'the rest named as compact area ranges');
check((folded.match(/^Area \d+/gm) || []).length >= 3, 'a folded list still shows whole areas first (' + (folded.match(/^Area \d+/gm) || []).length + ')');
for (const g of groups) for (const day of ['2026-10-23', sat, '2026-10-25']) {
  const t = T.compose(T.plan(M(ev, sun, day), g.id), T.people(g.label), sign);
  check(t.length <= T.MAX && /^[\n\x20-\x7e]*$/.test(t), g.id + ' ' + day + ' fits and is plain text');
}

// 8. The card: event tracker only, escaped, one row and one button per crew with jobs.
check(T.cardHtml(Object.assign(M([]), {operational1160: false}), card) === '' && T.cardHtml(Object.assign(M([]), {example: true}), card) === '', 'no card on a test tracker or the example');
const html = T.cardHtml(M(ev), card);
check((html.match(/data-teams1187="/g) || []).length === 5 && html.includes('Message the teams') && html.includes('Sat 24 night · still to do'), 'five buttons and the night');
check(html.includes('<b>2</b> still to do · pump out') && html.includes('1 done tonight'), 'counts and the crew\'s own done places');
check(html.includes('data-svc1102-key="panel-teams1187"') && html.includes('data-svc1102-key="teams1187-pump1"'), 'keyed for the panel reconciler');
const dirty = JSON.parse(JSON.stringify(card)); dirty.crewGroups[0].label = 'Cleaners — <img src=x onerror=alert(1)> & Bob';
check(!T.cardHtml(M([]), dirty).includes('<img src=x') && T.cardHtml(M([]), dirty).includes('&lt;img'), 'labels escaped');
check(T.cardHtml(M([], sun, '2026-10-25'), card).includes('No jobs on this night') && (T.cardHtml(M([], sun, '2026-10-25'), card).match(/data-teams1187="/g) || []).length === 4, 'final night: water has no jobs and no button');

// 9. Numbers and the phone's own Messages.
check(T.number('0491 570 157') === '+61491570157' && T.mobile('+61491570157') && !T.mobile(T.number('07 5550 1234')), 'Australian mobiles only');
check(T.smsLink(['+61491570006', '+61491570156'], 'a b', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)') === 'sms:/open?addresses=+61491570006,+61491570156&body=a%20b', 'iPhone group link');
check(T.smsLink(['+61491570006', '+61491570156'], 'a b', 'Mozilla/5.0 (Linux; Android 14)') === 'sms:+61491570006,+61491570156?body=a%20b', 'other phones comma list');
check(T.smsLink([], 'x', '') === 'sms:?&body=x', 'no numbers: the words only');

console.log(JSON.stringify({checks, folded: folded.length, sample: open}));
