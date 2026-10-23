"""Author: Andrew Fisher. Release-scope checks: all unrelated content stays byte-identical."""
import re,sys,hashlib
from pathlib import Path
base=Path(sys.argv[1]).read_text();candidate=Path(sys.argv[2]).read_text()
scripts=lambda s:re.findall(r'<script\b[^>]*>.*?</script>',s,re.S)
a,b=scripts(base),scripts(candidate)
changed=[s for s in a if s not in b]
assert len(b)==len(a)+1
assert len(changed)==2
assert sum('id="shapes1060-script"' in s for s in changed)==1
assert sum("+' · v11.46'; /* v8.19 release922" in s for s in changed)==1
for s in changed:
 if 'id="shapes1060-script"' not in s:assert s.replace("+' · v11.46'; /* v8.19 release922","+' · v11.47'; /* v8.19 release922") in b
for name in ['vmsmap1139-script','satmap1141-script','find1142-script','steady1143-script']:
 pat=r'<script id="'+name+r'">.*?</script>'
 assert re.search(pat,base,re.S).group()==re.search(pat,candidate,re.S).group(),name
restored=candidate.replace(next(s for s in b if 'id="mapunits1147-script"' in s)+'\n','')
restored=restored.replace(next(s for s in b if 'id="shapes1060-script"' in s),next(s for s in a if 'id="shapes1060-script"' in s))
restored=restored.replace("+' · v11.47'; /* v8.19 release922","+' · v11.46'; /* v8.19 release922")
assert restored==base, 'Unrelated page bytes changed'
print('PASS bounded script changes; satellite/finder/Showcase, all tracker code/data and QR tokens unchanged')
print('candidate SHA256',hashlib.sha256(candidate.encode()).hexdigest())
