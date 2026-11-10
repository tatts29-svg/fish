import pandas as pd, numpy as np
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.utils import get_column_letter as L
from openpyxl.worksheet.table import Table, TableStyleInfo
o=pd.read_pickle('out.pkl'); meta=pd.read_pickle('meta.pkl')
con,T,units,weekly=o['con'],o['T'],o['units'],o['weekly']
OR='F26222'; DK='1F1F1F'
H=Font(bold=True,color='FFFFFF'); HF=PatternFill('solid',fgColor=OR)
IN=PatternFill('solid',fgColor='FFF2CC'); thin=Side(style='thin',color='BFBFBF')
fmt=lambda d:d.strftime('%d %b %Y')
wb=Workbook(); S=wb.active; S.title='Summary'
def title(ws,t,sub):
    ws['A1']=t; ws['A1'].font=Font(bold=True,size=16,color=OR)
    ws['A2']=sub; ws['A2'].font=Font(italic=True,color='595959')
title(S,'Tarong Power Station - Tooling & Consumables Scaling from Callide','POWERED BY SITEIQ  |  Author: Andrew Fisher  |  Source: UGL Callide Power Station Project SiteIQ exports pulled 11 Nov 2026  |  Quantities only - no pricing')
S.column_dimensions['A'].width=46; S.column_dimensions['B'].width=16; S.column_dimensions['C'].width=90
r=4
S.cell(r,1,'INPUTS (yellow cells can be changed - every sheet updates)').font=Font(bold=True,color=OR); r+=1
inputs=[('Tarong white collar',30,'From NextCooling email','TAR_WC'),
        ('Tarong blue collar',150,'From NextCooling email','TAR_BC'),
        ('Tarong total crew','=B5+B6','Calculated','TAR_TOTAL'),
        ('Callide crew baseline',o['CALLIDE_CREW'],f"Median people active per week, {fmt(o['W0'])} to {fmt(o['W1'])} (bought a consumable or hired a tool). Overwrite if you know the real Callide headcount.",'CAL_CREW'),
        ('Scaling factor','=ROUND(B7/B8,3)','Tarong crew / Callide crew','FACTOR'),
        ('Tarong duration (weeks)',None,'TBC - waiting on NextCooling. Leave blank and totals show TBC.','TAR_WEEKS')]
for lab,val,note,name in inputs:
    S.cell(r,1,lab); c=S.cell(r,2,val); S.cell(r,3,note).alignment=Alignment(wrap_text=True)
    if not (isinstance(val,str) and val.startswith('=')): c.fill=IN
    c.font=Font(bold=True); wb.defined_names[name]=DefinedName(name,attr_text=f"Summary!$B${r}"); r+=1
