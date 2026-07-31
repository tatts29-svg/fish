#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | MISSING PICTURES - the photo gap list, as a spreadsheet
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 31 Jul 2026): "a script to find missing picture then
#  goes into a excel so then I know what to look for and how it need
#  to be attached".
#
#  56_PHOTO_HUNT is the clickable browser version of this hunt; this
#  is the same truth as an Excel you can sort, filter, print and tick
#  off on a clipboard. One row per picture the register still needs:
#  what the thing is, which aisle it lives in, how many items hide
#  behind the one photo, the EXACT filename to save it as, and a
#  search link. A second sheet lists what's already covered - and by
#  which file - so the radio/gas near-enough names can be seen doing
#  their job.
#
#  Counting "covered" uses the SAME matching as the build itself
#  (exact name, near-enough name, and the radio/gas word match), so
#  this list never asks for a photo the build already has.
# =====================================================================
import datetime as dt
import os
import sys

import mygear_thumbs

HERE = os.path.dirname(os.path.abspath(__file__))

ORANGE = 'F26222'
INK = '1D1D1B'
GREY = '8A94A2'


def main():
    print('=' * 66)
    print(' COATES | MISSING PICTURES - the photo gap list')
    print('=' * 66)
    reg = mygear_thumbs.variant_register(HERE)
    if not reg:
        print(' No RENTAL_STOCK / SALES_STOCK exports found - run the')
        print(' morning downloads first.')
        return 1
    safe = mygear_thumbs.safe_name
    #  the same claim logic the build uses - exact, near-enough, and
    #  the radio/gas word match - so DONE here means DONE on the page
    claimed = mygear_thumbs.alias_photos(
        dict(mygear_thumbs._photo_files(HERE)), reg.keys(),
        loose={c: v.get('n', '') for c, v in reg.items() if v.get('drv')})

    #  "covered" is not "on the page": the page shows the SHRUNK thumb
    #  out of Gear_Lookup\thumbs, built by 04. A photo sitting in
    #  Photos\ that hasn't shrunk yet still shows a two-letter tile -
    #  so this list says which it is, honestly ("some pictures dont
    #  show and it says i have all images", 31 Jul 2026).
    tdir = os.path.join(HERE, 'Gear_Lookup', 'thumbs')
    missing, covered = [], []
    unshrunk = 0
    for code, e in reg.items():
        row = {'code': code, 'n': e['n'] or code, 'f': e['f'] or '',
               'q': e['q'],
               'k': 'Consumable' if e['k'] == 'cons' else
                    ('Radio / gas fleet' if e.get('drv') else 'Hire gear')}
        hit = claimed.get(safe(code))
        if hit is None:
            missing.append(row)
        else:
            row['by'] = os.path.basename(hit)
            row['sh'] = os.path.isfile(os.path.join(tdir, safe(code) + '.jpg'))
            if not row['sh']:
                unshrunk += 1
            covered.append(row)
    #  biggest wins first: the photo that pictures 24 bollards beats
    #  the one that pictures a single spanner
    missing.sort(key=lambda r: (-r['q'], r['n'].upper()))
    covered.sort(key=lambda r: r['n'].upper())

    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter

    wb = openpyxl.Workbook()
    thin = Border(bottom=Side(style='thin', color='DDDDDD'))
    h_font = Font(bold=True, color='FFFFFF', size=11)
    h_fill = PatternFill('solid', fgColor=ORANGE)

    def brand(ws, title, sub):
        ws['A1'] = 'COATES | ' + title
        ws['A1'].font = Font(bold=True, size=16, color=INK)
        ws['A2'] = ('Cement Australia K2 Shutdown 2026 - Gladstone | '
                    'POWERED BY SITEIQ | Author: Andrew Fisher')
        ws['A2'].font = Font(size=9, color=GREY)
        ws['A3'] = sub
        ws['A3'].font = Font(size=10, italic=True, color=INK)

    def header(ws, r, cols):
        for i, (label, width) in enumerate(cols, start=1):
            c = ws.cell(row=r, column=i, value=label)
            c.font = h_font
            c.fill = h_fill
            c.alignment = Alignment(vertical='center')
            ws.column_dimensions[get_column_letter(i)].width = width
        ws.freeze_panes = ws.cell(row=r + 1, column=1)
        ws.auto_filter.ref = '{}{}:{}{}'.format(
            'A', r, get_column_letter(len(cols)), r)

    #  ---- sheet 1: the gaps ------------------------------------------
    ws = wb.active
    ws.title = 'MISSING ({})'.format(len(missing))
    brand(ws, 'MISSING PICTURES',
          '{} pictures still wanted, {} already covered - built {}'.format(
              len(missing), len(covered),
              dt.datetime.now().strftime('%d %b %Y %H:%M')))
    ws['A5'] = ('HOW TO ATTACH A PICTURE: 1) find the row, 2) get a photo - '
                'a phone shot of the gear on the shelf is perfect, or use the '
                'search link - 3) save it into the Photos folder with the '
                'SAVE AS name (close counts: spaces and underscores are fine, '
                'extra words on the end are fine), 4) run 04 and it appears '
                'in My Gear everywhere that item shows.')
    ws['A5'].font = Font(size=10, color=INK)
    ws['A5'].alignment = Alignment(wrap_text=True)
    ws.merge_cells('A5:G5')
    ws.row_dimensions[5].height = 42
    HR = 7
    header(ws, HR, [('WHAT IT IS', 52), ('AISLE / FAMILY', 20),
                    ('ITEMS BEHIND IT', 16), ('KIND', 16),
                    ('SAVE THE PHOTO AS', 42), ('SEARCH', 16),
                    ('DONE?', 9)])
    try:
        from urllib.parse import quote_plus
    except ImportError:
        from urllib import quote_plus
    r = HR + 1
    for m in missing:
        ws.cell(row=r, column=1, value=m['n']).border = thin
        ws.cell(row=r, column=2, value=m['f']).border = thin
        qc = ws.cell(row=r, column=3, value=m['q'])
        qc.border = thin
        if m['q'] >= 10:
            qc.font = Font(bold=True, color=ORANGE)
        ws.cell(row=r, column=4, value=m['k']).border = thin
        fc = ws.cell(row=r, column=5, value=safe(m['code']) + '.jpg')
        fc.font = Font(name='Consolas', size=10)
        fc.border = thin
        lc = ws.cell(row=r, column=6, value='Google Images')
        lc.hyperlink = ('https://www.google.com/search?tbm=isch&q='
                        + quote_plus(m['n']))
        lc.font = Font(color='0563C1', underline='single')
        lc.border = thin
        ws.cell(row=r, column=7, value='').border = thin
        r += 1

    #  ---- sheet 2: covered, and by which file ------------------------
    w2 = wb.create_sheet('COVERED ({})'.format(len(covered)))
    brand(w2, 'PICTURES ALREADY COVERED',
          'Every register code with a photo, the file covering it, and '
          'whether the PAGE is actually showing it yet.'
          + (' {} row(s) say RUN 04 - the photo is in the folder but not '
             'shrunk onto the page yet.'.format(unshrunk) if unshrunk
             else ''))
    header(w2, 5, [('WHAT IT IS', 52), ('AISLE / FAMILY', 20),
                   ('ITEMS BEHIND IT', 16), ('KIND', 16),
                   ('COVERED BY (file in Photos)', 48),
                   ('ON THE PAGE?', 22)])
    #  the not-on-the-page rows first, so the problem is at the top
    covered.sort(key=lambda m: (m['sh'], m['n'].upper()))
    r = 6
    for m in covered:
        w2.cell(row=r, column=1, value=m['n']).border = thin
        w2.cell(row=r, column=2, value=m['f']).border = thin
        w2.cell(row=r, column=3, value=m['q']).border = thin
        w2.cell(row=r, column=4, value=m['k']).border = thin
        bc = w2.cell(row=r, column=5, value=m['by'])
        bc.font = Font(name='Consolas', size=10)
        bc.border = thin
        sc = w2.cell(row=r, column=6,
                     value='YES' if m['sh'] else 'RUN 04 - not shrunk yet')
        sc.font = (Font(bold=True, color='2BB673') if m['sh']
                   else Font(bold=True, color='E23B2E'))
        sc.border = thin
        r += 1

    out = os.path.join(HERE, 'Missing_Pictures_{}.xlsx'.format(
        dt.date.today().isoformat()))
    wb.save(out)
    mygear_thumbs.photos_dir(HERE)
    print(' Register codes            : {}'.format(len(reg)))
    print(' Covered by a photo        : {}'.format(len(covered)))
    print(' Still missing a picture   : {}'.format(len(missing)))
    if unshrunk:
        print(' In the folder, NOT on the : {}  <-- run 04; if a row stays'
              .format(unshrunk))
        print(' page yet (see COVERED)         red, 04 will name the file')
    print('')
    print(' Written to : {}'.format(out))
    print('')
    print(' Sort or filter the MISSING sheet, snap the photos, save them')
    print(' into Photos\\ under the SAVE AS names, run 04. Run me again')
    print(' any time - the list re-counts itself.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
