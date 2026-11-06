import {GC500Car as G} from './assets/gc500/original-car.js';
import {print, FX_UNIFORMS} from './fx-quality.js';
// Original GC500 surfaces and livery, with panel ownership added for removal.
// No replacement shell. Rotation by PI about Y changes +X front to -X front.
export const CAR_METRES_PER_UNIT=5/2.169;
const s=CAR_METRES_PER_UNIT;
export const CAR_AXLES={front:-.58*s,rear:.53*s,y:.145*s,z:.36*s};
export function originalLiveryPixels(){let pixels;G.raceCarAtlas({createTexture:()=>({}),bindTexture(){},texParameteri(){},texImage2D(...a){pixels=a.at(-1);}});return pixels;}

export function gc500Paint(x,y,z,ny,panel=0){
 z=Math.abs(z);let base=[.020,.026,.033];const orange=[.87,.045,.0012],ivory=[.78,.81,.82];
 const bonnet=panel===0&&x>.265&&y>.279&&ny>.46&&z<.296,roof=panel===1&&y>.476&&x<-.039&&x>-.450&&z<.264&&ny>.48;
 if(bonnet||roof||z>.315&&y<.084+.010*(x+.5)||x>.925&&y<.246||x<-.962&&y>.108&&y<.137+.017*(1-z/.38)||panel===2)base=orange;
 if(z>.315&&x>-.98&&x<.89&&y<.19){const sweep=.095+.063*Math.max(0,Math.min(1,(.60-x)/1.35));if(y>sweep-.023&&y<sweep-.006)base=orange;if(y>sweep&&y<sweep+.013)base=ivory;const lower=.092+.020*Math.max(0,Math.min(1,(x+.4)/.9));if(x>-.43&&x<.52&&y>lower&&y<lower+.006)base=ivory;}
 if(x>.32&&x<.98&&y>.285&&ny>.45&&z>.302&&z<.307)base=[.83,.57,.004];return base;
}
function paintMaterial(T,panel){
 const mat=new T.MeshPhysicalMaterial({color:0xffffff,metalness:.035,roughness:.29,clearcoat:.7,clearcoatRoughness:.2,side:T.DoubleSide});mat.userData.gc500Panel=panel;
 mat.onBeforeCompile=shader=>{
  shader.vertexShader='attribute vec3 gcLocal; attribute vec3 gcNormal; varying vec3 vGcLocal; varying vec3 vGcNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGcLocal=gcLocal; vGcNormal=gcNormal;');
  shader.fragmentShader='varying vec3 vGcLocal; varying vec3 vGcNormal;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec3 gcBase=vec3(.020,.026,.033),gcOrange=vec3(.87,.045,.0012),gcIvory=vec3(.78,.81,.82);
   float gx=vGcLocal.x,gy=vGcLocal.y,gz=abs(vGcLocal.z),gny=normalize(vGcNormal).y;
   bool hood=${panel===0?'true':'false'}&&gx>.265&&gy>.279&&gny>.46&&gz<.296;
   bool roof=${panel===1?'true':'false'}&&gy>.476&&gx<-.039&&gx>-.450&&gz<.264&&gny>.48;
   if(hood||roof||(gz>.315&&gy<.084+.010*(gx+.5))||(gx>.925&&gy<.246)||(gx<-.962&&gy>.108&&gy<.137+.017*(1.-gz/.38))||${panel===2?'true':'false'})gcBase=gcOrange;
   if(gz>.315&&gx>-.98&&gx<.89&&gy<.19){float sweep=.095+.063*clamp((.60-gx)/1.35,0.,1.);if(gy>sweep-.023&&gy<sweep-.006)gcBase=gcOrange;if(gy>sweep&&gy<sweep+.013)gcBase=gcIvory;float lower=.092+.020*clamp((gx+.4)/.9,0.,1.);if(gx>-.43&&gx<.52&&gy>lower&&gy<lower+.006)gcBase=gcIvory;}
   if(gx>.32&&gx<.98&&gy>.285&&gny>.45&&gz>.302&&gz<.307)gcBase=vec3(.83,.57,.004);
   diffuseColor.rgb=gcBase;`);
  /* v8.09 — THE FLAKE UNDER THE CLEAR COAT. One cell in six of a 0.6 mm lattice over the panel (the car's own coordinates, so the flakes
     stay on the body however it moves) is a flake: tilted a little and smoother than the paint round it, so it catches a lamp as a
     sparkle inside the highlight. Only where a cell is bigger than about half a pixel (close up, or a 4K frame) — further off it would
     only shimmer, so it fades out by its own footprint. The clear coat above keeps the smooth surface's normal: its reflection of the
     light rig stays a clean line. fxDetail 0 (a phone on the Laptop rung) skips it. */
  shader.uniforms.fxDetail=FX_UNIFORMS.fxDetail;
  shader.fragmentShader=shader.fragmentShader.replace('varying vec3 vGcLocal;','uniform float fxDetail;\nvarying vec3 vGcLocal;\nvec3 gcHash3(vec3 p){p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yxz+33.33);return fract((p.xxy+p.yxx)*p.zyx);}');
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   if(fxDetail>.5){vec3 fp=vGcLocal*3800.;vec3 fw=fwidth(fp);float foot=max(fw.x,max(fw.y,fw.z)),fade=1.-smoothstep(.45,1.4,foot);
    if(fade>0.){vec3 fh=gcHash3(floor(fp));float flake=step(.83,fh.z)*fade;normal=normalize(normal+(fh-.5)*.9*flake);roughnessFactor=mix(roughnessFactor,roughnessFactor*.38,flake);}}`);
 };mat.customProgramCacheKey=()=>`gc500-original-paint-fx-${panel}`;return mat;
}

