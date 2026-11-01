"""Author: Andrew Fisher. GC500 October month-end: every cost by supplier and month with its PO and invoice or receipt numbers and what to
accrue; labour by month and branch to 13 Nov; the 18 invoices to the V8s, and their hire by month. Read only, from the live record (12727),
the invoices and the POs, 31 Oct 2026. Writes an HTML page and a CSV.

    python3 -I build_monthend.py <out_dir>
"""
import csv, html, json, re, sys, datetime as dt, collections
from pathlib import Path
P = Path('/tmp/gc500-scratch/progress'); P2 = Path('/tmp/gc500-scratch/progress12727'); OUT = Path(sys.argv[1])   # P: captures on 12640; P2: on 12727 (v1.12–v1.13; 12715 for v1.10-v1.11, 12685 for v1.9)
SP = Path('/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad')
r2 = lambda x: round(x + 1e-9, 2)
hd = lambda x: ('{:,.2f}'.format(x)).rstrip('0').rstrip('.')   # hours as the source has them (133.78, 2,304.78, 36)
m = lambda x: '' if x is None else (('−' if x < -0.004 else '') + '{:,.2f}'.format(abs(x)) if abs(x) > 0.004 else '—')
e = html.escape
MO = ['Sep', 'Oct', 'Nov']

# ---------------- costs by supplier and month (management view, job end; the P&L's 544,097.23 + 750.00 November forecast)
C = []   # (supplier, branch, account, what, po, invoice/receipt, Sep, Oct, Nov, accrue_oct, basis, status)
def add(*a): C.append(a)
add('Advanced Temporary Fencing', 'STPS', '2126 · 2142', 'Fencing weeks 6–1 (9 Sep–16 Oct) and a partial collection',
    '4647508 · 4647509 · 4647515 · 4647517 · 4647519 · 4647520 · 4658850', 'receipts 4918492 · 4922398 · 4929277 · 4926209 · 4936461 · 4934877 · 4922343 (Advanced inv GC220926, 93920)',
    99664.50, 114560.50, 0, 0, 'by the date on each docket, note and sheet line', 'receipted (the seven receipts; Advanced’s invoices on the record: GC220926 and 93920)')
add('Advanced Temporary Fencing', 'STPS', '2126 41,193.70 · 2142 37,991.00', 'Event week 19–25 Oct (48 dockets, 11 notes, race crew 210.5 h) and demob week 1 26–29 Oct (8 dockets, 7 notes)',
    '4647522 (event week) · 4647523 (demob), both open', 'nothing invoiced on either yet', 0, 79184.70, 0, 79184.70, 'our dockets and notes at Advanced’s rates', 'ACCRUE')
add('Advanced Temporary Fencing', 'STPS', '2126', 'Demob week 2 (forecast; no papers yet)', '4647523 (demob), open', 'not invoiced', 0, 0, 750.00, 0, 'the page’s forecast', 'November forecast')
EP_SVC = 41772.00; EP_HIRE = r2(101747.00 - EP_SVC)   # the page's servicing at the counted quantities (702 FWF, 18 tanks, 51 block cleans) -> 3325; the rest -> 2126
add('Event Portables', 'KINP', '2126 %s · 3325 %s' % ('{:,.2f}'.format(EP_HIRE), '{:,.2f}'.format(EP_SVC)), 'Toilet hire Q6845, servicing Q6844 (event nights 23–25 Oct), pit lane Q6847 (22 Oct), water deliveries and a 3,000 L drinking-water tank Q6846 (14 Sep–25 Oct, quoted 4,850.00)',
    'none on the record', 'no invoice on the record', 1963.10, 99783.90, 0, 101747.00,
    'Q6846 by its days (17 of 42 in September); the rest is event hire and servicing in October', 'ACCRUE (September’s part as a catch-up)')
# Premiair (PRE808) and Royal Wolf (ROY002), v1.9: the sub-hire cost lines in Coates' system (the suppliers export, 1 Nov 2026), days charged x the
# daily cost rate. 9961265: eight boards at 36.25 a day (VMS24 26.00, NVAC). VMS11 (467T) is billed on 10001927 L1 with no cost line: estimated at
# Premiair's 36.25 a day x 7 days (16 Oct 09:00 to 22 Oct 14:00, whole days up as the system charges). 9974042 L2: 32 days at 42.63.
from openpyxl import load_workbook as _lw
_sx = _lw(P2 / 'suppliers.xlsx', read_only=True, data_only=True)
def _subl(sheet):
    rr = list(_sx[sheet].iter_rows(values_only=True)); hh = rr[0]
    return [dict(zip(hh, x)) for x in rr[1:] if x and x[0]]
PSUB, RSUB = _subl('9961265'), _subl('9974042')
PREM_BR = collections.defaultdict(float)
for x_ in PSUB:
    assert abs(x_['Days Charged'] * x_['Daily Cost Rate'] - x_['GST Excl Price']) < 0.005 and x_['Account Code'] == 2126, x_
    PREM_BR[x_['Minor Code']] += x_['GST Excl Price']
PREM_SYS = r2(sum(PREM_BR.values())); PREM_V11 = r2(7 * 36.25); PREM_BR['KINP'] += PREM_V11
PREM_BR = {k: r2(v) for k, v in PREM_BR.items()}; PREM_TOT = r2(sum(PREM_BR.values()))
assert (len(PSUB), PREM_SYS, PREM_V11, PREM_TOT, PREM_BR['KINP'], PREM_BR['NVAC']) == (8, 2268.75, 253.75, 2522.50, 2392.50, 130.00), (PREM_SYS, PREM_BR)
RW = r2(sum(x_['GST Excl Price'] for x_ in RSUB)); assert RW == 1364.23 and RSUB[0]['Days Charged'] == 32 and RSUB[0]['Minor Code'] == 'STPS', RSUB
add('Premiair Services', 'KINP cost (VMS24 NVAC) · STPS revenue', '2126', 'Sub-hired VMS boards: eight on 9961265 at their cost lines in the system (36.25 a day; VMS24 26.00), %s; VMS11 on 10001927, no cost line, 7 days at 36.25 (estimate)' % m(PREM_SYS), 'none on the record', 'no invoice yet',
    0, PREM_TOT, 0, PREM_TOT, 'the system’s cost lines: days charged × daily cost rate (8–27 Oct), all in October', 'ACCRUE (cost lines; VMS11 estimate)')
add('United Rentals (Royal Wolf)', 'STPS cost · KINP revenue', '2126', 'Refrigerated container, 9974042 line 2: its cost line in the system, 1,364.23 for 32 days charged from 28 Sep (the line shows a daily rate of 42.63, rounded; 32 × 42.63 is 1,364.16)', 'none on the record', 'no invoice on the record',
    0, RW, 0, RW, 'the system’s cost line (28 Sep–29 Oct; the docket has it delivered 13 Oct)', 'ACCRUE')
# every transport row by its own date on the schedule (Codex audit F03): the recorded figures, the forecasts on loads with no figure, and the planned loads, each once
TR = collections.defaultdict(float)
for t_ in json.load(open(P / 'dated_costs.json'))['transport']:
    mo_ = {'2026-09': 'Sep', '2026-10': 'Oct', '2026-11': 'Nov'}[(t_['d'] or '')[:7]]
    TR[('rec', mo_)] += t_.get('actual') or 0; TR[('plan' if t_.get('planned') else 'fc', mo_)] += t_.get('f') or 0
TR = {k: r2(v) for k, v in TR.items()}
assert abs(sum(v for k, v in TR.items() if k[0] == 'rec') - 33150.09) < 0.005 and abs(sum(v for k, v in TR.items() if k[0] != 'rec') - 23660.56) < 0.005, TR
# v1.13: Schedule 17 (Andrew, 1 Nov 2026: "double check this for any transports costs in here we may of missed") checked against the record's loads.
# 72 rows carry a figure (35,186.85): 57 tie to the cent, 3 carry the same money on another docket, and 12 change the costs. Each change is one
# Schedule 17 row, with its docket and hire contract (private: sched17_transport.json); audit_pack.py works the 12 out again from the workbook.
S17 = json.load(open(P2 / 'sched17_transport.json')); S17C = S17['changes']
assert len(S17C) == 12 and abs(sum(c['amount'] for c in S17C) - 4340.00) < 0.005 and abs(sum(c.get('was') or 0 for c in S17C) - 2513.61) < 0.005, S17C
_MO = lambda d_: {'2026-09': 'Sep', '2026-10': 'Oct', '2026-11': 'Nov'}[d_[:7]]
_DCT = json.load(open(P / 'dated_costs.json'))['transport']
for c_ in S17C:
    TR[('rec', _MO(c_['date']))] = r2(TR.get(('rec', _MO(c_['date'])), 0) + c_['amount'])
    if c_['kind'] == 'forecast':   # the forecast it replaces is a load-with-no-figure row on the record, in the same month
        mt_ = c_['match']; hit_ = [t_ for t_ in _DCT if t_['key'] == mt_['key'] and t_['d'] == mt_['d'] and not t_.get('planned') and abs((t_.get('f') or 0) - c_['was']) < 0.005]
        assert len(hit_) == 1 and _MO(mt_['d']) == _MO(c_['date']), (c_['ref'], hit_)
        TR[('fc', _MO(c_['date']))] = r2(TR[('fc', _MO(c_['date']))] - c_['was'])
S17_ADD, S17_WAS = r2(sum(c_['amount'] for c_ in S17C)), r2(sum(c_.get('was') or 0 for c_ in S17C)); S17_NET = r2(S17_ADD - S17_WAS)
assert abs(sum(v for k, v in TR.items() if k[0] == 'rec') - 37490.09) < 0.005 and abs(sum(v for k, v in TR.items() if k[0] != 'rec') - 21146.95) < 0.005 and S17_NET == 1826.39, (TR, S17_NET)
add('Carriers (transport)', 'by load', '2120 · 2140', 'Loads to date: the figures on the schedule (the carriers’ minimums, such as “$290+”), not carrier invoices; checked against Schedule 17 (1 Nov), 12 loads corrected (section 2e)', 'none on the record', 'carrier invoices not on the record',
    TR.get(('rec', 'Sep'), 0), TR.get(('rec', 'Oct'), 0), TR.get(('rec', 'Nov'), 0), None, 'each load’s date on the schedule (the work date, not an invoice date)', 'recorded figure · check carrier invoices')
add('Carriers (transport)', 'by load', '2120 · 2140', 'Loads on the schedule with no figure recorded: forecast at the card rate where the page has one, else the average for the load', 'none on the record', 'not invoiced',
    TR.get(('fc', 'Sep'), 0), TR.get(('fc', 'Oct'), 0), TR.get(('fc', 'Nov'), 0), None, 'each load’s date on the schedule', 'forecast')
add('Carriers (transport)', 'by load', '2120 · 2140', 'Planned loads with no figure recorded yet (forecast, by the planned date)', 'none on the record', 'not invoiced', TR.get(('plan', 'Sep'), 0), TR.get(('plan', 'Oct'), 0), TR.get(('plan', 'Nov'), 0), None, 'planned dates', 'forecast')
JCPO = json.load(open(P2 / 'jc_pos.json'))['amounts']; ERIC_WK = json.load(open(P2 / 'jc_pos.json'))['eric_week']['amount']   # v1.16 (pos-11): Eric Lucian's week, kept with its source   # the amounts on the Job Connect invoices for these POs, given on 1 Nov 2026 (private)
assert JCPO == {'4665091': 2636.56, '4671825': 5244.91, '4670882': 6069.48}, JCPO
JCP = json.load(open(P2 / 'jc_pos.json'))['po_amounts']   # v1.10: Daniel Gough's POs for w/e 8 and 15 Nov, given on 1 Nov 2026 (private): PO amounts, not invoices
assert {k: (v['amount'], v['we'], v['who']) for k, v in JCP.items()} == {'4674224': (3052.60, '2026-11-08', 'Daniel Gough'), '4674225': (3052.60, '2026-11-15', 'Daniel Gough')}, JCP
JCS = json.load(open(P2 / 'jc_pos.json'))['supplier']   # v1.11: Job Connect's supplier in Coates' system, given on 1 Nov 2026 (private): its code and registered name
assert JCS.get('code') and JCS.get('name') and JCS.get('trading_as') == 'Job Connect', JCS
JC_LEGAL = ' '.join(w if '/' in w else w.capitalize() for w in JCS['name'].split()) + ', supplier ' + JCS['code']
JC_NAME = 'Job Connect (labour hire; ' + JC_LEGAL + ')'
JC = [('w/e 20 Sep', '4657010', 'invoice 3,023.70 (the running sheet says 3,023.85)', 3023.70, 'Sep', 0), ('w/e 27 Sep', '4660565', 'GC500 share 1,299.74', 1299.74, 'Sep', 0),
      ('w/e 4 Oct', '4661783', 'invoice 15294, 3,052.60 (the running sheet says 3,230.60)', 3052.60, 'Sep/Oct', 0), ('w/e 11 Oct', '4665091', 'invoice 2,636.56 (the running sheet says 2,539.92)', JCPO['4665091'], 'Oct', 0),
      ('w/e 18 Oct', '4667755 · 4668970', 'PO amounts to confirm on both, so the week stays at the running sheet', 6198.75, 'Oct', 6198.75), ('w/e 25 Oct', '4670882 · 4671825', 'invoices 6,069.48 and 5,244.91 (the running sheet says 11,774.71)', r2(JCPO['4670882'] + JCPO['4671825']), 'Oct', 0),
      ('w/e 1 Nov', 'none yet', 'not invoiced', 3835.37, 'Oct', 3835.37),
      ('w/e 8 Nov', '4674224 (Daniel) · none yet (Kyle)', 'Daniel: PO 4674224, 3,052.60 (the running sheet says 3,174.90); Kyle: not invoiced', r2(JCP['4674224']['amount'] + 3023.85), 'Nov', 0),
      ('w/e 15 Nov', '4674225 (Daniel)', 'PO 4674225, 3,052.60 (the running sheet says 3,174.90)', JCP['4674225']['amount'], 'Nov', 0)]
for wk, po, inv, amt, mo, acc in JC:
    sep = r2(3052.60 * 1960.64 / 3230.60) if wk == 'w/e 4 Oct' else (amt if mo == 'Sep' else 0); octv = r2(3052.60 - r2(3052.60 * 1960.64 / 3230.60)) if wk == 'w/e 4 Oct' else (amt if mo == 'Oct' else 0); nov = amt if mo == 'Nov' else 0
    add(JC_NAME, 'KINP', 'Installs (as coded)', 'Running sheet ' + wk, po, inv, sep, octv, nov, acc if acc else 0,
        ('the invoice; split across the months by the running sheet’s days' if wk == 'w/e 4 Oct' else 'the invoice' if wk in ('w/e 20 Sep', 'w/e 27 Sep', 'w/e 11 Oct', 'w/e 25 Oct')
         else 'Daniel at his PO amount; Kyle at the running sheet’s paid hours at the record’s rates (3,023.85; estimate until invoiced)' if wk == 'w/e 8 Nov'
         else 'the PO amount (estimate until invoiced)' if wk == 'w/e 15 Nov' else 'the running sheet’s paid hours at the record’s rates (estimate until invoiced)'),
        'ACCRUE (estimate)' if acc else ('invoiced' if mo != 'Nov' else 'November (estimate)'))
JC_TOT = r2(sum(x[3] for x in JC)); JC_ACC = r2(sum(x[5] for x in JC)); assert (JC_TOT, JC_ACC) == (40490.16, 10034.12), (JC_TOT, JC_ACC)   # v1.10: + Daniel's POs 4674224 and 4674225 (2 × 3,052.60), November
add('Accommodation (tracker)', 'KINP', '3520', '97 nights on the tracker (all but Ludwig Chee’s three event nights and Alfie Harris’s five below)', 'none', 'on the tracker', 6370.36, r2(11851.89 - 655.71), 3801.71, None, 'the night’s date', 'check how they were paid')
add('Accommodation (tracker)', 'NVAC', '3520', 'Ludwig Chee: 3 event nights, 23–25 Oct, at 218.57 (with his hours on NVAC)', 'none', 'on the tracker', 0, 655.71, 0, None, 'the night’s date', 'check how they were paid')
ALF_RATE = 223.63   # Alfie Harris's nightly rate on the tracker for 26–29 Oct and 2–5 Nov (his latest priced nights)
ALF_OCT = r2(1 * ALF_RATE); ALF_NOV = r2(4 * ALF_RATE); ALF_TOT = r2(ALF_OCT + ALF_NOV)   # 1 night in October (5 Oct), 4 in November (9–12 Nov); 12–15 Oct off the record 1 Nov (12727)
assert (ALF_OCT, ALF_NOV, ALF_TOT) == (223.63, 894.52, 1118.15), (ALF_OCT, ALF_NOV)
ACCOM = r2(22023.96 + ALF_TOT)   # the 100 other nights + Alfie's 5 = the record's 105 accommodation lines on 12727
assert ACCOM == 23142.11, ACCOM
add('Accommodation (tracker)', 'KINP', '3520', 'Alfie Harris: 5 nights at 223.63 a night, his rate on the tracker for 26–29 Oct and 2–5 Nov (on the record from 1 Nov): 1 in October (5 Oct) and 4 in November (9–12 Nov); his 12–15 and 23–25 Oct nights were taken off the record on 1 Nov (he did not work then)', 'none', 'invoice to come',
    0, ALF_OCT, ALF_NOV, ALF_OCT, 'each night’s date at 223.63', 'ACCRUE the October nights · November forecast')
add('Meals and expenses (tracker)', 'KINP', '3520 · 3501', 'Meals, expenses and equipment R&M, to 31 Oct', 'none', 'on the tracker', 2621.53, 2642.79, 0, None, 'the date on each line', 'recorded on the tracker (paid not evidenced)')
add('Meals and expenses (tracker)', 'KINP', '3520 · 3501', 'Alfie Harris’s meals away from home, 2–5 Nov (4 × 100.00), recorded ahead of the dates', 'none', 'on the tracker', 0, 0, 400.00, None, 'the date on each line', 'November forecast (recorded ahead)')
SALH = collections.defaultdict(float)
for r_ in csv.reader(open(SP / 'GC500_labour_by_month_and_branch.csv', encoding='utf-8-sig')):
    if r_ and r_[0][:4] == '2026' and r_[3] == 'Salary' and '2026-09-14' <= r_[0] <= '2026-11-13': SALH[{'09': 'Sep', '10': 'Oct', '11': 'Nov'}[r_[0][5:7]]] += float(r_[4] or 0)
SAL = {k: r2(v) for k, v in zip(('Sep', 'Oct', 'Nov'), [14700.0 * SALH[k] / sum(SALH.values()) for k in ('Sep', 'Oct', 'Nov')])}
SAL['Nov'] = r2(14700.0 - SAL['Sep'] - SAL['Oct'])
assert dict(SALH) == {'Sep': 143.0, 'Oct': 256.0, 'Nov': 110.0} and (SAL['Sep'], SAL['Oct'], SAL['Nov']) == (4129.86, 7393.32, 3176.82), (SALH, SAL)
add('Salary allowance', 'KINP', '3210', 'Salary allowance (forecast, job end): the record’s window 14 Sep–13 Nov (labourAllowance858)', 'none', 'payroll', SAL['Sep'], SAL['Oct'], SAL['Nov'], None,
    'split by the salaried hours inside the window (143 · 256 · 110 h; the 55 h before 14 Sep are outside it)', 'allocated')
