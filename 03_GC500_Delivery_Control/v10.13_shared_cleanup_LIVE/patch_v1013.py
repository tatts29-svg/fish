"""Author: Andrew Fisher. Compose the reviewed shared-data and interaction fixes."""
import hashlib
import importlib.util
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASE_SHA = 'cde0aae30d5e528e85c2b16189bf0c0828397b87a7b3d10c1695362b19a58105'

def component(relative):
    path = HERE / relative
    spec = importlib.util.spec_from_file_location(path.stem, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.apply

def apply(html):
    if hashlib.sha256(html.encode()).hexdigest() != BASE_SHA:
        raise ValueError('Requires exact live v10.12; refuses repeat or wrong-base application')
    for path in [
        'event_config/patch_event_config1013.py',
        'finance/patch_finance1013.py',
        'information/patch_information1013.py',
        'flows/patch_flows1013.py',
    ]:
        html = component(path)(html)
    return rep(html, "+ ' · v10.12'", "+ ' · v10.13'", 'Release footer', 'v10.13')

if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text()))
