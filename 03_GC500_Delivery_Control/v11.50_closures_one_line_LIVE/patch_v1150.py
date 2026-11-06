"""Author: Andrew Fisher. v11.50 - the fence closure lines redrawn from the project manager's marked plan of 23 Oct 2026:
one bright colour, a solid thick line along the footpaths as marked, straight runs, no glow.

Andrew, 23 Oct 2026, on the v11.38 map: "i honestly dont like what you have done. think foot path look at what i have
done to give you guidance. i want this on the foot path or follow the line on the maps. nice and straight not like a
sccribb and neon lights lets work on one rteally really bright colour then we can work on what areas to have people but i
need some attention to this must look really good".

The marked plan (lift/marked_plan_23Oct2026.webp) was fitted to the 2026 sheet by SIFT/RANSAC homography (1473 inliers,
median 0.3 px), the marker strokes lifted as their centreline and simplified to straight runs (lift/lift4.py): 16 runs,
87 vertices, about 3,700 m. v11.50 replaces the v11.36/v11.38 card's style and script in place (same ids, same handle
window.ClosureMap1136): one colour (#ff1fd4 core on a dark edge), the line 16 pt wide on the plan at most and 14 px on the
screen at most as the view zooms, no filter or glow; the Plan / Satellite switch, the zoom to 16000% and the credit as
before; a one-line legend. Footer v11.48 -> v11.50. The record untouched; the crew card untouched.

    python3 patch_v1150.py page.html      (in place, on the live v11.48 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
SCRIPT = HERE / 'closuremap1150.js'
CSS = ("/* v11.36 / v11.38 / v11.50 - the closure lines on the 2026 plan */#pane-fenceclose .c1136-bar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0 6px}#pane-fenceclose .c1136-bar .btn.sm{padding:4px 12px;min-height:34px;font-size:15px}#pane-fenceclose .c1136-pct{min-width:56px;text-align:center;font-variant-numeric:tabular-nums;opacity:.8}#pane-fenceclose .c1136-sep{width:1px;height:24px;background:rgba(0,0,0,.15);margin:0 2px}"
       "#pane-fenceclose .c1136-view{position:relative;border:1px solid rgba(0,0,0,.15);border-radius:8px;background:#e9ecef;overflow:hidden}#pane-fenceclose .c1136-svg{display:block;width:100%;aspect-ratio:2384/1684;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;background:#fff}#pane-fenceclose .c1136-svg:active{cursor:grabbing}"
       "#pane-fenceclose .c1136-svg g.sat{display:none}#pane-fenceclose .c1136-svg.sat g.sat{display:block}#pane-fenceclose .c1136-svg.sat{background:#1b2a2f}#pane-fenceclose .c1136-svg.sat .c1136-sheet,#pane-fenceclose .c1136-svg.sat g.tiles{visibility:hidden}#pane-fenceclose .c1136-svg .satbg{fill:#1b2a2f}"
       "#pane-fenceclose .c1136-line path{fill:none;stroke-linecap:round;stroke-linejoin:round}#pane-fenceclose .c1136-line .edge{stroke-width:var(--c1136-we,23.2px);opacity:.5}#pane-fenceclose .c1136-line .core{stroke-width:var(--c1136-w,16px);opacity:.97}#pane-fenceclose .c1136-svg.sat .c1136-line .edge{opacity:.7}"
       "#pane-fenceclose .c1136-credit{font-size:.78em;opacity:.7;margin:6px 0 0}#pane-fenceclose .c1136-credit[hidden]{display:none}"
       "#pane-fenceclose .c1136-legend{list-style:none;margin:8px 0 0;padding:0;display:grid;grid-template-columns:1fr;gap:6px 14px;font-size:.92em}#pane-fenceclose .c1136-legend li{display:flex;gap:8px;align-items:flex-start}#pane-fenceclose .c1136-legend li span{text-transform:uppercase;letter-spacing:.05em;font-size:.78em;opacity:.7;min-width:56px;padding-top:2px}#pane-fenceclose .c1136-legend li div{line-height:1.35}#pane-fenceclose .c1136-legend .clodot.one{display:inline-block;flex:none;width:14px;height:14px;border-radius:50%;background:#ff1fd4;border:2px solid #3a0030;margin-top:3px}")


def patch(html):
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.50 requires the live v11.48 page ' + BASE_SHA256)
    if 'closuremap1150' in html or '--c1136-we' in html: raise ValueError('v11.50 already applied')
    lines = json.loads((HERE / 'closures_lines.json').read_text(encoding='utf-8'))
    if lines['sheet_px'] != [2384, 1684] or not (12 <= len(lines['lines']) <= 24): raise ValueError('the lines file is not the 23 Oct lift')
    for l in lines['lines']:
        if len(l['pts']) < 2 or any(not (0 <= p[0] <= 2384 and 0 <= p[1] <= 1684) for p in l['pts']): raise ValueError('a line leaves the sheet: ' + l['name'])
        if 'colour' in l: raise ValueError('one colour: no colour per line')
    if '23 Oct 2026' not in lines.get('note', '') or 'straight runs' not in lines.get('note', ''): raise ValueError('the lines are not the straight-run lift of 23 Oct')
    tiles = json.loads((HERE / 'tiles1136_manifest.json').read_text(encoding='utf-8'))
    if tiles['tile'] != 512 or [l['L'] for l in tiles['levels']] != [0, 1, 2, 3] or not tiles['base'].startswith('/w/Coates-GC500-2026/explorer/assets/vt/'): raise ValueError('the tile manifest is not the explorer pyramid L0-L3')
    geo = json.loads((HERE / 'geo1138.json').read_text(encoding='utf-8'))
    if len(geo['A']) != 3 or len(geo['Ai']) != 3 or not (2.6 < geo['px_per_pt'] < 2.8) or geo['main'] != [49.46, 41.4, 2334.08, 1464.24] or geo['check']['rms_m'] > 1.0: raise ValueError('the georeferencing is not the explorer main-plan fit')
    script = SCRIPT.read_text(encoding='utf-8').rstrip('\n')
    assert script.startswith('/* Author: Andrew Fisher.') and '</script' not in script and 'halo' not in script and 'NEON' not in script and 'feGaussianBlur' not in script
    j = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    script = script.replace('%LINES_JSON%', j(lines)).replace('%TILES_JSON%', j(tiles)).replace('%GEO_JSON%', j(geo))
    a = html.find('<style id="closuremap1136-style">'); b = html.find('<script id="closuremap1136-script">'); c = html.find('</script>', b)
    if a < 0 or b < 0 or c < 0 or b < a or c - a > 400000 or html.count('<style id="closuremap1136-style">') != 1 or html.count('<script id="closuremap1136-script">') != 1: raise ValueError('the v11.36 block is not where expected')
    html = html[:a] + '<style id="closuremap1136-style">\n' + CSS + '\n</style>\n<script id="closuremap1136-script">\n' + script + '\n</script>' + html[c + len('</script>'):]
    html = rep(html, "+' · v11.48'; /* v8.19 release922", "+' · v11.50'; /* v8.19 release922", 'release footer', 'page')
    # 'const GEO = {' and World_Imagery are three on the page since v11.44 (the removals map and the "Where it is" maps carry the same fit)
    for needle, n in [('closuremap1136-script', 1), ('W.ClosureMap1136 = ', 1), ('const LINES = {', 1), ('const TILES = {', 1), ('const GEO = {', 3), ('const ONE = {', 1), ('class="c1136-svg"', 1), ('data-c1136-base="sat"', 1), ('World_Imagery', 3), ('--c1136-we', 2), ('NEON', 0)]:
        if html.count(needle) != n: raise ValueError('v11.50 did not land cleanly: ' + needle + ' x' + str(html.count(needle)))
    return html


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1150 applied: the closure lines redrawn from the marked plan of 23 Oct, one bright colour, straight runs, no glow; footer v11.48 -> v11.50')
