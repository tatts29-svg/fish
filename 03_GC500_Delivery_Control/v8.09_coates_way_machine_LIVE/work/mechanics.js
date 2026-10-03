import * as T from './vendor/three.module.js';
import {GEAR,toothOutline} from './gear-math.js';
import {PARTS} from './parts.js';
import {addServiceParts} from './service-parts.js';

export function addMechanics(model){
 const {root,parts,pickables}=model;
 const steel=new T.MeshStandardMaterial({color:0xadb8bf,metalness:.95,roughness:.24});
 const bronze=new T.MeshStandardMaterial({color:0xb68746,metalness:.87,roughness:.29});
 const dark=new T.MeshStandardMaterial({color:0x272d32,metalness:.8,roughness:.32});
 const orange=new T.MeshPhysicalMaterial({color:0xf26222,metalness:0,roughness:.3,clearcoat:.6});
 const rubber=new T.MeshStandardMaterial({color:0x111417,roughness:.85,metalness:0});
 const clear=new T.MeshPhysicalMaterial({color:0xb8ced6,metalness:0,roughness:.12,transparent:true,opacity:.08,depthWrite:false,side:T.DoubleSide});
 function mesh(g,geo,mat,x=0,y=0,z=0){const m=new T.Mesh(geo,mat.clone());m.position.set(x,y,z);m.castShadow=mat!==clear;m.receiveShadow=true;g.add(m);return m;}
 function shape(ri,ro){const s=new T.Shape();s.absarc(0,0,ro,0,Math.PI*2,false);if(ri){const h=new T.Path();h.absarc(0,0,ri,0,Math.PI*2,true);s.holes.push(h);}return s;}
 function plate(g,ri,ro,depth,mat,z=0){const geo=new T.ExtrudeGeometry(shape(ri,ro),{depth,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2,curveSegments:56,steps:1});geo.translate(0,0,-depth/2);return mesh(g,geo,mat,0,0,z);}
 function torus(g,r,t,mat,z=0){return mesh(g,new T.TorusGeometry(r,t,8,64),mat,0,0,z);}
 function box(g,w,h,d,mat,x=0,y=0,z=0){return mesh(g,new T.BoxGeometry(w,h,d),mat,x,y,z);}
 function repeated(g,geo,mat,poses){const m=new T.InstancedMesh(geo,mat.clone(),poses.length),dummy=new T.Object3D();for(let i=0;i<poses.length;i++){const p=poses[i];dummy.position.set(...p.slice(0,3));dummy.rotation.set(0,0,p[3]||0);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);}m.instanceMatrix.needsUpdate=true;m.castShadow=m.receiveShadow=true;g.add(m);return m;}
 function bolts(g,n,r,z,size=.055){const geo=new T.CylinderGeometry(size,size,.07,6);geo.rotateX(Math.PI/2);repeated(g,geo,steel,Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2;return[r*Math.cos(a),r*Math.sin(a),z,a];}));}
 function bearing(g,ri,ro,z=0){plate(g,ri,ri+.055,.12,steel,z);plate(g,ro-.06,ro,.12,dark,z);const cage=new T.Group();g.add(cage);cage.position.z=z;const r=(ri+ro)/2;repeated(cage,new T.SphereGeometry((ro-ri)*.23,10,8),steel,Array.from({length:14},(_,i)=>[Math.cos(i/14*Math.PI*2)*r,Math.sin(i/14*Math.PI*2)*r,0]));return cage;}
 function gear(g,n,internal,mat,bore=.18){const pts=toothOutline(n),s=new T.Shape();if(internal){s.absarc(0,0,1.89,0,Math.PI*2,false);const h=new T.Path();toothOutline(n,GEAR.module,true).slice().reverse().forEach(([x,y],i)=>i?h.lineTo(x,y):h.moveTo(x,y));h.closePath();s.holes.push(h);}else{pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const h=new T.Path();h.absarc(0,0,bore,0,Math.PI*2,true);s.holes.push(h);}const geo=new T.ExtrudeGeometry(s,{depth:.42,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2,curveSegments:40,steps:1});geo.translate(0,0,-.21);return mesh(g,geo,mat);}
 function register(index,g,cages=[]){g.userData.part=index;g.traverse(o=>{if(o.isMesh){o.userData.part=index;pickables.push(o);}});const localBounds=new T.Box3().setFromObject(g);const p={...PARTS[index],group:g,rotorChildren:cages,localBounds,radius:localBounds.getSize(new T.Vector3()).length()/2};g.position.fromArray(p.base);root.add(g);parts[index]=p;return p;}
 // Replace the short pedestal with a base supporting both the motor and gearbox.
 const old=parts[18];root.remove(old.group);for(let i=pickables.length-1;i>=0;i--)if(pickables[i].userData.part===18)pickables.splice(i,1);
 const base=new T.Group();box(base,5.15,.34,11.65,dark,0,-4.28,0);box(base,5.02,.035,11.51,steel,0,-4.095,0);
 for(const x of [-1.5,1.5])for(const z of [-1.3,-3.0])box(base,.65,2.23,.7,dark,x,-2.99,z);
 box(base,1.38,3.28,.55,dark,0,-2.40,2.82);box(base,1.1,2.12,.58,dark,0,-3.04,.6);
 for(const x of [-2.18,2.18])for(const z of [-5.2,5.2]){box(base,.42,.16,.55,rubber,x,-4.51,z);const b=new T.Group();b.rotation.x=-Math.PI/2;b.position.set(x,-4.03,z);base.add(b);bolts(b,1,0,0,.1);}
 register(18,base);
 // Shorten the output shaft so it ends at the carrier instead of passing through the sun shaft.
 for(const [i,factor] of [[7,.84],[6,.45],[19,.4],[20,.4],[21,.4],[22,.4]]){const p=parts[i];p.group.traverse(o=>{if(o.isMesh)o.geometry.scale(1,1,factor);});p.group.position.set(0,0,0);p.localBounds=new T.Box3().setFromObject(p.group);p.group.position.fromArray(PARTS[i].base);}
 for(let i=23;i<33;i++){
  const g=new T.Group(),cages=[];
  if(i===23){gear(g,72,true,steel);torus(g,1.85,.045,orange,.28);torus(g,1.85,.045,orange,-.28);}
  if(i===24){gear(g,24,false,steel,.17);plate(g,.17,.29,.78,steel,-.17);torus(g,.34,.018,bronze,.222);}
  if(i>=25&&i<=28){gear(g,24,false,bronze,.17);cages.push(bearing(g,.17,.29,.24));torus(g,.44,.016,steel,.226);}
  if(i===29){plate(g,.255,.42,.2,steel);for(let k=0;k<4;k++){const a=k*Math.PI/2;const arm=box(g,.85,.18,.18,dark,.70*Math.cos(a),.70*Math.sin(a),0);arm.rotation.z=a;}torus(g,1.12,.065,steel);}
  if(i===30){plate(g,.31,1.88,.022,clear);plate(g,1.81,1.93,.065,orange);torus(g,1.88,.023,steel,.07);}
  if(i===31){plate(g,.54,.62,.22,dark);}
  if(i===32){plate(g,.265,.44,.58,steel);}
  if(i===32)g.scale.z=.6;register(i,g,cages);
 }
 addServiceParts(model);
 for(const p of parts)p.group.updateMatrixWorld(true);
 model.stats={parts:parts.length,objects:pickables.length,drawCalls:pickables.reduce((n,m)=>n+(Array.isArray(m.material)?m.geometry.groups.length:1),0)};
 return model;
}
