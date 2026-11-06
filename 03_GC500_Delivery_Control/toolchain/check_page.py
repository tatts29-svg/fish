#!/usr/bin/env python3
"""Checks every GC500 build must pass before it is uploaded.
 1. every inline <script> parses (node --check)
 2. no secret has crept in: the edit key itself (if it is in the environment, it is looked for by value), and no
    MORE Google API keys or Mapbox tokens than the base page already carried (the live page has always held a few
    public ones; a new one appearing means somebody pasted a key)
 3. the build still says who wrote it (Author: Andrew Fisher)
    python3 check_page.py build.html [--base live.html]"""
import os, re, subprocess, sys, tempfile

def scripts(t):
    return re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', t, re.S)

def secrets(t):
    return {'google key': len(re.findall(r'AIza[0-9A-Za-z_-]{35}', t)), 'mapbox token': len(re.findall(r'pk\.eyJ[0-9A-Za-z_.-]{20,}', t))}

def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = a[0]; base = a[a.index('--base') + 1] if '--base' in a else None
    t = open(page, encoding='utf-8').read()
    bad = []
    with tempfile.TemporaryDirectory() as d:
        for i, s in enumerate(scripts(t)):
            fn = os.path.join(d, f's{i}.js'); open(fn, 'w', encoding='utf-8').write(s)
            r = subprocess.run(['node', '--check', fn], capture_output=True, text=True)
            if r.returncode: bad.append(f'inline script {i} does not parse: ' + r.stderr.strip()[:400])
    tok = os.environ.get('GC500_EDIT_TOKEN', '')
    if tok and len(tok) >= 12 and tok in t: bad.append('THE EDIT KEY IS IN THE PAGE - do not upload, do not commit')
    now = secrets(t)
    if base:
        was = secrets(open(base, encoding='utf-8').read())
        for k in now:
            if now[k] > was[k]: bad.append(f'{now[k] - was[k]} new {k}(s) in the page - check before uploading')
    if 'Author: Andrew Fisher' not in t: bad.append('the page no longer says "Author: Andrew Fisher"')
    print(f'checked {page}: {len(scripts(t))} inline scripts, {len(t.encode("utf-8")):,} bytes, secrets {now}')
    if bad:
        print('\n'.join('FAIL ' + b for b in bad)); sys.exit(1)
    print('PASS all checks')

main()
