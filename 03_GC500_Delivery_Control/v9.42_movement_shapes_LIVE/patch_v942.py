# Author: Andrew Fisher. Scope loading shapes to native movement demand.
import re,sys
from pathlib import Path
base=Path(__file__).resolve().parent
sys.path.insert(0,str(base.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text()
assert 'function primaryItem942(' not in s,'Already applied'
assert 'projection938-script' in s and 'destination930-script' in s,'Requires physical projections and destination shapes'
s=rep(s,(base/'adapter942_before.js').read_text(),(base/'movement942.js').read_text(),'movement-specific shape adapter',str(p))
footer=re.findall(r"\+ ' · v9\.(?:38|41)'; /\* v8\.19",s)
assert len(footer)==1,'Requires focused38 or integrated41 footer'
s=rep(s,footer[0],"+ ' · v9.42'; /* v8.19",'release footer',str(p))
p.write_text(s)
