#!/usr/bin/env python3
r"""v7.83 - Inventory, shared as a PDF. Author: Andrew Fisher. Apply on top of v7.82 (toolchain/build.sh v7.83 patch_v782.py patch_v783.py).

Andrew, 2 Oct 2026: "let's have a share button that does a beautiful PDF print out on A4 on this info too. Costed PDF print
out - 1 page is ideal; if 1 page is no good we can do 2 pages landscape. Missing locations: let's add a QR code for each,
navigating to that location. If we need another page, add another. Clean and tidy and easy."

  - Inventory gets a "Share PDF" button. It makes, on this device, a PDF of what the Inventory card shows (the trade
    chosen on the card, or everything):
      page 1   the summary - on site, still to come, spares, and the hire value at the 2026 card for each type, with the
               total. One A4 portrait page when it fits; when the table is too long, two (or more) A4 landscape pages.
      then     every location still to come, ten to an A4 page, each with a QR code that opens navigation to it (the
               drop-off; the pit lane when there is none yet). As many pages as it takes.
  - Money comes from assetTotal() - the same figure the Pricing tab shows (the 2026 card, the charged days, the minimum
    hire). A line with no rate is never estimated: it shows "no rate" and is counted, not added. Ex GST.
  - Share uses the phone's share sheet where it can; Open and Save always work. Nothing is sent and nothing is written
    to the record.
    python3 patch_v783.py <page.html>"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function inv83Open(' in t: sys.exit('v7.83 already applied')
for need in ('function togo782Html(', 'function dirs782(', 'function report782(', 'async function pdf7Shot(', 'function assetTotal('):
    if need not in t: sys.exit('v7.83 needs v7.82 and the PDF maker (missing ' + need + ')')

t = rep(t, "function invHtml(ro){", r"""/* v7.83 - INVENTORY, SHARED AS A PDF: a costed summary (one A4 portrait page when it fits, else A4 landscape pages), then
   every location still to come with a QR code that opens navigation to it. Made on this device; nothing is sent. */
