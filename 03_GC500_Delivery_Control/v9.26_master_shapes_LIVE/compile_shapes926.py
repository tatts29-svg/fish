# Author: Andrew Fisher. Compile sourced drawing evidence; never physical inventory.
import hashlib, json, re
from pathlib import Path
HERE = Path(__file__).resolve().parent
SHAPES = HERE / 'source' / 'shapes_v915.json'
FOOTPRINTS = HERE / 'source' / 'footprints_v915.json'
SHAPES_SHA = hashlib.sha256(SHAPES.read_bytes()).hexdigest()
FOOTPRINTS_SHA = hashlib.sha256(FOOTPRINTS.read_bytes()).hexdigest()
MASTER_SHA = '8753d875cf90682e09afefae8c774144d9e9725ece87f726707882fb3711c56d'
assert SHAPES_SHA == '3671d30452645a4977dac6e8d5256e37cdf132c42d976c2908d512395db3db82'
assert FOOTPRINTS_SHA == 'c005d65560e14c0d48b2f091c3cf36eaf54ca2f4fc81258a829027368add80f0'
J = json.loads(SHAPES.read_text())
F = json.loads(FOOTPRINTS.read_text())
PDF_CHECK = json.loads((HERE / 'source' / 'pdf_check926.json').read_text())
assert J['meta']['master']['sha256'] == MASTER_SHA
assert PDF_CHECK['master_sha256'] == MASTER_SHA
assert PDF_CHECK['drawings_on_page'] > 200000
SYM = []; NOTES = []; SRC = ['master']; TYPES = []; ITEMS = []
def code(table, text):
    if text not in table:
        table.append(text)
    return table.index(text)

def r7(v):
    return [round(v[0], 7), round(v[1], 7)]

UNIT_SRC = {'master': 'm', 'standard': 's', 'under its block': 't', 'cancelled': 'x'}
def units_compact(rows):
    return []  # Current physical identity is supplied by gcUnits925 at runtime.

