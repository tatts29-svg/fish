#!/usr/bin/env python3
"""Author: Andrew Fisher. v11.97 - the Build card weather for 10-22 Oct 2026 from the Bureau of Meteorology.

The v9.84 archive (BuildHistory984) holds the Bureau's Gold Coast Seaway daily observations for 7 Sep - 9 Oct 2026.
The Build cards for 10-22 Oct say "History unavailable" because the archive stops there. This script reads the
Bureau's October file (IDCJDW4050.202610, the same station and product), converts each day by v9.84's own rules
and adds 10-22 Oct to the archive. Nothing is estimated: a reading the file leaves blank stays null and marks the day
partial, exactly as v9.84 does. Sky conditions are never classified from these files (they report none).

Check first, add second: the converter must reproduce every archived row from the Bureau files (September in full,
1-9 October from the new October file) before any new row is written. v9.84 classified fog on 12 Sep and 6 Oct
from a second source; those two rows are compared on everything but the sky fields.

  python3 weather1197.py SEP_CSV OCT_CSV ARCHIVE_JSON OUT_JSON --retrieved 2026-10-24T15:42:41Z
"""
import argparse
import csv
import hashlib
import io
import json
import sys

STATION = {'name': 'Bureau of Meteorology', 'station': 'Gold Coast Seaway', 'station_id': '040764'}
FIRST, THROUGH = '2026-10-10', '2026-10-22'   # the Build tab stops at 22 Oct 2026 (v11.35)
SOURCE_ID = '202610-24oct'
SKY = ('kind', 'text', 'sky_recorded', 'condition_observations', 'condition_source')


def num(v):
    v = (v or '').strip()
    if v == '':
        return None
    if v.lower() == 'calm':
        return 0.0
    return float(v)


def text(v):
    v = (v or '').strip()
    return v or None


def rows_of(raw, source_id):
    """Every day in one Bureau daily-observations CSV, converted by v9.84's rules."""
    out = {}
    for r in csv.reader(io.StringIO(raw)):
        if len(r) < 22 or not r[1].startswith('2026-'):
            continue
        y, m, d = r[1].split('-')
        iso = '%s-%02d-%02d' % (y, int(m), int(d))
        readings = []
        for time, t, wd, ws in (('09:00', r[10], r[13], r[14]), ('15:00', r[16], r[19], r[20])):
            if any(x.strip() for x in (t, wd, ws)):
                readings.append({'time': time, 'temp_c': num(t), 'wind_kph': num(ws), 'wind_direction': text(wd)})
        winds = [x['wind_kph'] for x in readings if x['wind_kph'] is not None]
        row = {
            'date': iso, 'src': 'bom-history', 'historical': True, 'kind': 'unknown', 'code': None,
            'text': 'Recorded observations', 'min_c': num(r[2]), 'max_c': num(r[3]), 'rain_pc': None, 'rain_mm': None,
            'rain_to_9am_mm': num(r[4]), 'wind_kph': max(winds) if winds else None, 'gust_kph': num(r[8]),
            'gust_time': text(r[9]), 'gust_direction': text(r[7]), 'observations': len(readings),
            'observation_times': [x['time'] for x in readings], 'readings': readings,
        }
        row['partial'] = (any(row[k] is None for k in ('min_c', 'max_c', 'rain_to_9am_mm', 'gust_kph'))
                          or len(readings) < 2 or any(v is None for x in readings for v in x.values()))
        row['sky_recorded'] = False
        row['source_id'] = source_id
        out[iso] = row
    return out


def same(archived, made):
    """An archived row matches its conversion; fog rows (a second source) are compared without the sky fields."""
    skip = set(SKY) if archived.get('condition_source') else set()
    skip.add('source_id')
    a = {k: v for k, v in archived.items() if k not in skip}
    b = {k: v for k, v in made.items() if k not in skip}
    return a == b


def prepared(raw):
    for line in raw.splitlines()[:3]:
        if line.startswith('"Prepared at'):
            return line.strip('"')
    return None


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('sep_csv'); ap.add_argument('oct_csv'); ap.add_argument('archive'); ap.add_argument('out')
    ap.add_argument('--retrieved', required=True, help='UTC time the October file was fetched, ISO 8601')
    a = ap.parse_args(argv)
    sep_raw = open(a.sep_csv, 'rb').read().decode('iso-8859-1')
    oct_bytes = open(a.oct_csv, 'rb').read()
    oct_raw = oct_bytes.decode('iso-8859-1')
    archive = json.load(open(a.archive, encoding='utf-8'))
    days = archive['days']
    made = dict(rows_of(sep_raw, '202609'))
    made.update(rows_of(oct_raw, SOURCE_ID))
    bad = [d for d in sorted(days) if d not in made or not same(days[d], made[d])]
    checked = len(days) - len(bad)
    print('archived rows reproduced: %d of %d' % (checked, len(days)))
    for d in bad:
        print('  differs', d, json.dumps(days[d], sort_keys=True)[:300], '|', json.dumps(made.get(d), sort_keys=True)[:300])
    if bad:
        print('STOP: the converter does not reproduce the archive; nothing written')
        return 1
    new = {d: made[d] for d in sorted(made) if FIRST <= d <= THROUGH}
    want = ['2026-10-%02d' % n for n in range(10, 23)]
    if sorted(new) != want:
        print('STOP: the October file does not hold every day 10-22 Oct:', sorted(new))
        return 1
    utf8 = oct_raw.encode('utf-8')
    ext = {
        'version': 1, 'adds_to': 'BuildHistory984 (v9.84 archive, 7 Sep - 9 Oct 2026)',
        'coverage': {'from': FIRST, 'through': THROUGH},
        'checked': '%d archived rows reproduced from the Bureau files (fog on 12 Sep and 6 Oct compared without the sky fields)' % checked,
        'source': dict(STATION, **{
            'url': 'https://www.bom.gov.au/climate/dwo/202610/html/IDCJDW4050.202610.shtml',
            'data_url': 'https://www.bom.gov.au/climate/dwo/202610/text/IDCJDW4050.202610.csv',
            'source_prepared': prepared(oct_raw), 'retrieved_utc': a.retrieved,
            'snapshot_sha256': hashlib.sha256(utf8).hexdigest(), 'snapshot_encoding': 'UTF-8 copy of ISO-8859-1 source'}),
        'source_id': SOURCE_ID, 'days': new,
    }
    with open(a.out, 'w', encoding='utf-8') as f:
        json.dump(ext, f, indent=2, ensure_ascii=False)
        f.write('\n')
    partial = [d for d, r in new.items() if r['partial']]
    print('added %d days %s to %s; partial: %s' % (len(new), FIRST, THROUGH, ', '.join(partial) or 'none'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
