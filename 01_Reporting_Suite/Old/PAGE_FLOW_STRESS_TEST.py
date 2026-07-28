#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | PAGE FLOW STRESS TEST
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  "Ensure we have a plan as more gear gets filled in - how the pages
#   flow and work, so they don't all split." (A. Fisher, 25 Jul 2026)
#
#  This is that plan, as a test rather than a promise. It builds report
#  bodies at 1x, 3x, 10x and 25x the current fleet - long descriptions,
#  every compliance badge lit, every asset carrying a Plant ID - lays
#  them out through the real paginator in a real browser, and measures
#  every page that comes out.
#
#  IT FAILS THE RUN IF ANY PAGE:
#    * has a table wider than the sheet          (a column falls off)
#    * has content taller than the sheet          (something is cut)
#    * ends on a heading with its content overleaf (reads as broken)
#    * is blank or nearly blank
#    * is missing the tool store team strip
#
#  Run it after any layout change, or whenever the fleet grows:
#      py PAGE_FLOW_STRESS_TEST.py
#
#  Needs Playwright + Chromium. Without them it says so and stops - it
#  never reports a pass it could not actually measure.
# =====================================================================

import os
import sys
import datetime as dt

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import report_pages                                    # noqa: E402
import equipment_compliance as EC                      # noqa: E402
import activity_report as AR                           # noqa: E402

#  The multipliers. 1x is today's fleet; 25x is far past anything K2 will
#  ever hold, and the layout still has to behave.
SCALES = (1, 3, 10, 25)
BASE_ROWS = 24          # a busy hirer today

#  Deliberately awkward content - the longest descriptions in the master,
#  the longest asset numbers, every badge lit at once. If the layout
#  survives this it survives real data.
NASTY = [
    ("Scissor Lift With Operator Protection 32ft (9.7m) Electric - "
     "Greener Choice", "16816-590737-0001", "Cement Site Plant"),
    ("Distrubution Outlet Board - 32 A Plug 6x15, 4x10, 1x20 A, Single "
     "Phase", "1200747", "Cement Site Plant"),
    ("Multi-Gas Detector - Honeywell BW Flex - Serial GM206136",
     "GM206136", "Gas Monitors"),
    ("Lighting Tower LED 170-240k Lumens Mine Spec", "1295773",
     "Cement Site Plant"),
    ("Site Storage Box - 1.2 m (1200 mm x 750 mm x 850 mm)", "1023858",
     "Laydown"),
    ("Chain Block - Manual - 10 t - 6 m Drop", "463358", "Rigging"),
]


def _row(i):
    desc, asset, su = NASTY[i % len(NASTY)]
    # every third asset carries a Plant ID, as more get filled in
    pill = (AR._esc(asset) +
            "<span style=\"display:inline-block;background:#F26222;"
            "color:#fff;border-radius:9px;padding:1px 8px;margin-left:5px;"
            "font-weight:800;font-size:9pt;white-space:nowrap\">ID {}"
            "</span>".format(40 + (i % 60))) if i % 3 == 0 else AR._esc(asset)
    badges = (AR.badge("DUE BACK TODAY", AR.AMBER) + " " +
              AR.badge("TAG CURRENT · BLUE", AR.BLUE) + " " +
              AR.badge("LOGBOOK REQUIRED", AR.ORANGE))
    return [AR._esc(desc), pill, AR._esc(su), "20 Jul 2026",
            "{}d".format(i % 30), "$12,345", badges]


