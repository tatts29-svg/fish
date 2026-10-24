#!/usr/bin/env python3
"""Decode every QR the browser checks captured (drawer, run sheets, driver sheets) with OpenCV and compare each with
the URL it must open; decode the QR codes inside each printed run-sheet PDF too, and count its pages (one A4 each).
    python3 qr_decode819.py <SHOTS dir>"""
import json, os, sys, cv2, numpy as np
import pymupdf
D = sys.argv[1]; M = json.load(open(os.path.join(D, 'qr819.json')))
det = cv2.QRCodeDetector()
def decode(img):
    for scale in (1, 2, 3):
        im = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_NEAREST) if scale > 1 else img
        im = cv2.copyMakeBorder(im, 40, 40, 40, 40, cv2.BORDER_CONSTANT, value=(255, 255, 255))
        txt, _, _ = det.detectAndDecode(im)
        if txt: return txt
    return ''
import re
MPJ = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'meet_points_03Oct2026', 'meet_points.json')))
POINTS = {'%.6f,%.6f' % tuple(p['ll']) for p in MPJ['points']} | {'%.6f,%.6f' % tuple(MPJ['default']['ll'])}
FORM = re.compile(r'^https://www\.google\.com/maps/dir/\?api=1&destination=(-?\d+\.\d{6}),(-?\d+\.\d{6})&travelmode=driving$')
def exact(u):   # the exact form, 6 decimals, and the destination is one of the ten meet points
    m = FORM.match(u or ''); return bool(m) and (m.group(1) + ',' + m.group(2)) in POINTS
ok = bad = 0
for e in M:
    if 'file' not in e: continue
    got = decode(cv2.imread(e['file']))
    if got == e['want'] and exact(got): ok += 1
    else: bad += 1; print('MISMATCH', e['tag'], repr(got), '!=', e['want'], '' if exact(got) else '(not the exact meet point form)')
print(f'{ok} of {ok + bad} QR screenshots decode to exactly https://www.google.com/maps/dir/?api=1&destination=<lat6>,<lng6>&travelmode=driving for their meet point')
plan = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'meet_points_03Oct2026', 'event_portables_plan.json')))
pp = pb = 0
for e in M:
    if 'pdf' not in e: continue
    doc = pymupdf.open(e['pdf']); L = next(l for l in plan['loads'] if l['n'] == e['load'])
    want = [s['directions_url'] for s in L['stops']]
    pg = doc[0]; pix = pg.get_pixmap(dpi=300); img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR if pix.n == 3 else cv2.COLOR_RGBA2BGR)
    okm, texts, _, _ = cv2.QRCodeDetector().detectAndDecodeMulti(img)
    texts = sorted(t for t in (texts or []) if t)
    good = len(doc) == 1 and texts == sorted(want) and all(exact(x) for x in texts)
    print(('PASS' if good else 'FAIL'), f'run sheet PDF load {e["load"]}: {len(doc)} page(s), {len(texts)} of {len(want)} QR codes decoded from the paper and all match' if good else f'{len(doc)} pages, decoded {texts} want {want}')
    pp += good; pb += (not good)
print(f'{pp} of {pp + pb} printed run sheets are one A4 page whose QR codes all decode to their meet points')
sys.exit(1 if bad or pb or not ok else 0)
