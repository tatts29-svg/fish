"""Author: Andrew Fisher. Guarded patch and native readiness source boundaries."""
from pathlib import Path
import re, subprocess, sys, tempfile
HERE=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]).read_bytes()
checks=0
def ok(value):
 global checks
 assert value
 checks+=1
def apply(p):return subprocess.run([sys.executable,str(HERE/'patch_v946.py'),str(p)],capture_output=True,text=True)
with tempfile.TemporaryDirectory() as d:
 p=Path(d)/'page.html';p.write_bytes(source);r=apply(p);ok(r.returncode==0)
 done=p.read_bytes();r=apply(p);ok(r.returncode!=0 and 'already applied' in r.stderr and p.read_bytes()==done)
 for version in (42,45):
  p.write_bytes(source.replace(b"v9.41'; /* v8.19",f"v9.{version}'; /* v8.19".encode()));ok(apply(p).returncode==0)
 p.write_bytes(source.replace(b"v9.41'; /* v8.19",b"v9.40'; /* v8.19"));ok(apply(p).returncode!=0)
 p.write_bytes(source.replace(b'function tabStops939(',b'function missingKeyboard('));ok(apply(p).returncode!=0)
 scripts=lambda s:re.findall(rb'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>',s,re.S)
 before,after=scripts(source),scripts(done);ok(len(before)==len(after))
 ok(sum(a!=b for a,b in zip(before,after))==1)
 # The complete fitting/preflight implementation remains byte-identical.
 section=lambda s,a,b:s[s.index(a):s.index(b,s.index(a))]
 ok(section(source,b'function printPages(pages){',b'function printAsk(')==section(done,b'function printPages(pages){',b'function printAsk('))
 # Exit presentation is the only change to the native approval dialog.
 old=section(source,b'function checkDialog826(',b'function drvCheck826(')
 new=section(done,b'function checkDialog826(',b'function drvCheck826(')
 new=new.replace(b'<div class="exit946"><button type="button" class="close" data-print946-close>Close</button></div>',b'')
 new=new.replace(b"box.querySelector('[data-print946-close]').onclick=close;",b'')
 ok([line.lstrip() for line in old.splitlines()]==[line.lstrip() for line in new.splitlines()])
 ok(done.count(b'data-print946-close>Close</button>')==2)
 css=(HERE/'exits946.css').read_text();ok('width:190mm' in css and '@media screen' in css and '@media print' not in css)
 print(f'{checks}/{checks} guarded patch and native readiness checks passed')
