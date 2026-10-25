# Author: Andrew Fisher. 25 Oct 2026 - the fencing as it stands: what we charge the V8s and what we pay Advanced, item by item,
# by invoice status, the event week by day, and every docket. Andrew: "i dont want to know what it was beofre i want to know
# what we pay advanced and what we pay v8s", "is this including one we have not recieved a invoice for", "is the 255 including
# the event week from this week and friday and saturday", then "put in excel fopr me". Reads the three read-only dumps of the
# live page (dump_fence_pay_charge.cjs, dump_fence_split.cjs, dump_fence_invoices.cjs); writes
# GC500_Fencing_We_Pay_We_Charge_25Oct2026.xlsx. Values only (no formulas), so every viewer shows the figures; each total is
# checked against the page's own before the file is written.
#   python3 fence_we_pay_we_charge.py <fence_pay_charge.json> <fence_split.json> <fence_invoices.json>
import collections, datetime as dt, json, sys
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.worksheet.page import PageMargins

D, SPLIT, INV = (json.load(open(a)) for a in sys.argv[1:4])
HERE = Path(__file__).resolve().parent
cents = lambda v: int(round((v or 0) * 100))
d = lambda c: c / 100
use = [x for x in D['dockets'] if x['usable']]
COLS = {c['key']: c for c in D['columns']}

# --- what we charge the V8s: each docket's own lines, as the page prices them (the fence under the scrim off the clean)
CH_ITEMS = [('clean', 'Clean fence (not scrimmed)'), ('scrim', 'Scrim fence (fence + shade cloth)'), ('ccb_demarc', 'CCB demarcation'), ('ccb_event', 'CCB event'),
            ('flat_feet', 'CCB flat feet'), ('labour', 'Labour'), ('relocation', 'Relocation'), ('ped_gates', 'Pedestrian gates'), ('fence_blocks', 'Fence blocks'),
            ('v_gates', 'Vehicle gates')]
ch = {k: {'qty': 0, 'c': 0, 'rate': None} for k, _ in CH_ITEMS}
for x in use:
    for l in x['lines']:
        a = ch[l['column']]; a['qty'] += l['qty']; a['c'] += cents(l['cost']); a['rate'] = l['rate'] if a['rate'] is None or l['qty'] > 0 else a['rate']
CHARGE = sum(a['c'] for a in ch.values())
assert CHARGE == cents(sum(x['cost_total'] for x in use)) == cents(D['derived']['charged']), CHARGE

# --- what we pay Advanced: their approved billed lines where an order carries them, else their rate sheet on our dockets
PAY_ITEMS = [('clean', 'Clean fence'), ('scrim', 'Scrim fence (braced for scrim)'), ('ccb_demarc', 'CCB demarcation'), ('ccb_event', 'CCB event'), ('flat_feet', 'CCB flat feet'),
             ('labour', 'Labour'), ('relocation', 'Relocation (billed by the hour)'), ('ped_gates', 'Pedestrian gates'), ('v_gates', 'Vehicle gates'), ('bases', 'Bases')]
pay = {k: {'qty': 0, 'c': 0, 'rates': set()} for k, _ in PAY_ITEMS}
for x in use:
    for l in (x['supplier']['lines'] if x['supplier'] else x['lines']):
        if l['column'] not in pay: assert not (l.get('cents') or l.get('paid')), l; continue
        p = pay[l['column']]; p['qty'] += l['qty']; p['c'] += l['cents'] if x['supplier'] else cents(l['paid'])
        r = l['rate'] if x['supplier'] else l['paid_rate']
        if r is not None: p['rates'].add(r)
DOCKETS_PAY = sum(p['c'] for p in pay.values())
assert DOCKETS_PAY == cents(sum(x['paid_total'] for x in use)), DOCKETS_PAY
S, O, EX = SPLIT['split'], SPLIT['orders'], SPLIT['extras']
tl = [x for x in EX if x['column'] == 'team_leader']; mats = [x for x in EX if x['column'] != 'team_leader']
ADJ, GREEN = cents(O['adjustment']), cents(S['green'])
assert DOCKETS_PAY + sum(x['cents'] for x in EX) + ADJ == cents(S['paid'])
ADV = [o for o in INV['pos'] if o['po'].get('supplier_name') == 'Advanced Temporary Fencing']
OTHER = [o for o in ADV if not o['weeks']]
PAID = cents(S['paid']) + GREEN + sum(cents(o['po']['amount']) for o in OTHER)

