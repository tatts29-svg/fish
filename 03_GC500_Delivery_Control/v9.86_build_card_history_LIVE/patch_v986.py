# Author: Andrew Fisher
from pathlib import Path
import sys,hashlib
here=Path(__file__).resolve().parent
sys.path.insert(0,str(here.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text()
if hashlib.sha256(p.read_bytes()).hexdigest()!='f36c42ebb6f85a49f62663b5c5454510308dee7ea0087e2bed01a860b5a2c3c8':raise SystemExit('Wrong live base')
if 'work986-script' in s:raise SystemExit('Already applied')
s=rep(s,"+ ' · v9.85'","+ ' · v9.86'",'version',str(p))
s=rep(s,"function progressHealth985(){return JSON.stringify(todayWorkHealth840());}","function progressHealth985(){return JSON.stringify(todayWorkHealth840())+'|'+(typeof DOCS==='undefined'?'':DOCS.state+'|'+DOCS.at);}",'Refresh work and progress when source documents finish loading',str(p))
s=rep(s,"const value=progress881Model(iso);if(value?.ready)progress.set(iso,value);", "const value=holdAssets(()=>progress881Model(iso));if(value?.ready)progress.set(iso,value);",'Retain native asset-list optimisation for deferred readings',str(p))
s=rep(s,"if(iso<'2026-10-07')return null;if(progress.has(iso))return progress.get(iso);", "if(!todayWorkHealth840().ready)return null;if(progress.has(iso))return progress.get(iso);",'All supported historical dates',str(p))
s=rep(s,"if(!valid)return {past:true,percent:null,complete:false,text:'—',bound:false};", "if(!valid)return {past:true,percent:null,pending:!!p?.pending,complete:false,text:'—',bound:false};",'Explicit deferred reading',str(p))
s=rep(s,"facts.set(day.iso,BuildCardData984.day(day.iso,today,day))", "facts.set(day.iso,{...BuildCardData984.day(day.iso,today,day),work:BuildWork986.day(day.iso,today,day)})",'Shared daily work facts',str(p))
s=rep(s,"p=model(day,today,jobAtDate)","p=model(day,today,iso=>progress.get(iso)||{ready:false,pending:todayWorkHealth840().ready})",'Read cached historical figures without blocking the strip',str(p))
s=rep(s,"p.past?'Not recorded':isToday?'In progress':'Scheduled'", "p.past?(p.pending?'Loading…':'Not recorded'):isToday?'In progress':'Scheduled'",'Loading differs from absent data',str(p))
s=rep(s,"p.percent===null?'Whole-build progress not recorded.'", "p.percent===null?(p.pending?'Whole-build progress loading.':'Whole-build progress not recorded.')",'Accessible loading text',str(p))
s=rep(s,"data-bc984-motion=\"off\" aria-pressed=\"'+on", "data-bc984-motion=\"off\" data-build-progress=\"'+(p.pending?'pending':p.percent!==null?'ready':p.past?'unavailable':'none')+'\" aria-pressed=\"'+on",'Historical reading lifecycle',str(p))
s=rep(s,"'<span class=\"bc984-crew\"><span class=\"bc984-crew-head\">", "BuildWorkView986.card(d.work)+\n '<span class=\"bc984-crew\"><span class=\"bc984-crew-head\">",'Compact recorded/planned daily work',str(p))
s=rep(s,"The shared tracked-category progress index as at day close. This is separate from that day’s load completion.", "Reconstructed from dated work records against the current seven-category build scope. Scope remains provisional. This is separate from that day’s load completion.",'Historical calculation basis',str(p))
s=rep(s,"+'</p><b>Weather</b><p>'+e(w.detail)","+'</p>'+BuildWorkView986.details(d.work)+'<b>Weather</b><p>'+e(w.detail)",'Full daily work evidence under More info',str(p))
s=rep(s,"?'on':'off';}\nconst observer", "?'on':'off';root.BuildProgress986?.sync();}\nconst observer",'Hydrate visible day cards only',str(p))
s=rep(s,"root.BuildCards984={html,begin,mount,weather,refreshWeather,sync,reading,report:", "root.BuildCards984={html,begin,mount,weather,refreshWeather,sync,reading,progressForDate:jobAtDate,report:",'Expose isolated dated calculation for deferred paint',str(p))
s=rep(s,'</head>\n<body','<style id="work986-style">'+(here/'card986.css').read_text()+'</style>\n</head>\n<body','Work row styling',str(p))
s=rep(s,'<script id="past984-script">','<script id="work986-script">'+(here/'work986.js').read_text()+'\n'+(here/'view986.js').read_text()+'</script>\n<script id="past984-script">','Daily work helper before card renderer',str(p))
s=rep(s,'</body>\n</html>','<script id="progress986-script">'+(here/'progress986.js').read_text()+'</script>\n</body>\n</html>','Incremental visible-card percentages',str(p))
p.write_text(s)
