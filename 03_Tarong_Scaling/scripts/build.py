"""Build the client-facing Tarong tool store recommendation workbook (Coates branded).
Run analyse.py first (writes out.pkl). Output: Tarong_Scaling_from_Callide.xlsx"""
import os, numpy as np, pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.utils import get_column_letter as L
from openpyxl.chart import LineChart, Reference
from openpyxl.drawing.image import Image as XLImage
from cats import tool_cat

o = pd.read_pickle('out.pkl'); ST = o['stats']
con, T, units, weekly = o['con'].copy(), o['T'].copy(), o['units'], o['weekly']
COG = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'coates-way-cog.png')

# ---------- Coates palette
ORANGE, ORANGE_DK, CHAR, SLATE = 'F26222', 'C44C28', '1D1D1B', '2A313C'
GREY, MID, LIGHT, BAND, TINT, WHITE = '595959', 'A6A6A6', 'F2F2F2', 'F8F8F8', 'FDEBE1', 'FFFFFF'
FONT = 'Calibri'
def F(**k): k.setdefault('name', FONT); return Font(**k)
def fill(c): return PatternFill('solid', fgColor=c)
thin = Side(style='thin', color='D9D9D9'); hair_or = Side(style='medium', color=ORANGE)
fmt = lambda d: d.strftime('%d %b %Y')
SPAN = o['span']; WKS = round((SPAN[1] - SPAN[0]).days / 7)
PREPARED = '11 Nov 2026'

# ---------- categorise
T[['G', 'C']] = T.apply(lambda x: pd.Series(tool_cat(x.DESC, x.PROD, x.FAM)), axis=1)
tools = T[T.G == 'Tools'].copy(); plant = T[T.G == 'Plant'].copy()
tools['Basis used'] = np.where(tools.peak > 0, 'Most in use at once', 'Callide store fleet')
plant['Basis used'] = np.where(plant.peak > 0, 'Most on hire at once', 'Callide store fleet')

wb = Workbook()

def banner(ws, ncols, title, sub, cog=False):
    ws.sheet_view.showGridLines = False
    for r, h in ((1, 30), (2, 22), (3, 5)): ws.row_dimensions[r].height = h
    for c in range(1, ncols + 1):
        ws.cell(1, c).fill = fill(CHAR); ws.cell(2, c).fill = fill(CHAR); ws.cell(3, c).fill = fill(ORANGE)
    ws.cell(1, 2, title).font = F(bold=True, size=18, color=WHITE)
    ws.cell(2, 2, sub).font = F(size=11, color=ORANGE, bold=True)
    ws.cell(1, 2).alignment = ws.cell(2, 2).alignment = Alignment(vertical='center')
    ws.cell(4, 2, f'Prepared by Andrew Fisher, Coates  |  {PREPARED}  |  POWERED BY SITEIQ').font = F(size=9, italic=True, color=GREY)
    ws.column_dimensions['A'].width = 2

def footer_print(ws, landscape=True, rep=None):
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.page_setup.orientation = 'landscape' if landscape else 'portrait'
    ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_margins.left = ws.page_margins.right = 0.4; ws.page_margins.top = ws.page_margins.bottom = 0.6
    ws.oddFooter.left.text = 'Coates  |  Tarong Power Station - Tool Store Recommendation'
    ws.oddFooter.right.text = 'POWERED BY SITEIQ  |  Page &P of &N'
    for h in (ws.oddFooter.left, ws.oddFooter.right): h.size = 8; h.color = GREY
    if rep: ws.print_title_rows = rep

# =====================================================================  OVERVIEW
S = wb.active; S.title = 'Overview'
NC = 13
banner(S, NC, 'TARONG POWER STATION', 'Tool Store Recommendation  |  Prepared for NextCooling', cog=True)
for c in range(2, NC + 1): S.column_dimensions[L(c)].width = 11.5
S.column_dimensions[L(NC)].width = 3
if os.path.exists(COG):
    img = XLImage(COG); img.width = img.height = 64; S.add_image(img, 'K1')

