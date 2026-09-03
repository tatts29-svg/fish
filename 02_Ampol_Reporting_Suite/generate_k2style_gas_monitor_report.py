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

DEPENDENCIES
  pip install openpyxl pillow        (weasyprint optional)
  Offline at run time. No web fonts, no CDN, no API calls. The PDF is
  printed by Microsoft Edge in headless mode when WeasyPrint is not
  available - Edge is on every Coates laptop.
=====================================================================
"""

import glob
import os
import sys
from datetime import datetime, timedelta

import ampol_paths
import gasmon_engine as ge
import report_history as rh
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
    "pdf_name": "Coates_Ampol_GasMonitor_Operations_K2STYLE.pdf",
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
        ("amber", "OUT OF CALIBRATION", "out of calibration is out of service"),
    ],

    # WHY (03 Sep 2026): the page-1 RAG band. Default lines - change them
    # here and the rule text on the page follows. Units out 30 days or more.
    "rag_amber_30": 10,
    "rag_red_30": 40,
    "rag_sameday_target": 85,
    "cover_page": True,
    "card_name": "Coates_Ampol_GasMonitor_PositionCard.png",

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


# =====================================================================
# THE PAGES
# =====================================================================

def page_position(m):
    R = m["rules"]
    asat = m["asat"]
    seg = [
        ("Crew", m["crew_out"], K["orange"]),
        ("FCCU", m["fccu"], K["blue"]),
        ("Ops", m["ops"], K["amber"]),
        ("Future Fuels", m["ff"], K["lime"]),
        ("After hrs", m["afterhours"], PALE_BLUE),
        ("Available", m["available"], K["green"]),
        ("Repairs", m["repairs"], K["red"]),
    ]
    seg = [s for s in seg if s[1] > 0]
    hs = m["health"]
    d30 = m["d30"]
    return f"""<div class="callout tight">
  <span class="lead">The position at {hhmm(asat)}, {dfmt(asat)}.</span>
  <b>{num(m['fleet_total'])} Dräger X-am 5000 monitors</b> are on the Ampol
  register: <b class="o">{num(m['available'])} on the shelf</b>,
  <b>{num(m['crew_out'])} out to crew</b> ({num(m['out_today'])} today,
  <b class="o">{num(m['outstanding'])} overdue</b> from earlier days),
  {num(m['custody_total'])} in custody (FCCU, Operations, Future Fuels, after-hours)
  and <b>{num(m['repairs'])} in the Dräger repair queue</b>. Counted from the SiteIQ
  exports on the data page - nothing is estimated.
</div>
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
<div class="sub-h">The fleet at a glance - where every monitor is
  <span class="thin">&mdash; a {hhmm(asat)} snapshot</span></div>
