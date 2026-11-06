"""Author: Andrew Fisher. v11.43 - the Showcase opens quicker on a device that was slow building the 3D circuit.

Andrew, 23 Oct 2026: "showcase is lagging this morning its freezing"; to the slow-device opening put to him: "What ever
makes it quicker please". Measured on live v11.41 (test_v1120, 4x CPU): the dialog in 1.9 s, then the 3D base circuit
8.6 s on the main thread - the freeze. v11.43 (steady1143.js, appended after the v11.20 module): the device's base-circuit
build time is kept in its local storage; when it was over the v11.20 budget (1.5 s), the next opening on that device starts
on the flat circuit at once with a "3D circuit · N s here" button beside the backdrop choice that brings the 3D back for
that opening; a device within budget keeps the 3D circuit at night as the never-chosen default; a chosen 3D look is kept
as the choice. Footer v11.42 -> v11.43. The record untouched; the crew card untouched.

    python3 patch_v1143.py page.html      (in place, on the live v11.42 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
SCRIPT = HERE / 'steady1143.js'


def patch(html):
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.43 requires the live v11.42 page ' + BASE_SHA256)
    if 'steady1143-script' in html: raise ValueError('v11.43 already applied')
    script = SCRIPT.read_text(encoding='utf-8').rstrip('\n')
    assert script.startswith('/* Author: Andrew Fisher.') and '</script' not in script
    for needle in ['function showBackPref(){', 'function showApplyBack(){', "const SHOW_BACKS = ['black', 'circuit', 'circuit3d_day', 'circuit3d']", 'root.ShowcaseSteady1120=', '<label class="shloop shbackl">Backdrop <select id="showBackdrop"']:
        if html.count(needle) != 1: raise ValueError('the page is not as expected: ' + needle + ' x' + str(html.count(needle)))
    html = rep(html, "+' · v11.42'; /* v8.19 release922", "+' · v11.43'; /* v8.19 release922", 'release footer', 'page')
    i = html.rfind('</body>')
    if i < 0 or html.count('</body>') != 3 or html.rfind('root.ShowcaseSteady1120=') > i: raise ValueError('the end of the page is not as expected')
    html = html[:i] + '<script id="steady1143-script">\n' + script + '\n</script>\n' + html[i:]
    for needle, n in [('steady1143-script', 1), ('root.ShowcaseQuick1143=', 1), ("'gc500.show3d.mount'", 1)]:
        if html.count(needle) != n: raise ValueError('v11.43 did not land cleanly: ' + needle + ' x' + str(html.count(needle)))
    return html


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1143 applied: the Showcase opens on the flat circuit on a device that was slow, 3D one press away; footer v11.42 -> v11.43')
