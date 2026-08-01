#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | EQUIPMENT COMPLIANCE - the line under the description
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Every hire line that needs a compliance check now says so, in words,
#  right under the item description - on every report, every email and
#  on My Gear. Per A. Fisher, 25 Jul 2026:
#
#    "This eliminates the excuse of can't bring it back, as all the
#     detail is there. It also allows the Coates team to check gear
#     over to ensure it's safe for use."
#
#  FOUR THINGS CAN SHOW UNDER A LINE
#  --------------------------------
#    1. ELECTRICAL   ->  CURRENT TAG COLOUR: BLUE
#    2. RIGGING      ->  CURRENT TAG COLOUR: BLUE
#    3. LOGBOOK      ->  DAILY PRE-START AND LOGBOOK ENTRY REQUIRED
#    4. RETURN       ->  free text, e.g. gas monitors back daily for
#                        bump testing; radios back daily for charging.
#
#  WHERE THE ANSWER COMES FROM
#  ---------------------------
#  K2_MASTER_EQUIPMENT_PRICING.xlsx - the same one file that already
#  drives descriptions and replacement costs. Four new columns:
#
#      ELECTRICAL_TAG | RIGGING_TAG | LOGBOOK_REQUIRED | RETURN_REQUIREMENT
#
#  Y / YES / TRUE / 1 / X turns a flag on. Blank turns it off. That is
#  the whole rule: no data in the column, nothing in the report. Fix a
#  row in the spreadsheet and the next run fixes every report at once.
#
#  Lookup order for any line: exact ITEM_NUMBER first, then the item's
#  description matched against the master. Nothing is ever guessed at
#  render time - if the master doesn't say it, the report doesn't say it.
#
#  THE TAG COLOUR
#  --------------
#  TAG_PERIODS below is the ONLY place the colour lives. When the
#  inspection colour rolls over, add the next period there and every
#  report follows on the next run. Outside a known period the badge
#  says "CHECK TAG IS CURRENT" rather than name a colour we can't
#  stand behind.
# =====================================================================

import datetime as _dt
import re as _re

# ---------------------------------------------------------------------
#  1. TAG COLOUR - the one place to change it
# ---------------------------------------------------------------------
#  (start date, end date, COLOUR NAME, swatch hex)
#  Only periods we actually know go in here. Add the next one when the
#  colour is confirmed - do not guess ahead.
TAG_PERIODS = [
    (_dt.date(2026, 7, 1), _dt.date(2026, 8, 31), "BLUE", "#2F80ED"),
]

#  When the fleet behind the current colour was actually tested and tagged.
#  Confirmed by A. Fisher, 25 Jul 2026: ALL rigging and electrical equipment
#  was tested at the start of July 2026, so everything issued in this period
#  carries a current blue tag. That is a fact about the fleet, attested by
#  the Shutdown Manager - not a per-asset audit and not a guess. It is what
#  lets the compliance strips say "all current" instead of hedging.
#  Set to None if a period ever goes out without a confirmed test date, and
#  the reports fall back to stating the requirement only.
FLEET_TESTED = _dt.date(2026, 7, 1)
FLEET_TESTED_TEXT = "Tested Jul 2026"

# Shown when today falls outside every known period - honest, not wrong.
TAG_UNKNOWN_TEXT = "CHECK INSPECTION TAG IS CURRENT"
TAG_UNKNOWN_HEX = "#8B9099"

# Set False to drop the "· ELECTRICAL" / "· RIGGING" suffix on the tag badge.
SHOW_DISCIPLINE = True

# The exact words Andrew asked for.
TXT_TAG = "CURRENT TAG COLOUR: {colour}"
TXT_LOGBOOK = "DAILY PRE-START AND LOGBOOK ENTRY REQUIRED"

GLYPH_TAG = "\U0001F535"        # blue circle
GLYPH_LOGBOOK = "\U0001F4DD"    # memo
GLYPH_RETURN = "↺"         # return arrow

# Badge colours
COL_LOGBOOK = "#F26222"         # Coates orange
COL_RETURN = "#F2B01E"          # amber

