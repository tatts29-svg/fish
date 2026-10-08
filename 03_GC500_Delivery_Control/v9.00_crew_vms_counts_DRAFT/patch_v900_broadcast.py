#!/usr/bin/env python3
# Author: Andrew Fisher. v9.00 part B - the race call names the new member of the fencing crew.
#
# Andrew, 8 Oct 2026 about 11:25 AEST, after adding a name to the fencing team (part A): "<the new name> he will need to
# be added to the broadcast too". Turn 17 of the race call (DATA.broadcast.turns slot 17, turn "15") is the fencing crew's
# roll call. It is re-voiced on the v7.22 model: the same GC500 Race Caller voice, flow and mix, the same words with the new
# name called last, the same loudness-normalised 96 kbps encode as the other 34 (the mixing job's report, kept outside git,
# measured it against turns 16 and 18). The page's text keeps Andrew's spelling of the name; the take speaks the input's
# broadcast_spoken spelling.
#
# Data only: slot 17's text, take, bytes, sha256, secs and measured_s; the new take in DATA.media; the old slot-17 take out
# of DATA.media when nothing else names it; DATA.broadcast.revision; DATA.hostedMedia.manifest. Nothing outside the DATA
# line changes; no money, no record, no pin, no MASTER_LOC, no marker.
#
# Inputs, each bound by SHA-256 so the patch refuses anything else:
#   V900_TEAM   the private input naming the new crew member (the name is never written into this folder)
#   V900_TAKE   the page-ready take (48 kHz mono 96 kbps MP3, 16.03 s); kept out of git, see README_broadcast_part.md
#   V900_FFMPEG an ffmpeg binary (7.0.2 static was used); defaults to ffmpeg on PATH
#
#   V900_TEAM=... V900_TAKE=... V900_FFMPEG=... toolchain/build.sh v900_x <crew patch> v9.00_crew_vms_counts_DRAFT/patch_v900_broadcast.py ...
#
# Writes the media manifest the service checks the page against next to the built page, and keeps the reviewed copy
# media_manifest_v900.json beside this file (written when absent; when present it must match byte for byte).
import copy, hashlib, json, os, re, shutil, subprocess, sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep   # the shared helper: the slot-17 text edit must match exactly once; the DATA line is sliced, asserted once

TEAM_SHA = 'ee576e40d18d144038d3e0eefe0b1013042c72e05f47d51fff20888def84154a'   # private input, 8 Oct 2026
TAKE_SHA = 'c1f296379a281e22516d8f86a7d7f24097f7e5b47b4c6aa135dcb6e0dc352893'   # turn 17, page-ready take
TAKE_BYTES = 192428
TAKE_SECS = 16.03                                                                  # ffmpeg -i on the page-ready file
OLD_SHA = '91ddb4349a2ffa075f7b6cd2b9f6ee99f2e8967df81723d6d346cd44366adb50'    # the live slot-17 take (v6.70)
OLD_TEXT_SHA = '4c0ac428cc398d1657d911694e55b5a36932e137ab12bea03489efc4623fd0ac'  # sha256 of the live slot-17 text (UTF-8):
#   the roll call ending on the last of the crew's names, so the new name is appended after it and nowhere else
LIVE_MANIFEST = 'd01b619abe6fac3d56d077abaf8a2cdcbbc4c9e69bd725a4a84c01849c83fa1f'  # live hostedMedia.manifest (v8.98 / v8.99)
SLOT = 17
MEDIA_KEYS = ('bytes', 'file', 'scope', 'sha256', 'type')
MANIFEST_NAME = 'media_manifest_v900.json'


def canonical(v):   # v7.22's canonical form, which the service checks the manifest digest against
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)


def manifest_of(media):
    assets = sorted(({k: x[k] for k in MEDIA_KEYS} for x in media.values()), key=lambda a: a['file'])
    body = {'schema': 'gc500-media-v1', 'assets': assets}
    return dict(body, sha256=hashlib.sha256(canonical(body).encode('utf-8')).hexdigest())


def bound(env, sha):
    q = Path(os.environ.get(env) or '')
    if not q.is_file(): sys.exit(f'{env} must name the input (SHA-256 {sha[:16]}...)')
    raw = q.read_bytes(); got = hashlib.sha256(raw).hexdigest()
    if got != sha: sys.exit(f'{env}: checksum mismatch ({got[:16]}...)')
    return raw


def sha_text(t): return hashlib.sha256(t.encode('utf-8')).hexdigest()


