"""Author: Andrew Fisher. Responsiveness only; current financial rules unchanged."""
import hashlib
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep
from navigation1243_patch import patch as navigation
from identity_index1243_patch import patch as identity
from local_reads1243_patch import patch as reads
from event_window1243_patch import patch as event_window
from startup_alignment1243_patch import patch as alignment


def patch(text, path, expected_base_sha=None):
    expected = expected_base_sha or os.environ.get('GC500_V1243_BASE_SHA256', '')
    if not re.fullmatch('[a-f0-9]{64}', expected) or hashlib.sha256(text.encode()).hexdigest() != expected:
        raise ValueError('Exact reviewed live base SHA-256 required')
    if '/* responsiveness1243:' in text:
        raise ValueError('v12.43 responsiveness already applied')
    footers = re.findall(r"\+' · v(12\.42\.\d+)';", text)
    if len(footers) != 1:
        raise ValueError('Expected one reviewed v12.42.x footer')
    for helper in (navigation, identity, reads, event_window, alignment):
        text = helper(text, path)
    old = ' if (changed) countUpFigures(tab); /* v5.92 */'
    new = ' /* responsiveness1243: show the final figures immediately; avoid scanning every bold number for decorative counting. */'
    if text.count(old) != 1:
        raise ValueError('Number-animation navigation hook changed')
    text = rep(text, old, new, 'immediate final figures on navigation', path)
    old = "+' · v" + footers[0] + "';"
    return rep(text, old, "+' · v12.43';", 'release footer', path)


if __name__ == '__main__':
    target = Path(sys.argv[1])
    target.write_text(patch(target.read_text(), str(target)))
    print('v12.43 responsiveness applied; financial rules retained')
