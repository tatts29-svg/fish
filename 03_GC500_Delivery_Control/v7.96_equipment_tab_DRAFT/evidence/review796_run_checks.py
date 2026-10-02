# Author: Andrew Fisher. Reproduce the independent browser checks with at most two browsers.
from pathlib import Path
import os, subprocess, concurrent.futures, json
root=Path(__file__).resolve().parents[2]
out=root/'v7.96_equipment_tab_DRAFT/evidence'
base=dict(os.environ,PAGE=os.environ.get('PAGE',str(root/'build/GC500_v7.96/GC500_Delivery_Control_hosted.html')))
jobs=[('results_desktop','v7.96_equipment_tab_DRAFT/evidence/review796_results_tests.cjs',False),('results_phone','v7.96_equipment_tab_DRAFT/evidence/review796_results_tests.cjs',True),('equipment_desktop','v7.96_equipment_tab_DRAFT/evidence/equipment_tests.js',False),('equipment_phone','v7.96_equipment_tab_DRAFT/evidence/equipment_tests.js',True),('packed_desktop','v7.95_today_packed_DRAFT/evidence/packed_tests.js',False),('packed_phone','v7.95_today_packed_DRAFT/evidence/packed_tests.js',True),('rules','v7.84_ways_in_from_andrew_LIVE/evidence/rules_tests.js',False),('fresh','v7.75_fresh_after_a_save_LIVE/evidence/fresh_after_save_tests.js',False),('sweep_desktop','toolchain/harness/sweep.js',False),('sweep_phone','toolchain/harness/sweep.js',True)]
def run(j):
 name,script,mob=j; env=base.copy(); env.pop('MOB',None)
 if mob: env['MOB']='1'
 env['OUT']=str(out/f'review796_{name}.json')
 if name=='rules': env['BASE']=str(root/'build/GC500_v7.96/base_live.html')
 with (out/f'review796_{name}.log').open('w') as f:
  p=subprocess.run(['node',str(out/'review796_run_suite.cjs'),script],cwd=root,env=env,stdout=f,stderr=subprocess.STDOUT,timeout=500)
 print(json.dumps(dict(suite=name,exit=p.returncode)),flush=True)
 return dict(suite=name,exit=p.returncode)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as e: results=list(e.map(run,jobs))
(out/'review796_suite_status.json').write_text(json.dumps(results,indent=2))
