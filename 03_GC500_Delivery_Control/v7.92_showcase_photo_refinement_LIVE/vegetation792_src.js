
/* Author: Andrew Fisher. v7.92 photograph-informed full-circuit foliage at unchanged source positions.
 * The source near/mid bands measure distance to the complete closed track.
 * Stable per-sector budgets upgrade the whole lap without a grid-centred bubble.
 * Tree anchors, source dimensions, placement RNG and existing palms remain fixed.
 * A minority of non-palm crowns receive generic tiered coastal silhouettes;
 * this does not identify a photographed tree species or assert a new planting location.
 */
(function(){
'use strict';
const G=window.GC3D;if(!G||G.installVegetation781)return;
const TAU=Math.PI*2;
const hash=(x,z,s)=>{const a=Math.sin(x*12.9898+z*78.233+s*37.719)*43758.5453;return a-Math.floor(a);};
const norm=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);};
const SOURCE='Existing accepted tree positions and dimensions; photo-informed broadleaf, palm and tiered coastal crown treatments; no species identification or new planting';

G.disposeVegetation781=function(S){
 const D=S&&S.vegetation781;if(!D)return;
 /* The old objects and their CPU arrays have never been mutated or uploaded. */
 if(S.dayTrees===D.mesh)S.dayTrees=D.originalDayTrees;
 if(S.trees===D.mesh)S.trees=D.originalTrees;
 if(!S.lost){S.gl.deleteBuffer(D.mesh.vb);S.gl.deleteBuffer(D.mesh.ib);S.gl.deleteVertexArray(D.mesh.vao);}
 S.vegetation781=null;if(S.sunShadow)S.sunShadow.source=null;S.needsRender=true;
};

  // Exact point-to-segment distance over the entire closed circuit, not the grid.
  // Sector indices are equal-distance reporting bins; they are not invented event sectors.
  const circuitQuery = S => {
    if(S.facadeTrackQuery788&&S.facadeTrackQuery788.CL===S.CL)return S.facadeTrackQuery788;
    const P=S.CL.p,segments=[],N=S.CL.n||P.length;let length=0;
    for(let i=0;i<N;i++){
      const a=P[i],b=P[(i+1)%N],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);
      if(l>1e-9){segments.push({x:a[0],z:a[1],dx,dz,l,l2:l*l,s:length});length+=l;}
    }
    const nearest=(x,z)=>{
      let d2=Infinity,px=0,pz=0,along=0;
      for(const e of segments){
        const t=Math.max(0,Math.min(1,((x-e.x)*e.dx+(z-e.z)*e.dz)/e.l2)),qx=e.x+e.dx*t,qz=e.z+e.dz*t;
        const d=(x-qx)**2+(z-qz)**2;
        if(d<d2){d2=d;px=qx;pz=qz;along=e.s+t*e.l;}
      }
      const rel=((along-(S.gridS||0))%length+length)%length;
      return {d:Math.sqrt(d2),x:px,z:pz,s:along,sector:Math.min(11,Math.floor(rel/length*12))};
    };
    return S.facadeTrackQuery788={CL:S.CL,nearest,length};
  };


