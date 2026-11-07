#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
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

OUTPUTS (03 Sep 2026 - one file-name rule, ampol_names.report_stem)
  Reports\<day>\Gas_Monitors\
    Coates_Ampol_Gas_Monitors_<DDMonYYYY>_OUTLOOK.eml   the draft
    Coates_Ampol_Gas_Monitors_<DDMonYYYY>_EMAIL.html    the body on its own
    Coates_Ampol_Gas_Monitors_<DDMonYYYY>.draft.json    the manifest button 08 reads
  Attached: the PDF and the position card on the same stem. The card is
  also inline under the header (a cid image), so the position shows on
  a phone before the PDF is opened.
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

import ampol_names
import ampol_options
import ampol_paths

from k2shell import (esc, money, num, K, FONT, esect, ecallout, eo, enote, esubh,
                     epanel, etiles, edtable, s2, score_bar_row, alerts_panel,
                     rule_png, donut_png, band_png, hours_png, line_png, hbars_png,
                     combo_png, stacked_hbars_png)

CONFIG = {
    # WHY (03 Sep 2026): file names come from ampol_names.report_stem("gas")
    # - the same stem as the PDF, so the attachment and the draft sit
    # together in the day's folder under one name.
    "attach_pdf": True,       # attach the house-style PDF when it exists
    "attach_card": True,      # the phone-sized position card (PNG) when it exists
    "inline_card": True,      # ... and show it in the body under the header (cid image)
    "inline_card_width": 420, # px, the card is 1080 x 1920 - a phone-sized panel
    # WHY (02 Sep 2026): off by default. The workbook's summary tab is what
    # the old report quoted and what raised the accuracy questions - sending
    # it beside a PDF that counts differently reopens them. Flip to True to
    # attach it when it is in Data\.
    "attach_workbook": False,
    "width": 1000,            # email body width in px
}

GREY = "#5B6472"
PALE_BLUE = "#5B6472"
DEEP_RED = "#D0342C"


def col_pct(p):
    return "#1E6B32" if p >= 85 else "#8A5300" if p >= 70 else "#D0342C"


def red(s):
    return f'<span style="color:#D0342C;font-weight:bold;">{s}</span>'


def dim(s):
    return f'<span style="color:#98A0AA;">{s}</span>'


def tagx(text):
    return (f' <span style="{FONT}display:inline-block;font-size:9px;font-weight:bold;'
            f'letter-spacing:1px;text-transform:uppercase;background-color:#FBE7E6;'
            f'color:#A32015;padding:1px 5px;">{esc(text)}</span>')


