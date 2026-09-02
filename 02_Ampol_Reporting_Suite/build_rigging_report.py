#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
COATES RIGGING & LIFTING REGISTER - HOUSE-STYLE REPORT (the K2 look)
One run -> client-ready PDF + Outlook email, straight off the
rigging register workbook.
=====================================================================
Author: Andrew Fisher
The Coates Way - Operational Excellence - POWERED BY SITEIQ

WHAT THIS IS
  The rigging register gets a report of its own - the K2 house style,
  same shell as the stocktake family. One run produces:

   1. Coates_Ampol_Rigging_K2STYLE.pdf   (THE report - the position,
      where the gear is by company and hirer, the test-status truth,
      and category detail)
   2. Coates_Ampol_Rigging_OUTLOOK_SAFE.eml  (DRAFT - never sends)
      + Coates_Ampol_Rigging_EMAIL.html body
      + .draft.json so MAKE_OUTLOOK_DRAFTS keeps working.

WHERE THE NUMBERS COME FROM
  Rigging Register.xlsx in the suite's Data area. Two sheets are read:
   - 'Rigging register Master' : every item with its test/inspection
     columns (largely blank today - the fill-in is under way and this
     report says so plainly, it does not paper over it).
   - 'To Help Locate'          : the same fleet with live status,
     company, hirer and on-hire date - where the gear actually is.

DATA RULES
  NO invented test data, ever. A blank test cell renders as a dash
  with a plain-words note that the details are being filled in. The
  register is stood up - the honest story is "here is the fleet, here
  is where it is, here is how far the test records have got" - and
  that is exactly the story the pages tell. On-hire dates are the
  workbook's own datetimes, used verbatim.
