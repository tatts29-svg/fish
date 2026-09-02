#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
COATES - AMPOL GAS MONITOR OPERATIONS - OUTLOOK EMAIL (HOUSE STYLE)
Workbook + TRANSACTIONS in -> ready-to-send .eml in the K2 look
=====================================================================
Author: Andrew Fisher
The Coates Way - Operational Excellence - POWERED BY SITEIQ

WHAT THIS IS
  The daily email, rebuilt in the Coates house style (the K2 report
  family look) - replacing the old dark V18 email design. Same
  mechanism as before: an Outlook-safe .eml draft (X-Unsent) with the
  full report in the body, the source workbook and the house-style PDF
  attached, and the distribution list already on it.

OUTLOOK-SAFE MEANS
  Outlook renders with Word's engine, so the body is tables and inline
  styles only - no SVG, no flexbox, no CSS positioning, no web fonts.
  Every chart is drawn with Pillow and embedded as a PNG, the same
  technique the old V18 email used for its health rings.

WHERE THE NUMBERS COME FROM
  One engine: generate_v18_gas_monitor_report (register position) and
  gasmon_transactions (flow/behaviour analytics) - the same modules the
  PDF uses, so the email, the PDF and the console can never disagree.

USAGE
  WHY (12 Aug 2026): now part of the suite - 01_RUN_GAS_MONITOR_REPORT.bat
  runs this after the PDF so the PDF can be attached. Inputs come from
  Data\, outputs land in Reports\<today>\Gas_Monitors.
  Or on its own:  python generate_k2style_email.py
