"""Author: Andrew Fisher. v13.01 - the Showcase reads race weekend.

The job is complete (demob under way), so the Showcase's 25 scenes now read the record as at race weekend, Fri 23 Oct 2026, whatever
day the page is opened: showScene(key, day) is wrapped to read every scene at that day (showRender and the crew-card refresh both go
through it). The scenes still read the live record - every figure is the record's own - only the day they are read at is fixed.
Fourteen race-call turns are re-voiced with the record's figures at that day (Showcase accuracy audit, 5 Nov 2026), in the same voice
(GC500 Race Caller), flow and mix as v11.65 and v11.83, two takes each, transcribed and every figure heard correctly (takes/picks.json):
2, 4, 20, 22, 24, 29, 30, 31, 32, 36, 37, 39, 41, 43 (turns_changes.json carries each old and new line and why). Fourteen takes out of
the media table, fourteen in; manifest digest; the programme note records the revision; footer -> v13.01. No record, servicing, crew
card, tracker or printed-code change.

    python3 patch_v1301.py page.html      (in place, on the live v13.00 page)
"""
import hashlib, json, shutil, subprocess, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
STAMP = '2026-11-05-raceweekend'
FOOT_OLD = "+' · v13.00'; /* v8.19 release922"
FOOT_NEW = "+' · v13.01'; /* v8.19 release922"
DAY = '2026-10-23'
SLOTS = [2, 4, 20, 22, 24, 29, 30, 31, 32, 36, 37, 39, 41, 43]
MAX_MEDIA_FILES = 2000
SCRIPT = '''<script id="showcase1301-script">
/* Author: Andrew Fisher. v13.01 - the job is complete, so the Showcase reads the record as at race weekend, Fri 23 Oct 2026, on every
   scene whatever the day the page is opened. The scenes still read the live record; only the day they are read at is fixed. The race
   call, playback and every other tab are unchanged. */
(function(){
 if (typeof showScene !== 'function') return;
 var DAY = '%s', previous = showScene;
 showScene = function(key, day){ return previous(key, DAY); };
 showScene.raceWeekend1301 = DAY;
 showScene.unpinned1301 = previous;
})();
</script>
''' % DAY


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
    if not picks: raise ValueError('takes/takes.json is missing - mix the takes first (mix1301.py)')
    i = text.find('const DATA = '); j = text.find('\n', i); line = text[i:j]
    obj = json.loads(line[len('const DATA = '):-1])
    if json.dumps(obj, ensure_ascii=False, separators=(',', ':')) != line[len('const DATA = '):-1]: raise ValueError('DATA does not round-trip')
    B = obj['broadcast']
    if B.get('schema') != 'gc500-broadcast-v2' or len(B['turns']) != 51: raise ValueError('the v11.65 programme is not on this page')
    if any(t.get('revoiced') == STAMP for t in B['turns']): raise ValueError('v13.01 already applied')
    changes = {c['slot']: c for c in json.loads((HERE / 'turns_changes.json').read_text(encoding='utf-8'))['turns'] if c['slot'] in picks}
    if set(changes) != set(picks): raise ValueError('a take has no line in turns_changes.json')
    takes = HERE / 'takes'; out_dir = Path(page_path).resolve().parent
    media_dir = out_dir / 'media_v1301'; media_dir.mkdir(exist_ok=True)
    rest = json.dumps({k: v for k, v in obj.items() if k not in ('broadcast', 'media')}, ensure_ascii=False)
    gone, added = [], {}
    for t in B['turns']:
        c = changes.get(t['slot'])
        if not c: continue
        if t['text'] != c['old'] or t['scene'] != c['scene']: raise ValueError('turn %d on the page is not the v13.00 line' % t['slot'])
        src = takes / ('turn%02d.mp3' % t['slot']); raw = src.read_bytes(); sha = hashlib.sha256(raw).hexdigest(); fn = sha + '.mp3'
        if picks[t['slot']]['sha256'] != sha or picks[t['slot']]['bytes'] != len(raw): raise ValueError('turn %d take differs from takes.json' % t['slot'])
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
    B['revision'] += (' Revised 5 Nov 2026 (v13.01): the scenes read the record as at race weekend, Fri 23 Oct 2026; turns %s re-voiced with the'
                      ' record’s figures at that day - 728 pieces of equipment on site (733 on the record), 375 hours for the project manager,'
                      ' 15 generators, 43 labour notes over 31 days, 46 dockets in event week, 8,239 feet, 7,981 clamps, 1,428 braces, 278 gate'
                      ' wheels, 2,913 crowd-control barriers, ten wet mornings of ten, gusts of 50 km/h or more on 16 days, 48 pre-starts filed,'
                      ' 24 references on 16 Oct; Turn 4 and Gate 2 named on the barrier runs.') % ', '.join(str(s) for s in slots)
    assets = sorted([dict(sorted(a.items())) for a in obj['media'].values()], key=lambda a: a['file'])
    if len(assets) > MAX_MEDIA_FILES: raise ValueError('%d media files: the service takes at most %d' % (len(assets), MAX_MEDIA_FILES))
    digest = hashlib.sha256(canonical({'schema': 'gc500-media-v1', 'assets': assets}).encode('utf-8')).hexdigest()
    obj['hostedMedia']['manifest'] = digest
    (out_dir / 'media_manifest_v1301.json').write_text(json.dumps({'schema': 'gc500-media-v1', 'sha256': digest, 'assets': assets}, indent=1))
    (out_dir / 'broadcast_v1301.json').write_text(json.dumps(B, ensure_ascii=False, indent=1))
    text = text[:i] + 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';' + text[j:]
    print('broadcast: turns %s re-voiced; %d takes in, %d out; media %d files, manifest %s; body %.1f s + loop %.1f s'
          % (slots, len(added), len(gone), len(assets), digest[:12], body_s, loop_s))
    return text, slots


def patch(text, page_path):
    if text.count(FOOT_OLD) != 1: raise ValueError('v13.01 is built on the live v13.00 page')
    if 'id="fencing1289-script"' not in text or 'root.ShowcaseActuals1089=api;' not in text: raise ValueError('v12.89 and the v10.89 Showcase actuals must be on this page')
    if 'showcase1301-script' in text: raise ValueError('v13.01 already applied')
    text, slots = broadcast(text, page_path)
    if slots != SLOTS: raise ValueError('expected turns %s, got %s' % (SLOTS, slots))
    text = rep(text, '</script>\n</body>\n</html>', '</script>\n' + SCRIPT + '</body>\n</html>', 'showcase pin', 'page')
    text = rep(text, FOOT_OLD, FOOT_NEW, 'release footer', 'page')
    if text.count(FOOT_NEW) != 1 or text.count('id="showcase1301-script"') != 1: raise ValueError('v13.01 did not land')
    print('v13.01 on v13.00: scenes read %s; turns %s re-voiced; footer -> v13.01' % (DAY, slots))
    return text


if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text(encoding='utf-8'), page), encoding='utf-8')
