#!/usr/bin/env python3
"""v7.22 - Daniel Gough in the race call. Andrew Fisher, 28 Sep 2026, after Daniel went on the install team (v7.21): the
four turns that name the install team (3, 8, 12 and 29) said "Aaron, Alfie and Kyle". Asked whether to re-voice them, he
said to, only if it makes sense; it does - it is the team's shout-out, and four short lines. Re-voiced in the same
GC500 Race Caller voice (ElevenLabs flow W7a20xwIayc6JFewVxvl, eleven_v3, one take each, 924 credits), same words with
Daniel added, same broadcast EQ and circuit bed, same loudness-normalised 96 kbps encode as the other 31. Each slot's
length is its new mixed take's measured length. The four old takes are dropped from the page and the media manifest.
    python3 patch_v722.py <page.html> <kit media dir> <final takes dir>"""
import hashlib, json, os, subprocess, sys
page, kit_media, takes = sys.argv[1:4]
SLOTS = {3: [('Kyle Gover! [fast]', 'Kyle Gover! Daniel Gough! [fast]')],
         8: [('Aaron, Alfie and Kyle —', 'Aaron, Alfie, Kyle and Daniel —')],
         12: [('Kyle Gover! [building]', 'Kyle Gover! Daniel Gough! [building]')],
         29: [('Aaron, Alfie and Kyle on install!', 'Aaron, Alfie, Kyle and Daniel on install!')]}
FFPROBE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bin', 'ffprobe')

def canonical(v):
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)

s = open(page, encoding='utf-8').read(); bom = s.startswith('﻿'); s = s.lstrip('﻿'); n0 = len(s)
i = s.find('const DATA = '); j = s.find('\n', i); line = s[i:j]; assert line.endswith(';')
obj = json.loads(line[len('const DATA = '):-1])
assert json.dumps(obj, ensure_ascii=False, separators=(',', ':')) == line[len('const DATA = '):-1], 'DATA does not round-trip'
if 'Daniel Gough' in json.dumps(obj['broadcast'], ensure_ascii=False) or 'Kyle and Daniel' in json.dumps(obj['broadcast'], ensure_ascii=False): sys.exit('v7.22 already applied')
mp = os.path.join(kit_media, 'manifest.json'); man = json.load(open(mp))
rest = json.dumps({k: v for k, v in obj.items() if k not in ('broadcast', 'media')})
gone, added = set(), {}
for t in obj['broadcast']['turns']:
    if t['slot'] not in SLOTS: continue
    for a, b in SLOTS[t['slot']]:
        assert t['text'].count(a) == 1, (t['slot'], a); t['text'] = t['text'].replace(a, b)
    raw = open(os.path.join(takes, 'turn%02d.mp3' % t['slot']), 'rb').read(); sha = hashlib.sha256(raw).hexdigest(); fn = sha + '.mp3'
    dst = os.path.join(kit_media, fn)
    if not os.path.exists(dst): open(dst, 'wb').write(raw)
    secs = round(float(subprocess.run([FFPROBE, dst], capture_output=True, text=True).stdout.strip()), 2)
    old = t['sha256']
    if old not in rest: gone.add(old)
    t.update({'audio': {'media': sha}, 'bytes': len(raw), 'sha256': sha, 'secs': secs, 'measured_s': secs})
    added[sha] = {'bytes': len(raw), 'file': fn, 'scope': 'view', 'sha256': sha, 'type': 'audio/mpeg'}
man['assets'] = [a for a in man['assets'] if a['sha256'] not in gone]
have = {a['file'] for a in man['assets']}
for a in added.values():
    if a['file'] not in have: man['assets'].append(a)
man['assets'].sort(key=lambda a: a['file'])
man['sha256'] = hashlib.sha256(canonical({'schema': 'gc500-media-v1', 'assets': man['assets']}).encode('utf-8')).hexdigest()
for sha in gone: obj['media'].pop(sha, None)
for a in added.values(): obj['media'][a['sha256']] = {'file': a['file'], 'sha256': a['sha256'], 'type': a['type'], 'bytes': a['bytes'], 'scope': a['scope']}
assert len(obj['media']) == len(man['assets']), (len(obj['media']), len(man['assets']))
obj['hostedMedia']['manifest'] = man['sha256']
obj['broadcast']['revision'] += ('; turns 3, 8, 12 and 29 re-voiced 28 Sep 2026 in the same voice, flow and mix to add Daniel Gough '
                                 'to the install team as named in the call')
json.dump(man, open(mp, 'w'), indent=1)
s = s[:i] + 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';' + s[j:]
open(page, 'w', encoding='utf-8').write(('﻿' if bom else '') + s)
print('takes', len(added), 'new,', len(gone), 'old dropped · manifest', len(man['assets']), 'digest', man['sha256'][:12], '·', n0, '->', len(s))
