/* Author: Andrew Fisher. v12.42.2 - the truck-load planner on its own, no browser: the planner block is taken out of ../singles1238_src.js
   and run in a Node VM on staged cards (the units' own items, the references' real descriptions, real master-plan and VMS-plan positions).
   It proves the review fixes: a unit is classed by its own item (WC09's FWF are not pee panels, WC01's FWF are not accessible toilets); VMS
   boards are a stop each, measured and directed from their own pins; a toilet block with its waste tank is one line with both numbers;
   units booked for the same moment stay together, whatever they are, and booked trucks come first; a truck is named by number and first stop.
   Second review: the units one save books carry one mark and keep their own truck whatever else is booked for that moment; the sheet says
   what a booking would do to a truck already booked, and asks first when that truck would change; Book this load writes one mark for the
   whole truck, and a save the browser could not keep says so.
     node test_v12422_plan.cjs */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const MODULE = path.join(__dirname, '..', 'singles1238_src.js');
/* real positions from the live page: master plan D001 tags (references) and the VMS plan (boards; VMS 02 and 03 at their event positions 02a, 03a) */
const POS = {WC09: [-27.984717, 153.428026], WC01: [-27.983425, 153.42525], WC05: [-27.983608, 153.426357], WC20: [-27.987468, 153.428179], WC69: [-27.9814958, 153.4241619], WC41: [-27.9848352, 153.4260544], GN25: null};
const BOARDS = {'VMS 01': [-27.9737, 153.42028, 'Gold Coast Highway (median strip), south of Queen St intersection'], 'VMS 02': [-27.9834, 153.4249, 'Gold Coast Highway (southbound), top of path near S10'],
  'VMS 03': [-27.9817, 153.4234, 'Gold Coast Highway (southbound), outside Gate 1'], 'VMS 13': [-27.9814, 153.4244, 'T14 DL'], 'VMS 14': [-27.9822, 153.424, 'Gold Coast Highway southbound'], 'VMS 15': [-27.991754, 153.42945, 'T4 runoff']};
const DESC = {WC09: 'FWF, Pee Panel, Toilet Block 6m · Toilets', WC01: 'Accessible Toilet, FWF · Toilets', WC05: 'Waste tank, Toilet Block 6m · Event Operations Compound Toilet - Combo Block (Tanked)', WC20: 'Toilet Block 6m, Waste tank · Toilets (Tank Mounted)', WC69: 'FWF · Toilets', WC41: 'FWF · Toilets', GN25: '20kva · Generator', T0001: 'VMS · Variable message signs', T0158: 'VMS · Variable message signs'};

