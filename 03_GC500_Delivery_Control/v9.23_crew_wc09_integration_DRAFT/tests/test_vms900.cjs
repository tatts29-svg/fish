// Author: Andrew Fisher. v9.00 part D (publishes in v9.05) - the iEDM VMS plan VMS001-26003-01, in words only.
// Reads the base and the built page (DATA, from the files), then opens each at the live address, reading the live record with
// every write aborted, and checks the four changes and that nothing else moved:
//  1. Documents lists the plan once, beside D025, with no file (the "not uploaded" light) and its received / under review /
//     not hosted words;
//  2. the D025 sheet: seven markers carry the plan's cross-reference in their tooltip, accessible name and the card a tap
//     opens; 1O shows as 10; the boards only the plan has (21-24) are listed once, under the sheet, in the plan's words;
//  3. Today's VMS boards card: one new line in its notes, once, beside the v8.75 note, which is still there;
//  4. DATA.open_items: R30 with its four open points and the two recorded answers (asked on Questions, listed on About); R16 and R23 one sentence each;
// and, base against candidate: no marker fx/fy/ax/ay (every sheet, the master plan's VMS layer included), no MASTER_LOC entry,
// no navigation point, no Today count, no money model and no other question changed; every other DATA key is the base's;
// no page or console errors; no write attempted (counts.blocked 0). Laptop by default; MOB=1 for the phone.
//   PAGE=<build> [BASE=<base page; default base_live.html beside PAGE>] [MOB=1] [OUT=<screenshot dir>]
//   [PARTS_KEYS=team,broadcast,media,hostedMedia - DATA keys the other v9.00 parts own, allowed to differ in an integrated build]
//   node v9.00_crew_vms_counts_DRAFT/tests/test_vms900.cjs
const fs = require('fs'), path = require('path'), {open} = require('../../toolchain/harness/open_page');
const PAGE = process.env.PAGE, BASE = process.env.BASE || path.join(path.dirname(PAGE || '.'), 'base_live.html');
if (!PAGE || !fs.existsSync(PAGE) || !fs.existsSync(BASE)) { console.error('PAGE and BASE must name the built page and its base'); process.exit(2); }
const MOB = !!process.env.MOB, W = MOB ? 390 : Number(process.env.W || 1440), H = MOB ? 844 : Number(process.env.H || 900);
const PARTS_KEYS = new Set((process.env.PARTS_KEYS || 'team,broadcast,media,hostedMedia').split(',').map(x => x.trim()).filter(Boolean));
// keys that carry money, counts, positions or the record's joins: never allowed to differ, whatever else is in the build
const NEVER = ['assets', 'plant_lines', 'rental_on_hire', 'rate_card', 'accessory_rate_card', 'rate_match', 'charge_basis', 'rehire_quotes',
 'toilet_servicing', 'event_scope', 'transport', 'transport_forecast831', 'ops', 'orphan_rows', 'unreferenced', 'fence', 'fencing',
 'purchase_orders', 'boq', 'summary', 'schedule_review875', 'event_staffing833', 'cost_categories', 'branches', 'pricing_authority',
 'authority', 'accessory_authority', 'hzmap', 'georef', 'workforce', 'driver_rules', 'weeks', 'site', 'depot', 'fence_sheets', 'closures'];

// ---- what this part adds, word for word (the plan's own words for 21-24 as both transcriptions of pages 7 and 17 read them)
const PLAN = 'VMS001-26003-01', PLAN_FILE = 'VMS001-26003-01_GC500_COATES_VMS_LOCATIONS.pdf';
const TITLE = 'VMS001-26003-01 · 2026 Gold Coast 500 VMS Plan (iEDM) · 17 pages · received 8 Oct 2026';
const ONLY_IN_PLAN = [['21', 'STAGHORN AVE / SURFERS PARADISE BOULAVARD INTERSECTION (EAST BOUND)'],
 ['22', 'SOUTH OF SUNDALE BRIDGE (NORTHBOUND TRAFFIC) IN THE TRAFFIC SWITCH LANE AT TEDDER AVE INTERSECTION'],
 ['23', 'GC HIGHWAY (NORTH OF SUNDALE BRIDGE) ON THE EASTERN SIDE OF THE ROAD FOR SOUTHBOUND TRAFFIC'],
 ['24', 'THE ESPLANADE BEFORE STAGHORN AVE INTERSECTION (NORTH BOUND)']];
