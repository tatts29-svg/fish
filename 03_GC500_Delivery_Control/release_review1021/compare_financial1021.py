"""Author: Andrew Fisher. Preserve the established financial comparison, allowing only the exact WC49 map metadata.

Usage: python3 compare_financial1021.py baseline.json candidate.json private-report.json
Original captures are never modified. No monetary values are printed or copied into the compact report.
"""
from pathlib import Path
from copy import deepcopy
from contextlib import redirect_stdout
import hashlib
import io
import json
import runpy
import sys
import tempfile

HERE = Path(__file__).resolve().parent
CONTROL = HERE.parent
EXPECTED_PAGE = '06d6e6b0956c793299c99b5e48a7ee1c3fe16616f20a60ff0696d410f111848d'
ROW_PATHS = ('/inventory/14', '/inventory/14/receipts1006/0', '/receipts/14', '/rows/31', '/rows/31/receipts1006/0')
FIELDS = ('coordinates', 'location', 'locationBasis', 'url')


def digest(data):
    return hashlib.sha256(data).hexdigest()


def changed(a, b, path=''):
    if type(a) is not type(b):
        return [path]
    if isinstance(a, dict):
        result = []
        for key in sorted(set(a) | set(b)):
            at = path + '/' + str(key)
            result.extend([at] if key not in a or key not in b else changed(a[key], b[key], at))
        return result
    if isinstance(a, list):
        if len(a) != len(b):
            return [path + '/length']
        return [item for i, (x, y) in enumerate(zip(a, b)) for item in changed(x, y, path + '/' + str(i))]
    return [] if a == b else [path]


def row_at(value, pointer):
    for part in pointer.strip('/').split('/'):
        value = value[int(part)] if isinstance(value, list) else value[part]
    return value


def source_positions():
    choices = [CONTROL / ('v10.20_gate6_compound_' + state) / 'gate6_positions_1020.json' for state in ('LIVE', 'DRAFT')]
    found = [p for p in choices if p.is_file()]
    if len(found) != 1:
        raise ValueError('Expected exactly one reviewed Gate 6 source file')
    return found[0]


