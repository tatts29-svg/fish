"""Author: Andrew Fisher. Reference the reviewed 3D startup file from the existing map."""
import argparse
import hashlib
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASE_SHA256 = '7c276bb181541e506e983356fb746cd4233c77c6c973c178c7da27d458ad66c4'
THREED_SHA256 = '6b436ba331ed23cfdf9f42638c4ead462b8596215157d36d5e802746d4e6e53a'


def apply(text):
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA256:
        raise ValueError('Expected the exact restored Explorer integration file')
    return rep(text, '../poc3d/index.html?v=f8403834a133&embed=1&back=',
               '../poc3d/index.html?v=' + THREED_SHA256[:12] + '&embed=1&back=',
               'use reviewed 3D startup bytes', 'v12.85')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source')
    parser.add_argument('output')
    args = parser.parse_args()
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(apply(Path(args.source).read_text()), encoding='utf-8')
    print('Explorer integration SHA-256:', hashlib.sha256(target.read_bytes()).hexdigest())
