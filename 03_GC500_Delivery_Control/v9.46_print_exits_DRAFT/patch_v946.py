#!/usr/bin/env python3
"""Author: Andrew Fisher. Reachable native print exits and phone tab labels."""
from pathlib import Path
import re,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes();s=raw.decode('utf-8-sig')
assert 'print-exits946-style' not in s,'v9.46 already applied'
assert 'function tabStops939(' in s and 'navigation934-script' in s,'Expected combined native keyboard fixes'
footer=re.search(r" · v9\.(41|42|45)'; /\* v8\.19",s);assert footer,'Expected v9.41/v9.42 focused or final v9.45 base'
s=rep(s,footer.group(0)," · v9.46'; /* v8.19",'release footer',str(p))
s=rep(s,"box.innerHTML='<div class=\"box\"><h2 id=\"drv782h\">'", "box.innerHTML='<div class=\"box\"><div class=\"exit946\"><button type=\"button\" class=\"close\" data-print946-close>Close</button></div><h2 id=\"drv782h\">'",'driver check top exit',str(p))
s=rep(s," box.querySelector('.b-no').onclick=close;", " box.querySelector('[data-print946-close]').onclick=close;box.querySelector('.b-no').onclick=close;",'driver native cancel binding',str(p))
s=rep(s,'d.innerHTML = `<div class="printask-box">\n <h3>This print is not ready</h3>', 'd.innerHTML = `<div class="printask-box">\n <div class="exit946"><button type="button" class="close" data-print946-close>Close</button></div>\n <h3>This print is not ready</h3>','preflight top exit',str(p))
s=rep(s," d.querySelector('[data-pa=\"cancel\"]').onclick = () => { shut(); cancel(); };", " d.querySelector('[data-pa=\"cancel\"]').onclick = () => { shut(); cancel(); };\n d.querySelector('[data-print946-close]').onclick = () => d.querySelector('[data-pa=\"cancel\"]').click();",'preflight native cancel binding',str(p))
s=rep(s,'</head>\n<body>','<style id="print-exits946-style">'+(HERE/'exits946.css').read_text()+'</style>\n</head>\n<body>','bounded print and phone layout',str(p))
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+s.encode())
print('v9.46 print exits and phone navigation fit applied; readiness and records unchanged')
