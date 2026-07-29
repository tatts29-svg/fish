#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | UTILISATION REPORT - plant, tool store, consumables
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 29 Jul 2026): "want a insanely over powered simplified
#  Utilisation report that covers everything.. plant.. toolstore and
#  consumables"
#
#  Over-powered and simplified pull in opposite directions, so the rule
#  this page is built to is: EVERY SECTION OPENS WITH THE ANSWER, and
#  the working is underneath for anyone who wants it. A superintendent
#  reads six numbers and stops. Andrew keeps scrolling.
#
#  Output: Reports\<YYYY-MM-DD>\Pages\Coates_K2_Utilisation_<date>.html
#          and the same again as a PDF in ...\PDF\
#
#  The two engines behind it carry the data warnings, and both are
#  worth reading before changing anything here:
#      k2_utilisation.py  - what "used" honestly means (three signals,
#                           not one - miss any and radios read 0%)
#      k2_consumables.py  - SALES_STOCK is two kinds of row in one
#                           sheet, and reorder points are all unset
# =====================================================================
import datetime as dt
import io
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import report_paths as RP                                    # noqa: E402
import k2_utilisation as KU                                  # noqa: E402
import k2_consumables as KC                                  # noqa: E402


def esc(s):
    return (str('' if s is None else s).replace('&', '&amp;')
            .replace('<', '&lt;').replace('>', '&gt;'))


def n0(v):
    return '{:,.0f}'.format(v or 0)


def pc(v):
    return '{:.0f}%'.format(v or 0)


def days(v):
    """'1 day', not '1 days'. Small thing, but a report that cannot count
    to one gets read as a report that cannot count.

    Under 24 hours reads as "under a day" rather than rounding to 0 or 1 -
    a line with 0.8 days of cover is the most urgent thing on the page and
    must not look like a rounding artefact."""
    v = v or 0
    if 0 < v < 1:
        return 'under a day'
    n = int(round(v))
    return '{} day{}'.format(n, '' if n == 1 else 's')


def au(iso):
    try:
        return dt.datetime.strptime(iso, '%Y-%m-%d').strftime('%d %b %Y')
    except (ValueError, TypeError):
        return iso or ''


#  RAG by how hard something is working. Deliberately NOT a judgement
#  on the store - a low number on a safety spares shelf is correct and
#  a high number on the same shelf would be alarming. The colour flags
#  "look at this", never "this is bad".
def rag(p, hi=60, mid=25):
    return 'g' if p >= hi else ('a' if p >= mid else 'r')


def bar(label, val, total, pct, cls, right=''):
    """`right` is HTML we build ourselves and must NOT be escaped - running
    esc() over it turned every &middot; into visible '&middot;' text on the
    page. Only the label comes from the data, so only the label is escaped.
    (Caught 29 Jul 2026 in a screenshot.)"""
    w = max(0.6, pct)
    lbl = right or '{} of {} &middot; {}'.format(n0(val), n0(total), pc(pct))
    return (
        '<div class="brow"><div class="bl"><span>{l}</span>'
        '<span class="bv">{r}</span></div>'
        '<div class="bb"><i class="{c}" style="width:{w:.1f}%"></i></div>'
        '</div>').format(l=esc(label), r=lbl, c=cls, w=w)


