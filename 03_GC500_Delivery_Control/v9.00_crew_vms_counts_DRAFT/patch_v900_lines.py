#!/usr/bin/env python3
# Author: Andrew Fisher. v9.09 part E - WC09: a line for each 6 m toilet block (each its own Install, Steps and Levelling).
#
# What happened (8 Oct 2026). The project manager, on site, 14:40 AEST: "WC09 We need to have a line for each as each will have
# a install and level and stairs each one of those assets that go there." WC09 orders 4 FWF, 6 Pee Panel and 2 Toilet Block 6m.
# At 13:52 AEST he recorded two asset numbers on WC09, 1268858 and 1311146 - the two 6 m toilet blocks (Coates buildings; the
# drop photos for unit 1268858 are on the record). The page already gives each building its own ticks where a reference carries
# more than one building number (v5.55; WC15, WC16, WC17, WC20). But the v7.32 split (lineNumbersOf) deals numbers nobody has
# placed "biggest order first", so both went to Pee Panel (6) and the toilet blocks kept one set of ticks for the reference.
# WC09's FWF and pee panels are Event Portables Load 1 (Fri 9 Oct): v8.86's plan correction moved exactly those two schedule
# rows (T0101 FWF, T0259 Pee Panel) onto the supplier's load and left the toilet blocks (T0102) on Thu 8 Oct. Event Portables
# units carry no Coates number.
#
# The rule (one change, in lineNumbersOf's automatic deal only):
#   a line whose schedule row the page carries on an Event Portables load (v8.86: date_correction.plan886 on a row of that
#   item) takes no Coates number in the automatic deal. Everything else stands: a person's choice ("counts as" on the Change
#   form) is placed first and always wins; v7.68's noted waste tanks next; the rest by room, biggest order first, an ancillary
#   line losing a tie. Where every line of a reference is on an Event Portables load, nothing is excluded (no number is ever
#   left without a line). The page cannot tell a supplier any other way per line, so nothing else is excluded.
#   "Ancillary lines dealt last" was surveyed and not taken: on its own it hands WC09's two numbers to FWF (also wrong), and
#   with the rule above it changes nothing on the record. The smallest rule that is right is this one.
#
# Survey (live v9.10, record 4504, read-only): eight references carry more than one charge-line item (WC01, WC05, WC09, WC20,
# WC27, WC31, WC51, WC60). Under this rule only WC09's split changes. The patch refuses to run if DATA carries another
# multi-item reference with an Event Portables row on some lines and not others - look at it before shipping.
#
# Not touched: DATA, the record (read-only), money code, labour keys, the Change form, the footer, every other script
# (StaffNames910 included).
#
#   toolchain/build.sh v909_lines v9.00_crew_vms_counts_DRAFT/patch_v900_lines.py
import json, os, re, sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep

p = Path(sys.argv[1]); raw = p.read_bytes(); bom = raw.startswith(b'\xef\xbb\xbf'); s = raw.decode('utf-8-sig')

# ---- the base: one DATA line that round-trips; v7.32's split and v8.86's plan rows present; not applied already
assert s.count('const DATA = ') == 1, 'expected one DATA declaration'
i = s.find('const DATA = '); j = s.find('\n', i); line = s[i:j]; assert line.endswith(';'), 'DATA must be one line ending ;'
body = line[len('const DATA = '):-1]
D = json.loads(body)
assert json.dumps(D, ensure_ascii=False, separators=(',', ':')) == body, 'DATA does not round-trip - stopping'
if 'function epLine909(' in s:
    sys.exit('v9.09 lines part already applied')
for f in ('function lineNumbersOf(', 'function labourUnits(', 'function ep886Corrected(', 'function lineItemMatch(',
          'const LAB_ANCILLARY = '):
    assert s.count(f) == 1, f'the base must carry {f} once'
FOOT = re.findall(r" · v(\d+)\.(\d+)'; /\* v8\.19", s)   # the base's own release marker; read, never changed here
assert len(FOOT) == 1 and (int(FOOT[0][0]), int(FOOT[0][1])) >= (9, 8), f'the base must carry one release footer, v9.08 or later (found {FOOT})'


# ---- the plan as DATA carries it: which multi-item references have Event Portables rows on some lines and not others
def lm(item, label):
    n = lambda x: re.sub(r'\s+', ' ', str(x or '').strip().lower())
    i_, l_ = n(item), n(label)
    return bool(i_) and bool(l_) and (i_ == l_ or i_.startswith(l_ + ' ') or l_.startswith(i_ + ' '))


