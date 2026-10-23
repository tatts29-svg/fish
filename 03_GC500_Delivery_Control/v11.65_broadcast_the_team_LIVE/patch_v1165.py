"""Author: Andrew Fisher. v11.65 - the race-day broadcast redone: the team that built it.

Andrew, 23 Oct 2026: "Lets revisit the showcase broadcast. We want to talk as in numbers of everything done an completed
and we want to talk everyone up. Every single person. AARON lead the install ... Kyle another legend as well as alfie and
daniel ... Fencing this is another highlight. Nothing but positive comms about them and this is from the public ... One
team ... We need this to sound epic. Elite ... We need to redo.it all. An add more and more" and "Bit of humour is good so
lets get a few laughs in there too".

The programme: 51 turns in the GC500 Race Caller voice (flow Qc1iMoJTLhlFZqKutDwx, eleven_v3), every figure from the
record to race weekend, Fri 23 Oct 2026 (SCRIPT.md beside this file names each source). Two takes were generated a turn;
the one used is the one whose words, checked against the script, came out cleanest (takes/takes.json says which). Same
mix as v11.11: broadcast EQ, the circuit bed about 17 dB under the voice, -16 LUFS, mono 96 kbps MP3.

Only DATA.broadcast, its DATA.media entries and the hosted media manifest change, plus the footer; two superseded
machine-film renders leave the media table so the manifest stays inside the service's 2,000-file limit. The v11.11 module
(RaceDayBroadcast1111) already rebuilds the Showcase programme from each turn's scene, chains 1 -> ... -> 50 -> 51 and,
while Loop is on, rejoins at turn 3 ("So settle in, grab a cold drink"), never replaying the welcome; it is not added again. All 25 Showcase scenes are spoken
(the kilometre card now has its own line). The transcript follows the v5.97 rule ("the project manager" where the take
says the name).

Media: the 51 files go beside the page as media_v1165/<sha256>.mp3 with media_manifest_v1165.json, for
upload_media1165.py to put on the service BEFORE the page goes up.

    python3 patch_v1165.py page.html      (in place, on the live v11.63 or v11.64 page)
"""
import hashlib, json, re, shutil, subprocess, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

FLOW = 'Qc1iMoJTLhlFZqKutDwx'
VOICE = 'GC500 Race Caller'
N = 51
# welcome, settle-in + the team, what they built, the fencing, weather/effort/dates, one hundred per cent, one team + finish, loop
SECTION = {1: (1, 2), 2: (3, 12), 3: (13, 24), 4: (25, 35), 5: (36, 41), 6: (42, 43), 7: (44, 49), 8: (50, 51)}
# v5.97 rule: the page's prose says "the project manager"; these keep the scrubbed lines reading cleanly
# The service holds at most 2,000 files in a page's media manifest (server.js: assets.length>2000 -> "invalid media
# manifest"); 1,983 - 33 + 51 would be 2,001. The machine film's original v9.95 renders (MP4 and WebM, recorded in
# v9.95_machine_film_LIVE/RENDER_README.md) were replaced by the current film and nothing on the page or in the live
# record names them any more; they leave the page's media table (they stay on the service's disk).
RETIRE = ['0871900727ba7e070fe2abb52f44e18697ee34f2ba4cda8c6bd94c5ef66a1b34',
          'fb84697a6d4640eece234d02ef98547816a619e830f5ad8781c394ec3922e4df']
MAX_MEDIA_FILES = 2000
TRANSCRIPT = {4: ('the project manager — Andrew Fisher!', 'the project manager!'),
              47: ('Andrew Fisher! Aaron Zelvis!', 'The project manager! Aaron Zelvis!')}


def canonical(v):
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)


def probe_seconds(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(p)],
                       capture_output=True, text=True, check=True)
    return round(float(r.stdout.strip()), 2)


def section_of(slot):
    for sec, (a, b) in SECTION.items():
        if a <= slot <= b: return sec
    raise ValueError(slot)


