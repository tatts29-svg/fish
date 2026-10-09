/* Author: Andrew Fisher.
 * 20701/20702 show open steel framing, occupied deck depth and pale shallow roofs.
 * Structural character only: every anchor and maximum height remains nominal.
 * Original shell buffers and camera-obstruction metadata are retained intact.
 */
(function(){
'use strict';
const G=window.GC3D;if(!G||G.addOpenPit794)return;
const M=G.M_PER_PT||6,BUDGET=14000,
 PALE=[.76,.77,.72,.82],DECK=[.49,.52,.51,.87],STEEL=[.36,.41,.43,.54],
 SHADE=[.16,.19,.20,.89],RAIL=[.46,.52,.53,.51];
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),
 cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
 norm=a=>{const l=Math.hypot(...a);return l>1e-10?a.map(v=>v/l):null;};

// Ownership is recorded by the original emitter, never inferred from proximity.
// These views reuse its buffers. Source CPU arrays and counts are not overwritten.
G.preparePitShell794=function(S){
 if(!S||!S.bMesh||!S.bEdges||!S.pitShellRanges794)return null;
 if(S.pitShell794&&S.pitShell794.mesh===S.bMesh)return S.pitShell794;
 const mesh=S.bMesh,edges=S.bEdges,ranges=S.pitShellRanges794,
       allIndices=new Uint32Array(mesh.i),allEdges=edges.data.slice(0,edges.n*17),
       meshDraw=mesh.draw,edgeDraw=edges.draw;
 if(typeof meshDraw!=='function'||typeof edgeDraw!=='function')return null;
 const state=S.pitShell794={mesh,edges,ranges,allIndices,allEdges,active:false,
  filteredIndices:null,filteredEdges:null,sourceIds:null,uploads:0,transitions:0,
  newGPUResources:0,sourceIndexCount:mesh.ni,sourceEdgeCount:edges.n};
 mesh.draw=function(){
  if(!state.active)return meshDraw.apply(this,arguments);
  const gl=this.gl;gl.bindVertexArray(this.vao);
  gl.drawElements(gl.TRIANGLES,state.filteredIndices.length,gl.UNSIGNED_INT,0);
 };
 edges.draw=function(){
  if(!state.active)return edgeDraw.apply(this,arguments);
  const gl=this.gl;gl.bindVertexArray(this.vao);
  gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,4,state.filteredEdges.length/17);
 };
 return state;
};
G.syncPitShell794=function(S){
 const state=S&&S.pitShell794;if(!state||S.lost)return false;
 const on=!!(S.detail781Enabled&&S.trackDetail781&&S.trackDetail781.stats.openPit794&&state.filteredIndices);
 if(state.active===on)return on;
 const gl=S.gl;gl.bindVertexArray(state.mesh.vao);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,state.mesh.ib);
 gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,on?state.filteredIndices:state.allIndices,gl.STATIC_DRAW);
 gl.bindVertexArray(null);gl.bindBuffer(gl.ARRAY_BUFFER,state.edges.buf);
 gl.bufferSubData(gl.ARRAY_BUFFER,0,on?state.filteredEdges:state.allEdges);
 state.active=on;state.uploads+=2;state.transitions++;
 S.architecture781NominalShown=!on;
 if(S.sunShadow)S.sunShadow.source=null;
 return on;
};
const setBuildings=G.setBuildings;
G.setBuildings=function(){const result=setBuildings.apply(this,arguments);G.preparePitShell794(G.S);return result;};
const install=G.installTrackDetail781,dispose=G.disposeTrackDetail781;
if(install)G.installTrackDetail781=function(S){const result=install.apply(this,arguments);G.syncPitShell794(S||G.S);return result;};
if(dispose)G.disposeTrackDetail781=function(S){const result=dispose.apply(this,arguments);G.syncPitShell794(S||G.S);return result;};

