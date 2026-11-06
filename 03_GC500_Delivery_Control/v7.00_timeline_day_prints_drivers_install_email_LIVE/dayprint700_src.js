/* v7.00 - THE DAY ON PAPER, TWICE: ONE FOR THE DRIVER (GC500-DRV-01), ONE FOR THE INSTALL TEAM (GC500-INS-01).
 The project manager, 27 Sep 2026: a print option for the day on the Timeline - one the branch prints for the drivers and
 one he prints for the install team on site - one A4 page per load, the reference code as the main feature, the pinned
 location, lots of pictures, a Coates document. Then: no sign-off; the JSEA is the driver's, done before unloading, on
 every load, and nothing to do with the team on site; a Take 5 before every new task on both; the Coates Life Saving
 Rules word for word on every page; the SWMS and procedures as QR codes that open the PDF from the public view link;
 the day row reduced to Pre-start, Drivers, Install and an Email drop-down. And last: the CEO reads these - simple,
 calm, the reference as large as the page allows, one short line per fact, plain one-word headings.

 ONE PAGE PER LOAD. A load is a truck: rows with the same load time and the same carrier on the schedule, or the
 references a load on the transport plan names. Where neither says so, each reference has its own page and the page
 says so. NOTHING INVENTED: every value is read from the record; where it holds none the page prints a ruled line.
 The QR codes are drawn by the page's own encoder and point only at the public view link (origin + the view slug) -
 never at the token this browser was opened with. */
const DP_DOC = {
 drv: {id: 'GC500-DRV-01', kick: 'Delivery driver sheet', mail: 'Delivery drivers', link: 'drivers'},
 ins: {id: 'GC500-INS-01', kick: 'Install team sheet', mail: 'Install team', link: 'install'},
};
const DP_VIEW_SLUG = 'Coates-GC500-2026';
const DP_HOST = 'https://gc500-production.up.railway.app';
const DP_MAIL_MAX = 1800;
function dpT(t){
 const s = String(t == null ? '' : t).trim();
 let m = s.match(/^(\d{1,2})[:.](\d{2})$/); if (m && +m[1] < 24 && +m[2] < 60) return m[1].padStart(2, '0') + ':' + m[2];
 m = s.match(/^(\d{1,2})(\d{2})$/); if (m && +m[1] < 24 && +m[2] < 60) return m[1].padStart(2, '0') + ':' + m[2];
 return null;
}
const dpUniq = xs => [...new Set(xs.filter(x => x != null && String(x).trim() !== '').map(x => String(x).trim()))];
function dpWr(){ return '<span class="dp-wr" aria-label="not recorded - write it in"></span>'; }
function dpBx(){ return '<i class="dp-bx"></i>'; }
/* ---------- the public view link: this browser's origin and the view slug, never the token it was opened with */
function dpViewBase(){ return {origin: /^https?:$/.test(location.protocol) ? location.origin : DP_HOST, slug: DP_VIEW_SLUG}; }
function dpViewUrl(hash){ const v = dpViewBase(); return v.origin + '/v/' + encodeURIComponent(v.slug) + (hash ? '#' + hash : ''); }
function dpFileUrl(id){ const v = dpViewBase(); return v.origin + '/f/' + encodeURIComponent(v.slug) + '/' + encodeURIComponent(id); }
/* ---------- the day row on the Timeline: exactly Pre-start, Drivers, Install, Email. The pre-start is the v6.97 one
 (ps7Print), offered once the Sunday or Wednesday batch that fills the day has arrived, greyed until then, and not on
 a day gone by. Print the day, Delivery advice, Email the advice, Email this day, Copy link and Add an asset to this
 day have left this row; their functions stay. */
function dpPs(iso){ let s = null; try { const pd = ps7Day(iso); s = pd ? ps7State(pd) : null; } catch (e) { s = null; } return s || {state: 'none'}; }
function dpPsLater(s){ return 'Prefilled automatically on ' + ps7Words(s.batch); }
function dpDayButtons(d){
 const iso = esc(d.iso), ps = dpPs(d.iso);
 let pre = '';
 if (ps.state === 'ready') pre = `<button class="btn" type="button" data-print-ps7="${iso}" title="The Coates Installs daily pre-start for this day, prefilled from the record - one A4 page">Pre-start</button>`;
 else if (ps.state === 'later') pre = `<button class="btn dp-off" type="button" aria-disabled="true" data-ps7-later="${esc(dpPsLater(ps))}" title="${esc(dpPsLater(ps))}">Pre-start</button>`;
 const row = (k, w, off) => `<div class="dpmail-r"><button type="button" role="menuitem" class="dpmail-go${off ? ' dp-off' : ''}" data-dpmail="${k}" data-iso="${iso}"${off ? ` aria-disabled="true" title="${esc(off)}"` : ''}>${w}</button><button type="button" role="menuitem" class="dpmail-cp" data-dpcopy="${k}" data-iso="${iso}">Copy the email text</button></div>`;
 return `${pre}<button class="btn" type="button" data-print-drv="${iso}" title="Delivery driver sheet (GC500-DRV-01): one A4 page per load - for the branch to print for the drivers">Drivers</button><button class="btn" type="button" data-print-ins="${iso}" title="Install team sheet (GC500-INS-01): one A4 page per load - for the team on site">Install</button><details class="dpmail"><summary class="btn" aria-haspopup="menu" title="Email a link to one of this day's documents">Email ▾</summary><div class="dpmail-m" role="menu">${
  ps.state === 'ready' || ps.state === 'later' ? row('prestart', 'Pre-start', ps.state === 'later' ? dpPsLater(ps) : '') : ''}${row('drivers', 'Drivers')}${row('install', 'Install')}</div></details>`;
}
function dpWireDay(pane){
 pane.querySelectorAll('[data-print-drv]').forEach(n => n.onclick = () => dpPrint(n.dataset.printDrv, 'drv'));
 pane.querySelectorAll('[data-print-ins]').forEach(n => n.onclick = () => dpPrint(n.dataset.printIns, 'ins'));
 pane.querySelectorAll('[data-print-ps7]').forEach(n => n.onclick = () => ps7Print(n.dataset.printPs7));
 pane.querySelectorAll('[data-ps7-later]').forEach(n => n.onclick = () => flash(n.dataset.ps7Later + '.'));
 pane.querySelectorAll('[data-dpmail]').forEach(n => n.onclick = () => {
  if (n.getAttribute('aria-disabled') === 'true') { flash(n.title + '.'); return; }
  const m = dpMail(n.dataset.dpmail, n.dataset.iso); const dt = n.closest('details'); if (dt) dt.open = false;
  if (m) location.href = m.href; });
 pane.querySelectorAll('[data-dpcopy]').forEach(n => n.onclick = () => { const dt = n.closest('details'); if (dt) dt.open = false; dpCopyMail(n.dataset.dpcopy, n.dataset.iso); });
 /* the menu opens inside the screen, wherever the Email control sits in the row */
 pane.querySelectorAll('details.dpmail').forEach(dt => dt.addEventListener('toggle', () => { const m = dt.querySelector('.dpmail-m'); if (!dt.open || !m) return;
  m.style.right = '0px'; const r = m.getBoundingClientRect(), vw = document.documentElement.clientWidth;
  if (r.left < 8) m.style.right = (r.left - 8) + 'px'; else if (r.right > vw - 8) m.style.right = (r.right - vw + 8) + 'px'; }));
}
/* one drop-down open at a time, and a click anywhere else closes it */
document.addEventListener('click', e => { document.querySelectorAll('details.dpmail[open]').forEach(dt => { if (!dt.contains(e.target)) dt.open = false; }); });
/* ---------- the email: no recipient; a short note, the loads one line each, the documents with their view links, and
 ONE view link that opens the document for that day. Kept under DP_MAIL_MAX characters as a mailto. */
