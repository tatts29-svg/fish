"""Build the client-facing Tarong tool store recommendation workbook (Coates branded).
Run analyse.py first (writes out.pkl). Output: Tarong_Scaling_from_Callide.xlsx"""
import os, numpy as np, pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.utils import get_column_letter as L
from openpyxl.chart import LineChart, Reference
from openpyxl.drawing.image import Image as XLImage
from openpyxl.worksheet.pagebreak import Break
from cats import tool_cat

o = pd.read_pickle('out.pkl'); ST = o['stats']
con, T, units, weekly = o['con'].copy(), o['T'].copy(), o['units'], o['weekly']
COG = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'coates-way-cog.png')
ONEOFF = ['Purchased tools & equipment', 'Project materials']

# ---------------------------------------------------------------- Coates palette
ORANGE, ORANGE_DK, CHAR, SLATE = 'F26222', 'C44C28', '1D1D1B', '2A313C'
GREY, MID, LIGHT, BAND, TINT, WHITE = '595959', 'A6A6A6', 'F3F3F3', 'F9F9F9', 'FDEBE1', 'FFFFFF'
def F(**k): k.setdefault('name', 'Calibri'); k.setdefault('color', CHAR); return Font(**k)
def fill(c): return PatternFill('solid', fgColor=c)
thin = Side(style='thin', color='E1E1E1'); orange_rule = Side(style='medium', color=ORANGE)
fmt = lambda d: d.strftime('%d %b %Y')
SPAN = o['span']; WKS = round((SPAN[1] - SPAN[0]).days / 7)
PREPARED = '11 Nov 2026'
BYLINE = f'Prepared by Andrew Fisher  |  Shutdown Manager QLD & NT  |  Coates        {PREPARED}        POWERED BY SITEIQ'

# ---------------------------------------------------------------- categorise
T[['G', 'C']] = T.apply(lambda x: pd.Series(tool_cat(x.DESC, x.PROD, x.FAM)), axis=1)
recorded = T.hires > 0
T['basis_lbl'] = np.where(T.peak > 0, 'Peak in use', 'Store fleet')
tools = T[T.G == 'Tools'].copy(); plant = T[T.G == 'Plant'].copy()
ongoing = con[~con.Group.isin(ONEOFF)]; oneoff = con[con.Group.isin(ONEOFF)]

wb = Workbook()

def banner(ws, ncols, title, sub, cog=None):
    ws.sheet_view.showGridLines = False; ws.sheet_view.zoomScale = 90
    for r, h in ((1, 34), (2, 22), (3, 5), (4, 18)): ws.row_dimensions[r].height = h
    for c in range(1, ncols + 1):
        for rr, col in ((1, CHAR), (2, CHAR), (3, ORANGE)): ws.cell(rr, c).fill = fill(col)
    ws.cell(1, 2, title).font = F(bold=True, size=20, color=WHITE)
    ws.cell(2, 2, sub).font = F(size=11, color=ORANGE, bold=True)
    ws.cell(1, 2).alignment = Alignment(vertical='bottom'); ws.cell(2, 2).alignment = Alignment(vertical='top')
    ws.cell(4, 2, BYLINE).font = F(size=9, color=GREY)
    ws.column_dimensions['A'].width = 2
    if cog and os.path.exists(COG):
        img = XLImage(COG); img.width = img.height = 58; ws.add_image(img, cog)

def print_setup(ws, landscape=True, rep=None):
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.page_setup.orientation = 'landscape' if landscape else 'portrait'
    ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_margins.left = ws.page_margins.right = 0.35; ws.page_margins.top = 0.45; ws.page_margins.bottom = 0.6
    ws.oddFooter.left.text = 'Coates  |  Tarong Power Station - Tool Store Recommendation'
    ws.oddFooter.right.text = 'POWERED BY SITEIQ  |  Page &P of &N'
    for h in (ws.oddFooter.left, ws.oddFooter.right): h.size = 8; h.color = GREY
    if rep: ws.print_title_rows = rep

# ================================================================ OVERVIEW
S = wb.active; S.title = 'Overview'
NC = 14
banner(S, NC, 'TARONG POWER STATION', 'Tool Store Recommendation  |  Prepared for NextCooling', cog='L1')
for c in range(2, NC): S.column_dimensions[L(c)].width = 10.6
S.column_dimensions[L(NC)].width = 2
r = 6

