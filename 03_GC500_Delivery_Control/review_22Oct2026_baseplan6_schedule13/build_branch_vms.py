"""Author: Andrew Fisher. The VMS list for the branch (9961265): every board on Baseplan against our record (fleet, rego, the day it
went in), the hire each board earns at the card from its on-site day, and the labour and transport lines at the counts
that are done.
    python3 -I build_branch_vms.py <private dir>      (bp6.json and state_now.json in it)
"""
import json, re, sys, datetime as dt, collections
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter as col
HERE = Path(__file__).resolve().parent; PRIV = Path(sys.argv[1])
bp = json.load(open(PRIV / 'bp6.json')); st = json.load(open(PRIV / 'state_now.json')); docs = st.get('docs', st)
RATE = 53.6115; LAB_EACH = 88.485; LAB_LINE = 176.97; TODAY = dt.date(2026, 10, 22); RACE_END = dt.date(2026, 10, 25); MIN_DAYS = 7
LOADS = {'T0001': '2026-09-07', 'T0128': '2026-10-16', 'T0158': '2026-10-19'}   # the Timeline loads the record points at
vb = docs['vmsboard']
M = json.load(open(PRIV / 'vms_model.json')); IDN = {}; ONWORD = {}
for p_ in M['positions']:
    i_ = p_.get('identity') or {}; IDN.setdefault(p_['board'], i_)
for b_ in M['boards913']:
    o_ = b_.get('on') or {}
    if o_.get('src') == 'word' and o_.get('said'): ONWORD[b_['key']] = dt.datetime.strptime(o_['said'], '%d %b %Y').date().isoformat()
# our on-site day for each board, and where it comes from. The record's own arrival events first (VMS21, 22, 24 carry them);
# else the day Andrew recorded the board on site (AEST); the Timeline load it is recorded on is shown beside it.
pos_events = {}
for k, v in docs['loads'].items():
    if isinstance(v, dict) and v.get('kind') == 'vms1024':
        ev = [e for e in (v.get('events1098') or []) if e.get('state') == 'on site']
        if ev: pos_events[v['pos']] = ev[-1]['effective_date']
def aest_day(iso):
    t = dt.datetime.fromisoformat(iso.replace('Z', '+00:00')) + dt.timedelta(hours=10); return t.date().isoformat()
# Andrew's word, 22 Oct 2026: today's deliveries were the VMS boards (VMS21, 22 and 24 on docket 26143911)
WORD = {'VMS22': ('2026-10-22', "Andrew, 22 Oct: today's delivery (docket 26143911); our record said 21 Oct and is to be corrected"),
        'VMS24': ('2026-10-22', "Andrew, 22 Oct: today's delivery (docket 26143911); our record said 21 Oct and is to be corrected")}
def ours(board_key, item):
    rec = dict(vb.get(board_key) or vb.get(item) or {})
    idn = IDN.get(board_key) or IDN.get(item) or {}
    if not rec.get('fleet') and idn.get('asset') and not str(idn.get('asset')).isdigit(): rec['fleet'] = idn['asset']   # a Premiair fleet number the register holds
    if not rec.get('rego') and idn.get('rego'): rec['rego'] = idn['rego']
    pos = board_key[3:] if board_key.startswith('VMS') else None
    if board_key in ONWORD and board_key not in WORD: return ONWORD[board_key], f"Andrew's word on the page: on site {ONWORD[board_key]}", rec
    if board_key in WORD: return WORD[board_key][0], WORD[board_key][1], rec
    if pos and pos in pos_events: return pos_events[pos], 'arrival on the record', rec
    if rec.get('on') in LOADS and rec.get('at'):
        rd = aest_day(rec['at']); ld = LOADS[rec['on']]
        return rd, f"recorded on site {rd} by {rec.get('by', '').split(' via ')[0]} (on Timeline load {rec['on']}, {ld})", rec
    if rec.get('at') and rec.get('line', '').startswith('9961265'):
        return None, f"on our register (rego {rec.get('rego')}) but no arrival day recorded", rec
    return None, 'not on our register', rec
