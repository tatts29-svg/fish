"""Author: Andrew Fisher. Opt-in foliage detail at the existing tree positions.

This patch records accepted tree parameters after the original placement/exclusion
logic. It never calls the placement RNG, edits the original mesh, or adds trees.
The preview allocates one replacement foliage mesh; disposal restores the original
mesh objects and releases the replacement's buffers. Trunks and night glow stay
on their established path. Apply after materials781.
"""


def apply(text, rep, path):
    if "G.installVegetation781" in text:
        raise SystemExit("v7.81 vegetation already applied")

    def r(old, new, label):
        nonlocal text
        text = rep(text, old, new, "v7.81 foliage " + label, path)

    r("let nTree=0,nPalm=0;",
      "let nTree=0,nPalm=0;const vegetationSource781=[];",
      "source collection")
    r("if(decorative&&shapeHash(x,z,2)<.24){",
      """/* Capture accepted source dimensions only. No placement RNG is consumed. */
 const vegetationTree781={x,z,r,h,y0,lean,tint,phase,near,mid,
 palm:decorative&&shapeHash(x,z,2)<.24,v0:dayTR.nv,i0:dayTR.i.length};
 if(decorative&&shapeHash(x,z,2)<.24){""",
      "accepted tree parameters")
    r("nTree++;\n };\n (pk.trees||[]).forEach",
      """vegetationTree781.v1=dayTR.nv;vegetationTree781.i1=dayTR.i.length;
 vegetationSource781.push(vegetationTree781);
 nTree++;
 };
 (pk.trees||[]).forEach""",
      "source mesh ranges")
    r("S.treeGeometry={trees:nTree,palms:nPalm,crownTriangles:dayTR.ni/3,trunkTriangles:trunks.ni/3,physicalInAllModes:true,spatialLOD:true};",
      """S.treeGeometry={trees:nTree,palms:nPalm,crownTriangles:dayTR.ni/3,trunkTriangles:trunks.ni/3,physicalInAllModes:true,spatialLOD:true};
 S.vegetation781Source=vegetationSource781;""",
      "source snapshot")

    # Existing UV fields hold an octahedral smooth normal in this one material.
    # The shader remains byte-identical on the original mode-0 branch when off.
    r("out vec4 vCol; out vec2 vUV; out float vW; out vec2 vP; out vec3 vWorld;",
      "out vec4 vCol; out vec2 vUV; out float vW; out vec2 vP; out vec3 vWorld; out vec3 vLeafNormal781;",
      "normal vertex varying")
    r("vCol=aCol;vUV=aUV;vW=p.w;vP=q.xz;vWorld=q;}`;",
      """vCol=aCol;vUV=aUV;vW=p.w;vP=q.xz;vWorld=q;
 vLeafNormal781=vec3(0.,1.,0.);
 if(uMode>14.5&&uMode<15.5){
  vec3 N=vec3(aUV.x,1.-abs(aUV.x)-abs(aUV.y),aUV.y);
  if(N.y<0.)N.xz=(1.-abs(N.zx))*mix(vec2(-1.),vec2(1.),step(vec2(0.),N.xz));
  vLeafNormal781=normalize(N);
 }
}`;""",
      "decode before normal interpolation")
    r("in vec4 vCol; in vec2 vUV; in float vW; in vec2 vP; in vec3 vWorld;",
      "in vec4 vCol; in vec2 vUV; in float vW; in vec2 vP; in vec3 vWorld; in vec3 vLeafNormal781;",
      "normal fragment varying")
    r("if(uMode>12.5&&uMode<14.5&&uDetail781>.5){",
      """if(uMode>14.5&&uMode<15.5&&uDetail781>.5){
 vec3 N=normalize(vLeafNormal781);
 /* Folded sprays and palm leaflets are thin: retain the lit back surface. */
 vec3 view=normalize(uEye-vWorld);
 if(dot(N,view)<0.)N=-N;
 vec3 sun=previewSun781();float direct=max(dot(N,sun),0.);
 float visibility=sunlight(vWorld,N);
 vec2 leafP=vec2(vWorld.x+vWorld.y*.67,vWorld.z-vWorld.y*.43)*42.;
 float leafNoise=(noise21(leafP)-.5)*surfaceDetail(leafP);
 float clumps=noise21(vec2(vWorld.x+vWorld.y*.37,vWorld.z-vWorld.y*.21)*9.);
 /* These are linear-light leaf values. The existing composite applies ACES and
    sRGB once; lifting their base colour here made the entire crown look lime. */
 vec3 foliage=base*(.68+clumps*.42+leafNoise*.22);
 foliage*=mix(vec3(.92,.98,1.06),vec3(1.04,1.,.92),clumps);
 vec3 fill=vec3(.20,.24,.285);
 vec3 key=vec3(.86,.84,.73)*direct*mix(.30,1.,visibility);
 float transmission=pow(max(dot(-N,sun),0.),2.)*.055*visibility;
 foliage*=fill+key+vec3(.64,.85,.47)*transmission;
 o=vec4(foliage*a,a);
 }else if(uMode>12.5&&uMode<14.5&&uDetail781>.5){""",
      "smooth leaf lighting")
    r("S.dayTreeTrunks.draw();S.dayTrees.draw();",
      """S.dayTreeTrunks.draw();
 if(S.vegetation781&&S.detail781Enabled&&L.day){flat(15,groundMat);S.dayTrees.draw();}
 else S.dayTrees.draw();""",
      "preview-only material binding")

    return text


