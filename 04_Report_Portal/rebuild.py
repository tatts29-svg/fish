#!/usr/bin/env python3
"""Rebuild the report from freshly uploaded SiteIQ exports.
Author: Andrew Fisher | POWERED BY SITEIQ.

    python rebuild.py JOB_DIR DATA_DIR

JOB_DIR is the job pack a Manager loaded once (never in git):

    job.json          {"paths": {...}, "options": {...}}  the report builder's settings
    kit/              JOB.txt, the alias files, _fonts, Data_SiteIQ/
    incoming/         the exports just uploaded, any file names
    ...               the reference files, pictures and workbooks job.json points at

The exports in incoming/ are recognised by what is inside them, not by their
names. Nothing in DATA_DIR changes unless the whole build works: the report,
the on-hire Excel and both PDFs are swapped in together at the end.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
KIT_CODE = os.environ.get("KIT_CODE") or os.path.join(os.path.dirname(HERE), "02_Onhire_Report_Kit")
KINDS = ("RENTAL_STOCK", "SALES_STOCK", "TRANSACTIONS", "STOCKTAKE", "ON_HIRE")
NEEDED = ("RENTAL_STOCK", "SALES_STOCK", "TRANSACTIONS")
SHEET = {"TRANSACTIONS": "TRANSACTION_CHARGES"}       # the sheet that marks each export, where it is not the export's own name


class Stop(Exception):
    """A problem to show the person who uploaded, in plain words."""


def kind_of(path):
    """Which SiteIQ export a workbook is, from its sheet names; None if it is not one."""
    try:
        with zipfile.ZipFile(path) as z:
            book = z.read("xl/workbook.xml").decode("utf-8", "replace").upper()
    except Exception:
        return None
    for k in KINDS:
        if 'NAME="{}"'.format(SHEET.get(k, k)) in book:
            return k
    return None


def sort_incoming(job):
    """Move the uploaded exports into the kit's Data_SiteIQ folder. Returns {kind: original name}."""
    inc = os.path.join(job, "incoming")
    got, unknown = {}, []
    for name in sorted(os.listdir(inc)) if os.path.isdir(inc) else []:
        path = os.path.join(inc, name)
        k = kind_of(path)
        if k is None:
            unknown.append(name)
        elif k in got:
            raise Stop("Two {} files were uploaded. Upload one of each, from the same pull.".format(k.replace("_", " ")))
        else:
            got[k] = path
    if unknown:
        raise Stop("Not a SiteIQ export: {}. Nothing was changed.".format(", ".join(n.split("__", 1)[-1] for n in unknown)))
    missing = [k.replace("_", " ") for k in NEEDED if k not in got]
    if missing:
        raise Stop("Still needed from the same pull: {}. Nothing was changed.".format(", ".join(missing)))
    data = os.path.join(job, "kit", "Data_SiteIQ")
    os.makedirs(data, exist_ok=True)
    for k, path in got.items():
        shutil.copyfile(path, os.path.join(data, k + ".xlsx"))
    return {k: os.path.basename(p).split("__", 1)[-1] for k, p in got.items()}


def build(job, out):
    with open(os.path.join(job, "job.json"), encoding="utf-8") as f:
        spec = json.load(f)
    cmd = [sys.executable, os.path.join(KIT_CODE, "build_showcase.py"), os.path.join(job, "kit"), os.path.join(out, "report.html"),
           "--onhire-out", os.path.join(out, "onhire")]
    for flag, rel in sorted(spec.get("paths", {}).items()):
        cmd += ["--" + flag, os.path.join(job, rel)]
    for flag, value in sorted(spec.get("options", {}).items()):
        cmd += ["--" + flag, str(value)]
    run = subprocess.run(cmd, cwd=KIT_CODE, capture_output=True, text=True, timeout=600)
    if run.returncode or not os.path.isfile(os.path.join(out, "report.html")):
        tail = (run.stderr or run.stdout or "").strip().splitlines()[-6:]
        raise Stop("The report could not be built from these files. Nothing was changed.\n" + "\n".join(tail))
    return run.stdout.strip().splitlines()[-1] if run.stdout.strip() else ""


def pdfs(out):
    from playwright.sync_api import sync_playwright
    page_url = "file://" + os.path.join(out, "report.html")
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--no-sandbox"])
        pg = b.new_page(viewport={"width": 1280, "height": 900})
        pg.goto(page_url + "?static")
        pg.wait_for_timeout(1000)
        asat = pg.eval_on_selector("#asat", "x => x.textContent")
        title = pg.title()
        foot = ('<div style="width:100%;font-family:Arial,sans-serif;font-size:7.5px;color:#5A6472;padding:0 9mm;display:flex;justify-content:space-between">'
                '<span>Author: Andrew Fisher | POWERED BY SITEIQ</span><span>{} · SiteIQ pull {}</span>'
                '<span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>').format(title, asat)
        pg.pdf(path=os.path.join(out, "report.pdf"), format="A4", landscape=True, print_background=True, scale=0.64,
               display_header_footer=True, header_template="<span></span>", footer_template=foot,
               margin={"top": "9mm", "bottom": "13mm", "left": "8mm", "right": "8mm"})
        q = b.new_page(viewport={"width": 1000, "height": 1300})
        q.goto(page_url + "?static&ohreport")
        q.wait_for_timeout(900)
        q.pdf(path=os.path.join(out, "onhire.pdf"), print_background=True, prefer_css_page_size=True)
        b.close()
    return asat


def main(job, data_dir):
    hist = None
    try:
        with open(os.path.join(job, "job.json"), encoding="utf-8") as f:
            hist = json.load(f).get("paths", {}).get("history")
    except (OSError, ValueError):
        raise Stop("The job pack is not loaded yet. Ask the Manager to load it.")
    hist = os.path.join(job, hist) if hist else None
    keep = open(hist, "rb").read() if hist and os.path.isfile(hist) else None
    out = tempfile.mkdtemp(dir=data_dir, prefix=".build-")
    try:
        files = sort_incoming(job)
        build(job, out)
        made = os.environ.get("REBUILD_SKIP_PDF") != "1"
        if made:
            pdfs(out)
        with open(os.path.join(out, "report.html"), encoding="utf-8") as f:
            m = re.search(r'"asat": "([^"]+)"', f.read())
        asat = m.group(1) if m else ""
        ready = [("report.html", os.path.join(out, "report.html")), ("onhire.xlsx", os.path.join(out, "onhire", "onhire.xlsx"))]
        if made:
            ready += [("report.pdf", os.path.join(out, "report.pdf")), ("onhire.pdf", os.path.join(out, "onhire.pdf"))]
        for name, path in ready:
            if not os.path.isfile(path) or os.path.getsize(path) < 1000:
                raise Stop("The build did not finish ({} is missing). Nothing was changed.".format(name))
        for name, path in ready:
            os.replace(path, os.path.join(data_dir, name))
        print(json.dumps({"ok": True, "pull": asat, "files": files}))
        return 0
    except Exception as e:
        if hist and keep is not None:            # a failed build leaves no mark on the trend
            with open(hist, "wb") as f:
                f.write(keep)
        msg = str(e) if isinstance(e, Stop) else "The build stopped: {}. Nothing was changed.".format(e.__class__.__name__ + ": " + str(e)[:300])
        print(json.dumps({"ok": False, "message": msg}))
        return 1
    finally:
        shutil.rmtree(out, ignore_errors=True)
        shutil.rmtree(os.path.join(job, "incoming"), ignore_errors=True)


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1], sys.argv[2]))
    except Stop as e:
        print(json.dumps({"ok": False, "message": str(e)}))
        sys.exit(1)
