#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | LOG BOOKS - PLANT & EQUIPMENT SITE NOTICE
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  The laminated Log Books notice, rebuilt as clean vector HTML so it
#  prints sharp at any size and drops straight into the daily Safety
#  Assurance report. Same six steps, same words, same colours as the
#  printed poster A. Fisher issued on 25 Jul 2026.
#
#      poster_html()      -> the panel that rides in the safety report
#      standalone_html()  -> the full A4 sheet, for printing and framing
#
#  Run it on its own to write the A4 sheet:
#      py logbook_poster.py
# =====================================================================

import os
import datetime as _dt

ORANGE = "#F26222"
DARK = "#1D1D1B"

ISSUED = "25 Jul 2026"
AUTHOR = "Andrew Fisher, Shutdown Manager QLD &amp; NT"

#  The six steps, in the order they appear on the printed notice.
#  (accent colour, heading, body)
STEPS = [
    ("#E4705B", "Before you start",
     "Find the log book on the machine and do your pre-start check. "
     "Write it in <b>before</b> you operate. No pre-start, no start."),
    ("#A9A96D", "Every shift, every operator",
     "A new line at the start of every shift, and every time the operator "
     "changes. Date, name, start and finish hours or kilometres."),
    ("#6C7C8B", "Faults and damage",
     "Something not right? Write it in straight away, tag the machine out "
     "of service and tell Coates. Don't leave it for the next crew."),
    ("#F0913F", "Fuel, fluids and servicing",
     "Record refuelling and any fluid top-ups. If a service is coming "
     "due, note the reading and let Coates know so we can book it in."),
    ("#7FA45C", "Keep it with the machine",
     "The log book lives in its holder on the machine &mdash; dry, "
     "legible and complete. Missing or full? Call Coates for a new one "
     "before the machine goes to work."),
    ("#5C7A9E", "Sign it",
     "Print your name and sign. The log book is the record of the "
     "machine's condition and of your check &mdash; it protects you, "
     "your crew and whoever is on it next."),
]

CLOSER = "If it's not in the log book, it didn't happen."
CLOSER_SUB = ("Two minutes at the start of your shift. It keeps the machine "
              "safe and everyone on it safe.")

RULE_NOTE = (
    "This notice supports <b>Coates Life Saving Rule 5 &mdash; Tools and "
    "Equipment (SEQ-GL-009)</b>: &ldquo;I will only use tools and equipment "
    "that are fit for purpose and for which I am trained, competent and "
    "authorised. I will ensure that damaged or defective equipment is tagged "
    "out and removed from service.&rdquo; The log book is how you show it. "
    "If you're not sure about a machine, stop, tag it out and call your "
    "Coates contact.")

#  The little icon on each step, drawn rather than fetched so the poster
#  never depends on a network or an image file.
_ICONS = [
    "M4 5h13v12l-3-2-3 2-3-2-4 2z M8 9h6",                      # clipboard
    "M11 2a9 9 0 100 18 9 9 0 000-18z M11 6v5l3.5 2",           # clock
    "M11 2L1 19h20z M11 8v5 M11 15.5v.9",                       # warning
    "M11 2c4 5 6 7.5 6 10a6 6 0 11-12 0c0-2.5 2-5 6-10z",       # droplet
    "M2 4h7a2 2 0 012 2v12a3 3 0 00-3-2H2z "
    "M20 4h-7a2 2 0 00-2 2v12a3 3 0 013-2h6z",                   # book
    "M3 17l3-1L17 5l-2-2L4 14z M3 20h16",                        # pen
]


def _icon(i, colour, size=22):
    return (
        "<svg viewBox='0 0 22 22' width='{s}' height='{s}' fill='none' "
        "stroke='{c}' stroke-width='1.7' stroke-linecap='round' "
        "stroke-linejoin='round'><path d='{p}'/></svg>"
    ).format(s=size, c=colour, p=_ICONS[i])


