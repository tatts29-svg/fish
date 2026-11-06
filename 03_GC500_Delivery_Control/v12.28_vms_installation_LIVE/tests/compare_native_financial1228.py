#!/usr/bin/env python3
"""Author: Andrew Fisher. Independent decimal audit of private GET-only snapshots.

Usage: python3 compare_native_financial1228.py BEFORE AFTER --out PRIVATE_JSON
No job figures or source identities are embedded. Expected additions come from
baseline received, ungrouped boards and the unchanged existing VMS install rate.
This strict regression refuses to certify a changed native record. It is not an
invoice or an approval of unresolved source coverage.
"""
import argparse, collections, json, os, pathlib, sys
from decimal import Decimal, ROUND_HALF_UP
D=Decimal

def cents(value):
    if value is None or isinstance(value, bool): raise ValueError('Missing monetary input')
    n=D(str(value))
    if not n.is_finite(): raise ValueError('Non-finite monetary input')
    return int((n*100).quantize(D('1'),rounding=ROUND_HALF_UP))

def split(value, weights):
    total=cents(value); keys=[k for k,v in weights.items() if v>0]
    if not total: return {}
    if not keys: return {'—':total}
    den=sum(weights[k] for k in keys)
    out={k:int((D(total)*weights[k]/den).quantize(D('1'),rounding=ROUND_HALF_UP)) for k in keys}
    top=max(keys,key=lambda k:weights[k]);out[top]+=total-sum(out.values())
    return out

def weights(slots):
    out={}
    for s in slots:
        if s.get('key') in ('install','steps','levelling','demob') and s.get('value') is not None and s.get('branch'):
            out[s['branch']]=out.get(s['branch'],0)+cents(s['value'])
    return {k:D(v) for k,v in out.items()}

