#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | MAKE MY QR CARDS - a personal QR sticker for every card
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 28 Jul 2026): "is it possible to have a scan their own
#  number via qr barcode rather than entering their number - without
#  being locked out cause of phone security."
#
#  YES - and without touching the camera inside the browser at all.
#  Each sticker's QR is that person's My Gear link with their ID on
#  the end:   http://<store address>:8123/?id=<their hire ID>
#
#  The worker scans it with their phone's NORMAL CAMERA APP - the same
#  way they scan the Wi-Fi poster. The camera app opens the link, and
#  My Gear opens straight onto THEIR gear. No typing, no camera
#  permission, no https, no "not secure" warning to click through -
#  the page's ?id= door has been there all along, this just prints
#  the keys.
#
#  Stickers come out 21 to an A4 page, sized for Avery L7160 label
#  stock (63.5 x 38.1 mm, 3 across x 7 down) - print on labels and
#  peel, or on paper and cut. Grouped by company so handing them out
#  at prestart is one pass per crew.
#
#  The sheets carry every name and hire ID on site, so they are OFFICE
#  files: they land in QR_Cards\ next to this script and are NEVER
#  written into Gear_Lookup\ (that folder is served to every phone).
#
#  If the store address ever changes, run me again - old stickers
#  point at the old address and stop working, same as the posters.
# =====================================================================
import argparse
import csv
import datetime as dt
import io
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROSTER = os.path.join(HERE, "MY_GEAR_PEOPLE.csv")
OUT_DIR = os.path.join(HERE, "QR_Cards")

#  Avery L7160: 21 labels, 63.5 x 38.1 mm, 3 columns x 7 rows,
#  top margin 15.1 mm, side margins 7.2 mm, no gutter rows, 2.5 mm
#  column gutters. The CSS grid below reproduces that geometry.
PER_PAGE = 21


def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def ask(q, default=""):
    d = " [{}]".format(default) if default else ""
    try:
        return input(" {}{}: ".format(q, d)).strip() or default
    except EOFError:
        return default


def pick_url(cli_url):
    """The address the stickers will point at. Same rule as the posters:
    never guess silently - offer the best guess, let Andrew confirm."""
    if cli_url:
        return cli_url if cli_url.endswith("/") else cli_url + "/"
    guess = ""
    try:
        import net_pick
        ip = net_pick.best_guess()
        if ip:
            guess = "http://{}:8123/".format(ip)
    except Exception:
        pass
    print("")
    print(" The QR on every sticker points at My Gear. The address must be")
    print(" the one on the window poster - the store Wi-Fi address.")
    url = ask("My Gear address", guess or "http://192.168.0.17:8123/")
    if not url.lower().startswith("http"):
        url = "http://" + url
    if not url.endswith("/"):
        url += "/"
    return url


def load_people(company=None, one_id=None):
    """MY_GEAR_PEOPLE.csv - id,name,company, no header. The exact set of
    people who hold a My Gear card, written fresh by every 04 run."""
    if not os.path.isfile(ROSTER):
        print(" Can't find MY_GEAR_PEOPLE.csv in this folder.")
        print(" Run 04_RUN_MY_GEAR.bat first - it writes the card roster,")
        print(" then run me again.")
        sys.exit(1)
    people = []
    with io.open(ROSTER, encoding="utf-8", errors="replace") as f:
        for row in csv.reader(f):
            if len(row) < 3 or not row[0].strip():
                continue
            pid, name, comp = row[0].strip(), row[1].strip(), row[2].strip()
            if one_id and pid != str(one_id).strip():
                continue
            if company and company.lower() not in comp.lower():
                continue
            people.append((pid, name, comp))
    #  By company, then by name - hand a crew their stickers in one pass.
    people.sort(key=lambda p: (p[2].upper(), p[1].upper()))
    return people


def sticker(pid, name, comp, url, qr_svg):
    link = "{}?id={}".format(url, pid)
    return ("<div class='lab'>"
            "<div class='q'>{qr}</div>"
            "<div class='t'><div class='nm'>{nm}</div>"
            "<div class='co'>{co}</div>"
            "<div class='id'>ID {pid}</div>"
            "<div class='how'>Scan with your phone camera<br>"
            "on the Tool Store Wi-Fi</div></div>"
            "</div>").format(qr=qr_svg, nm=esc(name), co=esc(comp),
                             pid=esc(pid), link=esc(link))


