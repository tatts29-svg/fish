"""Author: Andrew Fisher. v11.11 - the race-day broadcast, redone from scratch on the finished record.

Andrew, 22 Oct 2026, the day before the first race day: "We want to redo the broadcast. From scratch as there is a lot of
data. But we want to broadcast it as everything is done and complete. We mention everyone's names. As it's the team that
made it happen. We have all records of what happened and when. Even all the weather records ... this now becomes the
showcase for the team to watch and listen to on the race days."

The programme: 33 turns in the GC500 Race Caller voice (his designed ElevenLabs voice, flow Qc1iMoJTLhlFZqKutDwx,
eleven_v3, one take a turn), written from the record as it stood at 05:00 AEST 22 Oct 2026 - SCRIPT.md beside this
file carries every figure and where it came from. Each take has the broadcast EQ (90 Hz high-pass, +3 dB presence,
gentle compression), the circuit bed about 17 dB under the voice, loudness-normalised to -16 LUFS, mono 96 kbps MP3.
A slot's length is its mixed take's measured length. The 35 takes of the September programme leave the page and the
media manifest; nothing else about the media changes.

Each turn names the scene it speaks over (turns.json), so the Crew Showcase programme is rebuilt from that map rather
than from section numbers: the welcome (turns 1-2) plays once, the body runs 3-32, the loop opener (33) brings the
programme back to turn 3 while Loop is on. Every press of Broadcast starts at the welcome. 24 of the Showcase's 25
scenes are spoken; the kilometre card (fence_length1090) has no words of its own and the deck still shows it outside
the broadcast. The transcript on the page follows the v5.97 rule and says "the project manager" where the take says
the name.

Media: the 33 files are written beside the page as media_v1111/<sha256>.mp3 with media_manifest_v1111.json, for
upload_media1111.py to put on the service BEFORE the page goes up (the service refuses a page whose manifest it does
not hold). Footer v11.10 -> v11.11.

    python3 patch_v1111.py page.html      (in place, after patch_v1110.py on the live v11.09 page)
"""
import hashlib, json, shutil, subprocess, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

FLOW = 'Qc1iMoJTLhlFZqKutDwx'
VOICE = 'GC500 Race Caller'
# section numbers keep the base page's shape (welcome, team, install, fencing, effort, weather, finish, loop)
SECTION = {1: (1, 2), 2: (3, 5), 3: (6, 15), 4: (16, 23), 5: (24, 25), 6: (26, 27), 7: (28, 31), 8: (32, 33)}
# the scene each turn speaks over; turns.json is the script, this is the only change to its map
SCENE_OVERRIDE = {12: 'equipment', 28: 'complete', 29: 'site'}
# The transcript on the page follows the v5.97 rule (no "Andrew Fisher" in the page's own prose: the toolchain's scrubber
# turns the name into "the project manager", as it did for the September programme's turns 3 and 29). The take says the
# name; turn 3's transcript is written so the scrubbed line still reads cleanly.
TRANSCRIPT = {3: ('the project manager, Andrew Fisher!', 'Andrew Fisher!')}

