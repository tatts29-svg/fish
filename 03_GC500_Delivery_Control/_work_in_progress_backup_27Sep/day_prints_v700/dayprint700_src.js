/* v7.00 - THE DAY ON PAPER, TWICE: ONE FOR THE DRIVER, ONE FOR THE INSTALLERS.
 The project manager, 27 Sep 2026: a print option for the day - one the branch prints for the drivers and one he prints
 for the install team on site - professional, one page per load, high detail, lots of pictures, the reference code as
 the main feature, the pinned location. Then: no sign-off; a JSEA before any unloading on every load; the SWMS as QR
 codes (drivers: loading and unloading, buildings and toilets where they are on the truck, G-Link only where the record
 puts the work in the light rail corridor; installers: buildings and toilets only, and the HSEQ plan for both).

 ONE PAGE PER LOAD. A load is a truck. The schedule says two references share a truck when their rows carry the same
 load time and the same carrier; the transport plan says it when a load names them as candidates. Where neither says
 so, each reference gets its own page and the page says why - no load is assumed.

 NOTHING INVENTED. Every word is read from the record: the schedule rows, the master plan positions, the phone pins,
 the site and driver rules, the team, the document register. Where the record holds no value the page prints a ruled
 line to write it on. The QR codes are drawn by the page's own encoder (qrcode-generator, inline) and point only at
 the public view link - never the token this browser was opened with. */
const DP_DOC = {
 drv: {id: 'GC500-DRV-01', kick: 'DRIVER DELIVERY SHEET', what: 'Driver sheet'},
 ins: {id: 'GC500-INS-01', kick: 'INSTALLER SHEET · COATES INSTALLS', what: 'Installer sheet'},
};
const DP_VIEW_SLUG = 'Coates-GC500-2026';
const DP_HOST = 'https://gc500-production.up.railway.app';
function dpT(t){
 const s = String(t == null ? '' : t).trim();
 let m = s.match(/^(\d{1,2})[:.](\d{2})$/); if (m && +m[1] < 24 && +m[2] < 60) return m[1].padStart(2, '0') + ':' + m[2];
 m = s.match(/^(\d{1,2})(\d{2})$/); if (m && +m[1] < 24 && +m[2] < 60) return m[1].padStart(2, '0') + ':' + m[2];
 return null;
}
const dpUniq = xs => [...new Set(xs.filter(x => x != null && String(x).trim() !== '').map(x => String(x).trim()))];
function dpWr(cls){ return `<span class="dp-wr${cls ? ' ' + cls : ''}" aria-label="space to write it in"></span>`; }
function dpBx(){ return '<i class="dp-bx"></i>'; }
/* ---------- the day's three prints on the Timeline's day card: the pre-start, the drivers', the install team's.
 The pre-start is the v6.97 one (ps7Print), ready once the Sunday or Wednesday batch that fills the day has arrived;
 before that it says when it will be; on a day gone by it is not offered here (the signed sheet is on Pre-starts). */
