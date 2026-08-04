#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | WALK THE STORE - the shelf sheet
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  THE QUESTION THE APP CANNOT ANSWER.
#
#  "Have we got a 19mm air hose?" - My Gear answers that in one tap.
#  "Where is it?" - and the screen says the AISLE, because that is all
#  SiteIQ carries. It has no shelf, no bin, no rack. So the answer stops
#  one step short of the thing a storeman actually needs at the window,
#  and RACKS.txt - the only place a shelf can live - has nothing in it.
#
#  Nobody was ever going to fill in 1,073 lines at a keyboard. This is
#  the other way round: a sheet on a clipboard, in AISLE ORDER, so it
#  is one walk of the store and not a treasure hunt. Write the rack in
#  the box, hand it back, and 29_ADD_GEAR-style typing is the only
#  keyboard work left.
#
#  Print it in halves or bays - one storeman, one bay, ten minutes.
#
#  Run it:  py RACK_WALK_SHEET.py            (or 74_WALK_THE_STORE)
#           py RACK_WALK_SHEET.py "Rigging"  just that aisle
# =====================================================================
from __future__ import print_function

import datetime as dt
import html
import io
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def _esc(s):
    return html.escape('' if s is None else str(s), quote=True)


CSS = """
@page{size:A4 portrait;margin:11mm 10mm 12mm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;color:#111;font-size:10pt}
.hd{display:flex;align-items:flex-end;gap:12px;border-bottom:3px solid #F26222;
 padding-bottom:6px;margin-bottom:10px}
.hd h1{font-size:17pt;font-weight:800;flex:1;letter-spacing:-.3px}
.hd .m{text-align:right;font-size:8pt;color:#555;line-height:1.45}
.lead{background:#FFF3EC;border-left:4px solid #F26222;padding:8px 11px;
 font-size:9pt;line-height:1.5;margin-bottom:11px}
.lead b{color:#B4410F}
h2{font-size:11pt;font-weight:800;background:#1D1D1B;color:#fff;
 padding:5px 9px;margin:13px 0 0;border-radius:3px}
h2 span{float:right;font-weight:600;opacity:.75;font-size:8.5pt}
table{width:100%;border-collapse:collapse;margin-top:0}
th{background:#EDEFF2;font-size:7.5pt;letter-spacing:.6px;text-align:left;
 padding:4px 7px;border-bottom:1.5px solid #C8CDD4;text-transform:uppercase}
td{padding:5px 7px;border-bottom:1px solid #DFE3E8;font-size:9pt;
 vertical-align:middle}
tr:nth-child(even) td{background:#FAFBFC}
.n{font-weight:700}
.code{font-family:Consolas,monospace;font-size:7.5pt;color:#666;
 word-break:break-all}
.q{text-align:center;font-weight:800;width:34px}
.box{width:96px;border:1.6px solid #1D1D1B;border-radius:3px;height:22px;
 background:#fff}
.has{font-family:Consolas,monospace;font-size:8.5pt;font-weight:800;
 color:#0B7A3B}
.ft{margin-top:14px;border-top:1px solid #C8CDD4;padding-top:7px;
 font-size:7.5pt;color:#666;line-height:1.5}
@media print{h2{break-after:avoid}tr{break-inside:avoid}}
"""


