import pandas as pd, glob
U='/root/.claude/uploads/582d3211-1cb7-573a-b461-55972e442140/'
ss=pd.read_excel(glob.glob(U+'*SALES_STOCK*')[0],sheet_name='SALES_STOCK',dtype=str).fillna('')
st=pd.read_excel(glob.glob(U+'*STOCKTAKE*')[0],sheet_name='STOCKTAKE',dtype=str).fillna('')
bl=[]
for f in sorted(glob.glob(U+'*BILLING*')):
    d=pd.read_excel(f,sheet_name='TRANSACTION_CHARGES',dtype=str).fillna(''); d['SRC']=f.split('UNIT8601_')[1]; bl.append(d)
bl=pd.concat(bl)
ss.to_pickle('ss.pkl'); st.to_pickle('st.pkl'); bl.to_pickle('bl.pkl')