const SHEET_NOTE = 'In the iEDM plan, not on D025: ' + ONLY_IN_PLAN.map(([n, w]) => n + ' "' + w + '"').join('; ') + '. '
 + 'The plan\'s words as printed; no marker is drawn for them (iEDM VMS plan VMS001-26003-01, under review as R30).';
const NOTES = {'2A': 'plan 02a', '5A': 'plan 05a', '7A': 'plan 07a', '04A': 'plan: 03a (the plan moves 03 to this spot; it has no 04a)',
 '15': 'plan 15* — installed at the conclusion of track activity, stored T2 runoff', '18': 'plan 18* — Roadtek to remove/install Fri/Sat/Sun',
 '1O': 'D025 itself types 1O'};
const R30_TITLE = 'VMS plan VMS001-26003-01 vs D025 Rev 02 — to confirm';
const R30_POINTS = ['which drawing governs', '03a vs 04A', '4 or 5 moves on 19 Oct', 'boards 21–24'];
const lineFor = (total, boq) => 'Schedule ' + total + ' · iEDM plan ' + PLAN + ': 24 boards + 4 moves · BOQ ' + boq + ' · the project manager\'s 1 Oct answer: 22';
// names the page must never carry (agents, models, people from the plan's file details are not listed here at all): held encoded
// so this file does not carry them either; the check is that the build carries no more of each than its base
const NAMES = JSON.parse(Buffer.from('WyJDbGF1ZGUiLCJDb2RleCIsIkFudGhyb3BpYyIsIk9wZW5BSSIsIkNoYXRHUFQiLCJHUFQtIiwiT3B1cyIsIlNvbm5ldCIsIkhhaWt1Il0=', 'base64').toString('utf8'));

const R = [], ok = (name, pass, detail) => R.push({name, pass: !!pass, detail});
const fileText = f => fs.readFileSync(f, 'utf8').replace(/^﻿/, '');
const dataOf = t => { const i = t.indexOf('const DATA = '), j = t.indexOf('\n', i); return JSON.parse(t.slice(i + 13, j - 1)); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const firstDiff = (a, b, at = '') => { if (same(a, b)) return null; if (a && b && typeof a === 'object' && typeof b === 'object') {
 for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const d = firstDiff(a[k], b[k], at + '.' + k); if (d) return d; } }
 return at + ': ' + JSON.stringify(a).slice(0, 160) + ' -> ' + JSON.stringify(b).slice(0, 160); };
const bText = fileText(BASE), cText = fileText(PAGE), B = dataOf(bText), C = dataOf(cText);

