#!/usr/bin/env python3
"""v8.19 - the patch's anchors (Codex review 3). Author: Andrew Fisher. CPU only, nothing is fetched or written outside
a temporary folder. On copies of the live base:
  1. the base as it is: the patch applies once and refuses a second run;
  2. a base where a later release changed the footer (" · v8.20" on the end) and the release marker (v8.20): the patch
     still applies, the footer names v8.19 once, the marker reads v8.19;
  3. a base with no release marker, and one with no footer statement: the patch stops with a plain message naming the
     missing anchor, and writes nothing.
        python3 anchor_check819.py <base_live.html>"""
import os, re, shutil, subprocess, sys, tempfile
base = sys.argv[1]; here = os.path.dirname(os.path.abspath(__file__)); patch = os.path.join(here, '..', 'patch_v819.py')
T = open(base, encoding='utf-8').read(); tmp = tempfile.mkdtemp(prefix='anchor819_'); passes = fails = 0
def ok(c, what, d=''):
    global passes, fails
    passes += bool(c); fails += (not c); print(('PASS ' if c else 'FAIL ') + what + (('  - ' + str(d)[:300]) if d != '' else ''))
def run(name, text):
    f = os.path.join(tmp, name + '.html'); open(f, 'w', encoding='utf-8').write(text)
    r = subprocess.run([sys.executable, patch, f], capture_output=True, text=True); return r, open(f, encoding='utf-8').read()
FOOT = re.compile(r"\$\('#footL'\)\.textContent\s*=\s*[^;\n]+;")
r, out = run('as_is', T)
ok(r.returncode == 0 and "+ ' · v8.19'" in FOOT.search(out).group(0) and '<meta name="gc500-release" content="v8.19">' in out, 'the live base: applies, footer and marker read v8.19', r.stdout.strip())
r2 = subprocess.run([sys.executable, patch, os.path.join(tmp, 'as_is.html')], capture_output=True, text=True)
ok(r2.returncode != 0 and 'already applied' in (r2.stderr + r2.stdout), 'a second run is refused', (r2.stderr + r2.stdout).strip())
moved = T.replace("DATA.build_version;", "DATA.build_version + ' · v8.20';", 1).replace('<meta name="gc500-release" content="v8.13">', '<meta name="gc500-release" content="v8.20">')
ok(moved != T and moved.count('content="v8.20"') == 1, 'built a base with the footer and the marker moved on (v8.20)')
r, out = run('moved', moved)
f = FOOT.search(out).group(0) if r.returncode == 0 else ''
ok(r.returncode == 0 and ".replace(/ · v\\d+\\.\\d+$/, '') + ' · v8.19'" in f and '<meta name="gc500-release" content="v8.19">' in out, 'moved footer and marker: still applies; the footer drops the other release tag and names v8.19 once', f)
for name, text, what in (('no_marker', re.sub(r'<meta name="gc500-release" content="v[0-9.]+">', '', T), 'release marker'),
                         ('no_footer', FOOT.sub('/* footer gone */', T, count=1), 'footer')):
    r, out = run(name, text)
    msg = (r.stderr + r.stdout).strip()
    ok(r.returncode != 0 and what in msg and 'found 0 times' in msg and out == text, f'no {what}: stops with a plain message, writes nothing', msg)
shutil.rmtree(tmp)
print(f'\n{passes} passed, {fails} failed'); sys.exit(1 if fails else 0)
