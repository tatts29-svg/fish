"""Author: Andrew Fisher. Update only servicing data from a bounded private input.

GC500_SERVICING_DATA names the full source JSON; GC500_SERVICING_SCOPE names
{"add_refs": [...], "move_refs": [...]}. Neither private file belongs in Git.
The frozen crew template, native controller and all non-servicing content stay intact.
"""
import hashlib
import json
import math
import os
from pathlib import Path
import re
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT / 'toolchain'))
from rep import rep

BASE_SHA256 = '87b47dc52dc52dc9d078e8f77f79ed3c9e835244e5855e075a075aab1b338b47'
SOURCE = ROOT / 'servicing_tracker_DRAFT' / 'tracker_data.json'
BUILDER = ROOT / 'servicing_tracker_DRAFT' / 'card' / 'build_card.js'
PUMP_PLAN = {'night': ['pump'], 'final': ['pump']}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def object_at(text, marker):
    require(text.count(marker) == 1, 'servicing data marker must occur once')
    start = text.index(marker) + len(marker)
    value, size = json.JSONDecoder().raw_decode(text[start:])
    return value, start, start + size


def encoded(value):
    return json.dumps(value, ensure_ascii=True, separators=(',', ':')).replace('<', '\\u003c')


def panel_data(data):
    panel = {k: data[k] for k in ('tasks', 'plans', 'extras', 'groups', 'days') if k in data}
    panel['areas'] = [{'n': a['n'], 'name': a['name'], 'refs': [
        {'ref': r['ref'], 'lines': [{k: line[k] for k in ('id', 'kind', 'label', 'qty')}
                                  for line in r['lines']]}
        for r in a['refs']]} for a in data['areas']]
    return panel


def crew_data(data):
    # Validate with the production builder; return its existing projection only.
    # Never echo validation stderr: a private input can contain operational details.
    program = "const fs=require('fs'),B=require(process.argv[1]),d=JSON.parse(fs.readFileSync(0,'utf8'));B.buildCardHtml(d);process.stdout.write(JSON.stringify(B.cardData(d)));"
    result = subprocess.run(['node', '-e', program, str(BUILDER)], input=encoded(data),
                            text=True, capture_output=True, env={k: v for k, v in os.environ.items() if k != 'GC500_EDIT_TOKEN'})
    require(result.returncode == 0, 'private servicing input failed the crew builder checks')
    return json.loads(result.stdout)


def index_data(data):
    refs, areas, membership, line_ids = {}, {}, {}, set()
    for area in data['areas']:
        require(type(area['n']) is int and area['n'] >= 0 and area['n'] not in areas, 'area ids must be unique non-negative integers')
        require(isinstance(area['name'], str) and area['name'].strip(), 'area name required')
        areas[area['n']] = area
        for ref in area['refs']:
            key = ref['ref']
            require(isinstance(key, str) and re.fullmatch(r'[A-Z0-9]{1,16}', key) and key not in refs, 'reference ids must be unique and printable')
            require(ref['lines'], 'each reference needs a line')
            refs[key], membership[key] = ref, area['n']
            for line in ref['lines']:
                require(line['id'] not in line_ids, 'line ids must stay unique')
                line_ids.add(line['id'])
    return refs, areas, membership, line_ids


def valid_pin(pin):
    return (isinstance(pin, list) and len(pin) == 2 and
            all(type(n) in (int, float) and math.isfinite(n) for n in pin) and
            -90 <= pin[0] <= 90 and -180 <= pin[1] <= 180)


