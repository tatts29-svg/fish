#!/usr/bin/env python3
"""Author: Andrew Fisher. Keep non-VMS references on the modern equipment drawer."""
from pathlib import Path
import sys,re
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes();s=raw.decode('utf-8-sig')
assert '/* drawer935 null-safe VMS source */' not in s,'v9.35 already applied'
assert 'items933-script' in s and 'navigation934-script' in s,'Expected v9.34 item/navigation source'
s=rep(s," · v9.34'; /* v8.19"," · v9.35'; /* v8.19",'release footer',str(p))
s=rep(s,"const boards=typeof vms913BoardsOn==='function'?vms913BoardsOn(a):[];if(!boards.length)","const boards=typeof vms913BoardsOn==='function'?(vms913BoardsOn(a)||[]):[];/* drawer935 null-safe VMS source */if(!boards.length)",'nullable native VMS projection',str(p))
s=rep(s,'function tidy(a,body){const ph=',"function tidy(a,body){if(window.Drawer935)Drawer935.photos(a,body);const ph=",'consolidate presentation photo groups',str(p))
js=(HERE/'drawer935.js').read_text()
tail=re.search(r'</script>(\s*</body></html>\s*)$',s);assert tail
s=rep(s,tail.group(0),'</script>\n<script id="drawer935-script">'+js+'</script>'+tail.group(1),'original-home photo group presentation',str(p))
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+s.encode())
print('v9.35 nullable VMS drawer recovery applied')