def ep_line(a, item):
    return any(e and e.get('movement') != 'remove' and (e.get('date_correction') or {}).get('plan886')
               and (e.get('item') == item or lm(item, e.get('item'))) for e in a.get('events') or [])


MIXED = {}
for a in D['assets']:
    L = [l['item'] for l in a.get('charge_lines') or [] if l.get('item')]
    if len(L) > 1 and any(ep_line(a, x) for x in L) and not all(ep_line(a, x) for x in L):
        MIXED[a['key']] = [(x, ep_line(a, x)) for x in L]
for k, v in sorted(MIXED.items()):
    print('  Event Portables lines beside others:', k, v)
assert sorted(MIXED) == ['WC09'], f'DATA mixes Event Portables and other lines on {sorted(MIXED)}; expected WC09 only - look before shipping'
WC09 = next(a for a in D['assets'] if a['key'] == 'WC09')
assert sorted((l['item'], l['quantity']) for l in WC09['charge_lines']) == [('FWF', 4), ('Pee Panel', 6), ('Toilet Block 6m', 2)], 'WC09 orders 4 + 6 + 2'
assert MIXED['WC09'] == [('FWF', True), ('Pee Panel', True), ('Toilet Block 6m', False)], \
    'WC09: FWF and Pee Panel must be on the Event Portables load, the 6 m toilet blocks not'

# ---- 1. lineNumbersOf: the automatic deal passes over Event Portables lines
s = rep(s, """ room.sort((x, y) => y.o - x.o || (LAB_ANCILLARY.test(x.item) ? 1 : 0) - (LAB_ANCILLARY.test(y.item) ? 1 : 0) || x.i - y.i);
 nums.filter(n => !taken.has(n)).forEach(n => { const r = room.find(x => x.left > 0) || room[0]; out[r.item].push(n); r.left--; });
 return out;
}""", """ room.sort((x, y) => y.o - x.o || (LAB_ANCILLARY.test(x.item) ? 1 : 0) - (LAB_ANCILLARY.test(y.item) ? 1 : 0) || x.i - y.i);
 /* v9.09 - a line the plan carries on an Event Portables load takes no Coates number here (WC09: the two 6 m blocks' numbers
 are the blocks', not the pee panels'); a person's choice above still wins, and a reference with nothing else keeps every line */
 const pool909 = room.filter(x => !epLine909(a, x.item)), deal = pool909.length ? pool909 : room;
 nums.filter(n => !taken.has(n)).forEach(n => { const r = deal.find(x => x.left > 0) || deal[0]; out[r.item].push(n); r.left--; });
 return out;
}
/* v9.09 - Author: Andrew Fisher. A COATES NUMBER GOES TO A LINE IT CAN BE. the project manager, 8 Oct 2026, on WC09: "We need to
 have a line for each as each will have a install and level and stairs each one of those assets that go there."
 WC09 orders 4 FWF, 6 pee panels and 2 Toilet Block 6m; its two recorded numbers, 1268858 and 1311146, are the two 6 m blocks.
 Dealt biggest order first, both went to the pee panels, so the blocks had one set of ticks for the reference. The FWF and pee
 panels are Event Portables Load 1 (v8.86 moved exactly those rows onto the supplier's load), and Event Portables units carry
 no Coates number. So a line with a schedule row on an Event Portables load is passed over when numbers nobody placed are dealt
 out. The page tells this from the row the plan moved and nothing else: a line it cannot tell is not passed over. */
function epLine909(a, item){
 return ((a && a.events) || []).some(e => e && e.movement !== 'remove' && e.date_correction && e.date_correction.plan886
  && (e.item === item || lineItemMatch(item, e.item)));
}""", 'lineNumbersOf: the automatic deal', p)

# ---- the proof: DATA is the base's, byte for byte, the footer is untouched, the helper is defined once and read once
i2 = s.find('const DATA = '); j2 = s.find('\n', i2)
assert s[i2:j2] == line and s.count('const DATA = ') == 1, 'DATA changed - stopping'
assert re.findall(r" · v(\d+)\.(\d+)'; /\* v8\.19", s) == FOOT, 'the footer changed - stopping'
assert s.count('function epLine909(') == 1 and s.count('epLine909(a, x.item)') == 1, 'epLine909 is defined once and read once'
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s)
print(f'v9.09 lines part on base v{FOOT[0][0]}.{FOOT[0][1]}: Event Portables lines beside others {sorted(MIXED)}; '
      f'lineNumbersOf deals Coates numbers past them (1 page edit, 1 helper); DATA and footer unchanged')
