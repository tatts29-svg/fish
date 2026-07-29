#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | MY GEAR - WHAT'S IN THE STORE
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 29 Jul 2026): "a what's available in the tool store -
#  consumables and rental - a really defined list of what is available
#  for hire. saves them waiting and then being told no. so easy to look
#  for something a baby can do it and find it."
#
#  The honest shape of it:
#
#  AVAILABLE means SiteIQ's own word. RENTAL_STOCK carries ITEM_STATUS,
#  and "Available for Hire" is SiteIQ saying the item is on the shelf -
#  we never infer it from a missing hirer name, and we never estimate.
#
#  A ZERO IS AS USEFUL AS A NUMBER. "None right now" saves the same walk
#  as "yes, four of them" - so out-of-stock lines are shown, not hidden.
#
#  IT IS A MORNING SNAPSHOT, NOT A LIVE FEED. The page is built once a
#  day from that morning's export. If a bloke reads "4 available" at ten
#  o'clock and three went at eight, we have made his day worse and he
#  will never trust the page again. So every single line carries the
#  time it was true, and the page says plainly: ring the store to have
#  one put aside. Under-promise here, over-deliver at the counter.
#
#  BROWSE THE WAY THE STORE IS LAID OUT. SiteIQ's STORAGE_UNIT is where
#  the thing physically lives - Tooling, Electrical, Rigging, Welding,
#  Air, Radios. Those are the aisles, so those are the buttons. Nobody
#  has to learn a menu; they walk the store with their thumb.
# =====================================================================
import os
import re

#  Quantities come out of SALES_STOCK as TEXT ("10", "0"), not numbers.
#  Read as numbers they silently become nothing, and every consumable
#  reads "none left" - which is the exact wrong answer, and a confident
#  one. (Found 29 Jul 2026.)
def _qty(v):
    try:
        return int(float(str(v).strip().replace(',', '')))
    except (TypeError, ValueError):
        return None


AVAILABLE = 'available for hire'

#  The aisles, in the order a person walks them, with the icon each one
#  wears on the poster and the cabinet tiles. Anything SiteIQ files
#  under a unit we don't know still shows - it lands in "Elsewhere"
#  rather than disappearing.
UNITS = [
    ('Tooling',      'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 '
                     '5.4-5.4l-2.6 2.6-2.4-2.4z'),
    ('Electrical',   'M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V8zM12 16v5'),
    ('Rigging',      'M12 3v6M12 9l-5 8h10l-5-8zM5 21h14'),
    ('Welding',      'M3 15h7l3-9 3 6h5M6 21h12'),
    ('Air',          'M4 12h10a3 3 0 1 0-3-3M4 17h8a2.5 2.5 0 1 1-2.5 2.5'),
    ('Radios',       'RECT:8,7,8,14,2|M12 7V2M12 2l3 2M10.5 11h3M10.5 14h3'),
    ('Gas Monitors', 'RECT:7,5,10,16,2.5|M9.5 2.5h5'),
    ('Hydraulics',   'M4 10h9l3-4h4v12h-4l-3-4H4zM7 10v4'),
    ('Laydown',      'M3 19h18M6 19v-6h5v6M13 19v-9h5v9'),
    ('Safety',       'M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z'),
    ('Cement Plant', 'M3 20h18M5 20V9l5-3v14M14 20V11l5-2v11'),
]

#  Gear that must never be offered. SiteIQ keeps retired assets on the
#  register with the reason written into the description; a catalogue
#  that offers a bloke an OBSOLETE socket has cost him the walk it was
#  meant to save. (29 Jul 2026)
#  Each marker must be unambiguous. A bare 'SCRAP' would quietly hide
#  every SCRAPER in the store, and a catalogue that silently drops real
#  gear is worse than one that shows a retired socket.
NEVER_OFFER = ('OBSOLETE', 'DO NOT USE', 'DO NOT HIRE', 'SCRAPPED',
               'WRITTEN OFF', 'QUARANTINE', 'FAULTY', 'OUT OF SERVICE')


def _offerable(desc):
    u = (desc or '').upper()
    return not any(m in u for m in NEVER_OFFER)


def _icon(spec, size=22):
    body = ''
    for part in spec.split('|'):
        if part.startswith('RECT:'):
            x, y, w, h, r = part[5:].split(',')
            body += ("<rect x='{}' y='{}' width='{}' height='{}' rx='{}'/>"
                     .format(x, y, w, h, r))
        else:
            body += "<path d='{}'/>".format(part)
    return ("<svg viewBox='0 0 24 24' width='{s}' height='{s}' fill='none' "
            "stroke='currentColor' stroke-width='1.8' stroke-linecap='round' "
            "stroke-linejoin='round'>{b}</svg>").format(s=size, b=body)


