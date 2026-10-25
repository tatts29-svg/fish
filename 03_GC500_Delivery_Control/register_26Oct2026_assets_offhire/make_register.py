"""Author: Andrew Fisher. GC500 asset and off-hire register, from the live record (read_assets.cjs), one workbook.

Andrew, 26 Oct 2026: "I need full detailed list grouped. All assets. Map location. Description off hire date and time.
Buildings will have more info and in that will include assets inside. Group these too please. Include subhire."

    python3 -I make_register.py assets_live.json GC500_Asset_Offhire_Register.xlsx

Sheets: Summary · All assets (grouped, collapsible) · Buildings (more info, contents inside, collapsible) · Subhire
(by supplier, Advanced's fencing by docket) · Flat list (one row per unit, filter and sort) · Contract lines.
Blank means the record does not say. Nothing is invented: every figure comes from the record or the contract lines on it.
"""
import json, re, sys, datetime as dt
from collections import defaultdict, Counter
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

SRC = json.load(open(sys.argv[1], encoding='utf-8'))
OUT = sys.argv[2]

GROUPS = ['Portable buildings', 'Toilets & amenities', 'Water-filled barriers', 'Variable message signs', 'Generators',
          'Lighting towers', 'Access & plant', 'Furniture', 'Ground protection', 'Other']
OWNER = {'coates': 'Coates', 'event-portables': 'Event Portables (subhire)', 'prem-air-hire': 'Premiair Hire (subhire)',
         'other:united-rentals-royal-wolf': 'United Rentals / Royal Wolf (subhire)'}
PLAN_SRC = {'confirmed': 'Confirmed (typed due-out date)', 'plan': 'Plan (schedule removal row)', 'contract': 'Contract (rental off-hire date)',
            'proposed': 'Proposed (demob rule, not confirmed)'}
PIN = {'master': 'Master plan position', 'pin': 'Phone pin', 'placed': 'Placed on the map', 'desc': 'From the description',
       'report': 'Report point only (no drop-off set)', 'none': 'No position'}

# ---------- styles ----------
NAVY, ORANGE, GREY, PALE, WHITE = '1F2A44', 'F28C28', 'D9DDE3', 'F3F5F8', 'FFFFFF'
F_HEAD = Font(bold=True, color=WHITE, size=10); FILL_HEAD = PatternFill('solid', fgColor=NAVY)
F_GROUP = Font(bold=True, color=WHITE, size=11); FILL_GROUP = PatternFill('solid', fgColor='394B6E')
F_REF = Font(bold=True, size=10); FILL_REF = PatternFill('solid', fgColor=GREY)
F_UNIT = Font(size=10); F_IN = Font(italic=True, size=10, color='3D4F66'); F_NOTE = Font(size=9, color='5A6472')
F_TITLE = Font(bold=True, size=16, color=NAVY); F_SUB = Font(size=10, color='5A6472'); F_LINK = Font(size=10, color='1155CC', underline='single')
F_FLAG = Font(bold=True, size=10, color='B03A2E')
THIN = Side(style='thin', color='C9CED6'); BOX = Border(bottom=THIN)
WRAP = Alignment(wrap_text=True, vertical='top'); TOP = Alignment(vertical='top')


def iso_date(s):
    if not s or not isinstance(s, str) or not re.match(r'^\d{4}-\d{2}-\d{2}', s): return None
    return dt.date(int(s[:4]), int(s[5:7]), int(s[8:10]))


def nice_date(d):
    return f'{d.day} {d.strftime("%b %Y")}' if d else ''


def norm_no(x):
    s = re.sub(r'[^A-Za-z0-9]', '', str(x or '')).upper()
    return s[6:] if s.startswith('COATES') and len(s) > 6 else s


def clean(t):
    """Record wording as it reads on site: no agent attributions, no machine timestamps."""
    t = re.sub(r'\s*Recorded by [^.\n]*? at \d{4}-\d{2}-\d{2}T[\d:.]+Z\.?', '', str(t or ''))
    t = re.sub(r'\s+via (?:Codex|Claude)\b', '', t)
    return re.sub(r'[ \t]+', ' ', t).strip(' ;·')


def maps(lat, lon):
    return f'https://www.google.com/maps/search/?api=1&query={lat},{lon}' if lat is not None and lon is not None else None


# ---------- contract lines on the record ----------
CON = SRC.get('contract') or []
by_no, by_key, by_prefix = defaultdict(list), defaultdict(list), defaultdict(list)
for c in CON:
    n = norm_no(c.get('asset_no'))
    if n and not n.startswith('SUB') and n not in ('MISCITEM', 'TRANSPORT', 'LABOUR'): by_no[n].append(c)
    if c.get('match_key'): by_key[c['match_key']].append(c)
    m = re.match(r'^([A-Z]{1,4}\d{1,3}[A-Z]?(?:-[A-Z])?)\s', c.get('description') or '')
    if m: by_prefix[m.group(1)].append(c)


ITEM_CODES = {norm_no(c.get('asset_no')) for c in CON if c.get('asset_no') and norm_no(c.get('asset_no')) == norm_no(c.get('item'))
              and not norm_no(c.get('asset_no')).isdigit() and not norm_no(c.get('asset_no')).startswith('SUB')}
