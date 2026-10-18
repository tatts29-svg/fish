"""Author: Andrew Fisher. The seven symbols, v10.33 (Andrew, 16 Oct 2026: "Maybe we do a clean symbol, and delivery, and a
symbol to be ticked and unticked. Goes in order: delivery, install, level, steps, clean, demob, pick up. If applicable.")
Every reference's row on the Equipment list and the day cards, and the drawer's Complete it island, carry the symbols
the thing carries, in that order, each a tick. Install, level, steps, clean and demob are the card's labour lines on
the reference (every unit of every item that carries the line); level and steps also set the record's own ticks.
Delivery and pick up are the transport legs at the card. The Levelled and Steps buttons the row had are now the Level and
Steps symbols in the row's order. Footer v10.32 -> v10.33.

    python3 patch_v1033.py path/to/page.html   (after patch_v1032.py)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

SCRIPT = HERE / 'sym1033.js'
CSS = HERE / 'sym1033.css'

REPLACEMENTS = [
    ('The Equipment row: Complete, then the seven in order', "${doneBtn(a.key, small !== false)}${levelBtn(a.key, small !== false)}${stepsBtn(a.key, small !== false)}${nextDayBtn(a.key, small !== false)}",
     "${doneBtn(a.key, small !== false)}${typeof sym1033Row === 'function' ? sym1033Row(a.key, small !== false) : levelBtn(a.key, small !== false) + stepsBtn(a.key, small !== false)}${nextDayBtn(a.key, small !== false)}"),
    ('The day card: the same row', "<div class=\"dcacts\">${doneBtn(key, false)}${levelBtn(key, false)}${stepsBtn(key, false)}${isIn ? nextDayBtn(key, false) : ''}",
     "<div class=\"dcacts\">${doneBtn(key, false)}${typeof sym1033Row === 'function' ? sym1033Row(key, false) : levelBtn(key, false) + stepsBtn(key, false)}${isIn ? nextDayBtn(key, false) : ''}"),
    ('Script and style', '</script>\n</body>', '</script>\n<style id="sym1033-style">\n%CSS%\n</style>\n<script id="sym1033-script">\n%SCRIPT%\n</script>\n</body>'),
    ('Release footer', "+ ' · v10.32'", "+ ' · v10.33'"),
]


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if 'sym1033-script' in html: sys.exit('patch_v1033 refuses a repeat')
    if "+ ' · v10.32'" not in html: sys.exit('patch_v1033: not the v10.32 line - wrong base (apply patch_v1032.py first)')
    script = SCRIPT.read_text(encoding='utf-8').rstrip('\n'); css = CSS.read_text(encoding='utf-8').rstrip('\n')
    assert script.startswith('/* Author: Andrew Fisher.'), 'the script must open with its author line'
    for what, old, new in REPLACEMENTS: html = rep(html, old, new.replace('%SCRIPT%', script).replace('%CSS%', css), what, str(page))
    page.write_text(html, encoding='utf-8')
    print('patch_v1033 applied: the seven symbols on every row and in the drawer; footer v10.32 -> v10.33')


if __name__ == '__main__':
    main()
