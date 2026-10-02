/* ================================================================== v8.16 - the reference drawer, simple first
 Andrew, 3 Oct 2026: "clean up the look when we open up the reference ... remove thing we don't need or hide it so it does
 not over crowd ... They go in to find simple data. If they want more data they can expand the area they want to see more
 of use additional animations in here" ... "everything is pinned and has a reference location you know all this info I
 don't want to see areas not filled in it looks messy" ... on the contract and costs: "people don't wanna see this this is
 more financial. General eyes don't wanna see costs" ... on what was asked for and supplied: "remove or hide it" ... "this
 is area for reference to also know if its complete and complete it if needed. and see where it goes and see reference to
 where it is".

 HOW. openAssetDraw draws and wires the drawer exactly as before; this then ARRANGES what it drew - the parts are moved,
 folded or left out of the general view, never redrawn - so every setter, every handler and every record path is the one
 that was there. What is new is the summary header, the Complete it row, the Where it is card and the photo strip, and
 each of those writes through the existing setters (setLight, setDone, setLevelled, setSteps, the photo outbox).
 Anything financial goes into Contract & charges, which only the edit link sees (body.viewonly .editonly). */
const F816 = {open: new Set()};
function plain816(el){ return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
/* aerial frame co-ordinates (0-1) for a latitude and longitude: the inverse of lonLatOf */
function frameOf816(ll){
	const g = DATA.georef; if (!g || !g.basemap_px_to_epsg3857 || !ll) return null;
	const R = 6378137, x = ll.lon * Math.PI / 180 * R, y = Math.log(Math.tan(Math.PI / 4 + ll.lat * Math.PI / 360)) * R;
	const A = g.basemap_px_to_epsg3857, det = A[0][0] * A[1][1] - A[0][1] * A[1][0]; if (!det) return null;
	const bx = x - A[0][2], by = y - A[1][2];
	const u = (bx * A[1][1] - A[0][1] * by) / det, v = (A[0][0] * by - A[1][0] * bx) / det;
	return {ax: u / g.frame_px[0], ay: v / g.frame_px[1]};
}
/* a master-sheet point back to latitude and longitude: the inverse of ptOf782's fit */
function llOfPt816(p){
	try { ptOf782({key: ''}, {lat: -27.98, lon: 153.42}); } catch (e) { return null; }
	const f = PTFIT782; if (!f) return null;
	const a = f.x[0], b = f.x[1], c = f.y[0], d = f.y[1], det = a * d - b * c; if (!det) return null;
	const X = p[0] - f.x[2], Y = p[1] - f.y[2];
	return {lon: (X * d - b * Y) / det, lat: (a * Y - c * X) / det};
}
const SRCW816 = {master: 'master plan', pinned: 'pinned on site', placed: 'placed on the map', desc: 'from the description', confirmed: 'confirmed by the project manager', unverified: 'drawing position · not verified', area: 'drawing callout · the area', report: 'no drop yet · pit lane'};
function srcWords816(a, D){
	if (!D) return 'position to confirm';
	if (D.kind === 'master') { const m = MASTER_LOC[a.key]; return 'master plan · ' + (m && m.prec === 'area' ? 'the area' : 'on the unit'); }
	return SRCW816[D.kind] || D.label || 'position';
}
/* the small aerial with the pin, cut in CSS from the frame the page already carries; the island drawn over it */
function mini816(a, D, z){
	if (!D || !D.ll) return '';
	const src = DATA.aerial_mid || DATA.aerial_hi; const P = frameOf816(D.ll);
	if (!src || !P || P.ax < 0.02 || P.ax > 0.98 || P.ay < 0.02 || P.ay > 0.98) return '';
	const px = DATA.aerial_mid ? DATA.aerial_mid_px : DATA.aerial_hi_px, ratio = px && px[0] ? px[1] / px[0] : 0.63;
	const f = 0.24, boxR = 0.5, W = 100 / f, H = W * ratio / boxR;
	const L = 50 - P.ax * W, T = 50 - P.ay * H;
	const isl = (ZONES782.island || []).map(p => llOfPt816(p)).map(ll => ll && frameOf816(ll)).filter(Boolean)
		.map(q => (50 + (q.ax - P.ax) * W).toFixed(2) + ',' + (50 + (q.ay - P.ay) * H).toFixed(2)).join(' ');
	return `<div class="air816" role="img" aria-label="${esc('Aerial photograph, the pin on ' + a.key + (z.zone === 'island' ? ', inside Macintosh Island' : ''))}">
<img src="${esc(src)}" alt="" loading="lazy" decoding="async" style="width:${W.toFixed(2)}%;height:${H.toFixed(2)}%;left:${L.toFixed(2)}%;top:${T.toFixed(2)}%">
${isl ? `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="${isl}" class="isl816"/></svg><span class="chip ref islw816">Macintosh Island</span>` : ''}
<i class="pin816" aria-hidden="true"></i><span class="aircap816">${D.kind === 'report' ? '<span class="chip act">the pit lane - report here</span>' : refPlate(a.key, 14)}</span></div>`;
}
function fold816(id, title, sub, inner, cls){
	if (!inner) return '';
	const open = F816.open.has(id);
	return `<details class="dsect f816${cls ? ' ' + cls : ''}" data-f816="${esc(id)}"${open ? ' open' : ''}><summary><span class="ft816">${title}</span>${sub ? `<span class="w">${sub}</span>` : ''}</summary><div class="fb816"></div></details>`;
}
function drawer816(a){
	const dr = $('#drawer'); if (!dr || !a) return;
	const dh = dr.querySelector('.dh'), db = dr.querySelector('.db'), df = dr.querySelector('.df'); if (!dh || !db || !df) return;
	const key = a.key, d = deliveryOf(key), ed = canEdit(), eff = effectiveDates(a);
	dr.classList.add('d816');
	/* 1. sort what openAssetDraw drew into named parts, in their order */
	const B = {}; const put = (k, el) => { (B[k] = B[k] || []).push(el); };
	let cur = 'top', seenTags = false;
	[...db.children].forEach(el => {
		const t = plain816(el), sect = el.classList.contains('sect');
		if (el.id === 'drawerNav') { put('nav', el); return; }
		if (el.classList.contains('ptags')) { seenTags = true; cur = 'misc'; el.remove(); return; }
		if (el.classList.contains('sub744')) { put('sub744', el); return; }
		if (!seenTags) { put('top', el); return; }
		if (el.classList.contains('card') && el.querySelector('.tlcard')) { put('delivery', el); cur = 'misc'; return; }
		if (el.classList.contains('card') && el.querySelector('#bdReport')) { put('breakdown', el); cur = 'misc'; return; }
		if (el.id === 'dsectRecord') { put('record', el); cur = 'misc'; return; }
		if (el.id === 'dsectDriver') { put('driver', el); cur = 'misc'; return; }
		if (el.id === 'dsectHire') { put('hire', el); cur = 'misc'; return; }
		if (el.id === 'dsectHistory') { put('history', el); cur = 'misc'; return; }
		const h3 = el.classList.contains('card') ? plain816(el.querySelector('h3')) : '';
		if (h3 === 'Costs') { put('costs', el); cur = 'misc'; return; }
		if (/^What was asked for/.test(h3)) { put('supplied', el); cur = 'misc'; return; }
		if (sect && /^Map attached/.test(t)) cur = 'map';
		else if (sect && el.classList.contains('contents')) cur = 'contents';
		else if (sect && /^Asset numbers on/.test(t)) cur = 'numbers';
		else if (sect && /^Where .+ goes$/.test(t)) cur = 'where';
		else if (sect && /^Photographs of this drop/.test(t)) cur = 'photos';
		else if (sect && el.classList.contains('filedhead')) cur = 'filed';
		else if (sect && /^Your note$/.test(t)) cur = 'note';
		put(cur, el);
	});
	const all = k => B[k] || [], one = k => (B[k] || [])[0] || null;
	const holder = els => { const w = document.createElement('div'); els.forEach(e => e && w.appendChild(e)); return w; };
	/* the delivery card comes apart: its date boxes, its note, its light history and its rental lines go where they are read */
	const dc = one('delivery');
	const dForm = dc ? dc.querySelector(':scope > .form') : null;
	const dnote = dForm ? (dForm.querySelector('[data-dnote]') || {}).closest && dForm.querySelector('[data-dnote]').closest('.f') : null;
	if (dnote) dnote.remove();
	const lhist = dc ? dc.querySelector(':scope > details.sfold') : null;
	const rentalLines = dc ? [...dc.querySelectorAll(':scope > .tlcard')].find(x => /On hire — Coates rental system/.test(plain816(x))) : null;
	/* 2. the header: plate, what it is, branch, asset number; close */
	const title = dh.querySelector('#drawerTitle'), close = dh.querySelector('#dclose');
	const navEl = dh.querySelector('.navbtn, .navno'), share = dh.querySelector('#dshare');
	const restore = a._cancelled ? dh.querySelector('[data-restorek]') : null;
	let br = ''; try { const b = branchOf(key); br = b && (b.code || (typeof b === 'string' ? b : '')) || ''; } catch (e) {}
	const sub = subhireOf(key);
	const nos = (a.asset_numbers || []).filter(x => String(x).toUpperCase() !== 'MISCITEM');
	const kindLine = [a.discipline, sub ? null : br, nos.length ? 'asset ' + nos.slice(0, 2).join(', ') + (nos.length > 2 ? ' +' + (nos.length - 2) : '') : null].filter(Boolean).join(' · ');
	const nameLine = [a.name || a.item || key, (a.item_types || [])[0]].filter(Boolean).filter((x, i, l) => l.indexOf(x) === i).join(' · ');
	dh.innerHTML = '';
	const top = document.createElement('div'); top.className = 'dh816';
	if (title) { title.innerHTML = refPlate(key, 26); top.appendChild(title); }
	const nm = document.createElement('div'); nm.className = 'nm816';
	nm.innerHTML = `<div class="sub nmx816">${esc(nameLine)}</div><div class="kl816">${esc(kindLine)}${shortChip(a)}${subhireChip(key)}</div>`;
	top.appendChild(nm); dh.appendChild(top);
	if (restore) dh.appendChild(restore);
	if (close) dh.appendChild(close);
	/* 3. the summary: what state it is in, the ticks it carries, In and Out - the Today instruments' island and tiles */
	const M = demobOf816(key), z = M ? {zone: M.zone, side: M.side} : zone816(a);
	const v = deliveryView(key), em = emptiedOf816(key);
	const zoneChip = z.zone === 'island' ? '<span class="chip ref">Macintosh Island</span>' : z.zone === 'unknown' ? '<span class="chip cand">Position to confirm</span>' : '<span class="chip act">Outside the island</span>';
	const ticks = [d.done ? '<span class="tick">✓ Complete</span>' : '', levelChip(a), stepsChip(a), needsEmpty816(a) && em.on ? '<span class="tick">✓ Emptied</span>' : ''].join('');
	const inWhy = eff.in ? (eff.in_moved ? 'moved' + (eff.in_by ? ' by ' + eff.in_by : '') : a.first_date ? 'on the plan' : '') + (d.state === 'on site' ? ' · arrived' : '') + (d.eta ? ' · ' + d.eta : '') : 'no date on the schedule';
	/* a cancelled reference is off the demob, but a due-out it still carries is shown, marked cancelled */
	const cxOut = !M && a._cancelled ? (d.out_date || eff.out || contract816(a).early || null) : null;
	const outWhy = cxOut ? 'cancelled · ' + (d.out_date ? 'the due-out typed on it' : eff.out_plan ? 'the plan\'s remove event' : 'contract off-hire') : !M || !M.iso ? 'no date - position to confirm'
		: M.src === 'proposed' ? 'proposed · ' + (M.side === 'inside' ? 'island, week ' + week816(M.iso) : M.side === 'outside' ? 'outside the island, week 1' : 'position to confirm, end of week 3')
		: M.src === 'plan' ? 'the plan\'s remove event' : M.src === 'contract' ? 'contract off-hire' : 'confirmed' + (d.out_by ? ' by ' + d.out_by : '');
	const hireEnd = M && M.contractEnd === DM816.end && M.src !== 'contract' ? ' · hire ends 13 Nov' : '';
	const word = a._cancelled ? 'Cancelled' : d.recorded ? ((LIGHT[d.state] || {}).label || d.state) : (v.label || 'No light set');
	const sinceW = d.recorded ? [d.set_at ? 'since ' + fmtStamp(d.set_at) : '', d.by ? recorderDisplay772(d.by) : ''].filter(Boolean).join(' · ') : esc(v.why || 'nobody has set a light yet');
	const sum = document.createElement('section'); sum.className = 'card hubcard island dialcard sum816 nosfold';
	sum.innerHTML = `<div class="hubtitle"><h3>${esc(word)}</h3>${zoneChip}</div><p class="since816">${sinceW}</p>
${ticks ? `<div class="chips816">${ticks}</div>` : ''}
<div class="cside"><div class="ctwo"><div class="ctile plan"><p class="ctk">In</p><b>${eff.in ? esc(dayWords816(eff.in)) : '—'}</b><span>${esc(inWhy)}</span></div>
<div class="ctile ${M && M.src === 'proposed' ? 'pr816' : cxOut ? 'stop' : 'good'} dt816 out"><p class="ctk">Out ${M ? srcChip816(M.src) : cxOut ? '<span class="chip crit">cancelled</span>' : ''}</p><b>${M && M.iso ? esc(dayWords816(M.iso)) : cxOut ? esc(dayWords816(cxOut)) : '—'}</b><span>${esc(outWhy + hireEnd)}</span></div></div></div>
${dForm ? '<button type="button" class="linkish editonly chg816 hubgo" data-chg816="dates" aria-expanded="false">Change the dates →</button><div class="chgp816" data-chgp816="dates" hidden></div>' : ''}`;
	if (dForm) sum.querySelector('[data-chgp816="dates"]').appendChild(dForm);
	/* 4. Complete it: Today's lights island for one reference - the signal head, a row per light, a row per tick */
	const lvl = needsLevel(a), stp = mentionsSteps(a) || d.steps, dis = ed ? '' : ' disabled';
	const when = s => s ? ' <span class="w">' + esc(fmtStamp(s).slice(0, 6)) + '</span>' : '';
	const lrow = (go, s, words) => { const on = d.recorded && d.state === s; return `<button type="button" class="hl${on ? '' : ' off816'}" data-lf-go="${go}" data-light="${esc(key)}" data-s="${esc(s)}" aria-pressed="${on}"${dis}><span class="tl ${go}"><i></i></span><b>${on ? '✓' : '–'}</b> ${words}${on ? when(d.set_at) : ''}</button>`; };
	const trow = (go, attr, on, words, at, glyph) => `<button type="button" class="hl${on ? '' : ' off816'}" data-lf-go="${go}" data-${attr}="${esc(key)}" aria-pressed="${on}"${dis}><span class="tick sm${go === 'levelled' ? ' lvl' : go === 'steps' ? ' stp' : ''}" aria-hidden="true">${glyph}</span><b>${on ? '✓' : '–'}</b> ${words}${on ? when(at) : ''}</button>`;
	const rows = [lrow('green', 'on site', 'on site'), lrow('amber', 'in transit', 'in transit'), lrow('red', 'not on site', 'not on site'),
		trow('done', 'done', d.done, 'complete', d.done_at, '✓')];
	if (lvl) rows.push(trow('levelled', 'levelled', d.levelled, 'levelled', d.levelled_at, levelGlyph(11)));
	if (stp) rows.push(trow('steps', 'steps', d.steps, 'steps', d.steps_at, stepsGlyph(11)));
	if (needsEmpty816(a)) rows.push(`<button type="button" class="hl emp816${em.on ? '' : ' off816'}" data-lf-go="${em.on ? 'done' : 'red'}" data-emptied="${esc(key)}" aria-pressed="${em.on}"${dis} title="No toilet or waste tank is moved or loaded until it is pumped out"><span class="tl ${em.on ? 'green' : 'red'}"><i></i></span><b>${em.on ? '✓' : '!'}</b> emptied (pumped out)${em.on ? when(em.at) : ' <span class="w">before pick-up</span>'}</button>`);
	const got = [d.state === 'on site', d.done, lvl && d.levelled, stp && d.steps].filter(Boolean).length, of = 2 + (lvl ? 1 : 0) + (stp ? 1 : 0);
	const cmp = document.createElement('section'); cmp.className = 'card hubcard island lights cmp816 nosfold';
	cmp.innerHTML = `<div class="hubtitle"><h3>Complete it</h3><span class="chip ${got === of ? 'ok' : 'ref'}">${got} of ${of}</span></div>
<div class="hublights">${signalHead({green: d.recorded && d.state === 'on site' ? 1 : 0, amber: d.recorded && d.state === 'in transit' ? 1 : 0, red: d.recorded && d.state === 'not on site' ? 1 : 0})}${rows.join('')}</div>
${needsEmpty816(a) && !em.on ? `<p class="since816">No toilet or waste tank is moved or loaded until it is pumped out.${M && M.tank ? ' The toilet comes off before the tank under it.' : ''}</p>` : ''}`;
	cmp.querySelectorAll('[data-emptied]').forEach(b => b.onclick = e => { e.preventDefault(); e.stopPropagation(); setEmptied816(key, !emptiedOf816(key).on); });
	/* 5. Where it is / where it goes: the one destination Navigate uses */
	let D = null; try { D = dest782(a); } catch (e) { D = null; }
	const typed = (S.locations || {})[key], sched = (a._locationMoved && a._locationMoved.from) || (a.locations || []).find(l => l && l !== key) || '';
	const near = (() => { try { return masterWords(masterUnit(key)); } catch (e) { return ''; } })();
	const showMap = dr.querySelector('#showOnMap'), toPlant = dr.querySelector('#toPlant');
	const wh = document.createElement('section'); wh.className = 'card hubcard where816 nosfold';
	wh.innerHTML = `<div class="hubtitle"><h3>Where it is</h3><span class="chip ${D ? 'ok' : 'cand'} srcp816">${esc(srcWords816(a, D))}</span></div>${mini816(a, D, z)}
<dl class="kv kv816"><dt>Goes to</dt><dd><b>${esc(typed || sched || 'not named on the schedule')}</b>${typed && sched && typed !== sched ? `<small>the schedule says ${esc(sched)}</small>` : ''}${near ? `<small>${esc(near)}</small>` : ''}</dd>
<dt>Area</dt><dd>${esc(DM816.name[z.zone] || '—')}</dd><dt>Way in</dt><dd>${esc(wayIn816(a, z))}</dd></dl>
<div class="acts816 wa816"></div><div class="chgp816" data-chgp816="where" hidden></div>`;
	const wa = wh.querySelector('.wa816');
	if (navEl) wa.appendChild(navEl);
	if (share) wa.appendChild(share);
	if (showMap) { showMap.textContent = 'On the map'; wa.appendChild(showMap); }
	wa.insertAdjacentHTML('beforeend', '<button type="button" class="btn ghost editonly chg816" data-chg816="where" aria-expanded="false">Moved? Change it</button>');
	const wp = wh.querySelector('[data-chgp816="where"]');
	all('where').forEach(e => wp.appendChild(e)); all('map').forEach(e => wp.appendChild(e));
	/* 6. the photographs: a stable slot (data-photo-slot) for the photo-stage work; filled photographs only */
	const ph = document.createElement('section'); ph.className = 'card hubcard ph816 nosfold'; ph.setAttribute('data-photo-slot', key);
	let list = []; try { list = dropPhotosOf(key); } catch (e) { list = []; }
	const cells = list.map(p => { let r = {}; try { r = photoFor(p); } catch (e) {} const url = r.state === 'ready' ? r.url : null; if (!url) return '';
		const lab = (p.caption || (DROP_SLOTS[p.slot] || {}).lab || 'Photo');
		return `<button type="button" class="phi816" data-ph816="${esc(url)}" title="${esc(lab)}"><img src="${esc(r.thumb || url)}" alt="${esc(key + ' - ' + lab)}" loading="lazy"><span class="chip">${esc(lab)}</span></button>`; }).filter(Boolean);
	const units = (() => { try { return dropPhotoUnits(a); } catch (e) { return []; } })();
	const hosted = !!(SYNC.backend && SYNC.backend.fileUrl);
	ph.innerHTML = `<div class="hubtitle"><h3>Photos</h3>${list.length ? `<span class="chip ref">${list.length}</span>` : ''}</div>${cells.length ? `<div class="strip816p">${cells.join('')}</div>` : list.length ? `<p class="note816">${list.length} photograph${list.length === 1 ? '' : 's'} on the record - loading.</p>` : ''}
${hosted ? `<div class="add816 editonly"><label class="btn primary" for="ph816in">Add a photo</label><input class="dphin" type="file" id="ph816in" accept="image/jpeg,image/png,image/webp">
<select id="ph816slot" aria-label="What is this a photo of?">${DROP_SLOTS.map((s, i) => `<option value="${i}">${esc(s.lab)}</option>`).join('')}</select>
${units.length > 1 ? `<select id="ph816unit" aria-label="Which unit">${units.map(u => `<option value="${esc(u)}">asset ${esc(u)}</option>`).join('')}</select>` : ''}<span class="note816" id="ph816msg"></span></div>` : ''}`;
	if (!list.length && !ed) ph.hidden = true;
	const manage = holder(all('photos').concat(all('filed')));
	/* 7. the folds */
	const folds = document.createElement('div'); folds.className = 'folds816';
	const evN = (a.events || []).length, lastLight = d.history && d.history.length ? d.history[d.history.length - 1] : null;
	const hist = document.createElement('div');
	{ const rec = one('record'), dl = rec ? rec.querySelector('dl.kv') : null, keep = [];
		if (dl) { const kids = [...dl.children]; for (let i = 0; i < kids.length; i += 2) { const k = plain816(kids[i]);
			if (/^(Reference|Schedule|Shared row|Tower series|Asset number)$/.test(k)) keep.push(kids[i], kids[i + 1]); } }
		if (keep.length) { const x = document.createElement('dl'); x.className = 'kv'; keep.forEach(e => e && x.appendChild(e)); const h = document.createElement('div'); h.className = 'sect'; h.textContent = 'The record'; hist.append(h, x); }
		const hs = one('history');
		if (hs) { const parts = [...hs.children].filter(e => e.tagName !== 'SUMMARY'); let sec = '';
			parts.forEach(e => { if (e.classList.contains('sect')) sec = plain816(e); if (/^Drawing links/.test(sec) && !(a.drawing_links || []).length) return; if (/^Scheduled events/.test(sec) && !evN) return; hist.appendChild(e); }); }
		if (lhist) { lhist.open = false; hist.appendChild(lhist); }
		if (d.note || ed) { const h = document.createElement('div'); h.className = 'sect'; h.textContent = 'Delivery note'; hist.appendChild(h);
			if (d.note) { const p = document.createElement('p'); p.className = 'note816 vo816'; p.textContent = d.note; hist.appendChild(p); }
			if (dnote) { const w = document.createElement('div'); w.className = 'form editonly'; w.appendChild(dnote); hist.appendChild(w); } }
		const nb = all('note');
		if (a._note || ed) { if (a._note && !ed) { const h = document.createElement('div'); h.className = 'sect'; h.textContent = 'Note'; const p = document.createElement('p'); p.className = 'note816'; p.textContent = a._note; hist.append(h, p); }
			else nb.forEach(e => hist.appendChild(e)); }
		all('misc').forEach(e => { if (plain816(e)) hist.appendChild(e); }); }
	const contents = holder(all('contents').concat(all('numbers')));
	const accN = (a.accessories || []).length, unitN = (Array.isArray(a._unitsNotContents) ? a._unitsNotContents : []).length;
	const showContents = ed || accN || unitN || nos.length > 1;
	/* the driver's card loses its money to the charges fold */
	const drv = one('driver'), moneyOut = [];
	if (drv) { [...drv.querySelectorAll('.lbrow, li, p, tr')].filter(e => /\$\s?\d/.test(e.textContent) && !e.querySelector('.lbrow, li, p, tr')).forEach(e => moneyOut.push(e)); }
	const drvBody = drv ? holder([...drv.children].filter(e => e.tagName !== 'SUMMARY')) : null;
	if (drvBody) { drvBody.querySelectorAll('td').forEach(td => { if (/^no callout on the 2026 sheets$/.test(plain816(td)) && D) td.textContent = 'placed by the ' + srcWords816(a, D); else if (/^nothing to match$/.test(plain816(td)) && D) td.textContent = '—'; }); }
	const charges = holder([]);
	const hire = one('hire'); if (hire) [...hire.children].filter(e => e.tagName !== 'SUMMARY').forEach(e => charges.appendChild(e));
	if (rentalLines) charges.appendChild(rentalLines);
	const cc = one('costs'); if (cc && !/No cost line names this asset/.test(plain816(cc))) charges.appendChild(cc);
	all('top').filter(e => /\$\s?\d/.test(e.textContent || '')).forEach(e => { B.top.splice(B.top.indexOf(e), 1); charges.appendChild(e); }); /* a charge in a notice is a charge */
	if (moneyOut.length) { const h = document.createElement('div'); h.className = 'sect'; h.textContent = 'Transport, from the driver\'s card'; charges.appendChild(h); moneyOut.forEach(e => charges.appendChild(e)); }
	const sup = one('supplied');
	let hasSup = false; try { hasSup = itemRows(a).some(r => r.supplied || r.qty_supplied != null) || allVariances().some(x => [x.ref, x.key, x.reference, x.asset].includes(key)); } catch (e) {}
	const bd = one('breakdown'), hasBd = bd && (bd.querySelector('[data-bedit]') || !/Nothing reported against this one/.test(plain816(bd)));
	const sub744 = one('sub744');
	const F = [['history', 'History and notes', [evN ? evN + ' schedule event' + (evN === 1 ? '' : 's') : '', lastLight ? 'light set ' + fmtStamp(lastLight.at).slice(0, 6) : ''].filter(Boolean).join(' · '), hist, ''],
		['contents', 'Inside it and asset numbers', [accN ? accN + ' inside' : '', nos.length ? nos.length + ' asset number' + (nos.length === 1 ? '' : 's') : ''].filter(Boolean).join(' · '), showContents && contents.children.length ? contents : null, ''],
		['driver', 'Driver\'s card', 'for the truck', drvBody, ''],
		['charges', 'Contract &amp; charges <span class="chip cand">editors only</span>', 'rental, rates, hire start, labour', charges.children.length ? charges : null, 'editonly'],
		['supplied', hasSup ? 'What was supplied' : 'Record a difference', hasSup ? 'against what was asked for' : 'what turned up against the order', sup, hasSup ? '' : 'editonly'],
		['breakdowns', 'Breakdowns', '', hasBd ? bd : null, ''],
		['sub744', 'Sub-hired gear', sub ? sub.co : 'add a supplier\'s units', sub744, sub ? '' : 'editonly'],
		['photos', 'Every photo place', 'replace, caption, remove', manage.children.length ? manage : null, 'editonly']];
	F.forEach(([id, t, s, inner, cls]) => { if (!inner) return; folds.insertAdjacentHTML('beforeend', fold816(id, t, s, ' ', cls));
		const fb = folds.lastElementChild.querySelector('.fb816'); if (inner.tagName === 'DIV' && !inner.className) [...inner.childNodes].forEach(n => fb.appendChild(n)); else fb.appendChild(inner); });
	{ const pf = folds.querySelector('[data-f816="photos"]'); if (pf) ph.appendChild(pf); }
	/* the empty-state lines a general reader does not need: a part with nothing in it is simply not there */
	folds.querySelectorAll('p.norate, p.hint').forEach(e => { if (/^(Nothing recorded inside this one|No drawing link|No scheduled events|None filed on the admin page|Nothing reported against this one)/.test(plain816(e))) e.remove(); });
	/* 8. the body, in its new order */
	db.innerHTML = '';
	db.appendChild(sum);
	all('nav').forEach(e => db.appendChild(e));
	all('top').forEach(e => db.appendChild(e));
	db.append(cmp, wh, ph, folds);
	/* 9. the footer: three to hand, the rest under More */
	const pick = id => dr.querySelector('#' + id);
	const keepF = ['dropSheet', 'textDrop', 'copyLink'].map(pick).filter(Boolean);
	const moreF = ['emailRich', 'emailAsset'].map(pick).filter(Boolean);
	if (toPlant) { toPlant.textContent = 'Equipment page'; moreF.push(toPlant); }
	const bdb = dr.querySelector('#bdReport'); if (bdb && !hasBd) { bdb.className = 'btn'; moreF.push(bdb); }
	const del = pick('deleteAsset');
	df.innerHTML = ''; keepF.forEach(e => df.appendChild(e));
	const more = document.createElement('details'); more.className = 'more816';
	more.innerHTML = `<summary class="btn">More ▾</summary><div class="mm816" role="menu"></div>`;
	const mm = more.querySelector('.mm816'); moreF.forEach(e => { e.classList.remove('primary'); mm.appendChild(e); });
	if (!a._cancelled) mm.insertAdjacentHTML('beforeend', `${nextDayOf(key) ? `<button type="button" class="btn editonly" data-nextday="${esc(key)}">Move the delivery to the next day</button>` : ''}<button type="button" class="btn editonly" data-cancelk="${esc(key)}">Cancel ${esc(key)}</button>`);
	if (del) { del.classList.add('editonly'); mm.appendChild(del); }
	df.appendChild(more);
	/* 10. wiring for the new parts; everything moved keeps the handler openAssetDraw gave it */
	wire816(dr, a);
}
function wire816(dr, a){
	const key = a.key, calm = motion816Off;
	dr.querySelectorAll('[data-chg816]').forEach(b => b.onclick = () => { const p = dr.querySelector('[data-chgp816="' + b.dataset.chg816 + '"]'); if (!p) return;
		if (!p.hidden) { p.hidden = true; b.setAttribute('aria-expanded', 'false'); return; }
		if (!mayWrite(b.dataset.chg816 === 'where' ? 'where it goes' : 'the dates')) return;
		p.hidden = false; b.setAttribute('aria-expanded', 'true'); if (!calm() && p.animate) p.animate([{opacity: 0, transform: 'translateY(-6px)'}, {opacity: 1, transform: 'none'}], {duration: 240, easing: 'ease-out'});
		const f = p.querySelector('input, select'); if (f) try { f.focus({preventScroll: true}); } catch (e) {} });
	dr.querySelectorAll('[data-ph816]').forEach(b => b.onclick = () => window.open(b.dataset.ph816, '_blank', 'noopener'));
	const pin = dr.querySelector('#ph816in');
	if (pin) pin.onchange = async () => { const f = pin.files && pin.files[0]; pin.value = ''; if (!f) return;
		const slot = Number((dr.querySelector('#ph816slot') || {}).value || 0), unit = (dr.querySelector('#ph816unit') || {}).value || (dropPhotoUnits(a)[0] || '');
		const msg = w => { const m = $('#ph816msg'); if (m) m.textContent = w; flash(w); };
		await dropPhotoAdd(key, slot, f, msg, unit); };
	dr.querySelectorAll('details.f816').forEach(d => {
		const s = d.querySelector(':scope > summary'), b = d.querySelector(':scope > .fb816'); if (!s || !b) return;
		s.onclick = e => { e.preventDefault();
			if (d.open) { F816.open.delete(d.dataset.f816);
				if (calm() || !b.animate) { d.open = false; return; }
				d.classList.add('closing'); const an = b.animate([{height: b.offsetHeight + 'px', opacity: 1}, {height: '0px', opacity: 0}], {duration: 200, easing: 'ease-in'});
				an.onfinish = () => { d.open = false; d.classList.remove('closing'); }; return; }
			d.open = true; F816.open.add(d.dataset.f816);
			if (!calm() && b.animate) b.animate([{height: '0px', opacity: 0, transform: 'translateY(-6px)'}, {height: b.scrollHeight + 'px', opacity: 1, transform: 'none'}], {duration: 280, easing: 'cubic-bezier(.2,.7,.2,1)'}); };
	});
	const mr = dr.querySelector('details.more816');
	if (mr) mr.addEventListener('toggle', () => { if (mr.open) { const f = mr.querySelector('.mm816 a, .mm816 button'); if (f) try { f.focus({preventScroll: true}); } catch (e) {} } });
}
function motion816Off(){ return motionOff816(); }
/* the driver's card names the one destination when the plan or a pin has it, not "nothing on the drawings" */
function driverPos816(a){
	let D = null; try { D = dest782(a); } catch (e) { D = null; }
	if (D && D.kind === 'report') return {tone: 'gap', kick: 'Drop position · no drop-off yet', head: 'Report to the pit lane', say: 'No drop-off is set for this one yet: the driver reports to the pit lane and site directs them. Navigate goes to the pit lane.'};
	if (!D || D.kind === 'area') return null;
	const w = srcWords816(a, D);
	return D.kind === 'pinned' || D.kind === 'confirmed'
		? {tone: 'good', kick: 'Drop position · ' + w, head: 'Where it goes - ' + w, say: 'Navigate goes to this spot. Confirm with the supervisor on arrival.'}
		: {tone: 'plan', kick: 'Drop position · ' + w, head: 'Where the ' + w + ' puts it', say: 'Navigate goes to this spot - the plan\'s position, not a GPS fix. Confirm the exact spot with the supervisor before you set it down.'};
}
