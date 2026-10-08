"""Author: Andrew Fisher. Guarded patch and bounded script changes."""
from pathlib import Path
import re,subprocess,sys,tempfile
HERE=Path(__file__).resolve().parents[1]
BASE=Path(sys.argv[1])
s=BASE.read_bytes()
def patch(p):
 return subprocess.run([sys.executable,str(HERE/'patch_v939.py'),str(p)],capture_output=True,text=True)
with tempfile.TemporaryDirectory() as d:
 p=Path(d)/'page.html';p.write_bytes(s);r=patch(p);assert r.returncode==0,r.stderr
 done=p.read_bytes();r=patch(p);assert r.returncode!=0 and 'already applied' in r.stderr;assert p.read_bytes()==done
 p.write_bytes(s.replace(b"v9.37'; /* v8.19",b"v9.38'; /* v8.19"));assert patch(p).returncode==0
 p.write_bytes(s.replace(b"v9.37'; /* v8.19",b"v9.36'; /* v8.19"));assert patch(p).returncode!=0
 p.write_bytes(s.replace(b'timeline937-script',b'unsupported-script'));assert patch(p).returncode!=0
 scripts=lambda v:re.findall(rb'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>',v,re.S)
 before,after=scripts(s),scripts(done);assert len(before)==len(after)
 changed=[i for i,(a,b) in enumerate(zip(before,after)) if a!=b];assert len(changed)==3,changed
 assert b'function tabStops939(' in done and b'supplier=supplierLabel939(owner)' in done
 print('6/6 patch guards and source-boundary checks passed')
