/* ================================================================== v8.18 - the Event Portables load plan on the Timeline
 Author: Andrew Fisher. Andrew, 3 Oct 2026: "We go by whats on the quote at the moment" ... "deliries for next week we
 move to the 9th oct" ... "The loads that come in. Will have a run sheet where they go" ... "I want qr codes done with
 direction to get to where they need to go" ... "We allocate everything to a WC number. Then at the end quote is this
 many. And we mention no WC allocation for these" ... "Nothing is to be picked up unless emptied" ... "They can take
 early we can store in pit regardless".
 The plan is data (EP818, from event_portables_plan.json): nothing here is worked out again or written to the record.
 The panel sits on the Timeline under the day, where deliveries live; it reuses the Timeline's own load rows (.ld/.ldl,
 without data-ld, so the Timeline's handlers leave it alone) and its folds (.ldsec, without data-ldsec). Each load
 prints a one-page A4 run sheet: header, stops with the count left on the truck, a directions QR per meet point, the
 site rules, the demob notice and a sign-off block. */
const EPF818 = {open: new Set(), folds: new Set()};
const EP_DOW818 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], EP_MON818 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function epDay818(iso, year){
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '')); if (!m) return String(iso || '');
	const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
	return EP_DOW818[d.getUTCDay()] + ' ' + (+m[3]) + ' ' + EP_MON818[+m[2] - 1] + (year === false ? '' : ' ' + m[1]);
}
function epTotals818(){
	const L = EP818.loads;
	return {fwf: L.reduce((s, l) => s + l.fwf, 0), pp: L.reduce((s, l) => s + (l.pee_panels || 0), 0), n: L.length, each: L.every(l => l.fwf === L[0].fwf) ? L[0].fwf : null};
}
function epDropWords818(x){ return (x.ref || x.name) + ' ×' + x.fwf + (x.pee_panels ? ' + ' + x.pee_panels + ' pee panels' : '') + (x.no_pin || x.no_wc_number ? ' · Coates directs to the spot' : ''); }
function epCount818(l){ return l.fwf + ' FWF' + (l.pee_panels ? ' (+' + l.pee_panels + ' pee panels)' : ''); }
function epStopsTable818(l){
	return `<table class="ep818-st"><thead><tr><th>Stop</th><th>Meet point · way in</th><th>WC numbers dropped here</th><th class="n">FWF</th><th class="n">Left on truck</th></tr></thead><tbody>${
		l.stops.map(s => `<tr><td class="n"><b>${s.stop}</b></td><td><a href="${esc(s.directions_url)}" target="_blank" rel="noopener noreferrer" title="Driving directions to the meet point">${esc(s.meet_point_name)}</a><span>Way in: ${esc(s.way_in)}</span></td>
<td>${s.drops.map(x => `<span class="ep818-dr"><b>${esc(x.ref || x.name)}</b> ×${x.fwf}${x.pee_panels ? ' + ' + x.pee_panels + ' pee panels' : ''}${x.no_pin || x.no_wc_number ? ' <i>Coates directs to the spot</i>' : ''}</span>`).join('')}</td>
<td class="n">${s.fwf}${s.drops.some(x => x.pee_panels) ? `<small>+${s.drops.reduce((t, x) => t + (x.pee_panels || 0), 0)} pee</small>` : ''}</td><td class="n"><b>${s.left_on_truck}</b></td></tr>`).join('')}</tbody></table>`;
}
function ep818Html(){
	if (typeof EP818 === 'undefined' || !EP818 || !(EP818.loads || []).length) return '';
	const T = epTotals818(), E = EP818, Q = E.quote;
	const first = E.loads[0];
	const rows = E.loads.map(l => { const on = EPF818.open.has(l.n), mps = [...new Set(l.stops.map(s => s.meet_point_name))];
		return `<div class="ld go ep818-ld${on ? ' on' : ''}" role="listitem">
<button type="button" class="ldl" data-ep818-ld="${l.n}" aria-expanded="${on}" aria-controls="ep818b${l.n}" aria-label="${esc('Load ' + l.n + ' of ' + T.n + ', ' + epDay818(l.date) + ', ' + epCount818(l) + '. ' + (on ? 'Press to close the stops.' : 'Press to open the stops.'))}">
<span class="ld-n"><em>Load</em><b>${l.n}</b></span><span class="ld-t"><b>${esc(epDay818(l.date, false))}</b><em>${esc(l.date.slice(0, 4))}</em></span>
<span class="ld-refs"><span class="ld-ref"><span class="ld-c"><b>${l.fwf} FWF</b>${l.pee_panels ? `<span class="ld-sw">+${l.pee_panels} pee panels</span>` : ''}</span><span class="ld-w">${esc(l.zone)}</span></span></span>
<span class="ld-p" title="${esc(mps.join(' · '))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"></path><circle cx="12" cy="10" r="2.6"></circle></svg><span>${l.stops.length} stop${l.stops.length === 1 ? '' : 's'} · ${esc(mps.join(' · '))}</span></span><span class="ld-x" aria-hidden="true"></span></button>
<div class="ld-go ep818-go"><button type="button" class="btn ep818-pr" data-ep818-print="${l.n}" title="${esc('One A4 page for the driver: stops, the count left on the truck, a directions QR per meet point, site rules, demob notice and sign-off')}">Print run sheet</button></div>
<div class="ldb ep818-b" id="ep818b${l.n}"${on ? '' : ' hidden'}>${epStopsTable818(l)}</div></div>`; }).join('');
	const qr = Q.rows, tq = qr.reduce((s, r) => s + r.quote, 0), ta = qr.reduce((s, r) => s + r.allocated_to_wc, 0), tn = qr.reduce((s, r) => s + r.no_wc_allocation, 0);
	const fold = (id, title, n, body) => `<details class="ldsec ep818-f" data-ep818-f="${id}"${EPF818.folds.has(id) ? ' open' : ''}><summary><span class="ldsec-t">${title}</span><span class="ldsec-n">${n}</span><span class="ldsec-x" aria-hidden="true"></span></summary><div class="ldsec-b">${body}</div></details>`;
	return `<section class="card nosfold ep818" id="ep818" aria-labelledby="ep818h">
<div class="ep818-hd"><div><h3 id="ep818h">Event Portables · load plan</h3><p class="sub">${T.fwf} FWF${T.pp ? ' and ' + T.pp + ' pee panels' : ''} to WC areas · planned to quote ${esc(Q.quote)} as it stands · first load ${esc(epDay818(first.date))}</p></div></div>
<div class="ep818-rules"><div class="ep818-box sr"><h4>Site rules · all gear and equipment</h4><ol>${E.site_rules.map(x => `<li>${esc(x)}</li>`).join('')}</ol>${mpParkHtml818('ep818-park')}</div>
<div class="ep818-box dm"><h4>${esc(E.demob.heading)}</h4><ul>${E.demob.lines.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>
<div class="sect">Loads · ${T.n}${T.each ? ' × ' + T.each + ' FWF' : ''}</div>
<p class="ep818-ord">${esc(E.order)} <b>${esc(E.early)}</b></p>
<div class="ldlist timed ep818-list" role="list" aria-label="Event Portables loads">${rows}</div>
<div class="ep818-qt"><h4>Quote ${esc(Q.quote)} against WC allocation</h4><div class="ep818-qw"><table><thead><tr><th>Item</th><th class="n">Quote</th><th>Allocated to WC numbers</th><th class="n nowc">No WC allocation</th></tr></thead><tbody>${
		qr.map(r => `<tr><td><b>${esc(r.item)}</b></td><td class="n">${r.quote}</td><td>${esc(r.allocated_detail)}</td><td class="n nowc"><b>${r.no_wc_allocation}</b>${r.note ? `<small>${esc(r.note)}</small>` : ''}</td></tr>`).join('')}
<tr class="tot"><td><b>Total units on the quote</b></td><td class="n"><b>${tq}</b></td><td><b>${ta}</b></td><td class="n nowc"><b>${tn}</b></td></tr></tbody></table></div>
<p class="ep818-nw">${esc(Q.no_wc_note)}</p>${Q.wc31_note ? `<p class="note">${esc(Q.wc31_note)}</p>` : ''}</div>
${fold('cx', 'Cancelled – do not deliver', E.cancelled.length, `<table class="ep818-cx"><thead><tr><th>WC ref</th><th>Planned</th><th>Status</th><th>Cancelled by</th></tr></thead><tbody>${
		E.cancelled.map(c => `<tr><td><b>${esc(c.ref)}</b></td><td>${c.fwf} FWF${c.note ? `<small>${esc(c.note)}</small>` : ''}</td><td><span class="chip crit">Cancelled</span> do not deliver</td><td>${esc(c.source)}</td></tr>`).join('')}</tbody></table>`)}
</section>`;
}
/* ---------- the run sheet: one A4 page per load */
function epRunSheet818(l){
	const E = EP818, n = E.loads.length;
	const rules = E.site_rules.map(x => `<li>${esc(x)}</li>`).join('') + (E.park ? `<li><b>${esc(E.park.area)}:</b> ${E.park.rules.map(esc).join(' · ')}</li>` : '');
	const stops = l.stops.map(s => `<tr><td class="rs-no">${s.stop}</td><td class="rs-mp"><b>${esc(s.meet_point_name)}</b><span>Way in: ${esc(s.way_in)}</span><small>${esc(s.ll[0].toFixed(6) + ', ' + s.ll[1].toFixed(6))}</small></td>
<td class="rs-wc">${s.drops.map(x => `<span><b>${esc(x.ref || x.name)}</b> ×${x.fwf}${x.pee_panels ? ' + ' + x.pee_panels + ' pee panels' : ''}${x.no_pin || x.no_wc_number ? ' <i>· Coates directs to the spot</i>' : ''}</span>`).join('')}</td>
<td class="rs-n">${s.fwf}${s.drops.some(x => x.pee_panels) ? `<small>+${s.drops.reduce((t, x) => t + (x.pee_panels || 0), 0)} pee</small>` : ''}</td><td class="rs-n">${s.left_on_truck}</td>
<td class="rs-q"><div class="rs-qw"><div class="rs-qr" data-ep818-url="${esc(s.directions_url)}">${qrSvg(s.directions_url, 3)}</div><span>Scan for directions to ${esc(s.meet_point_name)}</span></div></td><td class="rs-done"><i></i></td></tr>`).join('');
	return `<div class="rs818" data-ep818-sheet="${l.n}">
<header class="rs-hd"><b>Coates · GC500 2026 – Supercars Gold Coast 500 · Load run sheet</b><span>Author: Andrew Fisher</span></header>
<h1 class="rs-bar">Load ${l.n} of ${n} · ${esc(epDay818(l.date))} · ${esc(epCount818(l))}</h1>
<ul class="rs-rules">${rules}</ul>
<p class="rs-ord">${esc(E.order)} ${esc(E.early)} ‘Left on truck’ counts down to 0 – tick each stop when dropped.</p>
<table class="rs-tbl"><thead><tr><th>Stop</th><th>Meet point · way in</th><th>WC numbers dropped here</th><th class="rs-n">FWF</th><th class="rs-n">Left on truck</th><th>Directions (Google Maps, driving)</th><th>Done</th></tr></thead><tbody>${stops}</tbody></table>
<div class="rs-low"><div class="rs-dm"><b>${esc(E.demob.heading)}</b><ul>${E.demob.lines.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
<div class="rs-so"><b>Sign-off</b><table><tr><td>Delivered qty</td><td>Time on site</td><td>Time off site</td></tr><tr><td>Coates rep name</td><td colspan="2">Signature</td></tr><tr><td>Driver name</td><td colspan="2">Signature</td></tr></table></div></div>
<footer class="rs-ft"><b>Call the Coates lead on arrival</b><span>Coates Industrial Solutions · GC500 2026 · Author: Andrew Fisher · quantities as the GC500 delivery plan ${esc(E.version)}, ${esc(epDay818(E.prepared).replace(/^\w+ /, ''))} · to quote ${esc(E.quote.quote)}</span><span>Load ${l.n} of ${n}</span></footer>
</div>`;
}
/* fit the one page: the QR codes and the spacing give way first, never the words */
function epFit818(w){
	const pg = w.querySelector('.rs818'); if (!pg) return [];
	let k = 1; pg.style.setProperty('--k', '1');
	while (pg.scrollHeight > pg.clientHeight + 1 && k > 0.62) { k = Math.round((k - 0.03) * 100) / 100; pg.style.setProperty('--k', String(k)); }
	pg.dataset.k = String(k);
	return pg.scrollHeight > pg.clientHeight + 1 ? ['load ' + pg.dataset.ep818Sheet] : [];
}
function ep818Close(){
	const w = document.getElementById('ep818print'); if (w) { w.innerHTML = ''; w.hidden = true; }
	document.body.classList.remove('ep818-printing');
	const st = document.getElementById('ep818page'); if (st) st.remove();
}
/* o.hold: lay it out on screen and stop (the preview and the tests); otherwise open the print dialog */
function ep818Print(n, o){
	const l = (EP818.loads || []).find(x => x.n === Number(n)); if (!l) return null;
	let w = document.getElementById('ep818print');
	if (!w) { w = document.createElement('div'); w.id = 'ep818print'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); document.body.appendChild(w); }
	w.setAttribute('aria-label', 'Run sheet, load ' + l.n);
	w.innerHTML = `<div class="ep818-pbar"><span>Run sheet · Load ${l.n} of ${EP818.loads.length} · one A4 page</span><button type="button" data-ep818-go>Print / Save as PDF</button><button type="button" data-ep818-x>Close</button></div>${epRunSheet818(l)}`;
	w.hidden = false;
	document.querySelectorAll('#ep818page').forEach(e => e.remove());
	const st = document.createElement('style'); st.id = 'ep818page'; st.textContent = '@page{size:A4 portrait;margin:8mm}'; document.head.appendChild(st);
	document.body.classList.add('ep818-printing');
	w.__over = epFit818(w);
	if (o && o.hold) return w;
	window.addEventListener('afterprint', ep818Close, {once: true});
	setTimeout(() => { try { window.print(); } catch (e) {} }, 80);
	return w;
}
if (!window.__ep818wired) {
	window.__ep818wired = true;
	document.addEventListener('click', e => {
		const t = e.target && e.target.closest ? e.target : null; if (!t) return;
		const tg = t.closest('[data-ep818-ld]');
		if (tg) { const n = Number(tg.dataset.ep818Ld), ld = tg.closest('.ld'), b = ld && ld.querySelector('.ep818-b'); if (!b) return;
			const on = b.hidden; b.hidden = !on; ld.classList.toggle('on', on); tg.setAttribute('aria-expanded', String(on));
			if (on) EPF818.open.add(n); else EPF818.open.delete(n); return; }
		const pr = t.closest('[data-ep818-print]'); if (pr) { ep818Print(pr.dataset.ep818Print); return; }
		if (t.closest('[data-ep818-x]')) { ep818Close(); return; }
		if (t.closest('[data-ep818-go]')) { try { window.print(); } catch (x) {} return; }
	});
	document.addEventListener('toggle', e => { const d = e.target; if (d && d.dataset && d.dataset.ep818F) { if (d.open) EPF818.folds.add(d.dataset.ep818F); else EPF818.folds.delete(d.dataset.ep818F); } }, true);
	document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('ep818-printing')) ep818Close(); });
}
