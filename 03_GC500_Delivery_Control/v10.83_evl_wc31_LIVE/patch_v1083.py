"""Author: Andrew Fisher. v10.83 - 0164 is at EVL on T0024; WC31's 16-pan blocks have their location (servicing tracker).

Andrew, 20 Oct 2026: "asset no 0164 you have in wrong area it belong here EVL wher the toilet symbol is this is an event
portable toilet", "pinned location is -27.983217488199138, 153.4266422001142"; asked where on the record, "Add to T0024"
(the FWF at EVL). And "wc31 16pan Block Asset no 12 is at location -27.98253262858165, 153.42515075329888 another 16pan block
asset no 74 is at location ... too". On the record (10039 -> 10051, record_18Oct2026_vms_regos/evl_wc31_spec.json): 0164
taken off WC05 and put on T0024 (Event Portables sub-hire unit; Costs unchanged), T0024 placed at the toilet symbol, WC31
placed at his location. The tracker follows: WC05 loses its FWF line; T0024 is 2 x FWF (1211968, 0164) at -27.983217,
153.426642; WC31's pin is -27.982533, 153.425151. Footer v10.82 -> v10.83.

    python3 patch_v1083.py page.html      (in place, on the live v10.82 page)
"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

U = '\\u00d7'
EDITS = [
 ('{"ref":"T0024","lines":[{"id":"T0024-FWF","kind":"fwf","label":"1 ' + U + ' FWF","qty":1}]}',
  '{"ref":"T0024","lines":[{"id":"T0024-FWF","kind":"fwf","label":"2 ' + U + ' FWF","qty":2}]}', 'v10.83 data: T0024 2 FWF'),
 (',{"id":"WC05-FWF","kind":"fwf","label":"1 ' + U + ' FWF","qty":1}', '', 'v10.83 data: WC05 no FWF'),
 (',{"id":"WC05-FWF","type":"FWF","kind":"fwf","label":"1 ' + U + ' FWF","qty":1,"nos":["0164"]}', '', 'v10.83 card: WC05 no FWF'),
 ('"pin":[-27.983217,153.426372],"lines":[{"id":"T0024-FWF","type":"FWF","kind":"fwf","label":"1 ' + U + ' FWF","qty":1,"nos":["1211968"]}',
  '"pin":[-27.983217,153.426642],"lines":[{"id":"T0024-FWF","type":"FWF","kind":"fwf","label":"2 ' + U + ' FWF","qty":2,"nos":["1211968","0164"]}', 'v10.83 card: T0024 2 FWF at EVL'),
 ('"pin":[-27.982469,153.425324],"lines":[{"id":"WC31-', '"pin":[-27.982533,153.425151],"lines":[{"id":"WC31-', 'v10.83 card: WC31 pin'),
]

def main():
    path = sys.argv[1]; t = open(path, encoding='utf-8').read()
    if '"nos":["1211968","0164"]' in t: sys.exit('patch_v1083 refuses a repeat')
    if "+ ' · v10.82'" not in t or '"pin":[-27.983217,153.426372]' not in t: sys.exit('patch_v1083 needs the live v10.82 page')
    for old, new, what in EDITS: t = rep(t, old, new, what, path)
    t = rep(t, "+ ' · v10.82'", "+ ' · v10.83'", 'footer', path)
    open(path, 'w', encoding='utf-8').write(t)
    print('patch_v1083 applied: 0164 on T0024 at EVL (2 FWF), WC05 back to block + tank, WC31 pin; footer v10.82 -> v10.83')

if __name__ == '__main__':
    main()
