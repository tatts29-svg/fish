# =============================================================================
#  COATES | AMPOL TOOL STORE - ON-HIRE, UTILISATION & COMPLIANCE REPORT KIT
#  Author: Andrew Fisher  |  The Coates Way  |  POWERED BY SITEIQ
#
#  Reads every input from the suite's one Data area (ampol_paths; never
#  modifies the workbook). Reports: Executive Summary, Tooling On-Hire
#  Report (every company A to Z in one document), Quarterly on-hire charge
#  reports, Utilisation & What-to-Buy, Compliance & Trends. A one-off
#  Company on-hire report is still available (--company NAME) but is no
#  longer part of --everything. Every report ships as PDF + HTML + X-Unsent
#  .eml + Outlook-safe email draft (08_MAKE_OUTLOOK_DRAFTS.bat -> native
#  drafts with full To-field search).
#
#  WHY (02 Sep 2026): every printed figure is now computed here, from the
#  raw SiteIQ exports (RENTAL_STOCK, TRANSACTIONS, STOCKTAKE), the pricing
#  file and the corrected-descriptions mapping. The Excel workbook's Power
#  Query tabs are no longer the source of any number - an audit found them
#  quoting a 06 Aug refresh on a 02 Sep report, and four different on-hire
#  totals on one page because each tab filtered differently. The workbook
#  rules (its M code) are ported below so the numbers still mean the same
#  thing; the workbook itself is only read, when present, for a console
#  cross-check that tells Andrew whether it is stale.
#
#  WHY (02 Sep 2026, later): Andrew asked for ONE clean tooling on-hire
#  report instead of a report per company ("there are hundreds of
#  companies"), the quarterly charge reports kept, the site's former name
#  gone from every page, and everything in alphabetical order. Names now
#  come from the shared ampol_names module (one customer, one name; project
#  accounts roll up to their parent and are shown as a sub-label), every
#  table is A to Z unless its heading says "ranked by ...", and the
#  Tooling On-Hire Report carries the full register: company A to Z,
#  hirer A to Z, items longest-held first.
# =============================================================================
import datetime as dt
import html as _html
import json
import os
import re
import subprocess
import sys
from collections import Counter, defaultdict

import openpyxl

import ampol_names as N  # WHY (02 Sep 2026): one place for how names are shown
import ampol_paths  # WHY (12 Aug 2026): one Data area in, dated Reports folder out
import k2shell      # WHY (12 Aug 2026): the shared K2 chart kit - self-contained SVG

HERE = os.path.dirname(os.path.abspath(__file__))
# WHY (12 Aug 2026): outputs now land in the suite's dated Reports area -
# Reports\<today>\Tooling - created on demand, one folder per day.
OUT_DIR = ampol_paths.day_folder("Tooling")
WORKBOOK = "Ampol_Onhire_Tooling_Report.xlsm"

TODAY = dt.date.today()
# WHY (12 Aug 2026): Australian date style (02 Sep 2026) and 24-hour time,
# same as the rest of the suite. WHY (02 Sep 2026): the leading zero stays
# - the house style is "02 Sep 2026", and every other date on the page
# (fmt_date, stamp) already prints it that way.
GENERATED = dt.datetime.now().strftime("%d %b %Y %H:%M")
DATESTR = TODAY.strftime("%Y-%m-%d")
# WHY (02 Sep 2026): the data-as-at stamp is the SiteIQ pull time written
# inside the RENTAL_STOCK export (REFERENCE_INFO), never a file's mtime.
DATA_ASAT = "TBC"

ORANGE = "#F26222"
DARK = "#1D1D1B"
GREY = "#555555"
LIGHT = "#F5F1EC"
RED = "#B3261E"
GREEN = "#1E7B34"
AMBER = "#9A6A00"

HIGH_VALUE = 1000.0          # replacement-cost threshold for the high-value chase
NOT_SIGHTED_DAYS = 90        # "not seen in 3 months = potentially out of test date"
OUT_OF_TAG_HIRER = "RIGGING & 240V - OUT OF TAG DATE"

QUARTERS = {
    "Q1": ("Q1 Jan-Mar Onhire", "Q1 (Jan-Mar)", (1, 2, 3)),
    "Q2": ("Q2 Apr-Jun Onhire", "Q2 (Apr-Jun)", (4, 5, 6)),
    "Q3": ("Q3 Jul-Sep Onhire", "Q3 (Jul-Sep)", (7, 8, 9)),
    "Q4": ("Q4 Oct-Dec Onhire", "Q4 (Oct-Dec)", (10, 11, 12)),
}
QTR_WORD = {"Q1": "1st Qtr", "Q2": "2nd Qtr", "Q3": "3rd Qtr", "Q4": "4th Qtr"}
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

ELECTRICAL_KW = ["240V", "110V", " LEAD", "EXTENSION LEAD", "RCD", "POWER BOARD",
                 "POWERBOARD", "TRANSFORMER", "DISTRIBUTION BOARD"]
RIGGING_KW = ["SLING", "SHACKLE", "CHAIN BLOCK", "LEVER HOIST", "HOIST", "BEAM CLAMP",
              "BEAM TROLLEY", "TIRFOR", "TURFER", "SPREADER", "LIFTING", "RIGGING",
              "PLATE CLAMP", "DRUM LIFTER"]
HIGH_TORQUE_KW = ["TORQUE", "TENSIONER", "HYTORC", "ENERPAC", "IMPACT WRENCH",
                  "RATTLE GUN", "NUT RUNNER"]
# WHY (02 Sep 2026): BLJ / NDE / UGL / FCCU / SATGAS / MOL were printing as
# "Blj", "Nde Solutions", "Ugl Fccu", "Satgas/mol" - they are acronyms.
ACRONYMS = {"CR", "HIS", "IPS", "CSA", "BMD", "ARL", "JLG", "PPE", "MMG",
            "BLJ", "NDE", "UGL", "FCCU", "SATGAS", "MOL", "SFI", "T&I", "AGM",
            "IPCQ", "WSP", "CXC"}

# ----------------------------------------------------------------------------
# ONE exclusion list for both engines (on-hire and utilisation).
# WHY (02 Sep 2026): the workbook excluded LANYARD from on-hire but the
# utilisation tab still raised "Retractable Lanyard" as a buy signal. These
# families are reported by the Radio / Gas Monitor / Rigging kits instead.
FAMILY_EXCLUSIONS = ("RADIO", "GAS MONITOR", "GAS DETECTOR", "MULTI GAS", "MULTIGAS",
                     "DRAGER", "LANYARD", "STEEL COIL CLAMP")
# Extra group-NAME hygiene the utilisation engine applies to corrected
# descriptions (an uncorrected "Ampol ..." or a brand name is not a group).
UTIL_NAME_BANS = ("AMPOL", "COATES", "MOTOROLA", "DRAEGER", "X-AM", "XAM")
UTIL_EXCLUSIONS = FAMILY_EXCLUSIONS + UTIL_NAME_BANS
# The workbook's own utilisation list, kept only so the port can be verified
# against the workbook tab like-for-like (see verify note in compute_utilisation).
UTIL_M_BANNED = ("AMPOL", "COATES", "RADIO", "MOTOROLA", "DRAGER", "DRAEGER",
                 "X-AM", "XAM", "GAS MONITOR")

# Hirer accounts the workbook's Master Onhire query drops (exact, after Proper case)
MASTER_HIRER_EXCLUSIONS = {"BULK - YARD", "LOADING BAY - OUT OF SERVICE",
                           "OUT OF - CALIBRATION", "RIGGING & 240V - OUT OF TAG DATE"}
# ... and the two it drops by substring
MASTER_HIRER_SUBSTRING_EXCLUSIONS = ("T&I - TOOL STORE", "ALL-AROUND - REPAIRS")

# Custody accounts that are NOT customers: never a company chip, never a
# recovery row, never a company report. Reported on their own labelled line.
INTERNAL_CUSTODY = {"REPAIRS", "DRÄGER", "DRAGER"}

# WHY (02 Sep 2026): shutdown / workflow hirer accounts ("Fccu - 2026 (Sfi)",
# "Atlas Chains - Offsite Repairs", "Loading Bay - Out Of Service") were being
# listed and counted as people. This pattern spots them in both the register
# ("First - Last" style) and the transactions export ("First Last" style).
# A bare "T&I" after a person's name (e.g. "Jay Purcell T&I") stays a person.
CUSTODY_HIRER_RE = re.compile(
    r"repairs|off\s?site|out of service|out of tag|calibration|bulk\s*-?\s*yard"
    r"|^t&i\b|t&i\s*-?\s*(shutdown|tool\s?store)|fccu|\(sfi\)|operations|after hours"
    r"|future\s*-?\s*fuels|dr[äa]e?ger|coates\s*-?\s*out", re.I)

LSR_LINE = ("Life Saving Rule 5 - Tools and Equipment (SEQ-GL-009): nothing damaged, "
            "defective or out of test date is ever reissued.")
CANON = ["Two scans. Two looks. One standard.",
         "Nothing goes on the shelf unless it is ready for hire.",
         "Right first time. Every item. Every time."]


# ---------------------------------------------------------------- helpers ---
def esc(v):
    return _html.escape(str(v)) if v is not None else ""


def money(v):
    try:
        return "${:,.2f}".format(float(v))
    except (TypeError, ValueError):
        return "-"


def pct(v):
    try:
        return "{:.0f}%".format(float(v) * 100)
    except (TypeError, ValueError):
        return "-"


def n_fmt(v):
    """Thousands-separated integer for tiles and prose (1,500 not 1500)."""
    try:
        return f"{int(round(float(v))):,}"
    except (TypeError, ValueError):
        return "-"


def plural(n, word="item"):
    return f"{n_fmt(n)} {word}{'' if n == 1 else 's'}"


def clean(v):
    return str(v).strip() if v is not None else ""


def fmt_date(d):
    return d.strftime("%d %b %Y") if d else "-"


def m_proper(text):
    """Power Query Text.Proper: every run of letters gets a capital first
    letter and lower-case rest, and ANY non-letter starts a new run
    ("240v" -> "240V", "Plumber's" -> "Plumber'S", "DRÄGER" -> "Dräger").
    Ported so descriptions and hirers read exactly as the workbook tabs did."""
    return re.sub(r"[^\W\d_]+",
                  lambda m: m.group(0)[0].upper() + m.group(0)[1:].lower(),
                  clean(text))


def clean_text(v):
    """The workbook's CleanText: Proper(upper(trim)) with the site's former
    name read as the current one (ampol_names.display_desc)."""
    if v is None:
        return ""
    return m_proper(N.display_desc(clean(v).upper()))


def proper_clean(v):
    """The workbook utilisation query's ProperCleanText (Text.Clean strips
    control characters; small words lowered; 300Mm -> 300mm)."""
    t = "".join(ch for ch in clean(v) if ch >= " ")
    t = m_proper(t.strip())
    for a, b in ((" And ", " and "), (" Of ", " of "), (" To ", " to "),
                 (" For ", " for "), (" With ", " with "), ("Mm", "mm")):
        t = t.replace(a, b)
    return t


def desc_key(v):
    """Pricing match key (workbook CleanDescription): former site name read
    as the current one, collapse spaces, upper-case."""
    s = N.display_desc(clean(v))
    return " ".join(t for t in s.split(" ") if t).upper()


def desc_key_noampol(v):
    return " ".join(t for t in desc_key(v).split(" ") if t != "AMPOL").strip()


def harmonise_barcode(v):
    """Workbook HarmonizeBarcode: upper, drop spaces/dashes/slashes, strip
    leading zeros - so 'AMP028/002' and 'AMP028-002' meet as one item."""
    s = clean(v).upper().replace(" ", "").replace("-", "").replace("/", "")
    return s.lstrip("0")


def acronym_case(text, capitalise=True):
    out = []
    for w in re.split(r"(\s+|/|\(|\))", clean(text)):
        if not w or not w.strip() or w in "/()":
            out.append(w)
        elif w.upper() in ACRONYMS:
            out.append(w.upper())
        else:
            out.append(w.capitalize() if capitalise else w)
    return "".join(out)


def display_company(name):
    n = clean(name)
    if not n:
        return ""
    # WHY (02 Sep 2026): "Contract Resources.." - trailing punctuation gone.
    n = n.rstrip(" .,;:-")
    if n.upper() in ACRONYMS:
        return n.upper()
    return acronym_case(n, capitalise=True)


def canonical_company(name):
    """ONE company rule for the register AND the transactions export.
    WHY (02 Sep 2026): the on-hire side merged AMPOL REFINERIES (QLD) PTY LTD
    and CALTEX into Ampol but the transactions side did not, so Ampol showed
    2,977 transactions while another 1,778 sat under the long name. FCCU and
    SATGAS/MOL suffixes are kept as separate project accounts on both sides
    (routing depends on the split) - the pages say they are the same customer."""
    u = clean(name).upper().replace("CALTEX", "AMPOL")
    if not u:
        return ""
    if "AMPOL REFINERIES" in u:
        return "Ampol"
    if u.rstrip(" .") == "CR":
        return "Contract Resources"
    return display_company(u)


