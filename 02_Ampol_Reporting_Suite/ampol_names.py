#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ampol_names - one place for how names are SHOWN across the Ampol suite.
Author: Andrew Fisher | POWERED BY SITEIQ

WHY (02 Sep 2026): SiteIQ still carries the site's former name on
thousands of item descriptions and on one customer account. The site is
Ampol. Every report shows the current name, and the data page of each
report says how many SiteIQ lines still carry the old one - so the
reader sees Ampol everywhere and can still trace a line back to SiteIQ.

Rules (display only - matching, pricing and joins always use the raw
SiteIQ text; barcodes such as CTX011/514 are identifiers and never
change):
  display_desc("CALTEX DRAGER X-AM 5000")  -> "AMPOL DRAGER X-AM 5000"
  display_desc("Caltex Torque Wrench")     -> "Ampol Torque Wrench"
  display_company("CALTEX")                -> "Ampol"
  display_company("AMPOL REFINERIES (QLD) PTY LTD") -> "Ampol"
  display_company("Contract Resources FCCU") -> "Contract Resources"
  account_label("Contract Resources FCCU")   -> "Contract Resources (FCCU project account)"
Standard library only - safe to import from every script.
"""
import re

FORMER_SITE_NAME = "CALTEX"          # the only place the old word is spelt out
CURRENT_SITE_NAME = "AMPOL"

_OLD_RE = re.compile(re.escape(FORMER_SITE_NAME), re.I)
_SUFFIX_RE = re.compile(r"\s+(fccu|satgas/mol|satgas|mol)\s*$", re.I)
_ACRONYMS = {"HIS", "IPS", "CSA", "ARL", "BLJ", "NDE", "UGL", "FCCU", "BMD",
             "AGM", "CR", "TRM", "MOL", "SATGAS", "CXC", "WSP", "IPCQ", "FSACE"}


def _match_case(word, sample):
    if sample.isupper():
        return word.upper()
    if sample.islower():
        return word.lower()
    return word[:1].upper() + word[1:].lower()


# ---------------------------------------------------------------------------
# Names as shown (03 Sep 2026, Andrew): tidy, one style everywhere
# ---------------------------------------------------------------------------
# Descriptions read in sentence case - a capital first letter, lower case
# after - with brands, units, sizes and acronyms protected, so "M18",
# "1/2\"", "UNC", "Milwaukee" and "McGurk" keep their shape. Every gas
# monitor is one name, every radio is one name, and a serial number rides
# in brackets when one is known (from the description itself or the serial
# lists - ampol_serials). People read "First Last"; companies keep the
# one-customer-one-name rule below. Display only, always: matching,
# pricing and joins use the raw SiteIQ text.
GAS_MONITOR_NAME = "Dräger X-am 5000 Gas Monitor"
RADIO_NAME = "Motorola Radio"
RADIO_BATTERY_NAME = "Motorola Radio Battery"
_GAS_RE = re.compile(r"x-?am|gas monitor|gas detector|multi ?gas", re.I)
_NOT_GAS_RE = re.compile(r"charger|probe|pump|calibration gas|dock|cradle|bump|holster|case\b", re.I)
_RADIO_RE = re.compile(r"\bradio\b", re.I)
_RADIO_BATTERY_RE = re.compile(r"batt", re.I)
_NOT_RADIO_RE = re.compile(r"charg|antenna|holster|clip|earpiece|headset|\bmic\b|speaker|harness|case\b|bag\b", re.I)
_GAS_SERIAL_RE = re.compile(r"\b(AR[A-Z]{2}-\d{4})\b", re.I)
_RADIO_SERIAL_RE = re.compile(r"\b(\d{3}[A-Za-z]{3}\d{4})\b")

# words that keep their capitals inside a description (brands, standards,
# threads, electrical, safety) - add to this list, never to the data
PROTECTED_WORDS = {
    # brands
    "Milwaukee", "Motorola", "Dräger", "Hytorc", "Fluke", "Kemppi", "Makita", "Bosch", "DeWalt", "Hilti",
    "Stanley", "Sidchrome", "Kincrome", "Enerpac", "Atlas", "Copco", "Samsung", "Honda", "Stihl",
    "Husqvarna", "Kärcher", "Karcher", "Ridgid", "Lincoln", "Cigweld", "Unimig", "Coates", "Ampol",
    "Icom", "Kenwood", "Garmin", "Apple", "Dell", "Lenovo", "Paslode", "Ramset", "Sika", "Loctite",
    "Rothenberger", "Reed", "Sumner", "Norbar", "Plarad", "Snap-on", "Bahco", "Knipex", "Wera", "Wiha",
    "Irwin", "Fein", "Metabo", "Festool", "Ryobi", "Ozito", "Gerni", "Spitwater", "Yamaha", "Kubota",
    "Perkins", "Deutz", "Genie", "Haulotte", "Manitou", "Merlo", "Hitachi", "Komatsu", "Caterpillar",
    "Bobcat", "Dingo", "Kanga", "Wacker", "Neuson", "Weber", "Belle", "Mikasa", "Dynapac", "Bomag",
    "Dremel", "Panasonic", "Sony", "Uniden", "Honeywell", "Pelican", "Peli", "Teng", "Gearwrench",
    "Proto", "Facom", "Ingersoll", "Rand", "Wilton", "Record", "Tyrolit", "Norton", "Flexovit",
    "Hi-Force", "Torcup", "Rapid", "Critictal", "Rubbish", "Dyson", "Nilfisk", "Makinex", "Trelawny",
    "Hyundai", "Zippo", "Klein", "Greenlee", "Megger", "Kewtech", "Testo", "Extech", "Leica", "Bosch",
    "Powerfix", "Powerlite", "Vevor", "Turbo", "Toolex", "Trojan", "Lufkin", "Stabila", "Starrett",
    "Mitutoyo", "Moore", "Wright", "Facom", "Sealey", "Draper", "Silverline", "Toledo", "Warren",
    "Brown", "Sharpe", "Jet", "Hafco", "Baileigh", "Metaltech", "Weldclass", "Bossweld", "Lincoln",
    "Miller", "Fronius", "Hypertherm", "Thermal", "Dynamics", "Victor", "Harris", "Tesuco", "Bromic",
    "Cavagna", "Comet", "Gardner", "Denver", "Yato", "Elora", "Gedore", "Hazet", "Stahlwille",
    # acronyms, standards, threads, electrical, safety
    "UNC", "UNF", "BSW", "BSP", "BSPT", "BSPP", "NPT", "NPTF", "JIC", "SAE", "ISO", "DIN", "ANSI", "AS",
    "AF", "USB", "LED", "RCD", "PVC", "HDPE", "LPG", "GPO", "ELCB", "AC", "DC", "VAC", "VDC", "HSS",
    "TCT", "SDS", "CFM", "PSI", "RPM", "HP", "KW", "OXY", "ARC", "MIG", "TIG", "MMA", "UHF", "VHF",
    "GPS", "ID", "OD", "HD", "XL", "XXL", "XS", "T&I", "SFI", "FCCU", "OOS", "WLL", "SWL", "PPE", "LOTO",
    "GFCI", "IP", "IP65", "IP67", "ATEX", "IECEx", "EX", "LEL", "H2S", "CO", "O2", "SO2", "NH3", "VOC",
    "PID", "CCTV", "LAN", "WIFI", "Wi-Fi", "HDMI", "VGA", "LCD", "AA", "AAA", "NiMH", "Li-ion", "Li-Ion",
    "SS", "GI", "MS", "CS", "HT", "LH", "RH", "QC", "QR", "PTO", "ROE", "OE", "RE", "PAC", "AMP", "PSU",
    "UPS", "GSM", "RF", "IR", "UV", "LPM", "GPM", "CV", "HV", "LV", "ELV", "MCB", "MCCB", "RCBO", "DOL",
    "VSD", "VFD", "PLC", "HMI", "SCADA", "RTU", "PTFE", "EPDM", "HNBR", "NBR", "FKM", "PU", "PE", "PP",
    "ABS", "GRP", "FRP", "MDF", "CHS", "RHS", "SHS", "UB", "UC", "PFC", "EA", "UA", "SWG", "AWG", "BWG",
    "M", "L", "S",
}
_PROTECT_UP = {w.upper(): w for w in PROTECTED_WORDS}
# spellings SiteIQ uses for a brand, shown one way
_BRAND_FIX = {"DRAGER": "Dräger", "DRAEGER": "Dräger", "DRÄGER": "Dräger", "X-AM": "X-am",
              "DEWALT": "DeWalt", "MCGURK": "McGurk", "KARCHER": "Kärcher", "SNAP-ON": "Snap-on",
              "HI-FORCE": "Hi-Force", "LI-ION": "Li-ion", "NIMH": "NiMH", "IPAD": "iPad", "IPHONE": "iPhone"}
# a unit stuck to a number keeps its proper form
_UNIT_FIX = {"MM": "mm", "CM": "cm", "KG": "kg", "NM": "Nm", "KW": "kW", "HZ": "Hz", "KPA": "kPa",
             "MPA": "MPa", "ML": "mL", "KVA": "kVA", "MAH": "mAh", "AH": "Ah", "LTR": "L", "LT": "L"}
_NUM_UNIT_RE = re.compile(r"^(\d[\d.,/]*)([A-Za-z]+)$")


def _tidy_token(tok, first):
    """One word of a description in sentence case, protected where it
    must be. Brackets and trailing punctuation ride along untouched."""
    lead = ""
    while tok and tok[0] in "([\"'":
        lead += tok[0]
        tok = tok[1:]
    trail = ""
    while tok and tok[-1] in ")]\"',;:":
        trail = tok[-1] + trail
        tok = tok[:-1]
    if not tok:
        return lead + trail
    core = tok
    up = core.upper()
    m = _NUM_UNIT_RE.match(core)
    if up in _BRAND_FIX:
        core = _BRAND_FIX[up]
    elif m and m.group(2).upper() in _UNIT_FIX:
        core = m.group(1) + _UNIT_FIX[m.group(2).upper()]
    elif "-" in core and any(ch.isdigit() for ch in core) and any(ch.isalpha() for ch in core) \
            and not all(any(ch.isdigit() for ch in p) for p in core.split("-")):
        # DRIVE-19MM: a word and a size joined by a hyphen - tidy each side
        core = "-".join(_tidy_token(p, False) for p in core.split("-"))
    elif any(ch.isdigit() for ch in core):
        core = core                                   # sizes and codes as written
    elif up in _PROTECT_UP:
        core = _PROTECT_UP[up]
    elif "&" in core or "/" in core:
        core = "/".join(_tidy_token(p, first) for p in core.split("/")) if "/" in core else core
    elif core[1:] != core[1:].lower() and core[1:] != core[1:].upper():
        core = core                                   # inner capitals: McGurk, iPad, DeWalt
    elif first:
        core = core[:1].upper() + core[1:].lower()
    else:
        core = core.lower()
    return lead + core + trail


def sentence_case(text):
    """'TORQUE WRENCH 1/2" DRIVE 200NM' -> 'Torque wrench 1/2" drive 200Nm';
    'Milwaukee M18 Cordless Impact Wrench' -> 'Milwaukee M18 cordless impact wrench'."""
    s = re.sub(r"\s+", " ", str(text or "").replace("\xa0", " ")).strip()
    if not s:
        return s
    # a word glued to a quote mark or a bracket is two words: 5"ANGLE, FT012(SHORT)
    s = re.sub(r'(["\'])(?=[A-Za-z]{2})', r"\1 ", s)
    s = re.sub(r"([A-Za-z0-9])\((?=[A-Za-z])", r"\1 (", s)
    out, first = [], True
    for tok in s.split(" "):
        t = _tidy_token(tok, first)
        out.append(t)
        if first and any(ch.isalpha() for ch in tok):
            first = False
    s = " ".join(out)
    s = re.sub(r"\s+-\s*|\s*-\s+", " - ", s)         # one dash style; hyphens inside a word stay
    s = re.sub(r"\s+", " ", s).strip(" -")
    return s


def product_name(text):
    """The one name for a gas monitor or a radio, or None for anything
    else (chargers, probes and accessories keep their own description)."""
    s = str(text or "")
    if _GAS_RE.search(s) and not _NOT_GAS_RE.search(s):
        return GAS_MONITOR_NAME
    if _RADIO_RE.search(s) and not _NOT_RADIO_RE.search(s):
        return RADIO_BATTERY_NAME if _RADIO_BATTERY_RE.search(s) else RADIO_NAME
    return None


def serial_in_desc(text):
    """A serial SiteIQ typed into the description, if any."""
    s = str(text or "")
    m = _GAS_SERIAL_RE.search(s) or _RADIO_SERIAL_RE.search(s)
    return m.group(1).upper() if m else ""


def display_desc(text, barcode=None, serial=None):
    """Item description as shown. A gas monitor or radio prints under its
    one name with the serial in brackets when one is known (the serial
    passed in, the one in the description, or the serial lists by
    barcode); everything else reads in sentence case with the former site
    name read as the current one. Nothing else is touched."""
    s = str(text or "")
    if not s:
        return s
    s = _OLD_RE.sub(lambda m: _match_case(CURRENT_SITE_NAME, m.group(0)), s)
    name = product_name(s)
    if name:
        sn = str(serial or "").strip() or serial_in_desc(s)
        if not sn and barcode and name != RADIO_BATTERY_NAME:
            try:
                import ampol_serials
                sn = ampol_serials.serial_for(barcode)
            except Exception:
                sn = ""
        return f"{name} ({sn})" if sn else name
    s = re.sub(r"^\s*ampol\s+", "", s, flags=re.I)   # the site's own prefix is not part of the name
    return sentence_case(s)


def display_person(name):
    """A person as shown: SiteIQ's 'First - Last' reads 'First Last', each
    word capitalised, inner capitals kept (McGurk, O'Connor); anything
    SiteIQ appends after the name (a year, T&I, -Shutdown) stays, tidied.
    A shared booking account goes through hirer_label instead."""
    s = re.sub(r"\s+", " ", str(name or "")).strip()
    if not s:
        return s
    if is_site_account(s):
        return hirer_label(s)
    s = re.sub(r"^(\S+)\s+-\s+", r"\1 ", s, count=1)   # the first dash is SiteIQ's separator
    words = []
    for w in s.split(" "):
        if w.isupper() or w.islower():
            w = "-".join(p[:1].upper() + p[1:].lower() for p in w.split("-"))
            w = "'".join(p[:1].upper() + p[1:] for p in w.split("'")) if "'" in w else w
            w = re.sub(r"^Mc([a-z])", lambda m: "Mc" + m.group(1).upper(), w)   # MCGREGOR -> McGregor
            if w.upper() in ("T&I", "SFI", "FCCU"):
                w = w.upper()
        words.append(w)
    return " ".join(words)


def former_to_current(text):
    """The former site name read as the current one, nothing else touched -
    the MATCHING form. Pricing and mapping keys use this, never the tidy
    display form, so a key never moves when the display rule changes."""
    s = str(text or "")
    return _OLD_RE.sub(lambda m: _match_case(CURRENT_SITE_NAME, m.group(0)), s) if s else s


def carries_former_name(text):
    """True when the raw SiteIQ text still carries the former site name."""
    return bool(_OLD_RE.search(str(text or "")))


def display_company(name):
    """One customer, one name. Project accounts (FCCU, SATGAS/MOL) roll up
    to their parent; the former site account and the refinery legal name
    both read Ampol; acronym companies stay upper-case."""
    s = str(name or "").strip()
    s = _SUFFIX_RE.sub("", s)
    s = re.sub(r"\s+", " ", s).strip(" .")
    u = s.upper()
    if not u:
        return "Unknown"
    if u.startswith(CURRENT_SITE_NAME) or u.startswith(FORMER_SITE_NAME):
        return "Ampol"
    if u.startswith("CONTRACT RESOURCES"):
        return "Contract Resources"
    if u in _ACRONYMS:
        return u
    out = []
    for w in s.split(" "):
        if w.upper() in _ACRONYMS:
            out.append(w.upper())
        elif w.isupper() or w.islower():
            out.append(w[:1].upper() + w[1:].lower())
        else:
            out.append(w)
    return " ".join(out)


def account_label(name):
    """The SiteIQ account under its customer, e.g. 'Wood (FCCU project
    account)' - so a project account is never mistaken for a company."""
    s = str(name or "").strip()
    m = _SUFFIX_RE.search(s)
    parent = display_company(s)
    if m:
        return f"{parent} ({m.group(1).upper()} project account)"
    u = s.upper().strip(" .")
    if u.startswith(FORMER_SITE_NAME):
        return f"{parent} (former site-name account)"
    if u.startswith("AMPOL REFINERIES"):
        return f"{parent} (refinery account)"
    return parent


