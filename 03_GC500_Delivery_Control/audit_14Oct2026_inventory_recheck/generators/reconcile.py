"""Author: Andrew Fisher. Reconcile private generator snapshot with original card and Baseplan workbook."""
from pathlib import Path
from collections import Counter,defaultdict
from decimal import Decimal,ROUND_HALF_UP
from datetime import date,datetime,timedelta
import json,re,sys,hashlib,openpyxl

folder=Path(sys.argv[1]);snap=json.loads((folder/'snapshot.json').read_text());checks=[]
def check(name,value):checks.append({'name':name,'pass':bool(value)})
def money(n):return Decimal(str(n)).quantize(Decimal('.01'),rounding=ROUND_HALF_UP)
def kva(text):
    m=re.search(r'(\d+(?:\.\d+)?)\s*kva',str(text),re.I)
    return float(m[1]) if m else None
cards=json.loads((folder/'card-original.json').read_text());card_file=Path(cards['file'])
check('original card hash unchanged',hashlib.sha256(card_file.read_bytes()).hexdigest()==cards['sha256'])
book=openpyxl.load_workbook(card_file,data_only=True);sheet=book['Street Rate Card 2026'];rates={}
for row in sheet:
    size=kva(row[0].value)
    if size and isinstance(row[2].value,(int,float)) and isinstance(row[3].value,(int,float)):
        rates[size]={'daily':row[2].value,'standdown':row[3].value,'row':row[0].row}
model=snap['model'];contracts=dict(model['contracts']);rows=model['rows'];assets={r['asset']['key']:r for r in snap['assets']};source_rows={str(r['rental_contract'])+':'+str(r['line']):r for r in snap['contracts']}
active=[a for a in snap['assets'] if not a['asset'].get('_cancelled') and not a['asset'].get('_movedTo')]
contract_counts=Counter(cid for r in rows for cid in r['contractIds'])
check('every source contract allocated exactly once',set(contract_counts)==set(source_rows) and all(n==1 for n in contract_counts.values()))
check('model contract count matches source count',len(contracts)==len(source_rows)==len(snap['contracts']))
check('cancelled reference has no charge row',all(not assets.get(r['ref'],{}).get('asset',{}).get('_cancelled') for r in rows))
check('generator count matches active reference quantities plus unreferenced contracts',sum(r['qty'] for r in rows)==sum(sum(l['quantity'] for l in a['lines']) for a in active)+sum(r['qty'] for r in rows if not r['ref']))
check('known arrival quantity matches onsite charge quantities',sum(r['qty'] for r in rows if r['actualIsConfirmed'])==sum(r['arrived'] for r in snap['onsite']))
check('every arrived reference is marked complete',all(assets[r['ref']]['delivery'].get('done') for r in rows if r['actualIsConfirmed']))
check('actual plus remaining equals total hire',money(model['actual']+model['remaining'])==money(model['forecast']))
confirmed_numbers=[n for r in rows if r['actualIsConfirmed'] for n in r['assetNumbers']]
check('confirmed physical asset numbers are unique',len(confirmed_numbers)==len(set(confirmed_numbers)))
check('no pending physical number promoted',all(not r['assetNumbers'] for r in rows if not r['actualIsConfirmed']))
check('confirmed numbers never exceed physical count',all(len(r['assetNumbers'])<=r['qty'] for r in rows))
independent=[]
for key,c in contracts.items():
    group=next(r for r in rows if key in r['contractIds']);source=source_rows[key];size=kva(group['item']);priced=max(n for n in rates if n<=size);rate=rates[priced]
    check(key+' requested size card daily and standby retained',abs(c['dailyRate']-rate['daily'])<1e-9 and abs(c['standdownRate']-rate['standdown'])<1e-9)
    start=date.fromisoformat(c['from']);friday=date.fromisoformat(model['eventFrom']);sunday=date.fromisoformat(model['offhire']);sd=max(0,(friday-start).days);ed=max(0,(sunday-max(start,friday)).days+1)
    amount=money(source['quantity']*(rate['standdown']*sd+rate['daily']*ed))
    check(key+' independent quantity and whole-period charge',amount==money(c['forecast']) and c['standdownDays']==sd and c['eventDays']==ed)
    check(key+' actual versus forecast follows received state',money(c['actual'])==(amount if c['arrived'] else Decimal(0)) and money(c['remaining'])==(Decimal(0) if c['arrived'] else amount))
    independent.append({'contract':key,'ref':group['ref'],'requestedKva':size,'pricedKva':priced,'qty':source['quantity'],'arrived':c['arrived'],'start':c['from'],'standdownDays':sd,'eventDays':ed,'cardRow':rate['row'],'forecast':str(amount)})