/* v5.81 — THE CORNER THAT IS SERVICED. The original wheel is a rim, a tyre, a centre, a barrel and a flat disc, and its caliper is a twelve-
   triangle orange block in front of the disc; there is no hub — nothing on the car for a wheel to come off. So each REAR corner (the pair on
   the rollers, the pair the service takes off — car-motion.js WheelService) gets, as new geometry beside the original and never through it:
   · the hub: a machined bell from the drive shaft's end (35 mm inboard of the wheel centre, where the half shaft meets it) out to a flange
     that carries the disc's inner edge, five drive pegs, and the centre-lock spigot to the wheel's face;
   · the centre-lock nut on the spigot, twelve-point, the fastening the service undoes and torques;
   · a monobloc caliper housing round the original block — enclosing it, never cutting it — an arc over the disc's outer band, inside the
     rim's barrel (r .2175 against its .22) so the wheel slides past it.
   Built in the wheel's own frame (its origin the wheel centre, +z outward on the near side), turned half a turn for the far side. */
function serviceCorners(T,wheels,materials){
 const steel=new T.MeshStandardMaterial({color:0xb4bcc1,metalness:.7,roughness:.38});   /* machined steel, satin: fully metallic it mirrored the dark hall and read as a black cone */
 const caliperMat=materials.orange||new T.MeshStandardMaterial({color:0xff6a13,roughness:.3,metalness:.2});
 for(const g of wheels){
  if(!/REAR/.test(g.userData.id))continue;
  const o=g.userData.side==='near'?1:-1,turn=geo=>{if(o<0)geo.rotateY(Math.PI);return geo;};
  const label=(o>0?'near':'far')+' rear';
  /* the hub: bell, flange, spigot — a lathe about the axle — and the pegs */
  const prof=[[.028,-.040],[.048,-.040],[.058,-.030],[.060,.040],[.068,.058],[.084,.064],[.084,.080],[.060,.084],[.038,.090],[.031,.094],[.031,.118],[.024,.121],[.018,.121]].map(([r,z])=>new T.Vector2(r,z));
  const bell=new T.LatheGeometry(prof,48);bell.rotateX(Math.PI/2);   /* the lathe's axis is its y; +y onto +z, outward */
  const parts=[bell];for(let k=0;k<5;k++){const a=k*Math.PI*2/5,peg=new T.CylinderGeometry(.0055,.0055,.016,12);peg.rotateX(Math.PI/2);peg.translate(Math.cos(a)*.052,Math.sin(a)*.052,.090);parts.push(peg);}
  const hubGeo=turn(mergeGeometries(T,parts));const hub=new T.Mesh(hubGeo,steel);hub.name='Wheel hub, '+label;hub.castShadow=hub.receiveShadow=true;g.getObjectByName('Wheel hub').add(hub);
  /* the nut: a twelve-point ring on the spigot, just outboard of the wheel's own centre face (.117) */
  const nprof=[[.020,-.011],[.040,-.011],[.044,-.007],[.044,.007],[.040,.011],[.020,.011],[.018,.0]].map(([r,z])=>new T.Vector2(r,z));nprof.push(nprof[0].clone());
  const nutGeo=turn(new T.LatheGeometry(nprof,12).rotateX(Math.PI/2));const nut=new T.Mesh(nutGeo,steel);nut.name='Wheel nut';nut.userData.label='Wheel nut, '+label;nut.position.set(0,0,o*.129);nut.userData.home={position:nut.position.clone(),z:o*.129};nut.castShadow=true;g.add(nut);
  /* the caliper: an arc from 132° to 200° round the axle (the original block sits between 141° and 192°, r .144 to .213), r .135 to .2175, from
     .055 to .094 outboard — the block's own faces are at .060 and .092 */
  const sh=new T.Shape(),a0=132*Math.PI/180,a1=200*Math.PI/180;sh.absarc(0,0,.2175,a0,a1,false);sh.absarc(0,0,.135,a1,a0,true);sh.closePath();
  const cal=new T.ExtrudeGeometry(sh,{depth:.035,bevelEnabled:true,bevelThickness:.002,bevelSize:.002,bevelSegments:2,curveSegments:16});cal.translate(0,0,o>0?.057:-.092);   /* the block is ahead of the axle on both sides, so the arc is not turned — only moved outboard */
  const caliper=new T.Mesh(cal,caliperMat);caliper.name='Brake caliper, '+label;caliper.castShadow=caliper.receiveShadow=true;g.add(caliper);
 }
}
/* v8.09 — THE SLICKS. The original tyre was one flat rubber colour. Now its sidewalls carry printed lettering round the rim — COATES,
   the car's number, the event, the word for what it is — twice round each wall, white on the rubber, read the right way from outside
   on both faces; the walls have rubber's satin sheen; and the tread has the fine lengthwise grain of a slick that has run. All of it
   is worked out from the tyre's own shape (its radius and its angle round the axle, in the wheel's frame, metres), so nothing about
   the original geometry or its UVs changes and the print turns with the wheel. The sidewall band is r .262 to .318 m of the
   .233 to .334 m wall. */
