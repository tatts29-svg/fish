#!/usr/bin/env python3
"""Author: Andrew Fisher. Read-only source and preservation checks."""
from pathlib import Path
import json,sys,hashlib
ROOT=Path(__file__).resolve().parents[1]
def data(p):
 s=Path(p).read_text();i=s.index('const DATA = ')+len('const DATA = ');return json.JSONDecoder().raw_decode(s[i:])[0]
base=data(sys.argv[1]);now=data(sys.argv[2]);source=json.loads((ROOT/'cw2_plan_02Oct2026.json').read_text());checks=[]
def check(name,condition):checks.append({'name':name,'pass':bool(condition)})
w=next(w for w in now['fencing']['week_sheets'] if w['sheet']=='CON WK2');u=w['plan_update'];rows=[r for d in u['rows_by_day'] for r in d['rows']]
check('26 unique dated tasks; no duplicate imports',len(rows)==26 and len({r['id'] for r in rows})==26 and rows==source['rows'])
check('Source dates 5–9 Oct 2026, Monday closed without quantities',set(r['date'] for r in rows)=={f'2026-10-{d:02}' for d in range(5,10)} and rows[0]['fields']=={} and 'site closed' in rows[0]['description'])
expected=[{}, {'Temporary Fence (m) — Clean':366,'Temporary Fence (m) — Braced for Scrim':171,'Temporary Fence (m) — Relocation':100,'Vehicle Gates':2,'Crowd Control Barriers (m) — Event':87,'Crowd Control Barriers (m) — Flat Feet':45}, {'Temporary Fence (m) — Clean':120,'Temporary Fence (m) — Braced for Scrim':100,'Vehicle Gates':2,'Ped. Gates':2}, {'Temporary Fence (m) — Clean':147,'Temporary Fence (m) — Braced for Scrim':213,'Temporary Fence (m) — Relocation':123,'Vehicle Gates':3,'Ped. Gates':2,'Crowd Control Barriers (m) — Event':48}, {'Temporary Fence (m) — Clean':100,'Temporary Fence (m) — Braced for Scrim':27,'Vehicle Gates':3}]
check('Five day totals exactly match the weekly summary', [d['totals'] for d in w['days']]==expected)
sums={}
for d in w['days']:
 for k,v in d['totals'].items():sums[k]=sums.get(k,0)+v
check('Nine weekly quantities reconcile without mixing units',all(sums.get(k,0)==v for k,v in w['totals'].items()) and w['totals']==source['reported_weekly_totals'])
check('Three source conflicts are visible and not settled',len(u['conflicts'])==3 and all(c['state']=='awaiting confirmation' for c in u['conflicts']))
get=lambda id:next(r for r in rows if r['id']==id)
check('QPS initial work is not held behind its later GEMA/COW stage',all(r['kind']=='condition' for r in get('qps')['requirements']))
check('Structure sign-offs kept on all three pit rows and walkthroughs',all(any(c['kind']=='hold' and 'sign' in c['text'] for c in get(id)['requirements']) for id in ['pit-stairs','fire-hydrant','toilet-infill','s19-walkthrough','s20-walkthrough','s21-walkthrough']))
check('Both Helen Park vehicle gates retain keep-open condition',all(any('Keep gates open' in c['text'] for c in get(id)['requirements']) for id in ['helen-perimeter','s23-cz']))
check('Deferred flat-feet work remains conditional',get('club-creek')['requirements'][0]['kind']=='condition' and 'later' in get('club-creek')['requirements'][0]['text'])
check('No quantity invented for stockpile demarcation or available scrim',all(not get(id)['fields'] for id in ['s04-demarc','scrim-wed','scrim-fri']))
check('Historical CW5 and unrelated weeks unchanged', [w for w in now['fencing']['week_sheets'] if w['sheet']!='CON WK2']==[w for w in base['fencing']['week_sheets'] if w['sheet']!='CON WK2'])
restored=json.loads(json.dumps(now));f=restored['fencing'];index=next(i for i,w in enumerate(f['week_sheets']) if w['sheet']=='CON WK2');f['week_sheets'][index]=u['previous_programme'];f['installation_plans']['plans']=[p for p in f['installation_plans']['plans'] if p['week']!='CON WK2'];del f['installation_plans']['disagreements_CW2']
check('Reversing only the approved plan update restores all original DATA',restored==base)
check('Commercial rates, actual dockets, bookings, assets and maps untouched', all(now[k]==base[k] for k in now if k!='fencing'))
result={'author':'Andrew Fisher','candidateSha256':hashlib.sha256(Path(sys.argv[2]).read_bytes()).hexdigest(),'sourceSha256':source['source_sha256'],'checks':checks}
(ROOT/'evidence/source803_checks.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2));assert all(c['pass'] for c in checks)
