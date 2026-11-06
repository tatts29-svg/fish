# Author: Andrew Fisher
from pathlib import Path
import subprocess, sys, tempfile
HERE=Path(__file__).resolve().parent
base=Path(sys.argv[1]).read_bytes()
assert b'window.Questions967=Questions967;' in base
patch=HERE/'patch_v968.py'
checks=[]
with tempfile.TemporaryDirectory() as folder:
 p=Path(folder)/'page.html';p.write_bytes(base)
 def run(): return subprocess.run([sys.executable,str(patch),str(p)],capture_output=True)
 assert run().returncode==0;checks.append('Actual v9.67 predecessor accepted')
 changed=p.read_bytes();s=changed.decode('utf-8-sig')
 added='<style id="timeline968-style">\n'+(HERE/'timeline968.css').read_text()+'\n</style>\n<script id="timeline968-script">\n'+(HERE/'timeline968.js').read_text()+'\n</script>\n'
 assert s.count(added)==1;checks.append('Exactly one scoped helper and style added')
 restored=s.replace(added,'').replace(" · v9.68'; /* v8.19"," · v9.67'; /* v8.19")
 assert restored==base.decode('utf-8-sig');checks.append('Every pre-existing model, financial, print and view source byte preserved')
 assert run().returncode!=0 and p.read_bytes()==changed;checks.append('Duplicate application rejected without writing')
 for name,old,new in [('Wrong version',b' v9.67\'; /* v8.19',b' v9.66\'; /* v8.19'),('Missing predecessor helper',b'window.Questions967=Questions967;',b'window.Other=Questions967;'),('Missing predecessor script',b'id="questions967-script"',b'id="other-script"'),('Missing final insertion anchor',b'</body></html>',b'</body>\n</html>')]:
  bad=base.replace(old,new);assert bad!=base;p.write_bytes(bad)
  assert run().returncode!=0 and p.read_bytes()==bad;checks.append(name+' rejected atomically')
print('\n'.join(checks));print(str(len(checks))+' patch checks passed')
