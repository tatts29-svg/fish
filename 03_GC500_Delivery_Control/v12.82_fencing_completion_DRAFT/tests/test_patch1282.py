"""Author: Andrew Fisher. Exact-page preservation and release/input refusal checks.

BASE_HTML and FENCING1282_REVIEW_JSON refer to authorised private files.
"""
import importlib.util
import os
from pathlib import Path
import re
import tempfile

HERE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('patch1282', HERE / 'patch_v1282.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
base = Path(os.environ['BASE_HTML']).read_text(encoding='utf-8')
source = os.environ['FENCING1282_REVIEW_JSON']
candidate = module.patch(base)
block = re.compile(r'<script id="fencing1282-script">\n[\s\S]*?\n</script>\n')
assert len(block.findall(candidate)) == 1
restored = block.sub('', candidate).replace("+' · v12.82';", "+' · v12.81';")
assert restored == base, 'Anything outside the one evidence script and release footer changed'
passed = 1


def refuses(text):
    global passed
    try:
        module.patch(text)
    except ValueError:
        passed += 1
    else:
        raise AssertionError('Expected patch refusal')


refuses(candidate)
refuses(base + '\n')
os.environ.pop('FENCING1282_REVIEW_JSON')
refuses(base)
with tempfile.TemporaryDirectory() as temp:
    changed = Path(temp) / 'changed.json'
    changed.write_bytes(Path(source).read_bytes() + b'\n')
    os.environ['FENCING1282_REVIEW_JSON'] = str(changed)
    refuses(base)
os.environ['FENCING1282_REVIEW_JSON'] = source
print(f'{passed}/5 preservation and input guards passed')
