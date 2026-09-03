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
                r"\.foot-l b", r"\.foot-l", r"\.foot", r"\.body"):
        css = re.sub(r"(?m)^" + sel + r"\s*\{[^}]*\}\s*", "", css)
    return css


FLOW_CSS = """
/* ---------- flowing-report frame (k2flow) ----------------------------
   The one layout the print engine gets right every time: the header and
   footer bands live in the page MARGINS (Chromium 131+ renders @page
   margin boxes, page counter included), the frame is a fixed element
   that spans exactly the page area (a fixed element that hangs outside
   the page area is tiled, and a repeating table footer overprints tall
   blocks), and the content is plain block flow inside the frame, so a
   block that must stay whole simply moves to the next page. */
@page {
  size: A4 portrait;
  margin: 21mm 6.5mm 17.5mm 6.5mm;
  @top-left     { content: "__KICKER__"; vertical-align: bottom; margin-left: 4mm; margin-bottom: 2.2mm;
                  font-family: "Lato","Calibri","Carlito","Segoe UI",sans-serif;
                  font-size: 6.8pt; font-weight: 700; letter-spacing: 1.9pt; color: #F36F21; }
  @top-right    { content: "__TITLE__   \\2022   AS AT __ASAT__"; vertical-align: bottom; margin-right: 4mm; margin-bottom: 2.2mm;
                  font-family: "Lato","Calibri","Carlito","Segoe UI",sans-serif;
                  font-size: 7.6pt; font-weight: 700; color: #16202C; }
  @bottom-left  { content: "YOUR COATES TOOL STORE TEAM  \\2022  __TEAM__"; vertical-align: top; margin-left: 4mm; margin-top: 2.2mm;
                  font-family: "Lato","Calibri","Carlito","Segoe UI",sans-serif;
                  font-size: 6.6pt; font-weight: 700; letter-spacing: 0.6pt; color: #8A9AAC; }
  @bottom-center{ content: "Author: Andrew Fisher   |   POWERED BY SITEIQ"; vertical-align: top; margin-top: 2.2mm;
                  font-family: "Lato","Calibri","Carlito","Segoe UI",sans-serif;
                  font-size: 6.8pt; font-weight: 700; color: #16202C; letter-spacing: 0.5pt; }
  @bottom-right { content: "Page " counter(page) " of " counter(pages); vertical-align: top; margin-right: 4mm; margin-top: 2.2mm;
                  font-family: "Lato","Calibri","Carlito","Segoe UI",sans-serif;
                  font-size: 6.8pt; color: #98A6B4; }
}
.k2frame { position: fixed; top: 0; left: 0; right: 0; bottom: 0;
           border: 5px solid #F36F21; border-radius: 26px; pointer-events: none; }
/* cloned padding: every page fragment gets the same inset from the frame */
.k2body { padding: 7mm 10mm 6mm 10mm; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
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
/* a cover for flowing reports: one dark block the height of the page area */
.k2body .fcover { position: relative; height: 240mm; background: #1A2430; border-radius: 14px;
                  overflow: hidden; break-after: page; page-break-after: always; }
.k2body .fcover .cover-in { padding: 30mm 8mm 0 8mm; }
.k2body .fcover .cover-cog { right: 8mm; bottom: 14mm; }
.k2body .fcover .cover-siteiq { left: 8mm; bottom: 16mm; }
"""


def _cs(text):
    """A CSS content string: no quotes, backslashes or newlines leak in."""
    return str(text or "").replace("\\", " ").replace('"', "'").replace("\n", " ")


def flow_css(cfg, asat_s):
    team = " / ".join(f"{p['name']}, {p['role']}".strip(", ") for p in cfg.get("team", []))
    css = (FLOW_CSS.replace("__KICKER__", _cs(cfg["kicker"]))
           .replace("__TITLE__", _cs(f"{cfg['client']} {cfg['title']}"))
           .replace("__ASAT__", _cs(asat_s.upper()))
           .replace("__TEAM__", _cs(team)))
    return _house_css() + css


def cover_block(cfg, big, big_label, lines, gen_s, asat_s):
    """The cover as the first block of a flowing report (then a page break)."""
    return f'<div class="fcover">{sh.cover_inner(cfg, big, big_label, lines, gen_s, asat_s)}</div>'


def flow_doc(cfg, gen_s, asat_s, body, extra_css="", cover=None):
    """Whole HTML document: house CSS + frame + hero + KEY strip + the
    flowing body; the running header and footer are page margin boxes.
    cfg needs client, title, kicker, project, key_items, team (as for
    k2shell) and optionally asat_note."""
    head = sh.page1_head(cfg, gen_s, asat_s) + sh.key_strip(cfg) + '<div class="grule"></div>'
    if cover:
        head = cover + head
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
            f'<title>Coates {esc(cfg["client"])} {esc(cfg["title"])} - {esc(asat_s)}</title>'
            f'<style>{flow_css(cfg, asat_s)}{extra_css}</style></head><body>'
            f'<div class="k2frame"></div>'
            f'<div class="k2body">{head}{body}</div>'
            f'</body></html>')


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
