"""Author: Andrew Fisher. Complete final demob observations from the existing BOM station."""
from pathlib import Path
import copy
import hashlib
import json
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'v12.99_demob_weather_LIVE'))
from weather_archive1299 import rows_of, STATION

SOURCE_ID = '202611-15nov1308'
FIRST, THROUGH = '2026-11-04', '2026-11-13'
EXPECTED_CSV_SHA = 'b4223475528e54018653ac753ab229cf3acdea6f8e2edb853d1fd76b2498a325'


def update_archive(old):
    if len(old['days']) != 59 or old['coverage']['through'] != '2026-11-04':
        raise ValueError('Requires the reviewed 59-day archive through partial 4 November')
    folder = HERE / 'weather_sources'
    retrieval = json.loads((folder / 'retrieval.json').read_text())
    raw = (folder / 'IDCJDW4050.202611.csv').read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != EXPECTED_CSV_SHA or digest != retrieval['text']['sha256']:
        raise ValueError('BOM CSV differs from the verified snapshot')
    html = (folder / 'IDCJDW4050.202611.shtml').read_bytes()
    if hashlib.sha256(html).hexdigest() != retrieval['html']['sha256']:
        raise ValueError('BOM table differs from its retrieval evidence')
    decoded = raw.decode('iso-8859-1')
    rows = rows_of(decoded, SOURCE_ID)
    for day in ['2026-11-01', '2026-11-02', '2026-11-03']:
        without_source = lambda row: {k: v for k, v in row.items() if k != 'source_id'}
        if without_source(old['days'][day]) != without_source(rows[day]):
            raise ValueError('Existing complete observation was revised: ' + day)
    dates = [f'2026-11-{day:02d}' for day in range(4, 14)]
    if any(day not in rows or rows[day]['partial'] for day in dates):
        raise ValueError('Every requested day must have complete published observations')
    previous = old['days'][FIRST]
    if previous.get('partial') is not True:
        raise ValueError('4 November must be the existing partial day')
    for key, value in previous.items():
        if key not in {'source_id', 'partial'} and value is not None and rows[FIRST].get(key) != value:
            raise ValueError('Previously published 4 November field changed: ' + key)
    if any(day in old['days'] for day in dates[1:]):
        raise ValueError('New observations would overwrite existing dates')
    new = copy.deepcopy(old)
    new['sources'][SOURCE_ID] = {
        **STATION,
        'url': retrieval['html']['url'],
        'data_url': retrieval['text']['url'],
        'source_prepared': next(line.strip('"') for line in decoded.splitlines()[:3] if line.startswith('"Prepared at')),
        'retrieved_utc': retrieval['text']['retrieved_utc'],
        'snapshot_sha256': hashlib.sha256(decoded.encode()).hexdigest(),
        'snapshot_encoding': 'UTF-8 copy of ISO-8859-1 source',
        'original_bytes_sha256': digest,
        'html_snapshot_sha256': retrieval['html']['sha256'],
    }
    new['days'].update({day: rows[day] for day in dates})
    new['coverage']['through'] = THROUGH
    return new
