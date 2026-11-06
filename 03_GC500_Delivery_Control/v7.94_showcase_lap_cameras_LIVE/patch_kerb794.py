#!/usr/bin/env python3
"""Author: Andrew Fisher. Replace only the existing decorative kerb profile block."""
from pathlib import Path
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
START = ' /* The source\'s nominal kerb paint is several metres wide.'
END = '  // Original grid boxes, chequered start line, road-edge lines and rubber'
def apply(text, path):
    if '/* Shared visual kerb joins v7.94.' in text:
        raise SystemExit('v7.94 kerb joins already applied')
    if 'G.photoRefinement792=' not in text:
        raise SystemExit('v7.94 kerb joins require the v7.92 photo refinement')
    # The hosted build removes one leading space from each line. Derive the
    # exact expected baseline from its checked-in source, not a loose regex.
    source = (HERE.parent / 'v7.92_showcase_photo_refinement_LIVE' / 'track_detail792_src.js').read_text()
    old = source[source.index(START):source.index(END)]
    new = (HERE / 'kerb794_src.js').read_text()
    if old not in text:
        old = '\n'.join(line[1:] if line.startswith(' ') else line for line in old.split('\n'))
        new = '\n'.join(line[1:] if line.startswith(' ') else line for line in new.split('\n'))
    return rep(text, old, new, 'Continuous visual kerb joins and exterior normals', path)
if __name__ == '__main__':
    path = Path(sys.argv[1])
    path.write_text(apply(path.read_text(), str(path)))
