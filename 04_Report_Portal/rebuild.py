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
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

from upload_policy import check_workbook, is_mmg, MMG_SCHEDULE
from stocktake_store import all_entries, published_report, QUEENSLAND
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
KIT_CODE = os.environ.get("KIT_CODE") or os.path.join(os.path.dirname(HERE), "02_Onhire_Report_Kit")
sys.path.insert(0, KIT_CODE)
from variant_history import rental_snapshot, requested_time

MMG_DAILY_KINDS = ("RENTAL_STOCK", "SALES_STOCK", "TRANSACTIONS", "STOCKTAKE")
KINDS = MMG_DAILY_KINDS + ("ON_HIRE",)
NEEDED = ("RENTAL_STOCK", "SALES_STOCK", "TRANSACTIONS")
SHEET = {"TRANSACTIONS": "TRANSACTION_CHARGES"}       # the sheet that marks each export, where it is not the export's own name


class Stop(Exception):
    """A problem to show the person who uploaded, in plain words."""


def _sheet_names(source):
    try:
        with zipfile.ZipFile(source) as archive:
            xml = ET.fromstring(archive.read("xl/workbook.xml"))
        return {sheet.get("name", "").strip().upper() for sheet in xml.findall("./{*}sheets/{*}sheet")}
    except (ET.ParseError, zipfile.BadZipFile, OSError, KeyError, ValueError):
        return set()


def kind_of(path):
    """Identify an export using its workbook, independent of the filename."""
    names = _sheet_names(path)
    return next((kind for kind in KINDS if SHEET.get(kind, kind) in names), None)


def mmg_daily_kind(source, filename):
    """Only four primary exports feed the MMG report. On hire is a generated output."""
    normal = re.sub(r"[ _-]+", "_", os.path.basename(filename).upper())
    names = _sheet_names(source)
    # Check the on-hire marker independently so an extra allowed sheet cannot mask it.
    if (normal.startswith(("ON_HIRE", "ONHIRE")) or
            any(re.sub(r"[ _-]+", "", name) == "ONHIRE" for name in names)):
        raise Stop("MMG generates the on-hire report. Remove the on-hire file and upload the SiteIQ stock exports.")
    kinds = [kind for kind in MMG_DAILY_KINDS if SHEET.get(kind, kind) in names]
    if len(kinds) != 1:
        raise Stop("Choose a single MMG rental stock, sales stock, transactions or stocktake export.")
    declared = next((kind for kind in MMG_DAILY_KINDS if normal.startswith(kind)), None)
    if declared and declared != kinds[0]:
        raise Stop("The filename and workbook export type disagree. Choose the original SiteIQ file.")
    return kinds[0]


def sort_incoming(job):
    """Check the uploaded exports. Returns ({kind: path}, {kind: original name}); copy_in() puts them in the kit."""
    inc = os.path.join(job, "incoming")
    got, unknown = {}, []
    mmg = is_mmg(job)
    for name in sorted(os.listdir(inc)) if os.path.isdir(inc) else []:
        path = os.path.join(inc, name)
        original = name.split("__", 1)[-1]
        k = mmg_daily_kind(path, original) if mmg else kind_of(path)
        if k is None:
            unknown.append(name)
        elif k in got:
            raise Stop("Two {} files were uploaded. Upload one of each, from the same pull.".format(k.replace("_", " ")))
        else:
            got[k] = path
    if unknown:
        raise Stop("Not a SiteIQ export: {}. Nothing was changed.".format(", ".join(n.split("__", 1)[-1] for n in unknown)))
    if not got:
        raise Stop("No files arrived. Nothing was changed.")
    data = os.path.join(job, "kit", "Data_SiteIQ")
    os.makedirs(data, exist_ok=True)
    # any export not uploaded this time is carried over from the last upload
    missing = [k.replace("_", " ") for k in NEEDED if k not in got and not os.path.isfile(os.path.join(data, k + ".xlsx"))]
    if missing:
        raise Stop("Still needed, as there is no earlier copy on the site: {}. Nothing was changed.".format(", ".join(missing)))
    return got, {k: os.path.basename(p).split("__", 1)[-1] for k, p in got.items()}