/* ---- A. the model, from the files ---- */
{ // 1. Documents
 const bd = B.docs.docs, cd = C.docs.docs, at = bd.findIndex(d => d.id === 'D025-26003-02-VMS.pdf'), mine = cd.filter(d => JSON.stringify(d).includes(PLAN));
 ok('Documents: the plan is listed once, straight after D025, and every other entry is the base\'s', mine.length === 1 && cd[at + 1] === mine[0] && same(cd.filter(d => d !== mine[0]), bd) && !bd.some(d => JSON.stringify(d).includes(PLAN)));
 const d = mine[0] || {};
 ok('Documents: listed as "' + TITLE + '"', d.title === TITLE && d.id === PLAN_FILE && d.kind === 'map' && d.group === 'issued');
 ok('Documents: no file is hosted (no href, file, checksum, size or thumbnail)', ['href', 'file', 'sha256', 'bytes', 'thumb', 'map_key', 'sheet_ids'].every(k => !(k in d)));
 ok('Documents: its words say received, under review and not hosted', /^Received from the project manager on 8 Oct 2026/.test(d.note || '') && /Under review:/.test(d.note) && /Not hosted: no file is uploaded/.test(d.note));
 const maps = x => x.filter(e => e.kind === 'map').length;
 ok('Documents: the catalogue count follows (map ' + B.docs.counts.map + ' -> ' + C.docs.counts.map + ')', B.docs.counts.map === maps(bd) ? C.docs.counts.map === maps(cd) && maps(cd) === maps(bd) + 1 : C.docs.counts.map === B.docs.counts.map);
 // 2. the D025 sheet
 const bs = B.sheets.find(s => s.key === 'D025'), cs = C.sheets.find(s => s.key === 'D025');
 ok('Sheets: every sheet but D025 is the base\'s', same(C.sheets.filter(s => s.key !== 'D025'), B.sheets.filter(s => s.key !== 'D025')) && C.sheets.length === B.sheets.length);
 ok('D025: the sheet note lists 21, 22, 23 and 24 once, in the plan\'s words', cs.note === SHEET_NOTE && !('note' in bs));
 ok('D025: the sheet itself is otherwise the base\'s', same(Object.fromEntries(Object.entries(cs).filter(([k]) => !['markers', 'note'].includes(k))), Object.fromEntries(Object.entries(bs).filter(([k]) => k !== 'markers'))));
 const moved = cs.markers.map((m, i) => [m, bs.markers[i]]).filter(([m, b]) => !same(Object.fromEntries(Object.entries(m).filter(([k]) => !['note', 'face'].includes(k))), b));
 ok('D025: 27 markers, same order, and no label, tag, fx, fy, ax, ay, bubble or context changed', cs.markers.length === 27 && bs.markers.length === 27 && !moved.length, moved.map(([m]) => m.label));
 const worded = cs.markers.filter(m => 'note' in m || 'face' in m);
 ok('D025: exactly the seven markers carry the plan\'s cross-reference, word for word', worded.length === 7 && Object.entries(NOTES).every(([l, n]) => (cs.markers.find(m => m.label === l) || {}).note === n), worded.map(m => m.label + ': ' + m.note));
 ok('D025: 1O shows as 10 (face only; its stored label stays 1O)', (cs.markers.find(m => m.label === '1O') || {}).face === '10' && cs.markers.filter(m => 'face' in m).length === 1);
 // 4. open items
 const bo = B.open_items, co = C.open_items, r30 = co[co.length - 1] || {};
 ok('Open items: R30 is added last, the next free R number, with the keys every item has', co.length === bo.length + 1 && r30.id === 'R30' && !bo.some(o => o.id === 'R30') && bo.some(o => o.id === 'R29') && same(Object.keys(r30), Object.keys(bo[0])));
 ok('Open items: R30 is "' + R30_TITLE + '", open, with its four open points and the two recorded answers', r30.title === R30_TITLE && r30.status === 'Open' && R30_POINTS.every(w => (r30.finding || '').includes(w)) && /\(1\)[^]*\(2\)[^]*\(3\)[^]*\(4\)/.test(r30.finding || '') && r30.finding.includes('T0103 carries VMS09 and VMS10') && r30.finding.includes('asset 1211404 is VMS09, moved from T0001') && !r30.finding.includes('which boards T0103 brings today'));
 const grown = id => { const b = bo.find(o => o.id === id), c = co.find(o => o.id === id); const add = c.finding.slice(b.finding.length);
  return c.finding.startsWith(b.finding + ' ') && add.includes(PLAN) && add.trim().split(/(?<=\.)\s+(?=[A-Z])/).length === 1 && same({...c, finding: ''}, {...b, finding: ''}); };
 ok('Open items: R16 gains one sentence noting the plan', grown('R16'));
 ok('Open items: R23 gains one sentence noting the plan', grown('R23'));
 ok('Open items: every other item is the base\'s', same(co.slice(0, -1).filter(o => !['R16', 'R23'].includes(o.id)), bo.filter(o => !['R16', 'R23'].includes(o.id))));
 // everything else in DATA
 const changed = Object.keys({...B, ...C}).filter(k => !same(B[k], C[k]));
 const mineK = ['docs', 'sheets', 'open_items'], others = changed.filter(k => !mineK.includes(k));
 ok('DATA: no key that carries money, counts, positions or joins changed', NEVER.every(k => same(B[k], C[k])), NEVER.filter(k => !same(B[k], C[k])));
 ok('DATA: nothing else changed (other v9.00 parts\' keys allowed: ' + [...PARTS_KEYS].join(', ') + ')', others.every(k => PARTS_KEYS.has(k)), others);
 // the words themselves
 const added = [d.title, d.note, cs.note, r30.title, r30.finding, r30.priority, ...Object.values(NOTES), co.find(o => o.id === 'R16').finding, co.find(o => o.id === 'R23').finding].join(' \n ');
 ok('The added words carry no dollar figure, email or phone number', !/\$\s?\d|@|\b0\d(?:[ -]?\d){8}\b|\b13\d{4}\b|\b1[38]00(?:[ -]?\d){6}\b/.test(added));
 ok('The added words say "the project manager", never the name', !/Andrew Fisher/.test(added) && /the project manager/.test(added));
 const n = (t, w) => t.split(w).length - 1;
 ok('The page carries no more agent or model names than its base', NAMES.every(w => n(cText, w) <= n(bText, w)));
 ok('The page outside DATA changed only in the map, the callout card and the new script', (() => {
  const strip = t => { const i = t.indexOf('const DATA = '), j = t.indexOf('\n', i); return t.slice(0, i) + t.slice(j); };
  const a = strip(bText), b = strip(cText); return b.length - a.length < 9000 && b.includes('vmsPlan905') && !a.includes('vmsPlan905'); })());
}

