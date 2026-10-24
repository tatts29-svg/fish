"""Author: Andrew Fisher. v11.56 - the gates on the maps.

Andrew, 23 Oct 2026: "can we add a gate search on the maps so when someone says gate 1 or gate 6 we know where it is please".
gates1156.js (see its head) and the footer v11.55 -> v11.56. One style rule for the finder's gate row and the satellite
pin. No record change.

    python3 patch_v1156.py page.html      (in place, on the live v11.55 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
STYLE = '<style id="gates1156-style">.fi.gate1156 .fipin{background:#fff;color:#101418;border:2px solid #101418;font-weight:800}.s1141-chip.gate{border:1px solid #101418}.s1141-pin.vms[data-id^="G"] text.s1141-num{fill:#101418}</style>'


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.56 requires the live v11.55 page ' + BASE_SHA256)
    text = rep(text, "+' · v11.55'; /* v8.19 release922", "+' · v11.56'; /* v8.19 release922", 'release footer', 'page')
    block = (HERE / 'gates1156.js').read_text(encoding='utf-8').strip()
    text = rep(text, '<script id="steady1143-script">', STYLE + '\n<script id="gates1156-script">\n' + block + '\n</script>\n<script id="steady1143-script">', 'gates block before steady1143', 'page')
    for needle, n in [("+' · v11.56'; /* v8.19 release922", 1), ('id="gates1156-script"', 1), ('id="gates1156-style"', 1), ('W.Gates1156 = ', 1)]:
        if text.count(needle) != n: raise ValueError('v11.56 did not land cleanly: ' + needle + ' x' + str(text.count(needle)))
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1156 applied: gates on the maps; footer v11.55 -> v11.56')
