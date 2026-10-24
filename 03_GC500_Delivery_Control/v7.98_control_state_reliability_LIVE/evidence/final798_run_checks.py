# Author: Andrew Fisher. Independent final combined verification, maximum two browsers.
from pathlib import Path
import os,subprocess,concurrent.futures,json,hashlib
root=Path(__file__).resolve().parents[2]; out=root/'v7.98_control_state_reliability_LIVE/evidence'
page=Path(os.environ.get('PAGE',str(root/'build/GC500_v7.98/GC500_Delivery_Control_hosted.html')))
expected=os.environ.get('CANDIDATE_SHA256','0f8f1ef70037e9402595d374fabe13920d71784599ef01dee6c7dc3da1c5e9e7')
assert hashlib.sha256(page.read_bytes()).hexdigest()==expected
base=dict(os.environ,PAGE=str(page),NODE_PATH='/workspace/fish/03_GC500_Delivery_Control/toolchain/node_modules',CHROMIUM_PATH='/usr/bin/chromium')
jobs=[('navigation','v7.76_navigation_performance_LIVE/evidence/navigation_regressions.js',False),('control_cpu','v7.98_control_state_reliability_LIVE/evidence/control798_unit.js',False),('print_cpu','v7.98_control_state_reliability_LIVE/evidence/control798_print_notes_unit.js',False),('equipment_desktop','v7.96_equipment_tab_LIVE/evidence/equipment_tests.js',False),('equipment_phone','v7.96_equipment_tab_LIVE/evidence/equipment_tests.js',True),('packed_desktop','v7.95_today_packed_DRAFT/evidence/packed_tests.js',False),('packed_phone','v7.95_today_packed_DRAFT/evidence/packed_tests.js',True),('rules','v7.84_ways_in_from_andrew_LIVE/evidence/rules_tests.js',False),('fresh','v7.75_fresh_after_a_save_LIVE/evidence/fresh_after_save_tests.js',False),('sweep_desktop','toolchain/harness/sweep.js',False),('sweep_phone','toolchain/harness/sweep.js',True),('control_browser','v7.98_control_state_reliability_LIVE/evidence/control798_browser.js',False),('print_browser','v7.98_control_state_reliability_LIVE/evidence/control798_print_notes_browser.js',False)]
if os.environ.get('FINAL798_SUITES'): jobs=[j for j in jobs if j[0] in os.environ['FINAL798_SUITES'].split(',')]
def run(j):
 name,script,mob=j;env=base.copy();env.pop('MOB',None)
 if mob:env['MOB']='1'
 env['OUT']=str(out/f'final798_{name}.json');env['FINAL798_OUT']=env['OUT'];env['FINAL798_TRANSPORT_LOG']=str(out/f'final798_{name}_blocked.jsonl');Path(env['FINAL798_TRANSPORT_LOG']).unlink(missing_ok=True)
 env['GC500_NAV_BASE']='/workspace/gc500-v767-release/03_GC500_Delivery_Control/build/GC500_v7.74/GC500_Delivery_Control_hosted.html'
 env['PRIVATE_OUT']='/workspace/private-v798-review/print' if name=='print_browser' else '/workspace/private-v798-review/control';env['BASE']=str(root/'build/GC500_v7.98/base_live.html')
 with (out/f'final798_{name}.log').open('w') as f:
  p=subprocess.run(['node',str(out/'final798_run_suite.cjs'),script],cwd=root,env=env,stdout=f,stderr=subprocess.STDOUT,timeout=600)
 print(json.dumps({'suite':name,'exit':p.returncode}),flush=True)
 return {'suite':name,'exit':p.returncode}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:results=list(ex.map(run,jobs))
assert hashlib.sha256(page.read_bytes()).hexdigest()==expected
(out/'final798_suite_status.json').write_text(json.dumps({'author':'Andrew Fisher','candidateSha256':expected,'results':results},indent=2)+'\n')
