/* ================================================================== v8.16 - reference drawer and Demob tab
 Author: Andrew Fisher. Andrew, 3 Oct 2026, on the Demob: "fil in data if its not filled in ... there is a lot with no
 off site date ... Demob is 2 weeks from the Monday after the race. Priority is everything that is not inside the island
 then inside the island next. So we should maybe have a demob tab ... where we get to pick a date of pick up ... the
 branch can create run sheets on what to be picked up ... Needs to look good". His answers the same day: demob ends
 Fri 13 Nov; "the island" is Macintosh Island (ZONES782.island).
 On the toilets: "demob toilets for event portables we should do a run sheet. as they can take up to 24 when they pick
 up". And: "waste tanks go after the toilet as the toilet is on top ... no toilet is to be moved or waste tank is to be
 transported unless it has been emptied under no circumstances are they to travel until this is done. they are not to
 be loaded on trucks unless this has been done" ... "opening times in gold Coast 7-5 and travel times on the road. with
 oversized".

 WHAT THIS DOES NOT DO. A proposed date is worked out every time it is drawn and is never written to the record. Only a
 person writes a date, through setDate(key, iso, 'out') on the edit link, and only after the page has asked them. The
 travel and loading times on a run sheet are a planning sketch: the figures it uses are the page's own (the Kingston
 run, the precinct allowance, the 30 min unloading, the no-travel windows) or are labelled as planning assumptions the
 branch can change. Nothing here is a booking. */
const DM816 = {start: '2026-10-26', end: '2026-11-13', cap: 24, sel: null, branch: 'all', view: 'list', confirm: false, dir: 0, menu: null,
	order: ['gate1', 'gate2', 'surfers', 'mbp', 'none', 'island', 'unknown'],
	name: {gate1: 'Gate 1 · Tedder Ave / Helen Park', gate2: 'Gate 2 · Commodore Park', surfers: 'Surfers Paradise', mbp: 'Main Beach Pde', none: 'Outside the island · other spots', island: 'Macintosh Island', unknown: 'Position to confirm'},
	way: {gate1: 'Tedder Ave access point (heavy vehicles, D007)', gate2: 'Gate 2 - Gold Coast Hwy underpass via Commodore Dr', island: 'Gold Coast Hwy, north-west end of the pit lane, race direction', unknown: 'Ask site before leaving the yard'}};
/* the event portables: single portable toilets and urinals, counted by the unit, 24 to a pick-up (Andrew, 3 Oct 2026).
 Toilet blocks, accessible toilets, trailers and waste tanks are bigger and go on the normal list. */
