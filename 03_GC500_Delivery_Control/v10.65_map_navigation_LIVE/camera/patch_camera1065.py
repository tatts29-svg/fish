#!/usr/bin/env python3
"""Author: Andrew Fisher. Manual zoom takes over an existing reference flight."""
from pathlib import Path
import argparse
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'toolchain'))
from rep import rep

OLD = """function zoomBy(factor, x = sw / 2, y = sh / 2) {
  stopFling(); cancelAnimationFrame(rotAnim); rotAnim = 0;"""
NEW = """function zoomBy(factor, x = sw / 2, y = sh / 2) {
  /* camera1065: manual zoom takes over a reference flight; an existing wheel goal still accumulates. */
  cancelAnimationFrame(gotoAnim887); gotoAnim887 = 0;
  stopFling(); cancelAnimationFrame(rotAnim); rotAnim = 0;"""


def apply(text, path='explorer.js'):
    if 'camera1065:' in text:
        raise ValueError('Camera v10.65 is already present')
    if 'Pyramid recovery v10.64' not in text:
        raise ValueError('Expected current v10.64 explorer source')
    return rep(text, OLD, NEW, 'manual zoom cancels the reference flight', path, True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    args.output.write_text(apply(args.source.read_text(), str(args.source)))
