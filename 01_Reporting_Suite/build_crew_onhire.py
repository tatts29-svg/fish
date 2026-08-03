#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | WHO'S GOT WHAT - a supervisor's crew, on his phone
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 3 Aug 2026): "worker's boss comes over, he wants to see
#  a list of what his workers have on hire, from his phone. I need him
#  to be able to enter his company name - only first word is fine -
#  then enter. Then he has a drop down that shows all his workers. He
#  can pick them individually or he can pick the company as a whole.
#  He can view what they have on hire, not their profile. And he has
#  options to print whatever person he has viewed. Process easy for
#  them."
#
#  And on the shape of it: "group by worker in alphabetical order and
#  maybe a number next to them on amount on hire... no pics needed,
#  also option to print as a whole or individual person."
#
#  ---------------------------------------------------------------
#  WHAT IT IS NOT
#  ---------------------------------------------------------------
#  It is NOT the worker's profile. No score, no returns ring, no
#  achievements, no history. A supervisor asking what his blokes are
#  holding is not asking how they are performing, and handing him the
#  second when he asked for the first is how a useful screen turns into
#  an awkward conversation.
#
#  It carries NO MONEY either - same rule as every other page that goes
#  on the store Wi-Fi, and the same check runs before it is written.
#
#  ---------------------------------------------------------------
#  FIRST WORD IS ENOUGH, AND THAT IS CHECKED, NOT ASSUMED
#  ---------------------------------------------------------------
#  On the 3 Aug pull there are 16 companies holding gear and NO TWO
#  SHARE A FIRST WORD - DGH, VEOLIA, PROGRAMMED, XTREME, TASMAN all
#  land on exactly one. So "type one word and hit enter" works. The
#  build re-checks that every time and says so if a new company ever
#  arrives that collides, because the day it does, one word silently
#  stops being enough.
#
#  Matching is on ANY word, not just the first, so "knight" finds Dark
#  Knight - the first word is the fast path, not the only one.
#
#  Run it:  py build_crew_onhire.py       (or 69_WHOS_GOT_WHAT)
# =====================================================================
import base64
import datetime as dt
import html
import io
import json
import os
import re

import forecast as FC
import mygear_intel as MI
import mygear_nav as nav
import mygear_stores as MS
import ownership as OWN
import serials as SR
import whats_used as WU

BASE = os.path.dirname(os.path.abspath(__file__))

#  The site holding account is not a person. A Coates supervisor
#  picking his own company would otherwise see one very busy bloke
#  holding 191 assets, which is the store's own account.
STORE_ACCOUNT_NOTE = ('the store’s own account, not a person - '
                      'gear booked to site plant rather than signed out')


def _esc(s):
    return html.escape('' if s is None else str(s), quote=True)


def _mdec(code, b64):
    """menc run backwards, so the build can check its own work.

    There is no mdec in mygear_stores - the page decrypts, Python only
    ever encrypts - so the inverse lives here purely to prove the blob
    that is about to be written can be opened by the code that gates it
    and by nothing simpler.
    """
    r = MS._mulberry32(MS._xmur3(code + '|CoatesK2mgr2026')())
    try:
        raw = base64.b64decode(b64)
    except Exception:
        return None
    try:
        return ''.join(chr(b ^ (r() >> 24)) for b in raw)
    except Exception:
        return None


def _name_key(n):
    """Alphabetical the way a supervisor reads a roll call.

    The register writes "Bradley - Logiudice", first name first. Sorting
    that raw sorts by first name, which is what Andrew asked for -
    alphabetical order of the name as it appears - so it is left alone
    rather than quietly re-ordered into surname order behind his back.
    """
    return ' '.join(str(n or '').split()).upper()


def collect(data):
    """Every company, its people, and what each of them is holding."""
    out = {}
    for a in data['assets'].values():
        if a.get('status') != MI.OUT_STATUS:
            continue
        co = (a.get('holderCo') or '').strip() or 'NO COMPANY RECORDED'
        who = (a.get('holder') or '').strip() or 'NO NAME RECORDED'
        c = out.setdefault(co, {'company': co, 'people': {}, 'assets': 0})
        p = c['people'].setdefault(who, {'name': who, 'items': []})
        d = a.get('onHireDate')
        it = {
            'desc': a.get('desc') or '',
            'item': a.get('item') or '',
            'bc': a.get('bc') or '',
            'unit': a.get('unit') or '',
            'out': d.isoformat() if d else '',
            'days': ((dt.date.fromisoformat(data['sourceTo']) - d).days + 1)
                    if (d and data.get('sourceTo')) else None,
        }
        #  THE PLATE ON THE MACHINE. Andrew, 3 Aug: "Fleet_No =
        #  Item_Number and the column Serial_No is the Item_Number's
        #  serial number." This is the screen a supervisor is looking at
        #  when a machine comes back damaged, so the manufacturer's
        #  number belongs beside ours. Only when it is genuinely a
        #  serial - never our own plant number echoed back with COATES
        #  in front of it - and only when there is one, because 922 of
        #  these 1,156 lines are tooling that has no serial and does not
        #  need "sn":"" carried down a phone to say so.
        sn = SR.serial_of(a.get('item') or '')
        if sn:
            it['sn'] = sn
        p['items'].append(it)
        c['assets'] += 1
    for c in out.values():
        for p in c['people'].values():
            p['items'].sort(key=lambda i: (i['unit'], i['desc']))
            p['count'] = len(p['items'])
        c['people'] = sorted(c['people'].values(),
                             key=lambda p: _name_key(p['name']))
        c['heads'] = len(c['people'])
    return sorted(out.values(), key=lambda c: c['company'].upper())


