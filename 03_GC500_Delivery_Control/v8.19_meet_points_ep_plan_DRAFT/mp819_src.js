/* ================================================================== v8.19 - meet points for all gear and equipment
 Author: Andrew Fisher. Andrew, 3 Oct 2026: every delivery or pick-up goes to the meet / entry point for its area and
 Coates meets the truck there ... "This goes for all gear and equipment ... If we unsure they refer back to entry
 pitlane" ... "this now should be info for everything now".

 THE RULE (the same as the reference assignment the Event Portables sheets were made with, line for line, for every
 reference the master plan places - all the toilets; the reviewer's correction of 3 Oct extends it to pinned and
 confirmed gear, because Andrew's rule is for all gear):
   1. any real map position (master plan, pinned, confirmed, or a drawing position) inside a drawn area outline (the
      island west parkland) -> that area's point;
   2. the pit lane precinct (pit garages PG.., WC12, WC16) -> pit lane entry;
   3. a master-plan, pinned or confirmed position: the nearest point on the SAME SIDE within 150 m. Side is the page's
      own zone816 (island / outside; seaside / land side on Main Beach Pde and Surfers), with the page's way-in words
      deciding the side where they name it, as the v7.84 rule has it; an area point serves only what is inside its outline;
      a side the page cannot tell -> pit lane entry ('noside');
   4. anything else (a description spot, the pit-lane report point, no position) -> pit lane entry, the default.
 MP819 and EP819 are written into the page by the patch from meet_points_03Oct2026/*.json. */
function mpDist819(a, b){ return Math.hypot((a[0] - b[0]) * 111320, (a[1] - b[1]) * 111320 * Math.cos(a[0] * Math.PI / 180)); }
function mpInside819(ll, poly){
	const x = ll[1], y = ll[0]; let c = false;
	for (let i = 0; i < poly.length; i++) { const y1 = poly[i][0], x1 = poly[i][1], y2 = poly[(i + 1) % poly.length][0], x2 = poly[(i + 1) % poly.length][1];
		if ((y1 > y) !== (y2 > y) && x < (x2 - x1) * (y - y1) / (y2 - y1) + x1) c = !c; }
	return c;
}
function mpPrecinct819(key){ return /^PG/.test(String(key || '')) || key === 'WC12' || key === 'WC16'; }
/* the side a reference stands on: zone816, with the way-in words deciding seaside / land side where they say it */
const MP_RULE_KINDS819 = ['master', 'pinned', 'confirmed'], MP_AREA_KINDS819 = ['master', 'pinned', 'confirmed', 'unverified', 'placed'];
function mpZone819(a, D){
	if (!D || MP_RULE_KINDS819.indexOf(D.kind) < 0) return null;
	const z0 = zone816(a), z = Object.assign({}, z0);
	let w = ''; try { w = String(wayIn816(a, z0) || '').toLowerCase(); } catch (e) { w = ''; }
	if (z.sea != null) { if (w.startsWith('seaside') && !z.sea) z.sea = true; else if (w.startsWith('land side') && z.sea) z.sea = false; }
	return z;
}
/* -> {p: the point, m: metres from the position to it or null, how: area | precinct | rule | noside | default | nopin} */
function meetPoint819(a){
	const DEF = MP819.def, P = MP819.points;
	if (!a) return {p: DEF, m: null, how: 'nopin'};
	let D = null; try { D = dest782(a); } catch (e) { D = null; }
	const real = D && MP_AREA_KINDS819.indexOf(D.kind) >= 0 && D.ll && isFinite(D.ll.lat) && isFinite(D.ll.lon) ? [D.ll.lat, D.ll.lon] : null;
	for (const p of P) if (p.poly && real && mpInside819(real, p.poly)) return {p, m: mpDist819(real, p.ll), how: 'area'};
	const ll = real && MP_RULE_KINDS819.indexOf(D.kind) >= 0 ? real : null;
	if (mpPrecinct819(a.key)) return {p: DEF, m: real ? mpDist819(real, DEF.ll) : null, how: 'precinct'};
	let z = null; try { z = mpZone819(a, D); } catch (e) { z = null; }
	if (!ll || !z) return {p: DEF, m: null, how: 'nopin'};
	if (!z.side || z.side === 'unknown') return {p: DEF, m: mpDist819(ll, DEF.ll), how: 'noside'};
	const c = P.filter(p => !p.poly && p.side === z.side && !(p.sea != null && z.sea != null && p.sea !== z.sea))
		.map(p => ({p, m: mpDist819(ll, p.ll)})).sort((x, y) => x.m - y.m);
	if (c.length && c[0].m <= 150) return {p: c[0].p, m: c[0].m, how: 'rule'};
	return {p: DEF, m: mpDist819(ll, DEF.ll), how: 'default'};
}
function mpUrl819(p){ return navUrl({lat: p.ll[0], lon: p.ll[1]}); }
function mpLl819(p){ return p.ll[0].toFixed(6) + ', ' + p.ll[1].toFixed(6); }
function mpWhy819(r, key){
	return r.how === 'area' ? 'inside the ' + (r.p.area || 'area') + ' outline'
		: r.how === 'precinct' ? (/^PG/.test(String(key || '')) ? 'Pit lane entry – pit garages' : 'Pit lane entry – the pit lane precinct (WC12, WC16)')
		: r.how === 'noside' ? 'side not known – pit lane entry'
		: r.how === 'rule' ? 'nearest meet point on the same side, about ' + fmtMetres(Math.round(r.m)) + ' from the plan position'
		: r.how === 'default' ? 'no meet point within 150 m on the same side - pit lane entry, the default'
		: 'no master-plan position - pit lane entry, the default';
}
/* the meet point's way in says nothing new when every word of it is already in the way in the page gives for each of
   its references (v7.84's wayIn816) - then it is left off, so a fact shows once */