const DP_MAIL = {prestart: 'Daily pre-start', drivers: 'Delivery drivers', install: 'Install team'};
function dpLoadLine(g){
 const refs = g.rows.map(r => r.a.key).join(', ');
 const what = dpUniq(g.rows.flatMap(r => dpItems(r).map(x => x.item).filter(Boolean).concat(dpItems(r).length ? [] : (r.a.item_types || [])))).join(' + ');
 const place = g.rows.length === 1 ? (whereText(g.rows[0].a).main || '') : '';
 const when = [g.time, g.carrier].filter(Boolean).join(' ');
 return `${when ? when + ': ' : ''}${refs}${what ? ' ' + what : ''}${place ? ', ' + place : ''}`;
}
function dpDayDocs(d, doc){
 const out = [];
 dpLoads(d).forEach(g => dpDocs(g, doc).forEach(x => { if (!out.some(y => y.d === x.d)) out.push(x); }));
 if (!out.length) (doc === 'drv' ? ['unload'] : ['pbt', 'unload']).forEach(k => { const x = dpDocById(k); if (x) out.push(dpDocView(x)); });
 return out;
}
function dpMailParts(kind, iso){
 const d = programmeDays().find(x => x.iso === iso);
 if (!d) return null;
 const loads = dpLoads(d), n = loads.length, date = fmtDate(iso), doc = kind === 'drivers' ? 'drv' : 'ins';
 const subject = `GC500 — ${DP_MAIL[kind]} — ${date}`;
 const link = dpViewUrl('print/' + kind + '/' + iso);
 const docs = dpDayDocs(d, doc);
 const lead = kind === 'prestart' ? `The Coates Installs pre-start for ${date} is ready to print (one page).`
  : kind === 'drivers' ? `Driver sheets for ${date}: ${n} load${n === 1 ? '' : 's'}, one page each. Please print one per driver.`
  : `Install team sheets for ${date}: ${n} load${n === 1 ? '' : 's'}, one page each.`;
 const safety = kind === 'drivers' ? 'The driver completes a JSEA before unloading, on every load. Take 5 before every new task.' : 'Take 5 before every new task.';
 return {subject, link, lead, loads: loads.map(dpLoadLine), docs: docs.map(x => `${x.title}: ${x.url}`), safety, n};
}
function dpMailBody(P, k){
 const shown = P.loads.slice(0, k), more = P.loads.length - shown.length;
 return ['Hi all,', '', P.lead, '', 'Open and print:', P.link, '',
  P.loads.length ? 'Loads:' : 'No loads are scheduled on this day.', ...shown, ...(more > 0 ? [`and ${more} more — all on the linked sheet`] : []), '',
  'SWMS and procedures:', ...P.docs, '', P.safety, '', 'Coates Industrial Solutions, GC500 2026'].join('\n');
}
function dpMail(kind, iso){
 const P = dpMailParts(kind, iso);
 if (!P) { flash('That day is outside the programme.'); return null; }
 let k = P.loads.length, href = '';
 for (;;) { href = mailto(P.subject, dpMailBody(P, k)); if (href.length <= DP_MAIL_MAX || k === 0) break; k--; }
 return {href, subject: P.subject, body: dpMailBody(P, k), full: dpMailBody(P, P.loads.length), shown: k, loads: P.loads.length};
}
function dpCopyMail(kind, iso){
 const m = dpMail(kind, iso); if (!m) return;
 const text = 'Subject: ' + m.subject + '\n\n' + m.full;
 const fallback = () => {
  const box = document.createElement('div'); box.className = 'drawer on dpcopy'; box.style.zIndex = 40; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'The email text');
  box.innerHTML = `<div class="dh"><div><h2>The email text</h2><div class="sub">Selected - press Ctrl+C (or Copy) and paste it into your email.</div></div><button class="btn" type="button" data-x>Close</button></div><textarea readonly rows="18" style="width:100%;font:13px/1.4 ui-monospace,Menlo,Consolas,monospace"></textarea>`;
  document.body.appendChild(box); const ta = box.querySelector('textarea'); ta.value = text; ta.focus(); ta.select();
  try { ta.setSelectionRange(0, text.length); } catch (e) {}
  box.querySelector('[data-x]').onclick = () => box.remove();
 };
 try {
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => flash('Email text copied - ' + DP_MAIL[kind] + ', ' + fmtDate(iso) + '.'), fallback);
  else fallback();
 } catch (e) { fallback(); }
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
/* the page says, in a few words, why these references share it */
function dpBasisShort(g){
 const n = g.rows.length;
 if (g.basis === 'load') return n > 1 ? `One truck · ${n} refs · same time and carrier` : 'One truck · one ref';
 if (g.basis === 'plan') return `One truck · load ${g.plan.n != null ? g.plan.n : ''} on the transport plan`;
 return 'Own page · no shared load recorded';
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
function dpItemsWords(r){ return dpItems(r).map(x => (x.qty ? x.qty + ' × ' : '') + (x.item || (r.a.item_types || []).join(', '))).join(' · '); }
function dpAcc(a){ return (a.accessories || []).map(x => ({t: x.as_written || x.type || '', q: x.qty_stated && x.qty > 1 ? x.qty : (x.qty > 1 ? x.qty : 1), no: x.asset_no || ''})).filter(x => x.t); }
function dpNotes(r){
 const a = r.a;
 const acc = new Set(dpAcc(a).map(x => x.t.toLowerCase()));
 return dpUniq([].concat(a.asset_notes || [], a.unparsed_notes || [], (r.events || []).map(e => e.note)))
  .filter(n => !acc.has(n.toLowerCase()) && !String(n).split(/\s*,\s*/).every(p => acc.has(p.toLowerCase())));
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
  return {kind: 'drawing', lat: t.ll.lat, lon: t.ll.lon, pt: dpInFrame(p) ? {ax: p.ax, ay: p.ay} : null};
 }
 return {kind: 'none'};
}
/* the position in a label and one short line */
function dpPosWords(P){
 const ll = P.lat != null ? P.lat.toFixed(6) + ', ' + P.lon.toFixed(6) : '';
 const stamp = at => { try { return brisStamp(at) || fmtStamp(at); } catch (e) { return fmtStamp(at); } };
 if (P.kind === 'pin') return {label: 'Pinned on site', ll, line: `Phone pin · ${P.by || 'name not recorded'}${P.at ? ' · ' + stamp(P.at) : ''}`};
 if (P.kind === 'master') return {label: 'Master-plan position', ll, line: 'From master plan D001 · not a phone pin'};
 if (P.kind === 'area') return {label: 'Master-plan area', ll, line: 'Area only, from master plan D001 · not a phone pin'};
 if (P.kind === 'placed') return {label: 'Placed on the map', ll, line: `Placed by ${(P.place && P.place.by) || 'name not recorded'} · not a phone pin`};
 if (P.kind === 'drawing') return {label: 'Planned area', ll, line: 'From the drawing callout · not a phone pin'};
 return {label: 'Position', ll: '', line: 'Not recorded'};
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
/* ---------- the documents, by their id on the register - three of the driver's four are filed as transport procedures */
const DP_DOC_IDS = {
 unload: 'GC500_SWMS_-_Loading_and_Unloading_at_Third_Party_Sites.pdf',
 transport: 'Safe_Transport_of_Portable_Buildings.pdf',
 pretransit: 'Site_Accommodation_Pre-Transit_Checklist_Work_Instruction.pdf',
 hs81: 'HS_81_Portable_Buildings_-_Guidance_Sheet_for_Lifting_Portable_Buildings.pdf',
 pbt: 'GC500_SWMS_-_Portable_Buildings_and_Toilets.pdf',
 glink: 'GC500_High_Risk_Work_-_G-Link_Light_Rail.pdf',
};
function dpDocById(k){ return ((DATA.docs || {}).docs || []).find(d => d.id === DP_DOC_IDS[k]) || null; }
function dpDocRef(d){ return String(d.doc_ref || '').split(' · ')[0].replace(/-\s+x\s+/, '-x ').replace(/\s+v\d+(\.\d+)*$/, '').trim(); }
function dpDocTitle(d){ return String(d.title || d.name || d.id).replace(/\s+—\s+(SWMS|high risk work risk assessment|procedure|work instruction)$/i, '').replace(/^(SWMS|HS\s*\d+)\s+—\s+/i, ''); }
function dpDocView(d){
 const hosted = !!(typeof SYNC !== 'undefined' && SYNC.backend && SYNC.backend.files);
 const listed = !(hosted && DOCS.state === 'ready' && DOCS.files && !DOCS.files[d.id]);
 return {d, url: listed ? dpFileUrl(d.id) : dpViewUrl('docs/swms'), listed, ref: dpDocRef(d), title: dpDocTitle(d), pages: d.pages || null};
}
/* site accommodation is a portable building, a container or a toilet block (not a portaloo) - these carry the transport procedures on the driver's page */
function dpAccom(g){ return g.rows.some(r => /portable building|\bbuilding\b|ticket box|container|\bcont\b|toilet block|pan block/i.test([r.a.discipline, r.a.product, r.a.name].concat(r.a.item_types || []).join(' '))); }
function dpDocs(g, doc){
 const keys = doc === 'drv' ? ['unload'].concat(dpAccom(g) ? ['transport', 'pretransit', 'hs81'] : [], g.rows.some(dpLightRail) ? ['glink'] : []) : ['pbt', 'unload'];
 return keys.map(dpDocById).filter(Boolean).map(dpDocView);
}
function dpDocsHtml(g, doc){
 const L = dpDocs(g, doc);
 if (!L.length) return `<div class="dp-docs"><div class="dp-doc"><div class="dp-doc-t"><b>Not in the document register</b>${dpWr()}</div></div></div>`;
 return `<div class="dp-docs n${L.length}">${L.map(x => `<div class="dp-doc"><div class="dp-qr">${qrSvg(x.url, 3)}</div><div class="dp-doc-t"><b>${esc(x.title)}</b><span>${esc(x.ref)}</span><em>${x.pages ? esc(x.pages) + (x.pages === 1 ? ' page' : ' pages') : 'pages not recorded'}</em>${x.listed ? '' : '<span>Not on the shared record yet</span>'}</div></div>`).join('')}</div>`;
}
/* ---------- the pictures: an even grid, short captions */
function dpMasterImgs(a){
 const m = masterLoc(a.key); const M = DATA.media || {};
 if (!m || (m.img || []).length !== 2 || typeof M[m.img[0]] !== 'string') return [];
 return [{src: M[m.img[0]], cap: 'Master plan'}, {src: M[m.img[1]], cap: 'Master plan · area'}];
}
function dpFig(inner, cap, tag, pr){ return `<figure class="dp-fig" data-pr="${pr}">${inner}<figcaption>${tag ? '<b>' + esc(tag) + '</b>' : ''}${esc(cap)}</figcaption></figure>`; }
function dpAirFig(pts, f, cap, tag, pr){
 if (!pts.length || !DATA.aerial_hi) return '';
 return dpFig(`<div class="dp-win dp-air" data-pts="${esc(JSON.stringify(pts))}" data-f="${f}"><img alt=""></div>`, cap, tag, pr);
}
function dpImgFig(src, cap, tag, contain, pr){ return dpFig(`<div class="dp-win dp-img${contain ? ' dp-fitc' : ''}"><img src="${esc(src)}" alt="" decoding="async"></div>`, cap, tag, pr); }
function dpSheetFig(a, tag, pr){
 const s = dpSheetPt(a); if (!s) return '';
 return dpFig(`<div class="dp-win dp-sheet" data-sheet="${esc(s.sh.key)}" data-fx="${s.mk.fx}" data-fy="${s.mk.fy}" data-f="0.17"><img alt=""></div>`, 'Drawing · callout ' + s.label, tag, pr);
}
function dpStockFig(a, tag, pr){
 let pp = null; try { pp = productPhoto(a); } catch (e) { pp = null; }
 return pp && typeof pp.src === 'string' ? dpImgFig(pp.src, pp.kind === 'made' ? 'The product · drawing' : 'The product · stock photo', tag, true, pr) : '';
}
function dpShotFigs(a, tag, pr){
 let list = []; try { list = dropPhotosOf(a.key); } catch (e) { list = []; }
 return list.map(ph => ({ph, r: photoFor(ph)})).filter(x => x.r.state === 'ready').slice(0, 2)
  .map((x, j) => dpImgFig(x.r.thumb || x.r.url, 'On site' + (x.ph.at ? ' · ' + fmtStamp(x.ph.at) : ''), tag, false, pr + j / 10));
}
function dpPics(g, doc, posOf){
 const rows = g.rows, figs = [], one = rows.length === 1;
 const pt = r => { const P = posOf(r.a); return P.pt ? [P.pt.ax, P.pt.ay, r.a.key] : null; };
 if (one) {
  const a = rows[0].a, p = pt(rows[0]), M = dpMasterImgs(a), tag = '';
  const air = (f, cap, pr) => p ? dpAirFig([p], f, cap, tag, pr) : '';
  if (doc === 'drv') figs.push(air(1, 'Whole site', 1), air(0.22, 'From the road', 2), air(0.05, 'Close-up', 3), M[0] ? dpImgFig(M[0].src, 'Master plan', tag, false, 4) : '',
   dpStockFig(a, tag, 5), ...dpShotFigs(a, tag, 5.5), M[1] ? dpImgFig(M[1].src, 'Master plan · area', tag, false, 6) : '', dpSheetFig(a, tag, 7));
  else figs.push(M[0] ? dpImgFig(M[0].src, 'Master plan', tag, false, 1) : '', air(0.05, 'Close-up', 2), air(0.16, 'Around it', 3), dpStockFig(a, tag, 4), ...dpShotFigs(a, tag, 4.5),
   M[1] ? dpImgFig(M[1].src, 'Master plan · area', tag, false, 5) : '', air(1, 'Whole site', 6), dpSheetFig(a, tag, 7));
 } else {
  const all = rows.map(pt).filter(Boolean);
  if (all.length > 1) figs.push(dpAirFig(all, 0, doc === 'drv' ? 'Every drop on this load' : 'Every unit on this load', '', 1));
  rows.forEach((r, j) => { const a = r.a, p = pt(r), M = dpMasterImgs(a);
   if (M.length) figs.push(dpImgFig(M[0].src, 'Master plan', a.key, false, 2 + j / 100));
   else if (p) figs.push(dpAirFig([p], 0.05, 'Close-up', a.key, 2 + j / 100));
   else { const s = dpSheetFig(a, a.key, 2 + j / 100); if (s) figs.push(s); }
  });
  rows.forEach((r, j) => { const p = pt(r); if (p && dpMasterImgs(r.a).length) figs.push(dpAirFig([p], 0.05, 'Close-up', r.a.key, 3 + j / 100)); });
 }
 const F = figs.filter(Boolean);
 if (!F.length) return `<div class="dp-pics" style="--c:1;--r:1"><figure class="dp-fig"><div class="dp-win"><span class="dp-miss">No picture held in the record</span></div><figcaption>No picture</figcaption></figure></div>`;
 return `<div class="dp-pics">${F.join('')}</div>`;
}
/* ---------- the page furniture */
function dpHeader(d, g, doc, i, n){
 const col = g.kind === 'removals';
 const word = doc === 'drv' ? (col ? 'Collection' : 'Delivery') : (col ? 'Removal' : 'Install');
 return `<header class="dp-hd"><div class="dp-hd-l"><b>Coates</b><span>Industrial Solutions</span></div>
 <div class="dp-hd-m"><span>${esc(DP_DOC[doc].kick)} · GC500 2026</span><h1>${esc(word)} · ${esc(fmtDate(d.iso))}</h1></div>
 <div class="dp-hd-r"><b>${esc(DP_DOC[doc].id)}</b><span class="dp-lx">Load ${i} of ${n}</span></div></header>`;
}
function dpHero(d, g, doc){
 const col = g.kind === 'removals';
 const lab = doc === 'drv' ? (col ? 'Collect' : 'Deliver') : (col ? 'Remove' : 'Install');
 const f = (k, v) => `<div class="dp-f"><label>${k}</label>${v}</div>`;
 const val = (v, w) => v ? `<b>${esc(v)}</b>${w ? `<span>${esc(w)}</span>` : ''}` : dpWr();
 const arr = ((DATA.transport || {}).arrival || {}).after;
 return `<div class="dp-hero"><div class="dp-refs"><span class="dp-lab">${esc(lab)}${g.rows.length > 1 ? ' · ' + g.rows.length + ' refs' : ''}</span><div class="dp-refg">${
  g.rows.map(r => `<div class="dp-ref"><b>${esc(r.a.key)}</b><span>${esc(dpHeroLine(r, g.rows.length))}</span></div>`).join('')}</div></div>
 <div class="dp-facts">${f('Date', val(fmtDate(d.iso)))}${f(doc === 'drv' ? 'Load time' : 'Truck leaves', val(g.time, g.time ? (g.basis === 'plan' ? 'transport plan' : 'Kingston') : ''))}${
  f('Carrier', val(g.carrier))}${f('On site', val(arr ? 'After ' + arr : ''))}${f('Load', `<b class="dp-sm1">${esc(dpBasisShort(g))}</b>`)}</div></div>`;
}
function dpHeroLine(r, n){
 const what = dpItemsWords(r), where = whereText(r.a).main || '';
 return n > 2 ? (dpItems(r).map(x => x.item).join(', ') || r.a.name || '') : [what, where].filter(Boolean).join(' → ');
}
function dpTruck(g, doc){
 const one = g.rows.length === 1;
 return `<table class="dp-tbl"><thead><tr>${one ? '' : '<th class="dp-c1">Ref</th>'}<th>What</th><th>Asset no.</th><th>${doc === 'ins' ? 'Accessories · tick when fitted' : 'Also on it'}</th></tr></thead><tbody>${g.rows.map(r => {
  const acc = dpAcc(r.a), nums = dpNums(r.a), what = dpItemsWords(r);
  const sub = ((rentalOf(r.a.key) || {}).subhires || []).length;
  return `<tr>${one ? '' : `<td class="dp-rk">${esc(r.a.key)}</td>`}<td><b>${what ? esc(what) : ''}</b>${what ? '' : dpWr()}<span>${esc([r.a.name, r.a.discipline].filter(Boolean).join(' · '))}</span></td>
  <td>${nums.length ? nums.map(x => `<b class="dp-num">${esc(x)}</b>`).join(' ') : (sub ? '<span>Subhired · no Coates number</span>' : '') + dpWr()}</td>
  <td>${acc.length ? acc.map(x => doc === 'ins' ? `<span class="dp-acc">${dpBx()}${esc((x.q > 1 ? x.q + ' × ' : '') + x.t)}</span>` : esc((x.q > 1 ? x.q + ' × ' : '') + x.t)).join(doc === 'ins' ? '' : ' · ') : '<span>None on the schedule</span>'}</td></tr>`; }).join('')}</tbody></table>`;
}
/* where it goes: one short line per fact, the navigate code and the position beside them */
function dpWhere(g, doc, posOf){
 const one = g.rows.length === 1;
 const list = xs => xs && xs.length ? `<b>${esc(xs.join(', '))}</b>` : dpWr();
 const line = (k, v, wide) => `<div class="dp-l${wide ? ' dp-w' : ''}"><label>${k}</label><div>${v}</div></div>`;
 const gate = heavyGate(), rules = DATA.driver_rules || {};
 if (one) {
  const r = g.rows[0], a = r.a, m = masterLoc(a.key) || {}, w = whereText(a), link = (a.drawing_links || [])[0], P = posOf(a), W = dpPosWords(P), q = dpNavQr(P);
  const orient = dpNotes(r).filter(x => /orient|facing|face[sd]?\b|door|window|toward|back to/i.test(x));
  const L = [line('Location', w.main ? `<b class="dp-big">${esc(w.main)}</b>` : dpWr()), line('Sector', m.sec ? `<b>${esc(m.sec)}</b>` : dpWr())];
  if (doc === 'ins') L.push(line('Callout', link ? `<b>${esc(link.label)}</b> <span>on ${esc(link.sheet)}</span>` : dpWr()));
  L.push(line('Next to', list(m.next)), line('Beside', list(m.beside)), line('Near', list(m.near)));
  if (doc === 'ins') L.push(line('Door faces', orient.length ? `<b>${esc(orient.join(' · '))}</b>` : dpWr()));
  else {
   const b = gate && P.pt && gate.ax != null ? bearingBetween(gate.ax, gate.ay, P.pt.ax, P.pt.ay) : null;
   L.push(line('From gate', b ? `<b>${esc(b.compass)}${b.metres != null ? ', about ' + esc(fmtMetres(b.metres)) : ''}</b>` : dpWr()));
   L.push(line('Way in', `<b>${esc(dpWayIn(gate))}</b>`, true));
   if (rules.escort) L.push(line('Escort', `<b>${esc(rules.escort.replace(/\.$/, ''))}</b>`, true));
  }
  return `<div class="dp-where"><div class="dp-lines">${L.join('')}</div>${dpPosBox(P, W, q)}</div>`;
 }
 const rowsHtml = g.rows.map(r => { const a = r.a, m = masterLoc(a.key) || {}, w = whereText(a), link = (a.drawing_links || [])[0], P = posOf(a), W = dpPosWords(P), q = dpNavQr(P);
  const by = dpUniq([].concat(m.next || [], m.beside || []));
  return `<tr><td class="dp-rk">${esc(a.key)}</td><td><b>${w.main ? esc(w.main) : ''}</b>${w.main ? '' : dpWr()}${m.sec ? `<span>Sector ${esc(m.sec)}</span>` : ''}</td>
  ${doc === 'ins' ? `<td>${link ? `<b>${esc(link.label)}</b><span>${esc(link.sheet)}</span>` : dpWr()}</td>` : ''}<td>${by.length ? esc(by.join(', ')) : dpWr()}</td>
  <td><span class="dp-ll">${esc(W.ll)}</span><span>${esc(W.line)}</span></td><td class="dp-qc">${q ? `<div class="dp-qr">${q}</div>` : dpWr()}</td></tr>`; }).join('');
 const top = doc === 'drv' ? `<div class="dp-way"><b>${esc(dpWayIn(gate))}</b>${rules.escort ? ` · <b>${esc(rules.escort.replace(/\.$/, ''))}</b>` : ''}</div>` : '';
 return `${top}<table class="dp-tbl dp-wtbl"><thead><tr><th class="dp-c1">Ref</th><th>Location</th>${doc === 'ins' ? '<th>Callout</th>' : ''}<th>Next to · beside</th><th>Position</th><th class="dp-qc">Navigate</th></tr></thead><tbody>${rowsHtml}</tbody></table>`;
}
function dpWayIn(gate){
 const g = gate ? tidyNote(gate.text).split(',')[0].toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : '';
 return 'Sundale Bridge' + (g ? ' → ' + g + (gate.gate ? ', gate ' + gate.gate : '') : '');
}
function dpPosBox(P, W, q){
 return `<div class="dp-pos">${q ? `<div class="dp-qr">${q}</div>` : ''}<div class="dp-pos-t"><label>${esc(W.label)}</label>${W.ll ? `<b class="dp-ll">${esc(W.ll)}</b>` : dpWr()}<span>${esc(W.line)}</span>${q ? '<em>Scan to navigate</em>' : ''}</div></div>`;
}
/* the crew's install list: the work list of the Coates Installs pre-start, the items this load needs */
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
 const items = order.filter(k => sets.some(s => s.has(k))).map(k => {
  const on = g.rows.filter((r, j) => sets[j].has(k)).map(r => r.a.key);
  return {label: lab(k), refs: g.rows.length > 1 && on.length < g.rows.length ? on.join(', ') : ''}; });
 ['Arrival recorded in the page', 'Photos uploaded to the page', 'Asset numbers recorded in the page'].forEach(x => items.push({label: x, refs: ''}));
 return `<div class="dp-work">${items.map(x => `<span>${dpBx()}${esc(x.label)}${x.refs ? ` <em>${esc(x.refs)}</em>` : ''}</span>`).join('')}</div>`;
}
/* safety: the driver's JSEA (driver pages only), the Take 5 (both), and the Coates Life Saving Rules word for word */
function dpSafe(doc){
 const t5 = '<div class="dp-box dp-t5"><b>TAKE 5</b><p>Take 5 before every new task. Stop, look, assess, control, then proceed — before each new task and again whenever the job or conditions change (a new unit, a new position, a new crew member, weather, the public).</p></div>';
 const jsea = '<div class="dp-box dp-jsea"><b>JSEA REQUIRED</b><p>The driver must complete a Job Safety and Environmental Analysis (JSEA) before unloading. This applies to every load. No JSEA, no unload.</p></div>';
 return `<div class="dp-safe${doc === 'drv' ? ' dp-two' : ''}">${doc === 'drv' ? jsea : ''}${t5}</div>${dpLife()}`;
}
function dpLife(){
 const L = (typeof PS7 !== 'undefined' && PS7.life) || [];
 if (!L.length) return '';
 return `<div class="dp-lsr"><div class="dp-lsr-h">COATES LIFE SAVING RULES — read and followed on every task</div><div class="dp-lsr-g">${
  L.map(([n, c, w]) => `<div class="dp-lsrow"><span class="dp-lsrn ${esc(c)}">${esc(n)}</span><span class="dp-lsrt">${esc(w)}</span></div>`).join('')}</div></div>`;
}
function dpRulesLine(){
 const r = DATA.driver_rules || {}, bits = [];
 if ((r.ppe || []).length) bits.push('PPE: ' + r.ppe.join(', '));
 const notes = ((DATA.access || {}).general_notes || []).map(tidyNote).join(' ');
 const sp = [/(\d+)\s?km\S*\s+on track/i, /(\d+)\s?km\S*\s+within macintosh park/i].map(re => (notes.match(re) || [])[1]);
 if (sp[0] || sp[1]) bits.push([sp[0] ? sp[0] + ' km/h on track' : '', sp[1] ? sp[1] + ' km/h in Macintosh Park' : ''].filter(Boolean).join(', '));
 const site = DATA.site || {};
 if (site.hours) bits.push('Site hours ' + site.hours + (site.hours_days ? ' ' + site.hours_days : ''));
 return bits.length ? `<div class="dp-rline">${bits.map(esc).join('<i>·</i>')}</div>` : '';
}
function dpContacts(doc){
 const P = ((typeof TEAM !== 'undefined' && TEAM.people) || (DATA.team || {}).people || []);
 const tel = p => p.mobile || p.phone, rows = [];
 P.filter(p => tel(p) && (p.group === 'site' || p.lead)).forEach(p => rows.push({role: 'Coates site', name: p.name, tel: tel(p)}));
 if (doc === 'ins') P.filter(p => tel(p) && p.group === 'install').forEach(p => rows.push({role: 'Installer', name: p.name, tel: p.mobile || p.phone}));
 else P.filter(p => (p.phone || p.mobile) && p.group === 'office').slice(0, 1).forEach(p => rows.push({role: 'Coates office', name: p.name, tel: p.phone || p.mobile}));
 ((DATA.site || {}).contacts || []).filter(c => c.phone).forEach(c => rows.push({role: 'iEDM ' + String(c.role).replace(/ & Traffic Coordinator/, ' & traffic').toLowerCase(), name: c.name, tel: c.phone}));
 return `<div class="dp-con">${rows.map(c => `<span><i>${esc(c.role)}</i>${esc(c.name)} <b>${esc(c.tel)}</b></span>`).join('')}<span class="dp-000"><i>Emergency</i><b>000</b></span></div>`;
}
function dpFoot(d, doc, i, n){
 let asOf = ''; try { asOf = recordsAsOf(); } catch (e) { asOf = ''; }
 if (!/^\d|^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/.test(asOf)) asOf = '';
 return `<div class="dp-ft"><span><b>${esc(DATA.brand.org || 'Coates Industrial Solutions')} · GC500 2026 · Author: ${esc(DATA.brand.author || 'Andrew Fisher')}</b></span>
 <span>${asOf ? 'From the GC500 record, ' + esc(asOf) + ' · ' : ''}A ruled line means not yet recorded</span><span>${esc(DP_DOC[doc].id)} · ${esc(fmtDate(d.iso))} · Load ${i} of ${n}</span></div>`;
}
function dpSec(h, body, cls){ return `<section class="dp-sec${cls ? ' ' + cls : ''}"><h2>${h}</h2>${body}</section>`; }
function dpPage(d, g, doc, i, n){
 const cache = new Map(), posOf = a => { if (!cache.has(a.key)) cache.set(a.key, dpPos(a)); return cache.get(a.key); };
 const secs = [dpSec('On the truck', dpTruck(g, doc)), dpSec('Where it goes', dpWhere(g, doc, posOf)), dpSec('Photos', dpPics(g, doc, posOf), 'dp-ph')];
 if (doc === 'ins') secs.push(dpSec(g.kind === 'removals' ? 'Removal list' : 'Install list', dpWork(g)));
 secs.push(dpSec('Safety', (doc === 'drv' ? dpRulesLine() : '') + dpSafe(doc)), dpSec('Documents', dpDocsHtml(g, doc)), dpSec('Contacts', dpContacts(doc)));
 return `<div class="dp-page dp-${doc}" data-load="${i}">${dpHeader(d, g, doc, i, n)}${dpHero(d, g, doc)}${secs.join('')}${dpFoot(d, doc, i, n)}</div>`;
}
/* ---------- cutting the pictures at the size they landed, then fitting the page */
function dpFail(w, why){
 if (!w.querySelector('.dp-miss')) w.insertAdjacentHTML('beforeend', `<span class="dp-miss">${esc(why || 'Picture not available')}</span>`);
 const im = w.querySelector('img'); if (im) im.remove();
 w.dataset.failed = '1';
}
function dpRings(w, pts, g, cx, cy, W, H){
 const x0 = cx * W - g.rx / 100 * g.winW, y0 = cy * H - g.ry / 100 * g.winH;
 w.querySelectorAll('.dp-ring').forEach(e => e.remove());
 pts.forEach(p => { const l = (p[0] * W - x0) / g.winW * 100, t = (p[1] * H - y0) / g.winH * 100;
  if (l < -2 || l > 102 || t < -2 || t > 102) return;
  w.insertAdjacentHTML('beforeend', `<i class="dp-ring${pts.length > 1 ? ' dp-rs' : ''}${l > 72 ? ' dp-rl' : ''}" style="left:${l.toFixed(2)}%;top:${t.toFixed(2)}%">${pts.length > 1 && p[2] ? '<i>' + esc(p[2]) + '</i>' : ''}</i>`); });
}
function dpCut(root){
 const sheets = [...root.querySelectorAll('.dp-sheet')], air = [...root.querySelectorAll('.dp-air')];
 const pS = Promise.all(sheets.map(w => { const b = w.getBoundingClientRect(), img = w.querySelector('img');
  if (!img || !(b.width > 0 && b.height > 0)) return null;
  const fx = +w.dataset.fx, fy = +w.dataset.fy, f = +w.dataset.f;
  return sheetSrc(w.dataset.sheet).then(src => { const g = cutWindow(img, src, src.naturalWidth, src.naturalHeight, fx, fy, f, b, 0.82);
   dpRings(w, [[fx, fy, '']], g, fx, fy, src.naturalWidth, src.naturalHeight); }, () => dpFail(w, 'The drawing could not be loaded')); }));
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
 }, () => air.forEach(w => dpFail(w, 'The aerial photograph could not be loaded')));
 return Promise.all([pS, pA]);
}
/* a photograph or a drawing held on the service is embedded whole by the printer, so each is redrawn at the size it prints */
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
/* the reference fills its band: as large as the width and the height allow, never above 120 pt */
function dpHeroFit(pg){
 const G = pg.querySelector('.dp-refg'); if (!G) return;
 const refs = [...G.children], n = refs.length, cols = n <= 3 ? n : Math.ceil(n / 2), rows = Math.ceil(n / cols);
 G.style.setProperty('--cols', String(cols));
 const bs = refs.map(r => r.querySelector('b')); bs.forEach(b => { b.style.fontSize = '100px'; });
 const cap = refs[0].querySelector('span'), capH = cap && cap.textContent ? cap.getBoundingClientRect().height : 0;
 const gap = 4 * 96 / 25.4, W = G.clientWidth, H = G.clientHeight, cw = (W - gap * (cols - 1)) / cols, ch = H / rows - capH;
 const wide = Math.max(...bs.map(b => b.getBoundingClientRect().width));
 const px = Math.max(20, Math.min(120 * 96 / 72, 100 * cw * 0.97 / wide, ch / 0.8));
 bs.forEach(b => { b.style.fontSize = px.toFixed(1) + 'px'; });
 pg.dataset.heroPt = String(Math.round(px * 72 / 96));
 /* a band wider than it is tall for its references gives the height it does not need back to the photos */
 const hero = pg.querySelector('.dp-hero'), need = Math.max(...refs.map(r => r.getBoundingClientRect().height)) * rows + (H > 0 ? hero.getBoundingClientRect().height - H : 0) + 2;
 if (need < hero.getBoundingClientRect().height - 4) hero.style.flexBasis = Math.max(34 * 96 / 25.4, need).toFixed(1) + 'px';
}
/* the photos in an even grid: the columns and rows that give the most pictures at a useful size */
function dpGrid(pg){
 const pics = pg.querySelector('.dp-pics'); if (!pics) return;
 const MM = 96 / 25.4, b = pics.getBoundingClientRect(), W = b.width, H = b.height, gap = 2 * MM, capH = 4.6 * MM;
 const figs = [...pics.children].filter(x => x.classList.contains('dp-fig'));
 if (!(W > 0 && H > 0)) return;
 const byPr = figs.slice().sort((x, y) => (+x.dataset.pr || 9) - (+y.dataset.pr || 9));
 let pick = null;
 for (let c = 1; c <= 4; c++) for (let r = 1; r <= 2; r++) {
  const k = Math.min(c * r, figs.length); if (k < c * r && !(k === figs.length && c * r - k < c)) continue;
  const cw = (W - gap * (c - 1)) / c, ch = (H - gap * (r - 1)) / r - capH;
  const s = Math.min(cw / 1.25, ch), score = (s >= 36 * MM ? 1000 + k * 20 : 0) + s / MM;
  if (!pick || score > pick.score) pick = {c, r, k, score};
 }
 const keep = new Set(byPr.slice(0, pick.k));
 figs.forEach(f => { if (!keep.has(f)) f.remove(); });
 pics.style.setProperty('--c', String(pick.c)); pics.style.setProperty('--r', String(Math.ceil(pick.k / pick.c)));
}
function dpFit(root){
 const MM = 96 / 25.4, over = [];
 root.querySelectorAll('.dp-page').forEach(pg => {
  dpHeroFit(pg);
  const pics = pg.querySelector('.dp-pics'), min = 52 * MM;
  const ov = () => pg.scrollHeight > pg.clientHeight + 1, small = () => pics && pics.getBoundingClientRect().height < min;
  let k = 1; pg.style.setProperty('--k', '1');
  const step = () => { k = Math.round((k - 0.02) * 100) / 100; pg.style.setProperty('--k', String(k)); };
  while ((ov() || small()) && k > 0.8) step();
  while (ov() && k > 0.64) step();
  if (ov()) over.push('load ' + pg.dataset.load);
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
/* print the day: one page per load. From a link (#print/drivers/<iso>) the pages stay on screen under a bar with a
   Print / Save as PDF button, for the browser that will not open the print dialog by itself. */
function dpPrint(iso, doc, o){
 const link = !!(o && o.link);
 const d = programmeDays().find(x => x.iso === iso);
 if (!d) { flash('That day is outside the programme.'); if (link) dpBarSay('That day is outside the programme.', false); return; }
 const loads = dpLoads(d);
 if (!loads.length) { flash('Nothing is scheduled to move on ' + fmtDate(iso) + ', so there is nothing to print.'); if (link) dpBarSay('Nothing is scheduled to move on ' + fmtDate(iso) + '.', false); return; }
 flash('Preparing ' + loads.length + ' page' + (loads.length === 1 ? '' : 's') + ', one per load.');
 dpWaitDocs().then(() => {
  const pages = loads.map((g, i) => dpPage(d, g, doc, i + 1, loads.length));
  const wrap = document.getElementById('dayprint') || (() => { const e = document.createElement('div'); e.id = 'dayprint'; document.body.appendChild(e); return e; })();
  wrap.innerHTML = pages.join(''); wrap.classList.remove('ps7wrap'); wrap.classList.add('dpwrap'); wrap.dataset.dpReady = '';
  document.querySelectorAll('#dayPage').forEach(e => e.remove());
  const st = document.createElement('style'); st.id = 'dayPage'; st.textContent = '@page{size:A4 portrait;margin:8mm}';
  document.head.appendChild(st);
  document.body.classList.add('printing-day');
  const done = () => { st.remove(); wrap.classList.remove('dpwrap'); document.body.classList.remove('printing-day'); };
  if (link) DPBAR.done = done; else window.addEventListener('afterprint', done, {once: true});
  const imgs = () => Promise.all([...wrap.querySelectorAll('.dp-win img')].map(im => (im.complete && im.naturalWidth) ? 'ok'
   : new Promise(res => { const t = setTimeout(() => res('failed'), 6000); im.addEventListener('load', () => { clearTimeout(t); res('ok'); }, {once: true}); im.addEventListener('error', () => { clearTimeout(t); res('failed'); }, {once: true}); })));
  let settled = false;
  const go = () => { if (!document.getElementById('dayPage')) return; wrap.dataset.dpReady = '1'; try { window.print(); } catch (e) { if (!link) done(); } };
  /* from a link the bar carries the verdict and the button; the pages are on screen either way */
  const linkReady = r => { wrap.dataset.dpReady = '1';
   dpBarSay(DP_DOC[doc].kick + ' · ' + fmtDate(iso) + ' · ' + loads.length + ' page' + (loads.length === 1 ? '' : 's')
    + (r.failed ? ' · ' + r.failed + ' picture' + (r.failed === 1 ? '' : 's') + ' could not be loaded' : '') + (r.over && r.over.length ? ' · ' + r.over.length + ' page' + (r.over.length === 1 ? '' : 's') + ' run long' : ''), true);
   try { window.print(); } catch (e) {} };
  const finish = r => { if (settled) return; settled = true; window.__dpLast = r; if (link) linkReady(r); else if (!r.failed && !r.over.length) go(); else { wrap.dataset.dpReady = 'ask'; printAsk(r, go, done); } };
  (document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => null) : Promise.resolve())
   .then(() => imgs())
   .then(() => { wrap.querySelectorAll('.dp-img img').forEach(im => { if (!(im.complete && im.naturalWidth)) dpFail(im.parentNode); }); dpFit(wrap); dpShrink(wrap); return dpCut(wrap); })
   .then(() => imgs())
   .then(() => ({failed: wrap.querySelectorAll('[data-failed="1"]').length, over: (wrap.__over || []).slice(), pages: pages.length}))
   .then(finish).catch(() => finish({timeout: true, failed: 0, over: []}));
  setTimeout(() => { if (!settled) { settled = true; if (link) { linkReady({timeout: true, failed: 0, over: []}); return; } wrap.dataset.dpReady = 'ask'; printAsk({timeout: true, failed: 0, over: []}, go, done); } }, 20000);
 });
}
/* ---------- the links in the email: #print/drivers/<iso>, #print/install/<iso>, #print/prestart/<iso> open the day and
   its document, with a Print / Save as PDF button in case the browser does not open the print dialog itself */
const DPBAR = {kind: null, iso: null, done: null};
function dpBarSay(msg, ready){
 const b = document.getElementById('dpbar'); if (!b) return;
 b.querySelector('.dpbar-t').textContent = msg;
 const p = b.querySelector('[data-dpbar-print]'); p.disabled = !ready;
}
function dpBarClose(){
 const b = document.getElementById('dpbar'); if (b) b.remove();
 document.body.classList.remove('dpbar-on');
 if (DPBAR.done) { try { DPBAR.done(); } catch (e) {} DPBAR.done = null; }
 document.querySelectorAll('#dayPage').forEach(e => e.remove());
 const w = document.getElementById('dayprint'); if (w) w.classList.remove('dpwrap', 'ps7wrap');
 document.body.classList.remove('printing-day');
 document.querySelectorAll('.printask').forEach(e => e.remove());
 const iso = DPBAR.iso; DPBAR.kind = DPBAR.iso = null;
 if (iso) { try { setHash('day/' + iso); } catch (e) {} try { render(); } catch (e) {} }
}
function dpFromLink(kind, iso){
 document.querySelectorAll('#dpbar').forEach(e => e.remove());
 DPBAR.kind = kind; DPBAR.iso = iso;
 const bar = document.createElement('div'); bar.id = 'dpbar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Print this document');
 bar.innerHTML = `<span class="dpbar-t">Preparing ${esc(DP_MAIL[kind] || '')} · ${esc(fmtDate(iso))}</span><button class="btn primary" type="button" data-dpbar-print disabled>Print / Save as PDF</button><button class="btn" type="button" data-dpbar-x>Close</button>`;
 document.body.appendChild(bar); document.body.classList.add('dpbar-on');
 bar.querySelector('[data-dpbar-x]').onclick = dpBarClose;
 bar.querySelector('[data-dpbar-print]').onclick = () => { if (kind === 'prestart') ps7Print(iso); else window.print(); };
 /* the shared record first (the pins and the documents come from it), then the document */
 const t0 = Date.now();
 const ready = () => typeof SYNC === 'undefined' || !SYNC.on || SYNC.status === 'live' || SYNC.status === 'unreachable' || Date.now() - t0 > 8000;
 const start = () => {
  if (kind === 'prestart') { const d = ps7Day(iso); if (!d) { dpBarSay('That day is outside the programme.', false); return; }
   dpBarSay(DP_MAIL.prestart + ' · ' + fmtDate(iso) + ' · 1 page', true); ps7Print(iso); }
  else dpPrint(iso, kind === 'install' ? 'ins' : 'drv', {link: true});
 };
 const wait = () => ready() ? setTimeout(start, 300) : setTimeout(wait, 200);
 wait();
}
