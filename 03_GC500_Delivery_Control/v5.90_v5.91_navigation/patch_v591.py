#!/usr/bin/env python3
"""v5.91 - FEWER PAGES, ONE PLANT PAGE, PICTURES IN THEIR DRAWERS (Andrew Fisher, 25 Sep 2026).
Breakdowns, Register and Edit leave the navigation (set aside like Variances, Journal and Add in v5.86); the Plant
page carries the asset register beneath the plant lines, and every link that went to the Register goes to Plant.
The Documents tab's photographs become one card per category (drop photographs, fencing dockets, site pictures,
other pictures), race-card style with the count and a strip of thumbnails; a press opens that category's gallery
with a way back. The v5.90 frame buttons take their own attribute (data-mopen) so a document card's own data-open
(a reference, or a picture to open) is never mistaken for them; the Map tab's buttons show on the hosted page from
the first draw.  python3 patch_v591.py <builder|page>"""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8-sig').read(); bom = open(p, encoding='utf-8').read(1) == '﻿'; n0 = len(s)
def rep(old, new, label, count=1):
    global s
    assert s.count(old) == count, (label, s.count(old)); s = s.replace(old, new); print('ok', label)

# 1. the frame buttons take their own attribute; the Map tab shows them on the hosted page from the first draw
rep("""document.addEventListener('click', e => { const b = e.target.closest('[data-open],[data-mpage]'); if (!b || b.disabled) return; e.preventDefault(); machineOpen(b.dataset.open || b.dataset.mpage); });""",
    """document.addEventListener('click', e => { const b = e.target.closest('[data-mopen],[data-mpage]'); if (!b || b.disabled) return; const k = b.dataset.mopen || b.dataset.mpage; if (!MACHINE_PAGES[k]) return; e.preventDefault(); machineOpen(k); });""", 'frame click on its own attribute')
rep("""   ${machineHosted() ? `<button class="btn sheetbtn satbtn" type="button" data-open="explorer">Plan on satellite</button><button class="btn sheetbtn satbtn" type="button" data-open="proof3d">3D proof</button>` : ''}""",
    """   ${DATA.edition === 'hosted' ? `<button class="btn sheetbtn satbtn" type="button" data-mopen="explorer">Plan on satellite</button><button class="btn sheetbtn satbtn" type="button" data-mopen="proof3d">3D proof</button>` : ''}""", 'map tab buttons', 2)
rep("""${DATA.edition === 'hosted' ? '<button class="btn ghost" type="button" data-open="explorer">Plan on satellite</button><button class="btn ghost" type="button" data-open="proof3d">3D proof</button>' : ''}""",
    """${DATA.edition === 'hosted' ? '<button class="btn ghost" type="button" data-mopen="explorer">Plan on satellite</button><button class="btn ghost" type="button" data-mopen="proof3d">3D proof</button>' : ''}""", 'Coates Way tab buttons')
# 2. pages set aside; the Register lives under Plant
rep("""const TABS_OFF = new Set(['variances', 'journal', 'add']);""",
    """const TABS_OFF = new Set(['variances', 'journal', 'add', 'breakdowns', 'register', 'edit']);   /* v5.91 - Breakdowns, Register and Edit set aside; the register is on the Plant page */""", 'tabs off')
rep("""function go(tab){ if (!TABS.some(([k]) => k === tab)) tab = 'today';
  if (TABS_OFF.has(tab))""",
    """function go(tab){ if (!TABS.some(([k]) => k === tab)) tab = 'today';
  if (tab === 'register') tab = 'plant';   /* v5.91 - the register is on the Plant page */
  if (TABS_OFF.has(tab))""", 'register goes to plant')
rep("""  else if (state.tab === 'plant') renderPlant();""",
    """  else if (state.tab === 'plant') { renderPlant(); plantCarriesRegister(); }""", 'plant renders the register')
rep("""function renderPlant(){""",
    """/* v5.91 - the Plant page carries the asset register beneath the plant lines: the register's own pane is moved in
   under it and drawn by its own renderer, so every filter, search and light it had still works there */
let REG_PANE = null;
function plantCarriesRegister(){
  if (!REG_PANE) REG_PANE = $('#pane-register');
  const host = $('#pane-plant'); if (!REG_PANE || !host) return;
  REG_PANE.classList.remove('pane', 'on', 'arrive'); REG_PANE.classList.add('inplant'); REG_PANE.removeAttribute('hidden'); REG_PANE.removeAttribute('role');
  host.appendChild(REG_PANE);
  renderRegister();
}
function renderPlant(){""", 'plant carries register')
rep("""    <div class="card hubcard${bdStop.length ? ' alert' : ''}" data-go="breakdowns">""",
    """    <div class="card hubcard tabsoff${bdStop.length ? ' alert' : ''}" data-go="breakdowns">""", 'breakdowns hub card off')