# ---------------------------------------------------------------------------
# Shared booking accounts (03 Sep 2026)
# ---------------------------------------------------------------------------
# WHY: SiteIQ books gear drawn outside store hours to one account whose
# name reads "AFTER HOURS HIRE - GAS MONITORS & RADIO BATT.". That is the
# name of the ACCOUNT, not of the gear on the row - a gas monitor booked to
# it is still a gas monitor. Printed raw in a "who" column it reads as if
# radio batteries had crept into the gas fleet, so it prints under one
# label on every page. Matching still uses the raw name; the data page of
# a report says which SiteIQ name the label stands for.
AFTER_HOURS_LABEL = "After Hours Hire account"
_AFTER_HOURS_RE = re.compile(r"after\s*-?\s*hours", re.I)
_SITE_ACCOUNT_RE = re.compile(r"after\s*-?\s*hours|tool\s*store|shutdown\s*-\s*20\d\d|\(sfi\)|^alky", re.I)


def is_after_hours_account(name):
    """True for the SiteIQ after-hours booking account, however spelt."""
    return bool(_AFTER_HOURS_RE.search(str(name or "")))


def is_site_account(name):
    """A shared SiteIQ booking account (after-hours, a shutdown or tool
    store account) - never a person."""
    return bool(_SITE_ACCOUNT_RE.search(str(name or "")))


