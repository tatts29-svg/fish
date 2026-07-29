#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | STORES TEAM PAGE - the counter's own view
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 29 Jul 2026): "can Coates have a direct sign in - opens
#  up stores staff page. all the product groups, how many available,
#  how many on hire, company and name, where abouts, what storage unit
#  ... a section of stock take and a percentage of what has been stock
#  taked and what has not ... on hire list longer than 3 days, a
#  section you look through to ensure its not in the store, done by
#  storage unit so your being directed where to go."
#
#  This is a DIFFERENT JOB from the crew page. A crew member asks "what
#  have I got and what can I grab". The stores team asks "what is
#  missing, who has it, and where do I walk to find it". So this page
#  is built around the hunt, not the browse.
#
#  ON THE SIGN-IN, HONESTLY. The page is a static file on the store's
#  own Wi-Fi - there is no server to check a password against. So the
#  payload is ENCRYPTED with the passcode, using the same scheme that
#  already protects every crew member's card: without the code the file
#  is meaningless noise, and the code is never written into the page.
#  That is real protection against someone browsing the Wi-Fi, and it
#  is NOT enterprise sign-on - a determined person with the file and
#  time could work at it. For a list of who is holding which grinder on
#  a shutdown, already printed on the client's daily reports, that is
#  the proportionate answer. Say so plainly rather than call it secure.
#
#  THE SITE PLANT SPLIT. 509 items are out longer than three days, but
#  294 of them are barriers, rubbish chutes and site plant that live on
#  site by design - they are not lost, and putting them in a hunt list
#  turns it into 60% noise that nobody reads twice. Tools and plant are
#  therefore counted apart: the chase list is the gear that should
#  plausibly be back on a shelf.
# =====================================================================
import base64
import datetime as dt
import io
import json
import os
import re

M32 = 0xFFFFFFFF


def _imul(a, b):
    return (a * b) & M32


def _xmur3(s):
    h = 1779033703 ^ len(s)
    for ch in s:
        h = _imul(h ^ ord(ch), 3432918353)
        h = ((h << 13) | (h >> 19)) & M32

    def call():
        nonlocal h
        h = _imul(h ^ (h >> 16), 2246822507)
        h = _imul(h ^ (h >> 13), 3266489909)
        h ^= h >> 16
        return h & M32
    return call


def _mulberry32(a):
    #  Copied verbatim from BUILD_MY_GEAR's proven pair - the Python and
    #  the JavaScript have to produce the identical stream or the page
    #  will not open, and "close enough" fails silently.
    a &= M32

    def call():
        nonlocal a
        a = (a + 0x6D2B79F5) & M32
        t = _imul(a ^ (a >> 15), (a | 1) & M32)
        t = ((t + _imul(t ^ (t >> 7), (t | 61) & M32)) & M32) ^ t
        t &= M32
        return (t ^ (t >> 14)) & M32
    return call


def enc(code, s):
    """Same scheme as the crew cards - XOR against a seeded stream.
    r() >> 24 is the integer form of the page's Math.floor(rnd()*256)."""
    r = _mulberry32(_xmur3(code + '|CoatesK2stores2026')())
    return base64.b64encode(
        bytes((ord(c) ^ (r() >> 24)) & 0xFF for c in s)).decode('ascii')


def tag(code):
    return format(_xmur3(code + '|CoatesK2storestag2026')(), 'x')


def au_date(v):
    """SiteIQ writes these as TEXT ("28/07/2026"), not dates - the third
    field family in this export set to do it. Read as a date they come
    back as nothing, and every ageing figure silently reads zero, which
    is a confident wrong answer. (29 Jul 2026)"""
    if isinstance(v, dt.datetime):
        return v.date()
    if isinstance(v, dt.date):
        return v
    m = re.match(r'\s*(\d{1,2})/(\d{1,2})/(\d{4})', str(v or ''))
    if not m:
        return None
    try:
        return dt.date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
    except ValueError:
        return None


