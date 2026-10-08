#!/usr/bin/env python3
# Author: Andrew Fisher. v9.00 part C (publishes in v9.05) - the WC09 count: a reference whose delivery rows the plan splits
# across days counts each row from its own day.
#
# What happened (8 Oct 2026). At 11:23 AEST the project manager set WC09 on site, and ticked it complete, on the shared record
# for its two 6 m toilet blocks (schedule row T0102, Thu 8 Oct). WC09's 4 FWF (T0101) and 6 pee panels (T0259) are Event
# Portables Load 1 on Fri 9 Oct: v8.86 moved those two rows with its plan correction (date_correction.plan886) and left the
# toilet blocks on Thu 8 Oct. He confirmed: "pee panel tommorrow". The record holds one state per reference, so Today's
# Toilets work rows read WC09 as 12 of 12, recorded complete - a day early for ten of the twelve.
#
# The rule, in one helper (split900) read at the one place the page derives a reference's completed quantity for work progress:
#   where the plan has split one reference's delivery rows across days - some rows moved to a later day by v8.86's plan
#   correction, others not - a Complete tick, or the on-site light, recorded at time T counts only the rows due on or before
#   T's date (AEST). A row due after that date is NOT counted when its day comes; it counts once a record made on or after
#   its day says so: the reference set on site again, or ticked complete again, on or after that day. The page keeps no
#   delivered record of its own for an Event Portables load (the loads collection holds drop cards, crew planning, unloading
#   windows and order, and the traffic-control status - none says a load was delivered), so nothing else counts for them.
#   Until then those rows read as due, never as done. A row's day is its own day on the plan (the schedule's, or v8.86's
#   correction); a day recorded on the reference is one day for every row and cannot say which rows it means, so it does not
#   move a row here. A tick with no time on it covers the first day's rows only. Unknown stays unknown.
#
# Where it is read (each a text replacement that must match exactly once):
#   todayWorkMetrics840  - Today's work rows: done, complete, the status and, on the row's own sub-line, the reason
#                          ("2 of 12 · 4 FWF, 6 Pee Panel due Fri 9 Oct (Event Portables Load 1)."); Where we are, the
#                          summaries and the Today scene read their figures from here;
#   todayGroupDetails841 - the group card's item types: the complete quantity of each item;
#   todayTypeMetrics843  - the type breakdown's reference rows, so they reconcile with the group card.
# A split row that is only partly counted is not "recorded complete" for the review rules (it is a known part, not a conflict).
#
# Not touched: DATA, the record (read-only), the Timeline (placement and its own completion state), the maps, money, hire
# dates, the footer, every pin, MASTER_LOC entry and marker, and every reference without split rows - its row is the base's,
# byte for byte. On the live record of 8 Oct the split references are WC09 and WC67; WC67 (2 FWF on site and complete since
# 1 Oct, the second 2 FWF Load 2 on Tue 13 Oct) reads 2 of 2 before and after, because its order quantity is the 2 already
# due by 1 Oct.
#
#   toolchain/build.sh v905_split v9.00_crew_vms_counts_DRAFT/patch_v900_split.py
import json, os, re, sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep

p = Path(sys.argv[1]); raw = p.read_bytes(); bom = raw.startswith(b'\xef\xbb\xbf'); s = raw.decode('utf-8-sig')

# ---- the base: one DATA line that round-trips; the three model functions and the helpers the rule reads; not applied already
assert s.count('const DATA = ') == 1, 'expected one DATA declaration'
i = s.find('const DATA = '); j = s.find('\n', i); line = s[i:j]; assert line.endswith(';'), 'DATA must be one line ending ;'
body = line[len('const DATA = '):-1]
D = json.loads(body)
assert json.dumps(D, ensure_ascii=False, separators=(',', ':')) == body, 'DATA does not round-trip - stopping'
if 'function split900(' in s or 'split900-script' in s:
    sys.exit('v9.00 split part already applied')
for f in ('function todayWorkMetrics840(', 'function todayGroupDetails841(', 'function todayTypeMetrics843(',
          'function deliveryAsOf(', 'function isoIn(', 'function qtyOf(', 'function fmtDay('):
    assert s.count(f) == 1, f'the base must carry {f.split(" ")[1]} once'
