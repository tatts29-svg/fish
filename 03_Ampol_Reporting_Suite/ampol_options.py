#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
COATES | AMPOL TOOL STORE - report options the client can ask for.
Author: Andrew Fisher | POWERED BY SITEIQ

WHY (06 Nov 2026, client feedback): the client wants the option to leave
particular companies out of the reports they are shown, and an Excel
copy of every report. This module reads ONE plain-text file,

    Data\\Editable\\REPORT_OPTIONS.txt

and every builder asks it two questions: which companies are hidden, and
whether a client copy is wanted. Nothing here changes a count - a hidden
company's rows are dropped BEFORE counting, and every output built with
a hidden company says so on its data page, so a client total is never
mistaken for the store total.

The file (lines starting # are comments; blank lines are ignored):

    # Companies to leave out of the CLIENT copy of every report.
    # One per line, spelt as the reports show them (A to Z names).
    hide_company: Wood
    hide_company: Contract Resources

    # yes = build a second set of every report with those companies
    #       removed, beside the full internal set, with " - Client" in
    #       the file names. no = only the full set is built.
    client_copy: yes

    # yes = the FULL set is also built with the hidden companies removed
    #       (use this when the whole store's reports must leave them out).
    hide_in_internal: no

Matching is forgiving: case, spaces, punctuation and the former site name
are ignored, and a SiteIQ project account rolls up to its parent (the
reports' own one-customer-one-name rule), so "Wood" hides "WOOD" and
"Wood FCCU" alike.
"""
import os
import re

import ampol_paths
import ampol_names

OPTIONS_NAME = "REPORT_OPTIONS.txt"
_CACHE = {}


def options_path():
    for d in ampol_paths.data_dirs():
        p = os.path.join(d, OPTIONS_NAME)
        if os.path.exists(p):
            return p
    return os.path.join(ampol_paths.editable_dir(), OPTIONS_NAME)


def _norm(name):
    """One spelling for a company: the reports' display name, upper case,
    letters and digits only."""
    s = ampol_names.display_company(str(name or ""))
    s = ampol_names.former_to_current(s)
    return re.sub(r"[^A-Z0-9]+", "", s.upper())


def load(force=False):
    """{'hide': [names as typed], 'hide_keys': {normalised}, 'client_copy': bool,
    'hide_in_internal': bool, 'path': str, 'exists': bool}. Read once per run."""
    if _CACHE and not force:
        return _CACHE
    p = options_path()
    if not os.path.exists(p):
        # WHY (06 Nov 2026): the file with its instructions appears on the
        # first run, so an update zip never has to ship (and overwrite) it
        try:
            write_template(p)
        except OSError:
            pass
    out = {"hide": [], "hide_keys": set(), "client_copy": False, "hide_in_internal": False,
           "path": p, "exists": os.path.exists(p)}
    if out["exists"]:
        with open(p, encoding="utf-8-sig") as f:
            for raw in f:
                line = raw.strip()
                if not line or line.startswith("#"):
                    continue
                if ":" not in line:
                    continue
                key, val = line.split(":", 1)
                key, val = key.strip().lower(), val.strip()
                if key in ("hide_company", "hide", "exclude", "exclude_company") and val:
                    out["hide"].append(val)
                    out["hide_keys"].add(_norm(val))
                elif key in ("client_copy", "client"):
                    out["client_copy"] = val.lower() in ("yes", "y", "true", "1", "on")
                elif key in ("hide_in_internal", "hide_everywhere"):
                    out["hide_in_internal"] = val.lower() in ("yes", "y", "true", "1", "on")
    _CACHE.clear()
    _CACHE.update(out)
    return _CACHE


# ---- the switch every builder reads ------------------------------------
# A build is either the internal (full) set or the client set. The driver
# (00 / the family button) sets CLIENT_VIEW=1 in the environment for the
# client pass; a builder asks hidden() and is_hidden() and never looks at
# the environment itself.
def client_view():
    return os.environ.get("AMPOL_CLIENT_VIEW", "").strip() in ("1", "yes", "true")


def active():
    """True when this build drops the hidden companies: the client pass,
    or hide_in_internal on the full pass."""
    o = load()
    return bool(o["hide_keys"]) and (client_view() or o["hide_in_internal"])


def hidden():
    """The companies hidden in THIS build, as typed in the options file
    (empty when nothing is hidden in this build)."""
    return list(load()["hide"]) if active() else []


def is_hidden(company):
    """True when a company (any spelling SiteIQ uses) is hidden in this build."""
    if not active():
        return False
    return _norm(company) in load()["hide_keys"]


def suffix():
    """' - Client' for the client pass's file names, else ''."""
    return " - Client" if client_view() else ""


def disclosure(what="this report"):
    """The sentence every output built without some companies carries on
    its data page, or '' when nothing is hidden."""
    h = hidden()
    if not h:
        return ""
    names = ", ".join(h)
    return (f"Companies left out of {what} at the client's request: {names}. Their items, "
            f"movements and values are not in any figure here; the full internal set carries them.")


def client_line():
    """The short form for footers, covers, cards and email footers:
    'Client copy - companies left out at the client's request', or ''."""
    return "Client copy - companies left out at the client's request" if hidden() else ""


def write_template(path=None):
    """Write the options file with its instructions when none exists."""
    p = path or options_path()
    if os.path.exists(p):
        return p
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write("# COATES | AMPOL - REPORT OPTIONS\n"
                "# Companies to leave out of the CLIENT copy of every report, one per line,\n"
                "# spelt as the reports show them. Lines starting with # are ignored.\n"
                "# hide_company: Example Pty Ltd\n\n"
                "# yes = build a second set of every report with those companies removed,\n"
                "#       beside the full internal set, with \" - Client\" in the file names.\n"
                "client_copy: no\n\n"
                "# yes = the full internal set ALSO leaves them out.\n"
                "hide_in_internal: no\n")
    return p


if __name__ == "__main__":
    o = load()
    print("options file :", o["path"], "(found)" if o["exists"] else "(not present - nothing hidden)")
    print("hide         :", ", ".join(o["hide"]) or "-")
    print("client copy  :", "yes" if o["client_copy"] else "no")
    print("this build   :", "CLIENT view" if client_view() else "internal", "- hidden:", ", ".join(hidden()) or "none")