BY_LINE = {(str(c.get('contract')), int(c.get('line'))): c for c in CON if c.get('line') is not None}


def contract_when(c):
    """(date, time, words) the contract line goes off hire: the actual off-rent date once there is one, else the expected one."""
    if not c: return None, '', ''
    if c.get('term'):
        return iso_date(c['term']), '', f'off rent {nice_date(iso_date(c["term"]))} (actual)'
    return iso_date(c.get('expected_term')), c.get('expected_time') or '', 'expected'


def line_label(c):
    return f'{c["contract"]} · line {c["line"]}' if c else ''


# ---------- subhire inventory (Event Portables and others), VMS register ----------
INV_ROWS = list((SRC.get('supplier') or {}).get('inventory') or [])
INV = {}
for x in INV_ROWS:   # per reference, the row with a dropped pin first
    if x['ref'] not in INV or ('pin' in (x.get('locationBasis') or '').lower() and 'pin' not in (INV[x['ref']].get('locationBasis') or '').lower()): INV[x['ref']] = x
VMS = SRC.get('vms') or []
vms_by_fleet = {}
for b in SRC.get('vmsSample') or []: pass
for b in VMS:
    if b.get('fleet'): vms_by_fleet[norm_no(b['fleet'])] = b


def coords(s):
    m = re.search(r'(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)', s or '')
    return (float(m.group(1)), float(m.group(2))) if m else (None, None)


# ---------- one reference ----------
def where(r):
    pos = r.get('pos') or {}
    lat, lon, basis = pos.get('lat'), pos.get('lon'), PIN.get(pos.get('kind'), pos.get('label') or '')
    inv = INV.get(r['key'])
    if inv and 'pin' in (inv.get('locationBasis') or '').lower():
        la, lo = coords(inv.get('coordinates'))
        if la is not None: lat, lon, basis = la, lo, inv.get('locationBasis')
    loc = (r.get('locations') or [''])[0] or r.get('name') or ''
    return {'loc': loc, 'area': (r.get('area') or {}).get('name') or '', 'section': r.get('section') or '', 'lat': lat, 'lon': lon,
            'basis': basis, 'url': maps(lat, lon)}


def left_at(last):
    """The page's departure stamp '26/10/2026, 07:40:00 AEST' as '26 Oct 2026 07:40'; anything else as written."""
    m = re.match(r'(\d{1,2})/(\d{1,2})/(\d{4}),?\s*(\d{2}):(\d{2})', str(last or ''))
    if not m: return str(last or '')
    d, mo, y, hh, mm = m.groups()
    return f'{int(d)} {MONTHS[int(mo) - 1]} {y} {hh}:{mm}'


MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']


def status(r):
    dv, dep = r.get('delivery') or {}, r.get('departure') or {}
    if dv.get('state') == 'not on site': return 'Not on site'
    if dep.get('complete'): return f'Left site · {left_at(dep.get("last"))}'.strip(' ·')
    if dep.get('collected'): return f'{dep["collected"]} left, {dep.get("remaining")} still to leave · {left_at(dep.get("last"))}'
    return 'Still to leave'


def plan(r):
    d = r.get('demob') or {}
    return iso_date(d.get('iso')), PLAN_SRC.get(d.get('src'), 'Not in the demob plan' if not d.get('iso') else d.get('src') or '')


def ref_contract(r):
    """The contract line for the reference as a whole: one matched to it, else one whose description starts with its reference."""
    cs = by_key.get(r['key']) or by_prefix.get(r['key']) or []
    cs = [c for c in cs if not c.get('charge_line')]
    return cs[0] if cs else None


def unit_rows(r):
    """Units, then any quantity on a line with no unit number, in line order. Building contents come separately."""
    units = list(r.get('units') or [])
    acc_nos = {norm_no(a.get('no')) for a in r.get('accessories') or [] if a.get('no')}
    out, used = [], set()
    for ln in r.get('lines') or []:
        codes = [i for i, u in enumerate(units) if i not in used and u['item'] == ln['item'] and norm_no(u['no']) in ITEM_CODES]
        if codes and (ln['qty'] or 0) > 1:
            for i in codes: used.add(i)
            out.append({'item': ln['item'], 'qty': ln['qty'], 'no': '', 'owner': units[codes[0]]['owner'], 'code': units[codes[0]]['no']})
            continue
        mine = [i for i, u in enumerate(units) if i not in used and u['item'] == ln['item'] and norm_no(u['no']) not in acc_nos]
        take = mine[:max(ln['qty'], 0)] if ln['qty'] else mine
        for i in take: used.add(i); out.append({'item': ln['item'], 'qty': 1, 'no': units[i]['no'], 'owner': units[i]['owner']})
        short = (ln['qty'] or 0) - len(take)
        if short > 0: out.append({'item': ln['item'], 'qty': short, 'no': '', 'owner': '', 'nonum': True})
    for i, u in enumerate(units):
        if i in used or norm_no(u['no']) in acc_nos: continue
        out.append({'item': u['item'], 'qty': 1, 'no': u['no'], 'owner': u['owner'], 'extra': True})
    return out


