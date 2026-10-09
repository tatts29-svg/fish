#!/usr/bin/env python3
"""Author: Andrew Fisher. Keep the export reminder after navigation rendering.

Apply after the frozen original patch_v814.py. The earlier call was overwritten
by renderTabs' existing Export label writer. No data or export action changes.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

p = sys.argv[1]
t = Path(p).read_text()
marker = '/* v8.14 audit: export reminder owns the final label */'
if marker in t:
    raise SystemExit('v8.14 export audit already applied')
if 'function exportBadge814(n)' not in t:
    raise SystemExit('Apply the original v8.14 patch first')
t = rep(t, ' const att = attention(); exportBadge814(att.export);',
        ' const att = attention();', 'remove premature export badge write', p)
t = rep(t, ''' const eb = $('#exportBtn');
 if (eb) { eb.innerHTML = 'Export' + (att.export ? `<i class="dot" title="${att.export} change${att.export > 1 ? 's' : ''} since the last export"></i>` : '');
 eb.title = att.export ? att.export + ' change' + (att.export > 1 ? 's' : '') + ' in this browser since the last export' : 'Export the records in this browser'; }''',
        ' ' + marker + '\n exportBadge814(att.export);', 'final export badge writer', p)
Path(p).write_text(t)
print('v8.14 audit applied: export reminder survives navigation rendering')