#  Storage units that live on site by design - out for days is normal,
#  not a thing to chase round the store.
PLANT_UNITS = ('site plant', 'barrier', 'chute', 'laydown')


def _is_plant(unit):
    u = (unit or '').lower()
    return any(k in u for k in PLANT_UNITS)


def read(rental_path, stocktake_path, master=None, today=None):
    """Everything the counter needs, from the two registers."""
    import openpyxl
    today = today or dt.date.today()

    def sheet(path, name):
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        ws = wb[name] if name in wb.sheetnames else wb.active
        rows = list(ws.iter_rows(values_only=True))
        hdr = [str(c or '').strip() for c in rows[0]]
        ix = {h: i for i, h in enumerate(hdr) if h}
        body = [r for r in rows[1:] if r and any(c is not None for c in r)]
        wb.close()
        return ix, body

    import mygear_store as MS          # the crew catalogue's category brain
    ix, rs = sheet(rental_path, 'RENTAL_STOCK')

    def g(r, k, d=''):
        return str(r[ix[k]] or '').strip() if k in ix else d

    groups, chase_t, chase_p, idle = {}, [], [], []
    for r in rs:
        status = g(r, 'ITEM_STATUS')
        if status not in ('Available for Hire', 'On Hire'):
            continue
        raw = g(r, 'ITEM_DESCRIPTION')
        if not raw or not MS._offerable(raw):
            continue
        name = MS._tidy(raw, master, g(r, 'ITEM_NUMBER'))
        cat = MS._cat_of(name)
        unit = g(r, 'STORAGE_UNIT') or 'Unfiled'
        key = (cat, name)
        e = groups.setdefault(key, {'c': cat, 'n': name, 'av': 0, 'oh': 0,
                                    'u': {}, 'who': []})
        if status == 'Available for Hire':
            e['av'] += 1
            e['u'][unit] = e['u'].get(unit, 0) + 1
        else:
            e['oh'] += 1
            d = au_date(g(r, 'ON_HIRE_DATE'))
            days = (today - d).days if d else None
            who = g(r, 'HIRER_NAME') or 'Not named'
            co = g(r, 'COMPANY_NAME') or 'Not named'
            e['who'].append({'w': who, 'co': co, 'd': days, 'u': unit})
            if days is not None and days > 3:
                row = {'n': name, 'u': unit, 'w': who, 'co': co, 'd': days}
                (chase_p if _is_plant(unit) else chase_t).append(row)
            if 'site plant' in who.lower():
                idle.append({'n': name, 'u': unit, 'd': days})

    #  stocktake - how much of the store has actually been laid eyes on
    stock = {'total': 0, 'w1': 0, 'w3': 0, 'w7': 0, 'stale': []}
    if stocktake_path and os.path.isfile(stocktake_path):
        six, sk = sheet(stocktake_path, 'STOCKTAKE')

        def sg(r, k):
            return str(r[six[k]] or '').strip() if k in six else ''
        for r in sk:
            d = au_date(sg(r, 'LAST_SIGHTED_DATE_TIME'))
            if not d:
                continue
            age = (today - d).days
            stock['total'] += 1
            if age <= 1:
                stock['w1'] += 1
            if age <= 3:
                stock['w3'] += 1
            if age <= 7:
                stock['w7'] += 1
            else:
                stock['stale'].append({
                    'n': sg(r, 'DESCRIPTION')[:60],
                    'u': sg(r, 'STORAGE_UNIT') or 'Unfiled',
                    'd': age, 'by': sg(r, 'LAST_SIGHTED_BY')[:26]})
    stock['stale'].sort(key=lambda x: -x['d'])

    G = sorted(groups.values(), key=lambda e: (e['c'], e['n'].lower()))
    chase_t.sort(key=lambda x: (-x['d'], x['u']))
    chase_p.sort(key=lambda x: -x['d'])

    def by_unit(rows):
        out = {}
        for x in rows:
            out[x['u']] = out.get(x['u'], 0) + 1
        return sorted(out.items(), key=lambda t: -t[1])

    return {
        'groups': G,
        'chase': {'tools': chase_t, 'plant': chase_p,
                  'toolUnits': by_unit(chase_t),
                  'plantUnits': by_unit(chase_p)},
        'stock': stock,
        'idle': idle,
        'tiles': {
            'avail': sum(e['av'] for e in G),
            'onhire': sum(e['oh'] for e in G),
            'lines': len(G),
            'chase': len(chase_t),
            'plantOut': len(chase_p),
            'idle': len(idle),
            'stockPct': int(100.0 * stock['w7'] / stock['total'] + 0.5)
                        if stock['total'] else 0,
            'stale': len(stock['stale']),
        },
    }


