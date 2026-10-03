#!/usr/bin/env python3
r"""v8.14 - Today, trimmed. Author: Andrew Fisher.

Andrew, 3 Oct 2026, with screenshots of seven Today cards: "I want you to work with me on each page and areas and we
will remove things we don't need ok. starting with today we don't these in here. Unless u think overwise".

Off Today (each still has its own home, so nothing is lost):
  - Map (ten sheet buttons)              -> the Map tab, one tap away in the tabs.
  - Documents (counts by kind)           -> the Documents tab.
  - Also on the schedule - no reference  -> the same rows are on the day view, and the referenced ones are in the
                                            programme list already.
  - Roads between Coates Kingston and the circuit (a TomTom snapshot from the build, days old) -> the truck's own
                                            satnav is live; the card itself said so.
  - Fencing (dockets and dollars)        -> the Fencing tab. (Andrew asked for it on Today on 2 Oct; this reverses that
                                            on his word of 3 Oct.)
  - Your records (export and import)     -> Tools > Export and Import, which were always there. The one thing the card
                                            had that the menu did not - "5 changes since export" - goes onto the menu's
                                            Export button, so the reminder is not lost.
Kept, with one change (Claude's call, put to Andrew):
  - Next programme day: on a day with deliveries due it is the "Due today" card, the one the crew works from, so it
    stays on those days. On a day with nothing due it showed the next day's list; that goes, and the "Deliveries due by
    today met" card already says how many are due in the next days.

Screen and paper alike: these cards are not drawn at all. No figure changes anywhere.

    python3 patch_v814.py <page.html>     (on live v8.13, f07e92cc)"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'v8.14 - Today, trimmed' in t: sys.exit('v8.14 already applied')
if 'function place799(' not in t: sys.exit('v8.14 needs v7.99 (live from v8.07)')


# The cut text sits inside the Today template literal, so what replaces it must be valid template text: an empty
# ${''} with the note in a JS comment inside it.
def cut_in_template(text, start, end, what):
    if text.count(start) != 1: sys.exit(f'{what}: start marker found {text.count(start)} times')
    i = text.index(start); j = text.find(end, i)
    if j < 0: sys.exit(f'{what}: end marker not after start')
    return text[:i] + "${'' /* v8.14: " + what + " is off Today (Andrew, 3 Oct 2026) */}" + text[j + len(end):]


# 1. Roads: the call on Today (the function stays; nothing else draws it)
t = rep(t, ' ${roadsCard()}\n', " ${'' /* v8.14: the roads snapshot is off Today (Andrew, 3 Oct 2026) */}\n", 'roads card', p)

# 2. Next programme day: drawn only when deliveries are due today ("Due today")
t = rep(t, ''' <div class="card hubcard" data-go="timeline" data-day="${esc(show ? show.iso : '')}">
 <div class="hubtitle"><h3>${dayNow ? 'Due today' : next ? 'Next programme day' : 'Programme'}</h3>''',
        ''' ${dayNow ? `<div class="card hubcard" data-go="timeline" data-day="${esc(show ? show.iso : '')}">
 <div class="hubtitle"><h3>Due today</h3>''', 'programme card head', p)
t = rep(t, ''' : '<p class="norate">No programme day on or after today in the register.</p>'}
 <div class="hubgo">Open the day view →</div>
 </div>''', ''' : '<p class="norate">No programme day on or after today in the register.</p>'}
 <div class="hubgo">Open the day view →</div>
 </div>` : '' /* v8.14: on a day with nothing due, the next day's list is off Today (Andrew, 3 Oct 2026) */}''',
        'programme card tail', p)

# 3. Also on the schedule - no reference
t = cut_in_template(t, ' ${show && show.unref.length ? `<div class="card hubcard unrefcard"',
                    "<div class=\"hubgo\">Open the day view →</div>\n </div>` : ''}", 'Also on the schedule - no reference')

# 4. Fencing
t = cut_in_template(t, ' <div class="card hubcard${over.length ? \' alert\' : \'\'}" data-go="fencing">',
                    '<div class="hubgo">Open fencing →</div>\n </div>', 'the Fencing card')

# 5. Your records
t = cut_in_template(t, ' <div class="card hubcard editonly${att.export ? \' alert\' : \'\'}">',
                    "${S.lastImport ? `<p class=\"norate\" style=\"margin-top:8px\">Last import ${esc(fmtStamp(S.lastImport.at))}${S.lastImport.from ? ' from ' + esc(S.lastImport.from) : ''}: ${esc(S.lastImport.summary || '')}</p>` : ''}\n </div>",
                    'Your records')

# 6. Map
t = cut_in_template(t, ' <div class="card hubcard" data-go="map">\n <div class="hubtitle"><h3>Map</h3>',
                    '<div class="hubgo">Open the map →</div>\n </div>', 'the Map card')

# 7. Documents
t = cut_in_template(t, ' <div class="card hubcard" data-go="docs">',
                    '<div class="hubgo">Open the documents →</div>\n </div>', 'the Documents card')

# 8. The reminder the Your records card carried moves onto Tools > Export: "Export · 5 new" while there are changes
#    this device has not exported. Read from the same count the card used (att.export), refreshed on every render.
t = rep(t, '''function renderTabs(){
 const att = attention();''', '''function renderTabs(){
 const att = attention(); exportBadge814(att.export);''', 'export badge call', p)
t = rep(t, '''/* ================================================================== v6.78 - THE RUNNING SHEET''',
        '''/* v8.14 - Today, trimmed (Andrew, 3 Oct 2026). The Your records card is off Today; its one warning - changes on this
 device not yet exported - is carried by the Export button in Tools, which is where Export always was. */
function exportBadge814(n){ try {
 const b = document.getElementById('exportBtn'); if (!b) return; n = n || 0;
 b.textContent = n ? `Export · ${n} new` : 'Export';
 b.title = n ? `${n} change${n === 1 ? '' : 's'} on this device since the last export - Export keeps a separate file copy` : 'Export keeps a separate file copy of the records on this device';
 b.classList.toggle('due814', !!n);
} catch (e) { /* the badge is a reminder only; Export itself is untouched */ } }
/* ================================================================== v6.78 - THE RUNNING SHEET''', 'export badge fn', p)
i = t.index('</style>')  # the first stylesheet: the page's own
t = t[:i] + ('#exportBtn.due814{border-color:var(--red);color:var(--red);font-weight:700}\n'
             # With six cards off, Today's work holds Delivery updates and Who to call (and Due today on a delivery day).
             # Delivery updates takes two columns on a wide screen so the row fills: 2 + 2, or 1 + 2 + 1 on a delivery day.
             # Screen only (paper keeps its own layout); a phone is one column and is not touched.
             '@media screen and (min-width:900px){#pane-today .mas95 > .advicecard{grid-column:span 2}}\n') + t[i:]

open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v8.14 applied: Today trimmed')
