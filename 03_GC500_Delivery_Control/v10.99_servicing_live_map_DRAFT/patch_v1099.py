"""Author: Andrew Fisher. Add a saved-progress map to the native servicing panel.

Private inputs: GC500_SERVICING_DATA (full source JSON), GC500_SERVICING_MAPS
(existing registered metadata), GC500_SERVICING_MASTER_IMAGE (existing JPEG).
No private operational data is stored in this source. No tracker writes are made.
"""
import base64
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT / 'toolchain'))
from rep import rep
spec = importlib.util.spec_from_file_location('servicing_source1097', ROOT / 'v10.97_servicing_update_LIVE' / 'patch_v1097.py')
previous = importlib.util.module_from_spec(spec)
spec.loader.exec_module(previous)
require, encoded, object_at = previous.require, previous.encoded, previous.object_at
BASE_SHA256 = '6a1d77fe216ab6a1088a89e75ebd4602bb24e084342881a5aa963448adc34e64'
CONTROLLER = '/* Author: Andrew Fisher. v10.67 read-only servicing progress. v10.84'


def number(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)


def pin(v):
    require(v is None or (isinstance(v, list) and len(v) == 2 and all(number(x) for x in v)
                         and -90 <= v[0] <= 90 and -180 <= v[1] <= 180), 'invalid private map pin')
    return v


def build_geometry(data, maps, image):
    require(isinstance(maps, dict) and isinstance(maps.get('images'), dict), 'registered map metadata required')
    master = maps['images'].get('master', {})
    rect, px = master.get('rect'), master.get('px')
    require(isinstance(rect, list) and len(rect) == 4 and all(number(x) for x in rect)
            and rect[2] > rect[0] and rect[3] > rect[1], 'invalid registered image rectangle')
    require(isinstance(px, list) and len(px) == 2 and all(number(x) and x > 0 for x in px), 'invalid master image dimensions')
    require(abs((rect[2] - rect[0]) / (rect[3] - rect[1]) / (px[0] / px[1]) - 1) < .002,
            'registered image aspect ratio changed')
    require(isinstance(image, bytes) and image[:3] == b'\xff\xd8\xff' and len(image) < 5_000_000, 'existing JPEG master image required')
    # Decode only to verify dimensions; the exact original image bytes are embedded.
    import io
    from PIL import Image
    with Image.open(io.BytesIO(image)) as im:
        require(list(im.size) == px, 'master image dimensions differ from registered metadata')
    refs, lines = {}, set()
    positions, spots = maps.get('positions'), maps.get('line_spots', {})
    require(isinstance(positions, dict) and isinstance(spots, dict), 'registered positions required')
    def point(value):
        if value is None:
            return None
        require(isinstance(value, dict) and all(number(value.get(k)) for k in ('x', 'y')), 'invalid registered map point')
        return {k: value[k] for k in ('x', 'y')}
    for area in data['areas']:
        for ref in area['refs']:
            name = ref['ref']
            require(name not in refs and name in positions, 'reference missing or duplicated in registered map')
            target = {'title': ref.get('title') or name, 'pin': pin(ref.get('pin')), 'lines': {}}
            for line in ref['lines']:
                lid = line['id']
                require(lid not in lines, 'duplicate private servicing line')
                lines.add(lid)
                if lid in spots:
                    require(spots[lid] is None or spots[lid].get('ref') == name, 'line location belongs to a different reference')
                    pos = point(spots[lid])
                else:
                    require(not line.get('pin') or line['pin'] == ref.get('pin'), 'separate line pin needs its registered line position')
                    pos = point(positions[name])
                target['lines'][lid] = {'type': line.get('type', ''), 'label': line.get('label', line['kind']),
                                        'point': pos, 'pin': pin(line.get('pin') or ref.get('pin'))}
            refs[name] = target
    require(set(spots).issubset(lines), 'registered map has unknown servicing line locations')
    require(set(positions) == set(refs), 'registered reference map differs from servicing source')
    return {'schema': 1, 'rect': rect, 'px': px, 'image': 'data:image/jpeg;base64,' + base64.b64encode(image).decode(), 'refs': refs}


