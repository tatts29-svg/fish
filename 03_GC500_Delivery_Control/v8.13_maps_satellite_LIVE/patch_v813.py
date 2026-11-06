#!/usr/bin/env python3
"""Author: Andrew Fisher. Keep the map and its controls inside the visible dashboard."""
from pathlib import Path
import hashlib
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

BASE_SHA256 = 'cd3159be30b7ec931d5ffa907b90b585e6851a2210a2e7230d3fde74b0b46bee'

def apply(text, path='GC500 page'):
    if 'function expObserve813(' in text:
        raise SystemExit('v8.13 already applied')
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA256:
        raise SystemExit('v8.13 requires the verified v8.12 live page; rebuild and retest if live moves')
    start = text.index('function expSize(){')
    end = text.index('function expFullToggle(on){', start)
    text = rep(text, text[start:end].rstrip(), (ROOT / 'map_viewport813_src.js').read_text().rstrip(),
               'Fit the explorer to the actual visible map area', path)
    text = rep(text, 'window.addEventListener(\'resize\', () => expSize());',
               "window.addEventListener('resize', () => expSize());\nif (window.visualViewport) window.visualViewport.addEventListener('resize', () => expSize());",
               'Follow phone browser and keyboard viewport changes', path)
    text = rep(text, '.expcard .expwrap{border-radius:12px}',
               '.expcard .expwrap{border-radius:12px;min-height:0}\n/* The map has no record editing controls; the shared footer already identifies a view link. Keep the unknown-capability notice. */\n#pane-map > .rochip.view{display:none}',
               'Allow the map to fit short screens', path)
    start = text.index('function expFlush3d(){')
    end = text.index('function expTools(){', start)
    text = rep(text, text[start:end].rstrip(), (ROOT / 'map_pending813_src.js').read_text().rstrip(),
               'One bounded 3D opening request', path)
    text = rep(text, "function expOpen2d(){ if (!expOn()) return false;",
               "function expOpen2d(){ expCancel3d813(); if (!expOn()) return false;",
               'Cancel a pending 3D opening when choosing 2D', path)
    return rep(text, '<meta name="gc500-release" content="v8.12">',
               '<meta name="gc500-release" content="v8.13">', 'Map upgrade release', path)

if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text(encoding='utf-8'), str(page)), encoding='utf-8')
    print('v8.13 applied: map viewport follows the visible dashboard')