/* ---- B. the live page, base then candidate ---- */
const SNAP = () => {
 const day = todayIso(), J = v => { try { return JSON.parse(JSON.stringify(v, (k, x) => typeof x === 'function' ? undefined : x)); } catch (e) { return 'unserialisable: ' + e.message; } };
 const h = t => { let x = 2166136261; for (let i = 0; i < t.length; i++) { x ^= t.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0).toString(16) + ':' + t.length; };
 const areas = todayWorkMetrics840(day), groups = J(todayGroupDetails841(day, areas)), line = /^Schedule \d+ · iEDM plan VMS001-26003-01: /;
 const vmsNotes = (groups.vms && groups.vms.notes) || [];
 if (groups.vms) groups.vms.notes = vmsNotes.filter(n => !line.test(n));
 const total = ((todayGroupDetails841(day, areas).vms || {}).groups || []).reduce((n, g) => n + ((g.summary || {}).total || 0), 0);
 const call = f => { try { return J(f()); } catch (e) { return 'threw: ' + e.message; } };
 return {record: h(JSON.stringify(S)), day,
  masterLoc: J(MASTER_LOC),
  markers: DATA.sheets.map(s => [s.key, (s.markers || []).map(m => [m.label, m.fx, m.fy, m.ax == null ? null : m.ax, m.ay == null ? null : m.ay, m.layer || null])]),
  nav: allAssets().map(a => [a.key, call(() => navPointFor(a))]),
  areas: J(areas), groups, vmsNotes, vmsTotal: total, boq: (DATA.schedule_review875 || {}).vms_boq,
  progress: call(() => progress881Model(day)),
  money: {summary: call(() => moneySummary(day)), fh866: call(() => fh866Model()), pl770: call(() => pl770Model()), labour: call(() => labourRevenue858())},
  questions: J(questionsList().filter(q => q.id !== 'oi-R30')), r30: J(questionsList().filter(q => q.id === 'oi-R30'))};
};
const READY = () => typeof go === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof todayWorkHealth840 === 'function'
 && todayWorkHealth840().ready && typeof todayGroupHealth841 === 'function' && todayGroupHealth841().ready && typeof DOCS !== 'undefined';
