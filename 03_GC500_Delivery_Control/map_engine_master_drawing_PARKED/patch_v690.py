#!/usr/bin/env python3
"""v6.90 - THE MAP, SMOOTH, SHARP AND TURNED WITH A COMPASS (Andrew, 27 Sep 2026: "not rotate the map itself so when
looking at map I want to look at different angles, ensure we have north east south west ... smooth fast no blurry").

  Turning   the frame stays still and is always full: the view turns inside it and the drawing is held so it covers
            the stage at any angle (no tilted sheet, no empty corners). A compass in the corner shows N, E, S and W
            where they really are; press a letter to face that way (an eased turn), drag the ring to turn freely.
            Two fingers still twist it; Shift and the wheel still turn it.
  Sharp     the master plan is held as 1,592 tiles of 512 px cut from the vector PDF at 5,200, 10,400 and 20,800 px
            across; at rest the tiles for the screen are brought in at the size the screen needs. Zoom goes to 16x.
  Smooth    nothing is measured inside a frame (the stage's size is kept by a ResizeObserver), transforms only.
  Full      a full-screen button gives the map the whole window; Esc brings it back.

Applied after patch_v689.py (the page must be built with new_media_690.json so the tiles are in the media table).
  python3 patch_v690.py <page.html> <tiles_index.json> <wiremap_v690.js>
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402


def patch(path, tilesf, wiref, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    R = lambda old, new, what: rep(t, old, new, what, path, need)
    tiles = open(tilesf).read().strip(); wire = open(wiref).read().rstrip() + '\n'
    # the new wireMap, whole
    a = t.index('function wireMap(){'); b = t.index('\n/* ------------------------------------------------------------------ register */', a)
    t = t[:a] + wire + t[b:]
    t = R("""function mapNorthDeg(sh){""", """/* v6.90 - the master plan as sharp tiles: 512 px pieces of D001-26003-03 at three sizes, by the SHA-256 of each */
const MAP_TILES = """ + tiles + """;
let MAPCTL = null;
function mapNorthDeg(sh){""", 'tiles const')
    # the stage: tiles under the pills, the compass instead of the turn buttons, a full-screen button
    t = R(""" <img src="${sh.src}" alt="${esc(sh.subtitle)}" loading="lazy" decoding="async">
 ${foundRing(sh)}""", """ <img src="${sh.src}" alt="${esc(sh.subtitle)}" loading="lazy" decoding="async">
 ${sh.master ? '<div class="mtiles" aria-hidden="true"></div>' : ''}
 ${foundRing(sh)}""", 'tiles layer')
    t = R(""" <button data-z="reset" title="Fit, and turn back to the drawing as printed">&#8634;</button>
 </div>""", """ <button data-z="reset" title="Fit, and turn back to the drawing as printed" aria-label="Fit the whole map, as printed">&#8634;</button>
 <button data-mfull aria-pressed="false" title="Full screen" aria-label="Full screen"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
 </div>""", 'full button')
    t = R(""" ${foundRing(sh)}${mks}${pins}${ways}${puts}
 </div>
 </div>
 <div class="zoomctl">""", """ ${foundRing(sh)}${mks}${pins}${ways}${puts}
 </div>
 </div>
 <div class="mkov" id="mkov"></div>
 <div class="zoomctl">""", 'pill layer')
    a = t.index(' <div class="rotctl">'); b = t.index('</div>', t.index('<button data-r="r"', a)) + len('</div>')
    t = t[:a] + """ ${mapNorthDeg(sh) == null ? '' : `<div class="mcompass" id="mcompass" role="group" aria-label="Compass">
 <div class="mcring" title="Drag the ring to turn the map; press a letter to face that way">
 <i class="mcneedle" aria-hidden="true"></i>
 ${[['N', 0, 'north'], ['E', 90, 'east'], ['S', 180, 'south'], ['W', 270, 'west']].map(([l, d, w]) => `<button type="button" class="mcpt mc${l}" data-face="${d}" style="--b:${d}deg" title="Turn the map so the top faces ${w}" aria-label="Face ${w}"><span>${l}</span></button>`).join('')}
 </div>
 <span class="mchead" id="mchead" aria-hidden="true"></span>
 </div>`}""" + t[b:]
    t = R("""drag to pan, scroll or pinch to zoom, twist with two fingers (or Shift and scroll) to turn it, N for north at the top, click a marker for the""",
          """drag to pan, scroll or pinch to zoom, press N, E, S or W on the compass to face that way (or drag its ring, twist with two fingers, or Shift and scroll), the corner button for full screen, click a marker for the""", 'hint')
    # "take me there" goes through the same holds as a drag
    t = R(""" state.ox = state.rot ? r.width / 2 - m.fx * w * z : Math.min(0, Math.max(w - w * z, r.width / 2 - m.fx * w * z));
 state.oy = state.rot ? r.height / 2 - m.fy * h * z : Math.min(0, Math.max(Math.min(0, r.height - h * z), r.height / 2 - m.fy * h * z));
 inner.style.setProperty('--z', state.zoom);
 inner.style.transform = `translate(${state.ox}px,${state.oy}px) scale(${state.zoom})`;""",
          """ state.ox = state.rot ? r.width / 2 - m.fx * w * z : Math.min(0, Math.max(w - w * z, r.width / 2 - m.fx * w * z));
 state.oy = state.rot ? r.height / 2 - m.fy * h * z : Math.min(0, Math.max(Math.min(0, r.height - h * z), r.height / 2 - m.fy * h * z));
 if (MAPCTL && MAPCTL.sheet === sh.key) { MAPCTL.size(); MAPCTL.clamp(); MAPCTL.apply(); MAPCTL.settle(); }
 else { inner.style.setProperty('--z', state.zoom); inner.style.transform = `translate(${state.ox}px,${state.oy}px) scale(${state.zoom})`; }""", 'locate')
    css = """
/* v6.90 - the map: tiles, the compass, full screen */
.maprot{will-change:auto}
.mkov{position:absolute;inset:0;z-index:5;pointer-events:none;overflow:visible}
.mapstage.zooming .mkov{will-change:transform}
.mkov .mk{pointer-events:auto;transition:box-shadow .18s ease;will-change:auto}
.mapstage.zooming .mkov .mk{will-change:auto;box-shadow:none !important;text-shadow:none !important;animation:none !important}
.mapstage.zooming .mkov .mk::after{display:none}
.mapstage.zooming .mkov .mkfound{animation:none;box-shadow:0 0 0 2px #fff}
.mkov .mkfound{pointer-events:none}
.mapinner{backface-visibility:hidden}
.mtiles{position:absolute;inset:0;z-index:0;pointer-events:none;isolation:isolate}
.mtile{position:absolute;display:block;background:no-repeat 0 0/100% 100%;opacity:0;transition:opacity .18s ease}
.mtile.on{opacity:1}
.mapstage.zooming .mtile{transition:none}
.mcompass{position:absolute;right:10px;top:10px;z-index:9;width:92px;height:92px;border-radius:50%;
  background:radial-gradient(circle at 50% 45%,#fff 0,#fbf7f1 70%,#efe7dc 100%);box-shadow:0 2px 10px rgba(0,0,0,.22),0 0 0 1px rgba(0,0,0,.08);
  touch-action:none;user-select:none;-webkit-user-select:none}
.mcring{position:absolute;inset:0;border-radius:50%;cursor:grab;will-change:transform}
.mcring:active{cursor:grabbing}
.mcring::before{content:'';position:absolute;inset:17px;border-radius:50%;border:1.5px solid rgba(29,42,58,.16)}
.mcneedle{position:absolute;left:50%;top:50%;width:0;height:0;margin:-24px 0 0 -6px;border:6px solid transparent;border-top:0;
  border-bottom:24px solid #d9480f;pointer-events:none;filter:drop-shadow(0 1px 1px rgba(0,0,0,.25))}
.mcneedle::after{content:'';position:absolute;left:-6px;top:24px;border:6px solid transparent;border-bottom:0;border-top:24px solid #9aa4ae}
.mcpt{position:absolute;left:50%;top:50%;width:30px;height:30px;margin:-15px 0 0 -15px;padding:0;border:0;border-radius:50%;
  background:transparent;transform:rotate(var(--b)) translateY(-31px);cursor:pointer;color:#1d2a3a}
.mcpt span{display:block;font:800 14px/30px system-ui,-apple-system,'Segoe UI',sans-serif}
.mcpt.mcN{color:#c2410c}
.mcpt:hover span,.mcpt:focus-visible span{background:#1d2a3a;color:#fff;border-radius:50%}
.mcpt:focus-visible{outline:2px solid #0b63c5;outline-offset:1px}
.mchead{position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:5px;white-space:nowrap;
  font:700 10.5px/1 system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:.02em;background:rgba(255,255,255,.94);
  color:#1d2a3a;padding:4px 8px;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.18);pointer-events:none}
@media(max-width:640px){.mcompass{width:76px;height:76px;right:8px;top:8px}.mcpt{transform:rotate(var(--b)) translateY(-25px);width:28px;height:28px;margin:-14px 0 0 -14px}
  .mcpt span{font-size:13px;line-height:28px}.mcring::before{inset:14px}.mcneedle{margin-top:-19px;border-bottom-width:19px}.mcneedle::after{top:19px;border-top-width:19px}}
.zoomctl button[data-mfull]{display:flex;align-items:center;justify-content:center;color:inherit}
.mapstage.mfull{position:fixed;inset:0;z-index:19;border-radius:0;border:0;margin:0;height:100vh;height:100dvh;width:100vw}
.mapstage.mfull .zoomctl{bottom:calc(14px + env(safe-area-inset-bottom,0px));right:calc(12px + env(safe-area-inset-right,0px))}
.mapstage.mfull .mcompass{top:calc(12px + env(safe-area-inset-top,0px));right:calc(12px + env(safe-area-inset-right,0px))}
html.mapfull,html.mapfull body{overflow:hidden}
@media print{.mcompass,.mtiles{display:none !important}}
</style>"""
    k = t.find('</style>'); t = t[:k] + css + t[k + len('</style>'):]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], sys.argv[2], sys.argv[3], True)
