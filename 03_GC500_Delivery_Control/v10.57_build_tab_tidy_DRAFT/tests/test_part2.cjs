// Author: Andrew Fisher. v10.57 part 2 - completed Build day cards say WHAT WENT IN, by category. GET-only against the live record.
//   node test_part2.cjs path/to/page.html [evidence_dir]
// Pins the study's close-to-close numbers (study_4), the reconciliation (every category's daily came-in adds up to what is on
// site now, apart from the listed exceptions), no reference keys on any card face, Demob cards unchanged, no sideways scroll,
// no page errors, nothing on a tile cut off at 390 or 360 px. Phone run takes screenshots of the 7, 9, 15 and 16 Oct cards
// and the whole 16 Oct More info.
const {open} = require('../../toolchain/harness/open_page.js');
const path = require('path'); const fs = require('fs');
const page = process.argv[2]; const ev = process.argv[3] || path.join(__dirname, '..', 'evidence');
let pass = 0, fail = 0; const counts = {}; const ok = (tag, c, m) => { c ? pass++ : fail++; counts[tag] = counts[tag] || [0, 0]; counts[tag][c ? 0 : 1]++; console.log((c ? 'ok  ' : 'FAIL') + ' ' + tag + ': ' + m); };
(async () => {
 for (const mob of [false, true]) {
  const tag = mob ? 'phone' : 'desktop';
  const h = await open(Object.assign({pageFile: page, hash: '#timeline'}, mob ? {mobile: true, W: 390, H: 844, dpr: 2} : {})); const p = h.page;
  try {
   await p.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
   await p.waitForTimeout(5000);
   const r = await p.evaluate(async () => {
    const wait = ms => new Promise(res => setTimeout(res, ms));
    const card = iso => document.querySelector('#pane-timeline .day.past984[data-day="' + iso + '"]');
    const past = [...document.querySelectorAll('#pane-timeline .day.past984[data-day]')];
    const tilesOf = c => { const o = {}; (c ? [...c.querySelectorAll('.dc1057-tile')] : []).forEach(x => { o[x.getAttribute('data-cat1057')] = {n: parseFloat(x.querySelector('.dc1057-n').firstChild.textContent), unit: (x.querySelector('.dc1057-n small') || {}).textContent || '', name: x.querySelector('.dc1057-k').textContent, sub: (x.querySelector('.dc1057-s') || {}).textContent || ''}; }); return o; };
    const days = {}; past.forEach(c => { days[c.getAttribute('data-day')] = tilesOf(c); });
    const face = iso => { const c = card(iso); const w = c && c.querySelector('.bc986-work'); return w ? w.innerText.replace(/\s+/g, ' ').trim() : ''; };
    const flag16 = ((card('2026-10-16') || document).querySelector('.dc1057-flag') || {}).textContent || '';
    // the card face never names a reference
    const keys = [...new Set(allAssets().map(a => a && a.key).filter(Boolean))];
    const keyRe = new RegExp('(^|[^A-Za-z0-9])(' + keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![A-Za-z0-9])');
    const keyHits = past.map(c => { const t = (c.querySelector('.bc986-work') || {}).innerText || ''; const m = t.match(keyRe); return m ? c.getAttribute('data-day') + ':' + m[2] : null; }).filter(Boolean);
    const headings = [...new Set(past.map(c => (c.querySelector('.bc986-work-heading') || {}).textContent))];
    const oldRows = past.reduce((n, c) => n + c.querySelectorAll('.bc986-work-row, .bc986-work-more').length, 0);
    const notPast = [...document.querySelectorAll('#pane-timeline .day[data-day]:not(.past984)')];
    const notPastTiles = notPast.reduce((n, c) => n + c.querySelectorAll('.dc1057-tile').length, 0);
    const notPastHeads = [...new Set(notPast.map(c => (c.querySelector('.bc986-work-heading') || {}).textContent))];
    // tiles fit inside the card
    const spill = past.filter(c => { const cr = c.getBoundingClientRect(); return [...c.querySelectorAll('.dc1057-tile')].some(x => { const r = x.getBoundingClientRect(); return r.width > 0 && (r.right > cr.right + 0.5 || r.left < cr.left - 0.5); }); }).map(c => c.getAttribute('data-day'));
    // nothing on a tile is cut off or hidden: every word of the short line shows, no part pokes out of its tile
    const clipped = window.__clip1057 = () => [...document.querySelectorAll('#pane-timeline .day.past984 .dc1057-tile')].filter(x => { const s = x.querySelector('.dc1057-s'), k = x.querySelector('.dc1057-k'), n = x.querySelector('.dc1057-n'), tr = x.getBoundingClientRect();
     return (s && s.scrollHeight > s.clientHeight + 1) || k.scrollWidth > k.clientWidth + 1 || n.scrollWidth > n.clientWidth + 1 || [...x.querySelectorAll('.dc1057-p')].some(p => p.getBoundingClientRect().right > tr.right - 2); })
     .map(x => x.closest('.day').getAttribute('data-day') + ':' + x.getAttribute('data-cat1057'));
    const clip390 = clipped(), tileW = [...document.querySelectorAll('#pane-timeline .day.past984 .dc1057-tile')].map(x => Math.round(x.getBoundingClientRect().width));
    // the day object: v10.56's per-reference rows and 'Came in:' details are gone, category rows first
    const t = todayIso();
    const w7 = BuildWork986.day('2026-10-07', t), w9 = BuildWork986.day('2026-10-09', t);
    const arrivalLeft = past.some(c => { const w = BuildWork986.day(c.getAttribute('data-day'), t); return (w.rows || []).some(x => x.kind === 'arrival') || (w.details || []).some(d => d.kind === 'arrival' || /^Came in: /.test(d.label || '')); });
    // More info for chosen days
    const more = async iso => { card(iso).click(); await wait(900); const b = document.querySelector('#pane-timeline .bc984-more'); if (b) b.open = true; await wait(150); const s = b && b.querySelector('.dc1057-details'); return s ? s.innerText.replace(/[ \t]+/g, ' ') : (b ? 'NO-1057 ' + b.innerText.slice(0, 300) : 'NO-BOX'); };
    const m7 = await more('2026-10-07'), m16 = await more('2026-10-16'), m11 = await more('2026-09-11'), m3 = await more('2026-10-03'), m8 = await more('2026-10-08'), m9 = await more('2026-10-09'), m25 = await more('2026-09-25');
    // reconciliation: the sum of every past card's came-in against what is on site now
    const sum = {}; Object.values(days).forEach(o => Object.entries(o).forEach(([id, x]) => { sum[id] = (sum[id] || 0) + x.n; const m = x.sub.match(/\+(\d+) waste tanks?/); if (m) sum.tanks = (sum.tanks || 0) + Number(m[1]); }));
    const off = {}; past.forEach(c => { const w = BuildWork986.day(c.getAttribute('data-day'), t); ((w.cats1057 || {}).off || []).forEach(o => { off[o.cat] = (off[o.cat] || 0) + o.n; }); });
    const met = todayWorkMetrics840(), metrics = {}; for (let i = 0; i < 8; i++) if (met[i]) metrics[met[i].id] = met[i].done;
    const now = {forklifts: 0, trakmat: 0, furniture: 0, tanks: 0}, litToday = {};
    holdAssets(() => physicalCountAssets963(allAssets()).assets.filter(a => !a._cancelled && !a.relocation && !a.rest_of).forEach(a => {
     const d = deliveryOf(a.key), hist = histOf(a.key, 'history'), on = d && d.recorded && d.state === 'on site' && !(d.where === 'rental' && hist.length > 0);
     const toilet = a.product === 'Toilet' || a.discipline === 'Toilets & amenities', tr = toilet ? toiletRows962(a, d, chargeLines(a), t) : null;
     const firstOn = hist.filter(x => x.state === 'on site').map(x => isoIn(x.at)).sort()[0];
     chargeLines(a).forEach(l => { let k = null; try { k = Unload929.kindOf(l.item, a); } catch (x) {}
      const id = k === 'forklift' ? 'forklifts' : k === 'trakmat' ? 'trakmat' : (k === 'fridge' || k === 'chair') ? 'furniture' : k === 'waste_tank' ? 'tanks' : null; if (!id) return;
      let q = 0; if (tr) { const rr = tr.rows.find(x => x.item === l.item); q = rr ? rr.arrived : 0; }
      else if (on) { const rs = (((S.supplied || {})[a.key] || {}).items || []).filter(x => x.asked === l.item); q = rs.length === 1 && String(rs[0].qty_supplied ?? '').trim() !== '' && Number.isInteger(Number(rs[0].qty_supplied)) ? Number(rs[0].qty_supplied) : (qtyOf(l) ?? 1); }
      now[id] += q; if (q && firstOn === t) { litToday[id] = (litToday[id] || 0) + q; litToday[id + 'Refs'] = (litToday[id + 'Refs'] || []).concat(a.key); } });
    }));
    const seen = new Map(); allDockets().forEach(d => { if (d && d.usable === true && /^\d{4}-\d{2}-\d{2}$/.test(d.date || '') && d.date < t) { const id = String(d.docket_no || d.id); if (!seen.has(id)) seen.set(id, d); } });
    let clean = 0, ccb = 0; seen.forEach(d => { const q = d.quantities || {}; clean += Number(q.clean) > 0 ? Number(q.clean) : 0; ccb += ['ccb_event', 'ccb_demarc', 'flat_feet'].reduce((s, k) => s + (Number(q[k]) > 0 ? Number(q[k]) : 0), 0); });
    // cost of the count across every past day, inside the page's own hold
    const isos = past.map(c => c.getAttribute('data-day')); let t0 = performance.now(); holdAssets(() => isos.forEach(iso => daycats1057.day0(iso, t))); const msBase = performance.now() - t0;
    t0 = performance.now(); holdAssets(() => isos.forEach(iso => BuildWork986.day(iso, t))); const msNew = performance.now() - t0;
    // Demob cards: each card's work block is exactly what the original card function writes for its rows
    location.hash = '#demob'; await wait(2500);
    const dcs = [...document.querySelectorAll('#pane-demob .dc996-day')];
    const demob = dcs.map(c => { const wEl = c.querySelector('.bc986-work'); if (!wEl) return 'none'; const head = wEl.querySelector('.bc986-work-heading').textContent;
     const rows = [...wEl.querySelectorAll('.bc986-work-row')].map(x => ({label: x.querySelector('.bc986-work-label').textContent, value: x.querySelector('.bc986-work-value').textContent}));
     const tmp = document.createElement('div'); tmp.innerHTML = daycats1057.card0({heading: head, rows, issues: []}); return tmp.innerHTML === wEl.outerHTML ? 'same' : 'diff:' + head; });
    const demobTiles = document.querySelectorAll('#pane-demob .dc1057-tile').length;
    const sampleWork = {heading: 'COLLECTION RECORD', rows: [{label: 'Refs with collections', value: 3}, {label: 'Planned known refs', value: 4}], issues: [], details: [{kind: 'x', label: 'y', refs: [], source: 'z'}]};
    const identity = BuildWorkView986.card(sampleWork) === daycats1057.card0(sampleWork) && BuildWorkView986.details(sampleWork) === daycats1057.details0(sampleWork);
    location.hash = '#timeline'; await wait(2000);
    return {days, faces: {'2026-10-16': face('2026-10-16'), '2026-10-07': face('2026-10-07')}, flag16, keyHits, headings, oldRows, notPastTiles, notPastHeads, spill, arrivalLeft, clip390, tileW: [Math.min(...tileW), Math.max(...tileW)],
     w7first: (w7.rows || []).slice(0, 4).map(x => x.kind + ':' + x.label + ' ' + x.value), w9first: (w9.rows || []).slice(0, 3).map(x => x.kind + ':' + x.label + ' ' + x.value),
     m7, m16, m11, m3, m8, m9, m25, sum, off, metrics, now, litToday, clean, ccb, msBase, msNew, n: past.length, demob, demobTiles, identity,
     over: document.documentElement.scrollWidth > window.innerWidth + 1, script: !!document.getElementById('daycats1057-script'), v: window.daycats1057 && window.daycats1057.version};
   });
   const d = r.days, T = (iso, id) => (d[iso] || {})[id] || null, N = (iso, id) => (T(iso, id) || {n: null}).n;
   const show = iso => Object.entries(d[iso] || {}).map(([k, x]) => x.name + ' ' + x.n + x.unit).join(', ');
   ok(tag, r.script && /^v10\.5[7-9]$/.test(r.v || ''), 'part 2 script present (' + r.v + ')');
   ok(tag, r.n >= 35, 'completed Build cards on the Timeline: ' + r.n);
   ok(tag, r.headings.length === 1 && r.headings[0] === 'WHAT WENT IN', 'every completed card is headed WHAT WENT IN: ' + JSON.stringify(r.headings));
   ok(tag, r.oldRows === 0, 'no v10.56 per-reference rows or "+n more" on any completed card (' + r.oldRows + ')');
   ok(tag, !r.arrivalLeft, 'no arrival rows or "Came in:" details left in any completed day');
   ok(tag, r.keyHits.length === 0, 'no reference keys on any card face' + (r.keyHits.length ? ': ' + r.keyHits.slice(0, 5).join(' ') : ''));
   // the study's numbers (study_4, close to close)
   ok(tag, N('2026-09-21', 'buildings') === 4 && N('2026-09-21', 'barriers') === 34 && N('2026-09-21', 'fencing') === 377.5 && !T('2026-09-21', 'toilets'), '21 Sep Buildings 4, Water barriers 34, Fencing 377.5 m, no toilets (rental dates lose to the lights): ' + show('2026-09-21'));
   ok(tag, /4 × 4\.8m/.test((T('2026-09-21', 'buildings') || {}).sub || ''), '21 Sep buildings read "4 × 4.8m": ' + ((T('2026-09-21', 'buildings') || {}).sub));
   ok(tag, N('2026-10-07', 'buildings') === 6 && N('2026-10-07', 'toilets') === 3 && N('2026-10-07', 'generators') === 1 && !T('2026-10-07', 'ccb'), '7 Oct Buildings 6, Toilets 3, Generators 1: ' + show('2026-10-07'));
   ok(tag, /\+2 waste tanks/.test((T('2026-10-07', 'toilets') || {}).sub || '') && /2 blocks/.test(T('2026-10-07', 'toilets').sub) && /1 accessible/.test(T('2026-10-07', 'toilets').sub), '7 Oct toilets line in item words with the waste tanks: ' + ((T('2026-10-07', 'toilets') || {}).sub));
   ok(tag, N('2026-10-07', 'fencing') === 410 && /327\.5 m scrimmed/.test(T('2026-10-07', 'fencing').sub) && /2 ped gates/.test(T('2026-10-07', 'fencing').sub), '7 Oct Fencing 410 m (scrim never added), "327.5 m scrimmed · 2 ped gates": ' + ((T('2026-10-07', 'fencing') || {}).sub));
   ok(tag, /50 kVA/.test((T('2026-10-07', 'generators') || {}).sub || ''), '7 Oct generator 50 kVA');
   ok(tag, N('2026-10-09', 'toilets') === 9 && /6 pee panels/.test(T('2026-10-09', 'toilets').sub) && N('2026-10-09', 'ccb') === 179.5, '9 Oct Toilets 9 by receipt (no arrival row that day), Crowd barriers 179.5 m: ' + show('2026-10-09'));
   ok(tag, r.w9first[0] && /^cat1057:Toilets 9$/.test(r.w9first[0]), '9 Oct category rows go in even with no arrival row: ' + JSON.stringify(r.w9first));
   ok(tag, N('2026-10-13', 'toilets') === 17 && N('2026-10-13', 'ccb') === 765.5 && /672\.5 demarcation/.test(T('2026-10-13', 'ccb').sub) && /93 flat feet/.test(T('2026-10-13', 'ccb').sub), '13 Oct Toilets 17 (WC69 re-set light adds nothing), Crowd barriers 765.5 m: ' + show('2026-10-13'));
   ok(tag, N('2026-10-14', 'buildings') === 4 && N('2026-10-14', 'toilets') === 24 && N('2026-10-14', 'ccb') === 392.5, '14 Oct Buildings 4, Toilets 24 (WC51 receipt day), Crowd barriers 392.5 m: ' + show('2026-10-14'));
   ok(tag, N('2026-10-15', 'buildings') === 3 && N('2026-10-15', 'toilets') === 21 && N('2026-10-15', 'barriers') === 154 && N('2026-10-15', 'generators') === 1 && N('2026-10-15', 'fencing') === 777.5 && N('2026-10-15', 'ccb') === 200, '15 Oct Buildings 3, Toilets 21, Water barriers 154, Generators 1, Fencing 777.5 m, Crowd barriers 200 m: ' + show('2026-10-15'));
   ok(tag, /20 FWF/.test((T('2026-10-15', 'toilets') || {}).sub || '') && /1 accessible/.test(T('2026-10-15', 'toilets').sub), '15 Oct toilets "20 FWF · 1 accessible"');
   ok(tag, N('2026-10-16', 'toilets') === 38 && N('2026-10-16', 'barriers') === 27 && N('2026-10-16', 'vms') === 2 && N('2026-10-16', 'forklifts') === 2 && N('2026-10-16', 'trakmat') === 10 && N('2026-10-16', 'fencing') === 702.5 && N('2026-10-16', 'ccb') === 302.5, '16 Oct Toilets 38, Water barriers 27, VMS 2, Forklifts 2, Track mat 10, Fencing 702.5 m, Crowd barriers 302.5 m: ' + show('2026-10-16'));
   ok(tag, Object.keys(d['2026-10-16'] || {}).join(',') === 'toilets,barriers,vms,forklifts,trakmat,fencing,ccb', '16 Oct: all 7 tiles in Andrew\'s order, fencing last: ' + Object.keys(d['2026-10-16'] || {}).join(','));
   ok(tag, /5 of 9 VMS boards/.test(r.flag16) && /no site light/.test(r.flag16) && /not counted/.test(r.flag16), '16 Oct amber note for the receipt with no site light (T0158), not counted: ' + r.flag16);
   ok(tag, N('2026-09-15', 'buildings') === 2, '15 Sep Buildings 2 (CP1 re-set light not counted again): ' + show('2026-09-15'));
   ok(tag, N('2026-09-23', 'buildings') === 1, '23 Sep Buildings 1 (P41 re-set): ' + show('2026-09-23'));
   ok(tag, N('2026-09-28', 'buildings') === 4, '28 Sep Buildings 4 (P01 same-second toggle): ' + show('2026-09-28'));
   ok(tag, Object.keys(d['2026-10-05'] || {}).filter(k => !['fencing', 'ccb', 'fencework'].includes(k)).length === 0, '5 Oct: no came-in tile (T0085 on and off at 06:26): ' + (show('2026-10-05') || 'none'));
   ok(tag, !T('2026-09-25', 'forklifts') && N('2026-09-25', 'toilets') === 3, '25 Sep: no Forklifts (FL01/FL02 are aliases of T0003/T0004), Toilets 3: ' + show('2026-09-25'));
   ok(tag, N('2026-09-14', 'toilets') === 18 && N('2026-09-26', 'toilets') === 1, '14 Sep Toilets 18 (WC06 waits for its light), 26 Sep Toilets 1 (T0024): ' + N('2026-09-14', 'toilets') + ', ' + N('2026-09-26', 'toilets'));
   ok(tag, N('2026-09-11', 'towers') === 5 && N('2026-09-11', 'forklifts') === 2, '11 Sep Lighting towers 5 and Forklifts 2 from the rental on-hire date (never had a site light): ' + show('2026-09-11'));
   ok(tag, r.w7first.length && r.w7first.every(x => /^cat1057:/.test(x)), '7 Oct day object leads with category rows: ' + JSON.stringify(r.w7first));
   // More info: each reference, its quantity and where the number came from; other work kept there
   ok(tag, /Buildings 6/.test(r.m7) && /P55 · Gate 1 Ticket Box · 1 × Ticket Box 6m\s*Site light 08:32/.test(r.m7) && /WC20 .*2 × Toilet Block 6m/.test(r.m7) && /Waste tanks 2/.test(r.m7), '7 Oct More info: per category, each reference with quantity and site light time');
   ok(tag, /Installed\s*9 refs/.test(r.m7) && /Levelled\s*6 refs/.test(r.m7) && /Stairs fitted\s*6 refs/.test(r.m7) && /Service note 24472/.test(r.m7) && /Hire agreement 36579/.test(r.m7) && !/Came in:/.test(r.m7), '7 Oct More info keeps installed, levelled, stairs, service notes and dockets; no "Came in:"');
   ok(tag, /Fencing 410 m · from the dockets/.test(r.m7) && /F-AFV-0026/.test(r.m7), '7 Oct fencing heading ties the 410 m to its dockets');
   ok(tag, /WC09 · Toilets · 6 × FWF\s*Receipt 10:58/.test(r.m16) && /4 counted earlier/.test(r.m16) && /TM01 .*10 × Trakmat\s*Site light 10:40 · Receipt 10:40 says 10 \(the charge line says 1\)/.test(r.m16), '16 Oct More info: WC09 top-up by receipt, TM01 receipt against its charge line');
   ok(tag, /Receipts with no site light · not counted/.test(r.m16) && /T0158 .*5 of 9 VMS receipted/.test(r.m16), '16 Oct More info names T0158 under receipts with no site light');
   ok(tag, /Rental system on-hire date/.test(r.m11), '11 Sep More info says the rental on-hire date is the source');
   ok(tag, /Went off/.test(r.m3) && /T0085 .*3\.5T Forklift Std\s*Site light set to not on site 20:12/.test(r.m3), '3 Oct More info: T0085 went off 20:12');
   ok(tag, /WC09 .*4 × FWF\s*Site light 11:23 · 4 of 10 by the programme row for the day, 6 held for a later row \(not a site count\)/.test(r.m8), '8 Oct More info: WC09\'s 4 FWF come from the programme row, not a site count');
   ok(tag, /WC31 .*2 × 16Pan Block\s*Receipt 11:05 · site light since 25 Sep/.test(r.m9) && /Work on existing fence/.test(r.m9), '9 Oct More info: WC31 by receipt with its earlier light; fence relocation kept apart');
   // reconciliation: sum of daily came-in = on site now, apart from the listed exceptions
   const s = r.sum, m = r.metrics, n = r.now, lt = r.litToday;
   ok(tag, s.buildings === m.buildings && s.toilets === m.toilets && s.barriers === m.barriers && s.generators === m.generators && (s.towers || 0) === m.lighting && (s.vms || 0) === m.vms,
    'reconciles with Build progress on site now: Buildings ' + s.buildings + '/' + m.buildings + ', Toilets ' + s.toilets + '/' + m.toilets + ', Water barriers ' + s.barriers + '/' + m.barriers + ', Generators ' + s.generators + '/' + m.generators + ', Lighting towers ' + s.towers + '/' + m.lighting + ', VMS ' + s.vms + '/' + m.vms);
   ok(tag, (s.trakmat || 0) === n.trakmat && (s.tanks || 0) === n.tanks, 'reconciles with the site record now: Track mat ' + s.trakmat + '/' + n.trakmat + ', Waste tanks ' + s.tanks + '/' + n.tanks);
   ok(tag, s.forklifts - (r.off.Forklifts || 0) === n.forklifts && (r.off.Forklifts || 0) === 1, 'Forklifts ' + s.forklifts + ' came in, ' + (r.off.Forklifts || 0) + ' went off (exception: T0085 off 3 Oct, back 6 Oct) = ' + n.forklifts + ' on site now');
   ok(tag, (s.furniture || 0) + (lt.furniture || 0) === n.furniture, 'Furniture ' + (s.furniture || 0) + ' on past cards + ' + (lt.furniture || 0) + ' with today\'s site light (exception: ' + (lt.furnitureRefs || []).join(', ') + ' set 17 Oct, today\'s card) = ' + n.furniture + ' on site now');
   ok(tag, s.fencing === r.clean && s.ccb === r.ccb, 'Fencing ' + s.fencing + ' m and Crowd barriers ' + s.ccb + ' m = every dated docket before today (' + r.clean + ' m, ' + r.ccb + ' m)');
   // untouched: Demob cards, today and upcoming
   ok(tag, r.demob.length >= 10 && r.demob.every(x => x === 'same') && r.demobTiles === 0, 'Demob cards unchanged: ' + r.demob.filter(x => x === 'same').length + ' of ' + r.demob.length + ' work blocks match the original card exactly');
   ok(tag, r.identity, 'a work object without categories renders exactly as before (card and More info)');
   ok(tag, r.notPastTiles === 0 && !r.notPastHeads.includes('WHAT WENT IN'), 'today and upcoming cards unchanged: ' + JSON.stringify(r.notPastHeads));
   ok(tag, r.spill.length === 0, 'tiles sit inside their card' + (r.spill.length ? ': ' + r.spill.join(' ') : ''));
   ok(tag, r.clip390.length === 0, 'nothing on any tile is cut off (tiles ' + r.tileW.join('-') + ' px wide)' + (r.clip390.length ? ': ' + r.clip390.join(' ') : ''));
   if (mob) {
    await p.setViewportSize({width: 360, height: 800}); await p.waitForTimeout(1500);
    const c360 = await p.evaluate(() => ({clip: window.__clip1057(), over: document.documentElement.scrollWidth > window.innerWidth + 1, w: [...document.querySelectorAll('#pane-timeline .day.past984 .dc1057-tile')].map(x => Math.round(x.getBoundingClientRect().width))}));
    ok(tag, c360.clip.length === 0 && !c360.over, 'at 360 px nothing on any tile is cut off and no sideways scroll (tiles ' + Math.min(...c360.w) + ' px)' + (c360.clip.length ? ': ' + c360.clip.join(' ') : ''));
    await p.setViewportSize({width: 390, height: 844}); await p.waitForTimeout(800);
   }
   ok(tag, /FL01 · Forklift 5T\s*Site light 15:39 · the same delivery as T0003, counted under T0003 · not counted/.test(r.m25) && /FL02 · Forklift 2\.5T\s*Site light 15:40 · the same delivery as T0004/.test(r.m25), '25 Sep More info still shows the FL01/FL02 site lights, as the same deliveries as T0003/T0004 (a rule never hides a record)');
   ok(tag, ((T('2026-09-30', 'generators') || {}).sub || '') === '350 kVA · 150 kVA · 60 kVA' && /2 × 16-pan block/.test((T('2026-10-09', 'toilets') || {}).sub || ''), 'item words read cleanly: 30 Sep "' + ((T('2026-09-30', 'generators') || {}).sub) + '", 9 Oct "' + ((T('2026-10-09', 'toilets') || {}).sub) + '"');
   ok(tag, !r.over, 'no sideways scroll');
   ok(tag, r.msNew - r.msBase < 2500, 'cost of the count for ' + r.n + ' days: ' + Math.round(r.msNew) + ' ms against ' + Math.round(r.msBase) + ' ms before');
   ok(tag, h.errors.length === 0, 'no page errors ' + h.errors.slice(0, 3).join(' | '));
   if (mob) {
    fs.mkdirSync(ev, {recursive: true});
    for (const iso of ['2026-10-07', '2026-10-15', '2026-10-16']) {
     await p.setViewportSize({width: 390, height: 2300});
     await p.evaluate(iso => { const c = document.querySelector('#pane-timeline .day.past984[data-day="' + iso + '"]'); c.click(); }, iso); await p.waitForTimeout(500);
     await p.evaluate(iso => document.querySelector('#pane-timeline .day.past984[data-day="' + iso + '"]').scrollIntoView({block: 'center', inline: 'center'}), iso); await p.waitForTimeout(1200);
     await (await p.$('#pane-timeline .day.past984[data-day="' + iso + '"]')).screenshot({path: path.join(ev, 'p2_card_' + iso.slice(5) + '_phone.png')});
    }
    // the More info box is taller than a phone screen and scrolls inside <main> under the header: make the window tall
    // enough that <main> shows all of it, so the whole box is painted
    const mh = await p.evaluate(() => { const b = document.querySelector('#pane-timeline .bc984-more'); b.open = true; const m = document.querySelector('main'); return Math.ceil(document.querySelector('#pane-timeline .dc1057-details').getBoundingClientRect().height) + (m ? window.innerHeight - m.clientHeight : 0); });
    await p.setViewportSize({width: 390, height: Math.min(mh + 160, 7000)}); await p.waitForTimeout(800);
    await p.evaluate(() => document.querySelector('#pane-timeline .dc1057-details').scrollIntoView({block: 'start'})); await p.waitForTimeout(800);
    await (await p.$('#pane-timeline .dc1057-details')).screenshot({path: path.join(ev, 'p2_moreinfo_10-16_phone.png')});
    await p.evaluate(() => { const c = document.querySelector('#pane-timeline .day.past984[data-day="2026-10-09"]'); c.click(); }); await p.waitForTimeout(500);
    await p.setViewportSize({width: 390, height: 2300}); await p.waitForTimeout(500);
    await p.evaluate(() => document.querySelector('#pane-timeline .day.past984[data-day="2026-10-09"]').scrollIntoView({block: 'center', inline: 'center'})); await p.waitForTimeout(1200);
    await (await p.$('#pane-timeline .day.past984[data-day="2026-10-09"]')).screenshot({path: path.join(ev, 'p2_card_10-09_phone.png')});
    await p.setViewportSize({width: 390, height: 844});
    console.log('screenshots in ' + ev);
   }
  } finally { await h.browser.close(); }
 }
 console.log(Object.entries(counts).map(([k, v]) => k + ' ' + v[0] + '/' + (v[0] + v[1])).join(' · '));
 console.log(`${pass}/${pass + fail} passed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
