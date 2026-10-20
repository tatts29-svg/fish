#!/usr/bin/env python3
"""Author: Andrew Fisher. Integrate the exact READY Today patch on live v8.06."""
from pathlib import Path
import hashlib
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent
SOURCE = PROJECT / 'v7.99_today_faster_fuller_LIVE' / 'patch_v799.py'
SOURCE_SHA256 = '32020bcb82d59748dbaa0d4e5b8354464bf696da0a8d301b39ac1368b2f8d384'
sys.path.insert(0, str(PROJECT / 'toolchain'))
from rep import rep


def apply(text, path='GC500 page'):
    if 'function place799(' in text or 'content="v8.07"' in text:
        raise SystemExit('v8.07 Today integration already or partially applied')
    if text.count('<meta name="gc500-release" content="v8.06">') != 1:
        raise SystemExit('v8.07 requires the verified live v8.06 release')
    for marker in ['id="drawer-navigation806"', 'function cw2Plan803(',
                   'function bookingOrder801(', 'function eq796(']:
        if marker not in text:
            raise SystemExit('v8.07 requires the existing phone, fencing, booking and Equipment components')
    if hashlib.sha256(SOURCE.read_bytes()).hexdigest() != SOURCE_SHA256:
        raise SystemExit('The READY v7.99 patch does not match its frozen source hash')
    # The imported patch is a command-line program. Run it unchanged on a private
    # temporary copy so a failed guard cannot partially modify the supplied page.
    with tempfile.TemporaryDirectory(prefix='gc500-v807-') as tmp:
        page = Path(tmp) / 'page.html'
        page.write_text(text, encoding='utf-8')
        result = subprocess.run([sys.executable, str(SOURCE), str(page)],
                                capture_output=True, text=True)
        if result.returncode:
            raise SystemExit('READY Today patch refused the base: ' + (result.stderr or result.stdout).strip())
        changed = page.read_text(encoding='utf-8')
    return rep(changed, '<meta name="gc500-release" content="v8.06">',
               '<meta name="gc500-release" content="v8.07">',
               'Today integration release marker', path)


if __name__ == '__main__':
    target = Path(sys.argv[1])
    target.write_text(apply(target.read_text(encoding='utf-8'), str(target)), encoding='utf-8')
    print('v8.07 applied: exact READY Today opening and spacing patch; prior releases retained')
