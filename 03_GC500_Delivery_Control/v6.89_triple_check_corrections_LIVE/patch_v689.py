#!/usr/bin/env python3
"""v6.89 - THE TRIPLE CHECK (Andrew, 27 Sep 2026: "double check and triple check this 100% accurate").
Every master position was checked three ways: the raw words on the master at the point, the unit's own sheet
(D022/D023/D024 callouts and the K zone pages), and Andrew's 60 on-site pins. What it corrected, in the data this
patch is built with (master_loc_689.json, master_extra.json):
  WC69   the master tags it twice; it had the wrong tag (~80 m out). D023 and K228 both put it at the other one.
  T0243  "Toilet Block 6m · WC-TV" IS the WCTV toilet D023 calls out - now a unit on the master, not a stray.
  Big screens now sit on the BSxx tag printed on each screen on the master (D024's arrows stop in the road).
  "Drawn, not on our schedule" now lists everything drawn with no schedule row: WC18, WC-BSF, P24, P50, P61, CHL, P68.
This patch only renames that layer on the page.   Applied after patch_v688.py.   python3 patch_v689.py <page.html>
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402


def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    R = lambda old, new, what: rep(t, old, new, what, path, need)
    t = R("""['wcx', 'Toilets not on our schedule', 'WC18, WCBS and WCTV, drawn on D023 with no schedule row']""",
          """['wcx', 'Drawn, not on our schedule', 'drawn on the master or D022/D023 with no row on our schedule: WC18, WC-BSF, P24, P50, P61, CHL, P68']""", 'layer name')
    t = R("""the interface areas and the toilets D023 draws that our schedule does not carry;""",
          """the interface areas, and what the drawings show that no row on our schedule carries;""", 'notice')
    # where the unit's own (older) sheet disagrees with the master, say so beside the position - never folded away
    t = R(""" ${others.length ? `<span class="w">The master also tags ${esc(a.key)} at""",
          """ ${/rev 02\\b.*about \\d+ m/.test(mu.how) ? `<span class="w drawdiff"><b>Drawings differ:</b> ${esc(mu.how.replace(/^.*?(?:— |\\()/, '').replace(/\\)$/, ''))}.</span>` : ''}
 ${others.length ? `<span class="w">The master also tags ${esc(a.key)} at""", 'drawings differ')
    k = t.find('</style>'); t = t[:k] + "\n.drawdiff{display:block;margin-top:4px;font-weight:600}\n</style>" + t[k + len('</style>'):]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], True)
