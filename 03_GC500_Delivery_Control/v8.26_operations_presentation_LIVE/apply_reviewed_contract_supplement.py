"""Author: Andrew Fisher. Apply one privately reviewed accessory-source payload.

Generic source patch only. The private payload is required and is never embedded
in this implementation. No service calls or operational-record writes occur.
"""
import argparse
import copy
import hashlib
import json
import re
from pathlib import Path


def apply_reviewed_contract_supplement(text, payload):
    match = re.search(r'const DATA = (\{.*?\});\n', text)
    if not match:
        raise ValueError('Native DATA source not found')
    data = json.loads(match.group(1))
    source = data['rental_on_hire']
    before = copy.deepcopy(source)
    row = copy.deepcopy(payload['row'])
    identity = (str(row['rental_contract']), int(row['line']))
    key = row['match']['key']
    if row.get('family') != 'accessory' or row.get('kind') != 'generator accessory':
        raise ValueError('Only a reviewed generator-accessory source addition is supported')
    if row.get('rate_1') is not None or row.get('delivered') is not False:
        raise ValueError('Unrated pending source must remain unknown and pending')
    if len(source['rows']) != payload['expected_source_rows']:
        raise ValueError('Source row count changed; review and rebuild')
    if any((str(r['rental_contract']), int(r['line'])) == identity for r in source['rows']):
        raise ValueError('Contract line already present')
    if any(str(r.get('asset_no')) == row['asset_no'] for r in source['rows']):
        raise ValueError('Accessory asset already present on a contract line')
    if not any(a['key'] == key and payload['anchor_asset_number'] in a['asset_numbers'] for a in data['assets']):
        raise ValueError('Reviewed anchor no longer matches the existing reference')
    source['rows'].append(row)
    contract = next(c for c in source['contracts'] if str(c['rental_contract']) == identity[0])
    contract['lines'] += 1
    contract['matched'] += 1
    contract['plant_numbers'] = sorted(contract['plant_numbers'] + [row['asset_no']])
    for field, value in [('locations', row['location']), ('delivery_numbers', row['delivery_number'])]:
        if value and value not in contract[field]:
            contract[field] = sorted(contract[field] + [value])
    source['assignments'][key]['lines'].append(identity[0] + '/' + str(identity[1]))
    source['summary']['lines'] += 1
    source['summary']['plant_numbers'] += 1
    source['summary']['same_delivery_docket'] += 1
    source['summary']['numbers_the_schedule_did_not_have'] = sorted(source['summary']['numbers_the_schedule_did_not_have'] + [row['asset_no']])
    source['supplements'] = list(source.get('supplements') or []) + [payload['supplement']]
    assert source['rows'][:-1] == before['rows']
    original = json.loads(match.group(1))
    assert {k: v for k, v in data.items() if k != 'rental_on_hire'} == {k: v for k, v in original.items() if k != 'rental_on_hire'}
    replacement = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    result = text[:match.start(1)] + replacement + text[match.end(1):]
    # Preserve accessory unit handling while attributing its source gap to power.
    # A distinct kind avoids the generator model/card-rate fallback.
    for name, category in [('STREAM_OF_KIND', 'power'), ('PLATE_OF_KIND', 'Generators')]:
        pattern = r'(const ' + name + r' = \{)(.*?)(\};)'
        mapping = re.search(pattern, result, flags=re.S)
        if not mapping:
            raise ValueError('Native classification map not found: ' + name)
        entry = "'generator accessory': '" + category + "'"
        if "'generator accessory':" in mapping.group(2):
            if entry not in mapping.group(2):
                raise ValueError('Generator-accessory classification changed; review')
        else:
            result = result[:mapping.end(1)] + entry + ', ' + result[mapping.end(1):]
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('input_html', type=Path)
    parser.add_argument('private_payload', type=Path)
    parser.add_argument('output_html', type=Path)
    parser.add_argument('--payload-sha256', required=True)
    args = parser.parse_args()
    raw = args.private_payload.read_bytes()
    if hashlib.sha256(raw).hexdigest() != args.payload_sha256:
        raise SystemExit('Private payload checksum mismatch')
    result = apply_reviewed_contract_supplement(args.input_html.read_text(), json.loads(raw))
    args.output_html.write_text(result)
    print(hashlib.sha256(result.encode()).hexdigest())
