#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
COATES - AMPOL GAS MONITOR OPERATIONS - OUTLOOK EMAIL (HOUSE STYLE)
SiteIQ exports in -> ready-to-send .eml in the K2 look
=====================================================================
Author: Andrew Fisher
The Coates Way - Operational Excellence - POWERED BY SITEIQ

WHAT THIS IS
  The daily email in the Coates house style: an Outlook-safe .eml draft
  (X-Unsent) with the report in the body, the house-style PDF and the
  workbook attached, and the distribution list already on it. Nothing
  sends itself.

OUTLOOK-SAFE MEANS
  Outlook renders with Word's engine, so the body is tables and inline
  styles only - no SVG, no flexbox, no CSS positioning, no web fonts.
  Every chart is drawn with Pillow and embedded as a PNG.

WHERE THE NUMBERS COME FROM (changed 02 Sep 2026)
  gasmon_engine - the same engine as the PDF, counted from the SiteIQ
  RENTAL_STOCK and TRANSACTIONS exports. The email, the PDF and the
  console can never disagree.

USAGE
  01_RUN_GAS_MONITOR_REPORT.bat runs this after the PDF so the PDF can
  be attached. Or on its own:  python generate_k2style_email.py
=====================================================================
"""

import json
import os
import shutil
import sys
from datetime import datetime
from email.message import EmailMessage
from email.utils import formatdate

try:
    import gasmon_engine as ge
    import generate_k2style_gas_monitor_report as k2
    import generate_v18_gas_monitor_report as v18
    import k2shell as sh
except ImportError as e:
    sys.exit(f"ERROR: a suite script is missing ({e}).\n"
             "  Keep the suite folder together and press the gas monitor"
             " button again.")

import ampol_paths

from k2shell import (esc, money, num, K, FONT, esect, ecallout, eo, enote, esubh,
                     epanel, etiles, edtable, s2, score_bar_row, alerts_panel,
                     rule_png, donut_png, band_png, hours_png, line_png, hbars_png,
                     combo_png, stacked_hbars_png)

CONFIG = {
    "eml_name": "Coates_Ampol_GasMonitor_Operations_OUTLOOK_SAFE.eml",
    "html_name": "Coates_Ampol_GasMonitor_Operations_EMAIL.html",
    "attach_pdf": True,       # attach the house-style PDF when it exists
    # WHY (02 Sep 2026): off by default. The workbook's summary tab is what
    # the old report quoted and what raised the accuracy questions - sending
    # it beside a PDF that counts differently reopens them. Flip to True to
    # attach it when it is in Data\.
    "attach_workbook": False,
    "width": 1000,            # email body width in px
}

GREY = "#5F7183"
PALE_BLUE = "#7FB3D5"
DEEP_RED = "#F0603E"


def col_pct(p):
    return "#16A34A" if p >= 85 else "#D9880B" if p >= 70 else "#DC2626"


def red(s):
    return f'<span style="color:#DC2626;font-weight:bold;">{s}</span>'


def dim(s):
    return f'<span style="color:#98A6B4;">{s}</span>'


def tagx(text):
    return (f' <span style="{FONT}display:inline-block;font-size:9px;font-weight:bold;'
            f'letter-spacing:1px;text-transform:uppercase;background-color:#FDE8E8;'
            f'color:#C81E1E;padding:1px 5px;">{esc(text)}</span>')


# =====================================================================
# the email body
# =====================================================================

def build_email_html(m, gen_s, asat_s, cfg):
    W = CONFIG["width"]
    CW = W - 48
    R = m["rules"]
    tgt = R["availability_target"]
    hs = m["health"]
    d30, ytd = m["d30"], m["ytd"]
    asat_t = m["asat"].strftime("%H:%M")
    parts = []

    # ---------- header -------------------------------------------------
    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td bgcolor="#1A2430" style="padding:22px 24px 19px 24px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td>
<div style="{FONT}font-size:11px;font-weight:bold;letter-spacing:2.5px;color:#F36F21;text-transform:uppercase;">{esc(cfg['kicker'])}</div>
<div style="{FONT}font-size:28px;font-weight:bold;color:#FFFFFF;padding-top:8px;">{esc(cfg['client'])} {esc(cfg['title'])}</div>
<div style="{FONT}font-size:13px;color:#A7B6C4;padding-top:7px;">{esc(cfg['project'])}</div>
</td>
<td width="185" align="right" style="vertical-align:top;">
<div style="{FONT}font-size:11px;font-weight:bold;letter-spacing:1.5px;color:#FFFFFF;">POWERED BY <span style="color:#F36F21;">SITEIQ</span></div>
<div style="{FONT}font-size:11.5px;color:#8395A6;padding-top:5px;">Equipped for anything</div>
</td></tr></table>
<div style="{FONT}font-size:11px;color:#8395A6;padding-top:10px;line-height:1.6;">Generated: <b style="color:#FFFFFF;">{esc(gen_s)}</b> &nbsp;|&nbsp; Position as at: <b style="color:#FFFFFF;">{esc(asat_s)}</b> (SiteIQ register pull) &nbsp;|&nbsp; Author: <b style="color:#FFFFFF;">Andrew Fisher</b></div>
</td></tr></table>""")

    key_cols = {"orange": "#F36F21", "blue": "#2F7FD0", "amber": "#E0930F", "green": "#16A34A"}
    key_bits = "&nbsp;&nbsp;".join(
        f'<span style="color:{key_cols[c]};">&#9679; <b>{esc(t)}</b></span> '
        f'<span style="color:#7A8A9A;">{esc(x)}</span>' for c, t, x in cfg["key_items"])
    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="{FONT}font-size:10px;padding:12px 2px 8px 2px;line-height:1.9;">