def patch(text, data=None, maps=None, image=None, expected_sha=BASE_SHA256):
    require(hashlib.sha256(text.encode()).hexdigest() == expected_sha, 'v10.99 requires the exact verified predecessor bytes')
    require('var SvcMap1099 =' not in text and 'svc1099-style' not in text, 'servicing map already installed')
    if data is None:
        data = json.loads(Path(os.environ['GC500_SERVICING_DATA']).read_text())
    if maps is None:
        maps = json.loads(Path(os.environ['GC500_SERVICING_MAPS']).read_text())
    if image is None:
        image = Path(os.environ['GC500_SERVICING_MASTER_IMAGE']).read_bytes()
    native = object_at(text, 'var SVC1067_DATA=')[0]
    require(native == previous.panel_data(data), 'private map source differs from native servicing data')
    G = build_geometry(data, maps, image)
    out = text
    def change(old, new, label):
        nonlocal out
        out = rep(out, old, new, label, 'page')
    bundle = '</script>\n<style id="svc1099-style">' + (HERE / 'map1099.css').read_text() + '</style>\n<script>\nvar SVC1099_MAP_DATA=' + encoded(G) + ';\n' + (HERE / 'map1099_src.js').read_text() + '\n'
    change(CONTROLLER, bundle + CONTROLLER, 'map presentation and private registered geometry')
    change("var note, open = {}, pickedDay = '', clockAt = 0, clockNow = 0, lastSignature = '', observer, admin;",
           "var mapPane1099, failures1099 = 0;\nvar note, open = {}, pickedDay = '', clockAt = 0, clockNow = 0, lastSignature = '', observer, admin;", 'persistent map mount and poll backoff')
    change('function clearPrivate() { if(admin)',
           'function clearPrivate() { SvcMap1099.clear(mapPane1099); if(mapPane1099)mapPane1099.remove(); if(admin)', 'clear map on access loss')
    change('  var html;\n  if (!model) html =', '  var html, mapInput1099 = null;\n  if (!model) html =', 'shared selected snapshot')
    change("      readStatus: status || 'Read-only progress · last verified ' + SvcState.hm(clockNow) + ' AEST · checks every 20 s while Servicing is open.'}).replace(/svc1063/g, 'svc1067');",
           "      readStatus: status || 'Read-only progress · last verified ' + SvcState.hm(clockNow) + ' AEST · checks every 5 s while Servicing is open.'}).replace(/svc1063/g, 'svc1067');\n    mapInput1099 = {D:data,S:SvcState,events:model.events,now:now,lastRead:clockNow,day:day,readStatus:status,refresh:function(){failures1099=0;poll();}};", 'map uses the same night and verified snapshot')
    change('  if (force || html !== lastSignature) { content.innerHTML = html; lastSignature = html; }\n}',
           '''  if(mapInput1099)mapInput1099.focusReturn=SvcMap1099.rememberFocus(mapPane1099);
  if (force || html !== lastSignature) { content.innerHTML = html; lastSignature = html; }
  if (mapInput1099) {
    if (!mapPane1099) mapPane1099 = document.createElement('div');
    var mapAfter1099 = content.querySelector('.svc-tasks') || content.querySelector('.svc-all');
    if (mapAfter1099) { if(mapAfter1099.nextElementSibling!==mapPane1099)mapAfter1099.insertAdjacentElement('afterend',mapPane1099); } else if(mapPane1099.parentNode!==content)content.appendChild(mapPane1099);
    SvcMap1099.update(mapPane1099,mapInput1099);
  } else { SvcMap1099.clear(mapPane1099); if(mapPane1099)mapPane1099.remove(); }
}''', 'persistent map survives native panel refresh')
    change("model = snap; clockNow = at; clockAt = performance.now(); status = '';",
           "model = snap; clockNow = at; clockAt = performance.now(); status = ''; failures1099 = 0;", 'reset backoff after verified read')
    change("  } catch (e) { status = (model ? 'Showing the last verified progress. ' : '')",
           "  } catch (e) { failures1099 = Math.min(4,failures1099+1); status = (model ? 'Showing the last verified progress. ' : '')", 'retain saved status during read failure')
    change('function schedule() { clearTimeout(timer); timer = setTimeout(poll, 20000); }',
           'function schedule() { clearTimeout(timer); timer = 0; if(editable() && visible()) timer = setTimeout(poll, Math.min(60000,5000*Math.pow(2,failures1099))); }', 'active visible polling only')
    change("+' · v10.98'; /* v8.19 release922", "+' · v10.99'; /* v8.19 release922", 'release footer')
    require(object_at(out, 'var SVC1067_DATA=')[0] == native, 'native servicing duties changed')
    require(object_at(out, 'var SVC1067_CARD=')[0] == object_at(text, 'var SVC1067_CARD=')[0], 'crew card or permanent codes changed')
    return out


if __name__ == '__main__':
    try:
        target = Path(sys.argv[1])
        target.write_text(patch(target.read_text()), encoding='utf-8')
    except (ValueError, KeyError, TypeError, OSError, json.JSONDecodeError) as error:
        raise SystemExit(str(error) if type(error) is ValueError else 'private servicing map inputs could not be validated')
