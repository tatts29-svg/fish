"""Author: Andrew Fisher. 25 Oct 2026 - Baseplan SuperCars (7) against the site record and the P&L. Read-only.

Andrew, 25 Oct 2026: "Remember what i have onsite is truth and when it turned up. now we need things to match up correctly
and sign to correct branch so align to P&L".

Every Baseplan line is checked against what the site record has on site, the day it turned up, and the branch the page's
P&L puts it on. Charge lines (labour, transport, servicing, event labour) are checked against the counts the page charges.
The output is one fix list for Baseplan (what to change on which line), the lines for our own record where the page is the
one out of step, and the decisions only Andrew can make.

    python3 -I build_review7.py <private dir>
      private dir: bp7.json, bp6.json, diff_6_7.json (to_json.py, diff67.py), site.json (dump_site.cjs), page_lines.json
      (dump_lines.cjs), service.json (dump_service.cjs), vms_model.json (dump_vms.cjs) - all read-only from the live page.
The Baseplan export and the record snapshots stay in the private dir (AGENTS.md: Baseplan files are not committed).
"""
import collections, datetime as dt, json, re, sys
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill

PRIV = Path(sys.argv[1]); HERE = Path(__file__).resolve().parent
J = lambda n: json.load(open(PRIV / n))
bp, bp6, diff = J('bp7.json'), J('bp6.json'), J('diff_6_7.json')
site, pl, sv, vms, fence = J('site.json'), J('page_lines.json'), J('service.json'), J('vms_model.json'), J('fence.json')
CONTRACTS = [c for c in bp if not c.startswith('_') and c != 'Delivery Dockets']
cents = lambda v: round(float(v) + 1e-9, 2)

def aest(iso):
    if not iso: return None
    return (dt.datetime.fromisoformat(str(iso).replace('Z', '+00:00')) + dt.timedelta(hours=10)).date().isoformat()
def day(iso): return str(iso)[:10] if iso else None
def ddiff(a, b): return (dt.date.fromisoformat(a) - dt.date.fromisoformat(b)).days if a and b else None
def fmt(d): return dt.date.fromisoformat(d).strftime('%a %d %b') if d else '-'
def money(v): return '${:,.2f}'.format(v) if v is not None else '-'
def sa_branch(l): return str(l.get('Sales Analysis Code') or '').split('-')[0] or None
def num(l):
    it = str(l.get('Item') or '').strip()
    return it if re.fullmatch(r'\d{5,7}', it) else None
def qty(l):
    q = l.get('Quantity'); return q if isinstance(q, (int, float)) else 1
def hire(l): return str(l.get('Item Type')) == '1'

# ------------------------------------------------------------------------------------------------- the site record
REF = {r['ref']: r for r in site['refs'] if not r['cancelled']}
SC = collections.defaultdict(list)
for x in site['scopes']:
    if not x['cancelled']: SC[x['ref']].append(x)
live_unit = lambda u: u.get('active') is not False and u.get('physical') is not False and u.get('identityReview') != 'Number removed'   # a number Andrew took off stays off
NUM = {}            # asset number -> (ref, item, owner): the number Andrew's record carries
for x in site['scopes']:
    if x['cancelled']: continue
    for u in x['units']:
        if not live_unit(u): continue
        n = str(u.get('assetNo') or '').strip()
        if re.fullmatch(r'\d{5,7}', n): NUM.setdefault(n, (x['ref'], x['item'], u.get('owner')))
for r in REF.values():
    for n in r['asset_numbers']:
        if re.fullmatch(r'\d{5,7}', n): NUM.setdefault(n, (r['ref'], None, None))
def arrived(ref):
    r = REF.get(ref)
    if not r or r['state'] != 'on site': return None
    return aest(r['first_on_site']) if r['first_on_site'] else None
def scope_branch(ref, item=None):
    for x in SC.get(ref, []):
        if item is None or x['item'] == item: return x['branch']
    return (REF.get(ref) or {}).get('branch')
HELD_OUT = {'T0024', 'T0162', 'T0176', 'BJR01', 'SVP01', 'PG29'}   # team references on their own hire schedules (Andrew, 23 Oct)

# VMS: the board each Baseplan line names, and the day it went in (the page's VMS model; Andrew's word on 22 Oct for 22 and 24)
VMS_WORD = {'VMS22': '2026-10-22', 'VMS24': '2026-10-22', 'VMS05': '2026-10-20'}
VMS_LOADS = {'T0001': '2026-09-07', 'T0103': '2026-10-08', 'T0128': '2026-10-16', 'T0158': '2026-10-19'}
b913 = {b['key']: b for b in (vms.get('boards913') or [])}
vms_arr = {}
for p in vms['positions']:
    a = p.get('arrival') or {}
    if a.get('effective_date') and p.get('board'): vms_arr.setdefault(p['board'], a['effective_date'])
def vms_on(key):
    if key in VMS_WORD: return VMS_WORD[key], "Andrew's word (22 Oct) / pin on site"
    if key in vms_arr: return vms_arr[key], 'arrival recorded on the page'
    o = (b913.get(key) or {}).get('on') or {}
    if o.get('src') == 'word' and o.get('said'): return dt.datetime.strptime(o['said'], '%d %b %Y').date().isoformat(), "Andrew's word on the page"
    if o.get('src') == 'record' and o.get('at'): return aest(o['at']), 'recorded on site (load ' + str(o.get('on')) + ')'
    if o.get('src') == 'contract' and o.get('on') in VMS_LOADS: return VMS_LOADS[o['on']], 'load ' + o['on']
    return None, 'no on-site day on the record'

# ------------------------------------------------------------------------------------------------- the fix list
FIX = []   # (order, contract, line(s), kind, Baseplan says, site / P&L says, change, $ effect, who)
def fix(contract, line, kind, says, truth, change, effect=None, who='Baseplan'):
    FIX.append([contract, str(line), kind, says, truth, change, effect, who])

ROWS = []  # every Baseplan line, checked
LABEL = re.compile(r'^(WC\d+|PG\d+|P\d+|CP1|VMS\d+a?|WB\d+|GN\d+|G\d+|LT\d+(?:/\d+)?|AT\d+)\b', re.I)
FITOUT = re.compile(r'Refrigerator|Microwave|Sink|Urn|Auto Boil|Chair|Desk|Air Conditioner|Shop Front', re.I)
TOILET_KIND = [('Holding Tank', 'Waste tank'), ('16 Pan', '16Pan Block'), ('Pee Panel', 'Pee Panel'), ('Trailer', 'FWF Trailer'),
               ('Accessible', 'Accessible Toilet'), ('Disabled', 'Accessible Toilet'), ('Toilet Block', 'Toilet Block 6m'), ('Fresh Water', 'FWF'), ('FWF', 'FWF')]
def toilet_kind(desc):
    for k, v in TOILET_KIND:
        if k.lower() in desc.lower(): return v
    return None
CHARGED_FROM_IN = re.compile(r'Forklift|Variable Message|Barrier|Telehandler|Scissor|Boom|Generator|Trakmat', re.I)  # VMS, forklifts, barriers; generators standby from delivery

