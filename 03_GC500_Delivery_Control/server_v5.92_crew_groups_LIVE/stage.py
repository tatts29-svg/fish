"""Author: Andrew Fisher. Stage a tested server blob only; never switch or prune the machine.
Private backups go outside the repository. Run without --execute first.
"""
import argparse,hashlib,json,os,urllib.request
from pathlib import Path
from datetime import datetime,timezone
ap=argparse.ArgumentParser();ap.add_argument('--private-dir',required=True);ap.add_argument('--execute',action='store_true');a=ap.parse_args()
os.umask(0o077);out=Path(a.private_dir);out.mkdir(parents=True,exist_ok=False)
ROOT='https://gc500-production.up.railway.app'
OLD='c1b8bf9c999d4e548384b682592409507dbaf8bb7c4c62c590b62127b69c89b7'
NEW='bdb058ffe1d7e269be978546581383a85f11bd7fc7078f569d41de33b6efe396'
PAGE='84cb7d6c1eccf57ba1cca2802e149fd7ef28b4300c94ae2441f0164697af50ea'
sha=lambda b:hashlib.sha256(b).hexdigest()
def get(path,method='GET',data=None):
 h={'x-gc500-token':os.environ['GC500_EDIT_TOKEN'],'x-gc500-who':'Andrew Fisher via Codex'}
 if data is not None:h['Content-Type']='application/octet-stream'
 req=urllib.request.Request(ROOT+path,headers=h,method=method,data=data)
 with urllib.request.urlopen(req,timeout=90) as f:return f.read()
def snapshot(tag):
 result={}
 for name,url in [('health','/health'),('version','/api/version'),('state','/api/state'),('cards','/api/cards'),('ticks','/api/ticks'),('inventory','/api/admin/machine'),('page','/v/Coates-GC500-2026')]:
  raw=get(url);(out/(tag+'-'+name+('.html' if name=='page' else '.json'))).write_bytes(raw)
  result[name]=sha(raw) if name=='page' else json.loads(raw)
 return result
candidate=Path(__file__).with_name('server.js').read_bytes();assert sha(candidate)==NEW
before=snapshot('before');assert before['health']['build']=='v5.91' and before['health']['ok'] and before['page']==PAGE
assert any(x['sha256']==OLD and x['bytes']==292090 for x in before['inventory']['blobs'])
receipt={'author':'Andrew Fisher','server_sha256':NEW,'bytes':len(candidate),'execute':a.execute,'started':datetime.now(timezone.utc).isoformat(),'source_base_sha256':OLD,'page_sha256':PAGE}
if a.execute:
 ack=json.loads(get('/api/admin/machine/blob/'+NEW,'PUT',candidate));assert ack['sha256']==NEW and ack['bytes']==len(candidate)
 receipt['upload_ack']=ack
 after=snapshot('after');assert after['health']['build']=='v5.91' and after['health']['ok']
 assert after['page']==before['page']
 inv={x['sha256']:x['bytes'] for x in after['inventory']['blobs']}
 assert inv.get(NEW)==len(candidate) and all(inv.get(x['sha256'])==x['bytes'] for x in before['inventory']['blobs'])
 assert after['inventory']['status']==before['inventory']['status']
 receipt['state_unchanged']=after['state']==before['state'];receipt['cards_unchanged']=after['cards']==before['cards']
 receipt['record_version_before']=before['version']['version'];receipt['record_version_after']=after['version']['version']
 receipt['inventory_verified']=True;receipt['page_and_machine_unchanged']=True;receipt['live_server_still']='v5.91'
receipt['finished']=datetime.now(timezone.utc).isoformat();(out/'receipt.json').write_text(json.dumps(receipt,indent=2))
print(json.dumps(receipt))
