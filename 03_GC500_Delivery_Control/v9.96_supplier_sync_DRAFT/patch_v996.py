"""Author: Andrew Fisher. Integrated supplier, Demob and source consistency corrections."""
from pathlib import Path
import hashlib
import importlib.util
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

# Replaced only after the final v9.95 page has been verified live.
BASE_SHA = 'PENDING_VERIFIED_V995'


def component(name, relative):
    spec = importlib.util.spec_from_file_location(name, HERE / relative)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def apply(html):
    if hashlib.sha256(html.encode()).hexdigest() != BASE_SHA:
        raise ValueError('v9.96 requires the exact verified v9.95 base')
    for name, source in [
        ('supplier996_patch', 'subhire/patch_supplier996.py'),
        ('demob996_patch', 'demob-weather/patch_demob996.py'),
        ('stock996_patch', 'stock996.py'),
        ('fencing996_patch', 'fencing/fencing996.py'),
        ('maps996_patch', 'maps/identity996.py'),
    ]:
        html = component(name, source).patch(html)
    return rep(html, "+ ' · v9.95'", "+ ' · v9.96'", 'Release footer', __file__)


if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text()))
