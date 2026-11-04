#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | ON-HIRE WORKBOOK - every tab, built from today's exports
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  The shutdown on-hire workbook, rebuilt from the SiteIQ exports for
#  whichever job this computer is running (57_SWITCH_JOB.bat).
#
#  Twelve tabs, and every one of them works:
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
    "High Demand": "red", "Good Use": "green",
    "Low Use": "amber", "No Use": "slate",
    "Increase Stock": "red", "Monitor / Increase": "amber",
    "Keep Stock": "green", "Review / Reduce": "slate",
}

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


def read_project_schedule(path):
    """The SiteIQ project an export came from, off its REFERENCE_INFO
    sheet. Empty if it doesn't carry one - plenty of older pulls don't."""
    if site_config is not None:
        return site_config.export_project_schedule(path)
    try:
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
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
            wb.close()
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
        stamp = dt.datetime.fromtimestamp(os.path.getmtime(p))
        lines.append("{:<52} refreshed {}".format(
            os.path.basename(p), stamp.strftime("%d %b %Y - %H:%M")))
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
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
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
            wb.close()
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
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
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
            wb.close()
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


def _who(name):
    """A hirer's name flattened for matching. RENTAL_STOCK writes
    'Benjamin - Casey'; TRANSACTIONS writes 'Benjamin Casey'."""
    return " ".join(_s(name).replace("-", " ").split()).upper()