r = 6
def section(title):
    global r
    r += 1
    c = S.cell(r, 2, title.upper()); c.font = F(bold=True, size=12, color=CHAR)
    for k in range(2, NC): S.cell(r, k).border = Border(bottom=hair_or)
    S.row_dimensions[r].height = 20; r += 2

def tile(row, col, value, label, width=3, big=22, colour=ORANGE, bg=LIGHT, numfmt=None, name=None, editable=False):
    S.merge_cells(start_row=row, start_column=col, end_row=row + 1, end_column=col + width - 1)
    S.merge_cells(start_row=row + 2, start_column=col, end_row=row + 2, end_column=col + width - 1)
    for rr in range(row, row + 3):
        for cc in range(col, col + width):
            S.cell(rr, cc).fill = fill(TINT if editable else bg)
    S.cell(row, col).border = Border(left=Side(style='thick', color=ORANGE))
    S.cell(row + 1, col).border = Border(left=Side(style='thick', color=ORANGE))
    S.cell(row + 2, col).border = Border(left=Side(style='thick', color=ORANGE))
    v = S.cell(row, col, value); v.font = F(bold=True, size=big, color=colour)
    v.alignment = Alignment(horizontal='center', vertical='center')
    if numfmt: v.number_format = numfmt
    lb = S.cell(row + 2, col, label); lb.font = F(size=9, color=GREY, bold=True)
    lb.alignment = Alignment(horizontal='center', vertical='top', wrap_text=True)
    S.row_dimensions[row + 2].height = 26
    if name: wb.defined_names[name] = DefinedName(name, attr_text=f"Overview!${L(col)}${row}")

# --- headline
n_tools = len(tools); n_cons = len(con)
S.merge_cells(start_row=r, start_column=2, end_row=r + 1, end_column=NC - 1)
h = S.cell(r, 2, f"Built from {WKS} weeks of live Coates store data at the Callide Power Station Project. "
                 f"Scaled to Tarong's crew of 180, the recommended store carries {n_tools} tool and equipment lines, "
                 f"{n_cons:,} consumable lines and {len(plant)} plant lines for scope review.")
h.font = F(size=11, color=CHAR); h.alignment = Alignment(wrap_text=True, vertical='center')
S.row_dimensions[r].height = 22; S.row_dimensions[r + 1].height = 22; r += 2

section('1.  The Callide Power Station Project - what the store delivered')
tile(r, 2, WKS, 'WEEKS OF STORE OPERATION'); tile(r, 5, ST['people'], 'PEOPLE SERVED', numfmt='#,##0')
tile(r, 8, o['CALLIDE_CREW'], 'TYPICAL WEEKLY CREW', numfmt='#,##0', name='CAL_CREW', editable=False); r += 4
tile(r, 2, ST['issues'], 'CONSUMABLE ISSUES', numfmt='#,##0'); tile(r, 5, ST['tool_hires'], 'TOOL ISSUES', numfmt='#,##0')
tile(r, 8, ST['avg_tools'], 'TOOLS IN USE ON AN AVERAGE DAY', numfmt='#,##0'); r += 3
S.cell(r, 2, f"Store open {fmt(SPAN[0])} to {fmt(SPAN[1])}. Busiest week {ST['peak_week']} people; peak of {ST['peak_tools']:,} tools in use on one day. "
             f"Typical crew = median people served per week, {fmt(o['W0'])} to {fmt(o['W1'])}.").font = F(size=9, italic=True, color=GREY)
r += 1

section('2.  The Tarong request')
tile(r, 2, 30, 'WHITE COLLAR', name='TAR_WC', editable=True, colour=CHAR)
tile(r, 5, 150, 'BLUE COLLAR', name='TAR_BC', editable=True, colour=CHAR)
tile(r, 8, '=TAR_WC+TAR_BC', 'TOTAL CREW', name='TAR_TOTAL'); r += 4
tile(r, 2, '=ROUND(TAR_TOTAL/CAL_CREW,3)', 'SCALING FACTOR  (TARONG / CALLIDE)', name='FACTOR', numfmt='0.000', colour=CHAR)
tile(r, 5, None, 'TARONG DURATION (WEEKS) - ENTER WHEN CONFIRMED', name='TAR_WEEKS', editable=True, colour=CHAR)
tile(r, 8, '=IF(TAR_WEEKS="","TBC",TAR_WEEKS)', 'JOB TOTALS BASED ON', colour=MID, big=16); r += 3
S.cell(r, 2, 'Shaded cells can be changed - every tab recalculates.').font = F(size=9, italic=True, color=GREY); r += 1

