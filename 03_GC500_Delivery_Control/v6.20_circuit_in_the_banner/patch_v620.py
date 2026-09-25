#!/usr/bin/env python3
"""v6.20 - THE CIRCUIT IN THE BANNER, WITH THE DAY'S DELIVERIES ON IT (26 Sep 2026).

Andrew Fisher, 26 Sep 2026, with four mock-ups: the car and the search up the top left; the circuit map top right; the
pods in one row under them; the day's deliveries shown on the map, only what is due in on that exact day, and each
reference with the options to go exactly where it needs to go.

THE MAP. The registered 2022 aerial (the Map tab's own, georef.basemap_px_to_epsg3857) cropped to the circuit, darkened
for the banner, with the key-plan ring drawn on it as a glowing orange line by the same registration the 3D proof uses
(print/gc3d_registration.json: key plan -> metres east/north of lat0/lon0 -> EPSG:3857 -> aerial pixels). Made once by
make_hzmap.py (1600 x 668, 225 kB webp), hosted media like the hero loop; DATA.hzmap carries the crop so a pin's aerial
fraction (aerialPointFor, the Map tab's own arithmetic: the callout's arrow tip on the registered drawing) lands on it.

THE PINS. The banner's day pod already counts the day's due-in entries (todayFigures); the same list is pinned - a
reference plate over a light dot in the delivery light's colour - on the map. A reference with no drawing position is
counted under the caption ("2 without a position"), never guessed. Pressing a pin opens its menu: the plan (the Map tab
on that sheet, the marker ringed - mapLocate), the satellite (the same, on the satellite view), the plan explorer (opened
on that reference - a new ?find= on the explorer), the 3D proof, and Navigate (the phone's maps app at the reference's
coordinates - spotOf, the drawer's own). The map folds away with one press (remembered on this device).

THE LAYOUT. Laptop: a grid - the car and wordmark top left, the search and Tools under them, the map across the right,
the cluster (clock, race day, record, then the day pod) in one row beneath, and the tabs. Phone: the lockup, the map
full width, the pods, the tabs. Short laptop screens get a shorter map.

  python3 patch_v620.py <page.html> <kit media dir> <hero dir with hzmap.webp + hzmap.json> [builder.py]
"""
import hashlib, json, os, re, shutil, sys

page, kit_media, hero_dir = sys.argv[1], sys.argv[2], sys.argv[3]
builder = sys.argv[4] if len(sys.argv) > 4 else None

def canonical(v):
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)

# ---- 1. the map as hosted media ----------------------------------------------------------------------------------------
b = open(os.path.join(hero_dir, 'hzmap.webp'), 'rb').read(); sha = hashlib.sha256(b).hexdigest(); fn = sha + '.webp'
dst = os.path.join(kit_media, fn)
if not os.path.exists(dst): shutil.copyfile(os.path.join(hero_dir, 'hzmap.webp'), dst)
asset = {'bytes': len(b), 'file': fn, 'scope': 'view', 'sha256': sha, 'type': 'image/webp'}
meta = json.load(open(os.path.join(hero_dir, 'hzmap.json')))
mp = os.path.join(kit_media, 'manifest.json'); man = json.load(open(mp))
if fn not in {a['file'] for a in man['assets']}: man['assets'].append(asset)
man['assets'].sort(key=lambda a: a['file'])
man['sha256'] = hashlib.sha256(canonical({'schema': 'gc500-media-v1', 'assets': man['assets']}).encode('utf-8')).hexdigest()
json.dump(man, open(mp, 'w'), indent=1); print('manifest', len(man['assets']), 'assets, digest', man['sha256'][:12], '· map', fn[:12], len(b), 'bytes')

