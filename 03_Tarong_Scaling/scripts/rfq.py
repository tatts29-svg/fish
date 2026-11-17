"""Supplier Request for Quotation - Tarong consumables (Coates branded).
Run analyse.py first (writes out.pkl). Output: Tarong_Consumables_RFQ.xlsx
Quantities are fixed at the crew below; suppliers fill the shaded cells."""
import os, math, pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, Protection
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.utils import get_column_letter as L
from openpyxl.drawing.image import Image as XLImage
from openpyxl.worksheet.datavalidation import DataValidation

CREW_WC, CREW_BC = 50, 200
ISSUED = '17 Nov 2026'

o = pd.read_pickle('out.pkl'); con = o['con'].copy()
FACTOR = (CREW_WC + CREW_BC) / o['CALLIDE_CREW']
COG = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'coates-way-cog.png')
ORDER = ['PPE', 'Health, hygiene & welfare', 'Safety & site control', 'Cutting, grinding & drilling', 'Welding & hot work',
         'Fixings & hardware', 'Lifting, rigging & covers', 'Chemicals, adhesives & paint', 'Electrical, batteries & lighting',
         'Marking & office', 'Cleaning & housekeeping', 'Plumbing, hose & fittings', 'Hand tools & accessories', 'General store items']

ORANGE, ORANGE_DK, CHAR, SLATE = 'F26222', 'C44C28', '1D1D1B', '2A313C'
GREY, MID, LIGHT, BAND, TINT, WHITE, INPUT = '595959', 'A6A6A6', 'F3F3F3', 'F9F9F9', 'FDEBE1', 'FFFFFF', 'FFF8E1'
def F(**k): k.setdefault('name', 'Calibri'); k.setdefault('color', CHAR); return Font(**k)
def fill(c): return PatternFill('solid', fgColor=c)
thin = Side(style='thin', color='E1E1E1'); box = Side(style='thin', color='D0D0D0'); orule = Side(style='medium', color=ORANGE)
UNLOCK = Protection(locked=False)

wb = Workbook()

def banner(ws, ncols, title, sub):
    ws.sheet_view.showGridLines = False; ws.sheet_view.zoomScale = 90
    for r, h in ((1, 34), (2, 22), (3, 5), (4, 18)): ws.row_dimensions[r].height = h
    for c in range(1, ncols + 1):
        for rr, col in ((1, CHAR), (2, CHAR), (3, ORANGE)): ws.cell(rr, c).fill = fill(col)
    ws.cell(1, 2, title).font = F(bold=True, size=20, color=WHITE); ws.cell(1, 2).alignment = Alignment(vertical='bottom')
    ws.cell(2, 2, sub).font = F(size=11, color=ORANGE, bold=True); ws.cell(2, 2).alignment = Alignment(vertical='top')
    ws.cell(4, 2, f'Issued by Andrew Fisher  |  Shutdown Manager QLD  |  Coates        {ISSUED}        POWERED BY SITEIQ').font = F(size=9, color=GREY)
    ws.column_dimensions['A'].width = 2

def print_setup(ws, landscape=True, rep=None):
    ws.page_setup.paperSize = ws.PAPERSIZE_A4; ws.page_setup.orientation = 'landscape' if landscape else 'portrait'
    ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0; ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_margins.left = ws.page_margins.right = 0.35; ws.page_margins.top = 0.45; ws.page_margins.bottom = 0.6
    ws.oddFooter.left.text = 'Coates  |  Request for Quotation - Consumables  |  Tarong Power Station'
    ws.oddFooter.right.text = 'Page &P of &N'
    for h in (ws.oddFooter.left, ws.oddFooter.right): h.size = 8; h.color = GREY
    if rep: ws.print_title_rows = rep

def protect(ws):
    ws.protection.sheet = True; ws.protection.formatColumns = False; ws.protection.formatRows = False
    ws.protection.selectLockedCells = False; ws.protection.selectUnlockedCells = False

# ------------------------------------------------------------------ data
con = con[~con.Category.str.startswith('One-off: project')]          # project materials depend on scope - not quoted
con['wk'] = (con['Callide per week'] * FACTOR).round(1)
ong = con[~con.Category.str.startswith('One-off')].copy()
one = con[con.Category.str.startswith('One-off')].copy()
one['ind'] = (one['Total issued (whole job)'] * FACTOR).apply(lambda v: max(1, math.ceil(v)))
cats = [c for c in ORDER if c in set(ong.Category)] + sorted(set(ong.Category) - set(ORDER))

