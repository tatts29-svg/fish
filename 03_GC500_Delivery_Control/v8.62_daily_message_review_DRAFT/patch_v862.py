# Author: Andrew Fisher. Integrate Claude's reviewed message fixes on current live.
import hashlib, os, sys
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
rep('#pane-timeline .daily821-tile:not(:where(.ep819 *)){grid-column:1/-1;grid-template-columns:auto minmax(0,1fr)}', '#pane-timeline .daily821-tile:not(:where(.ep819 *)){grid-column:auto;grid-template-columns:auto minmax(0,1fr)}')
rep('· v8.61', '· v8.62')
p.write_text(s,encoding='utf-8-sig')
