"""Author: Andrew Fisher. Apply print-only contrast, safe margins and label clearance.

This wrapper imports the explicitly supplied existing sheet generator, retaining
its published-data, permanent-URL and physical-readiness guards. Private map and
link inputs, and PDF outputs, stay outside the repository.
"""
from pathlib import Path
import argparse
import hashlib
import sys
import types

BASE_SHA256 = 'cfb388dc64153a02ae3de07259198e8cb5b588caf1cab5b5db99e7915a3f3fe3'


def revised_source(source):
    if hashlib.sha256(source.encode()).hexdigest() != BASE_SHA256:
        raise ValueError('reviewed print generator source required')
    replacements = [
        ("GROUP_COL = {'pump': ORANGE, 'clean': BLUE}", "GROUP_COL = {'pump': colors.HexColor('#ab4109'), 'clean': BLUE}"),
        ("14: '#f9a825'", "14: '#8a5a00'"),
        ("c.rect(0, H - 6.5 * mm, W, 6.5 * mm, stroke=0, fill=1)", "c.rect(0, H - 8.7 * mm, W, 3.9 * mm, stroke=0, fill=1)"),
        ("H - 4.6 * mm, banner", "H - 7.4 * mm, banner"),
        ("c.line(x0, 18.1 * mm, x1, 18.1 * mm)", "c.line(x0, 19.7 * mm, x1, 19.7 * mm)"),
        ("15.3 * mm, contact", "17.2 * mm, contact"),
        ("11.9 * mm, TRACK_ONLY", "13.9 * mm, TRACK_ONLY"),
        ("11.9 * mm, f'Page", "13.9 * mm, f'Page"),
        ("(8.4 - i * 2.9) * mm", "(10.6 - i * 2.9) * mm"),
        ("2.6 * mm, meta", "5.5 * mm, meta"),
        ("(mb.x + mb.w - 14 * mm, mb.y + mb.h - 14 * mm, mb.x + mb.w, mb.y + mb.h)",
         "(mb.x + mb.w - 18 * mm, mb.y + mb.h - 18 * mm, mb.x + mb.w, mb.y + mb.h)"),
    ]
    for old, new in replacements:
        if source.count(old) != 1:
            raise ValueError('print source replacement mismatch')
        source = source.replace(old, new)
    source = source.replace("- self.table_height(a) - 19 * mm - 2 * mm", "- self.table_height(a) - 22.5 * mm - 2 * mm")
    source = source.replace("hh = min(36 * mm, y - 19 * mm)", "hh = min(36 * mm, y - 22.5 * mm)")
    source = source.replace("    dirs = [(1, 0.35)", "    taken.append((mb.x, mb.y, mb.x + mb.w, mb.y + 13.5 * mm))  # credit and raised scale panel\n    dirs = [(1, 0.35)")
    old = '''        if not done:
            cx = min(max(px, mb.x + mm + w / 2), mb.x + mb.w - mm - w / 2)
            cy = min(max(py + radius + h, mb.y + 6 * mm + h / 2), mb.y + mb.h - mm - h / 2)
            done = (cx, cy, (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2))
'''
    new = '''        if not done:
            # Narrow mixed-equipment maps may exhaust the radial candidates.
            # Search the remaining map space while keeping the complete north
            # arrow / N label and map footer free. Marker coordinates never move.
            reserve = (mb.x + mb.w - 18 * mm, mb.y + mb.h - 18 * mm, mb.x + mb.w, mb.y + mb.h)
            xlo, xhi = mb.x + mm + w / 2, mb.x + mb.w - mm - w / 2
            ylo, yhi = mb.y + 6 * mm + h / 2, mb.y + mb.h - mm - h / 2
            candidates = []
            for row in range(25):
                cy = ylo + (yhi - ylo) * row / 24
                for column in range(13):
                    cx = xlo + (xhi - xlo) * column / 12
                    bx = (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2)
                    if not boxes_hit(bx, reserve):
                        candidates.append((math.hypot(cx-px, cy-py), cx, cy, bx))
            candidates.sort(key=lambda item: item[0])
            chosen = next((item for item in candidates if not any(boxes_hit(item[3], t) for t in taken)), None)
            if chosen is None:
                raise ValueError('No readable map label placement; give this reference more print space')
            _, cx, cy, bx = chosen
            done = (cx, cy, bx)
'''
    if source.count(old) != 1:
        raise ValueError('label fallback source mismatch')
    return source.replace(old, new)


def load_generator(generator):
    generator = Path(generator).resolve()
    module = types.ModuleType('gc500_print_quality')
    module.__file__ = str(generator)
    exec(compile(revised_source(generator.read_text()), str(generator), 'exec'), module.__dict__)
    return module


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--generator', required=True)
    options, remaining = parser.parse_known_args()
    module = load_generator(options.generator)
    sys.argv = [options.generator, *remaining]
    module.main()
