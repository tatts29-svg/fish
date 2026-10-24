#!/usr/bin/env python3
"""Author: Andrew Fisher. Independent presentation-only reverse allowlist."""
from pathlib import Path
import argparse,hashlib,json,re,importlib.util
HERE=Path(__file__).resolve().parent;ROOT=HERE.parent
spec=importlib.util.spec_from_file_location('p850',ROOT/'v8.50_po_gate_progress_LIVE/test_preserve850.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);literal=module.json_literal
p=argparse.ArgumentParser();p.add_argument('--base',required=True);p.add_argument('--candidate',required=True);args=p.parse_args()
a=Path(args.base).read_bytes();b=Path(args.candidate).read_bytes();old=a.decode();new=b.decode();checks=[]
def check(name,ok):
 checks.append((name,bool(ok)));print(('PASS ' if ok else 'FAIL ')+name)
def undo(new_text,original,replacement,label):
 check(label+' unique exact boundary',new_text.count(replacement)==1)
 return new_text.replace(replacement,original,1)
check('Exact verified v850 base',hashlib.sha256(a).hexdigest()=='1b24ad4e267d23f4ae20b03968551d275afda0c29d527f63aee62388ed9ac222')
check('Release identifies v851 once',new.count('<meta name="gc500-release" content="v8.51">')==1)
declarations=[]
for match in re.finditer(r'^const ([A-Z][A-Z0-9_]*) = ',old,re.M):
 try:previous=literal(old,match.group(0))
 except (ValueError,json.JSONDecodeError):continue
 declarations.append(match.group(1));check(match.group(1)+' source value and literal bytes preserved',previous==literal(new,match.group(0)))
for folder,files in [('v8.48_collapsible_groups_LIVE',['fencing_metrics848_src.js','work_summary848_src.js','linked_fencing848_src.js']),('v8.49_fencing_components_LIVE',['components849_src.js','evidence849_src.js','components849.css']),('v8.50_po_gate_progress_LIVE',['po_progress850_src.js'])]:
 for file in files:
  source=(ROOT/folder/file).read_text();check(file+' unchanged',source in old and source in new)
normal=new
notes=(HERE/'clean_notes851_ui.js').read_text()+'\n'
# rep retains the declaration's original trailing space after this insertion.
normal=undo(normal,'const FENCE_COMPONENTS_VIEW849 = ',notes+'const FENCE_COMPONENTS_VIEW849 =  ','New supporting-note helper')
for name,next_name,file in [('fenceComponentLinks849','fenceComponentGuideOutput849','clean_links851_ui.js'),('renderFenceComponents849','bindFenceComponents849','clean_components851_ui.js')]:
 start=old.index('function '+name+'(');end=old.index('function '+next_name+'(',start)
 normal=undo(normal,old[start:end].rstrip(),(HERE/file).read_text().rstrip(),name)
normal=undo(normal,(ROOT/'v8.50_po_gate_progress_LIVE/po_evidence850_ui.js').read_text().rstrip(),(HERE/'clean_po851_ui.js').read_text().rstrip(),'P/O disclosure renderer')
start=old.index('function captureFenceComponents849(');end=old.index('function renderFenceComponents849(',start)
normal=undo(normal,old[start:end].rstrip(),(HERE/'clean_focus851_ui.js').read_text().rstrip(),'Active note focus and scroll preservation')
start=old.index('function renderPrestarts_held(){');end=old.index('async function prestartUpload(',start)
normal=undo(normal,old[start:end].rstrip(),(HERE/'clean_prestarts851_ui.js').read_text().split('\n',1)[1].rstrip(),'Pre-start presentation renderer')
style='<style id="clean-data-v851">\n'+(HERE/'clean_layout851.css').read_text()+'\n</style>\n'
normal=undo(normal,'<style id="private-equipment-demob-refresh">',style+'<style id="private-equipment-demob-refresh">','Narrow Equipment grid containment')
normal=undo(normal,'<meta name="gc500-release" content="v8.50">','<meta name="gc500-release" content="v8.51">','Release metadata')
normal=undo(normal,"+ ' · v8.50'; /* v8.19 - the footer names the release once */","+ ' · v8.51'; /* v8.19 - the footer names the release once */",'Release footer')
check('All other bytes, totals, financial helpers, native controls and media unchanged',normal.encode()==a)
print(json.dumps({'author':'Andrew Fisher','base':hashlib.sha256(a).hexdigest(),'candidate':hashlib.sha256(b).hexdigest(),'sourceDeclarations':len(declarations),'passed':sum(x[1] for x in checks),'total':len(checks)}))
if not all(ok for _,ok in checks):raise SystemExit(1)