<div class="chartpanel">{sh.stackband(seg)}</div>
{sh.tiles_plus([
    ("box", num(m['fleet_total']), "Total fleet", mv("fleet", m['fleet_total'], "up", "on the Ampol register")[0],
     mv("fleet", m['fleet_total'], "up", "on the Ampol register")[1]),
    ("check", num(m['available']), "Available now",
     mv("available", m['available'], "up", f"ready for issue at {hhmm(asat)}")[0],
     mv("available", m['available'], "up", "")[1] or ("green" if m['available'] >= R['availability_target'] else "amber")),
    ("swap", num(m['crew_out']), "Out to crew",
     mv("crew_out", m['crew_out'], "down", f"{num(m['out_today'])} today + {num(m['outstanding'])} overdue")[0],
     mv("crew_out", m['crew_out'], "down", "")[1] or "grey"),
    ("warn", num(m['outstanding']), "Overdue 1+ days",
     mv("overdue", m['outstanding'], "down", f"{num(m['out_30'])} at 30+ days, {money(m['exposure'])} exposure")[0],
     mv("overdue", m['outstanding'], "down", "")[1] or ("red" if m['outstanding'] else "green")),
])}
{rag_band_gas(m)}"""


def mv(key, value, good, fallback):
    """Movement note for a page-1 tile: the recorded change since the last
    run when there is one, otherwise the plain note. (text, css_class)."""
    txt, cls = rh.movement("gas", key, _ASAT_DT[0], value, good)
    return (txt, cls) if txt else (fallback, "")


_ASAT_DT = [None]   # set in build() so the tile helpers can read history


def rag_band_gas(m):
    C, R = CONFIG, m["rules"]
    n30 = m["out_30"]
    sd = m["d30"]["sd_pct"]
    status = sh.rag_of(n30, C["rag_amber_30"], C["rag_red_30"])
    if status == "green" and sd < C["rag_sameday_target"] - 10:
        status = "amber"
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
    return sh.rag_band(status, head, rule, owner, action, tight=True)


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
         f"A draw not scanned back on the calendar day it went out. A draw at or after "
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
  back on the calendar day it went out (a draw after {R['night_shift_from'].strftime('%H:%M')}
  counts as same day if back by {R['night_shift_back_by'].strftime('%H:%M')} next morning).
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
<div class="sub-h">Not returned same day - last 30 days <span class="thin">&mdash; by company, top 8</span></div>
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
<div class="sub-h">Same-day return rate by week <span class="thin">&mdash; every week of the year{' (current week is partial)' if m['current_week_partial'] else ''}</span></div>
<div class="chartpanel">{sh.line_chart(wl, [{"vals": [w["pct"] for w in wk], "colour": K["green"], "label": "Same-day %", "fill": True}], h=158, label_every=2, pct=True, annotate=ann)}</div>
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
<div class="sub-h">Not returned same day - last 3 months <span class="thin">&mdash; by company, top 8</span></div>
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
<div class="sub-h">How long they stayed out <span class="thin">&mdash; every completed crew draw in the last 30 days</span></div>
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
<div class="chartpanel">{sh.stacked_hbars(bars, segs, rowh=23)}</div>
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
    return (f'<div class="sub-h">Custody holdings <span class="thin">&mdash; {num(m["custody_total"])} '
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
<div class="note">Charge exposure sits at <b>{money(m['exposure'])}</b> &mdash; {num(m['out_30'])}
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
<div class="sub-h">Issues and returns by hour of day <span class="thin">&mdash; {esc(m['d30_label'])}</span></div>
<div class="chartpanel">{sh.grouped_bars(hrows, h=168)}</div>
<div class="sub-h">Net monitors drawn from the store through the day
  <span class="thin">&mdash; average and worst of the last {len(m['curve_days'])} working days</span></div>
<div class="chartpanel">{sh.line_chart(xl, [
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
<div class="sub-h">Draws <span class="thin">&mdash; darker is quieter, orange is busier; the count is printed in every cell</span></div>
<div class="chartpanel">{sh.heatgrid(hd, days, cols)}</div>
<div class="sub-h">Returns <span class="thin">&mdash; the same week, scanned back in</span></div>
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
<div class="sub-h">Peak monitors out at once, by day <span class="thin">&mdash; {esc(m['ytd_label'])}</span></div>
<div class="chartpanel">{sh.line_chart(plabels, [{"vals": [p2["peak"] for p2 in pk], "colour": K["orange"], "label": "Daily peak out", "fill": True}], h=176, label_every=1)}</div>
{sh.tiles([
    ("zap", num(rp['peak']) if rp else "0", "Record - out at once", rp['at'].strftime('%d %b %H:%M') if rp else "-", "red"),
    ("box", num(usable), "Usable fleet", f"{num(m['fleet_total'])} owned less {num(m['repairs'])} in repair", "grey"),
    ("warn", num(usable - rp['peak']) if rp else "-", "Spare at the record peak", "across the whole site", "red" if rp and usable - rp['peak'] < 50 else "amber"),
    ("bars", num(rp30['peak']) if rp30 else "0", "Peak, last 30 days", rp30['at'].strftime('%d %b %H:%M') if rp30 else "-", "amber"),
])}
<div class="sub-h">How long monitors stay out <span class="thin">&mdash; every completed crew draw, year to date</span></div>
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
<div class="sub-h">Longest in the queue <span class="thin">&mdash; oldest first</span></div>
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
                f'<div class="sub-h">Appendix A - overdue monitors, oldest first '
                f'<span class="thin">&mdash; continued ({ci + 1} of {len(chunks)})</span></div>')
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
    src = [
        ["RENTAL_STOCK.xlsx", "Where every monitor is right now - status, who has it, on-hire date",
         esc(m["asat"].strftime("%d %b %Y %H:%M")), "the live register at the pull"],
        ["TRANSACTIONS.xlsx", "Every issue and return scan with a timestamp",
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
    ]
    rrows = "".join(f'<tr><td class="k">{esc(k)}</td><td>{esc(v)}</td></tr>' for k, v in rules)
    recon = "".join(f'<tr><td class="k">Check {i + 1}</td><td>{esc(n)}</td></tr>'
                    for i, n in enumerate(m["recon_notes"]))
    return f"""<div class="sect"><h3>Data and method - where every number comes from</h3></div>
{sh.dtable(["Source file", "What it gives the report", "Pulled", "Covers"], src, ["", "", "", ""], cls="cp")}
<div class="sub-h">The rules</div>
<table class="rules">{rrows}</table>
<div class="sub-h">Reconciliation <span class="thin">&mdash; the two exports checked against each other</span></div>
<table class="rules">{recon}</table>
<div class="note">Australian dates, metric units, 24-hour time. Anything the source does not carry
  is shown as a dash, never guessed.</div>"""


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
{sh.coates_way_panel()}
<div class="sect"><h3>Meet the tool store team</h3></div>
<div class="note">The crew running your {esc(CONFIG['client'])} store - getting the right gear
  to the right people, keeping it tested and ready, and making sure everything that leaves
  the store is right. Something not on hand or not right? Tell us and we'll sort it.</div>
{sh.team_cards(CONFIG['team'])}"""