section('3.  Recommended store for Tarong')
tile(r, 2, "=SUMIF('Tools & Equipment'!J:J,\"<>\",'Tools & Equipment'!H:H)", 'TOOLS & EQUIPMENT ITEMS', numfmt='#,##0')
tile(r, 5, "=ROUND(SUMIF(Consumables!H:H,\"<>\",Consumables!E:E),0)", 'CONSUMABLE UNITS PER WEEK', numfmt='#,##0')
tile(r, 8, "=SUMIF('Plant & Mobile Equipment'!J:J,\"<>\",'Plant & Mobile Equipment'!H:H)", 'PLANT ITEMS (GUIDE - SIZE TO SCOPE)', numfmt='#,##0', colour=CHAR); r += 4

def table_head(row, heads, widths_from=2):
    col = widths_from
    for text, span in heads:
        if span > 1: S.merge_cells(start_row=row, start_column=col, end_row=row, end_column=col + span - 1)
        for k in range(col, col + span): S.cell(row, k).fill = fill(SLATE)
        c = S.cell(row, col, text); c.font = F(bold=True, color=WHITE, size=10)
        c.alignment = Alignment(horizontal='left' if col == widths_from else 'center', vertical='center', wrap_text=True)
        col += span
    S.row_dimensions[row].height = 30

def table_row(row, vals, band, fmts=None):
    col = 2
    for k, (v, span) in enumerate(vals):
        if span > 1: S.merge_cells(start_row=row, start_column=col, end_row=row, end_column=col + span - 1)
        for kk in range(col, col + span):
            S.cell(row, kk).fill = fill(BAND if band else WHITE); S.cell(row, kk).border = Border(bottom=thin)
        c = S.cell(row, col, v); c.font = F(size=10, color=CHAR, bold=(k == len(vals) - 1))
        if k == len(vals) - 1: c.font = F(size=10, color=ORANGE_DK, bold=True)
        c.alignment = Alignment(horizontal='left' if k == 0 else 'center', vertical='center')
        if fmts and fmts[k]: c.number_format = fmts[k]
        col += span

section('4.  Tools & equipment by category')
table_head(r, [('Category', 5), ('Lines', 2), ('Callide basis', 2), ('Tarong recommended', 2)]); r += 1
for i, cat in enumerate(sorted(tools.C.unique())):
    table_row(r, [(cat, 5), (f"=COUNTIFS('Tools & Equipment'!$J:$J,\"{cat}\")", 2),
                  (f"=SUMIFS('Tools & Equipment'!$F:$F,'Tools & Equipment'!$J:$J,\"{cat}\")", 2),
                  (f"=SUMIFS('Tools & Equipment'!$H:$H,'Tools & Equipment'!$J:$J,\"{cat}\")", 2)], i % 2, [None, '#,##0', '#,##0', '#,##0']); r += 1
r += 1

section('5.  Key items - Callide v Tarong')
table_head(r, [('Item', 6), ('Callide', 2), ('Tarong', 2), ('Basis', 1)]); r += 1
top = tools.sort_values('basis', ascending=False).head(15)
for i, x in enumerate(top.itertuples()):
    table_row(r, [(x.DESC, 6), (int(x.basis), 2), (f'=ROUNDUP(H{r}*FACTOR,0)', 2), ('Peak use' if x.peak > 0 else 'Fleet', 1)], i % 2, [None, '#,##0', '#,##0', None])
    # keep Tarong in last bold column style
    S.cell(r, 10).font = F(size=10, color=ORANGE_DK, bold=True); S.cell(r, 12).font = F(size=9, color=GREY)
    r += 1