def charge_branch(c, desc):
    d = desc.lower()
    if re.search(r'gen tech|generator|sync', d): return 'NVAC'
    if c == '9961976': return 'NVAC'
    if c in ('9961265', '9972648', '9973079', '9990776', '9994248', '9994996'): return 'STPS'
    if c in ('9987005', '9992300'): return 'MEAD'
    return 'KINP'
# the branch the P&L charges a hire line's revenue on: the page's own copy of that line (the same asset), else the reference
PL_LINE = {}
for r in pl['rows']:
    if r.get('asset_no') and re.fullmatch(r'\d{5,7}', str(r['asset_no'])): PL_LINE.setdefault(str(r['asset_no']), r['branch'])
def site_nums(ref): return sorted({str(u['assetNo']) for x in SC.get(ref, []) for u in x['units'] if live_unit(u) and re.fullmatch(r'\d{5,7}', str(u.get('assetNo') or ''))})
ITEM_REF = {}   # an unlabelled line named for what it is: the one reference on site with that item
for ref, xs in SC.items():
    for x in xs: ITEM_REF.setdefault(x['item'].lower(), set()).add(ref)
NEVER_CAME = {'1276701': "GN20's 365 kVA: Andrew, 22 Oct 2026, \"never came to site 1276701\" (record_22Oct2026_gn20_never_came). "
              "But Coates' docket 26102821 has it out on 30 Sep, the line is Delivered on that docket, and our record holds a photo "
              "filed under GN20/1276701 at 14:14 that day: settle with Andrew before the branch closes the line"}
DOCKET_NO = {str(d['Fleet item']).strip(): d['Delivery Docket'] for d in bp.get('Delivery Dockets', [])}   # number -> Coates delivery docket
def one_slip(a, b):   # a digit changed, dropped, or two swapped
    if len(a) == len(b): return sum(x != y for x, y in zip(a, b)) == 1 or (sorted(a) == sorted(b) and sum(x != y for x, y in zip(a, b)) == 2)
    s, t = sorted((a, b), key=len)
    return len(t) - len(s) == 1 and any(t[:i] + t[i + 1:] == s for i in range(len(t)))
DATE_FIX = []   # start dates: (contract, line, what, Baseplan start, turned up, days, charged from when it goes in?, basis)

