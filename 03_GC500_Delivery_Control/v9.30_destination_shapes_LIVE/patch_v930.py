#!/usr/bin/env python3
"""Author: Andrew Fisher. Use sourced destination silhouettes instead of large orange map labels."""
from pathlib import Path
import re,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes();s=raw.decode('utf-8-sig')
assert 'destination930-script' not in s,'v9.30 already applied'
assert 'window.Shapes926=api' in s and 'window.MasterPlan911 = api' in s,'Expected sourced master-plan Arrange loads'
foot=re.findall(r" · v(\d+)\.(\d+)'; /\* v8\.19",s)
assert len(foot)==1 and tuple(map(int,foot[0])) in ((9,28),(9,29)),'Use current v9.28 or v9.29 base'
s=rep(s," · v"+'.'.join(foot[0])+"'; /* v8.19"," · v9.30'; /* v8.19",'release footer',str(p))
s=rep(s,"  if (typeof Shapes926 !== 'undefined') Shapes926.overlay(view,map,current,ui.selected);\n",'', 'draw outlines after viewport sizing',str(p))
start=s.index('  const projected = data.map(p => { const xy = map.project(p.point);')
end=s.index('  paint();\n }\n function scheduleDraw()',start)
old=s[start:end]
assert "pins.__drop911Signature" in old and "labels(projected" in old,'Expected native numbered marker draw block'
s=rep(s,old,"  DestinationMarkers930.draw(view,map,current,ui.selected,data);\n",'sourced outlines and compact adjacent labels',str(p))
# Reuse the projected source geometry for label collision bounds, with no layout reads.
s=rep(s,'  const parts=[];\n  if(view.__shape926Model','  const parts=[];view.__destination930Obstacles=[];\n  if(view.__shape926Model','reset cached projection bounds',str(p))
old="""   parts.push('<div data-shape926-map-ref="'+esc(ref.key)+'" style="left:'+left+'px;top:'+top+'px">'+api.svg(ref.key,o)+'</div>');"""
s=rep(s,old,"   view.__destination930Obstacles.push(...DestinationMarkers930.bounds(L,at));\n"+old,'source polygon and door collision bounds',str(p))
css=(HERE/'markers930.css').read_text();js=(HERE/'markers930.js').read_text()
insert='\n<style id="destination930-style">'+css+'</style>\n<script id="destination930-script">'+js+'</script>\n'
end=re.search(r'</script>(\s*</body></html>\s*)$',s)
assert end,'Unexpected page end'
s=rep(s,end.group(0),'</script>'+insert+end.group(1),'destination marker presentation',str(p))
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+s.encode())
print('v9.30 destination markers applied; no position, record or financial changes')