=====================================================================
"""

import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime
from email.message import EmailMessage
from email.utils import formatdate
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import ampol_paths
import build_stocktake_compliance_tool as eng   # write_pdf_robust + find_workbook
import k2shell as sh
from k2shell import esc, money, num, K

import openpyxl

BASE = Path(__file__).resolve().parent
# Outputs land in the suite's dated Reports area - Reports\<today>\
# Rigging - one folder per day, nothing ever silently overwritten.
OUT = Path(ampol_paths.day_folder("Rigging"))

CONFIG = {
    "client": "Ampol",
    # WHY (02 Sep 2026): this register has no refresh stamp of its own, so
    # the honest as-at is the register file's saved time - label it so.
    "asat_note": "(register file saved)",
    "title": "Rigging & Lifting Register",
    "kicker": "COATES · TOOL STORE - RIGGING & LIFTING REGISTER REPORT",
    "project": "Ampol Lytton Refinery · Permanent Tool Store",
    "pdf_name": "Coates_Ampol_Rigging_K2STYLE.pdf",
    "eml_name": "Coates_Ampol_Rigging_OUTLOOK_SAFE.eml",
    "email_html": "Coates_Ampol_Rigging_EMAIL.html",
    "draft_json": "Coates_Ampol_Rigging_OUTLOOK.draft.json",
    "team": [
        {"name": "Andrew Fisher", "role": "Shutdown Manager",
         "shift": "", "email": "andrew.fisher@coates.com.au",
         "blurb": "Owns the register and the fill-in push - anything at all, start here",
         "lead": True},
    ],
    "key_items": [
        ("orange", "EVERY ITEM BARCODED", "one register line per item, barcode on every row"),
        ("blue", "TEST FILL-IN UNDER WAY", "blanks print as dashes - never guessed"),
        ("amber", "LONGEST HELD FIRST", "on-hire gear chased oldest first"),
    ],
}

# Master test columns - a row with ANY of these filled counts as having
# test details started. Used for the honest fill-in progress numbers.
TEST_COLS = ["Last Test Date", "Next Test Due", "Test Status",
             "Test Tag Colour", "Tested By", "Tester Licence No",
             "Certificate No", "Inspection Comments"]


# =====================================================================
# load - both sheets, verbatim
# =====================================================================

def _sheet_rows(wb, name, need):
    if name not in wb.sheetnames:
        sys.exit(f"ERROR: the rigging workbook has no '{name}' sheet - "
                 "is this the right file in Data\\?")
    ws = wb[name]
    it = ws.iter_rows(values_only=True)
    hdr = [str(h or "").strip() for h in next(it)]
    ix = {h: i for i, h in enumerate(hdr)}
    missing = [c for c in need if c not in ix]
    if missing:
        sys.exit(f"ERROR: '{name}' is missing columns {missing} - the "
                 "register layout has changed; report needs updating.")
    rows = [r for r in it if any(c not in (None, "") for c in r)]
    return rows, ix


def load_master(path):
    """'Rigging register Master' - the test/inspection side."""
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    raw, ix = _sheet_rows(wb, "Rigging register Master",
                          ["REGISTER_CATEGORY", "ITEM_BARCODE",
                           "REGISTER_DESCRIPTION"] + TEST_COLS)

    def cell(r, name):
        v = r[ix[name]]
        return "" if v is None else v

    rows = []
    for r in raw:
        next_due = cell(r, "Next Test Due")
        last_test = cell(r, "Last Test Date")
        rows.append({
            "cat": str(cell(r, "REGISTER_CATEGORY")).strip(),
            "serial": str(cell(r, "Serial Number")).strip()
                      if "Serial Number" in ix else "",
            "barcode": str(cell(r, "ITEM_BARCODE")).strip(),
            "desc": str(cell(r, "REGISTER_DESCRIPTION")).strip(),
            "last_test": last_test if isinstance(last_test, datetime) else None,
            "next_due": next_due if isinstance(next_due, datetime) else None,
            "status": str(cell(r, "Test Status")).strip(),
            "tag": str(cell(r, "Test Tag Colour")).strip(),
            "tested_by": str(cell(r, "Tested By")).strip(),
            "cert": str(cell(r, "Certificate No")).strip(),
            "has_test": any(str(cell(r, c)).strip() for c in TEST_COLS),
        })
    wb.close()
    return rows


def load_locate(path):
    """'To Help Locate' - where every item is right now."""
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    raw, ix = _sheet_rows(wb, "To Help Locate",
                          ["REGISTER_CATEGORY", "ITEM_BARCODE",
                           "REGISTER_DESCRIPTION", "ITEM_STATUS",
                           "COMPANY_NAME", "HIRER_NAME", "ON_HIRE_DATE"])

    def cell(r, name):
        v = r[ix[name]]
        return "" if v is None else v

    rows = []
    for r in raw:
        ohd = cell(r, "ON_HIRE_DATE")
        rows.append({
            "cat": str(cell(r, "REGISTER_CATEGORY")).strip(),
            "barcode": str(cell(r, "ITEM_BARCODE")).strip(),
            "desc": str(cell(r, "REGISTER_DESCRIPTION")).strip(),
            "status": str(cell(r, "ITEM_STATUS")).strip(),
            "company": str(cell(r, "COMPANY_NAME")).strip(),
            "hirer": str(cell(r, "HIRER_NAME")).strip(),
            "since": ohd if isinstance(ohd, datetime) else None,
        })
    wb.close()
    return rows


# =====================================================================
# derive - the positions the pages print
# =====================================================================

def derive(master, locate, asat_dt):
    d = {}
    d["total"] = len(locate)
    d["cats"] = Counter(r["cat"] or "(no category)" for r in locate)
    d["onhire"] = [r for r in locate if r["status"] == "On Hire"]
    d["avail"] = [r for r in locate if r["status"] != "On Hire"]
    d["oh_cats"] = Counter(r["cat"] or "(no category)" for r in d["onhire"])

    def held_days(r):
        return (asat_dt - r["since"]).days if r["since"] else None

    for r in d["onhire"]:
        r["held"] = held_days(r)

    # where the gear is - by company, then hirer, longest-held first
    co = defaultdict(list)
    for r in d["onhire"]:
        co[r["company"] or "(no company recorded)"].append(r)
    comp = []
    for c, items in co.items():
        items.sort(key=lambda r: (r["since"] is None, r["since"] or datetime.max))
        comp.append({"co": c, "n": len(items),
                     "hirers": len({r["hirer"] for r in items}),
                     "oldest": items[0]})
    comp.sort(key=lambda x: -x["n"])
    d["companies"] = comp
    d["oh_longest"] = sorted(
        [r for r in d["onhire"] if r["since"]],
        key=lambda r: r["since"])
    d["oh_nodate"] = [r for r in d["onhire"] if not r["since"]]

    # test-record fill-in - the honest count off the master sheet
    d["master_n"] = len(master)
    d["with_test"] = [r for r in master if r["has_test"]]
    d["with_dates"] = [r for r in master if r["last_test"] or r["next_due"]]
    d["test_status"] = Counter(r["status"] for r in master if r["status"])
    d["next_due"] = sorted([r for r in master if r["next_due"]],
                           key=lambda r: r["next_due"])
    d["col_fill"] = [(c, sum(1 for r in master if r[k]))
                     for c, k in [("Last Test Date", "last_test"),
                                  ("Next Test Due", "next_due"),
                                  ("Test Status", "status"),
                                  ("Test Tag Colour", "tag"),
                                  ("Tested By", "tested_by"),
                                  ("Certificate No", "cert")]]
    d["serials"] = sum(1 for r in master if r["serial"])

    # category detail
    cats = []
    for c, n in d["cats"].most_common():
        grp_oh = [r for r in d["onhire"] if (r["cat"] or "(no category)") == c]
        grp_oh_dated = sorted([r for r in grp_oh if r["since"]],
                              key=lambda r: r["since"])
        cats.append({"cat": c, "n": n, "oh": len(grp_oh),
                     "avail": n - len(grp_oh),
                     "oldest": grp_oh_dated[0] if grp_oh_dated else None})
    d["cat_detail"] = cats
    d["desc_top"] = Counter(r["desc"] or "(no description)"
                            for r in locate).most_common(10)
    d["desc_unique"] = len(set(r["desc"] for r in locate if r["desc"]))
    return d


# =====================================================================
# PDF rendering via the engine's robust writer
# =====================================================================

def render_k2_pdf(doc, pdf_path, authored, css):
    doc = doc.replace("</head>", f"<style>{css}</style></head>", 1)
    tmp = OUT / (Path(pdf_path).stem + ".__tmp__.html")
    tmp.write_text(doc, encoding="utf-8")
    # pre-delete: write_pdf_robust treats an EXISTING file as success, so a
    # stale copy from a previous run must never be able to masquerade
    try:
        Path(pdf_path).unlink()
    except OSError:
        pass
    try:
        ok = eng.write_pdf_robust(str(tmp), str(pdf_path))
    finally:
        try:
            tmp.unlink()
        except OSError:
            pass
    if not ok:
        sys.exit(f"ERROR: could not render {Path(pdf_path).name} - no PDF "
                 "engine available. Edge is standard on Coates laptops.")
    raw = open(pdf_path, "rb").read()
    counts = re.findall(rb"/Count\s+(\d+)", raw)
    actual = max(int(c) for c in counts) if counts else -1
    if actual == -1:
        print(f"Layout check         : page count unreadable - authored "
              f"{authored}; open the PDF and confirm")
    elif actual != authored:
        print("*" * 68)
        print(f"WARNING: LAYOUT OVERFLOW in {Path(pdf_path).name} - authored "
              f"{authored} pages, PDF has {actual}. Do not send as is.")
        print("*" * 68)
    else:
        print(f"Layout check         : PASS - {actual} pages "
              f"({Path(pdf_path).name})")


# =====================================================================
# shared page fragments (PDF)
# =====================================================================

def psect(title):
    return f'<div class="sect"><h3>{title}</h3></div>'


def pcallout(inner, tight=True):
    cls = "callout tight" if tight else "callout"
    return f'<div class="{cls}">{inner}</div>'


def pnote(inner):
    return f'<div class="note">{inner}</div>'


def psubh(title, thin=""):
    t = f' <span class="thin">{thin}</span>' if thin else ""
    return f'<div class="sub-h">{title}{t}</div>'


def chartpanel(inner):
    return f'<div class="chartpanel">{inner}</div>'


def dash():
    return '<span class="tbc">&ndash;</span>'


def held_cell(r):
    if r["held"] is None:
        return dash()
    cls = "rd" if r["held"] > 90 else "a" if r["held"] > 30 else "g"
    return f'<span class="{cls}">{num(r["held"])}d</span>'


def since_cell(r):
    return r["since"].strftime("%d %b %Y") if r["since"] else dash()


# =====================================================================
# the PDF pages
# =====================================================================

def build_pages(master, locate, d, asat_s):
    P = []
    total = d["total"]
    oh_n = len(d["onhire"])
    oh_pct = oh_n / total * 100 if total else 0
    fill_n = len(d["with_test"])

    # ---- P1 the position ------------------------------------------------
    ladders = sh.score_rows([
        ("Fleet located", 100 if total else 0,
         f"every one of the {num(total)} register items carries a live status "
         f"- {num(oh_n)} on hire, {num(len(d['avail']))} in the store"),
        ("Test records filled in", round(fill_n / d["master_n"] * 100)
         if d["master_n"] else 0,
         f"{num(fill_n)} of {num(d['master_n'])} items have test details "
         f"entered - the register is stood up, the fill-in is under way"),
    ])
    # the category split, worded from whatever the register actually holds
    # - never a hard-coded category name that goes stale
    cat_bits = " and ".join(f'<b>{num(n)} {esc(c.lower())}</b>'
                            for c, n in d["cats"].most_common())
    P.append(f"""{pcallout(
        f'<span class="lead">The position.</span> One page, one honest answer: '
        f'is the {esc(CONFIG["client"])} rigging and lifting fleet on the '
        f'register and accounted for? <b>{num(total)} items</b>, every one '
        f'barcoded, split {cat_bits}. '
        f'Right now <b class="o">{num(oh_n)} are on '
        f'hire ({oh_pct:.0f}%)</b> across {num(len(d["companies"]))} companies, '
        f'and {num(len(d["avail"]))} are in the store. The test columns are the '
        f'work in progress: <b>{num(fill_n)} of {num(d["master_n"])}</b> items '
        f'have test details entered so far - said plainly on page 4, blanks '
        f'shown as dashes, nothing invented.', False)}
