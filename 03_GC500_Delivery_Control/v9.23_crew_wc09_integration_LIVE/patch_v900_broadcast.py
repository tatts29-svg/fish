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
# line changes; no money, no record, no pin, no MASTER_LOC, no marker. No footer change (patch_v900_footer.py does that).
#
# THE BASE IS READ, NOT ASSUMED. Whatever live page build.sh fetched (v9.04 when this was written; v8.99 before it), the
# patch takes from that page: slot 17's current take (its sha256, which must be its audio.media and a media entry), its
# current roll call (the name is appended after the last name called, which must occur once and end the text), DATA.media
# and DATA.hostedMedia.manifest. Before anything changes it proves the base's manifest digest is v7.22's canonical form of
# the base's own DATA.media; then it writes the new manifest and sets the digest. Only the new take is pinned (by SHA-256,
# size and measured length), because it is the input, not the base.
#
# Inputs, each bound by SHA-256 so the patch refuses anything else:
#   V900_TEAM   the private input naming the new crew member (the name is never written into this folder)
#   V900_TAKE   the page-ready take (48 kHz mono 96 kbps MP3, 16.03 s); kept out of git, see README_broadcast_part.md
#   V900_FFMPEG an ffmpeg binary (7.0.2 static was used); defaults to ffmpeg on PATH
#
#   V900_TEAM=... V900_TAKE=... V900_FFMPEG=... toolchain/build.sh v900_x <crew patch> v9.00_crew_vms_counts_DRAFT/patch_v900_broadcast.py ...
#
# Writes the media manifest (media_manifest_v900.json) next to the built page and beside this file, each build: it follows
# the base. A later part that changes DATA.media must write the manifest again (tests/test_broadcast900.cjs checks the final
# page's digest against the file and against its own DATA.media).
import copy, hashlib, json, os, re, shutil, subprocess, sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep   # the shared helper: the slot-17 text edit must match exactly once

TEAM_SHA = 'ee576e40d18d144038d3e0eefe0b1013042c72e05f47d51fff20888def84154a'   # private input, 8 Oct 2026
TAKE_SHA = 'c1f296379a281e22516d8f86a7d7f24097f7e5b47b4c6aa135dcb6e0dc352893'   # turn 17, page-ready take
TAKE_BYTES = 192428
TAKE_SECS = 16.03                                                                  # ffmpeg -i on the page-ready file
SLOT, TURN = 17, '15'
ROLL_CALL = 'Those metres are people!'      # the roll call's opening words: the slot is the fencing crew's roll call
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

# ---- slot 17 as the base has it: the roll call, on a take the media list carries
t17 = next(t for t in T if t['slot'] == SLOT)
OLD = t17['sha256']
assert t17['turn'] == TURN and ROLL_CALL in t17['text'], 'slot 17 is not the fencing crew roll call - wrong base'
assert t17['audio'] == {'media': OLD} and re.fullmatch(r'[0-9a-f]{64}', OLD), 'slot 17 must play its own take by SHA-256'
assert D['media'].get(OLD, {}).get('type') == 'audio/mpeg' and D['media'][OLD]['bytes'] == t17['bytes'], 'slot 17 take not in DATA.media as found'
assert t17['secs'] == t17['measured_s'], 'slot 17 secs and measured_s differ as found'

# ---- the proof: the base's manifest digest is v7.22's canonical form of the base's own DATA.media, before anything changes
for k, x in D['media'].items():
    assert set(x) == set(MEDIA_KEYS) and x['sha256'] == k and x['file'].startswith(k + '.'), 'media entry not as expected: ' + k
BASE_MANIFEST = D['hostedMedia']['manifest']
was = manifest_of(D['media'])
assert was['sha256'] == BASE_MANIFEST, \
    f'the base media list ({was["sha256"][:12]}) does not give the base hostedMedia.manifest ({BASE_MANIFEST[:12]}) - stopping'

