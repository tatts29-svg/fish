#!/usr/bin/env python3
"""Author: Andrew Fisher. Arrange the existing Explorer entry controls; retain its source content."""
from pathlib import Path
import hashlib
import re
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

BASE_SHA256 = 'dd4b44d2169f38ef46d056d488d9bfaa39fa6942233ad3f98a9750af8e9ef25f'


def apply(text, path='explorer/index.html'):
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA256:
        raise SystemExit('v8.13 entry requires the reviewed live Explorer index: ' + path)

    def once(old, new):
        nonlocal text
        if text.count(old) != 1:
            raise SystemExit('v8.13 entry anchor changed: ' + old[:90])
        # rep permits leading whitespace; retain the reviewed entry's exact preceding spacing.
        preceding = re.search(r'[ \t]*$', text[:text.index(old)]).group(0)
        text = rep(text, old, preceding + new, 'Explorer controls: ' + old[:60], path)

    once('</style>', '\n' + (ROOT / 'entry813.css').read_text(encoding='utf-8') + '</style>')
    once('<button class="jump" id="navBtn" style="width:auto;margin:0;padding:6px 9px" aria-label="Menu">☰</button>',
         '<button class="jump" id="navBtn" style="width:auto;margin:0;padding:6px 9px" aria-label="Find a reference or adjust the map" aria-controls="side" aria-expanded="false">Find</button>')
    once('<h3>Search the drawing\'s labels</h3><div class="search"><input id="q"',
         '<h3 id="searchLabel813">Search the drawing\'s labels</h3><div class="search"><input aria-labelledby="searchLabel813" id="q"')
    once('<div class="card" id="findCard"><h3>Find on the drawing</h3><div class="chips" id="chips"></div><div class="findlist" id="findList"></div></div>',
         '<details class="card" id="findCard" open><summary>Find on the master plan</summary><div class="chips" id="chips"></div><div class="findlist" id="findList"></div></details>')
    once('<div><h3>Areas</h3><div id="jumps"></div></div>',
         '<details class="card" id="areas813"><summary>Areas</summary><div id="jumps"></div></details>')
    once('<div class="card" id="layers"><h3>Layers</h3>',
         '<details class="card" id="layers"><summary>Layers</summary>')
    once('<span>Drawing overlay opacity</span>', '<label for="op">Drawing overlay opacity</label>')
    once('<span>Satellite brightness</span>', '<label for="br">Satellite brightness</label>')
    once('<p><b>Imagery</b> Mapbox Satellite, a basemap, not a live feed.',
         '<p id="sourceImagery813"><b>Imagery</b> <span id="sourceProvider813">Mapbox Satellite</span>, a basemap, not a live feed.')
    once('  </div>\n  <div class="card"><h3>Alignment</h3>',
         '  </details>\n  <details class="card" id="about813"><summary>About this map</summary><div class="aboutcontent813">\n  <div class="card"><h3>Alignment</h3>')
    once('  <div class="card" id="perf"><h3>Performance</h3><p id="perfText">—</p></div>\n</aside>',
         '  <div class="card" id="perf"><h3>Performance</h3><p id="perfText">—</p></div>\n  <p class="maphelp813">Drag to pan; pinch or use + / − to zoom. Keyboard: arrow keys pan, + / − zoom, Home fits the plan, / opens search, Esc closes a panel.</p>\n  </div></details>\n</aside>')
    once('<button id="boxBtn" aria-pressed="false" title="Box zoom (Z)">',
         '<button id="boxBtn" aria-pressed="false" aria-label="Zoom to a drawn box" title="Box zoom (Z)">')
    once('<button id="fullBtn" title="Full screen">', '<button id="fullBtn" aria-label="Full screen" title="Full screen">')
    once('<button id="exportBtn" title="Save PNG of this view">', '<button id="exportBtn" aria-label="Save PNG of this view" title="Save PNG of this view">')
    once('<div class="legend" id="legend"></div>',
         '<div class="legend" id="legend" role="dialog" aria-label="Drawing legend and sources" tabindex="-1"></div>')
    return text


if __name__ == '__main__':
    if len(sys.argv) not in (2, 3):
        raise SystemExit('Usage: patch_entry813.py input.html [output.html]')
    source = Path(sys.argv[1])
    destination = Path(sys.argv[2]) if len(sys.argv) == 3 else source
    destination.write_text(apply(source.read_text(encoding='utf-8'), str(source)), encoding='utf-8')
    print('v8.13 Explorer entry arrangement applied')
