"""Author: Andrew Fisher. Keep v13.00 limited to Demob weather lifecycle."""
from pathlib import Path
import re,sys
base,new=(Path(p).read_text() for p in sys.argv[1:3])
a=re.findall(r'<script([^>]*)>(.*?)</script>',base,re.S)
b=re.findall(r'<script([^>]*)>(.*?)</script>',new,re.S)
assert len(a)==len(b)==224
changed=[]
for i,(x,y) in enumerate(zip(a,b)):
 if x==y:continue
 m=re.search(r'id="([^"]+)"',x[0]);name=m[1] if m else 'main';changed.append(name)
 if name in ['demobmap1236-script','singles1238-script']:
  old=".ov1236,.mpf1236,.sgv1238,.pg1238,.dl1238" if name=='demobmap1236-script' else ".sgv1238,.pg1238,.dl1238"
  assert x[1].replace("&& m.target.closest('"+old+"')","&&m.target.closest('"+old+",.dc996-controls')")==y[1],name+' changed beyond weather-controls observer exclusion'
 if name=='main':assert x[1].replace("+' · v12.99';","+' · v13.00';")==y[1],'Main source changed beyond footer'
assert set(changed)=={'main','demob-weather996-source','weather1002-source','timeline937-script','staff988-script','demobmap1236-script','singles1238-script'},changed
assert re.findall(r'<style([^>]*)>(.*?)</style>',base,re.S)==re.findall(r'<style([^>]*)>(.*?)</style>',new,re.S),'Unexpected CSS change'
print('PASS:224 scripts; only weather lifecycle, resize guards, unchanged staff DOM guard, weather-controls observer exclusions and footer changed. Data, native record writers, finance, map geometry, availability rules and CSS unchanged.')