p = Path(sys.argv[1]); raw_page = p.read_bytes(); bom = raw_page.startswith(b'\xef\xbb\xbf'); s = raw_page.decode('utf-8-sig')

# ---- the inputs
TEAM = json.loads(bound('V900_TEAM', TEAM_SHA).decode('utf-8'))
person = TEAM.get('person') or {}
NAME = person.get('name') or ''
SPOKEN = TEAM.get('broadcast_spoken') or ''
assert person.get('group') == 'fencing', 'the input must name a member of the fencing crew'
assert re.fullmatch(r"[A-Z][A-Za-z'\-]+(?: [A-Z][A-Za-z'\-]+)+", NAME), 'the name must be a plain given name and surname'
assert SPOKEN.casefold() == NAME.casefold(), 'the spoken spelling must be the same name, differing only in capitals'
TAKE = bound('V900_TAKE', TAKE_SHA); assert len(TAKE) == TAKE_BYTES, len(TAKE)
FFMPEG = os.environ.get('V900_FFMPEG') or shutil.which('ffmpeg')
if not FFMPEG or not os.access(FFMPEG, os.X_OK): sys.exit('V900_FFMPEG must name an ffmpeg binary (none on PATH)')
take_path = os.environ['V900_TAKE']
probe = subprocess.run([FFMPEG, '-hide_banner', '-i', take_path], capture_output=True, text=True).stderr
md = re.search(r'Duration: (\d+):(\d\d):(\d\d(?:\.\d+)?)', probe); assert md, 'ffmpeg gave no duration: ' + probe[-300:]
SECS = round(int(md.group(1)) * 3600 + int(md.group(2)) * 60 + float(md.group(3)), 2)
assert re.search(r'Audio: mp3\b.*\b48000 Hz, mono\b', probe), 'the take must be a 48 kHz mono MP3 like its neighbours'
dec = subprocess.run([FFMPEG, '-hide_banner', '-v', 'error', '-i', take_path, '-f', 'null', '-'], capture_output=True, text=True)
assert dec.returncode == 0 and not dec.stderr.strip(), 'the take does not decode cleanly: ' + dec.stderr[-300:]
assert abs(SECS - TAKE_SECS) < 0.005, f'measured {SECS} s; the take was measured at {TAKE_SECS} s'

# ---- the base: one DATA line that round-trips
assert s.count('const DATA = ') == 1, 'expected one DATA declaration'
i = s.find('const DATA = '); j = s.find('\n', i); line = s[i:j]; assert line.endswith(';'), 'DATA must be one line ending ;'
body = line[len('const DATA = '):-1]
D = json.loads(body); ORIG = copy.deepcopy(D)
assert json.dumps(D, ensure_ascii=False, separators=(',', ':')) == body, 'DATA does not round-trip - stopping'
B = D['broadcast']; T = B['turns']
assert len(T) == 35 and [t['slot'] for t in T] == list(range(1, 36)), 'the race call must carry 35 turns, slots 1..35'
if TAKE_SHA in D['media'] or TAKE_SHA in body or NAME in json.dumps(B, ensure_ascii=False):
    sys.exit('v9.00 broadcast part already applied')
t17 = next(t for t in T if t['slot'] == SLOT)
assert t17['turn'] == '15' and t17['sha256'] == OLD_SHA and t17['audio'] == {'media': OLD_SHA}, 'slot 17 is not the live take - wrong base'
assert sha_text(t17['text']) == OLD_TEXT_SHA, 'slot 17 text is not the live roll call - wrong base'
assert t17['text'].endswith('!') and t17['secs'] == t17['measured_s'] == 13.82, 'slot 17 is not as found'

# ---- the proof: the live manifest is exactly DATA.media, before anything changes
for k, x in D['media'].items():
    assert set(x) == set(MEDIA_KEYS) and x['sha256'] == k and x['file'].startswith(k + '.'), 'media entry not as expected: ' + k
was = manifest_of(D['media'])
assert was['sha256'] == D['hostedMedia']['manifest'] == LIVE_MANIFEST, \
    f'the base media list ({was["sha256"][:12]}) is not the live manifest ({D["hostedMedia"]["manifest"][:12]}, want {LIVE_MANIFEST[:12]}) - stopping'

