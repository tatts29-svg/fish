"""Author: Andrew Fisher. v11.93 - Today, part 2: Milestones off, the name put right, staff and contacts fold.

Andrew, 25 Oct 2026 (this chat, with phone screenshots): "Milestpne remove"; "Stilll npt fixed" (the Today card read
"Recording as Andrew Fisherp"); "Hide theseclick show to show more" (Available staff and Who to call).
  MS1025 after(): the Milestones section is no longer drawn on Today (one line); the Work progress board's 100% badges
  and the first-time celebration are unchanged.
  build1191 (v11.91): the Build complete bar counts from the figures the Milestones code passes to ms1026After on each
  redraw (kept by today1193_src.js) instead of the section, and its words drop "Milestones".
  today1193_src.js + today1193.css: "Andrew Fisherp" is put right on the device (persist only, nothing sent); the name on
  the Today card opens the Recording as box; a change there shows at once; Available staff and Who to call fold to their
  title row with Show / Hide, closed by default and remembered on the device (screen only).
  Footer -> v11.93. No record, servicing, crew card, QR code, server or charge change.

    python3 patch_v1193.py page.html      (in place, on the live v11.92 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = '1ca10ac4c8498f4e07a47aa5de4d4f59ef9c17a218961340fe275480eb90e2a3'
ANCHOR = '<script id="steady1143-script">'
MS_OLD = " board.insertAdjacentHTML('afterend', sectionHtml(asOf));"
MS_NEW = (" /* v11.93 - the Milestones section is no longer drawn on Today (Andrew, 25 Oct 2026: \"Milestpne remove\");"
          " the board's 100% badges and the celebration stay */")
WORDS_OLD = "'Where we are, Work progress, Milestones and By group'"
WORDS_NEW = " 'Where we are, Work progress and By group'"   # rep() takes the space before the old words; this puts it back
COUNT_OLD = ("  var ms = document.getElementById('ms1025');\n"
             "  var F = B.facts(ms ? ms.querySelectorAll('.ms1025-area').length : 0, ms ? ms.querySelectorAll('.ms1025-rest .ms1025-area').length : 0);")
COUNT_NEW = ("  var ms = document.getElementById('ms1025'), c = W.__ms1193; /* v11.93 - the Milestones code's own figures from Today's last redraw */\n"
             "  var F = c ? B.facts(c.total, c.rest) : B.facts(ms ? ms.querySelectorAll('.ms1025-area').length : 0, ms ? ms.querySelectorAll('.ms1025-rest .ms1025-area').length : 0);")


def patch(html):
    if 'today1193-script' in html: raise ValueError('v11.93 already applied')
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE: raise ValueError('Wrong live base for v11.93 (expected v11.92 1ca10ac4...)')
    for need in ('W.MS1025 = {FORM', 'W.ms1025After = after;', 'build1191-script', 'clean1190-script', 'function whoFocus(){',
                 'function persist(){', "$('#who').onchange = () =>", 'Recording as <b>${esc(S.operator)}</b>', 'staff988-heading',
                 '<div class="hubtitle">', 'var TodayWork840 = (() => {', MS_OLD, WORDS_OLD, COUNT_OLD):
        if need not in html: raise ValueError('the page has no %r' % need)
    for once in (MS_OLD, WORDS_OLD, COUNT_OLD):
        if html.count(once) != 1: raise ValueError('%r must be there exactly once' % once[:60])
    for before in ('W.MS1025 = {FORM', 'build1191-script', 'clean1190-script', 'function whoFocus(){'):
        if html.index(before) > html.index(ANCHOR): raise ValueError('%r must load before the anchor' % before)
    src = (HERE / 'today1193_src.js').read_text(encoding='utf-8')
    css = (HERE / 'today1193.css').read_text(encoding='utf-8')
    if '</script' in src.lower() or '</style' in css.lower(): raise ValueError('source would close its own tag')
    html = rep(html, MS_OLD, MS_NEW, 'Milestones section off Today', 'page')
    html = rep(html, WORDS_OLD, WORDS_NEW, 'Build complete bar words', 'page')
    html = rep(html, COUNT_OLD, COUNT_NEW, 'Build complete bar count', 'page')
    block = '<style id="today1193-style">\n' + css + '</style>\n<script id="today1193-script">\n' + src + '\n</script>\n' + ANCHOR
    html = rep(html, ANCHOR, block, 'Today part 2', 'page')
    return rep(html, "+' · v11.92'; /* v8.19 release922", "+' · v11.93'; /* v8.19 release922", 'footer', 'page')


if __name__ == '__main__':
    p = Path(sys.argv[1])
    p.write_text(patch(p.read_text(encoding='utf-8')), encoding='utf-8')
    print('v11.93 Today part 2 applied')