r+=1
nb=(con.Note.str.contains('Bulk')).sum()
plant=T.Note.str.contains('Plant').sum();
used=(T.peak>0).sum()
facts=[('WHAT CALLIDE LOOKED LIKE',None),
 ('Job length',f"{fmt(o['span'][0])} to {fmt(o['span'][1])} - about 12 months. This was a long project, not a short shutdown, so everything is worked as a weekly rate."),
 ('Steady-state window used',f"{fmt(o['W0'])} to {fmt(o['W1'])} ({o['WEEKS']:.0f} weeks) - crew sat at about {int(o['crew'].min())} to {int(o['crew'].max())} people a week."),
 ('Consumable lines issued',f"{len(con):,} SKUs ({int((con['Issued in steady window']>0).sum()):,} used in the steady window)."),
 ('Tool / equipment lines',f"{len(T):,} descriptions ({used:,} hired during the steady window)."),
 ('',None),('HOW THE NUMBERS WORK',None),
 ('Consumables',"Callide qty issued in the steady window / weeks = Callide per week. x Scaling factor = Tarong per week. x Tarong weeks = Tarong total. Opening stock = 2 weeks of Tarong use."),
 ('All gear is Coates',"Gear that SiteIQ listed as UGL owned at Callide is counted as Coates gear here, and its 'UGL own' / crew labels are stripped so like items sit on one line."),
 ('Tooling',"Basis = the most of that item out at once during the steady window (from billing). Where there is no billing record, the bigger of the store fleet on the 23 Aug 2024 rental stock or the Nov 2026 stocktake is used. Tarong suggested = Basis x Scaling factor, rounded up."),
 ('White v blue collar',"Callide data doesn't split office and field users, so one factor covers both. Stationery/office lines are grouped so you can adjust them for the 30 white collar if needed."),
 ('',None),('CHECK BEFORE SENDING',None),
 ('Bulk project buys',f"{nb} consumable lines look like one-off project materials (screws, shims, timber, posts). Flagged in the Note column - include only if Tarong scope needs them."),
 ('Plant & mobile equipment',f"{plant} lines (forklifts, EWPs, telehandlers, lighting towers etc.) - size these from the Tarong scope, not headcount."),
 ('Gear that left early',f"{o['GONE_EARLY']:,} items on the stocktake had already left site before 28 Jul 2024 (e.g. a set of ~130 Milwaukee 6.0AH batteries sent away 08 May 2024 and replaced). They're left out of the fleet count so they aren't counted twice."),
 ('Missing data',"Billing period 1 (before 08 Sep 2023) and period 13 (Aug 2024 demob) weren't supplied - neither falls in the steady window, so the numbers aren't affected."),
 ('Duplicate files',f"{(~meta.USED).sum()} billing files were exact copies of others - ignored. See the Data check tab."),
]
for a,b in facts:
    if b is None and a: S.cell(r,1,a).font=Font(bold=True,color=OR)
    else:
        S.cell(r,1,a).font=Font(bold=True); c=S.cell(r,2,b); S.merge_cells(start_row=r,start_column=2,end_row=r,end_column=3); c.alignment=Alignment(wrap_text=True,vertical='top')
        S.row_dimensions[r].height=32 if b and len(b)>100 else 18
    r+=1
r+=1
S.cell(r,1,'CONSUMABLES BY GROUP').font=Font(bold=True,color=OR); r+=1
hdr=['Group','SKUs','Callide per week','Tarong per week']
for i,h in enumerate(hdr):
    c=S.cell(r,1+i if i<2 else 1+i,h)
S.cell(r,1,'Group');S.cell(r,2,'SKUs');S.cell(r,3,'Tarong per week (all lines in group)')
for i in (1,2,3): S.cell(r,i).font=H; S.cell(r,i).fill=HF
r+=1; g0=r
for gname in sorted(con.Group.unique()):
    S.cell(r,1,gname); S.cell(r,2,f'=COUNTIF(Consumables!$A:$A,A{r})'); S.cell(r,3,f'=ROUND(SUMIF(Consumables!$A:$A,A{r},Consumables!$J:$J),0)'); r+=1
S.freeze_panes='A4'

def sheet(name,df,cols,widths,formulas,first_note):
    ws=wb.create_sheet(name)
    ws.append(cols)
    for i,c in enumerate(ws[1]): c.font=H; c.fill=HF; c.alignment=Alignment(wrap_text=True,vertical='center')
    ws.row_dimensions[1].height=45
    for k,row in enumerate(df.itertuples(index=False),start=2):
        vals=list(row)
        for j,f in formulas.items(): vals.insert(j,f.format(r=k))
        ws.append(vals)
    for i,w in enumerate(widths,1): ws.column_dimensions[L(i)].width=w
    ws.freeze_panes='D2'; ws.auto_filter.ref=f"A1:{L(len(cols))}{len(df)+1}"
    return ws
# Consumables
C=con.copy()
C['First issued']=C['First issued'].dt.date; C['Last issued']=C['Last issued'].dt.date
cdf=C[['Group','SKU','Description','Total issued (whole job)','People issued to','First issued','Last issued','Issued in steady window','Callide per week','Note']]
cols=['Group','SKU','Description','Callide total issued (whole job)','People issued to','First issued','Last issued','Callide issued in steady window','Callide per week','Tarong per week','Tarong opening stock (2 weeks)','Tarong total for job','Note']
ws=sheet('Consumables',cdf,cols,[22,22,55,13,11,12,12,13,11,11,12,12,60],
  {9:'=ROUND(I{r}*FACTOR,1)',10:'=IF(I{r}=0,0,MAX(1,ROUNDUP(I{r}*FACTOR*2,0)))',11:'=IF(TAR_WEEKS="","TBC",ROUNDUP(I{r}*FACTOR*TAR_WEEKS,0))'},None)
