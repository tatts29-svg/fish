import {ENGINE_LAYOUT} from './engine-kinematics.js';
/* THE SYSTEMS THAT MAKE A V8 A V8 — oil, ignition, starting — built so each one is visibly driven by
   something else the viewer can already see turning. Andrew Fisher, 22 Sep 2026: each part does its job and
   moves the next; the smallest detail matters. Rig units throughout (ENGINE_FIT).

   OIL. A wide, shallow race sump under the block, sectioned on the near side like the block above it, with a
   gear-type oil pump standing in it. The pump is not driven by magic: a skew gear on the rear of the right
   camshaft turns the distributor's vertical shaft, and that shaft runs on down a drive tower on the right of
   the block to the pump — the small-block layout, cam to distributor to pump, one shaft doing both jobs.
   So the pump gears turn at camshaft speed, half the crank, and you can follow why.

   IGNITION. The distributor sits on top of that shaft with its cap sectioned so the rotor arm is seen sweeping
   at cam speed, and eight leads leave the cap for eight plugs in the heads. Each plug is its own part.

   STARTING. The bellhousing is sectioned on its near-top quarter so the flywheel's ring gear is seen; a starter
   motor sits low on the near side with its pinion withdrawn. While the drive is starting the pinion throws
   forward into the ring gear and spins it — the ring has 5.83 times the pinion's teeth, so the pinion turns
   that much faster — and the moment the V8 is running on its own, the pinion pulls back and stops. */
