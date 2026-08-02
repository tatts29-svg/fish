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
import datetime as dt
import html
import io
import json
import os
import re

import forecast as FC
import mygear_intel as MI

BASE = os.path.dirname(os.path.abspath(__file__))

#  The site holding account is not a person. A Coates supervisor
#  picking his own company would otherwise see one very busy bloke
#  holding 191 assets, which is the store's own account.
STORE_ACCOUNT_NOTE = ('the store’s own account, not a person - '
                      'gear booked to site plant rather than signed out')


def _esc(s):
    return html.escape('' if s is None else str(s), quote=True)


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
        p['items'].append({
            'desc': a.get('desc') or '',
            'item': a.get('item') or '',
            'bc': a.get('bc') or '',
            'unit': a.get('unit') or '',
            'out': d.isoformat() if d else '',
            'days': ((dt.date.fromisoformat(data['sourceTo']) - d).days + 1)
                    if (d and data.get('sourceTo')) else None,
        })
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


CSS = """
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0D1218;color:#DCE3EC;font-family:'Segoe UI',Arial,sans-serif;
 font-size:15px;line-height:1.45;-webkit-text-size-adjust:100%}
.phone{max-width:640px;margin:0 auto;min-height:100vh}
.bar{background:#F26222;color:#fff;padding:14px 16px;display:flex;
 justify-content:space-between;align-items:center;position:sticky;top:0;z-index:9}
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
 margin:16px 0 4px}
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
  var h = "<div class='person' data-p='" + esc(p.name) + "'><h3><span>"
    + esc(p.name) + "</span><i>" + p.count + '</i></h3><table><tbody>';
  h += p.items.map(function(i){
    var sub = [i.unit];
    if(i.days) sub.push('out ' + i.days + ' day' + (i.days===1?'':'s'));
    else if(i.out) sub.push('out ' + i.out);
    return "<tr><td class='d'><b>" + esc(i.desc) + '</b><span>'
      + esc(sub.join(' · ')) + "</span></td><td class='n'>"
      + esc(i.item) + '</td></tr>';
  }).join('');
  return h + '</tbody></table></div>';
}

function draw(){
  if(!CO) return;
  var who = el('who').value;
  var people = who === '*' ? CO.people
    : CO.people.filter(function(p){ return p.name === who; });
  var n = people.reduce(function(a,p){ return a + p.count; }, 0);
  var head = "<div class='co'><h2>" + esc(CO.company) + '</h2><span>'
    + (who === '*' ? CO.heads + (CO.heads===1?' person':' people') + ' · '
       : '') + n + ' on hire</span></div>';
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
}

function search(){
  var hits = find(el('q').value);
  el('pick').style.display = 'none';
  el('out').innerHTML = ''; el('note').innerHTML = '';
  CO = null;
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

document.addEventListener('click', function(ev){
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
el('clear').addEventListener('click', function(){
  el('q').value = ''; search(); el('q').focus();
});
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

    #  NO MONEY ON THIS PAGE. Same rule as the counter screens, and the
    #  same kind of check - the payload is searched before it is
    #  written, so a future edit that adds a rate cannot ship quietly.
    blob = json.dumps(payload)
    if re.search(r'"(revenue|rate|charge|\$)"', blob, re.I):
        raise SystemExit('\n  REFUSED TO WRITE - a money field reached the '
                         'crew payload.\n  This page goes on the store '
                         'Wi-Fi. Fix the builder.')

    body = [
        "<div class='phone'>",
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
        "<div class='foot'>Cement Australia K2 Shutdown 2026 &middot; "
        "Gladstone<br>What is on hire as at " + _esc(payload['asof'])
        + "<br>No money on this screen</div>",
        "</div></div>",
    ]
    page = ("<!doctype html><html lang='en-AU'><head><meta charset='utf-8'>"
            "<meta name='viewport' content='width=device-width,"
            "initial-scale=1'><title>Coates | Who&rsquo;s got what</title>"
            "<style>" + CSS + "</style></head><body>" + ''.join(body)
            + "<script>window.__CREW__=" + blob + ";\n" + JS
            + "</script></body></html>")

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
    print(' No money on it - checked before writing. No photos, and no')
    print(' worker profile: gear only, which is what a supervisor asked')
    print(' for. It is NOT gated - anyone on the store Wi-Fi can open it.')
    return out


if __name__ == '__main__':
    build()
