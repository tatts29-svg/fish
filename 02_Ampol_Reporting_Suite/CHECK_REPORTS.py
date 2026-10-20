#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | CHECK REPORTS - nothing goes out with a hole in it
#  Ampol Tool Store (Lytton Refinery)
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (12 Aug 2026): a report that is WRONG never looks broken to the
#  machine that made it. On another site a whole page of headline
#  numbers once printed as the literal text "{v}" - the template
#  placeholder instead of the value - and it built cleanly, made a PDF,
#  and was one press away from a client's inbox. This suite gets the
#  same last gate from day one.
#
#  It reads the finished pages the way a person does - tags stripped,
#  style and script blocks thrown away - and fails on anything that is
#  obviously not for human eyes:
#
#     {v}  {name}  {0}  {total:,.0f}     an unfilled placeholder
#     {money(v)}  {row.qty}  {d['x']}    an f-string that never ran
#     None  nan  NaN                     a value that never arrived
#     $nan  $None                        money that never arrived
#
#  It also weighs every email draft and proves every draft manifest
#  still points at a real body file. Run it after a build and before
#  you send. It is the last thing between a template bug and a
#  customer seeing it.
# =====================================================================
import json
import os
import re
import sys
import time

import ampol_paths  # WHY (12 Aug 2026): one Data area in, dated Reports out

HERE = ampol_paths.suite_dir()

#  A brace pair holding a bare identifier or format spec - what a
#  missed .format() leaves behind. Deliberately narrow: real report
#  prose does use braces occasionally, but never like this.
PLACEHOLDER = re.compile(r"\{[A-Za-z_][A-Za-z0-9_]*(?:!\w)?(?::[^{}]{0,20})?\}"
                         r"|\{\d+(?::[^{}]{0,20})?\}")

#  WHY (12 Aug 2026): the Ampol engines build their pages with
#  f-strings, and a plain string that was MEANT to be an f-string
#  leaves a different kind of litter - {money(v)}, {esc(name)},
#  {row.qty}, {d['key']}. The 12 Aug radio email shipped "{CUR_YEAR}"
#  in a heading for exactly this reason. Still deliberately narrow: an
#  identifier followed by a call, attribute or index chain, nothing
#  looser, so real prose braces stay off the charge sheet.
FSTRING = re.compile(r"\{[A-Za-z_][A-Za-z0-9_]*"
                     r"(?:\.[A-Za-z_][A-Za-z0-9_]*"
                     r"|\[[^\]{}]{1,30}\]"
                     r"|\([^(){}]{0,40}\))+"
                     r"(?::[^{}]{0,20})?\}")

#  Values that mean "the number never turned up".
DEAD = re.compile(r"(?<![A-Za-z])(?:nan|NaN|None|NULL|undefined)(?![A-Za-z])")
DEAD_MONEY = re.compile(r"\$\s*(?:nan|NaN|None)", re.I)

STRIP = re.compile(r"<(script|style)\b.*?</\1>", re.S | re.I)
TAG = re.compile(r"<[^>]+>")
WS = re.compile(r"[ \t\r\f\v]+")

#  WHY (12 Aug 2026): this suite has no email_images module, so the
#  safe-send ceiling lives right here. The .eml on disk is already
#  base64-encoded - its file size IS its wire size - and a corporate
#  mail gateway may bounce anything over 10 MB AFTER the send button,
#  which is the worst place to find out.
MAX_EMAIL_MB = 10.0


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
        for m in FSTRING.finditer(line):
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


def check_manifest(path):
    """A draft manifest that will not draft is a report nobody gets.
    WHY (12 Aug 2026): 08_MAKE_OUTLOOK_DRAFTS reads these blind - if
    the JSON is broken or the body file has gone missing, the draft
    quietly never appears. Catch it here, while there is still time."""
    hits = []
    try:
        with open(path, encoding="utf-8") as f:
            j = json.load(f)
    except Exception as e:
        return [("broken manifest", str(e)[:40], 0)]
    body = j.get("body")
    if not body:
        hits.append(("broken manifest", "no body file named", 0))
    elif not os.path.isfile(os.path.join(os.path.dirname(path), body)):
        hits.append(("body missing", str(body)[:40], 0))
    for a in j.get("attachments") or []:
        if not os.path.isfile(os.path.join(os.path.dirname(path), str(a))):
            hits.append(("attachment missing", str(a)[:40], 0))
    return hits


def folders():
    """Today's output - or every day ever built with --all.
    WHY (12 Aug 2026): this suite has ONE output tree, Reports\\<day>\\,
    one subfolder per report family. Nothing else to hunt through."""
    today = time.strftime("%Y-%m-%d")
    if "--all" in sys.argv:
        root = os.path.join(HERE, "Reports")
    else:
        root = os.path.join(HERE, "Reports", today)
    return ([root] if os.path.isdir(root) else []), today


def main():
    print("=" * 70)
    print(" COATES | CHECK REPORTS - nothing goes out with a hole in it")
    print(" Ampol Tool Store (Lytton Refinery)")
    print("=" * 70)
    roots, today = folders()
    if not roots:
        print(" Nothing built for {} yet - run 00_RUN_EVERYTHING.bat (or one".format(today))
        print(" report button) first. Add --all to check every day ever built.")
        return 1

    files, emails, manifests = [], [], []
    for root in roots:
        for dirpath, _dirs, names in os.walk(root):
            for n in names:
                low = n.lower()
                p = os.path.join(dirpath, n)
                if low.endswith((".html", ".htm")):
                    files.append(p)
                elif low.endswith(".eml"):
                    emails.append(p)
                elif low.endswith(".draft.json"):
                    manifests.append(p)

    if not files:
        print(" No report pages found for {}.".format(today))
        print(" (Add --all to check every report ever built.)")
        return 1

    print(" Checked : {} page(s), {} email draft(s), {} draft manifest(s)"
          .format(len(files), len(emails), len(manifests)))
    bad, total = {}, 0
    for p in sorted(files):
        h = scan(p)
        if h:
            bad[p] = h
            total += len(h)
    for p in sorted(manifests):
        h = check_manifest(p)
        if h:
            bad[p] = bad.get(p, []) + h
            total += len(h)

    #  An email nobody receives is not a report - weigh every draft
    #  against the safe-send ceiling (see MAX_EMAIL_MB above).
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
        print(" PASS - every number on every page came out filled in, every")
        print(" draft manifest points at a real body, and every email draft")
        print(" is under the {:.0f} MB safe-send limit.".format(MAX_EMAIL_MB))
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
        print(" Fix: run that report's button again - a heavy draft usually")
        print(" means an oversized embedded image or attachment. If it still")
        print(" shows here after a rebuild, send me this screen.")
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
            print("      {:<18} {:<28} x{}".format(kind, what[:28], n))
    print("")
    print(" An unfilled {placeholder} means a value never reached the page -")
    print(" the report built cleanly and is still wrong. Send me this list.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
