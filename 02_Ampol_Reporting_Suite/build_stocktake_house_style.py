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
import ampol_paths
import build_stocktake_compliance_tool as eng
import gasmon_engine as ge
import k2shell as sh
import pdf_finish
import report_history as rh
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
    "title_team": "Stocktake - The People Turning The Wheel",
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
        ("orange", "COUNT DAILY", "stock takes are done daily - no exceptions"),
        ("blue", "TWO SCANS TWO LOOKS", "scanned and sighted, out and back"),
        ("amber", "P1 7-DAY", "gas monitors, radios & batteries every 7 days"),
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
    co = defaultdict(lambda: {"n": 0, "val": 0, "due": 0, "custody": False})
    for r in d["onhire"]:
        raw = (r["onhire_to"].split(" – ")[0] or "").strip()
        c = ge.norm_company(raw) if raw else "(no company)"
        if raw.upper().startswith(("DRÄGER", "DRAGER", "REPAIRS")):
            c = f"{c} (repairs / custody)"
            co[c]["custody"] = True
        co[c]["n"] += 1
        co[c]["val"] += r["value"] or 0
        if eng.bucket(r["days"]) != "ok":
            co[c]["due"] += 1
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
        for name in ("msedge", "chrome", "chromium", "chromium-browser", "google-chrome"):
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
                      "on hire in SiteIQ, yet sighted in a store bay after the hire date", who))
    else:
        n_v = len(d["onhire_due30"])
        items.append((f"Verify {num(n_v)} on-hire items on their next return",
                      "no scan of any kind in 30 days - a long hire, checked at the counter", who))
    # 3. the daily three: gas monitors not seen in 24 hours, else the tier
    #    furthest behind its own target cycle
    g_all, g_seen, g_miss = a["gas"]
    if g_miss:
        items.append((f"Sight the {num(len(g_miss))} gas monitors not seen in 24 hours",
                      f"{num(len(g_seen))} of {num(len(g_all))} in-store monitors sighted - "
                      f"the daily three, not the weekly wheel", who))
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

def build_client_pages(rows, d, a, export_dt):
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
             f'The risk sits in long-hire gear, not the shelf: {num(len(a["oh_risk180"]))} on-hire items '
             f'unseen for 180+ days, holding {money(a["oh_risk180_val"])}.')
    print(f"Story callout        : {story_words(story)} words (client position page, three lines at most)")
    P.append(f"""{band["html"]}
{sh.tiles_plus([
    ("box", num(d["countable"]), "Countable items",
     *mv("countable", d["countable"], "up", f"{num(len(d['instore']))} in store, {num(len(d['onhire']))} on hire", "grey")),
    ("shield", money(d["val_total"]), "Priced fleet value (new)",
     *mv("val_total", round(d["val_total"]), "up", f"{priced_pct:.0f}% of lines priced", "grey")),
    ("check", money(d["val_ok30"]), "Value verified 30d",
     *mv("val_ok30", round(d["val_ok30"]), "up", f"{val_cov:.0f}% of priced value", "green" if val_cov >= 75 else "amber")),
    ("swap", money(d["val_onhire"]), "Value on hire now",
     *mv("val_onhire", round(d["val_onhire"]), "down", "verified on return", "grey")),
])}
{sh.three_things(three_things_stocktake(d, a, band))}
{pcallout(story)}""")

    # ---- P1b the scorecard - the arithmetic behind the position ---------
    ladders = sh.score_rows([
        (lab, round(p30),
         f"{w30} of {insn} in-store items sighted inside the 30-day SOP - "
         f"internal target is every {tgt} days ({wt} inside it)")
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
    ("check", num(len(d["done7"])), "Sighted last 7 days", "items", ""),
    ("bars", num(len(d["done30"])), "Sighted last 30 days", "items", ""),
    ("zap", num(a["sighted_today"]), "Sighted today",
     export_dt.strftime("%d %b %Y"), "amber"),
    ("clock", num(sum(a["st_hours"].values())), "Latest scan was a stocktake scan",
     "items, last 30 days", "grey"),
])}""")

    # ---- P2 determination + activity -----------------------------------
    wk = a["weekly"]
    # WHY (03 Sep 2026): k2shell.line_chart is the 10/10-pass chart now -
    # (name, values) series, one shared axis - so this call follows it.
    line = sh.line_chart([w["label"] for w in wk],
                         [("Items by week of latest sighting", [w["n"] for w in wk])],
                         y_label="items", h=196)
    det = "".join(
        f'<tr><td class="al-dot d-amber">&#9679;</td><td>'
        f'<div class="al-t">P{1 if k in ("gas", "radio") else 2 if k == "milwaukee" else 3} '
        f'&middot; {esc(lab)} - every {tgt} days</div>'
        f'<div class="al-s">{esc(why)}</div></td></tr>'
        for k, lab, tgt, why, *_ in d["tier_stats"])
    P.append(f"""{psect("The priority determination - stated, not implied")}
