"""Author: Andrew Fisher. v11.76 - find it on the map, picture it and send it.

Andrew, 24 Oct 2026: "In maps i want to search for a asset or a refernce no. Or gate no or vms no or stand no and take me pics
of location on maps and i want a send to button also so i can send to phone".

find1176_src.js (see its head) and find1176.css, as the last block of the page so its finder wrappers sit over every earlier
one; the footer v11.75 -> v11.76. The twenty grandstands are the D001 sheet's own markers tagged circuit_sector (S01 to S25
and S22A, the label on each drawn stand), each placed through the master plan's registration: the affine that carries every
MASTER_LAYERS point on the main sheet from its sheet place to its position (fitted here, the inset copies left out; the patch
refuses if any MASTER_LAYERS point sits more than 0.5 m off it). No record change.

    python3 patch_v1176.py page.html      (in place, on the live v11.75 page)
"""
import json, math, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

FOOT_OLD = "+' · v11.75'; /* v8.19 release922"
FOOT_NEW = "+' · v11.76'; /* v8.19 release922"


def json_const(text, name, end=';\n'):
    i = text.find(name)
    if i < 0: raise ValueError('no ' + name)
    i += len(name); j = text.find(end, i)
    return json.loads(text[i:j])


def solve3(rows, ys):
    """least squares for y = a*fx + b*fy + c (normal equations, 3x3)"""
    s = [[0.0] * 3 for _ in range(3)]; t = [0.0] * 3
    for r, y in zip(rows, ys):
        for a in range(3):
            t[a] += r[a] * y
            for b in range(3): s[a][b] += r[a] * r[b]
    m = [s[k] + [t[k]] for k in range(3)]
    for c in range(3):
        p = max(range(c, 3), key=lambda k: abs(m[k][c])); m[c], m[p] = m[p], m[c]
        for k in range(3):
            if k != c:
                f = m[k][c] / m[c][c]
                m[k] = [x - f * y for x, y in zip(m[k], m[c])]
    return [m[k][3] / m[k][k] for k in range(3)]


def stands(text):
    layers = json_const(text, 'const MASTER_LAYERS = ')
    main = [l for l in layers if not (l['fx'] > 0.62 and l['fy'] > 0.5)]  # the Cypress car park inset copy is its own frame
    rows = [(l['fx'], l['fy'], 1.0) for l in main]
    clat = solve3(rows, [l['ll'][0] for l in main]); clon = solve3(rows, [l['ll'][1] for l in main])
    mlat, mlon = 111320.0, 111320.0 * math.cos(math.radians(-27.99))
    worst = max(math.hypot((clat[0] * l['fx'] + clat[1] * l['fy'] + clat[2] - l['ll'][0]) * mlat,
                           (clon[0] * l['fx'] + clon[1] * l['fy'] + clon[2] - l['ll'][1]) * mlon) for l in main)
    if worst > 0.5: raise ValueError('the master registration does not fit MASTER_LAYERS (%.2f m)' % worst)
    i = text.find('const DATA = '); j = text.find('\n', i)
    data = json.loads(text[i + len('const DATA = '):j].rstrip(';'))
    d1 = [s for s in data['sheets'] if s.get('key') == 'D001']
    if len(d1) != 1: raise ValueError('expected one D001 sheet')
    out = []
    for m in d1[0].get('markers', []):
        if m.get('kind') != 'circuit_sector': continue
        face = str(m['label']).strip().upper()
        if not face.startswith('S'): continue
        fx, fy = float(m['fx']), float(m['fy'])
        if fx > 0.62 and fy > 0.5: raise ValueError(face + ' sits in the inset')
        out.append({'face': face, 'fx': round(fx, 5), 'fy': round(fy, 5),
                    'lat': round(clat[0] * fx + clat[1] * fy + clat[2], 6), 'lon': round(clon[0] * fx + clon[1] * fy + clon[2], 6)})
    out.sort(key=lambda s: (int(''.join(ch for ch in s['face'] if ch.isdigit())), s['face']))
    if len(out) != 20 or len({s['face'] for s in out}) != 20: raise ValueError('expected twenty distinct grandstands, got %d' % len(out))
    return out, worst, clat, clon


def patch(text):
    if FOOT_OLD not in text: raise ValueError('v11.76 is built on the live v11.75 page')
    if 'id="find1176-script"' in text: raise ValueError('v11.76 already applied')
    for need in ('id="gates1156-script"', 'W.SatMap1141 = ', 'function finderMatches', 'function mms757Picture', 'function sms777Submission'):
        if need not in text: raise ValueError('the base page lacks ' + need)
    S, worst, clat, clon = stands(text)
    src = (HERE / 'find1176_src.js').read_text(encoding='utf-8').strip()
    if src.count('__STANDS__') != 1: raise ValueError('module placeholder')
    src = src.replace('__STANDS__', json.dumps(S, separators=(',', ':')))
    css = (HERE / 'find1176.css').read_text(encoding='utf-8').strip()
    block = '<style id="find1176-style">\n' + css + '\n</style>\n<script id="find1176-script">\n' + src + '\n</script>\n</body>'
    at = text.rfind('</body>')
    if at < 0: raise ValueError('no </body>')
    text = text[:at] + block + text[at + len('</body>'):]
    text = rep(text, FOOT_OLD, FOOT_NEW, 'release footer', 'page')
    for needle, n in [(FOOT_NEW, 1), ('id="find1176-script"', 1), ('id="find1176-style"', 1), ('W.Find1176 = ', 1)]:
        if text.count(needle) != n: raise ValueError('v11.76 did not land cleanly: ' + needle + ' x' + str(text.count(needle)))
    (HERE / 'stands1176.json').write_text(json.dumps({'source': 'D001 sheet markers tagged circuit_sector, through the MASTER_LAYERS registration',
        'registration_worst_m': round(worst, 3), 'lat_coef': clat, 'lon_coef': clon, 'stands': S}, indent=1))
    print('v11.76: %d grandstands (registration worst %.2f m): %s' % (len(S), worst, ', '.join(s['face'] for s in S)))
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1176 applied: find it on the map, picture it and send it; footer v11.75 -> v11.76')
