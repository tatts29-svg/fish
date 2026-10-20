/* v7.07 - THE DAY'S DOCUMENTS AS REAL PDF FILES, ONE PER LOAD. The project manager, 27 Sep 2026, on an Android phone:
 "Each box needs a drop-down and print either all or you select the PDF to print. None align, none fit. They need to be
 PDFs, one for each. Same with the email: attaches it to their Outlook."

 WHY FILES: a phone prints a web page its own way - its own paper size (Letter by default on his), its own scale, its
 own margins - so the same sheet came out a different size on every phone. A PDF page is a fixed size. Each sheet is
 now laid out and fitted exactly as before (dpPrint, one A4 page per load, at the paper's width), then photographed at
 240 dpi (html-to-image, which draws the page through the browser's own renderer) and set on an A4 page at the
 paper's own margins (jsPDF), so it prints 1:1 on A4. The QR codes are laid over their own pictures as vector squares
 at the same place and size, so they scan however the PDF is printed. The PDFs are pictures of the sheets and say
 nothing the sheets do not.

 Every tile on the plate is a drop-down. Pre-start: the one page. Drivers and Install: All loads (one PDF per load, and
 one file with every page to print in one go), or one load by its references. Email: the per-load PDFs, attached
 through the phone's share sheet (Outlook), with a short plain note and NO LINKS (the project manager, 27 Sep 2026: "We
 are emailing the PDFs. No link."), in parts of up to 10 files and about 18 MB; where a browser cannot attach files,
 the PDFs are saved and the email opens with the same note. The preview of v7.06 stays behind "Open as a web page
 instead". Each page is photographed at 240 dpi and kept to about 0.5-0.75 MB.

 The two libraries are in this page, not fetched: html-to-image 1.11.13 and jsPDF 4.2.1 (MIT), each in a
 <script type="text/plain"> block that is run the first time a PDF is made, so the page loads no slower. */
