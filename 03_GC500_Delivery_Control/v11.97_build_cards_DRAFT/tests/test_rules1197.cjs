// Author: Andrew Fisher. v11.97 rules: the delivery-window core on the real Coates booking texts carried by the built page,
// and the weather extension against the v9.84 archive. Reads files only; no browser, no network, no record.
//   node tests/test_rules1197.cjs build/GC500_v11.97/GC500_Delivery_Control_hosted.html
const fs = require('fs'), path = require('path'), vm = require('vm');
const HERE = path.resolve(__dirname, '..');
const page = fs.readFileSync(process.argv[2] || path.join(HERE, '..', 'build', 'GC500_v11.97', 'GC500_Delivery_Control_hosted.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('ok   ' + m); } else { fail++; console.log('FAIL ' + m); } };

// the core, as built into the page
const s = page.indexOf('<script id="cards1197-script">'), src = page.slice(page.indexOf('>', s) + 1, page.indexOf('</script>', s));
const ctx = {}; vm.createContext(ctx); vm.runInContext(src, ctx);
const B = ctx.BW1197;
ok(B && typeof B.forLoad === 'function' && typeof B.dayModel === 'function', 'the core loads on its own (no document)');

// the Coates booking texts the page carries (ontime1057)
const o = page.indexOf('id="ontime1057-script"'), a = page.indexOf('T = ', o) + 4;
const T = (() => { let depth = 0, i = a, str = false, q = ''; for (; i < page.length; i++) { const c = page[i];
  if (str) { if (c === '\\') { i++; continue; } if (c === q) str = false; continue; }
  if (c === '"' || c === "'") { str = true; q = c; continue; } if (c === '{') depth++; else if (c === '}') { depth--; if (!depth) break; } }
  return JSON.parse(page.slice(a, i + 1)); })();
ok(T.units.length === 126 && T.export_at === '22 Oct 2026 04:57', 'the booking texts are the 126 units exported 22 Oct 2026 04:57');
const by = B.index(T.units);
const words = (iso, refs, carrier, pair) => B.lines(B.forLoad(by, iso, refs, carrier, pair)).map(B.said);

// Andrew's words, on the loads
ok(JSON.stringify(words('2026-09-14', ['P05'], 'SFL')) === JSON.stringify(['Delivery booked between 05:00 and 08:00 · Re-booked 05:00–10:00 · Coates text 9 Sep 13:29']), '14 Sep P05: booked 05:00–08:00, re-booked 05:00–10:00');
ok(JSON.stringify(words('2026-09-14', ['P01'], 'IRWINS SUPER TILT')) === JSON.stringify(['Delivery booked between 04:30 and 07:30']), '14 Sep P01: one of P01/P03, both texts 04:30–07:30, so certain');
const wc05 = words('2026-09-14', ['WC05'], 'SFL');
ok(wc05.length === 2 && wc05[0].startsWith('Waste tank: delivery booked between 08:00 and 12:30') && wc05[1].startsWith('Toilet block: delivery booked between 08:30 and 11:30 · Re-booked 08:30–13:00'), '14 Sep WC05: waste tank and toilet block each with its own window');
ok(JSON.stringify(words('2026-09-14', ['CP1'], 'SFL')) === JSON.stringify(['Delivery booked between 08:30 and 11:30 · Re-booked 08:30–13:00 · Coates text 9 Sep 13:30']), '14 Sep CP1: two texts, one window, one line');
ok(words('2026-09-21', ['P16'], 'KEV')[0] === 'Delivery booked between 12:00 and 15:00 · Re-booked for 22 Sep 09:00–15:00 · Coates text 21 Sep 12:54', '21 Sep P16: re-booked to the next day is named');
ok(words('2026-10-19', ['GN04'], '')[0] === 'Delivery booked between 09:00 and 12:00 · one Coates text for GN04, GN10, GN19, GN24 or GN25', '19 Oct GN04: one text for five generators says so');
ok(words('2026-10-21', ['WB14'], '')[0] === 'Delivery booked between 09:00 and 12:00 or 10:30 and 13:30 · 2 Coates texts for WB14, WB15 or WB16', '21 Oct WB14: two texts for three references give both windows');
ok(words('2026-10-08', ['WC09'], 'Event Portables').length === 0, '8 Oct WC09 Event Portables load: no Coates window');
ok(words('2026-09-18', ['WB03'], 'teams').length === 0, 'team gear: no Coates window');
ok(JSON.stringify(words('2026-09-28', ['P06'], 'SFL')) === JSON.stringify(['No Coates booking text for this delivery']), '28 Sep P06: delivered with no booking text, said so');
ok(words('2026-10-25', ['WB17'], '').length === 0 && words('2026-09-11', ['T0002'], '').length === 0, 'no text that day: nothing shown');
const paired = B.lines(B.forLoad(by, '2026-10-16', ['WB04'], '', u => u.id === '1016-97' ? 'WB04' : u.id === '1016-98' ? 'WB05' : null));
ok(paired.length === 1 && B.said(paired[0]) === 'Delivery booked between 06:30 and 09:30 · matched by arrival order', '16 Oct WB04: the on-time pairing is used and said (the two texts differ)');

// the day card model, against the on-time figures it is handed
const M = {counted: [{u: {id: 'a'}, arr: 400, in: true}, {u: {id: 'b'}, arr: 700, in: false, lateBy: 40}, {u: {id: 'c'}, failed: true}, {u: {id: 'd'}, laterDay: true}], aside: [{u: {id: 'e'}}]};
const units = [{id: 'a', w: ['06:00', '09:00']}, {id: 'b', w: ['08:00', '11:00']}, {id: 'c', w: ['07:00', '10:00'], f: '07:59'}, {id: 'd', w: ['12:00', '15:00']}, {id: 'e', w: ['07:00', '10:00']}, {id: 'f', w: ['13:00', '16:00']}, {id: 'g'}];
const m = B.dayModel(units, M);
ok(m.n === 6 && m.first === 360 && m.last === 960, 'day model: six booked windows, 06:00 to 16:00 (a text with no window is left out)');
ok(JSON.stringify(m.states) === JSON.stringify({in: 1, late: 1, failed: 1, later: 1, notext: 1, aside: 1}), 'day model: every state from the on-time figures');
ok(m.lo === 240 && m.hi === 1080, 'day model: the time line runs 04:00 to 18:00');
ok(B.dayModel([{id: 'z', w: ['03:30', '05:00']}], null).lo === 180 && B.dayModel([{id: 'z', w: ['16:00', '19:10']}], null).hi === 1200, 'day model: the line widens to the hour for an early or late window');
const lanes = B.packLanes([{s: 300, e: 480, state: 'in', arr: 470}, {s: 510, e: 600, state: 'in', arr: 590}, {s: 400, e: 500, state: 'later'}, {s: 900, e: 960, state: 'notext', arr: null}]);
ok(lanes.length === 2 && lanes[0].length === 3 && lanes[1].length === 1, 'lanes: bars 20 minutes clear share a lane; a later-day bar runs to the edge');
ok(B.dayModel([{id: 'x'}], null) === null && B.dayModel([], null) === null, 'day model: no booked window, no row');
// every Build day with a booking text gets a row; the counts tie to the texts
const days = Object.keys(by).filter(d => d < '2026-10-23');
ok(days.every(d => { const mm = B.dayModel(by[d], null); return mm && mm.n === by[d].filter(u => B.okWin(u.w)).length; }), 'all ' + days.length + ' days with booking texts make a day model of every booked window');

// the weather: 10-22 Oct added to the v9.84 archive, the archived rows untouched
const k = page.indexOf('Reviewed historical station observations; no forecast substitution or record writes.'), b = page.indexOf('const ARCHIVE = ', k) + 16;
const arch = (() => { let depth = 0, i = b, str = false; for (; i < page.length; i++) { const c = page[i];
  if (str) { if (c === '\\') { i++; continue; } if (c === '"') str = false; continue; } if (c === '"') { str = true; continue; }
  if (c === '{') depth++; else if (c === '}') { depth--; if (!depth) break; } } return JSON.parse(page.slice(b, i + 1)); })();
const old = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'v9.84_past_day_reference_LIVE', 'history984.json'), 'utf8'));
const ext = JSON.parse(fs.readFileSync(path.join(HERE, 'history1197.json'), 'utf8'));
ok(arch.coverage.from === '2026-09-07' && arch.coverage.through === '2026-10-22', 'weather archive covers 7 Sep to 22 Oct');
ok(Object.keys(old.days).every(d => JSON.stringify(arch.days[d]) === JSON.stringify(old.days[d])), 'all 33 archived rows unchanged');
const added = Object.keys(arch.days).filter(d => !old.days[d]).sort();
ok(added.length === 13 && added[0] === '2026-10-10' && added[12] === '2026-10-22', 'thirteen days added, 10 to 22 Oct');
ok(added.every(d => arch.days[d].source_id === ext.source_id && arch.days[d].kind === 'unknown' && arch.days[d].sky_recorded === false && arch.days[d].src === 'bom-history'), 'added rows: their own source, no sky classified (v9.84 rule)');
ok(arch.sources[ext.source_id] && arch.sources[ext.source_id].station_id === '040764' && /IDCJDW4050\.202610/.test(arch.sources[ext.source_id].data_url) && /^[0-9a-f]{64}$/.test(arch.sources[ext.source_id].snapshot_sha256), 'source: Bureau Gold Coast Seaway 040764, October file, snapshot hash kept');
const d14 = arch.days['2026-10-14'];
ok(d14.min_c === 18.8 && d14.max_c === 26.3 && d14.gust_kph === 59 && d14.gust_direction === 'SSE' && d14.rain_to_9am_mm === 0.6 && d14.wind_kph === 39, '14 Oct reads as the Bureau file: 18.8° / 26.3°, gust SSE 59 km/h, 0.6 mm');
ok(added.every(d => arch.days[d].partial === false && arch.days[d].observations === 2), 'every added day complete (two observations, no blanks)');

// hygiene
ok(!/\b0?4\d{2}[ ]?\d{3}[ ]?\d{3}\b/.test(src), 'no phone numbers in the source');
ok(!/claude|codex|openai|gpt/i.test(src + fs.readFileSync(path.join(HERE, 'cards1197.css'), 'utf8')), 'no assistant names in the source');
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
