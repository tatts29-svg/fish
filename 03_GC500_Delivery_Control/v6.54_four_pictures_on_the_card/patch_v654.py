#!/usr/bin/env python3
"""v6.54 - FOUR PICTURES ON THE DELIVERY CARD (Andrew Fisher, 26 Sep 2026: "Can we add aerial pic too. And another reference
photo of where it goes. So 2 pics for place. Then 2 pics when they are attached they go in other 2 spaces. If there is an
aerial one they use that as the 2nd. If not a normal 2nd one").

The card's picture panel is a two-by-two. The top pair is WHERE IT GOES, drawn from the plan before anything is delivered:
the drawing, cropped to the callout as iEDM drew it, and the aerial, cropped to the same point on the ground (the
registered aerial the Map tab and the run sheet use; where a reference has no position on the aerial, the second place
shows the drawing wider). The bottom pair is ON THE DAY, filled from the drop photographs as they are attached: the first
photograph, then the aerial one if the record holds one (the drop card's own aerial slots, "Aerial - overhead" and
"Aerial - the approach", or a caption that says so), else simply the next photograph. An empty place says so. The
satellite thumbnail leaves the Location panel, because it now lives here.

  python3 patch_v654.py <page.html> [builder.py]
"""
import os, re, sys
page = sys.argv[1]; builder = sys.argv[2] if len(sys.argv) > 2 else None

def rep(text, old, new, what, path):
    pat = '\\n'.join('[ \\t]*' + '\\s+'.join(re.escape(tok) for tok in l.split()) if l.split() else '[ \\t]*' for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what} in {os.path.basename(path)}: expected once, found {len(ms)}: {old[:90]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]

