#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | THE PRINT HUB - every report you have, on one page
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew: "reports are endless").
#
#  They are. This suite writes 62 pages and 54 PDFs before breakfast,
#  into two folders, named the way a computer names things. PICK A
#  REPORT lists what you can BUILD - twenty-three of them - and nothing
#  anywhere lists what you HAVE. So the answer to "where's the hit
#  list" was a scroll through a folder, and the answer to "did the
#  stocktake one build this morning" was to go and look.
#
#  This is the other half: ONE page, built with the rest, that says
#  what is on the shelf today.
#
#    * every report in today's folder, grouped by WHO IT IS FOR
#    * what each one answers, in the words he uses for it
#    * the page and the PDF, one tap each
#    * when it was built and how big it is
#
#  AND WHAT IS NOT THERE. A hub that shows 62 reports and says nothing
#  about the four that failed this morning is worse than no hub - it
#  reads as "all of it" when it is not. Anything that built on a
#  previous day and did NOT build today gets its own section, in red,
#  naming the button that makes it.
#
#  COATES INTERNAL. Some of these carry revenue, so this page lives in
#  Reports\ and never in Gear_Lookup - and every money report on it
#  wears a red chip so nothing goes to a client by accident.
#
#  Run it:  py build_print_hub.py        (or 75_PRINT_HUB)
# =====================================================================
from __future__ import print_function

import datetime as dt
import glob
import html
import io
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPORTS = os.path.join(HERE, 'Reports')


def _esc(s):
    return html.escape('' if s is None else str(s), quote=True)


#  ---------------------------------------------------------------
#  WHAT EACH ONE IS, IN HIS WORDS.
#
#  Keyed on the filename stem with the date taken off. The order here
#  is the order they appear under their heading, so the one he reaches
#  for most is at the top of its group rather than wherever the
#  alphabet put it.
#
#  (stem, what it is, what it answers, money?)
#  ---------------------------------------------------------------
CLIENT = [
    ('Coates_K2_Executive_Summary', 'Executive Daily Summary',
     'The one Cement Australia gets every morning.', 0),
    ('Coates_K2_Safety_Assurance', 'Daily Safety & Compliance',
     'Overdue gear, high-care items, who is holding what. '
     'Site-wide - names every contractor, so it is NOT a contractor '
     'attachment.', 0),
    ('Coates_K2_Cost_Tracking_Snapshot', 'Daily Cost Tracking',
     'What the shutdown is costing, against the plan.', 1),
    ('Coates_SitePlant_Report', 'Site Plant Report',
     'The machines - out, idle, and free to hire.', 0),
    ('Coates_K2_Consumables_Report', 'Consumables Usage',
     'What is being burned through across the site.', 0),
    ('Coates_OnHire_Report_CEMENT_AUSTRALIA_HOLDINGS_PTY_LTD',
     'Cement Australia On-Hire', 'Everything on the client account.', 0),
]

CONTRACTOR = [
    ('Coates_K2_Activity_', 'Activity & Accountability',
     'One per contractor - their position, then a page per person. '
     'This is the ONLY thing a contractor email carries.', 0),
    ('Coates_OnHire_Report_', 'On-Hire Report (the old flat one)',
     'The store\u2019s own copy. Not what a contractor gets any more.', 0),
    ('Coates_OnHire_Summary_ALL_COMPANIES', 'Every company, one summary',
     'The whole site on one sheet, company by company.', 0),
]

STORE = [
    ('Coates_K2_Daily_Hit_List', 'Daily Hit List',
     'Gas, radios, Milwaukee, anything past seven days. The chase.', 0),
    ('Coates_K2_Daily_Brief', 'Daily Brief - the morning one-pager',
     'The whole day on one page before the crews arrive.', 0),
    ('Coates_K2_GearReturn_Demob', 'Gear Return / Demob push',
     'What has to come back, and off whom.', 0),
    ('Coates_K2_Stocktake_RunSheet', 'Stocktake run sheet',
     'The walk-around, in counting order.', 0),
    ('Coates_K2_Stocktake_Scorecard', 'Stocktake scorecard',
     'How the count is tracking.', 0),
    ('Coates_K2_Stocktake_TEAM', 'Stocktake - team report',
     'The same count, for the blokes doing it.', 0),
    ('Coates_K2_Cement_Store_Stock', 'Cement store stock & reorder',
     'What is on the shelf and what to order.', 0),
    ('Coates_K2_Store_Consumables_WATCH', 'Store consumables watch',
     'What is running low before it runs out.', 0),
    ('Coates_K2_Consumable_Requests', 'Consumable requests log',
     'What has been asked for, and by whom.', 0),
    ('Coates_K2_Offline_Day', 'Offline day pack',
     'The day on paper, for when the network is down.', 0),
    ('Coates_K2_Fleet_Details', 'Fleet Details',
     'Every asset ranked, and why one goes out before another.', 0),
    ('Coates_K2_Plant_Dashboard', 'Plant dashboard',
     'The machines, at a glance.', 0),
    ('Coates_K2_Shutdown_Clock', 'Shutdown clock',
     'Where we are in the shut, and what is next.', 0),
    ('Coates_K2_Hidden_Items', 'Held off the board',
     'What a storeman will not see when he searches, and why.', 0),
    ('Coates_K2_Serial_Numbers', 'Serial numbers',
     'Our plant number and the maker’s, side by side.', 0),
]

