#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | WHAT'S ON MY REPORT - the My Gear legend
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  A bloke opens My Gear on his phone and sees a gauge, eight badges,
#  three coloured cells and a row of chips. Every one of them means
#  something exact. This is that list, in the order it appears on his
#  own report, in the words the counter would use.
#
#      text()        -> the legend at the laptop (62_WHATS_ON_MY_REPORT)
#      sheet_html()  -> the same legend as an A4 sheet to pin up
#
#  ONE source. The console and the paper are the same list, so they
#  cannot drift apart from each other.
#
#  They CAN drift from the report itself, and that would be worse than
#  having no legend at all - so drift_check() reads BUILD_MY_GEAR.py and
#  proves the thresholds quoted below are still the thresholds the
#  report is built with. Change a threshold there and this shouts.
#
#  Run it on its own:  py report_legend.py
# =====================================================================

import datetime as _dt
import io
import os
import re
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
ORANGE = "#F26222"
DARK = "#1D1D1B"
AUTHOR = "Andrew Fisher, Shutdown Manager QLD &amp; NT"

# ---------------------------------------------------------------------
#  THE LEGEND. (section heading, blurb, [(what he sees, what it means)])
#  Order follows the report top to bottom - a bloke reads this with his
#  thumb on the page, not as a reference manual.
# ---------------------------------------------------------------------
SECTIONS = [

 ("The top of the card",
  "Who the report is for and what it was built from.",
  [("Your name, your crew, ID xxxxx",
    "Straight off the SiteIQ on-hire export. If the name or the crew is "
    "wrong, tell the store - it is wrong in SiteIQ, not on the phone."),
   ("The orange bar that fills",
    "The report has finished loading. It does that once and then sits "
    "still."),
   ("Cement Australia K2 - Gladstone - the date - DAY n",
    "The date is when the data was pulled, not when you opened the page. "
    "DAY n counts from Flame Off; a named day like POWER OUTAGE wears the "
    "orange.")]),

 ("Returns Score - the gauge",
  "One number for how you are going at bringing gear back. It is worked "
  "out in the open and nothing about it is a guess.",
  [("The needle and the number",
    "Your score out of 100. The needle swings up once when the gauge "
    "comes on screen and then holds - it is not live, it is this "
    "morning's number."),
   ("How it is worked out",
    "100 x (0.75 x your same-day rate + 0.25 x your returned rate). "
    "Same-day rate is same-day returns divided by returns. Returned rate "
    "is returns divided by everything you have had out. Bringing gear "
    "back the same day is worth three times as much as bringing it back "
    "eventually."),
   ("A dash instead of a number",
    "You have not returned anything yet, so you have no score - not a "
    "score of nought. The needle stays off the dial until your first "
    "return."),
   ("The stars",
    "Five stars and 'Same-day returner' once you have any same-day "
    "return. Two stars and 'Returns, but not same-day' if you return "
    "gear but not on the day. No stars until your first return."),
   ("#4 of 27 in your crew - top 9% on site",
    "Where you sit against your own crew, and against everybody on site. "
    "Nobody ever sees another bloke's name against a score.")]),

 ("Badges",
  "Earned off what you are actually holding and using. They appear on "
  "their own - there is nothing to apply for.",
  [("Big Kit", "8 or more items out in your name right now."),
   ("All-Rounder", "Gear from 4 or more different categories at once."),
   ("Store Regular", "8 or more separate transactions through the store."),
   ("Rigger", "Something rigging in your name."),
   ("Powerhouse", "Something electrical in your name."),
   ("Same-Day Legend", "At least one same-day return."),
   ("Top of the Store", "Top of your own crew, with a same-day return."),
   ("Site Legend", "Top of the whole site, with a same-day return.")]),

 ("The four tiles",
  "Counts, not opinions. They count up once as you reach them.",
  [("Items out", "How many items are on hire in your name right now."),
   ("Item types", "How many different things that is - 6 sockets out of "
    "the same box is 6 items and 1 type."),
   ("Returned", "How many you have brought back this shutdown."),
   ("Same-day", "How many of those went back the day you took them.")]),

 ("How you compare",
  "Three bars: you, your crew's average, and the site average. Plus "
  "where your crew sits against the other crews. Anonymous, always.",
  []),

 ("Your kit mix",
  "The coloured bar splits what you are holding by category, with the "
  "count against each colour underneath.",
  [("Electrical / Rigging / Plant / Tooling / Radios",
    "The five categories the store sorts gear into. The colour on the "
    "bar is the same colour as the dot beside each item in your list.")]),

 ("Shift docket",
  "The stamped panel - a plain-English summary of what you have had out, "
  "what has gone back, and how often you have used the store.",
  []),

 ("Your gear on hire now",
  "The three cells are the ages of everything in your name, and they are "
  "the whole point of the report.",
  [("0-2 DAYS - CLEAR", "Fresh. Nothing to do."),
   ("3-4 DAYS - WATCH", "Getting on. If you are finished with it, send it "
    "back."),
   ("5+ DAYS - RETURN", "Overdue for a look. Either you still need it or "
    "it should be on a shelf for the next crew."),
   ("OLDEST - n DAYS", "The single item you have held longest."),
   ("NEXT ACTION", "Only ever appears on a genuine 5+ day item. Red on "
    "this card means that and nothing else."),
   ("The search box and the lanes",
    "Appears once you are holding 8 or more items. Type part of a name or "
    "an item number, or tap CLEAR / WATCH / RETURN to see just that lane.")]),

 ("Each item in the list",
  "One row per item, longest held first.",
  [("The picture", "What the thing looks like, where the store has "
    "photographed it. Two letters in a tile means no photo yet."),
   ("Item 114562", "The item number. Quote it at the counter."),
   ("The orange ID pill", "The Plant ID - the number the crews say out "
    "loud. 'Bring number 41 back.'"),
   ("The coloured dot", "The category, same colours as your kit mix."),
   ("3d on the right", "How many days it has been out, coloured green, "
    "amber or red on the same 0-2 / 3-4 / 5+ rule as the cells above.")]),

 ("The chips under an item",
  "What that particular item obliges you to do before you use it.",
  []),

 ("Return clearance",
  "Green and a tick means nothing is on hire in your name - you are "
  "cleared. A count means that many still to bring back.",
  []),

 ("Your store scorecard",
  "How you have used the store, out of the SiteIQ transactions.",
  [("Store visits", "Separate days you have been to the counter."),
   ("Transactions", "Separate lines put through in your name."),
   ("Consumables", "Consumable items taken - discs, gloves, plugs."),
   ("Radio gear", "Radios and batteries taken. Radios and gas monitors "
    "are called out on their own because they are due back daily.")]),

 ("MODULE 01, MODULE 02 ...",
  "Each section is numbered like a module on a rack. The numbers run in "
  "the order the sections appear on YOUR report, so a bloke holding "
  "nothing has fewer of them than a bloke holding thirty items. The "
  "numbers are for finding your place, not a checklist.",
  []),

 ("Save picture and Print A4",
  "Save puts the report on your phone as a picture and needs no signal "
  "afterwards. Print gives one clean A4 page - pick the store Wi-Fi "
  "printer in the print menu. The printed page carries the barcodes; the "
  "phone screen does not.",
  []),
]