=====================================================================
"""

import base64
import io
import json
import os
import shutil
import sys
from datetime import datetime
from email.message import EmailMessage
from email.utils import formatdate

from PIL import Image, ImageDraw, ImageFont

try:
    import generate_v18_gas_monitor_report as v18
    import gasmon_transactions as gtx
    import generate_k2style_gas_monitor_report as k2
except ImportError as e:
    sys.exit(f"ERROR: a suite script is missing ({e}).\n"
             "  Keep the suite folder together and press the gas monitor"
             " button again.")

# WHY (12 Aug 2026): the suite's path oracle - the .eml, the email HTML
# and the draft manifest all land in Reports\<today>\Gas_Monitors, and
# the PDF is read from there too (the same button builds it first).
import ampol_paths

esc, money, num = k2.esc, k2.money, k2.num
K = k2.K

CONFIG = {
    "eml_name": "Coates_Ampol_GasMonitor_Operations_OUTLOOK_SAFE.eml",
    "html_name": "Coates_Ampol_GasMonitor_Operations_EMAIL.html",
    "attach_pdf": True,     # attach the house-style PDF when it exists
    "width": 1000,          # email body width in px
}

# =====================================================================
# PIL chart kit - dark panels matching the house style
# =====================================================================

_FONT_DIRS = [r"C:\Windows\Fonts", "/usr/share/fonts/truetype/dejavu",
              "/usr/share/fonts/truetype/lato", ""]
_FONTS = {"reg": ["Lato-Regular.ttf", "calibri.ttf", "arial.ttf",
                  "segoeui.ttf", "DejaVuSans.ttf"],
          "bold": ["Lato-Bold.ttf", "calibrib.ttf", "arialbd.ttf",
                   "segoeuib.ttf", "DejaVuSans-Bold.ttf"]}


def _font(size, bold=False):
    for name in _FONTS["bold" if bold else "reg"]:
        for d in _FONT_DIRS:
            p = os.path.join(d, name) if d else name
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                continue
    return ImageFont.load_default()


def _png_b64(im):
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    return base64.b64encode(buf.getvalue()).decode("ascii")


def _panel(w, h):
    im = Image.new("RGB", (w, h), "#171F2B")
    return im, ImageDraw.Draw(im)


def _tw(d, s, f):
    return d.textlength(str(s), font=f)


def img_tag(im, width, alt):
    return (f'<img src="data:image/png;base64,{_png_b64(im)}" width="{width}" '
            f'alt="{esc(alt)}" style="display:block;width:{width}px;'
            f'max-width:100%;height:auto;border:0;">')


def rule_png(width):
    """The gradient rule, as a PNG strip (CSS gradients die in Outlook)."""
    stops = [(0.0, (243, 111, 33)), (0.18, (245, 134, 15)),
             (0.34, (240, 179, 16)), (0.52, (227, 212, 28)),
             (0.68, (200, 218, 44)), (0.84, (221, 234, 146)),
             (1.0, (255, 255, 255))]
    w = width * 2
    im = Image.new("RGB", (w, 6), "#FFFFFF")
    d = ImageDraw.Draw(im)
    for x in range(w):
        t = x / (w - 1)
        for i in range(len(stops) - 1):
            t0, c0 = stops[i]
            t1, c1 = stops[i + 1]
            if t0 <= t <= t1:
                f = (t - t0) / (t1 - t0) if t1 > t0 else 0
                col = tuple(int(c0[j] + (c1[j] - c0[j]) * f) for j in range(3))
                d.line([(x, 0), (x, 6)], fill=col)
                break
    return img_tag(im, width, "rule")


def donut_png(pct, colour, centre, word):
    S, TH = 340, 46
    im = Image.new("RGBA", (S, S), (255, 255, 255, 0))
    d = ImageDraw.Draw(im)
    box = [TH // 2 + 4, TH // 2 + 4, S - TH // 2 - 4, S - TH // 2 - 4]
    d.arc(box, 0, 360, fill="#1E2733", width=TH)
    d.arc(box, -90, -90 + int(360 * min(100, max(0, pct)) / 100),
          fill=colour, width=TH)
    d.ellipse([TH + 10, TH + 10, S - TH - 10, S - TH - 10], fill="#141C26")
    f1, f2 = _font(64, True), _font(19)
    d.text((S / 2 - _tw(d, centre, f1) / 2, S / 2 - 52), str(centre),
           font=f1, fill="#FFFFFF")
    d.text((S / 2 - _tw(d, word, f2) / 2, S / 2 + 22), word,
           font=f2, fill="#8A9AAC")
    return img_tag(im, 170, f"health {centre}")


def band_png(segs, width):
    """Fleet composition band + legend."""
    W, H, BH = width * 2, 150, 66
    im, d = _panel(W, H)
    total = sum(v for _, v, _ in segs) or 1
    fb, fl = _font(24, True), _font(19)
    x = 30.0
    for lab, v, col in segs:
        sw = (W - 60) * v / total
        d.rectangle([x, 24, x + sw, 24 + BH], fill=col)
        if sw > 70:
            d.text((x + sw / 2 - _tw(d, num(v), fb) / 2, 24 + BH / 2 - 14),
                   num(v), font=fb, fill="#FFFFFF")
        x += sw
    lx = 30
    for lab, v, col in segs:
        d.ellipse([lx, 112, lx + 14, 126], fill=col)
        t = f"{lab} {num(v)}"
        d.text((lx + 22, 108), t, font=fl, fill="#C9D6E2")
        lx += 22 + _tw(d, t, fl) + 34
    return img_tag(im, width, "fleet composition")


def hours_png(hi, hr, width):
    """Issues v returns by hour, grouped bars."""
    W, H = width * 2, 430
    im, d = _panel(W, H)
    hrs = list(range(3, 19))
    top, base, pl, pr = 70, H - 56, 40, 24
    mx = max([hi.get(h, 0) for h in hrs] + [hr.get(h, 0) for h in hrs] + [1])
    slot = (W - pl - pr) / len(hrs)
    bw = slot * 0.34
    fl, fv = _font(19), _font(17)
    for g in (0.25, 0.5, 0.75, 1.0):
        y = base - (base - top) * g
        d.line([(pl, y), (W - pr, y)], fill="#26313D", width=1)
    d.line([(pl, base), (W - pr, base)], fill="#3A4756", width=2)
    for i, h in enumerate(hrs):
        x0 = pl + i * slot + slot * 0.12
        for j, (cnt, col) in enumerate(((hi.get(h, 0), K["orange"]),
                                        (hr.get(h, 0), "#22C55E"))):
            bh = (base - top) * cnt / mx
            x = x0 + j * bw
            d.rectangle([x, base - bh, x + bw - 4, base], fill=col)
            if cnt:
                d.text((x + (bw - 4) / 2 - _tw(d, num(cnt), fv) / 2,
                        base - bh - 26), num(cnt), font=fv, fill="#C9D6E2")
        d.text((pl + i * slot + slot / 2 - _tw(d, f"{h:02d}", fl) / 2,
                base + 14), f"{h:02d}", font=fl, fill="#8A9AAC")
    d.ellipse([W - 400, 24, W - 384, 40], fill=K["orange"])
    d.text((W - 374, 20), "Issued", font=fl, fill="#C9D6E2")
    d.ellipse([W - 240, 24, W - 224, 40], fill="#22C55E")
    d.text((W - 214, 20), "Returned", font=fl, fill="#C9D6E2")
    return img_tag(im, width, "issues and returns by hour")


def line_png(labels, series, width, pct=False, annotate=False, h=420):
    """Multi-series line chart. series: [{vals, colour, label, fill}]."""
    W, H = width * 2, h
    im, d = _panel(W, H)
    n = len(labels)
    if n < 2:
        return img_tag(im, width, "chart")
    top, base, pl, pr = 64, H - 54, 40, 90
    ymax = 100 if pct else max(max(s["vals"]) for s in series) * 1.15 or 1

    def X(i):
        return pl + (W - pl - pr) * i / (n - 1)

    def Y(v):
        return base - (base - top) * v / ymax
    fl, fv, fb = _font(18), _font(17), _font(21, True)
    for g in (0.25, 0.5, 0.75, 1.0):
        y = Y(ymax * g)
        d.line([(pl, y), (W - pr, y)], fill="#26313D", width=1)
        if pct:
            d.text((W - pr + 10, y - 10), f"{int(ymax * g)}%", font=fv,
                   fill="#5F7183")
    d.line([(pl, base), (W - pr, base)], fill="#3A4756", width=2)
    for i, lab in enumerate(labels):
        if lab:
            anchor_x = X(i) if i else X(i) + _tw(d, lab, fl) / 2
            d.text((anchor_x - _tw(d, lab, fl) / 2, base + 12), lab,
                   font=fl, fill="#8A9AAC")
    for s in series:
        pts = [(X(i), Y(v)) for i, v in enumerate(s["vals"])]
        if s.get("fill"):
            poly = [(pl, base)] + pts + [(X(n - 1), base)]
            ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            od = ImageDraw.Draw(ov)
            c = s["colour"].lstrip("#")
            rgb = tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))
            od.polygon(poly, fill=rgb + (34,))
            im.paste(ov, (0, 0), ov)
            d = ImageDraw.Draw(im)
        d.line(pts, fill=s["colour"], width=5, joint="curve")
        lx, ly = pts[-1]
        d.ellipse([lx - 7, ly - 7, lx + 7, ly + 7], fill=s["colour"])
        val = f"{int(round(s['vals'][-1]))}{'%' if pct else ''}"
        d.text((lx + 12, ly - 12), val, font=fb, fill="#FFFFFF")
        if annotate:
            for i, v in enumerate(s["vals"][:-1]):
                t = f"{int(round(v))}{'%' if pct else ''}"
                d.text((X(i) - _tw(d, t, fv) / 2, Y(v) - 34), t, font=fv,
                       fill="#C9D6E2")
    lx = W - pr - 130 - (len(series) - 1) * 260
    for j, s in enumerate(series):
        d.ellipse([lx + j * 260, 24, lx + 16 + j * 260, 40], fill=s["colour"])
        d.text((lx + 26 + j * 260, 20), s["label"], font=fl, fill="#C9D6E2")
    return img_tag(im, width, "trend chart")


def hbars_png(rows, width, colour):
    rowh, pad = 62, 26
    W = width * 2
    H = len(rows) * rowh + pad * 2
    im, d = _panel(W, H)
    mx = max(v for _, v in rows) or 1
    fl, fb = _font(20), _font(21, True)
    lab_w, val_w = 480, 110
    for i, (lab, v) in enumerate(rows):
        y = pad + i * rowh
        d.text((30, y + 8), str(lab)[:38], font=fl, fill="#C9D6E2")
        bx0, bx1 = lab_w, W - val_w
        d.rounded_rectangle([bx0, y + 10, bx1, y + 32], 11, fill="#26313D")
        bw = max(22, (bx1 - bx0) * v / mx)
        d.rounded_rectangle([bx0, y + 10, bx0 + bw, y + 32], 11, fill=colour)
        d.text((W - 30 - _tw(d, num(v), fb), y + 6), num(v), font=fb,
               fill="#FFFFFF")
    return img_tag(im, width, "bars")


# =====================================================================
# Outlook-safe HTML pieces (tables + inline styles only)
# =====================================================================

FONT = ("font-family:Calibri,'Segoe UI',Arial,sans-serif;")


def sect(title):
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td style="padding:26px 0 0 0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td width="5" bgcolor="#F36F21" style="font-size:0;">&nbsp;</td>
<td bgcolor="#F4F5F7" style="{FONT}padding:13px 18px;font-size:15px;font-weight:bold;color:#16202C;">{title}</td>
</tr></table></td></tr></table>"""


