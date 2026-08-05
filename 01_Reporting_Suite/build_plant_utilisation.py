#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | SITE PLANT UTILISATION - the report you can hand a manager
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 5 Aug 2026): "can we turn this into a html a live when
#  updated showing how this looks proffesionally and percennage of
#  fleet onhire rqther than not. money in idllw. money could save and a
#  way to make it better nexr time."
#
#  Five things, and the last one is the point.
#
#  THE SPREADSHEET ALREADY HELD ALL OF IT. Flame_Off_Site_Plant_
#  Utilisation.xlsx is 154 lines x 33 days of states - USED, SITE
#  PLANT, OFF, NO DATA - and every rate. What it could not do is say
#  what the pattern MEANS, because a grid of 5,000 cells does not have
#  a headline. This reads the same collect() the workbook is built
#  from, so the two can never disagree, and it says the thing out loud.
#
#  LIVE. Nothing is typed in. Re-run it after any fresh SiteIQ pull and
#  every number, the curve and the ranking move with the data.
#
#  COATES INTERNAL - IT CARRIES RATES. It writes to Reports\<date>\ and
#  never to Gear_Lookup\, so it cannot reach the store Wi-Fi. Do not
#  send it to a contractor: it names what their idle gear cost.
#
#  WHAT IT WILL NOT DO. It will not call a machine wasted because the
#  export cannot see the work. A crane that stood by all week for one
#  lift did its job. The report separates what it KNOWS (this asset was
#  on the plant account and charged, and no transaction shows it going
#  to a person) from what that COSTS, and leaves the judgement where it
#  belongs - with the person who was there.
#
#  Run it:  py build_plant_utilisation.py     (or 81_PLANT_UTILISATION)
# =====================================================================
from __future__ import print_function

import datetime as dt
import io
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def esc(s):
    import html
    return html.escape('' if s is None else str(s), quote=True)


def money(v):
    return '${:,.0f}'.format(v or 0)


# ---------------------------------------------------------------------
#  THE MATHS, IN ONE PLACE SO IT CAN BE ARGUED WITH
#
#  A day on the plant account with no transaction against it is a day
#  the job paid for and nobody signed for. That is the definition, and
#  it is deliberately narrow:
#
#    * it does NOT say the machine was unnecessary
#    * it does NOT count days the asset was off site or not yet arrived
#    * it counts what SiteIQ charged and what SiteIQ can evidence
#
#  Where the idle sits matters more than the total, because each bucket
#  has a different fix:
#
#    NEVER USED     the whole line is waste - it should not have come
#    BEFORE         it came too early - stage it to first-need date
#    AFTER          it went back too late - that is the demob push
#    BETWEEN        it stood by mid-job - often legitimate standby
# ---------------------------------------------------------------------
def analyse(d):
    rows = d['rows']
    n = len(rows[0]['states']) if rows else 0
    used_units = [0] * n
    idle_units = [0] * n
    idle_cash = [0.0] * n
    used_cash = [0.0] * n
    buckets = {'never': 0.0, 'before': 0.0, 'after': 0.0, 'between': 0.0}
    counts = {'never': 0, 'before': 0, 'after': 0, 'between': 0}
    worst = []

    for r in rows:
        q = r.get('qty') or 1
        rate = r.get('rate') or 0.0
        st = [str(x) for x in r.get('states') or []]
        for i, s in enumerate(st):
            if s.startswith('USED'):
                used_units[i] += q
                used_cash[i] += q * rate
            elif s == 'SITE PLANT':
                idle_units[i] += q
                idle_cash[i] += q * rate

        hits = [i for i, s in enumerate(st) if s.startswith('USED')]
        plant = [i for i, s in enumerate(st) if s == 'SITE PLANT']
        cash = lambda days: len(days) * q * rate

        if not hits:
            if plant:
                buckets['never'] += cash(plant)
                counts['never'] += 1
                worst.append({'$': cash(plant), 'desc': r.get('desc', ''),
                              'qty': q, 'rate': rate, 'days': len(plant),
                              'why': 'never went out to anybody',
                              'bucket': 'never'})
        else:
            f, l = min(hits), max(hits)
            before = [i for i in plant if i < f]
            after = [i for i in plant if i > l]
            between = [i for i in plant if f < i < l]
            buckets['before'] += cash(before)
            buckets['after'] += cash(after)
            buckets['between'] += cash(between)
            if before:
                counts['before'] += 1
            if after:
                counts['after'] += 1
            if between:
                counts['between'] += 1
            waste = cash(before) + cash(after)
            if waste > 0:
                bits = []
                if before:
                    bits.append('{} day{} before it was first used'
                                .format(len(before), '' if len(before) == 1 else 's'))
                if after:
                    bits.append('{} day{} after it was last used'
                                .format(len(after), '' if len(after) == 1 else 's'))
                worst.append({'$': waste, 'desc': r.get('desc', ''),
                              'qty': q, 'rate': rate,
                              'days': len(before) + len(after),
                              'why': 'sat ' + ' and '.join(bits),
                              'bucket': 'before' if cash(before) >= cash(after)
                              else 'after'})

    worst.sort(key=lambda x: -x['$'])
    tot_used = sum(used_units)
    tot_idle = sum(idle_units)
    return {
        'n': n, 'used_units': used_units, 'idle_units': idle_units,
        'idle_cash': idle_cash, 'used_cash': used_cash,
        'buckets': buckets, 'counts': counts, 'worst': worst,
        'fleet_days_used': tot_used, 'fleet_days_idle': tot_idle,
        'onhire_pct': (100.0 * tot_used / (tot_used + tot_idle)
                       if (tot_used + tot_idle) else 0.0),
        'idle_total': sum(buckets.values()),
        'used_total': sum(used_cash),
    }


