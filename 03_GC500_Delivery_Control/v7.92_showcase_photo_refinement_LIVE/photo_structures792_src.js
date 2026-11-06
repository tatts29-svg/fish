/* Author: Andrew Fisher.
 * Photo-informed detail on the EXISTING nominal pit-building shells.
 * References 20701/20702 show pale roof edges, open steel framing and upper rails.
 * These additions are illustrative facade relief, not a surveyed reconstruction.
 * No lane, shell, footprint, roof height, stand, bridge or gantry is relocated.
 */
(function(){
'use strict';
const G=window.GC3D;
if(!G||G.addPhotoStructures792)return;
const BUDGET=9600;
const PALE=[.65,.68,.67,.83],STEEL=[.32,.38,.40,.52],SHADE=[.037,.052,.059,.91],
      UPPER=[.075,.105,.117,.70],SILL=[.24,.28,.30,.82];
G.addPhotoStructures792=function(S,D){
 if(!S||!D||!D.mesh||!D.stats)return null;
 if(D.stats.photoStructures)return D.stats.photoStructures;
 const mesh=D.mesh,M=G.M_PER_PT||6,uv=D.atlas&&D.atlas.white||[.5,.5],start=mesh.i.length,
       source=S.architecture781Source||[],lanes=S.pitPts||[];
 const stats=D.stats.photoStructures={author:'Andrew Fisher',reference:'20701.jpg and 20702.jpg: visual construction detail only',
  source:'Existing pit:true shells beside registered pit-lane ways 179722656 and 501847689',
  placement:'Original source shell edges; lane-facing edge selected against unchanged S.pitPts',
  limits:'Pit buildings remain nominal. Facade relief is illustrative, not surveyed construction or new access guidance.',
  sourcePitModules:source.filter(b=>b&&b.pit).length,modules:0,invalidSourceModules:0,
  missingLaneAnchors:0,duplicateModules:0,omittedModules:0,lowerBays:0,upperRails:0,steelUprights:0,
  braces:0,roofEdges:0,floorBands:0,triangles:0,triangleBudget:BUDGET,
  newDrawCalls:0,newGPUResources:0,perFrameWork:0,sourceFootprintsUnchanged:true,
  sourceRoofHeightsUnchanged:true,pitLaneUnchanged:true,bridgesAdded:0,gantriesAdded:0,standsMoved:0,
  maxFacadeReliefM:.16,anchors:[]};
 const finitePoint=p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1]);
 const nearestLane=p=>{
  let best=null;
  for(const lane of lanes)for(let i=0;i+1<lane.length;i++){
   const a=lane[i],b=lane[i+1];if(!finitePoint(a)||!finitePoint(b))continue;
   const dx=b[0]-a[0],dz=b[1]-a[1],l2=dx*dx+dz*dz;if(l2<1e-12)continue;
   const u=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/l2)),q=[a[0]+dx*u,a[1]+dz*u],
         distance=Math.hypot(q[0]-p[0],q[1]-p[1]);
   if(!best||distance<best.distance)best={q,distance};
  }
  return best;
 };
 const candidates=[],seen=new Set();
 source.forEach((b,sourceIndex)=>{
  if(!b||!b.pit)return;
  if(!Array.isArray(b.p)||!b.p.every(finitePoint)||!Number.isFinite(b.h)||typeof S.toWorld!=='function'){
   stats.invalidSourceModules++;return;
  }
  const P=b.p.map(p=>{const q=S.toWorld(p);return finitePoint(q)?q.slice(0,2):null;});
  if(!P.every(finitePoint)){stats.invalidSourceModules++;return;}
  if(P.length>2&&Math.hypot(P[0][0]-P[P.length-1][0],P[0][1]-P[P.length-1][1])<1e-8)P.pop();
  const bottom=Math.max(Number.isFinite(b.y0)?b.y0:0,(S.tune&&S.tune.deckH)||0),top=b.h;
  if(P.length!==4||!P.every(finitePoint)||(top-bottom)*M<3.5){stats.invalidSourceModules++;return;}
  const area=P.reduce((sum,p,i)=>sum+p[0]*P[(i+1)%4][1]-p[1]*P[(i+1)%4][0],0),sign=area>0?1:-1;
  if(Math.abs(area)<1e-8||P.some((a,i)=>{
   const b=P[(i+1)%4],c=P[(i+2)%4];return ((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]))*sign<=1e-10;
  })){stats.invalidSourceModules++;return;}
  const key=P.map(p=>p.map(v=>v.toFixed(6)).join(',')).sort().join(';')+'|'+bottom+'|'+top;
  if(seen.has(key)){stats.duplicateModules++;return;}seen.add(key);
  let front=null;
  const edges=P.map((a,i)=>{
   const b=P[(i+1)%4],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),
         t=[dx/length,dz/length],n=[t[1]*sign,-t[0]*sign],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2],near=nearestLane(mid),
         e={a,t,n,length,index:i};
   if(near&&length*M>=2.5&&near.distance*M<30&&((near.q[0]-mid[0])*n[0]+(near.q[1]-mid[1])*n[1])>0){
    if(!front||near.distance<front.laneDistance)front={...e,laneDistance:near.distance};
   }
   return e;
  });
  if(!front){stats.missingLaneAnchors++;return;}
  candidates.push({b,sourceIndex,P,edges,front,bottom,top});
 });
 const perModule=candidates.length?Math.floor(BUDGET/candidates.length/2)*2:0;
 let moduleStart=start;
 const can=n=>(mesh.i.length-start)/3+n<=BUDGET&&(mesh.i.length-moduleStart)/3+n<=perModule;
 const face=(points,colour,outward)=>{
  if(!can(2))return false;
  let a=points[0],b=points[1],c=points[2],x=b.map((v,i)=>v-a[i]),y=c.map((v,i)=>v-a[i]),
      n=[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]],length=Math.hypot(...n);
  if(length<1e-12)return false;
  if(outward&&n.reduce((sum,v,i)=>sum+v*outward[i],0)<0){points=points.slice().reverse();n=n.map(v=>-v);}
  n=n.map(v=>v/length);const index=mesh.nv;
  for(const p of points)mesh.vert(...p,...n,...uv,...colour);
  mesh.tri(index,index+1,index+2);mesh.tri(index,index+2,index+3);return true;
 };
 const at=(edge,u,y,d)=>[edge.a[0]+edge.t[0]*u+edge.n[0]*d,y,edge.a[1]+edge.t[1]*u+edge.n[1]*d];
 const panel=(edge,u0,u1,y0,y1,d,colour)=>u1>u0&&y1>y0&&face([
  at(edge,u0,y0,d),at(edge,u1,y0,d),at(edge,u1,y1,d),at(edge,u0,y1,d)],colour,[edge.n[0],0,edge.n[1]]);
 const solid=(edge,u0,u1,y0,y1,d0,d1,colour)=>{
  if(!can(12)||u1<=u0||y1<=y0||d1<=d0)return false;
  const p=[at(edge,u0,y0,d0),at(edge,u1,y0,d0),at(edge,u1,y1,d0),at(edge,u0,y1,d0),
           at(edge,u0,y0,d1),at(edge,u1,y0,d1),at(edge,u1,y1,d1),at(edge,u0,y1,d1)],
        centre=at(edge,(u0+u1)/2,(y0+y1)/2,(d0+d1)/2);
  for(const indices of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[0,3,7,4],[1,5,6,2]]){
   const q=indices.map(i=>p[i]),out=q[0].map((v,i)=>q.reduce((sum,a)=>sum+a[i],0)/4-centre[i]);face(q,colour,out);
  }
  return true;
 };
 // A rectangular strip with thickness models a brace; no line-width shimmer.
 const brace=(edge,u0,u1,y0,y1,d,colour)=>{
  if(!can(12))return false;
  const du=u1-u0,dy=y1-y0,length=Math.hypot(du,dy);if(length<1e-9)return false;
  const r=.032/M,uu=-dy/length*r,yy=du/length*r,
        q=[[u0+uu,y0+yy],[u1+uu,y1+yy],[u1-uu,y1-yy],[u0-uu,y0-yy]],
        p=q.map(([u,y])=>at(edge,u,y,d)).concat(q.map(([u,y])=>at(edge,u,y,d+.048/M))),
        centre=at(edge,(u0+u1)/2,(y0+y1)/2,d+.024/M);
  for(const indices of [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]]){
   const points=indices.map(i=>p[i]),out=points[0].map((v,i)=>points.reduce((sum,a)=>sum+a[i],0)/4-centre[i]);face(points,colour,out);
  }
  return true;
 };
 for(const row of candidates){
  moduleStart=mesh.i.length;
  const e=row.front,margin=Math.min(.14/M,e.length*.04),lo=margin,hi=e.length-margin,
        ground=row.bottom+.06/M,top=row.top,floor=ground+(top-ground)*.49,rail=Math.min(top-.38/M,floor+1.05/M),
        post=.065/M,bays=Math.max(2,Math.min(4,Math.round(e.length*M/5.8))),bay=(hi-lo)/bays;
  // Dark shallow panels describe depth without cutting openings in the source shell.
  panel(e,lo,hi,ground,floor-.13/M,.009/M,SHADE);
  panel(e,lo,hi,floor+.08/M,top-.25/M,.009/M,UPPER);
  if(solid(e,lo,hi,top-.22/M,top,.014/M,.16/M,PALE))stats.roofEdges++;
  if(solid(e,lo,hi,floor-.14/M,floor+.04/M,.015/M,.14/M,PALE))stats.floorBands++;
  for(const u of [lo,hi])if(solid(e,u-post/2,u+post/2,ground,top-.22/M,.02/M,.14/M,STEEL))stats.steelUprights++;
  for(const y of [floor+.53/M,rail])if(solid(e,lo,hi,y-.023/M,y+.023/M,.09/M,.135/M,STEEL))stats.upperRails++;
  // Pale roof returns use exactly the existing shell edges and top height.
  for(const edge of row.edges)if(edge.index!==e.index){
   const inset=Math.min(.14/M,edge.length*.04);
   if(solid(edge,inset,edge.length-inset,top-.20/M,top,.012/M,.09/M,PALE))stats.roofEdges++;
  }
  for(let j=0;j<bays;j++){
   const a=lo+j*bay,b=lo+(j+1)*bay;
   if(panel(e,a+.10/M,b-.10/M,ground+.09/M,floor-.28/M,.012/M,j%2?SHADE:[.052,.071,.078,.87]))stats.lowerBays++;
   if(j&&solid(e,a-post/2,a+post/2,ground,top-.22/M,.018/M,.14/M,STEEL))stats.steelUprights++;
   const middle=(a+b)/2;
   if(solid(e,middle-.018/M,middle+.018/M,floor+.03/M,rail,.097/M,.135/M,STEEL))stats.upperRails++;
  }
  for(const j of [0,bays-1]){
   const a=lo+j*bay+.09/M,b=lo+(j+1)*bay-.09/M;
   if(brace(e,a,b,floor+.12/M,top-.29/M,.030/M,STEEL))stats.braces++;
  }
  if(solid(e,lo,hi,ground,ground+.085/M,.012/M,.10/M,SILL))stats.floorBands++;
  const triangles=(mesh.i.length-moduleStart)/3;
  if(triangles){
   stats.modules++;stats.anchors.push({sourceIndex:row.sourceIndex,frontageEdge:e.index,
    frontageLengthM:e.length*M,laneDistanceM:e.laneDistance*M,sourceTop:row.top,
    triangles,vertexStart:mesh.nv-triangles*2,vertexEnd:mesh.nv});
  }else stats.omittedModules++;
 }
 stats.triangles=(mesh.i.length-start)/3;
 stats.allValidModulesDetailed=stats.modules===candidates.length;
 stats.uniformModuleTriangleAllowance=perModule;
 return stats;
};
})();