def section(title):
    global r
    r += 1
    S.cell(r, 2, title.upper()).font = F(bold=True, size=12)
    for k in range(2, NC): S.cell(r, k).border = Border(bottom=orange_rule)
    S.row_dimensions[r].height = 20; r += 2

def tile(row, col, value, label, width=4, big=24, colour=ORANGE, bg=LIGHT, numfmt='#,##0', name=None):
    S.merge_cells(start_row=row, start_column=col, end_row=row + 1, end_column=col + width - 1)
    S.merge_cells(start_row=row + 2, start_column=col, end_row=row + 2, end_column=col + width - 1)
    for rr in range(row, row + 3):
        for cc in range(col, col + width): S.cell(rr, cc).fill = fill(bg)
        S.cell(rr, col).border = Border(left=Side(style='thick', color=ORANGE))
    v = S.cell(row, col, value); v.font = F(bold=True, size=big, color=colour)
    v.alignment = Alignment(horizontal='center', vertical='center'); v.number_format = numfmt
    lb = S.cell(row + 2, col, label); lb.font = F(size=8.5, color=GREY, bold=True)
    lb.alignment = Alignment(horizontal='center', vertical='top', wrap_text=True)
    S.row_dimensions[row].height = 22; S.row_dimensions[row + 1].height = 22; S.row_dimensions[row + 2].height = 26
    if name: wb.defined_names[name] = DefinedName(name, attr_text=f"Overview!${L(col)}${row}")

def note(text, height=None):
    global r
    S.merge_cells(start_row=r, start_column=2, end_row=r, end_column=NC - 1)
    c = S.cell(r, 2, text); c.font = F(size=8.5, italic=True, color=GREY); c.alignment = Alignment(wrap_text=True, vertical='top')
    if height: S.row_dimensions[r].height = height
    r += 1

# --- the recommendation, up front
S.merge_cells(start_row=r, start_column=2, end_row=r, end_column=NC - 1)
S.cell(r, 2, 'THE RECOMMENDATION').font = F(bold=True, size=10, color=ORANGE_DK); r += 1
S.merge_cells(start_row=r, start_column=2, end_row=r + 2, end_column=NC - 1)
for rr in range(r, r + 3):
    for cc in range(2, NC): S.cell(rr, cc).fill = fill(TINT)
    S.cell(rr, 2).border = Border(left=Side(style='thick', color=ORANGE))
lead_row = r
r += 4

section('1.  Callide Power Station Project - what our store delivered')
tile(r, 2, WKS, 'WEEKS OF CONTINUOUS STORE OPERATION'); tile(r, 6, ST['people'], 'PEOPLE SERVED')
tile(r, 10, o['CALLIDE_CREW'], 'TYPICAL WEEKLY CREW', name='CAL_CREW'); r += 4
tile(r, 2, ST['issues'], 'CONSUMABLE ISSUES'); tile(r, 6, ST['tool_hires'], 'TOOL ISSUES')
tile(r, 10, ST['avg_tools'], 'TOOLS IN USE ON AN AVERAGE DAY', name='CAL_AVG_TOOLS'); r += 3
note(f"Store open {fmt(SPAN[0])} to {fmt(SPAN[1])}. Busiest week: {ST['peak_week']} people. Peak day: {ST['peak_tools']:,} tools in use. "
     f"Typical weekly crew is the median number of people served each week from {fmt(o['W0'])} to {fmt(o['W1'])}.", 24)

section('2.  The Tarong request')
tile(r, 2, 30, 'WHITE COLLAR', bg=TINT, colour=CHAR, name='TAR_WC')
tile(r, 6, 150, 'BLUE COLLAR', bg=TINT, colour=CHAR, name='TAR_BC')
tile(r, 10, '=TAR_WC+TAR_BC', 'TOTAL CREW', name='TAR_TOTAL'); r += 4
tile(r, 2, '=ROUND(TAR_TOTAL/CAL_CREW,3)', 'SCALING FACTOR  (TARONG CREW / CALLIDE CREW)', colour=CHAR, numfmt='0.000', name='FACTOR')
tile(r, 6, None, 'TARONG DURATION (WEEKS)  -  ENTER WHEN CONFIRMED', bg=TINT, colour=CHAR, name='TAR_WEEKS')
tile(r, 10, '=ROUNDUP(CAL_AVG_TOOLS*FACTOR,0)', 'TOOLS IN USE ON AN AVERAGE DAY AT TARONG (FORECAST)'); r += 3
note('Orange-shaded cells can be changed - every tab recalculates instantly.')

