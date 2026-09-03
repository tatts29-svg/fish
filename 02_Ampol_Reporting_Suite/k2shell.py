#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
COATES K2 HOUSE-STYLE SHELL - shared components
Page shell, SVG chart kit (for the PDFs) and PIL chart kit + Outlook
primitives (for the email). Extracted from the Ampol gas monitor kit
so every Coates report builds from the same parts.
Author: Andrew Fisher - POWERED BY SITEIQ
=====================================================================
"""

import base64
import html as _html
import io
import os
import re
from datetime import datetime

from PIL import Image, ImageDraw, ImageFont

K = {
    "orange": "#F36F21", "green": "#1FA75A", "amber": "#F5A623",
    "red": "#EF4444", "blue": "#3D8BD4", "lime": "#C8DA2C",
    "track": "#1E2733", "ink": "#16202C",
}


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
    return "green" if score >= 85 else "amber" if score >= 50 else "red"


def rag_health(score):
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
    # legend wraps onto a second row when the labels will not fit one line
    # (seven segments did, and the last one printed as "Re" off the panel)
    legend, lx, rows_n = [], 0.0, 1
    for lab, v, col in segs:
        t = f"{lab} {v}"
        tw = 12 + 5.2 * len(t) + 16
        if lx + tw > w and lx > 0:
            rows_n += 1
            lx = 0.0
        legend.append((rows_n, lx, t, col))
        lx += tw
    h = bh + 26 + 16 * rows_n
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
    for row_i, lx, t, col in legend:
        ly = bh + 26 + 16 * (row_i - 1)
        out.append(f'<circle cx="{lx + 4:.1f}" cy="{ly - 3}" r="3.8" fill="{col}"/>')
        out.append(f'<text x="{lx + 12:.1f}" y="{ly}" fill="#C9D6E2" '
                   f'font-family="Lato, Calibri, sans-serif" font-size="8.8">{esc(t)}</text>')
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


def hbars(rows, w=636, colour="#F36F21", rowh=24, lab_w=172, right=None):
    """Horizontal bars on a dark panel - repairs by category.
    rows: (label, value) or (label, value, right_text). right_text, when
    given, prints instead of the bare value (e.g. '213 of 316')."""
    if not rows:
        return '<div class="note">Nothing recorded in the source.</div>'
    h = len(rows) * rowh + 10
    mx = max(r[1] for r in rows) or 1
    val_w = 46 if right is None else right
    out = [f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    for i, r in enumerate(rows):
        lab, v = r[0], r[1]
        rt = r[2] if len(r) > 2 else str(v)
        y = 5 + i * rowh
        bw = (w - lab_w - val_w) * (v / mx)
        out.append(f'<text x="0" y="{y + 12}" fill="#C9D6E2" '
                   f'font-family="Lato, Calibri, sans-serif" font-size="9">'
                   f'{esc(str(lab)[:34])}</text>')
        out.append(f'<rect x="{lab_w}" y="{y + 3.5}" width="{w - lab_w - val_w}" '
                   f'height="10" rx="5" fill="#26313D"/>')
        if v > 0:
            out.append(f'<rect x="{lab_w}" y="{y + 3.5}" '
                       f'width="{max(bw, 10):.1f}" height="10" rx="5" '
                       f'fill="{colour}"/>')
        out.append(f'<text x="{w}" y="{y + 12}" text-anchor="end" fill="#FFFFFF" '
                   f'font-family="Lato, Calibri, sans-serif" font-size="9.4" '
                   f'font-weight="700">{esc(rt)}</text>')
    out.append("</svg>")
    return "".join(out)


def combo_chart(labels, bars, line, w=636, h=210, bar_colour="#F36F21",
                line_colour="#22C55E", bar_label="Draws", line_label="Same day %",
                partial_last=False):
    """Bars on the left axis with a percentage line on the right axis -
    the monthly 'volume plus behaviour' picture. bars and line are lists
    the same length as labels; line values are 0-100."""
    n = len(labels)
    if n < 1:
        return '<div class="note">Nothing recorded in the source.</div>'
    top, base, pad_l, pad_r = 34, h - 28, 8, 40
    plot_w = w - pad_l - pad_r
    slot = plot_w / n
    bw = slot * 0.56
    bmax = (max(bars) or 1) * 1.18
    out = [f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    for g in (0.25, 0.5, 0.75, 1.0):
        y = base - (base - top) * g
        out.append(f'<line x1="{pad_l}" y1="{y:.1f}" x2="{w - pad_r}" y2="{y:.1f}" '
                   f'stroke="#26313D" stroke-width="0.7"/>')
        out.append(f'<text x="{w - pad_r + 6}" y="{y + 3:.1f}" fill="#5F7183" '
                   f'font-family="Lato, Calibri, sans-serif" font-size="7.4">{int(100 * g)}%</text>')
    out.append(f'<line x1="{pad_l}" y1="{base}" x2="{w - pad_r}" y2="{base}" '
               f'stroke="#3A4756" stroke-width="1"/>')
    xs = []
    for i, lab in enumerate(labels):
        x0 = pad_l + i * slot + (slot - bw) / 2
        v = bars[i]
        bh = (base - top) * (v / bmax)
        fill = bar_colour
        extra = ""
        if partial_last and i == n - 1:
            extra = ' fill-opacity="0.45"'
        out.append(f'<rect x="{x0:.1f}" y="{base - bh:.1f}" width="{bw:.1f}" '
                   f'height="{bh:.1f}" rx="3" fill="{fill}"{extra}/>')
        if v:
            out.append(f'<text x="{x0 + bw / 2:.1f}" y="{base - bh - 4:.1f}" '
                       f'text-anchor="middle" fill="#C9D6E2" '
                       f'font-family="Lato, Calibri, sans-serif" font-size="7.6">{num(v)}</text>')
        out.append(f'<text x="{x0 + bw / 2:.1f}" y="{base + 13}" text-anchor="middle" '
                   f'fill="#8A9AAC" font-family="Lato, Calibri, sans-serif" '
                   f'font-size="8">{esc(lab)}</text>')
        xs.append(x0 + bw / 2)

    def Y(p):
        return base - (base - top) * (p / 100.0)
    pts = " ".join(f"{xs[i]:.1f},{Y(line[i]):.1f}" for i in range(n))
    out.append(f'<polyline points="{pts}" fill="none" stroke="{line_colour}" '
               f'stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>')
    for i in range(n):
        out.append(f'<circle cx="{xs[i]:.1f}" cy="{Y(line[i]):.1f}" r="3.2" fill="{line_colour}"/>')
        out.append(f'<rect x="{xs[i] - 13:.1f}" y="{Y(line[i]) - 17:.1f}" width="26" height="11" '
                   f'rx="3" fill="#0F1620" fill-opacity="0.85"/>')
        out.append(f'<text x="{xs[i]:.1f}" y="{Y(line[i]) - 8.5:.1f}" text-anchor="middle" '
                   f'fill="#FFFFFF" font-family="Lato, Calibri, sans-serif" '
                   f'font-size="7.6" font-weight="700">{int(round(line[i]))}%</text>')
    lx = w - pad_r - 190
    out.append(f'<rect x="{lx}" y="5" width="9" height="9" rx="2" fill="{bar_colour}"/>'
               f'<text x="{lx + 13}" y="13" fill="#C9D6E2" font-family="Lato, Calibri, sans-serif" '
               f'font-size="8">{esc(bar_label)}</text>')
    out.append(f'<circle cx="{lx + 100}" cy="9.5" r="3.8" fill="{line_colour}"/>'
               f'<text x="{lx + 108}" y="13" fill="#C9D6E2" font-family="Lato, Calibri, sans-serif" '
               f'font-size="8">{esc(line_label)}</text>')
    out.append("</svg>")
    return "".join(out)


def daily_bars(rows, w=636, h=196, label_every=3, ok_colour="#1FA75A",
               bad_colour="#EF4444", ok_label="Back same day",
               bad_label="Not back same day"):
    """One stacked bar per calendar day: same-day returns under, non-returns
    on top, total printed above. rows: {label, draws, nsd, weekend, partial}."""
    n = len(rows)
    if n < 1:
        return '<div class="note">Nothing recorded in the source.</div>'
    top, base, pad_l, pad_r = 32, h - 26, 6, 10
    plot_w = w - pad_l - pad_r
    slot = plot_w / n
    bw = slot * 0.72
    mx = (max(r["draws"] for r in rows) or 1) * 1.16
    out = [f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    for g in (0.25, 0.5, 0.75, 1.0):
        y = base - (base - top) * g
        out.append(f'<line x1="{pad_l}" y1="{y:.1f}" x2="{w - pad_r}" y2="{y:.1f}" '
                   f'stroke="#26313D" stroke-width="0.7"/>')
    out.append(f'<line x1="{pad_l}" y1="{base}" x2="{w - pad_r}" y2="{base}" '
               f'stroke="#3A4756" stroke-width="1"/>')
    for i, r in enumerate(rows):
        x0 = pad_l + i * slot + (slot - bw) / 2
        ok = r["draws"] - r["nsd"]
        h_ok = (base - top) * ok / mx
        h_bad = (base - top) * r["nsd"] / mx
        op = ' fill-opacity="0.5"' if r.get("partial") else ""
        if r.get("weekend") and not r["draws"]:
            out.append(f'<rect x="{x0:.1f}" y="{base - 3}" width="{bw:.1f}" height="3" '
                       f'fill="#3A4756"/>')
        if h_ok > 0:
            out.append(f'<rect x="{x0:.1f}" y="{base - h_ok:.1f}" width="{bw:.1f}" '
                       f'height="{h_ok:.1f}" fill="{ok_colour}"{op}/>')
        if h_bad > 0:
            out.append(f'<rect x="{x0:.1f}" y="{base - h_ok - h_bad:.1f}" width="{bw:.1f}" '
                       f'height="{h_bad:.1f}" fill="{bad_colour}"{op}/>')
        if r["draws"]:
            out.append(f'<text x="{x0 + bw / 2:.1f}" y="{base - h_ok - h_bad - 3.5:.1f}" '
                       f'text-anchor="middle" fill="#C9D6E2" '
                       f'font-family="Lato, Calibri, sans-serif" font-size="6.8">{r["draws"]}</text>')
        if i % label_every == 0 or i == n - 1:
            anchor = "start" if i == 0 else "end" if i == n - 1 else "middle"
            out.append(f'<text x="{x0 + bw / 2:.1f}" y="{base + 12}" text-anchor="{anchor}" '
                       f'fill="#8A9AAC" font-family="Lato, Calibri, sans-serif" '
                       f'font-size="7">{esc(r["label"])}</text>')
    lx = w - 250
    out.append(f'<rect x="{lx}" y="5" width="9" height="9" rx="2" fill="{ok_colour}"/>'
               f'<text x="{lx + 13}" y="13" fill="#C9D6E2" font-family="Lato, Calibri, sans-serif" '
               f'font-size="8">{esc(ok_label)}</text>')
    out.append(f'<rect x="{lx + 118}" y="5" width="9" height="9" rx="2" fill="{bad_colour}"/>'
               f'<text x="{lx + 131}" y="13" fill="#C9D6E2" font-family="Lato, Calibri, sans-serif" '
               f'font-size="8">{esc(bad_label)}</text>')
    out.append("</svg>")
    return "".join(out)


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


def dtable(headers, rows, aligns=None, cls=""):
    """Zebra data table with the dark header row. cls="cp" for the compact
    appendix variant (smaller type, tighter rows)."""
    aligns = aligns or [""] * len(headers)
    th = "".join(f'<th class="{a}">{esc(h)}</th>' for h, a in zip(headers, aligns))
    body = []
    for i, r in enumerate(rows):
        z = ' class="z"' if i % 2 else ""
        tds = "".join(f'<td class="{a}">{c}</td>' for c, a in zip(r, aligns))
        body.append(f"<tr{z}>{tds}</tr>")
    k = f"dt {cls}".strip()
    return f'<table class="{k}"><tr>{th}</tr>{"".join(body)}</table>'


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


def footer(cfg, pno=None, ptot=None):
    """One footer for every page, fixed or flowing (03 Sep 2026): the team
    on the left, Author and POWERED BY SITEIQ in the centre, the page
    number on the right - the same three things in the same places as
    the flowing reports' margin boxes."""
    bits = []
    for p in cfg["team"]:
        sh = f'<span class="sh">{esc(p["shift"])}</span> ' if p.get("shift") else ""
        bits.append(f'{sh}<b>{esc(p["name"])}</b>, {esc(p["role"])}')
    line = " &middot; ".join(bits)
    tail = cfg.get("foot_note", "")
    if tail:
        line += f'  <span style="color:#B4C0CB">{esc(tail)}</span>'
    page = f"Page {pno} of {ptot}" if pno and ptot else ""
    return ('<div class="foot"><table class="foot-t"><tr>'
            f'<td class="fl"><div class="foot-h">Your Coates Tool Store Team</div>'
            f'<div class="foot-l">{line}</div></td>'
            f'<td class="fc">Author: <b>Andrew Fisher</b> &nbsp;|&nbsp; POWERED BY SITEIQ</td>'
            f'<td class="fr">{page}</td></tr></table></div>')


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
    Data as at: <b>{esc(asat_s)}</b> {esc(cfg.get("asat_note", "(workbook file time)"))} &nbsp;|&nbsp;
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
  </td>
