#!/usr/bin/env python3
"""Author: Andrew Fisher. Transactional patch guards on a private prior-page fixture."""
import os,subprocess,tempfile
from pathlib import Path
here=Path(__file__).resolve().parents[1];base=Path(os.environ['BASE944']).read_bytes();n=0
with tempfile.TemporaryDirectory(prefix='owner944-') as tmp:
 p=Path(tmp)/'candidate.html'
 def run(*flags):return subprocess.run(['python3',str(here/'patch_v944.py'),str(p),*flags],capture_output=True)
 p.write_bytes(base);assert run().returncode!=0 and p.read_bytes()==base;n+=1
 assert run('--preview-base-941').returncode==0;n+=1;candidate=p.read_bytes()
 assert run('--preview-base-941').returncode!=0 and p.read_bytes()==candidate;n+=1
 finalbase=base.replace(b" \xc2\xb7 v9.41'; /* v8.19",b" \xc2\xb7 v9.43'; /* v8.19");assert finalbase!=base
 p.write_bytes(finalbase);assert run().returncode==0 and p.read_bytes()==candidate;n+=1
 before=base.decode('utf-8-sig');after=candidate.decode('utf-8-sig')
 def function(s,name):
  start=s.index('function '+name+'(');end=s.index('\nfunction ',start+1);return s[start:end]
 for name in ['contractCharge','lineMoney','rateFor','assetTotal']:
  if 'function '+name+'(' in before:assert function(before,name)==function(after,name);n+=1
print('{"author":"Andrew Fisher","passed":true,"patchChecks":'+str(n)+'}')
