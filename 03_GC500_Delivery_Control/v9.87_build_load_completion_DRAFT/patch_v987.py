# Author: Andrew Fisher
from pathlib import Path
import sys, hashlib
here=Path(__file__).resolve().parent
sys.path.insert(0,str(here.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text()
if hashlib.sha256(p.read_bytes()).hexdigest()!='7f477763bd1e8f49244439388cc74dd78320961a3240a59705ce4cd1b43178b9':raise SystemExit('Wrong live base')
if 'loads987-script' in s:raise SystemExit('Already applied')
s=rep(s,"+ ' · v9.86'","+ ' · v9.87'",'version',str(p))
a=s.index(' function loadReading(iso, today, day, env) {');b=s.index(' function create(env)',a)
s=rep(s,s[a:b]," function loadReading(iso,today,day,env){return root.BuildLoads987.create(env).day(iso,today,day);}\n",'Use receipt-based load completion',str(p))
s=rep(s,"   loads: day => typeof dpLoads === 'function' ? dpLoads(day) : null,","   ready:()=>typeof todayWorkHealth840!=='function'||todayWorkHealth840().ready,\n   receipt:(row,iso)=>root.BuildLoads987.receipt(row,iso),\n   loads: day => typeof dpLoads === 'function' ? dpLoads(day) : null,",'Native receipt and readiness dependencies',str(p))
a=s.index('function loadText(l){');b=s.index('const shield=',a)
s=rep(s,s[a:b],"function loadText(l){return root.BuildLoads987.view(l);}\n",'Precise received loads or delivery reference label',str(p))
s=rep(s,'<span class="bc984-label">DAY’S LOADS<span class="bc984-at-close">','<span class="bc984-label">\'+e(load.title)+\'<span class="bc984-at-close">','Card names the counted unit',str(p))
s=rep(s,"completion+' '+load.value+'. Staff: '","completion+' '+load.title+': '+load.value+'. Staff: '",'Accessible metric label',str(p))
s=rep(s,"<b>Day’s loads</b><p>'+e(d.loads.source)+' '+e((d.loads.issues||[]).join(' '))+'</p>'+BuildWorkView986.details(d.work)","'+BuildLoads987.details(d.loads)+BuildWorkView986.details(d.work)",'Receipt details and references under More info',str(p))
s=rep(s,'<script id="past984-script">','<script id="loads987-script">'+(here/'loads987.js').read_text()+'</script>\n<script id="past984-script">','Receipt model before Build cards',str(p))
p.write_text(s)
