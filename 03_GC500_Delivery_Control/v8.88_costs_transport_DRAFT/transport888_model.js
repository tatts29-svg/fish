/* Author: Andrew Fisher. v8.88 Transport: ONE model for every load Coates pays a carrier for, read by the Forecast P&L
 * (moneySummary_), Costs to job end (cj764Model776Held), the Finance handover (fh866Model) and the Transport tab.
 * Every row is a schedule row: a load on a reference, a stand-in row with no reference, or a fencing semi to Phillip
 * Park. The to-date figure, the forecast and the branch of each load are worked out here once, so no card can drift
 * from another. The rules are the P&L's own, unchanged:
 *  - to date: every schedule row with a TPORT COST figure is a load Coates pays for, at the figure written (a plus is
 *    the figure and more); Internal is a Coates truck, no charge; a reference with our own typed transport line uses
 *    that line and not the schedule's figure;
 *  - to come: the card's transport cost, once a reference, for the references with a load still without a figure; a
 *    load with no reference or card line at the average of the loads with a figure so far;
 *  - branch: the branch on the load's reference (branchOf) - the hire contracts put it on, a person's record wins;
 *    a stand-in row (no GC500 reference) carries the branch recorded on its stand-in; a load with neither is
 *    "branch unconfirmed" - never guessed.
 */