FOOT = ("Every number on the report comes from the SiteIQ exports pulled "
        "that morning. Nothing on it is estimated, and nothing you do on "
        "your phone can change what is in SiteIQ.")


# ---------------------------------------------------------------------
#  DRIFT CHECK - the legend must describe the report that actually ships
# ---------------------------------------------------------------------
#  (what the legend claims, the pattern that must still be in the source)
CLAIMS = [
    ("the score formula (0.75 same-day / 0.25 returned)",
     r"0\.75\s*\*\s*sd_rate\s*\+\s*0\.25\s*\*\s*rt_rate"),
    ("the hire age bands 0-2 / 3-4 / 5+",
     r"_d<=2\?'g':\(_d<=4\?'a':'r'\)"),
    ("Big Kit at 8 items", r"out_now\s*>=\s*8:\s*badges\.append"),
    ("All-Rounder at 4 categories", r"len\(mixc\)\s*>=\s*4:\s*badges\.append"),
    ("Store Regular at 8 transactions",
     r"len\(s\['txn_keys'\]\)\s*>=\s*8:\s*badges\.append"),
    ("the search box at 8 items", r"p\.items\.length>=8"),
    ("five stars for a same-day returner",
     r"'stars':\s*5,\s*'label':\s*'Same-day returner'"),
    ("two stars for returns that are not same-day",
     r"'stars':\s*2,\s*'label':\s*'Returns, but not same-day'"),
    ("no needle and a dash when there are no returns",
     r"var needle=has\?"),
]