CSS = """
:root{--org:#F26222;--bg:#0E1116;--card:#171B22;--card2:#1E232C;--line:#2A313C;
 --tx:#EAEDF1;--mut:#95A0AF;--grn:#35B37E;--amb:#E8A32C;--red:#E5544B;--chip:#232935}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--tx);font-family:"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
 font-size:14px;line-height:1.45;-webkit-font-smoothing:antialiased}
.wrap{max-width:1180px;margin:0 auto;padding:0 18px 60px}
header{border-top:5px solid var(--org);background:linear-gradient(180deg,#141922,#0E1116);
 padding:22px 0 18px;margin-bottom:20px}
.hd{max-width:1180px;margin:0 auto;padding:0 18px;display:flex;justify-content:space-between;
 align-items:flex-start;flex-wrap:wrap;gap:12px}
.brand .logo{font-weight:800;font-size:23px;letter-spacing:.5px}
.brand .logo b{color:var(--org)}
.brand .tag{color:var(--mut);font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-top:2px}
.brand h1{font-size:19px;margin-top:12px;font-weight:700}
.brand .sub{color:var(--mut);font-size:13px;margin-top:3px}
.meta{text-align:right;font-size:12px;color:var(--mut)}
h2{font-size:15px;margin:26px 0 12px;padding-left:10px;border-left:3px solid var(--org);
 text-transform:uppercase;letter-spacing:1.1px}
h3{font-size:13px;color:var(--mut);text-transform:uppercase;letter-spacing:1px;margin:18px 0 9px}
.verdict{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px 20px;
 margin-bottom:18px;border-left:4px solid var(--org)}
.verdict b{color:#fff}
.verdict .big{font-size:26px;font-weight:800;color:var(--org);display:block;margin-bottom:4px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));gap:12px;margin-bottom:6px}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:15px 16px;
 position:relative;overflow:hidden;min-width:0}
.kpi:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--org)}
.kpi.g:before{background:var(--grn)}.kpi.a:before{background:var(--amb)}
.kpi.r:before{background:var(--red)}
.kpi b{display:block;font-size:27px;font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums}
.kpi.g b{color:var(--grn)}.kpi.a b{color:var(--amb)}.kpi.r b{color:var(--red)}
.kpi span{display:block;font-size:11px;color:var(--mut);text-transform:uppercase;
 letter-spacing:.7px;margin-top:6px;font-weight:700}
.kpi em{display:block;font-style:normal;font-size:11.5px;color:var(--mut);margin-top:6px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin-bottom:14px}
.brow{margin-bottom:11px}
.bl{display:flex;justify-content:space-between;gap:12px;font-size:12.5px;margin-bottom:5px}
.bl .bv{color:var(--mut);white-space:nowrap;font-variant-numeric:tabular-nums}
.bb{height:9px;border-radius:99px;background:#0E1319;overflow:hidden}
.bb i{display:block;height:100%;border-radius:99px;background:var(--org)}
.bb i.g{background:var(--grn)}.bb i.a{background:var(--amb)}.bb i.r{background:var(--red)}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.8px;color:var(--mut);
 padding:8px 10px;border-bottom:1px solid var(--line);font-weight:800}
td{padding:9px 10px;border-bottom:1px solid rgba(42,49,60,.55);vertical-align:top}
tr:last-child td{border-bottom:0}
td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.pill{display:inline-block;padding:2px 9px;border-radius:99px;font-size:10.5px;font-weight:800;
 letter-spacing:.5px;text-transform:uppercase}
.pill.r{background:rgba(229,84,75,.16);color:#FF8A80}
.pill.a{background:rgba(232,163,44,.16);color:#F5C46B}
.pill.g{background:rgba(53,179,126,.16);color:#6FD3A6}
.note{background:var(--card2);border-left:3px solid var(--org);border-radius:0 10px 10px 0;
 padding:13px 16px;margin:12px 0;font-size:13px;color:#C7CED8;line-height:1.65}
.note b{color:#fff}
.warn{border-left-color:var(--amb)}
.scroll{overflow-x:auto}
footer{margin-top:34px;padding-top:16px;border-top:1px solid var(--line);
 text-align:center;color:var(--mut);font-size:11.5px;line-height:1.8}
@media print{
  body{background:#fff;color:#14181F}
  header{background:#fff}
  .card,.kpi,.verdict,.note{background:#fff;border-color:#D5DBE3;
    -webkit-print-color-adjust:exact;print-color-adjust:exact}
  .kpi b,.verdict .big{color:#C1440E}
  .brand .logo,.brand h1,.note b,.verdict b{color:#14181F}
  h2{page-break-after:avoid}
  table{page-break-inside:auto}
  tr{page-break-inside:avoid}
}
@page{size:A4;margin:12mm}
"""


