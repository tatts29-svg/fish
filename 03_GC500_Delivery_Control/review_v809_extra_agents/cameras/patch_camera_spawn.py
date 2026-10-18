#!/usr/bin/env python3
"""Author: Andrew Fisher. Isolated v8.09 proposal; never edits the moving draft."""
import hashlib,pathlib,sys
src=pathlib.Path(sys.argv[1]);dst=pathlib.Path(sys.argv[2])
assert src.resolve()!=dst.resolve(), 'Write an isolated candidate, not the source under review'
s=src.read_text()
assert hashlib.sha256(src.read_bytes()).hexdigest()=='718b2cfa403ae8fb0d6bc7b3bde6578719e62802b2eb23c38513e4d0700f1707', 'Expected frozen ba9fff7e car-app.js; re-review moved source'
assert not dst.exists(), 'Destination already exists; choose a new isolated candidate'
a="m.post={kind:'crouch',k:1,want:1,stage:null,rate:1.4,seat:null,kneel:null};driverShow(true);DX.phase='crawlout';"
b="m.post={kind:'crouch',k:1,want:1,stage:null,rate:1.4,seat:null,kneel:null};m.update(0);/* pose at the sill before the first visible frame */driverShow(true);DX.phase='crawlout';"
assert s.count(a)==1,'Expected exact v8.09 first-visible walker site once'
dst.parent.mkdir(parents=True,exist_ok=True);dst.write_text(s.replace(a,b))