rep("""    <div class="card hubcard editonly" data-go="edit">""", """    <div class="card hubcard editonly tabsoff" data-go="edit">""", 'edit hub card off')
rep("""<button class="linkish" id="toBreakdowns">See all ${mine.length} on the register →</button>""",
    """<button class="linkish tabsoff" id="toBreakdowns">See all ${mine.length} on the register →</button>""", 'breakdowns link off')
# 3. the Documents tab: pictures in their drawers
rep("""function renderDocs(keep){
  const hosted = !!(SYNC.backend && SYNC.backend.fileUrl);""",
    """/* v5.91 - the photographs on the Documents tab are one card per category, race-card style, and a press opens that
   category's gallery. Categories are what the collection already knows: drop photographs (the drop cards' pictures),
   fencing dockets (paper, photographed), site pictures (filed against a reference) and other pictures (uploaded, not
   filed as anything). Nothing is re-filed; a picture is in exactly one drawer. */
const PHOTO_CATS = [
  ['dropphotos', 'Drop photographs', 'what went where, from the drop cards', d => d.group === 'dropphotos'],
  ['dockets', 'Fencing dockets', 'the paper, photographed', d => d.group === 'dockets' && docIsPicture(d)],
  ['photos', 'Site pictures', 'photographs filed against a reference', d => d.group === 'photos'],
  ['pictures', 'Other pictures', 'uploaded pictures not filed as anything', d => d.group === 'uploaded' && docIsPicture(d)]];
function docIsPicture(d){ const f = d._up || {}; return /^image\\//.test(String(f.type || '')) || /^(jpe?g|png|webp|gif|heic)$/i.test(String(d.ext || '')); }
function photoCatItems(all, key){ const c = PHOTO_CATS.find(x => x[0] === key); return c ? all.filter(c[3]) : []; }
function photoCardsHtml(all){
  const cards = PHOTO_CATS.map(([key, title, blurb, pick]) => { const items = all.filter(pick); if (!items.length) return '';
    const strip = items.slice(0, 4).map(d => { const t = docPhotoPreview(d, docHref(d)); return t ? `<img src="${esc(t)}" alt="" loading="lazy" decoding="async">` : '<i></i>'; }).join('');
    return `<button type="button" class="card hubcard racecard island photocat" data-photocat="${key}" aria-label="${esc(title)}: ${items.length} pictures">
      <div class="pstat"><b>${fmtNum(items.length)}</b><span>${esc(title)}</span><em>${esc(blurb)}</em></div>
      <div class="pstrip">${strip}</div><div class="hubgo">Open the ${esc(title.toLowerCase())} →</div></button>`; }).join('');
  return cards ? `<div class="photocats">${cards}</div>` : '';
}
function renderPhotoGallery(all, key){
  const c = PHOTO_CATS.find(x => x[0] === key) || PHOTO_CATS[0], items = photoCatItems(all, c[0]);
  $('#pane-docs').innerHTML = paneHeadingHtml('docs') + `
  <div class="hubhead"><div><h2>${esc(c[1])}</h2><div class="sub">${fmtNum(items.length)} picture${items.length === 1 ? '' : 's'} · ${esc(c[2])}</div></div>
    <div class="acts"><button class="btn" type="button" id="photoBack">← All documents</button></div></div>
  <div class="docjump">${PHOTO_CATS.map(([k, t, , pick]) => { const n = all.filter(pick).length; return n ? `<button class="btn${k === c[0] ? ' primary' : ''}" type="button" data-photocat="${k}">${esc(t)} <span class="w">${fmtNum(n)}</span></button>` : ''; }).join('')}</div>
  <div class="card"><div class="docgrid gallery">${items.map(d => docCard(d, d._up || null)).join('') || '<div class="notice"><b>Nothing here yet</b></div>'}</div></div>`;
  const pane = $('#pane-docs');
  pane.querySelectorAll('img.thumb[data-open]').forEach(i => i.onclick = () => window.open(i.dataset.open, '_blank', 'noopener'));
  pane.querySelectorAll('[data-docmore]').forEach(b => b.onclick = () => { const cd = b.closest('.doccard'), m = cd && cd.querySelector('.docmore'); if (!m) return; m.hidden = !m.hidden; b.setAttribute('aria-expanded', String(!m.hidden)); b.textContent = m.hidden ? 'Details' : 'Less'; });
  pane.querySelectorAll('[data-photocat]').forEach(b => b.onclick = () => { state.photoCat = b.dataset.photocat; render(); const m = $('main'); if (m) m.scrollTop = 0; });
  const back = $('#photoBack'); if (back) back.onclick = () => { state.photoCat = null; render(); const el = $('#docsec-photos'); if (el) el.scrollIntoView({behavior: motionOff() ? 'auto' : 'smooth', block: 'start'}); };
}
function renderDocs(keep){
  const hosted = !!(SYNC.backend && SYNC.backend.fileUrl);
  if (state.photoCat) { if (hosted) docsRefresh(false); return renderPhotoGallery(docCollection().items, state.photoCat); }""", 'photo cards and gallery')