#  Below this many assets on site a percentage says nothing.
FLEET_FLOOR = 20


def curve_svg(a, flame_index=12):
    """The shape of the shut in one picture: what share of the plant on
    site was actually out with a crew, day by day.

    Bars, not a line. A line implies a reading between the days and
    there is no such thing - each day is counted, or it is not."""
    #  A DAY WITH THREE MACHINES ON SITE IS NOT A UTILISATION READING.
    #  The first draft drew day -8 as a full-height 100% green bar -
    #  one asset on site, one of them out - and the chart read as a
    #  fleet that started perfect and collapsed. A percentage of one
    #  thing is not a trend, and at full height it was the loudest
    #  thing on the page. Thin days come off the curve and are COUNTED,
    #  so the caption says how many and why instead of the chart just
    #  quietly starting late.
    n = a['n']
    pts = []
    for i in range(n):
        t = a['used_units'][i] + a['idle_units'][i]
        pts.append((100.0 * a['used_units'][i] / t, t) if t else None)
    live = [(i, v[0]) for i, v in enumerate(pts)
            if v is not None and v[1] >= FLEET_FLOOR]
    a['skipped_days'] = sum(1 for v in pts
                            if v is not None and v[1] < FLEET_FLOOR)
    if not live:
        return ''
    W, H, PADL, PADB, PADT = 860, 250, 42, 34, 14
    plot_w = W - PADL - 12
    plot_h = H - PADB - PADT
    bw = plot_w / float(len(live))
    peak = max(p for _i, p in live) or 1

    g = ("<svg viewBox='0 0 {w} {h}' width='100%' "
         "preserveAspectRatio='xMidYMid meet' role='img' "
         "aria-label='Share of the on-site plant fleet out with a crew, "
         "by day'>".format(w=W, h=H))
    #  grid at 25 / 50 / 75 / 100 - recessive, behind the bars
    for pc in (25, 50, 75, 100):
        y = PADT + plot_h - (plot_h * pc / 100.0)
        g += ("<line x1='{x1}' y1='{y}' x2='{x2}' y2='{y}' stroke='#26313F' "
              "stroke-width='1'/>".format(x1=PADL, x2=W - 12, y=y))
        g += ("<text x='{x}' y='{y}' fill='#66707E' font-size='10' "
              "text-anchor='end' dominant-baseline='middle'>{p}%</text>"
              .format(x=PADL - 7, y=y, p=pc))
    for k, (i, p) in enumerate(live):
        x = PADL + k * bw
        bh = plot_h * p / 100.0
        y = PADT + plot_h - bh
        day = i - flame_index
        hot = (day == 0)
        col = '#F26222' if hot else ('#2BB673' if p >= peak * 0.9 else '#3C7FB1')
        g += ("<rect x='{x:.1f}' y='{y:.1f}' width='{w:.1f}' height='{h:.1f}' "
              "fill='{c}' rx='2'><title>Day {d}: {p:.0f}% of the fleet out "
              "({u} out, {i} idle)</title></rect>".format(
                  x=x + 1, y=y, w=max(1.0, bw - 2), h=max(1.0, bh), c=col,
                  d=day, p=p, u=a['used_units'][i], i=a['idle_units'][i]))
        if day % 3 == 0 or day == 0:
            g += ("<text x='{x:.1f}' y='{y}' fill='{c}' font-size='9.5' "
                  "text-anchor='middle'>{lab}</text>".format(
                      x=x + bw / 2.0, y=H - PADB + 16,
                      c='#F26222' if hot else '#66707E',
                      lab=('FLAME OFF' if hot else
                           ('+' if day > 0 else '') + str(day))))
    g += ("<text x='{x}' y='{y}' fill='#66707E' font-size='10' "
          "text-anchor='middle'>DAYS FROM FLAME OFF</text>"
          .format(x=PADL + plot_w / 2.0, y=H - 4))
    return g + "</svg>"


