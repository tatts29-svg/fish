"""Author: Andrew Fisher. v10.82 - T0024 gets its pin (servicing tracker crew card).

Andrew, 20 Oct 2026: "T0024 is https://maps.app.goo.gl/n8Q6Cp7YdSznhoPV6" (-27.983217, 153.426372 - on Macintosh Island, 44 m from WC05;
the drawing had it near Narrowneck). On the record (10036 -> 10039, record_18Oct2026_vms_regos/t0024_pin_spec.json) T0024
was placed there through placeHere. The crew card (SVC1067_CARD) carries the same pin, so its sheet gets its
directions QR and Navigate works. Nothing else changes. Footer v10.81 -> v10.82.

    python3 patch_v1082.py page.html      (in place, on the live v10.81 page)
"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

PINS = {'T0024': '[-27.983217,153.426372]'}
EDITS = [('"pin":null,"lines":[{"id":"' + r + '-', '"pin":' + p + ',"lines":[{"id":"' + r + '-', 'v10.82 card: ' + r + ' pin') for r, p in PINS.items()]

def main():
    path = sys.argv[1]; t = open(path, encoding='utf-8').read()
    if '"pin":[-27.983217,153.426372]' in t: sys.exit('patch_v1082 refuses a repeat')
    if "+ ' · v10.81'" not in t or '"pin":[-27.985863,153.427503]' not in t: sys.exit('patch_v1082 needs the live v10.81 page')
    for old, new, what in EDITS: t = rep(t, old, new, what, path)
    t = rep(t, "+ ' · v10.81'", "+ ' · v10.82'", 'footer', path)
    open(path, 'w', encoding='utf-8').write(t)
    print('patch_v1082 applied: T0024 pin on the crew card; footer v10.81 -> v10.82')

if __name__ == '__main__':
    main()