def _unit_of(raw):
    """Map SiteIQ's storage unit onto one of the aisles above."""
    s = (raw or '').strip().lower()
    if not s:
        return 'Elsewhere'
    for name, _p in UNITS:
        if name.lower() in s:
            return name
    if 'hi torque' in s or 'hydraulic' in s:
        return 'Hydraulics'
    if 'gas' in s:
        return 'Gas Monitors'
    if 'safety' in s:
        return 'Safety'
    #  the client's own gear the store looks after - kept visible, but
    #  named honestly so nobody thinks it is Coates hire stock
    if 'cement' in s or 'site plant' in s or 'own equipment' in s:
        return 'Cement Plant'
    return 'Elsewhere'


def _tidy(desc, master=None, item_number=''):
    """The plain-English name if the master file has one, else SiteIQ's.

    The master is keyed on ITEM_NUMBER, so the number has to be handed
    over - without it every lookup misses and the crews get SiteIQ's
    raw wording instead of the 4,400-odd names Andrew has renamed."""
    d = (desc or '').strip()
    if master is not None:
        try:
            d = master.disp(item_number, d) or d
        except Exception:
            pass
    #  SiteIQ writes consumables in SHOUTING CAPS with the size trailing
    #  after a dash. Title-case reads better on a phone; the detail is
    #  kept, never trimmed away.
    if d.isupper() and len(d) > 6:
        d = d.title().replace(' - ', ' - ')
    return re.sub(r'\s{2,}', ' ', d).strip()


# ---------------------------------------------------------------------
#  READ - what is actually on the shelf this morning
# ---------------------------------------------------------------------
def read_availability(rental_path, sales_path, master=None):
    """Returns {'hire': [...], 'cons': [...], 'stats': {...}}.

    Every line: name, how many, which aisle. Nothing inferred."""
    import openpyxl
    hire, cons = {}, {}

    if rental_path and os.path.isfile(rental_path):
        wb = openpyxl.load_workbook(rental_path, read_only=True, data_only=True)
        ws = wb['RENTAL_STOCK'] if 'RENTAL_STOCK' in wb.sheetnames else wb.active
        rows = ws.iter_rows(values_only=True)
        hdr = [str(c or '').strip() for c in next(rows)]
        ix = {h: i for i, h in enumerate(hdr) if h}
        need = {'ITEM_STATUS', 'ITEM_DESCRIPTION', 'STORAGE_UNIT'}
        if need <= set(ix):
            for r in rows:
                if not r:
                    continue
                status = str(r[ix['ITEM_STATUS']] or '').strip().lower()
                if status != AVAILABLE:
                    continue          # SiteIQ's word, never our guess
                raw = r[ix['ITEM_DESCRIPTION']]
                if not _offerable(raw):
                    continue          # retired, faulty or written off
                name = _tidy(raw, master,
                             r[ix['ITEM_NUMBER']] if 'ITEM_NUMBER' in ix else '')
                if not name or not _offerable(name):
                    continue
                unit = _unit_of(r[ix['STORAGE_UNIT']])
                k = (name, unit)
                hire[k] = hire.get(k, 0) + 1
        wb.close()

    if sales_path and os.path.isfile(sales_path):
        wb = openpyxl.load_workbook(sales_path, read_only=True, data_only=True)
        ws = wb['SALES_STOCK'] if 'SALES_STOCK' in wb.sheetnames else wb.active
        rows = ws.iter_rows(values_only=True)
        hdr = [str(c or '').strip() for c in next(rows)]
        ix = {h: i for i, h in enumerate(hdr) if h}
        if {'SKU_DESCRIPTION', 'AVAILABLE_QUANTITY'} <= set(ix):
            hcol = ix.get('HIRER')
            for r in rows:
                if not r:
                    continue
                #  a line against a person's name is gear they have taken,
                #  not the shelf - the store's own line has no hirer
                if hcol is not None and str(r[hcol] or '').strip():
                    continue
                if not _offerable(r[ix['SKU_DESCRIPTION']]):
                    continue
                name = _tidy(r[ix['SKU_DESCRIPTION']], master)
                q = _qty(r[ix['AVAILABLE_QUANTITY']])
                if not name or q is None:
                    continue
                unit = _unit_of(r[ix['STORAGE_UNIT']]) if 'STORAGE_UNIT' in ix \
                    else 'Consumables'
                k = (name, 'Consumables' if unit == 'Elsewhere' else unit)
                cons[k] = cons.get(k, 0) + q
        wb.close()

    def pack(d, kind):
        out = []
        for (name, unit), n in d.items():
            out.append({'n': name, 'u': unit, 'q': int(n), 'k': kind})
        out.sort(key=lambda x: x['n'].lower())
        return out

    H, C = pack(hire, 'h'), pack(cons, 'c')
    stats = {
        'hireItems': sum(x['q'] for x in H),
        'hireLines': len(H),
        'hireSingles': sum(1 for x in H if x['q'] == 1),
        'consLines': len([x for x in C if x['q'] > 0]),
        'consUnits': sum(x['q'] for x in C if x['q'] > 0),
        'consOut': len([x for x in C if x['q'] == 0]),
        'consLow': len([x for x in C if 0 < x['q'] <= 5]),
    }
    return {'hire': H, 'cons': C, 'stats': stats}


