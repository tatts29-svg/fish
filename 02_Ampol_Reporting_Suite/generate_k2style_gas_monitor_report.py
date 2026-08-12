#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
COATES K2-STYLE REPORT - AMPOL GAS MONITOR OPERATIONS
Workbook in -> Coates house-style PDF out
=====================================================================
Author: Andrew Fisher
The Coates Way - Operational Excellence - POWERED BY SITEIQ

WHAT THIS IS
  The Ampol gas monitor report rendered in the SAME house style as the
  K2 report family (Executive Summary, Stores Stocktake, Store
  Consumables, Company On-Hire): white A4 pages inside the orange
  Coates frame, dark header panel, KEY strip, gradient rule, peach
  callouts, dark KPI tiles with proper icons, scorecard donut with the
  formula printed beside every score, zebra tables and the tool store
  team footer.

WHERE THE NUMBERS COME FROM
  This script does NOT re-implement any counting. It imports
  generate_v18_gas_monitor_report and calls its load_data() and
  compute_metrics(), so the PDF and the V18 dashboard can never
  disagree - one engine, two skins. Change a business rule once, in
  the V18 CONFIG, and both outputs follow.

  Every score prints its own arithmetic underneath it, the K2 way, so
  the number can be challenged, checked and trusted.

  Nothing is estimated. A replacement cost the source does not carry
  shows as TBC and is EXCLUDED from the exposure total, never guessed.

USAGE
  Double-click RUN_REPORT.bat - it builds the V18 email dashboard and
  then this PDF. Or on its own:
      python generate_k2style_gas_monitor_report.py

DEPENDENCIES
  pip install openpyxl pillow weasyprint
  Offline at run time. No web fonts, no CDN, no API calls.
=====================================================================
"""

import html as _html
import re
import os
import sys
from datetime import datetime

# The V18 script is the metrics engine. Importing it is deliberate -
# it guarantees the PDF and the emailed dashboard show the same figures.
try:
    import generate_v18_gas_monitor_report as v18
except ImportError:
    sys.exit("ERROR: generate_v18_gas_monitor_report.py must sit in the same\n"
             "  folder as this script - it is the metrics engine for the PDF.\n"
             "  Keep the kit folder together and run RUN_REPORT.bat.")

# The transactions analytics module - flow, rhythm, behaviour. Optional:
# without TRANSACTIONS.xlsx the report still builds, minus those pages.
try:
    import gasmon_transactions as gtx
except ImportError:
    gtx = None

# ---------------------------------------------------------------------
# PDF engines. WeasyPrint is used when it actually works; on a standard
# Coates Windows laptop it usually does NOT (it needs GTK system
# libraries that pip cannot install), so the kit falls back to Microsoft
# Edge in headless mode - already on every Coates laptop, no installs.
# The import AND a render are both guarded: on Windows WeasyPrint can
# import fine and still die loading DLLs at render time.
# ---------------------------------------------------------------------
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

    # --- The tool store team on the footer and the team page ---------
    # ONLY Andrew is listed. The K2 footer names the Gladstone crew;
    # putting them on an Ampol report would be wrong, so the Ampol
    # store team is left for Andrew to fill in. Add entries as:
    #   {"name": ..., "role": ..., "shift": "DAY"/"NIGHT"/"",
    #    "email": ..., "blurb": ...}
    "team": [
        {"name": "Andrew Fisher", "role": "Shutdown Manager",
         "shift": "", "email": "andrew.fisher@coates.com.au",
         "blurb": "Oversees the store and the fleet - anything at all, start here",
         "lead": True},
    ],

    # --- KEY strip. Andrew's own operating disciplines from V18. -----
    "key_items": [
        ("orange", "RETURN DAILY", "back to the tool store every shift"),
        ("blue", "BUMP TEST", "bump, charge and scan before issue"),
        ("amber", "OUT OF CALIBRATION", "out of calibration is out of service"),
    ],
}

# ---------------------------------------------------------------------
# Palette - matched to the K2 reports
# ---------------------------------------------------------------------

K = {
    "orange": "#F36F21", "green": "#1FA75A", "amber": "#F5A623",
    "red": "#EF4444", "blue": "#3D8BD4", "lime": "#C8DA2C",
    "track": "#1E2733", "ink": "#16202C",
}


# =====================================================================
# small helpers
# =====================================================================

def esc(s):
    return _html.escape("" if s is None else str(s))


def money(n):
    try:
        return f"${int(round(float(n))):,}"
    except (TypeError, ValueError):
        return "TBC"


def num(n):
    try:
        return f"{int(n):,}"
    except (TypeError, ValueError):
        return str(n)


def rag(score):
    """Score-bar RAG, matched to the K2 Executive Summary bars:
    green from 85, amber from 50, red below 50."""
    return "green" if score >= 85 else "amber" if score >= 50 else "red"


def rag_health(score):
    """The overall health donut runs harder than the individual bars -
    K2 shows 60% as a red ACTION ring, so red holds until 70."""
    return "green" if score >= 85 else "amber" if score >= 70 else "red"


def rag_hex(score):
    return {"green": K["green"], "amber": K["amber"], "red": K["red"]}[rag(score)]


def health_hex(score):
    return {"green": K["green"], "amber": K["amber"], "red": K["red"]}[rag_health(score)]


def health_word(score):
    return {"green": "ON TRACK", "amber": "WATCH", "red": "ACTION"}[rag_health(score)]


def initials(name):
    bits = [b for b in str(name).replace("-", " ").split() if b]
    return (bits[0][0] + bits[-1][0]).upper() if len(bits) > 1 else (bits[0][:2].upper() if bits else "??")


def fmt_date(d):
    """Australian date, K2 style: 30 Jul 2026. Never US-parsed."""
    if d is None or d == "":
        return ""
    if isinstance(d, datetime):
        return d.strftime("%d %b %Y")
    s = str(d).strip()
    for f in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%d/%m/%Y %H:%M:%S",
              "%d/%m/%Y", "%d/%m/%y"):
        try:
            return datetime.strptime(s, f).strftime("%d %b %Y")
        except ValueError:
            continue
    return s[:24]


# =====================================================================
# Icons - inline SVG, stroke style, drawn once here so every tile gets
# a crisp orange icon instead of a thin text glyph.
# =====================================================================

_ICON_PATHS = {
    "box":    '<path d="M21 8.2 12 3 3 8.2v7.6L12 21l9-5.2z"/>'
              '<path d="M3 8.2l9 5.2 9-5.2"/><path d="M12 13.4V21"/>',
    "check":  '<path d="M4.5 12.5l5 5L19.5 6.5"/>',
    "swap":   '<path d="M17 2.5l4 4-4 4"/><path d="M21 6.5H8.5a4 4 0 0 0-4 4v1"/>'
              '<path d="M7 21.5l-4-4 4-4"/><path d="M3 17.5h12.5a4 4 0 0 0 4-4v-1"/>',
    "warn":   '<path d="M12 3.5 2.5 20h19z"/><path d="M12 9.5v4.5"/>'
              '<path d="M12 17.2v.05"/>',
    "clock":  '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 3.2"/>',
    "people": '<circle cx="9" cy="8" r="3.4"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0"/>'
              '<circle cx="17.3" cy="9.2" r="2.5"/><path d="M15.8 14.8a5 5 0 0 1 5.4 4.6"/>',
    "wrench": '<path d="M14.5 6.5a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.6-3.6a6 6 0 0 1-7.9 7.9L6.3 20.7a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
    "shield": '<path d="M12 21.5s7.5-3.3 7.5-9.3V5.5L12 2.8 4.5 5.5v6.7c0 6 7.5 9.3 7.5 9.3z"/>',
    "bars":   '<path d="M6 20V10"/><path d="M12 20V4.5"/><path d="M18 20v-6.5"/>',
    "zap":    '<path d="M13 2.5 3.5 14H10l-1 7.5L18.5 10H12z"/>',
    "layers": '<path d="M12 2.8 21.5 8 12 13.2 2.5 8z"/><path d="M2.5 13.5 12 18.7l9.5-5.2"/>',
    "diamond":'<path d="M12 2.5 21.5 12 12 21.5 2.5 12z"/>',
}


def icon(name, colour="#F36F21", size=17):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" '
            f'stroke="{colour}" stroke-width="2" stroke-linecap="round" '
            f'stroke-linejoin="round">{_ICON_PATHS[name]}</svg>')


# =====================================================================
# SVG pieces - inline, so the PDF stays self-contained
# =====================================================================

def donut(pct, colour, centre, label, size=138, thick=19):
    """K2 scorecard donut: dark track, coloured arc, big % in the middle."""
    pct = max(0, min(100, pct))
    r = (size - thick) / 2.0
    c = size / 2.0
    circ = 2 * 3.141592653589793 * r
    on = circ * pct / 100.0
    return f"""<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}">
  <circle cx="{c}" cy="{c}" r="{r}" fill="#141C26" stroke="{K['track']}"
          stroke-width="{thick}"/>
  <circle cx="{c}" cy="{c}" r="{r}" fill="none" stroke="{colour}"
          stroke-width="{thick}" stroke-linecap="round"
          stroke-dasharray="{on:.2f} {circ - on:.2f}"
          transform="rotate(-90 {c} {c})"/>
  <text x="{c}" y="{c + 1}" text-anchor="middle" fill="#FFFFFF"
        font-family="Lato, Calibri, sans-serif" font-size="27" font-weight="700">{centre}</text>
  <text x="{c}" y="{c + 17}" text-anchor="middle" fill="#8A9AAC"
        font-family="Lato, Calibri, sans-serif" font-size="7.6"
        letter-spacing="1.6">{esc(label)}</text>
