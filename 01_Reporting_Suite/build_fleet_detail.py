#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | FLEET DETAILS - the screen - phone first
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Andrew's design, 2 Aug 2026. Search a product, get its whole fleet
#  ranked asset by asset, and see WHY one should go out before another.
#
#  ---------------------------------------------------------------
#  TWO BUILDS OFF ONE ENGINE. Andrew's call, 2 Aug 2026.
#  ---------------------------------------------------------------
#    Gear_Lookup\fleet.html          the counter. NO MONEY, ever.
#    Reports\<date>\Pages\...html    Andrew's. Money on.
#
#  His mock-up showed "1 hire . $240 revenue" on the counter screen and
#  his standing rule is that nothing on the store Wi-Fi carries money.
#  Both are honoured by building twice from the same sums rather than
#  by asking a template to remember - the money-free build never has
#  the numbers in it at all, so there is nothing to leak. Check it by
#  searching the served file for a dollar sign; there is a test below
#  that does exactly that and refuses to write if it finds one.
#
#  A counter hand does not need the revenue to know which one to grab.
#  The percentage, the hire count, the idle days and the rack carry the
#  whole decision.
#
#  Run it:  py build_fleet_detail.py     (or 68_FLEET_DETAILS)
# =====================================================================
import datetime as dt
import html
import io
import json
import os
import re

import fleet_detail as FD
import forecast as FC
import mygear_intel as MI
import racks as RK

BASE = os.path.dirname(os.path.abspath(__file__))

#  Validated on the card surface #131A22 (dark):
#    lightness band PASS . chroma floor PASS . contrast PASS
#    normal vision  PASS 17.0
#    CVD separation WARN 6.7 - legal because EVERY band carries a word
#                              as well as a colour. See FD.band().
C_LOW = '#1C9FAE'      # USE NEXT   - lowest used, grab this one
C_OK = '#52AC36'       # GOOD       - earning its keep, leave it alone
C_HIGH = '#C9550A'     # HIGH USE   - flogged, give it a rest
C_EXCL = '#FF6B5A'     # EXCLUDED   - status colour, never a band


def _esc(s):
    return html.escape('' if s is None else str(s), quote=True)


def _tsafe(v):
    return re.sub(r'[^A-Za-z0-9]+', '_', str(v or '')).strip('_')[:80]