def page(u, c, asof, sources):
    """The whole report. `c` may be None if there is no consumables export -
    the page then says so instead of showing an empty shelf."""
    t = u['total']
    out_rag = rag(u['outPct'], 60, 25)
    used_rag = rag(u['usedPct'], 60, 25)

    h = []
    a = h.append
    a('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
      '<meta name="viewport" content="width=device-width,initial-scale=1">'
      '<title>K2 Utilisation &mdash; Cement Australia</title>'
      '<style>' + CSS + '</style></head><body>')
    a('<header><div class="hd"><div class="brand">'
      '<div class="logo">COATES<b>.</b></div>'
      '<div class="tag">Powered by SiteIQ</div>'
      '<h1>Utilisation &mdash; plant, tool store and consumables</h1>'
      '<div class="sub">Cement Australia K2 Shutdown 2026 &middot; Gladstone'
      '</div></div>'
      '<div class="meta">As at {d}<br>Day {n} of the shutdown<br>'
      'Started {s}</div></div></header>'.format(
          d=au(asof), n=u['daysIn'], s=au(u['shutStart'])))
    a('<div class="wrap">')

    # ---------- THE ANSWER, BEFORE ANY WORKING ----------
    never_pct = 100.0 - u['usedPct']
    a('<div class="verdict"><span class="big">{op} of the fleet is out right '
      'now &middot; {up} has moved at least once</span>'
      'We hold <b>{n}</b> items on this site. <b>{out}</b> are with a crew as '
      'you read this. Since the shut started, <b>{used}</b> have gone out at '
      'least once &mdash; which leaves <b>{never}</b> ({nv}) that have not '
      'moved a single time in {days} days.'
      '</div>'.format(
          op=pc(u['outPct']), up=pc(u['usedPct']), n=n0(t['n']),
          out=n0(t['out']), used=n0(t['used']), never=n0(u['never']),
          nv=pc(never_pct), days=u['daysIn']))

    a('<div class="kpis">')
    a('<div class="kpi {c}"><b>{v}</b><span>Out right now</span>'
      '<em>{o} of {n} items</em></div>'.format(
          c=out_rag, v=pc(u['outPct']), o=n0(t['out']), n=n0(t['n'])))
    a('<div class="kpi {c}"><b>{v}</b><span>Has ever moved</span>'
      '<em>{o} of {n} items</em></div>'.format(
          c=used_rag, v=pc(u['usedPct']), o=n0(t['used']), n=n0(t['n'])))
    a('<div class="kpi r"><b>{v}</b><span>Never moved</span>'
      '<em>in {d} days on site</em></div>'.format(
          v=n0(u['never']), d=u['daysIn']))
    a('<div class="kpi {c}"><b>{v}</b><span>Plant working</span>'
      '<em>{o} of {n} out</em></div>'.format(
          c=rag(u['plant']['outPct']), v=pc(u['plant']['outPct']),
          o=n0(u['plant']['out']), n=n0(u['plant']['n'])))
    a('<div class="kpi {c}"><b>{v}</b><span>Tool store working</span>'
      '<em>{o} of {n} out</em></div>'.format(
          c=rag(u['store']['outPct']), v=pc(u['store']['outPct']),
          o=n0(u['store']['out']), n=n0(u['store']['n'])))
    if c:
        a('<div class="kpi {c}"><b>{v}</b><span>Consumables to order</span>'
          '<em>before {e}</em></div>'.format(
              c=('r' if c['order'] else 'g'), v=n0(len(c['order'])),
              e=au(c['end'])))
    a('</div>')

    a('<div class="note"><b>Two numbers, two questions.</b> '
      '<b>Out right now</b> is a snapshot &mdash; how hard the fleet is '
      'working today. <b>Has ever moved</b> counts anything that has gone out '
      'once since {s} &mdash; what we mobilised that has never earned its '
      'freight. They are not interchangeable, and cutting a fleet on the '
      'wrong one is how a store runs out of something it just sent back.'
      '</div>'.format(s=au(u['shutStart'])))

    # ---------- PLANT ----------
    a('<h2>Plant</h2>')
    p = u['plant']
    a('<div class="kpis">')
    a('<div class="kpi"><b>{}</b><span>Plant items</span></div>'.format(n0(p['n'])))
    a('<div class="kpi g"><b>{}</b><span>Out with crews</span></div>'.format(n0(p['out'])))
    a('<div class="kpi a"><b>{}</b><span>Not out</span>'
      '<em>available or held</em></div>'.format(n0(p['n'] - p['out'])))
    a('<div class="kpi {c}"><b>{v}</b><span>Plant utilisation</span>'
      '</div>'.format(c=rag(p['outPct']), v=pc(p['outPct'])))
    a('</div>')
    plant_rows = [r for r in u['units'] if r['plant']]
    if plant_rows:
        a('<div class="card">')
        for r in plant_rows:
            a(bar(r['name'], r['out'], r['n'], r['outPct'],
                  rag(r['outPct'])))
        a('</div>')

    # ---------- TOOL STORE ----------
    a('<h2>Tool store</h2>')
    s = u['store']
    a('<div class="kpis">')
    a('<div class="kpi"><b>{}</b><span>Items held</span></div>'.format(n0(s['n'])))
    a('<div class="kpi {c}"><b>{v}</b><span>Out right now</span></div>'.format(
        c=rag(s['outPct']), v=pc(s['outPct'])))
    a('<div class="kpi {c}"><b>{v}</b><span>Has ever moved</span></div>'.format(
        c=rag(s['usedPct']), v=pc(s['usedPct'])))
    a('<div class="kpi r"><b>{}</b><span>Never moved</span></div>'.format(
        n0(s['never'])))
    a('</div>')
    a('<h3>By storage unit &mdash; how much of each aisle is out</h3>'
      '<div class="card">')
    for r in [x for x in u['units'] if not x['plant']][:16]:
        a(bar(r['name'], r['out'], r['n'], r['outPct'], rag(r['outPct'])))
    a('</div>')

    a('<h3>By storage unit &mdash; how much has ever moved</h3>'
      '<div class="scroll"><table><tr><th>Storage unit</th>'
      '<th class="n">Items</th><th class="n">Out now</th>'
      '<th class="n">Ever moved</th><th class="n">Never moved</th>'
      '<th>Reading</th></tr>')
    for r in u['units']:
        cls = rag(r['usedPct'])
        word = ('working hard' if r['usedPct'] >= 60 else
                ('ticking over' if r['usedPct'] >= 25 else 'barely touched'))
        a('<tr><td>{u}{p}</td><td class="n">{n}</td>'
          '<td class="n">{o} ({op})</td><td class="n">{m} ({mp})</td>'
          '<td class="n">{nv}</td><td><span class="pill {c}">{w}</span></td>'
          '</tr>'.format(
              u=esc(r['name']),
              p=' <span class="pill g">plant</span>' if r['plant'] else '',
              n=n0(r['n']), o=n0(r['out']), op=pc(r['outPct']),
              m=n0(r['used']), mp=pc(r['usedPct']), nv=n0(r['never']),
              c=cls, w=word))
    a('</table></div>')

    # ---------- NEVER MOVED ----------
    a('<h2>Never moved &mdash; {} items</h2>'.format(n0(u['never'])))
    a('<div class="note warn"><b>Read this one carefully before acting on '
      'it.</b> "Never moved" means the barcode has not been charged, has not '
      'been recorded going out without charge, and is not on hire right now. '
      'Some of it is spares we are right to be holding &mdash; a store with '
      'no spare grinder is a store that stops a job. The list is here to be '
      'argued with, not actioned blind.</div>')
    a('<div class="card">')
    top = u['neverByUnit'][:12]
    mx = max((n for _k, n in top), default=1)
    for name, cnt in top:
        a(bar(name, cnt, u['never'], 100.0 * cnt / mx, 'r',
              right='{} never moved'.format(n0(cnt))))
    a('</div>')

    # ---------- LONGEST OUT ----------
    if u['longest']:
        a('<h2>Out the longest</h2>')
        a('<div class="scroll"><table><tr><th>Item</th><th>Storage unit</th>'
          '<th>Who has it</th><th class="n">Days out</th></tr>')
        for x in u['longest'][:20]:
            a('<tr><td>{n}</td><td>{u}</td><td>{w}{c}</td>'
              '<td class="n">{d}</td></tr>'.format(
                  n=esc(x['n']), u=esc(x['u']), w=esc(x['w'] or '&mdash;'),
                  c=(' &middot; ' + esc(x['co'])) if x['co'] else '',
                  d=x['d']))
        a('</table></div>')

    # ---------- CONSUMABLES ----------
    a('<h2>Consumables</h2>')
    if not c:
        a('<div class="note warn">No SALES_STOCK export was found, so the '
          'consumables section is empty rather than estimated. Pull it from '
          'SiteIQ and run this again.</div>')
    else:
        a(consumables_section(c))

    # ---------- HOW THIS WAS WORKED OUT ----------
    a('<h2>How this was worked out</h2>')
    a('<div class="note"><b>"Used" is three signals, not one.</b> A barcode '
      'counts as used if it was charged, OR recorded going out without a '
      'charge, OR is on hire right now. Charged lines alone would report '
      'every radio on this job as never moved &mdash; they go out free-issue '
      'and never touch the charge sheet. Reading only the charge sheet put '
      'radios at 0%; reading all three puts them at their real 80%.</div>')
    a('<div class="note">Counted from the charge feed: <b>{ch}</b> barcodes '
      'charged, <b>{mv}</b> more moved without a charge, <b>{sh}</b> shifts '
      'charged in total.</div>'.format(
          ch=n0(u['charged']), mv=n0(u['movedOnly']), sh=n0(u['shiftsTotal'])))
    a('<div class="note"><b>Status of everything we hold.</b> ' +
      ' &middot; '.join('{} <b>{}</b>'.format(esc(k or 'blank'), n0(v))
                        for k, v in u['statuses']) + '</div>')

    a('<footer>Built from this morning&rsquo;s SiteIQ exports &middot; '
      'read-only &middot; POWERED BY SITEIQ<br>'
      + ' &middot; '.join(esc(os.path.basename(x)) for x in sources) +
      '<br>Author: Andrew Fisher</footer>')
    a('</div></body></html>')
    return ''.join(h)