def first_word_clashes(companies):
    """Does one word still pick one company? Re-checked every build."""
    by = {}
    for c in companies:
        w = c['company'].split()
        if not w:
            continue
        by.setdefault(w[0].upper(), []).append(c['company'])
    return {w: v for w, v in by.items() if len(v) > 1}


MONEY_JS = r"""
/* THE MANAGER LAYER, decrypted in the phone and nowhere else.
   Same cipher as the stores board's money pane - a stream keyed off
   the code, with only a hash of the code in the file. Get it wrong and
   nothing decrypts; there is no rate sitting in plain text to find.

   CASE MATTERS. The stores code is a word and gets upper-cased so a
   bloke on a wet tablet at 5am cannot fail on a capital. The MANAGER
   code is a password with deliberate mixed case - upper-casing it
   destroyed it once already on the stores board, so it is compared
   exactly as typed. */
function xmur3(s){var h=1779033703^s.length,i;
 for(i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);
 h=h<<13|h>>>19;}
 return function(){h=Math.imul(h^h>>>16,2246822507);
 h=Math.imul(h^h>>>13,3266489909);return (h^=h>>>16)>>>0;}}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;
 var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;
 return ((t^t>>>14)>>>0)/4294967296;}}
function mtagOf(c){return(xmur3(c+'|CoatesK2mgrtag2026')()>>>0).toString(16)}
function mdec(c,b64){var rnd=mulberry32(xmur3(c+'|CoatesK2mgr2026')());
 var raw=atob(b64),o='',i;for(i=0;i<raw.length;i++){
 o+=String.fromCharCode(raw.charCodeAt(i)^Math.floor(rnd()*256))}return o}
var MONEY = null;
function money(n){
  return '$' + Number(n).toLocaleString('en-AU',
    {minimumFractionDigits:2, maximumFractionDigits:2});
}
function tryUnlock(){
  var c = (document.getElementById('mcode')||{}).value || '';
  var msg = document.getElementById('mmsg');
  if(!window.__MTAG__){ msg.textContent =
    'No manager layer in this build - manager_code.txt was missing when '
    + 'it was made.'; return; }
  if(mtagOf(c) !== window.__MTAG__){
    msg.textContent = 'That code does not open it. Mind the capitals.';
    return;
  }
  try{ MONEY = JSON.parse(mdec(c, window.__M__)); }
  catch(e){ msg.textContent = 'Code accepted but the money would not '
    + 'read back. Rebuild with 69.'; return; }
  document.body.classList.add('mgr');
  setGate(true);
  draw();
}

/* THE WAY BACK OUT. He unlocks this on his own phone and then hands it
   to a supervisor to look at - so locking it again has to be one tap
   in front of him, not a reload he has to think of. */
function setGate(open){
  var g = document.getElementById('mgate');
  var f = document.getElementById('mline');
  if(open){
    g.innerHTML = "<b>Manager</b><div class='row'><span class='on'>"
      + 'Day rates are showing.</span>'
      + "<button type='button' id='mlock'>Lock</button></div>";
    document.getElementById('mlock').addEventListener('click', function(){
      MONEY = null;
      document.body.classList.remove('mgr');
      setGate(false);
      draw();
      /*  AND THE CARD OVER THE TOP. draw() redraws the table
          underneath, but a gear card open at that moment was written
          while the money was showing and keeps the day rate on it - so
          Lock, hand the phone across, and the rate is still on screen.
          The whole point of the button is that it is safe to hand over.
          (Found by attacking it, 4 Aug 2026.)  */
      mgrCloseCard();
    });
    if(f) f.textContent = 'Manager view — day rates showing. Tap Lock '
      + 'before you hand the phone over.';
  } else {
    g.innerHTML = "<b>Manager</b><div class='row'>"
      + "<input id='mcode' type='password' autocomplete='off' "
      + "autocapitalize='off' autocorrect='off' spellcheck='false' "
      + "placeholder='Manager code' aria-label='Manager code'>"
      + "<button type='button' id='munlock'>Costs</button></div>"
      + "<small id='mmsg'>Opens the day rates. Mind the capitals.</small>";
    document.getElementById('munlock').addEventListener('click', tryUnlock);
    document.getElementById('mcode').addEventListener('keydown',
      function(e){ if(e.key === 'Enter'){ e.preventDefault(); tryUnlock(); } });
    if(f) f.textContent = 'No money on this screen';
  }
}

/* WHAT A FIGURE MEANS HERE. It is the day rate on that asset, so a
   worker total is what that bloke costs the job per day while he is
   holding it - not what has been billed. Gear that carries no figure
   (tracked, client-owned, or never priced on this export) is counted
   separately rather than folded in as zero, because a total that
   quietly swallows unpriced gear reads as complete when it is not. */
function rateOf(i){
  if(!MONEY || !i.item) return null;
  var r = MONEY[i.item];
  return (typeof r === 'number') ? r : null;
}
function tally(items){
  var t = {sum: 0, off: 0};
  items.forEach(function(i){
    var r = rateOf(i);
    if(r === null) t.off++; else t.sum += r;
  });
  return t;
}
function tallyText(t){
  return money(t.sum) + '/day'
    + (t.off ? ' · ' + t.off + ' not in it' : '');
}
"""


