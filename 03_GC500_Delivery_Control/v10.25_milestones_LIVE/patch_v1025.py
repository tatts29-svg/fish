"""Author: Andrew Fisher. Milestones, v10.25: when an area of the job (a discipline group, the plates on Where we are)
has every unit done by the board's own count, the area card on the Today tab's Work progress board carries a 100% badge with the day it got there, a short fireworks
burst plays once per browser, and a start-to-finish summary generated only from the record's own documents (counts
and stamps) sits under the plates, printable one A4 per area on the day-document print path (#print/milestone/<area>,
#print/milestone/all). Nothing is written to the record; no position, quantity, rate or charge changes.

    python3 patch_v1025.py path/to/page.html

Guards: refuses a repeat (ms1025-script already in the page) and a wrong base (the v10.24 line's vms1024-script and
the ' · v10.24' footer must be present).
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

SCRIPT = HERE / 'ms1025.js'
CSS = HERE / 'ms1025.css'

REPLACEMENTS = [
    ('After the Today tab draws its work board', "const r = renderToday_held(); wwaEmbed793(); pack795(); TodayWork840.restore(kept840); return r;",
     "const r = renderToday_held(); wwaEmbed793(); pack795(); TodayWork840.restore(kept840); if (typeof ms1025After === 'function') ms1025After(); /* v10.25 */ return r;"),
    ('Print deep link', "else if ((m = h.match(/^print\\/vms\\/(all|[0-9]{2}a?)$/))) {",
     "else if ((m = h.match(/^print\\/milestone\\/(all|[a-z0-9-]{2,60})$/))) { go('today'); dpFromLink('milestone', m[1]); } /* v10.25 */\n"
     " else if ((m = h.match(/^print\\/vms\\/(all|[0-9]{2}a?)$/))) {"),
    ('Print bar document', "if (kind === 'vms') {",
     "if (kind === 'milestone') { if (!window.MS1025) { dpBarSay('Milestones are not on this page.', false); return; }\n"
     " dpBarSay(DP_MAIL.milestone + ' · preparing', false); if (!MS1025.print(iso, {keep: true})) { dpBarSay('Nothing to print for that area.', false); return; } dpZoomFit(); } /* v10.25 */\n"
     " else if (kind === 'vms') {"),
    ('Print bar words', "nights: 'Event night run sheet', vms: 'VMS board sheet'};", "nights: 'Event night run sheet', vms: 'VMS board sheet', milestone: 'Milestone summary'};"),
    ('Hash to tab', "if (/^print\\/vms\\//.test(s)) return 'vms'; /* v10.24 */", "if (/^print\\/milestone\\//.test(s)) return 'today'; /* v10.25 */\n if (/^print\\/vms\\//.test(s)) return 'vms'; /* v10.24 */"),
    ('Milestones script', '</script>\n</body>', '</script>\n<style id="ms1025-style">\n%CSS%\n</style>\n<script id="ms1025-script">\n%SCRIPT%\n</script>\n</body>'),
    ('Release footer', "+ ' · v10.24'", "+ ' · v10.25'"),
]


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if 'ms1025-script' in html: sys.exit('patch_v1025 refuses a repeat: ms1025-script is already in the page')
    if 'vms1024-script' not in html or "+ ' · v10.24'" not in html: sys.exit('patch_v1025: not the v10.24 line - wrong base')
    script = SCRIPT.read_text(encoding='utf-8').rstrip('\n'); css = CSS.read_text(encoding='utf-8').rstrip('\n')
    assert script.startswith('/* Author: Andrew Fisher.'), 'the script must open with its author line'
    assert '</script' not in script and '</style' not in css
    for what, old, new in REPLACEMENTS:
        html = rep(html, old, new.replace('%SCRIPT%', script).replace('%CSS%', css), what, page)
    page.write_text(html, encoding='utf-8')
    print('patch_v1025 applied: milestones on the Today work board (100% badge, burst once per browser, generated summary), print path #print/milestone/<area|all>, footer v10.24 -> v10.25')


if __name__ == '__main__':
    main()
