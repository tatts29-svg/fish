 /* Author: Andrew Fisher. The loaded rigid truck needs room above and behind its cab. */
 if(S.vehicle==='fencing_truck'){
  const target=(back,y)=>[car[0]-cf[0]*back*Sx,car[1]+y*Sx,car[2]-cf[2]*back*Sx];
  if(name==='hero'||name==='grid')return {eye:behind(-4.2,2.05,side*4.4),tgt:target(.50,.87),fov:37};
  if(name==='chase')return {eye:behind(6.8+.7*sp+arm,2.65,1.5),tgt:target(.40,.88),fov:37+3*sp};
  if(name==='quarter')return {eye:behind(5.1,2.1,side*4.1),tgt:target(.50,.85),fov:40};
  if(name==='detail')return {eye:behind(2.9,1.35,side*2.25),tgt:target(.45,.83),fov:32};
  if(name==='frontdetail')return {eye:behind(-2.9,1.35,side*2.25),tgt:target(.45,.83),fov:32};
  if(name==='low')return {eye:behind(5.2+.7*sp+arm,1.65,side*2.8),tgt:target(.45,.88),fov:39+3*sp};
  if(name==='onboard')return {eye:[car[0]+cf[0]*1.34*Sx,car[1]+1.10*Sx,car[2]+cf[2]*1.34*Sx],tgt:[car[0]+cf[0]*9*Sx,car[1]+.98*Sx,car[2]+cf[2]*9*Sx],fov:52+12*sp};
 }
