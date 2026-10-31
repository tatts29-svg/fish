"""Author: Andrew Fisher. Guarded blob staging and private full-history backup, no server switch."""
import argparse,hashlib,json,os,urllib.request
from pathlib import Path
from datetime import datetime,timezone
ap=argparse.ArgumentParser();ap.add_argument('--private-dir',required=True);ap.add_argument('--execute',action='store_true');args=ap.parse_args()
os.umask(0o077);out=Path(args.private_dir).resolve();repo=Path(__file__).resolve().parents[2]
assert not out.is_relative_to(repo),'Private snapshots must stay outside repository'
out.mkdir(parents=True,exist_ok=False)
HOST='https://gc500-production.up.railway.app';OLD='bdb058ffe1d7e269be978546581383a85f11bd7fc7078f569d41de33b6efe396'
NEW='8764451d3768fcfbfc493da48fb9901503dcd6af0f8df247478aa53fb9428f46'
sha=lambda b:hashlib.sha256(b).hexdigest()
def request(route,method='GET',body=None):
 headers={'x-gc500-token':os.environ['GC500_EDIT_TOKEN'],'x-gc500-who':'Andrew Fisher via Codex','Content-Type':'application/octet-stream'}
 with urllib.request.urlopen(urllib.request.Request(HOST+route,headers=headers,method=method,data=body),timeout=60) as r:return r.read()
def save(name,b):
 assert os.environ['GC500_EDIT_TOKEN'].encode() not in b
 (out/name).write_bytes(b)
def snapshot(tag):
 result={}
 for name,route in [('health','/health'),('version','/api/version'),('state','/api/state'),('cards','/api/cards'),('ticks','/api/ticks'),('inventory','/api/admin/machine'),('page','/v/Coates-GC500-2026')]:
  raw=request(route);save(tag+'-'+name,raw);result[name]=sha(raw) if name=='page' else json.loads(raw)
 histories={}
 for tracker in result['ticks']['trackers']:
  token=tracker['token'];pages=[];since=0
  for i in range(100):
   j=json.loads(request('/api/ticks?token='+token+'&links=1&voided=1&voids=1&since='+str(since)));pages.append(j)
   assert not j.get('void_more'),'Incomplete void history'
   if not j.get('more'):break
   assert j['seq']>since and i<99;since=j['seq']
  histories[token]={'pages':pages,'events':[t for p in pages for t in p.get('ticks',[])]}
  assert len(histories[token]['events'])==pages[0]['historical_ticks'],'Complete tick history required'
  assert all(p['total_seq']==pages[0]['total_seq'] for p in pages),'History changed during snapshot'
 result['histories']=histories;save(tag+'-histories.json',json.dumps(histories).encode());return result
candidate=Path(__file__).with_name('server.js').read_bytes();assert sha(candidate)==NEW
before=snapshot('before');assert before['health']['build']=='v5.92' and before['health']['ok'] and not before['health']['tracker_refusing']
assert any(x['sha256']==OLD for x in before['inventory']['blobs'])
receipt={'author':'Andrew Fisher','server_sha256':NEW,'bytes':len(candidate),'execute':args.execute,'source_base_sha256':OLD,'started':datetime.now(timezone.utc).isoformat()}
if args.execute:
 ack=json.loads(request('/api/admin/machine/blob/'+NEW,'PUT',candidate));assert ack['sha256']==NEW and ack['bytes']==len(candidate)
 after=snapshot('after');inv={x['sha256']:x['bytes'] for x in after['inventory']['blobs']}
 assert inv.get(NEW)==len(candidate) and all(inv.get(x['sha256'])==x['bytes'] for x in before['inventory']['blobs'])
 assert after['health']['build']=='v5.92' and after['health']['ok'] and not after['health']['tracker_refusing']
 assert before['state']==after['state'] and before['cards']==after['cards'] and before['page']==after['page']
 for token,history in before['histories'].items():
  other=after['histories'][token]
  assert history['events']==other['events']
  for field in ['links','tracker','epoch','voids','void_seq']:assert history['pages'][0].get(field)==other['pages'][0].get(field)
 receipt.update({'blob_readback':True,'state_cards_page_history_signatures_unchanged':True,'live_server_still':'v5.92'})
receipt['finished']=datetime.now(timezone.utc).isoformat();save('receipt.json',json.dumps(receipt,indent=2).encode());print(json.dumps(receipt))
