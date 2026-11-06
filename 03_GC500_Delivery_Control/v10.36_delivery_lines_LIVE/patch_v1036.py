"""Author: Andrew Fisher. A contract's "Delivery for Line Item(s) 7,14" names its units, v10.36 (Andrew, 16 Oct 2026:
"You should also have transport charges we charge for delivery and pick up", with the 2026 rate card workbook, whose
Transport tab the page already holds). The transport model reads a contract's own transport lines and allocates each
to the hire lines it names; it read "HA Line Item(s) 1,2" but not "Line Item(s) 7,14" (NVAC 9961976 line 50, $359.80,
the delivery of GN19 and GN04). An unread line is "unallocated", and an unallocated delivery line held EVERY generator's
delivery leg at nought, so twelve generators showed no delivery charge at the card. Now both spellings name their lines:
9961976's delivery covers GN19 and GN04 and the other generators' delivery legs are the card's each-way charge, like
their pick-up legs already were. No rate changes; no record changes. Footer v10.35 -> v10.36.

    python3 patch_v1036.py path/to/page.html   (after patch_v1035.py)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

REPLACEMENTS = [
    ('Line Item(s) with or without HA', "const ha = /HA\\s+Line\\s+Item(?:\\(s\\)|s)?\\s*(\\d+(?:\\s*,\\s*\\d+)*)/i.exec(text);",
     "const ha = /(?:HA\\s+)?Line\\s+Item(?:\\(s\\)|s)?\\s*(\\d+(?:\\s*,\\s*\\d+)*)/i.exec(text); /* v10.36 - \"Delivery for Line Item(s) 7,14\" names its lines as \"HA Line Item(s)\" does */"),
    ('Malformed check, same spellings', "malformedHA:/HA\\s+Line\\s+Item/i.test(text)&&(!ha||/\\d\\s*[-–]\\s*\\d/.test(text))};",
     "malformedHA:/(?:HA\\s+)?Line\\s+Item/i.test(text)&&(!ha||/\\d\\s*[-–]\\s*\\d/.test(text))};"),
    ('Release footer', "+ ' · v10.35'", "+ ' · v10.36'"),
]


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if 'v10.36 - "Delivery for Line Item(s) 7,14"' in html: sys.exit('patch_v1036 refuses a repeat')
    if "+ ' · v10.35'" not in html: sys.exit('patch_v1036: not the v10.35 line - wrong base (apply patch_v1035.py first)')
    for what, old, new in REPLACEMENTS: html = rep(html, old, new, what, str(page))
    page.write_text(html, encoding='utf-8')
    print('patch_v1036 applied: a contract\'s "Delivery for Line Item(s) …" names its units; footer v10.35 -> v10.36')


if __name__ == '__main__':
    main()