const TYRE_PRINT={r0:.262,r1:.318,text:'COATES  ·  #26  ·  GC500 2026  ·  RACING SLICK  ·  '};
function tyreLettering(){
 return print(2048,128,(g,W,H)=>{g.clearRect(0,0,W,H);g.fillStyle='rgba(236,235,229,.94)';g.textBaseline='middle';g.textAlign='left';
  g.font='800 70px Arial, Helvetica, sans-serif';if('letterSpacing' in g)g.letterSpacing='9px';
  const t=TYRE_PRINT.text,w=g.measureText(t).width,k=Math.min(1,(W/2)/w);g.save();g.scale(k,1);for(let i=0;i<2;i++)g.fillText(t,(i*W/2)/k,H*.54);g.restore();
  g.fillRect(0,H*.06,W,3);g.fillRect(0,H*.93,W,3);},{mode:'logical',name:'tyre lettering'});
}
function tyreMaterial(T,base){
 const mat=new T.MeshStandardMaterial({color:base&&base.color?base.color.clone():new T.Color(0x151719),roughness:.84,metalness:0});
 const lettering=tyreLettering();
 if(!lettering)return mat;   /* no document (the node tests): the plain rubber */
 mat.onBeforeCompile=shader=>{
  shader.uniforms.fxDetail=FX_UNIFORMS.fxDetail;shader.uniforms.tyreText={value:lettering.texture};
  shader.vertexShader='varying vec3 vTyreP; varying vec3 vTyreN;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTyreP=position; vTyreN=normal;');
  shader.fragmentShader='uniform float fxDetail; uniform sampler2D tyreText; varying vec3 vTyreP; varying vec3 vTyreN;\n'+shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   {float r=length(vTyreP.xy),side=abs(vTyreN.z)/max(length(vTyreN),1e-5),ang=atan(vTyreP.y,vTyreP.x)/6.2831853;
    /* read from outside on either face: round the +z face the words run clockwise, round the -z face the other way */
    float u=vTyreN.z>=0.?-ang:ang;vec2 uv=vec2(u*2.,(r-${TYRE_PRINT.r0.toFixed(3)})/${(TYRE_PRINT.r1-TYRE_PRINT.r0).toFixed(3)});
    /* the seam where the angle wraps: take the derivatives from a copy of u shifted half a turn, so the filter never sees the jump */
    vec2 uvb=vec2(fract(uv.x+.5),uv.y),dx=dFdx(uv),dy=dFdy(uv),dxb=dFdx(uvb),dyb=dFdy(uvb);if(dot(dx,dx)+dot(dy,dy)>dot(dxb,dxb)+dot(dyb,dyb)){dx=dxb;dy=dyb;}
    float wall=smoothstep(.55,.75,side),inBand=step(0.,uv.y)*step(uv.y,1.);
    vec4 ink=textureGrad(tyreText,vec2(fract(uv.x),clamp(uv.y,0.,1.)),dx,dy)*wall*inBand;
    diffuseColor.rgb=mix(diffuseColor.rgb,ink.rgb,ink.a);
    roughnessFactor=mix(roughnessFactor,.66,wall);roughnessFactor=mix(roughnessFactor,.5,ink.a);
    if(fxDetail>.5){float along=vTyreP.z*900.,fa=fwidth(along),grain=fract(sin(floor(along)*12.9898)*43758.5453),fadeG=(1.-wall)*(1.-smoothstep(.5,1.5,fa));
     roughnessFactor=mix(roughnessFactor,roughnessFactor*(.82+.3*grain),fadeG);diffuseColor.rgb*=mix(1.,.9+.18*grain,fadeG);}}`);
 };
 mat.customProgramCacheKey=()=>'gc500-slick-fx';return mat;
}
/* v8.09 — CRISP LETTERS AT ANY DISTANCE. The atlas holds each glyph's coverage, anti-aliased over about two texels. Magnified (a
   close-up, a 4K frame) the bilinear ramp between them spreads over many screen pixels and the edge goes soft. Where a texel is bigger
   than a pixel the coverage is re-thresholded at its half-way line over one screen pixel (its own screen-space slope, fwidth), which is
   what a distance-field font does: the letter keeps its shape and its edge is one pixel wide however close. Where a texel is smaller
   than a pixel (further off) the mipmapped coverage is used as it is. */
function crispDecal(mat){
 mat.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
  #ifdef USE_MAP
  {float a=sampledDiffuseColor.a,w=fwidth(a),sharp=clamp((a-.5)/max(w,1e-4)*.8+.5,0.,1.);diffuseColor.a=opacity*mix(sharp,a,smoothstep(.10,.42,w));}
  #endif`);};
 mat.customProgramCacheKey=()=>'gc500-crisp-decal';return mat;
}
/* one geometry from several (position, normal, uv), non-indexed */
function mergeGeometries(T,geos){const out=new T.BufferGeometry();const flat=geos.map(g=>g.index?g.toNonIndexed():g);
 for(const [k,size] of [['position',3],['normal',3],['uv',2]]){const n=flat.reduce((a,g)=>a+g.attributes[k].count*size,0),data=new Float32Array(n);let at=0;for(const g of flat){data.set(g.attributes[k].array.subarray(0,g.attributes[k].count*size),at);at+=g.attributes[k].count*size;}out.setAttribute(k,new T.BufferAttribute(data,size));}
 out.computeBoundingBox();out.computeBoundingSphere();return out;}
