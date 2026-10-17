"""Author: Andrew Fisher. Serial, GET-only standing release regressions.

Raw output and screenshots stay in the specified private directory. No publication.
Usage: python3 run_standing.py PAGE PRIVATE_DIR [first-name ...]
"""
from pathlib import Path
import json
import os
import re
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[3]
PAGE = str(Path(sys.argv[1]).resolve())
PRIVATE = Path(sys.argv[2]).resolve()
SELECT = set(sys.argv[3:])
JOBS = [
 ('twinsteer', 'v10.53_no_twin_steer_LIVE/tests/test_twinsteer1053.cjs', 'both', True),
 ('daycards', 'v10.56_day_cards_LIVE/tests/test_daycards1056.cjs', 'both', True),
 ('part1', 'v10.57_build_tab_tidy_DRAFT/tests/test_part1.cjs', 'both', True),
 ('part2', 'v10.57_build_tab_tidy_DRAFT/tests/test_part2.cjs', 'both', True),
 ('part3', 'v10.57_build_tab_tidy_DRAFT/tests/test_part3.cjs', 'both', True),
 ('late', 'v10.59_late_desc_arrived_DRAFT/tests/test_v1059.cjs', 'both', True),
]
for name, script in [
 ('printgate','v10.60.2_print_gate_name_DRAFT/test_gate1060p2.cjs'),
 ('shapes','v10.60_map_shapes_DRAFT/tests/test_v1060.cjs'),
 ('interactions','v10.64_map_performance_LIVE/tests/test_interactions.cjs'),
 ('integrated','v10.65_map_navigation_LIVE/tests/test_integrated.cjs'),
 ('costs','v10.65_map_navigation_LIVE/navigation/browser_costs_scroll1065.cjs'),
 ('sweep','toolchain/harness/sweep.js')]:
 for screen in ['desktop','phone']:
  JOBS.append((name+'-'+screen,script,screen,name=='costs'))

PRIVATE.mkdir(parents=True,exist_ok=True)
for sub in ['tmp','cache','standing','screens']:(PRIVATE/sub).mkdir(exist_ok=True)
results=[]
for name, rel, screen, args in JOBS:
 if SELECT and name not in SELECT:continue
 dest=PRIVATE/'standing'/name;dest.mkdir(exist_ok=True)
 env=dict(os.environ)
 for key in ['PAGE','MOB','NODE_OPTIONS','CANDIDATE_MACHINE','LIVE','OUT','SHOT','EXPECT_PAGE']:env.pop(key,None)
 env.update(NODE_PATH='/workspace/fish/03_GC500_Delivery_Control/toolchain/node_modules',CHROMIUM_PATH='/usr/bin/chromium',
  TMPDIR=str(PRIVATE/'tmp'),GC500_CACHE=str(PRIVATE/'cache'),PAGE=PAGE,EXPECT_PAGE='v10.66',
  OUT=str(dest/'evidence'),SHOT=str(dest/'screen.png'))
 if screen=='phone':env['MOB']='1'
 script=ROOT/rel
 if name.startswith('printgate-'):env['OUT']=str(dest/'screen.png')
 cmd=['flock','/tmp/gc500-browser.lock','timeout','600','node',str(script)]
 if args:cmd += [PAGE,str(dest)]
 # Costs accepts only page paths, unlike the day-card suites with screenshot args.
 if name.startswith('costs-'):cmd=cmd[:-1]
 log=dest/'run.log';start=time.monotonic()
 print(json.dumps({'starting':name}),flush=True)
 with log.open('w') as out:
  result=subprocess.run(cmd,env=env,cwd=ROOT,stdout=out,stderr=subprocess.STDOUT)
 content=log.read_text();tail=content.splitlines()
 totals=re.findall(r'(?:ALL PASS )?(\d+)/(\d+)(?: passed)?',content)
 row={'name':name,'exit':result.returncode,'seconds':round(time.monotonic()-start,1),'totals':totals[-1] if totals else None}
 row['failLines']=[l[:400] for l in tail if l.startswith('FAIL') or l.startswith('AssertionError')]
 if name.startswith('sweep-') and result.returncode==0:
  data=json.loads(next(l for l in reversed(tail) if l.startswith('{')))
  row.update(tabs=len(data['tabs']),links=len(data['hashes']),errors=len(data['allErrors']),console=len(data['cons']),counts=data['counts'])
  row['passed']=row['tabs']==24 and row['links']==7 and not data['allErrors'] and not data['cons'] and data['counts'].get('blocked',0)==0 and all(v['shown'] and not v['goerr'] for v in data['tabs'].values())
 elif name.startswith('costs-') and result.returncode==0:
  data=json.loads(next(l for l in reversed(tail) if l.startswith('{')))
  row.update(checks=5,errors=len(data['errors']),blockedWrites=data['blockedWrites'],passed=data['pass'] and not data['errors'] and data['blockedWrites']==0)
 else:row['passed']=result.returncode==0 and not row['failLines'] and (not totals or totals[-1][0]==totals[-1][1])
 results.append(row)
 (PRIVATE/'standing'/'summary.json').write_text(json.dumps({'author':'Andrew Fisher','page':PAGE,'results':results},indent=2)+'\n')
 print(json.dumps(row),flush=True)
print(json.dumps({'completed':len(results),'passed':sum(r['passed'] for r in results)}),flush=True)
sys.exit(0 if all(r['passed'] for r in results) else 1)
