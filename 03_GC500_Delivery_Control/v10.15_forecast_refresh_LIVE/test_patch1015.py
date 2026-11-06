"""Author: Andrew Fisher. Exact-base and repeat guards for source dependency invalidation."""
from pathlib import Path
import hashlib,sys
import patch_v1015 as patch
base=Path(sys.argv[1]).read_text()
assert hashlib.sha256(base.encode()).hexdigest()==patch.BASE_SHA
out=patch.apply(base)
checks=1
for needle in ["DOCS.state = 'none'; sharedCache975(); return;", "sharedCache975(); /* v10.15", "DOCS.busy = false; sharedCache975(); docsRedraw(); photoRedraw();", "+ ' · v10.15'"]:
    assert out.count(needle)==1,needle
    checks+=1
for altered in [out,base+'\n',base.replace("DOCS.busy = true; DOCS.state = 'loading'", "DOCS.busy = true; DOCS.state = 'waiting'",1)]:
    try:patch.apply(altered)
    except ValueError:checks+=1
    else:raise AssertionError('Changed or repeated base was accepted')
assert out.count('<script')==base.count('<script');checks+=1
print('{"pass":true,"checks":'+str(checks)+'}')
