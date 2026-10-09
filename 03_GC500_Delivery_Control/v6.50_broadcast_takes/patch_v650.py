#!/usr/bin/env python3
"""v6.50 - THE BROADCAST HAS ITS TAKES (Andrew Fisher, 26 Sep 2026: "Then broadcast activate and get that sorted").

The programme's thirty-five turns were generated on his ElevenLabs account (flow 2zKC9W0fRUvP06zjlYwD, eleven_v3, LEAD on
his designed voice Gc500, COLOUR on Josh - Warm Conversational Australian), one take a turn, downloaded, measured, made
mono and peak-normalised at 96 kbps by pipeline/broadcast.py, and put into the hosted page the way every other piece of
media is: each take a file named by its SHA-256 in the kit's media folder and in the manifest, a {"media": sha} marker in
DATA.broadcast where the take goes, the manifest digest recomputed the service's way. Nothing else in the page changes;
the Broadcast button, its player and the scene rule were already there waiting for the takes.

  python3 patch_v650.py <page.html> <kit media dir> <print/web/broadcast.json>
"""
import base64, hashlib, json, os, re, sys

page, kit_media, bc_path = sys.argv[1], sys.argv[2], sys.argv[3]

def canonical(v):
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)

bc = json.load(open(bc_path, encoding='utf-8'))
added = {}
for t in bc['turns']:
    a = t.get('audio')
    if not a: continue
    m = re.fullmatch(r'data:audio/mpeg;base64,([A-Za-z0-9+/=]+)', a)
    assert m, 'turn %s: not an mp3 data URI' % t['slot']
    raw = base64.b64decode(m.group(1), validate=True); sha = hashlib.sha256(raw).hexdigest()
    assert sha == t.get('sha256', sha), 'turn %s: sha mismatch' % t['slot']
    fn = sha + '.mp3'; dst = os.path.join(kit_media, fn)
    if not os.path.exists(dst): open(dst, 'wb').write(raw)
    added[sha] = {'bytes': len(raw), 'file': fn, 'scope': 'view', 'sha256': sha, 'type': 'audio/mpeg'}
    t['audio'] = {'media': sha}
print('takes', len(added), 'files,', sum(a['bytes'] for a in added.values()) // 1024, 'KB')

# 1. the kit's media manifest
mp = os.path.join(kit_media, 'manifest.json'); man = json.load(open(mp))
assert man['schema'] == 'gc500-media-v1'
have = {a['file'] for a in man['assets']}
for a in added.values():
    if a['file'] not in have: man['assets'].append(a)
man['assets'].sort(key=lambda a: a['file'])
man['sha256'] = hashlib.sha256(canonical({'schema': 'gc500-media-v1', 'assets': man['assets']}).encode('utf-8')).hexdigest()
json.dump(man, open(mp, 'w'), indent=1); print('manifest', len(man['assets']), 'assets, digest', man['sha256'][:12])

# 2. the page's DATA: the media table, the manifest digest, the broadcast
s = open(page, encoding='utf-8').read(); bom = s.startswith('﻿'); s = s.lstrip('﻿'); n0 = len(s)
i = s.find('const DATA = '); j = s.find('\n', i); line = s[i:j]; assert line.endswith(';')
obj = json.loads(line[len('const DATA = '):-1])
assert json.dumps(obj, ensure_ascii=False, separators=(',', ':')) == line[len('const DATA = '):-1], 'DATA would not re-serialise byte for byte'
for a in added.values(): obj['media'][a['sha256']] = {'file': a['file'], 'sha256': a['sha256'], 'type': a['type'], 'bytes': a['bytes'], 'scope': a['scope']}
assert len(obj['media']) == len(man['assets']), (len(obj['media']), len(man['assets']))
obj['hostedMedia']['manifest'] = man['sha256']
old = obj.get('broadcast') or {}
obj['broadcast'] = bc
print('broadcast: was', (old.get('about') or {}).get('have'), 'of', (old.get('about') or {}).get('of'), '-> now', bc['about']['have'], 'of', bc['about']['of'], '· flow', bc.get('flow'))
s = s[:i] + 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';' + s[j:]
open(page, 'w', encoding='utf-8').write(('﻿' if bom else '') + s); print('ok', os.path.basename(page), n0, '->', len(s))
