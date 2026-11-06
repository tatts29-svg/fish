"""Author: Andrew Fisher. Independent decimal checks of the private read-only model capture.

Usage: python validate_models.py private-models.json private-review-workbook.json private-result.json
No financial values are printed. The original Baseplan export is not certified by these checks.
"""
import json, sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

D = lambda x: Decimal(str(x or 0))
round2 = lambda x: D(x).quantize(Decimal('.01'), rounding=ROUND_HALF_UP)
total = lambda xs: round2(sum((D(x) for x in xs), Decimal(0)))
capture = json.loads(Path(sys.argv[1]).read_text())
m = capture['models']; p = m['pnl']; c = m['money']['charge']; k = m['money']['cost']
review = json.loads(Path(sys.argv[2]).read_text()); checks = []
def check(name, actual, expected):
    a, e = round2(actual), round2(expected)
    checks.append({'check': name, 'pass': a == e, 'actual': str(a), 'expected': str(e), 'difference': str(a-e)})

for side, fields in [('rev', [('now','revNow'),('job','revJob')]), ('cost',[('now','direct'),('job','directJob')])]:
    for field, key in fields: check(f'{side} {field} row sum', total(r[field] for r in p[side]), p[key])
check('Gross margin', D(p['revJob'])-D(p['directJob']), p['gm']['job'])
check('Net job difference', D(p['revJob'])-D(p['directJob'])-D(p['overJob'])-D(p['wages']['job']), p['diff']['job'])
for field, target in [('revenue','revNow'),('revenueJob','revJob')]:
    check('Branch '+field, total(b[field] for b in m['branchFinancial']['rows']), p[target])
check('Branch all-in costs', total(b['costJob'] for b in m['branchFinancial']['rows']), D(p['directJob'])+D(p['overJob'])+D(p['wages']['job']))
check('Branch contribution', total(b['contributionJob'] for b in m['branchFinancial']['rows']), p['diff']['job'])
for r in review['Branch tie-out'][1:-1]:
    actual=next(b for b in m['branchFinancial']['rows'] if b['code']==r[0])
    check(r[0]+' comparison-workbook current revenue',actual['revenue'],r[1])
    check(r[0]+' comparison-workbook job revenue',actual['revenueJob'],r[2])

quote_totals={q['quote']:total([l['total_price'] for g in q['groups'] for l in g['lines']]+[q.get('delivery_charge'),q.get('pickup')]) for q in m['supplierService']['quotes']}
check('Supplier quote projection total',total(quote_totals.values()),k['rehire'])
for group in ['rehire','pump','cons']:
    check('Supplier ledger allocation '+group,total(quote_totals[q] for q in p['qWords'][group]),p['qk'][group])
check('Non-fencing Rehire Revenue',total(g['rev'] for g in m['rehire']['groups'] if not g['what'].startswith('Fencing'))-D(c['servicing']),D(next(r for r in p['rev'] if r['key']=='rehire')['now'])-D(c['fencing']))
check('Event people source lines',total(l['amount_exact'] for l in m['eventScope']['lines']),m['eventScope']['people'])
check('Event support retained separately',D(m['eventScope']['total'])-D(m['eventScope']['people']),next(r['job'] for r in p['rev'] if r['key']=='event_support'))
check('Event scope branch split',total(r['job'] for r in m['scopeBranch']),m['eventScope']['total'])

paid={'toDate':[],'toCome':[]}; hours=[]
for r in m['financeRows']:
    if r['type'] in ['cna','salary']: hours.append(r['paid']); continue
    value=r['actualCost'] if r['status']=='confirmed' and r['actualCost'] is not None else r['calculatedCost']
    key='toDate' if r['date'] and r['date']<=p['asAt'] and r['status']!='forecast' else 'toCome'
    paid[key].append(value)
check('Labour hire to date',total(paid['toDate']),p['wages']['toDate'])
check('Labour hire remaining plus allowance',total(paid['toCome'])+D(m['labourAllowance']),p['wages']['toCome'])
check('Total priced labour plus allowance',total(paid['toDate']+paid['toCome'])+D(m['labourAllowance']),p['wages']['job'])
check('Coates hours remain hours',total(hours),p['wages']['hoursOnly'])
for kind in ['accommodation','meals','misc']:
    check('Recorded '+kind,total(r.get('amount') for r in m['ourCosts'] if r.get('kind')==kind and r.get('usable')),k[kind]['amount'])
ac=next(r for r in m['closeout']['rows'] if r['stream']=='Accommodation')
check('All-in overheads',D(ac['job'])+D(k['meals']['amount'])+D(k['misc']['amount']),p['overJob'])
t=m['transportPlan']; movements=t['rows']+t['planned']
check('Transport recorded rows',total(r.get('actual') for r in t['rows']),k['transport']['amount'])
check('Transport forecast allowances',total(r['forecast'].get('amount') for r in movements),t['forecast']['total'])
check('Transport all-in',D(k['transport']['amount'])+D(t['forecast']['total']),next(r['job'] for r in p['cost'] if r['key']=='transport'))
check('Transport Revenue component bridge',D(c['contracts'])-total(b['contract']+b['card'] for b in m['branches'])+D(c['transportArrived1006'])+D(c['uncontractedHire1007']),c['delivery'])
check('Transport Revenue from branch model',total(b['transport'] for b in m['branches']),c['delivery'])
held=[r for r in t['planned'] if r['forecast']['kind']=='held']
check('Planned held movements',len(held),t['forecast']['heldPlanned953'])
check('Demob held subset',sum(r['leg']=='demob' for r in held),t['demob']['noBasis'])

output=Path(sys.argv[3]).resolve();repo=Path(__file__).resolve().parents[2]
assert not output.is_relative_to(repo),'result must remain outside the checkout'
result={'author':'Andrew Fisher','checks':checks,'passed':sum(x['pass'] for x in checks),'total':len(checks),'limitations':['Checks compare current models and the shared comparison workbook; original private Baseplan export unavailable','Financial classification decisions and actual supplier invoices are not inferred','No operational records changed']}
output.write_text(json.dumps(result,indent=2)+'\n');output.chmod(0o600)
print(json.dumps({'passed':result['passed'],'total':result['total'],'failed_checks':[x['check'] for x in checks if not x['pass']]}))
sys.exit(0 if all(x['pass'] for x in checks) else 1)