def build_pages(m):
    pages = [
        page_position(m),
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
    pages.append(page_closing(m))
    return pages


def cover_for(m, cfg, gen_s, asat_s):
    lines = [f"<b>{num(m['out_30'])}</b> out 30 days or more - {money(m['exposure'])} of replacement exposure",
             f"<b>{num(m['available'])}</b> ready on the shelf against a {num(m['rules']['availability_target'])}-unit target",
             f"<b>{m['d30']['sd_pct']}%</b> came back the same day over the last 30 days"]
    return sh.cover_page(cfg, num(m["outstanding"]), "monitors overdue at the pull", lines, gen_s, asat_s)


def build_html(m, cfg, gen_s, asat_s):
    pages = build_pages(m)
    cover = cover_for(m, cfg, gen_s, asat_s) if cfg.get("cover_page") else ""
    off = 1 if cover else 0
    tot = len(pages) + off
    rendered = []
    for i, p in enumerate(pages):
        if i == 0:
            # the position page keeps the hero; its page number counts the cover
            rendered.append(sh.render_page(cfg, p, 1, tot, gen_s, asat_s)
                            .replace(f"PAGE 1 OF {tot}", f"PAGE {1 + off} OF {tot}"))
        else:
            rendered.append(sh.render_page(cfg, p, i + 1 + off, tot, gen_s, asat_s))
    body = cover + "".join(rendered)
    doc = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Coates {esc(cfg['client'])} {esc(cfg['title'])} - {esc(asat_s)}</title>
</head><body>{body}</body></html>"""
    return doc, tot


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
  var out = [];
  var pages = document.querySelectorAll('.page');
  for (var i = 0; i < pages.length; i++) {
    var pg = pages[i];
    var body = pg.querySelector('.body');
    var foot = pg.querySelector('.foot');
    if (!body || !foot) { out.push({page: i + 1, over: -1, wide: 0}); continue; }
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
  var d = document.createElement('div');
  d.id = 'layout-report';
  d.textContent = JSON.stringify(out);
  document.body.appendChild(d);
})();
</script>"""


def layout_check(doc, css_path, base):
    """Measure every page in the browser. Returns (ok, report_rows) where
    a row is (page, px_past_footer, px_wider_than_body). ok is None when
    the measurement could not be taken."""
    import json as _json
    import re as _re
    import subprocess
    import tempfile
    browser = find_browser()
    if not browser:
        return None, []
    with open(css_path, encoding="utf-8") as f:
        css = f.read()
    doc2 = doc.replace("</head>", f"<style>{css}</style></head>", 1)
    doc2 = doc2.replace("</body>", _MEASURE_JS + "</body>", 1)
    tmp = tempfile.NamedTemporaryFile("w", suffix=".html", dir=base, delete=False,
                                      encoding="utf-8")
    try:
        tmp.write(doc2)
        tmp.close()
        from pathlib import Path
        cmd = [browser, "--headless", "--disable-gpu", "--no-sandbox",
               "--dump-dom", Path(tmp.name).as_uri()]
        res = subprocess.run(cmd, capture_output=True, timeout=180)
        dom = (res.stdout or b"").decode("utf-8", "ignore")
    except Exception:
        return None, []
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass
    mm = _re.search(r'id="layout-report">(\[.*?\])</div>', dom, _re.S)
    if not mm:
        return None, []
    try:
        rows = [(r["page"], r["over"], r["wide"]) for r in _json.loads(mm.group(1))]
    except Exception:
        return None, []
    bad = [r for r in rows if r[1] > 0 or r[2] > 0]
    return (not bad), rows


def render_pdf_weasy(doc, css_path, base, pdf_path):
    rendered = HTML(string=doc, base_url=base).render(stylesheets=[CSS(filename=css_path)])
    actual = len(rendered.pages)
    rendered.write_pdf(pdf_path)
    return actual


def render_pdf_browser(doc, css_path, base, pdf_path):
    """Edge/Chrome headless print-to-PDF. Returns the page count read from
    the PDF, or -1 when the file does not expose it to a plain scan."""
    import re as _re
    import subprocess
    import tempfile
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
    with open(css_path, encoding="utf-8") as f:
        css = f.read()
    doc2 = doc.replace("</head>", f"<style>{css}</style></head>", 1)
    tmp = tempfile.NamedTemporaryFile("w", suffix=".html", dir=base, delete=False,
                                      encoding="utf-8")
    try:
        tmp.write(doc2)
        tmp.close()
        from pathlib import Path
        url = Path(tmp.name).as_uri()
        cmd = [browser, "--headless", "--disable-gpu", "--no-sandbox",
               "--no-pdf-header-footer", "--print-to-pdf-no-header",
               f"--print-to-pdf={pdf_path}", url]
        res = subprocess.run(cmd, capture_output=True, timeout=240)
        if not os.path.exists(pdf_path) or os.path.getsize(pdf_path) < 10000:
            err = (res.stderr or b"").decode("utf-8", "ignore")[-400:]
            sys.exit("ERROR: Edge/Chrome could not print the PDF.\n"
                     f"  Engine: {browser}\n  Said: {err}\n"
                     "  Nothing has been sent.")
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass
    raw = open(pdf_path, "rb").read()
    counts = _re.findall(rb"/Count\s+(\d+)", raw)
    return max(int(c) for c in counts) if counts else -1


# =====================================================================
# MAIN
# =====================================================================

def build(write_html=None):
    """Load, compute, build. Returns (m, doc, pages). Shared with the email."""
    ctx = ge.load()
    m = ge.compute(ctx)
    _ASAT_DT[0] = m["asat"]
    gen_s = datetime.now().strftime("%d %b %Y %H:%M")
    asat_s = m["asat"].strftime("%d %b %Y %H:%M")
    doc, pages = build_html(m, CONFIG, gen_s, asat_s)
    if write_html:
        with open(write_html, "w", encoding="utf-8") as f:
            f.write(doc)
    return m, doc, pages, gen_s, asat_s


def main():
    cfg = CONFIG
    here = ampol_paths.suite_dir()
    print("=" * 68)
    print("COATES K2-STYLE PDF - AMPOL GAS MONITOR OPERATIONS")
    print("=" * 68)
    m, doc, pages, gen_s, asat_s = build()
    print(f"RENTAL_STOCK export  : {m['sources']['rental_stock']}")
    print(f"TRANSACTIONS export  : {m['sources']['transactions']}")
    ge.print_summary(m)

    css_path = os.path.join(here, cfg["css_name"])
    if not os.path.exists(css_path):
        sys.exit(f"ERROR: {cfg['css_name']} is missing from the suite folder.\n"
                 f"  Looked for: {css_path}\n"
                 "  It carries the Coates house style - keep the suite together.")
    pdf_path = os.path.join(ampol_paths.day_folder("Gas_Monitors"), cfg["pdf_name"])
    # the movement scoreboard: today's figures, so tomorrow can show the change
    rh.record("gas", m["asat"], {
        "fleet": m["fleet_total"], "available": m["available"], "crew_out": m["crew_out"],
        "overdue": m["outstanding"], "overdue_30": m["out_30"], "exposure": m["exposure"],
        "repairs": m["repairs"], "health": m["health"], "same_day_30": m["d30"]["sd_pct"],
        "yday_draws": m["yday_draws"], "yday_not_same_day": m["yday_nsd"],
        "custody": m["custody_total"]})
    print(f"History              : {rh.HIST.name} - gas figures recorded for {m['asat'].strftime('%d %b %Y')}")
    # the phone-sized position card - the same page-1 figures as an image
    card_path = os.path.join(ampol_paths.day_folder("Gas_Monitors"), cfg["card_name"])
    band = rag_band_gas(m)
    status = "red" if 'ragband rd' in band else "amber" if 'ragband a' in band else "green"
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
        f"Appendix A to each supervisor by {(m['asat'] + timedelta(days=2)).strftime('%d %b %Y')}"),
        [("Tool availability", m["score_availability"]), ("Same-day returns, 30 days", m["score_sameday"]),
         ("Repairs", m["score_repairs"]), ("30+ day control", m["score_30"])],
        card_path, f"Counted from the SiteIQ exports of {asat_s} - nothing estimated. Health {hs}/100.")
    print(f"Position card        : {card_path}")

    # Measure every page in the browser BEFORE printing - a chart that does
    # not fit is dropped silently by the print engine, page count intact.
    ok, rows = layout_check(doc, css_path, here)
    if ok is None:
        print("Fit check            : could not measure (no browser) - relying on the page count")
    elif ok:
        worst = max((r[1] for r in rows), default=-9999)
        print(f"Fit check            : PASS - every page's content sits above its footer "
              f"(tightest page has {-worst}px to spare)")
    else:
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

    actual = None
    if _HAVE_WEASY:
        try:
            actual = render_pdf_weasy(doc, css_path, here, pdf_path)
            print("PDF engine           : WeasyPrint")
        except Exception as e:
            print(f"PDF engine           : WeasyPrint failed at render time "
                  f"({type(e).__name__}) - falling back to Edge/Chrome")
            actual = None
    if actual is None:
        actual = render_pdf_browser(doc, css_path, here, pdf_path)
        print("PDF engine           : Edge/Chrome headless (no installs needed)")

    # Each page is authored as one fixed A4 box; if content overflows, the
    # renderer splits it, the orange frame breaks and the footer drops off.
    if actual == -1:
        print(f"Layout check         : page count not readable from this PDF - "
              f"authored {pages} pages; open it and confirm the last page is page {pages}")
    elif actual != pages:
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
    print(f"Pages                : {pages}")
    print(f"PDF written          : {pdf_path}  ({os.path.getsize(pdf_path):,} bytes)")
    print("")
    print("NEXT STEP: open the PDF, read the position page and the data page, then send it.")
    print("Done. The Coates Way - consistent execution, every day.")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(f"ERROR: {e}")