# ---------------------------------------------------------------------
#  COMPACT MARKERS - the executive layout (26 Jul 2026)
#  The sentence chips ("CURRENT TAG COLOUR: BLUE - ELECTRICAL", "DAILY
#  PRE-START AND LOGBOOK ENTRY REQUIRED") each cost a full line under
#  every flagged item and busy pages lost a third of their room to them.
#  Now a KEY at the top of every page says what each colour means ONCE,
#  and each item just carries a coloured dot + one word on the same
#  line: ELECTRICAL / RIGGING in the current tag colour, LOGBOOK in
#  yellow, RETURN DAILY in orange. Set COMPACT = False to bring the old
#  chips back everywhere at once.
# ---------------------------------------------------------------------
COMPACT = True
COL_C_LOGBOOK = "#E0A500"       # logbook word - yellow, dark enough to read
COL_C_RETURN = "#F26222"        # return-daily word - Coates orange


def _dotword(text, hexcode, size="8pt"):
    """One compact marker: coloured dot + one coloured word, inline, on
    the same line as the description - costs no extra lines at all."""
    #  The dot glues to the first word; the phrase itself may wrap in a
    #  squeezed column - a nowrap marker was shoving the last column off
    #  the sheet on the 7-column hirer tables. (26 Jul 2026)
    return ("<span style=\"color:{c};font-weight:800;"
            "font-size:{s};letter-spacing:.4px;font-family:Segoe UI,Arial,"
            "sans-serif\">&#9679;&nbsp;{t}</span>").format(
        c=hexcode, s=size, t=_esc(text))


def key_strip_html(on=None):
    """The KEY strip for the top of a page - defines every marker once so
    the items below only need a dot and a word. One slim line."""
    name, hexc = tag_colour(on)
    #  Say how long the colour holds, straight off TAG_PERIODS - crews ask
    #  "what colour next month?" at the counter every single day.
    #  (Andrew, 26 Jul 2026: BLUE holds through August.)
    d = on or _dt.date.today()
    if isinstance(d, _dt.datetime):
        d = d.date()
    runs_to = ""
    for start, end, pname, _hex in TAG_PERIODS:
        if start <= d <= end and (end.year, end.month) > (d.year, d.month):
            runs_to = (" &middot; stays <b style=\"color:{h}\">{n}</b> "
                       "through {m}").format(h=_hex, n=_esc(pname),
                                             m=end.strftime("%B"))
            break
    tag_note = ("test &amp; tag current &middot; tag colour "
                "<b style=\"color:{h}\">{n}</b>{r}").format(
        h=hexc or TAG_UNKNOWN_HEX, n=_esc(name or "see store"), r=runs_to)
    parts = [
        "<b style=\"letter-spacing:1.5px\">KEY</b>",
        _dotword("ELECTRICAL / RIGGING", hexc or TAG_UNKNOWN_HEX, "7.5pt")
        + " <span>" + tag_note + "</span>",
        _dotword("LOGBOOK", COL_C_LOGBOOK, "7.5pt")
        + " <span>daily pre-start &amp; logbook entry</span>",
        _dotword("RETURN DAILY", COL_C_RETURN, "7.5pt")
        + " <span>back to the tool store every shift</span>",
    ]
    return ("<div style=\"font-size:7.5pt;color:#5B6472;margin:6px 0 0;"
            "padding:4px 2px 0;border-top:1px solid #E3E6EB;"
            "line-height:1.6\">" +
            " &nbsp;&nbsp; ".join(parts) + "</div>")


def tag_colour(on=None):
    """(colour name, hex) for the date, or (None, None) if we don't know."""
    d = on or _dt.date.today()
    if isinstance(d, _dt.datetime):
        d = d.date()
    for start, end, name, hexcode in TAG_PERIODS:
        if start <= d <= end:
            return name, hexcode
    return None, None


def tag_text(on=None):
    name, _ = tag_colour(on)
    return TXT_TAG.format(colour=name) if name else TAG_UNKNOWN_TEXT