# --- by week, then by invoice status
WEEK_OF_SHEET = {'CON WK6': 'Week 6', 'CON WK5': 'Week 5', 'CON WK4': 'Week 4', 'CON WK3': 'Week 3', 'CON WK2': 'Week 2', 'CON WK1': 'Week 1', 'EVENT WEEK': 'Event Week'}
po_week = {o['po']['number']: WEEK_OF_SHEET.get(o['po'].get('programme_sheet')) for o in ADV}
SPANS = [('Week 6', '2026-09-07', '2026-09-13'), ('Week 5', '2026-09-14', '2026-09-20'), ('Week 4', '2026-09-21', '2026-09-27'), ('Week 3', '2026-09-28', '2026-10-04'),
         ('Week 2', '2026-10-05', '2026-10-11'), ('Week 1', '2026-10-12', '2026-10-18'), ('Event Week', '2026-10-19', '2026-10-25')]
week_of_day = lambda day: next((w for w, a, b in SPANS if a <= (day or '') <= b), None)
W = collections.OrderedDict((w, {'pay': 0, 'charge': 0, 'n': 0, 'from': a, 'to': b}) for w, a, b in SPANS)
for x in use: W[x['week']]['pay'] += cents(x['paid_total']); W[x['week']]['charge'] += cents(x['cost_total']); W[x['week']]['n'] += 1
for x in EX: W[po_week[x['po']]]['pay'] += x['cents']
notes = [n for n in D['notes'] if n.get('usable') is not False]
for n in notes: W[week_of_day(n['date'])]['pay'] += cents(n['cost'])
for o in O['orders']: W[po_week[o['number']]]['pay'] += cents(o['adjustment'])
off_red = {r['id'] for r in INV['red'] if not r['onSheet']}; off_green = {(str(n['no']), n['date']) for n in INV['green'] if not n['onSheet']}
def status(o):
    po, sh = o['po'], o['sheet']
    if po.get('invoice_no'): return 'Invoice received'
    if sh and sh.get('valid'): return 'Approved sheet, no invoice yet'
    return 'Nothing from Advanced yet (our estimate)'
INVOICES = []
for w in W:
    o = next((x for x in ADV if po_week.get(x['po']['number']) == w), None)
    if not o: continue
    po, sh = o['po'], o['sheet']
    words = []
    if w == 'Week 6': words.append('no sheet came with the invoice; the order amount stands')
    if sh and sh.get('valid') and sh.get('difference'): words.append("Advanced's sheet says $" + format(sh['total'], ',.2f') + '; the order amount stands')
    if sh and (sh.get('source') or {}).get('po_as_printed') and sh['source']['po_as_printed'] != po['number']: words.append('their sheet prints the order as ' + sh['source']['po_as_printed'])
    miss = [x['no'] for x in use if x['week'] == w and x['id'] in off_red and w not in ('Week 6', 'Event Week')]
    if miss: words.append('docket ' + ', '.join(miss) + ' is not on their sheet')
    nmiss = [n['note_no'] for n in notes if week_of_day(n['date']) == w and (str(n['note_no']), n['date']) in off_green and w != 'Event Week']
    if nmiss: words.append('labour note ' + ', '.join(nmiss) + ' ($50) is not on their sheet, so it is carried on top')
    if w == 'Event Week': words.append('%d dockets and %d labour notes at their rates; their invoice is still to come' % (W[w]['n'], sum(1 for n in notes if week_of_day(n['date']) == w)))
    INVOICES.append([status(o), w, po['number'], po.get('amount'), po.get('invoice_no'), d(W[w]['pay']), '; '.join(words)])