def compare(base_path, candidate_path, output_path):
    if output_path in (base_path, candidate_path):
        raise ValueError('The report cannot overwrite either original financial capture')
    raw_base = base_path.read_bytes()
    raw_candidate = candidate_path.read_bytes()
    base, candidate = json.loads(raw_base), json.loads(raw_candidate)
    source = source_positions()
    source_bytes = source.read_bytes()
    positions = json.loads(source_bytes)
    wc49 = positions['refs']['WC49']
    coordinates = lambda ll: ', '.join(f'{float(v):.6f}' for v in ll)
    directions = lambda ll: 'https://www.google.com/maps/dir/?api=1&destination=' + ','.join(f'{float(v):.6f}' for v in ll) + '&travelmode=driving'
    old_metadata = {
        'coordinates': coordinates(wc49['old']['ll']),
        'location': 'The Esplanade · Gate 5 ticket box / QFES office · P60/P62',
        'locationBasis': 'Master plan reference position',
        'url': directions(wc49['old']['ll']),
    }
    new_metadata = {
        'coordinates': coordinates(wc49['new']['ll']),
        'location': positions['details1002_WC49']['destination'],
        'locationBasis': 'Drawing position — check on site',
        'url': directions(wc49['new']['ll']),
    }
    checks = []
    def check(name, passed):
        checks.append({'name': name, 'pass': bool(passed)})

    check('exact reviewed candidate page', candidate.get('pageSha') == EXPECTED_PAGE)
    check('driver coordinates agree with computed Gate 6 source', positions['details1002_WC49']['coordinates'] == new_metadata['coordinates'])
    check('all physical Inventory projections unchanged', base['projection'] == candidate['projection'])
    check('all native state fields unchanged', base['domains']['nativeState'] == candidate['domains']['nativeState'])
    supplier_before = base['domains']['supplier']
    supplier_after = candidate['domains']['supplier']
    actual_paths = changed(supplier_before, supplier_after)
    expected_paths = sorted(pointer + '/' + field for pointer in ROW_PATHS for field in FIELDS)
    check('exactly the twenty expected WC49 map metadata paths changed', sorted(actual_paths) == expected_paths)
    normalised = deepcopy(candidate)
    accepted_paths = []
    for pointer in ROW_PATHS:
        try:
            old_row, new_row = row_at(supplier_before, pointer), row_at(supplier_after, pointer)
        except (KeyError, IndexError, TypeError, ValueError):
            check(pointer + ' has the reviewed WC49 row', False)
            continue
        is_wc49 = old_row.get('ref') == new_row.get('ref') == 'WC49'
        check(pointer + ' belongs to WC49 in both captures', is_wc49)
        business_before = {k: v for k, v in old_row.items() if k not in FIELDS and k != 'receipts1006'}
        business_after = {k: v for k, v in new_row.items() if k not in FIELDS and k != 'receipts1006'}
        check(pointer + ' quantities, assets, dates and other row values unchanged', business_before == business_after)
        for field in FIELDS:
            valid = is_wc49 and old_row.get(field) == old_metadata[field] and new_row.get(field) == new_metadata[field]
            check(pointer + '/' + field + ' matches exact old and revised source values', valid)
            if valid:
                row_at(normalised['domains']['supplier'], pointer)[field] = old_row[field]
                accepted_paths.append(pointer + '/' + field)

    # Re-run the established 72-check comparison after reverting only individually source-verified metadata in memory.
    # All money, native state, quantities, supplier events, rates and operational fields remain fully compared.
    original_comparator = CONTROL / 'v10.17_quantity_reference_LIVE/financials/compare1017.py'
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='financial1021-', dir=output_path.parent) as temp:
        normalised_path, original_report = Path(temp) / 'candidate-metadata-normalised.json', Path(temp) / 'original-comparison.json'
        normalised_path.write_text(json.dumps(normalised))
        previous_args = sys.argv[:]
        try:
            sys.argv = [str(original_comparator), str(base_path), str(normalised_path), str(original_report)]
            with redirect_stdout(io.StringIO()):
                try:
                    runpy.run_path(str(original_comparator), run_name='__main__')
                except SystemExit as exc:
                    if exc.code not in (None, 0, 1):
                        raise
        finally:
            sys.argv = previous_args
        established = json.loads(original_report.read_text())
    checks = established['checks'] + checks
    result = {
        'author': 'Andrew Fisher',
        'checks': checks,
        'failures': [c for c in checks if not c['pass']],
        'unexpectedDifferences': established['differences'],
        'acceptedMetadata': {'reference': 'WC49', 'rows': len(ROW_PATHS), 'fieldsPerRow': len(FIELDS), 'count': len(accepted_paths), 'paths': sorted(accepted_paths)},
        'nativeVersion': candidate['nativeVersion'],
        'baselineSha': base.get('pageSha'),
        'candidateSha': candidate.get('pageSha'),
        'evidenceHashes': {'baselineCapture': digest(raw_base), 'candidateCapture': digest(raw_candidate), 'gate6PositionSource': digest(source_bytes), 'establishedComparator': digest(original_comparator.read_bytes())},
        'capturesUnmodified': base_path.read_bytes() == raw_base and candidate_path.read_bytes() == raw_candidate,
    }
    output_path.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'author': 'Andrew Fisher', 'checks': len(checks), 'failures': len(result['failures']), 'acceptedMapMetadataChanges': len(accepted_paths), 'nativeVersion': result['nativeVersion'], 'report': str(output_path)}))
    return not result['failures'] and result['capturesUnmodified']


if __name__ == '__main__':
    if len(sys.argv) != 4:
        raise SystemExit('Usage: compare_financial1021.py baseline.json candidate.json private-report.json')
    if not compare(*(Path(arg).resolve() for arg in sys.argv[1:])):
        raise SystemExit(1)
