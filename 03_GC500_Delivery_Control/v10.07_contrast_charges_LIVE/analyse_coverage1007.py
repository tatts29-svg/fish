"""Author: Andrew Fisher. Classify the GET-only snapshot without changing prices or records."""
import collections
import csv
import json
from pathlib import Path

private = Path('/workspace/private-gc500-finance1007')
s = json.loads((private / 'coverage-snapshot.json').read_text())
items = {(i['ref'], i['item']): i for i in s['items']}
held = [r for r in s['transport']['rows'] if r['state'] == 'held']
arrived = [r for r in held if r['receivedQuantity1006'] > 0]
pending = [r for r in held if not r['receivedQuantity1006']]
register = []
for row in held:
    register.append(dict(scope='Arrived equipment' if row['receivedQuantity1006'] else 'Pending equipment',
        ref=row['ref'], item=row['item'], category='Transport Revenue',
        charge=row['leg'], quantity=row['receivedQuantity1006'] or row['quantity'],
        known_rate=row.get('rate'), state='Rate / coverage unresolved',
        reason='; '.join(row['reasons']), action='Confirm exact customer rate or link existing contract coverage; do not add a second charge.'))
for row in s['bill']['holds']:
    if row['charge'] in ('Delivery', 'Pickup'):
        continue
    if 'work' in row['charge'].lower() or 'service' in row['charge'].lower():
        continue  # The source-reviewed work gaps are described once below.
    state = 'Hire allocation / quantity unresolved'
    action = 'Match the current physical item and quantity to existing contract charges before adding any revenue.'
    if row['ref'] == 'Job':
        state = 'Not authorised / not added'
        action = 'Damage waiver is not configured or added. User asked to explain BOQ differences, not add a waiver.'
    if row['item'].startswith('Accessory'):
        action = 'Confirm exact item type, quantity and whether included in the building or separately priced; do not price a generic description.'
    if row['ref'] == 'FL02':
        action = '1197839 also appears at T0004. Its contract hire is already consumed once; resolve reference alias, not add duplicate hire.'
    register.append(dict(scope='Job policy' if row['ref']=='Job' else 'Arrived equipment',
        ref=row['ref'],item=row['item'],category='Hire Revenue',charge=row['charge'],
        quantity=items.get((row['ref'],row['item']),{}).get('received'),known_rate=None,
        state=state,reason=row['charge'],action=action))
for ref,item in [('WC100','FWF Trailer'),('T0258','3.0m Cont'),('WB01','TL2'),('WB02','TL2'),('WB03','TL2')]:
    i=items[(ref,item)]
    register.append(dict(scope='Arrived equipment',ref=ref,item=item,category='Installation / other work',
        charge='Work rate / scope',quantity=i['received'],known_rate=None,
        state='Unmatched work scope; not proven free',reason=i['card']['state'],
        action='Confirm applicable service charge or explicit inclusion. Empty offered rows do not establish a free service.'))
pee_classification_gap=round(s['peeHire']['amount']-s['peeHire'].get('actualAmount',0),2)
if pee_classification_gap:
    register.append(dict(scope='Arrived equipment',ref='WC09',item='Pee Panel',category='Rehire Revenue',
        charge='Actual / forecast classification',quantity=6,known_rate=s['peeHire']['rate'],
        state='Existing priced amount still forecast',reason='Six installed; approved hire 4033.01 is in job forecast only, while onsite package includes it.',
        action='Reclassify the existing amount into arrived Revenue once; keep whole-job total and supplier costs unchanged.'))
for r in s['labour']['missingHours']:
    register.append(dict(scope='Past/current labour' if r['date']<=s['day'] else 'Future labour',
        ref=r['person'],item=r['date'],category='Direct costs — labour',charge='Hours',quantity=None,known_rate=None,
        state='Hours missing',reason=r['id'],action='Enter actual or planned shift hours from evidence; do not invent hours.'))

(private/'coverage-register.json').write_text(json.dumps(register,indent=2)+'\n')
with (private/'coverage-register.csv').open('w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(register[0]));w.writeheader();w.writerows(register)

auto=collections.defaultdict(lambda:dict(item_groups=0,pieces=0,amount=0))
for i in s['items']:
    if not i['received']:continue
    for r in i['charges']['rows']:
        if r['key'] not in ('install','levelling','cleaning','demob'):continue
        entry=auto[r['key']];entry['item_groups']+=1;entry['pieces']+=min(i['received'],r['qty']);entry['amount']+=round(r['rate']*min(i['received'],r['qty'])+1e-9,2)
for r in auto.values():r['amount']=round(r['amount'],2)
labour_unpriced=[r for r in s['labourRows'] if r['calculatedCost'] is None]
summary=dict(author='Andrew Fisher',source=s['sha256'],at=s['at'],nativeVersion=s['nativeVersion'],
    checkedItemGroups=len(s['items']),arrivedItemGroups=sum(i['received']>0 for i in s['items']),
    controlsPassed=sum(r['pass'] for r in s['checks']),controlsTotal=len(s['checks']),
    serviceAutoIncluded=auto,manualStairs=True,
    transport=dict(arrivedHeldLegs=len(arrived),arrivedHeldReferences=len({r['ref'] for r in arrived}),
        pendingHeldLegs=len(pending),pendingHeldReferences=len({r['ref'] for r in pending}),
        includedArrivedAdditional=s['transport']['actualAdditional1006'],remainingAdditional=s['transport']['remainingAdditional1006']),
    onsitePricedSubtotal=s['bill']['known'],onsiteDisplayedHolds=len(s['bill']['holds']),
    hireAllocationHolds=sum(r['charge'].startswith('Hire') for r in s['bill']['holds']),
    serviceScopeNotProvenFree=5,onsitePeeHireForecastClassification=pee_classification_gap,
    labourDirectCosts=dict(missingHours=s['labour']['missingHoursCount'],
        missingHoursPastOrCurrent=sum(r['date']<=s['day'] for r in s['labour']['missingHours']),
        missingHoursFuture=sum(r['date']>s['day'] for r in s['labour']['missingHours']),
        shiftsWithHoursButNoCostRate=len(labour_unpriced),
        pastOrCurrentUnpricedShifts=sum(r['date']<=s['day'] for r in labour_unpriced),
        futureUnpricedShifts=sum(r['date']>s['day'] for r in labour_unpriced),
        staleOrOrphanReviews=s['labour']['orphanCount']),
    exclusions=['Stairs require manual selection.',
        'FWF card has install and demob only; no extra level or cleaning rate.',
        'Forklift card labour is N/A; do not invent installation.',
        'T0023 hire is approved Coates own use.',
        'Included waste tank hire is not a second toilet-block hire.',
        'Damage waiver was not authorised or added.',
        'Supplier quotations are Direct costs, not customer rates.'],
    privateRegister=str(private/'coverage-register.json'),
    verdict='Applicable priced arrived services reconcile, but coverage is partial: rate/scope/quantity/allocation gaps remain.'+(' Existing pee-panel hire is still classified as forecast.' if pee_classification_gap else ' Existing pee-panel hire is included in arrived Revenue once.'))
(private/'coverage-analysis.json').write_text(json.dumps(summary,indent=2)+'\n')
Path(__file__).with_name('evidence').joinpath('coverage-analysis.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
