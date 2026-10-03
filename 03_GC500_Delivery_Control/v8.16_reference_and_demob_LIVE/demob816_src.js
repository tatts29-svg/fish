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
	/* a quantity nobody has stated is "quantity to confirm": counted as unknown, never assumed to be one */
	return rows.map(r => { const q = r.qty_supplied != null ? r.qty_supplied : r.qty_asked, unknown = q == null || q === '' || !isFinite(Number(q));
		return {type: r.asked, n: unknown ? 0 : Number(q), unknown, evt: EVT816.test(String(r.asked).trim()), tank: TANK816.test(r.asked)}; });
}
/* WHO OWNS THE PORTABLES - two runs that never mix (the project manager, 3 Oct 2026: "Its the subhired porta loos will
 go on a run... coates portaloos will go on their own run if any"). Read from the v7.29 inventory's own record: the
 supplier's units on the reference (subOf) and the Coates asset numbers on it (invCountNums, by item where itemNumbersOf
 has them). A unit nobody has recorded as either is "owner to confirm" and goes on neither run. */
const RUN816 = {sub: {cap: 24, words: 'Sub-hire toilet run'}, coates: {cap: 12, max: 14, words: 'Coates toilet run'}};
function owner816(a, u, evtN, evtUnk){
	let subs = [], nums = [], LM = null, site = null;
	try { subs = subOf(a.key) || []; } catch (e) {} try { nums = (invCountNums(a) || []).map(String); } catch (e) {}
	try { LM = itemNumbersOf(a); } catch (e) {} try { site = subhireOf(a.key); } catch (e) {}
	const co = [...new Set(subs.map(s => s && s.co).filter(Boolean))].join(', ') || (site && site.co) || '';
	const pure = u.every(x => x.evt), cn = new Set(nums);
	const coatesNums = LM ? u.filter(x => x.evt).reduce((s, x) => s + (LM[x.type] || []).filter(n => cn.has(String(n))).length, 0) : pure ? nums.length : 0;
	if (evtUnk) { const s = subs.length || site ? 'sub' : coatesNums ? 'coates' : null; return {streams: s ? [{s, n: evtN}] : [], ownerUnk: s ? 0 : Math.max(evtN, 1), co}; }
	const sub = Math.min(subs.length, evtN), coates = Math.min(coatesNums, evtN - sub), unk = evtN - sub - coates;
	return {streams: [sub ? {s: 'sub', n: sub} : null, coates ? {s: 'coates', n: coates} : null].filter(Boolean), ownerUnk: unk, co};
}
function needsEmpty816(a){ const x = a && a.key ? a : assetOf(a); if (!x) return false; return refKind(x) === 'toilet' || (x.item_types || []).some(t => TANK816.test(t)); }
function emptiedOf816(key){
	const l = (S.delivery || {})[key] || {}, c = ((typeof CROW !== 'undefined' && CROW.get(key)) || {}).delivery || {};
	/* the newest record wins, local or committed, by its own time; a tie goes to this device's */
	const both = [l, c].filter(x => typeof x.emptied === 'boolean').sort((x, y) => String(y.emptied_at || '').localeCompare(String(x.emptied_at || '')));
	/* two records of the same moment that disagree are not proof: the not-emptied one stands until it is ticked again */
	const s = both.length === 2 && String(both[0].emptied_at || '') === String(both[1].emptied_at || '') && both[0].emptied !== both[1].emptied ? both.find(x => x.emptied === false) : both[0] || null;
	const proven = !!(s && s.emptied === true && s.emptied_by && s.emptied_at && !isNaN(Date.parse(s.emptied_at)));
	/* a clearance belongs to this use: one recorded before the unit last arrived (an earlier visit, a reuse) clears nothing */
	const on = lastOnSite816(key), stale = !!(proven && on && Date.parse(s.emptied_at) < Date.parse(on));
	return {on: proven && !stale, by: s ? s.emptied_by || null : null, at: s ? s.emptied_at || null : null, unproven: !!(s && s.emptied === true && !proven), stale};
}
/* when the record last had the unit arrive on site - the start of the use a pump-out has to follow */
function lastOnSite816(key){
	let d = null; try { d = deliveryOf(key); } catch (e) { d = null; } if (!d) return null;
	const ts = (d.history || []).filter(h => h && h.state === 'on site' && h.at).map(h => h.at).concat(d.state === 'on site' && d.set_at ? [d.set_at] : []).filter(x => !isNaN(Date.parse(x)));
	return ts.length ? ts.sort((x, y) => Date.parse(x) - Date.parse(y)).pop() : null;
}
/* a unit set on site again starts a new use: an earlier pump-out is taken off, in the setter's name, with the reason */
function revokeEmptied816(key, d, who, now){
	if (!needsEmpty816(key) || !d) return;
	const c = ((typeof CROW !== 'undefined' && CROW.get(key)) || {}).delivery || {};
	if (d.emptied !== true && c.emptied !== true) return;
	d.emptied = false; d.emptied_by = who; d.emptied_at = now;
	d.emptied_history = (d.emptied_history || []).concat([{emptied: false, at: now, by: who, because: 'set on site again - a new use'}]).slice(-400);
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
/* THE GATE - THE RULE IN ONE LINE: the emptied gate applies to every OUTGOING movement of a toilet or a waste tank
 (collection, loading, carrying it off, taking it off site). It is passed only by an Emptied record with a person and a
 time, newer than the unit's last arrival on site - whatever the date and whatever light it shows now.
 The one movement it does not gate is an INCOMING DELIVERY, and only when the record itself says so (movePurpose816):
   - the record has never had the unit on site (no arrival, no complete tick, no on-site history), AND
   - the record holds a delivery date for it (the plan's or a typed one: effectiveDates(a).in), AND
   - today is before the first event day, its own out date and the start of demob, whichever is earliest.
 A unit with no recorded arrival AND no delivery date is not assumed to be on its way in: refused until emptied. Every
 collection path (the Demob tab's Collected) is forced through the gate whatever the purpose says. */
function everOnSite816(key){ const d = deliveryOf(key); return d.state === 'on site' || !!d.done || (d.history || []).some(h => h && h.state === 'on site'); }
function movePurpose816(key){
	if (everOnSite816(key)) return 'outgoing';
	const a = assetOf(key); let inDate = null; try { inDate = a ? (effectiveDates(a) || {}).in || null : null; } catch (e) { inDate = null; }
	if (!inDate) return 'outgoing';
	let out = null; try { const r = demobOf816(key); out = r && r.iso; } catch (e) { out = null; }
	const ev0 = (typeof EVENT_DAYS !== 'undefined' && EVENT_DAYS.length ? EVENT_DAYS.slice().sort()[0] : null);
	const from = [DM816.start, out, ev0].filter(Boolean).sort()[0];
	return todayIso() < from ? 'incoming delivery' : 'outgoing';
}
function incoming816(key){ return movePurpose816(key) === 'incoming delivery'; }
function emptyGate816(key, state, force){
	const a = assetOf(key); if (!a || !needsEmpty816(a)) return true;
	if (state !== 'in transit' && state !== 'not on site') return true;
	if (!force && incoming816(key)) { flash(key + ': ' + state + ' recorded as its delivery to site - no arrival is recorded yet and it is before the event. The emptied rule applies when it leaves.'); return true; }
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
	let rows = []; try { rows = subhireOf(a.key) ? [] : typeof onhireForAsset === 'function' ? onhireForAsset(a) || [] : ((rentalOf(a.key) || {}).lines || []); } catch (e) { rows = []; }
	const ds = [...new Set(rows.map(l => l.demob_date).filter(Boolean))].sort();
	return {early: ds.find(x => x < DM816.end) || null, last: ds.length ? ds[ds.length - 1] : null};
}
function cmp816(x, y){
	const a = [DM816.order.indexOf(x.zone), x.branch, x.kind, x.key], b = [DM816.order.indexOf(y.zone), y.branch, y.kind, y.key];
	for (let i = 0; i < 4; i++) { if (a[i] < b[i]) return -1; if (a[i] > b[i]) return 1; }
	return 0;
}
/* pack event-portable units into loads of DM816.cap, in the order given: each load takes the next references that fit */
function pack816(items, cap){
	const q = items.map(x => ({r: x.r || x, n: Math.max(0, x.n != null ? x.n : x.evtN), part: false})), loads = [];
	while (q.length) {
		const L = {rows: [], units: 0};
		for (let i = 0; i < q.length && L.units < cap;) {
			const it = q[i];
			if (L.units + it.n <= cap) { L.rows.push({r: it.r, n: it.n, part: it.part}); L.units += it.n; q.splice(i, 1); continue; }
			if (!L.rows.length && it.n > cap) { L.rows.push({r: it.r, n: cap, part: true}); L.units = cap; it.n -= cap; it.part = true; it.r.split816 = true; break; }
			i++;
		}
		if (!L.rows.length) { const it = q.shift(); L.rows.push({r: it.r, n: it.n, part: it.part}); L.units = it.n; }
		loads.push(L);
	}
	return loads;
}
/* the portions a person confirmed for a reference picked up over several days: kept only while they still end on the
 reference's due-out date (a later move of the date sets them aside) */
function storedPortions816(key, outDate){
	if (!outDate) return null;
	const raw = ((S.delivery || {})[key] || {}).out_portions;
	if (!Array.isArray(raw) || raw.length < 2) return null;
	const P = raw.filter(p => p && /^\d{4}-\d{2}-\d{2}$/.test(p.date) && Number(p.units) > 0).map(p => Object.assign({iso: p.date, n: Number(p.units)}, p.stream ? {s: p.stream} : {}));
	return P.length === raw.length && P.map(p => p.iso).sort().pop() === outDate ? portionIds816(P) : null;
}
/* every portion carries a stable id - its day and its place among that day's portions - so two portions on one day are
 two portions, never one found twice */
function portionIds816(P){ const seen = {}; return P.map(p => { if (p.unplanned) return p; const g = p.iso + (p.s ? '.' + p.s : ''), k = seen[g] = (seen[g] || 0) + 1; return Object.assign({}, p, {id: g + '#' + k}); }); }
/* QUANTITY CHANGED SINCE THE PORTIONS WERE CONFIRMED: never lost, never counted twice, always said. More units than the
 portions hold ride as an "unplanned" portion on the due-out day; fewer come off the last portions first; a quantity now
 unknown keeps the portions and says the total is to confirm. */
function reconcile816(P, evtN, evtUnk, outDate, streams){
	if (!P) return {portions: null, qty: null};
	const one = streams && streams.length === 1 ? streams[0].s : null;
	P = P.map(p => p.s || !one ? p : Object.assign({}, p, {s: one}));
	const was = P.reduce((s, p) => s + p.n, 0);
	if (evtUnk) return {portions: P, qty: {was, now: null, words: 'quantity changed since the portions were confirmed: now to confirm'}};
	/* each run on its own: the units a run holds now against the portions confirmed for it */
	const want = {}; (streams || []).forEach(x => { want[x.s] = (want[x.s] || 0) + x.n; });
	const runs = [...new Set(P.map(p => p.s || '').concat(Object.keys(want)))];
	const now = Object.values(want).reduce((s, x) => s + x, 0);
	if (runs.every(k => (want[k] || 0) === P.filter(p => (p.s || '') === k).reduce((s, p) => s + p.n, 0))) return {portions: P, qty: null};
	let Q = [];
	runs.forEach(k => { const mine = P.filter(p => (p.s || '') === k).map(p => Object.assign({}, p)), have = mine.reduce((s, p) => s + p.n, 0), w = want[k] || 0;
		if (w > have) mine.push(Object.assign({iso: outDate, n: w - have, unplanned: true, id: outDate + (k ? '.' + k : '') + '#u'}, k ? {s: k} : {}));
		else if (w < have) { let cut = have - w; mine.reverse().forEach(p => { const x = Math.min(cut, p.n); cut -= x; p.n -= x; }); mine.reverse(); }
		Q = Q.concat(mine.filter(p => p.n > 0)); });
	Q.sort((x, y) => x.iso.localeCompare(y.iso));
	const words = now > was ? 'quantity changed from ' + was + ' to ' + now + ' since confirmed: ' + (now - was) + ' unit' + (now - was === 1 ? '' : 's') + ' unplanned - on the due-out day until moved'
		: now < was ? 'quantity changed from ' + was + ' to ' + now + ' since confirmed: ' + (was - now) + ' fewer - taken off the last portion' + (was - now === 1 ? '' : 's')
		: 'the owners changed since the portions were confirmed - re-planned by owner';
	return {portions: Q.length ? Q : null, qty: {was, now, words}};
}
function demob816(){
	const memo = typeof RENDER_MEMO !== 'undefined' && RENDER_MEMO instanceof Map ? RENDER_MEMO : null;
	if (memo && memo.has('demob816')) return memo.get('demob816');
	const D = days816(), first = D[0], last = D[D.length - 1];
	const refs = allAssets().filter(a => !a._cancelled && !rowOff(a.key)).map(a => {
		const d = deliveryOf(a.key), eff = effectiveDates(a), c = contract816(a), z = zone816(a), u = units816(a);
		const evtN = u.filter(x => x.evt).reduce((s, x) => s + x.n, 0), evtUnk = u.some(x => x.evt && x.unknown), other = u.filter(x => !x.evt && (x.n > 0 || x.unknown));
		const removeEv = (a.events || []).some(e => e && e.movement === 'remove' && e.date);
		const plan = a._added && !removeEv && a.last_date && a.last_date === a.first_date ? null : eff.out_plan; /* an added reference's own first day is not a plan date out; a dated removal event is */
		let br = '—'; try { const b = branchOf(a.key); br = (b && (b.code || b)) || '—'; } catch (e) {}
		if (typeof br !== 'string') br = '—';
		const src = d.out_date ? 'confirmed' : plan ? 'plan' : c.early ? 'contract' : 'proposed';
		const own = owner816(a, u, evtN, evtUnk);
		return {key: a.key, a, kind: refKind(a), branch: br, zone: z.zone, side: z.side, pt: z.pt, src, streams: own.streams, ownerUnk: own.ownerUnk, subCo: own.co,
			iso: d.out_date || plan || c.early || null, contractEnd: c.last, units: u, evtN, evtUnk, evtPure: (evtN > 0 || evtUnk) && !other.length, ...(() => { const rc = reconcile816(storedPortions816(a.key, d.out_date), evtN, evtUnk, d.out_date, own.streams); return {portions: rc.portions, qtyChange: rc.qty}; })(),
			nothing: u.length > 0 && u.every(x => !x.unknown && x.n === 0), empty: needsEmpty816(a), emptied: emptiedOf816(a.key).on, big: refKind(a) === 'building' || u.some(x => !x.evt && (x.n > 0 || x.unknown) && BIG816.test(x.type)),
			tank: u.some(x => x.tank && (x.n > 0 || x.unknown)), sub: (() => { try { const s = subhireOf(a.key); return s ? s.co : null; } catch (e) { return null; } })()};
	});
	const byKey = new Map(refs.map(r => [r.key, r]));
	const fixedOn = iso => refs.filter(r => r.src !== 'proposed' && r.iso === iso).length;
	const prop = refs.filter(r => r.src === 'proposed').sort(cmp816);
	const outP = prop.filter(r => r.side === 'outside'), inP = prop.filter(r => r.side === 'inside'), unkP = prop.filter(r => r.side === 'unknown');
	/* the event portables go as full loads: outside first, then the island (and those with no position last) */
	const packs = r => r.evtPure && (r.evtN > 0 || r.evtUnk) && r.streams.length > 0; /* a known 0 makes no load; an unknown quantity rides as "to confirm"; an unknown owner rides on neither run */
	/* each run packs on its own: the supplier's at up to 24, Coates at 12 - a load never holds both */
	const packRun = rs => ['sub', 'coates'].flatMap(s => pack816(rs.filter(packs).flatMap(r => r.streams.filter(x => x.s === s).map(x => ({r, n: x.n}))), RUN816[s].cap).map(L => Object.assign(L, {stream: s})));
	const loadsOut = packRun(outP), loadsIn = packRun(inP), loadsUnk = packRun(unkP);
	const block = L => ({load: L, size: L.rows.length, key: L.rows[0].r});
	const queue = (rs, Ls) => rs.filter(r => !packs(r)).map(r => ({r, size: 1, key: r})).concat(Ls.map(block)).sort((x, y) => cmp816(x.key, y.key));
	/* balanced per day, in order: each day is filled to its share of the window's running total (fixed dates included),
	 so the order holds - outside before the island, area by area - and the remainder lands at the end */
	const fill = (Q, days) => {
		const n = days.length, base = days.map(d => refs.filter(r => r.iso === d || (r.portions && r.portions.some(p => p.iso === d))).length);
		/* a reference split over loads keeps a portion per load, each with its own day; its out date is the last of them */
		const put = (it, k) => { const iso = days[k]; if (!it.load) { it.r.iso = iso; return; } it.load.iso = iso;
			it.load.rows.forEach(x => { x.iso = iso; if (x.r.split816 || x.r.streams.length > 1) { x.r.portions = portionIds816((x.r.portions || []).concat([{iso, n: x.n, s: it.load.stream}])); x.r.iso = x.r.portions.map(p => p.iso).sort().pop(); } else x.r.iso = iso; }); };
		/* a toilet load goes whole, onto the day with the most room left in its weeks */
		Q.filter(it => it.load).forEach(it => { let best = 0; for (let k = 1; k < n; k++) if (base[k] < base[best]) best = k; base[best] += it.size; put(it, best); });
		/* then the rest, in order, so every day ends as level as it can: the water level L that the singles fill to */
		const singles = Q.filter(it => !it.load), S = singles.length;
		let lo = 0, hi = Math.max(...base) + S;
		for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (base.reduce((s, b) => s + Math.max(0, mid - b), 0) < S) lo = mid; else hi = mid; }
		const want = base.map(b => Math.max(0, hi - b)), quota = want.map(Math.floor);
		let left = S - quota.reduce((s, x) => s + x, 0);
		want.map((w, k) => [w - Math.floor(w), k]).sort((x, y) => y[0] - x[0] || x[1] - y[1]).forEach(([, k]) => { if (left > 0) { quota[k]++; left--; } });
		let di = 0;
		singles.forEach(it => { while (di < n - 1 && quota[di] <= 0) di++; quota[di]--; put(it, di); });
	};
	fill(queue(outP, loadsOut), D.slice(0, 5));
	fill(queue(inP, loadsIn), D.slice(5));
	/* no position of its own: the end of week 3, once the island is planned */
	fill(queue(unkP, loadsUnk), D.slice(-3));
	/* each day: its references, its toilet run, its pump-out run */
	const planned = loadsOut.concat(loadsIn, loadsUnk);
	const day = {};
	D.forEach((iso, i) => {
		const list = refs.filter(r => r.iso === iso || (r.portions && r.portions.some(p => p.iso === iso))).sort(cmp816);
		const loads = planned.filter(L => L.iso === iso).map(L => ({rows: L.rows.map(x => ({r: x.r, n: x.n, part: x.part, iso})), units: L.units, planned: true, stream: L.stream}));
		const placed = new Set(loads.flatMap(L => L.rows.map(x => x.r.key)));
		const rest = list.filter(r => (r.evtN > 0 || r.evtUnk) && r.streams.length && !placed.has(r.key));
		/* each portion of the day is placed on its own (two portions on one day are two portions); a reference without
		 portions is one piece of work. An unknown quantity rides as a row of its own - nothing assumed. */
		const work = rest.flatMap(r => r.portions ? r.portions.filter(p => p.iso === iso).map(P => ({r, P, n: P.n, s: P.s || r.streams[0].s})) : r.streams.map(x => ({r, P: null, n: x.n, s: x.s})));
		work.forEach(({r, P, n, s}) => { let done = false; const extra = {part: !!P, iso, pid: P ? P.id : null, unplanned: !!(P && P.unplanned)};
			for (const L of loads) { if (done) break; if (L.stream !== s || (L.rows[0].r.side !== r.side && r.side !== 'unknown')) continue; const room = RUN816[s].cap - L.units; if (room >= n) { L.rows.push(Object.assign({r, n}, extra)); L.units += n; done = true; } }
			if (!done) pack816([{r, n}], RUN816[s].cap).forEach(x => { x.rows.forEach(y => Object.assign(y, extra, {part: y.part || !!P})); loads.push(Object.assign(x, {planned: false, stream: s})); }); });
		const sideIx = L => L.rows[0].r.side === 'outside' ? 0 : L.rows[0].r.side === 'inside' ? 1 : 2;
		loads.sort((x, y) => (x.stream === y.stream ? 0 : x.stream === 'sub' ? -1 : 1) || sideIx(x) - sideIx(y) || cmp816(x.rows[0].r, y.rows[0].r));
		const seq = {};
		for (let k = 0; k < loads.length && k < 200; k++) { const L = loads[k]; L.n = (seq[L.stream] = (seq[L.stream] || 0) + 1); L.id = L.stream + L.n; L.cap = capOf816(iso, L);
			/* the truck takes fewer than the load holds (a lower capacity typed for it): what does not fit goes on a new load of the same run, same side */
			if (L.units > L.cap) { let room = L.cap; const keep = [], over = [];
				L.rows.forEach(x => { if (room >= x.n) { keep.push(x); room -= x.n; } else if (room > 0) { keep.push(Object.assign({}, x, {n: room, part: true})); over.push(Object.assign({}, x, {n: x.n - room, part: true})); room = 0; } else over.push(x); });
				L.rows = keep; L.units = keep.reduce((s, x) => s + x.n, 0);
				if (over.length) loads.splice(k + 1, 0, {rows: over, units: over.reduce((s, x) => s + x.n, 0), planned: false, stream: L.stream, repacked: true}); }
			L.free = L.cap - L.units; L.over = L.units > L.cap; L.capWarn = L.stream === 'coates' && L.cap > RUN816.coates.max; L.uncertain = L.rows.some(x => x.r.evtUnk); L.rows.sort((x, y) => cmp816(x.r, y.r)); }
		const next = D[i + 1];
		const onDay = (r, d) => r.iso === d || !!(r.portions && r.portions.some(p => p.iso === d));
		const pump = refs.filter(r => r.empty && !r.emptied && !r.nothing && (onDay(r, iso) || (next && onDay(r, next)))).sort(cmp816)
			.map(r => ({r, when: onDay(r, iso) ? 'today' : 'next'}));
		day[iso] = {iso, i, list, loads, pump, outside: list.filter(r => r.side === 'outside').length, island: list.filter(r => r.side === 'inside').length, unknown: list.filter(r => r.side === 'unknown').length};
	});
	const counts = {total: refs.length, plan: refs.filter(r => r.src === 'plan').length, contract: refs.filter(r => r.src === 'contract').length,
		proposed: refs.filter(r => r.src === 'proposed').length, confirmed: refs.filter(r => r.src === 'confirmed').length};
	const outside = refs.filter(r => r.iso && !D.includes(r.iso)).sort((x, y) => x.iso.localeCompare(y.iso)); /* before, after, or a weekend / public holiday inside the window */
	const M = {refs, byKey, days: D, day, counts, outside, planned};
	if (memo) memo.set('demob816', M);
	return M;
}
function capOf816(iso, L){
	if (L.stream !== 'coates') return RUN816.sub.cap;
	let v = null; try { v = Number(localStorage.getItem('gc500.demob816.cap.' + iso + '.' + L.stream + L.n)); } catch (e) { v = null; }
	return v && isFinite(v) && v > 0 ? Math.round(v) : RUN816.coates.cap;
}
function demobOf816(key){ return demob816().byKey.get(key) || null; }
const SRC816 = {confirmed: 'confirmed', plan: 'plan', contract: 'contract', proposed: 'proposed'};
/* the page's own chips: confirmed ok, plan ref, contract cand; a proposed date is the act chip with a dashed edge */
const SRCC816 = {confirmed: 'ok', plan: 'ref', contract: 'cand', proposed: 'act'};
function srcChip816(src){ return `<span class="chip ${SRCC816[src] || ''} src816 s-${esc(src)}" title="${esc({confirmed: 'a person typed this due-out date', plan: 'the plan\'s remove event', contract: 'the rental contract\'s off-hire date', proposed: 'worked out by the demob rule - not on the record until a person confirms it'}[src] || '')}">${esc(SRC816[src] || src)}</span>`; }
/* -------- planning assumptions: the page's own figures first; anything else is labelled and can be changed here */
const ASSUME816_KEY = 'gc500.demob816.assume';
function assume816(){
	let mine = {}; try { mine = JSON.parse(localStorage.getItem(ASSUME816_KEY) || '{}') || {}; } catch (e) { mine = {}; }
	const pre = ((DATA.depot || {}).planning || {}).precinct_min;
	const base = {between: {v: pre != null ? pre : 10, lab: 'Between areas inside the precinct', why: 'the depot\'s precinct allowance (DATA.depot.planning)'},
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
/* the stops of one load, in pick-up order. A reference holding a toilet and the tank it sits on is two stops: the toilet
 first, then the tank under it - and a tank never starts before every toilet of its reference is off, on any truck. */
function part816(y, tank){ return {type: y.type, n: y.n, unknown: !!y.unknown, tank}; }
function stops816(rows, toiletRun){
	const out = [];
	rows.forEach(x => { const r = x.r, u = r.units.filter(y => (y.n > 0 || y.unknown) && (toiletRun ? y.evt : !y.evt));
		if (toiletRun) { out.push({r, n: x.n, part: x.part, area: r.zone, parts: [{type: (u.map(y => y.type).join(' + ') || 'event portables') + (x.unplanned ? ' (unplanned - quantity changed)' : ''), n: x.n, unknown: u.some(y => y.unknown), tank: false}]}); return; }
		const top = u.filter(y => !y.tank).map(y => part816(y, false)), tanks = u.filter(y => y.tank).map(y => part816(y, true));
		if (top.length) out.push({r, n: x.n, part: x.part, area: r.zone, parts: top});
		if (tanks.length) out.push({r, n: x.n, part: x.part, area: r.zone, parts: tanks, tankOnly: true});
		if (!top.length && !tanks.length && !r.units.length) out.push({r, n: x.n, part: x.part, area: r.zone, parts: [{type: (r.a.item_types || [])[0] || kindWord(r.a), n: 1, tank: false}]}); });
	return out;
}
function partWords816(p){ return (p.unknown ? 'quantity to confirm' : p.n) + ' × ' + p.type + (p.tank ? ' (the tank, after the toilet on it)' : ''); }
/* the trucks for one day: oversize pieces each on their own load; the rest by area, a few to a truck; the toilet run
 in its 24-unit loads, timed first so a tank waits for the toilets that sit on it. Each load is timed from Kingston and
 back inside the site hours and the no-travel windows; a load that does not fit a truck's day takes another truck. */
/* TRAVEL TIME, per run. Coates' own runs (the Coates toilet run and the branch's trucks) go from and back to Coates
 Kingston and start from the page's own planning figure - DATA.transport.kingston_run, the figure the v7.82 delivery-load
 rule uses (46.7 km straight line x 1.25 at 60 km/h + 10 min in the precinct) - labelled a planning figure, not a live
 time, and editable per run on this device; a live figure, when there is one, goes in the same field. Blank means "travel
 time to confirm": no departure is worked out. The supplier's pick-up has no travel time - it is not ours to plan. */
const TRAVEL816_KEY = 'gc500.demob816.travel';
function travel816(run){
	let mine = {}; try { mine = JSON.parse(localStorage.getItem(TRAVEL816_KEY) || '{}') || {}; } catch (e) { mine = {}; }
	if (mine[run] === '') return {v: null, edited: true, words: 'travel time to confirm'};
	const v = Number(mine[run]); if (mine[run] != null && isFinite(v) && v > 0) return {v: Math.round(v), edited: true, words: mine._from || 'typed for this run on this device'};
	/* a Kingston-run figure typed under the earlier draft's single setting is carried over once into every run, said so,
	 and the old setting removed - it never applies silently */
	try { const A0 = JSON.parse(localStorage.getItem(ASSUME816_KEY) || '{}') || {}, old = Number(A0.run);
		if (A0.run != null) { if (isFinite(old) && old > 0) { ['coates', 'branch'].forEach(k => { if (mine[k] == null) mine[k] = Math.round(old); }); mine._from = 'carried over from the earlier Kingston-run setting'; localStorage.setItem(TRAVEL816_KEY, JSON.stringify(mine)); }
			delete A0.run; localStorage.setItem(ASSUME816_KEY, JSON.stringify(A0)); if (mine[run] != null && mine[run] !== '') return {v: Math.round(Number(mine[run])), edited: true, words: mine._from}; } } catch (e) {}
	let r = null; try { r = run782(); } catch (e) { r = null; }
	return r ? {v: r, edited: false, words: 'planning figure, not a live time', basis: ((DATA.transport || {}).kingston_run || {}).basis || ''} : {v: null, edited: false, words: 'travel time to confirm'};
}
/* OVERSIZE - only a load the branch flags (never guessed). QLD Access Conditions Guide v6.0 (Dec 2023): s11.2 Table 3,
 Gold Coast business days, no oversize travel 07:00-09:00 or 16:00-18:00, so on the road 09:00-16:00; s9 no convoys;
 s10.2 check the TMR Conditions of Operation Database before each trip; pilots and escorts by the permit. */
const OVSRC816 = 'QLD Access Conditions Guide v6.0 (copy supplied by the project manager): s11.2 Table 3 Gold Coast peak hours; s11.3 Table 4 weekends and public holidays; s9 no convoys; s10.2 before every trip';
const OVWIN816 = 'Project planning window: the QLD guide bars oversize vehicles in the Gold Coast 07:00–09:00 and 16:00–18:00 on business days; with site hours 07:00–17:00 we plan oversize moves 09:00–16:00.';
const OVFLAG816_KEY = 'gc500.demob816.oversize';
function ovFlag816(id, v){ let m = {}; try { m = JSON.parse(localStorage.getItem(OVFLAG816_KEY) || '{}') || {}; } catch (e) { m = {}; }
	if (v === undefined) return !!m[id]; if (v) m[id] = 1; else delete m[id]; try { localStorage.setItem(OVFLAG816_KEY, JSON.stringify(m)); } catch (e) {} return !!v; }
function ovCheck816(leave, travel){
	const out = {latest: travel != null ? 16 * 60 - travel : null, flags: []};
	if (travel == null) out.flags.push('travel time to confirm - no latest departure worked out');
	const PK = [[7 * 60, 9 * 60], [16 * 60, 18 * 60]], end = leave != null ? leave + (travel != null ? travel : 1) : null;
	if (leave != null && PK.some(([s, e]) => leave < e && end > s)) out.flags.push('on the road in a Gold Coast peak (07:00-09:00 or 16:00-18:00)');
	if (out.latest != null && leave != null && leave > out.latest && leave < 16 * 60) out.flags.push('leaves site ' + clock816(leave) + ', after the latest departure ' + clock816(out.latest) + ' - it would be on the road after 16:00');
	return out;
}
function trucks816(iso, branch){
	const M = demob816(), Dy = M.day[iso]; if (!Dy) return [];
	const A = assume816(), groups = new Map(), sup = [];
	const add = (g, L) => { if (!groups.has(g)) groups.set(g, []); groups.get(g).push(L); };
	const mineB = L => branch === 'all' || L.rows.some(x => x.r.branch === branch);
	/* the supplier's pick-up: a list of what is ready, in loads of up to 24 - no truck plan, no times */
	Dy.loads.filter(L => L.stream === 'sub' && mineB(L)).forEach(L => sup.push({kind: 'supplier', toilet: L, stops: stops816(L.rows, true), co: [...new Set(L.rows.map(x => x.r.subCo).filter(Boolean))].join(', ') || 'sub-hire supplier'}));
	Dy.loads.filter(L => L.stream === 'coates' && mineB(L)).forEach(L => add(RUN816.coates.words, {kind: 'toilets', run: 'coates', toilet: L, stops: stops816(L.rows, true)}));
	const list = Dy.list.filter(r => !r.evtPure && !r.nothing && (branch === 'all' || r.branch === branch));
	list.filter(r => r.big).forEach(r => add(r.branch, {kind: 'single', run: 'branch', stops: stops816([{r, n: 1}], false)}));
	const small = list.filter(r => !r.big);
	for (let i = 0; i < small.length; i += A.perLoad.v) { const ch = small.slice(i, i + A.perLoad.v); add(ch[0].branch, {kind: 'normal', run: 'branch', stops: stops816(ch.map(r => ({r, n: 1})), false)}); }
	const supKeys = new Set(sup.flatMap(L => L.stops.map(s => s.r.key)));
	const out = [], topEnd = new Map(); /* the latest time a toilet of each reference is off, across every truck */
	groups.forEach((loads, g) => {
		const lanes = [];
		loads.forEach(L => {
			const tv = travel816(L.run).v;
			const fit = (t0, strict) => { let dep = null, b, t;
				if (tv != null) { dep = Math.max(t0, OPEN816 - tv); while ((b = ban816(dep, dep + tv))) dep = b[1]; t = Math.max(dep + tv, OPEN816); }
				else t = Math.max(t0, OPEN816);
				const arrive = t, st = [], mine = new Map(); let prev = null;
				L.stops.forEach(s => { if (prev && prev !== s.area) t += A.between.v;
					if (s.tankOnly) { t = Math.max(t, topEnd.get(s.r.key) || 0, mine.get(s.r.key) || 0); if (supKeys.has(s.r.key)) s.afterSupplier = true; }
					const dur = L.kind === 'toilets' ? Math.max(15, s.n * A.unit.v) : A.stop.v; st.push({s, at: t, end: t + dur});
					if (!s.tankOnly) mine.set(s.r.key, Math.max(mine.get(s.r.key) || 0, t + dur));
					t += dur; prev = s.area; });
				let leave = t; if (tv != null) while ((b = ban816(leave, leave + tv))) leave = b[1];
				if (strict && (leave > CLOSE816 || t > CLOSE816)) return null;
				return {dep, arrive, st, leave, travel: tv, back: tv != null ? leave + tv : null, done: tv != null ? leave + tv + A.unload.v : Infinity};
			};
			let placed = null;
			for (const ln of lanes) { if (!isFinite(ln.free)) continue; const f = fit(ln.free, true); if (f) { placed = {ln, f}; break; } }
			if (!placed) { const ln = {n: lanes.length + 1, free: 0, loads: []}; let f = fit(0, true); if (!f) f = Object.assign(fit(0, false), {over: true}); lanes.push(ln); placed = {ln, f}; }
			placed.f.st.forEach(x => { if (!x.s.tankOnly) topEnd.set(x.s.r.key, Math.max(topEnd.get(x.s.r.key) || 0, x.end)); });
			placed.ln.free = placed.f.done; placed.ln.loads.push(Object.assign({}, L, {t: placed.f, truck: placed.ln.n}));
		});
		lanes.forEach(ln => ln.loads.forEach(L => out.push(Object.assign(L, {group: g}))));
	});
	/* a load the branch flags oversize is checked against the guide; two leaving together are told to stagger */
	out.forEach(L => { if (L.kind === 'toilets') return; L.ovId = iso + '|' + L.stops.map(s => s.r.key).join(','); L.ov = ovFlag816(L.ovId); if (L.ov) L.ovc = ovCheck816(L.t.leave, L.t.travel); });
	out.filter(L => L.ov).forEach(L => { if (out.some(o => o !== L && o.ov && o.t.leave === L.t.leave)) L.ovc.flags.push('stagger departures - oversize loads may not run in convoy'); });
	const all = sup.map(L => Object.assign(L, {group: 'Sub-hire pick-up · ' + L.co, t: {st: L.stops.map(s => ({s, at: null, end: null})), dep: null, arrive: null, leave: null, back: null, travel: null}, truck: L.toilet.n})).concat(out);
	all.forEach((L, i) => { L.n = i + 1; L.of = all.length; });
	return all;
}
/* -------- the tab */
function demobSel816(M){ if (!DM816.sel || !M.day[DM816.sel]) { const t = todayIso(); DM816.sel = M.days.find(d => d >= t) || M.days[0]; } return DM816.sel; }
function renderDemob816(){
	const pane = $('#pane-demob'); if (!pane) return;
	const M = demob816(), sel = demobSel816(M), C = M.counts, Dy = M.day[sel];
	const max = Math.max(1, ...M.days.map(d => M.day[d].list.length));
	const strip = M.days.map((iso, i) => { const x = M.day[iso], f = fmtDay(iso), tl = x.loads.length, tu = x.loads.reduce((s, L) => s + L.units, 0), tq = x.loads.some(L => L.rows.some(y => y.r.evtUnk)) ? '+' : '';
		const n = 12, o = x.outside / max, b = (x.outside + x.island) / max, u = x.list.length / max;
		return `<button type="button" class="ctile dday816${iso === sel ? ' on' : ''}${i % 5 === 0 ? ' wks' : ''}" data-dday816="${esc(iso)}" aria-pressed="${iso === sel}" aria-label="${esc(dayWords816(iso) + ': ' + x.list.length + ' to pick up' + (tl ? ', ' + tl + ' toilet load' + (tl === 1 ? '' : 's') : ''))}">
<span class="wk816">${i % 5 === 0 ? `<span class="chip act">Week ${i / 5 + 1}</span>` : ''}</span><p class="ctk">${esc(f.dow + ' ' + f.dm.slice(3))}</p><b>${esc(String(Number(f.dm.slice(0, 2))))}</b><span>${x.list.length} to pick up</span>
${dashLeds([[o, 'o'], [b, 'b'], [u, 'u']], x.outside + ' outside the island, ' + x.island + ' Macintosh Island, ' + x.unknown + ' position to confirm', n)}
${tl ? `<span class="chip cand tl816" title="the toilet run: ${tl} load${tl === 1 ? '' : 's'}, ${tu} units">WC ${tu}${tq}</span>` : '<span class="tl816 none"></span>'}</button>`; }).join('');
	/* dated outside the demob days: before or after the window, or a weekend / public holiday inside it - shown, never lost */
	const offDay = r => r.iso >= M.days[0] && r.iso <= M.days[M.days.length - 1];
	const early = M.outside.length ? `<p class="note816">Dated outside the demob days: ${M.outside.map(r => `<button type="button" class="linkish" data-k816="${esc(r.key)}">${esc(r.key)}</button> ${esc(dayWords816(r.iso))} (${esc(SRC816[r.src] || r.src)})${offDay(r) ? ' <span class="chip crit wkd816" title="' + esc(OVSRC816) + '">not a demob day - weekend or public holiday: an oversize load over 3.1 m wide or 25 m long may not travel 07:00 to sunset</span>' : ''}`).join(' · ')}.</p>` : '';
	pane.innerHTML = paneHeadingHtml('demob') + `
<div class="card hubcard island dialcard racecard dm816 nosfold"><div class="hubtitle"><h3>Demob · pick-up board</h3><span class="chip ref">Mon 26 Oct – Fri 13 Nov</span></div>
<div class="dmhead816"><div class="pstat"><b>15</b><span>working days</span><em>From the Monday after the race to Fri 13 Nov. Outside the island first, in week 1; Macintosh Island next, in weeks 2 and 3; area by area, then branch and type. Toilets and waste tanks are emptied before they are moved.</em></div>
<div class="cside"><div class="ctwo kp816"><div class="ctile good"><p class="ctk">To come off site</p><b>${C.total}</b><span>references</span></div><div class="ctile plan"><p class="ctk">Dated by the plan</p><b>${C.plan}</b><span>remove events</span></div>
<div class="ctile plan"><p class="ctk">Dated by the contract</p><b>${C.contract}</b><span>off-hire before 13 Nov</span></div><div class="ctile pr816"><p class="ctk">Proposed</p><b>${C.proposed}</b><span>confirm or move${C.confirmed ? ' · ' + C.confirmed + ' confirmed here' : ''}</span></div></div></div></div>
<div class="ord816"><span class="chip act">1 · Outside the island · week 1</span><span class="chip ref">2 · Macintosh Island · weeks 2–3</span><span class="chip cand">Position to confirm · end of week 3</span></div>
<div class="cside strip816" role="group" aria-label="Demob days">${strip}</div>
<p class="note816 leg816">Lights on each day: orange outside the island · blue Macintosh Island · grey position to confirm · WC: event-portable units on that day's toilet runs (the supplier's up to 24 a load, Coates' 12–14).</p>
${(() => { const q = M.refs.filter(r => r.units.some(u => u.unknown)); return q.length ? `<p class="note816">Quantity to confirm on ${q.length} reference${q.length === 1 ? '' : 's'}: ${q.map(r => `<button type="button" class="linkish" data-k816="${esc(r.key)}">${esc(r.key)}</button>`).join(' · ')} - not assumed; the loads that carry them say their total is not certain.</p>` : ''; })()}
${(() => { const q = M.refs.filter(r => r.qtyChange); return q.length ? `<p class="note816"><b>Quantity changed since the portions were confirmed:</b> ${q.map(r => `<button type="button" class="linkish" data-k816="${esc(r.key)}">${esc(r.key)}</button> ${esc(r.qtyChange.words)}`).join(' · ')}.</p>` : ''; })()}
${early}<div class="hubgo" data-go="timeline" role="link" tabindex="0">Open the Timeline →</div></div>
<div class="card hubcard dmday816 nosfold" aria-live="polite">${dayHtml816(M, Dy)}</div>
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
	const seg = (k, words) => `<button type="button" class="btn sm" data-view816="${k}" aria-pressed="${DM816.view === k}">${words}</button>`;
	const body = DM816.view === 'toilets' ? toiletHtml816(Dy) : DM816.view === 'pump' ? pumpHtml816(Dy) : DM816.view === 'trucks' ? trucksHtml816(Dy, T) : listHtml816(shown);
	return `<div class="hubtitle dmsh816"><h3>${esc(fmtDate(iso))} · ${shown.length} to pick up</h3><span class="chip ref">week ${week816(iso)}</span></div>
<div class="dmbar816"><div class="regviewsw br816" role="group" aria-label="Branch">${['all'].concat(brs).map(b => `<button type="button" class="btn sm" data-br816="${esc(b)}" aria-pressed="${br === b}">${b === 'all' ? 'All' : esc(b) + ' ' + Dy.list.filter(r => r.branch === b).length}</button>`).join('')}</div>
<div class="acts816">${prop.length ? `<button type="button" class="btn editonly" data-conf816="1">Confirm the ${prop.length} proposed</button>` : ''}
<button type="button" class="btn" data-print816="day">Print run sheets · ${T.length}</button>
<a class="btn primary" data-mail816="1" href="${esc(mail816(iso, br, shown, T))}">Email ${br === 'all' ? 'the branches' : esc(br)}</a></div></div>
${DM816.confirm && ed && prop.length ? `<div class="notice warn confirm816" role="alert"><b>Write ${prop.length} proposed date${prop.length === 1 ? '' : 's'} to the record?</b> ${esc(prop.map(r => r.key + (r.portions ? ' (' + r.portions.map(p => p.n + ' on ' + dayWords816(p.iso)).join(', ') + ')' : r.iso !== iso ? ' (' + dayWords816(r.iso) + ')' : '')).join(', '))} ${prop.length === 1 ? 'becomes' : 'become'} due out ${esc(dayWords816(iso))}${prop.some(r => r.portions || r.iso !== iso) ? ', or on the day shown' : ''}, in your name. Nothing else changes, and each one can be moved again.
<span class="acts816"><button type="button" class="btn primary" data-conf816="yes">Confirm ${prop.length}</button><button type="button" class="btn ghost" data-conf816="no">Not now</button></span></div>` : ''}
<div class="regviewsw segs816" role="group" aria-label="What to show">${seg('list', 'Pick-up list · ' + shown.length)}${seg('toilets', 'Toilet runs · ' + tl + ' load' + (tl === 1 ? '' : 's') + (tu ? ' · ' + tu : ''))}${seg('pump', 'Pump-out run · ' + Dy.pump.length)}${seg('trucks', 'Trucks and times · ' + T.length)}</div>
<div class="dmbody816">${body}</div>
<details class="dsect ovn816"><summary>Oversize: check permit / travel window for ${esc(dayWords816(iso))}</summary><div class="form"><div class="f"><label for="ovn816">Note for this day (kept on this device)</label><textarea id="ovn816" data-ro rows="2" placeholder="Permit, escort or travel window for the buildings and toilet blocks on this day">${esc(ovNote816(iso))}</textarea></div></div></details>`;
}
function ovNote816(iso, v){ const k = 'gc500.demob816.oversize.' + iso; try { if (v != null) { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); return v; } return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
function notReady816(r){ return r.nothing ? '' : r.empty && !r.emptied ? '<span class="chip crit nr816" title="No toilet or waste tank is loaded until it is pumped out">NOT READY: empty first</span>' : r.empty ? '<span class="chip ok">emptied</span>' : ''; }
function rowHtml816(r, extra){
	const ed = canEdit(), what = [(r.a.item_types || []).join(', ') || r.a.product || kindWord(r.a), r.a.name].filter(Boolean).join(' · ');
	const open = DM816.menu === r.key;
	return `<tr data-row816="${esc(r.key)}"><td class="refcell" data-label="GC500 ID"><button type="button" class="linkish plateb" data-k816="${esc(r.key)}" aria-label="Open ${esc(r.key)}">${refPlate(r.key, 15)}</button></td>
<td data-label="What">${esc(what)}${(r.evtN || r.evtUnk) && !r.evtPure ? `<br><span class="w">+ ${r.evtUnk ? 'quantity to confirm' : r.evtN} on the toilet run</span>` : ''}${r.portions ? `<br><span class="w">${esc(r.portions.map(p => p.n + ' on ' + dayWords816(p.iso)).join(', '))} - out ${esc(dayWords816(r.iso))}</span>` : ''}${r.units.some(u => u.unknown) ? ' <span class="chip crit">quantity to confirm</span>' : ''}${r.qtyChange ? ` <span class="chip crit qc816">${esc(r.qtyChange.words)}</span>` : ''}${r.nothing ? ' <span class="chip cand">quantity 0 - nothing to collect</span>' : ''}${(r.streams || []).map(s => ` <span class="chip ref">${s.s === 'sub' ? 'sub-hire pick-up' : 'Coates toilet run'}${r.streams.length > 1 ? ' · ' + s.n : ''}</span>`).join('')}${r.ownerUnk ? ` <span class="chip cand">owner to confirm${r.streams.length ? ' · ' + r.ownerUnk : ''}</span>` : ''}${r.side === 'unknown' ? ' <span class="chip cand">position to confirm</span>' : ''}${r.sub ? ` <span class="chip subhirechip">${esc(r.sub)}</span>` : ''}${extra || ''}</td>
<td data-label="Branch">${esc(r.branch)}</td><td data-label="Date from">${srcChip816(r.src)} ${notReady816(r)}</td>
<td data-label="Actions"><details class="menu816"${open ? ' open' : ''} data-menu816="${esc(r.key)}"><summary class="btn ghost sm" aria-label="More for ${esc(r.key)}">More</summary><div>
<button type="button" class="btn ghost sm" data-k816="${esc(r.key)}">Open ${esc(r.key)}</button>
${ed ? `<span class="mv816"><select data-mvd816="${esc(r.key)}" aria-label="Move ${esc(r.key)} to another day">${demob816().days.map(d => `<option value="${esc(d)}"${d === r.iso ? ' selected' : ''}>${esc(dayWords816(d))}</option>`).join('')}</select><button type="button" class="btn sm" data-mv816="${esc(r.key)}">Move</button></span>
${r.empty ? `<button type="button" class="btn sm${r.emptied ? '' : ' primary'}" data-emp816="${esc(r.key)}">${r.emptied ? 'Un-tick emptied' : 'Emptied (pumped out)'}</button>` : ''}
<button type="button" class="btn sm" data-col816="${esc(r.key)}">Collected - on the truck</button>` : ''}</div></details></td></tr>`;
}
const TH816 = '<thead><tr><th>GC500 ID</th><th>What</th><th>Branch</th><th>Date from</th><th>Actions</th></tr></thead>';
function listHtml816(rows){
	if (!rows.length) return '<p class="note816">Nothing to pick up for this branch on this day.</p>';
	return DM816.order.map(z => { const rs = rows.filter(r => r.zone === z); if (!rs.length) return '';
		return `<h4 class="area816">${esc(DM816.name[z])} · ${rs.length}</h4><div class="tblwrap daywrap"><table class="daytbl dm816t">${TH816}<tbody>${rs.map(r => rowHtml816(r)).join('')}</tbody></table></div>`; }).join('');
}
/* a time, or the words that say it is not known - never a made-up figure */
function tm816(n){ return n == null ? 'travel time to confirm' : clock816(n); }
function sideWords816(L){ const s = L.rows[0].r.side; return s === 'inside' ? 'Macintosh Island' : s === 'outside' ? 'outside the island' : 'position to confirm'; }
/* where a unit is: the destination Navigate uses and where that comes from (pin, master plan), else its reference */
function where816(r){
	let D = null; try { D = dest782(r.a); } catch (e) { D = null; }
	const goes = (S.locations || {})[r.key] || (r.a._locationMoved && r.a._locationMoved.from) || (r.a.locations || []).find(l => l && l !== r.key) || '';
	return [goes, D ? srcWords816(r.a, D) : 'reference ' + r.key].filter(Boolean).join(' · ');
}
function loadCard816(Dy, L, next){
	const coates = L.stream === 'coates', cap = L.cap;
	const chip = L.uncertain ? '<span class="chip cand unc816">to confirm - total not certain, count on site</span>'
		: L.units > cap ? `<span class="chip crit">overloaded - ${L.units - cap} over this truck's ${cap}</span>`
		: L.free > 0 ? `<span class="chip act">${L.free} space${L.free === 1 ? '' : 's'} left${next ? ' - top up from ' + esc(dayWords816(next)) : ''}</span>` : '<span class="chip ok">full</span>';
	return `<div class="card load816 nosfold" data-load-run816="${esc(L.stream)}"><div class="hubtitle"><h3>Load ${L.n} · ${esc(sideWords816(L))}${L.uncertain ? ' · quantity to confirm' : ''}</h3>${chip}${L.capWarn ? '<span class="chip crit capw816">over 14 - check the truck: 12–14 per load</span>' : ''}${L.repacked ? '<span class="chip cand">re-packed - the truck before takes fewer</span>' : ''}</div>
<div class="cside lg816"><div class="ctile"><p class="ctk">Units on this load</p><b>${L.units}${L.uncertain ? '+' : ''}</b><span>of ${cap}${coates ? ' · this truck' : ' · supplier pick-up'}${L.uncertain ? ' · plus quantity to confirm' : ''}</span>${dashLeds([[L.units / cap, L.rows[0].r.side === 'inside' ? 'b' : 'o']], L.units + ' of ' + cap + ' units', cap)}</div>
${coates ? `<div class="form cap816"><div class="f"><label for="cap816${esc(L.id)}">This truck takes (units)</label><input id="cap816${esc(L.id)}" type="number" min="1" step="1" data-ro data-cap816="${esc(Dy.iso + '.' + L.id)}" value="${cap}"><div class="hint">12–14 per load (the project manager, 3 Oct 2026) · planned at 12 · kept on this device</div></div></div>` : ''}</div>
<div class="tblwrap daywrap"><table class="daytbl dm816t"><thead><tr><th>#</th><th>GC500 ID</th><th>Units</th><th>Where</th><th>Date from · emptied</th></tr></thead><tbody>${L.rows.map((x, i) => `<tr><td class="t" data-label="#">${i + 1}</td><td class="refcell" data-label="GC500 ID">${refPlate(x.r.key, 14)}</td><td data-label="Units">${x.r.evtUnk ? (x.n ? x.n + ' + ' : '') + 'quantity to confirm' : x.n + ' unit' + (x.n === 1 ? '' : 's')}${x.part || x.r.portions ? ' (part of ' + (x.r.evtUnk ? 'a total to confirm' : x.r.evtN) + ')' : ''}${x.unplanned ? ' <span class="chip crit">unplanned - quantity changed</span>' : ''}${x.r.qtyChange && !x.unplanned ? ` <span class="chip cand">${esc(x.r.qtyChange.words)}</span>` : ''}</td><td data-label="Where">${esc(DM816.name[x.r.zone])}<br><span class="w">${esc(where816(x.r))}</span></td><td data-label="Date from">${srcChip816(x.r.src)} ${notReady816(x.r)}</td></tr>`).join('')}</tbody></table></div>
<div class="acts816"><button type="button" class="btn sm" data-print816="load" data-load816="${esc(L.id)}">Print this load</button></div></div>`;
}
function toiletHtml816(Dy){
	const M = demob816(), next = M.days[M.days.indexOf(Dy.iso) + 1];
	const subL = Dy.loads.filter(L => L.stream === 'sub'), coL = Dy.loads.filter(L => L.stream === 'coates');
	const own = Dy.list.filter(r => r.ownerUnk > 0);
	if (!Dy.loads.length && !own.length) return '<p class="note816">No event portables come off site on this day.</p>';
	const co = [...new Set(subL.flatMap(L => L.rows.map(x => x.r.subCo)).filter(Boolean))].join(', ') || 'sub-hire supplier';
	return `<p class="note816">Event portables - single portable toilets and urinals (FWF, Pee Panel). The sub-hired ones and Coates' own go on separate runs and never share a load. Toilet blocks, accessible toilets, trailers and waste tanks are bigger and stay on the pick-up list. <b>Every unit is pumped out before it is loaded.</b></p>`
		+ (subL.length ? `<h4 class="area816">Sub-hire pick-up · ${esc(co)} · ${subL.length} load${subL.length === 1 ? '' : 's'}</h4><p class="note816">Supplier's own transport, organised by the supplier (Coopers Plains, Brisbane). This is a pick-up list, not a truck plan: what is ready, in loads of up to 24, on site 07:00–17:00.</p>` + subL.map(L => loadCard816(Dy, L, next)).join('') : '')
		+ (coL.length ? `<h4 class="area816">Coates toilet run · ${coL.length} load${coL.length === 1 ? '' : 's'}</h4><p class="note816">Coates' own portable toilets, 12–14 per load (the project manager, 3 Oct 2026), planned at 12. A truck the branch confirms at 13 or 14 can be set on its load.</p>` + coL.map(L => loadCard816(Dy, L, next)).join('') : '')
		+ (own.length ? `<p class="note816 own816"><b>Owner to confirm - on neither run:</b> ${own.map(r => `<button type="button" class="linkish" data-k816="${esc(r.key)}">${esc(r.key)}</button> ${r.ownerUnk} unit${r.ownerUnk === 1 ? '' : 's'}`).join(' · ')}. Nothing on the record says whether these are Coates' or the supplier's.</p>` : '');
}
function pumpHtml816(Dy){
	if (!Dy.pump.length) return '<p class="note816">Nothing due for pick-up today or tomorrow still needs pumping out.</p>';
	const ed = canEdit();
	return `<p class="note816"><b>Pump out ahead of the truck</b> - the day before the pick-up, or first thing that morning. No toilet or waste tank is loaded until it is emptied.</p><div class="tblwrap daywrap"><table class="daytbl dm816t"><thead><tr><th>GC500 ID</th><th>What</th><th>Area</th><th>Pick-up</th><th></th></tr></thead><tbody>` + Dy.pump.map(({r, when}) => `<tr><td class="refcell" data-label="GC500 ID"><button type="button" class="linkish plateb" data-k816="${esc(r.key)}">${refPlate(r.key, 15)}</button></td><td data-label="What">${esc(r.units.filter(u => u.n > 0 || u.unknown).map(u => partWords816(u)).join(', ') || kindWord(r.a))}${r.tank ? '<br><span class="w">toilet first, then the tank under it</span>' : ''}</td><td data-label="Area">${esc(DM816.name[r.zone])}</td><td data-label="Pick-up">${when === 'today' ? 'today - pump first thing' : esc(dayWords816(r.iso))} ${notReady816(r)}</td><td data-label="">${ed ? `<button type="button" class="btn sm primary" data-emp816="${esc(r.key)}">Emptied (pumped out)</button>` : ''}</td></tr>`).join('') + '</tbody></table></div>';
}
function ovHtml816(L){
	if (L.kind === 'toilets' || L.kind === 'supplier') return '';
	const tog = `<label class="ovt816"><input type="checkbox" data-ro data-ov816="${esc(L.ovId)}"${L.ov ? ' checked' : ''}> Oversize load (the branch's flag)</label>`;
	if (!L.ov) return `<div class="acts816 ov816">${tog}${L.kind === 'single' ? `<span class="chip cand" title="${esc(OVSRC816)}">oversize? the branch to say - permit not checked</span>` : ''}</div>`;
	const c = L.ovc;
	return `<div class="acts816 ov816">${tog}<span class="chip crit" title="${esc(OVSRC816)}">Oversize: check permit / travel window</span></div>
<p class="note816" title="${esc(OVSRC816)}">${esc(OVWIN816)} Planning latest departure ${c.latest != null ? clock816(c.latest) + ' (16:00 less the ' + L.t.travel + ' min run - a planning figure, not a permit time)' : 'travel time to confirm'} · pilot / escort: check permit · Check TMR Conditions of Operation Database before each trip</p>
${c.flags.map(f => `<span class="chip crit ovf816">${esc(f)}</span>`).join(' ')}`;
}
function travelHtml816(T){
	const runs = [...new Set(T.filter(L => L.run).map(L => L.run))];
	if (!runs.length) return '';
	const lab = {coates: 'Coates toilet run - Kingston ⇄ site, each way (min)', branch: 'Branch trucks - Kingston ⇄ site, each way (min)'};
	return `<div class="form asg816 trv816">${runs.map(k => { const tv = travel816(k); return `<div class="f"><label for="trv816${k}">${esc(lab[k])}</label><input id="trv816${k}" type="number" min="1" step="1" data-ro data-trv816="${k}" value="${tv.v != null ? tv.v : ''}" placeholder="to confirm"><div class="hint">${esc(tv.v == null ? 'travel time to confirm' : tv.words)}${tv.basis ? ' · ' + esc(tv.basis.replace(/ - a planning figure, not a live time$/, '').replace(/ — a planning figure, not a live time$/, '')) : ''}</div></div>`; }).join('')}</div>`;
}
function trucksHtml816(Dy, T){
	if (!T.length) return '<p class="note816">No truck runs for this branch on this day.</p>';
	return `<p class="note816">Site hours 07:00–17:00. No travel to or from the Gold Coast 07:00–09:00 or 16:00–18:00. Times are a planning sketch from the travel times and assumptions here, not a booking.</p>${travelHtml816(T)}` + T.map(L => L.kind === 'supplier'
		? `<div class="card load816 truck816 sup816 nosfold"><div class="hubtitle"><h3>${esc(L.group)} · load ${L.n} of ${L.of}</h3><span class="chip cand">supplier's own transport · ${L.toilet.units}${L.toilet.uncertain ? ' + to confirm' : ''} of 24</span></div>
<p class="note816">Organised by the supplier (Coopers Plains, Brisbane). No departure or travel time is planned here. On site 07:00–17:00.</p>
<div class="tblwrap daywrap"><table class="daytbl dm816t"><thead><tr><th>GC500 ID</th><th>What · units</th><th>Where</th><th>Emptied</th></tr></thead><tbody>${L.t.st.map(s => `<tr><td class="refcell" data-label="GC500 ID">${refPlate(s.s.r.key, 14)}</td><td data-label="What">${esc(s.s.parts.map(partWords816).join(', '))}</td><td data-label="Where">${esc(DM816.name[s.s.area])}<br><span class="w">${esc(where816(s.s.r))}</span></td><td data-label="Emptied">${notReady816(s.s.r)}</td></tr>`).join('')}</tbody></table></div>
<div class="acts816"><button type="button" class="btn sm" data-print816="truck" data-truck816="${L.n}">Print this pick-up list</button></div></div>`
		: `<div class="card load816 truck816 nosfold"><div class="hubtitle"><h3>${esc(L.group)} · truck ${L.truck} · load ${L.n} of ${L.of}</h3>${L.kind === 'toilets' ? `<span class="chip cand">Coates toilet run · ${L.toilet.units}${L.toilet.uncertain ? ' + to confirm' : ''} of ${L.toilet.cap}</span>` : ''}</div>
<p class="note816">Leave Kingston ${tm816(L.t.dep)} · on site ${clock816(L.t.arrive)} · leave site ${clock816(L.t.leave)} · back ${tm816(L.t.back)}</p>
${ovHtml816(L)}
<div class="tblwrap daywrap"><table class="daytbl dm816t"><thead><tr><th>Time</th><th>GC500 ID</th><th>What · units</th><th>Area</th><th></th></tr></thead><tbody>${L.t.st.map(s => `<tr><td class="t" data-label="Time">${s.s.afterSupplier ? 'after the supplier' : clock816(s.at)}</td><td class="refcell" data-label="GC500 ID">${refPlate(s.s.r.key, 14)}</td><td data-label="What">${esc(s.s.parts.map(partWords816).join(', '))}${s.s.afterSupplier ? '<br><span class="chip crit">hold: after the supplier has lifted the toilet off it, and the tank is emptied</span>' : ''}</td><td data-label="Area">${esc(DM816.name[s.s.area])}</td><td data-label="">${notReady816(s.s.r)}</td></tr>`).join('')}</tbody></table></div>${L.t.over ? '<p class="chip crit">This load does not fit the site hours - split it.</p>' : ''}
<div class="acts816"><button type="button" class="btn sm" data-print816="truck" data-truck816="${L.n}">Print this load</button></div></div>`).join('');
}
function assumeHtml816(){
	const A = assume816();
	return `<div class="card nosfold asm816"><details class="dsect"><summary>Planning assumptions behind the run sheets · edit</summary>
<p class="note816">Site hours 07:00–17:00 (the project manager, 3 Oct 2026). No travel to the Gold Coast 07:00–09:00 or 16:00–18:00 (the project manager, 2 Oct 2026). Changes here are kept on this device only and change no record.</p>
<div class="form asg816">${Object.keys(A).map(k => `<div class="f"><label for="asm816${k}">${esc(A[k].lab)} (${k === 'perLoad' ? 'pieces' : 'min'})</label><input id="asm816${k}" type="number" min="1" step="1" data-ro data-asm816="${k}" value="${esc(String(A[k].v))}"><div class="hint">${esc(A[k].why)}${A[k].edited ? ' · changed on this device' : ''}</div></div>`).join('')}</div>
<button type="button" class="btn ghost sm" data-asm816="reset">Back to the page's figures</button></details></div>`;
}
function mail816(iso, br, rows, T){
	const L = [`GC500 demob - pick-ups ${dayWords816(iso)}${br === 'all' ? '' : ' - ' + br}`, '', 'Site hours 07:00-17:00. No travel to or from the Gold Coast 07:00-09:00 or 16:00-18:00.', 'Every toilet and waste tank is pumped out before it is loaded - do not load one that is not.', ''];
	DM816.order.forEach(z => { const rs = rows.filter(r => r.zone === z); if (!rs.length) return;
		L.push(DM816.name[z] + ':'); rs.forEach(r => L.push('- ' + r.key + ' - ' + ((r.a.item_types || []).join(', ') || kindWord(r.a)) + ' (' + r.branch + ', ' + r.src + ')' + (r.nothing ? ' - quantity 0, nothing to collect' : r.empty && !r.emptied ? ' - NOT READY: empty first' : '') + (r.qtyChange ? ' - ' + r.qtyChange.words.toUpperCase() : ''))); L.push(''); });
	const Dy = demob816().day[iso];
	if (Dy && Dy.loads.length) [['sub', 'Sub-hire pick-up (the supplier\'s own transport, up to 24 a load):'], ['coates', 'Coates toilet run (12-14 a load, planned at 12):']].forEach(([s, head]) => { const Ls = Dy.loads.filter(Ld => Ld.stream === s); if (!Ls.length) return; L.push(head); Ls.forEach(Ld => L.push('- Load ' + Ld.n + ' - ' + Ld.units + (Ld.uncertain ? ' + quantity to confirm' : '') + ' of ' + Ld.cap + ': ' + Ld.rows.map(x => x.r.key + ' x' + (x.r.evtUnk ? (x.n ? x.n + '+?' : '? (quantity to confirm)') : x.n) + (x.unplanned ? ' (unplanned - quantity changed)' : '')).join(', '))); L.push(''); });
	{ const own = rows.filter(r => r.ownerUnk > 0); if (own.length) { L.push('Owner to confirm - on neither run: ' + own.map(r => r.key + ' ' + r.ownerUnk).join(', ')); L.push(''); } }
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
	pane.querySelectorAll('.hubgo[data-go]').forEach(b => { b.onclick = () => go(b.dataset.go); b.onkeydown = e => { if (e.key === 'Enter') go(b.dataset.go); }; });
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
	pane.querySelectorAll('[data-print816]').forEach(b => b.onclick = () => printDay816(DM816.sel, DM816.branch, b.dataset.print816, b.dataset.load816 || Number(b.dataset.truck816 || 0)));
	const ov = pane.querySelector('#ovn816'); if (ov) ov.onchange = () => ovNote816(DM816.sel, ov.value.trim());
	pane.querySelectorAll('input[data-asm816]').forEach(i => i.onchange = () => { let m = {}; try { m = JSON.parse(localStorage.getItem(ASSUME816_KEY) || '{}') || {}; } catch (e) {} const v = Number(i.value);
		if (isFinite(v) && v > 0) m[i.dataset.asm816] = v; else delete m[i.dataset.asm816]; try { localStorage.setItem(ASSUME816_KEY, JSON.stringify(m)); } catch (e) {} redraw(); });
	/* a Coates truck's capacity (12 planned; 13 or 14 once the branch confirms it; above 14 warns) - kept on this device */
	pane.querySelectorAll('input[data-cap816]').forEach(i => i.onchange = () => { const v = Math.round(Number(i.value)), k = 'gc500.demob816.cap.' + i.dataset.cap816;
		try { if (isFinite(v) && v > 0 && v !== RUN816.coates.cap) localStorage.setItem(k, String(v)); else localStorage.removeItem(k); } catch (e) {}
		if (v > RUN816.coates.max) flash('Over ' + RUN816.coates.max + ' on one load - check the truck: Coates portable toilets go 12–14 per load.'); redraw(); });
	/* a run's travel time: the planning figure until somebody types the real one; blank means "to confirm" */
	pane.querySelectorAll('input[data-trv816]').forEach(i => i.onchange = () => { let m = {}; try { m = JSON.parse(localStorage.getItem(TRAVEL816_KEY) || '{}') || {}; } catch (e) { m = {}; }
		const v = String(i.value).trim(), k = i.dataset.trv816; delete m._from; if (v === '') m[k] = ''; else if (Number(v) > 0) m[k] = Math.round(Number(v)); else delete m[k];
		try { localStorage.setItem(TRAVEL816_KEY, JSON.stringify(m)); } catch (e) {} redraw(); });
	pane.querySelectorAll('input[data-ov816]').forEach(i => i.onchange = () => { ovFlag816(i.dataset.ov816, i.checked); redraw(); });
	const rs = pane.querySelector('button[data-asm816="reset"]'); if (rs) rs.onclick = () => { try { localStorage.removeItem(ASSUME816_KEY); } catch (e) {} redraw(); };
	{ const st = pane.querySelector('.strip816'), on = st && st.querySelector('.dday816.on'); if (st && on) { const l = on.offsetLeft - st.clientWidth / 2 + on.offsetWidth / 2; if (l > 0 && st.scrollWidth > st.clientWidth) st.scrollLeft = l; } }
}
/* every proposed date in view, written through setDate one by one, in the presser's name; one redraw at the end */
function confirm816(iso, br){
	if (!mayWrite('the demob dates')) return 0;
	const who = whoAmI(); if (!who) return 0;
	const Dy = demob816().day[iso]; if (!Dy) return 0;
	/* a reference picked up in portions over several days is written with its last day, when it is all off site */
	const rows = Dy.list.filter(r => r.src === 'proposed' && (br === 'all' || r.branch === br));
	const b0 = bump; let n = 0;
	try { bump = () => {}; rows.forEach(r => { const d = r.iso || iso;
		if (setDate(r.key, d, 'out')) { n++;
			/* a reference picked up over several days keeps each portion on its own day, on the same record and stamp */
			if (r.portions && r.portions.length > 1 && S.delivery[r.key]) S.delivery[r.key].out_portions = r.portions.map(p => Object.assign({id: p.id, date: p.iso, units: p.n}, p.s ? {stream: p.s} : {})); } }); } finally { bump = b0; }
	DM816.confirm = false; bump();
	flash(n + ' due-out date' + (n === 1 ? '' : 's') + ' written for ' + dayWords816(iso) + ', in the name of ' + who + '.');
	return n;
}
/* -------- the run sheets: one A4 per load, in the day documents' look */
function sheet816(iso, L){
	const A = assume816(), dep = DATA.depot || {}, rules = DATA.driver_rules || {}, sup = L.kind === 'supplier';
	const emp = L.stops.some(s => s.r.empty), pairs = L.stops.filter(s => s.parts.some(p => p.tank) && s.parts.some(p => !p.tank));
	const box = n => '<span class="rsb816">' + '<i></i>'.repeat(Math.max(1, Math.min(n, 30))) + '</span>';
	const emptied = r => { if (!r.empty) return '<span class="na">-</span>'; const e = emptiedOf816(r.key); return e.on ? `<div>emptied · ${esc(e.by || '')}</div><span>${esc(fmtStamp(e.at))}</span>` : '<div class="nr">NOT READY: empty first</div>'; };
	const rows = L.t.st.map((x, i) => { const s = x.s, r = s.r;
		return `<tr><td class="c">${i + 1}</td>${sup ? '' : `<td>${s.afterSupplier ? 'after the supplier' : clock816(x.at)}</td>`}<td><b>${esc(DM816.name[r.zone])}</b><span>${esc(sup ? where816(r) : wayIn816(r.a, {zone: r.zone, sea: null}))}</span></td><td class="pl">${esc(r.key)}</td>
<td>${s.parts.map(p => `<div>${esc(partWords816(p))}</div>`).join('')}${s.afterSupplier ? '<div class="nr">HOLD: only after the supplier has lifted the toilet off it, and the tank is emptied</div>' : ''}${sup ? '' : r.empty && !r.emptied ? '<div class="nr">NOT READY: empty first</div>' : ''}${r.qtyChange ? `<div class="nr">${esc(r.qtyChange.words)}</div>` : ''}</td>
${sup ? `<td>${emptied(r)}</td>` : ''}<td>${r.empty ? s.parts.map(p => p.unknown ? box(1) + '<span>count them</span>' : box(p.n)).join('') : '<span class="na">-</span>'}</td><td>${box(1)}</td></tr>`; }).join('');
	const keys = sup
		? `<span><label>Site hours</label><b>07:00–17:00</b></span><span><label>Pick-up</label><b>${esc(dayWords816(iso))}</b></span><span><label>Transport</label><b>Supplier's own</b><em>organised by the supplier (Coopers Plains, Brisbane)</em></span><span><label>Units</label><b>${L.toilet.units}${L.toilet.uncertain ? '+' : ''} of 24</b></span><span><label>Supplier</label><b>${esc(L.co)}</b></span><span><label>Area</label><b>${esc(sideWords816(L.toilet))}</b></span>`
		: `<span><label>Site hours</label><b>07:00–17:00</b></span><span><label>Depot</label><b>${esc(dep.name || 'Coates Kingston')}</b>${dep.address ? `<em>${esc(dep.address)}</em>` : ''}</span><span><label>Leave Kingston</label><b>${esc(tm816(L.t.dep))}</b></span><span><label>On site</label><b>${clock816(L.t.arrive)}</b></span><span><label>Leave site</label><b>${clock816(L.t.leave)}</b></span><span><label>Back</label><b>${esc(tm816(L.t.back))}</b></span>`;
	const ov = L.ov ? `<div class="rso816">Oversize (the branch's flag). ${esc(OVWIN816)} Planning latest departure ${L.ovc.latest != null ? clock816(L.ovc.latest) : 'travel time to confirm'} · pilot / escort: check permit · check the TMR Conditions of Operation Database before each trip.${L.ovc.flags.length ? ' ' + esc(L.ovc.flags.join('; ')) + '.' : ''}${ovNote816(iso) ? ' Note: ' + esc(ovNote816(iso)) : ''}</div>` : '';
	const tv = L.run ? travel816(L.run) : null;
	return `<div class="dp-page dp-drv rs816${L.t.st.length > 5 ? ' rsc816' : ''}"><header class="dp-hd"><div class="dp-hd-l"><b>Coates</b><span>Industrial Solutions</span></div>
<div class="dp-hd-m"><span>Demob ${sup ? 'pick-up list' : 'run sheet'} · GC500 2026</span><h1>Collection · ${esc(fmtDate(iso))}</h1></div>
<div class="dp-hd-r"><b>${esc(L.group)}</b><span class="dp-lx">${sup ? 'Pick-up' : 'Truck ' + L.truck} · Load ${L.n} of ${L.of}</span></div></header>
<div class="rsk816">${keys}</div>
${emp ? '<div class="rsw816">MUST BE EMPTIED BEFORE LOADING — DO NOT LOAD IF NOT PUMPED OUT. Tick each unit as it is pumped out.</div>' : ''}
${ov}
<section class="dp-sec"><h2>${sup ? 'Ready for pick-up' : 'Stops, in pick-up order'}</h2><table class="rst816"><thead><tr><th>#</th>${sup ? '' : '<th>Time</th>'}<th>${sup ? 'Where it is' : 'Area · way in'}</th><th>Ref</th><th>What · units</th>${sup ? '<th>Emptied</th>' : ''}<th class="pu816">Pumped out</th><th>Loaded</th></tr></thead><tbody>${rows}</tbody></table></section>
${pairs.length ? `<section class="dp-sec"><h2>Toilet before tank</h2><p>${pairs.map(s => `<b>${esc(s.r.key)}</b>: lift the toilet off first, then the waste tank under it.`).join(' ')}</p></section>` : ''}
<section class="dp-sec"><h2>Rules</h2><p>${sup ? 'On site 07:00–17:00. No unit is loaded until it is recorded as emptied, by name and time. A waste tank goes after the toilet on it. The supplier organises its own transport; no times are planned here.' : `No travel to or from the Gold Coast 07:00–09:00 or 16:00–18:00. ${esc(rules.escort || '')} ${rules.ppe ? 'PPE: ' + esc(rules.ppe.join(', ')) + '.' : ''} Times are planned from: travel ${tv && tv.v != null ? tv.v + ' min each way (' + esc(tv.words) + ')' : 'to confirm'}; ${esc(A.between.lab.toLowerCase())} ${A.between.v} min; ${esc(A.stop.lab.toLowerCase())} ${A.stop.v} min${L.kind === 'toilets' ? '; each event portable ' + A.unit.v + ' min' : ''} - a planning sketch, not a booking.`}</p></section>
${L.t.st.length <= 5 ? '<section class="dp-sec rsn816"><h2>Notes on site</h2><i></i><i></i><i></i><i></i></section>' : ''}
<section class="dp-sec rss816"><h2>Sign-off</h2><div><span>${sup ? 'Supplier' : 'Driver'}</span><i></i><span>Signature</span><i></i><span>Time</span><i></i></div><div><span>Site lead</span><i></i><span>Signature</span><i></i><span>Time</span><i></i></div></section>
<div class="dp-ft"><span><b>${esc(DATA.brand.org || 'Coates Industrial Solutions')} · GC500 2026 · Author: ${esc(DATA.brand.author || 'Andrew Fisher')}</b></span><span>A proposed date is not a booking until it is confirmed on the page</span><span>Demob · ${esc(fmtDate(iso))} · Load ${L.n} of ${L.of}</span></div></div>`;
}
function printDay816(iso, br, what, n){
	let T = trucks816(iso, br);
	if (what === 'load') T = T.filter(L => L.toilet && (L.toilet.id === n || (typeof n === 'number' && L.toilet.n === n)));
	if (what === 'truck') T = T.filter(L => L.n === n);
	if (!T.length) { flash('Nothing to print for ' + dayWords816(iso) + '.'); return 0; }
	if (typeof document === 'undefined') return T.length; /* no page to print into (a fixture): the selection is the answer */
	const wrap = document.getElementById('dayprint') || (() => { const e = document.createElement('div'); e.id = 'dayprint'; document.body.appendChild(e); return e; })();
	wrap.innerHTML = T.map(L => sheet816(iso, L)).join(''); wrap.classList.remove('ps7wrap'); wrap.classList.add('dpwrap'); wrap.dataset.dp816 = String(T.length);
	document.querySelectorAll('#dayPage').forEach(e => e.remove());
	const st = document.createElement('style'); st.id = 'dayPage'; st.textContent = '@page{size:A4 portrait;margin:8mm}'; document.head.appendChild(st);
	document.body.classList.add('printing-day');
	const done = () => { st.remove(); wrap.classList.remove('dpwrap'); document.body.classList.remove('printing-day'); };
	window.addEventListener('afterprint', done, {once: true});
	/* a load too long for its one page is said out loud, never clipped in silence */
	const long = T.filter(L => L.t.st.length > 13).map(L => 'load ' + L.n);
	flash('Preparing ' + T.length + ' run sheet' + (T.length === 1 ? '' : 's') + ', one page per load.' + (long.length ? ' Check ' + long.join(', ') + ': more stops than one page holds - print it per stop or split the load.' : ''));
	setTimeout(() => { try { window.print(); } catch (e) { done(); } }, 60);
	return T.length;
}
