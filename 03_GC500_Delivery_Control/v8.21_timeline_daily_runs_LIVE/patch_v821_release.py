#!/usr/bin/env python3
"""Author: Andrew Fisher. Apply frozen v8.21, isolate supplier styling and label the release."""
from pathlib import Path
import re, subprocess, sys, tempfile

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
from scope_v821_supplier import patch as scope_supplier

def one(text, pattern, name):
    matches = list(re.finditer(pattern, text))
    if len(matches) != 1:
        raise SystemExit('v8.21 release: expected one ' + name + ', found ' + str(len(matches)))
    return matches[0]

def label_release(text):
    marker = '<meta name="gc500-release" content="v8.19">'
    one(text, re.escape(marker), 'v8.19 release marker')
    text = rep(text, marker, '<meta name="gc500-release" content="v8.21">', 'v8.21 release marker', 'candidate')
    footer = one(text, r"\$\('#footL'\)\.textContent\s*=\s*[^;\n]+\+ ' · v8\.19';", 'v8.19 footer label').group()
    updated = footer.replace(" + ' · v8.19';", " + ' · v8.21';")
    if updated == footer:
        raise SystemExit('v8.21 release: unexpected footer suffix')
    return rep(text, footer, updated, 'v8.21 footer label', 'candidate')

def main():
    if len(sys.argv) != 2:
        raise SystemExit('Usage: patch_v821_release.py candidate.html')
    target = Path(sys.argv[1]).resolve()
    original = target.read_text()
    if 'const DAILY821 =' in original:
        raise SystemExit('v8.21 release already applied')
    one(original, r'<meta name="gc500-release" content="v8\.19">', 'live v8.19 base marker')
    # Work on a private temporary copy: a failed anchor leaves the input unchanged.
    with tempfile.TemporaryDirectory(prefix='gc500-v821-release-') as directory:
        temporary = Path(directory) / 'candidate.html'
        temporary.write_text(original)
        subprocess.run([sys.executable, str(HERE / 'patch_v821.py'), str(temporary)], check=True)
        text, count = scope_supplier(temporary.read_text(), (HERE / 'daily821.css').read_text())
        target.write_text(label_release(text))
    print('Applied v8.21 release: frozen Timeline source, supplier boundary (' + str(count) + ' selectors), release labels')

if __name__ == '__main__':
    main()
