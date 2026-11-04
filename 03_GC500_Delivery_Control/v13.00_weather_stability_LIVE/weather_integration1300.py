"""Author: Andrew Fisher. Retain exact weather artwork across native Demob renders."""
from pathlib import Path
import re,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep

def apply(s):
 if 'root.WeatherReuse1300=api' in s:raise ValueError('Weather v13.00 already applied')
 matches=list(re.finditer(r'(<script\b[^>]*\bid="demob-weather996-source"[^>]*>)(.*?)(</script>)',s,re.S))
 if len(matches)!=1:raise ValueError('Expected one native Demob weather script')
 m=matches[0];t=m[2]
 def r(old,new,label):
  nonlocal t
  t=rep(t,old,new,label,'weather v13.00')
 r("const weatherStable1299=root.WeatherCards1299.create(","const weatherReuse1300=root.WeatherReuse1300.create();\nconst weatherStable1299=root.WeatherCards1299.create(",'native artwork lifecycle')
 r("weatherStable1299.remember(card,BuildCards984.weather(iso));card.dataset.bc984Visible='false';", "weatherStable1299.remember(card,BuildCards984.weather(iso));weatherReuse1300.restore(card,BuildCards984.weather(iso));weatherReuse1300.remember(card,BuildCards984.weather(iso));card.dataset.bc984Visible='false';",'reuse only identical weather after fresh native card facts')
 r("c.setAttribute('aria-label',(c.getAttribute('aria-label')||'').replace(/Weather: [\\s\\S]*$/,'Weather: '+w.label));", "c.setAttribute('aria-label',(c.getAttribute('aria-label')||'').replace(/Weather: [\\s\\S]*$/,'Weather: '+w.label));weatherReuse1300.remember(c,w);",'remember genuine weather updates')
 r("const d=readings.get(selected);if(d){const content=detail(d);if(more.innerHTML!==content)more.innerHTML=content;}sync();", "const d=readings.get(selected);if(d){const content=detail(d);if(more.innerHTML!==content)more.innerHTML=content;}weatherReuse1300.finish();sync();",'restore phases together after all native mount updates')
 r("const render=renderDemob816;renderDemob816=function(){rendering=true;try{const result=render.apply(this,arguments);mount();if(!Performance1241.drawingDemob())WeatherStrip1002.reveal(document.getElementById('pane-demob'));return result;}finally{rendering=false;}};", "const render=renderDemob816;renderDemob816=function(){weatherReuse1300.capture(document.querySelectorAll('#pane-demob .dc996-day'));rendering=true;try{const result=render.apply(this,arguments);mount();if(!Performance1241.drawingDemob())WeatherStrip1002.reveal(document.getElementById('pane-demob'));return result;}finally{rendering=false;weatherReuse1300.release();}};",'carry weather nodes and phase through full native render')
 r("root.DemobCards996={mount,html,sync,refreshWeather,report:","root.DemobCards996={mount,html,sync,refreshWeather,weatherReuse:weatherReuse1300.report,report:",'read-only lifecycle diagnostics')
 t=(HERE/'weather1300_src.js').read_text()+'\n'+t
 return s[:m.start(2)]+t+s[m.end(2):]
