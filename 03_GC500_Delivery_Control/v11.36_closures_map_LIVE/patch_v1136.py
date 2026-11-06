"""Author: Andrew Fisher. v11.36 - the closure lines on the 2026 plan, on the Fence closures tab.

Andrew, 23 Oct 2026: "Lets have a tab for closures showing the map. We want this on a 2026 map ... This is not the middle of
road this is the side of the roads some on both sides or one side"; "Dont use this map. Look at highlighted area lines"; "Draw
the line when your zoomed in at 16000% so you get a straight defined neon glow line that follow the foot path. And crosses
the roads when shown onto other side of the road. Only time line breaks is when the next colour starts."

How the lines were made (lift/): the marked 2019 plate was fitted to the 2026 master layout D001-26003-03 by SIFT features
and RANSAC (lift/homography.json) and read, colour by colour, for where each highlighted line starts and ends and which side
of the road it is on (lift/routes.json, waypoints in sheet pt). Each route was then placed on the 2026 drawing itself: the
explorer's tiles at 4 px per pt sampled across the route every 2 pt, the drawn fence / kerb line nearest the route taken by a
Viterbi pass that keeps to one line (lift/snap_lines.py), the Esplanade's north kerb taken from the track surface
(lift/tan_edges_esplanade.json). A segment marked as a road crossing is left straight (the pink at Gate 7). Result:
closures_lines.json, nine lines in three colours, 271 vertices. The Fence closures tab gains a card under its head: the 2026
sheet in an SVG with the explorer's tile pyramid (tiles1136_manifest.json, L0-L3, fetched by byte range as the Map explorer
does) and the lines as neon strokes that keep their width at any zoom; pinch / wheel / buttons to 16000%, drag, double-tap;
legend by colour; Open the Map explorer. The record is untouched. Footer v11.35 -> v11.36.

    python3 patch_v1136.py page.html      (in place, on the live v11.35 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
SCRIPT = HERE / 'closuremap1136.js'
CSS = ("/* v11.36 - the closure lines on the 2026 plan */#pane-fenceclose .c1136-bar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0 6px}#pane-fenceclose .c1136-bar .btn.sm{padding:4px 12px;min-height:34px;font-size:15px}#pane-fenceclose .c1136-pct{min-width:56px;text-align:center;font-variant-numeric:tabular-nums;opacity:.8}"
       "#pane-fenceclose .c1136-view{position:relative;border:1px solid rgba(0,0,0,.15);border-radius:8px;background:#e9ecef;overflow:hidden}#pane-fenceclose .c1136-svg{display:block;width:100%;aspect-ratio:2384/1684;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;background:#fff}#pane-fenceclose .c1136-svg:active{cursor:grabbing}"
       "#pane-fenceclose .c1136-line path{fill:none;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}#pane-fenceclose .c1136-line .halo{stroke-width:16px;opacity:.2}#pane-fenceclose .c1136-line .glow{stroke-width:6px;opacity:.85}#pane-fenceclose .c1136-line .core{stroke-width:2px;opacity:.95}"
       "#pane-fenceclose .c1136-legend{list-style:none;margin:8px 0 0;padding:0;display:grid;grid-template-columns:1fr;gap:6px 14px;font-size:.92em}#pane-fenceclose .c1136-legend li{display:flex;gap:8px;align-items:flex-start}#pane-fenceclose .c1136-legend li span{text-transform:uppercase;letter-spacing:.05em;font-size:.78em;opacity:.7;min-width:56px;padding-top:2px}#pane-fenceclose .c1136-legend li div{line-height:1.35}@media (min-width:760px){#pane-fenceclose .c1136-legend{grid-template-columns:1fr 1fr 1fr}}")


def patch(html):
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.36 requires the live v11.35 page ' + BASE_SHA256)
    if 'closuremap1136-script' in html: raise ValueError('v11.36 already applied')
    lines = json.loads((HERE / 'closures_lines.json').read_text(encoding='utf-8'))
    cols = [l['colour'] for l in lines['lines']]
    if lines['sheet_px'] != [2384, 1684] or len(cols) != 9 or cols.count('pink') != 3 or cols.count('teal') != 2 or cols.count('orange') != 4: raise ValueError('the lines file is not the nine-line lift')
    for l in lines['lines']:
        if len(l['pts']) < 2 or any(not (0 <= p[0] <= 2384 and 0 <= p[1] <= 1684) for p in l['pts']): raise ValueError('a line leaves the sheet: ' + l['name'])
    tiles = json.loads((HERE / 'tiles1136_manifest.json').read_text(encoding='utf-8'))
    if tiles['tile'] != 512 or [l['L'] for l in tiles['levels']] != [0, 1, 2, 3] or not tiles['base'].startswith('/w/Coates-GC500-2026/explorer/assets/vt/'): raise ValueError('the tile manifest is not the explorer pyramid L0-L3')
    script = SCRIPT.read_text(encoding='utf-8').rstrip('\n')
    assert script.startswith('/* Author: Andrew Fisher.') and '</script' not in script
    j = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    script = script.replace('%LINES_JSON%', j(lines)).replace('%TILES_JSON%', j(tiles))
    html = rep(html, "+' · v11.35'; /* v8.19 release922", "+' · v11.36'; /* v8.19 release922", 'release footer', 'page')
    i = html.rfind('</body>')
    if i < 0 or html.count('</body>') != 3 or html.rfind('<script id="fenceclose1133-script">') > i: raise ValueError('the end of the page is not as expected')
    html = html[:i] + '<style id="closuremap1136-style">\n' + CSS + '\n</style>\n<script id="closuremap1136-script">\n' + script + '\n</script>\n' + html[i:]
    for needle, n in [('closuremap1136-script', 1), ('W.ClosureMap1136 = ', 1), ('const LINES = {', 1), ('const TILES = {', 1), ('class="c1136-svg"', 1)]:
        if html.count(needle) != n: raise ValueError('v11.36 did not land cleanly: ' + needle + ' x' + str(html.count(needle)))
    return html


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1136 applied: the closure lines on the 2026 plan on the Fence closures tab; footer v11.35 -> v11.36')
