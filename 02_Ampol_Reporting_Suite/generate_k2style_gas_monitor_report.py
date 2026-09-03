#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
COATES K2-STYLE REPORT - AMPOL GAS MONITOR OPERATIONS
SiteIQ exports in -> Coates house-style PDF out
=====================================================================
Author: Andrew Fisher
The Coates Way - Operational Excellence - POWERED BY SITEIQ

WHAT THIS IS
  The Ampol gas monitor report in the K2 house style: white A4 pages
  inside the orange Coates frame, dark header panel, KEY strip, peach
  callouts, dark KPI tiles, the scorecard donut with its arithmetic
  printed beside every score, zebra tables and the tool store footer.

WHERE THE NUMBERS COME FROM (changed 02 Sep 2026)
  Every figure is counted by gasmon_engine from the two SiteIQ exports
  in Data\\ - RENTAL_STOCK.xlsx (where every monitor is now) and
  TRANSACTIONS.xlsx (every issue and return). The Excel workbook is no
  longer a source of numbers; it is attached to the email as before and
  its summary cells are compared on the data page.

  Three windows, always labelled on the page:
    year to date     the whole transactions export (01 Jan to the pull)
    last 30 days     the 30 days up to the pull
    yesterday        the last complete day before the pull
  "Not returned same day" is the behaviour measure; who does it, by
  name and by company, is the heart of the report.

USAGE
  01_RUN_GAS_MONITOR_REPORT.bat builds this PDF, then the email draft.
  Or on its own:  python generate_k2style_gas_monitor_report.py

OUTPUTS (03 Sep 2026 - one file-name rule, ampol_names.report_stem)
  Reports\<day>\Gas_Monitors\
    Coates_Ampol_Gas_Monitors_<DDMonYYYY>.pdf               the client PDF
    Coates_Ampol_Gas_Monitors_<DDMonYYYY>.html              the same pages
    Coates_Ampol_Gas_Monitors_<DDMonYYYY>_PositionCard.png  the phone card
  generate_k2style_email.py then writes _OUTLOOK.eml and _EMAIL.html on
  the same stem and attaches the PDF and the card.

WHAT THE 10/10 PASS ADDED (03 Sep 2026)
  - Cover carries the RAG stripe (the same status as the position band)
    and the freshness line (pulled / built / age).
  - "Since the last pull" page: pull against pull from Data\previous
    (pull_diff) when an earlier export is parked there, the honest note
    when it is not, and the 24 hours of traffic before the pull from
    TRANSACTIONS either way.
  - "The trend - last 30 days" page once seven days are on the
    scoreboard (History\report_history.json); until then the data page
    says when it will appear.
  - PDF properties (Author: Andrew Fisher, subject, keywords) and the
    bookmark pane from the section headings (pdf_finish).
  - The pages are printed from the HTML written beside the PDF, so the
    embedded Lato face in k2style.css resolves and every machine prints
    the same widths.

WHAT THE LAYOUT PASS CHANGED (03 Sep 2026)
  - Page 2, the position, reads top to bottom: hero head and key strip,
    the RAG band, six tiles with their movement notes, "Three things to
    do today" (drawn from the engine's own lists), then the story in
    three lines. The health donut, the four scores and the fleet strip
    moved to page 3, "The position in detail".
  - The page number sits in the footer of every page (k2shell.render_page);
    the key strip prints on page 2 only.
  - The cover carries "What's inside" with real page numbers: the pages
    are printed once, the headings are read off that PDF
    (pdf_finish.contents_from_pdf), and the document is printed again
    with the contents on the cover - same page count, asserted.
  - One dash style: the long dash never prints (VERIFY_NUMBERS fails on it).

DEPENDENCIES
  pip install openpyxl pillow        (weasyprint optional)
  Offline at run time. No web fonts, no CDN, no API calls. The PDF is
  printed by Microsoft Edge in headless mode when WeasyPrint is not
  available - Edge is on every Coates laptop.
=====================================================================
"""

import glob
import html as _html
import os
import re
import sys
from datetime import datetime, timedelta

import ampol_names
import ampol_paths
import gasmon_engine as ge
import pdf_finish
import pull_diff
import report_history as rh
import txn_insights as ti
import k2shell as sh
from k2shell import esc, money, num, K

try:
    from weasyprint import HTML, CSS
    _HAVE_WEASY = True
except Exception:            # ImportError or OSError from missing GTK DLLs
    _HAVE_WEASY = False


# =====================================================================
# CONFIG - report identity and the people on the footer
# =====================================================================

CONFIG = {
    "client": "Ampol",
    "title": "Gas Monitor Operations",
    "kicker": "COATES · GAS MONITOR OPERATIONS REPORT",
    "project": "Ampol Lytton Refinery · Dräger X-am 5000 Fleet",
    # WHY (03 Sep 2026): one file-name rule for the whole suite
    # (ampol_names.report_stem): Coates_Ampol_Gas_Monitors_<DDMonYYYY>
    # + .pdf / .html / _PositionCard.png here, _OUTLOOK.eml in the email.
    "stem_key": "gas",
    "css_name": "k2style.css",
    "asat_note": "(SiteIQ register pull)",

    # The tool store team on the footer and the closing page. Add the
    # Ampol store crew here as:
    #   {"name": ..., "role": ..., "shift": "DAY"/"NIGHT"/"",
    #    "email": ..., "blurb": ...}
    "team": [
        {"name": "Andrew Fisher", "role": "Shutdown Manager",
         "shift": "", "email": "andrew.fisher@coates.com.au",
         "blurb": "Oversees the store and the fleet - anything at all, start here",
         "lead": True},
    ],

    "key_items": [
        ("orange", "RETURN DAILY", "back to the tool store every shift"),
        ("blue", "BUMP TEST", "bump, charge and scan before issue"),
        # WHY (03 Sep 2026): the key strip prints bigger on page 2 now - a
        # shorter tail keeps it to one line.
        ("amber", "OUT OF CALIBRATION", "is out of service"),
    ],

    # WHY (03 Sep 2026): the page-1 RAG band. Default lines - change them
    # here and the rule text on the page follows. Units out 30 days or more.
    "rag_amber_30": 10,
    "rag_red_30": 40,
    "rag_sameday_target": 85,
    "cover_page": True,

    # WHY (03 Sep 2026): the since-the-last-pull page is a fixed A4 page,
    # so every list on it is capped and says "showing N of M". Lower these
    # if the fit check ever flags that page.
    "since_company_rows": 13,     # 24-hour traffic by company (no earlier pull)
    "since_move_rows": 5,         # individual movements listed (no earlier pull)
    "since_diff_rows": 5,         # came back / went out lists (earlier pull found)
    "since_crossed_rows": 3,      # crossed 30 days, oldest first

    # rows per appendix page - compact single-line rows
    "appendix_rows": 26,
    "league_rows": 12,
    "league_ytd_rows": 15,
    "company_rows": 10,
    "where_rows": 10,
}

# palette shorthands
GREY = "#5F7183"
PALE_BLUE = "#7FB3D5"
DEEP_RED = "#F0603E"


def tag(text, cls):
    return f'<span class="tag {cls}">{esc(text)}</span>'


def pc(v, d=0):
    try:
        return f"{float(v):.{d}f}%"
    except (TypeError, ValueError):
        return "-"


def sd_class(pct):
    return "g" if pct >= 85 else "a" if pct >= 70 else "rd"


def dfmt(d):
    return d.strftime("%d %b %Y") if d else ""


def hhmm(d):
    return d.strftime("%H:%M") if d else ""


def plain(fragment):
    """The words of a page fragment with the markup taken off - for the
    history scoreboard and the phone card, which hold text, not HTML."""
    return _html.unescape(re.sub(r"<[^>]+>", "", str(fragment or ""))).replace("\xa0", " ")


def who_s(name):
    """A hirer name as printed. Names are people, but a workflow account
    can carry the site name - the former one never prints."""
    return esc(ampol_names.display_desc(name))


def report_stem():
    return ampol_names.report_stem(CONFIG["stem_key"])


TREND_MIN_DAYS = 7   # days on the scoreboard before the trend page appears


# =====================================================================
# CHART HELPERS KEPT LOCALLY
# =====================================================================
# WHY (03 Sep 2026): k2shell now defines line_chart and stacked_hbars
# twice. The newer definitions (a trend line with named series, and the
# four-band ageing bars) shadow the older drawings these pages were built
# on, so the calls stopped working on the shared shell. The two older
# drawings live here, unchanged, until the shell gives them distinct
# names; the trend page uses the new sh.line_chart on purpose.

def line_chart_multi(x_labels, series, w=636, h=196, label_every=1, pct=False,
                     annotate=()):
    """Multi-series line chart on a dark panel - the K2 trend pattern.
    series: [{"vals": [...], "colour": hex, "label": str, "fill": bool}]
    annotate: indices whose value gets printed above the point."""
    n = len(x_labels)
    if n < 2:
        return '<div class="note">Not enough data points in the source.</div>'
    top, base, pad_l, pad_r = 30, h - 26, 8, 34
    plot_w = w - pad_l - pad_r
    ymax = 100 if pct else max(max(s["vals"]) for s in series) * 1.15 or 1

    def X(i):
        return pad_l + plot_w * i / (n - 1)

    def Y(v):
        return base - (base - top) * (v / ymax)

    out = [f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    for g in (0.25, 0.5, 0.75, 1.0):
        y = base - (base - top) * g
        out.append(f'<line x1="{pad_l}" y1="{y:.1f}" x2="{w - pad_r}" '
                   f'y2="{y:.1f}" stroke="#26313D" stroke-width="0.7"/>')
        if pct:
            out.append(f'<text x="{w - pad_r + 5}" y="{y + 3:.1f}" fill="#5F7183" '
                       f'font-family="Lato, Calibri, sans-serif" font-size="7.4">'
                       f'{int(ymax * g)}%</text>')
    out.append(f'<line x1="{pad_l}" y1="{base}" x2="{w - pad_r}" y2="{base}" '
               f'stroke="#3A4756" stroke-width="1"/>')
    for i, lab in enumerate(x_labels):
        if i % label_every == 0 or i == n - 1:
            anchor = "start" if i == 0 else "middle"
            out.append(f'<text x="{X(i):.1f}" y="{base + 13}" text-anchor="{anchor}" '
                       f'fill="#8A9AAC" font-family="Lato, Calibri, sans-serif" '
                       f'font-size="7.2">{esc(lab)}</text>')
    for s in series:
        pts = " ".join(f"{X(i):.1f},{Y(v):.1f}" for i, v in enumerate(s["vals"]))
        if s.get("fill"):
            out.append(f'<polygon points="{pad_l},{base} {pts} '
                       f'{X(n - 1):.1f},{base}" fill="{s["colour"]}" '
                       f'fill-opacity="0.13"/>')
        out.append(f'<polyline points="{pts}" fill="none" stroke="{s["colour"]}" '
                   f'stroke-width="2.2" stroke-linejoin="round" '
                   f'stroke-linecap="round"/>')
        lx, lv = n - 1, s["vals"][-1]
        out.append(f'<circle cx="{X(lx):.1f}" cy="{Y(lv):.1f}" r="3.4" '
                   f'fill="{s["colour"]}"/>')
        out.append(f'<text x="{X(lx) + 6:.1f}" y="{Y(lv) + 3.5:.1f}" '
                   f'fill="#FFFFFF" font-family="Lato, Calibri, sans-serif" '
                   f'font-size="9" font-weight="700">'
                   f'{int(round(lv))}{"%" if pct else ""}</text>')
        for i in annotate:
            if 0 <= i < n:
                v = s["vals"][i]
                out.append(f'<text x="{X(i):.1f}" y="{Y(v) - 6:.1f}" '
                           f'text-anchor="middle" fill="#C9D6E2" '
                           f'font-family="Lato, Calibri, sans-serif" font-size="7.4">'
                           f'{int(round(v))}{"%" if pct else ""}</text>')
    lx = w - 150 - (len(series) - 1) * 60
    for j, s in enumerate(series):
        out.append(f'<circle cx="{lx + j * 92}" cy="9" r="3.8" fill="{s["colour"]}"/>'
                   f'<text x="{lx + 8 + j * 92}" y="12" fill="#C9D6E2" '
                   f'font-family="Lato, Calibri, sans-serif" font-size="8">{esc(s["label"])}</text>')
    out.append("</svg>")
    return "".join(out)


def stacked_hbars_segs(rows, segs, w=636, rowh=25, lab_w=150):
    """One stacked horizontal bar per row. rows: (label, [v1, v2, ...]);
    segs: (name, colour) per value position. Total prints on the right,
    non-zero segment counts print inside their block."""
    if not rows:
        return '<div class="note">Nothing recorded in the source.</div>'
    h = len(rows) * rowh + 26
    mx = max(sum(v) for _, v in rows) or 1
    bar_w = w - lab_w - 44
    out = [f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    lx = 0
    for name, col in segs:
        out.append(f'<rect x="{lx}" y="3" width="9" height="9" rx="2" fill="{col}"/>'
                   f'<text x="{lx + 13}" y="11" fill="#C9D6E2" '
                   f'font-family="Lato, Calibri, sans-serif" font-size="8">{esc(name)}</text>')
        lx += 13 + 5.0 * len(name) + 14
    for i, (lab, vals) in enumerate(rows):
        y = 22 + i * rowh
        out.append(f'<text x="0" y="{y + 11}" fill="#C9D6E2" '
                   f'font-family="Lato, Calibri, sans-serif" font-size="9">{esc(str(lab)[:26])}</text>')
        out.append(f'<rect x="{lab_w}" y="{y + 2}" width="{bar_w}" height="12" rx="4" fill="#26313D"/>')
        x = lab_w
        for (name, col), v in zip(segs, vals):
            if not v:
                continue
            sw = bar_w * v / mx
            out.append(f'<rect x="{x:.1f}" y="{y + 2}" width="{sw:.1f}" height="12" fill="{col}"/>')
            if sw > 14:
                out.append(f'<text x="{x + sw / 2:.1f}" y="{y + 11}" text-anchor="middle" '
                           f'fill="#FFFFFF" font-family="Lato, Calibri, sans-serif" '
                           f'font-size="7.6" font-weight="700">{v}</text>')
            x += sw
        out.append(f'<text x="{w}" y="{y + 11}" text-anchor="end" fill="#FFFFFF" '
                   f'font-family="Lato, Calibri, sans-serif" font-size="9.4" '
                   f'font-weight="700">{sum(vals)}</text>')
    out.append("</svg>")
    return "".join(out)


# =====================================================================
# THE PAGES
# =====================================================================

def fleet_segments(m):
    """The stacked band of where every monitor is, drawn from the same
    counts as the tiles. Empty segments are left off."""
    seg = [
        ("Crew", m["crew_out"], K["orange"]),
        ("FCCU", m["fccu"], K["blue"]),
        ("Ops", m["ops"], K["amber"]),
        ("Future Fuels", m["ff"], K["lime"]),
        ("After hrs", m["afterhours"], PALE_BLUE),
        ("Available", m["available"], K["green"]),
        ("Repairs", m["repairs"], K["red"]),
    ]
    return [s for s in seg if s[1] > 0]


def three_things_gas(m):
    """The three actions for the position page, every one read off the
    engine's own lists - never typed in. (1) the company holding the most
    monitors out 30 days or more, (2) the oldest monitor out, (3) the
    Dräger repair queue (or, when the queue is empty, yesterday's not-back
    count). who_by is the owner and the due date the RAG band uses.
    WHY (03 Sep 2026): a reader with one minute needs the three phone
    calls, not the four scores - the scores moved to the next page."""
    R = m["rules"]
    due = rag_parts(m)["due"]
    who_by = f"Andrew Fisher · by {due}"
    items = []
    # 1. the company with the most monitors out 30 days or more
    cos = [w for w in m["where"] if w["d30"]]
    if cos:
        top = max(cos, key=lambda w: (w["d30"], w["outstanding"]))
        oldest = max((x["days"] for x in m["outstanding_items"]
                      if x["co"] == top["name"] and x["days"] >= 30), default=0)
        items.append((f"Chase {top['name']} for {num(top['d30'])} monitor{'s' if top['d30'] != 1 else ''} "
                      f"out 30 days or more",
                      f"{money(top['exposure'])} at replacement; oldest {num(oldest)} days", who_by))
    else:
        cos = [w for w in m["where"] if w["outstanding"]]
        if cos:
            top = max(cos, key=lambda w: w["outstanding"])
            oldest = max((x["days"] for x in m["outstanding_items"] if x["co"] == top["name"]), default=0)
            items.append((f"Chase {top['name']} for {num(top['outstanding'])} overdue monitor"
                          f"{'s' if top['outstanding'] != 1 else ''}",
                          f"none at 30 days yet; oldest {num(oldest)} days", who_by))
    # 2. the oldest monitor out. outstanding_items is the crew list, but a
    #    custody account is named as the account, never as a person.
    if m["outstanding_items"]:
        x = m["outstanding_items"][0]
        kind = ge.account_kind(x["who"], x["co"])
        if kind != "crew" and kind in m["custody"]:
            holder = f"the {m['custody'][kind]['label']} account"
        elif kind == "repair":
            holder = "the Dräger service line"
        else:
            holder = f"{ampol_names.display_desc(x['who'])}, {x['co']}"
        items.append((f"Recover {x['bc']} from {holder}",
                      f"{num(x['days'])} days out, since {dfmt(x['on_dt'])}", who_by))
    # 3. the repair queue, or yesterday's not-back count when it is empty
    if m["repairs"]:
        oldest_q = m["repair_items"][0]["days"] if m["repair_items"] else 0
        stale = len(m["repair_stale"])
        why = f"oldest in the queue {num(oldest_q)} days"
        if stale:
            why += f"; {num(stale)} past {num(R['stale_repair_days'])} days"
        items.append((f"Clear {num(m['repairs'])} monitor{'s' if m['repairs'] != 1 else ''} from the "
                      f"Dräger repair queue", why, who_by))
    elif m["yday_nsd"]:
        items.append((f"Chase the {num(m['yday_nsd'])} monitor{'s' if m['yday_nsd'] != 1 else ''} "
                      f"not back from yesterday",
                      f"{num(m['yday_still_out'])} still out at {hhmm(m['asat'])}; named on the yesterday page",
                      who_by))
    return sh.three_things(items)


def position_story(m, short):
    """The story callout. short=True is the three-line version for the
    position page (about 45 words); the full paragraph prints on the
    detail page."""
    asat = m["asat"]
    if short:
        return f"""<div class="callout tight">
  <span class="lead">The position at {hhmm(asat)}, {dfmt(asat)}.</span>
  <b>{num(m['fleet_total'])} Dräger X-am 5000 monitors</b> on the Ampol register:
  <b class="o">{num(m['available'])} on the shelf</b>, <b>{num(m['crew_out'])} out to crew</b>
  (<b class="o">{num(m['outstanding'])} overdue</b>), {num(m['custody_total'])} in custody and
  <b>{num(m['repairs'])} in the Dräger repair queue</b>. Counted from the SiteIQ exports - nothing estimated.
