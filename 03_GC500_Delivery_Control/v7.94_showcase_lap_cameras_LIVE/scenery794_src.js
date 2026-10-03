/* Author: Andrew Fisher.
 * Existing pit shells and stand canopies, with visible structural depth.
 * Photographs 20701/20702 inform construction character, not surveyed geometry.
 * No track, barrier, lane, building, stand or landmark is moved. No new GPU resource.
 */
(function(){
'use strict';
const G=window.GC3D;if(!G||G.addScenery794||typeof G.addPhotoStructures792!=='function')return;
const sourcePitBuilder=G.addPhotoStructures792,PIT_BUDGET=14000,STAND_BUDGET=12000;
const PALE=[.74,.75,.70,.84],STEEL=[.43,.49,.50,.48],DARK=[.035,.051,.057,.94],
      RECESS=[.052,.079,.085,.89],SOFFIT=[.16,.19,.20,.88],TREAD=[.45,.49,.49,.82];
const finite=p=>Array.isArray(p)&&p.every(Number.isFinite),sub=(a,b)=>a.map((v,i)=>v-b[i]),
      plus=(a,b,k=1)=>a.map((v,i)=>v+b[i]*k),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),
      cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
      unit=a=>{const n=Math.hypot(...a);return n>1e-10?a.map(v=>v/n):null;};

// Read the built objects, not a second nominal placement calculation. These meshes
// have exactly 60 seating vertices and 16 decoration vertices per existing stand.
G.standFrames794=function(S){
 const seats=S&&S.standMesh,decor=S&&S.standDecor,names=S&&S.stands||[],frames=[];
 if(!seats||!decor||seats.stride!==9||decor.stride!==9||seats.v.length!==names.length*60*9)return frames;
 const point=(mesh,i)=>Array.from(mesh.v.slice(i*9,i*9+3));
 for(let i=0;i<names.length;i++){
  const a=point(seats,i*60),b=point(seats,i*60+1),d=point(seats,i*60+3),
        back=point(seats,i*60+56),ground=point(seats,i*60+58),
        roof=[0,1,2,3].map(j=>point(decor,i*16+j));
  if(![a,b,d,back,ground,...roof].every(p=>p.length===3&&finite(p)))continue;
  const length=Math.hypot(...sub(b,a)),depth=Math.hypot(...sub(d,a))*6,
        t=unit(sub(b,a)),n=unit(sub(d,a)),base=ground[1],height=back[1]-base,
        front=plus(a,sub(b,a),.5);front[1]=base;
  if(!t||!n||Math.abs(dot(t,n))>1e-6||Math.abs(t[1])+Math.abs(n[1])>1e-7||
     length<2||depth<.5||height<=0||roof.some(p=>p[1]<=back[1]))continue;
  // Validate all four canopy corners against the original source proportions.
  const expected=[[-.52,.12], [.52,.12], [.52,1.06], [-.52,1.06]];
  if(roof.some((p,j)=>Math.hypot(p[0]-front[0]-t[0]*expected[j][0]*length-n[0]*expected[j][1]*depth,
                              p[2]-front[2]-t[2]*expected[j][0]*length-n[2]*expected[j][1]*depth)>1e-6))continue;
  frames.push({index:i,name:names[i].name,front,t,n,length,depth,base,height,roof});
 }
 return frames;
};

G.addScenery794=function(S,D){
 if(!S||!D||!D.mesh||!D.stats)return null;
 if(D.stats.scenery794)return D.stats.photoStructures;
 const mesh=D.mesh,M=G.M_PER_PT||6,uv=D.atlas&&D.atlas.white||[.5,.5],start=mesh.i.length,
       count={nv:0,i:{length:0},vert(){return this.nv++;},tri(){this.i.length+=3;}},
       original=sourcePitBuilder(S,{mesh:count,atlas:D.atlas,stats:{}}),frames=G.standFrames794(S);
 const stats=D.stats.scenery794={author:'Andrew Fisher',version:'v7.94',
  scope:'Existing nominal pit shells and existing stand canopy frames; illustrative construction detail',
  sourceRowsUnchanged:true,sourceFootprintsUnchanged:true,sourceTopHeightsUnchanged:true,
  routeChanged:false,barriersMoved:0,lanesMoved:0,standsMoved:0,newLandmarkPlacements:0,
  newGPUResources:0,newDrawCalls:0,perFrameWork:0,triangleBudget:PIT_BUDGET+STAND_BUDGET,
  replacedPitTriangles:original?original.triangles:0,oldPitGeometryAppended:false,
  pitModules:0,pitFacades:0,pitOpenBayPanels:0,pitSteelPosts:0,pitDeckBands:0,pitRails:0,
  standsAvailable:(S.stands||[]).length,standFramesValidated:frames.length,standsDetailed:0,
  roofSupportColumns:0,roofTrussMembers:0,roofFascias:0,roofSoffits:0,stairRuns:0,stairTreads:0,
  stairRunsSkipped:0,pitTriangles:0,standTriangles:0,triangles:0,
  maximumPitReliefM:.16,stairsWithinExistingCanopyEnvelope:true,canopyTopChanged:false,
  pitAnchors:[],standAnchors:[],foliageChanged:false};
 const pit=D.stats.photoStructures={...original,reference:'20701.jpg / 20702.jpg',
  limits:'Original nominal shell envelopes; dark recessed-bay representation, not transparent or surveyed reconstruction',
  triangles:0,triangleBudget:PIT_BUDGET,modules:0,anchors:[],newDrawCalls:0,newGPUResources:0,
  replacementVersion:'v7.94',replacementAvoidsDuplicateGeometry:true};
 let sectionStart=start,sectionBudget=PIT_BUDGET,itemStart=start,itemBudget=PIT_BUDGET;
 const can=n=>(mesh.i.length-sectionStart)/3+n<=sectionBudget&&(mesh.i.length-itemStart)/3+n<=itemBudget;
 const face=(points,colour,normal)=>{
  if(!can(2)||points.length!==4||!points.every(finite))return false;
  let norm=unit(cross(sub(points[1],points[0]),sub(points[2],points[0])));if(!norm)return false;
  if(normal&&dot(norm,normal)<0){points=points.slice().reverse();norm=norm.map(v=>-v);}
  const first=mesh.nv;points.forEach(p=>mesh.vert(...p,...norm,...uv,...colour));
  mesh.tri(first,first+1,first+2);mesh.tri(first,first+2,first+3);return true;
 };
 const solid=(points,colour)=>{
  if(!can(12)||points.length!==8||!points.every(finite))return false;
  const c=[0,1,2].map(k=>points.reduce((s,p)=>s+p[k],0)/8);
  for(const ids of [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]]){
   const q=ids.map(i=>points[i]),mid=[0,1,2].map(k=>q.reduce((s,p)=>s+p[k],0)/4);
   face(q,colour,sub(mid,c));
  }return true;
 };
 const beam=(a,b,width,colour)=>{
  if(!can(12))return false;const axis=unit(sub(b,a));if(!axis)return false;
  const x=unit(cross(axis,Math.abs(axis[1])>.85?[1,0,0]:[0,1,0]));if(!x)return false;
  const y=cross(axis,x),r=width/2,ring=p=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>plus(plus(p,x,u*r),y,v*r));
  return solid(ring(a).concat(ring(b)),colour);
 };

 const anchors=original&&original.anchors||[],source=S.architecture781Source||[];
 itemBudget=anchors.length?Math.floor(PIT_BUDGET/anchors.length/2)*2:PIT_BUDGET;
 // Open structures commit atomically; retain the original relief if validation fails.
 const openPit794=G.addOpenPit794&&G.addOpenPit794(S,D,anchors);
 for(const anchor of (openPit794?[]:anchors)){
  const b=source[anchor.sourceIndex];if(!b)continue;
  const P=b.p.map(S.toWorld);if(P.length>4)P.pop();if(P.length!==4||!P.every(finite))continue;
  const begin=mesh.nv;itemStart=mesh.i.length;
  const area=P.reduce((sum,p,i)=>sum+p[0]*P[(i+1)%4][1]-p[1]*P[(i+1)%4][0],0),sgn=area>0?1:-1,
        lo=Math.max(b.y0||0,S.tune&&S.tune.deckH||0)+.04/M,top=b.h,middle=lo+(top-lo)*.49;
  for(let edge=0;edge<4;edge++){
   const a=P[edge],q=P[(edge+1)%4],len=Math.hypot(q[0]-a[0],q[1]-a[1]),
         t=[(q[0]-a[0])/len,0,(q[1]-a[1])/len],n=[t[2]*sgn,0,-t[0]*sgn],margin=.13/M,
         at=(u,y,d)=>[a[0]+t[0]*u+n[0]*d,y,a[1]+t[2]*u+n[2]*d],
         panel=(u0,u1,y0,y1,d,c)=>face([at(u0,y0,d),at(u1,y0,d),at(u1,y1,d),at(u0,y1,d)],c,n),
         strip=(u0,u1,y0,y1,d0,d1,c)=>solid([
          at(u0,y0,d0),at(u1,y0,d0),at(u1,y1,d0),at(u0,y1,d0),
          at(u0,y0,d1),at(u1,y0,d1),at(u1,y1,d1),at(u0,y1,d1)],c);
   if(len<=margin*3)continue;
   const end=len-margin,bays=Math.max(2,Math.min(4,Math.round(len*M/6))),width=(end-margin)/bays;
   // Every exposed source face gets the same dark open upper level. Previously
   // only the lane-facing face was dressed, leaving reverse views a plain grey box.
   if(panel(margin,end,lo,top-.16/M,.010/M,DARK))stats.pitFacades++;
   for(let j=0;j<bays;j++){
    const u0=margin+j*width+.08/M,u1=margin+(j+1)*width-.08/M;
    if(panel(u0,u1,lo+.08/M,middle-.17/M,.020/M,j%2?RECESS:DARK))stats.pitOpenBayPanels++;
    if(panel(u0,u1,middle+.10/M,top-.25/M,.020/M,j%2?DARK:RECESS))stats.pitOpenBayPanels++;
   }
   for(const [y0,y1]of [[middle-.15/M,middle+.04/M],[top-.19/M,top]])
    if(strip(margin,end,y0,y1,.027/M,.155/M,PALE))stats.pitDeckBands++;
   // Simple square steel profiles are stable at distance and connect to both decks.
   for(let j=0;j<=bays;j++){
    const u=margin+j*width,half=.055/M;
    if(strip(Math.max(margin,u-half),Math.min(end,u+half),lo,top-.19/M,.035/M,.15/M,STEEL))stats.pitSteelPosts++;
   }
   for(const y of [middle+.52/M,middle+1.04/M])
    if(strip(margin,end,y-.026/M,y+.026/M,.10/M,.15/M,STEEL))stats.pitRails++;
  }
  const triangles=(mesh.i.length-itemStart)/3;
  if(triangles){stats.pitModules++;pit.modules++;const record={...anchor,triangles,vertexStart:begin,vertexEnd:mesh.nv};pit.anchors.push(record);stats.pitAnchors.push(record);}
 }
 stats.pitTriangles=(mesh.i.length-sectionStart)/3;pit.triangles=stats.pitTriangles;
 pit.allValidModulesDetailed=pit.modules===anchors.length;pit.uniformModuleTriangleAllowance=itemBudget;

 sectionStart=mesh.i.length;sectionBudget=STAND_BUDGET;
 itemBudget=frames.length?Math.floor(STAND_BUDGET/frames.length/2)*2:STAND_BUDGET;
 for(const f of frames){
  itemStart=mesh.i.length;const begin=mesh.nv,
        point=(u,v,y)=>plus(plus([f.front[0],y,f.front[2]],f.t,u*f.length),f.n,v*f.depth),
        roofY=v=>f.roof[0][1]+(f.roof[3][1]-f.roof[0][1])*(v-.12)/.94,
        r=f.roof,under=r.map(p=>[p[0],p[1]-.15/M,p[2]]);
  // Only the underside and vertical fascia are added. The existing top remains
  // the sole roof surface, avoiding an overlapping coplanar roof.
  if(face(under,SOFFIT,[0,-1,0]))stats.roofSoffits++;
  for(let j=0;j<4;j++)if(face([r[j],r[(j+1)%4],under[(j+1)%4],under[j]],PALE))stats.roofFascias++;
  for(const u of [-.48,.48])for(const v of [.18,1]){
   const a=point(u,v,f.base+.025/M),b=point(u,v,roofY(v)-.15/M);
   if(beam(a,b,.18/M,STEEL))stats.roofSupportColumns++;
  }
  for(const v of [.18,1]){
   const upper=roofY(v)-.15/M,lower=upper-.52/M;
   for(const y of [upper,lower])if(beam(point(-.48,v,y),point(.48,v,y),.11/M,STEEL))stats.roofTrussMembers++;
   for(let j=0;j<6;j++)if(beam(point(-.48+j*.16,v,j%2?upper:lower),point(-.48+(j+1)*.16,v,j%2?lower:upper),.075/M,STEEL))stats.roofTrussMembers++;
  }
  for(const u of [-.48,0,.48])if(beam(point(u,.18,roofY(.18)-.15/M),point(u,1,roofY(1)-.15/M),.105/M,STEEL))stats.roofTrussMembers++;

  // The roof already overhangs the seating ends by .02 * its source length.
  // Fit a stair strip beneath that existing overhang, outside seated spectators.
  const stairWidth=Math.min(.68/M,f.length*.016),edgeInset=.04/M;
  let stairSide=null;
  for(const side of [-1,1]){
   const centre=side*(.5*f.length+stairWidth/2+edgeInset),u=centre/f.length;
   let clear=true;
   for(const v of [0,.25,.5,.75,1]){
    const p=point(u,v,f.base);
    if((G.behindBarrier&&!G.behindBarrier(S,p[0],p[2]))||(S.heightAt&&S.heightAt(p[0],p[2])>f.base+.10))clear=false;
    for(const lane of S.pitPts||[])for(let j=0;j+1<lane.length;j++){
     const a=lane[j],b=lane[j+1],dx=b[0]-a[0],dz=b[1]-a[1],l=dx*dx+dz*dz,t=l?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[2]-a[1])*dz)/l)):0;
     if(Math.hypot(p[0]-a[0]-t*dx,p[2]-a[1]-t*dz)<.92)clear=false;
    }
   }
   if(clear&&Math.abs(centre)+stairWidth/2<=.52*f.length){stairSide=side;break;}
  }
  let stepCount=0;
  if(stairSide!==null){
   const u0=stairSide===-1?-.5-(edgeInset+stairWidth)/f.length:.5+edgeInset/f.length,u1=u0+stairWidth/f.length,
         steps=Math.ceil(f.height*M/.195),riser=f.height/steps,rail=.92/M;
   // Reserve the complete run, including connected handrails, before adding it.
   if(can(steps*4+48)){
    for(let j=0;j<steps;j++){
     const v0=j/steps,v1=(j+1)/steps,y0=f.base+j*riser,y1=f.base+(j+1)*riser;
     face([point(u0,v0,y1),point(u1,v0,y1),point(u1,v1,y1),point(u0,v1,y1)],TREAD,[0,1,0]);
     face([point(u0,v0,y0),point(u1,v0,y0),point(u1,v0,y1),point(u0,v0,y1)],SOFFIT,f.n.map(v=>-v));
    }
    for(const u of [u0,u1]){
     beam(point(u,0,f.base+rail),point(u,1,f.base+f.height+rail),.055/M,STEEL);
     beam(point(u,0,f.base),point(u,0,f.base+rail),.055/M,STEEL);
    }
    stats.stairRuns++;stats.stairTreads+=steps;stepCount=steps;
   }else stats.stairRunsSkipped++;
  }else stats.stairRunsSkipped++;
  const triangles=(mesh.i.length-itemStart)/3;
  if(triangles){stats.standsDetailed++;stats.standAnchors.push({sourceIndex:f.index,name:f.name,
   sourceRoof:f.roof.map(p=>p.slice()),sourceBase:f.base,sourceSeatingTop:f.base+f.height,
   triangles,vertexStart:begin,vertexEnd:mesh.nv,stairSide,stairTreads:stepCount});}
 }
 stats.standTriangles=(mesh.i.length-sectionStart)/3;stats.triangles=(mesh.i.length-start)/3;
 return pit;
};
G.addPhotoStructures792=G.addScenery794;
})();
