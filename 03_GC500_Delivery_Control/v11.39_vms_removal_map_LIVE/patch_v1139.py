"""Author: Andrew Fisher. v11.39 - the VMS removals tab gains a map of where each board goes (colour-coded, a dotted line
from the board to its spot, on satellite imagery) and Friday morning joins the removal mornings.

Andrew, 23 Oct 2026: "Vms removals boards lets colour code lets have a map with the colour have a dotted line on where they
go. They get taken off track first thing this morning"; "Today is friday they get taken off the track this morning".

v11.39: (1) vmsmap1139.js appended after the tab's script: a card under the tab's head - the five boards from the page's own
positions on Esri World Imagery (Web Mercator, the page's lat / long), each board a solid pin in its own colour, a dotted line
in that colour to the square where it goes with the straight-line distance, labels, zoom and drag, tap to navigate, a legend
with Navigate links; the spots are the tab's rules where a position is named (VMS 16 behind 2 Breaker St, VMS 15 the T2
runoff), the T10 label on the 2026 plan through the explorer's georeferencing (VMS 17), and Cypress Ave, Surfers Paradise,
geocoded, standing in for the Altus compound with a dashed square until its spot is pinned (VMS 13 and 14). (2) MORNINGS gains
Friday 23 Oct (after Thursday night) ahead of Saturday, so the tab opens on today's removal and the ticks keep their own
Friday record; Saturday, Sunday and Monday unchanged. Footer v11.38 -> v11.39. The record untouched; the crew card untouched.

    python3 patch_v1139.py page.html      (in place, on the live v11.38 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
SCRIPT = HERE / 'vmsmap1139.js'
CLOSURES = HERE / 'closuremap1139.js'
CLOSURES_CSS = ("/* v11.36 / v11.38 - the closure lines on the 2026 plan */#pane-fenceclose .c1136-bar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0 6px}#pane-fenceclose .c1136-bar .btn.sm{padding:4px 12px;min-height:34px;font-size:15px}#pane-fenceclose .c1136-pct{min-width:56px;text-align:center;font-variant-numeric:tabular-nums;opacity:.8}#pane-fenceclose .c1136-sep{width:1px;height:24px;background:rgba(0,0,0,.15);margin:0 2px}"
       "#pane-fenceclose .c1136-view{position:relative;border:1px solid rgba(0,0,0,.15);border-radius:8px;background:#e9ecef;overflow:hidden}#pane-fenceclose .c1136-svg{display:block;width:100%;aspect-ratio:2384/1684;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;background:#fff}#pane-fenceclose .c1136-svg:active{cursor:grabbing}"
       "#pane-fenceclose .c1136-svg g.sat{display:none}#pane-fenceclose .c1136-svg.sat g.sat{display:block}#pane-fenceclose .c1136-svg.sat{background:#1b2a2f}#pane-fenceclose .c1136-svg.sat .c1136-sheet,#pane-fenceclose .c1136-svg.sat g.tiles{visibility:hidden}#pane-fenceclose .c1136-svg .satbg{fill:#1b2a2f}"
       "#pane-fenceclose .c1136-line path{fill:none;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}#pane-fenceclose .c1136-line .halo{stroke-width:7px;opacity:.22}#pane-fenceclose .c1136-line .glow{stroke-width:3px;opacity:.95}#pane-fenceclose .c1136-line .core{stroke-width:1.2px;opacity:.95}#pane-fenceclose .c1136-svg.sat .c1136-line .halo{opacity:.35}"
       "#pane-fenceclose .c1136-credit{font-size:.78em;opacity:.7;margin:6px 0 0}#pane-fenceclose .c1136-credit[hidden]{display:none}"
       "#pane-fenceclose .c1136-legend{list-style:none;margin:8px 0 0;padding:0;display:grid;grid-template-columns:1fr;gap:6px 14px;font-size:.92em}#pane-fenceclose .c1136-legend li{display:flex;gap:8px;align-items:flex-start}#pane-fenceclose .c1136-legend li span{text-transform:uppercase;letter-spacing:.05em;font-size:.78em;opacity:.7;min-width:56px;padding-top:2px}#pane-fenceclose .c1136-legend li div{line-height:1.35}@media (min-width:760px){#pane-fenceclose .c1136-legend{grid-template-columns:1fr 1fr 1fr}}")
CSS = ("/* v11.39 - where each VMS board goes */#pane-vmsoff .v1139-bar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0 6px}#pane-vmsoff .v1139-bar .btn.sm{padding:4px 12px;min-height:34px;font-size:15px}#pane-vmsoff .v1139-pct{min-width:56px;text-align:center;font-variant-numeric:tabular-nums;opacity:.8}"
       "#pane-vmsoff .v1139-view{position:relative;border:1px solid rgba(0,0,0,.15);border-radius:8px;background:#1b2a2f;overflow:hidden}#pane-vmsoff .v1139-svg{display:block;width:100%;aspect-ratio:1/1;max-height:72vh;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;background:#1b2a2f}#pane-vmsoff .v1139-svg:active{cursor:grabbing}"
       "#pane-vmsoff .v1139-route{fill:none;stroke-width:3px;stroke-dasharray:7 6;stroke-linecap:round;vector-effect:non-scaling-stroke}#pane-vmsoff .v1139-pin,#pane-vmsoff .v1139-spot{cursor:pointer}#pane-vmsoff .v1139-lbl{font-family:inherit;font-weight:600}"
       "#pane-vmsoff .v1139-legend{list-style:none;margin:8px 0 0;padding:0;display:grid;grid-template-columns:1fr;gap:8px 14px;font-size:.92em}#pane-vmsoff .v1139-legend li{display:flex;gap:10px;align-items:flex-start}#pane-vmsoff .v1139-legend li div{line-height:1.45}#pane-vmsoff .v1139-legend li .btn.sm{margin-top:4px}#pane-vmsoff .v1139-chip{display:inline-block;width:16px;height:16px;border-radius:50%;border:2px solid #101418;flex:none;margin-top:3px}@media (min-width:760px){#pane-vmsoff .v1139-legend{grid-template-columns:1fr 1fr}}")
OLD_MORNINGS = "const MORNINGS = [\n {iso: '2026-10-24', label: 'Saturday morning', after: 'Friday night', night: '2026-10-23'},"
NEW_MORNINGS = "const MORNINGS = [\n {iso: '2026-10-23', label: 'Friday morning', after: 'Thursday night', night: '2026-10-22'}, /* v11.39 - Andrew, 23 Oct: \"Today is friday they get taken off the track this morning\" */\n {iso: '2026-10-24', label: 'Saturday morning', after: 'Friday night', night: '2026-10-23'},"


def patch(html):
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.39 requires the live v11.38 page ' + BASE_SHA256)
    if 'vmsmap1139-script' in html or 'const SO = ' in html: raise ValueError('v11.39 already applied')
    script = SCRIPT.read_text(encoding='utf-8').rstrip('\n')
    assert script.startswith('/* Author: Andrew Fisher.') and '</script' not in script
    if html.count(OLD_MORNINGS) != 1: raise ValueError('the v11.32 mornings are not where expected')
    html = html.replace(OLD_MORNINGS, NEW_MORNINGS)
    # the closures card's script replaced again, as v11.38 did, with the imagery laid out from a local origin
    cs = CLOSURES.read_text(encoding='utf-8').rstrip('\n')
    assert cs.startswith('/* Author: Andrew Fisher.') and '</script' not in cs and 'const SO =' in cs
    lines = json.loads((HERE / 'closures_lines.json').read_text(encoding='utf-8')); tiles = json.loads((HERE / 'tiles1136_manifest.json').read_text(encoding='utf-8')); geo = json.loads((HERE / 'geo1138.json').read_text(encoding='utf-8'))
    j = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    cs = cs.replace('%LINES_JSON%', j(lines)).replace('%TILES_JSON%', j(tiles)).replace('%GEO_JSON%', j(geo))
    a = html.find('<style id="closuremap1136-style">'); b = html.find('<script id="closuremap1136-script">'); c = html.find('</script>', b)
    if a < 0 or b < 0 or c < 0 or b < a or c - a > 400000 or html.count('<style id="closuremap1136-style">') != 1 or html.count('<script id="closuremap1136-script">') != 1: raise ValueError('the closures block is not where expected')
    html = html[:a] + '<style id="closuremap1136-style">\n' + CLOSURES_CSS + '\n</style>\n<script id="closuremap1136-script">\n' + cs + '\n</script>' + html[c + len('</script>'):]
    html = rep(html, "+' · v11.38'; /* v8.19 release922", "+' · v11.39'; /* v8.19 release922", 'release footer', 'page')
    i = html.rfind('</body>')
    if i < 0 or html.count('</body>') != 3 or html.rfind('<script id="vmsoff1132-script">') > i: raise ValueError('the end of the page is not as expected')
    html = html[:i] + '<style id="vmsmap1139-style">\n' + CSS + '\n</style>\n<script id="vmsmap1139-script">\n' + script + '\n</script>\n' + html[i:]
    for needle, n in [('vmsmap1139-script', 1), ('W.VmsMap1139 = ', 1), ("label: 'Friday morning'", 1), ("label: 'Saturday morning'", 1), ('World_Imagery', 2), ('closuremap1136-script', 1), ('const SO = ', 1), ('W.ClosureMap1136 = ', 1)]:
        if html.count(needle) != n: raise ValueError('v11.39 did not land cleanly: ' + needle + ' x' + str(html.count(needle)))
    return html


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1139 applied: the VMS removals map and Friday morning; footer v11.38 -> v11.39')
