#!/usr/bin/env python3
"""Author: Andrew Fisher. Existing Special Editions visual refinement only."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def apply(text, path):
    if 'G.plantVisuals800=true;' in text:
        raise SystemExit('v8.00 plant visuals already applied')
    for marker in ['G.plantKit=function(level){', 'G.plantModel=function(kind,quality){',
                   'G.vmsModel=function(quality){', 'G.looModel=function(quality){']:
        if text.count(marker) != 1:
            raise SystemExit('v8.00 plant visuals require the existing six Special Edition models')
    anchor = 'G.setVehicle=function(kind){'
    return rep(text, anchor, (HERE / 'plant800_src.js').read_text() + '\n' + anchor,
               'Refine existing selectable plant and trailer models', path)


if __name__ == '__main__':
    path = Path(sys.argv[1])
    path.write_text(apply(path.read_text(), str(path)))
