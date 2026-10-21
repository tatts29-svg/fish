"""Author: Andrew Fisher. Sharpen the existing servicing map and its saved progress.

Private registered preview/detail WebP assets and their manifest are supplied via
GC500_SERVICING_MAP_PREVIEW, GC500_SERVICING_MAP_DETAIL and GC500_SERVICING_MAP_MANIFEST.
No operational record, tracker template, reference, code, pin or quantity is changed.
"""
import base64
import copy
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import sys
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT / 'toolchain'))
from rep import rep
spec = importlib.util.spec_from_file_location('servicing_source1097', ROOT / 'v10.97_servicing_update_LIVE' / 'patch_v1097.py')
previous = importlib.util.module_from_spec(spec)
spec.loader.exec_module(previous)
require, encoded, object_at = previous.require, previous.encoded, previous.object_at
BASE_SHA256 = 'fddc937937d41bc0a1651556b4ef28749085789271fc61c3145ed044db22f8cf'


def images(geometry, preview, detail, manifest):
    require(manifest.get('rect') == geometry['rect'], 'detail crop differs from registered rectangle')
    require(isinstance(manifest.get('source_sha256'), str) and len(manifest['source_sha256']) == 64,
            'original drawing provenance required')
    rect = geometry['rect']
    aspect = (rect[2] - rect[0]) / (rect[3] - rect[1])
    sizes = {}
    for name, blob in [('preview', preview), ('detail', detail)]:
        require(isinstance(blob, bytes) and len(blob) < 5_000_000, 'bounded map asset required')
        require(hashlib.sha256(blob).hexdigest() == manifest.get(name + '_sha256'), 'map asset hash mismatch')
        with Image.open(io.BytesIO(blob)) as im:
            require(im.format == 'WEBP', 'WebP map asset required')
            require(list(im.size) == manifest.get(name + '_px'), 'map dimensions differ from manifest')
            require(abs(im.width / im.height / aspect - 1) < .002, 'map aspect differs from registered crop')
            sizes[name] = list(im.size)
    require(800 <= sizes['preview'][0] <= 3000, 'preview dimensions exceed budget')
    require(4096 <= sizes['detail'][0] <= 8192, 'genuine 4K or higher detail image required')
    require(sizes['detail'][0] > sizes['preview'][0], 'detail must exceed preview resolution')
    require(len(preview) + len(detail) < 6_000_000, 'map payload exceeds budget')
    result = copy.deepcopy(geometry)
    result['image'] = 'data:image/webp;base64,' + base64.b64encode(preview).decode()
    result['previewPx'] = sizes['preview']
    result['detailImage'] = 'data:image/webp;base64,' + base64.b64encode(detail).decode()
    result['detailPx'] = sizes['detail']
    require(result['rect'] == geometry['rect'] and result['px'] == geometry['px']
            and result['refs'] == geometry['refs'], 'registered geometry changed')
    return result


def patch(text, preview=None, detail=None, manifest=None, expected_sha=BASE_SHA256):
    require(hashlib.sha256(text.encode()).hexdigest() == expected_sha, 'v11.00 requires exact verified v10.99 bytes')
    require('svc1100' not in text, 'v11.00 already installed')
    require('var SvcMap1099 =' in text and 'svc1099-style' in text, 'native servicing map required')
    if preview is None: preview = Path(os.environ['GC500_SERVICING_MAP_PREVIEW']).read_bytes()
    if detail is None: detail = Path(os.environ['GC500_SERVICING_MAP_DETAIL']).read_bytes()
    if manifest is None: manifest = json.loads(Path(os.environ['GC500_SERVICING_MAP_MANIFEST']).read_text())
    geometry, start, end = object_at(text, 'var SVC1099_MAP_DATA=')
    revised = images(geometry, preview, detail, manifest)
    out = text
    def change(old, new, label):
        nonlocal out
        out = rep(out, old, new, label, 'page')
    change(text[start:end], encoded(revised), 'registered progressive map image')
    old = ROOT / 'v10.99_servicing_live_map_LIVE'
    change((old / 'map1099_src.js').read_text(), (HERE / 'map1100_src.js').read_text(), 'persistent map rendering and saved completion highlights')
    change((old / 'map1099.css').read_text(), (HERE / 'map1100.css').read_text(), 'servicing map visual clarity')
    change("checks every 5 s while Servicing is open.", "checks every 2 s while Servicing is open.", 'visible refresh status')
    change('refresh:function(){failures1099=0;poll();}', 'refresh:function(){failures1099=0;return poll();}', 'manual refresh completion feedback')
    change('async function poll() {', '''var flight1100 = null;
function poll() {
  if (flight1100) return flight1100;
  flight1100 = pollRead1100().finally(function(){ flight1100 = null; });
  return flight1100;
}
async function pollRead1100() {''', 'share the current read with manual refresh')
    change('Math.min(4,failures1099+1)', 'Math.min(5,failures1099+1)', 'bounded read-failure backoff')
    change('5000*Math.pow(2,failures1099)', '2000*Math.pow(2,failures1099)', 'two-second visible refresh')
    change("+' · v10.99'; /* v8.19 release922", "+' · v11.00'; /* v8.19 release922", 'release footer')
    for marker in ['var SVC1067_DATA=', 'var SVC1067_CARD=']:
        require(object_at(out, marker)[0] == object_at(text, marker)[0], 'servicing data or permanent crew card changed')
    return out


if __name__ == '__main__':
    try:
        target = Path(sys.argv[1])
        target.write_text(patch(target.read_text()), encoding='utf-8')
    except (ValueError, KeyError, TypeError, OSError, json.JSONDecodeError) as error:
        raise SystemExit(str(error) if type(error) is ValueError else 'private registered map inputs could not be validated')
