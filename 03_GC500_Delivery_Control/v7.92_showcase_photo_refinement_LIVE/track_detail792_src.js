/* Author: Andrew Fisher.
 * v7.92 — physical surface detail over both complete existing circuit boundaries.
 * No change to the track, car, driving line, cameras, source kerbs or catch fences.
 * Supplied track photographs/videos inform materials, not guessed landmark positions.
 * Uses the existing 781 lifecycle names so the established renderer owns disposal.
 */
(function () {
'use strict';
const G = window.GC3D;
if (!G || G.installTrackDetail781) return;
const SOURCE = 'Full existing circuit boundaries and original kerb footprints; original paint and signs retained, additive fittings only';
const VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aUV;
layout(location=3) in vec4 aColour;
uniform mat4 uVP;
out vec3 vWorld; out vec3 vNormal; out vec2 vUV; out vec4 vColour; out float vDepth;
void main(){vec4 p=uVP*vec4(aPosition,1.);gl_Position=p;vDepth=p.w;vWorld=aPosition;vNormal=aNormal;vUV=aUV;vColour=aColour;}`;
const FS = `#version 300 es
precision highp float;
in vec3 vWorld; in vec3 vNormal; in vec2 vUV; in vec4 vColour; in float vDepth;
uniform sampler2D uAtlas; uniform vec3 uEye; uniform vec3 uSun; uniform vec2 uFog; uniform float uDay;
uniform float uDeck; uniform float uMetres;
uniform highp sampler2D uShadow; uniform mat4 uLightVP; uniform float uShadowOn; uniform vec2 uShadowTexel;
out vec4 outColour;
float grain781(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
float stone781(vec3 p){
 vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(grain781(i),grain781(i+vec3(1,0,0)),f.x),mix(grain781(i+vec3(0,1,0)),grain781(i+vec3(1,1,0)),f.x),f.y),
 mix(mix(grain781(i+vec3(0,0,1)),grain781(i+vec3(1,0,1)),f.x),mix(grain781(i+vec3(0,1,1)),grain781(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float visibility(vec3 n){
 if(uShadowOn<.5)return 1.;
 vec4 p=uLightVP*vec4(vWorld,1.);vec3 q=p.xyz/max(p.w,.00001)*.5+.5;
 if(any(lessThanEqual(q,vec3(0.)))||any(greaterThanEqual(q,vec3(1.))))return 1.;
 float bias=.00035+.0011*(1.-max(dot(n,normalize(uSun)),0.));float lit=0.;
 /* The shared depth map uses NEAREST filtering. Nine hard comparisons make
    visible n/9 brightness bands on a continuous kerb top. Bilinearly filter
    the comparisons, not depth: this is the same 3x3 PCF footprint expressed
    with its sixteen unique texels. Geometry, material and bias stay fixed. */
 vec2 pixel=q.xy/uShadowTexel-.5,cell=floor(pixel),f=fract(pixel);
 for(int y=-1;y<=2;y++)for(int x=-1;x<=2;x++){
 vec2 uv=(cell+vec2(float(x),float(y))+.5)*uShadowTexel;
 float wx=x==-1?1.-f.x:(x==2?f.x:1.),wy=y==-1?1.-f.y:(y==2?f.y:1.);
 float sampleLit=(any(lessThanEqual(uv,vec2(0.)))||any(greaterThanEqual(uv,vec2(1.))))?1.:step(q.z-bias,texture(uShadow,uv).r);
 lit+=sampleLit*wx*wy;}
 return lit/9.;
}
void main(){
 vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;
 vec3 view=normalize(uEye-vWorld),sun=normalize(uSun);
 vec4 atlasSample=texture(uAtlas,vUV);
 vec3 ink=atlasSample.rgb;vec3 base=pow(max(ink,vec3(.001)),vec3(2.2))*vColour.rgb;
 float rough=clamp(vColour.a,.15,1.),direct=max(dot(n,sun),0.),shadow=visibility(n);
 vec3 skyFill=mix(vec3(.105,.112,.123),vec3(.25,.295,.355),clamp(n.y*.5+.5,0.,1.));
 vec3 daylight=skyFill+vec3(1.16,.995,.78)*direct*shadow;
 /* Stable world-space wear, filtered before minification. Lower-edge dust
    belongs to the barrier, not the sign artwork or a screen-space overlay. */
 float height=(vWorld.y-uDeck)*uMetres;
 vec3 surfacePoint=vWorld*uMetres*6.;
 float detailCoverage=1.-smoothstep(.30,1.,max(length(dFdx(surfacePoint)),length(dFdy(surfacePoint))));
 // Derivatives must run before the alpha mask diverges within a fragment quad.
 if(atlasSample.a<.006)discard;
 float grain=(stone781(surfacePoint)-.5)*detailCoverage;
 float substrate=smoothstep(.70,.92,rough);
 float foot=(1.-smoothstep(.04,.32,height))*(1.-abs(n.y))*substrate;
 base*=1.+grain*.085*substrate-foot*.19;
 rough=clamp(rough+grain*.025,.15,1.);
 vec3 halfVector=normalize(view+sun);float spec=pow(max(dot(n,halfVector),0.),mix(130.,10.,rough));
 vec3 light=base*mix(vec3(.20),daylight,clamp(uDay,0.,1.));
 light+=vec3(1.,.80,.59)*spec*(1.-rough)*.16*shadow*mix(.15,1.,uDay);
 float fog=1.-smoothstep(uFog.x,uFog.y,vDepth);
 float alpha=fog*atlasSample.a;outColour=vec4(light*alpha,alpha);
}`;
const add=(a,b,k=1)=>a.map((x,i)=>x+b[i]*k);
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n);};
const METAL=[.29,.33,.36,.52],DARK=[.10,.12,.135,.64],CONCRETE=[.46,.45,.42,.95],BLACK=[.032,.034,.037,.83],WHITE=[1,1,1,.77];
function shader(gl,type,source){
 const s=gl.createShader(type);if(!s)throw new Error('Track preview shader allocation failed');
 gl.shaderSource(s,source);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error('Track preview shader: '+error);}
 return s;
}
function program(gl){
 const shaders=[];let p=null;
 try{
  shaders.push(shader(gl,gl.VERTEX_SHADER,VS));shaders.push(shader(gl,gl.FRAGMENT_SHADER,FS));
  p=gl.createProgram();if(!p)throw new Error('Track preview program allocation failed');
  for(const s of shaders)gl.attachShader(p,s);gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error('Track preview shader link: '+gl.getProgramInfoLog(p));
  const u={};for(const name of ['uVP','uAtlas','uEye','uSun','uFog','uDay','uDeck','uMetres','uShadow','uLightVP','uShadowOn','uShadowTexel'])u[name]=gl.getUniformLocation(p,name);
  return {p,u};
 }catch(error){if(p)gl.deleteProgram(p);throw error;}
 finally{for(const s of shaders)gl.deleteShader(s);}
}

/* Reuse the precise physical wall front built by G.buildTrackDetail. This walks
 * each closed boundary itself: rays from the racing line can hit the wrong arm
 * of a chicane and must not be used to place a full-circuit skin.
 */
function geometry(S){
 const M=G.M_PER_PT||6,H=S.tune.deckH,runs=[];
 for(const [name,loop,sg,height]of [['outer',S.outer,1,.30],['inner',S.inner,-1,.22]]){
  if(!Array.isArray(loop)||loop.length<3)throw new Error('Full circuit boundary is unavailable: '+name);
  const P=G.dens(loop,2.2);
  const joins=P.map((p,k)=>{
   const a=P[(k+P.length-1)%P.length],b=P[(k+1)%P.length],
    before=unit([p[0]-a[0],0,p[1]-a[1]]),after=unit([b[0]-p[0],0,b[1]-p[1]]),
    n0=[-before[2]*sg,0,before[0]*sg],n1=[-after[2]*sg,0,after[0]*sg],
    denominator=Math.max(.08,1+n0[0]*n1[0]+n0[2]*n1[2]),
    n=n0.map((v,i)=>(v+n1[i])/denominator),length=Math.hypot(n[0],n[2]);
   return length>2.6?n.map(v=>v*2.6/length):n;
  });
  const segments=[];let lengthM=0;
  for(let k=0;k<P.length;k++){
   const j=(k+1)%P.length,na=joins[k],nb=joins[j],
    a=[P[k][0]+na[0]*.45,H,P[k][1]+na[2]*.45],
    b=[P[j][0]+nb[0]*.45,H,P[j][1]+nb[2]*.45],length=Math.hypot(b[0]-a[0],b[2]-a[2]);
   if(length<1e-7)continue;
   segments.push({a,b,na,nb,length,index:k});lengthM+=length*M;
  }
  runs.push({name,height,segments,lengthM});
 }
 const totalLengthM=runs.reduce((n,r)=>n+r.lengthM,0),sourceSegments=runs.reduce((n,r)=>n+r.segments.length,0);
 // Every source span is represented. Increase subdivisions' spacing if a future
 // source becomes larger, rather than stopping halfway through a boundary.
 let panelMetres=Math.max(4,totalLengthM/1800);
 const moduleCount=()=>runs.reduce((n,r)=>n+r.segments.reduce((s,q)=>s+Math.max(1,Math.ceil(q.length*M/panelMetres)),0),0);
 const moduleLimit=Math.max(2400,sourceSegments);let count=moduleCount();
 for(let n=0;count>moduleLimit&&n<40;n++){panelMetres*=1.15;count=moduleCount();}
 return {M,H,runs,totalLengthM,sourceSegments,panelMetres,moduleCount:count,moduleLimit};
}
function makeAtlas(gl,S){
 if(G.makeSignAtlas792)return G.makeSignAtlas792(gl,S);
 // No reconstructed logos and no extrapolated sponsor runs. A small white
 // sample supports the established material program; colour comes from vertices.
 const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.bindTexture(gl.TEXTURE_2D,null);return {texture,white:[.5,.5]};
}
function build(S,D){
 const {M,H,runs}=D.geometry,mesh=D.mesh,atlas=D.atlas;
 const stats=D.stats={author:'Andrew Fisher',source:SOURCE,scope:'complete existing circuit',
  lapLengthM:S.CL.L*M,boundaryLengthM:D.geometry.totalLengthM,coveredLengthM:0,
  sourceSegments:D.geometry.sourceSegments,coveredSegments:0,barrierSkins:0,detailedModules:0,
  jointCovers:0,fixings:0,mountingPlates:0,kerbProfiles:0,gantriesAdded:0,bridgesAdded:0,streetlights:0,
  sponsorPanels:0,catchFenceMeshesAdded:0,originalFacesPreserved:true,sourcePaintChanged:false,sourceTrackChanged:false,sourceKerbChanged:false,
  sourceBuildingChanged:false,drivingChanged:false,camerasChanged:false,
  panelMetres:D.geometry.panelMetres,moduleLimit:D.geometry.moduleLimit,
  kerbSourceRule:'Every original nominal curvature-based kerb footprint; decorative profiles only',
  boundaries:[],sectors:Array.from({length:12},(_,i)=>({sector:i+1,modules:0,boundaryLengthM:0})),triangles:0};
 function face(points,colour=WHITE){
  const normal=unit(cross(sub(points[1],points[0]),sub(points[2],points[0]))),base=mesh.nv;
  for(const p of points)mesh.vert(...p,...normal,...atlas.white,...colour);
  for(let j=1;j<points.length-1;j++)mesh.tri(base,base+j,base+j+1);
 }
 // Display coverage bins, not named race sectors: assigned by nearest point on
 // the unchanged closed centreline. These diagnostics do not drive animation.
 const centre=S.CL.p,sectorAt=p=>{
  let best=Infinity,along=0;
  for(let i=0;i<centre.length;i++){
   const a=centre[i],b=centre[(i+1)%centre.length],dx=b[0]-a[0],dz=b[1]-a[1],length2=dx*dx+dz*dz;
   if(length2<1e-12)continue;
   const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[2]-a[1])*dz)/length2)),
    d=(p[0]-a[0]-t*dx)**2+(p[2]-a[1]-t*dz)**2;
   if(d<best){best=d;along=S.CL.cum[i]+Math.sqrt(length2)*t;}
  }
  const fraction=((along-S.gridS)%S.CL.L+S.CL.L)%S.CL.L/S.CL.L;
  return Math.min(11,Math.floor(fraction*12));
 };
 /* The source's nominal kerb paint is several metres wide. The refined
    visual is a 0.85 m kerb seated on the same outer lip, with metre-scale paint
    blocks. Keep every source array and all driving signals immutable. */
 if(S.kerb&&S.kerbStats){
  const vertices=S.kerb.v,stride=9,quads=S.kerbStats.blocks*2,firstPaintVertex=quads*4,firstPaintIndex=quads*6;
  if(firstPaintVertex*stride>vertices.length||firstPaintIndex>S.kerb.i.length)throw new Error('Kerb source range exceeds the original mesh');
  const widthM=.85,stripeM=1.,lo=H+.008/M,hi=H+.070/M;
  stats.kerbSourceQuads=quads;stats.kerbFootprints=0;stats.kerbPaintBlocks=0;
  stats.kerbWidthM=widthM;stats.kerbHeightM=.070;stats.kerbMaxStripeM=0;
  stats.kerbSourceRule='Original outer lips retained; visual width 0.85 m; original source arrays and physics unchanged';
  D.kerbEdges=[];
  const lerp=(a,b,t)=>a.map((v,k)=>v+(b[k]-v)*t);
  for(let q=0;q<quads;q++){
   const points=Array.from({length:4},(_,k)=>Array.from(vertices.slice((q*4+k)*stride,(q*4+k)*stride+3)));
   const widthA=Math.hypot(points[1][0]-points[0][0],points[1][2]-points[0][2]),
    widthB=Math.hypot(points[2][0]-points[3][0],points[2][2]-points[3][2]),
    innerA=lerp(points[1],points[0],Math.min(1,widthM/M/Math.max(widthA,1e-9))),
    innerB=lerp(points[2],points[3],Math.min(1,widthM/M/Math.max(widthB,1e-9))),
    lengthM=Math.hypot(points[2][0]-points[1][0],points[2][2]-points[1][2])*M,
    pieces=Math.max(1,Math.ceil(lengthM/stripeM)),index=q*4*stride,
    startsRed=vertices[index+3]>vertices[index+4]*2;
   D.kerbEdges.push({sourceQuad:q,outerStart:points[1].slice(),outerEnd:points[2].slice(),innerStart:innerA.slice(),innerEnd:innerB.slice()});
   for(let j=0;j<pieces;j++){
    const u0=j/pieces,u1=(j+1)/pieces,ia=lerp(innerA,innerB,u0),ib=lerp(innerA,innerB,u1),
     oa=lerp(points[1],points[2],u0),ob=lerp(points[1],points[2],u1),
     paint=((j%2===0)===startsRed)?[.42,.030,.022,.94]:[.60,.60,.62,.94],
     span=(a,b,t,height)=>[a[0]+(b[0]-a[0])*t,height,a[2]+(b[2]-a[2])*t],
     aa=[span(ia,oa,0,lo),span(ia,oa,.18,hi),span(ia,oa,.86,hi),span(ia,oa,1,lo)],
     bb=[span(ib,ob,0,lo),span(ib,ob,.18,hi),span(ib,ob,.86,hi),span(ib,ob,1,lo)];
    for(let k=0;k<3;k++)face([aa[k],bb[k],bb[k+1],aa[k+1]],paint);
    const bottom=p=>[p[0],H+.001/M,p[2]],edgePaint=paint.map((v,k)=>k<3?v*.72:v);
    face([bottom(aa[0]),bottom(bb[0]),bb[0],aa[0]],edgePaint);
    face([bottom(bb[3]),bottom(aa[3]),aa[3],bb[3]],edgePaint);
    // Only the source span's two ends need a closing side. Interior paint
    // stripes meet at the identical cross-section, avoiding hidden faces.
    if(j===0)face([bottom(aa[0]),aa[0],aa[1],aa[2],aa[3],bottom(aa[3])],edgePaint);
    if(j===pieces-1)face([bottom(bb[3]),bb[3],bb[2],bb[1],bb[0],bottom(bb[0])],edgePaint);
    stats.kerbPaintBlocks++;
   }
   stats.kerbProfiles++;stats.kerbFootprints++;stats.kerbMaxStripeM=Math.max(stats.kerbMaxStripeM,lengthM/pieces);
  }
  // Original grid boxes, chequered start line, road-edge lines and rubber
  // retain their exact original vertices/colours/UV and triangle order.
  const paint=D.paint=new G.MeshBatch(S.gl,[3,4,2],false);
  for(let i=firstPaintVertex;i<vertices.length/stride;i++)paint.vert(...vertices.slice(i*stride,i*stride+stride));
  for(let i=firstPaintIndex;i<S.kerb.i.length;i+=3){
   const ids=Array.from(S.kerb.i.slice(i,i+3),v=>v-firstPaintVertex);
   if(ids.some(v=>v<0||v>=paint.nv))throw new Error('Road paint index overlaps a source kerb');
   paint.tri(...ids);
  }
  paint.upload();stats.retainedPaintVertices=paint.nv;stats.retainedPaintTriangles=paint.ni/3;
  stats.originalKerbPaintHiddenOnly=true;
 }

 const blend=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
 const SEAM=[.052,.057,.061,.86],CAP=[.125,.14,.15,.73];
 let moduleIndex=0;
 // Bolt heads are deliberately sparse and simple. Existing fence posts already
 // carry the silhouette; a screw on every metre is wasted geometry at lap speed.
 const fittingStride=Math.max(4,Math.ceil(D.geometry.moduleCount/480));
 for(const run of runs){
  const report={name:run.name,sourceSegments:run.segments.length,coveredSegments:0,
   lengthM:run.lengthM,coveredLengthM:0,modules:0,sectors:Array(12).fill(0)};
  for(const segment of run.segments){
   const {a,b,na,nb,length}=segment,count=Math.max(1,Math.ceil(length*M/D.geometry.panelMetres));
   for(let j=0;j<count;j++){
    const t0=j/count,t1=(j+1)/count,A=blend(a,b,t0),B=blend(a,b,t1),N0=blend(na,nb,t0),N1=blend(na,nb,t1),
     tangent=unit(sub(B,A)),sectionLength=length/count,top=H+run.height-.09/M,foot=H+.025/M;
    // Eight millimetres forward of the authoritative face. Thickness remains
    // outside the racing surface; source physics and barrier vertices stay fixed.
    const front=(p,n,y,depth=.008)=>[p[0]-n[0]*depth/M,y,p[2]-n[2]*depth/M];
    const qa=front(A,N0,top),qb=front(B,N1,top);
    // Retain the original front face and its paint or signage in every module.
    // The whole-track material already supplies wear. Only a narrow physical
    // return and joint fitting are additive; there is no blanket recolour.
    face([qa,qb,front(B,N1,top,0),front(A,N0,top,0)],CAP);
    // Joint cover stays inside this module and follows its tangent; never bridges
    // across a street corner or projects a rectangular block into the roadway.
    const width=Math.min(.033/M,sectionLength*.1),A1=add(A,tangent,width),
     q0=front(A,N0,foot,.017),q1=front(A1,N0,foot,.017),q2=front(A1,N0,top,.017),q3=front(A,N0,top,.017);
    face([q0,q1,q2,q3],SEAM);
    face([q3,q2,front(A1,N0,top,.008),front(A,N0,top,.008)],CAP);
    face([q1,front(A1,N0,foot,.008),front(A1,N0,top,.008),q2],SEAM);
    stats.jointCovers++;
    if(moduleIndex%fittingStride===0){
     const normal=unit(N0),c=add(A,tangent,Math.min(.11/M,sectionLength*.3));
     for(const y of [foot+.15/M,top-.15/M]){
      const back=[],frontRing=[],radius=.013/M;
      for(let k=0;k<6;k++){
       const angle=k*Math.PI/3,p=add(c,tangent,Math.cos(angle)*radius);p[1]=y+Math.sin(angle)*radius;
       back.push(add(p,normal,-.010/M));frontRing.push(add(p,normal,-.023/M));
      }
      face(frontRing,CAP);
      for(let k=0;k<6;k++){const q=(k+1)%6;face([back[k],back[q],frontRing[q],frontRing[k]],METAL);}
      stats.fixings++;
     }
    }
    const sector=sectorAt(blend(A,B,.5)),metres=sectionLength*M;
    stats.sectors[sector].modules++;stats.sectors[sector].boundaryLengthM+=metres;
    report.sectors[sector]++;report.modules++;stats.detailedModules++;moduleIndex++;
   }
   report.coveredSegments++;report.coveredLengthM+=length*M;
   stats.coveredSegments++;stats.coveredLengthM+=length*M;
  }
  stats.boundaries.push(report);
 }
 stats.coverageFraction=stats.boundaryLengthM?Math.min(1,stats.coveredLengthM/stats.boundaryLengthM):0;
 stats.coverageBins=stats.sectors.filter(s=>s.modules>0).length;
 stats.coverageBinMeaning='12 equal-distance diagnostic bins on the existing lap, not official race sectors';
 stats.geometryLimit={maxDetailedModules:D.geometry.moduleLimit,maxBoltPairs:480,wholeBoundaryAlwaysCovered:true};
 if(G.addPhotoStructures792)G.addPhotoStructures792(S,D);
 if(G.addTrackLabels792)G.addTrackLabels792(S,D);
 mesh.upload();stats.triangles=mesh.ni/3;stats.vertices=mesh.nv;
 stats.gpuBytes=mesh.nv*12*4+mesh.ni*4+(D.atlas.gpuBytes||4)+(D.paint?D.paint.nv*9*4+D.paint.ni*4:0)+(D.signDecor?D.signDecor.nv*9*4+D.signDecor.ni*4:0);
}
G.installTrackDetail781=function(S){
 S=S||G.S;if(!S||!S.gl||!S.CL||!Number.isFinite(S.gridS))return null;
 if(S.trackDetail781)return S.trackDetail781.stats;
 const gl=S.gl,D={mesh:null,paint:null,atlas:null,program:null,stats:null};
 try{
  D.geometry=geometry(S);D.mesh=new G.MeshBatch(gl,[3,3,2,4],false);D.atlas=makeAtlas(gl,S);D.program=program(gl);build(S,D);
  S.trackDetail781=D;S.detail781Enabled=true;S.needsRender=true;
  S.detail781ShadowMeshes=S.detail781ShadowMeshes||[];S.detail781ShadowMeshes.push(D.mesh);
  /* Invalidate the static shadow cache once after geometry installation. */
  if(S.sunShadow)S.sunShadow.source=null;
  return D.stats;
 }catch(error){
  S.trackDetail781=D;G.disposeTrackDetail781(S);throw error;
 }
};
G.drawTrackDetail781=function(S,VP,fog){
 const D=S&&S.detail781Enabled&&S.trackDetail781;if(!D)return;
 const gl=S.gl,P=D.program,u=P.u;
 gl.useProgram(P.p);gl.uniformMatrix4fv(u.uVP,false,VP);gl.uniform3fv(u.uEye,S.cam.eye);gl.uniform3fv(u.uSun,G.sunDirection||[.45,.8,.4]);
 gl.uniform1f(u.uDeck,S.tune.deckH);gl.uniform1f(u.uMetres,G.M_PER_PT||6);
 gl.uniform2f(u.uFog,fog[0],fog[1]);gl.uniform1f(u.uDay,S.look&&S.look.day?1:0);
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,D.atlas.texture);gl.uniform1i(u.uAtlas,0);
 if(G.bindSunShadow)G.bindSunShadow(S,P,!!(S.look&&S.look.day));
 gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.blendFuncSeparate(gl.ONE,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
 D.mesh.draw();gl.bindVertexArray(null);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,null);
};
/* Call inside the existing shadow pass, with its shadow program and uVP already bound. */
G.drawTrackDetailShadow781=function(S){const D=S&&S.detail781Enabled&&S.trackDetail781;if(D)D.mesh.draw();};
G.disposeTrackDetail781=function(S){
 S=S||G.S;const D=S&&S.trackDetail781;if(!D)return;
 const gl=S.gl,m=D.mesh;
 // Context loss already releases these objects; restored contexts reject their stale handles.
 if(!S.lost){
  for(const batch of [m,D.paint,D.signDecor])if(batch){gl.deleteBuffer(batch.vb);gl.deleteBuffer(batch.ib);gl.deleteVertexArray(batch.vao);}
  if(D.atlas)gl.deleteTexture(D.atlas.texture);if(D.program)gl.deleteProgram(D.program.p);
 }
 if(S.detail781ShadowMeshes)S.detail781ShadowMeshes=S.detail781ShadowMeshes.filter(x=>x!==m);
 S.trackDetail781=null;S.detail781Enabled=false;if(S.sunShadow)S.sunShadow.source=null;
};
G.trackDetailReport781=function(S){S=S||G.S;return S&&S.trackDetail781?Object.assign({enabled:!!S.detail781Enabled},S.trackDetail781.stats):{enabled:false,source:SOURCE};};
})();