MINE = [
    ('Coates_K2_Utilisation_Control', 'Utilisation Control',
     'The hub - date range, bars, tiles, the timeline of the shut.', 1),
    ('Coates_K2_Utilisation', 'Utilisation report',
     'How hard the fleet is working.', 1),
    ('Coates_K2_Utilisation_Intelligence', 'Utilisation intelligence',
     'Where the money is going and what to do about it.', 1),
    ('Coates_K2_Billing_Forecast_INTERNAL', 'Billing forecast',
     'Where this lands if nothing changes.', 1),
    ('Coates_K2_Invoice_Breakdown', 'Invoice breakdown',
     'What the SiteIQ invoice is actually made of.', 1),
    ('Coates_K2_Separate_Invoice', 'Separate invoice stream',
     'Baseplan and the rest, kept apart from the hire.', 1),
    ('Coates_K2_Money_And_Whats_Used', 'Money and what is used',
     'The rates against the usage.', 1),
    ('Coates_K2_Returns_Performance', 'Returns performance',
     'Who brings gear back and who does not.', 0),
    ('Coates_K2_Shift_And_Counter_Intel', 'Shift & counter intel',
     'What the counter actually did, hour by hour.', 0),
    ('Coates_K2_Business_Utilisation', 'Business utilisation',
     'The branch view.', 1),
    ('Coates_K2_Flame_Off_Plant', 'Flame Off plant',
     'Every machine since Flame Off, worst idle first. Carries rates.', 1),
]

GROUPS = [('FOR CEMENT AUSTRALIA', CLIENT,
           'What goes to the client. Check it before it goes.'),
          ('FOR THE CONTRACTORS', CONTRACTOR,
           'One per company. The daily packs attach the Activity report '
           'and nothing else.'),
          ('FOR THE STORE', STORE,
           'The counter\u2019s own day. Print what you need and pin it up.'),
          ('MINE - COATES INTERNAL', MINE,
           'Carries revenue. Never goes on the store Wi-Fi and never '
           'goes to a contractor.')]

#  which button rebuilds a thing that did not build this morning
MAKES = {
    'Coates_K2_Daily_Hit_List': '37_PICK_A_REPORT (2)',
    'Coates_K2_Daily_Brief': '37_PICK_A_REPORT (1)',
    'Coates_K2_Executive_Summary': '37_PICK_A_REPORT (7)',
    'Coates_K2_Safety_Assurance': '37_PICK_A_REPORT (6)',
    'Coates_K2_Cost_Tracking_Snapshot': '02_RUN_COST_SNAPSHOT',
    'Coates_K2_Fleet_Details': '68_FLEET_DETAILS',
    'Coates_K2_Plant_Dashboard': '07_RUN_PLANT_DASHBOARD',
    'Coates_K2_Utilisation_Control': '71_UTILISATION_CONTROL',
    'Coates_K2_Invoice_Breakdown': '54_RUN_INVOICE_BREAKDOWN',
    'Coates_K2_Shift_And_Counter_Intel': '72_SHIFT_AND_COUNTER_INTEL',
    'Coates_K2_Business_Utilisation': '59_RUN_BUSINESS_UTILISATION',
    'Coates_K2_Money_And_Whats_Used': '67_MONEY_AND_WHATS_USED',
    'Coates_K2_Offline_Day': '61_RUN_OFFLINE_DAY',
    'Coates_K2_Hidden_Items': '63_HIDDEN_ITEMS',
    'Coates_K2_Shutdown_Clock': '64_SHUTDOWN_CLOCK',
    'Coates_K2_Flame_Off_Plant': '66_RUN_FLAME_OFF_PLANT',
    'Coates_K2_Serial_Numbers': '70_SERIAL_NUMBERS',
}

