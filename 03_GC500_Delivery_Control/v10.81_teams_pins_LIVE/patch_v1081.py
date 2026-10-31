"""Author: Andrew Fisher. v10.81 - the Teams Area toilets get their pins (servicing tracker crew card).

Andrew, 20 Oct 2026: Brad Jones Racing, Blanchard Race (T0162), Shell V-Power and T0176 Red Bull "gets pinned here", each with
a Google Maps pin. On the record (9963 -> 10036, record_18Oct2026_vms_regos/teams_pins_spec.json) BJR01, T0162, SVP01 and
T0176 were placed at those pins through placeHere. The crew card (SVC1067_CARD) carries the same pins, so each sheet gets its
directions QR and Navigate works. Nothing else changes. Footer v10.80 -> v10.81.

    python3 patch_v1081.py page.html      (in place, on the live v10.80 page)
"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

PINS = {'BJR01': '[-27.985863,153.427503]', 'T0162': '[-27.985742,153.427447]', 'SVP01': '[-27.986211,153.427753]', 'T0176': '[-27.986724,153.42801]'}
EDITS = [('"pin":null,"lines":[{"id":"' + r + '-', '"pin":' + p + ',"lines":[{"id":"' + r + '-', 'v10.81 card: ' + r + ' pin') for r, p in PINS.items()]

def main():
    path = sys.argv[1]; t = open(path, encoding='utf-8').read()
    if '"pin":[-27.985863,153.427503]' in t: sys.exit('patch_v1081 refuses a repeat')
    if "+ ' · v10.80'" not in t or 'noLine1080' not in t: sys.exit('patch_v1081 needs the live v10.80 page')
    for old, new, what in EDITS: t = rep(t, old, new, what, path)
    t = rep(t, "+ ' · v10.80'", "+ ' · v10.81'", 'footer', path)
    open(path, 'w', encoding='utf-8').write(t)
    print('patch_v1081 applied: pins for BJR01, T0162, SVP01, T0176 on the crew card; footer v10.80 -> v10.81')

if __name__ == '__main__':
    main()
