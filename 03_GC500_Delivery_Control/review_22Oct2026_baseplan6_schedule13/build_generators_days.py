"""Author: Andrew Fisher. 9961976 generators, day by day: a column a day from the first set landing (28 Sep) to the last race
day (25 Oct), the charge in each cell - the card's standby rate from the day the set lands until 22 Oct, the full daily
rate on 23, 24 and 25 Oct, nothing after - with the standby, race and full totals a set and Baseplan's line beside them.
    python3 -I build_generators_days.py
"""
import datetime as dt
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter as col
HERE = Path(__file__).resolve().parent
# the 2026 street card, Daily Rate 2026 / Standby Rate 2026 (the page's rate_match); 350 kVA has no line - the page prices it at the card's 315 kVA line
RATES = {'20': (122.2301, 61.11711), '30': (141.5323, 70.76718), '45': (175.8416, 87.92286), '50': (182.2791, 91.13955), '60': (193.0014, 96.5007),
         '150': (268.0575, 134.02875), '200': (364.5582, 182.2791), '350': (471.7812, 235.8906)}
# ref, kVA asked for, asset, on site (record), Baseplan line, Baseplan $, note
GENS = [('GN01', '60', '1276507', '2026-09-28', 16, 1544.00, ''),
        ('GN03', '30', '1320829', '2026-10-01', 10, 1132.28, ''),
        ('GN04', '30', '1277400', '2026-10-19', 14, 919.97, ''),
        ('GN06', '50', '1320828', '2026-10-15', 48, 1184.82, 'Baseplan says 60 kVA from 19 Oct; a 50 kVA was asked for, on site 15 Oct'),
        ('GN10', '20', '1283681', '2026-10-19', 15, 1142.96, 'Baseplan says 60 kVA; a 20 kVA was asked for'),
        ('GN13', '45', '1276503', '2026-10-12', 44, 1406.72, 'Baseplan says 60 kVA delivered as 45, term 12 Nov; a 45 kVA was asked for, hire ends 25 Oct'),
        ('GN18', '50', '1261273', '2026-10-07', 11, 2187.36, 'Baseplan says 60 kVA; a 50 kVA was asked for'),
        ('GN19', '60', '1276416', '2026-10-19', 7, 1254.50, 'Baseplan says 80 kVA delivered as 60; a 60 kVA was asked for'),
        ('GN20', '350', '1276701', '2026-09-30', 6, 6260.40, 'Baseplan says 365 kVA; a 350 kVA was asked for, priced at the card\'s 315 kVA line (no 350 line)'),
        ('GN21', '60', '1261284', '2026-09-30', 38, 868.50, ''),
        ('GN23', '150', '1297157', '2026-09-30', 9, 2412.54, ''),
        ('GN24', '60', '1277089', '2026-10-19', 49, 984.33, 'trailer-mounted 60 kVA; not yet priced on our page (no rate or date recorded) - priced here at the 60 kVA line'),
        ('GN25', '20', '1244536', '2026-10-19', 18, 855.63, ''),
        ('GN26', '200', '1316182', '2026-10-12', 42, 2005.08, 'concert set; on our page only as "GN?" - to be given its own reference'),
        ('GN27', '200', '1316183', '2026-10-12', 43, 2551.92, 'concert set; on our page only as "GN?" - to be given its own reference')]
D0, D1 = dt.date(2026, 9, 28), dt.date(2026, 10, 25); RACE = {dt.date(2026, 10, 23), dt.date(2026, 10, 24), dt.date(2026, 10, 25)}
days = [D0 + dt.timedelta(n) for n in range((D1 - D0).days + 1)]
wb = Workbook(); ws = wb.active; ws.title = 'Day by day'
H = Font(bold=True); SB = PatternFill('solid', fgColor='DDEBF7'); FULL = PatternFill('solid', fgColor='FCE4D6'); TOT = PatternFill('solid', fgColor='E2EFDA')
fixed = ['Ref', 'kVA asked', 'Asset', 'On site', 'Standby $/day', 'Full $/day']
ws.append(fixed + [('FULL' if d in RACE else 'standby') for d in days] + ['Standby days', 'Standby $', 'Race days', 'Race $', 'Our total', 'Baseplan line', 'Baseplan $', 'Difference', 'Note'])
ws.append([''] * len(fixed) + [d.strftime('%a %d %b') for d in days] + [''] * 9)
for r in (1, 2):
    for c in ws[r]: c.font = H; c.alignment = Alignment(horizontal='center', wrap_text=True)
