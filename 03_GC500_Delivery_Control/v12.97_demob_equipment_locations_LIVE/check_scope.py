"""Author: Andrew Fisher. Bound the release to Demob map presentation and pickup metadata."""
import re,sys
from pathlib import Path
base,new=(Path(p).read_text() for p in sys.argv[1:3])
a=re.findall(r'<script([^>]*)>(.*?)</script>',base,re.S);b=re.findall(r'<script([^>]*)>(.*?)</script>',new,re.S)
assert len(a)==len(b)==224
changed=[]
for i,(x,y) in enumerate(zip(a,b)):
 if x==y:continue
 m=re.search(r'id="([^"]+)"',x[0]);name=m.group(1) if m else 'footer'
 if name=='footer':assert x[1].replace("+' · v12.96';","+' · v12.97';")==y[1]
 changed.append(name)
assert set(changed)=={'footer','demob-weather996-source','find1178-script','singles1238-script','demobmap1236-script','buildcards1247-script','threemaps1261-script'},changed
pattern=r'const DATA = (\{.*?\});\r?\n'
assert re.search(pattern,base,re.S).group(1)==re.search(pattern,new,re.S).group(1)
# The driver/load resolver, native departure fields and native write paths are untouched.
def body(s,start,end):return s[s.index(start):s.index(end,s.index(start))].strip()
assert body(base,'function locOf(c) {','const navOf')==body(new,'function locOf(c) {','/* Author: Andrew Fisher. Map-only')
assert body(base,'function partial(key,c,who){','function open(key,preset){')==body(new,'function partial(key,c,who){','function open(key,preset){')
assert body(base,'const c={version:1,kind:\'collection\'','return {ok:true,value:c')==body(new,'const c={version:1,kind:\'collection\'','const saved=root.PickupLocations1297')
print('PASS 224 scripts: only Build/Demob map adapters, native location metadata and footer changed; DATA, driver resolver, native collection values/writers untouched')
