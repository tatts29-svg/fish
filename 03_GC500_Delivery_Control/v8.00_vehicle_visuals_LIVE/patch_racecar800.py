#!/usr/bin/env python3
"""Author: Andrew Fisher. Replace only the reviewed original race-car mesh module."""
from pathlib import Path
import hashlib
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

START = '/* GC500 v1.8 — original, purpose-built solid race coupe.'
END = '/* GC3D — bounded, simplified facade reflections'
ORIGINAL_SHA256 = 'e9d52aad1348ab1e9147a78ac5ee437e202a5c0f84489e27c90d1a93fc717b84'


def apply(text, path='Showcase HTML'):
    if 'G.raceCarVisual800=' in text:
        raise SystemExit('v8.00 race-car visual mesh already applied')
    if text.count(START) != 1 or text.count(END) != 1:
        raise SystemExit('v8.00 race-car visual mesh requires the reviewed original module')
    start = text.index(START)
    end = text.index(END, start)
    original = text[start:end]
    if hashlib.sha256(original.encode()).hexdigest() != ORIGINAL_SHA256:
        raise SystemExit('v8.00 race-car visual mesh: original module differs from reviewed source')
    return rep(text, original, (HERE / 'racecar800_src.js').read_text(),
               'Race-car surface and mechanical geometry', path)


if __name__ == '__main__':
    path = Path(sys.argv[1])
    path.write_text(apply(path.read_text(), str(path)))