CSS = """
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0D1218;color:#DCE3EC;font-family:'Segoe UI',Arial,sans-serif;
 font-size:15px;line-height:1.45;-webkit-text-size-adjust:100%}
.phone{max-width:520px;margin:0 auto;min-height:100vh;background:#0D1218}
.bar{background:#F26222;color:#fff;padding:14px 16px;display:flex;
 justify-content:space-between;align-items:center;position:sticky;top:0;z-index:9}
.bar h1{font-size:18px;font-weight:800;letter-spacing:-.2px}
.bar .siq{font-size:9px;letter-spacing:2px;font-weight:800;opacity:.85}
.pad{padding:14px 16px}
.code{color:#8794A6;font-size:12.5px;letter-spacing:.4px;margin-bottom:10px;
 word-break:break-all}
.chips{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px}
.chip{background:#161E28;border:1px solid #263143;border-radius:9px;
 padding:7px 11px;font-size:12.5px;color:#C6D0DD;white-space:nowrap}
.upd{color:#6B7789;font-size:11.5px;margin-bottom:14px}
.tiles4{display:grid;grid-template-columns:repeat(4,1fr);
 background:#131A22;border:1px solid #263143;border-radius:14px;overflow:hidden}
.tiles4 div{padding:12px 6px;text-align:center;border-right:1px solid #1E2733}
.tiles4 div:last-child{border-right:0}
.tiles4 b{display:block;font-size:23px;font-weight:800;line-height:1.1}
.tiles4 span{display:block;color:#8794A6;font-size:11px;margin-top:3px}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
.big{background:#131A22;border:1px solid #263143;border-radius:14px;padding:13px}
.big em{display:block;color:#8794A6;font-size:10.5px;letter-spacing:1.5px;
 font-style:normal;font-weight:800;text-transform:uppercase}
.big b{display:block;font-size:31px;font-weight:800;line-height:1.2;margin:2px 0 8px}
.big small{display:block;color:#6B7789;font-size:11px;margin-top:7px}
.track{height:8px;background:#0B111A;border:1px solid #263143;border-radius:5px;
 overflow:hidden;position:relative}
.track i{position:absolute;left:0;top:0;bottom:0;border-radius:5px}
.rot{background:#131A22;border:1px solid #1C9FAE;border-radius:14px;
 padding:13px 14px;margin-top:10px;display:flex;gap:12px;align-items:flex-start}
.rot .ic{width:34px;height:34px;border-radius:50%;border:2px solid #1C9FAE;
 color:#1C9FAE;display:flex;align-items:center;justify-content:center;
 font-size:17px;flex:0 0 auto}
.rot em{display:block;color:#1C9FAE;font-size:10.5px;letter-spacing:1.5px;
 font-style:normal;font-weight:800}
.rot p{color:#C6D0DD;font-size:13px;margin:3px 0 4px}
.rot b{font-size:15px}
h2{font-size:16px;font-weight:800;margin:20px 0 9px}
.asset{background:#131A22;border:1px solid #263143;border-radius:14px;
 padding:12px 13px;margin-bottom:9px;display:flex;gap:11px}
.asset.next{border-color:#1C9FAE}
.asset.use{border-color:#C9550A}
.asset.excl{opacity:.72}
.asset .n{width:21px;height:21px;border-radius:50%;border:1px solid #3A4757;
 color:#8794A6;font-size:11px;font-weight:800;display:flex;flex:0 0 auto;
 align-items:center;justify-content:center;margin-top:1px}
.asset .b{flex:1;min-width:0}
.asset .t{display:flex;justify-content:space-between;gap:8px;align-items:center}
.asset .t b{font-size:14px;font-weight:800;word-break:break-all}
.pill{font-size:10px;font-weight:800;letter-spacing:1.1px;border-radius:20px;
 padding:4px 9px;white-space:nowrap;flex:0 0 auto}
.asset .m{color:#8794A6;font-size:12.5px;margin-top:3px}
.asset .s{color:#8794A6;font-size:12.5px;margin-top:2px}
.dot{display:inline-block;width:8px;height:8px;border-radius:50%;
 margin-right:6px;vertical-align:0}
.asset .bar2{display:flex;align-items:center;gap:9px;margin-top:8px}
.asset .bar2 .track{flex:1}
.asset .bar2 span{font-size:12px;color:#C6D0DD;font-weight:800;min-width:34px;
 text-align:right}
.note{color:#6B7789;font-size:12px;margin-top:9px}
.warnbox{background:#2A1206;border:1px solid #7A3A12;border-radius:12px;
 padding:11px 13px;color:#FFD9CC;font-size:12.5px;margin:12px 0}
.srch{width:100%;background:#161E28;border:1px solid #263143;border-radius:11px;
 padding:12px 13px;color:#DCE3EC;font-size:15px;font-family:inherit}
.srch::placeholder{color:#6B7789}
.hit{background:#131A22;border:1px solid #263143;border-radius:12px;
 padding:11px 13px;margin-top:8px;cursor:pointer}
.hit b{display:block;font-size:14px}
.hit span{color:#8794A6;font-size:12px}
.back{background:none;border:0;color:#1C9FAE;font-size:13px;font-weight:800;
 padding:0;cursor:pointer;font-family:inherit}
.foot{color:#4A5768;font-size:11px;text-align:center;padding:22px 16px 34px;
 letter-spacing:.4px}
"""

