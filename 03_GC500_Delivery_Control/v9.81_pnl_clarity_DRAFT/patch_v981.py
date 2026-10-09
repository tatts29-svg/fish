#!/usr/bin/env python3
"""Author: Andrew Fisher. Concise financial presentation; no record/model changes."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def patch(source):
    if 'pnl-clarity981-script' in source:
        raise ValueError('v9.81 already applied')
    if "+ ' · v9.80'" not in source or 'onsite-complete979-script' not in source:
        raise ValueError('Requires v9.80 with the shared onsite Revenue model')
    source = rep(source, '</body>\n</html>\n',
                 '<script id="pnl-clarity981-script">' + (HERE / 'pnl_clarity981.js').read_text() +
                 '</script>\n</body>\n</html>\n', 'Financial presentation', __file__)
    return rep(source, "+ ' · v9.80'", "+ ' · v9.81'", 'Release footer', __file__)


if __name__ == '__main__':
    source = Path(sys.argv[1])
    target = Path(sys.argv[2]) if len(sys.argv) > 2 else source
    target.write_text(patch(source.read_text()))