# ---------------------------------------------------------------------
#  1. The panel that rides inside the daily Safety Assurance report
# ---------------------------------------------------------------------
def poster_html(site_contact=""):
    """Dark-panel version, sized to sit on one A4 report page."""
    rows = []
    for i, (col, head, body) in enumerate(STEPS):
        rows.append(
            "<tr>"
            "<td style=\"width:34px;padding:7px 0 7px 10px;"
            "vertical-align:top\">{icon}</td>"
            "<td style=\"width:150px;padding:7px 10px 7px 4px;"
            "vertical-align:top;color:{c};font-weight:800;font-size:10pt;"
            "line-height:1.3\">{head}</td>"
            "<td style=\"padding:7px 12px 7px 0;vertical-align:top;"
            "color:#D7DBE2;font-size:9pt;line-height:1.6\">{body}</td>"
            "</tr>".format(icon=_icon(i, col), c=col, head=head, body=body))

    contact = ("<div style=\"margin-top:9px;font-size:8.5pt;color:#A9B1BD\">"
               "Coates site contact: <b style=\"color:#fff\">{}</b></div>"
               ).format(site_contact) if site_contact else ""

    return (
        "<div class=\"newpage\">"
        "<div style=\"background:{o};border-radius:10px 10px 0 0;"
        "padding:12px 18px;display:flex;justify-content:space-between;"
        "align-items:center\">"
        "<div><div style=\"color:#fff;font-size:20pt;font-weight:800;"
        "line-height:1\">Log Books</div>"
        "<div style=\"color:#FFE2D4;font-size:9pt;margin-top:3px\">"
        "Using Coates plant? <b style=\"color:#fff\">Fill in the log book. "
        "Every machine, every shift.</b></div></div>"
        "<div style=\"color:#FFD9C6;font-size:7.5pt;letter-spacing:2px;"
        "text-align:right;text-transform:uppercase;font-weight:700\">"
        "Plant &amp; Equipment<br>Site Notice</div></div>"

        "<table style=\"width:100%;border-collapse:collapse;"
        "background:#171B22\">{rows}</table>"

        "<div style=\"background:{o};padding:11px 18px;"
        "border-radius:0 0 10px 10px\">"
        "<div style=\"color:#fff;font-size:14pt;font-weight:800\">{closer}"
        "</div>"
        "<div style=\"color:#FFE2D4;font-size:9pt;margin-top:3px\">{sub}"
        "</div></div>"

        "<div style=\"margin-top:12px;padding:10px 14px;background:#12161C;"
        "border-left:3px solid #5C7A9E;border-radius:0 8px 8px 0;"
        "font-size:8.5pt;color:#A9B1BD;line-height:1.7\">{rule}</div>"
        "{contact}"
        "<div style=\"margin-top:8px;font-size:8pt;color:#8B9099\">"
        "Coates &middot; Equipped for anything &nbsp;|&nbsp; Issued {issued} "
        "&nbsp;|&nbsp; Author: {author}</div>"
        "</div>"
    ).format(o=ORANGE, rows="".join(rows), closer=CLOSER, sub=CLOSER_SUB,
             rule=RULE_NOTE, contact=contact, issued=ISSUED, author=AUTHOR)


