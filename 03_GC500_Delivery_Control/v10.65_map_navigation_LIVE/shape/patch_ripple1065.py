"""Author: Andrew Fisher. Start a new selected-shape ripple when it can be seen.

Pure page transform. Does not change the machine bundle, selection/hit precedence,
map geometry, Done timing, or the parent's release footer.
"""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / 'toolchain'))
from rep import rep


SELECTION_OLD = "const sk = selected ? selected.code : ''; if (sk !== BEAT.selKey) { BEAT.selKey = sk; BEAT.selStart = sk ? performance.now() : 0; }    /* a new pick ripples at once */"
SELECTION_NEW = "const sk = selected ? selected.code : ''; if (sk !== BEAT.selKey) { BEAT.selKey = sk; BEAT.selStart = sk ? null : 0; }    /* shape1065: a new pick waits for its first visible ripple frame */"
GUARD = "if (quiet || moving) { beatLayer.style.display = 'none'; BEAT.wait = setTimeout(kick, quiet ? 1000 : 300); return; }    /* looks again when motion is back or the map stops */"
START = "if (BEAT.sel && BEAT.selStart === null) BEAT.selStart = t;    /* shape1065: do not spend the first ripple while hidden or moving */"
PHASE_OLD = "const cs = BEAT.sel && BEAT.selStart ? (((t - BEAT.selStart) % 6400) + 6400) % 6400 : 9999, selOn = cs < 3200;"
PHASE_NEW = "const cs = BEAT.sel && BEAT.selStart !== null ? (((t - BEAT.selStart) % 6400) + 6400) % 6400 : 9999, selOn = cs < 3200;"


def patch(text):
    if 'shape1065:' in text:
        raise ValueError('Selected-shape ripple fix already applied')
    changes = [(SELECTION_OLD, SELECTION_NEW), (GUARD, GUARD + '\n   ' + START), (PHASE_OLD, PHASE_NEW)]
    # Validate all anchors before transforming so drift/duplicates fail closed.
    for old, _ in changes:
        if text.count(old) != 1:
            raise ValueError('Expected exactly one current selected-shape ripple anchor: ' + old[:70])
    for index, (old, new) in enumerate(changes, 1):
        text = rep(text, old, '   ' + new, f'selected ripple substitution {index}', 'page')
    return text


if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(patch(page.read_text(encoding='utf-8')), encoding='utf-8')
