#!/usr/bin/env python3
"""Author: Andrew Fisher. Patch prerequisites, deterministic build and duplicate guard."""
from pathlib import Path
import os,subprocess,tempfile,hashlib
here=Path(__file__).resolve().parents[1];base=Path(os.environ['BASE']).read_bytes()
with tempfile.TemporaryDirectory() as d:
 p=Path(d)/'page.html'
 def run():return subprocess.run(['python3',str(here/'patch_v937.py'),str(p)],capture_output=True,text=True)
 for version in ['34','36']:
  p.write_bytes(base.replace(" · v9.34'; /* v8.19".encode(),(" · v9."+version+"'; /* v8.19").encode()))
  r=run();assert r.returncode==0,r.stderr
  result=p.read_bytes();assert result.count(b'id="timeline937-script"')==1
  assert " · v9.37'; /* v8.19".encode() in result
  assert b"if(kind!='loading'" not in result
  assert b"if(kind!=='loading'&&window.TimelineStrip937)TimelineStrip937.reveal();" in result
  assert run().returncode!=0 and p.read_bytes()==result
  print('PASS guarded v9.'+version+' to v9.37 patch')
 p.write_bytes(base.replace(b'navigation934-script',b'wrong-base'))
 before=p.read_bytes();assert run().returncode!=0 and p.read_bytes()==before
 print('PASS unsupported base refused without file change')