CSS = """
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0D1218;color:#DCE3EC;font-family:'Segoe UI',Arial,sans-serif;
 font-size:15px;line-height:1.45;-webkit-text-size-adjust:100%}
.phone{max-width:640px;margin:0 auto;min-height:100vh}
/*  NOT STICKY ANY MORE. The nav bar above it is the sticky one, and
    two things both pinned to top:0 in the same box means the second
    one sits UNDER the first - the orange title slid behind the BACK
    button the moment you scrolled. One sticky thing per page.
    (4 Aug 2026.)  */
tr.gl{cursor:pointer}
tr.gl:active td{background:#1C232D}
tr.gl td.d b:after{content:' ›';color:#F26222;font-weight:800}
@media print{tr.gl td.d b:after{content:''}}
.bar{background:#F26222;color:#fff;padding:14px 16px;display:flex;
 justify-content:space-between;align-items:center}
.bar h1{font-size:18px;font-weight:800}
.bar .siq{font-size:9px;letter-spacing:2px;font-weight:800;opacity:.85}
.pad{padding:14px 16px 40px}
.lead{color:#8794A6;font-size:13px;margin-bottom:12px}
.srch{width:100%;background:#161E28;border:1px solid #2A3646;border-radius:12px;
 padding:15px 14px;color:#DCE3EC;font-size:17px;font-family:inherit}
.srch::placeholder{color:#6B7789}
.srch:focus{outline:none;border-color:#F26222}
select{width:100%;background:#161E28;border:1px solid #2A3646;border-radius:12px;
 padding:14px 12px;color:#DCE3EC;font-size:16px;font-family:inherit;
 margin-top:10px;-webkit-appearance:none;appearance:none}
select:focus{outline:none;border-color:#F26222}
.co{display:flex;justify-content:space-between;align-items:baseline;gap:10px;
 margin:16px 0 4px;flex-wrap:wrap}
.co h2{font-size:20px;font-weight:800;color:#F5F7FB}
.co span{color:#8794A6;font-size:13px;white-space:nowrap}
.hit{background:#131A22;border:1px solid #263143;border-radius:12px;
 padding:13px 14px;margin-top:8px;cursor:pointer;display:flex;
 justify-content:space-between;align-items:center;gap:10px}
.hit b{font-size:15px}
.hit span{color:#8794A6;font-size:13px;white-space:nowrap}
.person{background:#131A22;border:1px solid #263143;border-radius:14px;
 margin-top:10px;overflow:hidden;break-inside:avoid}
.person>h3{display:flex;justify-content:space-between;align-items:center;
 gap:10px;padding:12px 14px;background:#161E28;border-bottom:1px solid #232E3C;
 font-size:16px;font-weight:800}
.person>h3 i{font-style:normal;background:#F26222;color:#fff;border-radius:20px;
 min-width:28px;text-align:center;padding:2px 9px;font-size:13px;font-weight:800}
.person table{width:100%;border-collapse:collapse;font-size:13.5px}
.person td{padding:9px 14px;border-bottom:1px solid #1A2331;vertical-align:top}
.person tr:last-child td{border-bottom:0}
.person td.n{color:#6B7789;font-family:Consolas,'Courier New',monospace;
 font-size:12px;white-space:nowrap;text-align:right}
.person td.d b{display:block;color:#EAF0F7;font-weight:600}
.person td.d span{color:#6B7789;font-size:12px}
.person td.n .sn{color:#8794A6}
.tools{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 4px}
.tools button{flex:1 1 auto;background:#161E28;border:1px solid #2A3646;
 color:#DCE3EC;border-radius:11px;padding:12px 14px;font-size:14px;
 font-weight:700;font-family:inherit;cursor:pointer}
.tools button.go{background:#F26222;border-color:#F26222;color:#fff}
.back{background:none;border:0;color:#F26222;font-size:14px;font-weight:800;
 padding:0;margin-bottom:6px;cursor:pointer;font-family:inherit}
.note{color:#6B7789;font-size:12.5px;margin-top:12px}
.warn{background:#2A1206;border:1px solid #7A3A12;border-radius:11px;
 padding:11px 13px;color:#FFD9CC;font-size:12.5px;margin-top:10px}
.foot{color:#4A5768;font-size:11px;text-align:center;padding:26px 16px 40px}
.mgate{background:#131A22;border:1px solid #263143;border-radius:12px;
 padding:12px 14px;margin-top:12px}
.mgate b{display:block;font-size:13px;color:#8794A6;font-weight:700;
 margin-bottom:8px}
.mgate .row{display:flex;gap:8px}
.mgate input{flex:1;background:#0D141C;border:1px solid #2A3646;
 border-radius:10px;padding:12px;color:#DCE3EC;font-size:15px;
 font-family:inherit}
.mgate input:focus{outline:none;border-color:#F26222}
.mgate button{background:#2A3646;border:0;color:#DCE3EC;border-radius:10px;
 padding:12px 16px;font-weight:700;font-family:inherit;cursor:pointer}
.mgate small{display:block;color:#4A5768;font-size:11.5px;margin-top:7px}
.mgate .on{flex:1;align-self:center;color:#F2B01E;font-weight:700;
 font-size:13.5px}
.rate{color:#F2B01E;font-weight:800;white-space:nowrap}
.person>h3 u{text-decoration:none;color:#F2B01E;font-weight:800;
 font-size:13.5px;white-space:nowrap;margin-left:auto;margin-right:8px}
body:not(.mgr) .rate,body:not(.mgr) .person>h3 u,
body:not(.mgr) .co em{display:none}
.co em{font-style:normal;color:#F2B01E;font-weight:800;white-space:nowrap}
@media print{
 /* PRINT WHAT HE IS LOOKING AT, AND NOTHING ELSE. The search box, the
    dropdown and the buttons are how he got here - they are not part of
    the report he hands someone. One worker per block, kept whole. */
 body{background:#fff;color:#000}
 .bar,.tools,.srch,select,.back,.lead,.foot{display:none!important}
 .person{border:1px solid #999;background:#fff;break-inside:avoid;
  margin-top:8px}
 .person>h3{background:#eee;color:#000;border-bottom:1px solid #999}
 .person>h3 i{background:#000;color:#fff}
 .person td{border-bottom:1px solid #ddd}
 .person td.d b{color:#000}
 .person td.d span,.person td.n{color:#444}
 .co h2{color:#000}.co span{color:#444}
 /* if he unlocked it, the figures print - in black, because amber on
    white is a smudge on a store printer */
 .rate,.person>h3 u,.co em{color:#000!important}
 .hideprint{display:none!important}
}
"""