const INV83_CSS = '.i83{position:absolute;left:-30000px;top:0;background:#fff;color:#15181a;font-family:Inter,Arial,sans-serif}'
 + '.i83 .pg{box-sizing:border-box;background:#fff;overflow:hidden;display:flex;flex-direction:column;gap:3mm;padding:0;margin:0 0 6mm}'
 + '.i83 .pg.por{width:194mm;height:281mm}.i83 .pg.lan{width:281mm;height:194mm}'
 + '.i83 .hd{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1mm solid #ff6a13;padding-bottom:2.5mm}'
 + '.i83 .hd .k{font:800 9pt/1 "Barlow Condensed",Inter,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#5d6468}'
 + '.i83 .hd h1{margin:1.5mm 0 0;font:800 22pt/1 "Barlow Condensed",Inter,sans-serif;letter-spacing:.01em}'
 + '.i83 .hd .r{text-align:right;font:600 9pt/1.35 Inter,sans-serif;color:#5d6468}.i83 .hd .r b{color:#15181a}'
 + '.i83 .tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm}.i83 .tile{border:.35mm solid #d7dbde;border-radius:2.5mm;padding:2.5mm 3mm}'
 + '.i83 .tile span{display:block;font:700 7.5pt/1.1 Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#5d6468}'
 + '.i83 .tile b{display:block;margin-top:1.2mm;font:800 19pt/1 "Barlow Condensed",Inter,sans-serif}.i83 .tile i{display:block;margin-top:1mm;font:500 7.5pt/1.25 Inter,sans-serif;font-style:normal;color:#5d6468}'
 + '.i83 table{width:100%;border-collapse:collapse;font:500 8.4pt/1.25 Inter,sans-serif}'
 + '.i83 th{text-align:left;font:700 7.2pt/1.15 Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#5d6468;border-bottom:.5mm solid #15181a;padding:1.4mm 1.5mm}'
 + '.i83 td{border-bottom:.25mm solid #e3e6e8;padding:1.25mm 1.5mm;vertical-align:top}.i83 td.n,.i83 th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}'
 + '.i83 tr.dh td{background:#f3f4f5;font:800 8pt/1.2 Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;border-bottom:.35mm solid #c9ced2}'
 + '.i83 .pg.lan table{font-size:7.7pt}.i83 .pg.lan td{padding:.85mm 1.4mm}.i83 .pg.lan th{padding:1mm 1.4mm}.i83 .pg.lan .tiles .tile b{font-size:16pt}'
 + '.i83 tfoot td{border-top:.6mm solid #15181a;border-bottom:0;font-weight:800}.i83 .nr{color:#8a9196;font-weight:500}.i83 .tg{color:#b42318;font-weight:700}'
 + '.i83 .ft{margin-top:auto;display:flex;justify-content:space-between;border-top:.35mm solid #d7dbde;padding-top:2mm;font:500 7.2pt/1.3 Inter,sans-serif;color:#5d6468}.ft span:first-child{flex:1;min-width:0;padding-right:6mm}.ft span:last-child{flex:none;white-space:nowrap;font-weight:700}'
 + '.i83 .lh{display:flex;justify-content:space-between;align-items:baseline}.i83 .lh h2{margin:0;font:800 15pt/1 "Barlow Condensed",Inter,sans-serif}.i83 .lh span{font:600 8.5pt Inter,sans-serif;color:#5d6468}'
 + '.i83 .cards{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:44mm;gap:2.6mm}'
 + '.i83 .card{display:grid;grid-template-columns:1fr 31mm;gap:3mm;border:.4mm solid #15181a;border-radius:2.5mm;padding:2.8mm 3mm;overflow:hidden}'
 + '.i83 .card .ref{display:inline-block;background:#ff6a13;color:#15181a;font:800 15pt/1 "Barlow Condensed",Inter,sans-serif;padding:.8mm 2.2mm;border-radius:1mm}'
 + '.i83 .card .due{float:right;font:700 8pt/1.4 Inter,sans-serif;color:#5d6468}.i83 .card .nm{margin-top:1.6mm;font:800 9.6pt/1.2 Inter,sans-serif}'
 + '.i83 .card .lo{margin-top:.8mm;font:500 8.2pt/1.3 Inter,sans-serif}.i83 .card .it{margin-top:.8mm;font:500 7.8pt/1.3 Inter,sans-serif;color:#5d6468}'
 + '.i83 .card .st{margin-top:1.2mm;font:700 7.6pt/1.2 Inter,sans-serif}.i83 .card .st.ok{color:#1a7f45}.i83 .card .st.no{color:#b42318}.i83 .card .st.rp{color:#b45309}'
 + '.i83 .qr{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1mm;text-align:center;font:700 6.6pt/1.15 Inter,sans-serif;color:#5d6468}'
 + '.i83 .qr svg{width:27mm;height:27mm;display:block}.i83 .qr .nq{width:27mm;height:27mm;border:.35mm dashed #c9ced2;border-radius:2mm;display:grid;place-items:center;padding:2mm;box-sizing:border-box}';