# ---- 2. the page's DATA ------------------------------------------------------------------------------------------------
s = open(page, encoding='utf-8').read(); bom = s.startswith('﻿'); s = s.lstrip('﻿'); n0 = len(s)
i = s.find('const DATA = '); j = s.find('\n', i); line = s[i:j]; assert line.endswith(';')
obj = json.loads(line[len('const DATA = '):-1])
assert json.dumps(obj, ensure_ascii=False, separators=(',', ':')) == line[len('const DATA = '):-1], 'DATA would not re-serialise byte for byte'
obj['media'][sha] = {'file': fn, 'sha256': sha, 'type': 'image/webp', 'bytes': len(b), 'scope': 'view'}
assert len(obj['media']) == len(man['assets'])
obj['hostedMedia']['manifest'] = man['sha256']
obj['hzmap'] = {'src': {'media': sha}, 'crop': meta['crop'], 'aerial_px': meta['aerial_px'], 'px': meta['px'], 'up_is_bearing_deg': meta['up_is_bearing_deg'],
                'lap_length_m': meta.get('lap_length_m'),
                'is': 'The registered 2022 aerial (the Map tab\'s) cropped to the circuit, with the key-plan ring drawn on it by the same registration the 3D proof uses; made by make_hzmap.py, 26 Sep 2026'}
s = s[:i] + 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';' + s[j:]
print('DATA: hzmap crop', meta['crop'], 'media', len(obj['media']))

def rep(text, old, new, what):
    pat = '\\n'.join('[ \\t]*' + re.escape(l.lstrip()) for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what}: expected once, found {len(ms)}: {old[:80]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]

# ---- 3. markup: the map panel after the search, before Tools -------------------------------------------------------------
OLD_MAP_ANCHOR = """     <div class="finder" id="finder" role="listbox" aria-label="Matches" hidden></div>
   </div>"""
NEW_MAP_ANCHOR = """     <div class="finder" id="finder" role="listbox" aria-label="Matches" hidden></div>
   </div>
   <!-- v6.20 - THE CIRCUIT IN THE BANNER (Andrew Fisher's mock-ups, 26 Sep 2026): the registered aerial with the key-plan
        ring, and the day's due-in deliveries pinned on it, each pin a menu to exactly where it needs to go -->
   <div class="hzmap" id="hzmap" role="group" aria-label="The circuit, with the day's deliveries">
     <img id="hzmapImg" alt="The Surfers Paradise street circuit on the registered aerial photograph" decoding="async">
     <div class="hzpins" id="hzpins"></div>
     <div class="hzmapcap"><b>Surfers Paradise street circuit</b><span id="hzmapSub"></span></div>
     <svg class="hznorth" id="hznorth" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l5 18-5-4-5 4z" fill="#f6f1ec"/><path d="M12 2l5 18-5-4z" fill="#ff6a13"/></svg><i class="hznorthl" id="hznorthl" aria-hidden="true">N</i>
     <button type="button" class="hzmapfold" id="hzmapFold" aria-expanded="true" title="Fold the map away, or open it again">Fold</button>
   </div>"""

# ---- 4. the figures carry the list; the pod draws the pins; the explorer opens on a reference ----------------------------
OLD_FIG_RETURN = """  return {d, dayNow: !!dayNow, due: due.length, onsite, notYet: R.review, refs: R.refs, chase: R.total, both: R.both,"""
NEW_FIG_RETURN = """  return {d, dayNow: !!dayNow, due: due.length, onsite, notYet: R.review, refs: R.refs, chase: R.total, both: R.both, list: due.map(r => r.a),   /* v6.20 - the list, for the banner's map */"""