function planner() {
  const js = (fs.readFileSync(MODULE, 'utf8').match(/<script[^>]*>([\s\S]*?)<\/script>/) || [])[1]; if (!js) throw new Error('no script in the module');
  const grab = re => { const m = js.match(re); if (!m) throw new Error('not in the module: ' + re); return m[0]; };
  const helpers = [/^const e = .*$/m, /^const DOW = .*$/m, /^const ok = .*$/m, /^const pad = .*$/m, /^const qd = .*$/m, /^const qDay = .*$/m, /^const hhmm = .*$/m, /^const dayW = .*$/m, /^const when = .*$/m,
    /^const NATC = .*$/m, /^const navOf = .*$/m, /^const readyUnits = .*$/m, /^const coName = .*\n.*\n/m, /^function stamp\(prev\) .*$/m].map(grab).join('\n');
  const a = js.indexOf('const LOADCAP'), b = js.indexOf('\nfunction bookedHtml(list) {'); if (a < 0 || b < a) throw new Error('the planner block is not in the module');
  /* the booking writer for a whole truck (putBooking, bookLoad), run on a record held in the VM */
  const w0 = js.indexOf('/* one save\'s stamp'), w1 = js.indexOf('\nfunction setBooking('); if (w0 < 0 || w1 < w0) throw new Error('the booking writer is not in the module');
  const stubs = `const W = {};
function locOf(c) { if (c.vms) return {lat: c.vms.lat, lon: c.vms.lon}; const p = __POS[c.key]; return p ? {lat: p[0], lon: p[1]} : null; }
function titleOf(c) { return c.vms ? c.vms.label : String(c.item || c.key); }
const DemobMap1236 = {words: k => ['at ' + k], spot: () => null}, UI = {truck: '<svg></svg>'};
let __ed = false; const canEd = () => __ed, FL = [], flash = m => FL.push(m), buzz = () => {};
let S = {delivery: {}}, VER = 0, __kept = true, __may = true; function bump() { bump.kept = __kept; } const mayWrite = () => __may, isRef = k => /^[A-Z]/.test(k), whoAmI = () => 'Test recorder', docOf = () => ({});
function umap(key, field) { return Object.assign({}, (S.delivery[key] || {})[field] || {}); }`;
  const ctx = vm.createContext({__POS: POS, Intl, Math, Date, String, Number, Array, Map, Set, WeakMap, Object, JSON, RegExp, encodeURIComponent});
  vm.runInContext(helpers + '\n' + stubs + '\n' + js.slice(a, b) + '\n' + js.slice(w0, w1) + '\nglobalThis.api = {planLoads, loadKind, loadWords, loadUnits, stopsOf, mixWords, loadNote, truckName, loadsHtml, clashOf, bookLoad, setEd: v => { __ed = v; },'
    + ' rec: () => S, reset: (kept, may) => { S = {delivery: {}}; FL.length = 0; __kept = kept; __may = may; }, flashes: () => FL.slice()};', ctx, {filename: 'singles1238 planner'});
  return ctx.api;
}
const unit = (key, owner, item, no, extra) => Object.assign({key, uid: owner + '|' + no, owner, item, label: '', no, u: {item, label: ''}, what: DESC[key] || item, cat: /^T0/.test(key) ? 'vms' : /^GN/.test(key) ? 'gen' : 'wc', group: false, st: {s: 'ready'}, r: {key, zone: ''}, book: null, tank: null, tankNo: '', half: null}, extra || {});
const board = (key, label, no, extra) => { const b = BOARDS[label]; return unit(key, 'coates', 'VMS', no, Object.assign({label, u: {item: 'VMS', label}, cat: 'vms', vms: {label, at: label, moved: false, where: b[2], lat: b[0], lon: b[1], stored: null}}, extra || {})); };
const range = (n, f) => Array.from({length: n}, (_, i) => f(i));

const S = planner(), checks = [];
const check = (name, ok, detail) => { checks.push({name, ok: !!ok}); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' · ' + JSON.stringify(detail).slice(0, 900))); };
const AT = '2026-10-28T06:00:00+10:00', AT2 = '2026-10-28T07:00:00+10:00';

/* WC09: 10 FWF and 6 pee panels of Event Portables, under a reference that names FWF, Pee Panel and Toilet Block 6m; its two Coates blocks beside */
const w9 = range(10, i => unit('WC09', 'event-portables', 'FWF', '00' + (81 + i))).concat(range(6, i => unit('WC09', 'event-portables', 'Pee Panel', 'PP0' + (i + 1))));
const w9c = [unit('WC09', 'coates', 'Toilet Block 6m', '1268858'), unit('WC09', 'coates', 'Toilet Block 6m', '1311146')];
const others = range(12, i => unit('WC69', 'event-portables', 'FWF', 'A' + i)).concat(range(10, i => unit('WC41', 'event-portables', 'FWF', 'B' + i)));
const P9 = S.planLoads(w9.concat(w9c, others)), t9 = P9.filter(t => t.items.some(c => c.key === 'WC09' && c.owner === 'event-portables')), s9 = t9.length === 1 ? S.stopsOf(t9[0]).find(s => s.key === 'WC09') : null;
check('WC09\'s 16 Ready Event Portables units (10 FWF + 6 pee panels) go on ONE truck worded "10 FWF · 6 pee panels"', t9.length === 1 && t9[0].items.filter(c => c.key === 'WC09').length === 16 && s9 && s9.words === '10 FWF · 6 pee panels' && s9.nos.length === 16, {trucks: t9.map(t => S.mixWords(t.items)), s9: s9 && s9.words});
check('a unit is classed by its own item, never its reference\'s description (WC09 FWF toilet, Pee Panel panel; WC09\'s Coates blocks other gear, one a truck)', w9.every(c => S.loadKind(c) === (c.item === 'FWF' ? 'toilet' : 'panel')) && w9c.every(c => S.loadKind(c) === 'other') && P9.filter(t => t.items.some(c => c.owner === 'coates')).every(t => t.items.length === 1), w9.concat(w9c).map(c => c.item + ':' + S.loadKind(c)));
check('Event Portables: 24 a truck at most and 6 pee panels at most (38 units: 2 trucks)', P9.filter(t => t.kind === 'ep').length === 2 && P9.filter(t => t.kind === 'ep').every(t => t.items.length <= 24 && t.items.filter(c => S.loadKind(c) === 'panel').length <= 6), P9.map(t => [t.kind, t.items.length]));