section('3.  Recommended store for Tarong')
TQ = "SUMIF('Tools & Equipment'!K:K,\"<>\",'Tools & Equipment'!I:I)"
CQ = "SUMIF(Consumables!I:I,\"<>\",Consumables!E:E)"
PQ = "SUMIF('Plant & Mobile Equipment'!K:K,\"<>\",'Plant & Mobile Equipment'!I:I)"
tile(r, 2, f'={TQ}', 'TOOLS & EQUIPMENT ITEMS')
tile(r, 6, f'=ROUND({CQ},0)', 'CONSUMABLE UNITS PER WEEK')
tile(r, 10, f'={PQ}', 'PLANT ITEMS  (GUIDE - SIZE TO SCOPE)', colour=CHAR); r += 3
note(f"{len(tools)} tool and equipment lines across {tools.C.nunique()} categories  |  {len(ongoing):,} ongoing consumable lines across "
     f"{ongoing.Group.nunique()} groups  |  {len(plant)} plant lines  |  {len(oneoff)} one-off purchase lines supplied to scope.", 24)

S.cell(lead_row, 2).value = (f'="Built from {WKS} weeks of live Coates store data at the Callide Power Station Project and scaled to Tarong\'s crew of "'
                             f'&TAR_TOTAL&". We recommend a store of "&TEXT({TQ},"#,##0")&" tools and equipment items across {tools.C.nunique()} categories, '
                             f'running at about "&TEXT({CQ},"#,##0")&" consumable units a week, with plant sized to the Tarong scope of work."')
S.cell(lead_row, 2).font = F(size=12, bold=True); S.cell(lead_row, 2).alignment = Alignment(wrap_text=True, vertical='center', indent=1)
for rr in range(lead_row, lead_row + 3): S.row_dimensions[rr].height = 20

S.row_breaks.append(Break(id=r)); r += 1

def thead(cols):
    global r
    c0 = 2
    for text, span in cols:
        if span > 1: S.merge_cells(start_row=r, start_column=c0, end_row=r, end_column=c0 + span - 1)
        for k in range(c0, c0 + span): S.cell(r, k).fill = fill(SLATE)
        c = S.cell(r, c0, text); c.font = F(bold=True, color=WHITE, size=9.5)
        c.alignment = Alignment(horizontal='left' if c0 == 2 else 'center', vertical='center', wrap_text=True, indent=1 if c0 == 2 else 0)
        c0 += span
    S.row_dimensions[r].height = 24; r += 1

def trow(vals, i, fmts, emph_last=True):
    global r
    c0 = 2
    for k, (v, span) in enumerate(vals):
        if span > 1: S.merge_cells(start_row=r, start_column=c0, end_row=r, end_column=c0 + span - 1)
        for kk in range(c0, c0 + span):
            S.cell(r, kk).fill = fill(BAND if i % 2 else WHITE); S.cell(r, kk).border = Border(bottom=thin)
        c = S.cell(r, c0, v); last = k == len(vals) - 1
        c.font = F(size=10, bold=last and emph_last, color=ORANGE_DK if last and emph_last else CHAR)
        c.alignment = Alignment(horizontal='left' if k == 0 else 'center', vertical='center', indent=1 if k == 0 else 0)
        if fmts[k]: c.number_format = fmts[k]
        c0 += span
    S.row_dimensions[r].height = 17; r += 1

def total_row(vals, fmts):
    global r
    c0 = 2
    for k, (v, span) in enumerate(vals):
        if span > 1: S.merge_cells(start_row=r, start_column=c0, end_row=r, end_column=c0 + span - 1)
        for kk in range(c0, c0 + span): S.cell(r, kk).fill = fill(TINT); S.cell(r, kk).border = Border(top=orange_rule)
        c = S.cell(r, c0, v); c.font = F(size=10, bold=True, color=ORANGE_DK if k == len(vals) - 1 else CHAR)
        c.alignment = Alignment(horizontal='left' if k == 0 else 'center', vertical='center', indent=1 if k == 0 else 0)
        if fmts[k]: c.number_format = fmts[k]
        c0 += span
    S.row_dimensions[r].height = 19; r += 1

