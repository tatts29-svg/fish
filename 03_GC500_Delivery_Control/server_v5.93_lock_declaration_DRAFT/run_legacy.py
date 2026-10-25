#!/usr/bin/env python3
"""Author: Andrew Fisher. Run original v5.90 HTTP suites on exact v5.93, in disposable local folders.
Only build-label literals are adapted; the original assertions and fixtures are retained.
GC500_ROLLBACK_SERVER supplies the original v5.87 for its retained rollback check in a sparse checkout.
"""
from pathlib import Path
import hashlib,json,os,subprocess,tempfile,sys
HERE=Path(__file__).resolve().parent
OLD=HERE.parent/'server_v5.90_servicing_tracker_DRAFT'
root=Path(tempfile.mkdtemp(prefix='gc500-legacy593-'));suite=root/'suite';suite.mkdir()
fixture=root/'servicing_tracker_DRAFT';fixture.mkdir()
# The original HTTP contract suites require their original fixture, not the current event roster.
fixture.joinpath('tracker_data.json').write_bytes(subprocess.check_output(['git','show','4b106c0138e3d5706d58f274f8b966df3757db67:03_GC500_Delivery_Control/servicing_tracker_DRAFT/tracker_data.json'],cwd=HERE))
(suite/'server.js').write_bytes((HERE/'server.js').read_bytes())
(suite/'fake_clock.js').write_bytes((OLD/'fake_clock.js').read_bytes())
(suite/'tracker_sw.js').write_bytes((OLD/'tracker_sw.js').read_bytes())
checks=['test_tracker.js','test_tracker590.js','test_delivery_v586_on_v590.js','test_mms_sender_v587_on_v590.js','test_mms_v585_on_v590.js']
if len(sys.argv)>1:
    selected=sys.argv[1:];assert set(selected)<=set(checks);checks=selected
results=[]
for name in checks:
 source=(OLD/name).read_text();adapted=source.replace('v5.90','v5.93').replace(r'v5\.90',r'v5\.93')
 (suite/name).write_text(adapted)
 log=root/(name+'.log')
 with log.open('w') as f: run=subprocess.run(['node',str(suite/name)],stdout=f,stderr=subprocess.STDOUT,timeout=300)
 lines=log.read_text().splitlines();passed=sum(s.startswith('PASS ') for s in lines)
 entry={'test':name,'original_sha256':hashlib.sha256(source.encode()).hexdigest(),'adapted_sha256':hashlib.sha256(adapted.encode()).hexdigest(),'passed':passed,'exit_code':run.returncode}
 results.append(entry);print(json.dumps(entry),flush=True)
 if run.returncode:print('\n'.join(lines[-15:]));raise SystemExit(run.returncode)
print(json.dumps({'author':'Andrew Fisher','server_sha256':hashlib.sha256((HERE/'server.js').read_bytes()).hexdigest(),'passed':sum(x['passed'] for x in results),'failed':0,'local_only':True,'suites':results}),flush=True)