</tr></table>"""


def render_page(cfg, inner, pno, ptot, gen_s, asat_s):
    """WHY (03 Sep 2026): the page number lives in the footer on every
    page (one convention with the flowing reports), and the key strip
    prints on page 1 only - a continuation page gets the room instead."""
    if pno == 1:
        head = (page1_head(cfg, gen_s, asat_s) + key_strip(cfg)
                + '<div class="grule"></div>')
        cls = "page page1"
    else:
        head = cont_head(cfg, asat_s, pno, ptot) + '<div class="grule"></div>'
        cls = "page"
    return (f'<div class="{cls}"><div class="frame">{head}'
            f'<div class="body">{inner}</div>{footer(cfg, pno, ptot)}</div></div>')



# =====================================================================
# PIL chart kit + Outlook-safe primitives (email)
# =====================================================================

# WHY (03 Sep 2026): the suite's own Lato files come first, so the phone
# card is drawn in the house face on every machine, like the PDFs.
_FONT_DIRS = [os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "fonts"),
              r"C:\Windows\Fonts", "/usr/share/fonts/truetype/dejavu",
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
        if v > 0:
            bw = max(22, (bx1 - bx0) * v / mx)
            d.rounded_rectangle([bx0, y + 10, bx0 + bw, y + 32], 11,
                                fill=colour)
        d.text((W - 30 - _tw(d, num(v), fb), y + 6), num(v), font=fb,
               fill="#FFFFFF")
    return img_tag(im, width, "bars")


FONT = ("font-family:Calibri,'Segoe UI',Arial,sans-serif;")


def esect(title):
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td style="padding:26px 0 0 0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td width="5" bgcolor="#F36F21" style="font-size:0;">&nbsp;</td>
<td bgcolor="#F4F5F7" style="{FONT}padding:13px 18px;font-size:15px;font-weight:bold;color:#16202C;">{title}</td>
</tr></table></td></tr></table>"""


