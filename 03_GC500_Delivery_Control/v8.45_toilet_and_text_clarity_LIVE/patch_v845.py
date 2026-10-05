#!/usr/bin/env python3
"""Author: Andrew Fisher. Scoped Today text clarity; operational code stays unchanged."""
from pathlib import Path
import hashlib
import sys
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = '5a19106be3a4877a2cd552432eb5870340c334d0e6dfe7adab1fad81300b4dcf'

def clarity_style():
    return '<style id="today-text-clarity-v845">\n' + (ROOT / 'text_clarity845_src.css').read_text() + '\n</style>'

def build(raw):
    if hashlib.sha256(raw).hexdigest() != BASE_SHA256:
        raise ValueError('Refusing a changed live base or repeat application')
    text = raw.decode('utf-8')
    old_style = '<style id="today-work-v840">\n' + (ROOT.parent / 'v8.44_linked_completion_LIVE/today_work844_src.css').read_text() + '\n</style>'
    text = rep(text, old_style, old_style + '\n' + clarity_style(), 'Scoped laptop text clarity', 'v8.45')
    text = rep(text, '<meta name="gc500-release" content="v8.44">', '<meta name="gc500-release" content="v8.45">', 'Release metadata', 'v8.45')
    text = rep(text, "+ ' · v8.44'; /* v8.19 - the footer names the release once */", "+ ' · v8.45'; /* v8.19 - the footer names the release once */", 'Release footer', 'v8.45')
    return text.encode('utf-8')

if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: patch_v845.py WORKING_COPY.html')
    p = Path(sys.argv[1]); p.write_bytes(build(p.read_bytes()))
    print('Scoped Today typography updated; native data and controls preserved.')
