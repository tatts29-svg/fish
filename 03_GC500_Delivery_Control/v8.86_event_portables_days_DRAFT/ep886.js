/* ================================================================== v8.86 - Event Portables load days on the page
 Author: Andrew Fisher. Andrew, 7 Oct 2026: "can we also look at delievies im sure we changed these the wc and we had
 deliveruies days for these from Evenportables.." - approved 8 Oct 2026 00:20: "Approved and get everything done".
 The plan's load day (event_portables_plan.json v10, 3 Oct 2026) is applied at the build as a correction on each schedule
 row it moves: the row's day IS the load day on every list, count, card and sheet, the workbook's day rides beside it as
 "moved from", and a day recorded on the shared record still wins, the way it beats the plan. EP886 (written in by the
 patch, above) holds only what the page needs at run time: the loads, the drops the record has taken off the plan, and the
 drops no schedule row carries yet. Nothing here writes to the record. */
function ep886Corrected(events){ return (events || []).filter(e => e && e.date_correction && e.date_correction.plan886); }
/* the day a row sits on. A row the plan moved keeps its own corrected day even when the reference's other rows did not
 move (WC09: the 6 m toilet blocks stay on Thu 8 Oct, the FWF and pee panels go with the load on Fri 9 Oct). A day recorded
 on the page moves every row of the reference to it, as it always has. */
function rowDay886(a, events, eff, isIn){
	if (!isIn) return eff ? eff.out : null;
	if (eff && eff.in_correction) { const ds = (events || []).map(e => e && e.date).filter(Boolean).sort(); if (ds.length) return ds[0]; }
	return eff ? eff.in : null;
}
function ep886Day(iso){ const d = fmtDay(iso); return d.dow ? d.dow + ' ' + d.dm : String(iso || ''); }
/* the source beside the day, where a row's day comes from the plan: "Event Portables plan v10, 3 Oct · Load 1, Fri 09 Oct" */
function ep886Source(events){
	const c = ep886Corrected(events); if (!c.length) return '';
	const x = c[0].date_correction, loads = [...new Set(c.map(e => e.date_correction.load))].sort((p, q) => p - q);
	return `<span class="ep886-src" title="${esc((x.source || '') + (x.basis ? ' · ' + x.basis : ''))}">${esc(x.stated_by || 'Event Portables plan')} · Load ${esc(loads.join(', '))}, ${esc(ep886Day(x.load_date))}</span>`;
}
/* the reference drawer: when the plan moved some rows of a reference and not others, say which went and which stayed */
function ep886DrawerLines(a){
	try {
		if (!a || deliveryOf(a.key).date) return '';
		const ins = (a.events || []).filter(e => e && e.movement !== 'remove' && e.date);
		const moved = ins.filter(e => e.date_correction && e.date_correction.plan886), stayed = ins.filter(e => !(e.date_correction && e.date_correction.plan886));
		if (!moved.length || !stayed.length) return '';
		const words = es => es.map(e => (e.quantity_display && e.quantity_display !== 'blank' ? e.quantity_display + ' × ' : '') + (e.item || '')).join(', ');
		const x = moved[0].date_correction;
		return `<div class="hint ep886-hint">${esc(x.stated_by)} · Load ${esc(String(x.load))}: ${esc(words(moved))} ${moved.length === 1 ? 'comes' : 'come'} <b>${esc(ep886Day(x.load_date))}</b> (the schedule had ${esc(ep886Day(x.as_written))}); ${esc(words(stayed))} ${stayed.length === 1 ? 'stays' : 'stay'} <b>${esc([...new Set(stayed.map(e => ep886Day(e.date)))].join(', '))}</b>.</div>`;
	} catch (e) { return ''; }
}
/* the drawer's In tile (v8.16): where the plan moved some rows of a reference and not others, the rows that went, their
 day and the source ride on "on the plan" */
function ep886InWhy(a, eff){
	try {
		if (!a || !eff || !eff.in_correction || eff.in_moved || deliveryOf(a.key).date) return '';
		const ins = (a.events || []).filter(e => e && e.movement !== 'remove' && e.date), moved = ins.filter(e => e.date_correction && e.date_correction.plan886);
		if (!moved.length || moved.length === ins.length) return '';
		const x = moved[0].date_correction;
		return ' · ' + moved.map(e => (e.quantity_display && e.quantity_display !== 'blank' ? e.quantity_display + ' × ' : '') + (e.item || '')).join(', ') + ' ' + ep886Day(x.load_date) + ', ' + x.stated_by;
	} catch (e) { return ''; }
}
/* v8.21's "Date needs confirmation" on the installer text: only where the row carries what the supplier delivers */
function ep886Covers(r){
	const evs = (r && r.events) || [];
	return !evs.length || evs.some(e => /\bFWF\b|pee\s*panel/i.test(String((e && e.item) || '')));
}
/* the supplier card's record line (v8.19): a drop the record has taken off the plan is said on its load, with the count
 the load is. Worked out fresh at every drawing, from the record, as the line it extends is. */
function epRecLine819(l, days){
	let line = ''; try { line = epRecLine819Before886(l, days) || ''; } catch (e) { line = ''; }
	let off = []; try { off = (EP886.off_plan || []).filter(x => x.load === l.n && typeof rowOff === 'function' && rowOff(x.task_ref)); } catch (e) { off = []; }
	if (!off.length) return line;
	const fwf = l.fwf - off.reduce((n, x) => n + (x.fwf || 0), 0);
	const words = off.map(x => x.name + ' is off the plan on the record (' + (typeof rowOffWords === 'function' ? rowOffWords(x.task_ref) : 'taken off') + ')').join('; ');
	return [line, words + ' – this load is ' + fwf + ' FWF'].filter(Boolean).join(' · ');
}