const EVT816 = /^(fwf|fwf toilets?|pee panel|urinal|urinals|portable toilet|portable loo|portaloo)$/i;
const TANK816 = /waste tank|holding tank|sewage tank/i;
const BIG816 = /toilet block|pan block|16pan|trailer|12m|6m/i;
/* the emptied gate applies from the start of Event Week, when the toilets are in use (DATA.weeks); a test may move it */
const EMPTY816 = {from: '2026-10-19'};
function motionOff816(){ try { return document.documentElement.dataset.motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
function days816(){
	if (DM816.days) return DM816.days;
	const out = []; let iso = DM816.start, guard = 0;
	while (iso <= DM816.end && guard++ < 60) { const dt = new Date(iso + 'T12:00:00Z'), w = dt.getUTCDay();
		if (w !== 0 && w !== 6 && !(typeof holidayOn === 'function' && holidayOn(iso))) out.push(iso);
		dt.setUTCDate(dt.getUTCDate() + 1); iso = dt.toISOString().slice(0, 10); }
	return (DM816.days = out);
}
function week816(iso){ const D = days816(), i = D.indexOf(iso); return i < 0 ? 0 : i < 5 ? 1 : i < 10 ? 2 : 3; }
function dayWords816(iso){ const f = fmtDay(iso); return f.dow + ' ' + f.dm.replace(/^0/, ''); }
/* -------- where a reference stands: its OWN position (the pit-lane fallback is not one) */
function zone816(a){
	let pt = null; const m = MASTER_LOC[a.key];
	let D = null; try { D = dest782(a); } catch (e) { D = null; }
	if (D && D.kind !== 'report' && D.ll) pt = D.kind === 'desc' && !(m && m.pt) ? ptOf782({key: ''}, D.ll) : ptOf782(a, D.ll);
	if (!pt && m && m.pt) pt = m.pt;
	if (!pt && !movedFor(a)) { let nt = null; try { nt = navTargetFor(a); } catch (e) { nt = null; } if (nt && nt.ll) pt = ptOf782({key: ''}, nt.ll); }
	if (!pt) return {zone: 'unknown', side: 'unknown', pt: null};
	const Z = ZONES782;
	if (inPoly782(pt, Z.island)) return {zone: 'island', side: 'inside', pt};
	const zone = inPoly782(pt, Z.mbp) ? 'mbp' : inPoly782(pt, Z.surfers) ? 'surfers' : inPoly782(pt, Z.gate1) ? 'gate1' : inPoly782(pt, Z.gate2) ? 'gate2' : 'none';
	return {zone, side: 'outside', pt, sea: (zone === 'mbp' || zone === 'surfers') ? pt[1] < roadY782(pt[0]) - 0.004 : null};
}
function wayIn816(a, z){
	let e = null; try { e = entry782(a); } catch (x) { e = null; }
	if (e && e.sms) return e.sms.replace(/^ENTRY:\s*/, '');
	if (z.zone === 'mbp' || z.zone === 'surfers') return z.sea ? 'seaside - in at the Seaworld Dr roundabout end of Main Beach Pde, drive south' : 'land side - in from the Surfers end of Main Beach Pde, drive north (race direction)';
	return DM816.way[z.zone] || 'Ask site for the way in';
}
/* -------- what is in it: units by type, the event portables, the tanks */
function units816(a){
	let rows = []; try { rows = itemRows(a); } catch (e) { rows = []; }
	return rows.map(r => { let n = r.qty_supplied != null ? r.qty_supplied : r.qty_asked, assumed = false;
		if (n == null) { n = 1; assumed = true; }
		return {type: r.asked, n: Number(n) || 0, assumed, evt: EVT816.test(String(r.asked).trim()), tank: TANK816.test(r.asked)}; });
}
function needsEmpty816(a){ const x = a && a.key ? a : assetOf(a); if (!x) return false; return refKind(x) === 'toilet' || (x.item_types || []).some(t => TANK816.test(t)); }
function emptiedOf816(key){
	const l = (S.delivery || {})[key] || {}, c = (CROW.get(key) || {}).delivery || {};
	const s = typeof l.emptied === 'boolean' ? l : typeof c.emptied === 'boolean' ? c : null;
	return s && s.emptied ? {on: true, by: s.emptied_by || null, at: s.emptied_at || null} : {on: false, by: s ? s.emptied_by : null, at: s ? s.emptied_at : null};
}
/* EMPTIED (PUMPED OUT): its own tick with its own name and time, on the shared delivery record like the other three.
 Nothing ever sets it by itself, and un-ticking it is recorded too. */
function setEmptied816(key, on){
	if (!mayWrite('the emptied (pumped out) tick')) return false;
	if (!isRef(key)) { flash(String(key || '') + ' is not a reference in this file - nothing recorded.'); return false; }
	if (!needsEmpty816(key)) { flash(key + ' is not a toilet or a waste tank - emptied does not apply.'); return false; }
	const who = whoAmI(); if (!who) return false;
	S.delivery = S.delivery || {};
	const d = S.delivery[key] || (S.delivery[key] = {}), now = new Date().toISOString();
	d.emptied = !!on; d.emptied_by = who; d.emptied_at = now;
	d.emptied_history = (d.emptied_history || []).concat([{emptied: !!on, at: now, by: who}]).slice(-400);
	bump(); try { buzz(on ? 50 : 20); } catch (e) {}
	flash(on ? key + ' emptied (pumped out) - recorded by ' + who + '. It may now be loaded.' : key + ' un-ticked emptied by ' + who + ' - it may not be loaded until it is pumped out.');
	return true;
}
/* THE GATE. A toilet or a waste tank that has been in use is not moved, loaded or carried until it is emptied. From the
 start of Event Week, taking one off site (in transit, or not on site) is refused until Emptied is ticked, and the page
 says why. Before then a light can still be corrected. */
function emptyGate816(key, state, force){
	const a = assetOf(key); if (!a || !needsEmpty816(a)) return true;
	if (state !== 'in transit' && state !== 'not on site') return true;
	if (!force && todayIso() < EMPTY816.from) return true;
	if (!force && deliveryOf(key).state !== 'on site') return true;
	if (emptiedOf816(key).on) return true;
	flash(key + ' has not been emptied. No toilet or waste tank is moved, loaded or carried until it is pumped out - tick Emptied (pumped out) first.');
	return false;
}
/* the Demob tab's "Collected - on the truck": the amber light, through the gate */
function collect816(key){
	if (!mayWrite('a pick-up')) return false;
	if (!emptyGate816(key, 'in transit', true)) return false;
	return setLight(key, 'in transit');
}
/* -------- the out date: typed, then the plan's remove event, then a contract off-hire BEFORE 13 Nov, then proposed */
function contract816(a){
	let r = null; try { r = subhireOf(a.key) ? null : rentalOf(a.key); } catch (e) { r = null; }
	const ds = r ? (r.lines || []).map(l => l.demob_date).filter(Boolean).sort() : [];
	return {early: ds.find(x => x < DM816.end) || null, last: ds.length ? ds[ds.length - 1] : null};
}
function cmp816(x, y){
	const a = [DM816.order.indexOf(x.zone), x.branch, x.kind, x.key], b = [DM816.order.indexOf(y.zone), y.branch, y.kind, y.key];
	for (let i = 0; i < 4; i++) { if (a[i] < b[i]) return -1; if (a[i] > b[i]) return 1; }
	return 0;
}
/* pack event-portable units into loads of DM816.cap, in the order given: each load takes the next references that fit */
function pack816(items, cap){
	const q = items.map(x => ({r: x.r || x, n: x.n != null ? x.n : x.evtN, part: false})), loads = [];
	while (q.length) {
		const L = {rows: [], units: 0};
		for (let i = 0; i < q.length && L.units < cap;) {
			const it = q[i];
			if (L.units + it.n <= cap) { L.rows.push({r: it.r, n: it.n, part: it.part}); L.units += it.n; q.splice(i, 1); continue; }
			if (!L.rows.length && it.n > cap) { L.rows.push({r: it.r, n: cap, part: true}); L.units = cap; it.n -= cap; it.part = true; break; }
			i++;
		}
		if (!L.rows.length) { const it = q.shift(); L.rows.push({r: it.r, n: it.n, part: it.part}); L.units = it.n; }
		loads.push(L);
	}
	return loads;
}
function demob816(){
	const memo = typeof RENDER_MEMO !== 'undefined' && RENDER_MEMO instanceof Map ? RENDER_MEMO : null;
	if (memo && memo.has('demob816')) return memo.get('demob816');
	const D = days816(), first = D[0], last = D[D.length - 1];
	const refs = allAssets().filter(a => !a._cancelled && !rowOff(a.key)).map(a => {
		const d = deliveryOf(a.key), eff = effectiveDates(a), c = contract816(a), z = zone816(a), u = units816(a);
		const evtN = u.filter(x => x.evt).reduce((s, x) => s + x.n, 0), other = u.filter(x => !x.evt && x.n > 0);
		let br = '—'; try { const b = branchOf(a.key); br = (b && (b.code || b)) || '—'; } catch (e) {}
		if (typeof br !== 'string') br = '—';
		const src = d.out_date ? 'confirmed' : eff.out_plan ? 'plan' : c.early ? 'contract' : 'proposed';
		return {key: a.key, a, kind: refKind(a), branch: br, zone: z.zone, side: z.side, pt: z.pt, src,
			iso: d.out_date || eff.out_plan || c.early || null, contractEnd: c.last, units: u, evtN, evtPure: evtN > 0 && !other.length,
			empty: needsEmpty816(a), emptied: emptiedOf816(a.key).on, big: refKind(a) === 'building' || u.some(x => !x.evt && x.n > 0 && BIG816.test(x.type)),
			tank: u.some(x => x.tank && x.n > 0), sub: (() => { try { const s = subhireOf(a.key); return s ? s.co : null; } catch (e) { return null; } })()};
	});
	const byKey = new Map(refs.map(r => [r.key, r]));
	const fixedOn = iso => refs.filter(r => r.src !== 'proposed' && r.iso === iso).length;
	const prop = refs.filter(r => r.src === 'proposed').sort(cmp816);
	const outP = prop.filter(r => r.side === 'outside'), inP = prop.filter(r => r.side === 'inside'), unkP = prop.filter(r => r.side === 'unknown');
	/* the event portables go as full loads: outside first, then the island (and those with no position last) */
	const loadsOut = pack816(outP.filter(r => r.evtPure), DM816.cap), loadsIn = pack816(inP.concat(unkP).filter(r => r.evtPure), DM816.cap);
	const block = L => ({load: L, size: L.rows.length, key: L.rows[0].r});
	const queue = (rs, Ls) => rs.filter(r => !r.evtPure).map(r => ({r, size: 1, key: r})).concat(Ls.map(block)).sort((x, y) => cmp816(x.key, y.key));
	const fill = (Q, days) => {
		const count = days.map(fixedOn), total = Q.reduce((s, x) => s + x.size, 0) + count.reduce((s, x) => s + x, 0);
		const target = Math.ceil(total / days.length); let di = 0;
		Q.forEach(it => {
			while (di < days.length - 1 && count[di] >= target) di++;
			if (di < days.length - 1 && count[di] > 0 && count[di] + it.size > target && count[di] + it.size - target > target - count[di]) di++;
			const iso = days[di]; count[di] += it.size;
			if (it.load) { it.load.iso = iso; it.load.rows.forEach(x => { x.r.iso = iso; }); } else it.r.iso = iso;
		});
	};
	fill(queue(outP, loadsOut), D.slice(0, 5));
	fill(queue(inP, []).concat(queue(unkP, [])).concat(loadsIn.map(block)).sort((x, y) => cmp816(x.key, y.key)), D.slice(5));
	/* each day: its references, its toilet run, its pump-out run */
	const planned = loadsOut.concat(loadsIn);
	const day = {};
	D.forEach((iso, i) => {
		const list = refs.filter(r => r.iso === iso).sort(cmp816);
		const loads = planned.filter(L => L.iso === iso).map(L => ({rows: L.rows.map(x => ({r: x.r, n: x.n, part: x.part})), units: L.units, planned: true}));
		const placed = new Set(loads.flatMap(L => L.rows.map(x => x.r.key)));
		const rest = list.filter(r => r.evtN > 0 && !placed.has(r.key));
		rest.forEach(r => { let n = r.evtN;
			for (const L of loads) { if (n <= 0) break; if (L.rows[0].r.side !== r.side && r.side !== 'unknown') continue; const room = DM816.cap - L.units; if (room >= n) { L.rows.push({r, n, part: false}); L.units += n; n = 0; } }
			if (n > 0) pack816([{r, n}], DM816.cap).forEach(x => loads.push(Object.assign(x, {planned: false}))); });
		const sideIx = L => L.rows[0].r.side === 'outside' ? 0 : L.rows[0].r.side === 'inside' ? 1 : 2;
		loads.sort((x, y) => sideIx(x) - sideIx(y) || cmp816(x.rows[0].r, y.rows[0].r));
		loads.forEach((L, k) => { L.n = k + 1; L.free = DM816.cap - L.units; L.rows.sort((x, y) => cmp816(x.r, y.r)); });
		const next = D[i + 1];
		const pump = refs.filter(r => r.empty && !r.emptied && (r.iso === iso || (next && r.iso === next))).sort(cmp816)
			.map(r => ({r, when: r.iso === iso ? 'today' : 'next'}));
		day[iso] = {iso, i, list, loads, pump, outside: list.filter(r => r.side === 'outside').length, island: list.filter(r => r.side === 'inside').length, unknown: list.filter(r => r.side === 'unknown').length};
	});
	const counts = {total: refs.length, plan: refs.filter(r => r.src === 'plan').length, contract: refs.filter(r => r.src === 'contract').length,
		proposed: refs.filter(r => r.src === 'proposed').length, confirmed: refs.filter(r => r.src === 'confirmed').length};
	const outside = refs.filter(r => r.iso && (r.iso < first || r.iso > last)).sort((x, y) => x.iso.localeCompare(y.iso));
	const M = {refs, byKey, days: D, day, counts, outside, planned};
	if (memo) memo.set('demob816', M);
	return M;
}
function demobOf816(key){ return demob816().byKey.get(key) || null; }
const SRC816 = {confirmed: 'confirmed', plan: 'plan', contract: 'contract', proposed: 'proposed'};
function srcChip816(src){ return `<span class="src816 s-${esc(src)}" title="${esc({confirmed: 'a person typed this due-out date', plan: 'the plan\'s remove event', contract: 'the rental contract\'s off-hire date', proposed: 'worked out by the demob rule - not on the record until a person confirms it'}[src] || '')}">${esc(SRC816[src] || src)}</span>`; }
/* -------- planning assumptions: the page's own figures first; anything else is labelled and can be changed here */
const ASSUME816_KEY = 'gc500.demob816.assume';
function assume816(){
	let mine = {}; try { mine = JSON.parse(localStorage.getItem(ASSUME816_KEY) || '{}') || {}; } catch (e) { mine = {}; }
	let run = 70; try { run = run782(); } catch (e) {}
	const pre = ((DATA.depot || {}).planning || {}).precinct_min;
	const base = {run: {v: run, lab: 'Kingston ⇄ circuit, each way', why: 'the page\'s planning figure for the Kingston run (transport.kingston_run)'},
		between: {v: pre != null ? pre : 10, lab: 'Between areas inside the precinct', why: 'the depot\'s precinct allowance (DATA.depot.planning)'},
		stop: {v: typeof UNLOAD_MIN782 === 'number' ? UNLOAD_MIN782 : 30, lab: 'Loading at each stop', why: 'planning assumption: the 30 min the project manager set for unloading, used for loading - edit'},
		unit: {v: 5, lab: 'Each event portable on the toilet run', why: 'planning assumption - edit'},
		unload: {v: typeof UNLOAD_MIN782 === 'number' ? UNLOAD_MIN782 : 30, lab: 'Unloading back at Kingston', why: 'the 30 min unloading allowance'},
		perLoad: {v: 4, lab: 'Pieces on one truck (not oversize)', why: 'planning assumption - edit'}};
	Object.keys(base).forEach(k => { const v = Number(mine[k]); if (isFinite(v) && v > 0) { base[k].v = v; base[k].edited = true; } });
	return base;
}
const OPEN816 = 7 * 60, CLOSE816 = 17 * 60;
function clock816(n){ n = Math.round(n); return String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0'); }
function ban816(s, e){ for (const [ps, pe] of (typeof PEAKS782 !== 'undefined' ? PEAKS782 : [[420, 540], [960, 1080]])) if (s < pe && e > ps) return [ps, pe]; return null; }
/* the stops of one load, in pick-up order. A toilet block or a toilet on a tank comes off before the tank under it. */
function stops816(rows, toiletRun){
	return rows.map(x => { const r = x.r, u = r.units.filter(y => y.n > 0 && (toiletRun ? y.evt : !y.evt));
		const parts = toiletRun ? [{type: u.map(y => y.type).join(' + ') || 'event portables', n: x.n, tank: false}]
			: u.filter(y => !y.tank).map(y => ({type: y.type, n: y.n, tank: false})).concat(u.filter(y => y.tank).map(y => ({type: y.type, n: y.n, tank: true})));
		return {r, n: x.n, part: x.part, area: r.zone, parts: parts.length ? parts : [{type: (r.a.item_types || [])[0] || kindWord(r.a), n: 1, tank: false}]}; });
}
/* the trucks for one day: oversize pieces each on their own load; the rest by area, a few to a truck; the toilet run
 in its 24-unit loads. Each load is timed from Kingston and back inside the site hours and the no-travel windows. */
function trucks816(iso, branch){
	const M = demob816(), Dy = M.day[iso]; if (!Dy) return [];
	const A = assume816(), groups = new Map();
	const add = (g, L) => { if (!groups.has(g)) groups.set(g, []); groups.get(g).push(L); };
	const list = Dy.list.filter(r => !r.evtPure && (branch === 'all' || r.branch === branch));
	list.filter(r => r.big).forEach(r => add(r.branch, {kind: 'oversize', stops: stops816([{r, n: 1}], false)}));
	const small = list.filter(r => !r.big);
	for (let i = 0; i < small.length; i += A.perLoad.v) { const ch = small.slice(i, i + A.perLoad.v); add(ch[0].branch, {kind: 'normal', stops: stops816(ch.map(r => ({r, n: 1})), false)}); }
	Dy.loads.filter(L => branch === 'all' || L.rows.some(x => x.r.branch === branch)).forEach(L => add('Toilet run', {kind: 'toilets', toilet: L, stops: stops816(L.rows, true)}));
	const out = [];
	groups.forEach((loads, g) => {
		const lanes = [];
		loads.forEach(L => {
			const fit = (t0, strict) => { let dep = Math.max(t0, OPEN816 - A.run.v), b;
				while ((b = ban816(dep, dep + A.run.v))) dep = b[1];
				let t = Math.max(dep + A.run.v, OPEN816); const arrive = t, st = []; let prev = null;
				L.stops.forEach(s => { if (prev && prev !== s.area) t += A.between.v; const dur = L.kind === 'toilets' ? Math.max(15, s.n * A.unit.v) : A.stop.v; st.push({s, at: t, end: t + dur}); t += dur; prev = s.area; });
				let leave = t; while ((b = ban816(leave, leave + A.run.v))) leave = b[1];
				if (strict && (leave > CLOSE816 || t > CLOSE816)) return null;
				return {dep, arrive, st, leave, back: leave + A.run.v, done: leave + A.run.v + A.unload.v};
			};
			let placed = null;
			for (const ln of lanes) { const f = fit(ln.free, true); if (f) { placed = {ln, f}; break; } }
			if (!placed) { const ln = {n: lanes.length + 1, free: 0, loads: []}; let f = fit(0, true); if (!f) f = Object.assign(fit(0, false), {over: true}); lanes.push(ln); placed = {ln, f}; }
			placed.ln.free = placed.f.done; placed.ln.loads.push(Object.assign({}, L, {t: placed.f, truck: placed.ln.n}));
		});
		lanes.forEach(ln => ln.loads.forEach(L => out.push(Object.assign(L, {group: g}))));
	});
	out.forEach((L, i) => { L.n = i + 1; L.of = out.length; });
	return out;
}
/* -------- the tab */
function demobSel816(M){ if (!DM816.sel || !M.day[DM816.sel]) { const t = todayIso(); DM816.sel = M.days.find(d => d >= t) || M.days[0]; } return DM816.sel; }
function loo816(px){ return `<svg class="loo816" width="${px || 14}" height="${px || 14}" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 2.5h5v4H4zM3 7.5h8.5a0 0 0 0 1 0 0c0 2.4-1.6 4-3.8 4.3L8.3 14H5.2l.6-2.3C4 11.2 3 9.6 3 7.5z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`; }
function renderDemob816(){
	const pane = $('#pane-demob'); if (!pane) return;
	const M = demob816(), sel = demobSel816(M), C = M.counts, Dy = M.day[sel];
	const max = Math.max(1, ...M.days.map(d => M.day[d].list.length));
	const strip = M.days.map((iso, i) => { const x = M.day[iso], f = fmtDay(iso), wk = i % 5 === 0 ? `<span class="wk816">WK ${i / 5 + 1}</span>` : '';
		const h = n => (n / max * 100).toFixed(1) + '%', tl = x.loads.length, tu = x.loads.reduce((s, L) => s + L.units, 0);
		return `<button type="button" class="dday816${iso === sel ? ' on' : ''}${i % 5 === 0 ? ' wks' : ''}" data-dday816="${esc(iso)}" aria-pressed="${iso === sel}" aria-label="${esc(dayWords816(iso) + ': ' + x.list.length + ' to pick up' + (tl ? ', ' + tl + ' toilet load' + (tl === 1 ? '' : 's') : ''))}">${wk}
<span class="dw816">${esc(f.dow.toUpperCase())}</span><b class="dn816">${esc(String(Number(f.dm.slice(0, 2))))}</b><span class="dm816">${esc(f.dm.slice(3).toUpperCase())}</span>
<span class="bar816" style="--d:${i * 40}ms"><i class="o" style="height:${h(x.outside)}"></i><i class="n" style="height:${h(x.island)}"></i><i class="u" style="height:${h(x.unknown)}"></i></span>
<b class="dc816">${x.list.length}</b>${tl ? `<span class="tl816" title="${tl} toilet load${tl === 1 ? '' : 's'}, ${tu} units">${loo816(11)}${tl} · ${tu}</span>` : '<span class="tl816 none"></span>'}</button>`; }).join('');
	const early = M.outside.length ? `<p class="note816">Dated by the plan outside the window: ${M.outside.map(r => `<button type="button" class="linkish" data-k816="${esc(r.key)}">${esc(r.key)}</button> ${esc(dayWords816(r.iso))}`).join(' · ')}.</p>` : '';
	pane.innerHTML = paneHeadingHtml('demob') + `
<section class="card island dm816 nosfold"><div class="hubtitle"><h3>Demob · pick-up board</h3></div>
<div class="dmhead816"><div><h2 class="racenum">Mon 26 Oct – Fri 13 Nov</h2>
<p>15 working days from the Monday after the race. Outside the island first, in week 1; Macintosh Island next, in weeks 2 and 3. Grouped by area so a truck clears one gate at a time, then by branch and type. Toilets and waste tanks are emptied before they are moved.</p></div>
<div class="kp816"><span><b class="racenum">${C.total}</b>references to come off site</span><span><b class="racenum">${C.plan}</b>dated by the plan</span><span><b class="racenum">${C.contract}</b>dated by the contract</span>${C.confirmed ? `<span><b class="racenum">${C.confirmed}</b>confirmed here</span>` : ''}<span class="pr"><b class="racenum">${C.proposed}</b>proposed - confirm or move</span></div></div>
<div class="ord816"><span class="t-out">1 · Outside the island · week 1</span><span class="t-in">2 · Macintosh Island · weeks 2–3</span><span class="t-u">Position to confirm · end of week 3</span></div>
<div class="strip816" role="group" aria-label="Demob days">${strip}</div>
<div class="leg816"><span><i class="o"></i>outside the island</span><span><i class="n"></i>Macintosh Island</span><span><i class="u"></i>position to confirm</span><span>${loo816(12)} toilet run loads · units (24 a load)</span></div>
${early}</section>
<section class="card c816 dmday816 nosfold" aria-live="polite">${dayHtml816(M, Dy)}</section>
${assumeHtml816()}`;
	wireDemob816(pane);
	if (DM816.dir) { const s = pane.querySelector('.dmbody816'); if (s && !motionOff816()) s.classList.add(DM816.dir > 0 ? 'in-r' : 'in-l'); DM816.dir = 0; }
}
function dayHtml816(M, Dy){
	const iso = Dy.iso, br = DM816.branch, ed = canEdit();
	const brs = [...new Set(Dy.list.map(r => r.branch))].sort();
	const shown = Dy.list.filter(r => br === 'all' || r.branch === br);
	const prop = shown.filter(r => r.src === 'proposed');
	const T = trucks816(iso, br);
	const tl = Dy.loads.length, tu = Dy.loads.reduce((s, L) => s + L.units, 0);
	const seg = (k, words) => `<button type="button" class="seg816${DM816.view === k ? ' on' : ''}" data-view816="${k}" aria-pressed="${DM816.view === k}">${words}</button>`;
	const body = DM816.view === 'toilets' ? toiletHtml816(Dy) : DM816.view === 'pump' ? pumpHtml816(Dy) : DM816.view === 'trucks' ? trucksHtml816(Dy, T) : listHtml816(shown);
	return `<div class="dmsh816"><h3><span class="racenum">${esc(dayWords816(iso))}</span> · ${shown.length} to pick up <small>week ${week816(iso)}</small></h3>
<div class="br816" role="group" aria-label="Branch">${['all'].concat(brs).map(b => `<button type="button" class="${br === b ? 'on' : ''}" data-br816="${esc(b)}" aria-pressed="${br === b}">${b === 'all' ? 'All' : esc(b) + ' ' + Dy.list.filter(r => r.branch === b).length}</button>`).join('')}</div>
<div class="acts816">${prop.length ? `<button type="button" class="btn editonly" data-conf816="1">Confirm the ${prop.length} proposed</button>` : ''}
<button type="button" class="btn" data-print816="day">Print run sheets · ${T.length}</button>
<a class="btn primary" data-mail816="1" href="${esc(mail816(iso, br, shown, T))}">Email ${br === 'all' ? 'the branches' : esc(br)}</a></div></div>
${DM816.confirm && ed && prop.length ? `<div class="confirm816" role="alert"><b>Write ${prop.length} proposed date${prop.length === 1 ? '' : 's'} to the record?</b> Each of ${esc(prop.map(r => r.key).join(', '))} becomes due out ${esc(dayWords816(iso))}, in your name. Nothing else changes, and each one can be moved again.
<span><button type="button" class="btn primary" data-conf816="yes">Confirm ${prop.length}</button><button type="button" class="btn ghost" data-conf816="no">Not now</button></span></div>` : ''}
<div class="segs816" role="group" aria-label="What to show">${seg('list', 'Pick-up list · ' + shown.length)}${seg('toilets', loo816(13) + ' Toilet run · ' + tl + ' load' + (tl === 1 ? '' : 's') + (tu ? ' · ' + tu : ''))}${seg('pump', 'Pump-out run · ' + Dy.pump.length)}${seg('trucks', 'Trucks and times · ' + T.length)}</div>
<div class="dmbody816">${body}</div>
<details class="ovn816"><summary>Oversize: check permit / travel window for ${esc(dayWords816(iso))}</summary><label for="ovn816">Note for this day (kept on this device)</label><textarea id="ovn816" data-ro rows="2" placeholder="Permit, escort or travel window for the buildings and toilet blocks on this day">${esc(ovNote816(iso))}</textarea></details>`;
}
function ovNote816(iso, v){ const k = 'gc500.demob816.oversize.' + iso; try { if (v != null) { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); return v; } return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
function notReady816(r){ return r.empty && !r.emptied ? '<span class="nr816" title="No toilet or waste tank is loaded until it is pumped out">NOT READY: empty first</span>' : r.empty ? '<span class="em816">emptied</span>' : ''; }
function rowHtml816(r, extra){
	const ed = canEdit(), what = [(r.a.item_types || []).join(', ') || r.a.product || kindWord(r.a), r.a.name].filter(Boolean).join(' · ');
	const open = DM816.menu === r.key;
	return `<div class="row816" data-row816="${esc(r.key)}"><button type="button" class="linkish plate816" data-k816="${esc(r.key)}" aria-label="Open ${esc(r.key)}">${refPlate(r.key, 15)}</button>
<span class="what816">${esc(what)}${r.evtN && !r.evtPure ? ` <small>+ ${r.evtN} on the toilet run</small>` : ''}${r.side === 'unknown' ? ' <span class="chip cand">position to confirm</span>' : ''}${r.sub ? ` <span class="chip subhirechip">${esc(r.sub)}</span>` : ''}${extra || ''}</span>
<span class="brn816">${esc(r.branch)}</span>${srcChip816(r.src)}${notReady816(r)}
<details class="menu816"${open ? ' open' : ''} data-menu816="${esc(r.key)}"><summary aria-label="More for ${esc(r.key)}">⋯</summary><div>
<button type="button" class="btn ghost sm" data-k816="${esc(r.key)}">Open ${esc(r.key)}</button>
${ed ? `<span class="mv816"><select data-mvd816="${esc(r.key)}" aria-label="Move ${esc(r.key)} to another day">${demob816().days.map(d => `<option value="${esc(d)}"${d === r.iso ? ' selected' : ''}>${esc(dayWords816(d))}</option>`).join('')}</select><button type="button" class="btn sm" data-mv816="${esc(r.key)}">Move</button></span>
${r.empty ? `<button type="button" class="btn sm${r.emptied ? '' : ' primary'}" data-emp816="${esc(r.key)}">${r.emptied ? 'Un-tick emptied' : 'Emptied (pumped out)'}</button>` : ''}
<button type="button" class="btn sm" data-col816="${esc(r.key)}">Collected - on the truck</button>` : ''}</div></details></div>`;
}
function listHtml816(rows){
	if (!rows.length) return '<p class="note816">Nothing to pick up for this branch on this day.</p>';
	return DM816.order.map(z => { const rs = rows.filter(r => r.zone === z); if (!rs.length) return '';
		return `<div class="area816"><h4>${esc(DM816.name[z])} <small>${rs.length}</small></h4>${rs.map(r => rowHtml816(r)).join('')}</div>`; }).join('');
}
function toiletHtml816(Dy){
	if (!Dy.loads.length) return '<p class="note816">No event portables come off site on this day.</p>';
	const M = demob816(), next = M.days[M.days.indexOf(Dy.iso) + 1];
	return `<p class="note816">Event portables - single portable toilets and urinals (${esc('FWF, Pee Panel')}) - go 24 to a pick-up. Toilet blocks, accessible toilets, trailers and waste tanks are bigger and stay on the pick-up list. <b>Every unit is pumped out before it is loaded.</b></p>` + Dy.loads.map(L => `<div class="load816${L.free ? '' : ' full'}"><div class="lh816"><b class="racenum">Load ${L.n}</b> <span>${L.units} of ${DM816.cap}</span>${dashLeds([[L.units / DM816.cap, L.planned ? 'o' : 'b']], L.units + ' of ' + DM816.cap + ' units', DM816.cap)}
${L.free ? `<em>${L.free} space${L.free === 1 ? '' : 's'} left${next ? ' - top it up from ' + esc(dayWords816(next)) : ''}</em>` : '<em>full</em>'}<button type="button" class="btn sm" data-print816="load" data-load816="${L.n}">Print this load</button></div>
${L.rows.map((x, i) => `<div class="lr816"><span class="seq816">${i + 1}</span>${refPlate(x.r.key, 14)}<span>${x.n} unit${x.n === 1 ? '' : 's'}${x.part ? ' (part)' : ''}</span><span class="ar816">${esc(DM816.name[x.r.zone])}</span>${srcChip816(x.r.src)}${notReady816(x.r)}</div>`).join('')}</div>`).join('');
}
function pumpHtml816(Dy){
	if (!Dy.pump.length) return '<p class="note816">Nothing due for pick-up today or tomorrow still needs pumping out.</p>';
	const ed = canEdit();
	return `<p class="note816"><b>Pump out ahead of the truck</b> - the day before the pick-up, or first thing that morning. No toilet or waste tank is loaded until it is emptied.</p>` + Dy.pump.map(({r, when}) => `<div class="row816 pump816"><button type="button" class="linkish plate816" data-k816="${esc(r.key)}">${refPlate(r.key, 15)}</button><span class="what816">${esc(r.units.filter(u => u.n > 0).map(u => u.n + ' × ' + u.type).join(', ') || kindWord(r.a))}${r.tank ? ' <small>toilet first, then the tank under it</small>' : ''}</span><span class="brn816">${esc(DM816.name[r.zone])}</span><span class="when816">${when === 'today' ? 'pick-up today - pump first thing' : 'for pick-up ' + esc(dayWords816(r.iso))}</span>${notReady816(r)}${ed ? `<button type="button" class="btn sm primary" data-emp816="${esc(r.key)}">Emptied (pumped out)</button>` : ''}</div>`).join('');
}
function trucksHtml816(Dy, T){
	if (!T.length) return '<p class="note816">No truck runs for this branch on this day.</p>';
	return `<p class="note816">Site hours 07:00–17:00. No travel to or from the Gold Coast 07:00–09:00 or 16:00–18:00. Times are a planning sketch from the assumptions below, not a booking.</p>` + T.map(L => `<div class="truck816${L.t.over ? ' over' : ''}"><div class="lh816"><b class="racenum">${esc(L.group)} · truck ${L.truck}</b><span>load ${L.n} of ${L.of}${L.kind === 'oversize' ? ' · <b class="ovs816">Oversize: check permit / travel window</b>' : ''}${L.kind === 'toilets' ? ' · ' + L.toilet.units + ' of 24' : ''}</span>
<em>leave Kingston ${clock816(L.t.dep)} · site ${clock816(L.t.arrive)} · leave site ${clock816(L.t.leave)} · back ${clock816(L.t.back)}</em><button type="button" class="btn sm" data-print816="truck" data-truck816="${L.n}">Print</button></div>
${L.t.st.map(s => `<div class="lr816"><span class="seq816">${clock816(s.at)}</span>${refPlate(s.s.r.key, 14)}<span>${esc(s.s.parts.map(p => p.n + ' × ' + p.type + (p.tank ? ' (tank, after the toilet)' : '')).join(', '))}</span><span class="ar816">${esc(DM816.name[s.s.area])}</span>${notReady816(s.s.r)}</div>`).join('')}${L.t.over ? '<p class="nr816">This load does not fit the site hours - split it.</p>' : ''}</div>`).join('');
}
function assumeHtml816(){
	const A = assume816();
	return `<section class="card c816 nosfold asm816"><details><summary>Planning assumptions behind the run sheets · edit</summary>
<p class="note816">Site hours 07:00–17:00 (Andrew, 3 Oct 2026). No travel to the Gold Coast 07:00–09:00 or 16:00–18:00 (the project manager, 2 Oct 2026). Changes here are kept on this device only and change no record.</p>
<div class="asg816">${Object.keys(A).map(k => `<label>${esc(A[k].lab)}<span><input type="number" min="1" step="1" data-ro data-asm816="${k}" value="${esc(String(A[k].v))}"> ${k === 'perLoad' ? 'pieces' : 'min'}</span><small>${esc(A[k].why)}${A[k].edited ? ' · changed on this device' : ''}</small></label>`).join('')}</div>
<button type="button" class="btn ghost sm" data-asm816="reset">Back to the page's figures</button></details></section>`;
}
function mail816(iso, br, rows, T){
	const L = [`GC500 demob - pick-ups ${dayWords816(iso)}${br === 'all' ? '' : ' - ' + br}`, '', 'Site hours 07:00-17:00. No travel to or from the Gold Coast 07:00-09:00 or 16:00-18:00.', 'Every toilet and waste tank is pumped out before it is loaded - do not load one that is not.', ''];
	DM816.order.forEach(z => { const rs = rows.filter(r => r.zone === z); if (!rs.length) return;
		L.push(DM816.name[z] + ':'); rs.forEach(r => L.push('- ' + r.key + ' - ' + ((r.a.item_types || []).join(', ') || kindWord(r.a)) + ' (' + r.branch + ', ' + r.src + ')' + (r.empty && !r.emptied ? ' - NOT READY: empty first' : ''))); L.push(''); });
	const Dy = demob816().day[iso];
	if (Dy && Dy.loads.length) { L.push('Toilet run (24 a load):'); Dy.loads.forEach(Ld => L.push('- Load ' + Ld.n + ' - ' + Ld.units + ' of 24: ' + Ld.rows.map(x => x.r.key + ' x' + x.n).join(', '))); L.push(''); }
	L.push('Proposed dates are not booked until they are confirmed on the page. Draft - check before sending.');
	let body = L.join('\n'); const cap = typeof DP_MAIL_MAX === 'number' ? DP_MAIL_MAX : 1800;
	if (body.length > cap) body = body.slice(0, cap - 60) + '\n... and more - see the Demob tab.';
	return 'mailto:?subject=' + encodeURIComponent('GC500 demob pick-ups ' + dayWords816(iso) + (br === 'all' ? '' : ' - ' + br)) + '&body=' + encodeURIComponent(body);
}
function wireDemob816(pane){
	const redraw = () => { RENDER_MEMO.delete && RENDER_MEMO.delete('demob816'); renderDemob816(); applyCapability(); };
	pane.querySelectorAll('[data-dday816]').forEach(b => b.onclick = () => { const M = demob816(), to = b.dataset.dday816;
		DM816.dir = M.days.indexOf(to) - M.days.indexOf(DM816.sel); DM816.sel = to; DM816.confirm = false; DM816.menu = null; renderDemob816(); applyCapability();
		const nb = pane.querySelector('[data-dday816="' + to + '"]'); if (nb) { try { nb.focus({preventScroll: true}); nb.scrollIntoView({block: 'nearest', inline: 'nearest'}); } catch (e) {} } });
	pane.querySelectorAll('[data-br816]').forEach(b => b.onclick = () => { DM816.branch = b.dataset.br816; DM816.confirm = false; renderDemob816(); applyCapability(); });
	pane.querySelectorAll('[data-view816]').forEach(b => b.onclick = () => { DM816.view = b.dataset.view816; renderDemob816(); applyCapability(); });
	pane.querySelectorAll('[data-k816]').forEach(b => b.onclick = () => openAsset(b.dataset.k816));
	pane.querySelectorAll('details[data-menu816]').forEach(d => d.addEventListener('toggle', () => { if (d.open) { DM816.menu = d.dataset.menu816; pane.querySelectorAll('details[data-menu816]').forEach(o => { if (o !== d) o.open = false; }); } else if (DM816.menu === d.dataset.menu816) DM816.menu = null; }));
	pane.querySelectorAll('[data-conf816]').forEach(b => b.onclick = () => {
		const v = b.dataset.conf816;
		if (v === '1') { if (!mayWrite('the demob dates')) return; DM816.confirm = true; renderDemob816(); applyCapability(); return; }
		if (v === 'no') { DM816.confirm = false; renderDemob816(); applyCapability(); return; }
		confirm816(DM816.sel, DM816.branch);
	});
	pane.querySelectorAll('[data-mv816]').forEach(b => b.onclick = () => { const k = b.dataset.mv816, s = pane.querySelector('[data-mvd816="' + k + '"]'); if (!s) return; DM816.menu = null; setDate(k, s.value, 'out'); });
	pane.querySelectorAll('[data-emp816]').forEach(b => b.onclick = () => { const k = b.dataset.emp816; setEmptied816(k, !emptiedOf816(k).on); });
	pane.querySelectorAll('[data-col816]').forEach(b => b.onclick = () => { collect816(b.dataset.col816); });
	pane.querySelectorAll('[data-print816]').forEach(b => b.onclick = () => printDay816(DM816.sel, DM816.branch, b.dataset.print816, Number(b.dataset.load816 || b.dataset.truck816 || 0)));
	const ov = pane.querySelector('#ovn816'); if (ov) ov.onchange = () => ovNote816(DM816.sel, ov.value.trim());
	pane.querySelectorAll('input[data-asm816]').forEach(i => i.onchange = () => { let m = {}; try { m = JSON.parse(localStorage.getItem(ASSUME816_KEY) || '{}') || {}; } catch (e) {} const v = Number(i.value);
		if (isFinite(v) && v > 0) m[i.dataset.asm816] = v; else delete m[i.dataset.asm816]; try { localStorage.setItem(ASSUME816_KEY, JSON.stringify(m)); } catch (e) {} redraw(); });
	const rs = pane.querySelector('button[data-asm816="reset"]'); if (rs) rs.onclick = () => { try { localStorage.removeItem(ASSUME816_KEY); } catch (e) {} redraw(); };
	{ const st = pane.querySelector('.strip816'), on = st && st.querySelector('.dday816.on'); if (st && on) { const l = on.offsetLeft - st.clientWidth / 2 + on.offsetWidth / 2; if (l > 0 && st.scrollWidth > st.clientWidth) st.scrollLeft = l; } }
}
/* every proposed date in view, written through setDate one by one, in the presser's name; one redraw at the end */
function confirm816(iso, br){
	if (!mayWrite('the demob dates')) return 0;
	const who = whoAmI(); if (!who) return 0;
	const Dy = demob816().day[iso]; if (!Dy) return 0;
	const keys = Dy.list.filter(r => r.src === 'proposed' && (br === 'all' || r.branch === br)).map(r => r.key);
	const b0 = bump; let n = 0;
	try { bump = () => {}; keys.forEach(k => { if (setDate(k, iso, 'out')) n++; }); } finally { bump = b0; }
	DM816.confirm = false; bump();
	flash(n + ' due-out date' + (n === 1 ? '' : 's') + ' written for ' + dayWords816(iso) + ', in the name of ' + who + '.');
	return n;
}
/* -------- the run sheets: one A4 per load, in the day documents' look */
function sheet816(iso, L){
	const A = assume816(), dep = DATA.depot || {}, rules = DATA.driver_rules || {};
	const emp = L.stops.some(s => s.r.empty), pairs = L.stops.filter(s => s.parts.some(p => p.tank) && s.parts.some(p => !p.tank));
	const box = n => '<span class="rsb816">' + '<i></i>'.repeat(Math.max(1, Math.min(n, 30))) + '</span>';
	const rows = L.t.st.map((x, i) => { const s = x.s, r = s.r;
		return `<tr><td class="c">${i + 1}</td><td>${clock816(x.at)}</td><td><b>${esc(DM816.name[r.zone])}</b><span>${esc(wayIn816(r.a, {zone: r.zone, sea: null}))}</span></td><td class="pl">${esc(r.key)}</td>
<td>${s.parts.map(p => `<div>${p.n} × ${esc(p.type)}${p.tank ? ' <b>- the tank, after the toilet</b>' : ''}</div>`).join('')}${r.empty && !r.emptied ? '<div class="nr">NOT READY: empty first</div>' : ''}</td>
<td>${r.empty ? s.parts.map(p => box(p.n)).join('') : '<span class="na">-</span>'}</td><td>${box(1)}</td></tr>`; }).join('');
	return `<div class="dp-page dp-drv rs816"><header class="dp-hd"><div class="dp-hd-l"><b>Coates</b><span>Industrial Solutions</span></div>
<div class="dp-hd-m"><span>Demob run sheet · GC500 2026</span><h1>Collection · ${esc(fmtDate(iso))}</h1></div>
<div class="dp-hd-r"><b>${esc(L.group)}</b><span class="dp-lx">Truck ${L.truck} · Load ${L.n} of ${L.of}</span></div></header>
<div class="rsk816"><span><label>Site hours</label><b>07:00–17:00</b></span><span><label>Depot</label><b>${esc(dep.name || 'Coates Kingston')}</b>${dep.address ? `<em>${esc(dep.address)}</em>` : ''}</span><span><label>Leave Kingston</label><b>${clock816(L.t.dep)}</b></span><span><label>On site</label><b>${clock816(L.t.arrive)}</b></span><span><label>Leave site</label><b>${clock816(L.t.leave)}</b></span><span><label>Back</label><b>${clock816(L.t.back)}</b></span></div>
${emp ? '<div class="rsw816">MUST BE EMPTIED BEFORE LOADING — DO NOT LOAD IF NOT PUMPED OUT. Tick each unit as it is pumped out.</div>' : ''}
${L.kind === 'oversize' ? `<div class="rso816">Oversize: check permit / travel window before this truck leaves.${ovNote816(iso) ? ' Note: ' + esc(ovNote816(iso)) : ''}</div>` : ''}
<section class="dp-sec"><h2>Stops, in pick-up order</h2><table class="rst816"><thead><tr><th>#</th><th>Time</th><th>Area · way in</th><th>Ref</th><th>What · units</th><th>Pumped out</th><th>Loaded</th></tr></thead><tbody>${rows}</tbody></table></section>
${pairs.length ? `<section class="dp-sec"><h2>Toilet before tank</h2><p>${pairs.map(s => `<b>${esc(s.r.key)}</b>: lift the toilet off first, then the waste tank under it.`).join(' ')}</p></section>` : ''}
<section class="dp-sec"><h2>Rules</h2><p>No travel to or from the Gold Coast 07:00–09:00 or 16:00–18:00. ${esc(rules.escort || '')} ${rules.ppe ? 'PPE: ' + esc(rules.ppe.join(', ')) + '.' : ''} Times are planned from: ${esc(A.run.lab)} ${A.run.v} min; ${esc(A.between.lab.toLowerCase())} ${A.between.v} min; ${esc(A.stop.lab.toLowerCase())} ${A.stop.v} min${L.kind === 'toilets' ? '; each event portable ' + A.unit.v + ' min' : ''} - a planning sketch, not a booking.</p></section>
<section class="dp-sec rss816"><h2>Sign-off</h2><div><span>Driver</span><i></i><span>Signature</span><i></i><span>Time</span><i></i></div><div><span>Site lead</span><i></i><span>Signature</span><i></i><span>Time</span><i></i></div></section>
<div class="dp-ft"><span><b>${esc(DATA.brand.org || 'Coates Industrial Solutions')} · GC500 2026 · Author: ${esc(DATA.brand.author || 'Andrew Fisher')}</b></span><span>A proposed date is not a booking until it is confirmed on the page</span><span>Demob · ${esc(fmtDate(iso))} · Load ${L.n} of ${L.of}</span></div></div>`;
}
function printDay816(iso, br, what, n){
	let T = trucks816(iso, br);
	if (what === 'load') T = T.filter(L => L.kind === 'toilets' && L.toilet.n === n);
	if (what === 'truck') T = T.filter(L => L.n === n);
	if (!T.length) { flash('Nothing to print for ' + dayWords816(iso) + '.'); return 0; }
	const wrap = document.getElementById('dayprint') || (() => { const e = document.createElement('div'); e.id = 'dayprint'; document.body.appendChild(e); return e; })();
	wrap.innerHTML = T.map(L => sheet816(iso, L)).join(''); wrap.classList.remove('ps7wrap'); wrap.classList.add('dpwrap'); wrap.dataset.dp816 = String(T.length);
	document.querySelectorAll('#dayPage').forEach(e => e.remove());
	const st = document.createElement('style'); st.id = 'dayPage'; st.textContent = '@page{size:A4 portrait;margin:8mm}'; document.head.appendChild(st);
	document.body.classList.add('printing-day');
	const done = () => { st.remove(); wrap.classList.remove('dpwrap'); document.body.classList.remove('printing-day'); };
	window.addEventListener('afterprint', done, {once: true});
	flash('Preparing ' + T.length + ' run sheet' + (T.length === 1 ? '' : 's') + ', one page per load.');
	setTimeout(() => { try { window.print(); } catch (e) { done(); } }, 60);
	return T.length;
}