for o in OTHER: INVOICES.append([status(o), 'Partial collection', o['po']['number'], o['po'].get('amount'), o['po'].get('invoice_no'), o['po'].get('amount'), (o['po'].get('note') or '') + '; not tied to a docket'])
ORDER = ['Invoice received', 'Approved sheet, no invoice yet', 'Nothing from Advanced yet (our estimate)']
INVOICES.sort(key=lambda r: (ORDER.index(r[0]), [s[0] for s in SPANS].index(r[1]) if r[1] in [s[0] for s in SPANS] else 9))
BY_STATUS = collections.OrderedDict((s, sum(cents(r[5]) for r in INVOICES if r[0] == s)) for s in ORDER)
assert sum(BY_STATUS.values()) == PAID, (BY_STATUS, PAID)

# --- the event week, day by day
DAYS = collections.OrderedDict()
for x in sorted(use, key=lambda x: x['date'] or ''):
    if x['week'] != 'Event Week': continue
    a = DAYS.setdefault(x['date'], {'n': 0, 'pay': 0, 'charge': 0}); a['n'] += 1; a['pay'] += cents(x['paid_total']); a['charge'] += cents(x['cost_total'])
EV_NOTES = [n for n in notes if week_of_day(n['date']) == 'Event Week']
assert sum(a['pay'] for a in DAYS.values()) + sum(cents(n['cost']) for n in EV_NOTES) == W['Event Week']['pay']

# ------------------------------------------------------------------------------------------------- workbook
wb = Workbook(); wb.remove(wb.active)
H = Font(bold=True); BIG = Font(bold=True, size=14); MID = Font(bold=True, size=12)
GRN = PatternFill('solid', fgColor='E2EFDA'); BLU = PatternFill('solid', fgColor='DDEBF7'); AMB = PatternFill('solid', fgColor='FFF2CC'); GRY = PatternFill('solid', fgColor='F2F2F2')
M, Q, R4 = '$#,##0.00', '#,##0.0#', '$#,##0.00##'
day_words = lambda iso: dt.date.fromisoformat(iso).strftime('%a %d %b').replace(' 0', ' ')
def sheet(name, widths, landscape=False):
    s = wb.create_sheet(name)
    for i, w in enumerate(widths): s.column_dimensions[chr(65 + i)].width = w
    s.page_setup.orientation = 'landscape' if landscape else 'portrait'; s.page_setup.fitToWidth = 1; s.page_setup.fitToHeight = 0
    s.sheet_properties.pageSetUpPr.fitToPage = True; s.page_margins = PageMargins(left=0.4, right=0.4, top=0.5, bottom=0.5)
    return s
def put(s, vals, font=None, fill=None, fmt=None):
    s.append(list(vals)); r = s.max_row
    for j, c in enumerate(s[r]):
        c.alignment = Alignment(wrap_text=True, vertical='top')
        if font: c.font = font
        if fill and j < len(vals): c.fill = fill
        if fmt and j in fmt: c.number_format = fmt[j]
    return r
def title(s, t, sub):
    put(s, [t], BIG); put(s, [sub]); put(s, [])

s = sheet('Summary', [44, 18, 50])
title(s, 'GC500 fencing (9990776): what we charge the V8s and what we pay Advanced', 'Signed dockets 9 Sep to 23 Oct 2026 · AUD ex GST · from the live record, 25 Oct 2026')
put(s, ['We charge the V8s', d(CHARGE), '167 signed fencing dockets at the 2026 card and your rates'], MID, GRN, {1: M})
put(s, ['We pay Advanced', d(PAID), 'their approved sheets and invoices, and the event week at their rates'], MID, GRN, {1: M})
put(s, ['Margin', d(CHARGE - PAID), '%.1f%% of what we charge' % (100 * (CHARGE - PAID) / CHARGE)], MID, BLU, {1: M})
put(s, [])
put(s, ['What we pay Advanced, by invoice', None, None], H, GRY)
for k, v in BY_STATUS.items(): put(s, [k, d(v), {'Invoice received': 'weeks 4, 5 and 6, and the partial collection', 'Approved sheet, no invoice yet': 'weeks 1, 2 and 3: their sheets match the orders to the cent',
                                                'Nothing from Advanced yet (our estimate)': 'the event week, 19 to 23 Oct'}[k]], fmt={1: M})
