"""Author: Andrew Fisher. Verify exact source, native source preservation and repeat refusal."""
from pathlib import Path
import hashlib,re,sys
import patch_v1016 as patch
base=Path(sys.argv[1]).read_text();out=patch.apply(base);checks={}
checks['exact base']=hashlib.sha256(base.encode()).hexdigest()==patch.BASE_SHA
checks['one new release footer']=out.count("+ ' · v10.16'")==1 and "+ ' · v10.15'" not in out
source=lambda text:re.search(r'const DATA = (\{.*?\});\r?\n',text,re.S).group(1)
checks['embedded source data preserved']=source(out)==source(base)
for label,changed in [('repeat',out),('changed source',base+'\n')]:
 try:patch.apply(changed)
 except ValueError:checks[label+' refused']=True
 else:checks[label+' refused']=False
for part in patch.PARTS:
 path=patch.HERE/part/('patch_'+part+'1016.py');checks[part+' source exists']=path.is_file()
assert all(checks.values()),checks
print({'pass':True,'checks':len(checks)})
