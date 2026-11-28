#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
k2flow - the Coates house frame for FLOWING reports.
Author: Andrew Fisher | POWERED BY SITEIQ

WHAT THIS IS
  k2shell renders fixed A4 pages (each page authored by hand, measured
  in the browser). Some reports are long registers - the tooling on-hire
  register, the radio report, the stocktake floor worklist - where the
  content has to flow and paginate itself. This module gives those
  reports the SAME look as the fixed-page family:

    - the orange rounded frame on every printed page
    - the dark hero band on page 1 (kicker, title, project, as-at, author)
    - a compact running header on every page (kicker, title, as-at)
    - the KEY strip under the hero
    - a footer on every page: the tool store team, Author, POWERED BY
      SITEIQ, and "Page N of M"
    - the k2style tiles, tables, callouts, notes and SVG charts

HOW (02 Sep 2026)
  Chromium repeats position:fixed elements on every printed page, and
  (from version 131) honours @page margin boxes with page counters. The
  frame and running header are fixed; the footer lives in the page
  margin boxes so it never collides with content. Page margins are set
  so content always sits inside the frame. Edge on a Coates laptop is
  current Chromium, so the PDF looks the same on site as it does here.
"""
import re
from pathlib import Path

import k2shell as sh
from k2shell import esc

BASE = Path(__file__).resolve().parent


def _house_css():
    """k2style.css minus the fixed-page geometry (page, frame, foot, body)."""
    css = (BASE / "k2style.css").read_text(encoding="utf-8")
    css = re.sub(r"@page\s*\{[^}]*\}", "", css)
    for sel in (r"\.page:last-child", r"\.page", r"\.frame", r"\.foot-h", r"\.foot-l \.sh",
                r"\.foot-l b", r"\.foot-l", r"\.foot", r"\.body", r"\.mast", r"\.mast \.wm",
                r"\.mast \.tag", r"\.mast \.mt", r"\.mast \.ms", r"\.mast \.ms b"):
        css = re.sub(r"(?m)^" + sel + r"\s*\{[^}]*\}\s*", "", css)
    return css


FLOW_CSS = """
/* ---------- flowing-report frame (k2flow v2.0, 06 Nov 2026) ----------
   The pack's page: a dark masthead across the top of every page and a
   dark footer bar across the bottom, both position:fixed (Chromium
   repeats fixed elements on every printed page); the page number and the
   site line sit in the bottom page margin as @page margin boxes (Chromium
   131+ renders them with the page counter). Content is plain block flow
   between the bars, so a block that must stay whole simply moves on. */