ACCOUNT_SUFFIX = " (account)"


def hirer_label(name):
    """A hirer as printed: the after-hours booking account under its
    label, any other shared booking account (a shutdown, SFI or tool
    store account) as SiteIQ spells it plus " (account)", and a person
    exactly as SiteIQ spells them. One suffix on every page, so a shared
    account is never read as a person."""
    s = str(name or "").strip()
    if is_after_hours_account(s):
        return AFTER_HOURS_LABEL
    if is_site_account(s) and not s.lower().endswith("(account)"):
        return s + ACCOUNT_SUFFIX
    return s


def sort_key(text):
    """Case-insensitive A-Z key that ignores leading punctuation."""
    return re.sub(r"^[^A-Za-z0-9]+", "", str(text or "")).upper()


if __name__ == "__main__":
    for t in ["CALTEX DRAGER X-AM 5000 GAS MONITOR", "Caltex Torque Wrench 1/2D",
              "AMPOL SLING 1 TONNE"]:
        print(f"{t!r:45} -> {display_desc(t)!r}")
    for c in ["CALTEX", "AMPOL REFINERIES (QLD) PTY LTD", "Contract Resources FCCU",
              "Wood SATGAS/MOL", "HIS", "Contract Resources.", "Total Refractory Management"]:
        print(f"{c!r:36} -> {display_company(c)!r:22} {account_label(c)!r}")
    for h in ["AFTER HOURS HIRE - GAS MONITORS & RADIO BATT.", "FCCU - 2026 (SFI)", "Simon - Phillips"]:
        print(f"{h!r:48} -> {hirer_label(h)!r}  site account: {is_site_account(h)}")
    for t in ["AMPOL DRAGER X-AM 5000 GAS MONITOR", "Drager X-am 5000 - T&I -ARSN-0637",
              "Ampol Motorola Radio--Maintenance- 122TYX0140", "AMPOL MOTOROLA RADIO BATTERY",
              "AMPOL DRAGER X-AM 5000 SINGLE CHARGER", 'TORQUE WRENCH 1/2" DRIVE 200NM',
              'Milwaukee M18 Cordless Impact Wrench - 1/2" Drive', "Hytorc Hydraulic Actuator (Stealth 4)",
              "CALTEX SPANNER FLOGGER FLAT 2-3/8 UNC", "Bow Shackle - 2T"]:
        print(f"{t!r:52} -> {display_desc(t)!r}")
    for n in ["Simon - Phillips", "ROBERT - MCGREGOR", "leonard - atterwell", "David - McGurk",
              "Hayden - O'Connor", "Aaron - Broderick-Shutdown", "ANTHONY - DUTTON T&I", "ARDY - DENEHY 2021"]:
        print(f"{n!r:32} -> {display_person(n)!r}")

