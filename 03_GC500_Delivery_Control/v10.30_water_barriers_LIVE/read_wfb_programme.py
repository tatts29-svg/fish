"""Author: Andrew Fisher. Read iEDM's water-filled barrier programme TP02-26003-03 (GC500 WFB PROGRAM) into the rows the
page carries: every WB row with its zone, location, quantity, days, install and removal date and time, who installs
and who fills, and the comments as written. Coates rows are the section; Downer's rows are kept, marked, and never
counted. The day grid (CW 5 to DW 3) gives each row its first and last day.

    WFB_XLSX=/private/TP02-26003-03_GC500_WFB_PROGRAM.xlsx python3 read_wfb_programme.py > wfb_programme.json
"""
import datetime as dt
import hashlib
import json
import os
import sys

import openpyxl

SHA = 'ec099497d2156670'  # first 16 of the workbook's sha256, checked below


def hm(v):
    if v is None: return None
    if isinstance(v, (dt.datetime, dt.time)): return v.strftime('%H:%M')
    s = str(v).strip().lower()
    if s in ('any time', 'anytime'): return 'any time'
    import re
    m = re.match(r'^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$', s)
    if not m: return s
    h = int(m.group(1)); mi = int(m.group(2) or 0)
    if m.group(3) == 'pm' and h < 12: h += 12
    if m.group(3) == 'am' and h == 12: h = 0
    return f'{h:02d}:{mi:02d}'


def day(v):
    return v.date().isoformat() if isinstance(v, dt.datetime) else (v.isoformat() if isinstance(v, dt.date) else None)


def main():
    path = os.environ.get('WFB_XLSX') or (sys.argv[1] if len(sys.argv) > 1 else None)
    if not path: sys.exit(__doc__)
    sha = hashlib.sha256(open(path, 'rb').read()).hexdigest()
    assert sha.startswith(SHA), 'not the TP02-26003-03 programme workbook this reader was written for: ' + sha[:16]
    wb = openpyxl.load_workbook(path, data_only=True); ws = wb.worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    hi = next(i for i, r in enumerate(rows) if r[2] == 'FMS Facility ID'); hdr = rows[hi]
    dates = [(i, h.date().isoformat()) for i, h in enumerate(hdr) if isinstance(h, (dt.datetime, dt.date))]
    weeks = [(i, str(v)) for i, v in enumerate(rows[hi - 2]) if isinstance(v, str) and (v.startswith('CW') or v.startswith('DW'))]
    out = []; notes = []
    for r in rows[hi + 1:]:
        ref = r[2]
        if ref is None: continue
        if not str(ref).startswith('WB'):
            notes.append(str(ref).strip()); continue
        marks = [d for i, d in dates if r[i] not in (None, '')]
        qty = int(r[5]) if isinstance(r[5], (int, float)) else None
        out.append({
            'ref': str(ref).strip(), 'zone': None if r[3] in (None, 'n/a') else str(r[3]), 'location': str(r[4] or '').strip(),
            'quantity': qty, 'days_hire': int(r[6]) if isinstance(r[6], (int, float)) else None, 'fms_quantity': int(r[7]) if isinstance(r[7], (int, float)) else None,
            'install': {'date': day(r[8]), 'time': hm(r[9]), 'by': str(r[10] or '').strip() or None, 'comment': str(r[11] or '').strip() or None},
            'fill': {'time': hm(r[13]), 'by': str(r[14] or '').strip() or None},
            'removal': {'date': day(r[16]), 'time': hm(r[17]), 'comment': str(r[18] or '').strip() or None},
            'grid': {'first': marks[0] if marks else None, 'last': marks[-1] if marks else None, 'days': len(marks)},
            'coates': str(r[10] or '').strip().lower() == 'coates',
        })
    doc = {'schema': 'wfb-programme-1030', 'source': 'TP02-26003-03 - GC500 WFB PROGRAM (iEDM), sheet "2026 GC500 Water Barriers"', 'sha256': sha,
           'read_on': '2026-10-16', 'supplied_by': 'Andrew Fisher', 'header': 'WATER FILLED BARRIER PROGRAM · Coates, Downer, City of Gold Coast · FMS use',
           'weeks': [w for _, w in weeks], 'grid': {'first': dates[0][1], 'last': dates[-1][1]}, 'notes': notes, 'rows': out,
           'coates_rows': sum(1 for x in out if x['coates']), 'coates_barriers': sum(x['quantity'] or 0 for x in out if x['coates']),
           'downer_rows': sum(1 for x in out if not x['coates']), 'downer_barriers': sum(x['quantity'] or 0 for x in out if not x['coates'])}
    print(json.dumps(doc, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