JS = r"""
var D = window.__FLEET__, MONEY = !!D.money;
var el = function(id){ return document.getElementById(id); };
function esc(s){
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
var COL = {low:'__LOW__', ok:'__OK__', high:'__HIGH__', none:'#4A5768'};

/* '3 hires . 1 open' - never a bare 0 against gear that is out. The
   same wording the engine prints, so screen and print-out agree. */
function hires(r){
  if(!r.c && !r.o) return 'never issued';
  var b = [];
  if(r.c) b.push(r.c + ' hire' + (r.c === 1 ? '' : 's'));
  if(r.o) b.push(r.o + ' open');
  return b.join(' · ');
}
function bar(pct, cls){
  var w = Math.max(0, Math.min(100, pct || 0));
  /* A ZERO STILL DRAWS. At width:0 the bar vanished and a 0% row read
     as "no bar rendered" rather than "measured, and it is nothing" -
     which on this screen is the single most important row on the page.
     A 4px nub says the same thing the number says. */
  var css = w > 0 ? 'width:' + w.toFixed(1) + '%'
                  : 'width:4px;opacity:.75';
  return "<div class='track'><i style='" + css
    + ';background:' + (COL[cls] || COL.none) + "'></i></div>";
}
function assetHtml(r){
  var klass = 'asset' + (r.x ? ' excl' : (r.u ? ' next' : (r.O ? ' use' : '')));
  var pill = '';
  if(r.x) pill = "<span class='pill' style='background:#3A1512;color:"
    + '__EXCL__' + "'>EXCLUDED</span>";
  else if(r.O) pill = "<span class='pill' style='background:#3A2110;color:"
    + '__HIGH__' + "'>IN USE</span>";
  else if(r.u) pill = "<span class='pill' style='background:#0E2E35;color:"
    + '__LOW__' + "'>USE NEXT</span>";
  var s = "<div class='" + klass + "'><div class='n'>" + r.r + '</div>'
    + "<div class='b'><div class='t'><b>" + esc(r.i) + '</b>' + pill
    + '</div>';
  if(r.x){
    s += "<div class='m'><span class='dot' style='background:__EXCL__'></span>"
      + esc(r.w) + '</div>';
    s += "<div class='s'>Not included in utilisation</div>";
    return s + '</div></div>';
  }
  var mid = [];
  if(r.s !== null && r.s !== undefined) mid.push(r.s.toFixed(0) + '%');
  mid.push(hires(r));
  if(MONEY && r.$ !== undefined) mid.push('$' + Number(r.$)
    .toLocaleString('en-AU', {minimumFractionDigits:2,
                              maximumFractionDigits:2}));
  s += "<div class='m'>" + esc(mid.join(' · ')) + '</div>';

  var line = [];
  var col = r.O ? '__HIGH__' : '#52AC36';
  line.push("<span class='dot' style='background:" + col + "'></span>"
    + (r.O ? 'In use' : 'Ready'));
  if(r.O && r.h) line.push(esc(r.h) + (r.C ? ' · ' + esc(r.C) : ''));
  /* RACK ONLY WHEN IT IS KNOWN. SiteIQ carries no shelf, so an absent
     rack prints nothing at all - never a guess that walks a bloke to
     the wrong end of the store. */
  if(r.k) line.push(esc(r.k));
  if(!r.O && r.d !== null && r.d !== undefined) line.push('idle ' + r.d + 'd');
  s += "<div class='s'>" + line.join(' · ') + '</div>';
  s += "<div class='bar2'>" + bar(r.s, r.b) + '<span>'
    + (r.s === null || r.s === undefined ? '-' : r.s.toFixed(0) + '%')
    + '</span></div>';
  return s + '</div></div>';
}

function showFleet(v){
  var f = D.fleets[v];
  if(!f) return;
  location.hash = v;
  var H = [];
  H.push("<button class='back' data-back='1'>&#8592; All fleets</button>");
  H.push("<h2 style='margin-top:10px'>" + esc(f.n) + '</h2>');
  H.push("<div class='code'>product_variant · " + esc(v) + '</div>');
  H.push("<div class='chips'><span class='chip'>" + esc(D.window)
    + "</span><span class='chip'>" + esc(f.st || D.store)
    + "</span><span class='chip'>" + esc(f.u) + '</span></div>');
  H.push("<div class='upd'>Updated " + esc(D.updated) + '</div>');
  H.push("<div class='tiles4'>"
    + "<div><b style='color:__LOW__'>" + f.on + '</b><span>Onsite</span></div>'
    + "<div><b style='color:#52AC36'>" + f.rd + '</b><span>Ready</span></div>'
    + "<div><b style='color:__HIGH__'>" + f.iu + '</b><span>In use</span></div>'
    + "<div><b style='color:__EXCL__'>" + f.ex
    + '</b><span>Excluded</span></div></div>');
  H.push("<div class='pair'>"
    + "<div class='big'><em>Client-issued</em><b style='color:__LOW__'>"
    + f.cl.toFixed(0) + '%</b>' + bar(f.cl, 'low')
    + '<small>A crew signed for it</small></div>'
    + "<div class='big'><em>Commercial</em><b style='color:__HIGH__'>"
    + f.cm.toFixed(0) + '%</b>' + bar(f.cm, 'high')
    + '<small>On charge, whoever held it</small></div></div>');
  if(f.ex){
    /* PARENTHESES MATTER. Without them this is string + number -
       number, which is NaN, and the note read "divide by the NaN
       assets". Caught by opening a fleet that actually has an
       excluded asset in it. */
    H.push("<div class='note'>The two percentages divide by the "
      + (f.on - f.ex) + ' asset(s) that can actually be issued. '
      + f.ex + ' excluded asset(s) are listed below and are NOT '
      + 'in the denominator.</div>');
  }
  if(f.rot){
    H.push("<div class='rot'><div class='ic'>&#8635;</div><div>"
      + "<em>ROTATION OPPORTUNITY</em><p>One asset has " + f.rot.th
      + ' hire' + (f.rot.th === 1 ? '' : 's') + ' while another has only '
      + f.rot.lh + '.</p><b>Issue ' + esc(f.rot.li)
      + ' next</b></div></div>');
  }
  H.push("<h2>Individual assets</h2>");
  H.push(f.rows.map(assetHtml).join(''));
  if(!f.rk){
    H.push("<div class='note'>No rack recorded for this fleet. SiteIQ "
      + 'does not carry a shelf location - add lines to RACKS.txt and '
      + 'they appear here.</div>');
  }
  el('view').innerHTML = H.join('');
  window.scrollTo(0, 0);
}

function showList(q){
  location.hash = '';
  var all = D.list, s = (q || '').trim().toLowerCase();
  var hits = all;
  if(s){
    var words = s.split(/\s+/);
    hits = all.filter(function(r){
      var hay = (r.n + ' ' + r.v + ' ' + r.u).toLowerCase();
      return words.every(function(w){ return hay.indexOf(w) >= 0; });
    });
  }
  var H = [];
  if(!hits.length){
    H.push("<div class='note'>Nothing matches “" + esc(q)
      + '”. Try fewer words, or part of the item description.</div>');
  }
  H.push(hits.slice(0, 60).map(function(r){
    return "<div class='hit' data-v='" + esc(r.v) + "'><b>" + esc(r.n)
      + "</b><span>" + r.a + ' asset' + (r.a === 1 ? '' : 's') + ' · '
      + r.c.toFixed(0) + '% client-issued'
      + (r.s >= 2 ? ' · ' + r.s + ' hire spread' : '')
      + ' · ' + esc(r.u) + '</span></div>';
  }).join(''));
  if(hits.length > 60){
    H.push("<div class='note'>" + (hits.length - 60)
      + ' more. Type a bit more to narrow it.</div>');
  }
  el('view').innerHTML = H.join('');
}

/* Clicks are read off data- attributes, never out of an inline
   handler. A hirer called O'Brien has taken a page down before by
   riding an apostrophe straight through an onclick. */
document.addEventListener('click', function(ev){
  var h = ev.target.closest ? ev.target.closest('[data-v]') : null;
  if(h){ showFleet(h.getAttribute('data-v')); return; }
  var b = ev.target.closest ? ev.target.closest('[data-back]') : null;
  if(b){ el('q').value = ''; showList(''); }
});
el('q').addEventListener('input', function(){
  if(location.hash) location.hash = '';
  showList(el('q').value);
});
if(location.hash && D.fleets[location.hash.slice(1)]){
  showFleet(location.hash.slice(1));
} else {
  showList('');
}
""".replace('__LOW__', C_LOW).replace('__OK__', C_OK) \
   .replace('__HIGH__', C_HIGH).replace('__EXCL__', C_EXCL)


