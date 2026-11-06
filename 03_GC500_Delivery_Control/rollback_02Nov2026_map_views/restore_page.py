"""Author: Andrew Fisher. Restore only the exact page replaced by the rejected v12.83 map change."""
import hashlib
import os
from pathlib import Path
import sys

CURRENT = '10eeb707df306b79c9ee5e870dab64b3037e39806bdd8147e665bc789c01ceff'
PREVIOUS = '3b17c3de36c8c3f2d99042b0c83dfd9fdc110ccb9db7a1c21ef6c9f72704a85b'

def restore(current, previous):
    if hashlib.sha256(current).hexdigest() != CURRENT:
        raise ValueError('Live page is no longer the reviewed v12.83; stop and coordinate before restoring')
    if hashlib.sha256(previous).hexdigest() != PREVIOUS:
        raise ValueError('Only the exact independently verified previous v12.81 is permitted')
    return previous

if __name__ == '__main__':
    source = os.environ.get('GC500_RESTORE_PAGE')
    if not source:
        raise ValueError('Set GC500_RESTORE_PAGE to the private verified predecessor')
    target = Path(sys.argv[1])
    target.write_bytes(restore(target.read_bytes(), Path(source).read_bytes()))