# --- hire lines, one by one
toilet_bp = collections.defaultdict(lambda: collections.defaultdict(lambda: [0, []]))   # ref -> kind -> [qty, lines]
wb_bp = collections.defaultdict(lambda: [0, []])
asset_fixed = collections.defaultdict(set)   # ref -> the site numbers an asset-number fix already names
record_branch = {}
for c in CONTRACTS:
    cb = bp['_branch'][c]
    for l in bp[c]:
        if l.get('Line') is None or not str(l.get('Line')).isdigit(): continue
        desc = str(l.get('Description') or ''); n = num(l); m = LABEL.match(desc); label = m.group(1).upper() if m else None
        if label and label.startswith('G') and not label.startswith('GN'): label = 'GN' + label[1:]
        sa = sa_branch(l); start = day(l.get('Start Date')); status = l.get('Status')
        row = {'contract': c, 'line': l.get('Line'), 'status': status, 'item': l.get('Item'), 'desc': desc, 'qty': qty(l), 'rate1': l.get('Rate 1'), 'price': l.get('Price'),
               'sa': l.get('Sales Analysis Code'), 'start': start, 'term': day(l.get('Term Date')), 'ref': None, 'site_on': None, 'pl_branch': None, 'check': []}
        if not hire(l):
            row['pl_branch'] = charge_branch(c, desc); row['kind'] = 'charge'; ROWS.append(row); continue
        row['kind'] = 'hire'
        # VMS boards: the board the line names (its label, else its number), and the day it went in from the page's VMS model
        if c == '9961265':
            key = 'VMS05' if label == 'VMS05A' else label if label and label.startswith('VMS') else None
            if not key and n:
                key = next((k for k, b in b913.items() if str(b.get('asset')) == n), None)
            on, basis = vms_on(key) if key else (None, '')
            row['ref'] = key; row['site_on'] = on; row['pl_branch'] = 'STPS'
            if status == 'Returned': row['check'].append('returned ' + fmt(row['term']))
            elif on and start and ddiff(start, on):
                dd = ddiff(start, on); row['check'].append(f'starts {fmt(start)}, on site {fmt(on)} ({basis})')
                DATE_FIX.append((c, l['Line'], desc[:50], start, on, dd, True, basis))
                fix(c, l['Line'], 'Start date', f'{desc[:50]}: start {fmt(start)}', f'on site {fmt(on)} ({basis})', f'Start {fmt(on)} (VMS is charged from when it goes in)', cents(-dd * 53.6115))
            if sa != 'STPS':
                row['check'].append(f'sales code {l.get("Sales Analysis Code")}')
                fix(c, l['Line'], 'Branch', f'{desc[:50]}: {l.get("Sales Analysis Code")}', 'the P&L carries every VMS board on STPS, the Premiair rehire boards with them',
                    'Code STPS-SUB and book the Premiair cost to STPS (or keep the sub-hire branch and the P&L moves instead)', who='Decision')
            ROWS.append(row); continue
        # every other hire line: by the number on the record, else the label, else what the line is
        ref = None; how = None
        if n and n in NEVER_CAME:
            row['check'].append(NEVER_CAME[n]); row['pl_branch'] = cb
            fix(c, l['Line'], 'Remove', f'{desc[:50]} ({n}) {status} at {money(l.get("Rate 1"))}', NEVER_CAME[n], 'Close the line (no charge) if it never came; if it came, an In docket and standby to the day it left', cents(-(l.get('Rate 1') or 0)), 'Ask Andrew')
            ROWS.append(row); continue
        if n and n in NUM: ref, how = NUM[n][0], 'asset number on the record'
        elif label == 'LT05/06': ref, how = ('LT05' if n == '1224783' else 'LT06'), 'label'
        elif label and (label in REF or label in SC): ref, how = label, 'label'
        elif re.search(r'Pee Panel', desc, re.I): ref, how = next(iter(ITEM_REF.get('pee panel', {None}))), 'what it is'
        elif re.search(r'Refrigerated', desc, re.I): ref, how = next(iter(ITEM_REF.get('6.0m refrigerator cont', {None}))), 'what it is'
        elif desc.lower() in ITEM_REF and len(ITEM_REF[desc.lower()]) == 1: ref, how = next(iter(ITEM_REF[desc.lower()])), 'what it is'
        elif re.search(r'COATES- 5T FORKLIFT', desc, re.I): ref, how = 'FL01', 'the 5 t forklift with tynes (sub-hired, 12 Sep)'
        row['ref'] = ref; row['how'] = how
        if not ref:
            if c == '9990776' or re.search(r'Fence|Barrier - Crowd|Ped Gate|Demarcation|Shade', desc): row['check'].append('fencing: its own reconciliation (dockets to POs)'); row['pl_branch'] = 'STPS'
            elif re.search(r'Trakmat', desc): row['check'].append('trakmat: see quantities'); row['pl_branch'] = 'STPS' if c != '9992300' else 'MEAD'
            elif re.search(r'Cable', desc, re.I) and c == '9994954':
                row['pl_branch'] = 'NVAC'; row['check'].append('generator cable for GN26/27')
                if sa != 'NVAC': fix(c, l['Line'], 'Branch', f'{desc[:50]}: {l.get("Sales Analysis Code")}', 'the cable goes with GN26/27, on NVAC in the P&L', 'Code NVAC-HIR')
            elif FITOUT.search(desc): row['check'].append('fit-out item'); row['pl_branch'] = cb
            else:
                row['check'].append('nothing on the record carries this line'); row['pl_branch'] = cb
                if status in ('Delivered', 'Off Rent') and not re.search(r'COATES|AT009|SUPPLY|Cable|Laserplane|Distribution', desc, re.I):
                    fix(c, l['Line'], 'Not on site', f'{desc[:60]} ({l.get("Item")}) {status}', 'no unit on the record carries this number or label', 'Say what it is, or close the line', who='Ask Andrew')
            ROWS.append(row); continue
        # matched to a reference
        on = arrived(ref); row['site_on'] = on; item = NUM.get(n, (None, None))[1] if n else None
        row['pl_branch'] = PL_LINE.get(n) or scope_branch(ref, item)
        ref_branch = scope_branch(ref, item)
        if row['pl_branch'] and ref_branch and ref_branch != row['pl_branch'] and ref not in record_branch:
            record_branch[ref] = (ref_branch, row['pl_branch'], f'{c}/{l["Line"]}')
        if ref in HELD_OUT:
            row['check'].append('held out: on its own hire schedule')
            if (l.get('Rate 1') or 0) > 0:
                fix(c, l['Line'], 'Remove', f'{desc[:50]} at {money(l.get("Rate 1"))}', f'{ref} is on its own hire schedule (held out of every charge, Andrew 23 Oct)', 'Take the line off this contract', cents(-(l.get('Rate 1') or 0) * qty(l)))
        r = REF.get(ref)
        if not r or r['state'] != 'on site':
            row['check'].append('not on site on the record')
            if status in ('Delivered', 'Off Rent'): fix(c, l['Line'], 'Not on site', f'{desc[:60]} {status}', f'{ref} is not on site on the record', 'Check: delivered or not?', who='Ask Andrew')
        if label and label.startswith(('P', 'WC', 'CP')) and n and n in NUM and NUM[n][0] != label and not FITOUT.search(desc):
            row['check'].append(f'labelled {label}, the number is {NUM[n][0]} on site')
            fix(c, l['Line'], 'Label', f'labelled {label} ({n})', f'{n} is {NUM[n][0]} on site', f'Relabel the line {NUM[n][0]}')
        if n and site_nums(ref) and n not in site_nums(ref) and not FITOUT.search(desc) and not re.search(r'Holding Tank|Distribution|Cable', desc, re.I) or (how == 'label' and n and not site_nums(ref) and not FITOUT.search(desc) and not re.search(r'Holding Tank|Distribution|Cable', desc, re.I)):
            sn = site_nums(ref)
            row['check'].append(f'{n} is not on {ref}; {ref} carries {", ".join(sn) or "no number"}')
            slip = [s for s in sn if s not in DOCKET_NO and one_slip(s, n)] if n in DOCKET_NO else []
            if slip:   # Coates' own delivery docket carries the line's number: ours is the likelier slip
                asset_fixed[ref].update(sn)
                fix(c, l['Line'], 'Asset number', f'{ref} asset {n}', f'our record has {slip[0]}; Coates docket {DOCKET_NO[n]} has {n}, the same as this line',
                    f'Check the unit: our {slip[0]} is probably a keying slip for {n} (correct our record, not the line)', who='Our record')
            elif sn:
                asset_fixed[ref].update(sn)
                fix(c, l['Line'], 'Asset number', f'{ref} asset {n}', f'{ref} on site carries {", ".join(sn)}', 'Correct the number on the line (the site number stands)')
            else:
                fix(c, l['Line'], 'Asset number', f'{ref} asset {n}', f'{ref} has no number on our record yet', 'Record the number on site (ours to fill)', who='Our record')
        if on and start and ddiff(start, on) and not FITOUT.search(desc):
            d = ddiff(start, on); matters = bool(CHARGED_FROM_IN.search(desc)) and not re.search(r'COATES', desc)
            row['check'].append(f'starts {fmt(start)}, turned up {fmt(on)} ({"+" if d > 0 else ""}{d} days)')
            if abs(d) >= 2:
                DATE_FIX.append((c, l['Line'], desc[:50], start, on, d, matters, f'{ref} on site on the record'))
                plant = bool(re.search(r'Forklift|Telehandler|Scissor|Boom|Extension', desc, re.I))
                if matters: fix(c, l['Line'], 'Start date', f'{desc[:50]}: start {fmt(start)}', f'{ref} first on site {fmt(on)}' + (' (machines changed on some plant references: confirm this unit\'s day)' if plant else ''),
                                f'Start {fmt(on)} (charged from when it goes in)', None, 'Ask Andrew' if plant else 'Baseplan')
        if row['pl_branch'] and sa and sa != row['pl_branch']:
            row['check'].append(f'sales code {l.get("Sales Analysis Code")}, P&L {row["pl_branch"]}')
            sub = 'SUB' in str(l.get('Sales Analysis Code'))
            fix(c, l['Line'], 'Branch', f'{desc[:50]}: {l.get("Sales Analysis Code")}', f'{ref} is on {row["pl_branch"]} in the P&L' + (' (the sheet notes the sub-hire account on the coded branch)' if sub else ''),
                f'Code {row["pl_branch"]}-{str(l.get("Sales Analysis Code")).split("-")[-1]}' + (' and book the supplier cost there too (or keep the code and the P&L moves)' if sub else ''), who='Decision' if sub else 'Baseplan')
        tk = toilet_kind(desc) if c in ('9968955', '9994954', '9973977') else None
        if tk: toilet_bp[ref][tk][0] += qty(l); toilet_bp[ref][tk][1].append(f"{c}/{l['Line']}")
        if desc.upper().startswith('WB'): wb_bp[ref][0] += qty(l); wb_bp[ref][1].append(f"{c}/{l['Line']} {qty(l)}")
        ROWS.append(row)
for ref, (was, line_branch, where) in record_branch.items():
    fix('our record', ref, 'Branch', f'{ref} is tagged {was} on our record', f'its contract line {where} and the P&L hire for it are {line_branch}', f'Put {ref} on {line_branch} (Costs labour ticks follow the reference)', None, 'Our record')
# charge lines on the wrong branch (the event labour lines are checked with the scope below)
EVENT_LINES = {('9968862', '141'), ('9968955', '164'), ('9961976', '56'), ('9968955', '165'), ('9961265', '44'), ('9994954', '25'), ('9994954', '26'), ('9968862', '140'), ('9968955', '163')}
for c in CONTRACTS:
    for l in bp[c]:
        if l.get('Line') is None or hire(l) or (c, str(l.get('Line'))) in EVENT_LINES or not l.get('Sales Analysis Code'): continue
        want = charge_branch(c, str(l.get('Description') or ''))
        if sa_branch(l) != want:
            fix(c, l['Line'], 'Branch', f'{l.get("Description")}: {l.get("Sales Analysis Code")}', f'{"generator work is NVAC" if want == "NVAC" else "the items it serves are " + want} in the P&L', f'Code {want}-{str(l.get("Sales Analysis Code")).split("-")[-1]}')

