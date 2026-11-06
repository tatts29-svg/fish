# Author: Andrew Fisher. Private original required; output contains counts only.
import copy, importlib.util, json, os, sys
from pathlib import Path
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root));import patch_v949 as P
base=Path(os.environ['BASE949_PAGE']).read_text();at=base.index('const DATA = ')+len('const DATA = ');data=json.JSONDecoder().raw_decode(base[at:])[0];before=copy.deepcopy(data)
log=P.refresh(data,os.environ['BASEPLAN949_XLSX']);R=data['rental_on_hire'];old={(r['rental_contract'],r['line']):r for r in before['rental_on_hire']['rows']};rows={(r['rental_contract'],r['line']):r for r in R['rows']}
assert len(rows)==320 and len(old)==321 and len(log['added'])==3 and len(log['removed'])==4
assert len(R['source_history949']['rows'])==4 and len(R['supplier_cost_evidence949'])==2
for k in old.keys() & rows.keys():
 assert rows[k]['match']==old[k]['match']
 for col in ['quantity','rate_1','rate_2','rate_3','rate_4','rate_5','price']:
  assert rows[k].get(col)==old[k].get(col),(k,col)
assert rows[('9987005',6)]['match'].get('key') is None
assert all(rows[('9961976',n)]['match'].get('key')=='GN?' for n in [42,43])
assert sum(r['rental_contract']=='9968862' for r in R['rows'])==86
assert all('prebill' not in k.lower() for r in R['rows'] for k in r)
for e in R['supplier_cost_evidence949']:
 assert e['moneyKind']=='Direct costs' and e['sourceSha256']==P.SHA
 assert e['salesAnalysisCode'].split('-')[0]!=e['contractBranch']
 assert len(e['lines']) in [1,8]
try:P.patch(P.patch(base,os.environ['BASEPLAN949_XLSX']),os.environ['BASEPLAN949_XLSX']);raise AssertionError('reapply accepted')
except AssertionError as e:assert str(e)=='already patched'
print(json.dumps({'author':'Andrew Fisher','passed':True,'activeLines':len(rows),'retainedAllocations':len(old.keys() & rows.keys()),'sourceArchives':4,'supplierNotes':2,'operationalDataUnchanged':True}))