def contents(r):
    """What the record has inside the reference: building contents (accessories) and its fire extinguishers."""
    rows = [{'type': a.get('type') or 'Contents', 'qty': a.get('qty'), 'no': a.get('no') or '', 'as_written': clean(a.get('as_written')),
             'origin': clean(a.get('origin'))} for a in r.get('accessories') or []]
    f = r.get('fire')
    if f and f.get('n'): rows.append({'type': 'Fire extinguisher', 'qty': f['n'], 'no': '', 'as_written': '', 'origin': 'ticked on the record'})
    return rows


REFS = [r for r in SRC['refs']]
REFS.sort(key=lambda r: (GROUPS.index(r['discipline']) if r['discipline'] in GROUPS else 99, r['key']))

# the VMS boards: each unit number on a VMS reference finds its board; boards on no reference are listed after
vms_used = set()
for r in REFS:
    if r['discipline'] != 'Variable message signs': continue
    for u in r.get('units') or []:
        b = vms_by_fleet.get(norm_no(u['no']))
        if b: vms_used.add(norm_no(b['fleet']))


def vms_where(b):
    ps = b.get('positions') or [{}]
    p = ps[-1]
    lat, lon = p.get('lat'), p.get('lon')
    title = p.get('title') or ''
    if title == 'Confirmed board location' and len(ps) > 1 and ps[-2].get('title'): title = f'{title} (moved from {ps[-2].get("pos")}: {ps[-2]["title"]})'
    return {'loc': f'Position {p.get("pos") or "—"} · {title}'.strip(' ·'), 'area': '', 'section': '', 'lat': lat, 'lon': lon,
            'basis': 'VMS register board position', 'url': maps(lat, lon), 'trail': ' → '.join(x.get('pos') or '' for x in ps)}


def vms_line(b):
    try: return BY_LINE.get((str(b.get('contract')), int(b.get('line'))))
    except (TypeError, ValueError): return None


def vms_name(b):
    for c in CON:
        if norm_no(c.get('asset_no')) == norm_no(b.get('fleet')):
            m = re.match(r'^(VMS\d{2})', c.get('description') or '')
            if m: return m.group(1)
    return ''


VMS_NAME = {norm_no(b['fleet']): (b.get('name') or vms_name(b)) for b in VMS if b.get('fleet')}
for x in SRC.get('vmsSample') or []: pass

# ---------- the workbook ----------
wb = Workbook()
asat = dt.datetime.fromisoformat(SRC['at'].replace('Z', '+00:00')) + dt.timedelta(hours=10)
ASAT = f'{asat.day} {asat.strftime("%b %Y %H:%M")} AEST'


def header(ws, cols, widths, row=1):
    for i, (c, w) in enumerate(zip(cols, widths), 1):
        x = ws.cell(row=row, column=i, value=c); x.font = F_HEAD; x.fill = FILL_HEAD; x.alignment = Alignment(wrap_text=True, vertical='center')
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[row].height = 30
    ws.freeze_panes = ws.cell(row=row + 1, column=3)
    ws.sheet_properties.outlinePr.summaryBelow = False


def put(ws, row, values, font=F_UNIT, fill=None, level=0, link_col=None, wrap_cols=()):
    for i, v in enumerate(values, 1):
        x = ws.cell(row=row, column=i, value=v)
        x.font = font; x.border = BOX; x.alignment = WRAP if i in wrap_cols else TOP
        if fill: x.fill = fill
        if isinstance(v, dt.date): x.number_format = 'd mmm yyyy'
    if link_col and values[link_col - 1]:
        x = ws.cell(row=row, column=link_col); url = values[link_col - 1]
        x.value = 'Open map'; x.hyperlink = url; x.font = F_LINK
    if level: ws.row_dimensions[row].outline_level = level


# ===== All assets (grouped) =====
ws = wb.active; ws.title = 'All assets'
COLS = ['Group', 'Ref', 'Description', 'Item', 'Qty', 'Asset / fleet no', 'Owner', 'Location', 'Area', 'Plan section', 'Lat', 'Long', 'Map',
        'Pin basis', 'Off-hire (demob plan)', 'Plan source', 'Contract off-hire date', 'Contract off-hire time', 'Contract · line',
        'Contract status', 'Status on site', 'Notes']
W = [17, 9, 34, 22, 6, 16, 22, 34, 30, 9, 11, 11, 10, 24, 14, 26, 14, 10, 18, 12, 18, 40]
ws.cell(row=1, column=1, value=f'GC500 2026 · every asset, grouped · live record as at {ASAT} · version {SRC.get("version")}').font = F_TITLE
ws.cell(row=2, column=1, value='Use the 1 · 2 · 3 buttons on the left to fold: 1 groups, 2 references, 3 every unit and what is inside each building. Blank means the record does not say.').font = F_SUB
header(ws, COLS, W, row=4)
row = 5
FLAT = []   # one row per unit for the flat sheet


def unit_contract(u, r, rc):
    c = (by_no.get(norm_no(u['no'])) or [None])[0] if u.get('no') else None
    if not c and u.get('owner') == 'other:united-rentals-royal-wolf':
        subs = [x for x in CON if x.get('sub') == 'ROY002']
        c = subs[0] if len(subs) == 1 else None
    return c or rc


