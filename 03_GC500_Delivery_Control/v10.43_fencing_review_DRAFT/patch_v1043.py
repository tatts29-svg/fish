"""Author: Andrew Fisher. Apply a privately reviewed fencing evidence bundle.
GC500_FENCING_REVIEW names the private JSON input. No source records are committed.
"""
import json
import os
import re
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep
MARK = '/* fencing-review-1043 */'

def read_const(html, name):
    prefix = 'const ' + name + ' = '
    if html.count(prefix) != 1:
        raise ValueError('Expected one ' + name)
    start = html.index(prefix) + len(prefix)
    value, size = json.JSONDecoder().raw_decode(html[start:])
    return value, start, start + size

def replace_const(html, name, expected, replacement):
    value, start, end = read_const(html, name)
    if value != expected:
        raise ValueError(name + ' differs from reviewed base')
    return html[:start] + json.dumps(replacement, ensure_ascii=False, separators=(',', ':')) + html[end:]

def patch(html, review):
    if MARK in html:
        raise ValueError('Review already applied')
    if review.get('schema') != 1:
        raise ValueError('Unsupported review bundle')
    if "+ ' · v10.40'" not in html and "+ ' · v10.42'" not in html:
        raise ValueError('Expected reviewed v10.40 or v10.42 base')
    for name in ['FENCE_PROGRESS848', 'DATA']:
        before, _, _ = read_const(html, name)
        if name == 'DATA':
            after = dict(before)
            if before['fence_ccb_review847'] != review['ccb_before']:
                raise ValueError('CCB review base changed')
            after['fence_ccb_review847'] = review['ccb_after']
        else:
            if before != review['progress_before']:
                raise ValueError('Physical-work review base changed')
            after = review['progress_after']
        html = replace_const(html, name, before, after)
    # Person fields only: retain HTML escaping and leave notes/source records intact.
    for old, new in [
        ('escape(row.areaStatus.by)', 'escape(recorderDisplay772(row.areaStatus.by))'),
        ('E(d.by)', 'E(recorderDisplay772(d.by))'),
        ('E(p.by)', 'E(recorderDisplay772(p.by))'),
    ]:
        html = rep(html, old, new, 'Person-name display', 'v10.43')
    # esc1022 is unique to the night-service view and print; only its by fields change.
    pattern = r'esc1022\(((?:t|s|r|sign|audit)\.by)\)'
    matches = re.findall(pattern, html)
    if len(matches) != 8:
        raise ValueError('Night-service person fields changed: ' + str(len(matches)))
    html = re.sub(pattern, r'esc1022(recorderDisplay772(\1))', html)
    old = "+ ' · v10.42'" if "+ ' · v10.42'" in html else "+ ' · v10.40'"
    html = rep(html, old, "+ ' · v10.43'", 'Release footer', 'v10.43')
    return html.replace('</body>', MARK + '\n</body>', 1)

if __name__ == '__main__':
    file = Path(sys.argv[1])
    review = json.loads(Path(os.environ['GC500_FENCING_REVIEW']).read_text())
    file.write_text(patch(file.read_text(), review))
    print('Reviewed fencing evidence and person-name displays applied; private inputs retained separately.')
