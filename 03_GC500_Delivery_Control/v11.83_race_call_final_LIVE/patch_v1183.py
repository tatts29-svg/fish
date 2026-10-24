"""Author: Andrew Fisher. v11.83 - the race call says the finished build.

Andrew, 24 Oct 2026: "If we need to change anything in broadcast lets do it so everytjing matches we want everything to match."
v11.81 closed the fencing build at the docket numbers and re-voiced turn 33; the other eight fencing turns were written then and
voiced now, in the same voice (GC500 Race Caller), flow and mix: 28 (the fence), 29 (the papers), 30 (panels, feet, blocks),
31 (clamps, braces, gates), 32 (crowd control), 35 (all up, 100% of the build), 42 (eight areas at 100%), 43 (the totals). Two takes
each, all sixteen transcribed and every figure heard correctly; takes/picks.json says which is used. Eight takes out of the media
table, eight in (1,999 files); manifest digest; footer -> v11.83. No record, servicing, crew card, tracker or printed-code change.

    python3 patch_v1183.py page.html      (in place, on the live v11.81.1 page, or Codex's v11.82 if it is live first)
"""
import hashlib, json, re, shutil, subprocess, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
STAMP = '2026-10-24-final'
FOOTS = ["+' · v11.81.1'; /* v8.19 release922", "+' · v11.82'; /* v8.19 release922"]
FOOT_NEW = "+' · v11.83'; /* v8.19 release922"
MAX_MEDIA_FILES = 2000


def canonical(v):
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)


def probe_seconds(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(p)],
                       capture_output=True, text=True, check=True)
    return round(float(r.stdout.strip()), 2)


def broadcast(text, page_path):
    takes_json = HERE / 'takes' / 'takes.json'
    picks = {r['slot']: r for r in json.loads(takes_json.read_text(encoding='utf-8'))} if takes_json.exists() else {}
    if not picks: return text, []
    i = text.find('const DATA = '); j = text.find('\n', i); line = text[i:j]
    obj = json.loads(line[len('const DATA = '):-1])
    if json.dumps(obj, ensure_ascii=False, separators=(',', ':')) != line[len('const DATA = '):-1]: raise ValueError('DATA does not round-trip')
    B = obj['broadcast']
    if B.get('schema') != 'gc500-broadcast-v2' or len(B['turns']) != 51: raise ValueError('the v11.65 programme is not on this page')
    if any(t.get('revoiced') == STAMP for t in B['turns']): raise ValueError('v11.83 already applied')
    changes = {c['slot']: c for c in json.loads((HERE / 'turns_changes.json').read_text(encoding='utf-8'))['turns'] if c['slot'] in picks}
    if set(changes) != set(picks): raise ValueError('a take has no line in turns_changes.json')
    takes = HERE / 'takes'; out_dir = Path(page_path).resolve().parent
    media_dir = out_dir / 'media_v1183'; media_dir.mkdir(exist_ok=True)
    rest = json.dumps({k: v for k, v in obj.items() if k not in ('broadcast', 'media')}, ensure_ascii=False)
    gone, added = [], {}
    for t in B['turns']:
        c = changes.get(t['slot'])
        if not c: continue
        if t['text'] != c['old'] or t['scene'] != c['scene']: raise ValueError('turn %d on the page is not the v11.81.1 line' % t['slot'])
        src = takes / ('turn%02d.mp3' % t['slot']); raw = src.read_bytes(); sha = hashlib.sha256(raw).hexdigest(); fn = sha + '.mp3'
        if picks[t['slot']]['sha256'] != sha: raise ValueError('turn %d take differs from takes.json' % t['slot'])
        dst = media_dir / fn
        if not dst.exists(): shutil.copyfile(src, dst)
        secs = probe_seconds(src); old = t['sha256']
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
    slots = sorted(changes)
    B['revision'] += (' Revised 24 Oct 2026 (v11.83): turns %s re-voiced with the finished build’s figures - 13.3 km of fence (13,270 m, 653 m over'
                      ' the programme), 166 hire agreements, 42 labour notes and 25 collection forms over 32 days, 5,223 panels, 8,235 feet, 7,977 clamps,'
                      ' 133 vehicle gates, 7.3 km of crowd control (2,903 barriers; 2.2 km event, 5.1 km demarcation), 20.8 km all up, 100%% of the build,'
                      ' eight areas at 100%%.') % ', '.join(str(s) for s in slots)
    assets = sorted([dict(sorted(a.items())) for a in obj['media'].values()], key=lambda a: a['file'])
    if len(assets) > MAX_MEDIA_FILES: raise ValueError('%d media files: the service takes at most %d' % (len(assets), MAX_MEDIA_FILES))
    digest = hashlib.sha256(canonical({'schema': 'gc500-media-v1', 'assets': assets}).encode('utf-8')).hexdigest()
    obj['hostedMedia']['manifest'] = digest
    (out_dir / 'media_manifest_v1183.json').write_text(json.dumps({'schema': 'gc500-media-v1', 'sha256': digest, 'assets': assets}, indent=1))
    (out_dir / 'broadcast_v1183.json').write_text(json.dumps(B, ensure_ascii=False, indent=1))
    text = text[:i] + 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';' + text[j:]
    print('broadcast: turns %s re-voiced; %d takes in, %d out; media %d files, manifest %s; body %.1f s + loop %.1f s'
          % (slots, len(added), len(gone), len(assets), digest[:12], body_s, loop_s))
    return text, slots




def patch(text, page_path):
    foot = [f for f in FOOTS if text.count(f) == 1]
    if len(foot) != 1: raise ValueError('v11.83 is built on the live v11.81.1 (or v11.82) page')
    if 'id="complete1181-script"' not in text or 'id="lights11811-script"' not in text: raise ValueError('v11.81 and v11.81.1 must be on this page')
    text, slots = broadcast(text, page_path)
    if slots != [28, 29, 30, 31, 32, 35, 42, 43]: raise ValueError('expected the eight fencing turns, got %s' % slots)
    text = rep(text, foot[0], FOOT_NEW, 'release footer', 'page')
    if text.count(FOOT_NEW) != 1: raise ValueError('v11.83 footer did not land')
    print('v11.83 on %s: turns %s re-voiced; footer -> v11.83' % (foot[0][4:12], slots))
    return text


if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text(encoding='utf-8'), page), encoding='utf-8')