# ---- 1. the text: the new name is called last, after the last name the base calls, in Andrew's spelling
old_text = t17['text']
LAST = old_text.rsplit('! ', 1)[-1]                     # the last name called, with its "!"
assert LAST.endswith('!') and len(LAST.split()) >= 2 and old_text.endswith(' ' + LAST), 'the roll call must end on a name'
t17['text'] = rep(old_text, ' ' + LAST, ' ' + LAST + ' ' + NAME + '!', 'slot 17 roll call', str(p))   # once, or stop
assert t17['text'] == old_text + ' ' + NAME + '!' and t17['text'].count(NAME) == 1

# ---- 2. the take, by SHA-256, and the slot's measures
fn = TAKE_SHA + '.mp3'
D['media'][TAKE_SHA] = {'file': fn, 'sha256': TAKE_SHA, 'type': 'audio/mpeg', 'bytes': TAKE_BYTES, 'scope': 'view'}
t17.update({'audio': {'media': TAKE_SHA}, 'bytes': TAKE_BYTES, 'sha256': TAKE_SHA, 'secs': SECS, 'measured_s': SECS})

# ---- 3. the old take leaves the media list when nothing else names it (the rest of DATA, other media entries, the page code)
others = json.dumps({k: v for k, v in D.items() if k != 'media'}, ensure_ascii=False) + s[:i] + s[j:]
dropped = []
if OLD not in others and not any(OLD in json.dumps(x) for k, x in D['media'].items() if k != OLD):
    D['media'].pop(OLD); dropped.append(OLD)

# ---- 4. the revision, dated, naming no one but the call
B['revision'] += f'; turn 17 re-voiced 8 Oct 2026 in the same voice, flow and mix to add {NAME} to the fencing crew as named in the call'

# ---- 5. the manifest
man = manifest_of(D['media'])
assert len(man['assets']) == len(D['media']) == len(ORIG['media']) + 1 - len(dropped)
assert man['sha256'] != BASE_MANIFEST
D['hostedMedia']['manifest'] = man['sha256']
man_text = json.dumps(man, ensure_ascii=False, separators=(',', ':'))
for target in (p.parent / MANIFEST_NAME, here / MANIFEST_NAME):
    target.write_text(man_text, encoding='utf-8')

# ---- what changed, and nothing else
for k in D:
    if k not in ('broadcast', 'media', 'hostedMedia'): assert D[k] == ORIG[k], 'DATA.' + k + ' changed - stopping'
assert set(D) == set(ORIG)
assert {k: v for k, v in D['hostedMedia'].items() if k != 'manifest'} == {k: v for k, v in ORIG['hostedMedia'].items() if k != 'manifest'}
assert {k: v for k, v in B.items() if k not in ('turns', 'revision')} == {k: v for k, v in ORIG['broadcast'].items() if k not in ('turns', 'revision')}
for a, b in zip(T, ORIG['broadcast']['turns']):
    if a['slot'] != SLOT: assert a == b, 'turn %s changed - stopping' % a['slot']
    else: assert set(a) == set(b) and {k for k in a if a[k] != b[k]} <= {'text', 'audio', 'bytes', 'sha256', 'secs', 'measured_s'}
assert {k for k in D['media']} == ({k for k in ORIG['media']} - set(dropped)) | {TAKE_SHA}
for t in T:   # every turn resolves to its take in the media list
    m = D['media'].get(t['audio']['media'])
    assert m and m['sha256'] == t['sha256'] and m['bytes'] == t['bytes'] and m['type'] == 'audio/mpeg' and m['file'] == t['sha256'] + '.mp3', t['slot']
assert not re.search(r'\$\s?\d', t17['text'] + B['revision']), 'no figure is spoken or written'
assert 'Andrew Fisher' not in t17['text'] + B['revision']

out = s[:i] + 'const DATA = ' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';' + s[j:]
assert out[:i] == s[:i] and out.endswith(s[j:])
p.write_bytes((b'\xef\xbb\xbf' if bom else b'') + out.encode('utf-8'))
print(f'v9.00 broadcast: slot 17 re-voiced ({SECS} s, {TAKE_BYTES} bytes, {TAKE_SHA[:12]}) | old take {OLD[:12]} dropped {len(dropped)} | '
      f'media {len(ORIG["media"])} -> {len(D["media"])} | base manifest {BASE_MANIFEST[:12]} proven from DATA.media -> {man["sha256"][:12]} | '
      f'{len(s)} -> {len(out)} chars')
