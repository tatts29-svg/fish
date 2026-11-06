"""Author: Andrew Fisher. v11.40 - the satellite maps stop at Esri's sharpest real imagery (zoom 20) instead of asking for
zoom 21, where the service answers "Map data not yet available" over the Gold Coast; past zoom 20 the zoom-20 tiles are
drawn larger. Both the Fence closures map (Satellite) and the VMS removals map. Found on the live v11.39 page: the closures
map at 1600% on Satellite showed the grey "not available" tiles. Footer v11.39 -> v11.40. Nothing else changes.

    python3 patch_v1140.py page.html      (in place, on the live v11.39 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
OLD_C = "function satZoom(svg){ const b = box(svg); const pxPerZ18 = (svg.clientWidth || 360) * (window.devicePixelRatio || 1) / (b.w * GEO.px_per_pt); return Math.max(15, Math.min(21, 19 + Math.round(Math.log(pxPerZ18) / Math.LN2))); }"
NEW_C = "function satZoom(svg){ const b = box(svg); const pxPerZ18 = (svg.clientWidth || 360) * (window.devicePixelRatio || 1) / (b.w * GEO.px_per_pt); return Math.max(15, Math.min(20, 19 + Math.round(Math.log(pxPerZ18) / Math.LN2))); } /* v11.40: zoom 20 is Esri's sharpest real imagery here */"
OLD_V = "function satZoom(svg){ const b = box(svg); const p = (svg.clientWidth || 360) * (window.devicePixelRatio || 1) / b.w; return Math.max(15, Math.min(21, 19 + Math.ceil(Math.log(p) / Math.LN2 - 0.1))); } /* the sharper of the two zooms either side */"
NEW_V = "function satZoom(svg){ const b = box(svg); const p = (svg.clientWidth || 360) * (window.devicePixelRatio || 1) / b.w; return Math.max(15, Math.min(20, 19 + Math.ceil(Math.log(p) / Math.LN2 - 0.1))); } /* the sharper of the two zooms either side; v11.40: zoom 20 is Esri's sharpest real imagery here */"


def patch(html):
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.40 requires the live v11.39 page ' + BASE_SHA256)
    if 'v11.40: zoom 20' in html: raise ValueError('v11.40 already applied')
    if html.count(OLD_C) != 1 or html.count(OLD_V) != 1: raise ValueError('the two satZoom functions are not where expected')
    html = html.replace(OLD_C, NEW_C).replace(OLD_V, NEW_V)
    html = rep(html, "+' · v11.39'; /* v8.19 release922", "+' · v11.40'; /* v8.19 release922", 'release footer', 'page')
    if html.count('Math.min(21,') != 0 or html.count('v11.40: zoom 20') != 2: raise ValueError('v11.40 did not land cleanly')
    return html


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1140 applied: satellite zoom capped at 20 on both maps; footer v11.39 -> v11.40')
