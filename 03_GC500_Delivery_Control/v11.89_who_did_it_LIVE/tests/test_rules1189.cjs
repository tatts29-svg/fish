// Author: Andrew Fisher. v11.89 rules: who did it is only what each completion carries; nothing is guessed.
//   PAGE=build/GC500_v11.89/GC500_Delivery_Control_hosted.html BASE=build/GC500_v11.89/base_live.html node tests/test_rules1189.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const dir = path.resolve(__dirname, '..'), page = fs.readFileSync(process.env.PAGE, 'utf8'), base = fs.readFileSync(process.env.BASE, 'utf8');
function extract(src, a, b) { const i = src.indexOf(a), j = src.indexOf(b, i); assert(i >= 0 && j > i, 'missing ' + a); return src.slice(i, j + b.length); }
let checks = 0; const check = (ok, msg) => { assert(ok, msg); checks++; };

const block = extract(page, '<style id="who1189-style">', '<script id="steady1143-script">');
check(page.replace(block, '<script id="steady1143-script">').replace("+' · v11.89'; /* v8.19 release922", "+' · v11.88'; /* v8.19 release922") === base, 'the build is the live page plus the v11.89 block and footer only');
const src = fs.readFileSync(path.join(dir, 'who1189_src.js'), 'utf8');
check(block.includes(src) && block.includes(fs.readFileSync(path.join(dir, 'who1189.css'), 'utf8')), 'the page carries this folder\'s source exactly');

const hc = {module: {exports: {}}}; vm.runInNewContext(extract(page, 'var SvcCrews1173 =', 'module.exports=SvcCrews1173;'), hc); const Crew = hc.module.exports;
const sc = {module: {exports: {}}, SvcCrews1173: Crew}; vm.runInNewContext(extract(page, 'var SvcState = (function () {', 'module.exports = SvcState;'), sc); const S = sc.module.exports;
const card = JSON.parse(extract(page, 'var SVC1067_CARD=', ';\n').slice(17, -2)).data;
const live = JSON.parse(extract(page, 'var SVC1067_DATA=', ';\n').slice('var SVC1067_DATA='.length, -2));
const wc = {module: {exports: {}}, SvcCrews1173: Crew, SVC1067_CARD: {data: card}}; vm.runInNewContext(src, wc); const Wh = wc.module.exports;

const D = {tasks: live.tasks, plans: live.plans, extras: live.extras,
  days: [{id: '2026-10-23', label: 'Fri 23', plan: 'night'}, {id: '2026-10-24', label: 'Sat 24', plan: 'night'}, {id: '2026-10-25', label: 'Sun 25', plan: 'final'}],
  areas: [{n: 2, name: 'Island North / Freight', refs: [{ref: 'WC20', lines: [{id: 'WC20-TB', kind: 'block', label: '2 × Toilet block 6 m', qty: 2}, {id: 'WC20-WT', kind: 'tank', label: '2 × Waste tank', qty: 2}]}]},
    {n: 3, name: 'Island West — EVL', refs: [{ref: 'WC07', lines: [{id: 'WC07-FWF', kind: 'fwf', label: '20 × FWF', qty: 20}]}, {ref: 'WC04', lines: [{id: 'WC04-FWF', kind: 'fwf', label: '1 × FWF', qty: 1}]}]}]};
