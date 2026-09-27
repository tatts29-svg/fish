#!/usr/bin/env python3
"""v6.99 - the 3D model as a mode INSIDE the Map explorer (Andrew Fisher, 27 Sep 2026: "Everything in 3d proof should be
merged into plan on satellite ... We dont wanna double up on info").

Opened with ?embed=1 (by the explorer's 3D mode) the page is only the model: its own search box and trade chips are
hidden, because the explorer's search and Find chips drive it; its own pins are replaced by the explorer's (the Map's
numbers and places, so the 3D and the 2D can never disagree). Kept: the views, the compass, orbit, quality, full screen.
Added to window.GC500_3D:
   setPins([{k, n, c, g, ll:[lat, lon]}])  the pins, each with its colour and its chip group
   showGroups(ids | null)                   only these chip groups (null: every trade pin, no layers)
   find(code)                               fly to it and ring it
   and a tap on a pin calls window.parent.gc500Explorer3DPick(code) so the explorer shows its card.
Opened on its own it is the 3D proof exactly as before.   python3 patch_poc3d699.py <index.html>"""
import sys
p = sys.argv[1]; t = open(p, encoding='utf-8').read()
if 'EMBED3D' in t: sys.exit('already applied')
def R(old, new, what):
    global t
    if t.count(old) != 1: sys.exit('%s: %d' % (what, t.count(old)))
    t = t.replace(old, new)
R("</style>", """/* v6.99 - inside the Map explorer: the model only; the explorer's search and chips drive it */
body.embed3d .find,body.embed3d .chips,body.embed3d .xnav,body.embed3d .perf{display:none !important}
body.embed3d .pill{max-width:min(420px,calc(100% - 24px))}
body.embed3d header>b,body.embed3d header>span{display:none !important}   /* the explorer's own title is above it */
</style>""", 'css')
R("function setStatus(html) {", """const EMBED3D = new URLSearchParams(location.search).get('embed') === '1';
if (EMBED3D) document.body.classList.add('embed3d');
let GROUPS = null, RING = null;
function setStatus(html) {""", 'embed flag')
# the pin images by colour (the explorer's pins carry their own colour), and the explorer's pins in place of units3d.json
R("async function loadPins() {\n  try { const j = await (await fetch('units3d.json')).json(); PINS = j.pins || []; } catch (e) { PINS = []; }",
  """const IMG_BY_C = {};
function imgFor(c, area) { const k = c + (area ? '_a' : ''); return IMG_BY_C[k] || (IMG_BY_C[k] = pinImage(c, !!area)); }
function colourOf(p) { return p.c || (TRADES[p.t] || TRADES.other).c; }
function visible(p) { return GROUPS ? GROUPS.has(p.g) : (p.g ? /^t/.test(p.g) : shown.has(p.t)); }
function drawPins() {
  for (const e of pinEntities) viewer.entities.remove(e); pinEntities = [];
  const far = new Cesium.NearFarScalar(150, 1.0, 4000, 0.45), labelFar = new Cesium.DistanceDisplayCondition(0, PHONE ? 650 : 900);
  for (const p of PINS) {
    const c = colourOf(p);
    const e = viewer.entities.add({position: Cesium.Cartesian3.fromDegrees(p.ll[1], p.ll[0], 0), show: visible(p),
      billboard: {image: imgFor(c, p.a), width: 26, height: 35, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, heightReference: Cesium.HeightReference.CLAMP_TO_3D_TILE, scaleByDistance: far, disableDepthTestDistance: 2500},
      label: {text: p.k, font: '700 13px Inter, system-ui, sans-serif', fillColor: Cesium.Color.fromCssColorString(c === '#ffffff' || c === '#ffd166' ? '#15181a' : '#ffffff'), outlineColor: Cesium.Color.fromCssColorString('#0f0d0c'), outlineWidth: 0, style: Cesium.LabelStyle.FILL,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -38), heightReference: Cesium.HeightReference.CLAMP_TO_3D_TILE, distanceDisplayCondition: labelFar, scaleByDistance: far, disableDepthTestDistance: 2500,
        showBackground: true, backgroundColor: Cesium.Color.fromCssColorString(c).withAlpha(.92), backgroundPadding: new Cesium.Cartesian2(6, 3)}});
    e._gc = p; pinEntities.push(e);
  }
  viewer.scene.requestRender();
}
function ringAt(p) {
  if (RING) { viewer.entities.remove(RING); RING = null; }
  if (!p) return;
  const orange = Cesium.Color.fromCssColorString('#ff6a13');
  RING = viewer.entities.add({position: Cesium.Cartesian3.fromDegrees(p.ll[1], p.ll[0], 0),
    ellipse: {semiMajorAxis: 10, semiMinorAxis: 10, material: orange.withAlpha(.18), outline: true, outlineColor: orange, outlineWidth: 4, classificationType: Cesium.ClassificationType.CESIUM_3D_TILE}});
}
async function loadPins() {
  if (EMBED3D) { if (!PINS.length) { const w = window.__pendingPins; if (w) PINS = w; } drawPins(); return; }
  try { const j = await (await fetch('units3d.json')).json(); PINS = j.pins || []; } catch (e) { PINS = []; }""", 'pins')
R("function flyToPin(p, pick = true) {\n  stopOrbit(); if (!shown.has(p.t)) { shown.add(p.t); for (const en of pinEntities) en.show = shown.has(en._gc.t); chips(); }",
  "function flyToPin(p, pick = true) {\n  stopOrbit(); if (EMBED3D) { if (!visible(p)) { const en = pinEntities.find(x => x._gc === p); if (en) en.show = true; } ringAt(p); } else if (!shown.has(p.t)) { shown.add(p.t); for (const en of pinEntities) en.show = shown.has(en._gc.t); chips(); }", 'fly')
R("h.setInputAction(e => { const o = sc.pick(e.position); if (o && o.id && o.id._gc) { setStatus(describe(o.id._gc)); } }, Cesium.ScreenSpaceEventType.LEFT_CLICK);",
  "h.setInputAction(e => { const o = sc.pick(e.position); if (o && o.id && o.id._gc) { if (EMBED3D) { ringAt(o.id._gc); sc.requestRender(); try { window.parent.gc500Explorer3DPick && window.parent.gc500Explorer3DPick(o.id._gc.k); } catch (x) {} } else setStatus(describe(o.id._gc)); } }, Cesium.ScreenSpaceEventType.LEFT_CLICK);", 'pick')
R("window.GC500_3D = {fly, faceTo, startOrbit, stopOrbit,",
  """window.GC500_3D = {fly, faceTo, startOrbit, stopOrbit,
  setPins: list => { PINS = (list || []).filter(p => p && p.ll && isFinite(p.ll[0]) && isFinite(p.ll[1])); window.__pendingPins = PINS; if (viewer) drawPins(); },
  showGroups: ids => { GROUPS = ids ? new Set(ids) : null; for (const en of pinEntities) en.show = visible(en._gc); if (viewer) viewer.scene.requestRender(); },
  find: code => { const c = String(code || '').toUpperCase().replace(/\\s+/g, ''); const p = PINS.find(x => x.k.toUpperCase().replace(/\\s+/g, '') === c); if (p && viewer) { flyToPin(p, !EMBED3D); return true; } return false; },
  ring: code => { const c = String(code || '').toUpperCase().replace(/\\s+/g, ''); ringAt(PINS.find(x => x.k.toUpperCase().replace(/\\s+/g, '') === c) || null); if (viewer) viewer.scene.requestRender(); },""", 'api')
open(p, 'w', encoding='utf-8').write(t); print('ok', p)