# =====================================================================
#  The tabs
# =====================================================================
def build(base=HERE, when=None):
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

    rental = _rows(p_rental, "RENTAL_STOCK", must_have=True)
    sales = _rows(p_sales, "SALES_STOCK", must_have=True)
    stocktake = _rows(p_stock, "STOCKTAKE") if p_stock else []
    period = transactions_period(p_trans)

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
            if tid and tid in seen:
                continue
            if tid:
                seen.add(tid)
            tw.append(r)

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

    title = "{}  |  Shutdown Tool Store  |  On-Hire Report".format(
        s.short or s.customer or "Shutdown")
    _PRINT["job"] = s.header_line
    _PRINT["asat"] = asat.strftime("%d %b %Y %H:%M")

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
    consumable_stock = [r for r in sales if not _s(r.get("COMPANY_NAME"))]

    tabs = []                      # (name, rows, why) for the cover index

    # ---- 1. Company Summary -------------------------------------------
    companies = {}
    for r in tw:
        co = _s(r.get("EMPLOYER_NAME")) or "(not named)"
        kind = ("CONSUMABLES"
                if _s(r.get("PRODUCT_CATEGORY")).lower() == "consumable"
                else "TOOLING")
        d = companies.setdefault(co, {
            "TOOLING": {"tx": 0, "qty": 0.0, "types": set(), "open": 0},
            "CONSUMABLES": {"tx": 0, "qty": 0.0, "types": set(), "open": 0}})
        a = d[kind]
        a["tx"] += 1
        a["qty"] += _n(r.get("QUANTITY"))
        a["types"].add(_s(r.get("SKU/ITEM DESCRIPTION")))
        if kind == "TOOLING" and not _s(r.get("TRAN_END_DATE")):
            a["open"] += 1

    live_onhire = {}
    for r in onhire:
        live_onhire[_s(r.get("COMPANY_NAME"))] = \
            live_onhire.get(_s(r.get("COMPANY_NAME")), 0) + 1

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
                    (when - since).days if since else None,
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

    # ---- 9. Consumable Utilisation ------------------------------------
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
    carried, labour_total, cost_total = carry_over(wb, s, base, title)
    for name, n in carried:
        tabs.append((name, n, "Typed by hand - carried over untouched"))

    # ---- the email's numbers, and the company pack --------------------
    #  Worked out before the cover so the cover can say how many pages
    #  the pack ran to. The pack is written to disk after the workbook,
    #  and if it fails the workbook and the email still go out.
    parts = email_parts(s, summary_rows, tu, cu, det, ctx, ca, coates_owned,
                        tooling_tx, live_onhire, sources, when, period)
    blocks, quiet = pack_blocks(det, ctx, tooling_tx, when)

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
              "Consumable lines on shelf": len(ca),
              "Items counted at last stocktake": len(stocktake),
              "Labour cost to date": labour_total,
              "Cost breakdown total": cost_total,
          }, pack=pack_info)
    wb._sheets.insert(0, wb._sheets.pop(wb._sheets.index(wb["Cover"])))

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
    if pack_info and coates_pdf is not None:
        try:
            os.makedirs(by_co_dir, exist_ok=True)
            for b in blocks:
                p = os.path.join(by_co_dir, "{} - On-Hire - {}.pdf".format(
                    _safe_name(b["company"], "Company"), when.strftime("%d %b %Y")))
                build_company_pdf(p, s, when, asat, period, b)
                n_single += 1
        except Exception as e:
            say("  WARN | The per-company PDFs didn't all write ({}). The "
                "pack itself is fine.".format(e))

    # ---- the email -----------------------------------------------------
    attachments = [latest or out]
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
        say("  Per co.   {}  ({} PDFs, one per company)".format(
            os.path.relpath(by_co_dir, base), n_single))
    if eml_path:
        say("  Email     {}".format(os.path.relpath(eml_path, base)))
        say("            double-click it - it opens as a DRAFT with the workbook")
        say("            and the pack attached. Nothing sends until you press")
        say("            Send yourself.")
    if html_path:
        say("  Web page  {}".format(os.path.relpath(html_path, base)))
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
    long_out = [r for r in dated if (when - r[5]).days >= LONG_OUT_DAYS]
    idle_tool = [r for r in tu if r[11] == "No Use" and r[1] >= 2]
    idle_units = sum(r[1] for r in idle_tool)

    oldest_days = max([(when - r[5]).days for r in dated] or [0])
    oldest_item = dated[0][3] if dated else ""
    co_oldest = {}
    for r in dated:
        days = (when - r[5]).days
        if days > co_oldest.get(r[0], -1):
            co_oldest[r[0]] = days

    tiles = [
        ("Items on hire now", "{:,}".format(len(det)),
         "with {:,} companies".format(n_companies)),
        ("Longest out (days)", "{:,}".format(oldest_days),
         "oldest: {}".format(oldest_item) if oldest_item
         else "nothing dated on hire"),
        ("Coates items on site", "{:,}".format(len(coates_owned)),
         "{:,} of them out right now".format(coates_out)),
        ("Tooling issues & returns", "{:,}".format(len(tooling_tx)),
         "across {:,} item types".format(
             len({_s(r.get("SKU/ITEM DESCRIPTION")) for r in tooling_tx}))),
        ("Consumables issued", "{:,}".format(len(ctx)),
         "across {:,} lines".format(len({r[2] for r in ctx}))),
        ("Consumable lines on shelf", "{:,}".format(len(ca)),
         "{:,} at {:.0f}% or more".format(len(tight), CONS_TIGHT * 100)),
    ]

    #  The three or four things worth knowing before the tables. Every
    #  number here is counted off the exports - nothing is estimated.
    flags = [
        ("red" if hot else "green", "Order more",
         "{:,} tooling {}".format(len(hot),
                                  "line" if len(hot) == 1 else "lines")),
        ("red" if tight else "green", "Consumables tight",
         "{:,} {}".format(len(tight),
                          "line" if len(tight) == 1 else "lines")),
        ("amber" if long_out else "green",
         "Out over {} days".format(LONG_OUT_DAYS),
         "{:,} {}".format(len(long_out),
                          "item" if len(long_out) == 1 else "items")),
        ("slate", "Not moving at all",
         "{:,} units".format(idle_units)),
    ]

    #  The position, in the words you'd use on the phone.
    call = ["{:,} items are on hire to {:,} companies, and the oldest dated "
            "issue has been out {:,} days.".format(len(det), n_companies,
                                                   oldest_days)]
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
        actions.append(("Date the undated", "{:,} on-hire {} no issue "
                        "transaction in this export. A TRANSACTIONS pull from "
                        "the start of the shut dates every one of them - or "
                        "tell me which have quietly come back and I'll book "
                        "them in.".format(
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
    hardest = [[r[0], r[1], r[2], r[5], r[11], r[12]] for r in hard[:12]]

    #  Not moving - biggest holdings that have not gone out at all.
    idle_tool.sort(key=lambda r: -r[1])
    idle_rows = [[r[0], r[1], r[2], r[12]] for r in idle_tool[:12]]

    #  Consumables worth watching - the ones running down, tightest first.
    watch = [r for r in cu if r[9] in ("High Demand", "Good Use")]
    watch.sort(key=lambda r: -r[4])
    cons = [[r[0], r[1], r[2], r[4], r[10]] for r in watch[:12]]

    #  Out the longest - oldest open issue transactions. The item NUMBER
    #  rides along, because four lines all saying "Rio Tinto DropMat Kit"
    #  are four different kits and somebody has to go and find them.
    longest = [[r[3], r[2], r[0], r[1], r[5], (when - r[5]).days]
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
        desc = _s(r[3]) or "(no description)"
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
                "days": (when - d["oldest"]).days if d["oldest"] else None,
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
        dt.datetime.fromtimestamp(os.path.getmtime(p)).strftime("%d %b %Y")
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


def _d(text):
    return dt.datetime.strptime(text, "%Y-%m-%d")


def _t(text):
    h, m = text.split(":")
    return dt.time(int(h), int(m))


def seed_labour(ws):
    """The Weipa roster, laid out the way Andrew's sheet is: the rates
    at the top, a heading row, a line per shift, the sums underneath.
    Cost is hours times the rate for the shift, so changing a rate or
    a shift type reprices the line by itself."""
    ws["A2"], ws["B2"], ws["C2"] = "Roles", "Rate", "Shift"
    for i, (role, rate, shift) in enumerate(_WEIPA_RATES, start=3):
        ws.cell(row=i, column=1, value=role)
        ws.cell(row=i, column=2, value=rate).number_format = TYPED_MONEY_FMT
        ws.cell(row=i, column=3, value=shift)
    heads = ["Date", "Shift", "Role", "Name", "Start Time", "Finish Time",
             "Total Hours", "Cost", "Total"]
    for i, h in enumerate(heads, start=1):
        ws.cell(row=5, column=i, value=h)
    r = 6
    for (day, shift, role, name, start, finish, hours) in _WEIPA_ROSTER:
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
    return len(_WEIPA_ROSTER) + len(_WEIPA_RATES) + 3


def seed_costs(ws):
    """The day-by-day cost breakdown: a heading row, a line per day,
    the three totals and the grand total, as on Andrew's sheet."""
    for i, h in enumerate(["Day", "Type", "Shutdown", "Labour", "Site Services"], 1):
        ws.cell(row=2, column=i, value=h)
    r = 3
    for (day, kind, tooling, labour, site) in _WEIPA_COSTS:
        ws.cell(row=r, column=1, value=_d(day)).number_format = TYPED_DATE_FMT
        ws.cell(row=r, column=2, value=kind)
        for col, v in ((3, tooling), (4, labour), (5, site)):
            if v is not None:
                ws.cell(row=r, column=col, value=v).number_format = TYPED_MONEY_FMT
        r += 1
    last = r - 1
    for col, label in ((3, "Total Tooling Shutdown"), (4, "Total Labour Shutdown"),
                       (5, "Total Site Services Shutdown")):
        ws.cell(row=r, column=col, value=label)
        ws.cell(row=r + 1, column=col, value="=SUM({0}3:{0}{1})".format(
            get_column_letter(col), last)).number_format = TYPED_MONEY_FMT
    ws.cell(row=r + 3, column=3, value="Total")
    ws.merge_cells(start_row=r + 3, start_column=3, end_row=r + 3, end_column=5)
    ws.cell(row=r + 4, column=3, value="=SUM(C{0}:E{0})".format(r + 1)).number_format = TYPED_MONEY_FMT
    ws.merge_cells(start_row=r + 4, start_column=3, end_row=r + 4, end_column=5)
    return len(_WEIPA_COSTS) + 4


# ---- a small formula evaluator, for totals only ----------------------
_TOK = _re.compile(r"\s*(?:(\d+\.?\d*(?:[eE][-+]?\d+)?)|(\"[^\"]*\")|(\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?)"
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
        self.cache = {}
        self.busy = set()

    def cell(self, coord):
        if coord in self.cache:
            return self.cache[coord]
        if coord in self.busy:
            raise ValueError("circular reference at " + coord)
        v = self.ws[coord].value
        if isinstance(v, str) and v.startswith("="):
            self.busy.add(coord)
            try:
                v = self.formula(v)
            finally:
                self.busy.discard(coord)
        self.cache[coord] = v
        return v

    def rng(self, text):
        a, b = text.split(":")
        from openpyxl.utils.cell import coordinate_from_string, column_index_from_string
        ca, ra = coordinate_from_string(a)
        cb, rb = coordinate_from_string(b)
        c1, c2 = sorted((column_index_from_string(ca), column_index_from_string(cb)))
        r1, r2 = sorted((ra, rb))
        out = []
        for r in range(r1, r2 + 1):
            for c in range(c1, c2 + 1):
                out.append(self.cell("{}{}".format(get_column_letter(c), r)))
        return out

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
        if isinstance(v, (dt.datetime, dt.date)):
            return float((v - dt.datetime(1899, 12, 30).date()).days) if isinstance(v, dt.date) and not isinstance(v, dt.datetime) else float((v - dt.datetime(1899, 12, 30)).days)
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
        if len(texts) == len(cells):
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


def carry_over(wb, s, base, title):
    """Copy Andrew's hand-typed tabs out of the existing workbook -
    values, formulas, dates and times exactly as he left them, at the
    same addresses - then skin them. If the old workbook isn't there,
    the Weipa tabs come loaded with the roster and the cost breakdown;
    any other job's come through headed and empty, ready to type into."""
    src = s.workbook(base)
    carried, labour_total, cost_total = [], 0.0, 0.0
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

    weipa = "weipa" in " ".join([s.short or "", s.job or "", s.customer or "",
                                 s.project_schedule or ""]).lower()
    for name in CARRIED_OVER:
        ws = wb.create_sheet(name)
        n = 0
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
        if (n and weipa and name == "Coates Labour" and any(
                c.value == "Neon" for row in ws.iter_rows() for c in row)):
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
            say("  NOTE | Coates Labour still had the old 'Neon' roster, so it has "
                "been replaced with the roster corrected on 04 Nov 2026.")
        if n == 0 and weipa:
            n = seed_labour(ws) if name == "Coates Labour" else seed_costs(ws)
            say("  NOTE | {} came through empty, so it is loaded with the "
                "roster as typed on 04 Nov 2026 - yours to edit.".format(name)
                if name == "Coates Labour" else
                "  NOTE | {} came through empty, so it is loaded with the "
                "cost breakdown as typed on 04 Nov 2026 - yours to edit."
                .format(name))
        if n == 0:
            band(ws, title, 9)
            c = ws.cell(row=2, column=1,
                        value="Nothing typed in this tab yet - it is yours to "
                              "fill in and the rebuild never overwrites it.")
            c.font = NOTE_FONT
        else:
            skin_typed(ws)
            band(ws, title, max(5, ws.max_column))
            total = typed_totals(ws, name, vals if (vals is not None and name in vals.sheetnames) else None)
            if name == "Coates Labour":
                labour_total = total
            else:
                cost_total = total
        tidy_print(ws, max(5, ws.max_column), name=name)
        ws.sheet_properties.tabColor = GREY      # typed by hand
        carried.append((name, n))

    for w in (vals, old):
        if w is not None:
            try:
                w.close()
            except Exception:
                pass
    return carried, labour_total, cost_total


def cover(wb, s, when, asat, tabs, sources, base, headline, pack=None):
    """The front page. Says what this workbook is, what fed it, the
    headline numbers as tiles, what is in each tab, how the two ratings
    are worked out, and which tabs are typed by hand - so nobody has to
    take a recommendation on trust or go hunting for where a number
    came from. Laid out to print on one or two portrait A4 pages and go
    on the wall."""
    import math
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
    ]
    for start in (0, 3):
        for k, (label, value) in enumerate(facts[start:start + 3]):
            col = 1 + k * 2
            merge(r, col, col + 1)
            put(r, col, label.upper(), LABEL,
                align=Alignment(vertical="bottom", indent=1))
            merge(r + 1, col, col + 1)
            put(r + 1, col, value, VALUE, align=Alignment(vertical="top", indent=1))
            for cc in (col, col + 1):
                ws.cell(row=r + 1, column=cc).border = Border(bottom=line_side)
        ws.row_dimensions[r].height = 14
        ws.row_dimensions[r + 1].height = 20
        r += 2
        if start == 0:
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
                             color=NEAR_BLACK), align=Alignment(indent=1))
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
                             color=NEAR_BLACK), align=Alignment(indent=1))
        merge(r, 3, 4)
        put(r, 3, dt.datetime.fromtimestamp(os.path.getmtime(p)),
            Font(name="Calibri", size=10.5, color=NEAR_BLACK),
            fmt="dd mmm yyyy  hh:mm", align=Alignment(indent=1))
        merge(r, 5, 6)
        put(r, 5, USED.get(key, ""), Font(name="Calibri", size=10.5, color=MUTED),
            align=Alignment(indent=1))
        for cc in range(1, NC + 1):
            cell = ws.cell(row=r, column=cc)
            cell.border = Border(bottom=line_side)
            if n_ % 2:
                cell.fill = BAND_FILL
        ws.row_dimensions[r].height = 18
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
                align=Alignment(indent=1))
            for col, word in ((3, rating), (5, rec)):
                fill, text, _bar = RAG[TONE.get(word.split("  ")[0], "slate")]
                merge(row, col, col + 1)
                put(row, col, word, Font(name="Calibri", size=10.5, bold=True,
                                         color=argb(text)),
                    fill=PatternFill("solid", fgColor=argb(fill)),
                    align=Alignment(indent=1))
                ws.cell(row=row, column=col + 1).fill = PatternFill(
                    "solid", fgColor=argb(fill))
            for cc in range(1, NC + 1):
                ws.cell(row=row, column=cc).border = Border(bottom=line_side)
            ws.row_dimensions[row].height = 18
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
                   "two tabs only; the email and the PDF company pack carry "
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
E_STATUS = {"red": "Action needed", "amber": "Watch", "green": "On track",
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
            "<td bgcolor=\"{bg}\" style=\"background:{bg};border-radius:3px;"
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
    return ("<div style=\"font-family:{f};font-size:11pt;font-weight:700;"
            "color:{i};text-align:right;line-height:1.2\">{t}</div>"
            "<div style=\"font-size:1px;line-height:5px\">&nbsp;</div>{b}"
            .format(f=E_FONT, i=E_INK, t=_esc(text),
                    b=_bar(value, biggest, tone)))


def _num(text, muted=False):
    """A plain right-aligned figure."""
    return ("<div style=\"font-family:{f};font-size:10.5pt;font-weight:{w};"
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
        "<td bgcolor=\"{t}\" style=\"background:{t};border-left:4px solid {o};"
        "padding:10px 14px;font-family:{f};font-size:12pt;font-weight:700;"
        "color:{k}\">{n}</td>"
        "<td bgcolor=\"{t}\" align='right' style=\"background:{t};"
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
           head="dark"):
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
    ncols = len(cols)
    dark = (head == "dark")
    out = [_T, "<tr>"]
    for i, c in enumerate(cols):
        w = (" width='{}%'".format(widths[i])) if i in widths else ""
        ws = ("width:{}%;".format(widths[i])) if i in widths else ""
        out.append(
            "<th{w} bgcolor=\"{k}\" style=\"{ws}background:{k};padding:8px 10px;"
            "font-family:{f};font-size:8pt;font-weight:700;color:{c};"
            "letter-spacing:.7px;text-transform:uppercase;text-align:{a};"
            "vertical-align:bottom\">{t}</th>".format(
                w=w, ws=ws, k=E_INK if dark else E_SOFT, f=E_FONT,
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
                "<td bgcolor=\"{b}\" style=\"background:{b};padding:8px 10px;"
                "border-bottom:1px solid {l};vertical-align:{v}\">{c}</td>"
                .format(b=bg, l=E_LINE, c=cell,
                        v=valign or ("middle" if i else "top")))
        out.append("</tr>")
    out.append("</table>")
    if note:
        out.append(_T + "<tr><td style=\"padding:8px 2px 0;font-family:{f};"
                   "font-size:9pt;color:{m};line-height:1.45\">{n}</td></tr>"
                   "</table>".format(f=E_FONT, m=E_MUTED, n=_esc(note)))
    return "".join(out)


def _masthead(s, when, asat):
    """The top of the report. Built out of type and two brand colours -
    no logo file, because a logo file is one more thing that can arrive
    as a red X on somebody else's laptop."""
    divider = (_T + "<tr><td bgcolor=\"#3A4049\" style=\"background:#3A4049;"
               "height:1px;font-size:1px;line-height:1px\">&nbsp;</td></tr>"
               "</table>")
    return (
        _T + _rule(5, E_ORANGE)
        + "<tr><td bgcolor=\"{k}\" style=\"background:{k};padding:22px 24px 16px\">"
          + _T + "<tr>"
          "<td valign='top' style=\"font-family:{f}\">"
          "<div style=\"font-family:{f};font-size:24pt;font-weight:800;"
          "color:{o};letter-spacing:5px;line-height:1\">COATES</div>"
          "<div style=\"font-family:{f};font-size:7.5pt;font-weight:700;"
          "color:#9AA2AC;letter-spacing:2.4px;text-transform:uppercase;"
          "padding-top:7px\">Equipped for anything</div></td>"
          "<td valign='top' align='right' style=\"font-family:{f}\">"
          "<div style=\"font-family:{f};font-size:17pt;font-weight:700;"
          "color:#ffffff;line-height:1.15\">On-Hire Report</div>"
          "<div style=\"font-family:{f};font-size:10pt;color:#B9C0C9;"
          "padding-top:4px\">{d}</div></td>"
          "</tr></table></td></tr>"
        + "<tr><td bgcolor=\"{k}\" style=\"background:{k};padding:0 24px\">"
          + divider + "</td></tr>"
        + "<tr><td bgcolor=\"{k}\" style=\"background:{k};padding:12px 24px 18px\">"
          + _T + "<tr>"
          "<td style=\"font-family:{f};font-size:10.5pt;font-weight:600;"
          "color:#ffffff\">{hdr}</td>"
          "<td align='right' style=\"font-family:{f};font-size:9.5pt;"
          "color:#FFC9AE;white-space:nowrap\">As at {asat}</td>"
          "</tr></table></td></tr>"
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
             soft=E_SOFT, l=E_LINE, m=E_MUTED,
             who=_esc(s.author or "Andrew Fisher"))


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
            out.append("<td width='8' style='width:8px;font-size:1px'>&nbsp;</td>")
        out.append(
            "<td width='{pc}%' bgcolor=\"{c}\" valign='top' style=\"width:{pc}%;"
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
    cards = [("XLSX", "The workbook",
              "Twelve tabs - every line behind these numbers. The costs "
              "are in here and only in here.")]
    pages = parts.get("pack_pages") or 0
    if pages:
        cards.append(("PDF", "The company pack",
                      "{} page{} - a section for each company, ready to "
                      "forward to them as it is.".format(
                          _fmt(pages), "" if pages == 1 else "s")))
    out = [_kicker("Attached to this email", E_MUTED), _T, "<tr>"]
    cell = ("<td width='{pc}%' bgcolor=\"{c}\" valign='top' style=\"width:{pc}%;"
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
            out.append("<td width='8' style='width:8px;font-size:1px'>&nbsp;</td>")
        out.append(cell.format(pc=int(100 / len(cards)), c=E_CARD, l=E_LINE,
                               f=E_FONT, k=E_INK, m=E_MUTED,
                               pill=_pill(kind, "orange", "8pt"), t=_esc(title),
                               s=_esc(sub)))
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
                out.append("<td width='9' style='width:9px;font-size:1px'>&nbsp;</td>")
            out.append(
                "<td width='33%' bgcolor=\"{c}\" valign='top' "
                "style=\"width:33%;background:{c};border:1px solid {l};"
                "border-top:3px solid {o};padding:13px 15px\">"
                "<div style=\"font-family:{f};font-size:24pt;font-weight:800;"
                "color:{k};line-height:1.05\">{v}</div>"
                "<div style=\"font-family:{f};font-size:8pt;font-weight:700;"
                "color:{k};letter-spacing:.8px;text-transform:uppercase;"
                "padding-top:7px\">{lb}</div>"
                "<div style=\"font-family:{f};font-size:9pt;color:{m};"
                "padding-top:2px\">{s}</div></td>".format(
                    c=E_CARD, l=E_LINE, o=E_ORANGE, f=E_FONT, k=E_INK,
                    m=E_MUTED, v=_esc(value), lb=_esc(label), s=_esc(sub)))
        for _ in range(3 - len(chunk)):
            out.append("<td width='9' style='width:9px;font-size:1px'>&nbsp;</td>")
            out.append("<td width='33%' style=\"width:33%\">&nbsp;</td>")
        out.append("</tr>")
    out.append("</table>")
    return "".join(out)


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


def _footer(s, asat, parts):
    return (
        _T + _rule(3, E_ORANGE) +
        "<tr><td bgcolor=\"{k}\" style=\"background:{k};padding:14px 24px;"
        "font-family:{f};font-size:9pt;color:#9AA2AC;line-height:1.65\">"
        "Built from the SiteIQ exports of {src}. On-hire dates are the start "
        "date of each item's issue transaction; the transactions export covers "
        "{period}. Figures are the tool store's own record as at {asat}, not a "
        "live feed.<br>"
        "Costs are in the attached workbook - not in this email and not in the "
        "company pack.<br>"
        "<span style=\"color:#ffffff;font-weight:700\">POWERED BY "
        "<span style=\"color:{o}\">SITEIQ</span></span>"
        " &nbsp;|&nbsp; Author: {who} &nbsp;|&nbsp; Shutdown Tool Store"
        "</td></tr></table>".format(
            k=E_INK, f=E_FONT, o=E_ORANGE, src=_esc(parts["source_stamp"]),
            period=_esc(parts.get("period") or "the period of the export"),
            asat=asat.strftime("%d %b %Y %H:%M"),
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

    body.append(_masthead(s, when, asat))

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
    inner.append(_gap(24))

    #  ---- 2. who is holding gear --------------------------------------
    rows = parts["companies"]
    mx = max([r[1] for r in rows] or [0])
    inner.append(_section("2", "Who is holding gear",
                          "Every company on site, biggest holding first"))
    inner.append(_gap(10))
    inner.append(_table(
        ["Company", "On hire now", "Tooling issues", "Consumables",
         "Longest out"],
        [[_lead(r[0]),
          _metric(_fmt(r[1]), r[1], mx, "orange"),
          _num(_fmt(r[2]), muted=not r[2]),
          _num(_fmt(r[3]), muted=not r[3]),
          "<table cellpadding='0' cellspacing='0' border='0' align='right'>"
          "<tr><td>{}</td></tr></table>".format(
              _pill(_days_text(r[4]) if r[1] else "nothing out",
                    day_tone(r[4]) if r[1] else "slate"))]
         for r in rows],
        widths={0: 34, 1: 20, 2: 14, 3: 14, 4: 18},
        aligns={1: "right", 2: "right", 3: "right", 4: "right"},
        note="On hire now is what is out in their name right now. Tooling "
             "issues and consumables are this period's movements. Longest "
             "out is the oldest issue transaction still open in their name."))
    inner.append(_gap(24))

    #  ---- 3. working hardest ------------------------------------------
    rows = parts["hardest"]
    mx = max([r[3] for r in rows] or [0])
    inner.append(_section("3", "Working hardest",
                          "The gear earning its keep, most turns first"))
    inner.append(_gap(10))
    inner.append(_table(
        ["Item", "On site", "Out now", "Times issued", "Rating", "Do"],
        [[_lead(r[0]),
          _num(_fmt(r[1])),
          _num(_fmt(r[2]), muted=not r[2]),
          _metric(_fmt(r[3]), r[3], mx, E_TONE.get(r[4], "orange")),
          _pill(r[4], E_TONE.get(r[4], "slate")),
          _plain(r[5], "left", muted=True)] for r in rows],
        widths={0: 33, 1: 9, 2: 9, 3: 16, 4: 15, 5: 18},
        aligns={1: "right", 2: "right", 3: "right"},
        note="Rated on turns - times issued against how many we hold. "
             "Anything on Increase Stock is going out faster than we can "
             "turn it around, and the shift feels that before we do."))
    inner.append(_gap(24))

    #  ---- 4. not moving -----------------------------------------------
    rows = parts["idle"]
    mx = max([r[1] for r in rows] or [0])
    inner.append(_section("4", "Not moving",
                          "Biggest holdings that have not gone out once"))
    inner.append(_gap(10))
    inner.append(_table(
        ["Item", "On site", "Out now", "Do"],
        [[_lead(r[0]),
          _metric(_fmt(r[1]), r[1], mx, "slate"),
          _num(_fmt(r[2]), muted=not r[2]),
          _pill(r[3], E_TONE.get(r[3], "slate"))] for r in rows],
        widths={0: 52, 1: 16, 2: 12, 3: 20},
        aligns={1: "right", 2: "right"},
        note="Every one of these is shelf space and hire we are carrying "
             "for nothing. Say the word on any line and it goes home."))
    inner.append(_gap(24))

    #  ---- 5. consumables to watch -------------------------------------
    rows = parts["consumables"]
    tight = parts["cons_tight"]
    inner.append(_section("5", "Consumables to watch",
                          "The lines running down, tightest first"))
    inner.append(_gap(10))
    inner.append(_table(
        ["Line", "On shelf", "Gone out", "Used", "Do"],
        [[_lead(r[0]),
          _num(_fmt(r[1]), muted=not r[1]),
          _num(_fmt(r[2])),
          _metric("{:.0f}%".format(round(r[3] * 100)), r[3] * 100, 100,
                  "red" if r[3] >= tight else
                  ("amber" if r[3] >= 0.6 else "green")),
          _pill(r[4], E_TONE.get(r[4], "slate"))] for r in rows],
        widths={0: 40, 1: 12, 2: 12, 3: 16, 4: 20},
        aligns={1: "right", 2: "right", 3: "right"},
        note="Used is what has gone out against the whole position. Past "
             "{:.0f}% we order, because running a line dry mid-shift costs "
             "more than the stock does.".format(tight * 100)))
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
        aligns={4: "right"},
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

    sheet = "".join(body)

    #  Word ignores max-width, so Outlook gets a fixed-width table of its
    #  own and everybody else gets the fluid one. Without this the report
    #  stretches the full width of a big monitor and looks like a
    #  spreadsheet somebody pasted in.
    return (
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
P_MUTED = "#" + COATES_MUTED
P_LINE = "#" + COATES_LINE
P_SOFT = "#" + COATES_SOFT
P_TINT = "#" + COATES_TINT
P_ZEBRA = "#F8F9FB"
P_WHITE = "#FFFFFF"


def pack_blocks(det, ctx, tooling_tx, when):
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
            _s(r[2]) or "(no description)", {"qty": 0.0, "people": set()})
        line["qty"] += float(r[3] or 0)
        if _s(r[1]):
            line["people"].add(_s(r[1]))

    blocks = []
    for co in sorted(roll, key=lambda c: c.upper()):
        people = []
        for who in sorted(roll[co], key=lambda w: w.upper()):
            items = sorted(roll[co][who],
                           key=lambda r: (-(r[7] if r[7] is not None else -1),
                                          _s(r[3]).upper(), _s(r[2])))
            dated = [r for r in items if r[5]]
            oldest = min(r[5] for r in dated) if dated else None
            people.append({
                "who": who, "items": items, "since": oldest,
                "days": (when - oldest).days if oldest else None,
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
            "oldest_days": max(days) if days else None,
            "long_out": len([d for d in days if d >= LONG_OUT_DAYS]),
            "undated": len(all_items) - len(days),
            "issues": issues.get(co, 0),
            "consumables": lines,
            "cons_qty": int(sum(v["qty"] for _k, v in lines)),
        })
    quiet = sorted((set(issues) | set(cons)) - set(roll), key=lambda c: c.upper())
    return blocks, quiet


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
            d.line(self.x0, self.H - 40, self.x1, self.H - 40, colour=P_LINE, lw=0.6)
            x = self.x0
            x += d.text(x, self.H - 29, "COATES", size=7.5, bold=True,
                        colour=P_INK, tracking=1)
            x += d.text(x, self.H - 29, "   |   POWERED BY ", size=7, colour=P_MUTED)
            x += d.text(x, self.H - 29, "SITEIQ", size=7, bold=True, colour=P_ORANGE)
            d.text(x, self.H - 29, "   |   Author: {}".format(
                self.s.author or "Andrew Fisher"), size=7, colour=P_MUTED)
            d.text(self.x1, self.H - 29, "Page {} of {}".format(i + 1, n),
                   size=7.5, bold=True, colour=P_INK, align="right")
            d.text(self.x0, self.H - 18,
                   "Tool store record as at {} - dated from each item's issue "
                   "transaction - no costs in this pack".format(
                       self.asat.strftime("%d %b %Y %H:%M")),
                   size=6.5, colour="#8B9099")
            d.text(self.x1, self.H - 18, self.s.header_line, size=6.5,
                   colour="#8B9099", align="right", max_w=240)

    def need(self, h):
        """Make room for something h tall, breaking the page if not."""
        if self.y + h > self.bottom:
            self.page()
            if self.cont:
                self.cont()

    # ---- pieces ----------------------------------------------------------
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
            _bg, _fg, bar = E_RAG.get(tone or "orange", E_RAG["orange"])
            d.rect(x, self.y, w, h, fill=P_WHITE, stroke=P_LINE, lw=0.6)
            d.rect(x, self.y, w, 2.5, fill=bar)
            d.text(x + 10, self.y + 25, str(value), size=17, bold=True,
                   colour=P_INK, max_w=w - 20)
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
        self.need(20 + 24)                   # the row plus at least one item
        d.rect(self.x0, self.y, self.cw, 20, fill=P_SOFT)
        d.text(self.x0 + 8, self.y + 13.5, p["who"], size=9.5, bold=True,
               colour=P_INK, max_w=300)
        n = len(p["items"])
        bits = ["{} item{}".format(n, "" if n == 1 else "s")]
        if p["since"]:
            bits.append("oldest issued {}".format(p["since"].strftime("%d %b %Y")))
        if p["undated"]:
            bits.append("{} undated".format(p["undated"]))
        d.text(self.x1 - 8, self.y + 13.5, "  ·  ".join(bits), size=8,
               colour=P_MUTED, align="right")
        self.y += 20

    def item_row(self, r, n):
        d = self.doc
        desc_lines = d.wrap(_s(r[3]) or "(no description)", 9, 248, max_lines=2)
        h = 10 + 11.5 * len(desc_lines)
        self.need(h)
        if n % 2:
            d.rect(self.x0, self.y, self.cw, h, fill=P_ZEBRA)
        d.text(self.x0 + 8, self.y + 14, _s(r[2]) or "-", size=8.2, colour=P_INK,
               max_w=108)
        yy = self.y + 14
        for ln in desc_lines:
            d.text(self.x0 + 124, yy, ln, size=9, colour=P_INK)
            yy += 11.5
        if r[5]:
            d.text(self.x0 + 380, self.y + 14, r[5].strftime("%d %b %Y"),
                   size=8.5, colour=P_MUTED)
        else:
            d.text(self.x0 + 380, self.y + 14, "not in export", size=7.8,
                   italic=True, colour=E_RAG["amber"][1])
        self.chip(self.x1 - 8, self.y + 4.5, _days_text(r[7]), day_tone(r[7]))
        d.line(self.x0, self.y + h, self.x1, self.y + h, colour=P_LINE, lw=0.4)
        self.y += h

    # ---- a company section --------------------------------------------
    def section(self, b, right_title=None, index=None, total=None):
        d = self.doc
        co = b["company"]
        start = self.page(right_title if right_title is not None
                          else "On-Hire Report by Company")
        self.doc.bookmark(co, start, 60)

        #  The band: orange edge, the company name, what this page is.
        d.rect(self.x0, self.y, 5, 44, fill=P_ORANGE)
        d.text(self.x0 + 16, self.y + 22, co, size=18, bold=True, colour=P_INK,
               max_w=self.cw - 160)
        d.text(self.x0 + 16, self.y + 38,
               "Everything on hire to {} as at {}".format(
                   co, self.asat.strftime("%d %b %Y %H:%M")),
               size=9, colour=P_MUTED, max_w=self.cw - 160)
        if index and total:
            d.text(self.x1, self.y + 16, "SECTION {} OF {}".format(index, total),
                   size=7, bold=True, colour=P_ORANGE, tracking=1.2, align="right")
        d.text(self.x1, self.y + 32, self.when.strftime("%A %d %B %Y"), size=8.5,
               colour=P_MUTED, align="right")
        self.y += 54
        d.line(self.x0, self.y, self.x1, self.y, colour=P_LINE, lw=0.6)
        self.y += 12

        n_people = len(b["people"])
        self.tiles([
            (b["items"], "Items on hire", "orange"),
            (n_people, "People", "orange"),
            (b["lines"], "Item lines", "orange"),
            (_days_text(b["oldest_days"]) if b["oldest_days"] is not None
             else "undated", "Longest out", day_tone(b["oldest_days"])),
            (b["issues"], "Issues this period", "orange"),
        ])
        self.y += 12

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

        self.items_head()
        n = 0
        for p in b["people"]:
            self.person_row(p)
            for r in p["items"]:
                self.item_row(r, n)
                n += 1

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
            shown = lines[:14]
            for k, (desc, v) in enumerate(shown):
                self.need(16)
                d.text(self.x0 + 8, self.y + 11.5, desc, size=8.8, colour=P_INK,
                       max_w=self.cw - 190)
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

        self.cont = None
        self.y += 14
        self.need(14)
        d.text(self.x0, self.y + 9, "That is everything on hire to {} - {} item{}. "
               "No costs appear in this pack; they are in the workbook."
               .format(co, b["items"], "" if b["items"] == 1 else "s"),
               size=8, italic=True, colour=P_MUTED, max_w=self.cw)
        return start

    # ---- the cover -----------------------------------------------------
    def cover(self, parts, blocks, quiet, starts):
        d = self.doc
        self.doc.use_page(0)
        self.y = 82
        s = self.s
        d.text(self.x0, self.y + 10, s.header_line.upper(), size=8, bold=True,
               colour=P_ORANGE, tracking=1.6, max_w=self.cw)
        d.text(self.x0, self.y + 44, "On-Hire Report", size=30, bold=True,
               colour=P_INK)
        d.text(self.x0, self.y + 62, "By company - a section for each company "
               "holding Coates gear", size=12, colour=P_MUTED)
        d.text(self.x0, self.y + 80, "{}  ·  as at {}".format(
            self.when.strftime("%A %d %B %Y"), self.asat.strftime("%H:%M")),
            size=10, bold=True, colour=P_INK)
        self.y += 96
        d.line(self.x0, self.y, self.x1, self.y, colour=P_LINE, lw=0.6)
        self.y += 14

        #  Where we sit, in words.
        d.text(self.x0, self.y + 8, "WHERE WE SIT TODAY", size=7.2, bold=True,
               colour=P_ORANGE, tracking=1.2)
        yy = self.y + 24
        for i, line in enumerate(parts["call"]):
            yy = d.paragraph(self.x0, yy, line, size=10.5 if i == 0 else 9.2,
                             max_w=self.cw, bold=(i == 0),
                             colour=P_INK if i == 0 else P_MUTED,
                             leading=14 if i == 0 else 12.5) + 3
        self.y = yy + 6

        #  The headline numbers, three across, two rows.
        tiles = parts["tiles"]
        gap, h = 8, 58
        w = (self.cw - gap * 2) / 3.0
        for start in range(0, len(tiles), 3):
            x = self.x0
            for label, value, sub in tiles[start:start + 3]:
                d.rect(x, self.y, w, h, fill=P_WHITE, stroke=P_LINE, lw=0.6)
                d.rect(x, self.y, w, 2.5, fill=P_ORANGE)
                d.text(x + 10, self.y + 27, str(value), size=19, bold=True,
                       colour=P_INK)
                d.text(x + 10, self.y + 40, label.upper(), size=6.6, bold=True,
                       colour=P_INK, tracking=0.4, max_w=w - 20)
                d.text(x + 10, self.y + 51, sub, size=7.4, colour=P_MUTED,
                       max_w=w - 20)
                x += w + gap
            self.y += h + gap
        self.y += 10

        #  Contents - every company, and the page it starts on. Each row
        #  is a link, and each company is a bookmark down the side.
        d.text(self.x0, self.y + 10, "In this pack", size=11, bold=True,
               colour=P_INK)
        d.text(self.x1, self.y + 10, "{} compan{}  ·  {} pages".format(
            len(blocks), "y" if len(blocks) == 1 else "ies", self.doc.page_count),
            size=8.5, colour=P_MUTED, align="right")
        self.y += 18
        cols = ((self.x0 + 8, "COMPANY", "left"), (self.x0 + 300, "PEOPLE", "right"),
                (self.x0 + 352, "ITEMS", "right"), (self.x0 + 404, "LINES", "right"),
                (self.x0 + 478, "LONGEST OUT", "right"), (self.x1 - 8, "PAGE", "right"))
        d.rect(self.x0, self.y, self.cw, 18, fill=P_INK)
        for x, label, align in cols:
            d.text(x, self.y + 12.2, label, size=6.8, bold=True, colour=P_WHITE,
                   tracking=0.6, align=align)
        d.rect(self.x0, self.y + 18, self.cw, 1.5, fill=P_ORANGE)
        self.y += 21
        for k, b in enumerate(blocks):
            h = 21
            if k % 2:
                d.rect(self.x0, self.y, self.cw, h, fill=P_ZEBRA)
            d.text(self.x0 + 8, self.y + 14, b["company"], size=9.5, bold=True,
                   colour=P_INK, max_w=270)
            d.text(self.x0 + 300, self.y + 14, str(len(b["people"])), size=9,
                   colour=P_INK, align="right")
            d.text(self.x0 + 352, self.y + 14, str(b["items"]), size=9, bold=True,
                   colour=P_INK, align="right")
            d.text(self.x0 + 404, self.y + 14, str(b["lines"]), size=9,
                   colour=P_INK, align="right")
            self.chip(self.x0 + 478, self.y + 4, _days_text(b["oldest_days"]),
                      day_tone(b["oldest_days"]))
            d.text(self.x1 - 8, self.y + 14, str(starts[k] + 1), size=9.5,
                   bold=True, colour=P_ORANGE, align="right")
            d.line(self.x0, self.y + h, self.x1, self.y + h, colour=P_LINE, lw=0.4)
            d.link(self.x0, self.y, self.cw, h, starts[k])
            self.y += h
        self.y += 12
        if quiet:
            self.y = d.paragraph(
                self.x0, self.y + 8, "Moved gear or drew consumables this period "
                "but have nothing on hire right now: {}.".format(", ".join(quiet)),
                size=8.5, max_w=self.cw, colour=P_MUTED, leading=12) + 4
        self.y = d.paragraph(
            self.x0, self.y + 8, "On-hire dates are the start date of each item's "
            "issue transaction in SiteIQ; the transactions export covers {}. "
            "Items with no issue transaction inside that window are shown as "
            "undated. No costs appear anywhere in this pack - it can go to anyone "
            "on site. The costs are in the workbook.".format(
                self.period or "the export period"),
            size=8.5, max_w=self.cw, colour=P_MUTED, leading=12)
        self.doc.bookmark("Contents", 0, 60)


def build_company_pack(path, s, when, asat, period, parts, blocks, quiet):
    """The whole pack: cover first, then one section per company.
    Returns the number of pages."""
    pk = _Pack(s, when, asat, period,
               "{} - On-Hire Report by Company - {}".format(
                   s.short or s.customer or "Shutdown", when.strftime("%d %b %Y")))
    pk.page("On-Hire Report by Company")           # page 0 - the cover, drawn last
    starts = []
    for k, b in enumerate(blocks, 1):
        starts.append(pk.section(b, index=k, total=len(blocks)))
    #  Bookmarks were added as sections were drawn; the cover's goes first.
    pk.cover(parts, blocks, quiet, starts)
    pk.doc.outline.sort(key=lambda o: o[1])
    pk.footers()
    pk.doc.save(path)
    return pk.doc.page_count


def build_company_pdf(path, s, when, asat, period, b):
    """One company's section on its own, for forwarding to them."""
    pk = _Pack(s, when, asat, period,
               "{} - On-Hire Report - {}".format(b["company"],
                                                 when.strftime("%d %b %Y")))
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
    lines += ["", "EVERYTHING ON HIRE - COMPANY BY COMPANY", ""]
    for block in parts["roll"]:
        lines.append("  {}  ({} items, {} people)".format(
            block["company"], block["items"], len(block["people"])))
        for p in block["people"]:
            when_txt = ("oldest issued {} ({})".format(
                p["since"].strftime("%d %b %Y"), _days_text(p["days"]))
                if p["days"] is not None else
                "no issue transaction in this export")
            lines.append("    {} - {} items, {}".format(
                p["who"], p["n"], when_txt))
            for desc, qty in p["gear"]:
                lines.append("        {} x {}".format(qty, desc))
        lines.append("")

    lines += ["", "WHAT I NEED FROM YOU", ""]
    for n, (head, bodytext) in enumerate(parts["actions"], 1):
        lines.append("  {}. {} - {}".format(n, head, bodytext))
    attached = "The detail is in the attached workbook - twelve tabs"
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
    msg["Subject"] = "{} | On-Hire Report | {}".format(
        s.customer or label, when.strftime("%d %B %Y"))
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
