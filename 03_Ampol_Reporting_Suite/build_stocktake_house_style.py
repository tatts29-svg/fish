#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
COATES STOCKTAKE - HOUSE-STYLE OUTPUTS (the K2 look)
One run -> floor worklist + client PDF + team PDF + Outlook email
=====================================================================
Author: Andrew Fisher
The Coates Way - Operational Excellence - POWERED BY SITEIQ

WHAT THIS IS
  The stocktake reporting suite rebuilt in the Coates house style (the
  K2 report family look), replacing the old-style compliance report and
  email. One run produces:

  (file names come from ampol_names.report_stem - one rule for the
  whole suite, the day the button was pressed on the end, e.g. 03Sep2026)

   1. Coates_Ampol_Stocktake_Count_Worklist_<day>.pdf / .xlsx / .html
      (FOR STAFF - the floor copy, unchanged from V3 - practical beats
      pretty on the floor)
   2. Coates_Ampol_Stocktake_Compliance_<day>.pdf (FOR THE CLIENT -
      house style; a dark cover with the one number of the day, the
      position, compliance, dollarised coverage, activity proof, the
      idle tail, on-hire verification. No item-level detail.)
      + .html beside it (the same pages - VERIFY_NUMBERS reads them)
      + _PositionCard.png (the phone card)
   3. Coates_Ampol_Stocktake_Team_<day>.pdf (FOR THE TEAM - "the people
      turning the wheel": named counting league, the daily three with
      misses named, due-by-bay, longest unsighted) + .html beside it
   4. Coates_Ampol_Stocktake_Compliance_<day>_OUTLOOK.eml (SEND TO
      STAFF - house-style body, Outlook-safe, the position card inline
      under the header, all three PDFs + Excel + the card attached)
      + _OUTLOOK.body.html and _OUTLOOK.draft.json so
      MAKE_OUTLOOK_DRAFTS keeps working.
  Every PDF is finished with its document properties (Author: Andrew
  Fisher) and a bookmark per section (pdf_finish). Once seven days are
  on the History scoreboard the client PDF gains a trend page.

