import openpyxl, sys, datetime, json, re
def load(p):
    wb=openpyxl.load_workbook(p,data_only=True); out={}
    for ws in wb.worksheets:
        rows=list(ws.iter_rows(values_only=True)); h=[str(x).strip() if x is not None else '' for x in rows[0]]; h[0]='Line' if ws.title!='Delivery Dockets' else h[0]
        m=re.search(r'(\d{7})',ws.title); c=m.group(1) if m else ws.title
        for i,r in enumerate(rows[1:]):
            d={h[j]:r[j] for j in range(len(h)) if h[j]}
            if not any(v not in (None,'') for v in d.values()): continue
            if ws.title=='Delivery Dockets':
                k=('DD',str(d.get(list(d)[0])),json.dumps({kk:str(vv) for kk,vv in d.items()},sort_keys=True))
            else: k=(c,str(d.get('Line')))
            out[k]=(ws.title,d)
    return out
S=sys.argv[1]; a=load(S+'/bp4.xlsx'); b=load(S+'/bp.xlsx')
def f(v): return v.isoformat() if isinstance(v,(datetime.date,datetime.time,datetime.datetime)) else v
added=[k for k in b if k not in a]; gone=[k for k in a if k not in b]; ch=[]
for k in b:
    if k in a and k[0]!='DD':
        da,db=a[k][1],b[k][1]; diff={x:(f(da.get(x)),f(db.get(x))) for x in set(da)|set(db) if f(da.get(x))!=f(db.get(x))}
        if diff: ch.append((k,diff))
print('contract lines: added',len([k for k in added if k[0]!='DD']),'gone',len([k for k in gone if k[0]!='DD']),'changed',len(ch))
print('docket rows: added',len([k for k in added if k[0]=='DD']),'gone',len([k for k in gone if k[0]=='DD']))
res={'added':[{'contract':k[0],'line':k[1],**{x:f(v) for x,v in b[k][1].items() if v not in (None,'')}} for k in added if k[0]!='DD'],
     'gone':[{'contract':k[0],'line':k[1],**{x:f(v) for x,v in a[k][1].items() if v not in (None,'')}} for k in gone if k[0]!='DD'],
     'changed':[{'contract':k[0],'line':k[1],'desc':b[k][1].get('Description'),'diff':d} for k,d in ch],
     'dd_added':[{x:f(v) for x,v in b[k][1].items() if v not in (None,'')} for k in added if k[0]=='DD'],
     'dd_gone':[{x:f(v) for x,v in a[k][1].items() if v not in (None,'')} for k in gone if k[0]=='DD']}
json.dump(res,open(S+'/diff.json','w'),indent=1,default=str)
