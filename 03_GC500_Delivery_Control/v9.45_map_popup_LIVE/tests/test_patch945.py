"""Author: Andrew Fisher. Guarded map-popup patch checks."""
from pathlib import Path
import re,subprocess,sys,tempfile
HERE=Path(__file__).resolve().parents[1]
s=Path(sys.argv[1]).read_bytes()
def apply(p):return subprocess.run([sys.executable,str(HERE/'patch_v945.py'),str(p)],capture_output=True,text=True)
with tempfile.TemporaryDirectory() as d:
 p=Path(d)/'page.html';p.write_bytes(s);r=apply(p);assert r.returncode==0,r.stderr
 done=p.read_bytes();r=apply(p);assert r.returncode!=0 and 'already applied' in r.stderr;assert p.read_bytes()==done
 p.write_bytes(s.replace(b"v9.41'; /* v8.19",b"v9.44'; /* v8.19"));assert apply(p).returncode==0
 p.write_bytes(s.replace(b"v9.41'; /* v8.19",b"v9.40'; /* v8.19"));assert apply(p).returncode!=0
 p.write_bytes(s.replace(b'function tabStops939(',b'function missingKeyboard('));assert apply(p).returncode!=0
 scripts=lambda v:re.findall(rb'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>',v,re.S)
 before,after=scripts(s),scripts(done);assert len(before)==len(after)
 assert len([i for i,(a,b) in enumerate(zip(before,after)) if a!=b])==2
 assert done.count(b'dismissMapPicks945();')==4
 assert b"document.querySelectorAll('.mkpick').forEach(e => e.remove());" not in done
 # Native close, keyboard and selection handlers are untouched.
 for native in [b"const close = () => { d.remove(); document.removeEventListener('keydown', onKey); };",b"b.onclick = () => { close(); openAsset(b.dataset.pick); }"]:
  assert s.count(native)==done.count(native)>0
 print('7/7 guarded-patch and native-handler checks passed')