ONE ENGINE
  All counting, joins, pricing and tiering come from
  build_stocktake_compliance_tool (Andrew's V3 engine) - this script
  renders skins over it and adds transaction-level analytics read from
  the same STOCKTAKE export. Change a rule once, in the engine, and
  every output follows. PDFs render via the engine's write_pdf_robust
  (WeasyPrint if working, otherwise Edge headless - no installs).

DATA RULES (unchanged)
  Dates parsed as DD/MM/YYYY. Unpriced items never estimated - excluded
  from value totals and disclosed. Transit stock excluded. On-hire
  coverage rated separately from shelf counting.
=====================================================================
"""

import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from email.message import EmailMessage
from email.utils import formatdate
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import ampol_names
import ampol_options
import ampol_paths
import ampol_master
import build_stocktake_compliance_tool as eng
import gasmon_engine as ge
import k2shell as sh
import pdf_finish
import report_history as rh
import txn_insights as ti
import json
from k2shell import esc, money, num, K

import openpyxl

BASE = Path(__file__).resolve().parent
# WHY (12 Aug 2026): outputs land in the suite's dated Reports area now -
# Reports\<today>\Stocktake - same folder the engine writes to, one day
# folder per run day, nothing ever silently overwritten.
OUT = Path(ampol_paths.day_folder("Stocktake"))

CONFIG = {
    "client": "Ampol",
    # WHY (02 Sep 2026): the page shell used to stamp every report
    # "(workbook file time)"; this report's as-at is the export's own
    # request time, so say so.
    "asat_note": "(SiteIQ stocktake export request time)",
    "title_client": "Stocktake Compliance",
    "title_team": "Stocktake - the team's count",
    "kicker_client": "COATES · STORES STOCKTAKE - COMPLIANCE REPORT",
    "kicker_team": "COATES · STORES STOCKTAKE - TEAM REPORT",
    "project": "Ampol Lytton Refinery · Permanent Tool Store",
    # WHY (03 Sep 2026): every output name comes from ampol_names.report_stem
    # - the client reads the attachment name before a single figure, so the
    # whole suite shares one shape with the day on the end. The stems are
    # the only names; everything else (.pdf, .html, _OUTLOOK.eml,
    # _PositionCard.png, the manifest) hangs off them.
    "stem_client": ampol_names.report_stem("stocktake"),
    "stem_team": ampol_names.report_stem("stocktake_team"),
    "stem_worklist": ampol_names.report_stem("worklist"),
    # WHY (03 Sep 2026): the page-1 RAG band on in-store SOP coverage.
    # Default lines - change here, the rule text on the page follows.
    "rag_green_from": 90,
    "rag_amber_from": 75,
    "cover_page": True,
    # the store map: Data\store_layout.json places each bay on a grid
    # (row, column). Without it the bays are laid out A to Z and the page
    # says so; a template is written beside the data on every run.
    "map_columns": 7,
    "team": [
        {"name": "Andrew Fisher", "role": "Shutdown Manager",
         "shift": "", "email": "andrew.fisher@coates.com.au",
         "blurb": "Oversees the store and the count cadence - anything at all, start here",
         "lead": True},
    ],
    "key_items": [
        ("orange", "COUNT EVERY DAY", "the standard - a day with no count shows as a zero"),
        ("blue", "TWO SCANS TWO LOOKS", "scanned and sighted, out and back"),
        ("amber", "2-DAY STANDARD", "gas monitors, radios, radio batteries, Milwaukee tools and batteries every 2 days"),
    ],
}


def cfg_for(kind):
    c = dict(CONFIG)
    c["title"] = c["title_client"] if kind == "client" else c["title_team"]
    c["kicker"] = c["kicker_client"] if kind == "client" else c["kicker_team"]
    return c


# =====================================================================
# supplementary analytics off the same STOCKTAKE export
# =====================================================================

def is_battery(r):
    b = r["barcode"].upper()
    d = r["desc"].upper()
    return b.startswith(("AMPMRB", "SATGASBAT")) or "BATTER" in d


def load_actions(stock_path):
    """barcode -> LAST_SIGHTED_ACTION (the engine drops it; we need it to
    tell deliberate stocktake scans from movement scans)."""
    wb = openpyxl.load_workbook(stock_path, read_only=True, data_only=True)
    ws = wb["STOCKTAKE"]
    it = ws.iter_rows(values_only=True)
    hdr = [c for c in next(it)]
    ix = {h: i for i, h in enumerate(hdr)}
    out = {}
    for r in it:
        bc = str(r[ix["LATEST_BARCODE"]] or "").strip().upper()
        if bc:
            out[bc] = str(r[ix["LAST_SIGHTED_ACTION"]] or "").strip()
    wb.close()
    return out


def analytics(rows, d, export_dt, actions):
    a = {}
    ins = d["instore"]
    for r in rows:
        r["action"] = actions.get(r["barcode"].upper(), "")

    # ---- daily and weekly sighting activity ---------------------------
    daily_all, daily_st = Counter(), Counter()
    for r in rows:
        if r["last"]:
            dt = r["last"].date()
            daily_all[dt] += 1
            if r["action"].lower() == "stocktake":
                daily_st[dt] += 1
    a["daily_all"], a["daily_st"] = daily_all, daily_st
    days14 = [export_dt.date() - timedelta(days=i) for i in range(13, -1, -1)]
    a["days14"] = [{"label": dd.strftime("%d %b"),
                    "issued": daily_all.get(dd, 0),
                    "returned": daily_st.get(dd, 0)} for dd in days14]
    weekly = defaultdict(int)
    for dt, n in daily_all.items():
        iso = dt.isocalendar()
        weekly[(iso[0], iso[1])] += n
    wk_keys = sorted(weekly)[-12:]
    a["weekly"] = [{"label": datetime.fromisocalendar(k[0], k[1], 1).strftime("%d %b"),
                    "n": weekly[k]} for k in wk_keys]
    if daily_all:
        rec_day, rec_n = max(daily_all.items(), key=lambda kv: kv[1])
        a["record_day"] = {"date": rec_day, "n": rec_n}
    # WHY (02 Sep 2026): the STOCKTAKE export carries one row per item - its
    # MOST RECENT sighting only. An item scanned on 20 Aug and again today
    # counts once, today. So every "activity" figure here is items by the
    # date of their latest sighting, not scans performed, and the pages say
    # so. The one figure that is exact is today: items sighted today.
    a["sighted_today"] = daily_all.get(export_dt.date(), 0)
    a["seen24"] = sum(1 for r in rows if r["last"] and r["last"] >= export_dt - timedelta(hours=24))

    # ---- hour-of-day profile of DELIBERATE stocktake scans, last 30d --
    hh = Counter()
    for r in rows:
        if (r["last"] and r["action"].lower() == "stocktake"
                and (export_dt - r["last"]).days <= 30):
            hh[r["last"].hour] += 1
    a["st_hours"] = hh

    # ---- the counting league (named, from the same export) ------------
    ppl = defaultdict(lambda: {"d7": 0, "d30": 0, "st30": 0, "last": None})
    for r in rows:
        if not r["by"] or r["days"] is None:
            continue
        p = ppl[r["by"]]
        if r["days"] <= 7:
            p["d7"] += 1
        if r["days"] <= 30:
            p["d30"] += 1
            if r["action"].lower() == "stocktake":
                p["st30"] += 1
        if p["last"] is None or (r["last"] and r["last"] > p["last"]):
            p["last"] = r["last"]
    a["league"] = sorted(
        [{"name": k, **v} for k, v in ppl.items() if v["d30"] > 0],
        key=lambda x: -x["d30"])
    a["done30_total"] = len(d["done30"])
    # WHY (07 Nov 2026, QA F35): sightings with no name on the scan get their
    # own row, so the people table adds to the totals it sits beside
    d7_from = d["done7_from"]
    a["league_unnamed"] = {
        "d7": sum(1 for r in d["done7"] if not r["by"]),
        "d30": sum(1 for r in d["done30"] if not r["by"]),
        "st30": sum(1 for r in d["done30"] if not r["by"] and r["action"].lower() == "stocktake")}
    for x in a["league"]:
        x["d7"] = sum(1 for r in d["done7"] if r["by"] == x["name"])

    # ---- the daily three: gas / radios / batteries --------------------
    cut = export_dt - timedelta(hours=24)

    def three(pred):
        grp = [r for r in ins if pred(r)]
        seen = [r for r in grp if r["last"] and r["last"] >= cut]
        missed = sorted([r for r in grp if not (r["last"] and r["last"] >= cut)],
                        key=lambda r: (r["days"] is None, -(r["days"] or 0)),
                        reverse=False)
        missed.sort(key=lambda r: (0 if r["days"] is None else 1,
                                   -(r["days"] or 99999)))
        return grp, seen, missed
    a["gas"] = three(lambda r: r["cat"] == "gas")
    a["radio"] = three(lambda r: r["cat"] == "radio" and not is_battery(r))
    a["battery"] = three(lambda r: r["cat"] == "radio" and is_battery(r))
    # WHY (07 Nov 2026, QA F30/F31): "past target" is one rule on every page -
    # in store and not sighted inside the tier's own target (2 days), the
    # rule the scorecard's "(305 inside it)" uses. The 24-hour tiles stay;
    # the past-target count is the one that carries over.
    for key in ("gas", "radio", "battery"):
        a[key + "_past"] = [r for r in a[key][0] if r["days"] is None or r["days"] > r["target"]]

    # ---- ageing tails: in-store vs on-hire -----------------------------
    # The in-store tail is what shelf counting clears; the on-hire tail is
    # long-hire gear whose verification comes from return rescans and
    # shutdown checks - report them separately, never blended.
    buckets = [("0-30 days", 0, 30), ("31-60 days", 31, 60),
               ("61-90 days", 61, 90), ("91-180 days", 91, 180),
               ("Over 180 days", 181, 10 ** 6)]

    def bucketise(grp_rows):
        out = []
        for lab, lo, hi in buckets:
            grp = [r for r in grp_rows
                   if r["days"] is not None and lo <= r["days"] <= hi]
            out.append((lab, len(grp), sum(r["value"] or 0 for r in grp)))
        nev = [r for r in grp_rows if r["days"] is None]
        out.append(("Never sighted", len(nev),
                    sum(r["value"] or 0 for r in nev)))
        return out
    a["idle_ins"] = bucketise(ins)
    a["idle_oh"] = bucketise(d["onhire"])
    a["ins_over30"] = [r for r in ins
                       if r["days"] is None or r["days"] > 30]
    # WHY (02 Sep 2026): `days or 0` read a same-day sighting (0) and a
    # never-sighted item (None) as the same thing. Never-sighted is counted
    # on its own so the "oldest" claim can never quietly ignore one.
    a["ins_never"] = sum(1 for r in ins if r["days"] is None)
    a["ins_oldest"] = max((r["days"] for r in ins if r["days"] is not None), default=0)
    a["oh_risk180"] = [r for r in d["onhire"]
                       if r["days"] is None or r["days"] > 180]
    a["oh_risk180_val"] = sum(r["value"] or 0 for r in a["oh_risk180"])
    a["oh_longest"] = sorted(
        d["onhire"],
        key=lambda r: (0 if r["days"] is None else 1, -(r["days"] or 0)))[:12]

    # ---- coverage by bay (home storage unit, in-store) ----------------
    units = defaultdict(list)
    for r in ins:
        units[r["unit"]].append(r)
    ut = []
    for u, grp in units.items():
        ok = sum(1 for r in grp if r["days"] is not None and r["days"] <= 30)
        due_t = sum(1 for r in grp if r["days"] is None or r["days"] > r["target"])
        val = sum(r["value"] or 0 for r in grp)
        oldest = max((r["days"] if r["days"] is not None else 99999) for r in grp)
        ut.append({"unit": u, "n": len(grp), "ok": ok,
                   "pct": ok / len(grp) * 100 if grp else 0,
                   "due": due_t, "val": val, "oldest": oldest})
    ut.sort(key=lambda x: -x["n"])
    a["units"] = ut

    # ---- longest unsighted in-store (the residue) ---------------------
    a["longest"] = sorted(
        ins, key=lambda r: (0 if r["days"] is None else 1, -(r["days"] or 0)))[:10]

    # ---- on-hire verification by company -------------------------------
    # WHY (02 Sep 2026): the register spells one customer several ways
    # (AMPOL / AMPOL REFINERIES (QLD) PTY LTD / CALTEX; Contract Resources.
    # / ... FCCU / ... SATGAS/MOL). One row per customer, and the two
    # custody accounts (Dräger service, Repairs) are flagged - gear there is
    # in repair or calibration, not out with a contractor.
    co = defaultdict(lambda: {"n": 0, "val": 0, "due": 0, "custody": False, "priced": 0})
    for r in d["onhire"]:
        raw = (r.get("company_raw") or "").strip()
        c = ge.norm_company(raw) if raw else "(no company)"
        if raw.upper().startswith(("DRÄGER", "DRAGER", "REPAIRS")):
            c = f"{c} (repairs / custody)"
            co[c]["custody"] = True
        co[c]["n"] += 1
        co[c]["val"] += r["value"] or 0
        co[c]["priced"] += 1 if r["value"] is not None else 0
        if eng.bucket(r["days"]) != "ok":
            co[c]["due"] += 1
    # WHY (07 Nov 2026, QA F74): a company with nothing priced is unpriced, not $0
    for v in co.values():
        if not v["priced"]:
            v["val"] = None
    a["onhire_co"] = sorted([{"co": k, **v} for k, v in co.items()],
                            key=lambda x: -x["n"])
    a["custody_n"] = sum(v["n"] for v in co.values() if v["custody"])
    # ---- on-cycle within own tier target (in-store) --------------------
    wt = sum(1 for r in ins if r["days"] is not None and r["days"] <= r["target"])
    a["on_cycle_pct"] = wt / len(ins) * 100 if ins else 0
    a["within_target"] = wt
    return a


# =====================================================================
# PDF rendering via the engine's robust writer
# =====================================================================

_MEASURE_JS = r"""<script>
document.fonts.ready.then(function(){
  var out = [];
  var pages = document.querySelectorAll('.page');
  for (var i = 0; i < pages.length; i++) {
    var pg = pages[i];
    var body = pg.querySelector('.body');
    var foot = pg.querySelector('.foot');
    if (!body || !foot) { out.push({page: i + 1, over: null, wide: 0}); continue; }   // the cover: no footer by design
    var ft = foot.getBoundingClientRect();
    var bottom = body.getBoundingClientRect().top;
    var els = body.querySelectorAll('*');
    for (var j = 0; j < els.length; j++) {
      var r = els[j].getBoundingClientRect();
      if (r.bottom > bottom) bottom = r.bottom;
    }
    out.push({page: i + 1, over: Math.round(bottom - ft.top),
              wide: Math.round(body.scrollWidth - body.clientWidth)});
  }
  var d = document.createElement('div');
  d.id = 'layout-report';
  d.setAttribute('data-lato', document.fonts.check('12px Lato') ? '1' : '0');
  d.textContent = JSON.stringify(out);
  document.body.appendChild(d);
});
</script>"""


def _browser():
    try:
        from generate_k2style_gas_monitor_report import find_browser
        return find_browser()
    except Exception:
        import shutil
        for name in ("msedge", "google-chrome", "chrome", "chromium-browser", "chromium"):
            if shutil.which(name):
                return shutil.which(name)
        return None


def fit_check(doc, css, label):
    """Measure every page in the browser with the house face loaded.
    WHY (03 Sep 2026): k2style.css now embeds Lato, and the shared fit
    check measured before the font files had loaded - it saw the fallback
    face, up to 9 px off on a full page, on pages that had 0 px to spare.
    This one waits on document.fonts.ready under a virtual-time budget,
    with the page written beside the PDF so the relative font URLs
    resolve, so the pixels it reports are the pixels the PDF prints.
    Returns (ok, worst_spare_px, rows); ok is None when nothing could
    measure - never a reason not to build."""
    import subprocess
    import tempfile
    browser = _browser()
    if not browser:
        print(f"Fit check            : skipped - no browser to measure with ({label})")
        return None, None, []
    doc2 = (doc.replace("</head>", f"<style>{css}</style></head>", 1)
               .replace("</body>", _MEASURE_JS + "</body>", 1))
    tmp = OUT / f"__measure_{os.getpid()}__.html"
    profile = os.path.join(tempfile.gettempdir(), f"coates_fit_{os.getpid()}")
    try:
        tmp.write_text(doc2, encoding="utf-8")
        res = subprocess.run([browser, "--headless", "--disable-gpu", "--no-sandbox",
                              "--no-first-run", "--user-data-dir=" + profile,
                              "--virtual-time-budget=10000", "--dump-dom", tmp.as_uri()],
                             capture_output=True, timeout=240)
        dom = (res.stdout or b"").decode("utf-8", "ignore")
    except Exception as e:
        print(f"Fit check            : skipped ({type(e).__name__}) ({label})")
        return None, None, []
    finally:
        try:
            tmp.unlink()
        except OSError:
            pass
    m = re.search(r'id="layout-report" data-lato="(\d)">(\[.*?\])</div>', dom, re.S)
    if not m:
        print(f"Fit check            : skipped - the page could not be measured ({label})")
        return None, None, []
    rows = [(r["page"], r["over"], r["wide"]) for r in json.loads(m.group(2))]
    face = "Lato" if m.group(1) == "1" else "FALLBACK FACE - Lato did not load"
    rows = [r for r in rows if r[1] is not None]      # the cover carries no footer
    bad = [r for r in rows if r[1] > 0 or r[2] > 0]
    worst = max((r[1] for r in rows), default=-9999)
    if bad:
        print("*" * 68)
        print(f"WARNING: CONTENT DOES NOT FIT in {label} - do not send as is ({face}).")
        for pg, over, wide in bad:
            print(f"  page {pg:2d}: {over:+d}px past the footer" + (f", {wide}px too wide" if wide > 0 else ""))
        print("*" * 68)
        return False, -worst, rows
    print(f"Fit check            : PASS - tightest page has {-worst}px to spare, measured in {face} ({label})")
    return True, -worst, rows


def render_k2_pdf(doc, pdf_path, html_path, authored, css):
    """Measures the pages (fit_check), writes the page HTML beside the PDF
    - kept, because it IS the report when no PDF engine is on the machine
    and VERIFY_NUMBERS reads it - renders the PDF and checks the page
    count. Returns (fit_ok, layout_ok); never exits, the caller decides."""
    fit_ok, _, _ = fit_check(doc, css, Path(pdf_path).name)
    doc = doc.replace("</head>", f"<style>{css}</style></head>", 1)
    Path(html_path).write_text(doc, encoding="utf-8")
    # pre-delete: write_pdf_robust treats an EXISTING file as success, so a
    # stale copy from a previous run must never be able to masquerade
    try:
        Path(pdf_path).unlink()
    except OSError:
        pass
    ok = eng.write_pdf_robust(str(html_path), str(pdf_path))
    if not ok:
        sys.exit(f"ERROR: could not render {Path(pdf_path).name} - no PDF "
                 "engine available. Edge is standard on Coates laptops.")
    raw = open(pdf_path, "rb").read()
    counts = re.findall(rb"/Count\s+(\d+)", raw)
    actual = max(int(c) for c in counts) if counts else -1
    if actual == -1:
        print(f"Layout check         : page count unreadable - authored "
              f"{authored}; open the PDF and confirm")
        return fit_ok, None
    if actual != authored:
        print("*" * 68)
        print(f"WARNING: LAYOUT OVERFLOW in {Path(pdf_path).name} - authored "
              f"{authored} pages, PDF has {actual}. Do not send as is.")
        print("*" * 68)
        return fit_ok, False
    print(f"Layout check         : PASS - {actual} pages "
          f"({Path(pdf_path).name})")
    return fit_ok, True


def plain(fragment):
    """The words of a page fragment with the markup taken off - for the
    scoreboard and the phone card, which hold text, not HTML."""
    import html as _html
    return _html.unescape(re.sub(r"<[^>]+>", "", fragment)).replace("\xa0", " ")


# =====================================================================
# the History scoreboard: days on record and the 30-day trend rows
# =====================================================================

def history_days(family, asat):
    """Days the scoreboard holds for a family, today's counted in - the
    entry is written after the pages, keyed on the export day."""
    return len(set(rh.load().get(family, {})) | {asat.date().isoformat()})


def trend_rows(family, asat, today):
    """(labels, {key: [values]}, days) over the 30-day window ending at the
    export day: every recorded earlier day plus today's own figures. A
    day with no run for a key leaves None - the chart draws a gap."""
    window = {}
    for key in today:
        for dd, v in rh.series(family, key, asat, days=30):
            if dd < asat.date():
                window.setdefault(dd, {})[key] = v
    window.setdefault(asat.date(), {}).update(today)
    days = sorted(window)
    labels = [dd.strftime("%d %b") for dd in days]
    return labels, {k: [window[dd].get(k) for dd in days] for k in today}, days


# =====================================================================
# shared page fragments (PDF)
# =====================================================================

def psect(title):
    return f'<div class="sect"><h3>{title}</h3></div>'


def pcallout(inner, tight=True):
    cls = "callout tight" if tight else "callout"
    return f'<div class="{cls}">{inner}</div>'


def pnote(inner):
    return f'<div class="note">{inner}</div>'


def psubh(title, thin=""):
    t = f' <span class="thin">{thin}</span>' if thin else ""
    return f'<div class="sub-h">{title}{t}</div>'


def chartpanel(inner):
    return f'<div class="chartpanel">{inner}</div>'


def ragc(pct):
    return ("g" if pct >= 90 else "a" if pct >= 75 else "rd")


def score_rows_rag(rows):
    """The scorecard ladder in the shell's markup, rated by THIS report's
    rule (green from 90%, amber from 75%, red below). WHY (07 Nov 2026, QA
    F03): the shell's generic scale read 49.7% as amber; the report's own
    RAG line says red, so the bar and the mark say red too."""
    out = ['<table class="scores">']
    for lab, sc, form in rows:
        st = ("green" if sc >= CONFIG["rag_green_from"] else
              "amber" if sc >= CONFIG["rag_amber_from"] else "red")
        col = {"green": "f-green", "amber": "f-amber", "red": "f-red"}[st]
        mark, mcol = {"green": ("✓", "#409A55"), "amber": ("!", "#E08A24"), "red": ("✕", "#D0342C")}[st]
        out.append(
            f'<tr><td class="sc-tick" style="color:{mcol};font-weight:700">{mark}</td>'
            f'<td class="sc-lab">{esc(lab)}</td>'
            f'<td class="sc-bar"><div class="track" style="margin-right:8px">'
            f'<div class="fill {col}" style="width:{max(2, min(100, sc))}%"></div>'
            f'</div></td>'
            f'<td class="sc-val">{sc}/100</td></tr>'
            f'<tr><td></td><td colspan="3" class="sc-form">{esc(form)}</td></tr>')
    out.append("</table>")
    return "".join(out)


# WHY (07 Nov 2026, QA F02/F28): the standard is a count every day; the
# export shows the days with none. Said once, plainly, beside the figures.
def zero_days_note(a, export_dt):
    days = [export_dt.date() - timedelta(days=i) for i in range(13, -1, -1)]
    zero = [dd for dd in days if not a["daily_all"].get(dd, 0)]
    if not zero:
        return "Every day of the last 14 has sightings on the record."
    names = ", ".join(dd.strftime("%a %d %b") for dd in zero)
    today = (" - today's count had not started when the export was pulled at "
             f"{export_dt:%H:%M}" if export_dt.date() in zero else "")
    return (f"The standard is a stock take every day. In the last 14 days, {num(len(zero))} "
            f"{'day has' if len(zero) == 1 else 'days have'} no sightings on the record: {names}{today}.")


def week_bars(weeks, w=636, h=200):
    """Weekly bars, every bar labelled with its count (thousands separated)."""
    if not weeks:
        return '<div class="note">No sightings on the record.</div>'
    top, base, pad = 22, h - 28, 8
    slot = (w - 2 * pad) / len(weeks)
    mx = max(x["n"] for x in weeks) or 1
    out = [f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">',
           f'<line x1="{pad}" y1="{base}" x2="{w - pad}" y2="{base}" stroke="#98A0AA" stroke-width="1"/>']
    for i, x in enumerate(weeks):
        bh = (base - top) * (x["n"] / mx)
        bx = pad + i * slot + slot * 0.15
        bw = slot * 0.7
        out.append(f'<rect x="{bx:.1f}" y="{base - bh:.1f}" width="{bw:.1f}" height="{bh:.1f}" rx="2" fill="{K["orange"]}"/>')
        out.append(f'<text x="{bx + bw / 2:.1f}" y="{base - bh - 4:.1f}" text-anchor="middle" fill="#1D1D1B" '
                   f'font-family="Inter, Segoe UI, Calibri, sans-serif" font-size="8.4" font-weight="700">{num(x["n"])}</text>')
        out.append(f'<text x="{bx + bw / 2:.1f}" y="{base + 14:.1f}" text-anchor="middle" fill="#5B6472" '
                   f'font-family="Inter, Segoe UI, Calibri, sans-serif" font-size="7.8">{esc(x["label"])}</text>')
    out.append("</svg>")
    return "".join(out)


# WHY (07 Nov 2026, QA F17): an age band past the SOP is never drawn green -
# the suite's band colours: inside 30 days green, 31-60 amber, 61-90 deep
# amber, older red; never sighted red
BAND_COLOURS = {"0-30 days": "#409A55", "31-60 days": "#E08A24", "61-90 days": "#B5651D",
                "91-180 days": "#D0342C", "Over 180 days": "#D0342C", "Never sighted": "#D0342C"}


def band_bars(rows, w=636, rowh=24, lab_w=172):
    """(label, count) bars, each band in its own colour, the count printed."""
    h = len(rows) * rowh + 10
    mx = max((n for _, n in rows), default=0) or 1
    val_w = 52
    out = [f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    for i, (lab, n) in enumerate(rows):
        y = 5 + i * rowh
        bw = (w - lab_w - val_w) * (n / mx)
        out.append(f'<text x="0" y="{y + 12}" fill="#1D1D1B" font-family="Inter, Segoe UI, Calibri, sans-serif" font-size="9">{esc(lab)}</text>')
        out.append(f'<rect x="{lab_w}" y="{y + 3.5}" width="{w - lab_w - val_w}" height="10" rx="5" fill="#E6E9EE"/>')
        if n > 0:
            out.append(f'<rect x="{lab_w}" y="{y + 3.5}" width="{max(bw, 10):.1f}" height="10" rx="5" fill="{BAND_COLOURS.get(lab, "#5B6472")}"/>')
        out.append(f'<text x="{w}" y="{y + 12}" text-anchor="end" fill="#1D1D1B" font-family="Inter, Segoe UI, Calibri, sans-serif" '
                   f'font-size="9.4" font-weight="700">{num(n)}</text>')
    out.append("</svg>")
    return "".join(out)


def same_date_note(rows_):
    """WHY (07 Nov 2026, QA F41): a dozen identical 'last verified' dates
    reads like a load date, not a scan - the team checks before it travels."""
    dates = {r["last"].date() for r in rows_ if r["last"]}
    if len(rows_) > 3 and len(dates) == 1:
        return (f"All {num(len(rows_))} carry the same last-verified date, {next(iter(dates)):%d %b %Y} - check whether "
                f"that is a real scan or the day the register was loaded before quoting it.")
    return ""


def peak_week_sentence(wk):
    if not wk:
        return ""
    pk = max(wk, key=lambda x: x["n"])
    last = wk[-1]
    return (f'The tallest week is the week of {esc(pk["label"])} ({num(pk["n"])} items); the latest week, '
            f'{esc(last["label"])}, holds {num(last["n"])} so far. A tall week is a week the team swept a lot of '
            f'gear that has not been scanned since.')


# =====================================================================
# the position page (03 Sep 2026): three things to do today, the story
# =====================================================================

def story_words(fragment):
    """Word count of a callout with the markup off. The position page's
    story is held to three lines - about 45 words - and the console
    prints the count so a longer one is caught before it is sent."""
    return len(plain(fragment).split())


def three_things_stocktake(d, a, band):
    """The three actions on the position page, each read from the data and
    dated by the band's own rule (seven days from the export time). The
    block never invents an action - less to do prints less."""
    who = f"Andrew Fisher · by {band['due']}"
    # WHY (07 Nov 2026, QA F07): a missed return is resolved the same day and a
    # gas monitor past its 2-day target is sighted today - their dates say so
    today_who = f"Andrew Fisher · today, {band['asat_day']}"
    items = []
    # 1. the bay with the most shelf items unsighted over 30 days
    bays = defaultdict(list)
    for r in a["ins_over30"]:
        bays[r["unit"] or "(no bay recorded)"].append(r)
    if bays:
        bay, its = sorted(bays.items(),
                          key=lambda kv: (-len(kv[1]), ampol_names.sort_key(kv[0])))[0]
        never = sum(1 for r in its if r["days"] is None)
        oldest = max((r["days"] for r in its if r["days"] is not None), default=0)
        where = bay if re.search(r"BAY|STATION|STORE|YARD", bay, re.I) else f"bay {bay}"
        bits = ([f"oldest {num(oldest)} days"] if oldest else []) + \
               ([f"{num(never)} never sighted"] if never else [])
        items.append((f"Walk {where} - {num(len(its))} shelf items unsighted over 30 days",
                      "; ".join(bits), who))
    # 2. possible missed returns - gear that is home but still reads on hire
    n_mr = len(d["missed_returns"])
    if n_mr:
        items.append((f"Resolve {num(n_mr)} possible missed {'return' if n_mr == 1 else 'returns'}",
                      "on hire in SiteIQ, yet sighted in a store bay after the hire date - listed on the missed-returns page", today_who))
    else:
        n_v = len(d["onhire_due30"])
        items.append((f"Verify {num(n_v)} on-hire items on their next return",
                      "no scan of any kind in 30 days - a long hire, checked at the counter", who))
    # 3. the daily three: gas monitors not seen in 24 hours, else the tier
    #    furthest behind its own target cycle
    g_all, g_seen, g_miss = a["gas"]
    g_past = a["gas_past"]
    if g_past:
        n_in = len(g_all) - len(g_past)
        items.append((f"Sight the {num(len(g_past))} gas {'monitor' if len(g_past) == 1 else 'monitors'} past the 2-day standard",
                      f"{num(n_in)} of {num(len(g_all))} in-store monitors sighted inside 2 days", today_who))
    else:
        k, lab, tgt, why, tot, ohn, insn, wt, w30, p30 = min(
            d["tier_stats"], key=lambda t: (t[7] / t[6]) if t[6] else 1)
        lab = lab.lower().replace("milwaukee", "Milwaukee")
        items.append((f"Bring {lab} back on cycle - {num(insn - wt)} of {num(insn)} "
                      f"outside the {tgt}-day target", why, who))
    return items


# =====================================================================
# CLIENT PDF
# =====================================================================

def build_client_pages(rows, d, a, export_dt, fm=None, tx_window=None):
    P = []
    comp = d["comp30"]
    val_cov = (d["val_ok30"] / d["val_total"] * 100) if d["val_total"] else 0
    priced_pct = d["priced_lines"] / len(rows) * 100 if rows else 0

    # ---- P1 the position - the band, the tiles, three things, the story --
    # WHY (03 Sep 2026): one grammar for every position page in the suite -
    # the RAG band first, the tiles with their movement, the three things
    # to do today, then the story in three lines. The arithmetic behind it
    # (the donut, the tier ladders, the long paragraph) sits on the
    # scorecard page after this one, where it has the room to be read.
    band = rag_band_stocktake(d, a, export_dt)
    ins_pct = (d["ok30_instore"] / len(d["instore"]) * 100) if d["instore"] else 0
    story = (f'<span class="lead">The story.</span> <b>{num(d["countable"])}</b> countable items; '
             f'<b class="o">{ins_pct:.1f}%</b> of the shelf sighted inside the 30-day SOP and '
             f'<b>{money(d["val_ok30"])}</b> of {money(d["val_total"])} priced fleet verified in 30 days. '
             f'The second watch item is long-hire gear: {num(len(a["oh_risk180"]))} on-hire items '
             f'unseen for 180+ days, holding {money(a["oh_risk180_val"])}.')
    print(f"Story callout        : {story_words(story)} words (client position page, three lines at most)")
    # WHY (07 Nov 2026): the tiles' movement names its base once, in words
    prev = rh.previous("stocktake", "countable", export_dt)
    base_note = (pnote(f"Movement on the tiles is against the previous report on record, "
                       f"{prev[0].strftime('%d %b %Y')}.") if prev else "")
    P.append(f"""{band["html"]}
{sh.tiles_plus([
    ("box", num(d["countable"]), "Countable items",
     *mv("countable", d["countable"], "up", f"{num(len(d['instore']))} in store, {num(len(d['onhire']))} on hire", "grey")),
    ("shield", money(d["val_total"]), "Priced fleet value (new)",
     *mv("val_total", round(d["val_total"]), "up", f"{priced_pct:.0f}% of lines priced", "grey")),
    ("check", money(d["val_ok30"]), "Value verified 30d",
     *mv("val_ok30", round(d["val_ok30"]), "up", f"{val_cov:.0f}% of priced value", "green" if val_cov >= 75 else "amber")),
    ("swap", money(d["val_onhire"]), "Value on hire now",
     *mv("val_onhire", round(d["val_onhire"]), None, "verified on return", "grey")),
])}
{base_note}
{(lambda t3: sh.three_things(t3, title=("Three things to do, starting today" if len(t3) == 3 else
                                         "Two things to do, starting today" if len(t3) == 2 else "One thing to do today")))(three_things_stocktake(d, a, band))}
{pcallout(story)}""")

    # ---- P1b the scorecard - the arithmetic behind the position ---------
    ladders = score_rows_rag([
        (lab, round(p30),
         f"{num(w30)} of {num(insn)} in-store items sighted inside the 30-day SOP"
         + (f" - internal target is every {tgt} days ({num(wt)} inside it)" if tgt != 30 else ""))
        for k, lab, tgt, why, tot, ohn, insn, wt, w30, p30 in d["tier_stats"]])
    P.append(f"""{psect("The scorecard - the arithmetic behind the position")}
{pcallout(
        f'<span class="lead">The position, in full.</span> One honest answer: '
        f'is the {esc(CONFIG["client"])} tool store counted and under control? '
        f'<b>{num(d["countable"])} countable items</b> on the register, '
        f'<b class="o">{comp:.1f}%</b> sighted inside the 30-day SOP cycle, '
        f'and <b>{money(d["val_ok30"])}</b> of the <b>{money(d["val_total"])}</b> '
        f'priced fleet verified in the last 30 days. On the shelf the position '
        f'is stronger again: <b class="o">{ins_pct:.1f}% of '
        f'in-store items sighted inside 30 days</b>'
        + (f', with the longest-unsighted shelf item at {num(a["ins_oldest"])} days'
           if not a["ins_never"] else
           f', with <b class="rd">{num(a["ins_never"])} never sighted</b>')
        + f'. Every score prints its own arithmetic - it can be challenged, '
        f'checked and trusted. <b>{num(d.get("transit_n", 0))} lines</b> that have '
        f'departed the store (Pending Branch Receipt, or a Departure scan with the '
        f'item no longer on the live register) are excluded.', False)}
<table class="two" style="margin-top:10px"><tr>
  <td style="width:31%"><div class="donut-wrap">
    {sh.donut(round(comp), sh.health_hex(round(comp)), f"{comp:.0f}%", sh.health_word(round(comp)))}
    <div class="donut-cap">30-day SOP compliance - whole store</div></div></td>
  <td style="padding-left:10px">{ladders}</td>
</tr></table>
{pnote(f'SOP compliance = items sighted in the last 30 days &divide; countable items = {num(d["ok30"])} &divide; {num(d["countable"])} = <b>{comp:.1f}%</b>. That {num(d["ok30"])} is <b>{num(d["ok30_instore"])} in store + {num(d["ok30_onhire"])} on hire</b> (an on-hire item&rsquo;s sighting is its hire-out or return scan). Of the {num(d["late_instore"] + d["late_onhire"])} items outside 30 days, <b>{num(d["late_onhire"])} are on hire</b> and {num(d["late_instore"])} are on the shelf. Tier bars are rated on in-store assets; on-hire assets are verified through the double-scan return process and shutdown checks, shown separately on the on-hire page.')}
{sh.tiles([
    ("check", num(len(d["done7"])), "Sighted last 7 days", f"items, {d['done7_from']:%d %b} to {export_dt:%d %b}", ""),
    ("bars", num(len(d["done30"])), "Sighted last 30 days", "items", ""),
    ("zap", num(a["sighted_today"]), "Sighted today",
     f"{export_dt:%A %d %b}, to {export_dt:%H:%M}", "grey" if a["sighted_today"] else "amber"),
    ("clock", num(sum(a["st_hours"].values())), "Stocktake scans, 30 days",
     "items whose latest scan was a count", "grey"),
])}
{pnote(zero_days_note(a, export_dt))}""")

    # ---- P2 determination + activity -----------------------------------
    wk = a["weekly"]
    # WHY (03 Sep 2026): k2shell.line_chart is the 10/10-pass chart now -
    # (name, values) series, one shared axis - so this call follows it.
    line = week_bars(wk)
    det = "".join(
        f'<tr><td class="al-dot d-amber">&#9679;</td><td>'
        f'<div class="al-t">P{1 if k in ("gas", "radio") else 2 if k == "milwaukee" else 3} '
        f'&middot; {esc(lab)} - every {tgt} days</div>'
        f'<div class="al-s">{esc(why)}</div></td></tr>'
        for k, lab, tgt, why, *_ in d["tier_stats"])
    P.append(f"""{psect("The priority determination - stated, not implied")}
<div class="alerts"><div class="ah">How this store is counted</div>
<table class="al">{det}</table></div>
{pnote('Client compliance is measured on the 30-day SOP. The 2-day cycle for gas monitors, radios, radio batteries, Milwaukee tools and batteries is the Coates internal standard set <b>above</b> the SOP. Issue and return scans reset an item&rsquo;s clock, so the count cadence naturally surfaces idle stock - exactly the gear that goes missing quietly.')}
{psubh("Register freshness", "- items by the week of their most recent sighting (week starting Monday), last 12 weeks")}
{chartpanel(line)}
{pnote('The stocktake export holds one line per item - its latest sighting only - so this chart is <b>how fresh the register is</b>, not a count of scans performed. An item scanned twice in the window appears once, on its latest date. ' + peak_week_sentence(wk))}""")

    # ---- P3 coverage by bay --------------------------------------------
    ut = a["units"][:16]
    rest = a["units"][16:]
    urows = []
    for u in ut:
        c = ragc(u["pct"])
        urows.append([esc(u["unit"]), num(u["n"]),
                      f'<span class="{c}">{u["pct"]:.0f}%</span>',
                      num(u["due"]), money(u["val"]) if u["val"] else
                      '<span class="tbc">unpriced</span>'])
    P.append(f"""{psect("Coverage by storage bay - RAG rated")}
{pcallout('Green from 90% sighted inside 30 days, amber from 75%, red below - the same RAG discipline as every Coates report. <b>Due</b> counts items outside their own tier target, so a red bay tells you exactly where the trolley goes next.')}
{sh.dtable(["Storage bay (ranked by items)", "Items", "Sighted 30d", "Due (tier target)", "Priced value"],
           urows, ["", "r", "r", "r", "r"])}
{pnote((f'Plus {len(rest)} smaller bays holding {num(sum(u["n"] for u in rest))} items between them - full detail in the staff worklist. ' if rest else '') + 'Bays are the item&rsquo;s home storage unit from the live register; on-hire items are excluded from bay coverage.')}""")

    # ---- P3b the store map - every bay coloured by its 30-day coverage --
    P.append(bay_map_page(a, d))

    # ---- P4 the two tails: shelf cleared, on-hire watched ---------------
    ins_bars = band_bars([(lab, n) for lab, n, v in a["idle_ins"]])
    n_31_60 = next((n for lab, n, v in a["idle_ins"] if lab == "31-60 days"), 0)
    pn = d.get("price_notes", {})
    oh_rows = [[lab, num(n), money(v) if v else '<span class="tbc">unpriced</span>']
               for lab, n, v in a["idle_oh"] if n]
    P.append(f"""{psect("The idle tail - where the risk actually sits")}
{pcallout(f'The risk is never the gear that moves - it is the gear that sits. On the shelf, <b class="rd">{num(len(a["ins_over30"]))} of {num(len(d["instore"]))} in-store items ({len(a["ins_over30"]) / max(len(d["instore"]), 1) * 100:.0f}%)</b> are outside the 30-day SOP - most of them, {num(n_31_60)}, only just, at 31-60 days'
          + (f'; the oldest is <b>{num(a["ins_oldest"])} days</b>' if not a["ins_never"] else f', <b class="rd">{num(a["ins_never"])} never sighted</b>')
          + f'. The watch item is <b class="o">long-hire gear</b>: {num(len(a["oh_risk180"]))} on-hire items have had no scan of any kind in over 180 days, holding <b class="o">{money(a["oh_risk180_val"])}</b> of priced value. They are verified at return and at shutdown checks; every one is listed, oldest first, on the <b>Long hires 180d+</b> tab of the workbook.')}
{psubh("In-store items by time since last sighting", "- the shelf tail")}
{chartpanel(ins_bars)}
{psubh("On-hire items by time since last verification", "- the long-hire tail")}
{sh.dtable(["Bucket", "Items on hire", "Priced value"], oh_rows, ["", "r", "r"])}
{pnote(f'On-hire gear is not shelf-counted - verification comes from the double-scan return process and shutdown checks, so a long bucket here is a long hire, not a lost item. It is watched because long-idle gear is where shrinkage hides. Values from the pricing master; <b>{num(d["unpriced_lines"])} of {num(d["countable"])} lines are unpriced</b> and left out of every value, <b>never estimated</b> - listed on the Pricing Gaps tab of the worklist workbook.')}""")

    # ---- P5 on-hire verification ---------------------------------------
    oc = a["onhire_co"][:10]
    orows = [[esc(x["co"]), num(x["n"]),
              (f'<span class="a">{num(x["due"])}</span>' if x["due"] else
               '<span class="g">0</span>'),
              money(x["val"]) if x["val"] else '<span class="tbc">unpriced</span>']
             for x in oc]
    P.append(f"""{psect("On hire - verified on return, not hunted on shelves")}
{pcallout(f'<b>{num(len(d["onhire"]))} items</b> show ON HIRE on the register, holding <b>{money(d["val_onhire"])}</b> of priced value - {num(len(d["onhire"]) - a["custody_n"])} out with contractors and {num(a["custody_n"])} on the repairs and Dr&auml;ger service accounts. On-hire gear is verified through the double-scan return process and shutdown checks - chasing it around site during a count would be friction for no assurance. <b class="o">{num(len(d["missed_returns"]))} possible missed returns</b> (sighted in a store bay after their on-hire date) are flagged to resolve first, so hirers are never held for gear that is already home.')}
{sh.dtable(["Company (ranked by items on hire)", "Items on hire", "Not scanned in 30 days", "Priced value"],
           orows, ["", "r", "r", "r"])}
{pnote(f'Ranked by items on hire - the one ranked table on this page. Companies are merged across the register&rsquo;s spellings (the refinery legal name and the site&rsquo;s former account both read Ampol; project accounts such as FCCU and SATGAS/MOL roll into their parent). "Not scanned in 30 days" is an item whose latest scan of any kind is older than 30 days - a long hire, not a lost item. Gas monitors on the Dr&auml;ger and Future Fuels lines are priced at the master&rsquo;s family line for the Dr&auml;ger X-am 5000 ($2,000 each), so those two values are exact multiples. Top {len(oc)} of {len(a["onhire_co"])} accounts shown.')}
{sh.tiles([
    ("swap", num(len(d["onhire"])), "Items on hire", "", ""),
    ("warn", num(len(d["onhire_due30"])), "Not scanned in 30 days",
     "verify on next return", "amber" if d["onhire_due30"] else "green"),
    ("warn" if d["missed_returns"] else "check", num(len(d["missed_returns"])), "Possible missed returns",
     "listed on the next page", "red" if d["missed_returns"] else "green"),
    ("shield", money(d["val_onhire"]), "Value on hire", "priced lines only", ""),
])}""")

    # ---- P5b the possible missed returns, itemised (07 Nov 2026, QA F21) --
    mr = sorted(d["missed_returns"], key=lambda r: r["last"] or datetime.min, reverse=True)
    if mr:
        cap = 22
        mrows = [[esc(r["barcode"].upper()), esc(r["desc"]), esc(r["unit"]), esc(r["onhire_to"] or "-"),
                  esc(r["ohd"].strftime("%d %b %Y")) if r["ohd"] else "-",
                  esc(r["last"].strftime("%d %b %Y")) if r["last"] else "-"] for r in mr[:cap]]
        more = (f' The first {cap} are shown; all {num(len(mr))} are on the <b>Possible missed returns</b> tab of the workbook.'
                if len(mr) > cap else "")
        P.append(f"""{psect(f"Possible missed returns - {num(len(mr))} to resolve today")}
{pcallout(f'Each of these shows <b>ON HIRE</b> on the register, yet was sighted in a store bay <b>after</b> its on-hire date - most likely a return that was never scanned. The store team locates each one, confirms it is home and processes the return the same day, so no hirer is held for gear that is already back.{more}')}
{sh.dtable(["Barcode", "Item", "Sighted in", "On hire to", "On hire since", "Sighted"], mrows,
           ["nw", "", "nw", "", "nw", "nw"], cls="cp")}""")

    # ---- P6 the trend - only once seven days are on record ---------------
    tp = trend_page(export_dt, d, a, ins_pct)
    if tp:
        P.append(tp)

    # ---- P6b fast movers - what the counter handles most (03 Sep 2026) --
    if fm is not None:
        P.append(fast_movers_page(fm, a, tx_window))

    # ---- P7 close -------------------------------------------------------
    cards = sh.info_cards([
        ("Two scans, two looks",
         "Every item is scanned <b>and</b> sighted going out, and scanned and "
         "sighted coming back. If it moved, it is on the record - that is your "
         "protection as much as ours."),
        ("A 2-day standard, above the SOP",
         "The SOP asks for a 30-day cycle. Coates sets gas monitors, radios, "
         "radio batteries, Milwaukee tools and Milwaukee batteries on a "
         "<b>2-day</b> standard - an internal standard set above the contract."),
        ("Numbers you can challenge",
         "Every score prints its own arithmetic. Values are Avg Buy Price (New) "
         "from the pricing master; serial-numbered gas monitors and radios take their "
         f"family line; the {num(d['unpriced_lines'])} unpriced lines are left out, "
         "<b>never estimated</b>. SiteIQ still carries the site&rsquo;s former "
         f"name on {num(d['former_name_lines'])} of the {num(d['countable'])} countable lines"
         + (f" ({num(REGISTER_FORMER[0])} across the whole register)" if REGISTER_FORMER[0] else "")
         + " - shown here under the current name."),
        ("Idle stock is the target",
         "Movement resets the clock, so the count cadence naturally hunts the "
         "gear that sits still - the gear that goes missing quietly."),
        ("Life Saving Rule 5",
         "Tools and Equipment (SEQ-GL-009): nothing damaged, defective or out "
         "of test date is ever reissued. The standard: a stock take every day."),
        ("Ease of doing business",
         "One register, one cadence, one report - and a store team that "
         "resolves a query while you are still at the counter."),
    ])
    n_days = history_days("stocktake", export_dt)
    trend_line = (f'The trend chart starts once seven days of reports are on record ({num(n_days)} so far).'
                  if n_days < 7 else
                  f'{num(n_days)} days of reports are on record - the 30-day trend is on its own page.')
    gl = d.get("ghost_lines", [])
    ghost_line = (f' {num(len(gl))} stocktake line{"s" if len(gl) != 1 else ""} with the barcode written in the description '
                  f'column ({", ".join(esc(g["barcode"]) for g in gl[:4])}) {"are" if len(gl) != 1 else "is"} left out - '
                  f'each barcode has its own line, sighted since.' if gl else "")
    pn = d.get("price_notes", {})
    price_line = (f' One printed description carries one price: {num(pn.get("filled_lines", 0))} lines take the price of the same '
                  f'item&rsquo;s other spelling in the master, and {num(len(pn.get("conflicts", [])))} descriptions with two prices in '
                  f'the master take the most common one - listed for Andrew to confirm.' if pn else "")
    # WHY (03 Sep 2026): the transaction log is a source now (the fast-movers
    # page) - named here with the others, with its own report period.
    tx_src = (f", TRANSACTIONS (CUSTOMER_CONTRACTOR_EQUIP, {tx_window[0]:%d %b} to {tx_window[1]:%d %b %Y}; fast movers)"
              if tx_window and tx_window[0] else "")
    P.append(f"""<div class="close">{psect("The data page - where these numbers come from")}
{pnote(f'Sources: SiteIQ STOCKTAKE export ({esc(export_dt.strftime("%d %b %Y %H:%M"))}), RENTAL_STOCK register, pricing master{tx_src}.{ghost_line}{price_line} {trend_line}')}
{psubh("The tool store has your back")}
{cards}
{sh.coates_way_panel(traits=(5, 4), disciplines=(6, 5), line="one documented count standard, worked every day; a shelf item unsighted past its cycle is a workaround flagged, not normalised")}
{psect("Meet the tool store team")}
{sh.team_cards(CONFIG["team"])}</div>""")
    return P


def fast_movers_page(fm, a, tx_window):
    """Fast movers (03 Sep 2026): the 20 barcodes the transaction log shows
    the counter handling most this year, ranked by movements, with the bay
    each sits in now and the bays those movements come from. The whole
    store is the scope because the count covers everything. Every figure
    is a count of rows in the export; nothing is modelled. The bay-map
    line joins on the storage-unit name both pages already use - left out
    when no bay on the bars is an in-store bay on the map. One fixed A4
    page: twenty one-line rows, the SiteIQ status in its short word."""
    rows = fm["rows"]
    w0, w1 = tx_window if tx_window and tx_window[0] else (None, None)
    since = f"since {w0:%d %b}" if w0 else "this year"
    nd = '<span class="tbc">-</span>'
    status_word = {"available for hire": "Available", "on hire": "On hire"}
    trows = [[num(i), esc(r["barcode"].upper()), esc(r["desc"]), esc((r["unit"] or "").upper()) or nd,
              esc(status_word.get(r["status"].lower(), r["status"])) or '<span class="tbc">not on the register</span>',
              num(r["moves"]), esc(r["last"].strftime("%d %b %H:%M"))] for i, r in enumerate(rows, 1)]
    if not trows:
        trows = [['<span class="tbc">no movements in the log</span>', "", "", "", "", "", ""]]
    top_moves = sum(r["moves"] for r in rows)
    bays = Counter((r["unit"] or "(no bay)").upper() for r in rows)
    top_bay, top_bay_n = bays.most_common(1)[0] if bays else ("(no bay)", 0)
    # bay names in one case, as on every other page ('Shutdown' and 'SHUTDOWN' are one bay)
    _bu = Counter()
    for u, n in fm["by_unit"]:
        _bu[str(u or "(no bay)").upper()] += n
    by_unit = _bu.most_common(12)
    bars = [(u, n, num(n)) for u, n in by_unit]
    cov = {u["unit"]: u for u in a["units"]}
    joined = [(u, cov[u]) for u, _ in by_unit if u in cov][:3]
    map_line = ""
    if joined:
        map_line = (" On the bay map: " + "; ".join(
            f"<b>{esc(u)}</b> {num(c['n'])} in-store items, {c['pct']:.0f}% sighted inside 30 days" for u, c in joined) + ".")
    period = f"report period {w0:%d %b %Y %H:%M} to {w1:%d %b %Y %H:%M}" if w0 else "the whole export"
    where = (f"all {num(len(rows))}" if top_bay_n == len(rows) else f"{num(top_bay_n)} of the {num(len(rows))}")
    n_oh = sum(1 for r in rows if (r["unit"] or "(no bay)").upper() == top_bay and r["status"].lower() == "on hire")
    oh_txt = (f" ({num(n_oh)} of them are on hire today)" if n_oh else "")
    # WHY (07 Nov 2026, QA F24): one bay can dwarf the rest; it is named with
    # its count and the bars show the next bays at a scale that reads
    if len(bars) > 2 and bars[0][1] > 4 * bars[1][1]:
        first = bars[0]
        bars = bars[1:]
        bars_note = f"{esc(first[0])}: {num(first[1])} movements - off the scale, so the bars show the next {len(bars)} bays"
    else:
        bars_note = f"top {len(bars)} bays, ranked by movements in the log"
    return f"""<div class="fm">{psect("Fast movers - what the counter handles most")}
{pcallout(f'<span class="lead">Ranked by movements.</span> The <b>{num(len(rows))} barcodes</b> below are the ones the log shows the counter handling most {since} - <b>{num(top_moves)}</b> movements between them, of <b>{num(fm["items_moved"])}</b> barcodes that moved at all; {where} have <b>{esc(top_bay)}</b> as their home bay{oh_txt}.')}
{sh.dtable(["Rank", "Barcode", "Description", "Bay", "Status", "Moves", "Last movement"], trows,
           ["r", "nw", "", "nw", "nw", "r", "nw"], cls="cp")}
{psubh("Movements by bay", "- " + bars_note)}
<div class="chartpanel" style="padding:10px 17px;margin-top:8px">{sh.hbars(bars, rowh=13)}</div>
{pnote(f'<b>So what:</b> the fast movers&rsquo; bays are where a daily sighting pays most - one walk past {esc(top_bay)} resets the clock on the gear the counter handles every day.{map_line}')}
{pnote(f'Bay and status: the live register at the pull (bay = home storage unit); last movement: the newest scan in the log. Counted from TRANSACTIONS (sheet CUSTOMER_CONTRACTOR_EQUIP, {period}) joined to RENTAL_STOCK by barcode; a movement is one issue or one return scan.')}</div>"""

def trend_page(export_dt, d, a, ins_pct):
    """The fixed trend page: SOP compliance (whole store and the shelf)
    and the counting activity over the last 30 days, from the History
    scoreboard. Empty until seven days are on record - the data page says
    so - and every point is a figure a report printed on that day."""
    if history_days("stocktake", export_dt) < 7:
        return ""
    today = {"comp30": round(d["comp30"], 1), "instore_comp": round(ins_pct, 1),
             "done7": len(d["done7"]), "missed_returns": len(d["missed_returns"])}
    labels, ser, days = trend_rows("stocktake", export_dt, today)
    if len(days) < 2:
        return ""
    first, last = days[0].strftime("%d %b"), days[-1].strftime("%d %b %Y")

    def cell(v, pct=False):
        if v is None:
            return '<span class="tbc">no run</span>'
        return f"{v:.1f}%" if pct else num(v)
    trows = [[dd.strftime("%d %b %Y"), cell(ser["comp30"][i], True), cell(ser["instore_comp"][i], True),
              cell(ser["done7"][i]), cell(ser["missed_returns"][i])]
             for i, dd in enumerate(days)][-6:]
    return f"""{psect("The trend - last 30 days")}
{pcallout(f'<b>{num(len(days))} days on record</b> between {esc(first)} and {esc(last)}, read back from {HIST_NAME} - every point is a figure a report printed on that day, nothing interpolated; a day with no run leaves a gap. The one question a single day cannot answer: is the count getting better or worse?')}
{psubh("SOP compliance", "- items sighted inside 30 days, whole store and the shelf")}
{chartpanel(sh.line_chart(labels, [("Whole store SOP 30d", ser["comp30"]), ("In-store SOP 30d", ser["instore_comp"])], y_label="% inside 30 days", pct=True, h=148))}
{psubh("Counting activity", "- items sighted in the last 7 days, and possible missed returns")}
{chartpanel(sh.line_chart(labels, [("Sighted last 7 days", ser["done7"]), ("Possible missed returns", ser["missed_returns"])], y_label="items", h=148))}
{sh.dtable(["Day (last " + str(len(trows)) + " on record)", "Whole store SOP 30d", "In-store SOP 30d", "Sighted last 7 days", "Possible missed returns"], trows, ["", "r", "r", "r", "r"], cls="cp")}
{pnote('The scoreboard holds exactly what each day&rsquo;s report printed - the same figures as the position page of that day&rsquo;s PDF. Numbers, not lines, are the record.')}"""


_ASAT = [None]
# the scoreboard's path as the pages print it (a backslash cannot sit inside an
# f-string expression on the store laptops' Python)
HIST_NAME = "History\\report_history.json"


def mv(key, value, good, fallback, fallback_cls):
    """(note, class) for a tile: recorded movement when an earlier day
    exists, otherwise the plain note. Never an invented arrow."""
    txt, cls = rh.movement("stocktake", key, _ASAT[0], value, good,
                           money=key.startswith("val_"))
    return (txt, cls) if txt else (fallback, fallback_cls)


def rag_band_stocktake(d, a, export_dt):
    C = CONFIG
    ins = len(d["instore"]) or 1
    pct = d["ok30_instore"] / ins * 100
    status = sh.rag_of(pct, C["rag_amber_from"], C["rag_green_from"], higher_is_worse=False)
    # rag_of with higher_is_worse=False reads: red at or under red_at (amber_from),
    # amber at or under amber_at (green_from) - so map the thresholds explicitly
    status = "green" if pct >= C["rag_green_from"] else "amber" if pct >= C["rag_amber_from"] else "red"
    due = (export_dt + timedelta(days=7)).strftime("%d %b %Y")
    late = len(a["ins_over30"])
    head = (f'<b class="o">{pct:.1f}%</b> of the {num(ins)} in-store items were sighted inside the 30-day SOP; '
            f'<b>{num(late)}</b> shelf items are outside it (oldest {num(a["ins_oldest"])} days) and '
            f'<b>{num(len(d["missed_returns"]))}</b> possible missed returns are flagged.')
    rule = (f'In-store items sighted inside 30 days: Green from {C["rag_green_from"]}%, Amber from '
            f'{C["rag_amber_from"]}%, Red below. On-hire items are rated separately (verified on return). '
            f'')
    owner = "<b>Andrew Fisher</b>, Shutdown Manager - Coates tool store"
    action = (f'The {num(late)} shelf items on the daily worklist, oldest first, cleared by <b>{due}</b>; '
              f'missed returns resolved same day.')
    # the same facts travel to the cover stripe, the phone card and the
    # History scoreboard - one status, never a second opinion
    return {"status": status, "html": sh.rag_band(status, head, rule, owner, action),
            "headline": plain(head), "rule": plain(rule), "owner": "Andrew Fisher, Shutdown Manager",
            "action": plain(action), "due": due, "pct": pct, "late": late,
            "asat_day": export_dt.strftime("%d %b %Y")}


def store_layout(units):
    r"""(layout dict, source) - Data\store_layout.json when present, else an
    A-to-Z grid; a template is written beside the data so the floor plan
    can be typed in once."""
    # WHY (03 Sep 2026): the layout is Andrew's to type in, so it lives in
    # Data\Editable; a copy still sitting in the Data root is honoured
    data_dir = Path(ampol_paths.editable_dir()) if hasattr(ampol_paths, "editable_dir") else BASE / "Data"
    legacy_dir = Path(ampol_paths.data_dir()) if hasattr(ampol_paths, "data_dir") else BASE / "Data"
    cols = CONFIG["map_columns"]
    names = sorted((u["unit"] for u in units), key=lambda x: x.upper())
    auto = {"columns": cols, "bays": {n: [i // cols, i % cols] for i, n in enumerate(names)}}
    tpl = data_dir / "store_layout.template.json"
    try:
        tpl.write_text(json.dumps({"_how": "Rename to store_layout.json. Give each bay a [row, column] on "
                                            "the grid to match the floor; columns sets the grid width. "
                                            "Bays not listed are added A to Z at the end.",
                                   **auto}, indent=1), encoding="utf-8")
    except OSError:
        pass
    real = data_dir / "store_layout.json"
    if not real.exists() and (legacy_dir / "store_layout.json").exists():
        real = legacy_dir / "store_layout.json"
    if real.exists():
        try:
            lay = json.loads(real.read_text(encoding="utf-8"))
            bays = {k: v for k, v in lay.get("bays", {}).items() if isinstance(v, list) and len(v) == 2}
            cols = int(lay.get("columns", cols)) or cols
            used = {tuple(v) for v in bays.values()}
            nxt = (max((r for r, _ in used), default=-1) + 1, 0)
            for n in names:
                if n not in bays:
                    while nxt in used:
                        nxt = (nxt[0] + (nxt[1] + 1) // cols, (nxt[1] + 1) % cols)
                    bays[n] = list(nxt); used.add(nxt)
            return {"columns": cols, "bays": bays}, "Data\\store_layout.json"
        except (OSError, ValueError):
            pass
    return auto, "auto"


def bay_map_svg(units, layout, w=636):
    cols = layout["columns"]
    by_name = {u["unit"]: u for u in units}
    cells = [(n, rc) for n, rc in layout["bays"].items() if n in by_name]
    if not cells:
        return '<div class="note">No in-store bays to map.</div>'
    rows = max(r for _, (r, _) in cells) + 1
    cw = (w - 8) / cols
    ch = 46
    h = rows * (ch + 6) + 6
    out = [f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    for n, (r, c) in cells:
        u = by_name[n]
        pct = u["pct"]
        fill = "#409A55" if pct >= CONFIG["rag_green_from"] else "#E08A24" if pct >= CONFIG["rag_amber_from"] else "#D0342C"
        x, y = 4 + c * cw, 4 + r * (ch + 6)
        out.append(f'<rect x="{x + 2:.1f}" y="{y}" width="{cw - 4:.1f}" height="{ch}" rx="7" fill="{fill}" opacity="0.92"/>')
        # WHY (07 Nov 2026, QA F14): the whole bay name, on two lines when it
        # needs them - never cut off with an ellipsis
        words, lines_, cur = n.split(), [], ""
        for wd in words:
            if cur and len(cur) + 1 + len(wd) > 15:
                lines_.append(cur); cur = wd
            else:
                cur = (cur + " " + wd).strip()
        lines_.append(cur)
        if len(lines_) > 2:
            lines_ = [lines_[0], " ".join(lines_[1:])]
        tcol = "#1D1D1B" if fill == "#E08A24" else "#FFFFFF"
        fs = 7.6 if any(len(l) > 15 for l in lines_) else 8.2
        for li, l in enumerate(lines_):
            ly = y + (13 if len(lines_) == 2 else 18) + li * 10
            out.append(f'<text x="{x + cw / 2:.1f}" y="{ly}" text-anchor="middle" fill="{tcol}" '
                       f'font-family="Lato, Calibri, sans-serif" font-size="{fs}" font-weight="700">{esc(l)}</text>')
        out.append(f'<text x="{x + cw / 2:.1f}" y="{y + 38}" text-anchor="middle" fill="{tcol}" '
                   f'font-family="Lato, Calibri, sans-serif" font-size="7.6">{num(u["n"])} item{"" if u["n"] == 1 else "s"} · {pct:.0f}%</text>')
    out.append("</svg>")
    return "".join(out)


def bay_map_page(a, d):
    units = a["units"]
    layout, src = store_layout(units)
    g = sum(1 for u in units if u["pct"] >= CONFIG["rag_green_from"])
    am = sum(1 for u in units if CONFIG["rag_amber_from"] <= u["pct"] < CONFIG["rag_green_from"])
    rd = len(units) - g - am
    how = ("laid out to the store's floor plan" if src != "auto" else
           "laid out <b>A to Z</b> (the floor-plan layout has not been set up yet)")
    onhire_bay = next((u for u in units if u["unit"].upper() == "ON HIRE"), None)
    oh_note = (f' The tile named <b>ON HIRE</b> is a SiteIQ storage unit holding {num(onhire_bay["n"])} item'
               f'{"" if onhire_bay["n"] == 1 else "s"} the register shows as available - a storage-unit name, not a hire status.'
               if onhire_bay else "")
    title = ("The store map - every bay coloured by its 30-day coverage" if src != "auto" else
             "The store by bay - every bay coloured by its 30-day coverage")
    return f"""{psect(title)}
{pcallout(f'One look at the floor: <b class="g">{num(g)} bays green</b>, <b class="a">{num(am)} amber</b>, <b class="rd">{num(rd)} red</b> out of {num(len(units))} in-store bays. Green from {CONFIG["rag_green_from"]}% of the bay&rsquo;s items sighted inside 30 days, amber from {CONFIG["rag_amber_from"]}%, red below - the same lines as the RAG band on page 2. Each tile prints its item count and its coverage, so the colour can be checked.')}
<div class="chartpanel">{bay_map_svg(units, layout)}</div>
{pnote(f'Bays are {how}. Every bay with at least one in-store item is shown; the item count is the live register&rsquo;s home storage unit for in-store items, on-hire items excluded.{oh_note} Numbers, not colours, are the record.')}"""


# =====================================================================
# TEAM PDF
# =====================================================================

def build_team_pages(rows, d, a, export_dt):
    P = []
    ins = d["instore"]
    oncyc = a["on_cycle_pct"]
    comp = d["comp30"]
    due_all = sum(len(d["due"][k]) for k in eng.TIERS)

    # ---- T1 the wheel ---------------------------------------------------
    g_all, g_seen, g_miss = a["gas"]
    r_all, r_seen, r_miss = a["radio"]
    b_all, b_seen, b_miss = a["battery"]
    band_t = rag_band_stocktake(d, a, export_dt)
    P.append(f"""{pcallout(
        f'<span class="lead">This one is yours.</span> The client report rates the shelf '
        f'<b class="{ "g" if band_t["status"] == "green" else "a" if band_t["status"] == "amber" else "rd"}">'
        f'{band_t["status"].upper()}</b>: {band_t["pct"]:.1f}% of in-store items sighted inside the 30-day SOP. '
        f'This is the work that turns it green. <b>{num(len(d["done30"]))} items</b> have '
        f'been sighted in the last 30 days, <b class="o">{num(len(d["done7"]))} '
        f'in the last 7</b>, and right now <b class="o">{oncyc:.0f}% of the '
        f'{num(len(ins))} in-store items are inside their own tier cycle</b>. '
        f'The wheel doesn&rsquo;t turn itself - it&rsquo;s turned by the people '
        f'on this page.', False)}
<table class="two" style="margin-top:14px"><tr>
  <td style="width:50%" align="center"><div class="donut-wrap">
    {sh.donut(round(oncyc), sh.health_hex(round(oncyc)), f"{oncyc:.0f}%", "ON CYCLE")}
    <div class="donut-cap">In-store items inside their tier cycle ({eng.fast_cycles()}/{eng.TIERS['general'][1]}d)</div></div></td>
  <td style="width:50%" align="center"><div class="donut-wrap">
    {sh.donut(round(comp), sh.health_hex(round(comp)), f"{comp:.0f}%", "SOP 30D")}
    <div class="donut-cap">Whole store against the 30-day SOP</div></div></td>
</tr></table>
{sh.tiles([
    ("check", num(len(d["done7"])), "Sighted last 7 days", f"{d['done7_from']:%d %b} to {export_dt:%d %b}", ""),
    ("clock", num(a["seen24"]),
     "In the last 24 hours", "items sighted", ""),
    ("warn", num(due_all), "Due on tier targets",
     "the worklist attached", "red" if due_all else "green"),
    ("bars", num(len(a["ins_over30"])), "In-store over 30 days",
     (f"oldest {a['ins_oldest']}d" if not a["ins_never"] else f"{a['ins_never']} never sighted"),
     "amber" if a["ins_over30"] else "green"),
])}
{pnote(f'On-cycle = in-store items sighted inside their own tier target = {num(a["within_target"])} &divide; {num(len(ins))} = <b>{oncyc:.0f}%</b>. SOP = sighted within 30 days = {num(d["ok30"])} &divide; {num(d["countable"])} = <b>{comp:.1f}%</b>.')}""")

    # ---- T2 the people --------------------------------------------------
    lg = a["league"][:10]
    lrows = []

    def share_txt(n):
        sh_ = n / a["done30_total"] * 100 if a["done30_total"] else 0
        return f"{sh_:.0f}%" if abs(sh_ - round(sh_)) < 0.05 else f"{sh_:.1f}%"
    for x in lg:
        lrows.append([esc(x["name"]), num(x["d7"]), num(x["d30"]),
                      num(x["st30"]), share_txt(x["d30"]),
                      esc(x["last"].strftime("%d %b %H:%M") if x["last"] else "")])
    un = a.get("league_unnamed", {})
    if un.get("d30"):
        lrows.append(['<span class="tbc">No name on the scan</span>', num(un["d7"]), num(un["d30"]),
                      num(un["st30"]), share_txt(un["d30"]), ""])
    rest = a["league"][10:]
    if rest:
        lrows.append([f'<span class="tbc">{num(len(rest))} more people</span>', num(sum(x["d7"] for x in rest)),
                      num(sum(x["d30"] for x in rest)), num(sum(x["st30"] for x in rest)),
                      share_txt(sum(x["d30"] for x in rest)), ""])
    lrows.append(["<b>Total</b>", f"<b>{num(len(d['done7']))}</b>", f"<b>{num(a['done30_total'])}</b>",
                  f"<b>{num(sum(x['st30'] for x in a['league']) + un.get('st30', 0))}</b>", "<b>100%</b>", ""])
    P.append(f"""{psect("The people turning the wheel")}
{pcallout('Every sighting in the register carries a name. This is who made the <b>latest</b> sighting of each item in the last 30 days - stocktake scans separated from movement scans, because walking a bay with a scanner is the work that finds idle gear.')}
{sh.dtable(["Who (ranked by items, last 30d)", "Items, last 7d", "Items, last 30d", "Of which stocktake scans", "Share of 30d", "Most recent scan"],
           lrows, ["", "r", "r", "r", "r", "r"])}
{pnote('The export keeps one sighting per item - the latest - so these are items whose most recent scan carries this name, not every scan the person made. Share is of all items sighted in the last 30 days. Movement scans (issues and returns) also reset an item&rsquo;s clock - both count, both are the wheel turning.')}
{psubh("Items by day of latest sighting", "- last 14 days, stocktake scans highlighted")}
{chartpanel(sh.grouped_bars(a["days14"], h=190,
                            series=(("issued", K["orange"], "All sightings"),
                                    ("returned", "#409A55", "Stocktake scans"))))}""")

    # ---- T3 the daily three ---------------------------------------------
    def miss_table(missed, cap=7):
        rows_ = []
        # oldest sighting first, never-sighted on top - in time order to the minute
        missed = sorted(missed, key=lambda r: (r["last"] is not None, r["last"] or datetime.min))
        for r in missed[:cap]:
            last = (r["last"].strftime("%d %b %H:%M") if r["last"] else
                    '<span class="rd">NEVER</span>')
            days_txt = ("never" if r["days"] is None else f'{r["days"]}d ago')
            rows_.append([
                f'{esc(r["desc"])}<span class="s2">{esc(r["unit"])}</span>',
                esc(r["barcode"]),
                f'{last}<span class="s2">{days_txt}</span>',
                esc(r["by"] or "-")])
        t = sh.dtable(["Item", "Barcode", "Last sighted", "By"], rows_,
                      ["", "", "", ""])
        past = sum(1 for r in missed if r["days"] is None or r["days"] > r["target"])
        lead_ = (f"... and <b>{num(len(missed) - cap)}</b> more not sighted in the last 24 hours. " if len(missed) > cap else "")
        if not missed:
            more = ""
        elif past == len(missed):
            more = pnote(f"{lead_}" + ("It is past the 2-day standard and on the worklist." if past == 1 else
                                        f"All <b>{num(past)}</b> missed in 24 hours are past the 2-day standard and on the worklist."))
        else:
            more = pnote(f"{lead_}<b>{num(past)} of the {num(len(missed))}</b> missed in 24 hours "
                         f"{'is' if past == 1 else 'are'} past the 2-day standard and on the worklist; "
                         f"the other {num(len(missed) - past)} {'was' if len(missed) - past == 1 else 'were'} sighted inside 2 days.")
        return t + more

    g_all, g_seen, g_miss = a["gas"]
    r_all, r_seen, r_miss = a["radio"]
    b_all, b_seen, b_miss = a["battery"]
    P.append(f"""{psect("Gas monitors, radios and batteries - the 2-day standard")}
{pcallout(f'Gas monitors, radios and radio batteries are sighted on the <b>2-day standard</b> (Milwaukee tools follow the same cycle on the worklist). Gas monitors keep people alive, radios keep the site talking, and batteries go missing first. The tiles show the last 24 hours for the units <b>in store</b> (on-hire units are out with their hirers); the note under each table says how many are past the 2-day standard - <b>{num(len(a["gas_past"]))} gas monitors and {num(len(a["radio_past"]) + len(a["battery_past"]))} radios and batteries</b>, the same figures as the client scorecard. Chargers and probes are not monitors and are not counted here.')}
{sh.tiles([
    ("warn", f"{len(g_seen)}/{len(g_all)}", "In-store gas monitors sighted 24h",
     f"{len(g_miss)} missed" if g_miss else "all sighted",
     "red" if g_miss else "green"),
    ("warn", f"{len(r_seen)}/{len(r_all)}", "In-store radios sighted 24h",
     f"{len(r_miss)} missed" if r_miss else "all sighted",
     "red" if r_miss else "green"),
    ("warn", f"{len(b_seen)}/{len(b_all)}", "In-store radio batteries sighted 24h",
     f"{len(b_miss)} missed" if b_miss else "all sighted",
     "red" if b_miss else "green"),
    ("bars", num(len(g_seen) + len(r_seen) + len(b_seen)),
     "All three, sighted 24h", f"of {num(len(g_all) + len(r_all) + len(b_all))} in store", "grey"),
])}
{psubh(f"Gas monitors in store - missed in the last 24h ({len(g_miss)})")}
{miss_table(g_miss)}""")
    P.append(f"""{psubh(f"Radios in store - missed in the last 24h ({len(r_miss)})")}
{miss_table(r_miss)}
{psubh(f"Radio batteries in store - missed in the last 24h ({len(b_miss)})")}
{miss_table(b_miss)}""")

    # ---- T4 point the trolley -------------------------------------------
    ut = sorted(a["units"], key=lambda u: -u["due"])[:14]
    urows = [[esc(u["unit"]), num(u["n"]), num(u["due"]),
              f'<span class="{ragc(u["pct"])}">{u["pct"]:.0f}%</span>',
              ("never" if u["oldest"] >= 99999 else f'{u["oldest"]}d')]
             for u in ut if u["due"]]
    P.append(f"""{psect("Where to point the trolley - due items by bay")}
{pcallout('Clear a bay at a time - it is faster, it is auditable, and the register RAG turns green a whole shelf at a stretch. Bays ranked by due count; <b>oldest</b> is the longest-unsighted item in the bay.')}
{sh.dtable(["Storage bay (ranked by due items)", "Items", "Due now", "Sighted 30d", "Oldest"],
           urows, ["", "r", "r", "r", "r"])}
{pnote(f'Due = outside the item&rsquo;s own tier target ({eng.fast_cycles()}/{eng.TIERS["general"][1]} days). Full item-by-item detail is the printed worklist and the Excel workbook - this page is the map, those are the streets.')}""")

    # ---- T5 the two lists: shelf residue + long-hire verify -------------
    lrows2 = []
    for r in a["longest"]:
        if r["days"] is not None and r["days"] <= 30:
            continue
        last = (r["last"].strftime("%d %b %Y") if r["last"] else
                '<span class="rd">NEVER SIGHTED</span>')
        lrows2.append([
            f'{esc(r["desc"])}<span class="s2">{esc(r["unit"])}</span>',
            esc(r["barcode"]),
            f'{last}<span class="s2">{esc(r["by"] or "")}</span>',
            ('<span class="rd">never</span>' if r["days"] is None else
             f'<span class="{"rd" if r["days"] > 60 else "a"}">{num(r["days"])}d</span>')])
    ohrows = []
    for r in a["oh_longest"]:
        last = (r["last"].strftime("%d %b %Y") if r["last"] else
                '<span class="rd">NEVER</span>')
        ohrows.append([
            f'{esc(r["desc"])}<span class="s2">{esc(r["onhire_to"] or "-")}</span>',
            esc(r["barcode"]),
            last,
            ('<span class="rd">never</span>' if r["days"] is None else
             f'<span class="rd">{num(r["days"])}d</span>'),
            money(r["value"]) if r["value"] else '<span class="tbc">TBC</span>'])
    n_31_60 = next((n for lab, n, v in a["idle_ins"] if lab == "31-60 days"), 0)
    P.append(f"""{psect("The shelf residue - " + num(len(a["ins_over30"])) + " items over 30 days, oldest first")}
{pcallout(f'<b class="rd">{num(len(a["ins_over30"]))} in-store items</b> are over 30 days - {num(n_31_60)} of them only just, at 31-60 days'
          + (f', oldest <b>{num(a["ins_oldest"])} days</b>' if not a["ins_never"] else f', <b class="rd">{num(a["ins_never"])} never sighted</b>')
          + f'. Clear these and the shelf RAG goes green wall to wall.'
          + (f' Also on the list: <b>{num(len(d["not_on_register"]))}</b> stocktake lines whose barcode is not on the live register'
             + (' (' + ', '.join(esc(r["barcode"] or r["desc"]) for r in d["not_on_register"][:4]) + ')' if d["not_on_register"] else '')
             + ' - check the barcode and the register, not the shelf.' if d["not_on_register"] else ''))}
{sh.dtable(["Item", "Barcode", "Last sighted", "Age"], lrows2, ["", "", "", "r"])}""")
    # WHY (02 Sep 2026): long-hire on its own page - with 17 departed-scan
    # rigging items back on the shelf list, both tables no longer fit one
    # page and Chromium prints the overflow under the footer without a word.
    P.append(f"""{psect("Long-hire gear - verify on next touch")}
{pcallout(f'<b class="o">{num(len(a["oh_risk180"]))} on-hire items</b> have had no verification scan in 180+ days, holding <b class="o">{money(a["oh_risk180_val"])}</b>. Not lost - on long hire - but every return, swap or shutdown check on these is a chance to scan one and retire the risk. The oldest dozen:')}
{sh.dtable(["Item", "Barcode", "Last verified", "Age", "Value"],
           ohrows, ["", "", "", "r", "r"])}
{pnote(same_date_note(a["oh_longest"]))}
{pnote(f'Also flagged: <b>{num(len(d["missed_returns"]))} possible missed returns</b> - sighted in a store bay after their on-hire date while still showing ON HIRE. Resolve those first so hirers aren&rsquo;t held for gear that is home; section 0 of the worklist (possible missed returns) lists them.')}""")

    # ---- T6 close --------------------------------------------------------
    cards = sh.info_cards([
        ("The wheel beats the blitz",
         "Twenty minutes of bay-walking a day beats a two-day blitz a quarter. "
         "Movement resets clocks; the cadence hunts what sits still."),
        ("Scan it where it lives",
         "Count an item in its home bay. If it is somewhere else, that is a "
         "finding - move it home or fix the register there and then."),
        ("The daily three are safety, not stock",
         "A gas monitor missing from the shelf is a bump-test conversation, "
         "not a counting error. Same day, every day."),
        ("Say what you can't find",
         "An honest MISSING beats a quiet skip. Flag it, log it, and the "
         "search starts today instead of at contract end."),
    ])
    tx_src_t = ""
    P.append(f"""{psect("How we run the count")}
{cards}
{psect("The data page - where these numbers come from")}
{pnote(f'Sources: SiteIQ STOCKTAKE export ({esc(export_dt.strftime("%d %b %Y %H:%M"))}) - one line per item, its latest sighting; RENTAL_STOCK register (status, hirer, home bay, joined by barcode); pricing master. Activity figures count items by their latest sighting, not every scan made. The client compliance report carries the full data page.')}
{psect("Meet the tool store team")}
{sh.team_cards(CONFIG["team"])}""")
    return P


# extra styling on top of the shared sheet, this report's own. WHY (03 Sep
# 2026): the client closing page (class "close") carries six cards, the
# sources note, the Coates Way panel and the team card - in the house face
# it ran 59 px into the footer, so that page alone runs a touch tighter.
EXTRA_CSS = """
.close .sect { padding: 10px 18px; margin-top: 14px; }
.close .cards td { padding: 10px 15px; }
.close .cd-b { line-height: 1.6; }
.close .cway .img { width: 112px; }
.close .cway .img img { width: 96px; }
.close .team td { padding: 12px 9px 11px 9px; }
.close .note { margin-top: 7px; }
/* 03 Sep 2026: the fast-movers page - twenty ranked rows and the bay bars on one fixed page */
.fm table.dt.cp td { padding: 3px 7px; font-size: 8.8px; line-height: 1.25; }
.fm .sub-h { margin: 12px 0 7px 0; }
.fm .callout.tight { padding: 12px 20px; }
.fm .note { margin-top: 7px; }
"""


# the client pack's closing sections - never listed on the cover
CLOSING_HEADINGS = ("Meet the tool store team",)
REGISTER_FORMER = [0]     # register descriptions still carrying the former site name (all rows)
# a continuation page of a split table - the section is listed once
_CONT_RE = re.compile(r"\((?:continued|(?:[2-9]|[1-9]\d) of \d+)\)$")


def pdf_pages(pdf_path):
    """Page count of a printed PDF, read from its own page tree."""
    raw = open(pdf_path, "rb").read()
    counts = re.findall(rb"/Count\s+(\d+)", raw)
    return max(int(c) for c in counts) if counts else -1


def cover_contents_from_print(doc, pdf_path, html_path, css, closing):
    """First print of the pack, so the cover's "What's inside" block can
    carry page numbers read off the printed pages. WHY (03 Sep 2026): a
    typed-in contents list is a promise pagination can break; these come
    from the PDF itself (pdf_finish.contents_from_pdf). The cover is one
    fixed page, so the second print - the one with the block - paginates
    identically, and main() proves it by comparing the two page counts.
    Continuation pages of a split table and the closing sections stay off
    the block; a long title keeps its first clause so the block holds its
    rows in one column. Returns (rows, page count) - ([], None) when no
    PDF engine printed."""
    heads = [t for lv, t in pdf_finish.headings_from_html(doc) if lv == 1]
    skip = tuple(closing) + tuple(t for t in heads if _CONT_RE.search(t))
    full = doc.replace("</head>", f"<style>{css}</style></head>", 1)
    Path(html_path).write_text(full, encoding="utf-8")
    try:
        Path(pdf_path).unlink()
    except OSError:
        pass
    if not eng.write_pdf_robust(str(html_path), str(pdf_path)) or not Path(pdf_path).exists():
        return [], None
    rows = []
    for t, p in pdf_finish.contents_from_pdf(pdf_path, full, has_cover=True, skip=skip):
        t = re.sub(r"\s*\(1 of \d+\)$", "", t)
        if len(t) > 64 and " - " in t:
            t = t.split(" - ")[0]
        rows.append((t, p))
    return rows, pdf_pages(pdf_path)


def hero_page(cfg, inner, pno, ptot, gen_s, asat_s):
    """The position page behind a cover: page 2 of the pack, but the first
    page of the report proper, so it wears the hero head and the key strip.
    WHY (03 Sep 2026): k2shell.render_page gives the hero to page 1 only,
    and the old build patched the printed page number afterwards - the
    footer carries the number now, so this composes the shell's own parts
    (page1_head, key_strip, footer) with the real page number and patches
    nothing. A render_page(..., hero=True) switch in the shell would
    retire this."""
    head = sh.page1_head(cfg, gen_s, asat_s) + sh.key_strip(cfg) + '<div class="grule"></div>'
    return (f'<div class="page page1"><div class="frame">{head}'
            f'<div class="body">{inner}</div>{sh.footer(cfg, pno, ptot)}</div></div>')


def render_doc(kind, pages, gen_s, asat_s, cover=""):
    """The cover (when there is one) is page 1; the position page behind
    it is page 2 and wears the hero head; every page number is the real
    one, printed in the footer by the shell."""
    cfg = cfg_for(kind)
    off = 1 if cover else 0
    tot = len(pages) + off
    rendered = []
    for i, p in enumerate(pages):
        if i == 0 and off:
            rendered.append(hero_page(cfg, p, 1 + off, tot, gen_s, asat_s))
        else:
            rendered.append(sh.render_page(cfg, p, i + 1 + off, tot, gen_s, asat_s))
    body = cover + "".join(rendered)
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
            f'<title>Coates {esc(cfg["client"])} {esc(cfg["title"])} - '
            f'{esc(asat_s)}</title><style>{EXTRA_CSS}</style></head><body>{body}</body></html>'), tot


# =====================================================================
# the Outlook email (staff)
# =====================================================================

def card_block(cid):
    """The position card inline, under the header: a cid image the .eml
    carries in its own related part. Outlook honours the width attribute;
    the style caps it for everything else."""
    FONT = sh.FONT
    return (f'<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>'
            f'<td align="center" style="padding:16px 0 2px 0;">'
            f'<img src="cid:{cid}" width="420" alt="The position on one card" '
            f'style="display:block;width:420px;max-width:420px;height:auto;border:0;">'
            f'<div style="{FONT}font-size:10px;color:#5B6472;padding-top:6px;">The position on one card - '
            f'the same figures as the position page of the PDF; the PNG is attached for your phone.</div>'
            f'</td></tr></table>')


def build_email_html(rows, d, a, export_dt, gen_s, asat_s, card_cid=""):
    W = 1000
    CW = W - 48
    FONT = sh.FONT
    comp = d["comp30"]
    oncyc = a["on_cycle_pct"]
    due_all = sum(len(d["due"][k]) for k in eng.TIERS)
    g_all, g_seen, g_miss = a["gas"]
    r_all, r_seen, r_miss = a["radio"]
    b_all, b_seen, b_miss = a["battery"]
    band_e = rag_band_stocktake(d, a, export_dt)
    parts = []

    parts.append(f"""<!--hdr--><table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td bgcolor="#FFFFFF" style="padding:22px 24px 19px 24px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td>
<div style="{FONT}font-size:11px;font-weight:bold;letter-spacing:2.5px;color:#F26222;text-transform:uppercase;">{esc(CONFIG['kicker_team'])}</div>
<div style="{FONT}font-size:26px;font-weight:bold;color:#1D1D1B;padding-top:8px;">Ampol Stocktake - Today's Count</div>
<div style="{FONT}font-size:13px;color:#5B6472;padding-top:7px;">{esc(CONFIG['project'])}</div>
</td>
<td width="185" align="right" style="vertical-align:top;">
<div style="{FONT}font-size:11px;font-weight:bold;letter-spacing:1.5px;color:#1D1D1B;">POWERED BY <span style="color:#F26222;">SITEIQ</span></div>
<div style="{FONT}font-size:11.5px;color:#5B6472;padding-top:5px;">Equipped for anything</div>
</td></tr></table>
<div style="{FONT}font-size:11px;color:#5B6472;padding-top:10px;line-height:1.6;">Generated: <b style="color:#1D1D1B;">{esc(gen_s)}</b> &nbsp;|&nbsp; Data as at: <b style="color:#1D1D1B;">{esc(asat_s)}</b> (SiteIQ stocktake export) &nbsp;|&nbsp; Author: <b style="color:#1D1D1B;">Andrew Fisher</b></div>
</td></tr></table>""")
    if card_cid:
        parts.append(card_block(card_cid))

    key_cols = {"orange": "#F26222", "blue": "#2F7FD0",
                "amber": "#C97A12", "green": "#1E6B32"}
    key_bits = "&nbsp;&nbsp;".join(
        f'<span style="color:{key_cols[c]};">&#9679; <b>{esc(t)}</b></span> '
        f'<span style="color:#5B6472;">{esc(x)}</span>'
        for c, t, x in CONFIG["key_items"])
    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="{FONT}font-size:10px;padding:12px 2px 8px 2px;line-height:1.9;">
<span style="color:#5B6472;font-weight:bold;letter-spacing:1.5px;">KEY</span>&nbsp;&nbsp;{key_bits}</td></tr>
<tr><td>{sh.rule_png(CW)}</td></tr></table>""")

    parts.append(sh.ecallout(
        f'<span style="color:#C8511A;font-weight:bold;text-transform:uppercase;">'
        f'This one is yours.</span> The client report rates the shelf '
        f'<b>{band_e["status"].upper()}</b> - {band_e["pct"]:.1f}% of in-store items sighted inside 30 days; '
        f'this is the work that turns it green. {sh.eo(f"{oncyc:.0f}%")} of in-store items are inside their '
        f'tier cycle, <b>{num(len(d["done7"]))}</b> sighted in the last 7 days, '
        f'and {sh.eo(num(due_all) + " items due")} on the worklist attached. '
        f'The wheel doesn&rsquo;t turn itself.'))

    # WHY (12 Aug 2026): the gas score bar plots the tier's 30-day SOP
    # coverage (tier_stats p30) - the old headline said "7d cycle" over a
    # 30-day number. Label now tells the truth about the number it shows;
    # the number itself is unchanged.
    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;"><tr>
