/* Author: Andrew Fisher. Keep the complete loaded truck inside its exterior views. */
(function(root){
'use strict';
const G=root.GC3D;if(!G)return;
const exterior=/^(grid|hero|chase|quarter|detail|frontdetail|low|brake|nose|orbit|heli)$/;
const camStep=G.camStep;
G.camStep=function(dt){
 const result=camStep.apply(this,arguments),S=G.S;
 if(!S||S.vehicle!=='fencing_truck'||!exterior.test(S.shotName||'')||S.camDebug){if(S)S.truckFit1186=null;return result;}
 const cam=S.cam,V=G.V,T=S.tune,aspect=Math.max(.1,(S.cv?.clientWidth||16)/(S.cv?.clientHeight||9));
 const f=V.norm(V.sub(cam.tgt,cam.eye)),right=V.norm(V.cross(f,G.camUp(cam,S.camRoll||0))),up=V.cross(right,f);
 const b=G.plantModel('fencing_truck',S.quality?.name==='balanced'?'balanced':'high').bounds,M=G.raceCarMatrix();
 const tan=Math.tan(G.framedFov(cam.fov||T.fov,aspect,S.shotName)/2);
 const sx=/wide|top|heli|hero/.test(S.shotName)?T.shiftX:T.shiftX*.35,sy=T.shiftY||0,margin=.90;
 let extra=0;
 // Solve the visible frustum for all eight load-envelope corners. The lens shift,
 // portrait crop and body attitude are the same ones used by the actual renderer.
 for(const x of [b.min[0],b.max[0]])for(const y of [b.min[1],b.max[1]])for(const z of [b.min[2],b.max[2]]){
  const p=[M[0]*x+M[4]*y+M[8]*z+M[12],M[1]*x+M[5]*y+M[9]*z+M[13],M[2]*x+M[6]*y+M[10]*z+M[14]],q=V.sub(p,cam.eye);
  const px=V.dot(q,right),py=V.dot(q,up),depth=V.dot(q,f);
  const needX=Math.abs(px)/(tan*aspect*Math.max(.08,margin-(px>=0?sx:-sx)));
  const needY=Math.abs(py)/(tan*Math.max(.08,margin-(py>=0?sy:-sy)));
  extra=Math.max(extra,needX-depth,needY-depth,Math.max(.035,T.carS*.05)-depth);
 }
 const previous=S.truckFit1186,cut=!previous||previous.shot!==S.shotName||!(dt>0);
 // Move out immediately to prevent clipping; ease back in as the load settles.
 const distance=cut?extra:Math.max(extra,previous.distance*Math.exp(-Math.min(dt,.1)*2.4));
 S.truckFit1186={shot:S.shotName,distance};
 if(distance>0)S.cam={...cam,eye:V.sub(cam.eye,V.mul(f,distance+.001*T.carS))};
 return result;
};
root.ShowcaseFinish1186={version:1186,truckExteriorMargin:.90};
})(window);
