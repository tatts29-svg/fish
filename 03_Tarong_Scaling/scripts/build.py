import pandas as pd, numpy as np
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.utils import get_column_letter as L
from openpyxl.chart import LineChart, Reference
o=pd.read_pickle('out.pkl'); st_=o['stats']
con,T,units,weekly=o['con'],o['T'],o['units'],o['weekly']
OR='F26222'
H=Font(bold=True,color='FFFFFF'); HF=PatternFill('solid',fgColor=OR)
IN=PatternFill('solid',fgColor='FFF2CC'); SEC=Font(bold=True,size=12,color=OR); B=Font(bold=True)
WR=Alignment(wrap_text=True,vertical='top')
fmt=lambda d:d.strftime('%d %b %Y')
wb=Workbook(); S=wb.active; S.title='Summary'
for c,w in zip('ABCD',[44,18,18,70]): S.column_dimensions[c].width=w
S['A1']='Tarong Power Station - Tool Store Recommendation'; S['A1'].font=Font(bold=True,size=16,color=OR)
S['A2']='Based on the Coates tool store at the Callide Power Station Project  |  Prepared for NextCooling  |  Author: Andrew Fisher, Coates  |  POWERED BY SITEIQ'
S['A2'].font=Font(italic=True,color='595959')
r=4
def sec(t):
    global r; r+=1; S.cell(r,1,t).font=SEC; r+=1
def line(a,b,note=''):
    global r; S.cell(r,1,a).font=B; c=S.cell(r,2,b); c.alignment=Alignment(horizontal='left')
    if note: S.cell(r,4,note).alignment=WR
    r+=1
sec('1. THE CALLIDE PROJECT - WHAT THE STORE DID')
span=o['span']; wks=round((span[1]-span[0]).days/7)
line('Project duration',f"{fmt(span[0])} to {fmt(span[1])}",f"About {wks} weeks of continuous store operation")
line('People served by the store',f"{st_['people']:,}",'Different people who drew a tool or consumable over the project')
line('Busiest week',f"{st_['peak_week']:,} people")
line('Typical week (steady state)',f"{o['CALLIDE_CREW']:,} people",f"Median people served each week, {fmt(o['W0'])} to {fmt(o['W1'])}")
line('Consumable issues',f"{st_['issues']:,}",f"{st_['cons_lines']:,} different consumable lines issued")
line('Tool issues',f"{st_['tool_hires']:,}",f"{st_['tools_hired']:,} individual tools issued across {st_['tool_lines']:,} tool lines")
line('Tools in use at once',f"{st_['avg_tools']:,} average / {st_['peak_tools']:,} peak",f"Daily count, {fmt(o['W0'])} to {fmt(o['W1'])}")
line('Store fleet held on site',f"{st_['store_items']:,} items")
line('Store set-up',f"{st_['containers']} containers / areas",'See the Store setup tab')
sec('2. TARONG REQUEST')
S.cell(r,4,'Yellow cells can be changed - every tab updates automatically').font=Font(italic=True,color='595959')
inputs=[('White collar',30,'As requested by NextCooling','TAR_WC'),
        ('Blue collar',150,'As requested by NextCooling','TAR_BC'),
        ('Tarong total crew',f'=B{r+0}+B{r+1}','','TAR_TOTAL'),
        ('Callide typical crew',o['CALLIDE_CREW'],'From the Callide store records (section 1)','CAL_CREW'),
        ('Scaling factor',None,'Tarong crew / Callide crew','FACTOR'),
        ('Tarong duration (weeks)',None,'Enter once confirmed - job totals show TBC until then','TAR_WEEKS')]
for lab,val,note,name in inputs:
    if name=='FACTOR': val=f'=ROUND(B{r-2}/B{r-1},3)'
    S.cell(r,1,lab).font=B; c=S.cell(r,2,val); c.font=B; c.alignment=Alignment(horizontal='left')
    if not (isinstance(val,str) and val.startswith('=')): c.fill=IN
    S.cell(r,4,note)
    wb.defined_names[name]=DefinedName(name,attr_text=f"Summary!$B${r}"); r+=1
sec('3. HOW THE TARONG NUMBERS ARE WORKED OUT')
for a,b in [('Tools',"The most of each tool in use at once at Callide (or the store fleet where daily use wasn't recorded) x the scaling factor, rounded up."),
            ('Consumables',"Callide weekly use x the scaling factor = Tarong weekly use. Opening stock = 2 weeks. Job total = weekly use x Tarong weeks."),
            ('Plant & mobile equipment',"Forklifts, EWPs, telehandlers and lighting towers are shown for reference - size these to the Tarong scope of work."),
            ('One-off purchases',"Bulk project materials bought once at Callide (screws, shims, timber) are marked - include them only if the Tarong scope needs them.")]:
    S.cell(r,1,a).font=B; c=S.cell(r,2,b); S.merge_cells(start_row=r,start_column=2,end_row=r,end_column=4); c.alignment=WR; S.row_dimensions[r].height=30; r+=1
sec('4. KEY ITEMS - CALLIDE v TARONG')
for i,h in enumerate(['Item','Callide','Tarong recommended','Basis'],1):
    c=S.cell(r,i,h); c.font=H; c.fill=HF
r+=1
plant=T.Note.str.contains('Plant')
top=T[~plant].sort_values('basis',ascending=False).head(20)
for x in top.itertuples():
    S.cell(r,1,x.DESC); S.cell(r,2,int(x.basis)); S.cell(r,3,f'=ROUNDUP(B{r}*FACTOR,0)')
    S.cell(r,4,'Most in use at once' if x.peak>0 else 'Callide store fleet'); r+=1