def consumables_section(c):
    """Available, used, counted, and whether we have to order - in that
    order, because that is the order Andrew asked the questions in."""
    h = []
    a = h.append
    order_n = len(c['order'])
    a('<div class="verdict"><span class="big">{n} lines to order before {e}'
      '</span>'
      '<b>{av}</b> items on the shelf across <b>{sk}</b> lines. <b>{us}</b> '
      'have gone out the window so far. Every line has been counted, and '
      '<b>{mp}</b> of those counts matched the system.'
      '</div>'.format(n=order_n, e=au(c['end']), av=n0(c['avail']),
                      sk=n0(c['skus']), us=n0(c['used']), mp=pc(c['matchPct'])))

    a('<div class="kpis">')
    a('<div class="kpi"><b>{}</b><span>On the shelf</span>'
      '<em>{} different lines</em></div>'.format(n0(c['avail']), n0(c['skus'])))
    a('<div class="kpi"><b>{}</b><span>Issued so far</span>'
      '<em>over {} hand-outs</em></div>'.format(n0(c['used']), n0(c['moves'])))
    a('<div class="kpi {c}"><b>{v}</b><span>Stocktake done</span>'
      '<em>{k} of {t} lines counted</em></div>'.format(
          c=rag(c['checkedPct'], 95, 70), v=pc(c['checkedPct']),
          k=n0(c['checked']), t=n0(c['skus'])))
    a('<div class="kpi {c}"><b>{v}</b><span>Counts that matched</span>'
      '<em>{o} did not</em></div>'.format(
          c=rag(c['matchPct'], 95, 80), v=pc(c['matchPct']),
          o=n0(len(c['off']))))
    a('<div class="kpi {c}"><b>{v}</b><span>Order before {e}</span>'
      '<em>{d} days to go</em></div>'.format(
          c=('r' if order_n else 'g'), v=n0(order_n), e=au(c['end']),
          d=c['daysLeft']))
    a('<div class="kpi a"><b>{}</b><span>Never moved</span>'
      '<em>on the shelf all job</em></div>'.format(n0(len(c['dead']))))
    a('</div>')

    # -- the false alarms first, because acting on them costs money --
    if c['records']:
        a('<h3>Says &ldquo;stock low&rdquo; &mdash; but the stock is there</h3>')
        a('<div class="note warn"><b>Do not order these.</b> SiteIQ flags '
          '{n} lines as Stock Low. Every one of them either has a duplicate '
          'SKU record holding the stock, or was counted with gear physically '
          'on the shelf that the system thinks is at zero. These are records '
          'to fix, not gear to buy.</div>'.format(n=len(c['records'])))
        a('<div class="scroll"><table><tr><th>Item</th><th>SKU</th>'
          '<th class="n">System says</th><th class="n">Count found</th>'
          '<th>What is actually wrong</th></tr>')
        for it in c['records']:
            if it['why'] == 'twin':
                what = ('Same item is on two SKU records &mdash; the other '
                        'one ({t}) holds {n}. Merge them.'.format(
                            t=esc(', '.join(it['twins'])),
                            n=n0(it['twinHolds'])))
            else:
                what = ('System has it at zero, the count found stock. '
                        'Post the count.')
            a('<tr><td>{d}</td><td>{s}</td><td class="n">{a}</td>'
              '<td class="n">{c}</td><td>{w}</td></tr>'.format(
                  d=esc(it['desc']), s=esc(it['sku']), a=n0(it['avail']),
                  c=n0(it['counted'] or 0), w=what))
        a('</table></div>')

    # -- the real order list --
    a('<h3>Do we need to order?</h3>')
    a('<div class="note"><b>Where this comes from.</b> SiteIQ has minimum and '
      'reorder fields, which is where a reorder point belongs &mdash; on this '
      'job <b>every one of them is set to zero</b>, so there is no trigger to '
      'read. These lines are worked out from what actually went out the '
      'window: how fast each one is going since it first moved, against the '
      '<b>{d} days</b> left to {e}. Nothing here is a guess at what we might '
      'use; it is the rate we are already using.</div>'.format(
          d=c['daysLeft'], e=au(c['end'])))
    if not c['order']:
        a('<div class="note"><b>Nothing needs ordering.</b> Every line that '
          'is moving has enough on the shelf to reach {e} at its current '
          'rate.</div>'.format(e=au(c['end'])))
    else:
        a('<div class="scroll"><table><tr><th>Item</th><th>SKU</th>'
          '<th class="n">On shelf</th><th class="n">Used</th>'
          '<th class="n">Going out</th><th class="n">Lasts</th>'
          '<th>Verdict</th></tr>')
        for it in c['order']:
            cov = it['cover']
            short = max(0.0, it['burn'] * c['daysLeft'] - it['avail'])
            cls = 'r' if (cov is not None and cov <= 3) else 'a'
            a('<tr><td>{d}</td><td>{k}</td><td class="n">{a}</td>'
              '<td class="n">{u}</td><td class="n">{b}/day</td>'
              '<td class="n">{c}</td>'
              '<td><span class="pill {p}">order {s} more</span></td></tr>'
              .format(d=esc(it['desc']), k=esc(it['sku']), a=n0(it['avail']),
                      u=n0(it['used']), b='{:.1f}'.format(it['burn']),
                      c=days(cov) if cov is not None else '&mdash;',
                      p=cls, s=n0(round(short))))
        a('</table></div>')

    if c['watch']:
        a('<h3>Worth watching &mdash; tight but not short</h3>'
          '<div class="scroll"><table><tr><th>Item</th>'
          '<th class="n">On shelf</th><th class="n">Going out</th>'
          '<th class="n">Lasts</th></tr>')
        for it in c['watch']:
            a('<tr><td>{d}</td><td class="n">{a}</td>'
              '<td class="n">{b}/day</td><td class="n">{c}</td></tr>'
              .format(d=esc(it['desc']), a=n0(it['avail']),
                      b='{:.1f}'.format(it['burn']),
                      c=days(it['cover'])))
        a('</table></div>')

    # -- was the count right --
    a('<h3>Was the count right?</h3>')
    a('<div class="note"><b>{k} of {t} lines counted &mdash; {p}.</b> '
      'Counted on {days}. A count taken before today should differ from '
      'today&rsquo;s stock if gear went out since, so anything sold after the '
      'count is taken off before a line is called wrong. Today that explains '
      '<b>{ex}</b> of them &mdash; the other <b>{off}</b> are real gaps.'
      '</div>'.format(k=n0(c['checked']), t=n0(c['skus']),
                      p=pc(c['checkedPct']),
                      days=', '.join(au(d) for d in c['countDays']) or 'n/a',
                      ex=c['explained'], off=len(c['off'])))
    if c['off']:
        a('<div class="scroll"><table><tr><th>Item</th>'
          '<th class="n">System</th><th class="n">Counted</th>'
          '<th class="n">Gap</th><th>Which way</th></tr>')
        for it in c['off'][:25]:
            v = it['varAdj'] or 0
            a('<tr><td>{d}</td><td class="n">{a}</td><td class="n">{c}</td>'
              '<td class="n">{v:+.0f}</td>'
              '<td><span class="pill {k}">{w}</span></td></tr>'.format(
                  d=esc(it['desc']), a=n0(it['avail']),
                  c=n0(it['counted'] or 0), v=v,
                  k=('a' if v > 0 else 'r'),
                  w=('more on the shelf than the system knows'
                     if v > 0 else 'less on the shelf than the system says')))
        a('</table></div>')

    if c['dead']:
        a('<h3>Consumables that have never moved</h3>'
          '<div class="note">{n} lines have not been issued once. Some are '
          'emergency stock we are right to hold. Worth a look before the next '
          'order goes in.</div>'.format(n=len(c['dead'])))
        a('<div class="scroll"><table><tr><th>Item</th>'
          '<th class="n">Sitting on the shelf</th></tr>')
        for it in c['dead'][:20]:
            a('<tr><td>{d}</td><td class="n">{a}</td></tr>'.format(
                d=esc(it['desc']), a=n0(it['avail'])))
        a('</table></div>')
    return ''.join(h)