EDITS = [
 ('pics fn',
  """function dayCards(rows, kind){""",
  r"""/* v6.54 - the four pictures: where it goes (the drawing at the callout, the aerial at the same point) and on the day
   (the drop photographs, the aerial one second when the record holds one). Crops use the run sheet's own geometry. */
const DC_PIC_R = 4 / 3;
function dayCardCrop(src, fx, fy, iw, ih, f, label, title){
  const g = cropGeom(fx, fy, iw, ih, DC_PIC_R, f);
  return `<span class="dcpic" title="${esc(title || label)}"><img src="${esc(src)}" alt="" loading="lazy" decoding="async" style="width:${g.w}%;left:${g.l}%;top:${g.t}%"><i class="dcx" style="left:${g.rx}%;top:${g.ry}%"></i><em>${esc(label)}</em></span>`;
}
function dayCardPics(a, key){
  const place = mapPlaceFor(a);
  let pt = null; try { pt = aerialPointFor(a); } catch (e) { pt = null; }
  const air = (DATA.sheets || []).find(s => s.key === 'AERIAL' && s.src && s.px);
  const pl = place && place.sheet && place.sheet.src && place.sheet.px && Number.isFinite(place.marker.fx) ? place : null;
  const plan = pl ? dayCardCrop(pl.sheet.src, pl.marker.fx, pl.marker.fy, pl.sheet.px[0], pl.sheet.px[1], SHEET_F, 'On the drawing · callout ' + pl.label, (pl.sheet.subtitle || pl.sheet.sheet_id) + ' — the callout as iEDM drew it, a drawing position, not a surveyed one') : null;
  const aerial = pt && air ? dayCardCrop(air.src, pt.ax, pt.ay, air.px[0], air.px[1], 0.12, 'From the air', 'the registered aerial at the callout’s point — where the drawing says it goes, not a surveyed position') : null;
  const wider = pl ? dayCardCrop(pl.sheet.src, pl.marker.fx, pl.marker.fy, pl.sheet.px[0], pl.sheet.px[1], 0.45, 'On the drawing · wider', 'the same drawing, further out') : null;
  const empty = (label, why) => `<span class="dcpic empty"><em>${esc(label)}</em><span>${esc(why)}</span></span>`;
  const p1 = plan || empty('On the drawing', 'no drawing link yet');
  const p2 = aerial || wider || empty('From the air', 'no position on the plan yet');
  /* on the day: the record's drop photographs, the first one first; the aerial one second when there is one */
  const shots = (typeof dropPhotosOf === 'function' ? dropPhotosOf(key) : []).map(ph => ({ph, url: dropPhotoUrl(ph)})).filter(x => x.url);
  const isAir = x => !!((DROP_SLOTS[x.ph.slot] || {}).aerial || /aerial|drone|overhead|from above|bird/i.test(String(x.ph.caption || '')));
  const airShot = shots.find(isAir) || null;
  const first = shots.find(x => x !== airShot) || null;
  const second = airShot || shots.find(x => x !== first) || null;
  const shot = (x, label) => `<a class="dcpic" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer" title="${esc(dropPhotoSays(key, x.ph))}"><img src="${esc(x.url)}" alt="${esc(label)}" loading="lazy" decoding="async"><em>${esc(label)}</em></a>`;
  const hosted = !!(SYNC.backend && SYNC.backend.fileUrl);
  const q1 = first ? shot(first, dropPhotoCaption(first.ph, first.ph.slot)) : empty('On the day', hosted ? 'no photograph yet — Open the reference to add one' : 'no photograph yet');
  const q2 = second ? shot(second, (airShot && second === airShot ? 'Aerial · ' : '') + dropPhotoCaption(second.ph, second.ph.slot)) : empty('On the day · 2', airShot ? '' : 'the aerial goes here when there is one');
  return {html: `<div class="dcpics"><b class="dcpl">Where it goes</b>${p1}${p2}<b class="dcpl">On the day</b>${q1}${q2}</div>`, n: shots.length};
}
function dayCards(rows, kind){"""),
 ('pics in the card',
  """const mapThumb = dayCardMap(a);""",
  """const pics = dayCardPics(a, key);"""),
 ('location panel loses the thumbnail',
  """          ${mapThumb}</div>""",
  """          </div>"""),
 ('photo panel',
  """      <section class="dcp dcphoto"><h5>${dcIco('cam')}Site photographs</h5>
        ${photos.length ? `<div class="dcshots">${photos.slice(0, 3).map((p, i) => `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" title="open the photograph full size"><img src="${esc(p.url)}" alt="photograph ${i + 1} of ${photos.length} for ${esc(key)}" loading="lazy" decoding="async"></a>`).join('')}</div><span class="dcsub">${photos.length} photograph${photos.length === 1 ? '' : 's'} · add more in the drawer</span>`
                        : `<span class="dcsub dcnone">No photograph yet${SYNC.backend && SYNC.backend.fileUrl ? ' — Open the reference to add one' : ''}</span>`}
      </section>""",
  """      <section class="dcp dcphoto"><h5>${dcIco('cam')}Pictures</h5>
        ${pics.html}
        <span class="dcsub">${pics.n ? pics.n + ' photograph' + (pics.n === 1 ? '' : 's') + ' on the record · the drawer holds them all' : 'the two on the left are the plan; the two on the right fill as photographs are attached'}</span>
      </section>"""),
 ('style',
  """@media print{ .dcard{break-inside:avoid;box-shadow:none} .dcf,.dcmap{display:none} }
</style></head>""",
  """@media print{ .dcard{break-inside:avoid;box-shadow:none} .dcf,.dcmap{display:none} }
/* v6.54 - the four pictures */
.dcphoto{grid-column:span 6} .dcprog{grid-column:span 3} .dcnote{grid-column:span 3}
.dcpics{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;align-items:stretch}
.dcpics .dcpl{grid-column:span 2;font-size:9px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--slate);align-self:end;padding:2px 2px 0}
.dcpics .dcpl:nth-of-type(1){grid-column:1 / span 2} .dcpics .dcpl:nth-of-type(2){grid-column:3 / span 2}
.dcpics .dcpl:nth-of-type(2){grid-row:1} .dcpics .dcpl:nth-of-type(1){grid-row:1}
.dcpics > .dcpic:nth-of-type(1),.dcpics > .dcpic:nth-of-type(2),.dcpics > .dcpic:nth-of-type(3),.dcpics > .dcpic:nth-of-type(4){grid-row:2}
.dcpic{position:relative;display:block;aspect-ratio:4/3;border-radius:8px;overflow:hidden;background:#101416;border:1px solid var(--rule);text-decoration:none;color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}
.dcpic img{position:absolute;max-width:none;left:0;top:0;width:100%;height:100%;object-fit:cover;display:block}
.dcpic img[style]{height:auto;object-fit:initial}
.dcpic .dcx{position:absolute;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;border:2px solid #fff;background:rgba(255,106,19,.55);box-shadow:0 0 0 3px rgba(255,106,19,.35),0 2px 6px rgba(0,0,0,.6)}
.dcpic em{position:absolute;left:0;right:0;bottom:0;padding:4px 7px;font:800 9.5px/1.2 'Inter',var(--sans,system-ui,sans-serif);font-style:normal;letter-spacing:.06em;text-transform:uppercase;color:#fff;background:linear-gradient(0deg,rgba(0,0,0,.72),rgba(0,0,0,0));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dcpic.empty{background:var(--tint2,rgba(127,127,127,.08));border:1px dashed var(--rule);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:8px;text-align:center}
.dcpic.empty em{position:static;background:none;color:var(--slate);padding:0;white-space:normal} .dcpic.empty span{font-size:10.5px;color:var(--mute);line-height:1.3}
.dcpic:hover img{filter:brightness(1.06)}
@media (max-width:1100px){ .dcphoto{grid-column:span 12} .dcprog,.dcnote{grid-column:span 6} }
@media (max-width:760px){ .dcpics{grid-template-columns:1fr 1fr} .dcpics .dcpl:nth-of-type(1){grid-column:1 / span 2;grid-row:1} .dcpics .dcpl:nth-of-type(2){grid-column:1 / span 2;grid-row:3}
  .dcpics > .dcpic:nth-of-type(1),.dcpics > .dcpic:nth-of-type(2){grid-row:2} .dcpics > .dcpic:nth-of-type(3),.dcpics > .dcpic:nth-of-type(4){grid-row:4} }
@media print{ .dcpic .dcx{-webkit-print-color-adjust:exact;print-color-adjust:exact} }
</style></head>"""),
]
for path in [page] + ([builder] if builder else []):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    for what, old, new in EDITS: t = rep(t, old, new, what, path)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))
