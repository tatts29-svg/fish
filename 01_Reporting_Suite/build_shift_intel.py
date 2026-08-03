#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | SHIFT & COUNTER INTEL - day v night, in the open
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 3 Aug 2026): "I really want to know what each shift is
#  doing ... lets have some graphs in here on when they are busy at the
#  counter and not busy ... this is all about having at all times full
#  transparency on what happens."
#
#  Four screens on one page:
#    1. COUNTER SEARCH   every issue and return with its clock, 500
#                        each way, searched by time / name / company /
#                        item. "He was here about 10:30" is a search.
#    2. DAY v NIGHT      what each shift did, by area - gear out, gear
#                        back, and stocktake counting, with the aisles
#                        each shift actually walked.
#    3. WHEN IT IS BUSY  the counter's load hour by hour, so quiet
#                        hours can be given a job.
#    4. SCAN PACE        Andrew's five-second rule, applied honestly.
#
#  ---------------------------------------------------------------
#  WHY THIS PAGE IS INTERNAL AND NOT ON THE STORE WI-FI
#  ---------------------------------------------------------------
#  Screens 2-4 name individuals and how fast they worked. The stores
#  board is now open to every Coates hand on site, and putting a named
#  pace comparison on it would be performance management by billboard.
#  This writes to Reports\ with the other internal pages. The counter
#  SEARCH - which is operational, not personal - already lives on the
#  board as "Just happened", where the counter can actually use it.
# =====================================================================
import datetime as dt
import html
import io
import json
import os

import forecast as FC
import shift_intel as SI

BASE = os.path.dirname(os.path.abspath(__file__))


def esc(s):
    return html.escape('' if s is None else str(s), quote=True)


