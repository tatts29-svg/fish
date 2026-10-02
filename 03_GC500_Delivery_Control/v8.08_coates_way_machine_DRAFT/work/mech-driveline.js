import {ENGINE_FIT,ENGINE_LAYOUT} from './engine-kinematics.js';
import {CAR_AXLES} from './car-gc500.js';
import {STEER_ROAD} from './mech-brakes.js';
/* THE DRIVE LINE, OPENED UP (v8.08). Andrew Fisher, 2 Oct 2026: "Add more mecahnical features ... Make this all 4k crystal
   clear. Improve every thing on here. 10/10". Two assemblies that were closed boxes are now working mechanisms, both driven
   by the same crank the pistons follow — nothing here has a motor of its own.

   THE CLUTCH. A twin-plate race clutch between the flywheel and the gearbox, seen through the bellhousing's open quarter. The
   cover, the diaphragm and the pressure plate are bolted to the flywheel and always turn with the crank; the two friction
   discs are splined to the gearbox input shaft. While the V8 is being started the driver holds the clutch in (car-app.js
   setPedals clutch = drive.starting): the release bearing slides forward, the diaphragm's fingers are pushed in, the pressure
   plate lifts, and the discs — with the whole gear train behind them — stand still while the crank spins up. When the engine
   catches, the plates take up over two thirds of a radian of the crank (a little slip, as a real one has) and the box turns with the crank.
   The gearbox input is read off the clutch disc from here on (car-powertrain.js), not off the crank.

   THE DIFFERENTIAL. The case is sectioned on its near-top quarter, like the gearbox, so the final drive can be watched:
     a 10-tooth pinion on the end of the prop shaft drives a 39-tooth crown wheel (3.9 : 1, car-powertrain.js FINAL_DRIVE);
     the crown wheel is bolted to the carrier, which carries the cross pin and two 10-tooth spider gears round with it;
     the spiders mesh with two 16-tooth side gears, each splined to a half shaft.
   Straight ahead the spiders do not turn on their pin and both half shafts turn with the carrier. Turn the Coates Way wheel and
   the side gears part company: on the road the outside wheel of a turn travels further, by half the track over the turning
   radius (the track and wheelbase are the car's own, CAR_AXLES; the front wheels' angle is the steering's, STEER_ROAD), so the
   outside side gear runs that much faster, the inside one that much slower, and the spiders turn on their pin by the
   difference times 16/10. On the dyno both rear tyres sit on rollers turning together, so what the spiders show is what the
   same steering would ask of them on the road — the real geometry, labelled as an illustration in the register. All bevel
   gears share their apex at the carrier's centre, as bevel gears must, so every pair meshes on its pitch cone.
   Rig units (ENGINE_FIT). */
export const FINAL_DRIVE_TEETH=Object.freeze({pinion:10,crown:39,spider:10,side:16});
export const DIFF_CENTRE=Object.freeze({x:(CAR_AXLES.rear-ENGINE_FIT.x)/ENGINE_FIT.scale,y:.404,z:0});
const WHEELBASE=CAR_AXLES.rear-CAR_AXLES.front,HALF_TRACK=CAR_AXLES.z;
/* the outside-minus-inside share of the carrier's turn for a steering position t (−1 full left … 1 full right): a right turn makes the left (+z) side gear the faster */
export function diffSplit(t){return HALF_TRACK*Math.tan(Math.max(-1,Math.min(1,t||0))*STEER_ROAD)/WHEELBASE;}

