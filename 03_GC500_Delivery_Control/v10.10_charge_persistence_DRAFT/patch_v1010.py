"""Author: Andrew Fisher. Shared charge corrections, quantities, workforce and persistent panels."""
import hashlib
import importlib.util
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASE_SHA = '60533337c67a77211e660f0737ca5c693d52c2108a18d79fb0fd8a9d48c46a8b'

def module(name):
    path = HERE / name
    spec = importlib.util.spec_from_file_location(path.stem, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value

def append_script(html, name, source):
    return rep(html, '\n</body>\n</html>', '<script id="' + name + '">\n' + source + '\n</script>\n</body>\n</html>', name, 'v10.10')

def apply(html):
    if hashlib.sha256(html.encode()).hexdigest() != BASE_SHA:
        raise ValueError('Requires exact live v10.09; refuses repeat or wrong-base application')
    html = module('quantity/patch_quantity1010.py').apply(html)
    html = module('workforce/patch_workforce1010.py').apply(html)
    html = module('pricing/patch_pricing1010.py').apply(html)
    html = append_script(html, 'pricing1010-script', (HERE / 'pricing/pricing1010.js').read_text())
    html = module('pricing_ui/patch_pricing_ui1010.py').apply(html)
    html = module('persistence/patch_persistence1010.py').apply(html)
    return rep(html, "+ ' · v10.09'", "+ ' · v10.10'", 'Release footer', 'v10.10')

if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text()))