FOOT = re.findall(r" · v(\d+)\.(\d+)'; /\* v8\.19", s)   # the base's own release marker; the footer step bumps it, not this part
assert len(FOOT) == 1 and (int(FOOT[0][0]), int(FOOT[0][1])) >= (9, 4), f'the base must carry one release footer, v9.04 or later (found {FOOT})'

# ---- the plan as the base carries it: which references split their delivery rows across days, by v8.86's correction
ISO = re.compile(r'^\d{4}-\d{2}-\d{2}$')
def rows_of(a): return [e for e in a.get('events') or [] if e and e.get('movement') != 'remove' and ISO.match(e.get('date') or '')]
def moved(e): return bool((e.get('date_correction') or {}).get('plan886'))
SPLIT = {}
for a in D['assets']:
    r = rows_of(a)
    if any(moved(e) for e in r) and not all(moved(e) for e in r) and len({e['date'] for e in r}) > 1:
        SPLIT[a['key']] = [(e.get('task_id'), e['date'], e.get('item'), e.get('quantity_raw'), moved(e)) for e in r]
for k, r in sorted(SPLIT.items()): print('  split rows:', k, r)
# Anything beyond these two is a reference this rule would start counting differently without anyone having looked at it.
assert sorted(SPLIT) == ['WC09', 'WC67'], f'the plan splits {sorted(SPLIT)}; expected WC09 and WC67 - look before shipping'
W = {e[0]: e for e in SPLIT['WC09']}
assert W.get('T0102') == ('T0102', '2026-10-08', 'Toilet Block 6m', 2, False), 'WC09: the 6 m toilet blocks must be due Thu 8 Oct, unmoved'
assert W.get('T0101') == ('T0101', '2026-10-09', 'FWF', 4, True) and W.get('T0259') == ('T0259', '2026-10-09', 'Pee Panel', 6, True), \
    'WC09: the 4 FWF and 6 pee panels must be due Fri 9 Oct by the v8.86 correction'
WC09 = next(a for a in D['assets'] if a['key'] == 'WC09')
assert all((e.get('date_correction') or {}).get('load') == 1 for e in WC09['events'] if moved(e)), 'WC09 moves with Event Portables Load 1'
assert sorted((l['item'], l['quantity']) for l in WC09['charge_lines']) == [('FWF', 4), ('Pee Panel', 6), ('Toilet Block 6m', 2)], 'WC09 orders 4 + 6 + 2'

# ---- 1. todayWorkMetrics840: the work row
s = rep(s, """      const conflict = !!d.done && shorts.some(s => selected.some(l => l.item === s.item));
      const complete = !!d.done && !conflict;
      const contribution = complete ? known : 0;""",
"""      const conflict = !!d.done && shorts.some(s => selected.some(l => l.item === s.item));
      /* v9.05 - rows the plan has split across days count from their own day (split900); null for every other reference */
      const split900r = !conflict && typeof split900 === 'function' ? split900(a, d, selected) : null;
      const complete = !!d.done && !conflict && !split900r;
      const contribution = complete ? known : split900r ? Math.max(0, known - split900r.withheld) : 0;""",
        'work row: the count (todayWorkMetrics840)', str(p))
s = rep(s, """        : complete ? 'Recorded complete'
        : d.recorded && d.state === 'on site' ? 'On site · completion not recorded'""",
"""        : split900r ? split900r.status
        : complete ? 'Recorded complete'
        : d.recorded && d.state === 'on site' ? 'On site · completion not recorded'""",
        'work row: the status (todayWorkMetrics840)', str(p))
s = rep(s, """      const detail = [selected.map(l => String(l.item || '')).join(', '),""",
"""      const detail = [split900r ? (rowUnknown ? '' : contribution + ' of ' + known + ' · ') + split900r.words + '.' : '',
        selected.map(l => String(l.item || '')).join(', '),""",
        'work row: the reason on its sub-line (todayWorkMetrics840)', str(p))
s = rep(s, "quantity: rowUnknown ? null : known, knownQuantity: known, complete, recordedComplete: !!d.done,",
        "quantity: rowUnknown ? null : known, knownQuantity: known, complete, recordedComplete: !!d.done && !split900r,",
        'work row: a known part is not a review (todayWorkMetrics840)', str(p))
s = rep(s, "status, detail, levelled: !!d.levelled, steps: !!d.steps});",
        "status, detail, levelled: !!d.levelled, steps: !!d.steps, ...(split900r ? {split900: split900r.row} : {})});",
        'work row: the split, for the record of it (todayWorkMetrics840)', str(p))