# --- toilets: Baseplan's hire per reference against the units on site
TOIL = []
site_toilet = collections.defaultdict(lambda: collections.Counter())
for ref, xs in SC.items():
    for x in xs:
        if x['item'] in ('FWF', 'FWF Trailer', 'Accessible Toilet', 'Toilet Block 6m', 'Waste tank', '16Pan Block', 'Pee Panel'):
            site_toilet[ref][x['item']] += x['quantity'] or 0
for ref in sorted(set(site_toilet) | set(toilet_bp), key=lambda r: (re.sub(r'\d', '', r), int(re.sub(r'\D', '', r) or 0))):
    if ref in HELD_OUT: continue
    for k in ('FWF', 'FWF Trailer', 'Accessible Toilet', 'Toilet Block 6m', 'Waste tank', '16Pan Block', 'Pee Panel'):
        b = toilet_bp.get(ref, {}).get(k, [0, []]); s = site_toilet.get(ref, {}).get(k, 0)
        if not b[0] and not s: continue
        TOIL.append((ref, k, s, b[0], ', '.join(b[1]), arrived(ref) or '-', 'agrees' if b[0] == s else f'Baseplan {b[0]}, site {s}'))
        if b[0] != s:
            fix(', '.join(sorted({x.split('/')[0] for x in b[1]})) or '9968955', ', '.join(x.split('/')[1] for x in b[1]) or '-', 'Quantity', f'{ref} {k}: {b[0]} on hire', f'{ref} has {s} {k} on site (arrived {fmt(arrived(ref))})',
                f'{"Add" if s > b[0] else "Take off"} {abs(s - b[0])} {k}' + (' (hire line)' if s > b[0] else ''), None)

# --- water barriers: Baseplan's barriers per reference against the record
WBR = []
for ref in sorted(set(wb_bp) | {r for r in SC if r.startswith('WB')}, key=lambda r: int(re.sub(r'\D', '', r) or 0)):
    s = sum(x['quantity'] or 0 for x in SC.get(ref, []) if x['item'] == 'TL2'); b = wb_bp.get(ref, [0, []])
    st = (REF.get(ref) or {}).get('state')
    WBR.append((ref, st, arrived(ref) or '-', s, b[0], '; '.join(b[1]), 'agrees' if s == b[0] else f'Baseplan {b[0]}, site {s}'))
    if s != b[0] and st == 'on site': fix('9972648/9990776', ', '.join(x.split()[0].split('/')[1] for x in b[1]) or '-', 'Quantity', f'{ref}: {b[0]} barriers', f'{ref}: {s} on site', 'Match the quantity to the site count (barriers are charged from when they go in)')

# --- on site, no Baseplan line (Coates units with a number Baseplan does not carry)
bp_nums = {num(l) for c in CONTRACTS for l in bp[c] if num(l)}
MISS = []
for ref, xs in SC.items():
    r = REF.get(ref)
    if not r or r['state'] != 'on site' or ref in HELD_OUT: continue
    for x in xs:
        for u in x['units']:
            n = str(u.get('assetNo') or '')
            if not live_unit(u): continue
            if u.get('owner') == 'coates' and re.fullmatch(r'\d{5,7}', n) and n not in bp_nums and n not in asset_fixed.get(ref, set()) and ref != 'FL01':
                MISS.append((ref, x['item'], n, arrived(ref) or '-', x['branch']))
for m in MISS:
    if m[0] in ('AA', 'HRP'): continue   # tracked only: each customer pays on its own contract (22 Oct)
    fix('-', '-', 'Missing line', f'no line for {m[2]}', f'{m[0]} {m[1]} {m[2]} on site since {fmt(m[3] if m[3] != "-" else None)}', f'Add the hire line on {m[4]} from {fmt(m[3] if m[3] != "-" else None)}', None)

# ------------------------------------------------------------------------------------------------- charge lines
L = {(c, str(l.get('Line'))): l for c in CONTRACTS for l in bp[c]}
def P(c, n): return L.get((c, str(n))) or {}
CH = []   # (contract, line, what, Baseplan qty x price = $, ours, verdict)
def chk(c, n, what, ours_qty, ours_basis, verdict=None):
    l = P(c, n); q = l.get('Quantity'); pr = l.get('Price'); amt = cents(q * pr) if isinstance(q, (int, float)) and isinstance(pr, (int, float)) else None
    v = verdict or ('agrees' if ours_qty == q else f'Baseplan {q}, ours {ours_qty}')
    CH.append((c, str(n), l.get('Description') or what, q, pr, amt, ours_qty, cents(ours_qty * pr) if isinstance(ours_qty, (int, float)) and isinstance(pr, (int, float)) else None, ours_basis, v, l.get('Sales Analysis Code'), charge_branch(c, str(l.get('Description') or ''))))
    return l
# toilets servicing (the P&L's own counts: servicing748)
svl = {l['card_line']: l for l in sv['lines'] if l['card_line']}
per = collections.defaultdict(dict)
for r in sv['per']:
    for x in r['lines']: per[x['card_line']][r['ref']] = x['units']
fwf_u = svl['FWF Pump out & Clean & Restock']['units']; tank_u = svl['Tank Pump Out & Clean & Restock']['units']; sewer_u = svl['Sewer Connect Units Clean & Restock']['units']
pan16 = per['Sewer Connect Units Clean & Restock'].get('WC31', 0)
chk('9968955', 141, 'Pumpout FWF & accessible', fwf_u * 3, f'{fwf_u} FWF and accessible on site (60 references, WC09/WC10 included) x 3 nights')
chk('9968955', 142, 'Pumpout tanks', (tank_u + pan16) * 3, f'{tank_u} waste tanks + {pan16} sixteen-pan blocks (WC31) x 3 nights; the crews pump the 16-pans out every night (servicing tracker)',
    f'agrees with site; the P&L counts only the {tank_u} tanks ({tank_u * 3}) and the 16-pans as sewer-connect cleans')
chk('9968955', 143, 'Sewer connect cleans', (sewer_u - pan16) * 3, f'{sewer_u - pan16} sewer-connected blocks: WC15, WC16, WC17 (2 each), WC09 (2, on 9994954) and T0243 WCTV (on 9973977) x 3 nights',
    'Baseplan 24 = 8 blocks; the WCTV block (T0243) has no cleaning line on any contract')
