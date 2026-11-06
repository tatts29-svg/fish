"""Author: Andrew Fisher. Exact restoration and changed-input refusals; no writes.

RESTORE_CURRENT_HTML and RESTORE_PREVIOUS_HTML name authorised private captures.
"""
import importlib.util
import os
from pathlib import Path

spec = importlib.util.spec_from_file_location('restore_page', Path(__file__).resolve().parents[1] / 'restore_page.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
current = Path(os.environ['RESTORE_CURRENT_HTML']).read_bytes()
previous = Path(os.environ['RESTORE_PREVIOUS_HTML']).read_bytes()
assert module.restore(current, previous) is previous, 'Exact predecessor bytes must be returned unmodified'
for changed_current, changed_previous in [(current + b'\n', previous), (current, previous + b'\n')]:
    try:
        module.restore(changed_current, changed_previous)
    except ValueError:
        pass
    else:
        raise AssertionError('Changed source was accepted')
print('3/3 exact-identity and changed-input refusal checks passed; no writes')
