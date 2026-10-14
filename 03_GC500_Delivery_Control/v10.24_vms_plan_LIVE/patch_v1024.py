"""Author: Andrew Fisher. VMS plan, v10.24: a VMS tab (#vms) with every board position on iEDM's VMS001-26003-01 plan,
construction and event, each a card with its pin, the satellite close-up where the page's aerial covers it, iEDM's
own map crop and photo, a QR that navigates to the pin, the plan's words and dates, the VMS 20 messages, the board's
asset number and number plate, notes and an in-place tick - editable on the edit link through the page's own write
path, one document per position on the shared loads collection - and one A4 sheet per position on the day-document
print path (#print/vms/<pos>, #print/vms/all for the pack). No position, quantity, rate or charge of anything else
changes; nothing is pre-ticked.

    python3 patch_v1024.py path/to/page.html

Guards: refuses a repeat (vms1024-script already in the page) and a wrong base (the v10.22/23 line's
nights1022-script and the ' · v10.23' footer must be present).
"""
import base64
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

SCRIPT = HERE / 'vms1024.js'
CSS = HERE / 'vms1024.css'
DATA_FILE = HERE / 'vms1024.json'
MEDIA = HERE / 'media'
GLYPH = '<path d="M2 4.5h12v6H2z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M4.5 7.5h7M5 12.5v1.5M11 12.5v1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'

REPLACEMENTS = [
    ('Tab list', "['nights','Event nights'],", "['nights','Event nights'],['vms','VMS boards'],"),
    ('Tab glyph', 'const TAB_GLYPH = {', "const TAB_GLYPH = {\n vms: '" + GLYPH + "',"),
    ('Tab pane', '<section class="pane" id="pane-nights"></section>', '<section class="pane" id="pane-nights"></section>\n<section class="pane" id="pane-vms"></section>'),
    ('Render dispatch', " else if (state.tab === 'nights') renderNights1022();", " else if (state.tab === 'nights') renderNights1022();\n else if (state.tab === 'vms') renderVms1024();"),
    ('Print deep link', "else if ((m = h.match(/^print\\/nights\\/(\\d{4}-\\d{2}-\\d{2})$/))) {",
     "else if ((m = h.match(/^print\\/vms\\/(all|[0-9]{2}a?)$/))) { go('vms'); dpFromLink('vms', m[1]); } /* v10.24 */\n"
     " else if ((m = h.match(/^print\\/nights\\/(\\d{4}-\\d{2}-\\d{2})$/))) {"),
    ('Print bar document', "if (kind === 'nights') {",
     "if (kind === 'vms') { if (!window.VMS1024) { dpBarSay('The VMS plan is not on this page.', false); return; }\n"
     " dpBarSay(DP_MAIL.vms + ' · preparing', false); VMS1024.print(iso, {keep: true}); dpZoomFit(); } /* v10.24 */\n"
     " else if (kind === 'nights') {"),
    ('Print bar words', "nights: 'Event night run sheet'};", "nights: 'Event night run sheet', vms: 'VMS board sheet'};"),
    ('Hash to tab', "if (/^print\\/nights\\//.test(s)) return 'nights'; /* v10.22 */", "if (/^print\\/vms\\//.test(s)) return 'vms'; /* v10.24 */\n if (/^print\\/nights\\//.test(s)) return 'nights'; /* v10.22 */"),
    ('VMS plan script', '</script>\n</body>', '</script>\n<style id="vms1024-style">\n%CSS%\n</style>\n<script id="vms1024-data">\nwindow.VMS1024_DATA = %DATA%;\n</script>\n<script id="vms1024-media">\nwindow.VMS1024_IMG = %IMG%;\n</script>\n<script id="vms1024-script">\n%SCRIPT%\n</script>\n</body>'),
    ('Release footer', "+ ' · v10.23'", "+ ' · v10.24'"),
]


def media_block():
    out = {}
    for f in sorted(MEDIA.glob('VMS*_plan.jpg')):
        pos = f.name[3:-9]  # VMS<pos>_plan.jpg
        out[pos] = 'data:image/jpeg;base64,' + base64.b64encode(f.read_bytes()).decode()
    assert len(out) >= 28, f'expected 28 plan crops, found {len(out)}'
    return json.dumps(out, separators=(',', ':'))


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if 'vms1024-script' in html: sys.exit('patch_v1024 refuses a repeat: vms1024-script is already in the page')
    if 'nights1022-script' not in html or "+ ' · v10.23'" not in html: sys.exit('patch_v1024: not the v10.23 line - wrong base')
    script = SCRIPT.read_text(encoding='utf-8').rstrip('\n'); css = CSS.read_text(encoding='utf-8').rstrip('\n')
    data = json.loads(DATA_FILE.read_text(encoding='utf-8'))
    poss = [b['pos'] for b in data['boards']]
    assert len(poss) == len(set(poss)) == 28, 'the plan holds 28 positions'
    for b in data['boards']:
        assert -28.1 < b['lat'] < -27.9 and 153.4 < b['lon'] < 153.5, b['pos']
    data_js = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    img_js = media_block()
    assert script.startswith('/* Author: Andrew Fisher.'), 'the script must open with its author line'
    assert '</script' not in script and '</style' not in css and '</script' not in data_js
    for what, old, new in REPLACEMENTS:
        html = rep(html, old, new.replace('%SCRIPT%', script).replace('%CSS%', css).replace('%DATA%', data_js).replace('%IMG%', img_js), what, page)
    page.write_text(html, encoding='utf-8')
    print(f'patch_v1024 applied: VMS boards tab (#vms), {len(poss)} positions, {len(json.loads(img_js))} plan crops inlined, print path #print/vms/<pos|all>, footer v10.23 -> v10.24')


if __name__ == '__main__':
    main()