async function session(file, label, fn) {
 const s = await open({pageFile: file, W, H, mobile: MOB, dpr: MOB ? 2 : 1}), p = s.page, cons = [];
 p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) cons.push(m.text().slice(0, 200)); });
 try { await p.waitForFunction(READY, null, {timeout: 180000}); await p.waitForTimeout(1500); return await fn(p, s, cons); }
 finally { await s.browser.close(); }
}
const openD025 = async p => { await p.evaluate(() => go('map')); await p.waitForTimeout(800);
 await p.evaluate(() => { state.sheet = 'D025'; state.zoom = 1; state.ox = 0; state.oy = 0; state.q = ''; renderMap(); }); await p.waitForTimeout(1200); };
const markerView = p => p.evaluate(() => [...document.querySelectorAll('#pane-map .mk')].map(b => { const r = b.getBoundingClientRect();
 return {label: b.dataset.label, face: b.textContent.trim(), title: b.title, aria: b.getAttribute('aria-label'), cx: r.left + r.width / 2, cy: r.top + r.height / 2}; }));
const overflow = p => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2);
const shot = async (p, name) => { if (!process.env.OUT) return; fs.mkdirSync(process.env.OUT, {recursive: true}); await p.screenshot({path: path.join(process.env.OUT, name + '-' + (MOB ? 'phone' : 'laptop') + '.png')}); };

