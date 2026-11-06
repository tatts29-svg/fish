# Author: Andrew Fisher. Final integrated release standing suites, maximum two non-GL browsers.
from pathlib import Path
import os,subprocess,concurrent.futures,json,hashlib,sys
root=Path(__file__).resolve().parents[2];out=Path(__file__).resolve().parent
source_page=Path(os.environ['PAGE']);expected=os.environ['CANDIDATE_SHA256']
assert hashlib.sha256(source_page.read_bytes()).hexdigest()==expected
page=Path('/workspace/private-v801-review')/expected/'candidate.html';page.parent.mkdir(parents=True,exist_ok=True);page.write_bytes(source_page.read_bytes())
assert hashlib.sha256(page.read_bytes()).hexdigest()==expected
base=dict(os.environ,PAGE=str(page),NODE_PATH='/workspace/fish/03_GC500_Delivery_Control/toolchain/node_modules',CHROMIUM_PATH='/usr/bin/chromium')
jobs=[('navigation','v7.76_navigation_performance_LIVE/evidence/navigation_regressions.js',False),('equipment_desktop','v7.96_equipment_tab_LIVE/evidence/equipment_tests.js',False),('equipment_phone','v7.96_equipment_tab_LIVE/evidence/equipment_tests.js',True),('packed_desktop','v7.95_today_packed_DRAFT/evidence/packed_tests.js',False),('packed_phone','v7.95_today_packed_DRAFT/evidence/packed_tests.js',True),('rules','v7.84_ways_in_from_andrew_LIVE/evidence/rules_tests.js',False),('fresh','v7.75_fresh_after_a_save_LIVE/evidence/fresh_after_save_tests.js',False),('sweep_desktop','toolchain/harness/sweep.js',False),('sweep_phone','toolchain/harness/sweep.js',True),('control_cpu','v7.98_control_state_reliability_LIVE/evidence/control798_unit.js',False),('print_cpu','v7.98_control_state_reliability_LIVE/evidence/control798_print_notes_unit.js',False),('control_browser','v7.98_control_state_reliability_LIVE/evidence/control798_browser.js',False)]
def run(j):
 name,script,mob=j;env=base.copy();env.pop('MOB',None)
 if mob:env['MOB']='1'
 env['OUT']=str(out/f'review801_{name}.json');env['FINAL798_OUT']=env['OUT'];env['FINAL798_TRANSPORT_LOG']=str(out/f'review801_{name}_blocked.jsonl');Path(env['FINAL798_TRANSPORT_LOG']).unlink(missing_ok=True)
 env['GC500_NAV_BASE']='/workspace/gc500-v767-release/03_GC500_Delivery_Control/build/GC500_v7.74/GC500_Delivery_Control_hosted.html'
 env['BASE']=str(source_page.with_name('base_live.html'))
 env['PRIVATE_OUT']=str(page.parent/'control');Path(env['PRIVATE_OUT']).mkdir(exist_ok=True)
 with (out/f'review801_{name}.log').open('w') as f:
  try:
   p=subprocess.run(['node',str(root/'v7.98_control_state_reliability_LIVE/evidence/final798_run_suite.cjs'),script],cwd=root,env=env,stdout=f,stderr=subprocess.STDOUT,timeout=600);code=p.returncode
  except subprocess.TimeoutExpired:code=124
 print(json.dumps({'suite':name,'exit':code}),flush=True)
 return {'suite':name,'exit':code}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:results=list(ex.map(run,jobs))
assert hashlib.sha256(source_page.read_bytes()).hexdigest()==expected
(out/'review801_suite_status.json').write_text(json.dumps({'author':'Andrew Fisher','candidateSha256':expected,'results':results},indent=2)+'\n')

sys.exit(1 if any(r["exit"] for r in results) else 0)
