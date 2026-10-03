import {ENGINE_FIT,STEER_PINION,cogPose,cogCouplingWorld,COG_UJ_SETBACK} from './engine-kinematics.js';
/* THE STEERING SHAFT — the one line from the Coates Way cog to the car.
   Andrew Fisher, 23 Sep 2026: the cog becomes the steering wheel, because it operates everything, so the
   cog comes off the engine. This file used to build the front distribution drive (a distribution
   case on the front of the block, two 30-tooth sprockets, a 65-link duplex chain, tensioner and guide) that
   let a nose-mounted cog turn the crank. That drive is gone — the crank nose carries its timing belt and its
   serpentine pulley and nothing else — and what is left here is the shaft the cog turns: a double-Cardan
   telescoping steering shaft from the column's coupling down to the rack's pinion (STEER_PINION), built the
   way a prop shaft is built: a universal joint at each end, so it can run at an angle while the wheel and the
   pinion both keep their own axes, and a slip spline in the middle, so its length is whatever the two joints
   demand. The pinion-end joint is fixed in space; the wheel-end joint rides with the machine's coupling; the
   body between them is laid out from those two points (layShaft). Nothing is interpolated by hand.
   The id 'front-drive-shaft' and its reference ENG-FRONT-DRIVE-SHAFT are kept: references, once given, are
   stable (README). Rig units throughout (see ENGINE_FIT). */
export function buildFrontDrive(T,mats,assembly,mesh,batch){
 const alongX=g=>{g.rotateZ(Math.PI/2);return g;};   /* cylinders are built about y; the shaft turns about its own line */
 const shaftR=.019/ENGINE_FIT.scale,ujA=[STEER_PINION.x,STEER_PINION.y,STEER_PINION.z];   /* pinion-end joint centre, rig units; a 38 mm steering shaft */
 const shaft=assembly('front-drive-shaft','Steering shaft, double-jointed and telescoping',ujA,[-.3,.28,0]);
 const yokeGeo=(ears)=>{const g=[alongX(new T.CylinderGeometry(shaftR*1.5,shaftR*1.5,.05,16))];for(const sgn of [-1,1])g.push(ears==='z'?new T.BoxGeometry(.06,.075,.014).translate(.045,0,sgn*.048):new T.BoxGeometry(.06,.014,.075).translate(.045,sgn*.048,0));return g;};
 const spiderGeo=()=>[new T.CylinderGeometry(.011,.011,.125,8).rotateX(Math.PI/2),new T.CylinderGeometry(.011,.011,.125,8),new T.SphereGeometry(.02,10,8)];
 /* joint A: yoke on the pinion (turns with the pinion), spider, then the shaft body */
 const yokeA=new T.Group();shaft.add(yokeA);batch(yokeA,'steel',yokeGeo('z'),'Pinion-side yoke');batch(yokeA,'chrome',spiderGeo(),'Spider A');
 const body=new T.Group();shaft.add(body);         /* aimed along the shaft each frame */
 const spin=new T.Group();body.add(spin);          /* turns about the shaft's own axis */
 const outer=new T.Mesh(alongX(new T.CylinderGeometry(shaftR,shaftR,1,16)).translate(.5,0,0),mats.steel);outer.name='Slip-spline outer tube';
 const inner=new T.Mesh(alongX(new T.CylinderGeometry(shaftR*.72,shaftR*.72,1,12)).translate(.5,0,0),mats.chrome);inner.name='Splined inner shaft';
 for(const m of [outer,inner]){m.castShadow=m.receiveShadow=true;spin.add(m);}
 const yokeB1=new T.Group();spin.add(yokeB1);batch(yokeB1,'steel',yokeGeo('y').map(g=>g.rotateY(Math.PI)),'Shaft-side yoke A');
 const yokeB2=new T.Group();spin.add(yokeB2);batch(yokeB2,'steel',yokeGeo('y'),'Shaft-side yoke B');
 const yokeC=new T.Group();shaft.add(yokeC);batch(yokeC,'steel',yokeGeo('z').map(g=>g.rotateY(Math.PI)),'Column-side yoke');batch(yokeC,'chrome',spiderGeo(),'Spider B');
 /* the flange that meets the machine's coupling — sized to the coupling at the wheel's scale */
 {const flange=alongX(new T.CylinderGeometry(.040,.040,.016,24)).translate(-.062,0,0);const bolts=[];for(let i=0;i<6;i++){const a=i/6*Math.PI*2;bolts.push(alongX(new T.CylinderGeometry(.006,.006,.012,6)).translate(-.050,Math.cos(a)*.028,Math.sin(a)*.028));}
  batch(yokeC,'steel',[flange],'Coupling flange');batch(yokeC,'chrome',bolts,'Flange fasteners');}
 const xAxisV=new T.Vector3(1,0,0),dir=new T.Vector3();let shaftLength=0,shaftAngle=0,shaftAngleDeg=0;
 /* cogUJ: the wheel-end joint centre in rig units, absolute */
 function layShaft(cogUJ){
  dir.set(cogUJ.x-ujA[0],cogUJ.y-ujA[1],(cogUJ.z||0)-ujA[2]);shaftLength=dir.length();dir.normalize();
  body.quaternion.setFromUnitVectors(xAxisV,dir);shaftAngle=Math.acos(Math.max(-1,Math.min(1,Math.abs(dir.x))));shaftAngleDeg=shaftAngle*180/Math.PI;
  const outerLen=.5*shaftLength,innerLen=.55*shaftLength;
  outer.position.x=.05;outer.scale.x=outerLen;inner.position.x=shaftLength-.05-innerLen;inner.scale.x=innerLen;
  yokeB1.position.x=0;yokeB2.position.x=shaftLength;
  yokeC.position.set(cogUJ.x-ujA[0],cogUJ.y-ujA[1],(cogUJ.z||0)-ujA[2]);
 }
 {const c=cogCouplingWorld(cogPose(0));layShaft({x:(c.x-c.ax.x*COG_UJ_SETBACK-ENGINE_FIT.x)/ENGINE_FIT.scale,y:(c.y-c.ax.y*COG_UJ_SETBACK)/ENGINE_FIT.scale,z:(c.z-c.ax.z*COG_UJ_SETBACK)/ENGINE_FIT.scale});}
 /* the shaft turns with the wheel, never with the crank */
 let steer=0;function setSteer(a){steer=a||0;}
 function animate(angle,connected=()=>true){
  if(connected('front-drive-shaft')){yokeA.rotation.x=steer;yokeC.rotation.x=steer;spin.rotation.x=steer;}
 }
 animate(0);
 return {animate,layShaft,setSteer,caseJoint:ujA,get steer(){return steer;},get shaftLength(){return shaftLength;},get shaftAngleDeg(){return shaftAngleDeg;},get shaftDir(){return dir;}};
}
