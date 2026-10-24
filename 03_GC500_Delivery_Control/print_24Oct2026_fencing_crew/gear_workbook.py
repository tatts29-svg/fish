"""Author: Andrew Fisher. The fencing gear Advanced used on the GC500 2026 build, docket by docket, from the signed papers on the
live record (gear_rows_24Oct2026.json, read 24 Oct 2026, record 10804). No money in it.

Andrew, 24 Oct 2026: "Do you have the feet right ... Feet/bases we should have 1000s not hundreds ... Forget what we charge i want
data what they used ... What are concrete blocks are they not feet". They are: feet, bases and blocks are one item. The 216 "fence
blocks" the page showed are the 216 feet on docket 36566, put on the card's Fence Blocks line; they are inside the 8,235.

    python3 gear_workbook.py      -> GC500_2026_fencing_gear_used_by_docket.xlsx (formulas; recalculated by LibreOffice after)
"""
import json, re
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

HERE = Path(__file__).resolve().parent
SRC = json.loads((HERE / 'gear_rows_24Oct2026.json').read_text(encoding='utf-8'))
OUT = HERE / 'GC500_2026_fencing_gear_used_by_docket.xlsx'
INK, CHAR, ORANGE, WARM, MUTE = '15191C', '252B30', 'FF6B1A', 'F4F1EC', '5D6770'
HEAD = PatternFill('solid', fgColor=CHAR); WARMF = PatternFill('solid', fgColor=WARM); FLAGF = PatternFill('solid', fgColor='FFE3D1')
TOTF = PatternFill('solid', fgColor='E8E3DC')
thin = Side(style='thin', color='D9D4CD'); BOX = Border(bottom=thin)
WEEKS = {'Week 6': 'CW6 · 7–12 Sep', 'Week 5': 'CW5 · 14–18 Sep', 'Week 4': 'CW4 · 21–25 Sep', 'Week 3': 'CW3 · 28 Sep–2 Oct',
         'Week 2': 'CW2 · 6–9 Oct', 'Week 1': 'CW1 · 12–16 Oct', 'Event Week': 'Event week · 19–23 Oct'}


def flag(r):
    no, base, mesh, br = str(r['docket']), r['base'], r['mesh_panel'] or 0, r['brace'] or 0
    if no == '36566': return 'The 216 feet here are the "216 fence blocks": charged on the card\'s Fence Blocks line. Same feet, counted once.'
    if no in ('36600', '36620'): return 'Drop-off: bases only, delivered to the iEDM compound. No fence put in.'
    if no == '36568': return 'Braces box blank on the paper. 474 feet for 185 panels fits about 145 braces at two feet each.'
    if no == '36591': return 'Flat-feet barriers: 19 bases written with the 19 flat-feet pieces.'
    if base is None and (mesh or br): return 'Feet box left blank on the paper.'
    if r['docket'] == 'workbook row': return "Week 6 workbook row, no docket number (reads like a copy of 36501); kept as the record has it."
    if not mesh and br: return 'Bracing added to fence already standing: two feet a brace.'
    return ''


def header(ws, row, cols, widths=None):
    for i, (h, w) in enumerate(cols, 1):
        c = ws.cell(row=row, column=i, value=h)
        c.font = Font(bold=True, color='FFFFFF', size=10); c.fill = HEAD
        c.alignment = Alignment(horizontal='center' if i > 1 else 'left', vertical='center', wrap_text=True)
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[row].height = 32