_SOURCE = r"""
/* Author: Andrew Fisher. Detailed foliage, with the original placement retained. */
(function(){
'use strict';
const G=window.GC3D;if(!G||G.installVegetation781)return;
const TAU=Math.PI*2;
const hash=(x,z,s)=>{const a=Math.sin(x*12.9898+z*78.233+s*37.719)*43758.5453;return a-Math.floor(a);};
const norm=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);};
const SOURCE='Existing accepted tree positions and dimensions; foliage geometry only, no new planting';

G.disposeVegetation781=function(S){
 const D=S&&S.vegetation781;if(!D)return;
 /* The old objects and their CPU arrays have never been mutated or uploaded. */
 if(S.dayTrees===D.mesh)S.dayTrees=D.originalDayTrees;
 if(S.trees===D.mesh)S.trees=D.originalTrees;
 S.gl.deleteBuffer(D.mesh.vb);S.gl.deleteBuffer(D.mesh.ib);S.gl.deleteVertexArray(D.mesh.vao);
 S.vegetation781=null;if(S.sunShadow)S.sunShadow.source=null;S.needsRender=true;
};

G.installVegetation781=function(S){
 if(!S||!S.gl||!S.dayTrees||!S.vegetation781Source)return null;
 if(S.vegetation781)return S.vegetation781.stats;
 const originalDayTrees=S.dayTrees,originalTrees=S.trees,rows=S.vegetation781Source,
 focus=S.CL?S.CL.at(S.gridS||0):[0,0],refinementRadius=46,
 mesh=new G.MeshBatch(S.gl,[3,4,2],false),stats={
 trees:rows.length,sourceTrees:rows.length,palms:0,broadleaf:0,detailedTrees:0,refinedTrees:0,distantTrees:0,
 crownLobes:0,leafSprays:0,palmFronds:0,palmLeaflets:0,
 originalTriangles:originalDayTrees.ni/3,triangles:0,vertices:0,addedTriangles:0,
 drawCalls:1,additionalDrawCalls:0,gpuBytes:0,sourcePositionsUnchanged:true,relocatedTrees:0,
 refinementRadiusWorld:refinementRadius,
 placementRngCalls:0,source:SOURCE};
 const D={mesh,originalDayTrees,originalTrees,stats};
 /* UV encodes a unit normal, preserving the existing mesh/shadow layout. */
 const put=(p,n,col)=>{
  const l=Math.abs(n[0])+Math.abs(n[1])+Math.abs(n[2])||1;
  let u=n[0]/l,v=n[2]/l;
  if(n[1]<0){const a=u;u=(1-Math.abs(v))*(a>=0?1:-1);v=(1-Math.abs(a))*(v>=0?1:-1);}
  return mesh.vert(...p,...col,1,u,v);
 };
 const leafQuad=(points,n,col,shades=[.91,1.04,1.,.94])=>{
  const ids=points.map((p,i)=>put(p,n,col.map(c=>c*shades[i])));
  mesh.tri(ids[0],ids[1],ids[2]);mesh.tri(ids[0],ids[2],ids[3]);
 };
 const broadleaf=q=>{
  const {x,z,r,h,y0,lean,tint,phase,near,mid}=q,NC=mid?4:3,NL=near?14:12,NB=near?7:6;
  for(let c=0;c<NC;c++){
   const top=c===NC-1,ang=phase+c*TAU/(NC-1),spread=top?.13:.43,
   cc=[x+lean+Math.cos(ang)*r*spread,y0+h*(top?.91:.63)+h*.08*Math.sin(phase+c),z+Math.sin(ang)*r*spread],
   rx=r*(top?.55:.65)*(.88+.18*hash(x,z,80+c)),ry=h*(top?.23:.29),rz=rx*(.74+.25*hash(x,z,50+c)),
   warm=.93+.14*hash(x,z,70+c),species=hash(x,z,610),crownTone=.86+.22*hash(x,z,620+c),
   colour=[(.027+.012*species)*tint*warm*crownTone,(.080+.015*species)*tint*crownTone,
    (.031+.007*(1-species))*tint*crownTone/warm],base=mesh.nv;
   /* Same branch crown centres, radii, lean and lobe function as the base tree. */
   const surface=(ct,phi)=>{
    const st=Math.sqrt(Math.max(0,1-ct*ct)),cp=Math.cos(phi),sp=Math.sin(phi),
    lobe=1+st*(.18*Math.sin(3*phi+phase+c+ct*1.7)+.08*Math.cos(5*phi-phase+c)+.05*Math.sin(8*phi+ct*9+phase));
    return {p:[cc[0]+rx*st*cp*lobe,cc[1]+ry*ct+h*.025*st*st*Math.sin(3*phi+phase+c),cc[2]+rz*st*sp*lobe],
     n:norm([st*cp/rx,ct/ry,st*sp/rz]),st,cp,sp};
   };
   const vertex=(theta,phi)=>{
    const ct=Math.cos(theta),f=surface(ct,phi),
    shade=(.70+.30*(ct*.5+.5))*(.92+.080*Math.sin(phi*4+phase+c+ct*3)+.045*Math.cos(phi*7+ct*11+phase));
    return put(f.p,f.n,colour.map(a=>a*shade));
   };
   for(let j=1;j<NB;j++)for(let k=0;k<NL;k++)vertex(Math.PI*j/NB,TAU*k/NL);
   for(let j=0;j<NB-2;j++)for(let k=0;k<NL;k++){
    const a=base+j*NL+k,b=base+j*NL+(k+1)%NL,d=a+NL;mesh.tri(a,b,b+NL);mesh.tri(a,b+NL,d);
   }
   const topId=vertex(0,0),bottomId=vertex(Math.PI,0);
   for(let k=0;k<NL;k++){
    mesh.tri(topId,base+(k+1)%NL,base+k);
    mesh.tri(bottomId,base+(NB-2)*NL+k,base+(NB-2)*NL+(k+1)%NL);
   }
   stats.crownLobes++;
   /* Small folded leaf clusters soften the outline without expanding the canopy. */
   const sprays=near?18:10;
   for(let j=0;j<sprays;j++){
    const ct=1-2*(j+.5)/sprays,phi=j*2.399963+phase+c*.81,f=surface(ct,phi),n=f.n,
    center=f.p.map((a,i)=>a+n[i]*r*.022),tangent=[-f.sp,0,f.cp],
    across=norm([n[1]*f.cp,-(n[2]*f.sp+n[0]*f.cp),n[1]*f.sp]),
    size=r*(.061+.041*hash(x,z,91+c*23+j)),variation=.88+.22*hash(x,z,j+c*40+200),
    col=colour.map(a=>a*variation);
    for(let leaf=0;leaf<3;leaf++){
     const angle=leaf*TAU/3+.29,cs=Math.cos(angle),sn=Math.sin(angle),
     dir=tangent.map((a,i)=>a*cs+across[i]*sn),side=tangent.map((a,i)=>-a*sn+across[i]*cs),
     normal=norm(n.map((a,i)=>a+side[i]*.20)),points=[];
     for(const [along,cross,lift] of [[-.36,0,0],[.32,.31,.14],[1.22,0,.02],[.32,-.31,.14]])
      points.push(center.map((a,i)=>a+size*(dir[i]*along+side[i]*cross+n[i]*lift)));
     leafQuad(points,normal,col);
    }
    stats.leafSprays++;
   }
  }
 };
 const palm=q=>{
  const {x,z,r,h,y0,lean,tint,phase,near,mid}=q,
  crown=[x+lean+r*.28*Math.cos(phase),y0+h*1.12,z+r*.28*Math.sin(phase)],
  NF=near?11:mid?9:8,NP=near?14:10,NS=near?7:6;
  for(let f=0;f<NF;f++){
   const ang=phase+f*TAU/NF+.11*Math.sin(f*2.3+phase),cs=Math.cos(ang),sn=Math.sin(ang),
   upright=f%4===0,length=r*(1.48+.40*hash(x,z,10+f))*(upright?.72:1),
   sag=(upright?.12:.25)+.17*hash(x,z,30+f),arch=upright?.60:.22+.12*hash(x,z,40+f),
   curve=u=>[crown[0]+cs*length*u,crown[1]+h*(arch*Math.sin(u*Math.PI)-sag*u*u),crown[2]+sn*length*u],
   frondNormal=u=>norm([-cs*h*(arch*Math.PI*Math.cos(u*Math.PI)-2*sag*u),length,-sn*h*(arch*Math.PI*Math.cos(u*Math.PI)-2*sag*u)]),
   frondTone=.84+.22*hash(x,z,140+f),col=[.030*tint*frondTone,.079*tint*frondTone,.033*tint*frondTone];
   /* Retain every original frond's direction and sweep; fill its existing leaflets. */
   for(let j=0;j<NS;j++){
    const u=j/NS,v=(j+1)/NS,a=curve(u),b=curve(v),wa=r*.010*(1-u*.8),wb=r*.010*(1-v*.8);
    leafQuad([[a[0]-sn*wa,a[1],a[2]+cs*wa],[a[0]+sn*wa,a[1],a[2]-cs*wa],
      [b[0]+sn*wb,b[1],b[2]-cs*wb],[b[0]-sn*wb,b[1],b[2]+cs*wb]],frondNormal((u+v)/2),col);
   }
   for(let j=0;j<NP;j++)for(const side of [-1,1]){
    const u=.15+j*.76/NP+(side>0?.020:0),a=curve(u),
    span=r*(.36+.15*Math.sin(u*Math.PI))*Math.sin(Math.PI*(u*.83+.1)),
    end=[a[0]-sn*span*side+cs*length*.18,a[1]-h*(.07+.18*u),a[2]+cs*span*side+sn*length*.18],
    middle=[a[0]*.40+end[0]*.60,a[1]*.46+end[1]*.54+h*.035,a[2]*.40+end[2]*.60],
    wide=r*(.039+.014*Math.sin(u*Math.PI)),rootWidth=r*.006,n=frondNormal(u),
    rootLeft=[a[0]-cs*rootWidth,a[1],a[2]-sn*rootWidth],rootRight=[a[0]+cs*rootWidth,a[1],a[2]+sn*rootWidth],
    left=[middle[0]-cs*wide,middle[1],middle[2]-sn*wide],right=[middle[0]+cs*wide,middle[1]+h*.008,middle[2]+sn*wide];
    const ids=[put(rootLeft,n,col.map(v=>v*.88)),put(rootRight,n,col),
      put(left,n,col.map(v=>v*.91)),put(right,n,col.map(v=>v*1.06)),put(end,n,col.map(v=>v*.87))];
    mesh.tri(ids[0],ids[1],ids[3]);mesh.tri(ids[0],ids[3],ids[2]);mesh.tri(ids[2],ids[3],ids[4]);
    stats.palmLeaflets++;
   }
   stats.palmFronds++;
  }
 };
 try{
  for(const q of rows){
   if(q.palm)stats.palms++;else stats.broadleaf++;
   if(q.mid&&Math.hypot(q.x-focus[0],q.z-focus[1])<refinementRadius){
    stats.detailedTrees++;stats.refinedTrees++;if(q.palm)palm(q);else broadleaf(q);
   }
   else{
    /* Distant trees retain their exact source positions/triangulation and their
       baked colour variation. Restrain their old key under the shared daylight. */
    const offset=mesh.nv-q.v0,v=originalDayTrees.v;
    for(let i=q.v0;i<q.v1;i++){
     const k=i*9;put([v[k],v[k+1],v[k+2]],[0,1,0],[v[k+3]*.78,v[k+4]*.68,v[k+5]*.94]);
    }
    for(let i=q.i0;i<q.i1;i+=3)mesh.tri(originalDayTrees.i[i]+offset,originalDayTrees.i[i+1]+offset,originalDayTrees.i[i+2]+offset);
    stats.distantTrees++;
   }
  }
  mesh.upload();stats.triangles=mesh.ni/3;stats.vertices=mesh.nv;
  stats.addedTriangles=stats.triangles-stats.originalTriangles;
  stats.gpuBytes=mesh.v.length*4+mesh.i.length*4;
  S.vegetation781=D;S.dayTrees=mesh;S.trees=mesh;
  if(S.sunShadow)S.sunShadow.source=null;S.needsRender=true;
  return stats;
 }catch(error){
  S.gl.deleteBuffer(mesh.vb);S.gl.deleteBuffer(mesh.ib);S.gl.deleteVertexArray(mesh.vao);throw error;
 }
};
G.vegetationReport781=function(S){
 S=S||G.S;return S&&S.vegetation781?Object.assign({enabled:!!S.detail781Enabled},S.vegetation781.stats):{enabled:false,source:SOURCE};
};
})();
"""