put(s, ['Total we pay Advanced', d(PAID), None], H, fmt={1: M})
put(s, [])
put(s, ['Good to know', None, None], H, GRY)
for line in ["Advanced bill off their own approved weekly sheets, so their quantities don't match ours line for line: all their CCB is one line at $5.40, vehicle gates are billed on their own, and their clean metres leave out the gate openings.",
             "The scrim fence is charged once: the papers' clean metres include the fence under the scrim, so it comes off the clean and is charged in the scrim at $25.53 (fence + shade cloth).",
             "The event week is our estimate at Advanced's rates until their invoice comes in (order 4647522), so it can still move. Nothing is dated Sat 24 or Sun 25 Oct.",
             "Not in these figures: the demob, and the fence team's event labour under the C004 scope (213 h at $91.14 = $19,412.82), which is charged separately."]:
    put(s, [line]); s.merge_cells(start_row=s.max_row, start_column=1, end_row=s.max_row, end_column=3); s.row_dimensions[s.max_row].height = 46

s = sheet('We charge the V8s', [34, 12, 7, 12, 16])
title(s, 'What we charge the V8s', 'AUD ex GST · rates from the 2026 street card or your named rates')
put(s, ['Item', 'Qty', 'Unit', 'Rate', 'Total'], H, BLU)
for k, name in CH_ITEMS:
    a = ch[k]; unit = {'labour': 'h'}.get(k, (COLS.get(k) or {}).get('unit') or 'each')
    rate = 'inside the metre rate' if k == 'v_gates' else round(a['rate'], 4)
    put(s, [name, a['qty'], unit, rate, d(a['c'])], fmt={1: Q, 3: R4, 4: M})
put(s, ['Total', None, None, None, d(CHARGE)], H, GRN, {4: M})
put(s, [])
put(s, ["Clean fence is the papers' clean less the fence under the scrim, which is charged once, in the scrim. Each docket's lines are rounded to the cent, as the page prices them."])
s.merge_cells(start_row=s.max_row, start_column=1, end_row=s.max_row, end_column=5); s.row_dimensions[s.max_row].height = 30
s.freeze_panes = 'A5'

s = sheet('We pay Advanced', [38, 12, 8, 12, 16])
title(s, 'What we pay Advanced', 'AUD ex GST · their approved sheets for weeks 1 to 5, their rate sheet for week 6 and the event week')
put(s, ['Item', 'Qty', 'Unit', 'Rate', 'Total'], H, BLU)
for k, name in PAY_ITEMS:
    p = pay[k]
    if not p['qty']: continue
    unit = 'h' if k in ('relocation', 'labour') else (COLS.get(k) or {}).get('unit') or 'each'
    rr = sorted(p['rates']); put(s, [name, p['qty'], unit, rr[0] if len(rr) == 1 else None, d(p['c'])], fmt={1: Q, 3: M, 4: M})
put(s, ['Team leader', sum(x['qty'] for x in tl), 'days', 200, d(sum(x['cents'] for x in tl))], fmt={1: Q, 3: M, 4: M})
for x in mats: put(s, [x['name'].replace(' — ', ', ').replace(' supply', ''), x['qty'], x['unit'], x['rate'], d(x['cents'])], fmt={1: Q, 3: M, 4: M})
put(s, ['Labour notes', S['green_hours'], 'h', S['green_rate'], d(GREEN)], fmt={1: Q, 3: M, 4: M})
for o in OTHER: put(s, ['Partial collection (invoice ' + str(o['po'].get('note', '')).split()[1] + ')' if 'INV' in str(o['po'].get('note', '')) else 'Partial collection', None, None, None, o['po'].get('amount')], fmt={4: M})
put(s, ['Weeks 5 and 6 invoiced under their rates (the order amounts stand)', None, None, None, d(ADJ)], fmt={4: M})
put(s, ['Total', None, None, None, d(PAID)], H, GRN, {4: M})
s.freeze_panes = 'A5'

s = sheet('Invoices', [30, 16, 11, 14, 11, 15, 60], landscape=True)
title(s, "What we pay Advanced, by invoice", 'AUD ex GST · order amounts as on the purchase orders; "we carry" is what our record pays for that week')
put(s, ['Status', 'Week', 'Order', 'Order amount', 'Receipt', 'We carry', 'Notes'], H, BLU)
for st in ORDER:
    for r in [x for x in INVOICES if x[0] == st]: put(s, r, fmt={3: M, 5: M})
    put(s, [st + ' — total', None, None, None, None, d(BY_STATUS[st]), None], H, AMB if 'estimate' in st else GRY, {5: M})
