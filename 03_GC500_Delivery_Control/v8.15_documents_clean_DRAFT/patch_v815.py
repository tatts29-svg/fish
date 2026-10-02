#!/usr/bin/env python3
r"""v8.15 - Documents, cleaned up. Author: Andrew Fisher. DRAFT - a working prototype for Andrew to look at; not uploaded.

Andrew, 3 Oct 2026, on the first freehand mock-up: "your mock ups look different to the style we using in all other pages .
looks like a kids made it". This one is the real page with the Documents tab redrawn out of the page's own pieces only:
Today's cards (.card.hubcard, .hubtitle, .hubbig, .hublist, .hubgo), the reference plate, the traffic-light pip, .btn.sm,
details.sfold and the find box Change deliveries already uses. No new colour, font, radius, shadow or icon.

What the patch does:
  1. renderDocs() draws the tab with renderDocs815() (docs815_src.js): a find box over everything on the tab; six cards
     (Safety · SWMS, Transport, Drawings, Packs, Photos, Fencing dockets - Invoices only when there are some), each with
     its count and a light; the picked card's files as slim rows (plate, title, one line, light, Open); the last five
     uploads; Print the list and Refresh at the foot; on the edit link "+ Add" with the upload form behind it.
     The print set (27 plates) and the dated pre-starts (17) are folded; photos are grouped by reference.
     If the new drawing ever throws, the previous one (renderDocs_held, left untouched) draws the tab instead.
  2. docCollection() counts the same paper once: the five Advanced Fencing pre-starts that were in the catalogue under
     one name ("not hosted") and uploaded under another ("available") are shown once, available. The four files that
     really are not uploaded keep their red light; the sentence saying so shows on the edit link only.
  3. Deep links: #docs/swms|transport|maps|packs|photos|invoices still land on their card; #docs/dockets lands on
     Fencing dockets; the Fencing tab's "Open the plan" (state.docsec 'fencing', and #docs/fencing) lands on the
     fencing plans under Drawings, as it was meant to.
  4. The header search lists up to 8 documents instead of 4, so "SWMS" finds all of them; a catalogue entry that is
     now its uploaded copy opens that one file; one with no file lands on Documents, found by its title.
  5. Paper: the whole list is always on the page for printing (printList815), so Print the list, Ctrl+P and the
     browser menu all print it - every category, folds as headings, photographs one line per reference.

    python3 patch_v815.py <page.html>     (on live v8.13, f07e92cc; independent of v8.14 and v8.16)"""
import os, sys
here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(here, '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'v8.15 - Documents, cleaned up' in t or 'function renderDocs815(' in t: sys.exit('v8.15 already applied')
for need in ('function place799(', 'function renderDocs_held(', 'function docCollection(', 'function finderMatches('):
    if need not in t: sys.exit('v8.15 needs ' + need + ' (live from v8.07)')
js = open(os.path.join(here, 'docs815_src.js'), encoding='utf-8').read()
css = open(os.path.join(here, 'v815.css'), encoding='utf-8').read()
if '</script' in js or '</style' in css: sys.exit('a source file would close its own tag')

# 1. the tab is drawn by renderDocs815; the old drawing stays as it was and takes over if the new one throws
t = rep(t, 'function renderDocs(keep){ return holdAssets(() => renderDocs_held(keep)); } /* v6.69 */',
        '/* v8.15 - Documents, cleaned up (Andrew, 3 Oct 2026) */\n' + js + '\n'
        "function renderDocs(keep){ return holdAssets(() => { try { return renderDocs815(keep); } catch (e) { try { console.warn('v8.15 documents', e); } catch (x) {} state.docsec = state.docsec || null; return renderDocs_held(keep); } }); } /* v6.69 */ /* v8.15 */",
        'renderDocs', p)

# 2. the same paper counted once, for every reader of the collection
t = rep(t, ''' const byCategory = {};
 DOC_CATS.forEach(c => { byCategory[c] = 0; });''', ''' twins815(items); /* v8.15 - a catalogue entry with no file and its uploaded copy are one document */
 const byCategory = {};
 DOC_CATS.forEach(c => { byCategory[c] = 0; });''', 'twins in docCollection', p)

# 3. deep links: the old section names, plus Fencing dockets
t = rep(t, "else if ((m = h.match(/^docs\\/(swms|transport|maps|packs|photos|invoices)$/))) { state.docsec = m[1]; go('docs'); }",
        "else if ((m = h.match(/^docs\\/(swms|transport|maps|packs|photos|invoices|dockets|fencing)$/))) { state.docsec = m[1]; go('docs'); } /* v8.15 - dockets and fencing land on Fencing dockets */",
        'docs deep links', p)

# 4. the header search: up to 8 documents (it stopped at 4, so "SWMS" showed 4 of 6); the merged copy is the one it opens
t = rep(t, ''' ((DATA.docs || {}).docs || []).forEach(dc => {
 const title = dc.title || dc.name || dc.id;
 out.push({kind: 'doc', id: dc.id, title,''', ''' const tw815 = typeof twinIds815 === 'function' ? twinIds815() : {}; /* v8.15 - a catalogue entry that is now its uploaded copy */
 ((DATA.docs || {}).docs || []).forEach(dc => {
 const title = dc.title || dc.name || dc.id;
 out.push({kind: 'doc', id: tw815[dc.id] || dc.id, title,''', 'finder doc ids', p)
t = rep(t, ''' (dc.days || []).forEach(dy => out.push({kind: 'docday', id: dc.id, title, page: dy.page, date: dy.date,''',
        ''' (dc.days || []).forEach(dy => out.push({kind: 'docday', id: tw815[dc.id] || dc.id, title, page: dy.page, date: dy.date,''', 'finder docday ids', p)
t = rep(t, ''' if (href) { window.open(it.kind === 'docday' ? href + '#page=' + it.page : href, '_blank', 'noopener'); return; }
 go('docs'); return;''', ''' if (href) { window.open(it.kind === 'docday' ? href + '#page=' + it.page : href, '_blank', 'noopener'); return; }
 state.docQ815 = it.title || ''; state.docTile815 = null; /* v8.15 - lands on that one document, found by its title */
 go('docs'); return;''', 'finder pick lands on the item', p)
t = rep(t, ' const cap = {asset: 8, unit: 4, place: 6, sheet: 3, doc: 4, docday: 4},',
        ' const cap = {asset: 8, unit: 4, place: 6, sheet: 3, doc: 8, docday: 4}, /* v8.15 - doc was 4 */', 'finder doc cap', p)

i = t.index('</style>')  # the page's own stylesheet
t = t[:i] + css + t[i:]

open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v8.15 applied: Documents cleaned up')