dd = collections.defaultdict(list)
for r in bp['Delivery Dockets']:
    if str(r.get('Hire Agreement')) == '9961265':
        dd[str(r.get('Fleet item')).upper() + '|' + re.sub(r'\s.*', '', str(r.get('Description')))].append((str(r.get('Date Delivery'))[:10], r.get('Direction'), r.get('Delivery Docket')))
wb = Workbook(); ws = wb.active; ws.title = '9961265 by board'
H = Font(bold=True); RED = PatternFill('solid', fgColor='F8CBAD'); AMB = PatternFill('solid', fgColor='FFE699'); TOT = PatternFill('solid', fgColor='E2EFDA')
ws.append(['Line', 'Board', 'Baseplan item', 'Baseplan fleet', 'Our fleet', 'Our rego', 'Baseplan start', 'Docket out', 'Our on-site day', 'Our basis', 'Baseplan expected term',
           'Days to 22 Oct (ours)', 'Hire to 22 Oct', 'Race days 23-25 Oct', 'Hire to 25 Oct (min 7 days)', 'Baseplan prebill', 'Baseplan days billed', 'Install (done)', 'Demob (at demob)', 'Delivery leg (done)', 'Pickup leg (at demob)', 'Fix needed on Baseplan / question'])
for c in ws[1]: c.font = H; c.alignment = Alignment(wrap_text=True, horizontal='center')
T = collections.Counter(); boards = 0
for d in bp['9961265']:
    if str(d.get('Item Type')) != '1': continue
    desc = str(d.get('Description', '')); m = re.match(r'^(VMS\d+\w*)\s+(\d+T)?', desc); board = m.group(1) if m else ''; bpfleet = m.group(2) if m else ''
    it = str(d.get('Item', '')).upper(); key = board[:5] if board else it
    if board == 'VMS05a': key = 'VMS05'
    on, basis, rec = ours(key, it)
    docks = dd.get(it + '|' + board, []) or dd.get(it + '|' + re.sub(r'\s.*', '', desc), [])
    outd = sorted(x[0] for x in docks if x[1] == 'Out'); ind = sorted(x[0] for x in docks if x[1] == 'In')
    bstart = str(d.get('Start Date'))[:10]; bterm = str(d.get('Term Date'))[:10] if d.get('Term Date') else ''; bexp = str(d.get('Expected Term Date'))[:10]
    if not board and not on and bstart == '2026-09-07': on, basis = '2026-09-07', 'the eight boards of 7 Sep (docket 26053081 and following; Timeline load T0001)'
    fix = []; fill = None
    if d.get('Status') == 'Returned':
        indock = [x[2] for x in docks if x[1] == 'In']
        fix.append(f"returned: Baseplan term {bterm} (16 days billed), but the return docket {indock[0] if indock else '?'} is dated {ind[0] if ind else '?'}, the same morning 1211404 went out again as VMS09 (line 12). Was the board off site from {bterm}, or on site all along? If on site, 20 days (23 Sep - 12 Oct) are unbilled"); fill = AMB
        ws.append([d.get('Line'), board or 'Senior (returned)', it, bpfleet, rec.get('fleet') or '', rec.get('rego') or '', bstart, ', '.join(outd), '', 'returned ' + bterm, bexp, '', '', '', '', d.get('Prebill Amount'), round(d.get('Prebill Amount', 0) / RATE, 1), '', '', '', '', '; '.join(fix)])
        for c in ws[ws.max_row]: c.fill = fill
        continue
    boards += 1
    if on:
        days22 = (TODAY - dt.date.fromisoformat(on)).days + 1; h22 = round(days22 * RATE, 2); race = 3 if on <= '2026-10-25' else 0
        d25 = days22 + race; h25 = round(max(d25, MIN_DAYS) * RATE, 2)
    else: days22 = h22 = race = h25 = None
    if bpfleet and rec.get('fleet') and bpfleet != rec.get('fleet'): fix.append(f"fleet: Baseplan {bpfleet}, our record {rec.get('fleet')}"); fill = RED
    if not bpfleet and rec.get('fleet') and 'Premiair' in desc: fix.append(f"add fleet {rec.get('fleet')} (rego {rec.get('rego')}) to the line"); fill = RED
    if bpfleet and not rec.get('fleet') and board: fix.append(f"our register lacks fleet {bpfleet}"); fill = fill or AMB
    if on and bstart != on:
        diff = (dt.date.fromisoformat(bstart) - dt.date.fromisoformat(on)).days
        fix.append(f"start {bstart} -> {on} ({'Baseplan ' + str(diff) + ' day(s) short' if diff > 0 else 'Baseplan ' + str(-diff) + ' day(s) over'})"); fill = RED
    if on and outd and outd[0] != on: fix.append(f"docket out {outd[0]} differs from our day {on}"); fill = fill or AMB
    if not on: fix.append('our record has no on-site day: start from the docket ' + (outd[0] if outd else '?') + ' unless Andrew says otherwise'); fill = fill or AMB
    if board == 'VMS05a':
        fix.append("our register has 1211356 (rego ER9244) as the board at position 05a, pinned by Andrew 20 Oct 10:08 AEST, docket 26141143 the same morning, still on site: the line stays on hire to demob, so the 21 Oct term is wrong. The $289.52 delivery differs from the $150 a leg on line 41 - one rate or the other"); fill = RED
    if bexp and on and bexp <= '2026-10-25' and board != 'VMS05a': fix.append(f'expected term {bexp} is before the race ends; boards stay to demob')
    if board == 'VMS21': fix.append('billed 4 days (22-25 Oct) with no 7-day minimum, while VMS18-20 and 23 are billed the 7-day minimum - one rule or the other')
    if board == 'VMS13': fix.append('VMS14 and VMS15 on the same docket (26134263, 16 Oct) were recorded on site 16 Oct; VMS13 was recorded 19 Oct - confirm 16 Oct with Andrew, then start 16 Oct')
    if board in ('VMS16', 'VMS17'): fix.append('recorded on site 16 Oct 12:09 AEST by Andrew; the docket is 19 Oct - confirm with Andrew before the branch moves the start')
    ws.append([d.get('Line'), board or desc[:28], it, bpfleet, rec.get('fleet') or '', rec.get('rego') or '', bstart, ', '.join(outd), on or '', basis, bexp,
               days22, h22, race, h25, d.get('Prebill Amount'), round(d.get('Prebill Amount', 0) / RATE, 1), LAB_EACH, LAB_EACH, 150, 150, '; '.join(fix)])
    if fill:
        for c in ws[ws.max_row]: c.fill = fill
    if on: T['h22'] += h22; T['h25'] += h25; T['days22'] += days22
    T['bp'] += d.get('Prebill Amount', 0); T['inst'] += LAB_EACH; T['dem'] += LAB_EACH; T['del'] += 150; T['pick'] += 150
