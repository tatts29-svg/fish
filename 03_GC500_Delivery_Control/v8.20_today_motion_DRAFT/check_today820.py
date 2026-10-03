#!/usr/bin/env python3
"""Author: Andrew Fisher. Patch boundaries and native source preservation; no service writes."""
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

here = Path(__file__).resolve().parent
root = here.parent
candidate = Path(os.environ.get('PAGE', root / 'build/GC500_v8.20/GC500_Delivery_Control_hosted.html'))
base = Path(os.environ.get('BASE', candidate.parent / 'base_live.html'))
a, b = base.read_text(), candidate.read_text()
checks = []

def check(name, value):
    checks.append({'name': name, 'pass': bool(value)})

check('One scoped release marker, stylesheet and controller', all(b.count(x) == 1 for x in ['<meta name="gc500-today-v820"', '<style id="today-polish-v820">', '<script id="today-motion-v820">']))
check('Production controller name and no preview payload', 'TodayMotionPreview' not in b and 'native-snapshot.json' not in b and 'Design preview' not in (here / 'today820_src.js').read_text())
clean = re.sub(r'<meta name="gc500-today-v820"[^>]+>\n', '', b)
clean = re.sub(r'<style id="today-polish-v820">.*?</style>', '', clean, flags=re.S)
clean = re.sub(r'<script id="today-motion-v820">.*?</script>\n', '', clean, flags=re.S)
clean = clean.replace(" + ' · Today v8.20'", '')
# The new style leaves its leading newline behind; remove only that known marker boundary.
clean = clean.replace('selected-day weather v8.18">\n\n', 'selected-day weather v8.18">\n', 1)
check('Original page byte-equivalent after reversing explicit insertions/footer', clean == a)
check('Native rendering and data sources untouched', clean == a)
check('Today-scoped CSS and active-only preference guard', '#pane-today' in (here / 'today820_src.css').read_text() and '}, 250);' in (here / 'today820_src.js').read_text() and 'clearTimeout(motionGuard)' in b)
with tempfile.TemporaryDirectory(prefix='gc500-today820-') as d:
    target = Path(d) / 'candidate.html'
    target.write_text(b)
    result = subprocess.run([sys.executable, str(here / 'patch_v820.py'), str(target)], capture_output=True, text=True)
    check('Patch refuses double installation without changing candidate', result.returncode != 0 and target.read_text() == b)
    target.write_text('<!doctype html><html><head></head><body></body></html>')
    before = target.read_bytes()
    result = subprocess.run([sys.executable, str(here / 'patch_v820.py'), str(target)], capture_output=True, text=True)
    check('Patch refuses a base without required release/native renderer', result.returncode != 0 and target.read_bytes() == before)
report = {'author': 'Andrew Fisher', 'scope': 'Today v8.20 source boundaries; no live writes', 'base_sha256': hashlib.sha256(base.read_bytes()).hexdigest(), 'candidate_sha256': hashlib.sha256(candidate.read_bytes()).hexdigest(), 'checks': checks, 'passed': all(c['pass'] for c in checks)}
print(json.dumps(report, indent=2))
sys.exit(0 if report['passed'] else 1)