<td width="200" align="center" style="vertical-align:top;padding-top:6px;">
{sh.donut_png(round(oncyc), sh.health_hex(round(oncyc)), f"{oncyc:.0f}%", "ON CYCLE")}
<div style="{FONT}font-size:10.5px;color:#98A0AA;padding-top:8px;">In-store items inside their tier cycle</div></td>
<td style="vertical-align:top;padding-left:16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
{sh.score_bar_row("SOP 30-day compliance", round(comp), f"{num(d['ok30'])} of {num(d['countable'])} countable items sighted inside 30 days")}
{sh.score_bar_row("Gas monitors - 30-day SOP", round(next(p for k, *_, p in [(t[0], t[9]) for t in d['tier_stats']] if k == 'gas')), "in-store gas monitors inside the 30-day SOP")}
{sh.score_bar_row("Value verified 30d", round((d['val_ok30'] / d['val_total'] * 100) if d['val_total'] else 0), f"{money(d['val_ok30'])} of {money(d['val_total'])} priced fleet")}
</table></td></tr></table>""")

    parts.append(sh.etiles([
        (f'{len(g_seen)}/{len(g_all)}', "IN-STORE GAS MONITORS SIGHTED 24H",
         f'{len(g_miss)} missed' if g_miss else "all sighted",
         "#D0342C" if g_miss else "#409A55"),
        (f'{len(r_seen)}/{len(r_all)}', "IN-STORE RADIOS SIGHTED 24H",
         f'{len(r_miss)} missed' if r_miss else "all sighted",
         "#D0342C" if r_miss else "#409A55"),
        (f'{len(b_seen)}/{len(b_all)}', "IN-STORE BATTERIES SIGHTED 24H",
         f'{len(b_miss)} missed' if b_miss else "all sighted",
         "#D0342C" if b_miss else "#409A55"),
        (num(due_all), "DUE ON TIER TARGETS", "worklist attached", "#E08A24"),
    ]))

    wk = a["weekly"]
    parts.append(sh.esubh("Register freshness - items by week of their latest sighting (week starting)"))
    parts.append(sh.epanel(sh.hbars_png([(f"w/c {w['label']}", w["n"]) for w in wk], CW - 28, K["orange"])))

    lg = a["league"][:8]
    lrows = [[esc(x["name"]), num(x["d7"]), num(x["d30"]), num(x["st30"]),
              esc(x["last"].strftime("%d %b %H:%M") if x["last"] else "")]
             for x in lg]
    un = a.get("league_unnamed", {})
    if un.get("d30"):
        lrows.append(["No name on the scan", num(un["d7"]), num(un["d30"]), num(un["st30"]), ""])
    rest = a["league"][8:]
    if rest:
        lrows.append([f"{num(len(rest))} more people", num(sum(x["d7"] for x in rest)), num(sum(x["d30"] for x in rest)),
                      num(sum(x["st30"] for x in rest)), ""])
    lrows.append(["<b>Total</b>", f"<b>{num(len(d['done7']))}</b>", f"<b>{num(a['done30_total'])}</b>",
                  f"<b>{num(sum(x['st30'] for x in a['league']) + un.get('st30', 0))}</b>", ""])
    parts.append(sh.esect("The people turning the wheel - latest sighting per item, last 30 days"))
    parts.append(sh.edtable(
        ["Who", "Items 7d", "Items 30d", "Of which stocktake scans", "Most recent"],
        lrows, ["", "r", "r", "r", "r"]))

    ut = sorted(a["units"], key=lambda u: -u["due"])[:8]
    urows = [[esc(u["unit"]), num(u["n"]), num(u["due"]),
              f'{u["pct"]:.0f}%'] for u in ut if u["due"]]
    parts.append(sh.esect("Where to point the trolley today"))
    parts.append(sh.edtable(["Storage bay", "Items", "Due now", "Sighted 30d"],
                            urows, ["", "r", "r", "r"]))
    parts.append(sh.enote(
        f'Full item-by-item detail: the <b style="color:#1D1D1B;">worklist PDF '
        f'and Excel workbook attached</b>. The client compliance PDF and the '
        f'team report are attached too - same numbers, one engine. '
        f'{num(len(d["missed_returns"]))} possible missed returns are section 0 '
        f'of the worklist - resolve those first.'))

    team_line = " &middot; ".join(
        f'<b style="color:#1D1D1B;">{esc(p["name"])}</b> '
        f'<span style="color:#5B6472;">{esc(p["role"])}</span>'
        for p in CONFIG["team"])
    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:26px;">
<tr><td style="border-top:1px solid #DDE1E7;padding-top:10px;">
<div style="{FONT}font-size:10px;font-weight:bold;letter-spacing:2px;color:#F26222;text-transform:uppercase;">Your Coates Tool Store Team</div>
<div style="{FONT}font-size:11px;color:#5B6472;padding-top:5px;line-height:1.7;">{team_line}</div>
<div style="{FONT}font-size:10px;color:#98A0AA;padding-top:9px;line-height:1.7;">
{(ampol_options.client_line() + ' &middot; ') if ampol_options.client_line() else ''}Coates &middot; Sources: SiteIQ STOCKTAKE export ({esc(asat_s)}), RENTAL_STOCK register, pricing master. Unpriced items excluded from value totals, never estimated; serial-numbered gas monitors and radios priced by their family line. Activity figures are items by their latest sighting (the export keeps one sighting per item). SiteIQ still carries the site&rsquo;s former name on {num(d["former_name_lines"])} of the {num(d["countable"])} countable lines{f" ({num(REGISTER_FORMER[0])} across the whole register)" if REGISTER_FORMER[0] else ""}; they are shown under the current name. The Coates Way - consistent execution, every day. <b style="color:#1D1D1B;">POWERED BY SITEIQ</b></div>
</td></tr></table>""")

    # WHY (07 Nov 2026, QA F64): only the header runs edge to edge; every
    # other block - the chart panel included - sits inside the 24px margins
    body = "".join(
        f'<tr><td>{p}</td></tr>' if p.startswith("<!--hdr-->")
        else f'<tr><td style="padding:0 24px;">{p}</td></tr>'
        for p in parts)
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Ampol Stocktake - {esc(asat_s)}</title></head>
<body bgcolor="#E9ECF0" style="margin:0;padding:0;background-color:#E9ECF0;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#E9ECF0">
<tr><td align="center" style="padding:18px 10px;">
<table role="presentation" width="{W}" cellspacing="0" cellpadding="0" bgcolor="#FFFFFF" style="width:{W}px;max-width:{W}px;">
<tr><td height="6" bgcolor="#F26222" style="font-size:0;">&nbsp;</td></tr>
{body}
<tr><td height="24" style="font-size:0;">&nbsp;</td></tr>
</table></td></tr></table></body></html>"""


# =====================================================================
# MAIN
# =====================================================================

def main():
    print("=" * 68)
    print("COATES STOCKTAKE - HOUSE-STYLE SUITE (the K2 look)")
    print("=" * 68)
    src = eng.find_workbook(["STOCKTAKE*.xlsx"])
    master_path = eng.find_workbook(["RENTAL_STOCK*.xlsx"])
    # WHY (03 Sep 2026): the master workbook's tabs when it exists, else the
    # legacy files (ampol_master.locate) - the same rule as the engine
    fixes_path, fixes_sheet = ampol_master.locate("descriptions", "New_Descriptions*.xlsx", "*Descriptions*.xlsx")
    pricing_path, pricing_sheet = ampol_master.locate("pricing", "*Pricing*.xlsx")
    if not src:
        sys.exit("ERROR: no STOCKTAKE*.xlsx in the suite's Data folder - save "
                 "the SiteIQ export there and run again.")
    print(f"Stocktake export     : {src}")
    print(f"Register             : {master_path or 'NOT FOUND'}")
    print(f"Corrected descriptions: {ampol_master.describe('descriptions', fixes_path, fixes_sheet) if fixes_path else 'NOT FOUND - original descriptions used'}")
    print(f"Pricing              : {ampol_master.describe('pricing', pricing_path, pricing_sheet) if pricing_path else 'NOT FOUND - values omitted'}")
    OUT.mkdir(exist_ok=True)

    master = eng.load_master(master_path) if master_path else {}
    if master_path:
        try:
            _wb = openpyxl.load_workbook(master_path, read_only=True, data_only=True)
            _it = _wb["RENTAL_STOCK"].iter_rows(values_only=True)
            _h = [str(c).strip() if c else "" for c in next(_it)]
            _di = _h.index("ITEM_DESCRIPTION")
            REGISTER_FORMER[0] = sum(1 for _r in _it if ampol_names.carries_former_name(_r[_di]))
            _wb.close()
        except (KeyError, ValueError, OSError):
            REGISTER_FORMER[0] = 0
    fixes = eng.load_corrections(fixes_path, fixes_sheet) if fixes_path else ({}, {})
    exact, stripped, conflicts = (eng.load_pricing(pricing_path, pricing_sheet)
                                  if pricing_path else ({}, {}, []))
    rows, transit, export_dt = eng.load(src, master, fixes, exact, stripped)
    d = eng.derive(rows, export_dt)
    d["transit_n"] = transit
    # whole dollars on every headline value, as the pages print them
    for k in ("val_total", "val_ok30", "val_onhire"):
        d[k] = round(d[k])
    a = analytics(rows, d, export_dt, load_actions(src))
    # WHY (03 Sep 2026): the transaction log (txn_insights) says what the
    # counter handles most - the whole store, because the count covers
    # everything. Read once; the fast-movers page is built from it.
    log = ti.load_all()
    fm = ti.fast_movers(log, None, 20)
    tx_window = log["tx_window"]
    print(f"Fast movers          : {fm['rows'][0]['barcode'] if fm['rows'] else '-'} leads with "
          f"{fm['rows'][0]['moves'] if fm['rows'] else 0} moves; {fm['items_moved']:,} barcodes moved; "
          f"top bay {fm['by_unit'][0][0] if fm['by_unit'] else '-'} ({fm['by_unit'][0][1] if fm['by_unit'] else 0:,}); "
          f"bays on the map: {sum(1 for u, _ in fm['by_unit'][:12] if u in {x['unit'] for x in a['units']})} of {len(fm['by_unit'][:12])}")

    asat_s = export_dt.strftime("%d %b %Y %H:%M")
    gen_dt = datetime.now()
    gen_s = gen_dt.strftime("%d %b %Y %H:%M")
    print(f"Data as at           : {asat_s}  (export request time)")
    print(f"Countable / departed : {len(rows):,} / {transit:,} excluded "
          f"(in store {len(d['instore']):,}, on hire {len(d['onhire']):,})")
    print(f"SOP 30d compliance   : {d['comp30']:.1f}%  "
          f"({d['ok30']:,} of {d['countable']:,} = {d['ok30_instore']:,} in store + {d['ok30_onhire']:,} on hire)")
    print(f"Priced by family     : {d['priced_family']:,} serial-numbered gas monitors and radios "
          f"| unpriced {d['unpriced_lines']:,}")
    print(f"Not on live register : {len(d['not_on_register']):,} stocktake lines "
          f"| awaiting arrival {len(d['awaiting_arrival']):,}")
    print(f"On own tier cycle    : {a['on_cycle_pct']:.1f}% of in-store")
    print(f"Fleet value (priced) : {money(d['val_total'])}  "
          f"| verified 30d {money(d['val_ok30'])}")
    print(f"Shelf tail           : {len(a['ins_over30']):,} in-store items "
          f"over 30d (oldest {a['ins_oldest']}d)")
    print(f"Long-hire 180d+      : {len(a['oh_risk180']):,} on-hire items  "
          f"{money(a['oh_risk180_val'])}")
    g = a["gas"]; r_ = a["radio"]; b = a["battery"]
    print(f"Daily three (24h)    : gas {len(g[1])}/{len(g[0])}  "
          f"radios {len(r_[1])}/{len(r_[0])}  batteries {len(b[1])}/{len(b[0])}")

    # ---- 1. the floor worklist (his V3, unchanged) ---------------------
    print("-" * 68)
    print("[1/4] Floor worklist (V3, unchanged)...")
    w = OUT / CONFIG["stem_worklist"]
    wl_doc = eng.build_staff_worklist(rows, transit, export_dt, d)
    open(f"{w}.html", "w", encoding="utf-8").write(wl_doc)
    eng.build_excel_worklist(rows, d, conflicts, Path(f"{w}.xlsx"))
    try:
        Path(f"{w}.pdf").unlink()   # stale file must not masquerade as success
    except OSError:
        pass
    eng.write_pdf_robust(f"{w}.html", f"{w}.pdf")
    if Path(f"{w}.pdf").exists():
        print("PDF finish           : " + pdf_finish.finish(
            f"{w}.pdf", f"Ampol Stocktake Count Worklist - as at {asat_s}",
            "The floor count worklist for the Ampol tool store - due items by bay, oldest first, "
            "from the SiteIQ stocktake export.", wl_doc, keywords="stocktake, worklist",
            has_cover=False, family="Stocktake"))

    # ---- 2. client + team house-style PDFs -----------------------------
    # k2style.css lives in the suite root, next to this script - BASE.
    # WHY (12 Aug 2026): say so plainly if it's gone, instead of a raw
    # traceback halfway through the run.
    css_path = BASE / "k2style.css"
    if not css_path.exists():
        sys.exit("ERROR: k2style.css is missing from the suite folder - the "
                 "house-style PDFs cannot render without it.")
    css = css_path.read_text(encoding="utf-8")
    print("[2/4] Client compliance PDF (house style)...")
    _ASAT[0] = export_dt
    ins_pct = (d["ok30_instore"] / len(d["instore"]) * 100) if d["instore"] else 0
    g_all, g_seen, g_miss = a["gas"]
    stem_c, stem_t = CONFIG["stem_client"], CONFIG["stem_team"]
    band = rag_band_stocktake(d, a, export_dt)
    status = band["status"]
    key_value, key_label = f"{ins_pct:.0f}%", "of the shelf sighted inside 30 days"
    cover_lines = [
        f"<b>{num(d['countable'])}</b> countable items - {num(len(d['instore']))} in store, {num(len(d['onhire']))} on hire",
        f"<b>{money(d['val_ok30'])}</b> of {money(d['val_total'])} priced fleet verified in the last 30 days",
        f"<b>{num(len(g_all) - len(a['gas_past']))} of {num(len(g_all))}</b> in-store gas monitors sighted inside the 2-day standard"]

    def cover_for(contents):
        # the cover wears the SAME status as the band on the position page,
        # says how old the data was when the pack was built, and lists
        # what's inside with page numbers read off the printed pack
        return sh.cover_page(cfg_for("client"), key_value, key_label, cover_lines, gen_s, asat_s,
                             rag=status, fresh=sh.freshness_line(export_dt, gen_dt), contents=contents)
    client_pages = build_client_pages(rows, d, a, export_dt, fm=fm, tx_window=tx_window)
    pdf_c, html_c = OUT / f"{stem_c}.pdf", OUT / f"{stem_c}.html"
    cover, contents, n_first = "", [], None
    if CONFIG.get("cover_page"):
        # WHY (03 Sep 2026): two prints - the first to read the section page
        # numbers off the printed pack, the second with them on the cover
        doc_first, _ = render_doc("client", client_pages, gen_s, asat_s, cover=cover_for(None))
        contents, n_first = cover_contents_from_print(doc_first, pdf_c, html_c, css, CLOSING_HEADINGS)
        cover = cover_for(contents)
    doc_c, n_c = render_doc("client", client_pages, gen_s, asat_s, cover=cover)
    checks = [render_k2_pdf(doc_c, pdf_c, html_c, n_c, css)]
    if n_first is not None:
        n_second = pdf_pages(pdf_c)
        print(f"Cover contents       : {len(contents)} rows - page numbers read off the first print "
              f"({n_first} pages); the second print has {n_second} pages - "
              f"{'the same pagination' if n_first == n_second else 'NOT THE SAME'}")
        if n_first != n_second:
            sys.exit("ERROR: the pack paginated differently once the cover carried its contents - "
                     "the page numbers on the cover cannot be trusted. Do not send.")
    print("PDF finish           : " + pdf_finish.finish(
        pdf_c, f"{cfg_for('client')['client']} {cfg_for('client')['title']} - as at {asat_s}",
        "Stocktake compliance for the Ampol Lytton Refinery tool store - the position, coverage by "
        "bay, the idle tail and on-hire verification, counted from the SiteIQ stocktake export.",
        doc_c, keywords="stocktake, compliance", has_cover=bool(cover), family="Stocktake"))
    # WHY (06 Nov 2026, client feedback): the Excel twin of the compliance
    # report - the same position, bays, tails and lists, every tab filterable
    xlsx_c = OUT / f"{stem_c}.xlsx"
    try:
        import ampol_xlsx_reports as xr
        xr.stocktake_workbook(rows, d, a, fm, tx_window, band, cfg_for("client"), asat_s, gen_s, str(xlsx_c),
                              hidden_note=ampol_options.disclosure("this report"),
                              sources=[(Path(src).name, asat_s, "Every item's latest sighting")]
                              + ([(Path(master_path).name, asat_s, "Status, hirer and company")] if master_path else [])
                              + ([(Path(pricing_path).name, "not a SiteIQ pull - Andrew's master", "Replacement prices")] if pricing_path else []))
        print(f"Excel twin           : {xlsx_c}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Excel twin           : NOT written ({type(e).__name__}: {e})")
    print("[3/4] Team report PDF (house style)...")
    doc_t, n_t = render_doc("team",
                            build_team_pages(rows, d, a, export_dt),
                            gen_s, asat_s)
    pdf_t = OUT / f"{stem_t}.pdf"
    checks.append(render_k2_pdf(doc_t, pdf_t, OUT / f"{stem_t}.html", n_t, css))
    print("PDF finish           : " + pdf_finish.finish(
        pdf_t, f"{cfg_for('team')['client']} {cfg_for('team')['title']} - as at {asat_s}",
        "The store team's counting report - who sighted what, the daily three, where the trolley "
        "goes next and the long-hire gear to verify, from the SiteIQ stocktake export.",
        doc_t, keywords="stocktake, team", has_cover=False, family="Stocktake"))

    # ---- the movement scoreboard and the phone card ---------------------
    # WHY (03 Sep 2026): the entry carries the position in words as well as
    # figures (extra) - the status, the headline, the rule, the owner, the
    # dated action and the cover number - so the daily position page can
    # quote the report without opening it.
    rh.record("stocktake", export_dt, {
        "countable": d["countable"], "instore": len(d["instore"]), "onhire": len(d["onhire"]),
        "comp30": round(d["comp30"], 1), "instore_comp": round(ins_pct, 1),
        "done7": len(d["done7"]), "done30": len(d["done30"]),
        "val_total": round(d["val_total"]), "val_ok30": round(d["val_ok30"]), "val_onhire": round(d["val_onhire"]),
        "due_all": sum(len(d["due"][k]) for k in eng.TIERS), "missed_returns": len(d["missed_returns"]),
        "ins_over30": len(a["ins_over30"]), "gas_seen24": len(g_seen), "gas_instore": len(g_all),
        "oh_risk180": len(a["oh_risk180"])},
        extra={"rag": status, "headline": band["headline"], "rule": band["rule"],
               "owner": band["owner"], "action": band["action"], "due": band["due"],
               "key_value": key_value, "key_label": key_label,
               "second_value": num(d["countable"]), "second_label": "countable items on the register",
               "title": f"{CONFIG['client']} {CONFIG['title_client']}", "folder": "Stocktake",
               "pdf": f"{stem_c}.pdf", "card": f"{stem_c}_PositionCard.png"})
    print(f"History              : {rh.HIST.name} - stocktake figures recorded for {export_dt.strftime('%d %b %Y')}")
    card_path = OUT / f"{stem_c}_PositionCard.png"
    sh.position_card_png(cfg_for("client"), asat_s, [
        (num(d["countable"]), "Countable items", f"{num(len(d['instore']))} in store", "#5B6472"),
        (f"{ins_pct:.1f}%", "In-store SOP 30d", f"{num(len(a['ins_over30']))} shelf items outside", sh.rag_colour(status)),
        (f"{d['comp30']:.1f}%", "Whole store SOP 30d", "on-hire counted in", "#5B6472"),
        (num(len(d["done7"])), "Sighted last 7 days", "items", "#409A55"),
        (f"{len(g_all) - len(a['gas_past'])}/{len(g_all)}", "Gas monitors 2 days", f"{len(a['gas_past'])} past the standard" if a["gas_past"] else "all inside", "#D0342C" if a["gas_past"] else "#409A55"),
        (money(d["val_ok30"]), "Value verified 30d", f"of {money(d['val_total'])}", "#5B6472"),
    ], (status, f"{ins_pct:.1f}% of in-store items sighted inside 30 days; {num(len(a['ins_over30']))} shelf items outside; "
                f"{num(len(d['missed_returns']))} possible missed returns.", "Andrew Fisher, Shutdown Manager",
        f"Shelf items on the worklist cleared by {(export_dt + timedelta(days=7)).strftime('%d %b %Y')}"),
        [(lab, round(p30)) for k, lab, tgt, why, tot, ohn, insn, wt, w30, p30 in d["tier_stats"]][:4],
        str(card_path), f"Counted from the SiteIQ exports of {asat_s} - nothing estimated.",
        green_from=90, amber_from=75)      # this report's own rule: green from 90%, amber from 75%
    print(f"Position card        : {card_path}")

    # ---- 3. the email ---------------------------------------------------
    print("[4/4] Outlook email (house style)...")
    # WHY (03 Sep 2026): the .eml shows the position card inline under the
    # header (a cid part) and still carries it as a file; the native-draft
    # manifest lists it as an attachment only, so its body is written
    # without the inline image.
    body_html = build_email_html(rows, d, a, export_dt, gen_s, asat_s)
    body_name = f"{stem_c}_OUTLOOK.body.html"
    (OUT / body_name).write_text(body_html, encoding="utf-8")
    html = build_email_html(rows, d, a, export_dt, gen_s, asat_s,
                            card_cid="positioncard" if card_path.exists() else "")
    msg = EmailMessage()
    subject = (f"Ampol Tool Store - Stocktake Report - "
               f"{export_dt.strftime('%d %b %Y %H:%M')}")
    msg["Subject"] = subject
    msg["To"] = eng.STAFF_EMAIL_TO
    msg["Date"] = formatdate(localtime=True)
    msg["X-Unsent"] = "1"
    msg.set_content("This report is best viewed in HTML. The worklist (PDF + "
                    "Excel), the client compliance PDF, the team report and "
                    "the position card are attached.\n")
    msg.add_alternative(html, subtype="html")
    if card_path.exists():
        with open(card_path, "rb") as f:
            msg.get_payload()[1].add_related(f.read(), maintype="image", subtype="png",
                                             cid="<positioncard>", filename=card_path.name,
                                             disposition="inline")
    attach = [(f"{w}.pdf", "pdf"),
              (f"{w}.xlsx", "vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
              (str(pdf_c), "pdf"),
              (str(xlsx_c), "vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
              (str(pdf_t), "pdf"),
              (str(card_path), "png")]
    attach = [(p, sub) for p, sub in attach if os.path.exists(p)]
    for p, sub in attach:
        with open(p, "rb") as f:
            msg.add_attachment(f.read(), maintype="image" if sub == "png" else "application",
                               subtype=sub, filename=os.path.basename(p))
    eml_path = OUT / f"{stem_c}_OUTLOOK.eml"
    with open(eml_path, "wb") as f:
        f.write(msg.as_bytes())
    print(f"EML written          : {eml_path}  "
          f"({os.path.getsize(eml_path):,} bytes; attached: "
          + ", ".join(os.path.basename(p) for p, _ in attach) + ")")
    # manifest so MAKE_OUTLOOK_DRAFTS keeps working
    # WHY (12 Aug 2026): recipients derive from the engine's STAFF_EMAIL_TO -
    # one source of truth. The old hard-coded duplicate here went stale the
    # moment the engine's list changed.
    to_line = "; ".join(re.findall(r"<([^>]+)>", eng.STAFF_EMAIL_TO))
    (OUT / f"{stem_c}_OUTLOOK.draft.json").write_text(json.dumps({
        "subject": subject,
        "to": to_line,
        "body": body_name,
        "attachments": [os.path.basename(p) for p, _ in attach],
    }, indent=1), encoding="utf-8")
    print("")
    print(f"NEXT STEP: double-click the .eml in {OUT}, check it, press Send.")
    print("Done. The Coates Way - consistent execution, every day.")
    if any(fit is False or lay is False for fit, lay in checks):
        sys.exit("\nWARNING: a PDF failed its fit or layout check - see above. Do "
                 "not send it as is.")


# WHY (07 Nov 2026): one dash style in the emails as on the pages
import k2shell as _k2s_dash
build_email_html = _k2s_dash.one_dash(build_email_html)


if __name__ == "__main__":
    # WHY (12 Aug 2026): failures used to be swallowed to exit code 0, so the
    # bat button reported success and opened the folder on a broken build.
    # Keep the friendly traceback, but always leave nonzero on failure so the
    # button tells the truth. A sys.exit("message") from main() propagates on
    # its own (message printed, exit code 1). The bat owns the end-of-run
    # pause now - no input() here.
    try:
        main()
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(f"\nERROR: {e}")