def archive_stocktake(job, source):
    """Keep an earlier, verified MMG stocktake for the report's sighting history."""
    if kind_of(source) != "STOCKTAKE":
        raise Stop("The stocktake history contains a file that is not a SiteIQ stocktake.")
    check_workbook(source)
    digest = hashlib.sha256()
    with open(source, "rb") as stock:
        for block in iter(lambda: stock.read(1048576), b""):
            digest.update(block)
    history = Path(job) / "kit" / "stocktake_history"
    history.mkdir(exist_ok=True)
    saved = history / (digest.hexdigest() + ".xlsx")
    if saved.exists():
        return None
    with tempfile.NamedTemporaryFile(dir=history, delete=False) as tmp:
        try:
            with open(source, "rb") as stock:
                shutil.copyfileobj(stock, tmp)
            tmp.close()
            os.replace(tmp.name, saved)
        finally:
            if os.path.exists(tmp.name):
                os.remove(tmp.name)
    return saved


def copy_in(job, got, back):
    """Put the new exports in the kit, keeping the ones they replace. Returns the way back."""
    data = os.path.join(job, "kit", "Data_SiteIQ")
    for k, path in got.items():
        dest = os.path.join(data, k + ".xlsx")
        back[dest] = Path(dest).read_bytes() if os.path.isfile(dest) else None
        shutil.copyfile(path, dest)


VARIANT_ARCHIVE = "variant_history.json"
OPENING_BASELINE = "stocktake-opening-baseline.json"
OPENING_FIELDS = ("kind", "key", "name", "category", "barcode", "owner", "expected", "status",
                  "family", "product", "tool_store", "storage_unit")


def capture_opening(report, destination, source):
    """Capture register identity, never the sightings, staff details or ledger."""
    try:
        data = published_report(report)
        st = data["stocktake"]
        if st["schedule"] != MMG_SCHEDULE:
            raise ValueError("Other schedule")
        opening = (st.get("rounds") or [{}])[0]
        acceptance = opening.get("carry_forward", {})
        if acceptance.get("baseline_available"):
            # Also recovers the exact accepted set after an interruption between
            # publication of report.html and the create-only private sidecar.
            rows = opening["baseline_rows"]
            stamps = {key: acceptance.get(key, "") for key in ("inventory_asat", "rental_asat", "sales_asat")}
            source = "published_accepted_opening"
        else:
            rows = st["rows"]
            rental = datetime.strptime(data["asat"], "%d %b %Y %H:%M").isoformat(timespec="minutes") if data.get("asat") else ""
            sales = datetime.fromisoformat(data["sales_asat"]).isoformat(timespec="minutes") if data.get("sales_asat") else ""
            stamps = {"rental_asat": rental, "sales_asat": sales, "inventory_asat": rental if rental == sales else ""}
        clean, seen = [], set()
        for row in rows:
            ident = row["kind"], row["key"].strip().casefold()
            if ident[0] not in ("tool", "cons") or not ident[1] or ident in seen:
                raise ValueError("Invalid or duplicate identity")
            seen.add(ident)
            clean.append({k: row[k] for k in OPENING_FIELDS if k in row})
        if not clean:
            raise ValueError("Empty inventory")
    except (KeyError, ValueError, IndexError, TypeError, AttributeError) as exc:
        raise Stop("The published MMG opening register could not be verified. The opening baseline was not changed.") from exc
    destination.write_text(json.dumps({"schedule": MMG_SCHEDULE, "source": source, **stamps, "rows": clean},
                                      separators=(",", ":")), encoding="utf-8")


def publish_outputs(ready, volume, staged_baseline=None):
    """Publish one report build and optionally pin the opening set; restore on file errors."""
    with tempfile.TemporaryDirectory(dir=volume) as prior:
        changed = []
        try:
            for name, src in ready:
                dest, backup = volume / name, Path(prior) / name
                if dest.exists():
                    os.link(dest, backup)
                os.replace(src, dest)
                changed.append((dest, backup))
            if staged_baseline is not None:
                # Create only. Pack refreshes and subsequent builds cannot replace it.
                os.link(staged_baseline, volume / OPENING_BASELINE)
        except BaseException:
            for dest, backup in reversed(changed):
                if backup.exists():
                    os.replace(backup, dest)
                else:
                    dest.unlink(missing_ok=True)
            raise



