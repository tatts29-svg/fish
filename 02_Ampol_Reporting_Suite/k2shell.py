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
        if v > 0:
            out.append(f'<rect x="{lab_w}" y="{y + 3.5}" '
                       f'width="{max(bw, 10):.1f}" height="10" rx="5" '
                       f'fill="{colour}"/>')
        out.append(f'<text x="{w}" y="{y + 12}" text-anchor="end" fill="#FFFFFF" '
                   f'font-family="Lato, Calibri, sans-serif" font-size="9.4" '
                   f'font-weight="700">{v}</text>')
    out.append("</svg>")
    return "".join(out)


# =====================================================================
# HTML component builders (PDF)
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
# PIL chart kit + Outlook-safe primitives (email)
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