</div>"""
    return f"""<div class="callout tight">
  <span class="lead">The position at {hhmm(asat)}, {dfmt(asat)}.</span>
  <b>{num(m['fleet_total'])} Dräger X-am 5000 monitors</b> are on the Ampol
  register: <b class="o">{num(m['available'])} on the shelf</b>,
  <b>{num(m['crew_out'])} out to crew</b> ({num(m['out_today'])} today,
  <b class="o">{num(m['outstanding'])} overdue</b> from earlier days),
  {num(m['custody_total'])} in custody (FCCU, Operations, Future Fuels, after-hours)
  and <b>{num(m['repairs'])} in the Dräger repair queue</b>. Counted from the SiteIQ
  exports on the data page - nothing is estimated.
</div>"""


def page_position(m):
    """Page 2, the position. WHY (03 Sep 2026): one grammar for every
    fixed-page family - hero head and key strip, the RAG band, the six
    tiles with their movement notes, the three things to do today, then
    the story in three lines. The donut, the four scores and the fleet
    strip moved to the next page (page_position_detail)."""
    R = m["rules"]
    asat = m["asat"]
    C = CONFIG
    sd = m["d30"]["sd_pct"]
    tiles = sh.tiles_plus([
        ("box", num(m['fleet_total']), "Total fleet", mv("fleet", m['fleet_total'], "up", "on the Ampol register")[0],
         mv("fleet", m['fleet_total'], "up", "on the Ampol register")[1]),
        ("check", num(m['available']), "Available now",
         mv("available", m['available'], "up", f"ready for issue at {hhmm(asat)}")[0],
         mv("available", m['available'], "up", "")[1] or ("green" if m['available'] >= R['availability_target'] else "amber")),
        ("swap", num(m['crew_out']), "Out to crew",
         mv("crew_out", m['crew_out'], "down", f"{num(m['out_today'])} today + {num(m['outstanding'])} overdue")[0],
         mv("crew_out", m['crew_out'], "down", "")[1] or "grey"),
        ("warn", num(m['outstanding']), "Overdue 1+ days",
         mv("overdue", m['outstanding'], "down", f"{num(m['out_8_29'])} at 8-29 days, {num(m['out_30'])} at 30+")[0],
         mv("overdue", m['outstanding'], "down", "")[1] or ("red" if m['outstanding'] else "green")),
        ("clock", num(m['out_30']), "Out 30 days or more",
         mv("overdue_30", m['out_30'], "down", f"{money(m['exposure'])} replacement exposure")[0],
         mv("overdue_30", m['out_30'], "down", "")[1] or ("red" if m['out_30'] else "green")),
        ("bars", f"{sd}%", "Same-day, last 30 days",
         mv("same_day_30", sd, "up", f"target {C['rag_sameday_target']}% - {num(m['d30']['draws'])} crew draws")[0],
         mv("same_day_30", sd, "up", "")[1] or ("green" if sd >= C['rag_sameday_target'] else "amber")),
    ], per_row=3)
    return f"""{rag_band_gas(m)}
{log_line(m)}
{tiles}
{three_things_gas(m)}
{position_story(m, short=True)}"""


# WHY (03 Sep 2026): the repair queue is the tool store's Redline (fleet
# unavailable). The Coates Way centre target is under 15%, so the detail
# tile says which side of that line the fleet sits. Wording and target
# from The Coates Way, branch edition, July 2026 (Docs/).
def page_position_detail(m):
    """Page 3, the position in detail: the full story paragraph, the
    health donut with the four scores and their arithmetic, the fleet
    strip, and the counts behind the six tiles."""
    R = m["rules"]
    asat = m["asat"]
    hs = m["health"]
    d30 = m["d30"]
    cust = m["custody"]
    return f"""<div class="sect"><h3>The position in detail</h3></div>
{position_story(m, short=False)}
<table class="two" style="margin-top:6px"><tr>
  <td style="width:29%">
    <div class="donut-wrap">
      {sh.donut(hs, sh.health_hex(hs), f"{hs}%", sh.health_word(hs), size=118, thick=16)}
      <div class="donut-cap">Health score = plain average of the four scores:
        ({m['score_availability']} + {m['score_sameday']} + {m['score_repairs']}
        + {m['score_30']}) &divide; 4 = <b>{hs}</b></div>
    </div>
  </td>
  <td style="padding-left:10px">
    {sh.score_rows([
        ("Tool availability", m['score_availability'],
         f"{num(m['available'])} on the shelf against a {num(R['availability_target'])}-unit target"),
        ("Same-day returns, last 30 days", m['score_sameday'],
         f"{d30['sd_pct']}% of {num(d30['draws'])} crew draws back the same day ({m['d30_label']})"),
        ("Repairs", m['score_repairs'],
         f"100 less the {m['fleet_impact_pct']}% of fleet in the repair queue ({num(m['repairs'])} of {num(m['fleet_total'])})"),
        ("30+ day control", m['score_30'],
         f"100 less 3 per monitor out 30 days or more ({num(m['out_30'])} out)"),
    ])}
  </td>
</tr></table>
<div class="sub-h">The fleet at a glance <span class="thin">- where every monitor is at {hhmm(asat)}</span></div>
<div class="chartpanel">{sh.stackband(fleet_segments(m))}</div>
{sh.tiles([
    ("swap", num(m['out_today']), "Out today", "on the normal daily cycle", "grey"),
    ("layers", num(m['custody_total']), "In custody",
     f"FCCU {num(m['fccu'])} · Ops {num(m['ops'])} · Future Fuels {num(m['ff'])} · after hours {num(m['afterhours'])}", "grey"),
    ("wrench", num(m['repairs']), "In the repair queue",
     f"{m['fleet_impact_pct']}% of the fleet - Redline target under 15%",
     "green" if m['fleet_impact_pct'] < 15 else "red"),
    ("box", num(m['usable_fleet']), "Usable fleet", f"{num(m['fleet_total'])} owned less {num(m['repairs'])} in repair", "grey"),
])}
<div class="note">Health is green from 85, amber from 70, red below. Every score prints its own
  arithmetic; the four inputs are the shelf count against the {num(R['availability_target'])}-unit
  target, the 30-day same-day rate, the share of the fleet in the repair queue, and the units out 30
  days or more. Custody holdings (FCCU {num(cust['fccu']['n'])}, Operations {num(cust['ops']['n'])},
  Future Fuels {num(cust['ff']['n'])}, after-hours {num(cust['afterhours']['n'])}) sit outside the crew
  count and are listed with their ages on the overdue page.</div>"""


def mv(key, value, good, fallback):
    """Movement note for a page-1 tile: the recorded change since the last
    run when there is one, otherwise the plain note. (text, css_class)."""
    txt, cls = rh.movement("gas", key, _ASAT_DT[0], value, good)
    return (txt, cls) if txt else (fallback, "")


_ASAT_DT = [None]   # set in build() so the tile helpers can read history


def rag_parts(m):
    """The page-1 RAG band in parts - status, headline, rule, owner, action
    and the due date - so the cover stripe, the phone card and the history
    scoreboard all carry the same words as the band."""
    C, R = CONFIG, m["rules"]
    n30 = m["out_30"]
    sd = m["d30"]["sd_pct"]
    status = sh.rag_of(n30, C["rag_amber_30"], C["rag_red_30"])
    if status == "green" and sd < C["rag_sameday_target"] - 10:
        status = "amber"
    # WHY (03 Sep 2026): the due date counts from the pull, never from the
    # clock on the machine that built the report.
    due = (m["asat"] + timedelta(days=2)).strftime("%d %b %Y")
    head = (f'<b class="o">{num(n30)} monitors</b> have been out 30 days or more '
            f'({money(m["exposure"])} of replacement exposure) and <b>{sd}%</b> of the last '
            f'30 days&rsquo; draws came back the same day - {num(m["outstanding"])} units are '
            f'overdue in all.')
    rule = (f'Units out 30 days or more: Green under {C["rag_amber_30"]}, Amber from '
            f'{C["rag_amber_30"]}, Red from {C["rag_red_30"]}; Amber if same-day returns fall '
            f'more than 10 points under the {C["rag_sameday_target"]}% target. Default lines - set in CONFIG.')
    owner = "<b>Andrew Fisher</b>, Shutdown Manager - Coates tool store"
    action = (f'Appendix A (every overdue unit, oldest first) to each company&rsquo;s supervisor '
              f'by <b>{due}</b>; units recovered are reported on the next run.')
    return {"status": status, "head": head, "rule": rule, "owner": owner, "action": action, "due": due}


def rag_band_gas(m):
    p = rag_parts(m)
    return sh.rag_band(p["status"], p["head"], p["rule"], p["owner"], p["action"], tight=True)


# =====================================================================
# THE LOG, CHECKED - what the transaction rows say about the same fleet
# =====================================================================
# WHY (03 Sep 2026): txn_insights reads the whole TRANSACTIONS export once
# and answers, for the fleet barcodes this report already counts, the
# questions the band's rule sits on: how long a completed hire really
# runs, which rows are a scan habit rather than a hire, where the register
# and the log disagree, and who holds the fleet. Every figure is a count
# over rows in the export - nothing is modelled or forecast.

def hours_s(days):
    """Days from the engine as hours for the page: one decimal under a
    day, whole hours from there ('10.4', '46')."""
    h = days * 24
    return f"{h:.1f}" if h < 24 else f"{h:.0f}"


def holder_s(name):
    """A holder as printed - the display rule, and one dash style (a
    SiteIQ account name can carry a short dash of its own)."""
    return esc(ampol_names.display_desc(name).replace("–", "-").replace("—", "-"))


def log_insights(ctx_log, scope):
    """The engine's answers for the fleet barcodes, in one dict for the
    pages: return windows over every completed hire, data quality, the
    holders and their 80/20, and the log's report period."""
    rw = ti.return_windows(ctx_log, scope)
    dq = ti.data_quality(ctx_log, scope)
    ho = ti.holders(ctx_log, scope)
    n80 = ho["n80_items"]
    cust80 = sum(1 for r in ho["rows"][:n80] if ge.account_kind(r["hirer"], r["company"]) != "crew")
    return {"rw_all": rw["all"], "dq": dq, "ho": ho, "cust80": cust80,
            "window": ctx_log["tx_window"]}


def log_line(m):
    """One true sentence under the band on page 2: the return window the
    log shows for completed monitor hires this year (the 90th percentile,
    in hours). The band sets the rule; this is the behaviour under it."""
    L = m.get("log") or {}
    a = L.get("rw_all")
    if not a:
        return ""
    return (f'<div class="note" style="margin-top:7px">Nine in ten completed monitor hires this year were back '
            f'inside <b>{hours_s(a["p90"])} hours</b> - counted from {num(a["n"])} completed hires in the '
            f'transaction log, half of them back inside {hours_s(a["median"])} hours and {a["sd_pct"]}% the same day.</div>')


# =====================================================================
# SINCE THE LAST PULL - what moved
# =====================================================================

def moves_24h(l):
    """Every issue and return of a fleet monitor in the 24 hours before
    the pull as one list of movements, company A to Z then time."""
    ev = ([dict(e, kind="Out") for e in l["issued"]]
          + [dict(e, kind="Back") for e in l["returned"]])
    ev.sort(key=lambda e: (ampol_names.sort_key(e["company"]), e["at"], e["barcode"]))
    return ev


def _net(n):
    return f'<span class="rd">+{num(n)}</span>' if n > 0 else (f'<span class="g">{num(n)}</span>' if n < 0 else '<span class="tbc">0</span>')


def _cap_note(shown, total, what):
    return (f"showing {num(shown)} of {num(total)} {what}" if total > shown
            else f"{num(total)} {what}")