def tag_hex(on=None):
    _, hexcode = tag_colour(on)
    return hexcode or TAG_UNKNOWN_HEX


# ---------------------------------------------------------------------
#  2. THE MASTER - bound once per run by each report builder
# ---------------------------------------------------------------------
_MASTER = None
_BY_DESC = {}          # normalised description -> flags dict
_LOADED = False


def _norm(s):
    return _re.sub(r"\s+", " ", str(s or "")).strip().lower()


def _yes(v):
    return _norm(v) in ("y", "yes", "true", "1", "x", "req", "required")


def bind(master):
    """Point the compliance engine at the loaded master file. Safe to call
    more than once, and safe to never call at all - with no master bound,
    every lookup simply returns nothing and no badges render."""
    global _MASTER, _BY_DESC, _LOADED
    _MASTER = master
    _BY_DESC = {}
    _LOADED = False
    if not master or not getattr(master, "by_item", None):
        return
    for rec in master.by_item.values():
        f = _rec_flags(rec)
        if not any(f.values()):
            continue
        for key in (rec.get("new_desc"), rec.get("orig_desc")):
            k = _norm(key)
            if k and k not in _BY_DESC:
                _BY_DESC[k] = f
    _LOADED = True


def _rec_flags(rec):
    """Read the four compliance columns off one master record."""
    if not rec:
        return {"electrical": False, "rigging": False,
                "logbook": False, "ret": ""}
    return {
        "electrical": _yes(rec.get("electrical")),
        "rigging": _yes(rec.get("rigging")),
        "logbook": _yes(rec.get("logbook")),
        "ret": str(rec.get("ret") or "").strip(),
    }


_EMPTY = {"electrical": False, "rigging": False, "logbook": False, "ret": ""}


def flags(item=None, desc=None):
    """What this line has to comply with. Item number wins; description is
    the fallback so barcode-keyed and grouped tables still get it right."""
    if not _LOADED:
        return dict(_EMPTY)
    if item and _MASTER:
        rec = _MASTER.rec(item)
        if rec:
            f = _rec_flags(rec)
            if any(f.values()):
                return f
            return dict(_EMPTY)      # in the master, deliberately clean
    k = _norm(desc)
    if k and k in _BY_DESC:
        return dict(_BY_DESC[k])
    return dict(_EMPTY)


def has_any(item=None, desc=None):
    f = flags(item, desc)
    return bool(f["electrical"] or f["rigging"] or f["logbook"] or f["ret"])


#  Working at Height gear - harnesses, lanyards, anchor straps, tool
#  tethers - is inspection-tagged the same way rigging is, but calling a
#  tool tether "RIGGING" on a client report is simply the wrong word. It
#  rides the same RIGGING_TAG column and gets the same blue tag; only the
#  label on the badge changes. (A. Fisher, 25 Jul 2026)
HEIGHT_CATEGORIES = {"working at height"}
TXT_HEIGHT = "HEIGHT SAFETY"


def disciplines(f, item=None):
    d = []
    if f["electrical"]:
        d.append("ELECTRICAL")
    if f["rigging"]:
        cat = ""
        if item and _MASTER:
            cat = _norm(_MASTER.category(item))
        d.append(TXT_HEIGHT if cat in HEIGHT_CATEGORIES else "RIGGING")
    return d


# ---------------------------------------------------------------------
#  3. RENDERING - one helper per surface, all fed by flags()
# ---------------------------------------------------------------------
_THEMES = {
    # theme: (chip background, border alpha style)
    "dark": "background:{bg};color:#fff;",
    "light": "background:{bg};color:#fff;",
    "email": "background:{bg};color:#ffffff;",
}


