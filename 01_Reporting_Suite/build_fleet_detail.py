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
import mybranch as MB
import mygear_intel as MI
import mygear_nav as nav
import mygear_thumbs as TH
import ownership as OWN
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
/*  NOT STICKY ANY MORE. The nav bar above it is the sticky one, and
    two things both pinned to top:0 in the same box means the second
    one sits UNDER the first - the orange title slid behind the BACK
    button the moment you scrolled. One sticky thing per page.
    (4 Aug 2026.)  */
.bar{background:#F26222;color:#fff;padding:14px 16px;display:flex;
 justify-content:space-between;align-items:center}
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
.asset.found{border-color:#EFFF3D;box-shadow:0 0 0 2px rgba(239,255,61,.28)}
.hit b{display:block;font-size:14px}
.hit span{color:#8794A6;font-size:12px}
.back{background:none;border:0;color:#1C9FAE;font-size:13px;font-weight:800;
 padding:0;cursor:pointer;font-family:inherit}
.foot{color:#4A5768;font-size:11px;text-align:center;padding:22px 16px 34px;
 letter-spacing:.4px}
/* ---- the product cards ------------------------------------------
   ONE SHAPE, MATCHING THE STORE BOARD. (Andrew, 3 Aug 2026, pointing
   at the stores board row: "this is now the size we go".)
   Landscape: square photo left at a fixed 132px, everything else
   right. Same as What's In The Store, so a store hand moving between
   the two screens is looking at the same object twice, not two
   different products. */
.cards{display:flex;flex-direction:column;gap:10px;margin-top:10px}
.card{background:#131A22;border:1px solid #263143;border-radius:16px;
 overflow:hidden;cursor:pointer;display:flex;flex-direction:row;
 align-items:stretch}
.card:hover{border-color:#3A4757}
.card .pic{position:relative;width:132px;flex:none;align-self:stretch;
 background:#0B111A;display:flex;align-items:center;justify-content:center;
 overflow:hidden;border-right:1px solid #1E2733}
.card .pic img{width:100%;height:100%;object-fit:cover;display:block}
/* NO PHOTO IS NOT A BROKEN TILE. A fleet with no thumbnail gets a
   lettered plate the same size as the photo, never a grey box and
   never a broken image icon. */
.card .pic .noimg{color:#3A4757;font-size:10px;font-weight:800;
 letter-spacing:1.4px;text-transform:uppercase;text-align:center;padding:0 8px}
.card .badge{position:absolute;top:8px;right:8px;background:#E2AE48;
 color:#241905;font-weight:800;font-size:13px;min-width:28px;height:26px;
 border-radius:8px;display:flex;align-items:center;justify-content:center;
 padding:0 7px}
.card .body{padding:11px 13px;display:flex;flex-direction:column;flex:1;
 min-width:0;justify-content:center}
/* TWO LINES, PINNED. Free-flowing titles made the rows 156, 174, 176,
   194 and 196 tall in the same list - the plate matched and the card
   still did not. Full name on hover and in the fleet header. */
.card h3{font-size:15.5px;font-weight:800;line-height:1.28;color:#F5F7FB;
 display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
 overflow:hidden;min-height:2.56em}
.card .sub{color:#6B7789;font-size:12px;margin-top:4px;white-space:nowrap;
 overflow:hidden;text-overflow:ellipsis}
.card .sub b{color:#F2B01E;font-weight:800;letter-spacing:.6px}
.card .vc{color:#4A5768;font-size:11px;letter-spacing:.5px;margin-top:2px;
 font-family:Consolas,'Courier New',monospace;overflow:hidden;
 text-overflow:ellipsis;white-space:nowrap}
.card .urow{display:flex;justify-content:space-between;align-items:baseline;
 margin-top:9px}
.card .urow em{font-style:normal;color:#8794A6;font-size:10px;font-weight:800;
 letter-spacing:1.3px;text-transform:uppercase}
.card .urow b{font-size:17px;font-weight:800}
/* THE LAST 18px. Two heights survived the pinned title - 176 and 194 -
   because this row wrapped whenever a fleet had excluded assets to
   name. One line, clipped, and every card in the list is identical. */
.card .foot2{display:flex;justify-content:space-between;align-items:center;
 gap:8px;margin-top:9px;color:#6B7789;font-size:12px;white-space:nowrap}
.card .foot2 span{overflow:hidden;text-overflow:ellipsis;min-width:0}
/* ---- RECOMMENDED NEXT ------------------------------------------ */
.rec{border:1px solid #1C9FAE;border-radius:16px;overflow:hidden;
 background:#101822;margin-top:10px}
.rec .tag{display:inline-block;background:#1C9FAE;color:#04222A;
 font-size:10px;font-weight:800;letter-spacing:1.4px;border-radius:20px;
 padding:5px 11px;margin:13px 0 0 13px}
.rec .in{padding:10px 14px 14px}
.rec h3{font-size:18px;font-weight:800;margin-top:6px}
.rec .item{color:#8794A6;font-size:13px;margin-top:3px;word-break:break-all;
 font-family:Consolas,'Courier New',monospace}
.rec ul{list-style:none;margin:10px 0 0}
.rec li{color:#C6D0DD;font-size:13px;margin-top:5px}
.rec .why{background:#0B131B;border:1px solid #22303F;border-radius:10px;
 padding:10px 12px;color:#8794A6;font-size:12.5px;margin-top:12px}
.rec .bc{background:#0B131B;border:1px solid #22303F;border-radius:10px;
 padding:12px;margin-top:10px;text-align:center}
.rec .bc b{display:block;font-size:20px;letter-spacing:3px;color:#F5F7FB;
 font-family:Consolas,'Courier New',monospace;word-break:break-all}
.rec .bc span{display:block;color:#6B7789;font-size:11px;margin-top:5px}
.tick{color:#52AC36;font-weight:800}
.cross{color:#FF6B5A;font-weight:800}
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
  var s = "<div class='" + klass + "' id='a-" + esc(assetKey(r.i))
    + "'><div class='n'>" + r.r + '</div>'
    + "<div class='b'><div class='t'><b>" + esc(r.i) + '</b>' + pill
    + '</div>';
  if(r.x){
    s += "<div class='m'><span class='dot' style='background:__EXCL__'></span>"
      + esc(r.w) + (r.D ? ' · ' + esc(r.D) + ' days' : '') + '</div>';
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
  /* THE SERIAL, when there is a genuine one. It rides beside the plant
     number because that is the pair anyone arguing about a machine
     needs: our name for it and the manufacturer's. Absent for the
     4,390 barcode-suffixed tooling assets, which do not have one. */
  if(r.sn) line.push('S/N ' + esc(r.sn));
  if(!r.O && r.d !== null && r.d !== undefined) line.push('idle ' + r.d + 'd');
  s += "<div class='s'>" + line.join(' · ') + '</div>';
  /* A branch flag on gear that is ALREADY OUT is a note, never an
     exclusion - a bloke is holding it. Worth saying, because the
     branch may want it back. */
  if(r.B) s += "<div class='s' style='color:__EXCL__'>Branch: "
    + esc(r.B) + '</div>';
  /* $0 IS NOT "EARNED NOTHING". Say whose invoice it is on, so a
     welder that has been out all week stops reading as dead weight. */
  if(r.S) s += "<div class='s' style='color:__LOW__'>" + esc(r.S)
    + '</div>';
  s += "<div class='bar2'>" + bar(r.s, r.b) + '<span>'
    + (r.s === null || r.s === undefined ? '-' : r.s.toFixed(0) + '%')
    + '</span></div>';
  return s + '</div></div>';
}

function showFleet(v){
  var f = D.fleets[v];
  if(!f) return;
  //  writing the hash re-fires route(); harmless, but skip the work
  //
  //  ENCODED, BOTH WAYS. Every product name in here has a space in it,
  //  and the browser percent-encodes a space the moment it goes in the
  //  address bar. route() then read the encoded string straight back,
  //  looked it up in D.fleets, found nothing and sent you to the list -
  //  so tapping a fleet opened the detail and bounced off it again in
  //  the same breath. Nothing on this page could be opened.
  //  (Found by clicking one. 4 Aug 2026.)
  if(hashNow() !== v) location.hash = encodeURIComponent(v);
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
  H.push(recommend(f));
  H.push("<h2>Alternatives &mdash; every asset in this fleet</h2>");
  H.push(f.rows.map(assetHtml).join(''));
  if(!f.rk){
    H.push("<div class='note'>No rack recorded for this fleet. SiteIQ "
      + 'does not carry a shelf location - add lines to RACKS.txt and '
      + 'they appear here.</div>');
  }
  el('view').innerHTML = H.join('');
  window.scrollTo(0, 0);
  /*  came in off a number? walk to that one and light it up, rather
      than dropping a bloke at the top of seventy-two rows and letting
      him hunt for the one he just typed  */
  if(JUMP){
    var j = JUMP; JUMP = null;
    setTimeout(function(){ jumpTo(j); }, 60);
  }
}

/* ONE PRODUCT, ONE CARD. Andrew's design, 2 Aug 2026: photo, how many
   we have, the utilisation with its bar, hires, and a word for the
   band. Money is not on it and cannot be - the counter build has no
   revenue in its payload at all. */
function card(r){
  var t = D.thumbs && D.thumbs[r.v];
  var pic = t
    ? "<img src='thumbs/" + esc(t) + "' alt='' loading='lazy'>"
    : "<div class='noimg'>" + esc(r.u || 'no photo yet') + '</div>';

  var chip = '';
  if(r.b === 'low') chip = "<span class='pill' style='background:#0E2E35;"
    + "color:__LOW__'>USE NEXT</span>";
  else if(r.b === 'high') chip = "<span class='pill' style='background:"
    + "#3A2110;color:__HIGH__'>HIGH USE</span>";
  else chip = "<span class='pill' style='background:#1B2430;color:#8794A6'>"
    + esc(r.w) + '</span>';
  var col = COL[r.b] || COL.none;
  return "<div class='card' data-v='" + esc(r.v) + "'>"
    + "<div class='pic'>" + pic + "<div class='badge'>" + r.a + '</div></div>'
    + "<div class='body'><h3 title='" + esc(r.n) + "'>" + esc(r.n)
    + '</h3>'
    + "<div class='sub'>&#128205; <b>" + esc((r.u || '').toUpperCase())
    + '</b> &middot; ' + r.rd + ' ready of ' + r.a + '</div>'
    + "<div class='vc'>" + esc(r.v) + '</div>'
    + "<div class='urow'><em>Utilisation</em><b style='color:" + col + "'>"
    + r.c.toFixed(0) + '%</b></div>'
    + bar(r.c, r.b)
    + "<div class='foot2'><span>" + r.cy + ' hire'
    + (r.cy === 1 ? '' : 's') + (r.ex ? ' · ' + r.ex + ' excluded' : '')
    + '</span>' + chip + '</div></div></div>';
}

/* NEXT TOOL UP - the recommendation, with its proof under it.
   The button does NOT say "issue". Nothing in this suite writes back
   to SiteIQ, and a button that implies it did would be a lie a store
   hand only finds out about later. It shows the barcode big enough to
   scan at the counter, and the issue still happens in SiteIQ. */
function recommend(f){
  var r = null, i;
  for(i = 0; i < f.rows.length; i++){ if(f.rows[i].u){ r = f.rows[i]; break; } }
  if(!r) return "<div class='note'>Nothing in this fleet can be issued "
    + 'right now - everything is out, or excluded and listed below.</div>';
  var s = "<div class='rec'><span class='tag'>RECOMMENDED NEXT</span>"
    + "<div class='in'><h3>" + esc(f.n) + '</h3>'
    + "<div class='item'>" + esc(r.i) + '</div><ul>';
  s += "<li><span class='tick'>&#10004;</span> Ready to hire</li>";
  if(r.k) s += "<li><span class='tick'>&#10004;</span> " + esc(r.k) + '</li>';
  s += '</ul>';
  s += "<div class='urow' style='display:flex;justify-content:space-between;"
    + "align-items:baseline;margin-top:12px'><em style='font-style:normal;"
    + "color:#8794A6;font-size:11px;font-weight:800;letter-spacing:1.4px'>"
    + "CLIENT-ISSUED UTILISATION</em><b style='font-size:19px;font-weight:800;"
    + "color:__LOW__'>" + (r.s === null || r.s === undefined ? '-'
      : r.s.toFixed(0) + '%') + '</b></div>';
  s += bar(r.s, r.b);
  var bits = [hires(r)];
  if(r.d !== null && r.d !== undefined) bits.push('idle ' + r.d + ' days');
  s += "<div class='note' style='margin-top:8px'>" + esc(bits.join(' · '))
    + '</div>';
  s += "<div class='why'>&#9432; Lowest-used asset in this product variant "
    + 'that can actually be issued today.</div>';
  if(r.bc) s += "<div class='bc'><b>" + esc(r.bc) + '</b>'
    + '<span>SCAN THIS AT THE COUNTER &mdash; the issue still happens '
    + 'in SiteIQ</span></div>';
  return s + '</div></div>';
}


/* ------------------------------------------------------------------
   FIND ONE ASSET, NOT A PRODUCT. (Andrew, 4 Aug 2026.)

   The search box only ever matched product names, so a storeman
   holding a machine with a number stuck to it - or a supervisor who
   had just read one off the crew screen - could type it in full and be
   told nothing matches. Every number is already in this page: the
   asset number, the barcode on the sticker, and the manufacturer's
   serial where there is a genuine one.

   Built once, on the first search, from the fleets already loaded.
------------------------------------------------------------------ */
function assetKey(v){
  return String(v == null ? '' : v).toUpperCase()
    .replace(/[^A-Z0-9]+/g, '');
}
var A_IDX = null;
function assetIdx(){
  if(A_IDX) return A_IDX;
  var ix = [];
  Object.keys(D.fleets).forEach(function(v){
    var f = D.fleets[v];
    (f.rows || []).forEach(function(r){
      ix.push({v: v, n: f.n, u: f.u, r: r,
               keys: [assetKey(r.i), assetKey(r.bc), assetKey(r.sn)]
                       .filter(function(k){ return k.length > 2; })});
    });
  });
  A_IDX = ix;
  return ix;
}
/*  EXACT FIRST, THEN CONTAINS. A bloke who types the whole number off
    a sticker wants that one asset, not forty that share a prefix. Only
    when nothing matches exactly does it widen - and a very short
    fragment is not widened at all, because "12" would drag half the
    store back.  */
function findAssets(q){
  var k = assetKey(q);
  if(k.length < 3) return [];
  var ix = assetIdx(), exact = [], part = [], i, j;
  for(i = 0; i < ix.length; i++){
    var hit = 0, near = 0;
    for(j = 0; j < ix[i].keys.length; j++){
      if(ix[i].keys[j] === k) hit = 1;
      else if(k.length >= 4 && ix[i].keys[j].indexOf(k) >= 0) near = 1;
    }
    if(hit) exact.push(ix[i]);
    else if(near) part.push(ix[i]);
  }
  return exact.length ? exact : part;
}
function assetHitHtml(a){
  var r = a.r, line = [];
  line.push(r.O ? 'In use' : 'Ready');
  if(r.O && r.h) line.push(esc(r.h) + (r.C ? ' · ' + esc(r.C) : ''));
  if(r.k) line.push(esc(r.k));
  if(r.sn) line.push('S/N ' + esc(r.sn));
  if(r.bc && r.bc !== r.i) line.push(esc(r.bc));
  return "<div class='hit' data-ai='" + esc(a.v) + "' data-ak='"
    + esc(assetKey(r.i)) + "'><b>" + esc(r.i) + '</b><span>'
    + esc(a.n) + ' · #' + r.r + ' of ' + (D.fleets[a.v].rows || []).length
    + ' · ' + line.join(' · ') + '</span></div>';
}
/*  which asset to walk to once its fleet is open  */
var JUMP = null;
function jumpTo(key){
  var el2 = document.getElementById('a-' + key);
  if(!el2) return;
  try{ el2.scrollIntoView({behavior: 'smooth', block: 'center'}); }
  catch(e){ el2.scrollIntoView(); }
  el2.classList.add('found');
  setTimeout(function(){ el2.classList.remove('found'); }, 2600);
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
  var av = findAssets(q);
  if(av.length){
    H.push("<h2 style='margin-top:4px'>" + (av.length === 1
      ? 'One asset with that number' : av.length + ' assets match that number')
      + '</h2>');
    H.push(av.slice(0, 24).map(assetHitHtml).join(''));
    if(av.length > 24)
      H.push("<div class='note'>" + (av.length - 24)
        + ' more. Type a bit more of the number to narrow it.</div>');
    if(hits.length) H.push("<h2>Products</h2>");
  }
  if(!hits.length && !av.length){
    H.push("<div class='note'>Nothing matches “" + esc(q)
      + '”. Try fewer words, part of the item description, or the '
      + 'number off the sticker.</div>');
  }
  H.push("<div class='cards'>" + hits.slice(0, 48).map(card).join('')
    + '</div>');
  if(hits.length > 48){
    H.push("<div class='note'>" + (hits.length - 48)
      + ' more. Type a bit more to narrow it.</div>');
  }
  el('view').innerHTML = H.join('');
}

/* Clicks are read off data- attributes, never out of an inline
   handler. A hirer called O'Brien has taken a page down before by
   riding an apostrophe straight through an onclick. */
document.addEventListener('click', function(ev){
  var a = ev.target.closest ? ev.target.closest('[data-ai]') : null;
  if(a){
    JUMP = a.getAttribute('data-ak');
    showFleet(a.getAttribute('data-ai'));
    return;
  }
  var h = ev.target.closest ? ev.target.closest('[data-v]') : null;
  if(h){ showFleet(h.getAttribute('data-v')); return; }
  var b = ev.target.closest ? ev.target.closest('[data-back]') : null;
  if(b){ el('q').value = ''; showList(''); }
});
el('q').addEventListener('input', function(){
  if(location.hash) location.hash = '';
  showList(el('q').value);
});
/* BACK HAS TO WORK. The hash is read on first load AND on every
   change, because on a phone Back is the main way out of a screen -
   and without this listener it did nothing at all: the hash moved,
   the page stayed on the fleet you were already looking at. Same
   fault made a shared #VARIANT link show whatever the last person
   had open. Found by opening two fleets in a row. */
/*  what the address bar actually says, in the words D.fleets uses  */
function hashNow(){
  var h = location.hash.slice(1);
  if(!h) return '';
  try{ return decodeURIComponent(h); }catch(e){ return h; }
}
function route(){
  var v = hashNow();
  if(v && D.fleets[v]){
    showFleet(v);
    /*  the bar names the fleet you are looking at, and BACK steps out
        of it - k2ViewOwn, not k2View, because the hash above is this
        page&rsquo;s own history entry and the bar must not push a
        second one on top of it  */
    if(typeof k2ViewOwn === 'function')
      k2ViewOwn(D.fleets[v].n, function(){ location.hash = ''; }, 'Fleet');
  } else {
    el('q').value = ''; showList('');
    if(typeof k2Home === 'function') k2Home();
  }
}
window.addEventListener('hashchange', route);
route();
""".replace('__LOW__', C_LOW).replace('__OK__', C_OK) \
   .replace('__HIGH__', C_HIGH).replace('__EXCL__', C_EXCL)


def _js_string(obj):
    """The payload as a JS STRING for JSON.parse, not an object literal.

    A 1.1 MB object literal has to go through the JavaScript parser,
    which is far slower than JSON.parse over the same bytes - it was
    2.2 seconds to first paint on a phone-class CPU. Same data, same
    file, a fraction of the wait.

    Double-encoded on purpose: the inner dumps makes the JSON, the
    outer one makes a correctly escaped JS string literal of it. The
    "</" guard stops a description containing that pair from closing
    the script tag early.
    """
    return json.dumps(json.dumps(obj)).replace('</', '<\\/')


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
                   'w': r['why'], 'h': r['holder'], 'C': r['holderCo'],
                   'k': r['rack'], 'd': r['idle'],
                   'bc': r['bc'], 'sn': r.get('serial') or '',
                   'B': r.get('branchNote') or '',
                   'D': r.get('branchDays') or '',
                   'S': r['streamLabel'] if r['billsElsewhere'] else ''}
            #  EMPTY IS NOT WORTH SENDING. Most assets have no rack, no
            #  branch note and no holder, and writing "k":"" on 4,853
            #  rows is bytes a phone has to download and parse to learn
            #  nothing. The reader already treats missing as absent.
            row = {k: v for k, v in row.items() if v not in ('', None)}
            #  flags only when true, same reason
            if r['excluded']:
                row['x'] = 1
            if r['out']:
                row['O'] = 1
            if r.get('useNext'):
                row['u'] = 1
            if with_money and not r.get('noMoney'):
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
                    'a': v['assets'], 'c': v['client'], 's': v['spread'],
                    'rd': v['ready'], 'cy': v['cycles'], 'ex': v['excluded'],
                    'b': v['band'], 'w': v['word']})
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
    #  THUMBNAILS, TOLD NOT ASKED. Only variants that actually have a
    #  file go in, so a card can never point at a picture that is not
    #  there. Empty picture tiles have been a fault on this suite
    #  before; a fleet with no photo gets a lettered plate instead.
    #  ONE NAMING, THE SUITE'S. This built its own _tsafe() and it
    #  turned every dot and space into an underscore, so it went looking
    #  for FORKLIFT2_5TDIESEL.jpg while the photo on the disk is called
    #  FORKLIFT2.5TDIESEL.jpg. 281 of 830 fleets differed - Andrew had
    #  the pictures the whole time and this file could not find them.
    #  mygear_thumbs.safe_name is what every other page in the suite
    #  uses and it is the only name allowed here now.
    tdir = os.path.join(BASE, 'Gear_Lookup', 'thumbs')
    try:
        TH.refresh(BASE, quiet=True)
    except Exception:
        pass
    have = set(os.listdir(tdir)) if os.path.isdir(tdir) else set()
    #  THE NORMALISED BRIDGE (Andrew, 3 Aug 2026: radios, monitors and
    #  radio batteries "all missing from Fleet area too"). Their fleet
    #  keys are plain names with spaces - 'Motorola DP4801e Two-Way
    #  Radio' - while the claimed photo on disk is the register code,
    #  MOTOROLADP4801ETWOWAYRADIO.jpg. Same picture, two spellings, so
    #  the match runs on letters-and-digits only, exact filename first.
    nhave = {}
    for fn in have:
        if fn.lower().endswith('.jpg'):
            nhave.setdefault(TH._norm(fn[:-4]), fn)
    thumbs, missing = {}, []
    for v in p['fleets']:
        fn = TH.safe_name(v) + '.jpg'
        if fn in have:
            thumbs[v] = fn
        else:
            nv = TH._norm(v)
            hit = nhave.get(nv)
            if hit is None:
                #  the family rule, fleet-side: 'Motorola DP4801e
                #  Two-Way Radio 871TNK7668' is one serialised unit of
                #  a fleet whose photo is the model shot - the code is
                #  a PREFIX of the fleet's normalised name. Same 12+
                #  character guard as alias_photos, same reason.
                for ns, fn2 in nhave.items():
                    if len(ns) >= 12 and nv.startswith(ns):
                        hit = fn2
                        break
            if hit:
                thumbs[v] = hit
            else:
                missing.append(v)
    p['thumbs'] = thumbs
    p['thumbsHave'] = len(thumbs)
    p['thumbsMissing'] = len(missing)
    build_one.missing = missing
    p['window'] = win
    p['store'] = 'Main Store'
    p['updated'] = (dt.date.fromisoformat(src_to).strftime('%d %b %Y')
                    if src_to else 'unknown')

    #  the way back. This page was reachable only by typing its file
    #  name for a day - built, pushed, and doorless (Andrew, 3 Aug
    #  2026: "no way for me to access how silly"). Never again: every
    #  page in Gear_Lookup names its neighbours.
    #
    #  4 Aug 2026: the three blue crumbs were at the very top of a
    #  1.1 MB list, so ten seconds of scrolling put every way off this
    #  page above the screen. They are now the standard bar - BACK,
    #  where you are, MENU - the same one on all four pages, and it
    #  stays put no matter how far down the list you are.
    head = (nav.bar('fleet', 'Fleet Details')
            + "<div class='bar'><h1>Fleet Details</h1>"
            "<span class='siq'>POWERED BY SITEIQ</span></div>")
    body = ["<div class='phone'>", head, "<div class='pad'>",
            "<input class='srch' id='q' type='search' "
            "placeholder='Product, item number or serial…' autocomplete='off'>",
            "<div id='view'></div>",
            "<div class='foot'>Cement Australia K2 Shutdown 2026 "
            "&middot; Gladstone<br>Author: Andrew Fisher &middot; "
            "data to " + _esc(p['updated'])]
    if with_money:
        body.append("<br>COATES INTERNAL &mdash; carries revenue")
    else:
        body.append("<br>No revenue on this screen")
    #  MENU had only the four page links on this page, so from deep
    #  inside a fleet there was nothing it could take you to ON this
    #  page - you had to scroll back to the top for the search box.
    _doors = [
        ("location.hash='';window.scrollTo(0,0)", "All fleets",
         "Back to the whole list", None),
        ("location.hash='';window.scrollTo(0,0);"
         "var q=document.getElementById('q');q.focus();q.select()",
         "Search a product", "Type a name or a word off the gear", None),
    ]
    body += ["</div></div></div>",
             nav.sheet('fleet', extra=_doors, extra_heading='On this page')]

    page = ("<!doctype html><html lang='en-AU'><head><meta charset='utf-8'>"
            "<meta name='viewport' content='width=device-width,"
            "initial-scale=1,viewport-fit=cover'>"
            "<title>Coates | Fleet Details</title>"
            "<style>" + CSS + nav.CSS + "</style></head><body>"
            + ''.join(body)
            #  The bar goes in FIRST and on its own. It is the way off
            #  this page, so it must work even if the 1.1 MB payload
            #  below it never parses.
            + "<script>" + nav.js('fleet', 'Fleet Details') + "</script>"
            + "<script>window.__FLEET__=JSON.parse(" + _js_string(p)
            + ");\n" + JS + "</script></body></html>")

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
    #  TRACKED GEAR CARRIES NO MONEY ANYWHERE - not on the counter copy,
    #  not on Andrew's copy, not as $0.00. Andrew, 2 Aug 2026: "anything
    #  that is coates that is 0 cost, don't tell the business these are
    #  0 cost, or to the client it's 0 cost. these are just tracked."
    #  This one is not about which folder the file lands in, so unlike
    #  the guard below it runs on every build.
    for v, fl in p['fleets'].items():
        for r in fl['rows']:
            if r.get('S') == OWN.STREAMS['COATES_TRACKED'][0] and '$' in r:
                raise SystemExit(
                    '\n  REFUSED TO WRITE {}\n'
                    '  Asset {} in fleet {} is Coates owned and tracked,\n'
                    '  and it is carrying a money figure ({!r}).\n'
                    '  Tracked gear is counted, not costed - not even as\n'
                    '  $0.00. Fix the builder.'
                    .format(os.path.basename(out_path), r.get('i'), v,
                            r['$']))

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
    #  WHO BILLS WHAT. Printed so a $0 fleet is never read as a dead
    #  fleet, and so the prefixes nothing could place get named rather
    #  than guessed at.
    #  PHOTOS: how many fleets have one, and how many do not. Andrew
    #  has a picture for everything, so a miss here is a NAMING miss,
    #  not a missing photo - which is exactly the fault this had.
    tdir = os.path.join(BASE, 'Gear_Lookup', 'thumbs')
    nthumb = len([f for f in os.listdir(tdir)
                  if f.lower().endswith('.jpg')]) if os.path.isdir(tdir) else 0
    fl = FD.variants(data)
    miss = [v for v in fl
            if not os.path.isfile(os.path.join(tdir,
                                               TH.safe_name(v['variant'])
                                               + '.jpg'))]
    print(' Photos       : {:,} thumbnail(s) in Gear_Lookup\\thumbs'
          .format(nthumb))
    print('                {:,} of {:,} fleets have one, {:,} do not'
          .format(len(fl) - len(miss), len(fl), len(miss)))
    if miss:
        print('                Every card is the same size whether it has a')
        print('                photo or not. These are the fleets with none -')
        print('                if you have the picture, it is a NAMING miss:')
        for v in miss[:10]:
            print('                  {:<34} {}'.format(
                TH.safe_name(v['variant'])[:34] + '.jpg', v['name'][:30]))
        if len(miss) > 10:
            print('                  ... and {:,} more'.format(len(miss) - 10))
    own = OWN.summary(data['assets'].values())
    print(' Billing      : item-number sequence(s) that never charge: {}'
          .format(', '.join(own['sequences']) or 'none found'))
    for r in own['streams']:
        print('                {:<22} {:>5,} assets, {:>4,} issued'
              .format(r['label'], r['assets'], r['issued']))
    if own['unknown']:
        print('                NOT PLACED - inside that sequence, charging')
        print('                nothing, and the barcode is not one this')
        print('                suite has been told about. Name these and')
        print('                they get labelled:')
        for u in own['unknown'][:8]:
            print('                  {:<18} {:>4,}  {}'.format(
                u['prefix'], u['assets'],
                ', '.join('{} {}'.format(k, v)
                          for k, v in sorted(u['units'].items(),
                                             key=lambda kv: -kv[1])[:2])))
    cov = MB.covers(list(data['assets']))
    if cov['known']:
        blocked = sum(1 for a in data['assets']
                      if MB.blocked(a)[0]
                      and data['assets'][a]['status'] != MI.OUT_STATUS)
        print(' Branch check : {:,} of {:,} assets are in the MyBranch export'
              .format(cov['known'], cov['total']))
        print('                {:,} of those cannot be issued - reserved, in'
              .format(blocked))
        print('                transfer, inspection pending - and are now')
        print('                excluded and labelled on the screen.')
        print('                The other {:,} have NO branch record. They are'
              .format(cov['total'] - cov['known']))
        print('                left as the store register has them, which is')
        print('                not the same as being checked and cleared.')
    else:
        print(' Branch check : no MyBranch export in Data_MyBranch\\, so')
        print('                reserved and inspection-pending gear cannot')
        print('                be spotted. The screen still builds.')
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
    _open_for_andrew(mine)
    print('')
    print(' Before the counter copy was written, its DATA was checked -')
    print(' no revenue on any asset, money flag off. Anything landing in')
    print(' Gear_Lookup gets that check whatever it was called with, so')
    print(' money cannot reach the store by flipping an argument.')
    return counter, mine




def _open_for_andrew(path):
    """Pop the finished page in the default browser - Windows only, and
    never when this builder was chained by 04 (a morning refresh must
    not open three browser tabs). Andrew, 3 Aug 2026: "where did this
    go" - a report nobody is shown may as well not exist.
    """
    import os as _os
    if _os.environ.get('K2_CHAINED'):
        return
    if hasattr(_os, 'startfile'):
        try:
            _os.startfile(path)
        except OSError:
            pass

if __name__ == '__main__':
    build()
