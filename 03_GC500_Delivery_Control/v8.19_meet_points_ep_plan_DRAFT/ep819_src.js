/* ================================================================== v8.19 - the Event Portables load plan on the Timeline
 Author: Andrew Fisher. Andrew, 3 Oct 2026: "We go by whats on the quote at the moment" ... "deliries for next week we
 move to the 9th oct" ... "The loads that come in. Will have a run sheet where they go" ... "I want qr codes done with
 direction to get to where they need to go" ... "We allocate everything to a WC number. Then at the end quote is this
 many. And we mention no WC allocation for these" ... "Nothing is to be picked up unless emptied" ... "They can take
 early we can store in pit regardless".
 The plan is data (EP819, from event_portables_plan.json): nothing here is worked out again or written to the record.
 The panel sits on the Timeline under the day, where deliveries live; it reuses the Timeline's own load rows (.ld/.ldl,
 without data-ld, so the Timeline's handlers leave it alone) and its folds (.ldsec, without data-ldsec). Each load
 prints a one-page A4 run sheet: header, stops with the count left on the truck, a directions QR per meet point, the
 site rules, the demob notice and a sign-off block. */
const EPF819 = {open: new Set(), folds: new Set()};
const EP_DOW819 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], EP_MON819 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function epDay819(iso, year){
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '')); if (!m) return String(iso || '');
	const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
	return EP_DOW819[d.getUTCDay()] + ' ' + (+m[3]) + ' ' + EP_MON819[+m[2] - 1] + (year === false ? '' : ' ' + m[1]);
}
function epTotals819(){
	const L = EP819.loads;
	return {fwf: L.reduce((s, l) => s + l.fwf, 0), pp: L.reduce((s, l) => s + (l.pee_panels || 0), 0), n: L.length, each: L.every(l => l.fwf === L[0].fwf) ? L[0].fwf : null};
}
function epDropWords819(x){ return (x.ref || x.name) + ' ×' + x.fwf + (x.pee_panels ? ' + ' + x.pee_panels + ' pee panels' : '') + (x.no_pin || x.no_wc_number ? ' · Coates directs to the spot' : ''); }
function epCount819(l){ return l.fwf + ' FWF' + (l.pee_panels ? ' (+' + l.pee_panels + ' pee panels)' : ''); }
function epStopsTable819(l){
	return `<table class="ep819-st"><thead><tr><th>Stop</th><th>Meet point · way in</th><th>WC numbers dropped here</th><th class="n">FWF</th><th class="n">Left on truck</th></tr></thead><tbody>${
		l.stops.map(s => `<tr><td class="n"><b>${s.stop}</b></td><td><a href="${esc(s.directions_url)}" target="_blank" rel="noopener noreferrer" title="Driving directions to the meet point">${esc(s.meet_point_name)}</a><span>Way in: ${esc(s.way_in)}</span></td>
<td>${s.drops.map(x => `<span class="ep819-dr"><b>${esc(x.ref || x.name)}</b> ×${x.fwf}${x.pee_panels ? ' + ' + x.pee_panels + ' pee panels' : ''}${x.no_pin || x.no_wc_number ? ' <i>Coates directs to the spot</i>' : ''}</span>`).join('')}</td>
<td class="n">${s.fwf}${s.drops.some(x => x.pee_panels) ? `<small>+${s.drops.reduce((t, x) => t + (x.pee_panels || 0), 0)} pee</small>` : ''}</td><td class="n"><b>${s.left_on_truck}</b></td></tr>`).join('')}</tbody></table>`;
}
function ep819Html(){
	if (typeof EP819 === 'undefined' || !EP819 || !(EP819.loads || []).length) return '';
	const T = epTotals819(), E = EP819, Q = E.quote;
	const first = E.loads[0];
	const rows = E.loads.map(l => { const on = EPF819.open.has(l.n), mps = [...new Set(l.stops.map(s => s.meet_point_name))];
		return `<div class="ld go ep819-ld${on ? ' on' : ''}" role="listitem">
<button type="button" class="ldl" data-ep819-ld="${l.n}" aria-expanded="${on}" aria-controls="ep819b${l.n}" aria-label="${esc('Load ' + l.n + ' of ' + T.n + ', ' + epDay819(l.date) + ', ' + epCount819(l) + '. ' + (on ? 'Press to close the stops.' : 'Press to open the stops.'))}">
<span class="ld-n"><em>Load</em><b>${l.n}</b></span><span class="ld-t"><b>${esc(epDay819(l.date, false))}</b><em>${esc(l.date.slice(0, 4))}</em></span>
<span class="ld-refs"><span class="ld-ref"><span class="ld-c"><b>${l.fwf} FWF</b>${l.pee_panels ? `<span class="ld-sw">+${l.pee_panels} pee panels</span>` : ''}</span><span class="ld-w">${esc(l.zone)}</span></span></span>
<span class="ld-p" title="${esc(mps.join(' · '))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"></path><circle cx="12" cy="10" r="2.6"></circle></svg><span>${l.stops.length} stop${l.stops.length === 1 ? '' : 's'} · ${esc(mps.join(' · '))}</span></span><span class="ld-x" aria-hidden="true"></span></button>
<div class="ld-go ep819-go"><button type="button" class="btn ep819-pr" data-ep819-print="${l.n}" title="${esc('One A4 page for the driver: stops, the count left on the truck, a directions QR per meet point, site rules, demob notice and sign-off')}">Print run sheet</button></div>
<div class="ldb ep819-b" id="ep819b${l.n}"${on ? '' : ' hidden'}>${epStopsTable819(l)}</div></div>`; }).join('');
	const qr = Q.rows, tq = qr.reduce((s, r) => s + r.quote, 0), ta = qr.reduce((s, r) => s + r.allocated_to_wc, 0), tn = qr.reduce((s, r) => s + r.no_wc_allocation, 0);
	const fold = (id, title, n, body) => `<details class="ldsec ep819-f" data-ep819-f="${id}"${EPF819.folds.has(id) ? ' open' : ''}><summary><span class="ldsec-t">${title}</span><span class="ldsec-n">${n}</span><span class="ldsec-x" aria-hidden="true"></span></summary><div class="ldsec-b">${body}</div></details>`;
	return `<section class="card nosfold ep819" id="ep819" aria-labelledby="ep819h">
<div class="ep819-hd"><div><h3 id="ep819h">Event Portables · load plan</h3><p class="sub">${T.fwf} FWF${T.pp ? ' and ' + T.pp + ' pee panels' : ''} to WC areas · planned to quote ${esc(Q.quote)} as it stands · first load ${esc(epDay819(first.date))}</p></div></div>
<div class="ep819-rules"><div class="ep819-box sr"><h4>Site rules · all gear and equipment</h4><ol>${E.site_rules.map(x => `<li>${esc(x)}</li>`).join('')}</ol>${mpParkHtml819('ep819-park')}</div>
<div class="ep819-box dm"><h4>${esc(E.demob.heading)}</h4><ul>${E.demob.lines.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>
<div class="sect">Loads · ${T.n}${T.each ? ' × ' + T.each + ' FWF' : ''}</div>
<p class="ep819-ord">${esc(E.order)} <b>${esc(E.early)}</b></p>
<div class="ldlist timed ep819-list" role="list" aria-label="Event Portables loads">${rows}</div>
<div class="ep819-qt"><h4>Quote ${esc(Q.quote)} against WC allocation</h4><div class="ep819-qw"><table><thead><tr><th>Item</th><th class="n">Quote</th><th>Allocated to WC numbers</th><th class="n nowc">No WC allocation</th></tr></thead><tbody>${
		qr.map(r => `<tr><td><b>${esc(r.item)}</b></td><td class="n">${r.quote}</td><td>${esc(r.allocated_detail)}</td><td class="n nowc"><b>${r.no_wc_allocation}</b>${r.note ? `<small>${esc(r.note)}</small>` : ''}</td></tr>`).join('')}
<tr class="tot"><td><b>Total units on the quote</b></td><td class="n"><b>${tq}</b></td><td><b>${ta}</b></td><td class="n nowc"><b>${tn}</b></td></tr></tbody></table></div>
<p class="ep819-nw">${esc(Q.no_wc_note)}</p>${Q.wc31_note ? `<p class="note">${esc(Q.wc31_note)}</p>` : ''}</div>
${fold('cx', 'Cancelled – do not deliver', E.cancelled.length, `<table class="ep819-cx"><thead><tr><th>WC ref</th><th>Planned</th><th>Status</th><th>Cancelled by</th></tr></thead><tbody>${
		E.cancelled.map(c => `<tr><td><b>${esc(c.ref)}</b></td><td>${c.fwf} FWF${c.note ? `<small>${esc(c.note)}</small>` : ''}</td><td><span class="chip crit">Cancelled</span> do not deliver</td><td>${esc(c.source)}</td></tr>`).join('')}</tbody></table>`)}
</section>`;
}
/* ---------- the run sheet: one A4 page per load */
function epRunSheet819(l){
	const E = EP819, n = E.loads.length;
	const rules = E.site_rules.map(x => `<li>${esc(x)}</li>`).join('') + (E.park ? `<li><b>${esc(E.park.area)}:</b> ${E.park.rules.map(esc).join(' · ')}</li>` : '');
	const stops = l.stops.map(s => `<tr><td class="rs-no">${s.stop}</td><td class="rs-mp"><b>${esc(s.meet_point_name)}</b><span>Way in: ${esc(s.way_in)}</span><small>${esc(s.ll[0].toFixed(6) + ', ' + s.ll[1].toFixed(6))}</small></td>
<td class="rs-wc">${s.drops.map(x => `<span><b>${esc(x.ref || x.name)}</b> ×${x.fwf}${x.pee_panels ? ' + ' + x.pee_panels + ' pee panels' : ''}${x.no_pin || x.no_wc_number ? ' <i>· Coates directs to the spot</i>' : ''}</span>`).join('')}</td>
<td class="rs-n">${s.fwf}${s.drops.some(x => x.pee_panels) ? `<small>+${s.drops.reduce((t, x) => t + (x.pee_panels || 0), 0)} pee</small>` : ''}</td><td class="rs-n">${s.left_on_truck}</td>
<td class="rs-q"><div class="rs-qw"><div class="rs-qr" data-ep819-url="${esc(s.directions_url)}">${qrSvg(s.directions_url, 3)}</div><span>Scan for directions to ${esc(s.meet_point_name)}</span></div></td><td class="rs-done"><i></i></td></tr>`).join('');
	return `<div class="rs819" data-ep819-sheet="${l.n}">
<header class="rs-hd"><b>Coates · GC500 2026 – Supercars Gold Coast 500 · Load run sheet</b><span>Author: Andrew Fisher</span></header>
<h1 class="rs-bar">Load ${l.n} of ${n} · ${esc(epDay819(l.date))} · ${esc(epCount819(l))}</h1>
<ul class="rs-rules">${rules}</ul>
<p class="rs-ord">${esc(E.order)} ${esc(E.early)} ‘Left on truck’ counts down to 0 – tick each stop when dropped.</p>
<table class="rs-tbl"><thead><tr><th>Stop</th><th>Meet point · way in</th><th>WC numbers dropped here</th><th class="rs-n">FWF</th><th class="rs-n">Left on truck</th><th>Directions (Google Maps, driving)</th><th>Done</th></tr></thead><tbody>${stops}</tbody></table>
<div class="rs-low"><div class="rs-dm"><b>${esc(E.demob.heading)}</b><ul>${E.demob.lines.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
<div class="rs-so"><b>Sign-off</b><table><tr><td>Delivered qty</td><td>Time on site</td><td>Time off site</td></tr><tr><td>Coates rep name</td><td colspan="2">Signature</td></tr><tr><td>Driver name</td><td colspan="2">Signature</td></tr></table></div></div>
<footer class="rs-ft"><b>Call the Coates lead on arrival</b><span>Coates Industrial Solutions · GC500 2026 · Author: Andrew Fisher · quantities as the GC500 delivery plan ${esc(E.version)}, ${esc(epDay819(E.prepared).replace(/^\w+ /, ''))} · to quote ${esc(E.quote.quote)}</span><span>Load ${l.n} of ${n}</span></footer>
</div>`;
}
/* fit the one page: the QR codes and the spacing give way first, never the words */
function epFit819(w){
	const pg = w.querySelector('.rs819'); if (!pg) return [];
	let k = 1; pg.style.setProperty('--k', '1');
	while (pg.scrollHeight > pg.clientHeight + 1 && k > 0.62) { k = Math.round((k - 0.03) * 100) / 100; pg.style.setProperty('--k', String(k)); }
	pg.dataset.k = String(k);
	return pg.scrollHeight > pg.clientHeight + 1 ? ['load ' + pg.dataset.ep819Sheet] : [];
}
function ep819Close(){
	const w = document.getElementById('ep819print'); if (w) { w.innerHTML = ''; w.hidden = true; }
	document.body.classList.remove('ep819-printing');
	const st = document.getElementById('ep819page'); if (st) st.remove();
}
/* o.hold: lay it out on screen and stop (the preview and the tests); otherwise open the print dialog */
function ep819Print(n, o){
	const l = (EP819.loads || []).find(x => x.n === Number(n)); if (!l) return null;
	let w = document.getElementById('ep819print');
	if (!w) { w = document.createElement('div'); w.id = 'ep819print'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); document.body.appendChild(w); }
	w.setAttribute('aria-label', 'Run sheet, load ' + l.n);
	w.innerHTML = `<div class="ep819-pbar"><span>Run sheet · Load ${l.n} of ${EP819.loads.length} · one A4 page</span><button type="button" data-ep819-go>Print / Save as PDF</button><button type="button" data-ep819-x>Close</button></div>${epRunSheet819(l)}`;
	w.hidden = false;
	document.querySelectorAll('#ep819page').forEach(e => e.remove());
	const st = document.createElement('style'); st.id = 'ep819page'; st.textContent = '@page{size:A4 portrait;margin:8mm}'; document.head.appendChild(st);
	document.body.classList.add('ep819-printing');
	w.__over = epFit819(w);
	if (o && o.hold) return w;
	window.addEventListener('afterprint', ep819Close, {once: true});
	setTimeout(() => { try { window.print(); } catch (e) {} }, 80);
	return w;
}
if (!window.__ep819wired) {
	window.__ep819wired = true;
	document.addEventListener('click', e => {
		const t = e.target && e.target.closest ? e.target : null; if (!t) return;
		const tg = t.closest('[data-ep819-ld]');
		if (tg) { const n = Number(tg.dataset.ep819Ld), ld = tg.closest('.ld'), b = ld && ld.querySelector('.ep819-b'); if (!b) return;
			const on = b.hidden; b.hidden = !on; ld.classList.toggle('on', on); tg.setAttribute('aria-expanded', String(on));
			if (on) EPF819.open.add(n); else EPF819.open.delete(n); return; }
		const pr = t.closest('[data-ep819-print]'); if (pr) { ep819Print(pr.dataset.ep819Print); return; }
		if (t.closest('[data-ep819-x]')) { ep819Close(); return; }
		if (t.closest('[data-ep819-go]')) { try { window.print(); } catch (x) {} return; }
	});
	document.addEventListener('toggle', e => { const d = e.target; if (d && d.dataset && d.dataset.ep819F) { if (d.open) EPF819.folds.add(d.dataset.ep819F); else EPF819.folds.delete(d.dataset.ep819F); } }, true);
	document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('ep819-printing')) ep819Close(); });
}