# ---- 2. todayGroupDetails841: the group card's item types
s = rep(s, """      const items = new Set([...(r.askedBy || new Map()).keys(), ...r.cls.map(l => l.item)]);""",
"""      const items = new Set([...(r.askedBy || new Map()).keys(), ...r.cls.map(l => l.item)]);
      const split900g = typeof split900 === 'function' ? split900(r.a, r.d, r.cls) : null; /* v9.05 */""",
        'group card: the split per reference (todayGroupDetails841)', str(p))
s = rep(s, "if (r.d.done && !conflict) type.knownComplete += quantity;",
        "if (r.d.done && !conflict) type.knownComplete += Math.max(0, quantity - (split900g && split900g.items.get(item) || 0));",
        'group card: the complete quantity per item (todayGroupDetails841)', str(p))

# ---- 3. todayTypeMetrics843: the type breakdown's reference rows
s = rep(s, """          const complete = recordedComplete && !conflict;
          const done = unitKnown ? (complete ? knownQuantity : 0) : null;""",
"""          const split900t = !conflict && typeof split900 === 'function' ? split900(native.a, d, lines) : null; /* v9.05 */
          const held900 = split900t ? [...new Set(lines.map(line => line.item))].reduce((n, item) => n + (split900t.items.get(item) || 0), 0) : 0;
          const complete = recordedComplete && !conflict && !held900;
          const done = unitKnown ? (complete ? knownQuantity : held900 ? Math.max(0, knownQuantity - held900) : 0) : null;""",
        'type rows: the count (todayTypeMetrics843)', str(p))
s = rep(s, """            : complete ? 'Confirmed complete'
            : d.recorded && d.state === 'on site' ? d.where === 'rental'""",
"""            : held900 ? [...new Set(lines.map(line => line.item))].map(item => split900t.itemWords.get(item)).filter(Boolean).join('; ')
            : complete ? 'Confirmed complete'
            : d.recorded && d.state === 'on site' ? d.where === 'rental'""",
        'type rows: the status (todayTypeMetrics843)', str(p))
s = rep(s, "onSite, complete, recordedComplete, conflict, conflictReason:",
        "onSite, complete, recordedComplete: recordedComplete && !held900, conflict, conflictReason:",
        'type rows: a known part is not a review (todayTypeMetrics843)', str(p))

