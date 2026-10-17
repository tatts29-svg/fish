"""Every toilet on the GC500 site record as an Excel register: one row per unit, plus a summary per reference.

python3 -I make_register.py toilets_record_9704.json GC500_Toilet_Register.xlsx [not_on_record.json]

Read-only: the input is read from the live page with read_toilets.cjs (GET only). Blank means the record does not say.
"""
import json
import re
import sys
from datetime import datetime, timedelta, timezone

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

TOILET = re.compile(r'^(FWF(\s*Trailer)?|Accessible\s*Toilet|Toilet\s*Block.*|\d+\s*Pan\s*Block|.*Toilet.*Block.*)$', re.I)
TYPE = {'FWF': 'FWF', 'FWF Trailer': 'FWF trailer', 'Accessible Toilet': 'Accessible toilet',
        'Toilet Block 6m': 'Toilet block 6m', '16Pan Block': '16-pan block'}
OWNER = {'coates': 'Coates', 'event-portables': 'Event Portables (sub-hire)'}
PIN_OK = {'master': 'Master plan D001 (not a phone pin)', 'pin': 'Phone pin', 'placed': 'Placed on map', 'confirmed': 'Confirmed'}
AREA_OK = {'precinct', 'area', 'rule'}
PREFIX_ORDER = {'WC': 0, 'PG': 1, 'T': 2}

HEAD = PatternFill('solid', fgColor='1F2937')
BAND = PatternFill('solid', fgColor='F3F4F6')
WARN = PatternFill('solid', fgColor='FEF3C7')
THIN = Side(style='thin', color='D1D5DB')
BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)


def ref_key(ref):
    m = re.match(r'^([A-Z]+)(\d+)', ref)
    return (PREFIX_ORDER.get(m.group(1), 3), m.group(1), int(m.group(2))) if m else (9, ref, 0)


def unit_type(u):
    # WC31's accessible toilet (1317645) is stored under the 16-pan line but labelled Accessible Toilet.
    if re.search(r'accessible\s*toilet', u.get('label') or '', re.I):
        return 'Accessible Toilet'
    return u.get('item') or ''


def pin_of(r):
    p = r['pos']
    if p.get('kind') in PIN_OK and p.get('lat') is not None and p.get('lon') is not None:
        return round(p['lat'], 6), round(p['lon'], 6), PIN_OK[p['kind']]
    return None, None, ''


def area_of(r):
    a = r.get('area') or {}
    return a.get('name') or '' if a.get('how') in AREA_OK else ''


def units_of(r):
    """Charge lines matched to recorded units; a blank asset number where the record has fewer units than charged."""
    pool = {}
    for u in r['units']:
        t = unit_type(u)
        if TOILET.match(t):
            pool.setdefault(t, []).append(u)
    rows = []
    for line in r['lines']:
        have = pool.pop(line['item'], [])
        for i in range(max(line['qty'], len(have))):
            rows.append((line['item'], have[i] if i < len(have) else None))
    for t, left in pool.items():  # units recorded with no charge line of their type
        rows.extend((t, u) for u in left)
    return rows


def style_sheet(ws, widths, n):
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    for c in ws[1]:
        c.font = Font(bold=True, color='FFFFFF')
        c.fill = HEAD
        c.alignment = Alignment(vertical='center', wrap_text=True)
        c.border = BOX
    ws.row_dimensions[1].height = 30
    ws.freeze_panes = 'B2'
    ws.auto_filter.ref = f'A1:{get_column_letter(len(widths))}{n + 1}'


