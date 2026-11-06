"""Author: Andrew Fisher. The water barriers picture, v10.34 (Andrew, 16 Oct 2026: "Water barriers need their picture done
for the today data plate"). Every group card on Today carries a rendered picture of its equipment behind the figures
(v9.07); the Water barriers card v10.30 added had none. This gives it one, in the same style and the same way: one
WebP named by its SHA-256 in the page's media table, the card's id in the scene's ATLAS, and the media manifest hash
recomputed so the service accepts the page. The picture goes on the service BEFORE the page (upload_media1034.py), as
every hosted picture does. Nothing else in DATA changes. Footer v10.33 -> v10.34.

    python3 patch_v1034.py path/to/page.html   (after patch_v1033.py)
"""
import hashlib, json, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def canonical(value):
    if isinstance(value, list): return '[' + ','.join(canonical(x) for x in value) + ']'
    if isinstance(value, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(value[k]) for k in sorted(value)) + '}'
    return json.dumps(value, ensure_ascii=False)


def manifest_of(media):
    assets = sorted(({k: c[k] for k in ('bytes', 'file', 'scope', 'sha256', 'type')} for c in media.values()), key=lambda c: c['file'])
    body = {'schema': 'gc500-media-v1', 'assets': assets}
    return dict(body, sha256=hashlib.sha256(canonical(body).encode()).hexdigest())


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if "+ ' · v10.33'" not in html: sys.exit('patch_v1034: not the v10.33 line - wrong base (apply patch_v1033.py first)')
    desc = json.loads((HERE / 'plates1034.json').read_text(encoding='utf-8'))
    cells = desc['cells']
    if [c['id'] for c in cells] != ['barriers']: sys.exit('patch_v1034: expected the one barriers picture')
    # the DATA block, parsed and written back the one way that round-trips byte for byte
    start = html.index('const DATA = ') + len('const DATA = ')
    data, n = json.JSONDecoder().raw_decode(html[start:])
    end = start + n
    if json.dumps(data, ensure_ascii=False, separators=(',', ':')) != html[start:end]: sys.exit('patch_v1034: DATA does not round-trip')
    before = manifest_of(data['media'])
    if data['hostedMedia']['manifest'] != before['sha256']: sys.exit('patch_v1034: the page\'s media manifest hash is not the one this patch would compute - the manifest scheme has moved; stop')
    for c in cells:
        if c['type'] != 'image/webp' or c['scope'] != 'view' or c['file'] != c['sha256'] + '.webp': sys.exit('patch_v1034: bad picture descriptor')
        b = (HERE / 'assets' / c['file']).read_bytes()
        if len(b) != c['bytes'] or hashlib.sha256(b).hexdigest() != c['sha256']: sys.exit('patch_v1034: picture bytes do not match the descriptor')
        entry = {k: c[k] for k in ('file', 'sha256', 'type', 'bytes', 'scope')}
        if data['media'].get(c['sha256'], entry) != entry: sys.exit('patch_v1034: conflicting media entry')
        if 'barriers' in json.loads(re.search(r'const ATLAS = (\{[^\n]+\});', html)[1]): sys.exit('patch_v1034 refuses a repeat')
        data['media'][c['sha256']] = entry
    manifest = manifest_of(data['media'])
    data['hostedMedia']['manifest'] = manifest['sha256']
    html = html[:start] + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + html[end:]
    am = re.search(r'const ATLAS = (\{[^\n]+\});', html)
    atlas = json.loads(am[1]); atlas['barriers'] = cells[0]['sha256']
    html = rep(html, am[0], 'const ATLAS = ' + json.dumps(atlas, separators=(',', ':')) + ';', 'The scene atlas: the barriers picture', str(page))
    html = rep(html, "+ ' · v10.33'", "+ ' · v10.34'", 'Release footer', str(page))
    page.write_text(html, encoding='utf-8')
    (page.parent / 'media_manifest_v1034.json').write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print('patch_v1034 applied: the water barriers picture behind the Today card (media %s…, manifest %s… -> %s…); footer v10.33 -> v10.34'
          % (cells[0]['sha256'][:12], before['sha256'][:12], manifest['sha256'][:12]))


if __name__ == '__main__':
    main()