def ecallout(inner, tight=False):
    fs = "13px" if tight else "14px"
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td style="padding:16px 0 0 0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td width="5" bgcolor="#F36F21" style="font-size:0;">&nbsp;</td>
<td bgcolor="#FDF0E7" style="{FONT}padding:15px 20px;font-size:{fs};line-height:1.85;color:#1F2A36;">{inner}</td>
</tr></table></td></tr></table>"""


def eo(s):
    return f'<span style="color:#D95F14;font-weight:bold;">{s}</span>'


def enote(inner):
    return (f'<div style="{FONT}font-size:11px;color:#7A8A9A;line-height:1.7;'
            f'padding:9px 2px 0 2px;">{inner}</div>')


def esubh(title, thin=""):
    t = f' <span style="font-weight:normal;color:#5A6875;">{thin}</span>' if thin else ""
    return (f'<div style="{FONT}font-size:15px;font-weight:bold;color:#16202C;'
            f'padding:20px 0 10px 0;">{title}{t}</div>')


def epanel(inner):
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td bgcolor="#171F2B" style="padding:14px;">{inner}</td></tr></table>"""


def etiles(items):
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


def edtable(headers, rows, aligns=None, right_cols=()):
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
    col = {"green": "#1FA75A", "amber": "#F5A623", "red": "#EF4444"}[rag(sc)]
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




def combo_png(labels, bars, line, width, bar_colour=None, line_colour="#22C55E",
              bar_label="Draws", line_label="Same day %", partial_last=False, h=440):
    """Email twin of combo_chart: bars (left axis) + percentage line (0-100)."""
    bar_colour = bar_colour or K["orange"]
    W, H = width * 2, h
    im, d = _panel(W, H)
    n = len(labels)
    if n < 1:
        return img_tag(im, width, "chart")
    top, base, pl, pr = 70, H - 56, 30, 84
    slot = (W - pl - pr) / n
    bw = slot * 0.56
    bmax = (max(bars) or 1) * 1.18
    fl, fv, fb = _font(18), _font(16), _font(18, True)
    for g in (0.25, 0.5, 0.75, 1.0):
        y = base - (base - top) * g
        d.line([(pl, y), (W - pr, y)], fill="#26313D", width=1)
        d.text((W - pr + 12, y - 10), f"{int(100 * g)}%", font=fv, fill="#5F7183")
    d.line([(pl, base), (W - pr, base)], fill="#3A4756", width=2)
    xs = []
    for i, lab in enumerate(labels):
        x0 = pl + i * slot + (slot - bw) / 2
        bh = (base - top) * bars[i] / bmax
        col = bar_colour
        if partial_last and i == n - 1:
            c = bar_colour.lstrip("#")
            rgb = tuple(int(c[j:j + 2], 16) for j in (0, 2, 4))
            col = tuple(int(v * 0.55 + 23 * 0.45) for v in rgb)
        d.rectangle([x0, base - bh, x0 + bw, base], fill=col)
        if bars[i]:
            d.text((x0 + bw / 2 - _tw(d, num(bars[i]), fv) / 2, base - bh - 24),
                   num(bars[i]), font=fv, fill="#C9D6E2")
        d.text((x0 + bw / 2 - _tw(d, lab, fl) / 2, base + 12), lab, font=fl, fill="#8A9AAC")
        xs.append(x0 + bw / 2)

    def Y(p):
        return base - (base - top) * p / 100.0
    pts = [(xs[i], Y(line[i])) for i in range(n)]
    if n > 1:
        d.line(pts, fill=line_colour, width=5, joint="curve")
    for i, (x, y) in enumerate(pts):
        d.ellipse([x - 7, y - 7, x + 7, y + 7], fill=line_colour)
        t = f"{int(round(line[i]))}%"
        tw = _tw(d, t, fb)
        d.rounded_rectangle([x - tw / 2 - 6, y - 36, x + tw / 2 + 6, y - 12], 5, fill="#0F1620")
        d.text((x - tw / 2, y - 34), t, font=fb, fill="#FFFFFF")
    lx = W - pr - 420
    d.rectangle([lx, 24, lx + 18, 42], fill=bar_colour)
    d.text((lx + 26, 20), bar_label, font=fl, fill="#C9D6E2")
    d.ellipse([lx + 200, 25, lx + 216, 41], fill=line_colour)
    d.text((lx + 226, 20), line_label, font=fl, fill="#C9D6E2")
    return img_tag(im, width, "volume and same-day trend")