# ---------------------------------------------------------------------
#  2. The full A4 sheet - print it, laminate it, put it on the machine
# ---------------------------------------------------------------------
def standalone_html(site_contact=""):
    rows = []
    for i, (col, head, body) in enumerate(STEPS):
        rows.append(
            "<tr>"
            "<td class='ic' style='background:{c}'>{icon}"
            "<div class='ih'>{head}</div></td>"
            "<td class='bd'>{body}</td></tr>".format(
                c=col, icon=_icon(i, "#ffffff", 26), head=head, body=body))

    contact = ("<div class='contact'>Coates site contact: "
               "<b>{}</b></div>").format(site_contact or
                                         "&nbsp;" * 30 + "________________")

    return """<!DOCTYPE html><html lang="en-AU"><head><meta charset="utf-8">
<title>Coates | Log Books - Plant &amp; Equipment Site Notice</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#5A5E66;font-family:'Segoe UI',Arial,sans-serif;padding:16px}
.sheet{width:210mm;min-height:297mm;background:#fff;margin:0 auto;
  padding:14mm 13mm;display:flex;flex-direction:column}
.top{display:flex;justify-content:space-between;align-items:flex-start;
  margin-bottom:9mm}
.logo{background:__ORG__;color:#fff;padding:9px 20px;border-radius:3px}
.logo .n{font-size:27px;font-weight:800;line-height:1}
.logo .t{font-size:10px;letter-spacing:.4px;margin-top:2px}
.notice{text-align:right;color:__ORG__;font-size:10px;letter-spacing:2.6px;
  font-weight:800;text-transform:uppercase;line-height:1.7;padding-top:4px}
h1{font-size:52px;color:__ORG__;line-height:.95;letter-spacing:-1px}
.sub{font-size:15px;color:#3A3F47;margin:7px 0 9mm}
.sub b{color:__DARK__}
table{width:100%;border-collapse:separate;border-spacing:0 6px}
td.ic{width:52mm;padding:11px 13px;vertical-align:top;color:#fff;
  border-radius:4px 0 0 4px}
td.ic .ih{font-size:15px;font-weight:800;line-height:1.25;margin-top:7px}
td.bd{padding:12px 15px;vertical-align:top;font-size:13px;color:#33383F;
  line-height:1.62;background:#F1F3F5;border-radius:0 4px 4px 0}
.closer{background:__ORG__;color:#fff;padding:13px 18px;margin-top:7mm;
  border-radius:4px}
.closer .h{font-size:24px;font-weight:800;line-height:1.15}
.closer .s{font-size:13px;margin-top:4px;color:#FFE7DC}
.rule{margin-top:6mm;font-size:11px;color:#4A4F57;line-height:1.72;
  border-left:3px solid #5C7A9E;padding-left:12px}
.rule b{color:__DARK__}
.contact{margin-top:5mm;font-size:12px;color:#4A4F57}
.foot{margin-top:auto;padding-top:6mm;border-top:1px solid #DDE1E6;
  display:flex;justify-content:space-between;font-size:10px;color:#6E747C}
.foot .siq{color:__ORG__;font-weight:800;letter-spacing:1.1px}
@media print{body{background:#fff;padding:0}
  .sheet{width:auto;min-height:auto;margin:0}
  @page{size:A4;margin:0}}
</style></head><body>
<div class="sheet">
  <div class="top">
    <div class="logo"><div class="n">Coates</div>
      <div class="t">Equipped for anything</div></div>
    <div class="notice">Plant &amp; Equipment<br>Site Notice</div>
  </div>
  <h1>Log Books</h1>
  <div class="sub">Using Coates plant? <b>Fill in the log book.
    Every machine, every shift.</b></div>
  <table>__ROWS__</table>
  <div class="closer"><div class="h">__CLOSER__</div>
    <div class="s">__SUB__</div></div>
  <div class="rule">__RULE__</div>
  __CONTACT__
  <div class="foot">
    <div>Coates &middot; Equipped for anything &nbsp;|&nbsp; Issued __ISSUED__
      <br>Author: __AUTHOR__</div>
    <div style="text-align:right">POWERED BY <span class="siq">SITEIQ</span>
      <br>Cement Australia K2 Shutdown 2026 &middot; Gladstone</div>
  </div>
</div></body></html>""" \
        .replace("__ORG__", ORANGE).replace("__DARK__", DARK) \
        .replace("__ROWS__", "".join(rows)).replace("__CLOSER__", CLOSER) \
        .replace("__SUB__", CLOSER_SUB).replace("__RULE__", RULE_NOTE) \
        .replace("__CONTACT__", contact).replace("__ISSUED__", ISSUED) \
        .replace("__AUTHOR__", AUTHOR)


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, "Coates_LogBook_Site_Notice_A4.html")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(standalone_html())
    print("  Written: {}".format(os.path.basename(out)))