r+=1
for i,h in enumerate(['Consumable','Callide per week','Tarong per week','Group'],1):
    c=S.cell(r,i,h); c.font=H; c.fill=HF
r+=1
for _,x in con[~con.Note.str.contains('One-off')].sort_values('Callide per week',ascending=False).head(15).iterrows():
    S.cell(r,1,x['Description']); S.cell(r,2,round(x['Callide per week'],1)); S.cell(r,3,f'=ROUND(B{r}*FACTOR,0)'); S.cell(r,4,x['Group']); r+=1
r+=1
sec('5. CONSUMABLES BY GROUP - TARONG PER WEEK')
for i,h in enumerate(['Group','Lines','Tarong per week (units)'],1):
    c=S.cell(r,i,h); c.font=H; c.fill=HF
r+=1
for g in sorted(con.Group.unique()):
    S.cell(r,1,g); S.cell(r,2,f'=COUNTIF(Consumables!$A:$A,A{r})'); S.cell(r,3,f'=ROUND(SUMIF(Consumables!$A:$A,A{r},Consumables!$G:$G),0)'); r+=1
r+=1
S.cell(r,1,f"Source: Coates SiteIQ store records, Callide Power Station Project, {fmt(span[0])} to {fmt(span[1])}. Quantities only.").font=Font(italic=True,color='595959')

def sheet(name,df,cols,widths,formulas,datecols=(),notecol=None):
    ws=wb.create_sheet(name); ws.append(cols)
    for c in ws[1]: c.font=H; c.fill=HF; c.alignment=Alignment(wrap_text=True,vertical='center')
    ws.row_dimensions[1].height=45
    for k,row in enumerate(df.itertuples(index=False),start=2):
        vals=list(row)
        for j,f in sorted(formulas.items()): vals.insert(j,f.format(r=k))
        ws.append(vals)
    for i,w in enumerate(widths,1): ws.column_dimensions[L(i)].width=w
    ws.freeze_panes='D2'; ws.auto_filter.ref=f"A1:{L(len(cols))}{len(df)+1}"
    for col in datecols:
        for row in ws.iter_rows(min_row=2,min_col=col,max_col=col):
            for c in row: c.number_format='DD MMM YYYY'
    if notecol:
        for row in ws.iter_rows(min_row=2,min_col=notecol,max_col=notecol):
            for c in row:
                if c.value: c.font=Font(color='C00000')
    return ws
# Tooling
TT=T.copy(); TT['Basis used']=np.where(TT.peak>0,'Most in use at once','Callide store fleet')
tdf=TT[['FAM','PROD','DESC','store_fleet','items_hired','hires','peak','avg','Basis used','basis','Note']]
cols=['Family','Product','Description','Callide store fleet','Individual tools issued','Times issued','Most in use at once','Average in use per day','Basis used','Basis qty','Tarong recommended qty','Note']
sheet('Tools & Equipment',tdf,cols,[26,26,55,11,11,10,11,11,17,9,12,55],{10:'=IF(J{r}=0,0,ROUNDUP(J{r}*FACTOR,0))'},notecol=12)
# Consumables
C=con.copy(); C['First issued']=C['First issued'].dt.date; C['Last issued']=C['Last issued'].dt.date
cdf=C[['Group','Description','Total issued (whole job)','First issued','Last issued','Callide per week','Note']]
cols=['Group','Description','Callide total issued','First issued','Last issued','Callide per week','Tarong per week','Tarong opening stock (2 weeks)','Tarong total for job','Note']
sheet('Consumables',cdf,cols,[22,55,12,12,12,11,11,12,12,55],
  {6:'=ROUND(F{r}*FACTOR,1)',7:'=IF(F{r}=0,0,MAX(1,ROUNDUP(F{r}*FACTOR*2,0)))',8:'=IF(TAR_WEEKS="","TBC",ROUNDUP(F{r}*FACTOR*TAR_WEEKS,0))'},datecols=(4,5),notecol=10)
# Store setup
ws=wb.create_sheet('Store setup')
ws.append(['Container / area at Callide','Lines held','Tool lines','Consumable lines'])
for c in ws[1]: c.font=H; c.fill=HF
for x in units.itertuples(index=False): ws.append(list(x))
for i,w in enumerate([30,12,12,16],1): ws.column_dimensions[L(i)].width=w
ws.cell(ws.max_row+2,1,'Store set-up is sized to the site layout rather than crew numbers.').font=Font(italic=True)
# Crew curve
ws=wb.create_sheet('Callide weekly crew')
ws.append(['Week starting','People served by the store'])
for c in ws[1]: c.font=H; c.fill=HF
for x in weekly.itertuples(index=False): ws.append([x[0].date(),int(x[1])])
for row in ws.iter_rows(min_row=2,max_col=1):
    for c in row: c.number_format='DD MMM YYYY'
ws.column_dimensions['A'].width=16; ws.column_dimensions['B'].width=28
ch=LineChart(); ch.title='Callide - people served by the store each week'; ch.height=8; ch.width=22; ch.legend=None
ch.add_data(Reference(ws,min_col=2,min_row=1,max_row=ws.max_row),titles_from_data=True)
ch.set_categories(Reference(ws,min_col=1,min_row=2,max_row=ws.max_row)); ch.series[0].graphicalProperties.line.solidFill=OR
ws.add_chart(ch,'D2')
wb.save('Tarong_Scaling_from_Callide.xlsx'); print('ok')