export function buildDriveline(T,mats,assembly,mesh,batch,h){
 const {cyl,box}=h;
 const UP=new T.Vector3(0,1,0),M=new T.Matrix4(),Q=new T.Quaternion(),V=new T.Vector3(),ONE=new T.Vector3(1,1,1);
 /* a bevel gear about +y, its pitch circle (radius R) at y = 0 and its apex up the axis at y = R / tan γ; the teeth run along the cone toward the apex */
 function bevel(N,R,gamma,face=.035,add=.0055){
  const sg=Math.sin(gamma),cg=Math.cos(gamma),rIn=R-face*sg,geos=[];
  const blank=new T.CylinderGeometry(Math.max(.004,rIn-add*.6),Math.max(.006,R-add*.6),face*cg+.002,Math.max(16,N*2),1);blank.translate(0,face*cg/2,0);geos.push(blank);
  const back=new T.CylinderGeometry(R-add*.6,R*.92,.008,Math.max(16,N*2),1);back.translate(0,-.004,0);geos.push(back);
  const w=Math.PI*(R+rIn)/N*.52;
  for(let k=0;k<N;k++){const th=k/N*Math.PI*2,rh=V.set(Math.cos(th),0,Math.sin(th)).clone();
   const n=rh.clone().multiplyScalar(cg).add(new T.Vector3(0,sg,0)).normalize(),g=rh.clone().multiplyScalar(-sg).add(new T.Vector3(0,cg,0)).normalize(),t=new T.Vector3().crossVectors(n,g);
   const mid=rh.clone().multiplyScalar(R-face/2*sg).add(new T.Vector3(0,face/2*cg,0)).addScaledVector(n,add*.35);
   M.makeBasis(t,n,g).setPosition(mid);geos.push(new T.BoxGeometry(w,add,face).applyMatrix4(M));}
  return geos;
 }
 const orient=(geos,rx=0,ry=0,rz=0,p=[0,0,0])=>{M.makeRotationFromEuler(new T.Euler(rx,ry,rz));M.setPosition(p[0],p[1],p[2]);for(const g of geos)g.applyMatrix4(M);return geos;};

 // ---------------------------------------------------------------- the clutch
 const flyX=ENGINE_LAYOUT.engineX+.72+.016,{crankY}=ENGINE_LAYOUT;   /* the flywheel's rear face, rig units */
 const clutch=assembly('clutch','Twin-plate clutch & release bearing',[flyX,crankY,0],[.12,.38,.85]);
 const alongX=g=>{g.rotateZ(Math.PI/2);return g;};
 const cover=new T.Group();clutch.add(cover);       /* turns with the crank */
 {/* the cover is a pressed ring with three straps across to the flywheel and three windows between them, so the plates and the diaphragm show */
  const shell=[new T.TorusGeometry(.116,.006,6,40).rotateY(Math.PI/2).translate(.050,0,0),...[0,1,2].map(k=>alongX(new T.CylinderGeometry(.122,.122,.044,10,1,true,k*Math.PI*2/3,Math.PI/4)).translate(.028,0,0))];
  const lugs=[];for(let k=0;k<6;k++){const a=k/6*Math.PI*2;lugs.push(alongX(new T.CylinderGeometry(.008,.008,.012,6)).translate(.056,Math.cos(a)*.11,Math.sin(a)*.11));}
  batch(cover,'steel',shell,'Clutch cover');batch(cover,'chrome',lugs,'Cover bolts');}
 const plate=new T.Group();cover.add(plate);         /* the pressure plate: turns with the cover, lifts toward the gearbox when the clutch is in */
 batch(plate,'chrome',[alongX(new T.CylinderGeometry(.108,.108,.008,40)).translate(.030,0,0)],'Pressure plate');
 const fingers=new T.Group();fingers.position.x=.054;cover.add(fingers);   /* the diaphragm's fingers, pressed in by the release bearing */
 {const f=[];for(let k=0;k<18;k++){const a=k/18*Math.PI*2;f.push(new T.BoxGeometry(.003,.075,.010).translate(0,.065,0).applyMatrix4(new T.Matrix4().makeRotationX(a)));}batch(fingers,'orange',f,'Diaphragm spring fingers');}
 const discs=new T.Group();clutch.add(discs);       /* the friction discs and the intermediate plate: splined to the gearbox input */
 batch(discs,'dark',[alongX(new T.CylinderGeometry(.100,.100,.005,40)).translate(.008,0,0),alongX(new T.CylinderGeometry(.100,.100,.005,40)).translate(.020,0,0)],'Two friction discs');
 batch(discs,'steel',[alongX(new T.CylinderGeometry(.103,.103,.004,40)).translate(.014,0,0),alongX(new T.CylinderGeometry(.026,.026,.034,16)).translate(.016,0,0)],'Intermediate plate and splined hub');
 const bearing=new T.Group();clutch.add(bearing);   /* slides on the input shaft's sleeve; does not turn with the shaft (it is the bearing's outer race) */
 batch(bearing,'chrome',[alongX(new T.CylinderGeometry(.034,.034,.016,24)).translate(.072,0,0)],'Release bearing');
 batch(clutch,'dark',[alongX(new T.CylinderGeometry(.020,.020,.03,12)).translate(.095,0,0),box(.012,.09,.012,[.088,-.06,.0])],'Release sleeve and fork');
 let engaged=1,starting=false,clutchAngle=0,prevCrank=null;
 function setClutch(isStarting){starting=!!isStarting;}

 // ---------------------------------------------------------------- the differential
 const {pinion:Np,crown:Nc,spider:Ns,side:Ng}=FINAL_DRIVE_TEETH;
 const Rc=.12,gc=Math.atan(Nc/Np),apexC=Rc/Math.tan(gc);            /* crown: pitch radius .12, its plane .031 behind the centre */
 const Rp=Rc*Np/Nc,gp=Math.PI/2-gc,apexP=Rp/Math.tan(gp);            /* pinion: .031, its pitch circle .12 ahead of the centre */
 const Rg=.045,gg=Math.atan(Ng/Ns),apexG=Rg/Math.tan(gg);            /* side gears */
 const Rs=Rg*Ns/Ng,gs=Math.PI/2-gg,apexS=Rs/Math.tan(gs);            /* spiders */
 const C=[DIFF_CENTRE.x,DIFF_CENTRE.y,DIFF_CENTRE.z];
 /* the pinion: apex toward +x (the carrier's centre), its shaft back to the prop shaft's flange */
 const pinionA=assembly('diff-pinion','Final-drive pinion (10 teeth)',C,[-.45,.30,.25]);
 const pinionSpin=new T.Group();pinionA.add(pinionSpin);
 batch(pinionSpin,'chrome',orient(bevel(Np,Rp,gp,.034,.006),0,0,-Math.PI/2,[-apexP,0,0]),'Pinion teeth');
 batch(pinionSpin,'steel',[alongX(new T.CylinderGeometry(.014,.014,.16,14)).translate(-apexP-.08,0,0),alongX(new T.CylinderGeometry(.03,.03,.012,20)).translate(-apexP-.165,0,0)],'Pinion shaft and flange');
 /* the crown wheel and the carrier it is bolted to: one body, turning about the axle (z) */
 const crownA=assembly('diff-crown-wheel','Crown wheel (39 teeth) & differential carrier',C,[.10,.62,-.15]);
 const carrier=new T.Group();crownA.add(carrier);
 batch(carrier,'chrome',orient(bevel(Nc,Rc,gc,.034,.0065),Math.PI/2,0,0,[0,0,-apexC]),'Crown wheel teeth');
 {const flange=new T.CylinderGeometry(.088,.088,.016,32).rotateX(Math.PI/2).translate(0,0,-apexC-.017);
  const bosses=[-1,1].map(s=>new T.CylinderGeometry(.034,.040,.05,20).rotateX(Math.PI/2).translate(0,0,s*.075));
  const straps=[0,1].map(k=>new T.BoxGeometry(.018,.022,.13).translate(0,0,.0).applyMatrix4(new T.Matrix4().makeRotationZ(Math.PI/2+k*Math.PI).multiply(new T.Matrix4().makeTranslation(0,.074,.01))));
  batch(carrier,'steel',[flange,...bosses,...straps],'Carrier body and bearing bosses');
  const pin=new T.CylinderGeometry(.008,.008,.165,12);   /* the cross pin, along the carrier's y */
  const bolts=[];for(let k=0;k<10;k++){const a=k/10*Math.PI*2;bolts.push(new T.CylinderGeometry(.006,.006,.012,6).rotateX(Math.PI/2).translate(Math.cos(a)*.072,Math.sin(a)*.072,-apexC-.03));}
  batch(carrier,'dark',[pin,...bolts],'Cross pin and crown-wheel bolts');}
 /* the spiders ride the carrier on its cross pin; each turns about the pin, its apex at the centre */
 const spiderA=assembly('diff-spider-gears','Differential spider gears & cross pin',C,[.10,.95,.20]);
 const spiderCarrier=new T.Group();spiderA.add(spiderCarrier);
 const spiders=[1,-1].map(s=>{const g=new T.Group();g.position.y=s*apexS;if(s>0)g.rotation.z=Math.PI;spiderCarrier.add(g);
  const spin=new T.Group();g.add(spin);batch(spin,'orange',bevel(Ns,Rs,gs,.022,.0045),'Spider gear');return {s,spin};});
 /* the side gears, each splined to its half shaft */
 const sides=[1,-1].map(s=>{const id=s>0?'diff-side-gear-left':'diff-side-gear-right';
  const a=assembly(id,(s>0?'Left':'Right')+' differential side gear (16 teeth)',C,[.05,.55,s*.75]);
  const spin=new T.Group();a.add(spin);
  batch(spin,'chrome',orient(bevel(Ng,Rg,gg,.024,.0048),s>0?-Math.PI/2:Math.PI/2,0,0,[0,0,s*apexG]),'Side gear teeth');
  batch(spin,'steel',[new T.CylinderGeometry(.018,.018,.06,14).rotateX(Math.PI/2).translate(0,0,s*(apexG+.04))],'Splined hub to the half shaft');
  return {id,s,spin};});

 let crown=0,delta=0,steerT=0,prevMain=null,split=0;
 function setSteer(t){steerT=Math.max(-1,Math.min(1,t||0));}
 /* mainAngle: the gearbox main shaft (the prop shaft turns with it); returns the two half shafts' angles */
 function animate(mainAngle,connected=()=>true){
  const d=prevMain===null?0:mainAngle-prevMain;prevMain=mainAngle;
  const dc=d*Np/Nc;crown+=dc;split=diffSplit(steerT);delta+=dc*split;
  if(connected('diff-pinion'))pinionSpin.rotation.x=mainAngle;
  if(connected('diff-crown-wheel'))carrier.rotation.z=crown;
  if(connected('diff-spider-gears')){spiderCarrier.rotation.z=crown;for(const sp of spiders)sp.spin.rotation.y=delta*Rg/Rs;   /* both spiders turn the same way about their own outward axis */}
  for(const sd of sides)if(connected(sd.id))sd.spin.rotation.z=crown+sd.s*delta;
  return {left:crown+delta,right:crown-delta,crown};
 }
 /* the crank's step through the clutch: returns the angle the gearbox input has turned to */
 function clutchStep(crankAngle,dt,connected=()=>true){
  const d=prevCrank===null?0:crankAngle-prevCrank;prevCrank=crankAngle;
  /* the pedal is down before the starter turns, so the plates open at once; they take up again over two thirds of a radian of the
     crank's turn once the engine runs (a little slip, as a real one has) — measured in the crank's own travel, so it is the same
     however the frames fall */
  engaged=starting?0:Math.min(1,engaged+Math.abs(d)*1.5);
  clutchAngle+=d*engaged;
  if(connected('clutch')){cover.rotation.x=crankAngle;discs.rotation.x=clutchAngle;const open=1-engaged;plate.position.x=.003*open;bearing.position.x=-.010*open;fingers.scale.x=1;fingers.rotation.x=0;fingers.position.x=.054-.006*open;}
  return clutchAngle;
 }
 animate(0);
 return {animate,clutchStep,setClutch,setSteer,spiders,sides,
  get crown(){return crown;},get delta(){return delta;},get split(){return split;},get clutch(){return {engaged,angle:clutchAngle,starting};},
  teeth:FINAL_DRIVE_TEETH,geometry:{Rc,Rp,Rg,Rs,apexC,apexP,apexG,apexS}};
}