CSS = """
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0B0F14;color:#E9EEF5;font-size:15px;line-height:1.55;
 font-family:"Segoe UI",system-ui,-apple-system,Arial,sans-serif;
 -webkit-font-smoothing:antialiased}
.wrap{max-width:1000px;margin:0 auto;padding:0 22px 70px}
.head{border-bottom:3px solid #F26222;padding:26px 0 20px;margin-bottom:6px}
.eyebrow{font-size:10.5px;letter-spacing:2.6px;text-transform:uppercase;
 color:#F26222;font-weight:800}
h1{font-size:clamp(26px,4vw,40px);line-height:1.06;font-weight:800;
 letter-spacing:-.5px;margin-top:12px;text-wrap:balance}
.sub{color:#949DAA;font-size:14px;margin-top:11px;line-height:1.6}
.warn{display:inline-block;background:#3A1512;color:#FF6B5A;font-size:10px;
 letter-spacing:1.6px;text-transform:uppercase;font-weight:800;
 border-radius:20px;padding:5px 12px;margin-top:14px}
h2{font-size:12px;letter-spacing:2.4px;text-transform:uppercase;color:#F26222;
 font-weight:800;margin:38px 0 6px}
h2+p{color:#949DAA;font-size:13.5px;line-height:1.65;margin-bottom:14px;
 max-width:74ch}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
 gap:1px;background:#26313F;border:1px solid #26313F;border-radius:14px;
 overflow:hidden;margin-top:18px}
.tile{background:#121922;padding:17px 18px}
.tile b{display:block;font-size:30px;font-weight:800;line-height:1;
 font-variant-numeric:tabular-nums;letter-spacing:-.5px}
.tile span{display:block;color:#949DAA;font-size:11.5px;margin-top:7px;
 line-height:1.4}
.tile.r b{color:#FF6B5A} .tile.a b{color:#F5A623} .tile.g b{color:#2BB673}
.tile.o b{color:#F26222}
.panel{background:#121922;border:1px solid #26313F;border-radius:14px;
 padding:20px;margin-top:16px;overflow-x:auto}
.bars{margin-top:6px}
.brow{display:grid;grid-template-columns:minmax(190px,1.3fr) 3fr 108px;
 gap:14px;align-items:center;padding:7px 0}
.blab{font-size:13.5px}
.blab i{display:block;font-style:normal;color:#66707E;font-size:11.5px;
 margin-top:2px}
.btrack{background:#171F29;border:1px solid #26313F;border-radius:5px;
 height:18px;overflow:hidden}
.btrack i{display:block;height:100%;border-radius:0 5px 5px 0}
.bval{text-align:right;font-variant-numeric:tabular-nums;font-weight:800;
 font-size:14px}
table{width:100%;border-collapse:collapse;margin-top:4px}
th{background:#171F29;color:#949DAA;font-size:9.5px;letter-spacing:1.2px;
 text-transform:uppercase;text-align:left;padding:9px 10px;white-space:nowrap}
td{padding:9px 10px;border-bottom:1px solid #1E2731;font-size:13px;
 vertical-align:top}
td.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
tr:last-child td{border-bottom:none}
.why{color:#8A97A8;font-size:11.5px;display:block;margin-top:2px}
.note{background:#121922;border:1px solid #26313F;border-left:3px solid #F26222;
 border-radius:0 12px 12px 0;padding:15px 19px;margin-top:16px;
 color:#C6D0DD;font-size:13px;line-height:1.7}
.note b{color:#F0F4F9}
.do{background:#121922;border:1px solid #26313F;border-radius:14px;
 padding:19px 21px;margin-top:13px;border-left:3px solid #2BB673}
.do h3{font-size:16px;font-weight:800;line-height:1.3;color:#F0F4F9}
.do .save{color:#2BB673;font-size:12px;font-weight:800;letter-spacing:1.2px;
 text-transform:uppercase;margin-bottom:6px;display:block}
.do p{color:#A9B3C0;font-size:13px;margin-top:8px;line-height:1.65}
footer{color:#4A5768;font-size:11.5px;line-height:1.8;margin-top:44px;
 border-top:1px solid #1E2731;padding-top:20px}
@media print{
  body{background:#fff;color:#000}
  .panel,.tile,.do,.note{background:#fff;border-color:#ccc}
  h1,.tile b{color:#000}
  h2{color:#B4491A}
  .warn{border:1px solid #900;color:#900}
  section{break-inside:avoid}
}
"""


