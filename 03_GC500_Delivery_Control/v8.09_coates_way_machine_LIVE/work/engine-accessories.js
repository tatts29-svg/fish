import {ENGINE_LAYOUT,FRONT_DRIVE} from './engine-kinematics.js';
/* CAUSE AND EFFECT YOU CAN SEE. Andrew Fisher, 22 Sep 2026: each part does its job and moves the next — the
   smallest detail matters. Two additions to the front of the V8, both driven by things the viewer already
   controls or can already see turning.

   THE THROTTLE LINKAGE. The throttle slider is the one control everybody touches, and until now it only changed
   a number. It now pulls the inner cable, the cable swings the lever on the right bank's throttle shaft, a link
   rod across the engine swings the left bank's lever with it, and each shaft turns four butterflies in the
   throats of its velocity stacks: shut at idle, eighty degrees open at full throttle, with a return spring on
   the left lever to close them again. The engine note follows, because the same slider drives both. Equal
   levers on parallel shafts make the link rod a parallelogram member, so it translates without tilting — which
   is why the code can place it as a rigid body instead of solving a linkage. Cable and spring are straight
   members between two points, laid out every frame.

   THE ACCESSORY DRIVE. A ribbed serpentine belt on the crank nose, in the plane ahead of the timing belt (where
   the cog's distribution case stood until 23 Sep 2026 — the cog is the steering wheel now and the case is off
   the engine), turns the water pump on the right of the block, the alternator on the left and an idler
   below. Belt speed is common to every pulley, so each turns at crank speed times the ratio of the radii — the
   pump a third faster, the idler twice as fast — and that is what the animation does.
   Rig units throughout (ENGINE_FIT). */