function dpDayButtons(d){
 let ps = null; try { const pd = ps7Day(d.iso); ps = pd ? ps7State(pd) : null; } catch (e) { ps = null; }
 let pre = '';
 if (ps && ps.state === 'ready') pre = `<button class="btn" type="button" data-print-ps7="${esc(d.iso)}" title="The Coates Installs daily pre-start for this day, prefilled from the record — one A4 page">Daily pre-start</button>`;
 else if (ps && ps.state === 'later') { const w = 'Prefilled automatically on ' + ps7Words(ps.batch);
  pre = `<button class="btn dp-off" type="button" aria-disabled="true" data-ps7-later="${esc(w)}" title="${esc(w)}">Daily pre-start</button>`; }
 return `<span class="dayprints" role="group" aria-label="Prints for this day"><span class="dayprints-l">Print for the day</span>${pre}
 <button class="btn" type="button" data-print-drv="${esc(d.iso)}" title="A Coates driver sheet for each truck load on this day, one A4 page per load: the reference, what is on the truck, the pinned location with a QR to navigate, the pictures, the JSEA and the SWMS. For the branch to print for the drivers.">Delivery drivers</button>
 <button class="btn" type="button" data-print-ins="${esc(d.iso)}" title="A Coates installer sheet for each truck load on this day, one A4 page per load: what it is and its accessories, exactly where it goes, the pictures, the checklist and the SWMS. For the install team on site.">Install team</button></span>`;
}
/* ---------- the loads: what shares a truck, and on whose word */
function dpLoads(d){
 const out = [];
 ['deliveries', 'removals'].forEach(kind => {
  const keyed = new Map(), plan = new Map();
  (d[kind] || []).slice().sort(etaSort).forEach(r => {
   const evs = r.events || [];
   const ev = evs.find(e => dpT(e.load_time) && String(e.carrier || '').trim());
   if (ev) {
    const t = dpT(ev.load_time), c = String(ev.carrier).trim(), k = t + '|' + c.toUpperCase();
    if (!keyed.has(k)) { const g = {kind, rows: [], time: t, timeRaw: String(ev.load_time), carrier: c, basis: 'load'}; keyed.set(k, g); out.push(g); }
    keyed.get(k).rows.push(r); return;
   }
   const pl = (d.loads || []).find(l => (l.candidate_refs || l.refs || []).map(String).includes(String(r.a.key)));
   if (pl) {
    const k = String(pl.n != null ? pl.n : (d.loads || []).indexOf(pl));
    if (!plan.has(k)) { const t = dpT(pl.load_time_24h || pl.time_24h || pl.time);
     const g = {kind, rows: [], time: t, timeRaw: String(pl.time_as_written || pl.time || ''), carrier: '', basis: 'plan', plan: pl}; plan.set(k, g); out.push(g); }
    plan.get(k).rows.push(r); return;
   }
   const t = evs.map(e => dpT(e.load_time)).find(Boolean) || null;
   out.push({kind, rows: [r], time: t, timeRaw: t ? String((evs.find(e => dpT(e.load_time)) || {}).load_time) : '',
    carrier: dpUniq(evs.map(e => e.carrier)).join(' / '), basis: 'ref'});
  });
 });
 const rank = g => (g.kind === 'removals' ? 1e5 : 0) + (g.time ? +g.time.replace(':', '') : 9999);
 return out.map((g, i) => ({g, i})).sort((x, y) => rank(x.g) - rank(y.g) || x.i - y.i).map(x => x.g);
}
function dpBasis(g){
 const n = g.rows.length;
 if (g.basis === 'load') return {head: n > 1 ? `One truck · ${n} references` : 'One truck · one reference',
  why: `Same load time (${g.timeRaw}) and carrier (${g.carrier}) on the schedule${n > 1 ? ', so these travel together' : '; nothing else on this day shares them'}.`};
 if (g.basis === 'plan') return {head: n > 1 ? `One truck · ${n} references` : 'One truck · one reference',
  why: `Load ${g.plan.n != null ? g.plan.n : ''} on the carrier's transport plan names ${n > 1 ? 'these references' : 'this reference'} as its candidate${n > 1 ? 's' : ''}.`};
 const e = g.rows[0].events || [];
 return {head: 'One reference',
  why: g.carrier && !g.time ? `The schedule names the carrier (${g.carrier}) but no load time, so no shared truck is assumed. Check with the branch.`
   : g.time && !g.carrier ? 'The schedule gives a load time but no carrier, so no shared truck is assumed.'
   : e.length ? 'The schedule gives no load time or carrier for this row, so it has its own page. Check the truck with the branch.'
   : 'No load is recorded for this reference.'};
}
/* ---------- what it is */
function dpNums(a){
 const nums = (a.asset_numbers || []).filter(x => String(x).toUpperCase() !== 'MISCITEM');
 const off = new Set((a._numbersTakenOff || []).map(String));
 let hire = [];
 try { hire = machinesOnHire(a.key, null).filter(x => !isMiscRow(x) && x.asset_no_is_plant_number !== false).map(x => x.asset_no)
  .filter(x => x && String(x).toUpperCase() !== 'MISCITEM' && !off.has(String(x))); } catch (e) { hire = []; }
 return dpUniq(nums.concat(hire));
}
function dpItems(r){
 const a = r.a, evs = r.events || [];
 const rows = evs.map(e => ({item: e.item || '', qty: e.quantity_display && e.quantity_display !== 'blank' ? String(e.quantity_display) : ''})).filter(x => x.item || x.qty);
 const seen = new Set(), out = [];
 rows.forEach(x => { const k = x.item + '|' + x.qty; if (!seen.has(k)) { seen.add(k); out.push(x); } });
 if (!out.length) (a.item_types || []).forEach(t => out.push({item: t, qty: ''}));
 return out;
}
function dpItemsHtml(r){
 const its = dpItems(r);
 if (!its.length) return `<span class="dp-none">not on the schedule</span>${dpWr()}`;
 return its.map(x => `<b>${x.qty ? esc(x.qty) + ' × ' : ''}${esc(x.item || (r.a.item_types || []).join(', '))}</b>${x.qty ? '' : ' <span class="dp-sm" style="display:inline">no quantity on the schedule</span>'}`).join('<br>');
}
function dpAcc(a){ return (a.accessories || []).map(x => ({t: x.as_written || x.type || '', q: x.qty_stated && x.qty > 1 ? x.qty : (x.qty > 1 ? x.qty : 1), no: x.asset_no || ''})).filter(x => x.t); }
function dpNotes(r){
 const a = r.a;
 const acc = new Set(dpAcc(a).map(x => x.t.toLowerCase()));
 return dpUniq([].concat(a.asset_notes || [], a.unparsed_notes || [], (r.events || []).map(e => e.note)))
  .filter(n => !acc.has(n.toLowerCase()) && !String(n).split(/\s*,\s*/).every(p => acc.has(p.toLowerCase())));
}
function dpNumsHtml(a, compact){
 const n = dpNums(a);
 if (n.length) return n.map(x => `<span class="dp-num">${esc(x)}</span>`).join('');
 const sub = ((rentalOf(a.key) || {}).subhires || []).length;
 if (compact) return `<span class="dp-none">${sub ? 'subhired — no Coates number' : 'none recorded'} — write it:</span> <span class="dp-wr dp-in" style="width:30mm"></span>`;
 return `<span class="dp-none">${sub ? 'subhired — no Coates asset number' : 'no asset number recorded'}</span>${dpWr()}<span class="dp-sm">write the number that turns up</span>`;
}
/* ---------- where it is: a phone pin first, then the master plan, then the drawing */
function dpRealPin(a){
 let best = null;
 Object.entries((typeof S !== 'undefined' && S.fixes) || {}).forEach(([k, f]) => {
  if (!f || f.lat == null || f.lon == null || f.master || /master plan/i.test(String(f.by || ''))) return;
  if (fixParse(k).ref !== a.key) return;
  const ta = String(f.at || ''), tb = best ? String(best.f.at || '') : '';
  if (!best || ta > tb || (ta === tb && (f.acc == null ? 1e9 : f.acc) < (best.f.acc == null ? 1e9 : best.f.acc))) best = {k, f};
 });
 return best;
}
function dpInFrame(p){ return !!p && Number.isFinite(p.ax) && Number.isFinite(p.ay) && p.ax >= 0 && p.ax <= 1 && p.ay >= 0 && p.ay <= 1; }
function dpPos(a){
 const fr = (lat, lon) => { const p = frameOf(lat, lon); return dpInFrame(p) ? {ax: p.ax, ay: p.ay} : null; };
 const pin = dpRealPin(a);
 if (pin) { const f = pin.f, p = dpInFrame(f) ? {ax: f.ax, ay: f.ay} : fr(f.lat, f.lon);
  return {kind: 'pin', lat: f.lat, lon: f.lon, pt: p, by: f.by, at: f.at, acc: f.acc, took: f.took, key: pin.k}; }
 const m = masterLoc(a.key);
 if (m && m.ll) return {kind: m.prec === 'unit' ? 'master' : 'area', lat: m.ll[0], lon: m.ll[1], pt: fr(m.ll[0], m.ll[1]), how: m.how};
 let t = null; try { t = navTargetFor(a); } catch (e) { t = null; }
 if (t && t.ll) {
  if (t.placed) return {kind: 'placed', lat: t.ll.lat, lon: t.ll.lon, pt: fr(t.ll.lat, t.ll.lon), place: t.place};
  const p = aerialPointFor(a);
  return {kind: 'drawing', lat: t.ll.lat, lon: t.ll.lon, pt: dpInFrame(p) ? {ax: p.ax, ay: p.ay} : null, label: p && p.label, sheet: p && p.sheet && p.sheet.sheet_id};
 }
 return {kind: 'none'};
}
function dpPosWords(a, P){
 const ll = P.lat != null ? P.lat.toFixed(6) + ', ' + P.lon.toFixed(6) : '';
 const stamp = at => { try { return brisStamp(at) || fmtStamp(at); } catch (e) { return fmtStamp(at); } };
 if (P.kind === 'pin') {
  let q = ''; try { q = fixQuality(P.acc).word; } catch (e) { q = ''; }
  return {label: 'Pinned on site', ll, says: `Phone pin by ${P.by || 'a person not named'}${P.at ? ', ' + stamp(P.at) : ''}${q ? ' · ' + q : ''}${P.key && P.key !== a.key ? ' · on asset ' + fixParse(P.key).unit : ''}.`};
 }
 if (P.kind === 'master') return {label: 'Master-plan position', ll, says: `Not a phone pin — read off master plan D001-26003-03 (${P.how}). Confirm the exact spot on site.`};
 if (P.kind === 'area') return {label: 'Master-plan area', ll, says: `The area only — master plan D001-26003-03 (${P.how}). Confirm the spot on site.`};
 if (P.kind === 'placed') return {label: 'Placed on the map', ll, says: `Placed by ${(P.place && P.place.by) || 'a person not named'} — nobody has pinned it standing there yet.`};
 if (P.kind === 'drawing') return {label: 'Planned area', ll, says: `From the callout on the drawing over the aerial — the planned area, not a GPS fix.`};
 return {label: 'No position recorded', ll: '', says: 'Nothing in the record puts this on the ground. Ring the supervisor before you leave the yard.'};
}
function dpNavQr(P){ return P.lat != null ? qrSvg(navUrl({lat: P.lat, lon: P.lon}), 3) : ''; }
function dpSheetPt(a){
 let sh = null; try { sh = mapSheetFor(a); } catch (e) { sh = null; }
 if (!sh) return null;
 const link = (a.drawing_links || [])[0];
 const mk = (sh.markers || []).find(m => (m.keys || []).includes(a.key)) || (sh.markers || []).find(m => link && String(m.label) === String(link.label));
 if (!(mk && (sh.px || [])[0] > 0 && Number.isFinite(mk.fx) && Number.isFinite(mk.fy))) return null;
 return {sh, mk, label: link && link.label ? String(link.label) : a.key, sheet: (link && link.sheet) || sh.sheet_id || sh.key};
}
function dpLightRail(r){
 const a = r.a, m = masterLoc(a.key) || {};
 const words = [a.name, a.product].concat(a.locations || [], a.asset_notes || [], a.unparsed_notes || [], (r.events || []).map(e => e.note),
  m.near || [], m.next || [], m.beside || [], [m.sec, m.how]).filter(Boolean).join(' ');
 return /light\s*rail|g-?link|\btram\b/i.test(words);
}
/* ---------- the documents: the SWMS as the register holds them, opened from the public view link only */
function dpViewBase(){
 let s = null; try { s = shareBase(); } catch (e) { s = null; }
 const m = s && s.shared && String(s.url).match(/^(https?:\/\/[^/]+)\/v\/([A-Za-z0-9_-]+)\/?$/);
 if (m) return {origin: m[1], slug: m[2]};
 const origin = /^https?:$/.test(location.protocol) ? location.origin : DP_HOST;
 return {origin, slug: DP_VIEW_SLUG};
}
/* the documents by their id on the register - three of the driver's four are filed as transport procedures, not SWMS */
const DP_DOC_IDS = {
 unload: 'GC500_SWMS_-_Loading_and_Unloading_at_Third_Party_Sites.pdf',
 transport: 'Safe_Transport_of_Portable_Buildings.pdf',
 pretransit: 'Site_Accommodation_Pre-Transit_Checklist_Work_Instruction.pdf',
 hs81: 'HS_81_Portable_Buildings_-_Guidance_Sheet_for_Lifting_Portable_Buildings.pdf',
 pbt: 'GC500_SWMS_-_Portable_Buildings_and_Toilets.pdf',
 glink: 'GC500_High_Risk_Work_-_G-Link_Light_Rail.pdf',
 hseq: 'GC500_HSEQ_Management_Plan.pdf',
};
function dpDocById(k){ return ((DATA.docs || {}).docs || []).find(d => d.id === DP_DOC_IDS[k]) || null; }
function dpDocRef(d){ return String(d.doc_ref || '').split(' · ')[0].replace(/-\s+x\s+/, '-x ').replace(/\s+v\d+(\.\d+)*$/, '').trim(); }
function dpDocs(g, doc){
 const has = re => g.rows.some(r => re.test([r.a.discipline, r.a.product, r.a.name].concat(r.a.item_types || []).join(' ')));
 /* site accommodation: a portable building, or a toilet block (not a portaloo) */
 const accom = has(/portable building|\bbuilding\b|ticket box|container|toilet block|pan block/i);
 const out = [], add = (d, why) => { if (d && !out.some(x => x.d === d)) out.push({d, why}); };
 if (doc === 'drv') {
  add(dpDocById('unload'), g.kind === 'removals' ? 'loading on site — every load' : 'unloading on site — every load');
  if (accom) {
   add(dpDocById('transport'), 'moving site accommodation');
   add(dpDocById('pretransit'), 'before this building moves');
   add(dpDocById('hs81'), 'lifting a portable building');
  }
  const lr = g.rows.filter(dpLightRail).map(r => r.a.key);
  if (lr.length) add(dpDocById('glink'), 'the record puts ' + lr.join(', ') + ' in the light rail corridor');
 } else {
  add(dpDocById('pbt'), 'the install crew’s SWMS');
  add(dpDocById('unload'), g.kind === 'removals' ? 'loading the truck on site' : 'unloading the truck on site');
  add(dpDocById('hseq'), 'general reference');
 }
 const v = dpViewBase(), hosted = !!(typeof SYNC !== 'undefined' && SYNC.backend && SYNC.backend.files);
 return out.map(({d, why}) => {
  const listed = !(hosted && DOCS.state === 'ready' && DOCS.files && !DOCS.files[d.id]);
  const url = listed ? v.origin + '/f/' + encodeURIComponent(v.slug) + '/' + encodeURIComponent(d.id) : v.origin + '/v/' + encodeURIComponent(v.slug) + '#docs';
  return {d, why, url, listed, ref: dpDocRef(d), title: String(d.title || d.name || d.id).replace(/\s+—\s+(SWMS|high risk work risk assessment)$/i, ''), pages: d.pages || null};
 });
}
function dpDocsHtml(g, doc){
 const L = dpDocs(g, doc);
 if (!L.length) return '<p class="dp-docnote">No SWMS is in the document register for this work — ring the supervisor before you start.</p>';
 return `<div class="dp-docs">${L.map(x => `<div class="dp-doc"><div class="dp-qr">${qrSvg(x.url, 3)}<span>scan</span></div>
 <div class="dp-doc-t"><b>${esc(x.ref || 'SWMS')}</b>${esc(x.title)}${x.pages ? ' · ' + esc(x.pages) + (x.pages === 1 ? ' page' : ' pages') : ''}<i>${esc(x.why)}</i>${
  x.listed ? '' : '<span class="dp-sm">Not on the shared record yet — the code opens the Documents page. Ask the site supervisor.</span>'}</div></div>`).join('')}</div>`;
}
/* ---------- the pictures */
function dpMasterImgs(a){
 const m = masterLoc(a.key); const M = DATA.media || {};
 if (!m || (m.img || []).length !== 2 || typeof M[m.img[0]] !== 'string') return [];
 return [{src: M[m.img[0]], cap: 'Master plan D001 — close up, about 80 m across', key: 'mclose'},
  {src: M[m.img[1]], cap: 'Master plan D001 — the area, about 370 m across', key: 'mwide'}];
}
function dpFig(inner, cap, tag, cls){ return `<figure class="dp-fig${cls ? ' ' + cls : ''}">${inner}<figcaption>${tag ? '<b>' + esc(tag) + '</b>' : ''}${esc(cap)}</figcaption></figure>`; }
function dpAirFig(pts, f, cap, tag, small){
 if (!pts.length || !DATA.aerial_hi) return '';
 return dpFig(`<div class="dp-win dp-air" data-pts="${esc(JSON.stringify(pts))}" data-f="${f}"${small ? ' data-sm="1"' : ''}><img alt=""></div>`, cap, tag);
}
function dpImgFig(src, cap, tag, contain){ return dpFig(`<div class="dp-win dp-img${contain ? ' dp-fitc' : ''}"><img src="${esc(src)}" alt="" decoding="async"></div>`, cap, tag); }
function dpSheetFig(a, tag){
 const s = dpSheetPt(a); if (!s) return '';
 return dpFig(`<div class="dp-win dp-sheet" data-sheet="${esc(s.sh.key)}" data-fx="${s.mk.fx}" data-fy="${s.mk.fy}" data-f="0.17"><img alt=""><b class="dp-tag dp-o">callout ${esc(s.label)}</b></div>`,
  `Drawing ${s.sheet} — callout ${s.label} as iEDM drew it`, tag);
}
function dpStockFig(a, tag){
 let pp = null; try { pp = productPhoto(a); } catch (e) { pp = null; }
 return pp && typeof pp.src === 'string' ? dpImgFig(pp.src, (pp.kind === 'made' ? 'Drawing of the product — ' : 'What it looks like (stock photo) — ') + (pp.says || 'this product'), tag, true) : '';
}
function dpShotFigs(a, tag){
 let list = []; try { list = dropPhotosOf(a.key); } catch (e) { list = []; }
 return list.map(ph => ({ph, r: photoFor(ph)})).filter(x => x.r.state === 'ready').slice(0, 2)
  .map(x => dpImgFig(x.r.thumb || x.r.url, 'On site — photo on the record' + (x.ph.at ? ', ' + fmtStamp(x.ph.at) : ''), tag, false));
}
function dpPics(g, doc, posOf){
 const rows = g.rows, figs = [];
 const pt = r => { const P = posOf(r.a); return P.pt ? [P.pt.ax, P.pt.ay, r.a.key] : null; };
 const ringWord = r => { const P = posOf(r.a); return P.kind === 'pin' ? 'ring = phone pin' : P.kind === 'master' ? 'ring = master-plan position' : P.kind === 'none' ? '' : 'ring = planned area'; };
 if (rows.length === 1) {
  const r = rows[0], a = r.a, p = pt(r), M = dpMasterImgs(a), rw = ringWord(r);
  const air = (f, cap, sm) => p ? dpAirFig([p], f, cap + (rw ? ' · ' + rw : ''), a.key, sm) : '';
  const Pr = (h, pr) => h ? h.replace('<figure class="dp-fig', `<figure data-pr="${pr}" class="dp-fig`) : '';
  if (doc === 'drv') {
   figs.push(Pr(air(1, 'The whole site — which end you are going to', true), 5), Pr(air(0.22, 'Wide — find it from the road'), 3), Pr(air(0.05, 'Close — the spot'), 1));
   M.forEach((x, j) => figs.push(Pr(dpImgFig(x.src, x.cap, a.key), j ? 6 : 2)));
   figs.push(Pr(dpSheetFig(a, a.key), 7), ...dpShotFigs(a, a.key).map(h => Pr(h, 4)), Pr(dpStockFig(a, a.key), 4.5));
  } else {
   M.forEach((x, j) => figs.push(Pr(dpImgFig(x.src, x.cap, a.key), j ? 3 : 1)));
   figs.push(Pr(air(0.05, 'Aerial close — the spot'), 2), Pr(air(0.16, 'Aerial — the compound around it'), 5), Pr(dpSheetFig(a, a.key), 6), ...dpShotFigs(a, a.key).map(h => Pr(h, 4)), Pr(dpStockFig(a, a.key), 4.5));
  }
 } else {
  const Pr = (h, pr) => h ? h.replace('<figure class="dp-fig', `<figure data-pr="${pr}" class="dp-fig`) : '';
  const all = rows.map(pt).filter(Boolean);
  if (all.length > 1) figs.push(Pr(dpAirFig(all, 0, 'All the drops on this load — ' + all.map(x => x[2]).join(', '), 'LOAD'), 1));
  rows.forEach(r => { const a = r.a, p = pt(r), M = dpMasterImgs(a);
   if (M.length) figs.push(Pr(dpImgFig(M[0].src, M[0].cap.replace(', about 80 m across', ''), a.key), 2));
   if (p) figs.push(Pr(dpAirFig([p], 0.05, 'Aerial close · ' + ringWord(r), a.key), 3));
   if (!M.length && !p) { const s = dpSheetFig(a, a.key); if (s) figs.push(Pr(s, 2.5)); }
  });
 }
 const F = figs.filter(Boolean).slice(0, 10);
 if (!F.length) return `<div class="dp-pics" style="--c:1"><figure class="dp-fig"><div class="dp-win"><span class="dp-miss">No picture of this location is held in the record. Ring the supervisor for the exact spot.</span></div><figcaption>No picture held</figcaption></figure></div>`;
 const n = F.length, c = n <= 3 ? n : n === 4 ? 2 : n <= 6 ? 3 : 4;
 return `<div class="dp-pics" style="--c:${c}">${F.join('')}</div>`;
}
/* ---------- the page furniture */
function dpHeader(d, g, doc, i, n){
 const D = DP_DOC[doc], col = g.kind === 'removals';
 const word = doc === 'drv' ? (col ? 'Collection' : 'Delivery') : (col ? 'Removal' : 'Install');
 return `<header class="dp-hd"><div class="dp-hd-l"><b>Coates</b><span>INDUSTRIAL SOLUTIONS</span></div>
 <div class="dp-hd-m"><span class="dp-kick">${esc(D.kick)} · GC500 2026</span><h1>${esc(word)} — ${esc(fmtDate(d.iso))}</h1></div>
 <div class="dp-hd-r"><b>${esc(D.id)}</b>${esc(DATA.event.name || 'Gold Coast 500')}<br><span class="dp-lx">LOAD ${i} OF ${n}</span></div></header>`;
}
function dpHero(g, doc){
 const rows = g.rows, n = rows.length, hs = n === 1 ? 80 : n === 2 ? 50 : n === 3 ? 38 : n <= 5 ? 30 : 24;
 const col = g.kind === 'removals';
 const lab = doc === 'drv' ? (col ? 'Collect' : 'Deliver to') : (col ? 'Remove' : 'Install at');
 return `<div class="dp-refs" style="--hs:${hs}pt">${rows.map(r => `<div class="dp-ref"><i>${esc(lab)}</i><b>${esc(r.a.key)}</b>
 <span>${esc(r.a.name || r.a.product || '')}</span><em>${esc(dpItems(r).map(x => (x.qty ? x.qty + ' × ' : '') + x.item).join(' · ') || (r.a.item_types || []).join(', '))}</em></div>`).join('')}</div>`;
}
function dpFacts(d, g, doc){
 const B = dpBasis(g), col = g.kind === 'removals';
 const eta = dpUniq(g.rows.map(r => (deliveryOf(r.a.key) || {}).eta)).join(' / ');
 const arr = (DATA.transport || {}).arrival || {};
 const time = g.time ? `<b>${esc(g.time)}</b><span>${g.basis === 'plan' ? 'load time on the transport plan' : 'load time at Kingston · schedule writes ' + esc(g.timeRaw)}</span>`
  : eta ? `<b>${esc(eta)}</b><span>planned on site — no load time on the schedule</span>` : `${dpWr()}<span>no load time on the schedule</span>`;
 const carrier = g.carrier ? `<b>${esc(g.carrier)}</b><span>as the schedule writes it</span>` : `${dpWr()}<span>no carrier on the schedule</span>`;
 return `<div class="dp-facts">
 <div class="dp-fact"><label>${col ? 'Collection date' : 'Delivery date'}</label><b>${esc(fmtDate(d.iso))}</b><span>${esc(d.sheet ? d.sheet + ' · ' + d.phase : 'no programme sheet covers this day')}</span></div>
 <div class="dp-fact"><label>${doc === 'drv' ? 'Load time' : 'Truck leaves Kingston'}</label>${time}</div>
 <div class="dp-fact"><label>Carrier</label>${carrier}</div>
 <div class="dp-fact"><label>On site</label><b>${esc(arr.after ? 'after ' + arr.after : (DATA.site || {}).hours || '')}</b><span>${esc((DATA.site || {}).hours ? 'site hours ' + DATA.site.hours + ' ' + (DATA.site.hours_days || '') : '')}</span></div>
 <div class="dp-fact dp-wide"><label>This page is</label><b>${esc(B.head)}</b><span>${esc(B.why)}</span></div>
 </div>`;
}
/* the JSEA is the driver's own, done before the truck is unloaded (or loaded, on a collection); the installer sheet carries
   none. The Take 5 is on both: before every new task. */