OLD_POD_WIRE = """  if (!el.dataset.wired) { el.dataset.wired = '1'; el.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); }); }
}"""
NEW_POD_WIRE = """  if (!el.dataset.wired) { el.dataset.wired = '1'; el.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); }); }
  hzMapPins(f);
}
/* v6.20 - THE BANNER'S CIRCUIT MAP. DATA.hzmap is the registered aerial cropped to the circuit with the key-plan ring drawn on
   it (make_hzmap.py); a pin is placed by aerialPointFor - the Map tab's own arithmetic - turned into a fraction of the crop.
   The image is drawn contain-fit, so the pins are laid out from the drawn image's rectangle, and again when the panel resizes. */
const HZMAP = {init: false, pins: [], ro: null};
function hzMapInit(){
  const box = $('#hzmap'), M = DATA.hzmap; if (!box || HZMAP.init) return; HZMAP.init = true;
  if (!M || !M.src) { box.hidden = true; return; }
  const img = $('#hzmapImg'); img.src = M.src;
  const up = M.up_is_bearing_deg || 0, n = $('#hznorth'); if (n) n.style.transform = 'rotate(' + (-up).toFixed(2) + 'deg)';
  const lap = M.lap_length_m ? ' · lap ' + (M.lap_length_m / 1000).toFixed(2) + ' km' : '';
  box.dataset.lap = lap;
  let folded = false; try { folded = localStorage.getItem('gc500.hzmap') === 'folded'; } catch (e) {}
  const fold = $('#hzmapFold');
  const setFold = f => { box.classList.toggle('folded', f); fold.setAttribute('aria-expanded', String(!f)); fold.textContent = f ? 'Map' : 'Fold'; try { localStorage.setItem('gc500.hzmap', f ? 'folded' : 'open'); } catch (e) {} if (!f) hzPinsLayout(); };
  setFold(folded); fold.onclick = () => setFold(!box.classList.contains('folded'));
  if ('ResizeObserver' in window) { HZMAP.ro = new ResizeObserver(() => hzPinsLayout()); HZMAP.ro.observe(box); }
  img.addEventListener('load', hzPinsLayout);
  $('#hzpins').addEventListener('click', e => { const p = e.target.closest('.hzpin'); if (p) { e.stopPropagation(); hzPinMenu(p.dataset.key, p); } });
  document.addEventListener('click', e => { if (!e.target.closest('.hzpinmenu')) hzPinMenuClose(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hzPinMenuClose(); });
}
function hzMapPins(f){
  hzMapInit(); const box = $('#hzmap'), M = DATA.hzmap, host = $('#hzpins'); if (!box || box.hidden || !M) return;
  const [x0, y0, x1, y1] = M.crop, AW = M.aerial_px[0], AH = M.aerial_px[1];
  const pins = [], missing = [];
  for (const a of (f.list || [])) {
    let pt = null; try { pt = aerialPointFor(a); } catch (e) { pt = null; }
    if (!pt) { missing.push(a.key); continue; }
    const fx = (pt.ax * AW - x0) / (x1 - x0), fy = (pt.ay * AH - y0) / (y1 - y0);
    if (fx < 0 || fx > 1 || fy < 0 || fy > 1) { missing.push(a.key); continue; }
    const d = deliveryOf(a.key), light = d && d.light ? d.light : '';
    pins.push({key: a.key, fx, fy, light});
  }
  HZMAP.pins = pins;
  host.innerHTML = pins.map(p => `<button type="button" class="hzpin" data-key="${esc(p.key)}" data-fx="${p.fx.toFixed(4)}" data-fy="${p.fy.toFixed(4)}" aria-label="${esc(p.key)} — press for where to go"><span class="rplate">${esc(p.key)}</span><i class="stem"></i><i class="dot ${esc(p.light)}"></i></button>`).join('');
  const sub = $('#hzmapSub');
  if (sub) sub.textContent = (f.due ? fmtNum(f.due) + (f.due === 1 ? ' delivery due in ' : ' deliveries due in ') + (f.dayNow ? 'today' : 'on ' + f.d.dow + ' ' + f.d.dm) : 'nothing due in ' + (f.dayNow ? 'today' : 'on ' + f.d.dow + ' ' + f.d.dm))
    + (pins.length ? ' · ' + fmtNum(pins.length) + ' pinned' : '') + (missing.length ? ' · ' + fmtNum(missing.length) + ' without a position on the plan' : '') + (box.dataset.lap || '');
  hzPinsLayout();
}
function hzPinsLayout(){
  const box = $('#hzmap'), img = $('#hzmapImg'); if (!box || box.hidden || box.classList.contains('folded') || !img || !img.naturalWidth) return;
  const W = box.clientWidth, H = box.clientHeight, iw = img.naturalWidth, ih = img.naturalHeight;
  const sc = Math.min(W / iw, H / ih), dw = iw * sc, dh = ih * sc, ox = (W - dw) / 2, oy = (H - dh) / 2;   /* object-fit: contain, centred */
  for (const p of box.querySelectorAll('.hzpin')) { const x = ox + (+p.dataset.fx) * dw, y = oy + (+p.dataset.fy) * dh; p.style.left = x.toFixed(1) + 'px'; p.style.top = y.toFixed(1) + 'px'; p.hidden = x < -10 || x > W + 10 || y < -10 || y > H + 10; }
}
function hzPinMenuClose(){ const m = $('#hzpinmenu'); if (m) m.remove(); }
/* the pin's menu: exactly where it needs to go - the plan (the Map tab, the marker ringed), the satellite, the plan explorer
   opened on the reference, the 3D proof, and Navigate (the maps app at its coordinates) */
function hzPinMenu(key, pin){
  hzPinMenuClose(); const a = assetOf(key); if (!a) return;
  const box = $('#hzmap'); const place = (typeof mapPlaceFor === 'function') ? mapPlaceFor(a) : null; const spot = (typeof spotOf === 'function') ? spotOf(a) : null;
  const hosted = typeof machineHosted === 'function' && machineHosted();
  const items = [];
  if (place) items.push(['plan', 'The plan — ' + (place.sheet.sheet_id || place.sheet.title || 'the sheet') + ', callout ' + place.label]);
  if (place && spot) items.push(['sat', 'The satellite, at its pin']);
  if (hosted) items.push(['explorer', 'The plan explorer, on ' + key]);
  if (hosted) items.push(['proof3d', 'The 3D proof']);
  if (spot) items.push(['nav', 'Navigate there (opens your maps app)']);
  items.push(['open', 'Open ' + key + ' on Plant']);
  const m = document.createElement('div'); m.className = 'hzpinmenu'; m.id = 'hzpinmenu'; m.setAttribute('role', 'menu');
  m.innerHTML = `<b>${refPlate(key, 13)} <span>${esc((a.item_types || []).join(', ') || a.product || '')}${a.name ? ' · ' + esc(a.name) : ''}</span></b>` + items.map(([k, l]) => `<button type="button" role="menuitem" data-act="${k}">${esc(l)}</button>`).join('');
  box.appendChild(m);
  const r = pin.getBoundingClientRect(), br = box.getBoundingClientRect();
  let left = r.left - br.left + r.width / 2 - 90, top = r.bottom - br.top + 6;
  left = Math.max(6, Math.min(left, br.width - m.offsetWidth - 6)); if (top + m.offsetHeight > br.height - 6) top = Math.max(6, r.top - br.top - m.offsetHeight - 6);
  m.style.left = left + 'px'; m.style.top = top + 'px';
  m.onclick = e => { const b = e.target.closest('[data-act]'); if (!b) return; const act = b.dataset.act; hzPinMenuClose();
    if (act === 'plan') { state.fview = null; mapLocate(place.sheet.key, place.label, key, {marker: place.marker}); }
    else if (act === 'sat') { mapLocate(place.sheet.key, place.label, key, {marker: place.marker}); state.fview = 'map'; renderPass(); }
    else if (act === 'explorer') { MACHINE.find = key; machineOpen('explorer'); }
    else if (act === 'proof3d') { machineOpen('proof3d'); }
    else if (act === 'nav') { window.open(navUrl({lat: spot.lat, lon: spot.lon}), '_blank', 'noopener'); }
    else if (act === 'open') { go('plant'); openAsset(key); } };
  const first = m.querySelector('button'); if (first) first.focus();
}"""