export function buildSystems(T,mats,assembly,mesh,batch,h){
 const {engineX,crankY,camDistance}=ENGINE_LAYOUT,{cyl,box,tube}=h,c=Math.SQRT1_2;
 const stations=[-.45,-.15,.15,.45],camY=crankY+camDistance*c,camZ=camDistance*c;
 const alongX=g=>{g.rotateZ(Math.PI/2);return g;};
 const rotors=[];   /* {group, ratio, axis} */
 function gearGeo(r,teeth,depth,axis='y'){const g=[new T.CylinderGeometry(r-.004,r-.004,depth,24)];for(let i=0;i<teeth;i++){const a=i/teeth*Math.PI*2;g.push(new T.BoxGeometry(.007,depth,.009).translate(0,0,r-.002).applyMatrix4(new T.Matrix4().makeRotationY(a)));}
  if(axis==='x')for(const q of g)q.rotateZ(Math.PI/2);return g;}

 // ---------------------------------------------------------------- sump and oil pump
 const panX=engineX+.02,panY=.24,panW=.50;   /* half width: a wide race sump under the whole block */
 const pan=assembly('oil-pan','Sectioned race sump & gasket',[panX,panY,0],[0,-.55,.9]);
 {const floor=new T.BoxGeometry(.98,.012,panW*2).translate(0,-.054,0);
  const far=new T.BoxGeometry(.98,.12,.012).translate(0,0,-panW+.006),front=new T.BoxGeometry(.012,.12,panW*2).translate(-.484,0,0),rear=new T.BoxGeometry(.012,.12,panW*2).translate(.484,0,0);
  const nearLip=new T.BoxGeometry(.98,.03,.012).translate(0,-.045,panW-.006);   /* the near wall is sectioned to a lip, like the block above it */
  const baffles=[-.25,0,.25].map(x=>new T.BoxGeometry(.008,.07,panW*2-.03).translate(x,-.02,0));
  batch(pan,'dark',[floor,far,front,rear,nearLip,...baffles],'Cast sump, sectioned near wall and windage baffles');
  const flange=[new T.BoxGeometry(1.0,.008,.03).translate(0,.062,-panW+.01),new T.BoxGeometry(1.0,.008,.03).translate(0,.062,panW-.01),new T.BoxGeometry(.03,.008,panW*2).translate(-.495,.062,0),new T.BoxGeometry(.03,.008,panW*2).translate(.495,.062,0)];
  batch(pan,'orange',flange,'Sump gasket line');
  const drain=cyl(.014,.014,.02,[.30,-.07,-.25],undefined,8);batch(pan,'chrome',[drain],'Drain plug');}
 const pumpX=engineX+.66,pumpZ=camZ+.07,pumpY=.245;   /* directly under the distributor drive shaft, inside the sump */
 const pump=assembly('oil-pump','Gear-type oil pump & pickup',[pumpX,pumpY,pumpZ],[.35,-.35,.6]);
 {const housing=[new T.BoxGeometry(.13,.075,.08).translate(.03,0,-.02),new T.CylinderGeometry(.02,.02,.05,10).translate(0,.05,0)];
  const pickup=[tube([[.06,-.02,-.02],[.10,-.05,-.05],[.16,-.07,-.06]],.012,10,8),new T.BoxGeometry(.07,.016,.06).translate(.18,-.075,-.06)];
  batch(pump,'dark',[...housing,...pickup],'Pump body, pickup pipe and strainer');
  for(const [k,dx] of [['drive',0],['driven',.058]]){const r=new T.Group();r.position.set(dx,0,0);pump.add(r);batch(r,'steel',gearGeo(.03,9,.05),k==='drive'?'Drive gear':'Driven gear');rotors.push({id:'oil-pump',group:r,ratio:k==='drive'?.5:-.5,axis:'y'});}}

 // ---------------------------------------------------------------- distributor, drive tower and leads
 const distX=engineX+.66,distZ=camZ+.07;   /* crossed gears: cam gear axis x at z camZ, shaft gear axis y at z camZ+.07 */
 const dist=assembly('distributor','Distributor, drive tower & plug leads',[distX,camY,distZ],[.30,.55,.7]);
 {const shaft=new T.Group();dist.add(shaft);
  batch(shaft,'steel',[new T.CylinderGeometry(.009,.009,camY-pumpY-.02,8).translate(0,-(camY-pumpY-.02)/2+.0,0),...gearGeo(.035,14,.022)],'Vertical drive shaft and skew gear');
  rotors.push({id:'distributor',group:shaft,ratio:.5,axis:'y'});
  const camGear=new T.Group();camGear.position.set(0,0,-.07);dist.add(camGear);batch(camGear,'steel',gearGeo(.035,14,.022,'x'),'Camshaft rear skew gear');rotors.push({id:'distributor',group:camGear,ratio:.5,axis:'x'});
  const tower=[new T.CylinderGeometry(.022,.022,camY-pumpY-.16,10).translate(0,-(camY-pumpY-.16)/2-.04,0),new T.BoxGeometry(.05,.03,.05).translate(0,-.06,0),new T.BoxGeometry(.05,.03,.05).translate(0,-.36,0)];
  const body=[new T.CylinderGeometry(.038,.042,.08,16).translate(0,.06,0)];
  batch(dist,'dark',[...tower,...body],'Drive tower and distributor body');
  const cap=new T.CylinderGeometry(.047,.045,.06,16,1,false,Math.PI*.5,Math.PI*1.25).translate(0,.13,0);   /* sectioned: the near-front quarter is open */
  const capTop=new T.CylinderGeometry(.047,.047,.008,16,1,false,Math.PI*.5,Math.PI*1.25).translate(0,.164,0);
  batch(dist,'black',[cap,capTop],'Sectioned distributor cap');
  const arm=new T.Group();arm.position.set(0,.13,0);dist.add(arm);batch(arm,'orange',[new T.BoxGeometry(.06,.006,.012).translate(.02,0,0),new T.CylinderGeometry(.012,.012,.03,10)],'Rotor arm');rotors.push({id:'distributor',group:arm,ratio:.5,axis:'y'});
  const towers=[];for(let i=0;i<8;i++){const a=i/8*Math.PI*2;towers.push(new T.CylinderGeometry(.006,.006,.02,6).translate(Math.cos(a)*.036,.175,Math.sin(a)*.036));}
  batch(dist,'black',towers,'Cap terminals');}

 // ---------------------------------------------------------------- spark plugs and their leads
 const plugs=[],leads=[];
 for(let i=0;i<8;i++){
  const side=i%2?-1:1,x=engineX+stations[Math.floor(i/2)]+.06;   /* plug between the valves of its cylinder, outboard of the cam */
  const py=crankY+.36,pz=side*.50;
  const g=assembly('spark-plug-'+(i+1),'Spark plug '+(i+1),[x,py,pz],[side*.1,.5,side*.75]);
  const tilt=side*Math.PI/4;   /* pointing outward-up along the bank angle */
  const ins=new T.CylinderGeometry(.009,.011,.05,10).translate(0,.04,0),term=new T.CylinderGeometry(.005,.005,.012,6).translate(0,.07,0);
  const hex=new T.CylinderGeometry(.013,.013,.016,6).translate(0,.008,0),thread=new T.CylinderGeometry(.008,.008,.02,8).translate(0,-.01,0);
  for(const q of [ins,term,hex,thread])q.rotateX(tilt);
  batch(g,'white',[ins],'Ceramic insulator');batch(g,'chrome',[term,hex,thread],'Terminal, hex and thread');
  const tip=new T.Vector3(0,.076,0).applyAxisAngle(new T.Vector3(1,0,0),tilt).add(new T.Vector3(x,py,pz));
  const from=new T.Vector3(distX+Math.cos(i/8*Math.PI*2)*.036,camY+.19,distZ+Math.sin(i/8*Math.PI*2)*.036);
  /* the harness stays under the bonnet line: tests/engine.test.mjs rays every lead vertex against it */
  const lead=tube([[from.x,from.y,from.z],[from.x-.04,from.y+.02,from.z],[(from.x+tip.x)/2,camY+.12,side>0?camZ+.14:.05],[tip.x+.02,tip.y+.04,tip.z+side*.02],[tip.x,tip.y,tip.z]],.005,22,6);
  lead.translate(-distX,-camY,-distZ);leads.push(lead);   /* into the distributor's frame: pulling the distributor takes its harness with it */
  plugs.push(g);
 }
 batch(dist,'black',leads,'Eight plug leads');

 // ---------------------------------------------------------------- flywheel ring gear and starter
 const flyX=-.318,ringR=.175;
 const ring=assembly('ring-gear','Flywheel ring gear',[flyX,crankY,0],[.15,.35,.9]);
 {const r=new T.Group();ring.add(r);const teeth=new T.InstancedMesh(new T.BoxGeometry(.018,.012,.008),mats.chrome,132),m=new T.Matrix4(),q=new T.Quaternion(),ax=new T.Vector3(1,0,0);
  for(let i=0;i<132;i++){const a=i/132*Math.PI*2;q.setFromAxisAngle(ax,a);m.compose(new T.Vector3(0,Math.cos(a)*ringR,Math.sin(a)*ringR),q,new T.Vector3(1,1,1));teeth.setMatrixAt(i,m);}
  teeth.name='132 ring gear teeth';teeth.castShadow=teeth.receiveShadow=true;r.add(teeth);
  const rim=new T.TorusGeometry(ringR-.012,.012,6,64);rim.rotateY(Math.PI/2);batch(r,'steel',[rim],'Shrunk-on ring');   /* inner edge on the flywheel's rim */
  rotors.push({id:'ring-gear',group:r,ratio:1,axis:'x'});}
 const pinionR=.03,starterY=crankY+.105,starterZ=.183;   /* pinion axis 0.21 from the crank (ring .175 + pinion .03 + backlash), in the bellhousing's open quarter */
 const throwDistance=.13;   /* the body sits behind the housing; the nose reaches the ring through the open quarter */
 const starter=assembly('starter-motor','Starter motor & throw-in pinion',[flyX+throwDistance,starterY,starterZ],[.25,.4,.7]);
 const pinionGroup=new T.Group();starter.add(pinionGroup);
 {const body=[alongX(new T.CylinderGeometry(.036,.036,.15,16)).translate(.085,0,0),alongX(new T.CylinderGeometry(.022,.022,.07,12)).translate(.06,.05,-.02),new T.BoxGeometry(.03,.06,.03).translate(.04,-.045,.0)];
  batch(starter,'dark',[...body],'Starter body, solenoid and mounting foot');
  batch(pinionGroup,'chrome',[...gearGeo(pinionR,11,.03,'x'),alongX(new T.CylinderGeometry(.012,.012,throwDistance+.02,8)).translate(throwDistance/2+.01,0,0)],'Throw-in pinion and shaft');}
 let starterActive=false,throwOut=0;
 function setStarter(active,dt=1/60){starterActive=!!active;const target=starterActive?1:0;throwOut+=Math.max(-dt*6,Math.min(dt*6,target-throwOut));pinionGroup.position.x=-throwDistance*throwOut;}
 /* the pinion only turns while it is in mesh; withdrawn, it keeps whatever angle it stopped at */
 const pinionRatio=ringR/pinionR;

 function animate(angle,connected=()=>true){
  for(const r of rotors){if(!connected(r.id))continue;const a=angle*r.ratio;if(r.axis==='y')r.group.rotation.y=a;else r.group.rotation.x=a;}
  if(throwOut>.5&&connected('starter-motor'))pinionGroup.rotation.x=angle*pinionRatio;
 }
 animate(0);setStarter(false,1);
 return {animate,setStarter,rotors,plugs,get throwOut(){return throwOut;}};
}
