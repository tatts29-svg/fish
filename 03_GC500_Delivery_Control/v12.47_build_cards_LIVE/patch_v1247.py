"""Author: Andrew Fisher. Approved dark Build cards: additive bounded map strips only."""
import hashlib
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

REVIEWED_BASE_SHA256 = '4c07b14d578e390b7d39d073b8946ce9d84a21250cb55147d980eadce635cfe1'
REVIEWED_BASE_VERSION = '12.46'
SELECTED_CSS_SHA256 = 'f808fcf0eae57b66a4d0b42e260303cf4e0a9679e50430da16b8aecac0cd7861'
TESTED_ADAPTER_SHA256 = '1b34f21c41b25bb080ad0bba505505d74d6ab9207da96c18eacd86194fd58fd6'
TESTED_LIFECYCLE_SHA256 = '3955fe3662c1898fe0ad59660d0ce66a58d023f68608c1c8cd1769a9271f59c7'
OLD_FOOTER = "+' · v12.46';"
NEW_FOOTER = "+' · v12.47';"
CLOSING = '\n</body>\n</html>\n'
PREVIEW_NOTE = "  if(!p.querySelector('.b1247-preview-note')){const note=D.createElement('p');note.className='b1247-preview-note';note.textContent='Build map-strip preview · not live';const first=p.querySelector('.ldlist');if(first)first.before(note);}\n"

def digest(value):
    return hashlib.sha256(value).hexdigest()


def exact(text, old, new, what, path):
    if text.count(old) != 1:
        raise ValueError(what + ': exact source anchor must occur once')
    # Use the shared checked replacement only within the exact bounded anchor.
    changed = rep(old, old, new, what, path)
    if changed != new:
        raise ValueError(what + ': bounded replacement changed its boundary')
    return text.replace(old, changed, 1)


def source(name, expected):
    raw = (ROOT / name).read_bytes()
    if digest(raw) != expected:
        raise ValueError('v12.47 selected/tested source changed: ' + name)
    return raw.decode('utf-8')


def bundle():
    css = source('build_cards1247.css', SELECTED_CSS_SHA256)
    lifecycle = source('build_preview_lifecycle1247.js', TESTED_LIFECYCLE_SHA256)
    adapter = source('build_cards1247.js', TESTED_ADAPTER_SHA256)
    adapter = exact(adapter, 'v12.47 PREVIEW ONLY —', 'v12.47 —', 'production module attribution', 'build_cards1247.js')
    adapter = exact(adapter, PREVIEW_NOTE, '', 'remove preview-only notice', 'build_cards1247.js')
    adapter = exact(adapter, "release:'v12.47 PREVIEW — NOT LIVE'", "release:'v12.47'", 'production module version', 'build_cards1247.js')
    return '<style id="buildcards1247-style">\n' + css + '\n</style>\n<script id="buildcards1247-script">\n' + lifecycle + '\n' + adapter + '\n</script>\n'


def styles(text):
    return re.findall(r'<style\b[^>]*>[\s\S]*?</style>', text)


def reverse(text):
    restored = exact(text, bundle(), '', 'remove v12.47 additions', 'page')
    restored = exact(restored, NEW_FOOTER, OLD_FOOTER, 'restore predecessor footer', 'page')
    if digest(restored.encode('utf-8')) != REVIEWED_BASE_SHA256:
        raise ValueError('v12.47 reversal must recover the exact reviewed predecessor')
    return restored


def patch(text, path='page', expected_base_sha=None, expected_base_version=None):
    expected = expected_base_sha or os.environ.get('GC500_V1247_BASE_SHA256', '')
    version = expected_base_version or os.environ.get('GC500_V1247_BASE_VERSION', '')
    if 'id="buildcards1247-script"' in text or 'id="buildcards1247-style"' in text:
        raise ValueError('v12.47 already applied')
    if expected != REVIEWED_BASE_SHA256 or digest(text.encode('utf-8')) != expected:
        raise ValueError('v12.47 requires the explicit exact reviewed v12.46 base SHA-256')
    if version != REVIEWED_BASE_VERSION:
        raise ValueError('v12.47 requires the explicit reviewed predecessor version 12.46')
    if text.count(OLD_FOOTER) != 1 or NEW_FOOTER in text:
        raise ValueError('v12.47 predecessor footer does not match the reviewed version')
    if not text.endswith(CLOSING):
        raise ValueError('v12.47 final document boundary changed')
    addition = bundle()
    changed = exact(text, CLOSING, addition + CLOSING, 'add approved Build map strips', path)
    changed = exact(changed, OLD_FOOTER, NEW_FOOTER, 'footer', path)
    original_styles = [block for block in styles(changed) if 'id="buildcards1247-style"' not in block]
    if original_styles != styles(text):
        raise ValueError('v12.47 changed an original stylesheet')
    if reverse(changed) != text:
        raise ValueError('v12.47 changed content outside its additions and release footer')
    return changed


if __name__ == '__main__':
    page = Path(sys.argv[1])
    raw = page.read_bytes()
    changed = patch(raw.decode('utf-8'), str(page))
    page.write_bytes(changed.encode('utf-8'))
    print('patch_v1247 applied; exact predecessor reversal and original styles verified')