# ---------------------------------------------------------------------
#  THE SCREEN
# ---------------------------------------------------------------------
CSS = """
/* ---- WHAT'S IN THE STORE ---------------------------------------- */
.stwrap{padding:2px 0 26px}
.stnote{background:#171B22;border:1px solid #2A313C;border-left:4px solid var(--org);
  border-radius:12px;padding:12px 14px;margin:0 0 14px;font-size:13px;
  line-height:1.6;color:#C7CED8}
.stnote b{color:#fff}
.stsearch{position:sticky;top:0;z-index:5;background:#0A0E14;padding:8px 0 10px;
  margin:0 0 4px}
.stsearch input{width:100%;background:#171B22;border:1.5px solid #2A313C;
  color:#fff;font-family:inherit;font-size:17px;padding:15px 15px 15px 44px;
  border-radius:13px;-webkit-appearance:none}
.stsearch input:focus{outline:none;border-color:var(--org)}
.stsearch{position:relative}
.stsearch svg{position:absolute;left:14px;top:23px;width:19px;height:19px;
  color:#7B8798;pointer-events:none}
.stcats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:4px 0 14px}
.stcat{background:#151A22;border:1px solid #2A313C;border-radius:12px;
  padding:12px 6px 10px;text-align:center;color:var(--org);cursor:pointer;
  font-family:inherit;min-height:74px}
.stcat.on{border-color:var(--org);background:#1E1710}
.stcat b{display:block;color:#EAF0F7;font-size:11.5px;font-weight:800;
  letter-spacing:.4px;margin-top:5px}
.stcat span{display:block;color:#8A97A8;font-size:11px;font-weight:700;
  margin-top:2px}
.strow{display:flex;align-items:center;gap:12px;background:#151A22;
  border:1px solid #2A313C;border-left:4px solid #2BB673;border-radius:12px;
  padding:12px 13px;margin-bottom:8px;min-height:60px}
.strow.few{border-left-color:#F5A623}
.strow.none{border-left-color:#E23B2E;opacity:.72}
.strow .stn{flex:1;min-width:0}
.strow .stn b{display:block;font-size:14.5px;font-weight:700;color:#EAF0F7;
  line-height:1.35}
.strow .stn span{display:block;font-size:11.5px;color:#8A97A8;margin-top:3px;
  font-weight:700;letter-spacing:.4px;text-transform:uppercase}
.strow .stq{flex:none;text-align:right;min-width:74px}
.strow .stq b{display:block;font-size:21px;font-weight:900;color:#2BB673;
  line-height:1}
.strow.few .stq b{color:#F5A623}
.strow.none .stq b{color:#E23B2E;font-size:14px;padding-top:4px}
.strow .stq span{display:block;font-size:9.5px;color:#7B8798;font-weight:800;
  letter-spacing:.9px;text-transform:uppercase;margin-top:3px}
.stmore{display:block;width:100%;background:transparent;border:1px solid #2A313C;
  color:#A9B3C0;font-family:inherit;font-weight:800;font-size:13px;
  letter-spacing:.6px;text-transform:uppercase;padding:14px;border-radius:12px;
  margin-top:6px;min-height:48px}
.stcount{font-size:11.5px;color:#8A97A8;font-weight:800;letter-spacing:.8px;
  text-transform:uppercase;margin:2px 2px 9px}
.stnil{text-align:center;color:#8A97A8;font-size:14px;padding:26px 10px;
  line-height:1.7}
.stnil b{display:block;color:#fff;font-size:16px;margin-bottom:6px}
@media (prefers-reduced-motion:no-preference){
  .strow{animation:strise .26s ease both}
  @keyframes strise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
}
"""