const DP_PLATE_ICO = {
 ps: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM9 13l2 2 4-4"/></svg>',
 drv: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 6h11v10H2zM13 9h4l4 4v3h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
 ins: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17h18M5 17v-2a7 7 0 0 1 14 0v2M10 8V5h4v3"/></svg>',
 mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
};
function dpPlate(days, sel){
 const L = days || [], d = L.find(x => x.iso === sel);
 if (!d) return '';
 const iso = esc(d.iso), f = fmtDay(d.iso), ps = dpPs(d.iso), today = todayIso();
 let loads = []; try { loads = dpLoads(d); } catch (e) { loads = []; }
 const n = loads.length, pdfs = k => k + ' PDF' + (k === 1 ? '' : 's');
 const face = (ico, word, sub) => `<span class="dpt-i">${ico}</span><span class="dpt-w">${word}</span><span class="dpt-s">${sub}</span>`;
 const off = (ico, word, sub, why) => `<button type="button" class="dpt dp-off" aria-disabled="true" data-ps7-later="${esc(why)}" title="${esc(why)}">${face(ico, word, esc(sub))}</button>`;
 const dd = (ico, word, sub, title, rows) => `<details class="dpm"><summary class="dpt" aria-haspopup="menu" title="${esc(title)}">${face(ico, word + ' ▾', esc(sub))}</summary><div class="dpmail-m dpm-m" role="menu">${rows}</div></details>`;
 const psNone = d.iso < today ? 'Not for a day gone by' : 'None for this day', psWhy = ps.state === 'later' ? dpPsLater(ps) : psNone;
 const pre = ps.state === 'ready'
  ? dd(DP_PLATE_ICO.ps, 'Pre-start', '1 page · ready', 'The Coates Installs daily pre-start for this day, as an A4 PDF',
   `<button type="button" role="menuitem" class="dpm-r dpm-all" data-pdf7="prestart" data-iso="${iso}"><b>Pre-start</b><span>1 page</span><em>One A4 PDF to open, print, email or save</em></button>`)
  : off(DP_PLATE_ICO.ps, 'Pre-start', ps.state === 'later' ? 'Ready ' + ps7Words(ps.batch) : psNone, psWhy);
 /* Drivers and Install: all loads, or one load by its references - each load its own PDF */
 const menu = (kind, ico, word) => {
  if (!n) return off(ico, word, 'Nothing moves this day', 'Nothing is scheduled to move on this day');
  const rows = loads.map((g, i) => {
   const refs = g.rows.map(r => r.a.key).join(' · '), when = [g.time, g.carrier].filter(Boolean).join(' · ');
   return `<button type="button" role="menuitem" class="dpm-r" data-pdf7="${kind}" data-iso="${iso}" data-only="${i}"><b>Load ${i + 1}</b><span>${esc(refs)}</span>${when ? `<em>${esc(when)}</em>` : ''}</button>`;
  }).join('');
  const all = `<button type="button" role="menuitem" class="dpm-r dpm-all" data-pdf7="${kind}" data-iso="${iso}"><b>All loads</b><span>${pdfs(n)}, one per load</span><em>${n > 1 ? 'And one file with all ' + n + ' pages, to print in one go' : 'One A4 page'}</em></button>`;
  return dd(ico, word, n + ' load' + (n === 1 ? '' : 's') + ' · ' + pdfs(n), 'All loads, or one load, as A4 PDFs', all + rows);
 };
 /* Email: the same PDFs, attached; the email text can still be copied */
 const mrow = (k, w, dis) => `<div class="dpmail-r"><button type="button" role="menuitem" class="dpmail-go${dis ? ' dp-off' : ''}" data-pdf7="${k}" data-iso="${iso}" data-mail="1"${dis ? ` aria-disabled="true" title="${esc(dis)}"` : ''}>${w}</button><button type="button" role="menuitem" class="dpmail-cp" data-dpcopy="${k}" data-iso="${iso}">Copy the email text</button></div>`;
 const mailRows = (ps.state === 'ready' || ps.state === 'later' ? mrow('prestart', 'Pre-start · 1 PDF', ps.state === 'later' ? dpPsLater(ps) : '') : '')
  + (n ? mrow('drivers', 'Drivers · all ' + n + ' load' + (n === 1 ? '' : 's')) + mrow('install', 'Install · all ' + n + ' load' + (n === 1 ? '' : 's')) : '');
 const mail = mailRows ? dd(DP_PLATE_ICO.mail, 'Email', 'Attach the PDFs', 'Email the PDFs, attached (no links)', mailRows)
  : off(DP_PLATE_ICO.mail, 'Email', 'Nothing to send', 'Nothing to send for this day');
 return `<section class="dplate" aria-label="Day documents, ${esc(fmtDate(d.iso))}"><span class="dplate-k">Day documents<b>${esc(f.dm)}</b></span>${pre}${menu('drivers', DP_PLATE_ICO.drv, 'Drivers')}${menu('install', DP_PLATE_ICO.ins, 'Install')}${mail}</section>`;
}
/* the plate sits under the banner picture (the car), above the day's figures */
function dpHeadWithPlate(days, sel){
 const h = paneHeadingHtml('timeline'), plate = dpPlate(days, sel);
 const f = h.lastIndexOf('</figure>'), k = f >= 0 ? f + 9 : h.indexOf('</h2>') + 5;
 return k < 5 ? h + plate : h.slice(0, k) + plate + h.slice(k);
}
/* the web-page preview (the fallback), on a phone, scaled to fit the screen - on screen only */
function dpZoomFit(){
 const w = document.getElementById('dayprint'); if (!w) return;
 w.style.setProperty('--dpz', '1');
 const vw = document.documentElement.clientWidth, sw = w.scrollWidth;
 w.style.setProperty('--dpz', String(sw > vw ? Math.max(0.3, Math.floor((vw - 12) / sw * 1000) / 1000) : 1));
}
function dpWirePlate(pane){
 pane.classList.toggle('has-dplate', !!pane.querySelector('.dplate'));
 pane.querySelectorAll('.dplate [data-pdf7]').forEach(b => b.onclick = () => {
  const dt = b.closest('details'); if (dt) dt.open = false;
  if (b.getAttribute('aria-disabled') === 'true') { flash((b.title || 'Not ready yet') + '.'); return; }
  pdf7Open(b.dataset.pdf7, b.dataset.iso, b.dataset.only != null && b.dataset.only !== '' ? +b.dataset.only : null, b.dataset.mail === '1');
 });
 pane.querySelectorAll('.dplate [data-dpcopy]').forEach(b => b.onclick = () => { const dt = b.closest('details'); if (dt) dt.open = false; pdf7Copy(b.dataset.dpcopy, b.dataset.iso); });
 pane.querySelectorAll('.dplate details').forEach(dt => dt.addEventListener('toggle', () => {
  if (!dt.open) return;
  pane.querySelectorAll('.dplate details[open]').forEach(o => { if (o !== dt) o.open = false; });
  const m = dt.querySelector('.dpmail-m'); if (!m) return;
  m.style.left = '0px'; m.style.right = 'auto';
  const r = m.getBoundingClientRect(), vw = document.documentElement.clientWidth;
  if (r.right > vw - 8) m.style.left = (vw - 8 - r.right) + 'px';
  const r2 = m.getBoundingClientRect(); if (r2.left < 8) m.style.left = (parseFloat(m.style.left) + 8 - r2.left) + 'px';
 }));
}
document.addEventListener('click', e => { document.querySelectorAll('details.dpm[open]').forEach(dt => { if (!dt.contains(e.target)) dt.open = false; }); });
window.addEventListener('resize', () => { if (document.body.classList.contains('dpbar-on')) dpZoomFit(); });

/* the navigate code in a table of several references: the same link, drawn with low error correction (L) and a
   2-square margin (the white cell gives it more), so at 12.5 mm it is 37 squares of 0.3 mm - 1.8 dots a square at
   150 dpi, where the 10 mm code of v7.00 was 1.2 and could not be read from a plain print. The table stays low enough
   for the photographs to keep their row. */