# ---- 1. the text: the new name is called last, in Andrew's spelling
old_text = t17['text']
LAST = old_text.rsplit('! ', 1)[-1]                     # the last name called, with its "!" (the text is bound by hash above)
assert LAST.endswith('!') and len(LAST.split()) == 2 and old_text.endswith(LAST)
t17['text'] = rep(old_text, ' ' + LAST, ' ' + LAST + ' ' + NAME + '!', 'slot 17 roll call', str(p))   # rep() takes the leading space too
assert t17['text'] == old_text + ' ' + NAME + '!' and t17['text'].count(NAME) == 1

# ---- 2. the take, by SHA-256, and the slot's measures
fn = TAKE_SHA + '.mp3'
D['media'][TAKE_SHA] = {'file': fn, 'sha256': TAKE_SHA, 'type': 'audio/mpeg', 'bytes': TAKE_BYTES, 'scope': 'view'}
t17.update({'audio': {'media': TAKE_SHA}, 'bytes': TAKE_BYTES, 'sha256': TAKE_SHA, 'secs': SECS, 'measured_s': SECS})

# ---- 3. the old take leaves the media list when nothing else names it (DATA beyond its entry and slot 17, or the page)
others = json.dumps({k: v for k, v in D.items() if k != 'media'}, ensure_ascii=False) + s[:i] + s[j:]
dropped = []
if OLD_SHA not in others and not any(OLD_SHA in json.dumps(x) for k, x in D['media'].items() if k != OLD_SHA):
    D['media'].pop(OLD_SHA); dropped.append(OLD_SHA)

# ---- 4. the revision, dated, naming no one but the call
B['revision'] += f'; turn 17 re-voiced 8 Oct 2026 in the same voice, flow and mix to add {NAME} to the fencing crew as named in the call'

# ---- 5. the manifest
man = manifest_of(D['media'])
assert len(man['assets']) == len(D['media']) == len(ORIG['media']) + 1 - len(dropped)
D['hostedMedia']['manifest'] = man['sha256']
man_text = json.dumps(man, ensure_ascii=False, separators=(',', ':'))
(p.parent / MANIFEST_NAME).write_text(man_text, encoding='utf-8')
kept = here / MANIFEST_NAME
if kept.exists():
    assert kept.read_text(encoding='utf-8') == man_text, f'{MANIFEST_NAME} beside the patch differs from this build - stopping'
else:
    kept.write_text(man_text, encoding='utf-8')

# ---- what changed, and nothing else
for k in D:
    if k not in ('broadcast', 'media', 'hostedMedia'): assert D[k] == ORIG[k], 'DATA.' + k + ' changed - stopping'
assert set(D) == set(ORIG)
assert {k: v for k, v in D['hostedMedia'].items() if k != 'manifest'} == {k: v for k, v in ORIG['hostedMedia'].items() if k != 'manifest'}
assert {k: v for k, v in B.items() if k not in ('turns', 'revision')} == {k: v for k, v in ORIG['broadcast'].items() if k not in ('turns', 'revision')}
for a, b in zip(T, ORIG['broadcast']['turns']):
    if a['slot'] != SLOT: assert a == b, 'turn %s changed - stopping' % a['slot']
    else: assert set(a) == set(b) and {k for k in a if a[k] != b[k]} == {'text', 'audio', 'bytes', 'sha256', 'secs', 'measured_s'}
assert {k for k in D['media']} == ({k for k in ORIG['media']} - set(dropped)) | {TAKE_SHA}
for t in T:   # every turn resolves to its take in the media list
    m = D['media'].get(t['audio']['media'])
    assert m and m['sha256'] == t['sha256'] and m['bytes'] == t['bytes'] and m['type'] == 'audio/mpeg' and m['file'] == t['sha256'] + '.mp3', t['slot']
assert not re.search(r'\$\s?\d', t17['text'] + B['revision']), 'no figure is spoken or written'
assert 'Andrew Fisher' not in t17['text'] + B['revision']

out = s[:i] + 'const DATA = ' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';' + s[j:]
assert out[:i] == s[:i] and out.endswith(s[j:])
p.write_bytes((b'\xef\xbb\xbf' if bom else b'') + out.encode('utf-8'))
print(f'v9.00 broadcast: slot 17 re-voiced ({SECS} s, {TAKE_BYTES} bytes, {TAKE_SHA[:12]}) | old take dropped {len(dropped)} | '
      f'media {len(ORIG["media"])} -> {len(D["media"])} | manifest {LIVE_MANIFEST[:12]} -> {man["sha256"][:12]} | {len(s)} -> {len(out)} chars')