def page_since(m, d):
    """Since the last pull. Pull against pull from Data\\previous when an
    earlier RENTAL_STOCK export is parked there; the honest note when it
    is not. The 24 hours before the pull, from TRANSACTIONS, either way.
    Every row is a barcode read from the exports - nothing estimated."""
    C = CONFIG
    cur = d["cur_time"]
    l = d["last24"]
    ws, we = l["window"]
    ev = moves_24h(l)
    n_out, n_back = len(l["issued"]), len(l["returned"])
    n_bc = len({e["barcode"] for e in ev})
    byco = {}
    for e in ev:
        c = byco.setdefault(e["company"], {"out": 0, "back": 0, "people": set()})
        c["out" if e["kind"] == "Out" else "back"] += 1
        c["people"].add(e["hirer"])
    cos = sorted(byco, key=ampol_names.sort_key)
    win_s = f"{ws:%d %b %Y %H:%M} to {we:%d %b %Y %H:%M}"
    top_co = max(cos, key=lambda c: byco[c]["out"] + byco[c]["back"]) if cos else ""

    def company_rows(cap):
        rows = []
        for co in cos[:cap]:
            c = byco[co]
            rows.append([esc(co), num(c["out"]), num(c["back"]), _net(c["out"] - c["back"]),
                         num(len(c["people"]))])
        if not rows:
            rows = [['<span class="tbc">No fleet monitor moved in the window.</span>', "", "", "", ""]]
        return rows

    head = '<div class="sect"><h3>Since the last pull - what moved</h3></div>'

    if not l["available"]:
        h24 = ('<div class="sub-h">The 24 hours before the pull</div>'
               '<div class="note">The TRANSACTIONS export is not in Data\\ - the last 24 hours '
               'cannot be counted this run. Nothing is estimated in its place.</div>')
    elif not d["have_previous"]:
        mrows = []
        for e in ev[:C["since_move_rows"]]:
            kind = ('<span class="or">Out</span>' if e["kind"] == "Out" else '<span class="g">Back</span>')
            mrows.append([esc(e["at"].strftime("%d %b %H:%M")), kind, esc(e["company"]),
                          who_s(e["hirer"]), esc(e["barcode"])])
        if not mrows:
            mrows = [['<span class="tbc">No fleet monitor moved in the window.</span>', "", "", "", ""]]
        h24 = f"""<div class="sub-h">The 24 hours before the pull <span class="thin">- {win_s}; by company, A to Z; {_cap_note(min(len(cos), C["since_company_rows"]), len(cos), "companies")}</span></div>
{sh.dtable(["Company", "Draws", "Returns", "Net out", "People"], company_rows(C["since_company_rows"]),
           ["", "r", "r", "r", "r"], cls="cp")}
<div class="sub-h">The movements <span class="thin">- company A to Z, then time; {_cap_note(len(mrows) if ev else 0, len(ev), "movements")}</span></div>
{sh.dtable(["When", "Movement", "Company", "Who", "Asset"], mrows, ["nw", "", "", "", ""], cls="cp")}
<div class="note">Counted from every TRANSACTIONS row whose barcode is on the gas monitor register - crew
  draws and the custody and workflow lines alike: traffic across the counter, not the crew-only same-day
  measure. Net out = draws less returns.</div>"""
    else:
        # WHY (03 Sep 2026): with an earlier pull the page is carried by the
        # pull-against-pull lists, so the 24-hour block is its counts in a
        # line - the same figures, the company table waits for the day the
        # page has room.
        busiest = (f" Busiest: <b>{esc(top_co)}</b> with {num(byco[top_co]['out'] + byco[top_co]['back'])} movements."
                   if top_co else "")
        h24 = f"""<div class="sub-h">The 24 hours before the pull <span class="thin">- {win_s}, every fleet monitor</span></div>
<div class="note"><b>{num(n_out)} draws</b> and <b>{num(n_back)} returns</b> of fleet monitors in the window -
  {num(n_bc)} distinct monitors across {num(len(cos))} companies, counted from every TRANSACTIONS row whose
  barcode is on the gas monitor register (custody and workflow lines included).{busiest}</div>"""

    if not d["have_previous"]:
        traffic = (f' In the 24 hours before the pull, <b class="o">{num(n_out)} fleet monitors were drawn</b> and '
                   f'<b class="o">{num(n_back)} came back</b> - {num(n_bc)} distinct monitors across '
                   f'{num(len(cos))} companies, counted from the transaction log.' if l["available"] else "")
        callout = f"""<div class="callout tight">
  <span class="lead">Pull against pull.</span> No earlier register pull is saved in Data\\previous yet -
  movement pull against pull starts with the next pull (button 28 parks the old export automatically).
  From then on this page names every monitor that came back, went out, changed hands or crossed
  30 days between the two pulls, barcode by barcode.{traffic} Nothing on this page is estimated.
</div>"""
        return head + callout + h24

    prev = d["prev_time"]
    ret, iss, mov = d["returned"], d["issued"], d["moved"]
    c30, c60, c90 = d["crossed"][30], d["crossed"][60], d["crossed"][90]
    callout = f"""<div class="callout tight">
  <span class="lead">Pull against pull.</span> Between the register pull of <b>{prev:%d %b %Y %H:%M}</b>
  and this one at <b>{cur:%d %b %Y %H:%M}</b>: <b class="o">{num(len(ret))} monitors came back</b>,
  <b class="o">{num(len(iss))} went out</b>, {num(len(mov))} changed hands and
  <b class="o">{num(len(c30))} crossed 30 days</b> still out ({num(len(c60))} crossed 60, {num(len(c90))}
  crossed 90). Monitors on hire: <b>{num(d['out_prev'])}</b> at the last pull, <b>{num(d['out_cur'])}</b> at
  this one. Every row is a barcode read from the two exports - crew, custody and repair lines alike;
  nothing is estimated.
</div>"""
    tiles = sh.tiles([
        ("check", num(len(ret)), "Came back", "on hire then, not now", "green" if ret else "grey"),
        ("swap", num(len(iss)), "Went out", "not on hire then, on hire now", "grey"),
        ("people", num(len(mov)), "Changed hands", "same monitor, new hirer", "amber" if mov else "grey"),
        ("warn", num(len(c30)), "Crossed 30 days", "still out, now 30 days or more", "red" if c30 else "green"),
    ])
    cap = C["since_diff_rows"]

    def side(title, src, back):
        rows = []
        for r in src[:cap]:
            dd = f'{num(r["days_out"])}d' if r["days_out"] is not None else '<span class="tbc">-</span>'
            rows.append([who_s(r["hirer"]), esc(r["company"]), esc(r["barcode"]), dd])
        if not rows:
            rows = [['<span class="tbc">none</span>', "", "", ""]]
        sub = _cap_note(min(len(src), cap), len(src), "monitors")
        return (f'<div class="sub-h">{title} <span class="thin">- A to Z; {sub}</span></div>'
                + sh.dtable(["Who", "Company", "Asset", "Was out" if back else "Out for"], rows,
                            ["", "", "", "r"], cls="cp"))

    crows = []
    for r in c30[:C["since_crossed_rows"]]:
        crows.append([f'<span class="rd">{num(r["days_out"])}d</span>', esc(dfmt(r["on_dt"])),
                      who_s(r["hirer"]), esc(r["company"]), esc(r["barcode"])])
    if not crows:
        crows = [['<span class="tbc">No monitor crossed 30 days between the pulls.</span>', "", "", "", ""]]
    new_s = ", ".join(esc(x) for x in d["companies_new"]) or "none"
    clr_s = ", ".join(esc(x) for x in d["companies_cleared"]) or "none"
    mv_s = ""
    if mov:
        bits = [f'{esc(r["barcode"])} ({who_s(r.get("from_hirer", ""))} to {who_s(r["hirer"])})' for r in mov[:3]]
        mv_s = (" Changed hands: " + "; ".join(bits)
                + (f" and {num(len(mov) - 3)} more." if len(mov) > 3 else "."))
    return f"""{head}{callout}{tiles}
<table class="two"><tr>
  <td style="width:50%;padding-right:6px">{side("Came back", ret, True)}</td>
  <td style="padding-left:6px">{side("Went out", iss, False)}</td>
</tr></table>
<div class="sub-h">Crossed 30 days between the pulls <span class="thin">- oldest first; {_cap_note(min(len(c30), C["since_crossed_rows"]), len(c30), "monitors")}</span></div>
{sh.dtable(["Out", "Since", "Who", "Company", "Asset"], crows, ["r", "", "", "", ""], cls="cp")}
<div class="note">Companies with a monitor out now that had none at the last pull: <b>{new_s}</b>.
  Companies cleared since the last pull: <b>{clr_s}</b>.{mv_s}</div>
{h24}"""


# =====================================================================
# THE TREND - last 30 days, from the scoreboard
# =====================================================================

def page_trend(m):
    """Only built once TREND_MIN_DAYS days are on the scoreboard. Every
    point is the figure a report printed on that day - a day with no
    build is a gap, never filled in."""
    asat = m["asat"]
    keys = [("overdue", "Overdue 1+ days", K["orange"]), ("overdue_30", "Out 30+ days", K["red"]),
            ("available", "Available", K["green"])]
    ser = {k: rh.series("gas", k, asat, days=30) for k in ("overdue", "overdue_30", "available", "same_day_30")}
    dates = sorted({dd for s in ser.values() for dd, _ in s})
    labels = [dd.strftime("%d %b") for dd in dates]

    def vals(k):
        mp = dict(ser[k])
        return [mp.get(dd) for dd in dates]

    def span(k):
        s = ser[k]
        return (s[0][0], s[0][1], s[-1][1]) if s else (None, None, None)

    o0d, o0, o1 = span("overdue")
    _, t0, t1 = span("overdue_30")
    _, a0, a1 = span("available")
    _, s0, s1 = span("same_day_30")

    def word(v0, v1, good_down=True):
        if v0 is None or v1 is None:
            return "-"
        if v1 == v0:
            return "no change"
        up = v1 > v0
        good = (not up) if good_down else up
        return f'<span class="{"g" if good else "rd"}">{"up" if up else "down"} {num(abs(v1 - v0)) if not isinstance(v1, float) else f"{abs(v1 - v0):.1f}"}</span>'

    panel_a = sh.line_chart(labels, [(name, vals(k)) for k, name, _ in keys], h=180,
                            colours=[c for _, _, c in keys], y_label="monitors")
    panel_b = sh.line_chart(labels, [("Same-day returns, rolling 30 days", vals("same_day_30"))], h=134,
                            colours=[K["green"]], pct=True, y_label="per cent")
    first_s = o0d.strftime("%d %b %Y") if o0d else (dates[0].strftime("%d %b %Y") if dates else "-")
    return f"""<div class="sect"><h3>The trend - last 30 days</h3></div>
<div class="callout tight">
  <span class="lead">{num(len(dates))} days on record</span> between <b>{first_s}</b> and
  <b>{dfmt(asat)}</b>, from the scoreboard every build writes. Since {first_s}: overdue
  <b>{num(o0) if o0 is not None else "-"}</b> to <b>{num(o1) if o1 is not None else "-"}</b> ({word(o0, o1)}); out 30 days or more
  <b>{num(t0) if t0 is not None else "-"}</b> to <b>{num(t1) if t1 is not None else "-"}</b> ({word(t0, t1)}); available
  <b>{num(a0) if a0 is not None else "-"}</b> to <b>{num(a1) if a1 is not None else "-"}</b> ({word(a0, a1, good_down=False)}); same-day returns
  over the rolling 30 days <b>{s0 if s0 is not None else "-"}%</b> to <b>{s1 if s1 is not None else "-"}%</b> ({word(s0, s1, good_down=False)}).
</div>
<div class="sub-h">Monitors overdue, out 30 days or more, and on the shelf <span class="thin">- at each day's pull</span></div>
<div class="chartpanel">{panel_a}</div>
<div class="sub-h">Same-day returns <span class="thin">- the rolling 30-day rate printed on each day's position page</span></div>
<div class="chartpanel">{panel_b}</div>
{sh.tiles([
    ("warn", num(o1) if o1 is not None else "-", "Overdue today", f"{num(o0)} on {first_s}" if o0 is not None else "", "grey"),
    ("clock", num(t1) if t1 is not None else "-", "Out 30+ days today", f"{num(t0)} on {first_s}" if t0 is not None else "", "grey"),
    ("check", num(a1) if a1 is not None else "-", "Available today", f"{num(a0)} on {first_s}" if a0 is not None else "", "grey"),
    ("bars", f"{s1}%" if s1 is not None else "-", "Same-day, rolling 30 days", f"{s0}% on {first_s}" if s0 is not None else "", "grey"),
])}
<div class="note">Each point is the figure printed on that day's report, written to History\\report_history.json
  when the report was built. A day with no build is a gap in the line, never filled in. Figures are
  as at each day's register pull, so the shelf count is that day's {hhmm(asat)} snapshot.</div>"""


def page_sources(m):
    ws, we = m["tx_window"]
    ytd, d90, d30 = m["ytd"], m["d90"], m["d30"]
    ss = m["serial_stats"]
    R = m["rules"]

    def win(label, dates, f):
        return [f"<b>{esc(label)}</b>", esc(dates), num(f["draws"]),
                f'{num(f["same_day"])} <span class="s2">{f["sd_pct"]}%</span>',
                f'<b>{num(f["not_same_day"])}</b> <span class="s2">{f["nsd_pct"]}%</span>',
                num(f["people"]), num(f["companies"])]
    rows = [
        win("Year to date", m["ytd_label"], ytd),
        win("Last 3 months", m["d90_label"], d90),
        win("Last 30 days", m["d30_label"], d30),
        ["<b>Yesterday</b>", esc(m["yesterday"].strftime("%a %d %b %Y")), num(m["yday_draws"]),
         f'{num(m["yday_draws"] - m["yday_nsd"])} <span class="s2">{m["yday_sd_pct"]}%</span>',
         f'<b>{num(m["yday_nsd"])}</b> <span class="s2">{100 - m["yday_sd_pct"]:.1f}%</span>',
         num(m["yday_people"]), num(m["yday_companies"])],
    ]
    pre = ""
    if ss["missing"]:
        from collections import Counter as _C
        top = _C(b.split("/")[0] for b in ss["missing"]).most_common(1)[0]
        pre = f" - {top[1]} of them in the {esc(top[0])} range"
    cards = [
        ("RENTAL_STOCK - the register",
         f"What SiteIQ holds as <b>On Hire</b> (and to whom) and <b>Available for Hire</b> at the "
         f"moment the export is pulled - here <b>{esc(m['asat'].strftime('%d %b %Y %H:%M'))}</b>. "
         f"It is where the position, the overdue list and the custody holdings come from."),
        ("TRANSACTIONS - the movement log",
         f"Every scan out and every scan in since <b>{ws.strftime('%d %b %Y %H:%M')}</b>, one row per "
         f"monitor per draw, with a transaction ID and the time to the second. The store scans twice on "
         f"the way out and twice on the way back, so a row only exists when a monitor physically "
         f"crossed the counter. Every rate, trend and league comes from these rows."),
        ("What a draw is",
         "One monitor, out to one named person, once. A person who takes three monitors at 05:00 is "
         "three draws. That is why the yearly count is large - the site draws hundreds a day - and why "
         "the behaviour measure is the <b>percentage</b> back the same day, not the count."),
        ("Not returned same day",
         f"A draw not scanned back on the calendar day it went out. Two allowances, both the store's "
         f"own timing, not the crew's: a monitor dropped in the return box is scanned by the first shift "
         f"between 04:00 and {R['return_box_scan_until'].strftime('%H:%M')} next morning, before the store "
         f"opens at 07:00, so a return scanned in that window counts as same day "
         f"({num(m['d30'].get('box', 0))} of the last 30 days' draws came back that way); a draw at or after "
         f"{R['night_shift_from'].strftime('%H:%M')} counts as same day if it is back by "
         f"{R['night_shift_back_by'].strftime('%H:%M')} next morning. A draw still open counts as not "
         f"returned. The same rule is applied to every person and every company."),
        ("Counted, never typed",
         "Nothing on these pages is keyed in, adjusted or read from a summary cell. The two exports are "
         "read exactly as pulled and every figure is counted from their rows, so anyone with the same "
         "two files can re-derive any number here. The Excel workbook is not used."),
        ("Barcodes and serials",
         f"SiteIQ identifies a monitor by its <b>barcode</b>; the Dräger serial rides alongside for the "
         f"calibration paperwork. <b>{num(ss['with'])} of the {num(ss['fleet'])}</b> monitors on the "
         f"register carry a serial on the list; {num(len(ss['missing']))} do not{pre} and show a dash "
         f"until the list is completed."),
    ]
    return f"""<div class="sect"><h3>Where these numbers come from</h3></div>
<div class="callout tight">
  Two SiteIQ exports, pulled together on <b>{esc(m['asat'].strftime('%d %b %Y'))}</b>, are the only
  inputs to this report. The table shows how much each window holds, so any figure on the pages that
  follow can be traced back to the rows it was counted from.
</div>
{sh.dtable(["Window", "Dates", "Crew draws", "Back same day", "Not same day", "People", "Companies"],
           rows, ["", "", "r", "r", "r", "r", "r"], cls="cp")}
<div class="note">Crew draws exclude the custody and workflow accounts (Dräger service statuses, FCCU,
  Operations, Future Fuels, After Hours) - {num(m['tx_accounts'])} of the {num(m['tx_all'])} gas monitor
  rows in the log this year. Each window is inclusive of its dates; the log closes at
  {we.strftime('%H:%M')} on the report day, so "today" is not a window.</div>
{sh.info_cards(cards)}"""


