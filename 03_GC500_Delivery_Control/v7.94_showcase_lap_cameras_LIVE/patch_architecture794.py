#!/usr/bin/env python3
"""Author: Andrew Fisher. Bounded coastal facade depth on unchanged source shells."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def apply(text, path):
    if 'G.architectureRefinement794 = true;' in text:
        raise SystemExit('v7.94 architecture refinement already applied')
    if 'G.photoRefinement792=' not in text:
        raise SystemExit('v7.94 architecture refinement requires v7.92')
    before = (HERE.parent / 'v7.92_showcase_photo_refinement_LIVE' / 'architecture792_src.js').read_text()
    after = (HERE / 'architecture794_src.js').read_text()
    return rep(text, before, after, 'Coastal facade depth on existing source shells', path)


if __name__ == '__main__':
    path = Path(sys.argv[1])
    path.write_text(apply(path.read_text(), str(path)))
