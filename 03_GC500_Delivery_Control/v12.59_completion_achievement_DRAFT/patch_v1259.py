"""Author: Andrew Fisher. Date-aware build achievement, independent of physical departure."""
import hashlib
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
import apply_general
import apply_vms

BASE_SHA256 = '20a81f75b8d47ed1c0d32cf3d5b5e5e79fe1bb5420b2fe459f9d4bbf94c771d5'
FOOT_A = "+' · v12.54.1'; /* v8.19 release922"
FOOT_B = "+' · v12.59'; /* v8.19 release922"


def patch(text, path='page'):
    if FOOT_B in text:
        raise ValueError('v12.59 already applied')
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA256:
        raise ValueError('v12.59 requires the exact verified live v12.54.1 predecessor')
    text = apply_general.apply(text)
    text = apply_vms.apply(text)
    if text.count(FOOT_A) != 1:
        raise ValueError('exact predecessor footer must occur once')
    text = text.replace(FOOT_A, rep(FOOT_A, FOOT_A, FOOT_B, 'release footer', path), 1)
    return text


if __name__ == '__main__':
    page = Path(sys.argv[1])
    result = patch(page.read_text(), str(page))
    page.write_text(result)
    print('patch_v1259 applied: date-aware completion achievement')
