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
#
#  "None" is also an ordinary English word, and the suite writes plain
#  English on purpose - "None of it is in any SiteIQ export" is a
#  sentence, not a hole, and on 3 Aug it stamped DO NOT SEND across a
#  page that was perfectly fine. A checker that cries wolf gets ignored,
#  and then it is not checking anything.
#
#  So "None" - and only "None", the one that is also a word - is let
#  through when an English function word follows it. "None of it",
#  "None are tagged": sentences. "None days", "None items", "None" on
#  its own: still a hole, still flagged. nan, NULL and undefined stay
#  strict, because nobody writes those in a sentence.
_PROSE = (r"of|but|and|at|in|on|to|is|are|was|were|will|would|can|could|"
          r"has|have|had|the|that|this|these|those|which|so|since|yet|"
          r"other|were|do|does|did|for|from|by|with|as|if|when|until")
DEAD = re.compile(r"(?<![A-Za-z])(?:nan|NaN|NULL|undefined)(?![A-Za-z])"
                  r"|(?<![A-Za-z])None(?![A-Za-z])(?!\s+(?:" + _PROSE +
                  r")\b)")
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


#  A row that names customer-owned gear, and any dollar figure on it.
#  Andrew's standing rule: tracked and client-owned gear carries NO
#  dollar figure anywhere, not even $0. It is not our gear, so a number
#  beside it is either a charge we are not making or a value we have no
#  business publishing - and the person reading it has no way to tell
#  which. Checked row by row, because a page can be perfectly clean
#  everywhere except the eight lines that matter (3 Aug 2026).
ROW = re.compile(r"<tr\b.*?</tr>", re.S | re.I)
OWNED = re.compile(r"customer\s*owned|client[-\s]*owned", re.I)
MONEY = re.compile(r"\$\s?[0-9][0-9,]*(?:\.[0-9]{2})?")


def scan_owned(path):
    """Dollar figures sitting on customer-owned lines. Raw HTML, not
    visible_text - the table rows have to still be rows."""
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            raw = f.read()
    except Exception:
        return []
    hits = []
    for row in ROW.findall(raw):
        if not OWNED.search(row):
            continue
        for m in MONEY.finditer(row):
            name = " ".join(TAG.sub(" ", row).split())[:60]
            hits.append(("money on customer-owned gear",
                         "{}  on:  {}".format(m.group(0), name), 0))
    return hits


def scan(path):
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            txt = visible_text(f.read())
    except Exception as e:
        return [("unreadable", str(e), 0)]
    hits = scan_owned(path)
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
            #  the money finding needs its whole line - the item it is
            #  sitting on IS the finding, and 22 characters cuts it off
            wide = kind.startswith("money")
            print("      {:<12} {} x{}".format(
                kind, what if wide else "{:<22}".format(what[:22]), n))
    print("")
    #  ADVICE THAT MATCHES WHAT WAS FOUND. One closing line about
    #  placeholders was printed whatever the problem was, so a page
    #  held back for a rate on customer-owned gear was explained as a
    #  missing number - the wrong instruction, confidently given.
    _kinds = set(k for p in bad for k, _w, _l in bad[p])
    if any(k.startswith("money") for k in _kinds):
        print(" A dollar figure on customer-owned gear is not ours to")
        print(" publish - it is not our gear. Take the figure off that")
        print(" line, or take the line off the report, before it goes.")
    if any(k in ("placeholder", "empty value") for k in _kinds):
        print(" An unfilled {placeholder} means a value never reached the")
        print(" page - the report built cleanly and is still wrong.")
    if "unreadable" in _kinds:
        print(" An unreadable page means the file is damaged. Rebuild it.")
    print(" Send me this list.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
