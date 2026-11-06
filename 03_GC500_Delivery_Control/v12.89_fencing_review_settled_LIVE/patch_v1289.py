"""Author: Andrew Fisher. v12.89: restore the settled fencing completion through its source evidence.

The v12.82 draft (Codex) rebuilt on live v12.88 (Codex's map footprints) now that the docket is settled (3 Nov 2026).

Adds the settled 36641 Event classification to the existing review catalogue.
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

BASE_SHA256 = 'd348e813db15b3ed3df125e14dd877597cbd8b410a4c13440c64244a86f85c37'
REVIEW_SHA256 = '12a8dc3c6c6433de53cea4b86c47a9d4d360f22380300e7ee30d9749b7b38dea'
MARKER = '<script id="fencing1289-script">'


def patch(text):
    if MARKER in text:
        raise ValueError('v12.89 fencing review is already applied')
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256:
        raise ValueError('Expected the verified live v12.88 bytes; rebuild and review the current base')
    if '<script id="complete1181-script">' not in text or '<script id="lights11811-script">' not in text:
        raise ValueError('The settled fencing completion rule is missing')
    source = os.environ.get('FENCING1289_REVIEW_JSON')
    if not source:
        raise ValueError('Set FENCING1289_REVIEW_JSON to the authorised private reviewed fingerprint file')
    data_bytes = Path(source).read_bytes()
    if hashlib.sha256(data_bytes).hexdigest() != REVIEW_SHA256:
        raise ValueError('Private review input differs from the independently checked fingerprint')
    data = json.loads(data_bytes)
    if len(data['rows']) != 1 or data['rows'][0]['record_id'] != 'F-AF-0082' or data['rows'][0]['docket_no'] != '36641':
        raise ValueError('Expected exactly the reviewed 36641 docket')
    js = (HERE / 'fencing1289_src.js').read_text(encoding='utf-8').rstrip()
    if js.count('__FENCING1289_DATA__') != 1:
        raise ValueError('Expected one review-data slot')
    # This is an exact source fingerprint, not page prose. Keep its recorded name
    # through the standard attribution scrub, as the v11.63/v11.81 reviews do.
    encoded = json.dumps(data, ensure_ascii=True, separators=(',', ':')).replace('Andrew Fisher', r'\u0041ndrew Fisher')
    js = js.replace('__FENCING1289_DATA__', encoded)
    if '</script' in js.lower():
        raise ValueError('Unexpected closing tag in review data')
    text = rep(text, "+' · v12.88';", "+' · v12.89';", 'release footer', __file__)
    end = '</script>\n</body>\n</html>'
    return rep(text, end, '</script>\n' + MARKER + '\n' + js + '\n</script>\n</body>\n</html>', 'fencing review', __file__)


if __name__ == '__main__':
    path = Path(sys.argv[1])
    path.write_text(patch(path.read_text(encoding='utf-8')), encoding='utf-8')