def updated_snapshots(data_dir, snapshot, historical=False):
    path = Path(data_dir) / VARIANT_ARCHIVE
    history = json.loads(path.read_text(encoding="utf-8")) if path.is_file() else []
    by_time = {item["asat"]: item for item in history}
    stamp = snapshot["asat"]
    if historical and stamp in by_time and by_time[stamp]["counts"] != snapshot["counts"]:
        raise ValueError("Different totals already exist for that SiteIQ pull.")
    by_time[stamp] = snapshot
    return json.dumps([by_time[key] for key in sorted(by_time)], separators=(",", ":"))


def import_history(job, data_dir, path, kind):
    """Import verified historical evidence without changing current stock or a published report."""
    from openpyxl import load_workbook
    if kind not in ("RENTAL_STOCK", "STOCKTAKE") or kind_of(path) != kind:
        raise ValueError("Choose the original {} SiteIQ export.".format(kind))
    check_workbook(path)
    kit = Path(job) / "kit"
    current = kit / "Data_SiteIQ" / (kind + ".xlsx")
    if not current.is_file():
        raise ValueError("A current {} export is needed first.".format(kind))
    stamps = []
    for source in (path, current):
        wb = load_workbook(source, read_only=True, data_only=True, keep_links=False)
        try:
            stamps.append(requested_time(wb))
        finally:
            wb.close()
    if stamps[0] >= stamps[1]:
        raise ValueError("Historical imports must predate the current SiteIQ export.")
    if kind == "STOCKTAKE":
        archive_stocktake(job, path)
    else:
        payload = updated_snapshots(data_dir, rental_snapshot(path, kit), historical=True)
        with tempfile.NamedTemporaryFile(dir=data_dir, mode="w", encoding="utf-8", delete=False) as tmp:
            tmp.write(payload)
        try:
            os.replace(tmp.name, Path(data_dir) / VARIANT_ARCHIVE)
        finally:
            Path(tmp.name).unlink(missing_ok=True)
    return stamps[0].isoformat(timespec="minutes")


def build(job, out):
    with open(os.path.join(job, "job.json"), encoding="utf-8") as f:
        spec = json.load(f)
    cmd = [sys.executable, os.path.join(KIT_CODE, "build_showcase.py"), os.path.join(job, "kit"), os.path.join(out, "report.html"),
           "--onhire-out", os.path.join(out, "onhire")]
    for flag, rel in sorted(spec.get("paths", {}).items()):
        cmd += ["--" + flag, os.path.join(job, rel)]
    for flag, value in sorted(spec.get("options", {}).items()):
        cmd += ["--" + flag, str(value)]
    if is_mmg(job):
        cmd.extend(["--qr-report-data", str(Path(out) / "qr-report-data.json")])
        previous_qr_data = Path(out).parent / "qr-report-data.json"
        if previous_qr_data.is_file():
            cmd.extend(["--qr-report-prior", str(previous_qr_data)])
    register = Path(out).parent / "sds" / "register.json"
    if is_mmg(job) and register.is_file():
        cmd.extend(["--sds-register", str(register)])
    ledger = Path(out) / "physical_counts.json"
    if ledger.is_file():
        cmd.extend(["--stocktake-ledger", str(ledger)])
    baseline = Path(out) / OPENING_BASELINE
    if is_mmg(job) and baseline.is_file():
        cmd.extend(["--stocktake-opening-baseline", str(baseline)])
    variants = Path(out) / VARIANT_ARCHIVE
    if variants.is_file():
        cmd.extend(["--variant-history", str(variants)])
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
                '<span>Author: Andrew Fisher | POWERED BY SITEIQ · © 2026 Andrew Fisher. All rights reserved.</span><span>{} · SiteIQ pull {}</span>'
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