export function buildAccessories(T,mats,assembly,mesh,batch,h){
 const {engineX,crankY}=ENGINE_LAYOUT,{cyl,box,tube,transformed}=h;
 const xAxis=new T.Vector3(1,0,0),zAxis=new T.Vector3(0,0,1),unit=new T.Vector3(1,1,1),matrix=new T.Matrix4(),q=new T.Quaternion();
 const stations=[-.45,-.15,.15,.45];
 const alongX=g=>{g.rotateZ(Math.PI/2);return g;};

 // ---------------------------------------------------------------- throttle linkage
 const throttleY=.470,armR=.045,leverX=-.61,openAngle=80*Math.PI/180;
 const bankShafts=[];
 for(const side of [-1,1]){
  const id='throttle-shaft-'+(side>0?'near':'far');
  const g=assembly(id,(side>0?'Right':'Left')+' throttle shaft & four butterflies',[engineX,throttleY,side*.103],[0,.55,side*.9]);
  const rotor=new T.Group();g.add(rotor);
  const shaft=alongX(new T.CylinderGeometry(.0045,.0045,1.08,8));
  /* a butterfly at rest lies across its throat: a thin disc with a vertical axis, centred on the shaft */
  const discs=stations.map(x=>new T.CylinderGeometry(.0275,.0275,.002,20).translate(x,0,0));
  const lever=[new T.BoxGeometry(.012,armR+.012,.008).translate(leverX,armR/2,0),alongX(new T.CylinderGeometry(.009,.009,.014,10)).translate(leverX,0,0),new T.SphereGeometry(.007,10,8).translate(leverX,armR,0)];
  batch(rotor,'steel',[shaft,...lever],'Throttle shaft and lever');
  batch(rotor,'chrome',discs,'Butterfly plates');
  bankShafts.push({id,rotor,side});
 }
 /* the link rod joins the two lever tips across the engine; the cable pulls the right lever outboard and the
    spring on the left lever pulls both shut again. Cable and spring are straight members between two points and
    are laid out that way every frame rather than pretending to be flexible. */
 const linkage=assembly('throttle-linkage','Throttle link rod, cable & return spring',[engineX+leverX,throttleY,0],[-.35,.35,0]);
 const linkRod=new T.Group();linkage.add(linkRod);
 batch(linkRod,'chrome',[new T.CylinderGeometry(.004,.004,.206,8).rotateX(Math.PI/2),new T.SphereGeometry(.007,8,6).translate(0,0,-.103),new T.SphereGeometry(.007,8,6).translate(0,0,.103)],'Link rod and ball ends');
 const cableStop=[0,armR+.01,.103+.16],springPost=[0,armR+.01,-.103-.13];
 batch(linkage,'dark',[box(.024,.06,.02,[cableStop[0],cableStop[1]-.03,cableStop[2]]),box(.02,.05,.016,[springPost[0],springPost[1]-.03,springPost[2]])],'Cable stop and spring post');
 const unitY=new T.Vector3(0,1,0),dirTmp=new T.Vector3();
 function member(geometry,key,name){const m=new T.Mesh(geometry,mats[key]);m.name=name;m.castShadow=m.receiveShadow=true;linkage.add(m);return m;}
 const cable=member(new T.CylinderGeometry(.0035,.0035,1,6).translate(0,.5,0),'black','Inner throttle cable'),spring=member(new T.CylinderGeometry(.009,.009,1,8).translate(0,.5,0),'orange','Return spring');
 function span(m,from,to){m.position.set(from[0],from[1],from[2]);dirTmp.set(to[0]-from[0],to[1]-from[1],to[2]-from[2]);const len=dirTmp.length();m.quaternion.setFromUnitVectors(unitY,dirTmp.normalize());m.scale.set(1,len,1);}
 function setThrottle(t,connected=()=>true){
  const a=Math.max(0,Math.min(1,t))*openAngle;
  for(const s of bankShafts)if(connected(s.id))s.rotor.rotation.x=a;
  if(!connected('throttle-linkage'))return;
  /* both lever tips sit at (armR cos a, armR sin a) from their shafts, so the rod between them translates */
  const ty=armR*Math.cos(a),tz=armR*Math.sin(a);
  linkRod.position.set(0,ty,tz);
  span(cable,[0,ty,.103+tz],cableStop);
  span(spring,[0,ty,-.103+tz],springPost);
 }

 // ---------------------------------------------------------------- accessory drive
 const beltX=(ENGINE_LAYOUT.timingX+FRONT_DRIVE.x+FRONT_DRIVE.caseDepth/2)/2;   /* between the timing belt and the line the case's front face stood on */
 const pulleys=[
  {id:'accessory-crank-pulley',name:'Ribbed crank pulley & harmonic damper',y:crankY,z:0,r:.075,depth:.05,key:'steel'},
  {id:'water-pump',name:'Water pump & pulley',y:.62,z:.30,r:.055,depth:.03,key:'dark'},
  {id:'alternator',name:'Alternator & pulley',y:.56,z:-.34,r:.045,depth:.03,key:'dark'},
  {id:'accessory-idler',name:'Belt idler & spring tensioner',y:.31,z:.27,r:.035,depth:.03,key:'dark'},
 ];
 /* A belt only drives what it touches. The first layout had the crank pulley 16 mm inside the envelope of the
    other three — a belt drawn over it, turning nothing — so every station is now checked against the hull
    the belt actually follows, and the build refuses a layout where any pulley is off it. */
 const rotors=[];
 for(const p of pulleys){
  const g=assembly(p.id,p.name,[beltX,p.y,p.z],[-.6,p.y>.5?.35:-.2,p.z*1.2]);
  const rotor=new T.Group();g.add(rotor);
  const wheel=alongX(new T.CylinderGeometry(p.r,p.r,.036,40));
  const ribs=[];for(let i=0;i<5;i++)ribs.push(new T.TorusGeometry(p.r+.001,.0022,4,40).rotateY(Math.PI/2).translate(-.014+i*.007,0,0));
  batch(rotor,'chrome',[wheel],'Pulley');batch(rotor,'dark',ribs,'Belt ribs');
  const hub=alongX(new T.CylinderGeometry(p.r*.35,p.r*.35,.05,12));batch(rotor,'orange',[hub],'Keyed hub');
  if(p.id==='accessory-crank-pulley'){const damper=alongX(new T.CylinderGeometry(.095,.095,.028,40)).translate(.035,0,0);batch(rotor,'steel',[damper],'Harmonic damper ring');
   /* the crank nose itself, from the timing sprocket forward to this pulley — the chain drive's sprocket used to carry it */
   const noseLen=beltX-ENGINE_LAYOUT.timingX+.02,nose=alongX(new T.CylinderGeometry(.030,.030,noseLen,14)).translate(-noseLen/2+.01,0,0);batch(rotor,'orange',[nose],'Crank nose');}
  if(p.id==='water-pump'){const body=[alongX(new T.CylinderGeometry(.07,.085,.09,20)).translate(.075,0,0),cyl(.02,.02,.16,[.10,-.07,.06],[0,0,Math.PI/2],10),cyl(.02,.02,.10,[.10,.06,-.05],[Math.PI/2,0,0],10)];batch(g,'dark',body,'Pump housing and coolant unions');}
  if(p.id==='alternator'){/* the case sits ahead of its pulley, toward the nose: behind it is the block face */
   const body=[alongX(new T.CylinderGeometry(.07,.07,.13,24)).translate(-.09,0,0),alongX(new T.CylinderGeometry(.045,.045,.02,12)).translate(-.165,0,0)];const fins=[];for(let i=0;i<12;i++){const a=i/12*Math.PI*2;fins.push(new T.BoxGeometry(.11,.014,.006).translate(-.09,.072,0).applyMatrix4(new T.Matrix4().makeRotationX(a)));}
   const bracket=box(.02,.16,.03,[-.03,-.10,.02]);batch(g,'dark',[...body,bracket],'Alternator case and bracket');batch(g,'chrome',fins,'Case cooling fins');
   const fan=[];for(let i=0;i<8;i++){const a=i/8*Math.PI*2;fan.push(new T.BoxGeometry(.006,.028,.014).translate(-.024,.05,0).applyMatrix4(new T.Matrix4().makeRotationX(a)));}batch(rotor,'steel',fan,'Cooling fan');}
  if(p.id==='accessory-idler'){const arm=[box(.02,.10,.02,[.02,.05,.0]),cyl(.012,.012,.07,[.02,.10,0],[0,0,0],8)];batch(g,'dark',arm,'Tensioner arm and spring housing');}
  rotors.push({id:p.id,rotor,ratio:pulleys[0].r/p.r});
 }
 /* the belt wraps the convex envelope of the four pulleys — the same hull method as the timing belt */
 const pts=pulleys.flatMap(s=>Array.from({length:120},(_,i)=>{const a=i/120*Math.PI*2;return {x:s.z+s.r*Math.cos(a),y:s.y+s.r*Math.sin(a)};})).sort((a,b)=>a.x-b.x||a.y-b.y);
 const cross=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);
 const lower=[],upper=[];for(const p of pts){while(lower.length>=2&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}
 for(const p of pts.slice().reverse()){while(upper.length>=2&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
 const hull=lower.slice(0,-1).concat(upper.slice(0,-1)),segments=[];let length=0;
 for(let i=0;i<hull.length;i++){const a=hull[i],b=hull[(i+1)%hull.length],d=Math.hypot(b.x-a.x,b.y-a.y);segments.push({a,b,d});length+=d;}
 const segDist=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-(a.x+dx*t),p.y-(a.y+dy*t));};
 const offHull=pulleys.map(s=>{let m=Infinity;for(const seg of segments)m=Math.min(m,segDist({x:s.z,y:s.y},seg.a,seg.b));return {id:s.id,gap:m-s.r};}).filter(s=>s.gap>.001);
 if(offHull.length)throw Error('Accessory belt does not touch: '+offHull.map(s=>s.id+' by '+(s.gap*1000).toFixed(1)+' mm').join(', '));
 const belt=assembly('accessory-belt','Serpentine accessory belt',[beltX,0,0],[-.85,.05,0]);
 {const N=420,position=[],uv=[],indices=[];
  let s=0;const samples=[];for(const seg of segments){const n=Math.max(2,Math.round(seg.d/length*N));for(let i=0;i<n;i++){const u=i/n;samples.push({y:seg.a.y+(seg.b.y-seg.a.y)*u,z:seg.a.x+(seg.b.x-seg.a.x)*u});}}
  samples.push(samples[0]);
  for(let i=0;i<samples.length;i++){const p=samples[i];for(const x of [-.018,.018]){position.push(x,p.y,p.z);uv.push(i/samples.length,x<0?0:1);}if(i<samples.length-1){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(position,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
  const m=mats.rubber.clone();m.side=T.DoubleSide;const ribbon=new T.Mesh(geo,m);ribbon.name='Ribbed belt';ribbon.castShadow=ribbon.receiveShadow=true;belt.add(ribbon);}

 function animate(angle,connected=()=>true){for(const r of rotors)if(connected(r.id))r.rotor.rotation.x=angle*r.ratio;}
 animate(0);setThrottle(0);
 return {animate,setThrottle,rotors,beltLength:length,bankShafts,openAngle,armR};
}
