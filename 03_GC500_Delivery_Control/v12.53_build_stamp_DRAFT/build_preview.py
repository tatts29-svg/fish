#!/usr/bin/env python3
"""Author: Andrew Fisher. Build a reversible, CSS-only local stamp preview."""
import hashlib
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

BASE_SHA256 = '7ea8e4d2b8230bdece88a7d566c8ae8d2eea63892b8ba1b928a3440149ca4404'
MARKER = '<style id="build-stamp1253-preview">'


def build(source: bytes) -> bytes:
    if hashlib.sha256(source).hexdigest() != BASE_SHA256:
        raise ValueError('Wrong live base: this draft requires an explicit review and rebuild')
    text = source.decode('utf-8')
    if MARKER in text:
        raise ValueError('Stamp preview is already present')
    addition = MARKER + '\n' + (ROOT / 'build_stamp1253.css').read_text() + '</style>\n'
    end = '</body>\n</html>'
    candidate = rep(text, end, addition + end, 'append stamp preview CSS', 'private live page')
    if candidate.replace(addition, '', 1) != text:
        raise ValueError('Preview must preserve every original source byte')
    return candidate.encode('utf-8')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('Usage: build_preview.py PRIVATE_LIVE_HTML PRIVATE_PREVIEW_HTML')
    output = build(Path(sys.argv[1]).read_bytes())
    Path(sys.argv[2]).write_bytes(output)
    print('PREVIEW ONLY SHA256 ' + hashlib.sha256(output).hexdigest())