def stacked_hbars_png(rows, segs, width, rowh=52, lab_w=300):
    """Email twin of stacked_hbars. rows: (label, [values]); segs: (name, colour)."""
    W = width * 2
    H = len(rows) * rowh + 70
    im, d = _panel(W, H)
    mx = max((sum(v) for _, v in rows), default=1) or 1
    fl, fb, fs = _font(19), _font(20, True), _font(16, True)
    lx = 30
    for name, col in segs:
        d.rectangle([lx, 22, lx + 16, 38], fill=col)
        d.text((lx + 24, 18), name, font=fl, fill="#C9D6E2")
        lx += 24 + _tw(d, name, fl) + 34
    bar_x0, bar_x1 = lab_w, W - 90
    for i, (lab, vals) in enumerate(rows):
        y = 58 + i * rowh
        d.text((30, y + 8), str(lab)[:28], font=fl, fill="#C9D6E2")
        d.rounded_rectangle([bar_x0, y + 8, bar_x1, y + 34], 6, fill="#26313D")
        x = bar_x0
        for (name, col), v in zip(segs, vals):
            if not v:
                continue
            sw = (bar_x1 - bar_x0) * v / mx
            d.rectangle([x, y + 8, x + sw, y + 34], fill=col)
            if sw > 30:
                d.text((x + sw / 2 - _tw(d, str(v), fs) / 2, y + 11), str(v), font=fs, fill="#FFFFFF")
            x += sw
        d.text((W - 30 - _tw(d, str(sum(vals)), fb), y + 8), str(sum(vals)), font=fb, fill="#FFFFFF")
    return img_tag(im, width, "stacked bars")

# =====================================================================
# v1.5 wow pass - movement, sparklines, heat grids, RAG band, cover,
# the Coates Way panel, the phone position card
# =====================================================================

def sparkline(values, w=118, h=26, colour="#F36F21", track="#2A3644"):
    """Tiny SVG line for a tile or score: None values are skipped; a single
    point draws a dot. Never draws anything for an empty series."""
    pts = [(i, v) for i, v in enumerate(values) if v is not None]
    if not pts:
        return ""
    n = max(len(values) - 1, 1)
    vals = [v for _, v in pts]
    lo, hi = min(vals), max(vals)
    span = (hi - lo) or 1
    def xy(i, v):
        return (2 + (w - 4) * i / n, 3 + (h - 6) * (1 - (v - lo) / span))
    coords = [xy(i, v) for i, v in pts]
    path = " ".join(f"{x:.1f},{y:.1f}" for x, y in coords)
    lx, ly = coords[-1]
    line = (f'<polyline points="{path}" fill="none" stroke="{colour}" stroke-width="1.8" '
            f'stroke-linejoin="round" stroke-linecap="round"/>' if len(coords) > 1 else "")
    return (f'<svg class="spark" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            f'<line x1="2" y1="{h - 3}" x2="{w - 2}" y2="{h - 3}" stroke="{track}" stroke-width="1"/>'
            f'{line}<circle cx="{lx:.1f}" cy="{ly:.1f}" r="2.6" fill="{colour}"/></svg>')


def tiles_plus(items, per_row=4):
    """Dark KPI tiles with an optional sparkline under the note.
    items: (icon, value, label, note, note_class[, spark_values])."""
    out = []
    for i in range(0, len(items), per_row):
        chunk = items[i:i + per_row]
        cells = []
        for it in chunk:
            ico, val, lab, note, ncls = it[:5]
            spark = it[5] if len(it) > 5 else None
            sm = " sm" if len(str(val)) > 7 else ""
            n = (f'<div class="t-note {ncls}">{esc(note)}</div>' if note else "")
            sp = f'<div class="t-spark">{sparkline(spark)}</div>' if spark else ""
            cells.append(f'<td><div class="t-ico">{icon(ico)}</div>'
                         f'<div class="t-num{sm}">{esc(val)}</div>'
                         f'<div class="t-lab">{esc(lab)}</div>{n}{sp}</td>')
        while len(cells) < per_row:
            cells.append('<td style="background:transparent"></td>')
        out.append(f'<table class="tiles"><tr>{"".join(cells)}</tr></table>')
    return "".join(out)


