"""Author: Andrew Fisher. Convert the public company logo to flat model geometry.
Requires numpy, opencv-python-headless and mapbox-earcut; no runtime dependencies.
The original remains at the public source URL; no private attachment is embedded.
"""
import hashlib,json,sys
from pathlib import Path
import cv2,numpy as np,mapbox_earcut as earcut
p=Path(sys.argv[1]); b=p.read_bytes()
im=cv2.imdecode(np.frombuffer(b,np.uint8),cv2.IMREAD_UNCHANGED)
assert im.shape==(177,718,4),im.shape
B,G,R,A=[im[:,:,i] for i in range(4)]
opaque=A>180
masks=[opaque&(R>210)&(G>210)&(B>210),opaque&(R>150)&(R<215)&(G>150)&(G<215),opaque&(R>180)&(G<120)&(B<120),opaque&(R<80)&(G<80)&(B<80)]
meshes=[]
for mask in masks:
 contours,hierarchy=cv2.findContours(mask.astype(np.uint8),cv2.RETR_CCOMP,cv2.CHAIN_APPROX_SIMPLE)
 vertices=[];indices=[]
 for i,c in enumerate(contours):
  if hierarchy[0,i,3]>=0 or abs(cv2.contourArea(c))<2:continue
  rings=[c];child=hierarchy[0,i,2]
  while child>=0:
   rings.append(contours[child]);child=hierarchy[0,child,0]
  points=[];ends=[]
  for ring in rings:
   ps=cv2.approxPolyDP(ring,.5,True).reshape(-1,2)
   if len(ps)<3:continue
   points.extend(ps.tolist());ends.append(len(points))
  pts=np.asarray(points,dtype=np.float64);ix=earcut.triangulate_float64(pts,np.asarray(ends,dtype=np.uint32));offset=len(vertices)//2
  vertices.extend(round(float(v)/718,6) for v in pts.flatten())
  indices.extend(int(n)+offset for n in ix)
 meshes.append({'v':vertices,'i':indices})
result={'source':'https://advtempfence.com.au/assets/images/advanced-fencing-logo.png','sha256':hashlib.sha256(b).hexdigest(),'width':718,'height':177,'meshes':meshes}
Path(sys.argv[2]).write_text('/* Author: Andrew Fisher. Public company logo, simplified to model geometry. */\nconst ADVANCED_LOGO1180='+json.dumps(result,separators=(',',':'))+';\n')
print('Logo triangles:',sum(len(q['i'])//3 for q in meshes),'source SHA256:',result['sha256'])
