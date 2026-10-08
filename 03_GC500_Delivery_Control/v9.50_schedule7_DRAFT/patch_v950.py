#!/usr/bin/env python3
"""Author: Andrew Fisher. Reviewed Schedule 7 facts; no operational writes."""
import copy,json,re,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent
sys.path.insert(0,str(BASE.parent/'toolchain'))
from rep import rep
HASH='485f5d885b88d836b63e85ad4062474a95a484022386efec7be62429f958edac'
SOURCE='GC500 26 Schedule (7).xlsx'
def provenance(sheet,row):
 return {'file':SOURCE,'sha256':HASH,'sheet':sheet,'row':row,'reviewed':'2026-10-09'}
def only(xs,what):
 assert len(xs)==1,what+' must resolve exactly once'
 return xs[0]
def append(current,words):
 return ' '.join(x for x in [current,words] if x)
def update_data(data):
 d=copy.deepcopy(data)
 assert 'schedule_review950' not in d,'Schedule 7 already applied'
 assert d['schedule_review6']['sha256']=='228801df246f21b29e6da196fa9c7c3a5ef492dc6b9aa814df0aceead67e2558','Requires reviewed Schedule 6'
 p45=only([e for a in d['assets'] if a['key']=='P45' for e in a['events'] if e['task_id']=='T0261'],'P45 event')
 assert p45['dd']=='26120528' and p45['date']=='2026-10-12'
 load=only(p45['booking801']['loads'],'P45 source booking')
 assert load['dd']=='26120528'
 # Keep the native booking ID: it is an identity, not an editable docket label.
 # Changing it would detach later crew, order or traffic records tied to that load.
 p45['dd']=load['dd']='26122823'
 p45['source_revision950']=provenance('Week 1',5)
 p45['booking801']['source']='Schedule 7'
 container=only([u for u in d['unreferenced']if u['task_id']=='T0266'],'container source')
 pe=only([e for a in d['plant_lines']['lines']if a['key']=='T0266'for e in a['events']if e['task_id']=='T0266'],'container movement')
 assert container['date']==pe['date']=='2026-10-13' and not container.get('dd') and not pe.get('dd')
 for obj in [container,pe]:
  obj['dd']='26121442';obj['source_revision950']=provenance('Week 1',13)
 # This is another detail of the already-counted source movement, not a new
 # carrier, truck or card-priced movement. The unreferenced row remains its
 # existing financial source home until actual transport information changes.
 pe['transport_metadata_only950']=True
 container['notes']=append(container.get('notes'),'DD 26121442 — Schedule 7.')
 pe['note']=append(pe.get('note'),'DD 26121442 — Schedule 7.')
 events=only([u for u in d['unreferenced']if u['task_id']=='T0109'],'Events source')
 ep=only([e for a in d['plant_lines']['lines']if a['key']=='T0109'for e in a['events']if e['task_id']=='T0109'],'Events movement')
 note='Schedule 7 adds forklift tynes; DD 26120976 (STRP) and DD 26122181 (EAGS).'
 # The Baseplan949 information area owns the single fleet-discrepancy message.
 # These source notes do not allocate another forklift or a numbered accessory.
 events['notes']=append(events.get('notes'),note)
 ep['note']=append(ep.get('note'),note)
 for obj in [events,ep]:obj['source_revision950']=provenance('Week 1',8)
 assert events['asset_numbers']==['1214298'],'Do not replace the known Events fleet'
 # Fencing-only movements share this namespace even though they are not plant
 # or unreferenced equipment. Check every source string before reserving IDs.
 used=set(re.findall(r'"(T\d{4})"',json.dumps(d)))
 for task,row,item,qty,location,subhired in [('T0273',45,'Fridge',1,'Fridge',False),('T0274',46,'Air Con',2,'Portable Aircon',True)]:
  assert task not in used,'Reserved new demand ID already exists: '+task
  d['unreferenced'].append({'task_id':task,'sheet':'Event Week','date':'2026-10-21','phase':'Event','product':'Furniture','discipline':'Furniture','item':item,'quantity_display':str(qty),'quantity_raw':qty,'quantity_flag':None,'location':location,'customer':'WAU','customers':['WAU'],'notes':'Customer: WAU. Site location is not stated.'+(' SUB-HIRED — supplier not specified.'if subhired else ''),'activity':None,'asset_numbers':[],'accessories':[],'why':'Schedule 7 customer request with no GC500 reference or allocated equipment.','date_as_written':None,'date_correction':None,'source_range':"'Event Week'!A"+str(row)+':I'+str(row),'transport_cost_text':None,'transport_cost':None,'source_revision950':provenance('Event Week',row),'planning_only950':True,'subhired950':subhired})
 d['schedule_review950']={'source':SOURCE,'sha256':HASH,'reviewed':'2026-10-09','comparison':'Schedule 6','sheets':12,'changed_cells':4,'new_rows':2,'applied':['P45 source docket','T0266 source docket','T0109 tynes and second-docket note','T0273 WAU fridge demand','T0274 WAU portable-aircon demand'],'held':['Events source fleet discrepancy does not replace known physical units or completion','WAU requests have no allocated fleet, site, contract or transport; no new charges','Native dates, cancellations, photos, WC20 units, VMS scope and approved arrival instructions remain authoritative']}
 return d
def patch(s):
 assert '"schedule_review950"'not in s,'Already applied'
 match=only(re.findall(r"\+ ' · v9\.(?:48|49)'; /\* v8\.19",s),'release footer')
 start=s.index('const DATA = ');end=s.index('\n',start);old=s[start:end]
 d=json.loads(old[len('const DATA = '):-1]);new=update_data(d)
 s=rep(s,old,'const DATA = '+json.dumps(new,ensure_ascii=False,separators=(',',':'))+';','Schedule 7 supported source facts',None)
 s=rep(s,"const ev = (a.events || []).filter(e => e.carrier || e.dd || e.transport_cost);", "const ev = (a.events || []).filter(e => e.carrier || (e.dd && !e.transport_metadata_only950) || e.transport_cost);",'A docket detail is not another priced carrier movement',None)
 s=rep(s,"const xUnrefRows = (DATA.unreferenced || []).map(r =>", "const xUnrefRows = (DATA.unreferenced || []).filter(r => !r.planning_only950).map(r =>",'Unallocated product requests are not transport loads',None)
 s=rep(s,match,"+ ' · v9.50'; /* v8.19",'release footer',None)
 return s
if __name__=='__main__':
 p=Path(sys.argv[1]);raw=p.read_bytes();bom=raw.startswith(b'\xef\xbb\xbf');out=patch(raw.decode('utf-8-sig'))
 p.write_bytes((b'\xef\xbb\xbf'if bom else b'')+out.encode())
 print('Schedule 7 source details and two unallocated WAU requests applied; no operational writes.')