def ref_contract_summary(r, units, rc):
    """(line words, date, time, status, words): one line as it is; several lines summed up."""
    cs = [unit_contract(u, r, None) for u in units]
    cs = [c for c in cs if c]
    uniq = {(c['contract'], c['line']): c for c in cs}
    if len(uniq) <= 1:
        c = next(iter(uniq.values())) if uniq else rc
        d, t, w = contract_when(c)
        return line_label(c), d, t, (c or {}).get('status') or '', w
    whens = {contract_when(c)[:2] for c in uniq.values()}
    d, t = next(iter(whens)) if len(whens) == 1 else (None, '')
    sts = sorted({c.get('status') or '' for c in uniq.values()})
    cons = sorted({c['contract'] for c in uniq.values()})
    return f'{len(uniq)} lines on {", ".join(cons)}', d, t, ', '.join(x for x in sts if x), '' if len(whens) == 1 else 'off-hire dates differ by line (see units)'


def emit_ref(ws, row, grp, r, where_, units, inside, rc, extra_note=''):
    pdate, psrc = plan(r)
    lw, cdate, ctime, cstat, cwords = ref_contract_summary(r, units, rc)
    qty = sum(u['qty'] for u in units) or sum(l['qty'] for l in r.get('lines') or [])
    items = ', '.join(f'{l["item"]} × {l["qty"]}' for l in r.get('lines') or [])
    owners = sorted({OWNER.get(u['owner'], u['owner']) for u in units if u.get('owner')})
    rn = re.sub(r'\s+', ' ', clean(r.get('note'))).strip()
    if len(rn) > 180: rn = rn[:177].rsplit(' ', 1)[0] + '…'
    notes = '; '.join(x for x in [extra_note, ('not in the demob plan' if not pdate else ''), rn,
                                  ('subhire: ' + r['subhire']['co']) if r.get('subhire') else '', cwords if cwords and cwords != 'expected' else ''] if x)
    put(ws, row, [grp, r['key'], r.get('name') or '', items, qty, '', ', '.join(owners), where_['loc'], where_['area'], where_['section'],
                  where_['lat'], where_['lon'], where_['url'], where_['basis'], pdate, psrc, cdate, ctime, lw,
                  cstat, status(r), notes], font=F_REF, fill=FILL_REF, level=1, link_col=13, wrap_cols=(3, 4, 8, 9, 22))
    return row + 1


for grp in GROUPS:
    grefs = [r for r in REFS if r['discipline'] == grp]
    if not grefs: continue
    nunits = 0
    gstart = row
    put(ws, row, [f'{grp.upper()}'] + [''] * (len(COLS) - 1), font=F_GROUP, fill=FILL_GROUP); row += 1
    for r in grefs:
        w_ = where(r); us = unit_rows(r); ins = contents(r); rc = ref_contract(r)
        row = emit_ref(ws, row, grp, r, w_, us, ins, rc)
        pdate, psrc = plan(r)
        for u in us:
            uc = unit_contract(u, r, rc)
            uw = dict(w_)
            note = []
            if u.get('nonum'): note.append('no unit number on the record')
            if u.get('code'): note.append(f'quantity item, code {u["code"]}')
            if u.get('extra'): note.append('unit on the reference outside its schedule lines')
            label = u['item'] + ('' if u['qty'] == 1 else f' × {u["qty"]}')
            if grp == 'Variable message signs':
                b = vms_by_fleet.get(norm_no(u['no']))
                if b:
                    uw = vms_where(b); uc = vms_line(b) or uc
                    label = f'{b.get("name") or "VMS"} · VMS board'
                    note.append(f'rego {b.get("rego") or "—"} · positions {uw["trail"]}')
            cdate, ctime, cwords = contract_when(uc)
            vals = [grp, r['key'], r.get('name') or '', label, u['qty'], u['no'], OWNER.get(u['owner'], u['owner']), uw['loc'], uw['area'], uw['section'],
                    uw['lat'], uw['lon'], uw['url'], uw['basis'], pdate, psrc, cdate, ctime, line_label(uc), (uc or {}).get('status') or '', status(r),
                    '; '.join(note + ([cwords] if cwords and cwords != 'expected' else []))]
            put(ws, row, vals, level=2, link_col=13, wrap_cols=(3, 8, 9, 22)); row += 1
            nunits += u['qty']
            FLAT.append(vals)
        for c in ins:
            vals = [grp, r['key'], r.get('name') or '', f'↳ Inside: {c["type"]}', c['qty'], c['no'], 'Coates', w_['loc'], w_['area'], w_['section'],
                    w_['lat'], w_['lon'], w_['url'], w_['basis'], pdate, psrc, None, '', '', '', status(r),
                    '; '.join(x for x in [c['as_written'] if c['as_written'] and c['as_written'] != c['type'] else '', c['origin']] if x)]
            put(ws, row, vals, font=F_IN, level=2, link_col=13, wrap_cols=(3, 8, 9, 22)); row += 1
            FLAT.append(vals)
    if grp == 'Variable message signs':
        extra = [b for b in VMS if norm_no(b.get('fleet')) not in vms_used]
        if extra:
            put(ws, row, [grp, '—', f'VMS boards on the VMS register but on no reference · {len(extra)}', 'VMS', len(extra), '', '', '', '', '', None, None, None, '',
                          None, 'Not in the demob plan', None, '', '', '', '', 'on the board register with their positions; no schedule reference carries them'],
                font=F_REF, fill=FILL_REF, level=1, wrap_cols=(3, 22)); row += 1
        for b in extra:
            uw = vms_where(b); c0 = vms_line(b)
            cdate, ctime, cwords = contract_when(c0)
            vals = [grp, '—', 'VMS board on the register', f'{b.get("name") or "VMS"} · VMS board', 1, b.get('fleet') or '',
                    'Premiair Hire (subhire)' if (b.get('co') or '').startswith('Premiair') else 'Coates', uw['loc'], '', '', uw['lat'], uw['lon'], uw['url'], uw['basis'],
                    None, 'Not in the demob plan', cdate, ctime, line_label(c0), (c0 or {}).get('status') or '',
                    'Left site · ' + b['departure']['at'] if b.get('departure') else 'Still to leave', f'rego {b.get("rego") or "—"} · positions {uw["trail"]}']
            put(ws, row, vals, level=2, link_col=13, wrap_cols=(3, 8, 22)); row += 1
            FLAT.append(vals); nunits += 1
    ws.cell(row=gstart, column=3, value=f'{len(grefs)} references · {nunits} units').font = F_GROUP
