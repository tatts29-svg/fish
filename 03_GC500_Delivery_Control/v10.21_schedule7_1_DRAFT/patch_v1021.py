"""Author: Andrew Fisher. Schedule 7.1 and the 15 Oct iEDM programme issue, read and compared: the review blocks go into
DATA, and the three new programme "Complete" marks (CON WK 2!I101:I103 for GN13, P69 and P45) show as documentary
evidence in the existing drawer fold. No completion, date, quantity, position, rate or charge is imported. Applies only
to the exact live v10.18 page.

    python3 patch_v1021.py path/to/page.html
"""
import hashlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASE_SHA = '2d09fa44794596c52c54d41aed6f98d16fbb6f5ff1ccf608f9d275874559785d'
# Also accepted: the v10.20 candidate (patch_v1019 then patch_v1020 on live v10.18), so the three releases can go up as one page.
BASES = {BASE_SHA: 'live v10.18', '806800df57e8ac7d82dfec9233db0d70e9dcbfcd0b42ea5c25e7bd453293ed29': 'v10.20 candidate'}
SOURCE = HERE / 'programme1021.js'
REVIEW = HERE / 'programme1021.json'

# The DATA line ends with the last v9.51 programme row (P12). The two review blocks are appended after it, so every
# other byte of DATA stays exactly as it is; nothing is re-serialised.
DATA_TAIL = '"completeDateAsWritten":"17th September","noteAsWritten":null,"operationalCompletionImported":false}]}};'
# The new script goes in immediately after the v9.51 infrastructure script, whose drawer hook calls
# infrastructure951Html by name at open time, so the wrapper below takes effect without touching that hook.
SCRIPT_ANCHOR = '</script>\n<script id="inventory960-script">'


def review_blocks():
    blocks = json.loads(REVIEW.read_text())
    assert list(blocks) == ['schedule_review1021', 'infrastructure_review1021']
    return ','.join('"%s":%s' % (k, json.dumps(v, ensure_ascii=False, separators=(',', ':'))) for k, v in blocks.items())


REPLACEMENTS = [
    ('Review blocks appended to DATA', DATA_TAIL, DATA_TAIL[:-2] + ',' + '%BLOCKS%' + '};'),
    ('15 Oct programme evidence script', SCRIPT_ANCHOR, '</script>\n<script id="programme1021">\n%SCRIPT%\n</script>\n<script id="inventory960-script">'),
    ('Release footer', "+ ' · v10.18'", "+ ' · v10.21'"),
]


def apply(html):
    if hashlib.sha256(html.encode()).hexdigest() not in BASES:
        raise ValueError('Requires exact live v10.18 or the v10.20 candidate; refuses a repeat or a wrong base')
    blocks = review_blocks()
    script = SOURCE.read_text().rstrip()
    assert script.startswith('/* Author: Andrew Fisher.'), 'the inserted script must open with the author line'
    footer_from = "+ ' · v10.20'" if html.count("+ ' · v10.20'") == 1 else "+ ' · v10.18'"
    for label, old, new in REPLACEMENTS:
        if label == 'Release footer':
            old = footer_from
        html = rep(html, old, new.replace('%BLOCKS%', blocks).replace('%SCRIPT%', script), label, 'v10.21')
    return html


if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text()))
    print('v10.21: Schedule 7.1 and 15 Oct programme review recorded; three programme Complete marks shown as evidence; no operational writes.')
