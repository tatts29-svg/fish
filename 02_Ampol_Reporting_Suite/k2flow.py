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
   Print-safe pattern: the page margins sit on the frame line (6.5mm);
   the frame is a fixed element that exactly spans the page area (a
   fixed element that hangs outside the page area gets tiled by
   Chromium); the running header and footer bands are the <thead> and
   <tfoot> of one wrapping table, which Chromium repeats on every page;
   the page counter is the one thing that needs a margin box. */
@page {
  size: A4 portrait;
  margin: 6.5mm 6.5mm 6.5mm 6.5mm;
  @bottom-center { content: "Page " counter(page) " of " counter(pages);
                   font-family: "Lato","Calibri","Carlito","Segoe UI",sans-serif;
                   font-size: 6.4pt; color: #98A6B4; vertical-align: top; margin-top: 1.2mm; }
}
.k2frame { position: fixed; top: 0; left: 0; right: 0; bottom: 0;
           border: 5px solid #F36F21; border-radius: 26px; pointer-events: none; }
/* the header and footer bands are FIXED (pinned to the top and bottom of
   every page, last page included); the wrapping table's thead and tfoot
   are empty spacers of the same height that reserve the room on each page */
table.k2wrap { width: 100%; border-collapse: collapse; border-spacing: 0; }
table.k2wrap > thead { display: table-header-group; }
table.k2wrap > tfoot { display: table-footer-group; }
table.k2wrap > thead td, table.k2wrap > tfoot td, table.k2wrap > tbody > tr > td { padding: 0; }
.k2spacer-t { height: 19.5mm; }
.k2spacer-b { height: 15.5mm; }
.k2run { position: fixed; top: 0; left: 0; right: 0; height: 19.5mm; padding: 8.5mm 10mm 0 10mm;
         box-sizing: border-box; }
.k2run .bar { border-bottom: 1px solid #E4E8EC; padding-bottom: 5px; position: relative; }
.k2run .kicker { color: #F36F21; font-size: 8.2px; font-weight: 700; letter-spacing: 2.4px;
                 text-transform: uppercase; }
.k2run .t { margin-top: 3px; color: #16202C; font-size: 12.5px; font-weight: 700; }
.k2run .r { position: absolute; right: 0; top: 0; text-align: right; }
.k2run .r .siteiq { color: #16202C; text-align: right; }
.k2run .r .asat { color: #8A9AAC; font-size: 8.8px; margin-top: 4px; white-space: nowrap; }
.k2run .r .asat b { color: #16202C; }
.k2foot { position: fixed; bottom: 0; left: 0; right: 0; height: 15.5mm; padding: 0 10mm 8.5mm 10mm;
          box-sizing: border-box; }
.k2foot .bar { border-top: 1px solid #E4E8EC; padding-top: 7px; position: relative; }
.k2foot .fh { color: #F36F21; font-size: 7.4px; font-weight: 700; letter-spacing: 1.9px;
              text-transform: uppercase; }
.k2foot .fl { font-size: 8.2px; color: #8A9AAC; line-height: 1.5; margin-top: 3px; }
.k2foot .fl b { color: #16202C; font-weight: 700; }
.k2foot .fr { position: absolute; right: 0; top: 8px; text-align: right; font-size: 8.4px;
              color: #16202C; font-weight: 700; letter-spacing: 1.4px; }
.k2foot .fr .q { color: #F36F21; }
.k2body { padding: 6px 10mm 4px 10mm; }
.k2body .sect { break-after: avoid; page-break-after: avoid; }
.k2body .sub-h { break-after: avoid; page-break-after: avoid; }
.k2body table.dt thead { display: table-header-group; }
.k2body table.dt tr { break-inside: avoid; page-break-inside: avoid; }
.k2body .tiles, .k2body .callout, .k2body .note, .k2body .chartpanel, .k2body .alerts,
.k2body .donut-wrap { break-inside: avoid; page-break-inside: avoid; }
.k2body .pb { break-before: page; page-break-before: always; }
.k2body .keep { break-inside: avoid; page-break-inside: avoid; }
.k2body .hero { break-after: avoid; }
"""


def flow_css(cfg):
    return _house_css() + FLOW_CSS


def run_head(cfg, asat_s):
    return (f'<div class="k2run"><div class="bar"><div class="kicker">{esc(cfg["kicker"])}</div>'
            f'<div class="t">{esc(cfg["client"])} {esc(cfg["title"])}</div>'
            f'<div class="r"><div class="siteiq">POWERED BY <span class="q">SITEIQ</span></div>'
            f'<div class="asat">AS AT <b>{esc(asat_s.upper())}</b></div></div></div></div>')


def foot_band(cfg):
    bits = " · ".join(f"<b>{esc(p['name'])}</b> {esc(p['role'])}".strip()
                      for p in cfg.get("team", []))
    return (f'<div class="k2foot"><div class="bar"><div class="fh">Your Coates Tool Store Team</div>'
            f'<div class="fl">{bits} &nbsp;·&nbsp; Author: <b>Andrew Fisher</b></div>'
            f'<div class="fr">POWERED BY <span class="q">SITEIQ</span></div></div></div>')


def flow_doc(cfg, gen_s, asat_s, body, extra_css=""):
    """Whole HTML document: house CSS + frame + running header + hero +
    KEY strip + the flowing body. cfg needs client, title, kicker,
    project, key_items, team (as for k2shell) and optionally asat_note."""
    head = sh.page1_head(cfg, gen_s, asat_s) + sh.key_strip(cfg) + '<div class="grule"></div>'
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
            f'<title>Coates {esc(cfg["client"])} {esc(cfg["title"])} - {esc(asat_s)}</title>'
            f'<style>{flow_css(cfg)}{extra_css}</style></head><body>'
            f'<div class="k2frame"></div>'
            f'{run_head(cfg, asat_s)}{foot_band(cfg)}'
            f'<table class="k2wrap"><thead><tr><td><div class="k2spacer-t"></div></td></tr></thead>'
            f'<tfoot><tr><td><div class="k2spacer-b"></div></td></tr></tfoot>'
            f'<tbody><tr><td><div class="k2body">{head}{body}</div></td></tr></tbody></table>'
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