def base_company(name):
    """'Contract Resources FCCU' -> 'Contract Resources' (project accounts)."""
    return re.sub(r"\s+(FCCU|SATGAS/MOL|SATGAS|MOL)$", "", clean(name), flags=re.I)


def display_hirer(name):
    """Hirer as the register spells it (Proper case), acronyms restored."""
    return acronym_case(m_proper(name), capitalise=False)


def is_custody_hirer(name):
    return bool(CUSTODY_HIRER_RE.search(clean(name)))


def safe_date(v):
    if v is None or v == "":
        return None
    if isinstance(v, dt.datetime):
        return v.date()
    if isinstance(v, dt.date):
        return v
    s = str(v).strip().split(" ")[0]
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%y"):
        try:
            return dt.datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def safe_datetime(v):
    """SiteIQ REFERENCE_INFO stamps look like '02/09/2026 06:30 PM'."""
    if isinstance(v, dt.datetime):
        return v
    s = clean(v)
    for fmt in ("%d/%m/%Y %I:%M %p", "%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M", "%d/%m/%Y"):
        try:
            return dt.datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None


def stamp(d):
    return d.strftime("%d %b %Y %H:%M") if d else "TBC"


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def matches_any(text, kws):
    t = " " + clean(text).upper() + " "
    return any(k in t for k in kws)


def family_hit(desc, words=FAMILY_EXCLUSIONS):
    """First excluded family word found in a description, or None."""
    u = clean(desc).upper()
    for w in words:
        if w in u:
            return w
    return None


def category_of(desc):
    if matches_any(desc, HIGH_TORQUE_KW):
        return "High Torque"
    if matches_any(desc, RIGGING_KW):
        return "Rigging"
    if matches_any(desc, ELECTRICAL_KW):
        return "Electrical"
    return None