r += 1
table_head(r, [('Consumable', 6), ('Callide / week', 2), ('Tarong / week', 2), ('Group', 1)]); r += 1
topc = con[~con.Note.str.contains('One-off')].sort_values('Callide per week', ascending=False).head(12)
for i, (_, x) in enumerate(topc.iterrows()):
    table_row(r, [(x['Description'], 6), (round(x['Callide per week'], 1), 2), (f'=ROUND(H{r}*FACTOR,0)', 2), (x['Group'], 1)], i % 2, [None, '#,##0.0', '#,##0', None])
    S.cell(r, 10).font = F(size=10, color=ORANGE_DK, bold=True); S.cell(r, 12).font = F(size=9, color=GREY)
    r += 1
S.column_dimensions['L'].width = 22
r += 1

section('6.  How the numbers are worked out')
for a, b in [('Tools & equipment', "The most of each item in use at once at Callide (or the Callide store fleet where daily use wasn't recorded) x the scaling factor, rounded up."),
             ('Consumables', 'Callide weekly use x the scaling factor = Tarong weekly use. Opening stock covers 2 weeks. Job total = weekly use x Tarong weeks.'),
             ('Plant & mobile equipment', 'Shown on its own tab as a guide only - EWPs, forklifts, generators and lighting towers are sized to the Tarong scope of work, not headcount.'),
             ('One-off purchases', 'Bulk project materials bought once at Callide (fixings, shims, timber) are marked in the notes - include only if the Tarong scope needs them.')]:
    S.merge_cells(start_row=r, start_column=2, end_row=r, end_column=4); S.merge_cells(start_row=r, start_column=5, end_row=r, end_column=NC - 1)
    S.cell(r, 2, a).font = F(bold=True, size=10, color=ORANGE_DK); S.cell(r, 2).alignment = Alignment(vertical='top')
    c = S.cell(r, 5, b); c.font = F(size=10, color=CHAR); c.alignment = Alignment(wrap_text=True, vertical='top')
    S.row_dimensions[r].height = 30; r += 1
r += 1
S.merge_cells(start_row=r, start_column=2, end_row=r, end_column=NC - 1)
S.cell(r, 2, f"Source: Coates SiteIQ store records, Callide Power Station Project, {fmt(SPAN[0])} to {fmt(SPAN[1])}. Quantities only.").font = F(size=8, italic=True, color=GREY)
footer_print(S, landscape=False)
S.print_area = f'A1:{L(NC)}{r}'

# =====================================================================  DETAIL SHEETS
def detail(name, title, sub, df, cat_col, cols, values, qty_col, sort_col, note_hint=None):
    ws = wb.create_sheet(name)
    ncol = len(cols) + 1
    banner(ws, ncol + 1, title, sub)
    HR = 6
    for j, (text, w, _) in enumerate(cols, start=2):
        c = ws.cell(HR, j, text); c.font = F(bold=True, color=WHITE, size=10); c.fill = fill(SLATE)
        c.alignment = Alignment(horizontal='left' if j == 2 else 'center', vertical='center', wrap_text=True)
        ws.column_dimensions[L(j)].width = w
    ws.row_dimensions[HR].height = 34
    if note_hint: ws.cell(5, 2, note_hint).font = F(size=9, italic=True, color=GREY)
    ws.freeze_panes = ws.cell(HR + 1, 3)
    ws.sheet_properties.outlinePr.summaryBelow = False
    r = HR + 1
    for cat in sorted(df[cat_col].unique()):
        g = df[df[cat_col] == cat].sort_values(sort_col, ascending=False)
        hr = r
        for j in range(2, ncol + 1):
            ws.cell(r, j).fill = fill(TINT); ws.cell(r, j).border = Border(top=Side(style='thin', color=ORANGE))
        c = ws.cell(r, 2, f'{cat.upper()}'); c.font = F(bold=True, size=11, color=ORANGE_DK)
        ws.cell(r, 3, f'{len(g)} line' + ('s' if len(g) != 1 else '')).font = F(size=9, color=GREY)
        ws.row_dimensions[r].height = 20
        r += 1; first = r
        for i, (_, x) in enumerate(g.iterrows()):
            vals = values(x, r)
            for j, ((v, nf), (_, _, al)) in enumerate(zip(vals, cols), start=2):
                cc = ws.cell(r, j, v); cc.font = F(size=10, color=CHAR)
                cc.alignment = Alignment(horizontal=al, vertical='center', wrap_text=(j == 2 or j == ncol))
                if nf: cc.number_format = nf
                cc.fill = fill(BAND if i % 2 else WHITE); cc.border = Border(bottom=thin)
            q = ws.cell(r, qty_col); q.font = F(size=10, bold=True, color=ORANGE_DK)
            nt = ws.cell(r, ncol)
            if nt.value: nt.font = F(size=9, italic=True, color=GREY)
            ws.row_dimensions[r].outline_level = 1
            r += 1
        sub = ws.cell(hr, qty_col, f'=SUBTOTAL(9,{L(qty_col)}{first}:{L(qty_col)}{r-1})')
        sub.font = F(bold=True, size=11, color=ORANGE_DK); sub.number_format = '#,##0'; sub.alignment = Alignment(horizontal='center')
    ws.cell(r + 1, 2, 'Use the + / - buttons on the left to expand or collapse each category.').font = F(size=9, italic=True, color=GREY)
    footer_print(ws, rep='6:6')
    ws.print_area = f'A1:{L(ncol)}{r}'
    return ws

