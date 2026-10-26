"""Author: Andrew Fisher. v12.34 - the Demob tab's look.

Andrew, 26 Oct 2026: "We need this to look better come on mate."

  - The pick-up list in the servicing tracker's dark style. On a phone each line is a compact card: the plate and what it is
    with its branch, the three lights with the status beside them, then the pick-up day and time with the More button. The
    Coates and Sub-hired sections are dark, and the desktop table matches with each line in its own band and a coloured edge
    for its status (red not ready, amber ready, green picked up).
  - Presentation only: one stylesheet, inserted before </body>. The same cells, words, lights and buttons; no record, plan,
    rule, count, charge, QR or tracker change. Print keeps the page's own light table.
Footer v12.33 -> v12.34. Built on the live v12.33 (the Demob identifier labels), whose wording it keeps.
    python3 patch_v1234.py page.html      (in place, on the verified live page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = 'c6b8141c32728a7f59914aa53c0032cb8770131e142407bc0d0e7f84a4a0cf45'
FOOT_OLD, FOOT_NEW = "+' · v12.33'; /* v8.19 release922", "+' · v12.34'; /* v8.19 release922"
TAIL = '</body>\n</html>\n'
sha = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()


def patch(text):
    if sha(text) != BASE: raise ValueError('Live base is not the verified v12.33; rebuild and retest')
    if 'demob1234-style' in text: raise ValueError('v12.34 is already on the page')
    if not text.endswith(TAIL): raise ValueError('the page does not end with </body></html>')
    text = text[:-len(TAIL)] + (HERE / 'demob1234_src.js').read_text(encoding='utf-8').rstrip() + '\n' + TAIL
    if text.count(FOOT_OLD) != 1: raise ValueError('release footer v12.33 not found once')
    return text.replace(FOOT_OLD, FOOT_NEW)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1234 applied: demob1234 stylesheet (the Demob pick-up list in the dark card style); footer v12.33 -> v12.34')