ws.auto_filter.ref = None

# ===== Buildings (more info, contents inside) =====
wsb = wb.create_sheet('Buildings')
BC = ['Ref', 'Building', 'Item', 'Asset no', 'Contract description', 'Contract · line', 'Location', 'Area', 'Plan section', 'Lat', 'Long', 'Map', 'Pin basis',
      'On site', 'Levelled', 'Steps', 'Fire extinguisher', 'Things inside', 'Off-hire (demob plan)', 'Plan source', 'Contract off-hire date',
      'Contract off-hire time', 'Contract status', 'Status on site', 'Notes']
BW = [8, 30, 18, 12, 40, 18, 32, 28, 9, 11, 11, 10, 22, 9, 9, 8, 9, 9, 14, 26, 14, 10, 12, 16, 36]
wsb.cell(row=1, column=1, value=f'GC500 2026 · buildings and what is inside them · as at {ASAT}').font = F_TITLE
wsb.cell(row=2, column=1, value='Each building, then (folded under it) every item the record has inside it with its asset number. Press 2 on the left to open them all.').font = F_SUB
header(wsb, BC, BW, row=4)
row = 5
for r in [r for r in REFS if r['discipline'] == 'Portable buildings']:
    w_ = where(r); us = unit_rows(r); ins = contents(r); rc = ref_contract(r); pdate, psrc = plan(r); dv = r.get('delivery') or {}
    bunits = [u for u in us] or [{'item': ', '.join(l['item'] for l in r.get('lines') or []), 'qty': 1, 'no': '', 'owner': ''}]
    fire = r.get('fire') or {}
    for k, u in enumerate(bunits):
        uc = unit_contract(u, r, rc)
        cdate, ctime, cwords = contract_when(uc)
        vals = [r['key'], r.get('name') or '', u['item'] + ('' if u['qty'] == 1 else f' × {u["qty"]}'), u['no'], (uc or {}).get('description') or '', line_label(uc),
                w_['loc'], w_['area'], w_['section'], w_['lat'], w_['lon'], w_['url'], w_['basis'], 'Yes' if dv.get('state') == 'on site' else (dv.get('state') or ''),
                'Yes' if dv.get('levelled') else '', 'Yes' if dv.get('steps') else '', fire.get('n') or '', len(ins) if k == 0 else '', pdate, psrc, cdate, ctime,
                (uc or {}).get('status') or '', status(r), '; '.join(x for x in [OWNER.get(u['owner'], '') if u.get('owner') and u['owner'] != 'coates' else '',
                                                                                 'no unit number on the record' if u.get('nonum') else '', cwords if cwords and cwords != 'expected' else ''] if x)]
        put(wsb, row, vals, font=F_REF, fill=FILL_REF, link_col=12, wrap_cols=(2, 5, 7, 8, 25)); row += 1
    for c in ins:
        vals = ['', f'↳ Inside {r["key"]}', c['type'], c['no'], '', '', '', '', '', None, None, None, '', '', '', '',
                '', c['qty'], None, '', None, '', '', '', '; '.join(x for x in [c['as_written'] if c['as_written'] and c['as_written'] != c['type'] else '', c['origin']] if x)]
        put(wsb, row, vals, font=F_IN, level=1, wrap_cols=(2, 5, 25)); row += 1

# ===== Subhire =====
wss = wb.create_sheet('Subhire')
SC = ['Supplier', 'Ref', 'Description', 'Item', 'Qty on site', 'Unit / fleet numbers', 'Location', 'Lat', 'Long', 'Map', 'Pin basis',
      'Off-hire (demob plan)', 'Plan source', 'Supplier out date', 'Contract off-hire date', 'Contract off-hire time', 'Contract · line', 'Status', 'Notes']
SW = [24, 9, 32, 16, 8, 30, 34, 11, 11, 10, 22, 14, 26, 12, 14, 10, 18, 22, 36]
wss.cell(row=1, column=1, value=f'GC500 2026 · subhire, by supplier · as at {ASAT}').font = F_TITLE
wss.cell(row=2, column=1, value='Equipment Coates hires in. Advanced Temporary Fencing is listed by docket: what was put in where, and what has been collected.').font = F_SUB
header(wss, SC, SW, row=4)
row = 5
refs_by_key = {r['key']: r for r in REFS}


