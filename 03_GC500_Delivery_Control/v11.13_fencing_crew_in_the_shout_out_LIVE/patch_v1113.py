"""Author: Andrew Fisher. v11.13 - Wayne's fencing crew named in the final shout-out.

Andrew, 22 Oct 2026: "Can you add Wayne's crew names into the final shout out". Turn 30 (over crews_finish1090) re-voiced
in the same voice, flow and mix, now naming Wayne Woods, Owen Cowell McPaul, Daniel Macleod, Cody Woods, Chase Hireni,
Tahi Peni, Daniel Smith, Scott Hildebrand and Hayden McAvoy after the install team - the same nine the fencing turn (16)
names. The other 32 takes are v11.12's; the one it replaces leaves the page and the manifest. Footer v11.12 -> v11.13.

    python3 patch_v1113.py page.html      (in place, on the live v11.12 page)
"""
import hashlib, json, shutil, subprocess, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = '39492d284905cbaefc16055e73811e6fff88c6151210b38ce14b8f5f5f56494b'
REVOICED = [30]
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
    if BASE_SHA256 and hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.13 requires the live v11.12 page ' + BASE_SHA256)
    i = text.find('const DATA = '); j = text.find('\n', i); line = text[i:j]
    obj = json.loads(line[len('const DATA = '):-1])
    if json.dumps(obj, ensure_ascii=False, separators=(',', ':')) != line[len('const DATA = '):-1]: raise ValueError('DATA does not round-trip')
    B = obj['broadcast']
    if B.get('schema') != 'gc500-broadcast-v2' or len(B['turns']) != 33: raise ValueError('the v11.11 programme is not on this page')
    if any(t.get('revoiced') == '2026-10-22b' for t in B['turns']): raise ValueError('v11.13 already applied')

    script = json.loads((HERE / 'turns.json').read_text(encoding='utf-8'))
    takes = HERE / 'takes'
    out_dir = Path(page_path).resolve().parent
    media_dir = out_dir / 'media_v1113'; media_dir.mkdir(exist_ok=True)
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
        t.update({'text': words, 'secs': secs, 'measured_s': secs, 'audio': {'media': sha}, 'bytes': len(raw), 'sha256': sha, 'revoiced': '2026-10-22b'})
        added[sha] = {'bytes': len(raw), 'file': fn, 'scope': 'view', 'sha256': sha, 'type': 'audio/mpeg'}
    if len(added) != 1 or len(gone) != 1: raise ValueError('expected 1 take in and 1 out, got %d/%d' % (len(added), len(gone)))
    for sha, a in added.items(): obj['media'][sha] = {'file': a['file'], 'sha256': a['sha256'], 'type': a['type'], 'bytes': a['bytes'], 'scope': a['scope']}

    body_s = round(sum(t['secs'] for t in B['turns'] if not t['loop']), 2); loop_s = round(sum(t['secs'] for t in B['turns'] if t['loop']), 2)
    B['about']['body_s'] = body_s; B['about']['loop_s'] = loop_s
    B['revision'] += ' Revised again 22 Oct 2026 (v11.13): turn 30 re-voiced to name the fencing crew in the final shout-out.'

    assets = sorted([dict(sorted(m.items())) for m in obj['media'].values()], key=lambda a: a['file'])
    digest = hashlib.sha256(canonical({'schema': 'gc500-media-v1', 'assets': assets}).encode('utf-8')).hexdigest()
    obj['hostedMedia']['manifest'] = digest
    (out_dir / 'media_manifest_v1113.json').write_text(json.dumps({'schema': 'gc500-media-v1', 'sha256': digest, 'assets': assets}, indent=1))
    (out_dir / 'broadcast_v1113.json').write_text(json.dumps(B, ensure_ascii=False, indent=1))

    text = text[:i] + 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';' + text[j:]
    text = rep(text, "+' · v11.12'; /* v8.19 release922", "+' · v11.13'; /* v8.19 release922", 'release footer', 'page')
    print('v11.13: 1 take in, 1 out, media %d files, manifest %s, body %.1f s + loop %.1f s' % (len(assets), digest[:12], body_s, loop_s))
    return text


if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text(encoding='utf-8'), page), encoding='utf-8')