def quarter_of(d):
    return "Q" + str((d.month - 1) // 3 + 1) if d else None


def quarter_started(qk):
    return TODAY >= dt.date(TODAY.year, QUARTERS[qk][2][0], 1)


# ---------------------------------------------------------------- loading ---
def find_file(*names):
    # WHY (12 Aug 2026): inputs now come from the suite's one Data area via
    # ampol_paths - newest match wins, Excel ~$ lock files and archived
    # Source_ pulls are never candidates. Same name, same call sites.
    return ampol_paths.find_data(*names) or None


def sheet_rows(ws, probe):
    """Read a sheet as dicts, locating the header row by a probe column name."""
    rows = list(ws.iter_rows(values_only=True))
    hdr_i = None
    for i, r in enumerate(rows[:6]):
        if r and any(clean(c) == probe for c in r if c is not None):
            hdr_i = i
            break
    if hdr_i is None:
        return []
    headers = [clean(c) for c in rows[hdr_i]]
    out = []
    for r in rows[hdr_i + 1:]:
        if r is None or all(c is None or clean(c) == "" for c in r):
            continue
        out.append({h: v for h, v in zip(headers, r) if h})
    return out


def reference_info(wb):
    """The SiteIQ export's own REQUESTED_DATE/TIME and report period.
    WHY (02 Sep 2026): this is the true data-as-at - the moment SiteIQ
    answered - not when a file was saved or a workbook refreshed."""
    info = {"pulled": None, "period": ""}
    if "REFERENCE_INFO" not in wb.sheetnames:
        return info
    rows = [r for r in wb["REFERENCE_INFO"].iter_rows(values_only=True)
            if r and any(c is not None for c in r)]
    if len(rows) < 2:
        return info
    hdr = [clean(c) for c in rows[0]]
    vals = rows[1]
    for h, v in zip(hdr, vals):
        if "REQUESTED_DATE" in h.upper():
            info["pulled"] = safe_datetime(v)
        elif h.upper() == "REPORT_PERIOD":
            info["period"] = clean(v)
    return info


def load_all():
    global DATA_ASAT
    d = {"asat": {}}

    # ---- RENTAL_STOCK: the live register, the source of every on-hire figure
    rs_path = find_file("RENTAL_STOCK.xlsx")
    if not rs_path:
        sys.exit("RENTAL_STOCK.xlsx not found in the Data folder - run "
                 "12_PULL_SITEIQ_EXPORTS.bat (or save the SiteIQ export there) "
                 "and run again.")
    rwb = openpyxl.load_workbook(rs_path, read_only=True, data_only=True)
    d["asat"]["stock"] = reference_info(rwb)
    ws = rwb["RENTAL_STOCK"]
    rows = ws.iter_rows(values_only=True)
    headers = [clean(c) for c in next(rows)]
    idx = {h: i for i, h in enumerate(headers)}

    def col(r, name, default=None):
        i = idx.get(name)
        return r[i] if i is not None and i < len(r) else default

    d["stock"] = []
    for r in rows:
        if r is None or all(c is None for c in r):
            continue
        d["stock"].append({
            "barcode": clean(col(r, "ITEM_BARCODE")),
            "desc_raw": clean(col(r, "ITEM_DESCRIPTION")),
            "status": clean(col(r, "ITEM_STATUS")),
            "company_raw": clean(col(r, "COMPANY_NAME")),
            "hirer_raw": clean(col(r, "HIRER_NAME")),
            "date": safe_date(col(r, "ON_HIRE_DATE")),
            "time": clean(col(r, "ON_HIRE_TIME")),
            "unit": clean(col(r, "STORAGE_UNIT")),
        })
    rwb.close()
    pulled = d["asat"]["stock"]["pulled"]
    DATA_ASAT = ("SiteIQ pull " + stamp(pulled)) if pulled else "TBC (no REFERENCE_INFO)"

    # ---- corrected descriptions (Tooling_Description_Mapping.xlsx, sheet 'Use this')
    # WHY (02 Sep 2026): the workbook's Master query looked for a column named
    # "CorrectedDescriptionsTable.Corrected Description" that the file does not
    # have ("Corrected Description"), so no correction ever reached the tabs
    # and "Critictal Risk Signage" printed as-is. Read here by the real header.
    d["corr"] = {}          # barcode (upper) -> corrected description, first wins
    d["corr_rows"] = []     # raw rows for the utilisation engine
    # WHY (02 Sep 2026): the mapping is keyed by barcode, so "Critictal Risk
    # Signage" was corrected for AMP368/052 only while its two sister signs on
    # hire kept the typo. When every mapping row for a register description
    # agrees on one corrected name, that name is used for any barcode carrying
    # the same description - display only; utilisation stays barcode-keyed.
    d["corr_by_desc"] = {}  # register description key -> corrected description
    by_desc = defaultdict(set)
    mp_path = find_file("Tooling_Description_Mapping.xlsx")
    if mp_path:
        mwb = openpyxl.load_workbook(mp_path, read_only=True, data_only=True)
        sheet = next((s for s in ("Use this", "In use", "CorrectedDescriptionsTable")
                      if s in mwb.sheetnames), None)
        if sheet:
            mrows = list(mwb[sheet].iter_rows(values_only=True))
            mh = [clean(c) for c in mrows[0]] if mrows else []
            bi = next((i for i, h in enumerate(mh) if h == "ITEM_BARCODE"), None)
            ci = next((i for i, h in enumerate(mh)
                       if h in ("Corrected Description",
                                "CorrectedDescriptionsTable.Corrected Description")), None)
            di = next((i for i, h in enumerate(mh) if h == "ITEM_DESCRIPTION"), None)
            if bi is not None and ci is not None:
                for r in mrows[1:]:
                    if not r:
                        continue
                    bc = clean(r[bi] if bi < len(r) else None).upper()
                    corr = clean(r[ci] if ci < len(r) else None)
                    d["corr_rows"].append((bc, corr))
                    if bc and corr:
                        d["corr"].setdefault(bc, corr)
                    if di is not None and corr:
                        raw = clean(r[di] if di < len(r) else None)
                        if raw:
                            by_desc[desc_key(clean_text(raw))].add(corr)
        mwb.close()
    d["corr_by_desc"] = {k: next(iter(v)) for k, v in by_desc.items() if len(v) == 1}
    d["mapping_n"] = len(d["corr_rows"]) if mp_path else None

    # ---- pricing (Avg Buy Price (New) / where to buy)
    # WHY (12 Aug 2026): the underscore name is how the file actually lands in
    # Data, so it is tried first; the spaced name stays as the fallback.
    # WHY (02 Sep 2026): the file carries 831 duplicate descriptions (16 with
    # conflicting prices). The workbook keeps the FIRST row per description
    # (Table.Distinct) - so does every dictionary below (setdefault), so the
    # utilisation buy prices and the replacement costs agree with each other.
    d["pricing"] = {}        # raw description (upper) -> {buy, source}
    d["price_normal"] = {}   # workbook match key -> Avg Buy Price (New)
    d["price_noampol"] = {}  # workbook match key without the AMPOL token
    d["pricing_noampol"] = {}  # group-name lookup without the AMPOL token (priced rows)
    d["pricing_rows"] = 0
    pr_path = find_file("Ampol_ToolStore_Pricing.xlsx", "Ampol ToolStore Pricing.xlsx")
    if pr_path:
        pwb = openpyxl.load_workbook(pr_path, read_only=True, data_only=True)
        ws = pwb["RENTAL_STOCK"]
        rows = ws.iter_rows(values_only=True)
        ph = [clean(c) for c in next(rows)]
        pi = {h: i for i, h in enumerate(ph)}
        di, bi_, si = pi.get("ITEM_DESCRIPTION", 0), pi.get("Avg Buy Price (New)", 1), \
            pi.get("Source to Buy", 5)
        for r in rows:
            if r is None or not clean(r[di]):
                continue
            d["pricing_rows"] += 1
            buy = num(r[bi_])
            src = clean(r[si]) if si < len(r) else ""
            d["pricing"].setdefault(clean(r[di]).upper(), {"buy": buy, "source": src})
            if buy is not None:
                d["pricing_noampol"].setdefault(desc_key_noampol(r[di]),
                                                {"buy": buy, "source": src})
            ct = clean_text(r[di])
            d["price_normal"].setdefault(desc_key(ct), buy)
            d["price_noampol"].setdefault(desc_key_noampol(ct), buy)
        pwb.close()

    # ---- the on-hire master list, straight from the register
    build_master(d)

    # ---- transactions (year to date)
    # WHY (12 Aug 2026): the SiteIQ pull can land as TRANSACTIONS_Full.xlsx or
    # plain TRANSACTIONS.xlsx - try both, newest wins, same sheet either way.
    d["tx"] = []
    d["asat"]["tx"] = {"pulled": None, "period": ""}
    tx_path = find_file("TRANSACTIONS_Full.xlsx", "TRANSACTIONS.xlsx")
    if tx_path:
        twb = openpyxl.load_workbook(tx_path, read_only=True, data_only=True)
        d["asat"]["tx"] = reference_info(twb)
        ws = twb["CUSTOMER_CONTRACTOR_EQUIP"]
        rows = ws.iter_rows(values_only=True)
        headers = [clean(c) for c in next(rows)]
        idx = {h: i for i, h in enumerate(headers)}
        bc_col = next((c for c in ("LATEST_BARCODE", "BARCODE", "ITEM_BARCODE")
                       if c in idx), "LATEST_BARCODE")
        for r in rows:
            if r is None or r[0] is None:
                continue
            company_raw = clean(r[idx.get("EMPLOYER_NAME", 0)])
            hirer = clean(r[idx.get("HIRER_NAME", 1)])
            desc = clean(r[idx.get("SKU/ITEM DESCRIPTION", 4)])
            company = canonical_company(company_raw)
            d["tx"].append({
                "company": company,
                "company_raw": company_raw,
                "hirer": hirer,
                "desc": desc,
                "barcode": clean(r[idx.get(bc_col, 5)]),
                "cat": clean(r[idx.get("PRODUCT_CATEGORY", 6)]),
                "start": safe_date(r[idx.get("TRAN_START_DATE", 9)]),
                "end": safe_date(r[idx.get("TRAN_END_DATE", 11)]),
                "custody": (company.upper() in INTERNAL_CUSTODY) or is_custody_hirer(hirer),
                "family": family_hit(desc),
            })
        twb.close()

    # ---- stocktake (last sighted)
    d["stocktake"] = {}
    d["asat"]["stocktake"] = {"pulled": None, "period": ""}
    st_path = find_file("STOCKTAKE.xlsx", "STOCKTAKE (1).xlsx")
    if st_path:
        swb = openpyxl.load_workbook(st_path, read_only=True, data_only=True)
        d["asat"]["stocktake"] = reference_info(swb)
        ws = swb["STOCKTAKE"]
        rows = ws.iter_rows(values_only=True)
        headers = [clean(c) for c in next(rows)]
        idx = {h: i for i, h in enumerate(headers)}
        for r in rows:
            if r is None:
                continue
            bc = clean(r[idx.get("LATEST_BARCODE", 4)])
            if not bc:
                continue
            seen = r[idx.get("LAST_SIGHTED_DATE_TIME", 9)]
            seen_d = safe_date(seen)
            prev = d["stocktake"].get(bc)
            if prev is None or (seen_d and (prev["seen"] is None or seen_d > prev["seen"])):
                d["stocktake"][bc] = {"seen": seen_d,
                                      "by": clean(r[idx.get("LAST_SIGHTED_BY", 10)]),
                                      "unit": clean(r[idx.get("STORAGE_UNIT", 1)])}
        swb.close()

    # ---- out-of-tag parked gear straight from RENTAL_STOCK
    d["out_of_tag"] = [{"barcode": s["barcode"], "desc": s["desc_raw"], "status": s["status"]}
                       for s in d["stock"] if s["hirer_raw"].upper() == OUT_OF_TAG_HIRER]

    # ---- utilisation, computed here (the workbook tab is not used)
    d["util"] = compute_utilisation(d, TODAY, UTIL_EXCLUSIONS)

    # ---- workbook: optional console cross-check only
    d["wb"] = workbook_crosscheck(d)
    return d


def build_master(d):
    """The on-hire master list - the workbook's 'Master Onhire' rules, applied
    to the live register:
      * register row with a company (= On Hire), not COMPANY REPAIRS
      * hirer not 'T&I - Tool store' / 'All-Around - Repairs'
      * on-hire date in the report year (older rows are 'legacy', counted
        separately and stated on the page)
      * not a radio / gas monitor / Drager / lanyard / steel coil clamp
      * not Bulk - Yard, Loading Bay - Out Of Service, Out Of - Calibration,
        Rigging & 240V - Out Of Tag Date
    Every quarter count, company count and recovery row is derived from
    THIS list by on-hire month, so they all tie to one total."""
    master, legacy = [], []
    year = TODAY.year
    for s in d["stock"]:
        if not s["company_raw"] or not s["barcode"]:
            continue
        if s["company_raw"].upper() == "COMPANY REPAIRS":
            continue
        hu = s["hirer_raw"].upper()
        if any(x in hu for x in MASTER_HIRER_SUBSTRING_EXCLUSIONS):
            continue
        desc_clean = clean_text(s["desc_raw"])
        fam = family_hit(desc_clean)
        if s["date"] and s["date"].year < year:
            legacy.append({**s, "family": fam, "company": canonical_company(s["company_raw"])})
            continue
        if not s["date"] or s["date"].year != year:
            continue
        if fam:
            continue
        hirer = m_proper(s["hirer_raw"])
        if hirer.upper() in MASTER_HIRER_EXCLUSIONS:
            continue
        company = canonical_company(s["company_raw"])
        corrected = (d["corr"].get(s["barcode"].upper())
                     or d["corr_by_desc"].get(desc_key(desc_clean)))
        master.append({
            "company": company,
            "company_raw": s["company_raw"],
            "hirer": display_hirer(hirer),
            "barcode": s["barcode"],
            "desc": corrected or desc_clean,
            "desc_raw": s["desc_raw"],
            "corrected": ("barcode" if d["corr"].get(s["barcode"].upper())
                          else ("description" if corrected else "")),
            "date": s["date"],
            "time": s["time"],
            "month": s["date"].strftime("%B"),
            "q": quarter_of(s["date"]),
            "cost": price_for_description(d, desc_clean),
            "custody": company.upper() in INTERNAL_CUSTODY,
            "custody_hirer": is_custody_hirer(hirer),
            # category keys off the register description (as audited);
            # see the note in compliance limits
            "cat": category_of(desc_clean),
        })
    master.sort(key=lambda r: (r["company"], r["hirer"], r["desc"]))
    d["master"] = master
    d["legacy"] = legacy
    # register-level counts for the executive tiles
    st = defaultdict(int)
    for s in d["stock"]:
        st[s["status"]] += 1
    d["status_counts"] = dict(st)
    avail = [s for s in d["stock"] if "AVAILABLE" in s["status"].upper()]
    d["available_all_n"] = len(avail)
    d["available_n"] = sum(1 for s in avail if not family_hit(clean_text(s["desc_raw"])))
    d["available_family"] = defaultdict(int)
    for s in avail:
        f = family_hit(clean_text(s["desc_raw"]))
        if f:
            d["available_family"][f] += 1
    d["repairs_rows"] = [s for s in d["stock"] if s["company_raw"].upper() == "REPAIRS"]
    d["repairs_n"] = len(d["repairs_rows"])
    return master


def price_for_description(d, desc_clean):
    """Replacement cost the workbook way: exact match key first, then the
    key with the AMPOL token dropped; None (a dash) when neither hits."""
    v = d["price_normal"].get(desc_key(desc_clean))
    if v is None:
        v = d["price_noampol"].get(desc_key_noampol(desc_clean))
    return v


def price_for_group(d, group):
    """Catalogue buy price for a utilisation group name: exact description
    first, then the description with the AMPOL token dropped (first priced
    row wins either way, matching the replacement-cost rule)."""
    p = d["pricing"].get(clean(group).upper())
    if p and p.get("buy") is not None:
        return p
    p = d["pricing_noampol"].get(desc_key_noampol(group))
    return p if p else {"buy": None, "source": ""}


def compute_utilisation(d, today, banned):
    """Port of the workbook's 'Tooling Utilisation' query.

    Inputs: the corrected-descriptions mapping (barcode -> group), the live
    register (qty / on hire / available per group) and every transaction
    since 1 Jan. Hire days = distinct calendar days each barcode was out
    between 1 Jan and `today` (transactions plus current open hires),
    summed per group. YTD % = hire days / (qty x days elapsed this year).

    VERIFIED (02 Sep 2026): run with today = 06 Aug 2026 and the workbook's
    own banned list, every group's hire days, qty and YTD % that the 06 Aug
    tab shows are reproduced except where the inputs themselves moved after
    06 Aug (items added / relabelled / returned and re-issued) - see the
    verification note in the console output. The report runs it at the
    real date with the shared FAMILY_EXCLUSIONS, so radios / lanyards never
    appear as buy signals.
    """
    y0 = dt.date(today.year, 1, 1)
    y1 = min(max(today, y0), dt.date(today.year, 12, 31))
    days_elapsed = (y1 - y0).days + 1

    def is_banned(t):
        u = clean(t).upper()
        return any(b in u for b in banned)

    # corrected mapping: harmonised barcode -> group (first wins)
    mapping = {}
    for bc, corr in d["corr_rows"]:
        bcu = clean(bc).upper()
        g = proper_clean(corr)
        if not bcu or not g or is_banned(g):
            continue
        mapping.setdefault(harmonise_barcode(bcu), g)

    # stock, one row per barcode (highest priority, then latest on-hire date)
    best = {}
    for s in d["stock"]:
        bc = s["barcode"].upper()
        if not bc:
            continue
        pri = 2 if (s["company_raw"] or s["hirer_raw"]) else (1 if s["status"] else 0)
        key = (pri, s["date"] or dt.date(1, 1, 1))
        if bc not in best or key > best[bc][0]:
            best[bc] = (key, s)
    groups = defaultdict(lambda: {"qty": set(), "oh": 0, "av": 0})
    open_hires = []
    for bc, (_k, s) in best.items():
        g = mapping.get(harmonise_barcode(bc))
        if not g:
            continue
        G = groups[g]
        G["qty"].add(bc)
        on_hire = bool(s["company_raw"] or s["hirer_raw"])
        if on_hire:
            G["oh"] += 1
            open_hires.append((harmonise_barcode(bc), g, proper_clean(s["hirer_raw"]), s["date"]))
        else:
            su = proper_clean(s["status"]).upper()
            if not any(x in su for x in ("OUT", "REPAIR", "DAMAGED", "FAILED",
                                          "CALIBRATION", "MISSING")):
                G["av"] += 1

    # transactions + open hires -> per barcode: count, distinct days, hirers
    per = defaultdict(lambda: {"n": 0, "days": set(), "hirers": set()})
    n_tx_used = 0
    for t in d["tx"]:
        if not t["barcode"] or not t["start"]:
            continue
        s, e = t["start"], t["end"]
        if s > y1 or (e is not None and e < y0):
            continue
        g = mapping.get(harmonise_barcode(t["barcode"]))
        if not g:
            continue
        n_tx_used += 1
        P = per[(harmonise_barcode(t["barcode"]), g)]
        P["n"] += 1
        h = proper_clean(t["hirer"])
        if h:
            P["hirers"].add(h)
        a = max(s, y0)
        z = y1 if (e is None or e > y1) else e
        if a <= z:
            P["days"].update(range(a.toordinal(), z.toordinal() + 1))
    for hb, g, h, dte in open_hires:
        P = per[(hb, g)]
        if h:
            P["hirers"].add(h)
        a = y0 if (dte is None or dte < y0) else dte
        if a <= y1:
            P["days"].update(range(a.toordinal(), y1.toordinal() + 1))
    tg = defaultdict(lambda: {"tx": 0, "hirers": set(), "days": 0})
    for (_hb, g), P in per.items():
        T = tg[g]
        T["tx"] += P["n"]
        T["hirers"] |= P["hirers"]
        T["days"] += len(P["days"])

    rows = []
    for g in sorted(set(groups) | set(tg)):
        q = len(groups[g]["qty"]) if g in groups else 0
        oh = groups[g]["oh"] if g in groups else 0
        av = groups[g]["av"] if g in groups else 0
        tx = tg[g]["tx"] if g in tg else 0
        hr = len(tg[g]["hirers"]) if g in tg else 0
        dys = tg[g]["days"] if g in tg else 0
        live = 0.0 if q == 0 else oh / q
        ytd = 0.0 if q == 0 else dys / (q * days_elapsed)
        if q == 0 and tx > 0:
            rec = "Review - Used in Transactions but Not Found in Current Stock"
        elif q == 0:
            rec = "No Current Stock"
        elif av == 0 and oh > 0:
            rec = "High Priority - No Available Stock"
        elif live >= 0.85:
            rec = "Consider Additional Stock"
        elif ytd >= 0.70:
            rec = "Strong Usage - Monitor Closely"
        elif tx == 0 and q > 0:
            rec = "Low Usage - Review Need"
        elif av > oh and ytd < 0.20:
            rec = "Potential Overstock"
        else:
            rec = "Stock Level Looks OK"
        price = price_for_group(d, g)
        rows.append({"group": g, "qty": q, "on_hire": oh, "avail": av, "live": live,
                     "tx": tx, "hirers": hr, "days": dys, "ytd": ytd, "rec": rec,
                     "buy": price.get("buy"), "source": price.get("source", "")})
    buy = sorted([r for r in rows if r["rec"] in
                  ("High Priority - No Available Stock", "Consider Additional Stock")],
                 key=lambda r: (-(r["live"] or 0), -r["days"]))
    overstock = sorted([r for r in rows if r["rec"] == "Potential Overstock"],
                       key=lambda r: (r["ytd"] or 0))
    top_used = sorted([r for r in rows if r["days"] > 0], key=lambda r: -r["days"])[:15]
    return {"rows": rows, "buy": buy, "overstock": overstock, "top_used": top_used,
            "today": today, "days_elapsed": days_elapsed,
            "mapping_usable": len(mapping), "mapping_rows": len(d["corr_rows"]),
            "tx_used": n_tx_used, "tx_total": len(d["tx"]),
            "groups_with_days": sum(1 for r in rows if r["days"] > 0)}


def workbook_crosscheck(d):
    """If the Excel workbook is beside the exports, say on the console whether
    its tabs still agree with the live register - nothing on any page reads
    from it any more."""
    wb_path = find_file(WORKBOOK)
    if not wb_path:
        return None
    info = {"mtime": dt.datetime.fromtimestamp(os.path.getmtime(wb_path)),
            "master_rows": None, "master_ties": None, "util_refresh": None}
    try:
        wb = openpyxl.load_workbook(wb_path, read_only=True, data_only=True)
        if "Master Onhire" in wb.sheetnames:
            tab = sheet_rows(wb["Master Onhire"], "ITEM_BARCODE")
            tab_bc = {clean(r.get("ITEM_BARCODE")).upper() for r in tab if clean(r.get("ITEM_BARCODE"))}
            mine = {r["barcode"].upper() for r in d["master"]}
            info["master_rows"] = len(tab_bc)
            info["master_ties"] = (tab_bc == mine)
        if "Tooling Utilisation" in wb.sheetnames:
            tab = sheet_rows(wb["Tooling Utilisation"], "Equipment Group")
            ests = []
            for r in tab:
                q, dys, y = num(r.get("Total Qty")), num(r.get("Total Hire Days")), \
                    num(r.get("YTD Utilisation %"))
                if q and dys and y:
                    ests.append(dys / (q * y))
            if ests:
                ests.sort()
                implied = int(round(ests[len(ests) // 2]))
                info["util_refresh"] = dt.date(TODAY.year, 1, 1) + dt.timedelta(days=implied - 1)
        wb.close()
    except Exception as e:  # the cross-check must never stop a build
        info["error"] = str(e)
    return info


# ----------------------------------------------------------------- models ---
def rows_for(d, qk):
    if qk == "YEAR":
        return list(d["master"])
    return [r for r in d["master"] if r["q"] == qk]


def value_bits(rows):
    priced = [r for r in rows if r["cost"] is not None]
    return {"n": len(rows), "value": sum(r["cost"] for r in priced),
            "priced": len(priced), "unpriced": len(rows) - len(priced)}


def quarter_model(d, qk):
    label = QUARTERS[qk][1] if qk != "YEAR" else "Year " + str(TODAY.year)
    rows = rows_for(d, qk)
    custody = [r for r in rows if r["custody"]]
    client = [r for r in rows if not r["custody"]]
    by_co = defaultdict(list)
    for r in client:
        by_co[r["company"] or "(No Company Recorded)"].append(r)
    companies = {}
    for co in sorted(by_co):
        items = sorted(by_co[co], key=lambda r: (r["date"] or TODAY, r["hirer"]))
        companies[co] = {"people": [r for r in items if not r["custody_hirer"]],
                         "accounts": [r for r in items if r["custody_hirer"]],
                         "all": items, "vb": value_bits(items)}
    vb = value_bits(rows)
    return {"key": qk, "label": label, "rows": rows, "companies": companies,
            "custody": custody, "total_val": vb["value"], "priced": vb["priced"],
            "unpriced": vb["unpriced"],
            "n_companies": len([k for k in companies if k != "(No Company Recorded)"]),
            "n_accounts": sum(1 for r in client if r["custody_hirer"])}


def company_model(d, name):
    disp = display_company(name)
    mine = [r for r in d["master"] if r["company"] == disp]
    per_q = {qk: [r for r in mine if r["q"] == qk] for qk in QUARTERS}
    tx = [t for t in d["tx"] if t["company"] == disp]
    tx_ytd = len(tx)
    tx_custody = sum(1 for t in tx if t["custody"])
    same_day = sum(1 for t in tx if t["end"] and t["start"] and t["end"] == t["start"])
    people = sorted({t["hirer"] for t in tx if t["hirer"] and not t["custody"]})
    accounts = sorted({t["hirer"] for t in tx if t["hirer"] and t["custody"]})
    high_val = sorted([r for r in mine if (r["cost"] or 0) >= HIGH_VALUE],
                      key=lambda r: -(r["cost"] or 0))
    compliance = [r for r in mine if r["cat"]]
    vb = value_bits(mine)
    base = base_company(disp)
    related = []
    for other in sorted({r["company"] for r in d["master"]} | {t["company"] for t in d["tx"]}):
        if other and other != disp and base_company(other) == base \
                and other.upper() not in INTERNAL_CUSTODY:
            related.append({"name": other,
                            "on_hire": sum(1 for r in d["master"] if r["company"] == other),
                            "tx": sum(1 for t in d["tx"] if t["company"] == other)})
    items = sorted(mine, key=lambda r: (r["date"] or TODAY, r["hirer"]))
    return {"name": disp, "items": items,
            "people_items": [r for r in items if not r["custody_hirer"]],
            "account_items": [r for r in items if r["custody_hirer"]],
            "per_q": per_q, "tx_ytd": tx_ytd, "tx_custody": tx_custody,
            "same_day": same_day,
            "same_day_pct": (same_day / tx_ytd) if tx_ytd else None,
            "people": people, "accounts": accounts, "high_val": high_val,
            "compliance": compliance, "total_val": vb["value"], "priced": vb["priced"],
            "unpriced": vb["unpriced"], "related": related}


def util_model(d):
    return d["util"]


def compliance_model(d):
    cutoff = TODAY - dt.timedelta(days=NOT_SIGHTED_DAYS)
    chase = []
    for r in d["master"]:
        if not r["cat"]:
            continue
        st = d["stocktake"].get(r["barcode"])
        seen = st["seen"] if st else None
        if seen is None or seen < cutoff:
            chase.append({**r, "seen": seen})
    chase.sort(key=lambda r: (r["cat"], r["seen"] or dt.date(2000, 1, 1)))
    by_cat = defaultdict(list)
    for c in chase:
        by_cat[c["cat"]].append(c)
    high_val = sorted([r for r in d["master"] if (r["cost"] or 0) >= HIGH_VALUE],
                      key=lambda r: -(r["cost"] or 0))
    # monthly movement trend from transactions (every account, every family -
    # the page says so; the current month is partial and is labelled)
    trend = defaultdict(int)
    for t in d["tx"]:
        if t["start"] and t["start"].year == TODAY.year:
            trend[t["start"].month] += 1
    trend_rows = []
    for m in range(1, 13):
        if trend.get(m, 0) or m < TODAY.month:
            lab = MONTHS[m - 1] + (" (partial)" if m == TODAY.month else "")
            trend_rows.append((lab, trend.get(m, 0)))
    return {"chase": chase, "by_cat": dict(by_cat), "out_of_tag": d["out_of_tag"],
            "high_val": high_val, "trend": trend_rows}


def recovery_rows(d):
    """Per-company recovery table from the master list by on-hire quarter.
    Custody accounts (Repairs) come back on their own line, never as a
    company. Everything ties to len(master)."""
    by_co = defaultdict(list)
    custody = []
    for r in d["master"]:
        (custody if r["custody"] else by_co[r["company"]]).append(r)

    def line(name, items):
        row = {"company": name, "q": {}, "items": items}
        for qk in QUARTERS:
            row["q"][qk] = value_bits([r for r in items if r["q"] == qk])
        row["total"] = value_bits(items)
        return row
    companies = [line(co, by_co[co]) for co in sorted(by_co)]
    custody_line = line("Repairs custody account (internal)", custody) if custody else None
    return companies, custody_line


def legacy_model(d):
    leg = d["legacy"]
    fam = defaultdict(int)
    for r in leg:
        fam[r["family"] or "Tooling"] += 1
    by_co = defaultdict(lambda: defaultdict(int))
    for r in leg:
        by_co[r["company"]][r["family"] or "Tooling"] += 1
        by_co[r["company"]]["_n"] += 1
    top = sorted(by_co.items(), key=lambda kv: -kv[1]["_n"])[:8]
    return {"n": len(leg), "oldest": min((r["date"] for r in leg if r["date"]), default=None),
            "families": dict(fam), "tooling_n": fam.get("Tooling", 0), "top": top}


def exec_model(d):
    master = d["master"]
    client = [r for r in master if not r["custody"]]
    custody = [r for r in master if r["custody"]]
    vb = value_bits(master)
    companies = sorted({r["company"] for r in client if r["company"]})
    um = util_model(d)
    cm = compliance_model(d)
    qcounts = {qk: sum(1 for r in master if r["q"] == qk) for qk in QUARTERS}
    tx = d["tx"]
    tx_ytd = len(tx)
    same_day = sum(1 for t in tx if t["end"] and t["start"] and t["end"] == t["start"])
    tx_custody = sum(1 for t in tx if t["custody"])
    tx_family = sum(1 for t in tx if t["family"] and not t["custody"])
    tx_by_custody_co = defaultdict(int)
    for t in tx:
        if t["company"].upper() in INTERNAL_CUSTODY:
            tx_by_custody_co[t["company"]] += 1
    comp_rows, custody_line = recovery_rows(d)
    buy_priced = [r for r in um["buy"] if r["buy"] is not None]
    return {"on_hire": len(master), "total_val": vb["value"], "priced": vb["priced"],
            "unpriced": vb["unpriced"], "companies": companies,
            "custody_n": len(custody), "n_accounts": sum(1 for r in client if r["custody_hirer"]),
            "available": d["available_n"], "available_all": d["available_all_n"],
            "available_family": dict(d["available_family"]),
            "repairs": d["repairs_n"], "status_counts": d["status_counts"],
            "qcounts": qcounts, "tx_ytd": tx_ytd, "same_day": same_day,
            "same_day_pct": (same_day / tx_ytd) if tx_ytd else None,
            "tx_custody": tx_custody, "tx_family": tx_family,
            "tx_by_custody_co": dict(tx_by_custody_co),
            "tx_client_tooling": tx_ytd - tx_custody - tx_family,
            "buy_n": len(um["buy"]), "buy_priced_n": len(buy_priced),
            "overstock_n": len(um["overstock"]),
            "chase_n": len(cm["chase"]), "out_of_tag_n": len(cm["out_of_tag"]),
            "high_val_n": len(cm["high_val"]),
            "high_val_sum": sum(r["cost"] or 0 for r in cm["high_val"]),
            "recovery": comp_rows, "custody_line": custody_line,
            "legacy": legacy_model(d)}


# -------------------------------------------------------------- rendering ---
def page(title, subtitle, body, limits):
    lim = "".join("<li>" + esc(x) + "</li>" for x in limits)
    canon = "  |  ".join(CANON)
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>{esc(title)}</title>
<style>
 body{{font-family:Segoe UI,Arial,sans-serif;color:{DARK};margin:0;background:#fff;}}
 .band{{background:{DARK};color:#fff;padding:26px 34px;}}
 .band h1{{margin:0;font-size:24px;letter-spacing:.5px;}}
 .band .sub{{color:{ORANGE};font-weight:700;margin-top:6px;font-size:13px;}}
 .band .meta{{color:#bbb;font-size:11px;margin-top:8px;}}
 .wrap{{padding:22px 34px;}}
 h2{{font-size:15px;border-left:5px solid {ORANGE};padding-left:10px;margin:26px 0 10px 0;text-transform:uppercase;letter-spacing:1px;}}
 p.story{{font-size:12.5px;line-height:1.75;margin:8px 0;}}
 p.note{{font-size:11px;line-height:1.6;margin:6px 0;color:{GREY};}}
 table{{border-collapse:collapse;width:100%;font-size:11px;margin:8px 0;}}
 th{{background:{DARK};color:#fff;text-align:left;padding:6px 8px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;}}
 td{{padding:5px 8px;border-bottom:1px solid #e5e0da;}}
 tr:nth-child(even) td{{background:{LIGHT};}}
 table.tight{{font-size:10px;}} table.tight th{{padding:5px 5px;font-size:9px;}} table.tight td{{padding:4px 5px;}}
 .tiles{{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0;}}
 .tile{{border:1px solid #e0dad2;border-bottom:3px solid {ORANGE};padding:12px 16px;min-width:130px;}}
 .tile .v{{font-size:22px;font-weight:800;color:{ORANGE};}}
 .tile .l{{font-size:10px;color:{GREY};text-transform:uppercase;letter-spacing:1px;margin-top:3px;}}
 .good{{color:{GREEN};font-weight:700;}} .warn{{color:{AMBER};font-weight:700;}} .bad{{color:{RED};font-weight:700;}}
 .footer{{margin-top:30px;border-top:3px solid {ORANGE};padding:14px 34px;font-size:10px;color:{GREY};line-height:1.7;}}
 .cochip{{background:{DARK};color:#fff;padding:4px 10px;font-size:11px;font-weight:700;display:inline-block;margin-top:14px;}}
 .subhead{{font-size:11px;font-weight:700;color:{AMBER};margin:10px 0 2px 0;}}
 .chartpanel{{background:#171F2B;border-radius:8px;padding:12px 12px 8px 12px;margin:10px 0 4px 0;max-width:660px;}}
 .chartcap{{font-size:10px;color:{GREY};margin:2px 0 10px 2px;}}
 h2{{break-after:avoid;page-break-after:avoid;}}
 .chartpanel,.tile,.cochip,.subhead{{break-inside:avoid;page-break-inside:avoid;}}
 .chartpanel{{break-before:avoid;page-break-before:avoid;}}
 tr{{break-inside:avoid;page-break-inside:avoid;}}
</style></head><body>
<div class="band"><h1>Coates &nbsp;|&nbsp; Ampol Tool Store</h1>
<div class="sub">{esc(subtitle)}</div>
<div class="meta">Generated {esc(GENERATED)} &nbsp;|&nbsp; Data as at {esc(DATA_ASAT)}</div>
<div class="meta">The Coates Way &nbsp;|&nbsp; POWERED BY SITEIQ &nbsp;|&nbsp; Author: Andrew Fisher</div></div>
<div class="wrap"><!--BODY-START-->{body}
<h2>Our Standard</h2>
<p class="story">{esc(LSR_LINE)} Every issue and every return runs through the double scan
&mdash; {esc(canon)} Daily stocktakes keep eyes on the fleet: nothing in the store goes
over 30 days without being scanned, and anything damaged is tagged Out of Service on the
spot. We are here to help &mdash; if gear is finished with, hand it back to the tool store
and it comes off your list the same day.</p>
<h2>Honest Limits</h2>
<ul style="font-size:11px;color:{GREY};line-height:1.7;">{lim}</ul>
<!--BODY-END--></div>
<div class="footer">Data as at {esc(DATA_ASAT)} |
Coates Hire Operations Pty Limited | ABN 50 009 779 338 | www.coates.com.au |
POWERED BY SITEIQ | Care Deeply &middot; Customer Focused &middot; Be Our Best &middot; One Team &middot; Competitive Spirit</div>
</body></html>"""


def tiles(pairs):
    return ('<div class="tiles">' +
            "".join(f'<div class="tile"><div class="v">{esc(v)}</div>'
                    f'<div class="l">{esc(l)}</div></div>' for v, l in pairs) +
            "</div>")


def table(headers, rows, cls=""):
    h = "".join("<th>" + esc(x) + "</th>" for x in headers)
    b = "".join("<tr>" + "".join("<td>" + (c if str(c).startswith("<span") else esc(c)) +
                                 "</td>" for c in r) + "</tr>" for r in rows)
    tag = f'<table class="{cls}">' if cls else "<table>"
    return f"{tag}<tr>{h}</tr>{b}</table>"


def chart_block(svg, caption=""):
    """A k2shell SVG chart on its dark panel, sized to sit inside the page
    shell (charts are drawn 636px wide; the wrap leaves ~726px, so they fit
    with room to spare).

    WHY (12 Aug 2026): charts are new to this kit - they ride between CHART
    markers so email_html() can strip them, because Outlook's Word engine
    cannot draw SVG. PDF and HTML get the chart; the email keeps its proven
    inline-table style. The tables the charts sit beside are all still there.
    """
    cap = f'<div class="chartcap">{esc(caption)}</div>' if caption else ""
    return f'<!--CHART--><div class="chartpanel">{svg}</div>{cap}<!--/CHART-->'


def item_rows(items, with_company=False, limit=None):
    out = []
    for r in items[:limit] if limit else items:
        row = []
        if with_company:
            row.append(r["company"] or "-")
        row += [r["hirer"] or "-", r["barcode"], r["desc"], fmt_date(r["date"]),
                money(r["cost"]) if r["cost"] is not None else "-"]
        out.append(row)
    return out


ITEM_HDR = ["Hirer", "Barcode", "Description", "On Hire Since", "Replacement"]


def source_limits(d):
    """The as-at lines every page carries - each export's own pull stamp."""
    a = d["asat"]
    tx_bits = "SiteIQ TRANSACTIONS pull " + stamp(a["tx"]["pulled"])
    if a["tx"]["period"]:
        tx_bits += " (report period " + a["tx"]["period"] + ")"
    return [("Data as at: SiteIQ RENTAL_STOCK pull " + stamp(a["stock"]["pulled"])
             + "; " + tx_bits + "; SiteIQ STOCKTAKE pull " + stamp(a["stocktake"]["pulled"])
             + ". Every figure is computed from these exports by this kit - the Excel "
             "workbook is not read for any printed number."),
            "Replacement value is the catalogue new-buy average (Avg Buy Price (New) in "
            "Ampol_ToolStore_Pricing.xlsx); where a description is listed more than once "
            "the first price is used. Unpriced items show a dash and are excluded from "
            "value totals - never estimated."]


def company_block(co, info):
    """One company on a quarter / year page: chip, the people, then any
    shutdown / custody accounts under their own sub-heading."""
    vb = info["vb"]
    body = (f'<div class="cochip">{esc(co)} &mdash; {plural(vb["n"])} | '
            f'{money(vb["value"]) if vb["priced"] else "-"}'
            f'{" (" + str(vb["unpriced"]) + " unpriced)" if vb["unpriced"] else ""}</div>')
    if info["people"]:
        body += table(ITEM_HDR, item_rows(info["people"]))
    if info["accounts"]:
        body += (f'<div class="subhead">Shutdown / custody accounts of {esc(co)} - '
                 f'{plural(len(info["accounts"]))} booked to a project or workflow '
                 f'account, not to an individual</div>')
        body += table(["Account", "Barcode", "Description", "On Hire Since", "Replacement"],
                      item_rows(info["accounts"]))
    return body


def render_quarter(d, qk):
    m = quarter_model(d, qk)
    story = (f"This is the {esc(m['label'])} on-hire position for the Ampol tool store: "
             f"{plural(len(m['rows']))} issued in this window and still out, across "
             f"{m['n_companies']} companies. Gear on hire in this window that has not "
             f"come home is billable at replacement cost at quarter close, and gear no "
             f"longer needed is removed from hire at the same point &mdash; so this list "
             f"is the one to walk before the quarter ticks over. Everything here is easy "
             f"to fix: bring it back to the counter, it is double-scanned off your name "
             f"in seconds, and it disappears from this report the same day. We are not "
             f"chasing blame &mdash; we are helping everyone finish the quarter clean.")
    body = f"<p class='story'>{story}</p>"
    body += tiles([(n_fmt(len(m["rows"])), "Items on hire"), (m["n_companies"], "Companies"),
                   (money(m["total_val"]), "Replacement value"),
                   (f"{m['priced']} / {m['unpriced']}", "Items priced / unpriced")])
    extras = []
    if m["n_accounts"]:
        extras.append(f"{plural(m['n_accounts'])} sit under shutdown / custody accounts "
                      "(listed under their company, not as people)")
    if m["custody"]:
        extras.append(f"{plural(len(m['custody']))} sit in the Repairs custody account "
                      "(internal, listed last, not a customer)")
    if extras:
        body += "<p class='note'>Inside the count: " + "; ".join(extras) + ".</p>"
    if not m["rows"]:
        body += ("<p class='story'>Nothing is on hire from this window"
                 + (" - the quarter has not started." if not quarter_started(qk) else ".")
                 + "</p>")
    for co, info in m["companies"].items():
        body += company_block(co, info)
    if m["custody"]:
        body += "<h2>Internal Custody - Repairs Account (not a customer)</h2>"
        body += ("<p class='note'>Items booked to the Repairs custody account are inside "
                 "the on-hire count above but are Coates' own workflow - tagged, tracked "
                 "and never reissued until right. They are not chased with any company.</p>")
        body += table(["Account", "Barcode", "Description", "On Hire Since", "Replacement"],
                      item_rows(sorted(m["custody"], key=lambda r: (r["date"] or TODAY))))
    limits = ["Counts come straight from the SiteIQ RENTAL_STOCK register: items On Hire "
              f"whose on-hire date falls in {m['label']}. Radios, gas monitors, Drager "
              "equipment, lanyards and steel coil clamps are excluded - they are reported "
              "separately. Items on hire since before 01 Jan " + str(TODAY.year) +
              " are not in this list (see the Executive Summary).",
              "Company names are standardised (CALTEX and AMPOL REFINERIES (QLD) PTY LTD "
              "read as Ampol; CR as Contract Resources). FCCU and SATGAS/MOL accounts are "
              "project accounts of the same customer and are listed separately because "
              "gear is routed by that split.",
              "Descriptions use the corrected name from Tooling_Description_Mapping.xlsx "
              "where one exists for the barcode, or where every mapping row for that "
              "register description agrees on one corrected name; otherwise the register "
              "description.",
              ] + source_limits(d)
    return ("Quarterly On-Hire Report - " + m["label"],
            f"Quarterly On-Hire &amp; Recovery | {esc(m['label'])} | "
            f"{plural(len(m['rows']))} | {money(m['total_val'])}",
            page("Ampol Tooling - " + m["label"], "Quarterly On-Hire Report - "
                 + m["label"], body, limits),
            f"Ampol Tool Store - Quarterly On-Hire Report - {m['label']} - "
            f"{plural(len(m['rows']))}")


def render_company(d, name):
    m = company_model(d, name)
    sd = pct(m["same_day_pct"]) if m["same_day_pct"] is not None else "-"
    story = (f"Thanks for working with the Coates tool store &mdash; here is exactly "
             f"where things stand for <b>{esc(m['name'])}</b>. Your crews have run "
             f"{n_fmt(m['tx_ytd'])} tool store transactions this year, and "
             f"{n_fmt(m['same_day'])} of those came back the same day ({sd}) &mdash; that "
             f"is the habit that keeps gear available for everyone. Right now "
             f"{plural(len(m['items']))} {'are' if len(m['items']) != 1 else 'is'} on hire "
             f"to your team. Anything not needed: hand it in, and it is off your list the "
             f"same day. If it IS needed, perfect &mdash; this list is simply your record "
             f"of where it all is.")
    body = f"<p class='story'>{story}</p>"
    body += tiles([(n_fmt(len(m["items"])), "Items on hire"),
                   (money(m["total_val"]), "Replacement value"),
                   (n_fmt(m["tx_ytd"]), "Transactions YTD"), (sd, "Same-day returns"),
                   (n_fmt(len(m["people"])), "Hirer names using store")])
    qbits = " &nbsp;|&nbsp; ".join(f"{QUARTERS[qk][1]}: <b>{len(m['per_q'][qk])}</b>"
                                   for qk in QUARTERS)
    body += f"<p class='story'>On hire by quarter issued: {qbits}</p>"
    notes = []
    if m["unpriced"]:
        notes.append(f"{m['unpriced']} of the {len(m['items'])} items have no catalogue "
                     "price and are not in the replacement value")
    if m["accounts"]:
        notes.append(f"{n_fmt(m['tx_custody'])} of the transactions and "
                     f"{plural(len(m['account_items']))} on hire are booked to shutdown / "
                     f"custody accounts ({', '.join(m['accounts'][:4])}"
                     f"{', ...' if len(m['accounts']) > 4 else ''}) rather than to a person; "
                     "the hirer-names tile leaves those out")
    if m["related"]:
        rel = "; ".join(f"{r['name']} ({plural(r['on_hire'])} on hire, "
                        f"{n_fmt(r['tx'])} transactions)" for r in m["related"])
        notes.append("Project accounts of the same customer are reported separately "
                     "because gear is routed by that split: " + rel)
    if notes:
        body += "<p class='note'>" + ". ".join(notes) + ".</p>"
    if m["people_items"]:
        body += "<h2>On Hire Now (oldest first)</h2>"
        body += table(ITEM_HDR, item_rows(m["people_items"]))
    if m["account_items"]:
        body += "<h2>Shutdown / Custody Accounts (oldest first)</h2>"
        body += ("<p class='note'>Booked to a project or workflow account, not to an "
                 "individual - the account owner is the contact for these.</p>")
        body += table(["Account", "Barcode", "Description", "On Hire Since", "Replacement"],
                      item_rows(m["account_items"]))
    if m["high_val"]:
        body += "<h2>High-Value Items In Your Care</h2>"
        body += ("<p class='story'>These carry the highest replacement cost - worth a "
                 "quick check they are secure and still needed.</p>")
        body += table(ITEM_HDR, item_rows(m["high_val"]))
    if m["compliance"]:
        body += "<h2>Electrical / Rigging / High-Torque In Your Care</h2>"
        body += ("<p class='story'>Test and tag gear: if it has been out a while, swing "
                 "it past the counter for a quick check - we will make sure the tags are "
                 "current and hand it straight back if you still need it.</p>")
        body += table(ITEM_HDR, item_rows(m["compliance"]))
    limits = ["On-hire lines are the SiteIQ RENTAL_STOCK register (items On Hire with a "
              f"{TODAY.year} on-hire date; radios, gas monitors and Drager equipment "
              "reported separately). Transactions are the SiteIQ CUSTOMER_CONTRACTOR_EQUIP "
              "export for the year to date, matched to this company after standardising "
              "the employer name.",
              "'Hirer names using store' counts distinct hirer names on this year's "
              "transactions, leaving out shutdown / custody / workflow accounts. Names are "
              "as recorded in SiteIQ and are not verified as individuals.",
              ] + source_limits(d)
    return ("Company On-Hire Report - " + m["name"],
            f"Company On-Hire Report | {esc(m['name'])} | {plural(len(m['items']))}",
            page("Ampol Tooling - " + m["name"], "Company On-Hire Report - "
                 + m["name"], body, limits),
            f"Ampol Tool Store - {m['name']} - On-Hire Report - "
            f"{plural(len(m['items']))}")


def render_util(d):
    um = util_model(d)
    buy_priced = [r for r in um["buy"] if r["buy"] is not None]
    buy_spend = sum(r["buy"] for r in buy_priced)
    unpriced_n = len(um["buy"]) - len(buy_priced)
    story = ("Utilisation is measured two ways: <b>live</b> (what share of a group is on "
             "hire right now) and <b>year-to-date</b> (actual hire days against days "
             "available). Groups running hot are where crews wait for gear; groups "
             "running cold are capital sitting still. The buy list below is evidence-"
             "based - every line shows the demand that justifies it. Figures are computed "
             f"from the {stamp(d['asat']['stock']['pulled'])} SiteIQ exports: "
             f"{um['days_elapsed']} days elapsed this year to {fmt_date(um['today'])}.")
    body = f"<p class='story'>{story}</p>"
    body += tiles([(n_fmt(len(um["rows"])), "Equipment groups"),
                   (n_fmt(len(um["buy"])), "Buy signals"),
                   (money(buy_spend) if buy_priced else "-",
                    f"Est. buy spend, 1 each ({len(buy_priced)} of {len(um['buy'])} priced)"),
                   (n_fmt(unpriced_n), "Buy signals unpriced"),
                   (n_fmt(len(um["overstock"])), "Right-size candidates")])
    body += "<h2>What To Buy - Demand-Backed</h2>"
    body += (f"<p class='note'>The spend estimate covers only the {len(buy_priced)} "
             f"priced groups; {unpriced_n} buy signals have no catalogue price yet and "
             "show a dash - they are not $0.</p>")
    rows = []
    for r in um["buy"]:
        rows.append([r["group"], int(r["qty"]), int(r["on_hire"]), int(r["avail"]),
                     pct(r["live"]), pct(r["ytd"]), int(r["hirers"]), int(r["days"]),
                     money(r["buy"]) if r["buy"] is not None else "-",
                     r["source"] or "-", r["rec"]])
    body += table(["Equipment Group", "Qty", "On Hire", "Avail", "Live %", "YTD %",
                   "Hirers", "Hire Days", "Buy Price", "Source", "Recommendation"], rows,
                  cls="tight")
    body += "<h2>Working Hardest (by hire days)</h2>"
    # WHY (12 Aug 2026): the top-used list now gets a bar chart beside it -
    # same numbers the table carries (total hire days YTD), nothing new invented.
    n_with_days = um["groups_with_days"]
    if um["top_used"]:
        body += chart_block(
            k2shell.hbars([(r["group"], int(r["days"])) for r in um["top_used"]],
                          colour=ORANGE),
            f"Total hire days year to date - showing {len(um['top_used'])} of "
            f"{n_with_days} equipment groups with hire days recorded.")
    body += table(["Equipment Group", "Qty", "Live %", "YTD %", "Hire Days", "Hirers"],
                  [[r["group"], int(r["qty"]), pct(r["live"]), pct(r["ytd"]),
                    int(r["days"]), int(r["hirers"])] for r in um["top_used"]])
    if len(um["top_used"]) < n_with_days:
        body += (f"<p class='story'>Showing {len(um['top_used'])} of {n_with_days} "
                 "groups with hire days recorded - the busiest first.</p>")
    body += "<h2>Potential Overstock - Right-Size Candidates</h2>"
    body += table(["Equipment Group", "Qty", "On Hire", "Avail", "YTD %"],
                  [[r["group"], int(r["qty"]), int(r["on_hire"]), int(r["avail"]),
                    pct(r["ytd"])] for r in um["overstock"][:40]])
    if len(um["overstock"]) > 40:
        body += (f"<p class='story'>Showing 40 of {len(um['overstock'])} right-size "
                 "candidates - lowest YTD utilisation first.</p>")
    # WHY (02 Sep 2026): coverage is stated both ways - how much of the
    # mapping is usable, and how much of the year's movement it explains.
    if d.get("mapping_n") is not None:
        share = (um["tx_used"] / um["tx_total"] * 100) if um["tx_total"] else 0
        map_bit = (f"Tooling_Description_Mapping.xlsx has {n_fmt(um['mapping_rows'])} rows; "
                   f"{n_fmt(um['mapping_usable'])} distinct barcodes are usable after the "
                   f"excluded-family filter, and {n_fmt(um['tx_used'])} of "
                   f"{n_fmt(um['tx_total'])} transactions ({share:.1f}%) feed utilisation. "
                   "Coverage grows as descriptions are corrected")
    else:
        map_bit = ("mapping coverage TBC - Tooling_Description_Mapping.xlsx was "
                   "not in the Data folder for this run")
    limits = ["Utilisation is computed by this kit from the SiteIQ TRANSACTIONS and "
              "RENTAL_STOCK exports, grouped by corrected description, using the same "
              "rules as the workbook's Tooling Utilisation query (hire days = distinct "
              "calendar days a barcode was out since 1 Jan; YTD % = hire days / (qty x "
              "days elapsed)). Items without a corrected description are not yet "
              "included - " + map_bit + ".",
              "Radios, gas monitors, Drager equipment, lanyards and steel coil clamps are "
              "excluded here exactly as they are from the on-hire reports - one list for "
              "both.",
              "Buy prices are catalogue averages from Ampol_ToolStore_Pricing.xlsx (first "
              "price where a description is listed more than once); groups without a "
              "price show a dash.",
              ] + source_limits(d)[:1]
    return ("Utilisation & What To Buy",
            f"Utilisation &amp; What-To-Buy | {len(um['buy'])} buy signals",
            page("Ampol Tooling - Utilisation", "Utilisation & What-To-Buy Report",
                 body, limits),
            f"Ampol Tool Store - Utilisation & What-To-Buy - "
            f"{len(um['buy'])} buy signals")


def render_compliance(d):
    cm = compliance_model(d)
    story = ("Electrical, rigging and high-torque gear carries test and inspection "
             "dates. Anything in those families that has not been through our hands "
             f"in {NOT_SIGHTED_DAYS} days is potentially out of test date - not a "
             "problem, just a reason for a five-minute visit to the counter. We check "
             "the tags, and if it is current it goes straight back with you. That is "
             "us doing the compliance work so your crews do not have to think about it.")
    body = f"<p class='story'>{story}</p>"
    body += tiles([(n_fmt(len(cm["chase"])), "Not seen 3+ months"),
                   (n_fmt(len(cm["out_of_tag"])), "Caught & parked (out of tag)"),
                   (n_fmt(len(cm["high_val"])), "High-value items out"),
                   (money(sum(r['cost'] or 0 for r in cm['high_val'])),
                    "High-value exposure")])
    for cat in ("Electrical", "Rigging", "High Torque"):
        items = cm["by_cat"].get(cat, [])
        if not items:
            continue
        body += f"<h2>{esc(cat)} - Not Sighted In {NOT_SIGHTED_DAYS}+ Days</h2>"
        rows = []
        for r in items:
            rows.append([r["company"] or "-", r["hirer"] or "-", r["barcode"], r["desc"],
                         fmt_date(r["seen"]) if r["seen"] else "Never sighted",
                         money(r["cost"]) if r["cost"] is not None else "-"])
        body += table(["Company", "Hirer", "Barcode", "Description", "Last Sighted",
                       "Replacement"], rows)
    if cm["out_of_tag"]:
        body += "<h2>Already Caught - Parked Out Of Tag (our checks working)</h2>"
        body += ("<p class='story'>These items were caught by our checks and parked "
                 "under 'Rigging &amp; 240V - Out Of Tag Date' so they cannot be "
                 "issued. Nothing goes on the shelf unless it is ready for hire.</p>")
        body += table(["Barcode", "Description", "Status"],
                      [[r["barcode"], r["desc"], r["status"] or "-"]
                       for r in cm["out_of_tag"]])
    body += "<h2>High-Value Items On Hire</h2>"
    body += table(["Company", "Hirer", "Barcode", "Description", "On Hire Since",
                   "Replacement"], item_rows(cm["high_val"], with_company=True, limit=40))
    if len(cm["high_val"]) > 40:
        body += (f"<p class='story'>Showing 40 of {len(cm['high_val'])} high-value "
                 "items - highest replacement cost first.</p>")
    if cm["trend"]:
        body += "<h2>Tool Store Activity By Month (transactions)</h2>"
        # WHY (12 Aug 2026): 'Trends' finally gets a trend line - the same
        # monthly transaction counts the table below carries, drawn with the
        # shared K2 chart kit. The table stays; the chart is added beside it.
        period = d["asat"]["tx"]["period"] or "year to date"
        if len(cm["trend"]) >= 2:
            body += chart_block(
                k2shell.line_chart([mth for mth, _ in cm["trend"]],
                                   [{"vals": [n for _, n in cm["trend"]],
                                     "colour": ORANGE, "label": "Transactions",
                                     "fill": True}]),
                f"Tool store transactions per month by SiteIQ start date, export period "
                f"{period}. Every account and family is counted (custody and radio / gas "
                f"movements included); the current month is partial.")
        body += table(["Month", "Transactions"],
                      [[m, f"{n:,}"] for m, n in cm["trend"]])
        body += ("<p class='note'>The current month covers only the days inside the "
                 "export period and is labelled partial - it is not a full month's "
                 "activity.</p>")
    limits = [f"'Not sighted' uses the SiteIQ STOCKTAKE export (last sighted date per "
              f"barcode). An item on hire cannot be sighted in store - which is exactly "
              f"the point: {NOT_SIGHTED_DAYS}+ days out means we have not had hands on "
              f"it to verify tags.",
              "Category matching is by keywords in the register description (electrical "
              "/ rigging / high torque) - anything misfiled, tell us and we correct the "
              "mapping. The corrected name is printed where one exists.",
              "High-value = replacement cost " + money(HIGH_VALUE) + " or more.",
              "The monthly activity counts every transaction in the export - customer "
              "issues and returns plus custody movements (Repairs, Drager) and the radio "
              "/ gas families the on-hire pages leave out.",
              ] + source_limits(d)
    return ("Compliance & Trends",
            f"Compliance &amp; Trends | {len(cm['chase'])} to sight | "
            f"{len(cm['out_of_tag'])} caught",
            page("Ampol Tooling - Compliance", "Compliance & Trends Report", body,
                 limits),
            f"Ampol Tool Store - Compliance & Trends - {len(cm['chase'])} items to "
            f"sight")


def recovery_table(x):
    """Recovery-by-company table from the master list; ties to the on-hire tile."""
    hdrs = ["Company"]
    for qk in QUARTERS:
        hdrs += [QTR_WORD[qk] + " Items", QTR_WORD[qk] + " Value"]
    hdrs += ["Total Items", "Total Value", "Priced / Unpriced"]

    def cells(row):
        out = [row["company"]]
        for qk in QUARTERS:
            vb = row["q"][qk]
            out += [vb["n"], money(vb["value"]) if vb["priced"] else "-"]
        t = row["total"]
        out += [t["n"], money(t["value"]) if t["priced"] else "-",
                f"{t['priced']} / {t['unpriced']}"]
        return out
    rows = [cells(r) for r in x["recovery"]]
    if x["custody_line"]:
        rows.append(cells(x["custody_line"]))
    # totals row, summed from the lines above so it cannot disagree with them
    lines = x["recovery"] + ([x["custody_line"]] if x["custody_line"] else [])
    tot = ["TOTAL"]
    for qk in QUARTERS:
        n = sum(r["q"][qk]["n"] for r in lines)
        v = sum(r["q"][qk]["value"] for r in lines)
        p = sum(r["q"][qk]["priced"] for r in lines)
        tot += [n, money(v) if p else "-"]
    n = sum(r["total"]["n"] for r in lines)
    v = sum(r["total"]["value"] for r in lines)
    p = sum(r["total"]["priced"] for r in lines)
    u = sum(r["total"]["unpriced"] for r in lines)
    tot += [n, money(v) if p else "-", f"{p} / {u}"]
    rows.append(tot)
    return table(hdrs, rows, cls="tight")


def render_exec(d):
    x = exec_model(d)
    sd = pct(x["same_day_pct"]) if x["same_day_pct"] is not None else "-"
    leg = x["legacy"]
    fam_words = {"RADIO": "radios", "DRAGER": "Drager gas monitors", "GAS MONITOR": "gas monitors",
                 "GAS DETECTOR": "gas detectors", "MULTI GAS": "multi-gas monitors",
                 "MULTIGAS": "multi-gas monitors", "LANYARD": "lanyards",
                 "STEEL COIL CLAMP": "steel coil clamps"}
    leg_fams = ", ".join(f"{n_fmt(n)} {fam_words.get(f, f.lower())}"
                         for f, n in sorted(leg["families"].items(), key=lambda kv: -kv[1])
                         if f != "Tooling")
    avail_fams = ", ".join(f"{n_fmt(n)} {fam_words.get(f, f.lower())}"
                           for f, n in sorted(x["available_family"].items(),
                                              key=lambda kv: -kv[1]))
    story = (f"The Ampol tool store is running the Coates Way. {n_fmt(x['on_hire'])} tooling "
             f"items issued since 01 Jan {TODAY.year} are on hire across "
             f"{len(x['companies'])} companies with {money(x['total_val'])} of replacement "
             f"value in the field ({n_fmt(x['unpriced'])} of them unpriced). "
             f"{n_fmt(x['available'])} tooling items are ready on the shelf "
             f"({n_fmt(x['available_all'])} register rows are Available for Hire in all; "
             f"the other {n_fmt(x['available_all'] - x['available'])} are {avail_fams}, "
             f"reported separately) and {n_fmt(x['repairs'])} items sit in the Repairs "
             f"custody account (tagged, tracked, never reissued until right). Crews have "
             f"run {n_fmt(x['tx_ytd'])} transactions this year and {sd} came back same-day "
             f"&mdash; the double scan working exactly as designed. The quarterly "
             f"recovery cycle keeps the fleet honest: gear not returned by quarter "
             f"close is billable at replacement cost, and this report gives every "
             f"company the list to beat before that happens.")
    body = f"<p class='story'>{story}</p>"
    body += tiles([(n_fmt(x["on_hire"]), f"On hire (tooling, {TODAY.year})"),
                   (money(x["total_val"]), "Value out (replacement)"),
                   (n_fmt(x["available"]), "Available for hire (tooling)"),
                   (n_fmt(x["repairs"]), "In Repairs custody (register)"),
                   (n_fmt(x["tx_ytd"]), "Transactions YTD (all accounts)"),
                   (sd, "Same-day returns")])
    body += ("<p class='note'>"
             f"On hire excludes {n_fmt(leg['n'])} register rows on hire since before "
             f"01 Jan {TODAY.year} (oldest {fmt_date(leg['oldest'])}) - "
             + (f"all of them {leg_fams}, chased by the Radio and Gas Monitor reports; "
                "no tooling item on hire pre-dates this year"
                if leg["tooling_n"] == 0 else
                f"{leg_fams}; {n_fmt(leg['tooling_n'])} tooling")
             + f". Inside the {n_fmt(x['on_hire'])}: {n_fmt(x['custody_n'])} in the Repairs "
             f"custody account (internal) and {n_fmt(x['n_accounts'])} booked to shutdown / "
             f"custody accounts of a company rather than to a person. "
             f"Transactions YTD counts every movement in the export: "
             f"{n_fmt(x['tx_custody'])} are custody movements ("
             + ", ".join(f"{co} {n_fmt(n)}" for co, n in sorted(x["tx_by_custody_co"].items()))
             + f" and company custody accounts) and {n_fmt(x['tx_family'])} are radio / gas "
             f"/ lanyard family movements the on-hire pages leave out; "
             f"{n_fmt(x['tx_client_tooling'])} are customer tooling movements. "
             f"Same-day returns are measured on all {n_fmt(x['tx_ytd'])}.</p>")
    body += "<h2>On Hire By Quarter Issued</h2>"
    qrows = []
    for qk in QUARTERS:
        n = x["qcounts"][qk]
        qrows.append([QUARTERS[qk][1],
                      n_fmt(n) + ("" if quarter_started(qk) else " (quarter not started)")])
    qrows.append(["Total", n_fmt(x["on_hire"])])
    body += table(["Quarter", "Items Still On Hire"], qrows)
    if x["recovery"]:
        body += "<h2>Quarterly Recovery Summary (by company)</h2>"
        body += (f"<p class='note'>{len(x['recovery'])} companies"
                 + (" plus the Repairs custody account on its own line" if x["custody_line"] else "")
                 + f"; the TOTAL ties to the {n_fmt(x['on_hire'])} on hire and "
                 f"{money(x['total_val'])} above. Values are replacement (catalogue new-buy "
                 "average); a dash means nothing priced in that cell.</p>")
        # WHY (12 Aug 2026): the recovery table leads with a bar chart -
        # total replacement value by company (top 12, and it says so).
        vals = sorted(((r["company"], r["total"]["value"]) for r in x["recovery"]),
                      key=lambda t: -t[1])
        top12 = [(co, round(v / 1000.0, 1)) for co, v in vals[:12]]
        body += chart_block(
            k2shell.hbars(top12, colour=ORANGE),
            f"Total replacement value by company, in $'000 - showing {len(top12)} of "
            f"{len(vals)} companies, largest first.")
        body += recovery_table(x)
    if leg["n"]:
        body += f"<h2>Legacy On Hire - Before 01 Jan {TODAY.year}</h2>"
        body += (f"<p class='note'>{n_fmt(leg['n'])} register rows are still on hire from "
                 f"{TODAY.year - 3}-{TODAY.year - 1} issues (oldest {fmt_date(leg['oldest'])}). "
                 "They are not in the tooling recovery cycle above because they are "
                 + (leg_fams or "other families") + " - the Radio and Gas Monitor reports "
                 "carry them. Shown here so the recovery story is complete.</p>")
        fams = [f for f in ("RADIO", "DRAGER", "GAS MONITOR") if f in leg["families"]]
        body += table(["Company", "Legacy Items"] + [fam_words[f].capitalize() for f in fams],
                      [[co, n_fmt(c["_n"])] + [n_fmt(c.get(f, 0)) for f in fams]
                       for co, c in leg["top"]])
    # WHY (12 Aug 2026): two pictures drawn only from fields the kit already
    # loads - what families the on-hire gear falls into (the same keyword
    # classifier the compliance report uses) and how long it has been out.
    master = d["master"]
    cats = {"High Torque": 0, "Rigging": 0, "Electrical": 0, "General": 0}
    for r in master:
        cats[r["cat"] or "General"] += 1
    body += "<h2>What Is Out - Category Split</h2>"
    body += chart_block(
        k2shell.hbars(list(cats.items()), colour=ORANGE),
        "Items on hire by description family (High Torque / Rigging / Electrical "
        "keyword match on the register description; General is everything else).")
    age_rows = []
    for lab, lo, hi in (("0-30 days", 0, 30), ("31-60 days", 31, 60),
                        ("61-90 days", 61, 90), ("91-180 days", 91, 180),
                        ("Over 180 days", 181, None)):
        age_rows.append((lab, sum(
            1 for r in master if r["date"]
            and lo <= (TODAY - r["date"]).days
            and (hi is None or (TODAY - r["date"]).days <= hi))))
    undated = sum(1 for r in master if not r["date"])
    if undated:
        age_rows.append(("No on-hire date recorded", undated))
    body += "<h2>On-Hire Ageing Profile</h2>"
    body += chart_block(
        k2shell.hbars(age_rows, colour=ORANGE),
        "How long the current on-hire items have been out - days since their "
        "on-hire date. The quarterly recovery cycle is what brings the long "
        "tail home.")
    body += "<h2>Signals</h2>"
    body += tiles([(n_fmt(x["buy_n"]), "Buy signals (demand-backed)"),
                   (n_fmt(x["overstock_n"]), "Right-size candidates"),
                   (n_fmt(x["chase_n"]), "Test-date sightings due"),
                   (n_fmt(x["out_of_tag_n"]), "Caught & parked out-of-tag"),
                   (money(x["high_val_sum"]), "High-value exposure")])
    body += ("<p class='story'>Detail sits in the companion reports: Quarterly "
             "On-Hire, Utilisation &amp; What-To-Buy, and Compliance &amp; Trends "
             "&mdash; each one client-ready, each one emailable from this kit.</p>")
    limits = ["Every figure is counted from the SiteIQ exports beside this report - never "
              "from a workbook tab or a hardcoded summary cell. On hire = register rows "
              f"On Hire with a {TODAY.year} on-hire date, less radios, gas monitors, "
              "Drager equipment, lanyards and steel coil clamps (reported separately) and "
              "less the tool store's own holding accounts (T&I - Tool store, All-Around - "
              "Repairs, Bulk - Yard, Loading Bay - Out Of Service, Out Of - Calibration, "
              "Rigging & 240V - Out Of Tag Date).",
              "Company names are standardised (CALTEX and AMPOL REFINERIES (QLD) PTY LTD "
              "read as Ampol; CR as Contract Resources). FCCU and SATGAS/MOL accounts are "
              "project accounts of the same customer, kept separate because gear is routed "
              "by that split. Repairs is an internal custody account, never a company.",
              ] + source_limits(d)
    return ("Executive Summary",
            f"Executive Summary | {n_fmt(x['on_hire'])} on hire | {money(x['total_val'])}",
            page("Ampol Tooling - Executive Summary", "Executive Summary", body,
                 limits),
            f"Ampol Tool Store - Executive Summary - {plural(x['on_hire'])} on hire")


# ------------------------------------------------------------------ email ---
def email_html(subtitle, inner_note, html_doc):
    """Outlook-safe like-for-like body: reuse the report body inside a bordered
    680px card. We inline the full report HTML converted to nested-table-safe
    markup by keeping our simple structure (tables + divs render acceptably in
    Outlook's Word engine because all styling is inline-safe)."""
    # extract body content between the marker comments page() now writes
    # WHY (12 Aug 2026): the old wrap/footer regex silently made the WHOLE
    # document the email body the moment page() formatting shifted. The
    # markers survive any styling change; the old regex stays as a fallback
    # so a marker-less document still extracts the same way it always did.
    m = re.search(r"<!--BODY-START-->(.*)<!--BODY-END-->", html_doc, re.S)
    if not m:
        m = re.search(r"<div class=\"wrap\">(.*)</div>\n<div class=\"footer\">",
                      html_doc, re.S)
    inner = m.group(1) if m else html_doc
    # WHY (12 Aug 2026): the new SVG charts do not survive Outlook's Word
    # engine, so they are stripped here - the email keeps the tables that
    # carry the same numbers, exactly as it always has.
    inner = re.sub(r"<!--CHART-->.*?<!--/CHART-->", "", inner, flags=re.S)
    # convert class-styled elements to inline styles for Outlook
    inner = inner.replace('<div class="tiles">',
                          '<div style="margin:12px 0;">')
    inner = inner.replace('<div class="tile">',
                          '<div style="display:inline-block;border:1px solid #e0dad2;'
                          'border-bottom:3px solid ' + ORANGE + ';padding:10px 14px;'
                          'margin:0 6px 6px 0;">')
    inner = inner.replace('<div class="v">',
                          '<div style="font-size:20px;font-weight:800;color:'
                          + ORANGE + ';">')
    inner = inner.replace('<div class="l">',
                          '<div style="font-size:9px;color:' + GREY +
                          ';text-transform:uppercase;letter-spacing:1px;">')
    inner = inner.replace('<p class=\'story\'>',
                          '<p style="font-size:12px;line-height:1.7;color:' + DARK +
                          ';">').replace('<p class="story">',
                          '<p style="font-size:12px;line-height:1.7;color:' + DARK +
                          ';">')
    inner = inner.replace('<p class=\'note\'>',
                          '<p style="font-size:10px;line-height:1.6;color:' + GREY +
                          ';">')
    inner = inner.replace('<div class="subhead">',
                          '<div style="font-size:10px;font-weight:700;color:' + AMBER +
                          ';margin:8px 0 2px 0;">')
    inner = inner.replace('<h2>', '<h2 style="font-size:13px;border-left:5px solid '
                          + ORANGE + ';padding-left:9px;text-transform:uppercase;'
                          'letter-spacing:1px;color:' + DARK + ';margin:22px 0 8px 0;">')
    inner = inner.replace('<table class="tight">', '<table>')
    inner = inner.replace('<table>', '<table cellspacing="0" cellpadding="0" '
                          'width="100%" style="border-collapse:collapse;font-size:10px;'
                          'margin:8px 0;">')
    inner = inner.replace('<th>', '<th style="background:' + DARK + ';color:#fff;'
                          'text-align:left;padding:5px 7px;font-size:9px;'
                          'text-transform:uppercase;">')
    inner = inner.replace('<td>', '<td style="padding:4px 7px;border-bottom:1px solid '
                          '#e5e0da;font-size:10px;color:' + DARK + ';">')
    inner = inner.replace('<div class="cochip">',
                          '<div style="background:' + DARK + ';color:#fff;padding:4px '
                          '10px;font-size:11px;font-weight:700;display:inline-block;'
                          'margin-top:12px;">')
    # WHY (12 Aug 2026): a literal no-op replace('<ul style=', '<ul style=')
    # used to sit here - dead code, removed.
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0"
 style="background:#EFECE7;"><tr><td align="center" style="padding:18px 8px;">
<table role="presentation" width="680" cellspacing="0" cellpadding="0"
 style="width:680px;max-width:680px;background:#ffffff;border:2px solid {DARK};
 border-collapse:collapse;">
<tr><td style="background:{DARK};padding:20px 26px;">
  <div style="font-family:Arial,sans-serif;font-size:22px;font-weight:900;color:#fff;">Coates &nbsp;|&nbsp; Ampol Tool Store</div>
  <div style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:{ORANGE};margin-top:5px;">{subtitle}</div>
  <div style="font-family:Arial,sans-serif;font-size:10px;color:#bbbbbb;margin-top:6px;">Generated {esc(GENERATED)} &nbsp;|&nbsp; Data as at {esc(DATA_ASAT)}</div>
  <div style="font-family:Arial,sans-serif;font-size:10px;color:#bbbbbb;margin-top:3px;">The Coates Way &nbsp;|&nbsp; POWERED BY SITEIQ &nbsp;|&nbsp; Author: Andrew Fisher</div>
</td></tr>
<tr><td style="padding:18px 26px;font-family:Arial,sans-serif;">
  <p style="font-size:11px;color:{GREY};margin:0 0 10px 0;">{inner_note}</p>
  {inner}
</td></tr>
<tr><td style="background:{LIGHT};border-top:3px solid {ORANGE};padding:12px 26px;
 font-family:Arial,sans-serif;font-size:9px;color:{GREY};line-height:1.7;">
 Data as at {esc(DATA_ASAT)} |
 Coates Hire Operations Pty Limited | ABN 50 009 779 338 | www.coates.com.au |
 POWERED BY SITEIQ<br/>Care Deeply &middot; Customer Focused &middot; Be Our Best &middot;
 One Team &middot; Competitive Spirit</td></tr>
</table></td></tr></table>"""


def edge_pdf(html_path, pdf_path):
    import shutil
    import tempfile
    import time
    # WHY (12 Aug 2026): a stale PDF already sitting on the target name used
    # to make a failed print look like a success - clear it first, so the only
    # PDF that can pass the exists-check is the one this run actually wrote.
    if os.path.exists(pdf_path):
        try:
            os.remove(pdf_path)
        except OSError as e:
            sys.exit(f"Cannot replace {os.path.basename(pdf_path)} - close it "
                     f"if it is open, then run again. ({e})")
    # WHY (12 Aug 2026): the fixed Edge paths only exist on Windows, so they
    # stay behind an os.name guard; any Edge/Chrome/Chromium found on PATH is
    # now a candidate too, so the kit prints PDFs on whatever machine runs it.
    candidates = []
    if os.name == "nt":
        candidates += [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                       r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"]
    for name in ("msedge", "chrome", "chromium", "chromium-browser",
                 "google-chrome"):
        p = shutil.which(name)
        if p:
            candidates.append(p)
    # WHY (12 Aug 2026): throwaway profiles used to pile up beside the script
    # when TEMP was unset - they now go to the system temp folder everywhere.
    base_profile = os.path.join(tempfile.gettempdir(), "coates_edge_pdf")
    url = "file:///" + os.path.abspath(html_path).replace("\\", "/").lstrip("/")
    edge_pdf._n = getattr(edge_pdf, "_n", 0) + 1
    for exe in candidates:
        if not os.path.exists(exe):
            continue
        for attempt in range(3):
            profile = f"{base_profile}_{os.getpid()}_{edge_pdf._n}_{attempt}"
            try:
                subprocess.run([exe, "--headless", "--disable-gpu",
                                "--user-data-dir=" + profile,
                                "--no-first-run", "--no-pdf-header-footer",
                                "--print-to-pdf=" + pdf_path, url],
                               timeout=120, capture_output=True)
            except FileNotFoundError:
                break        # not runnable here - on to the next candidate
            except (subprocess.SubprocessError, OSError):
                pass         # retry with a fresh profile
            if os.path.exists(pdf_path):
                return True
            time.sleep(1.5)
        # WHY (12 Aug 2026): the old unconditional return here meant only the
        # first browser found ever got a go - every candidate gets one now.
    return False


def write_eml(eml_path, subject, body_html, attach_path):
    """An X-Unsent .eml beside the manifest - double-click it and Outlook
    opens an editable DRAFT. No To line: Andrew addresses it himself.

    WHY (12 Aug 2026): the kit now ships the .eml as well as the manifest,
    so the drafts flow works even on a machine without the PowerShell step -
    and nothing can ever send itself either way.
    """
    from email.mime.application import MIMEApplication
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    msg = MIMEMultipart("mixed")
    msg["Subject"] = subject
    msg["X-Unsent"] = "1"
    msg.attach(MIMEText(body_html, "html", "utf-8"))
    if attach_path and os.path.exists(attach_path):
        sub = "pdf" if attach_path.lower().endswith(".pdf") else "octet-stream"
        with open(attach_path, "rb") as f:
            part = MIMEApplication(f.read(), _subtype=sub)
        part.add_header("Content-Disposition", "attachment",
                        filename=os.path.basename(attach_path))
        msg.attach(part)
    with open(eml_path, "wb") as f:
        f.write(msg.as_bytes())


def write_outputs(stem, title, subtitle, html_doc, subject):
    os.makedirs(OUT_DIR, exist_ok=True)
    base = os.path.join(OUT_DIR, f"{stem}_{DATESTR}")
    html_path = base + ".html"
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_doc)
    pdf_path = base + ".pdf"
    pdf_ok = edge_pdf(html_path, pdf_path)
    note = ("The full report PDF is attached. This email is the same report, "
            "formatted for reading in place.")
    body = email_html(subtitle, note, html_doc)
    with open(base + ".body.html", "w", encoding="utf-8") as f:
        f.write(body)
    attach = [os.path.basename(pdf_path) if pdf_ok else os.path.basename(html_path)]
    with open(base + ".draft.json", "w", encoding="utf-8") as f:
        json.dump({"subject": subject, "body": os.path.basename(base + ".body.html"),
                   "attachments": attach}, f, indent=1)
    write_eml(base + "_OUTLOOK.eml", subject, body,
              pdf_path if pdf_ok else html_path)
    print(f"  {title}: HTML" + (" + PDF" if pdf_ok else " (PDF skipped)")
          + " + .eml + email draft manifest")
    return base


# ------------------------------------------------------------------- main ---
def company_list(d):
    names = sorted({r["company"] for r in d["master"] if r["company"]})
    return [n for n in names if n.upper() not in INTERNAL_CUSTODY]


def run_quarter(d, qk):
    # WHY (02 Sep 2026): a quarter that has not started used to ship a report
    # and an email saying "0 items" - now it is skipped and the console says so.
    if qk != "YEAR" and not quarter_started(qk):
        start = dt.date(TODAY.year, QUARTERS[qk][2][0], 1)
        print(f"  Quarterly On-Hire Report - {QUARTERS[qk][1]}: quarter not started "
              f"(begins {fmt_date(start)}) - skipped")
        return
    title, subtitle, doc, subject = render_quarter(d, qk)
    write_outputs("Quarterly_OnHire_" + qk, title, subtitle, doc, subject)


def run_company(d, name):
    title, subtitle, doc, subject = render_company(d, name)
    stem = "Company_" + re.sub(r"[^\w]+", "_", name).strip("_")[:40]
    write_outputs(stem, title, subtitle, doc, subject)


def run_util(d):
    title, subtitle, doc, subject = render_util(d)
    write_outputs("Utilisation_WhatToBuy", title, subtitle, doc, subject)


def run_compliance(d):
    title, subtitle, doc, subject = render_compliance(d)
    write_outputs("Compliance_Trends", title, subtitle, doc, subject)


def run_exec(d):
    title, subtitle, doc, subject = render_exec(d)
    write_outputs("Executive_Summary", title, subtitle, doc, subject)


def run_everything(d):
    run_exec(d)
    for q in list(QUARTERS) + ["YEAR"]:
        run_quarter(d, q)
    run_util(d)
    run_compliance(d)
    for n in company_list(d):
        run_company(d, n)


def console_summary(d):
    a = d["asat"]
    print(f"SiteIQ pull (as at) : RENTAL_STOCK {stamp(a['stock']['pulled'])} | "
          f"TRANSACTIONS {stamp(a['tx']['pulled'])}"
          + (f" (period {a['tx']['period']})" if a['tx']['period'] else "")
          + f" | STOCKTAKE {stamp(a['stocktake']['pulled'])}")
    sc = d["status_counts"]
    print(f"Register rows       : {len(d['stock']):,} ("
          + ", ".join(f"{v:,} {k}" for k, v in sorted(sc.items(), key=lambda kv: -kv[1]))
          + ")")
    qc = {qk: sum(1 for r in d["master"] if r["q"] == qk) for qk in QUARTERS}
    cust = sum(1 for r in d["master"] if r["custody"])
    leg = legacy_model(d)
    print(f"On hire (tooling {TODAY.year}) : {len(d['master']):,}  "
          f"(Q1 {qc['Q1']:,} / Q2 {qc['Q2']:,} / Q3 {qc['Q3']:,} / Q4 {qc['Q4']:,}; "
          f"{len(company_list(d))} companies; Repairs custody {cust}; "
          f"legacy pre-{TODAY.year} {leg['n']:,} of which tooling {leg['tooling_n']})")
    vb = value_bits(d["master"])
    print(f"Replacement value   : {money(vb['value'])} over {vb['priced']:,} priced "
          f"({vb['unpriced']} unpriced)")
    cb = sum(1 for r in d["master"] if r["corrected"] == "barcode")
    cd = sum(1 for r in d["master"] if r["corrected"] == "description")
    print(f"Corrected names     : {cb:,} by barcode + {cd:,} by matching description "
          f"of {len(d['master']):,} on-hire lines (mapping: {len(d['corr']):,} barcodes, "
          f"{len(d['corr_by_desc']):,} unambiguous descriptions)")
    print(f"Available for hire  : {d['available_n']:,} tooling of {d['available_all_n']:,} "
          f"register rows | Repairs custody rows {d['repairs_n']}")
    print(f"Transactions YTD    : {len(d['tx']):,}")
    print(f"Stocktake barcodes  : {len(d['stocktake']):,}")
    print(f"Priced descriptions : {len(d['pricing']):,} distinct of {d['pricing_rows']:,} "
          "rows (first price wins)")
    um = d["util"]
    print(f"Utilisation         : {len(um['rows']):,} groups, {len(um['buy'])} buy signals, "
          f"{len(um['overstock'])} right-size, {um['groups_with_days']} with hire days, "
          f"{um['tx_used']:,} of {um['tx_total']:,} transactions mapped, "
          f"{um['days_elapsed']} days elapsed")
    wb = d.get("wb")
    if wb:
        tie = ("ties to the live register" if wb["master_ties"]
               else "DOES NOT tie to the live register - stale, not used")
        util_bit = (f"; Utilisation tab implied refresh {fmt_date(wb['util_refresh'])}"
                    if wb.get("util_refresh") else "")
        print(f"Workbook (info only): file saved {stamp(wb['mtime'])}; Master Onhire tab "
              f"{wb['master_rows'] if wb['master_rows'] is not None else '-'} rows - {tie}"
              f"{util_bit}. No page reads the workbook.")
    else:
        print("Workbook (info only): not in Data - not needed; nothing reads it.")


def main():
    print("=" * 68)
    print("COATES | AMPOL TOOL STORE REPORT KIT | The Coates Way")
    print("=" * 68)
    d = load_all()
    console_summary(d)

    args = [a for a in sys.argv[1:]]
    # WHY (02 Sep 2026): run from a scheduler or a pipe (no keyboard) with no
    # arguments, the menu used to die on EOF and exit red - it now builds
    # everything, which is what every unattended run wants.
    if not args and not sys.stdin.isatty():
        args = ["--everything"]
    if args:
        if "--exec" in args:
            run_exec(d)
        if "--quarter" in args:
            # WHY (12 Aug 2026): --quarter as the last argument used to die
            # with a raw IndexError - now it says what it needs, and exits
            # nonzero so the .bat button shows red, not green.
            i = args.index("--quarter")
            if i + 1 >= len(args):
                sys.exit("--quarter needs a value: Q1, Q2, Q3, Q4, YEAR or ALL.")
            qv = args[i + 1].upper()
            for q in ([k for k in QUARTERS] + ["YEAR"] if qv == "ALL" else [qv]):
                if q not in QUARTERS and q != "YEAR":
                    sys.exit(f"Unknown quarter '{q}' - use Q1, Q2, Q3, Q4, "
                             "YEAR or ALL.")
                run_quarter(d, q)
        if "--utilisation" in args or "--util" in args:
            run_util(d)
        if "--compliance" in args:
            run_compliance(d)
        if "--company" in args:
            i = args.index("--company")
            if i + 1 >= len(args):
                sys.exit("--company needs a company name after it.")
            run_company(d, args[i + 1])
        if "--all" in args:
            for n in company_list(d):
                run_company(d, n)
        if "--everything" in args:
            run_everything(d)
        print("\nDone. Output: Reports\\" + DATESTR + "\\Tooling. Run "
              "08_MAKE_OUTLOOK_DRAFTS.bat to load the emails into Outlook Drafts.")
        return

    companies = company_list(d)
    while True:
        print("\n--- REPORT MENU -------------------------------------------")
        print("  E = Executive Summary          U = Utilisation & What-To-Buy")
        print("  T = Compliance & Trends        Y = Year on-hire report")
        print("  1 = Q1 (Jan-Mar)   2 = Q2 (Apr-Jun)   3 = Q3 (Jul-Sep)   4 = Q4 (Oct-Dec)")
        print("  A = every company report       X = everything")
        print("  Or pick a company:")
        for i, n in enumerate(companies, 1):
            print(f"   C{i:<3} {n}")
        print("  Q = quit")
        choice = input("> ").strip().upper()
        if choice == "Q":
            break
        elif choice == "E":
            run_exec(d)
        elif choice == "U":
            run_util(d)
        elif choice == "T":
            run_compliance(d)
        elif choice == "Y":
            run_quarter(d, "YEAR")
        elif choice in ("1", "2", "3", "4"):
            run_quarter(d, "Q" + choice)
        elif choice == "A":
            for n in companies:
                run_company(d, n)
        elif choice == "X":
            run_everything(d)
        elif choice.startswith("C") and choice[1:].isdigit() \
                and 1 <= int(choice[1:]) <= len(companies):
            run_company(d, companies[int(choice[1:]) - 1])
        else:
            print("  (not recognised)")
        print("\nOutputs in Reports\\" + DATESTR + "\\Tooling. "
              "08_MAKE_OUTLOOK_DRAFTS.bat loads the")
        print("emails into Outlook Drafts - full To search, attachments included.")


if __name__ == "__main__":
    # WHY (12 Aug 2026): the old handler swallowed every error (including
    # SystemExit) and finished with exit code 0, so a failed run looked green
    # to the .bat buttons. Failures now exit nonzero with a plain-English
    # message; the button owns the pause.
    try:
        main()
    except Exception as e:
        print("\nERROR - the tooling report run failed: " + str(e))
        sys.exit(1)
