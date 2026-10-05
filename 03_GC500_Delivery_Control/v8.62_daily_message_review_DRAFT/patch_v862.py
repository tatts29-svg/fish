# Author: Andrew Fisher. Integrate Claude's reviewed message fixes on current live.
import hashlib, json, os, re, sys
from pathlib import Path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep as replace
p=Path(sys.argv[1]); root=Path(__file__).resolve().parent
assert hashlib.sha256(p.read_bytes()).hexdigest()=='a02c7b5eff2c525c69f8890dafc3f9da747da1f443e4f38a8f38360a2ed9cae7', 'Wrong live base'
s=p.read_text(encoding='utf-8-sig')
assert 'function daily861Message(' in s and 'function daily861WorstLink(' not in s
def rep(a,b):
 global s
 s=replace(s,a,b,a[:70],str(p))
start=s.index('/* v8.61 daily message helpers START */')
end=s.index('/* v8.61 daily message helpers END */',start)+len('/* v8.61 daily message helpers END */')
helpers='/* v8.61 daily message helpers START */\n'+root.joinpath('weather861.js').read_text()+'\n'+root.joinpath('daily_message861.js').read_text()+'\n/* v8.61 daily message helpers END */'
rep(s[start:end],helpers)
rep("daily861CheckWeather(p,s.iso);\n  const version=", "daily861CheckWeather(p,s.iso);\n  daily861Message(s.iso,team,daily861WorstLink(),p.weather861);\n  const version=")
rep("daily861CheckWeather(p,s.iso);\n  const text=daily861Message(s.iso,team,url,p.weather861);", "const text=daily861Message(s.iso,team,url,p.weather861);")
rep("s.locked=s.rows.some(row=>!row.rejected);", "s.locked=s.rows.some(row=>!row.rejected);if(!s.locked)s.text861=null;")
rep("'This browser cannot keep the send receipt. Allow session storage before texting;no text was submitted.'", "'This browser cannot keep the send receipt. Allow session storage before texting; no text was submitted.'")
rep('#pane-timeline .daily821-tile:not(:where(.ep819 *)){grid-column:1/-1;grid-template-columns:auto minmax(0,1fr)}', '#pane-timeline .daily821-tile:not(:where(.ep819 *)){grid-column:auto;grid-template-columns:auto minmax(0,1fr)}')
rep('· v8.61', '· v8.62')
# Keep financial renderers out of Today, including lazy fold and print redraws.
rep('dsnHead(asOf) + dsnGroups(asOf, X) + dsnBranches(asOf, X) + dsnMoney(asOf, X) + dsnOut(asOf)', 'dsnHead(asOf)+dsnGroups(asOf,X)+dsnOut(asOf)')
# Private destination configuration is supplied at build time, never committed.
config=json.loads(Path(os.environ['GC500_EP_EMAIL_DEFAULTS_FILE']).read_text())
for group in ('to','cc'):
 assert config.get(group), 'Missing email recipients'
 for item in config[group]:
  assert re.fullmatch(r'[A-Za-z0-9_.+%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',item['email'])
  assert not any(c in item.get('name','') for c in '\r\n'), 'Invalid header'
config_js=json.dumps(config,ensure_ascii=True)
rep('async function epDraft860(F,alive=()=>true){', 'const epEmailDefaults862='+config_js+';\nfunction epAddress862(rows){return rows.map(r=>r.name?JSON.stringify(r.name)+" <"+r.email+">":r.email).join(", ");}\nasync function epDraft860(F,alive=()=>true){')
rep("['X-Unsent: 1','MIME-Version: 1.0','Subject: '", "['X-Unsent: 1','MIME-Version: 1.0','To: '+epAddress862(epEmailDefaults862.to),'Cc: '+epAddress862(epEmailDefaults862.cc),'Subject: '")
rep("'GC500 - Event Portables - Load '", "'GC500 - Event Portables run sheet - Load '")
rep('Email with PDF</button>', 'Email draft with PDF</button>')
rep('Choose the recipient in your email app. The email draft includes the PDF attachment. Nothing is sent automatically.', 'Open the downloaded draft in your email app. To, Cc, subject and PDF attachment are included. Review and send when ready. Nothing is sent automatically.')
a=s.index(" acts.querySelector('[data-ep860-share]').onclick=")
b=s.index('\n }catch(e)',a)
rep(s[a:b], " acts.querySelector('[data-ep860-share]').onclick=()=>{acts.querySelector('a[download=\"'+draft.name+'\"]').click();note('Email draft downloaded with To, Cc, subject and PDF attached. Review it in your email app and send when ready.');};")
rep('Costs &amp; P&amp;L</button>', 'P&amp;L summary</button>')
rep('Rates &amp; labour charges</button>', 'Customer rates &amp; charges</button>')
rep('Roster costs</button>', 'Workforce costs</button>')
p.write_text(s,encoding='utf-8-sig')
