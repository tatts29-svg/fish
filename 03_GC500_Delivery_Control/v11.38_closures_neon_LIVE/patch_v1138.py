"""Author: Andrew Fisher. v11.38 - the closure lines refined: clean thin neon lines set onto the footpath on the side the pen
marked, the two corners that cut across the Esplanade compound cleaned, and a Plan / Satellite switch under the lines.

Andrew, 23 Oct 2026, on the v11.36 map: "U have highlighted to much. Its literally drawing along the foot paths only on
one-side ... U dont walk on buildings. U cross roads when shown then walk on that side of road"; "I want a clean bright neon
line along the footpaths ... professional lines not scribble. There is no breaks in the lines"; "Use a new map or a satellite
map. Come on push your limits here"; "This is better but we need to show it so its the one side of foot path when shown and
when the other side we show that".

v11.38 replaces the v11.36 card's style and script in place (same ids, same handle window.ClosureMap1136): the lines are
re-placed 2 pt (about 1.4 m) off the drawn kerb / fence line onto the footpath, away from the road, the road's hand set per
route and changing at the Ferny Ave corner (lift/routes.json, lift/snap_lines.py); the strokes are a third of the width so
the two sides of a road read as two lines at the whole-plan view; the pink's west reach climbs the access path between the
Esplanade compound and Meriton instead of cutting through the compound; a Satellite button swaps the drawing for Esri World
Imagery placed through the explorer's georeferencing of the plan (sheet pt to Web Mercator z18 px, checked to about 1 m),
clipped to the main plan, the lines on top, a credit line shown; Plan brings the drawing and its tiles back. Footer
v11.37 -> v11.38. The record untouched; the crew card untouched.

    python3 patch_v1138.py page.html      (in place, on the live v11.37 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
SCRIPT = HERE / 'closuremap1138.js'
CSS = ("/* v11.36 / v11.38 - the closure lines on the 2026 plan */#pane-fenceclose .c1136-bar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0 6px}#pane-fenceclose .c1136-bar .btn.sm{padding:4px 12px;min-height:34px;font-size:15px}#pane-fenceclose .c1136-pct{min-width:56px;text-align:center;font-variant-numeric:tabular-nums;opacity:.8}#pane-fenceclose .c1136-sep{width:1px;height:24px;background:rgba(0,0,0,.15);margin:0 2px}"
       "#pane-fenceclose .c1136-view{position:relative;border:1px solid rgba(0,0,0,.15);border-radius:8px;background:#e9ecef;overflow:hidden}#pane-fenceclose .c1136-svg{display:block;width:100%;aspect-ratio:2384/1684;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;background:#fff}#pane-fenceclose .c1136-svg:active{cursor:grabbing}"
       "#pane-fenceclose .c1136-svg g.sat{display:none}#pane-fenceclose .c1136-svg.sat g.sat{display:block}#pane-fenceclose .c1136-svg.sat{background:#1b2a2f}#pane-fenceclose .c1136-svg.sat .c1136-sheet,#pane-fenceclose .c1136-svg.sat g.tiles{visibility:hidden}#pane-fenceclose .c1136-svg .satbg{fill:#1b2a2f}"
       "#pane-fenceclose .c1136-line path{fill:none;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}#pane-fenceclose .c1136-line .halo{stroke-width:7px;opacity:.22}#pane-fenceclose .c1136-line .glow{stroke-width:3px;opacity:.95}#pane-fenceclose .c1136-line .core{stroke-width:1.2px;opacity:.95}#pane-fenceclose .c1136-svg.sat .c1136-line .halo{opacity:.35}"
       "#pane-fenceclose .c1136-credit{font-size:.78em;opacity:.7;margin:6px 0 0}#pane-fenceclose .c1136-credit[hidden]{display:none}"
       "#pane-fenceclose .c1136-legend{list-style:none;margin:8px 0 0;padding:0;display:grid;grid-template-columns:1fr;gap:6px 14px;font-size:.92em}#pane-fenceclose .c1136-legend li{display:flex;gap:8px;align-items:flex-start}#pane-fenceclose .c1136-legend li span{text-transform:uppercase;letter-spacing:.05em;font-size:.78em;opacity:.7;min-width:56px;padding-top:2px}#pane-fenceclose .c1136-legend li div{line-height:1.35}@media (min-width:760px){#pane-fenceclose .c1136-legend{grid-template-columns:1fr 1fr 1fr}}")


def patch(html):
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.38 requires the live v11.37 page ' + BASE_SHA256)
    if 'const GEO = {' in html or 'closuremap1138' in html: raise ValueError('v11.38 already applied')
    lines = json.loads((HERE / 'closures_lines.json').read_text(encoding='utf-8'))
    cols = [l['colour'] for l in lines['lines']]
    if lines['sheet_px'] != [2384, 1684] or len(cols) != 9 or cols.count('pink') != 3 or cols.count('teal') != 2 or cols.count('orange') != 4: raise ValueError('the lines file is not the nine-line lift')
    for l in lines['lines']:
        if len(l['pts']) < 2 or any(not (0 <= p[0] <= 2384 and 0 <= p[1] <= 1684) for p in l['pts']): raise ValueError('a line leaves the sheet: ' + l['name'])
    if 'onto the footpath' not in lines.get('note', ''): raise ValueError('the lines are not the footpath-offset set')
    tiles = json.loads((HERE / 'tiles1136_manifest.json').read_text(encoding='utf-8'))
    if tiles['tile'] != 512 or [l['L'] for l in tiles['levels']] != [0, 1, 2, 3] or not tiles['base'].startswith('/w/Coates-GC500-2026/explorer/assets/vt/'): raise ValueError('the tile manifest is not the explorer pyramid L0-L3')
    geo = json.loads((HERE / 'geo1138.json').read_text(encoding='utf-8'))
    if len(geo['A']) != 3 or len(geo['Ai']) != 3 or not (2.6 < geo['px_per_pt'] < 2.8) or geo['main'] != [49.46, 41.4, 2334.08, 1464.24] or geo['check']['rms_m'] > 1.0: raise ValueError('the georeferencing is not the explorer main-plan fit')
    script = SCRIPT.read_text(encoding='utf-8').rstrip('\n')
    assert script.startswith('/* Author: Andrew Fisher.') and '</script' not in script
    j = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    script = script.replace('%LINES_JSON%', j(lines)).replace('%TILES_JSON%', j(tiles)).replace('%GEO_JSON%', j(geo))
    # the v11.36 block, style then script, replaced whole
    a = html.find('<style id="closuremap1136-style">'); b = html.find('<script id="closuremap1136-script">'); c = html.find('</script>', b)
    if a < 0 or b < 0 or c < 0 or b < a or c - a > 400000 or html.count('<style id="closuremap1136-style">') != 1 or html.count('<script id="closuremap1136-script">') != 1: raise ValueError('the v11.36 block is not where expected')
    html = html[:a] + '<style id="closuremap1136-style">\n' + CSS + '\n</style>\n<script id="closuremap1136-script">\n' + script + '\n</script>' + html[c + len('</script>'):]
    html = rep(html, "+' · v11.37'; /* v8.19 release922", "+' · v11.38'; /* v8.19 release922", 'release footer', 'page')
    for needle, n in [('closuremap1136-script', 1), ('W.ClosureMap1136 = ', 1), ('const LINES = {', 1), ('const TILES = {', 1), ('const GEO = {', 1), ('class="c1136-svg"', 1), ('data-c1136-base="sat"', 1), ('World_Imagery', 1)]:
        if html.count(needle) != n: raise ValueError('v11.38 did not land cleanly: ' + needle + ' x' + str(html.count(needle)))
    return html


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1138 applied: the closure lines refined onto the footpath, thin neon, Plan / Satellite; footer v11.37 -> v11.38')
