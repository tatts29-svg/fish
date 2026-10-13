"""Author: Andrew Fisher. Shared surface contrast corrections; financial coverage audit."""
import hashlib
import importlib.util
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASE_SHA = 'fc7995c79cd5df18c47de4f2c05f1499382ba0313ae8b27dd23d783606a59068'

def apply(text):
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA:
        raise ValueError('Requires exact live v10.06; refuses repeat or wrong-base application')
    for name in ('contrast1007', 'finance1007'):
        path = HERE / ('patch_' + name + '.py')
        spec = importlib.util.spec_from_file_location(name, path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        text = module.apply(text)
    return rep(text, "+ ' · v10.06'", "+ ' · v10.07'", 'Release footer', 'v10.07')

if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text()))
