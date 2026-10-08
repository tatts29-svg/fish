"""Author: Andrew Fisher. Source identity and bounded Schedule 7 changes."""
import copy,importlib.util,json,re,sys
from pathlib import Path
here=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('schedule950',here/'patch_v950.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
raw=Path(sys.argv[1]).read_text(encoding='utf-8-sig');old=json.loads(raw.split('const DATA = ',1)[1].split('\n',1)[0][:-1]);updated=m.update_data(old)
checks=[]
def check(name,ok):
 assert ok,name;checks.append(name)
check('Input untouched',old==json.loads(raw.split('const DATA = ',1)[1].split('\n',1)[0][:-1]))
for key in old:
 if key not in ['assets','plant_lines','unreferenced']:check('Other source field retained: '+key,updated[key]==old[key])
for a,b in zip(old['assets'],updated['assets']):
 if a['key']!='P45':check('Reference unchanged: '+a['key'],a==b)
 else:
  check('P45 docket corrected',b['events'][0]['dd']=='26122823')
  check('P45 native booking identity retained',a['events'][0]['booking801']['loads'][0]['truck_id']==b['events'][0]['booking801']['loads'][0]['truck_id'])
  check('P45 stable date order and allocated load',all(a['events'][0]['booking801'][k]==b['events'][0]['booking801'][k]for k in ['date','departure_order','location']))
for a,b in zip(old['plant_lines']['lines'],updated['plant_lines']['lines']):
 if a['key']not in ['T0109','T0266']:check('Other plant unchanged: '+a['key'],a==b)
 else:check('Plant identities/financial fields retained: '+a['key'],{k:v for k,v in a.items()if k!='events'}=={k:v for k,v in b.items()if k!='events'})
for a,b in zip(old['unreferenced'],updated['unreferenced']):
 if a['task_id']not in ['T0109','T0266']:check('Other source row unchanged: '+a['task_id'],a==b)
new=updated['unreferenced'][len(old['unreferenced']):]
check('Only two new demands',len(new)==2 and [x['task_id']for x in new]==['T0273','T0274'])
check('Three requested products, no actual units',sum(x['quantity_raw']for x in new)==3 and all(x['asset_numbers']==[] and not x.get('booking801')for x in new))
check('Customer and exact event date retained',all(x['customer']=='WAU'and x['date']=='2026-10-21'for x in new))
check('Explicit aircon subhire, no guessed supplier',new[1]['subhired950'] and 'SUB-HIRED' in new[1]['notes'] and not new[0]['subhired950'])
check('No guessed price or cost',all(x['transport_cost']is None and x['planning_only950']and not x.get('rate_per_week')for x in new))
check('No physical register entries invented',len(updated['assets'])==len(old['assets'])and len(updated['plant_lines']['lines'])==len(old['plant_lines']['lines']))
collision=copy.deepcopy(old);collision['plant_lines']['fencing_rows_not_plant'].append({'task_id':'T0273'})
try:m.update_data(collision);raise AssertionError('Fencing task collision accepted')
except AssertionError as e:check('Fencing-only task ID collision refused','Reserved new demand ID already exists' in str(e))
patched=m.patch(raw)
check('Correct footer',"+ ' · v9.50'; /* v8.19"in patched)
try:m.patch(patched);raise AssertionError('Duplicate patch accepted')
except AssertionError as e:check('Duplicate patch refused',str(e)=='Already applied')
check('No inline save or operational hook introduced','function schedule950'not in patched)
print(json.dumps({'author':'Andrew Fisher','passed':len(checks),'sourceOnly':True,'originalHash':m.HASH}))
