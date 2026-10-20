"""Author: Andrew Fisher. Apply only the reviewed, separate physical activities.

Private input is deliberately absent from this repository. Its exact checksum and
the existing catalogue guard bind this adapter to the independently read papers.
The already-applied category correction, records and calculation code are untouched.
"""
import hashlib
import json
import os
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

AUTHOR = 'Author: Andrew Fisher'
MARK = '/* fencing-evidence-1071; Author: Andrew Fisher */'
APPROVED_INPUT_SHA256 = '4a622f170138fca65f4f9bdc5565ddb713c649e31a74ee131a5806f8337f3ac4'


def read_bundle(path):
    raw = Path(path).read_bytes()
    if hashlib.sha256(raw).hexdigest() != APPROVED_INPUT_SHA256:
        raise ValueError('Private evidence input is not the reviewed exact bundle')
    bundle = json.loads(raw)
    validate_bundle(bundle)
    return bundle


def validate_bundle(bundle):
    if set(bundle) != {'schema', 'progress_before', 'progress_after'} or bundle['schema'] != 1:
        raise ValueError('Expected the physical-activity-only evidence bundle')
    before, after = bundle['progress_before'], bundle['progress_after']
    if set(before) != set(after) or set(before) != {'schema', 'author', 'base_sha256', 'sources', 'operations', 'plan_allowances'}:
        raise ValueError('Catalogue shape changed')
    for key in set(before) - {'sources', 'operations'}:
        if before[key] != after[key]:
            raise ValueError('Existing catalogue metadata or plan allowances changed')
    for key, extra in [('sources', 3), ('operations', 4)]:
        old, new = before[key], after[key]
        if not isinstance(old, list) or not isinstance(new, list) or len(new) != len(old) + extra or new[:len(old)] != old:
            raise ValueError('Only the reviewed appended sources and activities are allowed')
        if len({item['id'] for item in new}) != len(new):
            raise ValueError('Duplicate catalogue identity')
    additions = after['operations'][len(before['operations']):]
    if Counter(op['type'] for op in additions) != {'scrim_existing': 3, 'relocation': 1}:
        raise ValueError('Installation quantities and other activity types are outside this release')
    source_ids = {source['id'] for source in after['sources'][len(before['sources']):]}
    if {sid for op in additions for sid in op['source_ids']} != source_ids:
        raise ValueError('Appended source identities do not match the reviewed activities')


def catalogue_span(html):
    prefix = 'const FENCE_PROGRESS848 = '
    if html.count(prefix) != 1:
        raise ValueError('Expected exactly one native physical-activity catalogue')
    start = html.index(prefix) + len(prefix)
    value, length = json.JSONDecoder().raw_decode(html[start:])
    if html[start + length:start + length + 1] != ';':
        raise ValueError('Native catalogue declaration changed')
    return value, start, start + length


def apply_catalogue(html, bundle):
    """Pure catalogue replacement, also used by read-only native parity tests."""
    validate_bundle(bundle)
    current, start, end = catalogue_span(html)
    if current != bundle['progress_before']:
        raise ValueError('Native physical-activity catalogue differs from the reviewed base')
    # Escape less-than so a source note cannot terminate its containing script.
    replacement = json.dumps(bundle['progress_after'], ensure_ascii=True, separators=(',', ':')).replace('<', '\\u003c')
    # Match the native catalogue's existing encoding. These names are exact
    # record-signature fields, not new UI attribution: the shared build scrubber
    # must not rewrite them and invalidate the source evidence after testing.
    replacement = replacement.replace('Andrew Fisher', '\\u0041ndrew Fisher')
    return html[:start] + replacement + html[end:]


def patch(html, bundle, path='<page>'):
    if MARK in html:
        raise ValueError('Fencing evidence already applied')
    if html.count("+ ' · v10.70'") != 1 or html.count('id="departure1070-script"') != 1:
        raise ValueError('Expected the final v10.70 page')
    for boundary in ['function fenceProgressEvidence848(asOf, options)', 'function todayFencingSummary848(asOf)']:
        if html.count(boundary) != 1:
            raise ValueError('Expected exactly one current native evidence boundary')
    result = apply_catalogue(html, bundle)
    # Shared rep supplies the uniqueness guard. Use the exact substring for the
    # replacement so its whitespace-tolerant matcher cannot trim adjacent bytes.
    rep(result, "+ ' · v10.70'", "+ ' · v10.71'", 'release footer', path)
    result = result.replace("+ ' · v10.70'", "+ ' · v10.71'", 1)
    return rep(result, '\n</body>\n</html>', '\n' + MARK + '\n</body>\n</html>', 'review marker', path)


if __name__ == '__main__':
    source = Path(sys.argv[1])
    destination = Path(sys.argv[2]) if len(sys.argv) > 2 else source
    bundle = read_bundle(os.environ['GC500_FENCING_EVIDENCE_BUNDLE'])
    destination.write_text(patch(source.read_text(), bundle, str(source)))
    print('Applied reviewed physical-activity catalogue; no record or pricing changes.')
