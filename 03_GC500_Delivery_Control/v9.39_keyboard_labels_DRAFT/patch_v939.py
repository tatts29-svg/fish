#!/usr/bin/env python3
"""Author: Andrew Fisher. Repair native Tab traversal and supplier display labels."""
from pathlib import Path
import re,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes();s=raw.decode('utf-8-sig')
assert 'function tabStops939(' not in s and 'function supplierLabel939(' not in s,'v9.39 already applied'
assert 'timeline937-script' in s and 'navigation934-script' in s,'Expected integrated v9.37 or v9.38 source'
footer=re.search(r" · v9\.(37|38)'; /\* v8\.19",s);assert footer,'Expected v9.37/v9.38 footer'
s=rep(s,footer.group(0)," · v9.39'; /* v8.19",'release footer',str(p))
s=rep(s,'function key(e){if(e.defaultPrevented)return;const n=top();if(!n)return;',(HERE/'focus939.js').read_text()+'\nfunction key(e){if(e.defaultPrevented)return;const n=top();if(!n)return;','native keyboard helpers',str(p))
old=''' if(e.key!=='Tab')return;const f=[...n.querySelectorAll('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(b=>!b.disabled&&!b.hidden&&b.getClientRects().length&&!b.closest('[hidden],[inert]'));
 if(!f.length)return;const i=f.indexOf(document.activeElement);if(i<0||e.shiftKey&&i===0||!e.shiftKey&&i===f.length-1){e.preventDefault();e.stopImmediatePropagation();(e.shiftKey?f.at(-1):f[0]).focus();}'''
s=rep(s,old," if(e.key==='Tab')tabKey939(e,n);",'summary-aware native Tab traversal',str(p))
s=rep(s,'function productHtml931(p,print){',(HERE/'supplier939.js').read_text()+'\nfunction productHtml931(p,print){','readable supplier label helper',str(p))
s=rep(s,"supplier={'event-portables':'Event Portables','prem-air-hire':'PremAir Hire'}[owner]||txt(owner).replace(/^other:/,'');return",'supplier=supplierLabel939(owner);return','loading and print supplier display',str(p))
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+s.encode())
print('v9.39 native keyboard traversal and readable supplier labels applied; no operational data changed')
