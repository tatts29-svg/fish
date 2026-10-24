"""Author: Andrew Fisher. One bounded financial association from a private input."""
import hashlib
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from integrate_financial1105 import integrate
from rep import rep

BASE_SHA256 = '198242a69a69e675dc733f0945bc1e092d2813d1090af20d1f5fcefb0b348eab'


def _span(text, start, end):
    first = text.index(start)
    last = text.index(end, first) + len(end)
    return text[first:last]


def patch(text, env=None):
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA256:
        raise ValueError('v11.05 requires the exact verified v11.04 predecessor')
    original = text
    text, _manifest = integrate(text, env)
    text = rep(text, "+' · v11.04'; /* v8.19 release922",
               "+' · v11.05'; /* v8.19 release922", 'v11.05 release footer', __file__)
    for start, end in [
        ('var SvcState =', 'module.exports = SvcState;'),
        ('var SVC1067_DATA=', '/* Author: Andrew Fisher. Deliberate edit-only tracker publication;'),
        ('var SVC1099_MAP_DATA=', '/* Author: Andrew Fisher. Saved servicing progress'),
    ]:
        if _span(text, start, end) != _span(original, start, end):
            raise ValueError('Protected servicing state, data, card or geometry changed')
    if len(re.findall(r'<script\b', text)) != len(re.findall(r'<script\b', original)) + 3:
        raise ValueError('Unexpected financial script boundary change')
    return text


if __name__ == '__main__':
    target = Path(sys.argv[1])
    target.write_text(patch(target.read_text()), encoding='utf-8')
