#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | SWITCH JOB - point this computer at a different shutdown
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  One suite, more than one job. This says which one this computer is
#  running. Everything follows it - where the exports are read from,
#  where the reports land, and the customer name on every heading.
#
#  It changes nothing else. K2's reports stay in K2's folders, Weipa's
#  stay in Weipa's. Switching back and forth is safe and instant.
# =====================================================================

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import site_config as sc          # noqa: E402


def show(s, live):
    mark = "  >>" if s.key == live else "    "
    print("{} {:<12} {}".format(mark, s.key, s.header_line))
    exports = ", ".join(os.path.relpath(d, HERE) for d in s.data_dirs(HERE))
    print("      exports from  {}".format(exports))
    print("      reports into  {}".format(s.reports_dirname))
    wb = s.workbook(HERE)
    print("      workbook      {}".format(
        os.path.relpath(wb, HERE) if wb else "(none found yet)"))
    print()


def main(argv):
    known = sc.available(HERE)
    live = sc.live_key(HERE)

    if not known:
        print("No jobs are set up. There should be at least one file in "
              "Sites\\ - put k2.json back and try again.")
        return 1

    print("=" * 64)
    print(" COATES | WHICH JOB IS THIS COMPUTER RUNNING?")
    print("=" * 64)
    for key in sorted(known):
        show(known[key], live)
    print("-" * 64)
    print(" >> is the one that's live now.")
    print()

    want = argv[1].lower().strip() if len(argv) > 1 else ""
    if not want:
        try:
            want = input(" Type the job name to switch to "
                         "(or press Enter to leave it): ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            print()
            want = ""

    if not want:
        print(" Left as it was - still running {}.".format(known[live].name
                                                          if live in known
                                                          else live))
        return 0

    if want == live:
        print(" Already running {}. Nothing to do.".format(known[want].name))
        return 0

    try:
        s = sc.set_live(want, HERE)
    except KeyError as e:
        print(" " + str(e).strip("\"'"))
        return 1

    print("=" * 64)
    print(" NOW RUNNING: {}".format(s.header_line))
    print("=" * 64)
    print(" Exports read from : {}".format(", ".join(
        os.path.relpath(d, HERE) for d in s.data_dirs(HERE))))
    print(" Reports land in   : {}".format(s.reports_dirname))
    print()
    missing = [n for n in (s.exports or [])
               if not any(os.path.isfile(os.path.join(d, n + ".xlsx"))
                          for d in s.data_dirs(HERE))]
    if missing:
        print(" Still to drop in  : {}".format(", ".join(missing)))
        print(" Save those SiteIQ exports into {}".format(
            os.path.relpath(s.data_dirs(HERE)[0], HERE)))
    else:
        print(" Every export this job needs is already in place.")
    print()
    print(" Run 21_CHECK_MY_SETUP.bat next if you want it double-checked.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
