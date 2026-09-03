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


def display_desc(text):
    """Item description as shown: former site name -> current one,
    case kept (CALTEX -> AMPOL, Caltex -> Ampol). Nothing else touched."""
    s = str(text or "")
    if not s:
        return s
    return _OLD_RE.sub(lambda m: _match_case(CURRENT_SITE_NAME, m.group(0)), s)


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