def page_yesterday(m):
    R = m["rules"]
    yd = m["yesterday"]
    rows = []
    for c in m["yday_by_company"]:
        who = ", ".join(f"{esc(p)} ({k})" for p, k in c["people_open"])
        if not c["open"]:
            who = f'<span class="tbc">all back - {", ".join(esc(p) for p, _ in c["people"][:4])}</span>'
        rows.append([esc(c["name"]),
                     num(c["nsd"]),
                     f'<span class="g">{num(c["recovered"])}</span>' if c["recovered"] else '<span class="tbc">0</span>',
                     f'<span class="rd">{num(c["open"])}</span>' if c["open"] else '<span class="tbc">0</span>',
                     who])
    if not rows:
        rows = [['<span class="g">Every monitor issued yesterday came back the same day.</span>', "", "", "", ""]]
    al = []
    if m["yday_still_out"]:
        al.append(("d-red", f"{num(m['yday_still_out'])} monitors from yesterday still out",
                   "Named above by person. A monitor out overnight has missed its bump "
                   "test - a safety conversation first, a hire conversation second."))
    if m["out_30"]:
        al.append(("d-red", f"{num(m['out_30'])} monitors overdue 30 days or more",
                   f"{money(m['exposure'])} exposure at {money(R['charge_per_unit'])} per unit. "
                   f"A recovery conversation, not a debt notice - every unit is named in "
                   f"Appendix A."))
    if m["out_8_29"]:
        al.append(("d-amber", f"{num(m['out_8_29'])} monitors overdue 8-29 days",
                   "The follow-up window - these become 30+ if nobody rings."))
    if m["repairs"]:
        stale = len(m["repair_stale"])
        al.append(("d-amber", f"{num(m['repairs'])} monitors in the Dräger repair queue",
                   f"Largest category {esc(m['repair_top'])}. {m['fleet_impact_pct']}% of the "
                   f"fleet unavailable" + (f"; {stale} units have sat there 180 days or more."
                                           if stale else ".")))
    if m["available"] < R["availability_target"]:
        al.append(("d-blue", f"{num(m['available'])} on the shelf against a "
                   f"{num(R['availability_target'])}-unit target",
                   "Availability is what keeps work fronts moving - pull recovery forward."))
    if not al:
        al.append(("d-green", "Nothing outstanding", "No exceptions in the source today."))
    # three alerts is what fits beneath the named table; the rest of the
    # story has its own pages
    al = al[:3]
    return f"""<div class="sect"><h3>Yesterday - did they come back?</h3></div>
<div class="callout tight">
  On <b>{yd.strftime('%A %d %b')}</b>, <b>{num(m['yday_draws'])} monitors</b> went out to
  crew. <b class="o">{num(m['yday_nsd'])} were not back by the end of the day</b>
  ({m['yday_sd_pct']}% came back same day). {num(m['yday_recovered'])} of those have
  come back since; <b class="o">{num(m['yday_still_out'])} are still out</b> as at
  {hhmm(m['asat'])} and are named below - that is the prestart chase list.
</div>
{sh.tiles([
    ("swap", num(m['yday_draws']), "Crew draws yesterday", yd.strftime('%a %d %b'), "grey"),
    ("clock", num(m['yday_nsd']), "Not back same day",
     f"{100 - m['yday_sd_pct']:.1f}% of draws", "amber" if m['yday_nsd'] else "green"),
    ("check", num(m['yday_recovered']), "Recovered since",
     f"{m['yday_recovery_pct']}% of the non-returns", "green" if m['yday_recovery_pct'] >= 50 else "amber"),
    ("warn", num(m['yday_still_out']), "Still out now", "same person, named below",
     "red" if m['yday_still_out'] else "green"),
])}
{sh.dtable(["Company", "Not back", "Recovered", "Still out", "Who still has them (units)"],
           rows, ["", "r", "r", "r", ""], cls="cp")}
<div class="note">Cycle check: <b>{num(m['yday_nsd'])} = {num(m['yday_recovered'])} recovered
  + {num(m['yday_still_out'])} still out</b>. The register (RENTAL_STOCK) shows
  <b>{num(m['yday_register_still_out'])}</b> monitors on hire to a person since yesterday -
  {"the two exports agree" if m['yday_register_still_out'] == m['yday_still_out'] else "the difference is explained on the data page"}.
  Gas monitors come back <b class="o">daily</b> for bump testing, charging and inspection.</div>
{sh.alerts(al)}"""


def page_people(m):
    R = m["rules"]
    lg = [x for x in m["league"] if x["d30_nsd"] > 0][:CONFIG["league_rows"]]
    rows = []
    for x in lg:
        sub = esc(x["co"]) + (tag("repeat", "red") if x["repeat"] else "")
        rows.append([
            f'{esc(x["name"])}<span class="s2">{sub}</span>',
            num(x["d30_draws"]),
            f'<b>{num(x["d30_nsd"])}</b>',
            f'<span class="{sd_class(x["d30_sd_pct"])}">{x["d30_sd_pct"]}%</span>',
            f'{num(x["d90_nsd"])}<span class="s2">of {num(x["d90_draws"])} · {x["d90_sd_pct"]}% same day</span>',
            f'{num(x["ytd_nsd"])}<span class="s2">of {num(x["ytd_draws"])} · {x["ytd_sd_pct"]}% same day</span>',
            f'<span class="rd">{num(x["open_now"])}</span>' if x["open_now"] else '<span class="tbc">0</span>',
        ])
    rest = [x for x in m["league"] if x["d30_nsd"] > 0][CONFIG["league_rows"]:]
    rest_units = sum(x["d30_nsd"] for x in rest)
    return f"""<div class="sect"><h3>Who is not bringing them back - last 30 days</h3></div>
<div class="callout tight">
  Between <b>{esc(m['d30_label'])}</b>, <b>{num(m['people_active_30'])} people</b> drew a
  monitor. <b class="o">{num(m['people_with_nsd_30'])}</b> kept at least one past the day
  it went out, and <b class="o">{num(len(m['repeat_offenders']))}</b> did so in
  {R['repeat_weeks']} or more separate weeks - that is a habit, not a bad day. Ranked by
  non-returns in the last 30 days; the 3-month and year-to-date columns show whether the
  pattern is new or long-standing.
</div>
{sh.dtable(["Who", "Draws 30d", "Not same day 30d", "Same-day % 30d", "Last 3 months", "Year to date",
            "Still out now"],
           rows, ["", "r", "r", "r", "r", "r", "r"], cls="cp")}
<div class="note">{f'Plus <b>{len(rest)}</b> more people with <b>{num(rest_units)}</b> non-returns between them in the last 30 days - all counted in the company table. ' if rest else ''}Named people only:
  custody and workflow accounts are reported on their own lines. "Not same day" = not scanned
  back on the calendar day it went out (a return scanned from the return box by
  {R['return_box_scan_until'].strftime('%H:%M')} next morning counts as same day; a draw after
  {R['night_shift_from'].strftime('%H:%M')} counts as same day if back by {R['night_shift_back_by'].strftime('%H:%M')} next morning).
  "Still out now" is from the live register at {hhmm(m['asat'])}. Same-day % is green from 85,
  amber from 70, red below.</div>"""


def page_people_ytd(m):
    ws, we = m["tx_window"]
    lg = [x for x in m["league_ytd"] if x["ytd_nsd"] > 0][:CONFIG["league_ytd_rows"]]
    rows = []
    for x in lg:
        last = x["last_nsd"].strftime("%d %b") if x["last_nsd"] else "-"
        rows.append([
            f'{esc(x["name"])}<span class="s2">{esc(x["co"])}</span>',
            num(x["ytd_draws"]),
            f'<b>{num(x["ytd_nsd"])}</b>',
            f'<span class="{sd_class(x["ytd_sd_pct"])}">{x["ytd_sd_pct"]}%</span>',
            f'{num(x["d90_nsd"])}<span class="s2">of {num(x["d90_draws"])}</span>' if x["d90_draws"] else '<span class="tbc">-</span>',
            f'{num(x["d30_nsd"])}<span class="s2">of {num(x["d30_draws"])}</span>' if x["d30_draws"] else '<span class="tbc">-</span>',
            esc(last),
            f'{num(x["maxd"])}d',
            f'<span class="rd">{num(x["open_now"])}</span>' if x["open_now"] else '<span class="tbc">0</span>',
        ])
    total_nsd = m["ytd"]["not_same_day"]
    shown = sum(x["ytd_nsd"] for x in lg)
    return f"""<div class="sect"><h3>Who is not bringing them back - year to date</h3></div>
<div class="callout tight">
  Since <b>{ws.strftime('%d %b')}</b>, <b>{num(m['people_active_ytd'])} people</b> have drawn a monitor
  and <b class="o">{num(m['people_with_nsd_ytd'])}</b> have kept at least one past its day. The
  {num(len(lg))} names below account for <b class="o">{num(shown)}</b> of the year's
  {num(total_nsd)} non-returns ({shown / total_nsd * 100 if total_nsd else 0:.0f}%). The 3-month and
  30-day columns show whether it is still happening; "last" is the most recent non-return.
</div>
{sh.dtable(["Who", "Draws YTD", "Not same day", "Same-day %", "Last 3 months", "Last 30 days", "Last",
            "Longest", "Still out"],
           rows, ["", "r", "r", "r", "r", "r", "nw", "r", "r"], cls="cp")}
<div class="note">Ranked by non-returns for the year. A high count with a high same-day percentage is a
  heavy user having the odd late day; a low percentage is the habit to talk about. "Longest" is the
  longest single hold, completed or still open.</div>"""


def page_companies(m):
    comps = [c for c in m["companies"] if c["d30_draws"] > 0]
    top = comps[:CONFIG["company_rows"]]
    rest = comps[CONFIG["company_rows"]:]
    rows = []
    for c in top:
        names = ", ".join(f"{esc(p)} ({k})" for p, k in c["d30_top"][:2])
        more = len(c["d30_top"]) - 2
        if more > 0:
            names += f' <span class="tbc">+{more} more</span>'
        rows.append([
            esc(c["name"]),
            num(c["d30_draws"]),
            f'<b>{num(c["d30_nsd"])}</b>',
            f'<span class="{sd_class(c["d30_sd_pct"])}">{c["d30_nsd_pct"]}%</span>',
            f'<span class="{sd_class(c["d90_sd_pct"])}">{c["d90_nsd_pct"]}%</span>' if c["d90_draws"] else '<span class="tbc">-</span>',
            f'<span class="{sd_class(c["ytd_sd_pct"])}">{c["ytd_nsd_pct"]}%</span>',
            num(c["d30_people"]),
            f'<span class="rd">{num(c["open_now"])}</span>' if c["open_now"] else '<span class="tbc">0</span>',
            names or '<span class="tbc">-</span>',
        ])
    bars = [(c["name"], c["d30_nsd"], f'{num(c["d30_nsd"])} of {num(c["d30_draws"])}')
            for c in comps[:8]]
    d30 = m["d30"]
    return f"""<div class="sect"><h3>By company - the last 30 days against the quarter and the year</h3></div>
<div class="callout tight">
  <b class="o">{num(d30['not_same_day'])}</b> of <b>{num(d30['draws'])}</b> crew draws in
  the last 30 days ({d30['nsd_pct']}%) were not back on the day they went out, across
  <b>{num(d30['companies'])} companies</b>. Rate = not returned same day &divide; draws, for the
  last 30 days, the last 3 months and the year. Names are each company's top non-returners in
  the last 30 days.
</div>
{sh.dtable(["Company", "Draws 30d", "Not same day", "Rate 30d", "Rate 3 mo", "Rate YTD", "People",
            "Still out", "Top non-returners, last 30 days (units)"],
           rows, ["", "r", "r", "r", "r", "r", "r", "r", ""], cls="cp")}
<div class="note">{f'Plus <b>{len(rest)}</b> more companies with <b>{num(sum(c["d30_nsd"] for c in rest))}</b> non-returns on {num(sum(c["d30_draws"] for c in rest))} draws between them. ' if rest else ''}Rate colour: green under 15%, amber under 30%, red above.</div>
<div class="sub-h">Not returned same day, last 30 days <span class="thin">- by company, top 8</span></div>
<div class="chartpanel">{sh.hbars(bars, colour=K['amber'], right=70, rowh=21)}</div>"""


def page_year(m):
    ytd, d30 = m["ytd"], m["d30"]
    mon = m["monthly"]
    labels = [x["label"] for x in mon]
    bars = [x["draws"] for x in mon]
    line = [x["sd_pct"] for x in mon]
    partial = mon[-1]["partial"] if mon else False
    wk = m["weekly"]
    wl = [w["label"] for w in wk]
    ann = tuple(i for i in range(0, len(wk) - 1, 2))
    ws, we = m["tx_window"]
    return f"""<div class="sect"><h3>The year so far - volume and behaviour by month</h3></div>
<div class="callout tight">
  Since <b>{ws.strftime('%d %b')}</b>, crews have drawn a monitor
  <b>{num(ytd['draws'])} times</b> - about {num(ytd['per_working_day'])} a working day - and
  <b class="o">{ytd['sd_pct']}%</b> came back the same day. The last 30 days ran at
  <b class="o">{d30['sd_pct']}%</b> on {num(d30['draws'])} draws. The bars are monthly draws;
  the line is the share back the same day{' - the last bar is a part month' if partial else ''}.
  The year-to-date total is large because the site draws hundreds of monitors a day - the
  behaviour measure is the percentage.
</div>
<div class="chartpanel">{sh.combo_chart(labels, bars, line, h=198, partial_last=partial)}</div>
{sh.tiles([
    ("bars", num(ytd['draws']), "Crew draws, year to date", esc(m['ytd_label']), "grey"),
    ("check", f"{ytd['sd_pct']}%", "Same day, year to date",
     f"{num(ytd['not_same_day'])} not back same day", sd_class(ytd['sd_pct']).replace('rd', 'red').replace('a', 'amber').replace('g', 'green')),
    ("bars", num(d30['draws']), "Crew draws, last 30 days", esc(m['d30_label']), "grey"),
    ("check", f"{d30['sd_pct']}%", "Same day, last 30 days",
     f"{num(d30['not_same_day'])} not back same day", sd_class(d30['sd_pct']).replace('rd', 'red').replace('a', 'amber').replace('g', 'green')),
])}
<div class="sub-h">Same-day return rate by week <span class="thin">- every week of the year{' (current week is partial)' if m['current_week_partial'] else ''}</span></div>
<div class="chartpanel">{line_chart_multi(wl, [{"vals": [w["pct"] for w in wk], "colour": K["green"], "label": "Same-day %", "fill": True}], h=158, label_every=2, pct=True, annotate=ann)}</div>
<div class="note">Each point is same-day returns &divide; crew draws for the week starting on the date shown.</div>"""