def build(today=None):
    today = today or dt.date.today()
    txn = FC._newest('TRANSACTIONS*.xlsx')
    stk = FC._newest('STOCKTAKE*.xlsx')
    if not txn:
        print(' No TRANSACTIONS export - nothing to build.')
        return 1
    counter = SI.read_counter(txn)
    sight = SI.read_sightings(stk) if stk else []
    shifts = SI.by_shift(counter, sight)
    pace = SI.scan_pace(sight)
    hrs = SI.hourly(counter)
    q = SI.queue(counter)
    dur = SI.durations(txn)
    rental = FC._newest('RENTAL_STOCK*.xlsx')
    cov = SI.aisle_coverage(rental, sight) if rental else None
    outs = [e for e in counter if e['way'] == 'OUT'][:500]
    backs = [e for e in counter if e['way'] == 'BACK'][:500]

    def row(e):
        return {'t': e['at'].strftime('%d/%m %H:%M:%S'),
                'k': e['at'].strftime('%H:%M'), 'x': e['way'],
                'i': e['i'], 'n': e['n'], 'w': e['w'], 'co': e['co']}
    payload = {'out': [row(e) for e in outs], 'back': [row(e) for e in backs]}

    #  day / night totals across the whole shut
    dtot = {'DAY': [0, 0, 0], 'NIGHT': [0, 0, 0]}
    for b in shifts:
        t = dtot[b['shift']]
        t[0] += b['out']
        t[1] += b['back']
        t[2] += b['count']
    peak = max(hrs) or 1

    H = ["<div class='wrap'>",
         "<div class='bar0'><h1>Shift &amp; Counter Intel</h1>"
         "<span class='siq'>POWERED BY SITEIQ</span></div>",
         "<p class='sub'>DAY 06:00&ndash;18:00 &middot; NIGHT "
         "18:00&ndash;06:00 &middot; {:,} counter movements &middot; "
         "{:,} sightings &middot; built {}</p>".format(
             len(counter), len(sight), today.strftime('%d %b %Y'))]

    # ---- 1. counter search ------------------------------------------
    H.append("<div class='panel'><div class='ph'>Counter search &mdash; "
             "what went out, what came back</div>"
             "<div class='seg'><button class='on' onclick=\"way('out')\" "
             "type='button'>ISSUED &mdash; {:,}</button>"
             "<button onclick=\"way('back')\" type='button'>RETURNED "
             "&mdash; {:,}</button></div>"
             "<input class='q' id='q' placeholder='Time (10:3), name, "
             "company, item number or gear' oninput='go()'>"
             "<div id='res'></div></div>".format(len(outs), len(backs)))

    # ---- 2. when it is busy ------------------------------------------
    H.append("<div class='panel'><div class='ph'>When the counter is "
             "busy &mdash; every movement, by hour</div><div class='hg'>")
    for h in range(24):
        cls = 'd' if SI.DAY_FROM <= h < SI.DAY_TO else 'n'
        H.append("<div class='hb' title='{:02d}:00 - {} movements'>"
                 "<i class='{}' style='height:{}%'></i>"
                 "<em>{}</em></div>".format(
                     h, hrs[h], cls, max(2, int(100.0 * hrs[h] / peak)),
                     h if h % 3 == 0 else ''))
    H.append("</div><div class='pnote'><i class='sw d'></i> day shift "
             "&nbsp; <i class='sw n'></i> night shift &middot; busiest "
             "hour {:02d}:00 with {:,} movements, quietest working hour "
             "{:02d}:00 with {:,}. The peaks are the handovers &mdash; "
             "the flat hours are where a job can go.</div></div>".format(
                 hrs.index(peak), peak,
                 min(range(24), key=lambda h: hrs[h] if hrs[h] else 10 ** 9),
                 min(x for x in hrs if x) if any(hrs) else 0))

    # ---- 2b. the rush ------------------------------------------------
    qpk = max(q['byHour']) or 1
    rush = sorted(range(24), key=lambda h: -q['byHour'][h])[:2]
    H.append("<div class='panel'><div class='ph'>The rush at the window "
             "&mdash; how many blokes are standing there</div>")
    H.append("<div class='story'>Counted in <b>people</b>, not lines: a "
             "stack of seventy chutes booked in one go is one bloke, not "
             "seventy. The worst minute of the shut served <b>{}</b> "
             "different people, and <b>{:,}</b> minutes served three or "
             "more.</div>".format(q['peak'], q['busy']))
    H.append("<div class='hg'>")
    for h in range(24):
        cls = 'd' if SI.DAY_FROM <= h < SI.DAY_TO else 'n'
        H.append("<div class='hb' title='{:02d}:00 - {} busy minutes'>"
                 "<i class='{}' style='height:{}%'></i><em>{}</em></div>"
                 .format(h, q['byHour'][h], cls,
                         max(2, int(100.0 * q['byHour'][h] / qpk)),
                         h if h % 3 == 0 else ''))
    H.append("</div><div class='pnote'>Minutes with three or more people "
             "waiting, by hour. It stacks into <b>{:02d}:00</b> and "
             "<b>{:02d}:00</b> &mdash; knock-off and start-up. Two hands "
             "on the window for those two hours is worth more than two "
             "hands all day.</div>".format(*sorted(rush)))
    H.append("<div class='uh'>The worst minutes</div><div class='tw'><table>"
             "<tr><th>When</th><th>People at the window</th></tr>")
    for k, n in q['worst'][:6]:
        H.append("<tr><td><b>{}</b></td><td class='n'>{}</td></tr>".format(
            k.strftime('%a %d %b %H:%M'), n))
    H.append("</table></div></div>")

    # ---- 3. day v night ---------------------------------------------
    H.append("<div class='panel'><div class='ph'>Day v Night &mdash; "
             "the whole shut</div><div class='vs'>")
    for s in ('DAY', 'NIGHT'):
        o, bk, c = dtot[s]
        H.append("<div class='vsc {}'><b>{}</b>"
                 "<div class='vr'><span>Gear issued</span><em>{:,}</em></div>"
                 "<div class='vr'><span>Gear returned</span><em>{:,}</em></div>"
                 "<div class='vr'><span>Items counted</span><em>{:,}</em></div>"
                 "</div>".format(s.lower(), s, o, bk, c))
    H.append("</div></div>")

    # ---- 4. shift by shift -------------------------------------------
    H.append("<div class='panel'><div class='ph'>Shift by shift &mdash; "
             "what each one actually did</div><div class='tw'><table>"
             "<tr><th>Shift</th><th>Out</th><th>Back</th><th>Counted</th>"
             "<th>Aisles walked</th><th>Who counted</th></tr>")
    for b in shifts[:28]:
        H.append("<tr class='{}'><td><b>{}</b><span>{}</span></td>"
                 "<td class='n'>{}</td><td class='n'>{}</td>"
                 "<td class='n {}'>{}</td><td>{}</td><td>{}</td></tr>".format(
                     b['shift'].lower(), b['date'].strftime('%a %d %b'),
                     b['shift'], b['out'] or '-', b['back'] or '-',
                     'z' if not b['count'] else '', b['count'] or 'none',
                     #  escape each part, THEN join with the entity -
                     #  escaping the joined string printed a literal
                     #  &middot; on the page (the same fault caught on
                     #  the stores board, 3 Aug 2026)
                     ' &middot; '.join(
                         '{} {}'.format(esc(u), n) for u, n in
                         b['units'].most_common(3)) or '&mdash;',
                     ', '.join(esc(w) for w, _ in
                               b['people'].most_common(3)) or '&mdash;'))
    H.append("</table></div><div class='pnote'>A shift with nothing in "
             "Counted did no stocktake at all &mdash; that is the "
             "number this table exists to make impossible to miss."
             "</div></div>")

    # ---- 4b. how long gear stays out ---------------------------------
    if dur:
        dpk = max(n for _, n in dur['buckets']) or 1
        H.append("<div class='panel'><div class='ph'>How long gear "
                 "actually stays out</div>")
        H.append("<div class='story'>Median hire: <b>{:.0f} hours</b>. "
                 "<b>{:,} of {:,}</b> closed hires ({:.0f}%) come back "
                 "inside twelve hours &mdash; this store is a "
                 "<b>shift loan</b>, not a hire desk. That is the number "
                 "that decides how much stock you need on the shelf at "
                 "06:00.</div>".format(
                     dur['median'], dur['shift'], dur['n'],
                     100.0 * dur['shift'] / dur['n']))
        for label, n in dur['buckets']:
            #  87% not 100% - the widest bar has to leave room for its
            #  own number, or the biggest bucket is the one you cannot
            #  read (caught on the rig: 2,021 ran off the page edge)
            H.append("<div class='pr'><span>{}</span><div class='bar'>"
                     "<i style='width:{}%'></i><b>{:,}</b></div></div>"
                     .format(label, max(1, int(87.0 * n / dpk)), n))
        H.append("<div class='pnote'><b>{:,}</b> hires ran over a week. "
                 "On a shift-loan store those are the ones worth a look "
                 "&mdash; either they are genuinely long jobs, or they "
                 "are gear nobody has thought about since.</div></div>"
                 .format(dur['week']))

    # ---- 4c. aisle coverage ------------------------------------------
    if cov:
        H.append("<div class='panel'><div class='ph'>Aisle coverage "
                 "&mdash; what has actually been laid eyes on</div>")
        H.append("<div class='story'>{} aisles in the register. "
                 "<b>{} have been walked</b>. The other {} have never had "
                 "a single stocktake scan &mdash; that is "
                 "<b>{:,} assets</b> nobody has confirmed are still on "
                 "site.</div>".format(
                     cov['aisles'], cov['walked'],
                     cov['aisles'] - cov['walked'], cov['unseen']))
        cpk = max(r['assets'] for r in cov['rows']) or 1
        H.append("<div class='tw'><table><tr><th>Aisle</th><th>Assets</th>"
                 "<th>Scans</th><th>Last walked</th><th></th></tr>")
        #  WALKED / BARELY / NEVER. A binary walked-or-not hid the
        #  worst line on the board: Radios, 217 assets, FOUR scans.
        #  Under a tenth of an aisle counted is not coverage, and
        #  calling it green would have been the report lying politely.
        thin = 0
        for r in cov['rows']:
            share = (100.0 * r['counted'] / r['assets']) if r['assets'] \
                else 0
            if not r['counted']:
                band, word, cls = 'never', 'NEVER', 'r'
            elif share < 10:
                band, word, cls = 'thin', '{:,}'.format(r['counted']), 'a'
                thin += 1
            else:
                band, word, cls = '', '{:,}'.format(r['counted']), 'g'
            H.append("<tr class='{}'><td><b>{}</b></td>"
                     "<td class='n'>{:,}</td><td class='n {}'>{}</td>"
                     "<td>{}{}</td>"
                     "<td style='width:34%'><div class='bar'><i class='{}' "
                     "style='width:{}%'></i></div></td></tr>".format(
                         band, esc(r['unit']), r['assets'],
                         'z' if band == 'never' else
                         ('a' if band == 'thin' else ''), word,
                         r['last'].strftime('%a %d %b') if r['last']
                         else '&mdash;',
                         ' <span class="thinw">barely touched</span>'
                         if band == 'thin' else '',
                         cls, max(2, int(100.0 * r['assets'] / cpk))))
        H.append("</table></div><div class='pnote'>Never-walked aisles "
                 "are not necessarily a problem &mdash; site plant, "
                 "barriers and chutes live outside and get counted by "
                 "eye. But they are counted by <b>nobody</b> in the "
                 "register, so if one walks off site there is nothing "
                 "to prove it was ever here.{}</div></div>".format(
                     " <b>Amber</b> is worse than it looks: the aisle "
                     "has been opened but under a tenth of it counted. "
                     "Radios is the one to look at &mdash; 217 assets, "
                     "and the register has seen four of them."
                     if thin else ''))

    # ---- 5. scan pace -------------------------------------------------
    H.append("<div class='panel'><div class='ph'>Scan pace &mdash; the "
             "five-second rule</div>")
    H.append("<div class='pnote' style='margin:0 0 10px'>Your rule: a "
             "scan, a look, a scan should never be under five seconds. "
             "Measured only on rows the register calls a <b>Stocktake</b>, "
             "and only on <b>different</b> items inside the minute &mdash; "
             "a stack of seventy identical rubbish chutes is one look, "
             "however many units. Without that filter the fastest minute "
             "of the whole shut is yours: 70 in sixty seconds, moving a "
             "stack.</div>")
    H.append("<div class='tiles'>"
             "<div class='tile'><b>{:,}</b><span>counting minutes</span></div>"
             "<div class='tile'><b class='am'>{}</b><span>under 5s a look"
             "</span></div>"
             "<div class='tile'><b class='{}'>{}</b><span>sustained runs"
             "</span></div>"
             "<div class='tile'><b>{:,}</b><span>separate looks</span></div>"
             "</div>".format(
                 pace['minutes'], pace['fastMinutes'],
                 'rd' if any(r['sustained'] for r in pace['runs']) else 'gd',
                 sum(1 for r in pace['runs'] if r['sustained']),
                 pace['looks']))
    sus = [r for r in pace['runs'] if r['sustained']]
    noise = [r for r in pace['runs'] if not r['sustained']]
    if sus:
        H.append("<div class='uh'>Worth a word &mdash; sustained runs</div>")
        for r in sus:
            H.append("<div class='rr'><b>{}</b><span>{} &rarr; {} &middot; "
                     "<b>{} minutes</b> at <b>{}s</b> a look &middot; {} "
                     "different items</span></div>".format(
                         esc(r['who']), r['from'].strftime('%a %d %b %H:%M'),
                         r['to'].strftime('%H:%M'), r['mins'], r['gap'],
                         r['looks']))
        H.append("<div class='pnote'>Several minutes in a row under the "
                 "rule is a pattern, not a fast shelf. Worth asking what "
                 "that aisle looked like &mdash; not worth an accusation: "
                 "a run of identical-but-differently-described stock, or "
                 "a wall of gear visible in one glance, both look like "
                 "this.</div>")
    if noise:
        H.append("<div class='uh'>Single minutes &mdash; noise, not a "
                 "pattern</div><div class='pnote'>{} isolated minute(s): "
                 "{}. One quick minute on a tidy shelf is normal and is "
                 "listed here only so nobody thinks it was hidden."
                 "</div>".format(
                     len(noise),
                     esc('; '.join('{} {} ({}s)'.format(
                         r['who'], r['from'].strftime('%d %b %H:%M'),
                         r['gap']) for r in noise[:6]))))
    if not pace['runs']:
        H.append("<div class='pnote'>Nothing under the rule on this pull. "
                 "Every counting minute averaged five seconds or more a "
                 "look.</div>")
    H.append("</div>")

    H.append("<div class='foot'>COATES INTERNAL &middot; names "
             "individuals and their pace &middot; not for the store "
             "Wi-Fi, not for the client<br>Author: Andrew Fisher"
             "</div></div>")

    page = ("<!doctype html><html lang='en'><head><meta charset='utf-8'>"
            "<meta name='viewport' content='width=device-width,"
            "initial-scale=1'><title>Shift &amp; Counter Intel - Coates "
            "K2</title><style>" + CSS + "</style></head><body>"
            + '\n'.join(H)
            + "<script>var DATA=" + json.dumps(payload) + ";" + JS
            + "</script></body></html>")

    out_dir = os.path.join(BASE, 'Reports', today.isoformat(), 'Pages')
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir,
                       'Coates_K2_Shift_And_Counter_Intel_{}.html'
                       .format(today.isoformat()))
    with io.open(out, 'w', encoding='utf-8') as fh:
        fh.write(page)
    print(' Written      : ' + out)
    print(' Counter      : {:,} movements ({:,} out, {:,} back) | busiest '
          'hour {:02d}:00'.format(len(counter), sum(1 for e in counter
                                                    if e['way'] == 'OUT'),
                                  sum(1 for e in counter
                                      if e['way'] == 'BACK'),
                                  hrs.index(peak)))
    print(' Scan pace    : {} counting minutes, {} under 5s a look, {} '
          'sustained run(s)'.format(pace['minutes'], pace['fastMinutes'],
                                    sum(1 for r in pace['runs']
                                        if r['sustained'])))
    print(' COATES INTERNAL - names individuals. Not for the store Wi-Fi.')
    if not os.environ.get('K2_CHAINED') and hasattr(os, 'startfile'):
        try:
            os.startfile(out)
        except OSError:
            pass
    return 0


