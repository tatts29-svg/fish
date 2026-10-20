"""Author: Andrew Fisher. CPU-only v8.27 build-boundary checks."""
from pathlib import Path
import hashlib,importlib.util,json,subprocess,sys,tempfile,os
P=Path(__file__).resolve().parent.parent;BASE=Path(os.environ['BASE']);OUTPUT=Path(os.environ['PAGE']);REPORT=Path(os.environ['REPORT'])
spec=importlib.util.spec_from_file_location('wrapper',P/'patch_v827.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
checks=[]
def check(name,fn):
 try:fn();checks.append({'name':name,'pass':True})
 except Exception as e:checks.append({'name':name,'pass':False,'error':str(e)})
def yes(v):assert v
def rejects(fn):
 try:fn()
 except (ValueError,UnicodeError):return
 raise AssertionError('Should have rejected')
a=BASE.read_bytes();b=OUTPUT.read_bytes();source=(P/'main_video_patch.py').read_bytes()
check('Exact v8.26 input reproduces frozen v8.27 output',lambda:yes(m.build(a,source)==b))
check('Wrong base fails closed',lambda:rejects(lambda:m.build(a+b' ',source)))
check('Wrong patch bytes fail closed',lambda:rejects(lambda:m.build(a,source+b'\n')))
check('Already patched input fails closed',lambda:rejects(lambda:m.build(b,source)))
check('Input snapshot remains exact',lambda:yes(hashlib.sha256(BASE.read_bytes()).hexdigest()==m.BASE_SHA))
def isolate(s):
 start=s.index('function wireBoard(');end=s.index('\nconst BOARD_RUN',start);return s[:start],s[start:end],s[end:]
at=a.decode();bt=b.decode();ap,ac,az=isolate(at);bp,bc,bz=isolate(bt)
restored=bp+ac+bz
restored=restored.replace('@media (prefers-reduced-motion:reduce){ .vmsb{transition:none} .bhero video{transition:none} }','@media (prefers-reduced-motion:reduce){ .vmsb{transition:none} .bhero video{display:none} }',1).replace('html[data-motion="off"] .vmsb{transition:none} html[data-motion="off"] .bhero video{transition:none}','html[data-motion="off"] .vmsb{transition:none} html[data-motion="off"] .bhero video{display:none}',1)
restored=restored.replace('<meta name="gc500-release" content="v8.27">','<meta name="gc500-release" content="v8.26">',1).replace("+ ' · v8.27'; /* v8.19 - the footer names the release once */","+ ' · v8.26'; /* v8.19 - the footer names the release once */",1)
check('Every byte outside controller, two CSS declarations and two labels is unchanged',lambda:yes(restored.encode()==a))
direct={'__name__':'reviewed_video_source'};exec(compile(source,'reviewed_video_source','exec'),direct)
check('Controller exactly matches direct frozen patch output',lambda:yes(isolate(direct['apply'](at))[1]==bc))
with tempfile.TemporaryDirectory(prefix='v827-guards-') as td:
 t=Path(td);(t/'patch_v827.py').write_bytes((P/'patch_v827.py').read_bytes());(t/'main_video_patch.py').write_bytes(source)
 def cli(inp,out):return subprocess.run([sys.executable,str(t/'patch_v827.py'),str(inp),str(out)],capture_output=True,text=True)
 inp=t/'input.html';out=t/'output.html';inp.write_bytes(a)
 def same():
  r=cli(inp,inp);yes(r.returncode!=0 and inp.read_bytes()==a)
 check('CLI refuses to overwrite private input',same)
 def missing():
  r=cli(t/'missing.html',out);yes(r.returncode!=0 and not out.exists())
 check('Missing private input creates no output',missing)
 def stale():
  (t/'main_video_patch.py').write_bytes(source+b'\n');out.write_text('sentinel');r=cli(inp,out);yes(r.returncode!=0 and out.read_text()=='sentinel');(t/'main_video_patch.py').write_bytes(source)
 check('Changed helper fails without touching existing output',stale)
 def stale_base():
  inp.write_bytes(a+b'\n');out.write_text('sentinel');r=cli(inp,out);yes(r.returncode!=0 and out.read_text()=='sentinel');inp.write_bytes(a)
 check('Changed base fails without touching existing output',stale_base)
 def valid():
  r=cli(inp,out);yes(r.returncode==0 and out.read_bytes()==b and inp.read_bytes()==a)
 check('Valid CLI reproduces output and retains private input',valid)
 def standard_build():
  inp.write_bytes(a);res=subprocess.run([sys.executable,str(t/'patch_v827.py'),str(inp)],capture_output=True,text=True);yes(res.returncode==0 and inp.read_bytes()==b)
 check('Standard build.sh single-path mode patches the verified working copy',standard_build)
 def rejected_working_copy():
  inp.write_text('wrong base');res=subprocess.run([sys.executable,str(t/'patch_v827.py'),str(inp)],capture_output=True,text=True);yes(res.returncode!=0 and inp.read_text()=='wrong base')
 check('Single-path failure preserves the working copy',rejected_working_copy)

report={'author':'Andrew Fisher','base_sha256':m.BASE_SHA,'candidate_sha256':m.EXPECTED_OUTPUT_SHA,'wrapper_sha256':hashlib.sha256((P/'patch_v827.py').read_bytes()).hexdigest(),'source_sha256':m.SOURCE_SHA,'passed':sum(c['pass'] for c in checks),'total':len(checks),'checks':checks}
REPORT.write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2));sys.exit(0 if all(c['pass'] for c in checks) else 1)
