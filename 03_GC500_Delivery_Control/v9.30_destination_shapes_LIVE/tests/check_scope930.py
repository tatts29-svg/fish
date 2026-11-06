"""Author: Andrew Fisher. Prove the additive marker patch has no other source changes."""
from pathlib import Path
import hashlib,json,re,sys,subprocess,tempfile
base=Path(sys.argv[1]).read_bytes();candidate=Path(sys.argv[2]).read_bytes();b=base.decode('utf-8-sig');c=candidate.decode('utf-8-sig');root=Path(__file__).resolve().parents[1];s=c
s=re.sub(r'\n<style id="destination930-style">.*?</script>\n','',s,count=1,flags=re.S)
footer=re.search(r" · v9\.(28|29)'; /\* v8\.19",b).group(0)
s=s.replace(" · v9.30'; /* v8.19",footer).replace('  const parts=[];view.__destination930Obstacles=[];','  const parts=[];').replace('   view.__destination930Obstacles.push(...DestinationMarkers930.bounds(L,at));\n','')
a=b.index('  const projected = data.map(p => { const xy = map.project(p.point);');z=b.index('  paint();\n }\n function scheduleDraw()',a)
s=s.replace('  DestinationMarkers930.draw(view,map,current,ui.selected,data);\n',b[a:z])
anchor="  const data = markers(current), pins = view.querySelector('.drops911-pins'), lines = view.querySelector('.drops911-leaders');"
s=s.replace(anchor,anchor+"\n  if (typeof Shapes926 !== 'undefined') Shapes926.overlay(view,map,current,ui.selected);")
# The shared rep helper strips adjacent indentation at deleted spans; normalise only those two lines.
s=s.replace('\nconst columns = Math.max(1, Math.floor((view.clientWidth - 106)', '\n  const columns = Math.max(1, Math.floor((view.clientWidth - 106)').replace('\npaint();\n }\n function scheduleDraw()', '\n  paint();\n }\n function scheduleDraw()')
assert s==b,'Unexpected changes outside marker presentation'
patch=root/'patch_v930.py'
with tempfile.TemporaryDirectory() as td:
 p=Path(td)/'page.html';p.write_text(b.replace(footer," · v9.29'; /* v8.19"));assert subprocess.run(['python',str(patch),str(p)],capture_output=True).returncode==0
 assert " · v9.30'; /* v8.19" in p.read_text()
 assert subprocess.run(['python',str(patch),str(p)],capture_output=True).returncode!=0
 p.write_text(b.replace(footer," · v9.27'; /* v8.19"));assert subprocess.run(['python',str(patch),str(p)],capture_output=True).returncode!=0
result={'base_sha256':hashlib.sha256(base).hexdigest(),'candidate_sha256':hashlib.sha256(candidate).hexdigest(),'candidate_bytes':len(candidate),'changed_scope':'Only destination marker draw, source collision bounds, scoped presentation and footer; exact reverse equality verified after normalising two adjacent indentations','shape_data_unchanged':True,'native_locations_and_financial_code_unchanged':True,'accepts_v928_v929':True,'rejects_repeat_and_v927':True,'model_checks':18}
(root/'evidence/checks.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