section('4.  Tools & equipment by category')
thead([('Category', 6), ('Lines', 2), ('Callide sizing qty', 2), ('Tarong recommended', 2)])
TE = "'Tools & Equipment'"
first = r
for i, cat in enumerate(sorted(tools.C.unique())):
    trow([(cat, 6), (f'=COUNTIFS({TE}!$K:$K,"{cat}")', 2), (f'=SUMIFS({TE}!$H:$H,{TE}!$K:$K,"{cat}")', 2),
          (f'=SUMIFS({TE}!$I:$I,{TE}!$K:$K,"{cat}")', 2)], i, [None, '#,##0', '#,##0', '#,##0'])
total_row([('Total', 6), (f'=SUM(H{first}:H{r-1})', 2), (f'=SUM(J{first}:J{r-1})', 2), (f'=SUM(L{first}:L{r-1})', 2)], [None, '#,##0', '#,##0', '#,##0'])
r += 1

section('5.  Plant & mobile equipment by type  (guide - size to scope)')
thead([('Type', 6), ('Lines', 2), ('Callide sizing qty', 2), ('Tarong guide', 2)])
PE = "'Plant & Mobile Equipment'"
first = r
for i, cat in enumerate(sorted(plant.C.unique())):
    trow([(cat, 6), (f'=COUNTIFS({PE}!$K:$K,"{cat}")', 2), (f'=SUMIFS({PE}!$H:$H,{PE}!$K:$K,"{cat}")', 2),
          (f'=SUMIFS({PE}!$I:$I,{PE}!$K:$K,"{cat}")', 2)], i, [None, '#,##0', '#,##0', '#,##0'])
total_row([('Total', 6), (f'=SUM(H{first}:H{r-1})', 2), (f'=SUM(J{first}:J{r-1})', 2), (f'=SUM(L{first}:L{r-1})', 2)], [None, '#,##0', '#,##0', '#,##0'])
S.row_breaks.append(Break(id=r)); r += 1

section('6.  Consumables by group  (ongoing weekly use)')
thead([('Group', 6), ('Lines', 2), ('Callide per week', 2), ('Tarong per week', 2)])
first = r
for i, g in enumerate(sorted(ongoing.Group.unique())):
    trow([(g, 6), (f'=COUNTIFS(Consumables!$I:$I,"{g}")', 2), (f'=ROUND(SUMIFS(Consumables!$D:$D,Consumables!$I:$I,"{g}"),0)', 2),
          (f'=ROUND(SUMIFS(Consumables!$E:$E,Consumables!$I:$I,"{g}"),0)', 2)], i, [None, '#,##0', '#,##0', '#,##0'])
total_row([('Total', 6), (f'=SUM(H{first}:H{r-1})', 2), (f'=SUM(J{first}:J{r-1})', 2), (f'=SUM(L{first}:L{r-1})', 2)], [None, '#,##0', '#,##0', '#,##0'])
note(f"Plus {len(oneoff)} one-off lines (tools bought outright and project materials) listed at the end of the Consumables tab - supplied to the Tarong scope.")
S.row_breaks.append(Break(id=r)); r += 1

section('7.  Key items - Callide v Tarong')
thead([('Tools & equipment', 7), ('Callide', 2), ('Basis', 1), ('Tarong', 2)])
top = tools.sort_values('basis', ascending=False).head(15)
for i, x in enumerate(top.itertuples()):
    trow([(x.DESC, 7), (int(x.basis), 2), (x.basis_lbl, 1), (f'=ROUNDUP(I{r}*FACTOR,0)', 2)], i, [None, '#,##0', None, '#,##0'])
    S.cell(r - 1, 11).font = F(size=8.5, color=GREY)
r += 1
thead([('Consumables', 7), ('Callide / week', 2), ('', 1), ('Tarong / week', 2)])
topc = ongoing.sort_values('Callide per week', ascending=False).head(15)
for i, (_, x) in enumerate(topc.iterrows()):
    trow([(x['Description'], 7), (round(x['Callide per week'], 1), 2), ('', 1), (f'=ROUND(I{r}*FACTOR,0)', 2)], i, [None, '#,##0.0', None, '#,##0'])
r += 1

