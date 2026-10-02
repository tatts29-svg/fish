#!/usr/bin/env python3
"""Author: Andrew Fisher. CW2 source update; preserve operational and commercial records."""
import sys, json, re, copy
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text()
if 'function cw2Plan803(' in s:raise SystemExit('v8.03 already applied')
if 'function bookingOrder801(' not in s:raise SystemExit('v8.03 requires the Wednesday booking release')
m=re.search(r'^const DATA = ',s,re.M)
assert m, 'canonical DATA declaration missing'
d,n=json.JSONDecoder().raw_decode(s[m.end():]);old=s[m.start():m.end()+n]
src=json.loads((ROOT/'cw2_plan_02Oct2026.json').read_text())
f=d['fencing'];w=next(x for x in f['week_sheets'] if x['sheet']=='CON WK2')
assert w['plan_update'] is None, 'CW2 already has an installation plan; re-review newer source'
assert w['totals']=={'Temporary Fence (m) — Clean':818,'Temporary Fence (m) — Braced for Scrim':379,'Temporary Fence (m) — Relocation':123,'Temporary Fence (m) — Removal':0,'Vehicle Gates':15,'Ped. Gates':4,'Crowd Control Barriers (m) — Event':170.5,'Crowd Control Barriers (m) — Demarcation':310,'Crowd Control Barriers (m) — Flat Feet':45}, 'original CW2 totals changed'
previous=copy.deepcopy(w)
u={k:src[k] for k in ['file','pages','created_display','received','basis']}
u.update(week='CON WK2',code='C2',title='Construction Week 2 — Fencing Installation Plan',author=src['source_author'],sha256_16=src['source_sha256'][:16],sha256=src['source_sha256'],revision=src['revision'],days_covered=[x['date'] for x in w['days']],differences=[],flags=[],notes=[],rows_by_day=[],conflicts=src['conflicts'],previous_programme=previous)
for day in w['days']:
 rows=[r for r in src['rows'] if r['date']==day['date']]
 totals={}
 for row in rows:
  for key,value in row['fields'].items():totals[key]=totals.get(key,0)+value
 u['rows_by_day'].append({'date':day['date'],'rows':rows})
 if day['totals']!=totals:u['differences'].append({'date':day['date'],'location':'Day total','description':'Existing programme versus the 2 October weekly summary','kind':'changed','programme':copy.deepcopy(day['totals']),'plan':totals,'page':1})
 day.update(programme_totals=copy.deepcopy(day['totals']),totals=totals,rows=len(rows),basis='installation plan weekly summary; source conflicts awaiting confirmation')
w.update(programme_totals=copy.deepcopy(w['totals']),totals=src['reported_weekly_totals'],totals_basis=src['basis'],plan_update=u)
f['installation_plans']['plans'].append({k:u[k] for k in ['week','code','title','file','pages','author','created_display','received','sha256_16','basis']})
f['installation_plans']['disagreements_CW2']={'what':'Conflicting quantities in the 2 October CW2 PDF; no confirmation recorded.','items':src['conflicts']}
s=rep(s,old,'const DATA = '+json.dumps(d,ensure_ascii=False,separators=(',',':')),'CW2 plan only',str(p))
s=rep(s,'function planUpdateCard(u){','function planUpdateCardBefore803(u){','preserve earlier plan components',str(p))
s=rep(s,'function planUpdateCardBefore803(u){',(ROOT/'fencing803_src.js').read_text()+'\nfunction planUpdateCardBefore803(u){','dated plan and prerequisites',str(p))
# Existing publishing marker; component versions in the source stay untouched.
s=re.sub(r'(<meta name="gc500-release" content=")[^"]+("[^>]*>)',r'\g<1>v8.03\2',s,count=1)
p.write_text(s)
print('v8.03: CW2 dated plan, source conflicts and prerequisites; no completed-work or finance record changes')