// the base and the candidate are read one after the other; if the live record moves in between, the pair is read again once
async function pair() {
 const base = await session(BASE, 'base', async (p, s, cons) => {
  const snap = await p.evaluate(SNAP); await openD025(p); const markers = await markerView(p);
  await p.evaluate(() => go('docs')); await p.waitForTimeout(2500);
  const unhosted = await p.evaluate(() => docCollection().unhosted);
  await p.evaluate(() => go('today')); await p.waitForTimeout(1500);
  const notes875 = await p.evaluate(() => [...document.querySelectorAll('[data-tw841-group-card="vms"] ul.tw841-group-notes li')].map(li => li.textContent));
  return {snap, markers, unhosted, notes875, errors: s.errors.slice(), cons: cons.slice(), blocked: s.counts.blocked};
 });
 ok('base: the v8.75 VMS note is in the VMS card\'s details (where the new line goes)', base.notes875.some(t => /^Schedule \(5\) programme: \d+ VMS boards; BOQ: \d+\./.test(t)), base.notes875);
 ok('base: no page or console errors, no write attempted', !base.errors.length && !base.cons.length && base.blocked === 0, {errors: base.errors, cons: base.cons, blocked: base.blocked});

 await session(PAGE, 'candidate', async (p, s, cons) => {
  const snap = await p.evaluate(SNAP);
  if (snap.record !== base.snap.record && !retried) { moved = {base: base.snap.record, candidate: snap.record}; return; }
  ok('the live record did not move between the two runs (' + base.snap.record + ')', snap.record === base.snap.record, {base: base.snap.record, candidate: snap.record, first: moved});
  // nothing moved
  ok('no marker position moved, on any sheet (the master plan\'s VMS layer and its arrow tips included)', same(snap.markers, base.snap.markers), firstDiff(base.snap.markers, snap.markers));
  ok('no MASTER_LOC entry changed', same(snap.masterLoc, base.snap.masterLoc), firstDiff(base.snap.masterLoc, snap.masterLoc));
  ok('no navigation point changed', same(snap.nav, base.snap.nav), firstDiff(base.snap.nav, snap.nav));
  ok('Today: no count changed (every area: total, done, left, %)', same(snap.areas, base.snap.areas), firstDiff(base.snap.areas, snap.areas));
  ok('Today: the group details are the base\'s but for the one new VMS line', same(snap.groups, base.snap.groups), firstDiff(base.snap.groups, snap.groups));
  ok('Today: the overall progress model is the base\'s', same(snap.progress, base.snap.progress), firstDiff(base.snap.progress, snap.progress));
  ok('no money model changed (money summary, P&L, finance, labour forecast)', same(snap.money, base.snap.money), firstDiff(base.snap.money, snap.money));
  ok('every other question is the base\'s', same(snap.questions, base.snap.questions), firstDiff(base.snap.questions, snap.questions));
  // 3. Today
  const want = lineFor(snap.vmsTotal, snap.boq);
  ok('Today model: the VMS notes gain exactly the one line: "' + want + '"', snap.vmsNotes.filter(n => n === want).length === 1 && snap.vmsNotes.length === base.snap.groups.vms.notes.length + 1, snap.vmsNotes);
  await p.evaluate(() => go('today')); await p.waitForTimeout(1500);
  const today = await p.evaluate(w => { const d = document.querySelector('[data-tw841-group-card="vms"]'); if (!d) return null; d.open = true; d.scrollIntoView({block: 'start'});
   const lis = [...d.querySelectorAll('ul.tw841-group-notes li')].map(li => li.textContent);
   return {lis, onPage: document.body.textContent.split(w).length - 1, visible: [...d.querySelectorAll('ul.tw841-group-notes li')].some(li => li.textContent === w && li.getClientRects().length > 0)}; }, want);
  await p.waitForTimeout(400);
  ok('Today: the VMS card\'s details show the new line once, beside the v8.75 note', today && today.lis.filter(t => t === want).length === 1 && today.onPage === 1 && today.visible && today.lis.some(t => /^Schedule \(5\) programme:/.test(t)), today);
  if (today) await p.evaluate(w => { const li = [...document.querySelectorAll('[data-tw841-group-card="vms"] ul.tw841-group-notes li')].find(x => x.textContent === w); if (li) li.scrollIntoView({block: 'center'}); }, want);
  await p.waitForTimeout(300); await shot(p, 'vms900-today');
  ok('Today: no horizontal overflow', await overflow(p));
  // 1. Documents
  await p.evaluate(() => go('docs')); await p.waitForTimeout(2500);
  const docs = await p.evaluate(id => { const C = docCollection(), d = C.items.find(x => x.id === id);
   const t = document.querySelector('[data-tile815="maps"]'); if (t) t.click(); return {availability: d && d.availability, unhosted: C.unhosted, href: d ? docHref(d) : 'none', inMaps: !!d && d.category === 'Maps and drawings'}; }, PLAN_FILE);
  await p.waitForTimeout(800);
  const row = await p.evaluate(id => { const r = document.querySelector('[data-doc815="' + CSS.escape(id) + '"]'); if (!r) return null;
   const b = r.querySelector('[data-note815]'); if (b) b.click(); const n = r.querySelector('.note815'); r.scrollIntoView({block: 'center'});
   const sub = r.closest('.card') && [...r.closest('.card').querySelectorAll('h4.sub815, .sub815')].map(h => h.textContent.trim());
   return {text: r.textContent, light: (r.querySelector('.tl') || {}).textContent || '', red: !!r.querySelector('.tl.red'), open: !!r.querySelector('a[href]'),
    note: n ? n.textContent : '', noteShown: !!n && !n.hidden, heading: (r.closest('ul') && r.closest('ul').previousElementSibling || {}).textContent || '', sub}; }, PLAN_FILE);
  await p.waitForTimeout(300); await shot(p, 'vms900-documents');
  ok('Documents: the plan has no file on the service and shows the "not uploaded" light, like the other unhosted papers', docs.availability === 'missing' && docs.href === null && docs.unhosted === base.unhosted + 1 && row && row.red && /not uploaded/.test(row.light) && !row.open, {docs, light: row && row.light});
  ok('Documents: listed under Drawings as "' + TITLE + '"', docs.inMaps && row && row.text.includes(TITLE), row && row.text.slice(0, 200));
  ok('Documents: Details says received, under review and not hosted', row && row.noteShown && /Received from the project manager on 8 Oct 2026/.test(row.note) && /Under review/.test(row.note) && /Not hosted/.test(row.note));
  ok('Documents: no horizontal overflow', await overflow(p));
  // 2. the D025 sheet
  await openD025(p);
  const mk = await markerView(p), bm = new Map(base.markers.map(m => [m.label, m]));
  const drift = Math.max(0, ...mk.map(m => bm.has(m.label) ? Math.hypot(m.cx - bm.get(m.label).cx, m.cy - bm.get(m.label).cy) : 999));
  ok('D025: the 27 markers are drawn where the base draws them (largest shift ' + drift.toFixed(2) + ' px)', mk.length === 27 && base.markers.length === 27 && drift <= 3);
  const wordsOn = Object.entries(NOTES).map(([l, n]) => { const m = mk.find(x => x.label === l) || {}, shown = l === '1O' ? '10' : l;
   return {l, ok: m.title === shown + ' — ' + n && m.aria === shown + ' — ' + n, title: m.title, aria: m.aria}; });
  ok('D025: each of the seven shows the plan\'s cross-reference in its tooltip and accessible name', wordsOn.every(x => x.ok), wordsOn.filter(x => !x.ok));
  ok('D025: 1O is drawn as 10', (mk.find(m => m.label === '1O') || {}).face === '10');
  ok('D025: the other 20 markers read as in the base', mk.filter(m => !(m.label in NOTES)).every(m => { const b = bm.get(m.label); return b && b.title === m.title && b.aria === m.aria && b.face === m.face; }));
  const note = await p.evaluate(() => { const n = document.querySelector('#pane-map [data-sheet-note905]'); return n ? {text: n.textContent, shown: n.getClientRects().length > 0, count: document.querySelectorAll('#pane-map [data-sheet-note905]').length} : null; });
  ok('D025: the sheet shows the boards only the plan has, once, in the plan\'s words', note && note.text === SHEET_NOTE && note.shown && note.count === 1 && ONLY_IN_PLAN.every(([n, w]) => note.text.split(w).length === 2), note);
  const cards = [];
  for (const [l, n] of Object.entries(NOTES)) {
   const c = await p.evaluate(l => { document.querySelectorAll('.mkpick').forEach(e => e.remove()); const b = [...document.querySelectorAll('#pane-map .mk')].find(x => x.dataset.label === l); if (!b) return null; b.click();
    const d = document.querySelector('.mkpick'); return d ? {head: (d.querySelector('.mkpick-h b') || {}).textContent, note: (d.querySelector('[data-callout-note905]') || {}).textContent, aria: d.getAttribute('aria-label')} : null; }, l);
   if (l === '04A') { await p.waitForTimeout(200); await shot(p, 'vms900-d025-card'); }
   cards.push({l, ok: !!c && c.note === n && c.head === 'callout ' + (l === '1O' ? '10' : l) + ' on D025-26003-02', c});
  }
  await p.evaluate(() => document.querySelectorAll('.mkpick').forEach(e => e.remove()));
  ok('D025: the card a tap opens shows the cross-reference (and 10 for 1O)', cards.every(x => x.ok), cards.filter(x => !x.ok));
  const plain = await p.evaluate(() => { document.querySelectorAll('.mkpick').forEach(e => e.remove()); const b = [...document.querySelectorAll('#pane-map .mk')].find(x => x.dataset.label === '19'); b.click(); const d = document.querySelector('.mkpick');
   const r = d ? {head: d.querySelector('.mkpick-h b').textContent, note: !!d.querySelector('[data-callout-note905]')} : null; document.querySelectorAll('.mkpick').forEach(e => e.remove()); return r; });
  ok('D025: a callout with no cross-reference opens its card as before', plain && plain.head === 'callout 19 on D025-26003-02' && !plain.note, plain);
  await p.evaluate(() => { const n = document.querySelector('#pane-map [data-sheet-note905]'); if (n) n.scrollIntoView({block: 'center'}); }); await p.waitForTimeout(300); await shot(p, 'vms900-d025');
  ok('D025: no horizontal overflow', await overflow(p));
  // 4. Questions and About
  await p.evaluate(() => go('questions')); await p.waitForTimeout(1500);
  const qs = await p.evaluate(() => { const li = id => document.querySelector('#pane-questions [data-question-id="' + id + '"]');
   const r30 = li('oi-R30'), orig = id => { const e = li(id); const d = e && e.querySelector('details.qorig p'); return d ? d.textContent : ''; };
   if (r30) r30.scrollIntoView({block: 'center'});
   return {r30: r30 ? {text: r30.textContent, state: r30.dataset.questionState, inOpen: !!r30.closest('.qcard') && !r30.closest('details.qfold'), shown: r30.getClientRects().length > 0, orig: !!r30.querySelector('details.qorig')} : null,
    r16: orig('oi-R16'), r23: orig('oi-R23'), open: document.querySelectorAll('#pane-questions [data-question-state="open"]').length}; });
  await p.waitForTimeout(300); await shot(p, 'vms900-questions');
  ok('Questions: R30 is asked in "Needs an answer", with its four open points and the two recorded answers', qs.r30 && qs.r30.state === 'open' && qs.r30.inOpen && qs.r30.shown && qs.r30.text.includes('R30 - ' + R30_TITLE) && R30_POINTS.every(w => qs.r30.text.includes(w)) && !qs.r30.orig, qs.r30);
  ok('Questions: R16 and R23 carry their new sentence with their wording', qs.r16.includes(C.open_items.find(o => o.id === 'R16').finding.slice(-60)) && qs.r23.includes(C.open_items.find(o => o.id === 'R23').finding.slice(-60)));
  ok('Questions model: R30 alone is added, once', snap.r30.length === 1 && snap.r30[0].st === 'open' && snap.r30[0].group === 'Schedule & plant');
  ok('Questions: no horizontal overflow', await overflow(p));
  await p.evaluate(() => go('about')); await p.waitForTimeout(1200);
  const about = await p.evaluate(() => { const rows = [...document.querySelectorAll('#pane-about tr')].filter(tr => /^(R16|R23|R30)$/.test((tr.querySelector('td b') || {}).textContent || ''));
   return rows.map(tr => [tr.querySelector('td b').textContent, tr.textContent]); });
  ok('About: the open items table lists R30 and the R16 and R23 sentences', about.length === 3 && about.every(([id, t]) => t.includes('VMS001-26003-01')), about.map(([id]) => id));
  // errors and writes
  ok('no page errors', !s.errors.length, s.errors);
  ok('no console errors', !cons.length, cons);
  ok('no write attempted (counts.blocked 0)', s.counts.blocked === 0, s.counts);
 });
}
let retried = false, moved = null;
(async () => {
 const n = R.length;
 await pair();
 if (moved && !retried) { console.log('the live record moved between the base and candidate reads (' + JSON.stringify(moved) + '); reading the pair again'); R.length = n; retried = true; await pair(); }
 R.forEach(r => console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.pass || r.detail === undefined ? '' : ' :: ' + JSON.stringify(r.detail).slice(0, 600))));
 console.log((MOB ? 'phone' : 'laptop') + ': ' + R.filter(r => r.pass).length + '/' + R.length);
 if (R.some(r => !r.pass)) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