def main(job, data_dir, current=False):
    hist = None
    try:
        with open(os.path.join(job, "job.json"), encoding="utf-8") as f:
            hist = json.load(f).get("paths", {}).get("history")
    except (OSError, ValueError):
        raise Stop("The job pack is not loaded yet. Ask the Manager to load it.")
    hist = os.path.join(job, hist) if hist else None
    keep = open(hist, "rb").read() if hist and os.path.isfile(hist) else None
    out = tempfile.mkdtemp(dir=data_dir, prefix=".build-")
    back = {}
    saved_stocktake = None
    staged_baseline = Path(out) / OPENING_BASELINE
    pinned_baseline = Path(data_dir) / OPENING_BASELINE
    new_baseline = False
    try:
        got, files = ({}, {}) if current else sort_incoming(job)
        if is_mmg(job):
            # Check the effective inputs before changing any file on the site.
            for kind in MMG_DAILY_KINDS:
                path = got.get(kind, os.path.join(job, "kit", "Data_SiteIQ", kind + ".xlsx"))
                if os.path.isfile(path):
                    check_workbook(path)
            previous = Path(job) / "kit" / "Data_SiteIQ" / "STOCKTAKE.xlsx"
            if "STOCKTAKE" in got and previous.is_file():
                saved_stocktake = archive_stocktake(job, previous)
        copy_in(job, got, back)
        if is_mmg(job):
            rental = Path(job) / "kit" / "Data_SiteIQ" / "RENTAL_STOCK.xlsx"
            if rental.is_file():
                variant_snapshot = rental_snapshot(rental, Path(job) / "kit")
                (Path(out) / VARIANT_ARCHIVE).write_text(updated_snapshots(data_dir, variant_snapshot), encoding="utf-8")
            snapshot = {"recorded_entries": all_entries(data_dir),
                        "ledger_asat": datetime.now(QUEENSLAND).isoformat(timespec="seconds")}
            (Path(out) / "physical_counts.json").write_text(json.dumps(snapshot), encoding="utf-8")
            if pinned_baseline.is_file():
                shutil.copyfile(pinned_baseline, staged_baseline)
            else:
                new_baseline = True
                published = Path(data_dir) / "report.html"
                if published.is_file():
                    capture_opening(published, staged_baseline, "previous_published_inventory")
                else:
                    # One-time bootstrap. Render the actual verified inventory first;
                    # only the second, baseline-aware rendering can be published.
                    build(job, out)
                    capture_opening(Path(out) / "report.html", staged_baseline, "first_successful_inventory")
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
        if (Path(out) / VARIANT_ARCHIVE).is_file():
            ready.append((VARIANT_ARCHIVE, Path(out) / VARIANT_ARCHIVE))
        if is_mmg(job):
            qr_data = Path(out) / "qr-report-data.json"
            if not qr_data.is_file() or qr_data.stat().st_size == 0:
                raise Stop("The scoped report data was not generated. Nothing was changed.")
            ready.append((qr_data.name, qr_data))
        if is_mmg(job):
            # Stage the scoped data and document set before the main report's public commit point.
            ordered = [entry for entry in ready if entry[0] != "report.html"] + [ready[0]]
            publish_outputs(ordered, Path(data_dir), staged_baseline if new_baseline else None)
        else:
            for name, path in ready:
                os.replace(path, os.path.join(data_dir, name))
        print(json.dumps({"ok": True, "pull": asat, "files": files, "kept": [k for k in KINDS[:4] if k not in files]}))
        return 0
    except Exception as e:
        if saved_stocktake is not None:
            saved_stocktake.unlink(missing_ok=True)
        for dest, old in back.items():           # a failed build puts the earlier exports back
            if old is None:
                os.remove(dest)
            else:
                with open(dest, "wb") as f:
                    f.write(old)
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
        sys.exit(main(sys.argv[1], sys.argv[2], "--current" in sys.argv[3:]))
    except Stop as e:
        print(json.dumps({"ok": False, "message": str(e)}))
        sys.exit(1)
