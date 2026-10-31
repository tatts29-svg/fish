#!/usr/bin/env python3
"""Author: Andrew Fisher. Exact preservation check for the typography-only release."""
from pathlib import Path
import argparse, hashlib
from patch_v845 import BASE_SHA256, build, clarity_style
p=argparse.ArgumentParser();p.add_argument('--base',required=True);p.add_argument('--candidate',required=True);a=p.parse_args()
base=Path(a.base).read_bytes();candidate=Path(a.candidate).read_bytes();checks=[]
def check(name,ok):
    checks.append((name,bool(ok)));print(('PASS ' if ok else 'FAIL ')+name)
check('verified base',hashlib.sha256(base).hexdigest()==BASE_SHA256)
check('exact reproducible candidate',build(base)==candidate)
for label,value in [('different base',base+b' '),('repeat application',candidate)]:
    try: build(value); rejected=False
    except ValueError: rejected=True
    check(label+' rejected',rejected)
s=candidate.decode('utf-8');style=clarity_style();check('one scoped style',s.count(style)==1)
s=s.replace('\n'+style,'',1).replace('<meta name="gc500-release" content="v8.45">','<meta name="gc500-release" content="v8.44">',1).replace("+ ' · v8.45'; /* v8.19 - the footer names the release once */","+ ' · v8.44'; /* v8.19 - the footer names the release once */",1)
check('all original data scripts styles navigation and media byte-preserved',s.encode('utf-8')==base)
print(f'{sum(ok for _,ok in checks)}/{len(checks)} preservation checks passed')
raise SystemExit(0 if all(ok for _,ok in checks) else 1)