# toilet install / transport counts from the units on site
units = lambda k, refs=None: sum(c[k] for r, c in site_toilet.items() if r not in HELD_OUT and (refs is None or r in refs))
concert = {'WC09', 'WC10'}
on_toilet_contract = [r for r in site_toilet if r not in concert and r not in HELD_OUT and r != 'T0243']
fwf_main = units('FWF', on_toilet_contract) + units('FWF Trailer', on_toilet_contract)
acc_main = units('Accessible Toilet', on_toilet_contract)
blk_main = units('Toilet Block 6m', on_toilet_contract) + units('16Pan Block', on_toilet_contract)
chk('9968955', 144, 'Install & demob blocks', units('Toilet Block 6m', on_toilet_contract), f'{units("Toilet Block 6m", on_toilet_contract)} toilet blocks on the toilets contract (WC09 is on 9994954, WCTV on 9973977)')
chk('9968955', 160, 'Install & demob 16-pan', units('16Pan Block', on_toilet_contract), '16-pan blocks (WC31)')
chk('9968955', 145, 'Accessible install & demob', acc_main * 2, f'{acc_main} accessible toilets x 2 (install + demob)')
chk('9968955', 146, 'FWF install & demob', fwf_main * 2, f'{fwf_main} FWF on the toilets contract (Coates and Event Portables) x 2')
chk('9968955', 147, 'Block & 16-pan transport', blk_main * 2, f'{blk_main} blocks and 16-pans x 2 legs')
chk('9968955', 148, 'Accessible transport', acc_main * 2, f'{acc_main} accessible x 2 legs')
chk('9968955', 149, 'FWF transport', fwf_main * 2, f'{fwf_main} FWF x 2 legs (Event Portables units included at the Coates rate)')
chk('9968955', 162, 'Waste tank transport', units('Waste tank', on_toilet_contract) * 2, f'{units("Waste tank", on_toilet_contract)} waste tanks x 2 legs')
# the concert contract (9994954)
chk('9994954', 17, 'WC09 block install', units('Toilet Block 6m', concert), 'WC09 two blocks')
chk('9994954', 18, 'WC09 block transport', units('Toilet Block 6m', concert) * 2, 'two blocks x 2 legs')
chk('9994954', 20, 'Pee panel labour', units('Pee Panel', concert), 'six pee panels at WC09')
chk('9994954', 23, 'FWF labour', units('FWF', concert), 'WC09 10 + WC10 3 FWF (one labour line each)')
chk('9994954', 24, 'FWF transport', units('FWF', concert) * 2, '13 FWF x 2 legs')
chk('9994954', 5, 'P38/P39/P42 install & demob (no steps)', 3, 'P38, P39, P42 on site since 28 Sep, no steps')
chk('9994954', 6, 'P38/P39/P42 transport', 6, 'three buildings x 2 legs')
chk('9994954', 14, 'Generator transport', 4, 'GN26 + GN27 x 2 legs')
# buildings (the 22 Oct fixes are in)
steps_off = {'P06', 'P38', 'P39', 'P42', 'P60', 'P62', 'P63'}
TEAM = {r['ref'] for r in site['refs'] if any(x['contract'] == '9968929' for x in r['rental'])} | HELD_OUT
bld = sorted(r for r, xs in SC.items() if any(re.match(r'(Building|Ticket Box)', x['item']) for x in xs) and r not in ('AA', 'HRP') and r not in TEAM and (REF.get(r) or {}).get('state') == 'on site')
big = [r for r in bld if any(re.search(r'12m|9\.6m', x['item']) for x in SC[r])]
main_bld = [r for r in bld if r not in ('P38', 'P39', 'P42')]
chk('9968862', 133, 'Install & demob (with steps)', len([r for r in main_bld if r not in steps_off]), f'{len(bld)} buildings charged on site (AA and HRP tracked only; team buildings held out): {", ".join(bld)}; steps on all but {", ".join(sorted(steps_off))}')
chk('9968862', 139, 'Install & demob (no steps)', len([r for r in main_bld if r in steps_off]), 'P06, P60, P62, P63')
chk('9968862', 134, 'Transport up to 6 m', (len(main_bld) - len(big)) * 2, f'{len(main_bld) - len(big)} buildings up to 6 m on this contract x 2 legs')
chk('9968862', 135, 'Transport 9.6 / 12 m', len(big) * 2, f'{len(big)} large buildings ({", ".join(big)}) x 2 legs')
# generators and VMS
gens = [g['ref'] for g in sv['gens']]
nvac_sets = [g for g in gens if g != 'GN?']
chk('9961976', 51, 'Generator labour', None, f'{len(nvac_sets)} sets on the NVAC contract (GN26/27 on 9994954)', 'install and pick-up per set: check the split of 11 + 2 against the sets')
chk('9961976', 53, 'Generator transport (small)', None, '', 'see line 54/55: 26 legs for the NVAC sets')
SIZE = {}
for g in gens:
    for x in SC.get(g, []):
        m = re.match(r'(\d+)\s*kva', x['item'], re.I)
        if m: SIZE[g] = int(m.group(1))
small = sorted(g for g in nvac_sets if SIZE.get(g, 0) <= 30); mid = sorted(g for g in nvac_sets if 30 < SIZE.get(g, 0) <= 60); large = sorted(g for g in nvac_sets if SIZE.get(g, 0) > 60)
CH[:] = [x for x in CH if not (x[0] == '9961976' and x[1] in ('51', '53'))]
chk('9961976', 51, 'Generator labour (up to 60 kVA)', len(small) + len(mid), f'{len(small) + len(mid)} sets up to 60 kVA on site: {", ".join(small + mid)}')
chk('9961976', 52, 'Generator labour (large)', len(large), f'{len(large)} large set on site: {", ".join(large)} (GN20: Andrew said never came; docket 26102821 says 30 Sep)')
chk('9961976', 53, 'Generator transport $300', len(small) * 2, f'{len(small)} sets up to 30 kVA ({", ".join(small)}) x 2 legs', None)
chk('9961976', 54, 'Generator transport $450', len(mid) * 2, f'{len(mid)} sets 45-60 kVA ({", ".join(mid)}) x 2 legs')
chk('9961976', 55, 'Generator transport $600', len(large) * 2, f'{len(large)} large set x 2 legs')
for c, n, ours in (('9961976', 52, len(large)), ('9961976', 53, len(small) * 2)):
    l = P(c, n)
    if l.get('Quantity') != ours:
        fix(c, n, 'Quantity', f'{l.get("Description")}: {l.get("Quantity")} x {money(l.get("Price"))}', f'{ours} on site ({", ".join(large) if n == 52 else ", ".join(small)}){"; the second is GN20, which Andrew said never came (docket 26102821 says 30 Sep)" if n == 52 else ""}',
            f'Quantity {ours}', cents((ours - l.get('Quantity')) * l.get('Price')), 'Ask Andrew')
vms_boards = [k for k in b913]
chk('9961265', 40, 'VMS labour', len(vms_boards), f'{len(vms_boards)} boards')
chk('9961265', 41, 'VMS transport', len(vms_boards) * 2, f'{len(vms_boards)} boards x 2 legs ($150 a leg is the branch figure; the card says POA)')

fix('9973977', 'new', 'Missing line', 'no cleaning line for the WCTV block (T0243)', 'the P&L charges its sewer-connect clean every race night: 3 x $260.25', 'Add Cleaning & Restock Sewer Connect 3 x $260.25 on KINP-CLE', cents(3 * 260.25))
fix('our P&L', 'servicing', 'Quantity', 'the P&L charges WC31\'s two 16-pan blocks as sewer-connect cleans (2 x 3 x $260.25 = $1,561.50)', 'they are pumped out every night (servicing tracker), as Baseplan line 142 charges them (2 x 3 x $624.60 = $3,747.60)',
    'Count the 16-pans with the tank pump-outs on Costs (P&L +$2,186.10)', None, 'Our record')

