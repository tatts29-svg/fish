#!/usr/bin/env python3
r"""v8.16 - the reference drawer, simple first, and a Demob tab. Author: Andrew Fisher.

Andrew, 3 Oct 2026 (the reference drawer): "clean up the look when we open up the reference ... remove thing we don't
need or hide it so it does not over crowd ... They go in to find simple data. If they want more data they can expand the
area they want to see more of use additional animations in here" - "General eyes don't wanna see costs".
Andrew, 3 Oct 2026 (demob): "Demob is 2 weeks from the Monday after the race. Priority is everything that is not inside
the island then inside the island next. So we should maybe have a demob tab ... where we get to pick a date of pick up ...
the branch can create run sheets on what to be picked up ... Needs to look good". Demob ends Fri 13 Nov; the island is
Macintosh Island. Event portables go 24 to a pick-up. No toilet or waste tank is moved or loaded until it is emptied;
the toilet comes off before the tank under it. Site hours 07:00-17:00.

What the patch does (DRAFT - not uploaded):
  1. the drawer: drawer816() arranges what openAssetDraw drew - summary header, Complete it, Where it is, a photo
     slot (data-photo-slot), folds - with the money in an editors-only fold; every setter and handler is the one that
     was there (drawer816_src.js);
  2. the off-site date chain and the Demob tab (demob816_src.js): typed > plan > contract before 13 Nov > proposed;
     proposed dates are worked out at runtime and never written unless a person confirms them;
  3. Emptied (pumped out): a fourth tick on the delivery record, and a gate in setLight that refuses taking a toilet
     or a tank off site, from Event Week, until it is emptied;
  4. the driver's card names the master-plan / pinned position instead of "nothing on the drawings";
  5. Codex's scope, kept to one hunk: a typed due-out on a reference with no remove event becomes a removal on its
     day in programmeDaysBefore801(), so it reaches the Timeline, the day lists and the day documents.

    python3 patch_v816.py <page.html>     (on live v8.13, f07e92cc; independent of v8.09 and v8.14)"""