<span style="color:#8A9AAC;font-weight:bold;letter-spacing:1.5px;">KEY</span>&nbsp;&nbsp;{key_bits}</td></tr>
<tr><td>{rule_png(CW)}</td></tr></table>""")

    # ---------- position + scorecard -----------------------------------
    parts.append(ecallout(
        f'<span style="color:#D95F14;font-weight:bold;text-transform:uppercase;">The position at {asat_t}, '
        f'{m["asat"].strftime("%d %b %Y")}.</span> <b>{num(m["fleet_total"])} monitors</b> on the Ampol '
        f'register: {eo(num(m["available"]) + " on the shelf")}, <b>{num(m["crew_out"])} out to crew</b> '
        f'({num(m["out_today"])} went out today and {eo(num(m["outstanding"]) + " are overdue")} from earlier '
        f'days), {num(m["custody_total"])} held in custody (FCCU turnaround, Operations, Future Fuels and the '
        f'after-hours account), and <b>{num(m["repairs"])} in the Dräger repair queue</b>. Every figure is '
        f'counted from the SiteIQ RENTAL_STOCK and TRANSACTIONS exports - nothing is read from a summary '
        f'cell and nothing is estimated.'))
    srows = "".join([
        score_bar_row("Tool availability", m["score_availability"],
                      f'{num(m["available"])} on the shelf against a {num(tgt)}-unit target for a full score'),
        score_bar_row("Same-day returns, last 30 days", m["score_sameday"],
                      f'{d30["sd_pct"]}% of {num(d30["draws"])} crew draws came back the day they went out '
                      f'({esc(m["d30_label"])})'),
        score_bar_row("Repairs", m["score_repairs"],
                      f'100 less the {m["fleet_impact_pct"]}% of fleet in the repair queue '
                      f'({num(m["repairs"])} of {num(m["fleet_total"])})'),
        score_bar_row("30+ day control", m["score_30"],
                      f'100 less 3 per monitor overdue 30 days or more ({num(m["out_30"])} out)'),
    ])
    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;"><tr>
<td width="200" align="center" style="vertical-align:top;padding-top:6px;">
{donut_png(hs, sh.health_hex(hs), f"{hs}%", sh.health_word(hs))}
<div style="{FONT}font-size:10.5px;color:#98A6B4;padding-top:8px;">Gas monitor health score</div></td>
<td style="vertical-align:top;padding-left:16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">{srows}</table></td>
</tr></table>
{enote(f'Health score is the plain average of the four scores - <b style="color:#16202C;">({m["score_availability"]} + {m["score_sameday"]} + {m["score_repairs"]} + {m["score_30"]}) &divide; 4 = {hs}</b>. The shelf count is a {asat_t} snapshot - the store empties every morning and refills every afternoon.')}""")

    seg = [("Out to crew", m["crew_out"], K["orange"]), ("FCCU", m["fccu"], K["blue"]),
           ("Ops", m["ops"], K["amber"]), ("Future Fuels", m["ff"], K["lime"]),
           ("After hours", m["afterhours"], PALE_BLUE), ("Available", m["available"], K["green"]),
           ("Repairs", m["repairs"], K["red"])]
    parts.append(esubh("The fleet at a glance - where every monitor is"))
    parts.append(epanel(band_png([s for s in seg if s[1] > 0], CW - 28)))
    parts.append(etiles([
        (num(m["fleet_total"]), "Total fleet", "on the Ampol register", "#7A8A9A"),
        (num(m["available"]), "Available now", f"ready for issue at {asat_t}",
         "#22C55E" if m["available"] >= tgt else "#EFA82B"),
        (num(m["crew_out"]), "Out to crew", f'{num(m["out_today"])} today + {num(m["outstanding"])} overdue', "#7A8A9A"),
        (num(m["outstanding"]), "Overdue 1+ days", f'{num(m["out_30"])} at 30+ days, {money(m["exposure"])}',
         "#F0603E" if m["outstanding"] else "#22C55E"),
    ]))

    # ---------- where the numbers come from --------------------------------
    ws_, we_ = m["tx_window"]
    d90 = m["d90"]
    parts.append(esect("Where these numbers come from"))
    parts.append(ecallout(
        f'Two SiteIQ exports, pulled together on <b>{m["asat"].strftime("%d %b %Y")}</b>, are the only inputs. '
        f'<b>RENTAL_STOCK</b> is the register - what is on hire, to whom, and what is on the shelf at '
        f'{asat_t}. <b>TRANSACTIONS</b> is the movement log - every scan out and scan in since '
        f'{ws_.strftime("%d %b %Y %H:%M")}, one row per monitor per draw with a transaction ID. The store '
        f'scans twice out and twice in, so a row only exists when a monitor crossed the counter. Nothing '
        f'is typed in or read from a summary cell; the Excel workbook is not used. A draw is one monitor to '
        f'one named person once, which is why the yearly count is large - the behaviour measure is the '
        f'percentage back the same day.', tight=True))

    def wrow(label, dates, f):
        return [f"<b>{esc(label)}</b>", esc(dates), num(f["draws"]),
                f'{num(f["same_day"])} {dim(str(f["sd_pct"]) + "%")}',
                f'<b>{num(f["not_same_day"])}</b> {dim(str(f["nsd_pct"]) + "%")}',
                num(f["people"]), num(f["companies"])]
    y_nsd_pct = f'{100 - m["yday_sd_pct"]:.1f}%'
    parts.append(edtable(["Window", "Dates", "Crew draws", "Back same day", "Not same day", "People", "Companies"], [
        wrow("Year to date", m["ytd_label"], ytd),
        wrow("Last 3 months", m["d90_label"], d90),
        wrow("Last 30 days", m["d30_label"], d30),
        ["<b>Yesterday</b>", esc(m["yesterday"].strftime("%a %d %b %Y")), num(m["yday_draws"]),
         f'{num(m["yday_draws"] - m["yday_nsd"])} {dim(str(m["yday_sd_pct"]) + "%")}',
         f'<b>{num(m["yday_nsd"])}</b> {dim(y_nsd_pct)}',
         num(m["yday_people"]), num(m["yday_companies"])],
    ], ["", "", "r", "r", "r", "r", "r"]))
    ss = m["serial_stats"]
    parts.append(enote(
        f'Crew draws exclude the custody and workflow accounts ({num(m["tx_accounts"])} of the '
        f'{num(m["tx_all"])} gas monitor rows this year). Barcode is the identity SiteIQ scans; '
        f'{num(ss["with"])} of the {num(ss["fleet"])} monitors on the register carry a serial on the '
        f'serial list. Full rules and the reconciliation between the two exports are on the data page of the PDF.'))

    # ---------- yesterday ------------------------------------------------
    yd = m["yesterday"]
    parts.append(esect("Yesterday - did they come back?"))
    parts.append(ecallout(
        f'On <b>{yd.strftime("%A %d %b")}</b>, <b>{num(m["yday_draws"])} monitors</b> went out to crew. '
        f'{eo(num(m["yday_nsd"]) + " were not back by the end of the day")} ({m["yday_sd_pct"]}% same day). '
        f'{num(m["yday_recovered"])} have come back since; {eo(num(m["yday_still_out"]) + " are still out")} '
        f'as at {asat_t} and are named below - the prestart chase list.', tight=True))
    parts.append(etiles([
        (num(m["yday_draws"]), "Crew draws yesterday", yd.strftime("%a %d %b"), "#7A8A9A"),
        (num(m["yday_nsd"]), "Not back same day", f'{100 - m["yday_sd_pct"]:.1f}% of draws',
         "#EFA82B" if m["yday_nsd"] else "#22C55E"),
        (num(m["yday_recovered"]), "Recovered since", f'{m["yday_recovery_pct"]}% of the non-returns',
         "#22C55E" if m["yday_recovery_pct"] >= 50 else "#EFA82B"),
        (num(m["yday_still_out"]), "Still out now", "same person, named below",
         "#F0603E" if m["yday_still_out"] else "#22C55E"),
    ]))
    yrows = []
    for c in m["yday_by_company"]:
        who = ", ".join(f"{esc(p)} ({k})" for p, k in c["people_open"])
        if not c["open"]:
            who = dim("all back - " + ", ".join(esc(p) for p, _ in c["people"][:4]))
        yrows.append([esc(c["name"]), num(c["nsd"]),
                      f'<span style="color:#16A34A;font-weight:bold;">{num(c["recovered"])}</span>' if c["recovered"] else dim("0"),
                      red(num(c["open"])) if c["open"] else dim("0"), who])
    if not yrows:
        yrows = [['<span style="color:#16A34A;font-weight:bold;">Every monitor issued yesterday came back the same day.</span>', "", "", "", ""]]
    parts.append(edtable(["Company", "Not back", "Recovered", "Still out", "Who still has them (units)"],
                         yrows, ["", "r", "r", "r", ""]))

    al = []
    if m["yday_still_out"]:
        al.append(("#F0603E", f'{num(m["yday_still_out"])} monitors from yesterday still out',
                   "Named above. A monitor out overnight has missed its bump test - safety conversation first."))
    if m["out_30"]:
        al.append(("#F0603E", f'{num(m["out_30"])} monitors overdue 30 days or more',
                   f'{money(m["exposure"])} exposure at {money(R["charge_per_unit"])} per unit. Recovery '
                   f'conversation, not a debt notice - every unit is named in the PDF appendix.'))
    if m["out_8_29"]:
        al.append(("#EFA82B", f'{num(m["out_8_29"])} monitors overdue 8-29 days',
                   "The follow-up window - these become 30+ if nobody rings."))
    if m["repairs"]:
        al.append(("#EFA82B", f'{num(m["repairs"])} monitors in the Dräger repair queue',
                   f'Largest category {esc(m["repair_top"])}. {m["fleet_impact_pct"]}% of the fleet unavailable.'))
    if m["available"] < tgt:
        al.append(("#3D8BD4", f'{num(m["available"])} on the shelf against a {num(tgt)}-unit target',
                   "Availability keeps work fronts moving - pull recovery forward."))
    parts.append(alerts_panel(al))

    # ---------- people, last 30 days -------------------------------------
    lg = [x for x in m["league"] if x["d30_nsd"] > 0][:12]
    lrows = []
    for x in lg:
        lrows.append([
            s2(esc(x["name"]) + (tagx("repeat") if x["repeat"] else ""), esc(x["co"])),
            num(x["d30_draws"]), f'<b>{num(x["d30_nsd"])}</b>',
            f'<span style="color:{col_pct(x["d30_sd_pct"])};font-weight:bold;">{x["d30_sd_pct"]}%</span>',
            s2(num(x["d90_nsd"]), f'of {num(x["d90_draws"])} · {x["d90_sd_pct"]}% same day'),
            s2(num(x["ytd_nsd"]), f'of {num(x["ytd_draws"])} · {x["ytd_sd_pct"]}% same day'),
            red(num(x["open_now"])) if x["open_now"] else dim("0")])
    parts.append(esect("Who is not bringing them back - last 30 days"))
    parts.append(ecallout(
        f'Between <b>{esc(m["d30_label"])}</b>, <b>{num(m["people_active_30"])} people</b> drew a monitor. '
        f'{eo(num(m["people_with_nsd_30"]))} kept at least one past the day it went out, and '
        f'{eo(num(len(m["repeat_offenders"])))} did so in {R["repeat_weeks"]} or more separate weeks - a habit, '
        f'not a bad day. Ranked by non-returns in the last 30 days; year to date alongside.', tight=True))
    parts.append(edtable(["Who", "Draws 30d", "Not same day 30d", "Same-day % 30d", "Last 3 months", "Year to date", "Still out"],
                         lrows, ["", "r", "r", "r", "r", "r", "r"]))
    parts.append(enote(
        f'Named people only - custody and workflow accounts are reported on their own lines. "Not same day" = '
        f'not scanned back on the calendar day it went out (a draw after {R["night_shift_from"].strftime("%H:%M")} '
        f'counts as same day if back by {R["night_shift_back_by"].strftime("%H:%M")} next morning). '
        f'The full list is in the PDF.'))

    # ---------- companies, last 30 days ----------------------------------
    comps = [c for c in m["companies"] if c["d30_draws"] > 0]
    crows = []
    for c in comps[:10]:
        names = ", ".join(f"{esc(p)} ({k})" for p, k in c["d30_top"][:3])
        crows.append([esc(c["name"]), num(c["d30_draws"]), f'<b>{num(c["d30_nsd"])}</b>',
                      f'<span style="color:{col_pct(c["d30_sd_pct"])};font-weight:bold;">{c["d30_nsd_pct"]}%</span>',
                      (f'<span style="color:{col_pct(c["d90_sd_pct"])};font-weight:bold;">{c["d90_nsd_pct"]}%</span>' if c["d90_draws"] else dim("-")),
                      f'<span style="color:{col_pct(c["ytd_sd_pct"])};font-weight:bold;">{c["ytd_nsd_pct"]}%</span>',
                      num(c["d30_people"]), red(num(c["open_now"])) if c["open_now"] else dim("0"),
                      names or dim("-")])
    parts.append(esect("By company - the last 30 days against the year"))
    parts.append(ecallout(
        f'{eo(num(d30["not_same_day"]))} of <b>{num(d30["draws"])}</b> crew draws in the last 30 days '
        f'({d30["nsd_pct"]}%) were not back on the day they went out, across <b>{num(d30["companies"])} '
        f'companies</b>. The 30-day rate against the year-to-date rate shows who is improving.', tight=True))
    parts.append(edtable(["Company", "Draws 30d", "Not same day", "Rate 30d", "Rate 3 mo", "Rate YTD", "People", "Still out",
                          "Top non-returners, last 30 days (units)"],
                         crows, ["", "r", "r", "r", "r", "r", "r", "r", ""]))
    parts.append(epanel(hbars_png([(c["name"], c["d30_nsd"]) for c in comps[:10]], CW - 28, K["amber"])))

    # ---------- the year in context -------------------------------------
    mon = m["monthly"]
    parts.append(esect("The year so far - volume and behaviour by month"))
    parts.append(ecallout(
        f'Since <b>{m["tx_window"][0].strftime("%d %b")}</b>, crews have drawn a monitor <b>{num(ytd["draws"])} '
        f'times</b> - about {num(ytd["per_working_day"])} a working day - and {eo(str(ytd["sd_pct"]) + "%")} '
        f'came back the same day. The last 30 days ran at {eo(str(d30["sd_pct"]) + "%")} on {num(d30["draws"])} '
        f'draws. Bars are monthly draws; the line is the share back the same day'
        f'{" - the last bar is a part month" if mon and mon[-1]["partial"] else ""}.', tight=True))
    parts.append(epanel(combo_png([x["label"] for x in mon], [x["draws"] for x in mon],
                                  [x["sd_pct"] for x in mon], CW - 28,
                                  partial_last=bool(mon and mon[-1]["partial"]))))
    parts.append(etiles([
        (num(ytd["draws"]), "Crew draws, year to date", esc(m["ytd_label"]), "#7A8A9A"),
        (f'{ytd["sd_pct"]}%', "Same day, year to date", f'{num(ytd["not_same_day"])} not back same day', col_pct(ytd["sd_pct"])),
        (num(d30["draws"]), "Crew draws, last 30 days", esc(m["d30_label"]), "#7A8A9A"),
        (f'{d30["sd_pct"]}%', "Same day, last 30 days", f'{num(d30["not_same_day"])} not back same day', col_pct(d30["sd_pct"])),
    ]))
    wk = m["weekly"]
    parts.append(esubh("Same-day return rate by week", "&mdash; every week of the year"))
    parts.append(epanel(line_png([w["label"] if i % 2 == 0 else "" for i, w in enumerate(wk)],
                                 [{"vals": [w["pct"] for w in wk], "colour": K["green"],
                                   "label": "Same-day %", "fill": True}], CW - 28, pct=True)))

    # ---------- where they are now ---------------------------------------
    where = m["where"]
    top = sorted(where, key=lambda w2: -w2["total"])[:10]
    parts.append(esect("Where the monitors are right now - by company"))
    parts.append(ecallout(
        f'<b>{num(m["crew_out"])} monitors</b> are out to crew: {num(m["out_today"])} went out today and are on '
        f'their normal cycle; {eo(num(m["outstanding"]) + " are overdue")} - {num(m["out_1"])} since yesterday, '
        f'{num(m["out_2_7"])} for 2-7 days, {num(m["out_8_29"])} for 8-29 days and '
        f'{eo(num(m["out_30"]) + " for 30 days or more")}. Custody holdings sit outside the crew count: '
        f'FCCU {num(m["fccu"])}, Operations {num(m["ops"])}, Future Fuels {num(m["ff"])}, after-hours '
        f'account {num(m["afterhours"])}.', tight=True))
    parts.append(epanel(stacked_hbars_png(
        [(w2["name"], [w2["today"], w2["d1"], w2["d2_7"], w2["d8_29"], w2["d30"]]) for w2 in top],
        [("Out today", GREY), ("1 day", K["amber"]), ("2-7 days", K["orange"]),
         ("8-29 days", DEEP_RED), ("30+ days", K["red"])], CW - 28)))
    wrows = []
    for w2 in sorted(where, key=lambda x: (-x["d30"], -x["outstanding"], -x["total"]))[:10]:
        uc = {"Critical": "#DC2626", "High": "#D9880B", "Watch": "#16A34A", "Clear": "#98A6B4"}.get(w2["urgency"], "#26313D")
        wrows.append([esc(w2["name"]), num(w2["today"]), num(w2["d1"]) if w2["d1"] else dim("0"),
                      num(w2["d2_7"]) if w2["d2_7"] else dim("0"), num(w2["d8_29"]) if w2["d8_29"] else dim("0"),
                      red(num(w2["d30"])) if w2["d30"] else dim("0"),
                      f'<b>{num(w2["outstanding"])}</b>' if w2["outstanding"] else dim("0"),
                      money(w2["exposure"]) if w2["exposure"] else dim("$0"),
                      f'<span style="color:{uc};font-weight:bold;">{esc(w2["urgency"])}</span>'])
    parts.append(edtable(["Company", "Today", "1 day", "2-7d", "8-29d", "30+d", "Overdue", "Exposure", "Urgency"],
                         wrows, ["", "r", "r", "r", "r", "r", "r", "r", ""]))

    # ---------- 30+ named --------------------------------------------------
    items30 = [x for x in m["outstanding_items"] if x["days"] >= 30]
    parts.append(esect(f"Overdue 30 days or more - named, oldest first ({num(len(items30))} units)"))
    if items30:
        parts.append(edtable(["Out", "Since", "Who", "Company", "Asset", "Serial", "Charge"],
                             [[red(f'{x["days"]}d'), esc(x["on_dt"].strftime("%d %b %Y")) if x["on_dt"] else "",
                               esc(x["who"]), esc(x["co"]), esc(x["bc"]), esc(x["serial"]) or dim("-"),
                               money(x["cost"])] for x in items30],
                             ["r", "", "", "", "", "", "r"]))
    else:
        parts.append(enote("Nothing overdue 30 days or more."))
    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="{FONT}font-size:13px;font-weight:bold;color:#16202C;padding:12px 10px;border-bottom:1px solid #E8EBEF;">Replacement charge exposure - {num(m['out_30'])} units at 30 days or more</td>