def drift_check():
    """Prove the numbers quoted above are still the numbers in the build.

    A legend that quietly goes stale is worse than no legend - a bloke
    reads it, believes it, and it is wrong. So this is loud.
    """
    src_path = os.path.join(BASE, 'BUILD_MY_GEAR.py')
    if not os.path.exists(src_path):
        return ['BUILD_MY_GEAR.py is not in this folder - nothing could be '
                'checked. The legend below may not match the report.']
    with io.open(src_path, encoding='utf-8') as fh:
        src = fh.read()
    return [what for what, pat in CLAIMS if not re.search(pat, src)]


# ---------------------------------------------------------------------
#  THE LEGEND AT THE LAPTOP
# ---------------------------------------------------------------------
def _wrap(s, width, indent):
    out, line = [], ''
    for word in s.split():
        if line and len(line) + 1 + len(word) > width:
            out.append(line)
            line = word
        else:
            line = (line + ' ' + word).strip()
    if line:
        out.append(line)
    return ('\n' + ' ' * indent).join(out)


def text():
    L = []
    L.append('')
    L.append('  ' + '=' * 66)
    L.append('  WHAT IS ON MY REPORT - the My Gear legend')
    L.append('  Cement Australia K2 Shutdown 2026 - Gladstone')
    L.append('  ' + '=' * 66)
    for head, blurb, rows in SECTIONS:
        L.append('')
        L.append('  ' + head.upper())
        L.append('  ' + '-' * len(head))
        L.append('  ' + _wrap(blurb, 64, 2))
        for term, mean in rows:
            L.append('')
            L.append('    ' + term)
            L.append('        ' + _wrap(mean, 58, 8))
    L.append('')
    L.append('  ' + '-' * 66)
    L.append('  ' + _wrap(FOOT, 64, 2))
    L.append('')
    return '\n'.join(L)


# ---------------------------------------------------------------------
#  THE LEGEND ON PAPER - A4, the same sheet family as the site notices
# ---------------------------------------------------------------------
def _esc(s):
    return (str(s).replace('&', '&amp;').replace('<', '&lt;')
            .replace('>', '&gt;'))


def _chips_block():
    """The compliance chips keep ONE set of meanings for the whole suite.

    equipment_compliance already owns them, and it knows which tag colour
    is current this month - so the sheet asks it rather than restating
    them and going stale the day the colour turns over.
    """
    try:
        import equipment_compliance as EC
        return EC.legend_html()
    except Exception as _e:
        return ("<div class='miss'>The chip meanings could not be read from "
                "equipment_compliance ({}). Ask at the store what a chip "
                "means rather than guessing.</div>".format(_esc(_e)))


