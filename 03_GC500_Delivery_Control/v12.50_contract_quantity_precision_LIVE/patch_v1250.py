"""Author: Andrew Fisher. Preserve six published source quantities, without repricing."""
import hashlib
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

REVIEWED_BASE_SHA256 = '70fc77540686f3139be01049cf4d2c13e0b8e307d221f062e2177afb8586d19e'
REVIEWED_BASE_VERSION = '12.49'
SOURCE_SHA256 = 'b59cbfa3e54b3e639a5c260a725d404691c82fa83873322c43487522277ce847'
OLD_FOOTER = "+' · v12.49';"
NEW_FOOTER = "+' · v12.50';"
DATA_ANCHOR = 'const DATA = '


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def source():
    raw = (ROOT / 'contract_quantity1250.json').read_bytes()
    if digest(raw) != SOURCE_SHA256:
        raise ValueError('Reviewed public quantity source changed')
    return json.loads(raw)


def exact(text, old, new, label, path):
    if text.count(old) != 1:
        raise ValueError(label + ': expected one exact source anchor')
    replacement = rep(old, old, new, label, path)
    if replacement != new:
        raise ValueError(label + ': shared replacement changed its boundary')
    return text.replace(old, replacement, 1)


def source_rows(text):
    if text.count(DATA_ANCHOR) != 1:
        raise ValueError('Expected one embedded source dataset')
    data, _ = json.JSONDecoder().raw_decode(text.split(DATA_ANCHOR, 1)[1])
    return data['rental_on_hire']['rows']


def change_rows(text, backwards=False, path='page'):
    rows = source_rows(text)
    for rule in source()['rows']:
        matches = [r for r in rows if str(r.get('rental_contract')) == rule['contract']
                   and r.get('line') == rule['line']]
        if len(matches) != 1:
            raise ValueError('Expected exactly one reviewed contract/line identity')
        row = matches[0]
        before = rule['quantity'] if backwards else rule['old_quantity']
        after = rule['old_quantity'] if backwards else rule['quantity']
        expected = {'description': rule['description'], 'item': rule['item'],
                    'asset_no': 'LABOUR', 'item_type_code': 2,
                    'branch_code': rule['branch'], 'sales_analysis_code': rule['sales_code'],
                    'quantity': before, 'charge_line': False, 'subhired': False,
                    'asset_no_is_plant_number': False, 'register_type': None,
                    'start_date': None, 'rate_1': None}
        if any(row.get(k) != v for k, v in expected.items()):
            raise ValueError('Reviewed source identity, old quantity or pricing boundary changed')
        if row.get('match', {}).get('key') or row.get('match', {}).get('task_id'):
            raise ValueError('Event source line unexpectedly has an operational reference')
        old = json.dumps(row, ensure_ascii=False, separators=(',', ':'))
        updated = dict(row, quantity=after)
        new = json.dumps(updated, ensure_ascii=False, separators=(',', ':'))
        # Replace the exact original object, never reserialize the surrounding dataset.
        text = exact(text, old, new, 'source quantity ' + rule['contract'] + '/' + str(rule['line']), path)
    return text


def reverse(text):
    restored = exact(text, NEW_FOOTER, OLD_FOOTER, 'restore predecessor footer', 'page')
    restored = change_rows(restored, backwards=True)
    if digest(restored.encode('utf-8')) != REVIEWED_BASE_SHA256:
        raise ValueError('Reversal did not recover the exact reviewed predecessor')
    return restored


def patch(text, path='page', expected_base_sha=None, expected_base_version=None):
    expected = expected_base_sha or os.environ.get('GC500_V1250_BASE_SHA256', '')
    version = expected_base_version or os.environ.get('GC500_V1250_BASE_VERSION', '')
    if NEW_FOOTER in text:
        raise ValueError('v12.50 already applied')
    if expected != REVIEWED_BASE_SHA256 or digest(text.encode('utf-8')) != expected:
        raise ValueError('v12.50 requires the explicit exact reviewed predecessor SHA-256')
    if version != REVIEWED_BASE_VERSION or text.count(OLD_FOOTER) != 1:
        raise ValueError('v12.50 predecessor version/footer differs from review')
    if text.count('const previousContractCharge1249=') != 1:
        raise ValueError('Reviewed predecessor labour classification is missing')
    changed = change_rows(text, path=path)
    changed = exact(changed, OLD_FOOTER, NEW_FOOTER, 'release footer', path)
    if reverse(changed) != text:
        raise ValueError('Change escaped the six source quantities and footer')
    return changed


if __name__ == '__main__':
    page = Path(sys.argv[1])
    changed = patch(page.read_text(encoding='utf-8'), str(page))
    page.write_text(changed, encoding='utf-8')
    print('v12.50 source quantities applied; exact predecessor reversal verified')