# ================================================================== COVER
S = wb.active; S.title = 'RFQ Cover'; NC = 14
banner(S, NC, 'REQUEST FOR QUOTATION', 'Consumables supply  |  Tarong Power Station')
for c in range(2, NC): S.column_dimensions[L(c)].width = 10.6
S.column_dimensions[L(NC)].width = 2
if os.path.exists(COG):
    img = XLImage(COG); img.width = img.height = 58; S.add_image(img, 'L1')
r = 6
def sec(t):
    global r
    r += 1; S.cell(r, 2, t.upper()).font = F(bold=True, size=12)
    for k in range(2, NC): S.cell(r, k).border = Border(bottom=orule)
    S.row_dimensions[r].height = 20; r += 2
def field(label, value=None, name=None, inp=False, fmt_=None):
    global r
    S.merge_cells(start_row=r, start_column=2, end_row=r, end_column=5)
    S.merge_cells(start_row=r, start_column=6, end_row=r, end_column=NC - 1)
    a = S.cell(r, 2, label); a.font = F(bold=True, size=10, color=GREY); a.alignment = Alignment(vertical='center', indent=1)
    v = S.cell(r, 6, value); v.font = F(size=10.5, bold=not inp); v.alignment = Alignment(vertical='center', indent=1, wrap_text=True)
    if fmt_: v.number_format = fmt_
    for k in range(2, NC):
        S.cell(r, k).border = Border(bottom=thin)
        if inp and k >= 6: S.cell(r, k).fill = fill(INPUT)
    if inp:
        for k in range(6, NC): S.cell(r, k).protection = UNLOCK
    if name: wb.defined_names[name] = DefinedName(name, attr_text=f"'RFQ Cover'!$F${r}")
    S.row_dimensions[r].height = 20; r += 1

sec('1.  Request details')
field('Project', 'Tarong Power Station - shutdown consumables supply')
field('Issued by', 'Andrew Fisher, Shutdown Manager QLD, Coates')
field('Date issued', ISSUED)
field('Quotes due by', None, name='DUE', inp=True)
field('Delivery to', 'Coates tool store, Tarong Power Station, QLD  (site delivery details confirmed on order)')
field('Workforce supported', f'{CREW_WC + CREW_BC} personnel  ({CREW_WC} white collar, {CREW_BC} blue collar)')
field('Project duration (weeks)', None, name='WEEKS', inp=True, fmt_='0')
S.cell(r, 6, 'Leave blank if not yet confirmed - pricing then runs on the initial order.').font = F(size=8.5, italic=True, color=GREY); r += 1

sec('2.  Supplier details  (to be completed by supplier)')
for lab in ['Company name', 'ABN', 'Contact name', 'Phone', 'Email', 'Quote reference', 'Quote valid until', 'Delivery lead time (standard)', 'Minimum order / freight terms']:
    field(lab, None, inp=True)

sec('3.  Instructions to suppliers')
INSTR = ['Complete the shaded cells only - on this page and on the Price Schedule tab. Quantities and descriptions are locked.',
         'Price each line as a unit price in AUD excluding GST, delivered to site. State your unit of measure / pack size against every line.',
         'Brands and part numbers are shown as used to date. Equivalent products are welcome - state the brand and part number in the Equivalent column.',
         'Quantities are estimates for planning and pricing, based on measured usage for a workforce of this size. They are not a commitment to purchase.',
         'Supply will be called off in regular replenishment orders through the project. Please note any lines with long lead times or minimum order quantities.',
         'The One-off Items tab lists tools and equipment needed once at mobilisation - indicative quantities, price per unit.',
         'Return the completed workbook to Andrew Fisher, Coates, by the due date above.']
for i, t in enumerate(INSTR, 1):
    S.cell(r, 2, i).font = F(bold=True, size=10, color=ORANGE); S.cell(r, 2).alignment = Alignment(horizontal='center', vertical='top')
    S.merge_cells(start_row=r, start_column=3, end_row=r, end_column=NC - 1)
    c = S.cell(r, 3, t); c.font = F(size=10); c.alignment = Alignment(wrap_text=True, vertical='top')
    S.row_dimensions[r].height = 28; r += 1