def sheet_html():
    blocks = []
    for head, blurb, rows in SECTIONS:
        #  The legend is PROSE, not markup - escape it. Angle brackets are
        #  the trap: a "<date>" written as a placeholder read as an HTML
        #  tag and vanished off the printed sheet entirely. Caught by
        #  rasterising the PDF, not by looking at the HTML.
        body = "<div class='blurb'>" + _esc(blurb) + "</div>"
        if rows:
            body += "<table>" + "".join(
                "<tr><td class='t'>{t}</td><td class='m'>{m}</td></tr>".format(
                    t=_esc(t), m=_esc(m)) for t, m in rows) + "</table>"
        if head == "The chips under an item":
            body += "<div class='chips'>" + _chips_block() + "</div>"
        blocks.append("<section><h2>{h}</h2>{b}</section>".format(
            h=head, b=body))

    return """<!DOCTYPE html><html lang="en-AU"><head><meta charset="utf-8">
<title>Coates | What's on my report - the My Gear legend</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#5A5E66;font-family:'Segoe UI',Arial,sans-serif;padding:16px}
.sheet{width:210mm;background:#fff;margin:0 auto 16px;padding:13mm 12mm;
  display:flex;flex-direction:column}
.top{display:flex;justify-content:space-between;align-items:flex-start;
  margin-bottom:7mm}
.logo{background:__ORG__;color:#fff;padding:9px 20px;border-radius:3px}
.logo .n{font-size:27px;font-weight:800;line-height:1}
.logo .t{font-size:10px;letter-spacing:.4px;margin-top:2px}
.notice{text-align:right;color:__ORG__;font-size:10px;letter-spacing:2.6px;
  font-weight:800;text-transform:uppercase;line-height:1.7;padding-top:4px}
h1{font-size:44px;color:__ORG__;line-height:.95;letter-spacing:-1px}
.sub{font-size:14px;color:#3A3F47;margin:7px 0 7mm;line-height:1.55}
.sub b{color:__DARK__}
/* Sections FLOW across the page break; only a heading and a single row
   are held together. Holding a whole section together stranded a third
   of page one empty and pushed the sheet to three pages - caught by
   rasterising the PDF. A heading alone at the foot of a page is the
   only thing actually worth preventing. */
section{margin-bottom:5mm}
h2{font-size:15px;color:#fff;background:__DARK__;padding:5px 11px;
  border-left:4px solid __ORG__;border-radius:3px;
  break-after:avoid;page-break-after:avoid}
tr,.blurb{break-inside:avoid;page-break-inside:avoid}
.blurb{break-after:avoid;page-break-after:avoid}
.blurb{font-size:12px;color:#33383F;line-height:1.6;margin:5px 0 0;
  padding:0 2px}
table{width:100%;border-collapse:separate;border-spacing:0 3px;margin-top:5px}
td{vertical-align:top;font-size:11.5px;line-height:1.55;padding:6px 10px;
  background:#F1F3F5}
td.t{width:52mm;font-weight:800;color:__DARK__;border-radius:3px 0 0 3px}
td.m{color:#33383F;border-radius:0 3px 3px 0}
.chips{margin-top:6px;padding:8px 10px;background:#1D1D1B;border-radius:3px}
.miss{font-size:11px;color:#B23A1E;padding:6px 2px}
.foot{margin-top:6mm;padding-top:4mm;border-top:1px solid #DDE1E6;
  display:flex;justify-content:space-between;font-size:10px;color:#6E747C}
.foot .siq{color:__ORG__;font-weight:800;letter-spacing:1.1px}
.warn{background:#FDE8E2;border-left:4px solid #B23A1E;padding:8px 11px;
  font-size:11.5px;color:#7A2612;margin-bottom:5mm;line-height:1.55}
@media print{body{background:#fff;padding:0}
  .sheet{width:auto;margin:0;padding:10mm 11mm}
  @page{size:A4;margin:0}}
</style></head><body>
<div class="sheet">
  <div class="top">
    <div class="logo"><div class="n">Coates</div>
      <div class="t">Equipped for anything</div></div>
    <div class="notice">Tool Store<br>My Gear</div>
  </div>
  <h1>What's on my report</h1>
  <div class="sub">Every number, colour and badge on the My Gear page,
    and exactly what each one means. <b>Pin this at the counter.</b></div>
  __WARN__
  __BLOCKS__
  <div class="foot">
    <div>Coates &middot; Equipped for anything &nbsp;|&nbsp; Built __DATE__
      <br>Author: __AUTHOR__</div>
    <div style="text-align:right">POWERED BY <span class="siq">SITEIQ</span>
      <br>Cement Australia K2 Shutdown 2026 &middot; Gladstone</div>
  </div>
</div></body></html>""" \
        .replace("__ORG__", ORANGE).replace("__DARK__", DARK) \
        .replace("__BLOCKS__", "".join(blocks)) \
        .replace("__WARN__", _warn_html()) \
        .replace("__DATE__", _dt.date.today().strftime('%d %b %Y').lstrip('0')) \
        .replace("__AUTHOR__", AUTHOR)


def _warn_html():
    stale = drift_check()
    if not stale:
        return ""
    return ("<div class='warn'><b>Do not pin this sheet up yet.</b> "
            + str(len(stale)) + " thing(s) on it could not be matched "
            "against the report as it is built today: " + _esc(
                '; '.join(stale)) + ". Fix report_legend.py, then run "
            "62_WHATS_ON_MY_REPORT again.</div>")


# ---------------------------------------------------------------------
def main():
    stale = drift_check()
    print(text())
    out_dir = os.path.join(BASE, 'Gear_Lookup')
    if not os.path.isdir(out_dir):
        out_dir = BASE
    out = os.path.join(out_dir, 'MyGear_Whats_On_My_Report.html')
    with io.open(out, 'w', encoding='utf-8') as fh:
        fh.write(sheet_html())
    print('  A4 sheet to print and pin up:')
    print('    ' + out)
    print('')
    if stale:
        print('  ' + '!' * 62)
        print('  WARNING: this legend no longer matches the report.')
        for s in stale:
            print('    - could not find ' + s + ' in BUILD_MY_GEAR.py')
        print('')
        print('  Somebody changed the report and did not change the legend.')
        print('  A legend a bloke believes and that is wrong is worse than')
        print('  no legend, so fix report_legend.py before printing this.')
        print('  ' + '!' * 62)
        return 1
    print('  Checked against BUILD_MY_GEAR.py: every threshold quoted above')
    print('  is still the threshold the report is built with.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
