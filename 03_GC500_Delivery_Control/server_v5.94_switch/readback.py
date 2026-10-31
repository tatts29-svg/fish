"""Read-only read-back after the v5.94 switch (from the v5.93 one): compares the live service with the private pre-switch backup. Prints no key or link."""
import hashlib, json, os, sys, urllib.request, urllib.error
B = sys.argv[1]; HOST = 'https://gc500-production.up.railway.app'
TOKEN = os.environ['GC500_EDIT_TOKEN']; sha = lambda b: hashlib.sha256(b).hexdigest()
def get(route, auth=True):
    h = {'x-gc500-token': TOKEN, 'x-gc500-who': 'Andrew Fisher'} if auth else {}
    with urllib.request.urlopen(urllib.request.Request(HOST + route, headers=h), timeout=60) as r: return r.read()
def before(name):
    raw = open(os.path.join(B, 'before-' + name), 'rb').read(); return raw if name == 'page' else json.loads(raw)
now = {n: (get(r) if n == 'page' else json.loads(get(r))) for n, r in [('health', '/health'), ('version', '/api/version'), ('state', '/api/state'), ('cards', '/api/cards'), ('ticks', '/api/ticks'), ('inventory', '/api/admin/machine'), ('page', '/v/Coates-GC500-2026')]}
h = now['health']; hb = before('health')
print('health now:', {k: h.get(k) for k in ('ok', 'build', 'crew_groups_version', 'lock_declarations_version', 'delivery_field_guard_version', 'record_recovered', 'tracker_refusing', 'files', 'cards')})
print('health before: build', hb.get('build'), 'files', hb.get('files'), 'cards', hb.get('cards'))
print('page unchanged:', sha(now['page']) == sha(before('page')), sha(now['page'])[:16])
sb, sn = before('state'), now['state']
def docs(s): return s.get('docs', s) if isinstance(s, dict) else {}
db, dn = docs(sb), docs(sn); changed = []
for c in sorted(set(db) | set(dn)):
    a, b = db.get(c), dn.get(c)
    if a == b: continue
    if isinstance(a, dict) and isinstance(b, dict):
        for k in sorted(set(a) | set(b)):
            if a.get(k) != b.get(k): changed.append((c, k, 'added' if k not in a else 'removed' if k not in b else 'changed'))
    else: changed.append((c, '*', 'changed'))
print('state version before/now:', sb.get('version'), sn.get('version'), '| documents differing:', len(changed))
for c, k, how in changed[:20]: print('   ', how, c + '/' + str(k)[:60])
print('cards unchanged:', before('cards') == now['cards'])
inv_b = {x['sha256']: x['bytes'] for x in before('inventory')['blobs']}; inv_n = {x['sha256']: x['bytes'] for x in now['inventory']['blobs']}
print('inventory before/now:', len(inv_b), len(inv_n), '| every blob kept with its bytes:', all(inv_n.get(s) == n for s, n in inv_b.items()))
NEW = '9857a9786c875e6f2ffe75bc0f09e0c05500712188222fcb86b9fccc4a6d4b98'; OLD = '8764451d3768fcfbfc493da48fb9901503dcd6af0f8df247478aa53fb9428f46'
print('v5.94 blob', inv_n.get(NEW), '| v5.93 blob', inv_n.get(OLD))
hist_b = json.load(open(os.path.join(B, 'before-histories.json'))); ok_hist = True; total = 0
for tracker in now['ticks']['trackers']:
    token = tracker['token']; pages = []; since = 0
    for i in range(100):
        j = json.loads(get('/api/ticks?token=' + token + '&links=1&voided=1&voids=1&since=' + str(since))); pages.append(j)
        if not j.get('more'): break
        since = j['seq']
    ev = [t for p in pages for t in p.get('ticks', [])]; total += len(ev)
    hb_t = hist_b.get(token)
    if hb_t is None: print('   tracker not in backup (new?)'); ok_hist = False; continue
    same_ev = hb_t['events'] == ev
    same_meta = all(hb_t['pages'][0].get(f) == pages[0].get(f) for f in ['links', 'tracker', 'epoch', 'voids', 'void_seq'])
    if not (same_ev and same_meta): ok_hist = False; print('   tracker differs: events', same_ev, 'links/config', same_meta, 'before', len(hb_t['events']), 'now', len(ev))
print('trackers:', len(now['ticks']['trackers']), '| backup trackers:', len(hist_b), '| tick events now:', total, '| full histories, signed links and configuration unchanged:', ok_hist)
try: get('/api/ticks', auth=False); print('/api/ticks without key: NOT refused')
except urllib.error.HTTPError as e: print('/api/ticks without key:', e.code)
