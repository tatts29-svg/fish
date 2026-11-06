"""Author: Andrew Fisher. Byte-preserving media extraction and bounded startup work.

Build from exact live v11.99. Generated media and manifests stay in ignored build/.
No records, rates, image pixels, servicing QR codes or crew-card source change.
"""
import base64
import hashlib
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASE = '2c653073230aa8533fd2121cf87f3459c6fbde66a0aac22df564dc55161e671e'
HOST = 'https://gc500-production.up.railway.app'
MEDIA = re.compile(r'data:(image/(?:webp|jpeg|png|gif)|font/(?:woff2|woff));base64,([A-Za-z0-9+/=]+)')
EXT = {'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png', 'image/gif': 'gif', 'font/woff2': 'woff2', 'font/woff': 'woff'}


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()


def patch(html, output):
    if hashlib.sha256(html.encode()).hexdigest() != BASE:
        raise ValueError('v12.00 requires exact live v11.99; rebuild/rebase if another release is live')
    start = html.index('const DATA = ') + len('const DATA = ')
    data, end = json.JSONDecoder().raw_decode(html[start:])
    end += start
    table = data.pop('media')
    # Remove only descriptors with no key reference anywhere else in the entire
    # page. Registered files/manifests on the service remain untouched and usable.
    # All dynamic lookup sources (map tiles, master crops, fonts and atlases) retain
    # their literal keys. Nothing from the operational record indexes this table.
    referenced = set(re.findall(r'[a-f0-9]{64}', html[:start] + html[end:] + json.dumps(data)))
    unused = sorted(set(table) - referenced)
    if len(unused) != 64:
        raise ValueError('Media reference audit differs from the measured base')
    for key in unused:
        del table[key]
    media_dir = output / 'media1200'
    media_dir.mkdir(parents=True, exist_ok=True)
    extracted = {}

    def extract(match):
        typ, encoded = match.groups()
        blob = base64.b64decode(encoded, validate=True)
        digest = hashlib.sha256(blob).hexdigest()
        descriptor = dict(file=digest + '.' + EXT[typ], sha256=digest,
                          type=typ, bytes=len(blob), scope='view')
        if digest in table and table[digest] != descriptor:
            raise ValueError('Existing media permissions or bytes differ')
        table[digest] = descriptor
        extracted[digest] = descriptor
        (media_dir / descriptor['file']).write_bytes(blob)
        # This is the already-public view token, never the private edit key.
        # Absolute same-origin URLs also work in print and detached SVG previews.
        return HOST + '/m/Coates-GC500-2026/' + descriptor['file']

    # DATA itself has no embedded binary media in this base. Keeping its literal
    # JSON separate preserves every non-media field byte-for-byte semantically.
    if MEDIA.search(html[start:end]):
        raise ValueError('Unexpected media inside DATA')
    prefix, suffix = MEDIA.sub(extract, html[:start]), MEDIA.sub(extract, html[end:])
    if len(extracted) != 56 or len(table) > 2000:
        raise ValueError('Unexpected media inventory or guard capacity exceeded')
    manifest = dict(schema='gc500-media-v1', assets=sorted(table.values(), key=lambda x: x['file']))
    manifest['sha256'] = hashlib.sha256(canonical(manifest)).hexdigest()
    data['media'] = table
    data['hostedMedia']['manifest'] = manifest['sha256']
    html = prefix + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + suffix
    (output / 'media1200-manifest.json').write_bytes(canonical(manifest))
    (output / 'media1200-extracted.json').write_bytes(canonical(dict(
        author='Andrew Fisher', base=BASE, assets=list(extracted.values()),
        omitted_unreferenced_descriptors=unused, manifest=manifest['sha256'])))

    old = "const url='/m/'+token+'/'+item.file; table[key]=url; urls.add(url);"
    new = old + " urls.add(location.origin+url); urls.add('" + HOST + "/m/Coates-GC500-2026/'+item.file); /* loading1200: track extracted images too */"
    html = rep(html, old, new, 'hosted-image retry coverage', 'page')
    html = rep(html,
        "if (!expOn() || EXP.frame || typeof document.body.moveBefore !== 'function') return;",
        "if (state.tab !== 'map' || !expOn() || EXP.frame || typeof document.body.moveBefore !== 'function') return; /* loading1200: load the explorer when Map is opened */",
        'defer hidden explorer', 'page')
    # The existing per-render heldMemo is discarded after each synchronous read
    # and invalidated by save/remote updates. No persistent/stale business cache.
    old_start = html.index('function docketBook815(no){')
    old_end = html.index('/* the plate:', old_start)
    old = html[old_start:old_end]
    new = old.replace('allDockets()', "heldMemo('documentDockets1200',()=>allDockets())").replace(
        'serviceNoteRows()', "heldMemo('documentServices1200',()=>serviceNoteRows())").replace(
        'collectionRows()', "heldMemo('documentCollections1200',()=>collectionRows())")
    html = rep(html, old, new, 'one document-book index per draw', 'page')
    # A review asks for the same identity roster for every paper in one draw.
    # Only the roster is held; each paper's fingerprint and source checks still run.
    begin = html.index('function fenceReviewContext836(d){')
    finish = html.index('const review=fencingReview836', begin)
    old = html[begin:finish]
    new = old.replace('const records=[', "const records=heldMemo('fenceReviewRecords1200',()=>[")
    new = new.replace('collectionRows().map(n=>({id:n.id,docket_no:n.collection_no}))];',
        'collectionRows().map(n=>({id:n.id,docket_no:n.collection_no}))]);')
    if new == old or new.count('fenceReviewRecords1200') != 1:
        raise ValueError('Review roster source differs')
    html = rep(html, old, new, 'one review identity roster per draw', 'page')
    html = rep(html, '</script>\n</body>\n</html>', '</script>\n<script id="loading1200">\n' +
        (HERE / 'loading1200_src.js').read_text() + '\n</script>\n</body>\n</html>', 'finder index freshness', 'page')
    html = rep(html, "+' · v11.99'; /* v8.19 release922", "+' · v12.00'; /* v8.19 release922", 'release footer', 'page')
    return html


if __name__ == '__main__':
    path = Path(sys.argv[1])
    result = patch(path.read_text(), path.parent)
    path.write_text(result)
    print('v12.00 media extraction and bounded loading changes applied')