for row in ws.iter_rows(min_row=2,min_col=6,max_col=7):
    for c in row: c.number_format='DD MMM YYYY'
for row in ws.iter_rows(min_row=2,min_col=13,max_col=13):
    for c in row:
        if c.value: c.font=Font(color='C00000')
# Tooling
TT=T.copy()
TT['Basis used']=np.where(TT.peak>0,'Most out at once','Fleet on record')
tdf=TT[['FAM','PROD','DESC','fleet','rs_fleet','rs_out','items_hired','hires','peak','avg','Basis used','basis','Note']]
cols=['Family','Product','Description','Callide fleet on stocktake (Nov 2026, still on site after 28 Jul 2024)','Store fleet 23 Aug 2024','On hire 23 Aug 2024','Different items hired (whole job)','Times hired (whole job)',f"Most out at once ({fmt(o['W0'])} - {fmt(o['W1'])})",'Average out per day (same window)','Basis used','Basis qty','Tarong suggested qty','Note']
ws=sheet('Tooling',tdf,cols,[26,26,55,11,11,11,11,10,13,11,15,9,12,60],{12:'=IF(L{r}=0,0,ROUNDUP(L{r}*FACTOR,0))'},None)
for row in ws.iter_rows(min_row=2,min_col=14,max_col=14):
    for c in row:
        if c.value: c.font=Font(color='C00000')
# Store setup
ws=wb.create_sheet('Store setup')
ws.append(['Storage unit at Callide','Lines on stocktake','Tool lines','Consumable lines','Tarong - keep / drop / resize'])
for c in ws[1]: c.font=H; c.fill=HF
for x in units.itertuples(index=False): ws.append(list(x)+[''])
for i,w in enumerate([34,14,12,16,40],1): ws.column_dimensions[L(i)].width=w
ws.cell(ws.max_row+2,1,'Containers and store set-up are fixed items - size these to the Tarong store layout, not crew numbers. Column E is for your call.').font=Font(italic=True)
# Crew curve
ws=wb.create_sheet('Callide crew curve')
ws.append(['Week starting','People active (bought or hired)'])
for c in ws[1]: c.font=H; c.fill=HF
for x in weekly.itertuples(index=False): ws.append([x[0].date(),int(x[1])])
for row in ws.iter_rows(min_row=2,max_col=1):
    for c in row: c.number_format='DD MMM YYYY'
ws.column_dimensions['A'].width=16; ws.column_dimensions['B'].width=30
from openpyxl.chart import LineChart, Reference
ch=LineChart(); ch.title='Callide - people active per week'; ch.height=8; ch.width=22; ch.legend=None
ch.add_data(Reference(ws,min_col=2,min_row=1,max_row=ws.max_row),titles_from_data=True)
ch.set_categories(Reference(ws,min_col=1,min_row=2,max_row=ws.max_row)); ch.series[0].graphicalProperties.line.solidFill=OR
ws.add_chart(ch,'D2')
# Data check
ws=wb.create_sheet('Data check')
ws.append(['Billing period','Dates','File','Rows','Used?'])
for c in ws[1]: c.font=H; c.fill=HF
for x in meta.sort_values(['P','FILE']).itertuples(index=False): ws.append([x.P,x.PERIOD,x.FILE,x.ROWS,'Used' if x.USED else 'Duplicate - ignored'])
ws.append([]); ws.append(['Also used','SALES_STOCK 11 Nov 2026 (consumable issues, Sep 2023 - Sep 2024)']); ws.append(['Also used','RENTAL_STOCK 23 Aug 2024 (store fleet and on hire near end of job)']); ws.append(['Also used','STOCKTAKE 11 Nov 2026 (fleet on record and storage units)'])
ws.append(['Not used','All pricing, rates and charges - quantities only'])
for i,w in enumerate([14,44,52,10,22],1): ws.column_dimensions[L(i)].width=w
wb.save('Tarong_Scaling_from_Callide.xlsx'); print('ok')