def main(src, out, extra=None):
    data = json.load(open(src))
    rows = sorted(data['rows'], key=lambda r: ref_key(r['key']))
    at = datetime.fromisoformat(data['at'].replace('Z', '+00:00')).astimezone(timezone(timedelta(hours=10)))
    wb = Workbook()

    ws = wb.active
    ws.title = 'Every unit'
    cols = ['Reference', 'Qty', 'Asset No', 'Pin location (lat, long)', 'Area (drop point)', 'Type', 'Unit',
            'Owner', 'Location name', 'Plan section', 'Pin source', 'Map', 'Status', 'Lat', 'Long']
    ws.append(cols)
    totals, refs_out, n = {}, [], 0
    for r in rows:
        lat, lon, src_pin = pin_of(r)
        area, us = area_of(r), units_of(r)
        name = r['name'] or ''
        if name and not name.lower().startswith(r['key'].lower()):
            name = name
        nums = []
        for i, (item, u) in enumerate(us, 1):
            n += 1
            no = (u or {}).get('no') or ''
            nums.append(no or '(no number)')
            totals[item] = totals.get(item, 0) + 1
            ws.append([r['key'], 1, no, f'{lat:.6f}, {lon:.6f}' if lat is not None else '', area, TYPE.get(item, item),
                       f'{i} of {len(us)}', OWNER.get((u or {}).get('owner'), ''), name, r.get('sec') or '', src_pin,
                       None, r.get('state') or '', lat, lon])
            row = ws.max_row
            ws.cell(row, 3).number_format = '@'
            if lat is not None:
                c = ws.cell(row, 12)
                c.value = f'=HYPERLINK("https://www.google.com/maps?q={lat},{lon}","Open map")'
                c.font = Font(color='1D4ED8', underline='single')
            if not no:
                ws.cell(row, 3).fill = WARN
        refs_out.append((r, us, nums, lat, lon, src_pin, area))
    style_sheet(ws, [11, 6, 12, 24, 34, 17, 9, 24, 40, 11, 30, 11, 10, 11, 11], n)
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.border = BOX
            if c.row % 2 == 0 and c.fill != WARN:
                c.fill = BAND

    ws2 = wb.create_sheet('By reference')
    ws2.append(['Reference', 'Qty', 'Asset Nos', 'Pin location (lat, long)', 'Area (drop point)', 'Types',
                'Location name', 'Plan section', 'Pin source', 'Status'])
    for r, us, nums, lat, lon, src_pin, area in refs_out:
        kinds = {}
        for item, _ in us:
            kinds[TYPE.get(item, item)] = kinds.get(TYPE.get(item, item), 0) + 1
        ws2.append([r['key'], len(us), ', '.join(nums), f'{lat:.6f}, {lon:.6f}' if lat is not None else '', area,
                    ', '.join(f'{v} × {k}' for k, v in kinds.items()), r['name'] or '', r.get('sec') or '', src_pin,
                    r.get('state') or ''])
    ws2.append([])
    ws2.append(['Total', f'=SUM(B2:B{len(refs_out) + 1})'])
    ws2.cell(ws2.max_row, 1).font = ws2.cell(ws2.max_row, 2).font = Font(bold=True)
    style_sheet(ws2, [11, 6, 60, 24, 34, 30, 40, 11, 30, 10], len(refs_out))
    for row in ws2.iter_rows(min_row=2, max_row=len(refs_out) + 1):
        for c in row:
            c.border = BOX
            c.alignment = Alignment(vertical='top', wrap_text=c.column == 3)

    if extra:
        ex = json.load(open(extra))
        ws3 = wb.create_sheet('Not on the record')
        ws3.append(['Reference', 'Qty', 'Asset Nos', 'Type', 'What the sources say', 'Source'])
        for e in ex:
            ws3.append([e.get('ref', ''), e.get('qty'), ', '.join(e.get('units') or []), e.get('item', ''),
                        e.get('why', ''), e.get('source', '')])
        style_sheet(ws3, [11, 6, 30, 18, 70, 50], len(ex))
        for row in ws3.iter_rows(min_row=2):
            for c in row:
                c.border = BOX
                c.alignment = Alignment(vertical='top', wrap_text=True)

    wn = wb.create_sheet('Notes')
    lines = [
        ('GC500 toilet register', ''),
        ('Source', f'Live site record, version {data["version"]}, read {at:%d %b %Y %H:%M} (Gold Coast time)'),
        ('Covers', 'Every FWF, FWF trailer, accessible toilet, toilet block and 16-pan block on the record, including '
                   'pit garage (PG), T-numbered and team toilets. Waste tanks and pee panels are left out.'),
        ('References', len(refs_out)),
        ('Units', n),
    ]
    lines += [(f'  {TYPE.get(k, k)}', v) for k, v in sorted(totals.items(), key=lambda kv: -kv[1])]
    lines += [
        ('', ''),
        ('Qty', 'One row per unit, so Qty is 1 on each row and the column adds up to the total. "Unit" shows its place '
                'in the reference (3 of 17). The By reference sheet gives the quantity per reference.'),
        ('Asset No', 'The number recorded against the unit. 7-digit numbers are Coates assets; 2- to 4-digit numbers '
                     'are Event Portables unit numbers. Blank (shaded) where the record has no number for that unit.'),
        ('Pin location', 'The reference\'s position on the 2 Oct master plan (D001), as the page uses it. It is the '
                         'reference\'s spot, not a phone pin on each unit; units in a group share it. Blank where the '
                         'record has no position for the reference (pit garages and pit lane team toilets go to the '
                         'pit lane report point, which is not where they stand).'),
        ('Area', 'The drop point the page sends trucks to for that reference. Blank where the page has only its '
                 'default (pit lane entry) or no position to go on.'),
        ('Status', 'Delivery state on the record. Blank where the reference has no delivery entry.'),
        ('WC31', 'Accessible toilet 1317645 (Coates) is recorded under the 16-pan line but labelled Accessible Toilet; '
                 'it is shown here as the accessible toilet. Blocks 12 and 74 are Event Portables.'),
    ]
    for k, v in lines:
        wn.append([k, v])
    wn.column_dimensions['A'].width = 18
    wn.column_dimensions['B'].width = 110
    wn['A1'].font = Font(bold=True, size=14)
    for row in wn.iter_rows(min_row=2):
        row[0].font = Font(bold=True)
        row[1].alignment = Alignment(wrap_text=True, vertical='top')
        row[0].alignment = Alignment(vertical='top')

    wb.save(out)
    print(f'{len(refs_out)} references, {n} units', totals)


if __name__ == '__main__':
    main(*sys.argv[1:4])
