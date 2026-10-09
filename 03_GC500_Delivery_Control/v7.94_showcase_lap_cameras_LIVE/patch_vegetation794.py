#!/usr/bin/env python3
"""Author: Andrew Fisher. Refine accepted tree crowns with a fixed triangle allocation."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def apply(text, path):
    if 'G.vegetation794=' in text:
        raise SystemExit('v7.94 vegetation already applied')
    prior = HERE.parent / 'v7.92_showcase_photo_refinement_LIVE' / 'vegetation792_src.js'
    return rep(text, prior.read_text(), (HERE / 'vegetation794_src.js').read_text(),
               'v7.94 split broadleaf branch tufts at unchanged source trees', path)


if __name__ == '__main__':
    target = Path(sys.argv[1])
    target.write_text(apply(target.read_text(), str(target)))
