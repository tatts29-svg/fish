# Author: Andrew Fisher
from pathlib import Path
import os,subprocess,tempfile,json
here=Path(__file__).resolve().parent
base=Path(os.environ['BASE_PAGE'])
patch=here/'patch_v959.py'
with tempfile.TemporaryDirectory() as tmp:
 p=Path(tmp)/'candidate.html';p.write_bytes(base.read_bytes())
 first=subprocess.run(['python3',str(patch),str(p)],capture_output=True,text=True)
 assert first.returncode==0,first.stderr
 applied=p.read_bytes()
 def catalogue(blob):
  line=blob.decode('utf-8-sig').split('const FENCE_PROGRESS848 = ',1)[1].split('\n',1)[0]
  return json.loads(line.rstrip(';'))
 expected=catalogue(applied)
 scrub=subprocess.run(['python3',str(here.parent/'toolchain'/'scrub_attributions.py'),str(p)],capture_output=True,text=True)
 assert scrub.returncode==0,scrub.stderr
 assert catalogue(p.read_bytes())==expected,'Standard build changed an exact source fingerprint'
 p.write_bytes(applied)
 twice=subprocess.run(['python3',str(patch),str(p)],capture_output=True,text=True)
 assert twice.returncode!=0 and p.read_bytes()==applied
 for old,new in [('const FENCE_PROGRAMME958 =','const FENCE_PROGRAMME_OTHER ='),(" · v9.58'; /* v8.19"," · v9.57'; /* v8.19")]:
  p.write_text(base.read_text('utf-8-sig').replace(old,new))
  before=p.read_bytes();r=subprocess.run(['python3',str(patch),str(p)],capture_output=True,text=True)
  assert r.returncode!=0 and p.read_bytes()==before
 print(json.dumps({'author':'Andrew Fisher','pass':True,'checks':5,'basis':'Exact predecessor, idempotence standard attribution scrub preservation and no write on rejection'}))