</svg>"""


def stackband(segs, w=636, bh=38):
    """One rounded horizontal band split into proportional segments -
    the fleet-composition strip on page 1. segs: (label, value, colour)."""
    total = sum(v for _, v, _ in segs) or 1
    h = bh + 42
    out = [f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">',
           f'<defs><clipPath id="band"><rect x="0" y="0" width="{w}" '
           f'height="{bh}" rx="7"/></clipPath></defs>',
           f'<g clip-path="url(#band)">']
    x = 0.0
    for lab, v, col in segs:
        seg_w = w * v / total
        out.append(f'<rect x="{x:.1f}" y="0" width="{seg_w + 1:.1f}" '
                   f'height="{bh}" fill="{col}"/>')
        if seg_w > 34:
            out.append(f'<text x="{x + seg_w / 2:.1f}" y="{bh / 2 + 4:.1f}" '
                       f'text-anchor="middle" fill="#FFFFFF" '
                       f'font-family="Lato, Calibri, sans-serif" font-size="11" '
                       f'font-weight="700">{v}</text>')
        x += seg_w
    out.append('</g>')
    # legend, one row
    lx = 0
    ly = bh + 26
    for lab, v, col in segs:
        out.append(f'<circle cx="{lx + 4}" cy="{ly - 3}" r="3.8" fill="{col}"/>')
        t = f"{lab} {v}"
        out.append(f'<text x="{lx + 12}" y="{ly}" fill="#C9D6E2" '
                   f'font-family="Lato, Calibri, sans-serif" font-size="8.8">{esc(t)}</text>')
        lx += 12 + 5.2 * len(t) + 16
    out.append("</svg>")
    return "".join(out)


def grouped_bars(rows, w=636, h=190, series=(("issued", "#F36F21", "Issued"),
                                             ("returned", "#22C55E", "Returned"))):
    """Grouped bar chart on a dark panel - K2 'issued v returned' pattern."""
    if not rows:
        return '<div class="note">No movement recorded in the source.</div>'
    top = 32
    base = h - 26
    pad_l = 6
    plot_w = w - pad_l - 10
    slot = plot_w / len(rows)
    gap = slot * 0.2
    bw = (slot - gap) / len(series)
    mx = max(max(r.get(k, 0) or 0 for k, _, _ in series) for r in rows) or 1
    out = [f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    for g in (0.25, 0.5, 0.75, 1.0):
        y = base - (base - top) * g
        out.append(f'<line x1="{pad_l}" y1="{y:.1f}" x2="{w - 10}" y2="{y:.1f}" '
                   f'stroke="#26313D" stroke-width="0.7"/>')
    out.append(f'<line x1="{pad_l}" y1="{base}" x2="{w - 10}" y2="{base}" '
               f'stroke="#3A4756" stroke-width="1"/>')
    for i, rw in enumerate(rows):
        x0 = pad_l + i * slot + gap / 2
        for j, (kk, col, _) in enumerate(series):
            v = rw.get(kk, 0) or 0
            bar_h = (base - top) * (v / mx)
            x = x0 + j * bw
            y = base - bar_h
            out.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{bw - 2:.1f}" '
                       f'height="{bar_h:.1f}" fill="{col}" rx="2"/>')
            if v:
                out.append(f'<text x="{x + (bw - 2) / 2:.1f}" y="{y - 4:.1f}" '
                           f'text-anchor="middle" fill="#C9D6E2" '
                           f'font-family="Lato, Calibri, sans-serif" font-size="7.6">{v}</text>')
        out.append(f'<text x="{x0 + (slot - gap) / 2:.1f}" y="{base + 13:.1f}" '
                   f'text-anchor="middle" fill="#8A9AAC" '
                   f'font-family="Lato, Calibri, sans-serif" font-size="7.4">'
                   f'{esc(rw["label"])}</text>')
    lx = w - 158
    for j, (_, col, lab) in enumerate(series):
        out.append(f'<circle cx="{lx + j * 78}" cy="9" r="3.8" fill="{col}"/>'
                   f'<text x="{lx + 8 + j * 78}" y="12" fill="#C9D6E2" '
                   f'font-family="Lato, Calibri, sans-serif" font-size="8">{esc(lab)}</text>')
    out.append("</svg>")
    return "".join(out)


def line_chart(x_labels, series, w=636, h=196, label_every=1, pct=False,
               annotate=()):
    """Multi-series line chart on a dark panel - the K2 trend pattern.

    series: [{"vals": [...], "colour": hex, "label": str, "fill": bool}]
    annotate: indices whose value gets printed above the point.
    """
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
            # first label anchors left so its leading digit can't clip at
            # the panel edge (Chromium clips SVG text at the viewBox)
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


def hbars(rows, w=636, colour="#F36F21"):
    """Horizontal bars on a dark panel - repairs by category."""
    if not rows:
        return '<div class="note">Nothing recorded in the source.</div>'
    rowh = 24
    h = len(rows) * rowh + 10
    mx = max(v for _, v in rows) or 1
    lab_w = 172
    out = [f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    for i, (lab, v) in enumerate(rows):
        y = 5 + i * rowh
        bw = (w - lab_w - 46) * (v / mx)
        out.append(f'<text x="0" y="{y + 12}" fill="#C9D6E2" '
                   f'font-family="Lato, Calibri, sans-serif" font-size="9">'
                   f'{esc(lab[:32])}</text>')
        out.append(f'<rect x="{lab_w}" y="{y + 3.5}" width="{w - lab_w - 46}" '
                   f'height="10" rx="5" fill="#26313D"/>')
        out.append(f'<rect x="{lab_w}" y="{y + 3.5}" width="{max(bw, 10):.1f}" '
                   f'height="10" rx="5" fill="{colour}"/>')
        out.append(f'<text x="{w}" y="{y + 12}" text-anchor="end" fill="#FFFFFF" '
                   f'font-family="Lato, Calibri, sans-serif" font-size="9.4" '
                   f'font-weight="700">{v}</text>')
    out.append("</svg>")
    return "".join(out)


# =====================================================================
# HTML component builders
# =====================================================================

def tiles(items, per_row=4):
    """Dark KPI tiles, K2 grid. items: (icon_name, value, label, note, note_class)."""
    out = []
    for i in range(0, len(items), per_row):
        chunk = items[i:i + per_row]
        cells = []
        for ico, val, lab, note, ncls in chunk:
            sm = " sm" if len(str(val)) > 7 else ""
            n = (f'<div class="t-note {ncls}">{esc(note)}</div>' if note else "")
            cells.append(f'<td><div class="t-ico">{icon(ico)}</div>'
                         f'<div class="t-num{sm}">{esc(val)}</div>'
                         f'<div class="t-lab">{esc(lab)}</div>{n}</td>')
        while len(cells) < per_row:
            cells.append('<td style="background:transparent"></td>')
        out.append(f'<table class="tiles"><tr>{"".join(cells)}</tr></table>')
    return "".join(out)


def score_rows(rows):
    """label, score, formula -> K2 score bar with its arithmetic beneath.
    The bar is a FIXED-width pill next to the label - never full-page."""
    out = ['<table class="scores">']
    for lab, sc, form in rows:
        col = {"green": "f-green", "amber": "f-amber", "red": "f-red"}[rag(sc)]
        out.append(
            f'<tr><td class="sc-tick">✓</td>'
            f'<td class="sc-lab">{esc(lab)}</td>'
            f'<td class="sc-bar"><div class="track">'
            f'<div class="fill {col}" style="width:{max(2, min(100, sc))}%"></div>'
            f'</div></td>'
            f'<td class="sc-val">{sc}/100</td></tr>'
            f'<tr><td></td><td colspan="3" class="sc-form">{esc(form)}</td></tr>')
    out.append("</table>")
    return "".join(out)


def prog_rows(rows):
    """label, value, max, colour_class, right_text -> light progress rows."""
    out = ['<table class="prog">']
    for lab, val, mx, cls, right in rows:
        pct = 0 if not mx else max(1.5, min(100, val / mx * 100))
        out.append(f'<tr><td class="pr-lab">{esc(lab)}</td>'
                   f'<td class="pr-bar"><div class="trackl">'
                   f'<div class="fill {cls}" style="width:{pct:.1f}%"></div></div></td>'
                   f'<td class="pr-val">{esc(right)}</td></tr>')
    out.append("</table>")
    return "".join(out)


def alerts(items):
    """(dot_class, title, sub) -> dark ALERTS & ACTIONS panel."""
    rows = "".join(
        f'<tr><td class="al-dot {d}">●</td><td>'
        f'<div class="al-t">{esc(t)}</div><div class="al-s">{esc(s)}</div></td></tr>'
        for d, t, s in items)
    return ('<div class="alerts"><div class="ah">Alerts &amp; Actions</div>'
            f'<table class="al">{rows}</table></div>')


def dtable(headers, rows, aligns=None):
    """Zebra data table with the dark header row."""
    aligns = aligns or [""] * len(headers)
    th = "".join(f'<th class="{a}">{esc(h)}</th>' for h, a in zip(headers, aligns))
    body = []
    for i, r in enumerate(rows):
        z = ' class="z"' if i % 2 else ""
        tds = "".join(f'<td class="{a}">{c}</td>' for c, a in zip(r, aligns))
        body.append(f"<tr{z}>{tds}</tr>")
    return f'<table class="dt"><tr>{th}</tr>{"".join(body)}</table>'


def info_cards(cards):
    out = []
    for i in range(0, len(cards), 2):
        pair = cards[i:i + 2]
        # headings and bodies are author-controlled constants below, so they
        # carry their own markup and entities - escaping here would double
        # up and print "&amp;" on the page.
        cells = "".join(f'<td><div class="cd-h">{h}</div>'
                        f'<div class="cd-b">{b}</div></td>' for h, b in pair)
        if len(pair) == 1:
            cells += '<td style="background:transparent;border-left:none"></td>'
        out.append(f'<table class="cards"><tr>{cells}</tr></table>')
    return "".join(out)


def team_cards(team):
    lead = [p for p in team if p.get("lead")]
    rest = [p for p in team if not p.get("lead")]

    def card(p, wide=False):
        av = " lead" if p.get("lead") else ""
        wid = ' style="width:42%;padding:18px 15px 16px 15px"' if wide else ""
        name = esc(p["name"])
        role = esc(p["role"])
        mail = esc(p.get("email", ""))
        blurb = esc(p.get("blurb", ""))
        return (f'<td{wid}>'
                f'<div class="av{av}">{esc(initials(p["name"]))}</div>'
                f'<div class="tm-n">{name}</div>'
                f'<div class="tm-r">{role}</div>'
                f'<div class="tm-e">{mail}</div>'
                f'<div class="tm-d">{blurb}</div></td>')

    out = []
    if lead:
        pad = '<td style="background:transparent;border-top:none;width:29%"></td>'
        out.append(f'<table class="team" style="table-layout:fixed">'
                   f'<tr>{pad}{card(lead[0], True)}{pad}</tr></table>')
    if rest:
        out.append('<table class="team"><tr>'
                   + "".join(card(p) for p in rest) + "</tr></table>")
    return "".join(out)


def footer(cfg):
    bits = []
    for p in cfg["team"]:
        sh = f'<span class="sh">{esc(p["shift"])}</span> ' if p.get("shift") else ""
        bits.append(f'{sh}<b>{esc(p["name"])}</b> {esc(p["role"])}')
    line = " · ".join(bits)
    if len(cfg["team"]) == 1:
        line += ('  <span style="color:#B4C0CB">'
                 '— add the Ampol store team in CONFIG["team"]</span>')
    return ('<div class="foot"><div class="foot-h">Your Coates Tool Store Team</div>'
            f'<div class="foot-l">{line}</div></div>')


def key_strip(cfg):
    parts = ['<span class="kl">KEY</span>']
    for col, term, tail in cfg["key_items"]:
        parts.append(f'<span class="dot {col}">●</span> '
                     f'<b class="{col}">{esc(term)}</b> {esc(tail)}')
    return '<div class="key">' + "  ".join(parts) + "</div>"


# =====================================================================
# page shell
# =====================================================================

def page1_head(cfg, gen_s, asat_s):
    return f"""<div class="hero">
  <table class="hero-grid"><tr>
    <td>
      <div class="kicker">{esc(cfg['kicker'])}</div>
      <h1>{esc(cfg['client'])} {esc(cfg['title'])}</h1>
      <div class="sub">{esc(cfg['project'])}</div>
    </td>
    <td style="width:172px">
      <div class="siteiq">POWERED BY <span class="q">SITEIQ</span></div>
      <div class="tagline">Equipped for anything</div>
    </td>
  </tr></table>
  <div class="meta">Generated: <b>{esc(gen_s)}</b> &nbsp;|&nbsp;
    Data as at: <b>{esc(asat_s)}</b> (workbook file time) &nbsp;|&nbsp;
    Author: <b>Andrew Fisher</b></div>
