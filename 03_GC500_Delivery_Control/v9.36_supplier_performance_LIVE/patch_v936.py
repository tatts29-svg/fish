#!/usr/bin/env python3
"""Author: Andrew Fisher. One native asset snapshot per supplier render."""
from pathlib import Path
import sys,re
here=Path(__file__).resolve().parent
sys.path.insert(0,str(here.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text(encoding='utf-8-sig');bom=p.read_bytes().startswith(b'\xef\xbb\xbf')
if 'function renderSubhired936Held(' in s:raise SystemExit('Already applied')
m=re.search(r" · v9\.(34|35)'; /\* v8.19",s)
if not m:raise SystemExit('Expected release 34 or 35')
s=rep(s,m.group(0)," · v9.36'; /* v8.19",'footer',p)
s=rep(s,'function renderSubhired932(){','// Author: Andrew Fisher. Native hold is released in finally; no persistent supplier cache.\nfunction renderSubhired932(){ return holdAssets(renderSubhired936Held); }\nfunction renderSubhired936Held(){','one render-scoped native hold',p)
p.write_bytes((b'\xef\xbb\xbf' if bom else b'')+s.encode())
