#!/usr/bin/env python3
"""Author: Andrew Fisher. Paired native/financial/count preservation check.

Detailed source values stay in private snapshots. Reports contain checks only.
"""
import argparse
import copy
import json
from pathlib import Path
from financial_invariants973 import audit

p=argparse.ArgumentParser()
p.add_argument('--base',required=True)
p.add_argument('--candidate',required=True)
p.add_argument('--expected-sha',required=True)
p.add_argument('--record',required=True,type=int)
p.add_argument('--output',required=True)
a=p.parse_args()
b=json.loads(Path(a.base).read_text())
f=json.loads(Path(a.candidate).read_text())
checks=[]
def check(name,condition):checks.append({'name':name,'pass':bool(condition)})
check('exact final candidate',f['sha256']==a.expected_sha)
check('paired native record version',b['nativeVersion']==f['nativeVersion']==a.record)
check('record unchanged while captured',b['recordUnchanged'] and f['recordUnchanged'])
check('all shared collections ready',all(x['sync']['status']=='live' and x['sync']['first']==x['sync']['expected'] for x in [b,f]))
check('financial caches cleared and photo index ready',all(x['cacheCleared'] and x['photoIndexReady'] for x in [b,f]))
check('no model errors',not b['errors'] and not f['errors'])
check('no browser errors or attempted writes',all(not x[k] for x in [b,f] for k in ['pageErrors','consoleErrors','blockedRequests']))
check('complete native record preserved',b['record']==f['record'])
check('all financial models retained',len(b['models'])==15 and set(b['models'])==set(f['models']))
for name,value in b['models'].items():check('financial model '+name+' exactly preserved',value==f['models'].get(name))
# These are native/count models. Intentional source-reference labels are captured
# separately in destinations/referenceRows/unresolvedLocations, never ignored here.
for name in ['embeddedData','today','inventory','ep','epSupply','sourceAliases']:
 check(name+' exactly preserved',b['preservation'][name]==f['preservation'][name])
expected_dates=copy.deepcopy(b['preservation']['dates'])
nov12=next(d for d in expected_dates if d['iso']=='2026-11-12')
check('baseline has both source-only removal rows',nov12['unref']==['T0222','T0223'])
nov12['unref']=[]
check('programme dates and movements preserved apart from two linked removal rows',expected_dates==f['preservation']['dates'])
for task,parent in [('T0222','T0021'),('T0223','T0022')]:
 before=next(r for r in b['preservation']['referenceRows'] if r['id']==task)
 links=[r for r in f['preservation']['sourceLinks12Nov'] if r['id']==task]
 check(task+' retained exactly once with original source row and removal date',len(links)==1 and links[0]['recordRef']==parent and links[0]['relation']=='paired-demob' and links[0]['sourceRow']==before['sourceRow'] and links[0]['date']==before['date']=='2026-11-12')
expected_assets=copy.deepcopy(b['preservation']['assets'])
p36=next(r for r in expected_assets if r['asset']['key']=='P36')
planned='1327222'; current='1282487'
model=p36['units']
historical=next(r for r in model['rows'] if r['assetNo']==planned)
historical.update(physical=False,source='history',history973=True,identityReview='Schedule allocation only · current building 1282487 is recorded in Andrew’s site photographs.')
for g in model['groups']:
 if any(r['assetNo']==planned for r in g['units']):
  g['units']=[r for r in g['units'] if r['assetNo']!=planned]
  g['pending']=None if g['quantity'] is None else max(0,g['quantity']-sum(bool(r['physical']) for r in g['units']))
model['allocation973']={'ref':'P36','current':current,'planned':planned,'item':'Building 6m','basis':'Andrew’s unit-labelled site photographs, 18 and 25 Sep 2026; Schedule 7 Week 5 row 35 retained as history.'}
for row in p36['ownership']['rows']:
 if any(r['number']==planned for r in row['units']):
  row['units']=[r for r in row['units'] if r['number']!=planned]
  row['quantity']=sum(r['quantity'] for r in row['units'])
check('only exact approved P36 current/history identity projection changes',expected_assets==f['preservation']['assets'])
ties=f['models']['ties']
check('all native financial ties pass',ties['ok'] and ties['bad']==0 and ties['count']==17)
invariants,_=audit(f)
check('all independent financial invariants pass',all(c['pass'] for c in invariants))
report={'author':'Andrew Fisher','release':'v9.73','baseSha256':b['sha256'],'sha256':f['sha256'],'nativeVersion':f['nativeVersion'],'pass':all(c['pass'] for c in checks),'checks':checks,'financialModels':len(f['models']),'financialInvariants':len(invariants),'financialInvariantsPassed':sum(c['pass'] for c in invariants),'nativeTies':ties['count'],'liveWrites':0,'limits':'Exact comparison on one frozen native record. Source-reference projection changes are independently reviewed; this check does not invent or resolve missing facts.'}
Path(a.output).write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'pass':report['pass'],'checks':len(checks),'financialInvariants':len(invariants),'ties':ties['count'],'failed':[c['name'] for c in checks if not c['pass']]}))
raise SystemExit(0 if report['pass'] else 1)
