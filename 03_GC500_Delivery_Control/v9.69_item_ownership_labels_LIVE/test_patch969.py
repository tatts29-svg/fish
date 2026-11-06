# Author: Andrew Fisher. Strict patch and no-data-change checks.
from pathlib import Path
import subprocess,tempfile,sys,re
HERE=Path(__file__).resolve().parent
base=Path(sys.argv[1]).read_bytes()
def apply(raw):
 with tempfile.TemporaryDirectory() as d:
  p=Path(d)/'page.html';p.write_bytes(raw)
  r=subprocess.run([sys.executable,str(HERE/'patch_v969.py'),str(p)],capture_output=True)
  return r.returncode,p.read_bytes()
code,candidate=apply(base);assert code==0
s=base.decode('utf-8-sig');t=candidate.decode('utf-8-sig');count=1
for name in ['DATA','COMMITTED','ONHIRE_ROWS','FENCE']:
 pattern=r'^(?:const|let|var) '+name+r' = .*?$'
 assert re.findall(pattern,s,re.M)==re.findall(pattern,t,re.M),name;count+=1
assert 'const ItemOwnership969 =' in t;count+=1
for bad in [candidate,base.replace(b'function compactLoading968(',b'function absent968('),base.replace(" · v9.68'; /* v8.19".encode()," · v9.67'; /* v8.19".encode()),base.replace(b"assets: (a.asset_numbers || []).join(', '), open: true",b"assets: changed, open: true")]:
 rc,got=apply(bad);assert rc!=0;assert got==bad;count+=2
assert 'data-ownership969' in t;count+=1
print({'author':'Andrew Fisher','passed':count})