CSS = """
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0D1218;color:#DCE3EC;font-family:'Segoe UI',Arial,sans-serif;
 font-size:15px;line-height:1.45;-webkit-text-size-adjust:100%}
.wrap{max-width:900px;margin:0 auto;padding:0 14px 60px}
header{background:linear-gradient(160deg,#141C28,#0B1119);
 border-bottom:3px solid #F26222;margin:0 -14px 18px;padding:20px 18px 16px}
header h1{font-size:23px;font-weight:800;letter-spacing:-.4px}
header .s{color:#8794A6;font-size:12.5px;margin-top:5px;line-height:1.6}
header b{color:#F26222}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));
 gap:9px;margin-top:14px}
.tile{background:#131A22;border:1px solid #263143;border-radius:13px;
 padding:12px 13px}
.tile b{display:block;font-size:25px;font-weight:800;line-height:1.1}
.tile span{display:block;color:#8794A6;font-size:11px;margin-top:3px}
h2{font-size:12px;font-weight:800;letter-spacing:2px;color:#F26222;
 margin:26px 0 3px;text-transform:uppercase}
h2 + p{color:#8794A6;font-size:12.5px;margin-bottom:10px;line-height:1.5}
.r{display:flex;gap:12px;align-items:flex-start;background:#131A22;
 border:1px solid #263143;border-radius:14px;padding:13px 14px;margin-bottom:8px}
.r .t{flex:1;min-width:0}
.r .t b{display:block;font-size:15px;font-weight:800;color:#F0F4F9;
 line-height:1.3}
.r .t span{display:block;color:#8794A6;font-size:12.5px;margin-top:3px;
 line-height:1.5}
.r .t em{display:block;font-style:normal;color:#5F6B7C;font-size:11px;
 margin-top:5px;letter-spacing:.3px}
.go{display:flex;flex-direction:column;gap:6px;flex:none}
.go a{display:block;text-align:center;text-decoration:none;font-weight:800;
 font-size:11px;letter-spacing:1px;border-radius:10px;min-width:86px;
 padding:11px 12px}
.go .pg{background:#1C232D;border:1px solid #38424F;color:#DCE3EC}
.go .pd{background:#F26222;color:#fff}
/*  the chip sits BESIDE the name, not as a bar under it - the title is
    a block element, so an inline-block child was taking the whole row  */
.r .t b{display:flex;align-items:center;flex-wrap:wrap;gap:7px}
.chip{flex:none;font-size:9px;font-weight:800;letter-spacing:1.2px;
 border-radius:20px;padding:3px 9px}
.money{background:#3A1512;color:#FF6B5A}
.gone{border-color:#7A3A12;background:#1B1109}
.gone .t b{color:#FFD9CC}
.miss{color:#FF8C6B;font-size:12.5px;margin-top:4px;font-weight:700}
.foot{color:#4A5768;font-size:11.5px;text-align:center;padding:30px 0 10px;
 line-height:1.7}
@media print{
  body{background:#fff;color:#111}
  .go,header{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .r{break-inside:avoid;border-color:#ccc}
}
"""


def _find(folder, stem, date_tag, ext):
    p = os.path.join(folder, stem + '_' + date_tag + ext)
    if os.path.isfile(p):
        return p
    #  a few carry a month or a suffix instead of the plain date
    hits = sorted(glob.glob(os.path.join(folder, stem + '*' + ext)))
    return hits[0] if hits else None