# --- event labour: the C004 scope (the P&L) against the lines
SCOPE = {x['key']: x for x in site['scope']['lines']}
def hm(v):   # Baseplan keys the hours as hours.minutes
    h = int(v); m = round((v - h) * 100); return h + m / 60
EVENT = [('pm', [('9968862', 141), ('9968955', 164)]), ('gentech', [('9961976', 56)]), ('toilets', [('9968955', 165)]), ('vms', [('9961265', 44)]),
         ('fence', []), ('gentech_ent', [('9994954', 25)]), ('toilets_ent', [('9994954', 26)])]
ROLE_BRANCH = {'pm': 'KINP', 'gentech': 'NVAC', 'fence': 'STPS', 'toilets': 'KINP', 'vms': 'STPS', 'gentech_ent': 'NVAC', 'toilets_ent': 'KINP'}
EV = []
for key, lines in EVENT:
    s = SCOPE[key]; bq = sum(P(c, n).get('Quantity') or 0 for c, n in lines); bamt = cents(sum((P(c, n).get('Quantity') or 0) * (P(c, n).get('Price') or 0) for c, n in lines))
    codes = ', '.join(f"{c}/{n} {P(c, n).get('Sales Analysis Code')}" for c, n in lines) or 'no line'
    EV.append((s['role'], s['hours'], s['rate'], s['amount'], ROLE_BRANCH[key], round(bq, 2), bamt, codes))
    if not lines:
        fix('-', '-', 'Missing line', f'no line for {s["role"]}', f'{s["role"]}: {s["hours"]:g} h x ${s["rate"]} = {money(s["amount"])} (C004 scope, {s["invoicing"]})', f'Add the event labour line on {ROLE_BRANCH[key]}-INS', s['amount'])
        continue
    for c, n in lines:
        l = P(c, n); q = l.get('Quantity') or 0
        per = s['hours'] / len(lines)
        if abs(q - per) <= 0.01: pass
        elif isinstance(q, float) and abs(hm(q) - per) < 0.02:
            fix(c, n, 'Hours', f'{l.get("Description")}: {q} h', f'keyed as hours:minutes ({int(q)} h {round((q - int(q)) * 100)} min); the scope has {per:g} h', f'Quantity {per:g} h', cents((per - q) * (l.get('Price') or 0)))
        elif abs(q - per) > 0.01:
            per = s['hours'] / len(lines)
            fix(c, n, 'Hours', f'{l.get("Description")}: {q} h', f'the scope has {per:g} h ({s["role"]})', f'Quantity {per:g} h', cents((per - q) * (l.get('Price') or 0)))
        if sa_branch(l) != ROLE_BRANCH[key]:
            fix(c, n, 'Branch', f'{l.get("Description")}: {l.get("Sales Analysis Code")}', f'{s["role"]} is {ROLE_BRANCH[key]} in the P&L (the responsible branch for the role)', f'Code {ROLE_BRANCH[key]}-INS')
acc = site['scope']['at']; bacc = cents(sum(P(c, n).get('Price') or 0 for c, n in (('9968862', 140), ('9968955', 163))))
EV.append(('Accommodation, meals, travel', None, None, acc, 'KINP', None, bacc, '9968862/140 + 9968955/163 KINP-MIS'))
fix('9968862 / 9968955', '140 / 163', 'Amount', f'ACCOM / MEALS 50% x 2 = {money(bacc)}', f'the C004 scope (row 68) charges {money(acc)} for accommodation and travel, half each on buildings and toilets', 'Andrew to say which figure stands', cents(acc - bacc), 'Decision')

# --- the other P&L lines Baseplan does not carry, or carries differently
water = [l for l in sv['lines'] if l['from'] == 'at cost']; wsum = cents(sum(l['amount'] for l in water))
fix('9968955', 'new', 'Missing line', 'no water on any contract', 'the P&L charges water at what Event Portables charge us: ' + '; '.join(f"{l['description']} {money(l['amount'])}" for l in water), f'Add the water lines ({money(wsum)}) on KINP', wsum)
cl = [r for r in pl['rows'] if r['branch'] == 'NVAC' and r['family'] == 'forklift' and r['filled'] == 'card' and (r['amount'] or 0) > 0]
fsum = cents(sum(r['amount'] for r in cl))
fix('9961976', ', '.join(str(r['line']) for r in cl), 'Rate', f'Coates forklifts at $0 ({", ".join((r["description"] or "")[:28] for r in cl[:3])}, ...)',
    f'the P&L charges them from the card: {money(fsum)} of NVAC revenue', 'Andrew to say: Coates own (no charge, the P&L comes down) or charged to the V8s (rates on the lines)', fsum, 'Decision')
for c, n, card in (('9961976', 1, 192.99), ('9961976', 2, 192.99), ('9961976', 3, 192.99), ('9961976', 4, 192.99), ('9961976', 5, 192.99), ('9961976', 19, 192.99), ('9961976', 20, 192.99)):
    l = P(c, n); r1 = l.get('Rate 1') or 0
    if abs(r1 - card) > 0.01: fix(c, n, 'Rate', f'{(l.get("Description") or "")[:40]}: {money(r1)}', 'a light tower is charged for the three event days at the card ($64.33 a day = $192.99), never its days on site (branch rule)', f'Rate {money(card)}', cents(card - r1))
gen_pl = {g['ref']: g['gen'] for g in sv['gens'] if isinstance(g['gen'], dict)}
GEN = []
for c in ('9961976', '9994954'):
    for l in bp[c]:
        d = str(l.get('Description') or ''); n = num(l)
        if not hire(l) or 'Generator' not in d: continue
        ref = NUM.get(n, (None,))[0] if n else None
        g = gen_pl.get(ref)
        share = 2 if ref == 'GN?' else 1
        ours = cents(g['forecast'] / share) if g else None
        GEN.append((c, l.get('Line'), d[:50], n, ref, arrived(ref) or '-', day(l.get('Start Date')), l.get('Rate 1'), ours, g and g['source'], l.get('Sales Analysis Code')))
        if ours is not None and abs((l.get('Rate 1') or 0) - ours) > 1:
            fix(c, l['Line'], 'Rate', f'{d[:40]}: {money(l.get("Rate 1"))}', f'the P&L charges {money(ours)} ({g["source"]}, from the day it turned up {fmt(arrived(ref))})', f'Rate {money(ours)}', cents(ours - (l.get('Rate 1') or 0)))

# --- fencing (9990776): the signed dockets are the truth for work done (Andrew, 22 Oct 2026); the P&L charges them at the card
FQ, FR = fence['quantities'], fence['rates']
FENCE_MAP = [   # docket category -> the 9990776 lines that carry it
    ('clean', 'Fence, no scrim (m): line 3 at $16.16 + hoarding line 5 at $23.59', [3, 5]), ('scrim', 'Fence with scrim (m): fence line 6 + shade cloth line 10', [6, 10]),
    ('ccb_event', 'Crowd control barrier (m)', [7]), ('flat_feet', 'CCB flat feet', [8]), ('ccb_demarc', 'Demarcation CCB (m)', [9]),
    ('ped_gates', 'Pedestrian gates', [2]), ('relocation', 'Fence relocation (m)', [4]), ('fence_blocks', 'Fence blocks', []), ('labour', 'Fencing labour (h)', [])]