section('8.  How the numbers are built')
for a, b in [('Real usage, not estimates', 'Every quantity traces back to Coates SiteIQ store records from Callide - tools issued, consumables drawn and what was in use each day.'),
             ('Sized at the peak', 'Tools are sized on the most of each item in use at once at Callide (or the store fleet held, where daily use was not recorded), scaled to the Tarong crew and rounded up.'),
             ('Consumables on burn rate', 'Callide weekly use x scaling factor = Tarong weekly use. Opening stock covers the first 2 weeks; job totals follow once the duration is confirmed.'),
             ('Plant to scope', 'EWPs, forklifts, generators and lighting towers depend on scope and site layout, so they are shown as a guide for the scope review.'),
             ('One-off purchases separated', 'Tools bought outright and project materials (timber, fixings in bulk) are kept out of the weekly figures and supplied to scope.')]:
    S.merge_cells(start_row=r, start_column=2, end_row=r, end_column=5); S.merge_cells(start_row=r, start_column=6, end_row=r, end_column=NC - 1)
    S.cell(r, 2, a).font = F(bold=True, size=10, color=ORANGE_DK); S.cell(r, 2).alignment = Alignment(vertical='top', wrap_text=True)
    c = S.cell(r, 6, b); c.font = F(size=10); c.alignment = Alignment(wrap_text=True, vertical='top')
    S.row_dimensions[r].height = 30; r += 1
r += 1
note(f"Source: Coates SiteIQ store records, Callide Power Station Project, {fmt(SPAN[0])} to {fmt(SPAN[1])}. Quantities only.")
print_setup(S, landscape=False)
S.print_area = f'A1:{L(NC)}{r}'

# ================================================================ DETAIL SHEETS
def detail(name, title, sub, df, cat_col, cols, values, qty_col, sort_col, hint, groups=None, group_label=None):
    ws = wb.create_sheet(name)
    ncol = len(cols) + 1
    banner(ws, ncol, title, sub)
    HR = 7
    ws.cell(5, 2, hint).font = F(size=9, italic=True, color=GREY)
    for j, (text, w, al) in enumerate(cols, start=2):
        c = ws.cell(HR, j, text); c.font = F(bold=True, color=WHITE, size=9.5); c.fill = fill(SLATE)
        c.alignment = Alignment(horizontal='left' if j == 2 else 'center', vertical='center', wrap_text=True, indent=1 if j == 2 else 0)
        ws.column_dimensions[L(j)].width = w
    ws.cell(HR, qty_col).fill = fill(ORANGE)
    ws.row_dimensions[HR].height = 32
    ws.freeze_panes = ws.cell(HR + 1, 3)
    ws.sheet_properties.outlinePr.summaryBelow = False
    r = HR + 1
    for cat in (groups or sorted(df[cat_col].unique())):
        g = df[df[cat_col] == cat].sort_values([sort_col, 'DESC' if 'DESC' in df else 'Description'], ascending=[False, True])
        if g.empty: continue
        hr = r
        for j in range(2, ncol + 1):
            ws.cell(r, j).fill = fill(CHAR)
        lbl = cat.upper() + (group_label(cat) if group_label else '')
        ws.cell(r, 2, lbl).font = F(bold=True, size=10.5, color=WHITE)
        ws.cell(r, 2).alignment = Alignment(vertical='center', indent=1)
        ws.cell(r, 3, f'{len(g)} line' + ('s' if len(g) != 1 else '')).font = F(size=9, color=MID)
        ws.cell(r, 3).alignment = Alignment(horizontal='center', vertical='center')
        ws.row_dimensions[r].height = 21
        r += 1; first = r
        for i, (_, x) in enumerate(g.iterrows()):
            for j, ((v, nf, style), (_, _, al)) in enumerate(zip(values(x, r), cols), start=2):
                cc = ws.cell(r, j, v)
                cc.font = F(**{'size': 10, **(style or {})})
                cc.alignment = Alignment(horizontal=al, vertical='center', wrap_text=(j == 2), indent=1 if j == 2 else 0)
                if nf: cc.number_format = nf
                cc.fill = fill(BAND if i % 2 else WHITE); cc.border = Border(bottom=thin)
            ws.cell(r, qty_col).fill = fill(TINT)
            ws.row_dimensions[r].outline_level = 1
            r += 1
        sub = ws.cell(hr, qty_col, 'To scope' if cat in ONEOFF else f'=SUBTOTAL(9,{L(qty_col)}{first}:{L(qty_col)}{r-1})')
        sub.font = F(bold=True, size=11, color=ORANGE); sub.number_format = '#,##0'; sub.alignment = Alignment(horizontal='center', vertical='center')
        sub.fill = fill(CHAR)
    ws.cell(r + 1, 2, 'Tip: use the 1 / 2 buttons (top left) or the + / - buttons beside each category to collapse or expand the list.').font = F(size=9, italic=True, color=GREY)
    print_setup(ws, rep=f'{HR}:{HR}')
    ws.print_area = f'A1:{L(ncol)}{r}'
    return ws

