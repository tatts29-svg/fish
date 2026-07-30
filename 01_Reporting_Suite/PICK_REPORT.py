#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | PICK A REPORT - just the ones you need
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 28 Jul 2026): "i reckon i just do one by one and ones i
#  need then." Right call. RUN EVERYTHING builds all seventeen packs and
#  the browser work alone is most of the morning - when what he actually
#  wanted was today's hit list.
#
#  The flags to do that already exist. Twenty-three of them, and nobody
#  should have to remember which is which at 5am. So: a numbered list in
#  plain words, type the ones you want, it runs them and nothing else.
#
#  Type several at once - "1 4 9" - and they run in order.
# =====================================================================
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
KIT = "build_company_onhire_report.py"

#  (what it is in Andrew's words, which script, the flag)
REPORTS = [
    ("Daily one-pager - the morning brief",        KIT, "--daily"),
    ("Hit list - gas, radios, Milwaukee, 7-day",   KIT, "--hitlist"),
    ("Every company's on-hire report",             KIT, "--all"),
    ("One company only (it will ask which)",       KIT, "--company"),
    ("Activity & accountability - per hirer",      KIT, "--activity"),
    ("Safety & high-care assurance",               KIT, "--safety"),
    ("Executive summary pack",                     KIT, "--exec"),
    ("Gear return / demob push",                   KIT, "--demob"),
    ("Returns performance",                        KIT, "--returns"),
    ("Site plant - in use v available",            KIT, "--plant"),
    ("Cement store stock & reorder",               KIT, "--store"),
    ("Store consumables watch",                    KIT, "--store-health"),
    ("Site-wide consumables",                      KIT, "--consumables"),
    ("Stocktake scorecard + run sheet",            KIT, "--stocktake"),
    ("Stocktake team report",                      KIT, "--stocktake-team"),
    ("Consumable requests log",                    KIT, "--requests"),
    ("Weekly executive roll-up",                   KIT, "--weekly"),
    ("Plant utilisation & right-size",             KIT, "--rightsize"),
    ("End-of-shut close-out",                      KIT, "--closeout"),
    ("Gear lookup page (the QR at the window)",    KIT, "--lookup"),
    ("Cost tracking snapshot",        "build_cost_snapshot.py", ""),
    ("Invoice breakdown - what the SiteIQ invoice is made of",
                                      "build_invoice_breakdown.py", ""),
    ("My Gear - personal scorecards",  "BUILD_MY_GEAR.py",      ""),
]


def ask(q, default=""):
    d = " [{}]".format(default) if default else ""
    try:
        return input(" {}{}: ".format(q, d)).strip() or default
    except EOFError:
        return default


def main():
    print("=" * 68)
    print(" COATES | PICK A REPORT - just the ones you need")
    print("=" * 68)
    print("")
    for i, (label, _s, _f) in enumerate(REPORTS, 1):
        print("  {:>2}  {}".format(i, label))
    print("")
    print(" Type the number you want. Several is fine - e.g.  1 2 5")
    picks = (" ".join(sys.argv[1:]) or ask("Number(s)")).replace(",", " ").split()
    chosen = []
    for p in picks:
        if p.isdigit() and 1 <= int(p) <= len(REPORTS):
            chosen.append(REPORTS[int(p) - 1])
        else:
            print(" ! Ignoring '{}' - not one of the numbers.".format(p))
    if not chosen:
        print(" Nothing picked. Nothing run.")
        return 0

    print("")
    print(" Emails only, or the pages and PDFs on file as well?")
    print("   1  Emails only        - fastest, nothing else written")
    print("   2  Everything on file - pages + print PDFs as well")
    only = ask("Which", "1") == "1"

    print("")
    print(" Running: " + ", ".join(c[0] for c in chosen))
    if only:
        print(" Mode   : emails only")
    print("")

    #  Same script, several flags - one run does the lot and shares the
    #  data load, which is most of the cost. Anything on its own script
    #  runs after.
    kit_flags = [f for (_l, s, f) in chosen if s == KIT and f and f != "--company"]
    others = [(l, s) for (l, s, f) in chosen if s != KIT]
    want_one = any(f == "--company" for (_l, s, f) in chosen if s == KIT)

    py = sys.executable or "python"
    started, fails = time.time(), 0

    if want_one:
        name = ask("Which company (exactly as it appears on the report)")
        if name:
            kit_flags += ["--company", name]

    if kit_flags:
        cmd = [py, os.path.join(HERE, KIT)] + kit_flags
        if only:
            cmd.append("--email-only")
        print(" > " + " ".join(kit_flags))
        if subprocess.call(cmd, cwd=HERE) != 0:
            fails += 1

    for label, script in others:
        print("")
        print(" > " + label)
        if subprocess.call([py, os.path.join(HERE, script)], cwd=HERE) != 0:
            fails += 1

    mins, secs = divmod(int(time.time() - started), 60)
    print("")
    print("-" * 68)
    print(" Finished in {}m {}s.".format(mins, secs))
    if fails:
        print(" ! {} report(s) reported a problem - read the messages "
              "above.".format(fails))
    print(" Emails are in Reports\\<today>\\Emails and in your Outlook")
    print(" Drafts. Nothing has been sent.")
    print("")
    print(" Worth running 35_CHECK_REPORTS.bat before you send.")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
