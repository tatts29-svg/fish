#!/usr/bin/env python3
"""v5.90 - ONE WAY ROUND, ONE WAY THROUGH (Andrew Fisher, 25 Sep 2026).
Every map starts the way D001 is drawn (beach along the top): the satellite pins map, the street-level map, the
register map and the 3D satellite open at the sheet's bearing (DATA.georef.orientation.sheet_top_bearing_deg), with
north on each map's compass. The full-screen frame that carries The Coates Way machine now carries the satellite plan
explorer and the 3D proof too (the hosted set's pages), switched from its own header without leaving the page; the
Map tab and The Coates Way tab open them. python3 patch_v590.py <builder>"""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8-sig').read(); bom = open(p, encoding='utf-8').read(1) == '﻿'; n0 = len(s)
def rep(old, new, label, count=1):
    global s
    assert s.count(old) == count, (label, s.count(old)); s = s.replace(old, new); print('ok', label)

# 1. the sheet's bearing, once
rep("""const MACHINE = {open: false, ret: null, inert: [], onKey: null, status: null};""",
"""const MACHINE = {open: false, ret: null, inert: [], onKey: null, status: null, kind: 'machine'};
/* v5.90 - every map starts the way D001 is drawn: the sheet's top bears this (the georef says 89.84°), so a map
   turned to it has the beach along the top, the way the crew reads the printed plan; the compass on each map says
   where north is */
function sheetBearing(){ const o = DATA.georef && DATA.georef.orientation; return o && Number.isFinite(o.sheet_top_bearing_deg) ? o.sheet_top_bearing_deg : 89.84; }
/* v5.90 - one press opens a page of the hosted set in the full-screen frame; the frame's own header switches between them */
document.addEventListener('click', e => { const b = e.target.closest('[data-open],[data-mpage]'); if (!b || b.disabled) return; e.preventDefault(); machineOpen(b.dataset.open || b.dataset.mpage); });""", 'bearing helper and the one click')
# 2. the three Mapbox maps
rep("""                      center: b ? b.getCenter() : [153.42696, -27.98801], zoom: 15.2});""",
    """                      center: b ? b.getCenter() : [153.42696, -27.98801], zoom: 15.2, bearing: sheetBearing()});""", 'pins map bearing')
rep("""    map = new gl.Map({container: el, style: 'mapbox://styles/mapbox/satellite-streets-v12', center: [lon, lat], zoom: 18,
                      attributionControl: true, cooperativeGestures: true, dragRotate: true, pitchWithRotate: true, touchPitch: true});""",
    """    map = new gl.Map({container: el, style: 'mapbox://styles/mapbox/satellite-streets-v12', center: [lon, lat], zoom: 18, bearing: sheetBearing(),
                      attributionControl: true, cooperativeGestures: true, dragRotate: true, pitchWithRotate: true, touchPitch: true});""", 'spot map bearing')
rep("""    map = new gl.Map({container: el, style: 'mapbox://styles/mapbox/satellite-streets-v12', center: centre, zoom: 17.2,
                      attributionControl: true, cooperativeGestures: true, dragRotate: true, pitchWithRotate: true, touchPitch: true});""",
    """    map = new gl.Map({container: el, style: 'mapbox://styles/mapbox/satellite-streets-v12', center: centre, zoom: 17.2, bearing: sheetBearing(),
                      attributionControl: true, cooperativeGestures: true, dragRotate: true, pitchWithRotate: true, touchPitch: true});""", 'register map bearing')
