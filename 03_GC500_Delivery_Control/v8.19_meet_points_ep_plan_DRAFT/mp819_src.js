/* ================================================================== v8.19 - meet points for all gear and equipment
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
function mpZone819(a, D){
	if (!D || D.kind !== 'master') return null;
	const z0 = zone816(a), z = Object.assign({}, z0);
	let w = ''; try { w = String(wayIn816(a, z0) || '').toLowerCase(); } catch (e) { w = ''; }
	if (z.sea != null) { if (w.startsWith('seaside') && !z.sea) z.sea = true; else if (w.startsWith('land side') && z.sea) z.sea = false; }
	return z;
}
/* -> {p: the point, m: metres from the position to it or null, how: area | precinct | rule | nopin | default} */
function meetPoint819(a){
	const DEF = MP819.def, P = MP819.points;
	if (!a) return {p: DEF, m: null, how: 'nopin'};
	let D = null; try { D = dest782(a); } catch (e) { D = null; }
	const ll = D && D.kind === 'master' && D.ll && isFinite(D.ll.lat) && isFinite(D.ll.lon) ? [D.ll.lat, D.ll.lon] : null;
	for (const p of P) if (p.poly && ll && mpInside819(ll, p.poly)) return {p, m: mpDist819(ll, p.ll), how: 'area'};
	if (mpPrecinct819(a.key)) return {p: DEF, m: ll ? mpDist819(ll, DEF.ll) : null, how: 'precinct'};
	let z = null; try { z = mpZone819(a, D); } catch (e) { z = null; }
	if (!ll || !z) return {p: DEF, m: null, how: 'nopin'};
	const c = P.filter(p => !p.poly && p.side === z.side && !(p.sea != null && z.sea != null && p.sea !== z.sea))
		.map(p => ({p, m: mpDist819(ll, p.ll)})).sort((x, y) => x.m - y.m);
	if (c.length && c[0].m <= 150) return {p: c[0].p, m: c[0].m, how: 'rule'};
	return {p: DEF, m: mpDist819(ll, DEF.ll), how: 'default'};
}
function mpUrl819(p){ return navUrl({lat: p.ll[0], lon: p.ll[1]}); }
function mpLl819(p){ return p.ll[0].toFixed(6) + ', ' + p.ll[1].toFixed(6); }
function mpWhy819(r){
	return r.how === 'area' ? 'inside the ' + (r.p.area || 'area') + ' outline'
		: r.how === 'precinct' ? 'pit lane precinct - pit garages, WC12 and WC16 go to the pit lane entry'
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
<div class="mp819-t"><b class="mp819-n">Meet point: ${esc(p.name)}</b>${sameWay ? '' : `<span>Way in: ${esc(p.way)}</span>`}<span class="mp819-w">${esc(mpWhy819(r))}</span>
<span class="mp819-s">Scan or tap for driving directions · ${esc(mpLl819(p))}</span></div>`;
	if (p.id === MP819.park) box.insertAdjacentHTML('beforeend', mpParkHtml819('mp819-park'));
	const acts = wh.querySelector('.wa816');
	if (acts) wh.insertBefore(box, acts); else wh.appendChild(box);
}
/* ---------- helpers for any printed sheet (the driver sheet uses them; the installer daily sheet may call them too).
 mpMeetBlock819(as)  -> HTML: one card per meet point the references go to (in order of first use), each with a QR for
                        Google Maps driving directions to the meet point (6 decimals), its name, its way in where it says
                        more than the references' own way in, and which references it serves when there is more than one.
                        `as` is an array of references (page assets, as allAssets() gives them).
 mpRulesBlock819()   -> HTML: the site rules for all gear and equipment (less the site hours, which every sheet already
                        prints) and the island west parkland rules, word for word from the plan data.
 mpDrvSec819(g)      -> the driver sheet's band: both of the above for a load g (g.rows[].a), in one row.
 Both blocks take the sheet's --k scale and are styled under .dp-page (v819.css). */
function mpMeetBlock819(as){
	const seen = new Map();
	(as || []).forEach(a => { if (!a) return; const m = meetPoint819(a), k = m.p.id;
		let w = ''; try { w = String(wayIn816(a, zone816(a)) || ''); } catch (e) { w = ''; }
		if (!seen.has(k)) seen.set(k, {p: m.p, refs: [], ways: []}); seen.get(k).refs.push(a.key); seen.get(k).ways.push(w); });
	const pts = [...seen.values()], many = pts.length > 1;
	return {n: pts.length, html: pts.map(x => { const url = mpUrl819(x.p), same = mpSameWay819(x.ways, x.p.way);
		return `<div class="mp819d"><div class="mp819d-q" data-mp819-url="${esc(url)}">${qrSvg(url, 3)}</div><div class="mp819d-t"><em>Meet point · scan for directions</em><b>${esc(x.p.name)}</b>${same ? '' : `<span>Way in: ${esc(x.p.way)}</span>`}<span><span class="dp-ll">${esc(mpLl819(x.p))}</span>${many ? ' · for ' + esc(x.refs.join(', ')) : ''}</span></div></div>`; }).join('')};
}
function mpRulesBlock819(){
	const E = typeof EP819 !== 'undefined' ? EP819 : null; if (!E) return '';
	const rules = (E.site_rules || []).filter(x => !/^site hours/i.test(x));
	const park = E.park ? `<li class="mp819d-park"><b>${esc(E.park.area)}:</b> ${E.park.rules.map(esc).join(' · ')}</li>` : '';
	return rules.length || park ? `<div class="mp819d-r"><div class="mp819d-c"><b>Site rules</b><ol>${rules.map(x => `<li>${esc(x)}</li>`).join('')}${park}</ol></div></div>` : '';
}
/* the driver's sheet: one band at the foot of Where it goes - the meet point beside the site rules, in one row and with
 no heading of its own, so the photographs below keep their room */
function mpDrvSec819(g){
	const M = mpMeetBlock819((g.rows || []).map(r => r && r.a).filter(Boolean));
	return `<div class="mp819s mp819d-band${M.n > 1 ? ' many' : ''}"><div class="mp819d-g">${M.html}</div>${mpRulesBlock819()}</div>`;
}
