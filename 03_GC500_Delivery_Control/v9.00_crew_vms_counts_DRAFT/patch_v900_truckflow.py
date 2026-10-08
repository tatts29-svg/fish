#!/usr/bin/env python3
# Author: Andrew Fisher. v9.00 truck flow part - the Truck flow card on the Timeline's day folds to one line, closed.
#
# What happened (8 Oct 2026). The project manager, on site, about 16:10 AEST, with a screenshot of the Timeline's Truck flow
# card for Wed 14 Oct ("TRUCK FLOW · 4 people on · 4 loads": Order, People on, the area rows, Oversized, Curfew first with four
# "Load n: Kingston load time not known ... Make it Load 1" rows, Could share a truck, Rules): "also can we fix this up almost
# like your making this the hero and it now takes up all the room need to be gone or get rid of it".
#
# The change (layout rule, 2 Oct 2026: "arrange, fold or pack it, never redraw or restyle it"): the card is folded, not
# removed or redrawn. In its place the day shows ONE thin closed line,
#     Truck flow · 4 loads · 4 to check  >
# and a press opens the card exactly as v8.91 draws it - same markup, byte for byte, inside the fold: Order, People on, the
# areas, Oversized, Curfew first with its Make it Load 1 buttons, Could share a truck, Rules. Every button is the card's own
# and calls the same functions through the same delegated handlers.
#   "to check" counts the day's delivery loads that carry a check needing action, each load once, from the same day model the
#   card reads (flow891Day): an oversized load with no Kingston load time or on the road in a restriction (Curfew first, any
#   state but "ok"); a load in an area over its limit (the loads the card's own "Area full" chip marks); an oversized load at a
#   moment more oversized loads are on site than the guide; a load with no arrival window. A day with none reads "nothing to
#   check". The words of each check stay inside the card; the line's tooltip names how many of each.
#   Closed by default on every day and every page load. A fold opened stays open through the page's redraws (the record
#   syncs every few seconds; Make it Load 1 and the order controls redraw the day) in this page's memory only - the page's own
#   fold mechanism (PFOLD_OPEN / SFOLD_OPEN): nothing goes to the record or to browser storage. The load line's "Curfew
#   first" / "Area full" chips, which jump to the card, open its fold first. A print opens every Truck flow fold and closes
#   them after (as the v7.95 / v7.96 folds do), and the line itself never prints, so a printed day is as before. The Drivers
#   and Install PDFs do not read this card and are untouched.
#
# Anchor: the Truck flow card's own render function, flow891Card (v8.91), wrapped by name from a script added before the last
# </body>; the dayPanels override that calls it is not edited. CSS before the first </head>.
#
# Not touched: DATA, the record (read-only; opening, closing or viewing writes nothing), money, the footer, v9.11's Workers
# picker, readable dropdowns and the Arrange loads workspace with its order controls, the load cards, every other script.
#
#   toolchain/build.sh v909_truckflow v9.00_crew_vms_counts_DRAFT/patch_v900_truckflow.py
import json, re, sys
from pathlib import Path

p = Path(sys.argv[1]); raw = p.read_bytes(); bom = raw.startswith(b'\xef\xbb\xbf'); s = raw.decode('utf-8-sig')

# ---- the base: one DATA line that round-trips; v8.91's card and the day model it reads; v9.11 or later; not applied already
assert s.count('const DATA = ') == 1, 'expected one DATA declaration'
i = s.find('const DATA = '); j = s.find('\n', i); line = s[i:j]; assert line.endswith(';'), 'DATA must be one line ending ;'
body = line[len('const DATA = '):-1]
D = json.loads(body)
assert json.dumps(D, ensure_ascii=False, separators=(',', ':')) == body, 'DATA does not round-trip - stopping'
if 'flow909-script' in s or 'FLOW909_OPEN' in s:
    sys.exit('v9.00 truck flow part already applied')
for f in ('<script id="flow891-script">', 'function flow891Card(d){', 'function flow891Day(', 'function flow891Build(',
          "dayPanels = function(d){ let card = ''; try { card = flow891Card(d); } catch (e) { card = ''; } return dayPanelsBefore891(d) + card; };",
          '\'<section class="card nosfold flow891" data-flow891="\' + iso + \'"', "e.target.closest('[data-flow891-jump]')"):
    assert s.count(f) == 1, f'the base must carry {f[:60]!r} once'
assert s.count('flow891Card(') == 2, 'flow891Card must be defined once and called once (dayPanels) - look before shipping'
FOOT = re.findall(r" · v(\d+)\.(\d+)'; /\* v8\.19", s)   # the base's own release marker; read, never changed here
assert len(FOOT) == 1 and (int(FOOT[0][0]), int(FOOT[0][1])) >= (9, 11), f'the base must carry one release footer, v9.11 or later (found {FOOT})'

