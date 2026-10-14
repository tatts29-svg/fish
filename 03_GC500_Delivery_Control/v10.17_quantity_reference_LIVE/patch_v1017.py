"""Author: Andrew Fisher. Correct quantity projections from the exact live source."""
from pathlib import Path
import hashlib
import importlib.util
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASE_SHA = '3cbfd0d5c9bd53f02d5a89b274e83ee0c2d2c8dc17b03da59b68cf3a3db8673c'
PARTS = (
    ('barriers', 'barriers'), ('inventory', 'inventory'),
    ('demob', 'demob'), ('map', 'map'),
    ('scope', 'scope'), ('scope', 'scope_sync'),
    ('financial_scope', 'financial_scope'),
)


def apply(html):
    if hashlib.sha256(html.encode()).hexdigest() != BASE_SHA:
        raise ValueError('Requires exact live v10.16; changed or repeated source refused')
    for folder, part in PARTS:
        path = HERE / folder / ('patch_' + part + '1017.py')
        spec = importlib.util.spec_from_file_location('quantity1017_' + part, path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        html = module.apply(html)
    return rep(html, "+ ' · v10.16'", "+ ' · v10.17'", 'Quantity audit release footer', 'v10.17')


if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text()))