def payload(data, with_money):
    """Short keys - this carries every asset on the register and it is
    read on a phone over the store Wi-Fi."""
    fleets, lst = {}, []
    for v in FD.variants(data):
        f = FD.fleet(data, v['variant'], with_money=with_money)
        if not f:
            continue
        rows = []
        for r in f['rows']:
            row = {'r': r['rank'], 'i': r['item'], 's': r['score'],
                   'c': r['cycles'], 'o': r['open'], 'b': r['band'],
                   'x': r['excluded'], 'w': r['why'], 'O': r['out'],
                   'h': r['holder'], 'C': r['holderCo'], 'k': r['rack'],
                   'd': r['idle'], 'u': bool(r.get('useNext'))}
            if with_money:
                row['$'] = round(r.get('revenue') or 0.0, 2)
            rows.append(row)
        fl = {'n': f['name'], 'u': f['unit'], 'st': f['store'],
              'on': f['onsite'], 'rd': f['ready'], 'iu': f['inUse'],
              'ex': f['excluded'], 'cl': f['client'], 'cm': f['commercial'],
              'rk': f['racksKnown'], 'rows': rows}
        if f.get('rotation'):
            rt = f['rotation']
            fl['rot'] = {'ti': rt['topItem'], 'th': rt['topHires'],
                         'li': rt['lowItem'], 'lh': rt['lowHires']}
        fleets[v['variant']] = fl
        lst.append({'v': v['variant'], 'n': v['name'], 'u': v['unit'],
                    'a': v['assets'], 'c': v['client'], 's': v['spread']})
    return {'fleets': fleets, 'list': lst, 'money': bool(with_money)}


