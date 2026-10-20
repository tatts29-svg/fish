#!/usr/bin/env python3
"""Author: Andrew Fisher. Publish the approved opt-in Showcase track detail on v7.84."""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from patch_v781 import apply


def release(text, path):
    if 'G.preview781=' in text:
        raise SystemExit('Track detail is already installed; build from the unmodified live base')
    if 'const WAYIN784 = ' not in text:
        raise SystemExit('v7.85 requires the live v7.84 directions release')
    return apply(text, path)


if __name__ == '__main__':
    path = Path(sys.argv[1])
    path.write_text(release(path.read_text(), str(path)))
    print('v7.85 applied: approved track detail, smooth shadows and working Showcase cameras')