for po, sup, br, gl, what, d, amt in [('4655573', 'Bunnings', 'STPS', '201.STPS.2144.0', 'Star pickets', '18 Sep', 100.00), ('4663216', 'CCI Supplies', 'STPS', '201.STPS.2144.0', 'Cable ties', '7 Oct', 2538.64),
                                     ('4666720', 'BSF Mobile Cranes', 'KINP', '201.KINP.2144.0', 'Building unloads (completed order)', '15 Oct', 2896.00), ('4670270', 'Event Elec', 'NVAC', '201.NVAC.2144.0', 'Concert generator sync (completed order)', '23 Oct', 579.68),
                                     ('4670876', 'Bunnings', 'KINP', '201.KINP.2144.0', 'Hand soap', '24 Oct', 180.00), ('4669481', 'Bunnings', 'NVAC', '201.NVAC.2150.0', 'Siphon hose (completed order)', '26 Oct', 42.33)]:   # v1.13: 2 × 21.1650 in Coates' system (the printed PO rounds the unit cost to 21.17)
    _ps = json.load(open(P2 / 'po_system.json'))['pos'][po]   # v1.16 (elite check pos-03): its status in Coates' system, 1 Nov
    add(sup, br, gl, what, po, 'PO ' + d, amt if 'Sep' in d else 0, 0 if 'Sep' in d else amt, 0, None, 'the PO date',
        'invoiced (completed in Coates’ system)' if _ps['fully_invoiced'] else 'received in full, not invoiced: check invoice' if _ps['fully_received'] else 'nothing received yet: check invoice')
# v1.14: the two forklift POs in the hire notes on 9961976 are a cost to Coates (Andrew, 1 Nov 2026: "these are a cost to Coates"); their lines on 9961976 (L31, L34) are own use at 0.00.
# Ex GST = qty x unit cost, from the screenshots of Coates' system (private: forklift_pos.json); each on the branch it is raised on; 4647983's lines each in the month they mostly fall in, in turn from the hire start (9961976 L31, 11 Sep).
FPO = json.load(open(P2 / 'forklift_pos.json'))['pos']
assert [l['unit_cost'] for l in FPO['4647983']['lines']] == [900.00, 1320.00, 600.00] and FPO['4647983']['ex_gst'] == 2820.00 and FPO['4647983']['branch'] == 'STPS', FPO['4647983']
assert [l['unit_cost'] for l in FPO['4654789']['lines']] == [950.00] and FPO['4654789']['ex_gst'] == 950.00 and FPO['4654789']['branch'] == 'MEAD' and FPO['4654789']['fully_invoiced'], FPO['4654789']
add('Queensland Forklifts', 'STPS', '2126', '5 t forklift re-hire (1.8 m tynes) for the fencing at Phillip Park, on 9961976 L31 at 0.00 (own use): 3 weeks 900.00 · 4 weeks 2 days 1,320.00 · 2 weeks 600.00', '4647983 (partly received)', 'PO 3 Sep; 900.00 received, nothing invoiced',
    900.00, 1320.00, 600.00, None, 'months estimated: the PO’s three approximate durations (3 weeks, 4 weeks 2 days, 2 weeks) taken in turn from the hire start on 9961976 L31 (11 Sep), each in the month it mostly falls in; they are not service dates, and the invoice will settle them', 'check invoice (estimate until invoiced; months estimated)')
add('Queensland Forklifts', 'MEAD', '2126', 'AT009 2.5 t RT forklift for Coates’ use, 17–18 Sep, on 9961976 L34 at 0.00 (own use)', '4654789 (completed)', 'PO 17 Sep; received and invoiced', 950.00, 0, 0, None, 'the hire dates', 'invoiced')
FORK_PO = 3770.00
tot = [r2(sum(r[i] for r in C)) for i in (6, 7, 8)]
assert abs(sum(tot) - 552533.71) < 0.01, (tot, sum(tot))
assert (tot[0], tot[1], tot[2]) == (149435.00, 379590.09, 23508.62), tot   # v1.14: the forklift POs + 3,770.00 (September + 1,850.00, October + 1,320.00, November + 600.00)   # v1.13: Schedule 17 + 1,826.39 (September + 570.00, October + 1,256.39); PO 4669481 − 0.01   # v1.12: October − 894.52 (Alfie's 12–15 Oct nights off)   # v1.10: November + 6,105.20 (Daniel's two POs)   # Codex's bridge after F03, F04 and the F05 window   # the P&L's job costs (with the 750.00 November fencing forecast), at Job Connect's invoices and without Premiair line 15
acc_total = r2(sum(r[9] for r in C if r[9]))

# ---------------- labour by month and branch (the running sheet, to 13 Nov)
rows = list(csv.reader(open(SP / 'GC500_labour_by_month_and_branch.csv', encoding='utf-8-sig')))
L = collections.defaultdict(float); LH = collections.defaultdict(float)
mon = {'September': 'Sep', 'October': 'Oct', 'November (forecast)': 'Nov'}
for r in rows[2:]:
    if not (r and r[0][:4] == '2026'): continue
    mo = mon.get(r[1]);  typ = r[3]
    for seg in re.split(r', | · ', r[6]):
        g = re.match(r'^(KINP|STPS|NVAC|MEAD) ([\d.]+) h$', seg.strip())
        if g: L[(typ, g.group(1), mo)] += float(g.group(2))
    if typ == 'Labour hire':
        try: LH[mo] += float(r[5])
        except ValueError: pass
assert abs(sum(LH.values()) - 41276.59) < 0.01   # v1.10: + Daniel's 10 days to 13 Nov on the running sheet (6,349.80)
HOME = {'Aaron Zelvis': ('KINP', 'Coates wages'), 'Alfie Harris': ('NTSP', 'Coates wages'), 'Andrew Fisher': ('NOIS', 'Salary'), 'Jayden Paul': ('KINP', 'Coates wages'),
        'Wayne Crimmin': ('STPS', 'Coates wages'), 'Frank Devilles': ('BFIS', 'Coates wages · event weekend mechanic / electrician, charged to NVAC 9961976; pay basis not on the record'),
        'Ludwig Chee': ('NSNA', 'Coates wages · event weekend mechanic / electrician, charged to NVAC 9961976; pay basis not on the record'), 'Daniel Gough': ('KINP', 'Labour hire, Job Connect, 55.70 an hour'),
        'Kyle Gover': ('KINP', 'Labour hire, Job Connect, 53.05 an hour'), 'Eric Lucian': ('NOIS', 'Labour hire, 55.70 an hour; the record: home branch NOIS, charge branch KINP')}
PH = collections.defaultdict(float); PC = collections.defaultdict(float)
for r in rows[2:]:
    if not (r and r[0][:4] == '2026'): continue
    who, mo, h = r[2], mon.get(r[1]), float(r[4] or 0)
    cost = float(r[5]) if r[3] == 'Labour hire' and r[5] not in ('', 'hours only') else 0.0
    for seg in re.split(r', | · ', r[6]):
        g = re.match(r'^(KINP|STPS|NVAC|MEAD) ([\d.]+) h$', seg.strip())
        if g:
            PH[(who, mo, g.group(1))] += float(g.group(2))
            if cost and h: PC[(who, mo, g.group(1))] += cost * float(g.group(2)) / h
assert set(p for p, _, _ in PH) <= set(HOME), set(p for p, _, _ in PH) - set(HOME)
assert abs(sum(PC.values()) - 41276.59) < 0.01
LHB = collections.defaultdict(float)   # labour hire cost by receiving branch and month, the running sheet's basis (the P&L carries Job Connect's invoices where received)
for (who_, mo_, b_), v_ in PC.items():
    if HOME[who_][1].startswith('Labour hire'): LHB[(b_, mo_)] += v_
assert abs(sum(LHB.values()) - sum(LH.values())) < 0.01
CON = collections.defaultdict(float); CONP = collections.defaultdict(float)
CLABEL = {'9961976': ('NVAC', 'generators; the event weekend’s mechanic and electrician', 'the generators named on the running sheet notes; the event weekend’s mechanic and electrician by their role (72 h)'), '9972648': ('STPS', 'water barriers', 'named on the note'),
          'KINP': ('KINP', 'everything else: buildings, toilets, the concert, site days', 'KINP (no contract number)')}
KINP_CON = {'9968862', '9968955', '9994954', '9968929', 'none'}
for r in rows[2:]:
    if not (r and r[0][:4] == '2026'): continue
    who, mo = r[2], mon.get(r[1]); segs = [x.strip() for x in r[8].split(' · ')]
    brh = {g.group(1): float(g.group(2)) for g in (re.match(r'^(KINP|STPS|NVAC|MEAD) ([\d.]+) h$', x.strip()) for x in re.split(r', | · ', r[6])) if g}
    named_kinp = 0.0
    for i, x in enumerate(segs):
        g = re.match(r'^(Generators|Water barriers) (\d{7,8}) (KINP|STPS|NVAC|MEAD)$', x)
        if g and i + 1 < len(segs):
            hh = re.match(r'^([\d.]+) h$', segs[i + 1])
            if hh:
                ck = 'KINP' if g.group(3) == 'KINP' else g.group(2)
                CON[(ck, mo)] += float(hh.group(1)); CONP[(who, ck, mo)] += float(hh.group(1))
                if g.group(3) == 'KINP': named_kinp += float(hh.group(1))
    if r[7].startswith('NVAC by role'):   # the event weekend's mechanic and electrician (31 Oct): their NVAC hours are on 9961976
        CON[('9961976', mo)] += brh.get('NVAC', 0); CONP[(who, '9961976', mo)] += brh.get('NVAC', 0)
    rest = brh.get('KINP', 0) - named_kinp
    cs = collections.Counter()
    for x in segs:
        g = re.match(r'^(\d{7,8}) (in|out)[^:]*: (.+)$', x)
        if g: cs[g.group(1)] += len([y for y in g.group(3).split(',') if y.strip()])
    if rest > 1e-9:
        if cs:
            t_ = sum(cs.values())
            for c_, n_ in cs.items(): CON[('KINP', mo)] += rest * n_ / t_; CONP[(who, 'KINP', mo)] += rest * n_ / t_
        else: CON[('KINP', mo)] += rest; CONP[(who, 'KINP', mo)] += rest
# Andrew, 29 Oct: "So labour costs for nvac for my mechanic and electrician should this go to nvac over event ?" (answered yes: NVAC bills the
# Event Gen Tech); 31 Oct, asked which roles Frank and Ludwig did over the event weekend: "Mechanic and electrician." Both sets of hours go to NVAC.
ROLE_MOVE = {'Frank Devilles': ('NVAC', '9961976'), 'Ludwig Chee': ('NVAC', '9961976')}
for who_, (br_, con_) in ROLE_MOVE.items():
    for mo_ in MO:
        h_ = PH.pop((who_, mo_, 'KINP'), 0)
        if h_:
            PH[(who_, mo_, br_)] += h_; L[('Coates wages', 'KINP', mo_)] -= h_; L[('Coates wages', br_, mo_)] += h_
        hc_ = CONP.pop((who_, 'KINP', mo_), 0)
        if hc_:
            CONP[(who_, con_, mo_)] += hc_; CON[('KINP', mo_)] -= hc_; CON[(con_, mo_)] += hc_
assert not any(PH.get((w_, k_, 'KINP')) for w_ in ROLE_MOVE for k_ in MO), 'the event pair still has KINP hours'
assert abs(sum(CON.values()) - sum(PH.values())) < 0.01 and set(c for c, _ in CON) <= set(CLABEL), set(c for c, _ in CON) - set(CLABEL)
assert abs(sum(CON.get(('9961976', k), 0) for k in MO) - 108) < 0.01, 'NVAC contract hours: the generators 36 + the event pair 72'

# ---------------- revenue: the 18 invoices to the V8s, and the hire on their dated lines by month
inv = json.load(open(P / 'invoices.json'))
BR_FIX = {'25120652': 'STPS', '25120689': 'STPS'}   # Codex audit F02: header "Branch Staplyton (S)", Sales Analysis Code STPS-CON
CUST = {}   # every invoice left is to the V8s
for i_ in inv:
    if i_['invoice'] in BR_FIX: i_['bp_branch'] = BR_FIX[i_['invoice']]
# Andrew, 1 Nov: "Good pick up.. remove Invoice 25124396 please." It is invoiced to Gold Coast Helitours (CASH-STPS), not the V8s; no cost on the record ties to it
REMOVED = [i_ for i_ in inv if i_['invoice'] == '25124396']
inv = [i_ for i_ in inv if i_['invoice'] != '25124396']
assert len(REMOVED) == 1 and abs(REMOVED[0]['ex_gst'] - 1974.05) < 0.005 and len(inv) == 18
def parse(s): return dt.datetime.strptime(s, '%d/%m/%Y %H:%M')
def split(a, b):
    out = {'Sep': 0.0, 'Oct': 0.0, 'Nov': 0.0}; tot_h = (b - a).total_seconds()
    if tot_h <= 0: out['Oct'] = 1.0; return out
    for mo, (s, t) in {'Sep': (dt.datetime(2026, 9, 1), dt.datetime(2026, 10, 1)), 'Oct': (dt.datetime(2026, 10, 1), dt.datetime(2026, 11, 1)), 'Nov': (dt.datetime(2026, 11, 1), dt.datetime(2026, 12, 1))}.items():
        ov = (min(b, t) - max(a, s)).total_seconds()
        if ov > 0: out[mo] = ov / tot_h
    return out
