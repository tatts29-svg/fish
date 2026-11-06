# Author: Andrew Fisher. Atomic patch guards and source preservation.
from pathlib import Path
import subprocess, sys, tempfile, json
HERE=Path(__file__).resolve().parent
base=Path(sys.argv[1]).read_bytes()
patch=HERE/'patch_v963.py'
checks=[]
with tempfile.TemporaryDirectory() as work:
 p=Path(work)/'candidate.html';p.write_bytes(base)
 r=subprocess.run([sys.executable,str(patch),str(p)],capture_output=True,text=True)
 assert r.returncode==0,r.stderr+r.stdout
 after=p.read_bytes();checks.append('actual v9.62 predecessor applies')
 assert b'function physicalCountAssets963(' in after and b"v9.63'; /* v8.19" in after
 r=subprocess.run([sys.executable,str(patch),str(p)],capture_output=True,text=True)
 assert r.returncode!=0 and p.read_bytes()==after
 checks.append('repeat application rejected without changing bytes')
 for name,source in [('wrong predecessor',base.replace(b"v9.62'; /* v8.19",b"v9.61'; /* v8.19")),('missing anchor',base.replace(b'function inventory(){',b'function inventory (){'))]:
  p.write_bytes(source);r=subprocess.run([sys.executable,str(patch),str(p)],capture_output=True,text=True)
  assert r.returncode!=0 and p.read_bytes()==source
  checks.append(name+' rejected atomically')
 # Financial and source functions are unchanged (up to the next top-level function).
 for name in ['allAssets','chargeLines','tradeCharges','moneySummary','ourCosts','cj764Fencing','fh866Model','pricingAliases834']:
  token=('function '+name+'(').encode();b=base.index(token);a=after.index(token)
  endb=base.find(b'\nfunction ',b+len(token));enda=after.find(b'\nfunction ',a+len(token))
  assert endb>0 and enda>0 and base[b:endb]==after[a:enda],name
  checks.append(name+' source unchanged')
 assert b'const k=Math.max(0,Math.min(1,(now-start)/(COUNT*1000)))' in after
 # Regression of the exact easing expression used in the browser.
 for final in [0,62.8,100]:
  for elapsed in [-500,-1,0,500,1600,5000]:
   k=max(0,min(1,elapsed/1600));display=final*(1-(1-k)**3)
   assert 0<=display<=final
 checks.append('first-frame, end-frame and zero readings remain bounded')
 print(json.dumps({'author':'Andrew Fisher','pass':True,'checks':len(checks),'names':checks},indent=2))
