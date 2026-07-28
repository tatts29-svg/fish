#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | IS IT WORKING? - the align watcher
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  The align runs Excel invisibly, so a long refresh and a proper
#  freeze look identical from the outside. This watches Excel's CPU
#  time and memory every few seconds and tells you which one it is:
#
#     WORKING  - Excel is burning CPU. Leave it alone.
#     THINKING - quiet but not long enough to worry. Normal in a
#                big Power Query refresh.
#     STALLED  - no CPU movement for 3 minutes. Something is waiting
#                on a dialog you cannot see, or it is wedged.
#
#  Run me in a SECOND window while the align is going. I only look -
#  I never touch Excel or your files.
# =====================================================================
import subprocess
import sys
import time

STALL_AFTER = 180        # seconds of no CPU movement before we call it
POLL = 5


def excel_snapshot():
    """(count, total cpu seconds, total MB) for every EXCEL.EXE."""
    ps = ("$p = Get-Process EXCEL -ErrorAction SilentlyContinue; "
          "if ($p) { '{0}|{1}|{2}' -f @($p).Count, "
          "(($p | Measure-Object CPU -Sum).Sum), "
          "(($p | Measure-Object WorkingSet64 -Sum).Sum) } else { '0|0|0' }")
    try:
        r = subprocess.run(["powershell", "-NoProfile", "-Command", ps],
                           capture_output=True, text=True, errors="replace",
                           timeout=20)
        n, cpu, mem = (r.stdout or "0|0|0").strip().split("|")
        return int(float(n)), float(cpu or 0), float(mem or 0) / 1048576.0
    except Exception:
        return -1, 0.0, 0.0


def main():
    print("=" * 62)
    print(" COATES | IS IT WORKING?  (watching Excel - Ctrl+C to stop)")
    print("=" * 62)
    print(" Typical align: 3-10 minutes. First run on a new machine can")
    print(" be longer while Power Query sets itself up.")
    print("")
    last_cpu = None
    quiet_since = time.time()
    started = time.time()
    peak = 0.0
    while True:
        n, cpu, mem = excel_snapshot()
        mins = (time.time() - started) / 60.0
        if n == 0:
            print(" [{:4.1f} min] No Excel running - the align has either"
                  " finished or not started.".format(mins))
            return 0
        if n < 0:
            print(" Could not read the process list - is PowerShell blocked?")
            return 1
        peak = max(peak, mem)
        moved = last_cpu is None or cpu > last_cpu + 0.05
        if moved:
            quiet_since = time.time()
        quiet = time.time() - quiet_since
        if moved:
            state = "WORKING  - Excel is busy. Leave it alone."
        elif quiet < STALL_AFTER:
            state = "THINKING - quiet {:.0f}s (normal in a big refresh)".format(quiet)
        else:
            state = "STALLED  - no movement for {:.0f} min".format(quiet / 60.0)
        print(" [{:4.1f} min] {:<52} cpu {:6.1f}s  mem {:5.0f} MB".format(
            mins, state, cpu, mem))
        if quiet >= STALL_AFTER and int(quiet) % 60 < POLL:
            print("")
            print("   It looks stuck. Try, in order:")
            print("    1. Alt-Tab through every window - a hidden Excel")
            print("       dialog is the usual culprit.")
            print("    2. Look in the taskbar for a flashing Excel icon.")
            print("    3. Kill it (Task Manager > EXCEL.EXE > End task) and")
            print("       run 20_ALIGN_EXCEL_VISIBLE.bat instead - that shows")
            print("       Excel on screen so you can answer the prompt.")
            print("   Nothing is lost by killing it: the backup was taken")
            print("   first and no writes happen until after the refresh.")
            print("")
        last_cpu = cpu
        time.sleep(POLL)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n Stopped watching. The align keeps running.")
