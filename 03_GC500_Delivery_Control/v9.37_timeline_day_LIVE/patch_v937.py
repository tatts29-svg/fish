#!/usr/bin/env python3
"""Author: Andrew Fisher. Wait for the Timeline strip's layout, without moving the document."""
from pathlib import Path
import re,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes();s=raw.decode('utf-8-sig')
assert 'timeline937-script' not in s,'v9.37 already applied'
assert 'navigation934-script' in s,'Expected v9.34 navigation base'
footer=re.search(r" · v9\.(34|35|36)'; /\* v8\.19",s);assert footer,'Expected v9.34–v9.36 footer'
s=rep(s,footer.group(0)," · v9.37'; /* v8.19",'release footer',str(p))
start=s.index(' (() => {\n const strip = pane.querySelector(\'.daystrip\')')
end=s.index('\n })();',start)+len('\n })();')
old=s[start:end]
assert 'if (seen) return;' in old and 'strip.scrollTo({left: to' in old
s=rep(s,old,' window.TimelineStrip937.reveal(pane);','defer strip-only centring until measured',str(p))
s=rep(s,' }\n function update() {\n  if (!hosted || settled) return;',"  if(kind!=='loading'&&window.TimelineStrip937)TimelineStrip937.reveal();\n }\n function update() {\n  if (!hosted || settled) return;",'reveal selected day after ready or saved gate opens',str(p))
js=(HERE/'timeline937.js').read_text()
tail=re.search(r'</script>(\s*</body></html>\s*)$',s);assert tail
s=rep(s,tail.group(0),'</script>\n<script id="timeline937-script">'+js+'</script>'+tail.group(1),'Timeline visibility helper',str(p))
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+s.encode())
print('v9.37 selected Timeline day reveal applied; selection and records unchanged')