function mpWords819(s){ return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(w => w && !/^(the|in|at|via|from|of|and|end|race|direction)$/.test(w)); }
function mpSameWay819(refWays, pway){
	const want = mpWords819(pway); if (!want.length) return true;
	return (refWays || []).length > 0 && refWays.every(w => { const have = new Set(mpWords819(w)); return want.every(x => have.has(x)); });
}
function mpParkHtml819(cls){
	const R = (typeof EP819 !== 'undefined' && EP819.park) || null; if (!R) return '';
	return `<div class="${cls}" role="note"><b>${esc(R.area)}</b><ul>${R.rules.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
}
/* the reference drawer: its meet point, a QR for driving directions to it, and the parkland rules where they apply */
function mpDrawer819(a){
	const dr = $('#drawer'); if (!dr || !a) return;
	const wh = dr.querySelector('.where816'); if (!wh || wh.querySelector('.mp819')) return;
	const r = meetPoint819(a), p = r.p, url = mpUrl819(p);
	let w0 = ''; try { w0 = String(wayIn816(a, zone816(a)) || ''); } catch (e) { w0 = ''; }
	const sameWay = mpSameWay819([w0], p.way);
	const box = document.createElement('div'); box.className = 'mp819' + (p.id === MP819.park ? ' park' : ''); box.dataset.mp819 = p.id;
	box.innerHTML = `<a class="mp819-qr" href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-mp819-url="${esc(url)}" title="${esc('Scan or tap: driving directions to ' + p.name)}" aria-label="${esc('QR code: driving directions to the meet point, ' + p.name)}">${qrSvg(url, 3)}</a>
<div class="mp819-t"><b class="mp819-n">Meet point: ${esc(p.name)}</b>${sameWay ? '' : `<span>Way in: ${esc(p.way)}</span>`}<span class="mp819-w">${esc(mpWhy819(r, a.key))}</span>
<span class="mp819-s">Scan or tap for driving directions · ${esc(mpLl819(p))}</span></div>`;
	if (p.id === MP819.park) box.insertAdjacentHTML('beforeend', mpParkHtml819('mp819-park'));
	const acts = wh.querySelector('.wa816');
	if (acts) wh.insertBefore(box, acts); else wh.appendChild(box);
}
/* ---------- the printed sheets. Andrew's photographs on the driver sheet keep every pixel they had on the live page: the
 meet point goes into room the sheet already leaves empty (the master-plan position box, or a line in each row of the
 several-reference table) and the site rules go on the end of the sheet's own rules line.
 Helpers for any printed sheet (the driver sheet uses the first two; Codex's installer daily sheet may call any of them):
   mpGroups819(as)     -> [{p, refs, ways, url}] - the meet points a list of references goes to, in order of first use.
   mpWhere819(html, g) -> the Where it goes HTML (dpWhere's output) with each reference's meet point and its directions
                          QR put in: inside the master-plan position box for one reference, or a Meet point line and a
                          QR column in the several-reference table. Its way in is shown only where it says more than
                          the sheet's own Way in (mpSameWay819, the drawer's rule).
   mpRulesLine819(html, g) -> the sheet's rules line (dpRulesLine's output) with the site rules added on its end, and
                          the island west parkland rules where the load goes to the parkland.
   mpMeetBlock819(as)  -> HTML: one card per meet point (QR, name, coordinates), a block for a sheet with room for it.
   mpRulesBlock819()   -> HTML: the site rules word for word (less the site hours every sheet prints) and the parkland
                          rules, as a block.
 All take the sheet's --k scale (scale 1 outside a sheet) and are styled under .dp-page (v819.css). */
function mpGroups819(as){
	const seen = new Map();
	(as || []).forEach(a => { if (!a) return; const m = meetPoint819(a), k = m.p.id;
		if (!seen.has(k)) seen.set(k, {p: m.p, refs: [], url: mpUrl819(m.p)}); seen.get(k).refs.push(a.key); });
	return [...seen.values()];
}
function mpQr819(p, cls){ const url = mpUrl819(p); return `<div class="mp819d-q${cls ? ' ' + cls : ''}" data-mp819-url="${esc(url)}" title="${esc('Scan: driving directions to ' + p.name)}">${qrSvg(url, 3)}</div>`; }
function mpWhere819(html, g){
	try {
		const rows = (g && g.rows || []).filter(r => r && r.a); if (!rows.length) return html;
		const tp = document.createElement('template'); tp.innerHTML = html; const R = tp.content;
		const pos = R.querySelector('.dp-pos-t'), tbl = R.querySelector('.dp-wtbl');
		if (rows.length === 1 && pos) {
			const a = rows[0].a, m = meetPoint819(a), p = m.p;
			const wl = [...R.querySelectorAll('.dp-l')].find(l => /^way in$/i.test((l.querySelector('label') || {}).textContent || ''));
			const same = mpSameWay819([wl ? wl.querySelector('div').textContent : ''], p.way);
			pos.insertAdjacentHTML('beforeend', `<div class="mp819p" data-mp819="${esc(p.id)}">${mpQr819(p)}<div class="mp819p-t"><em>Meet point · scan for directions</em><b>${esc(p.name)}</b>${same ? '' : `<span>Way in: ${esc(p.way)}</span>`}</div></div>`);
			return tp.innerHTML;
		}
		if (tbl) {
			const by = new Map(rows.map(r => [r.a.key, r.a]));
			const hr = tbl.querySelector('thead tr'), qh = hr && hr.querySelector('.dp-qc');
			if (hr) { const th = document.createElement('th'); th.className = 'mp819-qc'; th.textContent = 'Meet point'; qh ? hr.insertBefore(th, qh) : hr.appendChild(th); }
			tbl.querySelectorAll('tbody tr').forEach(tr => {
				const a = by.get(((tr.querySelector('.dp-rk') || {}).textContent || '').trim()); const qc = tr.querySelector('td.dp-qc');
				const td = document.createElement('td'); td.className = 'mp819-qc'; qc ? tr.insertBefore(td, qc) : tr.appendChild(td);
				if (!a) return;
				const p = meetPoint819(a).p, cell = qc ? qc.previousElementSibling.previousElementSibling : null, wi = tr.querySelector('.dp-wi');
				const same = mpSameWay819([wi ? wi.textContent.replace(/^way in:\s*/i, '') : ''], p.way);
				td.innerHTML = mpQr819(p);
				if (cell) cell.insertAdjacentHTML('beforeend', `<span class="mp819r" data-mp819="${esc(p.id)}">Meet point: <b>${esc(p.name)}</b>${same ? '' : ` – way in: ${esc(p.way)}`}</span>`);
			});
			return tp.innerHTML;
		}
		return html;
	} catch (e) { try { console.warn('v8.19 meet point on the sheet', e); } catch (x) {} return html; }
}
function mpRulesLine819(html, g){
	try {
		const E = typeof EP819 !== 'undefined' ? EP819 : null; if (!E || !html) return html;
		const park = E.park && mpGroups819((g && g.rows || []).map(r => r && r.a).filter(Boolean)).some(x => x.p.id === MP819.park);
		const add = `<i>·</i><span class="mp819l">Go to the meet point – Coates meets you</span><i>·</i><span class="mp819l">If unsure, go to the pit lane entry</span>`
			+ (park ? `<i>·</i><span class="mp819l mp819l-park"><b>${esc(E.park.area.replace(/\s*\(.*\)$/, ''))}:</b> ${E.park.rules.map(esc).join(' · ')}</span>` : '');
		const i = html.lastIndexOf('</div>'); return i < 0 ? html : html.slice(0, i) + add + html.slice(i);
	} catch (e) { return html; }
}
function mpMeetBlock819(as){
	return `<div class="mp819d-g">${mpGroups819(as).map(x => `<div class="mp819d">${mpQr819(x.p)}<div class="mp819d-t"><em>Meet point · scan for directions</em><b>${esc(x.p.name)}</b><span><span class="dp-ll">${esc(mpLl819(x.p))}</span> · for ${esc(x.refs.join(', '))}</span></div></div>`).join('')}</div>`;
}
function mpRulesBlock819(){
	const E = typeof EP819 !== 'undefined' ? EP819 : null; if (!E) return '';
	const rules = (E.site_rules || []).filter(x => !/^site hours/i.test(x));
	const park = E.park ? `<li class="mp819d-park"><b>${esc(E.park.area)}:</b> ${E.park.rules.map(esc).join(' · ')}</li>` : '';
	return rules.length || park ? `<div class="mp819d-r"><div class="mp819d-c"><b>Site rules</b><ol>${rules.map(x => `<li>${esc(x)}</li>`).join('')}${park}</ol></div></div>` : '';
}
