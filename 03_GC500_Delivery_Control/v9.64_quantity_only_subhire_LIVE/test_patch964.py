# Author: Andrew Fisher. Atomic exact-base patching and financial-source preservation.
from pathlib import Path
import subprocess,sys,tempfile,json
HERE=Path(__file__).resolve().parent
base=Path(sys.argv[1]).read_bytes();checks=[]
with tempfile.TemporaryDirectory() as work:
 p=Path(work)/'page.html';p.write_bytes(base)
 def run():return subprocess.run([sys.executable,str(HERE/'patch_v964.py'),str(p)],capture_output=True,text=True)
 r=run();assert r.returncode==0,r.stderr+r.stdout
 after=p.read_bytes();checks.append('exact live v9.63 applies')
 assert b'function quantitySubhire964Read(' in after and b"v9.64'; /* v8.19" in after
 r=run();assert r.returncode!=0 and p.read_bytes()==after;checks.append('repeat refused atomically')
 for label,bad in [('wrong predecessor',base.replace(b"v9.63'; /* v8.19",b"v9.62'; /* v8.19")),('modified source',base.replace(b'function inventory(){',b'function inventory (){'))]:
  p.write_bytes(bad);r=run();assert r.returncode!=0 and p.read_bytes()==bad;checks.append(label+' refused atomically')
 p.write_bytes(base);r=run();assert r.returncode==0 and p.read_bytes()==after;checks.append('deterministic output')
 for name in ['chargeLines','tradeCharges','moneySummary','ourCosts','cj764Fencing','fh866Model','pricingAliases834','gcModel925','gcUnits925','subOf','setSupplied','setLabour','toiletItem962']:
  token=('function '+name+'(').encode();b=base.index(token);a=after.index(token)
  endb=base.find(b'\nfunction ',b+len(token));enda=after.find(b'\nfunction ',a+len(token));assert endb>0 and enda>0 and base[b:endb]==after[a:enda],name;checks.append(name+' unchanged')
 print(json.dumps({'author':'Andrew Fisher','pass':True,'checks':len(checks),'names':checks},indent=2))
