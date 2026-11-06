"""Author: Andrew Fisher. Recorded quantities beside shared reference descriptions."""
import hashlib
import sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / 'quantities'))
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
from patch_quantities998 import patch
BASE_SHA = 'c52e2204776eb43e48649ff4780705b0af989a419fda19c9fe29f9831db61e90'
def apply(text):
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA:
        raise ValueError('Requires exact live v9.97 base; refuses repeat application')
    return rep(patch(text), "+ ' · v9.97'", "+ ' · v9.98'", 'Release footer', 'v9.98')
if __name__ == '__main__':
    p = Path(sys.argv[1])
    p.write_text(apply(p.read_text()))