def callout(inner, tight=False):
    fs = "13px" if tight else "14px"
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td style="padding:16px 0 0 0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td width="5" bgcolor="#F36F21" style="font-size:0;">&nbsp;</td>
<td bgcolor="#FDF0E7" style="{FONT}padding:15px 20px;font-size:{fs};line-height:1.85;color:#1F2A36;">{inner}</td>
</tr></table></td></tr></table>"""


def o(s):
    return f'<span style="color:#D95F14;font-weight:bold;">{s}</span>'


def note(inner):
    return (f'<div style="{FONT}font-size:11px;color:#7A8A9A;line-height:1.7;'
            f'padding:9px 2px 0 2px;">{inner}</div>')


def subh(title, thin=""):
    t = f' <span style="font-weight:normal;color:#5A6875;">{thin}</span>' if thin else ""
    return (f'<div style="{FONT}font-size:15px;font-weight:bold;color:#16202C;'
            f'padding:20px 0 10px 0;">{title}{t}</div>')


def panel(inner):
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td bgcolor="#171F2B" style="padding:14px;">{inner}</td></tr></table>"""


def tiles(items):
    """(value, label, note, note_colour) x4 - dark tiles, K2 look."""
    tds = []
    for val, lab, nt, nc in items:
        n = (f'<div style="{FONT}font-size:10px;font-weight:bold;color:{nc};'
             f'padding-top:5px;">{nt}</div>') if nt else ""
        tds.append(f"""<td width="25%" style="padding:4px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td bgcolor="#171F2B" align="center" style="{FONT}padding:16px 6px 14px 6px;">
<div style="font-size:27px;font-weight:bold;color:#FFFFFF;line-height:1.05;">{val}</div>
<div style="{FONT}font-size:9px;letter-spacing:1px;color:#8A9AAC;text-transform:uppercase;padding-top:7px;line-height:1.5;">{lab}</div>{n}
</td></tr></table></td>""")
    return (f'<table role="presentation" width="100%" cellspacing="0" '
            f'cellpadding="0" style="margin-top:8px;"><tr>{"".join(tds)}</tr></table>')


def dtable(headers, rows, aligns=None, right_cols=()):
    aligns = aligns or [""] * len(headers)
    th = "".join(
        f'<td style="{FONT}background-color:#1B2532;color:#FFFFFF;font-size:10px;'
        f'font-weight:bold;letter-spacing:1px;text-transform:uppercase;'
        f'padding:10px 10px;{"text-align:right;" if a == "r" else "text-align:center;" if a == "c" else ""}">{h}</td>'
        for h, a in zip(headers, aligns))
    body = []
    for i, r in enumerate(rows):
        bg = "#F7F8FA" if i % 2 else "#FFFFFF"
        tds = "".join(
            f'<td style="{FONT}font-size:12px;color:#26313D;padding:9px 10px;'
            f'border-bottom:1px solid #E8EBEF;line-height:1.4;'
            f'{"text-align:right;" if a == "r" else "text-align:center;" if a == "c" else ""}">{c}</td>'
            for c, a in zip(r, aligns))
        body.append(f'<tr bgcolor="{bg}">{tds}</tr>')
    return (f'<table role="presentation" width="100%" cellspacing="0" '
            f'cellpadding="0" style="margin-top:10px;border-collapse:collapse;">'
            f'<tr>{th}</tr>{"".join(body)}</table>')


def s2(main, sub):
    return (f'{main}<br><span style="{FONT}font-size:10px;color:#98A6B4;">'
            f'{sub}</span>')