function dpSafe(g, doc){
 const col = g.kind === 'removals';
 const t5 = `<div class="dp-t5"><b>TAKE 5<br>EVERY TASK</b><p><b>Take 5 before every new task: stop, look, assess, control, then proceed.</b> Do it again whenever the job or the conditions change — a new unit, a new position, a new crew member, the weather, the public.</p></div>`;
 if (doc !== 'drv') return `<div class="dp-safe">${t5}</div>`;
 return `<div class="dp-safe"><div class="dp-jsea"><b>JSEA<br>REQUIRED</b><p><b>The driver must complete a Job Safety and Environmental Analysis (JSEA) before ${col ? 'loading' : 'unloading'}.</b> This applies to every load. No JSEA, no ${col ? 'load' : 'unload'}.</p></div>${t5}</div>`;
}
/* the Coates Life Saving Rules, word for word and in the card's colours, as the crew's pre-start carries them */
function dpLife(){
 const L = (typeof PS7 !== 'undefined' && PS7.life) || [];
 if (!L.length) return '';
 return `<div class="dp-lsr"><div class="dp-lsr-h"><b>COATES LIFE SAVING RULES</b><span>Read and followed on every task, by every person on this load.</span></div>
 <div class="dp-lsr-g">${L.map(([n, c, w]) => `<div class="dp-lsrow"><span class="dp-lsrn ${esc(c)}">${esc(n)}</span><span class="dp-lsrt">${esc(w)}</span></div>`).join('')}</div></div>`;
}
function dpContacts(doc){
 const P = ((typeof TEAM !== 'undefined' && TEAM.people) || (DATA.team || {}).people || []);
 const tel = p => p.mobile || p.phone;
 const rows = [];
 P.filter(p => tel(p) && (p.group === 'site' || p.lead)).forEach(p => rows.push({role: 'Coates · ' + (p.event_role || 'site'), name: p.name, tel: tel(p)}));
 if (doc === 'ins') P.filter(p => tel(p) && p.group === 'install').forEach(p => rows.push({role: 'Installer', name: p.name, tel: tel(p)}));
 else P.filter(p => (p.phone || p.mobile) && p.group === 'office').slice(0, 1).forEach(p => rows.push({role: 'Coates office', name: p.name, tel: p.phone || p.mobile}));
 ((DATA.site || {}).contacts || []).filter(c => c.phone).forEach(c => rows.push({role: 'iEDM · ' + c.role, name: c.name, tel: c.phone}));
 return `<div class="dp-ring2"><b>Anything wrong — ring, do not guess:</b>${rows.map(c => `<span><i>${esc(c.role)}</i> ${esc(c.name)} <span class="dp-tel">${esc(c.tel)}</span></span>`).join('')}
 <span class="dp-000"><i>Emergency</i> <span class="dp-tel">000</span></span></div>`;
}
function dpFoot(g, doc, i, n){
 let asOf = ''; try { asOf = recordsAsOf(); } catch (e) { asOf = fmtDate(todayIso()); }
 return `<footer class="dp-ft"><span><b>${esc(DATA.brand.org || 'Coates Industrial Solutions')} · GC500 2026 · Author: ${esc(DATA.brand.author || 'Andrew Fisher')}</b> ·
 ${esc(DP_DOC[doc].id)} · record as at ${esc(asOf)} · dataset ${esc(String(DATA.dataset_sha256 || '').slice(0, 12))} · a ruled line is a value nobody has recorded yet — never a guess</span>
 <span>Load ${i} of ${n} · page ${i} of ${n}</span></footer>`;
}
/* ---------- the driver's page */
function dpWay(g, posOf){
 const acc = DATA.access || {}, rules = DATA.driver_rules || {}, site = DATA.site || {};
 const gate = heavyGate(), first = g.rows[0], P = posOf(first.a);
 const steps = [];
 steps.push('<b>Come over the Sundale Bridge</b> — the way in for trucks on this job.');
 if (gate) steps.push(`<b>Heavy vehicles in at:</b> ${esc(tidyNote(gate.text))}${gate.gate ? ' (gate ' + esc(gate.gate) + ' on D001)' : ''}.`);
 if (rules.escort) steps.push(`<b>${esc(rules.escort)}</b> Pull up at the gate and wait for the escort.`);
 if (gate && P.pt && gate.ax != null) { const b = bearingBetween(gate.ax, gate.ay, P.pt.ax, P.pt.ay);
  if (b) steps.push(`From that gate ${g.rows.length > 1 ? 'the first drop (' + esc(first.a.key) + ') is' : 'it is'} to the <b>${esc(b.compass)}</b>${b.metres != null ? ', about ' + esc(fmtMetres(b.metres)) + ' in a straight line' : ''}.`); }
 let run = null; try { run = P.lat != null ? depotRun({lat: P.lat, lon: P.lon}) : null; } catch (e) { run = null; }
 return `<div class="dp-way"><div class="dp-addr">${esc(site.address || DATA.event.address || '')}</div>
 ${run ? `<span class="dp-sm">From ${esc(DATA.depot.name)}: ${esc(run.text)} — a planning figure, not a live time.</span>` : ''}
 <ol>${steps.map(s => '<li>' + s + '</li>').join('')}</ol>
 ${g.rows.map(r => { const w = whereText(r.a);
  return `<div class="dp-spot"><b class="dp-big">${esc(r.a.key)} goes at: ${esc(w.main || '')}</b>${w.main ? '' : '<span class="dp-sm">' + esc(w.w.fallback) + '</span>'}${
   w.also ? `<span class="dp-sm">${esc(w.also)}</span>` : ''}</div>`; }).join('')}</div>`;
}
function dpPosBoxes(g, posOf){
 const n = g.rows.length;
 return `<div class="dp-poss n${Math.min(n, 3)}">${g.rows.map(r => { const P = posOf(r.a), W = dpPosWords(r.a, P), q = dpNavQr(P);
  return `<div class="dp-pos">${q ? `<div class="dp-qr">${q}<span>scan to navigate</span></div>` : ''}<div class="dp-pos-t">
  ${n > 1 ? `<span class="dp-rk2">${esc(r.a.key)}</span>` : ''}<label>${esc(W.label)}</label>${W.ll ? `<span class="dp-ll">${esc(W.ll)}</span>` : dpWr()}
  <span class="dp-sm">${esc(W.says)}</span></div></div>`; }).join('')}</div>`;
}
function dpTruck(g){
 const col = g.kind === 'removals';
 return `<table class="dp-tbl"><thead><tr><th>Ref</th><th>What</th><th>Asset numbers</th><th>Also on it</th></tr></thead><tbody>${g.rows.map(r => {
  const acc = dpAcc(r.a), notes = dpNotes(r);
  return `<tr><td class="dp-rk">${esc(r.a.key)}</td><td>${dpItemsHtml(r)}<span class="dp-sm">${esc(r.a.name || '')}${r.a.discipline ? ' · ' + esc(r.a.discipline) : ''}</span></td>
  <td>${dpNumsHtml(r.a, g.rows.length > 1)}${col ? '<span class="dp-sm">check the plate before it goes on the truck</span>' : ''}</td>
  <td>${acc.length ? acc.map(x => esc((x.q > 1 ? x.q + ' × ' : '') + x.t)).join(' · ') : '<span class="dp-none">no accessories on the schedule</span>'}${notes.length ? `<span class="dp-sm">Schedule note: ${esc(notes.join(' · '))}</span>` : ''}</td></tr>`; }).join('')}</tbody></table>`;
}
function dpRules(){
 const r = DATA.driver_rules || {}, site = DATA.site || {}, notes = ((DATA.access || {}).general_notes || []).map(tidyNote);
 const li = [];
 if ((r.ppe || []).length) li.push(`<b>PPE on before the gate:</b> ${esc(r.ppe.join(', '))}.`);
 if (r.escort) li.push(`<b>${esc(r.escort)}</b>`);
 if (site.hours) li.push(`<b>Site hours ${esc(site.hours)}</b> ${esc(site.hours_days || '')}. ${esc(site.hours_qualifier || '')}`);
 notes.forEach(x => li.push(esc(x.charAt(0) + x.slice(1).toLowerCase()).replace(/\b(\d+)\s?km\b/gi, '$1 km/h').replace(/macintosh park/gi, 'Macintosh Park').replace(/\bpm\b|\bam\b/g, m => m)));
 return `<div class="dp-rules"><ul>${li.map(x => '<li>' + x + '</li>').join('')}</ul></div>`;
}
function dpDriverPage(d, g, i, n){
 const cache = new Map(), posOf = a => { if (!cache.has(a.key)) cache.set(a.key, dpPos(a)); return cache.get(a.key); };
 return `<section class="dp-page dp-drv${g.kind === 'removals' ? ' dp-col' : ''}" data-load="${i}">
 ${dpHeader(d, g, 'drv', i, n)}
 <div class="dp-hero">${dpHero(g, 'drv')}<div class="dp-side">${dpFacts(d, g, 'drv')}${dpSafe(g, 'drv')}</div></div>
 <div class="dp-sec"><h2><i>01</i> On the truck <em>${g.kind === 'removals' ? 'what you are collecting' : 'what you are delivering'} — read off the schedule and the rental system</em></h2>${dpTruck(g)}</div>
 <div class="dp-sec"><h2><i>02</i> Where it goes <em>the way in, and the spot</em></h2><div class="dp-where">${dpWay(g, posOf)}${dpPosBoxes(g, posOf)}</div></div>
 ${dpPics(g, 'drv', posOf)}
 <div class="dp-sec"><h2><i>03</i> SWMS and procedures for this load <em>scan with your phone camera and read them before you arrive</em></h2>${dpDocsHtml(g, 'drv')}</div>
 <div class="dp-sec"><h2><i>04</i> Site rules <em>iEDM and Coates</em></h2>${dpRules()}</div>
 ${dpLife()}
 ${dpContacts('drv')}
 ${dpFoot(g, 'drv', i, n)}
 </section>`;
}
/* ---------- the installer's page */
function dpWork(g){
 const W = (typeof PS7 !== 'undefined' && PS7.work) ? PS7.work : [];
 const lab = k => (W.find(w => w[0] === k) || [k, k])[1];
 const col = g.kind === 'removals';
 const need = r => { const t = [r.a.discipline, r.a.product].concat(r.a.item_types || []).join(' ').toLowerCase(), s = new Set();
  if (/portable building|building|ticket box|container/.test(t)) (col ? ['load_building'] : ['unload_building', 'level', 'blocks', 'stairs', 'power']).forEach(x => s.add(x));
  else if (/toilet|amenit|fwf|waste tank/.test(t)) s.add(col ? 'load_toilets' : 'unload_toilets');
  if (/generator|light/.test(t) && !col) s.add('power');
  if (/water|barrier|tl2/.test(t)) s.add('barriers');
  s.add('forklift'); s.add('spotting');
  return s; };
 const sets = g.rows.map(need), order = ['unload_building', 'load_building', 'unload_toilets', 'load_toilets', 'level', 'blocks', 'stairs', 'power', 'barriers', 'forklift', 'spotting'];
 const items = order.filter(k => sets.some(s => s.has(k))).map(k => ({label: lab(k), on: sets.map(s => s.has(k))}));
 const rec = ['Arrival recorded in the page', 'Photos taken and uploaded to the page', 'Asset numbers recorded in the page'];
 rec.forEach(x => items.push({label: x, on: sets.map(() => true)}));
 if (g.rows.length === 1) return `<div class="dp-chkl">${items.map(x => `<label>${dpBx()}${esc(x.label)}</label>`).join('')}</div>`;
 return `<table class="dp-chk"><colgroup><col>${g.rows.map(() => '<col style="width:13mm">').join('')}</colgroup><thead><tr><th>${col ? 'Removal' : 'Install'} checklist — the crew's own list</th>${g.rows.map(r => `<th>${esc(r.a.key)}</th>`).join('')}</tr></thead><tbody>${
  items.map(x => `<tr><td>${esc(x.label)}</td>${x.on.map(o => o ? `<td class="dp-c">${dpBx()}</td>` : '<td class="dp-na">—</td>').join('')}</tr>`).join('')}</tbody></table>`;
}
function dpInsWhereMany(g, posOf){
 const list = xs => xs && xs.length ? esc(xs.join(', ')) : '<span class="dp-none">—</span>';
 return `<table class="dp-tbl dp-wtbl"><colgroup><col style="width:15mm"><col style="width:34mm"><col style="width:26mm"><col><col style="width:44mm"><col style="width:19mm"></colgroup>
 <thead><tr><th>Ref</th><th>Location · sector</th><th>Drawing callout</th><th>Next to · beside · near</th><th>Position</th><th>Navigate</th></tr></thead><tbody>${g.rows.map(r => {
  const a = r.a, m = masterLoc(a.key) || {}, w = whereText(a), link = (a.drawing_links || [])[0], P = posOf(a), W = dpPosWords(a, P), q = dpNavQr(P);
  const orient = dpNotes(r).filter(x => /orient|facing|face[sd]?\b|door|window|toward|back to/i.test(x));
  return `<tr><td class="dp-rk">${esc(a.key)}</td><td><b>${esc(w.main || '')}</b>${w.main ? '' : '<span class="dp-sm">' + esc(w.w.fallback) + '</span>'}<span class="dp-sm">Sector ${m.sec ? esc(m.sec) : '<span class="dp-wr dp-in" style="width:12mm"></span>'}</span></td>
  <td>${link ? `<b>${esc(link.label)}</b><span class="dp-sm">on ${esc(link.sheet)}</span>` : '<span class="dp-none">none — master plan</span>'}</td>
  <td><span class="dp-sm"><b>Next to</b> ${list(m.next)}</span><span class="dp-sm"><b>Beside</b> ${list(m.beside)}</span><span class="dp-sm"><b>Near</b> ${list(m.near)}</span>
  <span class="dp-sm"><b>Orientation</b> ${orient.length ? esc(orient.join(' · ')) : '<span class="dp-wr dp-in"></span>'}</span></td>
  <td><b class="dp-num" style="font-size:.95em">${esc(W.ll || '')}</b><span class="dp-sm">${esc(W.label)}${P.kind === 'pin' ? ' — ' + esc(W.says) : ''}</span></td>
  <td>${q ? `<div class="dp-qr" style="width:15mm">${q}</div>` : dpWr()}</td></tr>`; }).join('')}</tbody></table>`;
}
function dpInsWhere(g, posOf){
 const one = g.rows.length === 1;
 if (!one) return dpInsWhereMany(g, posOf);
 return g.rows.map(r => {
  const a = r.a, m = masterLoc(a.key) || {}, w = whereText(a), link = (a.drawing_links || [])[0], P = posOf(a), W = dpPosWords(a, P);
  const notes = dpNotes(r), orient = notes.filter(x => /orient|facing|face[sd]?\b|door|window|north|south|east|west|toward|back to/i.test(x));
  const cell = (label, v, cls) => `<div class="dp-cell${cls ? ' ' + cls : ''}"><label>${label}</label>${v}</div>`;
  const list = xs => xs && xs.length ? `<b>${esc(xs.join(', '))}</b>` : '<span class="dp-none">none in the record</span>';
  const cells = [
   cell('Location on the schedule', w.main ? `<b>${esc(w.main)}</b>` : `<span class="dp-none">${esc(w.w.fallback)}</span>${dpWr()}`, 'dp-w2 dp-hl'),
   cell('Sector', m.sec ? `<b>${esc(m.sec)}</b>` : `<span class="dp-none">not in the record</span>${dpWr()}`),
   cell('Drawing callout', link ? `<b>${esc(link.label)}</b><span class="dp-sm">on ${esc(link.sheet)}</span>` : '<span class="dp-none">no drawing callout — placed from the master plan</span>'),
   cell('Next to', list(m.next)), cell('Beside', list(m.beside)), cell('Near', list(m.near), 'dp-w2'),
   cell(W.label, `${W.ll ? `<b class="dp-num" style="font-size:1em">${esc(W.ll)}</b>` : dpWr()}<span class="dp-sm">${esc(W.says)}</span>`, 'dp-w2'),
   cell('Orientation / door facing', orient.length ? `<b>${esc(orient.join(' · '))}</b>` : `<span class="dp-none">not in the record — write it in</span>${dpWr()}`, 'dp-w2'),
  ];
  const q = dpNavQr(P);
  return `<div class="dp-refrow">${one ? '' : `<div class="dp-rtag">${esc(a.key)}</div>`}<div class="dp-cells" style="--c:4">${cells.join('')}</div>${
   q ? `<div class="dp-pos" style="width:auto;flex-direction:column;align-items:center"><div class="dp-qr" style="width:calc(20mm * var(--k))">${q}<span>scan to navigate</span></div></div>` : ''}</div>`;
 }).join('');
}
function dpWhatIs(g){
 return `<table class="dp-tbl"><thead><tr><th>Ref</th><th>What it is</th><th>Asset numbers</th><th>Accessories — tick when fitted</th></tr></thead><tbody>${g.rows.map(r => {
  const acc = dpAcc(r.a), notes = dpNotes(r).filter(x => !/orient|facing|door/i.test(x));
  return `<tr><td class="dp-rk">${esc(r.a.key)}</td><td>${dpItemsHtml(r)}<span class="dp-sm">${esc(r.a.name || '')}${r.a.discipline ? ' · ' + esc(r.a.discipline) : ''}</span>${
   notes.length ? `<span class="dp-sm">Schedule note: ${esc(notes.join(' · '))}</span>` : ''}</td><td>${dpNumsHtml(r.a, g.rows.length > 1)}</td>
  <td>${acc.length ? acc.map(x => `<span style="white-space:nowrap;margin-right:2.4mm">${dpBx()}${esc((x.q > 1 ? x.q + ' × ' : '') + x.t)}</span>`).join(' ') : '<span class="dp-none">no accessories on the schedule</span>'}</td></tr>`; }).join('')}</tbody></table>`;
}
function dpInstallerPage(d, g, i, n){
 const cache = new Map(), posOf = a => { if (!cache.has(a.key)) cache.set(a.key, dpPos(a)); return cache.get(a.key); };
 return `<section class="dp-page dp-ins${g.kind === 'removals' ? ' dp-col' : ''}" data-load="${i}">
 ${dpHeader(d, g, 'ins', i, n)}
 <div class="dp-hero">${dpHero(g, 'ins')}<div class="dp-side">${dpFacts(d, g, 'ins')}${dpSafe(g, 'ins')}</div></div>
 <div class="dp-sec"><h2><i>01</i> What it is <em>and what goes in it</em></h2>${dpWhatIs(g)}</div>
 <div class="dp-sec"><h2><i>02</i> Exactly where it goes <em>master plan D001-26003-03, the drawings and the pins</em></h2>${dpInsWhere(g, posOf)}</div>
 ${dpPics(g, 'ins', posOf)}
 <div class="dp-sec"><h2><i>03</i> ${g.kind === 'removals' ? 'Removal' : 'Install'} checklist <em>the crew's own work list — tick as it is done</em></h2>${dpWork(g)}</div>
 <div class="dp-sec"><h2><i>04</i> SWMS <em>scan with your phone camera and read before you start</em></h2>${dpDocsHtml(g, 'ins')}</div>
 ${dpLife()}
 ${dpContacts('ins')}
 ${dpFoot(g, 'ins', i, n)}
 </section>`;
}
/* ---------- cutting the pictures at the size they landed, then fitting the page */
function dpFail(w, why){
 if (!w.querySelector('.dp-miss')) w.insertAdjacentHTML('beforeend', `<span class="dp-miss">${esc(why || 'Picture not available — it could not be loaded.')}</span>`);
 const im = w.querySelector('img'); if (im) im.remove();
 w.dataset.failed = '1';
}
function dpRings(w, pts, g, cx, cy, W, H){
 const x0 = cx * W - g.rx / 100 * g.winW, y0 = cy * H - g.ry / 100 * g.winH;
 w.querySelectorAll('.dp-ring').forEach(e => e.remove());
 pts.forEach(p => { const l = (p[0] * W - x0) / g.winW * 100, t = (p[1] * H - y0) / g.winH * 100;
  if (l < -2 || l > 102 || t < -2 || t > 102) return;
  w.insertAdjacentHTML('beforeend', `<i class="dp-ring${w.dataset.sm || pts.length > 1 ? ' dp-sm' : ''}" style="left:${l.toFixed(2)}%;top:${t.toFixed(2)}%">${pts.length > 1 && p[2] ? '<i>' + esc(p[2]) + '</i>' : ''}</i>`); });
}
function dpCut(root){
 const sheets = [...root.querySelectorAll('.dp-sheet')], air = [...root.querySelectorAll('.dp-air')];
 const pS = Promise.all(sheets.map(w => { const b = w.getBoundingClientRect(), img = w.querySelector('img');
  if (!img || !(b.width > 0 && b.height > 0)) return null;
  const fx = +w.dataset.fx, fy = +w.dataset.fy, f = +w.dataset.f;
  return sheetSrc(w.dataset.sheet).then(src => { const g = cutWindow(img, src, src.naturalWidth, src.naturalHeight, fx, fy, f, b, 0.82);
   dpRings(w, [[fx, fy, '']], g, fx, fy, src.naturalWidth, src.naturalHeight); }, () => dpFail(w, 'The drawing could not be loaded.')); }));
 const pA = !air.length ? Promise.resolve() : AERIAL_SRC().then(src => {
  const W = src.naturalWidth, H = src.naturalHeight;
  air.forEach(w => { const b = w.getBoundingClientRect(), img = w.querySelector('img');
   let pts = []; try { pts = JSON.parse(w.dataset.pts || '[]'); } catch (e) { pts = []; }
   if (!img || !pts.length || !(b.width > 0 && b.height > 0)) return;
   let f = +w.dataset.f, cx = pts[0][0], cy = pts[0][1];
   if (pts.length > 1 || !(f > 0)) {
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), dx = Math.max(...xs) - Math.min(...xs), dy = Math.max(...ys) - Math.min(...ys);
    cx = (Math.max(...xs) + Math.min(...xs)) / 2; cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    f = Math.min(1, Math.max(0.06, dx / 0.7, dy * H * b.width / (0.7 * W * b.height)));
   }
   const g = cutWindow(img, src, W, H, cx, cy, f, b, 0.85);
   dpRings(w, pts, g, cx, cy, W, H);
  });
 }, () => air.forEach(w => dpFail(w, 'The aerial photograph could not be loaded.')));
 return Promise.all([pS, pA]);
}
/* a photograph or a drawing held on the service is embedded whole by the printer - one master-plan crop is several
   megabytes - so each is redrawn at the size its window prints, like the aerial crops, before the dialog opens */