def heatgrid(matrix, row_labels, col_labels, w=636, cell_h=17, colour=(243, 111, 33),
             label_w=54, show_values=True, empty="#1C2532"):
    """Rows x columns heat grid on the dark panel. matrix[r][c] are counts;
    cell colour scales with the count against the grid maximum; the count
    is printed in the cell. Zero cells stay dark - nothing is smoothed."""
    rows, cols = len(matrix), len(col_labels)
    mx = max((v for r in matrix for v in r), default=0) or 1
    cw = (w - label_w) / cols
    top = 16
    h = top + rows * cell_h + 4
    out = [f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    for c, lab in enumerate(col_labels):
        if lab:
            out.append(f'<text x="{label_w + c * cw + cw / 2:.1f}" y="10" text-anchor="middle" '
                       f'fill="#8A9AAC" font-family="Lato, Calibri, sans-serif" font-size="7.4">{esc(lab)}</text>')
    for r in range(rows):
        y = top + r * cell_h
        out.append(f'<text x="0" y="{y + cell_h * 0.68:.1f}" fill="#C9D6E2" '
                   f'font-family="Lato, Calibri, sans-serif" font-size="8.6">{esc(row_labels[r])}</text>')
        for c in range(cols):
            v = matrix[r][c] if c < len(matrix[r]) else 0
            x = label_w + c * cw
            if v:
                a = 0.18 + 0.82 * (v / mx) ** 0.6
                fill = f"rgba({colour[0]},{colour[1]},{colour[2]},{a:.2f})"
            else:
                fill = empty
            out.append(f'<rect x="{x + 0.6:.1f}" y="{y + 0.6}" width="{cw - 1.2:.1f}" '
                       f'height="{cell_h - 1.2}" rx="2.5" fill="{fill}"/>')
            if show_values and v:
                tcol = "#16202C" if v / mx > 0.55 else "#FFFFFF"
                out.append(f'<text x="{x + cw / 2:.1f}" y="{y + cell_h * 0.68:.1f}" text-anchor="middle" '
                           f'fill="{tcol}" font-family="Lato, Calibri, sans-serif" font-size="6.8" '
                           f'font-weight="700">{v}</text>')
    out.append("</svg>")
    return "".join(out)


def rag_of(value, amber_at, red_at, higher_is_worse=True):
    """Green / Amber / Red from two thresholds. Thresholds are printed on
    the page by the caller - a rating without its rule is decoration."""
    if higher_is_worse:
        return "red" if value >= red_at else "amber" if value >= amber_at else "green"
    return "red" if value <= red_at else "amber" if value <= amber_at else "green"


def rag_band(status, headline, rule, owner, action, tight=False):
    """The page-1 RAG band: status pill, the headline in words, then the
    rule that produced it, who owns it and the next action with its due."""
    cls = {"green": "g", "amber": "a", "red": "rd"}[status]
    word = {"green": "Green", "amber": "Amber", "red": "Red"}[status]
    return (f'<div class="ragband {cls}{" tight" if tight else ""}"><div class="pill">{word}</div><div class="rb">'
            f'<div class="rh">{headline}</div>'
            f'<table class="rg"><tr>'
            f'<td><div class="rk">The rule</div><div class="rv">{rule}</div></td>'
            f'<td><div class="rk">Owner</div><div class="rv">{owner}</div></td>'
            f'<td><div class="rk">Next action and by when</div><div class="rv">{action}</div></td>'
            f'</tr></table></div></div>')


_COG_B64 = None


def cog_b64(width=360):
    """The official Coates Way cog, downscaled once and inlined - never
    redrawn. Empty string if the asset is not beside the scripts."""
    global _COG_B64
    if _COG_B64 is None:
        p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "coates-way-cog.png")
        try:
            im = Image.open(p).convert("RGBA")
            im.thumbnail((width, width))
            _COG_B64 = _png_b64(im)
        except OSError:
            _COG_B64 = ""
    return _COG_B64


def coates_way_panel():
    """Closing-page panel: the Coates Way cog with the objective and values."""
    b = cog_b64()
    img = f'<div class="img"><img src="data:image/png;base64,{b}" alt="The Coates Way"></div>' if b else ""
    return (f'<div class="cway">{img}<div class="txt"><div class="h">The Coates Way</div>'
            f'<div class="p">Australia&rsquo;s most trusted equipment partner - delivering Best Service &amp; Value.</div>'
            f'<div class="v"><b>Care Deeply</b> &middot; <b>Customer Focused</b> &middot; <b>Be Our Best</b> &middot; '
            f'<b>One Team</b> &middot; <b>Competitive Spirit</b><br>Every figure in this report is counted from '
            f'the SiteIQ exports named on its data page. Nothing is estimated, weighted or typed in.</div></div></div>')


def freshness_line(asat_dt, gen_dt=None):
    """'Pulled 02 Sep 2026 18:30 - built 03 Sep 2026 00:34 - 6 h old at build'
    - the honest age of the data in one line. Needs real datetimes; an
    unknown pull time prints nothing rather than a guess."""
    if asat_dt is None:
        return ""
    gen_dt = gen_dt or datetime.now()
    age_h = max(0, (gen_dt - asat_dt).total_seconds() / 3600)
    age = f"{age_h:.0f} h" if age_h < 48 else f"{age_h / 24:.0f} days"
    return (f"Pulled <b>{asat_dt:%d %b %Y %H:%M}</b> &nbsp;&middot;&nbsp; built <b>{gen_dt:%d %b %Y %H:%M}</b> "
            f"&nbsp;&middot;&nbsp; <b>{age}</b> old at build")


def cover_contents(contents, max_rows=10):
    """'What's inside' on the cover: (title, page) rows. Real page numbers
    only - pdf_finish.contents_from_pdf reads them off the printed PDF."""
    rows = [(t, p) for t, p in (contents or []) if t][:max_rows]
    if not rows:
        return ""
    trs = "".join(f'<tr><td class="ct">{esc(str(t))}</td><td class="cp">{esc(str(p))}</td></tr>' for t, p in rows)
    return f'<div class="cover-toc"><div class="h">What&rsquo;s inside</div><table>{trs}</table></div>'


def cover_inner(cfg, big, big_label, lines, gen_s, asat_s, rag=None, fresh="", contents=None):
    """rag: 'red' / 'amber' / 'green' paints a stripe down the cover's left
    edge so the status shows before the report opens. fresh: the
    freshness line (freshness_line()) printed under the as-at stamp.
    contents: (title, page) rows for the 'What's inside' block."""
    b = cog_b64()
    cog = f'<img class="cover-cog" src="data:image/png;base64,{b}" alt="">' if b else ""
    sm = " sm" if len(str(big)) > 6 else ""
    stripe = (f'<div class="cover-stripe" style="background:{rag_colour(rag)}"></div>'
              f'<div class="cover-status" style="color:{rag_colour(rag)}">{esc(rag.upper())}</div>') if rag else ""
    fresh_html = f'<div class="fresh">{fresh}</div>' if fresh else ""
    return (stripe + f'<div class="cover-in"><div class="kicker">{esc(cfg["kicker"])}</div>'
            f'<h1>{esc(cfg["client"])} {esc(cfg["title"])}</h1>'
            f'<div class="sub">{esc(cfg["project"])}</div><div class="rule"></div>'
            f'<div class="big{sm}">{esc(big)}</div><div class="biglab">{esc(big_label)}</div>'
            f'<div class="lines">{"<br>".join(lines)}</div>'
            f'<div class="meta">Data as at <b>{esc(asat_s)}</b> {esc(cfg.get("asat_note", ""))}<br>'
            f'Generated <b>{esc(gen_s)}</b> &nbsp;|&nbsp; Author: <b>Andrew Fisher</b></div>{fresh_html}</div>'
            f'{cover_contents(contents)}'
            f'<div class="cover-siteiq">POWERED BY <span class="q">SITEIQ</span>'
            f'<span class="tag">Equipped for anything</span></div>{cog}')