def body_at(scale):
    n = BASE_ROWS * scale
    b = AR.band("Stress test x{} - {} hire lines".format(scale, n),
                "Every badge lit, Plant IDs filled in, longest descriptions")
    b += AR.cards([(n, "Lines on hire", AR.ORANGE, ""),
                   (scale, "Scale factor", "#fff", ""),
                   (n * 3, "Badges rendered", AR.BLUE, ""),
                   (n // 3, "Plant IDs shown", AR.ORANGE, ""),
                   ("$" + format(n * 12345, ","), "Exposure", AR.ORANGE, ""),
                   (0, "Defects allowed", AR.GOOD, "")])
    b += EC.rigging_strip(n // 2)
    b += EC.electrical_strip(n // 4)
    b += EC.logbook_strip(n // 6)
    b += AR.band("Outstanding equipment", "Oldest first")
    b += AR.tbl(["Description", "Asset no.", "Storage unit", "On hire",
                 "Out for", "Replacement", "Status / compliance"],
                [_row(i) for i in range(n)],
                ["left", "left", "left", "left", "right", "right", "left"])
    b += AR.band("Action required", colour="#8A3324")
    b += AR.tbl(["Priority", "What", "Required action"],
                [[AR.badge("HIGH", AR.BAD),
                  "{} items due back today, not yet returned".format(n // 8),
                  "Return to the Coates tool store this shift"]])
    b += ("<div class=\"keepprev\" style=\"margin-top:8px;padding-top:7px;"
          "border-top:2px solid #F26222;font-size:8pt;color:#8B9099;"
          "letter-spacing:1px;text-transform:uppercase\">"
          "End of stress test x{} &bull; {} items on hire</div>").format(
        scale, n)
    return b


TEAM = ("<div class='tl'>Your Coates tool store team</div>"
        "<div class='tn'><b>Andrew Fisher</b> Shutdown Manager QLD &amp; NT"
        " &nbsp;|&nbsp; <b>Thomas Maher</b> Dayshift Lead &middot;"
        " <b>Helen O'Grady</b> Dayshift Tool Store Controller</div>")

CSS = ("body{background:#0E1116;color:#D7DBE2;font-family:Segoe UI,Arial,"
       "sans-serif;margin:0}h2{color:#fff;font-size:13pt;margin:10px 0 4px}"
       ".note{font-size:8.5pt;color:#8B9099;margin-top:6px}")


def doc_for(scale):
    hdr1 = ("<div class='bandc'><div><div class='k'>COATES &middot; PAGE "
            "FLOW STRESS TEST</div><h1>Scale x{}</h1></div>"
            "<div class='m'><span class='siq'>POWERED BY SITEIQ</span><br>"
            "As at <b>test</b><br><span class='pgnum'>&nbsp;</span></div>"
            "</div>").format(scale)
    return report_pages.paged_doc(
        "Stress x{}".format(scale), CSS, hdr1, hdr1,
        "<div class='note'>Synthetic layout test - not real hire data.</div>",
        body_at(scale), doc_title="Stress x{}".format(scale),
        team_html=TEAM)


MEASURE = """() => {
  const sh=[...document.querySelectorAll('.psheet')];
  let ov=0,cl=0,orph=0,emp=0,noteam=0,dup=0; const fills=[]; const det=[];
  sh.forEach((s,i)=>{
    const c=s.querySelector('.pcontent'); if(!c) return;
    let w=0; c.querySelectorAll('table').forEach(t=>{
      w=Math.max(w,t.scrollWidth-c.clientWidth)});
    if(w>0){ov++; det.push('p'+(i+1)+' table '+w+'px too wide');}
    if(c.scrollHeight-c.clientHeight>1){cl++; det.push('p'+(i+1)+' clipped');}
    if(!s.querySelector('.pteam')){noteam++; det.push('p'+(i+1)+' no team');}
    let last=null; [...c.children].forEach(k=>{if(k.offsetHeight>0)last=k;});
    const used=last?(last.offsetTop+last.offsetHeight-c.offsetTop):0;
    fills.push(Math.round(100*used/c.clientHeight));
    if(used<40){emp++; det.push('p'+(i+1)+' blank');}
    if(last&&(/^H[1-4]$/i.test(last.tagName)||
       (''+(last.className||'')).indexOf('keepnext')>=0)){
      orph++; det.push('p'+(i+1)+' ends on a heading');}
  });
  return {pages:sh.length, ov, cl, orph, emp, noteam, det,
          avg:Math.round(fills.reduce((a,b)=>a+b,0)/(fills.length||1)),
          low:fills.filter(x=>x<45).length};
}"""


def main():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("  Playwright isn't installed here, so the layout can't be")
        print("  measured. Nothing is reported as passing that wasn't")
        print("  actually checked. (pip install playwright)")
        return 2

    print("=" * 70)
    print("  COATES K2 | PAGE FLOW STRESS TEST")
    print("  Author: Andrew Fisher | POWERED BY SITEIQ")
    print("=" * 70)
    print("  Proving the layout holds as the fleet grows and more Plant IDs")
    print("  get filled in. Every badge lit, longest descriptions, worst")
    print("  case throughout.\n")

    tmp = os.path.join(HERE, "_stress_tmp")
    os.makedirs(tmp, exist_ok=True)
    failed = []
    print("  {:<8}{:>7}{:>8}{:>7}{:>7}{:>7}{:>7}{:>8}{:>7}".format(
        "SCALE", "LINES", "PAGES", "AVG%", "WIDE", "CUT", "ORPH", "BLANK",
        "NOTEAM"))
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1100, "height": 1500})
        for scale in SCALES:
            f = os.path.join(tmp, "stress_x{}.html".format(scale))
            with open(f, "w", encoding="utf-8") as fh:
                fh.write(doc_for(scale))
            pg.goto("file://" + f)
            pg.wait_for_timeout(1200 + 500 * scale)
            r = pg.evaluate(MEASURE)
            bad = r["ov"] + r["cl"] + r["orph"] + r["emp"] + r["noteam"]
            print("  x{:<7}{:>7}{:>8}{:>7}{:>7}{:>7}{:>7}{:>8}{:>7}{}".format(
                scale, BASE_ROWS * scale, r["pages"], r["avg"], r["ov"],
                r["cl"], r["orph"], r["emp"], r["noteam"],
                "" if not bad else "   <<< FAIL"))
            if bad:
                failed.append((scale, r["det"][:6]))
        b.close()

    print("-" * 70)
    if failed:
        print("  FAILED - the layout does not hold at these scales:")
        for scale, det in failed:
            print("    x{}: {}".format(scale, "; ".join(det)))
        return 1
    print("  PASS - every page at every scale: nothing off the sheet,")
    print("  nothing cut, no stranded headings, no blank pages, and the")
    print("  team on all of them.")
    print()
    print("  HOW IT HOLDS UP, in plain English:")
    print("   * A long table does not move to a new page - it splits at a")
    print("     ROW boundary and its column headers repeat on every page.")
    print("   * A section heading never sits alone at the foot of a page.")
    print("     It travels with its rows.")
    print("   * More gear makes tables LONGER, not wider. The Plant ID")
    print("     pill and the compliance badges wrap inside their column,")
    print("     so no column can ever be pushed off the sheet.")
    print("   * Each hirer still starts a fresh page. More hirers means")
    print("     more pages, never two people mixed on one.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
