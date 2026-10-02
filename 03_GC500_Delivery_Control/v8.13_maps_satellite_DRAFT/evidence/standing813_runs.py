#!/usr/bin/env python3
"""Author: Andrew Fisher. Required inherited suites on the combined page and map assets."""
from pathlib import Path
import hashlib
import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed, CancelledError
ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT.parent
PAGE, BASE = [Path(p).resolve() for p in sys.argv[1:3]]
OUT = Path('/workspace/private-maps813/standing'); OUT.mkdir(exist_ok=True)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
report = {'author': 'Andrew Fisher', 'pageSha256': sha(PAGE), 'baseSha256': sha(BASE), 'assetOverrideSha256': sha(ROOT/'evidence/override813.cjs'), 'assets': json.loads((ROOT/'evidence/assets813_build.json').read_text())['files'], 'maxParallelContexts': 2, 'purpose': 'Functional checks only; not performance measurements', 'runs': []}
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
def frozen():
 assert sha(PAGE) == report['pageSha256'], 'Host candidate changed during standing checks'
 assert sha(BASE) == report['baseSha256'], 'Baseline changed during standing checks'
 assert sha(ROOT/'evidence/override813.cjs') == report['assetOverrideSha256'], 'Asset override changed during standing checks'
 assert json.loads((ROOT/'evidence/assets813_build.json').read_text())['files'] == report['assets'], 'Asset manifest changed during standing checks'
 for name, meta in report['assets'].items():
  assert sha(ROOT/'release'/name) == meta['sha256'], 'Map candidate changed during standing checks: ' + name

def run(spec):
 name, source, mobile = spec
 frozen()
 result, log = OUT/(name+'.json'), OUT/(name+'.log')
 if result.exists(): result.unlink()  # Never count a stale result after a fixture failure.
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
 frozen()
 return {'name':name,'source':source,'sourceSha256':sha(PROJECT/source),'exitCode':done.returncode,'pass':good,**count,'privateResultSha256':sha(result) if result.exists() else None}

frozen()
failed = False
# Each child owns one browser and one private result. Only this parent writes the combined summary.
with ThreadPoolExecutor(max_workers=2) as pool:
 pending = {pool.submit(run, spec): spec for spec in specs}
 for future in as_completed(pending):
  spec = pending[future]
  try:
   item = future.result()
  except CancelledError:
   continue
  except Exception as error:
   item = {'name': spec[0], 'source': spec[1], 'pass': False, 'error': str(error)}
  report['runs'].append(item)
  report['runs'].sort(key=lambda r: next(i for i,s in enumerate(specs) if s[0] == r['name']))
  (ROOT/'evidence/standing813_browser.json').write_text(json.dumps(report,indent=2)+'\n')
  print(item['name'], {k:v for k,v in item.items() if k in ('passed','total','tabs','links','errors','consoleErrors','error')}, 'PASS' if item['pass'] else 'FAIL',flush=True)
  if not item['pass']:
   failed = True
   for remaining in pending: remaining.cancel()
if failed: raise SystemExit(1)
frozen()