def score_bar_row(label, sc, formula):
    col = {"green": "#1FA75A", "amber": "#F5A623", "red": "#EF4444"}[k2.rag(sc)]
    w = max(2, min(100, sc))
    return f"""<tr>
<td style="{FONT}font-size:13px;color:#1F2A36;padding:6px 10px 0 0;white-space:nowrap;">&#10003;&nbsp; {label}</td>
<td width="300" style="padding:6px 0 0 0;"><table role="presentation" width="300" cellspacing="0" cellpadding="0"><tr>
<td width="{w * 3}" height="11" bgcolor="{col}" style="font-size:0;">&nbsp;</td>
<td height="11" bgcolor="#1A2430" style="font-size:0;">&nbsp;</td></tr></table></td>
<td style="{FONT}font-size:13px;font-weight:bold;color:#16202C;padding:6px 0 0 12px;white-space:nowrap;">{sc}/100</td></tr>
<tr><td></td><td colspan="2" style="{FONT}font-size:10px;color:#98A6B4;padding:2px 0 8px 0;line-height:1.5;">{formula}</td></tr>"""


def alerts_panel(items):
    rows = "".join(
        f'<tr><td width="14" style="{FONT}font-size:12px;color:{c};'
        f'vertical-align:top;padding-bottom:11px;">&#9679;</td>'
        f'<td style="padding-bottom:11px;">'
        f'<div style="{FONT}font-size:12.5px;font-weight:bold;color:#FFFFFF;">{t}</div>'
        f'<div style="{FONT}font-size:11px;color:#8A9AAC;line-height:1.55;padding-top:3px;">{s}</div>'
        f'</td></tr>' for c, t, s in items)
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:14px;">
<tr><td bgcolor="#171F2B" style="padding:16px 20px 7px 20px;">
<div style="{FONT}font-size:11px;font-weight:bold;letter-spacing:2px;color:#F36F21;text-transform:uppercase;padding-bottom:11px;">ALERTS &amp; ACTIONS</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">{rows}</table>
</td></tr></table>"""


# =====================================================================
# the email body
# =====================================================================

def build_email_html(data, m, txm, gen_s, asat_s, cfg):
    W = CONFIG["width"]
    CW = W - 48          # content width inside padding
    vt = v18.CONFIG
    tgt = vt["availability_target"]
    hs = m["health"]
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
<div style="{FONT}font-size:11px;color:#8395A6;padding-top:10px;line-height:1.6;">Generated: <b style="color:#FFFFFF;">{esc(gen_s)}</b> &nbsp;|&nbsp; Data as at: <b style="color:#FFFFFF;">{esc(asat_s)}</b> (workbook file time) &nbsp;|&nbsp; Author: <b style="color:#FFFFFF;">Andrew Fisher</b></div>
</td></tr></table>""")

    # KEY strip + rule
    key_cols = {"orange": "#F36F21", "blue": "#2F7FD0",
                "amber": "#E0930F", "green": "#16A34A"}
    key_bits = "&nbsp;&nbsp;".join(
        f'<span style="color:{key_cols[c]};">&#9679; <b>{esc(t)}</b></span> '
        f'<span style="color:#7A8A9A;">{esc(x)}</span>'
        for c, t, x in cfg["key_items"])
    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="{FONT}font-size:10px;padding:12px 2px 8px 2px;line-height:1.9;">
