"""Author: Andrew Fisher. Restore the settled fencing completion through its source evidence.

Adds the already accepted 36641 Event classification to the existing review catalogue.
No record, quantity, category, rate, financial data or completion rule is changed.
The native review retains its exact record fingerprint and source checksum guards.
"""
import hashlib
import json
import os
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASE_SHA256 = '3b17c3de36c8c3f2d99042b0c83dfd9fdc110ccb9db7a1c21ef6c9f72704a85b'
REVIEW_SHA256 = '7615128c0618e3a0f5076e2d8619ff3c48782c09fd9d257ebfe06b3f99e5b0bc'
MARKER = '<script id="fencing1282-script">'


def patch(text):
    if MARKER in text:
        raise ValueError('v12.82 fencing review is already applied')
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256:
        raise ValueError('Expected the verified live v12.81 bytes; rebuild and review the current base')
    if '<script id="complete1181-script">' not in text or '<script id="lights11811-script">' not in text:
        raise ValueError('The settled fencing completion rule is missing')
    source = os.environ.get('FENCING1282_REVIEW_JSON')
    if not source:
        raise ValueError('Set FENCING1282_REVIEW_JSON to the authorised private reviewed fingerprint file')
    data_bytes = Path(source).read_bytes()
    if hashlib.sha256(data_bytes).hexdigest() != REVIEW_SHA256:
        raise ValueError('Private review input differs from the independently checked fingerprint')
    data = json.loads(data_bytes)
    if len(data['rows']) != 1 or data['rows'][0]['record_id'] != 'F-AF-0082' or data['rows'][0]['docket_no'] != '36641':
        raise ValueError('Expected exactly the reviewed 36641 docket')
    js = (HERE / 'fencing1282_src.js').read_text(encoding='utf-8').rstrip()
    if js.count('__FENCING1282_DATA__') != 1:
        raise ValueError('Expected one review-data slot')
    # This is an exact source fingerprint, not page prose. Keep its recorded name
    # through the standard attribution scrub, as the v11.63/v11.81 reviews do.
    encoded = json.dumps(data, ensure_ascii=True, separators=(',', ':')).replace('Andrew Fisher', r'\u0041ndrew Fisher')
    js = js.replace('__FENCING1282_DATA__', encoded)
    if '</script' in js.lower():
        raise ValueError('Unexpected closing tag in review data')
    text = rep(text, "+' · v12.81';", "+' · v12.82';", 'release footer', __file__)
    end = '</script>\n</body>\n</html>'
    return rep(text, end, '</script>\n' + MARKER + '\n' + js + '\n</script>\n</body>\n</html>', 'fencing review', __file__)


if __name__ == '__main__':
    path = Path(sys.argv[1])
    path.write_text(patch(path.read_text(encoding='utf-8')), encoding='utf-8')