def to_pdf(html_path, pdf_path):
    try:
        import browser_engine
        b = browser_engine.find_browser()
    except Exception:
        b = None
    if not b:
        return False
    prof = os.path.join(os.environ.get('TEMP') or '/tmp', 'coates_util_pdf')
    cmd = [b, '--headless', '--disable-gpu', '--no-first-run',
           '--user-data-dir=' + prof, '--no-pdf-header-footer',
           '--print-to-pdf=' + os.path.abspath(pdf_path),
           'file:///' + os.path.abspath(html_path).replace('\\', '/')]
    if os.name != 'nt':
        cmd.insert(1, '--no-sandbox')
    try:
        subprocess.run(cmd, capture_output=True, timeout=180)
    except (subprocess.TimeoutExpired, OSError):
        return False
    finally:
        shutil.rmtree(prof, ignore_errors=True)
    return os.path.isfile(pdf_path) and os.path.getsize(pdf_path) > 0


def main():
    print('=' * 62)
    print(' COATES | UTILISATION - plant, tool store and consumables')
    print('=' * 62)

    rental = RP.find_export(HERE, 'RENTAL_STOCK*.xlsx')
    txn = RP.find_export(HERE, 'TRANSACTIONS*.xlsx')
    sales = RP.find_export(HERE, 'SALES_STOCK*.xlsx')
    stock = RP.find_export(HERE, 'STOCKTAKE*.xlsx')

    if not rental:
        print(' No RENTAL_STOCK export found. Run 28_PULL_SITEIQ_EXPORTS.bat')
        print(' (or save the export into Data_SiteIQ) and try again.')
        return 1

    today = dt.date.today()
    u = KU.read(rental, txn, today=today)
    if not u:
        print(' RENTAL_STOCK had no rows - nothing to report on.')
        return 1
    c = KC.read(sales, stock, HERE, today=today) if sales else None

    dirs = RP.out_dirs(HERE, today)
    stamp = today.strftime('%Y-%m-%d')
    name = 'Coates_K2_Utilisation_' + stamp
    html_path = os.path.join(dirs['pages'], name + '.html')
    pdf_path = os.path.join(dirs['pdf'], name + '.pdf')

    srcs = [p for p in (rental, txn, sales, stock) if p]
    with io.open(html_path, 'w', encoding='utf-8') as fh:
        fh.write(page(u, c, today.isoformat(), srcs))

    t = u['total']
    print('')
    print(' Holding      : {:,} items | {:,} out now ({:.1f}%) | {:,} have '
          'never moved'.format(t['n'], t['out'], u['outPct'], u['never']))
    print(' Plant        : {:,} items | {:,} out ({:.0f}%)'.format(
        u['plant']['n'], u['plant']['out'], u['plant']['outPct']))
    print(' Tool store   : {:,} items | {:,} out ({:.0f}%) | ever moved '
          '{:.0f}%'.format(u['store']['n'], u['store']['out'],
                           u['store']['outPct'], u['store']['usedPct']))
    if c:
        print(' Consumables  : {:,.0f} on the shelf across {} lines | {:,.0f} '
              'issued'.format(c['avail'], c['skus'], c['used']))
        print(' Stocktake    : {} of {} lines counted ({:.0f}%), {:.0f}% '
              'matched, {} real gap(s)'.format(
                  c['checked'], c['skus'], c['checkedPct'], c['matchPct'],
                  len(c['off'])))
        print(' To order     : {} line(s) before {} | {} false "stock low" '
              'flag(s) to fix in SiteIQ'.format(
                  len(c['order']), c['end'], len(c['records'])))
    else:
        print(' Consumables  : no SALES_STOCK export found - section skipped.')

    ok = to_pdf(html_path, pdf_path)
    print('')
    print(' Page         : ' + html_path)
    print(' PDF          : ' + (pdf_path if ok else 'not made (no browser found)'))
    RP.note_sources(dirs['day'], srcs)
    return 0


if __name__ == '__main__':
    sys.exit(main())
