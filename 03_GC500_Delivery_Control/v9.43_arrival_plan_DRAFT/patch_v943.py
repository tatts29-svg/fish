#!/usr/bin/env python3
"""Author: Andrew Fisher. Confirmed 14 Oct arrival plan in native delivery views."""
from pathlib import Path
import sys,re
here=Path(__file__).resolve().parent
sys.path.insert(0,str(here.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes();s=raw.decode('utf-8-sig')
if 'function arrival943Model' in s:raise SystemExit('Already applied')
m=re.search(r" · v9\.(41|42)'; /\* v8.19",s)
if not m:raise SystemExit('Expected v9.41 focus or v9.42 final base')
s=rep(s,m.group(0)," · v9.43'; /* v8.19",'footer',p)
js=(here/'arrival943.js').read_text().replace('__ARRIVAL943_PNG__','https://gc500-production.up.railway.app/f/Coates-GC500-2026/Wed14Oct_arrival_plan_v3_p1.png').replace('__ARRIVAL943_PNG2__','https://gc500-production.up.railway.app/f/Coates-GC500-2026/Wed14Oct_arrival_plan_v3_p2.png').replace('__ARRIVAL943_PDF__','https://gc500-production.up.railway.app/f/Coates-GC500-2026/Wed14Oct_Esplanade_arrival_plan_v3.pdf')
tail=s[-160:];new=tail.replace('</body></html>','<script id="arrival943-script">\n'+js+'\n</script>\n</body></html>');s=rep(s,tail,new,'arrival integration',p)
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+s.encode())
