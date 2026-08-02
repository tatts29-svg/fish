#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | UTILISATION INTELLIGENCE - the page - INTERNAL ONLY
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Draws what mygear_intel.py computes. All the sums live there; this
#  file only ever formats them.
#
#  COATES INTERNAL. This page carries revenue per asset, so it goes to
#  Reports\<date>\Pages\ like the other internal reports - NEVER into
#  Gear_Lookup, never onto the store Wi-Fi, never into a client pack.
#  Same rule the fleet finder follows for cost and WDV.
#
#  Run it:  py build_utilisation_intel.py     (or 65_RUN_UTILISATION_INTEL)
# =====================================================================
import datetime as dt
import glob
import html
import io
import json
import os
import sys

import mygear_intel as MI

BASE = os.path.dirname(os.path.abspath(__file__))
ORANGE = '#F26222'


def _esc(s):
    return html.escape('' if s is None else str(s), quote=True)


def _newest(pattern):
    hits = [q for q in glob.glob(os.path.join(BASE, 'Data_SiteIQ', pattern))
            if not os.path.basename(q).startswith('~')]
    hits += [q for q in glob.glob(os.path.join(BASE, pattern))
             if not os.path.basename(q).startswith('~')]
    return max(hits, key=os.path.getmtime) if hits else None


def _tsafe(v):
    """The filename a thumbnail is stored under - matches the pages."""
    out = str(v)
    for ch in '/:*?"<>|':
        out = out.replace(ch, '_')
    return out


def _money(v):
    return '${:,.0f}'.format(v or 0)


def _bar(client, commercial):
    """The two utilisation bars, one above the other, same scale."""
    c = MI._pct(client, commercial) if commercial else 0.0
    return ("<div class='bars'>"
            "<div class='brow'><span class='bl'>COMMERCIAL</span>"
            "<span class='bt'><i class='com' style='width:100%'></i></span>"
            "<span class='bv'>{cd:,.0f} days</span></div>"
            "<div class='brow'><span class='bl'>CLIENT-ISSUED</span>"
            "<span class='bt'><i class='cli' style='width:{p:.1f}%'></i></span>"
            "<span class='bv'>{cl:,.0f} days &middot; {p:.0f}%</span></div>"
            "</div>").format(cd=commercial, cl=client, p=c)