# ---------------------------------------------------------------------------
# One file-name rule for every report (03 Sep 2026)
# ---------------------------------------------------------------------------
# Coates_Ampol_<Report>_<DDMonYYYY> - the client reads the attachment name
# before a single figure, so every family uses the same shape, with the
# day the pack went out on the end. The as-at time of the pull is printed
# on every page; the day tag is the day the button was pressed, which is
# also the Reports\ folder the file sits in.
from datetime import date as _date

REPORT_STEMS = {
    "gas": "Gas_Monitors",
    "gas_dashboard": "Gas_Monitor_Dashboard",
    "radio": "Radios",
    "exec": "Executive_Summary",
    "onhire": "Tooling_On_Hire",
    "q1": "Quarterly_On_Hire_Q1",
    "q2": "Quarterly_On_Hire_Q2",
    "q3": "Quarterly_On_Hire_Q3",
    "q4": "Quarterly_On_Hire_Q4",
    "year": "Quarterly_On_Hire_Year",
    "util": "Utilisation_What_To_Buy",
    "compliance": "Compliance_Trends",
    "stocktake": "Stocktake_Compliance",
    "stocktake_team": "Stocktake_Team",
    "worklist": "Stocktake_Count_Worklist",
    "calibration": "Calibration_Register",
    "rigging": "Rigging_Register",
    "daily": "Daily_Position",
    "company": "Company_On_Hire",
}


def day_tag(day=None):
    """03Sep2026 - the Australian date with no separators, for file names."""
    return (day or _date.today()).strftime("%d%b%Y")


def report_stem(key, day=None):
    """Coates_Ampol_Tooling_On_Hire_03Sep2026 - add .pdf / .html /
    _OUTLOOK.eml / _PositionCard.png to it. Unknown key = loud failure,
    never a made-up name."""
    return f"Coates_Ampol_{REPORT_STEMS[key.lower()]}_{day_tag(day)}"
