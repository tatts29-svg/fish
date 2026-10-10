# Author: Andrew Fisher
from pathlib import Path
import hashlib
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASE_SHA = '198bb721e7bff046bdfeb92c229e0dd35cb41a5edd4aa9c0d856fe8348aa9f28'
CHANGES = [
    ("+ ' · v9.91'", "+ ' · v9.92'", 'Release version'),
    ("heading.textContent = ref.dataset.tl841Ref + ' · Load progress'",
     "heading.textContent = ref.dataset.tl841Ref + ' · Setup'", 'Setup facts heading'),
    ("if (gantry) { movedGantries.set(ref, gantry); heading.after(gantry); }",
     "if (gantry) movedGantries.set(ref, gantry);", 'Keep native lights visible beside their reference'),
    ("for (const gantry of detail.querySelectorAll('.tl841-gantry'))",
     "for (const gantry of card.querySelectorAll('.tl841-gantry'))", 'Retain current-stage motion in the summary'),
    ("card.append(detail);",
     "card.append(detail);\n   window.LoadLights992?.refreshCard(card);", 'Place existing measurements in the summary'),
]


def main():
    p = Path(sys.argv[1])
    s = p.read_text()
    if 'loadlights992-style' in s:
        raise SystemExit('Already applied')
    if hashlib.sha256(p.read_bytes()).hexdigest() != BASE_SHA:
        raise SystemExit('Wrong live base: requires exact v9.91 load cards')
    for before, after, label in CHANGES:
        s = rep(s, before, after, label, str(p))
    s = rep(s, '</head>\n<body', '<style id="loadlights992-style">' +
            (HERE / 'loadlights992.css').read_text() + '</style>\n</head>\n<body',
            'Visible load lights spacing', str(p))
    s = rep(s, '</body>\n</html>', '<script id="loadlights992-script">' +
            (HERE / 'loadlights992.js').read_text() + '</script>\n</body>\n</html>',
            'Visible existing dimensions and weights', str(p))
    p.write_text(s)


if __name__ == '__main__':
    main()