sec('4.  Quote summary by category  (calculates from the Price Schedule)')
heads = [('Category', 5), ('Lines', 2), ('Lines priced', 2), ('Quote value ex GST', 3)]
c0 = 2
for t, sp in heads:
    S.merge_cells(start_row=r, start_column=c0, end_row=r, end_column=c0 + sp - 1)
    for k in range(c0, c0 + sp): S.cell(r, k).fill = fill(SLATE)
    x = S.cell(r, c0, t); x.font = F(bold=True, color=WHITE, size=9.5)
    x.alignment = Alignment(horizontal='left' if c0 == 2 else 'center', vertical='center', indent=1 if c0 == 2 else 0); c0 += sp
S.row_dimensions[r].height = 22; r += 1
PS = "'Price Schedule'"; first = r
for i, cat in enumerate(cats + ['One-off items (mobilisation)']):
    oneoff = cat.startswith('One-off')
    rng_cat = "'One-off Items'!$O:$O" if oneoff else f"{PS}!$P:$P"
    sheet = "'One-off Items'" if oneoff else PS
    crit = '"<>"' if oneoff else f'"{cat}"'
    vals = [(cat, 5), (f'=COUNTIFS({rng_cat},{crit})', 2),
            (f'=COUNTIFS({rng_cat},{crit},{sheet}!$J:$J,">0")', 2),
            (f'=SUMIFS({sheet}!$K:$K,{rng_cat},{crit})', 3)]
    c0 = 2
    for k, (v, sp) in enumerate(vals):
        S.merge_cells(start_row=r, start_column=c0, end_row=r, end_column=c0 + sp - 1)
        for kk in range(c0, c0 + sp): S.cell(r, kk).fill = fill(BAND if i % 2 else WHITE); S.cell(r, kk).border = Border(bottom=thin)
        x = S.cell(r, c0, v); x.font = F(size=10, bold=(k == 3), color=ORANGE_DK if k == 3 else CHAR)
        x.alignment = Alignment(horizontal='left' if k == 0 else 'center', vertical='center', indent=1 if k == 0 else 0)
        x.number_format = '$#,##0.00' if k == 3 else '#,##0'; c0 += sp
    r += 1
c0 = 2
for k, (v, sp) in enumerate([('TOTAL', 5), (f'=SUM(G{first}:G{r-1})', 2), (f'=SUM(I{first}:I{r-1})', 2), (f'=SUM(K{first}:K{r-1})', 3)]):
    S.merge_cells(start_row=r, start_column=c0, end_row=r, end_column=c0 + sp - 1)
    for kk in range(c0, c0 + sp): S.cell(r, kk).fill = fill(TINT); S.cell(r, kk).border = Border(top=orule)
    x = S.cell(r, c0, v); x.font = F(size=11, bold=True, color=ORANGE_DK if k == 3 else CHAR)
    x.alignment = Alignment(horizontal='left' if k == 0 else 'center', vertical='center', indent=1 if k == 0 else 0)
    x.number_format = '$#,##0.00' if k == 3 else '#,##0'; c0 += sp
S.row_dimensions[r].height = 22; r += 2
S.merge_cells(start_row=r, start_column=2, end_row=r, end_column=NC - 1)
S.cell(r, 2, 'Quote value = unit price x project quantity (or x initial order if the project duration is not yet confirmed).').font = F(size=8.5, italic=True, color=GREY)
r += 2
sec('5.  Supplier declaration')
for lab in ['Signed', 'Name & position', 'Date']: field(lab, None, inp=True)
print_setup(S, landscape=False); S.print_area = f'A1:{L(NC)}{r}'
protect(S)

