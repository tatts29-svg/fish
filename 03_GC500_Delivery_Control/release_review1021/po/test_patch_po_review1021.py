"""Author: Andrew Fisher. Reproduce the reviewed source chain and check patch boundaries without a browser."""
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent

def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded

source = Path(sys.argv[1]).read_text()
for number, directory in [(1019, 'v10.19_po_values_prestarts_signed_DRAFT'), (1020, 'v10.20_gate6_compound_DRAFT'), (1021, 'v10.21_schedule7_1_DRAFT')]:
    source = module(ROOT / directory / ('patch_v' + str(number) + '.py'), 'stage' + str(number)).apply(source)
patch = module(HERE / 'patch_po_review1021.py', 'review')
assert hashlib.sha256(source.encode()).hexdigest() == patch.BASE_SHA
candidate = patch.apply(source)
checks = ['exact original three-patch candidate reproduced']
for label, test in [
    ('one review module', candidate.count('function poReviewBasis1021(order){') == 1),
    ('native setter guarded once', candidate.count('patch = poReviewPatch1021(poOf(n) || {}, patch);') == 1),
    ('dirty form blocked before check', candidate.count("if (poReviewFormChanged1021(pane, no)) { flash('Save this purchase order before marking it as checked.'); return; }") == 1),
    ('existing monetary validation retained', candidate.count('const check982 = poReceiptIssue982(Object.assign({}, poOf(n) || {}, patch));') == 1),
    ('current check renderer', candidate.count("if (!poReviewCurrent1021(o)) return '';") == 1),
    ('current check button', candidate.count("if (!o || !o.confirmed || poReviewCurrent1021(o)) return '';") == 1),
    ('no version bump beyond owned v10.21', candidate.count("+ ' · v10.21'") == 1),
]:
    assert test, label
    checks.append(label)
for wrong in (candidate, source + ' '):
    try:
        patch.apply(wrong)
        raise AssertionError('unexpected source accepted')
    except ValueError:
        checks.append('wrong or repeated source refused')
print(json.dumps({'author':'Andrew Fisher','pass':True,'checks':checks,'candidateSha256':hashlib.sha256(candidate.encode()).hexdigest(),'candidateBytes':len(candidate.encode())}))
