#!/usr/bin/env python3
"""Author: Andrew Fisher. Add physical-unit identity views without migrating any record."""
from pathlib import Path
import re,sys
here=Path(__file__).resolve().parent
sys.path.insert(0,str(here.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]); s=p.read_text(encoding='utf-8-sig'); bom=p.read_bytes().startswith(b'\xef\xbb\xbf')
if 'units925-script' in s: raise SystemExit('v9.25 already applied')
for guard in ('function numberItemOf(', 'transportUnitId924', 'function openAssetDraw(', 'function renderAbout(', 'function unitAdd(', 'function labourUnits('):
 if guard not in s: raise SystemExit('Missing unit integration prerequisite: '+guard)
foot=re.findall(r" · v(\d+)\.(\d+)'; /\* v8\.19",s)
if len(foot)!=1 or tuple(map(int,foot[0]))!=(9,24): raise SystemExit('Build v9.25 on the integrated v9.24 base')
s=rep(s," · v9.24'; /* v8.19"," · v9.25'; /* v8.19",'advance unit release footer',p)
idx=s.find('</head>')
if idx<0: raise SystemExit('Missing main head end')
s=s[:idx]+'<style id="units925-style">\n'+(here/'units925.css').read_text()+'\n</style>\n'+s[idx:]
idx=s.rfind('</body>')
if idx<0: raise SystemExit('Missing body end')
s=s[:idx]+'<script id="units925-script">\n'+(here/'units925.js').read_text()+'\n</script>\n'+s[idx:]
p.write_text(('\ufeff' if bom else '')+s,encoding='utf-8')
print('v9.25 unit and supplier views applied; source records unchanged')