def _chip(text, hexcode, theme="dark", glyph=""):
    """One badge. Inline styles only - the same markup has to survive a
    paged HTML report, a print-to-PDF and an Outlook email body.

    white-space:normal is set EXPLICITLY, not left off. A nowrap chip
    sets a minimum width on whatever cell it lands in, and on a full hire
    table that pushed the Replacement Cost column clean off the A4 page.
    Left to wrap, the badge breaks at a space in a narrow column and the
    table keeps its shape. It has to be stated because table.data .num
    carries white-space:nowrap and the chip would otherwise inherit it.
    (A. Fisher, 25 Jul 2026)"""
    lead = (glyph + "&nbsp;") if glyph else ""
    return (
        "<span style=\"display:inline-block;white-space:normal;"
        "background:{bg};color:#ffffff;border-radius:9px;"
        "padding:1px 8px;margin:2px 5px 0 0;font-size:7.5pt;"
        "font-weight:800;letter-spacing:.2px;line-height:1.55;"
        "font-family:Segoe UI,Arial,sans-serif\">{lead}{t}</span>"
    ).format(bg=hexcode, lead=lead, t=_esc(text))


def _esc(s):
    return (str(s or "").replace("&", "&amp;")
            .replace("<", "&lt;").replace(">", "&gt;"))


def badges_html(item=None, desc=None, theme="dark", on=None, wrap=True):
    """The compliance lines that sit UNDER a description. Returns "" when
    the line has nothing to declare - so a report only shows what the
    master actually says."""
    f = flags(item, desc)
    out = []

    if COMPACT:
        #  The executive layout: dot + word on the SAME line as the
        #  description. The page's KEY strip carries the meaning.
        if f["electrical"] or f["rigging"]:
            for d in disciplines(f, item):
                out.append(_dotword(d, tag_hex(on)))
        if f["logbook"]:
            out.append(_dotword("LOGBOOK", COL_C_LOGBOOK))
        if f["ret"]:
            out.append(_dotword(f["ret"].upper(), COL_C_RETURN))
        if not out:
            return ""
        return " &nbsp;" + "&nbsp; ".join(out)

    if f["electrical"] or f["rigging"]:
        label = tag_text(on)
        if SHOW_DISCIPLINE:
            label += " · " + " + ".join(disciplines(f, item))
        out.append(_chip(label, tag_hex(on), theme, GLYPH_TAG))

    if f["logbook"]:
        out.append(_chip(TXT_LOGBOOK, COL_LOGBOOK, theme, GLYPH_LOGBOOK))

    if f["ret"]:
        out.append(_chip(f["ret"].upper(), COL_RETURN, theme, GLYPH_RETURN))

    if not out:
        return ""
    inner = "".join(out)
    if not wrap:
        return inner
    return "<div style=\"margin-top:3px;line-height:1.5\">{}</div>".format(inner)


def desc_html(desc, item=None, theme="dark", on=None):
    """A full description cell: the name, then its compliance lines under
    it. This is the drop-in for every `esc(r["description"])` in the suite."""
    return _esc(desc) + badges_html(item, desc, theme, on)


#  The neon highlighter - one colour for the whole suite. Dark ink on it
#  reads on white pages, dark pages and email screenshots alike.
NEON = "#EFFF3D"


