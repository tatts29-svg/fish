"""Author: Andrew Fisher. v10.73 - a milestone's headline counts the things its percentage counts.

Andrew, 18 Oct 2026: "Fix.this .saying only.4.onsite on main page". The Today milestone card read "VMS boards 100% · 4 of 4
complete". The percentage is the board's count (16 of 16 VMS boards), but the headline counted deliveries (4: T0001, T0103,
T0128, T0158). Every milestone headline, on Today and in the milestone list, now reads in the area's own unit, e.g. "16 of
16 boards complete". It falls back to the delivery count only where an area has no unit count. The card's "References" row
still lists the deliveries. No figure, record or percentage changes. Footer v10.72 -> v10.73.

    python3 patch_v1073.py page.html      (in place, on the live v10.72 page)
"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

CNT = "${f.units && f.units.total ? f.units.done + ' of ' + f.units.total + (f.unit ? ' ' + esc(f.unit) : '') : f.complete + ' of ' + f.total} complete"
A_OLD = """<span class="w">${f.complete} of ${f.total} complete${f.reached && f.reachedAt ? ' · reached ' + esc(dmyhm(f.reachedAt)) : ''}</span></summary>"""
A_NEW = """<span class="w">""" + CNT + """${f.reached && f.reachedAt ? ' · reached ' + esc(dmyhm(f.reachedAt)) : ''}</span></summary>"""
B_OLD = """<span class="ms1026-txt"><b>${esc(f.name)}</b><span class="w">${f.complete} of ${f.total} complete${f.reachedAt ? ' · reached ' """
B_NEW = """<span class="ms1026-txt"><b>${esc(f.name)}</b><span class="w">""" + CNT + """${f.reachedAt ? ' · reached ' """

def main():
    path = sys.argv[1]; t = open(path, encoding='utf-8').read()
    if "f.units && f.units.total ? f.units.done + ' of '" in t: sys.exit('patch_v1073 refuses a repeat')
    if "+ ' · v10.72'" not in t: sys.exit('patch_v1073 needs the live v10.72 page')
    t = rep(t, A_OLD, A_NEW, 'v10.73 milestone card headline', path)
    t = rep(t, B_OLD, B_NEW, 'v10.73 milestone list headline', path)
    t = rep(t, "+ ' · v10.72'", "+ ' · v10.73'", 'footer', path)
    open(path, 'w', encoding='utf-8').write(t)
    print('patch_v1073 applied: milestone headlines count units; footer v10.72 -> v10.73')

if __name__ == '__main__':
    main()
