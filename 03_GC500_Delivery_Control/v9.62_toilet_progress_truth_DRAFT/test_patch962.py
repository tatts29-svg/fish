# Author: Andrew Fisher
from pathlib import Path
import subprocess,sys,tempfile
base=Path(sys.argv[1]);patch=Path(__file__).with_name('patch_v962.py');raw=base.read_bytes()
def run(path):return subprocess.run([sys.executable,str(patch),str(path)],capture_output=True)
with tempfile.TemporaryDirectory() as tmp:
 p=Path(tmp)/'candidate.html';p.write_bytes(raw)
 r=run(p);assert r.returncode==0,r.stderr.decode();good=p.read_bytes();assert b'function toiletItem962(' in good and b'v9.62' in good
 r=run(p);assert r.returncode!=0 and p.read_bytes()==good,'double application must not mutate'
 p.write_bytes(raw.replace(" · v9.61'; /* v8.19".encode()," · v9.60'; /* v8.19".encode()));before=p.read_bytes();r=run(p);assert r.returncode!=0 and p.read_bytes()==before,'wrong base must not mutate'
 p.write_bytes(raw.replace(b' const unitsOn = [...onBy.values()].reduce((n, v) => n + v, 0);',b' const unitsOn = 0;'));before=p.read_bytes();r=run(p);assert r.returncode!=0 and p.read_bytes()==before,'changed anchor must not mutate'
 p.write_bytes(raw);assert run(p).returncode==0;assert p.read_bytes()==good,'reproducible patch'
print('v9.62 patch guards: 5 passed')