def _size(p):
    n = os.path.getsize(p)
    return ('{:.1f} MB'.format(n / 1048576.0) if n >= 1048576
            else '{:,} KB'.format(max(1, n // 1024)))


def _when(p):
    return dt.datetime.fromtimestamp(os.path.getmtime(p)).strftime('%H:%M')


def build(date_tag=None):
    days = sorted(d for d in os.listdir(REPORTS)
                  if re.match(r'^\d{4}-\d{2}-\d{2}$', d)) \
        if os.path.isdir(REPORTS) else []
    if not days:
        print('  No Reports folder yet - run a report first.')
        return 1
    #  THE LATEST DAY THAT ACTUALLY HAS A DAY'S WORK IN IT.
    #  Taking days[-1] blindly opened on a folder holding three files -
    #  the two pages a single rebuild had touched after midnight - and
    #  reported the other fifty as "not built today", which is true and
    #  useless. A folder with a handful of files is a rebuild, not a
    #  morning. Pick the newest day carrying a real run, and say so if
    #  that is not today. (4 Aug 2026.)
    def _weight(d):
        n = 0
        for sub in ('Pages', 'PDF'):
            f = os.path.join(REPORTS, d, sub)
            if os.path.isdir(f):
                n += len(os.listdir(f))
        return n
    if not date_tag:
        rich = [d for d in days if _weight(d) >= 10]
        date_tag = rich[-1] if rich else days[-1]
    stale = date_tag != dt.date.today().isoformat()
    day = os.path.join(REPORTS, date_tag)
    pages, pdfs = os.path.join(day, 'Pages'), os.path.join(day, 'PDF')
    if not os.path.isdir(pages) and not os.path.isdir(pdfs):
        print('  Nothing built for ' + date_tag + ' yet.')
        return 1

    #  everything that has EVER built, so a gap today can be named
    ever = set()
    for d in days:
        for sub in ('Pages', 'PDF'):
            f = os.path.join(REPORTS, d, sub)
            if not os.path.isdir(f):
                continue
            for n in os.listdir(f):
                ever.add(re.sub(r'_\d{4}-\d{2}-\d{2}.*$', '',
                                os.path.splitext(n)[0]))

    H, seen = [], set()
    n_have = n_money = 0

    def row(stem, name, what, money, per_company=False):
        pg = _find(pages, stem, date_tag, '.html') if os.path.isdir(pages) else None
        pd = _find(pdfs, stem, date_tag, '.pdf') if os.path.isdir(pdfs) else None
        if not pg and not pd:
            return 0
        src = pd or pg
        seen.add(stem)
        links = ''
        if pg:
            links += ("<a class='pg' href='Pages/" + _esc(os.path.basename(pg))
                      + "'>OPEN</a>")
        if pd:
            links += ("<a class='pd' href='PDF/" + _esc(os.path.basename(pd))
                      + "'>PDF</a>")
        H.append(
            "<div class='r'><div class='t'><b>" + _esc(name)
            + ("<span class='chip money'>CARRIES MONEY</span>" if money else '')
            + "</b><span>" + what + "</span><em>built " + _when(src)
            + " &middot; " + _size(src)
            + (" &middot; " + str(per_company) + " companies" if per_company
               else '') + "</em></div>"
            "<div class='go'>" + links + "</div></div>")
        return 1

    for title, items, blurb in GROUPS:
        block = []
        mark = len(H)
        H.append('')            # placeholder for the heading
        for stem, name, what, money in items:
            if stem.endswith('_'):
                #  a per-company family - one row for the set
                fam = sorted(glob.glob(os.path.join(
                    pdfs, stem + '*_' + date_tag + '.pdf'))) \
                    if os.path.isdir(pdfs) else []
                if not fam:
                    continue
                seen.add(stem.rstrip('_'))
                for f in fam:
                    seen.add(re.sub(r'_\d{4}-\d{2}-\d{2}$', '',
                                    os.path.splitext(os.path.basename(f))[0]))
                H.append(
                    "<div class='r'><div class='t'><b>" + _esc(name)
                    + "</b><span>" + what + "</span><em>"
                    + str(len(fam)) + " built &middot; " + _when(fam[0])
                    + " &middot; in Reports\\" + date_tag + "\\PDF</em></div>"
                    "<div class='go'><a class='pd' href='PDF/'>OPEN THE "
                    "FOLDER</a></div></div>")
                n_have += len(fam)
                block.append(1)
                continue
            got = row(stem, name, what, money)
            n_have += got
            n_money += got and money
            block.append(got)
        if any(block):
            H[mark] = ('<h2>' + _esc(title) + '</h2><p>' + blurb + '</p>')
        else:
            H[mark] = ''

    #  ---- HIS OWN, DESIGNED ONES -----------------------------------
    #  Anything 76_DESIGN_A_REPORT made. They are named by him, so the
    #  hub just reads the name off the filename rather than pretending
    #  to know what each one is for.
    import glob as _g
    mine = sorted(_g.glob(os.path.join(pages,
                                       'Coates_K2_Designed_*_' + date_tag
                                       + '.html')))
    if mine:
        H.append("<h2>YOUR OWN &mdash; DESIGNED, NOT BUILT IN</h2>"
                 "<p>Ideas you designed with 76_DESIGN_A_REPORT and kept. "
                 "77_RUN_MY_REPORTS rebuilds them off this morning's "
                 "numbers.</p>")
        for f in mine:
            nm = re.sub(r'^Coates_K2_Designed_|_\d{4}-\d{2}-\d{2}$', '',
                        os.path.splitext(os.path.basename(f))[0])
            H.append(
                "<div class='r'><div class='t'><b>"
                + _esc(nm.replace('_', ' ')) + "</b>"
                "<span>Your own report. The recipe that made it is in "
                "REPORT_RECIPES.txt.</span><em>built " + _when(f)
                + " &middot; " + _size(f) + "</em></div>"
                "<div class='go'><a class='pg' href='Pages/"
                + _esc(os.path.basename(f)) + "'>OPEN</a></div></div>")
            n_have += 1

    #  ---- AND WHAT IS NOT THERE ------------------------------------
    #  A hub that shows what built and says nothing about what did not
    #  reads as "all of it". Anything that has built before and did not
    #  build today is named, with the button that makes it.
    known = {s for _t, items, _b in GROUPS for s, _n, _w, _m in items}
    missing = []
    for stem, name, what, money in [x for _t, i, _b in GROUPS for x in i]:
        if stem.endswith('_') or stem in seen:
            continue
        if stem in ever or any(e.startswith(stem) for e in ever):
            missing.append((stem, name, what))
    if missing:
        H.append("<h2 style='color:#FF6B5A'>NOT BUILT TODAY</h2>"
                 "<p>These have built before and did not build for "
                 + _esc(date_tag) + ". Nothing is broken - they just have "
                 "not been run - but the list above is not the whole "
                 "picture until these are back.</p>")
        for stem, name, what in missing:
            H.append(
                "<div class='r gone'><div class='t'><b>" + _esc(name)
                + "</b><span>" + what + "</span>"
                "<div class='miss'>Not in today&rsquo;s folder"
                + (" &mdash; run <b>" + _esc(MAKES[stem]) + "</b>"
                   if stem in MAKES else '') + "</div></div></div>")

    asof = ''
    ds = os.path.join(day, 'DATA_SOURCES.txt')
    if os.path.isfile(ds):
        try:
            with io.open(ds, encoding='utf-8', errors='ignore') as fh:
                m = re.search(r'(\d{1,2} \w{3} \d{4}[^\n]*)', fh.read())
                asof = m.group(1).strip() if m else ''
        except Exception:
            pass

    pretty = dt.datetime.strptime(date_tag, '%Y-%m-%d').strftime('%d %B %Y')
    page = (
        "<!doctype html><html lang='en-AU'><head><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1'>"
        "<title>Coates | Print Hub " + date_tag + "</title>"
        "<style>" + CSS + "</style></head><body><div class='wrap'>"
        "<header><h1>THE PRINT HUB</h1>"
        "<div class='s'>Every report built for <b>" + _esc(pretty)
        + "</b>, and what each one answers."
        + ("<br><b style='color:#F5A623'>This is not today.</b> The last "
           "full run was " + _esc(pretty) + " - pull fresh exports "
           "(28) and run the reports to move it on." if stale else '')
        + ("<br>Data as at " + _esc(asof) if asof else '')
        + "<br>Open reads it on screen. PDF is the one you print or send."
        "</div>"
        "<div class='tiles'>"
        "<div class='tile'><b>" + str(n_have) + "</b><span>reports on the "
        "shelf</span></div>"
        "<div class='tile'><b>" + str(len(missing)) + "</b><span>that have "
        "built before and did not today</span></div>"
        "<div class='tile'><b>" + str(len(days)) + "</b><span>days of "
        "reports kept</span></div>"
        "</div></header>"
        + ''.join(H) +
        "<div class='foot'>Cement Australia K2 Shutdown 2026 &middot; "
        "Gladstone<br>COATES INTERNAL &mdash; some of these carry revenue. "
        "This page is not on the store Wi-Fi and must not go to a "
        "contractor.<br>Author: Andrew Fisher &middot; POWERED BY SITEIQ"
        "</div></div></body></html>")

    out = os.path.join(day, 'Print_Hub_' + date_tag + '.html')
    with io.open(out, 'w', encoding='utf-8') as fh:
        fh.write(page)

    #  THE GUARD. This page lives in Reports\ and nowhere else - it
    #  names money reports and links straight to them.
    leak = os.path.join(HERE, 'Gear_Lookup', os.path.basename(out))
    if os.path.exists(leak):
        os.remove(leak)

    print('=' * 64)
    print(' COATES | THE PRINT HUB')
    print('=' * 64)
    print(' Day                  : {}{}'.format(
        date_tag, '   <-- NOT TODAY' if stale else ''))
    print(' Reports on the shelf : {}'.format(n_have))
    print(' Not built today      : {}'.format(len(missing)))
    for stem, name, _w in missing:
        print('     - {}{}'.format(
            name, '   (run ' + MAKES[stem] + ')' if stem in MAKES else ''))
    print('')
    print(' Written to : ' + out)
    print('')
    print(' COATES INTERNAL - it names the money reports and links to')
    print(' them. Reports\\ only, never Gear_Lookup.')
    return 0


if __name__ == '__main__':
    sys.exit(build(sys.argv[1] if len(sys.argv) > 1 else None))