def build(people, url, stamp):
    import qr_lite
    pages, page = [], []
    for pid, name, comp in people:
        #  Verified against the page's own door: index.html matches
        #  /[?&]id=(\d{3,})/ and auto-opens. The QR carries the full link.
        svg = qr_lite.qr_svg("{}?id={}".format(url, pid), px=96, quiet=2,
                             dark="#000000")
        page.append(sticker(pid, name, comp, url, svg))
        if len(page) == PER_PAGE:
            pages.append(page)
            page = []
    if page:
        pages.append(page)

    sheets = "".join(
        "<div class='sheet'>{}</div>".format("".join(p)) for p in pages)
    return ("<!DOCTYPE html><html><head><meta charset='utf-8'>"
            "<title>My Gear QR stickers</title><style>"
            "*{box-sizing:border-box;margin:0;padding:0}"
            "body{font-family:Calibri,'Segoe UI',Arial,sans-serif;"
            "background:#fff;color:#101317}"
            "@page{size:A4 portrait;margin:0}"
            ".sheet{width:210mm;height:296mm;padding:15.1mm 7.2mm 0;"
            "display:grid;grid-template-columns:63.5mm 63.5mm 63.5mm;"
            "grid-auto-rows:38.1mm;column-gap:2.5mm;page-break-after:always}"
            ".lab{display:flex;align-items:center;gap:2.5mm;padding:2mm;"
            "overflow:hidden;border:0.2mm dotted #bbb;border-radius:2mm}"
            ".q{flex:none;width:30mm;height:30mm}"
            ".q svg{width:30mm;height:30mm;display:block}"
            ".t{min-width:0}"
            ".nm{font-weight:800;font-size:10.5pt;line-height:1.15;"
            "white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"
            ".co{font-size:7pt;color:#444;white-space:nowrap;overflow:hidden;"
            "text-overflow:ellipsis;text-transform:uppercase;"
            "letter-spacing:0.4px}"
            ".id{font-size:9.5pt;font-weight:800;color:#F26222;margin:1mm 0}"
            ".how{font-size:6.4pt;color:#666;line-height:1.25}"
            "@media print{.lab{border-color:#eee}}"
            "</style></head><body>" + sheets + "</body></html>")


def to_pdf(html_path, pdf_path):
    """Browser print, same as the posters. Failure is not fatal - the
    HTML prints fine straight from a browser."""
    try:
        import browser_engine
        b = browser_engine.find_browser()
    except Exception:
        b = None
    if not b:
        return False
    import subprocess
    import tempfile
    prof = tempfile.mkdtemp(prefix="qrcards_")
    argv = [b, "--headless", "--disable-gpu", "--no-first-run",
            "--user-data-dir=" + prof, "--no-pdf-header-footer",
            "--print-to-pdf=" + os.path.abspath(pdf_path),
            "file:///" + os.path.abspath(html_path).replace("\\", "/")]
    if os.name != "nt":
        argv.insert(1, "--no-sandbox")
    try:
        subprocess.run(argv, capture_output=True, timeout=180)
    except Exception:
        return False
    finally:
        import shutil
        shutil.rmtree(prof, ignore_errors=True)
    return os.path.isfile(pdf_path) and os.path.getsize(pdf_path) > 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", help="My Gear address, e.g. http://192.168.0.17:8123/")
    ap.add_argument("--company", help="only this company (name contains)")
    ap.add_argument("--id", help="one person's sticker only")
    a = ap.parse_args()

    print("=" * 70)
    print(" COATES | MAKE MY QR CARDS - scan your sticker, see your gear")
    print("=" * 70)

    url = pick_url(a.url)
    people = load_people(a.company, a.id)
    if not people:
        print(" Nobody matched. Check the company spelling against")
        print(" MY_GEAR_PEOPLE.csv, or run without filters for everyone.")
        return 1

    os.makedirs(OUT_DIR, exist_ok=True)
    stamp = dt.date.today().strftime("%d %b %Y")
    tagbits = []
    if a.company:
        tagbits.append(a.company.replace(" ", "_"))
    if a.id:
        tagbits.append(str(a.id))
    tag = ("_" + "_".join(tagbits)) if tagbits else ""
    base = "My_Gear_QR_Stickers{}_{}".format(
        tag, dt.date.today().strftime("%Y-%m-%d"))
    html_path = os.path.join(OUT_DIR, base + ".html")
    pdf_path = os.path.join(OUT_DIR, base + ".pdf")

    with io.open(html_path, "w", encoding="utf-8") as f:
        f.write(build(people, url, stamp))
    pdf_ok = to_pdf(html_path, pdf_path)

    pages = (len(people) + PER_PAGE - 1) // PER_PAGE
    print("")
    print(" {} sticker(s) for {} page(s), pointing at {}".format(
        len(people), pages, url))
    print("   " + html_path)
    if pdf_ok:
        print("   " + pdf_path)
    else:
        print("   (no PDF on this machine - open the HTML and print to PDF)")
    print("")
    print(" Print on Avery L7160 label stock (21 per sheet) and peel, or")
    print(" plain paper and cut. Stick one on the back of each hire card.")
    print(" Workers scan it with their normal camera app ON THE TOOL STORE")
    print(" WI-FI and their gear opens - nothing to type.")
    print("")
    print(" These sheets list every name and ID, so they stay in QR_Cards\\")
    print(" - never in Gear_Lookup\\, which is served to every phone.")
    print("")
    print(" If the store address changes: 32_UPDATE_POSTERS.bat for the")
    print(" wall, then me again for the cards.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
