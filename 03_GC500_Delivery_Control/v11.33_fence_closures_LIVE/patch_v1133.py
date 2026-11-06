"""Author: Andrew Fisher. v11.33 - a new tab, Fence closures (#fenceclose): the ten closure points marked on the plan, each race
day's fence closure (07:00) and the morning and evening windows written on the plan, a closed and an opened tick per point per
day, and a printable closures sheet. The Fencing tab's closure card stops calling the circled numbers an order.

Andrew, 23 Oct 2026: "when i spoke about closures im talking about fence closure. This is data i got from v8s" (the Supercars
track access details); "This is what we work with this is also not a order it goes in" (the marked plan: the numbers are not
the order). Three jobs for the morning: VMS, Fencing, Servicing.

Mechanics as the VMS removals tab (v11.32). The record goes through the page's own write path on the edit link only;
nothing is pre-ticked; no position, quantity, rate or charge changes.

    python3 patch_v1133.py page.html      (in place, on the live v11.32 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
SCRIPT = HERE / 'fenceclose1133.js'
CSS = HERE / 'fenceclose1133.css'
GLYPH = '<path d="M3.2 3.6v9M8 3.6v9M12.8 3.6v9M2 6.6h12M2 10h12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'

# rep() matches the old text with its leading whitespace, so a replacement that starts where a space was must start with that space
REPLACEMENTS = [
    ('Tab list', "['vmsoff','VMS removals'],['servicing','Servicing'],", "['vmsoff','VMS removals'],['fenceclose','Fence closures'],['servicing','Servicing'],"),
    ('Tab glyph', 'const TAB_GLYPH = {', "const TAB_GLYPH = {\n fenceclose: '" + GLYPH + "',"),
    ('Tab pane', '<section class="pane" id="pane-vmsoff"></section>', '<section class="pane" id="pane-vmsoff"></section>\n<section class="pane" id="pane-fenceclose"></section>'),
    ('Render dispatch', " else if (state.tab === 'vmsoff') renderVmsOff1132();", " else if (state.tab === 'vmsoff') renderVmsOff1132();\n else if (state.tab === 'fenceclose') renderFenceClose1133();"),
    ('Print deep link', "else if ((m = h.match(/^print\\/vmsoff\\/(\\d{4}-\\d{2}-\\d{2})$/))) {",
     " else if ((m = h.match(/^print\\/fenceclose\\/(\\d{4}-\\d{2}-\\d{2})$/))) { if (window.FenceClose1133) FenceClose1133.day = m[1]; go('fenceclose'); dpFromLink('fenceclose', m[1]); } /* v11.33 */\n"
     " else if ((m = h.match(/^print\\/vmsoff\\/(\\d{4}-\\d{2}-\\d{2})$/))) {"),
    ('Print bar document', "if (kind === 'vmsoff') { if (!(window.VmsOff1132",
     " if (kind === 'fenceclose') { if (!(window.FenceClose1133 && FenceClose1133.DAYS.some(n => n.iso === iso))) { dpBarSay('That day is not a race day.', false); return; }\n"
     " dpBarSay(DP_MAIL.fenceclose + ' · ' + fmtDate(iso) + ' · 1 page', true); FenceClose1133.print(iso, {keep: true}); dpZoomFit(); } /* v11.33 */\n"
     " else if (kind === 'vmsoff') { if (!(window.VmsOff1132"),
    ('Print bar words', "vmsoff: 'VMS removals sheet',", "vmsoff: 'VMS removals sheet', fenceclose: 'Fence closures sheet',"),
    ('Hash to tab', "if (/^print\\/vmsoff\\//.test(s)) return 'vmsoff'; /* v11.32 */", " if (/^print\\/fenceclose\\//.test(s)) return 'fenceclose'; /* v11.33 */\n if (/^print\\/vmsoff\\//.test(s)) return 'vmsoff'; /* v11.32 */"),
    ('Closure card title', '<h3>Race weekend — what closes, in what order</h3>', '<h3>Race weekend — what closes, and when</h3>'),
    ('Closure card sub', 'Times and order are written by hand on the plan; everything here is copied as written.', 'The times and the circled numbers are written by hand on the plan; everything here is copied as written. The day-by-day closed and opened ticks are on the Fence closures tab.'),
    ('Closure card section', '<div class="sect">The order it closes in</div>', '<div class="sect">The closure points as marked on the plan</div>'),
    ('Closure card basis', '<p class="hint" style="margin:0 0 8px">${esc(CLO.order_basis || \'\')} ${esc(CLO.colour_basis || \'\')}</p>',
     '<p class="hint" style="margin:0 0 8px">The circled numbers are not the order the points close in (the project manager’s word, 23 Oct 2026): the crew works them as the day needs. ${esc(CLO.colour_basis || \'\')}</p>'),
    ('Release footer', "+' · v11.32'; /* v8.19 release922", "+' · v11.33'; /* v8.19 release922"),
]


def patch(html):
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.33 requires the live v11.32 page ' + BASE_SHA256)
    if 'fenceclose1133-script' in html: raise ValueError('v11.33 already applied')
    script = SCRIPT.read_text(encoding='utf-8').rstrip('\n'); css = CSS.read_text(encoding='utf-8').rstrip('\n')
    assert script.startswith('/* Author: Andrew Fisher.') and css.startswith('/* Author: Andrew Fisher.'), 'the script and style open with their author line'
    assert '</script' not in script and '</style' not in css
    for what, old, new in REPLACEMENTS:
        html = rep(html, old, new, what, 'page')
    i = html.rfind('</body>')
    if i < 0 or html.count('</body>') != 3 or html.count('<script id="vmsoff1132-script">') != 1 or html.rfind('<script id="vmsoff1132-script">') > i: raise ValueError('the end of the page is not as expected')
    html = html[:i] + '<style id="fenceclose1133-style">\n' + css + '\n</style>\n<script id="fenceclose1133-script">\n' + script + '\n</script>\n' + html[i:]
    for needle, n in [('fenceclose1133-script', 1), ('fenceclose1133-style', 1), ("['fenceclose','Fence closures']", 1), ('id="pane-fenceclose"', 1), ('renderFenceClose1133();', 1), ("return 'fenceclose'; /* v11.33 */", 1), ("kind === 'fenceclose'", 1), ("fenceclose: 'Fence closures sheet'", 1), ('what closes, in what order', 0), ('The order it closes in', 0)]:
        if html.count(needle) != n: raise ValueError('v11.33 did not land cleanly: ' + needle + ' x' + str(html.count(needle)))
    return html


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1133 applied: Fence closures tab (#fenceclose), print path #print/fenceclose/<date>, closure card wording, footer v11.32 -> v11.33')
