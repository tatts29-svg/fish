#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
COATES | AMPOL - run a builder for the internal set, then again for the
client set when REPORT_OPTIONS asks for one.
Author: Andrew Fisher | POWERED BY SITEIQ

    python client_pass.py build_ampol_tooling_report.py --everything

runs the builder as normal (the full internal set), and if
Data\\Editable\\REPORT_OPTIONS.txt says client_copy: yes AND names at least
one company to hide, runs it once more with AMPOL_CLIENT_VIEW=1 - the
builder then drops those companies before counting, writes every file
with " - Client" in its name, says so on its data page, and never
touches the scoreboard. The buttons call this wrapper; nothing else
changes on the laptop.
"""
import os
import subprocess
import sys

import ampol_options


def main(argv):
    if not argv:
        print("usage: client_pass.py <script.py> [args]")
        return 2
    py = sys.executable or "python"
    here = os.path.dirname(os.path.abspath(__file__))
    env = dict(os.environ)
    env.pop("AMPOL_CLIENT_VIEW", None)
    rc = subprocess.call([py] + argv, cwd=here, env=env)
    o = ampol_options.load(force=True)
    if o["client_copy"] and o["hide"]:
        print("")
        print("=" * 68)
        print(" CLIENT COPY - the same report without: " + ", ".join(o["hide"]))
        print("=" * 68)
        env["AMPOL_CLIENT_VIEW"] = "1"
        rc2 = subprocess.call([py] + argv, cwd=here, env=env)
        rc = rc or rc2
    elif o["client_copy"] and not o["hide"]:
        print("  (client_copy is yes in REPORT_OPTIONS.txt but no hide_company lines - "
              "the client set would be identical, so only the full set was built)")
    return rc


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
