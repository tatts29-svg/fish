"""Author: Andrew Fisher. v11.41 - "Where it is": every VMS board and every generator on satellite, under the Map explorer
(with a VMS / Generators filter) and under the VMS boards tab's head (the boards).

Andrew, 23 Oct 2026, with photographs of the Map explorer: "When i look for generators i cant see where some of them are";
"Cant see all vms boards on here either". Why: the Map explorer draws on the master layout's sheet, and seven boards sit off
it (VMS 01, 02, 03, 07, 23 to the north-west and 09, 10 to the south-east); the generators' drawing-label pins sit close
together and GN25 has no position on the record at all, so nothing can draw it. v11.41 adds a satellite map from the page's
own positions (satmap1141.js): every board the record places, anywhere, with the five end-of-session boards in their
removal colours; every generator with a position as a green square with its units; the references with no position listed
under the map as such; tap to navigate; pinch / wheel / drag / + / - / Fit; All / VMS boards / Generators under the
explorer. No position is guessed and the record is untouched. Footer v11.40 -> v11.41; the crew card untouched.

    python3 patch_v1141.py page.html      (in place, on the live v11.40 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
SCRIPT = HERE / 'satmap1141.js'
CSS = ("/* v11.41 - where it is: boards and generators on satellite */.s1141-bar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0 6px}.s1141-bar .btn.sm{padding:4px 12px;min-height:34px;font-size:15px}.s1141-pct{min-width:56px;text-align:center;font-variant-numeric:tabular-nums;opacity:.8}.s1141-sep{width:1px;height:24px;background:rgba(0,0,0,.15);margin:0 2px}"
       ".s1141-view{position:relative;border:1px solid rgba(0,0,0,.15);border-radius:8px;background:#1b2a2f;overflow:hidden}.s1141-svg{display:block;width:100%;aspect-ratio:16/10;max-height:72vh;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;background:#1b2a2f}.s1141-svg:active{cursor:grabbing}.s1141-pin{cursor:pointer}.s1141-lbl{font-family:inherit;font-weight:600}"
       ".s1141-list{list-style:none;margin:8px 0 0;padding:0;display:grid;grid-template-columns:1fr;gap:6px 14px;font-size:.9em}.s1141-list li{display:flex;gap:10px;align-items:flex-start}.s1141-list li[hidden]{display:none}.s1141-list li div{line-height:1.4}.s1141-list li .btn.sm{margin-top:3px;padding:2px 10px;min-height:28px;font-size:13px}.s1141-list small{opacity:.75}.s1141-how{opacity:.7;font-size:.9em}.s1141-list li.s1141-none .s1141-how{color:#b45309;opacity:1}"
       ".s1141-chip{display:inline-block;width:14px;height:14px;border-radius:50%;border:2px solid #101418;flex:none;margin-top:3px}.s1141-chip.gen{border-radius:3px}.s1141-chip.none{background:transparent;border-style:dashed}@media (min-width:760px){.s1141-list{grid-template-columns:1fr 1fr}}@media (min-width:1100px){.s1141-list{grid-template-columns:1fr 1fr 1fr}}")


def patch(html):
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.41 requires the live v11.40 page ' + BASE_SHA256)
    if 'satmap1141-script' in html: raise ValueError('v11.41 already applied')
    script = SCRIPT.read_text(encoding='utf-8').rstrip('\n')
    assert script.startswith('/* Author: Andrew Fisher.') and '</script' not in script
    for needle in ['function renderMap(){', "else if (state.tab === 'map') renderMap();", 'W.renderVms1024 = render;', 'id="expcard"', 'class="card nosfold v1024-head"', 'function pinsNow(']:
        if html.count(needle) < 1: raise ValueError('the page is not as expected: ' + needle)
    html = rep(html, "+' · v11.40'; /* v8.19 release922", "+' · v11.41'; /* v8.19 release922", 'release footer', 'page')
    i = html.rfind('</body>')
    if i < 0 or html.count('</body>') != 3 or html.rfind('<script id="vmsmap1139-script">') > i: raise ValueError('the end of the page is not as expected')
    html = html[:i] + '<style id="satmap1141-style">\n' + CSS + '\n</style>\n<script id="satmap1141-script">\n' + script + '\n</script>\n' + html[i:]
    for needle, n in [('satmap1141-script', 1), ('W.SatMap1141 = ', 1), ('World_Imagery', 3)]:
        if html.count(needle) != n: raise ValueError('v11.41 did not land cleanly: ' + needle + ' x' + str(html.count(needle)))
    return html


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1141 applied: Where it is - boards and generators on satellite under the Map explorer and the VMS boards tab; footer v11.40 -> v11.41')