rep("""      const site = all.filter(d => d.group === 'photos' || d.group === 'dropphotos');
      const drops = all.filter(d => d.group === 'dropphotos').length;
      if (!site.length && !drops) return '';
      return sec('photos', 'Photographs', photoCount + (photoCount === 1 ? ' file' : ' files'),
        `<p class="maphint" style="margin:0 0 8px">Pictures on the service. These are photographs of the site and of what went where — they are not drawings, and nothing here is to scale.</p>
        ${site.length ? `<div class="docgrid">${site.map(d => docCard(d, d._up)).join('')}</div>` : ''}
        ${drops ? `<p class="norate">${fmtNum(drops)} file${drops === 1 ? '' : 's'} use the drop-photo format. Originals are retained when an association is replaced or removed. Open a reference to see its current recorded photographs; a filename alone does not confirm an association.</p>` : ''}`, '""",
    """      /* v5.91 - one card per category; the pictures themselves are behind the card */
      const pics = PHOTO_CATS.reduce((n, c) => n + all.filter(c[3]).length, 0);
      if (!pics) return '';
      return sec('photos', 'Photographs', fmtNum(pics) + (pics === 1 ? ' picture' : ' pictures'),
        `<p class="maphint" style="margin:0 0 8px">Pictures on the service, in their drawers. Press a card for that category's gallery. They are photographs of the site and of what went where — not drawings, and nothing here is to scale.</p>
        ${photoCardsHtml(all)}`, '""", 'photographs section is cards')
rep("""  pane.querySelectorAll('[data-docjump]').forEach(b => b.onclick = () => { const el = $('#docsec-' + b.dataset.docjump); if (el) el.scrollIntoView({behavior: motionOff() ? 'auto' : 'smooth', block: 'start'}); setHash('docs/' + b.dataset.docjump); });""",
    """  pane.querySelectorAll('[data-docjump]').forEach(b => b.onclick = () => { const el = $('#docsec-' + b.dataset.docjump); if (el) el.scrollIntoView({behavior: motionOff() ? 'auto' : 'smooth', block: 'start'}); setHash('docs/' + b.dataset.docjump); });
  pane.querySelectorAll('[data-photocat]').forEach(b => b.onclick = () => { state.photoCat = b.dataset.photocat; render(); const m = $('main'); if (m) m.scrollTop = 0; });   /* v5.91 */""", 'cards open the gallery')
rep(""".hubcard{--face:#fff;border-radius:14px;box-shadow:0 12px 28px -20px rgba(0,0,0,.45)}""",
    """.hubcard{--face:#fff;border-radius:14px;box-shadow:0 12px 28px -20px rgba(0,0,0,.45)}
/* v5.91 - the photograph drawers on Documents: race cards with a strip of pictures */
.photocats{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;margin:4px 0 6px}.photocats .photocat{grid-column:auto}
.photocat{display:flex;flex-direction:column;gap:8px;text-align:left;cursor:pointer;background:linear-gradient(160deg,#1f2a30,#11171b);border:1px solid #2a3338;padding:14px 16px;min-height:170px;font:inherit}
.photocat .pstat{padding:0}.photocat .pstat span{display:block;font-weight:700;font-size:14px;color:#fff;margin-top:2px}.photocat .pstat em{display:block;font-style:normal;font-size:12px;color:#c9d1d0;margin-top:2px}
.photocat .pstrip{display:flex;gap:6px;height:56px}.photocat .pstrip img,.photocat .pstrip i{flex:1;min-width:0;height:56px;object-fit:cover;border-radius:6px;background:#0d1114;border:1px solid #2a3338}
.photocat:hover,.photocat:focus-visible{border-color:var(--orange);outline:0}.photocat .hubgo{color:#ffb27a}
#pane-register.inplant{margin-top:18px}#pane-register.inplant .panehead{border-top:1px solid var(--rule,#e4e0dc);padding-top:14px}
.docgrid.gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}""", 'photo card css')
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s); print('ok v5.91', n0, '->', len(s))