export function buildCarBody(T,materials={}){
 const root=new T.Group();root.name='GC500 · original Coates #26';
 const removable=[],wheels=[],groups=new Map(),pools=new Map();
 const create=(id,name,role,side,pull)=>{const group=new T.Group();group.name=name;group.userData={id,role,...(side?{side:side>0?'near':'far'}:{})};root.add(group);groups.set(id,group);if(pull)removable.push({id,name,group,home:[0,0,0],pull});return group;};
 create('CAR-BODY-BONNET','GC500 orange bonnet','bonnet',0,[-.2,1.15,0]);
 for(const side of [-1,1]){const key=side>0?'R':'L',label=side>0?'Near':'Far';
  create(`CAR-BODY-FRONT-FENDER-${key}`,`${label} front fender`,'front-fender',side,[-.2,.2,side*1.1]);
  create(`CAR-BODY-REAR-FENDER-${key}`,`${label} rear quarter`,'rear-fender',side,[.2,.2,side*1.1]);
  create(`CAR-BODY-DOOR-${key}`,`${label} Coates door and Fisher window`,'door',side,[0,.1,side*1.25]);
  create(`CAR-BODY-SILL-${key}`,`${label} side skirt`,'side-skirt',side,[0,-.04,side*.75]);
  create(`CAR-BODY-MIRROR-${key}`,`${label} mirror`,'mirror',side,[-.1,.2,side*.6]);}
 create('CAR-BODY-ROOF','GC500 roof, pillars and windscreens','roof',0,[0,1.35,0]);
 create('CAR-BODY-DECK','Rear deck lid','deck-lid',0,[.2,.85,0]);
 create('CAR-BODY-NOSE','GC500 front bumper, grille and splitter','front-bumper',0,[-.95,0,0]);
 create('CAR-BODY-TAIL','GC500 rear lights, bumper and diffuser','rear-bumper',0,[.9,0,0]);
 create('CAR-BODY-WING','GC500 rear wing and orange endplates','rear-wing',0,[.2,1,0]);
 const cockpit=create('CAR-BODY-BASE','Original GC500 cockpit and cage','body-shell',0,null);
 for(const axle of ['FRONT','REAR'])for(const side of [-1,1]){const id=`CAR-BODY-WHEEL-${axle}-${side>0?'R':'L'}`,g=create(id,`${side>0?'Near':'Far'} ${axle.toLowerCase()} GC500 wheel`,'wheel',side,[0,0,side*.85]);g.position.set(CAR_AXLES[axle.toLowerCase()],CAR_AXLES.y,side*CAR_AXLES.z);g.userData.axisSign=1;const rotor=new T.Group();rotor.name='Wheel rotor';g.add(rotor);/* v5.81 — the hub turns with the drive and carries the brake disc; the rotor (the rim and the tyre) turns with the hub while it is on it (car-motion.js advanceWheel) */const hub=new T.Group();hub.name='Wheel hub';g.add(hub);wheels.push(g);}
 const palette={paint:paintMaterial(T,0),roof:paintMaterial(T,1),ends:paintMaterial(T,2),carbon:materials.carbon||new T.MeshStandardMaterial({color:0x171b1e,roughness:.43}),interior:new T.MeshStandardMaterial({color:0x272d33,roughness:.86}),glass:new T.MeshPhysicalMaterial({color:0x314b5c,metalness:.05,roughness:.13,transparent:true,opacity:.65,depthWrite:false,side:T.DoubleSide}),alloy:new T.MeshStandardMaterial({color:new T.Color(.12,.14,.16),metalness:.78,roughness:.36}),rubber:materials.rubber||new T.MeshStandardMaterial({color:0x151719,roughness:.84}),tyre:tyreMaterial(T,materials.rubber),grille:new T.MeshStandardMaterial({color:0x161b20,roughness:.62,metalness:.25}),lampWhite:materials.headlight||new T.MeshStandardMaterial({color:0xeaf6ff,emissive:0xcdefff}),lampRed:materials.redlight||new T.MeshStandardMaterial({color:0xc00906,emissive:0xe01108})};
 for(const m of Object.values(palette))m.side=T.DoubleSide;
 const alpha=originalLiveryPixels(),rgba=new Uint8Array(alpha.length*4);for(let i=0;i<alpha.length;i++){rgba[i*4]=rgba[i*4+1]=rgba[i*4+2]=255;rgba[i*4+3]=alpha[i];}
 /* v8.09 — the livery's atlas is mipmapped and filtered anisotropically (it was a single 1024 × 512 level: shimmer and stair-steps on the far
    door, a smear on the bonnet at a glancing angle), and its decal shader keeps the edges sharp however close the camera goes (crispDecal) */
 const atlas=new T.DataTexture(rgba,1024,512);atlas.flipY=false;atlas.colorSpace=T.SRGBColorSpace;atlas.magFilter=T.LinearFilter;atlas.minFilter=T.LinearMipmapLinearFilter;atlas.generateMipmaps=true;atlas.anisotropy=T.Texture.DEFAULT_ANISOTROPY;atlas.needsUpdate=true;
 for(const [key,color]of [['decal',[.96,.96,.96]],['yellow',[1,.79,.008]]])palette[key]=crispDecal(new T.MeshPhysicalMaterial({map:atlas,color:new T.Color(...color),transparent:true,alphaTest:.015,depthWrite:false,side:T.FrontSide,polygonOffset:true,polygonOffsetFactor:-1,
  /* v8.09 — the print is lit, under the same clear coat as the paint round it: the lamps' highlights and the light rig's lines run across
     COATES, 26 and FISHER as they run across the panel, instead of the letters glowing flat white in a dark hall (and floating white
     in the floor's reflection with no car round them). A faint glow of their own keeps every word as readable as before. */
  roughness:.34,metalness:0,clearcoat:1,clearcoatRoughness:.12,emissive:new T.Color(...color).multiplyScalar(.16)}));
 const keyFor=(x,y,z,n,p)=>{
  const side=z<0?'R':'L',az=Math.abs(z),name=p.name;
  if(p.wheel)return `CAR-BODY-WHEEL-${p.wheel.x>0?'FRONT':'REAR'}-${p.wheel.side<0?'R':'L'}`;
  if(name==='bonnet-Coates')return 'CAR-BODY-BONNET';
  if(name==='roof-26'||name==='windscreen-26')return 'CAR-BODY-ROOF';
  if(name==='rear-26')return 'CAR-BODY-TAIL';
  if(p.material==='decal')return `CAR-BODY-DOOR-${side}`;
  if(name==='wing-endplates'||x<-.86&&y>.342&&az<.44&&name==='aero-carbon')return 'CAR-BODY-WING';
  if(y>.34&&az>.38&&x>.035&&x<.18)return `CAR-BODY-MIRROR-${side}`;
  if(name==='cockpit-and-cage')return 'CAR-BODY-BASE';
  if(name==='fixed-machined-detail'){for(const a of [.58,-.53])if(x>a+.05&&x<a+.09&&y>.12&&y<.20&&az>.36)return `CAR-BODY-WHEEL-${a>0?'FRONT':'REAR'}-${side}`;if(x>-.62&&x<.22&&az<.29)return 'CAR-BODY-BASE';}
  if(name==='roof-and-pillars')return 'CAR-BODY-ROOF';
  if(name==='curved-window-glass'&&y>.32)return az>.26&&Math.abs(n[2])>.72?`CAR-BODY-DOOR-${side}`:'CAR-BODY-ROOF';
  if(y>.46)return 'CAR-BODY-ROOF';
  if(x>=.26&&y>.276&&az<.346&&n[1]>.42&&name!=='honeycomb-grilles'&&name!=='led-running-lights')return 'CAR-BODY-BONNET';
  if(x>.96||x>.90&&y<.25||name==='honeycomb-grilles'||name==='led-running-lights')return 'CAR-BODY-NOSE';
  if(x<-.95&&y<.343||name==='rear-light-guides'||x<-.85&&y<.10)return 'CAR-BODY-TAIL';
  if(x<-.751&&y>.34&&az<.355&&n[1]>.4)return 'CAR-BODY-DECK';
  if(az>.29){if(x>-.368&&x<.417&&y<.074)return `CAR-BODY-SILL-${side}`;if(x>.33)return `CAR-BODY-FRONT-FENDER-${side}`;if(x<-.42)return `CAR-BODY-REAR-FENDER-${side}`;return `CAR-BODY-DOOR-${side}`;}
  return 'CAR-BODY-BASE';
 };
 const original=G.raceCarModel('high'),sources=[...original.parts,...G.raceCarDecals()];let originalTriangles=0;
 for(const part of sources){const v=part.vertices,ix=part.indices,materialKey=part.name==='roof-and-pillars'?'roof':part.name==='wing-endplates'?'ends':part.material==='decal'&&part.color[1]<.9?'yellow':part.wheel&&/-slick$/.test(part.name)?'tyre':part.material;
  for(let f=0;f<ix.length;f+=3){originalTriangles++;const c=[0,0,0],n=[0,0,0];for(let j=0;j<3;j++)for(let k=0;k<3;k++){c[k]+=v[ix[f+j]*8+k]/3;n[k]+=v[ix[f+j]*8+3+k]/3;}
   /* v5.81 — THE DISC STAYS ON THE CAR (Andrew Fisher's workshop brief, 24 Sep 2026: the hub, brake disc and stationary caliper exposed): the
      original's brake-disc surface goes to the hub, not to the rotor, so a wheel that comes off leaves it bolted where it is. Only its parent
      is chosen here; the hub stands exactly where the rotor does, so every vertex is where it was (tests/gc500-source.test.mjs). */
   const id=keyFor(...c,n,part),owner=groups.get(id),parent=part.wheel?owner.getObjectByName(/-brake-disc$/.test(part.name)?'Wheel hub':'Wheel rotor'):owner,key=id+'|'+part.name;let pool=pools.get(key);
   if(!pool){pool={parent,owner,part,materialKey,pos:[],norm:[],uv:[],original:[],originalNormal:[],color:[]};pools.set(key,pool);}
   for(let j=0;j<3;j++){const k=ix[f+j]*8,x=v[k],y=v[k+1],z=v[k+2];pool.pos.push(-x*s-owner.position.x,y*s-owner.position.y,-z*s-owner.position.z);pool.norm.push(-v[k+3],v[k+4],-v[k+5]);pool.uv.push(v[k+6],v[k+7]);pool.original.push(x,y,z);pool.originalNormal.push(v[k+3],v[k+4],v[k+5]);pool.color.push(...gc500Paint(x,y,z,v[k+4],materialKey==='roof'?1:materialKey==='ends'?2:0));}
  }
 }
 for(const p of pools.values()){const geo=new T.BufferGeometry();for(const [name,data,size]of [['position',p.pos,3],['normal',p.norm,3],['uv',p.uv,2],['gcLocal',p.original,3],['gcNormal',p.originalNormal,3],['gcPaint',p.color,3]])geo.setAttribute(name,new T.Float32BufferAttribute(data,size));const mesh=new T.Mesh(geo,palette[p.materialKey]);mesh.name=p.part.name;mesh.userData={sourcePart:p.part.name,livery:p.part.material==='decal'};if(mesh.userData.livery)mesh.renderOrder=3;if(p.owner.userData.role==='wheel'&&!p.part.wheel)mesh.name='Wheel orange';mesh.castShadow=!mesh.userData.livery;mesh.receiveShadow=true;p.parent.add(mesh);}
 for(const p of removable){if(p.group.userData.role!=='wheel'){p.group.updateWorldMatrix(true,true);const centre=new T.Box3().setFromObject(p.group).getCenter(new T.Vector3());p.group.position.copy(centre);for(const m of p.group.children)m.position.sub(centre);}p.home=p.group.position.toArray();}
 serviceCorners(T,wheels,materials);
 // A lower-door section exposes the prop shaft while retaining the original
 // Coates, 26 and Fisher graphics on the upper door/window in the cutaway.
 const doorSections=[];
 for(const mesh of groups.get('CAR-BODY-DOOR-R').children){
  const full=mesh.geometry,src=full.attributes.gcLocal,index=[];
  for(let i=0;i<src.count;i+=3)if((src.getY(i)+src.getY(i+1)+src.getY(i+2))/3>=.177)index.push(i,i+1,i+2);
  const section=full.clone();section.setIndex(index);doorSections.push({mesh,full,section});
 }
 let doorCutaway=false;
 const setDoorCutaway=on=>{if(on===doorCutaway)return;doorCutaway=on;for(const p of doorSections)p.mesh.geometry=on?p.section:p.full;};
 root.updateMatrixWorld(true);return {root,removable,wheels,cockpit,atlas,setDoorCutaway,sourceStats:{...original.stats,trianglesIncludingDecals:originalTriangles},source:'GC500 live app'};
}