CSS = """<style id="flow909-style">
/* v9.00 - Author: Andrew Fisher. THE TRUCK FLOW CARD FOLDS TO ONE LINE. The project manager, 8 Oct 2026, about the day's Truck
   flow card: "it now takes up all the room need to be gone or get rid of it". The card is folded, not removed: one thin line in
   its place, the page's fold look (details.pfold: a ruled box, 10px 0 10px 0 corners, the paper ground, 13px type), the card's
   own orange edge so it reads as Truck flow, a chevron that turns when open. Open, the card below is exactly v8.91's. */
details.flow909{margin:12px 0 4px;max-width:100%;min-width:0}
details.flow909 > summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:8px;min-height:40px;box-sizing:border-box;padding:0 12px;
  border:1px solid var(--rule);border-left:4px solid var(--orange,#ff6a13);border-radius:10px 0 10px 0;background:var(--paper);color:var(--ink);
  font-size:13px;font-weight:600;line-height:1.2;max-width:100%;min-width:0;overflow:hidden}
details.flow909 > summary::-webkit-details-marker{display:none}
details.flow909 > summary:focus-visible{outline:2px solid var(--orange);outline-offset:2px}
details.flow909 > summary:hover{border-color:var(--orange,#ff6a13)}
details.flow909 .flow909-k{flex:none;font:700 10.5px/1 Inter,var(--sans,system-ui,sans-serif);letter-spacing:.16em;text-transform:uppercase;color:var(--orange-ink,#c2570c)}
details.flow909 .flow909-w{flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
details.flow909 .flow909-n{font-weight:800;color:var(--sem-stop-ink,#991b1b)}
details.flow909 .flow909-ok{font-weight:600;color:var(--mute)}
details.flow909 .flow909-h{flex:none;width:7px;height:7px;margin:0 4px 0 6px;border-right:2px solid var(--mute);border-bottom:2px solid var(--mute);transform:rotate(-45deg);transition:transform .15s}
details.flow909[open] > summary .flow909-h{transform:rotate(45deg);margin-top:-3px}
details.flow909[open] > summary{border-color:var(--rule);border-left-color:var(--orange,#ff6a13)}
details.flow909 > .flow891{margin-top:6px}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) details.flow909 .flow909-k{color:var(--orange,#ff6a13)}}
:root[data-theme="dark"] details.flow909 .flow909-k{color:var(--orange,#ff6a13)}
@media (max-width:640px){ details.flow909{margin:10px 0 2px} details.flow909 > summary{min-height:44px;padding:0 10px} }
@media (prefers-reduced-motion: reduce){ details.flow909 .flow909-h{transition:none} }
html[data-motion="off"] details.flow909 .flow909-h{transition:none}
@media print{ details.flow909 > summary{display:none} details.flow909{margin:0} details.flow909 > .flow891{margin-top:12px} }
</style>
"""

