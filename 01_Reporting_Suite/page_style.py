# -*- coding: utf-8 -*-
"""
COATES | ONE PAGE STYLE
=======================
Andrew, 4 Aug 2026, on four buttons that produced a spreadsheet, a CSV
and two nothings: "lets do it same style."

Four screens were about to be written by four scripts, which is four
chances to draw four slightly different pages. This is the only one.
Everything built with it reads the same on a phone as the reports shelf
it sits beside, prints the same on paper, and carries the same footer.

It is deliberately small: a header, a strip of tiles, sections of rows
or a table, and a note. Anything that needs more than that is a report,
not a page, and belongs in the report designer.

NO MONEY LIVES HERE. Nothing this module draws goes near a rate - the
pages built with it are a clock, a housekeeping list, a serial register
and a plant summary. If one ever needs a figure it goes through
phone_reports.py, which locks it under the manager code.
"""

from __future__ import print_function

import datetime as dt
import html
import io
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def esc(s):
    return html.escape('' if s is None else str(s), quote=True)


CSS = """
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0D1218;color:#DCE3EC;font-family:-apple-system,
 'Segoe UI',Arial,sans-serif;font-size:15px;line-height:1.45;
 -webkit-text-size-adjust:100%}
.phone{max-width:720px;margin:0 auto;min-height:100vh}
.bar2{background:#F26222;color:#fff;padding:14px 16px;display:flex;
 justify-content:space-between;align-items:center;gap:10px}
.bar2 h1{font-size:18px;font-weight:800;letter-spacing:-.2px}
.bar2 .siq{font-size:9px;letter-spacing:2px;font-weight:800;opacity:.85;
 white-space:nowrap}
.pad{padding:14px 16px 44px}
.lead{color:#8794A6;font-size:12.5px;line-height:1.6;margin-bottom:14px}
.lead b{color:#F0F4F9}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));
 gap:9px;margin-bottom:16px}
.tile{background:#131A22;border:1px solid #263143;border-radius:13px;
 padding:12px 13px}
.tile b{display:block;font-size:26px;font-weight:800;line-height:1.05}
.tile span{display:block;color:#8794A6;font-size:11px;margin-top:4px;
 line-height:1.35}
.tile.g b{color:#2BB673} .tile.a b{color:#F5A623} .tile.r b{color:#FF6B5A}
h2{font-size:11px;font-weight:800;letter-spacing:2px;color:#F26222;
 margin:22px 0 4px;text-transform:uppercase}
h2 span{float:right;color:#5F6B7C;letter-spacing:.6px;font-size:10px}
h2+p{color:#8794A6;font-size:12.5px;line-height:1.55;margin-bottom:9px}
.row{display:flex;gap:11px;align-items:flex-start;background:#151A22;
 border:1px solid #2A3340;border-radius:13px;padding:11px 13px;
 margin-bottom:7px}
.row .t{flex:1;min-width:0}
.row .t b{display:block;font-size:14.5px;font-weight:800;color:#F0F4F9;
 line-height:1.3;word-break:break-word}
.row .t span{display:block;color:#98A4B4;font-size:12px;margin-top:2px;
 line-height:1.45}
.row .v{flex:none;font-size:15px;font-weight:800;color:#DCE3EC;
 text-align:right;white-space:nowrap}
.tw{overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:2px;
 border-radius:10px}
table{width:100%;border-collapse:collapse;margin-top:2px}
th{background:#1C232D;color:#8794A6;font-size:9.5px;letter-spacing:1px;
 text-align:left;padding:8px 9px;text-transform:uppercase;white-space:nowrap}
td{padding:8px 9px;border-bottom:1px solid #222B36;font-size:13px;
 vertical-align:top;word-break:break-word}
td.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
td.code{font-family:Consolas,monospace;font-size:11.5px;color:#98A4B4}
.chip{display:inline-block;font-size:9px;font-weight:800;letter-spacing:1px;
 border-radius:20px;padding:3px 8px;white-space:nowrap}
.c-g{background:#12280C;color:#7BD45C} .c-a{background:#3A2110;color:#F5A623}
.c-r{background:#3A1512;color:#FF6B5A} .c-n{background:#232B36;color:#8A97A8}
.note{background:#151A22;border:1px solid #2A3340;border-left:3px solid #F26222;
 border-radius:0 12px 12px 0;padding:11px 13px;margin:12px 0;font-size:12.5px;
 color:#C6D0DD;line-height:1.55}
.note b{color:#F0F4F9}
.foot{color:#4A5768;font-size:11px;text-align:center;padding:28px 0 12px;
 line-height:1.7}
@media print{
  body{background:#fff;color:#111}
  .phone{max-width:none}
  .bar2{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .row,.tile{border-color:#ccc;background:#fff;break-inside:avoid}
  .row .t b,.tile b{color:#111}
  th{background:#eee;color:#333}
  td{border-color:#ddd}
  .foot{color:#666}
}
"""