function dpShrink(root){
 root.querySelectorAll('.dp-img img').forEach(im => {
  const w = im.parentNode, b = w.getBoundingClientRect();
  if (!(im.complete && im.naturalWidth) || !(b.width > 0 && b.height > 0) || im.dataset.cut) return;
  const outW = Math.max(360, Math.min(1400, Math.round(b.width * 2.2))), outH = Math.max(1, Math.round(outW * b.height / b.width));
  const iw = im.naturalWidth, ih = im.naturalHeight, contain = w.classList.contains('dp-fitc');
  const s = contain ? Math.min(outW / iw, outH / ih) : Math.max(outW / iw, outH / ih), dw = iw * s, dh = ih * s;
  try {
   const c = document.createElement('canvas'); c.width = outW; c.height = outH; const x = c.getContext('2d');
   x.fillStyle = '#fff'; x.fillRect(0, 0, outW, outH); x.drawImage(im, (outW - dw) / 2, (outH - dh) / 2, dw, dh);
   im.src = c.toDataURL('image/jpeg', 0.86); im.dataset.cut = '1';
  } catch (e) { /* a picture from another origin cannot be redrawn; it prints as it is */ }
 });
}
function dpGrid(pg){
 const pics = pg.querySelector('.dp-pics'); if (!pics) return;
 const MM = 96 / 25.4, b = pics.getBoundingClientRect(), W = b.width, H = b.height, gap = 1.4 * MM;
 const figs = [...pics.children].filter(x => x.classList.contains('dp-fig'));
 if (figs.length < 2 || !(W > 0 && H > 0)) return;
 const best = k => { let top = {c: 1, s: 0}; for (let c = 1; c <= Math.min(k, 5); c++) { const r = Math.ceil(k / c), cw = (W - gap * (c - 1)) / c, ch = (H - gap * (r - 1)) / r - 4.5 * MM;
  const s = Math.min(cw / 1.3, ch); if (s > top.s) top = {c, s}; } return top; };
 const byPr = figs.slice().sort((x, y) => (+x.dataset.pr || 9) - (+y.dataset.pr || 9));
 let k = figs.length, pick = best(k);
 while (k > 3 && pick.s < 34 * MM) { k--; pick = best(k); }
 const keep = new Set(byPr.slice(0, k));
 figs.forEach(f => { if (!keep.has(f)) f.remove(); f.style.gridColumn = ''; });
 const kept = figs.filter(f => keep.has(f)), c = pick.c, rem = kept.length % c;
 if (rem && kept.length > c) kept[0].style.gridColumn = 'span ' + (c - rem + 1);
 pics.style.setProperty('--c', String(c));
}
function dpFit(root){
 const MM = 96 / 25.4, over = [];
 root.querySelectorAll('.dp-page').forEach(pg => {
  const pics = pg.querySelector('.dp-pics'), min = (pg.querySelectorAll('.dp-pics .dp-fig').length > 3 ? 70 : 56) * MM;
  const over = () => pg.scrollHeight > pg.clientHeight + 1, small = () => pics && pics.getBoundingClientRect().height < min;
  let k = 1; pg.style.setProperty('--k', '1');
  const step = () => { k = Math.round((k - 0.02) * 100) / 100; pg.style.setProperty('--k', String(k)); };
  /* the words stay at a size a person reads from arm's length (down to 0.82) while the pictures are given at least
     their floor; only a page whose words alone run past the sheet goes smaller than that */
  while ((over() || small()) && k > 0.84) step();
  while (over() && k > 0.62) step();
  if (pg.scrollHeight > pg.clientHeight + 1) over.push('load ' + pg.dataset.load);
  dpGrid(pg);
 });
 root.__over = over;
 return over;
}
function dpWaitDocs(){
 if (!(typeof SYNC !== 'undefined' && SYNC.backend && SYNC.backend.files) || DOCS.state === 'ready') return Promise.resolve();
 try { docsRefresh(false); } catch (e) {}
 return new Promise(res => { const t0 = Date.now(), tick = () => (DOCS.state !== 'loading' && DOCS.state !== 'unrequested') || Date.now() - t0 > 4000 ? res() : setTimeout(tick, 150); tick(); });
}
function dpPrint(iso, doc){
 const d = programmeDays().find(x => x.iso === iso);
 if (!d) { flash('That day is outside the programme.'); return; }
 const loads = dpLoads(d);
 if (!loads.length) { flash('Nothing is scheduled to move on ' + fmtDate(iso) + ', so there is nothing to print.'); return; }
 flash('Preparing ' + loads.length + ' page' + (loads.length === 1 ? '' : 's') + ' — one per load. The print dialog opens when the pictures are cut.');
 dpWaitDocs().then(() => {
  const pages = loads.map((g, i) => (doc === 'ins' ? dpInstallerPage : dpDriverPage)(d, g, i + 1, loads.length));
  const wrap = document.getElementById('dayprint') || (() => { const e = document.createElement('div'); e.id = 'dayprint'; document.body.appendChild(e); return e; })();
  wrap.innerHTML = pages.join(''); wrap.classList.add('dpwrap'); wrap.dataset.dpReady = '';
  document.querySelectorAll('#dayPage').forEach(e => e.remove());
  const st = document.createElement('style'); st.id = 'dayPage'; st.textContent = '@page{size:A4 portrait;margin:8mm}';
  document.head.appendChild(st);
  document.body.classList.add('printing-day');
  const done = () => { st.remove(); wrap.classList.remove('dpwrap'); document.body.classList.remove('printing-day'); };
  window.addEventListener('afterprint', done, {once: true});
  const imgs = () => Promise.all([...wrap.querySelectorAll('.dp-win img')].map(im => (im.complete && im.naturalWidth) ? 'ok'
   : new Promise(res => { const t = setTimeout(() => res('failed'), 6000); im.addEventListener('load', () => { clearTimeout(t); res('ok'); }, {once: true}); im.addEventListener('error', () => { clearTimeout(t); res('failed'); }, {once: true}); })));
  let settled = false;
  const go = () => { if (!document.getElementById('dayPage')) return; wrap.dataset.dpReady = '1'; try { window.print(); } catch (e) { done(); } };
  const finish = r => { if (settled) return; settled = true; window.__dpLast = r; if (!r.failed && !r.over.length) go(); else { wrap.dataset.dpReady = 'ask'; printAsk(r, go, done); } };
  (document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => null) : Promise.resolve())
   .then(() => imgs())
   .then(() => { wrap.querySelectorAll('.dp-img img').forEach(im => { if (!(im.complete && im.naturalWidth)) dpFail(im.parentNode); }); dpFit(wrap); dpShrink(wrap); return dpCut(wrap); })
   .then(() => imgs())
   .then(() => ({failed: wrap.querySelectorAll('[data-failed="1"]').length, over: (wrap.__over || []).slice(), pages: pages.length}))
   .then(finish).catch(() => finish({timeout: true, failed: 0, over: []}));
  setTimeout(() => { if (!settled) { settled = true; wrap.dataset.dpReady = 'ask'; printAsk({timeout: true, failed: 0, over: []}, go, done); } }, 20000);
 });
}
