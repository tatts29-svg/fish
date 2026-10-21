"""Author: Andrew Fisher. v11.12 - the race call speaks as complete; the servicing cards glow for the big screen.

Andrew, 22 Oct 2026 (after v11.11): "Can we talk like everything is complete and talk in numbers that everything is
complete. Fencing complete as per schedule and we don't include the demob. Barriers all done. We mention VMS boards there
is 24 in total every one is towed around the track and set to location. So we talk as in everything is done so we don't
need to revisit this again." And: "I also want more glow on all cards in servicing. More glow pulsating in this area.
This will be on a big screen at night time so this will look amazing."

1. Eleven turns re-voiced in the same voice, flow and mix (turns.json beside this file is the whole script as it now
   stands; takes/turnNN.mp3 the eleven new mixed takes): 11 (24 boards, every one towed and set), 13 and 14 (311 barriers,
   every one placed, 100%), 15 (deliveries, every one landed), 17 (12,617 m of fence complete to the schedule), 18 and 19
   (panels, feet, blocks, clamps, braces; 135 vehicle and 34 pedestrian gates to the schedule), 20 (7.4 km of crowd-control
   barrier to the schedule), 21 (4.4 km of scrim, nearly a kilometre relocated; the stack-down line - demob - is gone),
   23 (20 km of fence and crowd control complete to the schedule), 28 (barriers every one placed, all 24 boards set, fence
   and crowd control complete). The other 22 takes are v11.11's. The eleven v11.11 takes they replace leave the page and
   the media manifest; media_v1112/ and media_manifest_v1112.json are written beside the build for upload_media1112.py.
2. Servicing: every area card carries its own colour as a pulsing glow (border, halo and inner light), the done cards
   brighter and faster; the area outlines on the map breathe in their colour; the area accordions below glow too. The
   paused and reduced-motion rules the servicing block already has keep applying (the pulse stops when the tab is off,
   paused, or the device asks for less motion). Styles only: no tracker data, code, QR or signature changes.
3. Footer v11.11 -> v11.12.

    python3 patch_v1112.py page.html      (in place, on the live v11.11 page)
"""
import hashlib, json, shutil, subprocess, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = '9aee0e49460de11ba3758370308013bf1eb8833bb9f43468252ef90e2cd8a5d9'
REVOICED = [11, 13, 14, 15, 17, 18, 19, 20, 21, 23, 28]
TRANSCRIPT = {3: ('the project manager, Andrew Fisher!', 'Andrew Fisher!')}   # v11.11's transcript rule, unchanged