put(s, ['Total we pay Advanced', None, None, None, None, d(PAID), None], H, GRN, {5: M})
s.freeze_panes = 'A5'

s = sheet('Event week by day', [26, 10, 18, 18])
title(s, 'The event week, day by day', 'AUD ex GST · every paper handed over on Friday (40) and Saturday (5) is in, under the day the work was done')
put(s, ['Day worked', 'Papers', 'We pay Advanced', 'We charge the V8s'], H, BLU)
for day, a in DAYS.items(): put(s, [day_words(day), a['n'], d(a['pay']), d(a['charge'])], fmt={2: M, 3: M})
put(s, ['Labour notes (' + day_words(min(n['date'] for n in EV_NOTES)) + ' to ' + day_words(max(n['date'] for n in EV_NOTES)) + ')', len(EV_NOTES), d(sum(cents(n['cost']) for n in EV_NOTES)), 'inside the metre rates'], fmt={2: M})
put(s, ['Event week', sum(a['n'] for a in DAYS.values()) + len(EV_NOTES), d(W['Event Week']['pay']), d(W['Event Week']['charge'])], H, GRN, {2: M, 3: M})
put(s, [])
put(s, ["Our estimate at Advanced's rates until their invoice for the event week comes in. Nothing is dated Sat 24 or Sun 25 Oct."])
s.merge_cells(start_row=s.max_row, start_column=1, end_row=s.max_row, end_column=4); s.row_dimensions[s.max_row].height = 30

s = sheet('Dockets', [10, 12, 11, 34, 14, 15, 30], landscape=True)
title(s, 'Every signed fencing docket', 'AUD ex GST · we pay Advanced per docket; team leader, materials, labour notes and the invoice adjustments are on "We pay Advanced"')
put(s, ['Docket', 'Date', 'Week', 'Location', 'We charge the V8s', 'We pay Advanced', 'Invoice'], H, BLU)
WK_STATUS = {r[1]: r[0] for r in INVOICES}
for x in sorted(use, key=lambda x: (x['date'] or '0', str(x['no'] or ''))):
    stt = 'not on any Advanced sheet' if x['id'] in off_red and x['week'] not in ('Week 6', 'Event Week') else WK_STATUS.get(x['week'], '')
    put(s, [x['no'] or 'tracker row', day_words(x['date']) if x['date'] else '(week 6, no day)', x['week'], x['location'], x['cost_total'], x['paid_total'], stt], fmt={4: M, 5: M})
put(s, ['Total', None, None, '%d dockets' % len(use), d(CHARGE), d(DOCKETS_PAY), None], H, GRN, {4: M, 5: M})
s.freeze_panes = 'A5'

s = sheet('Labour notes', [12, 12, 10, 12, 30])
title(s, 'Labour notes (green book)', "AUD ex GST · Advanced's labour at $100 an hour, a cost only: it is inside the metre rates we charge")
put(s, ['Note', 'Date', 'Hours', 'We pay', 'Invoice'], H, BLU)
for n in sorted(notes, key=lambda n: (n['date'] or '', str(n['note_no']))):
    w = week_of_day(n['date']); stt = 'not on their sheet' if (str(n['note_no']), n['date']) in off_green and w != 'Event Week' else WK_STATUS.get(w, '')
    put(s, [n['note_no'], day_words(n['date']), n['labour_hours'], n['cost'], stt], fmt={2: Q, 3: M})
put(s, ['Total', None, S['green_hours'], d(GREEN), None], H, GRN, {2: Q, 3: M})
s.freeze_panes = 'A5'

out = HERE / 'GC500_Fencing_We_Pay_We_Charge_25Oct2026.xlsx'; wb.save(out)
print(json.dumps({'charge': d(CHARGE), 'pay': d(PAID), 'margin': d(CHARGE - PAID), 'by_status': {k: d(v) for k, v in BY_STATUS.items()},
                  'event_week': {'pay': d(W['Event Week']['pay']), 'charge': d(W['Event Week']['charge'])}, 'file': out.name}))
