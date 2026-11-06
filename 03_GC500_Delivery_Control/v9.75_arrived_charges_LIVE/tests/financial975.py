#!/usr/bin/env python3
"""Author: Andrew Fisher. Reconcile cleaning forecast without changing completed Revenue or Direct costs."""
import json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'v9.73_source_reference_reconciliation_LIVE/tests'))
from financial_invariants973 import audit
b=json.loads(Path(sys.argv[1]).read_text());f=json.loads(Path(sys.argv[2]).read_text());checks=[]
def ck(n,v):checks.append({'name':n,'pass':bool(v)})
def cents(n):return round(n*100)
ck('Native and embedded source unchanged',b['record']==f['record'] and b['preservation']['embeddedData']==f['preservation']['embeddedData'])
for k in ['today','inventory','ep','epSupply','sourceAliases','assets','dates']:ck(k+' preserved',b['preservation'][k]==f['preservation'][k])
for k in ['pl752','ticks','money','fenceSplit','fence','green','source949','supplierCosts','contracts','scope961']:ck(k+' exactly preserved',b['models'][k]==f['models'][k])
B=b['models'];F=f['models'];br={r['key']:r for r in B['pl770']['rev']};fr={r['key']:r for r in F['pl770']['rev']}
for k,v in br.items():
 if k!='cleaning':ck('Revenue stream '+k+' unchanged',v==fr[k])
clean=fr['cleaning'];remaining=clean['job']-clean['now'];ck('Cleaning recorded charge preserved',cents(clean['now'])==cents(F['ticks']['cleaning']['amount']))
ck('Cleaning forecast not negative',remaining>=0)
ck('Cleaning only added once to overall forecast',cents(F['cj']['revenue']['job']-B['cj']['revenue']['job'])==cents(remaining)==cents(F['cj']['revenue']['cleaningToCome']))
ck('Forecast addition agrees across Finance and P&L',all(cents(F[k]['revenueJob']-B[k]['revenueJob'])==cents(remaining) for k in ['finance','rehire']) and cents(F['pl770']['revJob']-B['pl770']['revJob'])==cents(remaining))
for k in ['pl770','cj','finance','rehire']:
 for field in ['cost','costJob','costs','record','wages','accommodation','meals']:
  if field in B[k]:ck(k+' '+field+' preserved',B[k][field]==F[k][field])
ck('Exact three remaining VMS associations',sorted(r['id'] for r in f['preservation']['unresolvedLocations'])==['T0159','T0169','T0170'])
inv,_=audit(f);ck('Independent financial invariants',all(c['pass'] for c in inv));ck('Native reconciliation ties',F['ties']['ok'] and F['ties']['bad']==0)
ck('No errors or operational writes',all(not x[k] for x in [b,f] for k in ['errors','pageErrors','consoleErrors','blockedRequests']))
r={'author':'Andrew Fisher','pass':all(x['pass'] for x in checks),'checks':checks,'sha256':f['sha256'],'nativeVersion':f['nativeVersion'],'financialInvariants':len(inv),'nativeTies':F['ties']['count']}
Path(sys.argv[3]).write_text(json.dumps(r,indent=2));print(json.dumps({'pass':r['pass'],'checks':len(checks),'invariants':len(inv),'failed':[x['name'] for x in checks if not x['pass']]}));sys.exit(0 if r['pass'] else 1)