FEN = []
for key, what, lines in FENCE_MAP:
    site_q = FQ.get(key, 0); rate = (FR.get(key) or {}).get('value')
    bl = lambda n: (P('9990776', n).get('Rate 1') or P('9990776', n).get('Price') or 0)
    if key == 'scrim':
        bq = P('9990776', 6).get('Quantity') or 0; br = cents(bl(6) + bl(10))
    else:
        bq = sum(P('9990776', n).get('Quantity') or 0 for n in lines); br = bl(lines[0]) if lines else None
    # each line at its own rate: the 110 m with hoarding (line 5) is $23.59, not line 3's $16.16
    bd = cents(bq * br) if key == 'scrim' else cents(sum((P('9990776', n).get('Quantity') or 0) * bl(n) for n in lines)) if lines else None
    FEN.append((what, site_q, rate, cents(site_q * rate) if rate is not None else None, ' + '.join(map(str, lines)) or 'no line', bq, br, bd))
    if not lines and site_q:
        fix('9990776', 'new', 'Missing line', f'no line for {what.lower()}', f'{site_q:g} on the signed dockets at {money(rate)}', f'Add {site_q:g} at {money(rate)}', cents(site_q * rate))
    elif lines and abs(site_q - bq) > 0.01 and key == 'scrim':
        for l0 in lines:
            fix('9990776', l0, 'Quantity', f'{P("9990776", l0).get("Description")}: {P("9990776", l0).get("Quantity"):g}', f'{site_q:g} m of fence with scrim on the signed dockets (to 25 Oct)', f'Quantity {site_q:g}', cents((site_q - (P("9990776", l0).get("Quantity") or 0)) * bl(l0)))
    elif lines and abs(site_q - bq) > 0.01 and key != 'clean':
        l0 = lines[0]
        fix('9990776', l0, 'Quantity', f'{P("9990776", l0).get("Description")}: {bq:g}', f'{site_q:g} on the signed dockets (to 25 Oct)' + ('; demob relocation still to come' if key == 'relocation' else ''),
            f'Quantity {site_q:g}' + (' to date' if key == 'relocation' else ''), cents((site_q - bq) * (br or 0)), 'Baseplan')
    if br is not None and rate is not None and abs(br - rate) > 0.02 and key not in ('clean',):
        fix('9990776', lines[0], 'Rate', f'{P("9990776", lines[0]).get("Description")}: {money(br)}', f'the card rate the P&L charges is {money(rate)}', f'Rate {money(rate)}', cents(site_q * (rate - br)))
cl3, cl5 = P('9990776', 3), P('9990776', 5)
fix('9990776', '3, 5', 'Quantity', f'1.8 m security fence {cl3.get("Quantity"):g} m + with hoarding {cl5.get("Quantity"):g} m', f'{FQ.get("clean", 0):g} m of fence with no scrim on the signed dockets', f'Quantity {FQ.get("clean", 0) - (cl5.get("Quantity") or 0):g} m on line 3 (keep the {cl5.get("Quantity"):g} m with hoarding on line 5 if it is in the dockets\' clean metres)',
    cents((FQ.get('clean', 0) - (cl3.get('Quantity') or 0) - (cl5.get('Quantity') or 0)) * (cl3.get('Rate 1') or 0)))

# ------------------------------------------------------------------------------------------------- branch tie-out
PLB = {}
for r in site['branchTable']:
    if r and r[0] in ('KINP', 'MEAD', 'NVAC', 'STPS', 'Combined job') and r[0] not in PLB and len(r) >= 7 and all(re.fullmatch(r'-?\$[\d,]+\.\d\d', x) for x in r[1:7]):
        PLB[r[0]] = [float(x.replace('$', '').replace(',', '')) for x in r[1:7]]
bysa = collections.defaultdict(float)
for c in CONTRACTS:
    for l in bp[c]:
        q, pr, r1 = l.get('Quantity'), l.get('Price'), l.get('Rate 1')
        if not l.get('Sales Analysis Code'): continue
        amt = (q * pr) if hire(l) is False and isinstance(q, (int, float)) and isinstance(pr, (int, float)) else ((r1 or 0) * (q if isinstance(q, (int, float)) else 1))
        bysa[sa_branch(l)] += amt or 0

# ------------------------------------------------------------------------------------------------- workbook
wb = Workbook(); wb.remove(wb.active)
H = Font(bold=True); RED = PatternFill('solid', fgColor='F8CBAD'); AMB = PatternFill('solid', fgColor='FFF2CC'); GRN = PatternFill('solid', fgColor='E2EFDA'); BLU = PatternFill('solid', fgColor='DDEBF7')
def sheet(name, head, rows, widths, fill=None):
    s = wb.create_sheet(name); s.append(head)
    for c in s[1]: c.font = H; c.alignment = Alignment(wrap_text=True, vertical='top')
    for r in rows: s.append(list(r))
    for i, w in enumerate(widths): s.column_dimensions[chr(65 + i) if i < 26 else 'A' + chr(65 + i - 26)].width = w
    for row in s.iter_rows(min_row=2):
        for c in row: c.alignment = Alignment(wrap_text=True, vertical='top')
        if fill:
            f = fill(row)
            if f:
                for c in row: c.fill = f
    s.freeze_panes = 'A2'; return s
ORDER = {'Branch': 0, 'Decision': 1, 'Missing line': 2, 'Hours': 3, 'Rate': 4, 'Amount': 5, 'Quantity': 6, 'Remove': 7, 'Label': 8, 'Asset number': 9, 'Not on site': 10, 'Start date': 11}
FIX.sort(key=lambda f: (ORDER.get(f[2], 20), f[0], int(re.sub(r'\D', '', f[1].split(',')[0]) or 0) if re.sub(r'\D', '', f[1].split(',')[0]) else 0))
sheet('Fix list', ['Contract', 'Line(s)', 'What', 'Baseplan says', 'Site / P&L says (truth)', 'Change', '$ effect on Baseplan', 'Who'], FIX, [12, 12, 12, 48, 60, 50, 14, 12],
      lambda r: AMB if str(r[7].value) in ('Decision', 'Ask Andrew') else BLU if str(r[7].value) == 'Our record' else RED if str(r[2].value) in ('Branch', 'Missing line', 'Hours', 'Rate', 'Amount', 'Quantity', 'Remove') else GRN)
sheet('Every line', ['Contract', 'Line', 'Status', 'Item', 'Description', 'Qty', 'Rate 1', 'Price', 'Sales code', 'P&L branch', 'Start', 'Term', 'Reference on site', 'Turned up', 'Checks'],
      [(r['contract'], r['line'], r['status'], r['item'], r['desc'], r['qty'], r['rate1'], r['price'], r['sa'], r['pl_branch'], r['start'], r['term'], r['ref'], r['site_on'], '; '.join(r['check'])) for r in ROWS],
      [9, 6, 9, 14, 50, 6, 9, 9, 10, 8, 11, 11, 10, 11, 60], lambda r: AMB if r[14].value and not str(r[14].value).startswith(('fit-out', 'fencing', 'trakmat', 'held out')) else None)