DASH = {'color': MID}
def m(v, ok, nf='#,##0'):
    return (v, nf, None) if ok else ('-', None, DASH)

# Tools: B desc | C fleet | D times | E peak | F avg | G basis lbl | H sizing qty | I TARONG | J notes | K category(hidden)
tcols = [('Description', 54, 'left'), ('Callide store fleet', 10, 'center'), ('Times issued', 10, 'center'),
         ('Peak in use at once', 10, 'center'), ('Average in use per day', 10, 'center'), ('Sizing basis', 12, 'center'),
         ('Sizing qty', 9, 'center'), ('TARONG QTY', 12, 'center'), ('Notes', 26, 'left'), ('Category', 4, 'center')]
def tvals(x, r):
    rec = x.hires > 0
    nt = 'Early or late project use' if (x.Note and 'Used early' in x.Note) else None
    return [(x.DESC, None, None), (int(x.store_fleet), '#,##0', None), m(int(x.hires), rec), m(int(x.peak), rec), m(float(x.avg), rec, '#,##0.0'),
            (x.basis_lbl, None, {'color': GREY, 'size': 9}), (int(x.basis), '#,##0', None),
            (f'=IF(H{r}=0,0,ROUNDUP(H{r}*FACTOR,0))', '#,##0', {'bold': True, 'color': ORANGE_DK}),
            (nt, None, {'italic': True, 'color': GREY, 'size': 9}), (x.C, None, None)]
ws = detail('Tools & Equipment', 'TOOLS & EQUIPMENT', 'Callide usage scaled to the Tarong crew', tools, 'C', tcols, tvals, 9, 'basis',
            'Tarong qty = sizing qty x scaling factor (Overview), rounded up.  "-" = issued without a hire record; sized on the store fleet held.')
ws.column_dimensions['K'].hidden = True

pcols = [('Description', 54, 'left'), ('Callide store fleet', 10, 'center'), ('Times hired', 10, 'center'),
         ('Peak on hire at once', 10, 'center'), ('Average on hire per day', 10, 'center'), ('Sizing basis', 12, 'center'),
         ('Sizing qty', 9, 'center'), ('TARONG GUIDE', 12, 'center'), ('Notes', 26, 'left'), ('Category', 4, 'center')]
def pvals(x, r):
    v = tvals(x, r); v[5] = ('Peak on hire' if x.peak > 0 else 'Store fleet', None, {'color': GREY, 'size': 9})
    v[8] = ('Size to Tarong scope', None, {'italic': True, 'color': GREY, 'size': 9}); return v
ws = detail('Plant & Mobile Equipment', 'PLANT & MOBILE EQUIPMENT', 'Guide only - confirmed against the Tarong scope of work', plant, 'C', pcols, pvals, 9, 'basis',
            'Plant is driven by scope and site layout rather than crew size - the guide quantity is the starting point for the scope review.')
ws.column_dimensions['K'].hidden = True

# Consumables: B desc | C total | D per wk | E TARONG/wk | F opening | G job total | H notes | I group(hidden)
ccols = [('Description', 58, 'left'), ('Callide total issued', 11, 'center'), ('Callide per week', 11, 'center'),
         ('TARONG PER WEEK', 12, 'center'), ('Opening stock (2 weeks)', 12, 'center'), ('Tarong total for job', 12, 'center'),
         ('Notes', 26, 'left'), ('Group', 4, 'center')]
def cvals(x, r):
    one = x['Group'] in ONEOFF
    nt = {'Low use - supply on request': 'Low use - on request', 'Early or late project use only': 'Early or late project use'}.get(x['Note'], x['Note'] or None)
    if one:
        sc = ('To scope', None, {'italic': True, 'color': GREY})
        return [(x['Description'], None, None), (int(x['Total issued (whole job)']), '#,##0', None), m(float(x['Callide per week']), False),
                ('To scope', None, {'italic': True, 'color': ORANGE_DK}), sc, sc, (None, None, None), (x['Group'], None, None)]
    return [(x['Description'], None, None), (int(x['Total issued (whole job)']), '#,##0', None), (float(x['Callide per week']), '#,##0.0', None),
            (f'=ROUND(D{r}*FACTOR,1)', '#,##0.0', {'bold': True, 'color': ORANGE_DK}),
            (f'=IF(D{r}=0,0,MAX(1,ROUNDUP(D{r}*FACTOR*2,0)))', '#,##0', None),
            (f'=IF(TAR_WEEKS="","TBC",ROUNDUP(D{r}*FACTOR*TAR_WEEKS,0))', '#,##0', None),
            (nt, None, {'italic': True, 'color': GREY, 'size': 9}), (x['Group'], None, None)]
