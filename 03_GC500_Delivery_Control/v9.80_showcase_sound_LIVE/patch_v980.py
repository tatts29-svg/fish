#!/usr/bin/env python3
"""Author: Andrew Fisher. Couple Showcase launch and exhaust to the same motion."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
sys.path.insert(0, str(HERE))
from rep import rep
from launch980 import apply_launch980
from audio980 import apply_audio980


def patch(s):
    if "+ ' · v9.80'" in s:
        raise ValueError('v9.80 already applied')
    if "+ ' · v9.79'" not in s or 'onsite-complete979' not in s:
        raise ValueError('Requires current live v9.79')
    s = apply_launch980(s)
    s = apply_audio980(s)
    return rep(s, "+ ' · v9.79'", "+ ' · v9.80'", 'Release footer', __file__)


if __name__ == '__main__':
    src = Path(sys.argv[1])
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else src
    out.write_text(patch(src.read_text()))