def supplier_block(name, rows):
    global row
    put(wss, row, [name.upper()] + [''] * (len(SC) - 1), font=F_GROUP, fill=FILL_GROUP); row += 1
    for v in rows:
        put(wss, row, v, level=1, link_col=10, wrap_cols=(3, 6, 7, 19)); row += 1


# Event Portables: their inventory rows
ep = []
for x in sorted(INV_ROWS, key=lambda y: (y['ref'], y.get('item') or '')):
    ref = x['ref']
    r = refs_by_key.get(ref) or {}
    la, lo = coords(x.get('coordinates'))
    pdate, psrc = plan(r) if r else (None, '')
    ep.append(['Event Portables', ref, x.get('name') or r.get('name') or '', x.get('item') or '', x.get('onSite'), ', '.join(x.get('remainingNumbers') or x.get('numbers') or []),
               (x.get('location') or '').split('\n')[0], la, lo, maps(la, lo), x.get('locationBasis') or '', pdate, psrc, iso_date(x.get('outDate')), None, '', '', x.get('status') or '',
               '; '.join(y for y in [x.get('outSource') or '', 'held: not ready to go' if x.get('dispatchHold') else ''] if y)])
supplier_block(f'Event Portables · {sum((x.get("onSite") or 0) for x in INV_ROWS)} units on site across {len({x["ref"] for x in INV_ROWS})} references', ep)

# Premiair: the nine boards on the VMS register, with their positions and contract lines
pre = []
for b in VMS:
    if not (b.get('co') or '').startswith('Premiair'): continue
    uw = vms_where(b); c0 = vms_line(b); cdate, ctime, cwords = contract_when(c0)
    ref = next((r for r in REFS if r['discipline'] == 'Variable message signs' and any(norm_no(u['no']) == norm_no(b.get('fleet')) for u in r.get('units') or [])), None)
    pdate, psrc = plan(ref) if ref else (None, 'Not in the demob plan')
    pre.append(['Premiair Hire', (ref or {}).get('key') or '—', f'{b.get("name")} · VMS board', 'VMS', 1, f'fleet {b.get("fleet")} · rego {b.get("rego") or "—"}', uw['loc'], uw['lat'], uw['lon'], uw['url'],
                uw['basis'], pdate, psrc, None, cdate, ctime, line_label(c0), 'Left site · ' + b['departure']['at'] if b.get('departure') else 'Still to leave', f'positions {uw["trail"]}'])
supplier_block(f'Premiair Hire · {len(pre)} VMS boards', pre)

# Royal Wolf: units on the record with their contract lines
for owner, name in [('other:united-rentals-royal-wolf', 'United Rentals / Royal Wolf')]:
    rows_ = []
    for r in REFS:
        for u in unit_rows(r):
            if u.get('owner') != owner: continue
            w_ = where(r); pdate, psrc = plan(r)
            uc = unit_contract(u, r, ref_contract(r))
            b = vms_by_fleet.get(norm_no(u['no']))
            if b: w_ = vms_where(b)
            cdate, ctime, cwords = contract_when(uc)
            rows_.append([name, r['key'], r.get('name') or '', u['item'], u['qty'], u['no'], w_['loc'], w_['lat'], w_['lon'], w_['url'], w_['basis'], pdate, psrc, None,
                          cdate, ctime, line_label(uc), status(r), (VMS_NAME.get(norm_no(u['no'])) or '') + (f' · rego {b.get("rego")}' if b and b.get('rego') else '')])
    subs = [c for c in CON if c.get('sub') == 'ROY002']
    shown = {x[16] for x in rows_}
    for c in subs:
        if line_label(c) in shown or any(norm_no(c.get('asset_no')) == norm_no(x[5]) for x in rows_): continue
        cdate, ctime, cwords = contract_when(c)
        rows_.append([name, (re.match(r'^([A-Z]{1,4}\d{1,3})', c.get('description') or '') or [''])[0], c.get('description') or '', c.get('family') or '', c.get('qty'), c.get('asset_no') or '',
                      '', None, None, None, '', None, '', None, cdate, ctime, line_label(c), c.get('status') or '', 'contract line; the unit is not on a reference'])
    supplier_block(f'{name} · {len(rows_)} line{"" if len(rows_) == 1 else "s"}', rows_)

# Advanced: fencing by docket, then collections
fx = []
FK = [('clean', 'clean m'), ('scrim', 'scrim m'), ('ccb_event', 'CCB event m'), ('ccb_demarc', 'CCB demarcation m'), ('ped_gates', 'ped gates'), ('v_gates', 'vehicle gates'),
      ('flat_feet', 'flat feet'), ('fence_blocks', 'blocks'), ('relocation', 'relocation'), ('labour', 'labour h')]
for x in sorted(SRC.get('fencing') or [], key=lambda d: (d.get('date') or '9999', d.get('no') or '')):
    q = x.get('q') or {}
    what = ', '.join(f'{q[k]:g} {lab}' for k, lab in FK if q.get(k))
    fx.append(['Advanced Temporary Fencing', x.get('no') if not str(x.get('no')).startswith('workbook') else '', x.get('location') or (x.get('week') or ''), what or '—', None, '',
               x.get('location') or '', None, None, None, '', None, 'Removal: by Advanced, by the hour; dates not on the record', None, None, '', '',
               'Installed ' + nice_date(iso_date(x.get('date'))) if x.get('date') else (x.get('week') or ''), 'docket' if not str(x.get('no')).startswith('workbook') else 'week sheet row'])
