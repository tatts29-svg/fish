"""Author: Andrew Fisher. Verify a planned six-unit addition using independent before/after source arithmetic."""
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
import json, sys

before=json.loads(Path(sys.argv[1]).read_text()); after=json.loads(Path(sys.argv[2]).read_text())
b=before['domains']; a=after['domains']; checks=[]
def check(name,ok): checks.append({'name':name,'pass':bool(ok)})
def cents(value):return int((Decimal(str(value))*100).quantize(Decimal('1'),rounding=ROUND_HALF_UP))
def extended(rate,quantity):return cents(Decimal(str(rate))*quantity)
def same_money(x,y):return cents(x)==cents(y)
def wc(r):return r.get('ref')=='WC09' and r.get('item')=='FWF'
def contract(d):return next(r for r in d['contracts'] if str(r['row']['rental_contract'])=='9968955' and r['row']['line']==102)
def ledger(d,key):return next(r for r in d['pl']['rev'] if r['key']==key)
extra=6
hire=extended(contract(b)['row']['rate_1'],extra)
work={r['key']:extended(r['rate'],extra) for r in b['labour']['slots'] if wc(r) and r['key'] in ('install','demob')}
transport={r['leg']:extended(r['rate'],extra) for r in b['buildingTransport']['rows'] if wc(r)}
expected={'rehire':hire,'install':sum(work.values()),'transport':sum(transport.values())}
total=sum(expected.values())
check('before and after are actual public reads',before['counts']['page']==after['counts']['page']==0)
check('both reads have no errors or write attempts',not before['errors'] and not after['errors'] and before['counts']['blocked']==after['counts']['blocked']==0)
check('both reads leave native data unchanged',before['unchanged'] and after['unchanged'])
check('native version advances for authorised update',after['nativeVersion']>before['nativeVersion'])
check('rate cards and entered rates unchanged',a['rates']==b['rates'])
check('every source contract row unchanged',[r['row'] for r in a['contracts']]==[r['row'] for r in b['contracts']])
check('every current contract charge amount unchanged',[r['charge']['amount'] for r in a['contracts']]==[r['charge']['amount'] for r in b['contracts']])
check('all actual customer charges unchanged',same_money(a['money']['charge']['total'],b['money']['charge']['total']))
check('all current customer charge categories unchanged',all(a['money']['charge'].get(k)==v for k,v in b['money']['charge'].items() if k not in ('card_hire','card_transport')))
actual_cost=lambda d:{**d['money']['cost'],'transport':{k:v for k,v in d['money']['cost']['transport'].items() if k!='card_cost'}}
check('all recorded Direct costs unchanged',actual_cost(a)==actual_cost(b))
card=next(r for r in b['rates']['sourceMatch']['items'] if r['item']=='FWF' and r['discipline']=='Toilets & amenities')
check('unposted card transport comparison grows only with planned scope',cents(a['money']['cost']['transport']['card_cost'])-cents(b['money']['cost']['transport']['card_cost'])==extended(card['transport']['cost'],extra))
check('P&L current revenue and Direct cost unchanged',same_money(a['pl']['revNow'],b['pl']['revNow']) and same_money(a['pl']['costNow'],b['pl']['costNow']))
check('all P&L actual ledger amounts unchanged',all(r['now']==ledger(b,r['key'])['now'] for r in a['pl']['rev']))
for key,value in expected.items():check(key+' forecast equals independently extended source rates',cents(ledger(a,key)['job'])-cents(ledger(b,key)['job'])==value)
check('other forecast revenue ledgers unchanged',all(r['job']==ledger(b,r['key'])['job'] for r in a['pl']['rev'] if r['key'] not in expected))
check('job revenue increases by six units once',cents(a['pl']['revJob'])-cents(b['pl']['revJob'])==total)
check('Costs forecast agrees with P&L',cents(a['job']['revenue']['job'])-cents(b['job']['revenue']['job'])==total)
check('supplier Direct-cost job forecast unchanged',same_money(a['pl']['costJob'],b['pl']['costJob']))
check('WC09 received charges and mixed-item quantities unchanged',a['wc09']['onsite']==b['wc09']['onsite'])
check('WC09 supplier entry and physical identities unchanged',a['wc09']['supplied']==b['wc09']['supplied'] and a['wc09']['assetNumbers']==b['wc09']['assetNumbers'] and sorted((r.get('item'),r.get('assetNo'),r.get('owner')) for r in a['wc09']['units'] if r.get('physical'))==sorted((r.get('item'),r.get('assetNo'),r.get('owner')) for r in b['wc09']['units'] if r.get('physical')))
check('six FWF are remaining in supplier fulfilment',sum(r['remaining'] for r in a['supplier']['remaining'] if wc(r))==extra)
check('dated supplier receipts unchanged',sorted((r.get('ref'),r.get('item'),r.get('date'),r.get('count')) for r in a['supplier']['receipts'])==sorted((r.get('ref'),r.get('item'),r.get('date'),r.get('count')) for r in b['supplier']['receipts']))
check('generator pricing and input rows unchanged',a['generator']==b['generator'] and a['generatorInputs']==b['generatorInputs'])
check('fencing and source-approved supplier pricing unchanged',a['fencing']==b['fencing'] and a['supplierPricing']==b['supplierPricing'])
for label,d in [('before',before),('after',after)]:
 for domain,values in d['reconciliation'].items():check(label+' '+domain+' reconciles',all(values.values()))
# The known hire scope must remain Rehire, with no change to recorded revenue.
sc=contract(a)['charge'];check('contract split is four received and six planned',sc['billableQuantity1010']==4 and sc['plannedQuantity1017']==10 and cents(sc['remaining'])==hire)
rows=a['job']['revenue']['allocationForecast1010']['scope1017']['rows']
check('planned hire has one EP Rehire allocation to KINP',len(rows)==1 and rows[0]['ref']=='WC09' and rows[0]['quantity']==extra and rows[0]['owner']=='event-portables' and rows[0]['ledger']=='1010' and rows[0]['branch']=='KINP' and cents(rows[0]['amount'])==hire)
byb={r['code']:r for r in b['branches']['rows']};bya={r['code']:r for r in a['branches']['rows']}
check('all branch actual revenues unchanged',all(same_money(r['revenue'],byb[k]['revenue']) for k,r in bya.items()))
check('additional customer forecast assigned once to KINP',cents(bya['KINP']['revenueJob'])-cents(byb['KINP']['revenueJob'])==total and all(same_money(r['revenueJob'],byb[k]['revenueJob']) for k,r in bya.items() if k!='KINP'))
result={'author':'Andrew Fisher','checks':checks,'failures':[r for r in checks if not r['pass']],'beforeVersion':before['nativeVersion'],'afterVersion':after['nativeVersion'],'expectedCents':{'hire':hire,'work':work,'transport':transport,'customerTotal':total}}
Path(sys.argv[3]).write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'checks':len(checks),'failures':result['failures'],'beforeVersion':before['nativeVersion'],'afterVersion':after['nativeVersion']}))
if result['failures']:raise SystemExit(1)