import os, sys
here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(here, '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'v8.16 - reference drawer and Demob tab' in t: sys.exit('v8.16 already applied')
for need in ('function place799(', 'function dest782(', 'const ZONES782 = ', 'function openAssetDraw(', 'function programmeDaysBefore801(', 'function dpPrint('):
    if need not in t: sys.exit('v8.16 needs ' + need + ' (live from v8.07)')
js = open(os.path.join(here, 'demob816_src.js'), encoding='utf-8').read() + '\n' + open(os.path.join(here, 'drawer816_src.js'), encoding='utf-8').read()
css = open(os.path.join(here, 'v816.css'), encoding='utf-8').read()
if '</script' in js or '</style' in css: sys.exit('a source file would close its own tag')

# 1. the tab: Demob after Equipment, on the row at every width; its pane; its glyph (a truck going out)
t = rep(t, "['plant','Equipment'],", "['plant','Equipment'],['demob','Demob'],", 'Demob in TABS', p)
t = rep(t, "const TAB_PRIMARY = ['today', 'timeline', 'plant', 'map', 'docs', 'coatesway'];",
        "const TAB_PRIMARY = ['today', 'timeline', 'plant', 'demob', 'map', 'docs', 'coatesway']; /* v8.16 - Demob after Equipment */", 'Demob on the tab row', p)
t = rep(t, " more: '<circle cx=\"3.5\" cy=\"8\" r=\"1.4\" fill=\"currentColor\"/>",
        " demob: '<path d=\"M1.5 4.5h8v6.5h-8zM9.5 7h3l2 2.2V11h-5z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linejoin=\"round\"/><circle cx=\"4.2\" cy=\"12\" r=\"1.3\" fill=\"currentColor\"/><circle cx=\"11.8\" cy=\"12\" r=\"1.3\" fill=\"currentColor\"/><path d=\"M3.5 7.7h3.2M5.4 6.4l1.3 1.3-1.3 1.3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linecap=\"round\"/>', /* v8.16 */\n more: '<circle cx=\"3.5\" cy=\"8\" r=\"1.4\" fill=\"currentColor\"/>",
        'Demob glyph', p)
# on a phone the row is a glyph over a word in seven cells: Equipment may break, with a hyphen, over two lines
t = rep(t, "const TAB_WORDS = {progress: 'Where <span class=\"nb\">we are</span>'};",
        "const TAB_WORDS = {progress: 'Where <span class=\"nb\">we are</span>', plant: 'Equip<span class=hy816 aria-hidden=true></span>ment'}; /* v8.16 - two lines on a phone, one word everywhere else */", 'Equipment may hyphenate on a phone', p)
t = rep(t, '<section class="pane" id="pane-plant"></section>',
        '<section class="pane" id="pane-plant"></section>\n  <section class="pane" id="pane-demob"></section>', 'Demob pane', p)
t = rep(t, "else if (state.tab === 'questions') renderQuestions();",
        "else if (state.tab === 'questions') renderQuestions();\n else if (state.tab === 'demob') renderDemob816(); /* v8.16 */", 'Demob in renderPass', p)

# 2. the drawer: arranged after it is drawn and wired, before its fields are told what the link may do
t = rep(t, """ mounted($('#drawer'));
}
$('#scrim').onclick""", """ try { drawer816(a); } catch (e) { try { console.warn('v8.16 drawer', e); } catch (x) {} } /* v8.16 - simple first */
 mounted($('#drawer'));
}
$('#scrim').onclick""", 'drawer arranged', p)

# 3. the driver's card: the one destination, when the plan or a pin has it
t = rep(t, " : pt ? {tone: 'plan', kick: 'Drawing position · confirm exact spot',",
        " : driverPos816(a) ? driverPos816(a) /* v8.16 - the master plan or a pin, not \"nothing on the drawings\" */\n : pt ? {tone: 'plan', kick: 'Drawing position · confirm exact spot',", 'driver card position', p)

# 4. Emptied (pumped out): the gate on the light, and a record holding only that tick is not empty
t = rep(t, """function setLight(key, state){
 if (!mayWrite('the delivery light')) return false;
 if (!LIGHT[state]) return false;""", """function setLight(key, state){
 if (!mayWrite('the delivery light')) return false;
 if (!LIGHT[state]) return false;
 if (typeof emptyGate816 === 'function' && !emptyGate816(key, state)) return false; /* v8.16 - not moved until it is emptied */""", 'emptied gate', p)
t = rep(t, "&& typeof d.levelled !== 'boolean' && typeof d.steps !== 'boolean' && !d.date_off_at && !d.out_off_at; }",
        "&& typeof d.levelled !== 'boolean' && typeof d.steps !== 'boolean' && typeof d.emptied !== 'boolean' && !d.date_off_at && !d.out_off_at; } /* v8.16 */",
        'emptied keeps a record', p)

# 5. CODEX SCOPE (Timeline): a typed due-out on a reference the plan never takes off site is a removal on its day
t = rep(t, """ else list.push({a, events:[e], moved_from: moved});
 });
 });
 (((DATA.transport || {}).carrier || {}).loads || []).forEach(l => day(l.date).loads.push(l));""",
        """ else list.push({a, events:[e], moved_from: moved});
 });
 /* v8.16 - a due-out typed on a reference with no remove event reaches its day as a removal (Andrew, 3 Oct 2026) */
 { const typed816 = deliveryOf(a.key).out_date; if (typed816 && !evs.some(e => e.movement === 'remove')) { const rl = day(typed816).removals; if (!rl.some(r => r.a.key === a.key)) rl.push({a, events: [{date: typed816, sheet: 'due-out typed on the page', activity: null, movement: 'remove', movement_stated: true, quantity_display: null, carrier: null, dd: null, note: null, typed816: true}], moved_from: null}); } }
 });
 (((DATA.transport || {}).carrier || {}).loads || []).forEach(l => day(l.date).loads.push(l));""", 'typed due-out reaches the day', p)

# 4a. a toilet or tank set on site again starts a new use: an earlier pump-out no longer clears it
t = rep(t, """ d.state = state; d.set_at = now; d.by = who;
 d.history = (d.history || []).concat([{state, at: now, by: who}]).slice(-400);""", """ d.state = state; d.set_at = now; d.by = who;
 d.history = (d.history || []).concat([{state, at: now, by: who}]).slice(-400);
 if (state === 'on site' && typeof revokeEmptied816 === 'function') revokeEmptied816(key, d, who, now); /* v8.16 - a new use needs a new pump-out */""", 'arrival revokes an earlier pump-out', p)
# 4b. a merge of two copies keeps Emptied: the later stamp wins, like steps, and its history is kept
t = rep(t, " if (pw) Object.assign(m, pw);",
        " if (pw) Object.assign(m, pw);\n /* v8.16 - emptied (pumped out) merges on its own clock: value, who and when together; an un-tick is a dated event too */\n const ea816 = typeof a.emptied === 'boolean' ? {emptied: a.emptied, emptied_by: a.emptied_by, emptied_at: a.emptied_at} : null, eb816 = typeof b.emptied === 'boolean' ? {emptied: b.emptied, emptied_by: b.emptied_by, emptied_at: b.emptied_at} : null;\n const ew816 = !ea816 ? eb816 : !eb816 ? ea816 : (String(eb816.emptied_at || '') > String(ea816.emptied_at || '') ? eb816 : ea816); if (ew816) Object.assign(m, ew816);",
        'emptied merges', p)
t = rep(t, " if (PH.length) m.steps_history = PH;",
        " if (PH.length) m.steps_history = PH;\n const EH816 = hist(a.emptied_history, b.emptied_history, h => h.emptied + '|' + h.at); if (EH816.length) m.emptied_history = EH816; /* v8.16 */",
        'emptied history merges', p)

# 6. the code and the look
t = rep(t, 'function renderPass(){', js + '\nfunction renderPass(){', 'v8.16 code', p)
i = t.index('</style>')  # the page's own stylesheet
t = t[:i] + css + t[i:]

open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v8.16 applied: reference drawer and Demob tab')