MODULE = r"""<script>
/* Author: Andrew Fisher. v11.11 - the race-day programme: each turn plays over the scene it names. */
(function(root){
'use strict';
const api=root.CrewShowcase1090;
if(!api||!api.broadcast||typeof bcTurns!=='function'||typeof bcStart!=='function'||typeof SHOW_ORDER==='undefined')return;
const spoken=((DATA.broadcast||{}).turns||[]).filter(t=>t&&t.scene&&SHOW_ORDER.includes(t.scene)&&Number.isFinite(t.slot)).slice().sort((a,b)=>a.slot-b.slot);
if(!spoken.length)return;
const body=spoken.filter(t=>!t.loop),loop=spoken.filter(t=>t.loop),seq=body.concat(loop),map={},next={};
/* after the loop opener the programme carries on at the first turn after the welcome, never the welcome again */
const rejoin=(body[2]||body[0]).slot;
seq.forEach(t=>{map[t.slot]=t.scene;});
seq.forEach((t,i)=>{next[t.slot]=seq[i+1]?seq[i+1].slot:rejoin;});
/* CrewShowcase1090 reads its programme object by reference: bcTurns, bcScenes, bcNextSlot and the scene guard all follow this */
Object.assign(api.broadcast,{turns:seq.map(t=>Object.assign({},t)),map,next,first:body[0].slot,bodyLast:body[body.length-1].slot,loopFirst:loop[0]?loop[0].slot:undefined});
const startBefore=bcStart;
bcStart=function(){if(typeof BC!=='undefined')BC.ran=0;return startBefore.apply(this,arguments);};
root.RaceDayBroadcast1111={turns:seq.length,scenes:Object.keys(map).map(k=>map[k]).filter((v,i,a)=>a.indexOf(v)===i).length,map,next,rejoin};
})(window);
</script>
</body>"""


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
    if "+' · v11.10'; /* v8.19 release922" not in text: raise ValueError('v11.11 is built on the v11.10 page (apply patch_v1110.py first)')
    i = text.find('const DATA = '); j = text.find('\n', i); line = text[i:j]
    if i < 0 or not line.endswith(';'): raise ValueError('no DATA line')
    obj = json.loads(line[len('const DATA = '):-1])
    if json.dumps(obj, ensure_ascii=False, separators=(',', ':')) != line[len('const DATA = '):-1]: raise ValueError('DATA does not round-trip')
    if obj['broadcast'].get('schema') == 'gc500-broadcast-v2': raise ValueError('v11.11 already applied')

    script = json.loads((HERE / 'turns.json').read_text(encoding='utf-8'))
    takes = HERE / 'takes'
    out_dir = Path(page_path).resolve().parent
    media_dir = out_dir / 'media_v1111'; media_dir.mkdir(exist_ok=True)

    rest = json.dumps({k: v for k, v in obj.items() if k not in ('broadcast', 'media')}, ensure_ascii=False)
    old = [t['sha256'] for t in obj['broadcast']['turns'] if t.get('sha256')]
    for sha in old:
        if sha in rest or sha in text[:i] or sha in text[j:]: raise ValueError('old take %s is used elsewhere on the page' % sha[:12])
        obj['media'].pop(sha, None)

    turns, added = [], {}
    for t in script['turns']:
        slot = int(t['slot']); src = takes / ('turn%02d.mp3' % slot)
        raw = src.read_bytes(); sha = hashlib.sha256(raw).hexdigest(); fn = sha + '.mp3'
        dst = media_dir / fn
        if not dst.exists(): shutil.copyfile(src, dst)
        secs = probe_seconds(src)
        scene = SCENE_OVERRIDE.get(slot, t['scene'])
        words = t['text']
        if slot in TRANSCRIPT:
            a, b = TRANSCRIPT[slot]
            if words.count(a) != 1: raise ValueError('turn %d transcript marker' % slot)
            words = words.replace(a, b)
        turns.append({'slot': slot, 'turn': str(slot), 'role': 'LEAD', 'section': section_of(slot), 'voice': VOICE, 'secs': secs,
                      'text': words, 'holds': None, 'loop': bool(t.get('loop')), 'standin': False, 'scene': scene,
                      'audio': {'media': sha}, 'bytes': len(raw), 'sha256': sha, 'measured_s': secs})
        added[sha] = {'bytes': len(raw), 'file': fn, 'scope': 'view', 'sha256': sha, 'type': 'audio/mpeg'}
    if len(turns) != 33 or len(added) != 33: raise ValueError('expected 33 distinct takes, got %d/%d' % (len(turns), len(added)))
    for sha, a in added.items(): obj['media'][sha] = {'file': a['file'], 'sha256': a['sha256'], 'type': a['type'], 'bytes': a['bytes'], 'scope': a['scope']}

    body_s = round(sum(t['secs'] for t in turns if not t['loop']), 2); loop_s = round(sum(t['secs'] for t in turns if t['loop']), 2)
    obj['broadcast'] = {
        'schema': 'gc500-broadcast-v2', 'author': 'Andrew Fisher', 'flow': FLOW, 'model': script.get('model', 'eleven_v3'), 'voice': VOICE,
        'revision': ('Race-day programme, 22 Oct 2026 - redone from scratch on the finished record, the evening before the first race day: '
                     '33 turns in the GC500 Race Caller voice (ElevenLabs flow ' + FLOW + ', eleven_v3, one take a turn), every figure from the '
                     'record as it stood at 05:00 AEST 22 Oct 2026 (SCRIPT.md in the v11.11 release folder names each source). Each take: broadcast EQ, '
                     'the circuit bed about 17 dB under the voice, loudness-normalised to -16 LUFS, mono 96 kbps. Each turn names the scene it speaks over; '
                     'the welcome (1-2) plays once, the body runs 3-32, the loop opener (33) rejoins at 3. The September programme (35 takes) is retired.'),
        'note': 'The figures are spoken as they stood on the record at 05:00 AEST 22 Oct 2026; the scene behind each turn shows the live record.',
        'turns': turns,
        'about': {'have': 33, 'of': 33, 'his_takes': 33, 'standins': 0, 'standin_is': None, 'body_s': body_s, 'loop_s': loop_s, 'missing': [], 'rejected': [],
                  'encoded': 'mono, broadcast EQ, circuit bed, loudness-normalised -16 LUFS, 96k MP3',
                  'stated': 'Every turn carries its own take over the scene it names; 24 of the 25 Showcase scenes are spoken (the kilometre card is shown outside the broadcast only).'}}

    assets = sorted([dict(sorted(m.items())) for m in obj['media'].values()], key=lambda a: a['file'])
    digest = hashlib.sha256(canonical({'schema': 'gc500-media-v1', 'assets': assets}).encode('utf-8')).hexdigest()
    obj['hostedMedia']['manifest'] = digest
    (out_dir / 'media_manifest_v1111.json').write_text(json.dumps({'schema': 'gc500-media-v1', 'sha256': digest, 'assets': assets}, indent=1))
    (out_dir / 'broadcast_v1111.json').write_text(json.dumps(obj['broadcast'], ensure_ascii=False, indent=1))

    text = text[:i] + 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';' + text[j:]
    at = text.rfind('</body>')
    if at < 0: raise ValueError('no </body>')
    text = text[:at] + MODULE + text[at + len('</body>'):]
    text = rep(text, "+' · v11.10'; /* v8.19 release922", "+' · v11.11'; /* v8.19 release922", 'release footer', 'page')
    print('v11.11: 33 takes in, %d old out, media %d files, manifest %s, body %.1f s + loop %.1f s' % (len(old), len(assets), digest[:12], body_s, loop_s))
    return text


if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text(encoding='utf-8'), page), encoding='utf-8')
