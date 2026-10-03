#!/usr/bin/env python3
"""Author: Andrew Fisher. Pack the two remaining Today work cards at their natural height.

Apply after the frozen original v8.14 patch. On a wide screen with exactly Delivery
updates and Who to call visible, give Delivery updates one column and Who to call
the remaining columns. Existing components, programme-day packing, other sections,
phone and print rules remain unchanged. The measured release review found equal
half-widths increased unused area in this particular pair.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep
p = sys.argv[1]
t = Path(p).read_text()
marker = '/* v8.14 audit: pack only the two remaining Today work cards */'
if marker in t:
    raise SystemExit('v8.14 pair audit already applied')
if 'function exportBadge814(n)' not in t or 'function place799(box)' not in t:
    raise SystemExit('Apply the original v8.14 patch first')
t = rep(t, ''' const items = [];
 for (const k of kids) {''', ''' const items = [];
 ''' + marker + '''
 const visible814 = kids.filter(k => k.getClientRects().length);
 const pair814 = box.matches('#pane-today > .hub.mas95') && visible814.length === 2
  && visible814.some(k => k.classList.contains('advicecard'))
  && visible814.some(k => k.classList.contains('teamhub'));
 for (const k of kids) {''', 'identify the remaining Today card pair', p)
t = rep(t, '''items.push({k, h, s: Math.min(C, +k.dataset.span799 + (k.dataset.wide799 ? 1 : 0))});''',
        '''items.push({k, h, s: pair814 ? (k.classList.contains('teamhub') ? C - 1 : 1)
   : Math.min(C, +k.dataset.span799 + (k.dataset.wide799 ? 1 : 0))});''',
        'pack the pair to one column and the remaining columns', p)
Path(p).write_text(t)
print('v8.14 pair audit applied: remaining Today work cards share the available columns')
