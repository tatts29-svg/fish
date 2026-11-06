"""Author: Andrew Fisher. v11.85 - the feet read as feet.

Andrew, 24 Oct 2026: "Do you have the feet right ... Feet/bases we should have 1000s not hundreds ... Concrete block are wrong ...
Forget what we charge i want data what they used ... What are concrete blocks are they not feet". They are: the 216 "fence blocks"
were docket 36566's feet, put on the card's Fence Blocks charge line, and they are already inside the 8,235 feet on the dockets.
  1. feet1185.js: the progress views' recorded-only "Fence blocks 216" line reads "Feet / bases" with the component-box total
     of the usable hire agreements (8,235 to race weekend) on the Today fencing table and its breakdown (every hire agreement
     with its feet) and on the Progress tab's planned-against-docketed table. Charge lines, rates and docket 36566 unchanged.
  2. Race-call turn 30 without "two hundred and sixteen concrete blocks": the v11.83 take with the phrase cut out
     (cut_turn30.py; a fresh voicing was declined and is not retried), mixed as v11.83. One take out of the media table, one in
     (1,999 files); manifest digest; footer -> v11.85. No record, servicing, crew card, tracker or printed-code change.

    python3 patch_v1185.py page.html      (in place, on the live v11.84 page)
"""
import hashlib, json, shutil, subprocess, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
STAMP = '2026-10-24-feet'
FOOT_OLD = "+' · v11.84'; /* v8.19 release922"
FOOT_NEW = "+' · v11.85'; /* v8.19 release922"
ANCHOR = '<script id="steady1143-script">'
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
    picks = {r['slot']: r for r in json.loads((HERE / 'takes' / 'takes.json').read_text(encoding='utf-8'))}
    i = text.find('const DATA = '); j = text.find('\n', i); line = text[i:j]
    obj = json.loads(line[len('const DATA = '):-1])
    if json.dumps(obj, ensure_ascii=False, separators=(',', ':')) != line[len('const DATA = '):-1]: raise ValueError('DATA does not round-trip')
    B = obj['broadcast']
    if B.get('schema') != 'gc500-broadcast-v2' or len(B['turns']) != 51: raise ValueError('the v11.65 programme is not on this page')
    if any(t.get('revoiced') == STAMP for t in B['turns']): raise ValueError('v11.85 already applied')
    changes = {c['slot']: c for c in json.loads((HERE / 'turns_changes.json').read_text(encoding='utf-8'))['turns']}
    if set(changes) != set(picks): raise ValueError('a take has no line in turns_changes.json')
    takes = HERE / 'takes'; out_dir = Path(page_path).resolve().parent
    media_dir = out_dir / 'media_v1185'; media_dir.mkdir(exist_ok=True)
    rest = json.dumps({k: v for k, v in obj.items() if k not in ('broadcast', 'media')}, ensure_ascii=False)
    gone, added = [], {}
    for t in B['turns']:
        c = changes.get(t['slot'])
        if not c: continue
        if t['text'] != c['old'] or t['scene'] != c['scene']: raise ValueError('turn %d on the page is not the v11.83 line' % t['slot'])
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
    if any('concrete' in t['text'].lower() for t in B['turns']): raise ValueError('a turn still says concrete blocks')
    body_s = round(sum(t['secs'] for t in B['turns'] if not t['loop']), 2); loop_s = round(sum(t['secs'] for t in B['turns'] if t['loop']), 2)
    B['about']['body_s'] = body_s; B['about']['loop_s'] = loop_s
    slots = sorted(changes)
    B['revision'] += (' Revised 24 Oct 2026 (v11.85): turn %s no longer says "two hundred and sixteen concrete blocks" - the blocks are the'
                      ' feet (docket 36566\'s 216, already inside the 8,235); the phrase is cut from the v11.83 take, no new voicing.') % ', '.join(str(s) for s in slots)
    assets = sorted([dict(sorted(a.items())) for a in obj['media'].values()], key=lambda a: a['file'])
    if len(assets) > MAX_MEDIA_FILES: raise ValueError('%d media files: the service takes at most %d' % (len(assets), MAX_MEDIA_FILES))
    digest = hashlib.sha256(canonical({'schema': 'gc500-media-v1', 'assets': assets}).encode('utf-8')).hexdigest()
    obj['hostedMedia']['manifest'] = digest
    (out_dir / 'media_manifest_v1185.json').write_text(json.dumps({'schema': 'gc500-media-v1', 'sha256': digest, 'assets': assets}, indent=1))
    (out_dir / 'broadcast_v1185.json').write_text(json.dumps(B, ensure_ascii=False, indent=1))
    text = text[:i] + 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';' + text[j:]
    print('broadcast: turn %s cut; %d take in, %d out; media %d files, manifest %s; body %.1f s + loop %.1f s'
          % (slots, len(added), len(gone), len(assets), digest[:12], body_s, loop_s))
    return text, slots


def patch(text, page_path):
    if 'id="feet1185-script"' in text: raise ValueError('v11.85 is already on this page')
    if text.count(FOOT_OLD) != 1: raise ValueError('v11.85 is built on the live v11.84 page')
    for s in ('complete1181-script', 'lights11811-script', 'progress1163-script'):
        if 'id="%s"' % s not in text: raise ValueError('%s must be on this page' % s)
    for fn in ('function fenceComponents849(', 'function todayLinkedFencing848(', "{id: 'fence_blocks', label: 'Fence blocks'", 'const fenceLines = FCOL.map(c => {'):
        if fn not in text: raise ValueError('the page no longer has %s' % fn)
    text, slots = broadcast(text, page_path)
    if slots != [30]: raise ValueError('expected turn 30 only, got %s' % slots)
    js = (HERE / 'feet1185.js').read_text(encoding='utf-8')
    if '</script' in js.lower(): raise ValueError('feet1185.js must not close its own script')
    text = rep(text, ANCHOR, '<script id="feet1185-script">\n' + js + '</script>\n' + ANCHOR, 'feet1185 script before steady1143', 'page')
    text = rep(text, FOOT_OLD, FOOT_NEW, 'release footer', 'page')
    if text.count(FOOT_NEW) != 1 or text.count('id="feet1185-script"') != 1: raise ValueError('v11.85 did not land')
    print('v11.85 on v11.84: feet1185 script in; turn %s cut; footer -> v11.85' % slots)
    return text


if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text(encoding='utf-8'), page), encoding='utf-8')
