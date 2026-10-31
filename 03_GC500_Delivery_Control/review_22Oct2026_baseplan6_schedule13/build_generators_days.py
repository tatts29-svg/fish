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
# the 2026 street card, Daily Rate 2026 / Standby Rate 2026 (the page's rate_match)
RATES = {'20': (122.2301, 61.11711), '30': (141.5323, 70.76718), '45': (175.8416, 87.92286), '50': (182.2791, 91.13955), '60': (193.0014, 96.5007),
         '150': (268.0575, 134.02875), '200': (364.5582, 182.2791)}
# ref, kVA asked for, asset, on site (record), Baseplan line, Baseplan $, note
GENS = [('GN01', '60', '1276507', '2026-09-28', 16, 1544.00, ''),
        ('GN03', '30', '1320829', '2026-10-01', 10, 1132.28, ''),
        ('GN04', '30', '1277400', '2026-10-19', 14, 919.97, ''),
        ('GN06', '50', '1320828', '2026-10-15', 48, 1184.82, 'Baseplan says 60 kVA from 19 Oct; a 50 kVA was asked for, on site 15 Oct'),
        ('GN10', '20', '1283681', '2026-10-19', 15, 1142.96, 'Baseplan says 60 kVA; a 20 kVA was asked for'),
        ('GN13', '45', '1276503', '2026-10-12', 44, 1406.72, 'Baseplan says 60 kVA delivered as 45, term 12 Nov; a 45 kVA was asked for, hire ends 25 Oct'),
        ('GN18', '50', '1261273', '2026-10-07', 11, 2187.36, 'Baseplan says 60 kVA; a 50 kVA was asked for'),
        ('GN19', '60', '1276416', '2026-10-19', 7, 1254.50, 'Baseplan says 80 kVA delivered as 60; a 60 kVA was asked for'),
        ('GN21', '60', '1261284', '2026-09-30', 38, 868.50, ''),
        ('GN23', '150', '1297157', '2026-09-30', 9, 2412.54, ''),
        ('GN24', '60', '1277089', '2026-10-19', 49, 984.33, 'Andrew, 22 Oct: charged as a 60 kVA, asset 1277089, on site 19 Oct. Baseplan (6) has line 49 Off Rent at $0 and line 17 (1276412, the 80 kVA) gone: line 49 needs to be on rent from 19 Oct at the 60 kVA rate'),
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
ws.append(['TOTAL'] + [''] * (len(fixed) - 1) + [round(v, 2) for v in daytot] + [G['sbd'], round(G['sb'], 2), G['rd'], round(G['race'], 2), round(G['tot'], 2), '', round(G['bp'], 2), round(G['tot'] - G['bp'], 2), '14 sets'])
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
for k, (daily, sb) in RATES.items(): n.append([k, 'Generator ' + k + ' KVA', daily, sb])
n.append([]); n.append(['Basis: the 2026 street card, ex GST. Standby rate every day from the day the set lands until 22 Oct; full daily rate on the race days 23, 24 and 25 Oct; no hire charge after 25 Oct. The rate follows the size the customer asked for, not the size sent. On-site dates are the site record. Author: Andrew Fisher, 22 Oct 2026.'])
for i, w in enumerate([8, 42, 20, 18]): n.column_dimensions[col(i + 1)].width = w
# labour and transport a set: the card's install and demob (one each), transport each way by size
LAB = {'20': 145.74, '30': 145.74, '45': 145.74, '50': 145.74, '60': 145.74, '80': 145.74, '150': 166.56, '200': 166.56, '350': 166.56}  # 350 kVA kept for completeness; no set of that size is on the list
TR = {'20': 300.0, '30': 300.0, '45': 300.0, '50': 450.0, '60': 450.0, '80': 450.0, '150': 450.0, '200': 600.0, '350': 600.0}
lt = wb.create_sheet('Labour & transport', 1)
lt.append(['Ref', 'kVA', 'On site', 'Install (done)', 'Demob (at demob)', 'Transport each way', 'Delivery leg (done)', 'Pickup leg (at demob)', 'Hire standby to 22 Oct', 'Hire race days', 'Hire total', 'Set total now (hire + install + delivery)', 'Set total later (demob + pickup)', 'Set total', 'Note'])
for c in lt[1]: c.font = H; c.alignment = Alignment(wrap_text=True, horizontal='center')
T2 = {k: 0.0 for k in ('inst', 'demob', 'del', 'pick', 'sb', 'race', 'now', 'later', 'all')}
for row in ws.iter_rows(min_row=3, max_row=ws.max_row - 1, values_only=True):
    ref, kva = row[0], row[1]; sbm, rm = row[f0 + len(days)], row[f0 + len(days) + 2]; note = row[-1]
    inst = LAB[kva]; dem = LAB[kva]; tr = TR[kva]
    now = sbm + rm + inst + tr; later = dem + tr
    lt.append([ref, kva, row[3], inst, dem, tr, tr, tr, sbm, rm, round(sbm + rm, 2), round(now, 2), round(later, 2), round(now + later, 2), note or ''])
    for k, v in (('inst', inst), ('demob', dem), ('del', tr), ('pick', tr), ('sb', sbm), ('race', rm), ('now', now), ('later', later), ('all', now + later)): T2[k] += v
lt.append([]); lt.append(['TOTAL', '14 sets', '', round(T2['inst'], 2), round(T2['demob'], 2), '', round(T2['del'], 2), round(T2['pick'], 2), round(T2['sb'], 2), round(T2['race'], 2), round(T2['sb'] + T2['race'], 2), round(T2['now'], 2), round(T2['later'], 2), round(T2['all'], 2), ''])
for c in lt[lt.max_row]: c.font = H; c.fill = TOT
lt.append([]); lt.append(['Baseplan 9961976 lines 51-55: labour 11 x $291.48 + 4 x $333.12 = $4,538.76 (install + demob a set, the card\'s figures, on 15 sets); transport 10 x $300 + 14 x $450 + 6 x $600 = $12,900 (both legs, 15 sets). The record has 14 sets (GN20 is off the list on Andrew\'s word, 22 Oct: 1276701 never came): labour is 10 x $291.48 + 3 x $333.12 = $3,914.16 and transport 10 x $300 + 14 x $450 + 4 x $600 = $11,700, and Baseplan charges demob and the pickup leg before the work.'])
for i, w in enumerate([7, 6, 8, 10, 10, 10, 10, 10, 12, 10, 10, 14, 14, 10, 50]): lt.column_dimensions[col(i + 1)].width = w
for rw in lt.iter_rows(min_row=2, max_row=lt.max_row):
    for c in rw:
        if isinstance(c.value, float): c.number_format = '#,##0.00'
lt.freeze_panes = 'D2'
out = HERE / 'GC500_9961976_Generators_DayByDay_22Oct2026.xlsx'; wb.save(out)
print('labour/transport', {k: round(v, 2) for k, v in T2.items()})
print('written', out.name, {k: round(v, 2) for k, v in G.items()})