def cover_page(cfg, big, big_label, lines, gen_s, asat_s, rag=None, fresh="", contents=None):
    """A full dark cover for client packs (fixed-page families): the one
    number of the day, its label, a few true lines, the as-at stamp,
    the RAG stripe and the freshness line."""
    return (f'<div class="page cover"><div class="frame">'
            f'{cover_inner(cfg, big, big_label, lines, gen_s, asat_s, rag, fresh, contents)}</div></div>')


def position_card_png(cfg, asat_s, tiles, band, scores, path, foot=""):
    """A 1080 x 1920 PNG of the position for a phone: dark card, orange
    bar, kicker and title, up to six big tiles, the RAG band, score bars,
    the footer. Everything drawn from the values handed in - the same ones
    printed on page 1. tiles: (value, label, note, note_colour)."""
    W, H = 1080, 1920
    im = Image.new("RGB", (W, H), "#1A2430")
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 14], fill="#F36F21")
    fk, fs = _font(26, True), _font(30)
    d.text((64, 70), cfg["kicker"].upper(), font=fk, fill="#F36F21")
    title = f'{cfg["client"]} {cfg["title"]}'
    tsize = 64
    while tsize > 30 and _tw(d, title, _font(tsize, True)) > W - 128:
        tsize -= 2
    d.text((64, 118), title, font=_font(tsize, True), fill="#FFFFFF")
    d.text((64, 206), cfg["project"], font=fs, fill="#A7B6C4")
    d.text((64, 252), f"Data as at {asat_s}", font=_font(28, True), fill="#FFFFFF")
    y = 330
    cols = 2
    tw, th, gap = 464, 214, 22
    fv, fl, fn = _font(72, True), _font(24), _font(26, True)
    for i, (val, lab, note, ncol) in enumerate(tiles[:6]):
        r, c = divmod(i, cols)
        x0 = 64 + c * (tw + gap)
        y0 = y + r * (th + gap)
        d.rounded_rectangle([x0, y0, x0 + tw, y0 + th], radius=26, fill="#171F2B")
        f = fv if len(str(val)) <= 9 else _font(52, True)
        d.text((x0 + tw / 2, y0 + 82), str(val), font=f, fill="#FFFFFF", anchor="mm")
        d.text((x0 + tw / 2, y0 + 140), lab.upper(), font=fl, fill="#8A9AAC", anchor="mm")
        if note:
            d.text((x0 + tw / 2, y0 + 180), note, font=fn, fill=ncol or "#7A8A9A", anchor="mm")
    y += ((min(len(tiles), 6) + cols - 1) // cols) * (th + gap) + 20
    if band:
        status, headline, owner, action = band
        col = {"green": "#1FA75A", "amber": "#F5A623", "red": "#EF4444"}[status]
        fh, fb = _font(28, True), _font(24)
        h_lines = _wrap(d, headline, fh, W - 64 - 300)[:4]
        a_lines = _wrap(d, f"Next: {action}", fb, W - 64 - 300)[:3]
        bh = 30 + len(h_lines) * 38 + 8 + 34 + len(a_lines) * 32 + 22   # the band sizes itself
        d.rounded_rectangle([64, y, W - 64, y + bh], radius=26, fill="#F6F7F9")
        d.rounded_rectangle([64, y, 260, y + bh], radius=26, fill=col)
        d.rectangle([200, y, 260, y + bh], fill=col)
        d.text((162, y + bh / 2), status.upper(), font=_font(34, True),
               fill="#16202C" if status == "amber" else "#FFFFFF", anchor="mm")
        yy = y + 30
        for line in h_lines:
            d.text((300, yy), line, font=fh, fill="#16202C"); yy += 38
        yy += 8
        d.text((300, yy), f"Owner: {owner}", font=fb, fill="#35404E"); yy += 34
        for line in a_lines:
            d.text((300, yy), line, font=fb, fill="#35404E"); yy += 32
        y += bh + 26
    # score rows share whatever height is left above the footer
    room = (H - 170) - y
    step = min(88, max(56, room // max(len(scores[:4]), 1))) if scores else 0
    for lab, sc in scores[:4]:
        colr = {"green": "#1FA75A", "amber": "#F5A623", "red": "#EF4444"}[rag(sc)]
        d.text((64, y), lab, font=_font(26, True), fill="#FFFFFF")
        d.rounded_rectangle([64, y + 40, W - 64, y + 60], radius=10, fill="#2A3644")
        d.rounded_rectangle([64, y + 40, 64 + int((W - 128) * max(2, min(100, sc)) / 100), y + 60],
                            radius=10, fill=colr)
        d.text((W - 64, y), f"{sc}/100", font=_font(26, True), fill="#FFFFFF", anchor="ra")
        y += step
    d.rectangle([64, H - 150, W - 64, H - 149], fill="#2A3644")
    d.text((64, H - 128), "YOUR COATES TOOL STORE TEAM", font=_font(20, True), fill="#F36F21")
    team = " · ".join(f'{p["name"]} {p["role"]}'.strip() for p in cfg.get("team", []))
    d.text((64, H - 96), f"{team}  ·  Author: Andrew Fisher", font=_font(22), fill="#A7B6C4")
    d.text((W - 64, H - 128), "POWERED BY SITEIQ", font=_font(22, True), fill="#FFFFFF", anchor="ra")
    if foot:
        d.text((64, H - 62), foot[:110], font=_font(19), fill="#8395A6")
    im.save(path, "PNG", optimize=True)
    return path


def _wrap(d, text, font, width):
    words, lines, cur = str(text).split(), [], ""
    for w_ in words:
        t = (cur + " " + w_).strip()
        if _tw(d, t, font) <= width or not cur:
            cur = t
        else:
            lines.append(cur); cur = w_
    if cur:
        lines.append(cur)
    return lines

# ---------------------------------------------------------------------------
# 03 Sep 2026 - the 10/10 pass: stacked ageing bars, a proper line chart,
# the three-things list, the cover stripe and freshness line
# ---------------------------------------------------------------------------
AGE_BANDS = ((0, 30, "0-30 days", "#22C55E"), (31, 60, "31-60", "#EFA82B"),
             (61, 90, "61-90", "#F36F21"), (91, None, "90+ days", "#F0603E"))


def age_band_index(days):
    """0..3 for the four ageing bands; None days = the first band."""
    if days is None:
        return 0
    for i, (lo, hi, _, _) in enumerate(AGE_BANDS):
        if hi is None or days <= hi:
            return i
    return len(AGE_BANDS) - 1


def stacked_hbars(rows, w=636, rowh=22, lab_w=150, val_w=52, colours=None, legend=True,
                  labels=None, max_h=760):
    """Stacked horizontal bars on the dark panel: one row per company, four
    segments (the ageing bands by default). rows: (label, [n0, n1, n2, n3]).
    Every segment prints its count when it is wide enough to hold it; the
    row total sits on the right. Bars share one scale (the largest total).
    Nothing is drawn for an empty list."""
    if not rows:
        return '<div class="note">Nothing recorded in the source.</div>'
    colours = colours or [b[3] for b in AGE_BANDS]
    labels = labels or [b[2] for b in AGE_BANDS]
    top = 18 if legend else 4
    # WHY (03 Sep 2026): a long list (40 companies) shrinks its rows to
    # stay inside max_h, so the panel never runs off the page area
    if max_h and top + len(rows) * rowh + 6 > max_h:
        rowh = max(13, (max_h - top - 6) / len(rows))
    h = top + len(rows) * rowh + 6
    mx = max(sum(r[1]) for r in rows) or 1
    bar_w = w - lab_w - val_w
    out = [f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    if legend:
        # WHY (03 Sep 2026): each band's total sits in the legend, so the
        # picture reads without relying on the colours alone
        band_tot = [sum(r[1][i] for r in rows if i < len(r[1])) for i in range(len(colours))]
        x = lab_w
        for c, lab, bt in zip(colours, labels, band_tot):
            lab = f"{lab} \u00b7 {num(bt)}"
            out.append(f'<rect x="{x}" y="3" width="9" height="9" rx="2" fill="{c}"/>')
            out.append(f'<text x="{x + 13}" y="11" fill="#C9D6E2" font-family="Lato, Calibri, sans-serif" '
                       f'font-size="8">{esc(lab)}</text>')
            x += 13 + 4.6 * len(lab) + 14
    for i, (lab, segs) in enumerate(rows):
        y = top + i * rowh
        tot = sum(segs)
        fs = 9 if rowh >= 18 else 7.6
        out.append(f'<text x="0" y="{y + 12:.1f}" fill="#C9D6E2" font-family="Lato, Calibri, sans-serif" '
                   f'font-size="{fs}">{esc(str(lab)[:30])}</text>')
        out.append(f'<rect x="{lab_w}" y="{y + 3:.1f}" width="{bar_w}" height="11" rx="5.5" fill="#26313D"/>')
        x = lab_w
        for c, v in zip(colours, segs):
            if v <= 0:
                continue
            sw = bar_w * v / mx
            out.append(f'<rect x="{x:.1f}" y="{y + 3}" width="{max(sw, 2):.1f}" height="11" fill="{c}"/>')
            if sw >= 16:
                out.append(f'<text x="{x + sw / 2:.1f}" y="{y + 11.6}" text-anchor="middle" fill="#0F1620" '
                           f'font-family="Lato, Calibri, sans-serif" font-size="7.6" font-weight="700">{v}</text>')
            x += sw
        # rounded ends on the filled part: clip with a rounded rect on top
        out.append(f'<rect x="{lab_w}" y="{y + 3}" width="{bar_w}" height="11" rx="5.5" fill="none" '
                   f'stroke="#1A2430" stroke-width="2"/>')
        out.append(f'<text x="{w}" y="{y + 12}" text-anchor="end" fill="#FFFFFF" '
                   f'font-family="Lato, Calibri, sans-serif" font-size="9.4" font-weight="700">{num(tot)}</text>')
    out.append("</svg>")
    return "".join(out)


def line_chart(labels, series, w=636, h=200, colours=None, y_label="", pct=False,
               show_values=True):
    """Lines over time on the dark panel. labels: x captions (dates);
    series: [(name, [values...]), ...] - None values leave a gap. Each
    series keeps its own colour; the legend sits at the top; the last
    value of each series is printed at its end. One shared y axis from 0."""
    n = len(labels)
    if n < 2 or not series:
        return '<div class="note">Not enough days on record yet for a trend line.</div>'
    colours = colours or ["#F36F21", "#22C55E", "#EFA82B", "#5DADE2", "#C9D6E2"]
    top, base, pad_l, pad_r = 26, h - 26, 34, 44
    allv = [v for _, vs in series for v in vs if v is not None]
    if not allv:
        return '<div class="note">Not enough days on record yet for a trend line.</div>'
    hi = 100 if pct else max(allv)
    hi = hi or 1
    step = max(1, (n - 1) // 8 or 1)
    # WHY (03 Sep 2026): the left gutter sizes itself from the widest tick
    # label, so a seven-digit dollar axis never loses its first digit
    widest = max(len(f"{num(round(hi * (1 - k / 4)))}{'%' if pct else ''}") for k in range(5))
    pad_l = max(pad_l, int(widest * 4.6) + 10)
    out = [f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    # grid
    for k in range(5):
        y = top + (base - top) * k / 4
        gv = hi * (1 - k / 4)
        out.append(f'<line x1="{pad_l}" y1="{y:.1f}" x2="{w - pad_r}" y2="{y:.1f}" stroke="#2A3644" stroke-width="1"/>')
        out.append(f'<text x="{pad_l - 5}" y="{y + 3:.1f}" text-anchor="end" fill="#8A9AAC" '
                   f'font-family="Lato, Calibri, sans-serif" font-size="7.6">{num(round(gv))}{"%" if pct else ""}</text>')
    def x_of(i):
        return pad_l + (w - pad_l - pad_r) * i / (n - 1)
    def y_of(v):
        return top + (base - top) * (1 - v / hi)
    for i, lab in enumerate(labels):
        if i % step == 0 or i == n - 1:
            out.append(f'<text x="{x_of(i):.1f}" y="{base + 14}" text-anchor="middle" fill="#8A9AAC" '
                       f'font-family="Lato, Calibri, sans-serif" font-size="7.6">{esc(str(lab))}</text>')
    lx = pad_l
    for (name, vals), c in zip(series, colours):
        pts = [(x_of(i), y_of(v)) for i, v in enumerate(vals) if v is not None]
        if len(pts) > 1:
            out.append('<polyline points="' + " ".join(f"{x:.1f},{y:.1f}" for x, y in pts) +
                       f'" fill="none" stroke="{c}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>')
        for x, y in pts:
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="2.4" fill="{c}"/>')
        if pts and show_values:
            last = [v for v in vals if v is not None][-1]
            out.append(f'<text x="{pts[-1][0] + 6:.1f}" y="{pts[-1][1] + 3.5:.1f}" fill="{c}" '
                       f'font-family="Lato, Calibri, sans-serif" font-size="8.6" font-weight="700">'
                       f'{num(last) if not isinstance(last, float) else f"{last:g}"}{"%" if pct else ""}</text>')
        out.append(f'<rect x="{lx}" y="4" width="9" height="9" rx="2" fill="{c}"/>')
        out.append(f'<text x="{lx + 13}" y="12" fill="#C9D6E2" font-family="Lato, Calibri, sans-serif" '
                   f'font-size="8.2">{esc(name)}</text>')
        lx += 13 + 5.6 * len(name) + 16
    if y_label:
        out.append(f'<text x="{w - pad_r}" y="12" text-anchor="end" fill="#8A9AAC" '
                   f'font-family="Lato, Calibri, sans-serif" font-size="7.6">{esc(y_label)}</text>')
    out.append("</svg>")
    return "".join(out)


def three_things(items, title="Three things to do today"):
    """The action-first block for page 1: up to three numbered actions,
    each (what, why, who_by). Drawn from the data by the caller; the
    block never invents an action - fewer than three prints fewer."""
    items = [i for i in items if i and i[0]][:3]
    if not items:
        return ""
    rows = "".join(
        f'<div class="t3"><div class="n">{k}</div><div class="w"><b>{esc(what)}</b>'
        f'<span class="why">{esc(why)}</span></div><div class="who">{esc(who)}</div></div>'
        for k, (what, why, who) in enumerate(items, 1))
    return f'<div class="three"><div class="t3h">{esc(title)}</div>{rows}</div>'


def rag_colour(status):
    return {"red": "#F0603E", "amber": "#EFA82B", "green": "#22C55E"}.get(
        (status or "").lower(), "#8A9AAC")

# ---------------------------------------------------------------------------
# 03 Sep 2026 - the shared, font-aware fit check for fixed A4 pages
# ---------------------------------------------------------------------------
FIT_MEASURE_JS = r"""<script>
document.fonts.ready.then(function(){
  var out = [];
  var pages = document.querySelectorAll('.page');
  for (var i = 0; i < pages.length; i++) {
    var pg = pages[i];
    var body = pg.querySelector('.body');
    var foot = pg.querySelector('.foot');
    if (!body || !foot) { out.push({page: i + 1, over: null, wide: 0}); continue; }   // the cover: no footer by design
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
  d.setAttribute('data-lato', document.fonts.check('12px Lato') ? '1' : '0');
  d.textContent = JSON.stringify(out);
  document.body.appendChild(d);
});
</script>"""


def find_browser():
    """Edge / Chrome / Chromium for headless printing and measuring."""
    import shutil
    for name in ("msedge", "chrome", "chromium", "chromium-browser", "google-chrome"):
        if shutil.which(name):
            return shutil.which(name)
    for p in (r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
              r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
              r"C:\Program Files\Google\Chrome\Application\chrome.exe",
              r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"):
        if os.path.exists(p):
            return p
    return None


def fit_check(doc, css, label, out_dir):
    """Measure every fixed page in the browser WITH the house face loaded.
    WHY (03 Sep 2026): k2style.css embeds Lato, and a measurement taken
    before the font files load sees the fallback face - up to 9 px off on
    a page with 0 px to spare. This waits on document.fonts.ready under a
    virtual-time budget, with the page written in out_dir (the report's
    own folder, so the relative font URLs resolve), so the pixels it
    reports are the pixels the PDF prints. Returns (ok, worst_spare_px,
    rows) with rows (page, px past the footer, px too wide); ok is None
    when nothing could measure - never a reason not to build."""
    import json as _json
    import subprocess
    import tempfile
    from pathlib import Path
    browser = find_browser()
    if not browser:
        print(f"Fit check            : skipped - no browser to measure with ({label})")
        return None, None, []
    doc2 = (doc.replace("</head>", f"<style>{css}</style></head>", 1)
               .replace("</body>", FIT_MEASURE_JS + "</body>", 1))
    tmp = Path(out_dir) / f"__measure_{os.getpid()}__.html"
    profile = os.path.join(tempfile.gettempdir(), f"coates_fit_{os.getpid()}")
    try:
        tmp.write_text(doc2, encoding="utf-8")
        res = subprocess.run([browser, "--headless", "--disable-gpu", "--no-sandbox",
                              "--no-first-run", "--user-data-dir=" + profile,
                              "--virtual-time-budget=10000", "--dump-dom", tmp.as_uri()],
                             capture_output=True, timeout=240)
        dom = (res.stdout or b"").decode("utf-8", "ignore")
    except Exception as e:
        print(f"Fit check            : skipped ({type(e).__name__}) ({label})")
        return None, None, []
    finally:
        try:
            tmp.unlink()
        except OSError:
            pass
    m = re.search(r'id="layout-report" data-lato="(\d)">(\[.*?\])</div>', dom, re.S)
    if not m:
        print(f"Fit check            : skipped - the page could not be measured ({label})")
        return None, None, []
    rows = [(r["page"], r["over"], r["wide"]) for r in _json.loads(m.group(2))]
    face = "Lato" if m.group(1) == "1" else "FALLBACK FACE - Lato did not load"
    rows = [r for r in rows if r[1] is not None]      # the cover carries no footer
    bad = [r for r in rows if r[1] > 0 or r[2] > 0]
    worst = max((r[1] for r in rows), default=-9999)
    if bad:
        print("*" * 68)
        print(f"WARNING: CONTENT DOES NOT FIT in {label} - do not send as is ({face}).")
        for pg, over, wide in bad:
            print(f"  page {pg:2d}: {over:+d}px past the footer" + (f", {wide}px too wide" if wide > 0 else ""))
        print("*" * 68)
        return False, -worst, rows
    print(f"Fit check            : PASS - tightest page has {-worst}px to spare, measured in {face} ({label})")
    return True, -worst, rows




def split_long_tail(rows, min_total=10):
    """(chart_rows, tail_rows): rows whose total is at least min_total go
    on the chart; the rest are the long tail for a small table. When no
    row reaches the line, everything is charted (a chart with nothing on
    it is worse than a busy one). rows: (label, [segments])."""
    big = [r for r in rows if sum(r[1]) >= min_total]
    if not big:
        return list(rows), []
    return big, [r for r in rows if sum(r[1]) < min_total]