JS = """
/* ---- WHAT'S IN THE STORE: search and aisles ----------------------
   Deliberately dumb to use: one box, big buttons, three colours.
   Typing beats browsing for the bloke who knows what he wants;
   the aisles are there for the one who doesn't. */
var STORE_SHOWN = 60;
function stNorm(s){ return (s||'').toLowerCase().replace(/[^a-z0-9 ]+/g,' '); }
function stRender(reset){
  var box = document.getElementById('st-list'); if(!box) return;
  if(reset) STORE_SHOWN = 60;
  var term = stNorm((document.getElementById('st-q')||{}).value);
  var words = term.split(/\\s+/).filter(function(w){return w.length>1;});
  var cat = window.ST_CAT || 'All';
  var hits = STORE.filter(function(it){
    if(cat !== 'All' && it.u !== cat) return false;
    if(!words.length) return true;
    var hay = stNorm(it.n + ' ' + it.u);
    for(var i=0;i<words.length;i++) if(hay.indexOf(words[i])<0) return false;
    return true;
  });
  var head = document.getElementById('st-count');
  if(head){
    head.textContent = hits.length ? (hits.length + (hits.length===1?' thing':' things')
      + (cat==='All'?'':' in ' + cat)) : '';
  }
  if(!hits.length){
    box.innerHTML = '<div class="stnil"><b>Nothing matches that</b>'
      + 'Try a shorter word &mdash; <b style="display:inline">grinder</b>, '
      + '<b style="display:inline">batt</b>, <b style="display:inline">hose</b>. '
      + 'Or ask at the counter, the store carries more than the shelf shows.</div>';
    return;
  }
  var slice = hits.slice(0, STORE_SHOWN), html = '';
  for(var i=0;i<slice.length;i++){
    var it = slice[i];
    var cls = it.q === 0 ? 'none' : (it.q <= 3 ? 'few' : '');
    var big = it.q === 0 ? 'NONE' : it.q;
    var lab = it.q === 0 ? 'right now' : (it.k === 'c' ? 'on the shelf' : 'ready to hire');
    html += '<div class="strow ' + cls + '" style="animation-delay:'
      + Math.min(i*14,280) + 'ms">'
      + '<div class="stn"><b>' + it.n + '</b><span>' + it.u + '</span></div>'
      + '<div class="stq"><b>' + big + '</b><span>' + lab + '</span></div></div>';
  }
  box.innerHTML = html;
  var more = document.getElementById('st-more');
  if(more){
    if(hits.length > STORE_SHOWN){
      more.style.display = 'block';
      more.textContent = 'Show ' + Math.min(60, hits.length - STORE_SHOWN)
        + ' more of ' + hits.length;
    } else { more.style.display = 'none'; }
  }
}
function stCat(name, el){
  window.ST_CAT = name;
  var all = document.querySelectorAll('.stcat');
  for(var i=0;i<all.length;i++) all[i].className = 'stcat';
  if(el) el.className = 'stcat on';
  stRender(true);
  var b = document.getElementById('gsbody'); if(b) b.scrollTop = 0;
}
function stMore(){ STORE_SHOWN += 60; stRender(false); }
"""


def pane(data, asof):
    """The whole screen, ready to drop in as a guide pane."""
    st = data['stats']
    cats = ''
    counts = {}
    for it in data['hire'] + data['cons']:
        counts[it['u']] = counts.get(it['u'], 0) + 1
    cats += ("<button class='stcat on' type='button' "
             "onclick=\"stCat('All',this)\">" + _icon(
                 'M4 6h16M4 12h16M4 18h16') +
             "<b>EVERYTHING</b><span>{}</span></button>".format(
                 len(data['hire']) + len(data['cons'])))
    for name, path in UNITS:
        if not counts.get(name):
            continue
        cats += ("<button class='stcat' type='button' onclick=\"stCat('{n}',this)\">"
                 "{i}<b>{u}</b><span>{c}</span></button>".format(
                     n=name, u=name.upper(), i=_icon(path), c=counts[name]))
    for extra in ('Consumables', 'Elsewhere'):
        if counts.get(extra):
            cats += ("<button class='stcat' type='button' "
                     "onclick=\"stCat('{n}',this)\">{i}<b>{u}</b>"
                     "<span>{c}</span></button>".format(
                         n=extra, u=extra.upper(), i=_icon('M5 8h14v11H5zM9 8V5h6v3'),
                         c=counts[extra]))

    mag = ("<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' "
           "stroke-width='2' stroke-linecap='round'><circle cx='11' cy='11' "
           "r='7'/><path d='M20 20l-3.5-3.5'/></svg>")

    return (
        "<div class='stwrap'>"
        "<div class='stnote'>Everything the store had on the shelf "
        "<b>as at {asof}</b>. It is this morning's count, not a live one "
        "&mdash; if it matters, ring the store and we'll put one aside "
        "before you walk down.</div>"
        "<div class='stsearch'>{mag}<input id='st-q' type='search' "
        "inputmode='search' autocomplete='off' "
        "placeholder='Type what you need &mdash; grinder, batt, hose' "
        "oninput='stRender(true)' aria-label='Search the store'></div>"
        "<div class='stcats'>{cats}</div>"
        "<div class='stcount' id='st-count'></div>"
        "<div id='st-list'></div>"
        "<button class='stmore' id='st-more' type='button' onclick='stMore()' "
        "style='display:none'>Show more</button>"
        "</div>"
    ).format(asof=asof or 'this morning', cats=cats, mag=mag)
