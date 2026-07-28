#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | BROWSER ENGINE - one place that finds the browser
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Three parts of the kit drive a headless browser: the PDFs, the page
#  images pasted into emails, and the cost snapshot. They each used to
#  hunt for the browser themselves, with slightly different lists - so
#  one could find Edge and another find nothing, and you'd end up with
#  an email that had the report in the body but HTML instead of a PDF
#  attached. One list now, used by all three.
#
#  THE ORDER IS DELIBERATE
#  -----------------------
#  Microsoft Edge first, every time. It is on every Coates machine and
#  it is what the packs were designed and proofed against, so nothing
#  about a normal morning run changes. Chrome, then Chromium, then a
#  Playwright-bundled Chromium are fallbacks only - they are what keeps
#  the kit producing real PDFs on a machine without Edge instead of
#  quietly attaching an HTML file to a client email.
#
#  Offline, stdlib only.
# =====================================================================

import os
import glob
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))

_CACHE = []          # resolved once per run: [] unresolved, [None] = none found


def _candidates():
    yield os.path.expandvars(
        r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe")
    yield os.path.expandvars(
        r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe")
    yield shutil.which("msedge")
    yield shutil.which("microsoft-edge")
    yield os.path.expandvars(
        r"%ProgramFiles%\Google\Chrome\Application\chrome.exe")
    yield os.path.expandvars(
        r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe")
    yield shutil.which("google-chrome")
    yield shutil.which("chrome")
    yield shutil.which("chromium")
    yield shutil.which("chromium-browser")


def find_browser():
    """Full path to a headless-capable browser, or None. Cached."""
    if _CACHE:
        return _CACHE[0]
    found = None
    for c in _candidates():
        if c and os.path.isfile(c):
            found = c
            break
    if not found:
        #  A Playwright browser bundle, if this machine has one. Never on
        #  a Coates PC - this is for build servers.
        roots = [os.environ.get("PLAYWRIGHT_BROWSERS_PATH") or "",
                 os.path.expanduser("~/.cache/ms-playwright")]
        pats = ("chromium-*/chrome-linux/chrome", "chromium/chrome-linux/chrome",
                "chromium-*/chrome-mac/Chromium.app/Contents/MacOS/Chromium",
                "chromium-*/chrome-win/chrome.exe")
        for root in roots:
            if not root or not os.path.isdir(root):
                continue
            for pat in pats:
                for h in sorted(glob.glob(os.path.join(root, pat)), reverse=True):
                    if os.path.isfile(h):
                        found = h
                        break
                if found:
                    break
            if found:
                break
    _CACHE.append(found)
    return found


def extra_args():
    """Flags the browser needs on a Linux build server (running as root,
    where the sandbox refuses to start). Empty on Windows, so a Coates
    machine launches exactly as it always has."""
    return [] if os.name == "nt" else ["--no-sandbox"]


def base_args(profile_dir):
    """The common headless launch flags, browser found separately."""
    return ["--headless", "--disable-gpu", "--no-first-run",
            "--user-data-dir={}".format(profile_dir)] + extra_args()


def describe():
    b = find_browser()
    if not b:
        return "no browser found - reports build as HTML, no PDFs"
    return os.path.basename(b) + "  (" + b + ")"


if __name__ == "__main__":
    print("Browser for PDFs and email images: " + describe())