JS = r"""<script id="split900-script">
/* Author: Andrew Fisher. v9.05 - a reference whose delivery rows the plan splits across days counts each row from its own day.
   WC09, 8 Oct 2026: the project manager set it on site and ticked it complete at 11:23 AEST for its two 6 m toilet blocks, due
   Thu 8 Oct; its 4 FWF and 6 pee panels are Event Portables Load 1 on Fri 9 Oct (v8.86's plan correction), and he confirmed the
   pee panels come the next day. The record holds one state per reference, so the tick read as all twelve.
   The rule, read by Today's work rows (todayWorkMetrics840), the group card's item types (todayGroupDetails841) and the type
   breakdown (todayTypeMetrics843), and so by Where we are: where the plan has split one reference's delivery rows across days -
   some moved to a later day by v8.86's correction (plan886), others not - a Complete tick, or the on-site light, recorded at a
   time counts only the rows due on or before that time's day (AEST). A row due after that day is not counted when its day
   comes; it counts once a record made on or after its day says so: the reference set on site again, or ticked complete again,
   on or after that day. The page keeps no delivered record of its own for an Event Portables load, so nothing else counts for
   them. A row's day is its own day on the plan; a day recorded on the reference is one day for every row and cannot say which
   rows it means, so it moves no row here. A tick with no time on it covers the first day's rows only.
   split900(a, d, lines) -> null when nothing is held back (every reference without split rows, and a split one whose rows are
   all covered); else {by, withheld, items: item -> quantity held back, due, words, itemWords, status, row}. Read-only. */
function split900Day(iso){
 try { const f = fmtDay(iso); return f.dow + ' ' + String(f.dm).replace(/^0/, ''); } catch (e) { return String(iso || ''); }
}
function split900(a, d, lines){
 try {
  if (!a || !d || !d.done) return null;
  const ISO = /^\d{4}-\d{2}-\d{2}$/;
  const rows = (a.events || []).filter(e => e && e.movement !== 'remove' && ISO.test(e.date || ''));
  const moved = e => !!(e.date_correction && e.date_correction.plan886);
  if (!rows.some(moved) || rows.every(moved) || new Set(rows.map(e => e.date)).size < 2) return null;
  const dayOf = t => { const v = t ? isoIn(t) : ''; return ISO.test(v) ? v : ''; };
  let by = dayOf(d.done_at);
  const seen = d.recorded && d.state === 'on site' ? dayOf(d.set_at) : '';
  if (seen > by) by = seen;
  if (!by) by = rows.map(e => e.date).sort()[0];
  const num = v => { if (v == null || String(v).trim() === '') return null; const x = Number(v); return Number.isFinite(x) && x >= 0 ? x : null; };
  const order = [], scope = new Map();
  for (const l of lines || []) { const q = qtyOf(l); if (q == null || q < 0) continue; if (!scope.has(l.item)) order.push(l.item); scope.set(l.item, (scope.get(l.item) || 0) + q); }
  const items = new Map(), due = [];
  for (const item of order) {
   const mine = rows.filter(e => e.item === item);
   const later = mine.filter(e => e.date > by).sort((x, y) => x.date < y.date ? -1 : x.date > y.date ? 1 : 0);
   if (!later.length) continue;
   const dueBy = mine.filter(e => e.date <= by).reduce((t, e) => t + (num(e.quantity_raw) || 0), 0);
   const room = Math.max(0, scope.get(item) - dueBy);
   const held = later.some(e => num(e.quantity_raw) == null) ? room : Math.min(room, later.reduce((t, e) => t + num(e.quantity_raw), 0));
   if (!held) continue;
   items.set(item, held);
   let left = held;
   for (const e of later) {
    if (!left) break;
    const q = num(e.quantity_raw), take = q == null ? left : Math.min(left, q); if (!take) continue; left -= take;
    const c = e.date_correction || {};
    due.push({item, quantity: take, date: e.date, task: e.task_id || null,
     load: c.plan886 && c.load != null ? (/Event Portables/.test(String(c.stated_by || c.source || '')) ? 'Event Portables Load ' : 'Load ') + c.load : null});
   }
  }
  if (!items.size) return null;
  const say = list => {
   const days = [];
   list.forEach(x => { const k = x.date + '|' + (x.load || ''); let g = days.find(y => y.k === k);
    if (!g) days.push(g = {k, date: x.date, load: x.load, parts: []});
    const have = g.parts.find(y => y.item === x.item); if (have) have.quantity += x.quantity; else g.parts.push({item: x.item, quantity: x.quantity}); });
   return days.sort((x, y) => x.k < y.k ? -1 : x.k > y.k ? 1 : 0)
    .map(g => g.parts.map(y => y.quantity + ' ' + y.item).join(', ') + ' due ' + split900Day(g.date) + (g.load ? ' (' + g.load + ')' : '')).join('; ');
  };
  const withheld = [...items.values()].reduce((t, v) => t + v, 0);
  return {by, withheld, items, due, words: say(due),
   itemWords: new Map([...items.keys()].map(item => [item, say(due.filter(x => x.item === item))])),
   status: 'Recorded complete for the rows due by ' + split900Day(by),
   row: {by, withheld, due: due.map(x => Object.assign({}, x))}};
 } catch (e) { return null; }
}
</script>
"""
k = s.rfind('</body>'); assert k > 0 and s[k:].strip() == '</body></html>', 'the page must end </body></html>'
s = s[:k] + JS + s[k:]

# ---- the proof: DATA is the base's, byte for byte, and the footer is untouched
i2 = s.find('const DATA = '); j2 = s.find('\n', i2)
assert s[i2:j2] == line and s.count('const DATA = ') == 1, 'DATA changed - stopping'
assert re.findall(r" · v(\d+)\.(\d+)'; /\* v8\.19", s) == FOOT, 'the footer changed - stopping'
assert s.count('function split900(') == 1 and [s.count(c) for c in ('split900(a, d, selected)', 'split900(r.a, r.d, r.cls)', 'split900(native.a, d, lines)')] == [1, 1, 1], \
    'split900 is defined once and read once at each of the three model places'
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s)
print(f'v9.00 split part on base v{FOOT[0][0]}.{FOOT[0][1]}: split references {sorted(SPLIT)}; '
      f'3 model functions read split900 (10 page edits), 1 script; DATA and footer unchanged')
