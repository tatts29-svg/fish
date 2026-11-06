"""Author: Andrew Fisher. Reconcile independently captured projections without editing records."""
import collections
import csv
import json
import sys
from pathlib import Path

folder=Path(sys.argv[1])
d=json.loads((folder/'snapshot.json').read_text())
s=json.loads((folder/'sources.json').read_text())
active=[r for r in d['matrix'] if r['canonical'] and not any(r[k] for k in ('cancelled','relocation','restOf','movedAway'))]
checks=[]
def check(name,ok,detail=None):
    checks.append(dict(name=name,pass_=bool(ok),**({'detail':detail} if detail is not None else {})))
matrix=[]
identities=collections.defaultdict(list)
accessories=collections.defaultdict(lambda:dict(rows=0,quantity=0,numbered=0))
for r in active:
    for i in r['items']:
        inv=i['inventory']; mapped=i['map']; qty=i['asked']
        check(f"{r['ref']} / {i['item']}: valid described or explicit quantity",isinstance(qty,(int,float)) and qty>=0)
        check(f"{r['ref']} / {i['item']}: Inventory requested",sum(x['asked'] for x in inv)==qty)
        check(f"{r['ref']} / {i['item']}: map requested",len(mapped)==1 and mapped[0]['quantity']==qty)
        check(f"{r['ref']} / {i['item']}: Inventory current stock",sum(x['on'] for x in inv)==i['currentStock'])
        for sup in i['supplier']:
            check(f"{r['ref']} / {i['item']}: supplier requested",sup['quantity']==qty)
            check(f"{r['ref']} / {i['item']}: supplier receipt",sup['received']==i['received'])
        matrix.append(dict(ref=r['ref'],discipline=r['discipline'],item=i['item'],requested=qty,received=i['received'],current_stock=i['currentStock'],map_requested=mapped[0]['quantity']if len(mapped)==1 else None,map_installed=mapped[0].get('installed')if len(mapped)==1 else None,reference_complete=r['delivery']['done'],supplier_requested=sum(x['quantity']for x in i['supplier'])if i['supplier']else None))
    for u in r['model']['rows']:
        if u['physical'] and u.get('assetNo'):
            identities[(u['owner'],u['assetNo'])].append(dict(ref=r['ref'],item=u['item'],source='typed unit'))
    for a in r['accessories']:
        row=accessories[a['type']];row['rows']+=1;row['quantity']+=a['qty'];row['numbered']+=bool(a.get('asset_no'))
        if a.get('asset_no'):
            identities[('coates',a['asset_no'])].append(dict(ref=r['ref'],item=a['type'],source='accessory'))
duplicates=[dict(owner=k[0],number=k[1],claims=v)for k,v in identities.items()if len(set(x['ref']for x in v))>1]
check('No current same-owner asset number assigned across canonical references',not duplicates,duplicates)
key=lambda day,r:(day,r['ref'],r['item'])
build=collections.Counter();receipts=collections.Counter();planned=collections.Counter();remaining=collections.Counter()
for day in d['programme']:
    for load in day['loads']:
        sup=load.get('supplier')
        if not sup:continue
        for r in sup['stops']:
            target=build if sup.get('actualReceipt1006') else planned
            target[key(day['iso'],r)]+=r['count'] if sup.get('actualReceipt1006') else r.get('count',r.get('remaining',0))
for r in d['supplier']['receipts']:receipts[key(r['date'],r)]+=r['count']
for r in d['supplier']['remaining']:remaining[key(r['date'],r)]+=r['remaining']
check('Every dated supplier receipt matches its Build quantity',build==receipts)
check('Every pending supplier delivery matches its Build quantity',planned==remaining)
check('All primary current scope is represented in Demob',set(r['ref']for r in active).issubset(r['key']for r in s['demob']['refs']))
check('Native state unchanged by both captures',d['nativeUnchanged'] and s['nativeUnchanged'])
check('Captures use same native record version',d['nativeVersion']==s['nativeVersion'])
check('Zero browser errors or operational writes',not d['errors']and not s['errors']and not d['requests']['blocked']and not s['requests']['blocked'])
report=dict(author='Andrew Fisher',native_version=d['nativeVersion'],captured=d['captured'],coverage=dict(all_references=len(d['assets']),canonical_references=len(d['canonical']['refs']),active_references=len(active),active_item_lines=len(matrix),inventory_types=len(d['inventory']['list']),programme_days=len(d['programme']),supplier_rows=len(d['supplier']['rows']),supplier_receipt_rows=len(receipts),supplier_receipt_units=sum(receipts.values()),supplier_pending_rows=len(remaining),supplier_pending_units=sum(remaining.values()),accessory_rows=sum(r['rows']for r in accessories.values()),accessory_quantity=sum(r['quantity']for r in accessories.values()),accessory_numbered_rows=sum(r['numbered']for r in accessories.values())),checks=checks,duplicates=duplicates,accessories=accessories,today=[{k:r[k]for k in ('id','unit','total','done','remaining','pct')}for r in d['today']],known_discrepancies=['Demob schedules two canonical forklift aliases and a relocation as extra pickups.','Demob retains original eight-board scope after one board moved to another collection reference.','Inventory still-to-come calculation uses current stock instead of cumulative receipts.','Two source-only supplier requests are counted in Today and supplier delivery runs but absent Inventory primary order totals.'],coverage_limits=['This compares stored source and shared projections; it cannot establish an unrecorded physical delivery.','Supplementary contents and known distribution-board identities remain separate from main primary-equipment order totals.','Planned quantities, received quantities, current stock, installed work and historical movements are different measures.','Latest external source revision discrepancies are reviewed separately; they do not replace confirmed onsite data.'])
(folder/'reconciliation.json').write_text(json.dumps(report,indent=2)+'\n')
with (folder/'reference-item-matrix.csv').open('w',newline='')as f:
    w=csv.DictWriter(f,fieldnames=list(matrix[0]));w.writeheader();w.writerows(matrix)
print(json.dumps(dict(native_version=d['nativeVersion'],coverage=report['coverage'],checks=len(checks),failed=[c for c in checks if not c['pass_']])))