def page_90days(m):
    d90 = m["d90"]
    wk = m["weekly90"]
    rows = [{"label": w["label"], "draws": w["draws"], "nsd": w["nsd"], "weekend": False,
             "partial": w["partial"]} for w in wk]
    comps = [c for c in m["companies_90"] if c["d90_nsd"] > 0][:8]
    bars = [(c["name"], c["d90_nsd"], f'{num(c["d90_nsd"])} of {num(c["d90_draws"])}') for c in comps]
    worst = max(wk, key=lambda w: w["nsd"]) if wk else None
    best = min([w for w in wk if w["draws"] >= 100] or wk, key=lambda w: 100 - w["pct"]) if wk else None
    return f"""<div class="sect"><h3>The last 3 months - week by week</h3></div>
<div class="callout tight">
  <b>{num(d90['draws'])} crew draws</b> between <b>{esc(m['d90_label'])}</b>, and
  <b class="o">{d90['sd_pct']}%</b> came back the same day - <b class="o">{num(d90['not_same_day'])}</b>
  did not. <b>{num(m['people_active_90'])} people</b> drew a monitor in the quarter and
  <b class="o">{num(m['people_with_nsd_90'])}</b> kept at least one past its day. The window is the
  13 full weeks before this one plus this week so far, so the bars add up to the total. Each bar is a
  week starting on the Monday shown: green is back the same day, red is not{' - the last bar is this week so far' if wk and wk[-1]['partial'] else ''}.
  {f'The worst week for non-returns began <b>{esc(worst["label"])}</b> ({num(worst["nsd"])} of {num(worst["draws"])}); the best began <b>{esc(best["label"])}</b> ({best["pct"]}% same day).' if worst and best else ''}
</div>
<div class="chartpanel">{sh.daily_bars(rows, h=200, label_every=1)}</div>
{sh.tiles([
    ("bars", num(d90['draws']), "Crew draws, last 3 months", esc(m['d90_label']), "grey"),
    ("check", f"{d90['sd_pct']}%", "Same day, last 3 months", f"{num(d90['not_same_day'])} not back same day",
     sd_class(d90['sd_pct']).replace('rd', 'red').replace('a', 'amber').replace('g', 'green')),
    ("people", num(m['people_active_90']), "People who drew", f"{num(d90['companies'])} companies", "grey"),
    ("warn", num(m['people_with_nsd_90']), "People with a non-return",
     f"{round(m['people_with_nsd_90'] / m['people_active_90'] * 100) if m['people_active_90'] else 0}% of those who drew", "amber"),
])}
<div class="sub-h">Not returned same day, last 3 months <span class="thin">- by company, top 8</span></div>
<div class="chartpanel">{sh.hbars(bars, colour=K['amber'], right=70, rowh=21)}</div>"""


def page_30days(m):
    d30 = m["d30"]
    rows = m["daily30"]
    b, w = m["daily30_busiest"], m["daily30_worst_nsd"]
    return f"""<div class="sect"><h3>The last 30 days - day by day</h3></div>
<div class="callout tight">
  <b>{num(d30['draws'])} crew draws</b> over {num(d30['working_days'])} working days - about
  <b>{num(d30['per_working_day'])} a day</b>. The busiest day was
  <b>{esc(b['label']) if b else '-'}</b> with {num(b['draws']) if b else 0} draws; the worst day for
  non-returns was <b class="o">{esc(w['label']) if w else '-'}</b> with
  {num(w['nsd']) if w else 0} monitors not back. Green is back the same day, red is not;
  grey stubs are quiet weekend days; the last bar is this morning to
  {hhmm(m['tx_window_complete_to'])}.
</div>
<div class="chartpanel">{sh.daily_bars(rows)}</div>
{sh.tiles([
    ("bars", num(d30['per_working_day']), "Draws per working day", esc(m['d30_label']), "grey"),
    ("zap", num(b['draws']) if b else "0", "Busiest day", esc(b['label']) if b else "-", "amber"),
    ("warn", num(w['nsd']) if w else "0", "Worst day for non-returns", esc(w['label']) if w else "-", "red"),
    ("clock", num(d30['not_same_day']), "Not back same day", f"{d30['nsd_pct']}% of 30-day draws", "amber"),
])}
<div class="sub-h">How long they stayed out <span class="thin">- every completed crew draw in the last 30 days</span></div>
<div class="chartpanel">{sh.hbars(m['dur_buckets_30'], colour=K['amber'])}</div>
<div class="note">Counted from issue scan to return scan. Every draw in the 1-3 day bucket and
  beyond is a monitor that missed at least one bump-test cycle and spent nights off the shelf.</div>"""


def page_where(m):
    R = m["rules"]
    where = m["where"]
    N = CONFIG["where_rows"]
    top = sorted(where, key=lambda w2: -w2["total"])[:N]
    bars = [(w2["name"], [w2["today"], w2["d1"], w2["d2_7"], w2["d8_29"], w2["d30"]]) for w2 in top]
    segs = [("Out today", GREY), ("1 day", K["amber"]), ("2-7 days", K["orange"]),
            ("8-29 days", DEEP_RED), ("30+ days", K["red"])]
    ranked = sorted(where, key=lambda x: (-x["d30"], -x["outstanding"], -x["total"]))
    rest = ranked[N:]
    rows = []
    for w2 in ranked[:N]:
        ucls = {"Critical": "rd", "High": "a", "Watch": "g", "Clear": "tbc"}.get(w2["urgency"], "")
        rows.append([esc(w2["name"]), num(w2["today"]),
                     num(w2["d1"]) if w2["d1"] else '<span class="tbc">0</span>',
                     num(w2["d2_7"]) if w2["d2_7"] else '<span class="tbc">0</span>',
                     num(w2["d8_29"]) if w2["d8_29"] else '<span class="tbc">0</span>',
                     f'<span class="rd">{num(w2["d30"])}</span>' if w2["d30"] else '<span class="tbc">0</span>',
                     f'<b>{num(w2["outstanding"])}</b>' if w2["outstanding"] else '<span class="tbc">0</span>',
                     money(w2["exposure"]) if w2["exposure"] else '<span class="tbc">$0</span>',
                     f'<span class="{ucls}">{esc(w2["urgency"])}</span>'])
    return f"""<div class="sect"><h3>Where the monitors are right now - by company, ranked by units 30+ days out</h3></div>
<div class="callout tight">
  <b>{num(m['crew_out'])} monitors</b> are out to crew across
  <b>{num(len([w2 for w2 in where if w2['total']]))} companies</b>: {num(m['out_today'])} went out today
  and are on their normal cycle; <b class="o">{num(m['outstanding'])} are overdue</b> -
  {num(m['out_1'])} since yesterday, {num(m['out_2_7'])} for 2-7 days, {num(m['out_8_29'])}
  for 8-29 days and <b class="o">{num(m['out_30'])} for 30 days or more</b>. Custody holdings
  (FCCU {num(m['fccu'])}, Operations {num(m['ops'])}, Future Fuels {num(m['ff'])}, after-hours
  account {num(m['afterhours'])}) sit outside the crew count and are listed on the next page.
</div>
<div class="chartpanel">{stacked_hbars_segs(bars, segs, rowh=23)}</div>
{sh.dtable(["Company", "Today", "1 day", "2-7d", "8-29d", "30+d", "Overdue", "Exposure", "Urgency"],
           rows, ["", "r", "r", "r", "r", "r", "r", "r", ""], cls="cp")}
<div class="note">{f'Showing {N} of {len([w2 for w2 in where if w2["total"]])} companies with monitors out - the other {len(rest)} hold {num(sum(w2["total"] for w2 in rest))} units, {num(sum(w2["outstanding"] for w2 in rest))} of them overdue, all named in Appendix A. ' if rest else ''}Days
  are counted from the on-hire scan to the report date. Exposure is
  {money(R['charge_per_unit'])} per monitor overdue 30 days or more. Urgency: Critical = has
  30+ day items; High = has 8-29 day items or three or more overdue; Watch = the rest.</div>"""


def custody_table(m):
    cust = m["custody"]
    crow = []
    notes = {
        "fccu": "bulk issue to the FCCU turnaround, held on the Dräger FCCU custody line",
        "ops": "Ampol Operations holding",
        "ff": "long-term issue to the Future Fuels project",
        "afterhours": "after-hours draws booked to a shared account - no person is named on them",
    }
    for k in ("fccu", "ops", "ff", "afterhours"):
        c = cust[k]
        if not c["n"]:
            continue
        held = (f"{c['min_days']}-{c['max_days']} days" if c["min_days"] != c["max_days"]
                else ("today" if c["max_days"] == 0 else f"{c['max_days']} days"))
        crow.append([esc(c["label"]), num(c["n"]), esc(held), esc(notes[k])])
    if not crow:
        return ""
    return (f'<div class="sub-h">Custody holdings <span class="thin">- {num(m["custody_total"])} '
            f'monitors, not crew, tracked separately</span></div>'
            + sh.dtable(["Holding", "Units", "Held for", "What it is"], crow, ["", "r", "", ""], cls="cp"))


def page_ageing(m):
    R = m["rules"]
    pr = m["priorities"][:10]
    rest = m["priorities"][10:]
    rows = []
    for c in pr:
        ucls = {"Critical": "rd", "High": "a", "Watch": "g"}.get(c["urgency"], "")
        ring = ", ".join(f"{esc(p)} ({k})" for p, k in c["names"][:2])
        rows.append([esc(c["name"]), f'<span class="{ucls}">{esc(c["urgency"])}</span>',
                     num(c["d1"] + c["d2_7"]), num(c["d8_29"]), num(c["d30"]),
                     money(c["exposure"]) if c["exposure"] else '<span class="tbc">$0</span>',
                     ring])
    focus = ", ".join(f"<b>{esc(c['name'])}</b>" for c in m["focus3"])
    return f"""<div class="sect"><h3>Overdue - how long they have been out</h3></div>
<table class="dt"><tr>
  <th class="c">1-7 Days (Watch)</th><th class="c">8-29 Days (Follow up)</th>
  <th class="c">30+ Days (Action needed)</th></tr>
  <tr><td class="big">{num(m['out_1_7'])}</td>
      <td class="big">{num(m['out_8_29'])}</td>
      <td class="big">{num(m['out_30'])}</td></tr>
</table>
{sh.prog_rows([
    ("Watch - out 1-7 days", m['out_1_7'], m['outstanding'] or 1, "f-amber", f"{num(m['out_1_7'])} items"),
    ("Follow up - out 8-29 days", m['out_8_29'], m['outstanding'] or 1, "f-orange", f"{num(m['out_8_29'])} items"),
    ("Action - out 30+ days", m['out_30'], m['outstanding'] or 1, "f-red", f"{num(m['out_30'])} items"),
])}
<div class="note">Charge exposure sits at <b>{money(m['exposure'])}</b> - {num(m['out_30'])}
  monitors at 30 days or more, at <b>{money(R['charge_per_unit'])}</b> replacement charge per
  unit. If nothing overdue came back at all the figure would be
  {money(m['exposure_all_outstanding'])} across {num(m['outstanding'])} units. A recovery
  conversation, not a debt notice: Appendix A names every unit, oldest first.</div>
<div class="sect"><h3>Recovery priorities - worst first</h3></div>
{sh.dtable(["Company", "Urgency", "1-7d", "8-29d", "30+d", "Exposure", "Ring first (units)"],
           rows, ["", "", "r", "r", "r", "r", ""], cls="cp")}
<div class="note">{f'Showing {len(pr)} of {len(m["priorities"])} companies with gear overdue - the other {len(rest)} hold {num(sum(c["outstanding"] for c in rest))} units between them, all in Appendix A. ' if rest else ''}Ranked by
  30+ day items, then overdue count. The three to ring first: {focus}.</div>
{custody_table(m)}"""


def page_rhythm(m):
    d30 = m["d30"]
    hrs = list(range(3, 19))
    hrows = [{"label": f"{h:02d}", "issued": d30["hour_issues"].get(h, 0),
              "returned": d30["hour_returns"].get(h, 0)} for h in hrs]
    rec = d30["record_hour"]
    rec_s = (f"{num(rec['n'])} draws between {rec['hour']:02d}:00 and {rec['hour'] + 1:02d}:00 "
             f"on {rec['date'].strftime('%a %d %b')} - one every {rec['every_s']} seconds"
             if rec["date"] else "no draws in the window")
    curve = m["net_curve"]
    xl = [f"{int(hh):02d}:00" if (int(hh) % 2 == 1 and hh == int(hh)) else "" for hh, _ in curve]
    return f"""<div class="sect"><h3>The daily rhythm - when monitors move (last 30 days)</h3></div>
<div class="callout tight">
  <b class="o">{d30['pct_before_6']}% of draws happen before 06:00</b>; the median monitor goes
  out at <b>{d30['median_issue']}</b> and comes back at <b>{d30['median_return']}</b>. The
  record hour: {rec_s}. Between the morning surge and the afternoon wave the shelf carries
  the whole site - that is the daily squeeze in one picture.
</div>
<div class="sub-h">Issues and returns by hour of day <span class="thin">- {esc(m['d30_label'])}</span></div>
<div class="chartpanel">{sh.grouped_bars(hrows, h=168)}</div>
<div class="sub-h">Net monitors drawn from the store through the day
  <span class="thin">- average and worst of the last {len(m['curve_days'])} working days</span></div>
<div class="chartpanel">{line_chart_multi(xl, [
    {"vals": [v for _, v in m["net_curve_worst"]], "colour": K["red"], "label": "Worst day", "fill": False},
    {"vals": [v for _, v in curve], "colour": K["orange"], "label": "Average day", "fill": True}],
    h=160, label_every=1)}</div>
{sh.tiles([
    ("bars", num(int(round(m['net_plateau']))), "Avg net draw by mid-morning", "issues less returns, same day", "amber"),
    ("warn", num(int(round(m['net_plateau_worst']))), "Worst recent day", "same measure", "red"),
    ("clock", d30['median_issue'], "Median issue time", "the morning surge", "grey"),
    ("check", d30['median_return'], "Median return time", "the afternoon wave", "grey"),
])}
<div class="note">The curve counts every same-day issue minus every same-day return, half-hour by
  half-hour, custody movements included. It is why the {num(m['rules']['availability_target'])}-unit
  availability target exists: the shelf must survive from the surge to the wave.</div>"""


