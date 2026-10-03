#!/usr/bin/env python3
"""Author: Andrew Fisher. Prove only the authorised fourteen schedule rows changed."""
import copy,json,hashlib,sys,re
from pathlib import Path
base=Path(sys.argv[1]);candidate=Path(sys.argv[2]);out=Path(sys.argv[3]) if len(sys.argv)>3 else Path('/workspace/private-wed7-bookings/source801_checks.json')
def data(p):
 t=p.read_text();m=re.search(r'const DATA\s*=\s*',t);assert m;return json.JSONDecoder().raw_decode(t[m.end():])[0]
a=data(base);b=data(candidate);restored=copy.deepcopy(b);events=[]
for row in restored['assets']+restored['plant_lines']['lines']:
 for i,e in enumerate(row['events']):
  if 'booking801' in e:
   book=e['booking801'];events.append((row['key'],e['task_id']));assert e['date']=='2026-10-07';assert e['item']==book['item'];assert int(e['quantity_display'])==book['quantity'];row['events'][i]=book['previous_schedule_event']
 if row['key']=='T0258':row['customers']=[]
checks=[{'name':'14 unique original events updated','pass':len(events)==len(set(events))==14},{'name':'Restoring source provenance returns exact prior DATA including prices positions allocations and all other dates','pass':restored==a},{'name':'No added or removed references','pass':[r['key'] for r in a['assets']+a['plant_lines']['lines']]==[r['key'] for r in b['assets']+b['plant_lines']['lines']]},{'name':'All operational asset arrays preserved','pass':all(x['asset_numbers']==y['asset_numbers'] for x,y in zip(a['assets']+a['plant_lines']['lines'],b['assets']+b['plant_lines']['lines']))}]
result={'author':'Andrew Fisher','base_sha256':hashlib.sha256(base.read_bytes()).hexdigest(),'candidate_sha256':hashlib.sha256(candidate.read_bytes()).hexdigest(),'checks':checks,'updated_events':events};out.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result));assert all(c['pass'] for c in checks)
