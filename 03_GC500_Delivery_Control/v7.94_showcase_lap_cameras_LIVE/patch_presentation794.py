#!/usr/bin/env python3
"""Author: Andrew Fisher. Keep road-camera tyre wisps readable without changing simulation."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def apply(text, path):
    if 'const roadSmoke794=' in text:
        raise SystemExit('v7.94 road-camera smoke presentation already applied')
    if 'G.photoRefinement792=' not in text:
        raise SystemExit('v7.94 smoke presentation requires v7.92')
    return rep(text,
        ' const rr=(.22+age*T.smokeGrow)*Sx*(.60+s2.r*.85)*(s2.k||1),p0=s2.p;\n'
        ' let a2=Math.min(.95,Math.pow(1-age,1.55)*T.smokeAlpha*(s2.a||1)*dim);',
        ' /* Road-camera presentation: retain tyre wisps while revealing the circuit.\n'
        '    Particle generation, lifetimes, simulation and special views stay unchanged. */\n'
        ' const roadSmoke794=!!(S.camera794&&S.camera794.active);\n'
        ' const rr=(.22+age*T.smokeGrow)*Sx*(.60+s2.r*.85)*(s2.k||1)*(roadSmoke794?.68:1),p0=s2.p;\n'
        ' let a2=Math.min(.95,Math.pow(1-age,1.55)*T.smokeAlpha*(s2.a||1)*dim)*(roadSmoke794?.30:1);',
        'Readable road-camera smoke', path)
