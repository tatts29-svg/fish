#!/usr/bin/env python3
"""Author: Andrew Fisher. Fold recognised correction evidence without changing any stored note."""
from pathlib import Path
import argparse,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('page',type=Path);ap.add_argument('--preview-base-941',action='store_true');a=ap.parse_args()
p=a.page;raw=p.read_bytes();s=raw.decode('utf-8-sig')
assert 'function correctionNote947(' not in s,'v9.47 already applied'
prior='9.41' if a.preview_base_941 else '9.46'
assert " · v"+prior+"'; /* v8.19" in s,'Unexpected base release'
assert '/* drawer935 null-safe VMS source */' in s,'Expected restored modern drawer'
s=rep(s,'function drawer816(a){',(HERE/'notes947.js').read_text()+'\nfunction drawer816(a){','read-only note presentation',str(p))
old="const p = document.createElement('p'); p.className = 'note816'; p.textContent = a._note; hist.append(h, p);"
s=rep(s,old,'hist.appendChild(h); appendNote947(hist,a._note);','fold recognised evidence only',str(p))
s=rep(s,'\n</head>\n','\n<style id="notes947-style">'+(HERE/'notes947.css').read_text()+'</style>\n</head>\n','readable evidence styling',str(p))
s=rep(s," · v"+prior+"'; /* v8.19"," · v9.47'; /* v8.19",'release footer',str(p))
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+s.encode())
print('v9.47 readable correction note applied; stored notes and editing are unchanged')