<span style="color:#8A9AAC;font-weight:bold;letter-spacing:1.5px;">KEY</span>&nbsp;&nbsp;{key_bits}</td></tr>
<tr><td>{rule_png(CW)}</td></tr></table>""")

    # ---------- position + scorecard -----------------------------------
    parts.append(callout(
        f'<span style="color:#D95F14;font-weight:bold;text-transform:uppercase;">The position today.</span> '
        f'One page, one honest answer: how healthy is the {esc(cfg["client"])} gas '
        f'monitor operation right now? Every score below is arithmetic on real '
        f'SiteIQ events - the formula sits beside each number, so it can be '
        f'challenged, checked and trusted. <b>{num(m["fleet_total"])} monitors</b> '
        f'in the fleet, {o(num(m["onhire_all"]) + " out")} across all custody '
        f'types, <b>{num(m["available"])} on the shelf</b> and '
        f'{o(num(m["outstanding"]) + " outstanding")} from previous days.'))

    srows = "".join([
        score_bar_row("Tool availability", m["score_availability"],
                      f'{m["available"]} in store against a {tgt}-unit target '
                      f'for a full score'),
        score_bar_row("Returns / recovery", m["score_recovery"],
                      f'{m["recovered"]} of {m["prev_day_total"]} previous-day '
                      f'non-returns recovered so far today'),
        score_bar_row("Repairs", m["score_repairs"],
                      f'100 less the {m["fleet_impact_pct"]}% of fleet in repair '
                      f'({m["repairs"]} of {m["fleet_total"]})'),
        score_bar_row("30+ day control", m["score_30"],
                      f'100 less 3 per monitor out 30 days or more '
                      f'({m["out_30"]} out)'),
    ])
    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;"><tr>
<td width="200" align="center" style="vertical-align:top;padding-top:6px;">
{donut_png(hs, k2.health_hex(hs), f"{hs}%", k2.health_word(hs))}
<div style="{FONT}font-size:10.5px;color:#98A6B4;padding-top:8px;">Gas monitor health score</div></td>
<td style="vertical-align:top;padding-left:16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">{srows}</table></td>
</tr></table>
{note(f'Health score is the plain average of the four scores - <b style="color:#16202C;">({m["score_availability"]} + {m["score_recovery"]} + {m["score_repairs"]} + {m["score_30"]}) &divide; 4 = {hs}</b>. Nothing is weighted and nothing is hidden.')}""")

    # fleet band + tiles
    parts.append(subh("The fleet at a glance - where every monitor is"))
    parts.append(panel(band_png([
        ("On hire - general", m["onhire_general"], K["orange"]),
        ("FCCU", m["fccu"], K["blue"]),
        ("Ops", m["ops"], K["amber"]),
        ("Future Fuels", m["ff"], K["lime"]),
        ("Available", m["available"], K["green"]),
        ("Repairs", m["repairs"], K["red"]),
    ], CW - 28)))
    parts.append(tiles([
        (num(m["fleet_total"]), "Total fleet", "all custody types", "#7A8A9A"),
        (num(m["available"]), "Available in store", "ready for issue",
         "#22C55E" if m["available"] else "#F0603E"),
        (num(m["onhire_general"]), "On hire - general",
         f'{m["issued_today"]} today + {m["outstanding"]} outstanding', "#7A8A9A"),
        (num(m["outstanding"]), "Outstanding", "action required",
         "#F0603E" if m["outstanding"] else "#22C55E"),
    ]))

    # ---------- return cycle + alerts ----------------------------------
    parts.append(sect("Yesterday and today - the return cycle"))
    parts.append(tiles([
        (num(m["issued_today"]), "Issued so far today", "", ""),
        (num(m["prev_day_total"]), "Previous-day non-returns", "yesterday total", "#7A8A9A"),
        (num(m["recovered"]), "Recovered today",
         f'{m["recovery_rate"]}% recovery rate',
         "#22C55E" if m["recovery_rate"] >= 50 else "#F0603E"),
        (num(m["yday_still_out"]), "Still out from yesterday", "same person",
         "#F0603E" if m["yday_still_out"] else "#22C55E"),
    ]))
    parts.append(note(
        f'Cycle check: <b style="color:#16202C;">{m["prev_day_total"]} = '
        f'{m["recovered"]} recovered + {m["yday_still_out"]} still out</b> '
        f'&mdash; {"balances" if m["validation_pass"] else "DOES NOT BALANCE"}. '
        f'Gas monitors come back {o("daily")} for bump testing, charging and '
        f'inspection - one out overnight is a safety-critical follow-up.'))

    al = []
    if m["yday_still_out"]:
        al.append(("#F0603E", f'{m["yday_still_out"]} monitors still out from yesterday',
                   "Previous-day non-returns not yet recovered - every one is "
                   "named below. Chase at prestart."))
    if m["out_30"]:
        al.append(("#F0603E", f'{m["out_30"]} monitors out 30 days or more',
                   f'Charge exposure {money(m["exposure"])} at '
                   f'${vt["charge_per_unit"]:,} per unit. Recovery conversation, '
                   f'not a debt notice.'))
    if m["out_8_29"]:
        al.append(("#EFA82B", f'{m["out_8_29"]} monitors out 8-29 days',
                   "Follow-up window - these become 30+ if nobody rings."))
    if m["repairs"]:
        al.append(("#EFA82B", f'{m["repairs"]} monitors in repair or out of service',
                   f'Largest category: {esc(m["repair_top"])}. '
                   f'{m["fleet_impact_pct"]}% of the fleet unavailable.'))
    if m["available"] < tgt:
        al.append(("#3D8BD4", f'{m["available"]} on the shelf against a {tgt}-unit target',
                   "Availability keeps work fronts moving - restock or pull "
                   "recovery forward."))
    for w in m["warnings"]:
        al.append(("#3D8BD4", "Source reconciliation variance", esc(w)))
    parts.append(alerts_panel(al))

    # ---------- yesterday named ----------------------------------------
    comps = data["companies"]
    yday = sorted([c for c in comps if c["prev_day"] > 0],
                  key=lambda c: -c["prev_day"])
    parts.append(sect("Yesterday's non-returns - named"))
    parts.append(callout(
        f'{o(str(sum(c["prev_day"] for c in yday)) + " monitors")} from '
        f'yesterday were not returned by end of shift and '
        f'{o(str(m["recovered"]) + " have been recovered")} so far today. '
        f'This is the prestart chase list - each name is a safety conversation '
        f'first and a hire conversation second.', tight=True))
    parts.append(dtable(
        ["Company", "Units", "Who has them (units each)"],
        [[esc(c["name"]),
          f'<span style="color:#DC2626;font-weight:bold;">{c["prev_day"]}</span>',
          esc(c["prev_day_names"])] for c in yday],
        ["", "r", ""]))

    # ---------- 30-day pattern ------------------------------------------
    nr = sorted([c for c in comps if c["nrsd"] > 0], key=lambda c: -c["nrsd"])[:8]
    issued_all = sum(c["issued"] for c in comps)
    nrsd_all = sum(c["nrsd"] for c in comps)

    def off_short(s, keep=3):
        bits = [b.strip() for b in str(s or "").split(",") if b.strip()]
        return ", ".join(bits[:keep]) + (f" &middot; +{len(bits) - keep} more"
                                         if len(bits) > keep else "")
    nrows = []
    for c in nr:
        act = str(c["reoffender_action"] or "").strip()
        flag = (f'<br><span style="{FONT}font-size:10px;color:#D95F14;'
                f'font-weight:bold;">{esc(act)}</span>'
                if act and act.lower() not in ("no reoffender action", "none", "-")
                else "")
        nrows.append([f'{esc(c["name"])}{flag}', num(c["issued"]),
                      f'<b>{num(c["nrsd"])}</b>', esc(c["nrsd_pct"]),
                      off_short(c["top_offenders"])])
    parts.append(sect("The same-day pattern - last 30 days"))
    parts.append(callout(
        f'Across the last 30 days, {o(num(nrsd_all))} of <b>{num(issued_all)}</b> '
        f'issues ({nrsd_all / issued_all * 100:.1f}%) were not returned on the '
        f'day they went out. Top offenders named per company - the same names '
        f'keep appearing. Reoffender flags are the workbook&rsquo;s own.',
        tight=True))
    parts.append(dtable(
        ["Company", "Issued", "Not ret. same day", "Rate", "Top offenders (units)"],
        nrows, ["", "r", "r", "r", ""]))

    # ---------- analytics (if transactions present) ---------------------
    if txm:
        t = txm
        win = (f'{t["window_start"].strftime("%d %b")} - '
               f'{t["window_end"].strftime("%d %b %Y")}')
        rec = t["record_hour"]
        parts.append(sect("The daily rhythm - when monitors move"))
        parts.append(callout(
            f'<b>{num(t["n_crew"])} crew movements</b> since '
            f'{win.split(" - ")[0]}: {o(str(t["pct_before_6"]) + "% of issues happen before 06:00")}, '
            f'median out <b>{t["median_issue"]}</b>, median back '
            f'<b>{t["median_return"]}</b>. Record hour: {o(str(rec["n"]) + " issues")} '
            f'on {rec["date"].strftime("%a %d %b")} '
            f'{rec["hour"]:02d}:00-{rec["hour"] + 1:02d}:00 - one every '
            f'<b>{rec["every_s"]} seconds</b>.', tight=True))
        parts.append(panel(hours_png(t["hour_issues"], t["hour_returns"], CW - 28)))

        parts.append(sect("The pressure curve - why the store runs dry"))
        parts.append(callout(
            f'By mid-morning an {o("average working day is " + str(int(round(t["net_plateau"]))) + " monitors deeper")} '
            f'into the shelf than it started; the worst recent day dug to '
            f'{o(str(int(round(t["net_plateau_worst"]))))} - against '
            f'<b>{num(m["available"])} on the shelf this morning</b>. The '
            f'availability target has been reset to <b>{num(tgt)}</b> on this '
            f'data - the old target of 50 scored the shelf 100/100 while crews '
            f'were being turned away.', tight=True))
        xl = [f"{int(hh):02d}:00" if (int(hh) % 2 == 1 and hh == int(hh)) else ""
              for hh, _ in t["net_curve"]]
        parts.append(panel(line_png(
            xl,
            [{"vals": [v for _, v in t["net_curve_worst"]], "colour": K["red"],
              "label": "Worst day", "fill": False},
             {"vals": [v for _, v in t["net_curve"]], "colour": K["orange"],
              "label": "Average day", "fill": True}], CW - 28)))
        parts.append(tiles([
            (num(int(round(t["net_plateau"]))), "Avg net draw by mid-morning",
             "issues less returns, same day", "#EFA82B"),
            (num(int(round(t["net_plateau_worst"]))), "Worst recent day",
             "same measure", "#F0603E"),
            (num(m["available"]), "On the shelf this morning",
             "from the live register", "#F0603E"),
            (num(tgt), "New availability target", "was 50 - reset on this data",
             "#7A8A9A"),
        ]))

        rp = t["record_peak"]
        usable = m["fleet_total"] - m["repairs"]
        peaks = t["day_peaks"]
        step = max(1, len(peaks) // 90)
        pk = peaks[::step]
        plabels = [p2["date"].strftime("%d %b")
                   if i % max(1, len(pk) // 8) == 0 else ""
                   for i, p2 in enumerate(pk)]
        parts.append(sect("Demand - monitors out at once, whole period"))
        parts.append(callout(
            f'Peak concurrent demand is brushing the ceiling: the record is '
            f'{o(num(rp["peak"]) + " monitors out at once")} at '
            f'{rp["at"].strftime("%H:%M on %a %d %b")} - against '
            f'<b>{num(m["fleet_total"])} owned</b> and only '
            f'{o(num(usable) + " usable")} once repairs are set aside. At that '
            f'moment the site held all but <b>{num(usable - rp["peak"])}</b> of '
            f'every usable monitor.', tight=True))
        parts.append(panel(line_png(
            plabels,
            [{"vals": [p2["peak"] for p2 in pk], "colour": K["orange"],
              "label": "Daily peak out", "fill": True}], CW - 28)))

        wk = t["weekly_sd"]
        partial = (" (current week is partial - it will move)"
                   if t["current_week_partial"] else "")
        parts.append(sect("Same-day returns - which way is it trending"))
        parts.append(callout(
            f'{o(str(t["same_day_pct"]) + "%")} of crew draws come back the '
            f'same day across the whole period - the mid-campaign slump in the '
            f'low 70s has been pulled back to the mid 80s. Each point is '
            f'<b>same-day returns &divide; completed draws</b> for that '
            f'week{partial}.', tight=True))
        parts.append(panel(line_png(
            [w2["label"] for w2 in wk],
            [{"vals": [w2["pct"] for w2 in wk], "colour": K["green"],
              "label": "Same-day %", "fill": True}], CW - 28, pct=True,
            annotate=True)))
        parts.append(subh("How long monitors stay out",
                          "&mdash; every completed crew draw"))
        parts.append(panel(hbars_png(t["dur_buckets"], CW - 28, K["amber"])))

        def _is_account(name):
            n = name.lower()
            return ("fccu" in n or "t&i" in n or "operations" in n
                    or "future fuels" in n or "tool store" in n)
        lg = [x for x in t["league"] if x["not_sd"] > 0
              and not _is_account(x["name"])][:12]
        lrows = []
        for x in lg:
            pc = ("#16A34A" if x["sd_pct"] >= 85 else
                  "#D9880B" if x["sd_pct"] >= 70 else "#DC2626")
            lrows.append([
                s2(esc(x["name"]), esc(x["co"])),
                num(x["draws"]),
                f'<span style="color:{pc};font-weight:bold;">{x["sd_pct"]}%</span>',
                num(x["ov"]),
                (f'<span style="color:#DC2626;font-weight:bold;">{num(x["open"])}</span>'
                 if x["open"] else '<span style="color:#98A6B4;">0</span>'),
                f'{num(x["maxd"])}d'])
        parts.append(sect("The people who don't bring them back"))
        parts.append(callout(
            'The behaviour league from every crew transaction: ranked by draws '
            'kept overnight or longer plus draws still open now. Same names the '
            'workbook flags - two independent sources, one answer. This is who '
            'the return-daily conversation belongs to, by name.', tight=True))
        parts.append(dtable(
            ["Who", "Draws", "Same-day", "Kept overnight+", "Still out", "Longest"],
            lrows, ["", "r", "r", "r", "r", "r"]))
        lk = t["longest_kept"]
        parts.append(note(
            f'Named people only - internal Dr&auml;ger service accounts and '
            f'shared workflow accounts are excluded; they are covered in the '
            f'company tables. Longest completed hold on record: '
            f'<b style="color:#16202C;">{(lk["en"] - lk["st"]).days} days</b> by '
            f'<b style="color:#16202C;">{esc(lk["who"])}</b> ({esc(lk["co"])}).'
            if lk else 'Named people only.'))

    # ---------- ageing + priorities ------------------------------------
    parts.append(sect("Ageing and recovery priorities"))
    parts.append(dtable(
        ["1-7 Days (Watch)", "8-29 Days (Follow up)", "30+ Days (Action needed)"],
        [[f'<span style="font-size:17px;font-weight:bold;">{num(m["out_1_7"])}</span>',
          f'<span style="font-size:17px;font-weight:bold;">{num(m["out_8_29"])}</span>',
          f'<span style="font-size:17px;font-weight:bold;">{num(m["out_30"])}</span>']],
        ["c", "c", "c"]))
    prows = []
    for c in m["priorities"]:
        u = c.get("urgency", "Watch")
        uc = {"Critical": "#DC2626", "High": "#D9880B", "Watch": "#16A34A"}[u]
        prows.append([esc(c["name"]),
                      f'<span style="color:{uc};font-weight:bold;">{u}</span>',
                      num(c["d1_7"]), num(c["d8_29"]), num(c["d30"]),
                      money(c["charge"]) if c["charge"] else
                      '<span style="color:#98A6B4;">$0</span>'])
    parts.append(dtable(
        ["Company", "Urgency", "1-7d", "8-29d", "30+d", "Charge exposure"],
        prows, ["", "", "r", "r", "r", "r"]))
    parts.append(note(
        f'Charge exposure <b style="color:#16202C;">{money(m["exposure"])}</b> '
        f'&mdash; {m["out_30"]} monitors at 30+ days at '
        f'${vt["charge_per_unit"]:,} per unit from the workbook. Ranked by '
        f'exposure then outstanding count.'))

    # ---------- outstanding detail -------------------------------------
    rows = k2.norm_rows(data)
    priced = [r for r in rows if r["cost"] is not None]
    tbc = len(rows) - len(priced)
    drows = []
    for r in rows:
        dc = ("#DC2626" if r["days"] >= 30 else
              "#D9880B" if r["days"] >= 8 else "#26313D")
        drows.append([
            s2(esc(r["desc"]), esc(r["company"])),
            s2(esc(r["barcode"]), esc(r["serial"])),
            esc(r["hirer"]),
            s2(f'<span style="color:{dc};font-weight:bold;">{r["days"]}d</span>',
               esc(k2.fmt_date(r["date"]))),
            money(r["cost"]) if r["cost"] is not None else
            '<span style="color:#98A6B4;">TBC</span>'])
    parts.append(sect("On hire and not yet returned - oldest first"))
    parts.append(dtable(
        ["Description", "Asset / serial", "Hirer", "On hire", "Replacement cost"],
        drows, ["", "", "", "", "r"]))
    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="{FONT}font-size:13px;font-weight:bold;color:#16202C;padding:12px 10px;border-bottom:1px solid #E8EBEF;">Replacement cost exposure - if nothing came back</td>
<td align="right" style="padding:12px 10px;border-bottom:1px solid #E8EBEF;"><span style="{FONT}background-color:#FFF35C;font-size:13px;font-weight:bold;color:#16202C;padding:3px 8px;">{money(sum(r["cost"] for r in priced))}</span></td></tr></table>
{note(f'{tbc} item(s) show TBC - no replacement cost in the source, so they are <b style="color:#16202C;">excluded</b> from the total rather than guessed. {num(len(priced))} of {num(len(rows))} items are priced.')}""")

    # ---------- repairs -------------------------------------------------
    parts.append(sect("Out of service - what is in the workshop"))
    parts.append(callout(
        f'<b>{num(m["repairs"])} monitors</b> out of service - '
        f'{o(str(m["fleet_impact_pct"]) + "%")} of the fleet a crew cannot '
        f'take. Largest category: <b>{esc(m["repair_top"])}</b>.', tight=True))
    parts.append(panel(hbars_png(m["repair_cats"], CW - 28, K["orange"])))

    # ---------- footer ---------------------------------------------------
    team_line = " &middot; ".join(
        f'<b style="color:#16202C;">{esc(p["name"])}</b> '
        f'<span style="color:#8A9AAC;">{esc(p["role"])}</span>'
        for p in cfg["team"])
    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:26px;">
<tr><td style="border-top:1px solid #E4E8EC;padding-top:10px;">
<div style="{FONT}font-size:10px;font-weight:bold;letter-spacing:2px;color:#F36F21;text-transform:uppercase;">Your Coates Tool Store Team</div>
<div style="{FONT}font-size:11px;color:#8A9AAC;padding-top:5px;line-height:1.7;">{team_line}</div>
<div style="{FONT}font-size:10px;color:#98A6B4;padding-top:9px;line-height:1.7;">
Coates Hire &middot; 340 Curtin Ave W, Eagle Farm, QLD 4009 &middot; {esc(vt["author_email"])} &middot; {esc(vt["author_mobile"])}<br>
Sources: Ampol Gas Monitor workbook ({esc(asat_s)}), SiteIQ RENTAL_STOCK and TRANSACTIONS exports. Figures counted from detail tabs and cross-validated; any variance is flagged above, never hidden. The Coates Way - consistent execution, every day. <b style="color:#16202C;">POWERED BY SITEIQ</b></div>
</td></tr></table>""")

    body = "".join(f'<tr><td style="padding:0 24px;">{p}</td></tr>'
                   if not p.startswith('<table role="presentation" width="100%" cellspacing="0" cellpadding="0">\n<tr><td bgcolor="#1A2430"')
                   else f'<tr><td>{p}</td></tr>'
                   for p in parts)
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
    # WHY (12 Aug 2026): everything this script writes - and the PDF it
    # attaches - lives in the suite's dated report folder now.
    out_dir = ampol_paths.day_folder("Gas_Monitors")

    print("=" * 68)
    print("COATES HOUSE-STYLE EMAIL - AMPOL GAS MONITOR OPERATIONS")
    print("=" * 68)

    wb_path = v18.find_workbook(vt)
    mt = datetime.fromtimestamp(os.path.getmtime(wb_path))
    asat_s = mt.strftime("%d %b %Y %H:%M")
    gen_s = datetime.now().strftime("%d %b %Y %H:%M")
    print(f"Workbook             : {os.path.basename(wb_path)}")
    print(f"Data as at           : {asat_s}")

    data = v18.load_data(wb_path)
    m = v18.compute_metrics(data, vt)
    print(f"Health score         : {m['health']}/100")

    txm = None
    tx_found = False
    for folder in v18.search_dirs():
        cands = [os.path.join(folder, n) for n in os.listdir(folder)
                 if n.upper().startswith("TRANSACTIONS")
                 and n.lower().endswith(".xlsx") and not n.startswith("~$")
                 and not n.lower().startswith("source_")]
        if cands:
            tx_found = True
            cands.sort(key=os.path.getmtime, reverse=True)
            ser = ""
            for f2 in v18.search_dirs():
                s = [os.path.join(f2, n) for n in os.listdir(f2)
                     if "serial" in n.lower() and n.lower().endswith(".xlsx")
                     and not n.startswith("~$")]
                if s:
                    # WHY (12 Aug 2026): sort by mtime like every other
                    # search - this one used to take whatever order the
                    # folder listing gave.
                    s.sort(key=os.path.getmtime, reverse=True)
                    ser = s[0]
                    break
            tx, _ = gtx.load_transactions(cands[0], gtx.load_serial_assets(ser))
            # WHY (12 Aug 2026): an export with no gas monitor rows used to
            # crash the analytics maths. Treat it exactly like a missing
            # TRANSACTIONS.xlsx: skip the analytics sections, say so plainly.
            if not tx:
                print("Transactions         : export found but holds no gas")
                print("                       monitor rows - analytics skipped")
            else:
                txm = gtx.compute_tx(tx)
                if txm["n_crew"] == 0:
                    print("Transactions         : internal movements only - "
                          "analytics skipped")
                    txm = None
                else:
                    print(f"Transactions         : {txm['n_all']:,} gas monitor "
                          f"({txm['n_crew']:,} crew) - analytics included")
            break
    if not tx_found:
        print("Transactions         : none found - analytics sections skipped")

    html = build_email_html(data, m, txm, gen_s, asat_s, cfg)

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
    msg.set_content("This report is best viewed in HTML. The source workbook "
                    "and the PDF report are attached.\n")
    msg.add_alternative(html, subtype="html")
    with open(wb_path, "rb") as f:
        msg.add_attachment(f.read(), maintype="application",
                           subtype="vnd.ms-excel.sheet.macroenabled.12",
                           filename=os.path.basename(wb_path))
    pdf_path = os.path.join(out_dir, cfg["pdf_name"])
    if CONFIG["attach_pdf"] and os.path.exists(pdf_path):
        with open(pdf_path, "rb") as f:
            msg.add_attachment(f.read(), maintype="application",
                               subtype="pdf",
                               filename=os.path.basename(pdf_path))
        print(f"PDF attached         : {os.path.basename(pdf_path)}")
    else:
        print("PDF attached         : no (build the PDF first for the "
              "attachment)")

    eml_path = os.path.join(out_dir, CONFIG["eml_name"])
    with open(eml_path, "wb") as f:
        f.write(msg.as_bytes())
    print(f"EML written          : {eml_path}  "
          f"({os.path.getsize(eml_path):,} bytes)")

    # WHY (12 Aug 2026): the shared MAKE_OUTLOOK_DRAFTS button reads a
    # .draft.json manifest from the same Reports folder and turns it into a
    # native Outlook DRAFT - subject, body, attachments, To. Nothing sends
    # itself, same discipline as the .eml. The workbook is copied in beside
    # it so the manifest can attach it by basename, and the dated folder
    # then also keeps the exact data this report was built from.
    wb_copy = os.path.join(out_dir, os.path.basename(wb_path))
    if os.path.abspath(wb_path) != os.path.abspath(wb_copy):
        shutil.copy2(wb_path, wb_copy)
    attachments = []
    if CONFIG["attach_pdf"] and os.path.exists(pdf_path):
        attachments.append(os.path.basename(pdf_path))
    attachments.append(os.path.basename(wb_copy))
    manifest = {
        "subject": subject,
        "body": os.path.basename(html_path),
        "attachments": attachments,
        "to": "; ".join(vt["recipients"]),
    }
    man_path = os.path.join(out_dir,
                            "Coates_Ampol_GasMonitor_Operations.draft.json")
    with open(man_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=1)
    print(f"Draft manifest       : {man_path}")
    print("")
    print("NEXT STEP: double-click the .eml, check it, press Send.")
    print("Done. The Coates Way - consistent execution, every day.")


if __name__ == "__main__":
    # WHY (12 Aug 2026): a failed run must exit nonzero so the suite's
    # buttons can see it - the old block printed the error and exited 0,
    # which made failures look like passes. The keep-window-open pause is
    # gone too: the .bat buttons own the pause now.
    try:
        main()
    except SystemExit:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(f"ERROR: {e}")
