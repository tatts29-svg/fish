import {ENGINE_LAYOUT} from './engine-kinematics.js';
// A toothed belt follows the convex envelope of three pitch circles.
// 20/40/40 pitch counts establish crank:cam = 2:1.
export function buildTimingDrive(T,mats,assembly,mesh){
 const {timingX,crankY,camDistance}=ENGINE_LAYOUT, c=Math.SQRT1_2;
 const pitch=.016, crankR=20*pitch/(2*Math.PI),camR=40*pitch/(2*Math.PI);
 const stations=[{id:'timing-crank-sprocket',name:'20-tooth crank timing sprocket',y:crankY,z:0,r:crankR,teeth:20,ratio:1},
 ...[-1,1].map(side=>({id:'timing-cam-'+(side>0?'near':'far'),name:(side>0?'Right':'Left')+' 40-tooth cam sprocket',y:crankY+camDistance*c,z:side*camDistance*c,r:camR,teeth:40,ratio:.5}))];
 const rotors=[];
 for(const s of stations){
  const g=assembly(s.id,s.name,[timingX,s.y,s.z],[-.65,.18,Math.sign(s.z)*.25]);
  const rotor=new T.Group();g.add(rotor);
  const disc=new T.CylinderGeometry(s.r-.004,s.r-.004,.018,48);disc.rotateZ(Math.PI/2);
  mesh(rotor,disc,'steel','Machined sprocket web');
  const rim=new T.TorusGeometry(s.r-.012,.005,6,48);rim.rotateY(Math.PI/2);mesh(rotor,rim,'chrome','Polished sprocket rim');
  const hub=new T.CylinderGeometry(.026,.026,.032,16);hub.rotateZ(Math.PI/2);mesh(rotor,hub,'orange','Keyed timing hub');
  const toothGeo=new T.BoxGeometry(.025,.007,.006);
  const teeth=new T.InstancedMesh(toothGeo,mats.chrome,s.teeth),matrix=new T.Matrix4(),q=new T.Quaternion();
  for(let i=0;i<s.teeth;i++){const a=i/s.teeth*Math.PI*2;q.setFromAxisAngle(new T.Vector3(1,0,0),a);matrix.compose(new T.Vector3(0,Math.cos(a)*(s.r-.001),Math.sin(a)*(s.r-.001)),q,new T.Vector3(1,1,1));teeth.setMatrixAt(i,matrix);}
  teeth.name=s.teeth+' timing teeth';rotor.add(teeth);rotors.push({...s,rotor});
 }
 // Samples retain genuine circular wraps and straight external tangent spans.
 const points=stations.flatMap(s=>Array.from({length:160},(_,i)=>{const a=i/160*Math.PI*2;return {x:s.z+s.r*Math.cos(a),y:s.y+s.r*Math.sin(a)};})).sort((a,b)=>a.x-b.x||a.y-b.y);
 const cross=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);
 const lower=[],upper=[];for(const p of points){while(lower.length>=2&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}
 for(const p of points.slice().reverse()){while(upper.length>=2&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
 const hull=lower.slice(0,-1).concat(upper.slice(0,-1)),segments=[],lengths=[0];let length=0;
 for(let i=0;i<hull.length;i++){const a=hull[i],b=hull[(i+1)%hull.length],d=Math.hypot(b.x-a.x,b.y-a.y);segments.push({a,b,d});length+=d;lengths.push(length);}
 function sample(t){let s=((t%length)+length)%length,i=0;while(i<segments.length-1&&s>lengths[i+1])i++;const {a,b,d}=segments[i],u=(s-lengths[i])/d;return {y:a.y+(b.y-a.y)*u,z:a.x+(b.x-a.x)*u,dy:(b.y-a.y)/d,dz:(b.x-a.x)/d};}
 const g=assembly('timing-belt','Continuous toothed timing belt',[timingX,0,0],[-.80,.1,0]);
 const N=360,position=[],uv=[],indices=[];
 for(let i=0;i<=N;i++){const p=sample(i/N*length);for(const x of [-.019,.019]){position.push(x,p.y,p.z);uv.push(i/N,x<0?0:1);}if(i<N){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(position,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 const beltMat=mats.rubber.clone();beltMat.side=T.DoubleSide;const belt=new T.Mesh(geo,beltMat);belt.name='Unbroken timing belt backing';g.add(belt);
 const toothCount=Math.round(length/pitch),teeth=new T.InstancedMesh(new T.BoxGeometry(.037,.005,.006),mats.rubber,toothCount);teeth.name='Travelling timing belt teeth';g.add(teeth);
 const matrix=new T.Matrix4(),q=new T.Quaternion(),unit=new T.Vector3(1,1,1),xAxis=new T.Vector3(1,0,0);
 /* v8.08 — THE TENSIONER. A spring-loaded arm holds a smooth idler on the back of the belt's slack span, between the crank sprocket
    and the right cam sprocket, three tenths of the way up from the crank (clear of the water pump's body in the plane ahead).
    It sits on the span's outer tangent — worked out from the same two pitch circles the hull is built from — so it touches the
    belt without bending its path. Riding the belt's back, it turns the opposite way to the sprockets, at belt speed over its
    own radius. */
 const tens=(()=>{const A=stations[0],B=stations[1].z>0?stations[1]:stations[2],dz=B.z-A.z,dy=B.y-A.y,D=Math.hypot(dz,dy),ux=dz/D,uy=dy/D,k=(A.r-B.r)/D,q=Math.sqrt(1-k*k);
  const nz=ux*k+uy*q,ny=uy*k-ux*q;   /* the outer normal: away from the far cam */
  const p1={z:A.z+A.r*nz,y:A.y+A.r*ny},p2={z:B.z+B.r*nz,y:B.y+B.r*ny},f=.3,r=.028,gap=.004;
  const c={z:p1.z+(p2.z-p1.z)*f+nz*(r+gap),y:p1.y+(p2.y-p1.y)*f+ny*(r+gap)};
  return {c,r,n:{z:nz,y:ny},u:{z:ux,y:uy},touch:{z:p1.z+(p2.z-p1.z)*f,y:p1.y+(p2.y-p1.y)*f}};})();
 const tg=assembly('timing-tensioner','Timing belt tensioner & idler',[timingX,tens.c.y,tens.c.z],[-.70,-.10,.45]);
 const idler=new T.Group();tg.add(idler);
 {const w=new T.CylinderGeometry(tens.r,tens.r,.034,32);w.rotateZ(Math.PI/2);mesh(idler,w,'chrome','Smooth idler face');
  const lip=new T.TorusGeometry(tens.r-.002,.003,6,32);lip.rotateY(Math.PI/2);for(const x of [-.017,.017]){const l=lip.clone();l.translate(x,0,0);mesh(idler,l,'steel','Idler flange');}
  const hub=new T.CylinderGeometry(.009,.009,.04,12);hub.rotateZ(Math.PI/2);mesh(idler,hub,'orange','Idler bearing');
  const spokes=[];for(let i=0;i<5;i++){const a=i/5*Math.PI*2;const b=new T.BoxGeometry(.006,.016,.004);b.translate(-.018,Math.cos(a)*.016,Math.sin(a)*.016);b.rotateX(0);spokes.push(b);}
  for(const b of spokes)mesh(idler,b,'dark','Idler web');
  /* the arm: from the idler's axle along the span to its pivot bolt, and the spring housing from the pivot to a lug on the block */
  const along=.075,pz=tens.u.z*along+tens.n.z*.02,py=tens.u.y*along+tens.n.y*.02,L=Math.hypot(pz,py);
  const arm=new T.BoxGeometry(.012,.022,L);arm.rotateX(-Math.atan2(py,pz));arm.translate(.024,py/2,pz/2);mesh(tg,arm,'dark','Tensioner arm');
  const piv=new T.CylinderGeometry(.013,.013,.03,12);piv.rotateZ(Math.PI/2);piv.translate(.024,py,pz);mesh(tg,piv,'steel','Pivot bolt');
  const sz=pz+tens.n.z*.05,sy=py+tens.n.y*.05,sp=new T.CylinderGeometry(.009,.009,.06,10);sp.rotateX(Math.PI/2-Math.atan2(tens.n.y,tens.n.z));sp.translate(.024,(py+sy)/2,(pz+sz)/2);mesh(tg,sp,'orange','Tensioner spring housing');}
 const tensionerRatio=-crankR/tens.r;
 function animate(angle,connected=()=>true){
  for(const s of rotors)if(connected(s.id))s.rotor.rotation.x=angle*s.ratio;
  if(connected('timing-tensioner'))idler.rotation.x=angle*tensionerRatio;
  if(!connected('timing-belt'))return;
  for(let i=0;i<toothCount;i++){
   // The hull runs clockwise in Y/Z, matching positive rotation about X.
   const p=sample(i/toothCount*length-angle*crankR);
   const a=Math.atan2(p.dy,-p.dz);q.setFromAxisAngle(xAxis,a);
   matrix.compose(new T.Vector3(0,p.y-.003*Math.cos(a),p.z-.003*Math.sin(a)),q,unit);teeth.setMatrixAt(i,matrix);
  }teeth.instanceMatrix.needsUpdate=true;
 }
 animate(0);return {animate,rotors,length,crankR,camR,tensioner:{group:tg,idler,ratio:tensionerRatio,touch:tens.touch,centre:tens.c,r:tens.r}};
}