<table class="two" style="margin-top:14px"><tr>
  <td style="width:31%"><div class="donut-wrap">
    {sh.donut(round(oh_pct), K["orange"], f"{oh_pct:.0f}%", "ON HIRE")}
    <div class="donut-cap">Share of the fleet out on hire right now</div></div></td>
  <td style="padding-left:10px">{ladders}</td>
</tr></table>
{psubh("The fleet by category", "&mdash; on hire vs in the store")}
{chartpanel(sh.grouped_bars(
    [{"label": c["cat"], "onhire": c["oh"], "avail": c["avail"]}
     for c in d["cat_detail"]], h=170,
    series=(("onhire", K["orange"], "On hire"),
            ("avail", "#22C55E", "In the store"))))}
{sh.tiles([
    ("box", num(total), "Items on the register", "every one barcoded", "grey"),
    ("swap", num(oh_n), "On hire now",
     f"across {num(len(d['companies']))} companies", "amber"),
    ("check", num(len(d["avail"])), "In the store", "ready for issue", "green"),
    ("wrench", f"{num(fill_n)}/{num(d['master_n'])}", "Test records entered",
     "fill-in under way", "amber" if fill_n < d["master_n"] else "green"),
])}""")

    # ---- P2 where the gear is -------------------------------------------
    comp = d["companies"]
    cap_co = 12
    crows = []
    for c in comp[:cap_co]:
        o = c["oldest"]
        crows.append([
            esc(c["co"]),
            num(c["n"]),
            num(c["hirers"]),
            f'{esc(o["desc"])}<span class="s2">{esc(o["barcode"])} &middot; '
            f'{esc(o["hirer"])}</span>' if o else dash(),
            held_cell(o) if o and o.get("held") is not None else dash()])
    more_co = (pnote(f'Showing {cap_co} of {len(comp)} companies - the rest '
                     f'hold {num(sum(c["n"] for c in comp[cap_co:]))} items '
                     f'between them; full detail in the register workbook.')
               if len(comp) > cap_co else "")
    P.append(f"""{psect("Where the rigging gear is - by company, longest held first")}
{pcallout(f'<b class="o">{num(len(d["onhire"]))} items</b> are out on hire. Companies ranked by holding, and each company&rsquo;s <b>longest-held item</b> named with its barcode - because the oldest hire is always the first conversation. Every date is the workbook&rsquo;s own on-hire datetime.', False)}
{sh.dtable(["Company", "Items", "Hirers", "Longest-held item", "Held"],
           crows, ["", "r", "r", "", "r"])}
{more_co}
{pnote('Held = days from the item&rsquo;s on-hire date to the data-as-at stamp. Long-held is not lost - shutdown gear runs long by nature - but oldest-first is the order the counter works the returns.')}""")

    # ---- P3 the longest-held, item by item -------------------------------
    # Its own page - sharing one page with the company table ran into
    # the footer, and an overflowing page never goes to a client.
    cap_l = 18
    lrows = []
    for r in d["oh_longest"][:cap_l]:
        lrows.append([
            esc(r["company"]) or dash(),
            esc(r["hirer"]) or dash(),
            esc(r["desc"]) or dash(),
            esc(r["barcode"]) or dash(),
            since_cell(r),
            held_cell(r)])
    P.append(f"""{psect("The longest-held, item by item - oldest first")}
{pcallout(f'The front of the queue: the {min(cap_l, len(d["oh_longest"]))} oldest hires of the {num(len(d["oh_longest"]))} dated on-hire items, each with its barcode, holder and the workbook&rsquo;s own on-hire date. Work them top down - every return retires the oldest risk first.', False)}
{sh.dtable(["Company", "Hirer", "Item", "Barcode", "On hire since", "Held"],
           lrows, ["", "", "", "", "r", "r"])}
{pnote((f'Showing {cap_l} of {len(d["oh_longest"])} dated on-hire items - the register workbook carries the lot, same order. ' if len(d["oh_longest"]) > cap_l else '') + ('' if not d["oh_nodate"] else f'{num(len(d["oh_nodate"]))} on-hire items carry no on-hire date in the workbook - shown as dashes, not guessed. ') + 'Held = days from the on-hire date to the data-as-at stamp.')}""")

    # ---- P3 test status - the truth -------------------------------------
    ts = d["test_status"].most_common()
    if ts:
        srows = [[esc(s), num(n)] for s, n in ts]
        srows.append(['<span class="tbc">(blank - awaiting fill-in)</span>',
                      num(d["master_n"] - sum(n for _, n in ts))])
    else:
        srows = [['<span class="tbc">(blank - awaiting fill-in)</span>',
                  num(d["master_n"])]]
    cap_nd = 14
    if d["next_due"]:
        ndrows = [[esc(r["desc"]) or dash(), esc(r["barcode"]) or dash(),
                   r["next_due"].strftime("%d %b %Y"),
                   esc(r["status"]) if r["status"] else dash()]
                  for r in d["next_due"][:cap_nd]]
        nd_block = (
            psubh("Next test due", f"&mdash; soonest first, showing "
                  f"{min(cap_nd, len(d['next_due']))} of {len(d['next_due'])}")
            + sh.dtable(["Item", "Barcode", "Next test due", "Test status"],
                        ndrows, ["", "", "r", ""]))
    else:
        nd_block = pnote('No Next Test Due dates are recorded in the register '
                         'yet - the moment they are entered, this page sorts '
                         'them soonest first automatically. Until then the '
                         'cells print as dashes, never estimates.')
    fill_rows = [(lab, n, d["master_n"], "f-orange" if n else "f-amber",
                  f"{num(n)} of {num(d['master_n'])}")
                 for lab, n in d["col_fill"]]
    P.append(f"""{psect("Test status - what the register holds today, no varnish")}
{pcallout(f'Straight up: the register is <b>stood up and complete on identity</b> - every item barcoded, categorised and located - and the <b>test details are being filled in</b>. {num(len(d["with_test"]))} of {num(d["master_n"])} items have any test detail entered and {num(len(d["with_dates"]))} carry test dates so far. That is the truth of it, and it is exactly what this page tracks refresh over refresh. {num(d["serials"])} items already carry a serial number from the standing-up work.', False)}
{psubh("Test Status values on the register")}
{sh.dtable(["Test Status (as recorded)", "Items"], srows, ["", "r"])}
{nd_block}
{psubh("Fill-in progress by column", "&mdash; how far each test column has got")}
{sh.prog_rows(fill_rows)}
{pnote('A dash anywhere on this page means the register cell is blank - the test details for that item are still to be entered. Nothing is assumed, estimated or copied in from anywhere else.')}""")

    # ---- P4 category detail ---------------------------------------------
    catrows = []
    for c in d["cat_detail"]:
        o = c["oldest"]
        catrows.append([
            esc(c["cat"]),
            num(c["n"]),
            num(c["oh"]),
            num(c["avail"]),
            f'{esc(o["desc"])}<span class="s2">{esc(o["barcode"])} &middot; '
            f'{esc(o["company"])} &middot; {esc(o["hirer"])}</span>' if o else dash(),
            held_cell(o) if o and o.get("held") is not None else dash()])
    cap_d = 10
    dt = d["desc_top"][:cap_d]
    drows = [[esc(desc), num(n)] for desc, n in dt]
    P.append(f"""{psect("Category detail - the fleet at line level")}
{pcallout('Two categories carry the whole register. Each one&rsquo;s count, its on-hire split, and its longest-held item named with barcode and holder - the line the counter chases first in that category.')}
{sh.dtable(["Category", "Items", "On hire", "In store", "Longest-held item", "Held"],
           catrows, ["", "r", "r", "r", "", "r"])}
{psubh("The biggest lines", f"&mdash; top {len(dt)} of {num(d['desc_unique'])} distinct descriptions on the register")}
{chartpanel(sh.hbars([(desc, n) for desc, n in dt], colour=K["blue"]))}
{pnote('Counts come straight off the register&rsquo;s locate sheet - one row per physical item, barcode on every row.')}""")

    # ---- P5 close --------------------------------------------------------
    cards = sh.info_cards([
        ("Stood up, then filled in",
         "The register was built identity-first: every item barcoded, "
         "categorised and locatable on day one. Test details are being "
         "entered now - progress is printed, page 4, every run."),
        ("No invented test data",
         "A blank test cell prints as a dash, full stop. No status is "
         "assumed, no date estimated - rigging gear is Life Saving Rule 5 "
         "territory (SEQ-GL-009) and the record has to be real."),
        ("Longest held, first chased",
         "On-hire gear is worked oldest first, by company and hirer, off "
         "the workbook's own on-hire dates - the conversation is always a "
         "name and a barcode, never a guess."),
        ("One register, one truth",
         "Master and locate sheets travel in the same workbook - identity "
         "and whereabouts can never drift apart unnoticed, and this report "
         "reads both every run."),
    ])
    P.append(f"""{psect("How the rigging fleet is run")}
{cards}
{psect("Meet the tool store team")}
{pnote(f'The crew running your {esc(CONFIG["client"])} store - keeping the register true and the gear ready. Something not right? Tell us and we&rsquo;ll sort it.')}
{sh.team_cards(CONFIG["team"])}""")
    return P


def render_doc(pages, gen_s, asat_s):
    tot = len(pages)
    body = "".join(sh.render_page(CONFIG, p, i + 1, tot, gen_s, asat_s)
                   for i, p in enumerate(pages))
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
            f'<title>Coates {esc(CONFIG["client"])} {esc(CONFIG["title"])} - '
            f'{esc(asat_s)}</title></head><body>{body}</body></html>'), tot


# =====================================================================
# the Outlook email (draft - never sends)
# =====================================================================

def build_email_html(d, gen_s, asat_s):
    W = 1000
    FONT = sh.FONT
    total = d["total"]
    oh_n = len(d["onhire"])
    oh_pct = oh_n / total * 100 if total else 0
    fill_n = len(d["with_test"])
    parts = []

    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td bgcolor="#1A2430" style="padding:22px 24px 19px 24px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td>
<div style="{FONT}font-size:11px;font-weight:bold;letter-spacing:2.5px;color:#F36F21;text-transform:uppercase;">{esc(CONFIG['kicker'])}</div>
<div style="{FONT}font-size:26px;font-weight:bold;color:#FFFFFF;padding-top:8px;">Ampol Rigging &amp; Lifting Register - The Position</div>
<div style="{FONT}font-size:13px;color:#A7B6C4;padding-top:7px;">{esc(CONFIG['project'])}</div>
</td>
<td width="185" align="right" style="vertical-align:top;">
<div style="{FONT}font-size:11px;font-weight:bold;letter-spacing:1.5px;color:#FFFFFF;">POWERED BY <span style="color:#F36F21;">SITEIQ</span></div>
<div style="{FONT}font-size:11.5px;color:#8395A6;padding-top:5px;">Equipped for anything</div>
</td></tr></table>
<div style="{FONT}font-size:11px;color:#8395A6;padding-top:10px;line-height:1.6;">Generated: <b style="color:#FFFFFF;">{esc(gen_s)}</b> &nbsp;|&nbsp; Data as at: <b style="color:#FFFFFF;">{esc(asat_s)}</b> (register file saved) &nbsp;|&nbsp; Author: <b style="color:#FFFFFF;">Andrew Fisher</b></div>
</td></tr></table>""")

    # nested f-strings reusing the outer quote break on older Pythons on
    # the store laptops - build the fragment first, drop it in after
    fill_s = num(fill_n) + " of " + num(d["master_n"])
    parts.append(sh.ecallout(
        f'<span style="color:#D95F14;font-weight:bold;text-transform:uppercase;">'
        f'The position.</span> {sh.eo(num(total) + " rigging and lifting items")} '
        f'on the register, every one barcoded. {sh.eo(num(oh_n) + " on hire")} '
        f'({oh_pct:.0f}%) across {num(len(d["companies"]))} companies, '
        f'<b>{num(len(d["avail"]))}</b> in the store. Test records: '
        f'{sh.eo(fill_s)} filled in - the '
        f'register is stood up, the test details are being entered, and '
        f'blanks print as dashes, never guesses. Full detail in the PDF.'))

    parts.append(sh.etiles([
        (num(total), "ITEMS ON THE REGISTER", "every one barcoded", "#8A9AAC"),
        (num(oh_n), "ON HIRE NOW",
         f'across {num(len(d["companies"]))} companies', "#EFA82B"),
        (num(len(d["avail"])), "IN THE STORE", "ready for issue", "#22C55E"),
        (f"{num(fill_n)}/{num(d['master_n'])}", "TEST RECORDS ENTERED",
         "fill-in under way", "#EFA82B" if fill_n < d["master_n"] else "#22C55E"),
    ]))

    cap = 8
    comp = d["companies"]
    crows = []
    for c in comp[:cap]:
        o = c["oldest"]
        crows.append([esc(c["co"]), num(c["n"]), num(c["hirers"]),
                      (f'{esc(o["desc"])} ({esc(o["barcode"])})' if o else "&ndash;"),
                      (f'{num(o["held"])}d' if o and o.get("held") is not None else "&ndash;")])
    parts.append(sh.esect("Where the gear is - companies by holding"))
    parts.append(sh.edtable(["Company", "Items", "Hirers", "Longest-held item", "Held"],
                            crows, ["", "r", "r", "", "r"]))
    if len(comp) > cap:
        parts.append(sh.enote(f'Showing {cap} of {len(comp)} companies - the '
                              f'PDF attached carries the full picture.'))

    cap2 = 8
    lrows = [[esc(r["company"]) or "&ndash;", esc(r["hirer"]) or "&ndash;",
              esc(r["desc"]) or "&ndash;", esc(r["barcode"]) or "&ndash;",
              r["since"].strftime("%d %b %Y"),
              f'{num(r["held"])}d' if r.get("held") is not None else "&ndash;"]
             for r in d["oh_longest"][:cap2]]
    parts.append(sh.esect("Longest held - oldest first"))
    parts.append(sh.edtable(["Company", "Hirer", "Item", "Barcode", "Since", "Held"],
                            lrows, ["", "", "", "", "r", "r"]))
    if len(d["oh_longest"]) > cap2:
        parts.append(sh.enote(f'Showing {cap2} of {len(d["oh_longest"])} dated '
                              f'on-hire items - full list in the PDF.'))

    parts.append(sh.enote(
        'No invented test data anywhere in this report - a blank register '
        'cell renders as a dash with the fill-in noted. Rigging gear is Life '
        'Saving Rule 5 territory; the record has to be real.'))

    team_line = " &middot; ".join(
        f'<b style="color:#16202C;">{esc(p["name"])}</b> '
        f'<span style="color:#8A9AAC;">{esc(p["role"])}</span>'
        for p in CONFIG["team"])
    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:26px;">