MONEY_RE = re.compile(r'\$\s?[\d,]+\.?\d*')


def build_one(data, with_money, out_path, today):
    src_to = data.get('sourceTo') or ''
    win = '{} – {}'.format(
        dt.date.fromisoformat(data['sourceFrom']).strftime('%d %b')
        if data.get('sourceFrom') else '?',
        dt.date.fromisoformat(src_to).strftime('%d %b')
        if src_to else '?')
    p = payload(data, with_money)
    p['window'] = win
    p['store'] = 'Main Store'
    p['updated'] = (dt.date.fromisoformat(src_to).strftime('%d %b %Y')
                    if src_to else 'unknown')

    head = ("<div class='bar'><h1>Fleet Details</h1>"
            "<span class='siq'>POWERED BY SITEIQ</span></div>")
    body = ["<div class='phone'>", head, "<div class='pad'>",
            "<input class='srch' id='q' type='search' "
            "placeholder='Search a product…' autocomplete='off'>",
            "<div id='view'></div>",
            "<div class='foot'>Cement Australia K2 Shutdown 2026 "
            "&middot; Gladstone<br>Author: Andrew Fisher &middot; "
            "data to " + _esc(p['updated'])]
    if with_money:
        body.append("<br>COATES INTERNAL &mdash; carries revenue")
    else:
        body.append("<br>No revenue on this screen")
    body += ["</div></div></div>"]

    page = ("<!doctype html><html lang='en-AU'><head><meta charset='utf-8'>"
            "<meta name='viewport' content='width=device-width,"
            "initial-scale=1,viewport-fit=cover'>"
            "<title>Coates | Fleet Details</title>"
            "<style>" + CSS + "</style></head><body>" + ''.join(body)
            + "<script>window.__FLEET__=" + json.dumps(p) + ";\n"
            + JS + "</script></body></html>")

    #  THE GUARD. Andrew's rule is that nothing on the store Wi-Fi
    #  carries money, and a rule nobody checks is a rule that breaks
    #  quietly.
    #
    #  TWO THINGS THIS GOT WRONG BEFORE, BOTH FOUND BY ATTACKING IT:
    #
    #  1. It keyed on `with_money`, the flag the CALLER passes. Flip one
    #     argument to True and revenue went straight into Gear_Lookup
    #     with the check agreeing, because it had been told this was the
    #     money build. The rule is about WHERE THE FILE GOES, so the
    #     destination decides - not the caller's intention.
    #
    #  2. It searched the finished HTML for a dollar figure. It can
    #     never find one. Revenue rides in the payload as a JSON number
    #     under the key "$", and the dollar SIGN is only ever produced
    #     at runtime by the JS. A regex over the source was checking for
    #     something that structurally cannot appear - a guard that looks
    #     like a guard and catches nothing, which is worse than none.
    #
    #  So it checks the DATA, before it is serialised: no revenue key on
    #  any row, and the money flag off. That is the thing that would
    #  actually reach a phone.
    served = os.path.normcase(os.path.join(BASE, 'Gear_Lookup'))
    on_wifi = os.path.normcase(os.path.abspath(out_path)).startswith(served)
    if on_wifi or not with_money:
        why = ('This file goes in Gear_Lookup, on the store Wi-Fi.'
               if on_wifi else 'This is the money-free build.')
        if p.get('money'):
            raise SystemExit(
                '\n  REFUSED TO WRITE {}\n  {}\n'
                '  Its payload is flagged as carrying money.\n'
                '  Fix the builder - do not relax this check.'
                .format(os.path.basename(out_path), why))
        for v, fl in p['fleets'].items():
            for r in fl['rows']:
                if '$' in r:
                    raise SystemExit(
                        '\n  REFUSED TO WRITE {}\n  {}\n'
                        '  Asset {} in fleet {} carries revenue {!r}.\n'
                        '  Fix the builder - do not relax this check and\n'
                        '  do not write the file somewhere else.'
                        .format(os.path.basename(out_path), why,
                                r.get('i'), v, r['$']))

    d = os.path.dirname(out_path)
    if d and not os.path.isdir(d):
        os.makedirs(d)
    with io.open(out_path, 'w', encoding='utf-8') as fh:
        fh.write(page)
    return len(page)


