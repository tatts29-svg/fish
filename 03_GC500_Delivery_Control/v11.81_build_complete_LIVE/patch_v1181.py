"""Author: Andrew Fisher. v11.81 - the fencing build is complete at the docket numbers, and the race call says so.

Andrew, 24 Oct 2026: "So we need fencing to be 100% now and we work off number we have for completion of build", then
"If we need to change anything in broadcast lets do it so everytjing matches we want everything to match. Make sure we know
everything advanced have done and a rough figure or an exact one".

1. complete1181.js + data_v1181.json, one script before steady1143 (after v11.63's race-weekend wrappers, so it reads the
   capped day): the project manager's ruling closes the Build + Event programme at the docket numbers; 36766 and 36768
   confirmed as recorded (Event); service note 24492's 30 m relocation on the reviewed evidence.
2. cj764Fencing reads the event week as done on the ruling (fenceBuildClosed1181), as v11.59 reads an ended week: its leftover
   programme quantities leave the forecast; the demob programme stays.
3. The fencing money card says what the remaining forecast now is.
4. DATA.broadcast: each turn in turns_changes.json whose take is in takes/takes.json is re-voiced (same voice, flow and mix);
   its old take leaves the media table, the new one comes in; manifest digest. Turns without a take keep their v11.79 line
   and take, untouched.
5. Footer -> v11.81. No record, servicing, crew-card bundle, tracker or printed-code change.

    python3 patch_v1181.py page.html      (in place, on live v11.79, or Codex's v11.80 if it is live first)
"""
import hashlib, json, re, shutil, subprocess, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
STAMP = '2026-10-24-complete'
FOOTS = ["+' · v11.79'; /* v8.19 release922", "+' · v11.80'; /* v8.19 release922"]
FOOT_NEW = "+' · v11.81'; /* v8.19 release922"
MAX_MEDIA_FILES = 2000
PAST_OLD = 'const past = !!(w.end && w.end < today);'
PAST_NEW = ("const past = !!(w.end && w.end < today) || (typeof fenceBuildClosed1181 === 'function' && fenceBuildClosed1181(w, today)); "
            "/* v11.81 - the build closed at the docket numbers on the project manager's ruling of 24 Oct 2026: the event week is done */")
WORDS = [
 ("details:'Recorded work at customer rates; remaining programme at customer rates.'",
  "details:'Recorded work at customer rates. The build closed at the docket numbers on the project manager’s ruling of 24 Oct 2026; what remains is the demob programme still to come, at customer rates.'"),
 ("Recorded docket and green-book quantities at supplier rates. Forecast remaining is programme work not yet docketed. These figures are not payment confirmations.",
  "Recorded docket and green-book quantities at supplier rates. The build closed at the docket numbers on the project manager’s ruling of 24 Oct 2026; forecast remaining is the demob programme still to come. These figures are not payment confirmations."),
 ("fenceOk ? 'Docket quantities meet dated programme'",
  "fenceOk ? (P.fenceLines.some(l => l.closedBuild1181) ? 'Build complete at the docket numbers' : 'Docket quantities meet dated programme')"),
 ("""l.planned == null ? '—' : '<span class="chip ok">none</span>'}</td></tr>`).join('')}""",
  """l.planned == null ? '—' : l.closedBuild1181 ? '<span class="chip ok" title="' + esc('Build complete at the docket numbers (the project manager, 24 Oct 2026): ' + fmtQty(l.closedBuild1181.behind, l.unit) + ' of the programme was never docketed and is not carried') + '">none · build complete</span>' : '<span class="chip ok">none</span>'}</td></tr>`).join('')}"""),
]


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
    if any(t.get('revoiced') == STAMP for t in B['turns']): raise ValueError('v11.81 broadcast already applied')
    changes = {c['slot']: c for c in json.loads((HERE / 'turns_changes.json').read_text(encoding='utf-8'))['turns'] if c['slot'] in picks}
    if set(changes) != set(picks): raise ValueError('a take has no line in turns_changes.json')
    takes = HERE / 'takes'; out_dir = Path(page_path).resolve().parent
    media_dir = out_dir / 'media_v1181'; media_dir.mkdir(exist_ok=True)
    rest = json.dumps({k: v for k, v in obj.items() if k not in ('broadcast', 'media')}, ensure_ascii=False)
    gone, added = [], {}
    for t in B['turns']:
        c = changes.get(t['slot'])
        if not c: continue
        if t['text'] != c['old'] or t['scene'] != c['scene']: raise ValueError('turn %d on the page is not the v11.79 line' % t['slot'])
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
    B['revision'] += (' Revised 24 Oct 2026 (v11.81): turn%s %s re-voiced with the build’s final figures, the build closed at the docket numbers'
                      ' on the project manager’s ruling of 24 Oct 2026.') % ('' if len(slots) == 1 else 's', ', '.join(str(s) for s in slots))
    assets = sorted([dict(sorted(a.items())) for a in obj['media'].values()], key=lambda a: a['file'])
    if len(assets) > MAX_MEDIA_FILES: raise ValueError('%d media files: the service takes at most %d' % (len(assets), MAX_MEDIA_FILES))
    digest = hashlib.sha256(canonical({'schema': 'gc500-media-v1', 'assets': assets}).encode('utf-8')).hexdigest()
    obj['hostedMedia']['manifest'] = digest
    (out_dir / 'media_manifest_v1181.json').write_text(json.dumps({'schema': 'gc500-media-v1', 'sha256': digest, 'assets': assets}, indent=1))
    (out_dir / 'broadcast_v1181.json').write_text(json.dumps(B, ensure_ascii=False, indent=1))
    text = text[:i] + 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';' + text[j:]
    print('broadcast: turns %s re-voiced; %d takes in, %d out; media %d files, manifest %s; body %.1f s + loop %.1f s'
          % (slots, len(added), len(gone), len(assets), digest[:12], body_s, loop_s))
    return text, slots