def cents(raw, total):   # split total (to the cent) in proportion to raw; the leftover cents go to the largest remainders, once
    tc = int(round(total * 100)); s_ = sum(raw.values())
    if tc == 0: return {k: 0.0 for k in raw}
    exact = {k: (raw[k] / s_ * tc if s_ else (tc if k == 'Oct' else 0)) for k in raw}
    base = {k: int(exact[k] // 1) for k in raw}; left = tc - sum(base.values())
    for k in sorted(raw, key=lambda k: -(exact[k] - base[k]))[:left]: base[k] += 1
    return {k: base[k] / 100 for k in raw}
REV = []
for i in sorted(inv, key=lambda i: (i.get('bp_branch') or '', i['invoice'])):
    hire = {'Sep': 0.0, 'Oct': 0.0, 'Nov': 0.0}; undated = 0.0; hire_tot = 0.0
    for l in i['lines']:
        amt = l['line_total'] or 0
        if l.get('from') and l.get('to'):
            sp = split(parse(l['from']), parse(l['to']))
            for k in hire: hire[k] += amt * sp[k]
            hire_tot += amt
        else: undated += amt
    w = (i.get('waiver') or 0); env = r2((i.get('ex_gst') or 0) - sum((l['line_total'] or 0) for l in i['lines']) - w)
    ws = {k: (w * hire[k] / hire_tot if hire_tot else (w if k == 'Oct' else 0)) for k in hire}
    # one model for every output (Codex, code review of v1.2): the services stay as sourced (the undated lines, plus any remainder the line
    # parser missed); the hire lines and their waiver are split across the months by days on hire, and the cents are reconciled once
    ex_ = i.get('ex_gst') or 0; svc = r2(undated + env); hw = r2(ex_ - svc)
    mm = cents({k: hire[k] + ws[k] for k in MO}, hw)
    assert abs(sum(mm.values()) + svc - ex_) < 0.005, (i['invoice'], mm, svc, ex_)
    REV.append({'inv': i['invoice'], 'date': i['date'], 'contract': i['contract'], 'branch': i.get('bp_branch'), 'ex': ex_, 'waiver': w, 'm': mm, 'svc': svc, 'cust': CUST.get(i['invoice'], 'V8 Supercars')})
assert abs(sum(r['ex'] for r in REV) - 1001063.07) < 0.005
RT = {k: r2(sum(r['m'][k] for r in REV)) for k in MO}
UND = r2(sum(r['svc'] for r in REV))
assert abs(sum(RT.values()) + UND - 1001063.07) < 0.005, (RT, UND)

# ---------------- where things match up (Andrew, 31 Oct: "We need to make sire we mention hire contract nos.and p/o numbers so we know where
#                  things maych up"): each cost's PO, and the hire contract and V8s invoice it's charged on, from the record, the invoices and Baseplan (12).
#                  Where nothing ties a cost to one contract, it says so; nothing is guessed.
INV_OF = {i['contract']: i['invoice'] for i in inv}; BR_OF = {i['contract']: i.get('bp_branch') for i in inv}; EX_OF = {i['contract']: i.get('ex_gst') or 0 for i in inv}
assert len(INV_OF) == 18
# v1.13: the V8s' order number on each hire contract (Andrew, 1 Nov 2026: each contract's header, "contract = PO"; private: contract_headers.json).
# Shown as keyed; the invoices print it as the order number (25123999 prints "P0 07.04").
CPO = {c: h['customer_po'] for c, h in json.load(open(P2 / 'contract_headers.json'))['contracts'].items()}
assert set(CPO) == set(INV_OF), (set(CPO) ^ set(INV_OF))
CPO_NOTE = {'9994954': 'as keyed, and printed on 25123999', '10000484': 'as keyed (no 0 after the P)'}
_cpo_n = collections.Counter(CPO.values())
def cpo(c, long=False):   # 'PO P028609', with a note where it is keyed oddly or shared
    s_ = 'PO ' + CPO[c]
    if long:
        ex_ = [CPO_NOTE[c]] if c in CPO_NOTE else []
        if _cpo_n[CPO[c]] > 1: ex_.append('also on ' + ', '.join(sorted(k for k, v in CPO.items() if v == CPO[c] and k != c)))
        if ex_: s_ += ' (' + '; '.join(ex_) + ')'
    return s_
def on(*cs): return ' · '.join('%s (inv %s)' % (c, INV_OF[c]) for c in cs)
def onit(i):   # what's on the contract: its biggest lines on the invoice (hire and sales); refs, transport, labour and recharges left out
    agg = collections.defaultdict(float); disp = {}
    for l in i['lines']:
        d = re.sub(r'\s{2,}', ' ', (l.get('desc') or '').strip())
        if not d or re.search(r'transport|waiver|install|labour|accom|delivery|pick ?up|site shift', d, re.I): continue
        d = re.sub(r'\s*[-(]\s*(for|per)?\s*$', '', d); d = re.sub(r'\s+x$', '', d)
        for _ in range(2): d = re.sub(r'^(?:(?:CP|P|WC|GN|WB|VMS|FR|LT)\d+[A-Z]?|\d+T)\s+', '', d)
        d = re.sub(r'\s*[&-]\s*$', '', d); d = re.sub(r'\bWith Operator$', 'With Operator Protection', d); k_ = d.lower()   # v1.16 (revenue-07): the invoice wraps the description after "Operator"
        agg[k_] += l.get('line_total') or 0; disp.setdefault(k_, d)
    out = []
    for k_, _ in sorted(agg.items(), key=lambda kv: -kv[1]):
        if any(o.lower().startswith(k_) or k_.startswith(o.lower()) for o in out): continue
        out.append(disp[k_])
        if len(out) == 3: break
    return ', '.join(out) or '—'
ONIT = {i['contract']: onit(i) for i in inv}
_bp = json.load(open(P / 'bp12.json')); _dd2c = {str(r['Delivery Docket']): str(r['Hire Agreement']) for r in _bp['Delivery Dockets']}
TL = json.load(open(P2 / 'transport_loads.json'))['loads']
_tamt = lambda l: (l['actual'] or 0) if l['actual'] else (l['f'] or 0)
assert abs(sum(_tamt(l) for l in TL) - 56810.65) < 0.005   # the record's loads before Schedule 17: 33,150.09 recorded + 23,660.56 forecast
for c_ in S17C:   # v1.13: Schedule 17's figure on each load it changes, on the branch whose equipment it moves
    if c_['kind'] == 'missing':
        assert not [l for l in TL if set(re.findall(r'\b2\d{7}\b', c_['dd'])) & set(re.findall(r'\b2\d{7}\b', l['dd'] or ''))], c_['ref']
        TL.append({'key': c_['ref'], 'd': c_['date'], 'b': c_['branch'], 'src': 'schedule17', 'item': c_['item'], 'discipline': c_['discipline'], 'movement': 'place',
                   'location': None, 'actual': c_['amount'], 'f': None, 'fkind': 'schedule17', 'planned': False, 'dd': c_['dd']})
        continue
    mt_ = c_['match']; hit_ = [l for l in TL if l['key'] == mt_['key'] and l['d'] == mt_['d'] and l['planned'] == mt_['planned'] and (not mt_.get('item') or l['item'] == mt_['item'])]
    assert len(hit_) == 1 and not hit_[0]['actual'], (c_['ref'], hit_)
    l_ = hit_[0]; assert (c_['kind'] == 'forecast' and abs((l_['f'] or 0) - c_['was']) < 0.005) or (c_['kind'] == 'priced' and not l_['f']), (c_['ref'], l_)
    l_.update(actual=c_['amount'], f=None, fkind='schedule17', b=c_['branch'], dd=((l_['dd'] or '') + ' ' + c_['dd']).strip())
    if c_.get('was_branch') and c_['was_branch'] != c_['branch']: l_['moved'] = c_['was_branch']; l_['why'] = 'the concert generators’ delivery, from KINP'
# Andrew, 1 Nov 2026: "obviously you know where things belong to VMS and Generators and forlifts etc belong to their brances": generator
# transport on NVAC (the concert generators, GN26 above), forklift transport on MEAD. The three September forklift deliveries sit on 9961976
# (NVAC) on the record: their transport moves to MEAD. Their hire stays where it is invoiced.
FORK_MOVE = {('T0003', '2026-09-11'): 480.44, ('T0004', '2026-09-11'): 646.32, ('T0005', '2026-09-14'): 646.32}
for l in TL:
    if (l['key'], l['d']) in FORK_MOVE and not l['planned']:
        assert l['b'] == 'NVAC' and (l['discipline'] or '') == 'Access & plant' and abs(_tamt(l) - FORK_MOVE[(l['key'], l['d'])]) < 0.005, l
        l['b'] = 'MEAD'; l['moved'] = 'NVAC'; l['why'] = 'the September forklift deliveries on 9961976, from NVAC'
FORK_TOT = r2(sum(FORK_MOVE.values())); assert FORK_TOT == 1773.08 and sum(1 for l in TL if l.get('moved') == 'NVAC') == 3 and sum(1 for l in TL if l.get('moved') == 'KINP') == 1
assert abs(sum(_tamt(l) for l in TL) - 58637.04) < 0.005
ITEM_BR = [('Forklift', 'MEAD', 'the forklift pick-ups'), ('VMS', 'STPS', 'VMS moves'), ('100KVA TRAILER', 'NVAC', 'the 100 kVA generator trailer'),
           ('Building', 'KINP', 'buildings'), ('Event Container', 'KINP', 'the event container'), ('Fridge', 'KINP', 'a fridge')]
def _tbr(l):   # a load's branch: the branch on the record; else the fencing loads to STPS (fencing is STPS: Advanced's POs, 9990776); else by what it carries
    if l.get('why'): return l['b'], l['why']   # v1.13: moved to the branch whose equipment it carries (Andrew, 1 Nov)
    if l['b']: return l['b'], ''
    if l['src'] == 'fencing' or (l['discipline'] or '').lower() == 'fencing': return 'STPS', 'the fencing loads'
    for k_, b_, w_ in ITEM_BR:
        if (l['item'] or '').upper().startswith(k_.upper()): return b_, w_
    raise ValueError(('a load with no branch and no rule', l))
TBR = collections.defaultdict(float); TWHY = collections.defaultdict(float)
for l in TL:
    if _tamt(l): b_, w_ = _tbr(l); TBR[b_] += _tamt(l); TWHY[(b_, w_)] += _tamt(l)
TBR = {k: r2(v) for k, v in TBR.items()}; TWHY = {k: r2(v) for k, v in TWHY.items()}
assert TBR == {'KINP': 30755.57, 'STPS': 16847.21, 'NVAC': 6469.42, 'MEAD': 4564.84}, TBR   # v1.13 (v1.12: KINP 30,847.91 · STPS 16,457.65 · NVAC 7,102.89 · MEAD 2,402.20)
FENCE_REC = TWHY[('STPS', 'the fencing loads')]; assert FENCE_REC == 12095.01, FENCE_REC
def tnote(b):   # which loads with no branch on the record sit on this branch, and why; v1.13: and which moved here by what they carry
    ws = [w_ for (b2, w_), v_ in sorted(TWHY.items(), key=lambda kv: -kv[1]) if b2 == b and w_ and ', from ' not in w_]
    mv = ['%s %s' % (w_.replace(', from ', ', moved from '), m(v_)) for (b2, w_), v_ in sorted(TWHY.items(), key=lambda kv: -kv[1]) if b2 == b and ', from ' in w_]
    return (('; loads with no branch on the record: ' + ', '.join(ws)) if ws else '') + (('; ' + '; '.join(mv)) if mv else '')
FCT = {'fc': collections.defaultdict(float), 'plan': collections.defaultdict(float)}; FCN = collections.Counter(); FC_MISS = 0.0; FC_NONE = 0.0
for l in TL:
    if l['actual'] or not l['f']: continue
    g_ = 'plan' if l['planned'] else 'fc'; nums_ = re.findall(r'\b(2\d{7})\b', l['dd'] or ''); cs_ = sorted({_dd2c[x] for x in nums_ if x in _dd2c})
    if cs_: k_ = ' + '.join(cs_); assert ' + ' not in k_, k_; FCT[g_][k_] += l['f']; FCN[(g_, k_)] += 1
    elif nums_: FC_MISS += l['f']
    else: FC_NONE += l['f']
FC_MISS, FC_NONE = r2(FC_MISS), r2(FC_NONE)
assert abs(sum(v for g in FCT.values() for v in g.values()) + FC_MISS + FC_NONE - 21146.95) < 0.005   # v1.13: 23,660.56 less the six forecasts Schedule 17 replaces
TDOC = {'all': collections.defaultdict(float)}; TDOC_N = collections.Counter()
TF = json.load(open(P / 'dated_all.json'))['tFig']
for rd_ in S17['redocket']:   # v1.13: where Schedule 17 puts a figure on a different docket, the docket follows it (the amount does not change)
    hit_ = [t for t in TF if (t.get('event') or {}).get('task_id') == rd_['task'] and abs((t.get('amount') or 0) - rd_['amount']) < 0.005]
    assert len(hit_) == 1, rd_
    ev_ = hit_[0]['event']
    if rd_.get('dd_to'): assert ev_['dd'] == rd_['dd_from'], ev_['dd']; ev_['dd'] = rd_['dd_to']
    else: ev_['dd'] = ev_['dd'] + ' / ' + rd_['dd_add']
TF = TF + [{'event': {'task_id': c_['ref'], 'dd': c_['dd'], 'date': c_['date']}, 'amount': c_['amount']} for c_ in S17C]
for t in TF:   # every carrier figure to date: its delivery docket -> the hire contract (Baseplan (12) docket list)
    ev = t.get('event') or {}; a = t.get('amount') or 0; grp = 'all'
    nums = re.findall(r'\b(2\d{7})\b', ev.get('dd') or ''); cs = sorted({_dd2c[x] for x in nums if x in _dd2c})
    k = ' + '.join(cs) if cs else ('docket ' + ', '.join(nums) + ' not in Baseplan (12)' if nums else 'no docket on the record')
    TDOC[grp][k] = r2(TDOC[grp][k] + a); TDOC_N[(grp, k)] += 1
assert abs(sum(TDOC['all'].values()) - 37490.09) < 0.005, TDOC   # v1.13: 33,150.09 + Schedule 17's 4,340.00
def docs(grp):
    ks = sorted((k for k in TDOC[grp] if TDOC[grp][k]), key=lambda k: (not k[0].isdigit(), -TDOC[grp][k]))   # v1.13: a docket whose figures are all 0.00 is not listed
    return 'by the delivery docket on each load: ' + ' · '.join('%s %s (%d load%s)' % (k, m(TDOC[grp][k]), TDOC_N[(grp, k)], '' if TDOC_N[(grp, k)] == 1 else 's') for k in ks)
ACCOM_ETC = 'the V8s pay ACCOM / ETC on 9968862 (inv 25122058) L140 and 9968955 (inv 25122322) L163, 13,850.00 each'
CONS_ON = {'4655573': 'contract not named on the PO (STPS GL)', '4663216': on('9990776') + ': the PO says “for the GC500 fencing”',
           '4666720': 'contract not named on the PO; the buildings are hired on 9968862 (38 building shells and 4 booths or ticket offices) and 9994954 (3)',
           '4670270': on('9994954') + ' L13 Labour Charge Sync Generators: the PO’s note says so', '4670876': 'contract not named on the PO (KINP GL)',
           '4669481': 'contract not named on the PO (NVAC GL)'}
def charged_on(r):
    sup, what, po = r[0], r[3], r[4]
    if sup.startswith('Advanced'): return on('9990776')
    if sup == 'Event Portables': return on('9968955', '9994954') + ' (the lines are in section 1b)'
    if sup.startswith('Premiair'): return on('9961265') + ' lines 13, 24–26, 28–31 · VMS11 on ' + on('10001927') + ' L1'
    if sup.startswith('United Rentals'): return on('9974042') + ' L2–L4'
    if sup.startswith('Carriers'):
        if what.startswith('Loads to date'): return docs('all')
        g_ = 'plan' if what.startswith('Planned') else 'fc'
        tied_ = ' · '.join('%s %s (%d load%s)' % (k_, m(r2(v_)), FCN[(g_, k_)], '' if FCN[(g_, k_)] == 1 else 's') for k_, v_ in sorted(FCT[g_].items()))
        return ('forecast; tied by the docket on the load: ' + tied_ + '; the rest carry no docket in Baseplan (12) yet') if tied_ else 'forecast; no docket on these loads yet'
    if sup.startswith('Job Connect'):
        return 'KINP work (no contract number)' + (' · Kyle Gover’s 8 h on 15 Oct: ' + on('9972648') + ', water barriers' if 'w/e 18 Oct' in what else '')
    if sup.startswith('Accommodation'): return ('his hours sit on ' + on('9961976') + '; ' + ACCOM_ETC) if what.startswith('Ludwig') else ACCOM_ETC
    if sup.startswith('Meals'): return 'no line of its own on the invoices'
    if sup.startswith('Salary'): return 'not a line on the invoices; the PM’s labour is charged on ' + on('9968862', '9968955') + ', 15.22 h each (L141 and L164; the invoices print 15)'
    if sup.startswith('Queensland Forklifts'): return on('9961976') + (' L31' if po.startswith('4647983') else ' L34') + ', own use at 0.00 (not charged to the V8s)'   # v1.14
    if po in CONS_ON: return CONS_ON[po]
    raise ValueError(('no match-up for', r[:5]))
CH = [charged_on(r) for r in C]
MU = collections.defaultdict(list)   # hire contract -> our costs against it: (what, PO, amount, status)
MU['9990776'] += [('Advanced: fencing weeks 6–1 and a partial collection', '4647508 · 4647509 · 4647515 · 4647517 · 4647519 · 4647520 · 4658850', 214225.00, 'receipted'),
                  ('Advanced: event week, 19–25 Oct', '4647522 (open)', 71159.70, 'ESTIMATE, accrued'), ('Advanced: demob week 1, 26–29 Oct', '4647523 (open)', 8025.00, 'ESTIMATE, accrued'),
                  ('Advanced: demob week 2', '4647523 (open)', 750.00, 'November forecast'), ('CCI Supplies: cable ties for the GC500 fencing', '4663216', 2538.64, 'PO; check invoice')]
MU['9968955'] += [('Event Portables: toilet hire, servicing and transport (shared with 9994954)', 'none on the record', 101747.00, 'ESTIMATE, accrued; no invoice')]
MU['9994954'] += [('Event Portables: L19 (6 pee panels), L21 (10 FWF at WC09) and L22 (3 FWF at WC10); L18 is the transport of Coates’ two WC09 blocks', 'none on the record', None, 'in the 101,747.00 under 9968955'), ('Event Elec: sync the concert generators (L13)', '4670270', 579.68, 'PO, completed')]
MU['9961976'] += [('Ludwig Chee: 3 event nights, with his hours', 'none', 655.71, 'on the tracker'),
                  ('Queensland Forklifts: 5 t forklift re-hire for the fencing at Phillip Park (L31, own use at 0.00)', '4647983', 2820.00, 'PO; 900.00 received, nothing invoiced (estimate until invoiced)'),
                  ('Queensland Forklifts: AT009 2.5 t RT forklift, 17–18 Sep (L34, own use at 0.00)', '4654789', 950.00, 'PO, completed and invoiced')]   # v1.14
MU['9961265'] += [('Premiair: eight sub-hired VMS boards (lines 13, 24–26, 28–31), at their cost lines in the system', 'none on the record', PREM_SYS, 'accrued; no invoice yet')]
MU['10001927'] += [('Premiair: VMS11 467T (L1), 16–22 Oct, no cost line in the system: 7 days at 36.25', 'none on the record', PREM_V11, 'ESTIMATE, accrued; no invoice')]
MU['9972648'] += [('Job Connect: Kyle Gover 8 h on the water barriers, 15 Oct', '4668970', 460.78, 'ESTIMATE, accrued with w/e 18 Oct')]
MU['9974042'] += [('United Rentals (Royal Wolf): refrigerated container (L2), at its cost line in the system', 'none on the record', RW, 'accrued; no invoice yet')]
for k in TDOC['all']:
    if k[0].isdigit():
        for c_ in k.split(' + '): assert c_ in INV_OF, c_
        MU[k] += [('Carriers: loads with this contract’s docket', 'none on the record', TDOC['all'][k], '%d load%s; figures from the schedule' % (TDOC_N[('all', k)], '' if TDOC_N[('all', k)] == 1 else 's'))]
for g_ in ('fc', 'plan'):   # forecast loads tied by their docket keep their forecast status (Codex v1.8 recheck item 1); counted once
    for k_, v_ in sorted(FCT[g_].items()):
        assert k_ in INV_OF, k_
        MU[k_] += [('Carriers: forecast load%s with this contract’s docket (no figure yet)' % ('' if FCN[(g_, k_)] == 1 else 's'), 'none on the record', r2(v_), 'FORECAST; %d load%s, %s' % (FCN[(g_, k_)], '' if FCN[(g_, k_)] == 1 else 's', 'planned' if g_ == 'plan' else 'no figure recorded'))]
NOTE = {'9968862': 'the V8s pay ACCOM / ETC here (L140, 13,850.00) and the PM’s labour (L141, 15.22 h)', '9968955': 'the V8s pay ACCOM / ETC here (L163, 13,850.00) and the PM’s labour (L164, 15.22 h)',
        '9961976': 'staff hours here: %s h (the generators %s h; Frank Devilles and Ludwig Chee %s h, wages are hours only)' % (hd(sum(CON.get(('9961976', k), 0) for k in MO)), hd(sum(CON.get(('9961976', k), 0) for k in MO) - 72), '72'),
        '9972648': 'staff hours here: %s h on the water barriers' % hd(sum(CON.get(('9972648', k), 0) for k in MO))}
_nd = r2(sum(v for g_ in TDOC for k, v in TDOC[g_].items() if k.startswith('no docket'))); _nb = r2(sum(v for g_ in TDOC for k, v in TDOC[g_].items() if k.startswith('docket ')))
NT = [('Job Connect labour hire (supplier ' + JCS['code'] + '): KINP work (no contract number)', '4657010 · 4660565 · 4661783 · 4665091 · 4670882 · 4671825 (invoiced) · 4667755 · 4668970 (accrued) · 4674224 · 4674225 (Daniel, w/e 8 and 15 Nov, PO amounts) · none yet for w/e 1 Nov or Kyle’s w/e 8 Nov', r2(JC_TOT - 460.78), 'invoices where received; estimates accrued'),
      ('Carriers: loads to date with no docket on the record', 'none on the record', _nd, 'figures from the schedule; the carrier invoices will tie them (the fencing loads, %s, are among them)' % m(FENCE_REC)),
      ] + ([('Carriers: ' + ', '.join(k[7:] for k in TDOC['all'] if k.startswith('docket ') and TDOC['all'][k]), 'none on the record', _nb, 'figures from the schedule')] if _nb else []) + [
      ('Carriers: forecast loads with no docket on the record (no figure recorded, and planned)', 'none on the record', FC_NONE, 'forecast; no figure or docket yet'),
      ('Carriers: a forecast load with a docket not in Baseplan (12)', 'none on the record', FC_MISS, 'forecast; no figure yet'),
      ('Accommodation: 97 nights and Alfie Harris’s 5 nights', 'none', r2(ACCOM - 655.71), ACCOM_ETC),
      ('Meals, expenses and equipment R&M', 'none', 5664.32, 'no line of its own on the invoices'),
      ('Salary allowance', 'payroll', 14700.00, 'the PM’s labour is charged on 9968862 and 9968955'),
      ('Bunnings: star pickets', '4655573', 100.00, 'contract not named on the PO (STPS GL)'),
      ('BSF Mobile Cranes: building unloads', '4666720', 2896.00, 'contract not named on the PO; the buildings are hired on 9968862 (38 building shells and 4 booths or ticket offices) and 9994954 (3)'),
      ('Bunnings: hand soap', '4670876', 180.00, 'contract not named on the PO (KINP GL)'),
      ('Bunnings: siphon hose', '4669481', 42.33, 'contract not named on the PO (NVAC GL)')]
MU_TOT = r2(sum(x[2] or 0 for v in MU.values() for x in v)); NT_TOT = r2(sum(x[2] for x in NT))
assert abs(MU_TOT + NT_TOT - 552533.71) < 0.005, (MU_TOT, NT_TOT, MU_TOT + NT_TOT)
ORDER_C = sorted(INV_OF, key=lambda c: ({'KINP': 0, 'STPS': 1, 'NVAC': 2, 'MEAD': 3}.get(BR_OF[c], 9), c))
def pos_of(c):
    ps = []
    for x in MU.get(c, []):
        for t_ in re.findall(r'\b4\d{6}\b', x[1]):
            if t_ not in ps: ps.append(t_)
    return ' · '.join(ps) if ps else 'no PO on the record against it'
# ---------------- CSV
with (OUT / 'GC500_October_month_end.csv').open('w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f)
    w.writerow(['Author: Andrew Fisher', 'GC500 October month-end: costs by supplier and month, accruals, labour, invoices', 'as at 31 Oct 2026', 'AUD ex GST', 'record 12727'])
    w.writerow(['Supplier', 'Branch', 'Account', 'What', 'PO', 'Invoice / receipt', 'Charged on (hire contract · V8s invoice)', 'September', 'October', 'November', 'Accruals through 31 Oct', 'How dated', 'Status'])
    for r, ch_ in zip(C, CH): w.writerow(list(r[:6]) + [ch_, '%.2f' % r[6], '%.2f' % r[7], '%.2f' % r[8], '' if r[9] is None else '%.2f' % r[9], r[10], r[11]])
    w.writerow(['Total', '', '', '', '', '', '', '%.2f' % tot[0], '%.2f' % tot[1], '%.2f' % tot[2], '%.2f' % acc_total, '', ''])
    w.writerow([]); w.writerow(['Invoice', 'Date', 'Contract', 'Branch', 'Ex GST', 'Waiver', 'Sep hire incl. waiver, AUD ex GST (by time on hire)', 'Oct hire, AUD ex GST', 'Nov hire, invoiced in Oct, AUD ex GST', 'Services, sales, other, AUD ex GST (no dates)', 'POs against this contract', 'V8s PO (on the contract)'])
    for r in REV: w.writerow([r['inv'], r['date'], r['contract'], r['branch'], '%.2f' % r['ex'], '%.2f' % r['waiver']] + ['%.2f' % r['m'][k] for k in MO] + ['%.2f' % r['svc'], pos_of(r['contract']), cpo(r['contract'], True)[3:]])
    w.writerow(['Total, 18 invoices', '', '', '', '%.2f' % sum(r['ex'] for r in REV), '%.2f' % sum(r['waiver'] for r in REV)] + ['%.2f' % RT[k] for k in MO] + ['%.2f' % UND, '', ''])
    w.writerow(['November forecast', '29 Oct', '9961976', 'NVAC', '839.07', '', '', '', '', '', 'Baseplan (12) 9961976 L61, pick-up charge, applied, not invoiced yet'])
    for i_ in REMOVED: w.writerow([i_['invoice'], i_['date'], i_['contract'], 'removed', '', '', '', '', '', '', 'invoiced to Gold Coast Helitours, not V8 Supercars (ex GST %.2f): not GC500 revenue' % i_['ex_gst']])
    w.writerow([]); w.writerow(['Labour', 'Branch', 'September h', 'October h', 'November h (to 13 Nov)'])
    for typ in ('Coates wages', 'Salary', 'Labour hire'):
        for b in ('KINP', 'STPS', 'NVAC'):
            vals = [L.get((typ, b, k), 0) for k in MO]
            if any(vals): w.writerow([typ, b] + ['%.2f' % v for v in vals])
    for b_ in ('KINP', 'STPS', 'NVAC', 'MEAD'):
        vals_ = [LHB.get((b_, k), 0) for k in MO]
        if any(vals_): w.writerow(['Labour hire cost (running sheet basis; the P&L uses Job Connect’s invoices where received)', b_] + ['%.2f' % v for v in vals_])
    w.writerow([]); w.writerow(['Staff hours by contract', 'Branch', 'What', 'How', 'September h', 'October h', 'November h (to 13 Nov)'])
    for c_ in ['KINP', '9972648', '9961976']:
        hs = [CON.get((c_, k), 0) for k in MO]
        if any(hs): w.writerow([c_] + list(CLABEL[c_]) + ['%.2f' % v for v in hs])
    w.writerow([]); w.writerow(['Person', 'Home branch', 'Contract', 'September h', 'October h', 'November h (to 13 Nov)'])
    for who in sorted(HOME):
        for c_ in ['KINP', '9972648', '9961976']:
            hs = [CONP.get((who, c_, k), 0) for k in MO]
            if any(hs): w.writerow([who, HOME[who][0], c_ if c_ != 'KINP' else 'KINP'] + ['%.2f' % v for v in hs])
    w.writerow([]); w.writerow(['Person', 'Type', 'Home branch (record)', 'Journal', 'Receiving branch', 'September h', 'October h', 'November h (to 13 Nov)', 'Labour hire $'])
    for who in sorted(HOME):
        home, typ = HOME[who]
        for b in ('KINP', 'STPS', 'NVAC'):
            hs = [PH.get((who, k, b), 0) for k in MO]
            if any(hs): w.writerow([who, typ, home, ('stays' if b == home else home + ' -> ' + b) + {'STPS': ' (9972648)', 'NVAC': ' (9961976)'}.get(b, ''), b] + ['%.2f' % v for v in hs] + ['%.2f' % sum(PC.get((who, k, b), 0) for k in MO)])


# ---------------- accruals beside what we charged the V8s for the same work (Andrew, 31 Oct: "we need to understand what we charged v8s
#                  for to do with this and state we are still waiting for invoice and this is the esitimate cost. And we do same with fencing")
ACC = [
 ('Event Portables (toilets) — no PO or invoice on the record; estimated cost from their four quotes at what was supplied', [
   ('Toilet hire: their 195 FWF at 90.07, 6 pee panels, 2 × 16-pan blocks', '9968955 · 25122322 FWF lines + L98 · 9994954 · 25123999 L19', 27300.93, 'Q6845 hire', 28675.00),
   ('Pump-outs and servicing (their 702 FWF services include our FWF they cleaned)', '9968955 · 25122322 L141 (702 FWF) · L142 (24 tanks) · L143 (24 cleans, Delivered on the contract, not billed)', 66145.14, 'Q6844: 702 FWF, 18 tanks, 51 block cleans', 41772.00),
   ('Toilet transport (all toilets, ours and theirs; our carriers’ cost for our own toilets sits in the transport line, not here)', '9968955 · 25122322 L147, L148, L149, L162, L167 (45,215.00) · 9994954 · 25123999 L18 (2,000.00) and L24 FWF (1,235.00)', 48450.00, 'Q6845: their delivery and pickup', 13500.00),
   ('Water truck and pre-fill', 'no identified matching charge', 0.00, 'Q6844', 9600.00),
   ('Build-period water deliveries and tank', 'no identified matching charge', 0.00, 'Q6846', 4850.00),
   ('Pit lane party Porta Lisa', 'no identified matching charge', 0.00, 'Q6847', 3350.00)]),
 ('Advanced Temporary Fencing — POs 4647508–4647520 and 4658850 invoiced; the event week (PO 4647522) and demob week 1 (PO 4647523) part is an estimate, invoices still to come', [
   ('Fencing, all of it (one block to 13 Nov)', '9990776 · 25122628 fencing lines 335,097.44 + waiver 35,791.11 (leaves out WB13, a water barrier on the same invoice: L1 82.60 plus its waiver)', 370888.55, 'receipted, weeks 1–6 and a collection (the cost side runs to demob week 1; the 750.00 week 2 forecast is outside this comparison)', 214225.00),
   ('', '', None, 'ESTIMATE, invoice still to come: event week (PO 4647522) 71,159.70 + demob week 1 (PO 4647523) 8,025.00', 79184.70)]),
 ('Premiair Services — no PO or invoice on the record; cost from the sub-hire cost lines in the system on 9961265 (VMS11 estimated)', [
   ('Sub-hired VMS boards on 9961265, eight lines', '9961265 · 25125589 lines 13, 24–26, 28–31 (lines 25–26, VMS19 and VMS20, at 0.00)', 2787.72, 'the cost lines in the system: 36.25 a day (VMS24 26.00) × days charged', PREM_SYS),
   ('VMS19 and VMS20, billed on the VMS contract', '10001927 · 25123775 L7–L8', 857.76, 'their cost is in the line above (9961265 lines 25–26)', None),
   ('VMS11 467T', '10001927 · 25123775 L1', 375.27, 'no cost line in the system: 36.25 a day × 7 days (16–22 Oct), estimate', PREM_V11)]),
 ('Royal Wolf (United Rentals) — no PO or invoice on the record; cost from its sub-hire cost line in the system on 9974042', [
   ('Refrigerated container, with its share of delivery and pickup', '9974042 · 25124058 L2 1,428.00 + an equal share of the joint delivery and pickup L3/L4 (1,000.00; not an itemised amount)', 2428.00, 'the cost line in the system, 1,364.23 for 32 days (its daily rate shows as 42.63, rounded), once', RW)]),
]
arow = ''
for head, lines in ACC:
    ch = r2(sum(l[2] or 0 for l in lines)); co = r2(sum(l[4] or 0 for l in lines))
    arow += "<tr class='sec2'><td colspan='5'><b>%s</b></td></tr>" % e(head)
    for what, where, c, basis, cost in lines:
        arow += "<tr><td>%s</td><td><span class='w'>%s</span></td><td class='n'>%s</td><td><span class='w'>%s</span></td><td class='n'>%s</td></tr>" % (e(what), e(where), m(c) if c is not None else '<em>see note</em>' if where else '', e(basis), m(cost))
    arow += "<tr class='sub'><td>Total</td><td></td><td class='n'>%s</td><td>Charged less estimated cost: %s</td><td class='n'>%s</td></tr>" % (m(ch), m(r2(ch - co)), m(co))
# ---------------- HTML
def tbl(head, body, cls=''):
    return "<div class='wrap'><table class='%s'><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>" % (cls, ''.join('<th%s>%s</th>' % (" class='n'" if h.startswith('#') else '', e(h.lstrip('#'))) for h in head), body)
def pof(p_): return 'no PO on the record' if p_.startswith('none') else ('paid through payroll' if p_ == 'payroll' else 'PO ' + p_)
urow = ''
for c_ in ORDER_C:
    its = MU.get(c_, [])
    cell = '<br>'.join('%s · <span class=\'w\'>%s · %s</span>%s' % (e(a_), e(pof(p_)), e(st_), (' · <b>' + m(v_) + '</b>') if v_ is not None else '') for a_, p_, v_, st_ in its) or "<span class='w'>no supplier PO or cost on the record against it</span>"
    if c_ in NOTE: cell += "<br><span class='w'>" + e(NOTE[c_]) + '</span>'
    tc_ = r2(sum(x[2] or 0 for x in its))
    urow += "<tr><td><b>%s</b> · %s<br><span class='w'>%s</span></td><td>%s</td><td class='n'>%s</td><td><span class='w'>%s</span></td><td>%s</td><td class='n'>%s</td></tr>" % (e(c_), e(BR_OF[c_] or ''), e(cpo(c_, True)), e(INV_OF[c_]), m(EX_OF[c_]), e(ONIT[c_]), cell, m(tc_) if tc_ else '—')
urow += "<tr class='sec2'><td colspan='6'><b>Not tied to one hire contract</b> <span class='w'>(the record, the PO and Baseplan (12) don't name one)</span></td></tr>"
for a_, p_, v_, st_ in NT:
    urow += "<tr><td>—</td><td></td><td></td><td></td><td>%s · <span class='w'>%s · %s</span></td><td class='n'>%s</td></tr>" % (e(a_), e(pof(p_)), e(st_), m(v_))
urow += "<tr class='sub'><td>The job</td><td>18 invoices</td><td class='n'>%s</td><td><span class='w'>plus the November forecast %s (NVAC: the pick-up charge on 9961976 L61, 29 Oct, not invoiced yet)</span></td><td>All costs: tied to a contract %s · not tied %s</td><td class='n'>%s</td></tr>" % (
    m(sum(EX_OF.values())), m(839.07), m(MU_TOT), m(NT_TOT), m(r2(MU_TOT + NT_TOT)))
MATCH_HTML = ("<h2>3b · Where things match up: hire contract, V8s invoice, our POs and costs</h2><p class='s'>Every hire contract we invoiced, what's on it, and the purchase orders and costs that sit against it. "
              "Carriers are tied by the delivery docket on each load (Baseplan (12)'s docket list names the hire contract). Where the record, the PO or Baseplan (12) doesn't tie a cost to one contract, it's listed under the contracts and says so: nothing here is guessed.</p>"
              + tbl(['Hire contract · branch', 'V8s invoice', '#Ex GST', 'What’s on it (the invoice’s biggest lines)', 'Our POs and costs against it', '#Costs against it'], urow))
ACC_HTML = tbl(['What', 'Where we charged the V8s (hire contract · invoice · line)', '#Charged to the V8s', 'Cost basis', '#Cost (estimate where no invoice)'], arow)
crow = ''.join("<tr class='%s'><td><b>%s</b><br><span class='w'>%s</span></td><td>%s</td><td>%s</td><td><span class='w'>%s</span></td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'><b>%s</b></td><td><span class='w'>%s</span></td></tr>" % (
    'acc' if r[9] else ('nd' if 'NOT DATED' in r[11] else ''), e(r[0]), e(r[3]), e(r[4]), e(r[5]), e(ch_), m(r[6]), m(r[7]), m(r[8]), m(r[9]) if r[9] else '', e(r[11] + ' · ' + r[10])) for r, ch_ in zip(C, CH))
crow += "<tr class='sub'><td>Total costs</td><td></td><td></td><td></td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td></td></tr>" % (m(tot[0]), m(tot[1]), m(tot[2]), m(acc_total))
lrow = ''
for typ in ('Coates wages', 'Salary', 'Labour hire'):
    for b in ('KINP', 'STPS', 'NVAC'):
        vals = [L.get((typ, b, k), 0) for k in MO]
        if any(vals): lrow += "<tr><td>%s</td><td>%s</td>%s<td class='n'>%s</td></tr>" % (e(typ), b, ''.join("<td class='n'>%s</td>" % (hd(v) if v else '—') for v in vals), hd(sum(vals)))
for b_ in ('KINP', 'STPS', 'NVAC', 'MEAD'):
    vals_ = [LHB.get((b_, k), 0) for k in MO]
    if any(vals_): lrow += "<tr class='sub'><td>Labour hire cost (running sheet basis)</td><td>%s</td>%s<td class='n'>%s</td></tr>" % (b_, ''.join("<td class='n'>%s</td>" % m(v) for v in vals_), m(sum(vals_)))
rrow = ''.join("<tr><td>%s</td><td>%s</td><td>%s · %s<br><span class='w'>%s</span></td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td><span class='w'>%s</span></td></tr>" % (
    e(r['inv']), e(r['date'] or ''), e(r['contract'] or ''), e((r['branch'] or '') + ('' if r['cust'] == 'V8 Supercars' else ' · to ' + r['cust'])), e(cpo(r['contract'])), m(r['ex']), m(r['m']['Sep']), m(r['m']['Oct']), m(r['m']['Nov']), m(r['svc']), e(pos_of(r['contract']))) for r in REV)
rrow += "<tr class='sub'><td>18 invoices</td><td></td><td></td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td></td></tr>" % (m(sum(r['ex'] for r in REV)), m(RT['Sep']), m(RT['Oct']), m(RT['Nov']), m(UND))
prow = ''
for who in sorted(HOME, key=lambda w: (HOME[w][1].startswith('Labour hire'), w)):
    home, typ = HOME[who]
    for b in ('KINP', 'STPS', 'NVAC'):
        hs = [PH.get((who, k, b), 0) for k in MO]
        if not any(hs): continue
        cs = [PC.get((who, k, b), 0) for k in MO]
        cn = {'STPS': ' (9972648, water barriers)', 'NVAC': ' (9961976, generators)'}.get(b, '')
        move = ('stays on ' + b if b == home else 'journal ' + home + ' → ' + b) + cn
        prow += "<tr%s><td><b>%s</b><br><span class='w'>%s</span></td><td>%s</td><td><b>%s</b></td>%s<td class='n'>%s</td><td class='n'>%s</td></tr>" % (
            "" if b == home else " class='acc'", e(who), e(typ), home, e(move), ''.join("<td class='n'>%s</td>" % (hd(v) if v else '—') for v in hs),
            hd(sum(hs)), m(sum(cs)) if sum(cs) else '')
PERSON_HTML = tbl(['Person · type', 'Home branch', 'Journal', '#Sep h', '#Oct h', '#Nov h (to 13 Nov)', '#Total h', '#Labour hire $'], prow)
order_c = ['KINP', '9972648', '9961976']
crow2 = ''
for c_ in order_c:
    hs = [CON.get((c_, k), 0) for k in MO]
    if not any(hs): continue
    br_, what_, how_ = CLABEL[c_]
    crow2 += "<tr><td><b>%s</b> · %s<br><span class='w'>%s · %s</span></td>%s<td class='n'><b>%s</b></td></tr>" % (e(c_ if c_ != 'KINP' else 'KINP'), br_, e(what_), e(how_), ''.join("<td class='n'>%s</td>" % (hd(v) if v else '—') for v in hs), hd(sum(hs)))
crow2 += "<tr class='sub'><td>All staff hours</td>%s<td class='n'>%s</td></tr>" % (''.join("<td class='n'>%s</td>" % hd(sum(CON.get((c_, k), 0) for c_ in order_c)) for k in MO), hd(sum(CON.values())))
CON_HTML = tbl(['Contract · branch', '#Sep h', '#Oct h', '#Nov h (to 13 Nov)', '#Total h'], crow2)
prow2 = ''
for who in sorted(HOME, key=lambda w: (HOME[w][1].startswith('Labour hire'), w)):
    for c_ in order_c:
        hs = [CONP.get((who, c_, k), 0) for k in MO]
        if not any(hs): continue
        prow2 += "<tr><td>%s</td><td>%s</td><td>%s</td>%s<td class='n'>%s</td></tr>" % (e(who), HOME[who][0], e(c_ if c_ != 'KINP' else 'KINP (no contract number)'), ''.join("<td class='n'>%s</td>" % (hd(v) if v else '—') for v in hs), hd(sum(hs)))
CONP_HTML = tbl(['Person', 'Home branch', 'Contract', '#Sep h', '#Oct h', '#Nov h', '#Total h'], prow2)
css = """:root{--ink:#1d2730;--mute:#6b7681;--line:#e3e7eb;--bg:#f7f8f6;--card:#fff;--accent:#9c470c;--sub:#f1f4f6;--acc:#fff4e5;--nd:#fdecea}
@media (prefers-color-scheme:dark){:root{--ink:#e6eaee;--mute:#9aa5b0;--line:#2b343c;--bg:#14191e;--card:#1b2228;--accent:#f0a46a;--sub:#222b33;--acc:#33281a;--nd:#3a1f1c}}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}main{max-width:1180px;margin:0 auto;padding:20px 16px 40px}
h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:26px 0 8px;color:var(--accent)}.s{color:var(--mute);margin:0 0 12px}.w{color:var(--mute);font-size:12px}
.wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:760px;background:var(--card);border:1px solid var(--line)}th,td{padding:7px 9px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
th{font-size:11.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--mute)}.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}tr.sub td{font-weight:700;background:var(--sub)}tr.sec2 td{background:var(--sub);font-size:13px}tr.acc td{background:var(--acc)}tr.nd td{background:var(--nd)}
ul{margin:6px 0 0 18px}li{margin:3px 0}.k{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin:12px 0}.k div{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 12px}.k b{display:block;font-size:20px}
@page{size:A4 landscape;margin:9mm}
@media print{:root{--ink:#000;--mute:#3d4650;--line:#b9c0c6;--bg:#fff;--card:#fff;--accent:#7a3500;--sub:#eef1f3;--acc:#fff1dc;--nd:#fde5e2}
html,body{background:#fff!important;color:#000;font-size:11px}main{max-width:none;padding:0}h1{font-size:18px}h2{font-size:14px;margin:12px 0 4px;break-after:avoid;page-break-after:avoid}h3{font-size:12px;break-after:avoid}
.s,.w{font-size:10px}.wrap{overflow:visible!important}table{min-width:0!important;width:100%!important;font-size:10px}th,td{padding:2px 4px;overflow-wrap:anywhere}th{font-size:9.5px}
thead{display:table-header-group}tr{break-inside:avoid;page-break-inside:avoid}.k{grid-template-columns:repeat(4,1fr)}.k b{font-size:16px}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}"""
# v1.12: the labour we charged the V8s, by branch. Andrew, 1 Nov 2026: "how much labour we charged each MEAD and NVAC and KINP and STPS if any so
# when we journal peoples cost into INSTALL we have a figure we know we are up against". Every line the 18 invoices code LABOUR, as invoiced (ex GST;
# the damage waiver sits with the hire, as in the revenue model above), on the branch that invoices it
LCL = []
for i_ in inv:
    b_ = BR_FIX.get(i_['invoice'], i_.get('bp_branch'))
    for l_ in i_['lines']:
        raw_ = l_.get('raw') or ''
        if not re.search(r'\bLABOUR\b', raw_): continue
        rt_ = re.findall(r'\$([\d,]+\.\d\d)', raw_); rt_ = float(rt_[0].replace(',', '')) if rt_ else None
        tl_ = raw_.split('$')[-1].split(None, 1)
        LCL.append({'b': b_, 'inv': i_['invoice'], 'contract': str(i_['contract']), 'line': l_.get('ha_line'), 'what': re.sub(r'\s+', ' ', l_['desc']).strip(),
                    'note': tl_[1].strip() if len(tl_) > 1 else '', 'qty': l_['qty'], 'rate': rt_, 'amount': r2(l_['line_total']), 'hours': r2(l_['line_total'] / rt_) if rt_ else None})
LCL.sort(key=lambda x: ({'KINP': 0, 'STPS': 1, 'NVAC': 2, 'MEAD': 3}.get(x['b'], 9), x['contract'], x['line'] or 0))
LCB = {b: r2(sum(x['amount'] for x in LCL if x['b'] == b)) for b in ('KINP', 'STPS', 'NVAC', 'MEAD')}; LC_TOT = r2(sum(LCB.values()))
assert (LCB, LC_TOT, len(LCL)) == ({'KINP': 67542.02, 'STPS': 38699.96, 'NVAC': 9980.59, 'MEAD': 0.0}, 116222.57, 26), (LCB, LC_TOT, len(LCL))
LCI = {'KINP': r2(JC_TOT - 460.78), 'STPS': 460.78, 'NVAC': 0.0, 'MEAD': 0.0}   # labour hire already coded to Installs in this pack (management view, job end)
LCLEFT = {b: r2(LCB[b] - LCI[b]) for b in LCB}
assert (LCI['KINP'], LCLEFT['KINP'], r2(sum(LCLEFT.values()))) == (40029.38, 27512.64, 75732.41), (LCI, LCLEFT)
LC_NOTES = ['STPS: Advanced’s installation (2142) on the event and demob weeks, %s accrued, is the fencing subcontract’s labour; it is not taken off here.' % m(37991.00),
            'MEAD: no line is coded labour and none supplies an operator; 9992300 L4 (%s) is the hire of a scissor lift “With Operator Protection”.' % m(1672.64),
            'Not counted, as the invoices do not code them labour: the fence relocation on 9990776 L4 (%s, a fencing hire line) and ACCOM / ETC 50%% on 9968862 and 9968955 (%s, travel expenses).' % (m(13148.00), m(27700.00)),
            '%s lines print whole hours but charge part hours (15.22 h on each project manager line, 27.15 h, 4.50 h twice and 31.55 h): the amounts are the invoices’.' % {6: 'Six'}[sum(1 for x_ in LCL if x_['hours'] is not None and abs(float(x_['hours']) - round(float(x_['hours']))) > 1e-9)]]   # v1.16: counted from the lines (was “Five”)
_lcb = ''.join("<tr><td>%s</td><td class='n'>%s</td><td class='n'>%d</td><td class='n'>%s</td><td class='n'>%s</td></tr>" % (b, m(LCB[b]), sum(1 for x in LCL if x['b'] == b), m(LCI[b]), m(LCLEFT[b])) for b in ('KINP', 'STPS', 'NVAC', 'MEAD'))
_lcb += "<tr class='sub'><td>The job</td><td class='n'>%s</td><td class='n'>%d</td><td class='n'>%s</td><td class='n'>%s</td></tr>" % (m(LC_TOT), len(LCL), m(r2(sum(LCI.values()))), m(r2(sum(LCLEFT.values()))))
_lcl = ''.join("<tr><td>%s</td><td>%s</td><td>%s L%s</td><td>%s%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td></tr>" % (x['b'], x['inv'], x['contract'], x['line'], e(x['what']), (' <span class=\'w\'>(' + e(x['note']) + ')</span>') if x['note'] else '', hd(x['hours']), m(x['rate']), m(x['amount'])) for x in LCL)
LC_HTML = ("<h2>2d · Labour we charged the V8s, by branch</h2><p class='s'>Every line the 18 invoices code LABOUR, as invoiced (AUD ex GST; the damage waiver sits with the hire). "
           "This is the figure people’s cost journaled to Installs is set against, branch by branch; the labour hire already coded to Installs in this pack is taken off to show what is left.</p>"
           + tbl(['Branch', '#Labour charged', '#Lines', '#Labour hire already in Installs', '#Left for people’s cost'], _lcb)
           + "<ul>" + ''.join('<li>' + e(t) + '</li>' for t in LC_NOTES) + "</ul><h3>Every labour line on the invoices</h3>"
           + tbl(['Branch', 'Invoice', 'Contract · line', 'What (as invoiced)', '#Hours or units charged', '#Rate', '#Amount'], _lcl))
# v1.13: section 2e, transport checked against Schedule 17 (1 Nov), every change on one line with its Schedule 17 row, docket and hire contract
S17_BR = collections.defaultdict(float)
for c_ in S17C:
    S17_BR[c_['branch']] += c_['amount'] - (c_.get('was') or 0) * (1 if not c_.get('was_branch') else 0)
    if c_.get('was_branch'): S17_BR[c_['was_branch']] -= c_['was']
S17_BR = {b: r2(S17_BR.get(b, 0)) for b in ('KINP', 'STPS', 'NVAC', 'MEAD')}
assert S17_BR == {'KINP': -92.34, 'STPS': 389.56, 'NVAC': 1139.61, 'MEAD': 389.56} and r2(sum(S17_BR.values())) == S17_NET, S17_BR
S17_BRALL = dict(S17_BR); S17_BRALL['NVAC'] = r2(S17_BRALL['NVAC'] - FORK_TOT); S17_BRALL['MEAD'] = r2(S17_BRALL['MEAD'] + FORK_TOT)
S17_SEP = r2(sum(c_['amount'] - (c_.get('was') or 0) for c_ in S17C if c_['date'][:7] == '2026-09')); assert S17_SEP == 570.00 and r2(S17_NET - S17_SEP) == 1256.39
_d17 = lambda d_: '%d %s' % (int(d_[8:10]), {'09': 'Sep', '10': 'Oct', '11': 'Nov'}[d_[5:7]])
S17_ROWS = [[c_['ref'], _d17(c_['date']), c_['item'], c_['contract'] + ' · ' + c_['dd'], '%s row %d' % tuple(c_['s17']), c_['amount'],
             ({'missing': 'no load on the record', 'priced': 'nil (not priced)'}.get(c_['kind']) or ('%s forecast%s' % (m(c_['was']), ' on ' + c_['was_branch'] if c_.get('was_branch') else ''))),
             r2(c_['amount'] - (c_.get('was') or 0)), c_['branch']] for c_ in S17C]
_s17r = ''.join("<tr><td><b>%s</b></td><td>%s</td><td>%s</td><td>%s</td><td><span class='w'>%s</span></td><td class='n'>%s</td><td><span class='w'>%s</span></td><td class='n'><b>%s</b></td><td>%s</td></tr>" % (
    e(r_[0]), e(r_[1]), e(r_[2]), e(r_[3]), e(r_[4]), m(r_[5]), e(r_[6]), ('+' if r_[7] > 0 else '') + m(r_[7]), e(r_[8])) for r_ in S17_ROWS)
_s17r += "<tr class='sub'><td>12 loads</td><td></td><td></td><td></td><td></td><td class='n'>%s</td><td><span class='w'>forecasts replaced %s</span></td><td class='n'><b>+%s</b></td><td></td></tr>" % (m(S17_ADD), m(S17_WAS), m(S17_NET))
_s17s = S17['summary']
S17_NOTES = ['Schedule 17 has %d rows with a figure, %s. %d tie to the record’s loads to the cent (%s); %d carry the same money on another docket (%s): WC60’s 870.00 is Schedule 17’s 290.00 and 580.00 on 26104424, 26106375 and 26106388, and WC01’s 570.00 is on the accessible toilet’s own docket, 26102678. Event Week and Demob Weeks 1–3 carry no figures.' % (
                 _s17s['rows_with_figure'], m(_s17s['total']), _s17s['tied_rows'], m(_s17s['tied']), _s17s['other_docket_rows'], m(_s17s['other_docket'])),
             'GN20’s delivery: GN20 was deleted on 20 Oct in error and re-added as GN20-A on 25 Oct; its delivery row ($570+ on Schedule 17) did not come back with it. The V8s were charged for the 365 kVA’s transport on 9961976 L55 (2 × 600.00).',
             'By branch, the 12 changes: KINP %s · STPS %s · NVAC %s · MEAD %s. With the three September forklift deliveries (%s) moved from NVAC to MEAD by what they carry: NVAC %s · MEAD %s.' % tuple(
                 (m(v_) if i_ == 4 else ('+' if v_ > 0 else '') + m(v_)) for i_, v_ in enumerate((S17_BR['KINP'], S17_BR['STPS'], S17_BR['NVAC'], S17_BR['MEAD'], FORK_TOT, S17_BRALL['NVAC'], S17_BRALL['MEAD']))),
             'By month: September +%s (GN20, 30 Sep), October +%s.' % (m(S17_SEP), m(r2(S17_NET - S17_SEP))),
             S17['kept'][0]['why'].replace('1151.62', '1,151.62') + ' (15 and 17 Sep).',
             'No figure on Schedule 17 and no load on the record (not costed): ' + '; '.join(S17['no_figure']) + '.']
S17_HTML = ("<h2>2e · Transport checked against Schedule 17</h2><p class='s'>Schedule 17 (1 Nov) against every load on the record. The figures are the schedule’s (the carriers’ minimums), as with every load. Each change is one Schedule 17 row; its docket ties it to the hire contract (Baseplan (12)).</p>"
            + tbl(['Ref', 'Date', 'What', 'Hire contract · docket', 'Schedule 17', '#Figure', 'On the record before', '#Change', 'Branch'], _s17r)
            + "<ul>" + ''.join('<li>' + e(t) + '</li>' for t in S17_NOTES) + "</ul>")
body = f"""<main><h1>GC500 P&amp;L · job position at 31 Oct 2026 · pack v1.16</h1><p class='s'>As at 31 Oct 2026 · AUD ex GST · from the live record (12727), the 18 invoices to the V8s, the purchase orders and Schedule 17 · Author: Andrew Fisher</p>
<div class='k'><div><span class='w'>To accrue at 31 Oct (costs for work done, not invoiced)</span><b>{m(acc_total)}</b></div><div><span class='w'>Costs by month of work</span><b>Sep {m(tot[0])}</b><span class='w'>Oct {m(tot[1])} · Nov {m(tot[2])}</span></div>
<div><span class='w'>Invoiced to the V8s (all 18 in October)</span><b>{m(sum(r['ex'] for r in REV))}</b><span class='w'>hire with waiver by month: Sep {m(RT['Sep'])} · Oct {m(RT['Oct'])} · Nov {m(RT['Nov'])}; services {m(UND)}</span></div></div>
<h2>1 · Costs by supplier and month, with the accruals through 31 Oct</h2><p class='s'>Each line names its purchase order and the hire contract and V8s invoice it's charged on (section 3b groups them by contract). Orange rows: in the accruals through 31 Oct, the journals prepared for Finance (they reverse on 1 Nov and the invoice lands against them; September’s part of Event Portables’ water is in them as a catch-up). Red rows: the record carries no date; where they sit is said on the row.</p>
{tbl(['Supplier · what', 'PO', 'Invoice / receipt', 'Charged on (hire contract · V8s invoice)', '#Sep', '#Oct', '#Nov', '#Accruals through 31 Oct', 'Status · how dated'], crow)}
<h2>1b · Accruals beside what we charged the V8s</h2><p class='s'>Each accrued supplier next to what we charged the V8s for the same work. Where no supplier invoice has been seen, the cost is an estimate and says so; it is replaced when the invoice comes. Charges are before the damage waiver except the fencing, which shows its fencing lines with their waiver; WB13, a water barrier on the same invoice, is left out, as its row says.</p>
""" + ACC_HTML + f"""
<h2>2 · Labour by month and branch, to 13 Nov</h2><p class='s'>Hours from the running sheet, allocated by the job’s rules (KINP rule, the water barriers on STPS, the generators at 1.5 h in and out, the event weekend’s mechanic and electrician on NVAC). Coates wages and salary are hours only. The labour hire cost rows are the running sheet’s ({m(41276.59)}), by the branch that received the hours; the P&L carries Job Connect’s invoices where received and the running sheet where not ({m(JC_TOT)}, section 1).</p>
{tbl(['Type', 'Branch', '#September h', '#October h', '#November h (to 13 Nov)', '#Total h'], lrow)}
<h2>2b · Labour by person: home branch, and where the cost is journaled to</h2><p class='s'>Home branch from each person's row on the record. Journal to: the job’s allocation rules (the people's costs on KINP; water barriers on STPS; the generators at 1.5 h in and out on NVAC; Frank Devilles and Ludwig Chee, the event weekend’s mechanic and electrician, on NVAC). Coates wages and salary are hours (finance applies the pay cost); labour hire is dollars at the record's rates. Branch names for NOIS, NTSP, BFIS and NSNA aren't on the record.</p>
""" + PERSON_HTML + f"""
<h2>2c · Staff hours by contract</h2><p class='s'>Outside KINP, the contract is named: the water barriers on 9972648 (STPS) and the generators on 9961976 (NVAC), from the hours on the running sheet's notes; Frank Devilles and Ludwig Chee, the event weekend’s mechanic and electrician (23–25 Oct, 36 h each), on 9961976. NVAC bills one Event Gen Tech, the event labour scope's one a day: 31.55 h, {m(4735.97)} on 25121022 (the invoice prints 31), and 4.5 h, {m(675.50)} on KINP's 25123999 (the invoice prints 4). Worked hours and billed hours are different facts. Everything else is KINP (no contract number). Labour hire costs are coded to Installs.</p>
""" + CON_HTML + f"""
<h3>By person and contract</h3>
""" + CONP_HTML + f"""
""" + LC_HTML + S17_HTML + f"""<h2>3 · The 18 invoices, and their hire split across the months (AUD ex GST)</h2><p class='s'>Invoice 25124396 (9994248, {m(1974.05)}) is not GC500 revenue: it is invoiced to Gold Coast Helitours, not V8 Supercars, and no cost on the record ties to it. All 18 are dated 27–30 Oct, and the revenue is booked in the invoice month, October. The November column is the hire for days in November on these October invoices: shown for information, not moved. Each month's hire $ is the invoice's dated hire lines and the damage waiver on them (AUD ex GST), split across the months by the time on hire, from the invoice's own on/off-hire times; the cents are reconciled once, so each row adds to its ex GST exactly. Services and sales carry no dates on the invoice; they're in the services column. The last column is the purchase orders against each contract; section 3b has the detail.</p>
{tbl(['Invoice', 'Date', 'Contract · branch', '#Ex GST', '#Sep hire (AUD ex GST)', '#Oct hire (AUD ex GST)', '#Nov hire, invoiced in Oct (AUD ex GST)', '#Services, sales, other (AUD ex GST, no dates)', 'POs against this contract'], rrow)}
{MATCH_HTML}
<h2>4 · Dates and estimates: what the record gives, and what it can't</h2><ul>
<li>Transport: every load is dated by the schedule (the work date). The figures are the schedule's (the carriers' minimums), not carrier invoices; the invoices will confirm the amounts and their own dates.</li>
<li>Alfie Harris's 5 nights at 223.63 a night (on the record from 1 Nov; his 12–15 and 23–25 Oct nights were taken off then, as he did not work): 1 in October, 5 Oct ({m(ALF_OCT)}, accrued) and 4 in November ({m(ALF_NOV)}, forecast), until the invoice comes.</li>
<li>Premiair and Royal Wolf: the sub-hire cost lines in Coates' system: Premiair's, days charged × daily cost rate, eight boards on 9961265 at 36.25 a day (VMS24 26.00, on NVAC as coded), {m(PREM_SYS)}; VMS11, billed on 10001927 L1, has no cost line and is estimated at 7 days × 36.25 ({m(PREM_V11)}); Royal Wolf, its line total in the system, {m(RW)} for 32 days charged (the line shows 42.63 a day, rounded; 32 × 42.63 is 1,364.16).</li>
<li>Job Connect in November: Daniel Gough’s POs 4674224 (w/e 8 Nov) and 4674225 (w/e 15 Nov) at their amounts, {m(JCP['4674224']['amount'])} each; Kyle Gover’s w/e 8 Nov at the running sheet ({m(3023.85)}). The running sheet has Daniel Monday to Friday, 06:30–17:00, to 13 Nov ({m(3174.90)} a week at the record’s rates), until the invoices come.</li>
<li>Transport by branch: each load on the branch whose equipment it moves (VMS on STPS, generators on NVAC, forklifts on MEAD): the record’s branch, with the concert generators’ delivery ({m(580.00)}) moved from KINP to NVAC and the three September forklift deliveries on 9961976 ({m(FORK_TOT)}) moved from NVAC to MEAD; their hire stays where it is invoiced. A load with no branch goes by what it carries (the fencing loads to STPS, the forklift pick-ups to MEAD, VMS moves to STPS, the generator trailer to NVAC, buildings, the event container and a fridge to KINP).</li>
<li>The salary allowance ({m(14700)}) covers the record's window, 14 Sep–13 Nov; it's split by the salaried hours inside it (the 55 h before 14 Sep are outside it).</li>
<li>Event Portables: no invoice or PO on the record; costed from their four quotes (unsigned; no PO on them). Q6846 is at its quoted 4,850.00.</li>
<li>Service lines on the invoices (transport, install and demob, pump-outs, labour, accommodation recharges, scrim, toilet paper): {m(UND)}, no dates on the invoice. Dating them to the work needs each one matched to the record; that's the next piece.</li></ul>
</main>"""
# ---------------- the final P&L pack: summary by branch, journals, open items, and an Excel workbook (appended to build_monthend.py)
REV_B = collections.defaultdict(float)
for r in REV: REV_B[r['branch']] += r['ex']
REV_B = {b: r2(v) for b, v in REV_B.items()}
NOV_REV = {'NVAC': 839.07}            # Baseplan (12) 9961976 L61, pick-up charge 29 Oct, applied, not on an invoice yet (forecast)
COST_B = {   # management view, job end; people's costs on KINP (29 Oct ruling) except labour hire on the water barriers (Kyle Gover, 8 h on 9972648)
             # and Ludwig Chee's three event nights, which follow his hours to NVAC (Andrew, 31 Oct)
 'KINP': [('Event Portables, toilets (estimate; no PO or invoice on the record; charged on 9968955 and 9994954)', 101747.00),
          ('Premiair, sub-hired VMS boards (cost lines in the system, VMS11 estimated; no PO on the record; charged on 9961265 and 10001927)', PREM_BR['KINP']),
          ('Transport, carriers (no POs or carrier invoices on the record; by load' + tnote('KINP') + ')', TBR['KINP']),
          ('Labour hire, coded to Installs: Job Connect (supplier ' + JCS['code'] + ') POs 4657010 · 4660565 · 4661783 · 4665091 · 4667755 · 4668970 · 4670882 · 4671825 · 4674224 · 4674225 (invoices where received; Daniel’s November weeks at his POs; the running sheet where neither)', r2(JC_TOT - 460.78)),
          ('Salary allowance (payroll, no PO; the PM’s labour is charged on 9968862 and 9968955)', 14700.00),
          ('Accommodation (the tracker, no PO; the V8s pay ACCOM / ETC on 9968862 L140 and 9968955 L163)', r2(ACCOM - 655.71)),
          ('Meals, expenses and equipment R&M (the tracker, no PO; no line of its own on the invoices)', 5664.32),
          ('Consumables: POs 4666720 BSF cranes 2,896.00 · 4670876 soap 180.00', 3076.00)],
 'STPS': [('Fencing, Advanced: receipted, POs 4647508 · 4647509 · 4647515 · 4647517 · 4647519 · 4647520 · 4658850 (charged on 9990776)', 214225.00),
          ('Fencing, Advanced: estimate, invoices still to come on POs 4647522 and 4647523 (charged on 9990776)', 79184.70),
          ('Fencing, Advanced: demob week 2, PO 4647523 (forecast)', 750.00),
          ('Royal Wolf, refrigerated container (its cost line in the system; no PO on the record; charged on 9974042)', RW),
          ('Transport, carriers (no POs or carrier invoices on the record; by load' + tnote('STPS') + ')', TBR['STPS']),
          ('Labour hire on the water barriers: Kyle Gover 8 h on 15 Oct, PO 4668970, on 9972648 (journal from KINP)', 460.78),
          ('Consumables: POs 4663216 cable ties for the fencing 2,538.64 (9990776) · 4655573 star pickets 100.00', 2638.64),
          ('Forklift re-hire, Queensland Forklifts: 5 t forklift for the fencing at Phillip Park, PO 4647983 (900.00 received; estimate until invoiced; on 9961976 L31, own use at 0.00)', 2820.00)],
 'NVAC': [('Premiair, VMS24 (its cost line in the system, 201.NVAC.2126; no PO on the record; charged on 9961265 L31)', PREM_BR['NVAC']),
          ('Transport, carriers (no POs or carrier invoices on the record; by load' + tnote('NVAC') + ')', TBR['NVAC']),
          ('Accommodation: Ludwig Chee’s three event nights, 23–25 Oct (the tracker, no PO; with his hours on 9961976; journal from KINP)', 655.71),
          ('Consumables: POs 4669481 siphon hose 42.33 · 4670270 concert generator sync 579.68 (charged on 9994954 L13)', 622.01)],
 'MEAD': [('Transport, carriers (no POs or carrier invoices on the record; by load' + tnote('MEAD') + ')', TBR['MEAD']),
          ('Forklift re-hire, Queensland Forklifts: AT009 2.5 t RT forklift for Coates’ use, 17–18 Sep, PO 4654789 (invoiced; on 9961976 L34, own use at 0.00)', 950.00)]}
CB = {b: r2(sum(v for _, v in LL)) for b, LL in COST_B.items()}
assert abs(sum(CB.values()) - 552533.71) < 0.005, CB
assert CB == {'KINP': 220851.17, 'STPS': 318290.56, 'NVAC': 7877.14, 'MEAD': 5514.84}, CB   # v1.14: the forklift POs, STPS + 2,820.00, MEAD + 950.00   # v1.13: {'KINP': 220851.17, 'STPS': 315470.56, 'NVAC': 7877.14, 'MEAD': 4564.84} (v1.12: KINP 220,943.51 · STPS 315,081.00 · NVAC 8,510.62 · MEAD 2,402.20)
assert abs(sum(REV_B.values()) - 1001063.07) < 0.005, REV_B
JOB_REV, JOB_COST = r2(sum(REV_B.values()) + sum(NOV_REV.values())), r2(sum(CB.values()))
srow = ''
for b in ('KINP', 'STPS', 'NVAC', 'MEAD'):
    rv = r2(REV_B.get(b, 0) + NOV_REV.get(b, 0)); d = r2(rv - CB[b])
    srow += "<tr><td><b>%s</b></td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td></tr>" % (
        e({'KINP': 'KINP · Brisbane Portables', 'STPS': 'STPS · Brisbane Traffic', 'NVAC': 'NVAC · North Power and HVAC', 'MEAD': 'MEAD · Brisbane Mechanical Specialist'}[b]),
        m(REV_B.get(b, 0)), m(NOV_REV.get(b, 0)), m(rv), m(CB[b]), m(d), '{:.1%}'.format(d / rv))
srow += "<tr class='sub'><td>The job</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td><td class='n'>%s</td></tr>" % (
    m(sum(REV_B.values())), m(sum(NOV_REV.values())), m(JOB_REV), m(JOB_COST), m(JOB_REV - JOB_COST), '{:.1%}'.format((JOB_REV - JOB_COST) / JOB_REV))
crowB = ''
for b, LL in COST_B.items():
    crowB += "<tr class='sec2'><td colspan='2'><b>%s</b></td></tr>" % b
    for k, v in LL: crowB += "<tr><td>%s</td><td class='n'>%s</td></tr>" % (e(k), m(v))
    crowB += "<tr class='sub'><td>%s costs</td><td class='n'>%s</td></tr>" % (b, m(CB[b]))
JOURNALS = [
 ('Accrual · Advanced, event week', '4647522', '9990776 (inv 25122628)', '2126 Rehire 34,568.70 · 2142 Installation 36,591.00', 'STPS', 71159.70),
 ('Accrual · Advanced, demob week 1', '4647523', '9990776 (inv 25122628)', '2126 Rehire 6,625.00 · 2142 Installation 1,400.00', 'STPS', 8025.00),
 ('Accrual · Event Portables, hire, transport and water (estimate): Q6845 toilet hire and transport 42,175.00 · water 14,450.00 (Q6846 4,850.00; Q6844 water truck and pre-fill 9,600.00) · Q6847 pit-lane trailer 3,350.00', 'none on the record', '9968955 (inv 25122322) · 9994954 (inv 25123999)', '2126 Rehire', 'KINP', EP_HIRE),
 ('Accrual · Event Portables, servicing: 702 FWF services, 18 tank pump-outs, 51 block cleans (estimate)', 'none on the record', '9968955 (inv 25122322)', '3325 Toilet pump-outs', 'KINP', EP_SVC),
 ('Accrual · Job Connect (' + JC_LEGAL + '), w/e 18 Oct and w/e 1 Nov (the running sheet; w/e 11 and 25 Oct are invoiced)', '4667755 · 4668970 · none for w/e 1 Nov', 'KINP work, no contract number (Kyle Gover’s 8 h on 15 Oct: 9972648)', 'Installs (as coded)', 'KINP', JC_ACC),
 ('Accrual · Premiair (cost lines in the system; VMS11 estimated)', 'none on the record', '9961265 (inv 25125589) · 10001927 (inv 25123775)', '2126', 'KINP %s (KINP-SUB) · NVAC %s (VMS24, NVAC-SUB)' % (m(PREM_BR['KINP']), m(PREM_BR['NVAC'])), PREM_TOT),
 ('Accrual · Royal Wolf (its cost line in the system)', 'none on the record', '9974042 (inv 25124058)', '2126', 'STPS (201.STPS.2126)', RW),
 ('Accrual · accommodation, Alfie Harris’s October night (5 Oct) at 223.63 (estimate; the 4 November nights, 894.52, are November forecast)', 'none', 'job-wide (the V8s pay ACCOM / ETC on 9968862 L140 and 9968955 L163)', '3520', 'KINP', ALF_OCT)]
assert abs(sum(j[5] for j in JOURNALS) - acc_total) < 0.005, (sum(j[5] for j in JOURNALS), acc_total)
MOVES = [   # zero-net interbranch schedule at 31 Oct (Codex audit F11): cost journals between branches, not accruals; labour hours moves are in section 2b
 ('Branch move · labour hire, Kyle Gover 8 h on the water barriers (15 Oct)', '4668970', '9972648 (inv 25125600)', 'Installs (as coded)', 'KINP −460.78 · STPS +460.78', 460.78),
 ('Branch move · accommodation, Ludwig Chee’s 3 event nights (23–25 Oct), with his hours', 'none', '9961976 (inv 25121022), with his hours', '3520', 'KINP −655.71 · NVAC +655.71', 655.71)]
jrow = ''.join("<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td class='n'>%s</td></tr>" % (e(a), e(b_), e(k_), e(c_), e(d_), m(v)) for a, b_, k_, c_, d_, v in JOURNALS)
jrow += "<tr class='sub'><td>Accruals through 31 Oct, prepared for Finance (each reverses on 1 Nov; the invoice lands against it)</td><td></td><td></td><td></td><td></td><td class='n'>%s</td></tr>" % m(acc_total)
mrow = ''.join("<tr class='acc'><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td class='n'>%s</td></tr>" % (e(a), e(b_), e(k_), e(c_), e(d_), m(v)) for a, b_, k_, c_, d_, v in MOVES)
mrow += "<tr class='sub'><td>Net across the branches (each move takes from one and adds to the other; job cost and accruals don't change)</td><td></td><td></td><td></td><td></td><td class='n'>0.00</td></tr>"
OPEN = [
 'Event Portables: their invoice. Their 51 block cleans (17 blocks × the 3 event nights, 23–25 Oct) tie: 18 on the six tank blocks (WC05, WC20 × 2, WC27, WC60 × 2) and 6 on WC31’s two 16-pan blocks, all billed on 9968955 L142 (24 × 624.60); 24 on the eight sewer-connected blocks (WC09, WC15, WC16 and WC17, two each), which is 9968955 L143 (24 keyed at the card’s 260.25, billed 0.00: see possible extra revenue); 3 on the WC-TV block (T0243, asset 1311144), which is on 9973977 and has no cleaning line. Also check water (9,600.00, no identified matching charge), Porta Lisa (3,350.00, no identified matching charge) and tank pump-outs (18 done; L142 charges 24, the 18 and WC31’s 6).',
 'Advanced: invoices for POs 4647522 and 4647523; possible extra 2,577.00 (36524, note 24479, the week 6 balance) not accrued. Relocation and removal are billed by the hour; those hours come with the demob dockets.',
 'Premiair and Royal Wolf: their invoices. VMS19 and VMS20 are billed to the V8s on 10001927 L7–L8 (their 9961265 lines are at 0.00) and VMS11 on 10001927 L1. The cost is the system’s sub-hire cost lines (36.25 a day; VMS24 26.00), not the 53.61 a day the V8s pay. VMS11 has no cost line in the system: it is estimated at 7 days × 36.25 and sits on KINP with the other Premiair boards; the site record has it going out on 30 Oct. Premiair’s invoice settles both.',
 '9974042: both containers are billed to the V8s from 28 Sep (Baseplan (12) L1–L2), but the delivery dockets have them going out on 12 Oct (the container) and 13 Oct (the refrigerated container): a possible query or credit. Royal Wolf’s cost line also runs from 28 Sep.',
 'Job Connect (' + JC_LEGAL + ') invoices: PO 4665091 (w/e 11 Oct) 2,636.56; POs 4670882 and 4671825 (w/e 25 Oct) 6,069.48 and 5,244.91, together 11,314.39 against the running sheet’s 11,774.71; invoiced, so not accrued. Daniel Gough’s November POs, 4674224 (w/e 8 Nov) and 4674225 (w/e 15 Nov), 3,052.60 each, are carried at the PO amounts (the running sheet says 3,174.90 a week). Carried at the running sheet until invoiced: w/e 18 Oct (POs 4667755 and 4668970, accrued), w/e 1 Nov (no PO, accrued) and Kyle Gover’s w/e 8 Nov (no PO); no further Job Connect paperwork is held. Every Job Connect week on the running sheet, w/e 20 Sep to w/e 15 Nov, is in the costs above. The running sheet was 178.15 over the three invoices to 4 Oct. Eric Lucian’s week (w/e 18 Oct) is ' + m(ERIC_WK) + ' on Job Connect’s charge; he did not work the full week on GC500, so only his hours here (10.5 h on 14 Oct, 634.98 on the running sheet) are journaled to KINP, and his hours for the week give the exact share.',
 'Transport: the figures are the schedule’s (the carriers’ minimums), not carrier invoices, checked against Schedule 17 on 1 Nov (section 2e); ' + m(r2(sum(v for k, v in TR.items() if k[0] != 'rec'))) + ' is forecast (loads with no figure, and planned loads). The page also lists 36 planned movements needing a rate or scope and 17 unpriced demob movements; they are not in the costs.',
 'Schedule 17: the 15 and 17 Sep fencing loads (2 semis each) are listed with the dollar column blank; the costs keep 1,151.62 each, the 2-semi rate on 21 and 23 Sep, until the carrier invoices say otherwise. Two movements have no figure and no load on the record: the 20 Oct RT forklift delivery (26142467, 9961976) and the five forklift collections on 2 Nov.',
 'Not accrued here: carrier loads to 31 Oct (%s: recorded %s, forecast %s and planned October loads %s; no carrier PO or invoice on the record), the six consumables POs (6,336.65) and the two forklift POs (3,770.00). In Coates’ system on 1 Nov, 4663216 (cable ties, 2,538.64) is received in full and not invoiced; 4647983 (forklift re-hire, 2,820.00) has 900.00 received and nothing invoiced (its 4 weeks 2 days and 2 weeks lines, 1,920.00, are not received); 4666720, 4669481, 4670270 and 4654789 are completed and invoiced; 4655573 and 4670876 have nothing received. Finance to confirm whether any needs a manual accrual.' % (
     m(r2(sum(TR.get((k_, mo_), 0) for k_ in ('rec', 'fc', 'plan') for mo_ in ('Sep', 'Oct')))), m(r2(TR.get(('rec', 'Sep'), 0) + TR.get(('rec', 'Oct'), 0))), m(r2(TR.get(('fc', 'Sep'), 0) + TR.get(('fc', 'Oct'), 0))), m(r2(TR.get(('plan', 'Sep'), 0) + TR.get(('plan', 'Oct'), 0)))),
 'Supplier side: estimates stay estimates until the invoices come; the consumables and forklift POs’ status is from Coates’ system (1 Nov), not the record; Coates wages are hours only (no pay rate applied).',
 'Carriers to a contract: %s of the loads to date carry no docket that Baseplan (12) ties to a hire contract (the fencing loads, %s, among them). WC01’s 570.00 now ties to 9968955 by its own docket, 26102678, as Schedule 17 has it. The carrier invoices or the dockets will tie the rest.' % (m(r2(_nd + _nb)), m(FENCE_REC)),
 'Forklift re-hire, Queensland Forklifts, a cost to Coates (own use; not charged to the V8s, 9961976 L31 and L34 at 0.00): 4647983, the 5 t forklift for the fencing at Phillip Park, at its three PO lines (2,820.00), an estimate until invoiced, with its months estimated from the PO’s approximate durations (not service dates); 4654789, AT009, 17–18 Sep, 950.00, invoiced.',
 'Alfie Harris: his 5 Oct night has no shift for him on the record; confirm it against the hotel invoice. His 12–15 and 23–25 Oct nights were taken off on 1 Nov (he did not work then).',
 'On the page but on no invoice: the line-by-line list (KINP 5,268.23 · STPS 20,206.68 · NVAC 943.55 · MEAD 2,769.70): to chase or drop.',
 'Possible extra revenue: 9968955 L143 Cleaning & Restock Sewer Connect (Delivered from 18 Oct, 24 × 260.25 = 6,246.00 at the card rate: the eight sewer-connected blocks WC09, WC15, WC16 and WC17 × the 3 event nights; Baseplan (12) has it billed 0.00, and invoice 25122322 bills L141, L142 and L144–L146 beside it but has no line for L143); 9973977, the WC-TV block’s 3 event-night cleans (T0243, 1311144; 3 × 260.25 = 780.75), no cleaning line on the contract; 10000523 L10 track-mat pick-up (quoted 150.00, not billed); WB02 to 3 Nov (about 1,500.00), WB03 (354.00); 9994954, invoiced to 26 Oct 07:00 on 25123999: hire after that for anything still on site; generator hire after 28 Oct and fuel; and a VMS credit if 10001927 and 9961265 carry the same boards (−1,072.20). The 350 kVA transport (1,200.00) is already billed: 9961976 L55, 2 × 600.00.']
PACK_HTML = ("<h2>0 · The job by branch</h2><p class='s'>Revenue is the 18 invoices to V8 Supercars (all October; 25124396, 1,974.05, is invoiced to Gold Coast Helitours and is not GC500 revenue) plus November's forecast; the two scrim invoices 25120652 and 25120689 are STPS on their headers and Baseplan (12)'s sales codes; costs are the management view at job end, by the branch that carries them. Labour hire on the water barriers is journaled to STPS, and Ludwig Chee's three event nights to NVAC with his hours; the rest of the people's costs sit on KINP. Transport sits on the branch whose equipment it moves (VMS on STPS, generators on NVAC, forklifts on MEAD): the record’s branch, with the concert generators’ delivery moved to NVAC and the three September forklift deliveries to MEAD; a load with no branch goes by what it carries (the fencing loads to STPS with the fencing). Revenue is booked in October, the invoice month; the November hire days on those invoices are shown in section 3.</p>"
  + tbl(['Branch', '#Invoiced (Oct)', '#November forecast', '#Revenue', '#Costs', '#Difference', '#Kept'], srow)
  + "<h3>Costs by branch</h3>" + tbl(['Cost', '#Amount'], crowB)
  + "<h2>4 · Journals prepared for Finance, through 31 Oct</h2>" + tbl(['Journal', 'PO', 'Hire contract (where charged)', 'Account', 'Branch', '#Amount'], jrow)
  + "<h3>Branch moves at 31 Oct (cost journals, not accruals)</h3>" + tbl(['Journal', 'PO', 'Hire contract', 'Account', 'Legs (zero net)', '#Amount'], mrow)
  + "<p class='s'>Labour journals (hours; Coates wages and salary are hours only): see section 2b, each person from their home branch to the branch of the work, with the contract named outside KINP.</p>"
  + "<h2>5 · Open items</h2><ul>" + ''.join('<li>' + e(o) + '</li>' for o in OPEN) + "</ul>")

# ---------------- Excel workbook
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.properties import PageSetupProperties
from openpyxl.worksheet.page import PageMargins
# ---------------- v1.15: every purchase order in the costs, and the costs with no PO on the record (Andrew, 1 Nov 2026: "Please make sure we
#                  mentioned purchase order numbers. And hire contract numbers. Everything must talk to each other. And all add up and match.").
#                  Each PO at its amount in this P&L (ex GST) with its supplier, what, hire contract and status; each cost with no PO says why.
#                  No new figure: every amount is a cost line's, split by PO where a line carries more than one (by the weeks or people on each PO).
_RECPO = {o['number']: o for o in json.load(open(P / 'cost_sources.json'))['pos']}   # the record's POs (12640 capture)
_POSYS = json.load(open(P2 / 'po_system.json'))['pos']                               # the six consumables POs in Coates' system, 1 Nov (private)
POREG, NOPO = [], []
def _preg(po, sup, what, con, br, amt, st): POREG.append({'po': po, 'supplier': sup, 'what': what, 'contract': con, 'branch': br, 'amount': r2(amt), 'status': st})
def _nopo(sup, what, con, br, amt, why): NOPO.append({'supplier': sup, 'what': what, 'contract': con, 'branch': br, 'amount': r2(amt), 'why': why})
_row = lambda r: r2(r[6] + r[7] + r[8])
_KINPW = 'KINP work (no contract number)'
# Advanced: the seven receipted orders at their amounts on the record (receipts in the cost line's order); the two open orders at the journals' amounts
_ADV = [r for r in C if r[0].startswith('Advanced')]
_advp = ['4647508', '4647509', '4647515', '4647517', '4647519', '4647520', '4658850']
_advr = re.findall(r'\b49\d{5}\b', _ADV[0][5])
assert len(_ADV) == 3 and _ADV[0][4].split(' · ') == _advp and len(_advr) == 7, (_ADV[0][4], _advr)
for p_, rc_ in zip(_advp, _advr):
    _n = str(_RECPO[p_].get('note') or ''); _iv = re.match(r'INV (\d+) - (.+)$', _n); _gc = re.search(r'Advanced invoice (GC\d+)', _n)
    w_ = _RECPO[p_].get('what') or ('%s (Advanced INV %s)' % (_iv.group(2).lower(), _iv.group(1)) if _iv else 'no description on the PO')   # v1.16 (pos-06): the record's note
    _preg(p_, 'Advanced Temporary Fencing', w_ + (' (week 1)' if p_ == '4647520' else ''), on('9990776'), 'STPS', float(_RECPO[p_]['amount']),
          'receipted (%s)' % rc_ + ('; Advanced invoice %s' % (_gc.group(1) if _gc else _iv.group(1)) if (_gc or _iv) else ''))   # v1.16 (pos-05): receipts, not invoices
assert abs(sum(x['amount'] for x in POREG) - _row(_ADV[0])) < 0.005, sum(x['amount'] for x in POREG)
_aj = {j[1]: j[5] for j in JOURNALS if j[0].startswith('Accrual · Advanced')}
assert set(_aj) == {'4647522', '4647523'} and abs(_aj['4647522'] + _aj['4647523'] - _row(_ADV[1])) < 0.005 and _row(_ADV[2]) == 750.00, (_aj, _ADV[1][:5])
_preg('4647522', 'Advanced Temporary Fencing', 'Event week 19–25 Oct: our dockets and notes at Advanced’s rates', on('9990776'), 'STPS', _aj['4647522'], 'open, nothing invoiced: accrued')
_preg('4647523', 'Advanced Temporary Fencing', 'Demob week 1, 26–29 Oct, %s (accrued) · demob week 2, 750.00 (November forecast)' % m(_aj['4647523']), on('9990776'), 'STPS', _aj['4647523'] + 750.00, 'open, nothing invoiced: accrued and forecast')
# Job Connect: each week's PO at the invoice, the PO amount or the running sheet, by the people named on each PO on the record
_JCW = {r[3].replace('Running sheet ', ''): r for r in C if r[0].startswith('Job Connect')}
_LP = collections.defaultdict(float)   # the running sheet's labour hire cost by person and week ending
for r_ in csv.reader(open(SP / 'GC500_labour_by_month_and_branch.csv', encoding='utf-8-sig')):
    if r_ and r_[0][:4] == '2026' and r_[3] == 'Labour hire' and r_[5] not in ('', 'hours only'):
        d_ = dt.date.fromisoformat(r_[0]); _LP[(r_[2], (d_ + dt.timedelta(days=6 - d_.weekday())).isoformat())] += float(r_[5])
_who = lambda p_: _RECPO[p_]['what'].replace(' - week ending ', ', w/e ').replace(' 2026', '')
for p_, wk_ in (('4657010', 'w/e 20 Sep'), ('4660565', 'w/e 27 Sep'), ('4661783', 'w/e 4 Oct')):
    assert abs(_row(_JCW[wk_]) - float(_RECPO[p_]['amount'])) < 0.005, (p_, wk_)
    _preg(p_, JC_NAME, _who(p_), _KINPW, 'KINP', _row(_JCW[wk_]), 'invoiced' + (' (the GC500 share)' if p_ == '4660565' else ''))
assert abs(_row(_JCW['w/e 11 Oct']) - JCPO['4665091']) < 0.005
_preg('4665091', JC_NAME, _who('4665091'), _KINPW, 'KINP', JCPO['4665091'], 'invoiced')
assert _who('4667755') == 'Eric Lucian and Daniel Gough, w/e 18 Oct' and _who('4668970') == 'Kyle Gover, w/e 18 Oct', (_who('4667755'), _who('4668970'))
_a = r2(_LP[('Daniel Gough', '2026-10-18')] + _LP[('Eric Lucian', '2026-10-18')]); _b = r2(_LP[('Kyle Gover', '2026-10-18')])
assert abs(_a + _b - _row(_JCW['w/e 18 Oct'])) < 0.005, (_a, _b)
_preg('4667755', JC_NAME, _who('4667755') + ' (Eric Lucian’s GC500 hours only)', _KINPW, 'KINP', _a, 'not invoiced: accrued at the running sheet')
_preg('4668970', JC_NAME, _who('4668970'), _KINPW + '; his 8 h on 15 Oct are on ' + on('9972648') + ' (460.78, journaled to STPS)', 'KINP', _b, 'not invoiced: accrued at the running sheet')
assert abs(JCPO['4670882'] + JCPO['4671825'] - _row(_JCW['w/e 25 Oct'])) < 0.005
_preg('4670882', JC_NAME, _who('4670882'), _KINPW, 'KINP', JCPO['4670882'], 'invoiced')
_preg('4671825', JC_NAME, _who('4671825'), _KINPW, 'KINP', JCPO['4671825'], 'invoiced')
_nopo(JC_NAME, 'Daniel Gough and Kyle Gover, w/e 1 Nov', _KINPW, 'KINP', _row(_JCW['w/e 1 Nov']), 'no PO yet: accrued at the running sheet')
_k8 = r2(_row(_JCW['w/e 8 Nov']) - JCP['4674224']['amount']); assert abs(_k8 - _LP[('Kyle Gover', '2026-11-08')]) < 0.005, _k8
_preg('4674224', JC_NAME, 'Daniel Gough, w/e 8 Nov', _KINPW, 'KINP', JCP['4674224']['amount'], 'November: the PO amount, an estimate until invoiced')
_nopo(JC_NAME, 'Kyle Gover, w/e 8 Nov', _KINPW, 'KINP', _k8, 'no PO yet: November, at the running sheet')
assert abs(_row(_JCW['w/e 15 Nov']) - JCP['4674225']['amount']) < 0.005
_preg('4674225', JC_NAME, 'Daniel Gough, w/e 15 Nov', _KINPW, 'KINP', JCP['4674225']['amount'], 'November: the PO amount, an estimate until invoiced')
# consumables and the forklifts: each PO at its amount in Coates' system, its status from there (1 Nov)
for r in C:
    if r[4] in _POSYS:
        x_ = _POSYS[r[4]]; assert abs(_row(r) - x_['ex_gst']) < 0.005, r[4]
        st_ = 'completed and invoiced' if x_['fully_invoiced'] else 'received in full, not invoiced' if x_['fully_received'] else 'partly received, not invoiced' if x_['received_inc'] else 'confirmed, nothing received'
        _preg(r[4], r[0], r[3], CONS_ON[r[4]], r[1], _row(r), st_ + ' (Coates’ system, 1 Nov)')
    elif r[0] == 'Queensland Forklifts':
        p_ = r[4].split(' ')[0]; f_ = FPO[p_]; assert abs(_row(r) - f_['ex_gst']) < 0.005, p_
        st_ = 'completed, received and invoiced' if f_['fully_invoiced'] else 'partly received (%s), nothing invoiced: an estimate until invoiced, its months estimated from the PO’s durations' % m(r2(f_['received_inc'] / 1.1))
        _preg(p_, r[0], r[3], on('9961976') + (' L31' if p_ == '4647983' else ' L34') + ', own use at 0.00', r[1], _row(r), st_ + ' (Coates’ system, 1 Nov)')
# the costs with no PO on the record, line by line, with why
for r, ch_ in zip(C, CH):
    if r[0] == 'Event Portables': _nopo(r[0], r[3], ch_, r[1], _row(r), 'no PO or invoice on the record: the quotes at the counted quantities (estimate)')
    elif r[0].startswith('Premiair'): _nopo(r[0], r[3], ch_, 'KINP · NVAC (VMS24)', _row(r), 'no PO on the record: the sub-hire cost lines in Coates’ system')
    elif r[0].startswith('United Rentals'): _nopo(r[0], r[3], ch_, 'STPS', _row(r), 'no PO on the record: its sub-hire cost line in Coates’ system')
    elif r[0].startswith('Carriers'): _nopo(r[0], r[3], 'each load by its docket (By hire contract lists them)', 'by load', _row(r), 'no carrier PO or invoice on the record: ' + ('the schedule’s figures' if r[3].startswith('Loads to date') else 'forecast at the card rate, else the load average' if r[3].startswith('Loads on the schedule with no figure') else 'forecast for the planned loads'))   # v1.16 (pos-09)
    elif r[0].startswith('Accommodation'): _nopo(r[0], r[3], ch_, r[1], _row(r), 'no PO: the tracker')
    elif r[0].startswith('Meals'): _nopo(r[0], r[3], ch_, r[1], _row(r), 'no PO: the tracker')
    elif r[0].startswith('Salary'): _nopo(r[0], r[3], ch_, r[1], _row(r), 'payroll, no PO')
POREG.sort(key=lambda x: x['po'])
PO_TOT = r2(sum(x['amount'] for x in POREG)); NOPO_TOT = r2(sum(x['amount'] for x in NOPO))
assert abs(PO_TOT + NOPO_TOT - JOB_COST) < 0.005, (PO_TOT, NOPO_TOT, JOB_COST)
assert len({x['po'] for x in POREG}) == len(POREG) == 27, len(POREG)
_inl = set(re.findall(r'\b4\d{6}\b', ' '.join(str(r[4]) for r in C)))
assert _inl == {x['po'] for x in POREG} and set(_RECPO) <= _inl, (_inl ^ {x['po'] for x in POREG}, set(_RECPO) - _inl)
assert all(str(r[4]).strip() for r in C), [r[:5] for r in C if not str(r[4]).strip()]   # every cost line names its PO, or says there is none
assert all(str(ch_).strip() for ch_ in CH)                                                # and where it is charged
porow = ''.join("<tr><td><b>%s</b></td><td>%s<br><span class='w'>%s</span></td><td><span class='w'>%s</span></td><td>%s</td><td class='n'>%s</td><td><span class='w'>%s</span></td></tr>" % (
    e(x['po']), e(x['supplier']), e(x['what']), e(x['contract']), e(x['branch']), m(x['amount']), e(x['status'])) for x in POREG)
porow += "<tr class='sub'><td>%d POs</td><td></td><td></td><td></td><td class='n'>%s</td><td></td></tr>" % (len(POREG), m(PO_TOT))
porow += "<tr class='sec2'><td colspan='6'><b>No PO on the record</b></td></tr>" + ''.join("<tr><td>none</td><td>%s<br><span class='w'>%s</span></td><td><span class='w'>%s</span></td><td>%s</td><td class='n'>%s</td><td><span class='w'>%s</span></td></tr>" % (
    e(x['supplier']), e(x['what']), e(x['contract']), e(x['branch']), m(x['amount']), e(x['why'])) for x in NOPO)
porow += "<tr class='sub'><td>No PO</td><td></td><td></td><td></td><td class='n'>%s</td><td></td></tr>" % m(NOPO_TOT)
porow += "<tr class='sub'><td>The job cost</td><td></td><td></td><td></td><td class='n'>%s</td><td>with a PO %s · no PO %s</td></tr>" % (m(JOB_COST), m(PO_TOT), m(NOPO_TOT))
POREG_HTML = ("<h2>3c · Every purchase order in the costs, and the costs with no PO</h2><p class='s'>Each of the %d POs at its amount in this P&amp;L (AUD ex GST), "
              "with the hire contract it is charged on and its status. Where a cost line carries two POs, it is split by the weeks or people named on each. "
              "Below them, every cost with no PO on the record, and why. Together they are the job cost, to the cent.</p>" % len(POREG)
              + tbl(['PO', 'Supplier · what', 'Hire contract', 'Branch', '#In the P&L', 'Status'], porow))
wb = Workbook(); MONEY = '#,##0.00;[Red]-#,##0.00'; HOURS = '#,##0.00'
def sheet(title, head, rows, money_cols=(), hour_cols=(), widths=None, first=False):
    ws = wb.active if first else wb.create_sheet()
    ws.title = title[:31]; ws.append(head)
    for c in ws[1]: c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor='1D2730'); c.alignment = Alignment(wrap_text=True, vertical='top')
    for r in rows: ws.append(list(r))
    for col in money_cols:
        for cell in ws.iter_rows(min_row=2, min_col=col, max_col=col):
            for c in cell: c.number_format = MONEY
    for col in hour_cols:
        for cell in ws.iter_rows(min_row=2, min_col=col, max_col=col):
            for c in cell: c.number_format = HOURS
    for i, w in enumerate(widths or [], 1): ws.column_dimensions[get_column_letter(i)].width = w
    for row in ws.iter_rows(min_row=2):
        for c in row:
            if isinstance(c.value, str): c.alignment = Alignment(wrap_text=True, vertical='top')
            elif c.value is not None: c.alignment = Alignment(vertical='top')
    ws.freeze_panes = 'A2'
    ws.page_setup.orientation = 'landscape'; ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True); ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
    ws.page_margins = PageMargins(left=0.4, right=0.4, top=0.7, bottom=0.6, header=0.3, footer=0.3)
    ws.print_title_rows = '1:1'; ws.print_area = 'A1:%s%d' % (get_column_letter(ws.max_column), ws.max_row)
    ncol_, merged_ = ws.max_column, set()   # v1.16 (Codex v1.15 recheck item 5): a note row (text in the first cell only) spans the table, sized for its width
    for row in ws.iter_rows(min_row=2):
        v_ = [c.value for c in row]
        if ncol_ > 1 and isinstance(v_[0], str) and len(v_[0]) > 40 and all(x in (None, '') for x in v_[1:]):
            ws.merge_cells(start_row=row[0].row, start_column=1, end_row=row[0].row, end_column=ncol_); row[0].alignment = Alignment(wrap_text=True, vertical='top')
            tw_ = sum((ws.column_dimensions[get_column_letter(i_)].width or 10) for i_ in range(1, ncol_ + 1))
            ws.row_dimensions[row[0].row].height = 15 * sum(max(1, -(-len(part) // max(1, int(tw_ * 1.05)))) for part in v_[0].split('\n')) + 3; merged_.add(row[0].row)
    for row in ws.iter_rows(min_row=1):   # row heights for wrapped text, so LibreOffice and Excel print every line of a long cell (Codex v1.8 recheck item 2)
        if row[0].row in merged_: continue
        lines = 1
        for c in row:
            if isinstance(c.value, str) and c.value:
                cw = ws.column_dimensions[get_column_letter(c.column)].width or 10
                cpl = max(1, int(cw * 1.05))
                lines = max(lines, sum(max(1, -(-len(part) // cpl)) for part in c.value.split('\n')))
        if lines > 1: ws.row_dimensions[row[0].row].height = 15 * lines + 3
    ws.oddHeader.left.text = 'GC500 P&&L pack v1.16 · ' + title; ws.oddHeader.right.text = 'As at 31 Oct 2026 · AUD, ex GST · record 12727'
    ws.oddFooter.left.text = 'Author: Andrew Fisher · private to the job team'; ws.oddFooter.right.text = 'Page &P of &N'
    return ws
ws_sum = sheet('Summary', ['Branch', 'Invoiced (Oct)', 'November forecast', 'Revenue', 'Costs', 'Difference'],
      [[b, REV_B.get(b, 0), NOV_REV.get(b, 0), r2(REV_B.get(b, 0) + NOV_REV.get(b, 0)), CB[b], r2(REV_B.get(b, 0) + NOV_REV.get(b, 0) - CB[b])] for b in ('KINP', 'STPS', 'NVAC', 'MEAD')]
      + [['The job', r2(sum(REV_B.values())), r2(sum(NOV_REV.values())), JOB_REV, JOB_COST, r2(JOB_REV - JOB_COST)], [],
         ['As at 31 Oct 2026 · AUD, ex GST · from the live record (12727), the 18 invoices to V8 Supercars (25124396, to Gold Coast Helitours, is not GC500 revenue), the purchase orders, Baseplan (12) and Schedule 17 · pack v1.16'],
         ['Revenue: the 18 invoices, %s, booked in October, the invoice month; and the November forecast, %s, the pick-up charge on 9961976 (L61, 29 Oct, NVAC), not invoiced yet. Costs are the management view at job end; some are estimates until invoiced, and Coates wages are hours only, not yet costed, so the difference is not a margin yet.' % (m(r2(sum(REV_B.values()))), m(r2(sum(NOV_REV.values()))))]],
      money_cols=range(2, 7), widths=[14, 16, 18, 16, 16, 16], first=True)
assert {r_.min_row for r_ in ws_sum.merged_cells.ranges} == {ws_sum.max_row - 1, ws_sum.max_row}   # v1.16: sheet() merges the two notes across the table, sized for the width
sheet('Revenue by invoice', ['Invoice', 'Date', 'Contract', 'V8s PO (on the contract)', 'Branch', 'Ex GST (booked in October)', 'Damage waiver', 'Sep hire incl. waiver, AUD ex GST (by time on hire)', 'Oct hire, AUD ex GST', 'Nov hire, invoiced in Oct, AUD ex GST', 'Services, sales, other, AUD ex GST (no dates)', 'POs against this contract'],
      [[r['inv'], r['date'], r['contract'], cpo(r['contract'], True)[3:], r['branch'] + ('' if r['cust'] == 'V8 Supercars' else ' · to ' + r['cust']), r['ex'], r['waiver'], r['m']['Sep'], r['m']['Oct'], r['m']['Nov'], r['svc'], pos_of(r['contract'])] for r in REV] + [['Total, 18 invoices', '', '', '', '', r2(sum(r['ex'] for r in REV)), r2(sum(r['waiver'] for r in REV)), RT['Sep'], RT['Oct'], RT['Nov'], UND, '']] + [[]] + [[i_['invoice'], i_['date'], i_['contract'], '', 'removed', None, None, None, None, None, None, 'Invoiced to Gold Coast Helitours, not V8 Supercars (ex GST 1,974.05): not GC500 revenue'] for i_ in REMOVED],
      money_cols=range(6, 12), widths=[10, 10, 10, 18, 7, 14, 12, 14, 12, 14, 15, 30])
mu_rows = []
for c_ in ORDER_C:
    its = MU.get(c_, []) or [('no supplier PO or cost on the record against it', '', None, '')]
    for j_, (a_, p_, v_, st_) in enumerate(its):
        mu_rows.append([c_, BR_OF[c_], cpo(c_, True)[3:] if j_ == 0 else '', INV_OF[c_], EX_OF[c_] if j_ == 0 else None, ONIT[c_] if j_ == 0 else '', a_, p_, v_, st_ + ((' · ' + NOTE[c_]) if (c_ in NOTE and j_ == 0) else '')])
for a_, p_, v_, st_ in NT: mu_rows.append(['not tied to one contract', '', '', '', None, '', a_, p_, v_, st_])
mu_rows.append(['The job', '', '', '18 invoices', r2(sum(EX_OF.values())), 'plus the November forecast 839.07 (NVAC, not invoiced yet)', 'All costs', '', r2(MU_TOT + NT_TOT), 'tied to a contract %.2f · not tied %.2f' % (MU_TOT, NT_TOT)])
sheet('Match-up by contract', ['Hire contract', 'Branch', 'V8s PO (on the contract)', 'V8s invoice', 'Invoice ex GST', 'What’s on it (the invoice’s biggest lines)', 'Our cost against it', 'PO', 'Cost', 'Status · notes'], mu_rows, money_cols=[5, 9], widths=[14, 7, 18, 10, 12, 28, 34, 24, 12, 40])
sheet('Purchase orders', ['PO', 'Supplier', 'What', 'Hire contract (where charged)', 'Branch', 'In the P&L, AUD ex GST', 'Status'],
      [[x['po'], x['supplier'], x['what'], x['contract'], x['branch'], x['amount'], x['status']] for x in POREG] + [['Total, %d POs' % len(POREG), '', '', '', '', PO_TOT, '']] + [[]]
      + [['No PO on the record', '', '', '', '', None, 'why']] + [['none', x['supplier'], x['what'], x['contract'], x['branch'], x['amount'], x['why']] for x in NOPO] + [['Total, no PO', '', '', '', '', NOPO_TOT, '']]
      + [['The job cost', '', '', '', '', JOB_COST, 'with a PO %.2f · no PO %.2f' % (PO_TOT, NOPO_TOT)]], money_cols=[6], widths=[11, 22, 40, 36, 12, 14, 40])   # v1.15
sheet('Costs by supplier', ['Supplier', 'Branch', 'Account', 'What', 'PO', 'Invoice / receipt', 'Charged on (hire contract · V8s invoice)', 'September', 'October', 'November', 'Accruals through 31 Oct', 'How dated', 'Status'],
      [list(r[:6]) + [ch_, r[6], r[7], r[8], r[9] if r[9] else None, r[10], r[11]] for r, ch_ in zip(C, CH)] + [['Total', '', '', '', '', '', '', tot[0], tot[1], tot[2], acc_total, '', '']], money_cols=range(8, 12), widths=[16, 9, 11, 30, 16, 20, 32, 11, 11, 11, 12, 22, 14])
sheet('Costs by branch', ['Branch', 'Cost', 'Amount'], [x for b, LL in COST_B.items() for x in [[b, k, v] for k, v in LL] + [['Total ' + b, '', CB[b]]]] + [['Total, the job', '', JOB_COST]], money_cols=[3], widths=[8, 80, 14])
sheet('Accruals vs charges', ['Supplier', 'What', 'Where we charged the V8s', 'Charged to the V8s', 'Cost basis', 'Cost (estimate where no invoice)'],
      [x for head, lines in ACC for x in [[head.split(' — ')[0], w_, wh, c_, bs, co] for w_, wh, c_, bs, co in lines] + [['Total, ' + head.split(' — ')[0], '', '', r2(sum(l[2] or 0 for l in lines)), 'charged less estimated cost: %s' % m(r2(sum(l[2] or 0 for l in lines) - sum(l[4] or 0 for l in lines))), r2(sum(l[4] or 0 for l in lines))]]], money_cols=[4, 6], widths=[18, 34, 32, 13, 32, 14])
sheet('Journals', ['Journal', 'PO', 'Hire contract (where charged)', 'Account', 'Branch', 'Amount'], [list(j) for j in JOURNALS] + [['Total, accruals through 31 Oct (prepared for Finance)', '', '', '', '', acc_total], [], ['Branch moves at 31 Oct (cost journals, not accruals; zero net)', '', '', '', 'Legs', '']] + [list(j) for j in MOVES] + [['Net across the branches', '', '', '', '', 0.0]], money_cols=[6], widths=[40, 26, 30, 28, 16, 12])
lab_rows = []
for who in sorted(HOME):
    home, typ = HOME[who]
    for b in ('KINP', 'STPS', 'NVAC'):
        hs = [PH.get((who, k, b), 0) for k in MO]
        if any(hs): lab_rows.append([who, typ, home, b, {'STPS': '9972648', 'NVAC': '9961976'}.get(b, ''), 'stays' if b == home else home + ' → ' + b] + [r2(x) for x in hs] + [r2(sum(PC.get((who, k, b), 0) for k in MO))])
sheet('Labour by person', ['Person', 'Type', 'Home branch', 'Branch of the work', 'Contract (outside KINP)', 'Journal', 'Sep h', 'Oct h', 'Nov h (to 13 Nov)', 'Labour hire $ (running sheet)'],
      lab_rows, money_cols=[10], hour_cols=[7, 8, 9], widths=[16, 40, 12, 12, 14, 16, 9, 9, 12, 16])
sheet('Labour charged', ['Branch', 'Labour charged (lines coded LABOUR on the 18 invoices)', 'Lines', 'Labour hire already in Installs (this pack)', 'Left for people’s cost'],
      [[b, LCB[b], sum(1 for x in LCL if x['b'] == b), LCI[b], LCLEFT[b]] for b in ('KINP', 'STPS', 'NVAC', 'MEAD')] + [['Total, the job', LC_TOT, len(LCL), r2(sum(LCI.values())), r2(sum(LCLEFT.values()))], []] + [[t] for t in LC_NOTES],
      money_cols=[2, 4, 5], widths=[16, 30, 8, 30, 24])
sheet('Labour lines', ['Branch', 'Invoice', 'Hire contract', 'Contract line', 'What (as invoiced)', 'Note on the line', 'Hours or units charged', 'Rate', 'Amount, AUD ex GST'],
      [[x['b'], x['inv'], x['contract'], 'L%s' % x['line'], x['what'], x['note'], x['hours'], x['rate'], x['amount']] for x in LCL] + [['Total, the job', '', '', '', '%d lines' % len(LCL), '', '', '', LC_TOT]],
      money_cols=[8, 9], hour_cols=[7], widths=[8, 11, 12, 10, 32, 18, 12, 10, 14])
sheet('Schedule 17 transport', ['Ref', 'Date', 'What', 'Hire contract · docket', 'Schedule 17', 'Figure', 'On the record before', 'Change', 'Branch'],
      S17_ROWS + [['12 loads', '', '', '', '', S17_ADD, 'forecasts replaced %s' % m(S17_WAS), S17_NET, ''], []] + [[t] for t in S17_NOTES],
      money_cols=[6, 8], widths=[8, 8, 30, 26, 14, 11, 22, 11, 8])
sheet('Open items', ['Open item'], [[o] for o in OPEN], widths=[110])
wb.save(OUT / 'GC500_PL_final.xlsx')
print('pack: revenue', JOB_REV, 'costs', JOB_COST, 'difference', r2(JOB_REV - JOB_COST), '| branches', CB, '| accrue', acc_total)

new_tiles = ("<div class='k'><div><span class='w'>Revenue (18 invoices + November forecast)</span><b>%s</b><span class='w'>the 18 invoices %s, all dated October (%s of their hire with waiver is for days in November) · the November forecast %s (9961976 L61), not invoiced yet</span></div><div><span class='w'>Costs (management view, job end)</span><b>%s</b><span class='w'>some are estimates until invoiced; Coates wages are hours only, not yet costed</span></div>"
             "<div><span class='w'>Difference so far</span><b>%s</b><span class='w'>%s of revenue; not a margin yet: Coates wages are not costed and some costs are estimates</span></div><div><span class='w'>Accruals through 31 Oct (the journals prepared for Finance; estimates where no invoice)</span><b>%s</b><span class='w'>carrier loads and the consumables and forklift POs are not in them: Finance to confirm</span></div></div>\n") % (
             m(JOB_REV), m(sum(r['ex'] for r in REV)), m(RT['Nov']), m(r2(JOB_REV - sum(r['ex'] for r in REV))), m(JOB_COST), m(JOB_REV - JOB_COST), '{:.1%}'.format((JOB_REV - JOB_COST) / JOB_REV), m(acc_total))
import re as _re
body = _re.sub(r"<div class='k'>.*?</div></div>\n", lambda _m: new_tiles, body, count=1, flags=_re.S)
body = body.replace("<h2>1 · Costs by supplier and month, with the accruals through 31 Oct</h2>", PACK_HTML.split('<h2>4 · Journals')[0] + "<h2>1 · Costs by supplier and month, with the accruals through 31 Oct</h2>")
body = body.replace('</main>', '<h2>4 · Journals' + PACK_HTML.split('<h2>4 · Journals')[1] + '</main>')
body = body.replace('<h2>5 · Open items', '<h2>6 · Open items').replace('<h2>4 · Journals', '<h2>5 · Journals')   # one number per section
assert body.count(MATCH_HTML) == 1; body = body.replace(MATCH_HTML, MATCH_HTML + POREG_HTML)   # v1.15: 3c, every PO in the costs
(OUT / 'GC500_PL_final.html').write_text('<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GC500 P&amp;L · job position at 31 Oct 2026 · pack v1.16</title><style>' + css + '</style></head><body>' + body + '</body></html>', encoding='utf-8')
# v1.10: the final P&L as data for the page's P&L tab (v12.72): the same figures as the workbook, to the cent. Private, beside the pack, not committed.
_BRS = ('KINP', 'STPS', 'NVAC', 'MEAD'); _SUP = collections.OrderedDict()
for r_ in C:
    v_ = _SUP.setdefault(r_[0], [0.0, 0.0, 0.0, 0.0]); v_[0] += r_[6]; v_[1] += r_[7]; v_[2] += r_[8]; v_[3] += (r_[9] or 0)
PLF = {'pack': 'v1.16', 'record': 12727, 'asAt': '2026-10-31', 'basis': 'AUD ex GST',
       'source': 'the live record (12727), the 18 invoices to V8 Supercars, the purchase orders and Schedule 17',
       'revenue': {'invoices': r2(sum(REV_B.values())), 'novForecast': r2(sum(NOV_REV.values())), 'total': JOB_REV},
       'costs': {'sep': tot[0], 'oct': tot[1], 'nov': tot[2], 'total': JOB_COST}, 'difference': r2(JOB_REV - JOB_COST), 'accrue': acc_total,
       'branches': [{'b': b, 'invoiced': r2(REV_B.get(b, 0)), 'novForecast': r2(NOV_REV.get(b, 0)), 'revenue': r2(REV_B.get(b, 0) + NOV_REV.get(b, 0)), 'costs': CB[b], 'difference': r2(REV_B.get(b, 0) + NOV_REV.get(b, 0) - CB[b])} for b in _BRS],
       'branchLines': {b: [[n_, r2(v_)] for n_, v_ in COST_B[b]] for b in _BRS},
       'suppliers': [{'name': k_, 'sep': r2(v_[0]), 'oct': r2(v_[1]), 'nov': r2(v_[2]), 'total': r2(v_[0] + v_[1] + v_[2]), 'accrue': r2(v_[3])} for k_, v_ in _SUP.items()],
       'lines': [{'supplier': r_[0], 'branch': r_[1], 'account': r_[2], 'what': r_[3], 'po': r_[4], 'invoice': r_[5], 'contract': ch_, 'sep': r2(r_[6]), 'oct': r2(r_[7]), 'nov': r2(r_[8]), 'accrue': (r2(r_[9]) if r_[9] else 0), 'basis': r_[10], 'status': r_[11]} for r_, ch_ in zip(C, CH)],
       'journals': [{'journal': a_, 'po': b_, 'contract': k_, 'account': c_, 'branch': d_, 'amount': r2(v_)} for a_, b_, k_, c_, d_, v_ in JOURNALS],
       'moves': [{'journal': a_, 'po': b_, 'contract': k_, 'account': c_, 'branch': d_, 'amount': r2(v_)} for a_, b_, k_, c_, d_, v_ in MOVES],
       'open': list(OPEN),
       'labourCharged': {'branches': [{'b': b, 'charged': LCB[b], 'lines': sum(1 for x in LCL if x['b'] == b), 'installLabourHire': LCI[b], 'left': LCLEFT[b]} for b in _BRS],
                         'total': LC_TOT, 'installTotal': r2(sum(LCI.values())), 'leftTotal': r2(sum(LCLEFT.values())), 'lines': LCL, 'notes': LC_NOTES},
       'schedule17': {'changes': [dict(zip(('ref', 'date', 'what', 'contractDocket', 'row', 'figure', 'before', 'change', 'branch'), r_)) for r_ in S17_ROWS],
                      'added': S17_ADD, 'forecastsReplaced': S17_WAS, 'net': S17_NET, 'byBranch': S17_BR, 'forkliftsToMead': FORK_TOT, 'notes': S17_NOTES},
       'contractPOs': {c_: cpo(c_, True)[3:] for c_ in ORDER_C},
       'invoices': [{'inv': r_['inv'], 'date': r_['date'], 'contract': r_['contract'], 'customerPO': cpo(r_['contract'], True)[3:], 'branch': r_['branch'], 'ex': r2(r_['ex']), 'pos': pos_of(r_['contract'])} for r_ in REV],
       'novForecastLines': [{'contract': '9961976', 'line': 'L61', 'what': 'pick-up charge, 29 Oct: applied on Baseplan (12), not invoiced yet', 'branch': 'NVAC', 'amount': NOV_REV['NVAC']}],
       'removedInvoices': [{'inv': i_['invoice'], 'contract': i_['contract'], 'ex': r2(i_['ex_gst']), 'why': 'invoiced to Gold Coast Helitours, not V8 Supercars: not GC500 revenue'} for i_ in REMOVED],
       'contracts': [{'contract': c_, 'branch': BR_OF[c_], 'customerPO': cpo(c_, True)[3:], 'invoice': INV_OF[c_], 'revenue': r2(EX_OF[c_]), 'onIt': ONIT[c_], 'note': NOTE.get(c_, ''),
                      'costs': [{'what': a_, 'po': p_, 'amount': (None if v_ is None else r2(v_)), 'status': st_} for a_, p_, v_, st_ in MU.get(c_, [])], 'costTotal': r2(sum(x_[2] or 0 for x_ in MU.get(c_, [])))} for c_ in ORDER_C],
       'notTied': [{'what': a_, 'po': p_, 'amount': r2(v_), 'status': st_} for a_, p_, v_, st_ in NT],
       'matchTotals': {'invoices': r2(sum(EX_OF.values())), 'tied': MU_TOT, 'notTied': NT_TOT, 'costs': r2(MU_TOT + NT_TOT)},
       'purchaseOrders': POREG, 'noPO': NOPO, 'poTotals': {'count': len(POREG), 'withPO': PO_TOT, 'noPO': NOPO_TOT, 'total': r2(PO_TOT + NOPO_TOT)}}
assert (PLF['revenue']['total'], PLF['costs']['total'], PLF['difference'], PLF['accrue']) == (1001902.14, 552533.71, 449368.43, 195076.18), PLF['revenue']
assert abs(sum(x['total'] for x in PLF['suppliers']) - PLF['costs']['total']) < 0.005 and abs(sum(x['costs'] for x in PLF['branches']) - PLF['costs']['total']) < 0.005
assert abs(sum(x['ex'] for x in PLF['invoices']) - PLF['revenue']['invoices']) < 0.005 and abs(sum(x['amount'] for x in PLF['novForecastLines']) - PLF['revenue']['novForecast']) < 0.005   # v1.15: everything ties
assert abs(sum(x['revenue'] for x in PLF['contracts']) - PLF['revenue']['invoices']) < 0.005 and abs(PLF['matchTotals']['costs'] - PLF['costs']['total']) < 0.005 and abs(PLF['poTotals']['total'] - PLF['costs']['total']) < 0.005
assert abs(sum(x['costTotal'] for x in PLF['contracts']) + sum(x['amount'] for x in PLF['notTied']) - PLF['costs']['total']) < 0.005 and len(PLF['invoices']) == len(PLF['contracts']) == 18
assert abs(sum(x['accrue'] for x in PLF['suppliers']) - PLF['accrue']) < 0.005 and abs(sum(j['amount'] for j in PLF['journals']) - PLF['accrue']) < 0.005
(OUT / 'GC500_PL_final.json').write_text(json.dumps(PLF, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print('costs Sep %.2f Oct %.2f Nov %.2f = %.2f · accrue %.2f' % (tot[0], tot[1], tot[2], sum(tot), acc_total))
print('revenue hire $ by days on hire Sep %.2f Oct %.2f Nov %.2f · undated %.2f · total %.2f' % (RT['Sep'], RT['Oct'], RT['Nov'], UND, RT['Sep'] + RT['Oct'] + RT['Nov'] + UND))
print('labour hire cost by month', {k: round(v, 2) for k, v in LH.items()})
for typ in ('Coates wages', 'Salary', 'Labour hire'): print(typ, {(b, k): round(L.get((typ, b, k), 0), 1) for b in ('KINP', 'STPS', 'NVAC') for k in MO if L.get((typ, b, k))})
