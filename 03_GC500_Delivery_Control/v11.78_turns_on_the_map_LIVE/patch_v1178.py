"""Author: Andrew Fisher. v11.78 - the turns on the map: find, picture and send a track turn.

Andrew, 24 Oct 2026: "Can we have the same function for turns the track has turns.. so when i get a mwssage to send someone to a
turn on on the track. I nead to send them to that area on track.. example where is turn 2".

Replaces the v11.76 find/send block (find1176-style / find1176-script, Claude's own) with find1178: the same module plus the fifteen
turns the master plan D001-26003-03 labels on the track, T1 to T15. Their places on the drawing are in turns_read.json (read at each
label); each is carried through the master registration exactly as the v11.76 stands are (patch_v1176.stands). Footer -> v11.78.
No record change.

    python3 patch_v1178.py page.html      (in place, on the live v11.76 page, or Codex's v11.77 if it is live first)
"""
import importlib.util, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

spec = importlib.util.spec_from_file_location('patch_v1176', HERE.parent / 'v11.76_find_send_maps_LIVE' / 'patch_v1176.py')
P1176 = importlib.util.module_from_spec(spec); spec.loader.exec_module(P1176)
FOOTS = ["+' · v11.76'; /* v8.19 release922", "+' · v11.77'; /* v8.19 release922"]
FOOT_NEW = "+' · v11.78'; /* v8.19 release922"


def turns(clat, clon):
    R = json.loads((HERE / 'turns_read.json').read_text())
    W, H = R['frame_px']; out = []
    for face, (x, y) in R['turns'].items():
        fx, fy = x / W, y / H
        if fx > 0.62 and fy > 0.5: raise ValueError(face + ' sits in the inset')
        out.append({'face': face, 'fx': round(fx, 5), 'fy': round(fy, 5),
                    'lat': round(clat[0] * fx + clat[1] * fy + clat[2], 6), 'lon': round(clon[0] * fx + clon[1] * fy + clon[2], 6)})
    out.sort(key=lambda t: int(t['face'][1:]))
    if [t['face'] for t in out] != ['T%d' % n for n in range(1, 16)]: raise ValueError('expected T1 to T15')
    return out


def patch(text):
    foot = [f for f in FOOTS if f in text]
    if len(foot) != 1: raise ValueError('v11.78 is built on the live v11.76 (or v11.77) page')
    if 'id="find1178-script"' in text: raise ValueError('v11.78 already applied')
    a = text.find('<style id="find1176-style">'); s0 = text.find('<script id="find1176-script">')
    if a < 0 or s0 < a: raise ValueError('the v11.76 find/send block is not on the page')
    b = text.find('</script>', s0) + len('</script>')
    if 'W.Find1176 = ' not in text[s0:b] or 'parseTurn' in text[s0:b]: raise ValueError('unexpected v11.76 block')
    S, worst, clat, clon = P1176.stands(text)
    T = turns(clat, clon)
    src = (HERE / 'find1178_src.js').read_text(encoding='utf-8').strip()
    for ph in ('__STANDS__', '__TURNS__'):
        if src.count(ph) != 1: raise ValueError('placeholder ' + ph)
    src = src.replace('__STANDS__', json.dumps(S, separators=(',', ':'))).replace('__TURNS__', json.dumps(T, separators=(',', ':')))
    css = (HERE / 'find1178.css').read_text(encoding='utf-8').strip()
    block = '<style id="find1178-style">\n' + css + '\n</style>\n<script id="find1178-script">\n' + src + '\n</script>'
    text = text[:a] + block + text[b:]
    text = rep(text, foot[0], FOOT_NEW, 'release footer', 'page')
    for needle, n in [(FOOT_NEW, 1), ('id="find1178-script"', 1), ('id="find1178-style"', 1), ('id="find1176-script"', 0), ('id="find1176-style"', 0), ('W.Find1176 = ', 1)]:
        if text.count(needle) != n: raise ValueError('v11.78 did not land cleanly: ' + needle + ' x' + str(text.count(needle)))
    (HERE / 'turns1178.json').write_text(json.dumps({'source': 'turns_read.json through the MASTER_LAYERS registration (patch_v1176.stands)', 'registration_worst_m': round(worst, 3), 'turns': T}, indent=1))
    print('v11.78: %d turns, %d stands (registration worst %.2f m); base footer %s' % (len(T), len(S), worst, foot[0][4:10]))
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1178 applied: the turns on the map; footer -> v11.78')
