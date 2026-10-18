#!/usr/bin/env python3
"""Author: Andrew Fisher. Exact-base 3D library recovery component for the v8.29 integration."""
from pathlib import Path
import argparse
import hashlib
import os
import sys

ROOT = Path(__file__).resolve().parent
BASE_SHA = '7edf7b5ac55c1cf5f60f35b72d577d8e257854e2e482b1b93796e498edcf5ac4'
TOOLCHAIN = Path(os.environ.get('GC500_TOOLCHAIN', ROOT.parent.parent / 'toolchain'))
sys.path.insert(0, str(TOOLCHAIN))
from rep import rep

def apply(text):
    if 'function loadCesiumLibrary()' in text:
        raise ValueError('Loader patch is already present')
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA:
        raise ValueError('Expected the frozen, exact v813 map asset')
    def once(old, new, name):
        nonlocal text
        text = rep(text, old, new, name, 'poc3d/index.html')
    once('<script src="https://cdn.jsdelivr.net/npm/cesium@1.131.0/Build/Cesium/Cesium.js"></script>\n', '', 'Remove parser-blocking library include')
    once("let bootPhase813 = 'library', bootTimer813 = 0, graphicsLost813 = false, terminalProblem813 = null;",
         (ROOT / 'cesium_library_loader.js').read_text() + "\nlet bootPhase813 = 'library', bootTimer813 = 0, graphicsLost813 = false, terminalProblem813 = null;",
         'Install one owned library attempt')
    once("const DDC = typeof Cesium === 'undefined' ? null : {base: new Cesium.DistanceDisplayCondition(0, PHONE ? 450 : 650), group: new Cesium.DistanceDisplayCondition(0, 1500), all: new Cesium.DistanceDisplayCondition(0, 1e7)};",
         'let DDC = null;', 'Defer library-dependent label conditions')
    once("if (!window.Cesium) { bootProblem813('library'); return; }",
         "    await loadCesiumLibrary();\n    DDC = {base: new Cesium.DistanceDisplayCondition(0, PHONE ? 450 : 650), group: new Cesium.DistanceDisplayCondition(0, 1500), all: new Cesium.DistanceDisplayCondition(0, 1e7)};",
         'Wait for the library before label conditions, access or scene startup')
    return text

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('base', type=Path)
    p.add_argument('output', type=Path)
    args = p.parse_args()
    output = apply(args.base.read_text())
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(output)
    print(hashlib.sha256(output.encode()).hexdigest())
