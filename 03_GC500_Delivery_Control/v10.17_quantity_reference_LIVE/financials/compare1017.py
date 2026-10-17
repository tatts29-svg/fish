"""Author: Andrew Fisher. Compare private same-record financial captures; emit no monetary values."""
from pathlib import Path
import json,sys

base=json.loads(Path(sys.argv[1]).read_text());candidate=json.loads(Path(sys.argv[2]).read_text());checks=[];differences=[]
def check(name,value):checks.append({'name':name,'pass':bool(value)})
def changed(a,b,path=''):
    if type(a)!=type(b):return [path]
    if isinstance(a,dict):
        keys=set(a)|set(b);return sum(([path+'/'+str(k)] if k not in a or k not in b else changed(a[k],b[k],path+'/'+str(k)) for k in sorted(keys)),[])
    if isinstance(a,list):
        if len(a)!=len(b):return [path+'/length']
        return sum((changed(x,y,path+'/'+str(i)) for i,(x,y) in enumerate(zip(a,b))),[])
    return [] if a==b else [path]
check('same native shared version',base['nativeVersion']==candidate['nativeVersion'])
check('same local day for financial cut-off',base['date']==candidate['date'])
check('same complete financial capture scope',set(base['domains'])==set(candidate['domains']))
for key,value in base['domains'].items():
    other=candidate['domains'].get(key);same=value==other;check(key+' unchanged',same)
    if not same:differences.append({'domain':key,'paths':changed(value,other)[:100]})
for label,data in [('baseline',base),('candidate',candidate)]:
    check(label+' leaves all native state unchanged',data['unchanged'])
    check(label+' has zero errors or operational writes',not data['errors'] and data['counts']['blocked']==0)
    for domain,values in data['reconciliation'].items():check(label+' '+domain+' reconciles',all(values.values()))
# Physical-supply projections deliberately change. Their existing currency values must not.
old={r['type']:r for r in base['projection']['inventory']};new={r['type']:r for r in candidate['projection']['inventory']}
for key,row in old.items():
    bm=row.get('money') or {};cm=(new.get(key) or {}).get('money') or {}
    check('Inventory existing type money unchanged: '+key,bm.get('total',0)==cm.get('total',0))
for key in set(new)-set(old):check('new Inventory source type adds no charge: '+key,not (new[key].get('money') or {}).get('total',0))
output={'author':'Andrew Fisher','checks':checks,'failures':[c for c in checks if not c['pass']],'differences':differences,'nativeVersion':candidate['nativeVersion'],'baselineSha':base['pageSha'],'candidateSha':candidate['pageSha']}
Path(sys.argv[3]).write_text(json.dumps(output,indent=2)+'\n');print(json.dumps({'checks':len(checks),'failures':output['failures'],'differences':differences,'nativeVersion':candidate['nativeVersion']}))
if output['failures']:raise SystemExit(1)