def build(date_tag=None):
    import build_flame_off_plant as FP
    d = FP.collect()
    a = analyse(d)
    date_tag = date_tag or dt.date.today().isoformat()
    b = a['buckets']
    c = a['counts']
    idle = a['idle_total'] or 1.0
    never_n = d.get('neverUsed', 0)
    total_assets = d.get('totalAssets', 0)

    #  ---- the headline ------------------------------------------------
    html = ["<div class='head'><p class='eyebrow'>Cement Australia K2 "
            "Shutdown 2026 &middot; Gladstone</p>"
            "<h1>The plant fleet ran at "
            "<span style='color:#F26222'>{:.0f}%</span>.</h1>".format(
                a['onhire_pct']),
            "<p class='sub'>Across the shut, <b style='color:#E9EEF5'>{:,}</b> "
            "fleet-days went out with a crew and <b style='color:#E9EEF5'>"
            "{:,}</b> sat on the plant account being charged for. That is "
            "the whole report in one line &mdash; everything below is where "
            "it went and what to do differently.</p>".format(
                a['fleet_days_used'], a['fleet_days_idle']),
            "<span class='warn'>Coates internal &middot; carries rates "
            "&middot; not for a contractor</span></div>"]

    html.append("<div class='tiles'>"
                "<div class='tile o'><b>{p:.0f}%</b><span>of the on-site "
                "fleet was out with a crew</span></div>"
                "<div class='tile r'><b>{i}</b><span>paid for while it sat "
                "idle</span></div>"
                "<div class='tile g'><b>{u}</b><span>paid for while it was "
                "working</span></div>"
                "<div class='tile a'><b>{n:,}</b><span>of {t:,} assets never "
                "went out at all</span></div>"
                "</div>".format(p=a['onhire_pct'], i=money(a['idle_total']),
                                u=money(a['used_total']), n=never_n,
                                t=total_assets))

    #  ---- the curve ---------------------------------------------------
    html.append("<h2>How the fleet was used, day by day</h2>")
    html.append("<p>The share of plant on site that was actually out with a "
                "crew. It never gets above the high twenties &mdash; and the "
                "climb only starts after Flame Off, which is the shape worth "
                "looking at.</p>")
    svg = curve_svg(a)
    skipped = a.get('skipped_days', 0)
    html.append("<div class='panel'>" + svg + "</div>")
    if skipped:
        #  Say what came off the chart. A curve that starts late without
        #  explaining itself is the same sin as a cut list that does not
        #  say what it cut.
        html.append("<div class='note'>The first <b>{n} day{s}</b> "
                    "{v} left off the curve above: fewer than {f} assets "
                    "were on site, and a percentage of a handful of "
                    "machines is noise, not utilisation. They are still in "
                    "every dollar figure on this page.</div>".format(
                        n=skipped, s='' if skipped == 1 else 's',
                        v='is' if skipped == 1 else 'are', f=FLEET_FLOOR))

    #  ---- where the money went ---------------------------------------
    html.append("<h2>Where the idle money went</h2>")
    html.append("<p>Each of these has a different fix, which is why they are "
                "split. Idle is a day on the plant account that was charged "
                "with no transaction against it &mdash; not a judgement that "
                "the machine was unnecessary.</p>")
    order = [('before', 'Came before it was needed', '#FF6B5A',
              'Mobilised early and charged from arrival'),
             ('never', 'Never used at all', '#F5A623',
              'On site, charged, never went out to anybody'),
             ('after', 'Went back late', '#3C7FB1',
              'Finished with, still on hire'),
             ('between', 'Stood by mid-job', '#5A6472',
              'Idle between two jobs - often legitimate standby')]
    rows_b = ""
    top = max(b.values()) or 1
    for k, lab, col, sub in order:
        v = b.get(k, 0.0)
        rows_b += (
            "<div class='brow'><div class='blab'>{lab}<i>{sub} &middot; "
            "{n} line(s)</i></div>"
            "<div class='btrack'><i style='width:{w:.1f}%;background:{c}'>"
            "</i></div>"
            "<div class='bval' style='color:{c}'>{v}<br>"
            "<span style='color:#66707E;font-size:11px;font-weight:400'>"
            "{p:.0f}%</span></div></div>".format(
                lab=esc(lab), sub=esc(sub), n=c.get(k, 0),
                w=100.0 * v / top, c=col, v=money(v), p=100.0 * v / idle))
    html.append("<div class='panel bars'>" + rows_b + "</div>")

    biggest = max(order, key=lambda o: b.get(o[0], 0))
    html.append("<div class='note'><b>{p:.0f}% of the idle spend is "
                "“{lab}”.</b> {msg}</div>".format(
                    p=100.0 * b.get(biggest[0], 0) / idle,
                    lab=esc(biggest[1].lower()),
                    msg=_verdict(biggest[0])))

    #  ---- the worst offenders ----------------------------------------
    html.append("<h2>The ten that cost the most</h2>")
    html.append("<p>Ranked by idle spend, not by day rate. A cheap item "
                "sitting for three weeks can cost more than an expensive one "
                "standing by for two days.</p>")
    tr = ""
    for w in a['worst'][:10]:
        tr += ("<tr><td>{d}<span class='why'>{why}</span></td>"
               "<td class='num'>{q}</td><td class='num'>${r:,.2f}</td>"
               "<td class='num'>{dy}</td>"
               "<td class='num' style='color:#FF6B5A;font-weight:800'>{m}</td>"
               "</tr>".format(d=esc(w['desc']), why=esc(w['why']), q=w['qty'],
                              r=w['rate'], dy=w['days'], m=money(w['$'])))
    html.append("<div class='panel'><table><tr><th>What it is</th>"
                "<th class='num'>Qty</th><th class='num'>Day rate</th>"
                "<th class='num'>Idle days</th><th class='num'>Cost of the "
                "idle</th></tr>" + tr + "</table></div>")

    #  ---- better next time -------------------------------------------
    html.append("<h2>How to make the next one better</h2>")
    html.append("<p>Three changes, in the order they are worth money. Every "
                "figure is what this shut actually did, not a target.</p>")
    for item in _lessons(a, d):
        html.append("<div class='do'><span class='save'>{s}</span>"
                    "<h3>{t}</h3><p>{b}</p></div>".format(
                        s=esc(item['save']), t=esc(item['title']),
                        b=item['body']))

    html.append("<div class='note'><b>What this does not say.</b> A machine "
                "that stood by all week for one lift did its job, and the "
                "export cannot tell that from a machine nobody wanted. This "
                "counts what SiteIQ charged and what SiteIQ can evidence &mdash; "
                "the judgement stays with the person who was there. Read it as "
                "the question list for the next mobilisation, not a verdict on "
                "this one.</div>")

    #  sources is [(where the rate came from, how many lines)] - name
    #  both, because "which book priced this" is the first question
    #  anybody asks of a money report.
    src = ', '.join('{} x{}'.format(k, n) for k, n in (d.get('sources') or []))
    #  FORMAT THE FOOTER ON ITS OWN. .format() over the whole page
    #  walks straight into the CSS and dies on the first {box-sizing}.
    #  Same trap the suite has hit before - keep braces and .format()
    #  in separate rooms.
    footer = (
        "<footer><b>Cement Australia K2 Shutdown 2026</b> &middot; "
        "Gladstone &middot; Flame Off {fo}<br>"
        "Built {built} from {src} &middot; {days} source day(s), "
        "{lines} line(s), {assets:,} unique assets<br>"
        "Every figure on this page is read from the export at build time. "
        "Re-run it after a fresh pull and it moves with the data.<br>"
        "COATES INTERNAL &mdash; carries rates. Never goes on the store "
        "Wi-Fi and never to a contractor.<br>"
        "Author: Andrew Fisher &middot; POWERED BY SITEIQ</footer>").format(
            fo='24 Jul 2026',
            built=dt.date.today().strftime('%d %b %Y'),
            src=esc(src or 'the SiteIQ exports'),
            days=d.get('sourceDays', 0), lines=len(d.get('rows') or []),
            assets=total_assets)

    page = ("<!doctype html><html lang='en-AU'><head><meta charset='utf-8'>"
            "<meta name='viewport' content='width=device-width,"
            "initial-scale=1'>"
            "<title>Coates | Site Plant Utilisation &mdash; K2 2026</title>"
            "<style>" + CSS + "</style></head><body><div class='wrap'>"
            + ''.join(html) + footer + "</div></body></html>")

    out_dir = os.path.join(HERE, 'Reports', date_tag, 'Pages')
    if not os.path.isdir(out_dir):
        os.makedirs(out_dir)
    out = os.path.join(out_dir,
                       'Coates_K2_Plant_Utilisation_{}.html'.format(date_tag))
    with io.open(out, 'w', encoding='utf-8') as fh:
        fh.write(page)
    return out, a, d


