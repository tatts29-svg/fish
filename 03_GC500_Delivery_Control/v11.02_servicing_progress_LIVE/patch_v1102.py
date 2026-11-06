"""Author: Andrew Fisher. Stable servicing progress lights on the verified live base."""
import hashlib
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT / 'toolchain'))
from rep import rep

BASE_SHA256 = 'eb8373a49087060adaf4fac26668c4ad02c87482dabfdcf14155ad3137322395'
CONTROLLER = '/* Author: Andrew Fisher. v10.67 read-only servicing progress. v10.84'


def patch(text):
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA256:
        raise ValueError('v11.02 requires the exact verified v11.01 predecessor')
    if 'var SvcProgress1102 =' in text:
        raise ValueError('servicing progress lights already installed')
    original = text

    def change(old, new, label):
        nonlocal text
        text = rep(text, old, new, label, 'page')

    panel_start = text.index('var SvcPanel = (function () {')
    panel_end = text.index('module.exports = SvcPanel;', panel_start) + len('module.exports = SvcPanel;')
    change(text[panel_start:panel_end],
           (HERE / 'progress1102_src.js').read_text() + '\n' + (HERE / 'panel1102_src.js').read_text(),
           'servicing race-light presentation from unchanged shared state')
    change((ROOT / 'v11.00_servicing_map_clarity_LIVE/map1100_src.js').read_text(),
           (HERE / 'map1102_src.js').read_text(), 'persistent map meters and area controls')
    start = text.index(CONTROLLER)
    end = text.index('</script>', start)
    change(text[start:end], (HERE / 'controller1102_src.js').read_text(),
           'update servicing panel values without detaching the map')
    change('<style id="svc1099-style">',
           '<style id="svc1102-style">\n' + (HERE / 'progress1102.css').read_text() +
           '\n</style>\n<style id="svc1099-style">', 'scoped race-light styling')
    change("+' · v11.01'; /* v8.19 release922", "+' · v11.02'; /* v8.19 release922", 'release footer')

    # Display work must never change the shared arithmetic, crew card, data or
    # drawing. Compare the exact protected source spans, including image bytes.
    for start_marker, end_marker in [
        ('var SvcState =', 'module.exports = SvcState;'),
        ('var SVC1067_DATA=', '/* Author: Andrew Fisher. Deliberate edit-only tracker publication;'),
        ('var SVC1099_MAP_DATA=', '/* Author: Andrew Fisher. Saved servicing progress'),
    ]:
        def span(value):
            start = value.index(start_marker)
            end = value.index(end_marker, start) + len(end_marker)
            return value[start:end]
        if span(text) != span(original):
            raise ValueError('protected servicing state, data, card or geometry changed')
    if len(re.findall(r'<script\b', text)) != len(re.findall(r'<script\b', original)):
        raise ValueError('unexpected script boundary change')
    return text


if __name__ == '__main__':
    target = Path(sys.argv[1])
    target.write_text(patch(target.read_text()), encoding='utf-8')