sheet('Toilets by reference', ['Reference', 'Kind', 'On site', 'Baseplan', 'Baseplan lines', 'Turned up', 'Verdict'], TOIL, [10, 16, 8, 9, 30, 12, 24], lambda r: GRN if r[6].value == 'agrees' else RED)
sheet('Water barriers', ['Reference', 'State', 'Turned up', 'On site', 'Baseplan', 'Baseplan lines', 'Verdict'], WBR, [10, 11, 12, 8, 9, 40, 24], lambda r: GRN if r[6].value == 'agrees' else AMB)
sheet('Charge lines', ['Contract', 'Line', 'Baseplan line', 'Baseplan qty', 'Price', 'Baseplan $', 'Our count', 'Our $ at that price', 'Our basis (site record / P&L)', 'Verdict', 'Sales code', 'P&L branch'], CH,
      [9, 5, 34, 9, 8, 11, 9, 11, 60, 40, 10, 9], lambda r: GRN if r[9].value == 'agrees' else AMB)
sheet('Event labour', ['Role (C004 scope)', 'Scope hours', 'Rate', 'Scope $ (P&L)', 'P&L branch', 'Baseplan hours', 'Baseplan $', 'Baseplan lines'], EV, [30, 10, 8, 12, 9, 12, 12, 50])
sheet('Fencing (9990776)', ['Category', 'Signed dockets (to 25 Oct)', 'Card rate', 'P&L $', 'Baseplan lines', 'Baseplan qty', 'Baseplan rate', 'Baseplan $'], FEN + [('Total', None, None, fence['charged'], '', None, None, cents(sum(f[7] or 0 for f in FEN)))], [34, 14, 10, 13, 12, 12, 12, 13])
AC = HERE / 'evidence' / 'arrivals_check.json'   # arrivals_check.py: our record against Coates' delivery dockets
if AC.exists():
    A = json.load(open(AC))
    sheet('Arrivals vs dockets', ['Check', 'Our reference', 'Coates docket', 'Docket date', 'Number', 'What', 'Ours (turned up)', 'Days ours later', 'Finding', 'Who', 'Changes a charge?'],
          A['sheet'], [16, 16, 11, 11, 12, 34, 12, 9, 70, 10, 14], lambda r: GRN if str(r[9].value) == 'nobody' else AMB if str(r[9].value) == 'Andrew' else BLU)
sheet('Generators', ['Contract', 'Line', 'Baseplan line', 'Asset', 'Reference', 'Turned up', 'Baseplan start', 'Baseplan rate', 'P&L charge', 'P&L basis', 'Sales code'], GEN, [9, 5, 40, 9, 8, 11, 11, 11, 11, 50, 10])
sheet('On site, no line', ['Reference', 'Item', 'Asset no', 'Turned up', 'P&L branch'], MISS, [10, 24, 10, 12, 10])
# what each branch's Baseplan has to move by to match the P&L: the fix list's dollar effects, on the branch the P&L charges
LB = {}
for r in ROWS: LB[(r['contract'], str(r['line']))] = r['pl_branch']
def fix_branch(f):
    c, ln = str(f[0]), str(f[1]).split(',')[0].strip()
    if (c, ln) in LB and LB[(c, ln)]: return LB[(c, ln)]
    t = (str(f[3]) + ' ' + str(f[4]) + ' ' + str(f[5])).lower()
    if 'nvac' in t or 'generator' in t or 'forklift' in t: return 'NVAC'
    if 'stps' in t or 'fenc' in t or 'vms' in t or str(f[0]).startswith('9990776'): return 'STPS'
    if 'mead' in t: return 'MEAD'
    return 'KINP'
eff = collections.defaultdict(lambda: collections.defaultdict(float))
for f in FIX:
    if isinstance(f[6], (int, float)): eff[fix_branch(f)][f[7] + ' · ' + f[2]] += f[6]
TIE = []
for b in ('KINP', 'NVAC', 'STPS', 'MEAD'):
    p = PLB.get(b, [0] * 6)
    sure = cents(sum(v for k, v in eff[b].items() if not k.startswith(('Decision', 'Ask'))))
    dec = cents(sum(v for k, v in eff[b].items() if k.startswith(('Decision', 'Ask'))))
    TIE.append((b, p[0], p[3], sure, dec, '; '.join(f'{k}: {money(cents(v))}' for k, v in sorted(eff[b].items()))))
TIE.append(('All', PLB.get('Combined job', [0] * 6)[0], PLB.get('Combined job', [0] * 6)[3], cents(sum(t[3] for t in TIE)), cents(sum(t[4] for t in TIE)), ''))
sheet('Branch tie-out', ['Branch', 'P&L revenue, current record', 'P&L revenue, job total', 'Baseplan to move (fixes with a $ figure)', 'Waiting on a decision', 'Made up of'], TIE, [10, 16, 16, 18, 16, 120])
sheet('Start dates', ['Contract', 'Line', 'Baseplan line', 'Baseplan start', 'Turned up (site)', 'Days', 'Charged from when it goes in', 'Basis'],
      [(c, ln, d, fmt(a), fmt(b), dd, 'yes' if m else 'no - over the event; record only', basis) for c, ln, d, a, b, dd, m, basis in DATE_FIX], [9, 6, 46, 12, 14, 6, 26, 40],
      lambda r: AMB if r[6].value == 'yes' else None)
sheet('Since 22 Oct', ['Contract', 'Line', 'Change', 'Description', 'Detail'],
      [(r['contract'], r['line'], 'added', r.get('Description'), f"{r.get('Status')} | {r.get('Item')} | qty {r.get('Quantity')} | rate {r.get('Rate 1') or r.get('Price')} | {r.get('Sales Analysis Code')} | start {day(r.get('Start Date'))}") for r in diff['added']] +
      [(r['contract'], r['line'], 'removed', r.get('Description'), f"{r.get('Status')} | {r.get('Item')} | qty {r.get('Quantity')} | {r.get('Sales Analysis Code')}") for r in diff['gone']] +
      [(r['contract'], r['line'], 'changed', r.get('desc'), '; '.join(f'{k}: {v[0]} -> {v[1]}' for k, v in r['diff'].items() if k not in ('Prebill Amount', 'Number of Days', 'Split Revenue %', 'Delivery Number', 'Return Docket Number', 'Term Number', 'Booked Pickup Date', 'Rate ID'))) for r in diff['changed']],
      [9, 6, 9, 50, 120])
out = HERE / 'GC500_Baseplan7_vs_Site_25Oct2026.xlsx'; wb.save(out)
(HERE / 'evidence').mkdir(exist_ok=True)
summary = {'author': 'Author: Andrew Fisher', 'fixes': collections.Counter(f[2] for f in FIX), 'who': collections.Counter(f[7] for f in FIX), 'tie': TIE, 'lines': len(ROWS), 'start_dates': len(DATE_FIX),
           'diff': {k: len(v) for k, v in diff.items()}, 'water': wsum, 'forklifts_card': fsum, 'accommodation': [acc, bacc]}
json.dump(summary, open(HERE / 'evidence' / 'summary.json', 'w'), indent=1, default=str)
print(json.dumps(summary, default=str, indent=1))
