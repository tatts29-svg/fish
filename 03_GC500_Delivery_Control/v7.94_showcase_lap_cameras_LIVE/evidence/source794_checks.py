#!/usr/bin/env python3
"""Author: Andrew Fisher. Reproducible visual patch with protected business/physics sources."""
from pathlib import Path
import hashlib, importlib.util, json, re, subprocess, sys, tempfile

here=Path(__file__).resolve().parent
folder=here.parent
project=folder.parent
build=project/'build/GC500_v7.94'
base=build/'base_live.html'
candidate=build/'GC500_Delivery_Control_hosted.html'
spec=importlib.util.spec_from_file_location('patch794',folder/'patch_v794.py')
sys.path.insert(0, str(folder))
patch=importlib.util.module_from_spec(spec);spec.loader.exec_module(patch)
checks=[]
def check(name,good):
    checks.append({'name':name,'pass':bool(good)})
    if not good: raise AssertionError(name)
def sha(data):return hashlib.sha256(data).hexdigest()
with tempfile.TemporaryDirectory() as tmp:
    clean=Path(tmp)/'base.html';clean.write_bytes(base.read_bytes())
    rebuilt=Path(tmp)/'rebuilt.html';rebuilt.write_text(patch.apply(base.read_text(),str(rebuilt)))
    for file in (clean,rebuilt):
        subprocess.run([sys.executable,str(project/'toolchain/scrub_attributions.py'),str(file)],check=True,stdout=subprocess.DEVNULL)
    check('exact official scrubbed rebuild matches final candidate',rebuilt.read_bytes()==candidate.read_bytes())
    text=candidate.read_text();marker='<!-- Showcase complete lap v7.94 -->'
    check('one extension block',text.count(marker)==1)
    restored=text[:text.index(marker)]+'</body></html>\n'
    refined=Path(tmp)/'refined.html';refined.write_text(patch.refine(base.read_text(),str(refined)))
    subprocess.run([sys.executable,str(project/'toolchain/scrub_attributions.py'),str(refined)],check=True,stdout=subprocess.DEVNULL)
    check('only declared guarded renderer refinements precede the extension',restored==refined.read_text())
    prior=clean.read_text()
    core='/* GC3D part 1 — core:'
    check('entire business page before the renderer is byte-preserved',text[:text.index(core)]==prior[:prior.index(core)])
    check('embedded source DATA is byte-preserved',re.search(r'\bconst DATA\s*=\s*(.*);',text).group(1)==re.search(r'\bconst DATA\s*=\s*(.*);',prior).group(1))
    def region(t,start,end):
        a=t.index(start);return t[a:t.index(end,a)]
    for label,start,end in (
        ('car geometry','G.carHull=function(){','G.pose=function(){'),
        ('simulation and smoke generation','G.step=function(dt){','/* everything that is rebuilt'),
        ('fixed-step frame loop','G.frame=function(tms)','/* deterministic still'),
    ):
        check(label+' is byte-preserved',region(text,start,end)==region(prior,start,end))
    try:patch.apply(text,'double apply')
    except SystemExit:check('double application refused',True)
    else:check('double application refused',False)
    try:patch.apply(base.read_text().replace('G.photoRefinement792=','G.removed='),'wrong base')
    except SystemExit:check('wrong base refused',True)
    else:check('wrong base refused',False)
    for file in folder.glob('*_src.js'):
        if file.name=='kerb794_src.js':
            continue # Embedded geometry fragment; official check_page parses its enclosing script.
        subprocess.run(['node','--check',str(file)],check=True)
        check(file.name+' parses',True)
result={'author':'Andrew Fisher','baseSha256':sha(base.read_bytes()),'candidateSha256':sha(candidate.read_bytes()),'bytes':candidate.stat().st_size,'checks':checks,
        'sources':{p.name:sha(p.read_bytes()) for p in sorted(folder.glob('*_src.*'))}}
(here/'source794_checks.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'passed':len(checks),'candidate':result['candidateSha256']}))
