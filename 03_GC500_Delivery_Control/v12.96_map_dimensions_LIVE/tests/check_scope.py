"""Author: Andrew Fisher. Preserve every existing script outside the two map presentation containers."""
from pathlib import Path
import re,sys,importlib.util,hashlib,json
r=Path(__file__).resolve().parents[1];spec=importlib.util.spec_from_file_location('patch',r/'patch_v1296.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
a,b=map(lambda p:Path(p).read_text(),sys.argv[1:3]);assert m.apply(a)==b
scripts=lambda s:re.findall(r'(<script\b[^>]*>)([\s\S]*?)(</script>)',s)
x,y=scripts(a),scripts(b.replace("+' · v12.96';", "+' · v12.95';"));assert len(x)==len(y)
changed=[h for (h,c,e),(h2,c2,e2) in zip(x,y) if (h,c,e)!=(h2,c2,e2)];assert len(changed)==2 and all(any(name in h for h in changed) for name in ['spot1117-script','demob1211-script']),changed
for s in [b,a+'\n']:
 try:m.apply(s)
 except ValueError:pass
 else:raise AssertionError('Base guard failed')
print(json.dumps({'passed':True,'sha256':hashlib.sha256(b.encode()).hexdigest(),'bytes':len(b.encode()),'unchangedScripts':len(x)-2,'changedScripts':['spot1117-script','demob1211-script'],'wrongBaseGuards':2}))
