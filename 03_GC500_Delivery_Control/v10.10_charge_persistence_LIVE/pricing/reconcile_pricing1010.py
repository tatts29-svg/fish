"""Author: Andrew Fisher. Reconcile read-only same-record baseline/candidate extracts.

Usage: python reconcile_pricing1010.py BASELINE.json CANDIDATE.json [--out PATH]
Private snapshots are deliberately not stored in the repository.
"""
import argparse
import json
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument('baseline',type=Path)
p.add_argument('candidate',type=Path)
p.add_argument('--out',type=Path)
p.add_argument('--race-revenue-change',type=float,default=0)
p.add_argument('--workforce-forecast-cost-change',type=float,default=0)
p.add_argument('--workforce-current-cost-change',type=float,default=0)
p.add_argument('--rehire-classification-change',type=float,default=0)
a=p.parse_args()
b=json.loads(a.baseline.read_text());c=json.loads(a.candidate.read_text())
checks=[]
def check(name,actual,expected):
    same=abs(actual-expected)<.005 if isinstance(actual,(int,float)) and isinstance(expected,(int,float)) else actual==expected
    checks.append(dict(name=name,passed=same,actual=actual,expected=expected))
def delta(name,before,after,expected):check(name,round(after-before,2),expected)
def keyed(rows,key):return {key(r):r for r in rows}
check('The same native record was used',c['nativeVersion'],b['nativeVersion'])
check('Candidate integration controls pass',all(r['pass'] for r in c['checks']),True)
check('Candidate has no runtime errors',c['browserErrors'],[])
contracts=lambda s:keyed(s['contracts'],lambda r:str(r['rental_contract'])+'|'+str(r['line']))
br,cr=contracts(b),contracts(c)
check('Only verified P45 source line is added',sorted(set(cr)-set(br)),['9968862|131'])
check('No contract history is deleted',sorted(set(br)-set(cr)),[])
for key,old in br.items():
    new=cr.get(key,{})
    if key in ['9968862|4','9968862|94','9968862|100']:
        for field in ['rate_1','quantity','booked_delivery_date','start_date','branch_code']:
            check('Identity remap preserves '+key+' '+field,new.get(field),old.get(field))
    else:check('Unchanged source row '+key,new,old)
for key,asset,ref in [('9968862|4','1327212','P03'),('9968862|94','1322579','P51'),('9968862|100','1327215','P46')]:
    check('Correct current building allocation '+ref,[cr[key]['asset_no'],cr[key]['match']['key']],[asset,ref])
check('P45 exact source rate and quantity',[cr['9968862|131']['rate_1'],cr['9968862|131']['quantity']],[1426.07,1])

# Published source amounts: WC09 removes six stale FWF; the two undelivered
# buildings move to forecast; P45 replaces an onsite-only fallback in the ledger.
now_change=round(-540.42-2852.14+1426.07,2)
job_change=round(-540.42+1426.07,2)
delta('Global contract hire correction',b['contractFigures']['charge'],c['contractFigures']['charge'],now_change)
for field,change in [('revNow',now_change),('revJob',job_change)]:
    delta('P&L '+field,b['pl'][field],c['pl'][field],round(change+a.race_revenue_change,2))
delta('Costs ledger current customer charge',b['money']['charge']['total'],c['money']['charge']['total'],round(now_change+a.race_revenue_change,2))
delta('Finance customer job revenue',b['finance']['revenue']['job'],c['finance']['revenue']['job'],round(job_change+a.race_revenue_change,2))
for field in ['revenueTotal','forecastRevenueTotal']:
    delta('October invoice allocation '+field,b['oct'][field],c['oct'][field],round(job_change+a.race_revenue_change,2))
for field in ['costCandidateTotal','forecastCostTotal']:
    delta('October supplier cost allocation '+field,b['oct'][field],c['oct'][field],a.workforce_forecast_cost_change+(a.workforce_current_cost_change if field=='costCandidateTotal' else 0))
for field in ['revenueTotal','forecastRevenueTotal','costCandidateTotal','forecastCostTotal']:
    check('September allocation unchanged '+field,c['sep'][field],b['sep'][field])
allocated=[r for r in c['oct']['revenue'] if r['stream']=='Hire Revenue — approved building forecast']
check('October holds retain P65 and P67 forecast exactly once',[(r['branch'],r['amount'],r['extra']['forecastAmount']) for r in allocated],[('KINP',2852.14,2852.14)])
for field in ['direct','directJob','costNow','costJob']:
    check('Customer hire corrections do not invent direct cost '+field,c['pl'][field],b['pl'][field])
for field in ['known','toCome','job']:
    check('Finance direct costs remain unchanged '+field,c['finance'][field],b['finance'][field])
