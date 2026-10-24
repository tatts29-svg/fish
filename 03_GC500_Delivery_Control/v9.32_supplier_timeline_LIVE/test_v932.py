# Author: Andrew Fisher. Source boundaries and deterministic release application.
from pathlib import Path
import re,subprocess,tempfile,hashlib,sys
base=Path(sys.argv[1]);root=Path(__file__).resolve().parent
with tempfile.TemporaryDirectory() as d:
 p=Path(d)/'candidate.html';p.write_bytes(base.read_bytes());subprocess.run([sys.executable,str(root/'patch_v932.py'),str(p)],check=True)
 a=base.read_text(encoding='utf-8-sig');b=p.read_text(encoding='utf-8-sig')
 assert "['subhired','Sub-hired']" in b and "state.tab === 'subhired'" in b
 assert b.count('id="pane-subhired"')==1 and b.count('function renderSubhired932(')==1
 assert 'const beforeAbout925=renderAbout;' not in b
 timeline=b[b.index('function renderTimeline_held('):b.index('function renderAbout(')]
 assert 'ep819Html()' not in timeline
 for name in ['ep819Html','epRunSheet819','epInventory860','epDocuments860','companyModel925','rowHtml925','panel925','sourceUnits925','transport888Build']:
  token='function '+name+'(';i=a.index(token);j=b.index(token)
  # Compare exact native declaration through next function declaration.
  x=re.split(r'\n(?:async )?function ',a[i:],maxsplit=1)[0];y=re.split(r'\n(?:async )?function ',b[j:],maxsplit=1)[0]
  assert x==y,name+' native source changed'
 assert b.count('data-supplier932-company')>=3
 print('PASS route, Timeline removal, company relocation, retained native supplier/identity/finance source')
