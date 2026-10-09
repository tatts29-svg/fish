#!/usr/bin/env python3
"""Author: Andrew Fisher. Protect operational and visual source around a sound/launch change."""
import argparse
import hashlib
import json
from pathlib import Path
import re

def sha(s):
    return hashlib.sha256(s.encode()).hexdigest()

def between(s, a, b):
    assert s.count(a) == 1, a
    i=s.index(a)
    j=s.index(b,i+len(a))
    return s[i:j]

def checks(base, candidate):
    rows=[]
    def same(name, fn):
        a,b=fn(base),fn(candidate)
        rows.append({'name':name,'pass':a==b,'baseSha256':sha(a),'candidateSha256':sha(b)})
    same('operational source before renderer unchanged except release number',lambda s:s[:s.index('/* GC3D part 1 ')].replace("+ ' · v9.80'","+ ' · v9.79'"))
    same('complete source after renderer unchanged',lambda s:s[s.index('</script>',s.index('/* GC3D part 7 ')):])
    same('source DATA unchanged',lambda s:re.search(r'const DATA = (\{.*?\});\r?\n',s,re.S)[1])
    same('track and speed profile unchanged',lambda s:between(s,' /* key plan → world:',' /* ----- static batches ----- */'))
    same('car geometry unchanged',lambda s:between(s,'G.carHull=function(){','G.simReset=function(){'))
    same('camera and rendering unchanged',lambda s:between(s,'/* everything that is rebuilt each frame:','/* GC3D part 7 '))
    same('metre scale unchanged',lambda s:re.search(r'G\.M_PER_PT\s*=\s*[0-9.]+',s)[0])
    same('user sound preferences retained',lambda s:'\n'.join(re.findall(r"const KEY='gc500.showsound'|localStorage\.(?:getItem|setItem)\('gc500.showengine'[^;]+",s)))
    rows.append({'name':'version changes exactly once','pass':candidate.count("+ ' · v9.80'")==1 and "+ ' · v9.79'" not in candidate})
    return rows

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('base');p.add_argument('candidate');p.add_argument('output');a=p.parse_args()
    base=Path(a.base).read_text();candidate=Path(a.candidate).read_text()
    rows=checks(base,candidate)
    for old,new in [('const DATA = {','const DATA = {"unexpected980":true,'),('G.carHull=function(){','G.carHull=function(){/* mutation */'),('G.camStep=function(dt){','G.camStep=function(dt){/* mutation */')]:
        assert old in candidate
        assert not all(r['pass'] for r in checks(base,candidate.replace(old,new,1))), 'mutation was not detected'
    out={'author':'Andrew Fisher','sha256':sha(candidate),'baseSha256':sha(base),'checks':rows,'pass':all(r['pass'] for r in rows),'mutationChecks':3}
    Path(a.output).write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({'pass':out['pass'],'checks':len(rows),'failed':[r['name'] for r in rows if not r['pass']]}))
    raise SystemExit(0 if out['pass'] else 1)
