"""Author: Andrew Fisher. Move one existing servicing reference from private inputs.

GC500_SERVICING_BASE_DATA is the full private source behind the current live data;
GC500_SERVICING_DATA is its proposed replacement; GC500_SERVICING_SCOPE declares
{"add_refs": [], "move_refs": [one_existing_reference]}. Keep all inputs private.
This patch does not write the live job record, tracker, maps or printed codes.
"""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT / 'toolchain'))
from rep import rep

_spec = importlib.util.spec_from_file_location(
    'servicing_update1097', ROOT / 'v10.97_servicing_update_LIVE' / 'patch_v1097.py')
_previous = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_previous)
require = _previous.require
object_at = _previous.object_at
encoded = _previous.encoded
panel_data = _previous.panel_data
crew_data = _previous.crew_data

BASE_SHA256 = 'd584e292ec8647532ef7e93e3873dd41a48efd5890a4a9e32435318e7871b1dc'


def validate_movement(before, after, scope):
    require(isinstance(scope, dict) and set(scope) == {'add_refs', 'move_refs'},
            'scope must declare additions and movements only')
    require(scope['add_refs'] == [] and isinstance(scope['move_refs'], list)
            and len(scope['move_refs']) == 1 and isinstance(scope['move_refs'][0], str),
            'this release permits exactly one existing reference movement and no additions')
    _previous.validate_update(before, after, scope)
    moved = scope['move_refs'][0]
    oldrefs, oldareas, _, _ = _previous.index_data(before)
    newrefs, newareas, _, _ = _previous.index_data(after)
    require(newrefs[moved]['pin'] != oldrefs[moved].get('pin'),
            'movement requires a changed supplied pin')
    require([a['n'] for a in after['areas'] if a['n'] in oldareas]
            == [a['n'] for a in before['areas']], 'existing area order must remain unchanged')
    for number, area in oldareas.items():
        require([r['ref'] for r in newareas[number]['refs'] if r['ref'] != moved]
                == [r['ref'] for r in area['refs'] if r['ref'] != moved],
                'unmoved reference order must remain unchanged')
    for number in set(newareas) - set(oldareas):
        require(set(newareas[number]) == {'n', 'name', 'refs'},
                'new destination area has unsupported metadata')
        require([r['ref'] for r in newareas[number]['refs']] == [moved],
                'new destination area must contain only the declared movement')


def private_input(variable):
    require(bool(os.environ.get(variable)), 'set all three private servicing input paths')
    return json.loads(Path(os.environ[variable]).read_text(encoding='utf-8'))


def patch(text, before=None, data=None, scope=None):
    require(hashlib.sha256(text.encode('utf-8')).hexdigest() == BASE_SHA256,
            'v10.98 requires the exact live v10.97 base')
    if before is None:
        before = private_input('GC500_SERVICING_BASE_DATA')
    if data is None:
        data = private_input('GC500_SERVICING_DATA')
    if scope is None:
        scope = private_input('GC500_SERVICING_SCOPE')
    oldpanel, panel_start, panel_end = object_at(text, 'var SVC1067_DATA=')
    oldbundle, bundle_start, _ = object_at(text, 'var SVC1067_CARD=')
    require(oldpanel == panel_data(before), 'private base source differs from the live panel')
    require(oldbundle.get('data') == crew_data(before), 'private base source differs from the live crew data')
    validate_movement(before, data, scope)
    require(text[bundle_start:bundle_start + 8] == '{"data":',
            'crew bundle data must be its first property')
    card_start = bundle_start + 8
    _, card_size = json.JSONDecoder().raw_decode(text[card_start:])
    replacements = [(panel_start, panel_end, encoded(panel_data(data))),
                    (card_start, card_start + card_size, encoded(crew_data(data)))]
    output = text
    for start, end, replacement in sorted(replacements, reverse=True):
        output = output[:start] + replacement + output[end:]
    output = rep(output, "+' · v10.97'; /* v8.19 release922",
                 "+' · v10.98'; /* v8.19 release922", 'release footer', 'page')
    require(object_at(output, 'var SVC1067_CARD=')[0].get('html') == oldbundle.get('html'),
            'crew HTML template must remain unchanged')
    return output


if __name__ == '__main__':
    try:
        target = Path(sys.argv[1])
        target.write_text(patch(target.read_text(encoding='utf-8')), encoding='utf-8')
    except (ValueError, KeyError, TypeError, OSError, json.JSONDecodeError) as error:
        # Private input values and paths never appear in command output.
        message = str(error) if type(error) is ValueError else 'private input could not be validated'
        raise SystemExit(message)