check('independent line totals equal generator total',sum(Decimal(r['forecast']) for r in independent)==money(model['forecast']))
check('independent received lines equal actual generator total',sum(Decimal(r['forecast']) for r in independent if r['arrived'])==money(model['actual']))
concert=assets['GN?'];check('Concert pair uses exact user pin',concert['pin']['lat']==-27.984576 and concert['pin']['lon']==153.4277)
check('Concert pair is two generators only',sum(r['qty'] for r in rows if r['ref']=='GN?')==2)
check('all arrived generators have a current map point',all(assets[r['ref']]['pin'] for r in rows if r['actualIsConfirmed']))
for r in rows:
    if not r['actualIsConfirmed']:continue
    history=assets[r['ref']]['delivery']['history']
    recorded_days=[(datetime.fromisoformat(h['at'].replace('Z','+00:00'))+timedelta(hours=10)).date().isoformat() for h in history if h['state']=='on site']
    check(r['ref']+' hire starts on the recorded AEST arrival day',bool(recorded_days) and r['deliveredDate']==min(recorded_days))
probe=json.loads((folder/'ledger-probe.json').read_text());raw=probe['raw']
check('all embedded schedule generator references represented',set(a['key'] for a in raw['assets']+raw['plantLines'])==set(assets))
check('all generator master references represented and positioned',set(raw['master'])<=set(assets) and all(assets[key]['pin'] for key in raw['master']))
check('superseded GN13 source numbers not treated as current confirmed plant',all(n not in next(r for r in rows if r['ref']=='GN13')['assetNumbers'] for n in assets['GN13']['asset'].get('_numbersTakenOff',[])))
base=json.loads((folder/'baseplan2-original.json').read_text());check('original Baseplan hash unchanged',hashlib.sha256(Path(base['file']).read_bytes()).hexdigest()==base['sha256'])
latest=[r for r in base['rows'] if 'generator' in str(r['values'].get('Description','')).lower()]
bykey=defaultdict(list)
for r in latest:bykey[str(r['values']['Line'])].append(r)
check('repeated Baseplan row is exact duplicate',all(len(v)==1 or all(r['values']==v[0]['values'] for r in v) for v in bykey.values()))
unique=[v[0] for v in bykey.values()];delivered=[r for r in unique if r['values'].get('Status')=='Delivered'];latest_arrivals=Counter()
for r in delivered:
    m=re.match(r'GN\s*-?\s*(\d+)',r['values']['Description'],re.I);ref='GN'+str(int(m[1])).zfill(2) if m else None
    if ref in ['GN26','GN27']:ref='GN?'
    latest_arrivals[ref]+=r['values'].get('Quantity') or 1
current_arrivals=Counter()
for r in rows:
    if r['actualIsConfirmed']:current_arrivals[r['ref']]+=r['qty']
check('all latest Baseplan delivered generator quantities represented onsite',latest_arrivals==current_arrivals)
source_matrix=[]
for r in unique:
    v=r['values'];key='9961976:'+str(v['Line']);source_matrix.append({'contract':key,'row':r['row'],'description':v['Description'],'status':v['Status'],'qty':v.get('Quantity'),'asset':v.get('Item'),'start':v.get('Start Date'),'booked':v.get('Booked Delivery Date'),'currentContractLinked':key in contracts})
coverage={'activeUnits':sum(r['qty'] for r in rows),'activeGroups':len(rows),'activeReferenceGroups':len(active),'activeReferenceUnits':sum(sum(l['quantity'] for l in a['lines']) for a in active),'contractOnlyUnits':sum(r['qty'] for r in rows if not r['ref']),'arrivedUnits':sum(r['qty'] for r in rows if r['actualIsConfirmed']),'forecastUnits':sum(r['qty'] for r in rows if not r['actualIsConfirmed']),'confirmedPhysicalNumbers':len(confirmed_numbers),'activeGroupsWithMapPoint':sum(bool(a['pin']) for a in active),'cancelledReferences':[a['asset']['key'] for a in snap['assets'] if a['asset'].get('_cancelled')],'requestedSizes':dict(Counter({size:sum(r['qty'] for r in rows if kva(r['item'])==size) for size in sorted(set(kva(r['item']) for r in rows))})),'baseplanGeneratorRows':len(latest),'baseplanUniqueGeneratorLines':len(unique),'baseplanDeliveredUnits':sum(latest_arrivals.values())}
output={'author':'Andrew Fisher','checks':checks,'failures':[c for c in checks if not c['pass']],'coverage':coverage,'independentCharges':independent,'sourceMatrix':source_matrix,'sourceDuplicateLines':[k for k,v in bykey.items() if len(v)>1]}
(folder/'reconciliation.json').write_text(json.dumps(output,indent=2)+'\n');print(json.dumps({'checks':len(checks),'failures':output['failures'],'coverage':coverage}))
if output['failures']:raise SystemExit(1)
