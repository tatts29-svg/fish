"""Author: Andrew Fisher. Toilets - reference and all charges from the site record (16 Oct 2026).

    python3 -I build_xlsx.py toilets.json out.xlsx

A labour line counts where it is ticked (rate x units, as the page charges it); a transport leg where its tick is on;
event-night servicing per unit, per night, Fri 23, Sat 24 and Sun 25 Oct, at FWF $72.87 (accessible toilets as FWF),
tank $624.60, sewer-connect block $260.25. Hire is the contract amount the page carries. Ex GST.
"""
import json, sys
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment

rows = json.load(open(sys.argv[1]))
r2 = lambda v: round(v + 1e-9, 2)
LAB = [('install', 'Install'), ('levelling', 'Levelling'), ('steps', 'Steps'), ('cleaning', 'Cleaning'), ('demob', 'Demob')]
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Toilets'
B = Font(bold=True); AMB = PatternFill('solid', fgColor='FDF1D8')
head = ['Ref', 'Name', 'Units on the reference', 'Hire (contract)', 'Delivery'] + [n for _, n in LAB] + ['Pick-up', 'Fri night', 'Sat night', 'Sun night', 'Servicing 3 nights', 'TOTAL (my record)', 'Note']
ws.append(head)
for c in ws[1]: c.font = B; c.alignment = Alignment(wrap_text=True, vertical='top')
on = [r for r in rows if r['state'] == 'on site' and not r['cancelled'] and not r['moved']]
off = [r for r in rows if r not in on]
def key(r): import re; m = re.match(r'([A-Z]+)(\d+)', r['ref']); return (m.group(1), int(m.group(2))) if m else (r['ref'], 0)
tot = {}
for r in sorted(on, key=key):
    units = ', '.join('%s × %s' % (l['qty'], l['item']) for l in r['lines'])
    hire = r2(sum(l['hire'] or 0 for l in r['lines']))
    lab = {k: r2(sum((l['lab'].get(k) or {}).get('value', 0) for l in r['lines'])) for k, _ in LAB}
    dv = r2((r['tr'].get('delivery') or {}).get('charge', 0)); pv = r2((r['tr'].get('pickup') or {}).get('charge', 0))
    n = r['nights'] or {}; per = r2(n.get('per_night', 0)); nt = r2(n.get('total', 0))
    total = r2(hire + dv + pv + sum(lab.values()) + nt)
    notes = []
    if r['off']: notes.append('taken off by a person, left off: ' + ', '.join(x.split('|')[-1] for x in r['off']))
    if 'held' in (r['tr'].get('delivery') or {}).get('ticks', []): notes.append('delivery billed on the Coates contract (reviewed line); card delivery held so it is not charged twice')
    row = [r['ref'], r['name'], units, hire or None, dv or None] + [lab[k] or None for k, _ in LAB] + [pv or None, per or None, per or None, per or None, nt or None, total, '; '.join(notes)]
    ws.append(row)
    if notes: ws.cell(ws.max_row, len(head)).fill = AMB
    for i, v in enumerate(row[3:-1], 3):
        if isinstance(v, (int, float)): tot[i] = tot.get(i, 0) + v
ws.append([])
ws.append(['TOTAL', '%d toilet references on site' % len(on), ''] + [r2(tot.get(i, 0)) for i in range(3, len(head) - 1)] + [''])
for c in ws[ws.max_row]: c.font = B
for row in ws.iter_rows(min_row=2):
    for c in row[3:-1]:
        if isinstance(c.value, (int, float)): c.number_format = '$#,##0.00'
for i, w in enumerate([7, 26, 30, 12, 10, 10, 10, 9, 10, 10, 10, 10, 10, 10, 13, 14, 50], 1): ws.column_dimensions[openpyxl.utils.get_column_letter(i)].width = w
ws.freeze_panes = 'C2'
sv = wb.create_sheet('Servicing by type')
sv.append(['Service', 'Rate a night', 'Units', 'A night', 'Three nights']);
for c in sv[1]: c.font = B
agg = {}
for r in on:
    for l in (r['nights'] or {}).get('lines', []):
        a = agg.setdefault(l['kind'], {'rate': l['rate'], 'units': 0}); a['units'] += l['units']
NAMES = {'fwf': 'FWF Pump out & Clean & Restock (incl. accessible toilets)', 'tank': 'Tank Pump Out & Clean & Restock', 'sewer': 'Sewer Connect Units Clean & Restock'}
for k in ('fwf', 'tank', 'sewer'):
    if k in agg: a = agg[k]; sv.append([NAMES[k], a['rate'], a['units'], r2(a['rate'] * a['units']), r2(a['rate'] * a['units'] * 3)])
sv.append(['Pee panels', None, None, None, None, ]); sv.cell(sv.max_row, 1).value = 'Pee panels — no servicing charge (none named in the rates)'
sv.column_dimensions['A'].width = 58
s2 = wb.create_sheet('Not on site'); s2.append(['Ref', 'Name', 'Record says'])
for r in off: s2.append([r['ref'], r['name'], 'cancelled' if r['cancelled'] else r['state']])
wb.save(sys.argv[2])
print({head[i]: r2(v) for i, v in sorted(tot.items())}, len(on), 'on site')
