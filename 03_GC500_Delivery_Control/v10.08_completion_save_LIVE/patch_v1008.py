"""Author: Andrew Fisher. Verified completion, staff save feedback and contained Rules table."""
import hashlib
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
sys.path.insert(0, str(HERE))
from rep import rep
from patch_completion1008 import apply as apply_completion

BASE_SHA = 'b5d99de88886d9f03aad7af2177b68b1239919542f6c27e2d80be7ec9a89bdfb'

def apply(text):
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA:
        raise ValueError('Requires exact live v10.07; refuses repeat or wrong-base application')
    text = apply_completion(text)
    return rep(text, "+ ' · v10.07'", "+ ' · v10.08'", 'Release footer', 'v10.08')

if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text()))