<div class="alerts"><div class="ah">How this store is counted</div>
<table class="al">{det}</table></div>
{pnote('Client compliance is measured on the 30-day SOP. The 7 and 14-day cycles are the Coates internal standard set <b>above</b> the SOP. Issue and return scans reset an item&rsquo;s clock, so the count cadence naturally surfaces idle stock - exactly the gear that goes missing quietly.')}
{psubh("Register freshness", "- items by the week of their most recent sighting, last 12 weeks")}
{chartpanel(line)}
{pnote('The stocktake export holds one line per item - its latest sighting only - so this chart is <b>how fresh the register is</b>, not a count of scans performed. An item scanned twice in the window appears once, on its latest date. The weeks nearest today are naturally the tallest.')}""")

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
    ins_bars = sh.hbars([(lab, n) for lab, n, v in a["idle_ins"]],
                        colour=K["green"])
    oh_rows = [[lab, num(n), money(v) if v else '<span class="tbc">unpriced</span>']
               for lab, n, v in a["idle_oh"] if n]
    P.append(f"""{psect("The idle tail - where the risk actually sits")}
{pcallout(f'The risk is never the gear that moves - it is the gear that sits. On the shelf that tail is <b class="o">small</b>: {num(len(a["ins_over30"]))} of {num(len(d["instore"]))} in-store items are outside 30 days'
          + (f' and the oldest is <b>{num(a["ins_oldest"])} days</b>' if not a["ins_never"] else f', <b class="rd">{num(a["ins_never"])} never sighted</b>')
          + f'. The watch item is <b class="o">long-hire gear</b>: {num(len(a["oh_risk180"]))} on-hire items have had no scan of any kind in over 180 days, holding <b class="o">{money(a["oh_risk180_val"])}</b> of priced value - these are verified at return and at shutdown checks, and the long-hire list below is where that effort goes next.')}
{psubh("In-store items by time since last sighting", "- the shelf tail")}
{chartpanel(ins_bars)}
{psubh("On-hire items by time since last verification", "- the long-hire tail")}
{sh.dtable(["Bucket", "Items on hire", "Priced value"], oh_rows, ["", "r", "r"])}
{pnote('On-hire gear is not shelf-counted - verification comes from the double-scan return process and shutdown checks, so a long bucket here is a long hire, not a lost item. It is watched because long-idle gear is where shrinkage hides. Values from the pricing master; unpriced items excluded and disclosed, <b>never estimated</b>.')}""")

    # ---- P5 on-hire verification ---------------------------------------
    oc = a["onhire_co"][:10]
    orows = [[esc(x["co"]), num(x["n"]),
              (f'<span class="rd">{num(x["due"])}</span>' if x["due"] else
               '<span class="g">0</span>'),
              money(x["val"]) if x["val"] else '<span class="tbc">unpriced</span>']
             for x in oc]
    P.append(f"""{psect("On hire - verified on return, not hunted on shelves")}
{pcallout(f'<b>{num(len(d["onhire"]))} items</b> show ON HIRE on the register, holding <b>{money(d["val_onhire"])}</b> of priced value - {num(len(d["onhire"]) - a["custody_n"])} out with contractors and {num(a["custody_n"])} on the repairs and Dr&auml;ger service accounts. On-hire gear is verified through the double-scan return process and shutdown checks - chasing it around site during a count would be friction for no assurance. <b class="o">{num(len(d["missed_returns"]))} possible missed returns</b> (sighted in a store bay after their on-hire date) are flagged to resolve first, so hirers are never held for gear that is already home.')}
{sh.dtable(["Company (ranked by items on hire)", "Items on hire", "Not scanned 30d", "Priced value"],
           orows, ["", "r", "r", "r"])}
{pnote(f'Ranked by items on hire - the one ranked table on this page. Companies are merged across the register&rsquo;s spellings (the refinery legal name and the site&rsquo;s former account both read Ampol; project accounts such as FCCU and SATGAS/MOL roll into their parent). "Not scanned 30d" is an item whose latest scan of any kind is older than 30 days - a long hire, not a lost item. Top {len(oc)} of {len(a["onhire_co"])} accounts shown.')}
{sh.tiles([
    ("swap", num(len(d["onhire"])), "Items on hire", "", ""),
    ("warn", num(len(d["onhire_due30"])), "Not verified in 30d",
     "verify on next return", "amber" if d["onhire_due30"] else "green"),
    ("check", num(len(d["missed_returns"])), "Possible missed returns",
     "resolve first", "red" if d["missed_returns"] else "green"),
    ("shield", money(d["val_onhire"]), "Value on hire", "", ""),
])}""")

    # ---- P6 the trend - only once seven days are on record ---------------
    tp = trend_page(export_dt, d, a, ins_pct)
    if tp:
        P.append(tp)

    # ---- P7 close -------------------------------------------------------
    cards = sh.info_cards([
        ("Two scans, two looks",
         "Every item is scanned <b>and</b> sighted going out, and scanned and "
         "sighted coming back. If it moved, it is on the record - that is your "
         "protection as much as ours."),
        ("Counted daily, above the SOP",
         "The SOP asks for a 30-day cycle. Coates runs gas monitors, radios "
         "and batteries on <b>7 days</b> and Milwaukee on <b>14</b> - an "
         "internal standard set above the contract."),
        ("Numbers you can challenge",
         "Every score prints its own arithmetic. Values are Avg Buy Price (New) "
         "from the pricing master; serial-numbered gas monitors take their "
         "family line; anything unpriced is excluded and disclosed, "
         "<b>never estimated</b>. SiteIQ still carries the site&rsquo;s former "
         f"name on {num(d['former_name_lines'])} descriptions - shown here under "
         "the current name."),
        ("Idle stock is the target",
         "Movement resets the clock, so the count cadence naturally hunts the "
         "gear that sits still - the gear that goes missing quietly."),
        ("Life Saving Rule 5",
         "Tools and Equipment (SEQ-GL-009): nothing damaged, defective or out "
         "of test date is ever reissued. Stock takes are done daily. "
         "No exceptions."),
        ("Ease of doing business",
         "One register, one cadence, one report - and a store team that "
         "resolves a query while you are still at the counter."),
    ])
    n_days = history_days("stocktake", export_dt)
    trend_line = (f'Trend page: appears once seven days are on record ({num(n_days)} today).'
                  if n_days < 7 else
                  f'Trend page: {num(n_days)} days on record - the 30-day lines are on the page before this one.')
    P.append(f"""<div class="close">{psect("The tool store has your back")}
{cards}
{pnote(f'Sources: SiteIQ STOCKTAKE export ({esc(export_dt.strftime("%d %b %Y %H:%M"))}), RENTAL_STOCK register, pricing master. Each run writes its figures to {HIST_NAME} keyed on the export day. {trend_line}')}
{sh.coates_way_panel()}
{psect("Meet the tool store team")}
{sh.team_cards(CONFIG["team"])}</div>""")
    return P


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
            f'Default lines - set in CONFIG.')
    owner = "<b>Andrew Fisher</b>, Shutdown Manager - Coates tool store"
    action = (f'The {num(late)} shelf items on the daily worklist, oldest first, cleared by <b>{due}</b>; '
              f'missed returns resolved same day.')
    # the same facts travel to the cover stripe, the phone card and the
    # History scoreboard - one status, never a second opinion
    return {"status": status, "html": sh.rag_band(status, head, rule, owner, action),
            "headline": plain(head), "rule": plain(rule), "owner": "Andrew Fisher, Shutdown Manager",
            "action": plain(action), "due": due, "pct": pct, "late": late}


def store_layout(units):
    """(layout dict, source) - Data\store_layout.json when present, else an
    A-to-Z grid; a template is written beside the data so the floor plan
    can be typed in once."""
    data_dir = Path(ampol_paths.data_dir()) if hasattr(ampol_paths, "data_dir") else BASE / "Data"
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
        fill = "#1FA75A" if pct >= CONFIG["rag_green_from"] else "#F5A623" if pct >= CONFIG["rag_amber_from"] else "#EF4444"
        x, y = 4 + c * cw, 4 + r * (ch + 6)
        out.append(f'<rect x="{x + 2:.1f}" y="{y}" width="{cw - 4:.1f}" height="{ch}" rx="7" fill="{fill}" opacity="0.92"/>')
        label = n if len(n) <= 16 else n[:15] + "…"
        tcol = "#16202C" if fill == "#F5A623" else "#FFFFFF"
        out.append(f'<text x="{x + cw / 2:.1f}" y="{y + 18}" text-anchor="middle" fill="{tcol}" '
                   f'font-family="Lato, Calibri, sans-serif" font-size="8.4" font-weight="700">{esc(label)}</text>')
        out.append(f'<text x="{x + cw / 2:.1f}" y="{y + 33}" text-anchor="middle" fill="{tcol}" '
                   f'font-family="Lato, Calibri, sans-serif" font-size="7.6">{num(u["n"])} items · {pct:.0f}%</text>')
    out.append("</svg>")
    return "".join(out)


def bay_map_page(a, d):
    units = a["units"]
    layout, src = store_layout(units)
    g = sum(1 for u in units if u["pct"] >= CONFIG["rag_green_from"])
    am = sum(1 for u in units if CONFIG["rag_amber_from"] <= u["pct"] < CONFIG["rag_green_from"])
    rd = len(units) - g - am
    how = ("laid out from <b>Data\\store_layout.json</b> - the floor plan as typed in" if src != "auto" else
           "laid out <b>A to Z</b> because no floor plan has been typed in yet - rename "
           "<b>Data\\store_layout.template.json</b> to store_layout.json and give each bay its row and column")
    return f"""{psect("The store map - every bay coloured by its 30-day coverage")}
{pcallout(f'One look at the floor: <b class="g">{num(g)} bays green</b>, <b class="a">{num(am)} amber</b>, <b class="rd">{num(rd)} red</b> out of {num(len(units))} in-store bays. Green from {CONFIG["rag_green_from"]}% of the bay&rsquo;s items sighted inside 30 days, amber from {CONFIG["rag_amber_from"]}%, red below - the same lines as the RAG band on page 2. Each tile prints its item count and its coverage, so the colour can be checked.')}
<div class="chartpanel">{bay_map_svg(units, layout)}</div>
{pnote(f'Bays are {how}. Every bay with at least one in-store item is shown; the item count is the live register&rsquo;s home storage unit for in-store items, on-hire items excluded. Numbers, not colours, are the record.')}"""


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
    P.append(f"""{pcallout(
        f'<span class="lead">This one is yours.</span> The client sees a '
        f'compliance report that says the store is under control - here is the '
        f'work that MAKES it true. <b>{num(len(d["done30"]))} items</b> have '
        f'been sighted in the last 30 days, <b class="o">{num(len(d["done7"]))} '
        f'in the last 7</b>, and right now <b class="o">{oncyc:.0f}% of the '
        f'{num(len(ins))} in-store items are inside their own tier cycle</b>. '
        f'The wheel doesn&rsquo;t turn itself - it&rsquo;s turned by the people '
        f'on this page.', False)}
