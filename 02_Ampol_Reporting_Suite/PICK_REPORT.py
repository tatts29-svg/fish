#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | PICK A REPORT - just the ones you need
#  Ampol Tool Store (Lytton Refinery)
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (12 Aug 2026): 00_RUN_EVERYTHING builds the whole morning, and
#  most days that is right. But when only the radio count or the gas
#  dashboard is wanted, nobody should have to remember which script
#  does what. So: a numbered list in plain words, type the ones you
#  want, it runs them and nothing else.
#
#  Type several at once - "1 3 5" - and they run in order. Commas are
#  fine too.
# =====================================================================
import os
import subprocess
import sys
import time

import ampol_paths  # WHY (12 Aug 2026): everything runs from the suite root

HERE = ampol_paths.suite_dir()

#  (what it is in Andrew's words, the steps that build it)
#  A step is a python script (plus its flags) run with THIS python -
#  the drafts step is the one exception, a PowerShell script that only
#  makes sense on Windows with Outlook.
DRAFTS = "MAKE_OUTLOOK_DRAFTS.ps1"
REPORTS = [
    ("Gas monitor report - K2-style PDF + email draft",
     [["generate_k2style_gas_monitor_report.py"],
      ["generate_k2style_email.py"]]),
    ("Gas executive dashboard - the V18 email dashboard",
     [["generate_v18_gas_monitor_report.py"]]),
    ("Site radio on-hire report",
     [["build_radio_report.py"]]),
    ("Tooling reports - exec, on-hire register (A-Z), quarterly charges, utilisation, compliance",
     [["build_ampol_tooling_report.py", "--everything"]]),
    ("Stocktake compliance report - client + team + worklist",
     [["build_stocktake_house_style.py"]]),
    ("Calibration register report",
     [["build_calibration_report.py"]]),
    ("Rigging and lifting register report",
     [["build_rigging_report.py"]]),
    ("Outlook drafts - from everything built today",
     [[DRAFTS]]),
    ("Check reports - the last gate before sending",
     [["CHECK_REPORTS.py"]]),
    ("Verify numbers - the truth table (a second count from the exports)",
     [["VERIFY_NUMBERS.py"]]),
]


def ask(q, default=""):
    d = " [{}]".format(default) if default else ""
    try:
        return input(" {}{}: ".format(q, d)).strip() or default
    except EOFError:
        return default


def run_step(step):
    """One step, plain-words when it cannot run. Returns True on OK."""
    script = step[0]
    if script == DRAFTS:
        #  Native Outlook drafts are a Windows-and-Outlook job. On
        #  anything else the .eml files in today's Reports folders are
        #  the drafts - say so instead of failing.
        if os.name != "nt":
            print(" Outlook drafts need Windows with Outlook - skipped on")
            print(" this machine. The .eml files in today's Reports folders")
            print(" are the same drafts: double-click one to open it.")
            return True
        cmd = ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass",
               "-File", os.path.join(HERE, DRAFTS)]
        return subprocess.call(cmd, cwd=HERE) == 0
    path = os.path.join(HERE, script)
    if not os.path.isfile(path):
        print(" ! {} is not in the suite folder - that report cannot run"
              .format(script))
        print("   on this copy. Nothing else is affected.")
        return False
    py = sys.executable or "python"
    return subprocess.call([py, path] + list(step[1:]), cwd=HERE) == 0


def main():
    print("=" * 68)
    print(" COATES | PICK A REPORT - just the ones you need")
    print(" Ampol Tool Store (Lytton Refinery)")
    print("=" * 68)
    print("")
    for i, (label, _steps) in enumerate(REPORTS, 1):
        print("  {:>2}  {}".format(i, label))
    print("")
    print(" Type the number you want. Several is fine - e.g.  1 3 5")
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
    print(" Running: " + ", ".join(c[0] for c in chosen))
    print("")

    started, fails = time.time(), 0
    for label, steps in chosen:
        print("")
        print(" > " + label)
        for step in steps:
            if not run_step(step):
                fails += 1

    mins, secs = divmod(int(time.time() - started), 60)
    print("")
    print("-" * 68)
    print(" Finished in {}m {}s.".format(mins, secs))
    if fails:
        print(" ! {} step(s) reported a problem - read the messages "
              "above.".format(fails))
    print(" Everything lands in Reports\\<today>\\ - one folder per report")
    print(" family. Nothing has been sent - emails are drafts, in Outlook")
    print(" Drafts or as .eml files you open and send yourself.")
    print("")
    print(" Worth running 09_CHECK_REPORTS before sending.")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
