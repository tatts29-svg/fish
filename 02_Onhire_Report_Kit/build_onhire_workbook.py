#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | ON-HIRE WORKBOOK - every tab, built from today's exports
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  The shutdown on-hire workbook, rebuilt from the SiteIQ exports for
#  whichever job this computer is running (57_SWITCH_JOB.bat).
#
#  Fifteen tabs while a shut is ahead or under way (fourteen after demob),
#  and every one of them works:
#
#    Dashboard                the position as live charts and gauges
#
#    Cover                    what this is, what fed it, the headlines
#    Company Summary          per company: tooling, consumables, total
#    Detailed Onhire          every item out right now, who has it
#    Tooling Transactions     every tooling issue and return
#    Tooling Utilisation      per item type: turns, rating, what to do
#    Coates Tooling           the Coates-owned fleet on site
#    Consumable Transactions  every consumable issued
#    Consumables Available    what's left on the shelf
#    Coates Stock             the fleet with its on-hire dates
#    Consumable Utilisation   per line: usage, rating, what to do
#    Coates Labour            the shift roster - CARRIED OVER, not touched
#    Cost Breakdown           the day-by-day cost - CARRIED OVER, not touched
#
#  Two of those tabs are Andrew's own typing - the labour roster and
#  the cost breakdown. They are read out of the existing workbook and
#  written back exactly as they were, formulas and all. Nothing typed
#  by hand is ever recalculated, overwritten or "tidied".
#
#  The existing workbook is never written to. It carries macros, a
#  logo and live query connections that Python cannot round-trip
#  safely, so it stays exactly as it is and a clean dated workbook is
#  built alongside it.
#
#  It also writes the report as an EMAIL - the whole thing in the body,
#  Coates styling, the workbook on the paperclip, and NO COSTS. Not the
#  labour, not the cost breakdown, not a rate anywhere. That is the
#  operational picture: what is out, who has it, what is working and
#  what is not. The money stays in the workbook. It opens as an Outlook
#  DRAFT and waits - nothing sends by itself.
#
#  It also writes the COMPANY PACK - a PDF with a cover, a contents
#  page that links to each section, and one section per company: their
#  people, their gear, the day each item was issued. Built by
#  coates_pdf.py, which travels in the kit, so it needs nothing
#  installed. One PDF per company lands in By_Company\ as well, for
#  forwarding a company its own page. The pack goes on the paperclip
#  next to the workbook.
#
#  DATES: every on-hire item is dated from the START of its open issue
#  transaction, never from the stock record's ON_HIRE_DATE. An item with
#  no open transaction inside the TRANSACTIONS export window is shown as
#  UNDATED and said so - pull TRANSACTIONS from the start of the shut
#  and every item dates.
#
#  Output:  <job reports>\<today>\<Job> On-Hire Workbook - <date>.xlsx
#      and  <job folder>\<Job>_Onhire_Workbook_LATEST.xlsx
#      and  <job reports>\<today>\<Job> On-Hire Report by Company - <date>.pdf
#      and  <job reports>\<today>\By_Company\<Company> - On-Hire - <date>.pdf
#      and  <job reports>\<today>\<Job> On-Hire Report - <date>.eml
# =====================================================================

import datetime as dt
import glob
import os
import shutil
import sys
from copy import copy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

#  The Excel library travels WITH the kit, in _lib. Nothing to install,
#  no internet, no pip, no admin rights, no company proxy to argue with.
#  That is the whole reason this folder runs on a laptop it has never
#  been on before: put _lib in front of everything else on the path and
#  openpyxl is simply there.
_LIB = os.path.join(HERE, "_lib")
if os.path.isdir(_LIB) and _LIB not in sys.path:
    sys.path.insert(0, _LIB)


#  A Windows console is often still on an old code page, and printing one
#  fancy character to it (the dot between Rio Tinto and Weipa, a dash, a
#  curly quote) kills the whole run with UnicodeEncodeError - a wall of
#  red text, no report, and nothing that tells you why. Two guards:
#  ask the console for UTF-8, and if it won't have it, fall back to
#  plain ASCII rather than falling over.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

_ASCII = {"·": "-", "–": "-", "—": "-", "’": "'",
          "‘": "'", "“": '"', "”": '"', "…": "...",
          "°": " deg", "×": "x", "→": "->", " ": " "}


#  Everything said on screen is kept, and written out at the end as
#  LAST_RUN_LOG.txt. A black window that has been closed is gone; a file
#  can be emailed. "Send me the log" beats "what did it say exactly?".
_LOG = []


def say(text=""):
    """print() that cannot take the run down. Anything the console
    can't draw gets swapped for the plain-keyboard version."""
    _LOG.append(text)
    try:
        print(text)
    except (UnicodeEncodeError, UnicodeError):
        flat = text
        for fancy, plain in _ASCII.items():
            flat = flat.replace(fancy, plain)
        print(flat.encode("ascii", "replace").decode("ascii"))


def write_log():
    """Best effort, always. If we can't write it, that is not worth
    failing a good report over."""
    try:
        with open(os.path.join(HERE, "LAST_RUN_LOG.txt"), "w",
                  encoding="utf-8") as f:
            f.write("COATES | ON-HIRE REPORT - what the last run said\n")
            f.write("Run at {}\n".format(
                dt.datetime.now().strftime("%d %b %Y %H:%M")))
            f.write("Folder: {}\n".format(HERE))
            f.write("Python: {} at {}\n".format(
                ".".join(str(n) for n in sys.version_info[:3]),
                sys.executable))
            f.write("-" * 66 + "\n")
            f.write("\n".join(_LOG) + "\n")
    except OSError:
        pass

#  This script runs in two homes and must work in both:
#
#    1. inside the full suite, where site_config knows which job the
#       computer is on and report_paths knows where reports go, and
#    2. on its own, in a folder with nothing but this file, the button
#       and the exports - the kit that goes on the other computers.
#
#  Standing alone it works the job out from the exports themselves.
#  Every SiteIQ export carries the PROJECT SCHEDULE it came from on its
#  REFERENCE_INFO sheet, so the kit names itself off the data and there
#  is nothing to set up. Drop the exports in, press the button, done.
try:
    import report_paths
    import site_config
    STANDALONE = False
except ImportError:
    report_paths = site_config = None
    STANDALONE = True

try:
    import openpyxl
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.utils import get_column_letter
except ImportError:
    say()
    say("=" * 66)
    say(" THE EXCEL LIBRARY IS MISSING FROM THIS FOLDER")
    say("=" * 66)
    say()
    say(" This kit carries its own copy of it, in a folder called _lib.")
    say(" It isn't here, which means the zip was only half unpacked.")
    say()
    say(" Looked in: {}".format(_LIB))
    say()
    say(" FIX, and it is always this: right-click the zip, choose")
    say(" 'Extract All', and work in the folder that comes out. Opening")
    say(" the zip and double-clicking a button INSIDE it only unpacks")
    say(" that one file, so _lib never arrives.")
    say()
    sys.exit(1)

# ---- the Coates look -------------------------------------------------
#  ONE palette for everything the kit makes - the workbook, the email
#  and the PDF company pack - so the three read as one family of
#  documents from the same shop.
#
#  Coates orange and near-black are the brand. The orange is sampled
#  off the official Coates Way artwork (F26222), not guessed. Everything
#  else is a deliberately narrow greyscale, so that when orange turns
#  up it means something - and the only other colours are the ones that
#  carry a meaning: red for "act", amber for "watch", green for "fine".
COATES_ORANGE = "F26222"
COATES_INK = "1D1D1B"          # near-black: title bands, headings
COATES_SLATE = "2A313C"        # charcoal: column-heading rows
COATES_MUTED = "5B6472"        # secondary text
COATES_LINE = "DDE1E7"         # hairlines
COATES_ZEBRA = "F6F7F9"        # every second row
COATES_SOFT = "F3F4F7"         # quiet panels
COATES_TINT = "FFF1EA"         # orange at 8% - a highlight, not a shout
COATES_PAGE = "EEF0F3"         # the grey the email sits on

#  Red / amber / green / slate / orange as (fill, text), the same five
#  meanings wherever a rating or a day-count is coloured.
RAG = {
    "red": ("FBE7E6", "A32015", "D0342C"),
    "amber": ("FDF1DC", "8A5300", "E08A24"),
    "green": ("E8F3E9", "1E6B32", "409A55"),
    "slate": ("E9ECF0", "4A5361", "98A0AA"),
    "orange": ("FFF1EA", "A6410F", "F26222"),
}

#  Ratings and recommendations carry their own colour, so the same
#  word always looks the same in the workbook, the email and the PDF.
TONE = {
    "High Demand": "amber", "Good Use": "green",
    "Low Use": "slate", "No Use": "slate",
    "Increase Stock": "amber", "Monitor / Increase": "amber",
    "Keep Stock": "green", "Review / Reduce": "slate",
}
#  Red is kept for what is overdue or unsafe. Ordering more is work to
#  do, not an alarm, so it reads amber.

#  The two thresholds the whole report turns on. Out longer than
#  LONG_OUT_DAYS wants a phone call; past WATCH_DAYS it goes amber so
#  it is seen coming. CONS_TIGHT is how far down a consumable line can
#  get before it is ordered.
LONG_OUT_DAYS = 21
WATCH_DAYS = 13
CONS_TIGHT = 0.80


def argb(hex6):
    """openpyxl wants AARRGGBB."""
    return "FF" + hex6


def day_tone(days):
    """The colour a day-count carries, everywhere it appears."""
    if days is None:
        return "slate"
    if days >= LONG_OUT_DAYS:
        return "red"
    if days >= WATCH_DAYS:
        return "amber"
    return "slate"


ORANGE = argb(COATES_ORANGE)
NEAR_BLACK = argb(COATES_INK)
SLATE = argb(COATES_SLATE)
WHITE = "FFFFFFFF"
GREY = argb("8B9099")
MUTED = argb(COATES_MUTED)
BAND_ROW_H = 34

TITLE_FONT = Font(name="Calibri", size=14, bold=True, color=WHITE)
HDR_FONT = Font(name="Calibri", size=10, bold=True, color=WHITE)
BODY_FONT = Font(name="Calibri", size=11, color=NEAR_BLACK)
NOTE_FONT = Font(name="Calibri", size=10, italic=True, color=MUTED)
TITLE_FILL = PatternFill("solid", fgColor=NEAR_BLACK)
HDR_FILL = PatternFill("solid", fgColor=SLATE)
THIN = Side(style="thin", color=argb(COATES_LINE))
CELL_BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

#  The orange rule under every title band, drawn as a medium border so
#  the hand-typed tabs - whose rows must not move - get it as well.
RULE = Side(style="medium", color=ORANGE)

#  The heading row is boxed in its own colour so it reads as one solid
#  bar, with the orange rule along the bottom of it.
HDR_SIDE = Side(style="thin", color=SLATE)
HDR_BORDER = Border(left=HDR_SIDE, right=HDR_SIDE, top=HDR_SIDE,
                    bottom=Side(style="medium", color=ORANGE))

#  Every second row gets the faintest cool tint. Enough to follow a long
#  row across thirteen columns, not enough to notice you are being helped.
BAND_FILL = PatternFill("solid", fgColor=argb(COATES_ZEBRA))
TOTAL_FILL = PatternFill("solid", fgColor=argb(COATES_TINT))
TOTAL_FONT = Font(name="Calibri", size=11, bold=True, color=NEAR_BLACK)

DATE_FMT = "dd/mm/yyyy"
TIME_FMT = "hh:mm"
PCT_FMT = "0.0%"
MONEY_FMT = "$#,##0.00"
INT_FMT = "#,##0"

#  What goes in the printed page header and footer of every tab. Filled
#  in by build() once the job and the as-at time are known.
_PRINT = {"job": "", "asat": ""}

#  Hand-typed tabs. Read out of the old workbook, written back as-is.
CARRIED_OVER = ("Coates Labour", "Cost Breakdown")


#  Windows won't have these in a file name, and SiteIQ project names
#  routinely carry a slash or a colon ("31/07/2026 05:00"). Left alone
#  they go straight into the workbook name and the save fails with
#  something nobody can act on.
BAD_IN_NAMES = '\\/:*?"<>|'


class KitProblem(Exception):
    """Something the person at the keyboard can actually fix.

    Raised instead of letting a traceback out. main() catches it, prints
    the message as-is and stops - so every foreseeable failure reads like
    an instruction rather than a crash.
    """


def _safe_name(text, fallback="Shutdown"):
    """A file name Windows will accept, out of whatever the job is
    called. Keeps the words, drops the punctuation that isn't allowed."""
    out = "".join(" " if ch in BAD_IN_NAMES else ch for ch in _s(text))
    out = " ".join(out.split()).strip(" .")
    return out or fallback


def latest_workbook_name(label):
    """The always-newest copy. One place, because the builder writes it
    and carry_over reads it, and if those two ever disagree the typed
    tabs get silently wiped."""
    return "{}_Onhire_Workbook_LATEST.xlsx".format(
        _safe_name(label).replace(" ", "_"))


# =====================================================================
#  Standing on its own - the kit that goes on the other computers
# =====================================================================
class LooseSite(object):
    """The job, worked out from the exports sitting in the folder.

    No config, no setup, nothing to switch. Whatever exports are here
    decide what the workbook is called and who it is for. Drop Weipa's
    in and it is a Weipa workbook; drop Gladstone's in and it is a
    Gladstone one. JOB.txt can override any of the names if the
    SiteIQ project string isn't what you'd put in front of a customer.
    """

    def __init__(self, base):
        self.base = base
        self._d = self._read_job_txt(base)
        if not self._d.get("project_schedule"):
            self._d["project_schedule"] = self._sniff(base)
        stamp = self._d["project_schedule"]
        self._d.setdefault("job", stamp or "Shutdown")
        self._d.setdefault("customer", "")
        self._d.setdefault("location", "")
        self._d.setdefault("short", (self._d.get("customer")
                                     or self._d["job"]).strip())
        self._d.setdefault("author", "Andrew Fisher")

    @staticmethod
    def _read_job_txt(base):
        """Optional. One 'name: value' per line - job, customer,
        location, short. Anything missing is worked out instead."""
        out = {}
        p = os.path.join(base, "JOB.txt")
        try:
            with open(p, "rb") as f:
                raw = f.read()
        except OSError:
            return out
        #  Read as bytes and decode carefully. Notepad saves as ANSI
        #  unless you tell it otherwise, so the moment somebody types a
        #  name with an accent or a fancy dash in it - Boral's "Peppertree
        #  – Marulan", pasted out of an email - a strict UTF-8 read throws
        #  UnicodeDecodeError. That is a ValueError, not an OSError, so it
        #  used to escape and take the whole run down on the first thing
        #  anybody edits. Never again: UTF-8, then Windows ANSI, then give
        #  up gracefully and work the job out from the exports instead.
        text = None
        for codec in ("utf-8-sig", "cp1252", "latin-1"):
            try:
                text = raw.decode(codec)
                break
            except (UnicodeDecodeError, LookupError):
                continue
        if text is None:
            return out
        for line in text.splitlines():
            line = line.strip()
            if not line or line.startswith("#") or ":" not in line:
                continue
            k, v = line.split(":", 1)
            if v.strip():
                out[k.strip().lower().replace(" ", "_")] = v.strip()
        return out

    @staticmethod
    def _sniff(base):
        """The PROJECT SCHEDULE stamped on whichever export is here."""
        for d in (os.path.join(base, "Data_SiteIQ"), base):
            for stem in ("RENTAL_STOCK", "TRANSACTIONS", "SALES_STOCK",
                         "STOCKTAKE"):
                for p in sorted(glob.glob(os.path.join(
                        glob.escape(d), stem + "*.xlsx"))):
                    if os.path.basename(p).startswith("~$"):
                        continue
                    got = read_project_schedule(p)
                    if got:
                        return got
        return ""

    def __getattr__(self, name):
        if name.startswith("_"):
            raise AttributeError(name)
        return self._d.get(name, "")

    @property
    def shutdown_end(self):
        """The demob date from JOB.txt (shutdown_end: 21/07/2026), or None."""
        return _date(self._d.get("shutdown_end") or self._d.get("demob") or "")

    @property
    def fixed_rate(self):
        return "fixed" in (self._d.get("engagement") or "").lower()

    @property
    def tidy_names(self):
        return (self._d.get("tidy_names") or "").strip().lower() in ("yes", "y", "true", "1")

    @property
    def tidy_items(self):
        """Item descriptions shown readable (on unless tidy_items: no)."""
        return (self._d.get("tidy_items") or "yes").strip().lower() not in ("no", "n", "false", "0")

    @property
    def acronyms(self):
        raw = self._d.get("acronyms") or ""
        return {a.strip().upper() for a in raw.replace(";", ",").split(",") if a.strip()}

    @property
    def header_line(self):
        bits = [b for b in (self._d.get("customer"), self._d.get("job"),
                            self._d.get("location")) if b]
        return " · ".join(bits) or "Shutdown tool store"

    @property
    def exports(self):
        return ["RENTAL_STOCK", "SALES_STOCK", "TRANSACTIONS", "STOCKTAKE"]

    @property
    def reports_dirname(self):
        return "Reports"

    def data_dirs(self, base=None):
        base = base or self.base
        return [os.path.join(base, "Data_SiteIQ"), base]

    def workbook(self, base=None):
        """Any .xlsm sitting in the kit - that's where the hand-typed
        Labour and Cost tabs are read from."""
        base = base or self.base
        hits = [p for p in glob.glob(os.path.join(glob.escape(base),
                                                  "*.xlsm"))
                if not os.path.basename(p).startswith("~$")]
        if hits:
            return max(hits, key=os.path.getmtime)
        #  No .xlsm? Then the only place the hand-typed Labour and Cost
        #  tabs can be is the workbook this kit built last time. Read
        #  them back out of it, or today's rebuild wipes anything typed
        #  since yesterday - which is the opposite of what the tab says
        #  on it. (In the full suite Andrew keeps his .xlsm here and this
        #  never comes up; in the standalone kit there isn't one.)
        latest = os.path.join(base, latest_workbook_name(
            self._d.get("short") or self._d.get("customer") or "Shutdown"))
        return latest if os.path.isfile(latest) else None


def read_aliases(base):
    """COMPANY_ALIASES.txt, one 'FROM = TO' per line. SiteIQ spells the
    same outfit three ways (BELTECH / BELTEC, DAWSONS / DAWSONS
    ENGINEERING / DAWSONS RELINERS); this folds them, and only them -
    merging beyond what is written here is Andrew's call, never the
    kit's."""
    out = {}
    p = os.path.join(base, "COMPANY_ALIASES.txt")
    try:
        with open(p, "rb") as f:
            raw = f.read()
    except OSError:
        return out
    text = None
    for codec in ("utf-8-sig", "cp1252", "latin-1"):
        try:
            text = raw.decode(codec)
            break
        except (UnicodeDecodeError, LookupError):
            continue
    for line in (text or "").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        a, b = line.split("=", 1)
        if a.strip() and b.strip():
            out[a.strip().upper()] = b.strip()
    return out


#  Filled in by build() from JOB.txt and COMPANY_ALIASES.txt, then used
#  by co_name() everywhere a company name is read off an export.
_NAMES = {"aliases": {}, "tidy": False, "acronyms": set(), "tidy_items": True, "tags": []}


def co_name(raw):
    """A company name as the report shows it: aliases folded, and - if
    JOB.txt says tidy_names: yes - SHOUTING CAPS made readable, with the
    acronyms JOB.txt lists left alone."""
    name = _s(raw)
    if not name:
        return ""
    name = _NAMES["aliases"].get(name.upper(), name)
    if not _NAMES["tidy"]:
        return name
    words = []
    for w in name.split():
        if w.upper() in _NAMES["acronyms"] or any(ch.isdigit() for ch in w) or "&" in w:
            words.append(w.upper() if w.upper() in _NAMES["acronyms"] else w)
        elif words and w.lower() in ("and", "of", "the", "for", "at", "on"):
            words.append(w.lower())                  # Hussy and Co, not Hussy And Co
        elif w.isupper() or w.islower():
            words.append(w.capitalize())
        else:
            words.append(w)
    return " ".join(words)


#  SiteIQ shorthand worth spelling out in a report. Only the ones that
#  turn up in the exports and read one way; anything else stays as typed.
_ITEM_WORDS = {
    "ABRSVE": "abrasive", "ABRASV": "abrasive", "NONRCHG": "non-rechargeable",
    "DISP": "disposable", "WH": "white", "WHT": "white", "BLK": "black", "NAT": "natural",
    "SZ": "size", "CLR": "clear", "SYN": "synthetic", "PWR": "power", "DRV": "drive",
    "ALK": "alkaline", "GRIND": "grinding", "ASSY": "assembly", "STD": "standard",
    "GALV": "galvanised", "YEL": "yellow", "YLW": "yellow", "BLU": "blue", "GRN": "green",
    "ORG": "orange", "LGE": "large", "LRG": "large", "SML": "small", "MED": "medium",
    "PR": "pair", "PK": "pack", "BTL": "bottle", "CTN": "carton", "RL": "roll",
    "LTR": "litre", "HVY": "heavy", "W/": "with", "W/O": "without", "C/W": "c/w",
    "NON-VEND": "non-vend", "NONVEND": "non-vend", "REUSBL": "reusable", "RECHG": "rechargeable",
}
#  Words that stay in capitals: units people read as capitals, sizes,
#  the usual trade acronyms, and whatever JOB.txt lists.
_ITEM_KEEP = {"PPE", "LED", "UV", "PVC", "HSS", "SDS", "AA", "AAA", "FR", "USB", "AC", "DC",
              "GPO", "RCD", "HV", "LV", "MIG", "TIG", "CO2", "O2", "ID", "OD", "BSP", "NPT",
              "UNC", "UNF", "SAE", "HT", "XL", "XXL", "XXXL", "XS", "S", "M", "L", "HD",
              "SS", "MS", "AL", "QA", "QC", "ISO", "AS", "NZS", "RHS", "SHS", "CHS", "UB",
              "UC", "PFC", "EA", "HEX", "GP", "LP", "HP", "PTO", "AWG", "TPI", "RPM"}


#  How a unit reads after a number: 18V, 310ml, 20L, 6Ah, 2XL.
_UNITS = {"MM": "mm", "CM": "cm", "M": "m", "ML": "ml", "L": "L", "LTR": "L", "KG": "kg",
          "G": "g", "V": "V", "A": "A", "AH": "Ah", "MAH": "mAh", "W": "W", "KW": "kW",
          "WH": "Wh", "HP": "hp", "XS": "XS", "XL": "XL", "XXL": "XXL", "XXXL": "XXXL",
          "PK": "pk", "PC": "pc", "PCS": "pcs", "T": "T", "IN": "in", "FT": "ft",
          "LB": "lb", "PR": "pr", "OZ": "oz", "MPA": "MPa", "KPA": "kPa", "PSI": "psi",
          "BAR": "bar", "NM": "Nm", "RPM": "rpm", "MIN": "min", "HR": "hr", "DEG": "deg"}


def _tidy_word(w, acronyms):
    up = w.upper()
    if up in acronyms or up in _ITEM_KEEP:
        return up
    if up in _ITEM_WORDS:
        return _ITEM_WORDS[up]
    if "-" in w and not w.startswith("-") and not w.endswith("-"):
        chunks = w.split("-")
        if len(chunks) <= 3 and all(chunks) and not any(ch.isdigit() for ch in chunks[0]):
            joined = "-".join(_tidy_word(c, acronyms) for c in chunks)
            return joined.replace("size-", "size ")
    if any(ch.isdigit() for ch in w):
        #  A measurement - 127X1X22MM, 310ML, 18V - reads in lower case
        #  with x between the numbers and its unit cased the usual way;
        #  a code - GFPR200, A24 - stays exactly as typed.
        if w[0].isdigit():
            m = _re.match(r"^([\d.,/]+(?:[xX][\d.,/]+)*)([A-Za-z]+)?$", w)
            if m:
                unit = (m.group(2) or "").upper()
                return m.group(1).replace("X", "x") + _UNITS.get(unit, unit.lower())
            return _re.sub(r"(?<=\d)X(?=\d)", "x", w).lower()
        return w
    return w.lower()


def item_name(raw):
    """An item description the way the report shows it - when JOB.txt
    has not said tidy_items: no - the site tag SiteIQ appends stripped,
    SHOUTING CAPS made readable, measurements, codes and acronyms left
    alone. The transaction and stock tabs keep the raw text."""
    text = _s(raw)
    if not text or not _NAMES.get("tidy_items", True):
        return text
    letters = [c for c in text if c.isalpha()]
    if not letters or sum(1 for c in letters if c.isupper()) / float(len(letters)) < 0.7:
        return text                                  # typed in mixed case - leave it
    for tag in _NAMES.get("tags") or []:
        text = _re.sub(r"\s*\d*" + _re.escape(tag) + r"20\d\d\s*$", "", text)
    text = _re.sub(r"\s+[A-Z]{2,6}20\d\d\s*$", "", text)
    acronyms = _NAMES.get("acronyms") or set()
    parts = [pt.strip() for pt in text.split(",") if pt.strip()]
    out = []
    for part in parts:
        out.append(" ".join(_tidy_word(w, acronyms) for w in part.split()))
    text = ", ".join(out).strip()
    if not text:
        return _s(raw)
    return text[0].upper() + text[1:]


def read_project_schedule(path):
    """The SiteIQ project an export came from, off its REFERENCE_INFO
    sheet. Empty if it doesn't carry one - plenty of older pulls don't."""
    if site_config is not None:
        return site_config.export_project_schedule(path)
    try:
        wb = _open_ro(path)
    except Exception:
        return ""
    try:
        if "REFERENCE_INFO" not in wb.sheetnames:
            return ""
        rows = list(wb["REFERENCE_INFO"].iter_rows(min_row=1, max_row=2,
                                                   values_only=True))
        if len(rows) < 2:
            return ""
        head = [str(c or "").strip().upper() for c in rows[0]]
        if "PROJECT SCHEDULE" not in head:
            return ""
        return str(rows[1][head.index("PROJECT SCHEDULE")] or "").strip()
    except Exception:
        return ""
    finally:
        try:
            _release_ro(wb)
        except Exception:
            pass


def the_site(base):
    """The job, however this copy is running."""
    if site_config is not None:
        return site_config.site(base=base)
    return LooseSite(base)


def find_export(base, pattern, s):
    """Newest file matching the pattern, across the folders this job
    keeps its exports in."""
    if report_paths is not None:
        return report_paths.find_export(base, pattern)
    hits = []
    for d in s.data_dirs(base):
        hits += [p for p in glob.glob(os.path.join(glob.escape(d), pattern))
                 if not os.path.basename(p).startswith("~$")]
    return max(hits, key=os.path.getmtime) if hits else None


def out_dirs(base, when, s):
    if report_paths is not None:
        return report_paths.out_dirs(base, when)
    day = os.path.join(base, s.reports_dirname, when.strftime("%Y-%m-%d"))
    os.makedirs(day, exist_ok=True)
    return {"day": day}


def note_sources(folder, entries):
    if report_paths is not None:
        return report_paths.note_sources(folder, entries)
    lines = ["DATA SOURCES FOR THIS WORKBOOK",
             "Generated " + dt.datetime.now().strftime("%d %b %Y - %H:%M"),
             "-" * 60]
    for p in entries:
        stamp = export_requested(p)
        lines.append("{:<52} pulled {}".format(
            os.path.basename(p), stamp.strftime("%d %b %Y - %H:%M")))
    if _PRINT.get("draws_note"):
        lines += ["", _PRINT["draws_note"] + "."]
    out = os.path.join(folder, "DATA_SOURCES.txt")
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    return out


def wrong_job(path, base, s):
    """(ok, message). Standing alone there is no 'live job' to check
    against, so the test is that the exports AGREE WITH EACH OTHER -
    which catches the real mistake, refreshing off a mix of two jobs."""
    if site_config is not None:
        return site_config.belongs_to_live_job(path, base)
    want = (s.project_schedule or "").strip()
    got = read_project_schedule(path)
    if not want or not got or got.lower() == want.lower():
        return True, ""
    return False, ("{} is a {} export but the others in this folder are {}. "
                   "One job's exports at a time - take the odd one out and "
                   "run it again.".format(os.path.basename(path), got, want))


# =====================================================================
#  Reading the exports
# =====================================================================
_RO_CACHE = {}


def _open_ro(path):
    """A read-only, values-only view of a workbook, parsed once per run.
    The same TRANSACTIONS export is read by a dozen callers; without this
    each one re-parsed the whole file. Closed when the run ends."""
    key = os.path.abspath(path)
    try:
        st = os.stat(key)
        key = (key, st.st_mtime, st.st_size)
    except OSError:
        pass
    wb = _RO_CACHE.get(key)
    if wb is None:
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        _RO_CACHE[key] = wb
    return wb


def _release_ro(wb):
    """Cached workbooks stay open until build() completes."""
    return None


def _close_ro_all():
    for wb in list(_RO_CACHE.values()):
        try:
            wb.close()
        except Exception:
            pass
    _RO_CACHE.clear()


import atexit as _atexit
_atexit.register(_close_ro_all)


def export_requested(path):
    """When SiteIQ produced an export: REQUESTED_DATE/TIME on its
    REFERENCE_INFO sheet, which survives copying. Falls back to the
    file's modification time when the sheet does not carry one."""
    try:
        wb = _open_ro(path)
        if "REFERENCE_INFO" in wb.sheetnames:
            rows = list(wb["REFERENCE_INFO"].iter_rows(min_row=1, max_row=2, values_only=True))
            if len(rows) >= 2:
                head = [str(c or "").strip().upper() for c in rows[0]]
                for i, h in enumerate(head):
                    if h.startswith("REQUESTED_DATE") and i < len(rows[1]):
                        v = rows[1][i]
                        if isinstance(v, dt.datetime):
                            return v
                        for fmt in ("%d/%m/%Y %I:%M %p", "%d/%m/%Y %H:%M", "%d/%m/%Y %I:%M:%S %p",
                                    "%d/%m/%Y %H:%M:%S", "%Y-%m-%d %H:%M:%S", "%d %b %Y %H:%M"):
                            try:
                                return dt.datetime.strptime(str(v).strip(), fmt)
                            except ValueError:
                                pass
    except Exception:
        pass
    return dt.datetime.fromtimestamp(os.path.getmtime(path))


def _rows(path, sheet, must_have=False):
    """A sheet as a list of dicts, keyed on its header row. Blank rows
    dropped - SiteIQ pads its exports out with them.

    must_have says this sheet is the whole point of the file. Without it
    a missing sheet is indistinguishable from an empty one, and the kit
    builds a complete, confident, all-zero report and puts an email draft
    in front of you ready to send to the customer. That is the worst
    thing this script could possibly do, so it stops instead.
    """
    if not path or not os.path.isfile(path):
        return []
    try:
        wb = _open_ro(path)
    except Exception as e:
        #  Half-downloaded from SiteIQ, saved as .xls or CSV with an
        #  .xlsx name, quarantined by antivirus, or a OneDrive placeholder
        #  that has not actually come down yet. All of them look like a
        #  file sitting there in Explorer.
        raise KitProblem(
            "This export can't be opened:\n"
            "         {}\n\n"
            "         {}\n\n"
            "         It is almost always a part-finished download. Pull "
            "it out of\n"
            "         SiteIQ again, save it over the top, and run the "
            "button again.".format(path, e))
    try:
        if sheet not in wb.sheetnames:
            if must_have:
                raise KitProblem(
                    "{} hasn't got a '{}' sheet in it.\n\n"
                    "         The sheets it does have: {}\n\n"
                    "         That usually means it is the wrong export, "
                    "or it was saved\n"
                    "         out of Excel rather than pulled from SiteIQ. "
                    "Pull a fresh\n"
                    "         one and don't open or re-save it on the way "
                    "through.\n\n"
                    "         Stopping here on purpose: with that sheet "
                    "missing the report\n"
                    "         would come out full of zeros and look "
                    "perfectly fine.".format(
                        os.path.basename(path), sheet,
                        ", ".join(wb.sheetnames) or "(none)"))
            return []
        ws = wb[sheet]
        it = ws.iter_rows(values_only=True)
        try:
            head = next(it)
        except StopIteration:
            return []
        hdr = [str(c or "").strip() for c in head]
        out = []
        for r in it:
            if not any(c not in (None, "") for c in r):
                continue
            out.append(dict(zip(hdr, r)))
        return out
    finally:
        try:
            _release_ro(wb)
        except Exception:
            pass


def _s(v):
    """A cell as clean text."""
    return "" if v is None else str(v).strip()


def _n(v):
    """A cell as a number. SiteIQ ships numbers as text more often than
    not, so never trust the type."""
    if v is None or v == "":
        return 0.0
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(str(v).replace(",", "").replace("$", "").strip())
    except ValueError:
        return 0.0


def _date(v):
    """A cell as a date. SiteIQ mixes real dates with dd/mm/yyyy text
    inside the same column."""
    if isinstance(v, dt.datetime):
        return v.date()
    if isinstance(v, dt.date):
        return v
    t = _s(v)
    if not t:
        return None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d/%m/%Y %H:%M:%S",
                "%d/%m/%Y %I:%M %p", "%Y-%m-%d %H:%M:%S"):
        try:
            return dt.datetime.strptime(t, fmt).date()
        except ValueError:
            continue
    return None


# =====================================================================
#  Usage ratings - the rules, written down
# =====================================================================
#  Tooling is rated on TURNS: how many times each unit went out.
#  One item that went out five times is working; five items that went
#  out once each are sitting there. Utilisation on its own can't tell
#  those apart, which is why the old sheet had a line rated "Low Use"
#  on 36 transactions and another rated "Good Use" on one.
def tooling_rating(transactions, total_qty, utilisation):
    turns = (transactions / total_qty) if total_qty else 0.0
    if turns <= 0:
        return "No Use", "Review / Reduce"
    if turns < 1:
        return "Low Use", "Keep Stock"
    if turns < 2:
        if utilisation >= 0.8:
            return "Good Use", "Monitor / Increase"
        return "Good Use", "Keep Stock"
    return "High Demand", "Increase Stock"


#  Consumables are rated on how much of the position has gone out.
def consumable_rating(usage):
    if usage <= 0:
        return "No Use", "Review / Reduce"
    if usage < 0.4:
        return "Low Use", "Keep Stock"
    if usage < 0.8:
        return "Good Use", "Keep Stock"
    return "High Demand", "Increase Stock"


# =====================================================================
#  Sheet writing
# =====================================================================
#  Rich text lets the title band carry COATES in orange and the rest in
#  white inside one cell. openpyxl 3.1 (the copy in _lib) can do it; if
#  an older copy ever ends up in front of it, the band falls back to
#  plain white text and nothing else changes.
try:
    from openpyxl.cell.rich_text import CellRichText, TextBlock
    from openpyxl.cell.text import InlineFont
    _RICH = True
except Exception:
    _RICH = False


def band(ws, title, ncols):
    """The title strip across the top of every tab: COATES in orange on
    near-black, the job and report name in white, POWERED BY SITEIQ on
    the end, and an orange rule along the bottom."""
    ncols = max(ncols, 1)
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=ncols)
    c = ws.cell(row=1, column=1)
    if _RICH:
        try:
            c.value = CellRichText(
                TextBlock(InlineFont(rFont="Calibri", sz=15, b=True,
                                     color=ORANGE), "COATES"),
                TextBlock(InlineFont(rFont="Calibri", sz=11, b=False,
                                     color=argb("6B7280")), "    |    "),
                TextBlock(InlineFont(rFont="Calibri", sz=12, b=True,
                                     color=WHITE), title),
                TextBlock(InlineFont(rFont="Calibri", sz=9, b=True,
                                     color=argb("9AA2AC")),
                          "          POWERED BY "),
                TextBlock(InlineFont(rFont="Calibri", sz=9, b=True,
                                     color=ORANGE), "SITEIQ"),
            )
        except Exception:
            c.value = "COATES    |    {}          POWERED BY SITEIQ".format(title)
    else:
        c.value = "COATES    |    {}          POWERED BY SITEIQ".format(title)
    c.font = TITLE_FONT
    c.alignment = Alignment(vertical="center", indent=1)
    for i in range(1, ncols + 1):
        cell = ws.cell(row=1, column=i)
        cell.fill = TITLE_FILL
        cell.border = Border(bottom=RULE)
    ws.row_dimensions[1].height = BAND_ROW_H


def _dxf(fill_hex, text_hex):
    """A conditional-format style: tinted cell, bold coloured text."""
    return dict(fill=PatternFill(start_color=argb(fill_hex),
                                 end_color=argb(fill_hex), fill_type="solid"),
                font=Font(color=argb(text_hex), bold=True))


def decorate(ws, rng, kind):
    """Colour a column by what is in it, with Excel's own conditional
    formatting - so the colour follows the value if anybody sorts,
    filters or retypes a cell. kind is one of:

        rating     High Demand / Good Use / Low Use / No Use
        recommend  Increase Stock / Monitor / Keep Stock / Review
        status     On Hire gets the orange tint
        days       red past LONG_OUT_DAYS, amber past WATCH_DAYS
        bar        an orange data bar for a 0-100% column
    """
    from openpyxl.formatting.rule import CellIsRule, DataBarRule
    if kind in ("rating", "recommend"):
        words = (["High Demand", "Good Use", "Low Use", "No Use"]
                 if kind == "rating" else
                 ["Increase Stock", "Monitor / Increase", "Keep Stock",
                  "Review / Reduce"])
        for w in words:
            fill, text, _bar = RAG[TONE[w]]
            ws.conditional_formatting.add(
                rng, CellIsRule(operator="equal",
                                formula=['"{}"'.format(w)],
                                **_dxf(fill, text)))
    elif kind == "status":
        fill, text, _bar = RAG["orange"]
        ws.conditional_formatting.add(
            rng, CellIsRule(operator="equal", formula=['"On Hire"'],
                            **_dxf(fill, text)))
    elif kind == "days":
        fill, text, _bar = RAG["red"]
        ws.conditional_formatting.add(
            rng, CellIsRule(operator="greaterThanOrEqual",
                            formula=[str(LONG_OUT_DAYS)], **_dxf(fill, text)))
        fill, text, _bar = RAG["amber"]
        ws.conditional_formatting.add(
            rng, CellIsRule(operator="greaterThanOrEqual",
                            formula=[str(WATCH_DAYS)], **_dxf(fill, text)))
    elif kind == "bar":
        ws.conditional_formatting.add(
            rng, DataBarRule(start_type="num", start_value=0,
                             end_type="num", end_value=1,
                             color=COATES_ORANGE, showValue=True))


def sheet(wb, name, title, columns, rows, widths=None, formats=None,
          rules=None, emphasis=None):
    """One data tab, boxed up properly: title band with the orange rule,
    a charcoal heading row, the rows, frozen panes, a filter, colour on
    the columns that carry a judgement, and print settings that put it
    on a page the right way round.

    `formats` maps column index (0-based) to a number format, and is
    also what decides which columns get right-aligned - a number that
    reads as a number belongs on the right.

    `rules` maps column index to a decorate() kind.

    `emphasis` is a function of a row that says whether it is a total -
    those rows go bold on the orange tint so the eye lands on them.
    """
    ws = wb.create_sheet(name)
    band(ws, title, len(columns))

    for i, col in enumerate(columns, start=1):
        c = ws.cell(row=2, column=i, value=col)
        c.font = HDR_FONT
        c.fill = HDR_FILL
        c.border = HDR_BORDER
        c.alignment = Alignment(vertical="center", horizontal="center",
                                wrap_text=True)
    ws.row_dimensions[2].height = 34

    fmts = formats or {}
    right = {i for i, f in fmts.items()
             if f in (INT_FMT, MONEY_FMT, PCT_FMT, "#,##0.00")}
    middle = {i for i, f in fmts.items() if f in (DATE_FMT, TIME_FMT)}

    for r, row in enumerate(rows, start=3):
        total = bool(emphasis and emphasis(row))
        stripe = BAND_FILL if (r % 2) else None
        for i, v in enumerate(row, start=1):
            c = ws.cell(row=r, column=i, value=v)
            c.font = TOTAL_FONT if total else BODY_FONT
            c.border = CELL_BORDER
            if total:
                c.fill = TOTAL_FILL
            elif stripe is not None:
                c.fill = stripe
            if (i - 1) in right:
                c.alignment = Alignment(horizontal="right",
                                        vertical="center")
            elif (i - 1) in middle:
                c.alignment = Alignment(horizontal="center",
                                        vertical="center")
            else:
                c.alignment = Alignment(vertical="center", wrap_text=False)
            fmt = fmts.get(i - 1)
            if fmt:
                c.number_format = fmt

    for i, col in enumerate(columns, start=1):
        letter = get_column_letter(i)
        if widths and (i - 1) in widths:
            ws.column_dimensions[letter].width = widths[i - 1]
        else:
            longest = max([len(str(col))]
                          + [len(_s(r[i - 1])) for r in rows[:400]] or [10])
            ws.column_dimensions[letter].width = min(max(longest + 2, 11), 60)

    ws.freeze_panes = "A3"
    if rows:
        ws.auto_filter.ref = "A2:{}{}".format(
            get_column_letter(len(columns)), len(rows) + 2)
        for i, kind in (rules or {}).items():
            letter = get_column_letter(i + 1)
            decorate(ws, "{0}3:{0}{1}".format(letter, len(rows) + 2), kind)
    else:
        #  An empty tab still says so out loud rather than looking broken.
        c = ws.cell(row=3, column=1,
                    value="Nothing to show for this pull - no rows in the "
                          "export matched this tab.")
        c.font = NOTE_FONT

    tidy_print(ws, len(columns), name=name)
    ws.sheet_properties.tabColor = NEAR_BLACK
    return ws


def tidy_print(ws, ncols, landscape=True, name=""):
    """Make a tab print like a report instead of like a spreadsheet
    somebody hit Ctrl+P on. Sideways, squeezed to one page wide, the
    title band and the headings repeated at the top of every page, the
    job and the as-at time in the page header, the page number and the
    branding down the bottom."""
    ws.page_setup.orientation = ("landscape" if landscape else "portrait")
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.print_title_rows = "1:2"
    ws.print_options.horizontalCentered = True
    ws.page_margins.left = ws.page_margins.right = 0.3
    ws.page_margins.top = ws.page_margins.bottom = 0.55
    ws.page_margins.header = ws.page_margins.footer = 0.25

    ws.oddHeader.left.text = "&\"Calibri,Bold\"COATES&\"Calibri\"  |  {}".format(
        name or "On-Hire Report")
    ws.oddHeader.left.size = 8
    ws.oddHeader.left.color = "5B6472"
    if _PRINT["job"]:
        ws.oddHeader.right.text = "{}  |  As at {}".format(_PRINT["job"],
                                                           _PRINT["asat"])
        ws.oddHeader.right.size = 8
        ws.oddHeader.right.color = "5B6472"
    ws.oddFooter.left.text = "POWERED BY SITEIQ  |  Author: Andrew Fisher"
    ws.oddFooter.left.size = 8
    ws.oddFooter.left.color = "5B6472"
    ws.oddFooter.center.text = "Tool store record, not a live feed"
    ws.oddFooter.center.size = 8
    ws.oddFooter.center.color = "9AA2AC"
    ws.oddFooter.right.text = "Page &P of &N"
    ws.oddFooter.right.size = 8
    ws.oddFooter.right.color = "5B6472"


def transactions_period(path):
    """The window the TRANSACTIONS export covers, off its REFERENCE_INFO
    sheet, as words: '31 Oct 2026 05:00 to 05 Nov 2026 04:59'. Empty if
    the export doesn't say."""
    try:
        wb = _open_ro(path)
    except Exception:
        return ""
    try:
        if "REFERENCE_INFO" not in wb.sheetnames:
            return ""
        rows = list(wb["REFERENCE_INFO"].iter_rows(min_row=1, max_row=2,
                                                   values_only=True))
        if len(rows) < 2:
            return ""
        head = [str(c or "").strip().upper() for c in rows[0]]
        if "REPORT_PERIOD" not in head:
            return ""
        raw = str(rows[1][head.index("REPORT_PERIOD")] or "").strip()
    except Exception:
        return ""
    finally:
        try:
            _release_ro(wb)
        except Exception:
            pass
    if not raw:
        return ""
    parts = [p.strip() for p in raw.split(" - ")]
    if len(parts) == 2:
        out = []
        for p in parts:
            for fmt in ("%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M", "%d/%m/%Y"):
                try:
                    out.append(dt.datetime.strptime(p, fmt).strftime("%d %b %Y %H:%M"))
                    break
                except ValueError:
                    continue
        if len(out) == 2:
            return "{} to {}".format(out[0], out[1])
    return raw


def transactions_window(path):
    """The TRANSACTIONS export's window as (first day, last day), or
    None if the export doesn't say."""
    text = transactions_period(path)
    try:
        a, b = text.split(" to ")
        return (dt.datetime.strptime(a.strip(), "%d %b %Y %H:%M").date(),
                dt.datetime.strptime(b.strip(), "%d %b %Y %H:%M").date())
    except Exception:
        return None



def transactions_datetime_window(path):
    """Exact inclusive export bounds, including the shift's start/end time."""
    try:
        wb = _open_ro(path)
        rows = list(wb["REFERENCE_INFO"].iter_rows(max_row=2, values_only=True))
        headers = [str(v or "").strip().upper() for v in rows[0]]
        raw = str(rows[1][headers.index("REPORT_PERIOD")] or "").strip()
        values = raw.split(" - ")
        if len(values) != 2:
            return None
        bounds = []
        for i, value in enumerate(values):
            for fmt in ("%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M", "%d/%m/%Y"):
                try:
                    stamp = dt.datetime.strptime(value.strip(), fmt)
                    if fmt == "%d/%m/%Y" and i == 1:
                        stamp = dt.datetime.combine(stamp.date(), dt.time.max)
                    bounds.append(stamp)
                    break
                except ValueError:
                    pass
        return tuple(bounds) if len(bounds) == 2 and bounds[0] <= bounds[1] else None
    except (KeyError, IndexError, ValueError, TypeError):
        return None


def sale_in_window(row, bounds):
    """Only count sales demonstrably inside the window; keep all rows for audit."""
    if bounds is None:
        return True
    day = _date(row.get("SALES_DATE"))
    if day is None:
        return False
    raw = row.get("SALES_TIME")
    clock = raw.time() if isinstance(raw, dt.datetime) else raw if isinstance(raw, dt.time) else None
    if clock is None:
        for fmt in ("%H:%M:%S", "%H:%M", "%I:%M:%S %p", "%I:%M %p"):
            try:
                clock = dt.datetime.strptime(_s(raw), fmt).time()
                break
            except ValueError:
                pass
    if clock is None:
        # A missing time is safe only when the complete day is covered.
        return (bounds[0] <= dt.datetime.combine(day, dt.time.min)
                and dt.datetime.combine(day, dt.time.max) <= bounds[1])
    return bounds[0] <= dt.datetime.combine(day, clock) <= bounds[1]


def company_file_labels(blocks):
    """Distinct, deterministic Windows filenames for independently named companies."""
    import hashlib
    labels = {}
    groups = {}
    for block in blocks:
        name = block["company"]
        label = _safe_name(name, "Company")[:100].rstrip(" .")
        labels[name] = label
        groups.setdefault(label.casefold(), []).append(name)
    used = set()
    for name in sorted(labels):
        label = labels[name]
        if len(groups[label.casefold()]) > 1 or label.casefold() in used:
            label += " - " + hashlib.sha256(name.encode("utf-8")).hexdigest()[:12]
        # Also cover an existing company name that already resembles the suffix.
        while label.casefold() in used:
            label += "_"
        labels[name] = label
        used.add(label.casefold())
    return labels


def days_out(when, since):
    """Days an item has been out, never negative: an issue stamped later
    today than the report date is 'today', not '-1 days'."""
    if not since:
        return None
    return max(0, (when - since).days)


def n_companies_out(det):
    return len({_s(r[0]) for r in det if _s(r[0])})


def _who(name):
    """A hirer's name flattened for matching. RENTAL_STOCK writes
    'Benjamin - Casey'; TRANSACTIONS writes 'Benjamin Casey'."""
    return " ".join(_s(name).replace("-", " ").split()).upper()


# =====================================================================
#  The tabs
# =====================================================================
def build(base=HERE, when=None):
    """Build once and release export handles on success, failure or exception."""
    _close_ro_all()
    try:
        return _build(base, when)
    finally:
        _close_ro_all()


def _build(base=HERE, when=None):
    s = the_site(base)
    when = when or dt.date.today()
    asat = dt.datetime.now()

    def export(stem):
        return find_export(base, stem + "*.xlsx", s)

    p_rental = export("RENTAL_STOCK")
    p_sales = export("SALES_STOCK")
    p_trans = export("TRANSACTIONS")
    p_stock = export("STOCKTAKE")
    sources = [p for p in (p_rental, p_sales, p_trans, p_stock) if p]

    missing = [n for n, p in (("RENTAL_STOCK", p_rental),
                              ("SALES_STOCK", p_sales),
                              ("TRANSACTIONS", p_trans)) if not p]
    if missing:
        say("  STOP | These exports are not in {}:".format(
            os.path.relpath(s.data_dirs(base)[0], base)))
        for m in missing:
            say("       - " + m)
        say("       Pull them out of SiteIQ, save them there, run again.")
        return 1

    #  Right files, right job?
    for p in sources:
        ok, why = wrong_job(p, base, s)
        if not ok:
            say("  STOP | " + why)
            return 1

    #  How this job wants its names: aliases folded, caps tidied.
    _NAMES["aliases"] = read_aliases(base)
    _NAMES["tidy"] = s.tidy_names
    _NAMES["acronyms"] = s.acronyms
    _NAMES["tidy_items"] = s.tidy_items
    _NAMES["tags"] = sorted({t.upper() for t in [s.short or ""] + (s.customer or "").split()
                             + list(s.acronyms) if t and t.isalpha() and 2 <= len(t) <= 6})
    if _NAMES["aliases"]:
        say("  Names     {} alias{} applied from COMPANY_ALIASES.txt".format(
            len(_NAMES["aliases"]), "" if len(_NAMES["aliases"]) == 1 else "es"))

    rental = _rows(p_rental, "RENTAL_STOCK", must_have=True)
    sales = _rows(p_sales, "SALES_STOCK", must_have=True)
    stocktake = _rows(p_stock, "STOCKTAKE") if p_stock else []
    period = transactions_period(p_trans)
    for r in rental:
        r["COMPANY_NAME"] = co_name(r.get("COMPANY_NAME"))
    for r in sales:
        r["COMPANY_NAME"] = co_name(r.get("COMPANY_NAME"))

    #  SiteIQ splits transactions across two sheets and which one a job
    #  fills depends on whether charging is switched on. Weipa's land in
    #  TRANSACTION_WITHOUT_CHARGES, K2's in TRANSACTION_CHARGES. Read
    #  both and de-duplicate on the transaction number, so the tabs fill
    #  either way instead of coming out empty on one job.
    tw = []
    seen = set()
    for sheet_name in ("TRANSACTION_CHARGES", "TRANSACTION_WITHOUT_CHARGES"):
        for r in _rows(p_trans, sheet_name):
            tid = _s(r.get("TRANSACTION_ID"))
            #  The same line on both sheets is one movement. Several lines
            #  under one transaction number (a crew member taking three
            #  tools in one go) are three movements, so the key is the
            #  whole line, not the number alone.
            key = (tid, _s(r.get("SKU/ITEM_NUMBER") or r.get("ITEM_NUMBER")),
                   _s(r.get("LATEST_BARCODE") or r.get("BARCODE")),
                   _s(r.get("SKU/ITEM DESCRIPTION")), _s(r.get("TRAN_START_DATE")),
                   _s(r.get("TRAN_START_TIME")), _s(r.get("QUANTITY")))
            if tid and key in seen:
                continue
            if tid:
                seen.add(key)
            r["EMPLOYER_NAME"] = co_name(r.get("EMPLOYER_NAME"))
            tw.append(r)

    #  Customer- and contractor-OWNED gear that went through the Coates
    #  counter - logged, scanned and tracked exactly like the fleet, but
    #  never counted as a Coates movement. Its own value story.
    own = []
    for r in _rows(p_trans, "CUSTOMER_CONTRACTOR_EQUIP"):
        # SiteIQ repeats consumable sales on this sheet. They are already
        # counted from SALES_STOCK and are not customer-owned rental gear.
        if _s(r.get("PRODUCT_CATEGORY")).lower() == "consumable":
            continue
        r["EMPLOYER_NAME"] = co_name(r.get("EMPLOYER_NAME"))
        own.append(r)

    #  Neither transaction sheet had anything in it. Either the export is
    #  the wrong one, or it was pulled for a date range with no movements.
    #  Either way, every transaction-driven tab and half the email would
    #  come out empty, so say so rather than send a hollow report.
    if not tw:
        raise KitProblem(
            "There are no transactions in {}.\n\n"
            "         Looked on both sheets SiteIQ uses - "
            "TRANSACTION_CHARGES and\n"
            "         TRANSACTION_WITHOUT_CHARGES - and both came back "
            "empty.\n\n"
            "         Usually the export was pulled for the wrong date "
            "range. Pull\n"
            "         it again covering the shutdown, save it over the "
            "top, and run\n"
            "         the button again.".format(os.path.basename(p_trans)))

    #  ---- the date an item went out: the TRANSACTION wins -------------
    #  RENTAL_STOCK carries an ON_HIRE_DATE, and for most items it
    #  matches the open issue transaction to the day. Where it doesn't -
    #  a stock record still showing August for gear that went out on
    #  Monday - it puts "92 days" in front of a customer and makes the
    #  whole report look wrong. The issue transaction is what actually
    #  happened, so every on-hire item is dated from the start of its
    #  open transaction. All three transaction sheets are read for this,
    #  including customer-owned gear moved without charge (the DropMat
    #  kits), so every open issue is found. An item with no open
    #  transaction inside the export window is shown as UNDATED and said
    #  so, rather than dressed up with a date nobody can stand behind -
    #  pull TRANSACTIONS from the start of the shut and they all date.
    open_by_item = {}
    for sheet_name in ("TRANSACTION_CHARGES", "TRANSACTION_WITHOUT_CHARGES",
                       "CUSTOMER_CONTRACTOR_EQUIP"):
        for r in _rows(p_trans, sheet_name):
            if _s(r.get("TRAN_END_DATE")) or not _date(r.get("TRAN_START_DATE")):
                continue                        # closed, or undated
            for key in (_s(r.get("SKU/ITEM_NUMBER")), _s(r.get("LATEST_BARCODE"))):
                if key:
                    open_by_item.setdefault(key.upper(), []).append(r)

    def issue_of(stock_row):
        """The open transaction behind an on-hire stock row, matched on
        item number or barcode, preferring the same hirer, newest
        start first. None if the export hasn't got one."""
        cands, ids = [], set()
        for key in (_s(stock_row.get("ITEM_NUMBER")),
                    _s(stock_row.get("ITEM_BARCODE"))):
            for t in open_by_item.get(key.upper(), []) if key else []:
                tid = _s(t.get("TRANSACTION_ID")) or str(id(t))
                if tid in ids:
                    continue
                ids.add(tid)
                cands.append(t)
        if not cands:
            return None
        who = _who(stock_row.get("HIRER_NAME"))
        same = [t for t in cands if _who(t.get("HIRER_NAME")) == who]
        pool = same or cands
        return max(pool, key=lambda t: (_date(t.get("TRAN_START_DATE")),
                                        _s(t.get("TRAN_START_TIME"))))

    #  A report dated before its own data is wrong on its face. If the
    #  exports carry a movement dated after today's clock (an early pull
    #  across midnight, a laptop clock behind the site), the report takes
    #  the newest day in the data as its date and says so.
    movement_dates = [_date(r.get(field)) for r in tw + own
                      for field in ("TRAN_START_DATE", "TRAN_END_DATE")]
    movement_dates += [_date(r.get("SALES_DATE")) for r in sales
                       if _n(r.get("SALES_QUANTITY")) > 0]
    newest = max([day for day in movement_dates if day] or [when])
    _PRINT["stale_days"] = 0
    _PRINT.pop("stale_newest", None)
    if newest > when:
        say("  NOTE | The exports carry movements dated {}, after today's clock "
            "({}). The report is dated {}.".format(
                newest.strftime("%d %b %Y"), when.strftime("%d %b %Y"),
                newest.strftime("%d %b %Y")))
        when = newest
    elif (when - newest).days > 3:
        say("  WARN | The newest movement in the exports is {} - {} days before "
            "this report's date. Are these today's exports?".format(
                newest.strftime("%d %b %Y"), (when - newest).days))
        _PRINT["stale_days"] = (when - newest).days
        _PRINT["stale_newest"] = newest
    else:
        _PRINT["stale_days"] = 0

    title = "{}  |  Shutdown Tool Store  |  On-Hire Report".format(
        s.short or s.customer or "Shutdown")
    _PRINT["job"] = s.header_line
    _PRINT["asat"] = asat.strftime("%d %b %Y %H:%M")
    _PRINT["period"] = period

    wb = openpyxl.Workbook()
    wb.remove(wb.active)
    wb.properties.title = "{} - On-Hire Workbook - {}".format(
        s.short or s.customer or "Shutdown", when.strftime("%d %b %Y"))
    wb.properties.creator = s.author or "Andrew Fisher"
    wb.properties.subject = s.header_line

    # ---- the pieces every tab is cut from -----------------------------
    onhire = [r for r in rental if _s(r.get("ITEM_STATUS")) == "On Hire"]
    coates_owned = [r for r in rental
                    if "COATES" in _s(r.get("OWNER")).upper()]
    tooling_tx = [r for r in tw
                  if _s(r.get("PRODUCT_CATEGORY")).lower() != "consumable"]
    consumable_tx = [r for r in sales if _n(r.get("SALES_QUANTITY")) > 0]
    sales_bounds = transactions_datetime_window(p_trans)
    _PRINT["draws_basis"] = "window_time" if sales_bounds else "all_sales"
    period_sales = [r for r in consumable_tx if sale_in_window(r, sales_bounds)]
    consumable_stock = [r for r in sales if not _s(r.get("COMPANY_NAME"))]

    tabs = []                      # (name, rows, why) for the cover index

    # ---- 1. Company Summary -------------------------------------------
    companies = {}
    for r in tooling_tx:
        co = _s(r.get("EMPLOYER_NAME")) or "(not named)"
        kind = "TOOLING"
        d = companies.setdefault(co, {
            "TOOLING": {"tx": 0, "qty": 0.0, "types": set(), "open": 0},
            "CONSUMABLES": {"tx": 0, "qty": 0.0, "types": set(), "open": 0}})
        a = d[kind]
        a["tx"] += 1
        a["qty"] += _n(r.get("QUANTITY"))
        a["types"].add(_s(r.get("SKU/ITEM DESCRIPTION")))
        if kind == "TOOLING" and not _s(r.get("TRAN_END_DATE")):
            a["open"] += 1

    # SALES_STOCK is the single source of consumable draws in every output.
    # Charging sheets can omit sales, or repeat them under another representation.
    for r in period_sales:
        co = _s(r.get("COMPANY_NAME")) or "(not named)"
        d = companies.setdefault(co, {
            "TOOLING": {"tx": 0, "qty": 0.0, "types": set(), "open": 0},
            "CONSUMABLES": {"tx": 0, "qty": 0.0, "types": set(), "open": 0}})
        a = d["CONSUMABLES"]
        a["tx"] += 1
        a["qty"] += _n(r.get("SALES_QUANTITY"))
        a["types"].add(_s(r.get("SKU_DESCRIPTION")))

    live_onhire = {}
    for r in onhire:
        live_onhire[_s(r.get("COMPANY_NAME"))] = \
            live_onhire.get(_s(r.get("COMPANY_NAME")), 0) + 1
    #  A company still holding gear but with no movement inside the
    #  export window is not in the transactions at all. It belongs on the
    #  summary with zero movements - that is exactly the company to chase.
    for co in sorted(live_onhire):
        if co and co not in companies:
            companies[co] = {
                "TOOLING": {"tx": 0, "qty": 0.0, "types": set(), "open": 0},
                "CONSUMABLES": {"tx": 0, "qty": 0.0, "types": set(), "open": 0}}

    summary_rows = []
    for co in sorted(companies):
        d = companies[co]
        tot = {"tx": 0, "qty": 0.0, "types": 0, "onh": 0, "open": 0}
        for kind in ("TOOLING", "CONSUMABLES"):
            a = d[kind]
            #  Consumables are sold, not returned - nothing is ever
            #  "still out", so those two columns are zero by definition.
            onh = live_onhire.get(co, 0) if kind == "TOOLING" else 0
            opn = a["open"] if kind == "TOOLING" else 0
            summary_rows.append([co, kind, a["tx"], int(a["qty"]),
                                 len([t for t in a["types"] if t]), onh, opn])
            tot["tx"] += a["tx"]
            tot["qty"] += a["qty"]
            tot["types"] += len([t for t in a["types"] if t])
            tot["onh"] += onh
            tot["open"] += opn
        summary_rows.append([co, "TOTAL", tot["tx"], int(tot["qty"]),
                             tot["types"], tot["onh"], tot["open"]])

    sheet(wb, "Company Summary", title,
          ["Company", "Type", "Transactions", "Qty", "Item types",
           "On hire now", "Not returned"],
          summary_rows,
          widths={0: 30, 1: 15, 2: 14, 3: 10, 4: 13, 5: 15, 6: 15},
          formats={2: INT_FMT, 3: INT_FMT, 4: INT_FMT, 5: INT_FMT, 6: INT_FMT},
          emphasis=lambda row: row[1] == "TOTAL")
    #  The tooling and consumables lines group under each company's
    #  total, so the tab folds to one line per company at a click.
    try:
        ws_cs = wb["Company Summary"]
        ws_cs.sheet_properties.outlinePr.summaryBelow = True
        for r_ in range(3, ws_cs.max_row + 1):
            if ws_cs.cell(row=r_, column=2).value != "TOTAL":
                ws_cs.row_dimensions[r_].outlineLevel = 1
    except Exception:
        pass
    tabs.append(("Company Summary", len(summary_rows),
                 "Per company: what they took, what they still have"))

    # ---- 2. Detailed Onhire -------------------------------------------
    #  Dated from the issue transaction (see above). The SiteIQ stock
    #  date rides along in the last column so the two can be compared.
    det = []
    for r in onhire:
        t = issue_of(r)
        since = _date(t.get("TRAN_START_DATE")) if t else None
        det.append([_s(r.get("COMPANY_NAME")), _s(r.get("HIRER_NAME")),
                    _s(r.get("ITEM_NUMBER")), _s(r.get("ITEM_DESCRIPTION")),
                    _s(r.get("ITEM_STATUS")), since,
                    _s(t.get("TRAN_START_TIME")) if t else "",
                    days_out(when, since),
                    _s(t.get("TRANSACTION_ID")) if t else "Not in this export",
                    _date(r.get("ON_HIRE_DATE"))])
    det.sort(key=lambda x: (x[0], x[1], x[3]))
    undated = [r for r in det if r[5] is None]
    sheet(wb, "Detailed Onhire", title,
          ["Company", "Hirer", "Item number", "Description", "Status",
           "Issued (transaction start)", "Time", "Days on hire",
           "Issue transaction", "SiteIQ stock date"],
          det, widths={0: 24, 1: 22, 2: 24, 3: 48, 4: 13, 5: 17, 6: 11,
                       7: 12, 8: 19, 9: 15},
          formats={5: DATE_FMT, 7: INT_FMT, 9: DATE_FMT},
          rules={4: "status", 7: "days"})
    tabs.append(("Detailed Onhire", len(det),
                 "Every item out right now, who has it, and the day it was "
                 "issued"))

    # ---- 3. Tooling Transactions --------------------------------------
    tt = sorted(([_s(r.get("EMPLOYER_NAME")), _s(r.get("HIRER_NAME")),
                  _s(r.get("SKU/ITEM_NUMBER")),
                  _s(r.get("SKU/ITEM DESCRIPTION")),
                  _date(r.get("TRAN_START_DATE")), _s(r.get("TRAN_START_TIME")),
                  _date(r.get("TRAN_END_DATE")), _s(r.get("TRAN_END_TIME")),
                  _s(r.get("TRANSACTION_ID"))] for r in tooling_tx),
                 key=lambda x: (x[4] or dt.date.min, x[0]))
    sheet(wb, "Tooling Transactions", title,
          ["Company", "Hirer", "SKU / item number", "Description",
           "Issued", "Time", "Returned", "Time", "Transaction ID"],
          tt, widths={0: 24, 1: 22, 2: 24, 3: 48, 4: 13, 5: 11, 6: 13,
                      7: 11, 8: 15},
          formats={4: DATE_FMT, 6: DATE_FMT})
    tabs.append(("Tooling Transactions", len(tt),
                 "Every tooling issue and return this period"))

    # ---- 4. Tooling Utilisation ---------------------------------------
    fleet = {}
    for r in rental:
        d = fleet.setdefault(_s(r.get("ITEM_DESCRIPTION")),
                             {"total": 0, "onhire": 0, "avail": 0})
        d["total"] += 1
        st = _s(r.get("ITEM_STATUS"))
        if st == "On Hire":
            d["onhire"] += 1
        elif st == "Available for Hire":
            d["avail"] += 1

    used = {}
    for r in tooling_tx:
        d = used.setdefault(_s(r.get("SKU/ITEM DESCRIPTION")),
                            {"tx": 0, "qty": 0.0, "co": set(), "hi": set(),
                             "first": None, "last": None})
        d["tx"] += 1
        d["qty"] += _n(r.get("QUANTITY"))
        if _s(r.get("EMPLOYER_NAME")):
            d["co"].add(_s(r.get("EMPLOYER_NAME")))
        if _s(r.get("HIRER_NAME")):
            d["hi"].add(_s(r.get("HIRER_NAME")))
        day = _date(r.get("TRAN_START_DATE"))
        if day:
            d["first"] = day if d["first"] is None else min(d["first"], day)
            d["last"] = day if d["last"] is None else max(d["last"], day)

    tu = []
    for desc in sorted(fleet):
        f = fleet[desc]
        u = used.get(desc, {"tx": 0, "qty": 0.0, "co": set(), "hi": set(),
                            "first": None, "last": None})
        util = (f["onhire"] / f["total"]) if f["total"] else 0.0
        rating, rec = tooling_rating(u["tx"], f["total"], util)
        tu.append([desc, f["total"], f["onhire"], f["avail"], util,
                   u["tx"], int(u["qty"]), len(u["co"]), len(u["hi"]),
                   u["first"], u["last"], rating, rec])
    sheet(wb, "Tooling Utilisation", title,
          ["Item", "On site", "On hire", "Available", "Utilisation now",
           "Transactions", "Qty issued", "Companies using", "Hirers using",
           "First used", "Last used", "Usage rating", "Recommendation"],
          tu, widths={0: 50, 1: 10, 2: 10, 3: 11, 4: 14, 5: 13, 6: 11,
                      7: 12, 8: 12, 9: 12, 10: 12, 11: 14, 12: 20},
          formats={1: INT_FMT, 2: INT_FMT, 3: INT_FMT, 4: PCT_FMT,
                   5: INT_FMT, 6: INT_FMT, 7: INT_FMT, 8: INT_FMT,
                   9: DATE_FMT, 10: DATE_FMT},
          rules={4: "bar", 11: "rating", 12: "recommend"})
    tabs.append(("Tooling Utilisation", len(tu),
                 "Per item type: turns, rating, what to do about it"))

    # ---- 5. Coates Tooling --------------------------------------------
    ct = sorted(([_s(r.get("ITEM_NUMBER")), _s(r.get("ITEM_DESCRIPTION")),
                  _s(r.get("ITEM_STATUS"))] for r in coates_owned),
                key=lambda x: (x[1], x[0]))
    sheet(wb, "Coates Tooling", title,
          ["Item number", "Description", "Status"],
          ct, widths={0: 26, 1: 60, 2: 20}, rules={2: "status"})
    tabs.append(("Coates Tooling", len(ct),
                 "The Coates-owned fleet on this site"))

    # ---- 6. Consumable Transactions -----------------------------------
    ctx = sorted(([_s(r.get("COMPANY_NAME")), _s(r.get("HIRER")),
                   _s(r.get("SKU_DESCRIPTION")), _n(r.get("SALES_QUANTITY")),
                   _date(r.get("SALES_DATE")), _s(r.get("SALES_TIME"))]
                  for r in consumable_tx),
                 key=lambda x: (x[0], x[2]))
    sheet(wb, "Consumable Transactions", title,
          ["Company", "Hirer", "Line", "Qty", "Date", "Time"],
          ctx, widths={0: 24, 1: 24, 2: 50, 3: 10, 4: 13, 5: 11},
          formats={3: "#,##0.00", 4: DATE_FMT})
    tabs.append(("Consumable Transactions", len(ctx),
                 "Every consumable issued this period"))
    #  "This period" means the transactions window. SALES_STOCK carries
    #  every sale the project has ever made, so the draws counted in the
    #  headline, the tiles, the pack, the charts and history are the ones
    #  inside the window the TRANSACTIONS export covers. The tab above
    #  keeps them all, and the Cover and DATA_SOURCES say how many were
    #  counted.
    ctx_all = ctx
    _win = transactions_window(p_trans)
    _PRINT["window"] = _win
    if sales_bounds:
        ctx = sorted(([_s(r.get("COMPANY_NAME")), _s(r.get("HIRER")),
                       _s(r.get("SKU_DESCRIPTION")), _n(r.get("SALES_QUANTITY")),
                       _date(r.get("SALES_DATE")), _s(r.get("SALES_TIME"))]
                      for r in period_sales), key=lambda x: (x[0], x[2]))
    _PRINT["draws_note"] = (
        "{:,} of the {:,} consumable draws in SALES_STOCK fall inside the transactions "
        "window and are the ones counted as this period; outside-window draws and "
        "draws without enough date/time information remain on the audit tab".format(len(ctx), len(ctx_all))
        if sales_bounds and len(ctx) != len(ctx_all) else "")
    if _PRINT["draws_note"]:
        say("  Draws     " + _PRINT["draws_note"] + ".")

    # ---- 7. Consumables Available -------------------------------------
    ca = sorted(([_s(r.get("SKU_NUMBER")), _s(r.get("SKU_DESCRIPTION")),
                  int(_n(r.get("AVAILABLE_QUANTITY")))]
                 for r in consumable_stock), key=lambda x: x[1])
    sheet(wb, "Consumables Available", title,
          ["SKU", "Line", "On shelf"],
          ca, widths={0: 20, 1: 50, 2: 14}, formats={2: INT_FMT})
    tabs.append(("Consumables Available", len(ca),
                 "What's left on the shelf"))

    # ---- 8. Coates Stock ----------------------------------------------
    cs = []
    for r in coates_owned:
        t = issue_of(r) if _s(r.get("ITEM_STATUS")) == "On Hire" else None
        since = _date(t.get("TRAN_START_DATE")) if t else None
        cs.append([_s(r.get("ITEM_NUMBER")), _s(r.get("ITEM_DESCRIPTION")),
                   _s(r.get("ITEM_STATUS")), since,
                   _s(t.get("TRAN_START_TIME")) if t else "",
                   (_s(t.get("TRANSACTION_ID")) if t else
                    ("Not in this export" if _s(r.get("ITEM_STATUS")) == "On Hire"
                     else "")),
                   _date(r.get("ON_HIRE_DATE"))])
    cs.sort(key=lambda x: (x[1], x[0]))
    sheet(wb, "Coates Stock", title,
          ["Item number", "Description", "Status", "Issued (transaction start)",
           "Time", "Issue transaction", "SiteIQ stock date"],
          cs, widths={0: 26, 1: 56, 2: 18, 3: 17, 4: 11, 5: 19, 6: 15},
          formats={3: DATE_FMT, 6: DATE_FMT}, rules={2: "status"})
    tabs.append(("Coates Stock", len(cs),
                 "The fleet with the day each on-hire item was issued"))

    # ---- 9. Customer-owned gear through the counter --------------------
    og = sorted(([_s(r.get("EMPLOYER_NAME")), _s(r.get("HIRER_NAME")),
                  _s(r.get("SKU/ITEM_NUMBER")), _s(r.get("SKU/ITEM DESCRIPTION")),
                  _s(r.get("PRODUCT_CATEGORY")), _n(r.get("QUANTITY")),
                  _date(r.get("TRAN_START_DATE")), _s(r.get("TRAN_START_TIME")),
                  _date(r.get("TRAN_END_DATE")), _s(r.get("TRAN_END_TIME")),
                  _s(r.get("TRANSACTION_ID"))] for r in own),
                key=lambda x: (x[0], x[6] or dt.date.min, x[3]))
    sheet(wb, "Customer Gear", title,
          ["Company", "Hirer", "SKU / item number", "Description", "Category",
           "Qty", "Issued", "Time", "Returned", "Time", "Transaction ID"],
          og, widths={0: 24, 1: 22, 2: 24, 3: 46, 4: 13, 5: 8, 6: 13, 7: 11,
                      8: 13, 9: 11, 10: 15},
          formats={5: INT_FMT, 6: DATE_FMT, 8: DATE_FMT})
    tabs.append(("Customer Gear", len(og),
                 "Customer- and contractor-owned gear logged through the counter"))

    # ---- 10. Consumable Utilisation -----------------------------------
    shelf, sold = {}, {}
    for r in sales:
        desc = _s(r.get("SKU_DESCRIPTION"))
        if not _s(r.get("COMPANY_NAME")):
            shelf[desc] = shelf.get(desc, 0.0) + _n(r.get("AVAILABLE_QUANTITY"))
        q = _n(r.get("SALES_QUANTITY"))
        if q > 0:
            d = sold.setdefault(desc, {"qty": 0.0, "co": set(), "hi": set(),
                                       "first": None, "last": None})
            d["qty"] += q
            if _s(r.get("COMPANY_NAME")):
                d["co"].add(_s(r.get("COMPANY_NAME")))
            if _s(r.get("HIRER")):
                d["hi"].add(_s(r.get("HIRER")))
            day = _date(r.get("SALES_DATE"))
            if day:
                d["first"] = day if d["first"] is None else min(d["first"], day)
                d["last"] = day if d["last"] is None else max(d["last"], day)

    cu = []
    for desc in sorted(set(list(shelf) + list(sold))):
        avail = shelf.get(desc, 0.0)
        d = sold.get(desc, {"qty": 0.0, "co": set(), "hi": set(),
                            "first": None, "last": None})
        position = avail + d["qty"]
        usage = (d["qty"] / position) if position else 0.0
        rating, rec = consumable_rating(usage)
        cu.append([desc, int(avail), int(d["qty"]), int(position), usage,
                   len(d["co"]), len(d["hi"]), d["first"], d["last"],
                   rating, rec])
    sheet(wb, "Consumable Utilisation", title,
          ["Line", "On shelf", "Sold", "Stock position", "Used",
           "Companies using", "Hirers using", "First sold", "Last sold",
           "Usage rating", "Recommendation"],
          cu, widths={0: 46, 1: 11, 2: 10, 3: 14, 4: 12, 5: 13, 6: 12,
                      7: 12, 8: 12, 9: 14, 10: 20},
          formats={1: INT_FMT, 2: INT_FMT, 3: INT_FMT, 4: PCT_FMT,
                   5: INT_FMT, 6: INT_FMT, 7: DATE_FMT, 8: DATE_FMT},
          rules={4: "bar", 9: "rating", 10: "recommend"})
    tabs.append(("Consumable Utilisation", len(cu),
                 "Per line: usage, rating, what to do about it"))

    # ---- 10/11. the two hand-typed tabs, carried over verbatim --------
    carried, labour_total, cost_total, roster = carry_over(wb, s, base, title, when)
    for name, n in carried:
        tabs.append((name, n, "Typed by hand - carried over untouched"))
    tabs.insert(0, ("Dashboard", 8, "The position as live charts and gauges"))

    # ---- the email's numbers, and the company pack --------------------
    #  Worked out before the cover so the cover can say how many pages
    #  the pack ran to. The pack is written to disk after the workbook,
    #  and if it fails the workbook and the email still go out.
    parts = email_parts(s, summary_rows, tu, cu, det, ctx, ca, coates_owned,
                        tooling_tx, live_onhire, sources, when, period)

    #  ---- the story numbers: how gear moved, what the store verified ----
    same_day = kept = 0
    for r in tooling_tx:
        a, b = _date(r.get("TRAN_START_DATE")), _date(r.get("TRAN_END_DATE"))
        if a and b:
            if a == b:
                same_day += 1
            else:
                kept += 1
    own_by_co, own_lines = {}, {}
    for r in own:
        co = _s(r.get("EMPLOYER_NAME")) or "(not named)"
        own_by_co[co] = own_by_co.get(co, 0) + 1
        k = _s(r.get("SKU/ITEM DESCRIPTION")) or "(no description)"
        own_lines[k] = own_lines.get(k, 0) + 1
    st_total = st_sighted = 0
    st_counters = set()
    for r in stocktake:
        su = _s(r.get("STORAGE_UNIT")).upper()
        if not su or su in ("ON HIRE", "SHUTDOWN", "TURNAROUND"):
            continue
        st_total += 1
        d0 = _date(r.get("LAST_SIGHTED_DATE_TIME"))
        if d0 and 0 <= (when - d0).days <= 3:
            st_sighted += 1
        if _s(r.get("LAST_SIGHTED_BY")):
            st_counters.add(_s(r.get("LAST_SIGHTED_BY")))
    people_served = {_s(r.get("HIRER_NAME")) for r in tooling_tx if _s(r.get("HIRER_NAME"))}
    people_served |= {r[1] for r in ctx if r[1]}
    people_served |= {_s(r.get("HIRER_NAME")) for r in own if _s(r.get("HIRER_NAME"))}
    demob = s.shutdown_end
    parts["_tx_total"] = (len(tooling_tx), len(ctx))
    if _PRINT.get("stale_days"):
        parts["call"].insert(1, "Check the exports: the newest movement in them is {}, {} days "
                                "before this report's date.".format(
                                    _PRINT["stale_newest"].strftime("%d %b %Y"), _PRINT["stale_days"]))
    parts["story"] = {
        "same_day": same_day, "kept": kept, "still_out": len(det),
        "own_total": len(own), "own_by_co": own_by_co,
        "own_lines": sorted(own_lines.items(), key=lambda kv: (-kv[1], kv[0]))[:10],
        "own_companies": len(own_by_co),
        "st_total": st_total, "st_sighted": st_sighted,
        "st_pct": (st_sighted / float(st_total)) if st_total else None,
        "st_counters": sorted(st_counters),
        "people": len(people_served),
        "companies_active": len({_s(r.get("EMPLOYER_NAME")) for r in tw
                                 if _s(r.get("EMPLOYER_NAME"))} | set(own_by_co)),
        "fleet": len(rental), "types": len({_s(r.get("ITEM_DESCRIPTION")) for r in rental}),
        "types_out": len({r[3] for r in det}),
        "labour": roster, "fixed_rate": s.fixed_rate,
        "demob": demob, "days_to_demob": (demob - when).days if demob else None,
        "push": bool(demob and 0 <= (demob - when).days <= 4),
    }
    #  Own gear rides on the company rows for the email and the pack.
    for row in parts["companies"]:
        row.append(own_by_co.get(row[0], 0))
    st_ = parts["story"]
    n_moves = len(tooling_tx) + len(ctx)
    line = ("{:,} movement{} went through the counter this period - {:,} tooling "
            "transaction{} and {:,} consumable draw{} - with {:,} same-day return{}.".format(
                n_moves, "" if n_moves == 1 else "s", len(tooling_tx),
                "" if len(tooling_tx) == 1 else "s", len(ctx), "" if len(ctx) == 1 else "s",
                same_day, "" if same_day == 1 else "s"))
    if st_["own_total"]:
        line += (" On top of the Coates fleet, {:,} movement{} of customer-owned "
                 "gear {} logged through the same counter.".format(
                     st_["own_total"], "" if st_["own_total"] == 1 else "s",
                     "was" if st_["own_total"] == 1 else "were"))
    parts["call"].insert(1, line)
    if st_["demob"]:
        dd = st_["days_to_demob"]
        parts["call"].append(
            "Demob is {} - {}.".format(
                st_["demob"].strftime("%A %d %B %Y"),
                "today" if dd == 0 else ("{} day{} away".format(dd, "" if dd == 1 else "s")
                                         if dd > 0 else "{} day{} ago".format(-dd, "" if dd == -1 else "s"))))
    if st_["push"] and det:
        parts["actions"].insert(0, (
            "Gear return push",
            "{:,} item{} still out across {:,} compan{} with demob {} day{} away. "
            "Every return takes seconds at the counter and is double-scanned off "
            "the record - send it back today and nobody is answering for it later."
            .format(len(det), "" if len(det) == 1 else "s", n_companies_out(det),
                    "y" if n_companies_out(det) == 1 else "ies", st_["days_to_demob"],
                    "" if st_["days_to_demob"] == 1 else "s")))
    owner_of = dict((_s(r.get("ITEM_NUMBER")), _s(r.get("OWNER"))) for r in onhire)
    blocks, quiet = pack_blocks(det, ctx, tooling_tx, when, own, owner_of=owner_of)

    #  The numbers the charts and gauges are drawn from - the pack's
    #  "At a glance" page and the workbook's Dashboard tab read these.
    by_day = {}
    for r in tooling_tx:
        d0, d1 = _date(r.get("TRAN_START_DATE")), _date(r.get("TRAN_END_DATE"))
        if d0:
            by_day.setdefault(d0, [0, 0, 0])[0] += 1
        if d1:
            by_day.setdefault(d1, [0, 0, 0])[1] += 1
    for r in ctx:
        if r[4]:
            by_day.setdefault(r[4], [0, 0, 0])[2] += 1
    #  Only the days inside the transactions window - SALES_STOCK carries
    #  every sale ever made, and a stray August sale is not a movement
    #  worth charting next to this week's.
    window = transactions_window(p_trans)
    if window:
        days_sorted = [dd for dd in sorted(by_day) if window[0] <= dd <= window[1]]
    else:
        days_sorted = sorted(by_day)[-7:]
    tool_mix, cons_mix = {}, {}
    for r in tu:
        tool_mix[r[11]] = tool_mix.get(r[11], 0) + 1
    for r in cu:
        cons_mix[r[9]] = cons_mix.get(r[9], 0) + 1
    dated_days = [r[7] for r in det if r[7] is not None]
    parts["viz"] = {
        "coates_total": len(coates_owned),
        "coates_out": len([r for r in coates_owned
                           if _s(r.get("ITEM_STATUS")) == "On Hire"]),
        "onhire": len(det), "dated": len(det) - len(undated),
        "undated": len(undated),
        "cons_lines": len(cu),
        "cons_tight": len([r for r in cu if r[4] >= CONS_TIGHT]),
        "long_out": len([d for d in dated_days if d >= LONG_OUT_DAYS]),
        "oldest_days": max(dated_days) if dated_days else 0,
        "tool_mix": tool_mix, "cons_mix": cons_mix,
        "by_day": [(dd, by_day[dd][0], by_day[dd][1], by_day[dd][2]) for dd in days_sorted],
        "period": period,
    }

    # ---- looking ahead ------------------------------------------------
    #  The shut from the roster, the counter's rhythm from the record,
    #  the cost curve from the typed tabs. The pack and the email get the
    #  dates and the rhythm; only the workbook's Forecast tab gets dollars.
    try:
        parts["forecast"] = forecast_block(
            s, when, roster, wb, tooling_tx, ctx, own, parts, period,
            read_project_schedule(p_trans) if p_trans else None,
            labour_total, cost_total)
    except Exception as e:
        parts["forecast"] = None
        say("  WARN | The forecast didn't build ({}). Everything else is "
            "unaffected.".format(e))
        import traceback
        _LOG.append(traceback.format_exc())
    if parts.get("forecast"):
        tabs.insert(1, ("Forecast", len(parts["forecast"]["days"]),
                        "The shut ahead - roster, hours and the cost curve"))

    # ---- where the shut is up to, what moved since last time -----------
    parts["progress"] = None
    parts["previous"] = None
    try:
        parts["progress"] = shut_progress(parts.get("forecast"), when)
        parts["previous"] = previous_report(base, s, when)
    except Exception as e:
        say("  WARN | Progress / since-last-report didn't compute ({}). Everything "
            "else is unaffected.".format(e))
    parts["story"]["progress"] = parts["progress"]
    parts["story"]["previous"] = parts["previous"]
    c_ = parts["counts"]
    parts["story"]["hero"] = (("{:,}".format(c_["onhire"]), "items on hire now",
                               "{:,} compan{}  \u00b7  oldest {}".format(
                                   c_["companies"], "y" if c_["companies"] == 1 else "ies",
                                   _days_text(c_["oldest_days"])))
                              if c_["onhire"] else
                              ("0", "nothing on hire", "no items recorded on hire in this export"))
    try:
        parts["viz"]["out_by_day"] = out_by_day(tooling_tx, [dd for dd, _i, _r, _c in parts["viz"]["by_day"]])
        parts["viz"]["age"] = age_bands(det)
    except Exception:
        parts["viz"]["out_by_day"], parts["viz"]["age"] = [], []
    prev = parts["previous"]
    if prev:
        mv, what = _moves_delta(prev, len(tooling_tx), len(ctx))
        say("  Since     the last report ({}): on hire {:+,}, {} {:+,}.".format(
            prev["day"].strftime("%d %b"), len(det) - prev["onhire"], what or "movements", mv or 0))
        now_by = {"Items on hire now": len(det), "Tooling issues & returns": len(tooling_tx),
                  "Consumables issued": len(ctx)}
        was_by = {"Items on hire now": prev.get("onhire"), "Tooling issues & returns": prev.get("moves"),
                  #  draws compare only with a report that counted them the same way
                  "Consumables issued": prev.get("draws") if prev.get("basis") == "window_time"
                  and _PRINT.get("draws_basis") == "window_time" else None}
        tiles_ = []
        for label, value, sub in parts["tiles"]:
            dtext = delta_text(now_by.get(label, 0), was_by.get(label), prev["day"]) if label in now_by else ""
            tiles_.append((label, value, "{}  \u00b7  {}".format(sub, dtext) if dtext else sub))
        parts["tiles"] = tiles_
        if prev.get("onhire") is not None and len(det) != prev["onhire"]:
            d_ = len(det) - prev["onhire"]
            parts["call"].append("{:,} {} item{} on hire than the last report ({}).".format(
                abs(d_), "more" if d_ > 0 else "fewer", "" if abs(d_) == 1 else "s",
                prev["day"].strftime("%d %b")))

    # ---- 12. Cover ----------------------------------------------------
    try:
        dirs = out_dirs(base, when, s)
    except OSError as e:
        raise KitProblem(
            "Couldn't make today's folder under Reports.\n\n"
            "         {}\n\n"
            "         The folder is read-only, or it's a OneDrive one that "
            "isn't\n"
            "         signed in. Copy the whole kit to your Desktop and run "
            "it\n"
            "         from there.".format(e))
    label = _safe_name(s.short or s.customer or "Shutdown")
    pack_path = os.path.join(dirs["day"], "{} On-Hire Report by Company - {}.pdf"
                             .format(label, when.strftime("%d %b %Y")))
    pack_info = None
    if coates_pdf is None:
        say("  WARN | coates_pdf.py is missing from the kit, so there is no "
            "company pack this run.")
        say("         Extract the zip again - the email and workbook are "
            "unaffected.")
    else:
        try:
            faces = coates_pdf.load_fonts(os.path.join(base, "_fonts"))
            if not faces:
                say("  NOTE | No _fonts folder beside the kit, so the pack is set in "
                    "Helvetica this run. Extract the zip again to get Inter back.")
        except Exception:
            pass
        try:
            pages = build_company_pack(pack_path, s, when, asat, period, parts,
                                       blocks, quiet)
            pack_info = {"path": pack_path, "pages": pages,
                         "companies": len(blocks)}
            parts["pack_pages"] = pages
        except Exception as e:
            say("=" * 66)
            say(" WARN | THE COMPANY PACK (PDF) DID NOT BUILD")
            say("=" * 66)
            say("  {}".format(e))
            say("  The workbook and the email still go out - the pack is "
                "simply not attached.")
            say("  Send Andrew LAST_RUN_LOG.txt and he'll sort it.")
            say("=" * 66)
            import traceback
            _LOG.append(traceback.format_exc())
            pack_info = None

    cover(wb, s, when, asat, tabs, sources, base,
          headline={
              "Items on hire now": len(onhire),
              "Companies with gear out": len([c for c in live_onhire
                                              if live_onhire[c]]),
              "Items with no issue transaction": len(undated),
              "Coates items on site": len(coates_owned),
              "Tooling transactions": len(tooling_tx),
              "Consumable issues": len(ctx),
              "Consumable lines on shelf": len(cu),
              "Customer-owned gear logged": len(own),
              "Same-day returns this period": parts["story"]["same_day"],
              "Items counted at last stocktake": len(stocktake),
              "Labour cost (roster)": labour_total,
              "Cost breakdown (shut total)": cost_total,
          }, pack=pack_info,
          shut_end=((parts.get("progress") or {}).get("last")
                    if hasattr((parts.get("progress") or {}).get("last"), "strftime") else None),
          extra=[("Shut progress", parts["progress"]["label"].replace("\u00b7", "-")
                  if parts.get("progress") else "-"),
                 ("Since last report", ("{}: on hire {:+,}, {} {:+,}".format(
                     parts["previous"]["day"].strftime("%d %b"),
                     len(det) - parts["previous"]["onhire"],
                     _moves_delta(parts["previous"], len(tooling_tx), len(ctx))[1] or "movements",
                     _moves_delta(parts["previous"], len(tooling_tx), len(ctx))[0] or 0)
                  if parts.get("previous") else "first report in this folder")),
                 ("Typeface", "Inter (embedded)" if coates_pdf is not None and
                  coates_pdf.typeface() == "Inter" else "Helvetica"),
                 ("Draws counted", _PRINT.get("draws_note").split(" fall ")[0].replace(
                     "consumable draws in SALES_STOCK", "sales rows")
                  if _PRINT.get("draws_note") else "all in SALES_STOCK"),
                 ("Export age", "{} days before the report date - check the exports".format(
                     _PRINT["stale_days"]) if _PRINT.get("stale_days") else "current")])
    try:
        dashboard(wb, s, when, asat, parts)
        wb._sheets.insert(0, wb._sheets.pop(wb._sheets.index(wb["Dashboard"])))
    except Exception as e:
        say("  WARN | The Dashboard tab didn't build ({}). Everything else is "
            "unaffected.".format(e))
        import traceback
        _LOG.append(traceback.format_exc())
    if parts.get("forecast"):
        try:
            forecast_tab(wb, s, when, asat, parts["forecast"])
            at = 1 if "Dashboard" in wb.sheetnames else 0
            wb._sheets.insert(at, wb._sheets.pop(wb._sheets.index(wb["Forecast"])))
        except Exception as e:
            say("  WARN | The Forecast tab didn't build ({}). Everything else is "
                "unaffected.".format(e))
            import traceback
            _LOG.append(traceback.format_exc())
    wb._sheets.insert(0, wb._sheets.pop(wb._sheets.index(wb["Cover"])))
    parts["n_tabs"] = len(wb.sheetnames)
    #  Tab colours say what kind of tab it is: orange for the front
    #  pages, charcoal for the data, grey for the two typed by hand.
    for ws_ in wb.worksheets:
        if ws_.title in ("Cover", "Dashboard", "Forecast"):
            ws_.sheet_properties.tabColor = ORANGE
        elif ws_.title in CARRIED_OVER:
            ws_.sheet_properties.tabColor = GREY
        else:
            ws_.sheet_properties.tabColor = SLATE

    # ---- save ---------------------------------------------------------
    stem = "{} On-Hire Workbook - {}".format(label, when.strftime("%d %b %Y"))
    out = os.path.join(dirs["day"], stem + ".xlsx")
    try:
        wb.save(out)
    except PermissionError:
        #  Nine times in ten this is yesterday's workbook still open in
        #  Excel. Say that, instead of thirty lines of red traceback.
        say()
        say("  STOP | Windows won't let me write the workbook:")
        say("         {}".format(out))
        say()
        say("         That file is open somewhere - almost always in Excel,")
        say("         sometimes only in the Preview pane of Explorer.")
        say()
        say("         Close it and press the button again. Nothing is lost.")
        say()
        return 1
    except OSError as e:
        say()
        say("  STOP | Couldn't write the workbook: {}".format(e))
        say("         {}".format(out))
        say()
        say("         Usual causes: the folder is read-only, the drive is")
        say("         full, or the kit is sitting somewhere you don't have")
        say("         permission to write - a network drive, or Program")
        say("         Files. Copy the whole folder to your Desktop and try")
        say("         again.")
        say()
        return 1

    #  The one to open. Same name every day, always the newest - so the
    #  shortcut on the desktop never goes stale.
    latest_dir = os.path.join(base, os.path.dirname(s.workbook_glob or ""))
    latest = os.path.join(latest_dir, latest_workbook_name(label))
    try:
        shutil.copyfile(out, latest)
    except OSError as e:
        say("  WARN | Couldn't refresh the LATEST copy ({}). The dated "
              "one above is fine - it's probably open in Excel.".format(e))
        latest = None

    legacy_latest = os.path.join(dirs["day"], latest_workbook_name(label))
    if os.path.isfile(legacy_latest):
        try:
            shutil.copyfile(out, legacy_latest)
        except OSError as error:
            say("  WARN | Could not refresh the older LATEST copy in today's report folder ({})".format(error))

    #  From here on the workbook is safely on disk. Nothing below is worth
    #  throwing that away for, so each step warns and carries on instead
    #  of taking the whole run down with it.
    try:
        note_sources(dirs["day"], sources)
    except OSError:
        pass                    # the sources note is a nicety, not the report

    #  One PDF per company as well, for forwarding a company its own page.
    by_co_dir = os.path.join(dirs["day"], "By_Company")
    n_single = 0
    n_mail = 0
    expected_company_stems = []
    if pack_info and coates_pdf is not None:
        try:
            os.makedirs(by_co_dir, exist_ok=True)
            #  The folder is this run's, whole: a company renamed by an
            #  alias or tidied name must not leave yesterday's file - and
            #  its draft - beside today's.
            for old in os.listdir(by_co_dir):
                if old.lower().endswith((".pdf", ".eml", ".html", ".draft.json")) and \
                        " - On-Hire - " in old:
                    try:
                        os.remove(os.path.join(by_co_dir, old))
                    except OSError:
                        pass
            file_labels = company_file_labels(blocks)
            for b in blocks:
                p = os.path.join(by_co_dir, "{} - On-Hire - {}.pdf".format(
                    file_labels[b["company"]], when.strftime("%d %b %Y")))
                expected_company_stems.append(os.path.splitext(p)[0])
                build_company_pdf(p, s, when, asat, period, b,
                                  sum(x["items"] for x in blocks))
                n_single += 1
                try:
                    write_company_email(by_co_dir, s, when, asat, parts, b, p)
                    n_mail += 1
                except Exception as e:
                    say("  WARN | {}'s email draft didn't write ({}). Its PDF is fine."
                        .format(b["company"], e))
        except Exception as e:
            say("  WARN | The per-company PDFs didn't all write ({}). The "
                "pack itself is fine.".format(e))

    # ---- the email -----------------------------------------------------
    attachments = [out if os.path.isfile(out) else latest]   # the dated workbook
    if pack_info:
        attachments.append(pack_info["path"])
    try:
        html_path, eml_path = write_email(base, s, when, asat, parts,
                                          attachments, dirs["day"])
    except OSError as e:
        say("  WARN | The workbook saved fine, but the email couldn't be "
            "written ({}).".format(e))
        say("         Attach the workbook to a normal email this once, and "
            "run")
        say("         1_CHECK_THIS_LAPTOP.bat to see what is locking the "
            "folder.")
        html_path = eml_path = None

    say("=" * 66)
    say(" COATES | ON-HIRE REPORT - {}".format(s.header_line))
    say("=" * 66)
    for name, n, _why in tabs:
        say("  {:<26} {:>6} rows".format(name, n))
    say("-" * 66)
    say("  Dates     from each item's issue transaction. Transactions export")
    say("            covers {}.".format(period or "an unstated period"))
    if undated:
        say("            {} on-hire item{} {} no issue transaction in that window"
            .format(len(undated), "" if len(undated) == 1 else "s",
                    "has" if len(undated) == 1 else "have"))
        say("            and {} shown as UNDATED. Pull TRANSACTIONS from the shut"
            .format("is" if len(undated) == 1 else "are"))
        say("            start to date them all.")
    say("-" * 66)
    say("  Workbook  {}".format(os.path.relpath(out, base)))
    if latest:
        say("  Open this {}".format(os.path.relpath(latest, base)))
    if pack_info:
        say("  Pack      {}".format(os.path.relpath(pack_info["path"], base)))
        say("            {} pages - a section for each of {} companies".format(
            pack_info["pages"], pack_info["companies"]))
    if n_single:
        say("  Per co.   {}  ({} PDFs{}, one per company)".format(
            os.path.relpath(by_co_dir, base), n_single,
            " and {} email drafts".format(n_mail) if n_mail else ""))
        if n_mail:
            say("            each .eml opens as a draft with that company's page attached;")
            say("            5_MAKE_COMPANY_DRAFTS.bat puts them all in Outlook > Drafts.")
    if eml_path:
        say("  Email     {}".format(os.path.relpath(eml_path, base)))
        say("            double-click it - it opens as a DRAFT with the workbook")
        say("            and the pack attached. Nothing sends until you press")
        say("            Send yourself.")
    if html_path:
        say("  Web page  {}".format(os.path.relpath(html_path, base)))
    #  The kit checks its own work before it says it is done.
    checks = [("workbook saved", os.path.isfile(out)),
              ("pack built", bool(pack_info) and pack_info["pages"] >= 3),
              ("a PDF for every company", n_single == len(blocks) and (
                  not os.path.isdir(by_co_dir) or
                  len([f for f in os.listdir(by_co_dir) if f.lower().endswith(".pdf")]) == len(blocks))),
              ("company drafts complete", n_mail == len(blocks)
               and len(expected_company_stems) == len(blocks)
               and all(os.path.isfile(stem + suffix) for stem in expected_company_stems
                       for suffix in (".html", ".eml", ".draft.json"))),
              ("main email complete", bool(html_path and eml_path)
               and os.path.isfile(html_path) and os.path.isfile(eml_path)),
              ("typeface ready", coates_pdf is not None
               and coates_pdf.typeface() in ("Inter", "Helvetica"))]
    if html_path:
        try:
            with open(html_path, encoding="utf-8") as check_file:
                h_ = check_file.read()
            plain = _re.sub(r"<[^>]+>", " ", h_)
            checks.append(("email has no gaps", not _re.search(r"\{[a-z_]+\}|\bNone\b|\bnan\b", plain)))
            checks.append(("no costs in the email", "$" not in plain))
        except Exception:
            pass
    try:
        co_html = [os.path.join(by_co_dir, f) for f in os.listdir(by_co_dir)
                   if f.lower().endswith(".html")] if os.path.isdir(by_co_dir) else []
        if co_html:
            no_costs = True
            for path in co_html:
                with open(path, encoding="utf-8") as check_file:
                    no_costs = no_costs and "$" not in _re.sub(r"<[^>]+>", " ", check_file.read())
            checks.append(("no costs in the company emails", no_costs))
    except Exception:
        pass
    prof_total = ((parts.get("forecast") or {}).get("cost") or {}).get("total")
    if parts.get("forecast") and cost_total and prof_total:
        checks.append(("cover and forecast agree",
                       abs(float(prof_total) - float(cost_total)) < 0.01))
    passed = sum(1 for _n, ok in checks if ok)
    say("  Checks    {} of {} passed{}".format(
        passed, len(checks), "" if passed == len(checks) else
        " - LOOK AT: " + ", ".join(n for n, ok in checks if not ok)))
    complete = passed == len(checks)
    if not complete:
        say("  STOP | The report is incomplete or a check failed. Review the named")
        say("         checks above before using these outputs, then run again.")
        say("=" * 66)
        return 1
    try:
        write_history(base, s, when, {
            "onhire": len(det), "companies": parts["counts"]["companies"],
            "moves": len(tooling_tx), "draws": len(ctx), "undated": len(undated), "basis": _PRINT["draws_basis"],
            "long_out": parts["counts"]["long_out"], "same_day": parts["story"]["same_day"]})
    except Exception:
        pass
    say("=" * 66)
    return 0


def email_parts(s, summary_rows, tu, cu, det, ctx, ca, coates_owned,
                tooling_tx, live_onhire, sources, when, period=""):
    """Everything the email needs - as NUMBERS as well as text.

    The email draws a little bar beside each figure, and a bar needs the
    value AND the biggest value in its column, so this hands back both
    and lets the HTML do the formatting.

    It also works out the exceptions - the lines being asked for faster
    than we can turn them around, the consumables running down, the gear
    that has been out too long - because those are the only bits anybody
    has to act on. Everything in here is operational. No rates, no
    costs, no dollar signs: the money stays in the workbook.

    Every date here is the start of the item's issue transaction. An
    item with no open transaction in the export is UNDATED and counted
    as such - never silently dated off the stock record.
    """
    n_companies = len([c for c, n in live_onhire.items() if n])
    coates_out = len([r for r in coates_owned
                      if _s(r.get("ITEM_STATUS")) == "On Hire"])

    #  ---- the exceptions. These drive the summary and the actions. ----
    hot = [r for r in tu if r[11] == "High Demand"]
    tight = [r for r in cu if r[4] >= CONS_TIGHT]
    dated = [r for r in det if r[5]]
    undated = [r for r in det if not r[5]]
    dated.sort(key=lambda r: r[5])
    long_out = [r for r in dated if days_out(when, r[5]) >= LONG_OUT_DAYS]
    idle_tool = [r for r in tu if r[11] == "No Use" and r[1] >= 2]
    idle_units = sum(r[1] for r in idle_tool)

    oldest_days = max([days_out(when, r[5]) for r in dated] or [0])
    oldest_item = dated[0][3] if dated else ""
    co_oldest = {}
    for r in dated:
        days = days_out(when, r[5])
        if days > co_oldest.get(r[0], -1):
            co_oldest[r[0]] = days

    n_tool_types = len({_s(r.get("SKU/ITEM DESCRIPTION")) for r in tooling_tx})
    n_cons_lines = len({r[2] for r in ctx})
    tiles = [
        ("Items on hire now", "{:,}".format(len(det)),
         "with {:,} compan{}".format(n_companies, "y" if n_companies == 1 else "ies")),
        ("Longest out (days)", "{:,}".format(oldest_days),
         "oldest: {}".format(oldest_item) if oldest_item
         else "nothing dated on hire"),
        ("Coates items on site", "{:,}".format(len(coates_owned)),
         "{:,} of them out right now".format(coates_out)),
        ("Tooling issues & returns", "{:,}".format(len(tooling_tx)),
         "across {:,} item type{}".format(n_tool_types, "" if n_tool_types == 1 else "s")),
        ("Consumables issued", "{:,}".format(len(ctx)),
         "across {:,} line{}".format(n_cons_lines, "" if n_cons_lines == 1 else "s")),
        ("Consumable lines on shelf", "{:,}".format(len(cu)),
         "{:,} at {:.0f}% or more".format(len(tight), CONS_TIGHT * 100)),
    ]

    #  The three or four things worth knowing before the tables. Every
    #  number here is counted off the exports - nothing is estimated.
    flags = [
        ("amber" if hot else "green", "Order more",
         "{:,} tooling {}".format(len(hot),
                                  "line" if len(hot) == 1 else "lines")),
        ("amber" if tight else "green", "Consumables tight",
         "{:,} {}".format(len(tight),
                          "line" if len(tight) == 1 else "lines")),
        ("red" if long_out else "green",
         "Out over {} days".format(LONG_OUT_DAYS),
         "{:,} {}".format(len(long_out),
                          "item" if len(long_out) == 1 else "items")),
        ("slate", "Not moving at all",
         "{:,} units".format(idle_units)),
    ]

    #  The position, in the words you'd use on the phone.
    if det:
        call = ["{:,} item{} on hire to {:,} compan{}, and the oldest dated "
                "issue has been out {}.".format(
                    len(det), " is" if len(det) == 1 else "s are", n_companies,
                    "y" if n_companies == 1 else "ies", _days_text(oldest_days))]
        #  Customer-owned items managed through the counter are on hire
        #  too, but they are not Coates fleet - say so, so the 56 and the
        #  47 on the dials reconcile.
        coates_nums = {_s(r.get("ITEM_NUMBER")) for r in coates_owned}
        cust = [r for r in det if _s(r[2]) and _s(r[2]) not in coates_nums]
        if cust and len(cust) < len(det):
            call[0] += (" {:,} of them {} customer-owned item{} managed through the "
                        "counter; {:,} {} Coates fleet.".format(
                            len(cust), "is a" if len(cust) == 1 else "are",
                            "" if len(cust) == 1 else "s", len(det) - len(cust),
                            "is" if len(det) - len(cust) == 1 else "are"))
    else:
        call = ["No items are recorded on hire in this export."]
    if hot or tight:
        bits = []
        if hot:
            bits.append("{:,} tooling {} being asked for faster than we can "
                        "turn {} around".format(
                            len(hot), "line is" if len(hot) == 1 else "lines are",
                            "it" if len(hot) == 1 else "them"))
        if tight:
            bits.append("{:,} consumable {} past {:.0f}% of the position"
                        .format(len(tight),
                                "line is" if len(tight) == 1 else "lines are",
                                CONS_TIGHT * 100))
        call.append("Worth knowing: " + " and ".join(bits) + ".")
    if long_out:
        call.append("{:,} {} been out longer than {} days.".format(
            len(long_out), "item has" if len(long_out) == 1 else "items have",
            LONG_OUT_DAYS))
    if undated:
        call.append("{:,} {} on hire with no issue transaction inside the "
                    "transactions export{}, so {} shown as undated rather "
                    "than guessed.".format(
                        len(undated),
                        "item is" if len(undated) == 1 else "items are",
                        " ({})".format(period) if period else "",
                        "it is" if len(undated) == 1 else "they are"))
    if idle_tool:
        call.append("The other way, {:,} units across {:,} lines haven't gone "
                    "out once - shelf space and hire we're carrying for "
                    "nothing.".format(idle_units, len(idle_tool)))
    #  The story lines (movements, own gear, demob) are added by build()
    #  once the story numbers are known - see parts["story"].

    #  What I need from you. Only the ones that actually apply, and each
    #  one names its own number so nobody has to go hunting for it.
    actions = []
    if hot:
        actions.append(("Top these up", "{:,} tooling {} marked Increase "
                        "Stock. Say the word and I'll get them on order."
                        .format(len(hot),
                                "line" if len(hot) == 1 else "lines")))
    if tight:
        actions.append(("Order consumables", "{:,} {} at {:.0f}% or more of "
                        "the position. Cheaper to order now than to run out "
                        "mid-shift.".format(
                            len(tight), "line" if len(tight) == 1 else "lines",
                            CONS_TIGHT * 100)))
    if long_out:
        actions.append(("Chase these back", "{:,} {} out longer than {} "
                        "days. Worth a call before it turns into a demob "
                        "problem.".format(
                            len(long_out),
                            "item" if len(long_out) == 1 else "items",
                            LONG_OUT_DAYS)))
    if undated:
        stock_dates = sorted(r[9] for r in undated if len(r) > 9 and r[9])
        w0 = (_PRINT.get("window") or (None, None))[0]
        if stock_dates and w0 and stock_dates[-1] < w0:
            #  Their stock dates are before the shut: no pull will date
            #  them, so the only useful ask is the second one.
            span = (stock_dates[0].strftime("%d %b %Y") if stock_dates[0] == stock_dates[-1]
                    else "{} to {}".format(stock_dates[0].strftime("%d %b"),
                                           stock_dates[-1].strftime("%d %b %Y")))
            actions.append(("Date the undated", "{:,} on-hire {} no issue transaction in "
                            "this export. {} SiteIQ stock date{} before the shut ({}). "
                            "Tell me which came back and I'll book them in; the rest "
                            "stay undated.".format(
                                len(undated), "item has" if len(undated) == 1 else "items have",
                                "Its" if len(undated) == 1 else "Their",
                                " is" if len(undated) == 1 else "s are", span)))
        else:
            actions.append(("Date the undated", "{:,} on-hire {} no issue "
                            "transaction in this export. Pull TRANSACTIONS from "
                            "the start of the shut. Or tell me which came back "
                            "and I'll book them in.".format(
                                len(undated),
                                "item has" if len(undated) == 1 else "items have")))
    if idle_tool:
        actions.append(("Or send it home", "{:,} units across {:,} lines "
                        "haven't moved at all. Nod and I'll off-hire them."
                        .format(idle_units, len(idle_tool))))
    if not actions:
        actions.append(("Nothing needed", "No exceptions today - the store "
                        "is tracking. Full detail is in the workbook."))

    #  ---- the tables. Numbers stay numbers so the bars can be drawn. --
    by_co = {}
    for row in summary_rows:
        by_co.setdefault(row[0], {})[row[1]] = row
    companies = []
    for co in sorted(by_co, key=lambda c: -(by_co[c].get("TOTAL",
                                                         [0] * 7)[2])):
        t = by_co[co].get("TOOLING", [co, "", 0, 0, 0, 0, 0])
        c = by_co[co].get("CONSUMABLES", [co, "", 0, 0, 0, 0, 0])
        if not (t[2] or c[2] or t[5]):
            continue
        companies.append([co, t[5], t[2], c[2], co_oldest.get(co)])

    #  Working hardest - the gear earning its keep, best turns first.
    hard = [r for r in tu if r[11] in ("High Demand", "Good Use")]
    hard.sort(key=lambda r: (-(r[5] / r[1] if r[1] else 0), -r[5]))
    hardest = [[item_name(r[0]), r[1], r[2], r[5], r[11], r[12]] for r in hard[:12]]

    #  Not moving - biggest holdings that have not gone out at all.
    idle_tool.sort(key=lambda r: -r[1])
    idle_rows = [[item_name(r[0]), r[1], r[2], r[12]] for r in idle_tool[:12]]

    #  Consumables worth watching - the ones running down, tightest first.
    watch = [r for r in cu if r[9] in ("High Demand", "Good Use")]
    watch.sort(key=lambda r: -r[4])
    cons = [[item_name(r[0]), r[1], r[2], r[4], r[10]] for r in watch[:12]]

    #  Out the longest - oldest open issue transactions. The item NUMBER
    #  rides along, because four lines all saying "Rio Tinto DropMat Kit"
    #  are four different kits and somebody has to go and find them.
    longest = [[r[3], item_name(r[2]), r[0], r[1], r[5], days_out(when, r[5])]
               for r in dated[:12]]

    #  ---- everything on hire, company by company, person by person ----
    #  Alphabetical both ways, because this is the list people scroll
    #  through looking for their own name. Same gear description twice
    #  in one name is counted, not repeated.
    roll = {}
    for r in det:
        co = _s(r[0]) or "(no company named)"
        who = _s(r[1]) or "(nobody named on it)"
        p = roll.setdefault(co, {}).setdefault(
            who, {"items": {}, "oldest": None, "n": 0, "undated": 0})
        desc = item_name(r[3]) or "(no description)"
        p["items"][desc] = p["items"].get(desc, 0) + 1
        p["n"] += 1
        if r[5] and (p["oldest"] is None or r[5] < p["oldest"]):
            p["oldest"] = r[5]
        if not r[5]:
            p["undated"] += 1

    on_hire_roll = []
    for co in sorted(roll, key=lambda c: c.upper()):
        people = []
        for who in sorted(roll[co], key=lambda w: w.upper()):
            d = roll[co][who]
            people.append({
                "who": who,
                "n": d["n"],
                "since": d["oldest"],
                "days": days_out(when, d["oldest"]) if d["oldest"] else None,
                "undated": d["undated"],
                #  Most-held first, then alphabetical.
                "gear": sorted(d["items"].items(),
                               key=lambda kv: (-kv[1], kv[0].upper())),
            })
        on_hire_roll.append({
            "company": co,
            "items": sum(p["n"] for p in people),
            "lines": len({g for p in people for g, _q in p["gear"]}),
            "undated": sum(p["undated"] for p in people),
            "people": people,
        })

    stamp = ", ".join(sorted({
        export_requested(p).strftime("%d %b %Y")
        for p in sources})) or when.strftime("%d %b %Y")

    return {"tiles": tiles, "flags": flags, "call": call, "actions": actions,
            "companies": companies, "hardest": hardest, "idle": idle_rows,
            "consumables": cons, "longest": longest, "source_stamp": stamp,
            "roll": on_hire_roll, "period": period, "pack_pages": 0,
            "long_out_days": LONG_OUT_DAYS, "cons_tight": CONS_TIGHT,
            "counts": {"onhire": len(det), "companies": n_companies,
                       "oldest_days": oldest_days, "hot": len(hot),
                       "tight": len(tight), "long_out": len(long_out),
                       "undated": len(undated), "idle_units": idle_units}}


# =====================================================================
#  The two hand-typed tabs - carried over, skinned, and totalled
# =====================================================================
#  Andrew types the roster and the cost breakdown himself. The rebuild
#  reads them out of the previous workbook and writes them back - every
#  value, every formula, every merged cell, at the same address - and
#  then dresses them in the same Coates look as the rest of the
#  workbook. Nothing he typed is recalculated or moved; only the
#  fonts, fills, borders and widths change.
#
#  If there is no previous workbook (a fresh kit), the Weipa tabs come
#  loaded with the roster and the cost breakdown as they stood on
#  04 Nov 2026 - the same rows, rates, names and formulas as his sheet
#  - ready to type into. Any other job gets an empty, headed tab.
#
#  The Cover wants a total off each tab. A workbook saved by Excel
#  carries the results of its formulas; one written by this kit does
#  not, so the totals are read if they are there and worked out with a
#  small, careful formula evaluator if they are not. Nothing it can't
#  understand is ever guessed - the Cover says TBC instead.
# =====================================================================
import re as _re

TYPED_DATE_FMT = "dddd, d mmmm yyyy"
TYPED_MONEY_FMT = '"$"#,##0.00'

#  The roster and cost breakdown as typed on 04 Nov 2026, used only when
#  there is no previous workbook to carry them over from.
_WEIPA_ROSTER = [
    # (date, shift, role, name, start, finish, hours)
    # Thomas Maher on days 06:00-18:00; Leon Swanepoel on nights 18:00-06:00
    # from Sun 1 Nov to Mon 9 Nov, No Shift Tue 10, Dayshift Wed 11.
    # Travel and No Shift are paid at the day rate. Corrected with Andrew
    # on 04 Nov 2026.
    ("2026-10-31", "Travel", "Tool Store Controller", "Thomas Maher", "06:30", "16:30", 10),
    ("2026-10-31", "Travel", "Tool Store Controller", "Leon Swanepoel", "06:30", "16:30", 10),
    ("2026-11-01", "Dayshift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-01", "NightShift", "Tool Store Controller", "Leon Swanepoel", "18:00", "06:00", 12),
    ("2026-11-02", "Dayshift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-02", "NightShift", "Tool Store Controller", "Leon Swanepoel", "18:00", "06:00", 12),
    ("2026-11-03", "Dayshift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-03", "NightShift", "Tool Store Controller", "Leon Swanepoel", "18:00", "06:00", 12),
    ("2026-11-04", "Dayshift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-04", "NightShift", "Tool Store Controller", "Leon Swanepoel", "18:00", "06:00", 12),
    ("2026-11-05", "Dayshift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-05", "NightShift", "Tool Store Controller", "Leon Swanepoel", "18:00", "06:00", 12),
    ("2026-11-06", "Dayshift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-06", "NightShift", "Tool Store Controller", "Leon Swanepoel", "18:00", "06:00", 12),
    ("2026-11-07", "Dayshift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-07", "NightShift", "Tool Store Controller", "Leon Swanepoel", "18:00", "06:00", 12),
    ("2026-11-08", "Dayshift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-08", "NightShift", "Tool Store Controller", "Leon Swanepoel", "18:00", "06:00", 12),
    ("2026-11-09", "Dayshift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-09", "NightShift", "Tool Store Controller", "Leon Swanepoel", "18:00", "06:00", 12),
    ("2026-11-10", "Dayshift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-10", "No Shift", "Tool Store Controller", "Leon Swanepoel", "06:00", "15:00", 8),
    ("2026-11-11", "Dayshift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-11", "Dayshift", "Tool Store Controller", "Leon Swanepoel", "06:00", "18:00", 12),
]
_WEIPA_RATES = [("Storeman Day", 80, "Dayshift"), ("Storeman Night", 90, "NightShift")]

#  MMG Shutdown, Dugald River - the roster Andrew sent on 05 Nov 2026.
#  Thomas Maher on days, Cody Mitchel on nights from Thu 26 Nov; fly-in
#  Sun 22 Nov, mobilisation 23-25 Nov, fly-out Wed 2 Dec at the day
#  rate. Day rate $90, night rate $100. Total $23,040.
#  Mon 30 Nov for Cody was labelled DayShift on the sheet but runs
#  18:00-06:00 at the night rate, so it is entered as NightShift.
#  As first sent on 05 Nov 2026 - kept so an untouched copy of it can be
#  recognised and updated to the corrected version below.
_MMG_ROSTER_0511 = [
    ("2026-11-22", "Fly In", "Tool Store Controller", "Thomas Maher", "14:00", "18:00", 4),
    ("2026-11-22", "Fly In", "Tool Store Controller", "Cody Mitchel", "14:00", "18:00", 4),
    ("2026-11-23", "Drive to Site (Mobilisation)", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-23", "Drive to Site (Mobilisation)", "Tool Store Controller", "Cody Mitchel", "06:00", "18:00", 12),
    ("2026-11-24", "Mobilisation Days", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-24", "Mobilisation Days", "Tool Store Controller", "Cody Mitchel", "06:00", "18:00", 12),
    ("2026-11-25", "Mobilisation Days", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-25", "Mobilisation Days", "Tool Store Controller", "Cody Mitchel", "06:00", "18:00", 12),
    ("2026-11-26", "DayShift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-26", "NightShift", "Tool Store Controller", "Cody Mitchel", "18:00", "06:00", 12),
    ("2026-11-27", "DayShift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-27", "NightShift", "Tool Store Controller", "Cody Mitchel", "18:00", "06:00", 12),
    ("2026-11-28", "DayShift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-28", "NightShift", "Tool Store Controller", "Cody Mitchel", "18:00", "06:00", 12),
    ("2026-11-29", "DayShift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-29", "NightShift", "Tool Store Controller", "Cody Mitchel", "18:00", "06:00", 12),
    ("2026-11-30", "DayShift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-30", "NightShift", "Tool Store Controller", "Cody Mitchel", "18:00", "06:00", 12),
    ("2026-12-01", "DayShift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-12-01", "NightShift", "Tool Store Controller", "Cody Mitchel", "18:00", "06:00", 12),
    ("2026-12-02", "Fly Out", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-12-02", "Fly Out", "Tool Store Controller", "Cody Mitchel", "18:00", "06:00", 12),
]
_MMG_RATES = [("Storeman Day", 90, "DayShift"), ("Storeman Night", 100, "NightShift")]

#  The MMG cost breakdown as typed for this shut; the labour column is
#  never typed - it reads off the roster day by day.
_MMG_COSTS_0511 = [
    # (day, status, shutdown/tooling, labour (always off the roster), site services, flights)
    # As sent 05 Nov 2026: tooling $1,847.81 and site services $50 a day from
    # Tue 24 Nov to Tue 1 Dec, flights $1,500 on the way in and out.
    ("2026-11-22", "Flight In", None, None, None, 1500),
    ("2026-11-23", "Drive to Site Mobilisation", None, None, None, None),
    ("2026-11-24", "Mobilisation", 1847.81, None, 50, None),
    ("2026-11-25", "Mobilisation", 1847.81, None, 50, None),
    ("2026-11-26", "Shutdown", 1847.81, None, 50, None),
    ("2026-11-27", "Shutdown", 1847.81, None, 50, None),
    ("2026-11-28", "Shutdown", 1847.81, None, 50, None),
    ("2026-11-29", "Shutdown", 1847.81, None, 50, None),
    ("2026-11-30", "Shutdown", 1847.81, None, 50, None),
    ("2026-12-01", "Shutdown", 1847.81, None, 50, None),
    ("2026-12-02", "Drive Off Site & Flight Out", None, None, None, 1500),
]

#  Corrected with Andrew on 05 Nov 2026: mobilisation Mon 23 and Tue 24
#  Nov, the shutdown - and day/night shifts - from Wed 25 Nov.
_MMG_ROSTER = [
    ("2026-11-22", "Fly In", "Tool Store Controller", "Thomas Maher", "14:00", "18:00", 4),
    ("2026-11-22", "Fly In", "Tool Store Controller", "Cody Mitchel", "14:00", "18:00", 4),
    ("2026-11-23", "Drive to Site (Mobilisation)", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-23", "Drive to Site (Mobilisation)", "Tool Store Controller", "Cody Mitchel", "06:00", "18:00", 12),
    ("2026-11-24", "Mobilisation Days", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-24", "Mobilisation Days", "Tool Store Controller", "Cody Mitchel", "06:00", "18:00", 12),
    ("2026-11-25", "DayShift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-25", "NightShift", "Tool Store Controller", "Cody Mitchel", "18:00", "06:00", 12),
    ("2026-11-26", "DayShift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-26", "NightShift", "Tool Store Controller", "Cody Mitchel", "18:00", "06:00", 12),
    ("2026-11-27", "DayShift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-27", "NightShift", "Tool Store Controller", "Cody Mitchel", "18:00", "06:00", 12),
    ("2026-11-28", "DayShift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-28", "NightShift", "Tool Store Controller", "Cody Mitchel", "18:00", "06:00", 12),
    ("2026-11-29", "DayShift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-29", "NightShift", "Tool Store Controller", "Cody Mitchel", "18:00", "06:00", 12),
    ("2026-11-30", "DayShift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-11-30", "NightShift", "Tool Store Controller", "Cody Mitchel", "18:00", "06:00", 12),
    ("2026-12-01", "DayShift", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-12-01", "NightShift", "Tool Store Controller", "Cody Mitchel", "18:00", "06:00", 12),
    ("2026-12-02", "Fly Out", "Tool Store Controller", "Thomas Maher", "06:00", "18:00", 12),
    ("2026-12-02", "Fly Out", "Tool Store Controller", "Cody Mitchel", "18:00", "06:00", 12),
]

#  The MMG cost breakdown, corrected 05 Nov 2026: the shutdown charges -
#  tooling $1,847.81 and site services $50 a day - run from Wed 25 Nov to
#  Tue 1 Dec; the two mobilisation days carry labour only; flights $1,500
#  each way. Labour is never typed - it reads off the roster day by day.
_MMG_COSTS = [
    # (day, status, shutdown/tooling, labour (always off the roster), site services, flights)
    ("2026-11-22", "Flight In", None, None, None, 1500),
    ("2026-11-23", "Drive to Site Mobilisation", None, None, None, None),
    ("2026-11-24", "Mobilisation", None, None, None, None),
    ("2026-11-25", "Shutdown", 1847.81, None, 50, None),
    ("2026-11-26", "Shutdown", 1847.81, None, 50, None),
    ("2026-11-27", "Shutdown", 1847.81, None, 50, None),
    ("2026-11-28", "Shutdown", 1847.81, None, 50, None),
    ("2026-11-29", "Shutdown", 1847.81, None, 50, None),
    ("2026-11-30", "Shutdown", 1847.81, None, 50, None),
    ("2026-12-01", "Shutdown", 1847.81, None, 50, None),
    ("2026-12-02", "Drive Off Site & Flight Out", None, None, None, 1500),
]

def job_seed(s, when=None):
    """The typed roster and cost breakdown for this job, or None. A seed
    is tied to the shut it was typed for: if the job's demob date (or,
    failing that, the report date) is more than 45 days outside the
    seed's own dates, it is last time's roster and does not apply."""
    tag = " ".join([s.short or "", s.job or "", s.customer or "",
                    s.project_schedule or ""]).lower()
    for key, seed in JOB_SEEDS.items():
        if key not in tag:
            continue
        days = []
        for row in seed.get("roster") or []:
            try:
                days.append(dt.datetime.strptime(str(row[0]), "%Y-%m-%d").date())
            except (ValueError, TypeError, IndexError):
                pass
        anchor = s.shutdown_end or when
        if days and anchor:
            slack = dt.timedelta(days=45)
            if anchor < min(days) - slack or anchor > max(days) + slack:
                return None
        return seed
    return None
_WEIPA_COSTS = [
    # (date, type, shutdown, labour, site services)  None = blank cell
    ("2026-10-31", "Flights", None, 1600, None),
    ("2026-11-01", "Mobilisation", 1638.56, 2040, 50),
    ("2026-11-02", "Mobilisation", 1638.56, 2040, 50),
    ("2026-11-03", "Shutdown", 1638.56, 2040, 50),
    ("2026-11-04", "Shutdown", 1638.56, 2040, 50),
    ("2026-11-05", "Shutdown", 1638.56, 2040, 50),
    ("2026-11-06", "Shutdown", 1638.56, 2040, 50),
    ("2026-11-07", "Shutdown", 1638.56, 2040, 50),
    ("2026-11-08", "Shutdown", 1638.56, 2040, 50),
    ("2026-11-09", "Shutdown", 1638.56, 2040, 50),
    ("2026-11-10", "Shutdown", 1638.56, 1600, 50),
    ("2026-11-11", "Shutdown", None, 1920, None),
]

#  Which seed a job gets, by a word in its short name or project.
JOB_SEEDS = {
    "weipa": {"roster": _WEIPA_ROSTER, "rates": _WEIPA_RATES, "costs": _WEIPA_COSTS,
              "flights": False, "stamp": "04 Nov 2026"},
    "mmg": {"roster": _MMG_ROSTER, "rates": _MMG_RATES, "costs": _MMG_COSTS,
            "flights": True, "stamp": "05 Nov 2026 (corrected)",
            #  Earlier versions of this seed. A carried tab that is still
            #  exactly one of these - nothing typed since - is updated to
            #  the current seed, with a note. Anything edited is left alone.
            "previous": [{"roster": _MMG_ROSTER_0511, "rates": _MMG_RATES,
                          "costs": _MMG_COSTS_0511, "flights": True,
                          "stamp": "05 Nov 2026",
                          "what": "mobilisation Mon 23 and Tue 24 Nov, the shutdown and "
                                  "its charges from Wed 25 Nov"}]},
}


def _d(text):
    return dt.datetime.strptime(text, "%Y-%m-%d")


def _t(text):
    h, m = text.split(":")
    return dt.time(int(h), int(m))


def seed_labour(ws, seed):
    """The job's roster, laid out the way Andrew's sheet is: the rates
    at the top, a heading row, a line per shift, the sums underneath.
    Cost is hours times the rate for the shift, so changing a rate or
    a shift type reprices the line by itself."""
    roster, rates = seed["roster"], seed["rates"]
    ws["A2"], ws["B2"], ws["C2"] = "Roles", "Rate", "Shift"
    for i, (role, rate, shift) in enumerate(rates, start=3):
        ws.cell(row=i, column=1, value=role)
        ws.cell(row=i, column=2, value=rate).number_format = TYPED_MONEY_FMT
        ws.cell(row=i, column=3, value=shift)
    heads = ["Date", "Shift", "Role", "Name", "Start Time", "Finish Time",
             "Total Hours", "Cost", "Total"]
    for i, h in enumerate(heads, start=1):
        ws.cell(row=5, column=i, value=h)
    r = 6
    for (day, shift, role, name, start, finish, hours) in roster:
        ws.cell(row=r, column=1, value=_d(day)).number_format = TYPED_DATE_FMT
        ws.cell(row=r, column=2, value=shift)
        ws.cell(row=r, column=3, value=role)
        ws.cell(row=r, column=4, value=name)
        ws.cell(row=r, column=5, value=_t(start)).number_format = "h:mm"
        ws.cell(row=r, column=6, value=_t(finish)).number_format = "h:mm"
        ws.cell(row=r, column=7, value=float(hours)).number_format = "0.0"
        ws.cell(row=r, column=8, value='=G{0}*IF($B{0}="NightShift",$B$4,$B$3)'
                .format(r)).number_format = TYPED_MONEY_FMT
        ws.cell(row=r, column=9, value="=H{0}".format(r)).number_format = TYPED_MONEY_FMT
        r += 1
    last = r - 1
    r += 1
    ws.cell(row=r, column=7, value="Total")
    ws.cell(row=r, column=8, value="=SUM(H6:H{})".format(last)).number_format = TYPED_MONEY_FMT
    ws.cell(row=r, column=9, value="=SUM(I6:I{})".format(last)).number_format = TYPED_MONEY_FMT
    return len(roster) + len(rates) + 3


def _same_as_seed(ws, name, prev):
    """True when a carried tab is, value for value, exactly what the kit
    seeded from `prev` - nothing typed since - so a corrected seed may
    replace it without losing anyone's work."""
    tmp = openpyxl.Workbook()
    t = tmp.active
    try:
        (seed_labour if name == "Coates Labour" else seed_costs)(t, prev)
    except Exception:
        return False

    def cells(w):
        out = {}
        for row in w.iter_rows(min_row=2):
            for c in row:
                v = c.value
                if v is None or v == "":
                    continue
                if isinstance(v, dt.datetime):
                    v = v.date()
                if isinstance(v, float) and v.is_integer():
                    v = int(v)
                if isinstance(v, str):
                    v = v.strip()
                out[(c.row, c.column)] = v
        return out
    same = cells(ws) == cells(t)
    tmp.close()
    return same


def seed_costs(ws, seed):
    """The day-by-day cost breakdown: a heading row, a line per day,
    the totals and the grand total, as on Andrew's sheet. Labour is not
    typed twice - each day's labour is the roster's own total for that
    date, so the two tabs cannot drift apart. Days with nothing typed
    in a column stay blank: blank is not zero."""
    flights = seed.get("flights")
    costs = seed.get("costs")
    if costs is None:
        #  No breakdown seeded for this job: the days come from the
        #  roster, the money columns are Andrew's to fill in.
        days = []
        for (day, shift, _role, _name, _a, _b, _h) in seed["roster"]:
            if day not in [d_ for d_, _k in days]:
                kind = ("Flight In" if "fly" in shift.lower() else
                        "Mobilisation" if "mobil" in shift.lower() else "Shutdown")
                days.append((day, kind))
        costs = [(day, kind, None, None, None, None) for day, kind in days]
    heads = ["Day", "Type", "Shutdown", "Labour", "Site Services"] + (["Flights"] if flights else [])
    for i, h in enumerate(heads, 1):
        ws.cell(row=2, column=i, value=h)
    first, last_r = 6, 5 + len(seed["roster"])
    r = 3
    for row in costs:
        day, kind = row[0], row[1]
        tooling = row[2] if len(row) > 2 else None
        site = row[4] if len(row) > 4 else None
        fl = row[5] if len(row) > 5 else None
        ws.cell(row=r, column=1, value=_d(day)).number_format = TYPED_DATE_FMT
        ws.cell(row=r, column=2, value=kind)
        for col, v in ((3, tooling), (5, site)) + (((6, fl),) if flights else ()):
            if v is not None:
                ws.cell(row=r, column=col, value=v).number_format = TYPED_MONEY_FMT
        ws.cell(row=r, column=4, value="=SUMIF('Coates Labour'!$A${0}:$A${1},$A{2},"
                "'Coates Labour'!$I${0}:$I${1})".format(first, last_r, r)
                ).number_format = TYPED_MONEY_FMT
        r += 1
    last = r - 1
    labels = [(3, "Total Tooling Shutdown"), (4, "Total Labour Shutdown"),
              (5, "Total Site Services Shutdown")] + ([(6, "Total Flights Shutdown")] if flights else [])
    for col, label in labels:
        ws.cell(row=r, column=col, value=label)
        ws.cell(row=r + 1, column=col, value="=SUM({0}3:{0}{1})".format(
            get_column_letter(col), last)).number_format = TYPED_MONEY_FMT
    endc = 6 if flights else 5
    ws.cell(row=r + 3, column=3, value="Total")
    ws.merge_cells(start_row=r + 3, start_column=3, end_row=r + 3, end_column=endc)
    ws.cell(row=r + 4, column=3, value="=SUM(C{0}:{1}{0})".format(r + 1, get_column_letter(endc))
            ).number_format = TYPED_MONEY_FMT
    ws.merge_cells(start_row=r + 4, start_column=3, end_row=r + 4, end_column=endc)
    return len(costs) + 4


# ---- a small formula evaluator, for totals only ----------------------
_TOK = _re.compile(r"\s*(?:(\d+\.?\d*(?:[eE][-+]?\d+)?)|(\"[^\"]*\")"
                   r"|((?:(?:'[^']+'|[A-Za-z_][A-Za-z0-9_]*)!)?\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?)"
                   r"|([A-Za-z_][A-Za-z0-9_.]*)|(<>|<=|>=|[-+*/^=<>(),]))")


def _tokens(src):
    pos, out = 0, []
    while pos < len(src):
        m = _TOK.match(src, pos)
        if not m or m.end() == pos:
            raise ValueError("can't read formula at " + src[pos:pos + 12])
        num, text, ref, name, op = m.groups()
        if num is not None:
            out.append(("num", float(num)))
        elif text is not None:
            out.append(("str", text[1:-1]))
        elif ref is not None:
            if "!" in ref:
                sheet, addr = ref.rsplit("!", 1)
                out.append(("ref", sheet + "!" + addr.replace("$", "").upper()))
            else:
                out.append(("ref", ref.replace("$", "").upper()))
        elif name is not None:
            out.append(("name", name.upper()))
        else:
            out.append(("op", op))
        pos = m.end()
    return out


class _Eval(object):
    """Evaluates the formulas these two tabs actually use: SUM, IF, the
    four operators, comparisons, cell references and ranges. Anything
    else raises, and the caller turns that into 'TBC'."""

    def __init__(self, ws):
        self.ws = ws
        self.wb = ws.parent
        self.cache = {}
        self.busy = set()

    def _where(self, coord, sheet):
        """A reference, with or without a sheet in front of it, as
        (worksheet, address, key)."""
        if "!" in coord:
            sheet, coord = coord.rsplit("!", 1)
            sheet = sheet.strip("'")
        ws = self.wb[sheet] if sheet else self.ws
        return ws, coord.replace("$", ""), (ws.title, coord.replace("$", ""))

    def cell(self, coord, sheet=None):
        ws, addr, key = self._where(coord, sheet)
        if key in self.cache:
            return self.cache[key]
        if key in self.busy:
            raise ValueError("circular reference at " + addr)
        v = ws[addr].value
        if isinstance(v, str) and v.startswith("="):
            self.busy.add(key)
            keep = self.ws
            self.ws = ws                     # the formula's own sheet
            try:
                v = self.formula(v)
            finally:
                self.ws = keep
                self.busy.discard(key)
        self.cache[key] = v
        return v

    def rng(self, text):
        sheet = None
        if "!" in text:
            sheet, text = text.rsplit("!", 1)
            sheet = sheet.strip("'")
        a, b = text.split(":")
        from openpyxl.utils.cell import coordinate_from_string, column_index_from_string
        ca, ra = coordinate_from_string(a.replace("$", ""))
        cb, rb = coordinate_from_string(b.replace("$", ""))
        c1, c2 = sorted((column_index_from_string(ca), column_index_from_string(cb)))
        r1, r2 = sorted((ra, rb))
        out = []
        for r in range(r1, r2 + 1):
            for c in range(c1, c2 + 1):
                out.append(self.cell("{}{}".format(get_column_letter(c), r), sheet))
        return out

    @staticmethod
    def same(a, b):
        """Excel-style equality for a SUMIF criterion."""
        if isinstance(a, dt.datetime):
            a = a.date()
        if isinstance(b, dt.datetime):
            b = b.date()
        if isinstance(a, str) or isinstance(b, str):
            return str(a if a is not None else "").strip().upper() == \
                   str(b if b is not None else "").strip().upper()
        if isinstance(a, dt.date) or isinstance(b, dt.date):
            return a == b
        try:
            return _Eval.num(a) == _Eval.num(b)
        except ValueError:
            return a == b

    def matches(self, value, crit):
        if isinstance(crit, str):
            m = _re.match(r"^(<>|<=|>=|<|>|=)(.*)$", crit.strip())
            if m:
                op, rest = m.group(1), m.group(2).strip()
                try:
                    a, b = self.num(value), float(rest)
                except ValueError:
                    a, b = str(value or "").upper(), rest.upper()
                return {"=": a == b, "<>": a != b, "<": a < b, ">": a > b,
                        "<=": a <= b, ">=": a >= b}[op]
        return self.same(value, crit)

    def formula(self, src):
        #  A formula can refer to a cell that holds another formula, so
        #  the parser's place is saved and put back around the nested
        #  evaluation - otherwise the inner one wipes the outer one's.
        saved = (getattr(self, "toks", None), getattr(self, "i", 0))
        try:
            self.toks = _tokens(src[1:])
            self.i = 0
            v = self.expr()
            if self.i != len(self.toks):
                raise ValueError("unexpected " + str(self.toks[self.i]))
            return v
        finally:
            self.toks, self.i = saved

    def peek(self, kind=None, val=None):
        if self.i >= len(self.toks):
            return False
        k, v = self.toks[self.i]
        return (kind is None or k == kind) and (val is None or v == val)

    def take(self):
        t = self.toks[self.i]
        self.i += 1
        return t

    @staticmethod
    def num(v):
        if v is None or v == "":
            return 0.0
        if isinstance(v, bool):
            return 1.0 if v else 0.0
        if isinstance(v, (int, float)):
            return float(v)
        if isinstance(v, dt.time):
            return (v.hour * 3600 + v.minute * 60 + v.second) / 86400.0
        if isinstance(v, dt.datetime):
            return float((v - dt.datetime(1899, 12, 30)).days)
        if isinstance(v, dt.date):
            return float((v - dt.date(1899, 12, 30)).days)
        try:
            return float(str(v).replace(",", "").replace("$", ""))
        except ValueError:
            raise ValueError("not a number: {!r}".format(v))

    def expr(self):
        left = self.add()
        while self.peek("op") and self.toks[self.i][1] in ("=", "<>", "<", ">", "<=", ">="):
            op = self.take()[1]
            right = self.add()
            a, b = left, right
            if isinstance(a, str) or isinstance(b, str):
                a, b = str(a or "").upper(), str(b or "").upper()
            else:
                a, b = self.num(a), self.num(b)
            left = {"=": a == b, "<>": a != b, "<": a < b, ">": a > b,
                    "<=": a <= b, ">=": a >= b}[op]
        return left

    def add(self):
        left = self.mul()
        while self.peek("op", "+") or self.peek("op", "-"):
            op = self.take()[1]
            right = self.mul()
            left = self.num(left) + self.num(right) if op == "+" else self.num(left) - self.num(right)
        return left

    def mul(self):
        left = self.unary()
        while self.peek("op", "*") or self.peek("op", "/") or self.peek("op", "^"):
            op = self.take()[1]
            right = self.unary()
            if op == "*":
                left = self.num(left) * self.num(right)
            elif op == "/":
                left = self.num(left) / self.num(right)
            else:
                left = self.num(left) ** self.num(right)
        return left

    def unary(self):
        if self.peek("op", "-"):
            self.take()
            return -self.num(self.unary())
        if self.peek("op", "+"):
            self.take()
            return self.unary()
        return self.atom()

    def atom(self):
        k, v = self.take()
        if k == "num" or k == "str":
            return v
        if k == "ref":
            return self.rng(v) if ":" in v else self.cell(v)
        if k == "op" and v == "(":
            inner = self.expr()
            if not self.peek("op", ")"):
                raise ValueError("missing )")
            self.take()
            return inner
        if k == "name":
            if v in ("TRUE", "FALSE"):
                return v == "TRUE"
            if not self.peek("op", "("):
                raise ValueError("unknown name " + v)
            self.take()
            args = []
            if not self.peek("op", ")"):
                args.append(self.expr())
                while self.peek("op", ","):
                    self.take()
                    args.append(self.expr())
            if not self.peek("op", ")"):
                raise ValueError("missing ) after " + v)
            self.take()
            return self.func(v, args)
        raise ValueError("unexpected token {} {!r}".format(k, v))

    def func(self, name, args):
        if name == "SUM":
            total = 0.0
            for a in args:
                for x in (a if isinstance(a, list) else [a]):
                    if x is None or x == "" or isinstance(x, str):
                        continue
                    total += self.num(x)
            return total
        if name == "IF":
            cond = args[0]
            truth = bool(self.num(cond)) if not isinstance(cond, str) else bool(cond)
            if truth:
                return args[1] if len(args) > 1 else True
            return args[2] if len(args) > 2 else False
        if name in ("SUMIF", "SUMIFS"):
            if name == "SUMIF":
                where, crit = args[0], args[1]
                what = args[2] if len(args) > 2 else args[0]
                pairs = [(where, crit)]
            else:
                what = args[0]
                pairs = list(zip(args[1::2], args[2::2]))
            what = what if isinstance(what, list) else [what]
            total = 0.0
            for i, x in enumerate(what):
                ok = True
                for where, crit in pairs:
                    where = where if isinstance(where, list) else [where]
                    if i >= len(where) or not self.matches(where[i], crit):
                        ok = False
                        break
                if ok and x not in (None, "") and not isinstance(x, str):
                    total += self.num(x)
            return total
        if name in ("ROUND",):
            return round(self.num(args[0]), int(self.num(args[1])) if len(args) > 1 else 0)
        if name in ("MIN", "MAX"):
            flat = [self.num(x) for a in args for x in (a if isinstance(a, list) else [a])
                    if x not in (None, "") and not isinstance(x, str)]
            return (min(flat) if name == "MIN" else max(flat)) if flat else 0.0
        raise ValueError("function not supported: " + name)


def _evaluated(ws, coord):
    """The value of one cell with its formula worked out, or None."""
    try:
        v = _Eval(ws).cell(coord)
        return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else None
    except Exception:
        return None


def typed_totals(ws, name, cached):
    """The number the Cover shows for a hand-typed tab. First the value
    Excel cached, if the old workbook had one; otherwise the tab's own
    total formula, evaluated; otherwise 0 (and the Cover says TBC)."""
    def is_formula(v):
        return isinstance(v, str) and v.startswith("=")
    #  The grand total cell: the SUM in the bottom-most row that has one,
    #  right-most column. On the roster that is the Total column's sum; on
    #  the cost breakdown it is the "Total" under the three totals.
    target = None
    for row in ws.iter_rows(min_row=2):
        for c in row:
            if is_formula(c.value) and "SUM(" in c.value.upper():
                if target is None or (c.row, c.column) > (target.row, target.column):
                    target = c
    if target is None:
        return 0.0
    if cached is not None:
        v = cached[name].cell(row=target.row, column=target.column).value
        if isinstance(v, (int, float)) and not isinstance(v, bool):
            return float(v)
    return _evaluated(ws, target.coordinate) or 0.0


# ---- the skin -------------------------------------------------------
def skin_typed(ws):
    """Dress a hand-typed tab in the Coates look without moving a thing.
    Reads the tab's own shape - heading rows are rows of words over a
    row of numbers, total rows are the ones with SUMs - and styles each
    kind the same way the built tabs are styled."""
    max_r = ws.max_row
    kinds = {}
    cells_of = {}
    for r in range(2, max_r + 1):
        cells = [c for c in ws[r] if c.value not in (None, "")]
        cells_of[r] = cells
        if not cells:
            kinds[r] = "blank"
            continue
        texts = [c for c in cells if isinstance(c.value, str) and not c.value.startswith("=")]
        sums = [c for c in cells if isinstance(c.value, str) and "SUM(" in c.value.upper()]
        dated = [c for c in cells if isinstance(c.value, (dt.datetime, dt.date))]
        if len(texts) == len(cells) and len(cells) == 1:
            #  One line of words on its own: a heading if a number or a
            #  formula sits under it (a 'Total' label), otherwise a note.
            below = ws.cell(row=r + 1, column=cells[0].column).value
            kinds[r] = ("head" if (isinstance(below, (int, float)) or
                                  (isinstance(below, str) and below.startswith("=")))
                        else "note")
        elif len(texts) == len(cells):
            kinds[r] = "head"
        elif sums and not dated:
            kinds[r] = "total"
        else:
            kinds[r] = "data"

    line = Side(style="thin", color=argb(COATES_LINE))
    box = Border(left=line, right=line, top=line, bottom=line)
    span_lo, span_hi = 1, max(ws.max_column, 1)
    stripe = 0
    for r in range(2, max_r + 1):
        kind = kinds[r]
        cells = cells_of[r]
        if kind == "blank":
            stripe = 0
            continue
        if kind == "note":
            c = cells[0]
            c.font = Font(name="Calibri", size=10, italic=True, color=MUTED)
            c.fill = PatternFill(fill_type=None)
            c.alignment = Alignment(vertical="center", indent=1)
            ws.row_dimensions[r].height = 17
            stripe = 0
            continue
        if kind == "head":
            span_lo = min(c.column for c in cells)
            span_hi = max(c.column for c in cells)
            #  A heading that is one merged cell wide keeps its merge.
            for col in range(span_lo, span_hi + 1):
                c = ws.cell(row=r, column=col)
                c.font = HDR_FONT
                c.fill = HDR_FILL
                c.border = HDR_BORDER
                c.alignment = Alignment(horizontal="center", vertical="center",
                                        wrap_text=True)
            ws.row_dimensions[r].height = 28
            stripe = 0
            continue
        if kind == "total":
            for col in range(span_lo, span_hi + 1):
                c = ws.cell(row=r, column=col)
                c.font = TOTAL_FONT
                c.fill = TOTAL_FILL
                c.border = Border(left=line, right=line, top=Side(style="medium", color=ORANGE), bottom=line)
                if isinstance(c.value, str) and c.value.startswith("="):
                    c.alignment = Alignment(horizontal="right", vertical="center")
                elif isinstance(c.value, str):
                    c.alignment = Alignment(horizontal="right", vertical="center")
            ws.row_dimensions[r].height = 22
            stripe = 0
            continue
        #  A data row: zebra within its block, typed alignment per cell.
        fill = BAND_FILL if stripe % 2 else None
        stripe += 1
        for col in range(span_lo, span_hi + 1):
            c = ws.cell(row=r, column=col)
            v = c.value
            bold = bool(c.font and c.font.bold) and isinstance(v, str) and col == span_lo
            c.font = Font(name="Calibri", size=11, bold=bold, color=NEAR_BLACK)
            c.border = box
            if fill is not None:
                c.fill = fill
            else:
                c.fill = PatternFill(fill_type=None)
            if isinstance(v, (dt.datetime, dt.date)) and not isinstance(v, dt.time):
                c.alignment = Alignment(horizontal="left", vertical="center", indent=1)
            elif isinstance(v, dt.time):
                c.alignment = Alignment(horizontal="center", vertical="center")
            elif isinstance(v, (int, float)) or (isinstance(v, str) and v.startswith("=")):
                c.alignment = Alignment(horizontal="right", vertical="center")
            else:
                c.alignment = Alignment(horizontal="left", vertical="center", indent=1)
        ws.row_dimensions[r].height = 19

    #  Widths: dates need room (a long date in a narrow column prints as
    #  ########), money and times need less. Never narrower than typed.
    for col in range(1, max(ws.max_column, 1) + 1):
        letter = get_column_letter(col)
        longest = 0
        for r in range(2, max_r + 1):
            v = ws.cell(row=r, column=col).value
            if v in (None, ""):
                continue
            if isinstance(v, (dt.datetime, dt.date)):
                longest = max(longest, 30)
            elif isinstance(v, str) and v.startswith("="):
                longest = max(longest, 13)
            else:
                longest = max(longest, len(str(v)) + 3)
        want = min(max(longest, 12), 44)
        have = ws.column_dimensions[letter].width or 0
        ws.column_dimensions[letter].width = max(want, have if have > 12 else 0)

    #  Freeze under the widest heading row, so a long roster scrolls with
    #  its headings in view.
    heads = [r for r in kinds if kinds[r] == "head"]
    if heads:
        main = max(heads, key=lambda r: len(cells_of[r]))
        ws.freeze_panes = "A{}".format(main + 1)
        ws.print_title_rows = "1:{}".format(main)
    ws.sheet_view.showGridLines = False


def roster_hours(ws, when):
    """Hours and shifts per person off the Coates Labour tab, up to the
    report date, however the tab is laid out: it finds the heading row
    that carries Name and Total Hours, and fills a blank date down from
    the row above (night-shift rows are often typed without one)."""
    head_row = None
    cols = {}
    for r in range(1, min(ws.max_row, 12) + 1):
        labels = {}
        for c in ws[r]:
            if isinstance(c.value, str):
                labels[c.value.strip().lower()] = c.column
        if "name" in labels and any(k.startswith("total hours") for k in labels):
            head_row = r
            cols = {"date": labels.get("date"), "shift": labels.get("shift"),
                    "name": labels.get("name"),
                    "hours": next(v for k, v in labels.items() if k.startswith("total hours")),
                    "start": next((v for k, v in labels.items() if k.startswith("start")), None),
                    "finish": next((v for k, v in labels.items() if k.startswith("finish")), None)}
            break
    empty = {"hours": 0.0, "people": {}, "rostered": 0.0, "first": None, "last": None,
             "rows": []}
    if head_row is None or not cols.get("name"):
        return empty
    people, total, rostered, current = {}, 0.0, 0.0, None
    first = last = None
    rows = []                                    # (date, name, shift, hours, start, finish)
    for r in range(head_row + 1, ws.max_row + 1):
        d0 = _date(ws.cell(row=r, column=cols["date"]).value) if cols.get("date") else None
        if d0 is not None:
            current = d0
        name = _s(ws.cell(row=r, column=cols["name"]).value)
        hrs = _n(ws.cell(row=r, column=cols["hours"]).value)
        shift = _s(ws.cell(row=r, column=cols["shift"]).value) if cols.get("shift") else ""
        if not name or not hrs or current is None:
            continue
        p = people.setdefault(name, {"hours": 0.0, "rostered": 0.0, "shifts": []})
        rows.append((current, name, shift, hrs,
                     ws.cell(row=r, column=cols["start"]).value if cols.get("start") else None,
                     ws.cell(row=r, column=cols["finish"]).value if cols.get("finish") else None))
        p["rostered"] += hrs
        rostered += hrs
        first = current if first is None else min(first, current)
        last = current if last is None else max(last, current)
        if shift and shift not in p["shifts"]:
            p["shifts"].append(shift)
        if current <= when:
            total += hrs
            p["hours"] += hrs
    return {"hours": total, "people": people, "rostered": rostered,
            "first": first, "last": last, "rows": rows}


# =====================================================================
#  Looking ahead - the shut from the roster, the counter's rhythm from
#  the record, the cost curve from the typed tabs (workbook only)
# =====================================================================
PHASES = (("travel", "Travel", "#98A0AA"), ("mob", "Mobilisation", "#F7A072"),
          ("day", "Day shift", "#F26222"), ("night", "Night shift", "#2A313C"),
          ("off", "No shift", "#EEF0F3"))
PHASE_COLOUR = dict((k, c) for k, _l, c in PHASES)
PHASE_LABEL = dict((k, l) for k, l, _c in PHASES)
PHASE_ORDER = [k for k, _l, _c in PHASES]


def _hour_of(v):
    """The hour of day, 0-23, from a time the way SiteIQ writes it -
    '06:57:58', '03:19 PM' or a time object - or None."""
    if v is None or v == "":
        return None
    if isinstance(v, (dt.datetime, dt.time)):
        return v.hour
    t = str(v).strip().upper()
    m = _re.match(r"^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(AM|PM)?$", t)
    if not m:
        return None
    h = int(m.group(1))
    ap = m.group(4)
    if ap == "PM" and h < 12:
        h += 12
    if ap == "AM" and h == 12:
        h = 0
    return h if 0 <= h <= 23 else None


def _hhmm(v):
    """A time the way the roster shows it - 06:00 - whatever Excel
    stored: text, a time, a datetime or a day fraction."""
    if v is None or v == "":
        return ""
    if isinstance(v, (dt.datetime, dt.time)):
        return v.strftime("%H:%M")
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        mins = int(round(float(v) * 24 * 60)) % (24 * 60)
        return "{:02d}:{:02d}".format(mins // 60, mins % 60)
    t = str(v).strip()
    h = _hour_of(t)
    if h is None:
        return t
    m = _re.search(r":(\d{2})", t)
    return "{:02d}:{}".format(h, m.group(1) if m else "00")


def _phase(shift):
    """What kind of day a roster line is, from however it was typed."""
    z = (shift or "").strip().lower()
    if not z:
        return "off"
    if "night" in z:
        return "night"
    if "no shift" in z or z in ("off", "rdo", "rest", "day off", "rest day"):
        return "off"
    if any(w in z for w in ("fly", "flight", "drive", "travel", "demob")):
        return "travel"
    if "mob" in z:
        return "mob"
    return "day"


def _words(n):
    return {10: "ten", 11: "eleven", 12: "twelve", 13: "thirteen", 14: "fourteen",
            15: "fifteen", 16: "sixteen", 17: "seventeen", 18: "eighteen"}.get(n, str(n))


def _nice_ceiling(v):
    """A round number at or above v, for a chart's top gridline."""
    import math
    if v <= 0:
        return 1
    mag = 10 ** math.floor(math.log10(v))
    for m in (1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10):
        if m * mag >= v:
            return m * mag
    return 10 * mag


def cost_profile(ws):
    """The Cost Breakdown tab read day by day: which columns carry money,
    what each day of the shut costs and the running total. Works off the
    tab's own heading row - the one with Day or Date in it - so it
    follows whatever has been typed. None if there is no such row."""
    head_row, cols, date_col = None, {}, None
    for r in range(1, min(ws.max_row, 8) + 1):
        labels = {}
        for c in ws[r]:
            if isinstance(c.value, str) and c.value.strip():
                labels[c.column] = c.value.strip()
        date_cols = [k for k, v in labels.items() if v.lower() in ("day", "date", "dates")]
        if date_cols and len(labels) >= 3:
            head_row, cols, date_col = r, labels, date_cols[0]
            break
    if head_row is None:
        return None
    type_col = next((k for k, v in cols.items()
                     if v.lower() in ("type", "status", "phase", "activity", "stage")), None)
    money_cols = [(k, v) for k, v in sorted(cols.items()) if k not in (date_col, type_col)]
    ev = _Eval(ws)
    days = []
    for r in range(head_row + 1, ws.max_row + 1):
        cells = [c for c in ws[r] if c.value not in (None, "")]
        if not cells:
            continue
        d0 = _date(ws.cell(row=r, column=date_col).value)
        if d0 is None:
            if any(isinstance(c.value, str) and "SUM(" in c.value.upper() for c in cells):
                break                          # the totals - the day rows are done
            continue
        vals = {}
        for k, name in money_cols:
            c = ws.cell(row=r, column=k)
            v = c.value
            if isinstance(v, str) and v.startswith("="):
                try:
                    v = ev.cell(c.coordinate)
                except Exception:
                    v = None
            vals[name] = (float(v) if isinstance(v, (int, float)) and not isinstance(v, bool)
                          else 0.0)
        label = _s(ws.cell(row=r, column=type_col).value) if type_col else ""
        days.append((d0, label, vals))
    if not days:
        return None
    names = [n for _k, n in money_cols]
    totals = dict((n, sum(v.get(n, 0.0) for _d, _l, v in days)) for n in names)
    names = [n for n in names if totals[n]]
    if not names:
        return None
    out, run = [], 0.0
    for d0, label, vals in days:
        day_total = sum(vals.get(n, 0.0) for n in names)
        run += day_total
        out.append((d0, label, dict((n, vals.get(n, 0.0)) for n in names), day_total, run))
    return {"columns": names, "days": out,
            "totals": dict((n, totals[n]) for n in names), "total": run}


AGE_BANDS = (("today", 0, 0), ("1-3 days", 1, 3), ("4-7 days", 4, 7),
             ("8-20 days", 8, 20), ("21+ days", 21, 10 ** 6))


AGE_TONES = {"today": "ink", "1-3 days": "muted", "4-7 days": "slate",
             "8-20 days": "amber", "21+ days": "red"}


def age_bands(rows):
    """How old what is out is: (label, count, tone) per band, undated
    last. rows are Detailed Onhire rows (days on hire at index 7). The
    first three bands shade from charcoal to slate - age, not alarm;
    watch is amber, overdue is red, undated is amber."""
    out = []
    for label, lo, hi in AGE_BANDS:
        n = len([r for r in rows if r[7] is not None and lo <= r[7] <= hi])
        out.append((label, n, AGE_TONES[label]))
    und = len([r for r in rows if r[7] is None])
    out.append(("undated", und, "amber"))
    return out


def out_by_day(tooling_tx, days):
    """Gear out at the end of each day: issues that had started by then
    and had not come back - the on-hire line across the shut."""
    spans = []
    for r in tooling_tx:
        a, b = _date(r.get("TRAN_START_DATE")), _date(r.get("TRAN_END_DATE"))
        if a:
            spans.append((a, b))
    return [(d0, sum(1 for a, b in spans if a <= d0 and (b is None or b > d0)))
            for d0 in days]


def shut_progress(fc, when):
    """Where the shut is up to, from the roster: a phase per day, which
    day we are on, and one line to say it. None without a roster."""
    if not fc:
        return None
    days = fc["days"]
    order = {k: i for i, k in enumerate(PHASE_ORDER)}
    phases = []
    for d0 in days:
        cells = [g.get(d0) for g in fc["grid"].values() if g.get(d0)]
        kinds = [c[0] for c in cells if c[0] != "off"]
        if not kinds:
            phases.append((d0, "off"))
            continue
        #  the day's phase is what most people on it are doing
        best = max(set(kinds), key=lambda k: (kinds.count(k), -order[k]))
        phases.append((d0, best))
    total = len(days)
    first, last = days[0], days[-1]
    if when < first:
        n_away = (first - when).days
        label = "Starts {}  \u00b7  {} day{} away".format(
            first.strftime("%a %d %b"), n_away, "" if n_away == 1 else "s")
        day_n = 0
    else:
        day_n = min(total, (when - first).days + 1)
        left = (last - when).days
        label = "Day {} of {}  \u00b7  {} {}".format(
            day_n, total, "fly out" if fc["milestones"][3][0].lower().startswith("fly") else "demob",
            last.strftime("%a %d %b"))
    return {"days": phases, "today": when, "day_n": day_n, "total": total,
            "state": fc["state"], "label": label, "first": first, "last": last}


HISTORY_COLS = ("date", "onhire", "companies", "moves", "draws", "undated", "long_out", "same_day",
                "basis")


def _moves_delta(prev, moves_now, draws_now):
    """(delta, what) for 'since the last report'. A previous report that
    counted draws the old way - every sale SALES_STOCK has ever carried -
    cannot be compared on draws, so against one of those the delta is
    tooling moves only, and says so. From the next report on, history
    carries basis=window_time and the full comparison returns. Older
    day-only windows cannot be compared with exact shift-time windows."""
    if not prev or prev.get("moves") is None:
        return None, None
    if prev.get("basis") == "window_time" and _PRINT.get("draws_basis", "window_time") == "window_time":
        return ((moves_now + draws_now)
                - ((prev.get("moves") or 0) + (prev.get("draws") or 0)), "movements")
    return moves_now - (prev.get("moves") or 0), "tooling moves"


def history_path(base, s):
    return os.path.join(base, s.reports_dirname, "history.csv")


def read_history(base, s):
    """Every report day's headline counts, oldest first."""
    import csv
    p = history_path(base, s)
    out = []
    if not os.path.isfile(p):
        return out
    with open(p, encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            try:
                d0 = dt.datetime.strptime(row["date"], "%Y-%m-%d").date()
            except Exception:
                continue
            rec = {"day": d0}
            for k in HISTORY_COLS[1:]:
                v = (row.get(k) or "").strip()
                if k == "basis":
                    rec[k] = v or None
                else:
                    rec[k] = int(float(v)) if v not in ("", "None") else None
            out.append(rec)
    out.sort(key=lambda r: r["day"])
    return out


def write_history(base, s, when, counts):
    """Add (or replace) today's line in Reports\\history.csv."""
    import csv
    rows = [r for r in read_history(base, s) if r["day"] != when]
    rec = {"day": when}
    rec.update(counts)
    rows.append(rec)
    rows.sort(key=lambda r: r["day"])
    p = history_path(base, s)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(HISTORY_COLS)
        for r in rows:
            w.writerow([r["day"].strftime("%Y-%m-%d")] + [r.get(k, "") if r.get(k) is not None else ""
                                                         for k in HISTORY_COLS[1:]])


def previous_report(base, s, when):
    """The newest earlier report, read back for its headline counts so
    today's numbers can say what moved: from Reports\\history.csv when
    it has one, else from the earlier day's workbook. None when there is
    no earlier day to compare with."""
    earlier = [r for r in read_history(base, s) if r["day"] < when and r.get("onhire") is not None]
    if earlier:
        return earlier[-1]
    root = os.path.join(base, s.reports_dirname)
    if not os.path.isdir(root):
        return None
    today = when.strftime("%Y-%m-%d")
    for day in sorted(os.listdir(root), reverse=True):
        if day >= today or not _re.match(r"^\d{4}-\d{2}-\d{2}$", day):
            continue
        books = [f for f in os.listdir(os.path.join(root, day))
                 if f.lower().endswith(".xlsx") and "workbook" in f.lower()
                 and "latest" not in f.lower()]
        if not books:
            continue
        path = os.path.join(root, day, sorted(books)[-1])
        try:
            wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        except Exception:
            continue
        try:
            out = {"day": dt.datetime.strptime(day, "%Y-%m-%d").date()}
            if "Detailed Onhire" not in wb.sheetnames:
                continue
            ws = wb["Detailed Onhire"]
            rows = list(ws.iter_rows(min_row=2, values_only=True))
            head = [str(c or "") for c in rows[0]] if rows else []
            issued = next((i for i, h in enumerate(head) if h.lower().startswith("issued")), None)
            body = [r for r in rows[1:] if r and r[0] not in (None, "")]
            out["onhire"] = len(body)
            out["companies"] = len({r[0] for r in body})
            out["undated"] = (len([r for r in body if issued is not None and r[issued] in (None, "")])
                              if issued is not None else None)
            for key, sheet in (("moves", "Tooling Transactions"), ("draws", "Consumable Transactions")):
                if sheet in wb.sheetnames:
                    out[key] = len([r for r in wb[sheet].iter_rows(min_row=3, values_only=True)
                                    if r and r[0] not in (None, "")])
            return out
        except Exception:
            continue
        finally:
            try:
                wb.close()
            except Exception:
                pass
    return None


def delta_text(now, prev, prev_day, what=""):
    """'\u25b2 12 since 05 Nov', '\u25bc 3 since 05 Nov' or 'level with 05 Nov'."""
    if prev is None:
        return ""
    diff = now - prev
    day = prev_day.strftime("%d %b")
    if diff > 0:
        return "\u25b2 {:,}{} since {}".format(diff, what, day)
    if diff < 0:
        return "\u25bc {:,}{} since {}".format(-diff, what, day)
    return "level with {}".format(day)


def forecast_block(s, when, roster, wb, tooling_tx, ctx, own, parts, period,
                   ref_label, labour_total, cost_total):
    """Everything the pack's Looking ahead page, the email's card and the
    workbook's Forecast tab are drawn from. None when there is nothing
    ahead - no roster, or one that finished before the report date."""
    rows = [r for r in (roster or {}).get("rows") or [] if r[0] and r[1]]
    if not rows:
        return None
    dates = sorted({r[0] for r in rows})
    first, last = dates[0], dates[-1]
    demob = s.shutdown_end
    if demob and demob > last:
        last = demob
    if last < when:
        return None                            # the shut is over
    days = []
    d0 = first
    while d0 <= last:
        days.append(d0)
        d0 += dt.timedelta(days=1)

    grid, order, hours_by, done_by, times = {}, [], {}, {}, {}
    for d0, name, shift, hrs, t0, t1 in rows:
        ph = _phase(shift)
        g = grid.setdefault(name, {})
        prev = g.get(d0)
        if prev and prev[0] in ("day", "night") and ph not in ("day", "night"):
            g[d0] = (prev[0], prev[1], prev[2] + hrs)
        else:
            g[d0] = (ph, shift, hrs + (prev[2] if prev else 0.0))
        if name not in order:
            order.append(name)
        hours_by[name] = hours_by.get(name, 0.0) + hrs
        if d0 <= when:
            done_by[name] = done_by.get(name, 0.0) + hrs
        a, b = _hhmm(t0), _hhmm(t1)
        if a or b:
            c = times.setdefault(ph, {})
            c[(a, b)] = c.get((a, b), 0) + 1
    phase_time = {}
    for ph, c in times.items():
        (a, b), _n = max(c.items(), key=lambda kv: kv[1])
        phase_time[ph] = "{}-{}".format(a, b) if (a and b) else (a or b)
    people = []
    for name in order:
        phs = sorted({cell[0] for cell in grid[name].values()}, key=PHASE_ORDER.index)
        people.append((name, hours_by[name], done_by.get(name, 0.0), phs))
    phases_used = sorted({cell[0] for g in grid.values() for cell in g.values()},
                         key=PHASE_ORDER.index)
    shift_days = sorted({d_ for d_, _n, sh, _h, _a, _b in rows if _phase(sh) in ("day", "night")})
    open_day = shift_days[0] if shift_days else first
    close_day = shift_days[-1] if shift_days else dates[-1]
    nights = "night" in phases_used
    hours = sum(hours_by.values())
    hours_done = sum(done_by.values())
    state = "ahead" if first > when else "underway"
    first_travel = any(cell[0] == "travel" for g in grid.values() for cell in [g.get(first)] if cell)
    last_travel = any(cell[0] == "travel" for g in grid.values() for cell in [g.get(dates[-1])] if cell)

    def who():
        bits = []
        for name, _h, _d, phs in people:
            if "day" in phs and "night" in phs:
                bits.append("{} on days and nights".format(name))
            elif "night" in phs:
                bits.append("{} on nights".format(name))
            elif "day" in phs:
                bits.append("{} on days".format(name))
            else:
                bits.append(name)
        if len(bits) <= 3:
            return " and ".join([", ".join(bits[:-1]), bits[-1]]) if len(bits) > 1 else bits[0]
        return "{} Coates people".format(len(bits))

    # ---- last time: the counter's rhythm, off the exports -------------
    v = parts.get("viz") or {}
    bd = v.get("by_day") or []
    ref_days = [dd for dd, _i, _r, _c in bd]
    totals = [i + r + c for _d, i, r, c in bd]
    moves = sum(totals)
    n_ref = len(bd)
    peak_k = max(range(len(totals)), key=lambda k: totals[k]) if totals else None
    win = (ref_days[0], ref_days[-1]) if ref_days else None

    def inwin(d_):
        return win is None or (d_ is not None and win[0] <= d_ <= win[1])
    hour = [0] * 24
    for r in tooling_tx:
        for dk, tk in (("TRAN_START_DATE", "TRAN_START_TIME"), ("TRAN_END_DATE", "TRAN_END_TIME")):
            if inwin(_date(r.get(dk))):
                h = _hour_of(r.get(tk))
                if h is not None:
                    hour[h] += 1
    qty = {}
    for r in ctx:
        if inwin(r[4]):
            h = _hour_of(r[5])
            if h is not None:
                hour[h] += 1
            nm = item_name(r[2])
            qty[nm] = qty.get(nm, 0.0) + (r[3] or 0.0)
    for r in own or []:
        for dk, tk in (("TRAN_START_DATE", "TRAN_START_TIME"), ("TRAN_END_DATE", "TRAN_END_TIME")):
            if inwin(_date(r.get(dk))):
                h = _hour_of(r.get(tk))
                if h is not None:
                    hour[h] += 1
    scans = sum(hour)
    busy = sorted((h for h in range(24) if hour[h] > 0), key=lambda h: -hour[h])[:2]
    busy = sorted(busy)
    busy_share = (sum(hour[h] for h in busy) / float(scans)) if scans else 0.0
    st = parts.get("story") or {}
    ret = (st.get("same_day") or 0) + (st.get("kept") or 0)
    same_day_pct = (100.0 * st["same_day"] / ret) if ret else None
    tool_issues = {}
    for row in tooling_tx:
        description = item_name(row.get("SKU/ITEM DESCRIPTION")) or "(no description)"
        tool_issues[description] = tool_issues.get(description, 0) + 1
    top_tools = sorted(tool_issues.items(), key=lambda kv: (-kv[1], kv[0].upper()))[:7]
    top_cons = sorted(qty.items(), key=lambda kv: (-kv[1], kv[0]))[:7]
    newest = ref_days[-1] if ref_days else None
    ref_previous = bool(newest and newest < first)
    ref_span = ("{} to {}".format(ref_days[0].strftime("%d %b"), ref_days[-1].strftime("%d %b %Y"))
                if ref_days else (period or ""))
    ref = {"label": ref_label or s.project_schedule or "the last export", "span": ref_span,
           "previous": ref_previous, "days": n_ref, "moves": moves,
           "per_day": (moves / float(n_ref)) if n_ref else 0.0,
           "peak": totals[peak_k] if peak_k is not None else 0,
           "peak_day": ref_days[peak_k] if peak_k is not None else None,
           "hour": hour, "busy": busy, "busy_share": busy_share, "scans": scans,
           "same_day_pct": same_day_pct, "companies": st.get("companies_active") or 0,
           "people": st.get("people") or 0, "own": len(own or []),
           "top_tools": top_tools, "top_cons": top_cons}

    # ---- the words everything shares ------------------------------------
    job = s.job or s.header_line
    n_people = len(people)
    if state == "ahead":
        brief = ("{} runs {} to {} - {} day{} on site, {} day{} from today. {} {} {}; "
                 "the counter opens {} and is covered {} through {}{}. {:,.0f} rostered "
                 "hours in all.".format(
                     job, first.strftime("%A %d %B"), last.strftime("%A %d %B %Y"),
                     len(days), "" if len(days) == 1 else "s", (first - when).days,
                     "" if (first - when).days == 1 else "s",
                     who(), ("flies in" if n_people == 1 else "fly in") if first_travel
                     else ("starts" if n_people == 1 else "start"), first.strftime("%a %d %b"),
                     open_day.strftime("%a %d %b"),
                     "day and night" if nights else "on day shift", close_day.strftime("%a %d %b"),
                     (", {} {}".format("fly out" if last_travel else "demob",
                                       last.strftime("%a %d %b"))),
                     hours))
    else:
        left = (last - when).days
        brief = ("{} is {} day{} in, with {} day{} to go to {}. {} - {:,.0f} of {:,.0f} "
                 "rostered hours worked so far; {} cover continues through {}{}.".format(
                     job, (when - first).days + 1, "" if (when - first).days + 1 == 1 else "s",
                     left, "" if left == 1 else "s", last.strftime("%A %d %B"),
                     who(), hours_done, hours,
                     "day and night" if nights else "day shift", close_day.strftime("%a %d %b"),
                     (", {} {}".format("fly out" if last_travel else "demob",
                                       last.strftime("%a %d %b")) if last != close_day else "")))
    if moves and n_ref:
        lead = ("Last time ({}, {})".format(ref["label"], ref_span) if ref_previous
                else "So far this shut ({})".format(ref_span))
        peak_hours = " and ".join("{:02d}:00".format(h) for h in busy)
        ref_line = ("{}, the counter handled {:,} movement{} in {} day{} - about {:,.0f} a day, "
                    "peaking at {:,} on {}{}.".format(
                        lead, moves, "" if moves == 1 else "s", n_ref, "" if n_ref == 1 else "s", ref["per_day"],
                        ref["peak"], ref["peak_day"].strftime("%A %d %B"),
                        " - and was busiest at " + peak_hours if busy else ""))
    else:
        ref_line = "No movements in the exports to set an expectation from."
    milestones = [
        ("Fly in" if first_travel else "Starts", first.strftime("%a %d %b"),
         "{} Coates {}".format(n_people, "person" if n_people == 1 else "people")),
        ("Counter opens", open_day.strftime("%a %d %b"),
         "day and night" if nights else "day shift"),
        ("Last shift", close_day.strftime("%a %d %b"),
         "{} shift day{}".format(len(shift_days), "" if len(shift_days) == 1 else "s")),
        ("Fly out" if last_travel else "Demob", last.strftime("%a %d %b"),
         "{} day{} on site".format(len(days), "" if len(days) == 1 else "s")),
        ("Rostered hours", "{:,.0f}".format(hours),
         ("{:,.0f} worked to date".format(hours_done) if state == "underway"
          else "{} from {}".format("day and night" if nights else "days", open_day.strftime("%d %b")))),
    ]
    cost = None
    if "Cost Breakdown" in wb.sheetnames:
        try:
            cost = cost_profile(wb["Cost Breakdown"])
        except Exception:
            cost = None
    return {"job": job, "state": state, "today": when, "first": first, "last": last,
            "days": days, "people": people, "grid": grid, "phases_used": phases_used,
            "times": phase_time, "hours": hours, "hours_done": hours_done,
            "open": open_day, "close": close_day, "shift_days": len(shift_days),
            "nights": nights, "demob": demob, "brief": brief, "ref_line": ref_line,
            "milestones": milestones, "ref": ref, "cost": cost,
            "labour_total": labour_total, "cost_total": cost_total}


def carry_over(wb, s, base, title, when=None):
    """Copy Andrew's hand-typed tabs out of the existing workbook -
    values, formulas, dates and times exactly as he left them, at the
    same addresses - then skin them. If the old workbook isn't there,
    the Weipa tabs come loaded with the roster and the cost breakdown;
    any other job's come through headed and empty, ready to type into."""
    src = s.workbook(base)
    if not src:
        candidates = sorted(glob.glob(os.path.join(glob.escape(base), "*_Onhire_Workbook_LATEST.xlsx")))
        if len(candidates) == 1:
            src = candidates[0]
    carried, labour_total, cost_total = [], 0.0, 0.0
    roster = {"hours": 0.0, "people": {}, "rostered": 0.0, "first": None, "last": None,
              "rows": []}
    old = None
    if src and os.path.isfile(src):
        try:
            old = openpyxl.load_workbook(src, data_only=False)
        except Exception as e:
            say("  WARN | Could not read {} ({}). The two hand-typed "
                  "tabs come through blank.".format(os.path.basename(src), e))

    #  The typed values with formulas resolved, where Excel saved them.
    vals = None
    if src and os.path.isfile(src):
        try:
            vals = openpyxl.load_workbook(src, data_only=True)
        except Exception:
            vals = None

    seed = job_seed(s, when)
    weipa = seed is not None
    stale_roster = False
    use_latest = False
    #  The kit's own LATEST workbook, if the .xlsm is not the source.
    latest_path = os.path.join(base, latest_workbook_name(
        s.short or s.customer or "Shutdown"))
    if not os.path.isfile(latest_path):
        #  The job was renamed in JOB.txt mid-shut, so the LATEST workbook
        #  carries the old name. One candidate is unambiguous; take it.
        others = sorted(glob.glob(os.path.join(base, "*_Onhire_Workbook_LATEST.xlsx")))
        if len(others) == 1:
            latest_path = others[0]
            try:
                say("  NOTE | Carrying the typed tabs from {} (the job's name in JOB.txt "
                    "has changed).".format(os.path.basename(latest_path)))
            except Exception:
                pass
    latest_wb = None
    if src and os.path.isfile(latest_path) and \
            os.path.normcase(os.path.abspath(latest_path)) != os.path.normcase(os.path.abspath(src)):
        try:
            latest_wb = openpyxl.load_workbook(latest_path, data_only=False)
        except Exception:
            latest_wb = None
    for name in CARRIED_OVER:
        ws = wb.create_sheet(name)
        n = 0
        vals_for_totals = vals if (vals is not None and name in vals.sheetnames) else None
        if old is not None and name in old.sheetnames:
            o = old[name]
            #  From row 2. Row 1 is the title band, which band() writes
            #  fresh below.
            for row in o.iter_rows(min_row=2):
                filled = False
                for c in row:
                    if c.value is None:
                        continue
                    filled = True
                    nc = ws.cell(row=c.row, column=c.column, value=c.value)
                    if c.number_format:
                        nc.number_format = c.number_format
                    #  Bold is the one thing of his styling worth keeping
                    #  - it says which label he wanted to stand out.
                    nc.font = Font(name="Calibri", size=11, bold=bool(c.font and c.font.bold))
                if filled:
                    n += 1
            for rng in list(o.merged_cells.ranges):
                if rng.min_row <= 1:
                    continue
                try:
                    ws.merge_cells(str(rng))
                except ValueError:
                    pass
            for k, dim in o.column_dimensions.items():
                if dim.width:
                    ws.column_dimensions[k].width = dim.width
        #  Is the roster that came across this shutdown's? One with the
        #  old "Neon" placeholder is the superseded Weipa copy; one whose
        #  newest day is more than a month before the report is last
        #  shut's. Either way the job's seeded roster replaces it, once.
        old_roster = False
        if n and weipa and name == "Coates Labour":
            if any(c.value == "Neon" for row in ws.iter_rows() for c in row):
                old_roster = True
            dates = [c.value for row in ws.iter_rows() for c in row
                     if isinstance(c.value, (dt.datetime, dt.date))]
            if dates and seed["roster"]:
                newest = max(d_.date() if isinstance(d_, dt.datetime) else d_ for d_ in dates)
                seed_first = _d(seed["roster"][0][0]).date()
                today = when or dt.date.today()
                #  Stale means: its last day is a month or more behind the
                #  report date AND the seeded roster is the newer one.
                if newest < today - dt.timedelta(days=30) and seed_first > newest:
                    old_roster = True
        if n and weipa and old_roster and name == "Coates Labour" and latest_wb is not None \
                and "Coates Labour" in latest_wb.sheetnames:
            #  The .xlsm carries last shut's roster, but the kit's own LATEST
            #  workbook has a current one (seeded or typed since). Carry
            #  that instead, so what Andrew types into it keeps coming
            #  across, and say so once.
            l_dates = [c.value for row in latest_wb["Coates Labour"].iter_rows() for c in row
                       if isinstance(c.value, (dt.datetime, dt.date))]
            l_new = max((d_.date() if isinstance(d_, dt.datetime) else d_ for d_ in l_dates),
                        default=None)
            if l_new and l_new >= (when or dt.date.today()) - dt.timedelta(days=30):
                use_latest = True
                old_roster = False
                say("  NOTE | {} carries a previous shutdown's roster, so the two typed "
                    "tabs are carried from {} instead.".format(
                        os.path.basename(src), os.path.basename(latest_path)))
        if use_latest:
            #  Unmerge first: a merged cell's value cannot be cleared.
            for rng in list(ws.merged_cells.ranges):
                ws.unmerge_cells(str(rng))
            for row in ws.iter_rows(min_row=2):
                for c in row:
                    c.value = None
            n = 0
            lsrc = latest_wb[name] if name in latest_wb.sheetnames else None
            if lsrc is not None:
                for row in lsrc.iter_rows(min_row=2):
                    filled = False
                    for c in row:
                        if c.value is None:
                            continue
                        filled = True
                        nc = ws.cell(row=c.row, column=c.column, value=c.value)
                        if c.number_format:
                            nc.number_format = c.number_format
                        nc.font = Font(name="Calibri", size=11, bold=bool(c.font and c.font.bold))
                    if filled:
                        n += 1
                for rng in list(lsrc.merged_cells.ranges):
                    if rng.min_row > 1:
                        try:
                            ws.merge_cells(str(rng))
                        except ValueError:
                            pass
                for k, dim in lsrc.column_dimensions.items():
                    if dim.width:
                        ws.column_dimensions[k].width = dim.width
            vals_for_totals = None
        if n and weipa and (old_roster or (name == "Cost Breakdown" and stale_roster)):
            #  The roster that came across is the older copy - the one
            #  with the "Neon" placeholder and the day rate on every
            #  shift. Replace it with the roster as corrected with Andrew
            #  on 04 Nov 2026, and say so. Happens once; after that the
            #  corrected roster is what gets carried over.
            for rng in list(ws.merged_cells.ranges):
                ws.unmerge_cells(str(rng))
            for row in ws.iter_rows():
                for c in row:
                    c.value = None
            n = 0
            stale_roster = True
            vals_for_totals = None
            say("  NOTE | {} carried a previous shutdown's roster, so it has been "
                "replaced with the {} as at {}.".format(
                    name, "roster" if name == "Coates Labour"
                    else "cost breakdown, labour read off the roster", seed["stamp"]))
        updated_seed = False
        if n and weipa and seed.get("previous"):
            #  The tab is exactly an earlier version of this job's seed,
            #  untouched: update it to the corrected one and say so. A
            #  tab anybody has typed into never matches, and is kept.
            for prev in seed["previous"]:
                if _same_as_seed(ws, name, prev):
                    for rng in list(ws.merged_cells.ranges):
                        ws.unmerge_cells(str(rng))
                    for row in ws.iter_rows(min_row=2):
                        for c in row:
                            c.value = None
                    n = 0
                    vals_for_totals = None
                    updated_seed = True
                    say("  NOTE | {} was still exactly the {} seeded on {}, nothing typed "
                        "since, so it has been updated to the version corrected on {} - {}."
                        .format(name, "roster" if name == "Coates Labour" else "cost breakdown",
                                prev["stamp"], seed["stamp"].replace(" (corrected)", ""),
                                prev["what"]))
                    break
        if n == 0 and weipa:
            vals_for_totals = None
            n = seed_labour(ws, seed) if name == "Coates Labour" else seed_costs(ws, seed)
            if not updated_seed:
                say("  NOTE | {} came through empty, so it is loaded with the {} as at "
                    "{} - yours to edit.".format(
                        name, "roster" if name == "Coates Labour" else
                        ("cost breakdown, labour off the roster" if seed.get("costs") else
                         "shutdown days, labour off the roster, the rest yours to type"),
                        seed["stamp"]))
        if n == 0:
            band(ws, title, 9)
            c = ws.cell(row=2, column=1,
                        value="Nothing typed in this tab yet - it is yours to "
                              "fill in and the rebuild never overwrites it.")
            c.font = NOTE_FONT
        else:
            skin_typed(ws)
            band(ws, title, max(5, ws.max_column))
            total = typed_totals(ws, name, vals_for_totals)
            if name == "Coates Labour":
                labour_total = total
                try:
                    roster = roster_hours(ws, when or dt.date.today())
                except Exception:
                    roster = {"hours": 0.0, "people": {}, "rostered": 0.0,
                              "first": None, "last": None}
            else:
                cost_total = total
        tidy_print(ws, max(5, ws.max_column), name=name)
        ws.sheet_properties.tabColor = GREY      # typed by hand
        carried.append((name, n))

    for w in (vals, old, latest_wb):
        if w is not None:
            try:
                w.close()
            except Exception:
                pass
    return carried, labour_total, cost_total, roster


def cover(wb, s, when, asat, tabs, sources, base, headline, pack=None, extra=None,
          shut_end=None):
    """The front page. Says what this workbook is, what fed it, the
    headline numbers as tiles, what is in each tab, how the two ratings
    are worked out, and which tabs are typed by hand - so nobody has to
    take a recommendation on trust or go hunting for where a number
    came from. Laid out to print on one or two portrait A4 pages and go
    on the wall."""
    import math
    import textwrap
    ws = wb.create_sheet("Cover")
    ws.sheet_view.showGridLines = False
    NC = 6
    for col in "ABCDEF":
        ws.column_dimensions[col].width = 19.5

    LABEL = Font(name="Calibri", size=8.5, bold=True, color=MUTED)
    VALUE = Font(name="Calibri", size=11, bold=True, color=NEAR_BLACK)
    BIG = Font(name="Calibri", size=20, bold=True, color=NEAR_BLACK)
    SMALL = Font(name="Calibri", size=9, color=MUTED)
    TXT = Font(name="Calibri", size=10.5, color=argb("33383F"))
    line_side = Side(style="thin", color=argb(COATES_LINE))
    tile_top = Side(style="medium", color=ORANGE)

    def fact_height(value):
        # Excel does not autofit merged cells. Reserve complete wrapped lines
        # for each two-column fact, including long project names and dates.
        lines = sum(max(1, len(textwrap.wrap(part, width=32)))
                    for part in str(value).split("\n"))
        return max(20, 15 * lines + 5)

    def put(row, col, value, font=None, fmt=None, align=None, fill=None):
        c = ws.cell(row=row, column=col, value=value)
        c.font = font or TXT
        if fmt:
            c.number_format = fmt
        if align:
            c.alignment = align
        if fill:
            c.fill = fill
        return c

    def merge(row, c1, c2, row2=None):
        ws.merge_cells(start_row=row, start_column=c1,
                       end_row=row2 or row, end_column=c2)

    def heading(row, text):
        """A charcoal section rule with an orange tab on the left."""
        merge(row, 1, NC)
        c = put(row, 1, text.upper(), Font(name="Calibri", size=10, bold=True,
                                            color=WHITE),
                align=Alignment(vertical="center", indent=1))
        for i in range(1, NC + 1):
            ws.cell(row=row, column=i).fill = HDR_FILL
        ws.cell(row=row, column=1).border = Border(
            left=Side(style="thick", color=ORANGE))
        ws.row_dimensions[row].height = 22
        return row + 1

    def wrapped(row, text, font=None, fill=None, indent=1, chars=118):
        """A block of wrapped text across the page, tall enough to show
        all of it (Excel never autofits a merged cell)."""
        merge(row, 1, NC)
        c = put(row, 1, text, font or TXT, fill=fill,
                align=Alignment(wrap_text=True, vertical="top", indent=indent))
        if fill:
            for i in range(2, NC + 1):
                ws.cell(row=row, column=i).fill = fill
        lines = sum(max(1, int(math.ceil(len(part) / float(chars))))
                    for part in text.split("\n"))
        ws.row_dimensions[row].height = 15 * lines + 8
        return row + 1

    # ---- the band, the strip under it, the title block -----------------
    band(ws, "{}  |  Shutdown Tool Store  |  On-Hire Report".format(
        s.short or s.customer or "Shutdown"), NC)
    merge(2, 1, NC)
    put(2, 1, "POWERED BY SITEIQ     ·     Author: {}     ·     "
              "Operational record of the tool store - built from today's "
              "SiteIQ exports".format(s.author or "Andrew Fisher"),
        Font(name="Calibri", size=8.5, bold=True, color=MUTED),
        align=Alignment(vertical="center", indent=1))
    for i in range(1, NC + 1):
        ws.cell(row=2, column=i).fill = PatternFill("solid", fgColor=argb(COATES_SOFT))
        ws.cell(row=2, column=i).border = Border(bottom=line_side)
    ws.row_dimensions[2].height = 18

    r = 4
    put(r, 1, s.customer or s.job, Font(name="Calibri", size=24, bold=True,
                                        color=NEAR_BLACK))
    ws.row_dimensions[r].height = 34
    r += 1
    put(r, 1, " · ".join(b for b in (s.job, s.location) if b) or
        "Shutdown tool store", Font(name="Calibri", size=12.5, color=MUTED))
    ws.row_dimensions[r].height = 20
    r += 1
    put(r, 1, "On-Hire Report  ·  {}".format(when.strftime("%A %d %B %Y")),
        Font(name="Calibri", size=11, bold=True, color=argb("A6410F")))
    r += 2

    # ---- the facts, three pairs across --------------------------------
    facts = [
        ("As at", asat.strftime("%d %b %Y  %H:%M")),
        ("Report date", when.strftime("%d %b %Y")),
        ("Prepared by", s.author or "Andrew Fisher"),
        ("SiteIQ project", s.project_schedule or "-"),
        ("Exports read", "{} files".format(len(sources))),
        ("Company pack", ("{} pages, {} companies".format(
            pack["pages"], pack["companies"]) if pack else "not built")),
        ("Engagement", "Fixed rate - no per-item charges" if s.fixed_rate else
         ("Standard hire" if (s._d.get("engagement") or "").strip() else "not set in JOB.txt")),
        ("Shutdown ends", (s.shutdown_end or shut_end).strftime("%d %b %Y")
         if (s.shutdown_end or shut_end) else "-"),
        ("Transactions cover", _PRINT.get("period") or "-"),
    ] + list(extra or [])
    for start in range(0, len(facts), 3):
        value_height = 20
        for k, (label, value) in enumerate(facts[start:start + 3]):
            col = 1 + k * 2
            merge(r, col, col + 1)
            put(r, col, label.upper(), LABEL,
                align=Alignment(vertical="bottom", indent=1))
            merge(r + 1, col, col + 1)
            put(r + 1, col, value, VALUE,
                align=Alignment(wrap_text=True, vertical="top", indent=1))
            value_height = max(value_height, fact_height(value))
            for cc in (col, col + 1):
                ws.cell(row=r + 1, column=cc).border = Border(bottom=line_side)
        ws.row_dimensions[r].height = 14
        ws.row_dimensions[r + 1].height = value_height
        r += 2
        if start + 3 < len(facts):
            ws.row_dimensions[r].height = 6
            r += 1
    r += 1

    # ---- the headlines, as tiles --------------------------------------
    r = heading(r, "The headlines")
    ws.row_dimensions[r].height = 8
    r += 1
    items = list(headline.items())
    for start in range(0, len(items), 3):
        chunk = items[start:start + 3]
        for k, (label, value) in enumerate(chunk):
            col = 1 + k * 2
            money = "cost" in label.lower()
            merge(r, col, col + 1)
            if money and not value:
                #  Blank is not zero. The hand-typed tabs carry formulas,
                #  and a workbook saved without cached results reads as
                #  nothing - so say TBC and point at the tab, never $0.
                put(r, col, "TBC", Font(name="Calibri", size=16, bold=True,
                                        color=MUTED),
                    align=Alignment(vertical="center", horizontal="left",
                                    indent=1))
            else:
                put(r, col, round(value, 2) if money else int(value), BIG,
                    fmt=MONEY_FMT if money else INT_FMT,
                    align=Alignment(vertical="center", horizontal="left",
                                    indent=1))
            merge(r + 1, col, col + 1)
            put(r + 1, col, label.upper(), LABEL,
                align=Alignment(vertical="top", indent=1))
            #  Tile edges: orange rule on top, hairline round the rest.
            ws.cell(row=r, column=col).border = Border(top=tile_top, left=line_side)
            ws.cell(row=r, column=col + 1).border = Border(top=tile_top, right=line_side)
            ws.cell(row=r + 1, column=col).border = Border(bottom=line_side, left=line_side)
            ws.cell(row=r + 1, column=col + 1).border = Border(bottom=line_side, right=line_side)
        ws.row_dimensions[r].height = 34
        ws.row_dimensions[r + 1].height = 20
        r += 2
        ws.row_dimensions[r].height = 8
        r += 1
    r += 1

    # Keep the navigation directory together on its own printed page.
    from openpyxl.worksheet.pagebreak import Break
    ws.row_breaks.append(Break(id=r - 1))

    # ---- what is in the workbook --------------------------------------
    r = heading(r, "What's in this workbook")
    for col, text, span in ((1, "Tab", 2), (3, "Rows", 1), (4, "What it tells you", 3)):
        if span > 1:
            merge(r, col, col + span - 1)
        c = put(r, col, text, HDR_FONT, align=Alignment(
            vertical="center", horizontal="right" if text == "Rows" else "left",
            indent=1))
        for cc in range(col, col + span):
            ws.cell(row=r, column=cc).fill = HDR_FILL
            ws.cell(row=r, column=cc).border = HDR_BORDER
    ws.row_dimensions[r].height = 20
    r += 1
    for n_, (name, n, why) in enumerate(tabs):
        typed = name in CARRIED_OVER
        fill = BAND_FILL if n_ % 2 else None
        merge(r, 1, 2)
        put(r, 1, name, Font(name="Calibri", size=10.5, bold=True,
                             color=NEAR_BLACK, underline="single"), align=Alignment(indent=1))
        try:
            ws.cell(row=r, column=1).hyperlink = "#'{}'!A1".format(name.replace("'", "''"))
        except Exception:
            pass
        put(r, 3, n, Font(name="Calibri", size=10.5, color=NEAR_BLACK),
            fmt=INT_FMT, align=Alignment(horizontal="right", indent=1))
        merge(r, 4, 6)
        put(r, 4, why, Font(name="Calibri", size=10.5, bold=typed,
                            color=argb("A6410F") if typed else MUTED),
            align=Alignment(indent=1))
        for cc in range(1, NC + 1):
            cell = ws.cell(row=r, column=cc)
            cell.border = Border(bottom=line_side)
            if fill:
                cell.fill = fill
        ws.row_dimensions[r].height = 18
        r += 1
    r += 1

    # ---- where the numbers came from ----------------------------------
    r = heading(r, "Where the numbers came from")
    USED = {"RENTAL_STOCK": "The fleet and the on-hire position",
            "SALES_STOCK": "Consumables - on the shelf and gone out",
            "TRANSACTIONS": "Every issue and return this period",
            "STOCKTAKE": "The last count"}
    for col, text, span in ((1, "Export", 2), (3, "Pulled from SiteIQ", 2),
                            (5, "Used for", 2)):
        merge(r, col, col + span - 1)
        put(r, col, text, HDR_FONT, align=Alignment(vertical="center", indent=1))
        for cc in range(col, col + span):
            ws.cell(row=r, column=cc).fill = HDR_FILL
            ws.cell(row=r, column=cc).border = HDR_BORDER
    ws.row_dimensions[r].height = 20
    r += 1
    for n_, p in enumerate(sources):
        stem = os.path.basename(p)
        key = next((k for k in USED if stem.upper().startswith(k)), "")
        merge(r, 1, 2)
        put(r, 1, stem, Font(name="Calibri", size=10.5, bold=True,
                             color=NEAR_BLACK),
            align=Alignment(wrap_text=True, vertical="top", indent=1))
        merge(r, 3, 4)
        put(r, 3, export_requested(p),
            Font(name="Calibri", size=10.5, color=NEAR_BLACK),
            fmt="dd mmm yyyy  hh:mm", align=Alignment(indent=1))
        merge(r, 5, 6)
        put(r, 5, USED.get(key, ""), Font(name="Calibri", size=10.5, color=MUTED),
            align=Alignment(wrap_text=True, vertical="top", indent=1))
        for cc in range(1, NC + 1):
            cell = ws.cell(row=r, column=cc)
            cell.border = Border(bottom=line_side)
            if n_ % 2:
                cell.fill = BAND_FILL
        ws.row_dimensions[r].height = max(fact_height(stem), fact_height(USED.get(key, "")))
        r += 1
    r += 1

    # ---- how the ratings are worked out -------------------------------
    r = heading(r, "How the ratings are worked out")
    r = wrapped(r, "Tooling is rated on TURNS - transactions divided by how "
                   "many of that item are on site. One item that went out five "
                   "times is working; five items that went out once each are "
                   "sitting there. Consumables are rated on how much of the "
                   "position has gone out - sales divided by sales plus what "
                   "is left on the shelf. Both are printed here so a "
                   "recommendation never has to be taken on trust.")
    ws.row_dimensions[r].height = 6
    r += 1

    def legend(row, head, lines):
        for col, text, span in ((1, head, 2), (3, "Rating", 2),
                                (5, "Recommendation", 2)):
            merge(row, col, col + span - 1)
            put(row, col, text, HDR_FONT, align=Alignment(vertical="center", indent=1))
            for cc in range(col, col + span):
                ws.cell(row=row, column=cc).fill = HDR_FILL
                ws.cell(row=row, column=cc).border = HDR_BORDER
        ws.row_dimensions[row].height = 20
        row += 1
        for rule_, rating, rec in lines:
            merge(row, 1, 2)
            put(row, 1, rule_, Font(name="Calibri", size=10.5, color=NEAR_BLACK),
                align=Alignment(wrap_text=True, vertical="top", indent=1))
            for col, word in ((3, rating), (5, rec)):
                fill, text, _bar = RAG[TONE.get(word.split("  ")[0], "slate")]
                merge(row, col, col + 1)
                put(row, col, word, Font(name="Calibri", size=10.5, bold=True,
                                         color=argb(text)),
                    fill=PatternFill("solid", fgColor=argb(fill)),
                    align=Alignment(wrap_text=True, vertical="top", indent=1))
                ws.cell(row=row, column=col + 1).fill = PatternFill(
                    "solid", fgColor=argb(fill))
            for cc in range(1, NC + 1):
                ws.cell(row=row, column=cc).border = Border(bottom=line_side)
            ws.row_dimensions[row].height = max(fact_height(rule_), fact_height(rating), fact_height(rec))
            row += 1
        return row

    r = legend(r, "Tooling - turns", [
        ("No turns", "No Use", "Review / Reduce"),
        ("Under 1 turn", "Low Use", "Keep Stock"),
        ("1 to 2 turns", "Good Use", "Keep Stock  (Monitor / Increase if 80%+ out now)"),
        ("2 turns or more", "High Demand", "Increase Stock"),
    ])
    ws.row_dimensions[r].height = 8
    r += 1
    r = legend(r, "Consumables - share of position sold", [
        ("Nothing sold", "No Use", "Review / Reduce"),
        ("Under 40%", "Low Use", "Keep Stock"),
        ("40% to 80%", "Good Use", "Keep Stock"),
        ("Over 80%", "High Demand", "Increase Stock"),
    ])
    r += 1

    # ---- what is typed by hand ----------------------------------------
    r = heading(r, "What is typed by hand")
    r = wrapped(r, "Coates Labour and Cost Breakdown are yours. The rebuild "
                   "reads them out of the previous workbook and writes them "
                   "straight back - it never recalculates them and never "
                   "overwrites your typing. Everything on every other tab is "
                   "built from the SiteIQ exports listed above, so a fresh pull "
                   "refreshes the lot. Costs appear on this cover and on those "
                   "two tabs and Forecast; the email and the PDF company pack carry "
                   "none.",
                fill=PatternFill("solid", fgColor=argb(COATES_TINT)))
    r += 1
    r = wrapped(r, "Figures are the tool store's own record as at {}, not a "
                   "live feed. POWERED BY SITEIQ  ·  Author: {}".format(
                       asat.strftime("%d %b %Y %H:%M"),
                       s.author or "Andrew Fisher"), SMALL)

    #  The cover is the page people print and put on the wall, so it
    #  goes portrait while the data tabs go landscape.
    tidy_print(ws, NC, landscape=False, name="Cover")
    ws.print_title_rows = "1:1"
    ws.print_area = "A1:F{}".format(r)
    ws.sheet_properties.tabColor = ORANGE
    return ws


def forecast_tab(wb, s, when, asat, fc):
    """A Forecast tab: the shut ahead as tiles, a day-by-day table of
    hours and money, where the money goes, and two live Excel charts -
    cost by day with the running total over it, and the split. Read
    off the Coates Labour and Cost Breakdown tabs at build time, so a
    re-run after editing either refreshes it. Costs live here, never in
    the email or the pack."""
    from openpyxl.chart import BarChart, DoughnutChart, LineChart, Reference
    from openpyxl.chart.label import DataLabelList
    from openpyxl.chart.series import DataPoint
    from openpyxl.chart.shapes import GraphicalProperties
    from openpyxl.drawing.line import LineProperties

    ws = wb.create_sheet("Forecast")
    ws.sheet_view.showGridLines = False
    cost = fc.get("cost")
    people = [p[0] for p in fc["people"]]
    money_cols = cost["columns"] if cost else []
    heads = ["Day", "Phase"] + ["{} (h)".format(n) for n in people] + money_cols
    if cost:
        heads += ["Day total", "Running total"]
    NC = max(12, len(heads))
    for i in range(1, NC + 5):
        ws.column_dimensions[get_column_letter(i)].width = 13.5
    ws.column_dimensions["A"].width = 16
    ws.column_dimensions["B"].width = 22
    band(ws, "{}  |  Shutdown Tool Store  |  Forecast - {}".format(
        s.short or s.customer or "Shutdown", fc["job"]), NC)
    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=NC)
    c = ws.cell(row=2, column=1, value=(
        "POWERED BY SITEIQ     \u00b7     Author: {}     \u00b7     Roster off the Coates Labour "
        "tab, money off the Cost Breakdown tab, both as at {} - re-run after editing either"
        "     \u00b7     Internal: costs stay in this workbook".format(
            s.author or "Andrew Fisher", asat.strftime("%d %b %Y %H:%M"))))
    c.font = Font(name="Calibri", size=8.5, bold=True, color=MUTED)
    c.alignment = Alignment(vertical="center", indent=1)
    for i in range(1, NC + 1):
        ws.cell(row=2, column=i).fill = PatternFill("solid", fgColor=argb(COATES_SOFT))
    ws.row_dimensions[2].height = 18

    LABEL = Font(name="Calibri", size=8.5, bold=True, color=argb("F7A072"))
    BIG = Font(name="Calibri", size=18, bold=True, color=WHITE)
    line_side = Side(style="thin", color=argb("3E4651"))
    tile_top = Side(style="medium", color=ORANGE)
    DARK = PatternFill("solid", fgColor=NEAR_BLACK)

    # ---- tiles --------------------------------------------------------
    tiles = [(m[0].upper(), m[1], m[2]) for m in fc["milestones"]
             if m[0].lower() != "rostered hours"][:4]
    tiles.append(("LABOUR (ROSTER)", "${:,.2f}".format(fc["labour_total"] or 0),
                  "{:,.0f} rostered hours, {} people".format(fc["hours"], len(fc["people"]))))
    tiles.append(("ALL UP (SHUT TOTAL)", "${:,.2f}".format(fc["cost_total"] or 0),
                  "off the Cost Breakdown tab"))
    r = 4
    for k, (label, value, sub) in enumerate(tiles[:6]):
        col = 1 + k * 2
        ws.merge_cells(start_row=r, start_column=col, end_row=r, end_column=col + 1)
        c = ws.cell(row=r, column=col, value=value)
        c.font = BIG
        c.alignment = Alignment(vertical="center", indent=1)
        ws.merge_cells(start_row=r + 1, start_column=col, end_row=r + 1, end_column=col + 1)
        c = ws.cell(row=r + 1, column=col, value="{}  -  {}".format(label, sub))
        c.font = LABEL
        c.alignment = Alignment(vertical="top", indent=1, wrap_text=True)
        ws.cell(row=r, column=col).border = Border(top=tile_top, left=line_side)
        ws.cell(row=r, column=col + 1).border = Border(top=tile_top, right=line_side)
        ws.cell(row=r + 1, column=col).border = Border(bottom=line_side, left=line_side)
        ws.cell(row=r + 1, column=col + 1).border = Border(bottom=line_side, right=line_side)
    for rr_ in (r, r + 1):
        for cc_ in range(1, NC + 1):
            ws.cell(row=rr_, column=cc_).fill = DARK
    ws.row_dimensions[r].height = 30
    ws.row_dimensions[r + 1].height = 30

    # ---- the day-by-day table -----------------------------------------
    T0 = 31
    ws.cell(row=T0 - 2, column=1, value="DAY BY DAY").font = Font(
        name="Calibri", size=10, bold=True, color=argb("A6410F"))
    ws.cell(row=T0 - 1, column=1, value=(
        "Hours per person off the roster; money per day off the Cost Breakdown tab"
        + ("" if cost else " (add a Day column to that tab to see the cost curve here)")
        + ". The charts above are drawn from this table.")).font = NOTE_FONT
    for i, h in enumerate(heads, start=1):
        c = ws.cell(row=T0, column=i, value=h)
        c.font = HDR_FONT
        c.fill = HDR_FILL
        c.border = HDR_BORDER
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.row_dimensions[T0].height = 30
    cost_by_day = dict((d0, (label, vals, day_total, run)) for d0, label, vals, day_total, run
                       in (cost["days"] if cost else []))
    rr = T0
    for day in fc["days"]:
        rr += 1
        phase_label = ""
        for name in people:
            cell = fc["grid"].get(name, {}).get(day)
            if cell and cell[1]:
                phase_label = cell[1]
                break
        cd = cost_by_day.get(day)
        if cd and cd[0]:
            phase_label = cd[0]
        row = [day, phase_label]
        for name in people:
            cell = fc["grid"].get(name, {}).get(day)
            row.append(cell[2] if cell and cell[2] else None)
        for n in money_cols:
            v = cd[1].get(n, 0.0) if cd else 0.0
            row.append(v if v else None)
        if cost:
            row += [cd[2] if cd else 0.0, cd[3] if cd else (cost_by_day_run_before(cost_by_day, day))]
        for i, val in enumerate(row, start=1):
            c = ws.cell(row=rr, column=i, value=val)
            c.font = BODY_FONT
            c.border = CELL_BORDER
            if (rr - T0) % 2 == 0:
                c.fill = BAND_FILL
            if i == 1:
                c.number_format = "ddd dd mmm yyyy"
            elif i > 2 + len(people):
                c.number_format = MONEY_FMT
                c.alignment = Alignment(horizontal="right")
            elif i > 2:
                c.number_format = "#,##0.##"
                c.alignment = Alignment(horizontal="right")
            if day == fc["today"]:
                c.font = Font(name="Calibri", size=11, bold=True, color=argb(COATES_ORANGE))
        ph = _phase(phase_label)
        fill, ink_ = {"travel": ("E9ECF0", "4A5361"), "mob": ("FDE7D9", "8A4A1F"),
                      "day": ("FFF1EA", "A6410F"), "night": ("2A313C", "FFFFFF")}.get(ph, (None, None))
        if fill:
            pc = ws.cell(row=rr, column=2)
            pc.fill = PatternFill("solid", fgColor=argb(fill))
            pc.font = Font(name="Calibri", size=11, bold=(ph == "night"), color=argb(ink_))
    last_data = rr
    rr += 1
    c = ws.cell(row=rr, column=1, value="Total")
    for i in range(1, len(heads) + 1):
        cc = ws.cell(row=rr, column=i)
        cc.font = Font(name="Calibri", size=11, bold=True, color=NEAR_BLACK)
        cc.fill = PatternFill("solid", fgColor=argb(COATES_TINT))
        cc.border = CELL_BORDER
        if 2 < i <= len(heads) - (1 if cost else 0):
            col = get_column_letter(i)
            cc.value = "=SUM({0}{1}:{0}{2})".format(col, T0 + 1, last_data)
            cc.number_format = MONEY_FMT if i > 2 + len(people) else "#,##0.##"
            cc.alignment = Alignment(horizontal="right")
    ws.freeze_panes = None

    # ---- where the money goes -----------------------------------------
    S0 = T0
    sc = len(heads) + 2
    if cost:
        ws.cell(row=S0 - 2, column=sc, value="WHERE THE MONEY GOES").font = Font(
            name="Calibri", size=10, bold=True, color=argb("A6410F"))
        for i, h in enumerate(["Component", "Total", "Share"]):
            c = ws.cell(row=S0, column=sc + i, value=h)
            c.font = HDR_FONT
            c.fill = HDR_FILL
            c.border = HDR_BORDER
            c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        total = cost["total"] or 1.0
        for j, n in enumerate(money_cols, start=1):
            vals = [n, cost["totals"][n], cost["totals"][n] / total]
            for i, val in enumerate(vals):
                c = ws.cell(row=S0 + j, column=sc + i, value=val)
                c.font = BODY_FONT
                c.border = CELL_BORDER
                if j % 2 == 0:
                    c.fill = BAND_FILL
                if i == 1:
                    c.number_format = MONEY_FMT
                    c.alignment = Alignment(horizontal="right")
                if i == 2:
                    c.number_format = "0%"
                    c.alignment = Alignment(horizontal="right")
        ws.column_dimensions[get_column_letter(sc)].width = 18

    def paint(series, hex6):
        series.graphicalProperties = GraphicalProperties(solidFill=hex6)
        series.graphicalProperties.line = LineProperties(solidFill=hex6)

    PALETTE = [COATES_ORANGE, "2A313C", RAG["amber"][2], "98A0AA", RAG["green"][2],
               "F7A072", RAG["red"][2]]

    def palette_for(name):
        z = name.lower()
        if "labour" in z:
            return "2A313C"
        if "tool" in z or "shutdown" in z or "hire" in z:
            return COATES_ORANGE
        if "site" in z or "service" in z:
            return RAG["amber"][2]
        if "flight" in z or "travel" in z:
            return "98A0AA"
        return None

    # ---- chart 1: cost by day, running total over it -------------------
    if cost:
        first_money = 3 + len(people)
        bar = BarChart()
        bar.type = "col"
        bar.grouping = "stacked"
        bar.overlap = 100
        bar.gapWidth = 60
        bar.title = "Cost by day, with the running total"
        bar.style = 10
        bar.add_data(Reference(ws, min_col=first_money, max_col=first_money + len(money_cols) - 1,
                               min_row=T0, max_row=last_data), titles_from_data=True)
        bar.set_categories(Reference(ws, min_col=1, min_row=T0 + 1, max_row=last_data))
        for k, srs in enumerate(bar.series):
            paint(srs, palette_for(money_cols[k]) or PALETTE[k % len(PALETTE)])
        bar.y_axis.title = "$ per day"
        bar.y_axis.numFmt = "$#,##0"
        bar.y_axis.majorGridlines = None
        bar.x_axis.number_format = "dd mmm"
        bar.legend.position = "b"
        line = LineChart()
        run_col = len(heads)
        line.add_data(Reference(ws, min_col=run_col, min_row=T0, max_row=last_data),
                      titles_from_data=True)
        line.set_categories(Reference(ws, min_col=1, min_row=T0 + 1, max_row=last_data))
        ls = line.series[0]
        ls.graphicalProperties = GraphicalProperties()
        ls.graphicalProperties.line = LineProperties(solidFill=COATES_INK, w=28000)
        ls.marker.symbol = "circle"
        ls.marker.size = 6
        ls.marker.graphicalProperties = GraphicalProperties(solidFill=COATES_INK)
        ls.smooth = False
        line.y_axis.axId = 200
        line.y_axis.title = "Running total"
        line.y_axis.numFmt = "$#,##0"
        line.y_axis.crosses = "max"
        line.y_axis.majorGridlines = None
        bar += line
        bar.width, bar.height = 24.5, 10.6
        ws.add_chart(bar, "A7")

        # ---- chart 2: the split ---------------------------------------
        dn = DoughnutChart(holeSize=58)
        dn.title = "Where the money goes"
        dn.style = 10
        dn.add_data(Reference(ws, min_col=sc + 1, min_row=S0, max_row=S0 + len(money_cols)),
                    titles_from_data=True)
        dn.set_categories(Reference(ws, min_col=sc, min_row=S0 + 1, max_row=S0 + len(money_cols)))
        srs = dn.series[0]
        for k, n in enumerate(money_cols):
            pt = DataPoint(idx=k)
            pt.graphicalProperties = GraphicalProperties(
                solidFill=palette_for(n) or PALETTE[k % len(PALETTE)])
            pt.graphicalProperties.line = LineProperties(solidFill="FFFFFF")
            srs.dPt.append(pt)
        dn.dataLabels = DataLabelList()
        dn.dataLabels.showPercent = True
        dn.dataLabels.showVal = False
        dn.dataLabels.showSerName = False
        dn.dataLabels.showCatName = False
        dn.dataLabels.showLegendKey = False
        dn.legend.position = "b"
        dn.width, dn.height = 11.5, 10.6
        ws.add_chart(dn, "J7")
    else:
        hb = BarChart()
        hb.type = "bar"
        hb.title = "Rostered hours by person"
        hb.style = 10
        hb.add_data(Reference(ws, min_col=3, max_col=2 + len(people), min_row=T0,
                              max_row=last_data), titles_from_data=True)
        hb.set_categories(Reference(ws, min_col=1, min_row=T0 + 1, max_row=last_data))
        for k, srs in enumerate(hb.series):
            paint(srs, PALETTE[k % len(PALETTE)])
        hb.grouping = "stacked"
        hb.overlap = 100
        hb.width, hb.height = 24.5, 10.6
        ws.add_chart(hb, "A7")

    try:
        tidy_print(ws, NC, landscape=True, name="Forecast")
    except Exception:
        pass
    return ws


def cost_by_day_run_before(cost_by_day, day):
    """The running total as it stood before a day the cost tab has no
    row for - so the Running total column never dips to zero."""
    before = [v for d0, v in cost_by_day.items() if d0 < day]
    return max([v[3] for v in before] + [0.0])


def dashboard(wb, s, when, asat, parts):
    """A Dashboard tab: the headline tiles, four gauges, and four charts
    drawn by Excel itself from small data tables lower on the same tab -
    so they are live charts anyone can click, recolour or copy into a
    deck, not pictures."""
    from openpyxl.chart import BarChart, DoughnutChart, LineChart, Reference
    from openpyxl.chart.label import DataLabelList
    from openpyxl.chart.series import DataPoint
    from openpyxl.chart.shapes import GraphicalProperties
    from openpyxl.drawing.line import LineProperties

    v = parts["viz"]
    ws = wb.create_sheet("Dashboard")
    ws.sheet_view.showGridLines = False
    NC = 12
    for i in range(1, NC + 1):
        ws.column_dimensions[get_column_letter(i)].width = 11.5
    band(ws, "{}  |  Shutdown Tool Store  |  Dashboard".format(
        s.short or s.customer or "Shutdown"), NC)
    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=NC)
    c = ws.cell(row=2, column=1, value="POWERED BY SITEIQ     ·     Author: {}     "
                "·     Charts are live - drawn by Excel from the tables at the foot "
                "of this tab     ·     As at {}".format(
                    s.author or "Andrew Fisher", asat.strftime("%d %b %Y %H:%M")))
    c.font = Font(name="Calibri", size=8.5, bold=True, color=MUTED)
    c.alignment = Alignment(vertical="center", indent=1)
    for i in range(1, NC + 1):
        ws.cell(row=2, column=i).fill = PatternFill("solid", fgColor=argb(COATES_SOFT))
    ws.row_dimensions[2].height = 18

    LABEL = Font(name="Calibri", size=8.5, bold=True, color=argb("F7A072"))
    BIG = Font(name="Calibri", size=20, bold=True, color=WHITE)
    line_side = Side(style="thin", color=argb("3E4651"))
    tile_top = Side(style="medium", color=ORANGE)
    DARK = PatternFill("solid", fgColor=NEAR_BLACK)

    # ---- tiles --------------------------------------------------------
    r = 4
    for k, (label, value, sub) in enumerate(parts["tiles"][:6]):
        col = 1 + k * 2
        ws.merge_cells(start_row=r, start_column=col, end_row=r, end_column=col + 1)
        c = ws.cell(row=r, column=col, value=value)
        c.font = BIG
        c.alignment = Alignment(vertical="center", indent=1)
        ws.merge_cells(start_row=r + 1, start_column=col, end_row=r + 1, end_column=col + 1)
        c = ws.cell(row=r + 1, column=col, value=label.upper())
        c.font = LABEL
        c.alignment = Alignment(vertical="top", indent=1, wrap_text=True)
        ws.cell(row=r, column=col).border = Border(top=tile_top, left=line_side)
        ws.cell(row=r, column=col + 1).border = Border(top=tile_top, right=line_side)
        ws.cell(row=r + 1, column=col).border = Border(bottom=line_side, left=line_side)
        ws.cell(row=r + 1, column=col + 1).border = Border(bottom=line_side, right=line_side)
    for rr_ in (r, r + 1):
        for cc_ in range(1, NC + 1):
            ws.cell(row=rr_, column=cc_).fill = DARK
    ws.row_dimensions[r].height = 32
    ws.row_dimensions[r + 1].height = 26

    # ---- the data the charts read -------------------------------------
    #  Kept on the tab, below the charts, headed like every other table.
    D0 = 76
    def table(row, col, heads, rows_):
        for i, h in enumerate(heads):
            c = ws.cell(row=row, column=col + i, value=h)
            c.font = HDR_FONT
            c.fill = HDR_FILL
            c.border = HDR_BORDER
            c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        ws.row_dimensions[row].height = 28
        for j, rr in enumerate(rows_, start=1):
            for i, val in enumerate(rr):
                c = ws.cell(row=row + j, column=col + i, value=val)
                c.font = BODY_FONT
                c.border = CELL_BORDER
                if j % 2 == 0:
                    c.fill = BAND_FILL
                if isinstance(val, (int, float)):
                    c.alignment = Alignment(horizontal="right")
                    c.number_format = "0%" if isinstance(val, float) and val <= 1 else INT_FMT
        return row + len(rows_)

    ws.cell(row=D0 - 2, column=1, value="CHART DATA").font = Font(
        name="Calibri", size=10, bold=True, color=argb("A6410F"))
    ws.cell(row=D0 - 1, column=1, value="These small tables feed the charts above. "
            "Built from the same exports as every other tab.").font = NOTE_FONT

    comp = sorted([c for c in parts["companies"] if c[1]],
                  key=lambda c: (-c[1], c[0].casefold()))[:6]
    gear_out = bool(comp)
    if not gear_out:                      # nothing on hire: chart the movement instead
        comp = sorted([c for c in parts["companies"] if c[2]], key=lambda c: -c[2])[:6]
    end_a = table(D0, 1, ["Company", "On hire now", "Tooling issues", "Consumables"],
                  [[c[0], c[1], c[2], c[3]] for c in comp] or [["(none)", 0, 0, 0]])
    order = ["High Demand", "Good Use", "Low Use", "No Use"]
    end_b = table(D0, 6, ["Rating", "Tooling lines", "Consumable lines"],
                  [[k, v["tool_mix"].get(k, 0), v["cons_mix"].get(k, 0)] for k in order])
    days = v["by_day"]
    end_c = table(end_a + 3, 1, ["Day", "Issued", "Returned", "Consumables issued"],
                  [[dd.strftime("%a %d %b"), i, rr, cc] for dd, i, rr, cc in days] or
                  [["(no dated movements)", 0, 0, 0]])
    cons = parts["consumables"][:10]
    end_d = table(end_b + 3, 6, ["Consumable line", "Share gone out"],
                  [[c_[0], float(c_[3])] for c_ in cons] or [["(none)", 0.0]])
    gauges = [
        ("Coates fleet on hire", v["coates_out"], v["coates_total"]),
        ("Dated from transactions", v["dated"], v["onhire"]),
        ("Consumable lines past 80%", v["cons_tight"], v["cons_lines"]),
        ("Items out over {} days".format(LONG_OUT_DAYS), v["long_out"], v["onhire"]),
    ]
    g0 = max(end_c, end_d) + 3
    table(g0, 1, ["Dial", "Value", "Of", "Share", "Rest", "Hidden half"],
          [[name, a, b, (a / float(b)) if b else 0.0,
            (1 - a / float(b)) if b else 1.0, 1.0] for name, a, b in gauges])

    def labels(chart, fmt=None):
        chart.dataLabels = DataLabelList()
        chart.dataLabels.showVal = True
        chart.dataLabels.showSerName = False
        chart.dataLabels.showCatName = False
        chart.dataLabels.showLegendKey = False
        chart.dataLabels.showPercent = False
        chart.dataLabels.showLeaderLines = False
        if fmt:
            chart.dataLabels.numFmt = fmt

    def paint(series, hex6):
        series.graphicalProperties = GraphicalProperties(solidFill=hex6)
        series.graphicalProperties.line = LineProperties(solidFill=hex6)

    #  The same word always looks the same: the pack's donut and this one
    #  both read the shared TONE table.
    RAG_HEX = dict((k, RAG[TONE[k]][2])
                   for k in ("High Demand", "Good Use", "Low Use", "No Use"))

    # ---- gauges: half-donuts with the bottom half hidden -------------
    for k, (name, a, b) in enumerate(gauges):
        ch = DoughnutChart(holeSize=62)
        ch.firstSliceAng = 270
        data = Reference(ws, min_col=4, max_col=6, min_row=g0 + 1 + k, max_row=g0 + 1 + k)
        ch.add_data(data, from_rows=True, titles_from_data=False)
        srs = ch.series[0]
        pct = (a / float(b)) if b else 0.0
        tone = ("orange" if k == 0 else
                ("green" if (k == 1 and not v["undated"]) or (k == 3 and not v["long_out"]) or (k == 2 and not v["cons_tight"])
                 else ("red" if k == 3 else "amber")))
        for i, hex6 in enumerate([RAG[tone][2], COATES_LINE, None]):
            pt = DataPoint(idx=i)
            if hex6:
                pt.graphicalProperties = GraphicalProperties(solidFill=hex6)
                pt.graphicalProperties.line = LineProperties(solidFill="FFFFFF")
            else:
                pt.graphicalProperties = GraphicalProperties(noFill=True)
                pt.graphicalProperties.line = LineProperties(noFill=True)
            srs.dPt.append(pt)
        ch.title = ["Fleet on hire {:.0f}%", "Dated {:.0f}%", "Lines past 80%: {:.0f}%",
                    "Over {} days: {}".format(LONG_OUT_DAYS, a)][k].format(pct * 100)
        ch.legend = None
        ch.width, ch.height = 6.6, 5.2
        ws.add_chart(ch, "{}8".format(get_column_letter(1 + k * 3)))

    # ---- companies ----------------------------------------------------
    bar = BarChart()
    bar.type = "bar"
    bar.style = 10
    bar.title = ("Six largest holdings - items on hire now" if gear_out
                 else "Who moved the most gear - tooling issues this period")
    bar.add_data(Reference(ws, min_col=2 if gear_out else 3, min_row=D0, max_row=end_a),
                 titles_from_data=True)
    bar.set_categories(Reference(ws, min_col=1, min_row=D0 + 1, max_row=end_a))
    paint(bar.series[0], COATES_ORANGE)
    bar.legend = None
    bar.y_axis.majorGridlines = None
    bar.x_axis.tickLblSkip = 1
    bar.x_axis.tickMarkSkip = 1
    bar.x_axis.scaling.orientation = "maxMin"
    labels(bar)
    bar.gapWidth = 60
    bar.width, bar.height = 13.2, 8.2
    ws.add_chart(bar, "A20")

    # ---- ratings doughnut --------------------------------------------
    dn = DoughnutChart(holeSize=58)
    dn.title = "Tooling lines by rating"
    dn.add_data(Reference(ws, min_col=7, min_row=D0, max_row=end_b), titles_from_data=True)
    dn.set_categories(Reference(ws, min_col=6, min_row=D0 + 1, max_row=end_b))
    for i, k in enumerate(order):
        pt = DataPoint(idx=i)
        pt.graphicalProperties = GraphicalProperties(solidFill=RAG_HEX[k])
        pt.graphicalProperties.line = LineProperties(solidFill="FFFFFF")
        dn.series[0].dPt.append(pt)
    labels(dn)
    dn.legend.position = "b"
    dn.width, dn.height = 13.4, 8.2
    ws.add_chart(dn, "G20")

    # ---- movements by day ---------------------------------------------
    col = BarChart()
    col.type = "col"
    col.style = 10
    col.title = "Movements by day"
    col.add_data(Reference(ws, min_col=2, max_col=4, min_row=end_a + 3, max_row=end_c),
                 titles_from_data=True)
    col.set_categories(Reference(ws, min_col=1, min_row=end_a + 4, max_row=end_c))
    for srs, hex6 in zip(col.series, (COATES_ORANGE, "98A0AA", "FCD3BE")):
        paint(srs, hex6)
    col.y_axis.majorGridlines = None
    col.legend.position = "b"
    col.gapWidth = 80
    col.width, col.height = 13.2, 8.2
    ws.add_chart(col, "A37")

    # ---- consumables running down -------------------------------------
    cb = BarChart()
    cb.type = "bar"
    cb.style = 10
    cb.title = "Consumables running down - share of position gone out"
    cb.add_data(Reference(ws, min_col=7, min_row=end_b + 3, max_row=end_d), titles_from_data=True)
    cb.set_categories(Reference(ws, min_col=6, min_row=end_b + 4, max_row=end_d))
    paint(cb.series[0], RAG["amber"][2])
    for i, row in enumerate(cons):
        point = DataPoint(idx=i)
        colour = RAG["amber" if row[3] >= 0.6 else "green"][2]
        point.graphicalProperties = GraphicalProperties(solidFill=colour)
        point.graphicalProperties.line = LineProperties(solidFill=colour)
        cb.series[0].dPt.append(point)
    cb.legend = None
    cb.y_axis.majorGridlines = None
    cb.y_axis.number_format = "0%"
    cb.y_axis.scaling.max = 1.0
    cb.x_axis.scaling.orientation = "maxMin"
    labels(cb, "0%")
    cb.gapWidth = 60
    cb.width, cb.height = 13.4, 8.2
    ws.add_chart(cb, "G37")

    # ---- gear out, day by day | age of what is out ---------------------
    obd = v.get("out_by_day") or []
    age = v.get("age") or []
    g1 = max(end_c, end_d, g0 + 5) + 3
    end_e = table(g1, 1, ["Day", "Out at day's end"],
                  [[dd.strftime("%a %d %b"), n] for dd, n in obd] or [["(no dated movements)", 0]])
    end_f = table(g1, 6, ["Age band", "Items on hire"],
                  [[lab, n] for lab, n, _t in age] or [["(nothing out)", 0]])
    ln = LineChart()
    ln.title = "Gear out, day by day"
    ln.style = 10
    ln.add_data(Reference(ws, min_col=2, min_row=g1, max_row=end_e), titles_from_data=True)
    ln.set_categories(Reference(ws, min_col=1, min_row=g1 + 1, max_row=end_e))
    srs = ln.series[0]
    srs.graphicalProperties = GraphicalProperties()
    srs.graphicalProperties.line = LineProperties(solidFill=COATES_INK, w=28000)
    srs.marker.symbol = "circle"
    srs.marker.size = 7
    srs.marker.graphicalProperties = GraphicalProperties(solidFill=COATES_ORANGE)
    srs.marker.graphicalProperties.line = LineProperties(solidFill=COATES_ORANGE)
    srs.smooth = False
    ln.legend = None
    ln.y_axis.majorGridlines = None
    labels(ln)
    ln.width, ln.height = 13.2, 8.2
    ws.add_chart(ln, "A54")
    ab = BarChart()
    ab.type = "bar"
    ab.style = 10
    ab.title = "Age of what is out"
    ab.add_data(Reference(ws, min_col=7, min_row=g1, max_row=end_f), titles_from_data=True)
    ab.set_categories(Reference(ws, min_col=6, min_row=g1 + 1, max_row=end_f))
    tone_hex = {"ink": "2A313C", "muted": "5B6472", "slate": "98A0AA",
                "amber": RAG["amber"][2], "red": RAG["red"][2]}
    for i, (lab, n, tone) in enumerate(age):
        pt = DataPoint(idx=i)
        pt.graphicalProperties = GraphicalProperties(solidFill=tone_hex.get(tone, "98A0AA"))
        pt.graphicalProperties.line = LineProperties(solidFill="FFFFFF")
        ab.series[0].dPt.append(pt)
    ab.legend = None
    ab.y_axis.majorGridlines = None
    ab.x_axis.scaling.orientation = "maxMin"
    labels(ab)
    ab.gapWidth = 50
    ab.width, ab.height = 13.4, 8.2
    ws.add_chart(ab, "G54")

    tidy_print(ws, NC, landscape=False, name="Dashboard")
    ws.print_title_rows = "1:1"
    ws.print_area = "A1:L71"
    ws.page_setup.fitToHeight = 1
    ws.sheet_properties.tabColor = ORANGE
    return ws


# =====================================================================
#  THE EMAIL - the whole report in the body, and it has to look the part
# =====================================================================
#  Outlook on Windows does not draw email with a browser engine. It
#  draws it with WORD. That one fact decides every choice below:
#
#    * Tables do the layout. No flexbox, no grid, no floats, no divs
#      holding a column up.
#    * Every style is written inline, on the element it belongs to. A
#      stylesheet in the head gets thrown away.
#    * bgcolor="" goes on alongside background: - Word trusts the
#      attribute more than the style. Belt and braces on every panel,
#      which also stops Outlook's dark mode inverting half the report.
#    * The body is a fixed pixel width centred inside an Outlook-only
#      wrapper, because Word ignores max-width and would otherwise
#      stretch the tables across a 34-inch monitor. Everything else
#      gets the fluid version and reads fine on a phone.
#    * Border-spacing is ignored by Word, so gaps between the tiles are
#      real spacer cells, not spacing.
#    * The bars and the status chips are nested tables with a
#      background colour. NO IMAGES ANYWHERE: no logo file to go
#      missing, no red X where a picture should be, nothing to
#      download on site, no "click to display images" bar across the
#      top. It looks the same on the store laptop, on a phone at the
#      gate, and in Gmail.
#
#  NO COSTS anywhere in it. Not the labour, not the cost breakdown, not
#  a rate and not a dollar sign. This is the operational picture and it
#  can go to anyone. The money stays in the workbook.
#
#  THE LOOK: one white sheet on a grey page, like a document. A dark
#  masthead with the Coates wordmark, then the position in words, the
#  flags, what is attached, and seven numbered sections with slim
#  headings and clean tables. One bar per table, chips for anything
#  that carries a judgement, and the orange kept for the things that
#  matter. Same palette as the workbook and the PDF pack.
# =====================================================================
E_ORANGE = "#" + COATES_ORANGE
E_ORANGE_TEXT = "#C8511A"                 # small orange text on white reads better a shade deeper
E_INK = "#" + COATES_INK
E_SLATE = "#" + COATES_SLATE
E_PAGE = "#" + COATES_PAGE
E_CARD = "#FFFFFF"
E_LINE = "#" + COATES_LINE
E_MUTED = "#" + COATES_MUTED
E_ZEBRA = "#F8F9FB"
E_SOFT = "#" + COATES_SOFT
E_TINT = "#" + COATES_TINT
E_TRACK = "#E6E9EE"
E_FONT = "'Segoe UI',Calibri,Arial,sans-serif"
E_WIDTH = 760

#  (chip background, chip text, bar) per meaning - the module palette
#  with a # on the front for HTML.
E_RAG = dict((k, tuple("#" + x for x in v)) for k, v in RAG.items())
E_TONE = TONE
E_STATUS = {"red": "Action needed", "amber": "To order", "green": "On track",
            "slate": "For review"}

E_TXT = ("font-family:{f};font-size:11pt;color:{i};line-height:1.55"
         .format(f=E_FONT, i=E_INK))
E_SMALL = ("font-family:{f};font-size:9pt;color:{m};line-height:1.5"
           .format(f=E_FONT, m=E_MUTED))
_T = ("<table cellpadding='0' cellspacing='0' border='0' width='100%' "
      "style='border-collapse:collapse;width:100%'>")


def _esc(v):
    return (_s(v).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def _fmt(v):
    """Only used for display - the thousands comma."""
    try:
        return "{:,}".format(int(v))
    except (TypeError, ValueError):
        return _esc(v)


def _days_text(days):
    if days is None:
        return "undated"
    if days == 0:
        return "today"
    return "1 day" if days == 1 else "{} days".format(_fmt(days))


def _spacer(px, colspan=1, bg=""):
    """A row of empty space that Word actually honours. A td with no
    content collapses, so it gets a non-breaking space and a font size
    of nothing to sit on."""
    return ("<tr><td colspan='{c}'{b} style=\"height:{p}px;font-size:1px;"
            "line-height:{p}px\">&nbsp;</td></tr>".format(
                c=colspan, p=px,
                b=" bgcolor=\"{}\"".format(bg) if bg else ""))


def _gap(px):
    """Vertical space between blocks, as its own tiny table."""
    return _T + _spacer(px) + "</table>"


def _rule(px, colour, colspan=1):
    return ("<tr><td colspan='{c}' bgcolor=\"{k}\" style=\"background:{k};"
            "height:{p}px;font-size:1px;line-height:{p}px\">&nbsp;</td></tr>"
            .format(c=colspan, k=colour, p=px))


def _pill(text, tone, size="8.5pt"):
    """A status chip. Word squares off the corners and that is fine -
    the colour is doing the work, not the radius."""
    bg, fg, _bar = E_RAG.get(tone, E_RAG["slate"])
    return ("<table cellpadding='0' cellspacing='0' border='0' "
            "style='border-collapse:collapse'><tr>"
            "<td class=\"nowrap pill\" bgcolor=\"{bg}\" style=\"background:{bg};border-radius:3px;"
            "padding:3px 8px;font-family:{f};font-size:{z};"
            "font-weight:700;color:{fg};white-space:nowrap\">{t}</td>"
            "</tr></table>".format(bg=bg, fg=fg, f=E_FONT, z=size,
                                   t=_esc(text)))


def _bar(value, biggest, tone="orange"):
    """A bar the width of its cell, drawn out of two table cells: the
    filled part and the track behind it."""
    _bg, _fg, fill = E_RAG.get(tone, E_RAG["orange"])
    try:
        pct = (float(value) / float(biggest) * 100.0) if biggest else 0.0
    except (TypeError, ValueError, ZeroDivisionError):
        pct = 0.0
    pct = max(0.0, min(100.0, pct))
    if pct <= 0:
        return (_T + "<tr><td bgcolor=\"{t}\" style=\"background:{t};height:6px;"
                "font-size:1px;line-height:6px\">&nbsp;</td></tr></table>"
                .format(t=E_TRACK))
    left = max(3, min(100, int(round(pct))))
    cells = ("<td width='{l}%' bgcolor=\"{f}\" style=\"background:{f};"
             "height:6px;font-size:1px;line-height:6px\">&nbsp;</td>"
             .format(l=left, f=fill))
    if left < 100:
        cells += ("<td width='{r}%' bgcolor=\"{t}\" style=\"background:{t};"
                  "height:6px;font-size:1px;line-height:6px\">&nbsp;</td>"
                  .format(r=100 - left, t=E_TRACK))
    return _T + "<tr>" + cells + "</tr></table>"


def _metric(text, value, biggest, tone="orange"):
    """The number, and under it the bar that says how big it is next to
    everything else in the column. A whole column of these is a chart."""
    return ("<div class=\"nowrap\" style=\"font-family:{f};font-size:11pt;font-weight:700;"
            "color:{i};text-align:right;line-height:1.2\">{t}</div>"
            "<div style=\"font-size:1px;line-height:5px\">&nbsp;</div>{b}"
            .format(f=E_FONT, i=E_INK, t=_esc(text),
                    b=_bar(value, biggest, tone)))


def _num(text, muted=False):
    """A plain right-aligned figure."""
    return ("<div class=\"nowrap\" style=\"font-family:{f};font-size:10.5pt;font-weight:{w};"
            "color:{c};text-align:right;line-height:1.3\">{t}</div>".format(
                f=E_FONT, w="400" if muted else "600",
                c=E_MUTED if muted else E_INK, t=_esc(text)))


def _lead(text, sub=""):
    """First column of a table row: the thing the row is about."""
    out = ("<div style=\"font-family:{f};font-size:10.5pt;color:{i};"
           "font-weight:600;line-height:1.35\">{t}</div>".format(
               f=E_FONT, i=E_INK, t=_esc(text)))
    if sub:
        out += ("<div style=\"font-family:{f};font-size:8.5pt;color:{m};"
                "padding-top:2px\">{s}</div>".format(f=E_FONT, m=E_MUTED,
                                                     s=_esc(sub)))
    return out


def _plain(text, align="left", muted=False):
    return ("<div style=\"font-family:{f};font-size:10.5pt;color:{c};"
            "text-align:{a};line-height:1.35\">{t}</div>".format(
                f=E_FONT, c=E_MUTED if muted else E_INK, a=align,
                t=_esc(text)))


def _kicker(text, colour=None):
    """A small orange label in capitals - the eyebrow over a block."""
    colour = colour or E_ORANGE_TEXT
    return ("<div style=\"font-family:{f};font-size:8pt;font-weight:700;"
            "color:{o};letter-spacing:1.4px;text-transform:uppercase;"
            "padding-bottom:6px\">{t}</div>".format(
                f=E_FONT, o=colour or E_ORANGE, t=_esc(text)))


def _section(number, title, subtitle):
    """A slim numbered heading: an orange square with the number, the
    title beside it, and a dark rule under both. Gives the report a
    spine you can scroll to without a slab of colour every screen."""
    return (
        _T + "<tr>"
        "<td width='30' height='30' bgcolor=\"{o}\" align='center' "
        "valign='middle' style=\"width:30px;height:30px;background:{o};"
        "font-family:{f};font-size:12pt;font-weight:800;color:#ffffff\">{n}"
        "</td>"
        "<td style=\"padding:0 0 0 12px;vertical-align:middle\">"
        "<div style=\"font-family:{f};font-size:13.5pt;font-weight:700;"
        "color:{k};line-height:1.2\">{t}</div>"
        "<div style=\"font-family:{f};font-size:9pt;color:{m};"
        "padding-top:2px\">{s}</div></td></tr>"
        "<tr><td colspan='2' style=\"padding-top:8px\">" + _T +
        "<tr><td bgcolor=\"{k}\" style=\"background:{k};height:2px;"
        "font-size:1px;line-height:2px\">&nbsp;</td></tr></table>"
        "</td></tr></table>"
    ).format(o=E_ORANGE, f=E_FONT, k=E_INK, m=E_MUTED, n=number,
             t=_esc(title), s=_esc(subtitle))


def _company_band(name, items, people, lines, undated=0):
    """The strip that starts each company's block in the on-hire roll.
    An orange tint with an orange edge - findable when you scroll,
    without nine slabs of solid colour down the email."""
    extra = ("" if not undated else
             " &nbsp;&middot;&nbsp; <span style=\"color:{a}\">{u} undated</span>"
             .format(a=E_RAG["amber"][1], u=_fmt(undated)))
    return (
        _T + "<tr>"
        "<td class=\"mh\" bgcolor=\"{t}\" style=\"background:{t};border-left:4px solid {o};"
        "padding:10px 14px;font-family:{f};font-size:12pt;font-weight:700;"
        "color:{k}\">{n}</td>"
        "<td class=\"mh\" bgcolor=\"{t}\" align='right' style=\"background:{t};"
        "padding:10px 14px;font-family:{f};font-size:9pt;color:{m};"
        "white-space:nowrap\">{i} item{s} &nbsp;&middot;&nbsp; {l} line{ls}"
        " &nbsp;&middot;&nbsp; {p} {pw}{x}</td>"
        "</tr></table>".format(
            t=E_TINT, o=E_ORANGE, f=E_FONT, k=E_INK, m=E_MUTED, n=_esc(name),
            i=_fmt(items), s="" if items == 1 else "s", l=_fmt(lines),
            ls="" if lines == 1 else "s", p=_fmt(people),
            pw="person" if people == 1 else "people", x=extra))


def _gear_list(gear):
    """What one person has out. Counted, so four of the same kit is one
    line that says four, not four lines that look like a glitch. One
    styled block, not one per line - Gmail clips big emails."""
    if not gear:
        return ""
    lines = "<br>".join(
        "<b style=\"color:{i}\">{q} &times;</b> {d}".format(
            i=E_INK, q=qty, d=_esc(desc)) for desc, qty in gear)
    return ("<div style=\"font-family:{f};font-size:9.5pt;color:{m};"
            "line-height:1.6\">{l}</div>".format(f=E_FONT, m=E_MUTED, l=lines))


def _table(cols, rows, widths=None, aligns=None, note="", valign=None,
           head="dark", phone_hide=None):
    """One data table. Dark heading row with an orange rule under it
    (or a light one inside the company roll), faint zebra, hairline
    between rows, and every cell carrying its own styling because Word
    will not read a stylesheet. Cells arrive as finished HTML from the
    caller - that is what lets a cell hold a bar or a chip."""
    if not rows:
        return (_T + "<tr><td bgcolor=\"{c}\" style=\"background:{c};"
                "border:1px solid {l};padding:14px;font-family:{f};"
                "font-size:10.5pt;color:{m}\">Nothing to report here today."
                "</td></tr></table>".format(c=E_SOFT, l=E_LINE, f=E_FONT,
                                            m=E_MUTED))
    widths = widths or {}
    aligns = aligns or {}
    #  Columns a phone can do without: hidden by the media rule, which
    #  Outlook desktop ignores, so the full table always prints there.
    phone_hide = set(phone_hide or ())
    ncols = len(cols)
    dark = (head == "dark")
    out = [_T.replace("<table ", "<table class='data-table' ", 1), "<tr>"]
    for i, c in enumerate(cols):
        w = (" width='{}%'".format(widths[i])) if i in widths else ""
        ws = ("width:{}%;".format(widths[i])) if i in widths else ""
        hp = " class=\"hp\"" if i in phone_hide else ""
        out.append(
            "<th{w}{hp} bgcolor=\"{k}\" style=\"{ws}background:{k};padding:8px 10px;"
            "font-family:{f};font-size:8pt;font-weight:700;color:{c};"
            "letter-spacing:.7px;text-transform:uppercase;text-align:{a};"
            "vertical-align:bottom\">{t}</th>".format(
                w=w, ws=ws, hp=hp, k=E_INK if dark else E_SOFT, f=E_FONT,
                c="#ffffff" if dark else E_MUTED, a=aligns.get(i, "left"),
                t=_esc(c)))
    out.append("</tr>")
    out.append(_rule(2 if dark else 1, E_ORANGE if dark else E_LINE,
                     colspan=ncols))
    for n, row in enumerate(rows):
        bg = E_CARD if n % 2 == 0 else E_ZEBRA
        out.append("<tr>")
        for i, cell in enumerate(row):
            out.append(
                "<td{hp} bgcolor=\"{b}\" style=\"background:{b};padding:8px 10px;"
                "border-bottom:1px solid {l};vertical-align:{v}\">{c}</td>"
                .format(hp=" class=\"hp\"" if i in phone_hide else "", b=bg, l=E_LINE,
                        c=cell, v=valign or ("middle" if i else "top")))
        out.append("</tr>")
    out.append("</table>")
    if note:
        out.append(_T + "<tr><td style=\"padding:8px 2px 0;font-family:{f};"
                   "font-size:9pt;color:{m};line-height:1.45\">{n}</td></tr>"
                   "</table>".format(f=E_FONT, m=E_MUTED, n=_esc(note)))
    return "".join(out)


def _masthead(s, when, asat, story=None):
    """The top of the report. Built out of type and two brand colours -
    no logo file, because a logo file is one more thing that can arrive
    as a red X on somebody else's laptop."""
    demob = ""
    if story and story.get("demob"):
        dd = story["days_to_demob"]
        demob = ("<br><span style=\"color:#ffffff;font-weight:700\">Demob {}</span>"
                 " &nbsp;&middot;&nbsp; {}".format(
                     story["demob"].strftime("%d %b"),
                     "today" if dd == 0 else ("{} day{} to go".format(dd, "" if dd == 1 else "s")
                                              if dd > 0 else "done")))
    divider = (_T + "<tr><td bgcolor=\"#3A4049\" style=\"background:#3A4049;"
               "height:1px;font-size:1px;line-height:1px\">&nbsp;</td></tr>"
               "</table>")
    return (
        _T + _rule(5, E_ORANGE)
        + "<tr><td bgcolor=\"{k}\" style=\"background:{k};padding:22px 24px 16px\">"
          + _T + "<tr>"
          "<td valign='top' class=\"mh\" style=\"font-family:{f}\">"
          "<div style=\"font-family:{f};font-size:24pt;font-weight:800;"
          "color:{o};letter-spacing:5px;line-height:1\">COATES</div>"
          "<div style=\"font-family:{f};font-size:7.5pt;font-weight:700;"
          "color:#9AA2AC;letter-spacing:2.4px;text-transform:uppercase;"
          "padding-top:7px\">Equipped for anything</div></td>"
          "<td valign='top' align='right' class=\"mh\" style=\"font-family:{f}\">"
          "<div style=\"font-family:{f};font-size:17pt;font-weight:700;"
          "color:#ffffff;line-height:1.15\">On-Hire Report</div>"
          "<div style=\"font-family:{f};font-size:10pt;color:#B9C0C9;"
          "padding-top:4px\">{d}</div></td>"
          "</tr></table></td></tr>"
        + "<tr><td bgcolor=\"{k}\" style=\"background:{k};padding:0 24px\">"
          + divider + "</td></tr>"
        + "<tr><td bgcolor=\"{k}\" style=\"background:{k};padding:12px 24px 18px\">"
          + _T + "<tr>"
          "<td class=\"mh\" style=\"font-family:{f};font-size:10.5pt;font-weight:600;"
          "color:#ffffff\">{hdr}</td>"
          "<td align='right' class=\"mh\" style=\"font-family:{f};font-size:9.5pt;"
          "color:#FFC9AE;white-space:nowrap\">As at {asat}{demob}</td>"
          "</tr></table>{progress}{hero}</td></tr>"
        + "<tr><td bgcolor=\"{soft}\" style=\"background:{soft};padding:9px 24px;"
          "border-bottom:1px solid {l};font-family:{f};font-size:8pt;"
          "font-weight:700;color:{m};letter-spacing:.8px;"
          "text-transform:uppercase\">Powered by <span style=\"color:{o}\">"
          "SiteIQ</span> &nbsp;&middot;&nbsp; Author: {who} &nbsp;&middot;&nbsp; "
          "Shutdown Tool Store &nbsp;&middot;&nbsp; Operational report &ndash; "
          "no costs</td></tr>"
        + "</table>"
    ).format(k=E_INK, f=E_FONT, o=E_ORANGE, d=when.strftime("%A %d %B %Y"),
             hdr=_esc(s.header_line), asat=asat.strftime("%d %b %Y  %H:%M"),
             demob=demob, soft=E_SOFT, l=E_LINE, m=E_MUTED,
             who=_esc(s.author or "Andrew Fisher"),
             progress=_progress_html(story.get("progress") if story else None),
             hero=_hero_html(story.get("hero") if story else None))


def _hero_html(hero):
    """The one number that matters today, big and white in the masthead:
    (value, label, words)."""
    if not hero:
        return ""
    value, label, words = hero
    return (_T + "<tr><td style=\"padding-top:14px\">" + _T + "<tr>"
            "<td class=\"nowrap hero-value\" width='1' style=\"font-family:{f};font-size:30pt;font-weight:800;color:{v};"
            "line-height:1;white-space:nowrap;padding-right:14px\">{val}</td>"
            "<td valign='middle' style=\"font-family:{f}\">"
            "<div style=\"font-size:8pt;font-weight:700;color:{o};letter-spacing:1px;"
            "text-transform:uppercase\">{lb}</div>"
            "<div style=\"font-size:9.5pt;color:#C9CFD7;padding-top:2px\">{w}</div></td>"
            "</tr></table></td></tr></table>").format(
                f=E_FONT, v=("#ffffff" if label != "nothing on hire" else E_RAG["green"][2]),
                o=E_ORANGE, val=_esc(value), lb=_esc(label), w=_esc(words))


def _progress_html(pr):
    """The shut as a strip of day cells inside the masthead: worked days
    light, today orange, days to come dark. Table cells, so Outlook
    draws it exactly."""
    if not pr or not pr.get("days"):
        return ""
    cells = []
    for d0, _ph in pr["days"]:
        if d0 < pr["today"]:
            col = "#C9CFD7"
        elif d0 == pr["today"]:
            col = E_ORANGE
        else:
            col = "#4A515C"
        cells.append("<td bgcolor=\"{c}\" style=\"background:{c};height:6px;font-size:1px;"
                     "line-height:6px\">&nbsp;</td><td width='2' style=\"width:2px;font-size:1px\">"
                     "&nbsp;</td>".format(c=col))
    return (_T + "<tr><td style=\"padding-top:12px\">" + _T + "<tr>"
            "<td style=\"font-family:{f};font-size:7.5pt;font-weight:700;color:#FFC9AE;"
            "letter-spacing:.8px;text-transform:uppercase;padding-bottom:5px\">{lb}</td>"
            "<td align='right' style=\"font-family:{f};font-size:7.5pt;color:#9AA2AC;"
            "padding-bottom:5px\">{span}</td></tr></table>"
            + _T.replace("<table ", '<table class="progress-strip" ', 1) + "<tr>" + "".join(cells)[:-len("<td width='2' style=\"width:2px;font-size:1px\">&nbsp;</td>")]
            + "</tr></table></td></tr></table>").format(
                f=E_FONT, lb=_esc(pr["label"]),
                span="{} to {}".format(pr["first"].strftime("%a %d %b"), pr["last"].strftime("%a %d %b")))


def _call_card(parts):
    """The position, up front, in the words you'd use on the phone -
    then the flags. Nobody should have to read seven tables to find out
    whether today is a good day or a bad one."""
    out = [_T + "<tr><td bgcolor=\"{c}\" style=\"background:{c};border-left:4px "
           "solid {o};padding:16px 18px\">".format(c=E_SOFT, o=E_ORANGE)]
    out.append(_kicker("Where we sit today"))
    for i, line in enumerate(parts["call"]):
        size = "12.5pt" if i == 0 else "10.5pt"
        weight = "600" if i == 0 else "400"
        colour = E_INK if i == 0 else E_MUTED
        out.append("<div style=\"font-family:{f};font-size:{z};"
                   "font-weight:{w};color:{c};line-height:1.5;"
                   "padding-bottom:5px\">{t}</div>".format(
                       f=E_FONT, z=size, w=weight, c=colour, t=_esc(line)))
    out.append("</td></tr></table>")

    #  The flags. Spacer cells between them because Word will not
    #  honour border-spacing. Each one says its status in words as well
    #  as colour, so it reads the same printed in black and white.
    flags = parts["flags"]
    out.append(_gap(10))
    out.append(_T + "<tr>")
    each = int(100 / max(1, len(flags)))
    for i, (tone, label, value) in enumerate(flags):
        bg, fg, bar = E_RAG.get(tone, E_RAG["slate"])
        if i:
            out.append("<td class='gap' width='8' style='width:8px;font-size:1px'>&nbsp;</td>")
        out.append(
            "<td class='tile' width='{pc}%' bgcolor=\"{c}\" valign='top' style=\"width:{pc}%;"
            "background:{c};border:1px solid {l};border-left:4px solid {bar};"
            "padding:9px 11px\">"
            "<div style=\"font-family:{f};font-size:7.5pt;font-weight:700;"
            "color:{m};letter-spacing:.7px;text-transform:uppercase\">{lb}</div>"
            "<div style=\"font-family:{f};font-size:12pt;font-weight:700;"
            "color:{k};padding-top:3px;line-height:1.2\">{v}</div>"
            "<div style=\"font-family:{f};font-size:8pt;font-weight:700;"
            "color:{fg};padding-top:3px\">{st}</div></td>".format(
                pc=each, c=E_CARD, l=E_LINE, bar=bar, f=E_FONT, m=E_MUTED,
                k=E_INK, fg=fg, lb=_esc(label), v=_esc(value),
                st=E_STATUS.get(tone, "")))
    out.append("</tr></table>")
    return "".join(out)


def _attached(parts):
    """What is on the paperclip, so nobody has to guess what the two
    attachments are before they open them."""
    n_tabs = parts.get("n_tabs") or 14
    fc = parts.get("forecast")
    cards = [("XLSX", "The workbook",
              "{} tabs - a live dashboard{}, then every line behind "
              "these numbers. The costs are in here and only in here.".format(
                  _words(n_tabs).capitalize(),
                  " and the forecast" if fc else ""))]
    pages = parts.get("pack_pages") or 0
    if pages:
        cards.append(("PDF", "The company pack",
                      "{} page{} - the asks on the cover, the story on page 2, {}"
                      "then a section per company.".format(
                          _fmt(pages), "" if pages == 1 else "s",
                          "looking ahead on page 3, charts on page 4, " if fc
                          else "charts on page 3, ")))
    out = [_kicker("Attached to this email", E_MUTED), _T, "<tr>"]
    cell = ("<td class='tile' width='{pc}%' bgcolor=\"{c}\" valign='top' style=\"width:{pc}%;"
            "background:{c};border:1px solid {l};padding:10px 12px\">"
            + _T +
            "<tr><td width='46' valign='top' style=\"width:46px\">{pill}</td>"
            "<td valign='top'>"
            "<div style=\"font-family:{f};font-size:10.5pt;font-weight:700;"
            "color:{k}\">{t}</div>"
            "<div style=\"font-family:{f};font-size:9pt;color:{m};"
            "padding-top:2px;line-height:1.4\">{s}</div></td></tr></table>"
            "</td>")
    for i, (kind, title, sub) in enumerate(cards):
        if i:
            out.append("<td class='gap' width='8' style='width:8px;font-size:1px'>&nbsp;</td>")
        out.append(cell.format(pc=int(100 / len(cards)), c=E_CARD, l=E_LINE,
                               f=E_FONT, k=E_INK, m=E_MUTED,
                               pill=_pill(kind, "orange", "8pt"), t=_esc(title),
                               s=_esc(sub)))
    out.append("</tr></table>")
    return "".join(out)



def _moving_strip(story):
    """How gear is moving: same day / kept longer / still out, and the
    customer-owned gear logged - the four numbers behind "the store is
    working". Each cell carries its own meaning in words."""
    cells = [("green", "Returned same day", story["same_day"],
              "back before the shift ended"),
             ("amber", "Kept longer, returned", story["kept"],
              "out more than a day, now back"),
             ("red" if story["still_out"] else "green", "Still on hire",
              story["still_out"], "itemised in section 7")]
    if story.get("own_total"):
        cells.append(("orange", "Customer-owned gear logged", story["own_total"],
                      "through the same counter"))
    out = [_kicker("How gear is moving", E_MUTED), _T, "<tr>"]
    each = int(100 / len(cells))
    for i, (tone, label, value, sub) in enumerate(cells):
        bg, fg, bar = E_RAG.get(tone, E_RAG["slate"])
        if i:
            out.append("<td class='gap' width='8' style='width:8px;font-size:1px'>&nbsp;</td>")
        out.append(
            "<td class='tile' width='{pc}%' bgcolor=\"{c}\" valign='top' style=\"width:{pc}%;"
            "background:{c};border:1px solid {l};border-bottom:3px solid {bar};"
            "padding:9px 11px\">"
            "<div style=\"font-family:{f};font-size:16pt;font-weight:800;"
            "color:{k};line-height:1.1\">{v}</div>"
            "<div style=\"font-family:{f};font-size:7.5pt;font-weight:700;"
            "color:{k};letter-spacing:.6px;text-transform:uppercase;"
            "padding-top:4px\">{lb}</div>"
            "<div style=\"font-family:{f};font-size:8pt;color:{m};"
            "padding-top:2px\">{s}</div></td>".format(
                pc=each, c=E_CARD, l=E_LINE, bar=bar, f=E_FONT, k=E_INK, m=E_MUTED,
                v=_fmt(value), lb=_esc(label), s=_esc(sub)))
    out.append("</tr></table>")
    return "".join(out)


def _tiles(tiles):
    """The headline numbers, three across, two rows. White cards with
    an orange top rule - the one place in the report where the numbers
    are allowed to be big."""
    out = [_T]
    for start in range(0, len(tiles), 3):
        chunk = tiles[start:start + 3]
        if start:
            out.append(_spacer(9, colspan=5))
        out.append("<tr>")
        for i, (label, value, sub) in enumerate(chunk):
            if i:
                out.append("<td class='gap' width='9' style='width:9px;font-size:1px'>&nbsp;</td>")
            rule, ink = E_ORANGE, E_INK
            if str(value) == "0" and label.lower().startswith("items on hire"):
                rule, ink = E_RAG["green"][2], E_RAG["green"][1]
                sub = "no items recorded on hire"
            elif str(value) == "0":
                ink = E_MUTED
            out.append(
                "<td class='tile' width='33%' bgcolor=\"{c}\" valign='top' "
                "style=\"width:33%;background:{c};border:1px solid {l};"
                "border-top:3px solid {o};padding:13px 15px\">"
                "<div style=\"font-family:{f};font-size:24pt;font-weight:800;"
                "color:{k};line-height:1.05\">{v}</div>"
                "<div style=\"font-family:{f};font-size:8pt;font-weight:700;"
                "color:{k};letter-spacing:.8px;text-transform:uppercase;"
                "padding-top:7px\">{lb}</div>"
                "<div style=\"font-family:{f};font-size:9pt;color:{m};"
                "padding-top:2px\">{s}</div></td>".format(
                    c=E_CARD, l=E_LINE, o=rule, f=E_FONT, k=ink,
                    m=E_MUTED, v=_esc(value), lb=_esc(label), s=_esc(sub)))
        for _ in range(3 - len(chunk)):
            out.append("<td width='9' style='width:9px;font-size:1px'>&nbsp;</td>")
            out.append("<td width='33%' style=\"width:33%\">&nbsp;</td>")
        out.append("</tr>")
    out.append("</table>")
    return "".join(out)


def _ahead_card(fc):
    """Looking ahead: the shut's dates off the roster, the people, and
    what the counter can expect from last time. No costs - they stay in
    the workbook."""
    cells = fc["milestones"]
    out = [_kicker("Looking ahead - {}".format(fc["job"]), E_MUTED), _T, "<tr>"]
    each = int(100 / len(cells))
    for i, (label, value, sub) in enumerate(cells):
        if i:
            out.append("<td class='gap' width='8' style='width:8px;font-size:1px'>&nbsp;</td>")
        out.append(
            "<td class='tile' width='{pc}%' bgcolor=\"{c}\" valign='top' style=\"width:{pc}%;"
            "background:{c};border:1px solid {l};border-top:3px solid {o};"
            "padding:9px 11px\">"
            "<div style=\"font-family:{f};font-size:12.5pt;font-weight:800;"
            "color:{k};line-height:1.15;white-space:nowrap\">{v}</div>"
            "<div style=\"font-family:{f};font-size:7.5pt;font-weight:700;"
            "color:{k};letter-spacing:.6px;text-transform:uppercase;"
            "padding-top:4px\">{lb}</div>"
            "<div style=\"font-family:{f};font-size:8pt;color:{m};"
            "padding-top:2px\">{s}</div></td>".format(
                pc=each, c=E_CARD, l=E_LINE, o=E_ORANGE, f=E_FONT, k=E_INK, m=E_MUTED,
                v=_esc(value), lb=_esc(label), s=_esc(sub)))
    out.append("</tr></table>")
    out.append("<div style=\"{sm};padding-top:8px\">{a} {b}</div>".format(
        sm=E_SMALL, a=_esc(fc["brief"]), b=_esc(fc["ref_line"])))
    return "".join(out)


def _more(n, where):
    """' Another 6 lines are on the Tooling Utilisation tab.' or nothing."""
    if n <= 0:
        return ""
    return " Another {:,} line{} {} on {} of the workbook.".format(
        n, "" if n == 1 else "s", "is" if n == 1 else "are", where)


def _actions_card(parts):
    """What I need from you. Only the things that actually apply, each
    one carrying its own number so nobody has to go and count."""
    n_act = len(parts["actions"])
    head = ("<tr><td bgcolor=\"{k}\" style=\"background:{k};padding:11px 16px\">"
            + _T +
            "<tr><td style=\"font-family:{f};font-size:12pt;font-weight:700;"
            "color:#ffffff\">What I need from you</td>"
            "<td align='right' style=\"font-family:{f};font-size:9pt;"
            "color:#FFC9AE;white-space:nowrap\">{n} item{s}</td></tr></table>"
            "</td></tr>")
    out = [_T, head.format(k=E_INK, f=E_FONT, n=n_act,
                           s="" if n_act == 1 else "s")]
    out.append(_rule(3, E_ORANGE))
    row = ("<tr><td bgcolor=\"{b}\" style=\"background:{b};padding:11px 16px;"
           "border-bottom:1px solid {l};border-left:1px solid {l};"
           "border-right:1px solid {l}\">"
           + _T +
           "<tr><td width='30' valign='top' style=\"width:30px;font-family:{f};"
           "font-size:12pt;font-weight:800;color:{o}\">{n}</td>"
           "<td valign='top'>"
           "<div style=\"font-family:{f};font-size:10.5pt;font-weight:700;"
           "color:{k}\">{h}</div>"
           "<div style=\"font-family:{f};font-size:10pt;color:{m};"
           "padding-top:2px;line-height:1.45\">{t}</div>"
           "</td></tr></table></td></tr>")
    for n, (head_, body) in enumerate(parts["actions"], 1):
        bg = E_CARD if n % 2 else E_ZEBRA
        out.append(row.format(b=bg, l=E_LINE, f=E_FONT, o=E_ORANGE, k=E_INK,
                              m=E_MUTED, n=n, h=_esc(head_), t=_esc(body)))
    out.append("</table>")
    return "".join(out)


def _footer(s, asat, parts, workbook=True):
    return (
        _T + _rule(3, E_ORANGE) +
        "<tr><td bgcolor=\"{k}\" style=\"background:{k};padding:14px 24px;"
        "font-family:{f};font-size:9pt;color:#9AA2AC;line-height:1.65\">"
        "Built from the SiteIQ exports of {src}. On-hire dates are the start "
        "date of each item's issue transaction; the transactions export covers "
        "{period}. Figures are the tool store's own record as at {asat}, not a "
        "live feed.<br>"
        "{costs}{fixed}<br>"
        "<span style=\"color:#ffffff;font-weight:700\">POWERED BY "
        "<span style=\"color:{o}\">SITEIQ</span></span>"
        " &nbsp;|&nbsp; Author: {who} &nbsp;|&nbsp; Shutdown Tool Store"
        "</td></tr></table>".format(
            k=E_INK, f=E_FONT, o=E_ORANGE, src=_esc(parts["source_stamp"]),
            period=_esc(parts.get("period") or "the period of the export"),
            asat=asat.strftime("%d %b %Y %H:%M"),
            costs=("Costs are in the attached workbook - not in this email and not in the "
                   "company pack." if workbook else
                   "No costs appear in this email or on the attached page - they are "
                   "in the workbook."),
            fixed=(" Fixed-rate engagement: no per-item charges appear in any of "
                   "it - commercials are per the agreement."
                   if (parts.get("story") or {}).get("fixed_rate") else ""),
            who=_esc(s.author or "Andrew Fisher")))


def email_html(s, when, asat, parts):
    """The whole report as an email body. Costs deliberately absent."""
    c = parts["counts"]
    pre = ("{} items on hire with {} companies, oldest out {} days. "
           "{} tooling lines to top up, {} consumable lines tight.".format(
               _fmt(c["onhire"]), _fmt(c["companies"]), _fmt(c["oldest_days"]),
               _fmt(c["hot"]), _fmt(c["tight"])))
    limit = parts["long_out_days"]
    body = []

    #  Inbox preview line. Hidden in the email itself - this is the text
    #  that shows under the subject in the list.
    body.append("<div style=\"display:none;font-size:1px;color:{p};"
                "max-height:0;max-width:0;overflow:hidden;mso-hide:all\">"
                "{t}</div>".format(p=E_PAGE, t=_esc(pre)))

    body.append(_masthead(s, when, asat, parts.get("story")))

    #  Everything from here sits inside the white sheet's padded cell.
    inner = []
    inner.append(_T + "<tr><td style=\"{x}\">"
                 "<div style=\"{x};padding-bottom:10px\">Morning,</div>"
                 "<div style=\"{x}\">Here is where the tool store sits as at "
                 "{d}. The position is first, then the detail behind it. "
                 "The workbook and the company pack are attached.</div>"
                 "</td></tr></table>".format(x=E_TXT,
                                             d=when.strftime("%d %B %Y")))
    inner.append(_gap(16))
    inner.append(_call_card(parts))
    inner.append(_gap(16))
    inner.append(_attached(parts))
    inner.append(_gap(22))

    inner.append(_section("1", "The position",
                          "The six numbers that describe the store today"))
    inner.append(_gap(10))
    inner.append(_tiles(parts["tiles"]))
    story = parts.get("story") or {}
    if story:
        inner.append(_gap(10))
        inner.append(_moving_strip(story))
    if parts.get("forecast"):
        inner.append(_gap(14))
        inner.append(_ahead_card(parts["forecast"]))
    inner.append(_gap(24))

    #  ---- 2. who is holding gear --------------------------------------
    rows = parts["companies"]
    has_own = bool(story.get("own_total"))
    anything_out = any(r[1] for r in rows)
    if anything_out:
        mx = max([r[1] for r in rows] or [0])
        inner.append(_section("2", "Who is holding gear",
                              "Every company on site, biggest holding first"))
        inner.append(_gap(10))
        cols = ["Company", "On hire now", "Tooling issues", "Consumables"]
        widths = {0: 32, 1: 19, 2: 13, 3: 13}
        aligns = {1: "right", 2: "right", 3: "right"}
        if has_own:
            cols.append("Own gear")
            widths = {0: 28, 1: 18, 2: 12, 3: 12, 4: 12, 5: 18}
            aligns[4] = "right"
            aligns[5] = "right"
        else:
            widths[4] = 23
            aligns[4] = "right"
        cols.append("Longest out")
        body_rows = []
        for r in rows:
            cells = [_lead(r[0]),
                     _metric(_fmt(r[1]), r[1], mx, "orange"),
                     _num(_fmt(r[2]), muted=not r[2]),
                     _num(_fmt(r[3]), muted=not r[3])]
            if has_own:
                cells.append(_num(_fmt(r[5] if len(r) > 5 else 0),
                                  muted=not (r[5] if len(r) > 5 else 0)))
            cells.append("<table cellpadding='0' cellspacing='0' border='0' align='right'>"
                         "<tr><td>{}</td></tr></table>".format(
                             _pill(_days_text(r[4]) if r[1] else "nothing out",
                                   day_tone(r[4]) if r[1] else "slate")))
            body_rows.append(cells)
        inner.append(_table(
            cols, body_rows, phone_hide=({2, 4} if has_own else {2}), widths=widths, aligns=aligns,
            note="On hire now is what is out in their name right now. Tooling "
                 "issues and consumables are this period's movements"
                 + (", own gear is their own equipment logged through our counter"
                    if has_own else "")
                 + ". Longest out is the oldest issue transaction still open in "
                   "their name."))
    else:
        #  Nothing out to anyone: the bar goes on the movement instead.
        rows = sorted(rows, key=lambda r: (-(r[2] + r[3]), r[0].upper()))
        mx = max([r[2] for r in rows] or [0])
        inner.append(_section("2", "Who moved the most gear",
                              "Nothing is on hire to anyone - this period's movements, busiest first"))
        inner.append(_gap(10))
        cols = ["Company", "Tooling issues", "Consumables"] + (["Own gear"] if has_own else [])
        widths = ({0: 40, 1: 24, 2: 18, 3: 18} if has_own else {0: 46, 1: 30, 2: 24})
        aligns = {1: "right", 2: "right", 3: "right"}
        body_rows = []
        for r in rows:
            cells = [_lead(r[0]),
                     _metric(_fmt(r[2]), r[2], mx, "orange"),
                     _num(_fmt(r[3]), muted=not r[3])]
            if has_own:
                cells.append(_num(_fmt(r[5] if len(r) > 5 else 0),
                                  muted=not (r[5] if len(r) > 5 else 0)))
            body_rows.append(cells)
        inner.append(_table(
            cols, body_rows, widths=widths, aligns=aligns,
            note="No items are recorded on hire in this export. "
                 "Tooling issues and consumables are this period's movements"
                 + (", own gear is their own equipment logged through our counter"
                    if has_own else "") + "."))
    inner.append(_gap(24))

    #  ---- 3. working hardest ------------------------------------------
    SHOW = 6
    rows = parts["hardest"]
    shown = rows[:SHOW]
    mx = max([r[3] for r in shown] or [0])
    inner.append(_section("3", "Working hardest",
                          "The gear earning its keep, most turns first"))
    inner.append(_gap(10))
    inner.append(_table(
        ["Item", "On site", "Out now", "Times issued", "Rating"],
        [[_lead(r[0]),
          _num(_fmt(r[1])),
          _num(_fmt(r[2]), muted=not r[2]),
          _metric(_fmt(r[3]), r[3], mx, E_TONE.get(r[4], "orange")),
          _pill(r[4], E_TONE.get(r[4], "slate"))] for r in shown],
        widths={0: 44, 1: 10, 2: 10, 3: 18, 4: 18},
        aligns={1: "right", 2: "right", 3: "right"},
        note="Rated on turns - times issued against how many we hold. High "
             "demand means it is going out faster than we can turn it around, "
             "so more is worth ordering."
             + _more(len(rows) - len(shown), "the Tooling Utilisation tab")))
    inner.append(_gap(24))

    #  ---- 4. not moving -----------------------------------------------
    rows = parts["idle"]
    shown = rows[:SHOW]
    mx = max([r[1] for r in shown] or [0])
    inner.append(_section("4", "Not moving",
                          "Biggest holdings that have not gone out once"))
    inner.append(_gap(10))
    inner.append(_table(
        ["Item", "On site", "Out now", "Do"],
        [[_lead(r[0]),
          _metric(_fmt(r[1]), r[1], mx, "slate"),
          _num(_fmt(r[2]), muted=not r[2]),
          _pill(r[3], E_TONE.get(r[3], "slate"))] for r in shown],
        widths={0: 52, 1: 16, 2: 12, 3: 20},
        aligns={1: "right", 2: "right"},
        note="Every one of these is shelf space and hire we are carrying "
             "for nothing. Say the word on any line and it goes home."
             + _more(len(rows) - len(shown), "the Tooling Utilisation tab")))
    inner.append(_gap(24))

    #  ---- 5. consumables to watch -------------------------------------
    rows = parts["consumables"]
    shown = rows[:SHOW]
    tight = parts["cons_tight"]
    inner.append(_section("5", "Consumables to watch",
                          "The lines running down, tightest first"))
    inner.append(_gap(10))
    inner.append(_table(
        ["Line", "On shelf", "Gone out of the position", "Do"],
        [[_lead(r[0]),
          _num(_fmt(r[1]), muted=not r[1]),
          _metric("{} of {}".format(_fmt(r[2]), _fmt(r[1] + r[2])), r[3] * 100, 100,
                  "amber" if r[3] >= tight else "green"),
          _pill("Order" if r[4] == "Increase Stock" else r[4],
                E_TONE.get(r[4], "slate"))] for r in shown],
        widths={0: 46, 1: 12, 2: 26, 3: 16},
        aligns={1: "right", 2: "right"},
        note="Gone out is this period's draws against the whole position - "
             "shelf plus drawn. Past {:.0f}% we order, because running a line "
             "dry mid-shift costs more than the stock does.".format(tight * 100)
             + _more(len(rows) - len(shown), "the Consumable Utilisation tab")))
    inner.append(_gap(24))

    #  ---- 6. out the longest ------------------------------------------
    rows = parts["longest"]
    mx = max([r[5] for r in rows] or [0])
    inner.append(_section("6", "Out the longest",
                          "Oldest issue transactions still open"))
    inner.append(_gap(10))
    inner.append(_table(
        ["Item", "Company", "Who has it", "Issued", "Days"],
        [[_lead(r[0], r[1]),
          _plain(r[2]),
          _plain(r[3]),
          _plain(r[4].strftime("%d %b %Y"), "left", muted=True),
          _metric(_fmt(r[5]), r[5], mx, day_tone(r[5]))]
         for r in rows],
        widths={0: 30, 1: 20, 2: 20, 3: 15, 4: 15},
        aligns={4: "right"}, phone_hide={1, 3},
        note="Dated from the start of each item's issue transaction, not the "
             "stock record. Anything past {} days is flagged red, past {} "
             "amber. Most of the time it is still on the job and fine - but "
             "it is the list that stops a demob turning into a search party."
             .format(limit, WATCH_DAYS)))
    und = parts["counts"].get("undated", 0)
    if und:
        inner.append(_gap(8))
        inner.append(_T + "<tr><td bgcolor=\"{t}\" style=\"background:{t};"
                     "border-left:4px solid {a};padding:10px 14px;"
                     "font-family:{f};font-size:9.5pt;color:{k};"
                     "line-height:1.5\"><b>{n} item{s} on hire {hv} no issue "
                     "transaction inside this export</b> ({p}), so {pr} shown "
                     "as undated rather than given a date nobody can stand "
                     "behind. The SiteIQ stock record carries a date for "
                     "them - it is on the Detailed Onhire tab for checking. "
                     "A transactions export pulled from the start of the "
                     "shutdown dates every one of them.</td></tr></table>"
                     .format(t=E_TINT, a=E_RAG["amber"][2], f=E_FONT, k=E_INK,
                             n=_fmt(und), s="" if und == 1 else "s",
                             hv="has" if und == 1 else "have",
                             p=_esc(parts.get("period") or "this period"),
                             pr="it is" if und == 1 else "they are"))
    inner.append(_gap(24))

    #  ---- 7. everything on hire, company by company --------------------
    inner.append(_section("7", "Everything on hire, company by company",
                          "Alphabetical - every item out, and who has it"))
    for block in parts["roll"]:
        inner.append(_gap(12))
        inner.append(_company_band(block["company"], block["items"],
                                   len(block["people"]), block["lines"],
                                   block.get("undated", 0)))
        rows = []
        for p in block["people"]:
            n_txt = "{} item{} out".format(_fmt(p["n"]), "" if p["n"] == 1 else "s")
            if p["days"] is None:
                story = n_txt + " - no issue transaction in this export."
            else:
                story = "{}, the oldest issued {} - {}.".format(
                    n_txt, p["since"].strftime("%d %b %Y"), _days_text(p["days"]))
                if p.get("undated"):
                    story += " {} undated.".format(_fmt(p["undated"]))
            rows.append([
                _lead(p["who"], story) +
                "<div style=\"font-size:1px;line-height:6px\">&nbsp;</div>" +
                _gear_list(p["gear"]),
                _pill(_days_text(p["days"]), day_tone(p["days"]))])
        inner.append(_table(["Who has it, and what they've got", "Longest out"],
                            rows, widths={0: 82, 1: 18}, aligns={1: "left"},
                            valign="top", head="light"))
    inner.append(_gap(8))
    inner.append(_T + "<tr><td style=\"font-family:{f};font-size:9pt;"
                 "color:{m};line-height:1.45\">That is every item on hire as "
                 "at the time above - {n} of them. If a name here has "
                 "finished up, tell me and I'll chase the gear back before "
                 "demob.</td></tr></table>".format(
                     f=E_FONT, m=E_MUTED, n=_fmt(c["onhire"])))
    inner.append(_gap(24))

    inner.append(_actions_card(parts))
    inner.append(_gap(20))

    inner.append(_T + "<tr><td style=\"{x}\">"
                 "<div style=\"{x};padding-bottom:12px\">Anything here you "
                 "want chased, tell me and I'll get on it.</div>"
                 "<div style=\"{x}\"><b>{who}</b><br>"
                 "<span style=\"font-family:{f};font-size:10pt;color:{m}\">"
                 "Shutdown Tool Store &nbsp;|&nbsp; Coates</span></div>"
                 "</td></tr></table>".format(
                     x=E_TXT, f=E_FONT, m=E_MUTED,
                     who=_esc(s.author or "Andrew Fisher")))

    body.append(_T + "<tr><td bgcolor=\"{c}\" style=\"background:{c};"
                "padding:22px 24px 26px\">{i}</td></tr></table>".format(
                    c=E_CARD, i="".join(inner)))
    body.append(_footer(s, asat, parts))

    return _wrap_sheet("".join(body))


def _wrap_sheet(sheet):
    """The white sheet on the grey page. Word ignores max-width, so
    Outlook gets a fixed-width table of its own and everybody else gets
    the fluid one. Without this the report stretches the full width of a
    big monitor and looks like a spreadsheet somebody pasted in."""
    return (
        "<style type=\"text/css\">@media only screen and (max-width:620px){{"
        "td,div,span{{white-space:normal !important}}"
        "td,th,div,span{{overflow-wrap:anywhere !important;word-break:break-word !important}}"
        "th{{overflow-wrap:normal !important;word-break:normal !important;letter-spacing:0 !important}}"
        ".nowrap{{white-space:nowrap !important;overflow-wrap:normal !important;word-break:normal !important}}"
        ".data-table>tbody>tr>td,.data-table>tbody>tr>th{{padding-left:4px !important;padding-right:4px !important}}"
        ".pill{{padding-left:4px !important;padding-right:4px !important}}"
        ".progress-strip td{{padding:0 !important}}"
        ".mh{{display:block !important;width:100% !important;text-align:left !important;"
        "padding-top:6px !important}}.hp{{display:none !important}}"
        "th,td{{padding-left:6px !important;padding-right:6px !important}}"
        ".tile{{display:block !important;width:100% !important;"
        "box-sizing:border-box !important}}"
        ".gap{{display:none !important}}}}</style>"
        "<div style=\"background:{p};margin:0;padding:0\">"
        "<table cellpadding='0' cellspacing='0' border='0' width='100%' "
        "bgcolor=\"{p}\" style=\"border-collapse:collapse;width:100%;"
        "background:{p}\"><tr><td align='center' style='padding:18px 10px 28px'>"
        "<!--[if mso]><table cellpadding='0' cellspacing='0' border='0' "
        "width='{w}' align='center'><tr><td width='{w}'><![endif]-->"
        "<table cellpadding='0' cellspacing='0' border='0' width='100%' "
        "bgcolor=\"{c}\" style=\"border-collapse:collapse;width:100%;"
        "max-width:{w}px;margin:0 auto;text-align:left;background:{c};"
        "border:1px solid {l}\"><tr><td>{inner}</td></tr></table>"
        "<!--[if mso]></td></tr></table><![endif]-->"
        "</td></tr></table></div>".format(p=E_PAGE, c=E_CARD, l=E_LINE,
                                          w=E_WIDTH, inner=sheet))


def company_email_html(s, when, asat, parts, b):
    """One company's chase email: their position, their people and what
    each holds, the ask, their page of the pack on the paperclip. Same
    sheet, same masthead, no costs."""
    co = b["company"]
    story = dict(parts.get("story") or {})
    story["hero"] = (("{:,}".format(b["items"]), "items on hire now", co)
                     if b["items"] else ("0", "nothing on hire", co))
    body = [_masthead(s, when, asat, story)]
    inner = []
    if b["items"]:
        oldest = b["oldest_days"]
        line = ("As at {}, {} has {:,} item{} on hire from the Coates tool store with {} {}{}.".format(
            when.strftime("%d %B %Y"), co, b["items"], "" if b["items"] == 1 else "s",
            len(b["people"]), "person" if len(b["people"]) == 1 else "people",
            (", the oldest issue {}".format(_days_text(oldest)) if oldest is not None else "")))
        if b.get("cust_owned"):
            line += (" {:,} of {} your own item{} managed through the counter.".format(
                b["cust_owned"], "them is" if b["cust_owned"] == 1 else "them are",
                "" if b["cust_owned"] == 1 else "s"))
        if b["undated"]:
            line += (" {} item{} no issue transaction inside the export window and {} "
                     "shown as undated.".format(b["undated"], " has" if b["undated"] == 1 else "s have",
                                                "is" if b["undated"] == 1 else "are"))
        ask = ("If any of it is finished with, bring it back to the counter and it comes off "
               "your name the same day - two scans and it is done. Anything you are still "
               "using, no action needed.")
    else:
        line = ("As at {}, {} has no items recorded on hire in this export."
                .format(when.strftime("%d %B %Y"), co))
        ask = ("This period the counter logged {:,} tooling movement{} and {:,} consumable "
               "draw{} for you{}.".format(
                   b["issues"], "" if b["issues"] == 1 else "s", b["draws"],
                   "" if b["draws"] == 1 else "s",
                   (", plus {:,} movement{} of your own gear".format(b["own"], "" if b["own"] == 1 else "s")
                    if b.get("own") else "")))
    inner.append(_T + "<tr><td style=\"{x}\">"
                 "<div style=\"{x};padding-bottom:10px\">Hi {co} team,</div>"
                 "<div style=\"{x};padding-bottom:10px\">{line}</div>"
                 "<div style=\"{x}\">{ask}</div>"
                 "</td></tr></table>".format(x=E_TXT, co=_esc(co), line=_esc(line), ask=_esc(ask)))
    inner.append(_gap(18))
    if b["people"]:
        inner.append(_kicker("Who is holding what"))
        rows = []
        for pp in b["people"]:
            gear = {}
            for r in pp["items"]:
                k = item_name(r[3]) or "(no description)"
                gear[k] = gear.get(k, 0) + 1
            top = sorted(gear.items(), key=lambda kv: (-kv[1], kv[0]))
            listed = ", ".join("{} x {}".format(q, g) if q > 1 else g for g, q in top[:4])
            if len(top) > 4:
                listed += ", and {} more".format(len(top) - 4)
            rows.append([_lead(pp["who"], listed),
                         _num(_fmt(len(pp["items"]))),
                         _plain(pp["since"].strftime("%d %b %Y") if pp["since"] else "not in export",
                                "left", muted=True),
                         _pill(_days_text(pp["days"]) if pp["days"] is not None else "undated",
                               day_tone(pp["days"]) if pp["days"] is not None else "amber")])
        inner.append(_table(["Person", "Items", "Oldest issue", "Out"], rows,
                            widths={0: 46, 1: 12, 2: 23, 3: 19}, aligns={1: "right"},
                            note="Dates are the start of each item's issue transaction in SiteIQ. "
                                 "Every item is listed on the attached page."))
        inner.append(_gap(18))
    if b.get("consumables"):
        top3 = ", ".join("{} ({:,})".format(k, int(v["qty"])) for k, v in b["consumables"][:3])
        inner.append("<div style=\"{sm}\">Consumables drawn this period: {:,} units across {} line{}"
                     " - most of it {}.</div>".format(
                         b["cons_qty"], len(b["consumables"]), "" if len(b["consumables"]) == 1 else "s",
                         _esc(top3), sm=E_SMALL))
        inner.append(_gap(14))
    inner.append("<div style=\"{x}\">Attached is your page of today's pack. Reply to this email "
                 "with anything you want chased or corrected.</div>".format(x=E_TXT))
    inner.append(_gap(16))
    inner.append("<div style=\"{x};font-weight:700\">{who}</div>"
                 "<div style=\"{sm}\">Shutdown Tool Store &nbsp;|&nbsp; Coates</div>".format(
                     x=E_TXT, sm=E_SMALL, who=_esc(s.author or "Andrew Fisher")))
    body.append("<table cellpadding='0' cellspacing='0' border='0' width='100%' "
                "style='border-collapse:collapse'><tr><td style='padding:22px 24px 26px'>"
                + "".join(inner) + "</td></tr></table>")
    body.append(_footer(s, asat, parts, workbook=False))
    return _wrap_sheet("".join(body))


def write_company_email(out_dir, s, when, asat, parts, b, pdf_path):
    """One company's chase email as an .eml draft (their PDF attached),
    the same page as .html, and a .draft.json for the Outlook button.
    Nothing sends - the To field is yours to fill."""
    import email.message
    import email.policy
    import json
    co = b["company"]
    stem = (os.path.splitext(os.path.basename(pdf_path))[0] if pdf_path else
            "{} - On-Hire - {}".format(_safe_name(co, "Company"), when.strftime("%d %b %Y")))
    html = company_email_html(s, when, asat, parts, b)
    html_path = os.path.join(out_dir, stem + ".html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write("<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'>"
                "<meta name='viewport' content='width=device-width,initial-scale=1'>"
                "<title>{}</title></head><body style=\"margin:0;padding:0;background:{}\">{}"
                "</body></html>".format(_esc(stem), E_PAGE, html))
    if b["items"]:
        subject = "{} | Coates tool store | {}: {:,} item{} on hire{}".format(
            co, when.strftime("%a %d %b"), b["items"], "" if b["items"] == 1 else "s",
            (", oldest {}".format(_days_text(b["oldest_days"])) if b["oldest_days"] is not None else ""))
    else:
        subject = "{} | Coates tool store | {}: nothing on hire".format(co, when.strftime("%a %d %b"))
    msg = email.message.EmailMessage(policy=email.policy.SMTP)
    msg["Subject"] = subject
    msg["X-Unsent"] = "1"
    text = ["Hi {} team,".format(co), "",
            ("{} has {:,} item{} on hire from the Coates tool store with {} {} as at {}{}.".format(
                co, b["items"], "" if b["items"] == 1 else "s", len(b["people"]),
                "person" if len(b["people"]) == 1 else "people", when.strftime("%d %b %Y"),
                (" ({:,} of them your own gear)".format(b["cust_owned"]) if b.get("cust_owned") else ""))
             if b["items"] else
             "{} has no items recorded on hire as at {}.".format(
                 co, when.strftime("%d %b %Y"))), ""]
    for pp in b["people"]:
        text.append("  {} - {} item{}, oldest issued {}".format(
            pp["who"], len(pp["items"]), "" if len(pp["items"]) == 1 else "s",
            pp["since"].strftime("%d %b %Y") if pp["since"] else "not in export"))
    text += ["", "Your page of today's pack is attached. Reply with anything to chase or correct.",
             "", s.author or "Andrew Fisher", "Shutdown Tool Store | Coates"]
    msg.set_content("\n".join(text))
    msg.add_alternative(html, subtype="html")
    if pdf_path and os.path.isfile(pdf_path):
        with open(pdf_path, "rb") as f:
            msg.add_attachment(f.read(), maintype="application", subtype="pdf",
                               filename=os.path.basename(pdf_path))
    with open(os.path.join(out_dir, stem + ".eml"), "wb") as f:
        f.write(msg.as_bytes())
    with open(os.path.join(out_dir, stem + ".draft.json"), "w", encoding="utf-8") as f:
        json.dump({"subject": subject, "body": os.path.basename(html_path),
                   "attachments": [os.path.basename(pdf_path)] if pdf_path else []}, f, indent=1)
    return stem


# =====================================================================
#  THE COMPANY PACK - a PDF with a section for every company


# =====================================================================
#  THE COMPANY PACK - a PDF with a section for every company
# =====================================================================
#  The email tells everybody where the store sits. The pack is what you
#  hand ONE company: their page, their people, their gear, the day it
#  went out. A cover with the headlines and a contents list that links
#  to each section, then a section per company that starts on a new
#  page. Built by coates_pdf.py, which travels in the kit, so it comes
#  out on any laptop with nothing installed. Same rules as the email:
#  dated from the issue transaction, no costs anywhere in it.
# =====================================================================
try:
    import coates_pdf
except ImportError:
    coates_pdf = None

P_M = 36                                  # page margin, points
P_INK = "#" + COATES_INK
P_ORANGE = "#" + COATES_ORANGE
P_ORANGE_TEXT = "#C8511A"                 # brand orange, deepened for small text on white
P_SLATE = "#" + COATES_SLATE
P_MUTED = "#" + COATES_MUTED
P_LINE = "#" + COATES_LINE
P_SOFT = "#" + COATES_SOFT
P_TINT = "#" + COATES_TINT
P_ZEBRA = "#F8F9FB"
P_WHITE = "#FFFFFF"
C_MUTED_LIGHT = "#9AA2AC"


def pack_blocks(det, ctx, tooling_tx, when, own=None, owner_of=None):
    """Everything on hire, company by company, person by person. The
    one ordering rule, same as the email and the board: companies A-Z,
    people inside a company A-Z, a person's items longest-held first
    with A-Z breaking ties. Returns (blocks, quiet) where quiet is the
    companies that moved gear this period but have nothing out now."""
    roll = {}
    for r in det:
        co = _s(r[0]) or "(no company named)"
        who = _s(r[1]) or "(nobody named on it)"
        roll.setdefault(co, {}).setdefault(who, []).append(r)

    issues = {}
    for r in tooling_tx:
        co = _s(r.get("EMPLOYER_NAME")) or "(not named)"
        issues[co] = issues.get(co, 0) + 1

    cons = {}
    for r in ctx:
        co = _s(r[0]) or "(not named)"
        line = cons.setdefault(co, {}).setdefault(
            item_name(r[2]) or "(no description)", {"qty": 0.0, "people": set()})
        line["qty"] += float(r[3] or 0)
        if _s(r[1]):
            line["people"].add(_s(r[1]))

    own_by, own_lines_by = {}, {}
    for r in (own or []):
        co = _s(r.get("EMPLOYER_NAME")) or "(not named)"
        own_by[co] = own_by.get(co, 0) + 1
        k = item_name(r.get("SKU/ITEM DESCRIPTION")) or "(no description)"
        d_ = own_lines_by.setdefault(co, {})
        d_[k] = d_.get(k, 0) + 1

    #  A section for every company that touched the counter this period -
    #  holding gear now, or moved gear, drew consumables or put their own
    #  gear through the store. At the end of a shut the on-hire list is
    #  empty and the activity is the story.
    active = set(roll) | set(issues) | set(cons) | set(own_by)
    active.discard("")
    blocks = []
    for co in sorted(active, key=lambda c: c.upper()):
        people = []
        for who in sorted(roll.get(co, {}), key=lambda w: w.upper()):
            items = sorted(roll[co][who],
                           key=lambda r: (-(r[7] if r[7] is not None else -1),
                                          _s(r[3]).upper(), _s(r[2])))
            dated = [r for r in items if r[5]]
            oldest = min(r[5] for r in dated) if dated else None
            people.append({
                "who": who, "items": items, "since": oldest,
                "days": days_out(when, oldest) if oldest else None,
                "undated": len(items) - len(dated)})
        all_items = [r for p in people for r in p["items"]]
        days = [r[7] for r in all_items if r[7] is not None]
        lines = sorted(cons.get(co, {}).items(),
                       key=lambda kv: (-kv[1]["qty"], kv[0].upper()))
        blocks.append({
            "company": co,
            "people": people,
            "items": len(all_items),
            "lines": len({_s(r[3]) for r in all_items}),
            "age": age_bands(all_items),
            "oldest_days": max(days) if days else None,
            "long_out": len([d for d in days if d >= LONG_OUT_DAYS]),
            "undated": len(all_items) - len(days),
            "issues": issues.get(co, 0),
            #  items on hire that the customer owns (life jackets, drop mats)
            #  - managed through the counter, but not Coates gear
            "cust_owned": sum(1 for r in all_items
                              if (owner_of or {}).get(_s(r[2])) and
                              "COATES" not in (owner_of or {}).get(_s(r[2]), "").upper()),
            "draws": sum(1 for r in ctx if (_s(r[0]) or "(not named)") == co),
            "own": own_by.get(co, 0),
            "own_lines": sorted(own_lines_by.get(co, {}).items(), key=lambda kv: (-kv[1], kv[0])),
            "consumables": lines,
            "cons_qty": int(sum(v["qty"] for _k, v in lines)),
        })
    quiet = []
    return blocks, quiet


def _fit_sentences(d, body, size, max_w):
    """The longest run of whole sentences from the start of body that fits
    in max_w at size. Falls back to the body itself (the caller then trims
    it with an ellipsis) when even the first sentence is too long."""
    if d.text_width(body, size) <= max_w:
        return body
    parts = [p_ for p_ in body.replace(". ", ".\x00").split("\x00") if p_]
    out = ""
    for p_ in parts:
        cand = (out + " " + p_).strip() if out else p_
        if d.text_width(cand, size) > max_w:
            break
        out = cand
    return out or body


class _Pack(object):
    """Draws the pack. Owns the document, the running y and the page
    breaks, so every section is written the same way."""

    def __init__(self, s, when, asat, period, title):
        self.s, self.when, self.asat, self.period = s, when, asat, period
        self.doc = coates_pdf.Document(
            title=title, author=s.author or "Andrew Fisher",
            subject="{} - {}".format(s.header_line, when.strftime("%d %b %Y")))
        self.W, self.H = coates_pdf.A4
        self.x0, self.x1 = P_M, self.W - P_M
        self.cw = self.x1 - self.x0
        self.bottom = self.H - 56
        self.y = 0
        self.right_title = ""
        self.cont = None                     # draws a "(continued)" header

    # ---- the frame every page gets --------------------------------------
    def page(self, right_title=None):
        d = self.doc
        if right_title is not None:
            self.right_title = right_title
        idx = d.new_page()
        d.rect(0, 0, self.W, 54, fill=P_INK)
        d.rect(0, 54, self.W, 3, fill=P_ORANGE)
        d.text(self.x0, 31, "COATES", size=15, bold=True, colour=P_ORANGE,
               tracking=3.2)
        d.text(self.x0 + 0.6, 43, "EQUIPPED FOR ANYTHING", size=5.8, bold=True,
               colour="#9AA2AC", tracking=1.5)
        d.text(self.x1, 27, self.right_title, size=10.5, bold=True,
               colour=P_WHITE, align="right", max_w=360)
        d.text(self.x1, 41, self.s.header_line, size=8.2, colour="#B9C0C9",
               align="right", max_w=360)
        self.y = 82
        return idx

    def footers(self):
        n = self.doc.page_count
        for i in range(n):
            self.doc.use_page(i)
            d = self.doc
            d.rect(0, self.H - 42, self.W, 42, fill=P_INK)
            d.rect(0, self.H - 42, self.W, 2, fill=P_ORANGE)
            x = self.x0
            x += d.text(x, self.H - 26, "COATES", size=7.5, bold=True,
                        colour=P_WHITE, tracking=1)
            x += d.text(x, self.H - 26, "   |   POWERED BY ", size=7, colour="#9AA2AC")
            x += d.text(x, self.H - 26, "SITEIQ", size=7, bold=True, colour=P_ORANGE)
            d.text(x, self.H - 26, "   |   Author: {}".format(
                self.s.author or "Andrew Fisher"), size=7, colour="#9AA2AC")
            d.text(self.x1, self.H - 26, "Page {} of {}".format(i + 1, n),
                   size=7.5, bold=True, colour=P_WHITE, align="right")
            d.text(self.x0, self.H - 14,
                   "Built {} | Issue-transaction dates | No costs".format(
                       self.asat.strftime("%d %b %Y %H:%M")),
                   size=6.5, colour="#B9C0C9", max_w=self.cw * 0.55)
            d.text(self.x1, self.H - 14, self.s.header_line, size=6.5,
                   colour="#B9C0C9", align="right", max_w=self.cw * 0.42)

    def need(self, h):
        """Make room for something h tall, breaking the page if not."""
        if self.y + h > self.bottom:
            self.page()
            if self.cont:
                self.cont()

    # ---- pieces ----------------------------------------------------------
    def icon(self, kind, x, y, s=9, colour=None):
        """A small flat glyph in a box s wide at (x, y): plane, counter,
        flag, clock, box, person, moves, bag, tag, shelf. Drawn, not an
        image, so it stays sharp and needs nothing embedded."""
        import math
        d = self.doc
        c = colour or P_ORANGE
        u = s / 10.0
        if kind in ("plane_in", "plane_out"):
            up = kind == "plane_out"
            x0, y0 = x + 1 * u, y + (2 * u if up else 8 * u)
            x1, y1 = x + 9 * u, y + (8 * u if up else 2 * u)
            d.polyline([(x0, y1), (x1, y0)], colour=c, lw=1.6 * u)
            tip = (x1, y0)
            back = -1 if up else 1
            d.polyline([(tip[0] - 4.2 * u, tip[1] + 0.2 * u * back), tip,
                        (tip[0] - 0.6 * u, tip[1] + 4.2 * u * back)],
                       colour=c, lw=1.6 * u, fill=None)
        elif kind == "counter":
            d.rect(x, y + 5.5 * u, 10 * u, 4.5 * u, fill=c, radius=1 * u)
            d.circle(x + 5 * u, y + 2.6 * u, 2 * u, fill=c)
        elif kind == "flag":
            d.rect(x + 1.5 * u, y, 1.3 * u, 10 * u, fill=c)
            d.polyline([(x + 2.8 * u, y + 0.5 * u), (x + 9.5 * u, y + 2.8 * u),
                        (x + 2.8 * u, y + 5.2 * u)], colour=None, fill=c)
        elif kind == "clock":
            d.circle(x + 5 * u, y + 5 * u, 4.4 * u, stroke=c, lw=1.4 * u)
            d.polyline([(x + 5 * u, y + 2.4 * u), (x + 5 * u, y + 5.2 * u), (x + 7.2 * u, y + 6.4 * u)],
                       colour=c, lw=1.3 * u)
        elif kind == "box":
            d.rect(x + 0.8 * u, y + 2 * u, 8.4 * u, 7.5 * u, stroke=c, lw=1.3 * u, radius=1 * u)
            d.rect(x + 0.8 * u, y + 2 * u, 8.4 * u, 2.4 * u, fill=c, radius=0.8 * u)
        elif kind == "person":
            d.circle(x + 5 * u, y + 2.8 * u, 2.3 * u, fill=c)
            d.ring(x + 5 * u, y + 10 * u, 4.6 * u, 0, 180, 0, c)
        elif kind == "moves":
            d.polyline([(x + 1 * u, y + 3 * u), (x + 9 * u, y + 3 * u)], colour=c, lw=1.4 * u)
            d.polyline([(x + 6.5 * u, y + 0.8 * u), (x + 9 * u, y + 3 * u), (x + 6.5 * u, y + 5.2 * u)],
                       colour=c, lw=1.4 * u)
            d.polyline([(x + 9 * u, y + 7.2 * u), (x + 1 * u, y + 7.2 * u)], colour=c, lw=1.4 * u)
            d.polyline([(x + 3.5 * u, y + 5 * u), (x + 1 * u, y + 7.2 * u), (x + 3.5 * u, y + 9.4 * u)],
                       colour=c, lw=1.4 * u)
        elif kind == "bag":
            d.rect(x + 1 * u, y + 3.5 * u, 8 * u, 6.5 * u, fill=c, radius=1.2 * u)
            d.ring(x + 5 * u, y + 3.6 * u, 3 * u, 1.8 * u, 180, 0, c)
        elif kind == "tag":
            d.polyline([(x + 1 * u, y + 1 * u), (x + 6 * u, y + 1 * u), (x + 9.5 * u, y + 5 * u),
                        (x + 6 * u, y + 9 * u), (x + 1 * u, y + 9 * u)], colour=None, fill=c)
            d.circle(x + 3.2 * u, y + 5 * u, 1.1 * u, fill=P_WHITE)
        elif kind == "shelf":
            for k in range(3):
                d.rect(x + 0.5 * u, y + 1 * u + 3.2 * u * k, 9 * u, 1.6 * u, fill=c, radius=0.5 * u)
        elif kind == "tick":
            d.polyline([(x + 1.5 * u, y + 5.5 * u), (x + 4.2 * u, y + 8.2 * u), (x + 8.8 * u, y + 2 * u)],
                       colour=c, lw=1.8 * u)

    @staticmethod
    def icon_for(label):
        z = (label or "").lower()
        if z.startswith("fly in"):
            return "plane_in"
        if z.startswith("fly out"):
            return "plane_out"
        if "counter" in z:
            return "counter"
        if "last shift" in z or z.startswith("starts"):
            return "flag"
        if "hour" in z or "longest" in z or "days" in z:
            return "clock"
        if "people" in z:
            return "person"
        if "move" in z or "issues" in z:
            return "moves"
        if "draw" in z or "consumables issued" in z:
            return "bag"
        if "own gear" in z or "coates items" in z:
            return "tag"
        if "shelf" in z:
            return "shelf"
        if "demob" in z or "items on hire" in z:
            return "box"
        return None

    def monogram(self, cx, cy, r, name, fill=None, ink=None):
        """A round badge with a company's initials - the mark that
        follows a company from the contents list to its section."""
        d = self.doc
        words = [w for w in _re.split(r"[\s\-/&,.']+", str(name or "")) if w]
        skip = {"pty", "ltd", "and", "the", "of", "co", "group", "contracting", "engineering",
                "electrical", "services", "australia", "aus", "qld"}
        core = [w for w in words if w.lower() not in skip] or words
        if len(core) >= 2:
            text = (core[0][0] + core[1][0]).upper()
        else:
            text = (core[0][:2] if core else "?").upper()
        d.circle(cx, cy, r, fill=fill or P_INK)
        d.text(cx, cy + r * 0.36, text, size=r * 0.95, bold=True, colour=ink or P_WHITE,
               align="centre")

    def progress_bar(self, x, y, w, pr, h=9, label=True, dark=False):
        """The shut as a strip of days: worked days in their phase colour,
        today in orange, days to come as a thin line of their colour."""
        d = self.doc
        days = pr["days"]
        n = max(1, len(days))
        gap = 1.5
        cw_ = (w - gap * (n - 1)) / float(n)
        today = pr["today"]
        for i, (d0, ph) in enumerate(days):
            cx0 = x + i * (cw_ + gap)
            colour = PHASE_COLOUR.get(ph, self.C_TRACK)
            if ph == "off":
                colour = "#D5D9DF"
            if dark:
                if ph == "night":
                    colour = "#8A93A0"
                past, track = "#DDE1E7", "#4A515C"
            else:
                past, track = colour, self.C_TRACK
            if d0 < today:
                d.rect(cx0, y, cw_, h, fill=past, radius=min(2, cw_ / 2.0))
            elif d0 == today:
                d.rect(cx0, y - 1.5, cw_, h + 3, fill=P_ORANGE, radius=min(2.5, cw_ / 2.0))
                d.circle(cx0 + cw_ / 2.0, y + h / 2.0, min(1.6, cw_ / 4.0), fill=P_WHITE)
            else:
                d.rect(cx0, y, cw_, h, fill=track, radius=min(2, cw_ / 2.0))
                d.rect(cx0, y + h - 2.5, cw_, 2.5, fill=colour, radius=1)
        if label:
            d.text(x, y + h + 11, pr["label"].upper(), size=6.3, bold=True, colour=P_MUTED,
                   tracking=0.5)
            d.text(x + w, y + h + 11, "{}  to  {}".format(
                pr["first"].strftime("%a %d %b"), pr["last"].strftime("%a %d %b")),
                size=6.3, colour=C_MUTED_LIGHT, align="right")
        return y + h + (16 if label else 0)

    def age_strip(self, x, y, w, bands, h=10, caption=True, dark=False):
        """How old what is out is, as one bar: a segment per age band in
        its colour, counts inside, the band names under."""
        d = self.doc
        total = float(sum(b[1] for b in bands)) or 0.0
        if not total:
            d.rect(x, y, w, h, fill=self.C_TRACK, radius=h / 2.0)
            return y + h
        xx = x
        tone_fill = {"red": E_RAG["red"][2], "amber": E_RAG["amber"][2],
                     "green": E_RAG["green"][2], "slate": self.C_SLATE, "orange": P_ORANGE,
                     "ink": "#2A313C", "muted": "#5B6472"}
        if dark:
            tone_fill.update({"ink": "#F3F4F7", "muted": "#C9CFD7", "slate": "#8A93A0"})
        first = True
        for label, n, tone in bands:
            if not n:
                continue
            bw = w * n / total
            d.rect(xx, y, bw, h, fill=tone_fill.get(tone, self.C_SLATE),
                   radius=h / 2.0 if (first or xx + bw >= x + w - 0.5) else 0)
            if bw >= 16:
                light = dark and tone in ("ink", "muted")
                d.text(xx + bw / 2.0, y + h / 2.0 + 2.6, "{:,}".format(n), size=6.8, bold=True,
                       colour=P_SLATE if light else P_WHITE, align="centre")
            if caption and bw >= 30:
                d.text(xx + bw / 2.0, y + h + 9, label, size=6.2, colour=P_MUTED, align="centre")
            elif caption and label == bands[-1][0]:
                d.text(xx + bw, y + h + 9, label, size=6.2, colour=P_MUTED, align="right")
            xx += bw
            first = False
        return y + h + (12 if caption else 0)

    def chip(self, x_right, y_top, text, tone, size=7.5):
        d = self.doc
        bg, fg, _bar = E_RAG.get(tone, E_RAG["slate"])
        w = d.text_width(text, size, bold=True) + 12
        d.rect(x_right - w, y_top, w, 13, fill=bg, radius=3.5)
        d.text(x_right - w / 2.0, y_top + 9.6, text, size=size, bold=True,
               colour=fg, align="centre")
        return w

    def tiles(self, tiles, h=50, gap=8):
        """A row of stat tiles: (value, label, tone)."""
        d = self.doc
        n = len(tiles)
        w = (self.cw - gap * (n - 1)) / float(n)
        x = self.x0
        for value, label, tone in tiles:
            _bg, fg, bar = E_RAG.get(tone or "orange", E_RAG["orange"])
            zero = str(value) in ("0", "-")
            ink = (fg if tone == "green" else P_INK) if not (zero and tone != "green") else P_MUTED
            d.rect(x, self.y, w, h, fill=P_WHITE, stroke=P_LINE, lw=0.6)
            d.rect(x, self.y, w, 2.5, fill=bar)
            kind = self.icon_for(label)
            if kind:
                self.icon(kind, x + w - 20, self.y + 9, 9, bar if not zero else C_MUTED_LIGHT)
            size = 17
            room_w = w - 32
            while size > 11 and d.text_width(str(value), size, bold=True) > room_w:
                size -= 1
            d.text(x + 10, self.y + 25, str(value), size=size, bold=True, colour=ink, max_w=room_w)
            d.text(x + 10, self.y + 39, label.upper(), size=6.6, bold=True,
                   colour=P_MUTED, tracking=0.4, max_w=w - 20)
            x += w + gap
        self.y += h

    def callout(self, text, tone="amber"):
        d = self.doc
        lines = d.wrap(text, 8.8, self.cw - 30)
        h = 16 + 12 * len(lines)
        self.need(h)
        _bg, _fg, bar = E_RAG.get(tone, E_RAG["amber"])
        d.rect(self.x0, self.y, self.cw, h, fill=P_TINT)
        d.rect(self.x0, self.y, 4, h, fill=bar)
        yy = self.y + 15
        for ln in lines:
            d.text(self.x0 + 16, yy, ln, size=8.8, colour=P_INK)
            yy += 12
        self.y += h

    def items_head(self):
        d = self.doc
        d.rect(self.x0, self.y, self.cw, 18, fill=P_INK)
        for x, label in ((self.x0 + 8, "ITEM NUMBER"), (self.x0 + 124, "DESCRIPTION"),
                         (self.x0 + 380, "ISSUED")):
            d.text(x, self.y + 12.2, label, size=6.8, bold=True, colour=P_WHITE,
                   tracking=0.6)
        d.text(self.x1 - 8, self.y + 12.2, "DAYS OUT", size=6.8, bold=True,
               colour=P_WHITE, tracking=0.6, align="right")
        d.rect(self.x0, self.y + 18, self.cw, 1.5, fill=P_ORANGE)
        self.y += 21

    def person_row(self, p):
        d = self.doc
        self.need(20 + (self.item_layout(p["items"][0])[2] if p["items"] else 24))
        d.rect(self.x0, self.y, self.cw, 20, fill=P_SOFT)
        n = len(p["items"])
        bits = ["{} item{}".format(n, "" if n == 1 else "s")]
        if p["since"]:
            bits.append("oldest issued {}".format(p["since"].strftime("%d %b %Y")))
        if p["undated"]:
            bits.append("{} undated".format(p["undated"]))
        meta = "  ·  ".join(bits)
        name_w = self.cw - 28 - d.text_width(meta, 8)
        d.text(self.x0 + 8, self.y + 13.5, p["who"], size=9.5, bold=True,
               colour=P_INK, max_w=max(60, name_w))
        d.text(self.x1 - 8, self.y + 13.5, meta, size=8,
               colour=P_MUTED, align="right")
        self.y += 20

    def item_layout(self, row):
        codes = self.doc.wrap(_s(row[2]) or "-", 8.2, 108)
        descriptions = self.doc.wrap(item_name(row[3]) or "(no description)", 9, 248)
        return codes, descriptions, 10 + 11.5 * max(len(codes), len(descriptions))

    def item_row(self, r, n):
        d = self.doc
        codes, desc_lines, h = self.item_layout(r)
        self.need(h)
        if n % 2:
            d.rect(self.x0, self.y, self.cw, h, fill=P_ZEBRA)
        for i, line in enumerate(codes):
            d.text(self.x0 + 8, self.y + 14 + 11.5 * i, line, size=8.2, colour=P_INK)
        for i, line in enumerate(desc_lines):
            d.text(self.x0 + 124, self.y + 14 + 11.5 * i, line, size=9, colour=P_INK)
        if r[5]:
            d.text(self.x0 + 380, self.y + 14, r[5].strftime("%d %b %Y"),
                   size=8.5, colour=P_MUTED)
        else:
            d.text(self.x0 + 380, self.y + 14, "not in export", size=7.8,
                   italic=True, colour=E_RAG["amber"][1])
        self.chip(self.x1 - 8, self.y + 4.5, _days_text(r[7]), day_tone(r[7]))
        d.line(self.x0, self.y + h, self.x1, self.y + h, colour=P_LINE, lw=0.4)
        self.y += h


    # ---- charts ------------------------------------------------------
    #  Light Coates palette for the visuals: orange and two tints of it,
    #  the greys, and red/amber/green only where a colour means something.
    C_ORANGE = "#F26222"
    C_ORANGE_2 = "#F7A072"
    C_ORANGE_3 = "#FCD3BE"
    C_SLATE = "#98A0AA"
    C_TRACK = "#EEF0F3"

    def card(self, x, y, w, h, title, sub="", dark=False):
        d = self.doc
        if dark:
            d.rect(x, y, w, h, fill=P_SLATE, radius=4)
            d.rect(x, y, w, 2.5, fill=P_ORANGE)
            d.text(x + 12, y + 19, title, size=9.5, bold=True, colour=P_WHITE, max_w=w - 24)
            if sub:
                d.text(x + 12, y + 30, sub, size=7.3, colour="#C9CFD7", max_w=w - 24)
            return y + 40
        d.rect(x, y, w, h, fill=P_WHITE, stroke=P_LINE, lw=0.6)
        d.text(x + 12, y + 17, title, size=9.5, bold=True, colour=P_INK, max_w=w - 24)
        if sub:
            d.text(x + 12, y + 28, sub, size=7.3, colour=P_MUTED, max_w=w - 24)
        return y + 38

    def gauge(self, cx, cy, pct, colour, value, label, sub, dark=False):
        """A half dial with round ends and quarter ticks - vector, so it
        is as crisp on a wall screen as on a phone. On a dark card the
        track goes charcoal and the type white."""
        import math
        d = self.doc
        pct = max(0.0, min(1.0, pct or 0.0))
        r_out, r_in = 41, 29.5
        rm, cap = (r_out + r_in) / 2.0, (r_out - r_in) / 2.0
        track = "#3E4651" if dark else self.C_TRACK
        tick = "#4A515C" if dark else P_LINE
        ink, muted = (P_WHITE, "#C9CFD7") if dark else (P_INK, P_MUTED)
        for a in (0, 45, 90, 135, 180):
            t = math.radians(a)
            d.line(cx + (r_out + 2.5) * math.cos(t), cy - (r_out + 2.5) * math.sin(t),
                   cx + (r_out + 5.5) * math.cos(t), cy - (r_out + 5.5) * math.sin(t),
                   colour=tick, lw=0.8)
        d.ring(cx, cy, r_out, r_in, 180, 0, track)
        d.circle(cx - rm, cy, cap, fill=track)
        d.circle(cx + rm, cy, cap, fill=track)
        if pct > 0:
            a_end = 180 - 180 * pct
            d.ring(cx, cy, r_out, r_in, 180, a_end, colour)
            d.circle(cx - rm, cy, cap, fill=colour)
            t = math.radians(a_end)
            d.circle(cx + rm * math.cos(t), cy - rm * math.sin(t), cap, fill=colour)
        d.text(cx, cy - 2, str(value), size=16, bold=True, colour=ink, align="centre")
        lines = d.wrap(label.upper(), 6.3, 84, bold=True, max_lines=2)
        for i, ln in enumerate(lines):
            d.text(cx, cy + 14 + 8 * i, ln, size=6.3, bold=True, colour=muted,
                   tracking=0.4, align="centre")
        #  the small line sits on one baseline across the row, so the dials
        #  read as a set whether the label above took one line or two
        d.text(cx, cy + 33, sub, size=7, colour=muted, align="centre", max_w=118)

    def hbars(self, x, y, w, rows, label_w=96, pitch=16, bar_h=10, colours=None,
              fmt=None, threshold=None):
        """Horizontal bars: rows of (label, value, [tone]). The biggest
        value fills the track; a threshold draws a dashed red line."""
        d = self.doc
        if not rows:
            d.text(x, y + 12, "Nothing to show", size=8, italic=True, colour=P_MUTED)
            return y + pitch
        biggest = max([r[1] for r in rows] + [0.0001])
        if threshold is not None:
            biggest = max(biggest, 100.0)
        track_x = x + label_w
        track_w = w - label_w - 40
        for i, r in enumerate(rows):
            label, value = r[0], r[1]
            tone = r[2] if len(r) > 2 else None
            yy = y + i * pitch
            lab_w = label_w - 8
            size = 8.0
            while size > 7.0 and d.text_width(label, size) > lab_w:
                size -= 0.2
            if d.text_width(label, size) <= lab_w:
                d.text(x, yy + 8.5, label, size=size, colour=P_INK)
            else:
                two = d.wrap(label, 6.8, lab_w, max_lines=2)
                if len(two) == 1:
                    d.text(x, yy + 8.5, two[0], size=6.8, colour=P_INK, max_w=lab_w)
                else:
                    d.text(x, yy + 5.2, two[0], size=6.8, colour=P_INK, max_w=lab_w)
                    d.text(x, yy + 12.6, two[1], size=6.8, colour=P_INK, max_w=lab_w)
            d.rect(track_x, yy, track_w, bar_h, fill=self.C_TRACK, radius=bar_h / 2.0)
            bw = track_w * (float(value) / biggest) if biggest else 0
            colour = (colours or {}).get(tone, self.C_ORANGE) if tone else self.C_ORANGE
            if bw > 0:
                d.rect(track_x, yy, max(bw, bar_h), bar_h, fill=colour, radius=bar_h / 2.0)
            text = fmt(value) if fmt else "{:,}".format(int(value))
            d.text(track_x + track_w + 36, yy + 8.5, text, size=8, bold=True,
                   colour=P_INK, align="right")
        if threshold is not None:
            tx = track_x + track_w * (threshold / biggest)
            d.polyline([(tx, y - 4), (tx, y + len(rows) * pitch - 4)],
                       colour=E_RAG["red"][2], lw=0.8, dash=[2.5, 2])
            d.text(tx, y - 7, "{}%".format(int(threshold)), size=6.5, bold=True,
                   colour=E_RAG["red"][1], align="centre")
        return y + len(rows) * pitch

    def donut(self, cx, cy, r, parts, total_label):
        """A donut of (label, value, colour) with the total in the middle."""
        d = self.doc
        total = float(sum(v for _l, v, _c in parts))
        scale = total or 1.0
        if not total:
            d.ring(cx, cy, r, r * 0.64, 90, -270, self.C_TRACK)
        a = 90.0
        for label, value, colour in parts:
            sweep = 360.0 * value / scale
            if sweep > 0:
                d.ring(cx, cy, r, r * 0.64, a, a - sweep, colour)
            a -= sweep
        d.circle(cx, cy, r * 0.64, fill=P_WHITE)
        #  A hairline of white between the slices, so each reads on its own.
        if len([p for p in parts if p[1] > 0]) > 1:
            import math
            a = 90.0
            for label, value, colour in parts:
                sweep = 360.0 * value / scale
                if sweep > 0:
                    t = math.radians(a)
                    d.line(cx + (r * 0.64 - 1) * math.cos(t), cy - (r * 0.64 - 1) * math.sin(t),
                           cx + (r + 1) * math.cos(t), cy - (r + 1) * math.sin(t),
                           colour=P_WHITE, lw=1.6)
                a -= sweep
        d.text(cx, cy + 2, "{:,}".format(int(total)), size=15, bold=True,
               colour=P_INK, align="centre")
        d.text(cx, cy + 13, total_label, size=6.5, bold=True, colour=P_MUTED,
               tracking=0.4, align="centre")

    def legend(self, x, y, x_right, parts, pitch=15):
        d = self.doc
        total = float(sum(v for _l, v, _c in parts)) or 1.0
        for i, (label, value, colour) in enumerate(parts):
            yy = y + i * pitch
            d.rect(x, yy + 1, 8, 8, fill=colour, radius=1.5)
            d.text(x + 14, yy + 8.5, label, size=8, colour=P_INK)
            d.text(x_right, yy + 8.5, "{:,}  ({:.0f}%)".format(int(value),
                                                               100.0 * value / total),
                   size=8, bold=True, colour=P_INK, align="right")

    def columns(self, x, y, w, h, days, series, line=None):
        """Grouped columns per day. series = [(name, values, colour)];
        line = (name, values, colour) draws a line over them on the
        same scale - gear out at the end of each day."""
        d = self.doc
        if not days:
            d.text(x, y + 12, "No dated movements in this export", size=8,
                   italic=True, colour=P_MUTED)
            return
        plot_h = h - 26
        head = 16                                # room for the legend and labels
        biggest = max([v for _n, vals, _c in series for v in vals]
                      + ([v for v in line[1]] if line else []) + [1])
        top = 4 * _nice_ceiling(biggest / 4.0)      # four round steps
        #  A quiet scale down the left: four gridlines with their values.
        ax_w = 22
        x_all = x
        x, w = x + ax_w, w - ax_w
        base = y + plot_h
        for k in range(1, 5):
            gy = base - (plot_h - head) * (k / 4.0)
            d.line(x, gy, x + w, gy, colour=P_LINE, lw=0.4)
            d.text(x - 4, gy + 2.2, "{:,}".format(int(round(top * k / 4.0))), size=5.8,
                   colour=C_MUTED_LIGHT, align="right")
        group_w = w / float(len(days))
        bar_w = max(3.0, (group_w - 10) / float(len(series)))
        d.line(x, base, x + w, base, colour=P_LINE, lw=0.6)
        for gi, day in enumerate(days):
            gx = x + gi * group_w + 5
            for si, (name, vals, colour) in enumerate(series):
                v = vals[gi]
                bh = (plot_h - head) * (v / float(top))
                bx = gx + si * bar_w
                if bh > 0:
                    d.rect(bx, base - bh, bar_w - 1.5, bh, fill=colour, radius=1)
                if v and bar_w >= 9:
                    d.text(bx + (bar_w - 1.5) / 2.0, base - bh - 2.5, "{:,}".format(int(v)),
                           size=6, colour=P_MUTED, align="centre")
            every = 1 if len(days) <= 8 else 2
            if gi % every == 0:
                d.text(x + gi * group_w + group_w / 2.0, base + 10,
                       day.strftime("%a %d") if len(days) <= 8 else day.strftime("%d"),
                       size=6.8, colour=P_MUTED, align="centre")
                d.text(x + gi * group_w + group_w / 2.0, base + 18, day.strftime("%b"),
                       size=6, colour=C_MUTED_LIGHT, align="centre")
        if line and len(line[1]) == len(days):
            pts = [(x + gi * group_w + group_w / 2.0, base - (plot_h - head) * (v / float(top)))
                   for gi, v in enumerate(line[1])]
            if len(pts) > 1:
                d.polyline(pts, colour=line[2], lw=1.3)
            for px, py in pts:
                d.circle(px, py, 1.7, fill=line[2])
        #  Legend, top right of the plot.
        lx = x + w
        if line:
            tw = d.text_width(line[0], 6.8)
            d.text(lx, y - 3, line[0], size=6.8, colour=P_MUTED, align="right")
            lx -= tw + 6
            d.polyline([(lx - 12, y - 5.5), (lx - 1, y - 5.5)], colour=line[2], lw=1.3)
            d.circle(lx - 6.5, y - 5.5, 1.7, fill=line[2])
            lx -= 20
        for name, _vals, colour in reversed(series):
            tw = d.text_width(name, 6.8)
            d.text(lx, y - 3, name, size=6.8, colour=P_MUTED, align="right")
            lx -= tw + 6
            d.rect(lx - 7, y - 9, 7, 7, fill=colour, radius=1.5)
            lx -= 19

    def glance(self, parts):
        """One page of charts and gauges: the store today, drawn from the
        same numbers as the tables, in the light Coates palette."""
        d = self.doc
        v = parts["viz"]
        idx = self.page("On-Hire Report by Company")
        self.doc.bookmark("At a glance", idx, 60)
        d.text(self.x0, self.y + 16, "At a glance", size=18, bold=True, colour=P_INK)
        d.text(self.x0, self.y + 31, "The store today as pictures, from the same "
               "numbers as the tables.", size=9, colour=P_MUTED, max_w=self.cw - 170)
        d.text(self.x1, self.y + 16, "AS AT {}".format(
            self.asat.strftime("%d %b %Y %H:%M").upper()), size=7, bold=True,
            colour=P_ORANGE_TEXT, tracking=1.2, align="right")
        d.text(self.x1, self.y + 31, self.when.strftime("%A %d %B %Y"), size=8.5,
               colour=P_MUTED, align="right")
        self.y += 44

        # ---- gauges --------------------------------------------------------
        st_ = parts.get("story") or {}
        n_dials = 5 if st_.get("st_total") else 4
        top = self.card(self.x0, self.y, self.cw, 122,
                        "The {} dials".format("five" if n_dials == 5 else "four"),
                        "How much of the fleet is working, how solid the dates are, "
                        "where the consumables sit, what is overdue"
                        + (" and what was sighted" if n_dials == 5 else ""), dark=True)
        slot = self.cw / float(n_dials)
        cy = top + 34
        fleet = v["coates_out"] / float(v["coates_total"] or 1)
        dated = v["dated"] / float(v["onhire"] or 1)
        tight = v["cons_tight"] / float(v["cons_lines"] or 1)
        over = v["long_out"] / float(v["onhire"] or 1)
        red, amber, green = E_RAG["red"][2], E_RAG["amber"][2], E_RAG["green"][2]
        self.gauge(self.x0 + slot * 0.5, cy, fleet, self.C_ORANGE,
                   "{:.0f}%".format(fleet * 100), "Coates fleet on hire",
                   "{:,} of {:,} items out now".format(v["coates_out"], v["coates_total"]), dark=True)
        if v["onhire"]:
            self.gauge(self.x0 + slot * 1.5, cy, dated, green if not v["undated"] else amber,
                       "{:.0f}%".format(dated * 100), "Dated from transactions",
                       "{:,} undated".format(v["undated"]) if v["undated"] else "every item dated", dark=True)
        else:
            self.gauge(self.x0 + slot * 1.5, cy, 0, self.C_SLATE, "-",
                       "Dated from transactions", "nothing on hire to date", dark=True)
        self.gauge(self.x0 + slot * 2.5, cy, tight,
                   amber if v["cons_tight"] else green,
                   "{:.0f}%".format(tight * 100), "Consumable lines past 80%",
                   "{:,} of {:,} lines".format(v["cons_tight"], v["cons_lines"]), dark=True)
        self.gauge(self.x0 + slot * 3.5, cy, over, red if v["long_out"] else green,
                   "{:,}".format(v["long_out"]), "Items out over {} days".format(LONG_OUT_DAYS),
                   "oldest {} days".format(v["oldest_days"]) if v["onhire"] else "nothing out", dark=True)
        if n_dials == 5:
            pct = st_["st_pct"] or 0
            self.gauge(self.x0 + slot * 4.5, cy, pct,
                       green if pct >= 0.75 else (amber if pct >= 0.5 else red),
                       "{:.0f}%".format(pct * 100), "Sighted in last 3 days",
                       "{:,} of {:,} items".format(st_["st_sighted"], st_["st_total"]), dark=True)
        self.y += 122 + 6

        #  How old what is out is - one bar, every item on hire in it.
        age = v.get("age") or []
        n_out = sum(b[1] for b in age)
        top = self.card(self.x0, self.y, self.cw, 60, "Age of what is out",
                        ("{:,} item{} on hire - by how long each has been out".format(
                            n_out, "" if n_out == 1 else "s") if n_out
                         else "No items are recorded on hire in this export"))
        if n_out:
            self.age_strip(self.x0 + 12, top - 2, self.cw - 24, age, h=11)
        else:
            d.rect(self.x0 + 12, top - 2, self.cw - 24, 11, fill=E_RAG["green"][0], radius=5.5)
            d.text(self.x0 + self.cw / 2.0, top + 6.5, "NONE OUT", size=6.3, bold=True,
                   colour=E_RAG["green"][1], tracking=1, align="centre")
        self.y += 60 + 10

        half = (self.cw - 10) / 2.0
        xr = self.x0 + half + 10
        H = 142
        tone_fill = {"red": red, "amber": amber, "green": green, "slate": self.C_SLATE}

        # ---- row 2: who holds gear | tooling ratings ------------------------
        rows = sorted([(c[0], c[1]) for c in parts["companies"] if c[1]],
                      key=lambda row: (-row[1], row[0].casefold()))[:6]
        if rows:
            top = self.card(self.x0, self.y, half, H, "Who is holding gear",
                            "Items on hire now - six largest holdings")
        else:
            top = self.card(self.x0, self.y, half, H, "Who moved the most gear",
                            "Tooling issues and returns this period - nothing is on hire now")
            rows = sorted([(c[0], c[2]) for c in parts["companies"] if c[2]],
                          key=lambda x: -x[1])[:6]
        self.hbars(self.x0 + 12, top, half - 24, rows, label_w=100, pitch=16)
        top = self.card(xr, self.y, half, H, "Tooling lines by rating",
                        "Every item line on site, rated on turns")
        mix = [(k, v["tool_mix"].get(k, 0), tone_fill[TONE[k]])
               for k in ("High Demand", "Good Use", "Low Use", "No Use")]
        self.donut(xr + 58, top + 54, 46, mix, "LINES")
        self.legend(xr + 128, top + 24, xr + half - 12, mix)
        self.y += H + 10

        # ---- row 3: movements by day | consumable ratings -------------------
        top = self.card(self.x0, self.y, half, H, "Movements by day",
                        "Issues, returns and consumables issued, inside the export window")
        days = [dd for dd, _i, _r, _c in v["by_day"]]
        series = [("Issued", [i for _d, i, _r, _c in v["by_day"]], self.C_ORANGE),
                  ("Returned", [r for _d, _i, r, _c in v["by_day"]], self.C_SLATE),
                  ("Consumables", [c for _d, _i, _r, c in v["by_day"]], self.C_ORANGE_3)]
        obd = v.get("out_by_day") or []
        line = (("Out at day's end", [n for _d, n in obd], P_INK)
                if obd and len(obd) == len(days) and any(n for _d, n in obd) else None)
        self.columns(self.x0 + 12, top + 8, half - 24, H - 54, days, series, line=line)
        top = self.card(xr, self.y, half, H, "Consumable lines by rating",
                        "Every line on the shelf, rated on share of position sold")
        mix = [(k, v["cons_mix"].get(k, 0), tone_fill[TONE[k]])
               for k in ("High Demand", "Good Use", "Low Use", "No Use")]
        self.donut(xr + 58, top + 54, 46, mix, "LINES")
        self.legend(xr + 128, top + 24, xr + half - 12, mix)
        self.y += H + 10

        # ---- row 4: working hardest | consumables running down --------------
        top = self.card(self.x0, self.y, half, H, "Working hardest",
                        "Issues per item on site - highest turns first")
        rows = [(r[0], r[3] / float(r[1]) if r[1] else 0,
                 TONE.get(r[4], "slate")) for r in parts["hardest"][:6]]
        self.hbars(self.x0 + 12, top, half - 24, rows, label_w=138, pitch=16,
                   colours=tone_fill, fmt=lambda value: "{:.1f}x".format(value))
        kx = self.x0 + 12
        for word in ("High Demand", "Good Use"):
            d.rect(kx, top + 6 * 16 + 4, 7, 7, fill=tone_fill[TONE[word]], radius=1.5)
            kx += d.text(kx + 11, top + 6 * 16 + 10.5, word, size=6.8, colour=P_MUTED) + 22
        top = self.card(xr, self.y, half, H, "Consumables running down",
                        "Share of the position gone out - past the line, we order")
        rows = [(r[0], round(r[3] * 100), "amber" if r[3] >= 0.6 else "green") for r in parts["consumables"][:6]]
        self.hbars(xr + 12, top + 6, half - 24, rows, label_w=124, pitch=16,
                   colours=tone_fill, fmt=lambda x: "{:.0f}%".format(x),
                   threshold=CONS_TIGHT * 100)
        self.y += H
        return idx

    def stacked(self, x, y, w, h, parts_, legend_y=None):
        """One horizontal stacked bar of (label, value, colour)."""
        d = self.doc
        total = float(sum(v for _l, v, _c in parts_)) or 1.0
        xx = x
        for label, value, colour in parts_:
            bw = w * value / total
            if bw > 0:
                d.rect(xx, y, bw, h, fill=colour)
                if bw > 34:
                    d.text(xx + bw / 2.0, y + h / 2.0 + 3.5, "{:,}".format(int(value)),
                           size=8.5, bold=True, colour=P_WHITE, align="centre")
            xx += bw
        ly = legend_y if legend_y is not None else y + h + 14
        lx = x
        for label, value, colour in parts_:
            text = "{} {:,} ({:.0f}%)".format(label, int(value), 100.0 * value / total)
            need_w = 12 + d.text_width(text, 7.5) + 14
            if lx > x and lx + need_w > x + w:
                lx = x
                ly += 12
            d.rect(lx, ly - 7, 8, 8, fill=colour, radius=1.5)
            lx += 12
            lx += d.text(lx, ly, text, size=7.5, colour=P_MUTED) + 14
        return ly + 4

    def story(self, parts):
        """Page two: what the store did this period, in plain words and a
        few honest pictures - the brief, the team at the counter, how
        gear moved, what the stocktake verified, the customer-owned gear
        that went through the counter, and the standards behind it."""
        d = self.doc
        st = parts["story"]
        c = parts["counts"]
        idx = self.page("On-Hire Report by Company")
        self.doc.bookmark("The story", idx, 60)
        d.text(self.x0, self.y + 16, "The story", size=18, bold=True, colour=P_INK)
        d.text(self.x0, self.y + 31, "What the store did this period, in plain words.",
               size=9, colour=P_MUTED)
        d.text(self.x1, self.y + 16, "AS AT {}".format(
            self.asat.strftime("%d %b %Y %H:%M").upper()), size=7, bold=True,
            colour=P_ORANGE_TEXT, tracking=1.2, align="right")
        d.text(self.x1, self.y + 31, self.when.strftime("%A %d %B %Y"), size=8.5,
               colour=P_MUTED, align="right")
        self.y += 44

        # ---- the brief: positive and true, every number off the exports --
        lab = st.get("labour") or {}
        tx_total = parts["_tx_total"]
        brief = []
        brief.append("The Coates tool store is supporting {:,} compan{} and {:,} {} "
                     "on site, with {:,} item{} on hire right now from a managed fleet "
                     "of {:,} item{} across {:,} tool type{}.".format(
                         st["companies_active"], "y" if st["companies_active"] == 1 else "ies",
                         st["people"], "person" if st["people"] == 1 else "people",
                         c["onhire"], "" if c["onhire"] == 1 else "s",
                         st["fleet"], "" if st["fleet"] == 1 else "s",
                         st["types"], "" if st["types"] == 1 else "s"))
        returns = st["same_day"] + st["kept"]
        brief.append("Over the report period the store processed {:,} movement{} - {:,} "
                     "tooling transaction{} and {:,} consumable draw{} - with {:,} "
                     "completed return{} recorded in the export.".format(
                         tx_total[0] + tx_total[1], "" if sum(tx_total) == 1 else "s",
                         tx_total[0], "" if tx_total[0] == 1 else "s",
                         tx_total[1], "" if tx_total[1] == 1 else "s",
                         returns, "" if returns == 1 else "s"))
        if st["same_day"]:
            brief.append("{:,} of those returns came back the same day they went out - "
                         "crews and the store working exactly as intended.".format(st["same_day"]))
        if st["own_total"]:
            brief.append("On top of the Coates fleet, {:,} movements of customer- and "
                         "contractor-owned gear were logged through the same counter - "
                         "nothing crosses it untracked, whoever owns it.".format(st["own_total"]))
        if st.get("st_total"):
            brief.append("{:,} of {:,} store items were physically sighted in the last "
                         "three days ({:.0f}%) by {} counter{}.".format(
                             st["st_sighted"], st["st_total"], 100 * st["st_pct"],
                             len(st["st_counters"]), "" if len(st["st_counters"]) == 1 else "s"))
        if lab.get("people") and lab.get("hours"):
            brief.append("Behind it, the store has run on {:,.0f} staffed hours so far "
                         "{}- day and night coverage, so there is always a Coates person "
                         "at the counter.".format(
                             lab["hours"], "under the fixed rate " if st["fixed_rate"] else ""))
        elif lab.get("people"):
            names = sorted(lab["people"])
            brief.append("The counter is rostered for {:,.0f} staffed hours{} - {} - "
                         "day and night coverage{}, so there is always a Coates person "
                         "at the counter.".format(
                             lab.get("rostered", 0),
                             (" from {}".format(lab["first"].strftime("%a %d %b"))
                              if lab.get("first") else ""),
                             " and ".join(names) if len(names) <= 3 else
                             "{} people".format(len(names)),
                             " under the fixed rate" if st["fixed_rate"] else ""))
        prev = st.get("previous")
        if prev and prev.get("onhire") is not None:
            diff = c["onhire"] - prev["onhire"]
            brief.append("That is {} the last report on {}.".format(
                "{:,} {} than".format(abs(diff), "more" if diff > 0 else "fewer") if diff
                else "level with", prev["day"].strftime("%d %b")))
        if c.get("undated"):
            brief.append("{:,} on-hire item{} no issue transaction inside the export "
                         "window and {} shown as undated.".format(
                             c["undated"], " has" if c["undated"] == 1 else "s have",
                             "is" if c["undated"] == 1 else "are"))
        text = " ".join(brief)
        lines = d.wrap(text, 9.6, self.cw - 32)
        box_h = 34 + 13.5 * len(lines) + 6
        d.rect(self.x0, self.y, self.cw, box_h, fill=P_TINT)
        d.rect(self.x0, self.y, 4, box_h, fill=P_ORANGE)
        d.text(self.x0 + 16, self.y + 20, "THE BRIEF", size=7.2, bold=True, colour=P_ORANGE_TEXT,
               tracking=1.2)
        d.paragraph(self.x0 + 16, self.y + 34, text, size=9.6, max_w=self.cw - 32,
                    colour=P_INK, leading=13.5)
        self.y += box_h + 12

        half = (self.cw - 10) / 2.0
        xr = self.x0 + half + 10
        H = 160
        red, amber, green = E_RAG["red"][2], E_RAG["amber"][2], E_RAG["green"][2]

        # ---- row: the team | how gear is moving ----------------------------
        top = self.card(self.x0, self.y, half, H, "The team at the counter",
                        "Coates people and hours to date, from the roster" +
                        (" - under the fixed rate" if st["fixed_rate"] else ""))
        if lab.get("people"):
            started = bool(lab.get("hours"))
            key = "hours" if started else "rostered"
            yy = top
            d.text(self.x0 + 12, yy + 6, "NAME", size=6.6, bold=True, colour=P_MUTED, tracking=.5)
            d.text(xr - 22, yy + 6, "HOURS" if started else "ROSTERED", size=6.6, bold=True,
                   colour=P_MUTED, tracking=.5, align="right")
            yy += 12
            for name, pp in sorted(lab["people"].items())[:3]:
                d.line(self.x0 + 12, yy, xr - 22, yy, colour=P_LINE, lw=0.4)
                d.text(self.x0 + 12, yy + 12, name, size=9, bold=True, colour=P_INK, max_w=120)
                shifts = ", ".join(sorted(pp["shifts"],
                                          key=lambda z: (not z.lower().endswith("shift"), z)))
                d.text(self.x0 + 12, yy + 22, shifts, size=7, colour=P_MUTED, max_w=half - 90)
                d.text(xr - 22, yy + 14, "{:,.0f}".format(pp.get(key, 0)), size=11, bold=True,
                       colour=P_INK, align="right")
                yy += 26
            d.line(self.x0 + 12, yy, xr - 22, yy, colour=P_INK, lw=0.8)
            if started:
                d.text(self.x0 + 12, yy + 13, "Staffed hours to date", size=8, bold=True, colour=P_INK)
                d.text(xr - 22, yy + 13, "{:,.0f}".format(lab["hours"]), size=11, bold=True,
                       colour=P_ORANGE, align="right")
            else:
                d.text(self.x0 + 12, yy + 13, "Rostered hours{}".format(
                    " from {}".format(lab["first"].strftime("%d %b")) if lab.get("first") else ""),
                    size=8, bold=True, colour=P_INK)
                d.text(xr - 22, yy + 13, "{:,.0f}".format(lab.get("rostered", 0)), size=11,
                       bold=True, colour=P_ORANGE, align="right")
        else:
            d.text(self.x0 + 12, top + 14, "No roster entries for this report date.",
                   size=8.5, italic=True, colour=P_MUTED)
        top = self.card(xr, self.y, half, H, "How gear is moving",
                        "Every tooling issue this period, and what happened next")
        moving = [("Returned same day", st["same_day"], green),
                  ("Kept longer, returned", st["kept"], amber),
                  ("Still on hire", st["still_out"], red if st["still_out"] else self.C_SLATE)]
        if sum(x[1] for x in moving):
            end_y = self.stacked(xr + 12, top + 10, half - 24, 22, moving, legend_y=top + 50)
            ret = st["same_day"] + st["kept"]
            pct = (100.0 * st["same_day"] / ret) if ret else 0
            d.paragraph(xr + 12, max(top + 72, end_y + 10),
                        "{:.0f}% of returns came back the same day they went out. Same-day "
                        "returns keep records clean and gear available for the next crew - if "
                        "it is not in use, bring it back.".format(pct),
                        size=8, max_w=half - 24, colour=P_MUTED, leading=11, max_lines=3)
        else:
            d.text(xr + 12, top + 14, "No tooling movements in this export.", size=8.5,
                   italic=True, colour=P_MUTED)
        self.y += H + 10

        # ---- row: stocktake discipline | customer-owned gear ---------------
        top = self.card(self.x0, self.y, half, H, "Stocktake discipline",
                        "Items physically sighted in the last three days")
        if st.get("st_total"):
            pct = st["st_pct"]
            tone = green if pct >= 0.75 else (amber if pct >= 0.5 else red)
            self.gauge(self.x0 + 62, top + 52, pct, tone, "{:.0f}%".format(pct * 100),
                       "Sighted in 3 days", "{:,} of {:,} items".format(st["st_sighted"], st["st_total"]))
            d.paragraph(self.x0 + 122, top + 10,
                        "Daily stock takes - nothing in the store goes more than 30 days "
                        "unscanned. Sighted by {}. The count doubles as the on-hire check: "
                        "anything in the store still showing as on hire is corrected the "
                        "same day.".format(", ".join(st["st_counters"]) or "the counter"),
                        size=7.6, max_w=half - 134, colour=P_MUTED, leading=10, max_lines=8)
        else:
            d.text(self.x0 + 12, top + 14, "No STOCKTAKE export in this run.", size=8.5,
                   italic=True, colour=P_MUTED)
        top = self.card(xr, self.y, half, H, "Customer-owned gear through the counter",
                        "Their equipment, logged and scanned like the fleet")
        if st["own_total"]:
            d.text(xr + 12, top + 13, "{:,}".format(st["own_total"]), size=18, bold=True,
                   colour=P_INK)
            d.text(xr + half - 12, top + 12, "MOVEMENTS / {} COMPANIES".format(
                st["own_companies"]), size=6.5, bold=True, colour=P_MUTED, align="right")
            rows = sorted(st["own_by_co"].items(), key=lambda kv: (-kv[1], kv[0]))[:5]
            self.hbars(xr + 12, top + 23, half - 24, rows, label_w=120,
                       pitch=15, bar_h=8)
        else:
            d.text(xr + 12, top + 14, "None logged this period.", size=8.5, italic=True,
                   colour=P_MUTED)
        self.y += H + 10

        # ---- the standards ---------------------------------------------------
        notes = [
            ("Double scan - check at issue and return.",
             "Scan and visually check every item when it leaves the counter and when it comes back."),
            ("Dated from the transaction.",
             "Issue dates come from transaction starts. No matching transaction means undated."),
            ("Life Saving Rule 5 - Tools and Equipment (SEQ-GL-009).",
             "Issue fit-for-purpose gear only. Tag out damaged or defective equipment and remove it from service."),
        ]
        if st["fixed_rate"]:
            notes.append(("Fixed-rate engagement.",
                          "The agreed fixed rate applies. Commercials stay in the workbook; this pack carries no costs."))
        wrapped_notes = [(head, d.wrap(body, 7.8, self.cw - 44)) for head, body in notes]
        h = 42 + sum(14 + 10 * len(lines) for _h, lines in wrapped_notes)
        self.need(h)
        top = self.card(self.x0, self.y, self.cw, h, "The standards behind the numbers")
        yy = top - 6
        for head, lines in wrapped_notes:
            d.rect(self.x0 + 12, yy + 1, 3, 6 + 10 * len(lines), fill=P_ORANGE)
            d.text(self.x0 + 22, yy + 7, head, size=8.6, bold=True, colour=P_INK)
            for k_, ln in enumerate(lines):
                d.text(self.x0 + 22, yy + 17.5 + 10 * k_, ln, size=7.8, colour=P_MUTED)
            yy += 14 + 10 * len(lines)
        self.y += h
        return idx

    # ---- looking ahead ----------------------------------------------------
    def timeline(self, x, y, w, fc):
        """The roster as a strip: a column per day, a row per person,
        each cell coloured by what that day is - travel, mobilisation,
        day shift, night shift. Days already worked are outlined, days
        to come are filled. Returns the y below it."""
        d = self.doc
        days, people, today = fc["days"], fc["people"][:6], fc["today"]
        label_w = 104
        n = len(days)
        col_w = (w - label_w) / float(max(n, 1))
        pitch, cell_h = 22, 16
        today_in = days[0] <= today <= days[-1]
        if today_in:                              # a tinted column behind today
            i = (today - days[0]).days
            d.rect(x + label_w + col_w * i - 0.5, y - 2, col_w + 1,
                   33 + pitch * len(people) + 1, fill=P_TINT, radius=4)
        for i, day in enumerate(days):
            cx = x + label_w + col_w * i + col_w / 2.0
            d.text(cx, y + 8, day.strftime("%a") if col_w >= 24 else day.strftime("%a")[0],
                   size=6.2, bold=True, colour=P_MUTED, align="centre")
            d.text(cx, y + 18, day.strftime("%d"), size=8, bold=True, colour=P_INK,
                   align="centre")
            if i == 0 or day.day == 1:
                d.text(cx, y + 25.5, day.strftime("%b").upper(), size=5.4, bold=True,
                       colour=P_ORANGE_TEXT, tracking=.6, align="centre")
        yy = y + 31
        for name, hours, _done, _phs in people:
            d.text(x, yy + cell_h / 2.0 + 3, name, size=8.2, bold=True, colour=P_INK,
                   max_w=label_w - 10)
            g = fc["grid"].get(name, {})
            for i, day in enumerate(days):
                cx0 = x + label_w + col_w * i + 1.5
                cw_ = col_w - 3
                cell = g.get(day)
                ph = cell[0] if cell else "off"
                colour = PHASE_COLOUR[ph]
                done = day < today
                if ph == "off":
                    d.rect(cx0, yy, cw_, cell_h, fill=self.C_TRACK, radius=3)
                elif done:
                    d.rect(cx0, yy, cw_, cell_h, fill=P_WHITE, stroke=colour, lw=0.9, radius=3)
                else:
                    d.rect(cx0, yy, cw_, cell_h, fill=colour, radius=3)
                if cell and cell[2] and cw_ >= 15 and ph != "off":
                    d.text(cx0 + cw_ / 2.0, yy + cell_h / 2.0 + 2.4, "{:g}".format(cell[2]),
                           size=6.5, bold=True, colour=colour if done else P_WHITE,
                           align="centre")
            yy += pitch
        if today_in:
            i = (today - days[0]).days
            tx = x + label_w + col_w * i + col_w / 2.0
            d.text(tx, yy + 3, "TODAY", size=5.4, bold=True, colour=P_ORANGE_TEXT, tracking=.6,
                   align="centre")
            yy += 5
        lx = x
        for key, label, colour in PHASES:
            if key not in fc["phases_used"] or key == "off":
                continue
            text = label + (" " + fc["times"][key] if fc["times"].get(key) else "")
            d.rect(lx, yy + 4.5, 9, 9, fill=colour, radius=2)
            lx += 13
            lx += d.text(lx, yy + 12, text, size=6.8, colour=P_MUTED) + 14
        if any(day < today for day in days):
            d.rect(lx, yy + 4.5, 9, 9, fill=P_WHITE, stroke=P_MUTED, lw=0.8, radius=2)
            lx += 13
            d.text(lx, yy + 12, "worked", size=6.8, colour=P_MUTED)
        return yy + 20

    def hour_profile(self, x, y, w, h, counts, busy):
        """Scans at the counter by hour of day - 24 bars, the two busiest
        hours in full orange and labelled."""
        d = self.doc
        n = 24
        biggest = max(counts + [1])
        gap = 1.6
        bw = (w - gap * (n - 1)) / float(n)
        base = y + h - 12
        plot_h = h - 12 - 10
        for hh in busy:                       # the hour either side of a crunch
            bx0 = x + max(0, hh - 1) * (bw + gap)
            bx1 = x + min(24, hh + 2) * (bw + gap) - gap
            d.rect(bx0 - 1, y - 2, bx1 - bx0 + 2, base - y + 2, fill=P_TINT, radius=2)
        d.line(x, base, x + w, base, colour=P_LINE, lw=0.6)
        for i, c in enumerate(counts):
            bh = plot_h * c / float(biggest)
            bx = x + i * (bw + gap)
            colour = (self.C_ORANGE if i in busy else
                      (self.C_ORANGE_2 if c >= 0.5 * biggest else self.C_ORANGE_3))
            if bh > 0:
                d.rect(bx, base - bh, bw, bh, fill=colour, radius=min(1.5, bw / 2.0))
            if i in busy and c:
                d.text(bx + bw / 2.0, base - bh - 3, "{:,}".format(c), size=6, bold=True,
                       colour=P_INK, align="centre")
        for hh in (0, 6, 12, 18):
            d.text(x + hh * (bw + gap), base + 9, "{:02d}:00".format(hh), size=6.2,
                   colour=P_MUTED)
        d.text(x + w, base + 9, "24:00", size=6.2, colour=P_MUTED, align="right")

    def ahead(self, parts):
        """Page three: the shut ahead. The roster as a timeline, the
        milestones, the counter's rhythm last time and what to have
        ready - dates, people and movements only, never a dollar."""
        d = self.doc
        fc = parts["forecast"]
        ref = fc["ref"]
        idx = self.page("On-Hire Report by Company")
        self.doc.bookmark("Looking ahead", idx, 60)
        d.text(self.x0, self.y + 16, "Looking ahead", size=18, bold=True, colour=P_INK)
        d.text(self.x0, self.y + 31,
               ("The shut ahead - roster, the counter's rhythm last time, what to have ready."
                if fc["state"] == "ahead" else
                "The rest of this shut - roster, the counter's rhythm, what to have ready."),
               size=9, colour=P_MUTED, max_w=self.cw - 150)
        d.text(self.x1, self.y + 16, "AS AT {}".format(
            self.asat.strftime("%d %b %Y %H:%M").upper()), size=7, bold=True,
            colour=P_ORANGE_TEXT, tracking=1.2, align="right")
        d.text(self.x1, self.y + 31, self.when.strftime("%A %d %B %Y"), size=8.5,
               colour=P_MUTED, align="right")
        self.y += 44

        text = fc["brief"] + " " + fc["ref_line"]
        lines = d.wrap(text, 9.6, self.cw - 32)
        box_h = 34 + 13.5 * len(lines) + 6
        d.rect(self.x0, self.y, self.cw, box_h, fill=P_TINT)
        d.rect(self.x0, self.y, 4, box_h, fill=P_ORANGE)
        d.text(self.x0 + 16, self.y + 20, "THE SHUT AHEAD" if fc["state"] == "ahead"
               else "THE REST OF THE SHUT", size=7.2, bold=True, colour=P_ORANGE_TEXT, tracking=1.2)
        d.paragraph(self.x0 + 16, self.y + 34, text, size=9.6, max_w=self.cw - 32,
                    colour=P_INK, leading=13.5)
        self.y += box_h + 10

        #  Milestones, five across.
        tiles = fc["milestones"]
        gap, h = 8, 44
        w = (self.cw - gap * (len(tiles) - 1)) / float(len(tiles))
        x = self.x0
        for label, value, sub in tiles:
            d.rect(x, self.y, w, h, fill=P_WHITE, stroke=P_LINE, lw=0.6)
            d.rect(x, self.y, w, 2.5, fill=P_ORANGE)
            kind = self.icon_for(label)
            if kind:
                self.icon(kind, x + w - 15, self.y + 7, 7)
            d.text(x + 9, self.y + 20, value, size=11, bold=True, colour=P_INK, max_w=w - 24)
            d.text(x + 9, self.y + 30.5, label.upper(), size=6, bold=True, colour=P_INK,
                   tracking=0.4, max_w=w - 16)
            d.text(x + 9, self.y + 39, sub, size=6.5, colour=P_MUTED, max_w=w - 16)
            x += w + gap
        self.y += h + 10

        #  The roster, day by day.
        n_people = min(len(fc["people"]), 6)
        tl_h = 38 + 31 + 22 * n_people + 26 + (5 if fc["days"][0] <= fc["today"] <= fc["days"][-1] else 0)
        top = self.card(self.x0, self.y, self.cw, tl_h, "The roster, day by day",
                        "Who is on the counter each day{}".format(
                            " - the Coates Labour tab as typed" if n_people else ""))
        self.timeline(self.x0 + 12, top - 6, self.cw - 24, fc)
        self.y += tl_h + 10

        half = (self.cw - 10) / 2.0
        xr = self.x0 + half + 10
        room = self.bottom - self.y - 30
        H2 = 150
        n_rows = max(2, min(7, int((room - H2 - 10 - 52) // 16)))
        H3 = 52 + 16 * n_rows

        #  Row: when the counter is busiest | a day at the counter.
        top = self.card(self.x0, self.y, half, H2, "When the counter is busiest",
                        "Scans by hour of day{} - every issue, return and draw".format(
                            ", last time" if ref["previous"] else ""))
        if ref["scans"]:
            self.hour_profile(self.x0 + 12, top + 2, half - 24, H2 - 80, ref["hour"], ref["busy"])
            if ref["busy"]:
                peaks = " and ".join("{:02d}:00".format(hour) for hour in ref["busy"])
                d.paragraph(self.x0 + 12, top + H2 - 74,
                            "{} {} for {:.0f}% of {:,} timed scan{}. Use this pattern "
                            "to plan counter cover.".format(
                                peaks, "accounts" if len(ref["busy"]) == 1 else "account",
                                ref["busy_share"] * 100, ref["scans"],
                                "" if ref["scans"] == 1 else "s"),
                            size=7.4, max_w=half - 24, colour=P_MUTED, leading=10)
        else:
            d.text(self.x0 + 12, top + 14, "No timed movements in this export.", size=8.5,
                   italic=True, colour=P_MUTED)
        top = self.card(xr, self.y, half, H2, "A day at the counter" +
                        (", last time" if ref["previous"] else ", so far"),
                        "{} - {}".format(ref["label"], ref["span"]) if ref["moves"] else "")
        if ref["moves"]:
            stats = [("{:,.0f}".format(ref["per_day"]), "movements a day",
                      "{:,} over {} days".format(ref["moves"], ref["days"])),
                     ("{:,}".format(ref["peak"]), "on the busiest day",
                      ref["peak_day"].strftime("%A %d %b") if ref["peak_day"] else ""),
                     (("{:.0f}%".format(ref["same_day_pct"]) if ref["same_day_pct"] is not None
                       else "-"), "returned same day", "crews bringing gear straight back"),
                     ("{:,}".format(ref["companies"]), "companies served",
                      "{:,} people through the counter".format(ref["people"]))]
            cw2 = (half - 24) / 2.0
            for k, (val, lab, sub) in enumerate(stats):
                sx = xr + 12 + (k % 2) * cw2
                sy = top + 4 + (k // 2) * 46
                d.text(sx, sy + 18, val, size=16, bold=True, colour=P_INK)
                d.text(sx, sy + 28, lab.upper(), size=6, bold=True, colour=P_MUTED, tracking=.4,
                       max_w=cw2 - 8)
                d.text(sx, sy + 37, sub, size=6.5, colour=P_MUTED, max_w=cw2 - 8)
        else:
            d.text(xr + 12, top + 14, "No movements in this export to set an expectation from.",
                   size=8.5, italic=True, colour=P_MUTED)
        self.y += H2 + 10

        #  Row: have these ready | consumables that go fastest.
        top = self.card(self.x0, self.y, half, H3, "Have these ready",
                        "The tooling asked for most{} - times issued".format(
                            " last time" if ref["previous"] else ""))
        self.hbars(self.x0 + 12, top + 2, half - 24, ref["top_tools"][:n_rows], label_w=138, pitch=16)
        top = self.card(xr, self.y, half, H3, "Consumables that go fastest",
                        "Quantity drawn{} - stock the shelf for it".format(
                            " last time" if ref["previous"] else " so far"))
        self.hbars(xr + 12, top + 2, half - 24,
                   [(a, b) for a, b in ref["top_cons"][:n_rows]], label_w=138, pitch=16,
                   fmt=lambda v: "{:,.0f}".format(v))
        self.y += H3 + 8
        if self.y + 22 <= self.bottom:
            d.paragraph(self.x0, self.y + 8,
                        "Expectations come from the record of {} ({}){} - a guide, not a promise. "
                        "Roster and dates are the Coates Labour tab as at {}. No costs anywhere "
                        "in this pack.".format(
                            ref["label"], ref["span"],
                            ", the last shut on this site" if ref["previous"] else "",
                            self.when.strftime("%d %b %Y")),
                        size=7.5, max_w=self.cw, colour=P_MUTED, leading=10.5)
        return idx

    def closing(self, parts, blocks):
        """The last page: how to read the pack - what the chips, bands and
        ratings mean - the asks in full, where the numbers come from, and
        the sign-off. A pack should finish, not just stop."""
        d = self.doc
        idx = self.page("On-Hire Report by Company")
        self.doc.bookmark("How to read this pack", idx, 60)
        d.text(self.x0, self.y + 16, "How to read this pack", size=18, bold=True, colour=P_INK)
        d.text(self.x0, self.y + 31, "What the colours mean, where the numbers come from, "
               "and what happens next.", size=9, colour=P_MUTED)
        d.text(self.x1, self.y + 16, "AS AT {}".format(
            self.asat.strftime("%d %b %Y %H:%M").upper()), size=7, bold=True,
            colour=P_ORANGE_TEXT, tracking=1.2, align="right")
        d.text(self.x1, self.y + 31, self.when.strftime("%A %d %B %Y"), size=8.5,
               colour=P_MUTED, align="right")
        self.y += 44
        half = (self.cw - 10) / 2.0
        xr = self.x0 + half + 10

        # ---- the key -------------------------------------------------------
        H = 150
        top = self.card(self.x0, self.y, half, H, "Days out",
                        "The chip beside every item and person")
        yy = top + 2
        for text, tone, meaning in (("today", day_tone(0), "issued today"),
                                    ("3 days", day_tone(3), "out this week - normal"),
                                    ("12 days", day_tone(12), "worth a look"),
                                    ("21+ days", day_tone(21), "overdue - please return or confirm"),
                                    ("undated", "amber", "no issue transaction in the export window")):
            self.chip(self.x0 + 70, yy, text, tone)
            d.text(self.x0 + 80, yy + 9.5, meaning, size=8, colour=P_INK)
            yy += 19
        top = self.card(xr, self.y, half, H, "Age of what is out",
                        "The bar under the dials and in every section")
        yy = top + 2
        fills = {"ink": "#2A313C", "muted": "#5B6472", "slate": self.C_SLATE,
                 "amber": E_RAG["amber"][2], "red": E_RAG["red"][2]}
        for label, lo, hi in AGE_BANDS:
            d.rect(xr + 12, yy + 1, 14, 9, fill=fills[AGE_TONES[label]], radius=2)
            d.text(xr + 32, yy + 9.5, label, size=8, bold=True, colour=P_INK)
            d.text(xr + 92, yy + 9.5, {"today": "issued today", "1-3 days": "the normal turn",
                                       "4-7 days": "a week out", "8-20 days": "watch",
                                       "21+ days": "overdue"}[label], size=8, colour=P_MUTED)
            yy += 15
        d.rect(xr + 12, yy + 1, 14, 9, fill=E_RAG["amber"][2], radius=2)
        d.text(xr + 32, yy + 9.5, "undated", size=8, bold=True, colour=P_INK)
        d.text(xr + 92, yy + 9.5, "no issue transaction in the window", size=8, colour=P_MUTED)
        self.y += H + 10

        H = 96
        top = self.card(self.x0, self.y, half, H, "Ratings",
                        "On the charts page and in the workbook")
        yy = top + 2
        for word, meaning in (("High Demand", "out faster than we turn it - order more"),
                              ("Good Use", "earning its keep"),
                              ("Low Use", "little call for it"),
                              ("No Use", "has not gone out - review, send home")):
            self.chip(self.x0 + 76, yy, word, TONE.get(word, "slate"))
            d.text(self.x0 + 86, yy + 9.5, meaning, size=8, colour=P_INK, max_w=half - 100)
            yy += 15
        top = self.card(xr, self.y, half, H, "Where the numbers come from",
                        "Nothing in this pack is estimated")
        d.paragraph(xr + 12, top + 10,
                    "Every figure is counted off the SiteIQ exports of the day: RENTAL_STOCK, "
                    "SALES_STOCK, TRANSACTIONS{}. On-hire dates are the start of each item's "
                    "issue transaction; the export covers {}. No costs appear anywhere in "
                    "this pack.".format(
                        " and STOCKTAKE" if (parts.get("story") or {}).get("st_total") else "",
                        self.period or "the stated period"),
                    size=7.8, max_w=half - 24, colour=P_MUTED, leading=10.5, max_lines=5)
        self.y += H + 10

        # ---- the asks, in full -------------------------------------------------
        acts = parts.get("actions") or []
        if acts:
            self.action_card(acts)

        # ---- sign-off ------------------------------------------------------------
        h = 78
        if self.y + h <= self.bottom:
            d.rect(self.x0, self.y, self.cw, h, fill=P_INK, radius=4)
            d.rect(self.x0, self.y, 4, h, fill=P_ORANGE)
            d.text(self.x0 + 18, self.y + 22, "Prepared by {}".format(self.s.author or "Andrew Fisher"),
                   size=11, bold=True, colour=P_WHITE)
            d.text(self.x0 + 18, self.y + 36, "Shutdown Tool Store  \u00b7  Coates  \u00b7  {}".format(
                self.s.header_line), size=8.5, colour="#B9C0C9", max_w=self.cw - 150)
            d.paragraph(self.x0 + 18, self.y + 51, "Questions, corrections or a chase: reply to the "
                        "report email. The counter is the fastest way to get an item off your name.",
                        size=7.8, colour="#B9C0C9", max_w=self.cw - 150, leading=10, max_lines=2)
            d.text(self.x1 - 16, self.y + 26, "COATES", size=15, bold=True, colour=P_ORANGE,
                   tracking=3, align="right")
            d.text(self.x1 - 16, self.y + 38, "EQUIPPED FOR ANYTHING", size=5.8, bold=True,
                   colour="#9AA2AC", tracking=1.5, align="right")
            d.text(self.x1 - 16, self.y + 54, "POWERED BY SITEIQ", size=6.5, bold=True,
                   colour="#9AA2AC", tracking=1.2, align="right")
            self.y += h
        return idx

    def people_bars(self, b):
        """Inside a company section: who holds how much, as bars."""
        d = self.doc
        people = sorted(b["people"], key=lambda p: -len(p["items"]))
        rows = [(p["who"], len(p["items"])) for p in people[:9]]
        if len(people) > 9:
            rows.append(("{} others".format(len(people) - 9),
                         sum(len(p["items"]) for p in people[9:])))
        h = 44 + 15 * len(rows)
        self.need(h)
        top = self.card(self.x0, self.y, self.cw, h, "Items by person",
                        "Who is holding the most, longest-held items are in the table below")
        self.hbars(self.x0 + 12, top - 2, self.cw - 24, rows, label_w=150, pitch=15,
                   bar_h=9)
        self.y += h + 10

    # ---- a company section --------------------------------------------
    def section(self, b, right_title=None, index=None, total=None):
        d = self.doc
        co = b["company"]
        start = self.page(right_title if right_title is not None
                          else "On-Hire Report by Company")
        self.doc.bookmark(co, start, 60)

        #  The band: charcoal, the company's mark in orange, its name in white,
        #  what this page is - and how old its gear is, on the right.
        n_people = len(b["people"])
        share = (100.0 * b["items"] / float(self.total_onhire)
                 if getattr(self, "total_onhire", 0) else None)
        if b["items"]:
            story = "{} item{} out with {} {}".format(
                b["items"], "" if b["items"] == 1 else "s", n_people,
                "person" if n_people == 1 else "people")
            if share is not None:
                story += " - {:.0f}% of everything on hire".format(share)
            if b["oldest_days"] is not None:
                story += ". Oldest issue {}".format(_days_text(b["oldest_days"]))
            if b["undated"]:
                story += ". {} undated".format(b["undated"])
        else:
            story = ("Nothing on hire right now. This period: "
                     "{:,} tooling movement{}, {:,} consumable draw{}".format(
                         b["issues"], "" if b["issues"] == 1 else "s",
                         b["draws"], "" if b["draws"] == 1 else "s"))
            if b.get("own"):
                story += ", {:,} own-gear movement{}".format(b["own"], "" if b["own"] == 1 else "s")
        text_ = story + "."
        while len(d.wrap(text_, 9, self.cw - 270)) > 2 and ". " in text_:
            text_ = text_.rsplit(". ", 1)[0] + "."     # whole sentences only
        sub_lines = d.wrap(text_, 9, self.cw - 270, max_lines=2)
        name_size = 18
        while name_size > 13 and d.text_width(co, name_size, bold=True) > self.cw - 270:
            name_size -= 0.5
        name_lines = d.wrap(co, name_size, self.cw - 270, bold=True)
        name_extra = (len(name_lines) - 1) * (name_size + 2)
        band_h = 60 + name_extra + 11 * (len(sub_lines) - 1)
        d.rect(self.x0, self.y, self.cw, band_h, fill=P_SLATE, radius=4)
        d.rect(self.x0, self.y, 5, band_h, fill=P_ORANGE)
        self.monogram(self.x0 + 34, self.y + band_h / 2.0, 15, co,
                      fill=P_ORANGE if b["items"] else "#5B6472", ink=P_WHITE)
        for i, line in enumerate(name_lines):
            d.text(self.x0 + 60, self.y + 25 + i * (name_size + 2), line,
                   size=name_size, bold=True, colour=P_WHITE)
        for k_, ln in enumerate(sub_lines):
            d.text(self.x0 + 60, self.y + 40 + name_extra + 11 * k_, ln, size=9, colour="#C9CFD7")
        if index and total:
            d.text(self.x1 - 14, self.y + 18, "SECTION {} OF {}".format(index, total),
                   size=7, bold=True, colour=P_ORANGE, tracking=1.2, align="right")
        d.text(self.x1 - 14, self.y + 31, self.when.strftime("%A %d %B %Y"), size=8.5,
               colour="#C9CFD7", align="right")
        if b["items"] and b.get("age"):
            d.text(self.x1 - 14, self.y + 43, "AGE OF WHAT IS OUT", size=5.8, bold=True,
                   colour="#9AA2AC", tracking=0.6, align="right")
            self.age_strip(self.x1 - 184, self.y + 47, 170, b["age"], h=8, caption=False, dark=True)
        self.y += band_h + 10

        tiles = [
            (b["items"], "Items on hire", "orange" if b["items"] else "green"),
            (n_people, "People", "orange"),
            (b["issues"], "Tool moves", "orange"),
            (b.get("draws", 0), "Draws", "orange"),
        ]
        if b.get("own"):
            tiles.append((b["own"], "Own gear", "orange"))
        tiles.append((_days_text(b["oldest_days"]) if b["oldest_days"] is not None
                      else ("undated" if b["undated"] else "-"), "Longest out",
                      day_tone(b["oldest_days"]) if b["items"] else "slate"))
        #  The tiles with something in them lead; a quiet company's zeros
        #  sit at the end, and "nothing on hire" reads as the good news it is.
        tiles.sort(key=lambda t: str(t[0]) in ("0", "-"))
        self.tiles(tiles)
        self.y += 12
        if len(b["people"]) >= 2:
            self.people_bars(b)

        if b["long_out"]:
            names = {}
            for p in b["people"]:
                k = len([r for r in p["items"]
                         if r[7] is not None and r[7] >= LONG_OUT_DAYS])
                if k:
                    names[p["who"]] = k
            who = ", ".join("{} ({})".format(w, k) for w, k in
                            sorted(names.items(), key=lambda kv: -kv[1]))
            self.callout("{} item{} {} been out longer than {} days - worth a "
                         "call before it turns into a demob problem: {}."
                         .format(b["long_out"], "" if b["long_out"] == 1 else "s",
                                 "has" if b["long_out"] == 1 else "have",
                                 LONG_OUT_DAYS, who), "red")
            self.y += 10
        if b["undated"]:
            self.callout("{} item{} on hire to {} {} no issue transaction inside "
                         "the transactions export ({}), so {} shown as undated "
                         "rather than given a date nobody can stand behind."
                         .format(b["undated"], "" if b["undated"] == 1 else "s", co,
                                 "has" if b["undated"] == 1 else "have",
                                 self.period or "this period",
                                 "it is" if b["undated"] == 1 else "they are"),
                         "amber")
            self.y += 10

        #  The table. If it runs over a page, the next page says so and
        #  repeats the headings.
        def continued():
            d.text(self.x0, self.y + 12, co, size=12, bold=True, colour=P_INK,
                   max_w=self.cw - 120)
            d.text(self.x1, self.y + 12, "(continued)", size=8.5, italic=True,
                   colour=P_MUTED, align="right")
            self.y += 20
            d.line(self.x0, self.y, self.x1, self.y, colour=P_LINE, lw=0.6)
            self.y += 8
            self.items_head()
        self.cont = continued

        if b["people"]:
            self.items_head()
            n = 0
            for p in b["people"]:
                self.person_row(p)
                for r in p["items"]:
                    self.item_row(r, n)
                    n += 1
        else:
            self.need(30)
            d.rect(self.x0, self.y, self.cw, 26, fill=P_SOFT)
            d.rect(self.x0, self.y, 4, 26, fill=E_RAG["green"][2])
            d.text(self.x0 + 14, self.y + 16.5,
                   "No items are recorded on hire in this export.", size=8.8,
                   colour=P_INK, max_w=self.cw - 28)
            self.y += 26

        #  Consumables this company has drawn, biggest first.
        lines = b["consumables"]
        if lines:
            self.cont = lambda: None
            self.y += 16
            self.need(60)
            d.text(self.x0, self.y + 10, "Consumables issued to {} this period"
                   .format(co), size=10.5, bold=True, colour=P_INK,
                   max_w=self.cw - 150)
            d.text(self.x1, self.y + 10, "{:,} units across {} line{}".format(
                b["cons_qty"], len(lines), "" if len(lines) == 1 else "s"),
                size=8.5, colour=P_MUTED, align="right")
            self.y += 16
            d.rect(self.x0, self.y, self.cw, 16, fill=P_SOFT)
            d.text(self.x0 + 8, self.y + 11, "LINE", size=6.8, bold=True,
                   colour=P_MUTED, tracking=0.6)
            d.text(self.x1 - 100, self.y + 11, "QTY", size=6.8, bold=True,
                   colour=P_MUTED, tracking=0.6, align="right")
            d.text(self.x1 - 8, self.y + 11, "PEOPLE", size=6.8, bold=True,
                   colour=P_MUTED, tracking=0.6, align="right")
            self.y += 16
            d.line(self.x0, self.y, self.x1, self.y, colour=P_LINE, lw=0.6)
            shown = lines[:12]
            biggest = max([v["qty"] for _k, v in shown] + [1])
            for k, (desc, v) in enumerate(shown):
                self.need(16)
                d.text(self.x0 + 8, self.y + 11.5, desc, size=8.8, colour=P_INK,
                       max_w=self.cw - 300)
                d.rect(self.x1 - 210, self.y + 4.5, 100, 7, fill=self.C_TRACK, radius=3.5)
                bw = 100 * v["qty"] / float(biggest)
                if bw > 0:
                    d.rect(self.x1 - 210, self.y + 4.5, max(bw, 7), 7, fill=self.C_ORANGE, radius=3.5)
                d.text(self.x1 - 100, self.y + 11.5, "{:,}".format(int(v["qty"])),
                       size=9, bold=True, colour=P_INK, align="right")
                np_ = len(v["people"])
                d.text(self.x1 - 8, self.y + 11.5,
                       "{} {}".format(np_, "person" if np_ == 1 else "people")
                       if np_ else "-", size=8.5, colour=P_MUTED, align="right")
                self.y += 16
                d.line(self.x0, self.y, self.x1, self.y, colour=P_LINE, lw=0.4)
            if len(lines) > len(shown):
                self.need(14)
                d.text(self.x0, self.y + 11, "Showing the {} biggest of {} lines - "
                       "the rest are on the Consumable Transactions tab of the "
                       "workbook.".format(len(shown), len(lines)), size=8,
                       italic=True, colour=P_MUTED)
                self.y += 14

        own_lines = b.get("own_lines") or []
        if own_lines:
            self.cont = lambda: None
            self.y += 16
            self.need(60)
            d.text(self.x0, self.y + 10, "Own gear through the counter - {}".format(co),
                   size=10.5, bold=True, colour=P_INK, max_w=self.cw - 150)
            d.text(self.x1, self.y + 10, "{:,} movement{} logged".format(
                b["own"], "" if b["own"] == 1 else "s"), size=8.5, colour=P_MUTED, align="right")
            self.y += 16
            d.rect(self.x0, self.y, self.cw, 16, fill=P_SOFT)
            d.text(self.x0 + 8, self.y + 11, "THEIR ITEM", size=6.8, bold=True, colour=P_MUTED, tracking=0.6)
            d.text(self.x1 - 8, self.y + 11, "MOVEMENTS", size=6.8, bold=True, colour=P_MUTED,
                   tracking=0.6, align="right")
            self.y += 16
            d.line(self.x0, self.y, self.x1, self.y, colour=P_LINE, lw=0.6)
            biggest = max([nmv for _d_, nmv in own_lines[:10]] + [1])
            for desc, nmv in own_lines[:10]:
                self.need(16)
                d.text(self.x0 + 8, self.y + 11.5, desc, size=8.8, colour=P_INK, max_w=self.cw - 250)
                d.rect(self.x1 - 150, self.y + 4.5, 100, 7, fill=self.C_TRACK, radius=3.5)
                bw = 100 * nmv / float(biggest)
                if bw > 0:
                    d.rect(self.x1 - 150, self.y + 4.5, max(bw, 7), 7, fill=self.C_SLATE, radius=3.5)
                d.text(self.x1 - 8, self.y + 11.5, "{:,}".format(nmv), size=9, bold=True,
                       colour=P_INK, align="right")
                self.y += 16
                d.line(self.x0, self.y, self.x1, self.y, colour=P_LINE, lw=0.4)
            if len(own_lines) > 10:
                self.need(14)
                d.text(self.x0, self.y + 11, "Showing the 10 busiest of {} lines - the full list "
                       "is on the Customer Gear tab of the workbook.".format(len(own_lines)),
                       size=8, italic=True, colour=P_MUTED)
                self.y += 14

        self.cont = None
        self.y += 14
        self.need(14)
        d.text(self.x0, self.y + 9, "That is everything on hire to {} - {} item{}. "
               "No costs appear in this pack; they are in the workbook."
               .format(co, b["items"], "" if b["items"] == 1 else "s"),
               size=8, italic=True, colour=P_MUTED, max_w=self.cw)
        return start

    def action_layout(self, actions):
        col_w = (self.cw - 16) / 2.0
        rows = []
        for start in range(0, len(actions), 2):
            cells = []
            for head, body in actions[start:start + 2]:
                heads = self.doc.wrap(head, 9, col_w - 32, bold=True)
                lines = self.doc.wrap(body, 8, col_w - 32)
                cells.append((heads, lines))
            height = max(11 * len(hs) + 10.5 * len(ls) + 12 for hs, ls in cells)
            rows.append((cells, height))
        return col_w, rows, 40 + sum(height for _cells, height in rows)

    def action_card(self, actions, layout=None):
        col_w, rows, height = layout or self.action_layout(actions)
        self.need(height)
        d = self.doc
        top = self.card(self.x0, self.y, self.cw, height, "What needs attention",
                        "Clear actions - reply to the report email or speak to the counter")
        yy = top + 1
        number = 1
        for cells, row_h in rows:
            for col, (heads, lines) in enumerate(cells):
                xx = self.x0 + 12 + col * (col_w + 16)
                d.rect(xx, yy - 1, 15, 15, fill=P_ORANGE, radius=3)
                d.text(xx + 7.5, yy + 10, str(number), size=8, bold=True,
                       colour=P_WHITE, align="centre")
                ty = yy + 9
                for line in heads:
                    d.text(xx + 23, ty, line, size=9, bold=True, colour=P_INK)
                    ty += 11
                for line in lines:
                    d.text(xx + 23, ty, line, size=8, colour=P_MUTED)
                    ty += 10.5
                number += 1
            yy += row_h
        self.y += height + 10

    # ---- the cover -----------------------------------------------------
    def cover(self, parts, blocks, quiet, starts):
        d = self.doc
        self.doc.use_page(0)
        self.y = 82
        s = self.s
        #  The hero: a charcoal band under the header with the job, the
        #  title, the date, the shut's progress - and the one number that
        #  matters today, big, on the right.
        pr = parts.get("progress")
        prev = parts.get("previous")
        c = parts["counts"]
        hero_h = 150
        hy = 57
        d.rect(0, hy, self.W, hero_h, fill=P_SLATE)
        d.text(self.x0, hy + 26, s.header_line.upper(), size=7.5, bold=True,
               colour=P_ORANGE, tracking=1.6, max_w=self.cw - 230)
        d.text(self.x0, hy + 62, "On-Hire Report", size=30, bold=True, colour=P_WHITE)
        d.text(self.x0, hy + 80, "The position, the priorities and every company’s gear",
               size=9.5, colour="#B9C0C9", max_w=300)
        line = "{}  \u00b7  as at {}".format(
            self.when.strftime("%A %d %B %Y"), self.asat.strftime("%H:%M"))
        st_ = parts.get("story") or {}
        if st_.get("demob") and not pr:
            dd = st_["days_to_demob"]
            line += "  \u00b7  demob {} ({})".format(
                st_["demob"].strftime("%d %b"),
                "today" if dd == 0 else ("{} day{} to go".format(dd, "" if dd == 1 else "s")
                                         if dd > 0 else "done"))
        d.text(self.x0, hy + 100, line, size=9.5, bold=True, colour=P_WHITE, max_w=300)
        if pr:
            d.text(self.x0, hy + 120, pr["label"].upper(), size=6.3, bold=True,
                   colour="#C9CFD7", tracking=0.8)
            self.progress_bar(self.x0, hy + 126, 300, pr, h=7, label=False, dark=True)
        #  the headline number
        rx = self.x1
        if c["onhire"]:
            big = "{:,}".format(c["onhire"])
            d.text(rx, hy + 78, big, size=54, bold=True, colour=P_WHITE, align="right")
            d.text(rx, hy + 92, "ITEMS ON HIRE NOW", size=7, bold=True, colour=P_ORANGE,
                   tracking=1.2, align="right")
            d.text(rx, hy + 106, "{:,} compan{}  \u00b7  oldest {}".format(
                c["companies"], "y" if c["companies"] == 1 else "ies",
                _days_text(c["oldest_days"])), size=9, colour="#C9CFD7", align="right")
        else:
            d.text(rx, hy + 74, "0", size=54, bold=True, colour=E_RAG["green"][2],
                   align="right")
            d.text(rx, hy + 90, "NOTHING ON HIRE", size=7, bold=True, colour=P_ORANGE,
                   tracking=1.2, align="right")
            d.text(rx, hy + 104, "No items are recorded on hire in this export", size=8,
                   colour="#C9CFD7", align="right")
        if prev:
            mv_, what_ = _moves_delta(prev, parts["_tx_total"][0], parts["_tx_total"][1])
            bits = []
            for now, was, what in ((c["onhire"], prev.get("onhire"), "on hire"),
                                   (mv_, 0 if mv_ is not None else None, what_ or "movements")):
                if was is None:
                    continue
                diff = now - was
                good = (diff <= 0) if what == "on hire" else True
                bits.append(("{:+,} {}".format(diff, what) if diff else "{} level".format(what),
                             (E_RAG["green"][2] if good else E_RAG["amber"][2]) if diff else "#9AA2AC"))
            d.text(rx, hy + 122, "SINCE {}".format(prev["day"].strftime("%a %d %b").upper()),
                   size=6.3, bold=True, colour="#C9CFD7", tracking=0.8, align="right")
            xx = rx
            for txt, col in reversed(bits):
                w_ = d.text_width(txt, 9, bold=True)
                d.text(xx, hy + 135, txt, size=9, bold=True, colour=col, align="right")
                xx -= w_ + 12
        self.y = hy + hero_h + 14

                #  Where we sit, in words.
        d.text(self.x0, self.y + 8, "WHERE WE SIT TODAY", size=7.2, bold=True,
               colour=P_ORANGE_TEXT, tracking=1.2)
        yy = self.y + 24
        call = [ln for ln in parts["call"] if "the last report" not in ln][:3]
        for i, line in enumerate(call):
            yy = d.paragraph(self.x0, yy, line, size=10.5 if i == 0 else 9.2,
                             max_w=self.cw, bold=(i == 0),
                             colour=P_INK if i == 0 else P_MUTED,
                             leading=14 if i == 0 else 12.2) + 2
        self.y = yy + 4

        #  The headline numbers, three across, two rows.
        tiles = parts["tiles"]
        gap, h = 8, 40
        w = (self.cw - gap * 2) / 3.0
        for start in range(0, len(tiles), 3):
            x = self.x0
            for label, value, sub in tiles[start:start + 3]:
                rule, ink = P_ORANGE, P_INK
                if str(value) == "0" and label.lower().startswith("items on hire"):
                    rule, ink = E_RAG["green"][2], E_RAG["green"][1]
                    sub = "no items recorded on hire"
                elif str(value) == "0":
                    ink = P_MUTED
                d.rect(x, self.y, w, h, fill=P_WHITE, stroke=P_LINE, lw=0.6)
                d.rect(x, self.y, w, 2.5, fill=rule)
                kind = "tick" if rule != P_ORANGE else self.icon_for(label)
                if kind:
                    self.icon(kind, x + w - 20, self.y + 9, 9,
                              rule if (rule != P_ORANGE or ink == P_INK) else C_MUTED_LIGHT)
                d.text(x + 10, self.y + 19, str(value), size=16, bold=True,
                       colour=ink)
                d.text(x + 10, self.y + 28.5, label.upper(), size=6.3, bold=True,
                       colour=P_INK, tracking=0.4, max_w=w - 20)
                d.text(x + 10, self.y + 36, sub, size=6.6, colour=P_MUTED,
                       max_w=w - 20)
                x += w + gap
            self.y += h + gap
        self.y += 2

        #  Contents - every company, and the page it starts on. Each row
        #  is a link, and each company is a bookmark down the side.
        d.text(self.x0, self.y + 10, "In this pack", size=11, bold=True,
               colour=P_INK)
        d.text(self.x1, self.y + 10, "{} compan{}  \u00b7  {} pages  \u00b7  Select a row or use PDF bookmarks".format(
            len(blocks), "y" if len(blocks) == 1 else "ies", self.doc.page_count),
            size=8.5, colour=P_MUTED, align="right")
        self.y += 18
        cols = ((self.x0 + 8, "COMPANY", "left"), (self.x0 + 230, "ITEMS", "right"),
                (self.x0 + 282, "PEOPLE", "right"), (self.x0 + 340, "MOVES", "right"),
                (self.x0 + 398, "OWN GEAR", "right"),
                (self.x0 + 478, "LONGEST OUT", "right"), (self.x1 - 8, "PAGE", "right"))
        d.rect(self.x0, self.y, self.cw, 18, fill=P_INK)
        for x, label, align in cols:
            d.text(x, self.y + 12.2, label, size=6.8, bold=True, colour=P_WHITE,
                   tracking=0.6, align=align)
        d.rect(self.x0, self.y + 18, self.cw, 1.5, fill=P_ORANGE)
        self.y += 21
        n_rows = len(blocks)
        h = 19 if n_rows <= 8 else (16.5 if n_rows <= 10 else (15 if n_rows <= 11 else 14))
        fs = 9.2 if n_rows <= 8 else 8.6
        base_y = h - 6 if n_rows <= 8 else h - 4.5
        #  Room must stay for a compact asks card beneath the list. On a
        #  big shut the rows tighten first; past that the list stops and
        #  says how many more companies have sections and bookmarks.
        #  (a two-up asks card is 30 + 19 * 2, plus the trailer row, the gaps
        #  and the card's top margin)
        actions_layout = self.action_layout(parts.get("actions") or [])
        reserve_full = actions_layout[2] + 44
        reserve = reserve_full + 14
        listed = blocks
        avail_full = self.bottom - self.y - reserve_full
        if n_rows * h > avail_full:
            for h_try in (13, 12):
                if n_rows * h_try <= avail_full:
                    h, fs, base_y = h_try, 7.8, h_try - 3.8
                    break
        avail = self.bottom - self.y - reserve
        if n_rows * h > avail:
            for h_try in (13, 12):
                if n_rows * h_try <= avail:
                    h, fs, base_y = h_try, 7.8, h_try - 3.8
                    break
            if n_rows * h > avail:
                h, fs, base_y = 12, 7.8, 8.2
                listed = blocks[:max(1, int(avail // h) - 1)]
        biggest_items = max([b["items"] for b in blocks] + [1])
        for k, b in enumerate(listed):
            if k % 2:
                d.rect(self.x0, self.y, self.cw, h, fill=P_ZEBRA)
            if b["items"]:
                #  a quiet data bar behind the name: this company's share of what is out
                d.rect(self.x0, self.y, 216 * b["items"] / float(biggest_items), h, fill=P_TINT)
            self.monogram(self.x0 + 12, self.y + h / 2.0, 5.5 if h < 19 else 6.2, b["company"],
                          fill=P_INK if b["items"] else self.C_SLATE)
            d.text(self.x0 + 24, self.y + base_y, b["company"], size=fs, bold=True,
                   colour=P_INK, max_w=190)
            d.text(self.x0 + 230, self.y + base_y, str(b["items"]), size=fs - 0.4, bold=True,
                   colour=P_INK if b["items"] else P_MUTED, align="right")
            d.text(self.x0 + 282, self.y + base_y, str(len(b["people"])), size=fs - 0.4,
                   colour=P_INK if b["people"] else P_MUTED, align="right")
            d.text(self.x0 + 340, self.y + base_y, "{:,}".format(b["issues"] + b.get("draws", 0)),
                   size=fs - 0.4, colour=P_INK, align="right")
            d.text(self.x0 + 398, self.y + base_y, "{:,}".format(b.get("own", 0)) if b.get("own") else "-",
                   size=fs - 0.4, colour=P_INK if b.get("own") else P_MUTED, align="right")
            self.chip(self.x0 + 478, self.y + (h - 13) / 2.0,
                      _days_text(b["oldest_days"]) if b["items"] else "nothing out",
                      day_tone(b["oldest_days"]) if b["items"] else "slate", size=7 if h < 19 else 7.5)
            d.text(self.x1 - 8, self.y + base_y, str(starts[k] + 1), size=fs,
                   bold=True, colour=P_ORANGE_TEXT, align="right")
            d.line(self.x0, self.y + h, self.x1, self.y + h, colour=P_LINE, lw=0.4)
            d.link(self.x0, self.y, self.cw, h, starts[k])
            self.y += h
        if len(listed) < n_rows:
            d.text(self.x0 + 24, self.y + h - 3.8,
                   "and {} more compan{} - each has its own section and bookmark".format(
                       n_rows - len(listed), "y" if n_rows - len(listed) == 1 else "ies"),
                   size=7.8, italic=True, colour=P_MUTED)
            self.y += h
        self.y += 8

        # All action sentences remain readable, including crowded covers.
        if parts.get("actions"):
            self.action_card(parts["actions"], actions_layout)
        if self.y + 28 <= self.bottom:
            self.y = d.paragraph(
                self.x0, self.y + 6, "Dates are the start of each item's issue "
                "transaction in SiteIQ; the export covers {}. Undated means no "
                "transaction inside that window. No costs anywhere in this pack - "
                "they are in the workbook.".format(self.period or "the export period"),
                size=7.5, max_w=self.cw, colour=P_MUTED, leading=10.5, max_lines=2)
        self.doc.bookmark("Contents", 0, 60)


def build_company_pack(path, s, when, asat, period, parts, blocks, quiet):
    """The whole pack: cover first, then one section per company.
    Returns the number of pages."""
    pk = _Pack(s, when, asat, period,
               "{} - On-Hire Report by Company - {}".format(
                   s.short or s.customer or "Shutdown", when.strftime("%d %b %Y")))
    pk.total_onhire = sum(b["items"] for b in blocks)
    pk.page("On-Hire Report by Company")           # page 0 - the cover, drawn last
    pk.story(parts)                                # page 1 - the story
    if parts.get("forecast"):
        pk.ahead(parts)                            # the shut ahead, when there is one
    pk.glance(parts)                               # the charts
    starts = []
    for k, b in enumerate(blocks, 1):
        starts.append(pk.section(b, index=k, total=len(blocks)))
    pk.closing(parts, blocks)                      # how to read this pack, sign-off
    #  Bookmarks were added as sections were drawn; the cover's goes first.
    pk.cover(parts, blocks, quiet, starts)
    pk.doc.outline.sort(key=lambda o: o[1])
    pk.footers()
    pk.doc.save(path)
    return pk.doc.page_count


def build_company_pdf(path, s, when, asat, period, b, total_onhire=0):
    """One company's section on its own, for forwarding to them."""
    pk = _Pack(s, when, asat, period,
               "{} - On-Hire Report - {}".format(b["company"],
                                                 when.strftime("%d %b %Y")))
    pk.total_onhire = total_onhire
    pk.section(b, right_title="On-Hire Report - {}".format(b["company"]))
    pk.footers()
    pk.doc.save(path)
    return pk.doc.page_count


def email_text(s, when, parts):
    """The plain-text half, for anyone reading on a locked-down phone."""
    c = parts["counts"]
    lines = ["COATES | ON-HIRE REPORT",
             s.header_line,
             "As at {}".format(when.strftime("%d %B %Y")),
             "POWERED BY SITEIQ | Author: {}".format(
                 s.author or "Andrew Fisher"),
             "",
             "Morning,",
             ""]
    lines += [t for t in parts["call"]]
    lines += ["", "THE POSITION", ""]
    for label, value, sub in parts["tiles"]:
        lines.append("  {:<28} {:>7}   {}".format(label, value, sub))
    fc = parts.get("forecast")
    if fc:
        lines += ["", "LOOKING AHEAD - {}".format(fc["job"].upper()), ""]
        for label, value, sub in fc["milestones"]:
            lines.append("  {:<16} {:>10}   {}".format(label, value, sub))
        lines += ["", "  " + fc["brief"], "  " + fc["ref_line"]]
    lines += ["", "EVERYTHING ON HIRE - COMPANY BY COMPANY", ""]
    for block in parts["roll"]:
        lines.append("  {}  ({} item{}, {} {})".format(
            block["company"], block["items"], "" if block["items"] == 1 else "s",
            len(block["people"]), "person" if len(block["people"]) == 1 else "people"))
        for p in block["people"]:
            when_txt = ("oldest issued {} ({})".format(
                p["since"].strftime("%d %b %Y"), _days_text(p["days"]))
                if p["days"] is not None else
                "no issue transaction in this export")
            lines.append("    {} - {} item{}, {}".format(
                p["who"], p["n"], "" if p["n"] == 1 else "s", when_txt))
            for desc, qty in p["gear"]:
                lines.append("        {} x {}".format(qty, desc))
        lines.append("")

    lines += ["", "WHAT I NEED FROM YOU", ""]
    for n, (head, bodytext) in enumerate(parts["actions"], 1):
        lines.append("  {}. {} - {}".format(n, head, bodytext))
    attached = "The detail is in the attached workbook - {} tabs, dashboard first".format(
        _words(parts.get("n_tabs") or 14))
    if parts.get("pack_pages"):
        attached += (", and the attached company pack PDF has a section for "
                     "each company ({} pages)".format(parts["pack_pages"]))
    lines += ["",
              attached + ".",
              "On-hire dates are the start of each item's issue transaction"
              + (" (export covers {})".format(parts["period"])
                 if parts.get("period") else "") + ".",
              "Costs are in the workbook, not in this email or the pack.",
              "",
              "Anything here you want chased, tell me and I'll get on it.",
              "",
              s.author or "Andrew Fisher",
              "Shutdown Tool Store | Coates",
              ""]
    return "\n".join(lines)


def write_email(base, s, when, asat, parts, attachments, out_dir):
    """The report as an Outlook draft, with the workbook and the company
    pack on the paperclip. NOTHING SENDS - it opens as a draft and waits
    for you."""
    import email.message
    import email.policy

    label = _safe_name(s.short or s.customer or "Shutdown")
    stem = "{} On-Hire Report - {}".format(label, when.strftime("%d %b %Y"))
    body = email_html(s, when, asat, parts)

    #  The same report as a web page, for anybody without Outlook and for
    #  printing. Same HTML, so what you check here is what they get.
    html_path = os.path.join(out_dir, stem + ".html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write("<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'>"
                "<meta name='viewport' content='width=device-width,"
                "initial-scale=1'><title>{}</title>"
                "<style>@page{{size:A4;margin:10mm}}"
                "@media print{{body{{background:#fff !important}}}}</style>"
                "</head><body style=\"margin:0;padding:0;background:{}\">{}"
                "</body></html>".format(_esc(stem), E_PAGE, body))

    msg = email.message.EmailMessage(policy=email.policy.SMTP)
    c_ = parts["counts"]
    position = ("{:,} item{} out to {:,} compan{}, oldest {}".format(
        c_["onhire"], "" if c_["onhire"] == 1 else "s", c_["companies"],
        "y" if c_["companies"] == 1 else "ies", _days_text(c_["oldest_days"]))
        if c_["onhire"] else "nothing on hire")
    msg["Subject"] = "{} | On-Hire Report | {}: {}".format(
        s.customer or label, when.strftime("%a %d %b"), position)
    #  X-Unsent is what makes Outlook open it as a draft you press Send
    #  on yourself, rather than something already gone.
    msg["X-Unsent"] = "1"
    msg.set_content(email_text(s, when, parts))
    msg.add_alternative(body, subtype="html")

    kinds = {".xlsx": ("application",
                       "vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
             ".pdf": ("application", "pdf")}
    for path in attachments or []:
        if not (path and os.path.isfile(path)):
            continue
        main, sub = kinds.get(os.path.splitext(path)[1].lower(),
                              ("application", "octet-stream"))
        try:
            with open(path, "rb") as f:
                msg.add_attachment(f.read(), maintype=main, subtype=sub,
                                   filename=os.path.basename(path))
        except OSError as e:
            say("  WARN | Couldn't attach {} to the email ({}). The email is "
                "still there - drag it onto the draft before you send."
                .format(os.path.basename(path), e))

    eml_path = os.path.join(out_dir, stem + ".eml")
    with open(eml_path, "wb") as f:
        f.write(msg.as_bytes())

    #  For 4_MAKE_OUTLOOK_DRAFT.bat: the same email saved as a NATIVE
    #  Outlook draft, where the To field has the address book behind it.
    #  The manifest names the body and the attachments; PowerShell does
    #  the rest. Best effort - the .eml above is the one that always works.
    try:
        import json
        manifest = {"subject": str(msg["Subject"]),
                    "body": os.path.basename(html_path),
                    "attachments": [os.path.basename(a) for a in (attachments or [])
                                    if a and os.path.isfile(a)]}
        for a in (attachments or []):
            if a and os.path.isfile(a) and os.path.dirname(os.path.abspath(a)) != \
                    os.path.abspath(out_dir):
                #  An attachment living outside today's folder (the LATEST
                #  workbook) is copied in so the manifest is self-contained.
                target = os.path.join(out_dir, os.path.basename(a))
                if os.path.abspath(a) != os.path.abspath(target):
                    shutil.copyfile(a, target)      # refreshed every run
        with open(os.path.join(out_dir, stem + ".draft.json"), "w",
                  encoding="utf-8") as f:
            json.dump(manifest, f, indent=1)
    except Exception:
        pass
    return html_path, eml_path


def main(argv):
    when = None
    if len(argv) > 1:
        try:
            when = dt.datetime.strptime(argv[1], "%Y-%m-%d").date()
        except ValueError:
            say("Date must look like 2026-08-10. Leave it off for today.")
            write_log()
            return 1
    try:
        rc = build(HERE, when)
    except KitProblem as problem:
        #  Something the person at the keyboard can fix. The message was
        #  written to be read, so print it and stop - no traceback, no
        #  half a report, and no email draft sitting there looking ready.
        say()
        say("  STOP | {}".format(problem))
        say()
        write_log()
        return 1
    except Exception:
        #  Last line of defence. A raw traceback in a black window at
        #  05:00 tells nobody anything, and the window gets closed before
        #  anyone can read it. Say something useful, keep the detail in
        #  the log, and hand back a failure.
        import traceback
        say()
        say("=" * 66)
        say(" SOMETHING UNEXPECTED WENT WRONG")
        say("=" * 66)
        say()
        say(" The report did NOT finish, and nothing has been sent.")
        say()
        say(" This is not something you can fix from here. Do this:")
        say()
        say("   1. Press 1_CHECK_THIS_LAPTOP.bat")
        say("   2. Email Andrew both files this folder now contains:")
        say("        LAPTOP_CHECK.txt")
        say("        LAST_RUN_LOG.txt")
        say()
        say(" The technical detail is at the bottom of LAST_RUN_LOG.txt.")
        say("=" * 66)
        _LOG.append("")
        _LOG.append("---- technical detail, for Andrew ----")
        _LOG.append(traceback.format_exc())
        write_log()
        return 1
    write_log()
    return rc


if __name__ == "__main__":
    sys.exit(main(sys.argv))