JS = r"""
var D = window.__CREW__;
function esc(s){
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function el(id){ return document.getElementById(id); }
var CO = null;

/* ANY WORD, NOT JUST THE FIRST. The first word is the fast path -
   Andrew's "only first word is fine" - but a bloke who types
   "knight" should still find Dark Knight rather than get nothing. */
function find(q){
  var s = (q||'').trim().toLowerCase();
  if(!s) return [];
  return D.companies.filter(function(c){
    return c.company.toLowerCase().split(/[^a-z0-9]+/)
      .some(function(w){ return w && w.indexOf(s) === 0; })
      || c.company.toLowerCase().indexOf(s) >= 0;
  });
}

function personBlock(p){
  var t = tally(p.items);
  var h = "<div class='person' data-p='" + esc(p.name) + "'><h3><span>"
    + esc(p.name) + '</span><u>' + esc(tallyText(t)) + '</u><i>'
    + p.count + '</i></h3><table><tbody>';
  h += p.items.map(function(i){
    var sub = [i.unit];
    if(i.days) sub.push('out ' + i.days + ' day' + (i.days===1?'':'s'));
    else if(i.out) sub.push('out ' + i.out);
    var r = rateOf(i);
    /*  TAPPABLE. A supervisor standing on his bloke&rsquo;s list would
        tap the row, the number, the count - and nothing happened. The
        row now carries its own item number and the person holding it,
        and one tap opens the card. (Andrew, 4 Aug 2026.)  */
    return "<tr class='gl' data-gi='" + esc(i.item) + "' data-gp='"
      + esc(p.name) + "'><td class='d'><b>" + esc(i.desc) + '</b><span>'
      + esc(sub.join(' · ')) + "</span></td><td class='n'>"
      /* the <br> lives INSIDE the span so that hiding the money on the
         locked page does not leave a blank line where it was */
      + (r === null ? '' : "<span class='rate'>" + esc(money(r))
         + '<br></span>')
      + esc(i.item)
      + (i.sn ? "<br><span class='sn'>S/N " + esc(i.sn) + '</span>' : '')
      + '</td></tr>';
  }).join('');
  return h + '</tbody></table></div>';
}

function draw(){
  if(!CO) return;
  var who = el('who').value;
  var people = who === '*' ? CO.people
    : CO.people.filter(function(p){ return p.name === who; });
  var n = people.reduce(function(a,p){ return a + p.count; }, 0);
  var all = [];
  people.forEach(function(p){ all = all.concat(p.items); });
  var head = "<div class='co'><h2>" + esc(CO.company) + '</h2><span>'
    + (who === '*' ? CO.heads + (CO.heads===1?' person':' people') + ' · '
       : '') + n + ' on hire</span><em>' + esc(tallyText(tally(all)))
    + '</em></div>';
  el('out').innerHTML = head + people.map(personBlock).join('');
  el('ptxt').textContent = who === '*'
    ? 'Print the whole company' : 'Print ' + who;
}

function openCo(c){
  CO = c;
  el('pick').style.display = '';
  var o = ["<option value='*'>Everyone — " + CO.heads + ' people, '
           + CO.assets + ' on hire</option>'];
  o = o.concat(CO.people.map(function(p){
    return "<option value='" + esc(p.name) + "'>" + esc(p.name)
      + ' — ' + p.count + '</option>';
  }));
  el('who').innerHTML = o.join('');
  el('who').value = '*';
  el('list').innerHTML = '';
  if(CO.note) el('note').innerHTML = "<div class='warn'>" + esc(CO.company)
    + ' is ' + esc(CO.note) + '.</div>';
  else el('note').innerHTML = '';
  draw();
  window.scrollTo(0,0);
  /*  the bar names the company you have open, and BACK closes it
      instead of walking off the page  */
  if(typeof k2View === 'function') k2View(CO.company, closeCo, 'Company');
}

/*  COMING BACK OUT of a company. It is NOT search() - search() opens
    a company when the query matches exactly one, which is the normal
    case, so using it as the way out closed the company and reopened it
    in the same breath. A supervisor could not get out of a company at
    all: BACK, the phone Back button and Escape all put him straight
    back in. (Found by attacking it, 4 Aug 2026.)

    This shows the LIST the query matches - even when that is one - and
    keeps what he typed, so he is where he was before he tapped in.  */
function closeCo(){
  CO = null;
  el('pick').style.display = 'none';
  el('out').innerHTML = ''; el('note').innerHTML = '';
  var q = el('q').value, hits = find(q);
  if(!q.trim()){ el('list').innerHTML = ''; }
  else if(!hits.length){
    el('list').innerHTML = "<div class='note'>No company matches \u201c"
      + esc(q) + '\u201d. Try the first word of the company name.</div>';
  } else {
    el('list').innerHTML = hits.map(function(c){
      return "<div class='hit' data-c='" + esc(c.company) + "'><b>"
        + esc(c.company) + '</b><span>' + c.heads + ' people &middot; '
        + c.assets + ' on hire</span></div>';
    }).join('');
  }
  window.scrollTo(0,0);
  if(typeof k2Home === 'function') k2Home();
}

function search(){
  var hits = find(el('q').value);
  el('pick').style.display = 'none';
  el('out').innerHTML = ''; el('note').innerHTML = '';
  CO = null;
  if(typeof k2Home === 'function') k2Home();
  if(!el('q').value.trim()){ el('list').innerHTML = ''; return; }
  if(!hits.length){
    el('list').innerHTML = "<div class='note'>No company matches “"
      + esc(el('q').value) + '”. Try the first word of the '
      + 'company name.</div>';
    return;
  }
  if(hits.length === 1){ openCo(hits[0]); return; }
  el('list').innerHTML = hits.map(function(c){
    return "<div class='hit' data-c='" + esc(c.company) + "'><b>"
      + esc(c.company) + '</b><span>' + c.heads + ' people · '
      + c.assets + ' on hire</span></div>';
  }).join('');
}


/* ------------------------------------------------------------------
   WHAT IS THIS THING? (Andrew, 4 Aug 2026 - the supervisor journey:
   "standing on his bloke's gear list with item 1232776 on the screen,
   tapping it, and nothing happening.")

   One tap on any gear line opens the card for that asset. Everything
   on it is already in this page - no extra download, and it works with
   the store Wi-Fi at its worst.

   THE MONEY RULE IS UNCHANGED. The rate appears here on exactly the
   same terms it appears in the table: only when the manager code is
   open. Locked, the line is not written at all - not written as blank,
   not written as zero. rateOf() returns null unless MONEY is decrypted,
   which cannot happen without his code.
------------------------------------------------------------------ */
function itemOf(name, item){
  var out = null;
  (D.companies || []).forEach(function(c){
    (c.people || []).forEach(function(p){
      if(name && p.name !== name) return;
      (p.items || []).forEach(function(i){
        if(i.item === item && !out)
          out = {i: i, person: p.name, company: c.company};
      });
    });
  });
  return out;
}
/*  Who else in THIS company is holding the same product. A supervisor
    asking "what is this" is usually one question away from "who else
    has one". Same page, no extra data.  */
function alsoHolding(company, desc, notName){
  var who = [];
  (D.companies || []).forEach(function(c){
    if(c.company !== company) return;
    (c.people || []).forEach(function(p){
      if(p.name === notName) return;
      var n = (p.items || []).filter(function(i){ return i.desc === desc; }).length;
      if(n) who.push(p.name + (n > 1 ? ' ×' + n : ''));
    });
  });
  return who;
}
function gearCard(item, person){
  var f = itemOf(person, item);
  if(!f){ return; }
  var i = f.i, h = '';
  h += k2r('Item number', esc(i.item));
  if(i.bc && i.bc !== i.item) h += k2r('Barcode', esc(i.bc));
  if(i.sn) h += k2r('Serial', esc(i.sn));
  if(i.unit) h += k2r('Product group', esc(i.unit));
  h += k2r('Who has it', esc(f.person), esc(f.company));
  if(i.out) h += k2r('Taken out', esc(i.out),
    i.days ? (i.days + ' day' + (i.days === 1 ? '' : 's') + ' ago') : '');
  else if(i.days) h += k2r('Out for', i.days + ' day' + (i.days===1?'':'s'));
  var r = rateOf(i);
  if(r !== null) h += k2r('Day rate', esc(money(r)),
    'while it is out - not what has been billed');
  var also = alsoHolding(f.company, i.desc, f.person);
  if(also.length)
    h += '<div class="k2note">Others at <b>' + esc(f.company)
      + '</b> holding the same thing: ' + esc(also.join(', ')) + '</div>';
  else
    h += '<div class="k2note">Nobody else at <b>' + esc(f.company)
      + '</b> is holding one of these.</div>';
  h += '<div class="k2note">This is what SiteIQ had at the morning pull. '
    + 'Anything handed back since shows on tomorrow&rsquo;s refresh.</div>';
  k2Detail(esc(i.desc), h);
}
/*  the detail-sheet row helper, so this page writes cards the same
    shape the rest of My Gear does  */
function k2r(label, value, sub){
  return '<div class="k2row"><em>' + label + '</em><span>' + value
    + (sub ? '<small>' + sub + '</small>' : '') + '</span></div>';
}

document.addEventListener('click', function(ev){
  var g = ev.target.closest ? ev.target.closest('tr.gl') : null;
  if(g){
    gearCard(g.getAttribute('data-gi'), g.getAttribute('data-gp'));
    return;
  }
  var h = ev.target.closest ? ev.target.closest('[data-c]') : null;
  if(h){
    var n = h.getAttribute('data-c');
    var c = D.companies.filter(function(x){ return x.company === n; })[0];
    if(c) openCo(c);
  }
});
el('q').addEventListener('input', search);
el('q').addEventListener('keydown', function(e){
  if(e.key === 'Enter'){ e.preventDefault(); search(); this.blur(); }
});
el('who').addEventListener('change', draw);
el('print').addEventListener('click', function(){ window.print(); });
/*  and the card over the top goes with it - it was written when the
    money was open and does not redraw itself  */
function mgrCloseCard(){
  if(typeof k2DetOpen === 'function' && k2DetOpen()) k2DetShut();
}
el('clear').addEventListener('click', function(){
  el('q').value = ''; search(); el('q').focus();
});
setGate(false);   /* draws the box and wires it, locked */
"""


