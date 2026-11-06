"""Author: Andrew Fisher. v10.79 - the spare goes to WC05; PG01, PG03, PG05, PG29 and WC85 get their pins (servicing tracker).

Andrew, 19-20 Oct 2026: "We shouldn't have any spare now" / "Allocate it to eventco. Allocate it in here please" (the Map
explorer on the Event Operations Compound) / "Wc85 goes here https://maps.app.goo.gl/a5Ccvr1aXqedGv2K6" / "Add to this
pinned locaction https://maps.google.com/?q=-27.986807,153.428013 ... pg05 pg29 pg01 pg03". On the record (9941 -> 9963,
record_18Oct2026_vms_regos/spare_pins_spec.json): Event Portables FWF 0164 came out of spares onto WC05 (the Event
Operations Compound toilet) through spareUse; PG01, PG03, PG05 and PG29 were placed at -27.986807, 153.428013 and WC85 at
-27.938636, 153.426477 through placeHere.

The servicing tracker data (SVC1067_DATA) and crew card (SVC1067_CARD) follow: the SPARE reference is gone from area 1;
WC05 gains "1 x FWF" (0164); the five references carry their pins, so their sheets get a location QR and Navigate works.
Nothing else changes. Footer v10.78 -> v10.79.

    python3 patch_v1079.py page.html      (in place, on the live v10.78 page)
"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

U = '\\u00d7'
PG = '[-27.986807,153.428013]'
EDITS = [
 (',{"ref":"SPARE","lines":[{"id":"SPARE-FWF","kind":"fwf","label":"1 ' + U + ' FWF","qty":1}]}', '', 'v10.79 data: no spare'),
 ('{"id":"WC05-WASTETAN","kind":"tank","label":"1 ' + U + ' Waste tank","qty":1}]}',
  '{"id":"WC05-WASTETAN","kind":"tank","label":"1 ' + U + ' Waste tank","qty":1},{"id":"WC05-FWF","kind":"fwf","label":"1 ' + U + ' FWF","qty":1}]}', 'v10.79 data: WC05 FWF'),
 (',{"ref":"SPARE","title":"Spare 0164 (no reference)","where":"Spare \\u00b7 Pit Lane","drop":"Pit Lane","pin":null,"lines":[{"id":"SPARE-FWF","type":"FWF","kind":"fwf","label":"1 ' + U + ' FWF","qty":1,"nos":["0164"]}]}', '', 'v10.79 card: no spare'),
 ('{"id":"WC05-WASTETAN","type":"Waste tank","kind":"tank","label":"1 ' + U + ' Waste tank","qty":1,"nos":["1328978"]}]}',
  '{"id":"WC05-WASTETAN","type":"Waste tank","kind":"tank","label":"1 ' + U + ' Waste tank","qty":1,"nos":["1328978"]},{"id":"WC05-FWF","type":"FWF","kind":"fwf","label":"1 ' + U + ' FWF","qty":1,"nos":["0164"]}]}', 'v10.79 card: WC05 FWF 0164'),
] + [('"drop":"Pit lane entry","pin":null,"lines":[{"id":"' + r + '-FWF"', '"drop":"Pit lane entry","pin":' + PG + ',"lines":[{"id":"' + r + '-FWF"', 'v10.79 card: ' + r + ' pin')
     for r in ('PG01', 'PG03', 'PG05', 'PG29')] + [
 ('"drop":"","pin":null,"lines":[{"id":"WC85-FWF"', '"drop":"","pin":[-27.938636,153.426477],"lines":[{"id":"WC85-FWF"', 'v10.79 card: WC85 pin'),
]

def main():
    path = sys.argv[1]; t = open(path, encoding='utf-8').read()
    if '"id":"WC05-FWF"' in t: sys.exit('patch_v1079 refuses a repeat')
    if "+ ' · v10.78'" not in t or '"nos":["0793","0769","0714","172824"]' not in t: sys.exit('patch_v1079 needs the live v10.78 page')
    for old, new, what in EDITS: t = rep(t, old, new, what, path)
    t = rep(t, "+ ' · v10.78'", "+ ' · v10.79'", 'footer', path)
    open(path, 'w', encoding='utf-8').write(t)
    print('patch_v1079 applied: no spare; WC05 FWF 0164; pins for PG01/03/05/29 and WC85; footer v10.78 -> v10.79')

if __name__ == '__main__':
    main()
