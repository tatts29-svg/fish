"""Author: Andrew Fisher. The building-by-building list for the branch (9968862), from the review workbook's buildings sheet.
    python3 -I build_branch_list.py        (after build_review.py)
"""
import openpyxl, re
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
HERE = Path(__file__).resolve().parent
src = openpyxl.load_workbook(HERE / 'GC500_Baseplan_vs_Record_22Oct2026.xlsx')['9968862 buildings']
rows = list(src.iter_rows(min_row=2, values_only=True))
R = {'install': 145.74, 'levelling': 52.05, 'cleaning': 104.10, 'fire': 52.05, 'steps': 156.15, 'demob': 145.74}
# Andrew, 22 Oct 2026: AA and HRP are tracked only - each customer pays for its building on its own contract; nothing is charged on 9968862
OWN = {'AA': 'HS 9968926 (Active Air)', 'HRP': 'HS 9974238 (Hire Republic)'}
wb = Workbook(); ws = wb.active; ws.title = '9968862 buildings'
ws.append(['Ref', 'Building', 'Site asset no', 'Baseplan line', 'Baseplan asset', 'Baseplan label', 'Hire rate on line', 'Install', 'Levelling', 'Cleaning', 'Fire extinguisher', 'Steps', 'Labour billable now', 'Demob (at demob)', 'Transport each way', 'Delivery leg (done)', 'Return leg (at demob)', 'Fix needed on Baseplan'])
for c in ws[1]: c.font = Font(bold=True)
tot = {'now': 0, 'demob': 0, 'del': 0, 'ret': 0, 'n': 0, 'steps': 0, 'own': 0}
for r in sorted(rows, key=lambda r: (r[0][0], int(re.sub(r'\D', '', r[0]) or 0), r[0])):
    ref, bld, site, label, line, asset, rate = r[0], r[1], r[2], r[3], r[4], r[5], r[6]
    big = bool(re.search(r'12m|9\.6m', bld)); leg = 800 if big else 500
    steps = r[10] == 'yes'
    now = R['install'] + R['levelling'] + R['cleaning'] + R['fire'] + (R['steps'] if steps else 0)
    fix = ''
    if ref in OWN:
        fix = f'tracked only - paid on the customer\'s own contract {OWN[ref]}; no charge on 9968862' + (f' - line {line} comes off this contract' if line != '-' else ' - right that it has no line')
        ws.append([ref, bld, site, line if line != '-' else '', asset if asset != '-' else '', label if label not in ('-',) and not label.startswith('line under') else '', rate if rate != '-' else '', 'no charge', 'no charge', 'no charge', 'no charge', 'no charge', 0, 0, '', 0, 0, fix]); tot['own'] += 1; continue
    if line == '-': fix = 'no hire line - add'
    elif label.startswith('line under'): fix = f'line has asset {asset} - site number is {site}'
    elif label not in ('-', ref): fix = f'line labelled {label} - relabel {ref}'
    bp_label = ref if (label == '-' or label.startswith('line under')) else label
    ws.append([ref, bld, site, line if line != '-' else '', asset if asset != '-' else '', bp_label if line != '-' else '', rate if rate != '-' else '', 'yes', 'yes', 'yes', 'yes', 'yes' if steps else 'no', round(now, 2), R['demob'], leg, leg, leg, fix])
    tot['now'] += now; tot['demob'] += R['demob']; tot['del'] += leg; tot['ret'] += leg; tot['n'] += 1; tot['steps'] += steps
ws.append([])
ws.append(['TOTAL', f"{tot['n']} buildings charged", '', '', '', '', '', tot['n'], tot['n'], tot['n'], tot['n'], tot['steps'], round(tot['now'], 2), round(tot['demob'], 2), '', tot['del'], tot['ret'], f"{tot['own']} tracked only (AA, HRP), not charged on 9968862"])
for c in ws[ws.max_row]: c.font = Font(bold=True)
for i, w in enumerate([7, 16, 13, 9, 12, 12, 10, 7, 9, 8, 10, 6, 12, 11, 10, 11, 11, 46]): ws.column_dimensions[openpyxl.utils.get_column_letter(i + 1)].width = w
fill = PatternFill('solid', fgColor='F8CBAD')
for row in ws.iter_rows(min_row=2, max_row=ws.max_row - 2):
    if row[17].value:
        for c in row: c.fill = fill
ws.freeze_panes = 'A2'
n = wb.create_sheet('Notes')
for line in ['Author: Andrew Fisher. 22 Oct 2026. Site record is the source for every number.',
             'Rates: 2026 card, ex GST and damage waiver. Install $145.74, levelling $52.05, cleaning $104.10, fire extinguisher $52.05, steps $156.15, demob $145.74 per building.',
             'Transport: $500 each way up to 6 m, $800 each way for 9.6 m and 12 m. Delivery legs are done; return legs are billed at demob.',
             'Labour billable now = install + levelling + cleaning + fire extinguisher, plus steps where fitted. Demob is billed when it happens.',
             'Rows shaded red need a Baseplan fix (named in the last column). Site asset numbers stand.',
             'AA (Active Air) and HRP (Hire Republic) are on site and tracked, but each customer pays for its building on its own contract (HS 9968926, HS 9974238): no hire, labour, steps, transport or demob is charged on 9968862. Line 93 (1189410) comes off this contract.']: n.append([line])
n.column_dimensions['A'].width = 140
wb.save(HERE / 'GC500_9968862_Buildings_for_Branch_22Oct2026.xlsx')
print(tot, 'fixes', sum(1 for row in ws.iter_rows(min_row=2, max_row=ws.max_row - 2) if row[17].value))
