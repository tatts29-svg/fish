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
rep("s.busy=true;s.prepared=null;s.message='Preparing this day’s page…';", " s.busy=true;s.prepared=null;s.text861=null;s.message='Preparing this day’s page and weather…';")
rep("try{\n  const model=daily821Model(s.iso);", " try{\n  await daily861WeatherReady();const weather861=daily861Weather(s.iso);\n  const model=daily821Model(s.iso);")
rep('recipient:team.id,at:Date.now(),configured};', 'recipient:team.id,at:Date.now(),weather861,configured};')
rep("s.busy=true;s.message='Checking the current delivery page and texting service…';", " s.busy=true;s.text861=null;s.message='Checking the current delivery page, weather and texting service…';")
rep("if(!team)throw Error('Choose an installer first.');\n  const initialVersion", "  if(!team)throw Error('Choose an installer first.');\n  await daily861WeatherReady();\n  const initialVersion")
rep('recipient:team.id,at:Date.now()};}', 'recipient:team.id,at:Date.now(),weather861:daily861Weather(s.iso)};}')
rep("if(Date.now()-p.at>120000)throw Error('This preview is over two minutes old. Preview again before sending.');", "  if(Date.now()-p.at>120000)throw Error('This preview is over two minutes old. Preview again before sending.');\n  daily861CheckWeather(p,s.iso);\n  daily861Message(s.iso,team,daily861WorstLink(),p.weather861);")
rep("const text='Coates GC500 — '+fmtDate(s.iso)+' deliveries for '+team.name+'. '+p.model.loads.length+' loads in order. Open your daily page: '+url+' — issued snapshot; contact the site team if plans change.';", "  const text=daily861Message(s.iso,team,url,p.weather861);")
rep("s.rows=[];throw Error('This browser cannot keep the send receipt. Allow session storage before texting; no text was submitted.');}submitting=true;", "s.rows=[];throw Error('This browser cannot keep the send receipt. Allow session storage before texting; no text was submitted.');}submitting=true;s.text861=text;")
# N4: a text the service did not accept is not left showing as the sent message
rep("s.locked=s.rows.some(row=>!row.rejected);", "s.locked=s.rows.some(row=>!row.rejected);if(!s.locked)s.text861=null;")
rep("s.recipient=el.value;s.prepared=null;s.message=", "s.recipient=el.value;s.prepared=null;s.text861=null;s.message=")
rep("s.locked=false;s.rows=[];s.prepared=null;s.message='Preview the current day", "s.locked=false;s.rows=[];s.prepared=null;s.text861=null;s.message='Preview the current day")
# Keep email inside its document/supplier group; remove the duplicate Timeline menus.
start=s.index(" const row = (k, w, off) =>", s.index('function dpDayButtonsBefore821(d){'))
end=s.index(" return `${pre}", start)
rep(s[start:end], '')
start=s.index('<details class="dpmail"><summary class="btn" aria-haspopup="menu" title="Email a link to one of this day')
end=s.index('</div></details>', start)+len('</div></details>')
rep(s[start:end], '')
start=s.index(' /* Email: the same PDFs, attached; the email text can still be copied */', s.index('function dpPlate(days, sel){'))
end=s.index(' return `<section class="dplate"', start)
rep(s[start:end], '')
rep("${menu('install', DP_PLATE_ICO.ins, 'Install')}${mail}${daily821Tile(d)}", "${menu('install', DP_PLATE_ICO.ins, 'Install')}${daily821Tile(d)}")
rep('display:grid;grid-template-columns:auto repeat(4,minmax(0,1fr));gap:10px;align-items:stretch;', 'display:grid;grid-template-columns:auto repeat(3,minmax(0,1fr));gap:10px;align-items:stretch;')
rep('.dplate:has(> .dpt-edit){grid-template-columns:auto repeat(5,minmax(0,1fr))}', '.dplate:has(> .dpt-edit){grid-template-columns:auto repeat(4,minmax(0,1fr))}')
rep('#pane-timeline .dplate:has(.daily821-tile):not(:where(.ep819 *)){grid-template-columns:auto repeat(5,minmax(0,1fr))}', '#pane-timeline .dplate:has(.daily821-tile):not(:where(.ep819 *)){grid-template-columns:auto repeat(4,minmax(0,1fr))}')
rep('#pane-timeline .dplate:has(.daily821-tile):has(>.dpt-edit):not(:where(.ep819 *)){grid-template-columns:auto repeat(6,minmax(0,1fr))}', '#pane-timeline .dplate:has(.daily821-tile):has(>.dpt-edit):not(:where(.ep819 *)){grid-template-columns:auto repeat(5,minmax(0,1fr))}')
# S3: on a phone the plate is two columns; Message daily runs takes the place beside Install that Email left.
rep('#pane-timeline .daily821-tile:not(:where(.ep819 *)){grid-column:1/-1;grid-template-columns:auto minmax(0,1fr)}', '#pane-timeline .daily821-tile:not(:where(.ep819 *)){grid-column:auto;grid-template-columns:auto minmax(0,1fr)}')
# The supplier inventory belongs alongside Equipment's existing print controls.
rep("const tools = head.querySelector('.eqtools'); if (view) tools.appendChild(view);", "const tools = head.querySelector('.eqtools'); if (view) tools.appendChild(view);\n const epInventoryButton = document.createElement('button'); epInventoryButton.type = 'button'; epInventoryButton.className = 'btn sm'; epInventoryButton.setAttribute('data-ep860-inventory', ''); epInventoryButton.textContent = 'Print Event Portables inventory'; tools.appendChild(epInventoryButton);")
rep('· v8.60', '· v8.61')
p.write_text(s,encoding='utf-8-sig')
