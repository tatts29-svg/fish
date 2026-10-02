#!/usr/bin/env python3
"""Author: Andrew Fisher. Bounded selection of supported colour/depth samples."""
from pathlib import Path
import hashlib
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

START = 'G.addMSAA=function(gl,t,wanted){'
END = 'const freeTarget=G.freeTarget;'
ORIGINAL_SHA256 = '885a25c75fc9ff5f37932a0d0df86091b44c71021623b27132c9100a04cbaae9'
SELECTION = (' const choices=Array.from(available).filter(n=>n<=wanted&&n>1&&Array.from(depthAvailable).includes(n));\n'
             ' const samples=choices.length?Math.max(...choices):0;if(!samples)return;')
REPLACEMENT = ' const samples=G.selectSamples802(available,depthAvailable,wanted);if(!samples)return;'


def apply(text, path='Showcase HTML'):
    if 'G.selectSamples802=' in text:
        raise SystemExit('v8.02 multisample capability selection already applied')
    if text.count(START) != 1 or text.count(END) != 1:
        raise SystemExit('v8.02 multisample selection requires the reviewed existing target lifecycle')
    for marker in ('G.raceCarVisual800=', 'G.vehicleCamera800='):
        if marker not in text:
            raise SystemExit('v8.02 multisample selection requires the complete vehicle components')
    a = text.index(START)
    b = text.index(END, a)
    original = text[a:b]
    if hashlib.sha256(original.encode()).hexdigest() != ORIGINAL_SHA256:
        raise SystemExit('v8.02 multisample selection: allocation/lifecycle source differs from review')
    updated = rep(original, SELECTION, REPLACEMENT, 'Common colour/depth sample count', path)
    source = (HERE / 'aa802_src.js').read_text()
    return rep(text, original, source + updated, 'Bounded multisample capability selection', path)


if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text(), str(page)))
    print('v8.02 supported 2x/4x multisample selection applied')