G.addOpenPit794=function(S,D,anchors){
 const state=G.preparePitShell794(S),source=S.architecture781Source||[];
 if(!state||!D||!D.mesh||!D.stats||!anchors||!anchors.length)return false;
 if(D.stats.openPit794)return true;
 const frames=[],ids=new Set(),ranges=state.ranges;
 for(const anchor of anchors){
  const b=source[anchor.sourceIndex];if(!b||!b.pit||ids.has(anchor.sourceIndex))return false;
  const P=b.p.map(S.toWorld);if(P.length===5&&Math.hypot(P[0][0]-P[4][0],P[0][1]-P[4][1])<1e-8)P.pop();
  if(P.length!==4||P.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)))return false;
  const area=P.reduce((s,p,i)=>s+p[0]*P[(i+1)%4][1]-p[1]*P[(i+1)%4][0],0),sign=area>0?1:-1;
  if(Math.abs(area)<1e-8||P.some((p,i)=>{
   const a=P[(i+1)%4],b=P[(i+2)%4];return ((a[0]-p[0])*(b[1]-a[1])-(a[1]-p[1])*(b[0]-a[0]))*sign<=1e-9;
  }))return false;
  const edge=anchor.frontageEdge,Q=[0,1,2,3].map(i=>P[(edge+i)%4]),
        width=Math.min(Math.hypot(...sub(Q[1],Q[0])),Math.hypot(...sub(Q[2],Q[3]))),
        depth=Math.min(Math.hypot(...sub(Q[3],Q[0])),Math.hypot(...sub(Q[2],Q[1]))),
        lo=Math.max(b.y0||0,S.tune&&S.tune.deckH||0),top=b.h;
  if(!Number.isFinite(top)||(top-lo)*M<3.5||width*M<3||depth*M<3)return false;
  const roof=ranges.mesh.filter(r=>r.sourceIndex===anchor.sourceIndex&&r.kind==='roof'),
        walls=ranges.mesh.filter(r=>r.sourceIndex===anchor.sourceIndex&&r.kind==='wall'),
        lines=ranges.edges.filter(r=>r.sourceIndex===anchor.sourceIndex);
  // Require complete original nominal shells; anomalous/coincident source data
  // retains its original appearance instead of risking holes in a city building.
  if(roof.length!==1||roof[0].end-roof[0].start!==6||walls.length!==4||
     walls.some(r=>r.end-r.start!==6)||lines.length!==1||lines[0].end<=lines[0].start)return false;
  ids.add(anchor.sourceIndex);frames.push({anchor,Q,width,depth,lo,top});
 }
 const mesh=D.mesh,start=mesh.i.length,uv=D.atlas&&D.atlas.white||[.5,.5],
       temporary={v:[],i:[],nv:0,vert(...p){this.v.push(...p);return this.nv++;},tri(...p){this.i.push(...p);}};
 let moduleStart=0;const allowance=Math.floor(BUDGET/frames.length/2)*2;
 const face=(q,c,out)=>{
  let n=norm(cross(sub(q[1],q[0]),sub(q[2],q[0])));if(!n)throw Error('Degenerate pit structure');
  if(out&&dot(n,out)<0){q=q.slice().reverse();n=n.map(v=>-v);}
  const first=temporary.nv;q.forEach(p=>temporary.vert(...p,...n,...uv,...c));
  temporary.tri(first,first+1,first+2);temporary.tri(first,first+2,first+3);
 };
 const solid=(p,c)=>{
  const mid=[0,1,2].map(k=>p.reduce((s,v)=>s+v[k],0)/8);
  for(const ix of [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]]){
   const q=ix.map(i=>p[i]),out=[0,1,2].map(k=>q.reduce((s,v)=>s+v[k],0)/4-mid[k]);
   face(q,c,out);
  }
 };
 const beam=(a,b,w,c)=>{
  const axis=norm(sub(b,a)),x=norm(cross(axis,Math.abs(axis[1])>.85?[1,0,0]:[0,1,0])),y=cross(axis,x),r=w/2,
        ring=p=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>p.map((z,k)=>z+(x[k]*u+y[k]*v)*r));
  solid(ring(a).concat(ring(b)),c);
 };
 const stats={version:'v7.94',modules:0,triangles:0,triangleBudget:BUDGET,
  genuineOpenBays:true,opaqueFacadePanels:0,sourceRowsUnchanged:true,sourceFootprintsUnchanged:true,
  sourceTopHeightsUnchanged:true,cameraObstructionUnchanged:true,originalArraysRetained:true,
  newGPUResources:0,newDrawCalls:0,perFrameGeometryWork:0,bufferUploadsPerTransition:2,
  decks:0,roofSlopes:0,steelColumns:0,joists:0,rails:0,braces:0,anchors:[]};
 try{
  for(const f of frames){
   moduleStart=temporary.i.length;const begin=temporary.nv,{Q,lo,top,width,depth}=f,
    at=(u,v,y)=>[(1-v)*((1-u)*Q[0][0]+u*Q[1][0])+v*((1-u)*Q[3][0]+u*Q[2][0]),y,
                (1-v)*((1-u)*Q[0][1]+u*Q[1][1])+v*((1-u)*Q[3][1]+u*Q[2][1])],
    box=(u0,u1,v0,v1,y0,y1,c)=>solid([at(u0,v0,y0),at(u1,v0,y0),at(u1,v1,y0),at(u0,v1,y0),
                                    at(u0,v0,y1),at(u1,v0,y1),at(u1,v1,y1),at(u0,v1,y1)],c),
    iu=.19/M/width,iv=.19/M/depth,ground=lo+.04/M,mid=ground+(top-ground)*.49,eave=top-.46/M,
    postTop=eave-.12/M;
   // Closed thin floor volumes expose a real underside; there are no facade fills.
   box(0,1,0,1,ground,ground+.10/M,DECK);
   box(0,1,0,1,mid-.18/M,mid,DECK);stats.decks+=2;
   // Shallow paired roof slopes remain entirely beneath the unchanged source top.
   for(const [v0,v1,y0,y1]of [[0,.5,eave,top],[.5,1,top,eave]]){
    solid([at(0,v0,y0-.12/M),at(1,v0,y0-.12/M),at(1,v1,y1-.12/M),at(0,v1,y1-.12/M),
           at(0,v0,y0),at(1,v0,y0),at(1,v1,y1),at(0,v1,y1)],PALE);stats.roofSlopes++;
   }
   const us=[iu,1/3,2/3,1-iu],vs=[iv,1-iv];
   for(const u of us)for(const v of vs){beam(at(u,v,ground+.10/M),at(u,v,postTop),.13/M,STEEL);stats.steelColumns++;}
   for(const u of us){
    for(const y of [mid-.25/M,eave-.18/M]){beam(at(u,iv,y),at(u,1-iv,y),.15/M,STEEL);stats.joists++;}
   }
   // Upper guardrails, connected to full-height posts, leave open air behind them.
   for(const y of [mid+.53/M,mid+1.04/M]){
    for(const v of vs){beam(at(iu,v,y),at(1-iu,v,y),.055/M,RAIL);stats.rails++;}
    for(const u of [iu,1-iu]){beam(at(u,iv,y),at(u,1-iv,y),.055/M,RAIL);stats.rails++;}
   }
   for(const v of vs){
    for(const [u0,u1]of [[iu,1/3],[2/3,1-iu]]){
     beam(at(u0,v,mid+.12/M),at(u1,v,postTop-.12/M),.06/M,STEEL);stats.braces++;
    }
   }
   for(const u of [iu,1-iu]){
    beam(at(u,iv,mid+.12/M),at(u,1-iv,postTop-.12/M),.06/M,STEEL);
    beam(at(u,1-iv,mid+.12/M),at(u,iv,postTop-.12/M),.06/M,STEEL);stats.braces+=2;
   }
   // Small recessed lower service partition gives depth without closing a bay.
   box(.40,.60,.79,.805,ground+.10/M,mid-.30/M,SHADE);
   const triangles=(temporary.i.length-moduleStart)/3;
   if(triangles>allowance)throw Error('Pit module budget');
   stats.modules++;stats.anchors.push({...f.anchor,triangles,vertexStart:mesh.nv+begin,vertexEnd:mesh.nv+temporary.nv,
    sourceBase:lo,sourceTop:top,openLowerStorey:true,openUpperStorey:true});
  }
  if(temporary.i.length/3>BUDGET||!temporary.v.every(Number.isFinite))throw Error('Pit geometry budget');
 }catch(error){D.stats.openPit794Fallback=String(error.message||error);return false;}
 // Prepare a byte-identical subsequence of only the original non-pit indices.
 const filter=(array,ranges,stride)=>{
  const keep=[],removed=new Uint8Array(array.length/stride);
  for(const r of ranges)if(ids.has(r.sourceIndex))for(let i=r.start;i<r.end;i++)removed[i]=1;
  for(let i=0;i<removed.length;i++)if(!removed[i])for(let k=0;k<stride;k++)keep.push(array[i*stride+k]);
  return keep;
 };
 state.filteredIndices=new Uint32Array(filter(state.allIndices,ranges.mesh,1));
 state.filteredEdges=new Float32Array(filter(state.allEdges,ranges.edges,17));state.sourceIds=Array.from(ids);
 stats.suppressedShellTriangles=(state.allIndices.length-state.filteredIndices.length)/3;
 stats.suppressedEdgeSegments=(state.allEdges.length-state.filteredEdges.length)/17;
 const base=mesh.nv;
 for(let i=0;i<temporary.v.length;i+=12)mesh.vert(...temporary.v.slice(i,i+12));
 for(let i=0;i<temporary.i.length;i+=3)mesh.tri(base+temporary.i[i],base+temporary.i[i+1],base+temporary.i[i+2]);
 stats.triangles=(mesh.i.length-start)/3;D.stats.openPit794=stats;
 const pit=D.stats.photoStructures,scenery=D.stats.scenery794;
 Object.assign(pit,{modules:stats.modules,triangles:stats.triangles,anchors:stats.anchors,
  limits:'Open two-storey structural typology inside unchanged nominal envelopes; not surveyed construction',
  maxFacadeReliefM:0,genuineOpenBays:true,originalShellRenderSuppressed:true,uniformModuleTriangleAllowance:allowance});
 Object.assign(scenery,{pitModules:stats.modules,pitFacades:0,pitOpenBayPanels:0,pitSteelPosts:stats.steelColumns,
  pitDeckBands:stats.decks,pitRails:stats.rails,pitAnchors:stats.anchors,maximumPitReliefM:0,genuineOpenBays:true});
 return true;
};
})();
