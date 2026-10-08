# Author: Andrew Fisher. Sourced master shapes and native truck-side choice in Arrange loads.
# Rebase only on the integrated v9.25 release; the following patch advances v9.27.
import hashlib, re, sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
from compile_shapes926 import blob, BLOB_SHA
p=Path(sys.argv[1]);raw=p.read_bytes();bom=raw.startswith(b'\xef\xbb\xbf');s=raw.decode('utf-8-sig')
assert 'window.MasterPlan911 = api' in s, 'Expected native master-plan Arrange loads base'
assert 'window.gcUnits925=gcUnits925' in s and 'transportUnitId924' in s, 'Apply v924 and v925 before v926; current physical-unit identity is required'
assert 'window.Shapes926' not in s and 'shapes926-data' not in s, 'v926 already applied'
foot=re.findall(r" · v(\d+)\.(\d+)'; /\* v8\.19",s)
assert len(foot)==1 and tuple(map(int,foot[0]))==(9,25), 'Build v9.26 on the integrated v9.25 base'
s=rep(s," · v9.25'; /* v8.19"," · v9.26'; /* v8.19",'advance master shapes footer',str(p))
old='''  if (box.__drop911Text !== text) { box.innerHTML = text; box.__drop911Text = text; }'''
s=rep(s,old,old+'''\n  if (typeof Shapes926 !== 'undefined') Shapes926.panel(el,current,ui.selected);''','selected load shapes',str(p))
old='''  const data = markers(current), pins = view.querySelector('.drops911-pins'), lines = view.querySelector('.drops911-leaders');'''
s=rep(s,old,old+'''\n  if (typeof Shapes926 !== 'undefined') Shapes926.overlay(view,map,current,ui.selected);''','projected master shapes',str(p))
css=(HERE/'shapes926.css').read_text();js=(HERE/'geometry926.js').read_text()+'\n'+(HERE/'shapes926.js').read_text()
insert='\n<style id="shapes926-style">'+css+'</style>\n<script id="shapes926-data" data-sha256="'+BLOB_SHA+'">const MASTER_SHAPES926_DATA = '+blob+';</script>\n<script id="shapes926-script">'+js+'</script>\n'
end = re.search(r'</script>(\n</body></html>\s*)$', s)
assert end, 'Unexpected page end'
s=rep(s,end.group(0),'</script>'+insert+end.group(1),'shapes source blocks',str(p))
p.write_bytes((b'\xef\xbb\xbf' if bom else b'')+s.encode())
print('v926 shapes added; drawing SHA '+BLOB_SHA+'; no operational record changes')
