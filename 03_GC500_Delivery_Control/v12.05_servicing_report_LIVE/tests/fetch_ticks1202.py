# Author: Andrew Fisher. Read only: the event servicing tracker's ticks, paged the way the page's SvcAdminReader pages them.
# Saves events and a token-free meta to this scratch folder. Prints no tokens, links or names.
import json, os, ssl, urllib.request, urllib.parse, sys
KEY = os.environ.get('GC500_EDIT_TOKEN', '')
if not KEY: sys.exit('no edit key in the environment')
ctx = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt') if os.path.exists('/root/.ccr/ca-bundle.crt') else None
BASE = 'https://gc500-production.up.railway.app'
def get(path):
    req = urllib.request.Request(BASE + path, headers={'x-gc500-token': KEY, 'cache-control': 'no-store'})
    with urllib.request.urlopen(req, context=ctx, timeout=60) as r: return json.loads(r.read().decode('utf-8'))
top = get('/api/ticks')
real = [t for t in top.get('trackers', []) if t.get('load') == 'servicing-tracker:GC500-2026' and t.get('tracker') and not t.get('card_withdrawn') and not t.get('expired')]
print('trackers', len(top.get('trackers', [])), 'event trackers', len(real))
if len(real) != 1: sys.exit('expected exactly one event tracker')
tok = real[0]['token']; cursor = 0; held = {}; last = None
for page in range(20):
    j = get('/api/ticks?' + urllib.parse.urlencode({'token': tok, 'since': cursor}))
    for e in j.get('ticks', []):
        if isinstance(e, dict) and isinstance(e.get('id'), str): held[e['id']] = e
    cursor = j.get('seq', cursor); last = j
    if not j.get('more'): break
meta = {k: v for k, v in last.items() if k not in ('ticks', 'token', 'links', 'keys', 'key', 'contact', 'html')}
json.dump({'meta': meta, 'events': list(held.values())}, open('ticks_snapshot.json', 'w'))
ev = list(held.values())
print('events', len(ev), 'meta keys', sorted(meta.keys()))
print('service now', meta.get('now'), 'load', meta.get('load'))
import collections
print('by day', dict(collections.Counter(e.get('day') for e in ev)))
print('event keys', sorted({k for e in ev for k in e.keys()}))
print('crew groups on ticks', dict(collections.Counter(e.get('crew_group') for e in ev)))