def main():
    wb = Workbook()
    # ---- Hire agreements ------------------------------------------------------------------------------------------------
    ws = wb.active; ws.title = 'Hire agreements'
    cols = [('Date', 11), ('Week', 19), ('Docket', 10), ('Area (as on the docket)', 38),
            ('Fence m', 9), ('Scrim m', 9), ('CCB event m', 9), ('CCB demarc m', 9), ('Flat feet m', 9),
            ('Mesh panels', 9), ('Hoarding panels', 9), ('Feet / bases', 9), ('Clamps', 9), ('Braces', 9), ('Gate wheels', 9),
            ('CCB barriers', 9), ('Flat-feet barriers', 9), ('Vehicle gates', 9), ('Ped gates', 9),
            ('Feet check: panels × 1 + braces × 2', 13), ('Feet written less check', 11), ('Note', 60)]
    ws['A1'] = 'Advanced Temporary Fencing — gear used on the GC500 2026 build, docket by docket'
    ws['A1'].font = Font(bold=True, size=14, color=INK)
    ws['A2'] = ('Every signed hire agreement on the record, read 24 Oct 2026 (record 10804). Quantities exactly as written on the papers. '
                'Feet, bases and blocks are the same item. Blank = not written on the paper.')
    ws['A2'].font = Font(size=9, color=MUTE, italic=True)
    header(ws, 4, cols)
    keys = ['clean', 'scrim', 'ccb_event', 'ccb_demarc', 'flat_feet', 'mesh_panel', 'hoarding_panel', 'base', 'clamp', 'brace', 'wheels',
            'cc_barrier', 'flat_feet_ccb', 'v_gates', 'ped_gates']
    rows = sorted(SRC['hire_agreements'], key=lambda r: (r['date'] or '0000', str(r['docket'])))
    first = 5
    for i, r in enumerate(rows):
        n = first + i
        vals = [r['date'], WEEKS.get(r['week'], r['week']), r['docket'] if r['docket'] != 'workbook row' else '—', r['area']] + [r[k] for k in keys]
        for j, v in enumerate(vals, 1):
            c = ws.cell(row=n, column=j, value=v); c.border = BOX
            if j >= 5: c.number_format = '#,##0.0' if j <= 9 else '#,##0'; c.alignment = Alignment(horizontal='right')
        # feet check (mesh + hoarding + 2 x braces) and the difference, as formulas
        ws.cell(row=n, column=20, value=f'=IF(AND(J{n}="",K{n}="",N{n}=""),"",N(J{n})+N(K{n})+2*N(N{n}))').number_format = '#,##0'
        ws.cell(row=n, column=21, value=f'=IF(OR(L{n}="",T{n}=""),"",L{n}-T{n})').number_format = '+#,##0;-#,##0;0'
        note = flag(r); c = ws.cell(row=n, column=22, value=note); c.alignment = Alignment(wrap_text=False)
        if note:
            for j in range(1, 23): ws.cell(row=n, column=j).fill = FLAGF
    last = first + len(rows) - 1; tot = last + 1
    ws.cell(row=tot, column=4, value='Totals (all hire agreements)').font = Font(bold=True)
    for j in range(5, 22):
        L = get_column_letter(j)
        c = ws.cell(row=tot, column=j, value=f'=SUM({L}{first}:{L}{last})'); c.font = Font(bold=True)
        c.number_format = '#,##0.0' if j <= 9 else '#,##0'; c.fill = TOTF; c.alignment = Alignment(horizontal='right')
    ws.cell(row=tot, column=21, value=None)
    ws.cell(row=tot, column=22, value='Shaded rows: read the note.').font = Font(italic=True, color=MUTE)
    for j in range(1, 5): ws.cell(row=tot, column=j).fill = TOTF
    ws.freeze_panes = 'E5'; ws.auto_filter.ref = f'A4:V{last}'
    HA, HA_FIRST, HA_LAST = ws.title, first, last

    # ---- Service notes --------------------------------------------------------------------------------------------------
    sn = wb.create_sheet('Service notes')
    sn['A1'] = 'Service notes (green book) — labour and work on fence already standing'; sn['A1'].font = Font(bold=True, size=14, color=INK)
    header(sn, 3, [('Date', 11), ('Week', 19), ('Note', 9), ('Area', 36), ('Hours', 8), ('Metres', 9), ('Crew, as written', 26), ('What the note says', 90)])
    S = sorted(SRC['service_notes'], key=lambda r: (r['date'], r['note_no']))
    for i, r in enumerate(S):
        n = 4 + i
        for j, v in enumerate([r['date'], WEEKS.get(r['week'], r['week']), r['note_no'], r['area'], r['hours'], r['metres'], r['crew_note'], r['note'][:400]], 1):
            c = sn.cell(row=n, column=j, value=v); c.border = BOX
            if j in (5, 6): c.number_format = '#,##0.0#'
    t = 4 + len(S)
    sn.cell(row=t, column=4, value='Totals').font = Font(bold=True)
    for j, L in ((5, 'E'), (6, 'F')):
        c = sn.cell(row=t, column=j, value=f'=SUM({L}4:{L}{t - 1})'); c.font = Font(bold=True); c.fill = TOTF; c.number_format = '#,##0.0'
    sn.freeze_panes = 'A4'

    # ---- Collections ----------------------------------------------------------------------------------------------------
    co = wb.create_sheet('Collections')
    co['A1'] = 'Collection forms (blue book) — gear collected back off site'; co['A1'].font = Font(bold=True, size=14, color=INK)
    ck = [('mesh_panel', 'Mesh panels'), ('base', 'Feet / bases'), ('clamp', 'Clamps'), ('brace', 'Braces'), ('wheels', 'Gate wheels'),
          ('cc_barrier', 'CCB barriers'), ('flat_feet_ccb', 'Flat-feet barriers'), ('ped_gate', 'Ped gates')]
    header(co, 3, [('Date', 11), ('Week', 19), ('Form', 9), ('Area', 36)] + [(h, 9) for _, h in ck] + [('What the form says', 80)])
    C = sorted(SRC['collections'], key=lambda r: (r['date'], r['no']))
    for i, r in enumerate(C):
        n = 4 + i
        vals = [r['date'], WEEKS.get(r['week'], r['week']), r['no'], r['area']] + [r['collected'].get(k) for k, _ in ck] + [r['note'][:300]]
        for j, v in enumerate(vals, 1):
            c = co.cell(row=n, column=j, value=v); c.border = BOX
            if 5 <= j <= 12: c.number_format = '#,##0'
    t = 4 + len(C)
    co.cell(row=t, column=4, value='Totals').font = Font(bold=True)
    for j in range(5, 13):
        L = get_column_letter(j); c = co.cell(row=t, column=j, value=f'=SUM({L}4:{L}{t - 1})'); c.font = Font(bold=True); c.fill = TOTF; c.number_format = '#,##0'
    co.freeze_panes = 'A4'

    # ---- Summary (first sheet) ------------------------------------------------------------------------------------------
    sm = wb.create_sheet('Summary', 0)
    sm.column_dimensions['A'].width = 56; sm.column_dimensions['B'].width = 14; sm.column_dimensions['C'].width = 70
    sm['A1'] = 'What Advanced used — GC500 2026 build (9 Sep – Fri 23 Oct 2026)'; sm['A1'].font = Font(bold=True, size=16, color=INK)
    sm['A2'] = 'From the signed papers on the GC500 Delivery Control record, read 24 Oct 2026 (record 10804). No money in this workbook.'
    sm['A2'].font = Font(size=9, italic=True, color=MUTE)
    r = 4
    def sect(title):
        nonlocal r
        c = sm.cell(row=r, column=1, value=title); c.font = Font(bold=True, color='FFFFFF'); c.fill = HEAD
        sm.cell(row=r, column=2).fill = HEAD; sm.cell(row=r, column=3).fill = HEAD; r += 1
    def line(label, formula, fmt='#,##0', note='', bold=False):
        nonlocal r
        sm.cell(row=r, column=1, value=label).font = Font(bold=bold)
        c = sm.cell(row=r, column=2, value=formula); c.number_format = fmt; c.font = Font(bold=True, color=INK); c.alignment = Alignment(horizontal='right')
        sm.cell(row=r, column=3, value=note).font = Font(size=9, color=MUTE)
        for j in (1, 2, 3): sm.cell(row=r, column=j).border = BOX
        r += 1
    ref = lambda col: f"=SUM('{HA}'!{col}{HA_FIRST}:{col}{HA_LAST})"
    sect('The gear (as written on the hire agreements)')
    line('Mesh panels', ref('J'))
    line('Hoarding panels', ref('K'))
    line('Feet / bases / blocks — written on the dockets', ref('L'), note='One item: feet, bases and blocks are the same thing.', bold=True)
    line('Clamps', ref('M'))
    line('Braces', ref('N'))
    line('Gate wheels', ref('O'))
    line('Crowd-control barriers', ref('P'))
    line('Flat-feet barriers', ref('Q'))
    r += 1
    sect('The feet, checked against the gear')
    line('Panels (mesh + hoarding) × 1 foot — shared at each join', f"={ref('J')[1:]}+{ref('K')[1:]}", note='A straight run of N panels takes N + 1 feet; a closed compound takes N.')
    line('Braces × 2 feet', f"=2*{ref('N')[1:]}", note='Every bracing-only docket shows exactly two feet a brace (36519, 36531, 36566, 36581, 36763 …).')
    line('Dropped at the iEDM compound (36600, 36620)', 300, note='Bases only, no fence put in.')
    line('Under flat-feet barriers, Club 500 (36591)', 19)
    line('Feet worked out from the gear', f'=SUM(B{r - 4}:B{r - 1})', bold=True, note='Plus one more at the open end of each straight run.')
    line('Feet written on the dockets', ref('L'), bold=True)
    line('Dockets with the feet box left blank', 10, note='230 panels and 4 braces on them: about 240 feet not written.')
    line('Feet used, about', f'=B{r - 2}+240', bold=True, note='Written + the blank papers. The gear says the same.')
    sm.cell(row=r, column=1, value=('If braces actually took three feet each (not what the dockets show), add one more per brace: '
                                    '1,426 more, about 9,900 in all.')).font = Font(size=9, italic=True, color=MUTE); r += 1
    sm.cell(row=r, column=1, value=('The 216 "fence blocks" on the page were the 216 feet on docket 36566 (108 braces at the rear of the pit building), '
                                    'put on the card\'s Fence Blocks line. They are inside the feet above, not extra concrete blocks.')).font = Font(size=9, italic=True, color=MUTE)
    r += 2
    sect('Metres (hire agreements, plus the reviewed service and collection papers)')
    line('Temporary fence put in (clean line)', ref('E'), '#,##0.0', note='Programme was 12,617 m.')
    line('Braced for scrim', ref('F'), '#,##0.0')
    line('Scrim on fence already standing (service notes)', 427.5, '#,##0.0')
    line('Crowd control — event', ref('G'), '#,##0.0')
    line('Crowd control — demarcation', ref('H'), '#,##0.0')
    line('Flat feet', ref('I'), '#,##0.0')
    line('Relocated', 612.5, '#,##0.0', note='Hire agreements 137.5 m + reviewed service notes 475 m (incl. 24492).')
    line('Taken down and stacked', 1102.5, '#,##0.0', note='Reviewed collection forms and service notes.')
    line('Vehicle gates (docket wheels, two to a gate)', 133, note='As the page counts them: 278 wheels on the papers, programme gates only.')
    line('Pedestrian gates', ref('S'))
    r += 1
    sect('The papers and the hours')
    line('Signed hire agreements', 166, note='Plus the Week 6 workbook row with no docket number (shown in the sheet).')
    line('Service notes', len(SRC['service_notes']))
    line('Collection forms', len(SRC['collections']))
    line('Hours on service notes', f"=SUM('Service notes'!E4:E{3 + len(SRC['service_notes'])})", '#,##0.0')
    for row in sm.iter_rows(min_row=4, max_row=r):
        for c in row:
            if c.column == 3 and c.value: c.alignment = Alignment(wrap_text=True, vertical='top')
    wb.save(OUT)
    print('saved', OUT.name, len(rows), 'hire agreements')


if __name__ == '__main__':
    main()