C = lambda w, al='center': (w, al)
# Tools: B Description | C fleet | D times issued | E peak | F basis qty | G basis | H Tarong | I avg | J category(hidden) | K note
tcols = [('Description', 52, 'left'), ('Callide store fleet', 11, 'center'), ('Times issued at Callide', 11, 'center'),
         ('Most in use at once', 11, 'center'), ('Callide basis qty', 11, 'center'), ('Basis', 17, 'center'),
         ('TARONG RECOMMENDED', 13, 'center'), ('Average in use per day', 11, 'center'), ('Category', 4, 'center'), ('Notes', 40, 'left')]
def tvals(x, r):
    return [(x.DESC, None), (int(x.store_fleet), '#,##0'), (int(x.hires), '#,##0'), (int(x.peak), '#,##0'), (int(x.basis), '#,##0'),
            (x['Basis used'], None), (f'=IF(F{r}=0,0,ROUNDUP(F{r}*FACTOR,0))', '#,##0'), (float(x.avg), '#,##0.0'), (x.C, None),
            ((x.Note if 'Plant' not in x.Note else '') or None, None)]
ws = detail('Tools & Equipment', 'TOOLS & EQUIPMENT', 'Callide usage scaled to the Tarong crew', tools, 'C', tcols, tvals, 8, 'basis',
            'Tarong quantity = Callide basis x scaling factor (Overview tab), rounded up.')
ws.column_dimensions['J'].hidden = True

pcols = [('Description', 52, 'left'), ('Callide store fleet', 11, 'center'), ('Times hired at Callide', 11, 'center'),
         ('Most on hire at once', 11, 'center'), ('Callide basis qty', 11, 'center'), ('Basis', 17, 'center'),
         ('TARONG GUIDE QTY', 13, 'center'), ('Average on hire per day', 11, 'center'), ('Category', 4, 'center'), ('Notes', 40, 'left')]
def pvals(x, r):
    return [(x.DESC, None), (int(x.store_fleet), '#,##0'), (int(x.hires), '#,##0'), (int(x.peak), '#,##0'), (int(x.basis), '#,##0'),
            (x['Basis used'], None), (f'=IF(F{r}=0,0,ROUNDUP(F{r}*FACTOR,0))', '#,##0'), (float(x.avg), '#,##0.0'), (x.C, None),
            ('Size to Tarong scope of work', None)]
ws = detail('Plant & Mobile Equipment', 'PLANT & MOBILE EQUIPMENT', 'Guide only - confirm against the Tarong scope of work', plant, 'C', pcols, pvals, 8, 'basis',
            'Plant is driven by scope and site layout rather than crew size - the guide quantity is a starting point for the scope review.')
ws.column_dimensions['J'].hidden = True

# Consumables: B Description | C Callide total | D Callide/week | E Tarong/week | F opening | G job total | H group(hidden) | I note
ccols = [('Description', 55, 'left'), ('Callide total issued', 12, 'center'), ('Callide per week', 11, 'center'),
         ('TARONG PER WEEK', 12, 'center'), ('Opening stock (2 weeks)', 12, 'center'), ('Tarong total for job', 12, 'center'),
         ('Group', 4, 'center'), ('Notes', 44, 'left')]
