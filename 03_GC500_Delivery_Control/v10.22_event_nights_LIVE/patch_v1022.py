"""Author: Andrew Fisher. Event nights run sheet, v10.22: a new tab "Event nights" (#nights) for the three event nights,
23, 24 and 25 Oct 2026 - the per-night record of the Event Portables night service (service order of every toilet
unit with pumped-out, water-refilled, fill-level and spot-check ticks, relocation requests, the night manager's
end-of-shift sign-off and the project manager's audit), written through the page's own write path on the edit link,
and the printable run sheet on the day-document print path (#print/nights/<date>). No position, quantity, rate,
charge or record value changes; nothing is pre-ticked.

    python3 patch_v1022.py path/to/page.html

Guards: refuses a repeat (nights1022-script already in the page) and a wrong base (the v10.21 line's
gate6Revision1021 must be present).
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

SCRIPT = HERE / 'nights1022.js'
CSS = HERE / 'nights1022.css'
GLYPH = '<path d="M10.6 2.4a5.6 5.6 0 1 0 3 10.4 6.2 6.2 0 0 1-3-10.4z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>'

REPLACEMENTS = [
    ('Tab list', "['timeline','Build'],['subhired','Sub-hired'],", "['timeline','Build'],['subhired','Sub-hired'],['nights','Event nights'],"),
    ('Tab glyph', 'const TAB_GLYPH = {', "const TAB_GLYPH = {\n nights: '" + GLYPH + "',"),
    ('Tab pane', '<section class="pane" id="pane-subhired"></section>', '<section class="pane" id="pane-subhired"></section>\n<section class="pane" id="pane-nights"></section>'),
    ('Render dispatch', " else if (state.tab === 'subhired') renderSubhired932();", " else if (state.tab === 'subhired') renderSubhired932();\n else if (state.tab === 'nights') renderNights1022();"),
    ('Print deep link', "else if ((m = h.match(/^print\\/(drivers|install|prestart)\\/(\\d{4}-\\d{2}-\\d{2})$/))) { state.day = m[2];",
     "else if ((m = h.match(/^print\\/nights\\/(\\d{4}-\\d{2}-\\d{2})$/))) { if (window.Nights1022) Nights1022.night = m[1]; go('nights'); dpFromLink('nights', m[1]); } /* v10.22 */\n"
     " else if ((m = h.match(/^print\\/(drivers|install|prestart)\\/(\\d{4}-\\d{2}-\\d{2})$/))) { state.day = m[2];"),
    ('Print bar document', "if (kind === 'prestart') { const d = ps7Day(iso); if (!d) { dpBarSay('That day is outside the programme.', false); return; }",
     "if (kind === 'nights') { if (!(window.Nights1022 && Nights1022.NIGHTS.some(n => n.iso === iso))) { dpBarSay('That night is not an event night.', false); return; }\n"
     " dpBarSay(DP_MAIL.nights + ' · ' + fmtDate(iso) + ' · 1 page', true); Nights1022.print(iso, {keep: true}); dpZoomFit(); } /* v10.22 */\n"
     " else if (kind === 'prestart') { const d = ps7Day(iso); if (!d) { dpBarSay('That day is outside the programme.', false); return; }"),
    ('Print bar words', "const DP_MAIL = {prestart: 'Daily pre-start', drivers: 'Delivery drivers', install: 'Install team'};",
     "const DP_MAIL = {prestart: 'Daily pre-start', drivers: 'Delivery drivers', install: 'Install team', nights: 'Event night run sheet'};"),
    ('Hash to tab', "if (/^print\\//.test(s)) return 'timeline'; /* v7.00 */", "if (/^print\\/nights\\//.test(s)) return 'nights'; /* v10.22 */\n if (/^print\\//.test(s)) return 'timeline'; /* v7.00 */"),
    ('Event nights script', '</script>\n</body>', '</script>\n<style id="nights1022-style">\n%CSS%\n</style>\n<script id="nights1022-script">\n%SCRIPT%\n</script>\n</body>'),
    ('Release footer', "+ ' · v10.21'", "+ ' · v10.22'"),
]


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if 'nights1022-script' in html: sys.exit('patch_v1022 refuses a repeat: nights1022-script is already in the page')
    if 'function gate6Revision1021(ref) {' not in html: sys.exit('patch_v1022: not the v10.21 line (gate6Revision1021 missing) - wrong base')
    script = SCRIPT.read_text(encoding='utf-8').rstrip('\n'); css = CSS.read_text(encoding='utf-8').rstrip('\n')
    assert script.startswith('/* Author: Andrew Fisher.'), 'the script must open with its author line'
    assert '</script' not in script and '</style' not in css
    for what, old, new in REPLACEMENTS:
        html = rep(html, old, new.replace('%SCRIPT%', script).replace('%CSS%', css), what, page)
    page.write_text(html, encoding='utf-8')
    print('patch_v1022 applied: Event nights tab (#nights), print path #print/nights/<date>, footer v10.21 -> v10.22')


if __name__ == '__main__':
    main()
