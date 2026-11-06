"""Author: Andrew Fisher. v11.69 - Alonzo McAvoy on the fencing crew, on the page and in the race call.

Andrew, 24 Oct 2026: "Did i give you the other fencing guys name alonzo mcavoy to add". He had not been given before; the
crew stood at nine (the eight off the sign-on sheet of 17 Sep and Hayden McAvoy, added by the project manager on 8 Oct).

1. DATA.team: Alonzo McAvoy joins the fencing group after Hayden, as Fencing crew with the company, "added by the project
   manager on 24 Oct 2026", no role, number or email (none given). The fencing scene, the Meet-the-team cards and their fine
   print read the group from the record (fencingCrewWords900 counts the names added and their dates; ten cards lay out five
   by two). The group's note says ten names.
2. DATA.broadcast: the two roll calls re-voiced in the same voice, flow and mix, each now ending "... Hayden McAvoy! Alonzo
   McAvoy!" - turn 25 (Meet the fencing crew) and turn 47 (every name once more). Both takes of each were checked word for
   word; takes/picks.json says which is used. Two takes out of the media table, two in (1,999 files). The transcript keeps
   the v5.97 rule on turn 47 ("The project manager!" where the take says the name).
3. Footer v11.68 -> v11.69. No record, servicing, crew-card bundle, tracker or printed-code change.

    python3 patch_v1169.py page.html      (in place, on the live v11.68 page: Codex's servicing shift report on v11.67)
"""
import hashlib, json, re, shutil, subprocess, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
STAMP = '2026-10-24-alonzo'
TRANSCRIPT = {47: ('Andrew Fisher! Aaron Zelvis!', 'The project manager! Aaron Zelvis!')}   # v11.65's rule
ADDED = {'name': 'Alonzo McAvoy', 'event_role': 'Fencing crew', 'group': 'fencing', 'lead': None,
         'about': 'Advanced Temporary Fencing · added by the project manager on 24 Oct 2026 · no role, number or email given',
         'title': None, 'location': None, 'email': None, 'mobile': None, 'phone': None, 'reports_to': None, 'company': 'Advanced Temporary Fencing'}