</div>"""


def cont_head(cfg, asat_s, pno, ptot):
    return f"""<table class="chead"><tr>
  <td>
    <div class="kicker">{esc(cfg['kicker'])}</div>
    <h2>{esc(cfg['client'])} {esc(cfg['title'])}</h2>
  </td>
  <td style="width:205px">
    <div class="siteiq">POWERED BY <span class="q">SITEIQ</span></div>
    <div class="asat">AS AT <b>{esc(asat_s.upper())}</b></div>
    <div class="pageno">PAGE {pno} OF {ptot}</div>
  </td>
</tr></table>"""


def render_page(cfg, inner, pno, ptot, gen_s, asat_s):
    if pno == 1:
        head = (page1_head(cfg, gen_s, asat_s) + key_strip(cfg)
                + f'<div class="p1no">PAGE 1 OF {ptot}</div>'
                + '<div class="grule"></div>')
        cls = "page page1"
    else:
        head = cont_head(cfg, asat_s, pno, ptot) + key_strip(cfg) + '<div class="grule"></div>'
        cls = "page"
    return (f'<div class="{cls}"><div class="frame">{head}'
            f'<div class="body">{inner}</div>{footer(cfg)}</div></div>')


# =====================================================================
# the report
# =====================================================================

def norm_rows(data):
    """Flatten the three on-hire buckets into one oldest-first list.

    1-7 and 8-29 tabs:  COMPANY HIRER BARCODE SERIAL DESC DAYS COST DATE TIME
    30+ tab:            COMPANY HIRER BARCODE SERIAL DESC DAYS STATUS COST DATE TIME
    The 30+ tab has ITEM_STATUS inserted at index 6 - handled explicitly
    so the replacement cost can never be read out of the wrong column.
    """
    out = []
    for key, has_status in (("oh_1_7", False), ("oh_8_29", False), ("oh_30", True)):
        for r in data.get(key, []):
            r = list(r) + [None] * 4
            cost_i = 7 if has_status else 6
            date_i = 8 if has_status else 7
            try:
                days = int(float(r[5]))
            except (TypeError, ValueError):
                days = 0
            cost = r[cost_i]
            try:
                cost = float(cost)
                if cost <= 0:
                    cost = None
            except (TypeError, ValueError):
                cost = None
            out.append({
                "company": r[0], "hirer": r[1], "barcode": r[2], "serial": r[3],
                "desc": r[4], "days": days, "cost": cost,
                "date": r[date_i], "status": r[6] if has_status else "",
                "bucket": key,
            })
    out.sort(key=lambda d: -d["days"])
    return out


def _tx_pages(pages, t, m, cfg):
    """The five transactions-analytics pages: rhythm, pressure, demand
    trend, same-day trend, and the people league."""
    win = (f'{t["window_start"].strftime("%d %b")} - '
           f'{t["window_end"].strftime("%d %b %Y")}')
    tgt = v18.CONFIG["availability_target"]

    # ---------- rhythm: when monitors move -----------------------------
    hrs = list(range(3, 19))
    hrows = [{"label": f"{h:02d}", "issued": t["hour_issues"].get(h, 0),
              "returned": t["hour_returns"].get(h, 0)} for h in hrs]
    rec = t["record_hour"]
    p = f"""<div class="sect"><h3>The daily rhythm - when monitors move</h3></div>