def tiles(items):
    """items: (value, label, ''|'g'|'a'|'r')"""
    return ("<div class='tiles'>" + ''.join(
        "<div class='tile {c}'><b>{v}</b><span>{l}</span></div>".format(
            c=c, v=esc(v), l=esc(l)) for v, l, c in items) + "</div>")


def row(name, sub='', value=''):
    return ("<div class='row'><div class='t'><b>" + esc(name) + "</b>"
            + ("<span>" + sub + "</span>" if sub else '')
            + "</div>"
            + ("<div class='v'>" + esc(value) + "</div>" if value != '' else '')
            + "</div>")


def table(headers, rows, nums=()):
    h = "<table><tr>" + ''.join(
        "<th>" + esc(x) + "</th>" for x in headers) + "</tr>"
    for r in rows:
        h += "<tr>" + ''.join(
            "<td class='{}'>{}</td>".format(
                'num' if i in nums else ('code' if x is not None
                                         and str(x).isupper()
                                         and len(str(x)) > 8 else ''),
                x if (isinstance(x, str) and x.startswith('<')) else esc(x))
            for i, x in enumerate(r)) + "</tr>"
    #  A wide table scrolls INSIDE its own box. Without this the whole
    #  page slides sideways on a phone and the header goes off-screen,
    #  which is how the plant table read on a 390px handset before
    #  anybody looked. (4 Aug 2026.)
    return "<div class='tw'>" + h + "</table></div>"


def note(text):
    return "<div class='note'>" + text + "</div>"


def write(stem, title, lead, blocks, asof='', date_tag=None, nav_key=None):
    """The finished page, into Reports\\<date>\\Pages so the phone shelf
    and the print hub both pick it up like anything else."""
    date_tag = date_tag or dt.date.today().isoformat()
    body = ''.join(blocks)
    bar = sheet = js = ''
    try:
        import mygear_nav as nav
        key = nav_key or 'reports'
        bar = nav.bar(key, title)
        sheet = nav.sheet(key)
        js = "<script>" + nav.js(key, title) + "</script>"
        navcss = nav.CSS
    except Exception:
        navcss = ''
    page = (
        "<!doctype html><html lang='en-AU'><head><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1,"
        "viewport-fit=cover'><meta name='theme-color' content='#F26222'>"
        "<title>Coates | " + esc(title) + "</title><style>"
        + CSS + navcss + "</style></head><body><div class='phone'>"
        + bar +
        "<div class='bar2'><h1>" + esc(title) + "</h1>"
        "<span class='siq'>POWERED BY SITEIQ</span></div>"
        "<div class='pad'>"
        + ("<div class='lead'>" + lead + "</div>" if lead else '')
        + body +
        "<div class='foot'>Cement Australia K2 Shutdown 2026 &middot; "
        "Gladstone"
        + ("<br>" + esc(asof) if asof else '')
        + "<br>Read-only SiteIQ snapshot &middot; no money on this page"
        "<br>Author: Andrew Fisher &middot; POWERED BY SITEIQ"
        "</div></div></div>" + sheet + js + "</body></html>")

    out_dir = os.path.join(HERE, 'Reports', date_tag, 'Pages')
    if not os.path.isdir(out_dir):
        os.makedirs(out_dir)
    out = os.path.join(out_dir, '{}_{}.html'.format(stem, date_tag))
    with io.open(out, 'w', encoding='utf-8') as fh:
        fh.write(page)
    return out