def build(today=None):
    today = today or dt.date.today()
    rental, txn = (FC._newest('RENTAL_STOCK*.xlsx'),
                   FC._newest('TRANSACTIONS*.xlsx'))
    if not rental or not txn:
        print('  No RENTAL_STOCK / TRANSACTIONS export found. Nothing built.')
        return
    data = MI.read(rental, txn, FC._newest('ON_HIRE*.xlsx'))
    companies = collect(data)
    for c in companies:
        if MI._is_holding(c['company']) or c['company'].upper() == 'COATES':
            c['note'] = STORE_ACCOUNT_NOTE
    clash = first_word_clashes(companies)

    payload = {'companies': companies,
               'asof': data.get('sourceTo') or ''}

    # ---------------------------------------------------------------
    #  THE MANAGER LAYER. (Andrew, 3 Aug 2026: "can I have the manager,
    #  which is me, enter the password and get taken straight to the
    #  cost version - my password is already set up.")
    #
    #  It is. manager_code.txt has been in the folder since the stores
    #  board got its money pane, it is in 46_APPLY_UPDATE's PROTECTED
    #  list so an update cannot flatten it, and it is gitignored so it
    #  never leaves the machine.
    #
    #  THE MONEY IS ENCRYPTED, NOT HIDDEN. This reuses the stores
    #  board's own menc/mtag rather than inventing a second scheme -
    #  the rates are XORed against a stream keyed off the code, and the
    #  code itself never appears in the file, only a hash of it. A JS
    #  "if password ok then show" would have put every rate in plain
    #  text in a file anyone on the store Wi-Fi can download, which is
    #  Andrew's no-money-on-the-Wi-Fi rule broken while looking like it
    #  was kept.
    #
    #  Honest about what it is: it keeps rates out of reach of anyone
    #  at the counter and out of plain text on the wire. It is not
    #  bank-grade and is not meant to be.
    #
    #  TRACKED AND CLIENT GEAR CARRY NO FIGURE even here - Andrew's
    #  rule from 2 Aug holds inside the manager view too.
    seqs = OWN.zero_cost_sequences(list(data['assets'].values()))
    rates = WU.load_rates(BASE, txn_path=txn)
    money, priced, skipped, unpriced = {}, 0, 0, 0
    for a in data['assets'].values():
        if a.get('status') != MI.OUT_STATUS:
            continue
        if OWN.stream(a, seqs)[0] in ('COATES_TRACKED', 'CLIENT'):
            skipped += 1
            continue
        r, _src = WU._rate_of(rates, a)
        if r:
            money[a.get('item') or ''] = round(r, 2)
            priced += 1
        else:
            unpriced += 1

    mgr_p = os.path.join(BASE, 'manager_code.txt')
    mgr = ''
    if os.path.isfile(mgr_p):
        with io.open(mgr_p, encoding='utf-8') as fh:
            mgr = fh.read().strip()
    if not mgr:
        money = {}          # no code, no money layer - and it says so
    enc_money = (MS.menc(mgr, json.dumps(money, separators=(',', ':')))
                 if money else '')
    enc_tag = MS.mtag(mgr) if money else ''

    #  NO MONEY IN THE OPEN PAYLOAD. Same rule as the counter screens,
    #  and the same kind of check - it is searched before it is
    #  written, so a future edit that adds a rate cannot ship quietly.
    blob = json.dumps(payload)
    if re.search(r'"(revenue|rate|charge|\$)"', blob, re.I):
        raise SystemExit('\n  REFUSED TO WRITE - a money field reached the '
                         'crew payload.\n  This page goes on the store '
                         'Wi-Fi. Fix the builder.')

    body = [
        "<div class='phone'>",
        #  THE WAY BACK. Same rule as fleet.html - no doorless pages -
        #  but the two blue crumbs said nothing about where you were and
        #  scrolled off the top the moment a company was open. This page
        #  is reached from THREE places (the front door, the stores
        #  board, and the "that reads like a company name" hint), so
        #  "back" meant three different things and the crumbs guessed at
        #  one of them. The bar remembers which door you came in by.
        #  (Andrew, 4 Aug 2026.)
        nav.bar('crew', 'Who&rsquo;s got what'),
        "<div class='bar'><h1>Who&rsquo;s got what</h1>"
        "<span class='siq'>POWERED BY SITEIQ</span></div>",
        "<div class='pad'>",
        "<p class='lead'>Type your company name &mdash; the first word is "
        "enough &mdash; then pick a bloke, or leave it on Everyone.</p>",
        "<input class='srch' id='q' type='search' autocomplete='off' "
        "placeholder='Company name&hellip;' aria-label='Company name'>",
        "<div id='pick' style='display:none'>",
        "<select id='who' aria-label='Which worker'></select>",
        "<div class='tools'><button type='button' id='print' class='go'>"
        "<span id='ptxt'>Print</span></button>"
        "<button type='button' id='clear'>Start again</button></div>",
        "</div>",
        "<div id='note'></div>",
        "<div id='list'></div>",
        "<div id='out'></div>",
        #  The manager's way in. It sits at the bottom, quiet and grey,
        #  because a supervisor came here to see his blokes' gear and
        #  does not need a password box at the top of the screen
        #  inviting him to wonder what he is missing.
        "<div class='mgate hideprint' id='mgate'>"
        "<b>Manager</b><div class='row'>"
        "<input id='mcode' type='password' autocomplete='off' "
        "autocapitalize='off' autocorrect='off' spellcheck='false' "
        "placeholder='Manager code' aria-label='Manager code'>"
        "<button type='button' id='munlock'>Costs</button></div>"
        "<small id='mmsg'>Opens the day rates. Mind the capitals.</small>"
        "</div>",
        "<div class='foot'>Cement Australia K2 Shutdown 2026 &middot; "
        "Gladstone<br>What is on hire as at " + _esc(payload['asof'])
        + "<br><span id='mline'>No money on this screen</span></div>",
        "</div></div>",
    ]
    #  MENU on this page was four page names and Close - nothing it
    #  could do for a supervisor already deep in a company list. These
    #  are the three things he actually reaches for, and they work from
    #  the bottom of a long list without scrolling back up.
    _doors = [
        ("var q=document.getElementById('q');q.value='';"
         "search();window.scrollTo(0,0);q.focus()",
         "Look up another company", "Start again from the top", None),
        ("var w=document.getElementById('who');"
         "if(w&&w.offsetParent){window.scrollTo(0,0);w.focus()}",
         "Pick a different bloke", "The worker list for this company",
         None),
        ("window.print()", "Print this list", "Whatever is on screen now",
         None),
    ]
    body.append(nav.sheet('crew', extra=_doors,
                          extra_heading='On this page'))
    body.append(nav.detail_sheet())
    page = ("<!doctype html><html lang='en-AU'><head><meta charset='utf-8'>"
            "<meta name='viewport' content='width=device-width,"
            "initial-scale=1,viewport-fit=cover'>"
            "<title>Coates | Who&rsquo;s got what</title>"
            "<style>" + CSS + nav.CSS + "</style></head><body>"
            + ''.join(body)
            #  The bar goes in first and on its own, so the way off this
            #  page works even if the payload below it never parses.
            + "<script>" + nav.js('crew', 'Who&rsquo;s got what')
            + "</script>"
            + "<script>window.__CREW__=" + blob + ";\n"
            + "window.__M__=" + json.dumps(enc_money) + ";\n"
            + "window.__MTAG__=" + json.dumps(enc_tag) + ";\n"
            + MONEY_JS + JS + "</script></body></html>")

    #  AND THE CIPHER ACTUALLY CIPHERED.
    #
    #  The first version of this check looked right and did nothing. It
    #  searched the page for {"1232776":18.67 - but that money goes into
    #  the page through json.dumps, which turns every " into \", so the
    #  leak ships as {\"1232776\":18.67 and the search sails past it. A
    #  pass-through menc was injected on purpose and the guard waved it
    #  through, which is worse than having no guard at all: it says the
    #  rates are safe while they sit in plain text on the store Wi-Fi.
    #
    #  So this checks what is ACTUALLY in the file, three ways, and each
    #  one is proved by injecting the fault it is meant to catch:
    #    1. the plain JSON as written,
    #    2. the same thing after JSON escaping - the one that got through,
    #    3. one bare "number":rate pair, which survives either escaping.
    if money:
        plain = json.dumps(money, separators=(',', ':'))
        k, v = next(iter(money.items()))
        for probe in (plain[:60], json.dumps(plain)[1:60],
                      '{}":{}'.format(k, v)):
            if probe and probe in page:
                raise SystemExit(
                    '\n  REFUSED TO WRITE - the manager rates are sitting in '
                    'the page in plain\n  text. Anyone on the store Wi-Fi '
                    'could read them straight out of the\n  file. Check '
                    'menc() and manager_code.txt.')

        #  AND IT IS LOCKED TO HIS CODE, NOT JUST SCRAMBLED. The blob is
        #  decrypted back here, twice: once with his code, which must
        #  return the rates exactly, and once with a blank code, which
        #  must not. Scrambling against a key anyone could guess looks
        #  identical in the file and is worth nothing.
        if _mdec(mgr, enc_money) != plain:
            raise SystemExit('\n  REFUSED TO WRITE - the manager blob will '
                             'not decrypt back with the code in\n  '
                             'manager_code.txt. The page would refuse him. '
                             'Check menc().')
        if _mdec('', enc_money) == plain:
            raise SystemExit('\n  REFUSED TO WRITE - the rates decrypt with a '
                             'BLANK code, so the lock is\n  cosmetic. Check '
                             'that menc() is keyed off manager_code.txt.')

        #  And the doorman is checking the same code the lock uses. If
        #  the tag is keyed off anything else, the blob is fine and the
        #  page still turns Andrew away at his own screen - a fault that
        #  only shows up on site, on a phone, in front of someone.
        if enc_tag != MS.mtag(mgr):
            raise SystemExit('\n  REFUSED TO WRITE - the code the page checks '
                             'is not the code the rates\n  are locked to. '
                             'Your own code would be rejected. Check mtag().')

    out = os.path.join(BASE, 'Gear_Lookup', 'crew.html')
    d = os.path.dirname(out)
    if d and not os.path.isdir(d):
        os.makedirs(d)
    with io.open(out, 'w', encoding='utf-8') as fh:
        fh.write(page)

    print('=' * 66)
    print(' COATES | WHO\'S GOT WHAT')
    print('=' * 66)
    print('')
    print(' Companies    : {:,} holding gear right now'.format(len(companies)))
    print(' People       : {:,}'.format(sum(c['heads'] for c in companies)))
    print(' On hire      : {:,} asset(s)'.format(
        sum(c['assets'] for c in companies)))
    print('')
    if clash:
        print(' ' + '!' * 60)
        print(' FIRST WORD IS NO LONGER ENOUGH. These share one:')
        for w, v in clash.items():
            print('   "{}" -> {}'.format(w, ' | '.join(v)))
        print(' The page still finds them - it offers the choice - but the')
        print(' "type one word and go" promise is broken for these.')
    else:
        print(' First word   : still unique across all {} companies, so one'
              .format(len(companies)))
        print('                word and Enter lands straight on the crew.')
    print('')
    for c in companies[:8]:
        print('   {:<40} {:>3} people {:>5} on hire'.format(
            c['company'][:40], c['heads'], c['assets']))
    if len(companies) > 8:
        print('   ... and {} more'.format(len(companies) - 8))
    print('')
    print(' Written      : {}'.format(out))
    print('')
    print(' MANAGER LAYER')
    if not mgr:
        print('   manager_code.txt is missing, so this build has NO money in')
        print('   it at all. The Costs box will say so rather than pretend.')
    elif not money:
        print('   Nothing on hire carries a rate, so no money layer was made.')
    else:
        print('   {:,} of the {:,} on hire carry a day rate. Your code opens'
              .format(priced, sum(c['assets'] for c in companies)))
        print('   them - the rates are ENCRYPTED against it, not just hidden,')
        print('   and the code itself is not in the file, only a hash.')
        print('   {:,} tracked/client asset(s) carry no figure - your own rule'
              .format(skipped))
        print('   from 2 Aug holds inside the manager view too. {:,} more had'
              .format(unpriced))
        print('   no rate on this export; a total says how many it left out')
        print('   rather than counting them as nothing.')
    print('')
    print(' Locked, it is what a supervisor asked for: gear only, no photos,')
    print(' no worker profile, no money - checked before writing.')
    print(' It is NOT gated - anyone on the store Wi-Fi can open it and look')
    print(' up a company. They just cannot see a figure.')
    return out


if __name__ == '__main__':
    build()