# ================================================================== PRICE SCHEDULE
# B item | C description | D weekly | E initial | F project qty | G supplier part | H UOM | I equivalent | J unit price | K line total | L lead | M comments | N(gap) | O sub(hidden) | P cat(hidden)
P = wb.create_sheet('Price Schedule'); NCOL = 16
banner(P, 14, 'PRICE SCHEDULE', 'Consumables - grouped by category and sub-category')
P.cell(5, 2, 'Shaded columns are for the supplier. Unit prices in AUD excluding GST, delivered to site.  Line total = unit price x project qty (or initial order until duration is confirmed).').font = F(size=9, italic=True, color=GREY)
COLS = [('Item No.', 9, 'center'), ('Description (brand / part no. as used to date)', 54, 'left'), ('Est. weekly use', 10, 'center'),
        ('Initial order (2 weeks)', 10, 'center'), ('Est. project qty', 10, 'center'), ('Supplier part no.', 16, 'center'),
        ('Unit of measure / pack size', 13, 'center'), ('Equivalent offered (brand / part no.)', 22, 'left'), ('Unit price ex GST', 12, 'center'),
        ('Line total ex GST', 13, 'center'), ('Lead time (days)', 9, 'center'), ('Comments', 26, 'left'), ('', 2, 'center'), ('', 4, 'center'), ('', 4, 'center')]
HR = 7
for j, (t, w, al) in enumerate(COLS, start=2):
    c = P.cell(HR, j, t); c.font = F(bold=True, color=WHITE, size=9.5)
    c.fill = fill(ORANGE if j in (7, 8, 9, 10, 12, 13) else SLATE)
    c.alignment = Alignment(horizontal=al, vertical='center', wrap_text=True, indent=1 if al == 'left' else 0)
    P.column_dimensions[L(j)].width = w
P.cell(HR, 11).fill = fill(SLATE); P.cell(HR, 14).fill = fill(WHITE)
P.row_dimensions[HR].height = 40
P.cell(HR - 1, 7, 'SUPPLIER TO COMPLETE').font = F(bold=True, size=9, color=ORANGE_DK)
P.freeze_panes = P.cell(HR + 1, 4)
r = HR + 1
dv_num = DataValidation(type='decimal', operator='greaterThanOrEqual', formula1='0', allow_blank=True); P.add_data_validation(dv_num)
for ci, cat in enumerate(cats, 1):
    cg = ong[ong.Category == cat]
    for j in range(2, 14): P.cell(r, j).fill = fill(CHAR)
    P.cell(r, 2, f'{ci:02d}').font = F(bold=True, size=11, color=ORANGE); P.cell(r, 2).alignment = Alignment(horizontal='center', vertical='center')
    P.cell(r, 3, cat.upper()).font = F(bold=True, size=11, color=WHITE); P.cell(r, 3).alignment = Alignment(vertical='center', indent=1)
    P.cell(r, 4, f'{len(cg)} lines').font = F(size=9, color=MID); P.cell(r, 4).alignment = Alignment(horizontal='center', vertical='center')
    catrow = r; P.row_dimensions[r].height = 22; r += 1; subrows = []
    for si, sub in enumerate(sorted(cg.Group.unique()), 1):
        sg = cg[cg.Group == sub].sort_values(['wk', 'Description'], ascending=[False, True])
        for j in range(2, 14): P.cell(r, j).fill = fill(TINT); P.cell(r, j).border = Border(top=Side(style='thin', color=ORANGE))
        P.cell(r, 2, f'{ci:02d}.{si:02d}').font = F(bold=True, size=10, color=ORANGE_DK); P.cell(r, 2).alignment = Alignment(horizontal='center')
        P.cell(r, 3, sub).font = F(bold=True, size=10, color=ORANGE_DK); P.cell(r, 3).alignment = Alignment(indent=1)
        P.cell(r, 4, f'{len(sg)} line' + ('s' if len(sg) != 1 else '')).font = F(size=9, color=GREY); P.cell(r, 4).alignment = Alignment(horizontal='center')
        subrow = r; subrows.append(r); P.row_dimensions[r].height = 19; r += 1; f0 = r
        for ii, (_, x) in enumerate(sg.iterrows(), 1):
            wk = float(x['wk']); asreq = wk < 0.05
            init = 'As req.' if asreq else max(1, math.ceil(wk * 2))
            vals = [(f'{ci:02d}.{si:02d}.{ii:03d}', None), (x['Description'], None), ('As req.' if asreq else wk, '#,##0.0'), (init, '#,##0'),
                    ('As req.' if asreq else f'=IF(WEEKS="","TBC",ROUNDUP(D{r}*WEEKS,0))', '#,##0'),
                    (None, None), (None, None), (None, None), (None, '$#,##0.00'),
                    (f'=IF(J{r}="","",IF(ISNUMBER(F{r}),F{r},IF(ISNUMBER(E{r}),E{r},1))*J{r})', '$#,##0.00'),
                    (None, '0'), (None, None), (None, None), (sub, None), (cat, None)]
            for j, ((v, nf), (_, _, al)) in enumerate(zip(vals, COLS), start=2):
                c = P.cell(r, j, v); c.font = F(size=10, color=MID if v == 'As req.' else CHAR)
                c.alignment = Alignment(horizontal=al, vertical='center', wrap_text=j in (3, 9, 13), indent=1 if al == 'left' else 0)
                if nf: c.number_format = nf
                if j in (7, 8, 9, 10, 12, 13):
                    c.fill = fill(INPUT); c.protection = UNLOCK; c.border = Border(bottom=box, left=box, right=box)
                elif j <= 13:
                    c.fill = fill(BAND if ii % 2 == 0 else WHITE); c.border = Border(bottom=thin)
            P.cell(r, 2).font = F(size=9, color=GREY); P.cell(r, 11).font = F(size=10, bold=True, color=ORANGE_DK)
            for j in (15, 16): P.cell(r, j).font = F(size=6, color=WHITE); P.cell(r, j).alignment = Alignment(shrink_to_fit=True)
            r += 1
        dv_num.add(f'J{f0}:J{r-1}'); dv_num.add(f'L{f0}:L{r-1}')
        c = P.cell(subrow, 11, f'=SUBTOTAL(9,K{f0}:K{r-1})'); c.number_format = '$#,##0.00'
        c.font = F(bold=True, size=10, color=ORANGE_DK); c.alignment = Alignment(horizontal='center')
    c = P.cell(catrow, 11, '=' + '+'.join(f'K{x}' for x in subrows)); c.number_format = '$#,##0.00'
    c.font = F(bold=True, size=11, color=ORANGE); c.alignment = Alignment(horizontal='center', vertical='center')
