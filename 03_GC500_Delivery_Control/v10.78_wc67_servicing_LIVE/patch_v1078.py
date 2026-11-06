"""Author: Andrew Fisher. v10.78 - WC67 is 4 FWF in the servicing tracker too.

Andrew, 19 Oct 2026: "Make sure the qty in w67 is 4 not 2". The record already holds WC67 FWF x 4 (0793, 0769, 0714 Event
Portables; 172824 Coates; record 9928 -> 9941). The servicing tracker's data (SVC1067_DATA and the crew card SVC1067_CARD,
a snapshot of record 9704, 18 Oct) still listed WC67 as 2 x FWF (0793, 0769), so the crews would have serviced two. Both
now list 4 x FWF with all four numbers. Nothing else in the tracker changes. Footer v10.77 -> v10.78.

    python3 patch_v1078.py page.html      (in place, on the live v10.77 page)
"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

EDITS = [
 ('{"ref":"WC67","lines":[{"id":"WC67-FWF","kind":"fwf","label":"2 \\u00d7 FWF","qty":2}]}',
  '{"ref":"WC67","lines":[{"id":"WC67-FWF","kind":"fwf","label":"4 \\u00d7 FWF","qty":4}]}', 'v10.78 WC67 servicing data'),
 ('{"ref":"WC67","title":"WC67","where":"Toilets","drop":"Helen Park drop point (red dot)","pin":[-27.981391,153.424166],"lines":[{"id":"WC67-FWF","type":"FWF","kind":"fwf","label":"2 \\u00d7 FWF","qty":2,"nos":["0793","0769"]}]}',
  '{"ref":"WC67","title":"WC67","where":"Toilets","drop":"Helen Park drop point (red dot)","pin":[-27.981391,153.424166],"lines":[{"id":"WC67-FWF","type":"FWF","kind":"fwf","label":"4 \\u00d7 FWF","qty":4,"nos":["0793","0769","0714","172824"]}]}', 'v10.78 WC67 crew card'),
]

def main():
    path = sys.argv[1]; t = open(path, encoding='utf-8').read()
    if '"nos":["0793","0769","0714","172824"]' in t: sys.exit('patch_v1078 refuses a repeat')
    if "+ ' · v10.77'" not in t or 'function vms1077Num' not in t: sys.exit('patch_v1078 needs the live v10.77 page')
    for old, new, what in EDITS: t = rep(t, old, new, what, path)
    t = rep(t, "+ ' · v10.77'", "+ ' · v10.78'", 'footer', path)
    open(path, 'w', encoding='utf-8').write(t)
    print('patch_v1078 applied: WC67 4 x FWF in the servicing tracker; footer v10.77 -> v10.78')

if __name__ == '__main__':
    main()
