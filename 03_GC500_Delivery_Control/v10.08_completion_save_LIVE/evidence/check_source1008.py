#!/usr/bin/env python3
"""Author: Andrew Fisher. Guard native records, setters and prior presentation."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent.parent
ROOT = HERE.parent
base_path = Path(os.environ.get('BASE', ROOT / 'build/GC500_v10.07/GC500_Delivery_Control_hosted.html'))
page_path = Path(os.environ.get('PAGE', ROOT / 'build/GC500_v10.08/GC500_Delivery_Control_hosted.html'))
base, page = base_path.read_text(), page_path.read_text()
checks = []


def check(name, condition):
    assert condition, name
    checks.append(name)


def section(text, start, end):
    i = text.index(start)
    return text[i:text.index(end, i)]


for start, end in [
    ('function setDone(key, on){', '/* Which references the second tick'),
    ('function setLevelled(key, on){', 'function setSteps(key, on){'),
    ('function setFenceAreaDone(name, on){', 'function fenceAreaBtn(name){'),
    ('function bump(){', '/* ------------------------------------------------------------------ tabs'),
]:
    check(start + ' unchanged', section(base, start, end) == section(page, start, end))
check('embedded source DATA unchanged', re.search(r'^const DATA = .*$', base, re.M).group() == re.search(r'^const DATA = .*$', page, re.M).group())
for marker in ['data-charge-included1006', 'data-labour933', 'data-unit925-form']:
    check(marker + ' count unchanged', base.count(marker) == page.count(marker))
styles = lambda text: re.findall(r'<style\b[^>]*>.*?</style>', text, re.S)
check('all prior styles unchanged', styles(base) == [s for s in styles(page) if 'id="complete1008-style"' not in s])
check('one local Rules-table wrapper', page.count('class="flow1008-table" role="region"') == 1)
check('no new observer or timer', not re.search(r'MutationObserver|setInterval|setTimeout', (HERE / 'complete1008.js').read_text() + (HERE / 'staff_bridge1008.js').read_text()))

spec = importlib.util.spec_from_file_location('completion1008_patch', HERE / 'patch_completion1008.py')
patch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patch)
for label, data in [('repeat', page), ('wrong base', base.replace('contrast1007css', 'not-the-base'))]:
    try:
        patch.apply(data)
    except ValueError:
        checks.append(label + ' rejected')
    else:
        raise AssertionError(label + ' accepted')
print(json.dumps({'author': 'Andrew Fisher', 'passed': True, 'checks': len(checks), 'base_sha256': hashlib.sha256(base.encode()).hexdigest(), 'candidate_sha256': hashlib.sha256(page.encode()).hexdigest()}))