for j in range(2, 14): P.cell(r, j).fill = fill(TINT); P.cell(r, j).border = Border(top=orule)
P.cell(r, 3, 'TOTAL - CONSUMABLES (EX GST)').font = F(bold=True, size=11); P.cell(r, 3).alignment = Alignment(indent=1)
c = P.cell(r, 11, '=SUMIF(P:P,"<>",K:K)'); c.number_format = '$#,##0.00'; c.font = F(bold=True, size=11, color=ORANGE_DK); c.alignment = Alignment(horizontal='center')
P.row_dimensions[r].height = 22
P.column_dimensions['O'].hidden = True; P.column_dimensions['P'].hidden = True; P.column_dimensions['Q'].hidden = True
print_setup(P, rep=f'{HR}:{HR}'); P.print_area = f'A1:M{r}'
protect(P)

# ================================================================== ONE-OFF ITEMS
Q = wb.create_sheet('One-off Items');
banner(Q, 14, 'ONE-OFF ITEMS', 'Tools and equipment required once at mobilisation - indicative quantities')
Q.cell(5, 2, 'Price per unit, AUD excluding GST, delivered to site. Quantities are indicative and will be confirmed on order.').font = F(size=9, italic=True, color=GREY)
QC = [('Item No.', 9, 'center'), ('Description (brand / part no. as used to date)', 54, 'left'), ('Sub-category', 18, 'center'),
      ('Indicative qty', 10, 'center'), ('', 2, 'center'), ('Supplier part no.', 16, 'center'), ('Unit of measure / pack size', 13, 'center'),
      ('Equivalent offered (brand / part no.)', 22, 'left'), ('Unit price ex GST', 12, 'center'), ('Line total ex GST', 13, 'center'),
      ('Lead time (days)', 9, 'center'), ('Comments', 26, 'left'), ('', 2, 'center'), ('', 4, 'center')]
