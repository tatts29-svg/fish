import * as T from './vendor/three.module.js';
import {PARTS} from './parts.js';
import {suede as suedeMaps} from './cockpit-surfaces.js';

// Detailed service hardware shares cached geometry; every item owns its transform,
// selection identity and removal state. Original grouped fasteners are replaced.
export function addServiceParts(model){
 const {parts,root,pickables}=model,cache=new Map();
 const steel=new T.MeshStandardMaterial({color:0xb8c3ca,metalness:.94,roughness:.23});
 const bronze=new T.MeshStandardMaterial({color:0xad8044,metalness:.83,roughness:.32});
 function merge(geometries){
  const out=new T.BufferGeometry();
  for(const key of ['position','normal','uv']){
   const arrays=geometries.map(g=>(g.index?g.toNonIndexed():g).attributes[key]);
   const data=new Float32Array(arrays.reduce((n,a)=>n+a.array.length,0));let at=0;
   for(const a of arrays){data.set(a.array,at);at+=a.array.length;}
   out.setAttribute(key,new T.BufferAttribute(data,key==='uv'?2:3));
  }
  out.computeBoundingBox();out.computeBoundingSphere();return out;
 }
 function ring(ri,ro,depth,segments=40,gap=0,bores=[]){
  const s=new T.Shape(),start=gap/2,end=Math.PI*2-gap/2;
  if(gap){s.absarc(0,0,ro,start,end,false);s.lineTo(ri*Math.cos(end),ri*Math.sin(end));s.absarc(0,0,ri,end,start,true);s.closePath();}
  else{s.absarc(0,0,ro,0,Math.PI*2,false);const h=new T.Path();h.absarc(0,0,ri,0,Math.PI*2,true);s.holes.push(h);}
  for(const [x,y,r] of bores){const h=new T.Path();h.absarc(x,y,r,0,Math.PI*2,true);s.holes.push(h);}
  const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:Math.min(.003,depth*.15),bevelThickness:.002,bevelSegments:1,curveSegments:segments,steps:1});g.translate(0,0,-depth/2);return g;
 }
 function coil(radius,length,turns,tube=.006){
  const pts=Array.from({length:turns*12+1},(_,i)=>{const f=i/(turns*12),a=f*turns*Math.PI*2;return new T.Vector3(radius*Math.cos(a),radius*Math.sin(a),length*(f-.5));});
  return new T.TubeGeometry(new T.CatmullRomCurve3(pts),turns*12,tube,5,false);
 }
 function cylinder(r,d,n=20){const g=new T.CylinderGeometry(r,r,d,n);g.rotateX(Math.PI/2);return g;}
 /* THE WHEEL'S OWN MATERIALS. Suede for the rim (matte, no sheen, the nap drawn by a bump map), the orange of
    the marker and the stitching, brushed steel for the spoke plate, black anodised for the quick-release (v5.81: alcantara,
    orange, dark brushed alloy and machined aluminium — below). */
 /* the nap of the suede and the grain of the brushed plate are small tiled bump maps made here, so the wheel
    reads as cloth and metal at any distance without a texture file; the stitching is a dashed canvas along
    the seam. All of it is guarded for the node tests, which have no canvas. */
 function noiseMap(size,fn){const data=new Uint8Array(size*size*4);let seed=4242;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const v=Math.round(fn(x,y,rnd)*255);const k=(y*size+x)*4;data[k]=data[k+1]=data[k+2]=v;data[k+3]=255;}
  const t=new T.DataTexture(data,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.needsUpdate=true;return t;}
 /* v5.81 — THE MAKEOVER Andrew Fisher approved on 23 Sep 2026 (the Coates Way steering wheel had to look outstanding): the
    rim is alcantara now, not rubber — a near-black physical material with a sheen that lifts at grazing angles the
    way the nap of suede does, over a generated fibre noise (cockpit-surfaces.js) — the spoke plate is dark brushed
    alloy on a machined boss, and the quick-release is machined aluminium. */
 const grain=noiseMap(128,(x,y,r)=>{const line=Math.sin(y*1.7)*.5+.5;return .5+.28*(line-.5)+.06*(r()-.5);});grain.repeat.set(3,3);
 const fibre=suedeMaps(T,29);
 /* the rim's UVs run once round the wheel (u) and once round the section (v): 51 × 5 tiles of the 256 px nap is a
    20 mm tile on the 1.0 m centre line and the 90 mm section — whole numbers, so the seams close */
 for(const t of [fibre.map,fibre.bumpMap])t.repeat.set(51,5);
 let stitchMap=null;
 if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=256;c.height=32;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,256,32);g.fillStyle='#fff';
  for(let x=0;x<256;x+=32){g.beginPath();g.rect(x+4,0,20,32);g.fill();}   /* full height, so the mip average stays above the cut at any distance */
  /* the dashes as an alpha mask (white on black, read linear — three.js takes an alpha map's green channel) */
  stitchMap=new T.CanvasTexture(c);stitchMap.wrapS=T.RepeatWrapping;stitchMap.wrapT=T.ClampToEdgeWrapping;stitchMap.repeat.set(16,1);   /* v5.81: 128 stitches round the 0.95 m inner edge — 5 mm dashes, 2.5 mm gaps */stitchMap.colorSpace=T.NoColorSpace;}
 const suede=new T.MeshPhysicalMaterial({color:0x0a0a0c,map:fibre.map,bumpMap:fibre.bumpMap,bumpScale:.9,roughness:.95,metalness:0,sheen:.6,sheenColor:new T.Color(0x34343a),sheenRoughness:.7,envMapIntensity:.3});   /* the cabin shades the rim as it does the dash (car-cockpit.js CABIN_ENV) */
 /* the marker and the release ring are lit surfaces beside the unlit artwork, so their base colour sits well
    under Coates Orange and the cog's own key light brings them up to it (measured: 0xf05a0a came out cream) */
 const orange=new T.MeshPhysicalMaterial({color:0xa8400a,map:fibre.map,bumpMap:fibre.bumpMap,bumpScale:.9,roughness:.9,metalness:0,sheen:.5,sheenColor:new T.Color(0xc86a30),sheenRoughness:.7,clearcoat:0,envMapIntensity:.4});
 /* the stitch dashes are 5 mm long on the fitted wheel: close up they read as stitches, and at any distance the
    texture's own mip levels average them to a continuous orange thread — which is what real stitching does — so
    the cut sits at .3, below the averaged grey, and the line never vanishes */
 const stitch=stitchMap?new T.MeshStandardMaterial({color:0xff6a13,alphaMap:stitchMap,alphaTest:.3,roughness:.55,metalness:0})
                        :new T.MeshStandardMaterial({color:0xff6a13,roughness:.6,metalness:0});
 const brushed=new T.MeshStandardMaterial({color:0x5c6369,metalness:.9,roughness:.32,bumpMap:grain,bumpScale:.01});
 /* machined aluminium: the boss and the quick-release, turned bright with the tool's marks as a fine roughness */
 const machined=new T.MeshPhysicalMaterial({color:0xc4cacd,metalness:1,roughness:.24,clearcoat:.2,clearcoatRoughness:.3});
 /* THE RIM (v5.81). The v5.80 rim was a tube of one radius — a hose round the cog. A race wheel's rim is moulded:
    the section swells into a grip at nine and three, fuller behind and outboard where the fingers close, with a
    groove for each finger on the back; the top and the flat bottom stay slim. So the rim is swept here section by
    section: the D-shaped centre line (round, flattened across the bottom below the lowest tooth), and at each station
    a section whose radius is WHEEL.tube, plus WHEEL.grip toward the back-outside inside the two grips, less a finger
    groove at four places along each grip. The normals are the surface's own (∂P/∂t × ∂P/∂φ), so the swell and the
    grooves shade without a seam. The cog-local angle a is 0 at three o'clock (the driver's right) and π at nine. */
 function rimPath(R,flat,n=160){const pts=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;let x=R*Math.cos(a),y=R*Math.sin(a);if(y<flat){y=flat;}pts.push(new T.Vector3(x,y,0));}
  /* round the two corners where the flat meets the circle, so the D reads as a wheel and not a cut */
  return new T.CatmullRomCurve3(pts,true,'centripetal',.5);}
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 const gripSpan=.34,gripEdge=.22;   /* radians each side of three and nine: the full grip, and the blend into the slim rim */
 function gripAt(a){let best=0;for(const c of [0,Math.PI]){const d=Math.abs(Math.atan2(Math.sin(a-c),Math.cos(a-c)));best=Math.max(best,1-smooth((d-gripSpan)/gripEdge));}return best;}
 function gripPhase(a){for(const c of [0,Math.PI]){const d=Math.atan2(Math.sin(a-c),Math.cos(a-c));if(Math.abs(d)<gripSpan)return (d+gripSpan)/(2*gripSpan);}return -1;}
 function sectionR(p,a,phi){
  const g=gripAt(a),back=Math.max(0,Math.cos(phi-1.75*Math.PI))**1.3;   /* phi 0 outboard, π/2 toward the driver, π inboard, 3π/2 behind */
  let r=p.tube+(p.grip||0)*g*back;
  const u=gripPhase(a);if(u>=0){const behind=Math.max(0,-Math.sin(phi))**1.5,ridge=.5+.5*Math.cos(Math.PI*2*4*u);r-=.07*g*behind*(1-ridge);}
  return r;}
 function sweep(p,path,{samples=240,radial=24,rScale=1,t0=0,t1=1,phi0=0,phi1=Math.PI*2}={}){
  const pos=[],nrm=[],uv=[],idx=[],P=new T.Vector3(),Q=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3();
  const at=(t,phi,out)=>{t=((t%1)+1)%1;path.getPointAt(t,out);const tg=path.getTangentAt(t),ang=Math.atan2(out.y,out.x),r=sectionR(p,ang,phi)*rScale,c=Math.cos(phi),s=Math.sin(phi);
   return out.set(out.x+tg.y*c*r,out.y-tg.x*c*r,s*r);};
  const closedT=t0===0&&t1===1,closedP=phi1-phi0>=Math.PI*2-1e-6;
  for(let i=0;i<=samples;i++){const t=t0+(t1-t0)*i/samples;
   for(let j=0;j<=radial;j++){const phi=phi0+(phi1-phi0)*j/radial;at(t,phi,P);pos.push(P.x,P.y,P.z);
    const dt=.5/samples/(closedT?1:1/(t1-t0)),dp=.5*(phi1-phi0)/radial;
    at(t+dt,phi,a);at(t-dt,phi,Q);a.sub(Q);at(t,phi+dp,b);at(t,phi-dp,Q);b.sub(Q);a.cross(b).normalize();nrm.push(a.x,a.y,a.z);
    uv.push(t,(phi-phi0)/(Math.PI*2));}}   /* u is the place round the wheel, so the marker's nap is the rim's nap */
  for(let i=0;i<samples;i++)for(let j=0;j<radial;j++){const k=i*(radial+1)+j,n=k+radial+1;idx.push(k,n,k+1,n,n+1,k+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(nrm,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeBoundingBox();g.computeBoundingSphere();return g;}
 function rimParts(p){
  const path=rimPath(p.ro,p.flat);
  const grip=sweep(p,path);
  /* the stitching: one run of dashes round the inner edge, where the suede's two halves are sewn — the edge the
     driver sees above the cog — a hair proud of the cloth; its u is the length round the wheel, 16 repeats of the
     dashed canvas */
  const seam=sweep(p,path,{samples:240,radial:2,rScale:1.012,phi0:Math.PI*.80,phi1:Math.PI*.86});
  /* the marker: the top 16 degrees of the rim, a band a hair proud of the suede */
  const top=Math.atan2(p.ro,0),span=8*Math.PI/180,L=path.getLength();
  /* the path's t for an angle: sample it (the flat makes t and the angle differ below, not at the top) */
  let tTop=.25;{let best=9;for(let i=0;i<=720;i++){const t=i/720,q=path.getPointAt(t);const d=Math.abs(Math.atan2(q.y,q.x)-top);if(d<best){best=d;tTop=t;}}}
  const dT=span*p.ro/L;
  const marker=sweep(p,path,{samples:24,radial:24,rScale:1.035,t0:tTop-dT,t1:tTop+dT});
  return [[grip,suede],[seam,stitch],[marker,orange]];
 }
 /* the spoke plate: a ring round the hub with one arm behind each tooth, out to the rim, each arm with a lightening hole */
 function spokesGeo(p){
  const sh=new T.Shape();sh.absarc(0,0,p.ri+.55,0,Math.PI*2,false);const hole=new T.Path();hole.absarc(0,0,p.ri,0,Math.PI*2,true);sh.holes.push(hole);
  const geos=[new T.ExtrudeGeometry(sh,{depth:p.depth,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,bevelSegments:1,curveSegments:48,steps:1}).translate(0,0,-p.depth/2)];
  for(let k=0;k<p.arms;k++){const a=p.first+k*Math.PI*2/p.arms,len=p.ro-p.ri-.2,w=.78;
   const arm=new T.Shape();arm.moveTo(0,-w/2);arm.lineTo(len,-w*.36);arm.lineTo(len,w*.36);arm.lineTo(0,w/2);arm.closePath();
   const lh=new T.Path();lh.absarc(len*.62,0,w*.18,0,Math.PI*2,true);arm.holes.push(lh);
   const g=new T.ExtrudeGeometry(arm,{depth:p.depth,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,bevelSegments:1,curveSegments:14,steps:1}).translate(0,0,-p.depth/2);
   g.translate(p.ri+.35,0,0);g.rotateZ(a);geos.push(g);}
  return merge(geos);
 }
 /* v5.81 — THE MACHINED BOSS the plates sit on: a turned aluminium dish from the spoke ring's inner edge in to the
    quick-release, rising toward the plates and stopping 2 mm short of the back of the outer plate (−0.565 on the
    cog's axis; the spoke plate's mid-plane is at −0.96, so its local +0.395). Hidden from the seat by the plates;
    seen from the side and when the wheel comes apart, where it reads as the wheel's hub, which it is. */
 function bossGeo(p){
  const prof=[[p.ri+.03,-.10],[p.ri+.03,.05],[p.ri-.35,.12],[2.05,.25],[1.45,.335],[1.26,.335],[1.26,.22],[1.60,.16],[2.30,.06],[p.ri-.05,-.04],[p.ri-.05,-.10]].map(([r,z])=>new T.Vector2(r,z));
  prof.push(prof[0].clone());   /* closed, so the dish has a bottom face */
  const g=new T.LatheGeometry(prof,72);g.rotateX(Math.PI/2);   /* the lathe's axis is its y; turned onto the cog's z, +y (toward the plates) on +z */
  g.computeVertexNormals();
  /* six lightening holes' worth of relief: drill-point dimples are not worth the triangles; the turning is the look */
  return g;
 }
 function geometry(p){
  const key=JSON.stringify([p.kind,p.size,p.depth,p.ri,p.ro,p.back,p.tube,p.grip,p.flat,p.arms,p.turns]);if(cache.has(key))return cache.get(key);
  let g;
  if(p.kind==='rim'){const parts=rimParts(p);cache.set(key,parts);return parts;}
  if(p.kind==='spokes'){g=spokesGeo(p);g.computeBoundingBox();g.computeBoundingSphere();const boss=bossGeo(p);boss.computeBoundingBox();boss.computeBoundingSphere();const parts=[[g,brushed],[boss,machined]];cache.set(key,parts);return parts;}
  if(p.kind==='qr'){const collar=ring(p.ri,p.ro,p.depth,48),lever=ring(p.ro-.02,p.ro+.16,.12,48);lever.translate(0,0,p.depth*.42);
   const knurl=[];for(let k=0;k<24;k++){const a=k/24*Math.PI*2;knurl.push(new T.BoxGeometry(.05,.16,p.depth*.7).translate(0,p.ro-.01,0).rotateZ(a));}
   const parts=[[merge([collar,...knurl]),machined],[lever,orange]];cache.set(key,parts);return parts;}
  if(p.kind==='bolt'){
   const s=p.size,head=ring(s*.38,s,s*.8,12),shank=cylinder(s*.49,s*2.4,12),thread=coil(s*.52,s*2,5,s*.06);
   head.translate(0,0,s*.12);shank.translate(0,0,-s*1.45);thread.translate(0,0,-s*1.45);
   const socket=cylinder(s*.39,.006,6);socket.translate(0,0,-s*.2);
   g=merge([head,shank,thread,socket]);if(p.back)g.rotateX(Math.PI);
  }else if(p.kind==='pin'){
   const body=cylinder(p.size,p.depth,32),end=ring(p.size*.55,p.size*1.03,.026,24);end.translate(0,0,p.depth*.46);g=merge([body,end]);
  }else if(p.kind==='ball')g=new T.SphereGeometry(p.size,16,12);
  else if(p.kind==='spring')g=coil(p.size,p.depth,6,.008);
  else if(p.kind==='spiral'){/* v5.80 — a clock spring: a flat coiled ribbon from ri out to ro, `turns` round, lying in the plate's plane */
   const pts=[];const n=Math.round((p.turns||3)*40);for(let k=0;k<=n;k++){const t=k/n,a=t*(p.turns||3)*Math.PI*2,r=p.ri+(p.ro-p.ri)*t;pts.push(new T.Vector3(r*Math.cos(a),r*Math.sin(a),0));}
   const curve=new T.CatmullRomCurve3(pts);g=new T.TubeGeometry(curve,n*2,.028,6,false);const rib=new T.TubeGeometry(curve,n*2,.012,4,false);rib.translate(0,0,p.depth*.5);g=merge([g,rib]);}
  else g=ring(p.ri,p.ro,p.depth,p.kind==='plate'?24:40,p.kind==='snap'?.16:0,p.kind==='plate'?Array.from({length:6},(_,k)=>[.61*Math.cos(k*Math.PI/3),.61*Math.sin(k*Math.PI/3),.035]):[]);
  g.computeBoundingBox();g.computeBoundingSphere();cache.set(key,g);return g;
 }
 for(const spec of PARTS.filter(p=>p.kind)){
  const old=parts[spec.index];if(old){root.remove(old.group);for(let k=pickables.length-1;k>=0;k--)if(pickables[k].userData.part===spec.index)pickables.splice(k,1);}
  const group=new T.Group(),built=geometry(spec);
  const pieces=Array.isArray(built)?built:[[built,spec.kind==='spokes'?brushed:spec.bronze?bronze:steel]];
  for(const [geo,mat] of pieces){const mesh=new T.Mesh(geo,mat.clone());mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.part=spec.index;group.add(mesh);pickables.push(mesh);}
  group.userData.part=spec.index;
  const localBounds=new T.Box3().setFromObject(group);parts[spec.index]={...spec,group,rotorChildren:[],localBounds,radius:localBounds.getSize(new T.Vector3()).length()/2};
  group.position.fromArray(spec.base);root.add(group);
 }
}
