"""Author: Andrew Fisher. Exact base, patch uniqueness and unchanged non-car source."""
import hashlib, importlib.util, json, re, sys
from pathlib import Path
HERE=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('patch1091',HERE/'patch_v1091.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
base_path=Path(sys.argv[1]);base=base_path.read_text();development=hashlib.sha256(base.encode()).hexdigest()==mod.DEV_SHA;candidate=mod.patch(base,str(base_path),development);checks=[]
def section(text,start,end):
    a=text.index(start);b=text.index(end,a+len(start));return text[a:b]
for label,start,end in [
 ('authored car geometry','/* Author: Andrew Fisher. v8.00 — surfaced race coupe.','/* GC3D — bounded, simplified facade reflections'),
 ('physical simulation','G.simReset=function(){','/* everything that is rebuilt each frame:'),
 ('camera/director','/* GC3D part 4 — the camera and the frame.','G.render=function(){'),
 ('scene background rendering','G.render=function(){','/* GC3D part 5'),
 ('surroundings','/* GC3D part 5','/* GC3D part 6'),
 ('sound','/* GC3D part 7','/* GC500')]:
    # Source comments delimit independent modules, not line-number approximations.
    assert section(base,start,end)==section(candidate,start,end),label;checks.append(label+' byte-identical')
pattern=r'<script\b[^>]*\bid=["\']([^"\']+)["\'][^>]*>([\s\S]*?)</script>'
assert dict(re.findall(pattern,base))==dict(re.findall(pattern,candidate));checks.append('all named data, contact, operational and Showcase scripts byte-identical')
for bad in [base+' ',candidate]:
    try:mod.patch(bad,'bad',development)
    except ValueError:pass
    else:raise AssertionError('wrong base/repeated patch accepted')
checks.append('modified base and repeated application rejected')
result={'author':'Andrew Fisher','baseSha256':hashlib.sha256(base.encode()).hexdigest(),'candidateSha256':hashlib.sha256(candidate.encode()).hexdigest(),'checks':checks,'pass':True}
if len(sys.argv)>2:Path(sys.argv[2]).write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