def page_shift_rhythm(m):
    y = m["ytd"]
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    cols = [f"{h:02d}" if h % 2 == 0 else "" for h in range(24)]
    hd, hr = y["heat_draws"], y["heat_returns"]
    # the busiest cells, named
    def peak(mat):
        best = max(((v, r, c) for r, row in enumerate(mat) for c, v in enumerate(row)), default=(0, 0, 0))
        return best
    pv, pr_, pc_ = peak(hd)
    rv, rr, rc = peak(hr)
    wk_draws = sum(hd[r][c] for r in range(5) for c in range(24))
    we_draws = sum(hd[r][c] for r in range(5, 7) for c in range(24))
    night = sum(hd[r][c] for r in range(7) for c in list(range(0, 5)) + list(range(19, 24)))
    tot = sum(sum(r) for r in hd) or 1
    return f"""<div class="sect"><h3>The shift rhythm - draws and returns by weekday and hour, year to date</h3></div>
<div class="callout tight">
  Every crew draw since <b>{dfmt(y['start'])}</b> laid on a week: <b class="o">{num(pv)} draws</b> in
  the busiest cell ({days[pr_]} {pc_:02d}:00-{pc_ + 1:02d}:00), returns peaking on
  {days[rr]} {rc:02d}:00-{rc + 1:02d}:00 with <b>{num(rv)}</b>. Weekdays carry
  <b>{num(wk_draws)}</b> draws against <b>{num(we_draws)}</b> on weekends, and
  <b class="o">{round(night / tot * 100)}%</b> of all draws happen between 19:00 and 05:00 -
  the after-hours window where the same-day rule does its work.
</div>
<div class="sub-h">Draws <span class="thin">- darker is quieter, orange is busier; the count is printed in every cell</span></div>
<div class="chartpanel">{sh.heatgrid(hd, days, cols)}</div>
<div class="sub-h">Returns <span class="thin">- the same week, scanned back in</span></div>
<div class="chartpanel">{sh.heatgrid(hr, days, cols, colour=(31, 167, 90))}</div>
<div class="note">Counted from every crew transaction in the TRANSACTIONS export ({esc(m['ytd_label'])}),
  custody accounts excluded; a cell is the number of draws (or returns) whose scan fell in that
  weekday and hour. A dark cell is a real zero. Read the two grids together: the gap between the
  draw peak and the return peak is the shift, and the after-hours cells are where monitors go out
  after 15:00 and come back before 08:00.</div>"""