cons_sorted = con.rename(columns={'Description': 'Description'}).copy()
order = sorted(ongoing.Group.unique()) + ONEOFF
ws = detail('Consumables', 'CONSUMABLES', 'Callide weekly use scaled to the Tarong crew', cons_sorted, 'Group', ccols, cvals, 5, 'Callide per week',
            'Job totals show TBC until the Tarong duration is entered on the Overview.  One-off purchases are listed last and supplied to scope.',
            groups=order, group_label=lambda g: '   -   ONE-OFF, SUPPLY TO SCOPE' if g in ONEOFF else '')
ws.column_dimensions['I'].hidden = True

# ================================================================ STORE SETUP
ws = wb.create_sheet('Store Setup'); banner(ws, 7, 'STORE SET-UP', 'How the Callide store was laid out')
ws.cell(5, 2, 'Store set-up is sized to the site layout and scope rather than crew numbers.').font = F(size=9, italic=True, color=GREY)
heads = [('Container / area', 32), ('Lines held', 12), ('Tool lines', 12), ('Consumable lines', 14)]
for j, (t, w) in enumerate(heads, start=2):
    c = ws.cell(7, j, t); c.font = F(bold=True, color=WHITE); c.fill = fill(SLATE)
    c.alignment = Alignment(horizontal='left' if j == 2 else 'center', vertical='center', indent=1 if j == 2 else 0)
    ws.column_dimensions[L(j)].width = w
ws.row_dimensions[7].height = 24
for i, x in enumerate(units.itertuples(index=False)):
    for j, v in enumerate(x, start=2):
        c = ws.cell(8 + i, j, v); c.font = F(size=10); c.fill = fill(BAND if i % 2 else WHITE); c.border = Border(bottom=thin)
        c.alignment = Alignment(horizontal='left' if j == 2 else 'center', indent=1 if j == 2 else 0); c.number_format = '#,##0'
print_setup(ws, landscape=False)

# ================================================================ CREW CURVE
ws = wb.create_sheet('Callide Weekly Crew'); banner(ws, 15, 'CALLIDE WEEKLY CREW', 'People served by the Coates store each week')
for j, (t, w) in enumerate([('Week starting', 14), ('People served', 14)], start=2):
    c = ws.cell(7, j, t); c.font = F(bold=True, color=WHITE); c.fill = fill(SLATE); c.alignment = Alignment(horizontal='center', vertical='center')
    ws.column_dimensions[L(j)].width = w
ws.row_dimensions[7].height = 24
for i, x in enumerate(weekly.itertuples(index=False)):
    a = ws.cell(8 + i, 2, x[0].date()); a.number_format = 'DD MMM YYYY'
    b = ws.cell(8 + i, 3, int(x[1]))
    for c in (a, b): c.font = F(size=10); c.fill = fill(BAND if i % 2 else WHITE); c.alignment = Alignment(horizontal='center'); c.border = Border(bottom=thin)
ch = LineChart(); ch.title = 'People served per week - Callide Power Station Project'; ch.height = 9.5; ch.width = 25; ch.legend = None
ch.add_data(Reference(ws, min_col=3, min_row=7, max_row=7 + len(weekly)), titles_from_data=True)
ch.set_categories(Reference(ws, min_col=2, min_row=8, max_row=7 + len(weekly)))
s = ch.series[0]; s.graphicalProperties.line.solidFill = ORANGE; s.graphicalProperties.line.width = 32000; s.smooth = True
ch.y_axis.majorGridlines = None; ch.x_axis.number_format = 'MMM YY'; ch.y_axis.title = 'People'
ws.add_chart(ch, 'E7')
print_setup(ws)

for w in wb.worksheets: w.sheet_properties.tabColor = ORANGE if w.title == 'Overview' else (SLATE if w.title in ('Store Setup', 'Callide Weekly Crew') else CHAR)
wb.active = 0
wb.save('Tarong_Scaling_from_Callide.xlsx'); print('ok')
