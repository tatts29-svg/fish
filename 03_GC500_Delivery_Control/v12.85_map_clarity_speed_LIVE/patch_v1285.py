"""Author: Andrew Fisher. Mark the paired map release on the exact current dashboard."""
from pathlib import Path
import hashlib
import sys

BASE_SHA256 = '3b17c3de36c8c3f2d99042b0c83dfd9fdc110ccb9db7a1c21ef6c9f72704a85b'
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def apply(text):
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA256:
        raise ValueError('Expected the exact restored v12.81 dashboard; rebuild if live changed')
    return rep(text, "+' · v12.81';", "+' · v12.85';", 'paired map release footer', 'v12.85')


if __name__ == '__main__':
    path = Path(sys.argv[1])
    path.write_text(apply(path.read_text()), encoding='utf-8')