def build(only=None):
    import mygear_store
    import forecast as FC
    import racks as RK

    #  the same two exports and the same master the store screen is
    #  built from, so the sheet can never list something the phone does
    #  not show or miss something it does
    rental = FC._newest('RENTAL_STOCK*.xlsx')
    sales = FC._newest('SALES_STOCK*.xlsx')
    if not rental:
        print('  No RENTAL_STOCK export found. Run the morning downloads')
        print('  (28_PULL_SITEIQ_EXPORTS), then me.')
        return 1
    master = None
    try:
        import master_equipment
        master = master_equipment.load(HERE)
    except Exception:
        pass
    data = mygear_store.read_availability(rental, sales, master)
    lines = list(data.get('hire') or []) + list(data.get('cons') or [])
    if not lines:
        print('  The store list came back empty. Run 04_RUN_MY_GEAR first.')
        return 1

    #  IN THE ORDER YOU WALK IT. Grouped by the aisle SiteIQ does know,
    #  then by name, so the sheet follows the shelves rather than making
    #  a bloke criss-cross the store ticking a spreadsheet's idea of
    #  alphabetical.
    bays = {}
    for it in lines:
        aisle = (it.get('u') or 'NO AISLE RECORDED').strip()
        if only and only.lower() not in aisle.lower():
            continue
        bays.setdefault(aisle, []).append(it)
    if not bays:
        print('  Nothing matches "{}". Aisles on this register:'.format(only))
        for a in sorted({(x.get('u') or '?').strip() for x in lines}):
            print('     ' + a)
        return 1

    done = todo = 0
    body = []
    for aisle in sorted(bays):
        rows = sorted(bays[aisle], key=lambda x: (x.get('n') or '').lower())
        have = sum(1 for r in rows
                   if RK.where('', '', (r.get('v') or '')))
        done += have
        todo += len(rows) - have
        body.append("<h2>{}<span>{} line(s) &middot; {} already "
                    "recorded</span></h2>".format(
                        _esc(aisle), len(rows), have))
        body.append('<table><tr><th>What it is</th><th>Code to type</th>'
                    '<th class="q">Qty</th><th>Rack / shelf</th></tr>')
        for r in rows:
            v = (r.get('v') or '').strip()
            cur = RK.where('', '', v)
            body.append(
                '<tr><td class="n">{n}</td><td class="code">{v}</td>'
                '<td class="q">{q}</td><td>{b}</td></tr>'.format(
                    n=_esc(r.get('n') or ''), v=_esc(v or '(no code)'),
                    q=r.get('q') or 0,
                    b=('<span class="has">' + _esc(cur) + '</span>')
                      if cur else '<div class="box"></div>'))
        body.append('</table>')

    today = dt.date.today().strftime('%d %b %Y')
    page = (
        "<!doctype html><html lang='en-AU'><head><meta charset='utf-8'>"
        "<title>Coates | Walk the store - shelf sheet</title>"
        "<style>" + CSS + "</style></head><body>"
        "<div class='hd'><h1>WALK THE STORE &mdash; where does it sit?</h1>"
        "<div class='m'><b>COATES</b> &middot; Cement Australia K2<br>"
        "Gladstone &middot; " + today + "<br>POWERED BY SITEIQ</div></div>"
        "<div class='lead'>SiteIQ does not carry a shelf or a bin, so this "
        "sheet is the only way the app can ever answer <b>&ldquo;where is "
        "it?&rdquo;</b> &mdash; the screen names the aisle today and stops "
        "there.<br>Walk the bay, write the rack in the box. Anything "
        "already recorded is printed in green &mdash; leave those alone "
        "unless they have moved.<br>Then type them into <b>RACKS.txt</b>, "
        "one per line, as <b>CODE | RACK</b> &mdash; and the next "
        "04_RUN_MY_GEAR puts the shelf on every phone in the store."
        "</div>"
        + ''.join(body) +
        "<div class='ft'>" + str(done + todo) + " line(s) on this sheet "
        "&middot; " + str(done) + " already recorded &middot; " + str(todo) +
        " still to write in.<br>Author: Andrew Fisher &middot; POWERED BY "
        "SITEIQ &middot; the shelf lives in RACKS.txt and an update never "
        "overwrites it.</div></body></html>")

    name = 'Walk_The_Store_{}{}.html'.format(
        dt.date.today().isoformat(),
        '_' + ''.join(c for c in only if c.isalnum()) if only else '')
    out = os.path.join(HERE, name)
    with io.open(out, 'w', encoding='utf-8') as fh:
        fh.write(page)
    print('=' * 64)
    print(' COATES | WALK THE STORE - the shelf sheet')
    print('=' * 64)
    print(' Lines on the sheet   : {:,}'.format(done + todo))
    print(' Shelf already known  : {:,}'.format(done))
    print(' Still to write in    : {:,}'.format(todo))
    print('')
    print(' Written to : ' + out)
    print('')
    print(' Open it, print it, walk the bay. Then type what you wrote')
    print(' into RACKS.txt as   CODE | RACK   and run 04_RUN_MY_GEAR.')
    print('')
    print(' One bay at a time:   py RACK_WALK_SHEET.py "Rigging"')
    return 0


if __name__ == '__main__':
    sys.exit(build(sys.argv[1] if len(sys.argv) > 1 else None))
