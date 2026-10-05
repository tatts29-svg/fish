# Author: Andrew Fisher.
import hashlib, os, sys
from pathlib import Path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep as replace
p=Path(sys.argv[1]); root=Path(__file__).resolve().parent
assert hashlib.sha256(p.read_bytes()).hexdigest()=='ae6880d9fc3e5555f34ad30eed47e31ed873847065927b4b6737dc5604b20073', 'Wrong live base'
s=p.read_text(encoding='utf-8-sig')
assert 'function epDocuments860(' in s and 'function daily861Message(' not in s
def rep(a,b):
 global s
 s=replace(s,a,b,a[:70],str(p))
marker='/* Author: Andrew Fisher. v8.21: a selected day'
helpers='/* v8.61 daily message helpers START */\n'+root.joinpath('weather861.js').read_text()+'\n'+root.joinpath('daily_message861.js').read_text()+'\n/* v8.61 daily message helpers END */\n'
rep(marker,helpers+marker)
rep('/* Author: Andrew Fisher. Native supplier actions;',root.joinpath('daily_message861.css').read_text()+'\n/* Author: Andrew Fisher. Native supplier actions;')
rep('</button></div>${s.blobUrl?', '</button></div>${daily861PreviewHtml(s,chosen)}${s.blobUrl?')
rep("s.busy=true;s.prepared=null;s.message='Preparing this day’s page…';", "s.busy=true;s.prepared=null;s.text861=null;s.message='Preparing this day’s page and weather…';")
rep("try{\n  const model=daily821Model(s.iso);", "try{\n  await daily861WeatherReady();const weather861=daily861Weather(s.iso);\n  const model=daily821Model(s.iso);")
rep('recipient:team.id,at:Date.now(),configured};', 'recipient:team.id,at:Date.now(),weather861,configured};')
rep("s.busy=true;s.message='Checking the current delivery page and texting service…';", "s.busy=true;s.text861=null;s.message='Checking the current delivery page, weather and texting service…';")
rep("if(!team)throw Error('Choose an installer first.');\n  const initialVersion", "if(!team)throw Error('Choose an installer first.');\n  await daily861WeatherReady();\n  const initialVersion")
rep('recipient:team.id,at:Date.now()};}', 'recipient:team.id,at:Date.now(),weather861:daily861Weather(s.iso)};}')
rep("if(Date.now()-p.at>120000)throw Error('This preview is over two minutes old. Preview again before sending.');", "if(Date.now()-p.at>120000)throw Error('This preview is over two minutes old. Preview again before sending.');\n  daily861CheckWeather(p,s.iso);")
rep("const text='Coates GC500 — '+fmtDate(s.iso)+' deliveries for '+team.name+'. '+p.model.loads.length+' loads in order. Open your daily page: '+url+' — issued snapshot; contact the site team if plans change.';", "daily861CheckWeather(p,s.iso);\n  const text=daily861Message(s.iso,team,url,p.weather861);")
rep("no text was submitted.');}submitting=true;", "no text was submitted.');}submitting=true;s.text861=text;")
rep("s.recipient=el.value;s.prepared=null;s.message=", "s.recipient=el.value;s.prepared=null;s.text861=null;s.message=")
rep("s.locked=false;s.rows=[];s.prepared=null;s.message='Preview the current day", "s.locked=false;s.rows=[];s.prepared=null;s.text861=null;s.message='Preview the current day")
rep('· v8.60', '· v8.61')
p.write_text(s,encoding='utf-8-sig')