def frozen(x): return json.dumps(x,sort_keys=True,separators=(',',':'),ensure_ascii=False)
def without(x,*keys): return {k:v for k,v in x.items() if k not in keys}
def compare(before,after):
    checks=[]
    def check(label,good,detail=None):checks.append({'label':label,'pass':bool(good),**({'detail':detail} if detail is not None and not good else {})})
    def equal(label,a,b):check(label,a==b,{'before':a,'after':b})
    def change(label,a,b,want):equal(label,cents(b)-cents(a),want)
    b,a=before['models'],after['models']
    equal('Identical native version',before['version'],after['version'])
    equal('Identical native state',before['state_sha256'],after['state_sha256'])
    for label,snapshot in [('baseline',before),('candidate',after)]:
        equal(label+' model failures',snapshot['failures'],{})
        equal(label+' page errors',snapshot['browser']['errors'],[])
        equal(label+' blocked record writes',snapshot['browser']['counts']['blocked'],0)
        equal(label+' non-GET attempts',snapshot['browser']['nonGet'],[])
    # The expected scope comes only from the prior native equipment and financial data.
    grouped=[s for s in b['labourSlots'] if s.get('disc')=='Variable message signs' and s.get('key')=='install']
    rates={D(str(s['rate'])) for s in grouped if s.get('rate') is not None}
    check('One existing VMS installation card rate',len(rates)==1)
    if len(rates)!=1: return {'checks':checks,'pass':False}
    rate=next(iter(rates)); covered={s['ref'] for s in grouped}
    boards=[r for r in b['vmsEquipment']['boards'] if r.get('received') and not r.get('delivery') and r['key'] not in covered]
    contracts={(str(r['rental_contract']),str(r['line'])):r for r in b['contractRows']}
    expected=[]
    for r in boards:
        source=contracts[(str(r['contract']),str(r['line']))]
        expected.append({'ref':r['key'],'branch':source['branch_code'],'rate':rate,'value':cents(rate),'qty':1})
    check('Independent received-board scope is nonempty',bool(expected))
    delta=sum(r['value'] for r in expected)
    by_branch=collections.Counter()
    for r in expected:by_branch[r['branch']]+=r['value']
    new=[s for s in a['labourSlots'] if s.get('standaloneVms1228')]
    equal('Expected new standalone identities',sorted(s['ref'] for s in new),sorted(r['ref'] for r in expected))
    equal('Existing labour slots retained exactly',collections.Counter(frozen(s) for s in b['labourSlots']),collections.Counter(frozen(s) for s in a['labourSlots'] if not s.get('standaloneVms1228')))
    for r in expected:
        got=[s for s in new if s['ref']==r['ref']]
        check('One installation slot per received identity',len(got)==1)
        if len(got)!=1:continue
        s=got[0]
        equal('Installation only',s['key'],'install');equal('Original source branch',s['branch'],r['branch'])
        equal('Single physical unit',s['qty'],r['qty']);equal('Existing card rate preserved',D(str(s['rate'])),rate)
        equal('Independent per-reference half-up cents',cents(s['value']),r['value']);equal('Included current charge state',s['state'],'charged')
    for key in ('labourAllowance','ourCosts','costLines','transportPlan','demobTransport','eventScope','scopeBranch','supplierService','supplierHire','financeRows','service','buildingTransport','scopes','contractRows','references','contractFigures','pricingHolds','workPricing','vmsFinancial','financeAssets','operationalVms','vmsEquipment','branchRollup','branches'):
        equal('Preserved model: '+key,b[key],a[key])
    equal('Unchanged non-installation charge components',without(b['money']['charge'],'labour','labour_ticks','total'),without(a['money']['charge'],'labour','labour_ticks','total'))
    equal('Unchanged customer Direct costs',b['money']['cost'],a['money']['cost'])
    for key in ('labour','total'):change('Customer charge '+key,b['money']['charge'][key],a['money']['charge'][key],delta)
    equal('Additional priced installation slots',a['money']['charge']['labour_ticks']-b['money']['charge']['labour_ticks'],len(expected))
    change('Customer difference',b['money']['difference'],a['money']['difference'],delta)
    for key in ('priced','recorded','job'):change('Shared labour '+key,b['labourRevenue'][key],a['labourRevenue'][key],delta)
    equal('No duplicate remaining labour forecast',b['labourRevenue']['remaining'],a['labourRevenue']['remaining'])
    for key in b['labourRevenue']['sums']:change('Labour component '+key,b['labourRevenue']['sums'][key],a['labourRevenue']['sums'][key],delta if key=='install' else 0)
    for key in ('cleaning','fire_ext','other','unknown'):equal('Unchanged tick '+key,b['labourTicks'][key],a['labourTicks'][key])
    change('Installation tick amount',b['labourTicks']['install']['amount'],a['labourTicks']['install']['amount'],delta)
    change('All work tick amount',b['labourTicks']['total'],a['labourTicks']['total'],delta)
    for key in ('ticks',):equal('Additional work tick count',a['labourTicks'][key]-b['labourTicks'][key],len(expected))
    for before_row,after_row in zip(b['pnl']['rev'],a['pnl']['rev']):
        equal('Ledger identity retained',before_row['key'],after_row['key'])
        for key in ('now','job'):change('Ledger '+before_row['key']+' '+key,before_row[key],after_row[key],delta if before_row['key']=='install' else 0)
    for key in ('revNow','revJob'):change('P&L '+key,b['pnl'][key],a['pnl'][key],delta)
    for key in ('cost','over','overJob','direct','directJob','costNow','costJob','wages'):equal('P&L costs retained '+key,b['pnl'][key],a['pnl'][key])
    for k in ('now','job'):
        change('P&L difference '+k,b['pnl']['diff'][k],a['pnl']['diff'][k],delta)
        change('P&L gross margin '+k,b['pnl']['gm'][k],a['pnl']['gm'][k],delta)
    equal('Closeout unchanged outside customer Revenue',without(b['closeout'],'revenue'),without(a['closeout'],'revenue'))
    equal('Closeout forecast scope retained',without(b['closeout']['revenue'],'record','job'),without(a['closeout']['revenue'],'record','job'))
    for k in ('record','job'):change('Closeout Revenue '+k,b['closeout']['revenue'][k],a['closeout']['revenue'][k],delta)
    for key in ('revenueNow','revenueJob'):change('Rehire denominator '+key,b['rehire'][key],a['rehire'][key],delta)
    equal('Rehire groups and costs retained',without(b['rehire'],'revenueNow','revenueJob','totals'),without(a['rehire'],'revenueNow','revenueJob','totals'))
    equal('Rehire amounts retained',without(b['rehire']['totals'],'share','shareNow'),without(a['rehire']['totals'],'share','shareNow'))
    for key in b['transport']:
        if key not in ('M','X','H','P'):equal('Transport projection retained '+key,b['transport'][key],a['transport'][key])
    # Independently reproduce the EXISTING cost weighting; never freeze branch allocations.
    wb=weights(b['labourSlots']);wa=weights(b['labourSlots']+new)
    equal('Only expected weights change',{k:int(wa.get(k,0)-wb.get(k,0)) for k in set(wb)|set(wa) if wa.get(k,0)!=wb.get(k,0)},dict(by_branch))
    current_cost=collections.Counter();job_cost=collections.Counter()
    equal('Number of source cost rows unchanged',len(b['legacyFinance']['costs']),len(a['legacyFinance']['costs']))
    for br,ar in zip(b['legacyFinance']['costs'],a['legacyFinance']['costs']):
        equal('Cost source totals and attributes retained',without(br,'by'),without(ar,'by'))
        if br['kind']!='expenses':equal('Direct branch cost allocation retained '+br['kind'],br['by'],ar['by']);continue
        bnow,anow=split(br['toDate'],wb),split(br['toDate'],wa)
        bcome,acome=split(br['toCome'],wb),split(br['toCome'],wa)
        bjob={k:bnow.get(k,0)+bcome.get(k,0) for k in set(bnow)|set(bcome)}
        ajob={k:anow.get(k,0)+acome.get(k,0) for k in set(anow)|set(acome)}
        equal('Independent existing baseline expense allocation',bjob,{k:cents(v) for k,v in br['by'].items()})
        equal('Independent corrected expense allocation',ajob,{k:cents(v) for k,v in ar['by'].items()})
        for k in set(wb)|set(wa):current_cost[k]+=anow.get(k,0)-bnow.get(k,0);job_cost[k]+=ajob.get(k,0)-bjob.get(k,0)
    equal('Existing people attribution retained',b['legacyFinance']['people'],a['legacyFinance']['people'])
    for key in ('toDate','toCome','job'):equal('Global Finance cost '+key,b['legacyFinance']['costTotal'][key],a['legacyFinance']['costTotal'][key])
    for br,ar in zip(b['branchFinancial']['rows'],a['branchFinancial']['rows']):
        branch=br['code'];equal('Branch identity retained',branch,ar['code'])
        for k in ('revenue','revenueJob'):change('Branch '+branch+' '+k,br[k],ar[k],by_branch[branch])
        change('Existing branch current allocation '+branch,br['cost'],ar['cost'],current_cost[branch])
        change('Existing branch job allocation '+branch,br['costJob'],ar['costJob'],job_cost[branch])
        change('Branch current contribution '+branch,br['contribution'],ar['contribution'],by_branch[branch]-current_cost[branch])
        change('Branch job contribution '+branch,br['contributionJob'],ar['contributionJob'],by_branch[branch]-job_cost[branch])
    for key in ('cost','costJob'):equal('Global branch costs retained '+key,b['branchFinancial']['total'][key],a['branchFinancial']['total'][key])
    for key in ('revenue','revenueJob','contribution','contributionJob'):change('Global branch '+key,b['branchFinancial']['total'][key],a['branchFinancial']['total'][key],delta)
    # Exact currency streams, separate from the existing whole-dollar residual display.
    for br,ar in zip(b['money']['streams'],a['money']['streams']):
        equal('Stream identity retained',br['key'],ar['key'])
        want=delta if br['key']=='crew' else 0
        for key in ('charge','difference'):change('Stream exact cents '+br['key']+' '+key,br[key],ar[key],want)
        equal('Stream cost retained '+br['key'],br['cost'],ar['cost'])
    # Existing scope holds and all independent model reconciliation outcomes remain visible.
    equal('Assurance coverage issues retained',b['assurance']['issues'],a['assurance']['issues'])
    equal('Assurance calculation state',a['assurance']['state'],'pass')
    for r in a['assurance']['checks']:check('Cent check '+r['label'],r['status']=='pass' and r['variance']==0)
    for k in ('pnl','branchFinancial'):check(k+' checks',all(a[k]['checks'].values()))
    for r in a['reconciliation']['ties']:check('Shared reconciliation '+r['what'],r['ok'])
    check('All shared reconciliations pass',a['reconciliation']['ok'] and not a['reconciliation']['bad'])
    equal('No new unpriced supplemental installation',a['vmsInstallation']['unknown'],0)
    equal('No supplemental coverage ambiguity',a['vmsInstallation']['issues'],[])
    equal('Supplemental total matches independent Decimal sum',cents(a['vmsInstallation']['total']),delta)
    oldrows=collections.Counter(frozen(r) for r in b['onsiteComplete']['rows'])
    afterrows=collections.Counter(frozen(r) for r in a['onsiteComplete']['rows'])
    equal('Every old onsite financial row retained',sum((oldrows-afterrows).values()),0)
    equal('Only standalone onsite rows added',len(a['onsiteComplete']['rows'])-len(b['onsiteComplete']['rows']),len(expected))
    equal('Existing onsite coverage holds retained',b['onsiteComplete']['holds'],a['onsiteComplete']['holds'])
    change('Onsite known charges',b['onsiteComplete']['known'],a['onsiteComplete']['known'],delta)
    return {'author':'Andrew Fisher','baseline':{'hash':before['source_sha256'],'at':before['at'],'version':before['version']},'candidate':{'hash':after['source_sha256'],'at':after['at'],'version':after['version']},'expected':{'received_ungrouped_count':len(expected),'per_reference_cents':[{**r,'rate':str(r['rate'])} for r in expected],'delta_cents':delta,'branch_cost_current_delta_cents':dict(current_cost),'branch_cost_job_delta_cents':dict(job_cost)},'checks':checks,'pass':all(r['pass'] for r in checks),'passed':sum(r['pass'] for r in checks),'count':len(checks)}

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('before');parser.add_argument('after');parser.add_argument('--out',required=True)
    args=parser.parse_args();out=pathlib.Path(args.out).resolve();repo=pathlib.Path(__file__).resolve().parents[3]
    if repo==out or repo in out.parents:parser.error('OUT must be private and outside the repository')
    result=compare(json.loads(pathlib.Path(args.before).read_text()),json.loads(pathlib.Path(args.after).read_text()))
    out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,indent=2,default=str));os.chmod(out,0o600)
    print(json.dumps({'passed':result.get('passed',sum(r['pass'] for r in result['checks'])),'checks':len(result['checks']),'pass':result['pass']}))
    return 0 if result['pass'] else 1
if __name__=='__main__':sys.exit(main())
