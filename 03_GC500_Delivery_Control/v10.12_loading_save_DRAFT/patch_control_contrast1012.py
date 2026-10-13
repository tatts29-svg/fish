"""Author: Andrew Fisher. Pair native control colours; no record/handler changes."""
from pathlib import Path
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def apply(page):
    if 'id="control-contrast1012"' in page or 'id="selection-save1012-style"' in page:
        raise ValueError('Control contrast1012 is already installed')
    for marker in ['id="contrast1007css"', 'id="loadcards991-style"', 'function loading872Editor(a)']:
        if marker not in page:
            raise ValueError('Expected live source marker: ' + marker)
    return rep(page, '\n</head>', '\n<style id="control-contrast1012">\n' +
               (HERE / 'control_contrast1012.css').read_text().strip() + '\n</style>\n</head>',
               'paired native control foregrounds and dark loading surface', 'v10.12')
