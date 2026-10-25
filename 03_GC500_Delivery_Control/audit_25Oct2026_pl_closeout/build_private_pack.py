"""Author: Andrew Fisher. Build the private audit workbook and review PDFs from a read-only capture.

Usage: python build_private_pack.py PRIVATE_DIR
The private directory needs models.json, review-workbook.json, validation.json and conclusions.json.
Generated figures and operational details must remain outside the repository.
"""
import collections, json, math, sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from xml.sax.saxutils import escape
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, A3, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

fontroot=Path('/usr/share/fonts/truetype/dejavu')
pdfmetrics.registerFont(TTFont('AuditSans',str(fontroot/'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('AuditSans-Bold',str(fontroot/'DejaVuSans-Bold.ttf')))

p=Path(sys.argv[1]).resolve(); assert not p.is_relative_to(Path(__file__).resolve().parents[2])
capture=json.loads((p/'models.json').read_text()); m=capture['models']; P=m['pnl']; X=m['closeout']; C=m['money']['charge']
review=json.loads((p/'review-workbook.json').read_text()); validations=json.loads((p/'validation.json').read_text()); conclusions=json.loads((p/'conclusions.json').read_text())
D=lambda x: Decimal(str(x or 0)); r2=lambda x: D(x).quantize(Decimal('.01'),rounding=ROUND_HALF_UP)
sum2=lambda xs:r2(sum((D(x) for x in xs),Decimal(0)))
money=lambda x:f'${D(x):,.2f}'
orange='EE5A24'; dark='202830'; grey='F0F3F5'; white='FFFFFF'
wb=Workbook();wb.remove(wb.active)
def sheet(name,headers,rows,widths=None):
    ws=wb.create_sheet(name[:31]);ws.append(['Author: Andrew Fisher']);ws.append(headers)
    for row in rows:ws.append([float(x) if isinstance(x,Decimal) else x if isinstance(x,(int,float,str,bool)) or x is None else json.dumps(x,ensure_ascii=False) for x in row])
    ws.freeze_panes='A3';ws.auto_filter.ref=f'A2:{get_column_letter(len(headers))}{ws.max_row}'
    for c in ws[2]:c.fill=PatternFill('solid',fgColor=dark);c.font=Font(color=white,bold=True)
    for row in ws.iter_rows(min_row=3):
        for c in row:
            c.alignment=Alignment(vertical='top',wrap_text=True)
            if c.row%2:c.fill=PatternFill('solid',fgColor=grey)
            if isinstance(c.value,float):c.number_format='#,##0.00;[Red](#,##0.00)'
    for i,h in enumerate(headers,1):ws.column_dimensions[get_column_letter(i)].width=(widths or {}).get(i,24 if i<4 else 45)
    ws.sheet_properties.pageSetUpPr.fitToPage=True;ws.page_setup.orientation='landscape';ws.page_setup.paperSize=ws.PAPERSIZE_A3
    ws.page_setup.fitToWidth=1;ws.page_setup.fitToHeight=0;ws.print_title_rows='1:2'
    ws.oddFooter.center.text='Author: Andrew Fisher | GC500 | &P of &N'
    return ws

fence_demob=D(X['fencing']['revenue']);headline=r2(D(P['revJob'])-fence_demob)
revenue=[]
for r in P['rev']:
    removed=fence_demob if r['key']=='rehire' else D(0)
    revenue.append([r['line'],r['code'],r['job'],removed,r2(D(r['job'])-removed),r['basis']])
sheet('V8 charges',['Revenue line','Ledger code','Whole job','Fencing demob excluded','Charge excluding fencing demob','Basis'],revenue+[['TOTAL','',P['revJob'],fence_demob,headline,'Current page calculation; open commercial decisions listed separately']])
sheet('Close-off decisions',['Topic','Status','Evidence / interpretation','Needed to close'],conclusions,{1:31,2:29,3:90,4:90})
ledger=[]
for category in ['rev','cost']:
    for row in P[category]:ledger.append([category,row['line'],row['code'],row['now'],row['job'],row['basis'],row.get('missing','')])
ledger += [['overhead','Travel, accommodation, meals and printing','3520 / expense-specific',P['over'],P['overJob'],'Recorded nights and expenses plus known accommodation forecast; final ledger subcodes need Finance',''],['overhead','Labour hire and salary allowance','Finance allocation pending',P['wages']['toDate'],P['wages']['job'],'Priced hired-in shifts plus the recorded allowance; Coates hours remain unpriced','']]
sheet('P&L ledger',['Section','Line','Code','Recorded','Whole job','Composition / source','Open item'],ledger)
sheet('Cent checks',['Check','Passed','Actual','Expected','Difference'],[[x['check'],x['pass'],x['actual'],x['expected'],x['difference']] for x in validations['checks']])
sheet('Branch totals',['Branch','Current Revenue','Job Revenue','Job costs incl overheads/wages','Job difference','Comparison-workbook job Revenue'],[[b['code'],b['revenue'],b['revenueJob'],b['costJob'],b['contributionJob'],next(r[2] for r in review['Branch tie-out'][1:] if r[0]==b['code'])] for b in m['branchFinancial']['rows']])
sheet('Baseplan fixes to review',review['Fix list'][0]+['Audit boundary'],[r+['Shared comparison finding; original export not available for independent source certification'] for r in review['Fix list'][1:] if str(r[0])!='9990776'])
sheet('Baseplan every line',review['Every line'][0],[r for r in review['Every line'][1:] if str(r[0])!='9990776'])
sheet('Contract calculation',['Contract','Line','Description','Quantity','Rate 1','Calculated charge','Revenue branch','Owner','Rehire','Calculation basis'],[[r.get('rental_contract'),r.get('line'),r.get('description'),r.get('quantity'),r.get('rate_1'),(r.get('computed_charge') or {}).get('amount'),r.get('computed_branch'),(r.get('computed_owner') or {}).get('owner'),(r.get('computed_owner') or {}).get('rehire'),(r.get('computed_charge') or {}).get('basis')] for r in m['contractRows'] if str(r.get('rental_contract'))!='9990776'])
qrows=[]
for q in m['supplierService']['quotes']:
    code='3325' if q['quote']=='Q6844' else '2144' if q['quote']=='Q6846' else '2126'
    for g in q['groups']:
        for line in g['lines']:qrows.append([q['quote'],code,line['description'],line.get('qty'),line.get('unit_price'),line.get('total_price'),'Current site-count projection; original quote quantities retained in source'])
    for key in ['delivery_charge','pickup']:
        if q.get(key) is not None:qrows.append([q['quote'],code,key,1,q[key],q[key],'Bundled with quote main category under current page rule'])
sheet('Supplier cost lines',['Quote','Current code','Line','Quantity','Rate','Amount','Basis'],qrows)
sheet('Rehire Revenue sources',['Group','Branch','Current Revenue','Job Revenue','Known cost','Job cost'],[[g.get(k) for k in ['what','branch','rev','revJob','cost','costJob']] for g in m['rehire']['groups'] if not g['what'].startswith('Fencing')])
pay=[]
for r in m['financeRows']:
    hours_only=r['type'] in ['cna','salary'];cost=r['actualCost'] if r['status']=='confirmed' and r['actualCost'] is not None else r['calculatedCost']
    period='to date' if r['date'] and r['date']<=P['asAt'] and r['status']!='forecast' else 'to come'
    pay.append([r['person'],r['date'],r['type'],r['paid'],None if hours_only else cost,period,r['status'],'Hours only; excluded from dollars' if hours_only else r['rateBasis']])
sheet('Labour lines',['Person','Date','Type','Paid hours','Amount included','Period','Status','Basis'],pay)
pg=collections.defaultdict(lambda:[D(0),D(0),D(0)])
for person,date,kind,hours,cost,period,status,basis in pay:
    pg[(person,kind)][2]+=D(hours)
    if cost is not None:pg[(person,kind)][0 if period=='to date' else 1]+=D(cost)
sheet('Labour summary',['Person / allowance','Type','To date','To come','Whole job','Hours'],[[person,kind,r2(v[0]),r2(v[1]),r2(v[0]+v[1]),r2(v[2])] for (person,kind),v in pg.items()]+[['Recorded salary allowance','forecast',0,m['labourAllowance'],m['labourAllowance'],None]])
sheet('Overhead lines',['Kind','Person / type','Date','Amount','Source','Status'],[[r.get('kind'),r.get('person') or r.get('type'),r.get('date'),r.get('amount'),r.get('_where'),'Unpriced' if r.get('amount') is None else 'Recorded'] for r in m['ourCosts'] if r.get('kind') in ['accommodation','meals','misc']])
sheet('Job cost bridge',['Stream','Branch','Recorded','To come','Job','Basis','Open item'],[[r.get(k) for k in ['stream','branch','toDate','toCome','job','basis','note']] for r in X['rows']])
sheet('Service Revenue',['Card line','Description','Quantity','Rate','Amount'],[[r.get(k) for k in ['card_line','description','qty','rate','amount']] for r in m['service']['lines']])
sheet('Event Revenue',['Role','Hours','Rate','Amount','Invoice category'],[[r.get(k) for k in ['role','hours','rate','amount','invoicing']] for r in m['eventScope']['lines']]+[['Accommodation and travel',None,None,m['eventScope']['at'],'Allocation pending; KINP']])
sheet('Transport Revenue',['Ref','Item','Leg','Quantity','Rate','Included charge','Remaining','Source'],[[r.get('ref'),r.get('item'),r.get('leg'),r.get('quantity'),r.get('rate'),r.get('actualAdditional1006'),r.get('remainingAdditional1006'),r.get('rateSource')] for r in m['buildingTransport']['rows']])
t=m['transportPlan'];movements=t['rows']+t['planned']
sheet('Transport costs',['ID','Reference','Task','Date','Leg','Item','Qty','Recorded cost','Forecast allowance','Basis','Reason'],[[r.get('id'),r.get('key'),r.get('task'),r.get('date'),r.get('leg'),r.get('item'),r.get('qty'),r.get('actual'),r['forecast'].get('amount'),r['forecast'].get('kind'),r['forecast'].get('reason928') or r['forecast'].get('reason953')] for r in movements])
held=[r for r in movements if r['forecast'].get('kind') in ['held','nonload']]
gaps=[]
for i,r in enumerate(held,1):
    loc=r.get('location') or '; '.join((r.get('a') or {}).get('locations',[])) or 'Not recorded'
    reason=r['forecast'].get('reason928') or r['forecast'].get('reason953') or 'Separate travel cost / equipment basis not established'
    gaps.append([i,r.get('key') or 'Unassigned',r.get('task'),r.get('date'),r.get('leg'),r.get('item'),r.get('qty'),loc,'','',reason,'','',''])
sheet('Transport fill-in',['No','Ref','Task','Date','Leg','Item','Qty','Recorded location hint','From (confirm)','To (confirm)','Missing / needs confirmation','Cost ex GST','Quote / invoice / coverage','Confirmed by / date'],gaps)
sheet('Read me',['Item','Value'],[['Author','Andrew Fisher'],['Captured at',capture['at']],['Page','v12.18'],['Page SHA-256',json.loads((p/'live-receipt.json').read_text())['sha256']],['Revenue scope','Whole job including non-fencing demob; fencing demob excluded from headline'],['Assurance','Independent arithmetic checks; original Baseplan and invoices not certified'],['Classification','Decision items remain open; no record edits or page release'],['Source','Shared source 1a8ea606bf339e35810781afc3b71f22315c23ba; read-only live model capture']])
wb.save(p/'GC500_Private_PL_Audit_25Oct2026.xlsx')

styles=getSampleStyleSheet()
for style in styles.byName.values():style.fontName='AuditSans-Bold' if style.name.startswith(('Heading','Title')) else 'AuditSans'
styles.add(ParagraphStyle(name='SmallAudit',fontName='AuditSans',fontSize=8,leading=10,textColor=colors.HexColor('#33414D')))
styles.add(ParagraphStyle(name='TitleAudit',fontName='AuditSans-Bold',fontSize=22,leading=25,textColor=colors.HexColor('#202830')))
def para(v,style='SmallAudit'):return Paragraph(escape(str(v or '')).replace('\n','<br/>'),styles[style])
def table(rows,widths):
    t=Table([[para(v) for v in row] for row in rows],colWidths=widths,repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#E5E9EC')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#F4F6F7')]),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LINEBELOW',(0,0),(-1,0),1,colors.HexColor('#EE5A24'))]))
    return t
def footer(c,doc):
    c.setStrokeColor(colors.HexColor('#EE5A24'));c.line(36,32,doc.pagesize[0]-36,32);c.setFont('AuditSans',8);c.setFillColor(colors.HexColor('#53616D'))
    c.drawString(36,20,'Author: Andrew Fisher | GC500 | Private financial review');c.drawRightString(doc.pagesize[0]-36,20,str(doc.page))
doc=SimpleDocTemplate(str(p/'GC500_V8_Charges_25Oct2026.pdf'),pagesize=A4,rightMargin=36,leftMargin=36,topMargin=30,bottomMargin=40)
story=[para('COATES / GC500','Heading2'),para('V8 charges','TitleAudit'),Spacer(1,8),para('Whole job, including non-fencing demob. Fencing demob excluded.'),Spacer(1,14),para(money(headline)+' ex GST','TitleAudit'),Spacer(1,15)]
story.append(table([['Revenue category','Ledger','Charge ex GST']]+[[r[0],r[1],money(r[4])] for r in revenue if r[4]]+[['TOTAL EXCLUDING FENCING DEMOB','',money(headline)]],[310,62,151]))
story += [Spacer(1,15),table([['Reconciliation','Ex GST'],['Whole-job page Revenue',money(P['revJob'])],['Less fencing demob allowance',money(fence_demob)],['Current charge excluding fencing demob',money(headline)]],[372,151]),Spacer(1,12),para('v12.18 snapshot, not the revised invoice figure. The v12.19 fencing quantity update is in progress; refresh this total after that release. Customer amount/classification decisions and the original Baseplan reconciliation remain listed in the accompanying audit workbook.'),Spacer(1,8),para('Source: verified v12.18 and read-only model capture '+capture['at']+'. Supplier Direct costs are separate from this customer charge.')]
doc.build(story,onFirstPage=footer,onLaterPages=footer)
doc=SimpleDocTemplate(str(p/'GC500_PL_Closeoff_25Oct2026.pdf'),pagesize=A4,rightMargin=36,leftMargin=36,topMargin=30,bottomMargin=40)
story=[para('COATES / GC500','Heading2'),para('P&L close-off review','TitleAudit'),Spacer(1,10),para(f"{validations['passed']}/{validations['total']} arithmetic checks passed. No new confirmed calculation defect found in the reviewed scope. This is not final cost or invoice certification."),Spacer(1,10)]
for topic,status,evidence,needed in conclusions:
    story += [para(topic,'Heading3'),para(status,'Heading4'),para(evidence),Spacer(1,4),para('To close: '+needed),Spacer(1,6)]
doc.build(story,onFirstPage=footer,onLaterPages=footer)

# One A3 landscape page: all unresolved movements once, including demob as a subset.
size=landscape(A3);cv=canvas.Canvas(str(p/'GC500_Transport_Cost_Fillin_25Oct2026.pdf'),pagesize=size);W,H=size
cv.setFillColor(colors.HexColor('#202830'));cv.rect(0,H-75,W,75,fill=1,stroke=0);cv.setFillColor(colors.white);cv.setFont('AuditSans-Bold',22);cv.drawString(28,H-32,'GC500 / TRANSPORT COST CLOSE-OFF')
cv.setFont('AuditSans',10);cv.drawString(28,H-54,'Confirm route, supplier coverage and cost ex GST. No movement is assumed free. Author: Andrew Fisher')
cv.setFillColor(colors.HexColor('#EE5A24'));cv.setFont('AuditSans-Bold',10);cv.drawString(28,H-94,'Demob rows are included once in this list. Full source details and blank fields are in the workbook.')
small=ParagraphStyle('fill',fontName='AuditSans',fontSize=7,leading=8.4)
def cell(text,x,y,w,h):
    pp=Paragraph(escape(str(text or '')).replace('\n','<br/>'),small);pw,ph=pp.wrap(w-6,h-4)
    assert ph<=h-4, 'fill-in text exceeds cell; increase row height'
    pp.drawOn(cv,x+3,y-h+4+(h-4-ph))
half=math.ceil(len(gaps)/2);margin=28;gap=18;block=(W-2*margin-gap)/2;rowh=30;top=H-110
widths=[22,75,85,40,95,block-317]
for col in range(2):
    x0=margin+col*(block+gap);ys=top
    cv.setFillColor(colors.HexColor('#E5E9EC'));cv.rect(x0,ys-22,block,22,fill=1,stroke=0)
    xx=x0
    for text,w in zip(['No','Ref / task / date','Item / qty / leg','Issue','From > To (fill in)','Cost / evidence (fill in)'],widths):cell(text,xx,ys,w,22);xx+=w
    ys-=22
    for r in gaps[col*half:(col+1)*half]:
        i,ref,task,date,leg,item,qty,loc,_,__,reason,*rest=r
        tag='COVER' if 'quote' in reason.lower() or 'supplier' in reason.lower() else 'SCOPE' if any(x in reason.lower() for x in ['quantity','allocation','overlap','different','basis']) else 'RATE'
        cv.setFillColor(colors.HexColor('#F4F6F7') if i%2 else colors.white);cv.rect(x0,ys-rowh,block,rowh,fill=1,stroke=0);xx=x0
        vals=[i,f'{ref} / {task or "—"} / {(date or "")[5:]}',f'{item} × {qty or "?"} / {leg}',tag,'From: __________\nTo: __________','Cost: __________\nEvidence: _______']
        for text,w in zip(vals,widths):cell(text,xx,ys,w,rowh);xx+=w
        cv.setStrokeColor(colors.HexColor('#CFD7DD'));cv.line(x0,ys-rowh,x0+block,ys-rowh);ys-=rowh
    assert ys>48, 'fill-in rows exceed one-page layout'
cv.setFont('AuditSans',8);cv.setFillColor(colors.HexColor('#53616D'));cv.drawString(28,30,'RATE = cost missing | SCOPE = quantity/item/overlap to confirm | COVER = supplier transport inclusion to confirm. Not a booking or dispatch instruction.')
cv.showPage();cv.save()
print(json.dumps({'workbook_sheets':len(wb.sheetnames),'unresolved_transport_rows':len(gaps),'pdfs':3,'private_outputs':True}))
