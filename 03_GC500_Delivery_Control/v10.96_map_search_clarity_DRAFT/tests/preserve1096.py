"""Author: Andrew Fisher. Pass the exact private live base as argv[1]."""
from pathlib import Path
import re,hashlib,sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from patch_v1096 import patch
base=Path(sys.argv[1]).read_bytes();out=patch(base)
s=out.decode();s=re.sub(r'<script id="map1096-host">.*?</script>\n','',s,flags=re.S).replace("+' · v10.96 DRAFT'","+' · v10.95'")
s=s.replace(' if (!todayShowing()) return false; /* map1096: do not start a delayed Today burst over another tab. */\n','').replace('  if (!todayShowing() || reduced() || !c.isConnected) { c.remove(); return; } /* map1096: stop hidden/reduced-motion work. */\n','')
assert s.encode()==base
for raw in [out,base+b'\n']:
 try: patch(raw);raise AssertionError('guard failed')
 except ValueError:pass
print('PASS exact original preservation except two visibility guards + added module/footer; repeated/wrong base rejected')