@page {
  size: A4 portrait;
  margin: 5mm 0 7.5mm 0;
  @bottom-left  { content: "__PROJECT__"; vertical-align: top; margin-left: 9mm; margin-top: 1.3mm;
                  font-family: "Inter","Segoe UI","Calibri",sans-serif;
                  font-size: 6.4pt; color: #9AA2AC; }
  @bottom-right { content: "Page " counter(page) " of " counter(pages); vertical-align: top; margin-right: 9mm; margin-top: 1.3mm;
                  font-family: "Inter","Segoe UI","Calibri",sans-serif;
                  font-size: 7pt; font-weight: 700; color: #5B6472; }
}
.k2mast { position: fixed; top: 0; left: 0; right: 0; height: 15mm; background: #1D1D1B;
          border-bottom: 3px solid #F26222; color: #FFFFFF; }
.k2mast .wm { position: absolute; left: 9mm; top: 4.1mm; font-size: 13pt; font-weight: 700; letter-spacing: 4pt; line-height: 1; }
.k2mast .tag { position: absolute; left: 9mm; top: 10.3mm; font-size: 4.9pt; font-weight: 600; letter-spacing: 2pt; color: #9AA2AC; line-height: 1; }
.k2mast .mt { position: absolute; right: 9mm; top: 4mm; text-align: right; font-size: 9pt; font-weight: 700; line-height: 1.2; white-space: nowrap; }
.k2mast .ms { position: absolute; right: 9mm; top: 9.2mm; text-align: right; font-size: 6.8pt; color: #9AA2AC; line-height: 1.3; white-space: nowrap; }
.k2mast .ms b { color: #FFFFFF; font-weight: 600; }
.k2foot { position: fixed; bottom: 0; left: 0; right: 0; height: 9.5mm; background: #1D1D1B;
          border-top: 2px solid #F26222; color: #9AA2AC; }
.k2foot .fl { position: absolute; left: 9mm; top: 2.2mm; }
.k2foot .fwm { font-size: 7.2pt; font-weight: 700; letter-spacing: 2pt; color: #FFFFFF; line-height: 1.2; }
.k2foot .fwm .sep { color: #5B6472; font-weight: 400; letter-spacing: 0; margin: 0 5px; }
.k2foot .fwm .pw { font-size: 6.4pt; letter-spacing: 0.6pt; color: #9AA2AC; font-weight: 600; }
.k2foot .fwm .pw .q { color: #F26222; }
.k2foot .fwm .au { font-size: 6.4pt; letter-spacing: 0; color: #9AA2AC; font-weight: 400; }
.k2foot .fc { font-size: 6.2pt; color: #9AA2AC; margin-top: 0.6mm; }
.k2foot .fr { position: absolute; right: 9mm; top: 2.6mm; text-align: right; font-size: 6.4pt; color: #9AA2AC; line-height: 1.5; }
.k2foot .fr b { color: #FFFFFF; font-weight: 600; }
/* cloned padding: every page fragment gets the same inset from the bars */
.k2body { padding: 20mm 9mm 13mm 9mm; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
.k2body .sect { break-after: avoid; page-break-after: avoid; }
.k2body .sub-h { break-after: avoid; page-break-after: avoid; }
.k2body .sect + .note, .k2body .sect + .callout, .k2body .sub-h + .chartpanel { break-before: avoid; page-break-before: avoid; }
.k2body table.dt thead { display: table-header-group; }
.k2body table.dt tr { break-inside: avoid; page-break-inside: avoid; }
.k2body .tiles, .k2body .callout, .k2body .note, .k2body .chartpanel, .k2body .alerts,
.k2body .donut-wrap, .k2body .ragband, .k2body .cway, .k2body .cards, .k2body .team,
.k2body .hero { break-inside: avoid; page-break-inside: avoid; }
.k2body .pb { break-before: page; page-break-before: always; }
.k2body .keep { break-inside: avoid; page-break-inside: avoid; }
.k2body .hero { break-after: avoid; }
/* a cover for flowing reports: the pack's cover, flush under the masthead */
.k2body .fcover { position: relative; height: 255mm; margin: -5mm -9mm 0 -9mm; background: #FFFFFF;
                  overflow: hidden; break-after: page; page-break-after: always; }
.k2body .fcover .cover-in { height: 100%; }
.k2body .fcover .cover-wm { display: none; }
.k2body .fcover .cover-hero { padding-top: 12mm; min-height: 92mm; }
.k2body .fcover .cover-hero .bigbox { top: 12mm; }
.k2body .fcover .cover-cog { right: 11mm; bottom: 16mm; }
.k2body .fcover .cover-siteiq { left: 11mm; bottom: 17mm; }
/* group tables: the title row repeats with the column row on every page */
.k2body .dt.grp thead tr.gt th { background: #2A313C; color: #FFFFFF; text-align: left; font-size: 10.4px;
                                 font-weight: 700; padding: 6px 9px; letter-spacing: 0; text-transform: none;
                                 border-radius: 0; }
.k2body .dt.grp thead tr.gt th .gm { color: #C9CED6; font-weight: 400; font-size: 9.2px; margin-left: 8px; }
.k2body .dt.grp { margin-top: 10px; }
/* the appendix divider: a full dark page, one line of intent */
.k2body .fdivider { position: relative; height: 255mm; margin: -5mm -9mm 0 -9mm; background: #1D1D1B;
                    overflow: hidden; break-before: page; page-break-before: always;
                    break-after: page; page-break-after: always; }
.k2body .fdivider .dv-in { padding: 70mm 14mm 0 14mm; color: #FFFFFF; }
.k2body .fdivider .kicker { font-size: 9.4px; letter-spacing: 3px; color: #F26222; font-weight: 700; }
.k2body .fdivider h1 { margin: 14px 0 0 0; font-size: 34px; font-weight: 700; line-height: 1.1; color: #FFFFFF; }
.k2body .fdivider .rule { height: 3px; width: 120px; margin: 22px 0 22px 0; background: #F26222; }
.k2body .fdivider .sub { color: #C9CED6; font-size: 13.5px; line-height: 1.7; max-width: 150mm; }
.k2body .fdivider .note { margin-top: 18px; color: #9AA2AC; font-size: 10.5px; max-width: 150mm; }
"""


def _cs(text):
    """A CSS content string: no quotes, backslashes or newlines leak in."""
    return str(text or "").replace("\\", " ").replace('"', "'").replace("\n", " ")


def flow_css(cfg, asat_s):
    team = " / ".join(f"{p['name']}, {p['role']}".strip(", ") for p in cfg.get("team", []))
    title = f"{cfg['client']} {cfg['title']}"
    # WHY (03 Sep 2026): the two header boxes share one line across the
    # page. A long kicker plus a long title (the quarterly reports) wrapped
    # both to two lines, so the header steps its type down with length
    # instead - the words stay, the line stays one line.
    total = len(cfg["kicker"]) + len(title) + len(asat_s) + 10
    scale = min(1.0, 100.0 / total) if total else 1.0
    css = FLOW_CSS.replace("__PROJECT__", _cs(cfg.get("project", "")))
    return _house_css() + css


def cover_block(cfg, big, big_label, lines, gen_s, asat_s, rag=None, fresh="", contents=None):
    """The cover as the first block of a flowing report (then a page break).
    rag paints the status stripe; fresh is the freshness line; contents
    is the (title, page) list for the "What's inside" block."""
    return f'<div class="fcover">{sh.cover_inner(cfg, big, big_label, lines, gen_s, asat_s, rag, fresh, contents)}</div>'


def group_table(title, meta, headers, rows, aligns=None, cls="", rows_html=None):
    """A table for one group (a company, a hirer) whose TITLE ROW sits in
    the thead beside the column headings - so when the group runs over a
    page, the next page opens with the group's name again, not a bare
    column row. WHY (03 Sep 2026): a 40-page register read by the counter
    should never need a flip back to find whose items these are.
    meta is small text after the title (count, value) - may hold HTML.
    rows_html: ready-made tbody markup (a register with its own keep
    rules) used in place of rows."""
    aligns = aligns or [""] * len(headers)
    th = "".join(f'<th class="{a}">{esc(h)}</th>' for h, a in zip(headers, aligns))
    body = []
    for i, r in enumerate(rows):
        z = ' class="z"' if i % 2 else ""
        tds = "".join(f'<td class="{a}">{c}</td>' for c, a in zip(r, aligns))
        body.append(f"<tr{z}>{tds}</tr>")
    k = f"dt grp {cls}".strip()
    m = f' <span class="gm">{meta}</span>' if meta else ""
    tb = rows_html if rows_html is not None else f'<tbody>{"".join(body)}</tbody>'
    return (f'<table class="{k}"><thead><tr class="gt"><th colspan="{len(headers)}">'
            f'<span class="gn">{esc(title)}</span>{m}</th></tr><tr>{th}</tr></thead>'
            f'{tb}</table>')


def divider_block(title, sub, note=""):
    """A full-page divider: 'everything from here is the complete register'.
    Keeps the story short and the evidence complete - the reader knows
    the appendix starts here without turning to find out."""
    n = f'<div class="note">{note}</div>' if note else ""
    return (f'<div class="fdivider"><div class="dv-in"><div class="kicker">APPENDIX</div>'
            f'<h1>{sh.esc(title)}</h1><div class="rule"></div><div class="sub">{sub}</div>{n}</div></div>')


def flow_doc(cfg, gen_s, asat_s, body, extra_css="", cover=None):
    """Whole HTML document: house CSS + frame + hero + KEY strip + the
    flowing body; the running header and footer are page margin boxes.
    cfg needs client, title, kicker, project, key_items, team (as for
    k2shell) and optionally asat_note."""
    head = sh.page1_head(cfg, gen_s, asat_s) + sh.key_strip(cfg) + '<div class="grule"></div>'
    if cover:
        head = cover + head
    team = " \u00b7 ".join(esc(p["name"]) for p in cfg.get("team", []) if p.get("name"))
    tail = cfg.get("foot_note", "")
    foot = (f'<div class="k2foot"><div class="fl"><div class="fwm">COATES<span class="sep">|</span>'
            f'<span class="pw">POWERED BY <span class="q">SITEIQ</span></span><span class="sep">|</span>'
            f'<span class="au">Author: Andrew Fisher</span></div>'
            f'<div class="fc">Data as at {esc(asat_s)} &nbsp;|&nbsp; Built {esc(gen_s)}'
            f'{" &nbsp;|&nbsp; " + esc(tail) if tail else ""}'
            f'{" &nbsp;|&nbsp; " + esc(sh._client_line()) if sh._client_line() else ""}</div></div>'
            f'<div class="fr">Your Coates tool store team<br><b>{team}</b></div></div>')
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
            f'<title>Coates {esc(cfg["client"])} {esc(cfg["title"])} - {esc(asat_s)}</title>'
            f'<style>{flow_css(cfg, asat_s)}{extra_css}</style></head><body>'
            f'{sh.mast_html(cfg, asat_s, cls="k2mast")}{foot}'
            f'<div class="k2body">{head}{body}</div>'
            f'</body></html>').replace("\u2013", "-").replace("\u2014", "-").replace("&ndash;", "-").replace("&mdash;", "-")


def dtable_flow(headers, rows, aligns=None, cls=""):
    """k2shell.dtable with a real <thead> so the header row repeats on
    every printed page of a long table."""
    aligns = aligns or [""] * len(headers)
    th = "".join(f'<th class="{a}">{esc(h)}</th>' for h, a in zip(headers, aligns))
    body = []
    for i, r in enumerate(rows):
        z = ' class="z"' if i % 2 else ""
        tds = "".join(f'<td class="{a}">{c}</td>' for c, a in zip(r, aligns))
        body.append(f"<tr{z}>{tds}</tr>")
    k = f"dt {cls}".strip()
    return f'<table class="{k}"><thead><tr>{th}</tr></thead><tbody>{"".join(body)}</tbody></table>'


if __name__ == "__main__":
    # a self-test document: hero, tiles, a long table, a chart
    import subprocess, sys, datetime
    cfg = {"client": "Ampol", "title": "Flow Frame Test", "kicker": "COATES · TOOL STORE · TEST",
           "project": "Ampol Lytton Refinery · Permanent Tool Store", "asat_note": "(SiteIQ register pull)",
           "key_items": [("orange", "TEST", "a sample document"), ("blue", "FLOW", "content paginates itself")],
           "team": [{"name": "Andrew Fisher", "role": "Shutdown Manager", "shift": "", "email": "", "blurb": "", "lead": True}]}
    body = sh.tiles([("box", "1,500", "Items", "sample", "grey"), ("shield", "$525,700.50", "Value", "", "grey"),
                     ("check", "20", "Companies", "", "green"), ("warn", "507", "Over 90 days", "", "amber")])
    body += '<div class="sect"><h3>A long table that flows</h3></div>'
    body += dtable_flow(["Row", "Description", "Days"], [[str(i), f"row {i}", str(i * 3)] for i in range(1, 121)], ["", "", "r"])
    body += '<div class="sect"><h3>A chart</h3></div><div class="chartpanel">' + sh.hbars([("Ampol", 339), ("Wood", 285), ("HIS", 217)]) + "</div>"
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else BASE / "k2flow_test.html"
    out.write_text(flow_doc(cfg, datetime.datetime.now().strftime("%d %b %Y %H:%M"), "02 Sep 2026 18:30", body), encoding="utf-8")
    print("wrote", out)