CSS = """
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0A0E14;color:#E9EEF5;
 font:400 14px/1.5 system-ui,Segoe UI,Roboto,sans-serif}
.wrap{max-width:820px;margin:0 auto;padding:0 12px 40px}
.bar0{display:flex;align-items:center;justify-content:space-between;
 background:#F26222;margin:0 -12px;padding:14px 16px}
.bar0 h1{font-size:19px;font-weight:900;color:#fff}
.siq{font-size:9px;font-weight:900;letter-spacing:2px;color:#FFD9C4}
.sub{color:#98A4B4;font-size:12px;margin:12px 0 14px;font-weight:700}
.panel{background:#151A22;border:1px solid #2A3340;border-radius:14px;
 padding:14px;margin-bottom:12px}
.ph{font-size:11px;font-weight:900;letter-spacing:1.2px;color:#98A4B4;
 text-transform:uppercase;margin-bottom:10px}
.pnote{color:#6B7789;font-size:11.5px;margin-top:9px;line-height:1.55}
.story{background:#0B111A;border-left:3px solid #F26222;border-radius:0 10px 10px 0;
 padding:10px 13px;margin-bottom:12px;font-size:12.5px;line-height:1.6;
 color:#C7CED8}
.story b{color:#fff}
.pr{display:flex;align-items:center;gap:10px;margin-bottom:7px}
.pr>span{flex:none;width:104px;font-size:10.5px;font-weight:800;
 letter-spacing:.3px;color:#98A4B4}
.bar{flex:1;display:flex;align-items:center;gap:8px;min-width:60px}
.bar i{display:block;height:9px;border-radius:5px;background:#2AA9C4;
 min-width:2px;flex:none}
.bar i.g{background:#2BB673}.bar i.r{background:#E23B2E}
.bar b{font-size:12px;font-weight:900;color:#fff;flex:none;width:52px;
 text-align:right}
.bar i{max-width:calc(100% - 4px)}
tr.never td{color:#E9A9A3}
tr.thin td{color:#E8CE9A}
td.n.a{color:#F5A623}
.bar i.a{background:#F5A623}
.thinw{font-size:9.5px;font-weight:900;letter-spacing:.5px;color:#F5A623;
 text-transform:uppercase}
.uh{font-size:10.5px;font-weight:900;letter-spacing:1px;color:#F26222;
 text-transform:uppercase;margin:14px 0 7px}
.seg{display:flex;gap:7px;margin-bottom:9px}
.seg button{flex:1;background:#0B111A;border:1px solid #2A3340;color:#98A4B4;
 border-radius:10px;padding:9px;font:900 11px/1 inherit;cursor:pointer;
 letter-spacing:.5px}
.seg button.on{background:#F26222;color:#fff;border-color:#F26222}
.q{width:100%;background:#0B111A;border:1px solid #2A3340;border-radius:10px;
 padding:11px 13px;color:#E9EEF5;font:700 14px/1 inherit}
.rr,.er{display:flex;gap:11px;align-items:baseline;padding:8px 2px;
 border-bottom:1px solid #1C232D;font-size:12.5px}
.rr:last-child,.er:last-child{border-bottom:0}
.rr b,.er b{flex:none;color:#fff;font-weight:800}
.er .tm{flex:none;width:96px;font-family:Consolas,Menlo,monospace;
 font-size:11.5px;color:#F5A623}
.er .nm{flex:1;min-width:0}
.er .nm span{display:block;color:#8794A6;font-size:11px;margin-top:2px}
.hg{display:flex;align-items:flex-end;gap:3px;height:120px;padding-bottom:16px}
.hb{flex:1;height:100%;display:flex;align-items:flex-end;position:relative}
.hb i{width:100%;border-radius:3px 3px 0 0;display:block}
.hb i.d{background:#2AA9C4}.hb i.n{background:#F26222}
.hb em{position:absolute;bottom:-15px;left:0;right:0;text-align:center;
 font-size:9px;color:#6B7789;font-style:normal;font-weight:700}
.sw{display:inline-block;width:9px;height:9px;border-radius:2px;
 vertical-align:-1px}
.sw.d{background:#2AA9C4}.sw.n{background:#F26222}
.vs{display:grid;grid-template-columns:1fr 1fr;gap:11px}
.vsc{background:#0B111A;border:1px solid #2A3340;border-radius:12px;
 padding:12px;border-top:4px solid #2AA9C4}
.vsc.night{border-top-color:#F26222}
.vsc>b{font-size:12px;font-weight:900;letter-spacing:1.4px;color:#2AA9C4}
.vsc.night>b{color:#F26222}
.vr{display:flex;justify-content:space-between;align-items:baseline;
 margin-top:8px;font-size:11.5px;color:#98A4B4}
.vr em{font-style:normal;font-size:17px;font-weight:900;color:#fff}
.tw{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12px;min-width:560px}
th{text-align:left;font-size:9.5px;letter-spacing:.8px;color:#6B7789;
 text-transform:uppercase;padding:6px 8px;border-bottom:1px solid #2A3340}
td{padding:8px;border-bottom:1px solid #1C232D;color:#C7CED8;
 vertical-align:top}
td b{color:#fff;display:block}
td span{font-size:9.5px;font-weight:900;letter-spacing:.8px;color:#2AA9C4}
tr.night td span{color:#F26222}
td.n{text-align:right;font-weight:800;color:#fff;white-space:nowrap}
td.n.z{color:#E23B2E}
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));
 gap:10px}
.tile{background:#0B111A;border:1px solid #2A3340;border-radius:12px;
 padding:11px;text-align:center}
.tile b{display:block;font-size:20px;font-weight:900;color:#fff}
.tile span{font-size:9.5px;font-weight:800;letter-spacing:.5px;color:#98A4B4;
 text-transform:uppercase}
.am{color:#F5A623}.rd{color:#E23B2E}.gd{color:#2BB673}
.foot{text-align:center;color:#5A6472;font-size:10.5px;margin-top:18px;
 line-height:1.7}
@media print{body{background:#fff;color:#000}
 .panel,.tile,.vsc{border-color:#bbb;background:#fff}
 .bar0{background:#fff;border-bottom:3px solid #F26222}
 .bar0 h1,.tile b,td b,.vr em{color:#000}}
"""

