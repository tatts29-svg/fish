#!/usr/bin/env python3
"""Author: Andrew Fisher. Reproduce a PRIVATE layout mockup; never a release patch."""
import argparse
import hashlib
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

BASE_SHA = 'fa32b0a1937b329077923b960688a8927fbaaa2e6283d4d1ce2c6732eb98c213'
SOURCE_SHA = '33fa43f8e5fdf04514064484300ef92c38e5479f4d57bf02e8e2504e82dcb7ea'
PREVIEW_SHA = '1d2845f7dff2fe54accb8f9769810271fa36ec6205df48e9ccb08175cd461411'
MARKER = b'window.layoutPreview02=P;'


def digest(value):
    return hashlib.sha256(value).hexdigest()


def build_preview(base, source):
    if MARKER in base:
        raise ValueError('Layout preview already applied; refusing a second insertion')
    if digest(base) != BASE_SHA:
        raise ValueError('Requires exact reviewed v8.03 base; later live releases require a new review')
    if digest(source) != SOURCE_SHA:
        raise ValueError('Preview source differs from the frozen reviewed component')
    text = base.decode('utf-8')
    if 'function cw2Plan803(' not in text:
        raise ValueError('Reviewed v8.03 source marker missing')
    # A generated-document template contains another closing body. Only the final
    # real-page body is eligible; rep still insists on exactly one terminal match.
    head, tail = text.rsplit('</body>', 1)
    if tail.strip() != '</html>':
        raise ValueError('Unexpected real-page terminal body shape')
    insertion = '<script>\n' + source.decode('utf-8') + '\n</script>\n'
    terminal = rep('</body>' + tail, '</body>', insertion + '</body>',
                   'append private layout preview at final real-page body', 'private-preview')
    result = (head + terminal).encode('utf-8')
    if result.count(insertion.encode()) != 1 or result.replace(insertion.encode(), b'') != base:
        raise ValueError('Exact original-page preservation failed')
    if digest(result) != PREVIEW_SHA:
        raise ValueError('Rebuilt preview does not match reviewed bytes')
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('base', type=Path)
    parser.add_argument('output', type=Path, help='Private path outside the repository; no upload')
    args = parser.parse_args()
    out = args.output.resolve()
    repository = ROOT.parents[1]
    if out == args.base.resolve() or out.is_relative_to(repository):
        parser.error('Output must be a separate private path outside the repository')
    result = build_preview(args.base.read_bytes(), (ROOT / 'layout_preview.js').read_bytes())
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(result)
    print('PRIVATE DRAFT only:', digest(result))


if __name__ == '__main__':
    main()
