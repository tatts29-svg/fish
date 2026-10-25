"""Author: Andrew Fisher. Show recorded door-lock progress in the main servicing indicators."""
import hashlib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

BASES = {'f06ddbdfca7b13394e1477d32f54813f7866b5e371160dd876aa94639712bab7': 'v12.21'}

def patch(text):
    assert '/* v12.23 lock percentage */' not in text, 'Already applied'
    version = BASES.get(hashlib.sha256(text.encode()).hexdigest())
    assert version, 'Wrong verified live base'
    text = rep(text, "var JOBS1123 = ['pump', 'clean', 'refill'];",
               "var JOBS1123 = ['pump', 'clean', 'refill', 'lockup']; /* v12.23 lock percentage */",
               'include existing lock counts in rings and area chips', 'page')
    return rep(text, "+' · " + version + "'; /* v8.19 release922",
               "+' · v12.23'; /* v8.19 release922", 'release footer', 'page')

if __name__ == '__main__':
    file = Path(sys.argv[1])
    file.write_text(patch(file.read_text()))
    print('v12.23 main servicing lock percentage applied')
