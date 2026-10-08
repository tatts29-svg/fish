#!/usr/bin/env python3
"""Author: Andrew Fisher. A clearer panoramic Today plate; no record or calculation changes."""
import argparse, hashlib, json, re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

def canonical(value):
    if isinstance(value, list): return '[' + ','.join(canonical(x) for x in value) + ']'
    if isinstance(value, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(value[k]) for k in sorted(value)) + '}'
    return json.dumps(value, ensure_ascii=False)

def patch(text):
    for marker in ('where885-script', 'scene896-style', 'scene896-script', 'const Scene896 =', 'function progress881Model('):
        if text.count(marker) != 1: raise ValueError('v9.02 requires one intact ' + marker)
    if 'today902-style' in text: raise ValueError('v9.02 is already applied')
    marks = re.findall(r' · v(?:8\.99|9\.0[01])\b', text)
    if len(marks) != 1: raise ValueError('v9.02 requires one v8.99, v9.00 or v9.01 footer')
    text = rep(text, marks[0], ' · v9.02', 'release footer', 'page.html')
    data_match = re.search(r'const DATA = (\{.*?\});\n', text)
    if not data_match: raise ValueError('Missing DATA')
    data = json.loads(data_match[1])
    if json.dumps(data, ensure_ascii=False, separators=(',', ':')) != data_match[1]: raise ValueError('DATA does not round-trip exactly')
    image = json.loads((HERE / 'yard902.json').read_text())
    body = (HERE / 'assets' / image['file']).read_bytes()
    if image['id'] != 'yard' or image['type'] != 'image/webp' or image['scope'] != 'view': raise ValueError('Invalid yard asset')
    if hashlib.sha256(body).hexdigest() != image['sha256'] or image['file'] != image['sha256'] + '.webp' or len(body) != image['bytes']: raise ValueError('Yard asset hash/size mismatch')
    if data.get('hostedMedia', {}).get('schema') != 'gc500-media-v1': raise ValueError('Missing hosted media contract')
    descriptor = {k: image[k] for k in ('file', 'sha256', 'type', 'bytes', 'scope')}
    if data['media'].get(image['sha256'], descriptor) != descriptor: raise ValueError('Conflicting media descriptor')
    data['media'][image['sha256']] = descriptor
    assets = sorted(({k: item[k] for k in ('bytes', 'file', 'scope', 'sha256', 'type')} for item in data['media'].values()), key=lambda item:item['file'])
    manifest_body = {'schema':'gc500-media-v1', 'assets':assets}
    manifest = dict(manifest_body, sha256=hashlib.sha256(canonical(manifest_body).encode()).hexdigest())
    data['hostedMedia']['manifest'] = manifest['sha256']
    text = text[:data_match.start(1)] + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + text[data_match.end(1):]
    atlas_match = re.search(r'(const ATLAS = )(\{[^\n]+\})(;)', text[text.index('const Scene896 ='):])
    if not atlas_match: raise ValueError('Missing scene atlas')
    atlas = json.loads(atlas_match[2])
    if set(atlas) != {'yard','buildings','toilets','fencing','generators','lighting','vms','equipment'}: raise ValueError('Unexpected scene atlas')
    old_atlas = atlas_match[0]
    atlas['yard'] = image['sha256']
    text = rep(text, old_atlas, 'const ATLAS = ' + json.dumps(atlas, separators=(',', ':')) + ';', 'only yard atlas entry', 'page.html')
    text = rep(text, 'background-image:linear-gradient(#07171c8c,#07171c8c),url(', 'background-image:linear-gradient(var(--s902-yard-shade,#07171c8c),var(--s902-yard-shade,#07171c8c)),url(', 'screen-only yard shading', 'page.html')
    css = (HERE / 'today902.css').read_text()
    if '</style' in css: raise ValueError('Unexpected style close')
    head_end = text.index('</head>')
    anchor = text[head_end - 160:head_end + 7]
    text = rep(text, anchor, anchor[:-7] + '<style id="today902-style">\n' + css + '\n</style>\n</head>', 'Today presentation', 'page.html')
    return text, manifest

if __name__ == '__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('base',type=Path); parser.add_argument('output',type=Path,nargs='?'); args=parser.parse_args()
    result, manifest=patch(args.base.read_text()); output=args.output or args.base
    output.write_text(result); (output.parent/'media_manifest_v902.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')))
    print('v9.02 prepared: wider Today plate, one additional panorama; manifest ' + manifest['sha256'])