OLD_FRAME_URL = """  const url = base + pg.path + (pg.path ? '?back=' + (canEdit() ? 'e' : 'v') : '');"""
NEW_FRAME_URL = """  const url = base + pg.path + (pg.path ? '?back=' + (canEdit() ? 'e' : 'v') : '') + (kind === 'explorer' && MACHINE.find ? '&find=' + encodeURIComponent(MACHINE.find) : '');   /* v6.20 - the explorer opened on a reference */
  MACHINE.find = null;"""

# ---- 5. the look and the layout ------------------------------------------------------------------------------------------
OLD_STYLE_END = """@media print{ .kpi,.day{filter:none} main .card{box-shadow:none} .pgban .rbcap{position:static;background:none;color:inherit;border:0;box-shadow:none;text-shadow:none} .pgban .rbwin::after{display:none} .hzpod.hztd{display:none} }
</style></head>"""
NEW_STYLE_END = """@media print{ .kpi,.day{filter:none} main .card{box-shadow:none} .pgban .rbcap{position:static;background:none;color:inherit;border:0;box-shadow:none;text-shadow:none} .pgban .rbwin::after{display:none} .hzpod.hztd{display:none} }
/* ================================================================================================================
   v6.20 - THE CIRCUIT IN THE BANNER (Andrew Fisher's mock-ups, 26 Sep 2026): the map panel, its pins and their menu, and
   the banner's grid - the car and the search top left, the map across the right, the pods in one row beneath.
   ================================================================================================================ */
.hzmap{position:relative;overflow:hidden;border-radius:14px;background:#0b0f12;min-height:0;z-index:2;
  box-shadow:0 0 0 1px #3a2c24,0 0 0 2px #0a0706,0 14px 30px -10px rgba(0,0,0,.95),inset 0 1px 0 rgba(255,255,255,.07)}
.hzmap img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center;display:block}   /* contain: the whole ring is always in the panel; the dark bars either side belong to the instrument */
.hzmap::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.30),rgba(0,0,0,0) 32%,rgba(0,0,0,0) 72%,rgba(0,0,0,.42)),radial-gradient(120% 90% at 50% 50%,rgba(0,0,0,0) 60%,rgba(0,0,0,.35))}
.hzmap.folded{height:44px;aspect-ratio:auto;min-height:44px} .hzmap.folded img,.hzmap.folded .hzpins,.hzmap.folded .hznorth,.hzmap.folded .hznorthl{display:none} .hzmap.folded .hzmapcap span{display:none}
.hzpins{position:absolute;inset:0;z-index:2}
.hzpin{position:absolute;transform:translate(-50%,-100%);appearance:none;border:0;background:none;padding:0 0 2px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:0;font:inherit;transition:transform .15s}
.hzpin .rplate{font-size:10px;box-shadow:0 0 0 1px #000,0 8px 16px -6px rgba(0,0,0,.95)}
.hzpin .stem{width:2px;height:7px;background:rgba(255,255,255,.75);box-shadow:0 0 4px rgba(0,0,0,.8)}
.hzpin .dot{width:9px;height:9px;border-radius:50%;background:#8d9a99;box-shadow:0 0 0 2px #0b0f12,0 0 8px rgba(255,255,255,.45)}
.hzpin .dot.green{background:#39e07a;box-shadow:0 0 0 2px #0b0f12,0 0 12px rgba(57,224,122,.95)} .hzpin .dot.amber{background:#ffb020;box-shadow:0 0 0 2px #0b0f12,0 0 12px rgba(255,176,32,.95)} .hzpin .dot.red{background:#ff3b3b;box-shadow:0 0 0 2px #0b0f12,0 0 12px rgba(255,59,59,.95)}
.hzpin:hover,.hzpin:focus-visible{transform:translate(-50%,-100%) scale(1.12);z-index:3;outline:none}
.hzmapcap{position:absolute;left:12px;top:9px;z-index:3;color:#f6f1ec;font:700 9.5px/1.2 'Inter',var(--sans,system-ui,sans-serif);letter-spacing:.2em;text-transform:uppercase;text-shadow:0 1px 2px #000,0 0 10px rgba(0,0,0,.7);pointer-events:none;max-width:80%}
.hzmapcap span{display:block;font-weight:600;letter-spacing:.1em;color:#d5dcdb;margin-top:3px;text-transform:none;font-size:10.5px;letter-spacing:.04em}
.hznorth{position:absolute;right:12px;top:10px;z-index:3;width:24px;height:24px;filter:drop-shadow(0 1px 2px #000)} .hznorthl{position:absolute;right:38px;top:13px;z-index:3;font:800 11px/1 'Inter',var(--sans,system-ui,sans-serif);color:#f6f1ec;text-shadow:0 1px 2px #000;font-style:normal}
.hzmapfold{position:absolute;right:10px;bottom:8px;z-index:4;appearance:none;border:1px solid rgba(255,255,255,.22);background:rgba(16,24,31,.72);color:#e8ebe9;border-radius:7px;padding:4px 9px;font:700 10px/1 'Inter',var(--sans,system-ui,sans-serif);letter-spacing:.12em;text-transform:uppercase;cursor:pointer}
.hzmapfold:hover{background:rgba(255,106,19,.85);border-color:#ff6a13;color:#fff}
.hzpinmenu{position:absolute;z-index:6;min-width:200px;max-width:min(320px,92%);background:#10181ff2;border:1px solid #ff6a1370;border-radius:10px;padding:6px;box-shadow:0 14px 30px -10px rgba(0,0,0,.95),0 0 0 1px #000;display:flex;flex-direction:column;gap:3px}
.hzpinmenu b{display:flex;align-items:center;gap:8px;font:600 11px/1.3 'Inter',var(--sans,system-ui,sans-serif);color:#f4f7f6;padding:4px 8px 7px;border-bottom:1px solid rgba(255,255,255,.12)} .hzpinmenu b span{color:#c9d1d0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hzpinmenu button{appearance:none;border:0;background:#1c2628;color:#f4f7f6;border-radius:7px;padding:7px 9px;text-align:left;font:600 12px/1.25 'Inter',var(--sans,system-ui,sans-serif);cursor:pointer}
.hzpinmenu button:hover,.hzpinmenu button:focus-visible{background:var(--orange);color:#fff;outline:none}
@media (min-width:641px){
  .brandrow{display:grid;grid-template-columns:auto auto minmax(280px,1fr);grid-template-areas:"lock lock map" "search tools map" "cluster cluster cluster";align-items:center;column-gap:14px;row-gap:8px}
  .lockup{grid-area:lock} .search{grid-area:search;flex:none;min-width:280px;max-width:520px} .tools{grid-area:tools;justify-self:end} .navback{grid-area:tools;justify-self:start;align-self:center}
  .hzmap{grid-area:map;align-self:stretch;aspect-ratio:4760/1989;max-height:380px}
  .hzcluster{grid-area:cluster;margin-left:auto;max-width:100%;justify-content:flex-end}
  .hzpod.hztd{flex:1 1 440px;order:9;min-width:0}
  body.search-open .brandrow{display:flex}
}
@media (min-width:641px) and (max-height:820px){ .hzmap{aspect-ratio:auto;height:250px} }
@media (max-width:640px){
  .hzmap{flex:1 1 100%;order:4;height:200px;aspect-ratio:auto;border-radius:12px} .hzmapcap{max-width:70%} .hzpin .rplate{font-size:9px} .hzmapfold{display:none}
}
@media print{ .hzmap{display:none} }
</style></head>"""

for path in [page] + ([builder] if builder else []):
    t = open(path, encoding='utf-8').read() if path != page else s
    bom_ = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    t = rep(t, OLD_MAP_ANCHOR, NEW_MAP_ANCHOR, 'map anchor')
    t = rep(t, OLD_FIG_RETURN, NEW_FIG_RETURN, 'figures return')
    t = rep(t, OLD_POD_WIRE, NEW_POD_WIRE, 'pod wire')
    t = rep(t, OLD_FRAME_URL, NEW_FRAME_URL, 'frame url')
    t = rep(t, OLD_STYLE_END, NEW_STYLE_END, 'style end')
    open(path, 'w', encoding='utf-8').write(('﻿' if (bom if path == page else bom_) else '') + t); print('ok', path.split('/')[-1], n0, '->', len(t))
