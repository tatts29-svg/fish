#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | CHECK REPORTS - nothing goes out with a hole in it
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 28 Jul 2026): "i noticed in reports they are missing
#  data". Every headline number on the Cement Australia activity report
#  had printed as the literal text "{v}" - the template placeholder
#  instead of the value. Active hirers, equipment issued, replacement
#  exposure, the whole top of page one. It built without an error, made
#  a PDF, and was one press away from a client's inbox.
#
#  A report that is WRONG never looks broken to the machine that made
#  it. So this reads the finished pages the way a person does - tags
#  stripped, style and script blocks thrown away - and fails on
#  anything that is obviously not for human eyes:
#
#     {v}  {name}  {0}  {total:,.0f}     an unfilled placeholder
#     None  nan  NaN                     a value that never arrived
#     $nan  $None                        money that never arrived
#
#  Run it after a build and before you send. It is the last thing
#  between a template bug and a customer seeing it.
# =====================================================================
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))

#  A brace pair holding a bare identifier or format spec - what a
#  missed .format() leaves behind. Deliberately narrow: real report
#  prose does use braces occasionally, but never like this.
PLACEHOLDER = re.compile(r"\{[A-Za-z_][A-Za-z0-9_]*(?:!\w)?(?::[^{}]{0,20})?\}"
                         r"|\{\d+(?::[^{}]{0,20})?\}")

#  Values that mean "the number never turned up".
DEAD = re.compile(r"(?<![A-Za-z])(?:nan|NaN|None|NULL|undefined)(?![A-Za-z])")
DEAD_MONEY = re.compile(r"\$\s*(?:nan|NaN|None)", re.I)

STRIP = re.compile(r"<(script|style)\b.*?</\1>", re.S | re.I)
TAG = re.compile(r"<[^>]+>")
WS = re.compile(r"[ \t\r\f\v]+")


def visible_text(html):
    """What a person actually reads - no CSS, no JavaScript, no markup.
    A placeholder inside a stylesheet is harmless; one in the text is a
    number that never made it onto the page."""
    s = STRIP.sub(" ", html)
    s = TAG.sub("\n", s)
    s = (s.replace("&nbsp;", " ").replace("&amp;", "&")
          .replace("&mdash;", "-").replace("&middot;", "."))
    return WS.sub(" ", s)


def scan(path):
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            txt = visible_text(f.read())
    except Exception as e:
        return [("unreadable", str(e), 0)]
    hits = []
    for line_no, line in enumerate(txt.split("\n"), 1):
        line = line.strip()
        if not line:
            continue
        for m in PLACEHOLDER.finditer(line):
            hits.append(("placeholder", m.group(0), line_no))
        #  "$nan" is one problem, not two - blank the money match out
        #  before the general sweep so it isn't counted again.
        rest = line
        for m in DEAD_MONEY.finditer(line):
            hits.append(("empty value", m.group(0), line_no))
            rest = rest.replace(m.group(0), " " * len(m.group(0)), 1)
        for m in DEAD.finditer(rest):
            hits.append(("empty value", m.group(0), line_no))
    return hits


def folders():
    """Today's output, wherever the suite put it."""
    out, today = [], time.strftime("%Y-%m-%d")
    for d in (os.path.join(HERE, "Reports", today),
              os.path.join(HERE, "K2 DAILY REPORTING", "01 COMPANY REPORTS"),
              os.path.join(HERE, "K2 DAILY REPORTING", "00 MASTER DAILY REPORTS"),
              os.path.join(HERE, "Gear_Lookup")):
        if os.path.isdir(d):
            out.append(d)
    return out, today


def main():
    print("=" * 70)
    print(" COATES | CHECK REPORTS - nothing goes out with a hole in it")
    print("=" * 70)
    roots, today = folders()
    if not roots:
        print(" Nothing built yet - run 00_RUN_EVERYTHING.bat first.")
        return 1

    only_today = "--all" not in sys.argv
    files, emails = [], []
    for root in roots:
        for dirpath, _dirs, names in os.walk(root):
            for n in names:
                low = n.lower()
                if not low.endswith((".html", ".htm", ".eml")):
                    continue
                p = os.path.join(dirpath, n)
                if only_today and today not in p and today not in n:
                    #  company packs are filed under a dated folder; the
                    #  Reports\<today> tree is already scoped
                    if os.path.join("Reports", today) not in p:
                        continue
                (emails if low.endswith(".eml") else files).append(p)

    if not files:
        print(" No report pages found for {}.".format(today))
        print(" (Add --all to check every report ever built.)")
        return 1

    print(" Checked : {} page(s), {} email draft(s)".format(
        len(files), len(emails)))
    bad, total = {}, 0
    for p in sorted(files):
        h = scan(p)
        if h:
            bad[p] = h
            total += len(h)

    #  An email nobody receives is not a report. The .eml on disk is
    #  already base64-encoded, so its file size IS its wire size - a
    #  draft over the limit here bounces at a corporate gateway AFTER
    #  the send button, which is the worst place to find out. The limit
    #  is the suite's one number (email_images.MAX_EMAIL_MB). 28 Jul 2026.
    try:
        from email_images import MAX_EMAIL_MB
    except Exception:
        MAX_EMAIL_MB = 10.0
    heavy = []
    for p in sorted(emails):
        try:
            mb = os.path.getsize(p) / 1048576.0
        except OSError:
            continue
        if mb > MAX_EMAIL_MB:
            heavy.append((p, mb))

    if not bad and not heavy:
        print("")
        print(" PASS - every number on every page came out filled in, and")
        print(" every email draft is under the {:.0f} MB safe-send limit."
              .format(MAX_EMAIL_MB))
        print(" Safe to send.")
        return 0

    if heavy:
        print("")
        print(" *** {} EMAIL DRAFT(S) TOO HEAVY TO SEND - a corporate mail"
              .format(len(heavy)))
        print(" *** gateway may bounce anything over {:.0f} MB:"
              .format(MAX_EMAIL_MB))
        for p, mb in heavy:
            print("   {:>6.1f} MB  {}".format(mb, os.path.relpath(p, HERE)))
        print("")
        print(" Fix: run 36_RUN_EMAILS_ONLY.bat again - reports too big for")
        print(" the body now go out with the PDF attached instead, which")
        print(" always fits. If one still shows here after that, send me")
        print(" this screen.")
        if not bad:
            return 1

    print("")
    print(" *** {} PROBLEM(S) ON {} PAGE(S) - DO NOT SEND ***"
          .format(total, len(bad)))
    for p in sorted(bad):
        rel = os.path.relpath(p, HERE)
        seen = {}
        for kind, what, _ln in bad[p]:
            seen[(kind, what)] = seen.get((kind, what), 0) + 1
        print("")
        print("   " + rel)
        for (kind, what), n in sorted(seen.items(), key=lambda x: -x[1]):
            print("      {:<12} {:<22} x{}".format(kind, what[:22], n))
    print("")
    print(" An unfilled {placeholder} means a value never reached the page -")
    print(" the report built cleanly and is still wrong. Send me this list.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