STYLE = r"""<style id="svc1112-glow">
/* Author: Andrew Fisher. v11.12 - servicing on the big screen at night: every area card glows and pulses in its own colour. */
#svc1067 .svc1099 .svc1099-area{position:relative;isolation:isolate;border-color:color-mix(in srgb,var(--area-color) 70%,#3f5b69);box-shadow:0 0 18px color-mix(in srgb,var(--area-color) 42%,transparent),0 0 2px color-mix(in srgb,var(--area-color) 60%,transparent),inset 0 1px 0 #ffffff12}
#svc1067 .svc1099 .svc1099-area:before{content:'';position:absolute;inset:0;border:2px solid var(--area-color);border-radius:8px;box-shadow:0 0 26px color-mix(in srgb,var(--area-color) 75%,transparent),0 0 60px color-mix(in srgb,var(--area-color) 30%,transparent),inset 0 0 26px color-mix(in srgb,var(--area-color) 32%,transparent);opacity:.45;pointer-events:none;z-index:-1;animation:svc1112-pulse 2.6s ease-in-out infinite}
#svc1067 .svc1099 .svc1099-area:nth-child(3n+2):before{animation-delay:-.9s}
#svc1067 .svc1099 .svc1099-area:nth-child(3n):before{animation-delay:-1.7s}
#svc1067 .svc1099 .svc1099-area .svc1106-area-number{box-shadow:0 0 14px color-mix(in srgb,var(--area-color) 80%,transparent)}
#svc1067 .svc1099 .svc1099-area .svc1102-lights{border-color:color-mix(in srgb,var(--area-color) 55%,#3f5b69);box-shadow:inset 0 3px 8px #0009,0 0 12px color-mix(in srgb,var(--area-color) 30%,transparent)}
#svc1067 .svc1099 .svc1099-area.done{box-shadow:0 0 30px color-mix(in srgb,var(--area-color) 70%,transparent),0 0 4px color-mix(in srgb,var(--area-color) 90%,transparent),inset 0 0 24px color-mix(in srgb,var(--area-color) 22%,transparent)}
#svc1067 .svc1099 .svc1099-area.done:before{border-width:3px;box-shadow:0 0 40px color-mix(in srgb,var(--area-color) 95%,transparent),0 0 90px color-mix(in srgb,var(--area-color) 45%,transparent),inset 0 0 34px color-mix(in srgb,var(--area-color) 45%,transparent);opacity:.6;animation:svc1112-pulse-done 1.9s ease-in-out infinite}
#svc1067 .svc1099 .svc1099-area[aria-pressed=true]:before{opacity:.9}
#svc1067 .svc1099-overall{box-shadow:0 0 28px #ff8a3240,inset 0 0 30px #ff8a3212;border-color:#ff8a3299}
#svc1067 .svc1100-region .svc1100-region-glow{stroke-opacity:.32;stroke-width:calc(16px * var(--svc-stroke-scale,1));animation:svc1112-breathe 3.2s ease-in-out infinite}
#svc1067 .svc1100-region.done .svc1100-region-glow{stroke-opacity:.9;stroke-width:calc(22px * var(--svc-stroke-scale,1));animation:svc1112-breathe 2.2s ease-in-out infinite}
#svc1067 .svc1100-region .svc1100-region-line{stroke-opacity:.95}
#svc1067 details.svc-area{border-color:color-mix(in srgb,var(--area-color,#3f5b69) 60%,#3f5b69);box-shadow:0 0 16px color-mix(in srgb,var(--area-color,#3f5b69) 35%,transparent),inset 0 0 14px color-mix(in srgb,var(--area-color,#3f5b69) 10%,transparent);animation:svc1112-card-breathe 3.4s ease-in-out infinite}
#svc1067 details.svc-area:nth-child(2n){animation-delay:-1.6s}
#svc1067 details.svc-area.done{border-color:var(--area-color,#3ba979);box-shadow:0 0 26px color-mix(in srgb,var(--area-color,#3ba979) 65%,transparent),inset 0 0 18px color-mix(in srgb,var(--area-color,#3ba979) 18%,transparent)}
#svc1067 .svc1099-area-badge{box-shadow:0 0 14px color-mix(in srgb,var(--area-color) 75%,transparent),0 2px 6px #0006}
@keyframes svc1112-pulse{0%,100%{opacity:.32}50%{opacity:.85}}
@keyframes svc1112-pulse-done{0%,100%{opacity:.5}50%{opacity:1}}
@keyframes svc1112-breathe{0%,100%{stroke-opacity:.22}50%{stroke-opacity:.7}}
@keyframes svc1112-card-breathe{0%,100%{filter:brightness(1)}50%{filter:brightness(1.18)}}
#pane-servicing.svc1104-paused #svc1067 .svc1099-area:before,#pane-servicing:not(.on) #svc1067 .svc1099-area:before,#pane-servicing.svc1104-paused #svc1067 .svc1100-region-glow,#pane-servicing:not(.on) #svc1067 .svc1100-region-glow,#pane-servicing.svc1104-paused #svc1067 details.svc-area,#pane-servicing:not(.on) #svc1067 details.svc-area,#svc1067 .svc1099.paused .svc1099-area:before,#svc1067 .svc1100.paused .svc1100-region-glow{animation-play-state:paused!important}
@media(prefers-reduced-motion:reduce){#svc1067 .svc1099-area:before,#svc1067 .svc1100-region-glow,#svc1067 details.svc-area{animation:none!important}}
</style>
</body>"""