# 3. the 3D satellite: camera set back along the sheet's bearing, looking the D001 way round
rep("""  if (fly && tgt) viewer.camera.flyTo({destination: C.Cartesian3.fromDegrees(tgt.lon, tgt.lat - (tgt.height / 6378137) * (180 / Math.PI) * 1.1, tgt.height), orientation: {heading: 0, pitch: C.Math.toRadians(tgt.pitch), roll: 0}, duration: 0});""",
    """  if (fly && tgt) { const hb = sheetBearing(), hr = C.Math.toRadians(hb), d = (tgt.height / 6378137) * (180 / Math.PI) * 1.1;   /* v5.90 - the D001 way round */
    viewer.camera.flyTo({destination: C.Cartesian3.fromDegrees(tgt.lon - Math.sin(hr) * d / Math.cos(C.Math.toRadians(tgt.lat)), tgt.lat - Math.cos(hr) * d, tgt.height), orientation: {heading: hr, pitch: C.Math.toRadians(tgt.pitch), roll: 0}, duration: 0}); }""", '3D satellite heading')
# 4. the frame carries three pages
rep("""    <p class="mname">The Coates Way · V8 Connected<i id="machineBuild"></i></p>
    <div class="mbtns">""",
"""    <p class="mname"><span id="machineName">The Coates Way · V8 Connected</span><i id="machineBuild"></i></p>
    <div class="mbtns">
      <div class="mpages" role="group" aria-label="Pages of the hosted set"><button class="btn ghost" type="button" data-mpage="machine" aria-pressed="true">Coates Way</button><button class="btn ghost" type="button" data-mpage="explorer" aria-pressed="false">Plan on satellite</button><button class="btn ghost" type="button" data-mpage="proof3d" aria-pressed="false">3D proof</button></div>""", 'frame header pages')
rep("""function machineOpen(){
  if (MACHINE.open || !machineHosted()) return;
  if (MACHINE.status && MACHINE.status.ready === false) { flash('The machine is not on this service yet.'); return; }
  const url = SYNC.backend.machineUrl();
  MACHINE.open = true; MACHINE.ret = document.activeElement;
  const panel = $('#machine'), holder = $('#machineFrame'), wait = $('#machineWait');
  const meta = MACHINE.status && MACHINE.status.ready ? MACHINE.status : (DATA.machine || {});
  $('#machineBuild').textContent = (meta.version ? 'build ' + meta.version : '') + (meta.files ? ' · ' + meta.files + ' files' : '');
  const own = $('#machineOwn'); if (own) own.href = url;
  const f = document.createElement('iframe');
  f.title = 'The Coates Way · V8 Connected'; f.src = url; f.allow = 'fullscreen; autoplay'; f.setAttribute('allowfullscreen', '');
  f.setAttribute('referrerpolicy', 'no-referrer');
  wait.hidden = false;
  f.addEventListener('load', () => { wait.hidden = true; });
  holder.appendChild(f);
  panel.hidden = false;""",
"""/* v5.90 - the one full-screen frame carries three pages of the hosted set: The Coates Way machine, the satellite plan
   explorer (D001 on real satellite, 64,000 per cent, find-on-drawing) and the 3D proof (Google photorealistic tiles
   in CesiumJS). Its header switches between them without leaving this page; each is fetched only when pressed. */
const MACHINE_PAGES = {
  machine: {name: 'The Coates Way · V8 Connected', path: '', wait: 'Loading the machine…', ref: 'no-referrer', sub: ''},
  explorer: {name: 'Satellite plan explorer', path: 'explorer/index.html', wait: 'Loading the plan explorer…', ref: 'strict-origin-when-cross-origin', sub: 'D001 rev 03 on real satellite · the plan itself, to 64,000 per cent'},
  proof3d: {name: '3D proof', path: 'poc3d/index.html', wait: 'Loading the 3D proof — Google\\'s tiles are fetched now, on this press…', ref: 'strict-origin-when-cross-origin', sub: 'Google photorealistic 3D tiles in CesiumJS · billed per opening'}};
function machineFrameLoad(kind){
  const pg = MACHINE_PAGES[kind] || MACHINE_PAGES.machine, base = SYNC.backend.machineUrl();
  const url = base + pg.path + (pg.path ? '?back=' + (canEdit() ? 'e' : 'v') : '');
  MACHINE.kind = kind;
  const holder = $('#machineFrame'), wait = $('#machineWait');
  holder.querySelectorAll('iframe').forEach(f => { try { f.src = 'about:blank'; } catch (e) {} f.remove(); });
  const meta = MACHINE.status && MACHINE.status.ready ? MACHINE.status : (DATA.machine || {});
  $('#machineName').textContent = pg.name;
  $('#machineBuild').textContent = kind === 'machine' ? (meta.version ? 'build ' + meta.version : '') + (meta.files ? ' · ' + meta.files + ' files' : '') : pg.sub;
  $$('#machine [data-mpage]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mpage === kind)));
  const own = $('#machineOwn'); if (own) own.href = url;
  const f = document.createElement('iframe');
  f.title = pg.name; f.src = url; f.allow = 'fullscreen; autoplay'; f.setAttribute('allowfullscreen', '');
  f.setAttribute('referrerpolicy', pg.ref);
  wait.textContent = pg.wait; wait.hidden = false;
  f.addEventListener('load', () => { wait.hidden = true; });
  holder.appendChild(f);
}
function machineOpen(kind){
  kind = MACHINE_PAGES[kind] ? kind : 'machine';
  if (!machineHosted()) return;
  if (MACHINE.status && MACHINE.status.ready === false) { flash('That page is not on this service yet.'); return; }
  if (MACHINE.open) { if (MACHINE.kind !== kind) machineFrameLoad(kind); return; }
  MACHINE.open = true; MACHINE.ret = document.activeElement;
  const panel = $('#machine');
  machineFrameLoad(kind);
  panel.hidden = false;""", 'frame opens any of the three')