function dpNavQrT(P){
 if (P.lat == null || typeof qrcode !== 'function') return '';
 try { const q = qrcode(0, 'L'); q.addData(String(navUrl({lat: P.lat, lon: P.lon}))); q.make(); return q.createSvgTag({cellSize: 3, margin: 6, scalable: true}); } catch (e) { return ''; }
}
/* ---------- the PDF maker */
const PDF7 = {lib: null, font: null, job: 0, urls: [], files: null};
const PDF7_MM = 25.4 / 96;
const PDF7_FILE = {drivers: 'Drivers', install: 'Install', prestart: 'Prestart'};
const PDF7_KICK = {drivers: 'Driver sheets', install: 'Install team sheets', prestart: 'Daily pre-start'};
const PDF7_SHARE_MAX = 10, PDF7_MAIL_MAX = 18 * 1048576;   /* files in one share (Chrome), bytes in one email */
function pdf7Android(){ return /Android/i.test(navigator.userAgent || ''); }
/* the libraries: run once, from the blocks at the end of the page */
function pdf7Lib(){
 if (!PDF7.lib) PDF7.lib = new Promise((res, rej) => {
  try {
   if (!(window.htmlToImage && window.jspdf && window.jspdf.jsPDF)) ['pdf7-h2i', 'pdf7-jspdf'].forEach(id => {
    const src = document.getElementById(id); if (!src) throw new Error('the PDF maker is missing from this copy of the page');
    let code = src.textContent;
    /* html-to-image shrinks every font size to a whole pixel less 0.1 (a guard against text wrapping differently in
       its picture); the sheets are fitted to the fraction, so each size is kept exactly as the page laid it out */
    const hack = 'if("font-size"===n&&o.endsWith("px"))';
    if (id === 'pdf7-h2i' && code.split(hack).length === 2 && !(window.__pdf707opts && window.__pdf707opts.libFontHack)) code = code.replace(hack, 'if(!1)');
    const s = document.createElement('script'); s.textContent = code; document.head.appendChild(s);
   });
   if (!(window.htmlToImage && window.htmlToImage.toCanvas && window.jspdf && window.jspdf.jsPDF)) throw new Error('the PDF maker did not start');
   res({h2i: window.htmlToImage, jsPDF: window.jspdf.jsPDF});
  } catch (e) { PDF7.lib = null; rej(e); }
 });
 return PDF7.lib;
}
/* the style of each element is copied into its picture property by property: the real properties only, never the
   page's own variables (one of them holds the banner car as a picture, which made every page's picture 30 MB) */
const PDF7_SKIP = /^(animation|transition|scroll-|overscroll|scrollbar|view-transition|view-timeline|scroll-timeline|timeline-scope|anchor|position-anchor|position-try|position-visibility|will-change|touch-action|pointer-events|user-select|-webkit-user|cursor|caret|interactivity|interest|speak|app-region|field-sizing|resize$|overlay$|reading-|-webkit-tap|-webkit-highlight|math-|ruby-|contain-intrinsic|content-visibility|print-color-adjust|-webkit-print|dynamic-range|forced-color|accent-color|zoom$)/;
function pdf7Props(){
 /* and none that only matters to a moving, scrolling or clicked page: fewer to copy, the same picture */
 if (!PDF7.props) PDF7.props = [...getComputedStyle(document.documentElement)].filter(k => !k.startsWith('--') && !PDF7_SKIP.test(k));
 return PDF7.props;
}
function pdf7DataUrl(b){ return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(b); }); }
/* the page's own faces (Barlow Condensed, Inter), handed to the picture whole, so it never falls back to another font */
function pdf7FontCss(){
 if (!PDF7.font) {
  const H = (DATA.hostedMedia || {}).fonts || [], M = DATA.media || {};
  PDF7.font = !H.length ? Promise.resolve(null) : Promise.all(H.map(f => {
   const u = M[f.key]; if (typeof u !== 'string') return '';
   return (/^data:/.test(u) ? Promise.resolve(u) : fetch(u, {credentials: 'same-origin'}).then(r => r.ok ? r.blob() : Promise.reject(new Error('a font could not be loaded (' + r.status + ')'))).then(pdf7DataUrl)).then(src => '@font-face{font-family:' + JSON.stringify(f.family) + ';font-style:' + f.style + ';font-weight:' + f.weight + ';src:url(' + src + ') format("woff2")}');
  })).then(xs => xs.filter(Boolean).join('\n'));
  PDF7.font.catch(() => { PDF7.font = null; });
 }
 return PDF7.font;
}
/* the shared record first (the pins and the documents come from it), as the preview does */
function pdf7Sync(){
 const t0 = Date.now();
 return new Promise(res => { const ok = () => typeof SYNC === 'undefined' || !SYNC.on || SYNC.status === 'live' || SYNC.status === 'unreachable' || Date.now() - t0 > 8000;
  const w = () => ok() ? res() : setTimeout(w, 200); w(); });
}
function pdf7Imgs(root){
 return Promise.all([...root.querySelectorAll('img')].map(im => im.complete ? (im.decode ? im.decode().catch(() => null) : null)
  : new Promise(r => { const t = setTimeout(r, 6000); im.addEventListener('load', () => { clearTimeout(t); r(); }, {once: true}); im.addEventListener('error', () => { clearTimeout(t); r(); }, {once: true}); })));
}
/* the QR codes on a sheet: where each sits (mm from the sheet's corner) and its squares, read from the page's own code */
function pdf7Qrs(node){
 const base = node.getBoundingClientRect(), out = [];
 node.querySelectorAll('svg').forEach(sv => {
  const vb = (sv.getAttribute('viewBox') || '').trim().split(/\s+/).map(Number), p = sv.querySelector('path');
  if (vb.length !== 4 || !(vb[2] > 0) || !p) return;
  const d = p.getAttribute('d') || '', m = /^M(\d+),(\d+)l(\d+),0 0,\3 -\3,0 0,-\3z/.exec(d);
  if (!m) return;
  const cells = [], re = /M(\d+),(\d+)l/g; let k;
  while ((k = re.exec(d))) cells.push([+k[1], +k[2]]);
  const r = sv.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return;
  const xs = cells.map(z => z[0]), mods = Math.round((Math.max(...xs) - Math.min(...xs)) / +m[3]) + 1;
  out.push({x: (r.left - base.left) * PDF7_MM, y: (r.top - base.top) * PDF7_MM, w: r.width * PDF7_MM, h: r.height * PDF7_MM, size: vb[2], c: +m[3], cells, mods});
 });
 return out;
}
function pdf7DrawQr(doc, q, ox, oy){
 const u = Math.min(q.w, q.h) / q.size, x0 = ox + q.x, y0 = oy + q.y, seam = u * q.c * 0.02;
 doc.setFillColor(255, 255, 255); doc.rect(x0, y0, q.size * u, q.size * u, 'F');
 doc.setFillColor(0, 0, 0);
 const rows = new Map();
 q.cells.forEach(([x, y]) => { if (!rows.has(y)) rows.set(y, []); rows.get(y).push(x); });
 rows.forEach((xs, y) => {
  xs.sort((a, b) => a - b);
  let s = xs[0], p = xs[0];
  for (let i = 1; i <= xs.length; i++) {
   if (i < xs.length && xs[i] === p + q.c) { p = xs[i]; continue; }
   doc.rect(x0 + s * u, y0 + y * u, (p - s + q.c) * u, q.c * u + seam, 'F');
   if (i < xs.length) s = p = xs[i];
  }
 });
}
/* the picture as a JPEG at 0.72, a little lower (never below 0.6) where a busy sheet would pass 0.72 MB: a day's PDFs
   go by email, and a mail server takes about 20 MB. The QR codes are drawn as vectors over the picture, so its quality
   never touches them. */
