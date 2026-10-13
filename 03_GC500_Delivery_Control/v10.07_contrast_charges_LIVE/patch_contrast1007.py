"""Author: Andrew Fisher. Pair colours throughout existing operational surfaces."""
from pathlib import Path
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

def apply(html):
    if 'id="contrast1007css"' in html:
        raise ValueError('Contrast1007 is already installed')
    if 'id="contrast1006css"' not in html:
        raise ValueError('Expected v10.06 contrast source')
    old = "f.addEventListener('load', () => { EXP.loaded = true;"
    html = rep(html, old, " f.addEventListener('load', () => { contrast1007Map(f); EXP.loaded = true;",
               'readable map search hint on native frame load', 'v10.07')
    html = rep(html, "function expFrame(find){", (HERE / 'contrast1007.js').read_text().strip() + "\nfunction expFrame(find){",
               'idempotent same-origin map field correction', 'v10.07')
    return rep(html, '\n</head>', '\n<style id="contrast1007css">\n' +
               (HERE / 'contrast1007.css').read_text() + '\n</style>\n</head>',
               'paired palette for existing operational surfaces', 'v10.07')