JS = """
var WAY='out';
function way(w){ WAY=w;
  var bs=document.querySelectorAll('.seg button');
  bs[0].className=(w==='out')?'on':''; bs[1].className=(w==='back')?'on':'';
  go(); }
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;')
  .replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function go(){
  var q=(document.getElementById('q').value||'').trim().toUpperCase();
  var L=DATA[WAY]||[], out=document.getElementById('res');
  var hits=q?L.filter(function(r){
    return (r.k||'').indexOf(q)===0
      || (r.t||'').toUpperCase().indexOf(q)>=0
      || (r.w||'').toUpperCase().indexOf(q)>=0
      || (r.co||'').toUpperCase().indexOf(q)>=0
      || (r.i||'').toUpperCase().indexOf(q)>=0
      || (r.n||'').toUpperCase().indexOf(q)>=0; }):L;
  /*  a short preview until something is typed - the whole 500 up
      front made the page a mile long and answered no question  */
  var cap=q?120:12;
  out.innerHTML='<div class="pnote">'+hits.length+' of '+L.length
    +(WAY==='out'?' issues':' returns')+(q?' match'
      :' &mdash; newest 12 shown, type a time like <b>10:3</b>, a name '
      +'or an item number to search all '+L.length)+'</div>'
    +hits.slice(0,cap).map(function(r){
      return '<div class="er"><span class="tm">'+esc(r.t)+'</span>'
       +'<span class="nm">'+esc(r.n||r.i)
       +'<span>'+esc(r.w||'-')+(r.co?' &middot; '+esc(r.co):'')
       +' &middot; '+esc(r.i)+'</span></span></div>'; }).join('')
    +(hits.length>cap?'<div class="pnote">Showing '+cap+' of '
      +hits.length+' &mdash; keep typing to narrow it.</div>':'');
}
go();
"""


if __name__ == '__main__':
    import sys
    sys.exit(build())
