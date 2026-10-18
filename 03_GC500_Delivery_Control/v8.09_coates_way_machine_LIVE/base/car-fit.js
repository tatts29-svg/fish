import {CAR_AXLES} from './car-gc500.js';
import {ENGINE_LAYOUT,ENGINE_FIT,COG_CAR} from './engine-kinematics.js';
import {buildCockpit} from './car-cockpit.js';

// Package the illustrative mechanical rig inside the original, five-metre car.
export {ENGINE_FIT};
/* THE COG'S HOME (v5.79, 23 Sep 2026). It is the steering wheel — on the column, in the driver's hands
   (engine-kinematics.js, COG_CAR.fitted), and nowhere else. The history of where it stood before is in the
   changelog: on a stand in its own studio, then dead-centre ahead of the nose on a chain drive to the crank
   (22 Sep), then lifted off the quick-release and grown for a wheel view (23 Sep, morning). What the car cannot
   honestly carry is the machine's electric motor, its mounting base and the reduction gearbox — the V8 is the
   motor here — so car-app.js keeps those out of sight unless one is selected. */
/* COG_FIT is the cog's one pose — on the column, as the wheel (engine-kinematics.js, COG_CAR.fitted). The deployed
   pose it used to carry is gone with the wheel view (23 Sep 2026: nothing comes off the car to be looked at). */
export const COG_FIT=Object.freeze({x:COG_CAR.fitted.x,y:COG_CAR.fitted.y,z:COG_CAR.fitted.z,scale:COG_CAR.fitted.scale,fitted:COG_CAR.fitted});
export function fitCarMechanics(T,body,engine){
 const {scale:s,x:dx}=ENGINE_FIT;
 engine.root.scale.setScalar(s);engine.root.position.x=dx;
 const byId=id=>engine.removable.find(p=>p.id===id);
 // Keep the actual GC500 cockpit and cage rather than overlaying another cabin.
 const cabin=byId('cockpit');cabin.group.clear();
 engine.root.updateMatrixWorld(true);body.root.updateMatrixWorld(true);
 /* v5.79 — the original cabin's own steering wheel is a small ring (Ø 0.19 m) in its 'aero-carbon' mesh at
    (−0.18, 0.79, −0.31). The original surfaces are never altered (tests/gc500-source.test.mjs), so it stays —
    and the Coates Way cog sits exactly on it, upright, its plates thicker than the ring and wider than it, so
    the ring is inside the hub and out of sight. engine-kinematics.js COG_CAR.fitted is that point. */
 for(const mesh of [...body.cockpit.children])cabin.group.attach(mesh);
 body.root.remove(body.cockpit);
 cabin.name=cabin.group.name='Original GC500 cockpit and safety cage';
 /* v5.79 — THE FIREWALL AND THE DASH DISPLAY, added to the original cabin (rig units, like the seats it keeps):
    a carbon bulkhead between the driver and the engine bay with the tunnel the bellhousing sits in, and a
    drawn screen (gear, revs, the marque) behind the Coates Way wheel. From the driver's seat the wheel now
    stands against a panel, not the back of the engine; from outside, the cutaway still shows the whole V8 from
    the front, the sides and above. The screen is drawn only where there is a canvas (the node tests have none). */
 {const carbon=new T.MeshStandardMaterial({color:0x1a1c1f,roughness:.42,metalness:.25});
  const add=(w,h,d,x,y,z,mat)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;m.name='Firewall';cabin.group.add(m);return m;};
  add(.02,.40,1.40,-.20,.86,0,carbon);add(.02,.38,.44,-.20,.51,.48,carbon);add(.02,.38,.44,-.20,.51,-.48,carbon);   /* top at rig 1.06 = world 0.78, under the bonnet's rear edge (0.79) */
  if(typeof document!=='undefined'){
   const c=document.createElement('canvas');c.width=512;c.height=200;const g=c.getContext('2d');
   g.fillStyle='#07090b';g.fillRect(0,0,512,200);
   for(let i=0;i<12;i++){g.fillStyle=i<7?'#2ec46a':i<10?'#ffb020':'#e5342a';g.fillRect(30+i*38,24,30,10);}
   g.fillStyle='#f3f4f2';g.font='700 118px system-ui, Segoe UI, Arial, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('N',256,112);
   g.font='700 26px system-ui, Segoe UI, Arial, sans-serif';g.textAlign='left';g.fillStyle='#9aa3a8';g.fillText('0 rpm',34,172);
   g.textAlign='right';g.fillStyle='#ff6a13';g.fillText('COATES · 26',478,172);
   const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
   const bezel=add(.03,.12,.24,-.12,.85,-.415,carbon);bezel.name='Dash display bezel';
   const screen=new T.Mesh(new T.PlaneGeometry(.21,.09),new T.MeshBasicMaterial({map:tex,toneMapped:false}));
   screen.position.set(-.103,.85,-.415);screen.rotation.y=Math.PI/2;screen.name='Dash display';cabin.group.add(screen);
  }}
 /* v5.79b — THE INSIDE OF THE CAR (car-cockpit.js): the dash, the display, the switch panel, the column and its
    hub, the paddles, the door bars, the seat and harness, the tunnel, the pedals, the mirror, the helmet. Built in
    world metres inside the cabin group, around the original pieces, which stay whole. */
 cabin.cockpit=buildCockpit(T,cabin.group,null);
 // The original body supplies the cabin cage; retain only the low chassis rails.
 for(const group of [...engine.root.children])if(group.name==='Tubular chassis and safety cage'){
  for(const mesh of [...group.children]){
   if(!mesh.isMesh)continue;
   const old=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry,position=old.attributes.position,keep=[];
   for(let i=0;i<position.count;i+=3)if(Math.max(position.getY(i),position.getY(i+1),position.getY(i+2))<.60)keep.push(i,i+1,i+2);
   if(!keep.length){group.remove(mesh);continue;}
   const geo=new T.BufferGeometry();for(const [name,a]of Object.entries(old.attributes)){const data=[];for(const i of keep)for(let j=0;j<a.itemSize;j++)data.push(a.array[i*a.itemSize+j]);geo.setAttribute(name,new T.Float32BufferAttribute(data,a.itemSize));}mesh.geometry=geo;
  }
 }
 const shift=(p,offset)=>{p.home[0]+=offset;p.group.position.x=p.home[0];};
 const rearDelta=(CAR_AXLES.rear-dx)/s-1.65;
 shift(byId('rear-differential'),rearDelta);
 shift(byId('front-suspension'),(CAR_AXLES.front-dx)/s+1.6);
 shift(byId('rear-suspension'),rearDelta);
 // Extend the prop shaft from the existing gearbox output to the rear axle.
 const shaft=byId('prop-shaft');shift(shaft,rearDelta/2);shaft.group.scale.x=(1.1+rearDelta)/1.1;
 byId('rear-differential').group.scale.z=(CAR_AXLES.z-.035)/(.86*s);
 engine.root.updateMatrixWorld(true);
 return {engine,cog:COG_FIT};
}