rev=lambda s:keyed(s['pl']['rev'],lambda r:r['key'])
rb,rc=rev(b),rev(c)
for key,old in rb.items():
    for field in ['now','job']:
        new=rc[key][field]
        change=(now_change if field=='now' else job_change) if key=='hire' else a.race_revenue_change if key=='install' else 0
        if key=='hire':change-=a.rehire_classification_change
        if key=='rehire':change+=a.rehire_classification_change
        if old[field] is None:check('Unpriced '+key+' '+field,new,None)
        else:delta('Revenue category '+key+' '+field,old[field],new,change)
branches=lambda s:keyed(s['branches']['rows'],lambda r:r['code'])
bb,bc=branches(b),branches(c)
for code,old in bb.items():
    for field,change in [('revenue',now_change),('revenueJob',job_change)]:
        # Race revenue belongs to its separately tested workforce allocation.
        if a.race_revenue_change and code=='STPS':continue
        delta('Branch '+code+' '+field,old[field],bc[code][field],change if code=='KINP' else 0)
    for field in ['cost','costJob']:
        workforce=(a.workforce_current_cost_change+(a.workforce_forecast_cost_change if field=='costJob' else 0)) if code=='KINP' else 0
        delta('Branch direct cost '+code+' '+field,old[field],bc[code][field],round(workforce,2))

itemkey=lambda r:(r['ref'],r['item'])
ib,ic=keyed(b['items'],itemkey),keyed(c['items'],itemkey)
check('No equipment scope silently added or removed',sorted(ic),sorted(ib))
for key,old in ib.items():
    new=ic[key]
    for field in ['quantity','received','delivery','physicalUnits']:
        check('Site truth unchanged '+str(key)+' '+field,new[field],old[field])
    check('Existing service charges unchanged '+str(key),new['charges'],old['charges'])
check('Pee panel full hire rate remains source-verified',c['peeHire']['amount'],4033.01)
check('Pee panels are six units once',c['peeHire']['quantity'],6)
check('WC09 FWF source allocation capped at four',[(r['quantity'],r['amount']) for r in ic[('WC09','FWF')]['hire']['lines']],[(4,360.28)])
check('Generator amounts and day windows unchanged',c['generators'],b['generators'])
def transport_prices(model):
    # Hire identity links change for P03/P04/P45/P51; no cartage rate or amount does.
    return {**model,'rows':[{k:v for k,v in r.items() if k!='lineKeys'} for r in model['rows']]}
check('Transport scope and prices unchanged',transport_prices(c['transport']),transport_prices(b['transport']))
for row in c['transport']['rows']:
    expected={'P03':'9968862|4','P04':'9968862|7','P45':'9968862|131','P51':'9968862|94'}.get(row['ref'])
    if expected:check('Transport reference links follow corrected hire '+row['id'],row['lineKeys'],[expected])
billb,billc=keyed(b['bill']['rows'],itemkey),keyed(c['bill']['rows'],itemkey)
for key,old in billb.items():
    new=billc[key]
    for field in ['hire','work','transport','total']:
        delta('Onsite package '+str(key)+' '+field,old[field],new[field],3522.60 if key[0]=='T0005' and field in ['hire','total'] else 0)
delta('Onsite includes previously omitted legitimate rehire period',b['bill']['known'],c['bill']['known'],3522.60)
for ref in ['GN?','T0109','AA','WC42','WC81']:
    check('Visible unresolved source coverage '+ref,any(h['ref']==ref and ('confirm' in h['charge'] or 'reconcile' in h['charge']) for h in c['bill']['holds']),True)
check('Missing inputs are not called complete',c['bill']['complete'],False)
check('All branch totals still reconcile',all(c['branches'].get('checks',{}).values()),True)
result=dict(author='Andrew Fisher',baselineSha256=b['sha256'],candidateSha256=c['sha256'],nativeVersion=c['nativeVersion'],checks=len(checks),pass_=all(r['passed'] for r in checks),failures=[r for r in checks if not r['passed']],effects=dict(currentHire=now_change,jobHire=job_change,onsiteRehirePeriod=3522.60,verifiedRaceRevenue=a.race_revenue_change,verifiedWorkforceForecastCost=a.workforce_forecast_cost_change,verifiedWorkforceCurrentCost=a.workforce_current_cost_change,verifiedRehireClassification=a.rehire_classification_change),totals={key:{'before':before,'after':after} for key,before,after in [('currentRevenue',b['pl']['revNow'],c['pl']['revNow']),('jobRevenue',b['pl']['revJob'],c['pl']['revJob']),('onsitePackage',b['bill']['known'],c['bill']['known']),('onsiteHolds',len(b['bill']['holds']),len(c['bill']['holds']))]})
if a.out:a.out.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
if not result['pass_']:raise SystemExit(1)