/* WC01: the Coates accessible toilet and two Coates FWF, with a Coates generator elsewhere */
const w1 = [unit('WC01', 'coates', 'Accessible Toilet', 'ACC'), unit('WC01', 'coates', 'FWF', 'F1'), unit('WC01', 'coates', 'FWF', 'F2'), unit('GN25', 'coates', '20kva', '1244536')];
const P1 = S.planLoads(w1), t1 = P1.filter(t => t.items.some(c => c.key === 'WC01'));
check('WC01: each Coates FWF on its own truck, and only the accessible toilet rides, with one of them (not on the generator\'s truck)', w1.map(c => S.loadKind(c)).join() === 'access,other,other,other' && t1.length === 2 && t1.every(t => t.items.filter(c => c.item === 'FWF').length === 1) && t1.filter(t => t.items.length === 2).map(t => t.items[1].item).join() === 'Accessible Toilet' && P1.find(t => t.items[0].key === 'GN25').items.length === 1, P1.map(t => t.items.map(c => c.key + ':' + c.item)));
/* the accessible toilet never rides on a run (a group card) */
const P1g = S.planLoads([unit('WC01', 'coates', 'Accessible Toilet', 'ACC'), unit('WB01', 'coates', 'Water barrier', '', {uid: '*', group: true, n: 40, cat: 'wb'})]);
check('the accessible toilet never rides on a run (a group card): it has its own truck', P1g.length === 2 && P1g.every(t => t.items.length === 1), P1g.map(t => t.items.map(c => c.key)));

/* VMS: three boards at one reference are three stops, each its own place and directions */
const v3 = [board('T0001', 'VMS 01', '1211354'), board('T0001', 'VMS 02', '1211370'), board('T0001', 'VMS 03', '1271129')], P3 = S.planLoads(v3), s3 = P3.length === 1 ? S.stopsOf(P3[0]) : [], L3 = P3.length === 1 ? S.loadWords(P3[0]).lines : [];
const navs = L3.filter(l => /^\s+Navigate: https:\/\/www\.google\.com\/maps\/dir\//.test(l));
check('a VMS truck of 3 boards at one reference is 3 stops, each with its own label, place and Navigate link, nearest first by their own pins (VMS 01, then VMS 03 at Gate 1 before VMS 02 near S10; load 2, tow 1)', P3.length === 1 && s3.length === 3 && s3[0].label === 'VMS 01' && new Set(s3.map(s => s.label)).size === 3 && s3[1].label === 'VMS 03' && new Set(s3.map(s => s.where)).size === 3 && navs.length === 3 && new Set(navs).size === 3 && /load 2, tow 1\)$/.test(L3[0]) && L3.some(l => /^1\. VMS 01 \(T0001\) · 1 VMS board: 1211354 · Gold Coast Highway/.test(l)), L3);

