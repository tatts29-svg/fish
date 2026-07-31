#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | PHOTO HUNT - the wanted list for gear pictures
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  One row per product variant (and consumable SKU): the code a photo
#  must be named, what it is in plain English, how many items hide
#  behind it, and two search buttons that open in the normal browser -
#  the Coates site can't be trawled by a robot (their bot wall says
#  no, fair enough), but it opens happily for a person, so this page
#  does the searching and leaves only the clicking.
#
#  Save any picture into Photos\ under the shown name and the next
#  04 build shrinks it and puts it in My Gear. Rows with a photo
#  already in the folder show DONE - the hunt reads like a stocktake.
# =====================================================================
import datetime as dt
import html
import os
import sys
import urllib.parse

import mygear_thumbs

HERE = os.path.dirname(os.path.abspath(__file__))


def q(s):
    return urllib.parse.quote_plus(str(s))


def main():
    print('=' * 66)
    print(' COATES | PHOTO HUNT - the wanted list for gear pictures')
    print('=' * 66)
    reg = mygear_thumbs.variant_register(HERE)
    if not reg:
        print(' No RENTAL_STOCK / SALES_STOCK exports found - run the')
        print(' morning downloads first.')
        return 1
    have = set(mygear_thumbs._photo_files(HERE))
    safe = mygear_thumbs.safe_name
    total, done = len(reg), sum(1 for c in reg if safe(c) in have)
    print(' Variants & SKUs on the register : {}'.format(total))
    print(' Photos already in Photos\\       : {}'.format(done))

    def row(code, e):
        got = safe(code) in have
        name = e['n'] or code
        links = ('<a href="https://www.google.com/search?q={cq}" target="_blank">'
                 'Coates site</a>'
                 '<a href="https://www.google.com/search?tbm=isch&amp;q={iq}" '
                 'target="_blank">Images</a>').format(
            cq=q('site:coates.com.au ' + name), iq=q(name))
        return ('<tr class="{cls}"><td class="st">{st}</td>'
                '<td><b>{n}</b><span>{f} &middot; {q} on the register</span></td>'
                '<td><input class="fn" readonly value="{code}.jpg" '
                'onclick="this.select();try{{document.execCommand(&quot;copy&quot;);'
                'this.className=&quot;fn ok&quot;}}catch(e){{}}" '
                'title="Click to copy the filename"></td>'
                '<td class="lk">{links}</td></tr>').format(
            cls='done' if got else '', st='&#10003; DONE' if got else 'wanted',
            n=html.escape(name), f=html.escape(e['f'] or '?'), q=e['q'],
            code=html.escape(safe(code)), links=links)

    #  the big hitters first - most items behind one photo
    ordered = sorted(reg.items(), key=lambda kv: -kv[1]['q'])
    top = ordered[:60]
    fams = {}
    for code, e in sorted(reg.items(), key=lambda kv: (kv[1]['f'], -kv[1]['q'])):
        fams.setdefault(e['f'] or '?', []).append((code, e))

    secs = ('<div class="sec"><h2>The big hitters &mdash; one photo covers the '
            'most gear</h2><table>' + ''.join(row(c, e) for c, e in top)
            + '</table></div>')
    for f in sorted(fams):
        rows = fams[f]
        got = sum(1 for c, _e in rows if safe(c) in have)
        secs += ('<div class="sec"><h2>{f} <span>{g} of {t} collected</span></h2>'
                 '<table>'.format(f=html.escape(f), g=got, t=len(rows))
                 + ''.join(row(c, e) for c, e in rows) + '</table></div>')

    page = ('<!DOCTYPE html><html><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>Coates K2 - Photo Hunt</title><style>'
            'body{font-family:"Segoe UI",system-ui,Arial,sans-serif;background:#0E1116;'
            'color:#D7DBE2;margin:0;padding:24px}'
            '.hd{border-top:6px solid #F26222;padding-top:14px;margin-bottom:6px}'
            '.hd b{font-size:26px;color:#F26222;letter-spacing:-.5px}'
            '.hd span{color:#fff;font-size:14px;margin-left:8px}'
            '.meta{color:#8A94A2;font-size:12px;margin-bottom:14px}'
            '.prog{background:#171B22;border:1px solid #2A313C;border-radius:12px;'
            'padding:14px 18px;margin-bottom:18px;font-size:15px}'
            '.prog b{color:#EFFF3D;font-size:22px}'
            '.bar{height:12px;background:#20262e;border-radius:7px;overflow:hidden;margin-top:9px}'
            '.bar i{display:block;height:100%;background:linear-gradient(90deg,#F26222,#EFFF3D)}'
            '.sec{margin-bottom:18px}'
            '.sec h2{font-size:15px;color:#fff;border-left:4px solid #F26222;'
            'padding-left:9px;margin:18px 0 8px}'
            '.sec h2 span{color:#8A94A2;font-size:12px;font-weight:600;margin-left:8px}'
            'table{width:100%;border-collapse:collapse;font-size:13px}'
            'td{padding:7px 8px;border-bottom:1px solid #20262e;vertical-align:middle}'
            'td b{color:#fff;display:block}td span{color:#8A94A2;font-size:11px}'
            '.st{width:70px;color:#F5A623;font-size:11px;font-weight:800;'
            'text-transform:uppercase;white-space:nowrap}'
            'tr.done .st{color:#35D68A}tr.done td b{color:#8A94A2;text-decoration:none}'
            '.fn{width:230px;background:#171B22;border:1px solid #2A313C;color:#D7DBE2;'
            'border-radius:7px;padding:6px 9px;font-family:Consolas,monospace;font-size:12px}'
            '.fn.ok{border-color:#35D68A;color:#35D68A}'
            '.lk a{display:inline-block;background:#171B22;border:1px solid #2A313C;'
            'color:#D7DBE2;text-decoration:none;border-radius:8px;padding:5px 11px;'
            'font-size:12px;margin-left:6px;white-space:nowrap}'
            '.lk a:hover{border-color:#F26222;color:#fff}'
            '.foot{color:#6E7A8A;font-size:11px;text-align:center;padding:22px}'
            '</style></head><body>'
            '<div class="hd"><b>COATES</b><span>PHOTO HUNT &mdash; Cement Australia '
            'K2 &middot; Gladstone</span></div>'
            '<div class="meta">Built __ASAT__ &middot; POWERED BY SITEIQ &middot; '
            'Author: Andrew Fisher</div>'
            '<div class="prog"><b>__DONE__ of __TOTAL__</b> pictures collected'
            '<div class="bar"><i style="width:__PC__%"></i></div>'
            'Click a filename to copy it &middot; search &rarr; right-click the '
            'picture &rarr; Save image as &rarr; paste the name &rarr; save into '
            'the Photos folder next to this page &middot; run 04 and it appears '
            'in My Gear.</div>'
            + secs +
            '<div class="foot">One photo per variant covers every item behind it '
            '&middot; phone photos of the shelf work great &middot; jpg or png '
            '&middot; POWERED BY SITEIQ</div>'
            '</body></html>')
    #  token swap, never .format - the CSS is full of { } braces
    page = (page.replace('__ASAT__', dt.datetime.now().strftime('%d %b %Y - %H:%M'))
                .replace('__DONE__', str(done)).replace('__TOTAL__', str(total))
                .replace('__PC__', '{:.1f}'.format(100.0 * done / max(1, total))))

    out = os.path.join(HERE, 'Photo_Hunt.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(page)
    mygear_thumbs.photos_dir(HERE)
    print(' Wanted list : {}'.format(out))
    print('')
    print(' Open it, click a search button, save the picture into Photos\\')
    print(' under the shown filename, and run 04 - the picture appears in')
    print(' My Gear. The list re-ticks itself every time you run me.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