<table class="two" style="margin-top:14px"><tr>
  <td style="width:50%" align="center"><div class="donut-wrap">
    {sh.donut(round(oncyc), sh.health_hex(round(oncyc)), f"{oncyc:.0f}%", "ON CYCLE")}
    <div class="donut-cap">In-store items inside their tier cycle (7/14/30d)</div></div></td>
  <td style="width:50%" align="center"><div class="donut-wrap">
    {sh.donut(round(comp), sh.health_hex(round(comp)), f"{comp:.0f}%", "SOP 30D")}
    <div class="donut-cap">Whole store against the 30-day SOP</div></div></td>
</tr></table>
{sh.tiles([
    ("check", num(len(d["done7"])), "Sighted last 7 days", "", ""),
    ("clock", num(a["seen24"]),
     "In the last 24 hours", "items sighted", ""),
    ("warn", num(due_all), "Due on tier targets",
     "the worklist below", "red" if due_all else "green"),
    ("bars", num(len(a["ins_over30"])), "In-store over 30 days",
     (f"oldest {a['ins_oldest']}d" if not a["ins_never"] else f"{a['ins_never']} never sighted"),
     "amber" if a["ins_over30"] else "green"),
])}
{pnote(f'On-cycle = in-store items sighted inside their own tier target = {num(a["within_target"])} &divide; {num(len(ins))} = <b>{oncyc:.0f}%</b>. SOP = sighted within 30 days = {num(d["ok30"])} &divide; {num(d["countable"])} = <b>{comp:.1f}%</b>.')}""")

    # ---- T2 the people --------------------------------------------------
    lg = a["league"][:10]
    lrows = []
    for x in lg:
        share = x["d30"] / a["done30_total"] * 100 if a["done30_total"] else 0
        lrows.append([esc(x["name"]), num(x["d7"]), num(x["d30"]),
                      num(x["st30"]), f'{share:.0f}%',
                      esc(x["last"].strftime("%d %b %H:%M") if x["last"] else "")])
    P.append(f"""{psect("The people turning the wheel")}
{pcallout('Every sighting in the register carries a name. This is who made the <b>latest</b> sighting of each item in the last 30 days - stocktake scans separated from movement scans, because walking a bay with a scanner is the work that finds idle gear.')}
{sh.dtable(["Who (ranked by items, last 30d)", "Items, last 7d", "Items, last 30d", "Of which stocktake scans", "Share of 30d", "Most recent scan"],
           lrows, ["", "r", "r", "r", "r", "r"])}
{pnote('The export keeps one sighting per item - the latest - so these are items whose most recent scan carries this name, not every scan the person made. Share is of all items sighted in the last 30 days. Movement scans (issues and returns) also reset an item&rsquo;s clock - both count, both are the wheel turning.')}
{psubh("Items by day of latest sighting", "- last 14 days, stocktake scans highlighted")}
{chartpanel(sh.grouped_bars(a["days14"], h=190,
                            series=(("issued", K["orange"], "All sightings"),
                                    ("returned", "#22C55E", "Stocktake scans"))))}""")

    # ---- T3 the daily three ---------------------------------------------
    def miss_table(missed, cap=7):
        rows_ = []
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
        past = sum(1 for r in missed if r["days"] is None or r["days"] > 7)
        more = (f'{pnote(f"... and <b>{len(missed) - cap}</b> more not sighted in the last 24 hours. {past} of the {len(missed)} are past the 7-day tier target and sit on the worklist; the rest were sighted inside the last 7 days.")}'
                if len(missed) > cap else "")
        return t + more

    g_all, g_seen, g_miss = a["gas"]
    r_all, r_seen, r_miss = a["radio"]
    b_all, b_seen, b_miss = a["battery"]
    P.append(f"""{psect("The daily three - counted every single day")}
{pcallout('Three groups are on a DAILY count, not the weekly wheel: <b>gas monitors, radios and radio batteries</b>. Gas monitors keep people alive, radios keep the site talking, and batteries are what walks. Below is the last 24 hours for the units <b>in store</b> (on-hire units are out with their hirers) and exactly what was missed. Chargers and probes are not monitors and are not counted here.')}
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
    ("check", num(len(g_seen) + len(r_seen) + len(b_seen)),
     "Daily-three sighted 24h", "", ""),
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
{pnote(f'Due = outside the item&rsquo;s own tier target (7/14/30 days). Full item-by-item detail is the printed worklist and the Excel workbook - this page is the map, those are the streets.')}""")

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
             f'<span class="a">{num(r["days"])}d</span>')])
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
    P.append(f"""{psect("The shelf residue - the last few over 30 days")}
{pcallout(f'The in-store tail is short: <b class="o">{num(len(a["ins_over30"]))} items</b> over 30 days'
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
{pnote(f'Also flagged: <b>{num(len(d["missed_returns"]))} possible missed returns</b> - sighted in a store bay after their on-hire date while still showing ON HIRE. Resolve those first so hirers aren&rsquo;t held for gear that is home; worklist section 0 lists them.')}""")

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
    P.append(f"""{psect("How we run the count")}
{cards}
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
"""


# the client pack's closing sections - never listed on the cover
CLOSING_HEADINGS = ("The tool store has your back", "Meet the tool store team")
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
            f'<div style="{FONT}font-size:10px;color:#7A8A9A;padding-top:6px;">The position on one card - '
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
    parts = []

    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td bgcolor="#1A2430" style="padding:22px 24px 19px 24px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td>
<div style="{FONT}font-size:11px;font-weight:bold;letter-spacing:2.5px;color:#F36F21;text-transform:uppercase;">{esc(CONFIG['kicker_team'])}</div>
<div style="{FONT}font-size:26px;font-weight:bold;color:#FFFFFF;padding-top:8px;">Ampol Stocktake - Today's Count</div>
<div style="{FONT}font-size:13px;color:#A7B6C4;padding-top:7px;">{esc(CONFIG['project'])}</div>
</td>
<td width="185" align="right" style="vertical-align:top;">
<div style="{FONT}font-size:11px;font-weight:bold;letter-spacing:1.5px;color:#FFFFFF;">POWERED BY <span style="color:#F36F21;">SITEIQ</span></div>
<div style="{FONT}font-size:11.5px;color:#8395A6;padding-top:5px;">Equipped for anything</div>
</td></tr></table>
<div style="{FONT}font-size:11px;color:#8395A6;padding-top:10px;line-height:1.6;">Generated: <b style="color:#FFFFFF;">{esc(gen_s)}</b> &nbsp;|&nbsp; Data as at: <b style="color:#FFFFFF;">{esc(asat_s)}</b> (SiteIQ stocktake export) &nbsp;|&nbsp; Author: <b style="color:#FFFFFF;">Andrew Fisher</b></div>
</td></tr></table>""")
    if card_cid:
        parts.append(card_block(card_cid))

    key_cols = {"orange": "#F36F21", "blue": "#2F7FD0",
                "amber": "#E0930F", "green": "#16A34A"}
    key_bits = "&nbsp;&nbsp;".join(
        f'<span style="color:{key_cols[c]};">&#9679; <b>{esc(t)}</b></span> '
        f'<span style="color:#7A8A9A;">{esc(x)}</span>'
        for c, t, x in CONFIG["key_items"])
    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="{FONT}font-size:10px;padding:12px 2px 8px 2px;line-height:1.9;">
<span style="color:#8A9AAC;font-weight:bold;letter-spacing:1.5px;">KEY</span>&nbsp;&nbsp;{key_bits}</td></tr>
<tr><td>{sh.rule_png(CW)}</td></tr></table>""")

    parts.append(sh.ecallout(
        f'<span style="color:#D95F14;font-weight:bold;text-transform:uppercase;">'
        f'This one is yours.</span> The client sees a compliance report that '
        f'says the store is under control - this is the work that makes it '
        f'true. {sh.eo(f"{oncyc:.0f}%")} of in-store items are inside their '
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
<div style="{FONT}font-size:10.5px;color:#98A6B4;padding-top:8px;">In-store items inside their tier cycle</div></td>
<td style="vertical-align:top;padding-left:16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
{sh.score_bar_row("SOP 30-day compliance", round(comp), f"{num(d['ok30'])} of {num(d['countable'])} countable items sighted inside 30 days")}
{sh.score_bar_row("Gas monitors - 30-day SOP", round(next(p for k, *_, p in [(t[0], t[9]) for t in d['tier_stats']] if k == 'gas')), "in-store gas monitors inside the 30-day SOP")}
{sh.score_bar_row("Value verified 30d", round((d['val_ok30'] / d['val_total'] * 100) if d['val_total'] else 0), f"{money(d['val_ok30'])} of {money(d['val_total'])} priced fleet")}
</table></td></tr></table>""")

    parts.append(sh.etiles([
        (f'{len(g_seen)}/{len(g_all)}', "IN-STORE GAS MONITORS SIGHTED 24H",
         f'{len(g_miss)} missed' if g_miss else "all sighted",
         "#F0603E" if g_miss else "#22C55E"),
        (f'{len(r_seen)}/{len(r_all)}', "IN-STORE RADIOS SIGHTED 24H",
         f'{len(r_miss)} missed' if r_miss else "all sighted",
         "#F0603E" if r_miss else "#22C55E"),
        (f'{len(b_seen)}/{len(b_all)}', "IN-STORE BATTERIES SIGHTED 24H",
         f'{len(b_miss)} missed' if b_miss else "all sighted",
         "#F0603E" if b_miss else "#22C55E"),
        (num(due_all), "DUE ON TIER TARGETS", "worklist attached", "#EFA82B"),
    ]))

    wk = a["weekly"]
    parts.append(sh.esubh("Register freshness - items by week of their latest sighting"))
    parts.append(sh.epanel(sh.line_png(
        [w["label"] for w in wk],
        [{"vals": [w["n"] for w in wk], "colour": K["orange"],
          "label": "Items by week of latest sighting", "fill": True}], CW - 28)))

    lg = a["league"][:8]
    lrows = [[esc(x["name"]), num(x["d7"]), num(x["d30"]), num(x["st30"]),
              esc(x["last"].strftime("%d %b %H:%M") if x["last"] else "")]
             for x in lg]
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
        f'Full item-by-item detail: the <b style="color:#16202C;">worklist PDF '
        f'and Excel workbook attached</b>. The client compliance PDF and the '
        f'team report are attached too - same numbers, one engine. '
        f'{num(len(d["missed_returns"]))} possible missed returns are section 0 '
        f'of the worklist - resolve those first.'))

    team_line = " &middot; ".join(
        f'<b style="color:#16202C;">{esc(p["name"])}</b> '
        f'<span style="color:#8A9AAC;">{esc(p["role"])}</span>'
        for p in CONFIG["team"])
    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:26px;">