NOTE_OLD = 'Nine names since 8 Oct 2026: the sheet’s eight, in its order, and one added by the project manager on 8 Oct 2026, listed last, as Fencing crew with the company — no other role, title, number or email was given, so none is written.'
NOTE_NEW = 'Ten names since 24 Oct 2026: the sheet’s eight, in its order, then one added by the project manager on 8 Oct 2026 and one on 24 Oct 2026, listed last, as Fencing crew with the company — no other role, title, number or email was given, so none is written.'
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
    m = re.findall(r"\+' · (v11\.68)'; /\* v8\.19 release922", text)
    if len(m) != 1: raise ValueError('v11.69 is built on the live v11.68 page')
    base = m[0]
    i = text.find('const DATA = '); j = text.find('\n', i); line = text[i:j]
    obj = json.loads(line[len('const DATA = '):-1])
    if json.dumps(obj, ensure_ascii=False, separators=(',', ':')) != line[len('const DATA = '):-1]: raise ValueError('DATA does not round-trip')
    B = obj['broadcast']
    if B.get('schema') != 'gc500-broadcast-v2' or len(B['turns']) != 51: raise ValueError('the v11.65 programme is not on this page')
    if any(t.get('revoiced') == STAMP for t in B['turns']): raise ValueError('v11.69 already applied')
    T = obj['team']; fence = [p for p in T['people'] if p.get('group') == 'fencing']
    if any(p['name'] == ADDED['name'] for p in T['people']): raise ValueError('Alonzo McAvoy is already on the page')
    if len(fence) != 9 or fence[-1]['name'] != 'Hayden Mcavoy': raise ValueError('the fencing crew is not the nine of 8 Oct')
    at = T['people'].index(fence[-1]) + 1
    T['people'].insert(at, dict(ADDED))
    grp = next(g for g in T['groups'] if g.get('key') == 'fencing')
    if grp['note'].count(NOTE_OLD) != 1: raise ValueError('fencing group note not as expected')
    grp['note'] = grp['note'].replace(NOTE_OLD, NOTE_NEW)

    changes = {c['slot']: c for c in json.loads((HERE / 'turns_changes.json').read_text(encoding='utf-8'))['turns']}
    picks = {r['slot']: r for r in json.loads((HERE / 'takes' / 'takes.json').read_text(encoding='utf-8'))}
    takes = HERE / 'takes'
    out_dir = Path(page_path).resolve().parent
    media_dir = out_dir / 'media_v1169'; media_dir.mkdir(exist_ok=True)
    rest = json.dumps({k: v for k, v in obj.items() if k not in ('broadcast', 'media')}, ensure_ascii=False)

    gone, added = [], {}
    for t in B['turns']:
        c = changes.get(t['slot'])
        if not c: continue
        old_words, new_words = c['old'], c['text']
        if t['slot'] in TRANSCRIPT:
            a, b = TRANSCRIPT[t['slot']]
            if old_words.count(a) != 1 or new_words.count(a) != 1: raise ValueError('turn %d transcript marker' % t['slot'])
            old_words, new_words = old_words.replace(a, b), new_words.replace(a, b)
        if t['text'] != old_words or t['scene'] != c['scene']: raise ValueError('turn %d on the page is not the v11.65 line' % t['slot'])
        src = takes / ('turn%02d.mp3' % t['slot']); raw = src.read_bytes(); sha = hashlib.sha256(raw).hexdigest(); fn = sha + '.mp3'
        if picks[t['slot']]['sha256'] != sha: raise ValueError('turn %d take differs from takes.json' % t['slot'])
        dst = media_dir / fn
        if not dst.exists(): shutil.copyfile(src, dst)
        secs = probe_seconds(src)
        old = t['sha256']
        others = json.dumps([x for x in B['turns'] if x is not t])
        if old in rest or old in text[:i] or old in text[j:] or old in others: raise ValueError('old take %s is used elsewhere on the page' % old[:12])
        gone.append(old); obj['media'].pop(old)
        t.update({'text': new_words, 'secs': secs, 'measured_s': secs, 'audio': {'media': sha}, 'bytes': len(raw), 'sha256': sha, 'revoiced': STAMP})
        added[sha] = {'file': fn, 'sha256': sha, 'type': 'audio/mpeg', 'bytes': len(raw), 'scope': 'view'}
    if len(added) != len(changes) or len(gone) != len(changes): raise ValueError('expected %d takes in and out, got %d/%d' % (len(changes), len(added), len(gone)))
    for sha, a in added.items():
        if sha in obj['media']: raise ValueError('take %s already in DATA.media' % sha[:12])
        obj['media'][sha] = a

    body_s = round(sum(t['secs'] for t in B['turns'] if not t['loop']), 2); loop_s = round(sum(t['secs'] for t in B['turns'] if t['loop']), 2)
    B['about']['body_s'] = body_s; B['about']['loop_s'] = loop_s
    B['revision'] += ' Revised 24 Oct 2026 (v11.69): turns 25 and 47 re-voiced with Alonzo McAvoy, added to the fencing crew, after Hayden McAvoy.'

    assets = sorted([dict(sorted(a.items())) for a in obj['media'].values()], key=lambda a: a['file'])
    if len(assets) > MAX_MEDIA_FILES: raise ValueError('%d media files: the service takes at most %d' % (len(assets), MAX_MEDIA_FILES))
    digest = hashlib.sha256(canonical({'schema': 'gc500-media-v1', 'assets': assets}).encode('utf-8')).hexdigest()
    obj['hostedMedia']['manifest'] = digest
    (out_dir / 'media_manifest_v1169.json').write_text(json.dumps({'schema': 'gc500-media-v1', 'sha256': digest, 'assets': assets}, indent=1))
    (out_dir / 'broadcast_v1169.json').write_text(json.dumps(B, ensure_ascii=False, indent=1))

    text = text[:i] + 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';' + text[j:]
    text = rep(text, "+' · %s'; /* v8.19 release922" % base, "+' · v11.69'; /* v8.19 release922", 'release footer', 'page')
    print('v11.69 on %s: Alonzo McAvoy added (fencing crew %d -> %d); %d takes in, %d out, media %d files, manifest %s, body %.1f s + loop %.1f s'
          % (base, len(fence), len(fence) + 1, len(added), len(gone), len(assets), digest[:12], body_s, loop_s))
    return text


if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text(encoding='utf-8'), page), encoding='utf-8')