def build(today=None):
    today = today or dt.date.today()
    rental, txn = (FC._newest('RENTAL_STOCK*.xlsx'),
                   FC._newest('TRANSACTIONS*.xlsx'))
    if not rental or not txn:
        print('  No RENTAL_STOCK / TRANSACTIONS export found. Nothing built.')
        return
    data = MI.read(rental, txn, FC._newest('ON_HIRE*.xlsx'))
    made = RK.ensure_file()

    counter = os.path.join(BASE, 'Gear_Lookup', 'fleet.html')
    mine = os.path.join(BASE, 'Reports', today.isoformat(), 'Pages',
                        'Coates_K2_Fleet_Details_{}.html'
                        .format(today.isoformat()))
    n1 = build_one(data, False, counter, today)
    n2 = build_one(data, True, mine, today)

    fleets = FD.variants(data)
    rot = [v for v in fleets if v['spread'] >= 2]
    #  AN ASSET WITH NO PRODUCT VARIANT CANNOT APPEAR ON THIS SCREEN.
    #  The whole page is keyed on the variant, so there is nowhere to
    #  put them - counted and named here rather than quietly missing
    #  from a fleet a store hand thinks is complete.
    novar = sum(1 for a in data['assets'].values() if not a.get('variant'))
    print('=' * 66)
    print(' COATES | FLEET DETAILS')
    print('=' * 66)
    print('')
    print(' Fleets       : {:,} product variants, {:,} assets'.format(
        len(fleets), sum(v['assets'] for v in fleets)))
    print(' Rotation     : {:,} fleet(s) where one asset has been out at '
          'least'.format(len(rot)))
    print('                twice as often as the one nobody is touching')
    if novar:
        print(' NOT ON HERE  : {:,} asset(s) carry no PRODUCT_VARIANT, so they'
              .format(novar))
        print('                belong to no fleet and cannot be shown. They')
        print('                are on the intelligence page as a named gap.')
    print(' Racks        : {:,} recorded in RACKS.txt{}'.format(
        RK.count(), ' (just created - it is yours to fill in)' if made
        else ''))
    if not RK.count():
        print('                SiteIQ carries no shelf location, so no rack')
        print('                line shows anywhere until that file has '
              'entries.')
    print('')
    print(' Counter copy : {}  ({:,} KB, NO MONEY)'.format(
        counter, n1 // 1024))
    print(' Your copy    : {}  ({:,} KB, revenue on)'.format(mine, n2 // 1024))
    print('')
    print(' Before the counter copy was written, its DATA was checked -')
    print(' no revenue on any asset, money flag off. Anything landing in')
    print(' Gear_Lookup gets that check whatever it was called with, so')
    print(' money cannot reach the store by flipping an argument.')
    return counter, mine


if __name__ == '__main__':
    build()