function transport888Core(){ return heldMemo('transport888Core', transport888Build); }
function transport888Task(r){ return String(r && r.task_id || '').trim().toUpperCase(); }
function transport888Leg(e){ return e.movement === 'remove' || /demob/i.test(String(e.phase || '')) || /demob/i.test(String(e.sheet || '')) ? 'demob' : /event/i.test(String(e.phase || '')) ? 'event' : 'inbound'; }
/* a carrier's name as the schedule writes it, read to the carriers Andrew names: SFL, Irwins, Torrens, Teams, Readys and Kev */
function transport888Carriers(text){
 const raw = String(text == null ? '' : text).trim(); if (!raw || /^na$/i.test(raw)) return [];
 const out = []; raw.split(/\s*\/\s*|\s*\+\s*/).forEach(part => { const p = part.trim(); if (!p) return;
  const names = [];
  if (/sfl/i.test(p)) names.push('SFL'); if (/irwin/i.test(p)) names.push('Irwins'); if (/torren/i.test(p) && !/not\s+torren/i.test(p)) names.push('Torrens');
  if (/\bkev\b/i.test(p)) names.push('Kev'); if (/ready/i.test(p)) names.push('Readys'); if (/\bteams?\b/i.test(p)) names.push('Teams');
  if (!names.length) names.push(p.replace(/\s+/g, ' '));
  names.forEach(n => { if (!out.includes(n)) out.push(n); }); });
 return out;
}
/* the dockets a row carries: DD numbers written in the DD column, the load-time column or a supplied booking */
function transport888Dockets(e){
 const text = [e.dd, e.load_time, ...(((e.booking801 || {}).loads) || []).map(l => l.dd)].filter(Boolean).join(' ');
 return [...new Set((String(text).match(/\b\d{8}\b/g) || []))];
}
function transport888Build(){
 const cents = n => Math.round(n * 100) / 100;
 const all = allAssets();
 const liveCost = all.filter(a => !a._cancelled); /* the P&L's set: a cancelled reference is out of the money */
 const liveFc = all.filter(a => !a._cancelled && !a.rest_of); /* the forecast's set: a follow-up delivery's order is on its parent */
 const OCL = ourCosts().filter(c => c.kind === 'transport' && c.usable);
 const ourRefs = new Set(OCL.filter(c => c.amount != null && c.ref).map(c => c.ref));
 const byKey = new Map(all.map(a => [a.key, a]));
 const branchFor = key => { if (!key || !byKey.has(key)) return {code: null, where: null}; try { const b = branchOf(key) || {}; return {code: b.code || null, where: b.where || null}; } catch (e) { return {code: null, where: null}; } };
 const tOf = tc => { if (!tc) return null;
  if (tc.internal) return {amount: null, internal: true, plus: false, as_written: tc.as_written, words: 'Internal — Coates truck'};
  if (tc.amount != null) return {amount: tc.amount, internal: false, plus: !!tc.plus, as_written: tc.as_written, words: money(tc.amount) + (tc.plus ? '+' : '')};
  if (tc.as_written) return {amount: null, internal: false, plus: !!tc.plus, as_written: tc.as_written, words: String(tc.as_written)};
  return null; };
 const schedRow = r => { const t = r.transport_cost; if (!t) return null;
  return t.internal ? {amount: null, internal: true, plus: false, as_written: t.as_written, words: 'Internal — Coates truck'} : t.amount != null ? {amount: t.amount, internal: false, plus: !!t.plus, as_written: t.as_written, words: money(t.amount) + (t.plus ? '+' : '')} : null; };
 const base = r => Object.assign(r, {inPl: false, counted: false, byOurLine: false, actual: 0, forecast: null});
 const rows = [];
 /* 1. every schedule row on a reference (the stand-in rows for schedule rows with no GC500 reference are among them) */
 all.forEach(a => (a.events || []).forEach((e, i) => {
  const tc = e.transport_cost || null;
  if (!(e.carrier || e.dd || tc || e.load_time)) return;
  const b = branchFor(a.key);
  rows.push(base({id: 'ref|' + a.key + '|' + (e.task_id || i) + '|' + (e.date || ''), src: 'asset', key: a.key, a, e, standin: /^T\d{4}$/.test(a.key), cancelled: !!a._cancelled, rest_of: !!a.rest_of, off: rowOff(a.key),
   task: transport888Task(e), date: e.date || null, phase: e.phase || null, sheet: e.sheet || null, leg: transport888Leg(e), movement: e.movement || null,
   item: e.item || (a.item_types || [])[0] || '', qty: e.quantity_display != null && e.quantity_display !== 'blank' ? String(e.quantity_display) : '',
   carrierText: e.carrier || '', carriers: transport888Carriers(e.carrier), dd: e.dd || '', loadTime: e.load_time || '', time: dpT(e.load_time), dockets: transport888Dockets(e),
   booking: e.booking801 || null, tc, t: tOf(tc), branch: b.code, branchWhere: b.where, handlingSource: e.handling_source875 || null, discipline: a.discipline || ''}));
 }));
 /* 2. the fencing semis to Phillip Park (Coates organises their transport, so the carrier charge is Coates's); 3. the schedule rows with no reference */
 const xFenceRows = (((DATA.plant_lines || {}).fencing_rows_not_plant) || []).map(r => base({id: 'fence|' + r.task_id, src: 'fencing', key: null, a: null, e: r, standin: false, cancelled: false, rest_of: false, off: rowOff(r.task_id),
  task: transport888Task(r), date: r.date || null, phase: 'Build', sheet: null, leg: 'inbound', movement: 'place', item: r.item || 'fencing', qty: r.quantity_display != null ? String(r.quantity_display) : '', location: r.location || '',
  carrierText: r.carrier || '', carriers: transport888Carriers(r.carrier), dd: r.dd || '', loadTime: r.load_time || '', time: dpT(r.load_time), dockets: transport888Dockets(r), booking: null,
  tc: r.transport_cost || null, t: schedRow(r), branch: null, branchWhere: null, handlingSource: null, discipline: 'Fencing'}));
 const xUnrefRows = (DATA.unreferenced || []).map(r => { const b = branchFor(r.task_id); return base({id: 'unref|' + r.task_id, src: 'unref', key: byKey.has(r.task_id) ? r.task_id : null, a: byKey.get(r.task_id) || null, e: r, standin: true, cancelled: false, rest_of: false, off: rowOff(r.task_id),
  task: transport888Task(r), date: r.date || null, phase: r.phase || null, sheet: r.sheet || null, leg: transport888Leg(r), movement: r.movement || (r.phase === 'Demob' ? 'remove' : 'place'), item: r.item || r.product || '', qty: r.quantity_display != null && r.quantity_display !== 'blank' ? String(r.quantity_display) : '', nums: r.asset_numbers || [], location: r.location || '',
  carrierText: r.carrier || '', carriers: transport888Carriers(r.carrier), dd: r.dd || '', loadTime: r.load_time || '', time: dpT(r.load_time), dockets: transport888Dockets(r), booking: null,
  tc: r.transport_cost || null, t: schedRow(r), branch: b.code, branchWhere: b.where, handlingSource: null, discipline: r.discipline || ''}); });
 /* the P&L's to-date reading, row for row as moneySummary_ has read it since v7.64 / v5.85 */
 const tRows = [];
 liveCost.forEach(a => rows.forEach(r => { if (r.a === a && r.t) tRows.push({a, t: Object.assign({event: r.e}, r.t), row: r}); }));
 xFenceRows.forEach(r => { if (r.t) tRows.push({a: {key: r.task}, t: r.t, row: r}); });
 xUnrefRows.forEach(r => { if (r.t) tRows.push({a: {key: r.task}, t: r.t, row: r}); });
 const tcs = tRows.map(x => x.t), tFig = tcs.filter(t => t.amount != null), tCounted = tRows.filter(x => x.t.amount != null && !ourRefs.has(x.a.key));
 const schedT = {amount: cents(tFig.reduce((s, t) => s + t.amount, 0)), refs: tFig.length, plus: tFig.filter(t => t.plus).length, internal: tcs.filter(t => t.internal).length,
  counted: cents(tCounted.reduce((s, x) => s + x.t.amount, 0)), counted_refs: tCounted.length, by_our_line: tFig.length - tCounted.length, unread: tcs.filter(t => t.amount == null && !t.internal).length};
 const xF = tRows.filter(x => x.row.src === 'fencing'), xU = tRows.filter(x => x.row.src === 'unref');
 schedT.fencing = {rows: xF.filter(x => x.t.amount != null).length, amount: cents(xF.reduce((s, x) => s + (x.t.amount || 0), 0))};
 schedT.unref = {rows: xU.filter(x => x.t.amount != null).length, amount: cents(xU.reduce((s, x) => s + (x.t.amount || 0), 0))};
 tRows.forEach(x => { const r = x.row; r.inPl = true; r.counted = x.t.amount != null && !ourRefs.has(x.a.key); r.byOurLine = x.t.amount != null && ourRefs.has(x.a.key); r.actual = r.counted ? x.t.amount : 0; });
 xFenceRows.forEach(r => rows.push(r)); xUnrefRows.forEach(r => rows.push(r));
 /* the forecast, as Costs to job end has carried it since v7.64 / v8.34: the card once a reference, then the average */
 const tasks = new Set();
 all.forEach(a => (a.events || []).forEach(e => { const tc = e.transport_cost; if (!(a._cancelled || ourRefs.has(a.key) || (tc && (tc.amount != null || tc.internal)))) return; const id = transport888Task(e); if (id) tasks.add(id); }));
 const nonEquipment = r => r.discipline === 'Passes' && !r.item && (r.quantity_display == null || /^\s*(?:blank)?\s*$/i.test(String(r.quantity_display)));
 let cardCost = 0, cardRefs = 0, loadsNoFig = 0, loadsNoFigNoCard = 0, nonLoadTasks = 0;
 const cardOf = a => { const T = assetTotal(a); return (T.lines || []).reduce((s, l) => s + ((l.transport_cost != null && l.qty != null) ? l.transport_cost * l.qty : 0), 0); };
 const noFig = e => !(e.transport_cost && (e.transport_cost.amount != null || e.transport_cost.internal));
 liveFc.forEach(a => { if (ourRefs.has(a.key)) return; const ev = (a.events || []).filter(e => e.carrier || e.dd || e.transport_cost); if (!ev.length) return;
  const nf = ev.filter(noFig); if (!nf.length) return; nf.forEach(e => { const id = transport888Task(e); if (id) tasks.add(id); });
  const cc = cardOf(a), mine = rows.filter(r => r.src === 'asset' && r.a === a && nf.includes(r.e));
  if (cc) { cardCost += cc; cardRefs++; loadsNoFig += nf.length; mine.forEach((r, i) => { r.forecast = {kind: 'card', raw: i === 0 ? cc : 0, amount: i === 0 ? cents(cc) : 0, ref: cents(cc), loads: nf.length}; }); }
  else { loadsNoFigNoCard += nf.length; mine.forEach(r => { r.forecast = {kind: 'average'}; }); } });
 [xFenceRows, xUnrefRows].forEach(rs => rs.forEach(r => { const id = r.task; if ((id && tasks.has(id)) || (id && rowOff(id))) { if (id && tasks.has(id) && r.src === 'unref' && !r.t) r.dup = true; return; } if (id) tasks.add(id);
  if (!r.t) { if (nonEquipment(r.e)) { nonLoadTasks++; r.forecast = {kind: 'nonload'}; } else { loadsNoFigNoCard++; r.forecast = {kind: 'average'}; } } }));
 const avg = schedT.counted_refs ? cents(schedT.counted / schedT.counted_refs) : null, avgPart = avg != null ? cents(avg * loadsNoFigNoCard) : null;
 rows.forEach(r => { if (r.forecast && r.forecast.kind === 'average') { r.forecast.raw = avg != null ? avg : 0; r.forecast.amount = avg != null ? avg : 0; } if (!r.forecast) r.forecast = {kind: r.inPl ? 'figure' : 'none', raw: 0, amount: 0}; });
 const forecast = {cardCost, cardRefs, loadsNoFig, loadsNoFigNoCard, nonLoadTasks, avg, avgPart, total: cents(cardCost + (avgPart || 0))};
 /* the loads add to the P&L's figure exactly: each reference's card figure is rounded to the cent on its own, so the cents the rounding leaves land on the largest card load (the way the P&L's own columns are split to the dollar) */
 { const fc = rows.filter(r => r.forecast && (r.forecast.kind === 'card' || r.forecast.kind === 'average') && r.forecast.amount), sum = cents(fc.reduce((s, r) => s + r.forecast.amount, 0)), left = cents(forecast.total - sum);
  if (left && fc.length) { const top = fc.slice().sort((x, y) => y.forecast.amount - x.forecast.amount)[0]; top.forecast.amount = cents(top.forecast.amount + left); top.forecast.rounding = left; } }
 /* the branch weights the Finance handover splits on: what each branch's loads carry, to date and to come */
 const weights = {toDate: {}, toCome: {}, toDateNone: 0, toComeNone: 0};
 const bump = (o, k, v) => { o[k] = cents((o[k] || 0) + v); };
 rows.forEach(r => { if (r.counted && r.actual) { if (r.branch) bump(weights.toDate, r.branch, r.actual); else weights.toDateNone = cents(weights.toDateNone + r.actual); } });
 OCL.filter(c => c.amount != null).forEach(c => { const b = (costBranchOf(c) || {}).code; if (b) bump(weights.toDate, b, c.amount); else weights.toDateNone = cents(weights.toDateNone + c.amount); });
 rows.forEach(r => { const f = r.forecast; if (!f || !(f.kind === 'card' || f.kind === 'average') || !f.amount) return; if (r.branch) bump(weights.toCome, r.branch, f.amount); else weights.toComeNone = cents(weights.toComeNone + f.amount); });
 /* a schedule row with no reference that its stand-in also carries is one load, shown once: the stand-in's facts, the row's figure and forecast; two figures for one row are flagged, never added quietly */
 xUnrefRows.forEach(u => { const ar = rows.find(r => r.src === 'asset' && r.key === u.task && r.task === u.task); if (!ar) return;
  if (ar.t && u.t && ar.counted && u.counted) { ar.doubleCounted = true; u.doubleCounted = true; return; }
  if (!ar.t && u.t) { ar.t = u.t; ar.tc = u.tc; ar.inPl = u.inPl; ar.counted = u.counted; ar.byOurLine = u.byOurLine; ar.actual = u.actual; }
  if (!(ar.forecast && ar.forecast.kind !== 'none' && ar.forecast.kind !== 'figure') && u.forecast && u.forecast.kind !== 'none') ar.forecast = u.forecast;
  if (u.nums && u.nums.length && !ar.nums) ar.nums = u.nums; u.merged = true; });
 const shown = rows.filter(r => !r.merged);
 /* the movements with no transport fact yet - a scheduled delivery or demob with no carrier, docket, time or figure: not a load the P&L counts, named so nothing is silent */
 const planned = [];
 all.forEach(a => (a.events || []).forEach((e, i) => { if (!e.date || e.carrier || e.dd || e.transport_cost || e.load_time) return; const b = branchFor(a.key);
  planned.push({id: 'plan|' + a.key + '|' + (e.task_id || i) + '|' + e.date, src: 'planned', key: a.key, a, e, standin: /^T\d{4}$/.test(a.key), cancelled: !!a._cancelled, rest_of: !!a.rest_of, off: rowOff(a.key), task: transport888Task(e), date: e.date, phase: e.phase || null, sheet: e.sheet || null, leg: transport888Leg(e), movement: e.movement || null,
   item: e.item || (a.item_types || [])[0] || '', qty: e.quantity_display != null && e.quantity_display !== 'blank' ? String(e.quantity_display) : '', carrierText: '', carriers: [], dd: '', loadTime: '', time: null, dockets: [], booking: null, tc: null, t: null, branch: b.code, branchWhere: b.where, inPl: false, counted: false, byOurLine: false, actual: 0, forecast: {kind: 'planned', raw: 0, amount: 0}, discipline: a.discipline || ''}); }));
 /* the demob legs: a cut of the figures above (to date and forecast), never an addition; the legs the P&L does not forecast are named, with the card's pickup leg they would cost */
 const demob = {by: {}, byKnown: {}, total: 0, noBasis: 0, legs: 0, notInPl: {legs: 0, refs: 0, by: {}, total: 0}};
 const demobSeen = new Set();
 shown.concat(planned).forEach(r => { if (r.leg !== 'demob' || r.cancelled || r.off) return; demob.legs++;
  const fc = r.forecast && (r.forecast.kind === 'card' || r.forecast.kind === 'average') ? r.forecast.amount : 0, inPl = (r.counted && r.actual) || fc;
  if (r.counted && r.actual) { bump(demob.by, r.branch || '—', r.actual); if (r.branch) bump(demob.byKnown, r.branch, r.actual); }
  if (fc) { bump(demob.by, r.branch || '—', fc); if (r.branch) bump(demob.byKnown, r.branch, fc); }
  if (inPl || (r.t && r.t.internal)) return;
  demob.noBasis++; demob.notInPl.legs++;
  if (r.a && !demobSeen.has(r.key) && !ourRefs.has(r.key)) { demobSeen.add(r.key); const cc = cents(cardOf(r.a)); if (cc) { demob.notInPl.refs++; bump(demob.notInPl.by, r.branch || '—', cc); demob.notInPl.total = cents(demob.notInPl.total + cc); r.demobCard = cc; } } });
 demob.total = cents(Object.values(demob.by).reduce((s, v) => s + v, 0));
 const order = (x, y) => String(x.date || '9999').localeCompare(String(y.date || '9999')) || String(x.time || '99:99').localeCompare(String(y.time || '99:99')) || String(x.key || x.task).localeCompare(String(y.key || y.task));
 shown.sort(order); planned.sort(order);
 return {rows: shown, planned, tRows, tcs, tFig, tCounted, schedT, OCL, ourRefs, forecast, weights, demob, doubleCounted: shown.filter(r => r.doubleCounted).length, toDate: cents((OCL.filter(c => !c.awaiting && c.amount != null).reduce((s, c) => s + c.amount, 0)) + schedT.counted)};
}
/* the revenue side and the other transport facts the Transport tab shows beside the loads - read from the models that already carry them */
function transport888View(){
 const T = transport888Core(), cents = n => Math.round(n * 100) / 100, M = moneySummary(), X = cj764Model(), H = fh866Model(), P = pl770Model(), BT = buildingTransportModel831(), B = pl752Rows(), CF = contractFigures(ONHIRE_ROWS);
 const codes = []; (BRANCHES.branches || []).forEach(b => { if (b.code && !codes.includes(b.code)) codes.push(b.code); });
 B.forEach(b => { if (b.code && b.code !== 'no branch' && !codes.includes(b.code)) codes.push(b.code); });
 T.rows.forEach(r => { if (r.branch && !codes.includes(r.branch)) codes.push(r.branch); });
 const hRow = H.costs.find(r => r.kind === 'transport') || {by: {}, toDate: 0, toCome: 0, job: 0};
 const prov = Object.fromEntries((BT.byBranch || []).map(b => [b.branch || '—', b.uncoveredAdditional || 0]));
 const live = T.rows.filter(r => !r.cancelled); /* a row taken off its day stays listed, flagged: the P&L still reads its figure */
 const mk = code => { const rs = live.filter(r => (r.branch || '—') === code);
  const actual = cents(rs.reduce((s, r) => s + (r.counted ? r.actual : 0), 0) + T.OCL.filter(c => c.amount != null && ((costBranchOf(c) || {}).code || '—') === code).reduce((s, c) => s + c.amount, 0));
  const toCome = cents(code === '—' ? (T.weights.toComeNone || 0) : (T.weights.toCome[code] || 0));
  return {code, loads: rs.length, figure: rs.filter(r => r.counted).length, internal: rs.filter(r => r.t && r.t.internal).length, noFig: rs.filter(r => !r.t && !r.byOurLine).length, inbound: rs.filter(r => r.leg === 'inbound').length, demob: rs.filter(r => r.leg === 'demob').length,
   actual, toCome, job: cents(actual + toCome), handover: code === '—' ? null : cents(hRow.by[code] || 0), revenue: cents((B.find(b => b.code === code) || {}).transport || 0), provisional: cents(prov[code] || 0), demobNotInPl: cents(T.demob.notInPl.by[code] || 0)}; };
 const byBranch = codes.map(mk); const none = mk('—'); if (none.loads || none.actual || none.toCome) byBranch.push(none);
 const tot = {loads: live.length, figure: live.filter(r => r.counted).length, internal: live.filter(r => r.t && r.t.internal).length, noFig: live.filter(r => !r.t && !r.byOurLine).length, inbound: live.filter(r => r.leg === 'inbound').length, demob: live.filter(r => r.leg === 'demob').length,
  actual: cents(byBranch.reduce((s, b) => s + b.actual, 0)), toCome: cents(byBranch.reduce((s, b) => s + b.toCome, 0)), handover: cents(byBranch.reduce((s, b) => s + (b.handover || 0), 0)), revenue: cents(byBranch.reduce((s, b) => s + b.revenue, 0)), provisional: cents(byBranch.reduce((s, b) => s + b.provisional, 0)), demobNotInPl: cents(T.demob.notInPl.total)};
 tot.job = cents(tot.actual + tot.toCome);
 /* by carrier: a load two carriers share stays one row, named as written */
 const carriers = new Map();
 live.forEach(r => { const n = r.carriers.length ? r.carriers.join(' / ') : (r.t && r.t.internal ? 'Coates truck' : 'Not stated');
  const c = carriers.get(n) || {name: n, loads: 0, figure: 0, amount: 0, plus: 0, internal: 0, noFig: 0, dates: [], branches: new Set(), asWritten: new Set()}; carriers.set(n, c);
  c.loads++; if (r.counted) { c.figure++; c.amount = cents(c.amount + r.actual); if (r.t.plus) c.plus++; } if (r.t && r.t.internal) c.internal++; if (!r.t && !r.byOurLine) c.noFig++; if (r.date) c.dates.push(r.date); if (r.branch) c.branches.add(r.branch); if (r.carrierText) c.asWritten.add(r.carrierText); });
 const byCarrier = [...carriers.values()].map(c => Object.assign(c, {first: c.dates.slice().sort()[0] || null, last: c.dates.slice().sort().pop() || null, branches: [...c.branches].sort(), asWritten: [...c.asWritten].sort()})).sort((x, y) => y.amount - x.amount || y.loads - x.loads || x.name.localeCompare(y.name));
 /* Transport Revenue: the contracts' delivery and pickup charge lines, with the references the transport forecast reads them as covering */
 const covered = new Map(); (BT.rows || []).forEach(r => (r.coverage || []).forEach(c => { if (!covered.has(c.id)) covered.set(c.id, new Set()); covered.get(c.id).add(r.ref); }));
 const lines = (CF.transport.items || []).map(l => ({id: String(l.contract) + '|' + l.line, contract: String(l.contract), line: l.line, branch: l.branch || '—', description: l.description || l.item || '', qty: l.qty, charge: l.charge, how: l.how, basis: l.basis,
  docket: ((ONHIRE_ROWS || []).find(r => String(r.rental_contract) === String(l.contract) && r.line === l.line) || {}).delivery_number || null, covers: [...(covered.get(String(l.contract) + '|' + l.line) || [])].sort()}));
 /* the carrier plan of 7 Sep and the pairings the record holds against it */
 const plan = (((DATA.transport || {}).carrier || {}).loads || []).map(l => { const o = loadOf(l); return {id: loadId(l), n: l.n, date: l.date, time: l.time, item: l.item, product: l.product, early: !!l.early, eta: l.site_eta || null, keys: o.keys || [], where: o.where || null, by: o.by || null}; });
 /* the demob plan, as the Demob tab lays it out */
 let demobPlan = null; try { const D = demob816(); demobPlan = {days: D.days.map(iso => { const L = trucks816(iso, 'all'); return {iso, trucks: L.length, supplier: L.filter(x => x.kind === 'supplier').length, toilets: L.filter(x => x.kind === 'toilets').length, branch: L.filter(x => x.kind === 'single' || x.kind === 'normal').length, oversize: L.filter(x => x.ov).length}; })}; demobPlan.trucks = demobPlan.days.reduce((s, d) => s + d.trucks, 0); } catch (e) { demobPlan = null; }
 const pos = poAll().filter(o => o.stream === 'transport');
 return {T, M, X, H, P, BT, codes, byBranch, tot, byCarrier, lines, revenueTotal: cents(CF.transport.charge || 0), provisionalTotal: cents(BT.uncoveredAdditional || 0), plan, demobPlan, pos, hRow,
  checks: {toDate: Math.abs(tot.actual - (Number(M.cost.transport.amount) || 0)) < 0.005, toCome: Math.abs(tot.toCome - (T.forecast.total || 0)) < 0.005, revenue: Math.abs(tot.revenue - (Number(M.charge.delivery) || 0)) < 0.005, provisional: Math.abs(tot.provisional - (Number(X.revenue.transportToCome) || 0)) < 0.005}};
}
/* EVERYTHING TALKS. Each figure the Costs tab shows, read where it is shown and where else it is shown; a mismatch is flagged, never hidden. */
function recon888Model(){
 const cents = n => Math.round(n * 100) / 100, num = v => typeof v === 'number' && Number.isFinite(v) ? cents(v) : null;
 const ties = [], tie = (group, what, parts, eps) => { const e = eps || 0.005, ok = parts.every(p => p.v != null) && parts.every(p => Math.abs(p.v - parts[0].v) < e); ties.push({group, what, parts, ok, eps: e}); return ok; };
 const part = (where, v) => ({where, v: num(v)});
 let M, X, P, H, T, V, BT, B, L, TK, race;
 try { M = moneySummary(); X = cj764Model(); P = pl770Model(); H = fh866Model(); T = transport888Core(); V = transport888View(); BT = buildingTransportModel831(); B = pl752Rows(); L = labourRevenue858(); TK = pl760Ticks(); race = (M.charge || {}).race || {}; }
 catch (e) { return {ties: [], ok: false, bad: 1, count: 0, error: String(e && e.message || e)}; }
 const xT = (X.rows || []).find(r => /^Transport/.test(r.stream)) || {}, pT = (P.cost || []).find(l => l.key === 'transport') || {}, pR = (P.rev || []).find(l => l.key === 'transport') || {}, hT = (H.costs || []).find(r => r.kind === 'transport') || {by: {}}, hInvT = (H.inv || []).find(r => /^Transport/.test(r.branch)) || {}, W = X.wages || {};
 /* revenue and direct costs, the whole job */
 tie('P&L', 'Revenue on the record', [part('At a glance', X.revenue.record), part('Forecast P&L', M.charge.total), part('In the business’s lines', P.revNow), part('Finance handover — invoice by branch', H.invTotal.onRecord)]);
 tie('P&L', 'Revenue to job end', [part('At a glance · Costs to job end', X.revenue.job), part('In the business’s lines', P.revJob), part('Finance handover — invoice by branch', H.invTotal.job)]);
 tie('P&L', 'Direct costs known today', [part('Forecast P&L', M.cost.known), part('Costs to job end', X.known), part('In the business’s lines', P.costNow), part('The eight categories, added', cents((M.categories || []).reduce((s, c) => s + (c.known ? c.amount : 0), 0)))]);
 tie('P&L', 'Direct costs to job end', [part('Costs to job end', X.job), part('In the business’s lines', P.costJob)]);
 tie('P&L', 'Direct costs and wages priced, to job end', [part('Costs to job end', cents((X.job || 0) + (W.job || 0))), part('Finance handover — costs by branch', H.costTotal.job)]);
 tie('P&L', 'Labour we charge, to job end (Installation)', [part('At a glance', cents((L.job || 0) + (Number(race.people_amount) || 0))), part('In the business’s lines — 1047', ((P.rev || []).find(l => l.key === 'install') || {}).job)]);
 tie('P&L', 'Labour ticked per piece, on the record', [part('Forecast P&L', M.charge.labour), part('By branch — the ticks', TK.total)]);
 /* transport */
 tie('Transport', 'Transport (cartage) to date', [part('Forecast P&L', M.cost.transport.amount), part('Costs to job end', xT.toDate), part('In the business’s lines — 2120 · 2140', pT.now), part('Finance handover — costs by branch', hT.toDate), part('Transport — every load', V.tot.actual)]);
 tie('Transport', 'Transport still to come — forecast', [part('Costs to job end', xT.toCome), part('In the business’s lines', num(pT.job) != null && num(pT.now) != null ? pT.job - pT.now : null), part('Finance handover — costs by branch', hT.toCome), part('Transport — every load', V.tot.toCome)]);
 tie('Transport', 'Transport by branch — the handover’s branches add to the loads', [part('Finance handover — the branches added', cents(Object.values(hT.by || {}).reduce((s, v) => s + v, 0))), part('Transport — the branches and the unconfirmed loads', V.tot.job)]);
 tie('Transport', 'Transport Revenue on the record', [part('Forecast P&L', M.charge.delivery), part('In the business’s lines — 1030 · 1031', pR.now), part('By branch — Transport', cents(B.reduce((s, b) => s + (b.transport || 0), 0))), part('Transport — the contracts’ charge lines', V.revenueTotal)]);
 tie('Transport', 'Provisional transport revenue to come', [part('Costs to job end', X.revenue.transportToCome), part('Additional transport forecast — by branch', cents((BT.byBranch || []).reduce((s, b) => s + (b.uncoveredAdditional || 0), 0))), part('In the business’s lines', num(pR.job) != null && num(pR.now) != null ? pR.job - pR.now : null), part('Finance handover — invoice by branch', hInvT.toCome), part('Transport — by branch', V.tot.provisional)]);
 tie('Transport', 'No load is counted twice', [part('Forecast P&L — loads with a figure', T.schedT.refs), part('Transport — the loads with a figure, each once', T.rows.filter(r => r.t && r.t.amount != null && !r.cancelled).length + (T.doubleCounted ? 0.5 : 0))]);
 tie('Transport', 'Demob transport in the handover is a cut of the P&L', [part('Finance handover — demob forecast', ((H.demob || []).find(d => /^Transport/.test(d.stream)) || {}).total || 0), part('Transport — demob legs to date and forecast', T.demob.total)]);
 /* the operational tabs: the same references, the same days, the same plan */
 const fact = e => !!(e.carrier || e.dd || e.transport_cost || e.load_time);
 const equipment = new Set(allAssets().filter(a => !a._cancelled && !rowOff(a.key) && (a.events || []).some(fact)).map(a => a.key)), here = new Set(T.rows.filter(r => r.src === 'asset' && !r.cancelled && !r.off).map(r => r.key));
 tie('Operational', 'References with a transport fact — Equipment and Transport', [part('Equipment', equipment.size), part('Transport', here.size), part('Transport, every one in Equipment', [...here].filter(k => equipment.has(k)).length)]);
 let tlRefs = null; try { const s = new Set(); programmeDays().forEach(d => d.deliveries.concat(d.removals).forEach(r => { if ((r.events || []).some(e => fact(e) || e.bookingMoved801)) s.add(r.a.key); })); tlRefs = s.size; } catch (e) { tlRefs = null; }
 tie('Operational', 'References with a load on the Timeline’s days — Timeline and Transport', [part('Timeline', tlRefs), part('Transport', new Set(T.rows.filter(r => r.src === 'asset' && !r.off && r.date).map(r => r.key)).size)]);
 tie('Operational', 'Carrier plan loads paired to a reference — Timeline and Transport', [part('Timeline — the record’s pairings', (((DATA.transport || {}).carrier || {}).loads || []).filter(l => (loadOf(l).keys || []).length).length), part('Transport', V.plan.filter(p => p.keys.length).length)]);
 const bad = ties.filter(t => !t.ok);
 return {ties, ok: !bad.length, bad: bad.length, count: ties.length};
}