def validate_update(before, after, scope):
    require(set(scope) == {'add_refs', 'move_refs'}, 'scope must declare additions and movements only')
    for field in ('add_refs', 'move_refs'):
        values = scope[field]
        require(isinstance(values, list) and all(isinstance(v, str) for v in values) and
                len(values) == len(set(values)), 'scope ids must be distinct lists')
    added, moved = set(scope['add_refs']), set(scope['move_refs'])
    require(added or moved, 'empty servicing update')
    require(not added.intersection(moved), 'new references cannot also be movements')
    require(set(before) == set(after), 'top-level data fields must be preserved')
    require({k: v for k, v in before.items() if k not in ('version', 'plans', 'areas')} ==
            {k: v for k, v in after.items() if k not in ('version', 'plans', 'areas')},
            'tasks, days, extras, groups and other data must remain unchanged')
    require(isinstance(after['version'], str) and after['version'].strip(), 'data version required')
    expected_plans = dict(before['plans'])
    if added:
        require('pump_only' not in expected_plans or expected_plans['pump_only'] == PUMP_PLAN,
                'existing pump-only plan differs')
        expected_plans['pump_only'] = PUMP_PLAN
    require(after['plans'] == expected_plans, 'only the pump-only plan may be added; existing plans stay unchanged')
    oldrefs, oldareas, oldmembers, oldlines = index_data(before)
    newrefs, newareas, newmembers, newlines = index_data(after)
    require(set(newrefs) == set(oldrefs) | added and not (added & set(oldrefs)), 'reference set differs from the declared additions')
    require(moved <= set(oldrefs), 'a movement must name an existing reference')
    require(set(oldareas) <= set(newareas), 'existing areas must remain')
    for number, area in oldareas.items():
        require({k: v for k, v in area.items() if k != 'refs'} ==
                {k: v for k, v in newareas[number].items() if k != 'refs'}, 'existing area metadata must remain unchanged')
    for key, old in oldrefs.items():
        new = newrefs[key]
        if key not in moved:
            require(new == old and newmembers[key] == oldmembers[key], 'existing reference changed outside declared movement')
        else:
            allowed = {'title', 'where', 'drop', 'pin'}
            require(set(new) == set(old), 'movement must preserve reference fields')
            require({k: v for k, v in new.items() if k not in allowed} ==
                    {k: v for k, v in old.items() if k not in allowed}, 'movement must preserve id, lines, quantities and asset numbers')
            require(valid_pin(new.get('pin')), 'movement requires a valid supplied pin')
            require(new != old or newmembers[key] != oldmembers[key], 'declared movement did not change')
    for key in added:
        ref = newrefs[key]
        require(set(ref) == {'ref', 'title', 'where', 'drop', 'pin', 'lines'}, 'new reference has unsupported fields')
        require(valid_pin(ref['pin']), 'new servicing location requires a supplied pin')
        require(len(ref['lines']) == 1, 'new servicing location must contain one trailer line')
        line = ref['lines'][0]
        require(set(line) == {'id', 'type', 'kind', 'label', 'qty', 'nos'}, 'new line has unsupported fields')
        require(isinstance(line['id'], str) and re.fullmatch(re.escape(key) + r'-[A-Z0-9_-]{1,40}', line['id']), 'new line id must belong to its reference')
        require(line['type'] == 'Trailer Toilet' and line['kind'] == 'pump_only' and type(line['qty']) is int and line['qty'] == 1,
                'new line must be one pump-only trailer toilet')
        require(line['nos'] == [], 'this update must not invent a fleet number')
        require(isinstance(line['label'], str) and line['label'].strip(), 'new line needs its supplied description')
    require(oldlines <= newlines and len(newlines - oldlines) == len(added), 'existing line ids must be retained')
    require(all(newareas[n]['refs'] for n in set(newareas) - set(oldareas)), 'new areas cannot be empty')


def patch(text, data=None, scope=None):
    require(hashlib.sha256(text.encode('utf-8')).hexdigest() == BASE_SHA256, 'v10.97 requires the exact live v10.95 base')
    if data is None or scope is None:
        require(bool(os.environ.get('GC500_SERVICING_DATA')) and bool(os.environ.get('GC500_SERVICING_SCOPE')),
                'set both private servicing data and scope paths')
        data = json.loads(Path(os.environ['GC500_SERVICING_DATA']).read_text())
        scope = json.loads(Path(os.environ['GC500_SERVICING_SCOPE']).read_text())
    before = json.loads(SOURCE.read_text())
    oldpanel, panel_start, panel_end = object_at(text, 'var SVC1067_DATA=')
    oldbundle, bundle_start, bundle_end = object_at(text, 'var SVC1067_CARD=')
    require(oldpanel == panel_data(before), 'checked-in servicing source differs from live panel')
    require(oldbundle.get('data') == crew_data(before), 'checked-in servicing source differs from live crew data')
    validate_update(before, data, scope)
    nextpanel, nextcrew = panel_data(data), crew_data(data)
    # Replace only the leading data value within the bundle, preserving the exact
    # encoded crew HTML/template bytes (including author metadata escapes).
    require(text[bundle_start:bundle_start + 8] == '{"data":', 'crew bundle data must be its first property')
    card_start = bundle_start + 8
    _, card_size = json.JSONDecoder().raw_decode(text[card_start:])
    output = text[:card_start] + encoded(nextcrew) + text[card_start + card_size:]
    output = output[:panel_start] + encoded(nextpanel) + output[panel_end:]
    output = rep(output, "+' · v10.95'; /* v8.19 release922", "+' · v10.97'; /* v8.19 release922", 'release footer', 'page')
    newbundle, _, _ = object_at(output, 'var SVC1067_CARD=')
    require(newbundle.get('html') == oldbundle.get('html'), 'crew HTML template must remain unchanged')
    return output


if __name__ == '__main__':
    try:
        target = Path(sys.argv[1])
        target.write_text(patch(target.read_text()))
    except (ValueError, KeyError, TypeError, OSError, json.JSONDecodeError) as error:
        # Do not expose input values or paths through a traceback in public logs.
        message = str(error) if type(error) is ValueError else 'private input could not be validated'
        raise SystemExit(message)
