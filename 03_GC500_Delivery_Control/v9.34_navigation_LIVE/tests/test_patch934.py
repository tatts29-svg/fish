#!/usr/bin/env python3
"""Author: Andrew Fisher. Guarded patch reproducibility; no network or record writes."""
from pathlib import Path
import hashlib, os, subprocess, tempfile
root=Path(__file__).resolve().parents[1]
base=Path(os.environ['BASE'])
with tempfile.TemporaryDirectory() as d:
 p=Path(d)/'candidate.html';p.write_bytes(base.read_bytes())
 def run(): return subprocess.run(['python3',str(root/'patch_v934.py'),str(p)],capture_output=True,text=True)
 first=run();assert first.returncode==0,first.stderr
 done=p.read_bytes();s=done.decode('utf-8-sig')
 assert s.count('id="navigation934-script"')==1 and s.count('id="navigation934-style"')==1
 assert " · v9.34'; /* v8.19" in s
 assert s.count('const dismiss934 = () =>')==5
 second=run();assert second.returncode!=0 and 'already applied' in second.stderr
 assert p.read_bytes()==done,'Refused patch modified its input'
 p.write_bytes(base.read_bytes().replace(b'items933-script',b'unexpected-source'))
 wrong=p.read_bytes();assert run().returncode!=0;assert p.read_bytes()==wrong
 print('PASS patch builds once, advances footer, retains pure dismissal guards, refuses duplicate/wrong base without modification')
 print('Candidate SHA256 '+hashlib.sha256(done).hexdigest())