def canonical(v):
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)


def probe_seconds(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(p)],
                       capture_output=True, text=True, check=True)
    return round(float(r.stdout.strip()), 2)


def patch(text, page_path):
    if BASE_SHA256 and hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.12 requires the live v11.11 page ' + BASE_SHA256)
    i = text.find('const DATA = '); j = text.find('\n', i); line = text[i:j]
    obj = json.loads(line[len('const DATA = '):-1])
    if json.dumps(obj, ensure_ascii=False, separators=(',', ':')) != line[len('const DATA = '):-1]: raise ValueError('DATA does not round-trip')
    B = obj['broadcast']
    if B.get('schema') != 'gc500-broadcast-v2' or len(B['turns']) != 33: raise ValueError('the v11.11 programme is not on this page')
    if any(t.get('revoiced') for t in B['turns']): raise ValueError('v11.12 already applied')

    script = json.loads((HERE / 'turns.json').read_text(encoding='utf-8'))
    takes = HERE / 'takes'
    out_dir = Path(page_path).resolve().parent
    media_dir = out_dir / 'media_v1112'; media_dir.mkdir(exist_ok=True)
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
        t.update({'text': words, 'secs': secs, 'measured_s': secs, 'audio': {'media': sha}, 'bytes': len(raw), 'sha256': sha, 'revoiced': '2026-10-22'})
        added[sha] = {'bytes': len(raw), 'file': fn, 'scope': 'view', 'sha256': sha, 'type': 'audio/mpeg'}
    if len(added) != 11 or len(gone) != 11: raise ValueError('expected 11 takes in and 11 out, got %d/%d' % (len(added), len(gone)))
    for sha, a in added.items(): obj['media'][sha] = {'file': a['file'], 'sha256': a['sha256'], 'type': a['type'], 'bytes': a['bytes'], 'scope': a['scope']}

    body_s = round(sum(t['secs'] for t in B['turns'] if not t['loop']), 2); loop_s = round(sum(t['secs'] for t in B['turns'] if t['loop']), 2)
    B['about']['body_s'] = body_s; B['about']['loop_s'] = loop_s
    B['revision'] += (' Revised 22 Oct 2026 (v11.12): turns 11, 13, 14, 15, 17, 18, 19, 20, 21, 23 and 28 re-voiced in the same voice, flow and mix to '
                      'speak as complete - fence and crowd control to the schedule with no demob, 311 barriers every one placed, 24 boards every one towed and set.')
    B['note'] = 'The call speaks the job as complete: fence and crowd control to the schedule, barriers and boards all placed. The scene behind each turn shows the live record.'

    assets = sorted([dict(sorted(m.items())) for m in obj['media'].values()], key=lambda a: a['file'])
    digest = hashlib.sha256(canonical({'schema': 'gc500-media-v1', 'assets': assets}).encode('utf-8')).hexdigest()
    obj['hostedMedia']['manifest'] = digest
    (out_dir / 'media_manifest_v1112.json').write_text(json.dumps({'schema': 'gc500-media-v1', 'sha256': digest, 'assets': assets}, indent=1))
    (out_dir / 'broadcast_v1112.json').write_text(json.dumps(B, ensure_ascii=False, indent=1))

    text = text[:i] + 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';' + text[j:]
    if 'svc1112-glow' in text: raise ValueError('glow style already present')
    at = text.rfind('</body>')   # the page's last </body>: the style lands after every servicing style block, so its rules win ties
    if at < 0: raise ValueError('no </body>')
    text = text[:at] + STYLE + text[at + len('</body>'):]
    text = rep(text, "+' · v11.11'; /* v8.19 release922", "+' · v11.12'; /* v8.19 release922", 'release footer', 'page')
    print('v11.12: 11 takes in, 11 out, media %d files, manifest %s, body %.1f s + loop %.1f s' % (len(assets), digest[:12], body_s, loop_s))
    return text


if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text(encoding='utf-8'), page), encoding='utf-8')