def store_story_html():
    """THE TOOL STORE HAS YOUR BACK - the story every contractor report
    carries. What the store does for the crews, said once, warmly, with
    the practical bits people actually ask about at the counter.
    (Andrew's list, 26 Jul 2026.)"""
    def cell(title, body):
        return ("<td style=\"width:50%;vertical-align:top;background:#F6F7F9;"
                "border:1px solid #E3E6EB;border-left:4px solid " + NEON +
                ";border-radius:8px;padding:9px 12px\">"
                "<div style=\"font-size:8pt;font-weight:800;letter-spacing:"
                "1px;text-transform:uppercase;color:#14181F\">" + title +
                "</div><div style=\"font-size:9pt;color:#33393F;"
                "line-height:1.55;margin-top:3px\">" + body +
                "</div></td>")
    rows = [
        (cell("Scan &amp; look - double scanned, every time",
              "Every item is scanned <b>and</b> sighted going out, and "
              "scanned and sighted coming back - our scan-and-look "
              "process. If it moved, it is on the record. That is your "
              "protection as much as ours."),
         cell("Stock you can trust",
              "The store runs stock rotation with full stock checks "
              "every <b>3 days</b> - what the register says is on the "
              "shelf is what is on the shelf.")),
        (cell("SDS on your phone",
              "Safety Data Sheets are available <b>inside the tool "
              "store</b>, and outside it - scan the QR code on the wall "
              "and the SDS downloads straight to your phone."),
         cell("Logbook gear",
              "Anything marked LOGBOOK needs its daily pre-start and "
              "logbook entry before it operates - books and blank pages "
              "are at the counter.")),
        (cell("Breakdowns - tell us everything",
              "Something stops? Report it straight away with the "
              "details: <b>where it is, what is wrong, what it was "
              "doing</b>. We will get it swapped or fixed - no drama, "
              "no waiting."),
         cell("Floggers &amp; the small stuff",
              "Using floggers? <b>Flogger holders are available at the "
              "store.</b> How-to cards, radio channel cards and gas "
              "monitor guides live on the counter - just ask.")),
    ]
    trs = "".join("<tr>{}{}</tr>".format(a, b) for a, b in rows)
    return ("<h2>The tool store has your back</h2>"
            "<table style=\"width:100%;border-collapse:separate;"
            "border-spacing:6px\">" + trs + "</table>"
            "<div style=\"font-size:9.5pt;color:#33393F;margin-top:6px\">"
            "We are here to help - <b>reach out if you require "
            "anything</b>. Your Coates tool store team. "
            "<span style=\"color:#8B9099;font-weight:700;"
            "letter-spacing:1px\">MY GEAR HQ &middot; POWERED BY SITEIQ"
            "</span></div>")


def badges_text(item=None, desc=None, on=None, sep=" | "):
    """Plain text for Excel cells and anywhere HTML won't render."""
    f = flags(item, desc)
    out = []
    if f["electrical"] or f["rigging"]:
        t = tag_text(on)
        if SHOW_DISCIPLINE:
            t += " · " + " + ".join(disciplines(f, item))
        out.append(t)
    if f["logbook"]:
        out.append(TXT_LOGBOOK)
    if f["ret"]:
        out.append(f["ret"])
    return sep.join(out)


def badges_plain(item=None, desc=None, on=None):
    """Short codes for a narrow Excel column: BLUE TAG (ELECTRICAL) etc."""
    f = flags(item, desc)
    out = []
    for d in disciplines(f, item):
        name, _ = tag_colour(on)
        out.append("{} TAG ({})".format(name or "TAG CHECK", d))
    if f["logbook"]:
        out.append("LOGBOOK")
    if f["ret"]:
        out.append("RETURN DAILY")
    return ", ".join(out)


# ---------------------------------------------------------------------
#  4. COUNTS - so a report can open with the exposure
# ---------------------------------------------------------------------
def summarise(rows, item_key="asset", desc_key="description"):
    """Count what's on hire against each obligation. `rows` is any list of
    dicts carrying an asset number and/or a description."""
    n = {"electrical": 0, "rigging": 0, "logbook": 0, "ret": 0, "any": 0,
         "total": 0}
    for r in rows or []:
        n["total"] += 1
        f = flags(r.get(item_key), r.get(desc_key))
        hit = False
        for k in ("electrical", "rigging", "logbook"):
            if f[k]:
                n[k] += 1
                hit = True
        if f["ret"]:
            n["ret"] += 1
            hit = True
        if hit:
            n["any"] += 1
    return n


