"""Author: Andrew Fisher. v12.61 - the water barrier runs as the K sheets draw them, one record per WB reference.

Reads tools/wfb1261_geometry.json (the runs read off K220-K231 by zone_runs.py: yellow piece centres on each zone
sheet, registered to the K220 master by their shared labels, then to the site frame and the ground) and the programme
the page holds (TP02-26003-03, with the 29/10/26 updates), and writes wfb1261.json: for every WB reference its zone,
sheet, programme location and quantity, the run polylines (frame and lat/lon) and the centre.

    python3 tools/make_wfb1261.py            # writes ../wfb1261.json
"""
import json, math, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
GEOM = json.load(open(HERE / 'wfb1261_geometry.json'))
OUT = HERE.parent / 'wfb1261.json'

# the programme as the page holds it (TP02-26003-03 read 16 Oct 2026) with the 29/10/26 updates applied
PROGRAMME = {
    'WB01': ('9', 'Gold Coast Highway (Northbound) - PB3 Footing/Stairs', 12, 'Coates'),
    'WB02': ('11', 'S08 - Pedestrian Pathway along Main Beach Parade', 34, 'Coates'),
    'WB03': ('10', 'Gold Coast Highway (Turn 2) - Concrete small blocks', 30, 'Coates'),
    'WB04': ('9', 'Helen Park - HVM', 13, 'Coates'),
    'WB05': ('13', 'Main Beach Light Rail - Bus Stop', 12, 'Coates'),
    'WB06': ('1', 'Gold Coast Highway Macintosh Park Turning Lane (Grandstand Barriers)', 154, 'Coates'),
    'WB07': ('1', 'Admiralty Drive Intersection (Through lane removed between centre islands)', 0, 'Coates'),
    'WB08': ('12', 'Admiralty Drive middle turning lane onto GCHWY southbound', 17, 'Downer'),
    'WB09': ('8', 'Breaker Street / Rainkden Parade - (Implemented for One Way Direction)', 114, 'Downer'),
    'WB10': ('8', 'Gold Coast Highway - (Traffic Switch - Contraflow Event Week)', 54, 'Downer'),
    'WB11': ('5', 'Budds Beach - Palm Avenue, Pine Avenue, Norfolk Avenue', 42, 'Downer'),
    'WB12': ('14', 'Gold Coast Highway, Surfers Paradise - Cypress Avenue turning lane southbound', 26, 'Downer'),
    'WB13': ('10', 'Fence bracing behind S15 + Ped Crossing', 10, 'Coates'),
    'WB14': ('2', 'MP4.0 Turn 4 Drivers Right', 2, 'Coates'),
    'WB15': ('6', 'Turn 11 Runoff (Main Beach Parade North) - HVM', 4, 'Coates'),
    'WB16': ('9', 'Gate 2 - HVM', 13, 'Coates'),
    'WB17': ('n/a', 'Racing kerbs (T6/7/8/9)', 6, 'Coates'),
    'WB18': ('n/a', 'Racing kerbs (T2)', 2, 'Coates'),
    'WB19': ('11', 'S08 - Pedestrian Pathway along Main Beach Parade', 34, 'Coates'),
    'WB20': ('10', 'Gold Coast Highway (Turn 2)', 30, 'Coates'),
    'WB21': ('13', 'Main Beach Light Rail - Bus Stop', 0, 'Coates'),
    'WB22': ('10', 'Marriot pedestrian crossing closure', 4, 'Coates'),
}

def r6(v): return round(float(v), 6)

out = {}
for ref, g in sorted(GEOM.items()):
    zone, where, qty, by = PROGRAMME[ref]
    if by != 'Coates':
        print('skipped', ref, by, '- not ours (Andrew, 30 Oct 2026: "Only the coates ones")')
        continue
    runs = []
    for r in g.get('runs', []):
        fr = [[r6(p[0]), r6(p[1])] for p in r['frame']]
        ll = [[r6(p[0]), r6(p[1])] for p in r['ll']]
        runs.append({'frame': fr, 'll': ll, 'pieces_yellow': r.get('pieces_yellow')})
    c_ll = [r6(g['centre_ll'][0]), r6(g['centre_ll'][1])]
    c_fr = [r6(g['centre_frame'][0]), r6(g['centre_frame'][1])]
    src = g['src']
    sheet = src.split(' ')[0] if src.startswith('K') else None
    out[ref] = {'zone': zone, 'where': where, 'qty': qty, 'by': by, 'sheet': sheet, 'source': src,
                'll': c_ll, 'frame': c_fr, 'runs': runs, 'note': g.get('note', '')}
json.dump(out, open(OUT, 'w'), indent=1, ensure_ascii=False)
print('wrote', OUT, 'refs', len(out))
for ref, v in out.items():
    print(ref, '| zone', v['zone'], '|', v['where'][:48], '| qty', v['qty'], v['by'], '|', v['sheet'], '| runs', len(v['runs']), '| centre', v['ll'])