JS = r"""<script id="flow909-script">
/* v9.00 - Author: Andrew Fisher. THE TRUCK FLOW CARD FOLDS TO ONE LINE, CLOSED. The project manager, on site, 8 Oct 2026, about
   16:10 AEST, with the Wed 14 Oct card in front of him: "also can we fix this up almost like your making this the hero and it
   now takes up all the room need to be gone or get rid of it". So the day's Truck flow card (v8.91) is folded under one line,
   "Truck flow · 4 loads · 4 to check", closed on every day; a press opens the card exactly as it is drawn today - the same
   markup, every row and button, wired by the same handlers. Nothing is removed, nothing reworded.
   "To check" counts the delivery loads with a check that needs action, each load once, read from the card's own day model:
   Curfew first not on the earliest run (no Kingston load time, or on the road in a restriction); in an area over its limit
   (the loads the "Area full" chip marks); oversized at a moment over the guide; no arrival window. None: "nothing to check".
   An opened fold stays open through the page's redraws, in this page's memory only (as PFOLD_OPEN does); opening, closing
   or viewing writes nothing to the record and nothing to browser storage. */
const FLOW909_OPEN = new Set();
function flow909Checks(M){
 const by = new Map(), add = (n, why) => { if (!by.has(n)) by.set(n, new Set()); by.get(n).add(why); };
 (M.deliveries || []).forEach(x => {
  if (x.curfew && x.curfew.state !== 'ok') add(x.n, x.curfew.state === 'late' ? 'late' : 'time');
  if (!x.win || !x.win.known) add(x.n, 'window'); });
 (M.areas || []).forEach(a => (a.conflicts || []).forEach(c => (c.loads || []).forEach(n => add(n, 'area'))));
 const cap = FLOW891.oversized.total;
 if (M.oversized && M.oversized.peak > cap) { const ov = (M.deliveries || []).filter(x => x.oversize && x.win && x.win.known);
  ov.forEach(x => { const on = ov.filter(y => y.win.start <= x.win.start && x.win.start < y.win.finish); if (on.length > cap) on.forEach(y => add(y.n, 'oversized')); }); }
 const n = why => [...by.values()].filter(v => v.has(why)).length;
 const words = [['time', 'Kingston load time not known'], ['late', 'on the road in a restriction'], ['area', 'in an area over its limit'],
  ['oversized', 'oversized over the guide at one time'], ['window', 'no arrival window']].map(([k, w]) => n(k) ? w + ': ' + n(k) : '').filter(Boolean);
 return {count: by.size, words};
}
function flow909Line(d, M){
 const C = flow909Checks(M), loads = M.loads + ' load' + (M.loads === 1 ? '' : 's');
 const tip = C.count ? 'Loads to check — ' + C.words.join(' · ') + '. Press to open the Truck flow.' : 'Press to open the Truck flow.';
 return '<summary title="' + esc(tip) + '"><span class="flow909-k">Truck flow</span> <span class="flow909-w">· ' + esc(loads) + ' · ' +
  (C.count ? '<b class="flow909-n">' + C.count + ' to check</b>' : '<span class="flow909-ok">nothing to check</span>') +
  '</span><span class="flow909-h" aria-hidden="true"></span></summary>';
}
const flow891CardBefore909 = flow891Card;
flow891Card = function(d){
 const card = flow891CardBefore909(d); if (!card) return card;
 try { const M = flow891Day(d); if (!M || !M.loads) return card;
  return '<details class="flow909" data-flow909="' + esc(d.iso) + '"' + (FLOW909_OPEN.has(d.iso) ? ' open' : '') + '>' + flow909Line(d, M) + card + '</details>';
 } catch (e) { return card; }
};
/* open or closed is remembered for this page only, so a redraw keeps the card the way the person left it */
document.addEventListener('toggle', e => { const t = e.target; if (!t || !t.matches || !t.matches('details.flow909')) return;
 const iso = t.dataset.flow909; if (!iso || (FLOW909_PRINT.shut && FLOW909_PRINT.shut.includes(t))) return;
 if (t.open) FLOW909_OPEN.add(iso); else FLOW909_OPEN.delete(iso); }, true);
/* a load's "Curfew first" / "Area full" chip jumps to the card: its fold opens first (capture, before v8.91's own handler scrolls) */
document.addEventListener('click', e => { const j = e.target.closest && e.target.closest('[data-flow891-jump]'); if (!j) return;
 const iso = j.dataset.flow891Jump; if (!iso) return; FLOW909_OPEN.add(iso);
 document.querySelectorAll('details.flow909').forEach(x => { if (x.dataset.flow909 === iso) x.open = true; }); }, true);
/* a print shows the card as before: every closed Truck flow fold opens for the print and closes after (the line never prints) */
const FLOW909_PRINT = {shut: null};
window.addEventListener('beforeprint', () => { FLOW909_PRINT.shut = [...document.querySelectorAll('details.flow909:not([open])')]; FLOW909_PRINT.shut.forEach(x => { x.open = true; }); });
window.addEventListener('afterprint', () => { const shut = FLOW909_PRINT.shut || []; shut.forEach(x => { x.open = false; }); setTimeout(() => { FLOW909_PRINT.shut = null; }, 0); });
</script>
"""

h = s.find('</head>'); assert h > 0, 'no </head>'
s = s[:h] + CSS + s[h:]
k = s.rfind('</body>'); assert k > 0 and s[k:].strip() == '</body></html>', 'the page must end </body></html>'
s = s[:k] + JS + s[k:]

# ---- the proof: DATA is the base's, byte for byte, the footer is untouched, the card's own code is untouched, one style and one script added
i2 = s.find('const DATA = '); j2 = s.find('\n', i2)
assert s[i2:j2] == line and s.count('const DATA = ') == 1, 'DATA changed - stopping'
assert re.findall(r" · v(\d+)\.(\d+)'; /\* v8\.19", s) == FOOT, 'the footer changed - stopping'
assert s.count('<style id="flow909-style">') == 1 and s.count('<script id="flow909-script">') == 1 and s.count('const FLOW909_OPEN') == 1, 'one style, one script'
assert s.replace(CSS, '', 1).replace(JS, '', 1) == raw.decode('utf-8-sig'), 'only the style and the script were added - stopping'
assert not re.search(r'\$\s?\d', CSS + JS), 'no money in the added code'
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s)
print(f'v9.00 truck flow part on base v{FOOT[0][0]}.{FOOT[0][1]}: the Truck flow card folds to one closed line '
      f'(flow891Card wrapped by name; 1 style before </head>, 1 script before </body>); DATA, footer and every other script unchanged')
