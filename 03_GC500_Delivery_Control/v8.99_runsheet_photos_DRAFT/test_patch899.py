#!/usr/bin/env python3
"""Author: Andrew Fisher. Verify guards, deterministic output and preserved photo/filename sources."""
import argparse,re
from pathlib import Path
from patch_v899 import patch

ap=argparse.ArgumentParser();ap.add_argument('base',type=Path);ap.add_argument('candidate',type=Path);args=ap.parse_args()
base=args.base.read_text();candidate=args.candidate.read_text()
assert patch(base)==candidate,'candidate differs from guarded patch'
for source in [candidate,base.replace(' · v8.98',' · v8.97')]:
    try:patch(source)
    except ValueError:pass
    else:raise AssertionError('repeat/wrong-base guard did not reject')
media=lambda s:re.findall(r'data:image/[^\s\"\'<>]+',s)
assert media(base)==media(candidate),'embedded images changed'
for name in ['dpPics','dpMasterImgs','dpStockFig','dpShotFigs','pdf7Name']:
    pattern=r'function '+name+r'\([^\n]*[\s\S]*?\n\}'
    before=re.search(pattern,base);after=re.search(pattern,candidate)
    assert before and after and before.group()==after.group(),name+' changed'
print('PASS deterministic patch, repeat/wrong-base guards, embedded images, photo sources and PDF filenames')