async function pdf7Encode(cv, o){
 const png = o.fmt === 'PNG'; let q = o.q, b;
 for (;;) {
  b = await new Promise((res, rej) => cv.toBlob(x => x ? res(x) : rej(new Error('the picture of the sheet could not be made')), png ? 'image/png' : 'image/jpeg', q));
  if (png || b.size <= o.maxBytes || q <= o.qMin + 0.001) break;
  q = Math.max(o.qMin, Math.round((q - 0.06) * 100) / 100);
 }
 const bytes = new Uint8Array(await b.arrayBuffer());
 cv.width = cv.height = 0;
 return {bytes, q: png ? null : q};
}
/* one sheet, photographed: 2.5 image pixels per CSS pixel (240 dpi on the paper) */
async function pdf7Shot(lib, node, css, o){
 const r = node.getBoundingClientRect(), W = Math.ceil(r.width), H = Math.ceil(r.height);
 const qrs = pdf7Qrs(node);
 const opt = {pixelRatio: o.ratio, width: W, height: H, backgroundColor: '#ffffff', cacheBust: false, skipAutoScale: true, includeStyleProperties: pdf7Props(),
  style: Object.assign({margin: '0', boxShadow: 'none', outline: 'none', zoom: '1'}, o.style || {})};
 if (css != null) opt.fontEmbedCSS = css;
 const cv = await lib.h2i.toCanvas(node, opt);
 const px = [cv.width, cv.height], png = o.fmt === 'PNG';
 return {enc: pdf7Encode(cv, o), fmt: png ? 'PNG' : 'JPEG', wmm: W * PDF7_MM, hmm: H * PDF7_MM, px, qrs, vector: o.vectorQr !== false};
}
function pdf7Doc(lib, title){
 const doc = new lib.jsPDF({orientation: 'portrait', unit: 'mm', format: 'a4', compress: true});
 doc.setProperties({title, subject: title, author: (DATA.brand && DATA.brand.author) || '', creator: 'GC500 Delivery Control', keywords: 'GC500'});
 return doc;
}
function pdf7Put(doc, shot, first, m){
 if (!first) doc.addPage('a4', 'portrait');
 doc.addImage(shot.bytes, shot.fmt, m, m, shot.wmm, shot.hmm, undefined, shot.fmt === 'PNG' ? 'FAST' : 'NONE');
 if (shot.vector) shot.qrs.forEach(q => pdf7DrawQr(doc, q, m, m));
}
function pdf7Name(kind, iso, g, i, n){
 const w = PDF7_FILE[kind];
 if (kind === 'prestart') return 'GC500_' + w + '_' + iso + '.pdf';
 if (!g) return 'GC500_' + w + '_' + iso + '_All-' + n + '-loads.pdf';
 let refs = g.rows.map(r => String(r.a.key).replace(/[^A-Za-z0-9]+/g, '')).filter(Boolean);
 if (refs.length > 6) refs = refs.slice(0, 5).concat(['and-' + (refs.length - 5) + '-more']);
 return 'GC500_' + w + '_' + iso + '_Load-' + (i + 1) + (refs.length ? '_' + refs.join('-') : '') + '.pdf';
}
function pdf7Size(b){ return b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
/* lay the sheets out (the same code that prints them), hand back the fitted pages */
function pdf7Layout(kind, iso, only){
 return new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error('the sheets took too long to lay out')), 60000);
  const got = (r, wrap, done) => { clearTimeout(t); res({r: r || {}, wrap, done}); };
  try {
   if (kind === 'prestart') ps7Print(iso, {pdf: got});
   else dpPrint(iso, kind === 'install' ? 'ins' : 'drv', {only, pdf: got});
  } catch (e) { clearTimeout(t); rej(e); }
 });
}
async function pdf7Make(kind, iso, only, P, job){
 const o = Object.assign({ratio: 2.5, fmt: 'JPEG', q: 0.72, qMin: 0.6, maxBytes: 0.72 * 1048576, vectorQr: true}, window.__pdf707opts || {});
 const T = {t0: performance.now()}, alive = () => job === PDF7.job;
 const doc = kind === 'install' ? 'ins' : 'drv';
 const d = programmeDays().find(x => x.iso === iso);
 if (kind === 'prestart' ? !ps7Day(iso) : !d) throw new Error('that day is outside the programme');
 const loads = kind === 'prestart' ? [] : dpLoads(d), n = loads.length;
 if (kind !== 'prestart' && !n) throw new Error('nothing is scheduled to move on ' + fmtDate(iso));
 const pick = kind === 'prestart' ? [0] : only != null && loads[only] ? [only] : loads.map((g, i) => i);
 P.say('Getting ready…', 0.02);
 const [lib, css] = await Promise.all([pdf7Lib(), pdf7FontCss().catch(() => null), pdf7Sync()]);
 T.lib = performance.now() - T.t0;
 if (!alive()) return null;
 P.say(pick.length > 1 ? 'Laying out ' + pick.length + ' pages…' : 'Laying out the page…', 0.06);
 const L = await pdf7Layout(kind, iso, only);
 T.layout = performance.now() - T.t0 - T.lib;
 const shots = [];
 try {
  if (!alive()) return null;
  L.wrap.style.setProperty('--dpz', '1');
  const nodes = kind === 'prestart' ? [L.wrap] : [...L.wrap.querySelectorAll('.dp-page')];
  if (!nodes.length) throw new Error('no page was laid out');
  /* a pre-start brought in to one sheet is zoomed; the picture is taken at full size on a sheet as much wider as the zoom
     makes it (the same line breaks), and set on the paper at the zoom */
  let z = 1;
  if (kind === 'prestart') { const sec = L.wrap.querySelector('.ps7');
   /* measured again here, by ps7Print's own rule (283 mm of paper, 98.5 %, never below 80 %): on a phone the first
      measurement can come out a fifth taller than the sheet lays out, which brought the whole pre-start in to 80 % */
   if (sec) { sec.style.zoom = ''; const avail = 283 / PDF7_MM, h = sec.getBoundingClientRect().height;
    z = h > avail * 0.985 ? Math.max(0.8, Math.floor(avail * 0.985 / h * 1000) / 1000) : 1;
    if (z !== 1) L.wrap.style.width = (196 / z).toFixed(3) + 'mm'; } }
  await pdf7Imgs(L.wrap);
  let enc = Promise.resolve();   /* each picture is encoded while the next sheet is being photographed */
  for (let i = 0; i < nodes.length; i++) {
   if (!alive()) return null;
   P.say('Making PDF ' + (i + 1) + ' of ' + nodes.length + '…', 0.1 + 0.85 * i / nodes.length);
   await new Promise(r => { requestAnimationFrame(() => setTimeout(r, 0)); setTimeout(r, 120); });
   const sh = await pdf7Shot(lib, nodes[i], css, Object.assign({}, o, kind === 'prestart' ? {style: {position: 'static', left: '0', top: '0', margin: '0', visibility: 'visible'}} : {}));
   if (z !== 1) { sh.wmm *= z; sh.hmm *= z; sh.qrs.forEach(q => { q.x *= z; q.y *= z; q.w *= z; q.h *= z; }); }
   await enc; enc = sh.enc.then(r => { sh.bytes = r.bytes; sh.q = r.q; });
   shots.push(sh);
  }
  await enc;
 } finally {
  try { L.done(); } catch (e) {}
  L.wrap.innerHTML = ''; L.wrap.removeAttribute('style');
 }
 T.shots = performance.now() - T.t0 - T.lib - T.layout;
 if (!alive()) return null;
 P.say('Putting the PDF' + (pick.length > 1 ? 's' : '') + ' together…', 0.97);
 const m = kind === 'prestart' ? 7 : 8, files = [], date = fmtDate(iso);
 const file = (doc0, name, role, pages, label, li) => {
  const blob = doc0.output('blob'), f = new File([blob], name, {type: 'application/pdf', lastModified: Date.now()});
  const url = URL.createObjectURL(f); PDF7.urls.push(url);
  files.push({name, blob, file: f, url, role, pages, label, size: blob.size, li});
 };
 if (kind === 'prestart') {
  const D = pdf7Doc(lib, 'GC500 · ' + PDF7_KICK.prestart + ' · ' + date); pdf7Put(D, shots[0], true, m); file(D, pdf7Name(kind, iso), 'prestart', 1, 'Pre-start');
 } else {
  pick.forEach((li, k) => {
   const g = loads[li], refs = g.rows.map(r => r.a.key).join(', ');
   const D = pdf7Doc(lib, 'GC500 · ' + DP_DOC[doc].kick + ' · ' + date + ' · Load ' + (li + 1) + ' of ' + n + ' · ' + refs);
   pdf7Put(D, shots[k], true, m); file(D, pdf7Name(kind, iso, g, li, n), 'load', 1, 'Load ' + (li + 1) + ' · ' + refs, li);
  });
  if (pick.length > 1) {
   const D = pdf7Doc(lib, 'GC500 · ' + DP_DOC[doc].kick + ' · ' + date + ' · All ' + n + ' loads');
   shots.forEach((s, k) => pdf7Put(D, s, k === 0, m));
   file(D, pdf7Name(kind, iso, null, 0, n), 'all', shots.length, 'All ' + n + ' loads · ' + shots.length + ' pages');
   files.unshift(files.pop());
  }
 }
 T.build = performance.now() - T.t0 - T.lib - T.layout - T.shots; T.total = performance.now() - T.t0;
 return {files, fit: L.r, T, loads, pick, n, shots: shots.map(s => ({px: s.px, bytes: s.bytes.length, fmt: s.fmt, q: s.q, mm: [m, m, s.wmm, s.hmm], qrs: s.qrs.map(q => [q.x + m, q.y + m, q.w, q.h, q.mods])}))};
}
/* ---------- the email: the short text, and the PDFs attached through the phone's share sheet */
function pdf7MailText(kind, iso, only, part, cap){
 /* NO LINKS. The project manager, 27 Sep 2026: "I don't want an email with a link. We are emailing the PDFs. No link."
    A short plain note, the loads one line each, the safety line; the QR codes are inside the PDFs. */
 const d = programmeDays().find(x => x.iso === iso); if (!d) return null;
 let loads = []; try { loads = dpLoads(d); } catch (e) { loads = []; }
 const n = loads.length, date = fmtDate(iso);
 const idx = kind === 'prestart' ? loads.map((g, i) => i) : only != null && loads[only] ? [only] : part ? part.loads : loads.map((g, i) => i);
 const one = kind !== 'prestart' && only != null && !!loads[only];
 const sheets = kind === 'drivers' ? 'delivery driver sheet' : 'install team sheet';
 const partWord = part && part.n > 1 ? ` (part ${part.k} of ${part.n}: loads ${idx[0] + 1}–${idx[idx.length - 1] + 1})` : '';
 const subject = `GC500 — ${DP_MAIL[kind]} — ${date}` + (one ? ` — Load ${only + 1} of ${n}` : '') + (part && part.n > 1 ? ` — part ${part.k} of ${part.n}` : '');
 const lead = kind === 'prestart' ? `Attached is the Coates Installs daily pre-start for ${date} (one page, PDF).`
  : one ? `Attached is the ${sheets} for ${date}: load ${only + 1} of ${n} (one page, PDF).`
  : `Attached are the ${sheets}s for ${date}: ${n} load${n === 1 ? '' : 's'}, one page each (PDF)${partWord}.`;
 const ask = kind === 'drivers' ? (one ? 'Please print it for the driver.' : 'Please print one per driver.') : '';
 const safety = kind === 'drivers' ? 'The driver completes a JSEA before unloading, on every load. Take 5 before every new task.' : 'Take 5 before every new task.';
 const lines = idx.map(i => dpLoadLine(loads[i]));
 const body = k => { const shown = lines.slice(0, k), more = lines.length - shown.length;
  return ['Hi all,', '', lead + (ask ? ' ' + ask : ''), '', lines.length ? (kind === 'prestart' ? 'The loads that day:' : 'Loads:') : 'No loads are scheduled on this day.', ...shown,
   ...(more > 0 ? [`and ${more} more — each on its own sheet`] : []), '', safety, '', 'Coates Industrial Solutions, GC500 2026'].join('\n'); };
 let k = lines.length;
 if (cap) while (k > 0 && mailto(subject, body(k)).length > cap) k--;
 return {subject, text: body(k)};
}
/* Copy the email text: the same note, no links */
function pdf7Copy(kind, iso){
 const M = pdf7MailText(kind, iso, null, null); if (!M) { flash('That day is outside the programme.'); return; }
 const text = 'Subject: ' + M.subject + '\n\n' + M.text;
 const fallback = () => {
  const box = document.createElement('div'); box.className = 'drawer on dpcopy'; box.style.zIndex = 40; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'The email text');
  box.innerHTML = `<div class="dh"><div><h2>The email text</h2><div class="sub">Selected - press Ctrl+C (or Copy) and paste it into your email, then attach the PDFs.</div></div><button class="btn" type="button" data-x>Close</button></div><textarea readonly rows="18" style="width:100%;font:13px/1.4 ui-monospace,Menlo,Consolas,monospace"></textarea>`;
  document.body.appendChild(box); const ta = box.querySelector('textarea'); ta.value = text; ta.focus(); ta.select();
  try { ta.setSelectionRange(0, text.length); } catch (e) {}
  box.querySelector('[data-x]').onclick = () => box.remove();
 };
 window.__pdf707copy = text;
 try {
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => flash('Email text copied - ' + DP_MAIL[kind] + ', ' + fmtDate(iso) + '. Attach the PDFs to it.'), fallback);
  else fallback();
 } catch (e) { fallback(); }
}
function pdf7CanShare(files){ try { return !!(navigator.share && navigator.canShare && navigator.canShare({files})); } catch (e) { return false; } }
function pdf7Save(files){
 files.forEach((f, i) => setTimeout(() => { const a = document.createElement('a'); a.href = f.url; a.download = f.name; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); }, i * 350));
}
/* ---------- the panel: progress, then Open / Print, Email (attach), Save */
function pdf7Close(){
 PDF7.job++;
 document.querySelectorAll('#pdf7').forEach(e => e.remove());
 document.body.classList.remove('pdf7-on');
 const old = PDF7.urls.splice(0); if (old.length) setTimeout(() => old.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} }), 120000);
 PDF7.files = null;
}
function pdf7Open(kind, iso, only, mail){
 pdf7Close();
 const job = PDF7.job;
 const d = programmeDays().find(x => x.iso === iso);
 let loads = []; try { loads = d ? dpLoads(d) : []; } catch (e) { loads = []; }
 const one = kind !== 'prestart' && only != null && loads[only];
 const head = kind === 'prestart' ? 'Pre-start · 1 page' : one ? 'Load ' + (only + 1) + ' of ' + loads.length + ' · ' + loads[only].rows.map(r => r.a.key).join(' · ') : 'All ' + loads.length + ' load' + (loads.length === 1 ? '' : 's');
 const box = document.createElement('div'); box.id = 'pdf7'; box.className = 'pdf7'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'pdf7-h');
 box.innerHTML = `<div class="pdf7-card"><div class="pdf7-hd"><div class="pdf7-ht"><span class="pdf7-k">${esc(PDF7_KICK[kind] || '')} · ${esc(fmtDate(iso))}</span><h2 id="pdf7-h">${esc(head)}</h2></div><button type="button" class="pdf7-x" data-pdf7-x aria-label="Close">×</button></div>
 <div class="pdf7-prog"><div class="pdf7-bar"><i></i></div><p class="pdf7-say" aria-live="polite">Getting ready…</p></div>
 <div class="pdf7-go" hidden></div><p class="pdf7-msg" aria-live="polite" hidden></p>
 <div class="pdf7-ft"><button type="button" class="pdf7-web" data-pdf7-web>Open as a web page instead</button><button type="button" class="pdf7-btn pdf7-sm" data-pdf7-x>Close</button></div></div>`;
 document.body.appendChild(box); document.body.classList.add('pdf7-on');
 box.querySelectorAll('[data-pdf7-x]').forEach(b => b.onclick = pdf7Close);
 box.addEventListener('click', e => { if (e.target === box) pdf7Close(); });
 box.querySelector('[data-pdf7-web]').onclick = () => { pdf7Close(); dpFromLink(kind, iso, one ? only : null); };
 const say = (msg, frac) => { if (job !== PDF7.job) return; box.querySelector('.pdf7-say').textContent = msg; if (frac != null) box.querySelector('.pdf7-bar i').style.width = Math.round(Math.min(1, frac) * 100) + '%';
  window.__pdf707 = Object.assign(window.__pdf707 || {}, {state: 'making', say: msg}); };
 const note = (msg, bad) => { const p = box.querySelector('.pdf7-msg'); p.hidden = !msg; p.textContent = msg || ''; p.classList.toggle('pdf7-bad', !!bad); };
 window.__pdf707 = {state: 'making', kind, iso, only: one ? only : null, mail: !!mail, say: ''};
 pdf7Make(kind, iso, one ? only : null, {say}, job).then(res => {
  if (!res || job !== PDF7.job) return;
  PDF7.files = res.files;
  window.__pdf707 = {state: 'ready', kind, iso, only: one ? only : null, mail: !!mail, ms: res.T, fit: res.fit, shots: res.shots,
   files: res.files.map(f => ({name: f.name, size: f.size, pages: f.pages, role: f.role, blob: f.blob}))};
  pdf7Ready(box, kind, iso, one ? only : null, mail, res, note);
 }).catch(e => {
  if (job !== PDF7.job) return;
  window.__pdf707 = {state: 'failed', kind, iso, error: String(e && e.message || e)};
  box.querySelector('.pdf7-prog').hidden = true;
  note('The PDF could not be made: ' + (e && e.message || e) + '. Open it as a web page instead, below.', true);
 });
}
function pdf7Ready(box, kind, iso, only, mail, res, note){
 const files = res.files, all = files.find(f => f.role === 'all'), main = all || files[0];
 const send = files.filter(f => f.role !== 'all'), android = pdf7Android(), canAll = pdf7CanShare(send.map(f => f.file));
 const canOne = canAll || pdf7CanShare(send.slice(0, 1).map(f => f.file));
 const warn = [res.fit && res.fit.failed ? res.fit.failed + ' picture' + (res.fit.failed === 1 ? '' : 's') + ' could not be loaded' : '', res.fit && res.fit.over && res.fit.over.length ? res.fit.over.length + ' page' + (res.fit.over.length === 1 ? '' : 's') + ' run long' : '', res.fit && res.fit.timeout ? 'the pictures took too long to load' : ''].filter(Boolean);
 const openA = (f, cls, inner) => `<a class="${cls}" href="${esc(f.url)}" target="_blank" rel="noopener"${android ? ` download="${esc(f.name)}"` : ''}>${inner}</a>`;
 const pagesWord = k => k + ' page' + (k === 1 ? '' : 's');
 const openBtn = openA(main, 'pdf7-btn' + (mail ? '' : ' pdf7-pri'), `Open / Print<small>${all ? 'All ' + all.pages + ' pages in one PDF' : pagesWord(main.pages) + ' · A4 PDF'}</small>`);
 const mailBtn = `<button type="button" class="pdf7-btn${mail ? ' pdf7-pri' : ''}" data-pdf7-mail>${canOne ? 'Email (attach)' : 'Email · save, then attach'}<small>${canOne ? (send.length > 1 ? send.length + ' PDFs, one per load' : '1 PDF') : 'This browser cannot attach files itself'}</small></button>`;
 const saveBtn = `<button type="button" class="pdf7-btn" data-pdf7-save>Save<small>${files.length > 1 ? 'All ' + files.length + ' files' : '1 file'}</small></button>`;
 const tip = android ? 'Open / Print saves the PDF and opens it in your phone’s PDF viewer. Print from its menu, on A4 paper.' : 'Print on A4 at actual size (100%). Each page is one A4 sheet.';
 const list = files.map(f => `<li><span class="pdf7-fi"><b>${esc(f.label)}</b><span>${esc(f.name)}</span><em>${esc(pagesWord(f.pages) + ' · ' + pdf7Size(f.size))}</em></span>${openA(f, 'pdf7-a', 'Open')}<a class="pdf7-a" href="${esc(f.url)}" download="${esc(f.name)}">Save</a></li>`).join('');
 box.querySelector('.pdf7-prog').hidden = true;
 const go = box.querySelector('.pdf7-go'); go.hidden = false;
 const sendBytes = send.reduce((a, f) => a + f.size, 0);
 go.innerHTML = `<p class="pdf7-done">${send.length > 1 ? send.length + ' PDFs, one per load · ' + pdf7Size(sendBytes) + (all ? ' · and all ' + all.pages + ' pages in one file · ' + pdf7Size(all.size) : '') : 'PDF ready · ' + pdf7Size(sendBytes)}${warn.length ? ' · ' + esc(warn.join(' · ')) : ''}</p>
 <div class="pdf7-acts">${mail ? mailBtn + openBtn : openBtn + mailBtn}${saveBtn}</div><div class="pdf7-more" hidden></div><p class="pdf7-tip">${esc(tip)}</p><ul class="pdf7-files">${list}</ul>`;
 const M = pdf7MailText(kind, iso, only, null);
 const share = (fs, what, part) => {
  const T = part ? pdf7MailText(kind, iso, only, part) : M;
  navigator.share({files: fs.map(f => f.file), title: T.subject, text: T.text}).then(() => note('Sent to the share sheet: ' + what + '.'), e => { if (e && e.name === 'AbortError') note('Not sent.'); else note('The share sheet did not open (' + (e && e.message || e) + '). Use Save, then attach the files to your email.', true); });
 };
 go.querySelector('[data-pdf7-mail]').onclick = () => {
  if (!M) { note('That day is outside the programme.', true); return; }
  /* one email takes up to 10 files and about 18 MB: more than that goes in parts, each a tap of its own. The file with
     every page is for printing and is never attached as well. */
  const B = []; let cur = [], bytes = 0;
  send.forEach(f => { if (cur.length && (cur.length >= PDF7_SHARE_MAX || bytes + f.size > PDF7_MAIL_MAX)) { B.push(cur); cur = []; bytes = 0; } cur.push(f); bytes += f.size; });
  if (cur.length) B.push(cur);
  if (canAll && B.length === 1) { share(send, send.length > 1 ? send.length + ' PDFs, ' + pdf7Size(sendBytes) : send[0].name); return; }
  if (canOne && send.length > 1) {
   const more = go.querySelector('.pdf7-more'), num = f => f.label.split(' · ')[0].replace('Load ', '');
   more.hidden = false;
   more.innerHTML = `<p>Too much for one email (up to ${PDF7_SHARE_MAX} files and about ${pdf7Size(PDF7_MAIL_MAX)}). Send it in ${B.length} parts, one email each:</p>`
    + B.map((b, k) => `<button type="button" class="pdf7-btn pdf7-sm" data-pdf7-batch="${k}">Email part ${k + 1} of ${B.length} · loads ${num(b[0])}–${num(b[b.length - 1])} · ${pdf7Size(b.reduce((a, f) => a + f.size, 0))}</button>`).join('');
   more.querySelectorAll('[data-pdf7-batch]').forEach(b => b.onclick = () => { const k = +b.dataset.pdf7Batch; share(B[k], 'part ' + (k + 1) + ' of ' + B.length, {k: k + 1, n: B.length, loads: B[k].map(f => f.li)}); });
   return;
  }
  /* no attaching from this browser: the PDFs to Downloads, and the email with its text */
  pdf7Save(send);
  note('This browser cannot attach files to an email by itself. The PDF' + (send.length > 1 ? 's are' : ' is') + ' being saved to your Downloads - attach ' + (send.length > 1 ? 'them' : 'it') + ' to the email that opens now.');
  const S = pdf7MailText(kind, iso, only, null, DP_MAIL_MAX), href = mailto(S.subject, S.text);
  setTimeout(() => { location.href = href; }, 350 * send.length + 400);
 };
 go.querySelector('[data-pdf7-save]').onclick = () => { pdf7Save(files); note('Saving ' + (files.length > 1 ? files.length + ' files' : files[0].name) + ' to your Downloads.'); };
}
