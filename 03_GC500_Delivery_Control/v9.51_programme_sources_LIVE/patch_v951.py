#!/usr/bin/env python3
"""Author: Andrew Fisher. Reconcile reviewed programme evidence without record writes."""
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE))
sys.path.insert(0, str(BASE.parent / 'toolchain'))
from rep import rep
from fencing951 import apply_fencing951
from infrastructure951 import apply_infrastructure951


def patch(html, path='<candidate>'):
    if '"infrastructure_review951"' in html or '"source_review951"' in html:
        raise ValueError('Programme reconciliation already applied')
    if '"schedule_review950"' not in html:
        raise ValueError('Requires reviewed Schedule 7 source refresh')
    if "+ ' · v9.50'; /* v8.19" not in html:
        raise ValueError('Requires the integrated v9.50 base')
    html = apply_fencing951(html, path)
    html = apply_infrastructure951(html, path)
    return rep(html, "+ ' · v9.50'; /* v8.19", "+ ' · v9.51'; /* v8.19",
               'programme reconciliation release', path)


if __name__ == '__main__':
    target = Path(sys.argv[1])
    raw = target.read_bytes()
    bom = raw.startswith(b'\xef\xbb\xbf')
    result = patch(raw.decode('utf-8-sig'), str(target))
    target.write_bytes((b'\xef\xbb\xbf' if bom else b'') + result.encode('utf-8'))
    print('Reviewed fencing and infrastructure programme evidence applied; no operational writes.')