for c in sorted(SRC.get('collections') or [], key=lambda d: (d.get('date') or '9999', d.get('no') or '')):
    col = c.get('collected') or {}
    fx.append(['Advanced Temporary Fencing', c.get('no'), 'Collected: ' + (c.get('location') or ''), ', '.join(f'{v:g} {k.replace("_", " ")}' for k, v in col.items()) or '—', None, '',
               c.get('location') or '', None, None, None, '', None, '', None, None, '', '', 'Collected ' + nice_date(iso_date(c.get('date'))), 'collection form'])
supplier_block(f'Advanced Temporary Fencing · {len(SRC.get("fencing") or [])} dockets and week rows, {len(SRC.get("collections") or [])} collections', fx)

# ===== Flat list =====
wsf = wb.create_sheet('Flat list')
wsf.cell(row=1, column=1, value=f'GC500 2026 · one row per unit and per item inside a building · as at {ASAT} · filter or sort on any column').font = F_TITLE
header(wsf, COLS, W, row=3)
for i, v in enumerate(FLAT, 4):
    put(wsf, i, v, font=F_IN if str(v[3]).startswith('↳') else F_UNIT, link_col=13, wrap_cols=())
wsf.auto_filter.ref = f'A3:{get_column_letter(len(COLS))}{3 + len(FLAT)}'

# ===== Contract lines =====
wsc = wb.create_sheet('Contract lines')
CC = ['Contract', 'Branch', 'Line', 'Description', 'Item', 'Asset no', 'Qty', 'Status', 'Start date', 'Start time', 'Expected off-hire date', 'Expected off-hire time',
      'Actual off-rent date', 'Booked pickup', 'Subhire supplier code', 'Matched ref']
CW = [10, 8, 6, 46, 18, 16, 6, 10, 12, 8, 14, 10, 14, 12, 12, 10]
wsc.cell(row=1, column=1, value=f'GC500 2026 · the rental contract lines on the record · as at {ASAT}').font = F_TITLE
header(wsc, CC, CW, row=3)
for i, c in enumerate(sorted(CON, key=lambda c: (c['contract'], c['line'])), 4):
    put(wsc, i, [c['contract'], c['branch'], c['line'], c['description'], c['item'], c['asset_no'], c['qty'], c['status'], iso_date(c['start']), c.get('start_time') or '',
                 iso_date(c['expected_term']), c.get('expected_time') or '', iso_date(c['term']), iso_date(c['booked_pickup']), c.get('sub') or '', c.get('match_key') or c.get('match_task') or ''])
wsc.auto_filter.ref = f'A3:{get_column_letter(len(CC))}{3 + len(CON)}'

# ===== Summary (first) =====
wsm = wb.create_sheet('Summary', 0)
wsm.column_dimensions['A'].width = 34; [wsm.column_dimensions.__setitem__(c, wsm.column_dimensions[c]) for c in 'BCDEF']
for c, w in zip('BCDEF', [12, 10, 14, 16, 16]): wsm.column_dimensions[c].width = w
wsm['A1'] = 'GC500 2026 · asset and off-hire register'; wsm['A1'].font = F_TITLE
wsm['A2'] = f'From the live site record, version {SRC.get("version")}, as at {ASAT}. Every asset on the record, grouped, with where it is, what it is and when it goes off hire.'; wsm['A2'].font = F_SUB
r0 = 4
for i, h in enumerate(['Group', 'References', 'Units', 'Subhire units', 'First off-hire (plan)', 'Last off-hire (plan)'], 1):
    x = wsm.cell(row=r0, column=i, value=h); x.font = F_HEAD; x.fill = FILL_HEAD
row = r0 + 1
tot = [0, 0, 0]
for grp in GROUPS:
    grefs = [r for r in REFS if r['discipline'] == grp]
    if not grefs: continue
    us = [u for r in grefs for u in unit_rows(r)]
    n_units = sum(u['qty'] for u in us) + (sum(1 for b in VMS if norm_no(b.get('fleet')) not in vms_used) if grp == 'Variable message signs' else 0)
    n_sub = sum(u['qty'] for u in us if u.get('owner') and u['owner'] != 'coates')
    ds = sorted(d for d in (plan(r)[0] for r in grefs) if d)
    for i, v in enumerate([grp, len(grefs), n_units, n_sub, ds[0] if ds else None, ds[-1] if ds else None], 1):
        x = wsm.cell(row=row, column=i, value=v); x.border = BOX
        if isinstance(v, dt.date): x.number_format = 'd mmm yyyy'
    tot[0] += len(grefs); tot[1] += n_units; tot[2] += n_sub; row += 1
for i, v in enumerate(['Total', tot[0], tot[1], tot[2]], 1):
    x = wsm.cell(row=row, column=i, value=v); x.font = F_REF; x.fill = FILL_REF
