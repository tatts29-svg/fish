#!/usr/bin/env python3
"""Author: Andrew Fisher. Required inherited suites on the combined page and map assets."""
from pathlib import Path
import hashlib
import json
import os
import subprocess
import sys
ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT.parent
PAGE, BASE = [Path(p).resolve() for p in sys.argv[1:3]]
OUT = Path('/workspace/private-maps813/standing'); OUT.mkdir(exist_ok=True)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
report = {'author': 'Andrew Fisher', 'pageSha256': sha(PAGE), 'assets': json.loads((ROOT/'evidence/assets813_build.json').read_text())['files'], 'runs': []}
specs = [
 ('sweep_desktop','toolchain/harness/sweep.js',False),
 ('sweep_phone','toolchain/harness/sweep.js',True),
 ('packed_desktop','v7.95_today_packed_DRAFT/evidence/packed_tests.js',False),
 ('packed_phone','v7.95_today_packed_DRAFT/evidence/packed_tests.js',True),
 ('equipment_desktop','v7.96_equipment_tab_LIVE/evidence/equipment_tests.js',False),
 ('equipment_phone','v7.96_equipment_tab_LIVE/evidence/equipment_tests.js',True),
 ('rules','v7.84_ways_in_from_andrew_LIVE/evidence/rules_tests.js',False),
 ('fresh_after_save','v7.75_fresh_after_a_save_LIVE/evidence/fresh_after_save_tests.js',False),
]
for name, source, mobile in specs:
 result, log = OUT/(name+'.json'), OUT/(name+'.log')
 env = dict(os.environ, PAGE=str(PAGE), BASE=str(BASE), CHROMIUM_PATH='/usr/bin/chromium', OUT=str(result), GC500813_RESULT=str(result))
 env.pop('MOB',None)
 if mobile: env['MOB']='1'
 with log.open('w') as stream:
  done=subprocess.run(['node','--require',str(ROOT/'evidence/override813.cjs'),str(PROJECT/source)],cwd=PROJECT,env=env,stdout=stream,stderr=subprocess.STDOUT)
 if name.startswith('sweep'):
  raw=json.loads(log.read_text().strip().splitlines()[-1]); result.write_text(json.dumps(raw))
  good=done.returncode==0 and len(raw.get('tabs',{}))==21 and len(raw.get('hashes',{}))==7 and not raw.get('allErrors') and not raw.get('cons') and all(t['shown'] and not t.get('goerr') for t in raw['tabs'].values())
  count={'tabs':len(raw.get('tabs',{})),'links':len(raw.get('hashes',{})),'errors':len(raw.get('allErrors',[])),'consoleErrors':len(raw.get('cons',[]))}
 else:
  raw=json.loads(result.read_text()) if result.exists() else {}
  tests=raw if isinstance(raw,list) else raw.get('tests',[])
  passed=sum(bool(x.get('pass')) for x in tests)
  good=done.returncode==0 and bool(tests) and passed==len(tests) and not (raw.get('errors') if isinstance(raw,dict) else [])
  count={'passed':passed,'total':len(tests)}
 item={'name':name,'source':source,'sourceSha256':sha(PROJECT/source),'exitCode':done.returncode,'pass':good,**count,'privateResultSha256':sha(result) if result.exists() else None}
 report['runs'].append(item)
 (ROOT/'evidence/standing813_browser.json').write_text(json.dumps(report,indent=2)+'\n')
 print(name, count, 'PASS' if good else 'FAIL',flush=True)
 if not good: raise SystemExit(1)
