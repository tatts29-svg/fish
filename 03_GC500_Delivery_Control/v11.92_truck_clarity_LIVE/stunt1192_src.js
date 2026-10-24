/* Author: Andrew Fisher. Decorative two-wheel corner stunt; no route or record changes. */
(function(root){
'use strict';
const G=root.GC3D;if(!G||root.ShowcaseTruck1192)return;
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const step=G.step,matrix=G.raceCarMatrix;
// Use the same signed circuit curvature and speed as the existing driver.
// Two-stage easing avoids a snap as the chicane switches sides. No wall clock,
// random kicks, timers, geometry rebuilding or changes to driving forces.
G.step=function(dt){
 const result=step.apply(this,arguments),S=G.S;if(!S||!S.sim)return result;
 const m=S.sim;
 if(S.vehicle!=='fencing_truck'){delete m.truckStunt1192;return result;}
 const a=m.truckStunt1192||(m.truckStunt1192={angle:0,lead:0,target:0});
 const k=S.kAt?S.kAt(m.s+1):0;
 const bend=ease((Math.abs(k)*S.tune.carS-.012)/.060),speed=ease((m.v/Math.max(.1,S.tune.vmax)-.06)/.24);
 const target=(m.go&&!S.calmDrive&&!S.reducedMotion&&m.air<=.01)?Math.sign(k)*.48*bend*speed:0;
 const d=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));
 a.target=target;a.lead+=(target-a.lead)*(1-Math.exp(-d*7));a.angle+=(a.lead-a.angle)*(1-Math.exp(-d*7));
 if(Math.abs(a.angle)<.00001&&Math.abs(a.lead)<.00001)a.angle=a.lead=0;
 return result;
};
G.raceCarMatrix=function(){
 const S=G.S;if(!S||S.vehicle!=='fencing_truck')return matrix.apply(this,arguments);
 const m=S.sim,P=S.pose,s=S.tune.carS,a=m.truckStunt1192;
 const stunt=a?a.angle:0,blend=ease(Math.abs(stunt)/.07),roll=stunt+(m.roll||0)*(1-blend),pitch=(m.pitch||0)*(1-blend);
 const cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll);
 // Support of the actual tyre profile after pitch and roll. At the stunt's
 // full lean both outside tyres stay on the road and both inside tyres lift.
 // Rounded shoulders matter: a rectangle pivot would bury the tyre in the road.
 const profile=[[.11,-.072],[.18,-.072],[.202,-.055],[.205,-.025],[.205,.025],[.202,.055],[.18,.072],[.11,.072]];
 let low=Infinity;
 for(const x of [-1.65,1])for(const z of [-.43,.43])for(const [r,d]of profile)
  low=Math.min(low,(-x*sp+.205*cp)*cr+(z+d)*sr-r*Math.abs(cr));
 const shiftZ=blend*(.205*sr-Math.sign(roll)*.43*(1-cr));
 const W=q=>{let[x,y,z]=q;[x,y]=[x*cp+y*sp,-x*sp+y*cp];[y,z]=[y*cr+z*sr,-y*sr+z*cr];
  y-=low;z+=shiftZ;
  return[P.pos[0]+(P.fwd[0]*x+P.rt[0]*z)*s,P.pos[1]+y*s,P.pos[2]+(P.fwd[2]*x+P.rt[2]*z)*s];};
 const o=W([0,0,0]),x=W([1,0,0]),y=W([0,1,0]),z=W([0,0,1]);
 return new Float32Array([x[0]-o[0],x[1]-o[1],x[2]-o[2],0,y[0]-o[0],y[1]-o[1],y[2]-o[2],0,z[0]-o[0],z[1]-o[1],z[2]-o[2],0,...o,1]);
};
// Tight contact patches use the rendered tyre positions, so the lifted side
// loses its contact shadow. They share the existing shade batch and draw call.
G.truckContacts1192=function(S,sh,y){
 if(S.vehicle!=='fencing_truck')return;
 const M=G.raceCarMatrix(),scale=S.tune.carS,profile=[[.11,-.072],[.18,-.072],[.202,-.055],[.205,-.025],[.205,.025],[.202,.055],[.18,.072],[.11,.072]];
 const radial=Math.hypot(M[1],M[5])||1;let grounded=0;
 for(const x of [-1.65,1])for(const z of [-.43,.43]){
  let low=null;
  for(const [r,d]of profile){const q=[x-r*M[1]/radial,.205-r*M[5]/radial,z+d],p=[0,1,2].map(j=>M[j]*q[0]+M[4+j]*q[1]+M[8+j]*q[2]+M[12+j]);if(!low||p[1]<low[1])low=p;}
  const lift=Math.max(0,low[1]-S.tune.deckH),alpha=.82*Math.exp(-lift/(.10*scale));
  if(lift<.015*scale)grounded++;
  if(alpha<.01)continue;
  const c=sh.vert(low[0],y,low[2],0,0,0,alpha,0,0),ring=[];
  for(let i=0;i<20;i++){const t=i/20*Math.PI*2,a=Math.cos(t)*(.15+lift*.16)*scale,b=Math.sin(t)*(.10+lift*.12)*scale;
   ring.push(sh.vert(low[0]+S.pose.fwd[0]*a+S.pose.rt[0]*b,y,low[2]+S.pose.fwd[2]*a+S.pose.rt[2]*b,0,0,0,0,0,0));}
  for(let i=0;i<20;i++)sh.tri(c,ring[i],ring[(i+1)%20]);
 }
 S.truckContact1192={grounded};
};
root.ShowcaseTruck1192={version:1192,author:'Andrew Fisher',maxBankDegrees:.48*180/Math.PI,
 state:()=>{const S=G.S,a=S&&S.sim&&S.sim.truckStunt1192;return a?{...a,vehicle:S.vehicle}:null;}};
})(window);
