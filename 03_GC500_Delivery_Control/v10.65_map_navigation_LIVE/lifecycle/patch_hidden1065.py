"""Author: Andrew Fisher. Stop hidden embedded 3D equipment polling and pulses."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'toolchain'))
from rep import rep


def apply(text, path='explorer-merge.js'):
    if 'hiddenEquipment1065' in text:
        raise ValueError('v10.65 hidden equipment guard already applied')
    return rep(text, '    active: () => in3d,',
               '    active: () => in3d && !!window.GC500Explorer?.shown?.(), /* hiddenEquipment1065: CSS-hidden frames are not document.hidden */',
               'embedded equipment visibility', path)


if __name__ == '__main__':
    p = Path(sys.argv[1])
    p.write_text(apply(p.read_text(), str(p)))
