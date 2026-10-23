"""Author: Andrew Fisher. Remove the confirmed reference from active servicing, retaining history."""
import hashlib
import json
import os
import sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,os.path.join(str(HERE),'..','toolchain'))
from rep import rep
path=Path(sys.argv[1]);raw=path.read_bytes();text=raw.decode('utf-8')
assert 'var SvcScope1170 =' not in text,'Scope change already applied'
assert hashlib.sha256(raw).hexdigest()=='1a0c2dc11be081cae5a792662a4fcdd3854212e0fb6bc9174cef7143dc2948a7','Wrong live base; rebuild and retest'
assert "+' · v11.69';" in text and 'var SvcShift1168 =' in text,'Expected v11.69'
def replace(old,new,label):
 global text
 text=rep(text,old,new,label,str(path))
scope=(HERE/'scope1170_src.js').read_text()
replace('var SvcShift1168 =',scope+'\nvar SvcShift1168 =','shared active servicing scope')
replace('var now = timeNow(), data = model.D, meta = model.meta;','var now = timeNow(), data = SvcScope1170.active(model.D), meta = model.meta;','active main panel and map data')
replace("}).replace(/svc1063/g, 'svc1067');","}).replace(/svc1063/g, 'svc1067') + SvcScope1170.historyHtml(SvcScope1170.history(data,SvcState,SvcState.jobStates(model.events,now),day));",'main panel preserves excluded history')
replace('var S=M.S||SvcState,D=M.D,day=M.day||S.autoDay(D,M.now),night=S.dayOf(D,day);','var S=M.S||SvcState,D=SvcScope1170.active(M.D),day=M.day||S.autoDay(D,M.now),night=S.dayOf(D,day);','report uses active scope')
replace('test:!!M.test1164||!!night.practice,stale:!!M.readStatus,areas:areas,','test:!!M.test1164||!!night.practice,stale:!!M.readStatus,areas:areas,history1170:SvcScope1170.history(D,S,states,day),','report retains excluded history')
replace("body+='</details><p class=\"shift1168-note\">Snapshot prepared '","body+='</details>'+SvcScope1170.historyHtml(s.history1170||[])+'<p class=\"shift1168-note\">Snapshot prepared '",'history in report and PDF')
replace("'Read status','Author']];","'Read status','Author','Scope']];",'CSV scope column')
replace("'Verified read','Author: Andrew Fisher']);","'Verified read','Author: Andrew Fisher','Active servicing']);",'CSV active scope')
replace("  return '\\ufeff'+rows.map(function(r)","  (s.history1170||[]).forEach(function(r){rows.push([s.day,s.test?'TEST / PRACTICE':'Event',r.area,r.ref,r.label,r.qty,r.task,r.pending?'Waiting to sync — not recorded complete':'Recorded complete',r.pending?'':stamp(r.at),s.verified,s.stale?'Last verified progress; refresh unavailable':'Verified read','Author: Andrew Fisher','History only — removed from servicing to-do']);});\n  return '\\ufeff'+rows.map(function(r)",'CSV retains historical completions')
# Update the embedded crew template, not its data or tracker configuration.
marker='var SVC1067_CARD=';start=text.index(marker)+len(marker)
bundle,end=json.JSONDecoder().raw_decode(text[start:]);old=text[start:start+end]
crew=bundle['html']
def crew_replace(a,b,label):
 global crew
 crew=rep(crew,a,b,label,'crew template')
crew_replace('var HOUR = 3600000, POLL_MS = 15000',scope+'\nvar HOUR = 3600000, POLL_MS = 15000','crew shared scope helper')
crew_replace('var ALL_REFS = [].concat.apply([], AREAS.map(function (a) { return a.refs; }));',
 "var HISTORY_REFS1170 = [].concat.apply([], AREAS.map(function(a){return a.refs;}));\nAREAS = SvcScope1170.active(D).areas;\nAREAS.forEach(function(a){a.refs.forEach(function(r){AREA_OF[r.ref]=a;});});\nvar ALL_REFS = [].concat.apply([], AREAS.map(function (a) { return a.refs; }));",'crew active references retain full lookup')
crew_replace('function shownTasks(line, dayId) { var g =',"function shownTasks(line, dayId) { if(SvcScope1170.excluded(REF_OF_LINE[line.id]))return []; var g =",'no new taps for excluded reference')
crew_replace('function tickView(day, st) {\n  if (closing)',
 "function tickView(day, st) {\n  if(SvcScope1170.excluded(curRef))return '<section class=\"card\"><h2>'+esc(curRef)+'</h2><p>This location has been removed from servicing to-do. No servicing jobs are required here through this card.</p>'+SvcScope1170.historyHtml(SvcScope1170.history(D,SvcState,st,day))+'</section>'+notDoneHtml(day,st)+areasHtml(day,st);\n  if (closing)",'old QR explains exclusion and retains history')
crew_replace('  var log = [];\n  ALL_REFS.forEach(function (r)', '  var log = [];\n  HISTORY_REFS1170.forEach(function (r)','crew completion audit retains excluded reference')
crew_replace("(e.local ? ' · waiting for signal' : '') + '</small></span></li>';", "(e.local ? ' · waiting for signal' : '') + (SvcScope1170.excluded(e.r.ref)?' · history only; removed from servicing to-do':'') + '</small></span></li>';",'label historical audit entry')
# Keep the removed reference's original lookup but show the active area totals for an old QR.
crew_replace("var a = AREA_OF[curRef];\nbars =", "var a = AREAS.find(function(x){return x.n===AREA_OF[curRef].n;}) || AREA_OF[curRef];\nbars =",'old QR active area totals')
bundle['html']=crew
replace(old,json.dumps(bundle,ensure_ascii=False,separators=(',',':')).replace('</','<\\/'),'updated crew template, original data retained')
replace("+' · v11.69';","+' · v11.70';",'release footer')
path.write_text(text,encoding='utf-8')