/* tanks */
const tk = unit('WC05', 'coates', 'Toilet Block 6m', '1097377', {tank: {item: 'Waste tank', assetNo: '1328978'}, tankNo: '1328978'}), hf = unit('WC20', 'coates', 'Toilet Block 6m', '1327228', {tank: {item: 'Waste tank', assetNo: '1311341'}, tankNo: '1311341', half: 'block'}), hb = unit('WC20', 'coates', 'Toilet Block 6m', '1327225', {tank: {item: 'Waste tank', assetNo: '1328982'}, tankNo: '1328982', half: 'tank'});
const PT = S.planLoads([tk, hf, hb]), st = c => { const t = PT.find(x => x.items[0] === c); return t ? Object.assign({units: S.loadUnits(t)}, S.stopsOf(t)[0]) : {}; }, a = st(tk), b = st(hf), c2 = st(hb);
check('a toilet block with its tank reads "1 Toilet Block 6m + waste tank" with both numbers (2 units); with the block gone "1 waste tank" and its number; with the tank gone the block and its number', a.words === '1 Toilet Block 6m + waste tank' && a.nos.join(' ') === '1097377 1328978' && a.units === 2 && b.words === '1 waste tank' && b.nos.join() === '1311341' && b.units === 1 && c2.words === '1 Toilet Block 6m' && c2.nos.join() === '1327225' && c2.units === 1, {a, b, c2});

/* bookings: a booked VMS truck is kept together; three FWF booked together; booked trucks first; names */
const vb = [board('T0158', 'VMS 13', '1191957', {book: {at: AT}}), board('T0158', 'VMS 14', '1201864', {book: {at: AT}}), board('T0158', 'VMS 15', '1211348')].concat(v3);
const eb = range(3, i => unit('WC69', 'event-portables', 'FWF', 'K' + i, {book: {at: AT2}})).concat(others);
const PB = S.planLoads(vb.concat(eb));
check('a booked VMS truck stays together: VMS 13 and 14 booked for 06:00 alone on Truck 1 with that booking (load 1, tow 1); VMS 15 is not cut in with them', PB[0].kind === 'vms' && PB[0].at === AT && PB[0].items.map(c => c.vms.label).join() === 'VMS 13,VMS 14' && S.loadNote(PB[0]).at === AT && /load 1, tow 1\)$/.test(S.loadWords(PB[0]).lines[0]) && S.loadWords(PB[0]).lines[1] === 'Pick-up booked: ' + S.loadWords(PB[0]).lines[1].slice(16) && PB.slice(1).every(t => !t.items.some(c => c.book && c.book.at === AT)), PB.map(t => [t.n, t.kind, t.at, t.items.length]));
check('three FWF booked for 07:00 make their own truck (Truck 2, booked trucks first by time), never re-cut with the unbooked', PB[1].at === AT2 && PB[1].kind === 'ep' && PB[1].items.length === 3 && PB.slice(2).every(t => !t.at), PB.slice(0, 3).map(t => [t.n, t.at, t.items.length]));
check('a truck is named by its number and first stop, in its text too ("' + S.truckName(PB[0]) + '", "' + S.truckName(PB[2]) + '")', S.truckName(PB[0]) === 'Truck 1 (from VMS 13)' && /^Truck 3 \(from [A-Z0-9 ]+\)$/.test(S.truckName(PB[2])) && S.loadWords(PB[2]).lines[0].startsWith('Coates GC500 demob · ' + S.truckName(PB[2]) + ' · '), [S.truckName(PB[0]), S.loadWords(PB[2]).lines[0]]);
/* booking a truck: the same units come back together, found by the booking time, now first */
const pool = w9.concat(others).map(c => Object.assign({}, c)), Q0 = S.planLoads(pool), T2 = Q0[1], ids = T2.items.map(c => c.uid);
T2.items.forEach(c => { c.book = {at: AT}; });
const Q1 = S.planLoads(pool), f = Q1.find(t => t.at === AT && t.items.some(c => c.uid === ids[0]));
check('booking ' + S.truckName(T2) + ' keeps the same ' + ids.length + ' units together on one truck, found by its time and now ' + (f ? S.truckName(f) : 'none'), f && f.n === 1 && f.items.length === ids.length && f.items.every(c => ids.indexOf(c.uid) >= 0), f && f.items.map(c => c.uid));
/* a truck holding units booked apart (no rule makes one, but the panel says so if it ever does) */
const mix = {n: 4, owner: 'coates', kind: 'other', at: null, items: [unit('GN25', 'coates', '20kva', 'm1', {book: {at: AT}}), unit('WC01', 'coates', 'FWF', 'm2', {book: {at: AT2}}), unit('WC01', 'coates', 'FWF', 'm3')]}, mn = S.loadNote(mix);
check('a truck whose units carry different bookings lists each time and how many units it moves', mn && !mn.at && mn.moves === 2 && /^\w{3} 28 Oct · 06:00 \(1 unit\), \w{3} 28 Oct · 07:00 \(1 unit\)$/.test(mn.times), mn);
/* the drawn panel */
S.setEd(true); const html = S.loadsHtml(vb.concat(eb)); S.setEd(false);
check('the panel (edit link): booked trucks say "Pick-up booked" and offer Change booking, the rest Book this load; each truck carries its own id; each VMS board is its own stop line', (html.match(/<article class="lt1238/g) || []).length === PB.length && (html.match(/>Change booking</g) || []).length === 2 && (html.match(/>Book this load</g) || []).length === PB.length - 2 && new Set((html.match(/data-lid1238="[^"]+"/g) || [])).size === PB.length && (html.match(/<b>VMS \d+<\/b><span>1 VMS board · T0\d+<\/span>/g) || []).length === 6, {n: PB.length});
check('no unit is planned twice and only Ready units are planned', (() => { const all = vb.concat(eb).concat([unit('WC69', 'event-portables', 'FWF', 'NR', {st: {s: 'not'}})]), P = S.planLoads(all), ids2 = P.flatMap(t => t.items.map(c => c.uid)); return ids2.length === new Set(ids2).size && ids2.length === all.length - 1 && ids2.indexOf('event-portables|NR') < 0; })());