ws.append([]); ws.append(['TOTAL', f'{boards} boards', '', '', '', '', '', '', '', '', '', T['days22'], round(T['h22'], 2), '', round(T['h25'], 2), round(T['bp'], 2), '', round(T['inst'], 2), round(T['dem'], 2), T['del'], T['pick'], ''])
for c in ws[ws.max_row]: c.font = H; c.fill = TOT
for i, w in enumerate([6, 9, 11, 9, 8, 8, 11, 11, 11, 44, 11, 9, 10, 8, 11, 10, 9, 9, 9, 9, 9, 70]): ws.column_dimensions[col(i + 1)].width = w
for rw in ws.iter_rows(min_row=2, max_row=ws.max_row):
    for c in rw:
        if isinstance(c.value, float): c.number_format = '#,##0.00'
ws.freeze_panes = 'C2'; ws.row_dimensions[1].height = 45
# charge lines
cs = wb.create_sheet('9961265 charge lines')
cs.append(['Line', 'Baseplan line', 'Baseplan qty', 'Rate', 'Baseplan $', 'Correct qty', 'Correct $', 'Billable now $', 'Later $', 'Basis']); [setattr(c, 'font', H) for c in cs[1]]
svc = {str(d.get('Line')): d for d in bp['9961265'] if str(d.get('Item Type')) in ('2', '4')}
S = collections.Counter()
def row(ln, qty, amt, now, basis):
    d = svc[ln]; cs.append([ln, d['Description'], d['Quantity'], d['Price'], d['Prebill Amount'], qty, round(amt, 2), round(now, 2), round(amt - now, 2), basis]); S['bp'] += d['Prebill Amount']; S['ok'] += amt; S['now'] += now; S['later'] += amt - now
