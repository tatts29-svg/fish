# Author: Andrew Fisher. Source-bound schedule delta; current records/allocations remain authoritative.
import sys,os,re,json,hashlib,datetime
from pathlib import Path
import openpyxl
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep as checked_rep
def rep(s,a,b):return checked_rep(s,a,b,'v8.75 schedule and handling',sys.argv[1])
p=Path(sys.argv[1]);s=p.read_text();assert 'function asset873Numbers(' in s and 'function handling875Set(' not in s
paths=[Path(os.environ[k]) for k in ['V875_PREVIOUS','V875_SCHEDULE']]
assert hashlib.sha256(paths[0].read_bytes()).hexdigest()=='129d27290d6a86aa44dc3a933eca41086f7005e7138919fad20087a077c985c7'
assert hashlib.sha256(paths[1].read_bytes()).hexdigest()=='6383ebdd66b2293453de07f85fd1812398d171c7ab75b2fad22196bbca8d4761'
books=[openpyxl.load_workbook(x,read_only=True,data_only=True,keep_links=False) for x in paths]
m=re.search(r'const DATA = (\{.*?\});\n',s);D=json.loads(m.group(1));before=json.loads(m.group(1));log=[]
def txt(x):return re.sub(r'\s+',' ',str(x or '')).strip()
def day(x):return x.date().isoformat() if isinstance(x,datetime.datetime) else x.isoformat() if isinstance(x,datetime.date) else None
def row(x,i):return x[i] if len(x)>i else None
def match(sheet,values,rn):
 ref=re.match(r'([A-Z]{1,4}\d{1,3})\b',txt(row(values,4)));ref=ref.group(1) if ref else None;dt=day(row(values,0));item=txt(row(values,2));parents=D['assets']+D['plant_lines']['lines'];hits=[]
 for a in parents:
  if ref and a['key']!=ref:continue
  for e in a.get('events',[]):
   if e.get('sheet')==sheet and e.get('item','').strip()==item and (e.get('date')==dt or ref and e.get('phase')=='Build'):
    if not ref and (a.get('product','').strip()!=txt(row(values,1)) or e.get('date')!=dt):continue
    hits.append((a,e))
 ranges={u['task_id']:u.get('source_range','') for u in D['unreferenced']}
 exact=[x for x in hits if re.search(r'!A'+str(rn)+r':',x[1].get('source_range') or ranges.get(x[1].get('task_id'),''))]
 if not exact and len(hits)>1:hits=[x for x in hits if str(x[1].get('quantity_raw',x[1].get('quantity_display')))==str(row(values,3)) and x[1].get('movement')!='relocate']
 return exact if len(exact)==1 else hits
