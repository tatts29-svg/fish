"""Author: Andrew Fisher. 25 Oct 2026 - a Baseplan SuperCars export as JSON: one list of lines per contract (the 7-digit
number in the sheet name), the sheet's branch, and the Delivery Dockets. Read-only; the export and the JSON stay private.

    python3 -I to_json.py <export.xlsx> <out.json>
"""
import datetime, json, re, sys
import openpyxl

def val(v):
    return v.isoformat() if isinstance(v, (datetime.date, datetime.time, datetime.datetime)) else v

wb = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)
out = {'_branch': {}, '_sheet': {}}
for ws in wb.worksheets:
    rows = list(ws.iter_rows(values_only=True))
    head = [str(x).strip() if x is not None else '' for x in rows[0]]
    if ws.title == 'Delivery Dockets':
        key = 'Delivery Dockets'
    else:
        m = re.search(r'(\d{7})', ws.title); key = m.group(1)
        b = re.search(r'\b(KINP|NVAC|MEAD|STPS)\b', ws.title.replace('-', ' '))
        out['_branch'][key] = b.group(1) if b else None; out['_sheet'][key] = ws.title
    lines = []
    for r in rows[1:]:
        d = {head[j]: val(r[j]) for j in range(min(len(head), len(r))) if head[j] and r[j] not in (None, '')}
        if d: lines.append(d)
    out[key] = lines
json.dump(out, open(sys.argv[2], 'w'), indent=0, default=str)
print({k: len(v) for k, v in out.items() if not k.startswith('_')})
