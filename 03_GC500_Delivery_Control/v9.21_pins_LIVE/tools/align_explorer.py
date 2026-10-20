#!/usr/bin/env python3
"""Author: Andrew Fisher. Build/publish one approved pins snapshot; preserve other records/files.
Use --base-page, --page, --snapshot, --manifest and --out private paths. --publish additionally
requires --expect (reviewed candidate digest). Default builds only. Shared guarded publisher
canonical/call functions are reused; credentials never written or printed.
"""
import argparse,copy,importlib.util,json,os,re
from pathlib import Path
ap=argparse.ArgumentParser(description=__doc__)
for x in ['base-page','page','snapshot','manifest','out']:ap.add_argument('--'+x,required=True)
ap.add_argument('--publish',action='store_true');ap.add_argument('--expect');a=ap.parse_args()
helper=Path(__file__).resolve().parents[2]/'v8.93_maps_aligned_DRAFT/tools/publish_machine893.py'
spec=importlib.util.spec_from_file_location('paired_publisher',helper);pub=importlib.util.module_from_spec(spec);spec.loader.exec_module(pub)
def loc(path):
 s=Path(path).read_text();m=re.search('const MASTER_LOC = ',s);assert m;return json.JSONDecoder().raw_decode(s[m.end():])[0]
before,after=loc(a.base_page),loc(a.page);keys={k for k in after if before[k]['pt']!=after[k]['pt']};assert len(keys)==57
raw=Path(a.snapshot).read_bytes();old=json.loads(raw);new=copy.deepcopy(old);seen=set()
for x in new['items']:
 if x['key'] in keys:
  assert x['pt']==before[x['key']]['pt'];x['pt']=after[x['key']]['pt'];seen.add(x['key'])
assert seen==keys
ep=next(x for x in new['layers'] if x['id']=='ep');assert len(ep['marks'])==23
for x in ep['marks']:assert x['name']=='Entry point';x['name']='Emergency egress point (E.P)'
restored=copy.deepcopy(new)
for x in restored['items']:
 if x['key'] in keys:x['pt']=before[x['key']]['pt']
for x in next(x for x in restored['layers'] if x['id']=='ep')['marks']:x['name']='Entry point'
assert restored==old
body=json.dumps(new,ensure_ascii=False,separators=(',',':')).encode();base=json.loads(Path(a.manifest).read_text());assert pub.digest_of(base['entry'],base['files'])==base['sha256']
mf=copy.deepcopy(base);rel='explorer/assets/plan_items.json';f=next(x for x in mf['files'] if x['path']==rel);assert pub.sha(raw)==f['sha256'];f.update(sha256=pub.sha(body),bytes=len(body));mf['version']='v9.21-pins-aligned';mf['sha256']=pub.digest_of(mf['entry'],mf['files'])
assert len(mf['files'])==233;assert [x for x in mf['files'] if x['path']!=rel]==[x for x in base['files'] if x['path']!=rel]
out=Path(a.out);out.mkdir(parents=True,exist_ok=True);(out/'plan_items.json').write_bytes(body);(out/'machine-manifest.json').write_text(json.dumps(mf));print('candidate',mf['sha256'],'57positions23names; oneof233files')
if not a.publish:raise SystemExit(0)
assert a.expect==mf['sha256'],'Reviewed digest required';token=os.environ['GC500_EDIT_TOKEN']
s,b=pub.call('GET','/api/version',token=token);assert s==200 and json.loads(b)['level']=='edit'
s,b=pub.call('GET','/api/admin/machine',token=token);assert s==200;inv=json.loads(b);assert inv['status']['sha256']==base['sha256'];have={x['sha256']:x['bytes'] for x in inv['blobs']};assert all(have.get(x['sha256'])==x['bytes'] for x in mf['files'] if x['path']!=rel)
s,b=pub.call('PUT','/api/admin/machine/blob/'+f['sha256'],body,'application/octet-stream',token);assert s==200
s,b=pub.call('GET','/api/admin/machine',token=token);assert s==200 and json.loads(b)['status']['sha256']==base['sha256']
s,b=pub.call('POST','/api/admin/machine/manifest',json.dumps(mf).encode(),'application/json',token);assert s==200
s,b=pub.call('GET','/api/machine',token=token);assert s==200 and json.loads(b)['sha256']==mf['sha256']
s,b=pub.call('GET','/w/Coates-GC500-2026/'+rel+'?verify='+f['sha256'],token=token);assert s==200 and b==body
print('VERIFIED LIVE',mf['sha256'],'exactpublicsnapshot')
