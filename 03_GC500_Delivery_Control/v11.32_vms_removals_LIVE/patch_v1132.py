"""Author: Andrew Fisher. v11.32 - a new tab, VMS removals (#vmsoff): the five end-of-session boards, when each may come off the
track, where it goes, the Supercars track access times, a tick per board per morning and a printable removals sheet.

Andrew, 23 Oct 2026: "Another tab. Vms daily removals. Vms 16. Vm17 vms 14 can be taken off track starting 3am. vms13 and
vms15 must be taken off track starting 6am. Vms 16 can go behind here at breaker street" (2 Breaker St, Main Beach); "when i
spoke about closures im talking about fence closure. This is data i got from v8s" (the Supercars track access details).

Mechanics as the Event nights tab (v10.22): tab list, glyph, pane, render dispatch, print deep link (#print/vmsoff/<date>),
print bar, hash to tab, script and style at the end of the page. The record (ticks, notes, sign-off) goes through the page's
own write path on the edit link only; nothing is pre-ticked; no position, quantity, rate or charge changes.

    python3 patch_v1132.py page.html      (in place, on the live v11.31 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
SCRIPT = HERE / 'vmsoff1132.js'
CSS = HERE / 'vmsoff1132.css'
GLYPH = '<rect x="2.2" y="2.8" width="11.6" height="6.4" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 9.2v4.2M5.4 13.4h5.2M4.6 6h2.2M8.6 6h2.8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'

REPLACEMENTS = [
    ('Tab list', "['nights','Event nights'],['servicing','Servicing'],", "['nights','Event nights'],['vmsoff','VMS removals'],['servicing','Servicing'],"),
    ('Tab glyph', 'const TAB_GLYPH = {', "const TAB_GLYPH = {\n vmsoff: '" + GLYPH + "',"),
    ('Tab pane', '<section class="pane" id="pane-nights"></section>', '<section class="pane" id="pane-nights"></section>\n<section class="pane" id="pane-vmsoff"></section>'),
    ('Render dispatch', " else if (state.tab === 'nights') renderNights1022();", " else if (state.tab === 'nights') renderNights1022();\n else if (state.tab === 'vmsoff') renderVmsOff1132();"),
    # rep() matches the old text with its leading whitespace, so a replacement that starts where a space was must start with that space
    ('Print deep link', "else if ((m = h.match(/^print\\/nights\\/(\\d{4}-\\d{2}-\\d{2})$/))) {",
     " else if ((m = h.match(/^print\\/vmsoff\\/(\\d{4}-\\d{2}-\\d{2})$/))) { if (window.VmsOff1132) VmsOff1132.morning = m[1]; go('vmsoff'); dpFromLink('vmsoff', m[1]); } /* v11.32 */\n"
     " else if ((m = h.match(/^print\\/nights\\/(\\d{4}-\\d{2}-\\d{2})$/))) {"),
    ('Print bar document', "if (kind === 'nights') { if (!(window.Nights1022",
     " if (kind === 'vmsoff') { if (!(window.VmsOff1132 && VmsOff1132.MORNINGS.some(n => n.iso === iso))) { dpBarSay('That day is not a removal morning.', false); return; }\n"
     " dpBarSay(DP_MAIL.vmsoff + ' · ' + fmtDate(iso) + ' · 1 page', true); VmsOff1132.print(iso, {keep: true}); dpZoomFit(); } /* v11.32 */\n"
     " else if (kind === 'nights') { if (!(window.Nights1022"),
    ('Print bar words', "nights: 'Event night run sheet',", "nights: 'Event night run sheet', vmsoff: 'VMS removals sheet',"),
    ('Hash to tab', "if (/^print\\/nights\\//.test(s)) return 'nights'; /* v10.22 */", " if (/^print\\/vmsoff\\//.test(s)) return 'vmsoff'; /* v11.32 */\n if (/^print\\/nights\\//.test(s)) return 'nights'; /* v10.22 */"),
    ('Release footer', "+' · v11.31'; /* v8.19 release922", "+' · v11.32'; /* v8.19 release922"),
]


def patch(html):
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.32 requires the live v11.31 page ' + BASE_SHA256)
    if 'vmsoff1132-script' in html: raise ValueError('v11.32 already applied')
    script = SCRIPT.read_text(encoding='utf-8').rstrip('\n'); css = CSS.read_text(encoding='utf-8').rstrip('\n')
    assert script.startswith('/* Author: Andrew Fisher.') and css.startswith('/* Author: Andrew Fisher.'), 'the script and style open with their author line'
    assert '</script' not in script and '</style' not in css
    for what, old, new in REPLACEMENTS:
        html = rep(html, old, new, what, 'page')
    i = html.rfind('</body>')
    if i < 0 or html.count('</body>') != 3 or html.count('<style id="svc1128-style">') != 1 or html.rfind('<style id="svc1128-style">') > i: raise ValueError('the end of the page is not as expected')
    html = html[:i] + '<style id="vmsoff1132-style">\n' + css + '\n</style>\n<script id="vmsoff1132-script">\n' + script + '\n</script>\n' + html[i:]
    for needle, n in [('vmsoff1132-script', 1), ('vmsoff1132-style', 1), ("['vmsoff','VMS removals']", 1), ('id="pane-vmsoff"', 1), ('renderVmsOff1132();', 1), ("return 'vmsoff'; /* v11.32 */", 1), ("kind === 'vmsoff'", 1), ("vmsoff: 'VMS removals sheet'", 1)]:
        if html.count(needle) != n: raise ValueError('v11.32 did not land cleanly: ' + needle + ' x' + str(html.count(needle)))
    return html


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1132 applied: VMS removals tab (#vmsoff), print path #print/vmsoff/<date>, footer v11.31 -> v11.32')