def summary_band_html(counts, on=None):
    """The compliance strip a report opens with - what's out there right
    now that has to be checked, tagged or brought back."""
    if not counts or not counts.get("any"):
        return ""
    name, hexcode = tag_colour(on)
    tagname = name or "TAG CHECK"
    cells = []

    def cell(v, label, colour):
        return (
            "<td style=\"padding:8px 14px;border-left:3px solid {c};"
            "background:#171B22\">"
            "<div style=\"font-size:17pt;font-weight:800;color:{c};"
            "line-height:1.1\">{v}</div>"
            "<div style=\"font-size:7.5pt;color:#A9B1BD;letter-spacing:1px;"
            "text-transform:uppercase;margin-top:2px\">{l}</div></td>"
        ).format(c=colour, v=v, l=label)

    if counts.get("electrical"):
        cells.append(cell(counts["electrical"],
                          "Electrical &middot; {} tag".format(tagname),
                          hexcode or TAG_UNKNOWN_HEX))
    if counts.get("rigging"):
        cells.append(cell(counts["rigging"],
                          "Rigging &middot; {} tag".format(tagname),
                          hexcode or TAG_UNKNOWN_HEX))
    if counts.get("logbook"):
        cells.append(cell(counts["logbook"], "Pre-start &amp; logbook",
                          COL_LOGBOOK))
    if counts.get("ret"):
        cells.append(cell(counts["ret"], "Back daily", COL_RETURN))
    cells.append(cell(counts.get("any", 0), "Lines with a check", "#8B9099"))

    return (
        "<div style=\"margin:10px 0 4px\">"
        "<div style=\"font-size:8pt;letter-spacing:2px;color:#F26222;"
        "font-weight:800;text-transform:uppercase;margin-bottom:5px\">"
        "Compliance on hire right now</div>"
        "<table style=\"border-collapse:separate;border-spacing:6px 0;"
        "width:100%\"><tr>{c}</tr></table>"
        "<div style=\"font-size:8pt;color:#8B9099;margin-top:6px\">"
        "Every line below carries its own requirement. Anything showing a "
        "tag colour must be checked before use; anything showing a logbook "
        "or return line must be actioned that shift.</div></div>"
    ).format(c="".join(cells))


def legend_html(on=None):
    """A short 'what these mean' note for the foot of a report. In the
    compact executive layout the KEY strip at the top of every page
    already carries the meanings, so this collapses to that same slim
    line instead of three sentences of chips."""
    if COMPACT:
        return key_strip_html(on)
    name, hexcode = tag_colour(on)
    return (
        "<div style=\"font-size:8pt;color:#A9B1BD;margin-top:8px;"
        "line-height:1.7\">"
        "{tagchip} Applicable electrical and rigging equipment must carry a "
        "current <b style=\"color:{th}\">{tn}</b> inspection tag with legible "
        "dates. No tag, unclear date or visible damage means do not use it "
        "and tell the Coates tool store.<br>"
        "{logchip} Authorised operator completes the pre-start and the "
        "logbook entry before operating, every shift. No completed entry "
        "means no operation.<br>"
        "{retchip} Item is due back at the Coates tool store on the day "
        "shown so it can be tested, charged and checked before it goes out "
        "again.</div>"
    ).format(
        tagchip=_chip(tag_text(on), tag_hex(on), "dark", GLYPH_TAG),
        logchip=_chip(TXT_LOGBOOK, COL_LOGBOOK, "dark", GLYPH_LOGBOOK),
        retchip=_chip("RETURN REQUIREMENT", COL_RETURN, "dark", GLYPH_RETURN),
        th=hexcode or TAG_UNKNOWN_HEX, tn=name or "CURRENT")


# ---------------------------------------------------------------------
#  5. COMPLIANCE STRIPS - the blue and orange bands on the hirer page
# ---------------------------------------------------------------------
def strip_html(label, count, colour, bits, glyph=""):
    """One full-width compliance band. Facts only - a count and what the
    fact is - never a confirmed/not-confirmed split we cannot evidence."""
    if not count:
        return ""
    parts = "".join(
        "<span style=\"margin-left:14px;opacity:.93;white-space:nowrap\">"
        "&bull;&nbsp;&nbsp;{}"
        "</span>".format(_esc(b)) for b in bits)
    #  Dark ink on the amber band - white-on-amber was a squint on every
    #  page it appeared. (26 Jul 2026)
    ink = "#14181F" if str(colour).upper() in ("#F2B01E", "#FAB219") else "#fff"
    return (
        "<div style=\"background:{c};color:{i};border-radius:8px;"
        "padding:7px 14px;margin:6px 0;font-size:8.5pt;font-weight:800;"
        "letter-spacing:.4px;text-transform:uppercase\">"
        "{g}{l}{p}</div>"
    ).format(c=colour, i=ink, g=(glyph + "&nbsp;&nbsp;") if glyph else "",
             l=_esc(label), p=parts)