const at = (d, h) => d + 'T' + h + ':00+10:00';
const tick = (id, line, task, day, h, extra = {}) => Object.assign({id, line, task, day, done: true, at: at(day === '2026-10-23' ? '2026-10-23' : '2026-10-24', h), tapped_at: at(day === '2026-10-23' ? '2026-10-23' : '2026-10-24', h), undoes: []}, extra);
const fri = '2026-10-23', sat = '2026-10-24';
const events = [
  tick('f1', 'WC07-FWF', 'pump', fri, '21:10'), tick('f2', 'WC07-FWF', 'clean', fri, '21:30'),
  tick('s1', 'WC20-TB', 'clean', sat, '21:40', {crew_group: 'cleaners'}), {id: 's2', line: 'WC20-TB', task: 'clean', day: sat, done: false, undoes: ['s1'], at: at('2026-10-24', '21:41'), tapped_at: at('2026-10-24', '21:41'), crew_group: 'cleaners'},
  tick('s3', 'WC20-TB', 'clean', sat, '21:43', {crew_group: 'cleaners'}),
  tick('s4', 'WC07-FWF', 'pump', sat, '21:50', {crew_group: 'pump2'}), tick('s5', 'WC07-FWF', 'refill', sat, '21:55'),
  tick('s6', 'WC04-FWF', 'pump', sat, '22:00', {crew_group: 'pump1'}), {id: 'v1', voids: ['s6'], at: at('2026-10-24', '22:05')}];
const M = (day, now) => ({D, S, events, day, now: Date.parse(now), operational1160: true});

// Friday (closed, before crews were kept): times and jobs only, no crew, never guessed.
const P1 = Wh.place(M(fri, '2026-10-24T18:00:00+10:00'), 'WC07');
const pumpF = P1.lines[0].jobs.find(j => j.task === 'pump'), refillF = P1.lines[0].jobs.find(j => j.task === 'refill');
check(pumpF.state === 'done' && pumpF.by.length === 0 && pumpF.none && pumpF.early, 'Friday pump out: done, crew not recorded, before crews were kept');
check(refillF.state === 'missed' && refillF.whose.map(c => c.id).join() === 'water', 'Friday water: missed, the water truck\'s job');
check(P1.unrecorded && P1.closed && P1.dayLabel === 'Fri 23 night', 'Friday is closed and flagged as unrecorded');
const html1 = Wh.placeHtml(P1, S);
check(html1.includes('Crew not recorded · saved before crew names were kept') && html1.includes('Whose job: Kim &amp; Chad · Water truck') && html1.includes('from Sat 24 Oct, 10:20'), 'Friday sheet says so plainly');
check(!/AJ|Kelly|Sa &amp; Mark|Damien/.test(html1.split('Whose job')[0]), 'no crew is named for a Friday completion');
const P1b = Wh.place(M(fri, '2026-10-24T18:00:00+10:00'), 'WC20');
check(P1b.lines[1].jobs[0].whose.map(c => c.id).join() === 'pump1,pump2,pump3' && Wh.placeHtml(P1b, S).includes('Whose job: the pump trucks (AJ &amp; Kelly, Sa &amp; Mark, Damien &amp; Keegan)'), 'a missed pump out is the three pump trucks\' job');

