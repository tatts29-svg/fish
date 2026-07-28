#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | WHICH MACHINE IS THIS - name it once, know it forever
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 28 Jul 2026): "lets name, on your system as Andrews
#  Laptop and Work Laptop, so when we work on both we know which one
#  is which."
#
#  Two machines, and chat is the only wire between them. Every time a
#  screen or a file gets sent up, the first question has been "which
#  laptop is this?" - and getting that wrong means advice aimed at the
#  wrong machine. It has already happened.
#
#  So: name it once. This writes MACHINE.txt, which every other tool
#  can read, and which carries the REAL paths on THIS machine - where
#  the suite sits, where Downloads is, where the reports land. Send
#  that one file up and there is nothing left to guess.
#
#  The suite itself does not need any of this - it works out every path
#  relative to its own folder, which is why it runs on both machines
#  with no setup. This is purely so the two of us can tell them apart.
# =====================================================================
import datetime
import os
import shutil
import socket
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
STORE = os.path.join(HERE, "MACHINE.txt")

NAMES = [
    ("Andrews Laptop", "the personal Surface Pro - out of hours"),
    ("Work Laptop", "the Coates site machine - runs the tool store"),
]


def ask(label, default=""):
    d = " [{}]".format(default) if default else ""
    try:
        v = input(" {}{}: ".format(label, d)).strip()
    except EOFError:
        v = ""
    return v or default


def stored_name():
    """Whatever this machine was called last time, or ''."""
    try:
        with open(STORE, encoding="utf-8") as f:
            for line in f:
                if line.lower().startswith("machine"):
                    return line.split(":", 1)[1].strip()
    except Exception:
        pass
    return ""


def downloads():
    """Where the browser actually drops SiteIQ exports. On Windows the
    folder can be moved (OneDrive does it without asking), so ask the
    shell rather than assuming ~\\Downloads - that is the folder
    28_PULL_SITEIQ_EXPORTS.bat looks in, and if it has moved, that is
    worth knowing before we wonder why nothing came in."""
    if os.name == "nt":
        try:
            import winreg
            key = (r"SOFTWARE\Microsoft\Windows\CurrentVersion"
                   r"\Explorer\Shell Folders")
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key) as k:
                p, _ = winreg.QueryValueEx(k, "{374DE290-123F-4565-9164-"
                                              "39C4925E467B}")
                if p:
                    return os.path.expandvars(p)
        except Exception:
            pass
    return os.path.join(os.path.expanduser("~"), "Downloads")


def size_of(path):
    if not os.path.isdir(path):
        return "not there yet"
    n = 0
    for dp, _dn, fs in os.walk(path):
        for f in fs:
            try:
                n += os.path.getsize(os.path.join(dp, f))
            except OSError:
                pass
    if n > 1073741824:
        return "{:,.1f} GB".format(n / 1073741824.0)
    return "{:,.0f} MB".format(n / 1048576.0)


def lines():
    """The whole picture of THIS machine, ready to send up."""
    name = stored_name() or "(not named yet)"
    dl = downloads()
    out = []
    a = out.append
    a("COATES K2 REPORTING SUITE - MACHINE DETAILS")
    a("")
    a("Machine     : {}".format(name))
    a("Recorded    : {}".format(
        datetime.datetime.now().strftime("%d %b %Y - %H:%M")))
    a("")
    a("WINDOWS SAYS")
    a("  Computer  : {}".format(
        os.environ.get("COMPUTERNAME") or socket.gethostname()))
    a("  Signed in : {}".format(
        os.environ.get("USERNAME") or os.environ.get("USER") or "?"))
    a("  Home      : {}".format(os.path.expanduser("~")))
    a("")
    a("WHERE THINGS ARE ON THIS MACHINE")
    a("  Suite     : {}".format(HERE))
    a("  Downloads : {}".format(dl))
    a("              ^ 28_PULL_SITEIQ_EXPORTS.bat reads from here")
    a("  SiteIQ in : {}".format(os.path.join(HERE, "Data_SiteIQ")))
    a("  Reports   : {}   [{}]".format(
        os.path.join(HERE, "Reports"), size_of(os.path.join(HERE, "Reports"))))
    a("  Filed     : {}   [{}]".format(
        os.path.join(HERE, "K2 DAILY REPORTING"),
        size_of(os.path.join(HERE, "K2 DAILY REPORTING"))))
    a("  My Gear   : {}".format(os.path.join(HERE, "Gear_Lookup")))
    a("  Archives  : {}".format(
        os.path.join(HERE, "Updates", "report_archives")))
    a("")
    a("PYTHON")
    a("  Version   : {}".format(sys.version.split()[0]))
    a("  Runs from : {}".format(sys.executable))
    try:
        total, _used, free = shutil.disk_usage(HERE)
        a("")
        a("DISK (the drive the suite is on)")
        a("  Free      : {:,.0f} GB of {:,.0f} GB".format(
            free / 1073741824.0, total / 1073741824.0))
    except Exception:
        pass
    a("")
    a("Send this file up and there is no question which machine it is.")
    return out


def main():
    print("=" * 66)
    print(" COATES | WHICH MACHINE IS THIS")
    print("=" * 66)
    have = stored_name()
    if have:
        print("")
        print(" This machine is recorded as: {}".format(have))
        print("")
        if ask("Change it? y/n", "n").lower() == "y":
            have = ""
    if not have:
        print("")
        print(" Which laptop is this?")
        print("")
        for i, (n, why) in enumerate(NAMES, 1):
            print("   {}  {:<18} {}".format(i, n, why))
        print("")
        pick = ask("Number", "")
        if pick.isdigit() and 1 <= int(pick) <= len(NAMES):
            have = NAMES[int(pick) - 1][0]
        elif pick:
            have = pick
        else:
            print(" Nothing chosen - stopping. Run me again when you know.")
            return 1
        #  Write the name first, then rebuild the file around it, so the
        #  report picks up the name we just set rather than the old one.
        with open(STORE, "w", encoding="utf-8") as f:
            f.write("Machine     : {}\n".format(have))

    body = "\n".join(lines()) + "\n"
    with open(STORE, "w", encoding="utf-8") as f:
        f.write(body)
    print("")
    print("-" * 66)
    print(body)
    print("-" * 66)
    print(" Saved as MACHINE.txt in this folder.")
    print("")
    print(" Do this on BOTH machines, then send both files up. After")
    print(" that nothing has to be worked out from memory.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
