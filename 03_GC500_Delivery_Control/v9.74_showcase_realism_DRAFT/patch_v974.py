#!/usr/bin/env python3
"""Author: Andrew Fisher. Integrate Showcase realism on the exact v9.73 source."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
sys.path.insert(0, str(HERE))
from rep import rep
from dynamics974 import apply_dynamics974
from audio974 import apply_audio974
from source974 import apply_source974


def patch(s):
    if 'v9.74 — PROGRESSIVE TYRE LOAD' in s or "+ ' · v9.74'" in s:
        raise ValueError('v9.74 already applied')
    if "+ ' · v9.73'" not in s or 'source-reference973-script' not in s:
        raise ValueError('Requires current v9.73 source-reference release')
    s = apply_dynamics974(s)
    s = apply_audio974(s)
    s = apply_source974(s)
    s = rep(s, "+ ' · v9.73'", "+ ' · v9.74'", 'Release footer', __file__)
    return s


if __name__ == '__main__':
    src = Path(sys.argv[1])
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else src
    out.write_text(patch(src.read_text()))
