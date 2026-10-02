#!/usr/bin/env python3
"""Author: Andrew Fisher. Planned equipment and recorded supply on existing driver/install sheets."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep


def apply(text, path='GC500 page'):
    if 'function sheet808Record(' in text or 'content="v8.08"' in text:
        raise SystemExit('v8.08 already or partially applied')
    for marker in ['function place799(', 'function bookingGroups801(', 'function dpDeliveryNotes798(', 'function cw2Plan803(']:
        if text.count(marker) != 1:
            raise SystemExit('v8.08 requires the existing Today, booking, print and fencing components')
    # v8.05 is the separately owned spelling release. Both supported integration bases
    # keep the same print components; exact replacements below guard their contents.
    tags = re.findall(r'<meta name="gc500-release" content="(v[^"]+)">', text)
    if len(tags) != 1 or tags[0] not in ('v8.07', 'v8.05'):
        raise SystemExit('v8.08 requires live v8.07 or its v8.05 spelling follow-up')
    source = (ROOT / 'sheet_remaining808_src.js').read_text(encoding='utf-8').rstrip()
    text = rep(text, 'function dpTruckBefore801(g, doc){', source + '\nfunction dpTruckBefore801(g, doc){', 'print-only supply helpers', path)
    text = rep(text, "const lab = doc === 'drv' ? (col ? 'Collect' : 'Deliver') : (col ? 'Remove' : 'Install');",
               "const lab = doc === 'drv' ? (col ? 'Collect' : 'Planned delivery') : (col ? 'Remove' : 'Planned installation');", 'planned print heading', path)
    text = rep(text, "dpSec('On the truck', dpTruck(g, doc))", "dpSec(g.kind === 'deliveries' ? 'Planned equipment and current supply' : 'On the truck', dpTruck(g, doc))", 'equipment section context', path)
    text = rep(text, "g.kind === 'removals' ? 'Removal list' : 'Install list'", "g.kind === 'removals' ? 'Removal list' : 'Installation checks'", 'installation checks context', path)
    text = rep(text, '<th>What</th><th>Asset no.</th>', "<th>What</th><th>${g.kind === 'deliveries' ? 'Booked / recorded numbers' : 'Asset no.'}</th>", 'number column context', path)
    text = rep(text, "<td><b>${what ? esc(what) : ''}</b>${what ? '' : dpWr()}<span>${esc([r.a.name, r.a.discipline].filter(Boolean).join(' · '))}</span></td>",
               "<td>${g.kind === 'deliveries' ? sheet808What(r) : `<b>${what ? esc(what) : ''}</b>${what ? '' : dpWr()}`}<span>${esc([r.a.name, r.a.discipline].filter(Boolean).join(' · '))}</span></td>", 'per-type supply context', path)
    text = rep(text, 'const sh = subOf(r.a.key), shn = new Set(sh.map(x => String(x.no)).filter(Boolean)), own = nums.filter(x => !shn.has(String(x)));',
               'const sh = sheet808Sub(r.a), shn = new Set(sh.map(x => String(x.no)).filter(Boolean)), own = nums.filter(x => !shn.has(String(x)));', 'booked number scope', path)
    return rep(text, '<meta name="gc500-release" content="' + tags[0] + '">', '<meta name="gc500-release" content="v8.08">', 'release marker', path)


if __name__ == '__main__':
    target = Path(sys.argv[1])
    target.write_text(apply(target.read_text(encoding='utf-8'), str(target)), encoding='utf-8')
    print('v8.08 applied: print-only planned quantities and current supply context')
