"""Author: Andrew Fisher. v11.44 - the satellite maps turned to the plan's way up: the beach along the top, as on every
other map of the page.

Andrew, 23 Oct 2026, with the VMS boards tab's satellite map (north up, the coast down the right): "this is rotated the
wrong way"; "this is facing the wrong way in maps". The master layout is drawn with east at the top (the explorer's
georeferencing gives 89.9 degrees to north), so the Map explorer, the plan and the Fence closures map all carry the beach
along the top; the v11.39 removals map and the v11.41 "Where it is" maps were drawn north up.

v11.44 replaces those two scripts in place (same ids, same handles): the maps are drawn in the master layout's own frame
(sheet points) through the explorer's georeferencing - every pin, line and label placed by the same fit the Fence closures
satellite uses - and the imagery is laid out through the inverse fit from a local origin, so the picture turns with the
plan and the browser's single-precision SVG arithmetic keeps the tiles where they belong. The finder's zooms (v11.42) land
on the same points, now in the plan's frame. Footer v11.43 -> v11.44. The record untouched; the crew card untouched.

    python3 patch_v1144.py page.html      (in place, on the live v11.43 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()


def swap(html, sid, script):
    a = html.find('<script id="' + sid + '">'); b = html.find('</script>', a)
    if a < 0 or b < 0 or html.count('<script id="' + sid + '">') != 1 or b - a > 120000: raise ValueError('the ' + sid + ' block is not where expected')
    return html[:a] + '<script id="' + sid + '">\n' + script + '\n</script>' + html[b + len('</script>'):]


def patch(html):
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.44 requires the live v11.43 page ' + BASE_SHA256)
    if "turned to the plan's way up in v11.44" in html: raise ValueError('v11.44 already applied')
    geo = json.loads((HERE / 'geo1138.json').read_text(encoding='utf-8'))
    if len(geo['A']) != 3 or len(geo['Ai']) != 3 or not (2.6 < geo['px_per_pt'] < 2.8) or geo['main'] != [49.46, 41.4, 2334.08, 1464.24] or geo['check']['rms_m'] > 1.0: raise ValueError('the georeferencing is not the explorer main-plan fit')
    j = json.dumps(geo, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    for sid, fn in [('vmsmap1139-script', 'vmsmap1144.js'), ('satmap1141-script', 'satmap1144.js')]:
        s = (HERE / fn).read_text(encoding='utf-8').rstrip('\n')
        assert s.startswith('/* Author: Andrew Fisher.') and '</script' not in s and s.count('%GEO_JSON%') == 1
        html = swap(html, sid, s.replace('%GEO_JSON%', j))
    html = rep(html, "+' · v11.43'; /* v8.19 release922", "+' · v11.44'; /* v8.19 release922", 'release footer', 'page')
    for needle, n in [('vmsmap1139-script', 1), ('satmap1141-script', 1), ('W.VmsMap1139 = ', 1), ('W.SatMap1141 = ', 1), ("turned to the plan's way up in v11.44", 2), ('function satMatrix(){', 3), ('World_Imagery', 3)]:
        if html.count(needle) != n: raise ValueError('v11.44 did not land cleanly: ' + needle + ' x' + str(html.count(needle)))
    return html


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print("patch_v1144 applied: the satellite maps drawn the plan's way up, the beach along the top; footer v11.43 -> v11.44")
