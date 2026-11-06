import json
from collections import defaultdict, OrderedDict
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
r=json.load(open('fdall.json')); s=json.load(open('state.json')); po=s['docs']['purchaseOrders']
CAN={'clean':'Clean fence','scrim':'Scrim fence','v_gates':'Vehicle gates','ped_gates':'Pedestrian gates','ccb_demarc':'CCB','ccb_event':'CCB','flat_feet':'CCB','fence_blocks':'Bases','bases':'Bases','labour':'Labour','relocation':'Labour'}
ORDER=['Clean fence','Scrim fence','CCB','Vehicle gates','Pedestrian gates','Bases','Labour']
sup={}  # docket number -> (po, lines)
for k,v in po.items():
    sp=v.get('supplier_pricing')
    if not sp: continue
    for rec in sp['records']:
        sup.setdefault(str(rec.get('number')),[]).append((k,v.get('period'),rec['lines']))
c2=lambda x:round(float(x or 0)+1e-9,2)
rows=[]; wk=OrderedDict(); T=defaultdict(lambda:{'pq':0,'pa':0,'pr':set(),'cq':0,'ca':0,'cr':set(),'u':''})
def wkkey(w):
    try: return (0,int(str(w).split()[-1]))
    except: return (1,str(w))
dk=[d for d in r['dk'] if d['usable']]
dk.sort(key=lambda d:(wkkey(d['week']),d['date'] or '',str(d['no'] or '')))
for d in dk:
    P=defaultdict(lambda:{'q':0,'a':0,'r':set(),'u':''}); C=defaultdict(lambda:{'q':0,'a':0,'r':set(),'u':'','items':set()})
    src=sup.get(str(d['no'])) if d['inv'] else None
    pos=''
    if src:
        pos=', '.join(sorted({x[0] for x in src}))
        for _,_,ls in src:
            for l in ls:
                t=CAN.get(l.get('column'),l.get('name')); P[t]['q']+=l.get('qty') or 0; P[t]['a']+=l.get('amount') or 0; P[t]['r'].add(l.get('rate')); P[t]['u']=l.get('unit') or ''
    else:
        for l in d['lines']:
            if l['paid'] is None: continue
            t=CAN.get(l['col'],l['name']); P[t]['q']+=l['qty'] or 0; P[t]['a']+=l['paid'] or 0; P[t]['r'].add(l['prate']); P[t]['u']=l['unit'] or ''
    for l in d['lines']:
        t=CAN.get(l['col'],l['name']); C[t]['q']+=l['qty'] or 0; C[t]['a']+=l['charge'] or 0; C[t]['r'].add(l['rate']); C[t]['u']=l['unit'] or ''; C[t]['items'].add(l['name'])
    w=wk.setdefault(d['week'],{'n':0,'inv':0,'pa':0,'ca':0,'sheet':set(),'po':set()}); w['n']+=1; w['inv']+=1 if d['inv'] else 0; w['pa']+=d['paid'] or 0; w['ca']+=d['charge'] or 0; w['sheet'].add(str(d['sheet'] or '')); 
    if pos: w['po'].add(pos)
    for t in [x for x in ORDER if x in P or x in C]+[x for x in set(P)|set(C) if x not in ORDER]:
        p=P.get(t); cc=C.get(t)
        rr=lambda S:(sorted(x for x in S if x is not None)[0] if len([x for x in S if x is not None])==1 else ('mixed' if S else None))
        rows.append([d['week'],d['date'],d['no'] or d['id'],'Invoiced '+pos if d['inv'] else 'Not invoiced yet',t,
            c2(p['q']) if p else None, rr(p['r']) if p else None, c2(p['a']) if p else None,
            c2(cc['q']) if cc else None, rr(cc['r']) if cc else None, c2(cc['a']) if cc else None,
            (cc and cc['u']) or (p and p['u']) or '', '; '.join(sorted(cc['items'])) if cc else ''])
        g=T[t]
        if p: g['pq']+=p['q']; g['pa']+=p['a']; g['pr']|={x for x in p['r'] if x is not None}
        if cc: g['cq']+=cc['q']; g['ca']+=cc['a']; g['cr']|={x for x in cc['r'] if x is not None}; g['u']=cc['u']
    rows.append([d['week'],d['date'],d['no'] or d['id'],'docket total','',None,None,c2(d['paid']),None,None,c2(d['charge']),'',''])