G.installVegetation781=function(S){
 if(!S||!S.gl||!S.CL||!S.dayTrees||!S.vegetation781Source)return null;
 if(S.vegetation781)return S.vegetation781.stats;
 const originalDayTrees=S.dayTrees,originalTrees=S.trees,rows=S.vegetation781Source,
 route=circuitQuery(S),nearest=route.nearest,ADDED_BUDGET=80000,
 mesh=new G.MeshBatch(S.gl,[3,4,2],false),stats={
 trees:rows.length,sourceTrees:rows.length,palms:0,broadleaf:0,detailedTrees:0,refinedTrees:0,distantTrees:0,
 crownLobes:0,leafSprays:0,palmFronds:0,palmLeaflets:0,coniferProfiles:0,coniferTiers:0,coniferBranches:0,
 originalTriangles:originalDayTrees.ni/3,triangles:0,vertices:0,addedTriangles:0,
 drawCalls:1,additionalDrawCalls:0,gpuBytes:0,sourcePositionsUnchanged:true,relocatedTrees:0,
 refinementRadiusWorld:null,fullCircuitSelection:true,gridRadiusRestriction:false,
 addedTriangleBudget:ADDED_BUDGET,premiumTrees:0,normalShadedTrees:0,sourceDimensionsUnchanged:true,
 sourceRangesUnchanged:true,sourceCrownCentresUnchanged:false,sourceRowsUnchanged:true,
 sourceAnchorsUnchanged:true,existingPalmsPreserved:true,coniferPlacementIsIllustrative:true,
 sectors:Array.from({length:12},(_,i)=>({sector:i+1,sourceTrees:0,eligibleTrees:0,refinedTrees:0,premiumTrees:0,triangles:0,addedTriangles:0})),
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
 const broadleaf=(q,premium)=>{
  const {x,z,r,h,y0,lean,tint,phase,near,mid}=q,NC=mid?4:3,NL=premium&&near?10:8,NB=premium&&near?5:4;
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
   const sprays=near?10:mid?6:0,leaves=premium?3:2;
   for(let j=0;j<sprays;j++){
    const ct=1-2*(j+.5)/sprays,phi=j*2.399963+phase+c*.81,f=surface(ct,phi),n=f.n,
    center=f.p.map((a,i)=>a+n[i]*r*.022),tangent=[-f.sp,0,f.cp],
    across=norm([n[1]*f.cp,-(n[2]*f.sp+n[0]*f.cp),n[1]*f.sp]),
    size=r*(.061+.041*hash(x,z,91+c*23+j)),variation=.88+.22*hash(x,z,j+c*40+200),
    col=colour.map(a=>a*variation);
    for(let leaf=0;leaf<leaves;leaf++){
     const angle=leaf*TAU/leaves+.29,cs=Math.cos(angle),sn=Math.sin(angle),
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
 const conifer=(q,premium)=>{
  const {x,z,r,h,y0,lean,tint,phase,near}=q,tiers=near?7:5,branches=near?8:7;
  stats.coniferProfiles++;
  for(let tier=0;tier<tiers;tier++){
   const u=tier/(tiers-1),y=y0+h*(.43+.66*u),radius=r*(.78*Math.pow(1-u,.72)+.11),
    trunk=[x+lean*(.45+.55*u),y,z],tone=(.85+.20*hash(x,z,740+tier))*tint,
    colour=[.027*tone,.064*tone,.041*tone];
   for(let branch=0;branch<branches;branch++){
    const angle=phase+branch*TAU/branches+tier*.39,cs=Math.cos(angle),sn=Math.sin(angle),
     reach=radius*(.84+.16*hash(x,z,760+tier*branches+branch)),width=reach*.22,
     base=[trunk[0]+cs*reach*.10,y-h*.026,trunk[2]+sn*reach*.10],
     tip=[trunk[0]+cs*reach,y+h*(.025+.024*u),trunk[2]+sn*reach],
     ridge=[trunk[0]+cs*reach*.57,y+h*.048,trunk[2]+sn*reach*.57],
     left=[ridge[0]-sn*width,y,ridge[2]+cs*width],right=[ridge[0]+sn*width,y,ridge[2]-cs*width],
     n=norm([-cs*.22,1,-sn*.22]);
    // Two folded sprays form an open branch layer, not a solid cone or leaf ball.
    leafQuad([base,left,ridge,tip],n,colour,[.67,.90,1.04,.88]);
    leafQuad([base,tip,ridge,right],n,colour,[.67,.88,1.04,.90]);
    if(premium){
     const c=[trunk[0]+cs*reach*.73,y+h*.012,trunk[2]+sn*reach*.73],w=width*.54;
     leafQuad([[c[0]-cs*w,c[1],c[2]-sn*w],[c[0]-sn*w,c[1]+h*.024,c[2]+cs*w],
      [c[0]+cs*w,c[1]+h*.01,c[2]+sn*w],[c[0]+sn*w,c[1]-h*.008,c[2]-cs*w]],n,colour);
    }
    stats.coniferBranches++;
   }
   stats.coniferTiers++;
  }
 };
 const palm=(q,premium)=>{
  const {x,z,r,h,y0,lean,tint,phase,near,mid}=q,
  crown=[x+lean+r*.28*Math.cos(phase),y0+h*1.12,z+r*.28*Math.sin(phase)],
  NF=near?11:mid?9:8,NP=near?(premium?9:8):(premium?7:6),NS=near?(premium?6:5):4;
  for(let f=0;f<NF;f++){
   const ang=phase+f*TAU/NF+.11*Math.sin(f*2.3+phase),cs=Math.cos(ang),sn=Math.sin(ang),
   upright=f%4===0,length=r*(1.48+.40*hash(x,z,10+f))*(upright?.72:1),
   sag=(upright?.12:.25)+.17*hash(x,z,30+f),arch=upright?.60:.22+.12*hash(x,z,40+f),
   curve=u=>[crown[0]+cs*length*u,crown[1]+h*(arch*Math.sin(u*Math.PI)-sag*u*u),crown[2]+sn*length*u],
   frondNormal=u=>norm([-cs*h*(arch*Math.PI*Math.cos(u*Math.PI)-2*sag*u),length,-sn*h*(arch*Math.PI*Math.cos(u*Math.PI)-2*sag*u)]),
   frondTone=.84+.22*hash(x,z,140+f),col=[.036*tint*frondTone,.073*tint*frondTone,.026*tint*frondTone];
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
 // Allocate all extra triangles before geometry generation. A round-robin pass
 // over equal-distance lap bins prevents the dense park at the grid taking the budget.
 const plans=rows.map((q,index)=>({q,index,track:nearest(q.x,q.z),premium:false,
  conifer:!q.palm&&q.mid&&q.h/Math.max(q.r,.001)>1.65&&hash(q.x,q.z,731)<.32})),bins=Array.from({length:12},()=>[]);
 const triangleCount=(q,premium,coniferProfile=false)=>{
  if(coniferProfile)return (q.near?7:5)*(q.near?8:7)*(premium?6:4);
  if(q.palm){const NF=q.near?11:q.mid?9:8,NP=q.near?(premium?9:8):(premium?7:6),NS=q.near?(premium?6:5):4;return NF*(NS*2+NP*6);}
  const NC=q.mid?4:3,NL=premium&&q.near?10:8,NB=premium&&q.near?5:4,sprays=q.near?10:q.mid?6:0,leaves=premium?3:2;
  return NC*(2*NL*(NB-1)+sprays*leaves*2);
 };
 let projectedAdded=0;
 for(const p of plans){
  const sector=stats.sectors[p.track.sector];sector.sourceTrees++;
  if(!p.q.mid)continue;
  sector.eligibleTrees++;bins[p.track.sector].push(p);
  const original=(p.q.i1-p.q.i0)/3;
  projectedAdded+=triangleCount(p.q,false,p.conifer)-original;
 }
 for(const bin of bins)bin.sort((a,b)=>a.track.d-b.track.d||a.index-b.index);
 const maxRows=Math.max(0,...bins.map(b=>b.length));
 for(let i=0;i<maxRows;i++)for(const bin of bins){
  const p=bin[i];if(!p)continue;
  const extra=triangleCount(p.q,true,p.conifer)-triangleCount(p.q,false,p.conifer);
  if(projectedAdded+extra<=ADDED_BUDGET){p.premium=true;projectedAdded+=extra;}
 }
 stats.projectedAddedTriangles=projectedAdded;
 try{
  for(const p of plans){
   const q=p.q,sector=stats.sectors[p.track.sector],startTriangles=mesh.i.length/3;
   if(q.palm)stats.palms++;else stats.broadleaf++;
   if(q.mid){
    stats.detailedTrees++;stats.refinedTrees++;stats.normalShadedTrees++;sector.refinedTrees++;
    if(p.premium){stats.premiumTrees++;sector.premiumTrees++;}
    if(q.palm)palm(q,p.premium);else if(p.conifer)conifer(q,p.premium);else broadleaf(q,p.premium);
   }else{
    /* Beyond the source near/mid bands, retain every original triangle and position.
       Colour compensation is identical to the previous approved foliage material. */
    const offset=mesh.nv-q.v0,v=originalDayTrees.v;
    for(let i=q.v0;i<q.v1;i++){
     const k=i*9;put([v[k],v[k+1],v[k+2]],[0,1,0],[v[k+3]*.78,v[k+4]*.68,v[k+5]*.94]);
    }
    for(let i=q.i0;i<q.i1;i+=3)mesh.tri(originalDayTrees.i[i]+offset,originalDayTrees.i[i+1]+offset,originalDayTrees.i[i+2]+offset);
    stats.distantTrees++;
   }
   const triangles=mesh.i.length/3-startTriangles;sector.triangles+=triangles;sector.addedTriangles+=triangles-(q.i1-q.i0)/3;
  }
  mesh.upload();stats.triangles=mesh.ni/3;stats.vertices=mesh.nv;
  stats.addedTriangles=stats.triangles-stats.originalTriangles;
  if(stats.addedTriangles>ADDED_BUDGET||stats.addedTriangles!==projectedAdded)throw new Error('Full-lap foliage exceeded its deterministic geometry budget');
  stats.coverageSectors=stats.sectors.filter(s=>s.refinedTrees>0).length;
  stats.eligibleSectors=stats.sectors.filter(s=>s.eligibleTrees>0).length;
  stats.fullEligibleCoverage=stats.refinedTrees===rows.filter(q=>q.mid).length;
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
