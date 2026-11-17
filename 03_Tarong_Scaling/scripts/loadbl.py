import pandas as pd, glob
U='/root/.claude/uploads/582d3211-1cb7-573a-b461-55972e442140/'
bl=[];meta=[]
for f in sorted(glob.glob(U+'*BILLING*')):
    ri=pd.read_excel(f,sheet_name='REFERENCE_INFO',dtype=str)
    p=int(ri.PROFORMA_NUMBER[0].split('/')[-1])
    d=pd.read_excel(f,sheet_name='TRANSACTION_CHARGES',dtype=str).fillna(''); d['P']=p; d['SRC']=f.split('/')[-1].split('-',1)[1]
    meta.append((p,ri.BILLING_PERIOD[0],d['SRC'][0] if len(d) else f,len(d))); bl.append(d)
meta=pd.DataFrame(meta,columns=['P','PERIOD','FILE','ROWS']).sort_values(['P','FILE'])
meta['USED']=~meta.duplicated('P')
bl=pd.concat(bl); bl=bl[bl.SRC.isin(meta[meta.USED].FILE)]
bl.to_pickle('bl.pkl'); meta.to_pickle('meta.pkl'); print(meta.to_string())