/* second review: a save's units carry one mark (the booking's "set"); a card's own booking a mark of its own */
const id = c => c.key + '#' + c.uid, sameAs = (t, ids) => !!t && t.items.length === ids.length && ids.every(x => t.items.some(c => id(c) === x));
let MK = 0; const book = (cs, ids, at) => { const m = '2026-10-27T05:00:' + String(10 + MK++).padStart(2, '0') + '.000Z', w = new Set(ids); cs.forEach(c => { if (w.has(id(c))) c.book = {at, note: '', by: 'test', set: m}; }); };
const fresh = () => w9.concat(others).map(c => Object.assign({}, c, {book: null}));
/* WC09, WC69, WC41 and 14 FWF at WC20: Truck 2 (from WC20) is full; booked whole, then a WC09 FWF booked on its own card for the same time.
   Planned as one set (the first draft), the WC09 unit took a place on the WC20 truck and pushed a WC69 unit off it */
{ const cs = fresh().concat(range(14, i => unit('WC20', 'event-portables', 'FWF', 'C' + i))), L0 = S.planLoads(cs), A = L0[1].items.map(id), x = L0[0].items[0]; book(cs, A, AT);
  const cx = S.clashOf(AT, 'event-portables', new Set([id(x)]), cs); book(cs, [id(x)], AT);
  const L = S.planLoads(cs), hold = L.filter(t => t.items.some(c => A.includes(id(c))));
  check('a whole booked truck (' + A.length + ' units, one save) plus one unit booked on its own card for the same time: the truck keeps exactly the units it was booked with, and the single goes on a truck of its own', hold.length === 1 && sameAs(hold[0], A) && hold[0].at === AT && L.some(t => t.at === AT && sameAs(t, [id(x)])), L.map(t => [t.n, t.at, t.items.length]));
  check('... and the sheet for that single said "' + (cx && cx.words) + '", with no question', A.length === 24 && L0[1].items[0].key === 'WC20' && x.key === 'WC09' && cx && !cx.changed.length && cx.keeps.length === 1 && /^Truck 1 \(from WC20\) is already booked for \w{3} 28 Oct · 06:00 and keeps its own units$/.test(cx.words) && cx.ask === '', cx && {words: cx.words, ask: cx.ask}); }
{ const cs = fresh(), L0 = S.planLoads(cs), A = L0[0].items.map(id), B = L0[1].items.map(id); book(cs, A, AT); const cx = S.clashOf(AT, 'event-portables', new Set(B), cs); book(cs, B, AT);
  const L = S.planLoads(cs);
  check('two whole trucks of one owner booked for the same time keep their own units; the second truck\'s sheet named the first ("' + (cx && cx.words) + '") and asked nothing', L.filter(t => t.at === AT).length === 2 && L.some(t => sameAs(t, A)) && L.some(t => sameAs(t, B)) && cx && !cx.changed.length && /^Truck 1 \(from WC09\) is already booked for /.test(cx.words), L.map(t => [t.n, t.at, t.items.length])); }
{ const cs = fresh(), A = S.planLoads(cs)[0].items.map(id); book(cs, A, AT); const cx = S.clashOf(AT, 'event-portables', new Set([A[5]]), cs);
  check('a unit of a booked truck booked again on its own card, same time: the sheet says it comes off that truck and asks first ("' + (cx && cx.words) + '")', cx && cx.changed.length === 1 && cx.changed[0].how === 'loses' && cx.words === 'Truck 1 (from WC09) is booked for ' + cx.words.split(' is booked for ')[1] && / this unit comes off it$/.test(cx.words) && /^Truck 1 \(from WC09\) is booked for .*: this unit comes off it\.\n\nA driver who already has that list will need the new one: text it again after saving\.\n\nOK saves the booking\. Cancel leaves everything as it is\.$/.test(cx.ask), cx && {words: cx.words, ask: cx.ask});
  const cs2 = fresh(); book(cs2, [id(cs2.find(c => c.key === 'WC69'))], AT); const y = cs2.filter(c => c.key === 'WC69')[1], cy = S.clashOf(AT, 'event-portables', new Set([id(y)]), cs2);
  check('one unit booked on its own card for a time another single booking of that owner holds: the sheet says it goes on that truck too and asks first', cy && cy.changed.length === 1 && cy.changed[0].how === 'joins' && / is booked for \w{3} 28 Oct · 06:00: this unit goes on it too$/.test(cy.words), cy && cy.words);
  check('a booking with no truck of that owner booked at that time, or holding its units: nothing is said', S.clashOf(AT2, 'event-portables', new Set([id(y)]), fresh()) === null && S.clashOf(AT, 'coates', new Set(['GN25#coates|1244536']), cs) === null); }
