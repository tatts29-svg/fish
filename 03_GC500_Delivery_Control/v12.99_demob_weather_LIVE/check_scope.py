"""Author: Andrew Fisher. Keep source facts, finance, maps and native writers intact."""
from pathlib import Path
import re,sys
base,new=(Path(p).read_text() for p in sys.argv[1:3])
a=re.findall(r'<script([^>]*)>(.*?)</script>',base,re.S);b=re.findall(r'<script([^>]*)>(.*?)</script>',new,re.S)
assert len(a)==len(b)==224
changed=[]
for i,(x,y) in enumerate(zip(a,b)):
 if x==y:continue
 m=re.search(r'id="([^"]+)"',x[0]);changed.append(m[1] if m else 'main')
assert set(changed)=={'main','past984-script','demob-weather996-source','singles1238-script'},changed
pat=r'const DATA = (\{.*?\});\r?\n'
assert re.search(pat,base,re.S)[1]==re.search(pat,new,re.S)[1]
def function_region(text,name):
 start=re.search(r'^function '+re.escape(name)+r'\(',text,re.M).start()
 next_fn=re.search(r'^function \w+\(',text[start+1:],re.M)
 assert next_fn,name
 return text[start:start+1+next_fn.start()]
protected=['ourCosts','setOurCost','setOurPerson','runShiftOff867','runWorked','runHours']
protected+=re.findall(r'^function (fin745\w+)\(',base,re.M)
for name in protected:assert function_region(base,name)==function_region(new,name),name
assert new.count('root.OnsiteAvailability1299=api')==1 and new.count('root.WeatherCards1299=api')==1
print('PASS:224 scripts; only native availability/current contacts, weather/card presentation and footer changed; DATA, finance functions, native record writers and all map scripts unchanged.')