def patch(text, page_path):
    foot = [f for f in FOOTS if text.count(f) == 1]
    if len(foot) != 1: raise ValueError('v11.81 is built on the live v11.79 (or v11.80) page')
    if 'id="complete1181-script"' in text: raise ValueError('v11.81 already applied')
    for needle in ('<script id="progress1163-script">', 'window.DATA1163', 'function cj764Fencing()', 'FencingProgress1104=api'):
        if needle not in text: raise ValueError('the page lacks ' + needle)
    data = json.loads((HERE / 'data_v1181.json').read_text(encoding='utf-8'))
    blob = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    block = (HERE / 'complete1181.js').read_text(encoding='utf-8')
    if '</script' in block.lower(): raise ValueError('the block would close its own script')
    text = rep(text, '<script id="steady1143-script">', '<script id="complete1181-script">\nwindow.DATA1181 = ' + blob + ';\n' + block + '\n</script>\n<script id="steady1143-script">',
               'complete block before steady1143', 'page')
    if text.index('<script id="complete1181-script">') < text.index('<script id="progress1163-script">'): raise ValueError('the block must follow v11.63')
    text = rep(text, PAST_OLD, PAST_NEW, 'cj764Fencing event week done on the ruling', 'page')
    for a, b in WORDS: text = rep(text, a, b, 'fencing words: ' + a[:40], 'page')
    text, slots = broadcast(text, page_path)
    text = rep(text, foot[0], FOOT_NEW, 'release footer', 'page')
    for needle, n in [(FOOT_NEW, 1), ('<script id="complete1181-script">', 1), ('fenceBuildClosed1181(w, today)', 1), ('the project manager’s ruling of 24 Oct 2026', 2 + (1 if slots else 0))]:
        if text.count(needle) < n or (needle != 'the project manager’s ruling of 24 Oct 2026' and text.count(needle) != n):
            raise ValueError('v11.81 did not land cleanly: ' + needle + ' x' + str(text.count(needle)))
    print('v11.81 on %s: build closed at the docket numbers; 2 CCB reviews + 1 relocation; broadcast turns %s; footer -> v11.81' % (foot[0][4:10], slots or 'none'))
    return text


if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text(encoding='utf-8'), page), encoding='utf-8')
