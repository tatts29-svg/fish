#!/usr/bin/env python3
"""v6.60 - THE BROADCAST AS A LIVE RACE CALL (Andrew Fisher, 26 Sep 2026: "the broadcast the voices need to sound like race car
commentary they need to talk like its a race on right now. Supercar v8s live commentary. proceed and approved").

The thirty-five turns keep their slots, sections, names, facts and "holds" figures; the words are called as live Supercars
commentary - present tense, flat out, over the engine - and re-voiced on his ElevenLabs account (flow houl7zfZXdRtQEN9kWNL,
eleven_v3, the same two voices). Each take has a broadcast EQ and a circuit bed under it (layered crowd, shaped noise and his
original V8 clip, about 17 dB under the voice), loudness-normalised by pipeline/broadcast.py. The page carries the new takes
as media by SHA-256 and drops the old ones from the kit's manifest and its own media table, so nothing unused is shipped.

  python3 patch_v660.py <page.html> <kit media dir> <print/web/broadcast.json>
"""
import base64, hashlib, json, os, re, sys
page, kit_media, bc_path = sys.argv[1:4]

def canonical(v):
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)

bc = json.load(open(bc_path, encoding='utf-8')); added = {}
for t in bc['turns']:
    raw = base64.b64decode(t['audio'].split(',', 1)[1], validate=True); sha = hashlib.sha256(raw).hexdigest(); fn = sha + '.mp3'
    dst = os.path.join(kit_media, fn)
    if not os.path.exists(dst): open(dst, 'wb').write(raw)
    added[sha] = {'bytes': len(raw), 'file': fn, 'scope': 'view', 'sha256': sha, 'type': 'audio/mpeg'}; t['audio'] = {'media': sha}

s = open(page, encoding='utf-8').read(); bom = s.startswith('﻿'); s = s.lstrip('﻿'); n0 = len(s)
i = s.find('const DATA = '); j = s.find('\n', i); line = s[i:j]; assert line.endswith(';')
obj = json.loads(line[len('const DATA = '):-1])
assert json.dumps(obj, ensure_ascii=False, separators=(',', ':')) == line[len('const DATA = '):-1]
old = {(t.get('audio') or {}).get('media') for t in (obj.get('broadcast') or {}).get('turns', []) if isinstance(t.get('audio'), dict)} - {None}
# drop the old takes unless anything else in DATA still points at them
rest = json.dumps({k: v for k, v in obj.items() if k not in ('broadcast', 'media')})
gone = {sha for sha in old if sha not in rest and sha not in added}
mp = os.path.join(kit_media, 'manifest.json'); man = json.load(open(mp))
man['assets'] = [a for a in man['assets'] if a['sha256'] not in gone]
have = {a['file'] for a in man['assets']}
for a in added.values():
    if a['file'] not in have: man['assets'].append(a)
man['assets'].sort(key=lambda a: a['file'])
man['sha256'] = hashlib.sha256(canonical({'schema': 'gc500-media-v1', 'assets': man['assets']}).encode('utf-8')).hexdigest()
json.dump(man, open(mp, 'w'), indent=1)
for sha in gone: obj['media'].pop(sha, None)
for a in added.values(): obj['media'][a['sha256']] = {'file': a['file'], 'sha256': a['sha256'], 'type': a['type'], 'bytes': a['bytes'], 'scope': a['scope']}
assert len(obj['media']) == len(man['assets']), (len(obj['media']), len(man['assets']))
obj['hostedMedia']['manifest'] = man['sha256']; obj['broadcast'] = bc
s = s[:i] + 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';' + s[j:]
open(page, 'w', encoding='utf-8').write(('﻿' if bom else '') + s)
print('takes', len(added), 'new,', len(gone), 'old dropped · manifest', len(man['assets']), 'digest', man['sha256'][:12], '·', n0, '->', len(s))
