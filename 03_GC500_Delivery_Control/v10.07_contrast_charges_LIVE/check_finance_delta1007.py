"""Author: Andrew Fisher. Independent before/after financial invariants for the scoped fix."""
import json
from pathlib import Path

private=Path('/workspace/private-gc500-finance1007')
old=json.loads((private/'baseline-coverage-snapshot.json').read_text())
new=json.loads((private/'coverage-snapshot.json').read_text())
checks=[]
def check(name,value):checks.append(dict(name=name,pass_=bool(value)))
def delta(a,b,expected=0):return round(a-b,2)==round(expected,2)
amount=old['peeHire']['amount']
check('Same shared record; no native corrections in this release',old['nativeVersion']==new['nativeVersion'])
check('Existing pee-panel hire amount is unchanged',new['peeHire']['amount']==amount)
check('Six received pee panels valued in actual once',new['peeHire'].get('actualAmount')==amount and new['peeHire'].get('remainingAmount')==0)
check('Costs current Revenue rises by existing hire only',delta(new['money']['charge']['total'],old['money']['charge']['total'],amount))
check('P&L current Revenue rises by existing hire only',delta(new['pl']['revNow'],old['pl']['revNow'],amount))
check('Whole-job Revenue remains unchanged',new['pl']['revJob']==old['pl']['revJob'] and new['finance']['revenue']['job']==old['finance']['revenue']['job'])
check('Remaining pee-panel forecast falls by same amount',delta(new['finance']['revenue'].get('hireToCome979',0),old['finance']['revenue']['hireToCome979'],-amount))
oldrev={r['key']:r for r in old['pl']['rev']};newrev={r['key']:r for r in new['pl']['rev']}
for key,row in oldrev.items():
    n=newrev[key]
    check('P&L '+key+' existing job Revenue preserved',n['job']==row['job'])
    check('P&L '+key+' current Revenue classified correctly',delta(n['now'] or 0,row['now'] or 0,amount if key=='rehire' else 0))
check('Direct costs and overheads remain unchanged',all(new['pl'][k]==old['pl'][k]for k in ['direct','directJob','costNow','costJob','over','overJob']))
check('Supplier and other known cost model unchanged',new['money']['cost']==old['money']['cost'])
check('Service rates, quantities and amounts unchanged',new['plan']==old['plan'] and new['ticks']==old['ticks'])
check('Transport rates, coverage and money unchanged',new['transport']==old['transport'])
check('Generator hire model unchanged',new['generators']==old['generators'])
check('Contract source lines unchanged',new['contracts']==old['contracts'])
check('Existing onsite priced subtotal unchanged',new['bill']['known']==old['bill']['known'])
oldbranches={r['code']:r for r in old['branches']['rows']};newbranches={r['code']:r for r in new['branches']['rows']}
for branch,row in oldbranches.items():
    n=newbranches[branch]
    check(branch+' arrived Revenue classified once',delta(n['revenue'],row['revenue'],amount if branch=='KINP' else 0))
    check(branch+' forecast and Direct costs unchanged',all(n[k]==row[k]for k in ['revenueJob','cost','costJob']))
work=lambda r:'work'in r['charge'].lower()or'service'in r['charge'].lower()
workholds=[r for r in new['bill']['holds']if work(r)]
check('Unmatched arrived work scope has exact five explicit holds',set(r['ref']for r in workholds)=={'WC100','T0258','WB01','WB02','WB03'} and len(workholds)==5)
check('No invented work charge for own-use container',not any(r['ref']=='T0023'for r in workholds))
check('Original transport and hire holds remain visible',all(r in new['bill']['holds']for r in old['bill']['holds']))
check('No supplier quote 27172 imported',not new['quote27172'])
octpee=[r for r in new['oct']['revenue']if 'pee panels' in r.get('stream','').lower()]
check('October contains exactly one KINP pee-panel allocation',len(octpee)==1 and octpee[0]['branch']=='KINP' and octpee[0]['amount']==amount)
check('October received amount is actual with no remaining duplicate',len(octpee)==1 and octpee[0]['extra']['forecastAmount']==0 and octpee[0]['extra']['sources'][0]['actualAmount']==amount and len(octpee[0]['extra']['sources'])==1)
check('October allocation remains a Finance review, not an issued invoice',len(octpee)==1 and octpee[0]['extra']['status']=='review' and octpee[0]['extra']['invoiceStatus']=='unknown')
check('No September pee-panel allocation',not any('pee panels'in r.get('stream','').lower()for r in new['sep']['revenue']))
check('Unrelated October revenue allocations preserved',old['oct']['revenue']==[r for r in new['oct']['revenue']if r not in octpee])
check('Revenue stream sum equals Costs',round(sum(r['charge'] or 0 for r in new['money']['streams']),2)==new['money']['charge']['total'])
check('No browser errors or write attempts',not new['browserErrors']and not new['requestCounts']['blocked'])
result=dict(author='Andrew Fisher',baseline=old['sha256'],candidate=new['sha256'],nativeVersion=new['nativeVersion'],amountReclassified=amount,checks=checks,failures=[r for r in checks if not r['pass_']])
Path(__file__).with_name('evidence').joinpath('finance-delta-review.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(dict(checks=len(checks),failures=result['failures'],source=new['sha256'],nativeVersion=new['nativeVersion']),indent=2))
if result['failures']:raise SystemExit(1)