CSS = """
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0A0E14;color:#DCE3EC;font-family:'Segoe UI',Arial,sans-serif;
 font-size:14px;line-height:1.5;padding:22px 18px 60px}
.wrap{max-width:1180px;margin:0 auto}
.mast{display:flex;justify-content:space-between;align-items:flex-start;
 gap:16px;border-bottom:1px solid #263143;padding-bottom:14px;margin-bottom:18px}
.mast h1{font-size:27px;color:#F5F7FB;font-weight:800;letter-spacing:-.4px}
.mast h1 b{color:#F26222}
.mast .sub{color:#8794A6;font-size:12px;margin-top:4px;letter-spacing:.4px}
.mast .rt{text-align:right;font-size:10px;font-weight:800;letter-spacing:2px;
 color:#6B7789;line-height:1.8}
.mast .rt .siq{color:#F26222}
.internal{display:inline-block;background:#7A2612;color:#FFD9CC;font-size:10px;
 font-weight:800;letter-spacing:1.6px;padding:4px 10px;border-radius:4px;
 margin-bottom:9px}
h2{font-size:11px;color:#6B7789;text-transform:uppercase;letter-spacing:2.4px;
 font-weight:800;margin:26px 0 10px;padding-top:14px;border-top:1px solid #1A2331}
h2 span{color:#F26222}
.lede{color:#8794A6;font-size:12.5px;margin:-4px 0 12px;max-width:80ch}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));gap:10px}
.tile{background:linear-gradient(160deg,#121A27,#0C121C);border:1px solid #263143;
 border-radius:14px;padding:13px 14px}
.tile .v{font-size:26px;font-weight:800;color:#F5F7FB;line-height:1.1}
.tile .v.org{color:#F26222}
.tile .v.grn{color:#35D68A}
.tile .l{font-size:9px;font-weight:800;letter-spacing:1.5px;color:#6B7789;
 margin-top:5px;text-transform:uppercase}
.tile .s{font-size:11px;color:#8794A6;margin-top:5px}
.panel{background:linear-gradient(160deg,#121A27,#0C121C);border:1px solid #263143;
 border-left:3px solid #F26222;border-radius:0 14px 14px 0;padding:14px 16px;
 margin:12px 0}
.bars{margin:6px 0}
.brow{display:flex;align-items:center;gap:11px;margin:7px 0}
.bl{width:118px;flex:none;font-size:9px;font-weight:800;letter-spacing:1.4px;
 color:#8794A6}
.bt{flex:1;height:15px;background:#0B111A;border:1px solid #263143;
 border-radius:8px;overflow:hidden}
.bt i{display:block;height:100%;border-radius:8px}
.bt i.com{background:linear-gradient(90deg,#3A4757,#5A6B80)}
.bt i.cli{background:linear-gradient(90deg,#FFA24D,#F26222)}
.bv{width:168px;flex:none;text-align:right;font-size:12px;color:#DCE3EC;
 font-weight:700}
table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12.5px}
th{text-align:left;font-size:9px;letter-spacing:1.3px;color:#6B7789;
 font-weight:800;padding:7px 8px;border-bottom:1px solid #263143;
 text-transform:uppercase;white-space:nowrap}
td{padding:8px;border-bottom:1px solid #161F2C;vertical-align:top}
tr:hover td{background:#111926}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
.vname{color:#F5F7FB;font-weight:700}
.vcode{color:#6B7789;font-size:10.5px;letter-spacing:.4px}
.call{display:inline-block;font-size:9px;font-weight:800;letter-spacing:1.1px;
 padding:3px 8px;border-radius:999px;white-space:nowrap}
.call.bring{background:rgba(255,90,77,.16);color:#FF8A7D}
.call.reduce{background:rgba(240,180,41,.15);color:#F0B429}
.call.trim{background:rgba(240,180,41,.10);color:#C69A2E}
.call.rot{background:rgba(242,98,34,.16);color:#FFA24D}
.call.right{background:rgba(53,214,138,.14);color:#35D68A}
.call.none{background:#1A2331;color:#8794A6}
.conf{font-size:9px;font-weight:800;letter-spacing:1px;color:#6B7789}
.conf.high{color:#35D68A}.conf.medium{color:#F0B429}.conf.low{color:#8794A6}
.job{display:flex;gap:12px;align-items:flex-start;padding:11px 13px;margin:7px 0;
 border:1px solid #263143;border-radius:12px;
 background:linear-gradient(160deg,#121A27,#0C121C)}
.job .tag{flex:none;width:104px;font-size:9px;font-weight:800;letter-spacing:1px;
 padding:5px 7px;border-radius:7px;text-align:center}
.job.act .tag{background:rgba(255,90,77,.16);color:#FF8A7D}
.job.money .tag{background:rgba(240,180,41,.15);color:#F0B429}
.job.rotate .tag{background:rgba(242,98,34,.16);color:#FFA24D}
.job.look .tag{background:#1A2331;color:#8794A6}
.job .w{font-size:13px;color:#F5F7FB;font-weight:600}
.job .d{font-size:11.5px;color:#8794A6;margin-top:3px}
.tools{display:flex;gap:9px;flex-wrap:wrap;margin:10px 0}
input.s{flex:1;min-width:230px;background:#0B111A;border:1px solid #2A3547;
 border-radius:11px;padding:11px 13px;color:#F5F7FB;font-size:14px;
 font-family:inherit}
input.s:focus{outline:none;border-color:#F26222}
button.f{background:#0B111A;border:1px solid #2A3547;border-radius:11px;
 padding:10px 13px;color:#8794A6;font-size:11px;font-weight:800;
 letter-spacing:1px;cursor:pointer;font-family:inherit}
button.f.on{background:#F26222;border-color:#F26222;color:#fff}
.rec{border:1px solid rgba(242,98,34,.45);border-radius:14px;padding:14px 16px;
 margin:9px 0;background:linear-gradient(135deg,rgba(242,98,34,.13),rgba(242,98,34,.02))}
.rec{display:flex;gap:14px;align-items:flex-start}
.rec .body{flex:1;min-width:0}
.thumb{flex:none;width:88px;height:88px;border-radius:12px;overflow:hidden;
 background:#1B2330;display:flex;align-items:center;justify-content:center}
.thumb img{width:100%;height:100%;object-fit:cover;display:block}
.thumb.mono{color:#8A97A8;font-weight:900;font-size:26px;letter-spacing:.5px}
.tth{flex:none;width:38px;height:38px;border-radius:9px;overflow:hidden;
 background:#1B2330;display:inline-flex;align-items:center;justify-content:center;
 vertical-align:middle;margin-right:9px}
.tth img{width:100%;height:100%;object-fit:cover;display:block}
.tth.mono{color:#8A97A8;font-weight:900;font-size:13px}
.vcell{display:flex;align-items:center;cursor:pointer}
#fleet tbody tr{cursor:pointer}
/* the per-asset panel */
.apanel{border:1px solid rgba(242,98,34,.45);border-radius:14px;margin:10px 0;
 background:linear-gradient(160deg,#121A27,#0C121C);overflow:hidden}
.apanel .ah{display:flex;justify-content:space-between;align-items:center;
 gap:12px;padding:12px 15px;border-bottom:1px solid #263143}
.apanel .ah b{font-size:16px;color:#F5F7FB}
.apanel .ah .x{cursor:pointer;color:#8794A6;font-weight:800;font-size:12px;
 letter-spacing:1px;border:1px solid #2A3547;border-radius:9px;padding:5px 11px}
.apanel .ah .x:hover{color:#F5F7FB;border-color:#F26222}
.arow{display:flex;gap:12px;align-items:center;padding:10px 15px;
 border-bottom:1px solid #161F2C}
.arow:last-child{border-bottom:0}
.arow:hover{background:#111926}
.arow .who{flex:1;min-width:0}
.arow .itm{font-size:13px;font-weight:700;color:#F5F7FB}
.arow .nm{font-size:12px;color:#FFA24D;font-weight:700;margin-top:2px}
.arow .nm span{color:#8794A6;font-weight:400}
.arow .sub{font-size:11px;color:#6B7789;margin-top:2px}
.arow .ub{flex:none;width:230px}
.arow .st{flex:none;width:74px;text-align:right;font-size:9px;font-weight:800;
 letter-spacing:1px}
.arow .st.o{color:#FFA24D}.arow .st.r{color:#35D68A}
.arow .st.a{color:#8794A6}.arow .st.x{color:#6B7789}
/* the per-asset utilisation bar - same language as the headline pair */
.ubar{height:9px;background:#0B111A;border:1px solid #263143;border-radius:5px;
 overflow:hidden;position:relative}
.ubar i{position:absolute;left:0;top:0;bottom:0;border-radius:5px}
.ubar i.com{background:#3A4757}
.ubar i.cli{background:linear-gradient(90deg,#FFA24D,#F26222)}
.ulab{font-size:10px;color:#8794A6;margin-top:3px;
 font-variant-numeric:tabular-nums}
.ulab b{color:#FFA24D}
.ulab i{font-style:normal;color:#6B7789}
@media (max-width:760px){
 .arow{flex-wrap:wrap}.arow .ub{width:100%;order:3}.arow .st{width:auto}}
.rec .h{font-size:9px;font-weight:800;letter-spacing:2px;color:#F26222}
.rec .a{font-size:21px;font-weight:800;color:#F5F7FB;margin:4px 0 2px}
.rec .loc{font-size:12px;color:#8794A6}
.rec .why{font-size:12px;color:#DCE3EC;margin-top:8px;padding-top:8px;
 border-top:1px solid #263143}
.rec .why b{color:#FFA24D}
.alt{font-size:12px;color:#8794A6;margin-top:7px}
.alt b{color:#DCE3EC}
.warn{background:rgba(255,90,77,.10);border:1px solid rgba(255,90,77,.4);
 border-radius:12px;padding:12px 14px;margin:12px 0;font-size:12.5px;
 color:#F6C4BD;line-height:1.65}
.warn b{color:#FF8A7D}
.limits{font-size:12px;color:#8794A6;line-height:1.75;margin-top:8px}
.limits li{margin-left:17px;margin-bottom:5px}
.ft{margin-top:34px;padding-top:14px;border-top:1px solid #263143;
 font-size:10.5px;color:#6B7789;display:flex;justify-content:space-between;gap:14px}
.ft .siq{color:#F26222;font-weight:800;letter-spacing:1.1px}
.none{color:#6B7789;font-size:12.5px;padding:10px 2px}
@media (max-width:760px){
 .bl{width:88px}.bv{width:112px;font-size:11px}
 table{font-size:11.5px}.job .tag{width:82px}
 .hidesm{display:none}}
"""