shapes = {}; nulls = {}; null_units = {}
for ref in J['meta']['refs_order']:
    e = J['refs'][ref]; sh = e['shape']
    if not sh:
        nulls[ref] = e['reason']
        if e.get('units'): null_units[ref] = units_compact(e['units'])
        continue
    comps = []
    for ci, c in enumerate(sh['components']):
        doors = []
        for di_source, d in enumerate(c['doors']):
            sw = d['swing']
            source_row = PDF_CHECK['refs'][ref][ci] if c['source']=='master' else None
            source_door = source_row['doors'][di_source] if source_row else None
            # Preserve complete two-curve inset doors and every actual leaf segment.
            shift_x = 0 if c.get('inset') else 25.50
            shift_y = 0.06 if c.get('inset') else 0.12
            frac = lambda p: r7([(p[0]+shift_x)/2384, (p[1]+shift_y)/1684])
            arcs = [[frac(p) for p in q] for q in source_door['arc_segments_pt']] if source_door else [[r7(p) for p in sw['arc']]]
            leaves = [[frac(p) for p in q] for q in source_door['leaf_segments_pt']] if source_door else [[r7(p) for p in sw['leaf']]]
            doors.append({'e': d['edge_index'], 't': d['at'], 'm': r7(d['mid']), 'o': d['outward'], 'f': d['faces'],
                          'b': d['bearing_deg'], 'w': d['width_m'], 'y': code(SYM, d['symbol']), 'h': r7(sw['hinge']),
                          'q': arcs[0], 'v': leaves[0] if leaves else [r7(x) for x in sw['leaf']], 'arcs': arcs, 'leaves': leaves,
                          'g': [[r7(a), r7(b)] for a, b in sw['landing']] if sw.get('landing') else None})
        di = -1
        if c['door'] is not None:
            di = next(k for k, d in enumerate(c['doors']) if (d.get('pdf') or {}).get('arc_drawing') == (c['door'].get('pdf') or {}).get('arc_drawing')
                      and d['edge_index'] == c['door']['edge_index'] and d['at'] == c['door']['at'])
        marks = []
        for mk in c['marks']:
            o = {'y': mk['type']}
            if mk.get('lines'):
                o['l'] = [[r7(a), r7(b)] for a, b in mk['lines']]
            if mk.get('poly'):
                o['p'] = [r7(x) for x in mk['poly']]
            if 'edge_index' in mk:
                o['e'] = mk['edge_index']
            if mk.get('colour'):
                o['co'] = mk['colour'][0]
            marks.append(o)
        o = {'k': c['kind'], 'l': c['label'], 'p': [r7(x) for x in c['poly']], 'c': r7(c['centroid']),
             'z': c['size_m'], 'a': c['angle_deg'], 'd': doors, 'di': di, 'n': code(NOTES, c['door_note']), 'm': marks, 'u': []}
        if c.get('standard'): o['st'] = 1
        if c['source'] != 'master': o['s'] = code(SRC, c['source'])
        if c['geometry'] == 'polyline': o['g'] = 'l'
        if c['geometry'] == 'point': o['g'] = 'o'
        if c.get('confirm'): o['cf'] = 1
        if c.get('size_state'): o['ss'] = code(NOTES, c['size_state'])
        if c.get('under') is not None: o['un'] = c['under']
        if c.get('pieces'): o['pc'] = c['pieces']
        if c['geometry'] == 'polyline':
            o['pl'] = c.get('piece_len_m_drawn') or (c.get('piece_m') or [2.0])[0]
            o['pw'] = c.get('piece_width_m_drawn') or (c.get('piece_m') or [2.0, 0.5])[1]
        if (c.get('match') or {}).get('confidence'): o['mc'] = c['match']['confidence'][0]
        if c.get('drawn_as'): o['dup'] = c['drawn_as']['ref']
        if c.get('place_note'): o['pn'] = code(NOTES, c['place_note'])
        comps.append(o)
    rec = {'c': comps, 'k': r7(sh['centroid']), 's': sh['door_summary'], 'x': sh.get('note'), 'u': units_compact(e.get('units') or [])}
    if sh.get('placed') is False:
        rec['pl'] = 0; rec['pn'] = code(NOTES, sh.get('place_note') or 'not placed on the map')
    if e.get('cancelled'): rec['cx'] = code(NOTES, 'cancelled on the record: ' + str(e['cancelled']))
    shapes[ref] = rec
FOOT = {k: [v['size_m'], v['size_state'], 1 if v['confirm'] else 0, v['why']] for k, v in F['types'].items() if v.get('footprint')}
cnt = J['meta']['counts_9oct']
PAGE_DATA = {'v': 'v9.26', 'source_sha256': SHAPES_SHA, 'footprints_sha256': FOOTPRINTS_SHA, 'master_sha256': MASTER_SHA,
             'how': 'traced from D001-26003-03 vector, 2 Oct 2026 issue; parts it does not draw from their catalogue footprint',
             'sheet': [2384, 1684], 'm_per_pt': J['meta']['master']['m_per_pt'],
             'sym': SYM, 'notes': NOTES, 'src': SRC, 'types': TYPES, 'items': ITEMS, 'foot': FOOT,
             'counts': {'snapshot_only': True,
                        'components_master': cnt['components_master_8oct'] + cnt['components_master_9oct'],
                        'components_standard': cnt['components_standard'], 'components_under_block': cnt['components_under_block']},
             'shapes': shapes, 'none': nulls, 'none_units': null_units}
blob = json.dumps(PAGE_DATA, ensure_ascii=True, separators=(',', ':'))
for bad in ('Andrew', 'Fisher', 'Claude', 'Codex', 'GPT', 'Opus'):
    assert bad not in blob, f'"{bad}" must not appear in the page data - stopping'
assert not re.search(r'\$\s?\d', blob), 'no dollar figures in the page data - stopping'
blob = blob.replace('</', '<\\/')
BLOB_SHA = hashlib.sha256(blob.encode('utf-8')).hexdigest()