# 5. entry points: the Map tab (both boards) and The Coates Way tab
rep("""   ${sat3dPossible() ? `<button class="btn sheetbtn satbtn" data-sheet="${SAT_3D}">Satellite · 3D</button>` : ''}
  </div>""",
"""   ${sat3dPossible() ? `<button class="btn sheetbtn satbtn" data-sheet="${SAT_3D}">Satellite · 3D</button>` : ''}
   ${machineHosted() ? `<button class="btn sheetbtn satbtn" type="button" data-open="explorer">Plan on satellite</button><button class="btn sheetbtn satbtn" type="button" data-open="proof3d">3D proof</button>` : ''}
  </div>""", 'map tab buttons (pins board)')
rep("""   <button class="btn sheetbtn satbtn primary" data-sheet="${SAT_3D}">Satellite · 3D</button>
  </div>""",
"""   <button class="btn sheetbtn satbtn primary" data-sheet="${SAT_3D}">Satellite · 3D</button>
   ${machineHosted() ? `<button class="btn sheetbtn satbtn" type="button" data-open="explorer">Plan on satellite</button><button class="btn sheetbtn satbtn" type="button" data-open="proof3d">3D proof</button>` : ''}
  </div>""", 'map tab buttons (3D board)')
rep("""<button class="btn primary" id="cwOpenMachine" type="button"${DATA.edition === 'hosted' ? '' : ' hidden'}>Open the machine</button>""",
    """<button class="btn primary" id="cwOpenMachine" type="button"${DATA.edition === 'hosted' ? '' : ' hidden'}>Open the machine</button>${DATA.edition === 'hosted' ? '<button class="btn ghost" type="button" data-open="explorer">Plan on satellite</button><button class="btn ghost" type="button" data-open="proof3d">3D proof</button>' : ''}""", 'Coates Way tab buttons')
# 6. style for the page switch
rep(""".mbtns{display:flex;gap:8px;align-items:center;flex-wrap:nowrap;flex:none}""",
    """.mbtns{display:flex;gap:8px;align-items:center;flex-wrap:nowrap;flex:none}
.mpages{display:flex;gap:4px;margin-right:6px}.mpages .btn[aria-pressed="true"]{background:var(--orange);color:#1b1207;border-color:var(--orange)}
@media (max-width:720px){.mname{display:none}.mpages .btn,.mbtns .btn{padding:6px 8px;font-size:12px}#machineOwn{display:none}}""", 'frame css')
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s); print('ok v5.90', n0, '->', len(s))
