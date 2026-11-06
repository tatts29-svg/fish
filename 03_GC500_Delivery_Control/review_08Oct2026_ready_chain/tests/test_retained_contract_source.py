#!/usr/bin/env python3
"""Author: Andrew Fisher. Prove a UI/map release retains the live contract source.

Usage: python3 test_retained_contract_source.py <live-base.html> <candidate.html>
No network, file changes or raw contract/source values are emitted.
"""
import argparse
import json
from pathlib import Path
import re
import sys


def data_from_html(text):
    match = re.search(r'^\s*const DATA\s*=\s*', text, re.MULTILINE)
    if not match:
        raise ValueError('Embedded DATA declaration is missing')
    try:
        data, _ = json.JSONDecoder().raw_decode(text[match.end():])
    except (ValueError, TypeError):
        raise ValueError('Embedded DATA is not valid JSON') from None
    if not isinstance(data, dict):
        raise ValueError('Embedded DATA must be an object')
    return data


def checks(base_text, candidate_text):
    base, candidate = data_from_html(base_text), data_from_html(candidate_text)
    result = []
    for key in ('rental_on_hire', 'plant_lines'):
        result.append(('DATA.' + key + ' exactly preserves the live base',
                       key in base and key in candidate and base[key] == candidate[key]))
    original = base.get('rental_on_hire')
    final = candidate.get('rental_on_hire')
    provenance = ('record_id', 'supplied_on', 'workbook', 'source', 'supplements')
    result.append(('contract source attribution and supplements remain unchanged',
                   isinstance(original, dict) and isinstance(final, dict) and
                   all((key in original) == (key in final) and original.get(key) == final.get(key)
                       for key in provenance)))
    # A later footer can mask v895's data-only refresh. Reject both its release
    # marker and the exact source identifiers, even outside rental_on_hire.
    markers = (r'\bv8\.95\b', r'\bv895\b', r'\bbaseplan895\b',
               r'Baseplan_SuperCars_07Oct\.xlsx', r'baseplan-contracts-2026-10-07',
               r'8a18bd1f0df331d339d0fa27d81bdf22b238b1de0f1f5f5c342b208eed4b3bd7')
    result.append(('no v895 refresh marker or replacement-source attribution is present',
                   not any(re.search(pattern, candidate_text, re.IGNORECASE) for pattern in markers)))
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('base', type=Path)
    parser.add_argument('candidate', type=Path)
    args = parser.parse_args(argv)
    try:
        result = checks(args.base.read_text(encoding='utf-8-sig'), args.candidate.read_text(encoding='utf-8-sig'))
    except (OSError, ValueError):
        print('FAIL contract preservation inputs could not be validated')
        return 1
    for label, passed in result:
        print(('PASS ' if passed else 'FAIL ') + label)
    return 0 if all(passed for _, passed in result) else 1


if __name__ == '__main__':
    sys.exit(main())
