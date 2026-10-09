#!/usr/bin/env python3
"""v6.95 - the pre-start, prefilled automatically on the Timeline (see prestart695.js for what and when).
Independent of the map patches: applies to v6.90 or later.   python3 patch_v695.py <page.html> <prestart695.js>"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402


def patch(path, jsf, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if 'PS_LIFE_RULES' in t: sys.exit('v6.95 already applied')
    R = lambda old, new, what: rep(t, old, new, what, path, need)
    js = open(jsf, encoding='utf-8').read().rstrip() + '\n'
    t = R("function dayBlock(d, full){", js + "function dayBlock(d, full){", 'code')
    a_ = '<button class="btn" data-print-day="${esc(d.iso)}"'
    if t.count(a_) != 1: sys.exit('print-day button anchor: %d' % t.count(a_))
    t = t.replace(a_, '${prestartButton(d)}' + a_, 1)
    t = R(" pane.querySelectorAll('[data-print-day]').forEach(n => n.onclick = () => dayPrint(n.dataset.printDay));",
          " pane.querySelectorAll('[data-print-day]').forEach(n => n.onclick = () => dayPrint(n.dataset.printDay));\n pane.querySelectorAll('[data-print-prestart]').forEach(n => n.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); prestartPrint(n.dataset.printPrestart); });   /* v6.95 */", 'print')
    css = """
/* v6.95 - the prefilled pre-start */
.pscard{margin:12px 0 6px;border:1px solid var(--rule);border-left:4px solid #ff6a13;border-radius:10px;background:var(--paper);padding:0 14px 10px}
.pscard summary{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;padding:11px 0;cursor:pointer;list-style:none}
.pscard summary::-webkit-details-marker{display:none}
.psk{font:800 11px/1 inherit;letter-spacing:.14em;background:#ff6a13;color:#1b1207;padding:5px 8px;border-radius:5px}
.pswhen{color:var(--mute);font-size:12.5px;flex:1 1 220px}
.pssec{margin:8px 0}.pssec h4{margin:10px 0 6px;font-size:13.5px;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.pssec h4 i{font-style:normal;color:#ff6a13;font-weight:800}.pssec h4 em{font-style:normal;font-weight:500;color:var(--mute);font-size:12px}
.pssec p{margin:4px 0;font-size:13.5px;line-height:1.5}
.pslist{list-style:none;margin:0;padding:0;display:grid;gap:6px}.pslist li{font-size:13.5px;line-height:1.45;display:flex;gap:8px;align-items:flex-start}
.pslist li b{white-space:nowrap}.pslist li{display:block;padding-left:26px;position:relative}.pslist .pschk{position:absolute;left:0;top:2px;width:17px;height:17px;accent-color:#ff6a13}
.pslist.lsr li{background:rgba(255,106,19,.06);border-radius:6px;padding:6px 8px 6px 34px}.pslist.lsr .pschk{left:8px;top:8px}
.psstop{background:#10151a;color:#fff;border-radius:8px;padding:10px 12px;font-size:14px}
.psnote{margin:10px 0;font-size:12.5px;color:var(--mute);border-left:3px solid var(--rule);padding:4px 10px}
.psadd{color:var(--mute)}
.psprint .pslist{gap:3px}.psprint .pslist li{padding-left:18px;font-size:9.6px;line-height:1.28}.psprint .psbox{position:absolute;left:0;top:1px;width:10px;height:10px;border:1.2px solid #111;border-radius:2px}
.psprint .pslist.lsr{grid-template-columns:1fr 1fr;gap:3px 6px}.psprint .pslist.lsr li{padding:4px 6px 4px 22px;font-size:9px;line-height:1.25}.psprint .pslist.lsr .psbox{left:6px;top:5px}
.psprint .pssec{margin:4px 0}.psprint .pssec p{font-size:9.8px;margin:2px 0}.psprint .pssec h4{font-size:11px;margin:5px 0 3px}.psprint .psstop{font-size:11px;padding:5px 9px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.psprint .psline{display:block;border-bottom:1px solid #999;height:13px}.psprint .rs-head h1{font-size:18px}.psprint .rs-head .sub{font-size:10px}
.pssign{width:100%;border-collapse:collapse;font-size:9.5px}.pssign th,.pssign td{border:1px solid #888;padding:2px 6px;height:15px;text-align:left}
@media(max-width:640px){.pslist li b{white-space:normal}}
</style>"""
    k = t.find('</style>'); t = t[:k] + css + t[k + len('</style>'):]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], sys.argv[2], True)
