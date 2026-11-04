"""Author: Andrew Fisher. Preserve every existing script outside the list container."""
from pathlib import Path
import re,sys,importlib.util,hashlib,json
r=Path(__file__).resolve().parents[1];spec=importlib.util.spec_from_file_location('patch',r/'patch_v1295.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
a,b=map(lambda p:Path(p).read_text(),sys.argv[1:3]);assert m.apply(a)==b
scripts=lambda s:re.findall(r'(<script\b[^>]*>)([\s\S]*?)(</script>)',s)
x,y=scripts(a),scripts(b.replace("+' · v12.95';", "+' · v12.93';"));assert len(x)==len(y)
changed=[h for (h,c,e),(h2,c2,e2) in zip(x,y) if (h,c,e)!=(h2,c2,e2)];assert len(changed)==1 and 'spot1117-script' in changed[0],changed
for s in [b,a+'\n']:
 try:m.apply(s)
 except ValueError:pass
 else:raise AssertionError('Base guard failed')
print(json.dumps({'passed':True,'sha256':hashlib.sha256(b.encode()).hexdigest(),'bytes':len(b.encode()),'unchangedScripts':len(x)-1,'changedScript':'spot1117-script','wrongBaseGuards':2}))
