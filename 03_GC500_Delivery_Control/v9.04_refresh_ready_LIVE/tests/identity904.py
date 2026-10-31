#!/usr/bin/env python3
"""Author: Andrew Fisher. Reproducible first-draw patch; embedded records remain identical."""
import importlib.util, re, sys
from pathlib import Path
HERE=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('patch904',HERE/'patch_v904.py')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
base=Path(sys.argv[1]).read_text();candidate=Path(sys.argv[2]).read_text()
assert mod.patch(base,'identity-base.html')==candidate
for name in ('DATA','COMMITTED'):
 pattern=rf'const {name} = (.*?);\n'
 a=re.search(pattern,base);b=re.search(pattern,candidate)
 assert bool(a)==bool(b)
 if a:assert a.group(1)==b.group(1),name+' changed'
assert candidate.index("document.documentElement.setAttribute('data-refresh904'")<candidate.index('const DATA = ')
assert candidate.index('const Refresh904 = ')<candidate.index('/* A deep link uses the later inline map/progress extensions too.')
for bad in (candidate,base.replace('const SYNC_COLLS =','const WRONG_COLLS ='),re.sub(r"\+ ' · v(?:8\.99|9\.0[0-3])'; /\* v8\.19","+ ' · v1.00'; /* v8.19",base)):
 try:mod.patch(bad,'wrong-base.html')
 except SystemExit:pass
 else:raise AssertionError('Wrong or repeated patch accepted')
print('PASS: exact patch reproduction, embedded DATA/COMMITTED unchanged, early gate placement and wrong/repeated bases rejected.')
