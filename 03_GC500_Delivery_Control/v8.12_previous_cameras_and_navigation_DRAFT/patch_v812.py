#!/usr/bin/env python3
"""Author: Andrew Fisher. Frozen camera/navigation/driver-sheet integration."""
from pathlib import Path
import hashlib
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent
sys.path.insert(0, str(PROJECT / 'toolchain'))
from rep import rep

SOURCES = {'v8.05_links_that_go_DRAFT/patch_v805.py': '90e60deefab94b230396fa5d8316c1f49ccc3f670168b4802618a15f268b7fd0', 'v8.08_delivery_sheet_remaining_DRAFT/patch_v808.py': '370d040c7cf8e4a086f97d2b9892d3bd0ced2eaf71fd4804327a566c355d37b3', 'v8.08_delivery_sheet_remaining_DRAFT/sheet_remaining808_src.js': '87d2d08fa7a2f4de1b08791bb35641b55501beeda587e3296a50248ffeacd6eb', 'v8.10_navigation_finish_DRAFT/patch_v810.py': '14c350a2c247dc0e1def8d20cbe91c31265c2e3bcd1ae6826d4a8df42b21c1da', 'v8.10_navigation_finish_DRAFT/navigation810_src.js': '70d9fc6e45d6910b58910f83c5b80a54b0546f521b00a399770e5be5e5d104bc', 'v8.11_camera_restore_DRAFT/patch_v811.py': 'ca3d446c1dd5f96d57af7f49ef77d6336dff1451689a5fcb1a1ab378cb5c0af9'}
ORDER = ['v8.05_links_that_go_DRAFT/patch_v805.py', 'v8.08_delivery_sheet_remaining_DRAFT/patch_v808.py', 'v8.10_navigation_finish_DRAFT/patch_v810.py', 'v8.11_camera_restore_DRAFT/patch_v811.py']
BASE_SHA256 = '35024d43405947d59c106e858221f8c40ed9629bcf6b19b1081f87c4da6799ed'

def apply(text, path='GC500 page'):
    if '<meta name="gc500-release" content="v8.12">' in text:
        raise SystemExit('v8.12 already applied')
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA256:
        raise SystemExit('v8.12 requires the exact reviewed live v8.07; rebuild and retest if live moves')
    for name, expected in SOURCES.items():
        if hashlib.sha256((PROJECT / name).read_bytes()).hexdigest() != expected:
            raise SystemExit('Frozen component changed: ' + name)
    with tempfile.TemporaryDirectory(prefix='gc500-v812-') as tmp:
        page = Path(tmp) / 'page.html'
        page.write_text(text, encoding='utf-8')
        for name in ORDER:
            run = subprocess.run([sys.executable, str(PROJECT/name), str(page)], capture_output=True, text=True)
            if run.returncode:
                raise SystemExit(name + ' refused the base: ' + (run.stderr or run.stdout).strip())
        changed = page.read_text(encoding='utf-8')
    changed = rep(changed,
        "if ($('#showcaseBtn')) $('#showcaseBtn').onclick = () => { moreClose(); showOpen(); };",
        "if ($('#showcaseBtn')) $('#showcaseBtn').onclick = () => { moreClose(); showOpen(); SHOW.ret = $('#moreBtn') || SHOW.ret; };",
        'Return from the closed Tools menu to its visible button', path)
    return rep(changed, '<meta name="gc500-release" content="v8.08">',
               '<meta name="gc500-release" content="v8.12">', 'combined verified release', path)

if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text(encoding='utf-8'), str(page)), encoding='utf-8')
    print('v8.12 applied: previous race cameras, verified links and truthful delivery sheets')
