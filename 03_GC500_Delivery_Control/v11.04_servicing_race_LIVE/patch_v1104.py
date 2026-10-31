"""Author: Andrew Fisher. Combine bounded progress and servicing presentation fixes."""
import hashlib
import importlib.util
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASE_SHA256 = '312c5a31536a4af0e01cf5850828994b1076d6d3c123d4098158030146af986e'


def _load(name):
    spec = importlib.util.spec_from_file_location(name, HERE / (name + '.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _span(text, start, end):
    first = text.index(start)
    last = text.index(end, first) + len(end)
    return text[first:last]


def patch(text):
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA256:
        raise ValueError('v11.04 requires the exact verified v11.03 predecessor')
    original = text
    text = _load('patch_fencing_progress_v1104').patch(text)
    text = _load('patch_servicing_style_v1104').patch(text)
    text = rep(text, "+' · v11.03'; /* v8.19 release922",
               "+' · v11.04'; /* v8.19 release922", 'v11.04 release footer', 'page')
    for start, end in [
        ('var SvcState =', 'module.exports = SvcState;'),
        ('var SVC1067_DATA=', '/* Author: Andrew Fisher. Deliberate edit-only tracker publication;'),
        ('var SVC1099_MAP_DATA=', '/* Author: Andrew Fisher. Saved servicing progress'),
    ]:
        if _span(text, start, end) != _span(original, start, end):
            raise ValueError('protected servicing state, data, card or geometry changed')
    if len(re.findall(r'<script\b', text)) != len(re.findall(r'<script\b', original)):
        raise ValueError('unexpected script boundary change')
    return text


if __name__ == '__main__':
    target = Path(sys.argv[1])
    target.write_text(patch(target.read_text()), encoding='utf-8')