<tr><td style="border-top:1px solid #E4E8EC;padding-top:10px;">
<div style="{FONT}font-size:10px;font-weight:bold;letter-spacing:2px;color:#F36F21;text-transform:uppercase;">Your Coates Tool Store Team</div>
<div style="{FONT}font-size:11px;color:#8A9AAC;padding-top:5px;line-height:1.7;">{team_line}</div>
<div style="{FONT}font-size:10px;color:#98A6B4;padding-top:9px;line-height:1.7;">
Coates Hire &middot; Sources: SiteIQ STOCKTAKE export ({esc(asat_s)}), RENTAL_STOCK register, pricing master. Unpriced items excluded from value totals, never estimated; serial-numbered gas monitors priced by their family line. Activity figures are items by their latest sighting (the export keeps one sighting per item). Descriptions still carrying the site&rsquo;s former name in SiteIQ ({num(d["former_name_lines"])}) are shown under the current name. The Coates Way - consistent execution, every day. <b style="color:#16202C;">POWERED BY SITEIQ</b></div>
</td></tr></table>""")

    body = "".join(
        f'<tr><td style="padding:0 24px;">{p}</td></tr>'
        if "bgcolor=\"#1A2430\"" not in p[:120] else f'<tr><td>{p}</td></tr>'
        for p in parts)
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Ampol Stocktake - {esc(asat_s)}</title></head>
<body bgcolor="#EEF1F4" style="margin:0;padding:0;background-color:#EEF1F4;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#EEF1F4">
<tr><td align="center" style="padding:18px 10px;">
<table role="presentation" width="{W}" cellspacing="0" cellpadding="0" bgcolor="#FFFFFF" style="width:{W}px;max-width:{W}px;">
<tr><td height="6" bgcolor="#F36F21" style="font-size:0;">&nbsp;</td></tr>
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
    fixes_path = eng.find_workbook(["New_Descriptions*.xlsx", "*Descriptions*.xlsx"])
    pricing_path = eng.find_workbook(["*Pricing*.xlsx"])
    if not src:
        sys.exit("ERROR: no STOCKTAKE*.xlsx in the suite's Data folder - save "
                 "the SiteIQ export there and run again.")
    print(f"Stocktake export     : {src}")
    print(f"Register             : {master_path or 'NOT FOUND'}")
    OUT.mkdir(exist_ok=True)

    master = eng.load_master(master_path) if master_path else {}
    fixes = eng.load_corrections(fixes_path) if fixes_path else ({}, {})
    exact, stripped, conflicts = (eng.load_pricing(pricing_path)
                                  if pricing_path else ({}, {}, []))
    rows, transit, export_dt = eng.load(src, master, fixes, exact, stripped)
    d = eng.derive(rows, export_dt)
    d["transit_n"] = transit
    a = analytics(rows, d, export_dt, load_actions(src))

    asat_s = export_dt.strftime("%d %b %Y %H:%M")
    gen_dt = datetime.now()
    gen_s = gen_dt.strftime("%d %b %Y %H:%M")
    print(f"Data as at           : {asat_s}  (export request time)")
    print(f"Countable / departed : {len(rows):,} / {transit:,} excluded "
          f"(in store {len(d['instore']):,}, on hire {len(d['onhire']):,})")
    print(f"SOP 30d compliance   : {d['comp30']:.1f}%  "
          f"({d['ok30']:,} of {d['countable']:,} = {d['ok30_instore']:,} in store + {d['ok30_onhire']:,} on hire)")
    print(f"Priced by family     : {d['priced_family']:,} serial-numbered gas monitors "
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
        f"<b>{len(g_seen)} of {len(g_all)}</b> in-store gas monitors sighted in the last 24 hours"]

    def cover_for(contents):
        # the cover wears the SAME status as the band on the position page,
        # says how old the data was when the pack was built, and lists
        # what's inside with page numbers read off the printed pack
        return sh.cover_page(cfg_for("client"), key_value, key_label, cover_lines, gen_s, asat_s,
                             rag=status, fresh=sh.freshness_line(export_dt, gen_dt), contents=contents)
    client_pages = build_client_pages(rows, d, a, export_dt)
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
        (num(d["countable"]), "Countable items", f"{num(len(d['instore']))} in store", "#7A8A9A"),
        (f"{ins_pct:.1f}%", "In-store SOP 30d", f"{num(len(a['ins_over30']))} shelf items outside", "#22C55E" if status == "green" else "#EFA82B"),
        (f"{d['comp30']:.1f}%", "Whole store SOP 30d", "on-hire counted in", "#7A8A9A"),
        (num(len(d["done7"])), "Sighted last 7 days", "items", "#22C55E"),
        (f"{len(g_seen)}/{len(g_all)}", "Gas monitors 24h", f"{len(g_miss)} missed" if g_miss else "all sighted", "#F0603E" if g_miss else "#22C55E"),
        (money(d["val_ok30"]), "Value verified 30d", f"of {money(d['val_total'])}", "#7A8A9A"),
    ], (status, f"{ins_pct:.1f}% of in-store items sighted inside 30 days; {num(len(a['ins_over30']))} shelf items outside; "
                f"{num(len(d['missed_returns']))} possible missed returns.", "Andrew Fisher, Shutdown Manager",
        f"Shelf items on the worklist cleared by {(export_dt + timedelta(days=7)).strftime('%d %b %Y')}"),
        [(lab, round(p30)) for k, lab, tgt, why, tot, ohn, insn, wt, w30, p30 in d["tier_stats"]][:4],
        str(card_path), f"Counted from the SiteIQ exports of {asat_s} - nothing estimated.")
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
               f"{export_dt.strftime('%d/%m/%Y %H:%M')}")
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
