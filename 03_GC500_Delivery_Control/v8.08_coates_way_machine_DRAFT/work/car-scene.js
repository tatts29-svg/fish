import * as T from './vendor/three.module.js';
import {buildPitGarage} from './pit-garage.js';
/* v5.81 — THE COCKPIT'S SKINS live in cockpit-surfaces.js (the carbon twill and its normal and anisotropy maps, the suede nap, the
   brushed and turned metal, the harness webbing, UVs in metres) and are re-exported here with the rest of the scene's materials, so
   anything that wants the car's carbon asks the scene for it. They are generated at load; nothing is downloaded. makeMaterials()
   below is unchanged: the original car's own carbon keeps its original look (its UVs are the source's, not metres). */
export {carbonTwill,suede,brushed,webbing,metricUV,scaleUV,uvMetres,TWILL} from './cockpit-surfaces.js';
export const COATES_ORANGE='#FF6A13';
/** Small repeatable material maps, generated once. No remote texture dependencies. */
function surface(kind){const n=128,a=new Uint8Array(n*n*4);let seed=91827;for(let y=0;y<n;y++)for(let x=0;x<n;x++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/4294967296;let v=kind==='carbon'?85+((Math.floor(x/5)+Math.floor(y/5))%2)*65+Math.sin((x+y)*.8)*12:130+(noise-.5)*42;const i=(y*n+x)*4;a[i]=a[i+1]=a[i+2]=v;a[i+3]=255;}const t=new T.DataTexture(a,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(kind==='carbon'?8:20,kind==='carbon'?8:20);t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.needsUpdate=true;return t;}
export function makeMaterials(){const carbon=surface('carbon'),metal=surface('metal');return {
orange:new T.MeshPhysicalMaterial({color:COATES_ORANGE,metalness:.28,roughness:.25,clearcoat:1,clearcoatRoughness:.15}),
black:new T.MeshPhysicalMaterial({color:0x15191e,metalness:.35,roughness:.25,clearcoat:.9,clearcoatRoughness:.16}),
carbon:new T.MeshStandardMaterial({color:0x202428,metalness:.28,roughness:.4,bumpMap:carbon,bumpScale:.0015}),
glass:new T.MeshPhysicalMaterial({color:0x70838d,metalness:.05,roughness:.14,transparent:true,opacity:.36,depthWrite:false,side:T.DoubleSide}),
chrome:new T.MeshStandardMaterial({color:0xc3ccd2,metalness:.94,roughness:.2,bumpMap:metal,bumpScale:.0003}),
steel:new T.MeshStandardMaterial({color:0x87949b,metalness:.9,roughness:.33,bumpMap:metal,bumpScale:.0005}),
rubber:new T.MeshStandardMaterial({color:0x111316,metalness:0,roughness:.87,bumpMap:metal,bumpScale:.001}),
headlight:new T.MeshStandardMaterial({color:0xeaf4ff,emissive:0xc9eaff,emissiveIntensity:2.2,roughness:.16}),
redlight:new T.MeshStandardMaterial({color:0xbd090b,emissive:0xff1610,emissiveIntensity:1.1,roughness:.22}),
dark:new T.MeshStandardMaterial({color:0x171f25,roughness:.66,metalness:.35}),
white:new T.MeshStandardMaterial({color:0xf5f6f7,roughness:.35,metalness:.1})};}
/* THE STUDIO IS A PIT GARAGE NOW. Andrew Fisher, 23 Sep 2026: the car in a fully equipped 3D pit garage,
   Coates style — the dyno deck, the ribbed wall and the four wall lamps of v2 went with that request;
   pit-garage.js builds the room, and this stays the one call car-app.js makes. */
export function buildStudio(options){return buildPitGarage(options);}
// Conform the print to the actual curved panel: a flat rectangle would sink
// into the bowed bonnet/door and lose parts of the wordmark.
export function conformPanelPrint(body,role,side,mat,width,height,world,rotation=[0,0,0]){
 const p=body.removable.find(p=>p.group.userData.role===role&&(!side||p.group.userData.side===side));
 if(!p)throw new Error(`Livery panel missing: ${role} ${side??''}`);
 body.root.updateMatrixWorld(true);
 const geometry=new T.PlaneGeometry(width,height,30,12);
 geometry.applyMatrix4(new T.Matrix4().makeRotationFromEuler(new T.Euler(...rotation)));
 geometry.translate(...world);
 const positions=geometry.attributes.position,normal=role==='bonnet'?new T.Vector3(0,1,0):new T.Vector3(0,0,side==='far'?-1:1);
 const ray=new T.Raycaster(),point=new T.Vector3(),targets=[];
 p.group.traverse(o=>{if(o.isMesh&&!o.userData.livery)targets.push(o);});
 for(let i=0;i<positions.count;i++){
  point.fromBufferAttribute(positions,i);ray.set(point.clone().add(normal),normal.clone().negate());
  const hit=ray.intersectObjects(targets,false)[0];
  if(!hit)throw new Error(`Livery extends beyond ${p.name}`);
  point.copy(hit.point).addScaledVector(normal,.0025);p.group.worldToLocal(point);
  positions.setXYZ(i,point.x,point.y,point.z);
 }
 geometry.computeVertexNormals();const mesh=new T.Mesh(geometry,mat);mesh.renderOrder=3;mesh.userData.livery=true;p.group.add(mesh);
}

/** Preserve the supplied wordmark's shape; the livery uses a white print. */
export async function addLivery(body){return {atlas:body.atlas,source:body.source};}
