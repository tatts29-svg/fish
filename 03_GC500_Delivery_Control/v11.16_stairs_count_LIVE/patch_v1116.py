"""Author: Andrew Fisher. v11.16 - the stairs count in the race call follows the record: forty-two.

Andrew, 22 Oct 2026: "P60. P62 p63 can we remove steps these dont have steps". The three Gate 5 buildings came off the
steps count on the record (record_22Oct2026_no_steps/, 45 -> 42 buildings with steps). Turn 8 (over the install checks
scene) said "Forty-five sets of stairs"; it is re-voiced in the same voice, flow and mix to say forty-two, so the call and
the record say the same thing (the "one figure, everywhere" rule). The other 32 takes are v11.13's. Footer v11.15 -> v11.16.

    python3 patch_v1116.py page.html      (in place, on the live v11.15 page)
"""
import hashlib, json, shutil, subprocess, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = 'd253cecd6a68962a38e2fd05d9c6dcad89e04ac2bbe16042c5b12da23cfaa8a3'
REVOICED = [8]
TRANSCRIPT = {3: ('the project manager, Andrew Fisher!', 'Andrew Fisher!')}   # v11.11's transcript rule, unchanged




def canonical(v):
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)


def probe_seconds(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(p)],
                       capture_output=True, text=True, check=True)
    return round(float(r.stdout.strip()), 2)


def patch(text, page_path):
    if BASE_SHA256 and hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.16 requires the live v11.15 page ' + BASE_SHA256)
    i = text.find('const DATA = '); j = text.find('\n', i); line = text[i:j]
    obj = json.loads(line[len('const DATA = '):-1])
    if json.dumps(obj, ensure_ascii=False, separators=(',', ':')) != line[len('const DATA = '):-1]: raise ValueError('DATA does not round-trip')
    B = obj['broadcast']
    if B.get('schema') != 'gc500-broadcast-v2' or len(B['turns']) != 33: raise ValueError('the v11.11 programme is not on this page')
    if any(t.get('revoiced') == '2026-10-22c' for t in B['turns']): raise ValueError('v11.16 already applied')

    script = json.loads((HERE / 'turns.json').read_text(encoding='utf-8'))
    takes = HERE / 'takes'
    out_dir = Path(page_path).resolve().parent
    media_dir = out_dir / 'media_v1116'; media_dir.mkdir(exist_ok=True)
    rest = json.dumps({k: v for k, v in obj.items() if k not in ('broadcast', 'media')}, ensure_ascii=False)

    gone, added = [], {}
    for t in B['turns']:
        s = next(x for x in script['turns'] if x['slot'] == t['slot'])
        words = s['text']
        if t['slot'] in TRANSCRIPT:
            a, b = TRANSCRIPT[t['slot']]
            if words.count(a) != 1: raise ValueError('turn %d transcript marker' % t['slot'])
            words = words.replace(a, b)
        if t['slot'] not in REVOICED:
            if t['text'] != words.replace('Andrew Fisher', 'the project manager'): raise ValueError('turn %d text differs from the script' % t['slot'])
            continue
        src = takes / ('turn%02d.mp3' % t['slot']); raw = src.read_bytes(); sha = hashlib.sha256(raw).hexdigest(); fn = sha + '.mp3'
        dst = media_dir / fn
        if not dst.exists(): shutil.copyfile(src, dst)
        secs = probe_seconds(src)
        old = t['sha256']
        if old in rest or old in text[:i] or old in text[j:]: raise ValueError('old take %s is used elsewhere on the page' % old[:12])
        gone.append(old); obj['media'].pop(old, None)
        t.update({'text': words, 'secs': secs, 'measured_s': secs, 'audio': {'media': sha}, 'bytes': len(raw), 'sha256': sha, 'revoiced': '2026-10-22c'})
        added[sha] = {'bytes': len(raw), 'file': fn, 'scope': 'view', 'sha256': sha, 'type': 'audio/mpeg'}
    if len(added) != 1 or len(gone) != 1: raise ValueError('expected 1 take in and 1 out, got %d/%d' % (len(added), len(gone)))
    for sha, a in added.items(): obj['media'][sha] = {'file': a['file'], 'sha256': a['sha256'], 'type': a['type'], 'bytes': a['bytes'], 'scope': a['scope']}

    body_s = round(sum(t['secs'] for t in B['turns'] if not t['loop']), 2); loop_s = round(sum(t['secs'] for t in B['turns'] if t['loop']), 2)
    B['about']['body_s'] = body_s; B['about']['loop_s'] = loop_s
    B['revision'] += ' Revised 22 Oct 2026 (v11.16): turn 8 re-voiced, forty-two sets of stairs, as the record now reads.'

    assets = sorted([dict(sorted(m.items())) for m in obj['media'].values()], key=lambda a: a['file'])
    digest = hashlib.sha256(canonical({'schema': 'gc500-media-v1', 'assets': assets}).encode('utf-8')).hexdigest()
    obj['hostedMedia']['manifest'] = digest
    (out_dir / 'media_manifest_v1116.json').write_text(json.dumps({'schema': 'gc500-media-v1', 'sha256': digest, 'assets': assets}, indent=1))
    (out_dir / 'broadcast_v1116.json').write_text(json.dumps(B, ensure_ascii=False, indent=1))

    text = text[:i] + 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';' + text[j:]
    text = rep(text, "+' · v11.15'; /* v8.19 release922", "+' · v11.16'; /* v8.19 release922", 'release footer', 'page')
    print('v11.16: 1 take in, 1 out, media %d files, manifest %s, body %.1f s + loop %.1f s' % (len(assets), digest[:12], body_s, loop_s))
    return text


if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text(encoding='utf-8'), page), encoding='utf-8')
