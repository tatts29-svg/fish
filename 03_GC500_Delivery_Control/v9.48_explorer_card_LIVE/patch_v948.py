# Author: Andrew Fisher. Reachable native Explorer reference-card close.
import re,sys
from pathlib import Path
base=Path(__file__).resolve().parent
sys.path.insert(0,str(base.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text()
assert 'explorer-card948-script' not in s,'Already applied'
anchor=" f.addEventListener('load', () => { EXP.loaded = true; const w = document.querySelector('#expwrap>.expwait'); if (w) w.hidden = true; expFlush(); });"
s=rep(s,anchor,anchor.replace('expFlush();','expFlush(); if (window.gc500ExplorerCard948) window.gc500ExplorerCard948.mount(f);'),'native Explorer frame ready',str(p))
s=rep(s,'<script id="navigation934-script">','<script id="explorer-card948-script">\n'+(base/'card948.js').read_text()+'\n</script>\n<script id="navigation934-script">','scoped card sizing extension',str(p))
footer=re.findall(r"\+ ' · v9\.(?:41|47)'; /\* v8\.19",s)
assert len(footer)==1,'Requires focused41 or integrated47 footer'
s=rep(s,footer[0],"+ ' · v9.48'; /* v8.19",'release footer',str(p))
p.write_text(s)