M=r['M']; inv=r['inv1219']['lines']
wb=Workbook(); B=Font(bold=True); H=PatternFill('solid',fgColor='1F3864'); HF=Font(bold=True,color='FFFFFF')
def sheet(ws,head,data,money_cols,widths):
    ws.append(head)
    for c in ws[1]: c.font=HF; c.fill=H; c.alignment=Alignment(wrap_text=True,vertical='top')
    for row in data: ws.append(row)
    for i,wd in enumerate(widths,1): ws.column_dimensions[get_column_letter(i)].width=wd
    for col in money_cols:
        for c in ws[get_column_letter(col)][1:]: c.number_format='$#,##0.00'
    ws.freeze_panes='A2'
ws=wb.active; ws.title='Summary by type'
data=[]
for t in ORDER+[x for x in T if x not in ORDER]:
    if t not in T: continue
    g=T[t]; rate=lambda S:', '.join('$%.2f'%x for x in sorted(S)) 
    data.append([t,g['u'],c2(g['pq']),rate(g['pr']),c2(g['pa']),c2(g['cq']),rate(g['cr']),c2(g['ca']),c2(g['ca']-g['pa'])])
dpa=sum(d['paid'] or 0 for d in dk); dca=sum(d['charge'] or 0 for d in dk)
lpa=sum(x[4] for x in data); lca=sum(x[7] for x in data)
data.append(['Dockets, line total','','','',c2(lpa),'','',c2(lca),c2(lca-lpa)])
if abs(lpa-dpa)>0.005: data.append(['Orders paid at their receipted amount (not the line sum)','','','',c2(dpa-lpa),'','','',''])
data.append(['DOCKETS TOTAL ('+str(len(dk))+')','','','',c2(dpa),'','',c2(dca),c2(dca-dpa)])
ex=[[x['words'],'','','',None,'','',c2(x['amount']),None] for x in inv]
data+= [['','','','','','','','','']]+ex
data.append(['Supplier extras at cost (team leader, weed mat, shade cloth, order 4658850) - what we pay','','','',c2(r['fd']['cost']-dpa),'','','',''])
data.append(['FENCING ON THE PAGE','','','',c2(r['fd']['cost']),'','',c2(r['fd']['charged']),c2(r['fd']['charged']-r['fd']['cost'])])
data.append(['Fence event labour, race days (event scope) %s h'%M['scopeH'],'','','',None,'','',c2(M['scope']),None])
data.append(['Advanced race crew (forecast cost)','','','',c2(M['crew']),'','',None,None])
for x in M['cl']: data.append([x['w'],'','','',None,'','',c2(x['a']),None])
data.append(['EVERYTHING INCLUDED','','','',c2(M['cost']),'','',c2(M['charge']),c2(M['charge']-M['cost'])])
sheet(ws,['Type','Unit','Qty - Advanced bill us','Advanced rate','WE PAY ADVANCED','Qty - we charge V8s','Our rate','WE CHARGE V8s','Margin'],data,[5,8,9],[62,8,14,16,16,14,16,16,14])
for row in ws.iter_rows(min_row=2):
    if str(row[0].value).isupper() or str(row[0].value).startswith('DOCKETS'):
        for c in row: c.font=B
ws2=wb.create_sheet('By week')
wd=[[w,v['n'],v['inv'],v['n']-v['inv'],', '.join(sorted(x for x in v['sheet'] if x)),', '.join(sorted(v['po'])),c2(v['pa']),c2(v['ca']),c2(v['ca']-v['pa'])] for w,v in wk.items()]
wd.append(['TOTAL',sum(v['n'] for v in wk.values()),sum(v['inv'] for v in wk.values()),sum(v['n']-v['inv'] for v in wk.values()),'','',c2(dpa),c2(dca),c2(dca-dpa)])
sheet(ws2,['Week','Dockets','Invoiced','Not invoiced yet','Sheet','Advanced order(s)','We pay Advanced','We charge V8s','Margin'],wd,[7,8,9],[14,9,9,12,14,22,16,16,14])
ws3=wb.create_sheet('Every docket line by line')
sheet(ws3,['Week','Date','Docket','Invoiced?','Type','Qty Advanced bill','Advanced rate','We pay Advanced','Qty we charge','Our rate','We charge V8s','Unit','Our line(s)'],rows,[7,8,10,11],[12,11,12,24,16,12,12,14,12,12,14,7,40])
for row in ws3.iter_rows(min_row=2):
    if row[3].value=='docket total':
        for c in row: c.font=B
out='/home/user/fish/03_GC500_Delivery_Control/review_28Oct2026_fencing_breakdown/GC500_Fencing_pay_and_charge_28Oct2026.xlsx'
wb.save(out)
print(out); print('dockets',len(dk),'pay',c2(dpa),'charge',c2(dca),'linepay',c2(lpa),'linecharge',c2(lca))
for x in data[:12]: print(x)
for x in wd: print(x)
