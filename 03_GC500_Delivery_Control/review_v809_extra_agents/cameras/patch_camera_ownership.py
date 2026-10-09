#!/usr/bin/env python3
"""Author: Andrew Fisher. Isolated automatic-camera ownership proposal for frozen v8.09."""
import hashlib,pathlib,sys
src=pathlib.Path(sys.argv[1]);dst=pathlib.Path(sys.argv[2])
assert src.resolve()!=dst.resolve(),'Use an isolated output'
assert not dst.exists(),'Destination exists; choose a fresh candidate'
s=src.read_text();before=hashlib.sha256(src.read_bytes()).hexdigest()
assert before in {'718b2cfa403ae8fb0d6bc7b3bde6578719e62802b2eb23c38513e4d0700f1707','39df72cf086d5a3b31f0288a2d3b6f11c4ed4161f5ff9f95f212e3a41d1542e1'},'Expected frozen source, optionally with verified spawn patch'
pairs=[("DXC={mode:null,leg:null,saved:null,t:0,dur:1.2};","DXC={mode:null,leg:null,saved:null,t:0,dur:1.2,controlPos:new T.Vector3(),controlTarget:new T.Vector3()};"),('controls.update();confineCamera();',"/* let residual input settle, then retain the driver's authored shot */const dxOwns=!!DXC.mode;if(dxOwns){DXC.controlPos.copy(camera.position);DXC.controlTarget.copy(controls.target);}controls.update();if(dxOwns){camera.position.copy(DXC.controlPos);controls.target.copy(DXC.controlTarget);camera.lookAt(controls.target);camera.updateMatrixWorld();}confineCamera();")]
for a,b in pairs:
 assert s.count(a)==1,'Expected exactly one source fragment'
 s=s.replace(a,b)
dst.parent.mkdir(parents=True,exist_ok=True);dst.write_text(s)