# ---------------------------------------------------------------------
#  THE PAGE
# ---------------------------------------------------------------------
PAGE = """<!DOCTYPE html><html lang="en-AU"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#F26222">
<title>Coates Stores Team - K2</title><style>
:root{--org:#F26222;--ink:#0A0E14;--pnl:#151A22;--pnl2:#1C232D;--line:#2A3340;
 --txt:#E9EEF5;--dim:#98A4B4;--gd:#2BB673;--am:#F5A623;--rd:#E23B2E;--neon:#EFFF3D}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{background:var(--ink);color:var(--txt);font-family:-apple-system,
 BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;line-height:1.5}
.wrap{max-width:820px;margin:0 auto;padding:0 13px 90px}
header{background:linear-gradient(135deg,#F26222,#C44C28 62%,#8E3218);
 padding:16px 15px;margin:0 -13px 14px;position:relative;overflow:hidden}
header:after{content:"";position:absolute;right:-40px;top:-40px;width:170px;
 height:170px;border-radius:50%;background:rgba(255,255,255,.10)}
.brand{font-size:19px;font-weight:900;letter-spacing:-.4px}
.brand span{background:#fff;color:#F26222;padding:3px 9px;border-radius:6px;
 margin-right:8px}
h1{font-size:23px;font-weight:900;margin:9px 0 2px;letter-spacing:-.4px}
.sub{font-size:12.5px;opacity:.95;font-weight:600}
/* gate */
#gate{padding:46px 6px;text-align:center}
#gate h2{font-size:19px;font-weight:900;margin-bottom:6px}
#gate p{color:var(--dim);font-size:13.5px;margin-bottom:20px;line-height:1.65}
#gate input{width:100%;max-width:300px;background:var(--pnl);border:1.5px solid var(--line);
 color:#fff;font-family:inherit;font-size:19px;text-align:center;letter-spacing:5px;
 padding:15px;border-radius:13px}
#gate input:focus{outline:none;border-color:var(--org)}
#gate button{display:block;width:100%;max-width:300px;margin:11px auto 0;
 background:linear-gradient(135deg,var(--org),#C44C28);color:#fff;border:0;
 font-family:inherit;font-weight:900;font-size:15px;letter-spacing:1.4px;
 padding:15px;border-radius:13px;min-height:50px}
#gerr{color:var(--rd);font-size:13.5px;margin-top:12px;font-weight:700;min-height:20px}
/* board */
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
.tile{background:var(--pnl);border:1px solid var(--line);border-radius:12px;
 padding:12px 10px;text-align:center}
.tile b{display:block;font-size:24px;font-weight:900;color:var(--neon);line-height:1.1;
 font-variant-numeric:tabular-nums}
.tile.g b{color:var(--gd)}.tile.a b{color:var(--am)}.tile.r b{color:var(--rd)}
.tile span{display:block;font-size:9.5px;color:var(--dim);font-weight:800;
 letter-spacing:.8px;text-transform:uppercase;margin-top:5px;line-height:1.3}
/* tabs */
.tabs{display:flex;gap:6px;overflow-x:auto;padding:2px 0 10px;position:sticky;top:0;
 background:var(--ink);z-index:5}
.tab{flex:none;background:var(--pnl);border:1px solid var(--line);color:var(--dim);
 font-family:inherit;font-weight:800;font-size:12.5px;letter-spacing:.5px;
 padding:11px 15px;border-radius:999px;min-height:44px;text-transform:uppercase}
.tab.on{background:var(--org);border-color:var(--org);color:#fff}
.pane{display:none}.pane.on{display:block}
/* rows */
.srch{width:100%;background:var(--pnl);border:1.5px solid var(--line);color:#fff;
 font-family:inherit;font-size:16px;padding:13px 15px;border-radius:12px;margin-bottom:12px}
.srch:focus{outline:none;border-color:var(--org)}
.grp{background:var(--pnl);border:1px solid var(--line);border-radius:12px;
 margin-bottom:9px;overflow:hidden}
.grp>button{width:100%;background:none;border:0;color:var(--txt);font-family:inherit;
 text-align:left;padding:13px 14px;display:flex;align-items:center;gap:12px;min-height:58px}
.grp .gn{flex:1;min-width:0}
.grp .gn b{display:block;font-size:14.5px;font-weight:700}
.grp .gn span{display:block;font-size:11px;color:var(--dim);font-weight:700;
 letter-spacing:.4px;text-transform:uppercase;margin-top:2px}
.grp .gq{flex:none;text-align:right}
.grp .gq b{display:block;font-size:17px;font-weight:900;color:var(--gd);line-height:1}
.grp .gq span{display:block;font-size:9.5px;color:var(--dim);font-weight:800;
 letter-spacing:.7px;text-transform:uppercase;margin-top:2px}
.bar{display:flex;height:8px;border-radius:99px;overflow:hidden;background:#0E1319;
 margin:0 14px 12px}
.bar i{display:block;height:100%}
.bar .ba{background:var(--gd)}.bar .bo{background:var(--org)}
.kids{display:none;padding:0 12px 12px}
.kids.on{display:block}
.kid{background:var(--pnl2);border:1px solid var(--line);border-radius:10px;
 padding:10px 12px;margin-bottom:7px}
.kid .kt{display:flex;gap:10px;align-items:baseline}
.kid .kt b{flex:1;font-size:13.5px;font-weight:700}
.kid .kt em{font-style:normal;font-size:12px;font-weight:800;color:var(--gd)}
.kid .kt em.o{color:var(--org)}
.kid .kw{font-size:11.5px;color:var(--dim);margin-top:5px;line-height:1.6}
.kid .kw b{color:#C7CED8;font-weight:700}
.where{font-size:11px;color:var(--neon);font-weight:800;letter-spacing:.5px;
 text-transform:uppercase;margin-top:5px}
.uhead{font-size:12px;font-weight:900;letter-spacing:1.2px;text-transform:uppercase;
 color:var(--org);margin:16px 0 8px;padding-left:9px;border-left:3px solid var(--org)}
.note{background:var(--pnl);border:1px solid var(--line);border-left:4px solid var(--org);
 border-radius:12px;padding:12px 14px;font-size:13px;color:#C7CED8;line-height:1.65;
 margin-bottom:14px}
.note b{color:#fff}
.ring{display:flex;align-items:center;gap:16px;background:var(--pnl);
 border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:14px}
.ring .rv{font-size:40px;font-weight:900;color:var(--gd);line-height:1}
.ring .rt{flex:1;font-size:13px;color:var(--dim);line-height:1.6}
.ring .rt b{display:block;color:#fff;font-size:15px;font-weight:800;margin-bottom:3px}
.foot{text-align:center;color:#6E7A8A;font-size:11px;padding:24px 8px;line-height:1.8}
</style></head><body>
<div class="wrap">
<header><div class="brand"><span>COATES</span>STORES TEAM</div>
<h1>The counter's view</h1>
<div class="sub">Cement Australia K2 &middot; __ASOF__</div></header>

<div id="gate">
  <h2>Coates stores staff</h2>
  <p>Enter the store code to open the board.<br>
  This page is for the team behind the counter.</p>
  <input id="code" type="password" inputmode="numeric" autocomplete="off"
         placeholder="CODE" aria-label="Store code">
  <button onclick="unlock()" type="button">OPEN THE BOARD</button>
  <div id="gerr"></div>
</div>

<div id="app" style="display:none"></div>
</div>
<script>
var PAYLOAD="__PAYLOAD__",TAG="__TAG__";
function xmur3(s){for(var i=0,h=1779033703^s.length;i<s.length;i++){
 h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19}
 return function(){h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);
 h^=h>>>16;return h>>>0}}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;
 var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;
 return((t^t>>>14)>>>0)/4294967296}}
function tagOf(c){return(xmur3(c+'|CoatesK2storestag2026')()>>>0).toString(16)}
function dec(c,b64){var rnd=mulberry32(xmur3(c+'|CoatesK2stores2026')());
 var raw=atob(b64),o='';for(var i=0;i<raw.length;i++){
 o+=String.fromCharCode(raw.charCodeAt(i)^Math.floor(rnd()*256))}return o}
var D=null;
function unlock(){
  var c=(document.getElementById('code').value||'').trim().toUpperCase();
  if(!c){return}
  if(tagOf(c)!==TAG){document.getElementById('gerr').textContent=
    'That code does not open this board. Ask Andrew.';return}
  try{ D=JSON.parse(dec(c,PAYLOAD)); }catch(e){
    document.getElementById('gerr').textContent='Could not open the board.';return}
  document.getElementById('gate').style.display='none';
  var a=document.getElementById('app'); a.style.display='block';
  render();
}
document.getElementById('code').addEventListener('keydown',function(e){
  if(e.key==='Enter') unlock();});
/* Came through the override on the crew page? Open straight up. The code
   travels in sessionStorage, never the address bar, and is cleared the
   moment it is used so a shared tablet does not stay unlocked. */
(function(){ try{
  var h=sessionStorage.getItem('k2stores');
  if(h){ sessionStorage.removeItem('k2stores');
         document.getElementById('code').value=h; unlock(); }
}catch(e){} })();

function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;')
  .replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function tile(v,l,cls){return '<div class="tile '+(cls||'')+'"><b>'+v+'</b><span>'+l+'</span></div>'}

function render(){
  var t=D.tiles;
  var h='<div class="tiles">'
   +tile(t.avail.toLocaleString(),'On the shelf','g')
   +tile(t.onhire.toLocaleString(),'Out with crews')
   +tile(t.lines.toLocaleString(),'Different things')
   +tile(t.chase,'Chase up','a')
   +tile(t.stockPct+'%','Counted in 7 days','g')
   +tile(t.stale,'Not counted','r')
   +'</div>'
   +'<div class="tabs">'
   +'<button class="tab on" data-p="groups" onclick="tab(this)">Product groups</button>'
   +'<button class="tab" data-p="chase" onclick="tab(this)">Chase up ('+t.chase+')</button>'
   +'<button class="tab" data-p="stock" onclick="tab(this)">Stocktake</button>'
   +'<button class="tab" data-p="aisle" onclick="tab(this)">Walk an aisle</button>'
   +'<button class="tab" data-p="idle" onclick="tab(this)">Idle plant ('+t.idle+')</button>'
   +'</div>'
   +'<div class="pane on" id="p-groups">'+paneGroups()+'</div>'
   +'<div class="pane" id="p-chase">'+paneChase()+'</div>'
   +'<div class="pane" id="p-stock">'+paneStock()+'</div>'
   +'<div class="pane" id="p-aisle">'+paneAisle()+'</div>'
   +'<div class="pane" id="p-idle">'+paneIdle()+'</div>'
   +'<div class="foot">Built from this morning\\'s SiteIQ exports &middot; '
   +'read-only &middot; POWERED BY SITEIQ<br>Author: Andrew Fisher</div>';
  document.getElementById('app').innerHTML=h;
}
function tab(el){
  var all=document.querySelectorAll('.tab');
  for(var i=0;i<all.length;i++) all[i].className='tab';
  el.className='tab on';
  var panes=document.querySelectorAll('.pane');
  for(var j=0;j<panes.length;j++) panes[j].className='pane';
  document.getElementById('p-'+el.getAttribute('data-p')).className='pane on';
  window.scrollTo(0,0);
}
function paneGroups(){
  var cats={};
  D.groups.forEach(function(g){ (cats[g.c]=cats[g.c]||[]).push(g); });
  var h='<input class="srch" id="gq" placeholder="Search everything the store holds" '
       +'oninput="filterGroups()">' + '<div id="glist">';
  Object.keys(cats).sort().forEach(function(c){
    var list=cats[c], av=0, oh=0;
    list.forEach(function(g){av+=g.av;oh+=g.oh});
    var tot=av+oh||1;
    h+='<div class="grp" data-cat="'+esc(c)+'">'
      +'<button type="button" onclick="tog(this)">'
      +'<div class="gn"><b>'+esc(c)+'</b><span>'+list.length+' different things</span></div>'
      +'<div class="gq"><b>'+av+'</b><span>on shelf</span></div>'
      +'<div class="gq"><b style="color:var(--org)">'+oh+'</b><span>out</span></div>'
      +'</button>'
      +'<div class="bar"><i class="ba" style="width:'+(100*av/tot)+'%"></i>'
      +'<i class="bo" style="width:'+(100*oh/tot)+'%"></i></div>'
      +'<div class="kids">'+list.map(kid).join('')+'</div></div>';
  });
  return h+'</div>';
}
function kid(g){
  var units=Object.keys(g.u||{}).map(function(u){return u+' ('+g.u[u]+')'}).join(' &middot; ');
  var who='';
  if(g.who && g.who.length){
    who='<div class="kw">'+g.who.slice(0,12).map(function(w){
      return '<b>'+esc(w.w)+'</b> &middot; '+esc(w.co)
        +(w.d==null?'':' &middot; '+w.d+(w.d===1?' day':' days')+' out');
    }).join('<br>')+(g.who.length>12?'<br>+ '+(g.who.length-12)+' more':'')+'</div>';
  }
  return '<div class="kid"><div class="kt"><b>'+esc(g.n)+'</b>'
    +'<em>'+g.av+' free</em>'+(g.oh?'<em class="o">'+g.oh+' out</em>':'')+'</div>'
    +(units?'<div class="where">'+esc(units)+'</div>':'')+who+'</div>';
}
function tog(b){
  var k=b.parentNode.querySelector('.kids');
  k.className = k.className.indexOf('on')>=0 ? 'kids' : 'kids on';
}
function filterGroups(){
  var q=(document.getElementById('gq').value||'').toLowerCase().trim();
  var grps=document.querySelectorAll('#glist .grp');
  for(var i=0;i<grps.length;i++){
    var g=grps[i], txt=g.textContent.toLowerCase();
    var hit=!q||txt.indexOf(q)>=0;
    g.style.display=hit?'':'none';
    if(q&&hit) g.querySelector('.kids').className='kids on';
  }
}
function paneChase(){
  var c=D.chase;
  var h='<div class="note"><b>Gear out longer than three days.</b> Walk the aisle, '
   +'check the shelf, then chase the name. Site plant, barriers and chutes are '
   +'listed separately below &mdash; they live on site by design and are not lost.</div>';
  h+='<div class="uhead">Tools to chase &mdash; '+c.tools.length+'</div>';
  var byU={};
  c.tools.forEach(function(x){(byU[x.u]=byU[x.u]||[]).push(x)});
  c.toolUnits.forEach(function(p){
    var u=p[0], list=byU[u]||[];
    h+='<div class="grp"><button type="button" onclick="tog(this)">'
      +'<div class="gn"><b>'+esc(u)+'</b><span>go and look here</span></div>'
      +'<div class="gq"><b style="color:var(--am)">'+list.length+'</b><span>items</span></div>'
      +'</button><div class="kids">'
      +list.map(function(x){
        return '<div class="kid"><div class="kt"><b>'+esc(x.n)+'</b>'
          +'<em class="o">'+x.d+' days</em></div>'
          +'<div class="kw"><b>'+esc(x.w)+'</b> &middot; '+esc(x.co)+'</div></div>';
      }).join('')+'</div></div>';
  });
  h+='<div class="uhead">Site plant, barriers &amp; chutes &mdash; '+c.plant.length
    +' (normal)</div><div class="note">Out for days because that is where they '
    +'live. Kept out of the chase list so it stays worth reading.</div>';
  return h;
}
function paneStock(){
  var s=D.stock, t=D.tiles;
  var h='<div class="ring"><div class="rv">'+t.stockPct+'%</div>'
   +'<div class="rt"><b>of the store counted in the last 7 days</b>'
   +s.w1.toLocaleString()+' counted in the last day &middot; '
   +s.w3.toLocaleString()+' in three &middot; '+s.total.toLocaleString()+' on the register'
   +'</div></div>';
  h+='<div class="note"><b>'+s.stale.length+' assets have not been laid eyes on '
   +'in over a week.</b> That is the missing-asset hunt list &mdash; grouped by '
   +'where they are meant to live, so you can walk it.</div>';
  var byU={};
  s.stale.forEach(function(x){(byU[x.u]=byU[x.u]||[]).push(x)});
  Object.keys(byU).sort(function(a,b){return byU[b].length-byU[a].length})
   .forEach(function(u){
    var list=byU[u];
    h+='<div class="grp"><button type="button" onclick="tog(this)">'
      +'<div class="gn"><b>'+esc(u)+'</b><span>not counted in 7 days</span></div>'
      +'<div class="gq"><b style="color:var(--rd)">'+list.length+'</b><span>assets</span></div>'
      +'</button><div class="kids">'
      +list.slice(0,60).map(function(x){
        return '<div class="kid"><div class="kt"><b>'+esc(x.n)+'</b>'
          +'<em class="o">'+x.d+' days</em></div>'
          +(x.by?'<div class="kw">last sighted by <b>'+esc(x.by)+'</b></div>':'')+'</div>';
      }).join('')+(list.length>60?'<div class="kw">+ '+(list.length-60)+' more</div>':'')
      +'</div></div>';
  });
  return h;
}
/* WALK AN AISLE - one screen per aisle, for a bloke standing in it.
   Everything about that aisle in one place: what should be on the shelf,
   what is out, what to chase, what has not been counted. He is holding
   the phone in the aisle, so the aisle is the unit of thought - not the
   product group. (Andrew, 29 Jul 2026: "when we walk the aisle, be good
   to click on it and it gives you the detailed list of what you're
   looking for and in which aisle") */
function paneAisle(){
  var A={};
  function slot(u){ return A[u]=A[u]||{shelf:[],out:[],chase:[],stale:[]}; }
  D.groups.forEach(function(g){
    Object.keys(g.u||{}).forEach(function(u){
      slot(u).shelf.push({n:g.n,q:g.u[u]});
    });
    (g.who||[]).forEach(function(w){ slot(w.u).out.push({n:g.n,w:w.w,co:w.co,d:w.d}); });
  });
  D.chase.tools.forEach(function(x){ slot(x.u).chase.push(x); });
  D.chase.plant.forEach(function(x){ slot(x.u).chase.push(x); });
  (D.stock.stale||[]).forEach(function(x){ slot(x.u).stale.push(x); });

  var h='<div class="note"><b>Pick the aisle you are standing in.</b> '
   +'Everything about it in one place &mdash; what should be on the shelf, '
   +'what is out, what to chase, and what has not been counted.</div>';
  Object.keys(A).sort(function(a,b){
    return (A[b].shelf.length+A[b].chase.length)-(A[a].shelf.length+A[a].chase.length);
  }).forEach(function(u){
    var a=A[u];
    var onShelf=a.shelf.reduce(function(s,x){return s+x.q},0);
    h+='<div class="grp"><button type="button" onclick="tog(this)">'
      +'<div class="gn"><b>'+esc(u)+'</b><span>'+a.shelf.length+' lines &middot; '
      +a.out.length+' out</span></div>'
      +'<div class="gq"><b>'+onShelf+'</b><span>on shelf</span></div>'
      +(a.chase.length?'<div class="gq"><b style="color:var(--am)">'+a.chase.length
        +'</b><span>chase</span></div>':'')
      +(a.stale.length?'<div class="gq"><b style="color:var(--rd)">'+a.stale.length
        +'</b><span>uncounted</span></div>':'')
      +'</button><div class="kids">';
    if(a.chase.length){
      h+='<div class="uhead">Look for these first &mdash; out over 3 days</div>';
      h+=a.chase.slice(0,40).map(function(x){
        return '<div class="kid"><div class="kt"><b>'+esc(x.n)+'</b>'
          +'<em class="o">'+x.d+' days</em></div>'
          +'<div class="kw"><b>'+esc(x.w)+'</b> &middot; '+esc(x.co)+'</div></div>';
      }).join('');
    }
    if(a.stale.length){
      h+='<div class="uhead">Not counted in over a week</div>';
      h+=a.stale.slice(0,40).map(function(x){
        return '<div class="kid"><div class="kt"><b>'+esc(x.n)+'</b>'
          +'<em class="o">'+x.d+' days</em></div></div>';
      }).join('');
    }
    h+='<div class="uhead">Should be on this shelf</div>';
    h+=a.shelf.sort(function(x,y){return y.q-x.q}).slice(0,80).map(function(x){
      return '<div class="kid"><div class="kt"><b>'+esc(x.n)+'</b>'
        +'<em>'+x.q+'</em></div></div>';
    }).join('');
    if(a.shelf.length>80) h+='<div class="kw">+ '+(a.shelf.length-80)+' more lines</div>';
    h+='</div></div>';
  });
  return h;
}
function paneIdle(){
  var h='<div class="note"><b>Held by the site plant pool.</b> On charge, on site, '
   +'not out with a crew &mdash; the cost-saving watch list.</div>';
  var byU={};
  D.idle.forEach(function(x){(byU[x.u]=byU[x.u]||[]).push(x)});
  Object.keys(byU).sort(function(a,b){return byU[b].length-byU[a].length})
   .forEach(function(u){
    var list=byU[u];
    h+='<div class="grp"><button type="button" onclick="tog(this)">'
      +'<div class="gn"><b>'+esc(u)+'</b><span>idle but on charge</span></div>'
      +'<div class="gq"><b>'+list.length+'</b><span>items</span></div>'
      +'</button><div class="kids">'
      +list.slice(0,60).map(function(x){
        return '<div class="kid"><div class="kt"><b>'+esc(x.n)+'</b>'
          +(x.d==null?'':'<em class="o">'+x.d+' days</em>')+'</div></div>';
      }).join('')+'</div></div>';
  });
  return h;
}
</script></body></html>"""


def build(data, code, asof):
    """The finished, gated page. The code never appears in the file."""
    blob = json.dumps(data, separators=(',', ':'), ensure_ascii=True)
    return (PAGE.replace('__PAYLOAD__', enc(code, blob))
                .replace('__TAG__', tag(code))
                .replace('__ASOF__', asof or 'this morning'))