<div class="callout tight">
  <b>{num(t['n_crew'])} crew movements</b> since {win.split(' - ')[0]}, and the
  shape of the day never changes: <b class="o">{t['pct_before_6']}% of issues
  happen before 06:00</b>, the median monitor goes out at
  <b>{t['median_issue']}</b> and comes back at <b>{t['median_return']}</b>.
  The record window hour is <b class="o">{rec['n']} issues</b> between
  {rec['hour']:02d}:00 and {rec['hour'] + 1:02d}:00 on
  {rec['date'].strftime('%a %d %b')} - one monitor every
  <b>{rec['every_s']} seconds</b>.
</div>
<div class="sub-h">Issues and returns by hour of day
  <span class="thin">&mdash; whole period</span></div>
<div class="chartpanel">{grouped_bars(hrows, h=200)}</div>
{tiles([
    ("clock", t['median_issue'], "Median issue time", "the morning surge", "grey"),
    ("check", t['median_return'], "Median return time", "the afternoon wave", "grey"),
    ("zap", str(rec['n']), "Record hour - issues",
     f"{rec['date'].strftime('%d %b')} {rec['hour']:02d}:00, one every {rec['every_s']}s", "amber"),
    ("people", f"{t['pct_before_6']}%", "Issued before 06:00", "of all crew issues", "grey"),
])}
<div class="note">Counted from SiteIQ transaction timestamps ({win}), internal
  Dr&auml;ger service and custody accounts excluded. Between the issue surge
  and the {t['median_return'][:2]}:00 return wave the shelf carries the whole
  site - that is the daily squeeze in one picture.</div>"""
    pages.append(p)

    # ---------- pressure: why the store runs dry -----------------------
    curve = t["net_curve"]
    labels = [f"{int(hh):02d}" if hh == int(hh) else "" for hh, _ in curve]
    xl = [f"{int(hh):02d}:00" if (int(hh) % 2 == 1 and hh == int(hh)) else ""
          for hh, _ in curve]
    p = f"""<div class="sect"><h3>The pressure curve - why the store runs dry</h3></div>
<div class="callout tight">
  By mid-morning an <b class="o">average working day is
  {int(round(t['net_plateau']))} monitors deeper</b> into the shelf than it
  started, and the worst recent day dug to
  <b class="o">{int(round(t['net_plateau_worst']))}</b> - against
  <b>{num(m['available'])} on the shelf this morning</b>. That is why the store
  runs dry every day: the gear goes out by 07:00 and does not start coming back
  until after {t['median_return'][:2]}:00. The availability target has been
  reset to <b>{num(tgt)}</b> on the back of this data - the old target of 50
  scored the shelf 100/100 while crews were being turned away.
</div>
<div class="sub-h">Net monitors drawn from the store through the day
  <span class="thin">&mdash; average and worst of the last {len(t['curve_days'])} working days</span></div>
<div class="chartpanel">{line_chart(
    xl,
    [{"vals": [v for _, v in t["net_curve_worst"]], "colour": K["red"],
      "label": "Worst day", "fill": False},
     {"vals": [v for _, v in curve], "colour": K["orange"],
      "label": "Average day", "fill": True}],
    label_every=1)}</div>
{tiles([
    ("bars", num(int(round(t['net_plateau']))), "Avg net draw by mid-morning",
     "issues less returns, same day", "amber"),
    ("warn", num(int(round(t['net_plateau_worst']))), "Worst recent day",
     "same measure", "red"),
    ("box", num(m['available']), "On the shelf this morning",
     "from the live register", "red" if m['available'] < tgt else "green"),
    ("shield", num(tgt), "New availability target",
     "was 50 - reset on this data", "grey"),
])}
<div class="note">The curve counts every same-day issue minus every same-day
  return, half-hour by half-hour, including custody movements - it is how much
  deeper into the shelf the day digs as it runs. Recovering the
  <b>{num(m['outstanding'])} outstanding</b> monitors and turning the
  <b>{num(m['repairs'])} in repair</b> around is what closes the gap between
  {num(m['available'])} on the shelf and the {num(tgt)} target.</div>"""
    pages.append(p)

    # ---------- demand trend: the whole shutdown -----------------------
    peaks = t["day_peaks"]
    step = max(1, len(peaks) // 90)
    pk = peaks[::step]
    plabels = [p2["date"].strftime("%d %b") if i % max(1, len(pk) // 9) == 0
               else "" for i, p2 in enumerate(pk)]
    rp = t["record_peak"]
    usable = m["fleet_total"] - m["repairs"]
    p = f"""<div class="sect"><h3>Demand - monitors out at once, whole period</h3></div>
<div class="callout tight">
  Peak concurrent demand has climbed all campaign and is now brushing the
  ceiling of the fleet: the record is <b class="o">{num(rp['peak'])} monitors
  out at once</b> at {rp['at'].strftime('%H:%M on %a %d %b')} - against
  <b>{num(m['fleet_total'])} owned</b> and only
  <b class="o">{num(usable)} usable</b> once the {num(m['repairs'])} in repair
  are set aside. At that moment the whole site was holding all but
  <b>{num(usable - rp['peak'])}</b> of every usable monitor Coates has here.
</div>
<div class="sub-h">Peak monitors out at once, by day
  <span class="thin">&mdash; {win}</span></div>