daytot = [0.0] * len(days); G = {'sbd': 0, 'sb': 0.0, 'rd': 0, 'race': 0.0, 'tot': 0.0, 'bp': 0.0}
for ref, kva, asset, on, line, bp, note in GENS:
    daily, sb = RATES[kva]; start = dt.date.fromisoformat(on); cells = []; sbd = sbm = rd = rm = 0
    for n, d in enumerate(days):
        if d < start: cells.append(None); continue
        v = daily if d in RACE else sb; cells.append(round(v, 2)); daytot[n] += v
        if d in RACE: rd += 1; rm += v
        else: sbd += 1; sbm += v
    tot = sbm + rm
    ws.append([ref, kva, asset, start.strftime('%d %b'), round(sb, 4), round(daily, 4)] + cells + [sbd, round(sbm, 2), rd, round(rm, 2), round(tot, 2), line, bp, round(tot - bp, 2), note])
    G['sbd'] += sbd; G['sb'] += sbm; G['rd'] += rd; G['race'] += rm; G['tot'] += tot; G['bp'] += bp
ws.append(['TOTAL'] + [''] * (len(fixed) - 1) + [round(v, 2) for v in daytot] + [G['sbd'], round(G['sb'], 2), G['rd'], round(G['race'], 2), round(G['tot'], 2), '', round(G['bp'], 2), round(G['tot'] - G['bp'], 2), '15 sets'])
for c in ws[ws.max_row]: c.font = H; c.fill = TOT
f0 = len(fixed) + 1
for row in ws.iter_rows(min_row=3, max_row=ws.max_row - 1):
    for n, d in enumerate(days):
        c = row[f0 - 1 + n]
        if c.value is not None: c.fill = FULL if d in RACE else SB; c.number_format = '#,##0.00'
    for k in range(f0 + len(days), f0 + len(days) + 8):
        if isinstance(row[k - 1].value, float): row[k - 1].number_format = '#,##0.00'
ws.freeze_panes = ws.cell(row=3, column=f0)
for i in range(1, f0): ws.column_dimensions[col(i)].width = [7, 6, 9, 8, 9, 9][i - 1]
for n in range(len(days)): ws.column_dimensions[col(f0 + n)].width = 8.5
for k, w in enumerate([8, 10, 6, 9, 10, 8, 10, 10, 60]): ws.column_dimensions[col(f0 + len(days) + k)].width = w
ws.row_dimensions[1].height = 18; ws.row_dimensions[2].height = 30
n = wb.create_sheet('Rates & basis')
n.append(['kVA', 'Card line', 'Full daily rate 2026', 'Standby rate 2026']); [setattr(c, 'font', H) for c in n[1]]
for k, (daily, sb) in RATES.items(): n.append([k, 'Generator ' + ('315 KVA (next size down; no 350 line)' if k == '350' else k + ' KVA'), daily, sb])
n.append([]); n.append(['Basis: the 2026 street card, ex GST. Standby rate every day from the day the set lands until 22 Oct; full daily rate on the race days 23, 24 and 25 Oct; no hire charge after 25 Oct. The rate follows the size the customer asked for, not the size sent. On-site dates are the site record. Author: Andrew Fisher, 22 Oct 2026.'])
for i, w in enumerate([8, 42, 20, 18]): n.column_dimensions[col(i + 1)].width = w
out = HERE / 'GC500_9961976_Generators_DayByDay_22Oct2026.xlsx'; wb.save(out)
print('written', out.name, {k: round(v, 2) for k, v in G.items()})
