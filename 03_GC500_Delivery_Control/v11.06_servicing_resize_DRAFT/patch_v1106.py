"""Author: Andrew Fisher. Compose servicing refinement and preserve the viewed map centre."""
import hashlib
import importlib.util
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASE_SHA256 = '56fcb00987640d249e363936a61fefed8574e2a03c17933dca32b1e8c20b985c'


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
        raise ValueError('v11.06 requires the exact verified v11.05 predecessor')
    original = text
    text = _load('patch_servicing_resize_v1106').patch(text)
    text = _load('patch_servicing_style_v1106').patch(text)
    text = rep(text, "+' · v11.05'; /* v8.19 release922",
               "+' · v11.06'; /* v8.19 release922", 'v11.06 release footer', 'page')
    for start, end in [
        ('var SvcState =', 'module.exports = SvcState;'),
        ('var SVC1067_DATA=', '/* Author: Andrew Fisher. Deliberate edit-only tracker publication;'),
        ('var SVC1099_MAP_DATA=', '/* Author: Andrew Fisher. Saved servicing progress'),
    ]:
        if _span(text, start, end) != _span(original, start, end):
            raise ValueError('protected servicing state, data, card or geometry changed')
    if len(re.findall(r'<script\b', text)) != len(re.findall(r'<script\b', original)):
        raise ValueError('unexpected script boundary change')
    scripts = lambda html: re.findall(r'<script\b[^>]*>(.*?)</script>', html, flags=re.S | re.I)
    before_scripts, after_scripts = scripts(original), scripts(text)
    if len(before_scripts) != len(after_scripts):
        raise ValueError('script element count changed')
    allowed = ('var SvcMap1099 =', "+' · v11.05'; /* v8.19 release922")
    changed = [old for old, new in zip(before_scripts, after_scripts) if old != new]
    if len(changed) != 2 or any(not any(marker in old for marker in allowed) for old in changed):
        raise ValueError('unrelated script, source evidence, financial code or data changed')
    return text


if __name__ == '__main__':
    target = Path(sys.argv[1])
    target.write_text(patch(target.read_text()), encoding='utf-8')