def _verdict(bucket):
    return {
        'before': ("That is a staging problem, not a returns problem. The "
                   "gear was on the ground and on charge before there was a "
                   "job for it &mdash; which is the cheapest thing on this "
                   "page to fix, because it costs nothing but a date."),
        'never': ("None of it went out to a single person. Some will have "
                  "been genuine contingency; the rest is a line on an order "
                  "that nobody questioned."),
        'after': ("That is the demob push, and it is the one thing here you "
                  "can still change on this job."),
        'between': ("Standby between two jobs is often exactly right. Worth "
                    "reading, not worth chasing."),
    }.get(bucket, '')


def _lessons(a, d):
    """Written from the numbers, ranked by what they are worth. Nothing
    here is a target - every figure is what this shut actually did."""
    b = a['buckets']
    c = a['counts']
    out = []

    if b.get('before'):
        out.append({
            'save': 'Worth ' + money(b['before']),
            'title': 'Stage the arrivals to first-need date, not to Flame Off',
            'body': ("<b>{n} line(s)</b> were on site and on charge before "
                     "anybody used them, at a cost of <b>{m}</b>. The fix is "
                     "a date, not a negotiation: ask each crew when they "
                     "actually need their plant and book delivery to that "
                     "day. The worst single one on this job sat "
                     "<b>{d} days</b> before its first job."
                     .format(n=c.get('before', 0), m=money(b['before']),
                             d=max([w['days'] for w in a['worst']
                                    if w['bucket'] == 'before'] or [0])))})
    if b.get('never'):
        out.append({
            'save': 'Worth ' + money(b['never']),
            'title': 'Challenge the contingency list before it is ordered',
            'body': ("<b>{n} line(s)</b> never went out to one person and "
                     "still cost <b>{m}</b>. Some of that is deliberate "
                     "cover and should stay. The question for the next order "
                     "is simply which ones &mdash; asked in the planning "
                     "room, where it is free, rather than at the end where "
                     "it is an invoice.".format(n=c.get('never', 0),
                                                m=money(b['never'])))})
    if b.get('after'):
        out.append({
            'save': 'Worth ' + money(b['after']),
            'title': 'Off-hire the day it finishes, not the day it leaves',
            'body': ("<b>{n} line(s)</b> stayed on hire after their last "
                     "use, costing <b>{m}</b>. This is the smallest of the "
                     "three here, which is worth saying plainly: the demob "
                     "chase is working. The money is at the front of the "
                     "job, not the back.".format(n=c.get('after', 0),
                                                 m=money(b['after'])))})
    out.append({
        'save': 'No cost',
        'title': 'Run this report weekly on the next job, not at the end',
        'body': ("Every number here was available from day four. Read "
                 "weekly, the &ldquo;came early&rdquo; bar shows up while "
                 "there is still time to send something back &mdash; at the "
                 "end of a job it is only a lesson. Nothing needs building: "
                 "this page rebuilds itself from the same export.")})
    return out


def main():
    print('=' * 68)
    print(' COATES | SITE PLANT UTILISATION')
    print('=' * 68)
    out, a, d = build()
    b = a['buckets']
    print(' Fleet on hire  : {:.1f}%   ({:,} fleet-days out, {:,} idle)'
          .format(a['onhire_pct'], a['fleet_days_used'], a['fleet_days_idle']))
    print(' Idle spend     : {:>10}'.format(money(a['idle_total'])))
    print('   came early   : {:>10}   {} line(s)'
          .format(money(b['before']), a['counts']['before']))
    print('   never used   : {:>10}   {} line(s)'
          .format(money(b['never']), a['counts']['never']))
    print('   back late    : {:>10}   {} line(s)'
          .format(money(b['after']), a['counts']['after']))
    print('   stood by     : {:>10}'.format(money(b['between'])))
    print(' Working spend  : {:>10}'.format(money(a['used_total'])))
    print('')
    print(' Page           : ' + out)
    print('')
    print(' COATES INTERNAL - it carries rates. Reports\\ only, never')
    print(' Gear_Lookup, and never to a contractor.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