<div class="chartpanel">{line_chart(
    plabels,
    [{"vals": [p2["peak"] for p2 in pk], "colour": K["orange"],
      "label": "Daily peak out", "fill": True}],
    label_every=1)}</div>
{tiles([
    ("zap", num(rp['peak']), "Record - out at once",
     rp['at'].strftime('%d %b %H:%M'), "red"),
    ("box", num(usable), "Usable fleet",
     f"{num(m['fleet_total'])} owned less {num(m['repairs'])} in repair", "grey"),
    ("warn", num(usable - rp['peak']), "Spare at the record peak",
     "across the whole site", "red"),
    ("swap", num(sum(t['weekday_issues'].values()) // max(1, len(t['daily_issues']))),
     "Avg crew issues / day", "whole period", "grey"),
])}
<div class="note">Concurrency counts every open transaction in the export
  window ({win}) including custody - a monitor in FCCU custody is still a
  monitor off the shelf. Items issued before {t['window_start'].strftime('%d %b')}
  sit outside this window, so the register's on-hire figure runs higher; the
  register remains the authority for right-now counts.</div>"""
    pages.append(p)

    # ---------- same-day trend + durations -----------------------------
    wk = t["weekly_sd"]
    wl = [w2["label"] for w2 in wk]
    partial = " (current week is partial - it will move)" if t["current_week_partial"] else ""
    p = f"""<div class="sect"><h3>Same-day returns - which way is it trending</h3></div>
<div class="callout tight">
  <b class="o">{t['same_day_pct']}%</b> of crew draws come back the same day
  across the whole period - and the trend is the story: the mid-campaign slump
  in the low 70s has been pulled back to the mid 80s week on week.
  Every point below is
  <b>same-day returns &divide; completed draws</b> for that week{partial}.
</div>
<div class="sub-h">Same-day return rate by week</div>
<div class="chartpanel">{line_chart(
    wl,
    [{"vals": [w2["pct"] for w2 in wk], "colour": K["green"],
      "label": "Same-day %", "fill": True}],
    label_every=2, pct=True,
    annotate=tuple(range(0, len(wk) - 1)))}</div>
<div class="sub-h">How long monitors stay out
  <span class="thin">&mdash; every completed crew draw</span></div>
<div class="chartpanel">{hbars(t['dur_buckets'], colour=K['amber'])}</div>
<div class="note">{num(t['same_day'])} of {num(t['n_crew_closed'])} completed
  crew draws returned same day. The tail is the cost: every draw in the 1-3 day
  and longer buckets is a monitor that missed at least one bump-test cycle and
  spent nights off the shelf while crews queued at the window in the morning.</div>"""
    pages.append(p)

    # ---------- the people league --------------------------------------
    # Shared/workflow accounts (FCCU T&I, Ampol Operations...) move gear
    # through the window but are not a person you can ring - keep them out
    # of the PEOPLE league and say so. They still count in the flow stats.
    def _is_account(name):
        n = name.lower()
        return ("fccu" in n or "t&i" in n or "operations" in n
                or "future fuels" in n or "tool store" in n)
    lg = [x for x in t["league"] if x["not_sd"] > 0
          and not _is_account(x["name"])][:12]
    lrows = []
    for x in lg:
        pcls = "g" if x["sd_pct"] >= 85 else "a" if x["sd_pct"] >= 70 else "rd"
        lrows.append([
            f'{esc(x["name"])}<span class="s2">{esc(x["co"])}</span>',
            num(x["draws"]),
            f'<span class="{pcls}">{x["sd_pct"]}%</span>',
            num(x["ov"]),
            (f'<span class="rd">{num(x["open"])}</span>' if x["open"]
             else '<span class="tbc">0</span>'),
            f'{num(x["maxd"])}d'])
    lk = t["longest_kept"]
    lk_note = (f' The longest completed hold on record: '
               f'<b>{(lk["en"] - lk["st"]).days} days</b> by '
               f'<b>{esc(lk["who"])}</b> ({esc(lk["co"])}).' if lk else '')
    p = f"""<div class="sect"><h3>The people who don't bring them back</h3></div>
<div class="callout tight">
  The behaviour league, from every crew transaction in the window: ranked by
  draws kept overnight or longer plus draws still open now. These are the same
  names the workbook's offender columns flag - two independent sources, one
  answer. This is who the return-daily conversation belongs to, by name.
</div>
{dtable(["Who", "Draws", "Same-day", "Kept overnight+", "Still out now", "Longest"],
        lrows, ["", "r", "r", "r", "r", "r"])}
<div class="note">Named people only - internal Dr&auml;ger service accounts
  ({num(t['n_internal'])} transactions) and shared workflow accounts (FCCU
  T&amp;I, site Operations) are excluded because they are not a person you can
  ring; they are covered in the company tables. Same-day % is green from 85,
  amber from 70, red below. "Still out now" means no return scan as at the
  export.{lk_note}</div>"""
    pages.append(p)


def build_pages(data, m, cfg, gen_s, asat_s, txm=None):
    pages = []
    comps = data["companies"]
    rows = norm_rows(data)
    priced = [r for r in rows if r["cost"] is not None]
    tbc = len(rows) - len(priced)
    priced_total = sum(r["cost"] for r in priced)

    # ---------------- page 1 - the scorecard --------------------------
    hs = m["health"]
    fleet_band = stackband([
        ("On hire - general", m["onhire_general"], K["orange"]),
        ("FCCU", m["fccu"], K["blue"]),
        ("Operations", m["ops"], K["amber"]),
        ("Future Fuels", m["ff"], K["lime"]),
        ("Available", m["available"], K["green"]),
        ("Repairs", m["repairs"], K["red"]),
    ])
    p1 = f"""<div class="callout">
  <span class="lead">The position today.</span> One page, one honest answer:
  how healthy is the {esc(cfg['client'])} gas monitor operation right now?
  Every score below is arithmetic on real SiteIQ events - the formula sits
  beside each number, so the score can be challenged, checked and trusted.
  <b>{num(m['fleet_total'])} monitors</b> in the fleet,
  <b class="o">{num(m['onhire_all'])} out</b> across all custody types,
  <b>{num(m['available'])} on the shelf</b> and
  <b class="o">{num(m['outstanding'])} outstanding</b> from previous days.
</div>
<table class="two" style="margin-top:16px"><tr>
  <td style="width:31%">
    <div class="donut-wrap">
      {donut(hs, health_hex(hs), f"{hs}%", health_word(hs))}
      <div class="donut-cap">Gas monitor health score</div>
    </div>
  </td>
  <td style="padding-left:10px">
    {score_rows([
        ("Tool availability", m['score_availability'],
         f"{m['available']} in store against a {v18.CONFIG['availability_target']}-unit "
         f"target for a full score"),
        ("Returns / recovery", m['score_recovery'],
         f"{m['recovered']} of {m['prev_day_total']} previous-day non-returns "
         f"recovered so far today"),
        ("Repairs", m['score_repairs'],
         f"100 less the {m['fleet_impact_pct']}% of fleet sitting in repair "
         f"({m['repairs']} of {m['fleet_total']})"),
        ("30+ day control", m['score_30'],
         f"100 less 3 per monitor out 30 days or more ({m['out_30']} out)"),
    ])}
  </td>
</tr></table>
<div class="note">Health score is the plain average of the four scores above -
  <b>({m['score_availability']} + {m['score_recovery']} + {m['score_repairs']}
  + {m['score_30']}) &divide; 4 = {hs}</b>. Nothing is weighted and nothing is
  hidden.</div>
<div class="sub-h">The fleet at a glance - where every monitor is</div>
<div class="chartpanel">{fleet_band}</div>
<div class="chart-cap">Every one of the <b>{num(m['fleet_total'])}</b> monitors,
  counted off the detail tabs: on hire to crews, in FCCU / Operations / Future
  Fuels custody, available on the shelf, or in the workshop.</div>
{tiles([
    ("box", num(m['fleet_total']), "Total fleet", "all custody types", "grey"),
    ("check", num(m['available']), "Available in store", "ready for issue", "green" if m['available'] else "red"),
    ("swap", num(m['onhire_general']), "On hire - general",
     f"{m['issued_today']} today + {m['outstanding']} outstanding", "grey"),
    ("warn", num(m['outstanding']), "Outstanding", "action required", "red" if m['outstanding'] else "green"),
])}"""
    pages.append(p1)

    # ---------------- page 2 - custody, return cycle, alerts ----------
    al = []
    if m["yday_still_out"]:
        al.append(("d-red", f"{m['yday_still_out']} monitors still out from yesterday",
                   "Previous-day non-returns not yet recovered. Every one is "
                   "named on the next page - chase at prestart."))
    if m["out_30"]:
        al.append(("d-red", f"{m['out_30']} monitors out 30 days or more",
                   f"Charge exposure {money(m['exposure'])} at "
                   f"${v18.CONFIG['charge_per_unit']:,} per unit. Recovery "
                   f"conversation, not a debt notice."))
    if m["out_8_29"]:
        al.append(("d-amber", f"{m['out_8_29']} monitors out 8-29 days",
                   "Follow-up window - these are the ones that become 30+ if "
                   "nobody rings."))
    if m["repairs"]:
        al.append(("d-amber", f"{m['repairs']} monitors in repair or out of service",
                   f"Largest category: {m['repair_top']}. "
                   f"{m['fleet_impact_pct']}% of the fleet unavailable."))
    if m["available"] < v18.CONFIG["availability_target"]:
        al.append(("d-blue",
                   f"{m['available']} on the shelf against a "
                   f"{v18.CONFIG['availability_target']}-unit target",
                   "Availability is what keeps work fronts moving - restock or "
                   "pull recovery forward."))
    for w in m["warnings"]:
        al.append(("d-blue", "Source reconciliation variance", w))
    if not al:
        al.append(("d-green", "Nothing outstanding", "No exceptions in the source today."))

    p2 = f"""<div class="sect"><h3>Yesterday and today - the return cycle</h3></div>
{tiles([
    ("swap", num(m['issued_today']), "Issued so far today", "", ""),
    ("clock", num(m['prev_day_total']), "Previous-day non-returns", "yesterday total", "grey"),
    ("check", num(m['recovered']), "Recovered today",
     f"{m['recovery_rate']}% recovery rate", "green" if m['recovery_rate'] >= 50 else "red"),
    ("warn", num(m['yday_still_out']), "Still out from yesterday", "same person", "red" if m['yday_still_out'] else "green"),
])}
{tiles([
    ("diamond", num(m['fccu']), "FCCU on hire", "tracked separately", "grey"),
    ("layers", num(m['ops']), "Operations on hire", "tracked separately", "grey"),
    ("zap", num(m['ff']), "Future Fuels on hire", "tracked separately", "grey"),
    ("wrench", num(m['repairs']), "In repair / out of service",
     f"{m['fleet_impact_pct']}% of fleet", "amber"),
])}
<div class="note">Cycle check: <b>{m['prev_day_total']} = {m['recovered']} recovered
  + {m['yday_still_out']} still out</b> &mdash;
  {"balances" if m['validation_pass'] else "DOES NOT BALANCE, investigate before sending"}.
  Gas monitors come back <b class="o">daily</b> for bump testing, charging and
  inspection, so one out overnight is a safety-critical follow-up, not a hire
  matter.</div>
{alerts(al)}"""
    pages.append(p2)

    # ---------------- non-returns, NAMED - the prestart chase list ----
    # Source: the workbook's own Gas Monitor Return Performance tab.
    # prev_day / prev_day_names = yesterday's operations, units not
    # returned same day, per person with unit counts in brackets.
    # nrsd / top_offenders     = the same-day pattern across the last
    # 30 days. Names come straight from the workbook - never derived.
    yday = sorted([c for c in comps if c["prev_day"] > 0],
                  key=lambda c: -c["prev_day"])
    yday_total = sum(c["prev_day"] for c in yday)
    yrows = []
    for c in yday:
        yrows.append([esc(c["name"]),
                      f'<span class="rd">{num(c["prev_day"])}</span>',
                      esc(c["prev_day_names"])])
    match_note = ("matches" if yday_total == m["prev_day_total"] else
                  "DOES NOT MATCH - investigate before sending")
    p_nr1 = f"""<div class="sect"><h3>Yesterday's non-returns - named</h3></div>
<div class="callout tight">
  <b class="o">{num(yday_total)} monitors</b> from yesterday's operations were
  not returned by end of shift, and <b class="o">{num(m['recovered'])} have been
  recovered</b> so far today. Every unit is named below with the count against
  each person - this is the prestart chase list. Gas monitors come back
  <b>daily</b> for bump testing, so each name here is a safety conversation
  first and a hire conversation second.
</div>
{dtable(["Company", "Units", "Who has them (units each)"], yrows, ["", "r", ""])}
<table class="totrow"><tr>
  <td>Total previous-day non-returns - {match_note} the scorecard</td>
  <td class="v"><span class="hl">{num(yday_total)}</span></td>
</tr></table>
<div class="note">Names and unit counts come straight from the workbook's
  <b>Gas Monitor Return Performance</b> tab (previous-day operations column) -
  nothing here is derived or guessed. The separate ageing pages list items out
  more than one day, person by person.</div>"""
    pages.append(p_nr1)

    # ---------------- the 30-day same-day pattern ----------------------
    nr = sorted([c for c in comps if c["nrsd"] > 0], key=lambda c: -c["nrsd"])
    # 8 rows is the ceiling here: each row carries a two-line offender cell
    # plus the workbook's reoffender flag under the company name. More than
    # that and the table runs over the footer.
    SHOW = 8
    shown, rest = nr[:SHOW], nr[SHOW:]
    rest_units = sum(c["nrsd"] for c in rest)
    issued_all = sum(c["issued"] for c in comps)
    nrsd_all = sum(c["nrsd"] for c in comps)

    def offenders_short(s, keep=3):
        bits = [b.strip() for b in str(s or "").split(",") if b.strip()]
        out = ", ".join(bits[:keep])
        return out + (f" &nbsp;&middot;&nbsp; +{len(bits) - keep} more"
                      if len(bits) > keep else "")

    nrows = []
    for c in shown:
        act = str(c["reoffender_action"] or "").strip()
        flag = ""
        if act and act.lower() not in ("no reoffender action", "none", "-"):
            flag = f'<span class="s2"><span class="or">{esc(act)}</span></span>'
        nrows.append([f'{esc(c["name"])}{flag}',
                      num(c["issued"]),
                      f'<b>{num(c["nrsd"])}</b>',
                      esc(c["nrsd_pct"]),
                      offenders_short(c["top_offenders"])])
    p_nr2 = f"""<div class="sect"><h3>The same-day pattern - last 30 days</h3></div>
<div class="callout tight">
  Across the last 30 days, <b class="o">{num(nrsd_all)}</b> of
  <b>{num(issued_all)}</b> issues ({nrsd_all / issued_all * 100:.1f}%) were not
  returned on the day they went out. The table names each company's top
  offenders with unit counts - the same names keep appearing, and that is where
  the behaviour conversation goes. Reoffender flags are the workbook's own.
</div>
{dtable(["Company", "Issued", "Not ret. same day", "Rate", "Top offenders (units)"],
        nrows, ["", "r", "r", "r", ""])}
<div class="note">{f'Plus <b>{len(rest)}</b> more companies with '
  f'<b>{num(rest_units)}</b> units between them - full list in the workbook. '
  if rest else ''}Counts, rates and offender names come straight from the
  workbook's Performance tab (30-day columns). Issued totals are for the whole
  reporting period.</div>"""
    pages.append(p_nr2)

    # ================= TRANSACTIONS ANALYTICS - five pages =============
    # Everything below comes from the SiteIQ TRANSACTIONS export via
    # gasmon_transactions.py. If the export is missing, txm is None and
    # these pages are skipped - the report still builds.
    if txm:
        _tx_pages(pages, txm, m, cfg)

    # ---------------- page - by company --------------------------------
    movers = sorted([c for c in comps if c["issued"] or c["returned"]],
                    key=lambda c: -c["issued"])[:9]
    trows = []
    for c in movers:
        net = c["issued"] - c["returned"]
        cls = "g" if net < 0 else "a" if net > 0 else ""
        trows.append([esc(c["name"]), num(c["issued"]), num(c["returned"]),
                      f'<span class="{cls}">{net:+d}</span>'])
    chart_rows = [{"label": (c["name"][:11] + "…") if len(c["name"]) > 12 else c["name"],
                   "issued": c["issued"], "returned": c["returned"]} for c in movers[:8]]

    p3 = f"""<div class="sect"><h3>Who is moving gas monitors</h3></div>
{dtable(["Company", "Issued", "Returned", "Net"], trows, ["", "r", "r", "r"])}
<div class="note">Issued and returned counts are for the whole reporting period on
  the Performance tab, not a single day. A positive <b>Net</b> means more went out
  than came back over the period.</div>
<div class="sub-h">Issued v returned <span class="thin">&mdash; by company</span></div>
<div class="chartpanel">{grouped_bars(chart_rows)}</div>"""
    pages.append(p3)

    # ---------------- page 4 - ageing + recovery priorities -----------
    prios = m["priorities"]
    prows = []
    for c in prios:
        u = c.get("urgency", "Watch")
        ucls = {"Critical": "rd", "High": "a", "Watch": "g"}.get(u, "")
        prows.append([esc(c["name"]),
                      f'<span class="{ucls}">{u}</span>',
                      num(c["d1_7"]), num(c["d8_29"]), num(c["d30"]),
                      money(c["charge"]) if c["charge"] else
                      '<span class="tbc">$0</span>'])

    p4 = f"""<div class="sect"><h3>Ageing - how long they have been out</h3></div>
<table class="dt"><tr>
  <th class="c">1-7 Days (Watch)</th><th class="c">8-29 Days (Follow up)</th>
  <th class="c">30+ Days (Action needed)</th></tr>
  <tr><td class="big">{num(m['out_1_7'])}</td>
      <td class="big">{num(m['out_8_29'])}</td>
      <td class="big">{num(m['out_30'])}</td></tr>
</table>
{prog_rows([
    ("Watch - out 1-7 days", m['out_1_7'], m['outstanding'] or 1, "f-amber", f"{m['out_1_7']} items"),
    ("Follow up - out 8-29 days", m['out_8_29'], m['outstanding'] or 1, "f-orange", f"{m['out_8_29']} items"),
    ("Action - out 30+ days", m['out_30'], m['outstanding'] or 1, "f-red", f"{m['out_30']} items"),
])}
<div class="note">Charge exposure sits at <b>{money(m['exposure'])}</b> &mdash;
  {m['out_30']} monitors at 30 days or more, at
  <b>${v18.CONFIG['charge_per_unit']:,}</b> replacement charge per unit from the
  workbook's Charge column. This is a recovery conversation, not a debt notice:
  the list below names who to ring.</div>
<div class="sect"><h3>Recovery priorities - worst first</h3></div>
{dtable(["Company", "Urgency", "1-7d", "8-29d", "30+d", "Charge exposure"],
        prows, ["", "", "r", "r", "r", "r"])}
<div class="note">Ranked by exposure, then outstanding count. <b>Critical</b> = has
  30+ day items, <b>High</b> = has 8-29 day items or three or more out,
  <b>Watch</b> = the rest. The three to ring first: <b>{esc(m['focus3'][0]['name']) if m['focus3'] else ''}</b>{", <b>" + esc(m['focus3'][1]['name']) + "</b>" if len(m['focus3']) > 1 else ""}{" and <b>" + esc(m['focus3'][2]['name']) + "</b>" if len(m['focus3']) > 2 else ""}.</div>"""
    pages.append(p4)

    # ---------------- pages 5+ - outstanding detail -------------------
    # Rows per detail page. Each row is two lines deep (description +
    # company, asset + serial), so 14 is what fits inside the frame with
    # the footer. Push this up and the page overflows: the orange frame
    # fragments and the footer drops off. main() checks the rendered page
    # count against the authored count and shouts if that happens.
    PER = 14
    chunks = [rows[i:i + PER] for i in range(0, len(rows), PER)] or [[]]
    for ci, chunk in enumerate(chunks):
        drows = []
        for r in chunk:
            dcls = "rd" if r["days"] >= 30 else "a" if r["days"] >= 8 else ""
            cost = (money(r["cost"]) if r["cost"] is not None
                    else '<span class="tbc">TBC</span>')
            drows.append([
                f'{esc(r["desc"])}<span class="s2">{esc(r["company"])}</span>',
                f'{esc(r["barcode"])}<span class="s2">{esc(r["serial"])}</span>',
                esc(r["hirer"]),
                f'<span class="{dcls}">{r["days"]}d</span>'
                f'<span class="s2">{esc(fmt_date(r["date"]))}</span>',
                cost])
        head = (f'<div class="sect"><h3>On hire and not yet returned - oldest first</h3></div>'
                if ci == 0 else
                f'<div class="sub-h">On hire and not yet returned '
                f'<span class="thin">&mdash; continued ({ci + 1} of {len(chunks)})</span></div>')
        tail = ""
        if ci == len(chunks) - 1:
            tail = f"""<table class="totrow"><tr>
  <td>Replacement cost exposure - if nothing came back</td>
  <td class="v"><span class="hl">{money(priced_total)}</span></td>
</tr></table>
<div class="note">{tbc} item(s) show <b>TBC</b> - no replacement cost in the
  source, so they are <b>excluded</b> from the exposure total rather than
  guessed. {num(len(priced))} of {num(len(rows))} items are priced. Ageing
  colour: red at 30 days or more, amber at 8-29 days.</div>"""
        pages.append(head + dtable(
            ["Description", "Asset / serial", "Hirer", "On hire", "Replacement cost"],
            drows, ["", "", "", "", "r"]) + tail)

    # ---------------- repairs page ------------------------------------
    # Repairs tab columns: <status> BARCODE SERIAL DESCRIPTION DAYS_IN_STATUS DATE
    #
    # TRAP: the workbook headers that first column "HIRER_NAME", but it does
    # NOT hold a person - it holds the repair status, e.g. "Dräger - Out of
    # Calibration". The V18 script already treats it as the category. Label
    # it "Repair status" on the report; calling it a hirer would put a fault
    # code where a person's name should be, in front of the customer.
    rep = []
    for r in data.get("repairs", []):
        r = list(r) + [None] * 6
        try:
            d = int(float(r[4]))
        except (TypeError, ValueError):
            d = 0
        status = re.sub(r"^Dräger\s*[–-]\s*", "", str(r[0] or "")).strip()
        rep.append({"status": status, "barcode": r[1], "serial": r[2],
                    "desc": r[3], "days": d})
    rep.sort(key=lambda x: -x["days"])
    rep_rows = []
    for r in rep[:6]:
        dcls = "rd" if r["days"] >= 30 else "a" if r["days"] >= 8 else ""
        rep_rows.append([
            esc(r["desc"]),
            f'{esc(r["barcode"])}<span class="s2">{esc(r["serial"])}</span>',
            f'<span class="{dcls}">{r["days"]}d</span>',
            esc(r["status"])])
    stale = [r for r in rep if r["days"] >= 180]

    p_rep = f"""<div class="sect"><h3>Out of service - what is in the workshop</h3></div>
<div class="callout tight">
  <b>{num(m['repairs'])} monitors</b> are out of service, which is
  <b class="o">{m['fleet_impact_pct']}%</b> of the {num(m['fleet_total'])}-unit
  fleet unavailable to a work front. Largest single category is
  <b>{esc(m['repair_top'])}</b>. Every unit here is one a crew cannot take.
</div>
<div class="sub-h">Repairs by category</div>
<div class="chartpanel">{hbars(m['repair_cats'])}</div>
<div class="note">Counted straight off the Repairs tab, category taken from the
  item description with the "Dr&auml;ger" prefix stripped so the same fault does
  not appear twice.</div>
<div class="sub-h">Longest in the workshop <span class="thin">&mdash; oldest first</span></div>
{dtable(["Item", "Asset / serial", "Days in status", "Repair status"], rep_rows,
        ["", "", "r", ""])}
<div class="note">{f'<b class="o">{len(stale)} unit(s) have been out of service '
  f'180 days or more</b> &mdash; the oldest at <b>{stale[0]["days"]} days</b>. '
  f'That is not a repair queue, that is dead fleet: repair-or-replace call. '
  if stale else ''}Status shown is the workbook&rsquo;s repair status for each
  unit.</div>"""
    pages.append(p_rep)

    # ---------------- closing page - service + team -------------------
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
         "Every score on page 1 prints its own arithmetic. Nothing is weighted "
         "behind the scenes and nothing is estimated - a cost we do not hold shows "
         "as <b>TBC</b>, not a guess."),
        ("Breakdowns - tell us everything",
         "Something stops? Tell us <b>where it is, what is wrong, what it was "
         "doing</b>. We will get it swapped or fixed - no drama, no waiting."),
        ("Reconciled before it is sent",
         "Every figure is counted off the detail tabs, then cross-checked against "
         "the summary cells and the RENTAL_STOCK export. Any variance is printed "
         "on this report, not quietly dropped."),
    ]
    p_end = f"""<div class="sect"><h3>The tool store has your back</h3></div>
{info_cards(cards)}
<div class="sect"><h3>Meet the tool store team</h3></div>
<div class="note">The crew running your {esc(cfg['client'])} store - getting the
  right gear to the right people, keeping it tested and ready, and making sure
  everything that leaves the store is right. Something not on hand or not right?
  Tell us and we'll sort it.</div>
{team_cards(cfg['team'])}"""
    pages.append(p_end)

    return pages, {"tbc": tbc, "priced": len(priced), "rows": len(rows),
                   "priced_total": priced_total}


def build_html(data, m, cfg, gen_s, asat_s, txm=None):
    pages, stats = build_pages(data, m, cfg, gen_s, asat_s, txm)
    tot = len(pages)
    body = "".join(render_page(cfg, p, i + 1, tot, gen_s, asat_s)
                   for i, p in enumerate(pages))
    doc = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Coates {esc(cfg['client'])} {esc(cfg['title'])} - {esc(asat_s)}</title>
</head><body>{body}</body></html>"""
    return doc, tot, stats


# =====================================================================
# PDF RENDERING - WeasyPrint when it works, Edge headless when it won't
# =====================================================================

def find_browser():
    """Edge (or Chrome/Chromium) for headless print-to-PDF.

    GASMON_BROWSER environment variable overrides everything, for the odd
    laptop where Edge lives somewhere non-standard.
    """
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
    for name in ("msedge", "chrome", "chromium", "chromium-browser"):
        p = shutil.which(name)
        if p:
            return p
    return ""


def render_pdf_weasy(doc, css_path, base, pdf_path, authored):
    """WeasyPrint render + the strict authored-vs-rendered page check."""
    rendered = HTML(string=doc, base_url=base).render(
        stylesheets=[CSS(filename=css_path)])
    actual = len(rendered.pages)
    rendered.write_pdf(pdf_path)
    return actual


def render_pdf_browser(doc, css_path, base, pdf_path):
    """Edge/Chrome headless print-to-PDF. Returns page count if it can be
    read from the PDF, else -1 (not all PDFs expose it to a plain scan)."""
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
    # inline the stylesheet so the temp HTML is fully self-contained
    with open(css_path, encoding="utf-8") as f:
        css = f.read()
    doc2 = doc.replace("</head>", f"<style>{css}</style></head>", 1)
    tmp = tempfile.NamedTemporaryFile(
        "w", suffix=".html", dir=base, delete=False, encoding="utf-8")
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

def main():
    cfg = CONFIG
    vcfg = v18.CONFIG
    here = v18.kit_root()

    print("=" * 68)
    print("COATES K2-STYLE PDF - AMPOL GAS MONITOR OPERATIONS")
    print("=" * 68)

    wb_path = v18.find_workbook(vcfg)
    rs_path = v18.find_rental_stock(vcfg)
    print(f"Workbook             : {os.path.basename(wb_path)}")
    mt = datetime.fromtimestamp(os.path.getmtime(wb_path))
    asat_s = mt.strftime("%d %b %Y %H:%M")
    gen_s = datetime.now().strftime("%d %b %Y %H:%M")
    print(f"Data as at           : {asat_s}  (workbook file time)")
    if rs_path:
        print(f"RENTAL_STOCK export  : {os.path.basename(rs_path)}")

    # ONE engine - same figures as the V18 emailed dashboard
    data = v18.load_data(wb_path)
    m = v18.compute_metrics(data, vcfg)

    # --- transactions analytics (optional but recommended) -------------
    txm = None
    tx_path = ""
    if gtx is not None:
        for folder in v18.search_dirs():
            cands = [os.path.join(folder, n) for n in os.listdir(folder)
                     if n.upper().startswith("TRANSACTIONS")
                     and n.lower().endswith(".xlsx") and not n.startswith("~$")
                     and not n.lower().startswith("source_")]
            if cands:
                cands.sort(key=os.path.getmtime, reverse=True)
                tx_path = cands[0]
                break
        ser_path = ""
        for folder in v18.search_dirs():
            cands = [os.path.join(folder, n) for n in os.listdir(folder)
                     if "serial" in n.lower() and n.lower().endswith(".xlsx")
                     and not n.startswith("~$")]
            if cands:
                ser_path = cands[0]
                break
        if tx_path:
            print(f"TRANSACTIONS export  : {os.path.basename(tx_path)}")
            tx, tx_window = gtx.load_transactions(
                tx_path, gtx.load_serial_assets(ser_path))
            txm = gtx.compute_tx(tx)
            print(f"  gas monitor tx     : {txm['n_all']:,} "
                  f"({txm['n_crew']:,} crew / {txm['n_internal']:,} internal)")
            print(f"  window             : "
                  f"{txm['window_start'].strftime('%d %b %H:%M')} -> "
                  f"{txm['window_end'].strftime('%d %b %H:%M')}")
            print(f"  same-day (crew)    : {txm['same_day']:,}"
                  f"/{txm['n_crew_closed']:,} = {txm['same_day_pct']}%")
            print(f"  record concurrent  : {txm['record_peak']['peak']} at "
                  f"{txm['record_peak']['at'].strftime('%H:%M %d %b')}")
            print(f"  net draw plateau   : avg {txm['net_plateau']:.0f} / "
                  f"worst {txm['net_plateau_worst']} "
                  f"(last {len(txm['curve_days'])} working days)")
        else:
            print("TRANSACTIONS export  : none found - the five analytics pages")
            print("                       are SKIPPED. Save TRANSACTIONS.xlsx in")
            print("                       the kit folder to bring them back.")

    print(f"Health score         : {m['health']}/100  "
          f"(A{m['score_availability']} R{m['score_recovery']} "
          f"P{m['score_repairs']} C{m['score_30']})")
    print(f"Fleet / on hire      : {m['fleet_total']} / {m['onhire_all']}  "
          f"(available {m['available']}, repairs {m['repairs']})")
    print(f"Outstanding          : {m['outstanding']}  "
          f"({m['out_1_7']} / {m['out_8_29']} / {m['out_30']})  "
          f"exposure {v18.money(m['exposure'])}")
    for w in m["warnings"]:
        print(f"[RECON WARNING] {w}")
    if rs_path:
        for n in v18.validate_against_rental_stock(rs_path, m):
            print(f"[RENTAL_STOCK] {n}")

    doc, pages, stats = build_html(data, m, cfg, gen_s, asat_s, txm)

    css_path = os.path.join(here, cfg["css_name"])
    if not os.path.exists(css_path):
        sys.exit(f"ERROR: {cfg['css_name']} is missing from the kit folder.\n"
                 f"  Looked for: {css_path}\n"
                 "  It carries the Coates house style - keep the kit together.")

    # (No debug .html is written - the PDF is the deliverable, and a second
    # copy of the same report just clutters the kit folder.)
    pdf_path = os.path.join(here, cfg["pdf_name"])

    # Render, preferring WeasyPrint (it gives an exact page-box count for
    # the layout check). If it is missing OR dies at render time - the
    # normal state on a Coates Windows laptop, where its GTK libraries
    # can't be installed - fall back to Edge/Chrome headless. No installs.
    actual = None
    if _HAVE_WEASY:
        try:
            actual = render_pdf_weasy(doc, css_path, here, pdf_path, pages)
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
    # That must never ship silently.
    if actual == -1:
        print(f"Layout check         : page count not readable from this PDF - "
              f"authored {pages} pages; open it and confirm the last page "
              f"is page {pages}")
    elif actual != pages:
        print("")
        print("*" * 68)
        print(f"WARNING: LAYOUT OVERFLOW - authored {pages} pages but the PDF "
              f"has {actual}.")
        print("  A page's content is taller than the frame, so the orange border")
        print("  and the footer will be broken on at least one page.")
        print("  Fix: lower PER in build_pages() (rows per detail page), or")
        print("  shorten whatever section grew. Do not send this PDF as is.")
        print("*" * 68)
        print("")
    else:
        print(f"Layout check         : PASS - {actual} pages, none overflowed")

    print(f"Pages                : {pages}")
    print(f"Replacement cost     : {stats['priced']} of {stats['rows']} items priced, "
          f"{stats['tbc']} TBC (excluded from the total, never guessed)")
    print(f"PDF written          : {pdf_path}  "
          f"({os.path.getsize(pdf_path):,} bytes)")
    print("")
    print("NEXT STEP: open the PDF, check the reconciliation lines above,")
    print("           then send it.")
    print("Done. The Coates Way - consistent execution, every day.")


if __name__ == "__main__":
    try:
        main()
    except SystemExit as e:
        print(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"\nERROR: {e}")
    finally:
        if os.name == "nt" and not sys.stdout.isatty():
            input("\nPress Enter to close...")
