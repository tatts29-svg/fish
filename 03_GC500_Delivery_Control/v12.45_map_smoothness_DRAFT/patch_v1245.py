"""Author: Andrew Fisher. Preserve loaded map tiles and reuse unchanged SVG images."""
import hashlib
import os
import re
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

def patch(text, path='page', expected_base_sha=None):
    expected = expected_base_sha or os.environ.get('GC500_V1245_BASE_SHA256', '')
    if not re.fullmatch(r'[a-f0-9]{64}', expected) or hashlib.sha256(text.encode()).hexdigest() != expected:
        raise ValueError('v12.45 requires the exact reviewed base SHA-256')
    if 'finishTiles1245' in text or 'tileImages1245' in text:
        raise ValueError('v12.45 already applied')
    footers = re.findall(r"\+' · v12\.43(?:\.1)?';", text)
    if len(footers) != 1:
        raise ValueError('v12.45 requires reviewed v12.43 or v12.43.1')
    for stem in ('drawing_tiles1245', 'closure_tiles1245', 'removal_tiles1245', 'removal_apply1245', 'satellite_tiles1245', 'satellite_apply1245', 'removal_pins_apply1245', 'satellite_pins_apply1245'):
        before = (ROOT / (stem + '_before.js')).read_text()
        after = (ROOT / (stem + '.js')).read_text()
        # The native closure excerpt has no terminal newline in its boundary.
        if stem != 'drawing_tiles1245':
            before, after = before.rstrip('\n'), after.rstrip('\n')
        if text.count(before) != 1:
            raise ValueError(stem + ': exact source anchor does not occur once')
        text = text.replace(before, rep(before, before, after, stem, path), 1)
    return text.replace(footers[0], rep(footers[0], footers[0], "+' · v12.45';", 'footer', path), 1)

if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(patch(page.read_text(), str(page)))
    print('patch_v1245 applied')
