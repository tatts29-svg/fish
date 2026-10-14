"""Author: Andrew Fisher. Visual clarity and event-driven map presentation from the exact live source."""
from pathlib import Path
import hashlib
import importlib.util
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA = 'd30833b57d59b2347c106193fa052edfda6c953801c513069af0ab6e05e00b5d'
PARTS = ('presentation', 'performance')


def apply(html):
    if hashlib.sha256(html.encode()).hexdigest() != BASE_SHA:
        raise ValueError('Requires exact live v10.17; changed or repeated source refused')
    for part in PARTS:
        source = HERE / part / ('patch_' + part + '1018.py')
        spec = importlib.util.spec_from_file_location('visual1018_' + part, source)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        html = module.apply(html)
    return rep(html, "+ ' · v10.17'", "+ ' · v10.18'", 'Visual clarity release footer', 'v10.18')


if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text()))