def cvals(x, r):
    note = x['Note'] or None
    return [(x['Description'], None), (int(x['Total issued (whole job)']), '#,##0'), (float(x['Callide per week']), '#,##0.0'),
            (f'=ROUND(D{r}*FACTOR,1)', '#,##0.0'), (f'=IF(D{r}=0,0,MAX(1,ROUNDUP(D{r}*FACTOR*2,0)))', '#,##0'),
            (f'=IF(TAR_WEEKS="","TBC",ROUNDUP(D{r}*FACTOR*TAR_WEEKS,0))', '#,##0'), (x['Group'], None), (note, None)]
ws = detail('Consumables', 'CONSUMABLES', 'Callide weekly use scaled to the Tarong crew', con, 'Group', ccols, cvals, 5, 'Callide per week',
            'Job totals show TBC until the Tarong duration is entered on the Overview tab.')
ws.column_dimensions['H'].hidden = True

# =====================================================================  STORE SETUP
ws = wb.create_sheet('Store Setup'); banner(ws, 7, 'STORE SET-UP', 'How the Callide store was laid out')
heads = [('Container / area', 30), ('Lines held', 12), ('Tool lines', 12), ('Consumable lines', 14)]
for j, (t, w) in enumerate(heads, start=2):
    c = ws.cell(6, j, t); c.font = F(bold=True, color=WHITE); c.fill = fill(SLATE); c.alignment = Alignment(horizontal='left' if j == 2 else 'center')
    ws.column_dimensions[L(j)].width = w
for i, x in enumerate(units.itertuples(index=False)):
    for j, v in enumerate(x, start=2):
        c = ws.cell(7 + i, j, v); c.font = F(size=10, color=CHAR); c.fill = fill(BAND if i % 2 else WHITE); c.border = Border(bottom=thin)
        c.alignment = Alignment(horizontal='left' if j == 2 else 'center'); c.number_format = '#,##0'
ws.cell(9 + len(units), 2, 'Store set-up is sized to the site layout and scope rather than crew numbers.').font = F(size=9, italic=True, color=GREY)
footer_print(ws, landscape=False)

# =====================================================================  CREW CURVE
ws = wb.create_sheet('Callide Weekly Crew'); banner(ws, 12, 'CALLIDE WEEKLY CREW', 'People served by the Coates store each week')
for j, (t, w) in enumerate([('Week starting', 14), ('People served', 14)], start=2):
    c = ws.cell(6, j, t); c.font = F(bold=True, color=WHITE); c.fill = fill(SLATE); c.alignment = Alignment(horizontal='center')
    ws.column_dimensions[L(j)].width = w
for i, x in enumerate(weekly.itertuples(index=False)):
    a = ws.cell(7 + i, 2, x[0].date()); a.number_format = 'DD MMM YYYY'
    b = ws.cell(7 + i, 3, int(x[1]))
    for c in (a, b): c.font = F(size=10, color=CHAR); c.fill = fill(BAND if i % 2 else WHITE); c.alignment = Alignment(horizontal='center')
ch = LineChart(); ch.title = 'People served per week - Callide Power Station Project'; ch.height = 9; ch.width = 24; ch.legend = None
ch.add_data(Reference(ws, min_col=3, min_row=6, max_row=6 + len(weekly)), titles_from_data=True)
ch.set_categories(Reference(ws, min_col=2, min_row=7, max_row=6 + len(weekly)))
s = ch.series[0]; s.graphicalProperties.line.solidFill = ORANGE; s.graphicalProperties.line.width = 28000; s.smooth = True
ch.y_axis.majorGridlines = None; ch.x_axis.number_format = 'MMM YY'
ws.add_chart(ch, 'E6')
footer_print(ws)

for w in wb.worksheets: w.sheet_properties.tabColor = ORANGE if w.title in ('Overview',) else SLATE
wb.active = 0
wb.save('Tarong_Scaling_from_Callide.xlsx'); print('ok')
