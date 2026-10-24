"""Author: Andrew Fisher. Only the existing spot module, one helper and release footer change."""
import re,sys,json,hashlib
from pathlib import Path
a,b=[Path(x).read_text() for x in sys.argv[1:3]];checks=[]
def test(name,ok):
    checks.append({'name':name,'ok':bool(ok)});assert ok,name
pattern=r'<script\b[^>]*>[\s\S]*?</script>'
aa=re.findall(pattern,a);bb=re.findall(pattern,b);new=re.search(r'<script id="area1206-script">[\s\S]*?</script>\n',b)
test('exactly one helper script added',len(bb)==len(aa)+1 and bool(new))
c=b.replace(new[0],'',1)
old=re.search(r'<script id="spot1117-script">[\s\S]*?</script>',a)[0];revised=re.search(r'<script id="spot1117-script">[\s\S]*?</script>',c)[0]
c=c.replace(revised,old,1)
footer=re.search(r"\+' · v(\d+\.\d+)'; /\* v8.19 release922",a)[0]
c=c.replace("+' · v12.06'; /* v8.19 release922",footer,1)
test('all other page bytes are identical',a==c)
test('existing spot gesture and coordinate conversion unchanged',all(x in revised for x in ['const HOLD_MS = 550, MOVE_PX = 8','function sheetToLL(x, y)','S.pin = {x: s.x, y: s.y']))
test('no operational write or automatic messaging endpoint added',not re.search(r'/api/(?:sms|mms|ticks)|loading872Set\(|\.db\.doc|method\s*:\s*[\"\u0027](?:POST|PUT|DELETE)',new[0]+revised))
test('export is freshly drawn at 3840 pixels', 'EDGE=3840' in revised and 'await svgFromWorker' in revised)
test('unknown doors stay explicit', 'Door position/direction not recorded' in revised)
test('guarded existing explorer build retained', 'explorer.js?v=e175ec073b2d' in revised)
test('native share cancellation remains non-delivery', 'Share cancelled. Nothing was sent.' in revised)
print(json.dumps({'author':'Andrew Fisher','base_sha256':hashlib.sha256(a.encode()).hexdigest(),'candidate_sha256':hashlib.sha256(b.encode()).hexdigest(),'checks':checks,'passed':len(checks)}))