def page_demand(m):
    ytd = m["ytd"]
    peaks = m["day_peaks"]
    step = max(1, len(peaks) // 90)
    pk = peaks[::step]
    plabels = [p2["date"].strftime("%d %b") if i % max(1, len(pk) // 9) == 0 else ""
               for i, p2 in enumerate(pk)]
    rp = m["record_peak"]
    rp30 = m["record_peak_30"]
    usable = m["usable_fleet"]
    lk = m["longest_kept"]
    lk_note = (f' The longest completed hold on record: <b>{(lk["en"] - lk["st"]).days} days</b> by '
               f'<b>{esc(lk["who"])}</b> ({esc(lk["co"])}).' if lk else '')
    return f"""<div class="sect"><h3>Demand - monitors out at once, year to date</h3></div>
<div class="callout tight">
  The record is <b class="o">{num(rp['peak']) if rp else 0} monitors out at once</b>
  {('at ' + rp['at'].strftime('%H:%M on %a %d %b')) if rp else ''} - against
  <b>{num(m['fleet_total'])} owned</b> and <b class="o">{num(usable)} usable</b> once the
  {num(m['repairs'])} in repair are set aside. In the last 30 days the peak was
  <b>{num(rp30['peak']) if rp30 else 0}</b>{(' on ' + rp30['at'].strftime('%a %d %b')) if rp30 else ''}.
  Every unit in custody or in the workshop is a unit the shelf cannot lend.
</div>
<div class="sub-h">Peak monitors out at once, by day <span class="thin">- {esc(m['ytd_label'])}</span></div>
<div class="chartpanel">{line_chart_multi(plabels, [{"vals": [p2["peak"] for p2 in pk], "colour": K["orange"], "label": "Daily peak out", "fill": True}], h=176, label_every=1)}</div>
{sh.tiles([
    ("zap", num(rp['peak']) if rp else "0", "Record - out at once", rp['at'].strftime('%d %b %H:%M') if rp else "-", "red"),
    ("box", num(usable), "Usable fleet", f"{num(m['fleet_total'])} owned less {num(m['repairs'])} in repair", "grey"),
    ("warn", num(usable - rp['peak']) if rp else "-", "Spare at the record peak", "across the whole site", "red" if rp and usable - rp['peak'] < 50 else "amber"),
    ("bars", num(rp30['peak']) if rp30 else "0", "Peak, last 30 days", rp30['at'].strftime('%d %b %H:%M') if rp30 else "-", "amber"),
])}
<div class="sub-h">How long monitors stay out <span class="thin">- every completed crew draw, year to date</span></div>
<div class="chartpanel">{sh.hbars(m['dur_buckets_ytd'], colour=K['amber'])}</div>
<div class="note">Concurrency counts every open transaction in the export window, custody
  included. Items issued before the window opened sit outside it, so the register's on-hire
  figure runs higher; the register is the authority for right-now counts.{lk_note}</div>"""


def page_repairs(m):
    R = m["rules"]
    rep = m["repair_items"]
    rows = []
    for r in rep[:5]:
        dcls = "rd" if r["days"] >= R["stale_repair_days"] else "a" if r["days"] >= 30 else ""
        rows.append([esc(r["desc"]),
                     f'{esc(r["bc"])}<span class="s2">{esc(r["serial"] or "no serial on the list")}</span>',
                     f'<span class="{dcls}">{num(r["days"])}d</span><span class="s2">{esc(dfmt(r["on_dt"]))}</span>',
                     esc(r["status"])])
    ab = m["repair_age_buckets"]
    stale = m["repair_stale"]
    stale_note = (f'<b class="o">{len(stale)} unit(s) have been in the queue {R["stale_repair_days"]} days '
                  f'or more</b> - the oldest at <b>{num(stale[0]["days"])} days</b>. That is not a repair '
                  f'queue, that is dead fleet: a repair-or-replace call. ' if stale else '')
    return f"""<div class="sect"><h3>Out of service - the Dräger repair queue</h3></div>
<div class="callout tight">
  <b>{num(m['repairs'])} monitors</b> are in the repair queue - <b class="o">{m['fleet_impact_pct']}%</b>
  of the {num(m['fleet_total'])}-unit fleet a crew cannot take. Largest category
  <b>{esc(m['repair_top'])}</b>. {stale_note}
</div>
<div class="sub-h">Repairs by status</div>
<div class="chartpanel">{sh.hbars(m['repair_cats'])}</div>
{sh.tiles([
    ("wrench", num(m['repairs']), "In the repair queue", f"{m['fleet_impact_pct']}% of fleet", "amber"),
    ("clock", num(ab.get('under 30 days', 0)), "Under 30 days", "normal turnaround", "grey"),
    ("clock", num(ab.get('30-89 days', 0) + ab.get('90-179 days', 0)), "30-179 days", "chase Dräger", "amber"),
    ("warn", num(ab.get('180+ days', 0)), "180 days or more", "repair-or-replace", "red" if ab.get('180+ days', 0) else "green"),
])}
<div class="sub-h">Longest in the queue <span class="thin">- oldest first</span></div>
{sh.dtable(["Item", "Asset / serial", "In status", "Repair status"], rows, ["", "", "r", ""], cls="cp")}
<div class="note">Days in status are counted from the on-hire scan onto the Dräger custody line.
  A monitor that fails bump goes onto the Failed Bump Test line the same day, so this is a
  fair measure of turnaround.</div>"""


def pages_appendix(m):
    R = m["rules"]
    items = m["outstanding_items"]
    PER = CONFIG["appendix_rows"]
    chunks = [items[i:i + PER] for i in range(0, len(items), PER)] or [[]]
    out = []
    for ci, chunk in enumerate(chunks):
        rows = []
        for x in chunk:
            dcls = "rd" if x["days"] >= 30 else "a" if x["days"] >= 8 else ""
            rows.append([f'<span class="{dcls}">{num(x["days"])}d</span>',
                         esc(dfmt(x["on_dt"])),
                         esc(x["who"]), esc(x["co"]), esc(x["bc"]),
                         esc(x["serial"]) if x["serial"] else '<span class="tbc">-</span>',
                         money(x["cost"])])
        if not rows:
            rows = [['<span class="g">Nothing overdue - every monitor issued before today is back.</span>', "", "", "", "", "", ""]]
        head = (f'<div class="sect"><h3>Appendix A - overdue monitors, oldest first</h3></div>'
                f'<div class="note" style="margin-top:8px">Every monitor on hire to a named person with an '
                f'on-hire date before {dfmt(m["today"])}: {num(len(items))} units. Gear issued today '
                f'({num(m["out_today"])} units) is on its normal cycle and is not listed. Red at 30 days '
                f'or more, amber at 8-29. Replacement charge {money(R["charge_per_unit"])} per unit.</div>'
                if ci == 0 else
                f'<div class="sub-h">Appendix A, overdue monitors, oldest first '
                f'<span class="thin">- continued ({ci + 1} of {len(chunks)})</span></div>')
        tail = ""
        if ci == len(chunks) - 1:
            tail = f"""<table class="totrow"><tr>
  <td>Replacement charge exposure - {num(m['out_30'])} units at 30 days or more</td>
  <td class="v"><span class="hl">{money(m['exposure'])}</span></td>
</tr></table>
<div class="note">If nothing on this list came back at all the exposure would be
  {money(m['exposure_all_outstanding'])} across {num(len(items))} units. Serial numbers come from
  the Gas_Monitor_Serial_Numbers list; a dash means the list does not carry that barcode.</div>"""
        out.append(head + sh.dtable(
            ["Out", "Since", "Who", "Company", "Asset", "Serial", "Charge"],
            rows, ["r", "", "", "", "", "", "r"], cls="cp") + tail)
    return out


def page_method(m):
    ws, we = m["tx_window"]
    R = m["rules"]
    lw = (m.get("log") or {}).get("window") or (None, None)
    lw0 = (lw[0] or ws).strftime("%d %b %Y %H:%M")
    lw1 = (lw[1] or we).strftime("%d %b %Y %H:%M")
    src = [
        ["RENTAL_STOCK.xlsx", "Where every monitor is right now - status, who has it, on-hire date",
         esc(m["asat"].strftime("%d %b %Y %H:%M")), "the live register at the pull"],
        ["TRANSACTIONS.xlsx", "Every issue and return scan with a timestamp - sheet CUSTOMER_CONTRACTOR_EQUIP",
         esc(m["tx_requested"].strftime("%d %b %Y %H:%M")),
         f"issues {ws.strftime('%d %b %H:%M')} to {we.strftime('%d %b %Y %H:%M')}; returns to the pull"],
        ["Gas_Monitor_Serial_Numbers.xlsx", "Serial number for each barcode - display only",
         "-", "not a source of counts"],
        ["Ampol Gas Monitor Report.xlsm", "Not used - its summary tab is what the old report quoted",
         "-", "not a source of numbers"],
    ]
    rules = [
        ("Gas monitor", "Description contains \"X-am\" or \"gas monitor\". Chargers and probes are not monitors."),
        ("Crew draw", "A transaction to a named person. Dräger service statuses, FCCU and Operations custody, "
                      "Future Fuels and the After Hours account are workflows, not people - reported on their "
                      "own lines, never as a person."),
        ("Same day", f"Scanned back on the calendar day it went out. A draw at or after "
                     f"{R['night_shift_from'].strftime('%H:%M')} counts as same day if back by "
                     f"{R['night_shift_back_by'].strftime('%H:%M')} next morning. Draws still open are not same day."),
        ("Overdue", "On hire to a person with an on-hire date before the report date. Gear issued today is "
                    "\"out today\", not overdue. Days are counted from the on-hire scan."),
        ("Windows", f"Year to date = the transactions export ({esc(m['ytd_label'])}). Last 3 months = the 13 "
                    f"full weeks before this one plus this week so far ({esc(m['d90_label'])}). Last 30 days = "
                    f"{esc(m['d30_label'])}. Yesterday = {m['yesterday'].strftime('%d %b %Y')}, the last complete day. "
                    f"Repeat = a non-return in {R['repeat_weeks']} or more separate weeks of the last 30 days."),
        ("Exposure", f"{money(R['charge_per_unit'])} per monitor overdue 30 days or more - the replacement "
                     f"charge from the Ampol gas monitor workbook. Never estimated."),
        ("Health score", "Plain average of availability, 30-day same-day rate, repairs and 30+ day control. "
                         "Each formula is printed beside its score on the position page."),
        # WHY (03 Sep 2026): the log's own check (the page after this one)
        # reads the same export through txn_insights - its rules are named
        # here with the others so that page needs no second key.
        ("The log, checked", f"TRANSACTIONS, sheet CUSTOMER_CONTRACTOR_EQUIP, report period {lw0} to {lw1}. "
                             "Short hire = a hire closed inside 6 minutes. Mass draw = one person drawing 15 or more "
                             "items inside one hour. Product key = the description with its size and serial tail removed."),
    ]
    rrows = "".join(f'<tr><td class="k">{esc(k)}</td><td>{esc(v)}</td></tr>' for k, v in rules)
    recon = "".join(f'<tr><td class="k">Check {i + 1}</td><td>{esc(n)}</td></tr>'
                    for i, n in enumerate(m["recon_notes"]))
    # WHY (03 Sep 2026): the trend page needs seven days on the scoreboard;
    # until then the reader is told when it will appear, not left guessing.
    trend_line = ("" if m.get("trend_ok") else
                  f"Trend page: appears once seven days are on record ({num(m.get('hist_days', 0))} today). ")
    return f"""<div class="sect"><h3>Data and method - where every number comes from</h3></div>
{sh.dtable(["Source file", "What it gives the report", "Pulled", "Covers"], src, ["", "", "", ""], cls="cp")}
<div class="sub-h">The rules</div>
<table class="rules">{rrows}</table>
<div class="sub-h">Reconciliation <span class="thin">- the two exports checked against each other</span></div>
<table class="rules">{recon}</table>
<div class="note">{trend_line}Australian dates, metric units, 24-hour time. Anything the source does not carry
  is shown as a dash, never guessed.</div>"""


LOG_HEADING = "The log, checked - return windows, scan habits and who holds the fleet"


def page_log(m):
    """The log, checked (03 Sep 2026): what the TRANSACTIONS rows say about
    the same fleet barcodes - the return window every completed hire shows,
    the rows that look like a scan habit rather than a hire, the register-
    versus-log gaps with sample rows, and the 80/20 of who holds the fleet.
    A fixed A4 page: every list is capped at six rows and says how many it
    shows; the four sample tables sit two up, four columns each, so every
    row is one line."""
    L = m["log"]
    a = L["rw_all"] or {"n": 0, "median": 0.0, "p90": 0.0, "sd_pct": 0.0}
    dq, ho = L["dq"], L["ho"]
    w0, w1 = L["window"] if L["window"][0] else m["tx_window"]
    CAP = 6
    nd = '<span class="tbc">-</span>'

    def person(who, co):
        # a person carries the company under the name; an account stands alone
        s2 = f'<span class="s2">{esc(co)}</span>' if co and ge.account_kind(who, co) == "crew" else ""
        return who_s(who) + s2
    short = sorted(dq["short"], key=lambda t: t["st"], reverse=True)
    srows = [[esc(t["st"].strftime("%d %b")), person(t["who"], t["co"]), esc(t["bc"]), f'{t["hours"] * 60:.0f} min']
             for t in short[:CAP]]
    if not srows:
        srows = [['<span class="tbc">none - no hire closed inside 6 minutes</span>', "", "", ""]]
    mrows = [[esc(day.strftime("%d %b")), f"{hr:02d}:00", person(who, co), num(n)]
             for (who, co, day, hr), n in dq["mass"][:CAP]]
    if not mrows:
        mrows = [['<span class="tbc">none - nobody drew 15 or more in an hour</span>', "", "", ""]]

    def reg_rows(rs, empty):
        rs = sorted(rs, key=lambda r: (r["on_dt"] is None, r["on_dt"] or m["asat"]))
        out = [[esc(r["barcode"]), person(r["hirer"], r["company"]), esc(dfmt(r["on_dt"])) or nd] for r in rs[:CAP]]
        return out or [[f'<span class="tbc">{empty}</span>', "", ""]]
    n_no, n_pre = len(dq["onhire_no_log"]), len(dq["onhire_before_log"])
    nrows = reg_rows(dq["onhire_no_log"], "none - every monitor on hire has a movement in the log")
    prows = reg_rows(dq["onhire_before_log"], "none - every monitor on hire was issued inside the log")
    n80, cust = ho["n80_items"], L["cust80"]
    sd_ok = a["sd_pct"] >= CONFIG["rag_sameday_target"]

    def shown(n, what):
        tail = f" {what}" if what else ", "
        return (f"{num(min(CAP, n))} of {num(n)}" if n > CAP else num(n)) + tail
    SH = 'class="sub-h" style="margin:10px 0 6px 0"'
    return f"""<div class="lg"><div class="sect"><h3>{esc(LOG_HEADING)}</h3></div>
<div class="callout tight">
  <span class="lead">Every completed hire, counted.</span> <b>{num(a['n'])} completed monitor hires</b> in the log,
  {w0:%d %b} to {w1:%d %b %Y}: half back inside <b>{hours_s(a['median'])} hours</b>, <b class="o">nine in ten inside
  {hours_s(a['p90'])} hours</b>, <b>{a['sd_pct']}%</b> the same day. The rows to read around:
  <b class="o">{num(dq['short_n'])} hires closed inside 6 minutes</b>, <b>{num(dq['mass_n'])} mass draws</b> (15 or more
  monitors to one person in an hour - kits for a crew or a custody line), <b>{num(n_no)}</b> on hire with no movement
  since the log began, and <b>{num(n_pre)}</b> issued before it opened - history, not a gap.
</div>
{sh.tiles([
    ("swap", num(a['n']), "Completed hires", f"every fleet monitor, {w0:%d %b} to {w1:%d %b}", "grey"),
    ("clock", f"{hours_s(a['median'])} h", "Half back inside", "median hold, scan to scan", "grey"),
    ("clock", f"{hours_s(a['p90'])} h", "Nine in ten back inside", "90th percentile", "amber"),
    ("check", f"{a['sd_pct']}%", "Back the same day", "of completed hires", "green" if sd_ok else "amber"),
])}
<table class="two"><tr>
  <td style="width:50%;padding-right:6px"><div {SH}>Six-minute hires <span class="thin">- {shown(len(short), "hires")}, newest first</span></div>
{sh.dtable(["Day", "Who", "Asset", "Out for"], srows, ["nw", "", "nw", "nw"], cls="cp")}</td>
  <td style="padding-left:6px"><div {SH}>Mass draws <span class="thin">- {shown(dq['mass_n'], "draws")}, largest first</span></div>
{sh.dtable(["Day", "Hour", "Who", "Monitors"], mrows, ["nw", "nw", "", "r"], cls="cp")}</td>
</tr></table>
<table class="two"><tr>
  <td style="width:50%;padding-right:6px"><div {SH}>No movement logged <span class="thin">- {shown(n_no, "on hire")}</span></div>
{sh.dtable(["Asset", "Who", "On hire since"], nrows, ["nw", "", "nw"], cls="cp")}</td>
  <td style="padding-left:6px"><div {SH}>Issued before the log <span class="thin">- {shown(n_pre, "")}oldest first</span></div>
{sh.dtable(["Asset", "Who", "On hire since"], prows, ["nw", "", "nw"], cls="cp")}</td>
</tr></table>
<div class="note"><b>So what:</b> hold crews to the {hours_s(a['p90'])}-hour line the fleet already runs on; the six-minute
  hires and the mass draws are scan habits to read around, not hires to chase.</div>
<div class="note">Who holds the fleet, ranked by units: <b>{num(n80)} of the {num(ho['holders'])} holders</b> on the register
  carry 80% of the {num(ho['items'])} monitors on hire, {num(cust)} of them custody and workflow accounts, not people.
  Counted from TRANSACTIONS (sheet CUSTOMER_CONTRACTOR_EQUIP, {w0:%d %b %Y %H:%M} to {w1:%d %b %Y %H:%M}); rules on the data page.</div></div>"""

def page_closing(m):
    cards = [
        ("Scan and look - every time",
         "Every monitor is scanned <b>and</b> sighted going out, and scanned and "
         "sighted coming back. If it moved, it is on the record. That is your "
         "protection as much as ours."),
        ("Bump, charge, inspect - daily",
         "Gas monitors come back <b>every shift</b> for bump testing, charging and "
         "inspection. A monitor out overnight has not been bump tested - that is a "
         "safety follow-up, not a hire question."),
        ("Out of calibration is out of service",
         "Anything out of calibration comes off the shelf. You will never be "
         "issued a monitor we would not carry ourselves."),
        ("Numbers you can challenge",
         "Every score on the position page prints its own arithmetic and every figure is counted "
         "from the SiteIQ exports named on the data page. Nothing is weighted behind "
         "the scenes and nothing is estimated."),
        ("Breakdowns - tell us everything",
         "Something stops? Tell us <b>where it is, what is wrong, what it was "
         "doing</b>. We will get it swapped or fixed - no drama, no waiting."),
        ("Reconciled before it is sent",
         "The register and the transaction log are checked against each other on "
         "every build. Any difference is printed on the data page, not quietly dropped."),
    ]
    return f"""<div class="sect"><h3>The tool store has your back</h3></div>
{sh.info_cards(cards)}
{sh.coates_way_panel(traits=(4, 3), disciplines=(1, 6), line="same-day returns are Trait 4&rsquo;s &lsquo;returns processed same day&rsquo;; every overdue unit carries an owner and a date")}
<div class="sect"><h3>Meet the tool store team</h3></div>
<div class="note">The crew running your {esc(CONFIG['client'])} store - getting the right gear
  to the right people, keeping it tested and ready, and making sure everything that leaves
  the store is right. Something not on hand or not right? Tell us and we'll sort it.</div>
{sh.team_cards(CONFIG['team'])}"""


def build_pages(m, d):
    # WHY (03 Sep 2026): the story order - the position now, what moved
    # since the last pull, the 30-day trend once it exists, then where the
    # numbers come from and the day-by-day detail.
    pages = [page_position(m), page_position_detail(m), page_since(m, d)]
    if m.get("trend_ok"):
        pages.append(page_trend(m))
    pages += [
        page_sources(m),
        page_yesterday(m),
        page_people(m),
        page_people_ytd(m),
        page_companies(m),
        page_year(m),
        page_90days(m),
        page_30days(m),
        page_where(m),
        page_ageing(m),
        page_rhythm(m),
        page_shift_rhythm(m),
        page_demand(m),
        page_repairs(m),
    ]
    pages += pages_appendix(m)
    pages.append(page_method(m))
    # WHY (03 Sep 2026): the log's own check sits with the data page, before the close
    pages.append(page_log(m))
    pages.append(page_closing(m))
    return pages


COVER_LABEL = "monitors overdue at the pull"

# WHY (03 Sep 2026): the cover's "What's inside" block holds ten rows at
# most, read off the printed pages (pdf_finish.contents_from_pdf), so
# every page number is real. These headings are left off the list so the
# ten that print are the report's spine; the bookmark pane carries all.
CONTENTS_SKIP = (
    "The position in detail",
    "The trend - last 30 days",
    "Who is not bringing them back - year to date",
    "The year so far - volume and behaviour by month",
    "The last 3 months - week by week",
    "The last 30 days - day by day",
    "Recovery priorities - worst first",
    "The daily rhythm - when monitors move (last 30 days)",
    "The shift rhythm - draws and returns by weekday and hour, year to date",
    "Demand - monitors out at once, year to date",
    "Out of service - the Dräger repair queue",
    # WHY (03 Sep 2026): the log's check rides with the data page (the row
    # above it on the cover); the bookmark pane still carries it.
    LOG_HEADING,
    "The tool store has your back",
    "Meet the tool store team",
)
# the long headings, shortened for the cover's 96 mm column (page numbers untouched)
CONTENTS_SHORT = {
    "By company - the last 30 days against the quarter and the year": "By company - 30 days, quarter and year",
    "Where the monitors are right now - by company, ranked by units 30+ days out": "Where the monitors are right now - by company",
}


def cover_contents_rows(pdf_path, doc_full):
    """(title, page) rows for the cover, read off a printed PDF."""
    rows = pdf_finish.contents_from_pdf(pdf_path, doc_full, has_cover=True, skip=CONTENTS_SKIP)
    return [(CONTENTS_SHORT.get(t, t), pg) for t, pg in rows][:10]


def cover_for(m, cfg, gen_s, asat_s, gen_dt=None, contents=None):
    lines = [f"<b>{num(m['out_30'])}</b> out 30 days or more - {money(m['exposure'])} of replacement exposure",
             f"<b>{num(m['available'])}</b> ready on the shelf against a {num(m['rules']['availability_target'])}-unit target",
             f"<b>{m['d30']['sd_pct']}%</b> came back the same day over the last 30 days"]
    # WHY (03 Sep 2026): the cover stripe is the same status as the band
    # on the position page, and the freshness line says how old the pull
    # was when the report was built.
    return sh.cover_page(cfg, num(m["outstanding"]), COVER_LABEL, lines, gen_s, asat_s,
                         rag=rag_parts(m)["status"], fresh=sh.freshness_line(m["asat"], gen_dt),
                         contents=contents)


# WHY (03 Sep 2026): the log page carries four six-row sample tables two
# up on one fixed page - its rows run a touch tighter than the shell's
# compact table so every list keeps its six rows above the footer.
LOG_CSS = """
.lg table.dt.cp td { padding: 4px 8px; }
.lg table.dt.cp td .s2 { margin-top: 0; }
.lg .tiles { margin-top: 9px; }
"""


def wrap_doc(body, cfg, asat_s):
    """The page HTML around the rendered pages. k2style.css is inlined by
    the caller so the file beside the PDF is self-contained."""
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Coates {esc(cfg['client'])} {esc(cfg['title'])} - {esc(asat_s)}</title>
<style>{LOG_CSS}</style>
</head><body>{body}</body></html>"""


def build_html(m, cfg, gen_s, asat_s, d=None, gen_dt=None, contents=None):
    """contents: (title, page) rows for the cover's "What's inside" block,
    read off a first print of these same pages (see main)."""
    d = d or m.get("since") or pull_diff.no_previous(m["asat"])
    pages = build_pages(m, d)
    cover = cover_for(m, cfg, gen_s, asat_s, gen_dt, contents) if cfg.get("cover_page") else ""
    off = 1 if cover else 0
    tot = len(pages) + off
    rendered = []
    for i, p in enumerate(pages):
        if i == 0:
            # WHY (03 Sep 2026): the position page keeps the hero head and the
            # key strip (render_page's page 1), but its footer counts the
            # cover - page_no prints "Page 2 of N".
            rendered.append(sh.render_page(cfg, p, 1, tot, gen_s, asat_s, page_no=1 + off))
        else:
            rendered.append(sh.render_page(cfg, p, i + 1 + off, tot, gen_s, asat_s))
    body = cover + "".join(rendered)
    return wrap_doc(body, cfg, asat_s), tot


# =====================================================================
# PDF RENDERING - WeasyPrint when it works, Edge headless when it won't
# =====================================================================

def find_browser():
    """Edge (or Chrome/Chromium) for headless print-to-PDF.
    GASMON_BROWSER overrides everything for the odd laptop where Edge
    lives somewhere non-standard."""
    import shutil
    override = os.environ.get("GASMON_BROWSER", "")
    if override and os.path.exists(override):
        return override
    candidates = []
    for var, tail in (
            ("ProgramFiles(x86)", r"Microsoft\Edge\Application\msedge.exe"),
            ("ProgramFiles", r"Microsoft\Edge\Application\msedge.exe"),
            ("LocalAppData", r"Microsoft\Edge\Application\msedge.exe"),
            ("ProgramFiles(x86)", r"Google\Chrome\Application\chrome.exe"),
            ("ProgramFiles", r"Google\Chrome\Application\chrome.exe")):
        base = os.environ.get(var, "")
        if base:
            candidates.append(os.path.join(base, tail))
    for c in candidates:
        if os.path.exists(c):
            return c
    for name in ("msedge", "chrome", "chromium", "chromium-browser", "google-chrome"):
        p = shutil.which(name)
        if p:
            return p
    # Playwright's bundled Chromium (build/test machines)
    for root in (os.environ.get("PLAYWRIGHT_BROWSERS_PATH", ""), "/opt/pw-browsers"):
        if root:
            hits = sorted(glob.glob(os.path.join(root, "chromium-*", "chrome-linux", "chrome")))
            if hits:
                return hits[-1]
    return ""


# A script the browser runs before --dump-dom: for every authored page,
# how far the deepest content reaches past the top of the footer (px),
# and whether anything is wider than the body. Chromium does not split a
# fixed-height page when an SVG will not fit - it quietly drops the SVG -
# so the page COUNT can pass while a chart has vanished. This catches it.
_MEASURE_JS = r"""<script>
(function(){
  function run() {
    var out = [];
    var pages = document.querySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) {
      var pg = pages[i];
      var body = pg.querySelector('.body');
      var foot = pg.querySelector('.foot');
      if (!body || !foot) { out.push({page: i + 1, over: -9999, wide: 0}); continue; }
      var ft = foot.getBoundingClientRect();
      var bottom = body.getBoundingClientRect().top;
      var els = body.querySelectorAll('*');
      for (var j = 0; j < els.length; j++) {
        var r = els[j].getBoundingClientRect();
        if (r.bottom > bottom) bottom = r.bottom;
      }
      out.push({page: i + 1, over: Math.round(bottom - ft.top),
                wide: Math.round(body.scrollWidth - body.clientWidth)});
    }
    var d = document.getElementById('layout-report');
    if (!d) { d = document.createElement('div'); d.id = 'layout-report'; document.body.appendChild(d); }
    d.textContent = JSON.stringify({pages: out,
      fonts: (document.fonts ? document.fonts.status : 'n/a')});
  }
  /* measure once now, then again once the embedded Lato has loaded - the
     widths that print are the Lato widths (03 Sep 2026) */
  run();
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(run); }
})();
</script>"""


_FONTS_SEEN = [""]   # the browser's font status on the last measure


def layout_check(doc_full, base):
    """Measure every page in the browser. doc_full is the page HTML with
    k2style.css already inlined; base is the folder the HTML is printed
    from (Reports\\<day>\\Gas_Monitors), so the embedded Lato face
    resolves exactly as it does for the PDF. Returns (ok, report_rows)
    where a row is (page, px_past_footer, px_wider_than_body). ok is None
    when the measurement could not be taken."""
    import json as _json
    import re as _re
    import subprocess
    import tempfile
    browser = find_browser()
    if not browser:
        return None, []
    doc2 = doc_full.replace("</body>", _MEASURE_JS + "</body>", 1)
    tmp = tempfile.NamedTemporaryFile("w", suffix=".html", dir=base, delete=False,
                                      encoding="utf-8")
    try:
        tmp.write(doc2)
        tmp.close()
        from pathlib import Path
        # WHY (03 Sep 2026): the virtual-time budget lets the embedded
        # fonts finish loading before the DOM is dumped, so the widths
        # measured are the widths that print.
        cmd = [browser, "--headless", "--disable-gpu", "--no-sandbox",
               "--virtual-time-budget=6000", "--dump-dom", Path(tmp.name).as_uri()]
        res = subprocess.run(cmd, capture_output=True, timeout=180)
        dom = (res.stdout or b"").decode("utf-8", "ignore")
    except Exception:
        return None, []
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass
    mm = _re.search(r'id="layout-report">(\{.*?\})</div>', dom, _re.S)
    if not mm:
        return None, []
    try:
        rep = _json.loads(mm.group(1))
        _FONTS_SEEN[0] = str(rep.get("fonts", ""))
        rows = [(r["page"], r["over"], r["wide"]) for r in rep["pages"]]
    except Exception:
        return None, []
    bad = [r for r in rows if r[1] > 0 or r[2] > 0]
    return (not bad), rows


def render_pdf_weasy(html_path, pdf_path):
    rendered = HTML(filename=html_path).render()
    actual = len(rendered.pages)
    rendered.write_pdf(pdf_path)
    return actual


def render_pdf(html_path, pdf_path):
    """One print of the page HTML to PDF: WeasyPrint when it works, Edge /
    Chrome headless when it does not. Returns (page count, engine name)."""
    if _HAVE_WEASY:
        try:
            return render_pdf_weasy(html_path, pdf_path), "WeasyPrint"
        except Exception as e:
            print(f"PDF engine           : WeasyPrint failed at render time "
                  f"({type(e).__name__}) - falling back to Edge/Chrome")
    return render_pdf_browser(html_path, pdf_path), "Edge/Chrome headless (no installs needed)"


def render_pdf_browser(html_path, pdf_path):
    """Edge/Chrome headless print-to-PDF, printed from the page HTML that
    sits beside the PDF (so the embedded font URLs in the stylesheet
    resolve). Returns the page count read from the PDF, or -1 when the
    file does not expose it to a plain scan."""
    import re as _re
    import subprocess
    browser = find_browser()
    if not browser:
        sys.exit(
            "ERROR: no PDF engine available.\n"
            "  WeasyPrint is not working on this machine (it needs GTK\n"
            "  system libraries), and Microsoft Edge / Chrome could not be\n"
            "  found for the fallback.\n"
            "  Edge is standard on Coates laptops - if it lives somewhere\n"
            "  unusual, set the GASMON_BROWSER environment variable to the\n"
            "  full path of msedge.exe and run again.")
    from pathlib import Path
    url = Path(html_path).as_uri()
    cmd = [browser, "--headless", "--disable-gpu", "--no-sandbox",
           "--no-pdf-header-footer", "--print-to-pdf-no-header",
           f"--print-to-pdf={pdf_path}", url]
    res = subprocess.run(cmd, capture_output=True, timeout=240)
    if not os.path.exists(pdf_path) or os.path.getsize(pdf_path) < 10000:
        err = (res.stderr or b"").decode("utf-8", "ignore")[-400:]
        sys.exit("ERROR: Edge/Chrome could not print the PDF.\n"
                 f"  Engine: {browser}\n  Said: {err}\n"
                 "  Nothing has been sent.")
    raw = open(pdf_path, "rb").read()
    counts = _re.findall(rb"/Count\s+(\d+)", raw)
    return max(int(c) for c in counts) if counts else -1


# =====================================================================
# MAIN
# =====================================================================

def record_history(m, stem):
    """The movement scoreboard: today's figures and the words of the RAG
    band, keyed on the pull day, so tomorrow can print the change and the
    daily position can quote today's line. Same day = replace."""
    p = rag_parts(m)
    rh.record("gas", m["asat"], {
        "fleet": m["fleet_total"], "available": m["available"], "crew_out": m["crew_out"],
        "overdue": m["outstanding"], "overdue_30": m["out_30"], "exposure": m["exposure"],
        "repairs": m["repairs"], "health": m["health"], "same_day_30": m["d30"]["sd_pct"],
        "yday_draws": m["yday_draws"], "yday_not_same_day": m["yday_nsd"],
        "custody": m["custody_total"]},
        extra={"rag": p["status"], "headline": plain(p["head"]), "rule": plain(p["rule"]),
               "owner": "Andrew Fisher, Shutdown Manager", "action": plain(p["action"]),
               "due": p["due"], "key_value": num(m["outstanding"]), "key_label": COVER_LABEL,
               "second_value": num(m["available"]), "second_label": "available now",
               "title": "Ampol Gas Monitor Operations Report", "folder": "Gas_Monitors",
               "pdf": stem + ".pdf", "card": stem + "_PositionCard.png"})