count=0
for sheet in books[1].sheetnames:
 old=list(books[0][sheet].values);new=list(books[1][sheet].values)
 for rn,values in enumerate(new,1):
  ov=old[rn-1] if rn<=len(old) else ();changed=[i for i in range(max(len(values),len(ov))) if row(values,i)!=row(ov,i)];count+=len(changed)
  if rn==1 or not changed:continue
  hits=match(sheet,ov,rn)
  if len(hits)!=1:log.append({'sheet':sheet,'row':rn,'status':'no unique event','matches':len(hits)});continue
  a,e=hits[0];updates={}
  if 3 in changed:
   q=row(values,3);assert isinstance(q,(int,float)) and q>=0
   oldq=row(ov,3);assert str(e['quantity_display'])==str(oldq)
   e['quantity_display']=str(q);e['quantity_raw']=q
   for l in a.get('charge_lines',[]):
    if l.get('item')==e['item']:assert l['quantity']==oldq;l['quantity']=q
   if a.get('name')==e['item']+' × '+str(oldq):a['name']=e['item']+' × '+str(q)
   for u in D['unreferenced']:
    if u['task_id']==e['task_id']:u['quantity_display']=str(q)
   updates['quantity']=q
  header=[txt(x).lower() for x in new[0]]
  for i in changed:
   h=header[i] if i<len(header) else '';v=txt(row(values,i))
   if v.lower()=='na':continue # not a clock time or a named carrier; do not overwrite confirmed dispatch information
   if h=='carrier' and v:updates['carrier']=v.upper()
   if h in ('load times','loading time','load time') and v:
    clocks=[]
    for t in v.split('/'):
     t=t.strip();mm=re.fullmatch(r'(\d{1,2}):?(\d{2})',t)
     if mm and int(mm[1])<24 and int(mm[2])<60:clocks.append(f'{int(mm[1]):02}:{mm[2]}')
    if clocks:updates['load_time']=' / '.join(clocks)
  e.update({k:v for k,v in updates.items() if k!='quantity'})
  if updates:
   evidence={'file':paths[1].name,'sha256':hashlib.sha256(paths[1].read_bytes()).hexdigest(),'sheet':sheet,'row':rn}
   e['source_revision875']=evidence
   if 'load_time' in updates and ' / ' in updates['load_time']:
    clocks=updates['load_time'].split(' / ');dds=re.findall(r'\d{8}',str(e.get('dd') or ''));cars=updates.get('carrier',e.get('carrier') or '').split('/')
    if len(clocks)==len(dds)==len(cars)==e.get('quantity_raw'):
     e['booking801']={'date':e['date'],'departure_order':None,'location':a.get('name') or a['key'],'source':'Schedule (5)','loads':[{'truck_id':'schedule875-'+e['task_id']+'-dd-'+dd,'dd':dd,'quantity':1,'asset_numbers':[],'load_time':clock,'carrier':car} for dd,clock,car in zip(dds,clocks,cars)]}
   for u in D['unreferenced']:
    if u['task_id']==e['task_id']:u.update({k:v for k,v in updates.items() if k!='quantity'});u['source_revision875']=evidence
   log.append({'ref':a['key'],'task_id':e['task_id'],'updates':updates,'source':evidence})
# Preserve the source's generic crane requirement; it never identifies a Franna or a crane truck.
for sh in books[1]:
 for rn,values in enumerate(sh.values,1):
  if not any(re.search(r'\bcrane\s+onsite\b',txt(x),re.I) for x in values):continue
  hits=match(sh.title,values,rn)
  if len(hits)!=1:log.append({'sheet':sh.title,'row':rn,'status':'crane requirement needs source match','matches':len(hits)});continue
  a,e=hits[0];e['handling_source875']={'method':'onsite-crane','source':'Schedule (5)','sheet':sh.title,'row':rn,'date':day(row(values,0))}
D['schedule_review875']={'source':'Schedule (5)','sha256':hashlib.sha256(paths[1].read_bytes()).hexdigest(),'reviewed':'2026-10-07','changed_cells':count,'vms_boq':next(r[2] for r in books[1]['BOQ'].values if txt(row(r,0))=='VMS' and txt(row(r,1))=='VMS')}
assert count>0
for k in before:
 if k not in ['assets','plant_lines','unreferenced']:assert D[k]==before[k]
s=rep(s,m.group(1),' '+json.dumps(D,ensure_ascii=False,separators=(',',':')))
s=rep(s,'!Object.keys(d.loading872 || {}).length;','!Object.keys(d.loading872 || {}).length && !d.handling875;')
s=rep(s,' const loading872=loading872Merge(a.loading872,b.loading872);',' const handling875=handling875Merge(a.handling875,b.handling875); if(handling875)m.handling875=handling875;\n const loading872=loading872Merge(a.loading872,b.loading872);')
pos=s.index('</script>',s.index('const DATA ='));s=s[:pos]+Path(__file__).with_name('handling875_src.js').read_text()+'\n'+s[pos:]
s=rep(s,' · v8.74',' · v8.75');p.write_text(s)
Path(os.environ['V875_LOG']).write_text(json.dumps(log,indent=2))
print('Source-bound review complete; protected source sections unchanged.')
