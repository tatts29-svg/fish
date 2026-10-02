#!/usr/bin/env python3
"""Author: Andrew Fisher. Complete-lap playback and road-aware Showcase cameras."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

def apply(text, path):
    if '/* Showcase complete lap v7.94 */' in text:
        raise SystemExit('v7.94 already applied')
    if 'G.photoRefinement792=' not in text:
        raise SystemExit('v7.94 requires the live v7.92 photo refinement or later')
    names = ['camera794_src.js', 'scenery794_src.js', 'playback794_src.js', 'showcase794_src.js']
    source = '\n'.join((HERE / name).read_text() for name in names)
    styles = (HERE / 'showcase794_src.css').read_text()
    addition = ('<!-- Showcase complete lap v7.94 -->\n<style>\n' + styles +
                '\n</style>\n<script>\n/* Showcase complete lap v7.94 */\n' + source + '\n</script>\n')
    return rep(text, '\n</body></html>\n', '\n' + addition + '</body></html>\n', 'Complete-lap presentation and cameras', path)

if __name__ == '__main__':
    path = Path(sys.argv[1])
    path.write_text(apply(path.read_text(), str(path)))
    print('v7.94 complete-lap Showcase applied')
