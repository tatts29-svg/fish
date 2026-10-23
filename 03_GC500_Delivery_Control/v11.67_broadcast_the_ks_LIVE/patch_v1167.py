"""Author: Andrew Fisher. v11.67 - the kilometres in the race call, exactly as the record has them.

Andrew, 24 Oct 2026: "Make sure the ks are right in broadcast. The fencing. The ccb. The scriimms ks. There is a lot.of ks".
Every distance in the v11.65 programme was read against the live record to race weekend and against the Showcase scene it
plays over. The crowd-control (7.2 km: 2,135 m event + 5,062.5 m demarcation, 2,879 barriers), scrim (4.4 km: 3,977.5 m
fitted + 427.5 m on existing fence), relocation (582.5 m) and stack-down (1,102.5 m) lines were right. Four lines rounded
down or said more than the record does, and are re-voiced in the same voice, flow and mix:

  turn 2   "Twenty kilometres of fencing work"          -> "More than twenty kilometres of fence and crowd control"
  turn 28  "thirteen thousand one hundred and eighty-seven metres ... of temporary fence standing ... more than five
           hundred metres more"                         -> "13.2 km of temporary fence put in ... 13,187 and a half
           metres ... 570 metres more than the programme" (the record and the scene say 13,187.5 m, and the page calls it
           fence put in, not fence standing)
  turn 35  "twenty kilometres of fencing work"          -> "13.2 K of fence, 7.2 of crowd control, 270 metres of flat
           feet - 20.7 kilometres of fencing work ... and 4.4 K of scrim on top of that"
  turn 43  "Thirteen ... Seven kilometres of crowd control! Twenty kilometres of fencing work" -> "13.2 ... 7.2 of crowd
           control ... 4.4 of scrim ... 20.7 kilometres of fence and crowd control, all up"

20.7 km = 13,187.5 m fence + 2,135 m event CCB + 5,062.5 m demarcation CCB + 270 m flat-feet CCB (20,655 m), the same four
activities the page's fencing index counts (programme 20,241 m). Scrim, relocations and stack-downs are separate work on
the same fence and are not added in. The other 47 takes are v11.65's; the media table stays at 1,999 files (four out,
four in). Footer -> v11.67.

    python3 patch_v1167.py page.html      (in place, on the live v11.66 page: Codex's servicing map share on v11.65)
"""
import hashlib, json, re, shutil, subprocess, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
STAMP = '2026-10-24-ks'
MAX_MEDIA_FILES = 2000


def canonical(v):
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)


def probe_seconds(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(p)],
                       capture_output=True, text=True, check=True)
    return round(float(r.stdout.strip()), 2)


def patch(text, page_path):
    m = re.findall(r"\+' · (v11\.66)'; /\* v8\.19 release922", text)
    if len(m) != 1: raise ValueError('v11.67 is built on the live v11.66 page')
    base = m[0]
    i = text.find('const DATA = '); j = text.find('\n', i); line = text[i:j]
    obj = json.loads(line[len('const DATA = '):-1])
    if json.dumps(obj, ensure_ascii=False, separators=(',', ':')) != line[len('const DATA = '):-1]: raise ValueError('DATA does not round-trip')
    B = obj['broadcast']
    if B.get('schema') != 'gc500-broadcast-v2' or len(B['turns']) != 51: raise ValueError('the v11.65 programme is not on this page')
    if any(t.get('revoiced') == STAMP for t in B['turns']): raise ValueError('v11.67 already applied')

    changes = {c['slot']: c for c in json.loads((HERE / 'turns_changes.json').read_text(encoding='utf-8'))['turns']}
    picks = {r['slot']: r for r in json.loads((HERE / 'takes' / 'takes.json').read_text(encoding='utf-8'))}
    takes = HERE / 'takes'
    out_dir = Path(page_path).resolve().parent
    media_dir = out_dir / 'media_v1167'; media_dir.mkdir(exist_ok=True)
    rest = json.dumps({k: v for k, v in obj.items() if k not in ('broadcast', 'media')}, ensure_ascii=False)

    gone, added = [], {}
    for t in B['turns']:
        c = changes.get(t['slot'])
        if not c: continue
        if t['text'] != c['old'] or t['scene'] != c['scene']: raise ValueError('turn %d on the page is not the v11.65 line' % t['slot'])
        src = takes / ('turn%02d.mp3' % t['slot']); raw = src.read_bytes(); sha = hashlib.sha256(raw).hexdigest(); fn = sha + '.mp3'
        if picks[t['slot']]['sha256'] != sha: raise ValueError('turn %d take differs from takes.json' % t['slot'])
        dst = media_dir / fn
        if not dst.exists(): shutil.copyfile(src, dst)
        secs = probe_seconds(src)
        old = t['sha256']
        others = json.dumps([x for x in B['turns'] if x is not t])
        if old in rest or old in text[:i] or old in text[j:] or old in others: raise ValueError('old take %s is used elsewhere on the page' % old[:12])
        gone.append(old); obj['media'].pop(old)
        t.update({'text': c['text'], 'secs': secs, 'measured_s': secs, 'audio': {'media': sha}, 'bytes': len(raw), 'sha256': sha, 'revoiced': STAMP})
        added[sha] = {'file': fn, 'sha256': sha, 'type': 'audio/mpeg', 'bytes': len(raw), 'scope': 'view'}
    if len(added) != len(changes) or len(gone) != len(changes): raise ValueError('expected %d takes in and out, got %d/%d' % (len(changes), len(added), len(gone)))
    for sha, a in added.items():
        if sha in obj['media']: raise ValueError('take %s already in DATA.media' % sha[:12])
        obj['media'][sha] = a

    body_s = round(sum(t['secs'] for t in B['turns'] if not t['loop']), 2); loop_s = round(sum(t['secs'] for t in B['turns'] if t['loop']), 2)
    B['about']['body_s'] = body_s; B['about']['loop_s'] = loop_s
    B['revision'] += (' Revised 24 Oct 2026 (v11.67): turns 2, 28, 35 and 43 re-voiced so every distance is the record\'s own - 13.2 km of fence '
                      'put in (13,187.5 m, 570 m over the programme), 7.2 km of crowd control, 270 m of flat feet, 20.7 km of fence and crowd control '
                      'all up, 4.4 km of scrim.')

    assets = sorted([dict(sorted(a.items())) for a in obj['media'].values()], key=lambda a: a['file'])
    if len(assets) > MAX_MEDIA_FILES: raise ValueError('%d media files: the service takes at most %d' % (len(assets), MAX_MEDIA_FILES))
    digest = hashlib.sha256(canonical({'schema': 'gc500-media-v1', 'assets': assets}).encode('utf-8')).hexdigest()
    obj['hostedMedia']['manifest'] = digest
    (out_dir / 'media_manifest_v1167.json').write_text(json.dumps({'schema': 'gc500-media-v1', 'sha256': digest, 'assets': assets}, indent=1))
    (out_dir / 'broadcast_v1167.json').write_text(json.dumps(B, ensure_ascii=False, indent=1))

    text = text[:i] + 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';' + text[j:]
    text = rep(text, "+' · %s'; /* v8.19 release922" % base, "+' · v11.67'; /* v8.19 release922", 'release footer', 'page')
    print('v11.67 on %s: %d takes in, %d out, media %d files, manifest %s, body %.1f s + loop %.1f s'
          % (base, len(added), len(gone), len(assets), digest[:12], body_s, loop_s))
    return text


if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text(encoding='utf-8'), page), encoding='utf-8')