row('40', boards, boards * LAB_LINE, boards * LAB_EACH, f"{boards} boards x $176.97 (the card's one VMS labour figure, read as $88.49 install + $88.49 demob). Install done on every board on site; demob at demob. Baseplan charges the whole $176.97 before demob")
row('41', boards * 2, boards * 2 * 150, boards * 150, f"{boards} boards x 2 legs at Baseplan's $150 (the card says POA for VMS transport - the $150 is Baseplan's figure, to be confirmed). Delivery legs done; pickup legs at demob")
row('42', 2, 2 * 150, 2 * 150, "site shifts at $150: our record shows two relocations pinned on site (VMS05 -> 05a and VMS07 -> 07a, 20 Oct). 02a and 03a are not yet pinned. Baseplan's 8 shifts are not evidenced on our record - confirm the count with Andrew")
row('44', 0, 0, 0, "delivery for line 43 (VMS05a) at $289.52: every other VMS leg is $150 on this contract; if 1211356 is the relocated VMS05 this is a site shift (line 42), not a delivery")
cs.append([]); cs.append(['TOTAL', '', '', '', round(S['bp'], 2), '', round(S['ok'], 2), round(S['now'], 2), round(S['later'], 2), ''])
for c in cs[cs.max_row]: c.font = H; c.fill = TOT
for i, w in enumerate([6, 34, 10, 8, 12, 10, 12, 13, 11, 110]): cs.column_dimensions[col(i + 1)].width = w
cs.freeze_panes = 'A2'
n = wb.create_sheet('Notes')
for line in ["Author: Andrew Fisher. 22 Oct 2026. Our on-site day is the record: the board's own arrival event where it has one, else the day Andrew recorded the board on site (AEST), with the Timeline load it is recorded on beside it. Andrew's word today puts VMS22 and VMS24 on 22 Oct (docket 26143911).",
             'Rates: 2026 street card, ex GST. VMS Board $53.6115 a day from the day it goes in (the project manager\'s rule: VMS is charged from delivery), minimum 7 days on the card\'s traffic-management block. Labour $176.97 a board (the card\'s 2024 figure, read as $88.49 install + $88.49 demob). Transport: POA on the card; $150 a leg is Baseplan\'s figure.',
             'Hire to 22 Oct is what has run; race days 23-25 Oct are shown but not yet run; boards stay on hire to demob, so the hire to 25 Oct is not the final figure. Baseplan prebills to each line\'s expected term (13 Nov for the 7 Sep boards), which is why its prebill is higher on those.',
             'Rows shaded red need a Baseplan fix (last column); amber rows are questions for Andrew or our own record.']: n.append([line])
n.column_dimensions['A'].width = 170
out = HERE / 'GC500_9961265_VMS_for_Branch_22Oct2026.xlsx'; wb.save(out)
print('boards', boards, {k: round(v, 2) for k, v in T.items()}, 'charge lines', {k: round(v, 2) for k, v in S.items()})
for r in ws.iter_rows(min_row=2, values_only=True):
    if r[0]: print(r[0], r[1], r[3], r[4], r[5], '| bp', r[6], 'dock', r[7], 'ours', r[8], '|', r[11], r[12], r[14], 'bp$', r[15], r[16], '|', (r[21] or '')[:140])