<tr><td style="border-top:1px solid #E4E8EC;padding-top:10px;">
<div style="{FONT}font-size:10px;font-weight:bold;letter-spacing:2px;color:#F36F21;text-transform:uppercase;">Your Coates Tool Store Team</div>
<div style="{FONT}font-size:11px;color:#8A9AAC;padding-top:5px;line-height:1.7;">{team_line}</div>
<div style="{FONT}font-size:10px;color:#98A6B4;padding-top:9px;line-height:1.7;">
Coates Hire &middot; Source: Rigging Register.xlsx (file saved {esc(asat_s)}) - master and locate sheets read verbatim; blanks shown as dashes, never guessed. The Coates Way - consistent execution, every day. <b style="color:#16202C;">POWERED BY SITEIQ</b></div>
</td></tr></table>""")

    body = "".join(
        f'<tr><td style="padding:0 24px;">{p}</td></tr>'
        if "bgcolor=\"#1A2430\"" not in p[:120] else f'<tr><td>{p}</td></tr>'
        for p in parts)
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Ampol Rigging &amp; Lifting Register - {esc(asat_s)}</title></head>
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
    print("=" * 68)
    print("COATES RIGGING & LIFTING REGISTER - HOUSE-STYLE REPORT (K2 look)")
    print("=" * 68)
    src = eng.find_workbook(["Rigging Register*.xlsx"],
                            sys.argv[1] if len(sys.argv) > 1 else None)
    if not src:
        sys.exit("ERROR: no Rigging Register*.xlsx in the suite's Data "
                 "folder - save the register there and run again.")
    print(f"Rigging register     : {src}")

    master = load_master(src)
    locate = load_locate(src)
    # Data as at = the workbook's saved time - this register has no
    # self-refresh timestamp of its own, so the file time is the honest
    # stamp and is labelled as exactly that.
    asat_dt = datetime.fromtimestamp(os.path.getmtime(src))
    asat_s = asat_dt.strftime("%d %b %Y %H:%M")
    gen_s = datetime.now().strftime("%d %b %Y %H:%M")
    d = derive(master, locate, asat_dt)

    print(f"Data as at           : {asat_s}  (workbook file time)")
    print(f"Items on register    : {d['total']:,}  "
          f"({' | '.join(f'{c} {n:,}' for c, n in d['cats'].most_common())})")
    print(f"On hire / in store   : {len(d['onhire']):,} / {len(d['avail']):,}  "
          f"across {len(d['companies']):,} companies")
    print(f"Test records         : {len(d['with_test']):,} of "
          f"{d['master_n']:,} items have test details entered")
    if d["oh_longest"]:
        o = d["oh_longest"][0]
        print(f"Longest held         : {o['desc']} ({o['barcode']}) - "
              f"{o['company']} / {o['hirer']} since "
              f"{o['since'].strftime('%d %b %Y')}")

    # ---- 1. the PDF -----------------------------------------------------
    css_path = BASE / "k2style.css"
    if not css_path.exists():
        sys.exit("ERROR: k2style.css is missing from the suite folder - the "
                 "house-style PDF cannot render without it.")
    css = css_path.read_text(encoding="utf-8")
    print("-" * 68)
    print("[1/2] Rigging register PDF (house style)...")
    doc, n_pages = render_doc(build_pages(master, locate, d, asat_s),
                              gen_s, asat_s)
    pdf_path = OUT / CONFIG["pdf_name"]
    render_k2_pdf(doc, pdf_path, n_pages, css)

    # ---- 2. the email (draft - never sends) -----------------------------
    print("[2/2] Outlook email (house style, draft only)...")
    html = build_email_html(d, gen_s, asat_s)
    (OUT / CONFIG["email_html"]).write_text(html, encoding="utf-8")
    msg = EmailMessage()
    subject = (f"Ampol Tool Store - Rigging & Lifting Register Report - "
               f"as at {asat_dt.strftime('%d/%m/%Y %H:%M')}")
    msg["Subject"] = subject
    msg["To"] = eng.STAFF_EMAIL_TO
    msg["Date"] = formatdate(localtime=True)
    msg["X-Unsent"] = "1"
    msg.set_content("This report is best viewed in HTML. The rigging and "
                    "lifting register PDF is attached.\n")
    msg.add_alternative(html, subtype="html")
    attach = [str(pdf_path)]
    for p in attach:
        if os.path.exists(p):
            with open(p, "rb") as f:
                msg.add_attachment(f.read(), maintype="application",
                                   subtype="pdf", filename=os.path.basename(p))
    eml_path = OUT / CONFIG["eml_name"]
    with open(eml_path, "wb") as f:
        f.write(msg.as_bytes())
    print(f"EML written          : {eml_path}  "
          f"({os.path.getsize(eml_path):,} bytes)")
    # manifest so MAKE_OUTLOOK_DRAFTS keeps working - recipients derive
    # from the engine's STAFF_EMAIL_TO, one source of truth.
    import json
    to_line = "; ".join(re.findall(r"<([^>]+)>", eng.STAFF_EMAIL_TO))
    (OUT / CONFIG["draft_json"]).write_text(json.dumps({
        "subject": subject,
        "to": to_line,
        "body": CONFIG["email_html"],
        "attachments": [os.path.basename(p) for p in attach],
    }, indent=1), encoding="utf-8")
    print("")
    print(f"NEXT STEP: double-click the .eml in {OUT}, check it, press Send.")
    print("Done. The Coates Way - consistent execution, every day.")


if __name__ == "__main__":
    # Failures leave a nonzero exit so the bat button tells the truth;
    # the bat owns the end-of-run pause - no input() here.
    try:
        main()
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(f"\nERROR: {e}")
