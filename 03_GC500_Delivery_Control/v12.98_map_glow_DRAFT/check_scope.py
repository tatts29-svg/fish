"""Author: Andrew Fisher. Presentation-only release: no source facts or record logic changes."""
import re,sys
from pathlib import Path
base,new=(Path(p).read_text() for p in sys.argv[1:3])
a=re.findall(r'<script([^>]*)>(.*?)</script>',base,re.S);b=re.findall(r'<script([^>]*)>(.*?)</script>',new,re.S)
assert len(a)==len(b)==224
changed=[]
for x,y in zip(a,b):
 if x==y:continue
 m=re.search(r'id="([^"]+)"',x[0]);name=m[1] if m else 'footer'
 if name=='footer':assert x[1].replace("+' · v12.97';","+' · v12.98';")==y[1]
 changed.append(name)
assert set(changed)=={'footer','find1178-script','singles1238-script','demobmap1236-script','buildcards1247-script','threemaps1261-script'},changed
pattern=r'const DATA = (\{.*?\});\r?\n'
assert re.search(pattern,base,re.S)[1]==re.search(pattern,new,re.S)[1]
def body(s,start,end):return s[s.index(start):s.index(end,s.index(start))]
# Source selection, dimensions, status, history, truck ordering and native record writing are unchanged.
for start,end in [('function locOf(c) {','function spotOf(L, v)'),('function mapReading1297(c){','function spotOf(L, v)'),('function partial(key,c,who){','function open(key,preset){'),('function projected(m, projection) {','function polygon(g, points, close)')]:
 assert body(base,start,end)==body(new,start,end),start
assert re.search(r'W.DemobShapes1297 = Object.freeze\(\{version: VERSION, context, signature, paint, projected\}\);',new)
print('PASS: 224 scripts; only map rendering/lifecycle adapters and footer changed. DATA, source geometry, pickup history, native record writers, status and driver logic unchanged.')
