"""Author: Andrew Fisher. v10.75 - one board, one card for the Coates VMS boards too.

Andrew, 19 Oct 2026: "It should be 1191657 it a coates machine we need all these cleaned up please". v10.74 made the
arrival record of a sub-hired VMS board and its VMS register row one card. The Coates boards had the same double: VMS12
(T0128) and VMS14-17 (T0158) each had a register row and the 16 Oct arrival record with the same asset number, so both
were flagged "Duplicate physical identity" and neither counted. The rule now covers every VMS register row: an
identified record of a VMS board with the register's company and asset number is that board. VMS13's arrival record
carried 1191957, not 1191657 on the plate; that record is set aside on the record (not by this patch). Priced revenue
changes by the hire on boards that now count once: T0128's VMS hire is priced on its two boards. Footer v10.74 -> v10.75.

    python3 patch_v1075.py page.html      (in place, on the live v10.74 page)
"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

OLD = "/* v10.74 - one board, one card: an identified record of a sub-hired VMS board with the register's company and fleet number is that board, not a second unit */\n rows.filter(r=>r.source==='identified'&&r.physical&&r.assetNo).forEach(r=>{const i=rows.findIndex(x=>x.source==='native'&&x.physical&&!x.metadata&&x.owner!=='coates'&&/^vms:/.test(x.nativeId||'')"
NEW = "/* v10.74 - one board, one card: an identified record of a VMS board with the register's company and fleet number is that board, not a second unit (v10.75: Coates boards too) */\n rows.filter(r=>r.source==='identified'&&r.physical&&r.assetNo).forEach(r=>{const i=rows.findIndex(x=>x.source==='native'&&x.physical&&!x.metadata&&/^vms:/.test(x.nativeId||'')"

def main():
    path = sys.argv[1]; t = open(path, encoding='utf-8').read()
    if '(v10.75: Coates boards too)' in t: sys.exit('patch_v1075 refuses a repeat')
    if "+ ' · v10.74'" not in t or 'mergedId1074' not in t: sys.exit('patch_v1075 needs the live v10.74 page')
    t = rep(t, OLD, NEW, 'v10.75 one card per VMS board, Coates too', path)
    t = rep(t, "+ ' · v10.74'", "+ ' · v10.75'", 'footer', path)
    open(path, 'w', encoding='utf-8').write(t)
    print('patch_v1075 applied: one card per VMS board, Coates too; footer v10.74 -> v10.75')

if __name__ == '__main__':
    main()