for j, (t, w, al) in enumerate(QC, start=2):
    c = Q.cell(HR, j, t); c.font = F(bold=True, color=WHITE, size=9.5)
    c.fill = fill(ORANGE if j in (7, 8, 9, 10, 12, 13) else (WHITE if t == '' else SLATE))
    c.alignment = Alignment(horizontal=al, vertical='center', wrap_text=True, indent=1 if al == 'left' else 0)
    Q.column_dimensions[L(j)].width = w
Q.row_dimensions[HR].height = 40; Q.freeze_panes = Q.cell(HR + 1, 4)
r = HR + 1; n = 0
dvq = DataValidation(type='decimal', operator='greaterThanOrEqual', formula1='0', allow_blank=True); Q.add_data_validation(dvq)
for si, sub in enumerate(sorted(one.Group.unique()), 1):
    sg = one[one.Group == sub].sort_values(['ind', 'Description'], ascending=[False, True])
    for j in range(2, 14): Q.cell(r, j).fill = fill(CHAR)
    Q.cell(r, 2, f'M.{si:02d}').font = F(bold=True, size=10.5, color=ORANGE); Q.cell(r, 2).alignment = Alignment(horizontal='center')
    Q.cell(r, 3, sub.upper()).font = F(bold=True, size=10.5, color=WHITE); Q.cell(r, 3).alignment = Alignment(indent=1)
    hr = r; r += 1; f0 = r
    for ii, (_, x) in enumerate(sg.iterrows(), 1):
        vals = [(f'M.{si:02d}.{ii:03d}', None), (x['Description'], None), (sub, None), (int(x['ind']), '#,##0'), (None, None),
                (None, None), (None, None), (None, None), (None, '$#,##0.00'), (f'=IF(J{r}="","",E{r}*J{r})', '$#,##0.00'),
                (None, '0'), (None, None), (None, None), ('one-off', None)]
        for j, ((v, nf), (_, _, al)) in enumerate(zip(vals, QC), start=2):
            c = Q.cell(r, j, v); c.font = F(size=10)
            c.alignment = Alignment(horizontal=al, vertical='center', wrap_text=j in (3, 9, 13), indent=1 if al == 'left' else 0)
            if nf: c.number_format = nf
            if j in (7, 8, 9, 10, 12, 13):
                c.fill = fill(INPUT); c.protection = UNLOCK; c.border = Border(bottom=box, left=box, right=box)
            elif j <= 13 and j != 6:
                c.fill = fill(BAND if ii % 2 == 0 else WHITE); c.border = Border(bottom=thin)
        Q.cell(r, 2).font = F(size=9, color=GREY); Q.cell(r, 4).font = F(size=9, color=GREY); Q.cell(r, 11).font = F(size=10, bold=True, color=ORANGE_DK)
        Q.cell(r, 15).font = F(size=6, color=WHITE); Q.cell(r, 15).alignment = Alignment(shrink_to_fit=True)
        r += 1; n += 1
    dvq.add(f'J{f0}:J{r-1}'); dvq.add(f'L{f0}:L{r-1}')
    c = Q.cell(hr, 11, f'=SUBTOTAL(9,K{f0}:K{r-1})'); c.number_format = '$#,##0.00'; c.font = F(bold=True, size=10.5, color=ORANGE); c.alignment = Alignment(horizontal='center')
for j in range(2, 14): Q.cell(r, j).fill = fill(TINT); Q.cell(r, j).border = Border(top=orule)
Q.cell(r, 3, 'TOTAL - ONE-OFF ITEMS (EX GST)').font = F(bold=True, size=11); Q.cell(r, 3).alignment = Alignment(indent=1)
c = Q.cell(r, 11, '=SUMIF(O:O,"<>",K:K)'); c.number_format = '$#,##0.00'; c.font = F(bold=True, size=11, color=ORANGE_DK); c.alignment = Alignment(horizontal='center')
Q.column_dimensions['O'].hidden = True
print_setup(Q, rep=f'{HR}:{HR}'); Q.print_area = f'A1:M{r}'
protect(Q)

for w in wb.worksheets: w.sheet_properties.tabColor = ORANGE if w.title == 'RFQ Cover' else CHAR
wb.active = 0
wb.save('Tarong_Consumables_RFQ.xlsx')
print('ok', len(ong), 'lines in', len(cats), 'categories /', ong.Group.nunique(), 'subs |', n, 'one-off lines | factor', round(FACTOR, 3))