def rigging_strip(n, on=None):
    """RIGGING COMPLIANCE - blue. States the fleet test, because there was
    one: every rigging item was tested at the start of July."""
    name, hexcode = tag_colour(on)
    bits = ["{} ITEM{}".format(n, "" if n == 1 else "S"),
            "{} TAG CURRENT".format(name or "TAG CHECK")]
    if FLEET_TESTED:
        bits += [FLEET_TESTED_TEXT.upper()]
    else:
        bits += ["VERIFY BEFORE USE"]
    return strip_html("Rigging", n, hexcode or TAG_UNKNOWN_HEX,
                      bits, GLYPH_TAG)


def electrical_strip(n, on=None):
    """ELECTRICAL COMPLIANCE - same blue tag, same July test."""
    name, hexcode = tag_colour(on)
    bits = ["{} ITEM{}".format(n, "" if n == 1 else "S"),
            "{} TAG CURRENT".format(name or "TAG CHECK")]
    if FLEET_TESTED:
        bits += [FLEET_TESTED_TEXT.upper()]
    else:
        bits += ["VERIFY BEFORE USE"]
    return strip_html("Electrical", n,
                      hexcode or TAG_UNKNOWN_HEX, bits, GLYPH_TAG)


def logbook_strip(n):
    """PLANT & LOGBOOKS - orange. States the requirement and the count.
    Deliberately NOT a confirmed/not-confirmed split: nothing in SiteIQ
    captures a pre-start, the log book is a paper book on the machine, and
    calling an entry "not completed" without evidence would be wrong."""
    return strip_html(
        "Plant & logbooks", n, COL_LOGBOOK,
        ["{} ITEM{}".format(n, "" if n == 1 else "S"),
         "DAILY PRE-START AND LOGBOOK ENTRY REQUIRED"], GLYPH_LOGBOOK)


def return_strip(n):
    """BACK DAILY - amber. Gas, radios and battery gear due back today."""
    return strip_html(
        "Due back today", n, COL_RETURN,
        ["{} ITEM{}".format(n, "" if n == 1 else "S"),
         "GAS, RADIOS AND BATTERY GEAR",
         "BACK TO THE TOOL STORE"], GLYPH_RETURN)


# ---------------------------------------------------------------------
#  6. PLANT ID - the orange number on the machine
# ---------------------------------------------------------------------
#  Coates allocates a short Plant ID to the machines the crews actually
#  talk about ("bring number 41 back"). It lives in the master file's
#  PLANT_ID column, and wherever an asset number is shown, the Plant ID
#  goes beside it in orange so it is impossible to miss on a page, on a
#  phone or across a noisy tool store counter. Blank column = no pill.
#  (A. Fisher, 25 Jul 2026)
PLANT_ID_HEX = "#F26222"


def plant_id(item):
    """The allocated Plant ID for an asset, or '' when it has none."""
    if not item or not _MASTER:
        return ""
    try:
        return _MASTER.plant_id(item) or ""
    except Exception:
        return ""


def plant_id_pill(item, size="9pt"):
    """Just the orange pill - '' when the asset has no Plant ID."""
    pid = plant_id(item)
    if not pid:
        return ""
    return ("<span style=\"display:inline-block;background:{o};color:#fff;"
            "border-radius:9px;padding:1px 8px;margin-left:5px;"
            "font-weight:800;font-size:{s};white-space:nowrap;"
            "letter-spacing:.3px\">ID {p}</span>").format(
        o=PLANT_ID_HEX, s=size, p=_esc(pid))


def asset_html(item, size="9pt", dash="-"):
    """Asset number with its Plant ID beside it. The standard way to show
    an asset anywhere in the suite."""
    a = str(item or "").strip()
    if not a:
        return dash
    pill = plant_id_pill(item, size)
    if not pill:
        return _esc(a)
    return "<span style=\"white-space:nowrap\">{a}{p}</span>".format(
        a=_esc(a), p=pill)
