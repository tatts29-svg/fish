#!/usr/bin/env python3
"""Author: Andrew Fisher. Close transient map callouts on replacement and departure."""
from pathlib import Path
import re,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes();s=raw.decode('utf-8-sig')
assert 'function dismissMapPicks945(' not in s,'v9.45 already applied'
assert 'function tabStops939(' in s and 'timeline937-script' in s,'Expected combined keyboard/day-strip fixes'
footer=re.search(r" · v9\.(41|44)'; /\* v8\.19",s);assert footer,'Expected v9.41 focused or v9.44 final base'
s=rep(s,footer.group(0)," · v9.45'; /* v8.19",'release footer',str(p))
s=rep(s,'function layerCallout(m){',(HERE/'popup945.js').read_text()+'\nfunction layerCallout(m){','native map popup cleanup',str(p))
for name in ['layerCallout(m)','emptyCallout(sh, labels)','pickMarker(cands, x, y)']:
 start=s.index('function '+name+'{');end=s.index('\n}',start)+2;body=s[start:end]
 old=" document.querySelectorAll('.mkpick').forEach(e => e.remove());"
 replacement=rep(body,old,' dismissMapPicks945();','retire '+name+' previous popup',str(p))
 s=rep(s,body,replacement,'native '+name+' body',str(p))
s=rep(s,'function depart(tab){departing=true;try{for(const n of layers().reverse())', 'function depart(tab){departing=true;try{dismissMapPicks945();for(const n of layers().reverse())','retire map popup on tab departure',str(p))
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+s.encode())
print('v9.45 native map popup cleanup applied; no operational data changed')
