"""Author: Andrew Fisher. v10.77 - the VMS board register in VMS-number order, with what has turned up.

Andrew, 19 Oct 2026: "i want this simple forget the T numbers for these ... each with a VMS number whats turned up", "Our
qty needs to now be 23", then "Proceed upload and you go live". The Equipment tab's VMS board register now lists its 23
boards VMS01 to VMS24 in number order (it was contract-line order: VMS02, VMS01, VMS07 ...), each marked "turned up"
(on a delivery that is on site) or "still to come", and its heading reads "23 boards · 20 turned up · 3 still to come
· 20 regos given". The same rule as v10.76's count. Display only. Footer v10.76 -> v10.77.

    python3 patch_v1077.py page.html      (in place, on the live v10.76 page)
"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

HELP = '''/* v10.77 - the register by VMS number, and whether each board has turned up (the v10.76 rule: on a delivery that is on site) */
function vms1077Num(b){ const m = String((b && b.name) || '').match(/VMS\\s?0*(\\d{1,3})/i); return m ? +m[1] : 999; }
function vms1077Up(b){ const on = vms913OnOf(b).on, d = on ? deliveryOf(on) : null; return !!(d && (d.state === 'on site' || d.done)); }
function vms1077Mark(b){ return vms1077Up(b) ? '<span class="vms1077up" style="color:#1a7f37;font-weight:600;white-space:nowrap">\\u2713 turned up</span>' : '<span class="todo" style="white-space:nowrap">still to come</span>'; }
'''
EDITS = [
 ("/* on the Equipment tab, under every reference, while VMS boards (or every trade) is shown */\nfunction vms913Mount(){",
  HELP + "/* on the Equipment tab, under every reference, while VMS boards (or every trade) is shown */\nfunction vms913Mount(){", 'v10.77 helpers'),
 (" const bs = vms913Boards(); if (!bs.length) return;\n const name = 'VMS board register', st = vms913St();",
  " const bs = vms913Boards().slice().sort((x, y) => vms1077Num(x) - vms1077Num(y) || String(x.name).localeCompare(String(y.name))); if (!bs.length) return; /* v10.77 - VMS-number order */\n const name = 'VMS board register', st = vms913St();", 'v10.77 order'),
 (" const fold = eq796Fold(name, vms913LineCount() + ' contract lines · whose, fleet number, rego and delivery · ' + given + ' rego' + (given === 1 ? '' : 's') + ' given', [box]);",
  " const up1077 = bs.filter(vms1077Up).length; /* v10.77 - what has turned up, by VMS number */\n const fold = eq796Fold(name, bs.length + ' boards · ' + up1077 + ' turned up · ' + (bs.length - up1077) + ' still to come · ' + given + ' rego' + (given === 1 ? '' : 's') + ' given', [box]);", 'v10.77 heading'),
 (' <span class="vms913c b" data-l="Board"><b>${esc(b.name)}</b><small>${esc(sub)}</small></span>',
  ' <span class="vms913c b" data-l="Board"><b>${esc(b.name)}</b> ${vms1077Mark(b)}<small>${esc(sub)}</small></span>', 'v10.77 mark'),
]

def main():
    path = sys.argv[1]; t = open(path, encoding='utf-8').read()
    if 'function vms1077Num' in t: sys.exit('patch_v1077 refuses a repeat')
    if "+ ' · v10.76'" not in t or 'function vmsCount1076' not in t: sys.exit('patch_v1077 needs the live v10.76 page')
    for old, new, what in EDITS: t = rep(t, old, new, what, path)
    t = rep(t, "+ ' · v10.76'", "+ ' · v10.77'", 'footer', path)
    open(path, 'w', encoding='utf-8').write(t)
    print('patch_v1077 applied: VMS register by number with turned up / still to come; footer v10.76 -> v10.77')

if __name__ == '__main__':
    main()
