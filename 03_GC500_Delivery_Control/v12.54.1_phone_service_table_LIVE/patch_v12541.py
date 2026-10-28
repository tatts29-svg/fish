"""Author: Andrew Fisher. Bounded phone-only servicing table visibility repair."""
import hashlib
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

BASE_SHA256 = '378d4b6632101ad6a1429f31b2241c567b3670ae0888f70b7df6f75109625a5c'
OLD_FOOTER = "+' · v12.54';"
NEW_FOOTER = "+' · v12.54.1';"
HEAD_BOUNDARY = '</head>\n<body>'
STYLE_ID = 'phone-service12541-style'


def style_block():
    css = (ROOT / 'phone_service12541.css').read_text(encoding='utf-8')
    return '<style id="' + STYLE_ID + '">\n' + css + '</style>\n'


def exact(text, old, new, label, path):
    if text.count(old) != 1:
        raise ValueError(label + ': expected one exact boundary')
    if rep(old, old, new, label, path) != new:
        raise ValueError(label + ': replacement escaped its boundary')
    return text.replace(old, new, 1)


def patch(text, path='page', expected_base_sha=None):
    expected = expected_base_sha or os.environ.get('GC500_V12541_BASE_SHA256', '')
    if STYLE_ID in text or NEW_FOOTER in text:
        raise ValueError('v12.54.1 already applied')
    if expected != BASE_SHA256 or hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256:
        raise ValueError('v12.54.1 requires the explicit exact reviewed v12.54 SHA256')
    block = style_block()
    changed = exact(text, HEAD_BOUNDARY, block + HEAD_BOUNDARY, 'phone servicing table style', path)
    changed = exact(changed, OLD_FOOTER, NEW_FOOTER, 'release footer', path)
    restored = changed.replace(block, '', 1).replace(NEW_FOOTER, OLD_FOOTER, 1)
    if restored != text:
        raise ValueError('v12.54.1 changed content outside its style and footer')
    return changed


if __name__ == '__main__':
    page = Path(sys.argv[1])
    changed = patch(page.read_text(encoding='utf-8'), str(page))
    page.write_text(changed, encoding='utf-8')
    print('v12.54.1 phone servicing table visibility repair applied')