JS = r"""
var D = window.__INTEL__;

function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

/* WORD MATCH, not substring. The register writes a lead as
   "Extension Lead - 240V 10A", so a bloke typing "extension lead 240"
   found NOTHING on a plain indexOf - the dash was between his words.
   Every word he types has to appear somewhere in the haystack, in any
   order. Caught on the rig by typing what a human would type. */
/* THE COUNTER'S WORDS, NOT THE REGISTER'S. A bloke asks for a "gas
   monitor"; SiteIQ calls it a "Multi-Gas Detector", so an exact word
   match found NOTHING for the most safety-critical item in the store.
   These are the handful of pairs the store actually says out loud -
   not invented data, just two names for one thing. Keep it short: a
   loose synonym list is how a search starts returning the wrong tool. */
var SYN = [['monitor','detector'],['radio','handset','twoway','two-way']];
function alsoKnownAs(w){
  for (var i = 0; i < SYN.length; i++){
    if (SYN[i].indexOf(w) >= 0) return SYN[i];
  }
  return [w];
}
function hit(hay, q){
  hay = String(hay||'').toLowerCase();
  var w = q.split(/\s+/), i, j, alts, ok;
  for (i = 0; i < w.length; i++){
    if (!w[i]) continue;
    alts = alsoKnownAs(w[i]);
    ok = false;
    for (j = 0; j < alts.length; j++){
      if (hay.indexOf(alts[j]) >= 0){ ok = true; break; }
    }
    if (!ok) return false;
  }
  return true;
}

/* ---- THE PICTURE TILE ----------------------------------------------
   Told, not asked. D.thumbs holds only the variants that actually have
   a thumbnail, so anything else draws its two-letter monogram straight
   away. onerror is kept as the belt-and-braces landing. */
function mono(n){
  var w = String(n||'').split(/[^A-Za-z0-9]+/).filter(function(x){return x;});
  return ((w[0]||'?').charAt(0) + (w[1]||w[0]||'').charAt(0)).toUpperCase();
}
function tile(v, name, cls){
  var f = D.thumbs[v];
  if (!f) return '<span class="' + cls + ' mono">' + esc(mono(name)) + '</span>';
  return '<span class="' + cls + '"><img src="' + esc(D.thumbBase)
    + encodeURIComponent(f) + '.jpg" loading="lazy" alt="" data-m="'
    + esc(mono(name)) + '" onerror="tfail(this)"></span>';
}
function tfail(img){
  var s = img.parentNode;
  s.className += ' mono';
  s.textContent = img.getAttribute('data-m') || '?';
}

/* ---- WHO HAS IT, AND HOW HARD IT HAS WORKED --------------------------
   Open a variant and every asset in it is listed: the ones that are OUT
   first with the name and company holding them, then the rest longest-
   worked first. Each carries its own two-bar utilisation on the same
   scale as the headline pair - the steel bar is commercial days, the
   orange is the share of those days it was in a named hirer's hands.

   The denominator is days since the shutdown started, because arrival
   dates are not exported. An asset that landed late therefore reads
   lower than it deserves, and the limits at the foot of the page say
   so rather than the bar pretending otherwise. */
var OPEN = null;
function ubar(cd, md){
  var span = D.daysIn || 1;
  var m = Math.min(100, 100 * md / span), c = Math.min(100, 100 * cd / span);
  return '<div class="ubar"><i class="com" style="width:' + m.toFixed(1)
    + '%"></i><i class="cli" style="width:' + c.toFixed(1) + '%"></i></div>'
    + '<div class="ulab"><b>' + cd.toFixed(1) + 'd client-issued</b> of '
    + md.toFixed(1) + 'd on charge <i>&middot; ' + span + 'd shutdown</i></div>';
}
/* GROUPED BY NAME, because you chase a bloke, not a description - the
   same rule the hit list follows. One visit clears a name, so one line
   should carry it however many he has. */
function byHolder(rows){
  var g = {}, order = [], i, k;
  for (i = 0; i < rows.length; i++){
    k = rows[i].h || 'not recorded';
    if (!g[k]){ g[k] = {n: 0, co: rows[i].c, d: 0}; order.push(k); }
    g[k].n++;
    if (rows[i].d != null && rows[i].d > g[k].d) g[k].d = rows[i].d;
  }
  order.sort(function(a, b){ return g[b].n - g[a].n || g[b].d - g[a].d; });
  var out = order.slice(0, 6).map(function(k){
    return '<b>' + esc(k) + '</b>' + (g[k].n > 1 ? ' &times;' + g[k].n : '')
      + (g[k].co ? ' (' + esc(g[k].co) + ')' : '')
      + (g[k].d ? ' &middot; ' + g[k].d + 'd' : '');
  }).join(' &middot; ');
  if (order.length > 6) out += ' &middot; and ' + (order.length - 6) + ' more';
  return out;
}
function statusWord(s){
  return s === 'o' ? 'ON HIRE' : s === 'r' ? 'ON SHELF'
       : s === 'a' ? 'ARRIVING' : 'OTHER';
}
function openVariant(code){
  if (OPEN === code){ closeVariant(); return; }
  OPEN = code;
  var v = null, i;
  for (i = 0; i < D.variants.length; i++){
    if (D.variants[i].variant === code){ v = D.variants[i]; break; }
  }
  var rows = D.assets[code] || [];
  var out = rows.filter(function(r){ return r.s === 'o'; }).length;
  var h = '<div class="apanel"><div class="ah"><b>'
    + esc((v && (v.name || v.variant)) || code) + '</b>'
    + '<span class="vcode">' + rows.length + ' asset(s) &middot; ' + out
    + ' out now</span>'
    + '<span class="x" onclick="closeVariant()">CLOSE</span></div>';
  if (!rows.length) h += '<div class="none" style="padding:12px 15px">'
    + 'No assets on the register for this variant.</div>';
  /* THE INTERESTING ROWS FIRST, AND THE REST BEHIND A LINE. 86 leads
     with 73 that have never moved renders as a wall of identical rows
     and the 13 you actually wanted get lost in it. Out first, then
     anything with history, then ONE line for the untouched - which is
     itself the useful fact about them. Never silently dropped. */
  var live = rows.filter(function(r){
    return r.s === 'o' || r.cy > 0 || r.md > 0; });
  var idle = rows.filter(function(r){
    return !(r.s === 'o' || r.cy > 0 || r.md > 0); });
  var CAP = 200;
  live.slice(0, CAP).forEach(function(r){
    h += '<div class="arow"><div class="who">'
      + '<div class="itm">' + esc(r.i) + '</div>'
      + (r.s === 'o'
          ? '<div class="nm">' + esc(r.h || 'holder not recorded')
            + (r.c ? ' <span>&middot; ' + esc(r.c) + '</span>' : '')
            + (r.d != null ? ' <span>&middot; ' + r.d + ' day'
               + (r.d === 1 ? '' : 's') + ' out</span>' : '') + '</div>'
          : '')
      + '<div class="sub">' + esc(r.u) + ' &middot; ' + r.cy + ' hire cycle'
      + (r.cy === 1 ? '' : 's')
      + (r.s !== 'o' && r.dl != null ? ' &middot; idle ' + r.dl + ' days'
         : (r.s !== 'o' ? ' &middot; not issued yet' : ''))
      + ' &middot; ' + (r.p ? 'revenue PENDING' : '$' + r.rv.toFixed(0))
      + '</div></div>'
      + '<div class="ub">' + ubar(r.cd, r.md) + '</div>'
      + '<div class="st ' + r.s + '">' + statusWord(r.s) + '</div></div>';
  });
  if (live.length > CAP){
    h += '<div class="none" style="padding:10px 15px">Showing the first '
      + CAP + ' of ' + live.length + ' with history.</div>';
  }
  if (idle.length){
    h += '<div class="arow" style="cursor:pointer" onclick="showIdle()">'
      + '<div class="who"><div class="itm">' + idle.length
      + ' more have never been issued this shutdown</div>'
      + '<div class="sub">All on the shelf, no hire cycles, no charge '
      + 'against them &mdash; tap to list them</div></div>'
      + '<div class="st r">SHOW</div></div>'
      + '<div id="idlelist" style="display:none">';
    idle.slice(0, 400).forEach(function(r){
      h += '<div class="arow"><div class="who">'
        + '<div class="itm">' + esc(r.i) + '</div>'
        + '<div class="sub">' + esc(r.u) + ' &middot; never issued</div>'
        + '</div><div class="ub">' + ubar(r.cd, r.md) + '</div>'
        + '<div class="st ' + r.s + '">' + statusWord(r.s) + '</div></div>';
    });
    if (idle.length > 400){
      h += '<div class="none" style="padding:10px 15px">Showing the first '
        + '400 of ' + idle.length + '.</div>';
    }
    h += '</div>';
  }
  h += '</div>';
  var box = document.getElementById('vpanel');
  box.innerHTML = h;
  box.scrollIntoView({block: 'nearest'});
}
function showIdle(){
  var el = document.getElementById('idlelist');
  if (el) el.style.display = (el.style.display === 'none' ? 'block' : 'none');
}
function closeVariant(){
  OPEN = null;
  document.getElementById('vpanel').innerHTML = '';
}

/* ---- the fleet table filter ---- */
var CALLF = 'all';
function fleet(){
  var q = (document.getElementById('fq').value||'').trim().toLowerCase();
  var rows = D.variants.filter(function(v){
    if (CALLF !== 'all' && v.call !== CALLF) return false;
    if (!q) return true;
    return hit((v.name||'') + ' ' + (v.variant||'') + ' ' + (v.family||''), q);
  });
  var CAP = 120;
  var shown = rows.slice(0, CAP);
  var h = '<table><thead><tr><th>Variant</th><th class="n">Fleet</th>'
    + '<th class="n">Ready</th><th class="n">Out</th>'
    + '<th class="n hidesm">Never</th><th class="n">Peak</th>'
    + '<th class="n">Recommend</th><th>Call</th>'
    + '<th class="hidesm">Confidence</th></tr></thead><tbody>';
  shown.forEach(function(v){
    h += '<tr data-v="' + esc(v.variant) + '"><td><div class="vcell">'
      + tile(v.variant, v.name || v.variant, 'tth')
      + '<div><div class="vname">' + esc(v.name || v.variant) + '</div>'
      + '<div class="vcode">' + esc(v.variant)
      + (v.units && v.units.length ? ' &middot; ' + esc(v.units[0][0]) : '')
      + '</div></div></div></td>'
      + '<td class="n">' + v.assets + '</td>'
      + '<td class="n">' + v.ready + '</td>'
      + '<td class="n">' + v.out + '</td>'
      + '<td class="n hidesm">' + v.neverIssued + '</td>'
      + '<td class="n">' + v.peak + '</td>'
      + '<td class="n"><b>' + v.recommended + '</b>'
      + (v.surplus ? '<div class="vcode">' + v.surplus + ' spare</div>' : '')
      + (v.short ? '<div class="vcode">' + v.short + ' short</div>' : '')
      + '</td>'
      + '<td><span class="call ' + callCls(v.call) + '">' + esc(v.call)
      + '</span></td>'
      + '<td class="hidesm"><span class="conf ' + v.confidence + '">'
      + v.confidence.toUpperCase() + '</span><div class="vcode">'
      + esc(v.why) + '</div></td></tr>';
  });
  h += '</tbody></table>';
  /* A CUT LIST SAYS SO. Silently showing 120 of 400 reads as "that is
     everything", which is how a fleet decision gets made on a third of
     the fleet. */
  if (rows.length > CAP) {
    h += '<div class="none">Showing the first ' + CAP + ' of ' + rows.length
       + ' &mdash; narrow the search to see the rest.</div>';
  }
  if (!rows.length) h = '<div class="none">Nothing matches that.</div>';
  document.getElementById('fleet').innerHTML = h;
  document.getElementById('fcount').textContent =
    rows.length + ' variant' + (rows.length === 1 ? '' : 's');
}
function callCls(c){
  return c === 'BRING MORE' ? 'bring'
       : c === 'REDUCE NEXT TIME' ? 'reduce'
       : c === 'TRIM' ? 'trim'
       : c === 'ROTATE STOCK' ? 'rot'
       : c === 'RIGHT-SIZED' ? 'right'
       : c === 'FULLY DEPLOYED' ? 'trim' : 'none';
}
function setCall(c, el){
  CALLF = c;
  var b = document.querySelectorAll('#callf button');
  for (var i = 0; i < b.length; i++) b[i].className = 'f';
  el.className = 'f on';
  fleet();
}

/* ---- NEXT TOOL UP ---- */
function nextUp(){
  var q = (document.getElementById('nq').value||'').trim().toLowerCase();
  var box = document.getElementById('nextup');
  if (q.length < 2){
    box.innerHTML = '<div class="none">Type two letters of a tool, an item '
      + 'number or a barcode.</div>';
    return;
  }
  var hits = D.variants.filter(function(v){
    return hit((v.name||'') + ' ' + (v.variant||''), q);
  });
  /* an item number or barcode typed straight in */
  if (!hits.length && D.lookup[q]) hits = D.variants.filter(function(v){
    return v.variant === D.lookup[q]; });
  if (!hits.length){
    box.innerHTML = '<div class="none">Nothing in the register matches that. '
      + D.noVariant + ' asset(s) carry no product variant in any export and '
      + 'cannot be compared with anything, so they are never recommended.'
      + '</div>';
    return;
  }
  var h = '';
  hits.slice(0, 3).forEach(function(v){
    var list = D.rank[v.variant] || [];
    if (!list.length){
      /* NOTHING ON THE SHELF IS WHEN YOU MOST NEED THE NAMES. The old
         card said "nothing available" and stopped, which leaves the
         counter with a dead end. Now it says who has them, longest
         held first, so the next move is a phone call. */
      var held = (D.assets[v.variant] || []).filter(function(r){
        return r.s === 'o'; });
      h += '<div class="rec">' + tile(v.variant, v.name || v.variant, 'thumb')
        + '<div class="body"><div class="h">' + esc(v.name || v.variant)
        + '</div><div class="a">Nothing on the shelf</div>'
        + '<div class="loc">' + v.assets + ' in the fleet, ' + v.out
        + ' out, ' + v.ready + ' showing available.</div>'
        + (held.length ? '<div class="why">Held by: ' + byHolder(held) + '</div>'
                       : '')
        + '</div></div>';
      return;
    }
    var a = list[0];
    h += '<div class="rec">' + tile(v.variant, v.name || v.variant, 'thumb')
      + '<div class="body"><div class="h">RECOMMENDED NEXT &mdash; '
      + esc(v.name || v.variant) + '</div>'
      + '<div class="a">' + esc(a.item) + '</div>'
      + '<div class="loc">' + esc(a.store || 'store not recorded')
      + ' &middot; ' + esc(a.unit) + '</div>'
      + '<div class="why">Why: <b>'
      + (a.never ? 'never issued this shutdown'
                 : 'lowest client-issued time in this variant') + '</b>'
      + ' &middot; ' + a.cycles + ' hire cycle' + (a.cycles === 1 ? '' : 's')
      + ' &middot; client-issued ' + a.clientDays.toFixed(1) + ' days'
      + ' &middot; ' + (a.idle == null ? 'not issued yet'
                                       : 'idle ' + a.idle + ' days')
      + ' &middot; ' + (a.pending ? 'revenue PENDING' : '$' + a.revenue.toFixed(0))
      + '</div>';
    if (list.length > 1){
      h += '<div class="alt">Then: ' + list.slice(1).map(function(x){
        return '<b>' + esc(x.item) + '</b>';
      }).join(' &middot; ') + '</div>';
    }
    h += '</div></div>';
  });
  box.innerHTML = h;
}
document.addEventListener('DOMContentLoaded', function(){
  fleet();
  nextUp();
  /* delegated, so it survives every re-render of the table */
  document.getElementById('fleet').addEventListener('click', function(e){
    var tr = e.target;
    while (tr && tr.nodeName !== 'TR') tr = tr.parentNode;
    if (tr && tr.getAttribute('data-v')) openVariant(tr.getAttribute('data-v'));
  });
});
"""


