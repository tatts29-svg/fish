# Author: Andrew Fisher
from pathlib import Path
import hashlib
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASE_SHA = '0460e6f2306946c0e7262600414ff65b0824b0a086e618dbce28d7c66669e890'


def main():
    p = Path(sys.argv[1])
    s = p.read_text()
    if 'preview993-style' in s:
        raise SystemExit('Already applied')
    if hashlib.sha256(p.read_bytes()).hexdigest() != BASE_SHA:
        raise SystemExit('Wrong base: requires exact live v9.92')
    s = rep(s, "+ ' · v9.92'", "+ ' · v9.93'", 'Approved release footer', str(p))
    s = rep(s, '</head>\n<body', '<style id="preview993-style">' +
            (HERE / 'preview993.css').read_text() + '\n' +
            (HERE / 'today993.css').read_text() + '</style>\n</head>\n<body',
            'Preview hierarchy and interaction styling', str(p))
    s = rep(s, '</body>\n</html>', '<script id="preview993-script">' +
            (HERE / 'preview993.js').read_text() + '</script>\n' +
            '<script id="today993-script">' + (HERE / 'today993.js').read_text() +
            '</script>\n</body>\n</html>',
            'Native load facts and compact Today controls', str(p))
    p.write_text(s)


if __name__ == '__main__':
    main()