<td align="right" style="padding:12px 10px;border-bottom:1px solid #E8EBEF;"><span style="{FONT}background-color:#FFF35C;font-size:13px;font-weight:bold;color:#16202C;padding:3px 8px;">{money(m['exposure'])}</span></td></tr></table>
{enote(f'{money(R["charge_per_unit"])} per unit, the replacement charge from the Ampol gas monitor workbook. The full overdue list ({num(m["outstanding"])} units, oldest first) is Appendix A of the attached PDF.')}""")

    # ---------- repairs -------------------------------------------------
    stale = m["repair_stale"]
    parts.append(esect("Out of service - the Dräger repair queue"))
    parts.append(ecallout(
        f'<b>{num(m["repairs"])} monitors</b> in the repair queue - {eo(str(m["fleet_impact_pct"]) + "%")} of the '
        f'fleet a crew cannot take. Largest category <b>{esc(m["repair_top"])}</b>.'
        + (f' {eo(str(len(stale)))} units have sat there {R["stale_repair_days"]} days or more - the oldest '
           f'{num(stale[0]["days"])} days: a repair-or-replace call.' if stale else ''), tight=True))
    parts.append(epanel(hbars_png(m["repair_cats"], CW - 28, K["orange"])))

    # ---------- footer ---------------------------------------------------
    team_line = " &middot; ".join(
        f'<b style="color:#16202C;">{esc(p["name"])}</b> <span style="color:#8A9AAC;">{esc(p["role"])}</span>'
        for p in cfg["team"])
    vt = v18.CONFIG
    ws, we = m["tx_window"]
    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:26px;">
<tr><td style="border-top:1px solid #E4E8EC;padding-top:10px;">
<div style="{FONT}font-size:10px;font-weight:bold;letter-spacing:2px;color:#F36F21;text-transform:uppercase;">Your Coates Tool Store Team</div>
<div style="{FONT}font-size:11px;color:#8A9AAC;padding-top:5px;line-height:1.7;">{team_line}</div>
<div style="{FONT}font-size:10px;color:#98A6B4;padding-top:9px;line-height:1.7;">
Coates Hire &middot; 340 Curtin Ave W, Eagle Farm, QLD 4009 &middot; {esc(vt["author_email"])} &middot; {esc(vt["author_mobile"])}<br>
Sources: SiteIQ RENTAL_STOCK (position as at {esc(asat_s)}) and TRANSACTIONS (issues {ws.strftime('%d %b %H:%M')} to {we.strftime('%d %b %Y %H:%M')}, returns to the pull). Every figure is counted from those two exports and the two are reconciled against each other on every build - see the data page of the PDF. The Coates Way - consistent execution, every day. <b style="color:#16202C;">POWERED BY SITEIQ</b></div>
</td></tr></table>""")

    body = "".join(f'<tr><td style="padding:0 24px;">{p}</td></tr>'
                   if not p.startswith('<table role="presentation" width="100%" cellspacing="0" cellpadding="0">\n<tr><td bgcolor="#1A2430"')
                   else f'<tr><td>{p}</td></tr>' for p in parts)
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Coates {esc(cfg['client'])} {esc(cfg['title'])} - {esc(asat_s)}</title></head>
<body bgcolor="#EEF1F4" style="margin:0;padding:0;background-color:#EEF1F4;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#EEF1F4">
<tr><td align="center" style="padding:18px 10px;">
<table role="presentation" width="{W}" cellspacing="0" cellpadding="0" bgcolor="#FFFFFF" style="width:{W}px;max-width:{W}px;">
<tr><td height="6" bgcolor="#F36F21" style="font-size:0;">&nbsp;</td></tr>
{body}
<tr><td height="24" style="font-size:0;">&nbsp;</td></tr>
</table></td></tr></table></body></html>"""


# =====================================================================
# MAIN
# =====================================================================

def main():
    cfg = k2.CONFIG
    vt = v18.CONFIG
    out_dir = ampol_paths.day_folder("Gas_Monitors")
    print("=" * 68)
    print("COATES HOUSE-STYLE EMAIL - AMPOL GAS MONITOR OPERATIONS")
    print("=" * 68)

    ctx = ge.load()
    m = ge.compute(ctx)
    gen_s = datetime.now().strftime("%d %b %Y %H:%M")
    asat_s = m["asat"].strftime("%d %b %Y %H:%M")
    ge.print_summary(m)

    html = build_email_html(m, gen_s, asat_s, cfg)
    html_path = os.path.join(out_dir, CONFIG["html_name"])
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"HTML written         : {html_path}  ({len(html):,} bytes)")

    weekday = datetime.now().strftime("%A")
    date_str = datetime.now().strftime("%d %B %Y").lstrip("0")
    subject = f"{vt['subject_prefix']} - {weekday} {date_str}"
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["To"] = ", ".join(vt["recipients"])
    msg["Date"] = formatdate(localtime=True)
    msg["X-Unsent"] = "1"
    msg.set_content("This report is best viewed in HTML. The PDF report is attached.\n")
    msg.add_alternative(html, subtype="html")

    attachments = []
    pdf_path = os.path.join(out_dir, cfg["pdf_name"])
    if CONFIG["attach_pdf"] and os.path.exists(pdf_path):
        with open(pdf_path, "rb") as f:
            msg.add_attachment(f.read(), maintype="application", subtype="pdf",
                               filename=os.path.basename(pdf_path))
        attachments.append(os.path.basename(pdf_path))
        print(f"PDF attached         : {os.path.basename(pdf_path)}")
    else:
        print("PDF attached         : no (build the PDF first for the attachment)")

    # WHY (02 Sep 2026): the workbook is optional now - it is attached when it
    # is in Data\ (the detail tabs are handy) but the report no longer needs it.
    wb_path = v18.find_workbook_optional(vt)
    if CONFIG["attach_workbook"] and wb_path:
        with open(wb_path, "rb") as f:
            msg.add_attachment(f.read(), maintype="application",
                               subtype="vnd.ms-excel.sheet.macroenabled.12",
                               filename=os.path.basename(wb_path))
        wb_copy = os.path.join(out_dir, os.path.basename(wb_path))
        if os.path.abspath(wb_path) != os.path.abspath(wb_copy):
            shutil.copy2(wb_path, wb_copy)
        attachments.append(os.path.basename(wb_copy))
        print(f"Workbook attached    : {os.path.basename(wb_path)}")
    else:
        print("Workbook attached    : no - switched off in CONFIG (its summary tab is what")
        print("                       the old report quoted; the PDF carries the detail now)")

    eml_path = os.path.join(out_dir, CONFIG["eml_name"])
    with open(eml_path, "wb") as f:
        f.write(msg.as_bytes())
    print(f"EML written          : {eml_path}  ({os.path.getsize(eml_path):,} bytes)")

    manifest = {
        "subject": subject,
        "body": os.path.basename(html_path),
        "attachments": attachments,
        "to": "; ".join(vt["recipients"]),
    }
    man_path = os.path.join(out_dir, "Coates_Ampol_GasMonitor_Operations.draft.json")
    with open(man_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=1)
    print(f"Draft manifest       : {man_path}")
    print("")
    print("NEXT STEP: double-click the .eml, check it, press Send.")
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
