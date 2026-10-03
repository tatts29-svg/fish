/* ================================================================== v8.18 - meet points for all gear and equipment
 Author: Andrew Fisher. Andrew, 3 Oct 2026: every delivery or pick-up goes to the meet / entry point for its area and
 Coates meets the truck there ... "This goes for all gear and equipment ... If we unsure they refer back to entry
 pitlane" ... "this now should be info for everything now".

 THE RULE (the same as the reference assignment the Event Portables sheets were made with, line for line):
   1. a master-plan position inside a drawn area outline (the island west parkland) -> that area's point;
   2. the pit lane precinct (pit garages PG.., WC12, WC16) -> pit lane entry;
   3. otherwise the nearest point on the SAME SIDE within 150 m. Side is the page's own zone816 (island / outside;
      seaside / land side on Main Beach Pde and Surfers), with the page's way-in words deciding the side where they
      name it, as the v7.84 rule has it; an area point serves only what is inside its outline;
   4. anything else, or no master-plan position -> pit lane entry, the default.
 The position used is the master-plan one (dest782 kind 'master') - the same one the reference used.
 MP818 and EP818 are written into the page by the patch from meet_points_03Oct2026/*.json. */
function mpDist818(a, b){ return Math.hypot((a[0] - b[0]) * 111320, (a[1] - b[1]) * 111320 * Math.cos(a[0] * Math.PI / 180)); }
function mpInside818(ll, poly){
	const x = ll[1], y = ll[0]; let c = false;
	for (let i = 0; i < poly.length; i++) { const y1 = poly[i][0], x1 = poly[i][1], y2 = poly[(i + 1) % poly.length][0], x2 = poly[(i + 1) % poly.length][1];
		if ((y1 > y) !== (y2 > y) && x < (x2 - x1) * (y - y1) / (y2 - y1) + x1) c = !c; }
	return c;
}
function mpPrecinct818(key){ return /^PG/.test(String(key || '')) || key === 'WC12' || key === 'WC16'; }
/* the side a reference stands on: zone816, with the way-in words deciding seaside / land side where they say it */
function mpZone818(a, D){
	if (!D || D.kind !== 'master') return null;
	const z0 = zone816(a), z = Object.assign({}, z0);
	let w = ''; try { w = String(wayIn816(a, z0) || '').toLowerCase(); } catch (e) { w = ''; }
	if (z.sea != null) { if (w.startsWith('seaside') && !z.sea) z.sea = true; else if (w.startsWith('land side') && z.sea) z.sea = false; }
	return z;
}
/* -> {p: the point, m: metres from the position to it or null, how: area | precinct | rule | nopin | default} */
function meetPoint818(a){
	const DEF = MP818.def, P = MP818.points;
	if (!a) return {p: DEF, m: null, how: 'nopin'};
	let D = null; try { D = dest782(a); } catch (e) { D = null; }
	const ll = D && D.kind === 'master' && D.ll && isFinite(D.ll.lat) && isFinite(D.ll.lon) ? [D.ll.lat, D.ll.lon] : null;
	for (const p of P) if (p.poly && ll && mpInside818(ll, p.poly)) return {p, m: mpDist818(ll, p.ll), how: 'area'};
	if (mpPrecinct818(a.key)) return {p: DEF, m: ll ? mpDist818(ll, DEF.ll) : null, how: 'precinct'};
	let z = null; try { z = mpZone818(a, D); } catch (e) { z = null; }
	if (!ll || !z) return {p: DEF, m: null, how: 'nopin'};
	const c = P.filter(p => !p.poly && p.side === z.side && !(p.sea != null && z.sea != null && p.sea !== z.sea))
		.map(p => ({p, m: mpDist818(ll, p.ll)})).sort((x, y) => x.m - y.m);
	if (c.length && c[0].m <= 150) return {p: c[0].p, m: c[0].m, how: 'rule'};
	return {p: DEF, m: mpDist818(ll, DEF.ll), how: 'default'};
}
function mpUrl818(p){ return navUrl({lat: p.ll[0], lon: p.ll[1]}); }
function mpLl818(p){ return p.ll[0].toFixed(6) + ', ' + p.ll[1].toFixed(6); }
function mpWhy818(r){
	return r.how === 'area' ? 'inside the ' + (r.p.area || 'area') + ' outline'
		: r.how === 'precinct' ? 'pit lane precinct - pit garages, WC12 and WC16 go to the pit lane entry'
		: r.how === 'rule' ? 'nearest meet point on the same side, about ' + fmtMetres(Math.round(r.m)) + ' from the plan position'
		: r.how === 'default' ? 'no meet point within 150 m on the same side - pit lane entry, the default'
		: 'no master-plan position - pit lane entry, the default';
}
function mpParkHtml818(cls){
	const R = (typeof EP818 !== 'undefined' && EP818.park) || null; if (!R) return '';
	return `<div class="${cls}" role="note"><b>${esc(R.area)}</b><ul>${R.rules.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
}
/* the reference drawer: its meet point, a QR for driving directions to it, and the parkland rules where they apply */
function mpDrawer818(a){
	const dr = $('#drawer'); if (!dr || !a) return;
	const wh = dr.querySelector('.where816'); if (!wh || wh.querySelector('.mp818')) return;
	const r = meetPoint818(a), p = r.p, url = mpUrl818(p);
	let w0 = ''; try { w0 = String(wayIn816(a, zone816(a)) || ''); } catch (e) { w0 = ''; }
	const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
	const sameWay = norm(w0).replace(/ race direction$/, '') === norm(p.way).replace(/ race direction$/, '');
	const box = document.createElement('div'); box.className = 'mp818' + (p.id === MP818.park ? ' park' : ''); box.dataset.mp818 = p.id;
	box.innerHTML = `<a class="mp818-qr" href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-mp818-url="${esc(url)}" title="${esc('Scan or tap: driving directions to ' + p.name)}" aria-label="${esc('QR code: driving directions to the meet point, ' + p.name)}">${qrSvg(url, 3)}</a>
<div class="mp818-t"><b class="mp818-n">Meet point: ${esc(p.name)}</b>${sameWay ? '' : `<span>Way in: ${esc(p.way)}</span>`}<span class="mp818-w">${esc(mpWhy818(r))}</span>
<span class="mp818-s">Scan or tap for driving directions · ${esc(mpLl818(p))}</span></div>`;
	if (p.id === MP818.park) box.insertAdjacentHTML('beforeend', mpParkHtml818('mp818-park'));
	const acts = wh.querySelector('.wa816');
	if (acts) wh.insertBefore(box, acts); else wh.appendChild(box);
}
/* the driver's sheet: each meet point the load goes to, with its QR, then the site rules (site hours are already on the
 sheet's rules line, so they are not said twice) */
function mpDrvSec818(g){
	const seen = new Map();
	(g.rows || []).forEach(r => { if (!r || !r.a) return; const m = meetPoint818(r.a); const k = m.p.id;
		if (!seen.has(k)) seen.set(k, {p: m.p, refs: []}); seen.get(k).refs.push(r.a.key); });
	const pts = [...seen.values()];
	const cards = pts.map(x => { const url = mpUrl818(x.p);
		return `<div class="mp818d"><div class="mp818d-q" data-mp818-url="${esc(url)}">${qrSvg(url, 3)}</div><div class="mp818d-t"><b>${esc(x.p.name)}</b><span>Way in: ${esc(x.p.way)}</span><span><span class="dp-ll">${esc(mpLl818(x.p))}</span> · for ${esc(x.refs.join(', '))}</span><em>Scan: driving directions to the meet point</em></div></div>`; }).join('');
	const E = typeof EP818 !== 'undefined' ? EP818 : null;
	const rules = E ? E.site_rules.filter(x => !/^site hours/i.test(x)) : [];
	const park = E && E.park ? `<li class="mp818d-park"><b>${esc(E.park.area)}:</b> ${E.park.rules.map(esc).join(' · ')}</li>` : '';
	return `<div class="mp818d-band"><div class="mp818d-g">${cards}</div>${rules.length || park ? `<div class="mp818d-r"><b>SITE RULES</b><ol>${rules.map(x => `<li>${esc(x)}</li>`).join('')}${park}</ol></div>` : ''}</div>`;
}