row += 1
n_inside = sum(len(contents(r)) for r in REFS if r['discipline'] == 'Portable buildings')
wsm.cell(row=row, column=1, value=f'Inside the buildings: {n_inside} recorded items (contents and fire extinguishers) on {sum(1 for r in REFS if r["discipline"] == "Portable buildings" and contents(r))} buildings.').font = F_NOTE
row += 1
wsm.cell(row=row, column=1, value=f'Advanced Temporary Fencing: {len(SRC.get("fencing") or [])} dockets and week rows, {len(SRC.get("collections") or [])} collections (Subhire sheet).').font = F_NOTE
row += 2
x = wsm.cell(row=row, column=1, value='Off-hire by day (demob plan)'); x.font = F_REF; row += 1
for i, h in enumerate(['Day', 'References', 'Confirmed', 'Plan', 'Contract', 'Proposed'], 1):
    x = wsm.cell(row=row, column=i, value=h); x.font = F_HEAD; x.fill = FILL_HEAD
row += 1
days = defaultdict(Counter)
for r in REFS:
    d = r.get('demob') or {}
    if d.get('iso'): days[d['iso']][d.get('src') or '?'] += 1
for k in sorted(days):
    c = days[k]
    for i, v in enumerate([iso_date(k), sum(c.values()), c.get('confirmed', 0), c.get('plan', 0), c.get('contract', 0), c.get('proposed', 0)], 1):
        x = wsm.cell(row=row, column=i, value=v); x.border = BOX
        if isinstance(v, dt.date): x.number_format = 'ddd d mmm yyyy'
    row += 1
row += 1
x = wsm.cell(row=row, column=1, value='What the columns mean'); x.font = F_REF; row += 1
legend = [
    ('Off-hire (demob plan)', 'The site demob plan\'s day for the reference. Its source says how firm it is:'),
    ('   Confirmed', 'a person typed the due-out date.'), ('   Plan', 'the schedule has a removal row for it.'),
    ('   Contract', 'the rental contract\'s off-hire date.'), ('   Proposed', 'worked out by the demob rule; not on the record until someone confirms it.'),
    ('Contract off-hire date / time', 'The rental contract line on the record: the actual off-rent date once there is one, else the expected off-hire date and the time where the contract has one.'),
    ('Status on site', 'From the page\'s "left site" record. Still to leave until a departure is recorded with its date and time.'),
    ('Pin basis', 'Master plan position = from the 2 Oct master plan, not a phone pin. Report point only = no drop-off set; the site directs drivers from the pit lane. Andrew\'s pin = a pin dropped on site.'),
    ('Map', 'Opens Google Maps at the latitude and longitude.'),
    ('↳ Inside', 'An item the record has inside the building (contents and fire extinguishers), with its asset number where recorded.'),
    ('Blank', 'The record does not say. Nothing is filled in by guess.')]
for a, b in legend:
    wsm.cell(row=row, column=1, value=a).font = F_UNIT; x = wsm.cell(row=row, column=2, value=b); x.font = F_NOTE; row += 1
row += 1
x = wsm.cell(row=row, column=1, value='Gaps on the record today'); x.font = F_FLAG; row += 1
gaps = [
    (sum(1 for r in REFS if (r.get('pos') or {}).get('kind') == 'report'), 'references with no drop-off position (report point only)'),
    (sum(1 for r in REFS if (r.get('pos') or {}).get('kind') in (None, 'none')), 'references with no position at all'),
    (sum(1 for r in REFS if not plan(r)[0]), 'references not in the demob plan'),
    (sum(1 for r in REFS if (r.get('demob') or {}).get('src') == 'proposed'), 'off-hire days proposed by the demob rule, not yet confirmed'),
    (sum(1 for r in REFS if (r.get('delivery') or {}).get('state') == 'not on site'), 'references the record has as not on site'),
    (sum(u['qty'] for r in REFS for u in unit_rows(r) if u.get('nonum')), 'units with no unit number on the record'),
    (sum(1 for c in CON if not c.get('expected_time') and not c.get('charge_line')), 'contract lines with no off-hire time'),
    (sum(1 for r in REFS if (r.get('departure') or {}).get('collected')), 'references with a departure recorded so far')]
for n, t in gaps:
    wsm.cell(row=row, column=1, value=n).font = F_REF; wsm.cell(row=row, column=2, value=t).font = F_UNIT; row += 1

TITLES = {'All assets': '4:4', 'Buildings': '4:4', 'Subhire': '4:4', 'Flat list': '3:3', 'Contract lines': '3:3'}
for s in wb.worksheets:
    s.sheet_view.zoomScale = 90
    s.page_setup.orientation = 'landscape'; s.page_setup.paperSize = s.PAPERSIZE_A4
    s.page_setup.fitToWidth = 1 if s.title in ('Summary', 'Contract lines') else 2; s.page_setup.fitToHeight = 0
    s.sheet_properties.pageSetUpPr.fitToPage = True
    s.print_options.gridLines = False
    if s.title in TITLES: s.print_title_rows = TITLES[s.title]
    s.oddFooter.center.text = 'GC500 2026 · asset and off-hire register · &P of &N'
wb.save(OUT)
print(f'{OUT}: {tot[0]} references, {tot[1]} units ({tot[2]} subhire), {n_inside} items inside buildings, {len(FLAT)} flat rows, {len(CON)} contract lines')
