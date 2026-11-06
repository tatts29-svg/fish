#!/usr/bin/env python3
"""v6.74b - THE EXECUTIVE AUDIT, PART 2: CONSISTENCY (P1 items).
  REL-01  while the page is still fetching the shared record the strip reads LOADING and the figures are dimmed, so
          the copy saved in this browser never reads as the live answer
  DOC-01  Today's document count is the same collection the Documents tab reads, fetched once on its own - it no
          longer depends on whether the Documents tab was opened first
  DATA-11 the transport card's empty state says what it covers (our own transport invoices and lines), not "no cost"
  DATA-15 the day's update list says its times are the times the record was made; a bare midnight is "time n/r"
  DATA-16 "0 of 83 recorded" is the specification check it is: item lines verified against what was supplied
  DATA-17 the forklift contract pool is shown once, not repeated on every forklift row
  UI-06   "nothing removes it" -> "return date not recorded"; "no programme week" -> the phase and day
  UI-08   the showcase no longer points to the crew "on the next scene" (they are the scene before); fence metres are
          "on dockets", not "installed"
  UI-09   the map's status chips are "Delivery status on this plan"

  python3 patch_v674b.py <page.html> [builder.py]
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402

CSS = """
/* v6.74b - REL-01: until the shared record has answered, the figures are the copy saved in this browser - dimmed */
body.recloading main .pane.on .kpi .v, body.recloading main .pane.on .cblock, body.recloading main .pane.on .mtot{opacity:.45;transition:opacity .25s}
</style>"""


def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    R = lambda old, new, what: rep(t, old, new, what, path, need)

    # DOC-01 - the Today documents card as a function, redrawn when the file index arrives
    a = t.find(""" <div class="card hubcard" data-go="docs">
 ${(() => { /* F04: the teaser reads the SAME collection""")
    if a < 0: a = t.find("""<div class="card hubcard" data-go="docs">
 ${(() => { /* F04:""")
    b = t.find("<div class=\"hubgo\">Open the documents →</div>", a)
    if a >= 0 and 0 < b - a < 6000:
        seg = t[a:b]
        i0 = seg.find('${(() => {'); i1 = seg.rfind('})()}')
        body = seg[i0 + len('${(() => {'):i1]
        t = t[:a] + """ <div class="card hubcard" data-go="docs" id="hubDocs">
 ${docsHubInner()}
 """ + t[b:]
        fn = """/* v6.74b (DOC-01) - the Today documents teaser. Same collection as the Documents tab; the hosted service's file index is
 fetched once, on its own, so the count does not depend on which tab was opened first. */
function docsHubInner(){
 if (SYNC.backend && SYNC.backend.files && (DOCS.state === 'unrequested' || DOCS.state == null) && !DOCS._hubAsked) { DOCS._hubAsked = true; setTimeout(() => { try { docsRefresh(false); } catch (e) {} }, 1200); }
""" + body + """}
function docsHubRedraw(){ const el = document.getElementById('hubDocs'); if (el) el.innerHTML = docsHubInner() + '<div class="hubgo">Open the documents →</div>'; }
function renderToday(){"""
        t = R("function renderToday(){", fn, 'docsHubInner')
        t = R("""finally { DOCS.busy = false; docsRedraw(); photoRedraw(); }""", """finally { DOCS.busy = false; docsRedraw(); photoRedraw(); try { docsHubRedraw(); } catch (e) {} }""", 'docs redraw')
    elif need: sys.exit('docs hub not found')

    # REL-01
    t = R("""return {k: 'checking', word: 'Checking…', sub: 'saved here meanwhile',""",
          """return {k: 'checking', word: 'Loading…', sub: 'current record on its way',""", 'checking words')
    t = R("""const big = {view: 'LIVE', shared: 'LIVE', pending: 'PENDING', checking: 'CHECKING', offline: 'OFFLINE', local: 'LOCAL'}[r.k] || r.word.toUpperCase();""",
          """const big = {view: 'LIVE', shared: 'LIVE', pending: 'PENDING', checking: 'LOADING', offline: 'OFFLINE', local: 'LOCAL'}[r.k] || r.word.toUpperCase();
 document.body.classList.toggle('recloading', r.k === 'checking');""", 'recstrip big')

    # DATA-11
    t = R("""const X = ourKindCard('transport', {empty: 'No transport cost of ours recorded yet.'});""",
          """const X = ourKindCard('transport', {empty: 'No transport invoice or manual transport line of ours recorded yet. The schedule’s own transport figures (its TPORT COST column) are counted in the totals above as scheduled estimates, not invoices.'});""", 'transport empty')

    # DATA-15
    t = R("""return `<li><span class="tm">${esc(timeOfStamp(r.at))}</span>${esc(r.a.key)}""",
          """return `<li><span class="tm" title="when the record was made on this page — not necessarily when it arrived">${esc(timeOfStamp(r.at) === '00:00' ? 'time n/r' : timeOfStamp(r.at))}</span>${esc(r.a.key)}""", 'update times')

    # DATA-16
    t = R("""aria-label="${esc(done)} of ${esc(items.length)} asked-for item lines recorded as supplied">""",
          """aria-label="Specification check: ${esc(done)} of ${esc(items.length)} asked-for item lines verified against what was supplied">""", 'spec aria')
    t = R("""<span>${esc(done)} of ${esc(items.length)} asked-for item line${items.length === 1 ? '' : 's'} recorded${pct ? ' · ' + pct + '%' : ''}</span>""",
          """<span title="whether what was supplied matches what was asked for, line by line — not whether it has arrived">Specification check: ${esc(done)} of ${esc(items.length)} item line${items.length === 1 ? '' : 's'} verified${pct ? ' · ' + pct + '%' : ''}</span>""", 'spec text')

    # DATA-17 - the forklift pool once
    t = R("""const contractCell = name => { const rowsC = contractRowsFor(name);
 if (!rowsC.length) return '<span class="norate">—</span>';""",
          """const poolSeen = new Set();
 const contractCell = name => { const rowsC = contractRowsFor(name);
 if (!rowsC.length) return '<span class="norate">—</span>';
 /* v6.74b (DATA-17) - every forklift row reads the same pool of forklift contract lines; it is shown on the first
 forklift row, and the rest point to it rather than repeat its total */
 if (/forklift/i.test(String(name || ''))) { if (poolSeen.has('forklift')) return `<span class="w" title="the forklift contract lines are one pool shared by every forklift row — shown once, on the first">in the forklift pool above · ${rowsC.length} lines, counted once</span>`; poolSeen.add('forklift'); }""", 'pool')

    # UI-06
    t = R("""return '<span class="chip crit">nothing removes it</span>';""", """return '<span class="chip crit" title="no schedule row, demob row or rental off-hire date takes it off site yet">return date not recorded</span>';""", 'nothing removes it')
    t = R("""const week = d.sheet ? d.sheet.replace('Demob Week', 'Demob').toUpperCase() : 'NO PROGRAMME WEEK';""",
          """const week = d.sheet ? d.sheet.replace('Demob Week', 'Demob').toUpperCase() : (((programmeDay(d.iso) || {}).short || 'no programme sheet') + '').toUpperCase();""", 'no programme week')

    # UI-08 - showcase words
    t = R("""<div class="shrow"><span>Clean, installed</span>""", """<div class="shrow"><span>Clean, on dockets</span>""", 'show clean')
    t = R("""<div class="shrow"><span>Braced for scrim, installed</span>""", """<div class="shrow"><span>Braced for scrim, on dockets</span>""", 'show scrim')
    t = R("""${fine('Installed is what the crew’s dockets say by this day;""", """${fine('The metres are what the crew’s dockets say by this day — work done, not fence standing;""", 'show fine')
    t = R("""+ (fencingCrew().length ? ' Put in by ' + fencingCompany() + ' — meet the crew on the next scene.' : ''))}`;""",
          """+ (fencingCrew().length ? ' Put in by ' + fencingCompany() + '.' : ''))}`;""", 'show crew')

    # UI-09
    t = R("""${onSheet.length ? lightBar(onSheet, 'Lights on this sheet') : ''}""", """${onSheet.length ? lightBar(onSheet, 'Delivery status on this plan') : ''}""", 'map chips')

    i = t.find('</style>')
    if i >= 0: t = t[:i] + CSS + t[i + len('</style>'):]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], True)
    if len(sys.argv) > 2: patch(sys.argv[2], False)