def build(write_html=None, record=True):
    """Load, compute, diff against the last pull, record the scoreboard,
    build the pages. Returns (m, doc, pages, gen_s, asat_s, gen_dt)."""
    ctx = ge.load()
    m = ge.compute(ctx)
    _ASAT_DT[0] = m["asat"]
    gen_dt = datetime.now()
    gen_s = gen_dt.strftime("%d %b %Y %H:%M")
    asat_s = m["asat"].strftime("%d %b %Y %H:%M")
    # WHY (03 Sep 2026): the fleet for the since-the-last-pull page is
    # exactly the register rows the engine counts into fleet_total - the
    # same monitors, no second rule.
    scope = {r["bc"] for r in ctx["rs"]}
    d = pull_diff.changes(scope_barcodes=scope)
    m["since"] = d
    # WHY (03 Sep 2026): the same fleet barcodes through the transaction-log
    # engine (txn_insights) - the return window, the scan habits, the
    # register-versus-log gaps and the 80/20 of holders. Loaded once per build.
    m["log"] = log_insights(ti.load_all(), scope)
    stem = report_stem()
    if record:
        # recorded before the pages are built so today's point is on the
        # trend line; the movement notes only read earlier days
        record_history(m, stem)
    days = sorted(rh.load().get("gas", {}))
    m["hist_days"] = len(days)
    m["trend_ok"] = len(days) >= TREND_MIN_DAYS
    doc, pages = build_html(m, CONFIG, gen_s, asat_s, d, gen_dt)
    if write_html:
        with open(write_html, "w", encoding="utf-8") as f:
            f.write(doc)
    return m, doc, pages, gen_s, asat_s, gen_dt


def main():
    cfg = CONFIG
    here = ampol_paths.suite_dir()
    out_dir = ampol_paths.day_folder("Gas_Monitors")
    stem = report_stem()
    print("=" * 68)
    print("COATES K2-STYLE PDF - AMPOL GAS MONITOR OPERATIONS")
    print("=" * 68)
    m, doc, pages, gen_s, asat_s, gen_dt = build()
    print(f"RENTAL_STOCK export  : {m['sources']['rental_stock']}")
    print(f"TRANSACTIONS export  : {m['sources']['transactions']}")
    ge.print_summary(m)
    d = m["since"]
    l = d["last24"]
    if d["have_previous"]:
        print(f"Since the last pull  : {d['prev_time']:%d %b %Y %H:%M} -> {d['cur_time']:%d %b %Y %H:%M}: "
              f"{len(d['returned'])} came back, {len(d['issued'])} went out, {len(d['moved'])} changed hands, "
              f"{len(d['crossed'][30])} crossed 30 days")
    else:
        print("Since the last pull  : no earlier pull in Data\\previous - pull against pull starts "
              "with the next pull")
    print(f"Last 24 h before pull: {len(l['issued'])} draws, {len(l['returned'])} returns of fleet monitors"
          + ("" if l["available"] else " (TRANSACTIONS not found - not counted)"))
    L = m["log"]
    a = L["rw_all"] or {"n": 0, "median": 0.0, "p90": 0.0, "sd_pct": 0.0}
    print(f"The log, checked     : {a['n']:,} completed hires - half back inside {hours_s(a['median'])} h, "
          f"nine in ten inside {hours_s(a['p90'])} h, {a['sd_pct']}% same day; {L['dq']['short_n']} closed inside "
          f"6 min, {L['dq']['mass_n']} mass draws, {len(L['dq']['onhire_no_log'])} on hire with no log, "
          f"{len(L['dq']['onhire_before_log'])} issued before the log; {L['ho']['n80_items']} of "
          f"{L['ho']['holders']} holders carry 80% of {L['ho']['items']:,} on hire")
    print(f"History              : {rh.HIST.name} - gas figures recorded for {m['asat']:%d %b %Y}; "
          f"{m['hist_days']} day(s) on record - trend page "
          + ("on" if m["trend_ok"] else f"appears at {TREND_MIN_DAYS}"))

    css_path = os.path.join(here, cfg["css_name"])
    if not os.path.exists(css_path):
        sys.exit(f"ERROR: {cfg['css_name']} is missing from the suite folder.\n"
                 f"  Looked for: {css_path}\n"
                 "  It carries the Coates house style - keep the suite together.")
    with open(css_path, encoding="utf-8") as f:
        css = f.read()
    pdf_path = os.path.join(out_dir, stem + ".pdf")
    html_path = os.path.join(out_dir, stem + ".html")
    card_path = os.path.join(out_dir, stem + "_PositionCard.png")

    # WHY (03 Sep 2026): the page HTML is written beside the PDF with the
    # stylesheet inlined and the PDF is printed FROM it - the embedded Lato
    # face in k2style.css is addressed relative to this folder, so printing
    # from a temporary file elsewhere fell back to a substitute face.
    doc_full = doc.replace("</head>", f"<style>{css}</style></head>", 1)
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(doc_full)

    # WHY (03 Sep 2026): the cover's "What's inside" block needs the page
    # each heading actually landed on, so the pages are printed once, the
    # headings are read off that PDF, and the document is built again with
    # the contents on the cover. The cover is one fixed page and every
    # other page is unchanged, so the second print has the same page count
    # - asserted below, never assumed.
    first_count, engine = render_pdf(html_path, pdf_path)
    contents = cover_contents_rows(pdf_path, doc_full) if cfg.get("cover_page") else []
    if contents:
        doc, pages2 = build_html(m, cfg, gen_s, asat_s, m["since"], gen_dt, contents=contents)
        if pages2 != pages:
            sys.exit(f"ERROR: the contents pass authored {pages2} pages against {pages} - "
                     "the cover must not change the pagination. Nothing has been sent.")
        doc_full = doc.replace("</head>", f"<style>{css}</style></head>", 1)
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(doc_full)
        print(f"Cover contents       : {len(contents)} rows read off the first print - "
              + ", ".join(f"{t.split(' - ')[0]} p{pg}" for t, pg in contents))
    else:
        print("Cover contents       : none read (no PDF reader on this machine) - the cover prints no block")
    print(f"Page HTML kept       : {html_path}")

    # the phone-sized position card - the same page-1 figures as an image
    p = rag_parts(m)
    status = p["status"]
    hs = m["health"]
    sh.position_card_png(cfg, asat_s, [
        (num(m["fleet_total"]), "Total fleet", "on the Ampol register", "#7A8A9A"),
        (num(m["available"]), "Available now", f"ready for issue at {hhmm(m['asat'])}", "#22C55E"),
        (num(m["crew_out"]), "Out to crew", f"{num(m['out_today'])} today + {num(m['outstanding'])} overdue", "#7A8A9A"),
        (num(m["outstanding"]), "Overdue 1+ days", f"{num(m['out_30'])} at 30+ days", "#F0603E"),
        (money(m["exposure"]), "Replacement exposure", "units 30 days or more", "#F0603E"),
        (f"{m['d30']['sd_pct']}%", "Same-day, last 30 days", f"target {cfg['rag_sameday_target']}%", "#EFA82B"),
    ], (status, f"{num(m['out_30'])} monitors out 30 days or more; {num(m['outstanding'])} overdue in all; "
                f"{m['d30']['sd_pct']}% same-day over 30 days.", "Andrew Fisher, Shutdown Manager",
        f"Appendix A to each supervisor by {p['due']}"),
        [("Tool availability", m["score_availability"]), ("Same-day returns, 30 days", m["score_sameday"]),
         ("Repairs", m["score_repairs"]), ("30+ day control", m["score_30"])],
        card_path, f"Counted from the SiteIQ exports of {asat_s} - nothing estimated. Health {hs}/100.")
    print(f"Position card        : {card_path}")

    # Measure every page in the browser BEFORE printing - a chart that does
    # not fit is dropped silently by the print engine, page count intact.
    ok, rows = layout_check(doc_full, out_dir)
    fit_ok = True
    if ok is None:
        print("Fit check            : could not measure (no browser) - relying on the page count")
    elif ok:
        # -9999 marks a page with no body (the cover) - not a measurement
        worst = max((r[1] for r in rows if r[1] > -9999), default=-9999)
        tight = sorted((r for r in rows if r[1] > -9999), key=lambda r: -r[1])[:3]
        print(f"Fit check            : PASS - every page's content sits above its footer "
              f"(tightest page has {-worst}px to spare; fonts {_FONTS_SEEN[0] or 'not reported'})")
        print("                       tightest pages: "
              + ", ".join(f"p{pg} {-ov}px" for pg, ov, _ in tight))
    else:
        fit_ok = False
        print("")
        print("*" * 68)
        print("WARNING: CONTENT DOES NOT FIT - the print engine will drop or split it.")
        for pg, over, wide in rows:
            if over > 0 or wide > 0:
                print(f"  page {pg:2d}: {over:+d}px past the footer"
                      + (f", {wide}px too wide" if wide > 0 else ""))
        print("  Fix: lower the row counts in CONFIG or shorten the section that grew.")
        print("  Do not send this PDF as is.")
        print("*" * 68)
        print("")

    actual, engine = render_pdf(html_path, pdf_path)
    print(f"PDF engine           : {engine}")
    if contents:
        if actual != first_count:
            fit_ok = False
            print("*" * 68)
            print(f"WARNING: the first print had {first_count} pages and the second {actual} - "
                  "the cover contents moved a page. Do not send this PDF as is.")
            print("*" * 68)
        else:
            print(f"Two-pass check       : PASS - {first_count} pages on the first print, "
                  f"{actual} on the second; the contents page numbers are the printed ones")

    # Each page is authored as one fixed A4 box; if content overflows, the
    # renderer splits it, the orange frame breaks and the footer drops off.
    if actual == -1:
        print(f"Layout check         : page count not readable from this PDF - "
              f"authored {pages} pages; open it and confirm the last page is page {pages}")
    elif actual != pages:
        fit_ok = False
        print("")
        print("*" * 68)
        print(f"WARNING: LAYOUT OVERFLOW - authored {pages} pages but the PDF has {actual}.")
        print("  A page's content is taller than the frame, so the orange border")
        print("  and the footer will be broken on at least one page.")
        print("  Fix: lower appendix_rows / league_rows in CONFIG, or shorten the")
        print("  section that grew. Do not send this PDF as is.")
        print("*" * 68)
        print("")
    else:
        print(f"Layout check         : PASS - {actual} pages, none overflowed")

    # WHY (03 Sep 2026): document properties and the bookmark pane, stamped
    # on the finished file - the email script attaches this file as is.
    title = f"{cfg['client']} {cfg['title']} Report - as at {asat_s}"
    subject = (f"Where every Ampol gas monitor was at {asat_s}, who holds the overdue units, "
               f"and what moved since the last pull.")
    print("PDF finish           : " + pdf_finish.finish(
        pdf_path, title, subject, doc_full, keywords="gas monitors, Dräger X-am 5000",
        has_cover=bool(cfg.get("cover_page")), family="Gas monitors"))
    print(f"Pages                : {pages}")
    print(f"PDF written          : {pdf_path}  ({os.path.getsize(pdf_path):,} bytes)")
    print("")
    print("NEXT STEP: open the PDF, read the position page and the data page, then send it.")
    print("Done. The Coates Way - consistent execution, every day.")
    if not fit_ok:
        sys.exit("\nWARNING: a page failed its fit check - see above. Do not send it as is.")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(f"ERROR: {e}")