// Saturday (open): the crew saved with each completion, the full history, cancels.
const P2 = Wh.place(M(sat, '2026-10-24T22:30:00+10:00'), 'WC20');
const cleanS = P2.lines[0].jobs[0];
check(cleanS.state === 'done' && cleanS.by.map(c => c.id).join() === 'cleaners' && S.hm(cleanS.at) === '21:43', 'the toilet block clean: done 21:43 by the cleaners');
check(cleanS.log.map(e => e.kind + (e.undone ? '*' : '')).join() === 'ticked*,unticked,ticked', 'its history: ticked (later unticked), unticked, ticked');
const html2 = Wh.placeHtml(P2, S);
check(html2.includes('✓ Done 21:43') && html2.includes('By Kev &amp; Cassie · Cleaners') && html2.includes('<time>21:41</time> unticked · Kev &amp; Cassie'), 'sheet: time, crew and history');
check(P2.lines[1].jobs[0].state === 'todo' && html2.includes('Not done yet') && !P2.closed, 'open night: not done yet, not missed');
check(!html2.includes('from Sat 24 Oct, 10:20'), 'no unrecorded note when every completion has a crew');
const P3 = Wh.place(M(sat, '2026-10-24T22:30:00+10:00'), 'WC07');
check(P3.lines[0].jobs.find(j => j.task === 'pump').by[0].id === 'pump2', 'pump out credited to the truck that saved it (Sa & Mark)');
const refillS = P3.lines[0].jobs.find(j => j.task === 'refill');
check(refillS.state === 'done' && refillS.none && !refillS.early && Wh.placeHtml(P3, S).includes('the crew page used did not send one'), 'a completion after 10:20 without a crew says the crew page sent none');
check(!P3.before && !Wh.placeHtml(P3, S).includes('from Sat 24 Oct, 10:20'), 'the before-10:20 note shows only for completions saved before 10:20');
const P4 = Wh.place(M(sat, '2026-10-24T22:30:00+10:00'), 'WC04');
const pumpC = P4.lines[0].jobs[0];
check(pumpC.state === 'todo' && pumpC.log.map(e => e.kind).join() === 'ticked,cancelled' && Wh.placeHtml(P4, S).includes('cancelled from the edit link'), 'a cancelled completion shows as cancelled and the job as not done');
check(Wh.place(M(sat, '2026-10-24T22:30:00+10:00'), 'NOPE') === null && Wh.placeHtml(null, S).includes('No servicing jobs'), 'an unknown place says so');

// A crew's places.
const C = Wh.crewPlaces(M(sat, '2026-10-24T22:30:00+10:00'), 'cleaners');
check(C.places === 1 && C.areas[0].refs[0].ref === 'WC20' && C.crew.names === 'Kev & Cassie', 'cleaners: WC20');
check(Wh.crewPlaces(M(sat, '2026-10-24T22:30:00+10:00'), 'pump1').places === 0, 'a cancelled completion is not credited');
check(Wh.crewHtml(Wh.crewPlaces(M(fri, '2026-10-24T18:00:00+10:00'), 'water'), S).includes('before crew names were kept'), 'a Friday crew list says crews were not kept yet');
check(Wh.crewHtml(C, S).includes('data-who1189="WC20"'), 'each place in a crew list opens its own history');

// The number tapped on "Message the teams" is the number listed; another crew's job saved with a name is listed apart; a tick still
// waiting to sync shows its own crew.
const tsrc = fs.readFileSync(path.join(dir, '..', 'v11.87_message_teams_LIVE', 'teams1187_src.js'), 'utf8');
check(page.includes(tsrc), 'the live Message the teams source is on the page');
const tc = {module: {exports: {}}, SvcCrews1173: Crew, SVC1067_CARD: {data: card}}; vm.runInNewContext(tsrc, tc); const T = tc.module.exports;
const more = events.concat([tick('s7', 'WC20-WT', 'pump', sat, '22:10', {crew_group: 'cleaners'}), tick('s8', 'WC04-FWF', 'clean', sat, '22:12', {crew_group: 'water'}),
  tick('s9', 'WC07-FWF', 'clean', sat, '22:14', {crew_group: 'pump3', local: true})]);
const M2 = Object.assign(M(sat, '2026-10-24T22:30:00+10:00'), {events: more});
check(['cleaners', 'pump1', 'pump2', 'pump3', 'water'].every(id => Wh.crewPlaces(M2, id).places === T.plan(M2, id).doneRefs), 'every crew: places listed = the done count on Message the teams');
const C2 = Wh.crewPlaces(M2, 'cleaners'), h2 = Wh.crewHtml(C2, S);
check(C2.places === 1 && C2.areas[0].refs[0].done.map(j => j.task).join() === 'clean,pump' && h2.includes('Clean &amp; restock (2 × Toilet block 6 m) 21:43 · Pump out (2 × Waste tank) 22:10 <small>(another crew’s job)</small>'), 'a pump out saved with the cleaners\' name is shown on their place, marked another crew\'s job');
const W2 = Wh.crewPlaces(M2, 'water'), hw = Wh.crewHtml(W2, S);
check(W2.places === 0 && W2.other.map(r => r.ref).join() === 'WC04' && hw.includes('Also saved with their name') && !hw.includes('No places saved'), 'only another crew\'s job: listed apart, not "no places"');
const P5 = Wh.place(M2, 'WC07'), cleanP = P5.lines[0].jobs.find(j => j.task === 'clean');
check(cleanP.state === 'pending' && cleanP.by.map(c => c.id).join() === 'pump3' && Wh.placeHtml(P5, S).includes('Waiting to sync</span></div><div class="who1189-by">By Damien &amp; Keegan'), 'a tick waiting to sync shows the crew it carries');
check(Wh.crewPlaces(M2, 'pump3').places === 0, 'a tick waiting to sync is not counted for the crew until saved');