def build(today=None):
    today = today or dt.date.today()
    rental = _newest('RENTAL_STOCK*.xlsx')
    txn = _newest('TRANSACTIONS*.xlsx')
    onhire = _newest('ON_HIRE*.xlsx')
    if not rental:
        print('PROBLEM: no RENTAL_STOCK export found. Pull it from SiteIQ, '
              'drop it in Data_SiteIQ and run again.')
        return 1
    if not txn:
        print('  NOTE: no TRANSACTIONS export - fleet peaks, hire cycles and '
              'revenue cannot be worked out without it. Building the stock '
              'picture only.')

    d = MI.read(rental, txn, onhire, today=today)
    if not d:
        print('PROBLEM: the RENTAL_STOCK export has no rows to read.')
        return 1
    fleets = MI.ready_fleets(d)
    jobs = MI.integrity(d, fleets)
    t, j = d['totals'], d['join']

    #  what the page needs client-side, and NOT the whole asset register -
    #  5337 assets of raw detail would treble the file for no gain
    rank = {}
    for v in d['variants']:
        top = MI.rank(d, v['variant'], limit=4)
        if top:
            rank[v['variant']] = [{
                'item': a['item'], 'store': a['store'], 'unit': a['unit'],
                'cycles': a['cycles'], 'clientDays': round(a['clientDays'], 2),
                'idle': a['idleDays'], 'revenue': round(a['revenue'], 2),
                'never': a['neverIssued'], 'pending': a['pendingRevenue'],
            } for a in top]
    lookup = {}
    for a in d['assets'].values():
        if a['variant']:
            lookup[a['item'].lower()] = a['variant']
            if a['bc']:
                lookup[a['bc'].lower()] = a['variant']

    #  PICTURES. Same thumbnails the crew pages serve and the same rule:
    #  the page is TOLD what exists rather than finding out by 404, so a
    #  variant with no photo draws its monogram and asks for nothing.
    #  This page lives in Reports\<date>\Pages\, three deep, so the
    #  thumbs are reached back up the tree. If that path is ever wrong
    #  the onerror fallback still lands on the monogram - a wrong path
    #  costs a picture, never a hole.
    tdir = os.path.join(BASE, 'Gear_Lookup', 'thumbs')
    have = set()
    if os.path.isdir(tdir):
        have = {f[:-4] for f in os.listdir(tdir) if f.lower().endswith('.jpg')}
    thumbs = {}
    for v in d['variants']:
        sn = _tsafe(v['variant'])
        if sn in have:
            thumbs[v['variant']] = sn
    #  EVERY ASSET, BY VARIANT. (Andrew, 2 Aug 2026: "can i see who its
    #  onhire to and company.. what are we doing about a utilisation bar
    #  on eqch asset".) Both answers live in one place - open a variant
    #  and you get its assets, who holds each one, and each one's own
    #  two-bar utilisation. Short keys because this is 5,337 rows.
    #    i item  s status  h holder  c company  d days out  u unit
    #    cd client days  md commercial days  cy cycles  rv revenue
    #    dl idle days  p revenue pending
    ST = {MI.READY_STATUS: 'r', MI.OUT_STATUS: 'o', 'Awaiting Arrival': 'a'}
    by_variant = {}
    for a in d['assets'].values():
        if not a['variant']:
            continue
        row = {'i': a['item'], 's': ST.get(a['status'], 'x'),
               'u': a['unit'], 'cy': a['cycles'],
               'cd': round(a['clientDays'], 2),
               'md': round(a['commercialDays'], 2),
               'rv': round(a['revenue'], 2), 'dl': a['idleDays']}
        if a['pendingRevenue']:
            row['p'] = 1
        if a['status'] == MI.OUT_STATUS:
            row['h'] = a['holder']
            row['c'] = a['holderCo']
            if a['onHireDate']:
                row['d'] = (dt.date.fromisoformat(d['asof'])
                            - a['onHireDate']).days
        by_variant.setdefault(a['variant'], []).append(row)
    #  out first (that is who you are chasing), then longest held,
    #  then the ones that have never moved - same ordering rule the
    #  rest of the suite uses.
    for v in by_variant.values():
        v.sort(key=lambda r: (0 if r['s'] == 'o' else 1,
                              -(r.get('d') or 0), -r['cd'], r['i']))

    payload = {'variants': d['variants'], 'rank': rank, 'lookup': lookup,
               'assets': by_variant, 'daysIn': d['daysIn'],
               'noVariant': j['noVariantAssets'], 'thumbs': thumbs,
               'thumbBase': '../../../Gear_Lookup/thumbs/'}

    # ---------------- the page --------------------------------------
    H = []
    H.append("<div class='wrap'>")
    H.append("<div class='mast'><div>"
             "<div class='internal'>COATES INTERNAL &middot; NOT FOR THE "
             "CLIENT OR THE STORE WI-FI</div>"
             "<h1>Utilisation <b>Intelligence</b></h1>"
             "<div class='sub'>Which asset to issue now &middot; what is "
             "wrong today &middot; what the next shutdown actually needs"
             "</div></div>"
             "<div class='rt'>POWERED BY <span class='siq'>SITEIQ</span><br>"
             "Cement Australia K2 &middot; Gladstone<br>DATA AS AT {}"
             "</div></div>".format(_esc(dt.date.fromisoformat(d['asof'])
                                        .strftime('%d %b %Y').lstrip('0'))))

    # --- headline
    H.append("<h2>The two utilisations <span>&mdash; and why one number "
             "lies</span></h2>")
    H.append("<div class='lede'>Commercial counts every day an asset was on "
             "charge or on hire to anybody, including the site holding "
             "account. Client-issued counts only the days it was in the "
             "hands of a named hirer at a company. A scan proves an asset "
             "was issued, not that anybody operated it.</div>")
    H.append("<div class='panel'>" + _bar(t['clientDays'],
                                          t['commercialDays']) + "</div>")
    H.append("<div class='tiles'>")
    H.append(_tile(t['assets'], 'ASSETS ON THE REGISTER',
                   '{:,} ready &middot; {:,} out'.format(t['ready'], t['out'])))
    H.append(_tile('{:.0f}%'.format(t['everIssuedPct']), 'ISSUED AT LEAST ONCE',
                   '{:,} of {:,} assets'.format(t['issuedOnce'], t['assets'])))
    H.append(_tile('{:,}'.format(t['neverIssued']), 'NEVER ISSUED',
                   '{:.0f}% of the register has not moved'.format(
                       t['neverPct']), cls='org'))
    H.append(_tile('{:,}'.format(t['holdingOnly']), 'HOLDING ACCOUNT ONLY',
                   'charged, no downstream allocation recorded', cls='org'))
    H.append(_tile('{:,}'.format(t['cycles']), 'HIRE CYCLES',
                   'genuine issue-to-return, not scans'))
    H.append("</div>")

    # --- money
    H.append("<h2>The money, reconciled</h2>")
    H.append("<div class='lede'>Per-asset revenue can only come from the "
             "charge lines &mdash; the Daily Summary is a job total by "
             "category and cannot be split across assets. Every dollar on "
             "the charge sheet is accounted for below, including the "
             "dollars that belong to no asset at all.</div>")
    H.append("<div class='tiles'>")
    H.append(_tile(_money(t['revenue']), 'STORE ASSETS',
                   'earned by gear on this register'))
    H.append(_tile(_money(t['revenueOffRegister']), 'OFF-REGISTER PLANT',
                   'real gear, not in the store register'))
    H.append(_tile(_money(t['revenueService']), 'SERVICE &amp; ADMIN',
                   'labour, transport, travel, misc &mdash; no asset behind '
                   'them'))
    H.append(_tile(_money(t['revenueAll']), 'EVERY CHARGE LINE',
                   'the three above, added back up', cls='grn'))
    H.append("</div>")

    # --- next tool up
    H.append("<h2>Next tool up <span>&mdash; which one do I hand over?"
             "</span></h2>")
    H.append("<div class='warn'><b>This page cannot see tags, calibration, "
             "bump tests, servicing or whether a kit is complete.</b> None "
             "of it is in any SiteIQ export. It also cannot see gear that is "
             "reserved, quarantined or out of service, so something held "
             "back on purpose will look idle here. Check the item before you "
             "issue it. If you keep passing over a tool this page "
             "recommends, say why &mdash; that is how the hidden problem "
             "gets found.</div>")
    H.append("<div class='tools'><input class='s' id='nq' type='search' "
             "placeholder='Search a tool, an item number or a barcode' "
             "oninput='nextUp()' autocomplete='off' spellcheck='false'>"
             "</div>")
    H.append("<div id='nextup'></div>")

    # --- fleet planning
    H.append("<h2>Fleet planning <span>&mdash; what the next shutdown "
             "actually needs</span></h2>")
    H.append("<div class='lede'>Sized on <b>peak concurrent demand</b> plus a "
             "{:.0f}% contingency buffer, never on average utilisation &mdash; "
             "averages are how a store runs out of what it just sent back. "
             "Confidence says how much weight the number carries. "
             "<b>Tap any row</b> to see every asset in it, who is holding "
             "the ones that are out, and how hard each one has "
             "worked.</div>"
             .format(d['contingencyPct'] * 100))
    H.append("<div class='tools'><input class='s' id='fq' type='search' "
             "placeholder='Filter variants' oninput='fleet()' "
             "autocomplete='off' spellcheck='false'>"
             "<span id='callf'>"
             "<button class='f on' onclick=\"setCall('all',this)\">ALL</button>"
             "<button class='f' onclick=\"setCall('BRING MORE',this)\">BRING "
             "MORE</button>"
             "<button class='f' onclick=\"setCall('REDUCE NEXT TIME',this)\">"
             "REDUCE</button>"
             "<button class='f' onclick=\"setCall('ROTATE STOCK',this)\">"
             "ROTATE</button>"
             "<button class='f' onclick=\"setCall('NONE ISSUED YET',this)\">"
             "NONE ISSUED</button></span>"
             "<span class='conf' id='fcount'></span></div>")
    H.append("<div id='fleet'></div>")
    H.append("<div id='vpanel'></div>")

    # --- ready fleets
    H.append("<h2>Ready fleets <span>&mdash; a radio without a battery is "
             "not a radio</span></h2>")
    for f in fleets:
        if f['mate'] if 'mate' in f else False:
            pass
        sub = ('{} handset(s) and {} {} on the shelf'.format(
            f['items']['ready'], f['mates']['ready'], f['mateName'])
            if f['mateName'] else
            '{} of {} on the shelf'.format(f['items']['ready'],
                                           f['items']['total']))
        limit_note = ''
        if f['limiter'] in ('batteries', 'handsets'):
            limit_note = (" &mdash; <b>{} are the limit</b>"
                          .format(f['limiter']))
        H.append("<div class='tiles'>")
        H.append(_tile('{}'.format(f['readySets']),
                       '{} READY'.format(f['name'].upper()),
                       sub + limit_note, cls='grn' if f['readySets'] else 'org'))
        H.append(_tile('{}'.format(f['items']['out']), 'OUT NOW',
                       'in {}'.format(f['name'].lower())))
        H.append(_tile('{}'.format(f['items']['total']), 'IN THE FLEET',
                       'handsets on the register'))
        H.append("</div>")
    H.append("<div class='limits'>Pairing is read off the descriptions "
             "&mdash; Motorola DP4801e handsets against Motorola IMPRES "
             "batteries. SiteIQ carries no compatibility table, so nothing "
             "else is assumed to pair, and the Milwaukee tool batteries are "
             "deliberately left out. Radio covers are not radios. Gas "
             "monitors cannot be checked for calibration, bump test or "
             "sensor configuration here &mdash; none of that is exported."
             "</div>")

    # --- integrity
    H.append("<h2>Issue integrity <span>&mdash; jobs, not warning lights"
             "</span></h2>")
    if not jobs:
        H.append("<div class='none'>Nothing to chase in this pull.</div>")
    for jb in jobs[:40]:
        H.append("<div class='job {s}'><div class='tag'>{t}</div><div>"
                 "<div class='w'>{w}</div><div class='d'>{d}</div>"
                 "</div></div>".format(s=_esc(jb['sev']), t=_esc(jb['job']),
                                       w=_esc(jb['what']), d=_esc(jb['do'])))
    if len(jobs) > 40:
        H.append("<div class='none'>Showing the first 40 of {} jobs.</div>"
                 .format(len(jobs)))

    # --- limits and provenance
    H.append("<h2>What this page cannot tell you</h2>")
    H.append("<ul class='limits'>")
    for lim in d['limits']:
        H.append('<li>' + _esc(lim) + '</li>')
    H.append("</ul>")
    H.append("<div class='limits' style='margin-top:12px'>"
             "Read {stock:,} stock rows into {assets:,} assets "
             "({dup} duplicate item numbers), {oh:,} on-hire rows "
             "({ohx} unmatched), {tx:,} transaction lines ({txx} not on this "
             "register &mdash; service charges and off-register plant). "
             "{bf:,} asset(s) had no product variant in the stock register and "
             "were given one from the movement sheets ({bt:,}) and the "
             "on-hire export ({bo:,}) - that is what lets radios, gas "
             "monitors and welders be ranked at all. {vm} name(s) in "
             "{vg} group(s) were pooled by stripping a per-unit serial or "
             "plant tag, so identical handsets compare against each other. "
             "{nv:,} assets still carry no variant anywhere and are never "
             "recommended and never size a fleet. {gv} variant(s) are hired "
             "in quantities rather than as individual assets and are marked "
             "low confidence."
             .format(stock=j['stockRows'], assets=j['assets'],
                     dup=j['duplicateItemNumbers'], oh=j['onHireRows'],
                     ohx=j['onHireUnmatched'], tx=j['txnRows'],
                     txx=j['txnUnmatched'], nv=j['noVariantAssets'],
                     gv=j['groupedVariants'], bf=j['variantsBackfilled'],
                     bt=j['variantsFromTransactions'],
                     bo=j['variantsFromOnHire'], vm=j['variantsMerged'],
                     vg=j['variantMergeGroups']) + "</div>")

    H.append("<div class='ft'><div>Coates &middot; Equipped for anything "
             "&middot; Cement Australia K2 Shutdown 2026 &middot; Gladstone"
             "<br>Author: Andrew Fisher &middot; day {} from Flame Off"
             "</div><div style='text-align:right'>POWERED BY "
             "<span class='siq'>SITEIQ</span><br>Coates internal &mdash; "
             "carries revenue, never goes to the client</div></div>"
             .format(d['daysIn']))
    H.append("</div>")

    page = ("<!doctype html><html lang='en-AU'><head><meta charset='utf-8'>"
            "<meta name='viewport' content='width=device-width,"
            "initial-scale=1'><title>Coates | Utilisation Intelligence</title>"
            "<style>" + CSS + "</style></head><body>"
            + ''.join(H)
            + "<script>window.__INTEL__=" + json.dumps(payload) + ";\n"
            + JS + "</script></body></html>")

    out_dir = os.path.join(BASE, 'Reports', today.isoformat(), 'Pages')
    if not os.path.isdir(out_dir):
        os.makedirs(out_dir)
    out = os.path.join(out_dir, 'Coates_K2_Utilisation_Intelligence_{}.html'
                       .format(today.isoformat()))
    with io.open(out, 'w', encoding='utf-8') as fh:
        fh.write(page)

    # ---------------- what it found, at the laptop -------------------
    print('=' * 62)
    print(' COATES | UTILISATION INTELLIGENCE')
    print('=' * 62)
    print('')
    print(' Register     : {:,} assets | {:,} ready | {:,} out | {:,} awaiting'
          .format(t['assets'], t['ready'], t['out'], t['awaiting']))
    print(' Issued once  : {:,} ({:.0f}%) | never issued {:,} ({:.0f}%)'
          .format(t['issuedOnce'], t['everIssuedPct'], t['neverIssued'],
                  t['neverPct']))
    print(' Utilisation  : commercial {:,.0f} days | client-issued {:,.0f} '
          'days ({:.0f}%)'.format(t['commercialDays'], t['clientDays'],
                                  t['clientPct']))
    print(' Holding acct : {:,} asset(s) only ever booked to the site holding '
          'account'.format(t['holdingOnly']))
    print(' Money        : assets {} | off-register {} | service {} | all {}'
          .format(_money(t['revenue']), _money(t['revenueOffRegister']),
                  _money(t['revenueService']), _money(t['revenueAll'])))
    for f in fleets:
        print(' Ready fleet  : {:<16} {} complete set(s){}'
              .format(f['name'], f['readySets'],
                      ' - {} are the limit'.format(f['limiter'])
                      if f['limiter'] in ('batteries', 'handsets') else ''))
    print(' Jobs to walk : {}'.format(len(jobs)))
    for jb in jobs[:5]:
        print('     {:<22} {}'.format(jb['job'], jb['what'][:60]))
    if len(jobs) > 5:
        print('     ... and {} more on the page'.format(len(jobs) - 5))
    print('')
    print(' Page         : ' + out)
    print(' COATES INTERNAL - carries revenue per asset. Do not put this on')
    print(' the store Wi-Fi and do not send it to the client.')
    return 0


def _tile(v, label, sub='', cls=''):
    return ("<div class='tile'><div class='v {c}'>{v}</div>"
            "<div class='l'>{l}</div>{s}</div>").format(
        c=cls, v=v, l=label,
        s="<div class='s'>{}</div>".format(sub) if sub else '')


if __name__ == '__main__':
    sys.exit(build())
