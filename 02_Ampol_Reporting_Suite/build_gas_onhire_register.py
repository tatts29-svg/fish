#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
COATES | AMPOL - GAS MONITORS ON HIRE, BY COMPANY (button 18)
=====================================================================
Author: Andrew Fisher | POWERED BY SITEIQ

WHY (06 Sep 2026, Andrew): the gas monitor report's companion - every
company holding a fleet gas monitor, every person under it, A to Z
both ways, with anything out two days or more highlighted. Goes out on
the same email as the gas report as a second attachment.

Pages
  cover           the one number, the status stripe, what's inside
  the position    tiles, the RAG band, three things, companies at a glance
  the register    one table per company (A to Z), people A to Z, each
                  person's monitors oldest first; rows out 2 days or
                  more are amber, 7 days or more red - nothing else is
                  coloured, so the eye lands on what needs chasing
  custody lines   the FCCU, Operations, Future Fuels, After Hours and
                  Dräger service holdings, summarised - workflows, not
                  people, so they are never mixed into the chase list
  data page       where every number comes from

Every row is a barcode read from the SiteIQ register pull - the same
fleet, the same rows, the same days-out arithmetic as the gas monitor
report (gasmon_engine). Nothing is typed in or estimated.
"""
import os
import sys
from collections import defaultdict
from datetime import datetime

import ampol_names
import ampol_paths
import gasmon_engine as ge
import k2flow as kf
import k2shell as sh
import pdf_finish
from build_radio_report import write_pdf_robust, _page_count
from k2shell import esc, num, K

HIGHLIGHT_DAYS = 2      # Andrew (06 Sep 2026): out two days or more is outstanding
RED_DAYS = 7            # a week out is a conversation, not a reminder
CONFIG = {
    "stem_key": "gas_onhire",
    "amber_pct": 10.0,  # share of people-held monitors out 2 days or more - defaults, Andrew to confirm
    "red_pct": 25.0,
    "rag_owner": "Andrew Fisher, Shutdown Manager",
    "rag_due_days": 1,
}
COVER_PAGE = True
GENERATED = datetime.now()

CFG = {
    "client": "Ampol", "title": "Gas Monitors On Hire by Company",
    "kicker": "COATES · TOOL STORE · GAS MONITORS ON HIRE",
    "project": "Ampol Lytton Refinery · Permanent Tool Store",
    "asat_note": "(SiteIQ register pull)",
    "key_items": [("amber", "2+ DAYS", "amber - back to the store today"),
                  ("red", "7+ DAYS", "red - a conversation, not a reminder"),
                  ("blue", "ORDER", "companies A to Z, people A to Z, oldest first")],
    "team": [{"name": "Andrew Fisher", "role": "Shutdown Manager", "shift": "",
              "email": "andrew.fisher@coates.com.au",
              "blurb": "Oversees the store and the gas monitor fleet - anything at all, start here",
              "lead": True}],
}
EXTRA_CSS = f"""
.k2body table.dt tr.hl2 td {{ background: #FFF4E5; }}
.k2body table.dt tr.hl7 td {{ background: #FDE8E8; }}
.k2body table.dt tr.hl2 td.days, .k2body table.dt tr.hl7 td.days {{ font-weight: 700; }}
.k2body table.dt tr.hl7 td.days {{ color: {K['red']}; }}
.k2body table.dt tr.hl2 td.days {{ color: #B7621B; }}
.k2body .chip {{ display: inline-block; padding: 1px 7px; border-radius: 9px; font-size: 8.4px; font-weight: 700;
  letter-spacing: .4px; text-transform: uppercase; }}
.k2body .chip.a {{ background: #FCE3C4; color: #8A4A0E; }}
.k2body .chip.r {{ background: #F9C9C9; color: #8E1B1B; }}
.k2body .chip.g {{ background: #DDF3E4; color: #176B39; }}
.k2body table.dt td.rep {{ color: #8A9AAC; }}
.k2body table.dt td.quiet {{ color: #8A9AAC; font-size: 8.6px; }}
.k2body .glance td.r b {{ color: {K['red']}; }}
"""


def dfmt(d):
    return d.strftime("%d %b %Y %H:%M") if d else "-"


def load_rows():
    ctx = ge.load()
    m = ge.compute(ctx)
    asat = ctx["asat"]
    today = asat.date()
    rows = []
    for r in ctx["rs"]:
        if not r["on_hire"]:
            continue
        days = (today - r["on_dt"].date()).days if r["on_dt"] else 0
        rows.append({
            "kind": r["kind"], "co": r["co"] or "Unknown", "who": ampol_names.display_person(r["who_raw"]),
            "who_raw": r["who_raw"], "bc": r["bc"],
            "serial": r.get("serial") or ampol_names.serial_in_desc(r["desc"]) or "",
            "on_dt": r["on_dt"], "days": days,
        })
    return rows, m, ctx


def chip(days):
    """The status column: a red chip from RED_DAYS, an amber chip from
    HIGHLIGHT_DAYS, and quiet text under that - the gas monitor report
    counts a monitor overdue from 1 day, so a 1-day row is never called
    'in time' here; it is simply not highlighted, as Andrew asked."""
    if days >= RED_DAYS:
        return f'<span class="chip r">{RED_DAYS}+ days</span>'
    if days >= HIGHLIGHT_DAYS:
        return f'<span class="chip a">{HIGHLIGHT_DAYS}+ days</span>'
    return f'<span class="quiet">under {HIGHLIGHT_DAYS} days</span>'


def build_html(rows, m, ctx, contents=None):
    asat = ctx["asat"]
    asat_s = asat.strftime("%d %b %Y %H:%M")
    gen_s = GENERATED.strftime("%d %b %Y %H:%M")
    people = [r for r in rows if r["kind"] == "crew"]
    custody = [r for r in rows if r["kind"] != "crew"]
    n = len(people)
    out2 = [r for r in people if r["days"] >= HIGHLIGHT_DAYS]
    out7 = [r for r in people if r["days"] >= RED_DAYS]
    companies = sorted({r["co"] for r in people}, key=ampol_names.sort_key)
    names = {(r["co"], r["who"]) for r in people}
    oldest = max(people, key=lambda r: r["days"]) if people else None
    share = (len(out2) / n * 100.0) if n else 0.0
    status = sh.rag_of(share, CONFIG["amber_pct"], CONFIG["red_pct"])
    due = (asat.date()).strftime("%d %b %Y") if CONFIG["rag_due_days"] == 0 else \
        (asat + __import__("datetime").timedelta(days=CONFIG["rag_due_days"])).strftime("%d %b %Y")

    # ---- by company ---------------------------------------------------------
    by_co = defaultdict(list)
    for r in people:
        by_co[r["co"]].append(r)

    def co_stats(co):
        items = by_co[co]
        return {"n": len(items), "people": len({r["who"] for r in items}),
                "out2": sum(1 for r in items if r["days"] >= HIGHLIGHT_DAYS),
                "out7": sum(1 for r in items if r["days"] >= RED_DAYS),
                "oldest": max(r["days"] for r in items) if items else 0}

    # ---- page 1: the position ---------------------------------------------
    P = []
    P.append('<div class="sect"><h3>The position - gas monitors on hire to people</h3></div>')
    line = {"green": f"under the {CONFIG['amber_pct']:g}% amber line",
            "amber": f"above the {CONFIG['amber_pct']:g}% amber line, below the {CONFIG['red_pct']:g}% red line",
            "red": f"above the {CONFIG['red_pct']:g}% red line"}[status]
    P.append(sh.rag_band(
        status,
        f'<span class="o">{num(len(out2))}</span> of the {num(n)} monitors on hire to people have been out '
        f'<span class="o">{HIGHLIGHT_DAYS} days or more</span> ({share:.1f}%) - {line}. {num(len(out7))} of them a week or more.',
        f"Share of people-held monitors out {HIGHLIGHT_DAYS} days or more: Green under {CONFIG['amber_pct']:g}%, Amber from "
        f"{CONFIG['amber_pct']:g}%, Red from {CONFIG['red_pct']:g}% (default lines - set in CONFIG). Custody and workflow "
        f"accounts are kept apart.",
        esc(CONFIG["rag_owner"]),
        f"Every highlighted monitor back to the store or rescanned; supervisors of the companies below told this "
        f"morning - by <b>{esc(due)}</b>."))
    P.append(sh.tiles([
        ("box", num(n), "Monitors on hire to people", f"{num(len(custody))} more on custody and workflow accounts", "grey"),
        ("layers", num(len(companies)), "Companies", f"{num(len(names))} people", "grey"),
        ("warn", num(len(out2)), f"Out {HIGHLIGHT_DAYS} days or more", "highlighted in the register", "red" if out2 else "green"),
        ("clock", f"{num(oldest['days'])} d" if oldest else "-", "Oldest",
         f"{oldest['who']}, {oldest['co']}" if oldest else "", "amber" if oldest and oldest["days"] >= RED_DAYS else "grey"),
    ]))
    top = sorted(companies, key=lambda c: (-co_stats(c)["out2"], ampol_names.sort_key(c)))
    things = []
    for c in top[:3]:
        st = co_stats(c)
        if st["out2"] == 0:
            break
        worst = max(by_co[c], key=lambda r: r["days"])
        things.append((f"Chase {c} for {num(st['out2'])} monitor{'s' if st['out2'] != 1 else ''} out {HIGHLIGHT_DAYS} days or more",
                       f"oldest with {worst['who']}, {num(worst['days'])} days ({worst['bc']})",
                       f"{CONFIG['rag_owner'].split(',')[0]} · by {due}"))
    P.append(sh.three_things(things))
    P.append(f'<div class="callout tight"><span class="lead">The register.</span> Every fleet gas monitor on hire to a '
             f'person at the SiteIQ pull of <b>{esc(asat_s)}</b>: <b>{num(n)}</b> monitors across <b>{num(len(companies))}</b> '
             f'companies and <b>{num(len(names))}</b> people. Companies A to Z, people A to Z, each person\'s monitors '
             f'oldest first. Amber = out {HIGHLIGHT_DAYS} days or more, red = {RED_DAYS} days or more; anything under '
             f'{HIGHLIGHT_DAYS} days is left plain. Same fleet, same rows, same day count as the gas monitor report, '
             f'which counts a monitor overdue from 1 day - this register highlights from {HIGHLIGHT_DAYS}, as asked.</div>')
    # companies at a glance
    P.append('<div class="sect"><h3>Companies at a glance - A to Z</h3></div>')
    grows = []
    for c in companies:
        st = co_stats(c)
        grows.append([esc(c), num(st["n"]), num(st["people"]),
                      f'<b>{num(st["out2"])}</b>' if st["out2"] else '<span class="tbc">0</span>',
                      f'<b>{num(st["out7"])}</b>' if st["out7"] else '<span class="tbc">0</span>',
                      num(st["oldest"])])
    P.append(kf.dtable_flow(["Company", "Monitors", "People", f"Out {HIGHLIGHT_DAYS}+ days", f"Out {RED_DAYS}+ days",
                             "Oldest (days)"], grows, ["", "r", "r", "r", "r", "r"], "cp glance"))

    # ---- the register -------------------------------------------------------
    P.append(kf.divider_block("The register - by company", f"{num(n)} monitors · {num(len(companies))} companies · people A to Z",
                              f"Amber rows are out {HIGHLIGHT_DAYS} days or more, red rows {RED_DAYS} days or more."))
    P.append('<div class="sect"><h3>The register - by company</h3></div>')
    hdr = ["Person", "Asset", "Serial", "Out since", "Days out", "Status"]
    al = ["", "nw", "nw", "nw", "r days", ""]
    far = datetime.max
    for c in companies:
        st = co_stats(c)
        # people A to Z; inside a person, oldest first by the on-hire time itself
        items = sorted(by_co[c], key=lambda r: (ampol_names.sort_key(r["who"]), r["on_dt"] or far, r["bc"]))
        trs = []
        last = None
        for i, r in enumerate(items):
            cls = "hl7" if r["days"] >= RED_DAYS else ("hl2" if r["days"] >= HIGHLIGHT_DAYS else ("z" if i % 2 else ""))
            # the name on every row - quiet on a repeat - so a person whose
            # monitors run over a page break is still named on the next page
            rep_cls = " rep" if r["who"] == last else ""
            last = r["who"]
            tds = [esc(r["who"]), esc(r["bc"]), esc(r["serial"]) or '<span class="tbc">-</span>', esc(dfmt(r["on_dt"])),
                   num(r["days"]), chip(r["days"])]
            cells = "".join(f'<td class="{a}{rep_cls if j == 0 else ""}">{v}</td>' for j, (v, a) in enumerate(zip(tds, al)))
            trs.append(f'<tr class="{cls}">{cells}</tr>')
        meta = (f'{num(st["n"])} monitor{"s" if st["n"] != 1 else ""} · {num(st["people"])} '
                f'{"person" if st["people"] == 1 else "people"} · '
                + (f'<b>{num(st["out2"])} out {HIGHLIGHT_DAYS}+ days</b>' if st["out2"] else "all in time"))
        P.append(kf.group_table(c, meta, hdr, [], al, "cp", rows_html=f'<tbody>{"".join(trs)}</tbody>'))

    # ---- custody and workflow accounts --------------------------------------
    P.append('<div class="sect"><h3>Custody and workflow accounts - not people</h3></div>')
    P.append(f'<div class="note">Monitors held on the FCCU turnaround, Ampol Operations, Future Fuels, After Hours and '
             f'Dräger service lines are workflows, not people, and are never mixed into the chase list above. The gas '
             f'monitor report carries their detail; this is the summary at {esc(asat_s)}.</div>')
    labels = {k: v["label"] for k, v in m["custody"].items()}
    labels["repair"] = "Dräger service (repair, calibration, failed bump)"
    by_kind = defaultdict(list)
    for r in custody:
        by_kind[r["kind"]].append(r)
    crow = []
    for k in sorted(by_kind, key=lambda k: ampol_names.sort_key(labels.get(k, k))):
        items = by_kind[k]
        crow.append([esc(labels.get(k, k)), num(len(items)), num(max(r["days"] for r in items)),
                     esc(", ".join(sorted({ampol_names.hirer_label(r["who_raw"]) for r in items}, key=ampol_names.sort_key)[:3])
                         + (" and more" if len({r["who_raw"] for r in items}) > 3 else ""))])
    P.append(kf.dtable_flow(["Account", "Monitors", "Oldest (days)", "SiteIQ hirer names"], crow, ["", "r", "r", ""], "cp"))

    # ---- data page ------------------------------------------------------------
    P.append('<div class="pb"></div><div class="sect"><h3>Data and method - where every number comes from</h3></div>')
    src = ctx.get("rs_path", "")
    P.append(kf.dtable_flow(["Source", "What it gives this report", "Pulled"], [
        [esc(os.path.basename(src)), "Every fleet gas monitor with status On Hire, the hirer, the company and the on-hire date and time",
         esc(asat_s)],
        [esc(os.path.basename(ctx.get("ser_path") or "") or "serial list"), "The serial printed beside each asset - display only", "-"],
    ], ["nw", "", "nw"], "cp"))
    P.append(f'<div class="note">Fleet = descriptions containing "X-am" or "gas monitor"; chargers, probes and pumps are not '
             f'monitors. Days out = calendar days from the on-hire date to the pull date, the same arithmetic as the gas '
             f'monitor report. A person is a named hirer; the custody and workflow accounts are decided by the hirer name, '
             f'as in the gas monitor report. The gas monitor report counts a monitor overdue from 1 day; this register '
             f'highlights from {HIGHLIGHT_DAYS} days (amber) and {RED_DAYS} days (red), the lines Andrew set on 06 Sep 2026 - '
             f'set at the top of build_gas_onhire_register.py. Names are shown under the suite\'s one rule (First Last; '
             f'one name per customer). Nothing on these pages is typed in or estimated.</div>')
    P.append(sh.coates_way_panel(("Care Deeply", "Customer Focused"), ("Consistent execution",),
                                 "Every monitor back, every day - the register is the conversation starter, not the argument."))

    cover = kf.cover_block(CFG, num(len(out2)), f"monitors out {HIGHLIGHT_DAYS} days or more, of {num(n)} on hire to people", [
        f"{num(len(companies))} companies · {num(len(names))} people",
        f"{num(len(out7))} out {RED_DAYS} days or more",
        f"Oldest: {num(oldest['days'])} days" if oldest else "",
    ], gen_s, asat_s, rag=status, fresh=sh.freshness_line(asat, GENERATED), contents=contents) if COVER_PAGE else None
    return kf.flow_doc(CFG, gen_s, asat_s, "".join(P), extra_css=EXTRA_CSS, cover=cover), {
        "n": n, "out2": len(out2), "out7": len(out7), "companies": len(companies), "people": len(names),
        "custody": len(custody), "status": status, "asat_s": asat_s}


def main():
    print("=" * 66)
    print(" COATES | AMPOL - GAS MONITORS ON HIRE BY COMPANY")
    print("=" * 66)
    rows, m, ctx = load_rows()
    html, s = build_html(rows, m, ctx)
    out = ampol_paths.day_folder("Gas_Monitors")
    stem = ampol_names.report_stem(CONFIG["stem_key"])
    base = os.path.join(out, stem)
    with open(f"{base}.html", "w", encoding="utf-8") as f:
        f.write(html)
    ok = write_pdf_robust(f"{base}.html", f"{base}.pdf")
    if ok and COVER_PAGE:
        contents = pdf_finish.contents_from_pdf(f"{base}.pdf", html, has_cover=True, skip=("Meet the tool store team",))
        if contents:
            n1 = _page_count(f"{base}.pdf")
            html, s = build_html(rows, m, ctx, contents=contents)
            with open(f"{base}.html", "w", encoding="utf-8") as f:
                f.write(html)
            ok = write_pdf_robust(f"{base}.html", f"{base}.pdf")
            n2 = _page_count(f"{base}.pdf") if ok else None
            print(f"Cover contents     : {len(contents)} rows - pass 1 {n1} pages, pass 2 {n2} pages"
                  + (" - identical" if n1 == n2 and n1 else ""))
            if ok and n1 and n2 and n1 != n2:
                raise SystemExit("The second pass printed a different page count from the first. Not written.")
    if ok:
        print(pdf_finish.finish(f"{base}.pdf", f"Ampol Gas Monitors On Hire by Company - as at {s['asat_s']}",
                                f"Every company and person holding a fleet gas monitor at the SiteIQ register pull of "
                                f"{s['asat_s']}, monitors out {HIGHLIGHT_DAYS} days or more highlighted.",
                                html, keywords="gas monitors, on hire, by company", has_cover=COVER_PAGE, family="Gas_Monitors"))
    print(f"Data as at         : {s['asat_s']}  (RENTAL_STOCK request time)")
    print(f"On hire to people  : {s['n']:,} monitors | {s['companies']} companies | {s['people']} people | "
          f"out {HIGHLIGHT_DAYS}+ days {s['out2']} | out {RED_DAYS}+ days {s['out7']} | custody lines {s['custody']} | status {s['status'].upper()}")
    print(f"Output             : {base}.pdf")
    print("Done. The Coates Way - consistent execution, every day.")


if __name__ == "__main__":
    main()