// The panel tidy: names under the time, "Group not recorded" said once in the sheet, reference names tappable.
const raw = '<tr class="svc-r1 done"><th scope="row"><b>WC04</b> <span>1 × FWF</span></th><td class="ok"><time>21:10</time><small class="crew1173-report">Group not recorded</small></td>' +
  '<td class="ok"><time>21:50</time><small class="crew1173-report">Pump truck — Sa &amp; Mark</small></td><td class="ok"><time>21:55</time><small class="crew1173-report">Cleaners — Kev &amp; Cassie · Group not recorded</small></td></tr>' +
  '<tr class="svc-rg"><th scope="rowgroup" colspan="4"><b>WC20</b> <span>4 units</span></th></tr>';
const t = Wh.tidy('<table class="svc-tbl"><tbody>' + raw + '</tbody></table>', card, true);
check(t.startsWith('<table class="svc-tbl who1189-tbl">') && Wh.tidy('<table class="svc-tbl">', card, false) === '<table class="svc-tbl">', 'rows are tappable on the event tracker only');
check(!t.includes('Group not recorded') && t.includes('<small class="crew1173-report who1189-names">Sa &amp; Mark</small>') && t.includes('who1189-names">Kev &amp; Cassie</small>'), 'cells: people\'s names only, no "Group not recorded"');
check(t.includes('data-who1189="WC04"') && t.includes('data-who1189="WC20"'), 'single-line and grouped references become buttons');
check(!Wh.tidy(raw, card, false).includes('data-who1189'), 'no buttons on a test tracker');
check(Wh.tidy('<small class="crew1173-report">Crew group pump3</small>', card, false) === '<small class="crew1173-report who1189-names">Damien &amp; Keegan</small>', 'the old fallback label also becomes the names');

// The crew labels in the area tables and the shift report: as live they find no crew groups; fixed they read the crew card's list.
const fc = {module: {exports: {}}}; vm.runInNewContext(extract(page, 'var SvcCrews1173 =', 'module.exports=SvcCrews1173;'), fc); const C3 = fc.module.exports;
const one = {crews: ['cleaners'], unassigned: false}, cfgOnly = {plans: live.plans, days: live.days, extras: live.extras};
check(C3.text(cfgOnly, one) === 'Crew group cleaners', 'as live: the panel\'s lookup finds no crew groups ("Crew group cleaners")');
check(Wh.fixLabels(C3, card) === C3 && C3.text(cfgOnly, one) === 'Cleaners — Kev & Cassie' && C3.label(cfgOnly, 'pump2') === 'Pump truck — Sa & Mark', 'fixed: the crew card\'s labels');
check(C3.text(cfgOnly, {crews: [], unassigned: true}) === 'Group not recorded' && C3.text(card, {crews: ['water'], unassigned: true}) === 'Water truck — Kim & Chad · Group not recorded' && C3.text(cfgOnly, null) === '', 'everything else as before');
const t1 = C3.text; Wh.fixLabels(C3, card); check(C3.text === t1, 'applied once');

console.log(JSON.stringify({checks}));