/* Book this load: one mark for the whole truck at every reference, later than any booking those units had; a refused save says so */
{ S.reset(true, true); S.rec().delivery.WC69 = {pickup1238_units: {'event-portables|A1': {at: AT2, note: '', by: 'A', set: '2099-01-01T00:00:00.000Z'}}};
  const who = S.bookLoad([{key: 'WC69', uids: ['event-portables|A1', 'event-portables|A2']}, {key: 'WC41', uids: ['event-portables|B0']}, {key: 'WC09', uids: ['event-portables|0081']}], AT, 'truck 2'), d = S.rec().delivery;
  const m = [d.WC69.pickup1238_units['event-portables|A1'], d.WC69.pickup1238_units['event-portables|A2'], d.WC41.pickup1238_units['event-portables|B0'], d.WC09.pickup1238_units['event-portables|0081']];
  check('Book this load writes one mark on every unit at every reference (three references here), later than any booking they carried', who === 'Test recorder' && m.every(x => x && x.at === AT && x.note === 'truck 2' && x.set === m[0].set) && m[0].set > '2099-01-01T00:00:00.000Z', m);
  S.reset(false, true); const r2 = S.bookLoad([{key: 'WC69', uids: ['event-portables|A1']}, {key: 'WC41', uids: ['event-portables|B0']}], AT, '');
  check('a truck save the browser could not keep returns no recorder and says "Not saved · keep this page open" (never "recorded by")', r2 === false && S.flashes().join() === 'Not saved · keep this page open.', {r2, f: S.flashes()});
  S.reset(true, false); const r3 = S.bookLoad([{key: 'WC69', uids: ['event-portables|A1']}], AT, '');
  check('on a link that may not write, a truck save writes nothing', r3 === false && !Object.keys(S.rec().delivery).length); }

const passed = checks.filter(x => x.ok).length; console.log('\n' + passed + '/' + checks.length + ' passed');
process.exitCode = passed === checks.length ? 0 : 1;
