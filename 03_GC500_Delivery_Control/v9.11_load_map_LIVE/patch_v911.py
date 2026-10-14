#!/usr/bin/env python3
"""Author: Andrew Fisher. Compact numbered daily drops beside the load selector."""
import argparse, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

def patch(s):
    if 'id="drops911-script"' in s:
        raise ValueError('Compact daily drop map already applied')
    for marker in ['window.Drops908', 'function timeline908Arrange(', 'const StaffNames910']:
        if marker not in s:
            raise ValueError('Missing current native feature: ' + marker)
    def replace(old, new):
        nonlocal s
        s = rep(s, old, new, 'v911 compact delivery map', 'page.html')
    replace("+ ' · v9.10'; /* v8.19", "+ ' · v9.11'; /* v8.19")
    css = '\n'.join((HERE / name).read_text() for name in ['compact911.css', 'drops911.css', 'plan911.css', 'staff911fix.css'])
    js = '\n'.join((HERE / name).read_text() for name in ['plan911.js', 'drops911.js', 'staff911fix.js'])
    if '</script' in js or '</style' in css:
        raise ValueError('Unsafe source boundary')
    replace('</head>\n<body>', '<style id="drops911-style">' + css + '</style>\n</head>\n<body>')
    replace('</script>\n</body></html>', '</script>\n<script id="drops911-script">\n' + js + '\n</script>\n</body></html>')
    return s

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('base', type=Path)
    ap.add_argument('output', type=Path)
    args = ap.parse_args()
    args.output.write_text(patch(args.base.read_text()))
    print('Compact drop-map candidate prepared; no operational records changed.')