def month_combo_png(labels, bars, line, width, partial_last=False, h=460):
    """Monthly draws (bars, lower band, left axis) under the same-day line
    (upper band, right axis). WHY (07 Nov 2026, QA): the shared combo drew
    both on one band, so June's draw count sat under its percentage pill."""
    W, H = width * 2, h
    im, d = sh._panel(W, H)
    n = len(labels)
    if n < 1:
        return sh.img_tag(im, width, "chart")
    top, base, pl, pr = 64, H - 56, 96, 96
    slot = (W - pl - pr) / n
    bw = slot * 0.56
    bar_top = top + (base - top) * 0.40
    bmax = k2.nice_ceiling(max(bars) or 1, parts=2)
    lo = max(0, (int(min(line)) // 10) * 10 - 10)
    line_bot = top + (base - top) * 0.30
    fl, fv, fb = sh._font(18), sh._font(16), sh._font(17, True)
    for g in (0, 0.5, 1.0):
        y = base - (base - bar_top) * g
        d.line([(pl, y), (W - pr, y)], fill="#E6E9EE", width=1)
        t = num(int(bmax * g))
        d.text((pl - 12 - sh._tw(d, t, fv), y - 10), t, font=fv, fill="#5B6472")
    for g, pv in ((0, lo), (1, 100)):
        y = line_bot - (line_bot - top) * g
        d.text((W - pr + 12, y - 10), f"{pv}%", font=fv, fill="#2E7D44")
    xs = []
    for i, lab in enumerate(labels):
        x0 = pl + i * slot + (slot - bw) / 2
        bh = (base - bar_top) * bars[i] / bmax
        col = "#F26222" if not (partial_last and i == n - 1) else "#F7B08C"
        d.rectangle([x0, base - bh, x0 + bw, base], fill=col)
        if bars[i]:
            t = num(bars[i])
            d.text((x0 + bw / 2 - sh._tw(d, t, fv) / 2, base - bh - 24), t, font=fv, fill="#1D1D1B")
        lt = lab + (" (part)" if partial_last and i == n - 1 else "")
        d.text((x0 + bw / 2 - sh._tw(d, lt, fl) / 2, base + 12), lt, font=fl, fill="#5B6472")
        xs.append(x0 + bw / 2)

    def Y(pv):
        return line_bot - (line_bot - top) * ((pv - lo) / ((100 - lo) or 1))
    pts = [(xs[i], Y(line[i])) for i in range(n)]
    if n > 1:
        d.line(pts, fill="#409A55", width=5, joint="curve")
    for i, (x, y) in enumerate(pts):
        d.ellipse([x - 6, y - 6, x + 6, y + 6], fill="#409A55")
        t = f"{line[i]:.0f}%"
        d.text((x - sh._tw(d, t, fb) / 2, y - 32), t, font=fb, fill="#2E7D44")
    d.rectangle([pl, 18, pl + 18, 36], fill="#F26222")
    d.text((pl + 26, 14), "Crew draws (left axis)", font=fl, fill="#1D1D1B")
    d.ellipse([pl + 300, 19, pl + 316, 35], fill="#409A55")
    d.text((pl + 326, 14), "Same day % (right axis)", font=fl, fill="#1D1D1B")
    return sh.img_tag(im, width, "Crew draws and the same-day rate by month")


# =====================================================================
# the email body
# =====================================================================

def build_email_html(m, gen_s, asat_s, cfg, card_cid=""):
    """The Outlook-safe body. card_cid: the Content-ID of the inline
    position card, or "" for no inline image."""
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
<tr><td bgcolor="#1D1D1B" style="background:#1D1D1B;padding:18px 24px 16px 24px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td style="vertical-align:top;">
<div style="{FONT}font-size:17px;font-weight:bold;letter-spacing:5px;color:#FFFFFF;">COATES</div>
<div style="{FONT}font-size:7.5px;font-weight:bold;letter-spacing:2.5px;color:#9AA2AC;padding-top:3px;">EQUIPPED FOR ANYTHING</div>
</td>
<td align="right" style="vertical-align:top;">
<div style="{FONT}font-size:15px;font-weight:bold;color:#FFFFFF;">{esc(cfg['client'])} {esc(cfg['title'])}</div>
<div style="{FONT}font-size:10.5px;color:#9AA2AC;padding-top:4px;">{esc(cfg['project'])} &nbsp;&middot;&nbsp; <span style="color:#FFFFFF;font-weight:bold;">As at {esc(asat_s)}</span></div>
</td></tr></table>
</td></tr>
<tr><td height="3" bgcolor="#F26222" style="background:#F26222;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td bgcolor="#FFFFFF" style="padding:16px 2px 0 2px;">
<div style="{FONT}font-size:9px;font-weight:bold;letter-spacing:2.2px;color:#C8511A;text-transform:uppercase;">{esc(cfg['kicker'])}</div>
<div style="{FONT}font-size:10.5px;color:#5B6472;padding-top:6px;line-height:1.6;">Generated <b style="color:#1D1D1B;">{esc(gen_s)}</b> &nbsp;|&nbsp; Author: <b style="color:#1D1D1B;">Andrew Fisher</b> &nbsp;|&nbsp; POWERED BY <b style="color:#1D1D1B;">SITEIQ</b> &nbsp;|&nbsp; Every figure is counted from the SiteIQ exports named below - nothing is estimated.</div>
</td></tr></table>""")

    key_cols = {"orange": "#F26222", "blue": "#2F7FD0", "amber": "#C97A12", "green": "#1E6B32"}
    key_bits = "&nbsp;&nbsp;".join(
        f'<span style="color:{key_cols[c]};">&#9679; <b>{esc(t)}</b></span> '
        f'<span style="color:#5B6472;">{esc(x)}</span>' for c, t, x in cfg["key_items"])
    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="{FONT}font-size:10px;padding:12px 2px 8px 2px;line-height:1.9;">
<span style="color:#5B6472;font-weight:bold;letter-spacing:1.5px;">KEY</span>&nbsp;&nbsp;{key_bits}</td></tr>
<tr><td>{rule_png(CW)}</td></tr></table>""")

    # ---------- the position card, inline ----------------------------------
    # WHY (03 Sep 2026): the phone-sized card sits under the header so the
    # position reads on a phone before the PDF is opened. It is a cid part
    # of the .eml (no web fetch) and is attached as a file as well.
    if card_cid:
        cw = CONFIG["inline_card_width"]
        parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:14px;">
<tr><td align="center" style="padding:0;">
<img src="cid:{card_cid}" width="{cw}" alt="The position at {esc(asat_s)} on one card - also attached as a picture"
     style="display:block;width:{cw}px;max-width:{cw}px;height:auto;border:0;border-radius:10px;{FONT}font-size:12px;color:#5B6472;">
<div style="{FONT}font-size:10px;color:#98A0AA;padding-top:7px;line-height:1.6;">The position at {esc(asat_s)} on one card - the same figures as the position page (page 2) of the attached PDF.</div>
</td></tr></table>""")

    # ---------- position + scorecard -----------------------------------
    parts.append(ecallout(
        f'<span style="color:#C8511A;font-weight:bold;text-transform:uppercase;">The position at {asat_t}, '
        f'{m["asat"].strftime("%d %b %Y")}.</span> <b>{num(m["fleet_total"])} monitors</b> on the Ampol '
        f'register: {eo(num(m["available"]) + " on the shelf")}, <b>{num(m["crew_out"])} out to crew</b> '
        + (f'({num(m["out_today"])} went out today and {eo(num(m["outstanding"]) + " are overdue")} from earlier days)'
           if m["out_today"] else
           f'(none had gone out today when the register was pulled, so all {eo(num(m["outstanding"]) + " are overdue")} '
           f'from earlier days)')
        + f', {num(m["custody_total"])} held in custody accounts and <b>{num(m["repairs"])} in the Dräger repair queue</b> - '
        f'{num(m["on_hire_total"])} on hire in all. Every count is made from the SiteIQ register and movement-log '
        f'exports - nothing is read from a summary cell and nothing is estimated.'))
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
<div style="{FONT}font-size:10.5px;color:#98A0AA;padding-top:8px;">Gas monitor health score</div></td>
<td style="vertical-align:top;padding-left:16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">{srows}</table></td>
</tr></table>
{enote(f'Health score is the plain average of the four scores - <b style="color:#1D1D1B;">({m["score_availability"]} + {m["score_sameday"]} + {m["score_repairs"]} + {m["score_30"]}) &divide; 4 = {hs}</b>. The shelf count is a {asat_t} snapshot - the store empties every morning and refills every afternoon.')}""")

    seg = [("Out to crew", m["crew_out"], K["deep_amber"]), ("FCCU", m["fccu"], K["blue"]),
           ("Ops", m["ops"], "#8C96A3"), ("Future Fuels", m["ff"], K["slate"]),
           ("After hours", m["afterhours"], "#C9CED6"), ("Available", m["available"], K["green"]),
           ("Repairs", m["repairs"], K["red"])]
    parts.append(esubh("The fleet at a glance - where every monitor is"))
    parts.append(epanel(band_png([s for s in seg if s[1] > 0], CW - 28)))
    parts.append(etiles([
        (num(m["fleet_total"]), "Total fleet", "on the Ampol register", "#5B6472"),
        (num(m["available"]), "Available now", f"ready for issue at {asat_t}",
         "#409A55" if m["available"] >= tgt else "#E08A24"),
        (num(m["crew_out"]), "Out to crew", (f'{num(m["out_today"])} today + {num(m["outstanding"])} overdue'
                                             if m["out_today"] else "all from earlier days"), "#5B6472"),
        (num(m["outstanding"]), "Overdue 1+ days", f'{num(m["out_30"])} at 30+ days, {money(m["exposure"])}',
         "#D0342C" if m["outstanding"] else "#409A55"),
    ]))

    # ---------- where the numbers come from --------------------------------
    ws_, we_ = m["tx_window"]
    d90 = m["d90"]
    parts.append(esect("Where these numbers come from"))
    parts.append(ecallout(
        f'Every count comes from two SiteIQ exports pulled on <b>{m["asat"].strftime("%d %b %Y")}</b>. '
        f'<b>The register</b> (RENTAL_STOCK) is what is on hire, to whom, and what is on the shelf at '
        f'{asat_t}. <b>The movement log</b> (TRANSACTIONS) is every scan out and scan in from '
        f'{ws_.strftime("%d %b %Y %H:%M")} to {we_.strftime("%d %b %Y %H:%M")}, one row per monitor per draw. '
        f'The store scans twice out and twice in, so a row only exists when a monitor crossed the counter. '
        f'Serial numbers come from the Ampol master workbook (display only) and the {money(R["charge_per_unit"])} '
        f'replacement charge is a fixed rule; Ampol\'s old gas monitor workbook is not read. A draw is one monitor '
        f'to one named person once, which is why the yearly count is large - the behaviour measure is the '
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
    back_by_pull = max(0, m["yday_nsd"] - m["yday_register_still_out"])
    parts.append(esect("Yesterday - did they come back?"))
    parts.append(ecallout(
        f'On <b>{yd.strftime("%A %d %b")}</b>, <b>{num(m["yday_draws"])} monitors</b> went out to crew. '
        f'{eo(num(m["yday_nsd"]) + " were not back by the end of the day")} ({m["yday_sd_pct"]}% same day). '
        f'The register at {asat_t} still shows {eo(num(m["yday_register_still_out"]) + " monitors")} issued to crew that day, '
        f'so {("none" if not back_by_pull else num(back_by_pull))} came back between the '
        f'{R["return_box_scan_until"].strftime("%H:%M")} same-day cut-off and the pull. They are named below - the prestart chase list.',
        tight=True))
    parts.append(etiles([
        (num(m["yday_draws"]), "Crew draws yesterday", yd.strftime("%a %d %b"), "#5B6472"),
        (num(m["yday_nsd"]), "Not back same day", f'{100 - m["yday_sd_pct"]:.1f}% of draws',
         "#E08A24" if m["yday_nsd"] else "#409A55"),
        (num(back_by_pull), "Back by the pull", f'between {R["return_box_scan_until"].strftime("%H:%M")} and {asat_t}',
         "#409A55" if back_by_pull else "#5B6472"),
        (num(m["yday_register_still_out"]), f"Still out at {asat_t}", "on the register, named below",
         "#D0342C" if m["yday_register_still_out"] else "#409A55"),
    ]))
    yrows = []
    for c in m["yday_by_company"]:
        who = ", ".join(f"{esc(p)} ({k})" for p, k in c["people_open"])
        if not c["open"]:
            who = dim("all back - " + ", ".join(esc(p) for p, _ in c["people"][:4]))
        yrows.append([esc(c["name"]), num(c["nsd"]),
                      red(num(c["open"])) if c["open"] else dim("0"), who])
    if not yrows:
        yrows = [['<span style="color:#1E6B32;font-weight:bold;">Every monitor issued yesterday came back the same day.</span>', "", "", ""]]
    parts.append(edtable(["Company", "Not back by " + R["return_box_scan_until"].strftime("%H:%M"), "Still out in the log",
                          "Who still has them (units)"], yrows, ["", "r", "r", ""]))

    al = []
    if m["yday_still_out"]:
        al.append(("#D0342C", f'{num(m["yday_still_out"])} monitors from yesterday still out',
                   "Named above. A monitor out overnight has missed its bump test - safety conversation first."))
    if m["out_30"]:
        al.append(("#D0342C", f'{num(m["out_30"])} monitors overdue 30 days or more',
                   f'{money(m["exposure"])} exposure at {money(R["charge_per_unit"])} per unit. Recovery '
                   f'conversation, not a debt notice - every unit is named in the PDF appendix.'))
    if m["out_8_29"]:
        al.append(("#E08A24", f'{num(m["out_8_29"])} monitors overdue 8-29 days',
                   "The follow-up window - these become 30+ if nobody rings."))
    if m["repairs"]:
        al.append(("#E08A24", f'{num(m["repairs"])} monitors in the Dräger repair queue',
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
        f'From <b>{esc(m["d30_label"].replace(" - ", " to "))}</b>, <b>{num(m["people_active_30"])} people</b> drew a monitor. '
        f'{eo(num(m["people_with_nsd_30"]))} kept at least one past the day it went out, and '
        f'{eo(num(len(m["repeat_offenders"])))} did so in {R["repeat_weeks"]} or more separate weeks of the last 30 days - '
        f'a habit, not a bad day. Ranked by non-returns in the last 30 days; year to date alongside.', tight=True))
    parts.append(edtable(["Who", "Draws 30d", "Not same day 30d", "Same-day % 30d", "Last 3 months", "Year to date", "Still out"],
                         lrows, ["", "r", "r", "r", "r", "r", "r"]))
    parts.append(enote(
        f'Named people only - custody and workflow accounts are reported on their own lines. "Not same day" = '
        f'not scanned back on the calendar day it went out (a return from the return box by '
        f'{R["return_box_scan_until"].strftime("%H:%M")} next morning counts as same day; a draw at or after '
        f'{R["night_shift_from"].strftime("%H:%M")} counts as same day if back by {R["night_shift_back_by"].strftime("%H:%M")} '
        f'next morning). The top twelve are shown; every person is on the "People - not returning" tab of the attached Excel workbook.'))

    # ---------- companies, last 30 days ----------------------------------
    comps = [c for c in m["companies"] if c["d30_draws"] > 0]
    crows = []
    for c in comps[:10]:
        names = ", ".join(f'<span style="white-space:nowrap">{esc(p)} ({k})</span>' for p, k in c["d30_top"][:3])
        crows.append([esc(c["name"]), num(c["d30_draws"]), f'<b>{num(c["d30_nsd"])}</b>',
                      f'<span style="color:{col_pct(c["d30_sd_pct"])};font-weight:bold;">{c["d30_nsd_pct"]}%</span>',
                      (f'<span style="color:{col_pct(c["d90_sd_pct"])};font-weight:bold;">{c["d90_nsd_pct"]}%</span>' if c["d90_draws"] else dim("-")),
                      f'<span style="color:{col_pct(c["ytd_sd_pct"])};font-weight:bold;">{c["ytd_nsd_pct"]}%</span>',
                      num(c["d30_people"]), red(num(c["open_now"])) if c["open_now"] else dim("0"),
                      names or dim("-")])
    parts.append(esect("By company - the last 30 days against the last 3 months and the year"))
    parts.append(ecallout(
        f'{eo(num(d30["not_same_day"]))} of <b>{num(d30["draws"])}</b> crew draws in the last 30 days '
        f'({d30["nsd_pct"]}%) were not back on the day they went out, across <b>{num(d30["companies"])} '
        f'companies</b>. The 30-day rate against the year-to-date rate shows who is improving.', tight=True))
    parts.append(edtable(["Company", "Draws 30d", "Not same day", "Rate 30d", "Rate 3 mo", "Rate YTD", "People", "Still out",
                          "Top non-returners, last 30 days (units)"],
                         crows, ["", "r", "r", "r", "r", "r", "r", "r", ""]))
    parts.append(esubh("Not returned same day, last 30 days", "- by company, top 10"))
    parts.append(epanel(hbars_png([(c["name"], c["d30_nsd"]) for c in comps[:10]], CW - 28, K["amber"])))

    # ---------- the year in context -------------------------------------
    mon = m["monthly"]
    parts.append(esect("The year so far - volume and behaviour by month"))
    parts.append(ecallout(
        f'Since <b>{m["tx_window"][0].strftime("%d %b")}</b>, crews have drawn a monitor <b>{num(ytd["draws"])} '
        f'times</b> - {num(ytd["per_working_day"])} a working day on average over the {num(ytd["working_days"])} weekdays '
        f'with draws - and {eo(str(ytd["sd_pct"]) + "%")} '
        f'came back the same day. The last 30 days ran at {eo(str(d30["sd_pct"]) + "%")} on {num(d30["draws"])} '
        f'draws. Bars are monthly draws; the line is the share back the same day'
        f'{" - the last bar is a part month" if mon and mon[-1]["partial"] else ""}.', tight=True))
    parts.append(epanel(month_combo_png([x["label"] for x in mon], [x["draws"] for x in mon],
                                        [x["sd_pct"] for x in mon], CW - 28,
                                        partial_last=bool(mon and mon[-1]["partial"]))))
    parts.append(etiles([
        (num(ytd["draws"]), "Crew draws, year to date", esc(m["ytd_label"]), "#5B6472"),
        (f'{ytd["sd_pct"]}%', "Same day, year to date", f'{num(ytd["not_same_day"])} not back same day', col_pct(ytd["sd_pct"])),
        (num(d30["draws"]), "Crew draws, last 30 days", esc(m["d30_label"]), "#5B6472"),
        (f'{d30["sd_pct"]}%', "Same day, last 30 days", f'{num(d30["not_same_day"])} not back same day', col_pct(d30["sd_pct"])),
    ]))
    wk = [w for w in m["weekly"] if not w["partial"]]
    parts.append(esubh("Same-day return rate by week", "- every full week of the year (part weeks left off)"))
    parts.append(epanel(line_png([w["label"] if i % 6 == 0 else "" for i, w in enumerate(wk)],
                                 [{"vals": [w["pct"] for w in wk], "colour": K["green"],
                                   "label": "Same-day %", "fill": True}], CW - 28, pct=True)))

    # ---------- the non-return trend (06 Nov 2026, client feedback) ------
    tr = m.get("trends")
    if tr:
        s_ = tr["summary"]
        dl = tr["daily"]
        step = max(1, len(dl) // 48)
        pts = dl[::step]
        if pts[-1] is not dl[-1]:
            pts = pts + [dl[-1]]
        parts.append(esect("The non-return trend - since the log began"))
        rate_words = (f'The last four full weeks ran at <b>{s_["rate_last4"]}%</b> same day against {s_["rate_prev4"]}% '
                      f'the four before. ' if s_.get("rate_last4") is not None and s_.get("rate_prev4") is not None else "")
        parts.append(ecallout(
            f'<b>{s_["days"]} days</b> of the log, {s_["start"]:%d %b} to {s_["end"]:%d %b %Y}. Monitors overdue at the '
            f'end of the day ran from <b>{num(s_["overdue_first"])}</b> on the first day to {eo(num(s_["overdue_last"]))} '
            f'now, peaking at <b>{num(s_["peak_overdue"])}</b> on {s_["peak_day"]:%d %b}; out 30 days or more went from '
            f'<b>{num(s_["over30_first"])}</b> to {eo(num(s_["over30_last"]))}. {rate_words}'
            f'This year <b>{num(s_["repeaters"])}</b> people had a non-return in three or more separate weeks (the last-30-day '
            f'count above is {num(len(m["repeat_offenders"]))}) - every one is listed on the "Trend - repeat people" tab of the '
            f'attached Excel workbook.', tight=True))
        parts.append(epanel(line_png([x["day"].strftime("%d %b") if i % 8 == 0 else "" for i, x in enumerate(pts)],
                                     [{"vals": [x["out"] for x in pts], "colour": "#2A313C", "label": "Out to crew"},
                                      {"vals": [x["overdue"] for x in pts], "colour": K["amber"], "label": "Overdue 1+ days"},
                                      {"vals": [x["over30"] for x in pts], "colour": K["red"], "label": "Out 30+ days", "fill": True}],
                                     CW - 28)))
        lab_b, lab_l = tr.get("trend_base_label", ""), tr.get("trend_last_label", "")

        def pcx(v):
            return f"{v:.1f}%" if v is not None else dim("-")

        def wordx(w):
            return {"worse": '<b style="color:#D0342C;">worse</b>',
                    "better": '<b style="color:#409A55;">better</b>', "level": "level"}.get(w, dim(esc(w)))
        crow = []
        for c in tr["companies"][:6]:
            crow.append([esc(c["name"]), num(c["draws"]), num(c["nsd"]), f'{c["nsd_pct"]:.1f}%',
                         pcx(c.get("trend_base")), pcx(c.get("trend_last")), wordx(c["trend"]), num(c["open_now"])])
        parts.append(esubh("Busiest companies", f"- non-return rate for the year, the {lab_b} average against {lab_l}, and the trend"))
        parts.append(edtable(["Company", "Draws", "Not same day", "Rate YTD", f"{lab_b} avg", lab_l, "Trend", "Open now"],
                             crow, ["", "r", "r", "r", "r", "r", "", "r"]))
        pe = tr.get("people") or []
        if pe:
            prow = []
            for q in pe:
                prow.append([f'<span style="white-space:nowrap">{esc(q["name"])}</span>', esc(q["co"]), num(q["draws"]),
                             f'<b>{num(q["nsd"])}</b>', f'{q["nsd_pct"]}%', pcx(q.get("trend_base")), pcx(q.get("trend_last")),
                             wordx(q["trend"]), num(q["weeks"]),
                             (f'{red(num(q["open_now"]))} ({num(q["oldest"])}d)' if q["open_now"] else "0")])
            parts.append(esubh("Worst offenders", "- the ten people with the most non-returns this year, and the way each is heading"))
            parts.append(edtable(["Who", "Company", "Draws", "Not same day", "Rate YTD", f"{lab_b} avg", lab_l, "Trend", "Weeks", "Still out"],
                                 prow, ["", "", "r", "r", "r", "r", "r", "", "r", "r"]))
        parts.append(enote(f"Trend compares {lab_l}'s non-return rate with the {lab_b} average: worse = more than 2 points "
                           f"higher, better = more than 2 lower. November is a part month and is not judged; a person with no "
                           f"draws in {lab_l} is not judged either (\"no draws since ...\"). Every point is counted from the same "
                           f"TRANSACTIONS export as the rest of this email - nothing smoothed, nothing estimated."))

    # ---------- where they are now ---------------------------------------
    where = m["where"]
    ranked = sorted(where, key=lambda x: (-x["d30"], -x["outstanding"], -x["total"]))
    top = ranked[:10]
    any_today = any(w2["today"] for w2 in where)
    parts.append(esect("Where the monitors are right now - by company, ranked by units 30+ days out"))
    parts.append(ecallout(
        f'<b>{num(m["crew_out"])} monitors</b> are out to crew: '
        + (f'{num(m["out_today"])} went out today and are on their normal cycle; ' if m["out_today"] else
           'none had gone out today when the register was pulled, so ')
        + f'{eo(num(m["outstanding"]) + " are overdue")} - {num(m["out_1"])} since yesterday, '
        f'{num(m["out_2_7"])} for 2-7 days, {num(m["out_8_29"])} for 8-29 days and '
        f'{eo(num(m["out_30"]) + " for 30 days or more")}. Custody holdings sit outside the crew count: '
        + ", ".join(f"{lab} {num(m[k])}" for k, lab in (("fccu", "FCCU"), ("ops", "Operations"), ("ff", "Future Fuels"),
                                                        ("afterhours", "after-hours account")) if m[k]) + ".", tight=True))
    segs_ = ([("Out today", GREY)] if any_today else []) + [
        ("1 day", K["amber"]), ("2-7 days", K["deep_amber"]), ("8-29 days", K["red"]), ("30+ days", "#7A1F19")]
    parts.append(epanel(stacked_hbars_png(
        [(w2["name"], ([w2["today"]] if any_today else []) + [w2["d1"], w2["d2_7"], w2["d8_29"], w2["d30"]]) for w2 in top],
        segs_, CW - 28)))
    wrows = []
    for w2 in top:
        uc = {"Critical": "#D0342C", "High": "#8A5300", "Watch": "#1E6B32", "Clear": "#98A0AA"}.get(w2["urgency"], "#E6E9EE")
        wrows.append([esc(w2["name"])] + ([num(w2["today"])] if any_today else []) + [num(w2["d1"]) if w2["d1"] else dim("0"),
                      num(w2["d2_7"]) if w2["d2_7"] else dim("0"), num(w2["d8_29"]) if w2["d8_29"] else dim("0"),
                      red(num(w2["d30"])) if w2["d30"] else dim("0"),
                      f'<b>{num(w2["outstanding"])}</b>' if w2["outstanding"] else dim("0"),
                      money(w2["exposure"]) if w2["exposure"] else dim("$0"),
                      f'<span style="color:{uc};font-weight:bold;">{esc(w2["urgency"])}</span>'])
    parts.append(edtable(["Company"] + (["Today"] if any_today else []) + ["1 day", "2-7d", "8-29d", "30+d", "Overdue", "Exposure", "Urgency"],
                         wrows, [""] + (["r"] if any_today else []) + ["r", "r", "r", "r", "r", "r", ""]))

    # ---------- 30+ named --------------------------------------------------
    items30 = [x for x in m["outstanding_items"] if x["days"] >= 30]
    parts.append(esect(f"Overdue 30 days or more - named, oldest first ({num(len(items30))} units)"))
    if items30:
        parts.append(edtable(["Out", "Since", "Who", "Company", "Asset", "Serial", "Charge"],
                             [[red(f'{x["days"]}d'), esc(x["on_dt"].strftime("%d %b %Y")) if x["on_dt"] else "",
                               k2.who_s(x["who"], x["co"]), esc(x["co"]), esc(x["bc"]), esc(x["serial"]) or dim("-"),
                               money(x["cost"])] for x in items30],
                             ["r", "", "", "", "", "", "r"]))
    else:
        parts.append(enote("Nothing overdue 30 days or more."))
    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="{FONT}font-size:13px;font-weight:bold;color:#1D1D1B;padding:12px 10px;border-bottom:1px solid #DDE1E7;">Replacement charge exposure - {num(m['out_30'])} units at 30 days or more</td>
<td align="right" style="padding:12px 10px;border-bottom:1px solid #DDE1E7;"><span style="{FONT}font-size:14px;font-weight:bold;color:#C8511A;">{money(m['exposure'])}</span></td></tr></table>
{enote(f'{money(R["charge_per_unit"])} per unit - the replacement charge Ampol\'s gas monitor workbook used, carried as a fixed rule. The full overdue list ({num(m["outstanding"])} units, oldest first) is Appendix A of the attached PDF.')}""")

    # ---------- repairs -------------------------------------------------
    stale = m["repair_stale"]
    parts.append(esect("Out of service - the Dräger repair queue"))
    parts.append(ecallout(
        f'<b>{num(m["repairs"])} monitors</b> in the repair queue - {eo(str(m["fleet_impact_pct"]) + "%")} of the '
        f'fleet a crew cannot take. Largest category <b>{esc(m["repair_top"])}</b>.'
        + (f' {eo(str(len(stale)))} units have sat there {R["stale_repair_days"]} days or more - the oldest '
           f'{num(stale[0]["days"])} days: a repair-or-replace call.' if stale else ''), tight=True))
    parts.append(epanel(hbars_png(m["repair_cats"], CW - 28, K["deep_amber"])))

    # ---------- footer ---------------------------------------------------
    team_line = " &middot; ".join(
        f'<b style="color:#1D1D1B;">{esc(p["name"])}</b> <span style="color:#5B6472;">{esc(p["role"])}</span>'
        for p in cfg["team"])
    vt = v18.CONFIG
    ws, we = m["tx_window"]
    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:26px;">
<tr><td style="border-top:1px solid #DDE1E7;padding-top:10px;">
<div style="{FONT}font-size:10px;font-weight:bold;letter-spacing:2px;color:#F26222;text-transform:uppercase;">Your Coates Tool Store Team</div>
<div style="{FONT}font-size:11px;color:#5B6472;padding-top:5px;line-height:1.7;">{team_line}</div>
<div style="{FONT}font-size:10px;color:#98A0AA;padding-top:9px;line-height:1.7;">
{(ampol_options.client_line() + ' &middot; ') if ampol_options.client_line() else ''}Coates &middot; 340 Curtin Ave W, Eagle Farm, QLD 4009 &middot; {esc(str(vt["author_email"]).lower())} &middot; {esc(vt["author_mobile"])}<br>
Sources: SiteIQ RENTAL_STOCK (position as at {esc(asat_s)}) and TRANSACTIONS (issues {ws.strftime('%d %b %H:%M')} to {we.strftime('%d %b %Y %H:%M')}, where the export ends). Every count is made from those two exports and the two are reconciled against each other on every build - see the data page of the PDF. The Coates Way - consistent execution, every day. <b style="color:#1D1D1B;">POWERED BY SITEIQ</b></div>
</td></tr></table>""")

    body = "".join(f'<tr><td style="padding:0 24px;">{p}</td></tr>'
                   if not p.startswith('<table role="presentation" width="100%" cellspacing="0" cellpadding="0">\n<tr><td bgcolor="#1D1D1B"')
                   else f'<tr><td>{p}</td></tr>' for p in parts)
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Coates {esc(cfg['client'])} {esc(cfg['title'])} - {esc(asat_s)}</title></head>
<body bgcolor="#E9ECF0" style="margin:0;padding:0;background-color:#E9ECF0;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#E9ECF0">
<tr><td align="center" style="padding:18px 10px;">
<table role="presentation" width="{W}" cellspacing="0" cellpadding="0" bgcolor="#FFFFFF" style="width:{W}px;max-width:{W}px;">
<tr><td height="6" bgcolor="#F26222" style="font-size:0;">&nbsp;</td></tr>
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
    # WHY (06 Nov 2026, client feedback): the non-return trend rides in the
    # email as well as the PDF - the same engine, the same figures
    try:
        import gas_trends
        m["trends"] = gas_trends.compute(ctx, m)
        print(f"Trend                : {m['trends']['summary']['days']} days of the log" if m["trends"] else "Trend                : no crew draws in the log")
    except Exception as e:
        m["trends"] = None
        print(f"Trend                : not computed ({type(e).__name__}: {e})")
    gen_s = datetime.now().strftime("%d %b %Y %H:%M")
    asat_s = m["asat"].strftime("%d %b %Y %H:%M")
    ge.print_summary(m)

    stem = ampol_names.report_stem(cfg["stem_key"])
    pdf_path = os.path.join(out_dir, stem + ".pdf")
    card_path = os.path.join(out_dir, stem + "_PositionCard.png")
    card_bytes = b""
    if os.path.exists(card_path) and (CONFIG.get("attach_card") or CONFIG.get("inline_card")):
        with open(card_path, "rb") as f:
            card_bytes = f.read()
    card_cid = "positioncard" if (CONFIG.get("inline_card") and card_bytes) else ""

    html = build_email_html(m, gen_s, asat_s, cfg, card_cid=card_cid)
    html_path = os.path.join(out_dir, stem + "_EMAIL.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"HTML written         : {html_path}  ({len(html):,} bytes)")

    # WHY (07 Nov 2026, QA): the house date style, dated by the pull, not the clock
    subject = f"{cfg['client']} {cfg['title']} - {m['asat'].strftime('%d %b %Y')}"
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["To"] = ", ".join(vt["recipients"])
    msg["Date"] = formatdate(localtime=True)
    msg["X-Unsent"] = "1"
    msg.set_content("This report is best viewed in HTML. The PDF report is attached.\n")
    msg.add_alternative(html, subtype="html")
    if card_cid:
        # the inline card rides inside the HTML part as multipart/related,
        # so Outlook shows it without fetching anything
        html_part = msg.get_payload()[-1]
        html_part.add_related(card_bytes, maintype="image", subtype="png",
                              cid=f"<{card_cid}>", filename=os.path.basename(card_path),
                              disposition="inline")
        print(f"Card inline          : cid:{card_cid} under the header ({len(card_bytes):,} bytes)")

    attachments = []
    if CONFIG["attach_pdf"] and os.path.exists(pdf_path):
        with open(pdf_path, "rb") as f:
            msg.add_attachment(f.read(), maintype="application", subtype="pdf",
                               filename=os.path.basename(pdf_path))
        attachments.append(os.path.basename(pdf_path))
        print(f"PDF attached         : {os.path.basename(pdf_path)}")
    else:
        print("PDF attached         : no (build the PDF first for the attachment)")
    # WHY (03 Sep 2026): the position card - page 1 as a phone-sized image,
    # attached as a file as well as shown inline
    if CONFIG.get("attach_card") and card_bytes:
        msg.add_attachment(card_bytes, maintype="image", subtype="png",
                           filename=os.path.basename(card_path))
        attachments.append(os.path.basename(card_path))
        print(f"Card attached        : {os.path.basename(card_path)}")
    elif CONFIG.get("attach_card"):
        print("Card attached        : no (build the PDF first - the card is drawn with it)")

    # WHY (06 Nov 2026, client feedback): the Excel twin of the report - the
    # same figures as the PDF, every tab filterable - rides with the email.
    xlsx_path = os.path.join(out_dir, stem + ".xlsx")
    if os.path.exists(xlsx_path):
        with open(xlsx_path, "rb") as f:
            msg.add_attachment(f.read(), maintype="application",
                               subtype="vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                               filename=os.path.basename(xlsx_path))
        attachments.append(os.path.basename(xlsx_path))
        print(f"Excel twin attached  : {os.path.basename(xlsx_path)}")
    else:
        print("Excel twin attached  : no (build the PDF first - the workbook is written with it)")

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

    eml_path = os.path.join(out_dir, stem + "_OUTLOOK.eml")
    with open(eml_path, "wb") as f:
        f.write(msg.as_bytes())
    print(f"EML written          : {eml_path}  ({os.path.getsize(eml_path):,} bytes)")

    manifest = {
        "subject": subject,
        "body": os.path.basename(html_path),
        "attachments": attachments,
        "to": "; ".join(vt["recipients"]),
    }
    man_path = os.path.join(out_dir, stem + ".draft.json")
    with open(man_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=1)
    print(f"Draft manifest       : {man_path}")
    print("")
    print("NEXT STEP: double-click the .eml, check it, press Send.")
    print("Done. The Coates Way - consistent execution, every day.")


# WHY (07 Nov 2026): one dash style in the emails as on the pages
import k2shell as _k2s_dash
build_email_html = _k2s_dash.one_dash(build_email_html)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(f"ERROR: {e}")
