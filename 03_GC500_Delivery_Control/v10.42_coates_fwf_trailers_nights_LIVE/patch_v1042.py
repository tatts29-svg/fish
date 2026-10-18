"""Author: Andrew Fisher. v10.42 - every FWF gets its event-night servicing, Coates' FWF trailers included (Andrew,
16 Oct 2026: "We charge for all FWF including Coates. For Fridays and Saturdays and Sundays").

v10.40 charged FWF Pump out & Clean & Restock ($72.87 a unit a night) on lines named exactly "FWF", which covered the
234 FWF units on the references, Event Portables' and Coates' alike. It missed WC100, the two Coates FWF trailers
(fleet 1248439 at S18 and 1288823 at The Spit), whose line reads "FWF Trailer". They are now counted the same way: one
unit each, Friday, Saturday and Sunday night. Nothing else changes; cancelled references (WC32) stay out.
Footer v10.40 -> v10.42 (v10.41 is claimed by the other agent for the 3D compass). No record changes.

    python3 patch_v1042.py path/to/page.html   (on the live v10.40 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

MARK = '/* v10.42 - fwf-trailers-1042 */'
REPLACEMENTS = [
    ('FWF trailers counted as FWF', "const n = {fwf: q(/^FWF$/i),", "const n = {fwf: q(/^FWF(\\s*Trailer)?$/i), " + MARK + " "),
    ('Release footer', "+ ' · v10.40'", "+ ' · v10.42'"),
]


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if MARK in html: sys.exit('patch_v1042 refuses a repeat')
    if "+ ' · v10.40'" not in html: sys.exit('patch_v1042: not the v10.40 line - wrong base')
    for what, old, new in REPLACEMENTS: html = rep(html, old, new, what, str(page))
    page.write_text(html, encoding='utf-8')
    print('patch_v1042 applied: FWF trailers get event-night servicing like every FWF; footer v10.40 -> v10.42')


if __name__ == '__main__':
    main()