/* the money of each inventory type, from the Pricing tab's own figure (assetTotal) - line by line, never estimated */
function inv83Money(rows){
 const out = new Map(), seen = new Map();
 rows.forEach(r => Object.values(r.refs || {}).forEach(x => { const a = assetOf(x.key); if (!a) return;
  let T = seen.get(a.key); if (T === undefined) { try { T = assetTotal(a); } catch (e) { T = null; } seen.set(a.key, T); }
  const CL = chargeLines(a);
  CL.forEach((l, i) => { if (!l.item || invTypeKey(l, a) !== r.type) return; const L = T && T.lines[i];
   const m = out.get(r.type) || {total: 0, known: 0, unknown: 0}; if (L && L.total != null) { m.total += L.total; m.known++; } else m.unknown++; out.set(r.type, m); }); }));
 return out;
}
/* every location still to come, the same list the card shows */
function inv83Togo(I){
 const rows = I.list.filter(r => INV.disc === '*' || r.disc === INV.disc), by = new Map();
 rows.forEach(r => Object.values(r.refs || {}).forEach(x => { const n = x.asked - x.on; if (n <= 0) return; const e = by.get(x.key) || {key: x.key, items: [], short: !!x.onsite}; e.items.push(n + ' × ' + r.item); by.set(x.key, e); }));
 allAssets().filter(a => !a._cancelled && !a.relocation && !movedAway(a.key) && !by.has(a.key) && !inPlace782(a.key)).forEach(a => {
  let d = ''; try { d = invTypeDisc(invTypeOf(a) || ''); } catch (e) {} if (INV.disc !== '*' && d !== INV.disc) return;
  by.set(a.key, {key: a.key, items: [(a.item_types || a.asked_for || []).filter(Boolean).join(', ') || a.name || 'not priced on the schedule'], short: false}); });
 return [...by.values()].map(e => { const a = assetOf(e.key); return Object.assign(e, {a, due: (a && effectiveDates(a).in) || ''}); }).filter(e => e.a)
  .sort((p, q) => String(p.due || '9').localeCompare(String(q.due || '9')) || p.key.localeCompare(q.key, undefined, {numeric: true}));
}
function inv83Pages(){
 const I = inventory(), rows = I.list.filter(r => INV.disc === '*' || r.disc === INV.disc).sort((x, y) => x.disc.localeCompare(y.disc) || x.item.localeCompare(y.item));
 const M = inv83Money(rows), togo = inv83Togo(I), all = INV.disc === '*', what = all ? 'Every trade' : INV.disc;
 const m0 = v => '$' + Math.round(v).toLocaleString('en-AU'), stamp = drvStamp782();
 const tot = k => rows.reduce((n, r) => n + (r[k] || 0), 0), spares = rows.reduce((n, r) => n + r.spares, 0);
 const money = rows.reduce((s, r) => { const m = M.get(r.type); if (m) { s.total += m.total; s.unknown += m.unknown; s.known += m.known; } return s; }, {total: 0, unknown: 0, known: 0});
 const toCome = Math.max(0, tot('asked') - tot('on'));
 const head = (title, n, of) => `<div class="hd"><div><div class="k">Coates · GC500 2026 · ${esc(what)}</div><h1>${esc(title)}</h1></div><div class="r"><b>${esc(fmtDate(I.td))}</b><br>Made ${esc(stamp)}${of > 1 ? '<br>Page ' + n + ' of ' + of : ''}</div></div>`;
 const foot = () => `<div class="ft"><span>From the delivery record - it moves as things are ticked on site. Hire value: the 2026 card at the charged days and minimum hire, ex GST; a line with no rate is counted, never estimated.</span><span>GC500 Delivery Control</span></div>`;
 const tiles = `<div class="tiles"><div class="tile"><span>On site</span><b>${tot('on') + spares}</b><i>${tot('on')} at locations · ${spares} spare</i></div>
  <div class="tile"><span>Still to come</span><b>${toCome}</b><i>at ${togo.length} location${togo.length === 1 ? '' : 's'}</i></div>
  <div class="tile"><span>Ordered</span><b>${tot('asked')}</b><i>${rows.length} type${rows.length === 1 ? '' : 's'}</i></div>
  <div class="tile"><span>Hire value (card)</span><b>${m0(money.total)}</b><i>${money.unknown ? money.unknown + ' line' + (money.unknown === 1 ? '' : 's') + ' with no rate - not included' : 'every line priced'}</i></div></div>`;
 const tr = r => { const m = M.get(r.type) || {total: 0, known: 0, unknown: 0}, sub = Object.values(r.sub).reduce((a, b) => a + b, 0), go = Math.max(0, r.asked - r.on);
  return `<tr><td>${esc(r.item)}</td><td class="n">${r.asked}</td><td class="n">${r.on}</td><td class="n">${sub || '<span class="nr">-</span>'}</td><td class="n">${r.spares || '<span class="nr">-</span>'}</td><td class="n">${go ? '<span class="tg">' + go + '</span>' : '<span class="nr">-</span>'}</td><td class="n">${m.known ? m0(m.total) : ''}${m.unknown ? (m.known ? ' <span class="nr">+ ' + m.unknown + ' no rate</span>' : '<span class="nr">no rate</span>') : ''}</td></tr>`; };
 const thead = `<thead><tr><th>Type</th><th class="n">Ordered</th><th class="n">On site</th><th class="n">Sub-hired</th><th class="n">Spare</th><th class="n">Still to come</th><th class="n">Hire value (card)</th></tr></thead>`;
 const body = []; let last = null; rows.forEach(r => { if (all && r.disc !== last) { body.push(`<tr class="dh"><td colspan="7">${esc(r.disc)}</td></tr>`); last = r.disc; } body.push(tr(r)); });
 const tfoot = `<tfoot><tr><td>Total</td><td class="n">${tot('asked')}</td><td class="n">${tot('on')}</td><td class="n">${rows.reduce((n, r) => n + Object.values(r.sub).reduce((a, b) => a + b, 0), 0)}</td><td class="n">${spares}</td><td class="n">${toCome}</td><td class="n">${m0(money.total)}</td></tr></tfoot>`;
 /* one portrait page when it fits; otherwise landscape pages, the table carried on */
 const PORTRAIT_ROWS = 34, LAND_ROWS = 33, pages = [];
 if (body.length <= PORTRAIT_ROWS) pages.push({o: 'por', html: (n, of) => `<section class="pg por">${head('Inventory - on site and still to come', n, of)}${tiles}<table>${thead}<tbody>${body.join('')}</tbody>${tfoot}</table>${foot()}</section>`});
 else { const first = LAND_ROWS - 9; const parts = [body.slice(0, first)]; for (let i = first; i < body.length; i += LAND_ROWS) parts.push(body.slice(i, i + LAND_ROWS));
  parts.forEach((part, k) => pages.push({o: 'lan', html: (n, of) => `<section class="pg lan">${head(k ? 'Inventory - continued' : 'Inventory - on site and still to come', n, of)}${k ? '' : tiles}<table>${thead}<tbody>${part.join('')}</tbody>${k === parts.length - 1 ? tfoot : ''}</table>${foot()}</section>`})); }
 /* every location still to come: ten to a page, each with a QR code that opens navigation to it */
 const card = e => { const a = e.a, m = masterLoc(a.key) || {}, w = whereText(a), dr = dirs782(a), P = dpPos(a);
  const clean = xs => (xs || []).map(v => String(v).replace(/\s*\(~[^)]*\)\s*$/, '')).filter(Boolean), nb = clean(m.near).slice(0, 2), bs = clean([].concat(m.beside || [], m.next || [])).slice(0, 3);
  const loc = [m.sec ? 'Section ' + m.sec : '', nb.length ? 'near ' + nb.join(', ') : '', bs.length ? 'beside ' + bs.join(', ') : ''].filter(Boolean).join(' · ') || (P.kind === 'desc' ? 'the spot the description names' : P.kind === 'report' ? 'drop-off to be set in Edit' : 'no location on the map yet');
  const st = dr.ok && dr.report ? ['rp', 'No drop-off yet - report to the pit lane'] : dr.ok ? ['ok', 'Directions set'] : ['no', dr.missing.join('; ')];
  const q = P.lat != null ? qrSvg(navUrl({lat: P.lat, lon: P.lon}), 3) : '';
  return `<div class="card"><div><span class="ref">${esc(a.key)}</span><span class="due">${e.due ? esc(fmtDate(e.due)) : 'No date yet'}</span>
   <div class="nm">${esc(a.name || w.main || '')}</div><div class="lo">${esc(loc)}</div><div class="it">${esc(e.items.join(' · '))}${e.short ? ' · short - the rest still to come' : ''}</div><div class="st ${st[0]}">${esc(st[1])}</div></div>
   <div class="qr">${q ? q + '<span>' + (P.kind === 'report' ? 'Scan: the pit lane' : 'Scan to navigate') + '</span>' : '<div class="nq">No map spot yet - set it in Edit</div>'}</div></div>`; };
 const PER = 10;
 for (let i = 0; i < togo.length; i += PER) { const part = togo.slice(i, i + PER);
  pages.push({o: 'por', html: (n, of) => `<section class="pg por">${head('Still to come - every location', n, of)}<div class="lh"><h2>${togo.length} location${togo.length === 1 ? '' : 's'}, by the day due</h2><span>${i + 1}-${i + part.length} of ${togo.length} · scan a code to navigate</span></div><div class="cards">${part.map(card).join('')}</div>${foot()}</section>`}); }
 return {pages: pages.map((pg, k) => ({o: pg.o, html: pg.html(k + 1, pages.length)})), rows: rows.length, bodyRows: body.length, togo: togo.length, money, what};
}
async function inv83Make(say){
 const [lib, css] = await Promise.all([pdf7Lib(), pdf7FontCss().catch(() => null), pdf7Sync()]);
 say('Laying out the pages…');
 const D = inv83Pages();
 if (!document.getElementById('inv83css')) { const st = document.createElement('style'); st.id = 'inv83css'; st.textContent = INV83_CSS; document.head.appendChild(st); }
 const wrap = document.createElement('div'); wrap.className = 'i83'; wrap.innerHTML = D.pages.map(p => p.html).join(''); document.body.appendChild(wrap);
 try {
  await pdf7Imgs(wrap); if (document.fonts && document.fonts.ready) await document.fonts.ready.catch(() => null);
  const o = Object.assign({ratio: 2.5, fmt: 'JPEG', q: 0.8, qMin: 0.6, maxBytes: 0.72 * 1048576, vectorQr: true}, window.__pdf707opts || {});
  const nodes = [...wrap.querySelectorAll('.pg')], doc = new lib.jsPDF({orientation: D.pages[0].o === 'lan' ? 'landscape' : 'portrait', unit: 'mm', format: 'a4', compress: true});
  const title = 'GC500 · Inventory · ' + D.what + ' · ' + fmtDate(todayIso());
  doc.setProperties({title, subject: title, author: (DATA.brand && DATA.brand.author) || '', creator: 'GC500 Delivery Control', keywords: 'GC500'});
  for (let i = 0; i < nodes.length; i++) { say('Making page ' + (i + 1) + ' of ' + nodes.length + '…');
   await new Promise(r => { requestAnimationFrame(() => setTimeout(r, 0)); setTimeout(r, 120); });
   const sh = await pdf7Shot(lib, nodes[i], css, o); const r = await sh.enc; sh.bytes = r.bytes;
   if (i) doc.addPage('a4', D.pages[i].o === 'lan' ? 'landscape' : 'portrait');
   doc.addImage(sh.bytes, sh.fmt, 8, 8, sh.wmm, sh.hmm, undefined, 'NONE');
   if (sh.vector) sh.qrs.forEach(q => pdf7DrawQr(doc, q, 8, 8)); }
  const blob = doc.output('blob'), name = 'GC500_Inventory_' + (INV.disc === '*' ? 'All' : String(INV.disc).replace(/[^A-Za-z0-9]+/g, '-')) + '_' + todayIso() + '.pdf';
  const f = new File([blob], name, {type: 'application/pdf', lastModified: Date.now()}), url = URL.createObjectURL(f);
  return {name, blob, file: f, url, pages: nodes.length, size: blob.size, togo: D.togo, rows: D.rows, orient: D.pages.map(p => p.o)};
 } finally { wrap.remove(); }
}
function inv83Open(){
 document.querySelectorAll('#inv83').forEach(e => e.remove());
 const box = document.createElement('div'); box.id = 'inv83'; box.className = 'pdf7'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Inventory PDF');
 box.innerHTML = `<div class="pdf7-card"><div class="pdf7-hd"><div class="pdf7-ht"><span class="pdf7-k">Inventory · ${esc(INV.disc === '*' ? 'every trade' : INV.disc)} · ${esc(fmtDate(todayIso()))}</span><h2 id="inv83h">Share the inventory</h2></div><button type="button" class="btn" data-x83>Close</button></div>
  <p class="pdf7-say" id="inv83say">Getting ready…</p><div class="pdf7-acts" id="inv83acts"></div></div>`;
 document.body.appendChild(box);
 const say = m => { const e = box.querySelector('#inv83say'); if (e) e.textContent = m; window.__inv83 = Object.assign(window.__inv83 || {}, {say: m}); };
 box.querySelector('[data-x83]').onclick = () => box.remove(); box.addEventListener('click', e => { if (e.target === box) box.remove(); });
 window.__inv83 = {state: 'making'};
 inv83Make(say).then(F => {
  window.__inv83 = {state: 'ready', name: F.name, pages: F.pages, size: F.size, togo: F.togo, rows: F.rows, orient: F.orient};
  INV83_LAST = F;
  say(F.name + ' · ' + F.pages + ' page' + (F.pages === 1 ? '' : 's') + ' · ' + pdf7Size(F.size) + (F.togo ? ' · ' + F.togo + ' location' + (F.togo === 1 ? '' : 's') + ' to come, each with a QR code' : ''));
  const can = pdf7CanShare([F.file]), acts = box.querySelector('#inv83acts');
  acts.innerHTML = `${can ? '<button type="button" class="btn primary" data-share83>Share</button>' : ''}<a class="btn${can ? '' : ' primary'}" href="${F.url}" target="_blank" rel="noopener">Open</a><button type="button" class="btn" data-save83>Save</button>`;
  const sb = acts.querySelector('[data-share83]'); if (sb) sb.onclick = () => navigator.share({files: [F.file], title: F.name}).catch(() => {});
  acts.querySelector('[data-save83]').onclick = () => pdf7Save([F]);
 }).catch(e => { window.__inv83 = {state: 'failed', error: String(e && e.message || e)}; say('The PDF could not be made: ' + (e && e.message || e) + '.'); });
}
let INV83_LAST = null;
function invHtml(ro){""", 'inventory PDF', p, True)
t = rep(t, '<div class="invhead"><h3>Inventory - on site now</h3>',
        '<div class="invhead"><h3>Inventory - on site now</h3><button type="button" class="btn sm" data-inv83 title="A clean A4 PDF of this inventory - costed, with every location still to come and a QR code to each">Share PDF</button>',
        'Share PDF button', p, True)
t = rep(t, " pane.querySelectorAll('#tg782 [data-open]').forEach(b => b.onclick = () => openAsset(b.dataset.open)); /* v7.82 */",
        " pane.querySelectorAll('#tg782 [data-open]').forEach(b => b.onclick = () => openAsset(b.dataset.open)); /* v7.82 */\n pane.querySelectorAll('[data-inv83]').forEach(b => b.onclick = () => inv83Open()); /* v7.83 */",
        'the button opens the PDF maker', p, True)
t = t.replace('/* v7.80 - a save empties', '/* v7.83 - Inventory: Share PDF (costed summary, every location still to come with a QR code). */\n/* v7.80 - a save empties', 1)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v7.83 applied: Inventory Share PDF')