def patch(text, page_path):
    m = re.findall(r"\+' · (v11\.6[34])'; /\* v8\.19 release922", text)
    if len(m) != 1: raise ValueError('v11.65 is built on the live v11.63 or v11.64 page')
    base = m[0]
    if 'RaceDayBroadcast1111' not in text: raise ValueError('the v11.11 broadcast module is not on the page')
    i = text.find('const DATA = '); j = text.find('\n', i); line = text[i:j]
    if i < 0 or not line.endswith(';'): raise ValueError('no DATA line')
    obj = json.loads(line[len('const DATA = '):-1])
    if json.dumps(obj, ensure_ascii=False, separators=(',', ':')) != line[len('const DATA = '):-1]: raise ValueError('DATA does not round-trip')
    if obj['broadcast'].get('schema') != 'gc500-broadcast-v2': raise ValueError('expected the v11.11 programme on the page')
    if len(obj['broadcast']['turns']) == N: raise ValueError('v11.65 already applied')

    script = json.loads((HERE / 'turns.json').read_text(encoding='utf-8'))
    picks = {r['slot']: r for r in json.loads((HERE / 'takes' / 'takes.json').read_text(encoding='utf-8'))}
    takes = HERE / 'takes'
    out_dir = Path(page_path).resolve().parent
    media_dir = out_dir / 'media_v1165'; media_dir.mkdir(exist_ok=True)

    rest = json.dumps({k: v for k, v in obj.items() if k not in ('broadcast', 'media')}, ensure_ascii=False)
    old = [t['sha256'] for t in obj['broadcast']['turns'] if t.get('sha256')]
    for sha in old:
        if sha in rest or sha in text[:i] or sha in text[j:]: raise ValueError('old take %s is used elsewhere on the page' % sha[:12])
        if sha not in obj['media']: raise ValueError('old take %s is not in DATA.media' % sha[:12])
        obj['media'].pop(sha)

    for sha in RETIRE:
        if sha not in obj['media'] or not obj['media'][sha]['type'].startswith('video/'): raise ValueError('retired film %s not as expected' % sha[:12])
        if sha in rest or sha in text[:i] or sha in text[j:] or sha in json.dumps(obj['broadcast']): raise ValueError('retired film %s is still named' % sha[:12])
        obj['media'].pop(sha)

    turns, added = [], {}
    for t in script['turns']:
        slot = int(t['slot']); src = takes / ('turn%02d.mp3' % slot)
        raw = src.read_bytes(); sha = hashlib.sha256(raw).hexdigest(); fn = sha + '.mp3'
        if picks[slot]['sha256'] != sha: raise ValueError('turn %d take differs from takes.json' % slot)
        dst = media_dir / fn
        if not dst.exists(): shutil.copyfile(src, dst)
        secs = probe_seconds(src)
        words = t['text']
        if slot in TRANSCRIPT:
            a, b = TRANSCRIPT[slot]
            if words.count(a) != 1: raise ValueError('turn %d transcript marker' % slot)
            words = words.replace(a, b)
        turns.append({'slot': slot, 'turn': str(slot), 'role': 'LEAD', 'section': section_of(slot), 'voice': VOICE, 'secs': secs,
                      'text': words, 'holds': None, 'loop': bool(t.get('loop')), 'standin': False, 'scene': t['scene'],
                      'audio': {'media': sha}, 'bytes': len(raw), 'sha256': sha, 'measured_s': secs})
        added[sha] = {'file': fn, 'sha256': sha, 'type': 'audio/mpeg', 'bytes': len(raw), 'scope': 'view'}
    if len(turns) != N or len(added) != N: raise ValueError('expected %d distinct takes, got %d/%d' % (N, len(turns), len(added)))
    if [t['slot'] for t in turns] != list(range(1, N + 1)) or [t['loop'] for t in turns].count(True) != 1 or not turns[-1]['loop']:
        raise ValueError('slots 1..%d with the loop opener last' % N)
    for sha, a in added.items():
        if sha in obj['media']: raise ValueError('take %s already in DATA.media' % sha[:12])
        obj['media'][sha] = a

    body_s = round(sum(t['secs'] for t in turns if not t['loop']), 2); loop_s = round(sum(t['secs'] for t in turns if t['loop']), 2)
    obj['broadcast'] = {
        'schema': 'gc500-broadcast-v2', 'author': 'Andrew Fisher', 'flow': FLOW, 'model': script.get('model', 'eleven_v3'), 'voice': VOICE,
        'revision': ('Race-day programme, 24 Oct 2026 - redone as the team that built it: 51 turns in the GC500 Race Caller voice (ElevenLabs flow '
                     + FLOW + ', eleven_v3; of two takes a turn, the one whose words matched the script cleanest), every person named and every figure '
                     'from the record to race weekend, Fri 23 Oct 2026 (SCRIPT.md in the v11.65 release folder names each source). Each take: broadcast '
                     'EQ, the circuit bed about 17 dB under the voice, loudness-normalised to -16 LUFS, mono 96 kbps. Each turn names the scene it speaks '
                     'over; the welcome (1-2) plays once, the body runs 3-50, the loop opener (51) rejoins at 3. The 22 Oct programme (33 takes) is retired.'),
        'note': 'The figures are spoken as they stood on the record at race weekend, Fri 23 Oct 2026; the scene behind each turn shows the live record.',
        'turns': turns,
        'about': {'have': N, 'of': N, 'his_takes': N, 'standins': 0, 'standin_is': None, 'body_s': body_s, 'loop_s': loop_s, 'missing': [], 'rejected': [],
                  'encoded': 'mono, broadcast EQ, circuit bed, loudness-normalised -16 LUFS, 96k MP3',
                  'stated': 'Every turn carries its own take over the scene it names; all 25 Showcase scenes are spoken.'}}

    assets = sorted([dict(sorted(a.items())) for a in obj['media'].values()], key=lambda a: a['file'])
    if len(assets) > MAX_MEDIA_FILES: raise ValueError('%d media files: the service takes at most %d' % (len(assets), MAX_MEDIA_FILES))
    digest = hashlib.sha256(canonical({'schema': 'gc500-media-v1', 'assets': assets}).encode('utf-8')).hexdigest()
    obj['hostedMedia']['manifest'] = digest
    (out_dir / 'media_manifest_v1165.json').write_text(json.dumps({'schema': 'gc500-media-v1', 'sha256': digest, 'assets': assets}, indent=1))
    (out_dir / 'broadcast_v1165.json').write_text(json.dumps(obj['broadcast'], ensure_ascii=False, indent=1))

    text = text[:i] + 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';' + text[j:]
    text = rep(text, "+' · %s'; /* v8.19 release922" % base, "+' · v11.65'; /* v8.19 release922", 'release footer', 'page')
    print('v11.65 on %s: %d takes in, %d old out, %d retired film renders out, media %d files, manifest %s, body %.1f s + loop %.1f s'
          % (base, N, len(old), len(RETIRE), len(assets), digest[:12], body_s, loop_s))
    return text


if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text(encoding='utf-8'), page), encoding='utf-8')
